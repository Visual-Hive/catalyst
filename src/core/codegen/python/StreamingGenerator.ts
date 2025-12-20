/**
 * @file StreamingGenerator.ts
 * @description Generator for Python streaming utilities (SSE support)
 * 
 * @architecture Phase 2, Task 2.1 - Streaming Infrastructure
 * @created 2025-12-20
 * @author AI (Cline) + Human Review
 * @confidence 9/10 - Simple orchestration of templates
 * 
 * @see docs/Catalyst documentation/CATALYST_PHASE_2_TASKS.md - Task 2.1
 * @see src/core/codegen/python/templates/streaming.py.ts - Python templates
 * @see .implementation/Catalyst_tasks/phase-2-llm-integration/task-2.1-streaming-infrastructure.md
 * 
 * PROBLEM SOLVED:
 * - Orchestrate generation of streaming.py module
 * - Provide clean API for generating streaming utilities
 * - Return structured results with metadata
 * - Similar to ReactCodeGenerator pattern
 * 
 * SOLUTION:
 * - Import template functions from streaming.py.ts
 * - Generate complete Python module
 * - Return result with success/error info
 * - Include file path and metadata
 * 
 * USAGE:
 * ```typescript
 * const generator = new StreamingGenerator();
 * const result = generator.generateStreamingModule();
 * 
 * if (result.success) {
 *   console.log('Generated streaming.py');
 *   console.log(result.filepath);
 * }
 * ```
 * 
 * DESIGN DECISIONS:
 * - Mirror ReactCodeGenerator API for consistency
 * - Return Result type instead of throwing
 * - Include generation metadata (timestamp, duration)
 * - Simple single-method API (only one file to generate)
 * 
 * @security-critical false
 * @performance-critical false - Called once during project setup
 */

import {
  generateStreamingModule,
  getStreamingDependencies,
  generateStreamingExample,
} from './templates/streaming.py';

/**
 * Result of streaming module generation
 * 
 * Similar to GenerationResult from React code generation,
 * but simplified since we only generate one file.
 */
export interface StreamingGenerationResult {
  success: boolean;
  code: string;
  filename: string;
  filepath: string;
  dependencies: string[];
  error?: string;
  metadata: {
    generatedAt: string;
    durationMs?: number;
  };
}

/**
 * Options for streaming generation
 * 
 * Currently minimal, but extensible for future needs
 */
export interface StreamingGenerationOptions {
  outputDir?: string;  // Default: 'utils' or root
  includeExamples?: boolean;  // Generate example file
}

/**
 * Default options
 */
const DEFAULT_OPTIONS: Required<StreamingGenerationOptions> = {
  outputDir: 'utils',
  includeExamples: false,
};

/**
 * StreamingGenerator generates Python streaming utilities
 * 
 * This generator creates the streaming.py module that provides
 * SSE (Server-Sent Events) utilities for FastAPI endpoints.
 * 
 * USAGE:
 * ```typescript
 * const generator = new StreamingGenerator();
 * 
 * // Generate streaming.py
 * const result = generator.generateStreamingModule();
 * 
 * // Get dependencies for requirements.txt
 * const deps = generator.getDependencies();
 * 
 * // Get example code for documentation
 * const example = generator.generateExample();
 * ```
 * 
 * GENERATED FILES:
 * - streaming.py - SSE utilities module
 * - streaming_example.py - Usage examples (optional)
 * 
 * DEPENDENCIES:
 * - fastapi>=0.104.0
 * - orjson>=3.9.0
 * 
 * @class StreamingGenerator
 */
export class StreamingGenerator {
  private options: Required<StreamingGenerationOptions>;

  /**
   * Create new StreamingGenerator instance
   * 
   * @param options - Generation options
   */
  constructor(options?: StreamingGenerationOptions) {
    // Merge with defaults
    this.options = {
      ...DEFAULT_OPTIONS,
      ...options,
    };
  }

