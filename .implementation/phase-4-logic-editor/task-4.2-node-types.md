# Task 4.2: Node Types Implementation

**Phase:** Phase 4 - Micro Logic Editor  
**Duration Estimate:** 3-4 days  
**Actual Duration:** [To be filled]  
**Status:** 🔵 Not Started  
**Assigned:** Cline + Human Review  
**Priority:** P0 - Critical  
**Started:** [YYYY-MM-DD]  
**Completed:** [YYYY-MM-DD]  

---

## 🎯 Task Overview

### Objective
Implement the four custom React Flow node components for Level 1.5: EventNode, SetStateNode, AlertNode, and ConsoleNode. Each node needs visual design, configuration UI, and proper handle placement.

### Problem Statement
React Flow provides the canvas infrastructure, but we need custom node components that:
- Display appropriate UI for each node type
- Allow configuration (selecting state variables, entering values)
- Have proper connection handles (inputs/outputs)
- Follow Rise's visual design language

### Success Criteria
- [ ] EventNode renders trigger info (read-only)
- [ ] SetStateNode allows variable selection and value input
- [ ] AlertNode allows message input
- [ ] ConsoleNode allows level selection and message input
- [ ] All nodes have proper connection handles
- [ ] Node styling matches Rise editor design
- [ ] Nodes update store when configuration changes
- [ ] Validation prevents invalid configurations
- [ ] Unit tests for each node type
- [ ] Human review completed

### References
- **Task 4.0** - Node type definitions
- **Task 4.1** - React Flow setup
- **React Flow Custom Nodes:** https://reactflow.dev/docs/guides/custom-nodes/
- **Existing UI components:** `src/renderer/components/`

### Dependencies
- ✅ **Task 4.0** - Types must be defined
- ✅ **Task 4.1** - React Flow must be integrated
- ⚠️ **BLOCKS:** Task 4.4 (Code generation)

---

## 🗺️ Implementation Roadmap

### Milestone 1: Base Node Component
**Duration:** 0.5 day  
**Confidence Target:** 9/10  
**Status:** 🔵 Not Started

#### Objective
Create a reusable base node component with common styling and handle placement.

#### Deliverables

**Create `src/renderer/components/LogicEditor/nodes/BaseNode.tsx`:**

```tsx
// ============================================================
// BASE NODE - Shared Node Component Structure
// ============================================================
// Provides consistent styling and handle placement for all node types.
// Individual node types wrap this and provide their specific content.
// ============================================================

import React from 'react';
import { Handle, Position } from 'reactflow';

// ============================================================
// TYPES
// ============================================================

interface BaseNodeProps {
  /** Node title */
  title: string;
  /** Icon emoji */
  icon: string;
  /** Color scheme (tailwind classes) */
  colorClass: string;
  /** Whether this node has an input handle */
  hasInput?: boolean;
  /** Whether this node has an output handle */
  hasOutput?: boolean;
  /** Whether the node is selected */
  selected?: boolean;
  /** Child content */
  children: React.ReactNode;
}

// ============================================================
// COMPONENT
// ============================================================

/**
 * BaseNode - Wrapper providing consistent node styling
 * 
 * All custom nodes should use this as their outer wrapper to ensure
 * consistent appearance and handle placement.
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
        min-w-[180px] rounded-lg border-2 shadow-md
        ${colorClass}
        ${selected ? 'ring-2 ring-blue-500' : ''}
      `}
    >
      {/* Input handle (left side) */}
      {hasInput && (
        <Handle
          type="target"
          position={Position.Left}
          className="w-3 h-3 bg-gray-400 border-2 border-white"
        />
      )}
      
      {/* Header */}
      <div className="px-3 py-2 border-b border-inherit bg-white/50 rounded-t-lg">
        <div className="flex items-center gap-2">
          <span className="text-lg">{icon}</span>
          <span className="font-semibold text-sm text-gray-700">{title}</span>
        </div>
      </div>
      
      {/* Content */}
      <div className="px-3 py-2 bg-white rounded-b-lg">
        {children}
      </div>
      
      {/* Output handle (right side) */}
      {hasOutput && (
        <Handle
          type="source"
          position={Position.Right}
          className="w-3 h-3 bg-gray-400 border-2 border-white"
        />
      )}
    </div>
  );
}

