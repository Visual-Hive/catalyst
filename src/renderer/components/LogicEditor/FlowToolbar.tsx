/**
 * @file FlowToolbar.tsx
 * @description Toolbar for flow operations in the logic editor
 * 
 * @architecture Phase 4, Task 4.1 - React Flow Integration
 * @created 2025-11-29
 * @author AI (Cline) + Human Review
 * @confidence 9/10 - Simple UI component
 * 
 * @see src/renderer/components/LogicEditor/LogicCanvas.tsx - Parent
 * @see .implementation/phase-4-logic-editor/task-4.1-react-flow-integration.md
 * 
 * PROBLEM SOLVED:
 * - Users need to see what flow they're editing
 * - Users need actions like delete flow
 * 
 * SOLUTION:
 * - Display flow name and node count
 * - Provide delete button
 * - Future: auto-save indicator, undo/redo
 * 
 * @security-critical false
 * @performance-critical false
 */

import React from 'react';
import { TrashIcon } from '@heroicons/react/24/outline';
import { useLogicStore } from '../../store/logicStore';

// ============================================================
// TYPES
// ============================================================

interface FlowToolbarProps {
  /** ID of the flow being edited */
  flowId: string;
}

// ============================================================
// COMPONENT
// ============================================================

/**
 * FlowToolbar - Header bar for the logic canvas
 * 
 * Displays:
 * - Flow name
 * - Node count (informational)
 * - Delete button
 * 
 * STYLING:
 * - Compact header that doesn't take too much canvas space
 * - Matches the editor panel's styling conventions
 * 
 * @param props - Component props
 * @param props.flowId - ID of the flow being edited
 */
export function FlowToolbar({ flowId }: FlowToolbarProps) {
  // Get flow from store
  const flow = useLogicStore((state) => state.flows[flowId]);
  const deleteFlow = useLogicStore((state) => state.deleteFlow);

  // If flow not found, show nothing
  if (!flow) {
    return (
      <div className="flex items-center px-4 py-2 bg-gray-100 border-b border-gray-200">
        <span className="text-sm text-gray-400">No flow selected</span>
      </div>
    );
  }

  /**
   * Handle delete button click
   * Shows confirmation before deleting
   */
  const handleDelete = () => {
    const confirmed = window.confirm(
      `Delete flow "${flow.name}"? This cannot be undone.`
    );
    if (confirmed) {
      deleteFlow(flowId);
    }
  };

  // Count action nodes (exclude event node)
  const actionNodeCount = flow.nodes.filter((n) => n.type !== 'event').length;

  return (
    <div className="flex items-center justify-between px-4 py-2 bg-gray-50 border-b border-gray-200">
      {/* Left side: Flow info */}
      <div className="flex items-center gap-3">
        {/* Flow name */}
        <div className="flex items-center gap-2">
          <span className="text-purple-500">⚡</span>
          <span className="text-sm font-medium text-gray-800">
            {flow.name}
          </span>
        </div>

        {/* Node count badge */}
        <span className="text-xs text-gray-500 bg-gray-200 px-2 py-0.5 rounded">
          {actionNodeCount} {actionNodeCount === 1 ? 'action' : 'actions'}
        </span>

        {/* Trigger info */}
        <span className="text-xs text-gray-400">
          on {flow.trigger.type}
        </span>
      </div>

      {/* Right side: Actions */}
      <div className="flex items-center gap-2">
        {/* Delete button */}
        <button
          onClick={handleDelete}
          className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
          title="Delete flow"
        >
          <TrashIcon className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

export default FlowToolbar;
