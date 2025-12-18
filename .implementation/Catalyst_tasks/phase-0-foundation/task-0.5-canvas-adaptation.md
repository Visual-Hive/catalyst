# Task 0.5: Canvas Adaptation

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
Adapt the existing LogicCanvas to render workflow nodes as a React Flow-based workflow editor.

The canvas is the main visual editing area where users build workflows by adding, connecting, and configuring nodes. This task adapts the existing React Flow canvas (used for component logic in Rise) to work with Catalyst's workflow nodes and integrates it with the new workflow store.

### Success Criteria
- [ ] Canvas renders workflow nodes
- [ ] Nodes can be dragged and repositioned
- [ ] Edges can be connected between nodes
- [ ] Node selection updates properties panel
- [ ] Changes sync to workflowStore
- [ ] Node types display with correct icons/colors
- [ ] Context menu for adding nodes
- [ ] Test coverage >80%
- [ ] Human review completed

### References
- CATALYST_PHASE_0_TASKS.md - Task 0.5
- Task 0.3 - For node metadata
- Task 0.4 - For workflow store

### Dependencies
- Task 0.3: Node Type System (completed)
- Task 0.4: Workflow Store (completed)

---

## Milestones

### Milestone 1: Analyze Existing Canvas
**Date:** [YYYY-MM-DD]  
**Confidence:** [X/10]  
**Status:** 🔵 Not Started  
**Time Spent:** [X hours]  

#### Activities
- [ ] Review existing LogicCanvas implementation
- [ ] Identify reusable components
- [ ] Plan refactoring approach
- [ ] Document changes needed

#### Current Structure Analysis
```
src/renderer/components/LogicEditor/
├── LogicCanvas.tsx        # Main canvas component
├── nodes/                 # Custom node components
│   └── ...
├── edges/                 # Custom edge components
│   └── ...
└── utils/                 # Canvas utilities
    └── ...
```

#### Required Changes
| Component | Change | Reason |
|-----------|--------|--------|
| LogicCanvas | Rename to WorkflowCanvas | Clarity |
| Custom nodes | Create WorkflowNode | New visual design |
| Store integration | Switch to workflowStore | New state management |
| Node palette | Update categories | Workflow nodes |

#### Design Decisions

| Decision | Options Considered | Choice Made | Rationale | Confidence |
|----------|-------------------|-------------|-----------|------------|
| Canvas approach | New canvas, Adapt existing | Adapt existing | Preserves React Flow setup | 9/10 |
| Node rendering | Single generic, Per-type components | Single generic with config | Simpler maintenance | 8/10 |
| Edge styling | Default, Custom animated | Default initially | MVP speed | 8/10 |

---

### Milestone 2: Create WorkflowNode Component
**Date:** [YYYY-MM-DD]  
**Confidence:** [X/10]  
**Status:** 🔵 Not Started  
**Time Spent:** [X hours]  

#### File: `src/renderer/components/WorkflowCanvas/WorkflowNode.tsx`

