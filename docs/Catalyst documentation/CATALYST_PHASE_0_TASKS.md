# Catalyst Phase 0: Foundation Tasks
## Detailed Task Specifications

**Phase Duration:** ~1 week  
**Dependencies:** None (starting phase)  
**Goal:** Transform Rise codebase into Catalyst with new manifest schema and workflow canvas

---

## Overview

Phase 0 establishes the foundation for Catalyst by:
1. Rebranding from Rise to Catalyst
2. Creating the workflow manifest schema
3. Building the node type system
4. Setting up state management
5. Adapting the canvas for workflow nodes

---

## Task 0.1: Fork and Rebrand

**Duration:** 0.5 day  
**Confidence Target:** 9/10  
**Dependencies:** None

### Objective
Transform the Rise codebase into Catalyst with new branding.

### Activities

1. **Update package.json:**
```json
{
  "name": "catalyst",
  "productName": "Catalyst",
  "description": "Visual workflow builder that generates Python code",
  "version": "0.1.0"
}
```

2. **Update electron/main.ts:**
- Change window title to "Catalyst"
- Update about dialog text
- Modify any Rise-specific references

3. **Update src/renderer/App.tsx:**
- Change application title
- Update any branding components

4. **Update assets:**
- Create new app icon (can use placeholder initially)
- Update splash screen if present

5. **Search and replace:**
```bash
# Find all Rise references
grep -r "Rise" --include="*.ts" --include="*.tsx" --include="*.json"
# Replace appropriately (not automated - review each)
```

### Files Modified
- `package.json`
- `electron/main.ts`
- `src/renderer/App.tsx`
- `public/index.html`
- Any other files referencing "Rise"

### Success Criteria
- [ ] Application launches as "Catalyst"
- [ ] Window title shows "Catalyst"
- [ ] No "Rise" references in user-visible UI
- [ ] Package name is "catalyst"

### Human Review Checkpoint
Review branding changes before proceeding.

---

## Task 0.2: Manifest Schema Design

**Duration:** 1 day  
**Confidence Target:** 8/10  
**Dependencies:** Task 0.1

### Objective
Create TypeScript types and validation for the Catalyst workflow manifest format.

### File: `src/core/workflow/types.ts`

