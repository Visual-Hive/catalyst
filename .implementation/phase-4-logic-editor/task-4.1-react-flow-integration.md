# Task 4.1: React Flow Canvas Integration

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
Integrate React Flow into the editor as the visual canvas for building logic flows. This provides the drag-and-drop, pan/zoom, and node connection infrastructure.

### Problem Statement
Users need a visual way to create and edit logic flows. React Flow is an established library for node-based editors that handles:
- Canvas pan/zoom
- Node positioning and dragging
- Edge connections between nodes
- Selection and deletion

We need to integrate it into Rise's editor UI and create the foundation for custom node rendering.

### Why This Matters
The React Flow canvas is the primary interface for the logic editor. Getting this right means:
1. Intuitive node manipulation
2. Smooth user experience
3. Foundation for all node types
4. Proper integration with existing editor layout

### Success Criteria
- [ ] React Flow installed and configured
- [ ] LogicCanvas component renders in Logic tab
- [ ] Basic pan/zoom working
- [ ] Can add placeholder nodes to canvas
- [ ] Can connect nodes with edges
- [ ] Can select and delete nodes
- [ ] NodePalette component shows available node types
- [ ] Drag from palette to canvas works
- [ ] Canvas state persists to logicStore (Zustand)
- [ ] Unit tests for store logic
- [ ] Human review completed

### References
- **PHASE-4-OVERVIEW.md** - Phase context
- **Task 4.0** - Types for nodes and edges
- **React Flow Docs:** https://reactflow.dev/docs
- **Existing UI:** `src/renderer/components/Editor/`

### Dependencies
- ✅ **Task 4.0** - Logic types must be defined
- ⚠️ **BLOCKS:** Task 4.2 (Node implementation)

---

## 🗺️ Implementation Roadmap

### Milestone 1: React Flow Setup
**Duration:** 0.5 day  
**Confidence Target:** 9/10  
**Status:** 🔵 Not Started

#### Objective
Install React Flow and create basic canvas component.

#### Deliverables

**Install dependencies:**
```bash
npm install reactflow
```

**Create `src/renderer/components/LogicEditor/LogicCanvas.tsx`:**

