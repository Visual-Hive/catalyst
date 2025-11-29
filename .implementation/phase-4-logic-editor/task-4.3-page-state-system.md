# Task 4.3: Page State System

**Phase:** Phase 4 - Micro Logic Editor  
**Duration Estimate:** 2-3 days  
**Actual Duration:** [To be filled]  
**Status:** 🔵 Not Started  
**Assigned:** Cline + Human Review  
**Priority:** P0 - Critical  
**Started:** [YYYY-MM-DD]  
**Completed:** [YYYY-MM-DD]  

---

## 🎯 Task Overview

### Objective
Implement the page-level state system including state variable management UI, template syntax for reading state in component properties, and runtime state injection in generated code.

### Problem Statement
For logic flows to be useful, they need to be able to modify state that components can read. This requires:
- UI for defining state variables (name, type, initial value)
- Template syntax for referencing state in component text: `{{state.varName}}`
- Runtime state management in generated code
- Reactivity so components update when state changes

### Success Criteria
- [ ] State panel shows existing variables
- [ ] Can add new state variables (string, number, boolean)
- [ ] Can edit state variable properties
- [ ] Can delete state variables
- [ ] Template syntax `{{state.varName}}` works in component text
- [ ] Generated code includes state management
- [ ] Components re-render when state changes
- [ ] Validation prevents invalid variable names
- [ ] Unit tests for state management
- [ ] Human review completed

### References
- **Task 4.0** - PageState types
- **docs/DATA_FLOW.md** - State flow patterns
- **Existing property panel:** `src/renderer/components/PropertyEditor/`

### Dependencies
- ✅ **Task 4.0** - State types defined
- ⚠️ **BLOCKS:** Task 4.4 (Code generation needs state runtime)

---

## 🗺️ Implementation Roadmap

### Milestone 1: State Panel UI
**Duration:** 1 day  
**Confidence Target:** 9/10  
**Status:** 🔵 Not Started

#### Objective
Create UI for viewing and managing page state variables.

#### Deliverables

**Create `src/renderer/components/StatePanel/StatePanel.tsx`:**

```tsx
// ============================================================
// STATE PANEL - Page State Variable Management
// ============================================================
// UI for managing page-level reactive state variables.
// Shows in the Navigator panel below the component tree.
// 
// Level 1.5 Constraints:
// - Only page-level state (no global/app state)
// - Only string, number, boolean types
// - Only static initial values
// ============================================================

import React, { useState } from 'react';
import { useLogicStore } from '../../store/logicStore';
import { StateVariable } from '../../../core/logic/types';
import { AddStateDialog } from './AddStateDialog';
import { StateVariableRow } from './StateVariableRow';

// ============================================================
// COMPONENT
// ============================================================

/**
 * StatePanel - Manages page state variables
 * 
 * Displays a list of all state variables and allows users to
 * add, edit, and delete them. Shows in the Navigator panel.
 */
export function StatePanel() {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const pageState = useLogicStore((state) => state.pageState);
  const stateVariables = Object.entries(pageState);
  
  return (
    <div className="border-t border-gray-200 pt-3 mt-3">
      {/* Header */}
      <div className="flex items-center justify-between px-3 mb-2">
        <h3 className="text-sm font-semibold text-gray-700">
          Page State
        </h3>
        <button
          className="text-xs px-2 py-1 bg-blue-100 text-blue-600 rounded hover:bg-blue-200"
          onClick={() => setShowAddDialog(true)}
        >
          + Add
        </button>
      </div>
      
      {/* State variables list */}
      {stateVariables.length === 0 ? (
        <EmptyState onAdd={() => setShowAddDialog(true)} />
      ) : (
        <div className="space-y-1">
          {stateVariables.map(([name, variable]) => (
            <StateVariableRow
              key={name}
              name={name}
              variable={variable}
            />
          ))}
        </div>
      )}
      
      {/* Level 1.5 info */}
      <div className="mt-3 px-3">
        <p className="text-xs text-gray-400">
          Use <code className="bg-gray-100 px-1 rounded">{'{{state.varName}}'}</code> in component text
        </p>
      </div>
      
      {/* Add dialog */}
      <AddStateDialog
        isOpen={showAddDialog}
        onClose={() => setShowAddDialog(false)}
      />
    </div>
  );
}

// ============================================================
// EMPTY STATE
// ============================================================

interface EmptyStateProps {
  onAdd: () => void;
}

function EmptyState({ onAdd }: EmptyStateProps) {
  return (
    <div className="px-3 py-4 text-center">
      <p className="text-sm text-gray-500 mb-2">
        No state variables yet
      </p>
      <button
        className="text-sm text-blue-500 hover:text-blue-600"
        onClick={onAdd}
      >
        Add your first variable
      </button>
    </div>
  );
}

export default StatePanel;
```

