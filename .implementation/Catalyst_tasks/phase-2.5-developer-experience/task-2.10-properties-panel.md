# Task 2.10: Workflow Properties Panel

**Phase:** Phase 2.5 - Developer Experience & Testing  
**Duration Estimate:** 2-3 days  
**Actual Duration:** [To be filled when complete]  
**Status:** 🔵 Not Started  
**Assigned:** AI + Human Review  
**Started:** [YYYY-MM-DD]  
**Completed:** [YYYY-MM-DD]  

---

## Task Overview

### Objective
Build a visual properties panel that allows users to configure workflow nodes without writing code. This is the single most critical feature for making Catalyst usable - without it, all node configuration is hardcoded in test files.

Currently, nodes are created with hardcoded config:
```typescript
addNode(workflowId, {
  id: 'node_groq_1',
  type: 'groqCompletion',
  config: {
    apiKey: 'hardcoded',
    model: 'llama-3.1-70b-versatile',
    // ...must edit code to change
  }
});
```

Users need a **visual properties panel** to configure nodes dynamically.

### Success Criteria
- [ ] Clicking a node shows configuration panel on right side
- [ ] All node types have config fields defined in registry
- [ ] Text, number, select, textarea, boolean, and secret inputs work
- [ ] Changes to config immediately update workflow store
- [ ] Required field validation shows errors
- [ ] Clicking canvas background deselects node
- [ ] Properties panel shows empty state when nothing selected
- [ ] Test coverage >85%
- [ ] Human review completed

### References
- Phase 2.5 README.md - Properties Panel overview
- .clinerules/implementation-standards.md - Code documentation standards
- src/core/workflow/nodes/registry.ts - Node registry structure

### Dependencies
- Phase 2 complete (workflow nodes exist)
- Zustand workflow store functional
- React Flow canvas working

---

## Milestones

### Milestone 1: Design Properties Panel Architecture
**Date:** [YYYY-MM-DD]  
**Confidence:** [X/10]  
**Status:** 🔵 Not Started  
**Time Spent:** [X hours]  

#### Activities
- [ ] Research React form libraries (react-hook-form, formik, or custom)
- [ ] Design config field metadata schema
- [ ] Plan component hierarchy
- [ ] Document state management approach

#### Design Decisions

| Decision | Options Considered | Choice Made | Rationale | Confidence |
|----------|-------------------|-------------|-----------|------------|
| Form library | react-hook-form, formik, custom | Custom components | Full control, no dependencies, simple use case | 8/10 |
| Config metadata location | Node files, separate config file, registry | Node registry | Centralized, type-safe, used by both UI and codegen | 9/10 |
| Field type system | String-based, enum, discriminated union | String literal union | TypeScript safety, simple, extensible | 9/10 |
| Validation approach | Zod, Yup, custom | Custom validation | Lightweight, sufficient for our needs | 8/10 |
| State updates | Debounced, immediate, on blur | Immediate (no debounce) | Real-time feedback, simple implementation | 8/10 |

#### Notes
- **Why custom components?** React-hook-form adds 40KB bundle size for features we don't need. Our form requirements are simple: controlled inputs with onChange handlers.
- **Config metadata in registry:** The registry already defines node types. Adding `configFields` keeps everything centralized and ensures UI and codegen stay in sync.
- **No debouncing:** While debouncing might seem like an optimization, it adds complexity and delays user feedback. React can handle input changes at 60fps easily.

---

### Milestone 2: Implement Base Components
**Date:** [YYYY-MM-DD]  
**Confidence:** [X/10]  
**Status:** 🔵 Not Started  
**Time Spent:** [X hours]  

#### Files Created/Modified
- `src/renderer/components/WorkflowCanvas/WorkflowPropertiesPanel.tsx` - Main panel
- `src/renderer/components/WorkflowCanvas/NodeConfigForm.tsx` - Form generator
- `src/renderer/components/WorkflowCanvas/form-fields/DynamicFormField.tsx` - Field router
- `src/core/workflow/nodes/registry.ts` - Add ConfigFieldDefinition type

#### Implementation Notes

**1. WorkflowPropertiesPanel Component**

