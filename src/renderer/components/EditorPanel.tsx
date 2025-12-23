/**
 * @file EditorPanel.tsx
 * @description Center editor panel with Workflow canvas
 * 
 * REFACTORED: Simplified from RISE's multi-tab interface to focus on workflow editing.
 * 
 * LAYOUT STRUCTURE:
 * ┌────────────────────────────────────────┐
 * │ Tab List (auto height)                 │ ← grid-rows: auto
 * ├────────────────────────────────────────┤
 * │                                        │
 * │ WorkflowCanvas (fills space)           │ ← grid-rows: 1fr
 * │                                        │
 * └────────────────────────────────────────┘
 * 
 * @architecture Phase 2.5, Task 2.10 - WorkflowCanvas Integration
 * @created 2025-11-19
 * @updated 2025-11-25 - Added PreviewPanel integration (Task 1.4B)
 * @updated 2025-11-30 - Refactored to CSS Grid for height fix (Task 3.8)
 * @updated 2025-12-21 - Replaced RISE tabs with Workflow canvas
 * @author AI (Cline) + Human Review
 * @confidence 9/10 - CSS Grid layout for reliable height handling
 * 
 * PROBLEM SOLVED:
 * - Transform RISE's React app builder UI into Catalyst's workflow builder
 * - Single-focus interface for visual workflow editing
 * - Clean integration of WorkflowCanvas component
 * - FIXED: Nested flexbox height collapse issue by using CSS Grid
 * 
 * SOLUTION:
 * - CSS Grid with grid-rows-[auto_1fr] for reliable height handling
 * - Row 1 (auto): Tab list takes its natural height
 * - Row 2 (1fr): Tab content fills all remaining space
 * - Single "Workflow" tab with WorkflowCanvas component
 * - Code/Console tabs deferred to later phases (2.6+)
 * 
 * TABS:
 * - Workflow: Visual node-based workflow editor
 * - Executions: Execution history viewer (Task 2.12)
 * - (Future) Code: Generated Python code viewer
 * - (Future) Console: Workflow execution logs
 * 
 * @performance O(1) tab switching, lazy loading of tab content
 * @security-critical false
 * @performance-critical false
 */

import { Tab } from '@headlessui/react';
import { Square3Stack3DIcon, ClockIcon } from '@heroicons/react/24/outline';
import { useLayout } from '../hooks/useLayout';
import { useHotkeys } from 'react-hotkeys-hook';
import { WorkflowCanvas } from './WorkflowCanvas/WorkflowCanvas';
import { ExecutionHistoryPanel } from './ExecutionHistory';
import { useWorkflowStore } from '../store/workflowStore';


/**
 * Editor Panel component
 * 
 * Center panel containing the visual workflow editor.
 * Uses CSS Grid with `grid-rows-[auto_1fr]` for reliable height handling:
 * - Row 1 (auto): Tab list takes its natural height
 * - Row 2 (1fr): Tab content fills all remaining space
 * 
 * This avoids the nested flexbox height collapse issue that occurred with flex-1 chains.
 * 
 * SIMPLIFIED: Single "Workflow" tab focusing on visual workflow building.
 * Code/Console tabs will be added back in Phase 2.6+ for debugging/deployment.
 * 
 * KEYBOARD SHORTCUTS:
 * - Cmd+Shift+W: Focus Workflow tab (always selected in current version)
 * 
 * @returns EditorPanel component
 * 
 * @example
 * ```typescript
 * <Panel id="editor">
 *   <EditorPanel />
 * </Panel>
 * ```
 */
export function EditorPanel() {
  const { activeTab, setActiveTab } = useLayout();
  
  // Get active workflow ID from store
  // WorkflowCanvas requires this to load the correct workflow
  const activeWorkflowId = useWorkflowStore((state) => state.activeWorkflowId);

  // Map activeTab to tab index
  // 0 = workflow, 1 = executions
  const selectedIndex = activeTab === 'executions' ? 1 : 0;

  // Keyboard shortcut for workflow focus
  useHotkeys('mod+shift+w', (e) => {
    e.preventDefault();
    setActiveTab('workflow');
  }, [setActiveTab]);
  
  // Keyboard shortcut for executions focus
  useHotkeys('mod+shift+e', (e) => {
    e.preventDefault();
    setActiveTab('executions');
  }, [setActiveTab]);
  
  // If no active workflow, show empty state
  // This can happen on first launch or after deleting all workflows
  if (!activeWorkflowId) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Square3Stack3DIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-700 mb-2">
            No Workflow Selected
          </h3>
          <p className="text-gray-500 text-sm">
            Create a new workflow or select an existing one from the navigator
          </p>
        </div>
      </div>
    );
  }

  return (
    // CRITICAL: Use CSS Grid instead of flexbox for reliable height
    // grid-rows-[auto_1fr] = tab list auto-sized, content fills rest
    <div
      className="h-full w-full overflow-hidden bg-white"
      data-panel="editor"
      tabIndex={-1}
    >
      <Tab.Group 
        selectedIndex={selectedIndex} 
        onChange={(index) => setActiveTab(index === 0 ? 'workflow' : 'executions')}
        className="h-full overflow-hidden"
      >
        {/* Tab List - auto height (first grid row) */}
        <Tab.List className="flex items-center gap-1 px-4 py-2 bg-gray-50 border-b border-gray-200">
          {/* Workflow Tab */}
          <Tab
            className={({ selected }) =>
              `flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-t transition-colors
              ${
                selected
                  ? 'bg-white text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`
            }
          >
            <Square3Stack3DIcon className="w-4 h-4" />
            <span>Workflow</span>
          </Tab>
          
          {/* Executions Tab */}
          <Tab
            className={({ selected }) =>
              `flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-t transition-colors
              ${
                selected
                  ? 'bg-white text-purple-600 border-b-2 border-purple-600'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`
            }
          >
            <ClockIcon className="w-4 h-4" />
            <span>Executions</span>
          </Tab>
        </Tab.List>

        {/* Tab Panels Container - fills remaining space (second grid row) */}
        {/* CRITICAL: h-full + overflow-hidden ensures content is clipped, not expanding */}
        <Tab.Panels className="h-full overflow-hidden">
          {/* Workflow Tab Panel - contains the visual workflow canvas */}
          {/* Tab.Panel MUST have h-full to fill the container */}
          <Tab.Panel className="h-full overflow-hidden">
            <WorkflowCanvas workflowId={activeWorkflowId} />
          </Tab.Panel>
          
          {/* Executions Tab Panel - contains the execution history viewer */}
          <Tab.Panel className="h-full overflow-hidden">
            <ExecutionHistoryPanel currentWorkflowId={activeWorkflowId} />
          </Tab.Panel>
        </Tab.Panels>
      </Tab.Group>
    </div>
  );
}
