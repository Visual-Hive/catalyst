/**
 * @file ConfigSummary.tsx
 * @description Displays concise configuration summary for workflow nodes
 * 
 * @architecture Phase 0, Task 0.5 - Canvas Adaptation
 * @created 2025-12-18
 * @author AI (Cline) + Human Review
 * @confidence 8/10 - Type-specific rendering logic for 55+ node types
 * 
 * @see src/renderer/components/WorkflowCanvas/WorkflowNode.tsx - Consumer
 * @see src/core/workflow/types.ts - Node type definitions
 * 
 * PROBLEM SOLVED:
 * - Users need to see what each node does without opening properties panel
 * - Canvas gets cluttered if nodes show full config
 * - Need consistent, compact display across 55+ node types
 * 
 * SOLUTION:
 * - Extract most important config values per node type
 * - Display 1-2 key properties (e.g., "Model: Claude 3.5" for LLM nodes)
 * - Fallback to generic property count for unknown types
 * - Gray text for stub nodes
 * 
 * DESIGN DECISIONS:
 * - Show only 1-2 most critical config values
 * - Truncate long text to prevent node expansion
 * - Use icons/emojis for visual clarity
 * - Graceful degradation for missing config
 * 
 * @security-critical false
 * @performance-critical false - Simple component rendering
 */

import React from 'react';
import type { NodeType } from '../../../core/workflow/types';

// ============================================================
// TYPES
// ============================================================

/**
 * Props for ConfigSummary component
 */
export interface ConfigSummaryProps {
  /** Node type to determine which config to show */
  type: NodeType;
  /** Node configuration object */
  config: Record<string, any>;
  /** Whether this is a stub node (not yet implemented) */
  isStub?: boolean;
}

// ============================================================
// COMPONENT
// ============================================================

/**
 * ConfigSummary - Displays key configuration for a workflow node
 * 
 * Renders different summaries based on node type:
 * - LLM nodes: Model name
 * - HTTP nodes: Method and path
 * - Data nodes: Collection/table name
 * - Control flow: Condition expression
 * - Transform: Operation type
 * - Stub nodes: Grayed "Not implemented" message
 * 
 * USAGE:
 * ```tsx
 * <ConfigSummary
 *   type="anthropicCompletion"
 *   config={{ model: 'claude-3-5-sonnet-20241022', ... }}
 *   isStub={false}
 * />
 * ```
 * 
 * @param props - Component props
 */
export function ConfigSummary({ type, config, isStub = false }: ConfigSummaryProps) {
  // Stub nodes show generic message
  if (isStub) {
    return (
      <div className="text-xs text-gray-400 italic">
        🚧 Not yet implemented
      </div>
    );
  }
  
  // If config is empty, show placeholder
  if (!config || Object.keys(config).length === 0) {
    return (
      <div className="text-xs text-gray-400">
        No configuration
      </div>
    );
  }
  
  // Render type-specific summary
  const summary = getConfigSummary(type, config);
  
  return (
    <div className="text-xs text-gray-600 space-y-0.5">
      {summary}
    </div>
  );
}

// ============================================================
// HELPER FUNCTIONS
// ============================================================

/**
 * Get configuration summary based on node type
 * 
 * Extracts the most important config values for each node type.
 * Falls back to generic property count if type not recognized.
 * 
 * @param type - Node type identifier
 * @param config - Node configuration object
 * @returns JSX element showing config summary
 */
