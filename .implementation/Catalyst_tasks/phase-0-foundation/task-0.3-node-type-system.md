# Task 0.3: Node Type System

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
Create the node registry with metadata, icons, and category organization for all 55+ node types.

The node type system provides the UI and configuration metadata for each node type. This includes display information (name, description, icon, color), structural information (inputs, outputs), and configuration schemas. The registry will be used by the canvas to render nodes and by the properties panel to show configuration options.

### Success Criteria
- [ ] All 55+ node types have metadata defined
- [ ] Categories properly organize nodes
- [ ] Config schemas defined for each node type
- [ ] getNodesByCategory() works correctly
- [ ] Icons and colors assigned to all nodes
- [ ] Handle definitions for all nodes
- [ ] Test coverage >90%
- [ ] Human review completed

### References
- CATALYST_PHASE_0_TASKS.md - Task 0.3
- CATALYST_SPECIFICATION.md - Section 3: Node Types
- Task 0.2 - For NodeType definitions

### Dependencies
- Task 0.2: Manifest Schema Design (completed)

---

## Milestones

### Milestone 1: Design Node Registry Structure
**Date:** [YYYY-MM-DD]  
**Confidence:** [X/10]  
**Status:** 🔵 Not Started  
**Time Spent:** [X hours]  

#### Activities
- [ ] Design NodeMetadata interface
- [ ] Design HandleDefinition interface
- [ ] Define NodeCategory type
- [ ] Plan directory structure

#### Directory Structure
```
src/core/workflow/nodes/
├── index.ts           # Main exports
├── registry.ts        # Node registry and lookup functions
├── categories.ts      # Category definitions and metadata
├── metadata.ts        # Icon, color, description mappings
└── configs/           # Type-specific config schemas
    ├── triggers.ts    # Trigger node configs
    ├── llm.ts         # LLM/AI node configs
    ├── data.ts        # Data source node configs
    ├── http.ts        # HTTP/external node configs
    ├── control.ts     # Control flow node configs
    ├── transform.ts   # Transform node configs
    ├── streaming.ts   # Streaming node configs
    └── utilities.ts   # Utility node configs
```

#### Design Decisions

| Decision | Options Considered | Choice Made | Rationale | Confidence |
|----------|-------------------|-------------|-----------|------------|
| Registry structure | Object, Map, Array | Object (Record<NodeType, Metadata>) | Fast lookup by type, TypeScript-friendly | 9/10 |
| Config schemas | Inline, Separate files, Zod | Separate files by category | Organization and maintainability | 8/10 |
| Icon system | Lucide icons, Custom SVGs, Icon font | Lucide icons | Already in project, comprehensive | 9/10 |

---

### Milestone 2: Implement Core Registry Types
**Date:** [YYYY-MM-DD]  
**Confidence:** [X/10]  
**Status:** 🔵 Not Started  
**Time Spent:** [X hours]  

#### File: `src/core/workflow/nodes/registry.ts`

```typescript
/**
 * @file registry.ts
 * @description Node type registry with metadata and config schemas
 * 
 * @architecture Phase 0, Task 0.3 - Node Type System
 * @created 2025-12-XX
 * @author AI (Cline) + Human Review
 * @confidence 8/10
 * 
 * @see CATALYST_SPECIFICATION.md Section 3 - Node Types
 */

import type { NodeType } from '../types';

// ============================================================
// CATEGORY DEFINITIONS
// ============================================================

/**
 * Node category for organization in UI
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
 * Category metadata for UI display
 */
export interface CategoryMetadata {
  id: NodeCategory;
  name: string;
  description: string;
  icon: string;
  color: string;
}

/**
 * All category definitions
 */
export const CATEGORIES: Record<NodeCategory, CategoryMetadata> = {
  triggers: {
    id: 'triggers',
    name: 'Triggers',
    description: 'Entry points for workflows',
    icon: 'Zap',
    color: 'green',
  },
  llm: {
    id: 'llm',
    name: 'AI / LLM',
    description: 'AI and language model operations',
    icon: 'Sparkles',
    color: 'purple',
  },
  data: {
    id: 'data',
    name: 'Data Sources',
    description: 'Database and data store operations',
    icon: 'Database',
    color: 'blue',
  },
  http: {
    id: 'http',
    name: 'HTTP / External',
    description: 'HTTP requests and external services',
    icon: 'Globe',
    color: 'cyan',
  },
  control: {
    id: 'control',
    name: 'Control Flow',
    description: 'Branching, loops, and flow control',
    icon: 'GitBranch',
    color: 'orange',
  },
  transform: {
    id: 'transform',
    name: 'Transform',
    description: 'Data transformation and manipulation',
    icon: 'Shuffle',
    color: 'yellow',
  },
  streaming: {
    id: 'streaming',
    name: 'Streaming',
    description: 'Real-time streaming operations',
    icon: 'Radio',
    color: 'pink',
  },
  utilities: {
    id: 'utilities',
    name: 'Utilities',
    description: 'Logging, validation, and helpers',
    icon: 'Wrench',
    color: 'gray',
  },
};

// ============================================================
// HANDLE DEFINITIONS
// ============================================================

/**
 * Handle (port) definition for node connections
 */
export interface HandleDefinition {
  id: string;
  name: string;
  type: 'default' | 'conditional' | 'error' | 'stream';
  position?: 'top' | 'bottom' | 'left' | 'right';
}

// ============================================================
// NODE METADATA
// ============================================================

/**
 * Complete metadata for a node type
 */
export interface NodeMetadata {
  /** Node type identifier */
  type: NodeType;
  /** Category for organization */
  category: NodeCategory;
  /** Display name */
  name: string;
  /** Short description */
  description: string;
  /** Lucide icon name */
  icon: string;
  /** Tailwind color class (e.g., 'bg-purple-500') */
  color: string;
  /** Input handles */
  inputs: HandleDefinition[];
  /** Output handles */
  outputs: HandleDefinition[];
  /** Default configuration values */
  defaultConfig: Record<string, any>;
  /** Zod schema for config validation (as object for reference) */
  configSchema: object;
  /** Documentation URL (optional) */
  docsUrl?: string;
  /** Whether node supports streaming output */
  supportsStreaming?: boolean;
  /** Whether node is experimental */
  experimental?: boolean;
}
```