```typescript
/**
 * @file WorkflowNode.tsx
 * @description Custom React Flow node for workflow nodes
 * 
 * @architecture Phase 0, Task 0.5 - Canvas Adaptation
 * @created 2025-12-XX
 * @author AI (Cline) + Human Review
 * @confidence 9/10
 */

import React, { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import * as Icons from 'lucide-react';
import type { NodeDefinition } from '../../../core/workflow/types';
import { getNodeMetadata } from '../../../core/workflow/nodes';
import { useWorkflowStore } from '../../store/workflowStore';
import { cn } from '../../utils/cn';

/**
 * Props passed to workflow node via React Flow data field
 */
interface WorkflowNodeData extends NodeDefinition {}

/**
 * Get Lucide icon component by name
 */
function getIconComponent(iconName: string) {
  const Icon = (Icons as any)[iconName];
  return Icon || Icons.Box;
}

/**
 * Custom workflow node component
 * 
 * Renders:
 * - Category-colored header with icon
 * - Node name
 * - Input/output handles based on metadata
 * - Selection highlight
 */
export const WorkflowNode = memo(({ id, data, selected }: NodeProps<WorkflowNodeData>) => {
  const selectNode = useWorkflowStore((s) => s.selectNode);
  const metadata = getNodeMetadata(data.type);
  
  if (!metadata) {
    return (
      <div className="px-4 py-2 bg-red-100 border border-red-300 rounded">
        Unknown node type: {data.type}
      </div>
    );
  }

  const IconComponent = getIconComponent(metadata.icon);

  return (
    <div
      className={cn(
        'min-w-[180px] bg-white rounded-lg shadow-md border-2 transition-all',
        selected ? 'border-blue-500 shadow-lg' : 'border-gray-200',
        'hover:shadow-lg'
      )}
      onClick={() => selectNode(id)}
    >
      {/* Header with icon and category color */}
      <div className={cn(
        'flex items-center gap-2 px-3 py-2 rounded-t-md',
        metadata.color,
        'text-white'
      )}>
        <IconComponent className="w-4 h-4" />
        <span className="text-sm font-medium truncate">
          {data.name || metadata.name}
        </span>
      </div>
      
      {/* Body */}
      <div className="px-3 py-2">
        <p className="text-xs text-gray-500 truncate">
          {metadata.description}
        </p>
      </div>
      
      {/* Input handles */}
      {metadata.inputs.map((input, index) => (
        <Handle
          key={input.id}
          type="target"
          position={Position.Left}
          id={input.id}
          className={cn(
            'w-3 h-3 border-2 border-white',
            input.type === 'error' ? 'bg-red-500' : 'bg-gray-400'
          )}
          style={{
            top: `${((index + 1) / (metadata.inputs.length + 1)) * 100}%`,
          }}
        />
      ))}
      
      {/* Output handles */}
      {metadata.outputs.map((output, index) => (
        <Handle
          key={output.id}
          type="source"
          position={Position.Right}
          id={output.id}
          className={cn(
            'w-3 h-3 border-2 border-white',
            output.type === 'error' ? 'bg-red-500' :
            output.type === 'conditional' ? 'bg-yellow-500' :
            output.type === 'stream' ? 'bg-purple-500' :
            'bg-gray-400'
          )}
          style={{
            top: `${((index + 1) / (metadata.outputs.length + 1)) * 100}%`,
          }}
        />
      ))}
    </div>
  );
});

WorkflowNode.displayName = 'WorkflowNode';
```

---

### Milestone 3: Create Main Canvas Component
**Date:** [YYYY-MM-DD]  
**Confidence:** [X/10]  
**Status:** 🔵 Not Started  
**Time Spent:** [X hours]  

#### File: `src/renderer/components/WorkflowCanvas/WorkflowCanvas.tsx`

