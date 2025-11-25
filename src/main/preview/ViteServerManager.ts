/**
 * @file ViteServerManager.ts
 * @description Manages Vite dev server lifecycle for user projects
 * 
 * CENTRAL MANAGER for the preview system that handles:
 * - Starting Vite dev server as child process
 * - Detecting when server is ready (parsing stdout)
 * - Graceful shutdown with fallback to SIGKILL
 * - Port allocation via PortFinder
 * - Event emission for IPC communication
 * - Process cleanup on app quit
 * 
 * THREAD SAFETY:
 * Only one server can run at a time. Starting a new server
 * will stop any existing server first.
 * 
 * SECURITY:
 * - Only runs Vite from validated project directories
 * - No shell: true (prevents command injection)
 * - Environment variables sanitized
 * 
 * @architecture Phase 1, Task 1.4A - Preview Renderer
 * @created 2025-11-25
 * @author AI (Cline) + Human Review
 * @confidence 8/10 - Complex process management, needs real-world testing
 * 
 * @see .implementation/phase-1-application-shell/task-1.4-preview-renderer.md
 * @see docs/SECURITY_SPEC.md - Process security requirements
 * 
 * @security-critical true - Spawns child processes
 * @performance-critical false - Operations are infrequent
 */

import { spawn, ChildProcess } from 'child_process';
import { EventEmitter } from 'events';
import * as path from 'path';
import * as fs from 'fs/promises';
import { findAvailablePort } from './PortFinder';
import {
  ViteServerState,
  ViteServerStatus,
  ViteServerConfig,
  ViteStartResult,
  ViteServerEvents,
  PORT_CONFIG,
  SERVER_TIMEOUTS,
} from './types';

/**
 * Type-safe event emitter for Vite server events
 * 
 * @interface TypedEventEmitter
 */
interface TypedEventEmitter {
  on<K extends keyof ViteServerEvents>(
    event: K,
    listener: (data: ViteServerEvents[K]) => void
  ): this;
  
  emit<K extends keyof ViteServerEvents>(
    event: K,
    data: ViteServerEvents[K]
  ): boolean;
  
  off<K extends keyof ViteServerEvents>(
    event: K,
    listener: (data: ViteServerEvents[K]) => void
  ): this;
  
  removeAllListeners<K extends keyof ViteServerEvents>(event?: K): this;
}

/**
 * ViteServerManager - Manages Vite dev server lifecycle
 * 
 * PROBLEM SOLVED:
 * Users need to preview their React projects in real-time. This requires
 * running a Vite dev server for their project, separate from Rise's own
 * Vite server. The manager handles all the complexity of process spawning,
 * port allocation, ready detection, and cleanup.
 * 
 * SOLUTION:
 * Single manager class that:
 * 1. Spawns Vite as a child process
 * 2. Parses stdout to detect when server is ready
 * 3. Emits events for UI updates
 * 4. Handles graceful shutdown
 * 5. Cleans up on app quit
 * 
 * DESIGN DECISIONS:
 * - Singleton per app (one server at a time)
 * - Uses spawn instead of exec (no shell injection risk)
 * - Parses Vite output for ready detection (no polling)
 * - SIGTERM first, SIGKILL fallback (graceful shutdown)
 * - Events for loose coupling with IPC layer
 * 
 * USAGE EXAMPLE:
 * ```typescript
 * const manager = new ViteServerManager();
 * 
 * manager.on('ready', ({ port, url }) => {
 *   console.log('Preview available at:', url);
 * });
 * 
 * manager.on('error', ({ message }) => {
 *   console.error('Preview error:', message);
 * });
 * 
 * await manager.start({ projectPath: '/path/to/project' });
 * 
 * // Later...
 * await manager.stop();
 * ```
 * 
 * @class ViteServerManager
 */
export class ViteServerManager extends EventEmitter implements TypedEventEmitter {
  // Current Vite process (null if not running)
  private process: ChildProcess | null = null;
  
  // Current server state
  private state: ViteServerState = this.createInitialState();
  
