/**
 * @file LogicCanvas.tsx
 * @description React Flow canvas for visual logic editing
 * 
 * @architecture Phase 4, Task 4.1 - React Flow Integration
 * @created 2025-11-29
 * @author AI (Cline) + Human Review
 * @confidence 9/10 - React Flow integration with custom node support
 * 
 * @see src/renderer/store/logicStore.ts - State management
 * @see src/core/logic/types.ts - Type definitions
 * @see .implementation/phase-4-logic-editor/task-4.1-react-flow-integration.md
 * 
 * PROBLEM SOLVED:
 * - Provides visual canvas for creating logic flows
 * - Handles node/edge creation, editing, and deletion
 * - Syncs canvas state with logicStore
 * 
 * SOLUTION:
 * - React Flow with custom node types
 * - Background grid with snap-to-grid
 * - Controls for zoom/pan
 * - MiniMap for navigation
 * - Drop zone for palette items
 * 
 * LEVEL 1.5 CONSTRAINTS:
 * - Only onClick events as triggers
 * - Only 3 action node types (setState, alert, console)
 * - Event nodes cannot have incoming connections
 * 
 * @security-critical false
 * @performance-critical false - Canvas operations are user-driven
 */

import React, { useCallback, useRef, useMemo, useState, useEffect } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  Connection,
  NodeChange,
  EdgeChange,
  applyNodeChanges,
  applyEdgeChanges,
  NodeTypes,
  Panel,
  ReactFlowProvider,
  useReactFlow,
} from 'reactflow';
import 'reactflow/dist/style.css';

import { useLogicStore, flowNodeToReactFlowNode, flowEdgeToReactFlowEdge } from '../../store/logicStore';
import { NodePalette } from './NodePalette';
import { FlowToolbar } from './FlowToolbar';
import {
  EventNodeComponent,
  SetStateNodeComponent,
  AlertNodeComponent,
  ConsoleNodeComponent,
} from './nodes';
import {
  generateNodeId,
  NodeType,
  SetStateNode,
  AlertNode,
  ConsoleNode,
  FlowNode,
} from '../../../core/logic/types';

// ============================================================
// NODE TYPE REGISTRATION
// ============================================================

/**
 * Custom node types mapped to React components.
 * React Flow uses this to render the correct component for each node type.
 * 
 * These components are implemented in Task 4.2:
 * - EventNodeComponent: Read-only trigger display
 * - SetStateNodeComponent: State variable update configuration
 * - AlertNodeComponent: Browser alert configuration
 * - ConsoleNodeComponent: Console log configuration
 */
const nodeTypes: NodeTypes = {
  event: EventNodeComponent,
  setState: SetStateNodeComponent,
  alert: AlertNodeComponent,
  console: ConsoleNodeComponent,
};

// ============================================================
// CANVAS COMPONENT (INNER - needs ReactFlow context)
// ============================================================

interface LogicCanvasInnerProps {
  /** ID of the flow being edited */
  flowId: string;
}

/**
 * Inner canvas component that uses React Flow context
 * Must be wrapped in ReactFlowProvider
 */
/**
 * Custom hook to measure container dimensions using ResizeObserver
 * React Flow requires explicit dimensions to render correctly
 */
function useContainerDimensions(ref: React.RefObject<HTMLDivElement>) {
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        setDimensions({ width, height });
      }
    });
    
    observer.observe(element);
    
    // Get initial dimensions
    const { width, height } = element.getBoundingClientRect();
    setDimensions({ width, height });
    
    return () => observer.disconnect();
  }, [ref]);
  
  return dimensions;
}

