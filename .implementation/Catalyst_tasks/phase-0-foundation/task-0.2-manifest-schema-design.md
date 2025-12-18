# Task 0.2: Manifest Schema Design

**Phase:** Phase 0 - Foundation  
**Duration Estimate:** 1 day  
**Actual Duration:** [To be filled when complete]  
**Status:** 🔵 Not Started  
**Assigned:** AI + Human Review  
**Started:** [YYYY-MM-DD]  
**Completed:** [YYYY-MM-DD]  

---

## Task Overview

### Objective
Create TypeScript types and validation for the Catalyst workflow manifest format.

The manifest schema is the core data structure that defines all workflows, nodes, edges, and configurations in a Catalyst project. This schema will be the source of truth for the entire application, driving code generation, UI rendering, and state management.

### Success Criteria
- [ ] All types compile without errors
- [ ] createEmptyManifest() returns valid manifest
- [ ] validateManifest() accepts valid manifests
- [ ] validateManifest() rejects invalid manifests
- [ ] All 55+ node types are defined
- [ ] Test coverage >90%
- [ ] Human review completed

### References
- CATALYST_PHASE_0_TASKS.md - Task 0.2
- CATALYST_SPECIFICATION.md - Section 2: Manifest Schema
- docs/RISE documentation/COMPONENT_SCHEMA.md - For reference patterns

### Dependencies
- Task 0.1: Fork and Rebrand (completed)

---

## Milestones

### Milestone 1: Design Core Type Definitions
**Date:** [YYYY-MM-DD]  
**Confidence:** [X/10]  
**Status:** 🔵 Not Started  
**Time Spent:** [X hours]  

#### Activities
- [ ] Create directory structure for workflow types
- [ ] Define NodeType enum with all 55+ types
- [ ] Define TriggerType enum
- [ ] Define base value types (Static, Expression)
- [ ] Define HTTP and Auth types

#### Directory Structure
```
src/core/workflow/
├── index.ts           # Main exports
├── types.ts           # Core type definitions
├── validation.ts      # Zod schemas and validators
└── factories.ts       # Factory functions
```

#### Design Decisions

| Decision | Options Considered | Choice Made | Rationale | Confidence |
|----------|-------------------|-------------|-----------|------------|
| Type organization | Single file, Multiple files, By category | Single types.ts with categories | Easier to maintain and reference | 8/10 |
| Node type definition | Union types, Enums, String literals | String literal union | TypeScript best practice, good autocomplete | 9/10 |
| Validation library | Zod, Yup, io-ts | Zod | Type inference, performance, ecosystem | 9/10 |

#### Node Type Categories
The 55+ node types organized by category:

**Triggers (6 types):**
- httpEndpoint, webhookReceiver, scheduledTask
- subworkflowTrigger, websocketEndpoint, queueConsumer

**LLM / AI (9 types):**
- anthropicCompletion, openaiCompletion, groqCompletion
- azureOpenaiCompletion, embeddingGenerate, promptTemplate
- agenticToolCall, llmRouter

**Data Sources (10 types):**
- qdrantSearch, qdrantUpsert, qdrantScroll, qdrantPayload
- postgresQuery, directusQuery, directusSDK
- graphqlQuery, redisOperation

**HTTP / External (5 types):**
- httpRequest, gmailOperation, webhookSend, graphqlMutation

**Control Flow (8 types):**
- condition, switch, loop, parallel
- aggregate, retry, delay, earlyReturn

**Transform (8 types):**
- editFields, javascriptFunction, pythonFunction, jsonTransform
- mapArray, filterArray, reduceArray, splitArray

**Streaming (5 types):**
- streamStart, streamChunk, streamEnd, streamMerge, streamBuffer

**Utilities (9 types):**
- cryptoGenerate, executionData, globalVariable, errorHandler
- log, metrics, rateLimit, validate

---

### Milestone 2: Implement Type Definitions
**Date:** [YYYY-MM-DD]  
**Confidence:** [X/10]  
**Status:** 🔵 Not Started  
**Time Spent:** [X hours]  

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
// ENUMS AND LITERALS
// ============================================================