```typescript
/**
 * @file WorkflowCanvas.tsx
 * @description Main canvas component for workflow editing
 * 
 * @architecture Phase 0, Task 0.5 - Canvas Adaptation
 * @created 2025-12-XX
 * @author AI (Cline) + Human Review
 * @confidence 9/10
 */

import React, { useCallback, useMemo, useEffect } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Node,
  Edge,
  NodeTypes,
  OnNodesChange,
  OnEdgesChange,
  OnConnect,
} from 'reactflow';
import 'reactflow/dist/style.css';

import { WorkflowNode } from './WorkflowNode';
import { useWorkflowStore } from '../../store/workflowStore';
import { useActiveWorkflow } from '../../store/hooks';
import type { NodeDefinition, EdgeDefinition } from '../../../core/workflow/types';
import { generateEdgeId } from '../../../core/workflow/factories';

// Register custom node types
const nodeTypes: NodeTypes = {
  workflowNode: WorkflowNode,
};

/**
 * Convert manifest nodes to React Flow format
 */
function toReactFlowNodes(nodes: Record<string, NodeDefinition>): Node[] {
  return Object.values(nodes).map((node) => ({
    id: node.id,
    type: 'workflowNode',
    position: node.position,
    data: node,
    selected: false,
  }));
}

/**
 * Convert manifest edges to React Flow format
 */
function toReactFlowEdges(edges: EdgeDefinition[]): Edge[] {
  return edges.map((edge) => ({
    id: edge.id,
    source: edge.source,
    target: edge.target,
    sourceHandle: edge.sourceHandle,
    targetHandle: edge.targetHandle,
    type: 'smoothstep',
    animated: false,
  }));
}

/**
 * Main workflow canvas component
 * 
 * Responsibilities:
 * - Render workflow nodes and edges
 * - Handle drag/drop, selection, connection
 * - Sync changes to store
 */
export function WorkflowCanvas() {
  // Store hooks
  const { workflow, workflowId } = useActiveWorkflow();
  const syncNodesFromReactFlow = useWorkflowStore((s) => s.syncNodesFromReactFlow);
  const syncEdgesFromReactFlow = useWorkflowStore((s) => s.syncEdgesFromReactFlow);
  const addEdgeToStore = useWorkflowStore((s) => s.addEdge);
  const selectNode = useWorkflowStore((s) => s.selectNode);
  const selectedNodeId = useWorkflowStore((s) => s.selectedNodeId);

  // Convert manifest data to React Flow format
  const initialNodes = useMemo(() => 
    workflow ? toReactFlowNodes(workflow.nodes) : [],
    [workflow]
  );
  
  const initialEdges = useMemo(() => 
    workflow ? toReactFlowEdges(workflow.edges) : [],
    [workflow]
  );

  // React Flow state
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Sync initial data when workflow changes
  useEffect(() => {
    if (workflow) {
      setNodes(toReactFlowNodes(workflow.nodes));
      setEdges(toReactFlowEdges(workflow.edges));
    } else {
      setNodes([]);
      setEdges([]);
    }
  }, [workflow, setNodes, setEdges]);

  // Handle node changes (drag, select, etc.)
  const handleNodesChange: OnNodesChange = useCallback(
    (changes) => {
      onNodesChange(changes);
      
      // Sync position changes to store
      if (workflowId) {
        const positionChanges = changes.filter(
          (c) => c.type === 'position' && c.position
        );
        if (positionChanges.length > 0) {
          // Debounce this in production
          syncNodesFromReactFlow(workflowId, nodes);
        }
      }
    },
    [onNodesChange, workflowId, syncNodesFromReactFlow, nodes]
  );

  // Handle edge changes
  const handleEdgesChange: OnEdgesChange = useCallback(
    (changes) => {
      onEdgesChange(changes);
      
      // Sync to store
      if (workflowId) {
        syncEdgesFromReactFlow(workflowId, edges);
      }
    },
    [onEdgesChange, workflowId, syncEdgesFromReactFlow, edges]
  );

  // Handle new connections
  const handleConnect: OnConnect = useCallback(
    (connection: Connection) => {
      if (!workflowId || !connection.source || !connection.target) return;

      const newEdge: EdgeDefinition = {
        id: generateEdgeId(),
        source: connection.source,
        target: connection.target,
        sourceHandle: connection.sourceHandle || undefined,
        targetHandle: connection.targetHandle || undefined,
      };

      // Add to store
      addEdgeToStore(workflowId, newEdge);
      
      // Add to React Flow
      setEdges((eds) => addEdge({
        ...newEdge,
        type: 'smoothstep',
      }, eds));
    },
    [workflowId, addEdgeToStore, setEdges]
  );

  // Handle node selection
  const handleNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      selectNode(node.id);
    },
    [selectNode]
  );

  // Handle pane click (deselect)
  const handlePaneClick = useCallback(() => {
    selectNode(null);
  }, [selectNode]);

  // Update selection state on nodes
  const nodesWithSelection = useMemo(() => 
    nodes.map((node) => ({
      ...node,
      selected: node.id === selectedNodeId,
    })),
    [nodes, selectedNodeId]
  );

  // Empty state when no workflow selected
  if (!workflow) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-50">
        <div className="text-center text-gray-500">
          <p className="text-lg font-medium">No workflow selected</p>
          <p className="text-sm">Create a new workflow or select one from the sidebar</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full">
      <ReactFlow
        nodes={nodesWithSelection}
        edges={edges}
        onNodesChange={handleNodesChange}
        onEdgesChange={handleEdgesChange}
        onConnect={handleConnect}
        onNodeClick={handleNodeClick}
        onPaneClick={handlePaneClick}
        nodeTypes={nodeTypes}
        fitView
        snapToGrid
        snapGrid={[16, 16]}
        deleteKeyCode="Delete"
        multiSelectionKeyCode="Shift"
      >
        <Background color="#e5e7eb" gap={16} />
        <Controls />
        <MiniMap 
          nodeColor={(node) => {
            const metadata = node.data?.type ? 
              require('../../../core/workflow/nodes').getNodeMetadata(node.data.type) : 
              null;
            return metadata?.color || '#888';
          }}
          maskColor="rgba(0, 0, 0, 0.1)"
        />
      </ReactFlow>
    </div>
  );
}
```

