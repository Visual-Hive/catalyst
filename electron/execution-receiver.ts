/**
 * @file execution-receiver.ts
 * @description HTTP server to receive execution logs from generated Python workflows
 * 
 * @architecture Phase 2.5, Task 2.11 - Execution Logging
 * @created 2025-12-21
 * @author AI (Cline) + Human Review
 * @confidence 9/10 - Standard Express server pattern with error handling
 * 
 * @see electron/execution-logger.ts - ExecutionLogger class
 * @see src/core/codegen/python/WorkflowOrchestrator.ts - Python code generation
 * 
 * PROBLEM SOLVED:
 * - Python workflows need to send execution data back to Catalyst
 * - Need HTTP endpoint that Python can call without auth
 * - Must handle port conflicts gracefully
 * - Should be configurable per project
 * 
 * SOLUTION:
 * - Simple Express server on configurable port
 * - POST endpoint accepts execution data as JSON
 * - Passes data to ExecutionLogger for storage
 * - Comprehensive error handling for port conflicts
 * - Non-blocking logging (doesn't fail workflow if logging fails)
 * 
 * DESIGN DECISIONS:
 * - Express over raw HTTP: Simpler, more maintainable
 * - No authentication: Local only, Python runs on same machine
 * - JSON body parsing: Standard for API communication
 * - Port conflict detection: Better UX with clear error messages
 * 
 * SECURITY:
 * - Binds to localhost only (not exposed to network)
 * - No authentication needed (local communication)
 * - Input validation on execution data
 * - Rate limiting could be added in future if needed
 * 
 * @security-critical false - local-only communication
 * @performance-critical false - low volume API calls
 */

import express, { Express, Request, Response } from 'express';
import { Server } from 'http';
import { ExecutionLogger } from './execution-logger';
import type { WorkflowExecution } from '../src/core/execution/types';

/**
 * Result of starting the receiver
 */
export interface ReceiverStartResult {
  success: boolean;
  port?: number;
  url?: string;
  error?: string;
}

/**
 * HTTP server that receives execution logs from Python workflows
 * 
 * RESPONSIBILITIES:
 * - Start Express server on configurable port
 * - Accept POST requests with execution data
 * - Validate and log execution data
 * - Handle port conflicts with clear error messages
 * - Graceful shutdown on app close
 * 
 * USAGE:
 * ```typescript
 * const receiver = new ExecutionReceiver(logger);
 * 
 * // Start on specific port
 * const result = await receiver.start(3000);
 * if (result.success) {
 *   console.log(`Receiver running on ${result.url}`);
 * } else {
 *   console.error(`Failed to start: ${result.error}`);
 * }
 * 
 * // Shutdown
 * await receiver.stop();
 * ```
 */
export class ExecutionReceiver {
  private app: Express;
  private server: Server | null = null;
  private logger: ExecutionLogger;
  private currentPort: number | null = null;
  
  /**
   * Create execution receiver
   * 
   * @param logger - ExecutionLogger instance for storing data
   */
  constructor(logger: ExecutionLogger) {
    this.logger = logger;
    this.app = express();
    
    // Parse JSON request bodies
    // Limit to 10MB to handle large execution data with outputs
    this.app.use(express.json({ limit: '10mb' }));
    
    // Set up routes
    this.setupRoutes();
  }
  
  /**
   * Set up Express routes
   * 
   * ROUTES:
   * - POST /api/executions - Receive execution log
   * - GET /health - Health check
   */
  private setupRoutes(): void {
    /**
     * Health check endpoint
     * Used by Python to verify receiver is running
     */
    this.app.get('/health', (req: Request, res: Response) => {
      res.json({
        status: 'healthy',
        service: 'catalyst-execution-receiver',
        timestamp: new Date().toISOString(),
      });
    });
    
    /**
     * Receive execution log from Python workflow
     * 
     * Expects WorkflowExecution JSON in request body.
     * Validates and passes to ExecutionLogger.
     */
    this.app.post('/api/executions', (req: Request, res: Response) => {
      try {
        // Validate request body
        const execution = req.body as WorkflowExecution;
        
        if (!execution || !execution.id || !execution.workflowId) {
          console.error('[ExecutionReceiver] Invalid execution data:', execution);
          return res.status(400).json({
            error: 'Invalid execution data',
            message: 'Missing required fields: id, workflowId',
          });
        }
        
        // Log execution
        const logged = this.logger.logExecution(execution);
        
        if (logged) {
          console.log(`[ExecutionReceiver] Logged execution: ${execution.id} (${execution.status})`);
          res.json({ success: true, executionId: execution.id });
        } else {
          // Not an error - just filtered out by log level or disabled
          console.log(`[ExecutionReceiver] Execution ${execution.id} not logged (filtered by config)`);
          res.json({ success: true, executionId: execution.id, logged: false });
        }
      } catch (error) {
        console.error('[ExecutionReceiver] Failed to log execution:', error);
        
        // Don't fail the request - Python workflow should continue
        // even if logging fails
        res.status(500).json({
          error: 'Failed to log execution',
          message: error instanceof Error ? error.message : 'Unknown error',
          // Still return success=true so Python doesn't retry
          success: true,
        });
      }
    });
    
    // 404 handler for unknown routes
    this.app.use((req: Request, res: Response) => {
      res.status(404).json({
        error: 'Not found',
        message: `Route ${req.method} ${req.path} not found`,
      });
    });
  }
  