#### Files Created
- `src/core/workflow/nodes/registry.ts` - Core registry types

---

### Milestone 3: Implement Trigger Node Metadata
**Date:** [YYYY-MM-DD]  
**Confidence:** [X/10]  
**Status:** 🔵 Not Started  
**Time Spent:** [X hours]  

#### File: `src/core/workflow/nodes/configs/triggers.ts`

```typescript
/**
 * @file triggers.ts
 * @description Metadata for trigger node types
 */

import type { NodeMetadata } from '../registry';

export const TRIGGER_NODES: NodeMetadata[] = [
  {
    type: 'httpEndpoint',
    category: 'triggers',
    name: 'HTTP Endpoint',
    description: 'Receive HTTP requests and start workflow',
    icon: 'Globe',
    color: 'bg-green-500',
    inputs: [],
    outputs: [
      { id: 'output', name: 'Request', type: 'default' },
    ],
    defaultConfig: {
      method: 'POST',
      path: '/api/endpoint',
      authentication: { type: 'none' },
    },
    configSchema: {
      method: { type: 'select', options: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'] },
      path: { type: 'string', placeholder: '/api/endpoint' },
      authentication: {
        type: 'object',
        properties: {
          type: { type: 'select', options: ['none', 'bearer', 'apiKey', 'basic'] },
        },
      },
    },
  },
  {
    type: 'webhookReceiver',
    category: 'triggers',
    name: 'Webhook Receiver',
    description: 'Receive webhook payloads from external services',
    icon: 'Webhook',
    color: 'bg-green-500',
    inputs: [],
    outputs: [
      { id: 'output', name: 'Payload', type: 'default' },
    ],
    defaultConfig: {
      secret: '',
    },
    configSchema: {
      secret: { type: 'password', label: 'Webhook Secret' },
    },
  },
  {
    type: 'scheduledTask',
    category: 'triggers',
    name: 'Scheduled Task',
    description: 'Run workflow on a schedule (cron)',
    icon: 'Clock',
    color: 'bg-green-500',
    inputs: [],
    outputs: [
      { id: 'output', name: 'Trigger', type: 'default' },
    ],
    defaultConfig: {
      cron: '0 * * * *',
      timezone: 'UTC',
    },
    configSchema: {
      cron: { type: 'string', label: 'Cron Expression' },
      timezone: { type: 'string', label: 'Timezone' },
    },
  },
  {
    type: 'subworkflowTrigger',
    category: 'triggers',
    name: 'Subworkflow Trigger',
    description: 'Trigger from another workflow',
    icon: 'GitMerge',
    color: 'bg-green-500',
    inputs: [],
    outputs: [
      { id: 'output', name: 'Input', type: 'default' },
    ],
    defaultConfig: {},
    configSchema: {},
  },
  {
    type: 'websocketEndpoint',
    category: 'triggers',
    name: 'WebSocket Endpoint',
    description: 'Handle WebSocket connections',
    icon: 'Radio',
    color: 'bg-green-500',
    inputs: [],
    outputs: [
      { id: 'output', name: 'Message', type: 'default' },
    ],
    defaultConfig: {
      path: '/ws',
    },
    configSchema: {
      path: { type: 'string', label: 'WebSocket Path' },
    },
    supportsStreaming: true,
  },
  {
    type: 'queueConsumer',
    category: 'triggers',
    name: 'Queue Consumer',
    description: 'Consume messages from a queue',
    icon: 'Inbox',
    color: 'bg-green-500',
    inputs: [],
    outputs: [
      { id: 'output', name: 'Message', type: 'default' },
    ],
    defaultConfig: {
      queueName: '',
    },
    configSchema: {
      queueName: { type: 'string', label: 'Queue Name' },
    },
  },
];
```

---

### Milestone 4: Implement LLM Node Metadata
**Date:** [YYYY-MM-DD]  
**Confidence:** [X/10]  
**Status:** 🔵 Not Started  
**Time Spent:** [X hours]  

