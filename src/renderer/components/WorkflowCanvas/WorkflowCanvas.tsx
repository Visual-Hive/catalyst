/**
 * @file WorkflowCanvas.tsx
 * @description Main React Flow canvas for Catalyst workflow editing
 * 
 * @architecture Phase 0, Task 0.5 - Canvas Adaptation
 * @created 2025-12-18
 * @author AI (Cline) + Human Review
 * @confidence 8/10 - Adapted from LogicCanvas, integrated with workflowStore
 * 
 * @see src/renderer/store/workflowStore.ts - State management
 * @see src/core/workflow/types.ts - Type definitions
 * @see src/renderer/components/LogicEditor/LogicCanvas.tsx - Original inspiration
 * 
 * PROBLEM SOLVED:
 * - Need visual canvas for editing Catalyst workflows
 * - Must handle 55+ node types dynamically
 * - Sync canvas state with workflowStore
 * - Support drag & drop from palette
 * - Handle edge connections with validation
 * 
 * SOLUTION:
 * - React Flow canvas with custom WorkflowNode renderer
 * - Bidirectional sync with workflowStore
 * - Dynamic node creation from palette
 * - CSS Grid layout for toolbar + canvas
 * - WorkflowNodePalette in overlay panel
 * 
 * DESIGN DECISIONS:
 * - Separate from LogicCanvas (parallel systems)
 * - Generic WorkflowNode component for all types
 * - Position sync on drag (debounced via store)
 * - Background grid with snap-to-grid
 * - MiniMap for navigation
 * 
 * @security-critical false
 * @performance-critical true - Canvas rendering, drag operations
 */

import React, { useCallback, useRef, useState, useEffect } from 'react';
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
  Node,
  Edge,
} from 'reactflow';
import 'reactflow/dist/style.css';

import { useWorkflowStore } from '../../store/workflowStore';
import { WorkflowNode } from './WorkflowNode';
import { WorkflowNodePalette } from './WorkflowNodePalette';
import { WorkflowToolbar } from './WorkflowToolbar';
import { WorkflowPropertiesPanel } from './WorkflowPropertiesPanel';
import { generateNodeId, type NodeType, type NodeDefinition } from '../../../core/workflow/types';
import { getNodeMetadata } from '../../../core/workflow/nodes';

// ============================================================
// NODE TYPE REGISTRATION
// ============================================================

/**
 * Custom node types mapped to React components
 * React Flow uses this to render the correct component for each node type
 * 
 * We use a single 'workflowNode' type that renders all 55+ node types
 * dynamically based on metadata from NODE_REGISTRY
 */
const nodeTypes: NodeTypes = {
  workflowNode: WorkflowNode,
};

// ============================================================
// CANVAS COMPONENT (INNER - needs ReactFlow context)
// ============================================================

interface WorkflowCanvasInnerProps {
  /** ID of the workflow being edited */
  workflowId: string;
}

/**
 * Inner canvas component that uses React Flow context
 * Must be wrapped in ReactFlowProvider
 */
