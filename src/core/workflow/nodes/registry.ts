/**
 * @file registry.ts
 * @description Central node registry mapping all 55+ node types to their metadata
 * 
 * @architecture Phase 0, Task 0.3 - Node Type System
 * @created 2025-12-18
 * @author AI (Cline) + Human Review
 * @confidence 9/10 - Comprehensive registry, based on specification
 * 
 * @see src/core/workflow/types.ts - Node type definitions
 * @see src/core/workflow/validation.ts - Config schemas
 * @see docs/Catalyst documentation/CATALYST_SPECIFICATION.md - Node specifications
 * 
 * PROBLEM SOLVED:
 * - Need centralized metadata for all 55+ node types
 * - UI needs to render nodes with correct icons, colors, handles
 * - Need to know which nodes are implemented vs stubbed
 * 
 * SOLUTION:
 * - Complete NODE_REGISTRY mapping NodeType → NodeMetadata
 * - 10 CORE nodes fully specified (implemented: true)
 * - 45+ STUB nodes defined (implemented: false)
 * - Generic config schema for stub nodes
 * 
 * @security-critical false
 * @performance-critical false
 */

import { z } from 'zod';
import type { NodeType } from '../types';
import type { NodeRegistry, NodeMetadata } from './types';

// Import validation schemas from validation.ts
// Note: For stub nodes, we use a generic schema
const genericNodeConfigSchema = z.record(z.string(), z.any());

// ============================================================
// NODE REGISTRY
// ============================================================

/**
 * Complete node registry
 * Maps all 55+ node types to their metadata
 * 
 * LEGEND:
 * ✅ CORE = Fully implemented with config schema (Phase 0)
 * 🚧 STUB = Defined but not yet implemented (Future phases)
 */
