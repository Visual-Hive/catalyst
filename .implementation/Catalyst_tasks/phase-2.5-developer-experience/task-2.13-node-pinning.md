# Task 2.13: Node Data Pinning System

**Phase:** Phase 2.5 - Developer Experience & Testing  
**Duration Estimate:** 1 day  
**Actual Duration:** [To be filled when complete]  
**Status:** 🔵 Not Started  
**Assigned:** AI + Human Review  
**Started:** [YYYY-MM-DD]  
**Completed:** [YYYY-MM-DD]  

---

## Task Overview

### Objective
Implement node data pinning (like n8n) that allows users to "freeze" JSON data on nodes for testing without running the full workflow. This is critical for iterative development and testing individual nodes.

### Success Criteria
- [ ] Right-click node shows "Pin Data" option
- [ ] JSON editor modal opens with Monaco editor
- [ ] Can paste or edit JSON directly
- [ ] Pinned nodes show visual indicator (purple border + pin icon)
- [ ] Generated Python uses pinned data instead of live data
- [ ] Can unpin data via context menu
- [ ] Pinned data persists across editor restarts
- [ ] Invalid JSON shows validation errors
- [ ] Test coverage >85%

### References
- Phase 2.5 README.md - Node Pinning overview
- n8n data pinning feature for UX reference
- Task 2.10 - Properties Panel (similar UI patterns)

### Dependencies
- Task 2.10 complete (properties panel working)
- Workflow store functional
- Monaco editor available

---

## Milestones

### Milestone 1: Design Pinning Architecture
**Confidence:** 8/10  
**Status:** 🔵 Not Started  

#### Design Decisions

| Decision | Options Considered | Choice Made | Rationale | Confidence |
|----------|-------------------|-------------|-----------|------------|
| Storage location | Separate file, workflow manifest, database | Workflow manifest | Keeps data with workflow, portable | 9/10 |
| Editor | Textarea, Monaco, CodeMirror | Monaco | Syntax highlighting, validation, familiar to developers | 8/10 |
| Visual indicator | Badge, border color, icon | Purple border + pin icon | Clear, consistent with design system | 9/10 |
| Pinning scope | Per execution, permanent until unpinned | Permanent until unpinned | Simpler, matches n8n behavior | 9/10 |

---

### Milestone 2: Update Node Schema
**Confidence:** 9/10  
**Status:** 🔵 Not Started  

#### Files Modified
- `src/core/workflow/types.ts` - Add pinnedData field

```typescript
export interface NodeDefinition {
  id: string;
  type: string;
  name: string;
  position: { x: number; y: number };
  config: Record<string, any>;
  
  // NEW: Pinned data for testing
  pinnedData?: {
    enabled: boolean;
    data: any; // The JSON data to use
    timestamp: string; // When it was pinned
  };
}
```

---

### Milestone 3: Create Node Context Menu
**Confidence:** 8/10  
**Status:** 🔵 Not Started  

#### Files Created
- `src/renderer/components/WorkflowCanvas/NodeContextMenu.tsx`

#### Implementation

