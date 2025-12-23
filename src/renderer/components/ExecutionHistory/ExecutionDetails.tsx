/**
 * @file ExecutionDetails.tsx
 * @description Execution details view with timeline and "Copy to Canvas" feature
 * 
 * @architecture Phase 2.5, Task 2.12 & 2.15
 * @created 2025-12-21
 * @author AI (Cline) + Human Review
 * @confidence 9/10 - Complete implementation with tabs
 * 
 * @see .implementation/Catalyst_tasks/phase-2.5-developer-experience/task-2.12-execution-history-ui.md
 * @see .implementation/Catalyst_tasks/phase-2.5-developer-experience/task-2.15-copy-execution.md
 * @see src/renderer/store/workflowStore.ts - pinNodeData method
 * 
 * PROBLEM SOLVED:
 * - Users need detailed execution inspection
 * - Two viewing modes: simple list and visual timeline
 * - Need to "freeze" execution data for testing (copy to canvas)
 * - Must handle large execution datasets gracefully
 * 
 * SOLUTION:
 * - Tab interface for Simple vs Timeline view
 * - Simple view: compact node list
 * - Timeline view: visual execution flow with expand/collapse
 * - "Copy to Canvas" button to pin all outputs
 * - Toast notifications for user feedback
 * 
 * DESIGN DECISIONS:
 * - Default to Simple view (faster to load)
 * - Timeline view for detailed debugging
 * - Sticky header with metadata and actions
 * - Copy button always visible in header
 * 
 * @performance-critical false
 * @security-critical false
 */

import React, { useState } from 'react';
import { DocumentDuplicateIcon, CheckCircleIcon, XCircleIcon, ClockIcon, ExclamationCircleIcon, ListBulletIcon, CodeBracketSquareIcon } from '@heroicons/react/24/outline';
import type { WorkflowExecution } from '../../../core/execution/types';
import { useWorkflowStore } from '../../store/workflowStore';
import { ExecutionTimeline } from './ExecutionTimeline';

/**
 * Props for ExecutionDetails component
 */
interface ExecutionDetailsProps {
  /** Execution to display */
  execution: WorkflowExecution;
}

/**
 * View mode for execution details
 */
type ViewMode = 'simple' | 'timeline';

/**
 * Execution details component with timeline and "Copy to Canvas" functionality
 * 
 * FEATURES:
 * - Two view modes: Simple (list) and Timeline (visual)
 * - Display execution metadata (status, duration, timestamp)
 * - "Copy to Canvas" button to pin all node data
 * - Toast notifications for user feedback
 * - Tab switching between views
 * 
 * LAYOUT:
 * ```
 * ┌─────────────────────────────────────┐
 * │ Header (metadata + copy button)     │
 * ├─────────────────────────────────────┤
 * │ [Simple] [Timeline] (tabs)          │
 * ├─────────────────────────────────────┤
 * │                                     │
 * │ Content (list or timeline)          │
 * │                                     │
 * └─────────────────────────────────────┘
 * ```
 * 
 * USAGE:
 * ```tsx
 * <ExecutionDetails execution={selectedExecution} />
 * ```
 */