```typescript
/**
 * @file types.ts
 * @description Core type definitions for Catalyst workflow manifests
 * 
 * @architecture Phase 0, Task 0.2 - Manifest Schema Design
 * @created 2025-12-XX
 * @author AI (Cline) + Human Review
 * @confidence 8/10
 * 
 * @see CATALYST_SPECIFICATION.md Section 2 - Manifest Schema
 */

// ============================================================
// ENUMS
// ============================================================

/**
 * All supported node types in Catalyst
 * Organized by category for clarity
 */
export type NodeType =
  // Triggers
  | 'httpEndpoint'
  | 'webhookReceiver'
  | 'scheduledTask'
  | 'subworkflowTrigger'
  | 'websocketEndpoint'
  | 'queueConsumer'
  // LLM / AI
  | 'anthropicCompletion'
  | 'openaiCompletion'
  | 'groqCompletion'
  | 'azureOpenaiCompletion'
  | 'embeddingGenerate'
  | 'promptTemplate'
  | 'agenticToolCall'
  | 'llmRouter'
  // Data Sources
  | 'qdrantSearch'
  | 'qdrantUpsert'
  | 'qdrantScroll'
  | 'qdrantPayload'
  | 'postgresQuery'
  | 'directusQuery'
  | 'directusSDK'
  | 'graphqlQuery'
  | 'redisOperation'
  // HTTP / External
  | 'httpRequest'
  | 'gmailOperation'
  | 'webhookSend'
  | 'graphqlMutation'
  // Control Flow
  | 'condition'
  | 'switch'
  | 'loop'
  | 'parallel'
  | 'aggregate'
  | 'retry'
  | 'delay'
  | 'earlyReturn'
  // Transform
  | 'editFields'
  | 'javascriptFunction'
  | 'pythonFunction'
  | 'jsonTransform'
  | 'mapArray'
  | 'filterArray'
  | 'reduceArray'
  | 'splitArray'
  // Streaming
  | 'streamStart'
  | 'streamChunk'
  | 'streamEnd'
  | 'streamMerge'
  | 'streamBuffer'
  // Utilities
  | 'cryptoGenerate'
  | 'executionData'
  | 'globalVariable'
  | 'errorHandler'
  | 'log'
  | 'metrics'
  | 'rateLimit'
  | 'validate';

/**
 * Trigger types that can start a workflow
 */
export type TriggerType =
  | 'httpEndpoint'
  | 'webhookReceiver'
  | 'scheduledTask'
  | 'subworkflowTrigger'
  | 'websocketEndpoint'
  | 'queueConsumer';

/**
 * HTTP methods for endpoints
 */
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

/**
 * Authentication types
 */
export type AuthType = 'none' | 'bearer' | 'apiKey' | 'basic' | 'oauth2';

// ============================================================
// VALUE TYPES (for expressions)
// ============================================================

/**
 * Static value - literal value
 */
export interface StaticValue {
  type: 'static';
  value: string | number | boolean | object | null;
}

/**
 * Expression value - evaluated at runtime
 * Uses {{ expression }} syntax
 */
export interface ExpressionValue {
  type: 'expression';
  expression: string;
}

/**
 * Union of all value types
 */
export type ConfigValue = StaticValue | ExpressionValue | string | number | boolean;

// ============================================================
// NODE DEFINITIONS
// ============================================================

/**
 * Position on React Flow canvas
 */
export interface NodePosition {
  x: number;
  y: number;
}

/**
 * Cache configuration for a node
 */
export interface NodeCacheConfig {
  enabled: boolean;
  ttl: number;  // seconds
  key: string;  // expression for cache key
}

/**
 * Base node interface - all nodes extend this
 */
export interface BaseNode {
  id: string;
  type: NodeType;
  name: string;
  description?: string;
  position: NodePosition;
  config: Record<string, any>;
  timeout?: number;
  retries?: number;
  cache?: NodeCacheConfig;
  onError?: 'throw' | 'continue' | 'fallback';
  fallbackValue?: any;
}

/**
 * Union type for all node definitions
 */
export type NodeDefinition = BaseNode;

// ============================================================
// EDGE DEFINITIONS
// ============================================================

/**
 * Edge connecting two nodes
 */
export interface EdgeDefinition {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;
  targetHandle?: string;
  condition?: string;
}

// ============================================================
// TRIGGER DEFINITIONS
// ============================================================

/**
 * HTTP endpoint trigger config
 */
export interface HttpEndpointTriggerConfig {
  method: HttpMethod;
  path: string;
  authentication?: {
    type: AuthType;
    config?: Record<string, any>;
  };
  rateLimit?: {
    requests: number;
    window: string;
  };
  validation?: {
    body?: object;
    query?: object;
    headers?: object;
  };
}

/**
 * Scheduled task trigger config
 */
export interface ScheduledTriggerConfig {
  cron: string;
  timezone?: string;
  preventOverlap?: boolean;
}

/**
 * Webhook receiver trigger config
 */
export interface WebhookTriggerConfig {
  secret?: string;
  validation?: {
    headers?: Record<string, string>;
  };
}

/**
 * Union of trigger configs
 */
export type TriggerConfig =
  | HttpEndpointTriggerConfig
  | ScheduledTriggerConfig
  | WebhookTriggerConfig
  | Record<string, any>;

/**
 * Trigger definition
 */
export interface TriggerDefinition {
  type: TriggerType;
  config: TriggerConfig;
}

// ============================================================
// WORKFLOW DEFINITION
// ============================================================

/**
 * Input field definition
 */
export interface InputField {
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  required?: boolean;
  default?: any;
  description?: string;
  validation?: object;
}

/**
 * Output definition
 */
export interface OutputDefinition {
  type: 'json' | 'stream';
  format?: 'sse' | 'websocket' | 'ndjson';
  events?: string[];
  schema?: object;
}

/**
 * Execution configuration
 */
export interface ExecutionConfig {
  timeout?: number;
  retries?: number;
  retryDelay?: number;
  retryBackoff?: 'linear' | 'exponential';
}

/**
 * Complete workflow definition
 */
export interface WorkflowDefinition {
  id: string;
  name: string;
  description?: string;
  trigger: TriggerDefinition;
  input: Record<string, InputField>;
  output: OutputDefinition;
  nodes: Record<string, NodeDefinition>;
  edges: EdgeDefinition[];
  executionConfig?: ExecutionConfig;
}

// ============================================================
// PROJECT-LEVEL DEFINITIONS
// ============================================================

/**
 * Project metadata
 */
export interface ProjectMetadata {
  projectName: string;
  description?: string;
  author?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Runtime configuration
 */
export interface RuntimeConfig {
  runtime: 'python';
  pythonVersion: string;
  framework: 'fastapi';
  port: number;
  cors?: {
    origins: string[];
    methods: string[];
  };
}

/**
 * Secret definition
 */
export interface SecretDefinition {
  required: boolean;
  description?: string;
  default?: string;
}

/**
 * Top-level Catalyst manifest
 */
export interface CatalystManifest {
  schemaVersion: string;
  projectType: 'workflow';
  metadata: ProjectMetadata;
  config: RuntimeConfig;
  secrets: Record<string, SecretDefinition>;
  globalVariables: Record<string, any>;
  workflows: Record<string, WorkflowDefinition>;
  sharedNodes?: Record<string, NodeDefinition>;
}

// ============================================================
// FACTORY FUNCTIONS
// ============================================================

/**
 * Create empty Catalyst manifest
 */
export function createEmptyManifest(): CatalystManifest {
  return {
    schemaVersion: '1.0.0',
    projectType: 'workflow',
    metadata: {
      projectName: 'New Project',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    config: {
      runtime: 'python',
      pythonVersion: '3.11',
      framework: 'fastapi',
      port: 8000,
    },
    secrets: {},
    globalVariables: {},
    workflows: {},
  };
}

/**
 * Create new workflow definition
 */
export function createWorkflow(
  id: string,
  name: string,
  triggerType: TriggerType = 'httpEndpoint'
): WorkflowDefinition {
  return {
    id,
    name,
    trigger: {
      type: triggerType,
      config: triggerType === 'httpEndpoint' 
        ? { method: 'POST', path: `/api/${id}` }
        : {},
    },
    input: {},
    output: { type: 'json' },
    nodes: {},
    edges: [],
  };
}

/**
 * Generate unique node ID
 */
export function generateNodeId(type: NodeType): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 6);
  return `node_${type}_${timestamp}_${random}`;
}

/**
 * Generate unique edge ID
 */
export function generateEdgeId(): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 6);
  return `edge_${timestamp}_${random}`;
}

/**
 * Generate unique workflow ID
 */
export function generateWorkflowId(name: string): string {
  const slug = name.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
  const timestamp = Date.now();
  return `wf_${slug}_${timestamp}`;
}
```

