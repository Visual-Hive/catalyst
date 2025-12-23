/**
 * @file workflow-execution-handlers.ts
 * @description IPC handlers for workflow execution
 * 
 * @architecture Phase 2.5, Task 2.18.2 - IPC Handlers
 * @created 2025-12-22
 * @author AI (Cline) + Human Review
 * @confidence 9/10 - Standard IPC pattern
 * 
 * @see electron/workflow-executor.ts - Executor implementation
 * @see electron/preload.ts - Exposes handlers to renderer
 * @see .implementation/Catalyst_tasks/phase-2.5-developer-experience/task-2.18.2-ipc-handlers.md
 * 
 * PROBLEM SOLVED:
 * - Need to bridge React UI and Electron main process
 * - Need type-safe communication
 * - Need error handling across process boundary
 * - Need to pass large payloads (workflow data, execution results)
 * 
 * SOLUTION:
 * - IPC handlers using ipcMain.handle
 * - Structured request/response types
 * - Error serialization
 * - Async handlers for long-running operations
 * 
 * DESIGN DECISIONS:
 * - Use ipcMain.handle (not .on) for request/response pattern
 * - Serialize errors to plain objects
 * - Return structured responses with success/error
 * - Load workflow from manifest (passed from renderer)
 * 
 * @security-critical true - Executes user workflows
 * @performance-critical false - User-initiated operations
 */

import { ipcMain } from 'electron';
import { WorkflowExecutor } from './workflow-executor';
import { PythonEnvironment, type ValidationStatus } from './python-environment';
import type { WorkflowExecution } from '../src/core/execution/types';
import type { WorkflowDefinition, CatalystManifest } from '../src/core/workflow/types';
import type { SimulatedRequest } from '../src/renderer/components/WorkflowCanvas/RequestSimulator';

/**
 * Register all workflow execution IPC handlers
 * 
 * Call this once during Electron app initialization.
 * 
 * @example
 * ```typescript
 * // In electron/main.ts
 * import { registerWorkflowExecutionHandlers } from './workflow-execution-handlers';
 * 
 * app.whenReady().then(() => {
 *   registerWorkflowExecutionHandlers();
 *   // ...
 * });
 * ```
 */