```tsx
// ============================================================
// LOGIC CANVAS - React Flow Integration
// ============================================================
// Main canvas component for visual logic editing.
// Uses React Flow for node-based editor functionality.
// 
// Level 1.5 Constraints:
// - Only onClick events as triggers
// - Only 3 action node types (setState, alert, console)
// - No expression nodes
// ============================================================

import React, { useCallback, useMemo } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  Node,
  Edge,
  Connection,
  addEdge,
  useNodesState,
  useEdgesState,
  NodeTypes,
  Panel,
} from 'reactflow';
import 'reactflow/dist/style.css';

import { useLogicStore } from '../../store/logicStore';
import { EventNodeComponent } from './nodes/EventNode';
import { SetStateNodeComponent } from './nodes/SetStateNode';
import { AlertNodeComponent } from './nodes/AlertNode';
import { ConsoleNodeComponent } from './nodes/ConsoleNode';
import { NodePalette } from './NodePalette';
import { FlowToolbar } from './FlowToolbar';

// ============================================================
// NODE TYPE REGISTRATION
// ============================================================

/**
 * Custom node types mapped to React components.
 * React Flow uses this to render the correct component for each node type.
 */
const nodeTypes: NodeTypes = {
  event: EventNodeComponent,
  setState: SetStateNodeComponent,
  alert: AlertNodeComponent,
  console: ConsoleNodeComponent,
};

// ============================================================
// CANVAS COMPONENT
// ============================================================

interface LogicCanvasProps {
  /** ID of the flow being edited (null for new flow) */
  flowId: string | null;
  /** Callback when canvas state changes */
  onFlowChange?: () => void;
}

/**
 * LogicCanvas - Main visual editor for logic flows
 * 
 * Renders a React Flow canvas with custom nodes for Rise's logic system.
 * Handles node/edge state, connections, and user interactions.
 */
export function LogicCanvas({ flowId, onFlowChange }: LogicCanvasProps) {
  // Get flow data from store
  const flow = useLogicStore((state) => 
    flowId ? state.flows[flowId] : null
  );
  const updateFlow = useLogicStore((state) => state.updateFlow);
  
  // React Flow state hooks
  const [nodes, setNodes, onNodesChange] = useNodesState(
    flow?.nodes || []
  );
  const [edges, setEdges, onEdgesChange] = useEdgesState(
    flow?.edges || []
  );
  
  // --------------------------------------------------------
  // CONNECTION HANDLING
  // --------------------------------------------------------
  
  /**
   * Handle new edge connections between nodes.
   * Validates that connections follow Level 1.5 rules:
   * - Event nodes can only connect to action nodes
   * - Action nodes cannot connect to event nodes
   */
  const onConnect = useCallback(
    (connection: Connection) => {
      // Find source and target nodes
      const sourceNode = nodes.find((n) => n.id === connection.source);
      const targetNode = nodes.find((n) => n.id === connection.target);
      
      if (!sourceNode || !targetNode) return;
      
      // Validate connection (Level 1.5: event → action only)
      if (targetNode.type === 'event') {
        console.warn('Cannot connect to event nodes');
        return;
      }
      
      // Add the edge
      setEdges((eds) => addEdge(connection, eds));
      
      // Notify parent of change
      onFlowChange?.();
    },
    [nodes, setNodes, onFlowChange]
  );
  
  // --------------------------------------------------------
  // NODE OPERATIONS
  // --------------------------------------------------------
  
  /**
   * Handle dropping a new node from the palette onto the canvas.
   */
  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      
      // Get node type from drag data
      const nodeType = event.dataTransfer.getData('application/reactflow');
      if (!nodeType) return;
      
      // Don't allow dropping event nodes (they're auto-created)
      if (nodeType === 'event') {
        console.warn('Event nodes are created automatically');
        return;
      }
      
      // Calculate drop position relative to canvas
      const reactFlowBounds = event.currentTarget.getBoundingClientRect();
      const position = {
        x: event.clientX - reactFlowBounds.left,
        y: event.clientY - reactFlowBounds.top,
      };
      
      // Create new node with unique ID
      const newNode: Node = {
        id: `node_${Date.now()}`,
        type: nodeType,
        position,
        data: getDefaultNodeData(nodeType),
      };
      
      setNodes((nds) => [...nds, newNode]);
      onFlowChange?.();
    },
    [setNodes, onFlowChange]
  );
  
  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);
  
  // --------------------------------------------------------
  // SAVE HANDLER
  // --------------------------------------------------------
  
  /**
   * Save current canvas state to the store.
   */
  const handleSave = useCallback(() => {
    if (!flowId) return;
    
    updateFlow(flowId, {
      nodes,
      edges,
    });
  }, [flowId, nodes, edges, updateFlow]);
  
  // --------------------------------------------------------
  // RENDER
  // --------------------------------------------------------
  
  return (
    <div className="h-full w-full flex flex-col">
      {/* Toolbar */}
      <FlowToolbar onSave={handleSave} flowId={flowId} />
      
      {/* Canvas */}
      <div className="flex-1 relative">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onDrop={onDrop}
          onDragOver={onDragOver}
          nodeTypes={nodeTypes}
          fitView
          snapToGrid
          snapGrid={[15, 15]}
        >
          {/* Background grid */}
          <Background color="#aaa" gap={15} />
          
          {/* Zoom/pan controls */}
          <Controls />
          
          {/* Minimap for navigation */}
          <MiniMap 
            nodeStrokeColor="#666"
            nodeColor="#fff"
            nodeBorderRadius={4}
          />
          
          {/* Node palette panel */}
          <Panel position="top-left">
            <NodePalette />
          </Panel>
        </ReactFlow>
      </div>
    </div>
  );
}

// ============================================================
// HELPERS
// ============================================================

/**
 * Get default data object for a new node of given type.
 */
function getDefaultNodeData(nodeType: string): Record<string, unknown> {
  switch (nodeType) {
    case 'setState':
      return {
        variable: '',
        value: { type: 'static', value: '' },
      };
    case 'alert':
      return {
        message: { type: 'static', value: 'Alert message' },
      };
    case 'console':
      return {
        level: 'log',
        message: { type: 'static', value: 'Log message' },
      };
    default:
      return {};
  }
}

export default LogicCanvas;
```