/**
 * All supported node types in Catalyst (55+ types)
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
```

#### Files Created
- `src/core/workflow/types.ts` - Core type definitions

---

### Milestone 3: Implement Factory Functions
**Date:** [YYYY-MM-DD]  
**Confidence:** [X/10]  
**Status:** 🔵 Not Started  
**Time Spent:** [X hours]  

#### Activities
- [ ] Create factory for empty manifest
- [ ] Create factory for new workflow
- [ ] Create ID generators
- [ ] Add helper utilities

#### File: `src/core/workflow/factories.ts`

```typescript
/**
 * @file factories.ts
 * @description Factory functions for creating Catalyst workflow objects
 */

import type {
  CatalystManifest,
  WorkflowDefinition,
  NodeDefinition,
  NodeType,
  TriggerType,
} from './types';

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

/**
 * Create a new node with default values
 */
export function createNode(
  type: NodeType,
  name: string,
  position: { x: number; y: number } = { x: 0, y: 0 }
): NodeDefinition {
  return {
    id: generateNodeId(type),
    type,
    name,
    position,
    config: {},
  };
}

/**
 * Deep clone a manifest (for immutable updates)
 */
export function cloneManifest(manifest: CatalystManifest): CatalystManifest {
  return JSON.parse(JSON.stringify(manifest));
}
```

#### Files Created
- `src/core/workflow/factories.ts` - Factory functions

---

### Milestone 4: Implement Validation with Zod
**Date:** [YYYY-MM-DD]  
**Confidence:** [X/10]  
**Status:** 🔵 Not Started  
**Time Spent:** [X hours]  

#### Activities
- [ ] Define Zod schemas for all types
- [ ] Create validation functions
- [ ] Add error message formatting
- [ ] Create type guards

#### File: `src/core/workflow/validation.ts`

```typescript
/**
 * @file validation.ts
 * @description Zod schemas for validating Catalyst manifests
 */

import { z } from 'zod';

// ============================================================
// BASE SCHEMAS
// ============================================================

// Node type validation
const nodeTypeSchema = z.enum([
  // Triggers
  'httpEndpoint', 'webhookReceiver', 'scheduledTask',
  'subworkflowTrigger', 'websocketEndpoint', 'queueConsumer',
  // LLM
  'anthropicCompletion', 'openaiCompletion', 'groqCompletion',
  'azureOpenaiCompletion', 'embeddingGenerate', 'promptTemplate',
  'agenticToolCall', 'llmRouter',
  // Data
  'qdrantSearch', 'qdrantUpsert', 'qdrantScroll', 'qdrantPayload',
  'postgresQuery', 'directusQuery', 'directusSDK', 'graphqlQuery',
  'redisOperation',
  // HTTP
  'httpRequest', 'gmailOperation', 'webhookSend', 'graphqlMutation',
  // Control Flow
  'condition', 'switch', 'loop', 'parallel', 'aggregate', 'retry',
  'delay', 'earlyReturn',
  // Transform
  'editFields', 'javascriptFunction', 'pythonFunction', 'jsonTransform',
  'mapArray', 'filterArray', 'reduceArray', 'splitArray',
  // Streaming
  'streamStart', 'streamChunk', 'streamEnd', 'streamMerge', 'streamBuffer',
  // Utilities
  'cryptoGenerate', 'executionData', 'globalVariable', 'errorHandler',
  'log', 'metrics', 'rateLimit', 'validate',
]);

const triggerTypeSchema = z.enum([
  'httpEndpoint', 'webhookReceiver', 'scheduledTask',
  'subworkflowTrigger', 'websocketEndpoint', 'queueConsumer',
]);

// Position schema
const positionSchema = z.object({
  x: z.number(),
  y: z.number(),
});

// Cache config schema
const cacheConfigSchema = z.object({
  enabled: z.boolean(),
  ttl: z.number().positive(),
  key: z.string(),
});

// ============================================================
// NODE SCHEMA
// ============================================================