export default BaseNode;
```

---

### Milestone 2: Event Node
**Duration:** 0.5 day  
**Confidence Target:** 9/10  
**Status:** 🔵 Not Started

#### Objective
Create the EventNode component (read-only trigger display).

#### Deliverables

**Create `src/renderer/components/LogicEditor/nodes/EventNode.tsx`:**

```tsx
// ============================================================
// EVENT NODE - Flow Trigger Display
// ============================================================
// Displays the event that triggers this flow (e.g., onClick).
// This node is auto-created and read-only - users cannot edit it.
// It only has an output handle (triggers flow execution).
// ============================================================

import React from 'react';
import { NodeProps } from 'reactflow';
import { BaseNode } from './BaseNode';
import { EventNode as EventNodeType } from '../../../core/logic/types';
import { useComponentStore } from '../../store/componentStore';

// ============================================================
// TYPES
// ============================================================

interface EventNodeData {
  eventType: string;
  componentId: string;
}

// ============================================================
// COMPONENT
// ============================================================

/**
 * EventNodeComponent - Displays flow trigger information
 * 
 * This is a read-only node that shows what event triggers the flow.
 * Users cannot edit this node - it's automatically created when
 * a flow is associated with a component event.
 */
export function EventNodeComponent({ data, selected }: NodeProps<EventNodeData>) {
  // Get component name for display
  const component = useComponentStore((state) => 
    state.components[data.componentId]
  );
  const componentName = component?.displayName || data.componentId;
  
  // Format event type for display
  const eventLabel = formatEventType(data.eventType);
  
  return (
    <BaseNode
      title={eventLabel}
      icon="⚡"
      colorClass="border-purple-300 bg-purple-50"
      hasInput={false}  // Event nodes only have output
      hasOutput={true}
      selected={selected}
    >
      <div className="text-sm">
        {/* Component reference */}
        <div className="flex items-center gap-1 text-gray-600">
          <span className="text-xs text-gray-400">Component:</span>
          <span className="font-medium">{componentName}</span>
        </div>
        
        {/* Read-only indicator */}
        <div className="mt-2 text-xs text-gray-400 italic">
          Auto-generated trigger
        </div>
      </div>
    </BaseNode>
  );
}

// ============================================================
// HELPERS
// ============================================================

/**
 * Format event type for display
 */
function formatEventType(eventType: string): string {
  switch (eventType) {
    case 'onClick':
      return 'On Click';
    case 'onChange':
      return 'On Change';
    case 'onSubmit':
      return 'On Submit';
    default:
      return eventType;
  }
}

export default EventNodeComponent;
```

---

### Milestone 3: SetState Node
**Duration:** 1 day  
**Confidence Target:** 8/10  
**Status:** 🔵 Not Started

#### Objective
Create the SetStateNode component with variable selection and value input.

#### Deliverables

**Create `src/renderer/components/LogicEditor/nodes/SetStateNode.tsx`:**

```tsx
// ============================================================
// SET STATE NODE - State Variable Mutation
// ============================================================
// Allows users to set a page state variable to a static value.
// Level 1.5 only supports static values (no expressions).
// ============================================================

import React, { useCallback } from 'react';
import { NodeProps } from 'reactflow';
import { BaseNode } from './BaseNode';
import { useLogicStore } from '../../store/logicStore';

// ============================================================
// TYPES
// ============================================================

interface SetStateNodeData {
  variable: string;
  value: {
    type: 'static';
    value: string | number | boolean;
  };
}

// ============================================================
// COMPONENT
// ============================================================

/**
 * SetStateNodeComponent - Configure state variable updates
 * 
 * Users select which state variable to update and enter the
 * new value. In Level 1.5, only static values are supported.
 */
