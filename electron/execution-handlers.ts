/**
 * @file execution-handlers.ts
 * @description IPC handlers for execution history queries
 * 
 * @architecture Phase 2.5, Task 2.11 - Execution Logging
 * @created 2025-12-21
 * @author AI (Cline) + Human Review
 * @confidence 9/10 - Standard IPC handler pattern, well-tested
 * 
 * @see electron/execution-logger.ts - ExecutionLogger class
 * @see electron/preload.ts - IPC method exposure
 * 
 * PROBLEM SOLVED:
 * - Renderer process needs to query execution history
 * - Need secure IPC channel for database access
 * - Support filtering, pagination, and statistics
 * 
 * SOLUTION:
 * - IPC handlers that wrap ExecutionLogger methods
 * - Consistent error handling and logging
 * - Type-safe parameters and return values
 * 
 * SECURITY:
 * - All database access goes through main process
 * - No SQL injection (uses prepared statements)
 * - No direct file system access from renderer
 * 
 * @security-critical false - uses ExecutionLogger which is secure
 * @performance-critical false - database queries are fast
 */

import { ipcMain } from 'electron';
import { ExecutionLogger } from './execution-logger';
import type {
  WorkflowExecution,
  ExecutionQueryOptions,
  ExecutionStats,
} from '../src/core/execution/types';

/**
 * Register IPC handlers for execution history
 * 
 * Called during app initialization to set up communication
 * between renderer and main process for execution data.
 * 
 * HANDLERS:
 * - execution:query - Query executions with filtering
 * - execution:get - Get single execution by ID
 * - execution:get-stats - Get execution statistics
 * - execution:delete - Delete single execution
 * - execution:clear-workflow - Clear all executions for workflow
 * - execution:cleanup - Manually trigger cleanup
 * 
 * @param logger - ExecutionLogger instance
 */