---

### Milestone 4: Create Node Palette Component
**Date:** [YYYY-MM-DD]  
**Confidence:** [X/10]  
**Status:** 🔵 Not Started  
**Time Spent:** [X hours]  

#### File: `src/renderer/components/WorkflowCanvas/NodePalette.tsx`

```typescript
/**
 * @file NodePalette.tsx
 * @description Draggable node palette for adding nodes to canvas
 */

import React, { useState } from 'react';
import * as Icons from 'lucide-react';
import { 
  getAllCategories, 
  getNodesByCategory,
  type NodeCategory,
  type NodeMetadata,
} from '../../../core/workflow/nodes';
import { cn } from '../../utils/cn';

interface NodePaletteProps {
  onDragStart: (nodeType: string, nodeName: string) => void;
}

/**
 * Get Lucide icon by name
 */
function getIcon(iconName: string) {
  const Icon = (Icons as any)[iconName];
  return Icon || Icons.Box;
}

/**
 * Node palette for dragging nodes onto canvas
 */
export function NodePalette({ onDragStart }: NodePaletteProps) {
  const [expandedCategory, setExpandedCategory] = useState<NodeCategory | null>('triggers');
  const [searchQuery, setSearchQuery] = useState('');
  const categories = getAllCategories();

  const handleDragStart = (
    event: React.DragEvent,
    nodeType: string,
    nodeName: string
  ) => {
    event.dataTransfer.setData('application/reactflow', JSON.stringify({
      type: nodeType,
      name: nodeName,
    }));
    event.dataTransfer.effectAllowed = 'move';
    onDragStart(nodeType, nodeName);
  };

  const filteredCategories = categories.map((category) => ({
    ...category,
    nodes: getNodesByCategory(category.id).filter(
      (node) =>
        !searchQuery ||
        node.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        node.description.toLowerCase().includes(searchQuery.toLowerCase())
    ),
  }));

  return (
    <div className="w-64 h-full bg-white border-r border-gray-200 flex flex-col">
      {/* Search */}
      <div className="p-2 border-b border-gray-200">
        <div className="relative">
          <Icons.Search className="absolute left-2 top-2.5 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search nodes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Categories */}
      <div className="flex-1 overflow-y-auto">
        {filteredCategories.map((category) => {
          if (category.nodes.length === 0) return null;
          
          const CategoryIcon = getIcon(category.icon);
          const isExpanded = expandedCategory === category.id;

          return (
            <div key={category.id} className="border-b border-gray-100">
              {/* Category header */}
              <button
                onClick={() => setExpandedCategory(isExpanded ? null : category.id)}
                className="w-full px-3 py-2 flex items-center justify-between hover:bg-gray-50"
              >
                <div className="flex items-center gap-2">
                  <CategoryIcon className="w-4 h-4 text-gray-500" />
                  <span className="text-sm font-medium text-gray-700">
                    {category.name}
                  </span>
                  <span className="text-xs text-gray-400">
                    ({category.nodes.length})
                  </span>
                </div>
                <Icons.ChevronRight 
                  className={cn(
                    'w-4 h-4 text-gray-400 transition-transform',
                    isExpanded && 'rotate-90'
                  )} 
                />
              </button>

              {/* Node list */}
              {isExpanded && (
                <div className="pb-2">
                  {category.nodes.map((node) => (
                    <NodePaletteItem
                      key={node.type}
                      node={node}
                      onDragStart={handleDragStart}
                    />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Individual node item in palette
 */
function NodePaletteItem({
  node,
  onDragStart,
}: {
  node: NodeMetadata;
  onDragStart: (e: React.DragEvent, type: string, name: string) => void;
}) {
  const Icon = getIcon(node.icon);

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, node.type, node.name)}
      className={cn(
        'mx-2 px-2 py-1.5 flex items-center gap-2 rounded cursor-grab',
        'hover:bg-gray-100 active:cursor-grabbing',
        node.experimental && 'opacity-70'
      )}
    >
      <div className={cn('p-1 rounded', node.color)}>
        <Icon className="w-3 h-3 text-white" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-gray-700 truncate">{node.name}</p>
      </div>
      {node.experimental && (
        <Icons.FlaskConical className="w-3 h-3 text-orange-400" />
      )}
    </div>
  );
}
```