```typescript
/**
 * @file WorkflowPropertiesPanel.tsx
 * @description Right-side properties panel for node configuration
 * @architecture Phase 2.5, Task 2.10 - Properties Panel
 * @created 2025-12-21
 * @author AI (Cline) + Human Review
 * @confidence 8/10 - Straightforward React component
 */

import React from 'react';
import { useWorkflowStore } from '@/renderer/store/workflowStore';
import { NodeConfigForm } from './NodeConfigForm';
import { X } from 'lucide-react';

interface WorkflowPropertiesPanelProps {
  workflowId: string;
  selectedNodeId: string | null;
  onClose?: () => void;
}

/**
 * Properties panel for configuring selected workflow nodes.
 * 
 * PROBLEM SOLVED:
 * - Users need to configure nodes without editing code
 * - Different node types require different configuration fields
 * - Config changes must persist to workflow store
 * 
 * SOLUTION:
 * - Display dynamic form based on selected node type
 * - Use node registry metadata to generate form fields
 * - Real-time updates to Zustand store
 */
export function WorkflowPropertiesPanel({ 
  workflowId, 
  selectedNodeId,
  onClose
}: WorkflowPropertiesPanelProps) {
  const workflow = useWorkflowStore((state) => 
    state.workflows[workflowId]
  );
  
  // If no node selected, show empty state
  if (!selectedNodeId || !workflow) {
    return (
      <div className="h-full flex flex-col bg-gray-50 border-l border-gray-200">
        <EmptyState />
      </div>
    );
  }
  
  const node = workflow.nodes[selectedNodeId];
  
  // Node not found (shouldn't happen, but defensive)
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
      <div className="p-4 border-b border-gray-200 bg-white">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">
            Node Properties
          </h2>
          {onClose && (
            <button
              onClick={onClose}
              className="p-1 hover:bg-gray-100 rounded"
              aria-label="Close properties panel"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          )}
        </div>
        <p className="text-sm text-gray-500 mt-1">
          {node.name} <span className="text-gray-400">({node.type})</span>
        </p>
      </div>
      
      {/* Form Content */}
      <div className="flex-1 overflow-y-auto p-4">
        <NodeConfigForm 
          workflowId={workflowId}
          node={node}
        />
      </div>
    </div>
  );
}

/**
 * Empty state when no node is selected.
 */
function EmptyState({ message }: { message?: string }) {
  return (
    <div className="flex-1 flex items-center justify-center p-8">
      <div className="text-center">
        <div className="text-gray-400 mb-2">
          <svg
            className="w-16 h-16 mx-auto"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
        </div>
        <p className="text-gray-500 font-medium">
          {message || 'No node selected'}
        </p>
        <p className="text-gray-400 text-sm mt-1">
          Click a node in the canvas to configure it
        </p>
      </div>
    </div>
  );
}
```

**2. NodeConfigForm Component**

```typescript
/**
 * @file NodeConfigForm.tsx
 * @description Dynamic form generator based on node type
 * @architecture Phase 2.5, Task 2.10
 */

import React from 'react';
import { NodeDefinition } from '@/core/workflow/types';
import { NODE_REGISTRY } from '@/core/workflow/nodes/registry';
import { useWorkflowStore } from '@/renderer/store/workflowStore';
import { DynamicFormField } from './form-fields/DynamicFormField';
import { AlertCircle } from 'lucide-react';

interface NodeConfigFormProps {
  workflowId: string;
  node: NodeDefinition;
}

/**
 * Generates configuration form dynamically based on node type.
 * 
 * DESIGN:
 * - Looks up node metadata from registry
 * - Iterates through configFields array
 * - Renders appropriate input component for each field
 * - Updates workflow store on change
 */
export function NodeConfigForm({ workflowId, node }: NodeConfigFormProps) {
  const updateNodeConfig = useWorkflowStore(
    (state) => state.updateNodeConfig
  );
  
  // Get node metadata from registry
  const nodeMetadata = NODE_REGISTRY[node.type];
  
  // Unknown node type (shouldn't happen)
  if (!nodeMetadata) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-md">
        <div className="flex items-start">
          <AlertCircle className="w-5 h-5 text-red-600 mr-2 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-red-800">
              Unknown node type: {node.type}
            </p>
            <p className="text-xs text-red-600 mt-1">
              This node type is not registered in the node registry.
            </p>
          </div>
        </div>
      </div>
    );
  }
  
  // Handler for field changes
  const handleFieldChange = (fieldPath: string, value: any) => {
    // Update workflow store (debouncing handled by store if needed)
    updateNodeConfig(workflowId, node.id, fieldPath, value);
  };
  
  // Helper to get nested config value
  const getConfigValue = (path: string): any => {
    if (path === 'name') {
      return node.name;
    }
    
    const parts = path.split('.');
    let value: any = node.config;
    
    for (const part of parts) {
      value = value?.[part];
    }
    
    return value;
  };
  
  return (
    <div className="space-y-4">
      {/* Node Name (always shown first) */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          Node Name
          <span className="text-red-500 ml-1">*</span>
        </label>
        <input
          type="text"
          value={node.name || ''}
          onChange={(e) => handleFieldChange('name', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md 
                     focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="Enter node name"
        />
        <p className="text-xs text-gray-500">
          A descriptive name for this node
        </p>
      </div>
      
      {/* Dynamic fields based on node type */}
      {nodeMetadata.configFields && nodeMetadata.configFields.length > 0 ? (
        nodeMetadata.configFields.map((field) => (
          <DynamicFormField
            key={field.path}
            field={field}
            value={getConfigValue(field.path)}
            onChange={(value) => handleFieldChange(field.path, value)}
          />
        ))
      ) : (
        <div className="p-4 bg-gray-100 rounded-md">
          <p className="text-sm text-gray-600">
            This node type has no configurable fields.
          </p>
        </div>
      )}
      
      {/* Node ID (read-only, for debugging) */}
      <div className="pt-4 border-t border-gray-200">
        <p className="text-xs text-gray-400">
          Node ID: <code className="bg-gray-100 px-1 py-0.5 rounded">{node.id}</code>
        </p>
      </div>
    </div>
  );
}
```

