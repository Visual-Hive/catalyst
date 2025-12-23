/**
 * @file types.ts
 * @description Core type definitions for Catalyst workflow manifests (Python/FastAPI code generation)
 * 
 * @architecture Phase 0, Task 0.2 - Manifest Schema Design
 * @created 2025-12-18
 * @author AI (Cline) + Human Review
 * @confidence 8/10 - Comprehensive type system, needs real-world testing
 * 
 * @see docs/Catalyst documentation/CATALYST_SPECIFICATION.md - Complete specification
 * @see docs/Catalyst documentation/CATALYST_PHASE_0_TASKS.md - Task 0.2 details
 * 
 * PROBLEM SOLVED:
 * - Need type-safe manifest structure for Python workflow generation
 * - Support 55+ node types (triggers, LLM, data, control flow, transforms, etc.)
 * - Enable visual workflow design → clean Python/FastAPI code
 * - Replace React component system with server-side workflow system
 * 
 * SOLUTION:
 * - Comprehensive TypeScript interfaces for workflow manifests
 * - 55+ node types organized by category
 * - Expression system with {{ template }} syntax
 * - Factory functions for common operations
 * - Full implementation for 10 core nodes, stubs for remaining 45+
 * 
 * CORE NODE TYPES (FULLY IMPLEMENTED):
 * - Triggers (2): httpEndpoint, scheduledTask
 * - LLM (2): anthropicCompletion, openaiCompletion
 * - Data (2): qdrantSearch, postgresQuery
 * - Control (2): condition, parallel
 * - Transform (1): editFields
 * - Utilities (1): log
 * 
 * REMAINING NODES (STUBBED):
 * - 45+ additional node types defined in enum for future expansion
 * 
 * @security-critical false
 * @performance-critical false
 */

// ============================================================
// NODE TYPE DEFINITIONS
// ============================================================

/**
 * All supported node types in Catalyst
 * Organized by category for clarity and maintainability
 * 
 * CORE NODES (10): Fully implemented with config interfaces
 * STUB NODES (45+): Defined for future implementation
 */
export type NodeType =
  // ===== TRIGGERS (6 types) =====
  | 'httpEndpoint'        // CORE: REST API endpoint
  | 'webhookReceiver'     // TODO: Phase 1
  | 'scheduledTask'       // CORE: Cron-based execution
  | 'subworkflowTrigger'  // TODO: Phase 2
  | 'websocketEndpoint'   // TODO: Phase 2
  | 'queueConsumer'       // TODO: Phase 3
  
  // ===== LLM / AI (8 types) =====
  | 'anthropicCompletion' // CORE: Claude API calls
  | 'openaiCompletion'    // CORE: OpenAI/GPT API calls
  | 'groqCompletion'      // TODO: Phase 2
  | 'azureOpenaiCompletion' // TODO: Phase 2
  | 'embeddingGenerate'   // TODO: Phase 2
  | 'promptTemplate'      // TODO: Phase 2
  | 'agenticToolCall'     // TODO: Phase 5
  | 'llmRouter'           // TODO: Phase 5
  
  // ===== DATA SOURCES (8 types) =====
  | 'qdrantSearch'        // CORE: Vector similarity search
  | 'qdrantUpsert'        // TODO: Phase 3
  | 'qdrantScroll'        // TODO: Phase 3
  | 'qdrantPayload'       // TODO: Phase 3
  | 'postgresQuery'       // CORE: SQL database queries
  | 'directusQuery'       // TODO: Phase 3
  | 'graphqlQuery'        // TODO: Phase 3
  | 'redisOperation'      // TODO: Phase 3
  
  // ===== HTTP / EXTERNAL (4 types) =====
  | 'httpRequest'         // TODO: Phase 1
  | 'gmailOperation'      // TODO: Phase 5
  | 'webhookSend'         // TODO: Phase 5
  | 'graphqlMutation'     // TODO: Phase 3
  
  // ===== CONTROL FLOW (8 types) =====
  | 'condition'           // CORE: If/else branching
  | 'switch'              // TODO: Phase 4
  | 'loop'                // TODO: Phase 4
  | 'parallel'            // CORE: Fan-out execution
  | 'aggregate'           // TODO: Phase 4
  | 'retry'               // TODO: Phase 4
  | 'delay'               // TODO: Phase 4
  | 'earlyReturn'         // TODO: Phase 4
  
  // ===== TRANSFORM (8 types) =====
  | 'editFields'          // CORE: Set/modify fields
  | 'javascriptFunction'  // TODO: Phase 4
  | 'pythonFunction'      // TODO: Phase 4
  | 'jsonTransform'       // TODO: Phase 4
  | 'mapArray'            // TODO: Phase 4
  | 'filterArray'         // TODO: Phase 4
  | 'reduceArray'         // TODO: Phase 4
  | 'splitArray'          // TODO: Phase 4
  
  // ===== STREAMING (5 types) =====
  | 'streamStart'         // TODO: Phase 2
  | 'streamChunk'         // TODO: Phase 2
  | 'streamEnd'           // TODO: Phase 2
  | 'streamMerge'         // TODO: Phase 2
  | 'streamBuffer'        // TODO: Phase 2
  
  // ===== UTILITIES (8 types) =====
  | 'cryptoGenerate'      // TODO: Phase 5
  | 'executionData'       // TODO: Phase 1
  | 'globalVariable'      // TODO: Phase 1
  | 'errorHandler'        // TODO: Phase 4
  | 'log'                 // CORE: Structured logging
  | 'metrics'             // TODO: Phase 6
  | 'rateLimit'           // TODO: Phase 5
  | 'validate';           // TODO: Phase 4

