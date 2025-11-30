/**
 * @file BaseNode.tsx
 * @description Shared base component for all custom React Flow nodes in the Logic Editor
 * 
 * @architecture Phase 4, Task 4.2 - Node Types Implementation
 * @created 2025-11-29
 * @author AI (Cline) + Human Review
 * @confidence 9/10 - Standard React component with React Flow Handle integration
 * 
 * @see src/renderer/components/LogicEditor/nodes/index.ts - Node exports
 * @see .implementation/phase-4-logic-editor/task-4.2-node-types.md - Task details
 * 
 * PROBLEM SOLVED:
 * All logic nodes need consistent visual styling and handle placement.
 * Without a base component, we'd duplicate styling code across every node type.
 * 
 * SOLUTION:
 * - Wrapper component that provides standard header, content area, and handles
 * - Each node type extends this with their specific configuration UI
 * - Color theming via Tailwind classes passed as props
 * - Selection state visual feedback
 * 
 * DESIGN DECISIONS:
 * - Input handle on left, output handle on right (standard flow direction)
 * - Header with icon and title for visual identification
 * - Content area for node-specific controls
 * - Handles positioned at vertical center of node
 * 
 * @security-critical false
 * @performance-critical false - User-driven interactions only
 */

import React from 'react';
import { Handle, Position } from 'reactflow';

// ============================================================
// TYPES
// ============================================================

/**
 * Props for BaseNode component
 * All custom node types wrap this component
 */
export interface BaseNodeProps {
  /** Node title displayed in header */
  title: string;
  
  /** Emoji icon displayed before title */
  icon: string;
  
  /** Tailwind color classes for border and background */
  colorClass: string;
  
  /** Whether this node has an input handle (left side) */
  hasInput?: boolean;
  
  /** Whether this node has an output handle (right side) */
  hasOutput?: boolean;
  
  /** Whether the node is currently selected on canvas */
  selected?: boolean;
  
  /** Node-specific content (form controls, info display, etc.) */
  children: React.ReactNode;
}

// ============================================================
// COMPONENT
// ============================================================

/**
 * BaseNode - Wrapper providing consistent node styling for Logic Editor
 * 
 * All custom nodes should use this as their outer wrapper to ensure
 * consistent appearance and proper React Flow handle placement.
 * 
 * VISUAL STRUCTURE:
 * ┌─────────────────────────┐
 * │ [●]  📝 Title           │  ← Header with icon
 * │─────────────────────────│
 * │                         │
 * │   [Node Content]        │  ← Children (form controls)
 * │                        [●]
 * └─────────────────────────┘
 *   ↑ Input handle          ↑ Output handle
 * 
 * @example
 * ```tsx
 * <BaseNode
 *   title="Set State"
 *   icon="📝"
 *   colorClass="border-blue-300 bg-blue-50"
 *   hasInput={true}
 *   hasOutput={true}
 *   selected={false}
 * >
 *   <select>...</select>
 * </BaseNode>
 * ```
 */
export function BaseNode({
  title,
  icon,
  colorClass,
  hasInput = true,
  hasOutput = true,
  selected = false,
  children,
}: BaseNodeProps) {
  return (
    <div
      className={`
        min-w-[180px] max-w-[220px] rounded-lg border-2 shadow-md
        ${colorClass}
        ${selected ? 'ring-2 ring-blue-500 ring-offset-2' : ''}
        transition-shadow duration-150
      `}
    >
      {/* 
        Input handle (left side) 
        - Target handle = receives connections from other nodes' outputs
        - Positioned at vertical center
      */}
      {hasInput && (
        <Handle
          type="target"
          position={Position.Left}
          className="!w-3 !h-3 !bg-gray-500 !border-2 !border-white"
          style={{ top: '50%' }}
        />
      )}
      
      {/* 
        Header section 
        - Displays icon and title
        - Slightly darker background for visual separation
      */}
      <div className="px-3 py-2 border-b border-inherit bg-white/50 rounded-t-lg">
        <div className="flex items-center gap-2">
          {/* Emoji icon for quick visual identification */}
          <span className="text-lg select-none">{icon}</span>
          {/* Title text */}
          <span className="font-semibold text-sm text-gray-700 truncate">
            {title}
          </span>
        </div>
      </div>
      
      {/* 
        Content section 
        - White background for form control visibility
        - Node-specific UI rendered here
      */}
      <div className="px-3 py-2 bg-white rounded-b-lg">
        {children}
      </div>
      
      {/* 
        Output handle (right side)
        - Source handle = creates connections to other nodes' inputs
        - Positioned at vertical center
      */}
      {hasOutput && (
        <Handle
          type="source"
          position={Position.Right}
          className="!w-3 !h-3 !bg-gray-500 !border-2 !border-white"
          style={{ top: '50%' }}
        />
      )}
    </div>
  );
}

export default BaseNode;