#### File: `src/core/workflow/nodes/configs/llm.ts`

```typescript
/**
 * @file llm.ts
 * @description Metadata for LLM/AI node types
 */

import type { NodeMetadata } from '../registry';

export const LLM_NODES: NodeMetadata[] = [
  {
    type: 'anthropicCompletion',
    category: 'llm',
    name: 'Claude',
    description: 'Anthropic Claude completion',
    icon: 'Sparkles',
    color: 'bg-purple-500',
    inputs: [
      { id: 'input', name: 'Input', type: 'default' },
    ],
    outputs: [
      { id: 'output', name: 'Response', type: 'default' },
      { id: 'stream', name: 'Stream', type: 'stream' },
    ],
    defaultConfig: {
      model: 'claude-3-5-sonnet-20241022',
      maxTokens: 4096,
      temperature: 0.7,
      systemPrompt: '',
    },
    configSchema: {
      model: {
        type: 'select',
        options: [
          'claude-3-5-sonnet-20241022',
          'claude-3-5-haiku-20241022',
          'claude-3-opus-20240229',
        ],
      },
      maxTokens: { type: 'number', min: 1, max: 8192 },
      temperature: { type: 'number', min: 0, max: 1, step: 0.1 },
      systemPrompt: { type: 'textarea', label: 'System Prompt' },
    },
    supportsStreaming: true,
  },
  {
    type: 'openaiCompletion',
    category: 'llm',
    name: 'OpenAI',
    description: 'OpenAI GPT completion',
    icon: 'Bot',
    color: 'bg-purple-500',
    inputs: [
      { id: 'input', name: 'Input', type: 'default' },
    ],
    outputs: [
      { id: 'output', name: 'Response', type: 'default' },
      { id: 'stream', name: 'Stream', type: 'stream' },
    ],
    defaultConfig: {
      model: 'gpt-4-turbo-preview',
      maxTokens: 4096,
      temperature: 0.7,
    },
    configSchema: {
      model: {
        type: 'select',
        options: ['gpt-4-turbo-preview', 'gpt-4', 'gpt-3.5-turbo'],
      },
      maxTokens: { type: 'number', min: 1, max: 8192 },
      temperature: { type: 'number', min: 0, max: 2, step: 0.1 },
    },
    supportsStreaming: true,
  },
  {
    type: 'groqCompletion',
    category: 'llm',
    name: 'Groq',
    description: 'Groq fast inference',
    icon: 'Zap',
    color: 'bg-purple-500',
    inputs: [
      { id: 'input', name: 'Input', type: 'default' },
    ],
    outputs: [
      { id: 'output', name: 'Response', type: 'default' },
    ],
    defaultConfig: {
      model: 'mixtral-8x7b-32768',
      maxTokens: 4096,
    },
    configSchema: {
      model: {
        type: 'select',
        options: ['mixtral-8x7b-32768', 'llama2-70b-4096'],
      },
      maxTokens: { type: 'number', min: 1, max: 32768 },
    },
    supportsStreaming: true,
  },
  {
    type: 'azureOpenaiCompletion',
    category: 'llm',
    name: 'Azure OpenAI',
    description: 'Azure-hosted OpenAI models',
    icon: 'Cloud',
    color: 'bg-purple-500',
    inputs: [
      { id: 'input', name: 'Input', type: 'default' },
    ],
    outputs: [
      { id: 'output', name: 'Response', type: 'default' },
    ],
    defaultConfig: {
      deploymentName: '',
      apiVersion: '2024-02-15-preview',
    },
    configSchema: {
      deploymentName: { type: 'string', label: 'Deployment Name' },
      apiVersion: { type: 'string', label: 'API Version' },
    },
    supportsStreaming: true,
  },
  {
    type: 'embeddingGenerate',
    category: 'llm',
    name: 'Generate Embedding',
    description: 'Generate vector embeddings from text',
    icon: 'Hash',
    color: 'bg-purple-500',
    inputs: [
      { id: 'input', name: 'Text', type: 'default' },
    ],
    outputs: [
      { id: 'output', name: 'Embedding', type: 'default' },
    ],
    defaultConfig: {
      model: 'text-embedding-3-small',
      provider: 'openai',
    },
    configSchema: {
      provider: { type: 'select', options: ['openai', 'cohere', 'voyage'] },
      model: { type: 'string', label: 'Model' },
    },
  },
  {
    type: 'promptTemplate',
    category: 'llm',
    name: 'Prompt Template',
    description: 'Build prompts with variables',
    icon: 'FileText',
    color: 'bg-purple-500',
    inputs: [
      { id: 'input', name: 'Variables', type: 'default' },
    ],
    outputs: [
      { id: 'output', name: 'Prompt', type: 'default' },
    ],
    defaultConfig: {
      template: '',
    },
    configSchema: {
      template: { type: 'code', language: 'text', label: 'Template' },
    },
  },
  {
    type: 'agenticToolCall',
    category: 'llm',
    name: 'Agentic Tool Call',
    description: 'Let AI call tools/functions',
    icon: 'Wrench',
    color: 'bg-purple-500',
    inputs: [
      { id: 'input', name: 'Input', type: 'default' },
    ],
    outputs: [
      { id: 'output', name: 'Result', type: 'default' },
      { id: 'tool_call', name: 'Tool Call', type: 'conditional' },
    ],
    defaultConfig: {
      tools: [],
      maxIterations: 5,
    },
    configSchema: {
      tools: { type: 'array', itemType: 'tool_definition' },
      maxIterations: { type: 'number', min: 1, max: 20 },
    },
    experimental: true,
  },
  {
    type: 'llmRouter',
    category: 'llm',
    name: 'LLM Router',
    description: 'Route to different LLMs based on criteria',
    icon: 'GitBranch',
    color: 'bg-purple-500',
    inputs: [
      { id: 'input', name: 'Input', type: 'default' },
    ],
    outputs: [
      { id: 'output', name: 'Response', type: 'default' },
    ],
    defaultConfig: {
      strategy: 'cost',
      fallback: 'anthropic',
    },
    configSchema: {
      strategy: { type: 'select', options: ['cost', 'speed', 'quality'] },
      fallback: { type: 'string', label: 'Fallback Provider' },
    },
    experimental: true,
  },
];
```

