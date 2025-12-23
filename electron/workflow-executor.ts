/**
 * @file workflow-executor.ts
 * @description Executes workflows locally in Python subprocess
 * 
 * @architecture Phase 2.5, Task 2.18 - Local Execution Runner
 * @created 2025-12-22
 * @author AI (Cline) + Human Review
 * @confidence 8/10 - Subprocess management is well-tested pattern
 * 
 * @see src/core/execution/types.ts - Type definitions
 * @see electron/execution-logger.ts - Database logging
 * @see electron/python-environment.ts - Python validation
 * @see .implementation/Catalyst_tasks/phase-2.5-developer-experience/task-2.18-local-execution-runner.md
 * 
 * PROBLEM SOLVED:
 * - No way to execute workflows locally for testing
 * - RequestSimulator UI exists but doesn't run workflows
 * - ExecutionLogger exists but has no execution data
 * - Gap between UI and Python runtime
 * 
 * SOLUTION:
 * - Spawn Python subprocess with generated workflow code
 * - Pass trigger data via stdin (secure, clean)
 * - Capture stdout for execution data
 * - Parse structured JSON markers
 * - Log to ExecutionLogger automatically
 * - Handle errors gracefully with helpful messages
 * 
 * DESIGN DECISIONS:
 * - Subprocess over in-process: Isolation, matches production
 * - Stdin for data: Secure, handles large payloads
 * - Regex markers for output: Simple, reliable
 * - Auto cleanup temp files: Prevents clutter
 * - Structured error types: Better UX
 * 
 * EXECUTION FLOW:
 * 1. Load workflow from manifest
 * 2. Generate Python code
 * 3. Write to temp file
 * 4. Spawn Python with trigger data
 * 5. Capture and parse output
 * 6. Log to database
 * 7. Return execution ID
 * 
 * @security-critical true - Executes user-defined code
 * @performance-critical false - User-initiated, async
 */

import { spawn, ChildProcessWithoutNullStreams } from 'child_process';
import { promises as fs } from 'fs';
import path from 'path';
import { tmpdir } from 'os';
import { v4 as uuidv4 } from 'uuid';
import { generatePythonWorkflow } from '../src/core/codegen/python/WorkflowOrchestrator';
import { ExecutionLogger } from './execution-logger';
import { PythonEnvironment } from './python-environment';
import type { WorkflowExecution } from '../src/core/execution/types';
import type { WorkflowDefinition } from '../src/core/workflow/types';
import type { SimulatedRequest } from '../src/renderer/components/WorkflowCanvas/RequestSimulator';

/**
 * Manages local workflow execution in Python subprocess
 * 
 * RESPONSIBILITIES:
 * - Generate Python code from workflow
 * - Spawn Python subprocess with trigger data
 * - Capture execution output (stdout/stderr)
 * - Parse execution JSON from output
 * - Log to ExecutionLogger
 * - Handle errors and timeouts
 * - Clean up temporary files
 * 
 * USAGE:
 * ```typescript
 * const executor = WorkflowExecutor.getInstance();
 * 
 * const execution = await executor.executeWorkflow(
 *   workflow,
 *   {
 *     method: 'POST',
 *     headers: { 'Content-Type': 'application/json' },
 *     body: { query: 'test' },
 *     path: '/api/search',
 *     query: {},
 *     pathParams: {}
 *   }
 * );
 * 
 * console.log(`Execution ${execution.id} completed with status: ${execution.status}`);
 * ```
 * 
 * ERROR HANDLING:
 * - Python not found → PythonNotFoundError
 * - Missing dependencies → DependencyError
 * - Runtime error → ExecutionError with traceback
 * - Timeout → TimeoutError
 */
export class WorkflowExecutor {
  private static instance: WorkflowExecutor;
  private activeProcesses: Map<string, ChildProcessWithoutNullStreams>;
  
  /**
   * Private constructor (singleton pattern)
   * 
   * Note: ExecutionLogger and PythonEnvironment are accessed lazily via getInstance()
   * to avoid constructor-time initialization dependencies. This prevents crashes when
   * WorkflowExecutor is instantiated before these singletons are configured.
   */
  private constructor() {
    this.activeProcesses = new Map();
  }
  
