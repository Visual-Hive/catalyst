/**
 * @file logicStore.ts
 * @description Zustand store for managing logic flows and page state in the editor
 * 
 * @architecture Phase 4, Task 4.1 - React Flow Integration
 * @created 2025-11-29
 * @author AI (Cline) + Human Review
 * @confidence 9/10 - Follows established Zustand patterns from manifestStore
 * 
 * @see src/core/logic/types.ts - Type definitions
 * @see src/renderer/store/manifestStore.ts - Similar pattern
 * @see .implementation/phase-4-logic-editor/task-4.1-react-flow-integration.md
 * 
 * PROBLEM SOLVED:
 * - Centralized management of logic flows in the editor
 * - CRUD operations for flows, nodes, and edges
 * - Page state variable management
 * - Syncs with React Flow canvas state
 * 
 * SOLUTION:
 * - Zustand store with devtools middleware for debugging
 * - Immutable state updates
 * - Bridge between our logic types and React Flow types
 * 
 * LEVEL 1.5 CONSTRAINTS:
 * - Only onClick events as triggers
 * - Only 3 action node types (setState, alert, console)
 * - Only page-level state variables
 * - Only static values (no expressions)
 * 
 * @performance O(1) for most operations, debounced external saves
 * @security-critical false - operates on local logic data
 * @performance-critical false - UI state only
 */

import { create } from 'zustand';
import { devtools, subscribeWithSelector } from 'zustand/middleware';
import type { Node, Edge } from 'reactflow';
import {
  Flow,
  FlowNode,
  FlowEdge,
  PageState,
  StateVariable,
  StateVariableType,
  EventType,
  NodeType,
  generateFlowId,
  generateNodeId,
  generateEdgeId,
  createEventNode,
  createDefaultStateVariable,
} from '../../core/logic/types';

// ============================================================
// TYPES
// ============================================================

/**
 * Logic store state and actions interface
 */
export interface LogicState {
  // --------------------------------------------------------
  // STATE
  // --------------------------------------------------------
  
  /** All flows in the current project, keyed by flow ID */
  flows: Record<string, Flow>;
  
  /** Currently selected/active flow ID being edited */
  activeFlowId: string | null;
  
  /** Page state variables (shared across all flows) */
  pageState: PageState;
  
  /** Loading state for async operations */
  isLoading: boolean;
  
  /** Error message from last operation */
  error: string | null;
  
  // --------------------------------------------------------
  // FLOW ACTIONS
  // --------------------------------------------------------
  
  /** 
   * Create a new flow for a component event
   * Auto-creates the trigger event node
   * @returns New flow ID
   */
  createFlow: (componentId: string, eventType?: EventType, name?: string) => string;
  
  /** 
   * Update an existing flow's properties
   * Merges updates with existing flow
   */
  updateFlow: (flowId: string, updates: Partial<Omit<Flow, 'id'>>) => void;
  
  /** 
   * Delete a flow and all its nodes/edges
   * Clears activeFlowId if deleted flow was active
   */
  deleteFlow: (flowId: string) => void;
  
  /** 
   * Set the active flow for editing
   * Pass null to clear selection
   */
  setActiveFlow: (flowId: string | null) => void;
  
  /** 
   * Get flows for a specific component
   * Returns array of flows triggered by that component
   */
  getFlowsForComponent: (componentId: string) => Flow[];
  
  // --------------------------------------------------------
  // NODE ACTIONS
  // --------------------------------------------------------
  
  /** 
   * Add a node to a flow
   * Validates node type against Level 1.5 constraints
   */
  addNode: (flowId: string, node: FlowNode) => void;
  
  /** 
   * Update a node's position or config
   * Merges updates with existing node
   */
  updateNode: (flowId: string, nodeId: string, updates: Partial<FlowNode>) => void;
  
  /** 
   * Delete a node from a flow
   * Also removes any connected edges
   */
  deleteNode: (flowId: string, nodeId: string) => void;
  
  /** 
   * Sync nodes from React Flow (batch update positions)
   * Used when React Flow's onNodesChange fires
   */
  syncNodesFromReactFlow: (flowId: string, nodes: Node[]) => void;
  
  // --------------------------------------------------------
  // EDGE ACTIONS
  // --------------------------------------------------------
  
  /** 
   * Add an edge connecting two nodes
   * Validates connection against Level 1.5 rules
   */
  addEdge: (flowId: string, source: string, target: string) => void;
  
