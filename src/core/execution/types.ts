/**
 * @file types.ts
 * @description Type definitions for workflow execution logging
 * 
 * @architecture Phase 2.5, Task 2.11 - Execution Logging
 * @created 2025-12-21
 * @author AI (Cline) + Human Review
 * @confidence 9/10 - Clear type definitions based on requirements
 * 
 * @see .implementation/Catalyst_tasks/phase-2.5-developer-experience/task-2.11-execution-logging.md
 * @see src/core/workflow/types.ts - Workflow types
 * 
 * PROBLEM SOLVED:
 * - Need type-safe definitions for execution history
 * - Support node-level execution tracking
 * - Enable querying and filtering of execution data
 * - Support per-project configuration
 * 
 * SOLUTION:
 * - Comprehensive TypeScript interfaces for executions
 * - Node execution tracking with input/output
 * - Error tracking at execution and node level
 * - Configuration types for retention and filtering
 * 
 * @security-critical false
 * @performance-critical false
 */

// ============================================================================
// EXECUTION STATUS
// ============================================================================

/**
 * Execution status values
 * Tracks the current state of a workflow execution
 */
export type ExecutionStatus = 'running' | 'success' | 'error';

/**
 * Node execution status values
 * More granular than workflow execution status
 */
export type NodeExecutionStatus = 'pending' | 'running' | 'success' | 'error' | 'skipped';

// ============================================================================
// TRIGGER INFORMATION
// ============================================================================

/**
 * Information about what triggered the workflow
 */
export interface TriggerInfo {
  /** Type of trigger (http, scheduled, manual, etc.) */
  type: string;
  
  /** Trigger-specific data (request body, cron data, etc.) */
  data: Record<string, any>;
  
  /**
   * Whether this trigger was simulated (vs real)
   * True when using RequestSimulator or pinned data
   * False when triggered by real HTTP request or scheduled event
   */
  isSimulated?: boolean;
}

// ============================================================================
// ERROR INFORMATION
// ============================================================================

/**
 * Error information for failed executions
 */
export interface ExecutionError {
  /** Error message */
  message: string;
  
  /** Stack trace (if available) */
  stack?: string;
  
  /** Node ID where error occurred (if applicable) */
  nodeId?: string;
}

// ============================================================================
// NODE EXECUTION
// ============================================================================

/**
 * Execution details for a single node
 * 
 * Tracks everything that happened during node execution:
 * - What data went in
 * - What data came out
 * - How long it took
 * - Any errors that occurred
 */
export interface NodeExecution {
  /** Node ID from workflow definition */
  nodeId: string;
  
  /** Display name of the node */
  nodeName: string;
  
  /** Node type (e.g., 'anthropicCompletion', 'httpRequest') */
  nodeType: string;
  
  /** Current execution status */
  status: NodeExecutionStatus;
  
  /** ISO 8601 timestamp when node started */
  startedAt?: string;
  
  /** ISO 8601 timestamp when node completed */
  completedAt?: string;
  
  /** Duration in milliseconds */
  durationMs?: number;
  
  /** Input data sent to the node */
  input: Record<string, any>;
  
  /** Output data returned by the node */
  output?: Record<string, any>;
  
  /** Error information if node failed */
  error?: Omit<ExecutionError, 'nodeId'>;
}

// ============================================================================
// WORKFLOW EXECUTION
// ============================================================================

/**
 * Complete execution record for a workflow
 * 
 * Contains all information about a workflow run:
 * - Overall execution metadata
 * - Trigger information
 * - Results from all nodes
 * - Any errors that occurred
 */
export interface WorkflowExecution {
  /** Unique execution ID (UUID) */
  id: string;
  
  /** Workflow ID from manifest */
  workflowId: string;
  
  /** Workflow display name */
  workflowName: string;
  
  /**
   * Execution mode: test or production
   * - 'test': Running locally in Catalyst for development/debugging
   * - 'production': Running on deployed server for real workloads
   */
  executionMode: 'test' | 'production';
  
  /** Overall execution status */
  status: ExecutionStatus;
  
  /** ISO 8601 timestamp when execution started */
  startedAt: string;
  
  /** ISO 8601 timestamp when execution completed */
  completedAt?: string;
  
  /** Total duration in milliseconds */
  durationMs?: number;
  
  /** Information about what triggered this execution */
  trigger: TriggerInfo;
  
  /** Execution details for each node */
  nodeExecutions: NodeExecution[];
  
  /** Error information if execution failed */
  error?: ExecutionError;
}

// ============================================================================
// EXECUTION LOGGING CONFIGURATION
// ============================================================================

/**
 * Configuration for execution logging per project
 * 
 * Allows users to control:
 * - Whether to log executions at all
 * - How long to keep execution history
 * - Which executions to log (all, success only, errors only)
 * - Optional limits on storage
 */
export interface ExecutionLoggingConfig {
  /** Master toggle for execution logging */
  enabled: boolean;
  
  /** 
   * Number of days to keep execution history
   * 0 = keep forever
   * Automatic cleanup runs on logger initialization
   */
  retentionDays: number;
  
  /** 
   * Which executions to log
   * - 'all': Log all executions (default)
   * - 'success': Only log successful executions
   * - 'error': Only log failed executions
   */
  logLevel: 'all' | 'success' | 'error';
  
  /** 
   * Optional: Maximum executions to keep per workflow
   * Oldest are deleted when limit is exceeded
   * 0 or undefined = no limit
   */
  maxExecutionsPerWorkflow?: number;
}

/**
 * Default execution logging configuration
 * Used when user hasn't set custom config
 */
export const DEFAULT_EXECUTION_LOGGING_CONFIG: ExecutionLoggingConfig = {
  enabled: true,
  retentionDays: 30,
  logLevel: 'all',
  maxExecutionsPerWorkflow: undefined,
};

// ============================================================================
// QUERY OPTIONS
// ============================================================================

/**
 * Options for querying execution history
 */
export interface ExecutionQueryOptions {
  /** Workflow ID to filter by */
  workflowId?: string;
  
  /** Execution status to filter by */
  status?: ExecutionStatus;
  
  /** Maximum number of results */
  limit?: number;
  
  /** Pagination offset */
  offset?: number;
  
  /** Sort order (default: newest first) */
  sortOrder?: 'asc' | 'desc';
}

// ============================================================================
// EXECUTION STATISTICS
// ============================================================================

/**
 * Statistical summary of executions for a workflow
 * Useful for dashboard and monitoring
 */
export interface ExecutionStats {
  /** Workflow ID */
  workflowId: string;
  
  /** Total number of executions */
  totalExecutions: number;
  
  /** Number of successful executions */
  successCount: number;
  
  /** Number of failed executions */
  errorCount: number;
  
  /** Number of currently running executions */
  runningCount: number;
  
  /** Average execution duration in milliseconds */
  avgDurationMs: number;
  
  /** Most recent execution timestamp */
  lastExecutedAt?: string;
}