function LogicCanvasInner({ flowId }: LogicCanvasInnerProps) {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const { width, height } = useContainerDimensions(reactFlowWrapper);
  const { project } = useReactFlow();
  
  // Get flow from store
  const flow = useLogicStore((state) => state.flows[flowId]);
  const addNode = useLogicStore((state) => state.addNode);
  const addEdge = useLogicStore((state) => state.addEdge);
  const syncNodesFromReactFlow = useLogicStore((state) => state.syncNodesFromReactFlow);
  const syncEdgesFromReactFlow = useLogicStore((state) => state.syncEdgesFromReactFlow);
  
  // Convert our nodes/edges to React Flow format
  const nodes = useMemo(() => {
    if (!flow) return [];
    return flow.nodes.map(flowNodeToReactFlowNode);
  }, [flow]);
  
  const edges = useMemo(() => {
    if (!flow) return [];
    return flow.edges.map(flowEdgeToReactFlowEdge);
  }, [flow]);
  
  // --------------------------------------------------------
  // CHANGE HANDLERS
  // --------------------------------------------------------
  
  /**
   * Handle node changes (position, selection, deletion)
   * Syncs changes back to logicStore
   */
  const onNodesChange = useCallback(
    (changes: NodeChange[]) => {
      // Apply changes to get new nodes
      const newNodes = applyNodeChanges(changes, nodes);
      
      // Sync positions back to store
      syncNodesFromReactFlow(flowId, newNodes);
    },
    [flowId, nodes, syncNodesFromReactFlow]
  );
  
  /**
   * Handle edge changes (selection, deletion)
   * Syncs changes back to logicStore
   */
  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => {
      // Apply changes to get new edges
      const newEdges = applyEdgeChanges(changes, edges);
      
      // Sync back to store
      syncEdgesFromReactFlow(flowId, newEdges);
    },
    [flowId, edges, syncEdgesFromReactFlow]
  );
  
  /**
   * Handle new connections between nodes
   * Validates and adds edge through logicStore
   */
  const onConnect = useCallback(
    (connection: Connection) => {
      if (!connection.source || !connection.target) return;
      
      // Add edge through store (which validates)
      addEdge(flowId, connection.source, connection.target);
    },
    [flowId, addEdge]
  );
  
  // --------------------------------------------------------
  // DRAG AND DROP HANDLERS
  // --------------------------------------------------------
  
  /**
   * Handle dropping a node from the palette onto the canvas
   */
  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      
      // Get node type from drag data
      const nodeType = event.dataTransfer.getData('application/reactflow') as NodeType;
      if (!nodeType) return;
      
      // Don't allow dropping event nodes (they're auto-created)
      if (nodeType === 'event') {
        console.warn('[LogicCanvas] Event nodes are created automatically');
        return;
      }
      
      // Get canvas bounds and drop position
      const reactFlowBounds = reactFlowWrapper.current?.getBoundingClientRect();
      if (!reactFlowBounds) return;
      
      // Project screen coordinates to flow coordinates
      const position = project({
        x: event.clientX - reactFlowBounds.left,
        y: event.clientY - reactFlowBounds.top,
      });
      
      // Create new node based on type
      const newNode = createNodeOfType(nodeType, position);
      if (newNode) {
        addNode(flowId, newNode);
      }
    },
    [flowId, project, addNode]
  );
  
  /**
   * Allow dropping on the canvas
   */
  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);
  
  // --------------------------------------------------------
  // RENDER
  // --------------------------------------------------------
  
  if (!flow) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50">
        <p className="text-gray-400">Flow not found</p>
      </div>
    );
  }
  
  // Don't render React Flow until we have dimensions
  if (width === 0 || height === 0) {
    return (
      <div ref={reactFlowWrapper} style={{ height: '100%', width: '100%' }}>
        <div className="h-full flex items-center justify-center bg-gray-50">
          <p className="text-sm text-gray-400">Initializing canvas...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div ref={reactFlowWrapper} style={{ height: '100%', width: '100%' }}>
      <div style={{ width, height }}>
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
        deleteKeyCode={['Backspace', 'Delete']}
        multiSelectionKeyCode={['Meta', 'Control']}
      >
        {/* Background grid */}
        <Background color="#e2e8f0" gap={15} />
        
        {/* Zoom/pan controls */}
        <Controls className="bg-white shadow-lg rounded-lg" />
        
        {/* Minimap for navigation */}
        <MiniMap
          nodeStrokeColor="#666"
          nodeColor={(node) => {
            switch (node.type) {
              case 'event': return '#c084fc';
              case 'setState': return '#60a5fa';
              case 'alert': return '#fbbf24';
              case 'console': return '#9ca3af';
              default: return '#ccc';
            }
          }}
          nodeBorderRadius={4}
          className="bg-white shadow-lg rounded-lg"
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
// MAIN CANVAS COMPONENT (with Provider)
// ============================================================

interface LogicCanvasProps {
  /** ID of the flow being edited */
  flowId: string;
}

/**
 * LogicCanvas - Main visual editor for logic flows
 * 
 * Renders a React Flow canvas with custom nodes for Rise's logic system.
 * Handles node/edge state, connections, and user interactions.
 * 
 * USAGE:
 * ```tsx
 * <LogicCanvas flowId={activeFlowId} />
 * ```
 */
export function LogicCanvas({ flowId }: LogicCanvasProps) {
  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <FlowToolbar flowId={flowId} />
      
      {/* Canvas with React Flow Provider */}
      <div className="flex-1 min-h-0">
        <ReactFlowProvider>
          <LogicCanvasInner flowId={flowId} />
        </ReactFlowProvider>
      </div>
    </div>
  );
}

// ============================================================
// HELPER FUNCTIONS
// ============================================================

/**
 * Create a new node of the specified type with default config
 * 
 * @param nodeType - Type of node to create
 * @param position - Position on canvas
 * @returns New node or null if invalid type
 */
function createNodeOfType(
  nodeType: NodeType,
  position: { x: number; y: number }
): FlowNode | null {
  const id = generateNodeId(nodeType);
  
  switch (nodeType) {
    case 'setState':
      return {
        id,
        type: 'setState',
        position,
        config: {
          variable: '',
          value: { type: 'static', value: '' },
        },
      } as SetStateNode;
    
    case 'alert':
      return {
        id,
        type: 'alert',
        position,
        config: {
          message: { type: 'static', value: 'Alert message' },
        },
      } as AlertNode;
    
    case 'console':
      return {
        id,
        type: 'console',
        position,
        config: {
          level: 'log',
          message: { type: 'static', value: 'Log message' },
        },
      } as ConsoleNode;
    
    case 'event':
      // Event nodes should not be created by drag-drop
      console.warn('[LogicCanvas] Event nodes cannot be created manually');
      return null;
    
    default:
      console.warn(`[LogicCanvas] Unknown node type: ${nodeType}`);
      return null;
  }
}

export default LogicCanvas;
