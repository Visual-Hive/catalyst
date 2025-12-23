/**
 * @file useExecutionExport.ts
 * @description Utilities for exporting execution data to CSV and JSON
 * 
 * @architecture Phase 2.5, Task 2.12 - Execution History UI
 * @created 2025-12-21
 * @author AI (Cline) + Human Review
 * @confidence 9/10 - Standard export patterns
 * 
 * PROBLEM SOLVED:
 * - Users need to export execution history for analysis
 * - CSV format for spreadsheet analysis
 * - JSON format for debugging and sharing
 * 
 * SOLUTION:
 * - CSV export with proper headers and escaping
 * - JSON export with pretty-printing
 * - Browser download via Blob URL
 * - Automatic filename generation
 * 
 * @performance-critical false - user-triggered only
 */

import type { WorkflowExecution, NodeExecution } from '../../../../core/execution/types';

/**
 * Format a date/time string for display
 * Converts ISO 8601 to readable format
 */
function formatDateTime(isoString: string): string {
  try {
    return new Date(isoString).toLocaleString();
  } catch {
    return isoString;
  }
}

/**
 * Format duration in milliseconds to human-readable string
 */
function formatDuration(durationMs?: number): string {
  if (durationMs === undefined || durationMs === null) {
    return 'N/A';
  }
  
  if (durationMs < 1000) {
    return `${durationMs}ms`;
  }
  
  const seconds = (durationMs / 1000).toFixed(2);
  return `${seconds}s`;
}

/**
 * Escape CSV field value
 * Handles quotes, commas, and newlines
 */
function escapeCsvField(value: string): string {
  // If field contains comma, quote, or newline, wrap in quotes and escape quotes
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

/**
 * Convert executions array to CSV string
 * 
 * @param executions - Array of workflow executions
 * @returns CSV string with headers
 */
export function executionsToCSV(executions: WorkflowExecution[]): string {
  // Define CSV headers
  const headers = [
    'Execution ID',
    'Workflow',
    'Status',
    'Started At',
    'Completed At',
    'Duration',
    'Trigger Type',
    'Node Count',
    'Success Count',
    'Error Count',
    'Error Message'
  ];
  
  // Convert each execution to a row
  const rows = executions.map((execution) => {
    const successCount = execution.nodeExecutions.filter(n => n.status === 'success').length;
    const errorCount = execution.nodeExecutions.filter(n => n.status === 'error').length;
    
    return [
      execution.id,
      execution.workflowName,
      execution.status,
      formatDateTime(execution.startedAt),
      execution.completedAt ? formatDateTime(execution.completedAt) : 'N/A',
      formatDuration(execution.durationMs),
      execution.trigger.type,
      execution.nodeExecutions.length.toString(),
      successCount.toString(),
      errorCount.toString(),
      execution.error?.message || ''
    ].map(escapeCsvField);
  });
  
  // Combine headers and rows
  const csvLines = [
    headers.map(escapeCsvField).join(','),
    ...rows.map(row => row.join(','))
  ];
  
  return csvLines.join('\n');
}

/**
 * Convert single execution to pretty-printed JSON
 * 
 * @param execution - Workflow execution
 * @returns Pretty-printed JSON string
 */
export function executionToJSON(execution: WorkflowExecution): string {
  return JSON.stringify(execution, null, 2);
}

/**
 * Download content as a file
 * Creates a temporary Blob URL and triggers download
 * 
 * @param content - File content as string
 * @param filename - Name for downloaded file
 * @param mimeType - MIME type for the file
 */
export function downloadFile(
  content: string,
  filename: string,
  mimeType: string
): void {
  // Create Blob with content
  const blob = new Blob([content], { type: mimeType });
  
  // Create temporary URL for Blob
  const url = URL.createObjectURL(blob);
  
  // Create temporary link element and trigger click
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.style.display = 'none';
  
  // Append to document, click, and remove
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  // Clean up Blob URL
  // Delay to ensure download starts before revoking
  setTimeout(() => {
    URL.revokeObjectURL(url);
  }, 100);
}

/**
 * Generate filename for execution history CSV
 * 
 * @param workflowName - Name of workflow
 * @returns Filename string
 */
export function generateCSVFilename(workflowName: string): string {
  const timestamp = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  const safeName = workflowName.replace(/[^a-z0-9]/gi, '_').toLowerCase();
  return `${safeName}_executions_${timestamp}.csv`;
}

/**
 * Generate filename for single execution JSON
 * 
 * @param execution - Workflow execution
 * @returns Filename string
 */
export function generateJSONFilename(execution: WorkflowExecution): string {
  const timestamp = execution.startedAt.split('T')[0]; // YYYY-MM-DD
  const safeName = execution.workflowName.replace(/[^a-z0-9]/gi, '_').toLowerCase();
  return `${safeName}_execution_${execution.id.substring(0, 8)}_${timestamp}.json`;
}

/**
 * Hook for exporting execution data
 * Provides utility functions for CSV and JSON export
 * 
 * @returns Export utility functions
 * 
 * @example
 * ```typescript
 * const { exportToCSV, exportToJSON } = useExecutionExport();
 * 
 * // Export list to CSV
 * <button onClick={() => exportToCSV(executions, 'My Workflow')}>
 *   Export to CSV
 * </button>
 * 
 * // Export single execution to JSON
 * <button onClick={() => exportToJSON(selectedExecution)}>
 *   Export JSON
 * </button>
 * ```
 */
export function useExecutionExport() {
  /**
   * Export execution list to CSV file
   * 
   * @param executions - Array of executions to export
   * @param workflowName - Workflow name for filename
   */
  const exportToCSV = (executions: WorkflowExecution[], workflowName: string) => {
    if (executions.length === 0) {
      console.warn('[useExecutionExport] No executions to export');
      return;
    }
    
    try {
      const csv = executionsToCSV(executions);
      const filename = generateCSVFilename(workflowName);
      downloadFile(csv, filename, 'text/csv;charset=utf-8;');
      
      console.log(`[useExecutionExport] Exported ${executions.length} executions to ${filename}`);
    } catch (error) {
      console.error('[useExecutionExport] Failed to export CSV:', error);
      throw error;
    }
  };
  
  /**
   * Export single execution to JSON file
   * 
   * @param execution - Execution to export
   */
  const exportToJSON = (execution: WorkflowExecution) => {
    try {
      const json = executionToJSON(execution);
      const filename = generateJSONFilename(execution);
      downloadFile(json, filename, 'application/json;charset=utf-8;');
      
      console.log(`[useExecutionExport] Exported execution ${execution.id} to ${filename}`);
    } catch (error) {
      console.error('[useExecutionExport] Failed to export JSON:', error);
      throw error;
    }
  };
  
  return {
    exportToCSV,
    exportToJSON,
    // Also export utilities for custom use
    executionsToCSV,
    executionToJSON,
    downloadFile,
  };
}