---

### Milestone 3: Implement Form Field Components
**Date:** [YYYY-MM-DD]  
**Confidence:** [X/10]  
**Status:** 🔵 Not Started  
**Time Spent:** [X hours]  

#### Files Created
- `src/renderer/components/WorkflowCanvas/form-fields/DynamicFormField.tsx`
- `src/renderer/components/WorkflowCanvas/form-fields/TextInput.tsx`
- `src/renderer/components/WorkflowCanvas/form-fields/NumberInput.tsx`
- `src/renderer/components/WorkflowCanvas/form-fields/SelectInput.tsx`
- `src/renderer/components/WorkflowCanvas/form-fields/TextareaInput.tsx`
- `src/renderer/components/WorkflowCanvas/form-fields/BooleanInput.tsx`
- `src/renderer/components/WorkflowCanvas/form-fields/SecretInput.tsx`

#### Implementation Notes

See PHASE-2.5-TASKS.md for full component code. Each input component follows this pattern:
- Accepts field metadata, value, onChange
- Renders label with required indicator
- Shows description text below
- Handles validation errors
- Styled consistently with Tailwind

---

### Milestone 4: Update Node Registry with Config Metadata
**Date:** 2025-12-21  
**Confidence:** 9/10  
**Status:** ✅ Complete  
**Time Spent:** 1 hour  

#### Files Modified
- `src/core/workflow/nodes/registry.ts` - Added configFields to all 14 CORE nodes

#### Implementation Notes

**Summary:**
All 14 CORE nodes now have comprehensive `configFields` metadata:

✅ **Triggers (2):**
- httpEndpoint: path, method, description
- scheduledTask: schedule, timezone, enabled

✅ **LLM Nodes (6):**
- anthropicCompletion: apiKey, model, system, prompt, temperature, maxTokens, stream
- openaiCompletion: apiKey, model, prompt, temperature, maxTokens, stream
- groqCompletion: apiKey, model, prompt, temperature, maxTokens, stream
- embeddingGenerate: provider, apiKey, model, text
- promptTemplate: template, variables
- llmRouter: routingStrategy, models, fallbackModel

✅ **Data Sources (2):**
- qdrantSearch: url, apiKey, collection, queryVector, limit, scoreThreshold
- postgresQuery: connectionString, query, params, timeout

✅ **Control Flow (2):**
- condition: condition, description
- parallel: maxConcurrency, failureStrategy

✅ **Transform (1):**
- editFields: operations, mode

✅ **Utilities (1):**
- log: message, level, includeInput

**Config Field Type Definition:**

```typescript
export interface ConfigFieldDefinition {
  path: string; // e.g., 'apiKey' or 'options.temperature'
  label: string;
  type: 'text' | 'number' | 'select' | 'textarea' | 'boolean' | 'secret';
  required?: boolean;
  placeholder?: string;
  description?: string;
  options?: Array<{ label: string; value: any }>; // For select fields
  min?: number; // For number fields
  max?: number;
  step?: number; // For number fields
  rows?: number; // For textarea
}

export interface NodeMetadata {
  type: string;
  category: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  configFields: ConfigFieldDefinition[]; // NEW
}
```