/**
 * Trigger types that can start a workflow
 * Subset of NodeType
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
// EXPRESSION VALUE TYPES
// ============================================================

/**
 * Static value - literal value known at design time
 * 
 * @example
 * { type: 'static', value: 'Hello, World!' }
 * { type: 'static', value: 42 }
 * { type: 'static', value: true }
 */
export interface StaticValue {
  type: 'static';
  value: string | number | boolean | object | null;
}

/**
 * Expression value - evaluated at runtime using {{ template }} syntax
 * 
 * @example
 * { type: 'expression', expression: '{{ input.query }}' }
 * { type: 'expression', expression: '{{ nodes.node_search.output.results }}' }
 * { type: 'expression', expression: '{{ env.API_KEY }}' }
 */
export interface ExpressionValue {
  type: 'expression';
  expression: string; // Must contain {{ ... }}
}

/**
 * Union of all value types
 * Allows inline primitives for convenience
 */
export type ConfigValue = StaticValue | ExpressionValue | string | number | boolean;

// ============================================================
// CORE INTERFACES
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
  ttl: number;  // Time to live in seconds
  key: string;  // Expression for cache key (e.g., "{{ input.query }}")
}

/**
 * Pinned data configuration for node testing
 * Allows "freezing" JSON data on nodes for testing without running full workflow
 * 
 * @see .implementation/Catalyst_tasks/phase-2.5-developer-experience/task-2.13-node-pinning.md
 */
export interface PinnedDataConfig {
  /** Whether pinned data is enabled (only used in TEST mode) */
  enabled: boolean;
  
  /** The JSON data to use instead of executing node */
  data: any;
  
  /** ISO timestamp when data was pinned */
  timestamp: string;
}

/**
 * Base node interface - all nodes extend this
 * 
 * This is the foundation for all 55+ node types.
 * Type-specific configuration goes in the `config` object.
 */
export interface BaseNode {
  id: string;                    // Unique node ID
  type: NodeType;                // Node type from NodeType enum
  name: string;                  // Display name for this node
  description?: string;          // Optional description
  position: NodePosition;        // Position on canvas
  config: Record<string, any>;   // Type-specific configuration
  timeout?: number;              // Node-specific timeout (ms)
  retries?: number;              // Node-specific retry count
  cache?: NodeCacheConfig;       // Optional caching
  onError?: 'throw' | 'continue' | 'fallback';  // Error handling strategy
  fallbackValue?: any;           // Value to use if onError is 'fallback'
  pinnedData?: PinnedDataConfig; // Pinned test data (Phase 2.5, Task 2.13)
}

/**
 * Node definition (currently just BaseNode, but allows future extension)
 */
export type NodeDefinition = BaseNode;

/**
 * Edge connecting two nodes
 * Represents data flow in the workflow
 */
export interface EdgeDefinition {
  id: string;                    // Unique edge ID
  source: string;                // Source node ID
  target: string;                // Target node ID
  sourceHandle?: string;         // Source output handle (for multi-output nodes)
  targetHandle?: string;         // Target input handle (for multi-input nodes)
  condition?: string;            // Optional condition expression
}

// ============================================================
// TRIGGER CONFIGURATIONS (CORE)
// ============================================================

/**
 * HTTP endpoint trigger configuration
 * CORE: Fully implemented
 */