### File: `src/core/workflow/validation.ts`

```typescript
/**
 * @file validation.ts
 * @description Zod schemas for validating Catalyst manifests
 */

import { z } from 'zod';

// Node type validation
const nodeTypeSchema = z.enum([
  'httpEndpoint', 'webhookReceiver', 'scheduledTask', /* ... all types ... */
]);

// Position schema
const positionSchema = z.object({
  x: z.number(),
  y: z.number(),
});

// Base node schema
const baseNodeSchema = z.object({
  id: z.string().min(1),
  type: nodeTypeSchema,
  name: z.string().min(1),
  description: z.string().optional(),
  position: positionSchema,
  config: z.record(z.any()),
  timeout: z.number().positive().optional(),
  retries: z.number().int().nonnegative().optional(),
  cache: z.object({
    enabled: z.boolean(),
    ttl: z.number().positive(),
    key: z.string(),
  }).optional(),
  onError: z.enum(['throw', 'continue', 'fallback']).optional(),
  fallbackValue: z.any().optional(),
});

// Edge schema
const edgeSchema = z.object({
  id: z.string().min(1),
  source: z.string().min(1),
  target: z.string().min(1),
  sourceHandle: z.string().optional(),
  targetHandle: z.string().optional(),
  condition: z.string().optional(),
});

// Full manifest schema
export const manifestSchema = z.object({
  schemaVersion: z.string(),
  projectType: z.literal('workflow'),
  metadata: z.object({
    projectName: z.string().min(1),
    description: z.string().optional(),
    author: z.string().optional(),
    createdAt: z.string(),
    updatedAt: z.string(),
  }),
  config: z.object({
    runtime: z.literal('python'),
    pythonVersion: z.string(),
    framework: z.literal('fastapi'),
    port: z.number().int().positive(),
    cors: z.object({
      origins: z.array(z.string()),
      methods: z.array(z.string()),
    }).optional(),
  }),
  secrets: z.record(z.object({
    required: z.boolean(),
    description: z.string().optional(),
  })),
  globalVariables: z.record(z.any()),
  workflows: z.record(z.any()), // Detailed workflow validation separate
  sharedNodes: z.record(baseNodeSchema).optional(),
});

/**
 * Validate a Catalyst manifest
 */
export function validateManifest(manifest: unknown) {
  const result = manifestSchema.safeParse(manifest);
  if (result.success) {
    return { success: true, errors: null, data: result.data };
  } else {
    return { success: false, errors: result.error, data: null };
  }
}
```

