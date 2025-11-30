/**
 * @file ConsoleNode.tsx
 * @description Console action node - logs messages to browser console
 * 
 * @architecture Phase 4, Task 4.2 - Node Types Implementation
 * @created 2025-11-29
 * @author AI (Cline) + Human Review
 * @confidence 9/10 - Simple form component with store integration
 * 
 * @see src/renderer/components/LogicEditor/nodes/BaseNode.tsx - Base component
 * @see src/core/logic/types.ts - ConsoleNode type definition
 * @see src/renderer/store/logicStore.ts - State management
 * @see .implementation/phase-4-logic-editor/task-4.2-node-types.md - Task details
 * 
 * PROBLEM SOLVED:
 * Users need a way to debug flows and see when they execute.
 * Console logging is familiar and visible in browser dev tools.
 * 
 * SOLUTION:
 * - Dropdown to select console level (log/warn/error)
 * - Text input for the log message
 * - Updates logicStore when configuration changes
 * - Color-coded based on log level
 * 
 * DESIGN DECISIONS:
 * - Gray color scheme for log, orange for warn, red for error
 * - No output handle: Console is typically a terminal action
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

/** Console log level options */
type ConsoleLevel = 'log' | 'warn' | 'error';

/**
 * Data structure for ConsoleNode
 * Matches the config from ConsoleNode type in logic/types.ts
 */
export interface ConsoleNodeData {
  /** Console method to call (log, warn, error) */
  level: ConsoleLevel;
  
  /** Message to log (static only in Level 1.5) */
  message: StaticValue;
  
  /** Node type marker */
  nodeType: 'console';
}

// ============================================================
// HELPERS
// ============================================================

/**
 * Get color classes for node based on log level
 * 
 * @param level - Console log level
 * @returns Tailwind color classes for border and background
 */
function getLevelColorClass(level: ConsoleLevel): string {
  switch (level) {
    case 'warn':
      return 'border-orange-300 bg-orange-50';
    case 'error':
      return 'border-red-300 bg-red-50';
    case 'log':
    default:
      return 'border-gray-300 bg-gray-50';
  }
}

/**
 * Get ring color for input focus based on level
 * 
 * @param level - Console log level
 * @returns Tailwind focus ring class
 */
function getLevelFocusClass(level: ConsoleLevel): string {
  switch (level) {
    case 'warn':
      return 'focus:ring-orange-400';
    case 'error':
      return 'focus:ring-red-400';
    case 'log':
    default:
      return 'focus:ring-gray-400';
  }
}

// ============================================================
// COMPONENT
// ============================================================

/**
 * ConsoleNodeComponent - Configure console logging
 * 
 * Allows users to select a console level and enter a message
 * that will be logged when the flow executes.
 * 
 * VISUAL:
 * ┌────────────────────────┐
 * │  📋 Console            │
 * │────────────────────────│
 * │[●] Level: [log ▼ ]     │
 * │    Message:            │
 * │    [text input      ]  │
 * └────────────────────────┘
 * 
 * Node color changes based on level:
 * - log: gray
 * - warn: orange
 * - error: red
 * 
 * @example
 * ```tsx
 * // In React Flow nodeTypes:
 * const nodeTypes = {
 *   console: ConsoleNodeComponent,
 * };
 * 
 * // Node data from flow:
 * {
 *   id: 'node_console_123',
 *   type: 'console',
 *   data: {
 *     level: 'log',
 *     message: { type: 'static', value: 'Flow executed!' }
 *   }
 * }
 * ```
 */
export function ConsoleNodeComponent({
  id,
  data,
  selected,
}: NodeProps<ConsoleNodeData>) {
  // --------------------------------------------------------
  // STORE ACCESS
  // --------------------------------------------------------
  
  const activeFlowId = useLogicStore((state) => state.activeFlowId);
  const updateNode = useLogicStore((state) => state.updateNode);
  
  // --------------------------------------------------------
  // HANDLERS
  // --------------------------------------------------------
  
  /**
   * Handle console level change
   * Updates the node's level and changes node appearance
   */
  const handleLevelChange = useCallback(
    (event: React.ChangeEvent<HTMLSelectElement>) => {
      if (!activeFlowId) return;
      
      updateNode(activeFlowId, id, {
        data: {
          ...data,
          level: event.target.value as ConsoleLevel,
        },
      } as any);
    },
    [activeFlowId, id, data, updateNode]
  );
  
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
  // DERIVED STATE
  // --------------------------------------------------------
  
  // Get current level (default to 'log')
  const level = data.level || 'log';
  
  // Get color classes based on level
  const colorClass = getLevelColorClass(level);
  const focusClass = getLevelFocusClass(level);
  
  // Extract message value with fallback (cast to string for input)
  const messageValue = String(data.message?.value ?? '');
  
  // --------------------------------------------------------
  // RENDER
  // --------------------------------------------------------
  
  return (
    <BaseNode
      title="Console"
      icon="📋"
      colorClass={colorClass}
      hasInput={true}   /* Receives flow from trigger/previous node */
      hasOutput={false} /* Terminal action - no chaining */
      selected={selected}
    >
      <div className="space-y-2">
        {/* Log level selector */}
        <div>
          <label className="block text-xs text-gray-500 mb-1">
            Level
          </label>
          <select
            className={`w-full text-sm border border-gray-300 rounded px-2 py-1
                       focus:outline-none focus:ring-1 ${focusClass}
                       bg-white cursor-pointer`}
            value={level}
            onChange={handleLevelChange}
          >
            <option value="log">log</option>
            <option value="warn">warn</option>
            <option value="error">error</option>
          </select>
        </div>
        
        {/* Message input */}
        <div>
          <label className="block text-xs text-gray-500 mb-1">
            Message
          </label>
          <input
            type="text"
            className={`w-full text-sm border border-gray-300 rounded px-2 py-1
                       focus:outline-none focus:ring-1 ${focusClass}`}
            value={messageValue}
            onChange={handleMessageChange}
            placeholder="Enter log message..."
          />
        </div>
        
        {/* Preview hint */}
        <p className="text-xs text-gray-400 italic">
          Logs to browser console
        </p>
      </div>
    </BaseNode>
  );
}

export default ConsoleNodeComponent;
