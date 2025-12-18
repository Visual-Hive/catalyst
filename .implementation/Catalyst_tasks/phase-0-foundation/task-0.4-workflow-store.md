# Task 0.4: Workflow Store

**Phase:** Phase 0 - Foundation  
**Duration Estimate:** 0.5 day  
**Actual Duration:** [To be filled when complete]  
**Status:** 🔵 Not Started  
**Assigned:** AI + Human Review  
**Started:** [YYYY-MM-DD]  
**Completed:** [YYYY-MM-DD]  

---

## Task Overview

### Objective
Create Zustand store for managing workflow state in the editor.

The workflow store is the central state management system for the Catalyst editor. It manages the manifest data, tracks which workflow is currently being edited, handles selection state, and provides methods for CRUD operations on workflows, nodes, and edges. The store also synchronizes with React Flow for canvas updates.

### Success Criteria
- [ ] Store initializes with empty manifest
- [ ] CRUD operations work for workflows
- [ ] CRUD operations work for nodes
- [ ] CRUD operations work for edges
- [ ] isDirty flag tracks changes correctly
- [ ] React Flow sync updates positions
- [ ] Selection state managed properly
- [ ] Test coverage >90%
- [ ] Human review completed

### References
- CATALYST_PHASE_0_TASKS.md - Task 0.4
- Task 0.2 - For manifest types
- Task 0.3 - For node types

### Dependencies
- Task 0.2: Manifest Schema Design (completed)
- Task 0.3: Node Type System (completed)

---

## Milestones

### Milestone 1: Design Store Architecture
**Date:** [YYYY-MM-DD]  
**Confidence:** [X/10]  
**Status:** 🔵 Not Started  
**Time Spent:** [X hours]  

#### Activities
- [ ] Design state shape
- [ ] Define action signatures
- [ ] Plan middleware usage
- [ ] Design selector patterns

#### Design Decisions

| Decision | Options Considered | Choice Made | Rationale | Confidence |
|----------|-------------------|-------------|-----------|------------|
| State management | Redux, Zustand, Jotai, MobX | Zustand | Simple API, good devtools, already in project | 9/10 |
| Middleware | None, devtools, persist, subscribeWithSelector | devtools + subscribeWithSelector | Debugging + fine-grained subscriptions | 9/10 |
| Manifest storage | In store, Separate file, IndexedDB | In store | Simpler, sufficient for MVP | 8/10 |
| Undo/Redo | Immediate, Deferred | Deferred to Phase 2 | Not critical for MVP | 8/10 |

#### State Shape Design
```typescript
interface WorkflowState {
  // === Core Data ===
  manifest: CatalystManifest;        // The complete project manifest
  isDirty: boolean;                   // Has unsaved changes
  
  // === Editor State ===
  activeWorkflowId: string | null;    // Currently editing workflow
  selectedNodeId: string | null;      // Selected node for properties panel
  selectedEdgeId: string | null;      // Selected edge (for deletion)
  
  // === UI State ===
  isLoading: boolean;                 // Loading indicator
  error: string | null;               // Error message
  
  // === Actions ===
  // Manifest actions
  loadManifest: (manifest: CatalystManifest) => void;
  saveManifest: () => Promise<void>;
  resetManifest: () => void;
  
  // Workflow actions
  createWorkflow: (name: string) => string;
  updateWorkflow: (id: string, updates: Partial<WorkflowDefinition>) => void;
  deleteWorkflow: (id: string) => void;
  setActiveWorkflow: (id: string | null) => void;
  
  // Node actions
  addNode: (workflowId: string, node: NodeDefinition) => void;
  updateNode: (workflowId: string, nodeId: string, updates: Partial<NodeDefinition>) => void;
  deleteNode: (workflowId: string, nodeId: string) => void;
  selectNode: (nodeId: string | null) => void;
  
  // Edge actions
  addEdge: (workflowId: string, edge: EdgeDefinition) => void;
  deleteEdge: (workflowId: string, edgeId: string) => void;
  selectEdge: (edgeId: string | null) => void;
  
  // React Flow sync
  syncNodesFromReactFlow: (workflowId: string, nodes: Node[]) => void;
  syncEdgesFromReactFlow: (workflowId: string, edges: Edge[]) => void;
  
  // Getters (computed)
  getActiveWorkflow: () => WorkflowDefinition | null;
  getWorkflowNodes: (workflowId: string) => NodeDefinition[];
  getWorkflowEdges: (workflowId: string) => EdgeDefinition[];
}
```

---

### Milestone 2: Implement Core Store
**Date:** [YYYY-MM-DD]  
**Confidence:** [X/10]  
**Status:** 🔵 Not Started  
**Time Spent:** [X hours]  

#### File: `src/renderer/store/workflowStore.ts`