function WorkflowCanvasInner({ workflowId }: WorkflowCanvasInnerProps) {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const { screenToFlowPosition } = useReactFlow();
  
  // Get workflow from store
  const workflow = useWorkflowStore((state) => state.getActiveWorkflow());
  const addNode = useWorkflowStore((state) => state.addNode);
  const addEdge = useWorkflowStore((state) => state.addEdge);
  const deleteNode = useWorkflowStore((state) => state.deleteNode);
  const deleteEdge = useWorkflowStore((state) => state.deleteEdge);
  const syncNodesFromReactFlow = useWorkflowStore((state) => state.syncNodesFromReactFlow);
  const syncEdgesFromReactFlow = useWorkflowStore((state) => state.syncEdgesFromReactFlow);
  const selectNode = useWorkflowStore((state) => state.selectNode);
  
  // Convert manifest nodes to React Flow format
  // Store nodes in local state for React Flow control
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  
  // Sync from store to React Flow when workflow changes
  useEffect(() => {
    if (!workflow) {
      setNodes([]);
      setEdges([]);
      return;
    }
    
    // Convert NodeDefinition to React Flow Node format
    const rfNodes: Node[] = Object.values(workflow.nodes).map(node => ({
      id: node.id,
      type: 'workflowNode',
      position: node.position,
      data: node, // Pass entire NodeDefinition as data
    }));
    
    // Convert EdgeDefinition to React Flow Edge format
    const rfEdges: Edge[] = workflow.edges.map(edge => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      sourceHandle: edge.sourceHandle,
      targetHandle: edge.targetHandle,
    }));
    
    setNodes(rfNodes);
    setEdges(rfEdges);
  }, [workflow]);
  
  // --------------------------------------------------------
  // CHANGE HANDLERS
  // --------------------------------------------------------
  
  /**
   * Handle node changes (position, selection, deletion)
   * Syncs changes back to workflowStore
   */
  const onNodesChange = useCallback(
    (changes: NodeChange[]) => {
      // Filter out dimension changes to prevent infinite loops
      const meaningfulChanges = changes.filter(
        (change) => change.type !== 'dimensions'
      );
      
      if (meaningfulChanges.length === 0) return;
      
      // Apply changes to get new nodes
      setNodes((nds) => applyNodeChanges(changes, nds));
      
      // Handle deletions
      changes.forEach((change) => {
        if (change.type === 'remove') {
          deleteNode(workflowId, change.id);
        }
      });
      
      // Sync positions back to store (debounced via store)
      if (changes.some((c) => c.type === 'position')) {
        const updatedNodes = applyNodeChanges(changes, nodes);
        syncNodesFromReactFlow(workflowId, updatedNodes);
      }
    },
    [workflowId, nodes, deleteNode, syncNodesFromReactFlow]
  );
  
  /**
   * Handle edge changes (selection, deletion)
   * Syncs changes back to workflowStore
   */
  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => {
      // Apply changes to get new edges
      setEdges((eds) => applyEdgeChanges(changes, eds));
      
      // Handle deletions
      changes.forEach((change) => {
        if (change.type === 'remove') {
          deleteEdge(workflowId, change.id);
        }
      });
      
      // Sync back to store
      const updatedEdges = applyEdgeChanges(changes, edges);
      syncEdgesFromReactFlow(workflowId, updatedEdges);
    },
    [workflowId, edges, deleteEdge, syncEdgesFromReactFlow]
  );
  
  /**
   * Handle new connections between nodes
   * Validates and adds edge through workflowStore
   */
  const onConnect = useCallback(
    (connection: Connection) => {
      if (!connection.source || !connection.target) return;
      
      // Create edge definition
      // Convert null to undefined for handles
      const newEdge = {
        id: `edge_${Date.now()}`,
        source: connection.source,
        target: connection.target,
        sourceHandle: connection.sourceHandle ?? undefined,
        targetHandle: connection.targetHandle ?? undefined,
      };
      
      // Add edge through store (which validates)
      addEdge(workflowId, newEdge);
    },
    [workflowId, addEdge]
  );
  
  /**
   * Handle node selection
   * Updates store with selected node ID
   */
  const onNodeClick = useCallback(
    (_event: React.MouseEvent, node: Node) => {
      selectNode(node.id);
    },
    [selectNode]
  );
  
  /**
   * Handle canvas click (deselect node)
   * Clicking empty canvas area clears selection
   */
  const onPaneClick = useCallback(() => {
    selectNode(null);
  }, [selectNode]);
  
  // --------------------------------------------------------
  // DRAG AND DROP HANDLERS
  // --------------------------------------------------------
  
  /**
   * Handle dropping a node from the palette onto the canvas
   * Creates new node at drop position
   */
  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      
      // Get node type from drag data
      const nodeType = event.dataTransfer.getData('application/reactflow') as NodeType;
      if (!nodeType) return;
      
      // Get canvas bounds and drop position
      const reactFlowBounds = reactFlowWrapper.current?.getBoundingClientRect();
      if (!reactFlowBounds) return;
      
      // Project screen coordinates to flow coordinates
      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });
      
      // Get node metadata
      const metadata = getNodeMetadata(nodeType);
      if (!metadata) {
        console.warn(`[WorkflowCanvas] Unknown node type: ${nodeType}`);
        return;
      }
      
      // Create new node with default config
      const newNode: NodeDefinition = {
        id: generateNodeId(nodeType),
        type: nodeType,
        name: metadata.name,
        position,
        config: {}, // Empty config - user fills in properties panel
      };
      
      // Add to store
      addNode(workflowId, newNode);
    },
    [workflowId, screenToFlowPosition, addNode]
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
  
  if (!workflow) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-gray-400 text-lg mb-2">No Active Workflow</p>
          <p className="text-gray-500 text-sm">
            Create or select a workflow to get started
          </p>
        </div>
      </div>
    );
  }
  
  return (
    <div ref={reactFlowWrapper} className="h-full w-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        onPaneClick={onPaneClick}
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
            // Color nodes by category
            const nodeData = node.data as NodeDefinition;
            const metadata = getNodeMetadata(nodeData.type);
            
            // Extract color from metadata
            if (metadata?.color.includes('green')) return '#86efac';
            if (metadata?.color.includes('purple')) return '#c084fc';
            if (metadata?.color.includes('blue')) return '#60a5fa';
            if (metadata?.color.includes('orange')) return '#fb923c';
            if (metadata?.color.includes('yellow')) return '#fbbf24';
            if (metadata?.color.includes('teal')) return '#5eead4';
            if (metadata?.color.includes('pink')) return '#f472b6';
            return '#d1d5db';
          }}
          nodeBorderRadius={4}
          className="bg-white shadow-lg rounded-lg"
        />
        
        {/* Node palette panel */}
        <Panel position="top-left">
          <WorkflowNodePalette />
        </Panel>
      </ReactFlow>
    </div>
  );
}