export interface HttpEndpointTriggerConfig {
  method: HttpMethod;
  path: string;                  // e.g., "/api/v1/search"
  authentication?: {
    type: AuthType;
    config?: Record<string, any>;
  };
  rateLimit?: {
    requests: number;            // Max requests
    window: string;              // Time window (e.g., "1m", "1h")
  };
  validation?: {
    body?: object;               // JSON Schema for body validation
    query?: object;              // JSON Schema for query params
    headers?: object;            // JSON Schema for headers
  };
}

/**
 * Scheduled task trigger configuration
 * CORE: Fully implemented
 */
export interface ScheduledTriggerConfig {
  cron: string;                  // Cron expression (e.g., "0 * * * *")
  timezone?: string;             // Timezone (e.g., "America/New_York")
  preventOverlap?: boolean;      // Prevent concurrent executions
}

/**
 * Webhook receiver trigger configuration
 * TODO: Phase 1
 */
export interface WebhookTriggerConfig {
  secret?: string;               // Webhook secret for validation
  validation?: {
    headers?: Record<string, string>;
  };
}

/**
 * Union of all trigger configs
 */
export type TriggerConfig =
  | HttpEndpointTriggerConfig
  | ScheduledTriggerConfig
  | WebhookTriggerConfig
  | Record<string, any>;         // For stub triggers

/**
 * Trigger definition
 */
export interface TriggerDefinition {
  type: TriggerType;
  config: TriggerConfig;
}

// ============================================================
// NODE CONFIGURATIONS (CORE - 10 types)
// ============================================================

/**
 * Anthropic (Claude) completion node configuration
 * CORE: Fully implemented
 */
export interface AnthropicCompletionConfig {
  model: string;                 // e.g., "claude-sonnet-4-5-20250514"
  messages: Array<{
    role: 'user' | 'assistant' | 'system';
    content: string;             // Supports expressions
  }>;
  systemPrompt?: string;
  maxTokens?: number;
  temperature?: number;
  streaming?: boolean;           // Enable streaming responses
  tools?: Array<{
    name: string;
    description: string;
    inputSchema: object;
  }>;
  cache?: {
    enabled: boolean;
    breakpoints?: string[];      // Prompt caching breakpoints
  };
}

/**
 * OpenAI completion node configuration
 * CORE: Fully implemented
 */
export interface OpenAICompletionConfig {
  model: string;                 // e.g., "gpt-4"
  messages: Array<{
    role: 'user' | 'assistant' | 'system';
    content: string;
  }>;
  maxTokens?: number;
  temperature?: number;
  streaming?: boolean;
  functions?: Array<{
    name: string;
    description: string;
    parameters: object;
  }>;
}

/**
 * Embedding generation node configuration
 * CORE: Fully implemented (Phase 2, Task 2.5)
 */
export interface EmbeddingGenerateConfig {
  provider: 'openai' | 'voyage';  // Embedding provider
  model: string;                  // e.g., "text-embedding-3-small", "voyage-2"
  input: string | string[];       // Single text or array of texts
  dimensions?: number;            // Optional dimension override (OpenAI only)
  batchSize?: number;             // Max texts per request (default: 100)
}

/**
 * Prompt template node configuration
 * CORE: Fully implemented (Phase 2, Task 2.6)
 */
export interface PromptTemplateConfig {
  system?: string;                // Optional system message template
  messages: Array<{               // Message templates (REQUIRED)
    role: 'system' | 'user' | 'assistant';
    content: string;              // Template with {{ }} expressions
  }>;
  variables?: Record<string, ConfigValue>;  // Additional variables for interpolation
}

/**
 * LLM Router node configuration
 * CORE: Fully implemented (Phase 2, Task 2.7)
 * 
 * Intelligently routes LLM requests to different providers based on
 * conditions like cost, speed, quality, or custom logic. Enables
 * cost optimization and performance tuning.
 */
export interface LLMRouterConfig {
  strategy?: 'cost' | 'speed' | 'quality' | 'balanced' | 'custom';  // Preset or custom routing
  routes: Array<{                 // Routing rules (evaluated in order)
    condition: string;            // Expression or "always"
    provider: 'anthropic' | 'openai' | 'groq';  // Target provider
    model: string;                // Model to use for this provider
  }>;
  fallback: {                     // Default when no conditions match
    provider: 'anthropic' | 'openai' | 'groq';
    model: string;
  };
  messages: Array<{               // Messages to route
    role: 'system' | 'user' | 'assistant';
    content: string;              // Supports expressions
  }>;
  system?: string;                // Optional system prompt
  max_tokens?: number;            // Optional max tokens
  temperature?: number;           // Optional temperature
}

/**
 * Qdrant vector search configuration
 * CORE: Fully implemented
 */