const baseNodeSchema = z.object({
  id: z.string().min(1),
  type: nodeTypeSchema,
  name: z.string().min(1),
  description: z.string().optional(),
  position: positionSchema,
  config: z.record(z.any()),
  timeout: z.number().positive().optional(),
  retries: z.number().int().nonnegative().optional(),
  cache: cacheConfigSchema.optional(),
  onError: z.enum(['throw', 'continue', 'fallback']).optional(),
  fallbackValue: z.any().optional(),
});

// ============================================================
// EDGE SCHEMA
// ============================================================

const edgeSchema = z.object({
  id: z.string().min(1),
  source: z.string().min(1),
  target: z.string().min(1),
  sourceHandle: z.string().optional(),
  targetHandle: z.string().optional(),
  condition: z.string().optional(),
});

// ============================================================
// TRIGGER SCHEMA
// ============================================================

const triggerSchema = z.object({
  type: triggerTypeSchema,
  config: z.record(z.any()),
});

// ============================================================
// WORKFLOW SCHEMA
// ============================================================

const inputFieldSchema = z.object({
  type: z.enum(['string', 'number', 'boolean', 'object', 'array']),
  required: z.boolean().optional(),
  default: z.any().optional(),
  description: z.string().optional(),
  validation: z.object({}).passthrough().optional(),
});

const outputSchema = z.object({
  type: z.enum(['json', 'stream']),
  format: z.enum(['sse', 'websocket', 'ndjson']).optional(),
  events: z.array(z.string()).optional(),
  schema: z.object({}).passthrough().optional(),
});

const executionConfigSchema = z.object({
  timeout: z.number().positive().optional(),
  retries: z.number().int().nonnegative().optional(),
  retryDelay: z.number().positive().optional(),
  retryBackoff: z.enum(['linear', 'exponential']).optional(),
});

const workflowSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  description: z.string().optional(),
  trigger: triggerSchema,
  input: z.record(inputFieldSchema),
  output: outputSchema,
  nodes: z.record(baseNodeSchema),
  edges: z.array(edgeSchema),
  executionConfig: executionConfigSchema.optional(),
});

// ============================================================
// MANIFEST SCHEMA
// ============================================================

