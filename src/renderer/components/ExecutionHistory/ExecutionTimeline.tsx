/**
 * @file ExecutionTimeline.tsx
 * @description Visual timeline of workflow execution with expandable nodes
 * 
 * @architecture Phase 2.5, Task 2.12 - Execution History UI
 * @created 2025-12-21
 * @author AI (Cline) + Human Review
 * @confidence 8/10 - More complex UI with expand/collapse
 * 
 * @see .implementation/Catalyst_tasks/phase-2.5-developer-experience/task-2.12-execution-history-ui.md
 * @see ExecutionDetails.tsx - Parent component
 * 
 * PROBLEM SOLVED:
 * - Simple list doesn't show execution flow
 * - Users need to see node input/output data
 * - Debugging requires inspecting node-level details
 * - Timeline shows chronological execution order
 * 
 * SOLUTION:
 * - Vertical timeline with nodes in execution order
 * - Expandable nodes to show input/output
 * - Color-coded status indicators
 * - JSON viewer for data inspection
 * - Duration shown for each node
 * 
 * DESIGN DECISIONS:
 * - Collapse all nodes by default (cleaner)
 * - Show key metadata in collapsed state
 * - Pretty-print JSON when expanded
 * - Limit JSON height with scrolling
 * 
 * @performance-critical false - only renders one execution at a time
 * @security-critical false
 */

import React, { useState } from 'react';
import { ChevronDownIcon, ChevronRightIcon, CheckCircleIcon, XCircleIcon, ClockIcon, MinusIcon } from '@heroicons/react/24/outline';
import type { NodeExecution } from '../../../core/execution/types';

/**
 * Props for ExecutionTimeline
 */
interface ExecutionTimelineProps {
  /** Node executions to display in timeline */
  nodeExecutions: NodeExecution[];
}

/**
 * Props for TimelineNode (individual node in timeline)
 */
interface TimelineNodeProps {
  /** Node execution data */
  nodeExecution: NodeExecution;
  
  /** Whether this is the last node (affects line rendering) */
  isLast: boolean;
}

/**
 * Individual timeline node component with expand/collapse
 * 
 * Shows:
 * - Node status icon
 * - Node name and type
 * - Duration
 * - Input/output data (when expanded)
 * - Error details (if failed)
 */
