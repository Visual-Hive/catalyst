/**
 * @file NodePalette.tsx
 * @description Draggable palette of node types for the logic editor
 * 
 * @architecture Phase 4, Task 4.1 - React Flow Integration
 * @created 2025-11-29
 * @author AI (Cline) + Human Review
 * @confidence 9/10 - Simple drag-and-drop component
 * 
 * @see src/renderer/components/LogicEditor/LogicCanvas.tsx - Consumer
 * @see .implementation/phase-4-logic-editor/task-4.1-react-flow-integration.md
 * 
 * PROBLEM SOLVED:
 * - Users need a way to add action nodes to the canvas
 * - Drag-and-drop is intuitive for visual editors
 * 
 * SOLUTION:
 * - Display available node types as draggable items
 * - Set drag data for React Flow to consume
 * - Color-code by node type for clarity
 * 
 * LEVEL 1.5 CONSTRAINTS:
 * - Only 3 action node types: SetState, Alert, Console
 * - Event nodes are auto-created, not in palette
 * 
 * @security-critical false
 * @performance-critical false
 */

import React from 'react';

// ============================================================
// NODE TYPE DEFINITIONS
// ============================================================

/**
 * Information about a draggable node type
 */
interface NodeTypeInfo {
  /** React Flow node type identifier */
  type: string;
  /** Display label */
  label: string;
  /** Short description */
  description: string;
  /** Emoji icon */
  icon: string;
  /** Tailwind color classes for background and border */
  colorClasses: string;
}

/**
 * Available node types in Level 1.5
 * 
 * NOTE: Event nodes are NOT in this list because they are
 * auto-created when a flow is created. Users cannot manually
 * add event nodes.
 */
const NODE_TYPES: NodeTypeInfo[] = [
  {
    type: 'setState',
    label: 'Set State',
    description: 'Update a page state variable',
    icon: '📝',
    colorClasses: 'bg-blue-50 border-blue-300 hover:bg-blue-100',
  },
  {
    type: 'alert',
    label: 'Alert',
    description: 'Show a browser alert dialog',
    icon: '🔔',
    colorClasses: 'bg-yellow-50 border-yellow-300 hover:bg-yellow-100',
  },
  {
    type: 'console',
    label: 'Console',
    description: 'Log a message to the console',
    icon: '📋',
    colorClasses: 'bg-gray-50 border-gray-300 hover:bg-gray-100',
  },
];

// ============================================================
// PALETTE ITEM COMPONENT
// ============================================================

interface PaletteItemProps {
  /** Node type information */
  nodeType: NodeTypeInfo;
}

/**
 * Individual draggable node type item
 * 
 * Sets drag data with the node type so LogicCanvas can
 * create the correct node when dropped.
 */
function PaletteItem({ nodeType }: PaletteItemProps) {
  /**
   * Handle drag start - store node type in transfer data
   * 
   * React Flow looks for 'application/reactflow' data type
   * to identify drag-drop operations from the palette.
   */
  const onDragStart = (event: React.DragEvent<HTMLDivElement>) => {
    event.dataTransfer.setData('application/reactflow', nodeType.type);
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div
      className={`
        px-3 py-2 rounded-md border cursor-grab
        transition-all duration-150
        ${nodeType.colorClasses}
      `}
      draggable
      onDragStart={onDragStart}
      title={nodeType.description}
    >
      <div className="flex items-center gap-2">
        <span className="text-base">{nodeType.icon}</span>
        <span className="text-sm font-medium text-gray-700">{nodeType.label}</span>
      </div>
    </div>
  );
}

// ============================================================
// NODE PALETTE COMPONENT
// ============================================================

/**
 * NodePalette - Panel showing available node types
 * 
 * Displays draggable items that users can drop onto the canvas
 * to add action nodes to their logic flow.
 * 
 * STYLING:
 * - White background with shadow for visibility over canvas
 * - Compact width to not obstruct canvas view
 * - Vertical list of node types
 * 
 * USAGE:
 * Typically rendered in a React Flow Panel component:
 * ```tsx
 * <Panel position="top-left">
 *   <NodePalette />
 * </Panel>
 * ```
 */
export function NodePalette() {
  return (
    <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-3 w-44">
      {/* Header */}
      <h3 className="text-sm font-semibold text-gray-800 mb-1">
        Actions
      </h3>
      <p className="text-xs text-gray-500 mb-3">
        Drag onto canvas
      </p>

      {/* Node type list */}
      <div className="space-y-2">
        {NODE_TYPES.map((nodeType) => (
          <PaletteItem key={nodeType.type} nodeType={nodeType} />
        ))}
      </div>

      {/* Level 1.5 info */}
      <div className="mt-3 pt-3 border-t border-gray-200">
        <p className="text-xs text-gray-400 italic">
          Level 1.5 actions
        </p>
      </div>
    </div>
  );
}

export default NodePalette;
