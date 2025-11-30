/**
 * @file EventNode.tsx
 * @description Event trigger node - displays what event triggers the flow
 * 
 * @architecture Phase 4, Task 4.2 - Node Types Implementation
 * @created 2025-11-29
 * @author AI (Cline) + Human Review
 * @confidence 9/10 - Read-only display component with store integration
 * 
 * @see src/renderer/components/LogicEditor/nodes/BaseNode.tsx - Base component
 * @see src/core/logic/types.ts - EventNode type definition
 * @see .implementation/phase-4-logic-editor/task-4.2-node-types.md - Task details
 * 
 * PROBLEM SOLVED:
 * Users need to see what event triggers a flow (e.g., "On Click" from "Submit Button").
 * This node is auto-generated when a flow is created and is read-only.
 * 
 * SOLUTION:
 * - Display event type formatted for readability (onClick → "On Click")
 * - Display component name via manifestStore lookup
 * - Output handle only (this is the flow start, no inputs)
 * - Visual indication that this is auto-generated
 * 
 * DESIGN DECISIONS:
 * - Read-only: Users cannot edit event nodes (delete flow instead)
 * - Purple color scheme: Visually distinct as the "trigger"
 * - Shows component name for context
 * 
 * @security-critical false
 * @performance-critical false - User-driven interactions only
 */

import { NodeProps } from 'reactflow';
import { BaseNode } from './BaseNode';
import { useManifestStore } from '../../../store/manifestStore';
import type { EventType } from '../../../../core/logic/types';

// ============================================================
// TYPES
// ============================================================

/**
 * Data structure for EventNode
 * Matches the config from EventNode type in logic/types.ts
 */
export interface EventNodeData {
  /** Event type that triggers this flow (onClick for Level 1.5) */
  eventType: EventType;
  
  /** Component ID that this event is attached to */
  componentId: string;
  
  /** Node type marker (for React Flow rendering) */
  nodeType: 'event';
}

// ============================================================
// HELPERS
// ============================================================

/**
 * Format event type for human-readable display
 * 
 * Converts camelCase event names to readable format:
 * - onClick → "On Click"
 * - onChange → "On Change"
 * - onSubmit → "On Submit"
 * 
 * @param eventType - Event type string (e.g., 'onClick')
 * @returns Formatted display string
 */
function formatEventType(eventType: string): string {
  // Map of known event types to display names
  const eventDisplayNames: Record<string, string> = {
    onClick: 'On Click',
    onChange: 'On Change',
    onSubmit: 'On Submit',
    onMount: 'On Mount',
    onUnmount: 'On Unmount',
    onFocus: 'On Focus',
    onBlur: 'On Blur',
  };
  
  // Return mapped name or format the raw string
  return eventDisplayNames[eventType] || formatCamelCase(eventType);
}

/**
 * Convert camelCase to Title Case with spaces
 * Fallback for unknown event types
 * 
 * @param str - camelCase string
 * @returns Title Case string
 */
function formatCamelCase(str: string): string {
  return str
    // Insert space before capital letters
    .replace(/([A-Z])/g, ' $1')
    // Capitalize first letter
    .replace(/^./, (char) => char.toUpperCase())
    .trim();
}

// ============================================================
// COMPONENT
// ============================================================

/**
 * EventNodeComponent - Displays flow trigger information
 * 
 * This is a READ-ONLY node that shows what event triggers the flow.
 * Users cannot edit this node - it's automatically created when
 * a flow is associated with a component event.
 * 
 * VISUAL:
 * ┌────────────────────────┐
 * │  ⚡ On Click           │
 * │────────────────────────│
 * │  Component: Button    [●]
 * │  Auto-generated        │
 * └────────────────────────┘
 * 
 * @example
 * ```tsx
 * // In React Flow nodeTypes:
 * const nodeTypes = {
 *   event: EventNodeComponent,
 * };
 * 
 * // Node data from flow:
 * {
 *   id: 'node_event_123',
 *   type: 'event',
 *   data: {
 *     eventType: 'onClick',
 *     componentId: 'comp_button_001',
 *   }
 * }
 * ```
 */
export function EventNodeComponent({ data, selected }: NodeProps<EventNodeData>) {
  // --------------------------------------------------------
  // STORE ACCESS
  // --------------------------------------------------------
  
  // Get component from manifest to display its name
  // Falls back to componentId if component not found
  const component = useManifestStore((state) => 
    state.manifest?.components[data.componentId]
  );
  
  // Display name: use component's displayName or fall back to ID
  const componentName = component?.displayName || data.componentId || 'Unknown';
  
  // Format event type for display
  const eventLabel = formatEventType(data.eventType || 'onClick');
  
  // --------------------------------------------------------
  // RENDER
  // --------------------------------------------------------
  
  return (
    <BaseNode
      title={eventLabel}
      icon="⚡"
      colorClass="border-purple-300 bg-purple-50"
      hasInput={false}  /* Event nodes are flow entry points - no input */
      hasOutput={true}  /* Output connects to action nodes */
      selected={selected}
    >
      <div className="text-sm space-y-2">
        {/* Component that triggers this event */}
        <div className="flex items-start gap-1">
          <span className="text-xs text-gray-400 shrink-0">Component:</span>
          <span className="font-medium text-gray-700 truncate" title={componentName}>
            {componentName}
          </span>
        </div>
        
        {/* Read-only indicator */}
        <div className="text-xs text-gray-400 italic">
          Auto-generated trigger
        </div>
      </div>
    </BaseNode>
  );
}

export default EventNodeComponent;