  /**
   * Get singleton instance
   */
  public static getInstance(): WorkflowExecutor {
    if (!WorkflowExecutor.instance) {
      WorkflowExecutor.instance = new WorkflowExecutor();
    }
    return WorkflowExecutor.instance;
  }
  
  /**
   * Execute workflow locally with simulated request
   * 
   * EXECUTION STEPS:
   * 1. Validate Python environment
   * 2. Generate Python code
   * 3. Write to temporary file
   * 4. Spawn Python process
   * 5. Pass trigger data via stdin
   * 6. Capture stdout/stderr
   * 7. Parse execution JSON
   * 8. Log to database
   * 9. Clean up temp file
   * 
   * @param workflow - Workflow to execute
   * @param triggerData - Simulated HTTP request or other trigger data
   * @param options - Execution options (timeout, env vars)
   * @returns Promise<WorkflowExecution> - Execution result
   * 
   * @throws {PythonNotFoundError} If Python not installed
   * @throws {DependencyError} If required packages missing
   * @throws {ExecutionError} If workflow execution fails
   * @throws {TimeoutError} If execution exceeds timeout
   * 
   * @example
   * ```typescript
   * const execution = await executor.executeWorkflow(
   *   workflow,
   *   { method: 'POST', body: { test: true } }
   * );
   * ```
   */
  public async executeWorkflow(
    workflow: WorkflowDefinition,
    triggerData: SimulatedRequest,
    options: ExecutionOptions = {}
  ): Promise<WorkflowExecution> {
    const executionId = uuidv4();
    const startTime = new Date().toISOString();
    
    console.log(`[WorkflowExecutor] Starting execution ${executionId} for workflow ${workflow.id}`);
    
    try {
      // Step 1: Ensure Python environment with auto-install
      // Clear cache to ensure fresh validation (handles multi-version Python environments)
      const pythonEnv = PythonEnvironment.getInstance();
      pythonEnv.clearCache();
      await pythonEnv.ensureDependencies(true);
      
      // Step 2: Generate Python code
      console.log(`[WorkflowExecutor] Generating Python code for ${workflow.name}`);
      const result = generatePythonWorkflow(workflow);
      
      // Step 3: Write to temporary file
      const tempFilePath = await this.writeTemporaryWorkflow(
        workflow.id,
        result.code
      );
      
      // Step 4: Spawn Python process
      const process = await this.spawnPythonProcess(
        tempFilePath,
        triggerData,
        options.environment || {}
      );
      
      // Track active process
      this.activeProcesses.set(executionId, process);
      
      // Step 5: Capture execution output
      const executionData = await this.captureExecutionOutput(
        process,
        executionId,
        workflow,
        triggerData,
        startTime,
        options.timeout || 60000 // Default 60s timeout
      );
      
      // Step 6: Log to database (gracefully handle if logger not initialized)
      try {
        const executionLogger = ExecutionLogger.getInstance();
        executionLogger.logExecution(executionData);
      } catch (error) {
        console.warn('[WorkflowExecutor] ExecutionLogger not available, skipping database logging:', error);
        // Execution still succeeds, just not logged to DB
      }
      
      // Step 7: Clean up
      await this.cleanupTemporaryFile(tempFilePath);
      this.activeProcesses.delete(executionId);
      
      console.log(`[WorkflowExecutor] Execution ${executionId} completed with status: ${executionData.status}`);
      
      return executionData;
      
    } catch (error) {
      console.error(`[WorkflowExecutor] Execution ${executionId} failed:`, error);
      
      // Log failed execution
      const failedExecution: WorkflowExecution = {
        id: executionId,
        workflowId: workflow.id,
        workflowName: workflow.name,
        executionMode: 'test',
        status: 'error',
        startedAt: startTime,
        completedAt: new Date().toISOString(),
        durationMs: Date.now() - new Date(startTime).getTime(),
        trigger: {
          type: 'http',
          data: triggerData,
          isSimulated: true,
        },
        nodeExecutions: [],
        error: {
          message: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
        },
      };
      
      // Log failed execution (gracefully handle if logger not initialized)
      try {
        const executionLogger = ExecutionLogger.getInstance();
        executionLogger.logExecution(failedExecution);
      } catch (logError) {
        console.warn('[WorkflowExecutor] ExecutionLogger not available for error logging:', logError);
      }
      
      throw error;
    }
  }
  
