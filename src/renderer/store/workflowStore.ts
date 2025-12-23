/**
 * @file workflowStore.ts
 * @description Zustand store for managing Catalyst workflow manifests and editor state
 * 
 * @architecture Phase 0, Task 0.4 - Workflow Store
 * @created 2025-12-18
 * @author AI (Cline) + Human Review
 * @confidence 9/10 - Follows established Zustand patterns, React Flow sync needs testing
 * 
 * @see src/core/workflow/types.ts - Type definitions for workflows
 * @see docs/Catalyst documentation/CATALYST_PHASE_0_TASKS.md - Task 0.4 specification
 * @see src/renderer/store/manifestStore.ts - Similar pattern for Rise components
 * 
 * PROBLEM SOLVED:
 * - Need centralized state management for Catalyst workflow editor
 * - Visual workflow canvas (React Flow) needs to sync with manifest data
 * - Multiple workflows per project, need active workflow tracking
 * - Node/edge CRUD operations must maintain referential integrity
 * - Auto-save to prevent data loss
 * 
 * SOLUTION:
 * - Zustand store with immer for immutable updates
 * - Separation between visual state (canvas) and data (manifest)
 * - Debounced saves (500ms) to prevent excessive file writes
 * - Bidirectional sync: manifest ↔ React Flow
 * - Getter methods for computed values
 * 
 * OPERATIONS:
 * - Manifest: load, save, reset
 * - Workflows: create, update, delete, set active
 * - Nodes: add, update, delete, select
 * - Edges: add, update, delete
 * - React Flow: sync node positions and edge connections
 * 
 * DESIGN DECISIONS:
 * - Separate from manifestStore.ts (legacy Rise components vs new Catalyst workflows)
 * - Store manages CatalystManifest, not legacy Manifest type
 * - IPC integration for file operations (to be wired up in Phase 0.5)
 * - No validation in store - delegate to validation.ts
 * - Getters return null/empty arrays instead of throwing errors
 * 
 * @performance Debounced saves, immer structural sharing
 * @security-critical false - operates on local manifest file
 * @performance-critical true - called frequently during canvas interactions
 */

import { create } from 'zustand';
import { devtools, subscribeWithSelector } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import type { Node, Edge } from 'reactflow';
import type {
  CatalystManifest,
  WorkflowDefinition,
  NodeDefinition,
  EdgeDefinition,
  TriggerType,
  NodePosition,
} from '../../core/workflow/types';
import {
  createEmptyManifest,
  createWorkflow,
  generateNodeId,
  generateEdgeId,
} from '../../core/workflow/types';

/**
 * electronAPI helper to access the window.electronAPI with proper typing
 * The preload script exposes this API via contextBridge
 */
const electronAPI = (window as any).electronAPI;

/**
 * Debounce delay for auto-save operations (milliseconds)
 * Prevents excessive file writes during rapid editing
 */
const SAVE_DEBOUNCE_MS = 500;

/**
 * Timeout reference for debounced save operation
 * Cleared and reset on each mutation
 */
let saveTimeout: NodeJS.Timeout | null = null;

/**
 * Workflow store state interface
 * 
 * Manages the complete state for the workflow editor, including:
 * - The manifest data structure
 * - Editor UI state (selection, active workflow)
 * - Dirty tracking for unsaved changes
 */
export interface WorkflowState {
  // ============================================================
  // STATE
  // ============================================================
  
  /**
   * Current Catalyst manifest
   * null if no project loaded or manifest doesn't exist
   */
  manifest: CatalystManifest | null;
  
  /**
   * Dirty flag - true if there are unsaved changes
   * Set to true on any mutation, false after successful save
   */
  isDirty: boolean;
  
  /**
   * Currently active workflow being edited
   * null if no workflow selected
   */
  activeWorkflowId: string | null;
  
  /**
   * Currently selected node in the active workflow
   * Used to drive the properties panel
   */
  selectedNodeId: string | null;
  
  // ============================================================
  // ACTIONS - MANIFEST
  // ============================================================
  
  /**
   * Load manifest into store
   * Resets all editor state (selection, active workflow, dirty flag)
   * 
   * @param manifest - Complete Catalyst manifest
   */
  loadManifest: (manifest: CatalystManifest) => void;
  