#### Files Created
- `src/renderer/components/LogicEditor/LogicCanvas.tsx`

---

### Milestone 2: Logic Store Setup
**Duration:** 0.5 day  
**Confidence Target:** 9/10  
**Status:** 🔵 Not Started

#### Objective
Create Zustand store for managing logic flows state.

#### Deliverables

**Create `src/renderer/store/logicStore.ts`:**

```typescript
// ============================================================
// LOGIC STORE - Zustand State Management
// ============================================================
// Manages the state of logic flows in the editor.
// Handles CRUD operations for flows, nodes, and edges.
// ============================================================

import { create } from 'zustand';
import { devtools, subscribeWithSelector } from 'zustand/middleware';
import { Flow, FlowNode, FlowEdge, PageState } from '../../core/logic/types';

// ============================================================
// STORE TYPES
// ============================================================

interface LogicState {
  // --------------------------------------------------------
  // STATE
  // --------------------------------------------------------
  
  /** All flows in the current project, keyed by flow ID */
  flows: Record<string, Flow>;
  
  /** Currently selected/active flow ID */
  activeFlowId: string | null;
  
  /** Page state variables */
  pageState: PageState;
  
  /** Loading state */
  isLoading: boolean;
  
  /** Error state */
  error: string | null;
  
  // --------------------------------------------------------
  // FLOW ACTIONS
  // --------------------------------------------------------
  
  /** Create a new flow */
  createFlow: (trigger: Flow['trigger']) => string;
  
  /** Update an existing flow */
  updateFlow: (flowId: string, updates: Partial<Flow>) => void;
  
  /** Delete a flow */
  deleteFlow: (flowId: string) => void;
  
  /** Set the active flow */
  setActiveFlow: (flowId: string | null) => void;
  
  // --------------------------------------------------------
  // NODE ACTIONS
  // --------------------------------------------------------
  
  /** Add a node to a flow */
  addNode: (flowId: string, node: FlowNode) => void;
  
  /** Update a node in a flow */
  updateNode: (flowId: string, nodeId: string, updates: Partial<FlowNode>) => void;
  
  /** Delete a node from a flow */
  deleteNode: (flowId: string, nodeId: string) => void;
  
  // --------------------------------------------------------
  // EDGE ACTIONS
  // --------------------------------------------------------
  
  /** Add an edge to a flow */
  addEdge: (flowId: string, edge: FlowEdge) => void;
  
  /** Delete an edge from a flow */
  deleteEdge: (flowId: string, edgeId: string) => void;
  
  // --------------------------------------------------------
  // STATE VARIABLE ACTIONS
  // --------------------------------------------------------
  
  /** Add a page state variable */
  addStateVariable: (name: string, type: 'string' | 'number' | 'boolean', initialValue: string | number | boolean) => void;
  
  /** Update a page state variable */
  updateStateVariable: (name: string, updates: Partial<PageState[string]>) => void;
  
  /** Delete a page state variable */
  deleteStateVariable: (name: string) => void;
  
  // --------------------------------------------------------
  // BULK OPERATIONS
  // --------------------------------------------------------
  
  /** Load flows from manifest */
  loadFromManifest: (flows: Record<string, Flow>, pageState: PageState) => void;
  
  /** Reset store to initial state */
  reset: () => void;
}

// ============================================================
// INITIAL STATE
// ============================================================

const initialState = {
  flows: {},
  activeFlowId: null,
  pageState: {},
  isLoading: false,
  error: null,
};

// ============================================================
// STORE IMPLEMENTATION
// ============================================================

export const useLogicStore = create<LogicState>()(
  devtools(
    subscribeWithSelector((set, get) => ({
      ...initialState,
      
      // --------------------------------------------------------
      // FLOW ACTIONS
      // --------------------------------------------------------
      
      createFlow: (trigger) => {
        const flowId = `flow_${Date.now()}`;
        const newFlow: Flow = {
          id: flowId,
          name: `${trigger.type} Handler`,
          trigger,
          nodes: [
            // Auto-create the event node
            {
              id: `${flowId}_event`,
              type: 'event',
              position: { x: 100, y: 100 },
              config: {
                eventType: trigger.type,
                componentId: trigger.componentId,
              },
            },
          ],
          edges: [],
        };
        
        set((state) => ({
          flows: { ...state.flows, [flowId]: newFlow },
          activeFlowId: flowId,
        }));
        
        return flowId;
      },
      
      updateFlow: (flowId, updates) => {
        set((state) => ({
          flows: {
            ...state.flows,
            [flowId]: { ...state.flows[flowId], ...updates },
          },
        }));
      },
      
      deleteFlow: (flowId) => {
        set((state) => {
          const { [flowId]: _, ...remainingFlows } = state.flows;
          return {
            flows: remainingFlows,
            activeFlowId: state.activeFlowId === flowId ? null : state.activeFlowId,
          };
        });
      },
      
      setActiveFlow: (flowId) => {
        set({ activeFlowId: flowId });
      },
      
      // --------------------------------------------------------
      // NODE ACTIONS
      // --------------------------------------------------------
      
      addNode: (flowId, node) => {
        set((state) => {
          const flow = state.flows[flowId];
          if (!flow) return state;
          
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
          if (!flow) return state;
          
          return {
            flows: {
              ...state.flows,
              [flowId]: {
                ...flow,
                nodes: flow.nodes.map((n) =>
                  n.id === nodeId ? { ...n, ...updates } : n
                ),
              },
            },
          };
        });
      },
      
      deleteNode: (flowId, nodeId) => {
        set((state) => {
          const flow = state.flows[flowId];
          if (!flow) return state;
          
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
      
      // --------------------------------------------------------
      // EDGE ACTIONS
      // --------------------------------------------------------
      
      addEdge: (flowId, edge) => {
        set((state) => {
          const flow = state.flows[flowId];
          if (!flow) return state;
          
          return {
            flows: {
              ...state.flows,
              [flowId]: {
                ...flow,
                edges: [...flow.edges, edge],
              },
            },
          };
        });
      },
      
      deleteEdge: (flowId, edgeId) => {
        set((state) => {
          const flow = state.flows[flowId];
          if (!flow) return state;
          
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
      
      // --------------------------------------------------------
      // STATE VARIABLE ACTIONS
      // --------------------------------------------------------
      
      addStateVariable: (name, type, initialValue) => {
        set((state) => ({
          pageState: {
            ...state.pageState,
            [name]: { type, initialValue },
          },
        }));
      },
      
      updateStateVariable: (name, updates) => {
        set((state) => ({
          pageState: {
            ...state.pageState,
            [name]: { ...state.pageState[name], ...updates },
          },
        }));
      },
      
      deleteStateVariable: (name) => {
        set((state) => {
          const { [name]: _, ...remaining } = state.pageState;
          return { pageState: remaining };
        });
      },
      
      // --------------------------------------------------------
      // BULK OPERATIONS
      // --------------------------------------------------------
      
      loadFromManifest: (flows, pageState) => {
        set({ flows, pageState, isLoading: false, error: null });
      },
      
      reset: () => {
        set(initialState);
      },
    })),
    { name: 'logic-store' }
  )
);

export default useLogicStore;
```

