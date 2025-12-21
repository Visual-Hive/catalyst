/**
 * @file WorkflowPropertiesPanel.tsx
 * @description Right-side properties panel for node configuration
 * 
 * @architecture Phase 2.5, Task 2.10 - Properties Panel
 * @created 2025-12-21
 * @author AI (Cline) + Human Review
 * @confidence 9/10 - Standard panel layout component
 * 
 * @see src/renderer/store/workflowStore.ts - selectedNodeId state
 * @see src/renderer/components/WorkflowCanvas/NodeConfigForm.tsx - Form generator
 * 
 * PROBLEM SOLVED:
 * - Need visual interface for configuring node properties
 * - Different nodes have different config requirements
 * - Users shouldn't need to edit code to configure workflows
 * 
 * SOLUTION:
 * - Fixed-width panel (320px) on right side of canvas
 * - Shows NodeConfigForm when node selected
 * - Empty state when no selection
 * - Header with node info and close button
 * 
 * @performance-critical false
 * @security-critical false
 */

import React from 'react';
import { XMarkIcon, DocumentTextIcon } from '@heroicons/react/24/outline';
import { useWorkflowStore } from '../../store/workflowStore';
import { NodeConfigForm } from './NodeConfigForm';

interface WorkflowPropertiesPanelProps {
  /** Workflow ID being edited */
  workflowId: string;
  
  /** Currently selected node ID (null if none) */
  selectedNodeId: string | null;
  
  /** Optional close handler */
  onClose?: () => void;
}

/**
 * WorkflowPropertiesPanel - Properties panel for configuring selected workflow nodes
 * 
 * Displays a form to configure the currently selected node.
 * Form fields are generated dynamically based on node type metadata.
 * 
 * FEATURES:
 * - Dynamic form based on node type
 * - Empty state when nothing selected
 * - Header with node name and type
 * - Scrollable form area
 * - Close button (optional)
 * 
 * LAYOUT:
 * - Fixed width: 320px (w-80 Tailwind class)
 * - Full height with internal scroll
 * - Border on left side
 * - Gray background to differentiate from canvas
 * 
 * @example
 * ```tsx
 * <WorkflowPropertiesPanel
 *   workflowId="workflow_123"
 *   selectedNodeId={selectedNodeId}
 * />
 * ```
 */
export function WorkflowPropertiesPanel({
  workflowId,
  selectedNodeId,
  onClose,
}: WorkflowPropertiesPanelProps) {
  const workflow = useWorkflowStore((state) =>
    state.manifest?.workflows[workflowId] ?? null
  );
  
  // No node selected - show empty state
  if (!selectedNodeId || !workflow) {
    return (
      <div className="h-full flex flex-col bg-gray-50 border-l border-gray-200">
        <EmptyState />
      </div>
    );
  }
  
  // Get selected node from workflow
  const node = workflow.nodes[selectedNodeId];
  
  // Node not found (shouldn't happen, but defensive programming)
  if (!node) {
    return (
      <div className="h-full flex flex-col bg-gray-50 border-l border-gray-200">
        <EmptyState message="Node not found" />
      </div>
    );
  }
  
  return (
    <div className="h-full flex flex-col bg-gray-50 border-l border-gray-200">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 bg-white flex-shrink-0">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">
            Node Properties
          </h2>
          {onClose && (
            <button
              onClick={onClose}
              className="p-1 hover:bg-gray-100 rounded transition-colors"
              aria-label="Close properties panel"
            >
              <XMarkIcon className="w-5 h-5 text-gray-500" />
            </button>
          )}
        </div>
        
        {/* Node info */}
        <div className="mt-2 flex items-center text-sm">
          <DocumentTextIcon className="w-4 h-4 text-gray-400 mr-2 flex-shrink-0" />
          <span className="text-gray-700 font-medium truncate">{node.name}</span>
          <span className="text-gray-400 ml-2">({node.type})</span>
        </div>
      </div>
      
      {/* Form Content (scrollable) */}
      <div className="flex-1 overflow-y-auto p-4">
        <NodeConfigForm workflowId={workflowId} node={node} />
      </div>
    </div>
  );
}

/**
 * EmptyState - Shown when no node is selected
 * 
 * Displays helpful message and icon to guide user
 */
function EmptyState({ message }: { message?: string }) {
  return (
    <div className="flex-1 flex items-center justify-center p-8">
      <div className="text-center max-w-xs">
        {/* Icon */}
        <div className="mx-auto w-16 h-16 mb-4 flex items-center justify-center 
                        rounded-full bg-gray-100">
          <DocumentTextIcon className="w-8 h-8 text-gray-400" />
        </div>
        
        {/* Message */}
        <p className="text-gray-600 font-medium mb-2">
          {message || 'No node selected'}
        </p>
        <p className="text-gray-400 text-sm">
          Click a node in the canvas to configure its properties
        </p>
      </div>
    </div>
  );
}
