/**
 * @file ViteServerManager.test.ts
 * @description Unit tests for ViteServerManager
 * 
 * Tests Vite server lifecycle management including:
 * - Starting and stopping servers
 * - State machine transitions
 * - Event emission
 * - Error handling
 * - Process cleanup
 * 
 * NOTE: These tests mock child_process and fs to avoid:
 * - Actually spawning Vite processes
 * - Requiring real project directories
 * - Network operations
 * 
 * Integration tests (separate file) should test real server behavior.
 * 
 * @architecture Phase 1, Task 1.4A - Preview Renderer
 * @created 2025-11-25
 * @author AI (Cline) + Human Review
 */

import { describe, it, expect, vi, beforeEach, afterEach, Mock } from 'vitest';
import { EventEmitter } from 'events';

// Mock child_process before importing ViteServerManager
vi.mock('child_process', () => ({
  spawn: vi.fn(),
}));

// Mock fs/promises
vi.mock('fs/promises', () => ({
  stat: vi.fn(),
}));

// Mock PortFinder
vi.mock('../../../src/main/preview/PortFinder', () => ({
  findAvailablePort: vi.fn().mockResolvedValue(3001),
}));

import { spawn } from 'child_process';
import * as fs from 'fs/promises';
import { ViteServerManager } from '../../../src/main/preview/ViteServerManager';
import { findAvailablePort } from '../../../src/main/preview/PortFinder';

/**
 * Create a mock child process that emulates Vite behavior
 * 
 * @param emitExitOnKill - Whether to emit 'exit' event when killed (default: true)
 */
function createMockProcess(emitExitOnKill: boolean = true) {
  const mockProcess = new EventEmitter() as EventEmitter & {
    pid: number;
    killed: boolean;
    kill: Mock;
    stdout: EventEmitter;
    stderr: EventEmitter;
  };
  
  mockProcess.pid = 12345;
  mockProcess.killed = false;
  mockProcess.kill = vi.fn((signal: string) => {
    mockProcess.killed = true;
    // Emit exit event after a short delay (only if configured)
    if (emitExitOnKill) {
      setTimeout(() => {
        mockProcess.emit('exit', 0, signal);
      }, 10);
    }
    return true;
  });
  
  mockProcess.stdout = new EventEmitter();
  mockProcess.stderr = new EventEmitter();
  
  return mockProcess;
}

/**
 * Mock fs.stat to simulate file/directory existence
 */
function mockFileSystem(options: {
  projectExists?: boolean;
  packageJsonExists?: boolean;
  nodeModulesExists?: boolean;
}) {
  const {
    projectExists = true,
    packageJsonExists = true,
    nodeModulesExists = true,
  } = options;
  
  (fs.stat as Mock).mockImplementation(async (path: string) => {
    if (path.endsWith('node_modules')) {
      if (!nodeModulesExists) throw new Error('ENOENT');
      return { isDirectory: () => true, isFile: () => false };
    }
    if (path.endsWith('package.json')) {
      if (!packageJsonExists) throw new Error('ENOENT');
      return { isDirectory: () => false, isFile: () => true };
    }
    // Project path
    if (!projectExists) throw new Error('ENOENT');
    return { isDirectory: () => true, isFile: () => false };
  });
}