```typescript
/**
 * @file NodeContextMenu.tsx
 * @description Context menu for workflow nodes
 * @architecture Phase 2.5, Task 2.13
 */

import React, { useState } from 'react';
import { Pin, PinOff, Trash2, Play } from 'lucide-react';
import { useWorkflowStore } from '@/renderer/store/workflowStore';

interface NodeContextMenuProps {
  nodeId: string;
  workflowId: string;
  position: { x: number; y: number };
  onClose: () => void;
  onPinData: () => void;
}

export function NodeContextMenu({ 
  nodeId, 
  workflowId, 
  position, 
  onClose,
  onPinData
}: NodeContextMenuProps) {
  const node = useWorkflowStore((state) => 
    state.workflows[workflowId]?.nodes[nodeId]
  );
  
  const { unpinNodeData, deleteNode } = useWorkflowStore();
  
  const hasPinnedData = node?.pinnedData?.enabled;
  
  const handlePinData = () => {
    onPinData();
    onClose();
  };
  
  const handleUnpin = () => {
    unpinNodeData(workflowId, nodeId);
    onClose();
  };
  
  const handleDelete = () => {
    deleteNode(workflowId, nodeId);
    onClose();
  };
  
  return (
    <div 
      className="absolute bg-white rounded-lg shadow-lg border border-gray-200 py-1 min-w-48 z-50"
      style={{ left: position.x, top: position.y }}
    >
      {hasPinnedData ? (
        <MenuItem
          icon={<PinOff className="w-4 h-4" />}
          label="Unpin Data"
          onClick={handleUnpin}
        />
      ) : (
        <MenuItem
          icon={<Pin className="w-4 h-4" />}
          label="Pin Data"
          onClick={handlePinData}
        />
      )}
      
      <MenuItem
        icon={<Play className="w-4 h-4" />}
        label="Execute to Here"
        onClick={() => {/* Task 2.14 */}}
      />
      
      <div className="border-t border-gray-200 my-1" />
      
      <MenuItem
        icon={<Trash2 className="w-4 h-4 text-red-500" />}
        label="Delete Node"
        onClick={handleDelete}
        className="text-red-600 hover:bg-red-50"
      />
    </div>
  );
}

function MenuItem({ 
  icon, 
  label, 
  onClick, 
  className = '' 
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  className?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`
        w-full flex items-center gap-3 px-3 py-2 text-sm
        hover:bg-gray-100 transition-colors text-left
        ${className}
      `}
    >
      {icon}
      {label}
    </button>
  );
}
```

---

### Milestone 4: Create Pin Data Modal
**Confidence:** 8/10  
**Status:** 🔵 Not Started  

#### Files Created
- `src/renderer/components/WorkflowCanvas/PinDataModal.tsx`

#### Implementation

```typescript
/**
 * @file PinDataModal.tsx
 * @description Modal for pinning JSON data to nodes
 * @architecture Phase 2.5, Task 2.13
 */

import React, { useState } from 'react';
import { useWorkflowStore } from '@/renderer/store/workflowStore';
import { X, AlertCircle } from 'lucide-react';
import Editor from '@monaco-editor/react';

interface PinDataModalProps {
  workflowId: string;
  nodeId: string;
  onClose: () => void;
}

export function PinDataModal({ 
  workflowId, 
  nodeId, 
  onClose 
}: PinDataModalProps) {
  const node = useWorkflowStore((state) => 
    state.workflows[workflowId]?.nodes[nodeId]
  );
  
  const [jsonText, setJsonText] = useState(
    node?.pinnedData?.data 
      ? JSON.stringify(node.pinnedData.data, null, 2)
      : '{\n  \n}'
  );
  
  const [error, setError] = useState<string | null>(null);
  
  const { pinNodeData } = useWorkflowStore();
  
  const handleSave = () => {
    try {
      // Validate JSON
      const parsed = JSON.parse(jsonText);
      
      // Save to store
      pinNodeData(workflowId, nodeId, parsed);
      
      onClose();
    } catch (err) {
      setError(`Invalid JSON: ${(err as Error).message}`);
    }
  };
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">Pin Data: {node?.name}</h2>
            <p className="text-sm text-gray-500 mt-1">
              This data will be used instead of live data from previous nodes
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        {/* Editor */}
        <div className="flex-1 p-4">
          <Editor
            height="400px"
            language="json"
            value={jsonText}
            onChange={(value) => {
              setJsonText(value || '');
              setError(null);
            }}
            options={{
              minimap: { enabled: false },
              lineNumbers: 'on',
              scrollBeyondLastLine: false,
              fontSize: 14,
              tabSize: 2,
            }}
            theme="vs-light"
          />
          
          {error && (
            <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-red-800">Validation Error</p>
                <p className="text-xs text-red-600 mt-1">{error}</p>
              </div>
            </div>
          )}
        </div>
        
        {/* Footer */}
        <div className="p-4 border-t border-gray-200 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors"
          >
            Pin Data
          </button>
        </div>
      </div>
    </div>
  );
}
```

---

### Milestone 5: Update Workflow Store
**Confidence:** 9/10  
**Status:** 🔵 Not Started  

#### Files Modified
- `src/renderer/store/workflowStore.ts` - Add pinning actions