### Test File: `tests/core/workflow/validation.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import { validateManifest } from '../../../src/core/workflow/validation';
import { createEmptyManifest, createWorkflow } from '../../../src/core/workflow/types';

describe('Manifest Validation', () => {
  it('accepts valid empty manifest', () => {
    const manifest = createEmptyManifest();
    const result = validateManifest(manifest);
    expect(result.success).toBe(true);
  });
  
  it('accepts manifest with workflow', () => {
    const manifest = createEmptyManifest();
    manifest.workflows['test'] = createWorkflow('test', 'Test Workflow');
    const result = validateManifest(manifest);
    expect(result.success).toBe(true);
  });
  
  it('rejects manifest with invalid projectType', () => {
    const manifest = createEmptyManifest();
    (manifest as any).projectType = 'invalid';
    const result = validateManifest(manifest);
    expect(result.success).toBe(false);
  });
});
```

### Success Criteria
- [ ] All types compile without errors
- [ ] createEmptyManifest() returns valid manifest
- [ ] validateManifest() accepts valid manifests
- [ ] validateManifest() rejects invalid manifests
- [ ] All 55+ node types are defined
- [ ] Test coverage >90%

---

## Task 0.3: Node Type System

**Duration:** 1 day  
**Confidence Target:** 8/10  
**Dependencies:** Task 0.2

### Objective
Create the node registry with metadata, icons, and category organization.

### File Structure
```
src/core/workflow/nodes/
├── index.ts           # Main exports
├── registry.ts        # Node registry
├── categories.ts      # Category definitions
├── configs/           # Type-specific config schemas
│   ├── triggers.ts
│   ├── llm.ts
│   ├── data.ts
│   ├── control.ts
│   ├── transform.ts
│   ├── streaming.ts
│   └── utilities.ts
└── metadata.ts        # Icons, colors, descriptions
```

### File: `src/core/workflow/nodes/registry.ts`

```typescript
/**
 * @file registry.ts
 * @description Node type registry with metadata and config schemas
 */

import type { NodeType } from '../types';

/**
 * Node category for organization
 */
export type NodeCategory =
  | 'triggers'
  | 'llm'
  | 'data'
  | 'http'
  | 'control'
  | 'transform'
  | 'streaming'
  | 'utilities';

/**
 * Node metadata for UI display
 */
export interface NodeMetadata {
  type: NodeType;
  category: NodeCategory;
  name: string;
  description: string;
  icon: string;
  color: string;
  inputs: HandleDefinition[];
  outputs: HandleDefinition[];
  configSchema: object;
}

/**
 * Handle (port) definition
 */
export interface HandleDefinition {
  id: string;
  name: string;
  type: 'default' | 'conditional';
}

/**
 * Node registry - maps types to metadata
 */