---

### Milestone 5: Implement Data Source Node Metadata
**Date:** [YYYY-MM-DD]  
**Confidence:** [X/10]  
**Status:** 🔵 Not Started  
**Time Spent:** [X hours]  

#### File: `src/core/workflow/nodes/configs/data.ts`

```typescript
/**
 * @file data.ts
 * @description Metadata for data source node types
 */

import type { NodeMetadata } from '../registry';

export const DATA_NODES: NodeMetadata[] = [
  {
    type: 'qdrantSearch',
    category: 'data',
    name: 'Qdrant Search',
    description: 'Vector similarity search in Qdrant',
    icon: 'Search',
    color: 'bg-blue-500',
    inputs: [
      { id: 'input', name: 'Query', type: 'default' },
    ],
    outputs: [
      { id: 'output', name: 'Results', type: 'default' },
    ],
    defaultConfig: {
      collection: '',
      limit: 10,
    },
    configSchema: {
      collection: { type: 'string', label: 'Collection Name' },
      limit: { type: 'number', min: 1, max: 100 },
    },
  },
  {
    type: 'qdrantUpsert',
    category: 'data',
    name: 'Qdrant Upsert',
    description: 'Insert or update vectors in Qdrant',
    icon: 'Upload',
    color: 'bg-blue-500',
    inputs: [
      { id: 'input', name: 'Data', type: 'default' },
    ],
    outputs: [
      { id: 'output', name: 'Result', type: 'default' },
    ],
    defaultConfig: {
      collection: '',
    },
    configSchema: {
      collection: { type: 'string', label: 'Collection Name' },
    },
  },
  {
    type: 'qdrantScroll',
    category: 'data',
    name: 'Qdrant Scroll',
    description: 'Scroll through Qdrant collection',
    icon: 'List',
    color: 'bg-blue-500',
    inputs: [
      { id: 'input', name: 'Input', type: 'default' },
    ],
    outputs: [
      { id: 'output', name: 'Points', type: 'default' },
    ],
    defaultConfig: {
      collection: '',
      limit: 100,
    },
    configSchema: {
      collection: { type: 'string', label: 'Collection Name' },
      limit: { type: 'number', min: 1, max: 1000 },
    },
  },
  {
    type: 'qdrantPayload',
    category: 'data',
    name: 'Qdrant Payload',
    description: 'Update payload in Qdrant',
    icon: 'Edit',
    color: 'bg-blue-500',
    inputs: [
      { id: 'input', name: 'Input', type: 'default' },
    ],
    outputs: [
      { id: 'output', name: 'Result', type: 'default' },
    ],
    defaultConfig: {
      collection: '',
      operation: 'set',
    },
    configSchema: {
      collection: { type: 'string', label: 'Collection Name' },
      operation: { type: 'select', options: ['set', 'overwrite', 'delete'] },
    },
  },
  {
    type: 'postgresQuery',
    category: 'data',
    name: 'PostgreSQL',
    description: 'Execute PostgreSQL queries',
    icon: 'Database',
    color: 'bg-blue-500',
    inputs: [
      { id: 'input', name: 'Input', type: 'default' },
    ],
    outputs: [
      { id: 'output', name: 'Results', type: 'default' },
    ],
    defaultConfig: {
      query: '',
      connection: '',
    },
    configSchema: {
      query: { type: 'code', language: 'sql', label: 'SQL Query' },
      connection: { type: 'connection', connectionType: 'postgres' },
    },
  },
  {
    type: 'directusQuery',
    category: 'data',
    name: 'Directus Query',
    description: 'Query Directus collections',
    icon: 'Folder',
    color: 'bg-blue-500',
    inputs: [
      { id: 'input', name: 'Input', type: 'default' },
    ],
    outputs: [
      { id: 'output', name: 'Results', type: 'default' },
    ],
    defaultConfig: {
      collection: '',
      operation: 'read',
    },
    configSchema: {
      collection: { type: 'string', label: 'Collection' },
      operation: { type: 'select', options: ['create', 'read', 'update', 'delete'] },
    },
  },
  {
    type: 'directusSDK',
    category: 'data',
    name: 'Directus SDK',
    description: 'Use Directus SDK methods',
    icon: 'Code',
    color: 'bg-blue-500',
    inputs: [
      { id: 'input', name: 'Input', type: 'default' },
    ],
    outputs: [
      { id: 'output', name: 'Result', type: 'default' },
    ],
    defaultConfig: {
      method: '',
    },
    configSchema: {
      method: { type: 'string', label: 'SDK Method' },
    },
  },
  {
    type: 'graphqlQuery',
    category: 'data',
    name: 'GraphQL Query',
    description: 'Execute GraphQL queries',
    icon: 'Circle',
    color: 'bg-blue-500',
    inputs: [
      { id: 'input', name: 'Variables', type: 'default' },
    ],
    outputs: [
      { id: 'output', name: 'Data', type: 'default' },
    ],
    defaultConfig: {
      query: '',
      endpoint: '',
    },
    configSchema: {
      query: { type: 'code', language: 'graphql', label: 'Query' },
      endpoint: { type: 'string', label: 'Endpoint URL' },
    },
  },
  {
    type: 'redisOperation',
    category: 'data',
    name: 'Redis',
    description: 'Redis cache operations',
    icon: 'Layers',
    color: 'bg-blue-500',
    inputs: [
      { id: 'input', name: 'Input', type: 'default' },
    ],
    outputs: [
      { id: 'output', name: 'Result', type: 'default' },
    ],
    defaultConfig: {
      operation: 'get',
      key: '',
    },
    configSchema: {
      operation: { type: 'select', options: ['get', 'set', 'delete', 'expire'] },
      key: { type: 'string', label: 'Key' },
    },
  },
];
```