export interface QdrantSearchConfig {
  collection: string;            // Qdrant collection name
  queryVector: string;           // Expression resolving to vector array
  limit?: number;                // Max results
  scoreThreshold?: number;       // Min similarity score
  filter?: object;               // Qdrant filter syntax
  withPayload?: boolean | string[];
  withVectors?: boolean;
}

/**
 * PostgreSQL query configuration
 * CORE: Fully implemented
 */
export interface PostgresQueryConfig {
  query: string;                 // SQL query (supports expressions)
  params?: Array<ConfigValue>;   // Query parameters
  transaction?: boolean;         // Run in transaction
}

/**
 * Condition (if/else) node configuration
 * CORE: Fully implemented
 */
export interface ConditionConfig {
  expression: string;            // Boolean expression to evaluate
  trueTarget?: string;           // Node ID to execute if true
  falseTarget?: string;          // Node ID to execute if false
}

/**
 * Parallel execution node configuration
 * CORE: Fully implemented
 */
export interface ParallelConfig {
  mode: 'all' | 'race' | 'allSettled';  // Execution mode
  timeout?: number;              // Overall timeout (ms)
  children: string[];            // Node IDs to execute in parallel
}

/**
 * Edit fields transform configuration
 * CORE: Fully implemented
 */
export interface EditFieldsConfig {
  fields: Record<string, ConfigValue>;  // Fields to set/modify
  mode?: 'merge' | 'replace';    // How to apply changes
}

/**
 * Log node configuration
 * CORE: Fully implemented
 */
export interface LogConfig {
  level: 'debug' | 'info' | 'warn' | 'error';
  message: string;               // Log message (supports expressions)
  data?: Record<string, ConfigValue>;  // Additional data to log
}

// ============================================================
// WORKFLOW DEFINITION
// ============================================================

/**
 * Input field definition for workflow
 */
export interface InputField {
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  required?: boolean;
  default?: any;
  description?: string;
  validation?: object;           // JSON Schema
}

/**
 * Output definition for workflow
 */
export interface OutputDefinition {
  type: 'json' | 'stream';       // Response type
  format?: 'sse' | 'websocket' | 'ndjson';  // Streaming format
  events?: string[];             // Event types for streaming
  schema?: object;               // Output JSON Schema
}

/**
 * Execution configuration for workflow
 */
export interface ExecutionConfig {
  timeout?: number;              // Workflow timeout (ms)
  retries?: number;              // Retry count
  retryDelay?: number;           // Delay between retries (ms)
  retryBackoff?: 'linear' | 'exponential';  // Backoff strategy
}

/**
 * Complete workflow definition
 * 
 * A workflow is a sequence of nodes connected by edges,
 * triggered by an event (HTTP request, schedule, webhook, etc.).
 */
export interface WorkflowDefinition {
  id: string;                    // Unique workflow ID
  name: string;                  // Human-readable name
  description?: string;          // Optional description
  trigger: TriggerDefinition;    // How this workflow starts
  input: Record<string, InputField>;  // Input parameters
  output: OutputDefinition;      // Output format
  nodes: Record<string, NodeDefinition>;  // All nodes in workflow
  edges: EdgeDefinition[];       // Connections between nodes
  executionConfig?: ExecutionConfig;  // Execution settings
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
  createdAt: string;             // ISO datetime
  updatedAt: string;             // ISO datetime
}

/**
 * Runtime configuration
 */
export interface RuntimeConfig {
  runtime: 'python';             // Only Python in Phase 0
  pythonVersion: string;         // e.g., "3.11"
  framework: 'fastapi';          // Only FastAPI in Phase 0
  port: number;                  // Server port
  cors?: {
    origins: string[];           // CORS origins
    methods: string[];           // Allowed methods
  };
  executionReceiverPort?: number;  // Port for execution logging receiver (default: 3000)
}

/**
 * Execution logging configuration
 * Controls how and when workflow executions are logged
 */
export interface ExecutionLoggingConfig {
  /** Master toggle for execution logging */
  enabled: boolean;
  
  /** 
   * Number of days to keep execution history
   * 0 = keep forever
   * Automatic cleanup runs on logger initialization
   */
  retentionDays: number;
  
  /** 
   * Which executions to log
   * - 'all': Log all executions (default)
   * - 'success': Only log successful executions
   * - 'error': Only log failed executions
   */
  logLevel: 'all' | 'success' | 'error';
  