export const NODE_REGISTRY: Record<NodeType, NodeMetadata> = {
  // Triggers
  httpEndpoint: {
    type: 'httpEndpoint',
    category: 'triggers',
    name: 'HTTP Endpoint',
    description: 'Receive HTTP requests',
    icon: 'Globe',
    color: 'bg-green-500',
    inputs: [],
    outputs: [{ id: 'output', name: 'Request', type: 'default' }],
    configSchema: {},
  },
  
  // LLM
  anthropicCompletion: {
    type: 'anthropicCompletion',
    category: 'llm',
    name: 'Claude',
    description: 'Anthropic Claude completion',
    icon: 'Sparkles',
    color: 'bg-purple-500',
    inputs: [{ id: 'input', name: 'Input', type: 'default' }],
    outputs: [{ id: 'output', name: 'Response', type: 'default' }],
    configSchema: {},
  },
  
  // ... define all 55+ nodes ...
};

/**
 * Get nodes by category
 */
export function getNodesByCategory(category: NodeCategory): NodeMetadata[] {
  return Object.values(NODE_REGISTRY).filter(n => n.category === category);
}

/**
 * Get node metadata
 */
export function getNodeMetadata(type: NodeType): NodeMetadata | undefined {
  return NODE_REGISTRY[type];
}

/**
 * Check if type is valid node type
 */
export function isValidNodeType(type: string): type is NodeType {
  return type in NODE_REGISTRY;
}
```

### Success Criteria
- [ ] All 55+ node types have metadata
- [ ] Categories properly organize nodes
- [ ] Config schemas defined for each node
- [ ] getNodesByCategory works correctly
- [ ] Icons and colors assigned to all nodes

---

## Task 0.4: Workflow Store

**Duration:** 0.5 day  
**Confidence Target:** 9/10  
**Dependencies:** Task 0.2, Task 0.3

### Objective
Create Zustand store for managing workflow state in the editor.

### File: `src/renderer/store/workflowStore.ts`

```typescript
/**
 * @file workflowStore.ts
 * @description Zustand store for workflow editor state
 */

import { create } from 'zustand';
import { devtools, subscribeWithSelector } from 'zustand/middleware';
import type { Node, Edge } from 'reactflow';
import type {
  CatalystManifest,
  WorkflowDefinition,
  NodeDefinition,
  EdgeDefinition,
} from '../../core/workflow/types';
import {
  createEmptyManifest,
  createWorkflow,
} from '../../core/workflow/types';

export interface WorkflowState {
  // Manifest state
  manifest: CatalystManifest;
  isDirty: boolean;
  
  // Editor state
  activeWorkflowId: string | null;
  selectedNodeId: string | null;
  
  // Actions - Manifest
  loadManifest: (manifest: CatalystManifest) => void;
  saveManifest: () => Promise<void>;
  resetManifest: () => void;
  
  // Actions - Workflows
  createWorkflow: (name: string) => string;
  updateWorkflow: (id: string, updates: Partial<WorkflowDefinition>) => void;
  deleteWorkflow: (id: string) => void;
  setActiveWorkflow: (id: string | null) => void;
  
  // Actions - Nodes
  addNode: (workflowId: string, node: NodeDefinition) => void;
  updateNode: (workflowId: string, nodeId: string, updates: Partial<NodeDefinition>) => void;
  deleteNode: (workflowId: string, nodeId: string) => void;
  selectNode: (nodeId: string | null) => void;
  
  // Actions - Edges
  addEdge: (workflowId: string, edge: EdgeDefinition) => void;
  deleteEdge: (workflowId: string, edgeId: string) => void;
  
  // React Flow sync
  syncNodesFromReactFlow: (workflowId: string, nodes: Node[]) => void;
  syncEdgesFromReactFlow: (workflowId: string, edges: Edge[]) => void;
  
  // Getters
  getActiveWorkflow: () => WorkflowDefinition | null;
  getWorkflowNodes: (workflowId: string) => NodeDefinition[];
  getWorkflowEdges: (workflowId: string) => EdgeDefinition[];
}