---

### Milestone 6: Implement HTTP/External Node Metadata
**Date:** [YYYY-MM-DD]  
**Confidence:** [X/10]  
**Status:** 🔵 Not Started  
**Time Spent:** [X hours]  

#### File: `src/core/workflow/nodes/configs/http.ts`

```typescript
/**
 * @file http.ts
 * @description Metadata for HTTP/external service node types
 */

import type { NodeMetadata } from '../registry';

export const HTTP_NODES: NodeMetadata[] = [
  {
    type: 'httpRequest',
    category: 'http',
    name: 'HTTP Request',
    description: 'Make HTTP requests to external APIs',
    icon: 'Send',
    color: 'bg-cyan-500',
    inputs: [
      { id: 'input', name: 'Input', type: 'default' },
    ],
    outputs: [
      { id: 'output', name: 'Response', type: 'default' },
      { id: 'error', name: 'Error', type: 'error' },
    ],
    defaultConfig: {
      method: 'GET',
      url: '',
      headers: {},
    },
    configSchema: {
      method: { type: 'select', options: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'] },
      url: { type: 'string', label: 'URL' },
      headers: { type: 'keyvalue', label: 'Headers' },
      body: { type: 'code', language: 'json', label: 'Body' },
    },
  },
  {
    type: 'gmailOperation',
    category: 'http',
    name: 'Gmail',
    description: 'Send emails via Gmail',
    icon: 'Mail',
    color: 'bg-cyan-500',
    inputs: [
      { id: 'input', name: 'Input', type: 'default' },
    ],
    outputs: [
      { id: 'output', name: 'Result', type: 'default' },
    ],
    defaultConfig: {
      operation: 'send',
      to: '',
      subject: '',
    },
    configSchema: {
      operation: { type: 'select', options: ['send', 'read', 'search'] },
      to: { type: 'string', label: 'To' },
      subject: { type: 'string', label: 'Subject' },
      body: { type: 'textarea', label: 'Body' },
    },
  },
  {
    type: 'webhookSend',
    category: 'http',
    name: 'Send Webhook',
    description: 'Send webhook to external service',
    icon: 'ExternalLink',
    color: 'bg-cyan-500',
    inputs: [
      { id: 'input', name: 'Payload', type: 'default' },
    ],
    outputs: [
      { id: 'output', name: 'Response', type: 'default' },
    ],
    defaultConfig: {
      url: '',
      method: 'POST',
    },
    configSchema: {
      url: { type: 'string', label: 'Webhook URL' },
      method: { type: 'select', options: ['POST', 'PUT'] },
    },
  },
  {
    type: 'graphqlMutation',
    category: 'http',
    name: 'GraphQL Mutation',
    description: 'Execute GraphQL mutations',
    icon: 'PenTool',
    color: 'bg-cyan-500',
    inputs: [
      { id: 'input', name: 'Variables', type: 'default' },
    ],
    outputs: [
      { id: 'output', name: 'Result', type: 'default' },
    ],
    defaultConfig: {
      mutation: '',
      endpoint: '',
    },
    configSchema: {
      mutation: { type: 'code', language: 'graphql', label: 'Mutation' },
      endpoint: { type: 'string', label: 'Endpoint URL' },
    },
  },
];
```

---