```typescript
/**
 * @file workflowStore.ts
 * @description Zustand store for workflow editor state management
 * 
 * @architecture Phase 0, Task 0.4 - Workflow Store
 * @created 2025-12-XX
 * @author AI (Cline) + Human Review
 * @confidence 9/10
 * 
 * @see CATALYST_SPECIFICATION.md - State Management
 */

import { create } from 'zustand';
import { devtools, subscribeWithSelector } from 'zustand/middleware';
import type { Node, Edge } from 'reactflow';
import type {
  CatalystManifest,
  WorkflowDefinition,
  NodeDefinition,
  EdgeDefinition,
  TriggerType,
} from '../../core/workflow/types';
import {
  createEmptyManifest,
  createWorkflow,
  generateWorkflowId,
  generateNodeId,
  generateEdgeId,
} from '../../core/workflow/factories';

// ============================================================
// STATE INTERFACE
// ============================================================

export interface WorkflowState {
  // Core data
  manifest: CatalystManifest;
  isDirty: boolean;
  
  // Editor state
  activeWorkflowId: string | null;
  selectedNodeId: string | null;
  selectedEdgeId: string | null;
  
  // UI state
  isLoading: boolean;
  error: string | null;
  
  // Manifest actions
  loadManifest: (manifest: CatalystManifest) => void;
  saveManifest: () => Promise<void>;
  resetManifest: () => void;
  updateMetadata: (updates: Partial<CatalystManifest['metadata']>) => void;
  
  // Workflow actions
  createWorkflow: (name: string, triggerType?: TriggerType) => string;
  updateWorkflow: (id: string, updates: Partial<WorkflowDefinition>) => void;
  deleteWorkflow: (id: string) => void;
  setActiveWorkflow: (id: string | null) => void;
  duplicateWorkflow: (id: string) => string;
  
  // Node actions
  addNode: (workflowId: string, node: NodeDefinition) => void;
  updateNode: (workflowId: string, nodeId: string, updates: Partial<NodeDefinition>) => void;
  updateNodeConfig: (workflowId: string, nodeId: string, config: Record<string, any>) => void;
  deleteNode: (workflowId: string, nodeId: string) => void;
  selectNode: (nodeId: string | null) => void;
  
  // Edge actions
  addEdge: (workflowId: string, edge: EdgeDefinition) => void;
  deleteEdge: (workflowId: string, edgeId: string) => void;
  selectEdge: (edgeId: string | null) => void;
  
  // React Flow sync
  syncNodesFromReactFlow: (workflowId: string, nodes: Node[]) => void;
  syncEdgesFromReactFlow: (workflowId: string, edges: Edge[]) => void;
  
  // Getters
  getActiveWorkflow: () => WorkflowDefinition | null;
  getWorkflowNodes: (workflowId: string) => NodeDefinition[];
  getWorkflowEdges: (workflowId: string) => EdgeDefinition[];
  getSelectedNode: () => NodeDefinition | null;
  
  // Error handling
  setError: (error: string | null) => void;
  clearError: () => void;
}

// ============================================================
// STORE IMPLEMENTATION
// ============================================================

export const useWorkflowStore = create<WorkflowState>()(
  devtools(
    subscribeWithSelector((set, get) => ({
      // ========================================
      // Initial State
      // ========================================
      manifest: createEmptyManifest(),
      isDirty: false,
      activeWorkflowId: null,
      selectedNodeId: null,
      selectedEdgeId: null,
      isLoading: false,
      error: null,

      // ========================================
      // Manifest Actions
      // ========================================
      
      /**
       * Load a manifest into the store
       * Resets all editor state
       */
      loadManifest: (manifest) => {
        set({
          manifest,
          isDirty: false,
          activeWorkflowId: null,
          selectedNodeId: null,
          selectedEdgeId: null,
          error: null,
        });
      },

      /**
       * Save manifest (calls IPC to main process)
       */
      saveManifest: async () => {
        const state = get();
        try {
          // Update timestamp
          const updatedManifest = {
            ...state.manifest,
            metadata: {
              ...state.manifest.metadata,
              updatedAt: new Date().toISOString(),
            },
          };
          
          // Call IPC to save (implemented in Phase 1)
          // await window.electron.manifest.save(updatedManifest);
          
          set({
            manifest: updatedManifest,
            isDirty: false,
          });
        } catch (error) {
          set({ error: `Failed to save: ${error}` });
          throw error;
        }
      },

      /**
       * Reset to empty manifest
       */
      resetManifest: () => {
        set({
          manifest: createEmptyManifest(),
          isDirty: false,
          activeWorkflowId: null,
          selectedNodeId: null,
          selectedEdgeId: null,
          error: null,
        });
      },

      /**
       * Update project metadata
       */
      updateMetadata: (updates) => {
        set((state) => ({
          manifest: {
            ...state.manifest,
            metadata: {
              ...state.manifest.metadata,
              ...updates,
            },
          },
          isDirty: true,
        }));
      },

      // ========================================
      // Workflow Actions
      // ========================================

      /**
       * Create a new workflow
       * Returns the new workflow ID
       */
      createWorkflow: (name, triggerType = 'httpEndpoint') => {
        const id = generateWorkflowId(name);
        const workflow = createWorkflow(id, name, triggerType);

        set((state) => ({
          manifest: {
            ...state.manifest,
            workflows: {
              ...state.manifest.workflows,
              [id]: workflow,
            },
          },
          activeWorkflowId: id,
          isDirty: true,
        }));

        return id;
      },

      /**
       * Update an existing workflow
       */
      updateWorkflow: (id, updates) => {
        set((state) => {
          const workflow = state.manifest.workflows[id];
          if (!workflow) return state;

          return {
            manifest: {
              ...state.manifest,
              workflows: {
                ...state.manifest.workflows,
                [id]: { ...workflow, ...updates },
              },
            },
            isDirty: true,
          };
        });
      },

      /**
       * Delete a workflow
       */
      deleteWorkflow: (id) => {
        set((state) => {
          const { [id]: removed, ...remainingWorkflows } = state.manifest.workflows;
          
          // Clear active if deleted
          const newActiveId = state.activeWorkflowId === id 
            ? null 
            : state.activeWorkflowId;

          return {
            manifest: {
              ...state.manifest,
              workflows: remainingWorkflows,
            },
            activeWorkflowId: newActiveId,
            selectedNodeId: null,
            selectedEdgeId: null,
            isDirty: true,
          };
        });
      },

      /**
       * Set the active workflow for editing
       */
      setActiveWorkflow: (id) => {
        set({
          activeWorkflowId: id,
          selectedNodeId: null,
          selectedEdgeId: null,
        });
      },

      /**
       * Duplicate an existing workflow
       */
      duplicateWorkflow: (id) => {
        const state = get();
        const source = state.manifest.workflows[id];
        if (!source) return id;

        const newId = generateWorkflowId(`${source.name} Copy`);
        const duplicate: WorkflowDefinition = {
          ...JSON.parse(JSON.stringify(source)), // Deep clone
          id: newId,
          name: `${source.name} Copy`,
        };

        set((state) => ({
          manifest: {
            ...state.manifest,
            workflows: {
              ...state.manifest.workflows,
              [newId]: duplicate,
            },
          },
          isDirty: true,
        }));

        return newId;
      },

      // ========================================
      // Node Actions
      // ========================================

      /**
       * Add a node to a workflow
       */
      addNode: (workflowId, node) => {
        set((state) => {
          const workflow = state.manifest.workflows[workflowId];
          if (!workflow) return state;

          return {
            manifest: {
              ...state.manifest,
              workflows: {
                ...state.manifest.workflows,
                [workflowId]: {
                  ...workflow,
                  nodes: {
                    ...workflow.nodes,
                    [node.id]: node,
                  },
                },
              },
            },
            isDirty: true,
          };
        });
      },

      /**
       * Update a node's properties
       */
      updateNode: (workflowId, nodeId, updates) => {
        set((state) => {
          const workflow = state.manifest.workflows[workflowId];
          if (!workflow || !workflow.nodes[nodeId]) return state;

          return {
            manifest: {
              ...state.manifest,
              workflows: {
                ...state.manifest.workflows,
                [workflowId]: {
                  ...workflow,
                  nodes: {
                    ...workflow.nodes,
                    [nodeId]: {
                      ...workflow.nodes[nodeId],
                      ...updates,
                    },
                  },
                },
              },
            },
            isDirty: true,
          };
        });
      },

      /**
       * Update a node's config (convenience method)
       */
      updateNodeConfig: (workflowId, nodeId, config) => {
        set((state) => {
          const workflow = state.manifest.workflows[workflowId];
          if (!workflow || !workflow.nodes[nodeId]) return state;

          return {
            manifest: {
              ...state.manifest,
              workflows: {
                ...state.manifest.workflows,
                [workflowId]: {
                  ...workflow,
                  nodes: {
                    ...workflow.nodes,
                    [nodeId]: {
                      ...workflow.nodes[nodeId],
                      config: {
                        ...workflow.nodes[nodeId].config,
                        ...config,
                      },
                    },
                  },
                },
              },
            },
            isDirty: true,
          };
        });
      },

      /**
       * Delete a node and its connected edges
       */
      deleteNode: (workflowId, nodeId) => {
        set((state) => {
          const workflow = state.manifest.workflows[workflowId];
          if (!workflow) return state;

          // Remove node
          const { [nodeId]: removed, ...remainingNodes } = workflow.nodes;
          
          // Remove connected edges
          const remainingEdges = workflow.edges.filter(
            (edge) => edge.source !== nodeId && edge.target !== nodeId
          );

          // Clear selection if deleted node was selected
          const newSelectedNodeId = state.selectedNodeId === nodeId 
            ? null 
            : state.selectedNodeId;

          return {
            manifest: {
              ...state.manifest,
              workflows: {
                ...state.manifest.workflows,
                [workflowId]: {
                  ...workflow,
                  nodes: remainingNodes,
                  edges: remainingEdges,
                },
              },
            },
            selectedNodeId: newSelectedNodeId,
            isDirty: true,
          };
        });
      },

      /**
       * Select a node for property editing
       */
      selectNode: (nodeId) => {
        set({
          selectedNodeId: nodeId,
          selectedEdgeId: null, // Clear edge selection
        });
      },

      // ========================================
      // Edge Actions
      // ========================================

      /**
       * Add an edge between nodes
       */
      addEdge: (workflowId, edge) => {
        set((state) => {
          const workflow = state.manifest.workflows[workflowId];
          if (!workflow) return state;

          // Check for duplicate edge
          const exists = workflow.edges.some(
            (e) =>
              e.source === edge.source &&
              e.target === edge.target &&
              e.sourceHandle === edge.sourceHandle &&
              e.targetHandle === edge.targetHandle
          );
          if (exists) return state;

          return {
            manifest: {
              ...state.manifest,
              workflows: {
                ...state.manifest.workflows,
                [workflowId]: {
                  ...workflow,
                  edges: [...workflow.edges, edge],
                },
              },
            },
            isDirty: true,
          };
        });
      },

      /**
       * Delete an edge
       */
      deleteEdge: (workflowId, edgeId) => {
        set((state) => {
          const workflow = state.manifest.workflows[workflowId];
          if (!workflow) return state;

          const newSelectedEdgeId = state.selectedEdgeId === edgeId 
            ? null 
            : state.selectedEdgeId;

          return {
            manifest: {
              ...state.manifest,
              workflows: {
                ...state.manifest.workflows,
                [workflowId]: {
                  ...workflow,
                  edges: workflow.edges.filter((e) => e.id !== edgeId),
                },
              },
            },
            selectedEdgeId: newSelectedEdgeId,
            isDirty: true,
          };
        });
      },

      /**
       * Select an edge
       */
      selectEdge: (edgeId) => {
        set({
          selectedEdgeId: edgeId,
          selectedNodeId: null, // Clear node selection
        });
      },

      // ========================================
      // React Flow Sync
      // ========================================

      /**
       * Sync node positions from React Flow
       * Called after drag operations
       */
      syncNodesFromReactFlow: (workflowId, nodes) => {
        set((state) => {
          const workflow = state.manifest.workflows[workflowId];
          if (!workflow) return state;

          const updatedNodes = { ...workflow.nodes };
          
          nodes.forEach((rfNode) => {
            if (updatedNodes[rfNode.id]) {
              updatedNodes[rfNode.id] = {
                ...updatedNodes[rfNode.id],
                position: {
                  x: rfNode.position.x,
                  y: rfNode.position.y,
                },
              };
            }
          });

          return {
            manifest: {
              ...state.manifest,
              workflows: {
                ...state.manifest.workflows,
                [workflowId]: {
                  ...workflow,
                  nodes: updatedNodes,
                },
              },
            },
            isDirty: true,
          };
        });
      },

      /**
       * Sync edges from React Flow
       * Called after edge creation/deletion
       */
      syncEdgesFromReactFlow: (workflowId, edges) => {
        set((state) => {
          const workflow = state.manifest.workflows[workflowId];
          if (!workflow) return state;

          const manifestEdges: EdgeDefinition[] = edges.map((rfEdge) => ({
            id: rfEdge.id,
            source: rfEdge.source,
            target: rfEdge.target,
            sourceHandle: rfEdge.sourceHandle || undefined,
            targetHandle: rfEdge.targetHandle || undefined,
          }));

          return {
            manifest: {
              ...state.manifest,
              workflows: {
                ...state.manifest.workflows,
                [workflowId]: {
                  ...workflow,
                  edges: manifestEdges,
                },
              },
            },
            isDirty: true,
          };
        });
      },

      // ========================================
      // Getters
      // ========================================

      /**
       * Get the currently active workflow
       */
      getActiveWorkflow: () => {
        const state = get();
        if (!state.activeWorkflowId) return null;
        return state.manifest.workflows[state.activeWorkflowId] || null;
      },

      /**
       * Get all nodes for a workflow
       */
      getWorkflowNodes: (workflowId) => {
        const state = get();
        const workflow = state.manifest.workflows[workflowId];
        return workflow ? Object.values(workflow.nodes) : [];
      },

      /**
       * Get all edges for a workflow
       */
      getWorkflowEdges: (workflowId) => {
        const state = get();
        const workflow = state.manifest.workflows[workflowId];
        return workflow ? workflow.edges : [];
      },

      /**
       * Get the currently selected node
       */
      getSelectedNode: () => {
        const state = get();
        if (!state.activeWorkflowId || !state.selectedNodeId) return null;
        const workflow = state.manifest.workflows[state.activeWorkflowId];
        return workflow?.nodes[state.selectedNodeId] || null;
      },

      // ========================================
      // Error Handling
      // ========================================

      setError: (error) => set({ error }),
      clearError: () => set({ error: null }),
    })),
    { name: 'workflow-store' }
  )
);

// ============================================================
// SELECTORS
// ============================================================

/**
 * Select workflow list for sidebar
 */
export const selectWorkflowList = (state: WorkflowState) => 
  Object.values(state.manifest.workflows);

/**
 * Select project name
 */
export const selectProjectName = (state: WorkflowState) => 
  state.manifest.metadata.projectName;

/**
 * Select if there are unsaved changes
 */
export const selectIsDirty = (state: WorkflowState) => state.isDirty;

/**
 * Select active workflow
 */
export const selectActiveWorkflow = (state: WorkflowState) => {
  if (!state.activeWorkflowId) return null;
  return state.manifest.workflows[state.activeWorkflowId] || null;
};
```