**Create `src/renderer/components/StatePanel/StateVariableRow.tsx`:**

```tsx
// ============================================================
// STATE VARIABLE ROW - Individual Variable Display
// ============================================================

import React, { useState } from 'react';
import { StateVariable } from '../../../core/logic/types';
import { useLogicStore } from '../../store/logicStore';

interface StateVariableRowProps {
  name: string;
  variable: StateVariable;
}

/**
 * Individual state variable row with edit/delete actions
 */
export function StateVariableRow({ name, variable }: StateVariableRowProps) {
  const [isEditing, setIsEditing] = useState(false);
  const deleteStateVariable = useLogicStore((state) => state.deleteStateVariable);
  const updateStateVariable = useLogicStore((state) => state.updateStateVariable);
  
  // Type indicator colors
  const typeColors = {
    string: 'bg-green-100 text-green-700',
    number: 'bg-blue-100 text-blue-700',
    boolean: 'bg-purple-100 text-purple-700',
  };
  
  const handleDelete = () => {
    if (confirm(`Delete state variable "${name}"?`)) {
      deleteStateVariable(name);
    }
  };
  
  return (
    <div className="px-3 py-2 hover:bg-gray-50 group">
      <div className="flex items-center justify-between">
        {/* Variable info */}
        <div className="flex items-center gap-2">
          <span className={`text-xs px-1.5 py-0.5 rounded ${typeColors[variable.type]}`}>
            {variable.type.charAt(0).toUpperCase()}
          </span>
          <span className="text-sm font-medium">{name}</span>
        </div>
        
        {/* Actions (shown on hover) */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            className="text-xs text-gray-400 hover:text-blue-500"
            onClick={() => setIsEditing(true)}
          >
            Edit
          </button>
          <button
            className="text-xs text-gray-400 hover:text-red-500"
            onClick={handleDelete}
          >
            Delete
          </button>
        </div>
      </div>
      
      {/* Current value */}
      <div className="text-xs text-gray-500 mt-0.5">
        Initial: {formatValue(variable.initialValue)}
      </div>
      
      {/* Edit dialog would go here */}
      {isEditing && (
        <EditStateDialog
          name={name}
          variable={variable}
          onClose={() => setIsEditing(false)}
        />
      )}
    </div>
  );
}

/**
 * Format value for display
 */
function formatValue(value: string | number | boolean): string {
  if (typeof value === 'string') {
    return `"${value}"`;
  }
  return String(value);
}

/**
 * Edit state variable dialog (inline or modal)
 */
function EditStateDialog({ 
  name, 
  variable, 
  onClose 
}: { 
  name: string; 
  variable: StateVariable; 
  onClose: () => void;
}) {
  const updateStateVariable = useLogicStore((state) => state.updateStateVariable);
  const [value, setValue] = useState(variable.initialValue);
  
  const handleSave = () => {
    updateStateVariable(name, { initialValue: value });
    onClose();
  };
  
  return (
    <div className="mt-2 p-2 bg-white border rounded shadow-sm">
      <div className="text-xs text-gray-500 mb-1">Initial Value:</div>
      {variable.type === 'boolean' ? (
        <select
          className="w-full text-sm border rounded px-2 py-1"
          value={String(value)}
          onChange={(e) => setValue(e.target.value === 'true')}
        >
          <option value="true">true</option>
          <option value="false">false</option>
        </select>
      ) : variable.type === 'number' ? (
        <input
          type="number"
          className="w-full text-sm border rounded px-2 py-1"
          value={value as number}
          onChange={(e) => setValue(parseFloat(e.target.value) || 0)}
        />
      ) : (
        <input
          type="text"
          className="w-full text-sm border rounded px-2 py-1"
          value={value as string}
          onChange={(e) => setValue(e.target.value)}
        />
      )}
      <div className="flex justify-end gap-2 mt-2">
        <button
          className="text-xs px-2 py-1 text-gray-500 hover:text-gray-700"
          onClick={onClose}
        >
          Cancel
        </button>
        <button
          className="text-xs px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
          onClick={handleSave}
        >
          Save
        </button>
      </div>
    </div>
  );
}

export default StateVariableRow;
```