---

### Milestone 3: Node Palette
**Duration:** 0.5 day  
**Confidence Target:** 9/10  
**Status:** 🔵 Not Started

#### Objective
Create draggable palette of available node types.

#### Deliverables

**Create `src/renderer/components/LogicEditor/NodePalette.tsx`:**

```tsx
// ============================================================
// NODE PALETTE - Draggable Node Type Selection
// ============================================================
// Displays available node types that users can drag onto the canvas.
// Level 1.5 only shows: SetState, Alert, Console
// (Event nodes are auto-created from component events)
// ============================================================

import React from 'react';

// ============================================================
// NODE TYPE DEFINITIONS
// ============================================================

interface NodeTypeInfo {
  type: string;
  label: string;
  description: string;
  icon: string;
  color: string;
}

/**
 * Available node types in Level 1.5
 * Note: Event nodes are not in this list - they're auto-created
 */
const NODE_TYPES: NodeTypeInfo[] = [
  {
    type: 'setState',
    label: 'Set State',
    description: 'Update a page state variable',
    icon: '📝',
    color: 'bg-blue-100 border-blue-300',
  },
  {
    type: 'alert',
    label: 'Alert',
    description: 'Show a browser alert dialog',
    icon: '🔔',
    color: 'bg-yellow-100 border-yellow-300',
  },
  {
    type: 'console',
    label: 'Console',
    description: 'Log a message to the console',
    icon: '📋',
    color: 'bg-gray-100 border-gray-300',
  },
];

// ============================================================
// PALETTE ITEM COMPONENT
// ============================================================

interface PaletteItemProps {
  nodeType: NodeTypeInfo;
}

/**
 * Individual draggable node type item
 */
function PaletteItem({ nodeType }: PaletteItemProps) {
  /**
   * Handle drag start - store node type in drag data
   */
  const onDragStart = (event: React.DragEvent) => {
    event.dataTransfer.setData('application/reactflow', nodeType.type);
    event.dataTransfer.effectAllowed = 'move';
  };
  
  return (
    <div
      className={`
        px-3 py-2 rounded border cursor-grab
        hover:shadow-md transition-shadow
        ${nodeType.color}
      `}
      draggable
      onDragStart={onDragStart}
      title={nodeType.description}
    >
      <div className="flex items-center gap-2">
        <span className="text-lg">{nodeType.icon}</span>
        <span className="text-sm font-medium">{nodeType.label}</span>
      </div>
    </div>
  );
}

// ============================================================
// NODE PALETTE COMPONENT
// ============================================================

/**
 * NodePalette - Panel showing available node types
 * 
 * Users can drag nodes from here onto the canvas to add them to a flow.
 */
export function NodePalette() {
  return (
    <div className="bg-white rounded-lg shadow-lg p-3 w-48">
      <h3 className="text-sm font-semibold text-gray-700 mb-2">
        Add Action
      </h3>
      <p className="text-xs text-gray-500 mb-3">
        Drag onto canvas
      </p>
      
      <div className="space-y-2">
        {NODE_TYPES.map((nodeType) => (
          <PaletteItem key={nodeType.type} nodeType={nodeType} />
        ))}
      </div>
      
      {/* Level 1.5 notice */}
      <div className="mt-3 pt-3 border-t border-gray-200">
        <p className="text-xs text-gray-400">
          More node types coming in Level 2
        </p>
      </div>
    </div>
  );
}

export default NodePalette;
```