function getConfigSummary(type: NodeType, config: Record<string, any>): React.ReactNode {
  switch (type) {
    // ============================================================
    // TRIGGERS
    // ============================================================
    
    case 'httpEndpoint':
      return (
        <>
          <div className="font-medium text-green-700">
            {config.method || 'POST'} {truncate(config.path || '/api/endpoint', 20)}
          </div>
          {config.authentication?.type && config.authentication.type !== 'none' && (
            <div>🔒 {config.authentication.type}</div>
          )}
        </>
      );
    
    case 'scheduledTask':
      return (
        <div className="font-mono">
          ⏰ {config.cron || '* * * * *'}
        </div>
      );
    
    case 'webhookReceiver':
      return <div>📥 Receives webhooks</div>;
    
    case 'subworkflowTrigger':
      return <div>🔗 Callable subworkflow</div>;
    
    case 'websocketEndpoint':
      return <div>⚡ WebSocket connection</div>;
    
    case 'queueConsumer':
      return <div>📬 {truncate(config.queue || 'Queue', 15)}</div>;
    
    // ============================================================
    // LLM / AI
    // ============================================================
    
    case 'anthropicCompletion':
      return (
        <>
          <div>🤖 {getModelShortName(config.model || 'claude-3-5-sonnet')}</div>
          {config.stream && <div>📡 Streaming</div>}
        </>
      );
    
    case 'openaiCompletion':
      return (
        <>
          <div>🤖 {getModelShortName(config.model || 'gpt-4')}</div>
          {config.stream && <div>📡 Streaming</div>}
        </>
      );
    
    case 'groqCompletion':
      return <div>⚡ {getModelShortName(config.model || 'mixtral')}</div>;
    
    case 'azureOpenaiCompletion':
      return <div>☁️ Azure OpenAI</div>;
    
    case 'embeddingGenerate':
      return <div>📊 Generate embeddings</div>;
    
    case 'promptTemplate':
      return <div>📝 Template: {truncate(config.template || 'Prompt', 15)}</div>;
    
    case 'agenticToolCall':
      return <div>🛠️ Agentic tools</div>;
    
    case 'llmRouter':
      return <div>🔀 Route to best model</div>;
    
    // ============================================================
    // DATA SOURCES
    // ============================================================
    
    case 'qdrantSearch':
      return (
        <>
          <div>🔍 {truncate(config.collection || 'Collection', 15)}</div>
          {config.limit && <div>Limit: {config.limit}</div>}
        </>
      );
    
    case 'qdrantUpsert':
      return <div>💾 {truncate(config.collection || 'Collection', 15)}</div>;
    
    case 'qdrantScroll':
      return <div>📜 Scroll {truncate(config.collection || 'Collection', 12)}</div>;
    
    case 'qdrantPayload':
      return <div>✏️ Update payload</div>;
    
    case 'postgresQuery':
      return (
        <>
          <div>🗄️ PostgreSQL</div>
          {config.query && <div className="font-mono">{truncate(config.query, 20)}</div>}
        </>
      );
    
    case 'directusQuery':
      return <div>📦 {truncate(config.collection || 'Collection', 15)}</div>;
    
    case 'graphqlQuery':
      return <div>🔷 GraphQL Query</div>;
    
    case 'redisOperation':
      return <div>💨 Redis: {config.operation || 'get'}</div>;
    
    // ============================================================
    // HTTP / EXTERNAL
    // ============================================================
    
    case 'httpRequest':
      return (
        <>
          <div>{config.method || 'GET'} {truncate(config.url || 'URL', 15)}</div>
        </>
      );
    
    case 'gmailOperation':
      return <div>📧 Gmail: {config.operation || 'send'}</div>;
    
    case 'webhookSend':
      return <div>📤 Send webhook</div>;
    
    case 'graphqlMutation':
      return <div>🔷 GraphQL Mutation</div>;
    
    // ============================================================
    // CONTROL FLOW
    // ============================================================
    
    case 'condition':
      return (
        <div className="font-mono">
          {truncate(config.expression || 'condition', 18)}
        </div>
      );
    
    case 'switch':
      return <div>🔀 {config.cases?.length || 0} cases</div>;
    
    case 'loop':
      return <div>🔁 Loop over items</div>;
    
    case 'parallel':
      return <div>⚡ Run in parallel</div>;
    
    case 'aggregate':
      return <div>🔗 Merge results</div>;
    
    case 'retry':
      return <div>🔄 Max {config.maxRetries || 3} retries</div>;
    
    case 'delay':
      return <div>⏱️ {config.duration || 1000}ms</div>;
    
    case 'earlyReturn':
      return <div>↩️ Return early</div>;
    
    // ============================================================
    // TRANSFORM
    // ============================================================
    
    case 'editFields':
      return <div>✏️ {config.fields ? Object.keys(config.fields).length : 0} fields</div>;
    
    case 'javascriptFunction':
      return <div>📜 JavaScript</div>;
    
    case 'pythonFunction':
      return <div>🐍 Python</div>;
    
    case 'jsonTransform':
      return <div>🔄 Transform JSON</div>;
    
    case 'mapArray':
      return <div>🗺️ Map array</div>;
    
    case 'filterArray':
      return <div>🔍 Filter array</div>;
    
    case 'reduceArray':
      return <div>📉 Reduce array</div>;
    
    case 'splitArray':
      return <div>✂️ Split array</div>;
    
    // ============================================================
    // STREAMING
    // ============================================================
    
    case 'streamStart':
      return <div>▶️ Start stream</div>;
    
    case 'streamChunk':
      return <div>📦 Send chunk</div>;
    
    case 'streamEnd':
      return <div>⏹️ End stream</div>;
    
    case 'streamMerge':
      return <div>🔗 Merge streams</div>;
    
    case 'streamBuffer':
      return <div>📚 Buffer stream</div>;
    
    // ============================================================
    // UTILITIES
    // ============================================================
    
    case 'cryptoGenerate':
      return <div>🔑 {config.type || 'Generate'}</div>;
    
    case 'executionData':
      return <div>ℹ️ Execution data</div>;
    
    case 'globalVariable':
      return <div>🌐 {truncate(config.variable || 'Variable', 15)}</div>;
    
    case 'errorHandler':
      return <div>⚠️ Handle errors</div>;
    
    case 'log':
      return (
        <div>
          📋 {config.level || 'info'}: {truncate(config.message || 'Log', 15)}
        </div>
      );
    
    case 'metrics':
      return <div>📊 Record metrics</div>;
    
    case 'rateLimit':
      return <div>🛡️ {config.requests || 100} req/{config.window || '1m'}</div>;
    
    case 'validate':
      return <div>✅ Validate schema</div>;
    
    // ============================================================
    // DEFAULT (Unknown node type)
    // ============================================================
    
    default:
      // For unknown node types, show property count
      const propCount = Object.keys(config).length;
      return (
        <div className="text-gray-400">
          {propCount} {propCount === 1 ? 'property' : 'properties'}
        </div>
      );
  }
}