**Example for groqCompletion:**

```typescript
groqCompletion: {
  type: 'groqCompletion',
  category: 'llm',
  name: 'Groq Completion',
  description: 'Ultra-fast LLM inference with Groq',
  icon: 'Zap',
  color: 'orange',
  configFields: [
    {
      path: 'apiKey',
      label: 'API Key',
      type: 'secret',
      required: true,
      description: 'Your Groq API key (stored securely in system keychain)',
    },
    {
      path: 'model',
      label: 'Model',
      type: 'select',
      required: true,
      options: [
        { label: 'Llama 3.1 70B Versatile', value: 'llama-3.1-70b-versatile' },
        { label: 'Llama 3.1 8B Instant', value: 'llama-3.1-8b-instant' },
        { label: 'Mixtral 8x7B', value: 'mixtral-8x7b-32768' },
      ],
      description: 'Choose the Groq model to use',
    },
    {
      path: 'prompt',
      label: 'Prompt',
      type: 'textarea',
      required: true,
      rows: 6,
      placeholder: 'Enter your prompt here...',
      description: 'Supports {{variable}} interpolation from previous nodes',
    },
    {
      path: 'temperature',
      label: 'Temperature',
      type: 'number',
      min: 0,
      max: 2,
      step: 0.1,
      placeholder: '0.7',
      description: 'Controls randomness (0-2). Higher = more creative.',
    },
    {
      path: 'maxTokens',
      label: 'Max Tokens',
      type: 'number',
      min: 1,
      max: 32768,
      placeholder: '1000',
      description: 'Maximum tokens in response',
    },
    {
      path: 'stream',
      label: 'Enable Streaming',
      type: 'boolean',
      description: 'Stream response tokens as they arrive',
    },
  ],
},
```

---

### Milestone 5: Update Workflow Store
**Date:** [YYYY-MM-DD]  
**Confidence:** [X/10]  
**Status:** 🔵 Not Started  
**Time Spent:** [X hours]  

#### Files Modified
- `src/renderer/store/workflowStore.ts` - Add updateNodeConfig action

#### Implementation Notes

```typescript
interface WorkflowStore {
  // ... existing state
  
  updateNodeConfig: (
    workflowId: string, 
    nodeId: string, 
    fieldPath: string, 
    value: any
  ) => void;
}

export const useWorkflowStore = create<WorkflowStore>((set) => ({
  // ... existing state
  
  updateNodeConfig: (workflowId, nodeId, fieldPath, value) => {
    set((state) => {
      const workflow = state.workflows[workflowId];
      if (!workflow) return state;
      
      const node = workflow.nodes[nodeId];
      if (!node) return state;
      
      // Handle nested paths like 'options.temperature'
      const pathParts = fieldPath.split('.');
      const updatedNode = { ...node };
      
      if (pathParts.length === 1) {
        // Simple field like 'name' or 'apiKey'
        if (pathParts[0] === 'name') {
          updatedNode.name = value;
        } else {
          updatedNode.config = {
            ...updatedNode.config,
            [pathParts[0]]: value,
          };
        }
      } else {
        // Nested field like 'options.temperature'
        const nestedConfig = { ...updatedNode.config };
        let current: any = nestedConfig;
        
        // Navigate to parent object
        for (let i = 0; i < pathParts.length - 1; i++) {
          current[pathParts[i]] = { ...current[pathParts[i]] };
          current = current[pathParts[i]];
        }
        
        // Set value on leaf
        current[pathParts[pathParts.length - 1]] = value;
        updatedNode.config = nestedConfig;
      }
      
      return {
        workflows: {
          ...state.workflows,
          [workflowId]: {
            ...workflow,
            nodes: {
              ...workflow.nodes,
              [nodeId]: updatedNode,
            },
          },
        },
      };
    });
  },
}));
```

---

### Milestone 6: Integrate with Canvas
**Date:** [YYYY-MM-DD]  
**Confidence:** [X/10]  
**Status:** 🔵 Not Started  
**Time Spent:** [X hours]  

#### Files Modified
- `src/renderer/components/WorkflowCanvas/WorkflowCanvas.tsx` - Add panel integration