**Create `src/renderer/components/StatePanel/AddStateDialog.tsx`:**

```tsx
// ============================================================
// ADD STATE DIALOG - Create New State Variable
// ============================================================

import React, { useState } from 'react';
import { useLogicStore } from '../../store/logicStore';
import { Modal } from '../common/Modal';

interface AddStateDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AddStateDialog({ isOpen, onClose }: AddStateDialogProps) {
  const [name, setName] = useState('');
  const [type, setType] = useState<'string' | 'number' | 'boolean'>('string');
  const [initialValue, setInitialValue] = useState<string | number | boolean>('');
  const [error, setError] = useState<string | null>(null);
  
  const addStateVariable = useLogicStore((state) => state.addStateVariable);
  const pageState = useLogicStore((state) => state.pageState);
  
  // --------------------------------------------------------
  // VALIDATION
  // --------------------------------------------------------
  
  const validateName = (name: string): string | null => {
    if (!name) return 'Name is required';
    if (!/^[a-zA-Z][a-zA-Z0-9_]*$/.test(name)) {
      return 'Name must start with a letter and contain only letters, numbers, and underscores';
    }
    if (pageState[name]) {
      return 'A variable with this name already exists';
    }
    return null;
  };
  
  // --------------------------------------------------------
  // HANDLERS
  // --------------------------------------------------------
  
  const handleTypeChange = (newType: 'string' | 'number' | 'boolean') => {
    setType(newType);
    // Reset initial value to appropriate default
    switch (newType) {
      case 'boolean':
        setInitialValue(false);
        break;
      case 'number':
        setInitialValue(0);
        break;
      default:
        setInitialValue('');
    }
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const validationError = validateName(name);
    if (validationError) {
      setError(validationError);
      return;
    }
    
    addStateVariable(name, type, initialValue);
    
    // Reset and close
    setName('');
    setType('string');
    setInitialValue('');
    setError(null);
    onClose();
  };
  
  const handleClose = () => {
    setName('');
    setType('string');
    setInitialValue('');
    setError(null);
    onClose();
  };
  
  // --------------------------------------------------------
  // RENDER
  // --------------------------------------------------------
  
  if (!isOpen) return null;
  
  return (
    <Modal onClose={handleClose}>
      <div className="p-4 w-80">
        <h2 className="text-lg font-semibold mb-4">Add State Variable</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Name
            </label>
            <input
              type="text"
              className={`w-full border rounded px-3 py-2 ${
                error ? 'border-red-300' : 'border-gray-300'
              }`}
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setError(null);
              }}
              placeholder="e.g., clickCount"
              autoFocus
            />
            {error && (
              <p className="text-xs text-red-500 mt-1">{error}</p>
            )}
          </div>
          
          {/* Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Type
            </label>
            <select
              className="w-full border border-gray-300 rounded px-3 py-2"
              value={type}
              onChange={(e) => handleTypeChange(e.target.value as any)}
            >
              <option value="string">String</option>
              <option value="number">Number</option>
              <option value="boolean">Boolean</option>
            </select>
          </div>
          
          {/* Initial Value */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Initial Value
            </label>
            {type === 'boolean' ? (
              <select
                className="w-full border border-gray-300 rounded px-3 py-2"
                value={String(initialValue)}
                onChange={(e) => setInitialValue(e.target.value === 'true')}
              >
                <option value="false">false</option>
                <option value="true">true</option>
              </select>
            ) : type === 'number' ? (
              <input
                type="number"
                className="w-full border border-gray-300 rounded px-3 py-2"
                value={initialValue as number}
                onChange={(e) => setInitialValue(parseFloat(e.target.value) || 0)}
              />
            ) : (
              <input
                type="text"
                className="w-full border border-gray-300 rounded px-3 py-2"
                value={initialValue as string}
                onChange={(e) => setInitialValue(e.target.value)}
                placeholder="Enter initial value..."
              />
            )}
          </div>
          
          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded"
              onClick={handleClose}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Add Variable
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
}

export default AddStateDialog;
```

---

### Milestone 2: Template Syntax Parser
**Duration:** 0.5 day  
**Confidence Target:** 8/10  
**Status:** 🔵 Not Started