#### Files Created
- `src/renderer/store/workflowStore.ts` - Main Zustand store

---

### Milestone 3: Create Store Hooks
**Date:** [YYYY-MM-DD]  
**Confidence:** [X/10]  
**Status:** 🔵 Not Started  
**Time Spent:** [X hours]  

#### File: `src/renderer/store/hooks.ts`

```typescript
/**
 * @file hooks.ts
 * @description Custom hooks for workflow store
 */

import { useCallback, useMemo } from 'react';
import { useWorkflowStore, selectActiveWorkflow, selectWorkflowList } from './workflowStore';
import type { NodeType } from '../../core/workflow/types';
import { createNode } from '../../core/workflow/factories';

/**
 * Hook for working with the active workflow
 */
export function useActiveWorkflow() {
  const activeWorkflow = useWorkflowStore(selectActiveWorkflow);
  const activeWorkflowId = useWorkflowStore((s) => s.activeWorkflowId);
  const setActiveWorkflow = useWorkflowStore((s) => s.setActiveWorkflow);
  
  return {
    workflow: activeWorkflow,
    workflowId: activeWorkflowId,
    setActiveWorkflow,
    hasActiveWorkflow: !!activeWorkflow,
  };
}

/**
 * Hook for workflow list operations
 */
export function useWorkflowList() {
  const workflows = useWorkflowStore(selectWorkflowList);
  const createWorkflow = useWorkflowStore((s) => s.createWorkflow);
  const deleteWorkflow = useWorkflowStore((s) => s.deleteWorkflow);
  const duplicateWorkflow = useWorkflowStore((s) => s.duplicateWorkflow);
  
  return {
    workflows,
    createWorkflow,
    deleteWorkflow,
    duplicateWorkflow,
    workflowCount: workflows.length,
  };
}

/**
 * Hook for node operations
 */
export function useNodeOperations(workflowId: string | null) {
  const addNode = useWorkflowStore((s) => s.addNode);
  const updateNode = useWorkflowStore((s) => s.updateNode);
  const updateNodeConfig = useWorkflowStore((s) => s.updateNodeConfig);
  const deleteNode = useWorkflowStore((s) => s.deleteNode);
  const selectNode = useWorkflowStore((s) => s.selectNode);
  
  const addNewNode = useCallback(
    (type: NodeType, name: string, position: { x: number; y: number }) => {
      if (!workflowId) return null;
      const node = createNode(type, name, position);
      addNode(workflowId, node);
      return node.id;
    },
    [workflowId, addNode]
  );

  const updateNodePosition = useCallback(
    (nodeId: string, position: { x: number; y: number }) => {
      if (!workflowId) return;
      updateNode(workflowId, nodeId, { position });
    },
    [workflowId, updateNode]
  );

  return {
    addNode: addNewNode,
    updateNode: (nodeId: string, updates: any) => 
      workflowId && updateNode(workflowId, nodeId, updates),
    updateNodeConfig: (nodeId: string, config: any) => 
      workflowId && updateNodeConfig(workflowId, nodeId, config),
    deleteNode: (nodeId: string) => 
      workflowId && deleteNode(workflowId, nodeId),
    selectNode,
    updateNodePosition,
  };
}

/**
 * Hook for edge operations
 */
export function useEdgeOperations(workflowId: string | null) {
  const addEdge = useWorkflowStore((s) => s.addEdge);
  const deleteEdge = useWorkflowStore((s) => s.deleteEdge);
  const selectEdge = useWorkflowStore((s) => s.selectEdge);
  
  return {
    addEdge: (edge: any) => workflowId && addEdge(workflowId, edge),
    deleteEdge: (edgeId: string) => workflowId && deleteEdge(workflowId, edgeId),
    selectEdge,
  };
}

/**
 * Hook for selected node
 */
export function useSelectedNode() {
  const selectedNode = useWorkflowStore((s) => s.getSelectedNode());
  const selectedNodeId = useWorkflowStore((s) => s.selectedNodeId);
  const selectNode = useWorkflowStore((s) => s.selectNode);
  
  return {
    node: selectedNode,
    nodeId: selectedNodeId,
    selectNode,
    clearSelection: () => selectNode(null),
    hasSelection: !!selectedNode,
  };
}

/**
 * Hook for project metadata
 */
export function useProjectMetadata() {
  const metadata = useWorkflowStore((s) => s.manifest.metadata);
  const updateMetadata = useWorkflowStore((s) => s.updateMetadata);
  
  return {
    metadata,
    updateMetadata,
    projectName: metadata.projectName,
  };
}

/**
 * Hook for dirty state
 */
export function useDirtyState() {
  const isDirty = useWorkflowStore((s) => s.isDirty);
  const saveManifest = useWorkflowStore((s) => s.saveManifest);
  
  return {
    isDirty,
    save: saveManifest,
  };
}
```