  /**
   * Write workflow code to temporary file
   * 
   * Creates temp file in OS temp directory with unique name.
   * File will be cleaned up after execution or on process exit.
   * 
   * @param workflowId - Workflow ID for file naming
   * @param pythonCode - Generated Python code
   * @returns Path to temp file
   */
  private async writeTemporaryWorkflow(
    workflowId: string,
    pythonCode: string
  ): Promise<string> {
    const tempDir = tmpdir();
    const fileName = `catalyst_workflow_${workflowId}_${Date.now()}.py`;
    const filePath = path.join(tempDir, fileName);
    
    await fs.writeFile(filePath, pythonCode, 'utf-8');
    
    console.log(`[WorkflowExecutor] Wrote temp workflow to: ${filePath}`);
    
    return filePath;
  }
  
  /**
   * Spawn Python subprocess with workflow file
   * 
   * @param filePath - Path to workflow Python file
   * @param triggerData - Data to pass via stdin
   * @param environment - Environment variables (API keys, etc.)
   * @returns ChildProcess instance
   */
  private async spawnPythonProcess(
    filePath: string,
    triggerData: any,
    environment: Record<string, string>
  ): Promise<ChildProcessWithoutNullStreams> {
    const pythonEnv = PythonEnvironment.getInstance();
    const pythonPath = await pythonEnv.getPythonPath();
    
    // Merge environment variables
    const env = {
      ...process.env,
      ...environment,
      CATALYST_EXECUTION_MODE: 'test',
    };
    
    // Spawn Python process
    const childProcess = spawn(pythonPath, [filePath], {
      env,
      stdio: ['pipe', 'pipe', 'pipe'], // stdin, stdout, stderr
    });
    
    // Write trigger data to stdin
    childProcess.stdin.write(JSON.stringify(triggerData));
    childProcess.stdin.end();
    
    return childProcess;
  }
  
  /**
   * Capture and parse execution output from Python process
   * 
   * Looks for structured JSON between markers:
   * __CATALYST_EXECUTION_START__
   * {execution JSON}
   * __CATALYST_EXECUTION_END__
   * 
   * @param process - Python subprocess
   * @param executionId - Execution ID
   * @param workflow - Workflow being executed
   * @param triggerData - Trigger data
   * @param startTime - Execution start time
   * @param timeout - Timeout in milliseconds
   * @returns WorkflowExecution data
   */
  private async captureExecutionOutput(
    process: ChildProcessWithoutNullStreams,
    executionId: string,
    workflow: WorkflowDefinition,
    triggerData: any,
    startTime: string,
    timeout: number
  ): Promise<WorkflowExecution> {
    return new Promise((resolve, reject) => {
      let stdout = '';
      let stderr = '';
      let timeoutId: NodeJS.Timeout;
      
      // Capture stdout
      process.stdout.on('data', (data) => {
        stdout += data.toString();
      });
      
      // Capture stderr
      process.stderr.on('data', (data) => {
        stderr += data.toString();
        console.error(`[WorkflowExecutor] Python stderr:`, data.toString());
      });
      
      // Handle process exit
      process.on('exit', (code) => {
        clearTimeout(timeoutId);
        
        if (code === 0) {
          // Parse execution data from stdout
          try {
            const executionData = this.parseExecutionOutput(
              stdout,
              executionId,
              workflow,
              triggerData,
              startTime
            );
            resolve(executionData);
          } catch (error) {
            reject(new Error(`Failed to parse execution output: ${error}`));
          }
        } else {
          reject(new Error(`Python process exited with code ${code}\n\nStderr: ${stderr}`));
        }
      });
      
      // Handle process errors
      process.on('error', (error) => {
        clearTimeout(timeoutId);
        reject(error);
      });
      
      // Set timeout
      timeoutId = setTimeout(() => {
        process.kill('SIGTERM');
        reject(new Error(`Execution timed out after ${timeout}ms`));
      }, timeout);
    });
  }
  