  /**
   * Save manifest to file (debounced)
   * 
   * Saves are debounced by 500ms to prevent excessive file writes.
   * If called multiple times rapidly, only the last call executes.
   * 
   * NOTE: IPC integration pending in Phase 0.5
   * 
   * @returns Promise that resolves when save completes
   */
  saveManifest: () => Promise<void>;
  
  /**
   * Reset store to initial state
   * Clears manifest and all editor state
   */
  resetManifest: () => void;
  
  // ============================================================
  // ACTIONS - WORKFLOWS
  // ============================================================
  
  /**
   * Create new workflow and add to manifest
   * Automatically sets the new workflow as active
   * 
   * @param name - Human-readable workflow name
   * @param triggerType - Trigger type (default: httpEndpoint)
   * @returns New workflow ID
   */
  createWorkflow: (name: string, triggerType?: TriggerType) => string;
  
  /**
   * Update existing workflow properties
   * Partial update - only specified fields are changed
   * 
   * @param id - Workflow ID to update
   * @param updates - Partial workflow updates
   */
  updateWorkflow: (id: string, updates: Partial<WorkflowDefinition>) => void;
  
  /**
   * Delete workflow from manifest
   * If deleted workflow is active, clears active workflow
   * 
   * @param id - Workflow ID to delete
   */
  deleteWorkflow: (id: string) => void;
  
  /**
   * Set active workflow for editing
   * Clears node selection when switching workflows
   * 
   * @param id - Workflow ID to activate (null to clear)
   */
  setActiveWorkflow: (id: string | null) => void;
  
  // ============================================================
  // ACTIONS - NODES
  // ============================================================
  
  /**
   * Add node to workflow
   * Node ID is already generated in the passed NodeDefinition
   * 
   * @param workflowId - Workflow to add node to
   * @param node - Complete node definition
   */
  addNode: (workflowId: string, node: NodeDefinition) => void;
  
  /**
   * Update existing node properties
   * Partial update - only specified fields are changed
   * 
   * @param workflowId - Workflow containing the node
   * @param nodeId - Node ID to update
   * @param updates - Partial node updates
   */
  updateNode: (
    workflowId: string,
    nodeId: string,
    updates: Partial<NodeDefinition>
  ) => void;
  
  /**
   * Delete node from workflow
   * Also removes all edges connected to this node
   * Clears selection if deleted node is selected
   * 
   * @param workflowId - Workflow containing the node
   * @param nodeId - Node ID to delete
   */
  deleteNode: (workflowId: string, nodeId: string) => void;
  
  /**
   * Select node for editing
   * Drives the properties panel display
   * 
   * @param nodeId - Node ID to select (null to deselect)
   */
  selectNode: (nodeId: string | null) => void;
  
  /**
   * Update a specific config field in a node
   * Supports nested field paths (e.g., 'options.temperature')
   * 
   * This is a specialized update method for property panel forms.
   * It handles nested config paths and special fields like 'name'.
   * 
   * @param workflowId - Workflow containing the node
   * @param nodeId - Node ID to update
   * @param fieldPath - Field path (dot notation for nested, e.g., 'options.temperature')
   * @param value - New value for the field
   * 
   * @example
   * ```typescript
   * // Update simple field
   * updateNodeConfig(workflowId, nodeId, 'apiKey', 'sk-...');
   * 
   * // Update nested field
   * updateNodeConfig(workflowId, nodeId, 'options.temperature', 0.7);
   * 
   * // Update node name (special case)
   * updateNodeConfig(workflowId, nodeId, 'name', 'My Custom Name');
   * ```
   */
  updateNodeConfig: (
    workflowId: string,
    nodeId: string,
    fieldPath: string,
    value: any
  ) => void;
  
  /**
   * Pin data on a node for testing
   * 
   * Stores JSON data that will be used instead of executing the node.
   * Pinned data is only used in TEST mode, not in production.
   * 
   * @param workflowId - Workflow containing the node
   * @param nodeId - Node ID to pin data on
   * @param data - JSON data to pin
   * 
   * @example
   * ```typescript
   * pinNodeData(workflowId, nodeId, {
   *   content: "Sample AI response",
   *   model: "claude-3-5-sonnet-20241022"
   * });
   * ```
   * 
   * @see .implementation/Catalyst_tasks/phase-2.5-developer-experience/task-2.13-node-pinning.md
   */
  pinNodeData: (workflowId: string, nodeId: string, data: any) => void;
  