---

### Milestone 4: Write Unit Tests
**Date:** [YYYY-MM-DD]  
**Confidence:** [X/10]  
**Status:** 🔵 Not Started  
**Time Spent:** [X hours]  

#### File: `tests/unit/store/workflowStore.test.ts`

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useWorkflowStore } from '../../../src/renderer/store/workflowStore';
import { createNode } from '../../../src/core/workflow/factories';

describe('workflowStore', () => {
  beforeEach(() => {
    // Reset store before each test
    const { result } = renderHook(() => useWorkflowStore());
    act(() => {
      result.current.resetManifest();
    });
  });

  describe('Initial State', () => {
    it('should initialize with empty manifest', () => {
      const { result } = renderHook(() => useWorkflowStore());
      
      expect(result.current.manifest.schemaVersion).toBe('1.0.0');
      expect(result.current.manifest.projectType).toBe('workflow');
      expect(Object.keys(result.current.manifest.workflows)).toHaveLength(0);
      expect(result.current.isDirty).toBe(false);
      expect(result.current.activeWorkflowId).toBeNull();
    });
  });

  describe('Manifest Actions', () => {
    it('should load manifest', () => {
      const { result } = renderHook(() => useWorkflowStore());
      const newManifest = {
        ...result.current.manifest,
        metadata: {
          ...result.current.manifest.metadata,
          projectName: 'Test Project',
        },
      };

      act(() => {
        result.current.loadManifest(newManifest);
      });

      expect(result.current.manifest.metadata.projectName).toBe('Test Project');
      expect(result.current.isDirty).toBe(false);
    });

    it('should reset manifest', () => {
      const { result } = renderHook(() => useWorkflowStore());
      
      act(() => {
        result.current.createWorkflow('Test');
      });
      
      expect(Object.keys(result.current.manifest.workflows)).toHaveLength(1);

      act(() => {
        result.current.resetManifest();
      });

      expect(Object.keys(result.current.manifest.workflows)).toHaveLength(0);
      expect(result.current.isDirty).toBe(false);
    });
  });

  describe('Workflow Actions', () => {
    it('should create workflow', () => {
      const { result } = renderHook(() => useWorkflowStore());
      
      let workflowId: string;
      act(() => {
        workflowId = result.current.createWorkflow('Test Workflow');
      });

      expect(result.current.manifest.workflows[workflowId!]).toBeDefined();
      expect(result.current.manifest.workflows[workflowId!].name).toBe('Test Workflow');
      expect(result.current.activeWorkflowId).toBe(workflowId!);
      expect(result.current.isDirty).toBe(true);
    });

    it('should update workflow', () => {
      const { result } = renderHook(() => useWorkflowStore());
      
      let workflowId: string;
      act(() => {
        workflowId = result.current.createWorkflow('Test');
      });

      act(() => {
        result.current.updateWorkflow(workflowId!, { description: 'Updated' });
      });

      expect(result.current.manifest.workflows[workflowId!].description).toBe('Updated');
    });

    it('should delete workflow', () => {
      const { result } = renderHook(() => useWorkflowStore());
      
      let workflowId: string;
      act(() => {
        workflowId = result.current.createWorkflow('Test');
      });

      act(() => {
        result.current.deleteWorkflow(workflowId!);
      });

      expect(result.current.manifest.workflows[workflowId!]).toBeUndefined();
      expect(result.current.activeWorkflowId).toBeNull();
    });

    it('should duplicate workflow', () => {
      const { result } = renderHook(() => useWorkflowStore());
      
      let originalId: string;
      act(() => {
        originalId = result.current.createWorkflow('Original');
      });

      let duplicateId: string;
      act(() => {
        duplicateId = result.current.duplicateWorkflow(originalId!);
      });

      expect(result.current.manifest.workflows[duplicateId!]).toBeDefined();
      expect(result.current.manifest.workflows[duplicateId!].name).toBe('Original Copy');
    });
  });

  describe('Node Actions', () => {
    it('should add node', () => {
      const { result } = renderHook(() => useWorkflowStore());
      
      let workflowId: string;
      act(() => {
        workflowId = result.current.createWorkflow('Test');
      });

      const node = createNode('anthropicCompletion', 'Claude');
      act(() => {
        result.current.addNode(workflowId!, node);
      });

      const workflow = result.current.manifest.workflows[workflowId!];
      expect(workflow.nodes[node.id]).toBeDefined();
    });

    it('should update node', () => {
      const { result } = renderHook(() => useWorkflowStore());
      
      let workflowId: string;
      act(() => {
        workflowId = result.current.createWorkflow('Test');
      });

      const node = createNode('anthropicCompletion', 'Claude');
      act(() => {
        result.current.addNode(workflowId!, node);
      });

      act(() => {
        result.current.updateNode(workflowId!, node.id, { name: 'Updated' });
      });

      const workflow = result.current.manifest.workflows[workflowId!];
      expect(workflow.nodes[node.id].name).toBe('Updated');
    });

    it('should delete node and connected edges', () => {
      const { result } = renderHook(() => useWorkflowStore());
      
      let workflowId: string;
      act(() => {
        workflowId = result.current.createWorkflow('Test');
      });

      const node1 = createNode('httpEndpoint', 'Trigger');
      const node2 = createNode('anthropicCompletion', 'Claude');
      
      act(() => {
        result.current.addNode(workflowId!, node1);
        result.current.addNode(workflowId!, node2);
        result.current.addEdge(workflowId!, {
          id: 'edge1',
          source: node1.id,
          target: node2.id,
        });
      });

      act(() => {
        result.current.deleteNode(workflowId!, node1.id);
      });

      const workflow = result.current.manifest.workflows[workflowId!];
      expect(workflow.nodes[node1.id]).toBeUndefined();
      expect(workflow.edges).toHaveLength(0);
    });

    it('should select node', () => {
      const { result } = renderHook(() => useWorkflowStore());
      
      act(() => {
        result.current.selectNode('node-123');
      });

      expect(result.current.selectedNodeId).toBe('node-123');
    });
  });

  describe('Edge Actions', () => {
    it('should add edge', () => {
      const { result } = renderHook(() => useWorkflowStore());
      
      let workflowId: string;
      act(() => {
        workflowId = result.current.createWorkflow('Test');
      });

      act(() => {
        result.current.addEdge(workflowId!, {
          id: 'edge1',
          source: 'node1',
          target: 'node2',
        });
      });

      const workflow = result.current.manifest.workflows[workflowId!];
      expect(workflow.edges).toHaveLength(1);
    });

    it('should not add duplicate edge', () => {
      const { result } = renderHook(() => useWorkflowStore());
      
      let workflowId: string;
      act(() => {
        workflowId = result.current.createWorkflow('Test');
      });

      const edge = {
        id: 'edge1',
        source: 'node1',
        target: 'node2',
      };

      act(() => {
        result.current.addEdge(workflowId!, edge);
        result.current.addEdge(workflowId!, { ...edge, id: 'edge2' });
      });

      const workflow = result.current.manifest.workflows[workflowId!];
      expect(workflow.edges).toHaveLength(1);
    });

    it('should delete edge', () => {
      const { result } = renderHook(() => useWorkflowStore());
      
      let workflowId: string;
      act(() => {
        workflowId = result.current.createWorkflow('Test');
      });

      act(() => {
        result.current.addEdge(workflowId!, {
          id: 'edge1',
          source: 'node1',
          target: 'node2',
        });
      });

      act(() => {
        result.current.deleteEdge(workflowId!, 'edge1');
      });

      const workflow = result.current.manifest.workflows[workflowId!];
      expect(workflow.edges).toHaveLength(0);
    });
  });

  describe('Getters', () => {
    it('should get active workflow', () => {
      const { result } = renderHook(() => useWorkflowStore());
      
      expect(result.current.getActiveWorkflow()).toBeNull();

      let workflowId: string;
      act(() => {
        workflowId = result.current.createWorkflow('Test');
      });

      const activeWorkflow = result.current.getActiveWorkflow();
      expect(activeWorkflow?.id).toBe(workflowId!);
    });

    it('should get workflow nodes', () => {
      const { result } = renderHook(() => useWorkflowStore());
      
      let workflowId: string;
      act(() => {
        workflowId = result.current.createWorkflow('Test');
      });

      const node = createNode('anthropicCompletion', 'Claude');
      act(() => {
        result.current.addNode(workflowId!, node);
      });

      const nodes = result.current.getWorkflowNodes(workflowId!);
      expect(nodes).toHaveLength(1);
      expect(nodes[0].id).toBe(node.id);
    });

    it('should get selected node', () => {
      const { result } = renderHook(() => useWorkflowStore());
      
      let workflowId: string;
      act(() => {
        workflowId = result.current.createWorkflow('Test');
      });

      const node = createNode('anthropicCompletion', 'Claude');
      act(() => {
        result.current.addNode(workflowId!, node);
        result.current.selectNode(node.id);
      });

      const selectedNode = result.current.getSelectedNode();
      expect(selectedNode?.id).toBe(node.id);
    });
  });

  describe('React Flow Sync', () => {
    it('should sync node positions', () => {
      const { result } = renderHook(() => useWorkflowStore());
      
      let workflowId: string;
      act(() => {
        workflowId = result.current.createWorkflow('Test');
      });

      const node = createNode('anthropicCompletion', 'Claude', { x: 0, y: 0 });
      act(() => {
        result.current.addNode(workflowId!, node);
      });

      act(() => {
        result.current.syncNodesFromReactFlow(workflowId!, [
          { id: node.id, position: { x: 100, y: 200 }, data: {} } as any,
        ]);
      });

      const workflow = result.current.manifest.workflows[workflowId!];
      expect(workflow.nodes[node.id].position).toEqual({ x: 100, y: 200 });
    });
  });
});
```

---

### Milestone 5: Create Index Export
**Date:** [YYYY-MM-DD]  
**Confidence:** [X/10]  
**Status:** 🔵 Not Started  
**Time Spent:** [X hours]  

#### File: `src/renderer/store/index.ts`

```typescript
/**
 * @file index.ts
 * @description Main exports for store
 */