  /** 
   * Delete an edge from a flow
   */
  deleteEdge: (flowId: string, edgeId: string) => void;
  
  /** 
   * Sync edges from React Flow (batch update)
   * Used when React Flow's onEdgesChange fires
   */
  syncEdgesFromReactFlow: (flowId: string, edges: Edge[]) => void;
  
  // --------------------------------------------------------
  // STATE VARIABLE ACTIONS
  // --------------------------------------------------------
  
  /** 
   * Add a new page state variable
   * Validates name is unique
   */
  addStateVariable: (name: string, type: StateVariableType, initialValue?: string | number | boolean) => void;
  
  /** 
   * Update a state variable's type or initial value
   */
  updateStateVariable: (name: string, updates: Partial<StateVariable>) => void;
  
  /** 
   * Delete a state variable
   * Note: Does not remove references in flows (user's responsibility)
   */
  deleteStateVariable: (name: string) => void;
  
  /** 
   * Get all state variable names (for dropdowns)
   */
  getStateVariableNames: () => string[];
  
  // --------------------------------------------------------
  // BULK OPERATIONS
  // --------------------------------------------------------
  
  /** 
   * Load flows and page state from manifest data
   * Called when project is loaded
   */
  loadFromManifest: (flows: Record<string, Flow>, pageState: PageState) => void;
  
  /** 
   * Reset store to initial state
   * Called when project is closed
   */
  reset: () => void;
  
  /** 
   * Set error message
   */
  setError: (error: string | null) => void;
}

// ============================================================
// INITIAL STATE
// ============================================================

/**
 * Default initial state for logic store
 * Empty flows and page state, no active flow
 */
const initialState = {
  flows: {} as Record<string, Flow>,
  activeFlowId: null as string | null,
  pageState: {} as PageState,
  isLoading: false,
  error: null as string | null,
};

// ============================================================
// HELPER FUNCTIONS
// ============================================================

/**
 * Convert our FlowNode to React Flow Node format
 * React Flow expects specific structure with data property
 * 
 * @param node - Our FlowNode type
 * @returns React Flow Node format
 */
export function flowNodeToReactFlowNode(node: FlowNode): Node {
  return {
    id: node.id,
    type: node.type,
    position: node.position,
    data: {
      ...node.config,
      nodeType: node.type,
    },
  };
}

/**
 * Convert React Flow Node back to our FlowNode format
 * Extracts config from data property
 * 
 * @param rfNode - React Flow Node
 * @param originalNode - Our original node (for config structure)
 * @returns Our FlowNode format
 */
export function reactFlowNodeToFlowNode(
  rfNode: Node,
  originalNode: FlowNode
): FlowNode {
  return {
    ...originalNode,
    position: rfNode.position,
    // Config stays the same unless explicitly changed
  };
}

/**
 * Convert our FlowEdge to React Flow Edge format
 * 
 * @param edge - Our FlowEdge type
 * @returns React Flow Edge format
 */
export function flowEdgeToReactFlowEdge(edge: FlowEdge): Edge {
  return {
    id: edge.id,
    source: edge.source,
    target: edge.target,
    sourceHandle: edge.sourceHandle,
    targetHandle: edge.targetHandle,
  };
}

/**
 * Convert React Flow Edge back to our FlowEdge format
 * 
 * @param rfEdge - React Flow Edge
 * @returns Our FlowEdge format
 */
export function reactFlowEdgeToFlowEdge(rfEdge: Edge): FlowEdge {
  return {
    id: rfEdge.id,
    source: rfEdge.source,
    target: rfEdge.target,
    sourceHandle: rfEdge.sourceHandle || undefined,
    targetHandle: rfEdge.targetHandle || undefined,
  };
}

/**
 * Validate if a node type is allowed in Level 1.5
 * @param nodeType - Node type to validate
 * @returns true if allowed
 */
function isValidLevel15NodeType(nodeType: string): nodeType is NodeType {
  return ['event', 'setState', 'alert', 'console'].includes(nodeType);
}

// ============================================================
// STORE IMPLEMENTATION
// ============================================================

/**
 * Logic store - Manages flows, nodes, edges, and page state
 * 
 * Uses Zustand with devtools for debugging.
 * All state updates are immutable.
 * 
 * TIMING:
 * - State updates are synchronous
 * - External saves (to manifest) should be debounced by caller
 * 
 * VALIDATION:
 * - Node types validated against Level 1.5 constraints
 * - Edge connections validated (no connecting to event nodes)
 * - State variable names validated for uniqueness
 */