  /**
   * Unpin data from a node
   * 
   * Removes pinned data so the node will execute normally.
   * 
   * @param workflowId - Workflow containing the node
   * @param nodeId - Node ID to unpin data from
   * 
   * @example
   * ```typescript
   * unpinNodeData(workflowId, nodeId);
   * ```
   */
  unpinNodeData: (workflowId: string, nodeId: string) => void;
  
  // ============================================================
  // ACTIONS - EDGES
  // ============================================================
  
  /**
   * Add edge connecting two nodes
   * Edge ID is already generated in the passed EdgeDefinition
   * 
   * @param workflowId - Workflow to add edge to
   * @param edge - Complete edge definition
   */
  addEdge: (workflowId: string, edge: EdgeDefinition) => void;
  
  /**
   * Update existing edge properties
   * Primarily used for updating conditions
   * 
   * @param workflowId - Workflow containing the edge
   * @param edgeId - Edge ID to update
   * @param updates - Partial edge updates
   */
  updateEdge: (
    workflowId: string,
    edgeId: string,
    updates: Partial<EdgeDefinition>
  ) => void;
  
  /**
   * Delete edge from workflow
   * 
   * @param workflowId - Workflow containing the edge
   * @param edgeId - Edge ID to delete
   */
  deleteEdge: (workflowId: string, edgeId: string) => void;
  
  // ============================================================
  // REACT FLOW SYNC
  // ============================================================
  
  /**
   * Sync node positions from React Flow canvas
   * 
   * Called when user drags nodes on canvas.
   * Updates node positions in manifest to match React Flow state.
   * 
   * @param workflowId - Workflow being edited
   * @param nodes - React Flow node array
   */
  syncNodesFromReactFlow: (workflowId: string, nodes: Node[]) => void;
  
  /**
   * Sync edges from React Flow canvas
   * 
   * Called when user connects/disconnects nodes.
   * Updates edges in manifest to match React Flow state.
   * 
   * @param workflowId - Workflow being edited
   * @param edges - React Flow edge array
   */
  syncEdgesFromReactFlow: (workflowId: string, edges: Edge[]) => void;
  
  // ============================================================
  // GETTERS (COMPUTED VALUES)
  // ============================================================
  
  /**
   * Get currently active workflow
   * 
   * @returns Active workflow or null if none selected
   */
  getActiveWorkflow: () => WorkflowDefinition | null;
  
  /**
   * Get all nodes in a workflow as array
   * 
   * @param workflowId - Workflow ID
   * @returns Array of nodes (empty if workflow not found)
   */
  getWorkflowNodes: (workflowId: string) => NodeDefinition[];
  
  /**
   * Get all edges in a workflow
   * 
   * @param workflowId - Workflow ID
   * @returns Array of edges (empty if workflow not found)
   */
  getWorkflowEdges: (workflowId: string) => EdgeDefinition[];
  
  /**
   * Convert workflow nodes to React Flow format
   * 
   * Transforms manifest NodeDefinition[] to React Flow Node[].
   * Required for rendering nodes on the canvas.
   * 
   * @param workflowId - Workflow ID
   * @returns React Flow nodes (empty if workflow not found)
   */
  getReactFlowNodes: (workflowId: string) => Node[];
  
  /**
   * Convert workflow edges to React Flow format
   * 
   * Transforms manifest EdgeDefinition[] to React Flow Edge[].
   * Required for rendering connections on the canvas.
   * 
   * @param workflowId - Workflow ID
   * @returns React Flow edges (empty if workflow not found)
   */
  getReactFlowEdges: (workflowId: string) => Edge[];
}

/**
 * Workflow store implementation
 * 
 * Uses Zustand with middleware stack:
 * - immer: Safe immutable updates with mutable-style code
 * - subscribeWithSelector: Fine-grained reactivity
 * - devtools: Redux DevTools integration for debugging
 * 
 * TIMING:
 * - All mutations mark manifest as dirty
 * - Saves are debounced 500ms to prevent excessive writes
 * - React Flow sync happens immediately (position updates)
 * 
 * ERROR HANDLING:
 * - Getters return null/empty arrays instead of throwing
 * - Mutations fail silently if workflow/node not found
 * - Save errors are logged but don't throw
 */