export const useWorkflowStore = create<WorkflowState>()(
  devtools(
    subscribeWithSelector((set, get) => ({
      manifest: createEmptyManifest(),
      isDirty: false,
      activeWorkflowId: null,
      selectedNodeId: null,
      
      loadManifest: (manifest) => set({ manifest, isDirty: false }),
      
      saveManifest: async () => {
        set({ isDirty: false });
      },
      
      resetManifest: () => set({
        manifest: createEmptyManifest(),
        isDirty: false,
        activeWorkflowId: null,
        selectedNodeId: null,
      }),
      
      createWorkflow: (name) => {
        const id = `wf_${name.toLowerCase().replace(/\s+/g, '_')}`;
        const workflow = createWorkflow(id, name);
        
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
      
      // ... additional methods (see full implementation in docs)
      
      getActiveWorkflow: () => {
        const state = get();
        if (!state.activeWorkflowId) return null;
        return state.manifest.workflows[state.activeWorkflowId] || null;
      },
      
      getWorkflowNodes: (workflowId) => {
        const state = get();
        const workflow = state.manifest.workflows[workflowId];
        return workflow ? Object.values(workflow.nodes) : [];
      },
      
      getWorkflowEdges: (workflowId) => {
        const state = get();
        const workflow = state.manifest.workflows[workflowId];
        return workflow ? workflow.edges : [];
      },
    })),
    { name: 'workflow-store' }
  )
);
```

### Success Criteria
- [ ] Store initializes with empty manifest
- [ ] CRUD operations work for workflows
- [ ] CRUD operations work for nodes
- [ ] CRUD operations work for edges
- [ ] isDirty flag tracks changes
- [ ] React Flow sync updates positions

---

## Task 0.5: Canvas Adaptation

**Duration:** 0.5 day  
**Confidence Target:** 9/10  
**Dependencies:** Task 0.3, Task 0.4

### Objective
Adapt the existing LogicCanvas to render workflow nodes.

### Activities
- [ ] Rename LogicCanvas → WorkflowCanvas
- [ ] Create new node component for workflow nodes
- [ ] Register node types with React Flow
- [ ] Update edge styling for workflows
- [ ] Connect to workflowStore

### File: `src/renderer/components/WorkflowCanvas/WorkflowCanvas.tsx`

```typescript
/**
 * @file WorkflowCanvas.tsx
 * @description Main canvas component for workflow editing
 */

import React, { useCallback } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
} from 'reactflow';
import 'reactflow/dist/style.css';

import { WorkflowNode } from './WorkflowNode';
import { useWorkflowStore } from '../../store/workflowStore';

const nodeTypes = {
  workflowNode: WorkflowNode,
};

export function WorkflowCanvas() {
  const { getActiveWorkflow, syncNodesFromReactFlow, syncEdgesFromReactFlow } = useWorkflowStore();
  const workflow = getActiveWorkflow();
  
  // Convert manifest nodes to React Flow format
  const initialNodes = workflow 
    ? Object.values(workflow.nodes).map(node => ({
        id: node.id,
        type: 'workflowNode',
        position: node.position,
        data: node,
      }))
    : [];
    
  const initialEdges = workflow?.edges || [];
  
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  
  const onConnect = useCallback((params: Connection) => {
    setEdges((eds) => addEdge(params, eds));
  }, [setEdges]);
  
  return (
    <div className="w-full h-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        fitView
      >
        <Background />
        <Controls />
        <MiniMap />
      </ReactFlow>
    </div>
  );
}
```

### Success Criteria
- [ ] Canvas renders workflow nodes
- [ ] Nodes can be dragged and repositioned
- [ ] Edges can be connected between nodes
- [ ] Node selection updates properties panel
- [ ] Changes sync to workflowStore

---

## Phase 0 Deliverables Summary

| Task | Deliverable | Success Indicator |
|------|-------------|-------------------|
| 0.1 | Catalyst branding | App launches as "Catalyst" |
| 0.2 | Manifest types | Types compile, validation works |
| 0.3 | Node registry | All 55+ nodes registered |
| 0.4 | Workflow store | State management functional |
| 0.5 | Workflow canvas | Nodes render and connect |

---

## Human Review Checkpoint

**After completing Phase 0:**

Review focus:
- Schema design completeness
- Editor renders workflow nodes correctly
- All node types defined
- Canvas interaction smooth

---

**Next Phase:** [CATALYST_PHASE_1_TASKS.md](./CATALYST_PHASE_1_TASKS.md)