  // Timeout for startup detection
  private startupTimeoutId: NodeJS.Timeout | null = null;
  
  // Buffer for stdout parsing (Vite output can be chunked)
  private stdoutBuffer: string = '';
  
  // Flag to prevent race conditions during stop
  private isStopping: boolean = false;

  /**
   * Create initial (stopped) server state
   * 
   * @returns Fresh ViteServerState with all null values
   * @private
   */
  private createInitialState(): ViteServerState {
    return {
      status: 'stopped',
      port: null,
      url: null,
      error: null,
      projectPath: null,
      pid: null,
      startedAt: null,
    };
  }

  /**
   * Get current server state
   * 
   * Returns a copy of the state to prevent external mutation.
   * 
   * @returns Current ViteServerState
   */
  getState(): ViteServerState {
    return { ...this.state };
  }

  /**
   * Check if server is currently running
   * 
   * @returns true if status is 'running'
   */
  isRunning(): boolean {
    return this.state.status === 'running';
  }

  /**
   * Get current port number
   * 
   * @returns Port number or null if not running
   */
  getPort(): number | null {
    return this.state.port;
  }

  /**
   * Get current preview URL
   * 
   * @returns URL string or null if not running
   */
  getUrl(): string | null {
    return this.state.url;
  }

  /**
   * Start Vite dev server for a project
   * 
   * WORKFLOW:
   * 1. Validate project path
   * 2. Check for package.json and node_modules
   * 3. Find available port
   * 4. Spawn `npm run dev` process
   * 5. Parse stdout for ready message
   * 6. Emit 'ready' event with port/url
   * 
   * If a server is already running, it will be stopped first.
   * 
   * @param config - Server configuration
   * @returns Promise with start result
   * 
   * @example
   * ```typescript
   * const result = await manager.start({
   *   projectPath: '/Users/richard/projects/my-app',
   *   preferredPort: 3001,
   * });
   * 
   * if (result.success) {
   *   console.log('Server running at:', result.url);
   * } else {
   *   console.error('Failed:', result.error);
   * }
   * ```
   * 
   * @async
   */
  async start(config: ViteServerConfig): Promise<ViteStartResult> {
    const { projectPath } = config;
    
    console.log('[ViteServerManager] Starting server for:', projectPath);
    
    try {
      // Stop any existing server first
      if (this.process || this.state.status !== 'stopped') {
        console.log('[ViteServerManager] Stopping existing server...');
        await this.stop();
      }
      
      // Validate project path exists
      const pathExists = await this.validateProjectPath(projectPath);
      if (!pathExists) {
        const error = `Project path does not exist: ${projectPath}`;
        this.updateState({ status: 'error', error });
        return { success: false, error };
      }
      
      // Check for package.json
      const hasPackageJson = await this.checkFile(
        path.join(projectPath, 'package.json')
      );
      if (!hasPackageJson) {
        const error = 'No package.json found in project directory';
        this.updateState({ status: 'error', error });
        return { success: false, error };
      }
      
      // Check for node_modules (dependencies installed)
      const hasNodeModules = await this.checkDirectory(
        path.join(projectPath, 'node_modules')
      );
      if (!hasNodeModules) {
        const error = 'Dependencies not installed. Run npm install first.';
        this.updateState({ status: 'error', error });
        return { success: false, error };
      }
      
      // Find available port
      const preferredPort = config.preferredPort ?? PORT_CONFIG.PREFERRED_PORT;
      const minPort = config.minPort ?? PORT_CONFIG.MIN_PORT;
      const maxPort = config.maxPort ?? PORT_CONFIG.MAX_PORT;
      
      let port: number;
      try {
        port = await findAvailablePort({
          startPort: preferredPort,
          minPort,
          maxPort,
        });
      } catch (err) {
        const error = `Could not find available port: ${err instanceof Error ? err.message : String(err)}`;
        this.updateState({ status: 'error', error });
        return { success: false, error };
      }
      
      // Update state to starting
      this.updateState({
        status: 'starting',
        projectPath,
        port: null,
        url: null,
        error: null,
      });
      
      // Spawn Vite dev server
      // Use npm run dev which runs the project's vite command
      const result = await this.spawnViteProcess(projectPath, port, config);
      
      return result;
      
    } catch (err) {
      const error = err instanceof Error ? err.message : String(err);
      console.error('[ViteServerManager] Start failed:', error);
      
      this.updateState({ status: 'error', error });
      return { success: false, error };
    }
  }

