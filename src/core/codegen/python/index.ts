/**
 * @file index.ts
 * @description Main entry point for Python code generation
 * 
 * @architecture Phase 2, Task 2.1 - Streaming Infrastructure
 * @created 2025-12-20
 * @author AI (Cline) + Human Review
 * @confidence 10/10 - Simple export aggregation
 * 
 * @see src/core/codegen/python/StreamingGenerator.ts
 * @see src/core/codegen/python/templates/streaming.py.ts
 * 
 * USAGE:
 * ```typescript
 * import { StreamingGenerator, generateStreaming } from '@/core/codegen/python';
 * 
 * const generator = new StreamingGenerator();
 * const result = generator.generateStreamingModule();
 * ```
 */

// Export StreamingGenerator and related types/functions
export {
  StreamingGenerator,
  createStreamingGenerator,
  generateStreaming,
  getStreamingDeps,
  type StreamingGenerationResult,
  type StreamingGenerationOptions,
} from './StreamingGenerator';

// Export template functions for advanced usage
export {
  generateStreamingModule,
  getStreamingDependencies,
  generateStreamingExample,
} from './templates/streaming.py';

// Export LLM node templates
export {
  generateAnthropicNode,
  getAnthropicDependencies,
  generateAnthropicExample,
  generateOpenAINode,
  getOpenAIDependencies,
  generateOpenAIExample,
  generateGroqNode,
  getGroqDependencies,
  generateGroqExample,
  generateEmbeddingNode,
  getEmbeddingDependencies,
  generateEmbeddingExample,
  generatePromptTemplateNode,
  getPromptTemplateDependencies,
  generatePromptTemplateExample,
  generateLLMRouterNode,
  getLLMRouterDependencies,
  generateLLMRouterExample,
} from './nodes/llm';