### Milestone 7: Implement Control Flow Node Metadata
**Date:** [YYYY-MM-DD]  
**Confidence:** [X/10]  
**Status:** 🔵 Not Started  
**Time Spent:** [X hours]  

#### File: `src/core/workflow/nodes/configs/control.ts`

```typescript
/**
 * @file control.ts
 * @description Metadata for control flow node types
 */

import type { NodeMetadata } from '../registry';

export const CONTROL_NODES: NodeMetadata[] = [
  {
    type: 'condition',
    category: 'control',
    name: 'Condition',
    description: 'Branch based on condition',
    icon: 'GitBranch',
    color: 'bg-orange-500',
    inputs: [
      { id: 'input', name: 'Input', type: 'default' },
    ],
    outputs: [
      { id: 'true', name: 'True', type: 'conditional' },
      { id: 'false', name: 'False', type: 'conditional' },
    ],
    defaultConfig: {
      condition: '',
    },
    configSchema: {
      condition: { type: 'expression', label: 'Condition' },
    },
  },
  {
    type: 'switch',
    category: 'control',
    name: 'Switch',
    description: 'Multi-way branching',
    icon: 'Share2',
    color: 'bg-orange-500',
    inputs: [
      { id: 'input', name: 'Input', type: 'default' },
    ],
    outputs: [
      { id: 'case_0', name: 'Case 1', type: 'conditional' },
      { id: 'case_1', name: 'Case 2', type: 'conditional' },
      { id: 'default', name: 'Default', type: 'conditional' },
    ],
    defaultConfig: {
      expression: '',
      cases: [],
    },
    configSchema: {
      expression: { type: 'expression', label: 'Expression' },
      cases: { type: 'array', itemType: 'case' },
    },
  },
  {
    type: 'loop',
    category: 'control',
    name: 'Loop',
    description: 'Iterate over array items',
    icon: 'Repeat',
    color: 'bg-orange-500',
    inputs: [
      { id: 'input', name: 'Array', type: 'default' },
    ],
    outputs: [
      { id: 'item', name: 'Item', type: 'default' },
      { id: 'done', name: 'Done', type: 'default' },
    ],
    defaultConfig: {
      mode: 'sequential',
      concurrency: 1,
    },
    configSchema: {
      mode: { type: 'select', options: ['sequential', 'parallel'] },
      concurrency: { type: 'number', min: 1, max: 50 },
    },
  },
  {
    type: 'parallel',
    category: 'control',
    name: 'Parallel',
    description: 'Execute branches in parallel',
    icon: 'GitMerge',
    color: 'bg-orange-500',
    inputs: [
      { id: 'input', name: 'Input', type: 'default' },
    ],
    outputs: [
      { id: 'branch_0', name: 'Branch 1', type: 'default' },
      { id: 'branch_1', name: 'Branch 2', type: 'default' },
    ],
    defaultConfig: {
      branches: 2,
    },
    configSchema: {
      branches: { type: 'number', min: 2, max: 10 },
    },
  },
  {
    type: 'aggregate',
    category: 'control',
    name: 'Aggregate',
    description: 'Combine parallel results',
    icon: 'Minimize2',
    color: 'bg-orange-500',
    inputs: [
      { id: 'input_0', name: 'Input 1', type: 'default' },
      { id: 'input_1', name: 'Input 2', type: 'default' },
    ],
    outputs: [
      { id: 'output', name: 'Combined', type: 'default' },
    ],
    defaultConfig: {
      mode: 'array',
    },
    configSchema: {
      mode: { type: 'select', options: ['array', 'object', 'merge'] },
    },
  },
  {
    type: 'retry',
    category: 'control',
    name: 'Retry',
    description: 'Retry on failure',
    icon: 'RotateCcw',
    color: 'bg-orange-500',
    inputs: [
      { id: 'input', name: 'Input', type: 'default' },
    ],
    outputs: [
      { id: 'output', name: 'Output', type: 'default' },
      { id: 'exhausted', name: 'Exhausted', type: 'error' },
    ],
    defaultConfig: {
      maxAttempts: 3,
      delay: 1000,
      backoff: 'exponential',
    },
    configSchema: {
      maxAttempts: { type: 'number', min: 1, max: 10 },
      delay: { type: 'number', label: 'Delay (ms)' },
      backoff: { type: 'select', options: ['none', 'linear', 'exponential'] },
    },
  },
  {
    type: 'delay',
    category: 'control',
    name: 'Delay',
    description: 'Wait before continuing',
    icon: 'Clock',
    color: 'bg-orange-500',
    inputs: [
      { id: 'input', name: 'Input', type: 'default' },
    ],
    outputs: [
      { id: 'output', name: 'Output', type: 'default' },
    ],
    defaultConfig: {
      duration: 1000,
    },
    configSchema: {
      duration: { type: 'number', label: 'Duration (ms)', min: 0 },
    },
  },
  {
    type: 'earlyReturn',
    category: 'control',
    name: 'Early Return',
    description: 'Return early from workflow',
    icon: 'LogOut',
    color: 'bg-orange-500',
    inputs: [
      { id: 'input', name: 'Input', type: 'default' },
    ],
    outputs: [],
    defaultConfig: {
      statusCode: 200,
    },
    configSchema: {
      statusCode: { type: 'number', label: 'Status Code' },
    },
  },
];
```