#### Objective
Create parser for `{{state.varName}}` template syntax in component properties.

#### Deliverables

**Create `src/core/state/TemplateParser.ts`:**

```typescript
// ============================================================
// TEMPLATE PARSER - State Reference Extraction
// ============================================================
// Parses template syntax in component properties to find
// state variable references.
// 
// Supported syntax:
// - {{state.varName}} - Reference to page state variable
// 
// Level 1.5: Only supports simple state references, no expressions.
// ============================================================

/**
 * Result of parsing a template string
 */
export interface ParsedTemplate {
  /** Original template string */
  original: string;
  /** Whether the template contains any state references */
  hasStateRefs: boolean;
  /** List of state variable names referenced */
  stateRefs: string[];
  /** Template parts for code generation */
  parts: TemplatePart[];
}

/**
 * A segment of a parsed template
 */
export type TemplatePart = 
  | { type: 'text'; value: string }
  | { type: 'stateRef'; variable: string };

/**
 * Regex for matching state references
 * Matches: {{state.variableName}}
 */
const STATE_REF_REGEX = /\{\{state\.([a-zA-Z][a-zA-Z0-9_]*)\}\}/g;

/**
 * Parse a template string and extract state references
 * 
 * @param template - String that may contain {{state.varName}} references
 * @returns Parsed template with state references extracted
 * 
 * @example
 * parseTemplate("Count: {{state.clickCount}}")
 * // Returns: {
 * //   original: "Count: {{state.clickCount}}",
 * //   hasStateRefs: true,
 * //   stateRefs: ["clickCount"],
 * //   parts: [
 * //     { type: "text", value: "Count: " },
 * //     { type: "stateRef", variable: "clickCount" }
 * //   ]
 * // }
 */
export function parseTemplate(template: string): ParsedTemplate {
  const stateRefs: string[] = [];
  const parts: TemplatePart[] = [];
  
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  
  // Reset regex state
  STATE_REF_REGEX.lastIndex = 0;
  
  while ((match = STATE_REF_REGEX.exec(template)) !== null) {
    // Add text before the match
    if (match.index > lastIndex) {
      parts.push({
        type: 'text',
        value: template.slice(lastIndex, match.index),
      });
    }
    
    // Add the state reference
    const varName = match[1];
    parts.push({
      type: 'stateRef',
      variable: varName,
    });
    
    // Track unique references
    if (!stateRefs.includes(varName)) {
      stateRefs.push(varName);
    }
    
    lastIndex = match.index + match[0].length;
  }
  
  // Add remaining text
  if (lastIndex < template.length) {
    parts.push({
      type: 'text',
      value: template.slice(lastIndex),
    });
  }
  
  // If no parts, the whole thing is text
  if (parts.length === 0) {
    parts.push({ type: 'text', value: template });
  }
  
  return {
    original: template,
    hasStateRefs: stateRefs.length > 0,
    stateRefs,
    parts,
  };
}

/**
 * Generate JavaScript expression from parsed template
 * 
 * @param parsed - Parsed template
 * @param stateAccessor - How to access state (e.g., "pageState")
 * @returns JavaScript expression string
 * 
 * @example
 * generateExpression(parseTemplate("Count: {{state.clickCount}}"), "state")
 * // Returns: `Count: ${state.clickCount}`
 */
export function generateExpression(
  parsed: ParsedTemplate,
  stateAccessor: string = 'state'
): string {
  if (!parsed.hasStateRefs) {
    // No state refs, return as plain string
    return JSON.stringify(parsed.original);
  }
  
  // Build template literal
  const segments = parsed.parts.map((part) => {
    if (part.type === 'text') {
      // Escape backticks and ${
      return part.value
        .replace(/\\/g, '\\\\')
        .replace(/`/g, '\\`')
        .replace(/\$\{/g, '\\${');
    } else {
      return `\${${stateAccessor}.${part.variable}}`;
    }
  });
  
  return '`' + segments.join('') + '`';
}

/**
 * Validate that all state references exist in page state
 * 
 * @param parsed - Parsed template
 * @param pageState - Available state variables
 * @returns List of missing variable names
 */