export function registerExecutionHandlers(logger: ExecutionLogger): void {
  console.log('[ExecutionHandlers] Registering IPC handlers');
  
  /**
   * Query execution history with optional filtering
   * 
   * IPC: execution:query
   * 
   * @param options - Query options (workflowId, status, limit, offset, sortOrder, projectPath)
   * @returns Array of workflow executions
   */
  ipcMain.handle('execution:query', async (event, options: ExecutionQueryOptions & { projectPath?: string }) => {
    try {
      const { projectPath, ...queryOptions } = options;
      
      // Set project path if provided
      if (projectPath) {
        logger.setProjectPath(projectPath);
      }
      
      console.log('[ExecutionHandlers] Querying executions:', queryOptions);
      return logger.queryExecutions(queryOptions);
    } catch (error) {
      console.error('[ExecutionHandlers] Failed to query executions:', error);
      throw error;
    }
  });
  
  /**
   * Get single execution by ID
   * 
   * IPC: execution:get
   * 
   * @param executionId - Execution ID
   * @param projectPath - Optional project path to set
   * @returns Execution or null if not found
   */
  ipcMain.handle('execution:get', async (event, executionId: string, projectPath?: string) => {
    try {
      if (projectPath) {
        logger.setProjectPath(projectPath);
      }
      
      console.log('[ExecutionHandlers] Getting execution:', executionId);
      return logger.getExecution(executionId);
    } catch (error) {
      console.error('[ExecutionHandlers] Failed to get execution:', error);
      throw error;
    }
  });
  
  /**
   * Get execution statistics for a workflow
   * 
   * IPC: execution:get-stats
   * 
   * @param workflowId - Workflow ID
   * @param projectPath - Optional project path to set
   * @returns Execution statistics
   */
  ipcMain.handle('execution:get-stats', async (event, workflowId: string, projectPath?: string) => {
    try {
      if (projectPath) {
        logger.setProjectPath(projectPath);
      }
      
      console.log('[ExecutionHandlers] Getting stats for workflow:', workflowId);
      return logger.getStats(workflowId);
    } catch (error) {
      console.error('[ExecutionHandlers] Failed to get stats:', error);
      throw error;
    }
  });
  
  /**
   * Delete a single execution
   * 
   * IPC: execution:delete
   * 
   * @param executionId - Execution ID to delete
   * @param projectPath - Optional project path to set
   * @returns Success flag
   */
  ipcMain.handle('execution:delete', async (event, executionId: string, projectPath?: string) => {
    try {
      if (projectPath) {
        logger.setProjectPath(projectPath);
      }
      
      console.log('[ExecutionHandlers] Deleting execution:', executionId);
      const deleted = logger.deleteExecution(executionId);
      return { success: deleted };
    } catch (error) {
      console.error('[ExecutionHandlers] Failed to delete execution:', error);
      throw error;
    }
  });
  
  /**
   * Clear all executions for a workflow
   * 
   * IPC: execution:clear-workflow
   * 
   * @param workflowId - Workflow ID
   * @param projectPath - Optional project path to set
   * @returns Number of executions deleted
   */
  ipcMain.handle('execution:clear-workflow', async (event, workflowId: string, projectPath?: string) => {
    try {
      if (projectPath) {
        logger.setProjectPath(projectPath);
      }
      
      console.log('[ExecutionHandlers] Clearing executions for workflow:', workflowId);
      const count = logger.clearWorkflowExecutions(workflowId);
      return { success: true, count };
    } catch (error) {
      console.error('[ExecutionHandlers] Failed to clear workflow executions:', error);
      throw error;
    }
  });
  
  /**
   * Manually trigger cleanup of old executions
   * 
   * IPC: execution:cleanup
   * 
   * @param retentionDays - Number of days to keep
   * @returns Number of executions deleted
   */
  ipcMain.handle('execution:cleanup', async (event, retentionDays: number) => {
    try {
      console.log('[ExecutionHandlers] Running manual cleanup:', retentionDays);
      const count = logger.cleanupOldExecutions(retentionDays);
      return { success: true, count };
    } catch (error) {
      console.error('[ExecutionHandlers] Failed to cleanup executions:', error);
      throw error;
    }
  });
  
  /**
   * Copy execution data to canvas (pin all node outputs)
   * 
   * IPC: execution:copy-to-canvas
   * 
   * Extracts all node outputs from a completed execution and formats
   * them for pinning to the workflow canvas. This allows developers to
   * "freeze" real execution data for testing and iteration.
   * 
   * BEHAVIOR:
   * - Only includes nodes with status === 'success'
   * - Prefers output data, falls back to input if no output
   * - Returns structured data ready for pinNodeData() calls
   * 
   * @param executionId - Execution ID to copy from
   * @param projectPath - Optional project path to set
   * @returns Workflow ID and array of node pins
   * 
   * @see .implementation/Catalyst_tasks/phase-2.5-developer-experience/task-2.15-copy-execution.md
   * @see src/renderer/store/workflowStore.ts - pinNodeData method
   */
  ipcMain.handle('execution:copy-to-canvas', async (event, executionId: string, projectPath?: string) => {
    try {
      if (projectPath) {
        logger.setProjectPath(projectPath);
      }
      
      console.log('[ExecutionHandlers] Copying execution to canvas:', executionId);
      
      // Get execution from logger
      const execution = logger.getExecution(executionId);
      
      if (!execution) {
        console.warn('[ExecutionHandlers] Execution not found:', executionId);
        return {
          success: false,
          error: 'Execution not found',
        };
      }
      
      // Extract node data from successful node executions
      // Only pin nodes that completed successfully
      const nodePins = execution.nodeExecutions
        .filter((nodeExec) => nodeExec.status === 'success')
        .map((nodeExec) => ({
          nodeId: nodeExec.nodeId,
          nodeName: nodeExec.nodeName,
          // Prefer output data, fall back to input if no output
          data: nodeExec.output || nodeExec.input,
        }));
      
      console.log(`[ExecutionHandlers] Prepared ${nodePins.length} node pins for workflow ${execution.workflowId}`);
      
      return {
        success: true,
        data: {
          workflowId: execution.workflowId,
          nodePins,
        },
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      console.error('[ExecutionHandlers] Failed to copy execution to canvas:', message);
      return {
        success: false,
        error: message,
      };
    }
  });
  
  console.log('[ExecutionHandlers] All handlers registered');
}

/**
 * Cleanup execution handlers
 * 
 * Called during app shutdown to remove IPC listeners.
 */
export function cleanupExecutionHandlers(): void {
  console.log('[ExecutionHandlers] Cleaning up IPC handlers');
  
  ipcMain.removeHandler('execution:query');
  ipcMain.removeHandler('execution:get');
  ipcMain.removeHandler('execution:get-stats');
  ipcMain.removeHandler('execution:delete');
  ipcMain.removeHandler('execution:clear-workflow');
  ipcMain.removeHandler('execution:cleanup');
  ipcMain.removeHandler('execution:copy-to-canvas');
  
  console.log('[ExecutionHandlers] Cleanup complete');
}