export const NODE_REGISTRY: NodeRegistry = {
  // ============================================================
  // TRIGGERS (6 types)
  // ============================================================
  
  // ✅ CORE
  httpEndpoint: {
    type: 'httpEndpoint',
    category: 'triggers',
    name: 'HTTP Endpoint',
    description: 'Receive HTTP requests (GET, POST, PUT, DELETE, PATCH)',
    icon: 'GlobeAlt',
    color: 'bg-green-500',
    inputs: [],  // Triggers have no inputs
    outputs: [{ id: 'output', name: 'Request', type: 'default' }],
    configSchema: genericNodeConfigSchema,
    configFields: [
      {
        path: 'path',
        label: 'Endpoint Path',
        type: 'text',
        required: true,
        placeholder: '/api/my-workflow',
        description: 'URL path for this endpoint (e.g., /api/webhook)',
      },
      {
        path: 'method',
        label: 'HTTP Method',
        type: 'select',
        required: true,
        options: [
          { label: 'POST', value: 'POST' },
          { label: 'GET', value: 'GET' },
          { label: 'PUT', value: 'PUT' },
          { label: 'DELETE', value: 'DELETE' },
          { label: 'PATCH', value: 'PATCH' },
        ],
        description: 'HTTP method to accept',
      },
      {
        path: 'description',
        label: 'Description',
        type: 'textarea',
        rows: 3,
        placeholder: 'Describe what this endpoint does...',
        description: 'Optional documentation for this endpoint',
      },
    ],
    implemented: true,
    phase: 0,
  },
  
  // ✅ CORE
  scheduledTask: {
    type: 'scheduledTask',
    category: 'triggers',
    name: 'Scheduled Task',
    description: 'Execute on a cron schedule',
    icon: 'Clock',
    color: 'bg-green-500',
    inputs: [],
    outputs: [{ id: 'output', name: 'Execution', type: 'default' }],
    configSchema: genericNodeConfigSchema,
    configFields: [
      {
        path: 'schedule',
        label: 'Cron Schedule',
        type: 'text',
        required: true,
        placeholder: '0 0 * * *',
        description: 'Cron expression (e.g., "0 0 * * *" = daily at midnight)',
      },
      {
        path: 'timezone',
        label: 'Timezone',
        type: 'select',
        options: [
          { label: 'UTC', value: 'UTC' },
          { label: 'America/New_York', value: 'America/New_York' },
          { label: 'America/Los_Angeles', value: 'America/Los_Angeles' },
          { label: 'Europe/London', value: 'Europe/London' },
          { label: 'Europe/Paris', value: 'Europe/Paris' },
          { label: 'Asia/Tokyo', value: 'Asia/Tokyo' },
        ],
        description: 'Timezone for schedule execution',
      },
      {
        path: 'enabled',
        label: 'Enabled',
        type: 'boolean',
        description: 'Enable or disable this scheduled task',
      },
    ],
    implemented: true,
    phase: 0,
  },
  
  // 🚧 STUB
  webhookReceiver: {
    type: 'webhookReceiver',
    category: 'triggers',
    name: 'Webhook Receiver',
    description: 'Receive external webhooks with validation',
    icon: 'ArrowDownTray',
    color: 'bg-green-500',
    inputs: [],
    outputs: [{ id: 'output', name: 'Webhook', type: 'default' }],
    configSchema: genericNodeConfigSchema,
    implemented: false,
    phase: 1,
  },
  
  // 🚧 STUB
  subworkflowTrigger: {
    type: 'subworkflowTrigger',
    category: 'triggers',
    name: 'Subworkflow',
    description: 'Called by other workflows',
    icon: 'RectangleGroup',
    color: 'bg-green-500',
    inputs: [],
    outputs: [{ id: 'output', name: 'Input', type: 'default' }],
    configSchema: genericNodeConfigSchema,
    implemented: false,
    phase: 2,
  },
  
  // 🚧 STUB
  websocketEndpoint: {
    type: 'websocketEndpoint',
    category: 'triggers',
    name: 'WebSocket Endpoint',
    description: 'Handle WebSocket connections',
    icon: 'SignalSlash',
    color: 'bg-green-500',
    inputs: [],
    outputs: [{ id: 'output', name: 'Connection', type: 'default' }],
    configSchema: genericNodeConfigSchema,
    implemented: false,
    phase: 2,
  },
  
  // 🚧 STUB
  queueConsumer: {
    type: 'queueConsumer',
    category: 'triggers',
    name: 'Queue Consumer',
    description: 'Consume messages from queue',
    icon: 'QueueList',
    color: 'bg-green-500',
    inputs: [],
    outputs: [{ id: 'output', name: 'Message', type: 'default' }],
    configSchema: genericNodeConfigSchema,
    implemented: false,
    phase: 3,
  },
  
  // ============================================================
  // LLM / AI (8 types)
  // ============================================================
  
  // ✅ CORE
  anthropicCompletion: {
    type: 'anthropicCompletion',
    category: 'llm',
    name: 'Claude (Anthropic)',
    description: 'Claude AI completions with streaming and tool calling',
    icon: 'Sparkles',
    color: 'bg-purple-500',
    inputs: [{ id: 'input', name: 'Input', type: 'default' }],
    outputs: [{ id: 'output', name: 'Response', type: 'default' }],
    configSchema: genericNodeConfigSchema,
    configFields: [
      {
        path: 'apiKey',
        label: 'API Key',
        type: 'secret',
        required: true,
        description: 'Your Anthropic API key from console.anthropic.com',
      },
      {
        path: 'model',
        label: 'Model',
        type: 'select',
        required: true,
        options: [
          { label: 'Claude 3.5 Sonnet (Recommended)', value: 'claude-3-5-sonnet-20241022' },
          { label: 'Claude 3 Opus', value: 'claude-3-opus-20240229' },
          { label: 'Claude 3 Haiku', value: 'claude-3-haiku-20240307' },
        ],
        description: 'Choose the Claude model to use',
      },
      {
        path: 'system',
        label: 'System Prompt',
        type: 'textarea',
        rows: 3,
        placeholder: 'You are a helpful assistant...',
        description: 'Optional system message to guide Claude\'s behavior',
      },
      {
        path: 'prompt',
        label: 'User Prompt',
        type: 'textarea',
        required: true,
        rows: 6,
        placeholder: 'Enter your prompt...',
        description: 'Supports {{variable}} syntax for dynamic data',
      },
      {
        path: 'temperature',
        label: 'Temperature',
        type: 'number',
        min: 0,
        max: 1,
        step: 0.1,
        placeholder: '0.7',
        description: 'Controls randomness (0-1). Higher = more creative.',
      },
      {
        path: 'maxTokens',
        label: 'Max Tokens',
        type: 'number',
        min: 1,
        max: 8192,
        placeholder: '4096',
        description: 'Maximum tokens in the response',
      },
      {
        path: 'stream',
        label: 'Enable Streaming',
        type: 'boolean',
        description: 'Stream response tokens as they arrive',
      },
    ],
    implemented: true,
    phase: 0,
  },
  
  // ✅ CORE
  openaiCompletion: {
    type: 'openaiCompletion',
    category: 'llm',
    name: 'OpenAI (GPT)',
    description: 'OpenAI GPT completions with functions',
    icon: 'CpuChip',
    color: 'bg-purple-500',
    inputs: [{ id: 'input', name: 'Input', type: 'default' }],
    outputs: [{ id: 'output', name: 'Response', type: 'default' }],
    configSchema: genericNodeConfigSchema,
    configFields: [
      {
        path: 'apiKey',
        label: 'API Key',
        type: 'secret',
        required: true,
        description: 'Your OpenAI API key from platform.openai.com',
      },
      {
        path: 'model',
        label: 'Model',
        type: 'select',
        required: true,
        options: [
          { label: 'GPT-4 Turbo', value: 'gpt-4-turbo-preview' },
          { label: 'GPT-4', value: 'gpt-4' },
          { label: 'GPT-3.5 Turbo', value: 'gpt-3.5-turbo' },
        ],
        description: 'Choose the OpenAI model to use',
      },
      {
        path: 'prompt',
        label: 'Prompt',
        type: 'textarea',
        required: true,
        rows: 6,
        placeholder: 'Enter your prompt...',
        description: 'Supports {{variable}} syntax for dynamic data',
      },
      {
        path: 'temperature',
        label: 'Temperature',
        type: 'number',
        min: 0,
        max: 2,
        step: 0.1,
        placeholder: '0.7',
        description: 'Controls randomness (0-2). Higher = more creative.',
      },
      {
        path: 'maxTokens',
        label: 'Max Tokens',
        type: 'number',
        min: 1,
        max: 4096,
        placeholder: '1000',
        description: 'Maximum tokens in the response',
      },
      {
        path: 'stream',
        label: 'Enable Streaming',
        type: 'boolean',
        description: 'Stream response tokens as they arrive',
      },
    ],
    implemented: true,
    phase: 0,
  },
  
  // ✅ CORE (Phase 2)
  groqCompletion: {
    type: 'groqCompletion',
    category: 'llm',
    name: 'Groq',
    description: 'Ultra-fast LLM inference with Groq',
    icon: 'Bolt',
    color: 'bg-purple-500',
    inputs: [{ id: 'input', name: 'Input', type: 'default' }],
    outputs: [{ id: 'output', name: 'Response', type: 'default' }],
    configSchema: genericNodeConfigSchema,
    configFields: [
      {
        path: 'apiKey',
        label: 'API Key',
        type: 'secret',
        required: true,
        description: 'Your Groq API key from console.groq.com',
      },
      {
        path: 'model',
        label: 'Model',
        type: 'select',
        required: true,
        options: [
          { label: 'Llama 3.3 70B Versatile (Recommended)', value: 'llama-3.3-70b-versatile' },
          { label: 'Llama 3.1 8B Instant', value: 'llama-3.1-8b-instant' },
          { label: 'Mixtral 8x7B', value: 'mixtral-8x7b-32768' },
          { label: 'Gemma 2 9B', value: 'gemma2-9b-it' },
        ],
        description: 'Choose the Groq model for inference',
      },
      {
        path: 'prompt',
        label: 'Prompt',
        type: 'textarea',
        required: true,
        rows: 6,
        placeholder: 'Enter your prompt...',
        description: 'Supports {{variable}} syntax for dynamic data',
      },
      {
        path: 'temperature',
        label: 'Temperature',
        type: 'number',
        min: 0,
        max: 2,
        step: 0.1,
        placeholder: '0.7',
        description: 'Controls randomness (0-2). Higher = more creative.',
      },
      {
        path: 'maxTokens',
        label: 'Max Tokens',
        type: 'number',
        min: 1,
        max: 32768,
        placeholder: '1000',
        description: 'Maximum tokens in the response',
      },
      {
        path: 'stream',
        label: 'Enable Streaming',
        type: 'boolean',
        description: 'Stream response tokens as they arrive',
      },
    ],
    implemented: true,
    phase: 2,
  },
  
  // 🚧 STUB
  azureOpenaiCompletion: {
    type: 'azureOpenaiCompletion',
    category: 'llm',
    name: 'Azure OpenAI',
    description: 'OpenAI via Azure AI Foundry',
    icon: 'Cloud',
    color: 'bg-purple-500',
    inputs: [{ id: 'input', name: 'Input', type: 'default' }],
    outputs: [{ id: 'output', name: 'Response', type: 'default' }],
    configSchema: genericNodeConfigSchema,
    implemented: false,
    phase: 2,
  },
  
  // ✅ CORE (Phase 2)
  embeddingGenerate: {
    type: 'embeddingGenerate',
    category: 'llm',
    name: 'Generate Embeddings',
    description: 'Create vector embeddings from text',
    icon: 'ChartBar',
    color: 'bg-purple-500',
    inputs: [{ id: 'input', name: 'Text', type: 'default' }],
    outputs: [{ id: 'output', name: 'Vector', type: 'default' }],
    configSchema: genericNodeConfigSchema,
    configFields: [
      {
        path: 'provider',
        label: 'Provider',
        type: 'select',
        required: true,
        options: [
          { label: 'OpenAI', value: 'openai' },
          { label: 'Voyage AI', value: 'voyage' },
        ],
        description: 'Choose the embedding provider',
      },
      {
        path: 'apiKey',
        label: 'API Key',
        type: 'secret',
        required: true,
        description: 'API key for the selected provider',
      },
      {
        path: 'model',
        label: 'Model',
        type: 'select',
        required: true,
        options: [
          { label: 'text-embedding-3-large', value: 'text-embedding-3-large' },
          { label: 'text-embedding-3-small', value: 'text-embedding-3-small' },
          { label: 'text-embedding-ada-002', value: 'text-embedding-ada-002' },
        ],
        description: 'Embedding model to use',
      },
      {
        path: 'text',
        label: 'Text to Embed',
        type: 'textarea',
        required: true,
        rows: 4,
        placeholder: 'Enter text to generate embeddings...',
        description: 'Supports {{variable}} syntax for dynamic data',
      },
    ],
    implemented: true,
    phase: 2,
  },
  
  // ✅ CORE (Phase 2)
  promptTemplate: {
    type: 'promptTemplate',
    category: 'llm',
    name: 'Prompt Template',
    description: 'Build prompts from templates',
    icon: 'DocumentText',
    color: 'bg-purple-500',
    inputs: [{ id: 'input', name: 'Variables', type: 'default' }],
    outputs: [{ id: 'output', name: 'Prompt', type: 'default' }],
    configSchema: genericNodeConfigSchema,
    configFields: [
      {
        path: 'template',
        label: 'Template',
        type: 'textarea',
        required: true,
        rows: 8,
        placeholder: 'You are a {{role}}.\n\nUser question: {{question}}\n\nContext: {{context}}',
        description: 'Prompt template with {{variable}} placeholders',
      },
      {
        path: 'variables',
        label: 'Variables (JSON)',
        type: 'textarea',
        rows: 4,
        placeholder: '{\n  "role": "helpful assistant",\n  "question": "...",\n  "context": "..."\n}',
        description: 'Default values for template variables (JSON format)',
      },
    ],
    implemented: true,
    phase: 2,
  },
  
  // 🚧 STUB
  agenticToolCall: {
    type: 'agenticToolCall',
    category: 'llm',
    name: 'Agentic Tool Call',
    description: 'LLM with tool calling capabilities',
    icon: 'Wrench',
    color: 'bg-purple-500',
    inputs: [{ id: 'input', name: 'Input', type: 'default' }],
    outputs: [{ id: 'output', name: 'Result', type: 'default' }],
    configSchema: genericNodeConfigSchema,
    implemented: false,
    phase: 5,
  },
  
  // ✅ CORE (Phase 2)
  llmRouter: {
    type: 'llmRouter',
    category: 'llm',
    name: 'LLM Router',
    description: 'Route to best model based on criteria',
    icon: 'ArrowsRightLeft',
    color: 'bg-purple-500',
    inputs: [{ id: 'input', name: 'Input', type: 'default' }],
    outputs: [{ id: 'output', name: 'Response', type: 'default' }],
    configSchema: genericNodeConfigSchema,
    configFields: [
      {
        path: 'routingStrategy',
        label: 'Routing Strategy',
        type: 'select',
        required: true,
        options: [
          { label: 'Cost Optimization', value: 'cost' },
          { label: 'Speed Optimization', value: 'speed' },
          { label: 'Quality Optimization', value: 'quality' },
          { label: 'Load Balancing', value: 'load_balance' },
        ],
        description: 'Strategy for selecting the LLM model',
      },
      {
        path: 'models',
        label: 'Available Models (JSON Array)',
        type: 'textarea',
        required: true,
        rows: 6,
        placeholder: '[\n  {"provider": "openai", "model": "gpt-4"},\n  {"provider": "anthropic", "model": "claude-3-sonnet"}\n]',
        description: 'List of models to route between (JSON format)',
      },
      {
        path: 'fallbackModel',
        label: 'Fallback Model',
        type: 'text',
        placeholder: 'gpt-3.5-turbo',
        description: 'Model to use if primary models fail',
      },
    ],
    implemented: true,
    phase: 2,
  },
  
  // ============================================================
  // DATA SOURCES (8 types)
  // ============================================================
  
  // ✅ CORE
  qdrantSearch: {
    type: 'qdrantSearch',
    category: 'data',
    name: 'Qdrant Search',
    description: 'Vector similarity search',
    icon: 'MagnifyingGlass',
    color: 'bg-blue-500',
    inputs: [{ id: 'input', name: 'Query', type: 'default' }],
    outputs: [{ id: 'output', name: 'Results', type: 'default' }],
    configSchema: genericNodeConfigSchema,
    configFields: [
      {
        path: 'url',
        label: 'Qdrant URL',
        type: 'text',
        required: true,
        placeholder: 'http://localhost:6333',
        description: 'URL of your Qdrant instance',
      },
      {
        path: 'apiKey',
        label: 'API Key',
        type: 'secret',
        description: 'Optional API key for Qdrant Cloud',
      },
      {
        path: 'collection',
        label: 'Collection Name',
        type: 'text',
        required: true,
        placeholder: 'my_collection',
        description: 'Name of the Qdrant collection to search',
      },
      {
        path: 'queryVector',
        label: 'Query Vector (JSON)',
        type: 'textarea',
        required: true,
        rows: 3,
        placeholder: '[0.1, 0.2, 0.3, ...]',
        description: 'Vector to search for (typically from embedding node)',
      },
      {
        path: 'limit',
        label: 'Result Limit',
        type: 'number',
        min: 1,
        max: 100,
        placeholder: '10',
        description: 'Maximum number of results to return',
      },
      {
        path: 'scoreThreshold',
        label: 'Score Threshold',
        type: 'number',
        min: 0,
        max: 1,
        step: 0.01,
        placeholder: '0.7',
        description: 'Minimum similarity score (0-1)',
      },
    ],
    implemented: true,
    phase: 0,
  },
  
  // 🚧 STUB
  qdrantUpsert: {
    type: 'qdrantUpsert',
    category: 'data',
    name: 'Qdrant Upsert',
    description: 'Insert or update vectors',
    icon: 'ArrowUpTray',
    color: 'bg-blue-500',
    inputs: [{ id: 'input', name: 'Points', type: 'default' }],
    outputs: [{ id: 'output', name: 'Result', type: 'default' }],
    configSchema: genericNodeConfigSchema,
    implemented: false,
    phase: 3,
  },
  
  // 🚧 STUB
  qdrantScroll: {
    type: 'qdrantScroll',
    category: 'data',
    name: 'Qdrant Scroll',
    description: 'Paginated point retrieval',
    icon: 'ArrowsUpDown',
    color: 'bg-blue-500',
    inputs: [{ id: 'input', name: 'Input', type: 'default' }],
    outputs: [{ id: 'output', name: 'Points', type: 'default' }],
    configSchema: genericNodeConfigSchema,
    implemented: false,
    phase: 3,
  },
  
  // 🚧 STUB
  qdrantPayload: {
    type: 'qdrantPayload',
    category: 'data',
    name: 'Qdrant Payload',
    description: 'Update point payloads',
    icon: 'PencilSquare',
    color: 'bg-blue-500',
    inputs: [{ id: 'input', name: 'Input', type: 'default' }],
    outputs: [{ id: 'output', name: 'Result', type: 'default' }],
    configSchema: genericNodeConfigSchema,
    implemented: false,
    phase: 3,
  },
  
  // ✅ CORE
  postgresQuery: {
    type: 'postgresQuery',
    category: 'data',
    name: 'PostgreSQL Query',
    description: 'Execute SQL queries',
    icon: 'CircleStack',
    color: 'bg-blue-500',
    inputs: [{ id: 'input', name: 'Input', type: 'default' }],
    outputs: [{ id: 'output', name: 'Rows', type: 'default' }],
    configSchema: genericNodeConfigSchema,
    configFields: [
      {
        path: 'connectionString',
        label: 'Connection String',
        type: 'secret',
        required: true,
        placeholder: 'postgresql://user:password@host:5432/database',
        description: 'PostgreSQL connection string',
      },
      {
        path: 'query',
        label: 'SQL Query',
        type: 'textarea',
        required: true,
        rows: 8,
        placeholder: 'SELECT * FROM users WHERE id = {{userId}}',
        description: 'SQL query to execute. Supports {{variable}} syntax.',
      },
      {
        path: 'params',
        label: 'Query Parameters (JSON)',
        type: 'textarea',
        rows: 3,
        placeholder: '{\n  "userId": 123\n}',
        description: 'Parameters for the query (JSON format)',
      },
      {
        path: 'timeout',
        label: 'Timeout (seconds)',
        type: 'number',
        min: 1,
        max: 300,
        placeholder: '30',
        description: 'Query timeout in seconds',
      },
    ],
    implemented: true,
    phase: 0,
  },
  
  // 🚧 STUB
  directusQuery: {
    type: 'directusQuery',
    category: 'data',
    name: 'Directus Query',
    description: 'Query Directus collections',
    icon: 'TableCells',
    color: 'bg-blue-500',
    inputs: [{ id: 'input', name: 'Input', type: 'default' }],
    outputs: [{ id: 'output', name: 'Items', type: 'default' }],
    configSchema: genericNodeConfigSchema,
    implemented: false,
    phase: 3,
  },
  
  // 🚧 STUB
  graphqlQuery: {
    type: 'graphqlQuery',
    category: 'data',
    name: 'GraphQL Query',
    description: 'Execute GraphQL queries',
    icon: 'CodeBracket',
    color: 'bg-blue-500',
    inputs: [{ id: 'input', name: 'Variables', type: 'default' }],
    outputs: [{ id: 'output', name: 'Data', type: 'default' }],
    configSchema: genericNodeConfigSchema,
    implemented: false,
    phase: 3,
  },
  
  // 🚧 STUB
  redisOperation: {
    type: 'redisOperation',
    category: 'data',
    name: 'Redis Cache',
    description: 'Cache operations (get/set/del)',
    icon: 'Square3Stack3d',
    color: 'bg-blue-500',
    inputs: [{ id: 'input', name: 'Input', type: 'default' }],
    outputs: [{ id: 'output', name: 'Result', type: 'default' }],
    configSchema: genericNodeConfigSchema,
    implemented: false,
    phase: 3,
  },
  
  // ============================================================
  // HTTP / EXTERNAL (4 types)
  // ============================================================
  
  // 🚧 STUB
  httpRequest: {
    type: 'httpRequest',
    category: 'http',
    name: 'HTTP Request',
    description: 'Make external API calls',
    icon: 'ArrowRightCircle',
    color: 'bg-orange-500',
    inputs: [{ id: 'input', name: 'Input', type: 'default' }],
    outputs: [{ id: 'output', name: 'Response', type: 'default' }],
    configSchema: genericNodeConfigSchema,
    implemented: false,
    phase: 1,
  },
  
  // 🚧 STUB
  gmailOperation: {
    type: 'gmailOperation',
    category: 'http',
    name: 'Gmail',
    description: 'Send emails via Gmail API',
    icon: 'Envelope',
    color: 'bg-orange-500',
    inputs: [{ id: 'input', name: 'Input', type: 'default' }],
    outputs: [{ id: 'output', name: 'Result', type: 'default' }],
    configSchema: genericNodeConfigSchema,
    implemented: false,
    phase: 5,
  },
  
  // 🚧 STUB
  webhookSend: {
    type: 'webhookSend',
    category: 'http',
    name: 'Send Webhook',
    description: 'Send webhooks with retry',
    icon: 'PaperAirplane',
    color: 'bg-orange-500',
    inputs: [{ id: 'input', name: 'Input', type: 'default' }],
    outputs: [{ id: 'output', name: 'Result', type: 'default' }],
    configSchema: genericNodeConfigSchema,
    implemented: false,
    phase: 5,
  },
  
  // 🚧 STUB
  graphqlMutation: {
    type: 'graphqlMutation',
    category: 'http',
    name: 'GraphQL Mutation',
    description: 'Execute GraphQL mutations',
    icon: 'PencilSquare',
    color: 'bg-orange-500',
    inputs: [{ id: 'input', name: 'Variables', type: 'default' }],
    outputs: [{ id: 'output', name: 'Data', type: 'default' }],
    configSchema: genericNodeConfigSchema,
    implemented: false,
    phase: 3,
  },
  
  // ============================================================
  // CONTROL FLOW (8 types)
  // ============================================================
  
  // ✅ CORE
  condition: {
    type: 'condition',
    category: 'control',
    name: 'Condition (If/Else)',
    description: 'Branch execution based on condition',
    icon: 'ArrowTopRightOnSquare',
    color: 'bg-yellow-500',
    inputs: [{ id: 'input', name: 'Input', type: 'default' }],
    outputs: [
      { id: 'true', name: 'True', type: 'conditional' },
      { id: 'false', name: 'False', type: 'conditional' },
    ],
    configSchema: genericNodeConfigSchema,
    configFields: [
      {
        path: 'condition',
        label: 'Condition Expression',
        type: 'textarea',
        required: true,
        rows: 3,
        placeholder: '{{input.status}} == "active"',
        description: 'Python expression that evaluates to true or false',
      },
      {
        path: 'description',
        label: 'Description',
        type: 'text',
        placeholder: 'Check if user is active',
        description: 'Optional description of what this condition checks',
      },
    ],
    implemented: true,
    phase: 0,
  },
  
  // 🚧 STUB
  switch: {
    type: 'switch',
    category: 'control',
    name: 'Switch',
    description: 'Multi-way branching',
    icon: 'Squares2x2',
    color: 'bg-yellow-500',
    inputs: [{ id: 'input', name: 'Input', type: 'default' }],
    outputs: [
      { id: 'case0', name: 'Case 0', type: 'conditional' },
      { id: 'case1', name: 'Case 1', type: 'conditional' },
      { id: 'default', name: 'Default', type: 'conditional' },
    ],
    configSchema: genericNodeConfigSchema,
    implemented: false,
    phase: 4,
  },
  
  // 🚧 STUB
  loop: {
    type: 'loop',
    category: 'control',
    name: 'Loop',
    description: 'Iterate over items',
    icon: 'ArrowPath',
    color: 'bg-yellow-500',
    inputs: [{ id: 'input', name: 'Items', type: 'default' }],
    outputs: [{ id: 'output', name: 'Results', type: 'default' }],
    configSchema: genericNodeConfigSchema,
    implemented: false,
    phase: 4,
  },
  
  // ✅ CORE
  parallel: {
    type: 'parallel',
    category: 'control',
    name: 'Parallel',
    description: 'Execute nodes in parallel (fan-out)',
    icon: 'ArrowsPointingOut',
    color: 'bg-yellow-500',
    inputs: [{ id: 'input', name: 'Input', type: 'default' }],
    outputs: [{ id: 'output', name: 'Results', type: 'default' }],
    configSchema: genericNodeConfigSchema,
    configFields: [
      {
        path: 'maxConcurrency',
        label: 'Max Concurrency',
        type: 'number',
        min: 1,
        max: 100,
        placeholder: '5',
        description: 'Maximum number of parallel executions (default: unlimited)',
      },
      {
        path: 'failureStrategy',
        label: 'Failure Strategy',
        type: 'select',
        options: [
          { label: 'Fail All (default)', value: 'fail_all' },
          { label: 'Continue on Error', value: 'continue' },
          { label: 'Partial Success OK', value: 'partial' },
        ],
        description: 'How to handle failures in parallel branches',
      },
    ],
    implemented: true,
    phase: 0,
  },
  
  // 🚧 STUB
  aggregate: {
    type: 'aggregate',
    category: 'control',
    name: 'Aggregate',
    description: 'Merge results (fan-in)',
    icon: 'ArrowsPointingIn',
    color: 'bg-yellow-500',
    inputs: [
      { id: 'input1', name: 'Input 1', type: 'default' },
      { id: 'input2', name: 'Input 2', type: 'default' },
    ],
    outputs: [{ id: 'output', name: 'Merged', type: 'default' }],
    configSchema: genericNodeConfigSchema,
    implemented: false,
    phase: 4,
  },
  
  // 🚧 STUB
  retry: {
    type: 'retry',
    category: 'control',
    name: 'Retry',
    description: 'Retry with exponential backoff',
    icon: 'ArrowPathRoundedSquare',
    color: 'bg-yellow-500',
    inputs: [{ id: 'input', name: 'Input', type: 'default' }],
    outputs: [{ id: 'output', name: 'Result', type: 'default' }],
    configSchema: genericNodeConfigSchema,
    implemented: false,
    phase: 4,
  },
  
  // 🚧 STUB
  delay: {
    type: 'delay',
    category: 'control',
    name: 'Delay',
    description: 'Wait for specified duration',
    icon: 'ClockIcon',
    color: 'bg-yellow-500',
    inputs: [{ id: 'input', name: 'Input', type: 'default' }],
    outputs: [{ id: 'output', name: 'Output', type: 'default' }],
    configSchema: genericNodeConfigSchema,
    implemented: false,
    phase: 4,
  },
  
  // 🚧 STUB
  earlyReturn: {
    type: 'earlyReturn',
    category: 'control',
    name: 'Early Return',
    description: 'Exit workflow early',
    icon: 'ArrowUturnLeft',
    color: 'bg-yellow-500',
    inputs: [{ id: 'input', name: 'Input', type: 'default' }],
    outputs: [],
    configSchema: genericNodeConfigSchema,
    implemented: false,
    phase: 4,
  },
  
  // ============================================================
  // TRANSFORM (8 types)
  // ============================================================
  
  // ✅ CORE
  editFields: {
    type: 'editFields',
    category: 'transform',
    name: 'Edit Fields',
    description: 'Set or modify field values',
    icon: 'Wrench',
    color: 'bg-teal-500',
    inputs: [{ id: 'input', name: 'Input', type: 'default' }],
    outputs: [{ id: 'output', name: 'Output', type: 'default' }],
    configSchema: genericNodeConfigSchema,
    configFields: [
      {
        path: 'operations',
        label: 'Field Operations (JSON)',
        type: 'textarea',
        required: true,
        rows: 8,
        placeholder: '[\n  {"field": "status", "value": "active"},\n  {"field": "updatedAt", "value": "{{now}}"}\n]',
        description: 'Array of field operations to perform (JSON format)',
      },
      {
        path: 'mode',
        label: 'Mode',
        type: 'select',
        options: [
          { label: 'Merge (Keep Existing)', value: 'merge' },
          { label: 'Replace (Overwrite All)', value: 'replace' },
        ],
        description: 'How to combine with existing data',
      },
    ],
    implemented: true,
    phase: 0,
  },
  
  // 🚧 STUB
  javascriptFunction: {
    type: 'javascriptFunction',
    category: 'transform',
    name: 'JavaScript Function',
    description: 'Custom JavaScript code',
    icon: 'CodeBracketSquare',
    color: 'bg-teal-500',
    inputs: [{ id: 'input', name: 'Input', type: 'default' }],
    outputs: [{ id: 'output', name: 'Output', type: 'default' }],
    configSchema: genericNodeConfigSchema,
    implemented: false,
    phase: 4,
  },
  
  // 🚧 STUB
  pythonFunction: {
    type: 'pythonFunction',
    category: 'transform',
    name: 'Python Function',
    description: 'Custom Python code',
    icon: 'CodeBracketSquare',
    color: 'bg-teal-500',
    inputs: [{ id: 'input', name: 'Input', type: 'default' }],
    outputs: [{ id: 'output', name: 'Output', type: 'default' }],
    configSchema: genericNodeConfigSchema,
    implemented: false,
    phase: 4,
  },
  
  // 🚧 STUB
  jsonTransform: {
    type: 'jsonTransform',
    category: 'transform',
    name: 'JSON Transform',
    description: 'Transform with JSONata/JMESPath',
    icon: 'CursorArrowRays',
    color: 'bg-teal-500',
    inputs: [{ id: 'input', name: 'Input', type: 'default' }],
    outputs: [{ id: 'output', name: 'Output', type: 'default' }],
    configSchema: genericNodeConfigSchema,
    implemented: false,
    phase: 4,
  },
  
  // 🚧 STUB
  mapArray: {
    type: 'mapArray',
    category: 'transform',
    name: 'Map Array',
    description: 'Transform each array item',
    icon: 'ListBullet',
    color: 'bg-teal-500',
    inputs: [{ id: 'input', name: 'Array', type: 'default' }],
    outputs: [{ id: 'output', name: 'Mapped', type: 'default' }],
    configSchema: genericNodeConfigSchema,
    implemented: false,
    phase: 4,
  },
  
  // 🚧 STUB
  filterArray: {
    type: 'filterArray',
    category: 'transform',
    name: 'Filter Array',
    description: 'Filter array items',
    icon: 'Funnel',
    color: 'bg-teal-500',
    inputs: [{ id: 'input', name: 'Array', type: 'default' }],
    outputs: [{ id: 'output', name: 'Filtered', type: 'default' }],
    configSchema: genericNodeConfigSchema,
    implemented: false,
    phase: 4,
  },
  
  // 🚧 STUB
  reduceArray: {
    type: 'reduceArray',
    category: 'transform',
    name: 'Reduce Array',
    description: 'Reduce array to single value',
    icon: 'FunnelIcon',
    color: 'bg-teal-500',
    inputs: [{ id: 'input', name: 'Array', type: 'default' }],
    outputs: [{ id: 'output', name: 'Result', type: 'default' }],
    configSchema: genericNodeConfigSchema,
    implemented: false,
    phase: 4,
  },
  
  // 🚧 STUB
  splitArray: {
    type: 'splitArray',
    category: 'transform',
    name: 'Split Array',
    description: 'Split array into batches',
    icon: 'Scissors',
    color: 'bg-teal-500',
    inputs: [{ id: 'input', name: 'Array', type: 'default' }],
    outputs: [{ id: 'output', name: 'Batches', type: 'default' }],
    configSchema: genericNodeConfigSchema,
    implemented: false,
    phase: 4,
  },
  
  // ============================================================
  // STREAMING (5 types)
  // ============================================================
  
  // 🚧 STUB
  streamStart: {
    type: 'streamStart',
    category: 'streaming',
    name: 'Stream Start',
    description: 'Begin streaming response',
    icon: 'Signal',
    color: 'bg-pink-500',
    inputs: [{ id: 'input', name: 'Input', type: 'default' }],
    outputs: [{ id: 'output', name: 'Stream', type: 'default' }],
    configSchema: genericNodeConfigSchema,
    implemented: false,
    phase: 2,
  },
  
  // 🚧 STUB
  streamChunk: {
    type: 'streamChunk',
    category: 'streaming',
    name: 'Stream Chunk',
    description: 'Send chunk to client',
    icon: 'DocumentText',
    color: 'bg-pink-500',
    inputs: [{ id: 'input', name: 'Data', type: 'default' }],
    outputs: [{ id: 'output', name: 'Next', type: 'default' }],
    configSchema: genericNodeConfigSchema,
    implemented: false,
    phase: 2,
  },
  
  // 🚧 STUB
  streamEnd: {
    type: 'streamEnd',
    category: 'streaming',
    name: 'Stream End',
    description: 'End streaming response',
    icon: 'StopCircle',
    color: 'bg-pink-500',
    inputs: [{ id: 'input', name: 'Input', type: 'default' }],
    outputs: [],
    configSchema: genericNodeConfigSchema,
    implemented: false,
    phase: 2,
  },
  
  // 🚧 STUB
  streamMerge: {
    type: 'streamMerge',
    category: 'streaming',
    name: 'Stream Merge',
    description: 'Merge multiple streams',
    icon: 'ArrowsRightLeft',
    color: 'bg-pink-500',
    inputs: [
      { id: 'stream1', name: 'Stream 1', type: 'default' },
      { id: 'stream2', name: 'Stream 2', type: 'default' },
    ],
    outputs: [{ id: 'output', name: 'Merged', type: 'default' }],
    configSchema: genericNodeConfigSchema,
    implemented: false,
    phase: 2,
  },
  
  // 🚧 STUB
  streamBuffer: {
    type: 'streamBuffer',
    category: 'streaming',
    name: 'Stream Buffer',
    description: 'Buffer stream chunks',
    icon: 'QueueList',
    color: 'bg-pink-500',
    inputs: [{ id: 'input', name: 'Stream', type: 'default' }],
    outputs: [{ id: 'output', name: 'Buffered', type: 'default' }],
    configSchema: genericNodeConfigSchema,
    implemented: false,
    phase: 2,
  },
  
  // ============================================================
  // UTILITIES (8 types)
  // ============================================================
  
  // 🚧 STUB
  cryptoGenerate: {
    type: 'cryptoGenerate',
    category: 'utilities',
    name: 'Crypto Generate',
    description: 'Generate secure values (UUID, hash, etc.)',
    icon: 'Key',
    color: 'bg-gray-500',
    inputs: [{ id: 'input', name: 'Input', type: 'default' }],
    outputs: [{ id: 'output', name: 'Result', type: 'default' }],
    configSchema: genericNodeConfigSchema,
    implemented: false,
    phase: 5,
  },
  
  // 🚧 STUB
  executionData: {
    type: 'executionData',
    category: 'utilities',
    name: 'Execution Data',
    description: 'Get/set execution context',
    icon: 'InformationCircle',
    color: 'bg-gray-500',
    inputs: [{ id: 'input', name: 'Input', type: 'default' }],
    outputs: [{ id: 'output', name: 'Data', type: 'default' }],
    configSchema: genericNodeConfigSchema,
    implemented: false,
    phase: 1,
  },
  
  // 🚧 STUB
  globalVariable: {
    type: 'globalVariable',
    category: 'utilities',
    name: 'Global Variable',
    description: 'Access global variables',
    icon: 'Variable',
    color: 'bg-gray-500',
    inputs: [{ id: 'input', name: 'Input', type: 'default' }],
    outputs: [{ id: 'output', name: 'Value', type: 'default' }],
    configSchema: genericNodeConfigSchema,
    implemented: false,
    phase: 1,
  },
  
  // 🚧 STUB
  errorHandler: {
    type: 'errorHandler',
    category: 'utilities',
    name: 'Error Handler',
    description: 'Catch and handle errors',
    icon: 'ExclamationTriangle',
    color: 'bg-gray-500',
    inputs: [{ id: 'input', name: 'Input', type: 'default' }],
    outputs: [
      { id: 'success', name: 'Success', type: 'conditional' },
      { id: 'error', name: 'Error', type: 'conditional' },
    ],
    configSchema: genericNodeConfigSchema,
    implemented: false,
    phase: 4,
  },
  
  // ✅ CORE
  log: {
    type: 'log',
    category: 'utilities',
    name: 'Log',
    description: 'Structured logging',
    icon: 'DocumentText',
    color: 'bg-gray-500',
    inputs: [{ id: 'input', name: 'Input', type: 'default' }],
    outputs: [{ id: 'output', name: 'Output', type: 'default' }],
    configSchema: genericNodeConfigSchema,
    configFields: [
      {
        path: 'message',
        label: 'Log Message',
        type: 'textarea',
        required: true,
        rows: 3,
        placeholder: 'User {{userId}} performed action: {{action}}',
        description: 'Message to log. Supports {{variable}} syntax.',
      },
      {
        path: 'level',
        label: 'Log Level',
        type: 'select',
        required: true,
        options: [
          { label: 'DEBUG', value: 'debug' },
          { label: 'INFO', value: 'info' },
          { label: 'WARNING', value: 'warning' },
          { label: 'ERROR', value: 'error' },
          { label: 'CRITICAL', value: 'critical' },
        ],
        description: 'Severity level for this log entry',
      },
      {
        path: 'includeInput',
        label: 'Include Input Data',
        type: 'boolean',
        description: 'Include the input data in the log entry',
      },
    ],
    implemented: true,
    phase: 0,
  },
  
  // 🚧 STUB
  metrics: {
    type: 'metrics',
    category: 'utilities',
    name: 'Metrics',
    description: 'Record performance metrics',
    icon: 'ChartBar',
    color: 'bg-gray-500',
    inputs: [{ id: 'input', name: 'Input', type: 'default' }],
    outputs: [{ id: 'output', name: 'Output', type: 'default' }],
    configSchema: genericNodeConfigSchema,
    implemented: false,
    phase: 6,
  },
  
  // 🚧 STUB
  rateLimit: {
    type: 'rateLimit',
    category: 'utilities',
    name: 'Rate Limit',
    description: 'Check rate limits',
    icon: 'ShieldCheck',
    color: 'bg-gray-500',
    inputs: [{ id: 'input', name: 'Input', type: 'default' }],
    outputs: [
      { id: 'allowed', name: 'Allowed', type: 'conditional' },
      { id: 'blocked', name: 'Blocked', type: 'conditional' },
    ],
    configSchema: genericNodeConfigSchema,
    implemented: false,
    phase: 5,
  },
  
  // 🚧 STUB
  validate: {
    type: 'validate',
    category: 'utilities',
    name: 'Validate',
    description: 'Schema validation',
    icon: 'CheckCircle',
    color: 'bg-gray-500',
    inputs: [{ id: 'input', name: 'Data', type: 'default' }],
    outputs: [
      { id: 'valid', name: 'Valid', type: 'conditional' },
      { id: 'invalid', name: 'Invalid', type: 'conditional' },
    ],
    configSchema: genericNodeConfigSchema,
    implemented: false,
    phase: 4,
  },
};