// ============================================================
// MAIN CANVAS COMPONENT (with Provider and Toolbar)
// ============================================================

interface WorkflowCanvasProps {
  /** ID of the workflow being edited */
  workflowId: string;
}

/**
 * WorkflowCanvas - Main visual editor for Catalyst workflows
 * 
 * Renders a React Flow canvas with 55+ dynamic node types.
 * Handles node/edge state, connections, drag & drop, and user interactions.
 * 
 * Uses flexbox for reliable height handling:
 * - WorkflowToolbar takes its natural height (flex: none)
 * - React Flow canvas fills all remaining space (flex: 1)
 * 
 * FEATURES:
 * - Dynamic node rendering via WorkflowNode component
 * - Categorized node palette with search
 * - Drag & drop node creation
 * - Edge connections with handle validation
 * - Position syncing to workflowStore
 * - Minimap, background grid, zoom controls
 * 
 * USAGE:
 * ```tsx
 * const activeWorkflowId = useWorkflowStore(s => s.activeWorkflowId);
 * 
 * {activeWorkflowId && (
 *   <WorkflowCanvas workflowId={activeWorkflowId} />
 * )}
 * ```
 */
export function WorkflowCanvas({ workflowId }: WorkflowCanvasProps) {
  const selectedNodeId = useWorkflowStore((state) => state.selectedNodeId);
  
  return (
    // Flex container for toolbar + canvas + properties panel layout
    // h-full and w-full ensure this takes up its parent's full dimensions
    <div className="h-full w-full flex flex-col">
      <ReactFlowProvider>
        {/* Toolbar - must be inside ReactFlowProvider to use useReactFlow */}
        <WorkflowToolbar workflowId={workflowId} />
        
        {/* Canvas + Properties Panel - flex row layout */}
        <div className="flex-1 min-h-0 flex">
          {/* Canvas - flex-1 makes it fill remaining space */}
          <div className="flex-1">
            <WorkflowCanvasInner workflowId={workflowId} />
          </div>
          
          {/* Properties Panel - fixed width 320px (w-80) */}
          <div className="w-80 flex-shrink-0">
            <WorkflowPropertiesPanel
              workflowId={workflowId}
              selectedNodeId={selectedNodeId}
            />
          </div>
        </div>
      </ReactFlowProvider>
    </div>
  );
}

export default WorkflowCanvas;