---

### Milestone 5: Implement Drop Handler
**Date:** [YYYY-MM-DD]  
**Confidence:** [X/10]  
**Status:** 🔵 Not Started  
**Time Spent:** [X hours]  

#### Update WorkflowCanvas with drop support

```typescript
// Add to WorkflowCanvas.tsx

import { useReactFlow } from 'reactflow';
import { createNode } from '../../../core/workflow/factories';
import type { NodeType } from '../../../core/workflow/types';

// Inside WorkflowCanvas component:

const reactFlowInstance = useReactFlow();
const addNodeToStore = useWorkflowStore((s) => s.addNode);

// Handle drop from palette
const handleDrop = useCallback(
  (event: React.DragEvent) => {
    event.preventDefault();

    if (!workflowId) return;

    const data = event.dataTransfer.getData('application/reactflow');
    if (!data) return;

    const { type, name } = JSON.parse(data);
    
    // Get drop position in flow coordinates
    const position = reactFlowInstance.screenToFlowPosition({
      x: event.clientX,
      y: event.clientY,
    });

    // Create new node
    const newNode = createNode(type as NodeType, name, position);
    
    // Add to store
    addNodeToStore(workflowId, newNode);
    
    // Add to React Flow
    setNodes((nds) => [
      ...nds,
      {
        id: newNode.id,
        type: 'workflowNode',
        position: newNode.position,
        data: newNode,
      },
    ]);

    // Select the new node
    selectNode(newNode.id);
  },
  [workflowId, reactFlowInstance, addNodeToStore, setNodes, selectNode]
);

const handleDragOver = useCallback((event: React.DragEvent) => {
  event.preventDefault();
  event.dataTransfer.dropEffect = 'move';
}, []);

// Add to ReactFlow component:
// onDrop={handleDrop}
// onDragOver={handleDragOver}
```

---

### Milestone 6: Create Index and Exports
**Date:** [YYYY-MM-DD]  
**Confidence:** [X/10]  
**Status:** 🔵 Not Started  
**Time Spent:** [X hours]  

#### File: `src/renderer/components/WorkflowCanvas/index.ts`

