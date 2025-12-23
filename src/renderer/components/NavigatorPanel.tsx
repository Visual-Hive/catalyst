/**
 * @file NavigatorPanel.tsx
 * @description Left navigator panel with project info and workflow/file management
 * 
 * @architecture Phase 2.5, Task 2.10 - Navigator Refactor for Catalyst
 * @created 2025-11-19
 * @updated 2025-12-21 - Removed RISE components, added Workflows tab
 * @author AI (Cline) + Human Review
 * @confidence 9/10 - Clean workflow-focused navigator
 * 
 * PROBLEM SOLVED:
 * - Display current project information
 * - List workflows in project for quick switching
 * - Show project file structure (for viewing generated code)
 * - Provide empty state when no project is open
 * 
 * SOLUTION:
 * - Project info section (name, path)
 * - Workflows tab: List of workflows with activation
 * - Files tab: File tree with lazy loading
 * - Empty state with CTA button
 * - Integration with workflowStore (not RISE stores)
 * 
 * SECTIONS:
 * - PROJECT INFO: Current project name and path
 * - WORKFLOWS: List of workflows with node counts
 * - FILES: Expandable file tree showing .catalyst/ folder and generated Python code
 * - EMPTY STATE: Shown when no project open
 * 
 * @performance O(1) for panel, O(n) for file tree where n = visible nodes
 * @security-critical false
 * @performance-critical false
 */

import React, { useState, useCallback } from 'react';
import { 
  FolderIcon, 
  PlusIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
  ArrowPathIcon,
  Square3Stack3DIcon,
  PlayIcon,
} from '@heroicons/react/24/outline';
import { useProjectStore } from '../store/projectStore';
import { useWorkflowStore } from '../store/workflowStore';
import { FileTree } from './FileTree/FileTree';

/**
 * Navigator Panel component
 * 
 * Left sidebar that displays:
 * - Current project information (when project is open)
 * - Workflows tab: List of workflows with switching capability
 * - Files tab: File explorer showing .catalyst/ structure and generated Python code
 * - Search functionality for filtering workflows and files
 * - Empty state with action button (when no project)
 * 
 * @returns NavigatorPanel component
 * 
 * @example
 * ```typescript
 * <Panel id="navigator">
 *   <NavigatorPanel />
 * </Panel>
 * ```
 */