export function ExecutionDetails({ execution }: ExecutionDetailsProps) {
  // View mode state
  const [viewMode, setViewMode] = useState<ViewMode>('simple');
  
  // Loading state for copy operation
  const [isCopying, setIsCopying] = useState(false);
  
  // Toast state (simple inline toast for now)
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  
  /**
   * Handle "Copy to Canvas" button click
   * 
   * FLOW:
   * 1. Call IPC handler to get node pins from execution
   * 2. Loop through nodePins and call pinNodeData() for each
   * 3. Show success toast with count
   * 4. Handle errors gracefully
   * 
   * TIMING: Async operation, typically <100ms
   */
  const handleCopyToCanvas = async () => {
    setIsCopying(true);
    setToast(null);
    
    try {
      // Call IPC handler to get formatted node data
      const result = await window.electronAPI.execution.copyToCanvas(execution.id);
      
      if (!result.success || !result.data) {
        // Show error toast
        setToast({
          type: 'error',
          message: result.error || 'Failed to copy execution data',
        });
        return;
      }
      
      const { workflowId, nodePins } = result.data;
      
      // Pin all node data to the workflow store
      // This uses the existing pinNodeData() method from Task 2.13
      for (const pin of nodePins) {
        useWorkflowStore.getState().pinNodeData(workflowId, pin.nodeId, pin.data);
      }
      
      // Show success toast
      setToast({
        type: 'success',
        message: `Pinned data from ${nodePins.length} node${nodePins.length !== 1 ? 's' : ''} to canvas`,
      });
      
      // Auto-hide toast after 3 seconds
      setTimeout(() => setToast(null), 3000);
      
    } catch (error) {
      // Handle unexpected errors
      const message = error instanceof Error ? error.message : 'Unknown error';
      console.error('[ExecutionDetails] Error copying to canvas:', message);
      
      setToast({
        type: 'error',
        message: 'Failed to copy execution data',
      });
    } finally {
      setIsCopying(false);
    }
  };
  
  // Calculate duration in seconds
  const durationSeconds = execution.durationMs ? (execution.durationMs / 1000).toFixed(2) : 'N/A';
  
  // Format timestamp
  const formattedTime = new Date(execution.startedAt).toLocaleString();
  
  // Count successful nodes
  const successfulNodes = execution.nodeExecutions.filter(ne => ne.status === 'success').length;
  
  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-gray-900">
              {execution.workflowName}
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Executed {formattedTime}
            </p>
          </div>
          
          {/* Status badge */}
          <div className={`
            px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1.5
            ${execution.status === 'success' ? 'bg-green-100 text-green-800' : ''}
            ${execution.status === 'error' ? 'bg-red-100 text-red-800' : ''}
            ${execution.status === 'running' ? 'bg-blue-100 text-blue-800' : ''}
          `}>
            {execution.status === 'success' && <CheckCircleIcon className="w-4 h-4" />}
            {execution.status === 'error' && <XCircleIcon className="w-4 h-4" />}
            {execution.status === 'running' && <ClockIcon className="w-4 h-4 animate-spin" />}
            {execution.status.charAt(0).toUpperCase() + execution.status.slice(1)}
          </div>
        </div>
        
        {/* Metadata */}
        <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-500">Duration:</span>
            <span className="ml-2 font-medium">{durationSeconds}s</span>
          </div>
          <div>
            <span className="text-gray-500">Nodes:</span>
            <span className="ml-2 font-medium">
              {successfulNodes}/{execution.nodeExecutions.length}
            </span>
          </div>
        </div>
        
        {/* Copy to Canvas button */}
        <button
          onClick={handleCopyToCanvas}
          disabled={isCopying || successfulNodes === 0}
          className={`
            mt-4 w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg
            font-medium text-sm transition-colors
            ${isCopying || successfulNodes === 0
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-purple-600 text-white hover:bg-purple-700 active:bg-purple-800'
            }
          `}
          title={
            successfulNodes === 0
              ? 'No successful nodes to copy'
              : 'Pin all node outputs to canvas for testing'
          }
        >
          <DocumentDuplicateIcon className="w-4 h-4" />
          {isCopying ? 'Copying...' : 'Copy to Canvas'}
        </button>
        
        {successfulNodes === 0 && execution.status !== 'running' && (
          <p className="mt-2 text-xs text-gray-500 text-center">
            No successful node outputs to copy
          </p>
        )}
      </div>
      
      {/* Toast notification */}
      {toast && (
        <div className={`
          mx-4 mt-4 p-3 rounded-lg flex items-start gap-2
          ${toast.type === 'success' ? 'bg-green-50 border border-green-200' : ''}
          ${toast.type === 'error' ? 'bg-red-50 border border-red-200' : ''}
        `}>
          {toast.type === 'success' ? (
            <CheckCircleIcon className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
          ) : (
            <ExclamationCircleIcon className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          )}
          <div className="flex-1">
            <p className={`text-sm font-medium ${
              toast.type === 'success' ? 'text-green-800' : 'text-red-800'
            }`}>
              {toast.message}
            </p>
          </div>
        </div>
      )}
      
      {/* View mode tabs */}
      <div className="border-b border-gray-200 bg-white">
        <div className="flex items-center px-4">
          {/* Simple view tab */}
          <button
            onClick={() => setViewMode('simple')}
            className={`
              flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors
              ${viewMode === 'simple'
                ? 'border-purple-600 text-purple-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }
            `}
          >
            <ListBulletIcon className="w-4 h-4" />
            Simple
          </button>
          
          {/* Timeline view tab */}
          <button
            onClick={() => setViewMode('timeline')}
            className={`
              flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors
              ${viewMode === 'timeline'
                ? 'border-purple-600 text-purple-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }
            `}
          >
            <CodeBracketSquareIcon className="w-4 h-4" />
            Timeline
          </button>
        </div>
      </div>
      
      {/* Content area (view-dependent) */}
      <div className="flex-1 overflow-y-auto">
        {viewMode === 'simple' ? (
          /* Simple view: Node list */
          <div className="p-4">
            <div className="space-y-2">
              {execution.nodeExecutions.map((nodeExec, index) => (
                <div
                  key={index}
                  className="p-3 bg-gray-50 rounded-lg border border-gray-200"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">
                        {nodeExec.nodeName}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {nodeExec.nodeType}
                      </p>
                    </div>
                    
                    {/* Node status */}
                    <div className={`
                      px-2 py-1 rounded text-xs font-medium
                      ${nodeExec.status === 'success' ? 'bg-green-100 text-green-700' : ''}
                      ${nodeExec.status === 'error' ? 'bg-red-100 text-red-700' : ''}
                      ${nodeExec.status === 'running' ? 'bg-blue-100 text-blue-700' : ''}
                      ${nodeExec.status === 'pending' ? 'bg-gray-200 text-gray-600' : ''}
                      ${nodeExec.status === 'skipped' ? 'bg-yellow-100 text-yellow-700' : ''}
                    `}>
                      {nodeExec.status}
                    </div>
                  </div>
                  
                  {/* Duration */}
                  {nodeExec.durationMs && (
                    <p className="text-xs text-gray-500 mt-2">
                      {(nodeExec.durationMs / 1000).toFixed(2)}s
                    </p>
                  )}
                  
                  {/* Error message */}
                  {nodeExec.error && (
                    <p className="text-xs text-red-600 mt-2 font-mono">
                      {nodeExec.error.message}
                    </p>
                  )}
                </div>
              ))}
            </div>
            
            {execution.nodeExecutions.length === 0 && (
              <p className="text-sm text-gray-500 text-center py-8">
                No node executions recorded
              </p>
            )}
          </div>
        ) : (
          /* Timeline view: Visual timeline with expand/collapse */
          <ExecutionTimeline nodeExecutions={execution.nodeExecutions} />
        )}
      </div>
      
      {/* Error details (if execution failed) */}
      {execution.error && (
        <div className="p-4 border-t border-gray-200 bg-red-50">
          <h3 className="text-sm font-semibold text-red-900 flex items-center gap-2">
            <XCircleIcon className="w-4 h-4" />
            Execution Error
          </h3>
          <p className="text-sm text-red-700 mt-2 font-mono">
            {execution.error.message}
          </p>
          {execution.error.nodeId && (
            <p className="text-xs text-red-600 mt-1">
              Failed at node: {execution.error.nodeId}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