```typescript
/**
 * @file index.ts
 * @description Exports for WorkflowCanvas components
 */

export { WorkflowCanvas } from './WorkflowCanvas';
export { WorkflowNode } from './WorkflowNode';
export { NodePalette } from './NodePalette';
```

---

### Milestone 7: Write Tests
**Date:** [YYYY-MM-DD]  
**Confidence:** [X/10]  
**Status:** 🔵 Not Started  
**Time Spent:** [X hours]  

#### File: `tests/unit/components/WorkflowCanvas.test.tsx`

```typescript
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ReactFlowProvider } from 'reactflow';
import { WorkflowCanvas } from '../../../src/renderer/components/WorkflowCanvas/WorkflowCanvas';
import { WorkflowNode } from '../../../src/renderer/components/WorkflowCanvas/WorkflowNode';
import { useWorkflowStore } from '../../../src/renderer/store/workflowStore';
import { createNode, createWorkflow } from '../../../src/core/workflow/factories';

// Mock React Flow
vi.mock('reactflow', async () => {
  const actual = await vi.importActual('reactflow');
  return {
    ...actual,
    useReactFlow: () => ({
      screenToFlowPosition: ({ x, y }: { x: number; y: number }) => ({ x, y }),
    }),
  };
});

describe('WorkflowCanvas', () => {
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <ReactFlowProvider>{children}</ReactFlowProvider>
  );

  beforeEach(() => {
    useWorkflowStore.getState().resetManifest();
  });

  describe('Empty State', () => {
    it('should show empty state when no workflow selected', () => {
      render(<WorkflowCanvas />, { wrapper });
      
      expect(screen.getByText('No workflow selected')).toBeInTheDocument();
    });
  });

  describe('With Active Workflow', () => {
    it('should render canvas when workflow is selected', () => {
      const store = useWorkflowStore.getState();
      store.createWorkflow('Test Workflow');
      
      render(<WorkflowCanvas />, { wrapper });
      
      expect(screen.queryByText('No workflow selected')).not.toBeInTheDocument();
    });

    it('should render nodes from workflow', () => {
      const store = useWorkflowStore.getState();
      const workflowId = store.createWorkflow('Test Workflow');
      
      const node = createNode('anthropicCompletion', 'Claude');
      store.addNode(workflowId, node);
      
      render(<WorkflowCanvas />, { wrapper });
      
      // Node should be rendered
      expect(screen.getByText('Claude')).toBeInTheDocument();
    });
  });
});

describe('WorkflowNode', () => {
  const defaultProps = {
    id: 'test-node',
    data: createNode('anthropicCompletion', 'Test Claude'),
    selected: false,
    type: 'workflowNode',
    xPos: 0,
    yPos: 0,
    zIndex: 1,
    isConnectable: true,
    dragging: false,
  };

  it('should render node with name', () => {
    render(<WorkflowNode {...defaultProps} />);
    
    expect(screen.getByText('Test Claude')).toBeInTheDocument();
  });

  it('should render node with description', () => {
    render(<WorkflowNode {...defaultProps} />);
    
    expect(screen.getByText(/Anthropic Claude/i)).toBeInTheDocument();
  });

  it('should show selected state', () => {
    const { container } = render(
      <WorkflowNode {...defaultProps} selected={true} />
    );
    
    expect(container.firstChild).toHaveClass('border-blue-500');
  });

  it('should render unknown type gracefully', () => {
    const unknownProps = {
      ...defaultProps,
      data: { ...defaultProps.data, type: 'unknownType' as any },
    };
    
    render(<WorkflowNode {...unknownProps} />);
    
    expect(screen.getByText(/Unknown node type/)).toBeInTheDocument();
  });
});

describe('Node Selection', () => {
  it('should select node on click', () => {
    const store = useWorkflowStore.getState();
    const workflowId = store.createWorkflow('Test');
    const node = createNode('httpEndpoint', 'Trigger');
    store.addNode(workflowId, node);

    // Node click should call selectNode
    const selectNodeSpy = vi.spyOn(store, 'selectNode');
    
    // Simulate click would go here
    store.selectNode(node.id);
    
    expect(selectNodeSpy).toHaveBeenCalledWith(node.id);
    expect(store.selectedNodeId).toBe(node.id);
  });
});
```