function TimelineNode({ nodeExecution, isLast }: TimelineNodeProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Get status icon component
  const StatusIcon = (() => {
    switch (nodeExecution.status) {
      case 'success':
        return <CheckCircleIcon className="w-5 h-5 text-green-600" />;
      case 'error':
        return <XCircleIcon className="w-5 h-5 text-red-600" />;
      case 'running':
        return <ClockIcon className="w-5 h-5 text-blue-600 animate-spin" />;
      case 'skipped':
        return <MinusIcon className="w-5 h-5 text-yellow-600" />;
      case 'pending':
      default:
        return <div className="w-5 h-5 rounded-full border-2 border-gray-400" />;
    }
  })();
  
  return (
    <div className="flex gap-4">
      {/* Timeline line with status icon */}
      <div className="flex flex-col items-center flex-shrink-0">
        {/* Status icon */}
        <div className="flex-shrink-0">
          {StatusIcon}
        </div>
        
        {/* Connecting line (if not last node) */}
        {!isLast && (
          <div className="w-0.5 flex-1 bg-gray-300 my-1" style={{ minHeight: '20px' }} />
        )}
      </div>
      
      {/* Node content */}
      <div className="flex-1 pb-6">
        {/* Collapsible header */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full text-left hover:bg-gray-50 rounded-lg p-3 transition-colors"
        >
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              {/* Node name */}
              <div className="flex items-center gap-2">
                {isExpanded ? (
                  <ChevronDownIcon className="w-4 h-4 text-gray-400 flex-shrink-0" />
                ) : (
                  <ChevronRightIcon className="w-4 h-4 text-gray-400 flex-shrink-0" />
                )}
                <h4 className="font-medium text-gray-900 text-sm truncate">
                  {nodeExecution.nodeName}
                </h4>
              </div>
              
              {/* Node type and timing */}
              <div className="ml-6 mt-1 flex items-center gap-2 text-xs text-gray-500">
                <span className="font-mono bg-gray-100 px-2 py-0.5 rounded">
                  {nodeExecution.nodeType}
                </span>
                {nodeExecution.durationMs && (
                  <>
                    <span>•</span>
                    <span>{(nodeExecution.durationMs / 1000).toFixed(2)}s</span>
                  </>
                )}
              </div>
            </div>
            
            {/* Status badge */}
            <div className={`
              px-2 py-1 rounded text-xs font-medium flex-shrink-0
              ${nodeExecution.status === 'success' ? 'bg-green-100 text-green-700' : ''}
              ${nodeExecution.status === 'error' ? 'bg-red-100 text-red-700' : ''}
              ${nodeExecution.status === 'running' ? 'bg-blue-100 text-blue-700' : ''}
              ${nodeExecution.status === 'pending' ? 'bg-gray-200 text-gray-600' : ''}
              ${nodeExecution.status === 'skipped' ? 'bg-yellow-100 text-yellow-700' : ''}
            `}>
              {nodeExecution.status}
            </div>
          </div>
        </button>
        
        {/* Expanded content */}
        {isExpanded && (
          <div className="mt-3 ml-6 space-y-3">
            {/* Input data */}
            {Object.keys(nodeExecution.input).length > 0 && (
              <div>
                <h5 className="text-xs font-semibold text-gray-700 mb-1.5">Input</h5>
                <pre className="text-xs bg-gray-50 border border-gray-200 rounded p-3 overflow-auto max-h-48 font-mono">
                  {JSON.stringify(nodeExecution.input, null, 2)}
                </pre>
              </div>
            )}
            
            {/* Output data */}
            {nodeExecution.output && Object.keys(nodeExecution.output).length > 0 && (
              <div>
                <h5 className="text-xs font-semibold text-gray-700 mb-1.5">Output</h5>
                <pre className="text-xs bg-gray-50 border border-gray-200 rounded p-3 overflow-auto max-h-48 font-mono">
                  {JSON.stringify(nodeExecution.output, null, 2)}
                </pre>
              </div>
            )}
            
            {/* Error details */}
            {nodeExecution.error && (
              <div>
                <h5 className="text-xs font-semibold text-red-700 mb-1.5">Error</h5>
                <div className="bg-red-50 border border-red-200 rounded p-3">
                  <p className="text-xs text-red-800 font-mono whitespace-pre-wrap">
                    {nodeExecution.error.message}
                  </p>
                  {nodeExecution.error.stack && (
                    <details className="mt-2">
                      <summary className="text-xs text-red-600 cursor-pointer hover:underline">
                        Stack trace
                      </summary>
                      <pre className="text-xs text-red-700 mt-2 overflow-auto max-h-32 font-mono">
                        {nodeExecution.error.stack}
                      </pre>
                    </details>
                  )}
                </div>
              </div>
            )}
            
            {/* Timing details */}
            {(nodeExecution.startedAt || nodeExecution.completedAt) && (
              <div className="pt-2 border-t border-gray-200">
                <h5 className="text-xs font-semibold text-gray-700 mb-1.5">Timing</h5>
                <div className="text-xs text-gray-600 space-y-1">
                  {nodeExecution.startedAt && (
                    <div>
                      <span className="text-gray-500">Started:</span>{' '}
                      <span className="font-mono">
                        {new Date(nodeExecution.startedAt).toLocaleString()}
                      </span>
                    </div>
                  )}
                  {nodeExecution.completedAt && (
                    <div>
                      <span className="text-gray-500">Completed:</span>{' '}
                      <span className="font-mono">
                        {new Date(nodeExecution.completedAt).toLocaleString()}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Execution timeline component
 * 
 * FEATURES:
 * - Vertical timeline showing node execution order
 * - Visual status indicators
 * - Expandable nodes for detail inspection
 * - Input/output data viewing
 * - Error details display
 * - Timing information
 * 
 * LAYOUT:
 * ```
 * ● Success Node
 * │   - Node details
 * │   - Input/output when expanded
 * │
 * ● Error Node
 * │   - Error details
 * │
 * ● Pending Node
 * ```
 * 
 * USAGE:
 * ```tsx
 * <ExecutionTimeline nodeExecutions={execution.nodeExecutions} />
 * ```
 */
export function ExecutionTimeline({ nodeExecutions }: ExecutionTimelineProps) {
  // Show empty state if no nodes
  if (nodeExecutions.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-center">
        <div>
          <ClockIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-sm text-gray-500">No node executions recorded</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="py-4 px-6">
      {nodeExecutions.map((nodeExec, index) => (
        <TimelineNode
          key={`${nodeExec.nodeId}-${index}`}
          nodeExecution={nodeExec}
          isLast={index === nodeExecutions.length - 1}
        />
      ))}
    </div>
  );
}