export function registerWorkflowExecutionHandlers(): void {
  console.log('[IPC] Registering workflow execution handlers');
  
  /**
   * workflow:execute
   * 
   * Execute workflow with trigger data.
   * Spawns Python subprocess, captures output, logs to database.
   * 
   * @param workflowId - Workflow ID to execute
   * @param triggerData - Simulated HTTP request data
   * @param manifest - Complete Catalyst manifest
   * @returns Promise<IPCResponse<WorkflowExecution>>
   */
  ipcMain.handle(
    'workflow:execute',
    async (_event, workflowId: string, triggerData: SimulatedRequest, manifest: CatalystManifest) => {
      try {
        console.log(`[IPC] workflow:execute called for workflow ${workflowId}`);
        
        // Load workflow from manifest
        const workflow = manifest.workflows[workflowId];
        if (!workflow) {
          throw new Error(`Workflow ${workflowId} not found in manifest`);
        }
        
        // Extract API keys from node configurations
        const environment = extractEnvironmentVariables(workflow);
        
        // Execute workflow (lazy-init singleton)
        const workflowExecutor = WorkflowExecutor.getInstance();
        const execution = await workflowExecutor.executeWorkflow(
          workflow,
          triggerData,
          { environment }
        );
        
        return {
          success: true,
          data: execution,
        };
      } catch (error: any) {
        console.error('[IPC] workflow:execute error:', error);
        
        return {
          success: false,
          error: {
            message: error.message,
            name: error.name,
            stack: error.stack,
          },
        };
      }
    }
  );
  
  /**
   * workflow:stop
   * 
   * Stop a running workflow execution.
   * 
   * @param executionId - Execution ID to stop
   * @returns Promise<IPCResponse<{ stopped: boolean }>>
   */
  ipcMain.handle(
    'workflow:stop',
    async (_event, executionId: string) => {
      try {
        console.log(`[IPC] workflow:stop called for execution ${executionId}`);
        
        const workflowExecutor = WorkflowExecutor.getInstance();
        const stopped = workflowExecutor.stopExecution(executionId);
        
        return {
          success: true,
          data: { stopped },
        };
      } catch (error: any) {
        console.error('[IPC] workflow:stop error:', error);
        
        return {
          success: false,
          error: {
            message: error.message,
            name: error.name,
          },
        };
      }
    }
  );
  
  /**
   * workflow:get-active
   * 
   * Get list of currently running executions.
   * 
   * @returns Promise<IPCResponse<string[]>>
   */
  ipcMain.handle(
    'workflow:get-active',
    async (_event) => {
      try {
        const workflowExecutor = WorkflowExecutor.getInstance();
        const activeExecutions = workflowExecutor.getActiveExecutions();
        
        return {
          success: true,
          data: activeExecutions,
        };
      } catch (error: any) {
        console.error('[IPC] workflow:get-active error:', error);
        
        return {
          success: false,
          error: {
            message: error.message,
            name: error.name,
          },
        };
      }
    }
  );
  
  /**
   * python:check
   * 
   * Check Python environment status.
   * Returns validation result without throwing errors.
   * 
   * @returns Promise<IPCResponse<ValidationStatus>>
   */
  ipcMain.handle(
    'python:check',
    async (_event) => {
      try {
        console.log('[IPC] python:check called');
        
        const pythonEnvironment = PythonEnvironment.getInstance();
        const status = await pythonEnvironment.getStatus();
        
        return {
          success: true,
          data: status,
        };
      } catch (error: any) {
        console.error('[IPC] python:check error:', error);
        
        return {
          success: false,
          error: {
            message: error.message,
            name: error.name,
          },
        };
      }
    }
  );
  
  /**
   * python:install-deps
   * 
   * Install missing Python dependencies via pip.
   * 
   * @param packages - Array of package names to install
   * @returns Promise<IPCResponse<InstallResult>>
   */
  ipcMain.handle(
    'python:install-deps',
    async (_event, packages: string[]) => {
      try {
        console.log(`[IPC] python:install-deps called for packages: ${packages.join(', ')}`);
        
        const pythonEnvironment = PythonEnvironment.getInstance();
        const result = await pythonEnvironment.installPackages(packages);
        
        return {
          success: result.success,
          data: result,
        };
      } catch (error: any) {
        console.error('[IPC] python:install-deps error:', error);
        
        return {
          success: false,
          error: {
            message: error.message,
            name: error.name,
          },
        };
      }
    }
  );
  
  console.log('[IPC] Workflow execution handlers registered');
}

/**
 * Extract environment variables from workflow node configurations
 * 
 * Looks for API keys in node configs and maps them to environment variables
 * that will be passed to the Python subprocess.
 * 
 * @param workflow - Workflow with configured nodes
 * @returns Environment variables object
 */
function extractEnvironmentVariables(workflow: WorkflowDefinition): Record<string, string> {
  const env: Record<string, string> = {};
  
  // Get nodes array from map
  const nodes = Object.values(workflow.nodes);
  
  // Iterate through nodes and extract API keys
  for (const node of nodes) {
    const config = node.config || {};
    
    // Map node types to environment variables
    switch (node.type) {
      case 'anthropicCompletion':
        if (config.apiKey) {
          env.ANTHROPIC_API_KEY = config.apiKey;
        }
        break;
        
      case 'openaiCompletion':
        if (config.apiKey) {
          env.OPENAI_API_KEY = config.apiKey;
        }
        break;
        
      case 'groqCompletion':
        if (config.apiKey) {
          env.GROQ_API_KEY = config.apiKey;
        }
        break;
      
      case 'azureOpenaiCompletion':
        if (config.apiKey) {
          env.AZURE_OPENAI_API_KEY = config.apiKey;
        }
        if (config.endpoint) {
          env.AZURE_OPENAI_ENDPOINT = config.endpoint;
        }
        break;
    }
  }
  
  return env;
}

/**
 * Cleanup all handlers
 * 
 * Call this during app shutdown.
 */
export function cleanupWorkflowExecutionHandlers(): void {
  console.log('[IPC] Cleaning up workflow execution handlers');
  
  // Remove IPC handlers
  ipcMain.removeHandler('workflow:execute');
  ipcMain.removeHandler('workflow:stop');
  ipcMain.removeHandler('workflow:get-active');
  ipcMain.removeHandler('python:check');
  ipcMain.removeHandler('python:install-deps');
}

/**
 * Type definitions for IPC responses
 */

export interface IPCResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    name: string;
    stack?: string;
  };
}
