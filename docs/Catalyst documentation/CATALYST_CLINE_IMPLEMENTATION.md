# Catalyst Implementation Plan for Cline
## Detailed Task Specifications for AI-Assisted Development

**Document Version:** 1.0  
**Created:** December 2025  
**Purpose:** Provide Cline with detailed implementation guidance for each task

---

## Overview

This document contains detailed task specifications for implementing Catalyst, a visual workflow builder that generates Python/FastAPI code. Each task includes:

- Clear objectives and success criteria
- File locations and dependencies
- Code examples and patterns to follow
- Testing requirements
- Human review checkpoints

**Development Methodology:**
- Read CATALYST_SPECIFICATION.md first for full context
- Complete tasks in order within each phase
- Achieve confidence ≥8/10 before moving on
- Request human review at checkpoints
- Write tests alongside implementation

---

## Phase 0: Foundation

### Task 0.1: Fork and Rebrand

**Duration:** 0.5 day  
**Confidence Target:** 9/10  
**Dependencies:** None

#### Objective
Transform the Rise codebase into Catalyst with new branding.

#### Activities

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

#### Files Modified
- `package.json`
- `electron/main.ts`
- `src/renderer/App.tsx`
- `public/index.html`
- Any other files referencing "Rise"

#### Success Criteria
- [ ] Application launches as "Catalyst"
- [ ] Window title shows "Catalyst"
- [ ] No "Rise" references in user-visible UI
- [ ] Package name is "catalyst"

#### Human Review Checkpoint
Review branding changes before proceeding.

---

### Task 0.2: Manifest Schema Design

**Duration:** 1 day  
**Confidence Target:** 8/10  
**Dependencies:** Task 0.1

#### Objective
Create TypeScript types and validation for the Catalyst workflow manifest format.

#### File: `src/core/workflow/types.ts`

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
 * In practice, we use BaseNode with type-specific config validation
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
  source: string;        // Source node ID
  target: string;        // Target node ID
  sourceHandle?: string; // For nodes with multiple outputs
  targetHandle?: string; // For nodes with multiple inputs
  condition?: string;    // Expression for conditional edges
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
    window: string;  // "1m", "1h", etc.
  };
  validation?: {
    body?: object;   // JSON Schema
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
  validation?: object;  // JSON Schema
}

/**
 * Output definition
 */
export interface OutputDefinition {
  type: 'json' | 'stream';
  format?: 'sse' | 'websocket' | 'ndjson';
  events?: string[];  // For streaming
  schema?: object;    // JSON Schema
}

/**
 * Execution configuration
 */
export interface ExecutionConfig {
  timeout?: number;      // ms
  retries?: number;
  retryDelay?: number;   // ms
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

#### File: `src/core/workflow/validation.ts`

```typescript
/**
 * @file validation.ts
 * @description Zod schemas for validating Catalyst manifests
 */

import { z } from 'zod';
import type { NodeType, TriggerType } from './types';

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

// Trigger schema
const triggerSchema = z.object({
  type: z.enum([
    'httpEndpoint', 'webhookReceiver', 'scheduledTask',
    'subworkflowTrigger', 'websocketEndpoint', 'queueConsumer',
  ]),
  config: z.record(z.any()),
});

// Workflow schema
const workflowSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  description: z.string().optional(),
  trigger: triggerSchema,
  input: z.record(z.object({
    type: z.enum(['string', 'number', 'boolean', 'object', 'array']),
    required: z.boolean().optional(),
    default: z.any().optional(),
    description: z.string().optional(),
  })),
  output: z.object({
    type: z.enum(['json', 'stream']),
    format: z.enum(['sse', 'websocket', 'ndjson']).optional(),
    events: z.array(z.string()).optional(),
  }),
  nodes: z.record(baseNodeSchema),
  edges: z.array(edgeSchema),
  executionConfig: z.object({
    timeout: z.number().positive().optional(),
    retries: z.number().int().nonnegative().optional(),
    retryDelay: z.number().positive().optional(),
  }).optional(),
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
  workflows: z.record(workflowSchema),
  sharedNodes: z.record(baseNodeSchema).optional(),
});

/**
 * Validate a Catalyst manifest
 */
export function validateManifest(manifest: unknown): {
  success: boolean;
  errors: z.ZodError | null;
  data: z.infer<typeof manifestSchema> | null;
} {
  const result = manifestSchema.safeParse(manifest);
  
  if (result.success) {
    return { success: true, errors: null, data: result.data };
  } else {
    return { success: false, errors: result.error, data: null };
  }
}

/**
 * Validate a single workflow
 */
export function validateWorkflow(workflow: unknown): {
  success: boolean;
  errors: z.ZodError | null;
} {
  const result = workflowSchema.safeParse(workflow);
  return { success: result.success, errors: result.success ? null : result.error };
}
```

#### Test File: `tests/core/workflow/validation.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import { validateManifest, validateWorkflow } from '../../../src/core/workflow/validation';
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
  
