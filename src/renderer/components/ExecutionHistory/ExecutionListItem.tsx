/**
 * @file ExecutionListItem.tsx
 * @description List item component for execution history
 * 
 * @architecture Phase 2.5, Task 2.12 - Execution History UI
 * @created 2025-12-21
 * @author AI (Cline) + Human Review
 * @confidence 9/10 - Simple presentational component
 * 
 * @see .implementation/Catalyst_tasks/phase-2.5-developer-experience/task-2.12-execution-history-ui.md
 * @see ExecutionHistoryPanel.tsx - Parent component
 * 
 * PROBLEM SOLVED:
 * - Need compact representation of execution for list view
 * - Show key info at a glance (status, time, duration)
 * - Visual feedback for selection
 * - Clear status indicators
 * 
 * SOLUTION:
 * - Compact card layout with key metadata
 * - Color-coded status badges
 * - Hover and selected states
 * - Relative time display (e.g., "2 minutes ago")
 * 
 * DESIGN DECISIONS:
 * - Show workflow name (might be filtering by workflow)
 * - Relative time more useful than absolute time in list
 * - Node count gives sense of execution size
 * - Duration helps identify slow executions
 * 
 * @performance-critical false
 * @security-critical false
 */

import React from 'react';
import { CheckCircleIcon, XCircleIcon, ClockIcon } from '@heroicons/react/24/outline';
import type { WorkflowExecution } from '../../../core/execution/types';

/**
 * Props for ExecutionListItem
 */
interface ExecutionListItemProps {
  /** Execution to display */
  execution: WorkflowExecution;
  
  /** Whether this item is currently selected */
  isSelected: boolean;
  
  /** Click handler to select this execution */
  onClick: () => void;
}

/**
 * Format timestamp as relative time (e.g., "2 minutes ago")
 * 
 * @param isoTimestamp - ISO 8601 timestamp string
 * @returns Relative time string
 * 
 * EXAMPLES:
 * - "Just now" (< 1 minute)
 * - "2 minutes ago"
 * - "1 hour ago"
 * - "Yesterday"
 * - "3 days ago"
 * - "Jan 15" (older than 7 days)
 */
function formatRelativeTime(isoTimestamp: string): string {
  const date = new Date(isoTimestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);
  
  // Less than 1 minute
  if (diffSeconds < 60) {
    return 'Just now';
  }
  
  // Less than 1 hour
  if (diffMinutes < 60) {
    return `${diffMinutes} minute${diffMinutes !== 1 ? 's' : ''} ago`;
  }
  
  // Less than 24 hours
  if (diffHours < 24) {
    return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
  }
  
  // Less than 7 days
  if (diffDays < 7) {
    if (diffDays === 1) {
      return 'Yesterday';
    }
    return `${diffDays} days ago`;
  }
  
  // Older than 7 days - show date
  return date.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
  });
}

/**
 * Format duration from milliseconds to readable string
 * 
 * @param durationMs - Duration in milliseconds
 * @returns Formatted duration string
 * 
 * EXAMPLES:
 * - "0.5s" (< 1 second)
 * - "2.3s" (< 60 seconds)
 * - "1m 5s" (< 60 minutes)
 * - "2m 30s"
 */
function formatDuration(durationMs: number | undefined): string {
  if (!durationMs) {
    return 'N/A';
  }
  
  const seconds = durationMs / 1000;
  
  // Less than 60 seconds - show seconds only
  if (seconds < 60) {
    return `${seconds.toFixed(1)}s`;
  }
  
  // 60+ seconds - show minutes and seconds
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}m ${remainingSeconds}s`;
}

/**
 * Execution list item component
 * 
 * FEATURES:
 * - Compact layout with key info
 * - Status indicator with icon and color
 * - Relative time display
 * - Node count
 * - Duration
 * - Hover and selected states
 * 
 * USAGE:
 * ```tsx
 * <ExecutionListItem
 *   execution={execution}
 *   isSelected={selectedId === execution.id}
 *   onClick={() => setSelected(execution)}
 * />
 * ```
 */
export function ExecutionListItem({ 
  execution, 
  isSelected, 
  onClick 
}: ExecutionListItemProps) {
  // Calculate success count for display
  const successfulNodes = execution.nodeExecutions.filter(
    ne => ne.status === 'success'
  ).length;
  
  const totalNodes = execution.nodeExecutions.length;
  
  return (
    <button
      onClick={onClick}
      className={`
        w-full text-left p-4 transition-colors
        hover:bg-gray-50 cursor-pointer
        ${isSelected ? 'bg-purple-50 border-l-4 border-l-purple-600' : 'border-l-4 border-l-transparent'}
      `}
    >
      {/* Header: workflow name, mode badge, and status */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <h3 className="font-medium text-gray-900 text-sm truncate">
            {execution.workflowName}
          </h3>
          
          {/* Execution Mode Badge - Task 2.17 */}
          <span className={`
            text-[10px] font-semibold px-1.5 py-0.5 rounded uppercase flex-shrink-0
            ${execution.executionMode === 'production' 
              ? 'bg-blue-100 text-blue-700' 
              : 'bg-gray-100 text-gray-600'
            }
          `}>
            {execution.executionMode === 'production' ? 'PROD' : 'TEST'}
          </span>
          
          {/* Simulated Request Indicator */}
          {execution.trigger?.isSimulated && (
            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded uppercase flex-shrink-0 bg-purple-100 text-purple-700">
              SIM
            </span>
          )}
        </div>
        
        {/* Status icon */}
        {execution.status === 'success' && (
          <CheckCircleIcon className="w-4 h-4 text-green-600 flex-shrink-0" />
        )}
        {execution.status === 'error' && (
          <XCircleIcon className="w-4 h-4 text-red-600 flex-shrink-0" />
        )}
        {execution.status === 'running' && (
          <ClockIcon className="w-4 h-4 text-blue-600 flex-shrink-0 animate-spin" />
        )}
      </div>
      
      {/* Metadata row */}
      <div className="flex items-center gap-3 text-xs text-gray-500">
        {/* Relative time */}
        <span>{formatRelativeTime(execution.startedAt)}</span>
        
        {/* Separator */}
        <span>•</span>
        
        {/* Duration */}
        <span>{formatDuration(execution.durationMs)}</span>
        
        {/* Separator */}
        <span>•</span>
        
        {/* Node count */}
        <span className={
          execution.status === 'error' && successfulNodes < totalNodes
            ? 'text-red-600 font-medium'
            : ''
        }>
          {successfulNodes}/{totalNodes} nodes
        </span>
      </div>
      
      {/* Error indicator */}
      {execution.error && (
        <div className="mt-2 text-xs text-red-600 truncate">
          {execution.error.message}
        </div>
      )}
    </button>
  );
}