  /**
   * Spawn the Vite child process
   * 
   * Creates a child process running `npm run dev` with the specified port.
   * Sets up event handlers for stdout/stderr/exit.
   * Returns a promise that resolves when server is ready or rejects on error.
   * 
   * @param projectPath - Absolute path to project
   * @param port - Port to run Vite on
   * @param config - Full configuration
   * @returns Promise with start result
   * 
   * @private
   * @async
   */
  private async spawnViteProcess(
    projectPath: string,
    port: number,
    config: ViteServerConfig
  ): Promise<ViteStartResult> {
    return new Promise((resolve) => {
      console.log(`[ViteServerManager] Spawning Vite on port ${port}...`);
      
      // Clear stdout buffer
      this.stdoutBuffer = '';
      
      // Determine npm command based on platform
      // On Windows, npm is actually npm.cmd
      const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';
      
      // Spawn npm run dev with port override
      // Vite respects the PORT env variable and --port argument
      this.process = spawn(npmCommand, ['run', 'dev', '--', '--port', String(port)], {
        cwd: projectPath,
        // IMPORTANT: shell: false prevents command injection
        shell: false,
        // Pass minimal environment variables
        env: {
          ...process.env,
          // Force port (some Vite configs override)
          PORT: String(port),
          // Disable color output for easier parsing
          FORCE_COLOR: '0',
          NO_COLOR: '1',
        },
        // Pipe stdio for capture
        stdio: ['pipe', 'pipe', 'pipe'],
      });
      
      const pid = this.process.pid ?? null;
      console.log(`[ViteServerManager] Process spawned with PID: ${pid}`);
      
      // Update state with PID
      this.updateState({ pid });
      
      // Track if we've resolved the promise
      let hasResolved = false;
      
      // Set startup timeout
      const startupTimeout = config.startupTimeout ?? SERVER_TIMEOUTS.STARTUP;
      this.startupTimeoutId = setTimeout(() => {
        if (!hasResolved && this.state.status === 'starting') {
          hasResolved = true;
          
          const error = `Server startup timed out after ${startupTimeout}ms`;
          console.error('[ViteServerManager]', error);
          
          // Kill the process
          this.killProcess();
          
          this.updateState({ status: 'error', error });
          resolve({ success: false, error });
        }
      }, startupTimeout);
      
      // Handle stdout
      this.process.stdout?.on('data', (data: Buffer) => {
        const output = data.toString();
        this.stdoutBuffer += output;
        
        // Emit output event for logging
        this.emit('output', { line: output.trim(), type: 'stdout' });
        
        // Check if server is ready
        // Vite outputs something like:
        // "  ➜  Local:   http://localhost:3001/"
        // "VITE v5.0.0  ready in 500 ms"
        const readyMatch = this.stdoutBuffer.match(
          /Local:\s+http:\/\/localhost:(\d+)/
        );
        
        if (readyMatch && !hasResolved) {
          hasResolved = true;
          
          // Clear timeout
          if (this.startupTimeoutId) {
            clearTimeout(this.startupTimeoutId);
            this.startupTimeoutId = null;
          }
          
          const detectedPort = parseInt(readyMatch[1], 10);
          const url = `http://localhost:${detectedPort}`;
          
          console.log(`[ViteServerManager] Server ready at ${url}`);
          
          this.updateState({
            status: 'running',
            port: detectedPort,
            url,
            startedAt: new Date(),
          });
          
          // Emit ready event
          this.emit('ready', { port: detectedPort, url });
          
          resolve({ success: true, port: detectedPort, url });
        }
      });
      
      // Handle stderr
      this.process.stderr?.on('data', (data: Buffer) => {
        const output = data.toString();
        
        // Emit output event
        this.emit('output', { line: output.trim(), type: 'stderr' });
        
        // Check for common errors
        if (output.includes('EADDRINUSE')) {
          // Port conflict (shouldn't happen with PortFinder, but just in case)
          if (!hasResolved) {
            hasResolved = true;
            
            if (this.startupTimeoutId) {
              clearTimeout(this.startupTimeoutId);
              this.startupTimeoutId = null;
            }
            
            const error = `Port ${port} is already in use`;
            this.updateState({ status: 'error', error });
            this.emit('error', { message: error, code: 'EADDRINUSE' });
            resolve({ success: false, error });
          }
        }
      });
      
      // Handle process exit
      this.process.on('exit', (code, signal) => {
        console.log(`[ViteServerManager] Process exited with code ${code}, signal ${signal}`);
        
        // Clear timeout
        if (this.startupTimeoutId) {
          clearTimeout(this.startupTimeoutId);
          this.startupTimeoutId = null;
        }
        
        // Clean up process reference
        this.process = null;
        
        // If we haven't resolved yet, it's an error
        if (!hasResolved) {
          hasResolved = true;
          
          const error = `Server exited unexpectedly (code: ${code}, signal: ${signal})`;
          this.updateState({ status: 'error', error, pid: null });
          this.emit('error', { message: error, code: String(code) });
          resolve({ success: false, error });
        } else if (this.state.status === 'running' && !this.isStopping) {
          // Server crashed while running
          const error = `Server crashed (code: ${code}, signal: ${signal})`;
          this.updateState({ status: 'error', error, pid: null });
          this.emit('error', { message: error, code: String(code) });
        } else if (this.isStopping) {
          // Expected exit during stop
          this.updateState({ status: 'stopped', pid: null });
          this.emit('stopped', undefined);
        }
      });
      
      // Handle spawn errors
      this.process.on('error', (err) => {
        console.error('[ViteServerManager] Process error:', err);
        
        if (this.startupTimeoutId) {
          clearTimeout(this.startupTimeoutId);
          this.startupTimeoutId = null;
        }
        
        if (!hasResolved) {
          hasResolved = true;
          
          const error = `Failed to start server: ${err.message}`;
          this.updateState({ status: 'error', error, pid: null });
          this.emit('error', { message: error });
          resolve({ success: false, error });
        }
      });
    });
  }