---

### Milestone 8: Integration Testing
**Date:** [YYYY-MM-DD]  
**Confidence:** [X/10]  
**Status:** 🔵 Not Started  
**Time Spent:** [X hours]  

#### Manual Testing Checklist

| Test Scenario | Expected | Pass/Fail |
|---------------|----------|-----------|
| Empty state | Shows "No workflow selected" | |
| Create workflow | Canvas appears, empty | |
| Drag node from palette | Node appears at drop position | |
| Drag node on canvas | Position updates | |
| Connect two nodes | Edge appears | |
| Click node | Selection highlight, props panel updates | |
| Click canvas | Deselects node | |
| Delete node | Node and edges removed | |
| Undo (if implemented) | Node restored | |
| MiniMap | Shows node positions | |
| Zoom/Pan | Works smoothly | |

---

### Milestone 9: Human Review
**Date:** [YYYY-MM-DD]  
**Confidence:** [X/10]  
**Status:** 🔵 Not Started  
**Time Spent:** [X hours]  

#### Human Review

**Reviewer:** [Name]  
**Date:** [YYYY-MM-DD]  
**Duration:** [X minutes]  

**Review Focus:**
- Canvas renders correctly
- Interactions feel smooth
- Store sync works properly
- No visual glitches

**Feedback Received:**

**Positive:**
- ✅ [To be filled]

**Concerns:**
- ⚠️ [To be filled]

**Sign-off:**
- [ ] Canvas implementation approved
- [ ] Node rendering approved
- [ ] Store integration working
- [ ] Ready for Phase 1

**Final Confidence:** [X/10]

---

## Final Summary

### Deliverables
- [ ] `src/renderer/components/WorkflowCanvas/WorkflowCanvas.tsx` - Main canvas
- [ ] `src/renderer/components/WorkflowCanvas/WorkflowNode.tsx` - Node component
- [ ] `src/renderer/components/WorkflowCanvas/NodePalette.tsx` - Node palette
- [ ] `src/renderer/components/WorkflowCanvas/index.ts` - Exports
- [ ] `tests/unit/components/WorkflowCanvas.test.tsx` - Tests
- [ ] Test coverage >80%
- [ ] Human review completed

### What Was Accomplished
[To be filled upon completion]

### Lessons Learned
[To be filled upon completion]

### Technical Debt Created
- Edge styling simplified for MVP
- Keyboard shortcuts deferred

### Next Steps
- [ ] Phase 0 Complete! 🎉
- [ ] Proceed to Phase 1: Python Code Generation
- [ ] Connect canvas to code generation

---

## Appendix

### Key Files
- `src/renderer/components/WorkflowCanvas/` - Canvas components
- `tests/unit/components/WorkflowCanvas.test.tsx` - Tests

### Useful Commands
```bash
# Run canvas tests
npm test -- tests/unit/components/WorkflowCanvas

# Start dev server to test visually
npm run dev
```

### Related Tasks
- Task 0.4: Workflow Store (previous)
- Phase 1, Task 1.1: Python Code Generator (next)

---

## Phase 0 Completion Checklist

Upon completing Task 0.5, verify all Phase 0 deliverables:

| Task | Deliverable | Status |
|------|-------------|--------|
| 0.1 | Catalyst branding | [ ] |
| 0.2 | Manifest types & validation | [ ] |
| 0.3 | Node registry (55+ nodes) | [ ] |
| 0.4 | Workflow store | [ ] |
| 0.5 | Workflow canvas | [ ] |

**Phase 0 Status:** [ ] Complete / [ ] Needs Review

---

**Task Status:** 🔵 Not Started  
**Ready for:** Implementation  
**Last Updated:** 2025-12-18