export const useWorkflowStore = create<WorkflowState>()(
  devtools(
    subscribeWithSelector(
      immer((set, get) => ({
        // ============================================================
        // INITIAL STATE
        // ============================================================
        
        manifest: null,
        isDirty: false,
        activeWorkflowId: null,
        selectedNodeId: null,
        
        // ============================================================
        // MANIFEST OPERATIONS
        // ============================================================
        
        loadManifest: (manifest: CatalystManifest) => {
          set((state) => {
            // Load manifest data
            state.manifest = manifest;
            
            // Reset editor state
            state.isDirty = false;
            state.activeWorkflowId = null;
            state.selectedNodeId = null;
          });
        },
        
        saveManifest: async () => {
          const state = get();
          
          // Cannot save if no manifest loaded
          if (!state.manifest) {
            console.warn('[WorkflowStore] Cannot save: No manifest loaded');
            return;
          }
          
          // Debounce the save operation
          // Clear existing timeout if user makes rapid changes
          if (saveTimeout) {
            clearTimeout(saveTimeout);
          }
          
          return new Promise<void>((resolve, reject) => {
            saveTimeout = setTimeout(async () => {
              try {
                // Get current project path from projectStore
                const { useProjectStore } = await import('./projectStore');
                const currentProject = useProjectStore.getState().currentProject;
                
                if (!currentProject || !currentProject.path) {
                  console.warn('[WorkflowStore] Cannot save: No project loaded');
                  reject(new Error('No project loaded'));
                  return;
                }
                
                // Save manifest via IPC using new Catalyst manifest API
                const result = await electronAPI.catalyst.manifest.save(
                  currentProject.path,
                  state.manifest
                );
                
                if (result.success) {
                  console.log('[WorkflowStore] Manifest saved successfully to', result.path);
                  
                  // Mark as clean (no unsaved changes)
                  set((state) => {
                    state.isDirty = false;
                  });
                  
                  resolve();
                } else {
                  // Save failed
                  const errorMsg = result.error || 'Unknown error during save';
                  console.error('[WorkflowStore] Failed to save manifest:', errorMsg);
                  reject(new Error(errorMsg));
                }
              } catch (error) {
                const message = error instanceof Error ? error.message : 'Unknown error';
                console.error('[WorkflowStore] Error saving manifest:', message);
                reject(error);
              }
            }, SAVE_DEBOUNCE_MS);
          });
        },
        
        resetManifest: () => {
          set((state) => {
            // Clear all state
            state.manifest = null;
            state.isDirty = false;
            state.activeWorkflowId = null;
            state.selectedNodeId = null;
          });
        },
        
        // ============================================================
        // WORKFLOW OPERATIONS
        // ============================================================
        
        createWorkflow: (name: string, triggerType: TriggerType = 'httpEndpoint') => {
          const state = get();
          
          // Auto-create manifest if none exists
          if (!state.manifest) {
            set({ manifest: createEmptyManifest() });
          }
          
          // Use factory function to create workflow with defaults
          const workflow = createWorkflow(name, name, triggerType);
          const id = workflow.id;
          
          set((state) => {
            // Add workflow to manifest
            state.manifest!.workflows[id] = workflow;
            
            // Set as active workflow
            state.activeWorkflowId = id;
            
            // Update manifest timestamp
            state.manifest!.metadata.updatedAt = new Date().toISOString();
            
            // Mark as dirty
            state.isDirty = true;
          });
          
          // Trigger auto-save
          get().saveManifest().catch(console.error);
          
          return id;
        },
        
        updateWorkflow: (id: string, updates: Partial<WorkflowDefinition>) => {
          const state = get();
          
          // Cannot update if no manifest or workflow doesn't exist
          if (!state.manifest || !state.manifest.workflows[id]) {
            console.warn(`[WorkflowStore] Cannot update: Workflow not found: ${id}`);
            return;
          }
          
          set((state) => {
            const workflow = state.manifest!.workflows[id];
            
            // Apply updates (partial merge)
            if (updates.name !== undefined) workflow.name = updates.name;
            if (updates.description !== undefined) workflow.description = updates.description;
            if (updates.trigger !== undefined) workflow.trigger = updates.trigger;
            if (updates.input !== undefined) workflow.input = updates.input;
            if (updates.output !== undefined) workflow.output = updates.output;
            if (updates.executionConfig !== undefined) workflow.executionConfig = updates.executionConfig;
            
            // Update manifest timestamp
            state.manifest!.metadata.updatedAt = new Date().toISOString();
            
            // Mark as dirty
            state.isDirty = true;
          });
          
          // Trigger auto-save
          get().saveManifest().catch(console.error);
        },
        
        deleteWorkflow: (id: string) => {
          const state = get();
          
          // Cannot delete if no manifest or workflow doesn't exist
          if (!state.manifest || !state.manifest.workflows[id]) {
            console.warn(`[WorkflowStore] Cannot delete: Workflow not found: ${id}`);
            return;
          }
          
          set((state) => {
            // Remove workflow from manifest
            delete state.manifest!.workflows[id];
            
            // Clear active workflow if it was deleted
            if (state.activeWorkflowId === id) {
              state.activeWorkflowId = null;
              state.selectedNodeId = null;
            }
            
            // Update manifest timestamp
            state.manifest!.metadata.updatedAt = new Date().toISOString();
            
            // Mark as dirty
            state.isDirty = true;
          });
          
          // Trigger auto-save
          get().saveManifest().catch(console.error);
        },
        
        setActiveWorkflow: (id: string | null) => {
          set((state) => {
            // Set active workflow
            state.activeWorkflowId = id;
            
            // Clear node selection when switching workflows
            state.selectedNodeId = null;
          });
        },
        
        // ============================================================
        // NODE OPERATIONS
        // ============================================================
        
        addNode: (workflowId: string, node: NodeDefinition) => {
          const state = get();
          
          // Cannot add if no manifest or workflow doesn't exist
          if (!state.manifest || !state.manifest.workflows[workflowId]) {
            console.warn(`[WorkflowStore] Cannot add node: Workflow not found: ${workflowId}`);
            return;
          }
          
          set((state) => {
            const workflow = state.manifest!.workflows[workflowId];
            
            // Add node to workflow's node map
            workflow.nodes[node.id] = node;
            
            // Update manifest timestamp
            state.manifest!.metadata.updatedAt = new Date().toISOString();
            
            // Mark as dirty
            state.isDirty = true;
          });
          
          // Trigger auto-save
          get().saveManifest().catch(console.error);
        },
        
        updateNode: (
          workflowId: string,
          nodeId: string,
          updates: Partial<NodeDefinition>
        ) => {
          const state = get();
          
          // Cannot update if workflow or node doesn't exist
          if (
            !state.manifest ||
            !state.manifest.workflows[workflowId] ||
            !state.manifest.workflows[workflowId].nodes[nodeId]
          ) {
            console.warn(
              `[WorkflowStore] Cannot update node: Workflow or node not found: ${workflowId}/${nodeId}`
            );
            return;
          }
          
          set((state) => {
            const node = state.manifest!.workflows[workflowId].nodes[nodeId];
            
            // Apply updates (partial merge)
            if (updates.name !== undefined) node.name = updates.name;
            if (updates.description !== undefined) node.description = updates.description;
            if (updates.position !== undefined) node.position = updates.position;
            if (updates.config !== undefined) node.config = updates.config;
            if (updates.timeout !== undefined) node.timeout = updates.timeout;
            if (updates.retries !== undefined) node.retries = updates.retries;
            if (updates.cache !== undefined) node.cache = updates.cache;
            if (updates.onError !== undefined) node.onError = updates.onError;
            if (updates.fallbackValue !== undefined) node.fallbackValue = updates.fallbackValue;
            
            // Update manifest timestamp
            state.manifest!.metadata.updatedAt = new Date().toISOString();
            
            // Mark as dirty
            state.isDirty = true;
          });
          
          // Trigger auto-save
          get().saveManifest().catch(console.error);
        },
        
        deleteNode: (workflowId: string, nodeId: string) => {
          const state = get();
          
          // Cannot delete if workflow or node doesn't exist
          if (
            !state.manifest ||
            !state.manifest.workflows[workflowId] ||
            !state.manifest.workflows[workflowId].nodes[nodeId]
          ) {
            console.warn(
              `[WorkflowStore] Cannot delete node: Workflow or node not found: ${workflowId}/${nodeId}`
            );
            return;
          }
          
          set((state) => {
            const workflow = state.manifest!.workflows[workflowId];
            
            // Remove node from workflow
            delete workflow.nodes[nodeId];
            
            // Remove all edges connected to this node
            // This maintains referential integrity
            workflow.edges = workflow.edges.filter(
              (edge) => edge.source !== nodeId && edge.target !== nodeId
            );
            
            // Clear selection if deleted node was selected
            if (state.selectedNodeId === nodeId) {
              state.selectedNodeId = null;
            }
            
            // Update manifest timestamp
            state.manifest!.metadata.updatedAt = new Date().toISOString();
            
            // Mark as dirty
            state.isDirty = true;
          });
          
          // Trigger auto-save
          get().saveManifest().catch(console.error);
        },
        
        selectNode: (nodeId: string | null) => {
          set((state) => {
            // Update selection
            state.selectedNodeId = nodeId;
          });
        },
        
        updateNodeConfig: (
          workflowId: string,
          nodeId: string,
          fieldPath: string,
          value: any
        ) => {
          const state = get();
          
          // Cannot update if workflow or node doesn't exist
          if (
            !state.manifest ||
            !state.manifest.workflows[workflowId] ||
            !state.manifest.workflows[workflowId].nodes[nodeId]
          ) {
            console.warn(
              `[WorkflowStore] Cannot update config: Workflow or node not found: ${workflowId}/${nodeId}`
            );
            return;
          }
          
          set((state) => {
            const node = state.manifest!.workflows[workflowId].nodes[nodeId];
            
            // Special case: 'name' is a top-level node property
            if (fieldPath === 'name') {
              node.name = value;
            } else {
              // Handle nested paths (e.g., 'options.temperature')
              const pathParts = fieldPath.split('.');
              
              // Ensure config object exists
              if (!node.config) {
                node.config = {};
              }
              
              // Navigate to the parent object
              let current: any = node.config;
              for (let i = 0; i < pathParts.length - 1; i++) {
                const part = pathParts[i];
                
                // Create nested object if it doesn't exist
                if (!current[part] || typeof current[part] !== 'object') {
                  current[part] = {};
                }
                
                current = current[part];
              }
              
              // Set the leaf value
              const leafKey = pathParts[pathParts.length - 1];
              current[leafKey] = value;
            }
            
            // Update manifest timestamp
            state.manifest!.metadata.updatedAt = new Date().toISOString();
            
            // Mark as dirty
            state.isDirty = true;
          });
          
          // Trigger auto-save
          get().saveManifest().catch(console.error);
        },
        
        pinNodeData: (workflowId: string, nodeId: string, data: any) => {
          const state = get();
          
          // Cannot pin if workflow or node doesn't exist
          if (
            !state.manifest ||
            !state.manifest.workflows[workflowId] ||
            !state.manifest.workflows[workflowId].nodes[nodeId]
          ) {
            console.warn(
              `[WorkflowStore] Cannot pin data: Workflow or node not found: ${workflowId}/${nodeId}`
            );
            return;
          }
          
          set((state) => {
            const node = state.manifest!.workflows[workflowId].nodes[nodeId];
            
            // Set pinned data with current timestamp
            node.pinnedData = {
              enabled: true,
              data,
              timestamp: new Date().toISOString(),
            };
            
            // Update manifest timestamp
            state.manifest!.metadata.updatedAt = new Date().toISOString();
            
            // Mark as dirty
            state.isDirty = true;
          });
          
          // Trigger auto-save
          get().saveManifest().catch(console.error);
        },
        
        unpinNodeData: (workflowId: string, nodeId: string) => {
          const state = get();
          
          // Cannot unpin if workflow or node doesn't exist
          if (
            !state.manifest ||
            !state.manifest.workflows[workflowId] ||
            !state.manifest.workflows[workflowId].nodes[nodeId]
          ) {
            console.warn(
              `[WorkflowStore] Cannot unpin data: Workflow or node not found: ${workflowId}/${nodeId}`
            );
            return;
          }
          
          set((state) => {
            const node = state.manifest!.workflows[workflowId].nodes[nodeId];
            
            // Remove pinned data
            node.pinnedData = undefined;
            
            // Update manifest timestamp
            state.manifest!.metadata.updatedAt = new Date().toISOString();
            
            // Mark as dirty
            state.isDirty = true;
          });
          
          // Trigger auto-save
          get().saveManifest().catch(console.error);
        },
        
        // ============================================================
        // EDGE OPERATIONS
        // ============================================================
        
        addEdge: (workflowId: string, edge: EdgeDefinition) => {
          const state = get();
          
          // Cannot add if no manifest or workflow doesn't exist
          if (!state.manifest || !state.manifest.workflows[workflowId]) {
            console.warn(`[WorkflowStore] Cannot add edge: Workflow not found: ${workflowId}`);
            return;
          }
          
          set((state) => {
            const workflow = state.manifest!.workflows[workflowId];
            
            // Add edge to workflow's edge array
            workflow.edges.push(edge);
            
            // Update manifest timestamp
            state.manifest!.metadata.updatedAt = new Date().toISOString();
            
            // Mark as dirty
            state.isDirty = true;
          });
          
          // Trigger auto-save
          get().saveManifest().catch(console.error);
        },
        
        updateEdge: (
          workflowId: string,
          edgeId: string,
          updates: Partial<EdgeDefinition>
        ) => {
          const state = get();
          
          // Cannot update if workflow doesn't exist
          if (!state.manifest || !state.manifest.workflows[workflowId]) {
            console.warn(
              `[WorkflowStore] Cannot update edge: Workflow not found: ${workflowId}`
            );
            return;
          }
          
          set((state) => {
            const workflow = state.manifest!.workflows[workflowId];
            
            // Find edge by ID
            const edge = workflow.edges.find((e) => e.id === edgeId);
            if (!edge) {
              console.warn(`[WorkflowStore] Cannot update edge: Edge not found: ${edgeId}`);
              return;
            }
            
            // Apply updates (partial merge)
            if (updates.source !== undefined) edge.source = updates.source;
            if (updates.target !== undefined) edge.target = updates.target;
            if (updates.sourceHandle !== undefined) edge.sourceHandle = updates.sourceHandle;
            if (updates.targetHandle !== undefined) edge.targetHandle = updates.targetHandle;
            if (updates.condition !== undefined) edge.condition = updates.condition;
            
            // Update manifest timestamp
            state.manifest!.metadata.updatedAt = new Date().toISOString();
            
            // Mark as dirty
            state.isDirty = true;
          });
          
          // Trigger auto-save
          get().saveManifest().catch(console.error);
        },
        
        deleteEdge: (workflowId: string, edgeId: string) => {
          const state = get();
          
          // Cannot delete if workflow doesn't exist
          if (!state.manifest || !state.manifest.workflows[workflowId]) {
            console.warn(
              `[WorkflowStore] Cannot delete edge: Workflow not found: ${workflowId}`
            );
            return;
          }
          
          set((state) => {
            const workflow = state.manifest!.workflows[workflowId];
            
            // Remove edge from array
            workflow.edges = workflow.edges.filter((e) => e.id !== edgeId);
            
            // Update manifest timestamp
            state.manifest!.metadata.updatedAt = new Date().toISOString();
            
            // Mark as dirty
            state.isDirty = true;
          });
          
          // Trigger auto-save
          get().saveManifest().catch(console.error);
        },
        
        // ============================================================
        // REACT FLOW SYNCHRONIZATION
        // ============================================================
        
        syncNodesFromReactFlow: (workflowId: string, nodes: Node[]) => {
          const state = get();
          
          // Cannot sync if workflow doesn't exist
          if (!state.manifest || !state.manifest.workflows[workflowId]) {
            console.warn(
              `[WorkflowStore] Cannot sync nodes: Workflow not found: ${workflowId}`
            );
            return;
          }
          
          set((state) => {
            const workflow = state.manifest!.workflows[workflowId];
            
            // Update positions for all nodes
            // React Flow nodes have { id, position: {x, y} }
            for (const rfNode of nodes) {
              const node = workflow.nodes[rfNode.id];
              if (node) {
                // Update position to match React Flow
                node.position = rfNode.position;
              }
            }
            
            // Update manifest timestamp
            state.manifest!.metadata.updatedAt = new Date().toISOString();
            
            // Mark as dirty
            state.isDirty = true;
          });
          
          // Trigger auto-save
          get().saveManifest().catch(console.error);
        },
        
        syncEdgesFromReactFlow: (workflowId: string, edges: Edge[]) => {
          const state = get();
          
          // Cannot sync if workflow doesn't exist
          if (!state.manifest || !state.manifest.workflows[workflowId]) {
            console.warn(
              `[WorkflowStore] Cannot sync edges: Workflow not found: ${workflowId}`
            );
            return;
          }
          
          set((state) => {
            const workflow = state.manifest!.workflows[workflowId];
            
            // Convert React Flow edges to EdgeDefinition format
            // React Flow edges have: { id, source, target, sourceHandle?, targetHandle? }
            // Note: React Flow can have null for handles, convert to undefined
            workflow.edges = edges.map((rfEdge) => ({
              id: rfEdge.id,
              source: rfEdge.source,
              target: rfEdge.target,
              sourceHandle: rfEdge.sourceHandle ?? undefined,
              targetHandle: rfEdge.targetHandle ?? undefined,
              // Preserve condition if edge already exists
              condition: workflow.edges.find((e) => e.id === rfEdge.id)?.condition,
            }));
            
            // Update manifest timestamp
            state.manifest!.metadata.updatedAt = new Date().toISOString();
            
            // Mark as dirty
            state.isDirty = true;
          });
          
          // Trigger auto-save
          get().saveManifest().catch(console.error);
        },
        
        // ============================================================
        // GETTERS (COMPUTED VALUES)
        // ============================================================
        
        getActiveWorkflow: () => {
          const state = get();
          
          // Return null if no manifest or no active workflow
          if (!state.manifest || !state.activeWorkflowId) {
            return null;
          }
          
          // Return workflow or null if ID is invalid
          return state.manifest.workflows[state.activeWorkflowId] || null;
        },
        
        getWorkflowNodes: (workflowId: string) => {
          const state = get();
          
          // Return empty array if workflow doesn't exist
          if (!state.manifest || !state.manifest.workflows[workflowId]) {
            return [];
          }
          
          // Convert node map to array
          const workflow = state.manifest.workflows[workflowId];
          return Object.values(workflow.nodes);
        },
        
        getWorkflowEdges: (workflowId: string) => {
          const state = get();
          
          // Return empty array if workflow doesn't exist
          if (!state.manifest || !state.manifest.workflows[workflowId]) {
            return [];
          }
          
          // Return edges array
          const workflow = state.manifest.workflows[workflowId];
          return workflow.edges;
        },
        
        getReactFlowNodes: (workflowId: string) => {
          const state = get();
          
          // Return empty array if workflow doesn't exist
          if (!state.manifest || !state.manifest.workflows[workflowId]) {
            return [];
          }
          
          const workflow = state.manifest.workflows[workflowId];
          
          // Convert NodeDefinition to React Flow Node format
          // React Flow expects: { id, type, position, data }
          return Object.values(workflow.nodes).map((node) => ({
            id: node.id,
            type: 'workflowNode', // Custom node component type
            position: node.position,
            data: node, // Store full node definition in data
          }));
        },
        
        getReactFlowEdges: (workflowId: string) => {
          const state = get();
          
          // Return empty array if workflow doesn't exist
          if (!state.manifest || !state.manifest.workflows[workflowId]) {
            return [];
          }
          
          const workflow = state.manifest.workflows[workflowId];
          
          // Convert EdgeDefinition to React Flow Edge format
          // React Flow expects: { id, source, target, sourceHandle?, targetHandle? }
          return workflow.edges.map((edge) => ({
            id: edge.id,
            source: edge.source,
            target: edge.target,
            sourceHandle: edge.sourceHandle,
            targetHandle: edge.targetHandle,
            // Note: condition is stored in our EdgeDefinition but not used by React Flow
            // It's preserved in the manifest and can be displayed in edge labels
          }));
        },
      }))
    ),
    { name: 'workflow-store' } // DevTools name
  )
);
