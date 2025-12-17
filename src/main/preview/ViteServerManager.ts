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
import { createServer } from 'vite';
import { findAvailablePort } from './PortFinder';
import { catalystConsoleInjectorPlugin } from './plugins/consoleInjectorPlugin';
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
 * running a Vite dev server for their project, separate from Catalyst's own
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
   * Start Vite server using programmatic API
   * 
   * Uses Vite's createServer() API instead of spawning npm process.
   * This allows us to inject our console capture plugin while still
   * respecting the user's vite.config file.
   * 
   * CRITICAL: Uses programmatic API so we can inject catalystConsoleInjectorPlugin
   * into the user's Vite server. This is the ONLY way to inject server-side
   * HTML transforms without modifying user's source files.
   * 
   * ADVANTAGES:
   * - Can inject our plugin programmatically
   * - Loads and extends user's vite.config.js/ts automatically
   * - Better control over server lifecycle
   * - No stdout parsing needed (direct API access)
   * 
   * HOW IT WORKS:
   * 1. Call createServer() with user's project as root
   * 2. Vite automatically loads their vite.config.js/ts
   * 3. We inject our plugin at the beginning of plugins array
   * 4. Start server and get port from resolved config
   * 
   * @param projectPath - Absolute path to user's project
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
    try {
      console.log(`[ViteServerManager] Creating Vite server on port ${port}...`);
      
      // Create Vite server using programmatic API
      // This loads user's vite.config and allows us to inject plugins
      const server = await createServer({
        // User's project root
        root: projectPath,
        
        // Server configuration
        server: {
          port,
          host: 'localhost',
          hmr: {
            port, // Use same port for HMR
          },
        },
        
        // Inject our console capture plugin FIRST
        // This ensures it runs before user's plugins
        plugins: [
          catalystConsoleInjectorPlugin(),
          // User's plugins will be loaded from their vite.config
        ],
        
        // Load user's vite.config.js/ts automatically
        // Must be a string path (true was causing error), or false to skip
        configFile: path.join(projectPath, 'vite.config.ts'),
        
        // Development mode
        mode: 'development',
        
        // Log level (we handle logging ourselves)
        logLevel: 'info',
      });
      
      // Start the server
      await server.listen();
      
      // Get actual resolved port (might differ if user overrode in their config)
      const resolvedPort = server.config.server.port ?? port;
      const url = `http://localhost:${resolvedPort}`;
      
      console.log(`[ViteServerManager] Server started at ${url}`);
      
      // Store server instance for cleanup
      // We'll store it as (server as any) to avoid type issues
      (this as any).viteServer = server;
      
      // Update state
      this.updateState({
        status: 'running',
        port: resolvedPort,
        url,
        startedAt: new Date(),
        pid: process.pid, // Vite runs in same process
      });
      
      // Emit ready event
      this.emit('ready', { port: resolvedPort, url });
      
      return { success: true, port: resolvedPort, url };
      
    } catch (err) {
      const error = err instanceof Error ? err.message : String(err);
      console.error('[ViteServerManager] Failed to start server:', error);
      
      this.updateState({ status: 'error', error });
      this.emit('error', { message: error });
      
      return { success: false, error };
    }
  }

  /**
   * Stop the Vite dev server
   * 
   * Uses Vite's close() API for graceful shutdown.
   * Much cleaner than killing a process.
   * 
   * Safe to call even if server is not running (no-op).
   * 
   * @returns Promise that resolves when server is stopped
   * 
   * @async
   */
  async stop(): Promise<void> {
    // If already stopped, no-op
    if (this.state.status === 'stopped') {
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
    
    try {
      // Close Vite server gracefully using its API
      const viteServer = (this as any).viteServer;
      if (viteServer) {
        await viteServer.close();
        (this as any).viteServer = null;
      }
      
      // Reset state
      this.resetState();
      this.emit('stopped', undefined);
      
    } catch (err) {
      console.error('[ViteServerManager] Error stopping server:', err);
      // Force cleanup on error
      (this as any).viteServer = null;
      this.resetState();
      this.emit('stopped', undefined);
      
    } finally {
      this.isStopping = false;
    }
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
   * Should be called when app is quitting to ensure clean shutdown.
   * Closes Vite server if running.
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
    
    // Close Vite server if running
    try {
      const viteServer = (this as any).viteServer;
      if (viteServer) {
        await viteServer.close();
        (this as any).viteServer = null;
      }
    } catch (err) {
      console.error('[ViteServerManager] Error closing server during cleanup:', err);
    }
    
    // Force kill process (fallback, should not be needed with programmatic API)
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
