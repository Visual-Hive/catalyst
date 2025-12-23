/**
 * @file ExecutionHistoryPanel.tsx
 * @description Main execution history viewer panel with filtering and list
 * 
 * @architecture Phase 2.5, Task 2.12 - Execution History UI
 * @created 2025-12-21
 * @author AI (Cline) + Human Review
 * @confidence 9/10 - Standard React panel with filtering
 * 
 * @see .implementation/Catalyst_tasks/phase-2.5-developer-experience/task-2.12-execution-history-ui.md
 * @see electron/execution-handlers.ts - Backend IPC handlers
 * 
 * PROBLEM SOLVED:
 * - Users need to view workflow execution history
 * - Filter by workflow and status
 * - Auto-refresh to see live updates
 * - View detailed execution information
 * 
 * SOLUTION:
 * - Split panel: execution list (left) + details (right)
 * - Filter controls at top
 * - Auto-refresh toggle with persistence
 * - List items show key metadata
 * - Click to view full details
 * 
 * DESIGN DECISIONS:
 * - Master-detail layout (common pattern)
 * - Auto-refresh defaults to OFF (user opt-in)
 * - 5-second refresh interval (balance between updates and load)
 * - Empty state guidance for first-time users
 * 
 * @performance-critical false - queries are async and don't block UI
 * @security-critical false
 */

import React, { useEffect, useState, useCallback } from 'react';
import { ArrowPathIcon, FunnelIcon, XMarkIcon } from '@heroicons/react/24/outline';
import type { WorkflowExecution } from '../../../core/execution/types';
import { useAutoRefresh, useAutoRefreshState } from './hooks/useAutoRefresh';
import { ExecutionDetails } from './ExecutionDetails';
import { ExecutionListItem } from './ExecutionListItem';

/**
 * Props for ExecutionHistoryPanel
 */
interface ExecutionHistoryPanelProps {
  /** Current workflow ID (optional - can view all executions) */
  currentWorkflowId?: string;
}

/**
 * Filter state for execution query
 */
interface FilterState {
  workflowId?: string;
  status?: 'running' | 'success' | 'error';
  executionMode?: 'test' | 'production'; // Task 2.17
}

/**
 * Main execution history panel component
 * 
 * FEATURES:
 * - List all executions with filtering
 * - Auto-refresh with page visibility detection
 * - Master-detail layout
 * - Empty states for no data
 * - Loading states during queries
 * 
 * LAYOUT:
 * ```
 * ┌─────────────────────────────────────────┐
 * │ Filters & Auto-Refresh Toggle           │
 * ├──────────────────┬──────────────────────┤
 * │                  │                      │
 * │  Execution List  │  Execution Details   │
 * │                  │                      │
 * │  ┌────────────┐  │                      │
 * │  │ Item       │  │                      │
 * │  ├────────────┤  │                      │
 * │  │ Item       │  │                      │
 * │  └────────────┘  │                      │
 * │                  │                      │
 * └──────────────────┴──────────────────────┘
 * ```
 * 
 * USAGE:
 * ```tsx
 * // Show all executions
 * <ExecutionHistoryPanel />
 * 
 * // Filter to current workflow
 * <ExecutionHistoryPanel currentWorkflowId={workflow.id} />
 * ```
 */