const metadataSchema = z.object({
  projectName: z.string().min(1),
  description: z.string().optional(),
  author: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

const runtimeConfigSchema = z.object({
  runtime: z.literal('python'),
  pythonVersion: z.string(),
  framework: z.literal('fastapi'),
  port: z.number().int().positive(),
  cors: z.object({
    origins: z.array(z.string()),
    methods: z.array(z.string()),
  }).optional(),
});

const secretSchema = z.object({
  required: z.boolean(),
  description: z.string().optional(),
  default: z.string().optional(),
});

export const manifestSchema = z.object({
  schemaVersion: z.string(),
  projectType: z.literal('workflow'),
  metadata: metadataSchema,
  config: runtimeConfigSchema,
  secrets: z.record(secretSchema),
  globalVariables: z.record(z.any()),
  workflows: z.record(workflowSchema),
  sharedNodes: z.record(baseNodeSchema).optional(),
});

// ============================================================
// VALIDATION FUNCTIONS
// ============================================================

export interface ValidationResult<T> {
  success: boolean;
  data: T | null;
  errors: z.ZodError | null;
}

/**
 * Validate a Catalyst manifest
 */
export function validateManifest(manifest: unknown): ValidationResult<z.infer<typeof manifestSchema>> {
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
export function validateWorkflow(workflow: unknown): ValidationResult<z.infer<typeof workflowSchema>> {
  const result = workflowSchema.safeParse(workflow);
  if (result.success) {
    return { success: true, errors: null, data: result.data };
  } else {
    return { success: false, errors: result.error, data: null };
  }
}

/**
 * Validate a single node
 */
export function validateNode(node: unknown): ValidationResult<z.infer<typeof baseNodeSchema>> {
  const result = baseNodeSchema.safeParse(node);
  if (result.success) {
    return { success: true, errors: null, data: result.data };
  } else {
    return { success: false, errors: result.error, data: null };
  }
}

/**
 * Format validation errors for display
 */
export function formatValidationErrors(errors: z.ZodError): string[] {
  return errors.errors.map(err => {
    const path = err.path.join('.');
    return `${path}: ${err.message}`;
  });
}

// ============================================================
// TYPE GUARDS
// ============================================================

/**
 * Check if a string is a valid NodeType
 */
export function isValidNodeType(type: string): type is z.infer<typeof nodeTypeSchema> {
  return nodeTypeSchema.safeParse(type).success;
}

/**
 * Check if a string is a valid TriggerType
 */
export function isValidTriggerType(type: string): type is z.infer<typeof triggerTypeSchema> {
  return triggerTypeSchema.safeParse(type).success;
}
```

#### Files Created
- `src/core/workflow/validation.ts` - Zod schemas and validation functions

---

### Milestone 5: Write Unit Tests
**Date:** [YYYY-MM-DD]  
**Confidence:** [X/10]  
**Status:** 🔵 Not Started  
**Time Spent:** [X hours]  

#### Activities
- [ ] Write tests for factory functions
- [ ] Write tests for validation
- [ ] Write tests for edge cases
- [ ] Achieve >90% coverage

#### File: `tests/unit/workflow/types.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import { 
  createEmptyManifest, 
  createWorkflow, 
  generateNodeId,
  generateWorkflowId,
  createNode,
} from '../../../src/core/workflow/factories';
import {
  validateManifest,
  validateWorkflow,
  validateNode,
  isValidNodeType,
  isValidTriggerType,
  formatValidationErrors,
} from '../../../src/core/workflow/validation';

describe('Factory Functions', () => {
  describe('createEmptyManifest', () => {
    it('should return a valid manifest structure', () => {
      const manifest = createEmptyManifest();
      
      expect(manifest.schemaVersion).toBe('1.0.0');
      expect(manifest.projectType).toBe('workflow');
      expect(manifest.metadata.projectName).toBe('New Project');
      expect(manifest.config.runtime).toBe('python');
      expect(manifest.config.framework).toBe('fastapi');
      expect(manifest.workflows).toEqual({});
    });

    it('should pass validation', () => {
      const manifest = createEmptyManifest();
      const result = validateManifest(manifest);
      expect(result.success).toBe(true);
    });
  });

  describe('createWorkflow', () => {
    it('should create workflow with HTTP endpoint trigger', () => {
      const workflow = createWorkflow('test_wf', 'Test Workflow');
      
      expect(workflow.id).toBe('test_wf');
      expect(workflow.name).toBe('Test Workflow');
      expect(workflow.trigger.type).toBe('httpEndpoint');
      expect(workflow.output.type).toBe('json');
      expect(workflow.nodes).toEqual({});
      expect(workflow.edges).toEqual([]);
    });

    it('should create workflow with scheduled trigger', () => {
      const workflow = createWorkflow('cron_wf', 'Cron Workflow', 'scheduledTask');
      
      expect(workflow.trigger.type).toBe('scheduledTask');
    });
  });

  describe('generateNodeId', () => {
    it('should generate unique IDs with type prefix', () => {
      const id1 = generateNodeId('anthropicCompletion');
      const id2 = generateNodeId('anthropicCompletion');
      
      expect(id1).toMatch(/^node_anthropicCompletion_\d+_[a-z0-9]+$/);
      expect(id1).not.toBe(id2);
    });
  });

  describe('generateWorkflowId', () => {
    it('should generate slug from name', () => {
      const id = generateWorkflowId('My Test Workflow');
      expect(id).toMatch(/^wf_my_test_workflow_\d+$/);
    });

    it('should sanitize special characters', () => {
      const id = generateWorkflowId('Test @#$ Workflow!');
      expect(id).toMatch(/^wf_test__workflow_\d+$/);
    });
  });

  describe('createNode', () => {
    it('should create node with default position', () => {
      const node = createNode('anthropicCompletion', 'Claude Node');
      
      expect(node.type).toBe('anthropicCompletion');
      expect(node.name).toBe('Claude Node');
      expect(node.position).toEqual({ x: 0, y: 0 });
      expect(node.config).toEqual({});
    });

    it('should create node with custom position', () => {
      const node = createNode('condition', 'If Check', { x: 100, y: 200 });
      
      expect(node.position).toEqual({ x: 100, y: 200 });
    });
  });
});

describe('Manifest Validation', () => {
  describe('validateManifest', () => {
    it('should accept valid empty manifest', () => {
      const manifest = createEmptyManifest();
      const result = validateManifest(manifest);
      expect(result.success).toBe(true);
      expect(result.data).not.toBeNull();
    });

    it('should accept manifest with workflow', () => {
      const manifest = createEmptyManifest();
      manifest.workflows['test'] = createWorkflow('test', 'Test Workflow');
      const result = validateManifest(manifest);
      expect(result.success).toBe(true);
    });

    it('should reject manifest with invalid projectType', () => {
      const manifest = createEmptyManifest();
      (manifest as any).projectType = 'invalid';
      const result = validateManifest(manifest);
      expect(result.success).toBe(false);
      expect(result.errors).not.toBeNull();
    });

    it('should reject manifest missing required fields', () => {
      const result = validateManifest({});
      expect(result.success).toBe(false);
    });

    it('should reject manifest with invalid runtime', () => {
      const manifest = createEmptyManifest();
      (manifest.config as any).runtime = 'nodejs';
      const result = validateManifest(manifest);
      expect(result.success).toBe(false);
    });
  });

  describe('validateWorkflow', () => {
    it('should accept valid workflow', () => {
      const workflow = createWorkflow('test', 'Test');
      const result = validateWorkflow(workflow);
      expect(result.success).toBe(true);
    });

    it('should reject workflow without id', () => {
      const workflow = createWorkflow('test', 'Test');
      (workflow as any).id = '';
      const result = validateWorkflow(workflow);
      expect(result.success).toBe(false);
    });
  });

  describe('validateNode', () => {
    it('should accept valid node', () => {
      const node = createNode('httpRequest', 'API Call');
      const result = validateNode(node);
      expect(result.success).toBe(true);
    });

    it('should reject node with invalid type', () => {
      const node = createNode('httpRequest', 'API Call');
      (node as any).type = 'invalidType';
      const result = validateNode(node);
      expect(result.success).toBe(false);
    });
  });
});

describe('Type Guards', () => {
  describe('isValidNodeType', () => {
    it('should return true for valid node types', () => {
      expect(isValidNodeType('anthropicCompletion')).toBe(true);
      expect(isValidNodeType('httpEndpoint')).toBe(true);
      expect(isValidNodeType('condition')).toBe(true);
    });

    it('should return false for invalid node types', () => {
      expect(isValidNodeType('invalidType')).toBe(false);
      expect(isValidNodeType('')).toBe(false);
      expect(isValidNodeType('ANTHROPICCOMPLETION')).toBe(false);
    });
  });

  describe('isValidTriggerType', () => {
    it('should return true for valid trigger types', () => {
      expect(isValidTriggerType('httpEndpoint')).toBe(true);
      expect(isValidTriggerType('scheduledTask')).toBe(true);
    });

    it('should return false for non-trigger node types', () => {
      expect(isValidTriggerType('anthropicCompletion')).toBe(false);
      expect(isValidTriggerType('condition')).toBe(false);
    });
  });
});

describe('Error Formatting', () => {
  it('should format validation errors for display', () => {
    const manifest = createEmptyManifest();
    (manifest as any).projectType = 'invalid';
    (manifest.metadata as any).projectName = '';
    
    const result = validateManifest(manifest);
    if (!result.success && result.errors) {
      const formatted = formatValidationErrors(result.errors);
      expect(formatted.length).toBeGreaterThan(0);
      expect(formatted.some(e => e.includes('projectType'))).toBe(true);
    }
  });
});
```

#### Test Coverage Targets
| File | Target | Notes |
|------|--------|-------|
| types.ts | N/A | Type definitions only |
| factories.ts | 95% | All factory functions |
| validation.ts | 90% | All validators and guards |

#### Test Commands
```bash
# Run workflow tests
npm test -- tests/unit/workflow/

# Run with coverage
npm test -- --coverage tests/unit/workflow/
```

---

### Milestone 6: Create Index and Exports
**Date:** [YYYY-MM-DD]  
**Confidence:** [X/10]  
**Status:** 🔵 Not Started  
**Time Spent:** [X hours]  

#### File: `src/core/workflow/index.ts`

```typescript
/**
 * @file index.ts
 * @description Main exports for Catalyst workflow system
 */

// Type exports
export type {
  NodeType,
  TriggerType,
  HttpMethod,
  AuthType,
  StaticValue,
  ExpressionValue,
  ConfigValue,
  NodePosition,
  NodeCacheConfig,
  BaseNode,
  NodeDefinition,
  EdgeDefinition,
  HttpEndpointTriggerConfig,
  ScheduledTriggerConfig,
  WebhookTriggerConfig,
  TriggerConfig,
  TriggerDefinition,
  InputField,
  OutputDefinition,
  ExecutionConfig,
  WorkflowDefinition,
  ProjectMetadata,
  RuntimeConfig,
  SecretDefinition,
  CatalystManifest,
} from './types';

// Factory function exports
export {
  createEmptyManifest,
  createWorkflow,
  generateNodeId,
  generateEdgeId,
  generateWorkflowId,
  createNode,
  cloneManifest,
} from './factories';

// Validation exports
export {
  manifestSchema,
  validateManifest,
  validateWorkflow,
  validateNode,
  isValidNodeType,
  isValidTriggerType,
  formatValidationErrors,
} from './validation';
export type { ValidationResult } from './validation';
```

---

### Milestone 7: Human Review
**Date:** [YYYY-MM-DD]  
**Confidence:** [X/10]  
**Status:** 🔵 Not Started  
**Time Spent:** [X hours]  

#### Human Review

**Reviewer:** [Name]  
**Date:** [YYYY-MM-DD]  
**Duration:** [X minutes]  

**Review Focus:**
- Type definitions completeness (all 55+ nodes)
- Schema design decisions
- Validation coverage
- Test coverage

**Feedback Received:**

**Positive:**
- ✅ [To be filled]

**Concerns:**
- ⚠️ [To be filled]

**Sign-off:**
- [ ] Type definitions approved
- [ ] Validation logic approved
- [ ] Tests sufficient
- [ ] Ready for Task 0.3

**Final Confidence:** [X/10]

---

## Final Summary

### Deliverables
- [ ] `src/core/workflow/types.ts` - Core type definitions
- [ ] `src/core/workflow/factories.ts` - Factory functions
- [ ] `src/core/workflow/validation.ts` - Zod schemas
- [ ] `src/core/workflow/index.ts` - Main exports
- [ ] `tests/unit/workflow/types.test.ts` - Unit tests
- [ ] Test coverage >90%
- [ ] Human review completed

### What Was Accomplished
[To be filled upon completion]

### Lessons Learned
[To be filled upon completion]

### Technical Debt Created
- None expected

### Next Steps
- [ ] Proceed to Task 0.3: Node Type System
- [ ] Create node registry
- [ ] Add node metadata and icons

---

## Appendix

### Key Files
- `src/core/workflow/types.ts` - All TypeScript types
- `src/core/workflow/factories.ts` - Object creation
- `src/core/workflow/validation.ts` - Zod validation
- `tests/unit/workflow/types.test.ts` - Test suite

### Useful Commands
```bash
# Type check
npx tsc --noEmit

# Run tests
npm test -- tests/unit/workflow/

# Run with coverage
npm test -- --coverage
```

### Related Tasks
- Task 0.1: Fork and Rebrand (previous)
- Task 0.3: Node Type System (next)

---

**Task Status:** 🔵 Not Started  
**Ready for:** Implementation  
**Last Updated:** 2025-12-18