---

### Milestone 4: Editor Integration
**Duration:** 0.5 day  
**Confidence Target:** 8/10  
**Status:** 🔵 Not Started

#### Objective
Add Logic tab to the editor and integrate LogicCanvas.

#### Deliverables

**Update `src/renderer/components/Editor/EditorTabs.tsx`:**

Add "Logic" as a new tab option alongside Preview, Code, and Console.

**Create `src/renderer/components/Editor/LogicTab.tsx`:**

```tsx
// ============================================================
// LOGIC TAB - Logic Editor Container
// ============================================================
// Container component for the logic editor tab.
// Handles flow selection and canvas rendering.
// ============================================================

import React from 'react';
import { LogicCanvas } from '../LogicEditor/LogicCanvas';
import { useLogicStore } from '../../store/logicStore';
import { useComponentStore } from '../../store/componentStore';

/**
 * LogicTab - Container for the logic editing experience
 */
export function LogicTab() {
  const activeFlowId = useLogicStore((state) => state.activeFlowId);
  const flows = useLogicStore((state) => state.flows);
  const selectedComponentId = useComponentStore((state) => state.selectedComponentId);
  
  // Find flows associated with selected component
  const componentFlows = Object.values(flows).filter(
    (flow) => flow.trigger.componentId === selectedComponentId
  );
  
  return (
    <div className="h-full flex flex-col">
      {/* Flow selector (if component has multiple flows) */}
      {componentFlows.length > 1 && (
        <div className="p-2 border-b bg-gray-50">
          <select
            className="text-sm border rounded px-2 py-1"
            value={activeFlowId || ''}
            onChange={(e) => useLogicStore.getState().setActiveFlow(e.target.value)}
          >
            {componentFlows.map((flow) => (
              <option key={flow.id} value={flow.id}>
                {flow.name}
              </option>
            ))}
          </select>
        </div>
      )}
      
      {/* Canvas or empty state */}
      {activeFlowId ? (
        <LogicCanvas flowId={activeFlowId} />
      ) : selectedComponentId ? (
        <EmptyState componentId={selectedComponentId} />
      ) : (
        <NoSelectionState />
      )}
    </div>
  );
}

/**
 * Empty state when component has no flows
 */
function EmptyState({ componentId }: { componentId: string }) {
  const createFlow = useLogicStore((state) => state.createFlow);
  
  const handleCreateFlow = () => {
    createFlow({
      type: 'onClick',
      componentId,
    });
  };
  
  return (
    <div className="flex-1 flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <p className="text-gray-500 mb-4">
          No logic flows for this component
        </p>
        <button
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          onClick={handleCreateFlow}
        >
          + Add onClick Handler
        </button>
      </div>
    </div>
  );
}

/**
 * State when no component is selected
 */
function NoSelectionState() {
  return (
    <div className="flex-1 flex items-center justify-center bg-gray-50">
      <p className="text-gray-400">
        Select a component to edit its logic
      </p>
    </div>
  );
}

export default LogicTab;
```