describe('ViteServerManager', () => {
  let manager: ViteServerManager;
  let mockProcess: ReturnType<typeof createMockProcess>;
  
  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks();
    
    // Create fresh manager for each test
    manager = new ViteServerManager();
    
    // Create mock process
    mockProcess = createMockProcess();
    (spawn as Mock).mockReturnValue(mockProcess);
    
    // Default file system mock (everything exists)
    mockFileSystem({});
  });
  
  afterEach(async () => {
    // Add error handler to prevent unhandled error exceptions during cleanup
    manager.on('error', () => {});
    
    // Ensure cleanup
    await manager.cleanup();
  });
  
  describe('initial state', () => {
    it('should start with stopped status', () => {
      const state = manager.getState();
      expect(state.status).toBe('stopped');
    });
    
    it('should have null values initially', () => {
      const state = manager.getState();
      expect(state.port).toBeNull();
      expect(state.url).toBeNull();
      expect(state.error).toBeNull();
      expect(state.projectPath).toBeNull();
      expect(state.pid).toBeNull();
      expect(state.startedAt).toBeNull();
    });
    
    it('should not be running initially', () => {
      expect(manager.isRunning()).toBe(false);
    });
    
    it('should return null for port and url initially', () => {
      expect(manager.getPort()).toBeNull();
      expect(manager.getUrl()).toBeNull();
    });
  });
  
  describe('start', () => {
    it('should transition to starting state', async () => {
      const stateChanges: string[] = [];
      manager.on('stateChange', (state) => {
        stateChanges.push(state.status);
      });
      
      // Start the server (don't await yet)
      const startPromise = manager.start({ projectPath: '/test/project' });
      
      // Should have transitioned to starting
      expect(stateChanges).toContain('starting');
      
      // Simulate Vite ready output
      mockProcess.stdout.emit('data', Buffer.from('  ➜  Local:   http://localhost:3001/\n'));
      
      await startPromise;
    });
    
    it('should transition to running state when Vite outputs ready message', async () => {
      const startPromise = manager.start({ projectPath: '/test/project' });
      
      // Simulate Vite ready output
      mockProcess.stdout.emit('data', Buffer.from('  ➜  Local:   http://localhost:3001/\n'));
      
      const result = await startPromise;
      
      expect(result.success).toBe(true);
      expect(result.port).toBe(3001);
      expect(result.url).toBe('http://localhost:3001');
      expect(manager.isRunning()).toBe(true);
    });
    
    it('should emit ready event when server starts', async () => {
      const readyHandler = vi.fn();
      manager.on('ready', readyHandler);
      
      const startPromise = manager.start({ projectPath: '/test/project' });
      
      mockProcess.stdout.emit('data', Buffer.from('  Local:   http://localhost:3001/'));
      
      await startPromise;
      
      expect(readyHandler).toHaveBeenCalledWith({
        port: 3001,
        url: 'http://localhost:3001',
      });
    });
    
    it('should return error when project path does not exist', async () => {
      mockFileSystem({ projectExists: false });
      
      const result = await manager.start({ projectPath: '/nonexistent' });
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('does not exist');
      expect(manager.getState().status).toBe('error');
    });
    
    it('should return error when package.json does not exist', async () => {
      mockFileSystem({ packageJsonExists: false });
      
      const result = await manager.start({ projectPath: '/test/project' });
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('package.json');
      expect(manager.getState().status).toBe('error');
    });
    
    it('should return error when node_modules does not exist', async () => {
      mockFileSystem({ nodeModulesExists: false });
      
      const result = await manager.start({ projectPath: '/test/project' });
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Dependencies not installed');
      expect(manager.getState().status).toBe('error');
    });
    
    it('should spawn npm with correct arguments', async () => {
      const startPromise = manager.start({ projectPath: '/test/project' });
      
      // Immediately emit ready to complete the start
      mockProcess.stdout.emit('data', Buffer.from('Local: http://localhost:3001/'));
      
      await startPromise;
      
      expect(spawn).toHaveBeenCalledWith(
        expect.stringMatching(/^npm(\.cmd)?$/),
        ['run', 'dev', '--', '--port', '3001'],
        expect.objectContaining({
          cwd: '/test/project',
          shell: false,
        })
      );
    });
    
    it('should update state with PID', async () => {
      const startPromise = manager.start({ projectPath: '/test/project' });
      
      mockProcess.stdout.emit('data', Buffer.from('Local: http://localhost:3001/'));
      
      await startPromise;
      
      const state = manager.getState();
      expect(state.pid).toBe(12345);
    });
    
    it('should stop existing server before starting new one', async () => {
      // Start first server
      const startPromise1 = manager.start({ projectPath: '/test/project1' });
      mockProcess.stdout.emit('data', Buffer.from('Local: http://localhost:3001/'));
      await startPromise1;
      
      const firstProcess = mockProcess;
      
      // Create new mock process for second server
      mockProcess = createMockProcess();
      (spawn as Mock).mockReturnValue(mockProcess);
      
      // Start second server
      const startPromise2 = manager.start({ projectPath: '/test/project2' });
      
      // First process should have been killed
      expect(firstProcess.kill).toHaveBeenCalled();
      
      // Complete second startup
      mockProcess.stdout.emit('data', Buffer.from('Local: http://localhost:3002/'));
      await startPromise2;
    });
  });
  
  describe('stop', () => {
    beforeEach(async () => {
      // Start server first
      const startPromise = manager.start({ projectPath: '/test/project' });
      mockProcess.stdout.emit('data', Buffer.from('Local: http://localhost:3001/'));
      await startPromise;
    });
    
    it('should stop running server', async () => {
      await manager.stop();
      
      expect(mockProcess.kill).toHaveBeenCalledWith('SIGTERM');
      expect(manager.isRunning()).toBe(false);
      expect(manager.getState().status).toBe('stopped');
    });
    
    it('should emit stopped event', async () => {
      const stoppedHandler = vi.fn();
      manager.on('stopped', stoppedHandler);
      
      await manager.stop();
      
      // Wait for event emission
      await new Promise(resolve => setTimeout(resolve, 50));
      
      expect(stoppedHandler).toHaveBeenCalled();
    });
    
    it('should be safe to call when already stopped', async () => {
      await manager.stop();
      
      // Second stop should not throw
      await expect(manager.stop()).resolves.not.toThrow();
    });
    
    it('should reset state after stop', async () => {
      await manager.stop();
      
      const state = manager.getState();
      expect(state.port).toBeNull();
      expect(state.url).toBeNull();
      expect(state.pid).toBeNull();
      expect(state.projectPath).toBeNull();
    });
  });
  
  describe('restart', () => {
    beforeEach(async () => {
      // Start server first
      const startPromise = manager.start({ projectPath: '/test/project' });
      mockProcess.stdout.emit('data', Buffer.from('Local: http://localhost:3001/'));
      await startPromise;
    });
    
    it('should stop and start server', async () => {
      // Create new mock process for restart
      const oldProcess = mockProcess;
      mockProcess = createMockProcess();
      (spawn as Mock).mockReturnValue(mockProcess);
      
      const restartPromise = manager.restart();
      
      // Old process should be stopped
      expect(oldProcess.kill).toHaveBeenCalled();
      
      // Emit ready for new process
      await new Promise(resolve => setTimeout(resolve, 50));
      mockProcess.stdout.emit('data', Buffer.from('Local: http://localhost:3001/'));
      
      const result = await restartPromise;
      
      expect(result.success).toBe(true);
      expect(manager.isRunning()).toBe(true);
    });
    
    it('should fail if no project path is set', async () => {
      // Stop server and clear state
      await manager.stop();
      
      // Try to restart without project path
      const result = await manager.restart();
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('No project path');
    });
  });
  
  describe('events', () => {
    it('should emit output events for stdout', async () => {
      const outputHandler = vi.fn();
      manager.on('output', outputHandler);
      
      const startPromise = manager.start({ projectPath: '/test/project' });
      
      mockProcess.stdout.emit('data', Buffer.from('Some output line'));
      mockProcess.stdout.emit('data', Buffer.from('Local: http://localhost:3001/'));
      
      await startPromise;
      
      expect(outputHandler).toHaveBeenCalledWith({
        line: 'Some output line',
        type: 'stdout',
      });
    });
    
    it('should emit output events for stderr', async () => {
      const outputHandler = vi.fn();
      manager.on('output', outputHandler);
      
      const startPromise = manager.start({ projectPath: '/test/project' });
      
      mockProcess.stderr.emit('data', Buffer.from('Warning: something'));
      mockProcess.stdout.emit('data', Buffer.from('Local: http://localhost:3001/'));
      
      await startPromise;
      
      expect(outputHandler).toHaveBeenCalledWith({
        line: 'Warning: something',
        type: 'stderr',
      });
    });
    
    it('should emit error event when server crashes', async () => {
      const errorHandler = vi.fn();
      manager.on('error', errorHandler);
      
      const startPromise = manager.start({ projectPath: '/test/project' });
      
      // Server exits before ready
      mockProcess.emit('exit', 1, null);
      
      await startPromise;
      
      expect(errorHandler).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('exited unexpectedly'),
        })
      );
    });
    
    it('should emit stateChange events', async () => {
      const stateHandler = vi.fn();
      manager.on('stateChange', stateHandler);
      
      const startPromise = manager.start({ projectPath: '/test/project' });
      
      mockProcess.stdout.emit('data', Buffer.from('Local: http://localhost:3001/'));
      
      await startPromise;
      
      // Should have received multiple state changes
      expect(stateHandler).toHaveBeenCalled();
      
      // Check that running state was emitted
      const runningCall = stateHandler.mock.calls.find(
        call => call[0].status === 'running'
      );
      expect(runningCall).toBeDefined();
    });
  });
  
  describe('error handling', () => {
    it('should handle spawn error', async () => {
      (spawn as Mock).mockImplementation(() => {
        const proc = createMockProcess();
        // Emit error event shortly after creation
        setTimeout(() => {
          proc.emit('error', new Error('spawn ENOENT'));
        }, 10);
        return proc;
      });
      
      const result = await manager.start({ projectPath: '/test/project' });
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('spawn ENOENT');
      expect(manager.getState().status).toBe('error');
    });
    
    it('should detect EADDRINUSE error', async () => {
      const startPromise = manager.start({ projectPath: '/test/project' });
      
      mockProcess.stderr.emit('data', Buffer.from('Error: EADDRINUSE'));
      
      const result = await startPromise;
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('already in use');
    });
    
    it('should handle port finder failure', async () => {
      (findAvailablePort as Mock).mockRejectedValue(new Error('No ports available'));
      
      const result = await manager.start({ projectPath: '/test/project' });
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('available port');
    });
  });
  
  describe('cleanup', () => {
    it('should kill process on cleanup', async () => {
      // Use a mock that doesn't emit exit on kill for this test
      // to avoid race condition with cleanup
      mockProcess = createMockProcess(false);
      (spawn as Mock).mockReturnValue(mockProcess);
      
      const startPromise = manager.start({ projectPath: '/test/project' });
      mockProcess.stdout.emit('data', Buffer.from('Local: http://localhost:3001/'));
      await startPromise;
      
      // Add error handler to catch any errors during cleanup
      manager.on('error', () => {});
      
      await manager.cleanup();
      
      expect(mockProcess.kill).toHaveBeenCalledWith('SIGKILL');
    });
    
    it('should remove all event listeners on cleanup', async () => {
      manager.on('ready', vi.fn());
      manager.on('error', vi.fn());
      manager.on('output', vi.fn());
      
      await manager.cleanup();
      
      expect(manager.listenerCount('ready')).toBe(0);
      expect(manager.listenerCount('error')).toBe(0);
      expect(manager.listenerCount('output')).toBe(0);
    });
    
    it('should reset state on cleanup', async () => {
      // Use a mock that doesn't emit exit on kill
      mockProcess = createMockProcess(false);
      (spawn as Mock).mockReturnValue(mockProcess);
      
      const startPromise = manager.start({ projectPath: '/test/project' });
      mockProcess.stdout.emit('data', Buffer.from('Local: http://localhost:3001/'));
      await startPromise;
      
      // Add error handler
      manager.on('error', () => {});
      
      await manager.cleanup();
      
      const state = manager.getState();
      expect(state.status).toBe('stopped');
      expect(state.port).toBeNull();
    });
  });
  
  describe('state getters', () => {
    it('getState should return a copy', async () => {
      // Use non-exiting mock for cleaner test
      mockProcess = createMockProcess(false);
      (spawn as Mock).mockReturnValue(mockProcess);
      
      const startPromise = manager.start({ projectPath: '/test/project' });
      mockProcess.stdout.emit('data', Buffer.from('Local: http://localhost:3001/'));
      await startPromise;
      
      const state1 = manager.getState();
      const state2 = manager.getState();
      
      // Should be equal but not same reference
      expect(state1).toEqual(state2);
      expect(state1).not.toBe(state2);
    });
    
    it('getPort should return port when running', async () => {
      // Use non-exiting mock
      mockProcess = createMockProcess(false);
      (spawn as Mock).mockReturnValue(mockProcess);
      
      expect(manager.getPort()).toBeNull();
      
      const startPromise = manager.start({ projectPath: '/test/project' });
      mockProcess.stdout.emit('data', Buffer.from('Local: http://localhost:3001/'));
      await startPromise;
      
      expect(manager.getPort()).toBe(3001);
    });
    
    it('getUrl should return url when running', async () => {
      // Use non-exiting mock
      mockProcess = createMockProcess(false);
      (spawn as Mock).mockReturnValue(mockProcess);
      
      expect(manager.getUrl()).toBeNull();
      
      const startPromise = manager.start({ projectPath: '/test/project' });
      mockProcess.stdout.emit('data', Buffer.from('Local: http://localhost:3001/'));
      await startPromise;
      
      expect(manager.getUrl()).toBe('http://localhost:3001');
    });
  });
});