  it('rejects workflow with invalid node type', () => {
    const workflow = createWorkflow('test', 'Test');
    workflow.nodes['node1'] = {
      id: 'node1',
      type: 'invalidType' as any,
      name: 'Invalid',
      position: { x: 0, y: 0 },
      config: {},
    };
    const result = validateWorkflow(workflow);
    expect(result.success).toBe(false);
  });
});
```

#### Success Criteria
- [ ] All types compile without errors
- [ ] createEmptyManifest() returns valid manifest
- [ ] validateManifest() accepts valid manifests
- [ ] validateManifest() rejects invalid manifests
- [ ] All 55+ node types are defined
- [ ] Test coverage >90%

---

### Task 0.3: Node Type System

**Duration:** 1 day  
**Confidence Target:** 8/10  
**Dependencies:** Task 0.2

#### Objective
Create the node registry with metadata, icons, and category organization.

#### File Structure
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

#### File: `src/core/workflow/nodes/registry.ts`

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
  icon: string;  // Lucide icon name
  color: string; // Tailwind color class
  inputs: HandleDefinition[];
  outputs: HandleDefinition[];
  configSchema: object;  // JSON Schema for config
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
    configSchema: { /* JSON Schema */ },
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
    configSchema: { /* JSON Schema */ },
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

#### Success Criteria
- [ ] All 55+ node types have metadata
- [ ] Categories properly organize nodes
- [ ] Config schemas defined for each node
- [ ] getNodesByCategory works correctly
- [ ] Icons and colors assigned to all nodes

---

### Task 0.4: Workflow Store

**Duration:** 0.5 day  
**Confidence Target:** 9/10  
**Dependencies:** Task 0.2, Task 0.3

#### Objective
Create Zustand store for managing workflow state in the editor.

#### File: `src/renderer/store/workflowStore.ts`

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
  generateNodeId,
  generateEdgeId,
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
  
  // Actions - React Flow sync
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
      // Initial state
      manifest: createEmptyManifest(),
      isDirty: false,
      activeWorkflowId: null,
      selectedNodeId: null,
      
      // Manifest actions
      loadManifest: (manifest) => set({ manifest, isDirty: false }),
      
      saveManifest: async () => {
        // Will call IPC to save
        set({ isDirty: false });
      },
      
      resetManifest: () => set({
        manifest: createEmptyManifest(),
        isDirty: false,
        activeWorkflowId: null,
        selectedNodeId: null,
      }),
      
      // Workflow actions
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
      
      deleteWorkflow: (id) => {
        set((state) => {
          const { [id]: deleted, ...remaining } = state.manifest.workflows;
          return {
            manifest: {
              ...state.manifest,
              workflows: remaining,
            },
            activeWorkflowId: state.activeWorkflowId === id ? null : state.activeWorkflowId,
            isDirty: true,
          };
        });
      },
      
      setActiveWorkflow: (id) => set({ activeWorkflowId: id, selectedNodeId: null }),
      
      // Node actions
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
                    [nodeId]: { ...workflow.nodes[nodeId], ...updates },
                  },
                },
              },
            },
            isDirty: true,
          };
        });
      },
      
      deleteNode: (workflowId, nodeId) => {
        set((state) => {
          const workflow = state.manifest.workflows[workflowId];
          if (!workflow) return state;
          
          const { [nodeId]: deleted, ...remainingNodes } = workflow.nodes;
          const remainingEdges = workflow.edges.filter(
            e => e.source !== nodeId && e.target !== nodeId
          );
          
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
            selectedNodeId: state.selectedNodeId === nodeId ? null : state.selectedNodeId,
            isDirty: true,
          };
        });
      },
      
      selectNode: (nodeId) => set({ selectedNodeId: nodeId }),
      
      // Edge actions
      addEdge: (workflowId, edge) => {
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
                  edges: [...workflow.edges, edge],
                },
              },
            },
            isDirty: true,
          };
        });
      },
      
      deleteEdge: (workflowId, edgeId) => {
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
                  edges: workflow.edges.filter(e => e.id !== edgeId),
                },
              },
            },
            isDirty: true,
          };
        });
      },
      
      // React Flow sync
      syncNodesFromReactFlow: (workflowId, nodes) => {
        set((state) => {
          const workflow = state.manifest.workflows[workflowId];
          if (!workflow) return state;
          
          const updatedNodes = { ...workflow.nodes };
          for (const rfNode of nodes) {
            if (updatedNodes[rfNode.id]) {
              updatedNodes[rfNode.id] = {
                ...updatedNodes[rfNode.id],
                position: rfNode.position,
              };
            }
          }
          
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
      
      syncEdgesFromReactFlow: (workflowId, edges) => {
        set((state) => {
          const workflow = state.manifest.workflows[workflowId];
          if (!workflow) return state;
          
          const convertedEdges: EdgeDefinition[] = edges.map(e => ({
            id: e.id,
            source: e.source,
            target: e.target,
            sourceHandle: e.sourceHandle || undefined,
            targetHandle: e.targetHandle || undefined,
          }));
          
          return {
            manifest: {
              ...state.manifest,
              workflows: {
                ...state.manifest.workflows,
                [workflowId]: {
                  ...workflow,
                  edges: convertedEdges,
                },
              },
            },
            isDirty: true,
          };
        });
      },
      
      // Getters
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

#### Success Criteria
- [ ] Store initializes with empty manifest
- [ ] CRUD operations work for workflows
- [ ] CRUD operations work for nodes
- [ ] CRUD operations work for edges
- [ ] isDirty flag tracks changes
- [ ] React Flow sync updates positions

---

### Task 0.5: Canvas Adaptation

**Duration:** 0.5 day  
**Confidence Target:** 9/10  
**Dependencies:** Task 0.3, Task 0.4

#### Objective
Adapt the existing LogicCanvas to render workflow nodes.

#### Activities
- [ ] Rename LogicCanvas → WorkflowCanvas
- [ ] Create new node component for workflow nodes
- [ ] Register node types with React Flow
- [ ] Update edge styling for workflows
- [ ] Connect to workflowStore

*(Detailed implementation similar to existing LogicCanvas pattern)*

---

## Phase 1: Core Runtime

### Task 1.1: Python Code Generator Core

**Duration:** 2 days  
**Confidence Target:** 7/10  
**Dependencies:** Phase 0 complete

#### Objective
Create the main code generation engine that converts workflow manifests to Python code.

#### File Structure
```
src/core/codegen/python/
├── index.ts
├── PythonWorkflowGenerator.ts
├── WorkflowAnalyzer.ts
├── ImportBuilder.ts
├── NodeCodeGenerator.ts
├── CodeAssembler.ts
└── templates/
    ├── main.py.ts
    ├── workflow.py.ts
    ├── config.py.ts
    └── requirements.txt.ts
```

*(Detailed implementation follows ReactCodeGenerator pattern from Rise)*

---

## Remaining Phases

*(Tasks 1.2-1.5 and Phases 2-6 follow similar detailed patterns)*

---

## Human Review Checkpoints

| Phase | Checkpoint | Review Focus |
|-------|------------|--------------|
| 0 | After Task 0.2 | Schema design completeness |
| 0 | After Task 0.5 | Editor renders workflow nodes |
| 1 | After Task 1.1 | Generated Python is valid |
| 1 | After Task 1.3 | Local runtime works |
| 2 | After LLM nodes | Streaming works correctly |
| 3 | After data nodes | Qdrant integration correct |
| 4 | After control flow | Parallel execution works |
| 6 | Before deploy | Visual Hive workflows run |

---

## Quality Standards

### Code Quality
- TypeScript strict mode
- ESLint/Prettier formatting
- 1 comment per 3-5 lines
- File headers with @architecture tags

### Testing
- Unit tests for all generators
- Integration tests for code generation
- Manual testing for runtime
- Performance benchmarks

### Documentation
- Update README for Catalyst
- Document all node types
- Create getting started guide
- Document expression syntax

---

**End of Implementation Plan**