  /**
   * Stop the Vite dev server
   * 
   * Attempts graceful shutdown with SIGTERM, then falls back to SIGKILL
   * if process doesn't exit within timeout.
   * 
   * Safe to call even if server is not running (no-op).
   * 
   * @returns Promise that resolves when server is stopped
   * 
   * @async
   */
  async stop(): Promise<void> {
    // If already stopped or stopping, no-op
    if (!this.process && this.state.status === 'stopped') {
      console.log('[ViteServerManager] Server already stopped');
      return;
    }
    
    if (this.isStopping) {
      console.log('[ViteServerManager] Already stopping...');
      // Wait for stop to complete
      return new Promise((resolve) => {
        this.once('stopped', () => resolve());
      });
    }
    
    console.log('[ViteServerManager] Stopping server...');
    this.isStopping = true;
    
    // Clear startup timeout if pending
    if (this.startupTimeoutId) {
      clearTimeout(this.startupTimeoutId);
      this.startupTimeoutId = null;
    }
    
    // Update state
    this.updateState({ status: 'stopping' });
    
    // If no process, just reset state
    if (!this.process) {
      this.resetState();
      this.isStopping = false;
      return;
    }
    
    // Store reference before potential null
    const proc = this.process;
    
    return new Promise((resolve) => {
      // Set up kill timeout for SIGKILL fallback
      const killTimeoutId = setTimeout(() => {
        console.log('[ViteServerManager] Graceful shutdown timed out, sending SIGKILL...');
        this.killProcess();
      }, SERVER_TIMEOUTS.GRACEFUL_SHUTDOWN);
      
      // Listen for exit
      const onExit = () => {
        clearTimeout(killTimeoutId);
        this.resetState();
        this.isStopping = false;
        resolve();
      };
      
      // One-time listener for exit
      proc.once('exit', onExit);
      
      // Send SIGTERM for graceful shutdown
      console.log('[ViteServerManager] Sending SIGTERM...');
      try {
        proc.kill('SIGTERM');
      } catch (err) {
        // Process might already be dead
        console.log('[ViteServerManager] Error sending SIGTERM:', err);
        clearTimeout(killTimeoutId);
        this.resetState();
        this.isStopping = false;
        resolve();
      }
    });
  }