  /**
   * Start the receiver server
   * 
   * Attempts to bind to the specified port.
   * If port is in use, returns error with details.
   * 
   * @param port - Port to bind to (default: 3000)
   * @returns Promise that resolves with start result
   * 
   * @example
   * ```typescript
   * const result = await receiver.start(3000);
   * 
   * if (!result.success) {
   *   if (result.error.includes('EADDRINUSE')) {
   *     console.error(`Port ${port} is already in use`);
   *     console.error('Please close the other application or change the port');
   *   }
   * }
   * ```
   */
  public async start(port: number = 3000): Promise<ReceiverStartResult> {
    // Don't start if already running
    if (this.server) {
      return {
        success: false,
        error: `Receiver already running on port ${this.currentPort}`,
      };
    }
    
    return new Promise((resolve) => {
      try {
        // Bind to localhost only (not 0.0.0.0) for security
        this.server = this.app.listen(port, '127.0.0.1', () => {
          this.currentPort = port;
          const url = `http://localhost:${port}`;
          
          console.log(`[ExecutionReceiver] Started on ${url}`);
          console.log(`[ExecutionReceiver] Endpoint: POST ${url}/api/executions`);
          
          resolve({
            success: true,
            port,
            url,
          });
        });
        
        // Handle port-in-use error
        this.server.on('error', (error: NodeJS.ErrnoException) => {
          console.error('[ExecutionReceiver] Failed to start:', error);
          
          // Clear server reference on error
          this.server = null;
          this.currentPort = null;
          
          // Provide user-friendly error messages
          if (error.code === 'EADDRINUSE') {
            resolve({
              success: false,
              error: `Port ${port} is already in use. Please close the other application using this port, or change the executionReceiverPort in your project settings.`,
            });
          } else if (error.code === 'EACCES') {
            resolve({
              success: false,
              error: `Permission denied to bind to port ${port}. Try using a port number above 1024.`,
            });
          } else {
            resolve({
              success: false,
              error: `Failed to start receiver: ${error.message}`,
            });
          }
        });
      } catch (error) {
        console.error('[ExecutionReceiver] Unexpected error:', error);
        resolve({
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    });
  }
  
  /**
   * Stop the receiver server
   * 
   * Gracefully shuts down the server.
   * Waits for existing connections to complete.
   * 
   * @returns Promise that resolves when stopped
   */
  public async stop(): Promise<void> {
    if (!this.server) {
      console.log('[ExecutionReceiver] Not running, nothing to stop');
      return;
    }
    
    return new Promise((resolve, reject) => {
      console.log('[ExecutionReceiver] Stopping server...');
      
      this.server!.close((error) => {
        if (error) {
          console.error('[ExecutionReceiver] Error stopping server:', error);
          reject(error);
        } else {
          console.log('[ExecutionReceiver] Server stopped');
          this.server = null;
          this.currentPort = null;
          resolve();
        }
      });
    });
  }
  
  /**
   * Check if receiver is running
   * 
   * @returns true if running, false otherwise
   */
  public isRunning(): boolean {
    return this.server !== null;
  }
  
  /**
   * Get current port
   * 
   * @returns Port number or null if not running
   */
  public getPort(): number | null {
    return this.currentPort;
  }
  
  /**
   * Get receiver URL
   * 
   * @returns URL or null if not running
   */
  public getUrl(): string | null {
    if (this.currentPort === null) {
      return null;
    }
    return `http://localhost:${this.currentPort}`;
  }
}