export const useLogicStore = create<LogicState>()(
  devtools(
    subscribeWithSelector((set, get) => ({
      // Initial state
      ...initialState,
      
      // --------------------------------------------------------
      // FLOW ACTIONS
      // --------------------------------------------------------
      
      createFlow: (componentId, eventType = 'onClick', name) => {
        // Generate unique flow ID
        const flowId = generateFlowId(name || `${componentId}_${eventType}`);
        
        // Create trigger event node (auto-positioned at left)
        const eventNode = createEventNode(componentId, eventType, { x: 100, y: 200 });
        
        // Construct new flow
        const newFlow: Flow = {
          id: flowId,
          name: name || `${eventType} Handler`,
          trigger: {
            type: eventType,
            componentId,
          },
          nodes: [eventNode],
          edges: [],
        };
        
        set((state) => ({
          flows: { ...state.flows, [flowId]: newFlow },
          // Auto-select the new flow for editing
          activeFlowId: flowId,
        }));
        
        return flowId;
      },
      
      updateFlow: (flowId, updates) => {
        set((state) => {
          const flow = state.flows[flowId];
          if (!flow) {
            console.warn(`[LogicStore] Flow not found: ${flowId}`);
            return state;
          }
          
          return {
            flows: {
              ...state.flows,
              [flowId]: { ...flow, ...updates },
            },
          };
        });
      },
      
      deleteFlow: (flowId) => {
        set((state) => {
          // Remove flow from flows map
          const { [flowId]: _, ...remainingFlows } = state.flows;
          
          return {
            flows: remainingFlows,
            // Clear active flow if deleted
            activeFlowId: state.activeFlowId === flowId ? null : state.activeFlowId,
          };
        });
      },
      
      setActiveFlow: (flowId) => {
        set({ activeFlowId: flowId });
      },
      
      getFlowsForComponent: (componentId) => {
        const { flows } = get();
        return Object.values(flows).filter(
          (flow) => flow.trigger.componentId === componentId
        );
      },
      
      // --------------------------------------------------------
      // NODE ACTIONS
      // --------------------------------------------------------
      
      addNode: (flowId, node) => {
        // Validate node type
        if (!isValidLevel15NodeType(node.type)) {
          console.warn(`[LogicStore] Invalid node type for Level 1.5: ${node.type}`);
          return;
        }
        
        set((state) => {
          const flow = state.flows[flowId];
          if (!flow) {
            console.warn(`[LogicStore] Flow not found: ${flowId}`);
            return state;
          }
          
          return {
            flows: {
              ...state.flows,
              [flowId]: {
                ...flow,
                nodes: [...flow.nodes, node],
              },
            },
          };
        });
      },
      
      updateNode: (flowId, nodeId, updates) => {
        set((state) => {
          const flow = state.flows[flowId];
          if (!flow) {
            console.warn(`[LogicStore] Flow not found: ${flowId}`);
            return state;
          }
          
          // Update nodes with proper type assertion
          const updatedNodes: FlowNode[] = flow.nodes.map((n): FlowNode =>
            n.id === nodeId ? ({ ...n, ...updates } as FlowNode) : n
          );
          
          return {
            flows: {
              ...state.flows,
              [flowId]: {
                ...flow,
                nodes: updatedNodes,
              },
            },
          };
        });
      },
      
      deleteNode: (flowId, nodeId) => {
        set((state) => {
          const flow = state.flows[flowId];
          if (!flow) {
            console.warn(`[LogicStore] Flow not found: ${flowId}`);
            return state;
          }
          
          // Don't allow deleting event nodes (they define the flow trigger)
          const nodeToDelete = flow.nodes.find((n) => n.id === nodeId);
          if (nodeToDelete?.type === 'event') {
            console.warn(`[LogicStore] Cannot delete event node - delete flow instead`);
            return state;
          }
          
          return {
            flows: {
              ...state.flows,
              [flowId]: {
                ...flow,
                // Remove the node
                nodes: flow.nodes.filter((n) => n.id !== nodeId),
                // Remove any edges connected to this node
                edges: flow.edges.filter(
                  (e) => e.source !== nodeId && e.target !== nodeId
                ),
              },
            },
          };
        });
      },
      
      syncNodesFromReactFlow: (flowId, rfNodes) => {
        set((state) => {
          const flow = state.flows[flowId];
          if (!flow) {
            console.warn(`[LogicStore] Flow not found: ${flowId}`);
            return state;
          }
          
          // Update positions from React Flow nodes
          // Use type assertion to maintain FlowNode union type
          const updatedNodes: FlowNode[] = flow.nodes.map((node): FlowNode => {
            const rfNode = rfNodes.find((n) => n.id === node.id);
            if (rfNode) {
              // Return node with updated position, maintaining its type
              return {
                ...node,
                position: rfNode.position,
              } as FlowNode;
            }
            return node;
          });
          
          return {
            flows: {
              ...state.flows,
              [flowId]: {
                ...flow,
                nodes: updatedNodes,
              },
            },
          };
        });
      },
      
      // --------------------------------------------------------
      // EDGE ACTIONS
      // --------------------------------------------------------
      
      addEdge: (flowId, source, target) => {
        set((state) => {
          const flow = state.flows[flowId];
          if (!flow) {
            console.warn(`[LogicStore] Flow not found: ${flowId}`);
            return state;
          }
          
          // Validate: cannot connect TO an event node
          const targetNode = flow.nodes.find((n) => n.id === target);
          if (targetNode?.type === 'event') {
            console.warn(`[LogicStore] Cannot connect to event nodes`);
            return state;
          }
          
          // Check if edge already exists
          const exists = flow.edges.some(
            (e) => e.source === source && e.target === target
          );
          if (exists) {
            console.warn(`[LogicStore] Edge already exists`);
            return state;
          }
          
          // Create new edge
          const newEdge: FlowEdge = {
            id: generateEdgeId(),
            source,
            target,
          };
          
          return {
            flows: {
              ...state.flows,
              [flowId]: {
                ...flow,
                edges: [...flow.edges, newEdge],
              },
            },
          };
        });
      },
      
      deleteEdge: (flowId, edgeId) => {
        set((state) => {
          const flow = state.flows[flowId];
          if (!flow) {
            console.warn(`[LogicStore] Flow not found: ${flowId}`);
            return state;
          }
          
          return {
            flows: {
              ...state.flows,
              [flowId]: {
                ...flow,
                edges: flow.edges.filter((e) => e.id !== edgeId),
              },
            },
          };
        });
      },
      
      syncEdgesFromReactFlow: (flowId, rfEdges) => {
        set((state) => {
          const flow = state.flows[flowId];
          if (!flow) {
            console.warn(`[LogicStore] Flow not found: ${flowId}`);
            return state;
          }
          
          // Convert React Flow edges to our format
          const updatedEdges = rfEdges.map(reactFlowEdgeToFlowEdge);
          
          return {
            flows: {
              ...state.flows,
              [flowId]: {
                ...flow,
                edges: updatedEdges,
              },
            },
          };
        });
      },
      
      // --------------------------------------------------------
      // STATE VARIABLE ACTIONS
      // --------------------------------------------------------
      
      addStateVariable: (name, type, initialValue) => {
        set((state) => {
          // Validate name is unique
          if (state.pageState[name]) {
            console.warn(`[LogicStore] State variable already exists: ${name}`);
            return state;
          }
          
          // Create variable with default value if not provided
          const variable = initialValue !== undefined
            ? { type, initialValue }
            : createDefaultStateVariable(type);
          
          return {
            pageState: {
              ...state.pageState,
              [name]: variable,
            },
          };
        });
      },
      
      updateStateVariable: (name, updates) => {
        set((state) => {
          const existing = state.pageState[name];
          if (!existing) {
            console.warn(`[LogicStore] State variable not found: ${name}`);
            return state;
          }
          
          return {
            pageState: {
              ...state.pageState,
              [name]: { ...existing, ...updates },
            },
          };
        });
      },
      
      deleteStateVariable: (name) => {
        set((state) => {
          const { [name]: _, ...remaining } = state.pageState;
          return { pageState: remaining };
        });
      },
      
      getStateVariableNames: () => {
        return Object.keys(get().pageState);
      },
      
      // --------------------------------------------------------
      // BULK OPERATIONS
      // --------------------------------------------------------
      
      loadFromManifest: (flows, pageState) => {
        set({
          flows,
          pageState,
          activeFlowId: null,
          isLoading: false,
          error: null,
        });
      },
      
      reset: () => {
        set(initialState);
      },
      
      setError: (error) => {
        set({ error });
      },
    })),
    { name: 'logic-store' }
  )
);

export default useLogicStore;