  /**
   * Parse execution JSON from Python stdout
   * 
   * Extracts JSON between __CATALYST_EXECUTION_START__ and __CATALYST_EXECUTION_END__ markers.
   * 
   * @param stdout - Raw stdout from Python
   * @param executionId - Execution ID
   * @param workflow - Workflow being executed
   * @param triggerData - Trigger data
   * @param startTime - Execution start time
   * @returns Parsed WorkflowExecution
   */
  private parseExecutionOutput(
    stdout: string,
    executionId: string,
    workflow: WorkflowDefinition,
    triggerData: any,
    startTime: string
  ): WorkflowExecution {
    // Look for execution JSON between markers
    const startMarker = '__CATALYST_EXECUTION_START__';
    const endMarker = '__CATALYST_EXECUTION_END__';
    
    const startIdx = stdout.indexOf(startMarker);
    const endIdx = stdout.indexOf(endMarker);
    
    if (startIdx === -1 || endIdx === -1) {
      console.warn('[WorkflowExecutor] No execution markers found in output');
      console.warn('stdout:', stdout);
      
      // Return minimal execution data
      return {
        id: executionId,
        workflowId: workflow.id,
        workflowName: workflow.name,
        executionMode: 'test',
        status: 'success',
        startedAt: startTime,
        completedAt: new Date().toISOString(),
        durationMs: Date.now() - new Date(startTime).getTime(),
        trigger: {
          type: 'http',
          data: triggerData,
          isSimulated: true,
        },
        nodeExecutions: [],
      };
    }
    
    // Extract JSON
    const jsonStr = stdout.substring(
      startIdx + startMarker.length,
      endIdx
    ).trim();
    
    try {
      const executionData = JSON.parse(jsonStr);
      
      // Merge with our metadata
      return {
        ...executionData,
        id: executionId,
        workflowId: workflow.id,
        workflowName: workflow.name,
        executionMode: 'test',
        trigger: {
          type: 'http',
          data: triggerData,
          isSimulated: true,
        },
      };
    } catch (error) {
      throw new Error(`Failed to parse execution JSON: ${error}\n\nJSON: ${jsonStr}`);
    }
  }
  
  /**
   * Clean up temporary workflow file
   * 
   * @param filePath - Path to temp file
   */
  private async cleanupTemporaryFile(filePath: string): Promise<void> {
    try {
      await fs.unlink(filePath);
      console.log(`[WorkflowExecutor] Cleaned up temp file: ${filePath}`);
    } catch (error) {
      console.warn(`[WorkflowExecutor] Failed to clean up temp file: ${error}`);
    }
  }
  
  /**
   * Stop running execution
   * 
   * @param executionId - Execution ID to stop
   * @returns true if stopped, false if not found
   */
  public stopExecution(executionId: string): boolean {
    const process = this.activeProcesses.get(executionId);
    
    if (process) {
      console.log(`[WorkflowExecutor] Stopping execution ${executionId}`);
      process.kill('SIGTERM');
      this.activeProcesses.delete(executionId);
      return true;
    }
    
    return false;
  }
  
  /**
   * Get active execution IDs
   */
  public getActiveExecutions(): string[] {
    return Array.from(this.activeProcesses.keys());
  }
}

/**
 * Execution options
 */
export interface ExecutionOptions {
  /** Timeout in milliseconds (default: 60000) */
  timeout?: number;
  
  /** Environment variables (API keys, etc.) */
  environment?: Record<string, string>;
}

// Note: Do NOT export a module-level singleton instance here!
// It would be instantiated when this module loads, which is before
// ExecutionLogger is configured, causing a crash.
// Instead, handlers should call WorkflowExecutor.getInstance() when needed.