export function NavigatorPanel() {
  // Get current project from store
  const currentProject = useProjectStore((state) => state.currentProject);
  const openDialog = useProjectStore((state) => state.openDialog);
  
  // Get workflows from workflowStore manifest
  // manifest.workflows is a Record<string, WorkflowDefinition>, convert to array
  const workflows = useWorkflowStore((state) => 
    state.manifest ? Object.values(state.manifest.workflows) : []
  );
  const activeWorkflowId = useWorkflowStore((state) => state.activeWorkflowId);
  const setActiveWorkflow = useWorkflowStore((state) => state.setActiveWorkflow);
  const createWorkflow = useWorkflowStore((state) => state.createWorkflow);
  
  // Tab state ('files' | 'workflows')
  const [activeTab, setActiveTab] = useState<'files' | 'workflows'>('workflows');
  
  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);

  /**
   * Handle search input change
   * Uses debouncing via React state - the FileTree will handle the filtering
   */
  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  }, []);

  /**
   * Clear search query
   */
  const handleClearSearch = useCallback(() => {
    setSearchQuery('');
  }, []);

  /**
   * Handle refresh button click (for Files tab)
   */
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    
    // Trigger refresh via window-stored function (from FileTree)
    const refreshFn = (window as any).__fileTreeRefresh;
    if (refreshFn && typeof refreshFn === 'function') {
      await refreshFn();
    }
    
    // Add small delay for visual feedback
    setTimeout(() => {
      setIsRefreshing(false);
    }, 300);
  }, []);

  /**
   * Callback when FileTree refresh completes
   */
  const handleRefreshComplete = useCallback(() => {
    setIsRefreshing(false);
  }, []);

  /**
   * Handle tab change
   */
  const handleTabChange = useCallback((tab: 'files' | 'workflows') => {
    setActiveTab(tab);
    setSearchQuery(''); // Clear search when switching tabs
  }, []);

  /**
   * Handle create new workflow
   */
  const handleCreateWorkflow = useCallback(() => {
    createWorkflow('New Workflow');
  }, [createWorkflow]);

  /**
   * Handle workflow activation
   */
  const handleActivateWorkflow = useCallback((workflowId: string) => {
    setActiveWorkflow(workflowId);
  }, [setActiveWorkflow]);

  // No project open - show empty state
  if (!currentProject) {
    return (
      <div
        className="h-full flex flex-col items-center justify-center bg-gray-50 px-6"
        data-panel-id="navigator"
      >
        {/* Empty State */}
        <div className="max-w-sm text-center">
          {/* Icon */}
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
              <FolderIcon className="w-8 h-8 text-blue-600" />
            </div>
          </div>

          {/* Text */}
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No Project Open
          </h3>
          <p className="text-sm text-gray-600 mb-6">
            Create a new project or open an existing one to get started building workflows with Catalyst.
          </p>

          {/* Action Button */}
          <button
            onClick={openDialog}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            <PlusIcon className="w-5 h-5" />
            Create New Project
          </button>

          {/* Hint */}
          <p className="mt-4 text-xs text-gray-500">
            Or use <kbd className="px-1.5 py-0.5 bg-gray-200 rounded text-gray-700">Cmd+N</kbd> to create
          </p>
        </div>
      </div>
    );
  }

  // Project is open - show project info and tabs
  return (
    <div
      className="h-full flex flex-col bg-gray-50"
      data-panel-id="navigator"
      tabIndex={-1}
    >
      {/* Panel Header */}
      <div className="px-4 py-3 border-b border-gray-200 bg-white">
        <h2 className="text-sm font-semibold text-gray-900">Navigator</h2>
      </div>

      {/* Panel Content - Scrollable */}
      <div className="flex-1 overflow-y-auto scrollbar-thin">
        {/* Project Info Section */}
        <section className="p-4 border-b border-gray-200 bg-white">
          <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
            Project
          </h3>
          <div>
            <p className="text-sm font-semibold text-gray-900 truncate">
              {currentProject.name}
            </p>
            <p className="text-xs text-gray-500 truncate mt-0.5" title={currentProject.path}>
              {currentProject.path}
            </p>
          </div>
        </section>

        {/* Tabs */}
        <section className="border-b border-gray-200 bg-white">
          <div className="flex">
            <button
              onClick={() => handleTabChange('workflows')}
              className={`
                flex-1 px-4 py-3 text-sm font-medium border-b-2 transition-colors
                ${activeTab === 'workflows'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
                }
              `}
            >
              <div className="flex items-center justify-center gap-2">
                <Square3Stack3DIcon className="w-4 h-4" />
                <span>Workflows</span>
                {workflows.length > 0 && (
                  <span className="text-xs text-gray-500">
                    {workflows.length}
                  </span>
                )}
              </div>
            </button>
            <button
              onClick={() => handleTabChange('files')}
              className={`
                flex-1 px-4 py-3 text-sm font-medium border-b-2 transition-colors
                ${activeTab === 'files'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
                }
              `}
            >
              <div className="flex items-center justify-center gap-2">
                <FolderIcon className="w-4 h-4" />
                <span>Files</span>
              </div>
            </button>
          </div>
        </section>

        {/* Tab Content: Workflows */}
        {activeTab === 'workflows' && (
          <section className="flex-1 flex flex-col">
            {/* Workflows Header */}
            <div className="p-4 border-b border-gray-200 bg-white">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Workflows
                </h3>
              
                {/* Create Workflow Button */}
                <button
                  onClick={handleCreateWorkflow}
                  className="p-1 rounded hover:bg-gray-100 transition-colors"
                  title="Create new workflow"
                >
                  <PlusIcon className="w-4 h-4 text-gray-600" />
                </button>
              </div>
              
              {/* Search Input */}
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
                  <MagnifyingGlassIcon className="w-4 h-4 text-gray-400" />
                </div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={handleSearchChange}
                  placeholder="Search workflows..."
                  className="
                    w-full pl-8 pr-8 py-1.5 text-sm
                    border border-gray-300 rounded
                    focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                    placeholder-gray-400
                  "
                />
                {searchQuery && (
                  <button
                    onClick={handleClearSearch}
                    className="absolute inset-y-0 right-0 pr-2 flex items-center hover:bg-gray-100 rounded-r"
                    title="Clear search"
                  >
                    <XMarkIcon className="w-4 h-4 text-gray-400 hover:text-gray-600" />
                  </button>
                )}
              </div>
            </div>
            
            {/* Workflow List */}
            <div className="flex-1 overflow-y-auto p-2">
              {workflows.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center px-4 py-8">
                  <Square3Stack3DIcon className="w-12 h-12 text-gray-300 mb-3" />
                  <p className="text-sm text-gray-600 mb-4">No workflows yet</p>
                  <button
                    onClick={handleCreateWorkflow}
                    className="inline-flex items-center gap-2 px-3 py-2 bg-blue-600 text-white text-sm font-medium rounded hover:bg-blue-700 transition-colors"
                  >
                    <PlusIcon className="w-4 h-4" />
                    Create Workflow
                  </button>
                </div>
              ) : (
                <div className="space-y-1">
                  {workflows
                    .filter(w => 
                      searchQuery === '' || 
                      w.name.toLowerCase().includes(searchQuery.toLowerCase())
                    )
                    .map(workflow => {
                      const nodeCount = Object.keys(workflow.nodes).length;
                      const isActive = workflow.id === activeWorkflowId;
                      
                      return (
                        <button
                          key={workflow.id}
                          onClick={() => handleActivateWorkflow(workflow.id)}
                          className={`
                            w-full flex items-center gap-2 p-3 rounded text-left transition-colors
                            ${isActive
                              ? 'bg-blue-50 border-2 border-blue-500'
                              : 'bg-white border border-gray-200 hover:bg-gray-50'
                            }
                          `}
                        >
                          <div className="flex-shrink-0">
                            {isActive ? (
                              <PlayIcon className="w-5 h-5 text-blue-600" />
                            ) : (
                              <Square3Stack3DIcon className="w-5 h-5 text-gray-400" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm font-medium truncate ${isActive ? 'text-blue-900' : 'text-gray-900'}`}>
                              {workflow.name}
                            </p>
                            <p className="text-xs text-gray-500">
                              {nodeCount} {nodeCount === 1 ? 'node' : 'nodes'}
                            </p>
                          </div>
                        </button>
                      );
                    })}
                </div>
              )}
            </div>
          </section>
        )}

        {/* Tab Content: Files */}
        {activeTab === 'files' && (
          <section className="flex-1 flex flex-col">
            {/* Files Header with Search and Refresh */}
            <div className="p-4 border-b border-gray-200 bg-white">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                  File Explorer
                </h3>
              
                {/* Refresh Button */}
                <button
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                  className={`
                    p-1 rounded hover:bg-gray-100 transition-colors
                    ${isRefreshing ? 'opacity-50 cursor-not-allowed' : ''}
                  `}
                  title="Refresh file tree (⌘R)"
                >
                  <ArrowPathIcon 
                    className={`
                      w-4 h-4 text-gray-600
                      ${isRefreshing ? 'animate-spin' : ''}
                    `}
                  />
                </button>
              </div>
              
              {/* Search Input */}
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
                  <MagnifyingGlassIcon className="w-4 h-4 text-gray-400" />
                </div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={handleSearchChange}
                  placeholder="Search files... (*.py, /regex/)"
                  className="
                    w-full pl-8 pr-8 py-1.5 text-sm
                    border border-gray-300 rounded
                    focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                    placeholder-gray-400
                  "
                />
                {searchQuery && (
                  <button
                    onClick={handleClearSearch}
                    className="absolute inset-y-0 right-0 pr-2 flex items-center hover:bg-gray-100 rounded-r"
                    title="Clear search"
                  >
                    <XMarkIcon className="w-4 h-4 text-gray-400 hover:text-gray-600" />
                  </button>
                )}
              </div>
              
              {/* Search hint */}
              {!searchQuery && (
                <p className="mt-1.5 text-xs text-gray-500">
                  .catalyst/ folder contains manifest and generated Python
                </p>
              )}
            </div>
            
            {/* File Tree */}
            <div className="flex-1 overflow-y-auto p-4">
              <FileTree 
                projectPath={currentProject.path}
                searchQuery={searchQuery}
                onRefreshComplete={handleRefreshComplete}
              />
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