export function SetStateNodeComponent({ 
  id, 
  data, 
  selected 
}: NodeProps<SetStateNodeData>) {
  // Get available state variables
  const pageState = useLogicStore((state) => state.pageState);
  const stateVariables = Object.keys(pageState);
  
  // Get the active flow ID for updates
  const activeFlowId = useLogicStore((state) => state.activeFlowId);
  const updateNode = useLogicStore((state) => state.updateNode);
  
  // --------------------------------------------------------
  // HANDLERS
  // --------------------------------------------------------
  
  /**
   * Handle variable selection change
   */
  const handleVariableChange = useCallback(
    (event: React.ChangeEvent<HTMLSelectElement>) => {
      if (!activeFlowId) return;
      
      const newVariable = event.target.value;
      const varDef = pageState[newVariable];
      
      // Reset value to match new variable's type
      const defaultValue = getDefaultValue(varDef?.type || 'string');
      
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
  // RENDER
  // --------------------------------------------------------
  
  // Get current variable type for appropriate input
  const selectedVarDef = pageState[data.variable];
  const varType = selectedVarDef?.type || 'string';
  
  return (
    <BaseNode
      title="Set State"
      icon="📝"
      colorClass="border-blue-300 bg-blue-50"
      hasInput={true}
      hasOutput={true}
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
              className="w-full text-sm border rounded px-2 py-1"
              value={data.variable}
              onChange={handleVariableChange}
            >
              <option value="">Select variable...</option>
              {stateVariables.map((varName) => (
                <option key={varName} value={varName}>
                  {varName} ({pageState[varName].type})
                </option>
              ))}
            </select>
          ) : (
            <p className="text-xs text-orange-500">
              No state variables defined
            </p>
          )}
        </div>
        
        {/* Value input (type-specific) */}
        {data.variable && (
          <div>
            <label className="block text-xs text-gray-500 mb-1">
              New Value
            </label>
            <ValueInput
              type={varType}
              value={data.value.value}
              onChange={handleValueChange}
            />
          </div>
        )}
      </div>
    </BaseNode>
  );
}

// ============================================================
// VALUE INPUT COMPONENT
// ============================================================

interface ValueInputProps {
  type: string;
  value: string | number | boolean;
  onChange: (value: string | number | boolean) => void;
}

/**
 * Type-specific value input
 */