#### Implementation Notes

```typescript
export function WorkflowCanvas({ workflowId }: { workflowId: string }) {
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  
  // ... existing code
  
  const onNodeClick = useCallback((event: any, node: any) => {
    setSelectedNodeId(node.id);
  }, []);
  
  const onPaneClick = useCallback(() => {
    setSelectedNodeId(null); // Deselect when clicking canvas
  }, []);
  
  return (
    <div className="flex h-full">
      {/* Canvas */}
      <div className="flex-1">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeClick={onNodeClick}
          onPaneClick={onPaneClick}
          nodeTypes={nodeTypes}
          fitView
        >
          <Background />
          <Controls />
          <MiniMap />
        </ReactFlow>
      </div>
      
      {/* Properties Panel */}
      <div className="w-80">
        <WorkflowPropertiesPanel 
          workflowId={workflowId}
          selectedNodeId={selectedNodeId}
        />
      </div>
    </div>
  );
}
```

---

### Milestone 7: Testing & Validation
**Date:** [YYYY-MM-DD]  
**Confidence:** [X/10]  
**Status:** 🔵 Not Started  
**Time Spent:** [X hours]  

#### Test Results

**Unit Tests:**
```
[To be filled during implementation]
```

**Manual Testing:**

| Test Scenario | Expected | Actual | Pass/Fail | Notes |
|---------------|----------|--------|-----------|-------|
| Click node shows panel | Panel appears with node config | [To test] | - | - |
| Edit text field | Config updates immediately | [To test] | - | - |
| Edit number field | Only accepts numbers | [To test] | - | - |
| Select dropdown | Shows options, updates config | [To test] | - | - |
| Toggle boolean | Checkbox updates config | [To test] | - | - |
| Secret field | Hides value like password | [To test] | - | - |
| Required validation | Shows error for empty required | [To test] | - | - |
| Click canvas | Deselects node, shows empty state | [To test] | - | - |

---

### Milestone 8: Human Review
**Date:** [YYYY-MM-DD]  
**Confidence:** [X/10]  
**Status:** 🔵 Not Started  
**Time Spent:** [X hours]  

#### Human Review

**Reviewer:** [Name]  
**Date:** [YYYY-MM-DD]  
**Duration:** [X minutes]  

**Feedback Received:**

**Positive:**
- ✅ [To be filled]

**Concerns:**
- ⚠️ [To be filled]

**Sign-off:**
- [ ] Properties panel approved
- [ ] All node types configurable
- [ ] Ready for Task 2.11 (Execution Logging)

**Final Confidence:** [X/10]

---

## Final Summary

### Deliverables
- [ ] WorkflowPropertiesPanel component
- [ ] NodeConfigForm component
- [ ] 6 form field components (text, number, select, textarea, boolean, secret)
- [ ] ConfigFieldDefinition types
- [ ] All nodes have configFields in registry
- [ ] updateNodeConfig action in store
- [ ] Canvas integration complete
- [ ] Test coverage >85%

### What Was Accomplished
[To be filled upon completion]

### Lessons Learned

**What Worked Well:**
- [To be filled]

**What Could Be Improved:**
- [To be filled]

**Reusable Patterns:**
- [To be filled]

### Technical Debt Created
- Consider adding Zod validation in future
- May need form state caching for performance

### Next Steps
- [ ] Proceed to Task 2.11: Execution Logging System
- [ ] Update PHASE-2.5-TASKS.md with progress

---

## Appendix

### Key Files
- `src/renderer/components/WorkflowCanvas/WorkflowPropertiesPanel.tsx`
- `src/renderer/components/WorkflowCanvas/NodeConfigForm.tsx`
- `src/renderer/components/WorkflowCanvas/form-fields/`
- `src/core/workflow/nodes/registry.ts`
- `src/renderer/store/workflowStore.ts`

### Config Field Types

| Type | Use For | Validation |
|------|---------|------------|
| text | Short strings, URLs | Length |
| number | Numbers with min/max | Range |
| select | Predefined choices | Option existence |
| textarea | Long text, prompts | Length |
| boolean | On/off toggles | None |
| secret | API keys, passwords | Masked display |

### Related Tasks
- Task 2.11: Execution Logging (uses configured nodes)
- Task 2.13: Node Pinning (also edits config)

---

**Task Status:** 🔵 Not Started  
**Ready for:** Implementation  
**Last Updated:** 2025-12-21