---

### Milestone 5: Flow Toolbar
**Duration:** 0.25 day  
**Confidence Target:** 9/10  
**Status:** 🔵 Not Started

#### Objective
Create toolbar for flow operations (save, delete, etc.).

#### Deliverables

**Create `src/renderer/components/LogicEditor/FlowToolbar.tsx`:**

```tsx
// ============================================================
// FLOW TOOLBAR - Flow Operations
// ============================================================

import React from 'react';
import { useLogicStore } from '../../store/logicStore';

interface FlowToolbarProps {
  flowId: string | null;
  onSave: () => void;
}

export function FlowToolbar({ flowId, onSave }: FlowToolbarProps) {
  const flow = useLogicStore((state) => 
    flowId ? state.flows[flowId] : null
  );
  const deleteFlow = useLogicStore((state) => state.deleteFlow);
  
  if (!flow) return null;
  
  return (
    <div className="flex items-center justify-between px-4 py-2 bg-gray-100 border-b">
      {/* Flow name */}
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">{flow.name}</span>
        <span className="text-xs text-gray-500">
          ({flow.nodes.length} nodes)
        </span>
      </div>
      
      {/* Actions */}
      <div className="flex items-center gap-2">
        <button
          className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
          onClick={onSave}
        >
          Save
        </button>
        <button
          className="px-3 py-1 text-sm bg-red-100 text-red-600 rounded hover:bg-red-200"
          onClick={() => flowId && deleteFlow(flowId)}
        >
          Delete
        </button>
      </div>
    </div>
  );
}

export default FlowToolbar;
```

---

## 🧪 Testing Requirements

### Unit Tests
- [ ] logicStore - all actions work correctly
- [ ] logicStore - state updates are immutable
- [ ] NodePalette - renders all node types
- [ ] NodePalette - drag data is set correctly

### Integration Tests
- [ ] LogicCanvas renders without errors
- [ ] Can add nodes via drag and drop
- [ ] Can connect nodes
- [ ] Can delete nodes and edges
- [ ] Canvas state syncs with store

### Manual Testing
- [ ] Pan and zoom work smoothly
- [ ] Node selection is intuitive
- [ ] Drag from palette feels natural
- [ ] Tab switching preserves state

---

## 📋 Human Review Checklist

- [ ] React Flow integrated correctly
- [ ] Store design is clean and extensible
- [ ] UI matches existing editor style
- [ ] No performance issues with canvas
- [ ] Drag and drop works reliably

---

**Task Status:** 🔵 Not Started  
**Next Step:** Install React Flow and create LogicCanvas  
**Last Updated:** [Date]