  /**
   * Restart the Vite dev server
   * 
   * Stops the current server (if running) and starts a new one
   * with the same project path.
   * 
   * @returns Promise with start result
   * 
   * @throws {Error} If no project path is set
   * 
   * @async
   */
  async restart(): Promise<ViteStartResult> {
    const projectPath = this.state.projectPath;
    
    if (!projectPath) {
      return {
        success: false,
        error: 'No project path set. Use start() first.',
      };
    }
    
    console.log('[ViteServerManager] Restarting server...');
    
    // Stop current server
    await this.stop();
    
    // Start with same config
    return this.start({ projectPath });
  }

  /**
   * Force kill the process
   * 
   * Used when graceful shutdown fails or times out.
   * Sends SIGKILL which cannot be ignored.
   * 
   * @private
   */
  private killProcess(): void {
    if (this.process) {
      try {
        console.log('[ViteServerManager] Sending SIGKILL...');
        this.process.kill('SIGKILL');
      } catch (err) {
        console.log('[ViteServerManager] Error killing process:', err);
      }
      this.process = null;
    }
  }

  /**
   * Reset state to initial values
   * 
   * @private
   */
  private resetState(): void {
    this.process = null;
    this.state = this.createInitialState();
    this.stdoutBuffer = '';
    this.emit('stateChange', this.state);
  }

  /**
   * Update state and emit change event
   * 
   * @param updates - Partial state updates
   * 
   * @private
   */
  private updateState(updates: Partial<ViteServerState>): void {
    this.state = {
      ...this.state,
      ...updates,
    };
    
    this.emit('stateChange', this.state);
  }

  /**
   * Validate that project path exists and is a directory
   * 
   * @param projectPath - Path to validate
   * @returns true if valid directory
   * 
   * @private
   * @async
   */
  private async validateProjectPath(projectPath: string): Promise<boolean> {
    try {
      const stats = await fs.stat(projectPath);
      return stats.isDirectory();
    } catch {
      return false;
    }
  }

  /**
   * Check if a file exists
   * 
   * @param filePath - Path to file
   * @returns true if file exists
   * 
   * @private
   * @async
   */
  private async checkFile(filePath: string): Promise<boolean> {
    try {
      const stats = await fs.stat(filePath);
      return stats.isFile();
    } catch {
      return false;
    }
  }

  /**
   * Check if a directory exists
   * 
   * @param dirPath - Path to directory
   * @returns true if directory exists
   * 
   * @private
   * @async
   */
  private async checkDirectory(dirPath: string): Promise<boolean> {
    try {
      const stats = await fs.stat(dirPath);
      return stats.isDirectory();
    } catch {
      return false;
    }
  }

  /**
   * Clean up resources
   * 
   * Should be called when app is quitting to ensure no orphan processes.
   * Force kills any running server without waiting for graceful shutdown.
   * 
   * @async
   */
  async cleanup(): Promise<void> {
    console.log('[ViteServerManager] Cleaning up...');
    
    // Clear any timeouts
    if (this.startupTimeoutId) {
      clearTimeout(this.startupTimeoutId);
      this.startupTimeoutId = null;
    }
    
    // Force kill process
    this.killProcess();
    
    // Reset state
    this.resetState();
    
    // Remove all listeners
    this.removeAllListeners();
    
    console.log('[ViteServerManager] Cleanup complete');
  }
}

// Export singleton instance for use in IPC handlers
// This ensures only one server runs at a time
export const viteServerManager = new ViteServerManager();

// Export class for testing
export default ViteServerManager;