export function validateStateRefs(
  parsed: ParsedTemplate,
  pageState: Record<string, unknown>
): string[] {
  return parsed.stateRefs.filter((ref) => !(ref in pageState));
}
```

---

### Milestone 3: Runtime State Management
**Duration:** 1 day  
**Confidence Target:** 8/10  
**Status:** 🔵 Not Started

#### Objective
Create the runtime state management code that gets injected into generated apps.

#### Deliverables

**Create `src/core/state/PageStateRuntime.ts`:**

```typescript
// ============================================================
// PAGE STATE RUNTIME - Generated Code Template
// ============================================================
// This module generates the runtime state management code
// that gets included in generated apps.
// 
// Uses Zustand-like pattern for simplicity and reactivity.
// ============================================================

import { PageState } from '../logic/types';

/**
 * Generate the page state runtime code
 * 
 * This code is injected into generated apps to provide
 * reactive state management.
 * 
 * @param pageState - Page state definitions from manifest
 * @returns JavaScript code string for the runtime
 */
export function generatePageStateRuntime(pageState: PageState): string {
  if (Object.keys(pageState).length === 0) {
    // No state, return minimal stub
    return `
// No page state defined
export const usePageState = () => ({});
export const setPageState = () => {};
`;
  }
  
  // Build initial state object
  const initialStateEntries = Object.entries(pageState)
    .map(([name, def]) => {
      const value = JSON.stringify(def.initialValue);
      return `  ${name}: ${value}`;
    })
    .join(',\n');
  
  return `
// ============================================================
// PAGE STATE RUNTIME
// Generated by Rise - Do not edit manually
// ============================================================

import { useState, useCallback, useSyncExternalStore } from 'react';

// Initial state values
const initialState = {
${initialStateEntries}
};

// Current state (module-level for simplicity)
let state = { ...initialState };

// Subscribers for reactivity
const subscribers = new Set();

/**
 * Subscribe to state changes
 */
function subscribe(callback) {
  subscribers.add(callback);
  return () => subscribers.delete(callback);
}

/**
 * Get current state snapshot
 */
function getSnapshot() {
  return state;
}

/**
 * Notify all subscribers of state change
 */
function notifySubscribers() {
  subscribers.forEach((callback) => callback());
}

/**
 * Set a state variable
 * @param {string} key - Variable name
 * @param {*} value - New value
 */
export function setPageState(key, value) {
  if (!(key in state)) {
    console.warn(\`Unknown state variable: \${key}\`);
    return;
  }
  
  state = { ...state, [key]: value };
  notifySubscribers();
}

/**
 * Get current state value
 * @param {string} key - Variable name
 * @returns {*} Current value
 */
export function getPageState(key) {
  return state[key];
}

/**
 * React hook for using page state
 * Components using this will re-render when state changes.
 * @returns {object} Current state object
 */
export function usePageState() {
  return useSyncExternalStore(subscribe, getSnapshot);
}

/**
 * Reset state to initial values
 */
export function resetPageState() {
  state = { ...initialState };
  notifySubscribers();
}
`;
}

/**
 * Generate import statement for page state runtime
 */
export function generatePageStateImport(): string {
  return `import { usePageState, setPageState } from './pageState';`;
}
```

---

### Milestone 4: Integration & Testing
**Duration:** 0.5 day  
**Confidence Target:** 8/10  
**Status:** 🔵 Not Started

#### Objective
Integrate state panel into UI and test end-to-end.

#### Deliverables

- [ ] Add StatePanel to Navigator component
- [ ] Update manifest saving to include pageState
- [ ] Unit tests for TemplateParser
- [ ] Unit tests for PageStateRuntime generation
- [ ] Integration test: add state → use in component → see update

---

## 🧪 Testing Requirements

### Unit Tests
- [ ] TemplateParser parses simple references
- [ ] TemplateParser handles multiple references
- [ ] TemplateParser handles no references
- [ ] TemplateParser validates against page state
- [ ] PageStateRuntime generates valid JS
- [ ] State store CRUD operations work

### Integration Tests
- [ ] State panel reflects store state
- [ ] Adding variable updates store
- [ ] Deleting variable removes from store
- [ ] Template syntax renders in preview

---

## 📋 Human Review Checklist

- [ ] State panel UX is intuitive
- [ ] Template syntax is clear
- [ ] Generated runtime code is efficient
- [ ] Reactivity works correctly
- [ ] Error messages are helpful

---

**Task Status:** 🔵 Not Started  
**Next Step:** Create StatePanel UI  
**Last Updated:** [Date]