---

### Milestone 8: Implement Remaining Node Categories
**Date:** [YYYY-MM-DD]  
**Confidence:** [X/10]  
**Status:** 🔵 Not Started  
**Time Spent:** [X hours]  

#### Activities
- [ ] Implement transform nodes (8 types)
- [ ] Implement streaming nodes (5 types)
- [ ] Implement utility nodes (9 types)

Files to create:
- `src/core/workflow/nodes/configs/transform.ts`
- `src/core/workflow/nodes/configs/streaming.ts`
- `src/core/workflow/nodes/configs/utilities.ts`

---

### Milestone 9: Build Complete Registry
**Date:** [YYYY-MM-DD]  
**Confidence:** [X/10]  
**Status:** 🔵 Not Started  
**Time Spent:** [X hours]  

#### File: `src/core/workflow/nodes/index.ts`

```typescript
/**
 * @file index.ts
 * @description Main exports for node type system
 */

import type { NodeType } from '../types';
import type { NodeMetadata, NodeCategory, CategoryMetadata } from './registry';
import { CATEGORIES } from './registry';
import { TRIGGER_NODES } from './configs/triggers';
import { LLM_NODES } from './configs/llm';
import { DATA_NODES } from './configs/data';
import { HTTP_NODES } from './configs/http';
import { CONTROL_NODES } from './configs/control';
import { TRANSFORM_NODES } from './configs/transform';
import { STREAMING_NODES } from './configs/streaming';
import { UTILITY_NODES } from './configs/utilities';

// ============================================================
// BUILD COMPLETE REGISTRY
// ============================================================

const ALL_NODES: NodeMetadata[] = [
  ...TRIGGER_NODES,
  ...LLM_NODES,
  ...DATA_NODES,
  ...HTTP_NODES,
  ...CONTROL_NODES,
  ...TRANSFORM_NODES,
  ...STREAMING_NODES,
  ...UTILITY_NODES,
];

/**
 * Complete node registry - maps type to metadata
 */
export const NODE_REGISTRY: Record<string, NodeMetadata> = Object.fromEntries(
  ALL_NODES.map(node => [node.type, node])
);

// ============================================================
// LOOKUP FUNCTIONS
// ============================================================

/**
 * Get metadata for a node type
 */
export function getNodeMetadata(type: NodeType): NodeMetadata | undefined {
  return NODE_REGISTRY[type];
}

/**
 * Get all nodes in a category
 */
export function getNodesByCategory(category: NodeCategory): NodeMetadata[] {
  return ALL_NODES.filter(node => node.category === category);
}

/**
 * Get all categories
 */
export function getAllCategories(): CategoryMetadata[] {
  return Object.values(CATEGORIES);
}

/**
 * Get category metadata
 */
export function getCategoryMetadata(category: NodeCategory): CategoryMetadata | undefined {
  return CATEGORIES[category];
}

/**
 * Check if type is valid node type
 */
export function isValidNodeType(type: string): type is NodeType {
  return type in NODE_REGISTRY;
}

/**
 * Get all node types
 */
export function getAllNodeTypes(): NodeType[] {
  return ALL_NODES.map(node => node.type);
}

/**
 * Search nodes by name or description
 */
export function searchNodes(query: string): NodeMetadata[] {
  const lowercaseQuery = query.toLowerCase();
  return ALL_NODES.filter(
    node =>
      node.name.toLowerCase().includes(lowercaseQuery) ||
      node.description.toLowerCase().includes(lowercaseQuery)
  );
}

// Re-export types
export type { NodeMetadata, NodeCategory, CategoryMetadata, HandleDefinition } from './registry';
export { CATEGORIES } from './registry';
```

---

### Milestone 10: Write Tests
**Date:** [YYYY-MM-DD]  
**Confidence:** [X/10]  
**Status:** 🔵 Not Started  
**Time Spent:** [X hours]  

#### File: `tests/unit/workflow/nodes.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import {
  NODE_REGISTRY,
  getNodeMetadata,
  getNodesByCategory,
  getAllCategories,
  getCategoryMetadata,
  isValidNodeType,
  getAllNodeTypes,
  searchNodes,
  CATEGORIES,
} from '../../../src/core/workflow/nodes';

