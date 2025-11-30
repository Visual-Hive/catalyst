/**
 * @file SetStateNode.tsx
 * @description SetState action node - allows setting a page state variable to a value
 * 
 * @architecture Phase 4, Task 4.2 - Node Types Implementation
 * @created 2025-11-29
 * @author AI (Cline) + Human Review
 * @confidence 8/10 - Interactive component with store integration and type-aware inputs
 * 
 * @see src/renderer/components/LogicEditor/nodes/BaseNode.tsx - Base component
 * @see src/core/logic/types.ts - SetStateNode type definition
 * @see src/renderer/store/logicStore.ts - State management
 * @see .implementation/phase-4-logic-editor/task-4.2-node-types.md - Task details
 * 
 * PROBLEM SOLVED:
 * Users need to configure which state variable to update and what value to set.
 * Level 1.5 supports only static values (no expressions).
 * 
 * SOLUTION:
 * - Dropdown to select from available pageState variables
 * - Type-appropriate input for the value (text/number/boolean)
 * - Updates logicStore when configuration changes
 * - Shows warning when no state variables are defined
 * 
 * DESIGN DECISIONS:
 * - Blue color scheme: Indicates "state manipulation"
 * - Value input adapts to variable type (boolean → toggle, number → number input)
 * - Changes update store immediately (no submit button needed)
 * 
 * @security-critical false
 * @performance-critical false - User-driven interactions only
 */

import React, { useCallback } from 'react';
import { NodeProps } from 'reactflow';
import { BaseNode } from './BaseNode';
import { useLogicStore } from '../../../store/logicStore';
import type { StaticValue, StateVariableType } from '../../../../core/logic/types';

// ============================================================
// TYPES
// ============================================================

/**
 * Data structure for SetStateNode
 * Matches the config from SetStateNode type in logic/types.ts
 */
export interface SetStateNodeData {
  /** Name of the state variable to update */
  variable: string;
  
  /** Value to set (static only in Level 1.5) */
  value: StaticValue;
  
  /** Node type marker */
  nodeType: 'setState';
}

// ============================================================
// SUB-COMPONENTS
// ============================================================

/**
 * Type-specific value input component
 * 
 * Renders appropriate input control based on variable type:
 * - boolean: Dropdown with true/false options
 * - number: Number input
 * - string: Text input
 * 
 * @param type - State variable type
 * @param value - Current value
 * @param onChange - Callback when value changes
 */
interface ValueInputProps {
  type: StateVariableType;
  value: string | number | boolean;
  onChange: (newValue: string | number | boolean) => void;
}

function ValueInput({ type, value, onChange }: ValueInputProps) {
  switch (type) {
    // Boolean: Show true/false dropdown
    case 'boolean':
      return (
        <select
          className="w-full text-sm border border-gray-300 rounded px-2 py-1 
                     focus:outline-none focus:ring-1 focus:ring-blue-400 
                     bg-white cursor-pointer"
          value={String(value)}
          onChange={(e) => onChange(e.target.value === 'true')}
        >
          <option value="true">true</option>
          <option value="false">false</option>
        </select>
      );
    
    // Number: Show number input with increment/decrement
    case 'number':
      return (
        <input
          type="number"
          className="w-full text-sm border border-gray-300 rounded px-2 py-1
                     focus:outline-none focus:ring-1 focus:ring-blue-400"
          value={value as number}
          onChange={(e) => {
            const num = parseFloat(e.target.value);
            // Handle empty input or invalid number
            onChange(isNaN(num) ? 0 : num);
          }}
        />
      );
    
    // String (default): Show text input
    case 'string':
    default:
      return (
        <input
          type="text"
          className="w-full text-sm border border-gray-300 rounded px-2 py-1
                     focus:outline-none focus:ring-1 focus:ring-blue-400"
          value={value as string}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Enter value..."
        />
      );
  }
}

// ============================================================
// HELPERS
// ============================================================

/**
 * Get default value for a given state variable type
 * 
 * Used when user switches variable selection to reset value
 * to appropriate type-safe default.
 * 
 * @param type - State variable type
 * @returns Default value matching the type
 */
function getDefaultValue(type: StateVariableType): string | number | boolean {
  switch (type) {
    case 'boolean':
      return false;
    case 'number':
      return 0;
    case 'string':
    default:
      return '';
  }
}

// ============================================================
// COMPONENT
// ============================================================

