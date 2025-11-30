/**
 * @file AlertNode.tsx
 * @description Alert action node - shows a browser alert dialog
 * 
 * @architecture Phase 4, Task 4.2 - Node Types Implementation
 * @created 2025-11-29
 * @author AI (Cline) + Human Review
 * @confidence 9/10 - Simple input component with store integration
 * 
 * @see src/renderer/components/LogicEditor/nodes/BaseNode.tsx - Base component
 * @see src/core/logic/types.ts - AlertNode type definition
 * @see src/renderer/store/logicStore.ts - State management
 * @see .implementation/phase-4-logic-editor/task-4.2-node-types.md - Task details
 * 
 * PROBLEM SOLVED:
 * Users need a simple way to show feedback when testing flows.
 * Alert is a familiar browser API that's easy to understand.
 * 
 * SOLUTION:
 * - Text input for the alert message
 * - Updates logicStore when message changes
 * - No output handle (terminal action in flow)
 * 
 * DESIGN DECISIONS:
 * - Yellow/amber color scheme: Indicates "attention/notification"
 * - No output handle: Alert is typically a terminal action
 * - Simple text input for Level 1.5 (no expressions)
 * 
 * @security-critical false
 * @performance-critical false - User-driven interactions only
 */

import React, { useCallback } from 'react';
import { NodeProps } from 'reactflow';
import { BaseNode } from './BaseNode';
import { useLogicStore } from '../../../store/logicStore';
import type { StaticValue } from '../../../../core/logic/types';

// ============================================================
// TYPES
// ============================================================

/**
 * Data structure for AlertNode
 * Matches the config from AlertNode type in logic/types.ts
 */
export interface AlertNodeData {
  /** Message to display in alert dialog (static only in Level 1.5) */
  message: StaticValue;
  
  /** Node type marker */
  nodeType: 'alert';
}

// ============================================================
// COMPONENT
// ============================================================

/**
 * AlertNodeComponent - Configure browser alert message
 * 
 * Allows users to enter a message that will be shown in
 * a browser alert() dialog when the flow executes.
 * 
 * VISUAL:
 * ┌────────────────────────┐
 * │  🔔 Alert              │
 * │────────────────────────│
 * │[●] Message:            │
 * │    [text input      ]  │
 * └────────────────────────┘
 * 
 * NOTE: No output handle because alert is typically
 * a terminal action. Could be changed if chaining needed.
 * 
 * @example
 * ```tsx
 * // In React Flow nodeTypes:
 * const nodeTypes = {
 *   alert: AlertNodeComponent,
 * };
 * 
 * // Node data from flow:
 * {
 *   id: 'node_alert_123',
 *   type: 'alert',
 *   data: {
 *     message: { type: 'static', value: 'Button clicked!' }
 *   }
 * }
 * ```
 */
export function AlertNodeComponent({
  id,
  data,
  selected,
}: NodeProps<AlertNodeData>) {
  // --------------------------------------------------------
  // STORE ACCESS
  // --------------------------------------------------------
  
  const activeFlowId = useLogicStore((state) => state.activeFlowId);
  const updateNode = useLogicStore((state) => state.updateNode);
  
  // --------------------------------------------------------
  // HANDLERS
  // --------------------------------------------------------
  
  /**
   * Handle message change
   * Updates the node's message configuration in the store
   */
  const handleMessageChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      if (!activeFlowId) return;
      
      updateNode(activeFlowId, id, {
        data: {
          ...data,
          message: { type: 'static', value: event.target.value },
        },
      } as any);
    },
    [activeFlowId, id, data, updateNode]
  );
  
  // --------------------------------------------------------
  // RENDER
  // --------------------------------------------------------
  
  // Extract message value with fallback (cast to string for input)
  const messageValue = String(data.message?.value ?? '');
  
  return (
    <BaseNode
      title="Alert"
      icon="🔔"
      colorClass="border-yellow-300 bg-yellow-50"
      hasInput={true}   /* Receives flow from trigger/previous node */
      hasOutput={false} /* Terminal action - no chaining */
      selected={selected}
    >
      <div>
        <label className="block text-xs text-gray-500 mb-1">
          Message
        </label>
        <input
          type="text"
          className="w-full text-sm border border-gray-300 rounded px-2 py-1
                     focus:outline-none focus:ring-1 focus:ring-yellow-400"
          value={messageValue}
          onChange={handleMessageChange}
          placeholder="Enter alert message..."
        />
        
        {/* Preview hint */}
        <p className="text-xs text-gray-400 mt-1 italic">
          Shows browser alert dialog
        </p>
      </div>
    </BaseNode>
  );
}

export default AlertNodeComponent;