export {
  useWorkflowStore,
  selectWorkflowList,
  selectProjectName,
  selectIsDirty,
  selectActiveWorkflow,
} from './workflowStore';

export type { WorkflowState } from './workflowStore';

export {
  useActiveWorkflow,
  useWorkflowList,
  useNodeOperations,
  useEdgeOperations,
  useSelectedNode,
  useProjectMetadata,
  useDirtyState,
} from './hooks';
```

---

### Milestone 6: Human Review
**Date:** [YYYY-MM-DD]  
**Confidence:** [X/10]  
**Status:** 🔵 Not Started  
**Time Spent:** [X hours]  

#### Human Review

**Reviewer:** [Name]  
**Date:** [YYYY-MM-DD]  
**Duration:** [X minutes]  

**Review Focus:**
- State shape design
- Action implementations
- Edge cases handled
- Performance considerations

**Feedback Received:**

**Positive:**
- ✅ [To be filled]

**Concerns:**
- ⚠️ [To be filled]

**Sign-off:**
- [ ] Store implementation approved
- [ ] Hooks approved
- [ ] Tests sufficient
- [ ] Ready for Task 0.5

**Final Confidence:** [X/10]

---

## Final Summary

### Deliverables
- [ ] `src/renderer/store/workflowStore.ts` - Main store
- [ ] `src/renderer/store/hooks.ts` - Custom hooks
- [ ] `src/renderer/store/index.ts` - Exports
- [ ] `tests/unit/store/workflowStore.test.ts` - Tests
- [ ] Test coverage >90%
- [ ] Human review completed

### What Was Accomplished
[To be filled upon completion]

### Lessons Learned
[To be filled upon completion]

### Technical Debt Created
- Undo/Redo deferred to Phase 2
- Persistence deferred to Phase 1 (IPC)

### Next Steps
- [ ] Proceed to Task 0.5: Canvas Adaptation
- [ ] Connect store to React Flow
- [ ] Build node components

---

## Appendix

### Key Files
- `src/renderer/store/workflowStore.ts` - Main store
- `src/renderer/store/hooks.ts` - Custom hooks
- `tests/unit/store/workflowStore.test.ts` - Tests

### Useful Commands
```bash
# Run store tests
npm test -- tests/unit/store/

# Run with coverage
npm test -- --coverage tests/unit/store/
```

### Related Tasks
- Task 0.3: Node Type System (previous)
- Task 0.5: Canvas Adaptation (next)

---

**Task Status:** 🔵 Not Started  
**Ready for:** Implementation  
**Last Updated:** 2025-12-18