```typescript
interface WorkflowStore {
  // ... existing
  
  pinNodeData: (workflowId: string, nodeId: string, data: any) => void;
  unpinNodeData: (workflowId: string, nodeId: string) => void;
}

export const useWorkflowStore = create<WorkflowStore>((set) => ({
  // ... existing
  
  pinNodeData: (workflowId, nodeId, data) => {
    set((state) => {
      const workflow = state.workflows[workflowId];
      if (!workflow) return state;
      
      const node = workflow.nodes[nodeId];
      if (!node) return state;
      
      return {
        workflows: {
          ...state.workflows,
          [workflowId]: {
            ...workflow,
            nodes: {
              ...workflow.nodes,
              [nodeId]: {
                ...node,
                pinnedData: {
                  enabled: true,
                  data,
                  timestamp: new Date().toISOString(),
                },
              },
            },
          },
        },
      };
    });
  },
  
  unpinNodeData: (workflowId, nodeId) => {
    set((state) => {
      const workflow = state.workflows[workflowId];
      if (!workflow) return state;
      
      const node = workflow.nodes[nodeId];
      if (!node) return state;
      
      return {
        workflows: {
          ...state.workflows,
          [workflowId]: {
            ...workflow,
            nodes: {
              ...workflow.nodes,
              [nodeId]: {
                ...node,
                pinnedData: undefined,
              },
            },
          },
        },
      };
    });
  },
}));
```

---

### Milestone 6: Add Visual Indicators
**Confidence:** 9/10  
**Status:** 🔵 Not Started  

#### Files Modified
- `src/renderer/components/WorkflowCanvas/WorkflowNode.tsx`

```typescript
export function WorkflowNode({ data }: { data: NodeDefinition }) {
  const isPinned = data.pinnedData?.enabled;
  
  return (
    <div className={`
      relative p-4 bg-white rounded-lg shadow-md
      ${isPinned ? 'border-2 border-purple-500' : 'border-2 border-gray-300'}
    `}>
      {isPinned && (
        <div className="absolute -top-2 -right-2 bg-purple-500 text-white rounded-full p-1"
             title="Data pinned">
          <Pin className="w-3 h-3" />
        </div>
      )}
      
      {/* ... rest of node UI */}
    </div>
  );
}
```

---

### Milestone 7: Update Code Generation
**Confidence:** 7/10  
**Status:** 🔵 Not Started  

#### Files Modified
- `src/core/codegen/python/WorkflowOrchestrator.ts`

```typescript
private generateNodeFunction(node: NodeDefinition): string {
  const generator = this.nodeGenerators[node.type];
  if (!generator) {
    throw new Error(`No generator for node type: ${node.type}`);
  }
  
  let code = generator.generateFunction(node, this.workflow);
  
  // If node has pinned data, override function to use it
  if (node.pinnedData?.enabled) {
    code += `

# PINNED DATA OVERRIDE
# Original function saved, using pinned test data instead
_original_${node.id} = ${node.id}

async def ${node.id}(context: ExecutionContext) -> Any:
    """${node.name} - USING PINNED TEST DATA"""
    # Use pinned data instead of executing node logic
    pinned_data = ${JSON.stringify(node.pinnedData.data)}
    context.set_node_output("${node.id}", pinned_data)
    return pinned_data
`;
  }
  
  return code;
}
```

---

### Milestone 8: Testing
**Confidence:** [X/10]  
**Status:** 🔵 Not Started  

#### Test Plan
- Pin valid JSON data
- Try to pin invalid JSON
- Visual indicator appears
- Generated code uses pinned data
- Unpin data works
- Pinned data persists

---

### Milestone 9: Human Review
**Status:** 🔵 Not Started  

#### Review Checklist
- [ ] JSON editor usable
- [ ] Visual indicators clear
- [ ] Generated Python uses pinned data
- [ ] Ready for Task 2.14

---

## Final Summary

### Deliverables
- [ ] NodeContextMenu component
- [ ] PinDataModal with Monaco editor
- [ ] Visual indicators on pinned nodes
- [ ] Store actions for pinning
- [ ] Code generation integration
- [ ] Test coverage >85%

### Next Steps
- [ ] Task 2.14: Node-by-Node Execution (optional)
- [ ] Task 2.15: Copy Execution to Canvas (optional)
- [ ] Task 2.16: Data Passthrough Architecture

---

**Task Status:** 🔵 Not Started  
**Last Updated:** 2025-12-21