  /** 
   * Optional: Maximum executions to keep per workflow
   * Oldest are deleted when limit is exceeded
   * 0 or undefined = no limit
   */
  maxExecutionsPerWorkflow?: number;
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
 * Top-level Catalyst workflow manifest
 * 
 * This is the complete project structure that gets saved to
 * `.catalyst/manifest.json` and generates Python/FastAPI code.
 */
export interface CatalystManifest {
  schemaVersion: string;         // e.g., "1.0.0"
  projectType: 'workflow';       // Only workflow type in Phase 0
  metadata: ProjectMetadata;
  config: RuntimeConfig;
  secrets: Record<string, SecretDefinition>;
  globalVariables: Record<string, any>;
  workflows: Record<string, WorkflowDefinition>;
  sharedNodes?: Record<string, NodeDefinition>;  // Reusable nodes
  executionLogging?: ExecutionLoggingConfig;     // Execution logging config (Phase 2.5)
}

// ============================================================
// FACTORY FUNCTIONS
// ============================================================

/**
 * Create empty Catalyst manifest
 * 
 * @returns New manifest with default configuration
 * 
 * @example
 * ```typescript
 * const manifest = createEmptyManifest();
 * manifest.metadata.projectName = 'My Project';
 * ```
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
      executionReceiverPort: 3000,
    },
    secrets: {},
    globalVariables: {},
    workflows: {},
    executionLogging: {
      enabled: true,
      retentionDays: 30,
      logLevel: 'all',
    },
  };
}

/**
 * Create new workflow definition
 * 
 * @param id - Unique workflow ID
 * @param name - Human-readable name
 * @param triggerType - Trigger type (default: httpEndpoint)
 * @returns New workflow definition
 * 
 * @example
 * ```typescript
 * const workflow = createWorkflow('search', 'Conference Search');
 * workflow.trigger.config = {
 *   method: 'POST',
 *   path: '/api/v1/search',
 * };
 * ```
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
 * 
 * @param type - Node type
 * @returns Unique node ID
 * 
 * @example
 * generateNodeId('anthropicCompletion') // "node_anthropicCompletion_1703001234567_a1b2"
 */
export function generateNodeId(type: NodeType): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 6);
  return `node_${type}_${timestamp}_${random}`;
}

/**
 * Generate unique edge ID
 * 
 * @returns Unique edge ID
 * 
 * @example
 * generateEdgeId() // "edge_1703001234567_c3d4"
 */
export function generateEdgeId(): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 6);
  return `edge_${timestamp}_${random}`;
}

/**
 * Generate unique workflow ID from name
 * 
 * @param name - Workflow name
 * @returns Unique workflow ID
 * 
 * @example
 * generateWorkflowId('Conference Search') // "wf_conference_search_1703001234567"
 */
export function generateWorkflowId(name: string): string {
  // Convert to lowercase, replace special chars with nothing, spaces with underscore
  // Then clean up any consecutive underscores
  const slug = name.toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')  // Remove special characters, keep spaces
    .replace(/\s+/g, '_')          // Replace spaces with underscores
    .replace(/_+/g, '_')           // Clean up consecutive underscores
    .replace(/^_|_$/g, '');        // Remove leading/trailing underscores
  const timestamp = Date.now();
  return `wf_${slug}_${timestamp}`;
}

/**
 * Create a new node definition
 * 
 * @param type - Node type
 * @param name - Display name
 * @param position - Position on canvas
 * @param config - Node-specific configuration
 * @returns New node definition
 * 
 * @example
 * ```typescript
 * const node = createNode(
 *   'anthropicCompletion',
 *   'Analyze Results',
 *   { x: 400, y: 200 },
 *   {
 *     model: 'claude-sonnet-4-5-20250514',
 *     messages: [{ role: 'user', content: '{{ input.query }}' }],
 *   }
 * );
 * ```
 */
export function createNode(
  type: NodeType,
  name: string,
  position: NodePosition,
  config: Record<string, any> = {}
): NodeDefinition {
  return {
    id: generateNodeId(type),
    type,
    name,
    position,
    config,
  };
}

/**
 * Create a new edge definition
 * 
 * @param source - Source node ID
 * @param target - Target node ID
 * @param condition - Optional condition expression
 * @returns New edge definition
 * 
 * @example
 * const edge = createEdge('node_1', 'node_2');
 * const conditionalEdge = createEdge('node_1', 'node_2', '{{ result.success }}');
 */
export function createEdge(
  source: string,
  target: string,
  condition?: string
): EdgeDefinition {
  return {
    id: generateEdgeId(),
    source,
    target,
    condition,
  };
}

// Note: isExpression() is exported from expressions.ts
// Removed from here to avoid naming conflict in index.ts