describe('Node Registry', () => {
  describe('NODE_REGISTRY', () => {
    it('should contain all 55+ node types', () => {
      const nodeCount = Object.keys(NODE_REGISTRY).length;
      expect(nodeCount).toBeGreaterThanOrEqual(55);
    });

    it('should have valid metadata for all nodes', () => {
      Object.values(NODE_REGISTRY).forEach(node => {
        expect(node.type).toBeDefined();
        expect(node.name).toBeDefined();
        expect(node.category).toBeDefined();
        expect(node.icon).toBeDefined();
        expect(node.color).toBeDefined();
        expect(node.inputs).toBeDefined();
        expect(node.outputs).toBeDefined();
      });
    });
  });

  describe('getNodeMetadata', () => {
    it('should return metadata for valid node type', () => {
      const metadata = getNodeMetadata('anthropicCompletion');
      expect(metadata).toBeDefined();
      expect(metadata?.name).toBe('Claude');
    });

    it('should return undefined for invalid node type', () => {
      const metadata = getNodeMetadata('invalidType' as any);
      expect(metadata).toBeUndefined();
    });
  });

  describe('getNodesByCategory', () => {
    it('should return trigger nodes', () => {
      const triggers = getNodesByCategory('triggers');
      expect(triggers.length).toBe(6);
      expect(triggers.every(n => n.category === 'triggers')).toBe(true);
    });

    it('should return LLM nodes', () => {
      const llmNodes = getNodesByCategory('llm');
      expect(llmNodes.length).toBeGreaterThanOrEqual(8);
    });
  });

  describe('getAllCategories', () => {
    it('should return all 8 categories', () => {
      const categories = getAllCategories();
      expect(categories.length).toBe(8);
    });
  });

  describe('getCategoryMetadata', () => {
    it('should return category metadata', () => {
      const metadata = getCategoryMetadata('llm');
      expect(metadata?.name).toBe('AI / LLM');
      expect(metadata?.icon).toBe('Sparkles');
    });
  });

  describe('isValidNodeType', () => {
    it('should return true for valid types', () => {
      expect(isValidNodeType('httpEndpoint')).toBe(true);
      expect(isValidNodeType('anthropicCompletion')).toBe(true);
    });

    it('should return false for invalid types', () => {
      expect(isValidNodeType('invalidType')).toBe(false);
    });
  });

  describe('searchNodes', () => {
    it('should find nodes by name', () => {
      const results = searchNodes('claude');
      expect(results.some(n => n.type === 'anthropicCompletion')).toBe(true);
    });

    it('should find nodes by description', () => {
      const results = searchNodes('HTTP');
      expect(results.length).toBeGreaterThan(0);
    });
  });
});

describe('Categories', () => {
  it('should have all required categories', () => {
    expect(CATEGORIES.triggers).toBeDefined();
    expect(CATEGORIES.llm).toBeDefined();
    expect(CATEGORIES.data).toBeDefined();
    expect(CATEGORIES.http).toBeDefined();
    expect(CATEGORIES.control).toBeDefined();
    expect(CATEGORIES.transform).toBeDefined();
    expect(CATEGORIES.streaming).toBeDefined();
    expect(CATEGORIES.utilities).toBeDefined();
  });
});
```

---

### Milestone 11: Human Review
**Date:** [YYYY-MM-DD]  
**Confidence:** [X/10]  
**Status:** 🔵 Not Started  
**Time Spent:** [X hours]  

#### Human Review

**Reviewer:** [Name]  
**Date:** [YYYY-MM-DD]  
**Duration:** [X minutes]  

**Review Focus:**
- All 55+ nodes defined
- Metadata completeness
- Config schemas reasonable
- Category organization logical

**Feedback Received:**

**Positive:**
- ✅ [To be filled]

**Concerns:**
- ⚠️ [To be filled]

**Sign-off:**
- [ ] Node registry complete
- [ ] Categories approved
- [ ] Config schemas approved
- [ ] Ready for Task 0.4

**Final Confidence:** [X/10]

---

## Final Summary

### Deliverables
- [ ] `src/core/workflow/nodes/registry.ts` - Core types
- [ ] `src/core/workflow/nodes/configs/triggers.ts` - Trigger nodes (6)
- [ ] `src/core/workflow/nodes/configs/llm.ts` - LLM nodes (8)
- [ ] `src/core/workflow/nodes/configs/data.ts` - Data nodes (9)
- [ ] `src/core/workflow/nodes/configs/http.ts` - HTTP nodes (4)
- [ ] `src/core/workflow/nodes/configs/control.ts` - Control nodes (8)
- [ ] `src/core/workflow/nodes/configs/transform.ts` - Transform nodes (8)
- [ ] `src/core/workflow/nodes/configs/streaming.ts` - Streaming nodes (5)
- [ ] `src/core/workflow/nodes/configs/utilities.ts` - Utility nodes (9)
- [ ] `src/core/workflow/nodes/index.ts` - Main exports
- [ ] `tests/unit/workflow/nodes.test.ts` - Tests
- [ ] Test coverage >90%
- [ ] Human review completed

### What Was Accomplished
[To be filled upon completion]

### Lessons Learned
[To be filled upon completion]

### Technical Debt Created
- None expected

### Next Steps
- [ ] Proceed to Task 0.4: Workflow Store
- [ ] Create Zustand store
- [ ] Integrate with canvas

---

## Appendix

### Key Files
- `src/core/workflow/nodes/` - Node registry and configs
- `tests/unit/workflow/nodes.test.ts` - Test suite

### Useful Commands
```bash
# Type check
npx tsc --noEmit

# Run tests
npm test -- tests/unit/workflow/nodes.test.ts
```

### Related Tasks
- Task 0.2: Manifest Schema Design (previous)
- Task 0.4: Workflow Store (next)

---

**Task Status:** 🔵 Not Started  
**Ready for:** Implementation  
**Last Updated:** 2025-12-18