function ValueInput({ type, value, onChange }: ValueInputProps) {
  switch (type) {
    case 'boolean':
      return (
        <select
          className="w-full text-sm border rounded px-2 py-1"
          value={String(value)}
          onChange={(e) => onChange(e.target.value === 'true')}
        >
          <option value="true">true</option>
          <option value="false">false</option>
        </select>
      );
      
    case 'number':
      return (
        <input
          type="number"
          className="w-full text-sm border rounded px-2 py-1"
          value={value as number}
          onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
        />
      );
      
    case 'string':
    default:
      return (
        <input
          type="text"
          className="w-full text-sm border rounded px-2 py-1"
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
 * Get default value for a given type
 */
function getDefaultValue(type: string): string | number | boolean {
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

export default SetStateNodeComponent;
```

---

### Milestone 4: Alert & Console Nodes
**Duration:** 0.5 day  
**Confidence Target:** 9/10  
**Status:** 🔵 Not Started

#### Objective
Create AlertNode and ConsoleNode components.

#### Deliverables

**Create `src/renderer/components/LogicEditor/nodes/AlertNode.tsx`:**

```tsx
// ============================================================
// ALERT NODE - Browser Alert Action
// ============================================================

import React, { useCallback } from 'react';
import { NodeProps } from 'reactflow';
import { BaseNode } from './BaseNode';
import { useLogicStore } from '../../store/logicStore';

interface AlertNodeData {
  message: {
    type: 'static';
    value: string;
  };
}

export function AlertNodeComponent({ 
  id, 
  data, 
  selected 
}: NodeProps<AlertNodeData>) {
  const activeFlowId = useLogicStore((state) => state.activeFlowId);
  const updateNode = useLogicStore((state) => state.updateNode);
  
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
  
  return (
    <BaseNode
      title="Alert"
      icon="🔔"
      colorClass="border-yellow-300 bg-yellow-50"
      hasInput={true}
      hasOutput={false}  // Alert is typically a terminal action
      selected={selected}
    >
      <div>
        <label className="block text-xs text-gray-500 mb-1">
          Message
        </label>
        <input
          type="text"
          className="w-full text-sm border rounded px-2 py-1"
          value={data.message.value}
          onChange={handleMessageChange}
          placeholder="Enter alert message..."
        />
      </div>
    </BaseNode>
  );
}

export default AlertNodeComponent;
```

**Create `src/renderer/components/LogicEditor/nodes/ConsoleNode.tsx`:**

```tsx
// ============================================================
// CONSOLE NODE - Console Logging Action
// ============================================================

import React, { useCallback } from 'react';
import { NodeProps } from 'reactflow';
import { BaseNode } from './BaseNode';
import { useLogicStore } from '../../store/logicStore';

interface ConsoleNodeData {
  level: 'log' | 'warn' | 'error';
  message: {
    type: 'static';
    value: string;
  };
}

export function ConsoleNodeComponent({ 
  id, 
  data, 
  selected 
}: NodeProps<ConsoleNodeData>) {
  const activeFlowId = useLogicStore((state) => state.activeFlowId);
  const updateNode = useLogicStore((state) => state.updateNode);
  
  const handleLevelChange = useCallback(
    (event: React.ChangeEvent<HTMLSelectElement>) => {
      if (!activeFlowId) return;
      
      updateNode(activeFlowId, id, {
        data: { ...data, level: event.target.value as 'log' | 'warn' | 'error' },
      } as any);
    },
    [activeFlowId, id, data, updateNode]
  );
  
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
  
  return (
    <BaseNode
      title="Console"
      icon="📋"
      colorClass="border-gray-300 bg-gray-50"
      hasInput={true}
      hasOutput={false}
      selected={selected}
    >
      <div className="space-y-2">
        {/* Log level */}
        <div>
          <label className="block text-xs text-gray-500 mb-1">
            Level
          </label>
          <select
            className="w-full text-sm border rounded px-2 py-1"
            value={data.level}
            onChange={handleLevelChange}
          >
            <option value="log">log</option>
            <option value="warn">warn</option>
            <option value="error">error</option>
          </select>
        </div>
        
        {/* Message */}
        <div>
          <label className="block text-xs text-gray-500 mb-1">
            Message
          </label>
          <input
            type="text"
            className="w-full text-sm border rounded px-2 py-1"
            value={data.message.value}
            onChange={handleMessageChange}
            placeholder="Enter log message..."
          />
        </div>
      </div>
    </BaseNode>
  );
}

export default ConsoleNodeComponent;
```

---

### Milestone 5: Node Index & Testing
**Duration:** 0.5 day  
**Confidence Target:** 9/10  
**Status:** 🔵 Not Started

#### Objective
Create index file and comprehensive tests.

#### Deliverables

**Create `src/renderer/components/LogicEditor/nodes/index.ts`:**

```typescript
// Node components
export { EventNodeComponent } from './EventNode';
export { SetStateNodeComponent } from './SetStateNode';
export { AlertNodeComponent } from './AlertNode';
export { ConsoleNodeComponent } from './ConsoleNode';
export { BaseNode } from './BaseNode';
```

**Create `tests/unit/components/LogicEditor/nodes/`:**
- `EventNode.test.tsx`
- `SetStateNode.test.tsx`
- `AlertNode.test.tsx`
- `ConsoleNode.test.tsx`

---

## 🧪 Testing Requirements

### Unit Tests
- [ ] Each node renders without errors
- [ ] Node configuration updates store correctly
- [ ] Value type validation works
- [ ] Handle placement is correct

### Integration Tests
- [ ] Nodes connect properly on canvas
- [ ] Configuration persists through save/reload
- [ ] Validation prevents invalid states

### Visual Testing
- [ ] Nodes match design mockups
- [ ] Selected state is visible
- [ ] Responsive at different canvas zoom levels

---

## 📋 Human Review Checklist

- [ ] Node designs are intuitive
- [ ] Configuration UI is clear
- [ ] Validation catches errors
- [ ] Styling is consistent with editor
- [ ] Accessibility considerations addressed

---

**Task Status:** 🔵 Not Started  
**Next Step:** Create BaseNode component  
**Last Updated:** [Date]