/**
 * SetStateNodeComponent - Configure state variable updates
 * 
 * Users select which state variable to update and enter the new value.
 * In Level 1.5, only static values are supported (no expressions).
 * 
 * VISUAL:
 * ┌────────────────────────┐
 * │  📝 Set State          │
 * │────────────────────────│
 * │[●] Variable:           │
 * │    [dropdown ▼]        │
 * │    New Value:          │
 * │    [input field]      [●]
 * └────────────────────────┘
 * 
 * @example
 * ```tsx
 * // In React Flow nodeTypes:
 * const nodeTypes = {
 *   setState: SetStateNodeComponent,
 * };
 * 
 * // Node data from flow:
 * {
 *   id: 'node_setState_123',
 *   type: 'setState',
 *   data: {
 *     variable: 'clickCount',
 *     value: { type: 'static', value: 1 }
 *   }
 * }
 * ```
 */
export function SetStateNodeComponent({
  id,
  data,
  selected,
}: NodeProps<SetStateNodeData>) {
  // --------------------------------------------------------
  // STORE ACCESS
  // --------------------------------------------------------
  
  // Get available state variables from pageState
  const pageState = useLogicStore((state) => state.pageState);
  const stateVariables = Object.keys(pageState);
  
  // Get current flow for updates
  const activeFlowId = useLogicStore((state) => state.activeFlowId);
  const updateNode = useLogicStore((state) => state.updateNode);
  
  // --------------------------------------------------------
  // HANDLERS
  // --------------------------------------------------------
  
  /**
   * Handle variable selection change
   * Resets value to type-appropriate default when variable changes
   */
  const handleVariableChange = useCallback(
    (event: React.ChangeEvent<HTMLSelectElement>) => {
      if (!activeFlowId) return;
      
      const newVariable = event.target.value;
      
      // Get the new variable's type for default value
      const varDef = pageState[newVariable];
      const varType = varDef?.type || 'string';
      const defaultValue = getDefaultValue(varType);
      
      // Update node with new variable and reset value to default
      updateNode(activeFlowId, id, {
        data: {
          ...data,
          variable: newVariable,
          value: { type: 'static', value: defaultValue },
        },
      } as any);
    },
    [activeFlowId, id, data, pageState, updateNode]
  );
  
  /**
   * Handle value change
   * Updates the node's value configuration in the store
   */
  const handleValueChange = useCallback(
    (newValue: string | number | boolean) => {
      if (!activeFlowId) return;
      
      updateNode(activeFlowId, id, {
        data: {
          ...data,
          value: { type: 'static', value: newValue },
        },
      } as any);
    },
    [activeFlowId, id, data, updateNode]
  );
  
  // --------------------------------------------------------
  // DERIVED STATE
  // --------------------------------------------------------
  
  // Get currently selected variable's type for rendering appropriate input
  const selectedVarDef = pageState[data.variable];
  const varType: StateVariableType = selectedVarDef?.type || 'string';
  
  // --------------------------------------------------------
  // RENDER
  // --------------------------------------------------------
  
  return (
    <BaseNode
      title="Set State"
      icon="📝"
      colorClass="border-blue-300 bg-blue-50"
      hasInput={true}   /* Receives flow from trigger/previous node */
      hasOutput={true}  /* Can chain to more actions */
      selected={selected}
    >
      <div className="space-y-3">
        {/* Variable selector */}
        <div>
          <label className="block text-xs text-gray-500 mb-1">
            Variable
          </label>
          
          {stateVariables.length > 0 ? (
            <select
              className="w-full text-sm border border-gray-300 rounded px-2 py-1
                         focus:outline-none focus:ring-1 focus:ring-blue-400
                         bg-white cursor-pointer"
              value={data.variable || ''}
              onChange={handleVariableChange}
            >
              {/* Empty option when no variable selected */}
              {!data.variable && (
                <option value="">Select variable...</option>
              )}
              
              {/* List all available state variables with their types */}
              {stateVariables.map((varName) => (
                <option key={varName} value={varName}>
                  {varName} ({pageState[varName].type})
                </option>
              ))}
            </select>
          ) : (
            /* Warning when no state variables defined */
            <p className="text-xs text-orange-600 bg-orange-50 px-2 py-1 rounded">
              ⚠️ No state variables defined.
              <br />
              <span className="text-orange-500">
                Add variables in Page State panel.
              </span>
            </p>
          )}
        </div>
        
        {/* Value input (only shown when variable is selected) */}
        {data.variable && (
          <div>
            <label className="block text-xs text-gray-500 mb-1">
              New Value
            </label>
            <ValueInput
              type={varType}
              value={data.value?.value ?? getDefaultValue(varType)}
              onChange={handleValueChange}
            />
          </div>
        )}
      </div>
    </BaseNode>
  );
}

export default SetStateNodeComponent;