  /**
   * Generate streaming.py module
   * 
   * Creates complete Python module with SSE utilities:
   * - format_sse(): Format data as SSE event
   * - streaming_response(): Wrap generator with headers
   * - stream_tokens(): Stream LLM tokens
   * - stream_partial_results(): Stream parallel operations
   * 
   * @returns StreamingGenerationResult with generated code
   * 
   * @example
   * ```typescript
   * const result = generator.generateStreamingModule();
   * if (result.success) {
   *   await fs.writeFile(result.filepath, result.code);
   * }
   * ```
   */
  generateStreamingModule(): StreamingGenerationResult {
    // Start timing
    const startTime = performance.now();

    try {
      // Generate Python code from template
      const code = generateStreamingModule();

      // Calculate file path
      const filename = 'streaming.py';
      const filepath = this.options.outputDir 
        ? `${this.options.outputDir}/${filename}`
        : filename;

      // Get dependencies
      const dependencies = getStreamingDependencies();

      // Calculate duration
      const durationMs = performance.now() - startTime;

      return {
        success: true,
        code,
        filename,
        filepath,
        dependencies,
        metadata: {
          generatedAt: new Date().toISOString(),
          durationMs,
        },
      };
    } catch (error) {
      // Handle generation error
      const errorMessage = error instanceof Error ? error.message : String(error);
      const durationMs = performance.now() - startTime;

      return {
        success: false,
        code: '',
        filename: 'streaming.py',
        filepath: '',
        dependencies: [],
        error: errorMessage,
        metadata: {
          generatedAt: new Date().toISOString(),
          durationMs,
        },
      };
    }
  }

  /**
   * Generate example file showing streaming usage
   * 
   * Creates streaming_example.py with usage examples
   * for documentation and testing purposes.
   * 
   * @returns StreamingGenerationResult with example code
   */
  generateExampleFile(): StreamingGenerationResult {
    const startTime = performance.now();

    try {
      // Generate example code
      const code = generateStreamingExample();

      // Calculate file path
      const filename = 'streaming_example.py';
      const filepath = this.options.outputDir
        ? `${this.options.outputDir}/${filename}`
        : filename;

      const durationMs = performance.now() - startTime;

      return {
        success: true,
        code,
        filename,
        filepath,
        dependencies: [], // Same as main module
        metadata: {
          generatedAt: new Date().toISOString(),
          durationMs,
        },
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const durationMs = performance.now() - startTime;

      return {
        success: false,
        code: '',
        filename: 'streaming_example.py',
        filepath: '',
        dependencies: [],
        error: errorMessage,
        metadata: {
          generatedAt: new Date().toISOString(),
          durationMs,
        },
      };
    }
  }

  /**
   * Get streaming dependencies for requirements.txt
   * 
   * Returns Python package requirements needed for streaming.
   * 
   * @returns Array of dependency strings
   * 
   * @example
   * ```typescript
   * const deps = generator.getDependencies();
   * // ['fastapi>=0.104.0', 'orjson>=3.9.0']
   * ```
   */
  getDependencies(): string[] {
    return getStreamingDependencies();
  }

  /**
   * Get current options
   * 
   * @returns Current generation options
   */
  getOptions(): Required<StreamingGenerationOptions> {
    return { ...this.options };
  }

  /**
   * Update options
   * 
   * @param options - New options to merge
   */
  setOptions(options: StreamingGenerationOptions): void {
    this.options = {
      ...this.options,
      ...options,
    };
  }
}

/**
 * Factory function to create StreamingGenerator instance
 * 
 * @param options - Generation options
 * @returns New StreamingGenerator instance
 */
export function createStreamingGenerator(
  options?: StreamingGenerationOptions
): StreamingGenerator {
  return new StreamingGenerator(options);
}

/**
 * Quick helper to generate streaming module
 * 
 * @param options - Optional generation options
 * @returns StreamingGenerationResult
 */
export function generateStreaming(
  options?: StreamingGenerationOptions
): StreamingGenerationResult {
  const generator = new StreamingGenerator(options);
  return generator.generateStreamingModule();
}

/**
 * Quick helper to get streaming dependencies
 * 
 * @returns Array of dependency strings
 */
export function getStreamingDeps(): string[] {
  return getStreamingDependencies();
}