export function ExecutionHistoryPanel({ currentWorkflowId }: ExecutionHistoryPanelProps) {
  // Executions data
  const [executions, setExecutions] = useState<WorkflowExecution[]>([]);
  const [selectedExecution, setSelectedExecution] = useState<WorkflowExecution | null>(null);
  
  // Loading and error states
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filter state
  const [filters, setFilters] = useState<FilterState>({
    workflowId: currentWorkflowId,
  });
  
  // Auto-refresh state (persisted in localStorage)
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useAutoRefreshState(
    'execution-history-auto-refresh',
    false // Default to OFF
  );
  
  /**
   * Load executions from backend
   * 
   * FLOW:
   * 1. Show loading state
   * 2. Query executions via IPC with current filters
   * 3. Update state with results
   * 4. Handle errors gracefully
   * 
   * TIMING: Called on mount, filter change, and auto-refresh
   */
  const loadExecutions = useCallback(async () => {
    try {
      setError(null);
      
      // Build query options from filters
      const queryOptions = {
        workflowId: filters.workflowId,
        status: filters.status,
        limit: 100, // Load last 100 executions
        sortOrder: 'desc' as const, // Newest first
      };
      
      // Call backend via IPC
      const result = await window.electronAPI.execution.query(queryOptions);
      
      // Update executions list
      setExecutions(result);
      
      // If selected execution is no longer in list, clear selection
      if (selectedExecution) {
        const stillExists = result.some(ex => ex.id === selectedExecution.id);
        if (!stillExists) {
          setSelectedExecution(null);
        } else {
          // Update selected execution with fresh data
          const updated = result.find(ex => ex.id === selectedExecution.id);
          if (updated) {
            setSelectedExecution(updated);
          }
        }
      }
      
    } catch (err) {
      // Handle query errors
      const message = err instanceof Error ? err.message : 'Failed to load executions';
      console.error('[ExecutionHistoryPanel] Load error:', message);
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [filters, selectedExecution]);
  
  /**
   * Handle manual refresh button click
   */
  const handleRefresh = useCallback(() => {
    setIsLoading(true);
    loadExecutions();
  }, [loadExecutions]);
  
  /**
   * Handle execution selection
   * Clicking an item in the list shows its details
   */
  const handleSelectExecution = useCallback((execution: WorkflowExecution) => {
    setSelectedExecution(execution);
  }, []);
  
  /**
   * Handle filter changes
   * Reset selection when filters change
   */
  const handleFilterChange = useCallback((newFilters: Partial<FilterState>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
    setSelectedExecution(null); // Clear selection when filtering
    setIsLoading(true);
  }, []);
  
  /**
   * Clear all filters
   */
  const handleClearFilters = useCallback(() => {
    setFilters({});
    setSelectedExecution(null);
    setIsLoading(true);
  }, []);
  
  // Load executions on mount and when filters change
  useEffect(() => {
    loadExecutions();
  }, [loadExecutions]);
  
  // Set up auto-refresh (5-second interval, pauses when tab hidden)
  useAutoRefresh(loadExecutions, {
    enabled: autoRefreshEnabled,
    interval: 5000,
    pauseWhenHidden: true,
  });
  
  // Check if any filters are active
  const hasActiveFilters = filters.workflowId || filters.status || filters.executionMode;
  
  // Apply client-side filtering for execution mode (Task 2.17)
  // The backend query doesn't support executionMode filtering yet,
  // so we filter client-side after loading
  const filteredExecutions = React.useMemo(() => {
    if (!filters.executionMode) {
      return executions;
    }
    return executions.filter(ex => ex.executionMode === filters.executionMode);
  }, [executions, filters.executionMode]);
  
  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header with filters and controls */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Execution History</h2>
          
          {/* Auto-refresh toggle */}
          <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
            <input
              type="checkbox"
              checked={autoRefreshEnabled}
              onChange={(e) => setAutoRefreshEnabled(e.target.checked)}
              className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
            />
            <span>Auto-refresh (5s)</span>
            {autoRefreshEnabled && (
              <ArrowPathIcon className="w-4 h-4 text-purple-600 animate-spin" />
            )}
          </label>
        </div>
        
        {/* Filters */}
        <div className="mt-3 flex items-center gap-3">
          <FunnelIcon className="w-4 h-4 text-gray-400" />
          
          {/* Status filter */}
          <select
            value={filters.status || ''}
            onChange={(e) => handleFilterChange({ 
              status: e.target.value ? e.target.value as any : undefined 
            })}
            className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
          >
            <option value="">All Statuses</option>
            <option value="success">Success</option>
            <option value="error">Error</option>
            <option value="running">Running</option>
          </select>
          
          {/* Execution Mode filter - Task 2.17 */}
          <select
            value={filters.executionMode || ''}
            onChange={(e) => handleFilterChange({ 
              executionMode: e.target.value ? e.target.value as any : undefined 
            })}
            className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
          >
            <option value="">All Modes</option>
            <option value="test">Test</option>
            <option value="production">Production</option>
          </select>
          
          {/* Manual refresh button */}
          <button
            onClick={handleRefresh}
            disabled={isLoading}
            className="text-sm px-3 py-1.5 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            title="Refresh executions"
          >
              <ArrowPathIcon className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          
          {/* Clear filters button */}
          {hasActiveFilters && (
            <button
              onClick={handleClearFilters}
              className="text-sm px-3 py-1.5 rounded-lg border border-gray-300 hover:bg-gray-50 flex items-center gap-2 text-gray-600"
              title="Clear all filters"
            >
              <XMarkIcon className="w-4 h-4" />
              Clear
            </button>
          )}
        </div>
      </div>
      
      {/* Error state */}
      {error && (
        <div className="mx-4 mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}
      
      {/* Main content area: split view */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left panel: Execution list */}
        <div className="w-1/3 border-r border-gray-200 bg-white overflow-y-auto">
          {/* Loading state */}
          {isLoading && filteredExecutions.length === 0 && (
            <div className="p-8 text-center">
              <ArrowPathIcon className="w-8 h-8 text-gray-400 animate-spin mx-auto mb-3" />
              <p className="text-sm text-gray-500">Loading executions...</p>
            </div>
          )}
          
          {/* Empty state */}
          {!isLoading && filteredExecutions.length === 0 && (
            <div className="p-8 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FunnelIcon className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-sm font-medium text-gray-900 mb-2">
                No Executions Found
              </h3>
              <p className="text-sm text-gray-500 mb-4">
                {hasActiveFilters
                  ? 'Try adjusting your filters or clearing them.'
                  : 'Execute a workflow to see execution history here.'}
              </p>
              {hasActiveFilters && (
                <button
                  onClick={handleClearFilters}
                  className="text-sm px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                >
                  Clear Filters
                </button>
              )}
            </div>
          )}
          
          {/* Execution list */}
          {filteredExecutions.length > 0 && (
            <div className="divide-y divide-gray-200">
              {filteredExecutions.map((execution) => (
                <ExecutionListItem
                  key={execution.id}
                  execution={execution}
                  isSelected={selectedExecution?.id === execution.id}
                  onClick={() => handleSelectExecution(execution)}
                />
              ))}
            </div>
          )}
        </div>
        
        {/* Right panel: Execution details */}
        <div className="flex-1 overflow-hidden">
          {selectedExecution ? (
            <ExecutionDetails execution={selectedExecution} />
          ) : (
            <div className="h-full flex items-center justify-center text-center p-8">
              <div>
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FunnelIcon className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-sm font-medium text-gray-900 mb-2">
                  No Execution Selected
                </h3>
                <p className="text-sm text-gray-500">
                  Select an execution from the list to view details
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