/**
 * Truncate text to specified length with ellipsis
 * 
 * @param text - Text to truncate
 * @param maxLength - Maximum length before truncation
 * @returns Truncated text with ellipsis if needed
 */
function truncate(text: string, maxLength: number): string {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 1) + '…';
}

/**
 * Extract short model name from full model identifier
 * 
 * Examples:
 * - "claude-3-5-sonnet-20241022" → "Claude 3.5 Sonnet"
 * - "gpt-4-turbo-preview" → "GPT-4 Turbo"
 * - "mixtral-8x7b-32768" → "Mixtral 8x7B"
 * 
 * @param model - Full model identifier
 * @returns Human-readable short name
 */
function getModelShortName(model: string): string {
  if (!model) return 'Model';
  
  // Claude models
  if (model.includes('claude-3-5-sonnet')) return 'Claude 3.5 Sonnet';
  if (model.includes('claude-3-sonnet')) return 'Claude 3 Sonnet';
  if (model.includes('claude-3-opus')) return 'Claude 3 Opus';
  if (model.includes('claude-3-haiku')) return 'Claude 3 Haiku';
  if (model.includes('claude')) return 'Claude';
  
  // OpenAI models
  if (model.includes('gpt-4-turbo')) return 'GPT-4 Turbo';
  if (model.includes('gpt-4')) return 'GPT-4';
  if (model.includes('gpt-3.5-turbo')) return 'GPT-3.5 Turbo';
  if (model.includes('gpt-3.5')) return 'GPT-3.5';
  
  // Groq / other models
  if (model.includes('mixtral-8x7b')) return 'Mixtral 8x7B';
  if (model.includes('mixtral')) return 'Mixtral';
  if (model.includes('llama-3')) return 'Llama 3';
  if (model.includes('llama')) return 'Llama';
  
  // Fallback: capitalize first letter
  return model.charAt(0).toUpperCase() + model.slice(1);
}

export default ConfigSummary;
