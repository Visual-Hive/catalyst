/**
 * @file ReactCodeGenerator.ts
 * @description PHASE 2 FEATURE: React/Frontend Code Generator (Currently Dormant)
 * 
 * ⚠️ STATUS: ON STANDBY - Not used by current Catalyst workflow system
 * 
 * This file generates React/JSX code from component manifests (.lowcode/manifest.json).
 * It's part of the Rise component builder system, preserved for Phase 2 full-stack integration.
 * 
 * PHASE 2 INTEGRATION:
 * - Will be reactivated when frontend builder is enabled
 * - Generates React components from visual component tree
 * - Pairs with Python backend generation for full-stack apps
 * 
 * @see .implementation/future-tasks/phase-2-frontend-builder.md - Integration roadmap
 * @see src/renderer/store/manifestStore.ts - Component manifest store (also dormant)
 * @see src/core/codegen/python/ - Active backend code generation (Phase 1)
 *
 * @architecture Phase 3, Task 3.1 - React Code Generator (Original Rise)
 * @created 2025-11-27
 * @author AI (Cline) + Human Review
 * @confidence 8/10 - Proven system from Rise, functional but dormant
 *
 * @see docs/legacy-rise/SCHEMA_LEVELS.md - Level 1 feature boundaries
 * @see docs/legacy-rise/FILE_STRUCTURE_SPEC.md - Generated file structure
 * @see src/core/codegen/types.ts - Type definitions
 *
 * PROBLEM SOLVED:
 * - Orchestrate the complete code generation pipeline
 * - Generate single component or entire manifest
 * - Integrate Prettier for consistent formatting
 * - Return structured results with success/error info
 * - Validate manifests before generation
 *
 * SOLUTION:
 * - Instantiate all builder classes
 * - Process components through pipeline:
 *   1. ImportBuilder -> imports
 *   2. PropsBuilder -> props destructuring
 *   3. JSXBuilder -> JSX element tree
 *   4. CommentHeaderBuilder -> @lowcode markers
 *   5. CodeAssembler -> combine all parts
 *   6. Prettier -> format output
 * - Return GenerationResult with complete info
 *
 * LEVEL 1 RESTRICTIONS ENFORCED:
 * - No useState, useEffect, or other hooks
 * - No event handlers (onClick, onChange, etc.)
 * - No expressions beyond prop interpolation
 * - Only static className (no conditional classes)
 *
 * @security-critical false
 * @performance-critical true - Target <100ms for 50 components (when activated)
 */

import * as prettier from 'prettier';
import type { Component, Manifest } from '../legacy-manifest/types';
import type {
  GenerationOptions,
  GenerationResult,
  BatchGenerationResult,
  BuilderContext,
  IAsyncBuilder,
} from './types';
import { DEFAULT_GENERATION_OPTIONS } from './types';
import { ImportBuilder } from './ImportBuilder';
import { PropsBuilder } from './PropsBuilder';
import { JSXBuilder } from './JSXBuilder';
import { CommentHeaderBuilder } from './CommentHeaderBuilder';
import { CodeAssembler } from './CodeAssembler';

/**
 * ReactCodeGenerator is the main entry point for code generation
 *
 * USAGE:
 * ```typescript
 * const generator = new ReactCodeGenerator();
 *
 * // Generate single component
 * const result = await generator.generateComponent(component, manifest);
 *
 * // Generate all components
 * const results = await generator.generateAll(manifest);
 * ```
 *
 * PIPELINE:
 * 1. Build imports (React + child components)
 * 2. Build props destructuring with defaults
 * 3. Build JSX element tree
 * 4. Build comment header with @lowcode markers
 * 5. Assemble all parts into complete file
 * 6. Format with Prettier
 *
 * ERROR HANDLING:
 * - Returns Result types instead of throwing
 * - Partial failures allowed in batch mode
 * - Detailed error info in GenerationResult
 */
export class ReactCodeGenerator implements IAsyncBuilder<BuilderContext, GenerationResult> {
  /**
   * Builder instances (created once, reused)
   */
  private importBuilder: ImportBuilder;
  private propsBuilder: PropsBuilder;
  private jsxBuilder: JSXBuilder;
  private commentBuilder: CommentHeaderBuilder;
  private assembler: CodeAssembler;

  /**
   * Default generation options
   */
  private defaultOptions: Required<GenerationOptions>;

  /**
   * Create a new ReactCodeGenerator instance
   *
   * @param options - Default options for all generations
   */
  constructor(options?: GenerationOptions) {
    // Initialize all builders
    this.importBuilder = new ImportBuilder();
    this.propsBuilder = new PropsBuilder();
    this.jsxBuilder = new JSXBuilder();
    this.commentBuilder = new CommentHeaderBuilder();
    this.assembler = new CodeAssembler();

    // Merge provided options with defaults
    this.defaultOptions = {
      ...DEFAULT_GENERATION_OPTIONS,
      ...options,
      prettierConfig: {
        ...DEFAULT_GENERATION_OPTIONS.prettierConfig,
        ...options?.prettierConfig,
      },
    };
  }

  /**
   * Build/generate code for a component (implements IAsyncBuilder)
   *
   * @param context - The builder context
   * @returns Promise<GenerationResult> with generated code
   */
  async build(context: BuilderContext): Promise<GenerationResult> {
    return this.generateComponent(context.component, context.manifest, context.options);
  }

  /**
   * Generate React code for a single component
   *
   * @param component - The component to generate
   * @param manifest - Full manifest (for child lookups)
   * @param options - Generation options (uses defaults if not provided)
   * @returns Promise<GenerationResult> with generated code or error
   *
   * @example
   * ```typescript
   * const result = await generator.generateComponent(buttonComponent, manifest);
   * if (result.success) {
   *   console.log(result.code);
   *   console.log(`Generated: ${result.filepath}`);
   * }
   * ```
   */
  async generateComponent(
    component: Component,
    manifest: Manifest,
    options?: GenerationOptions
  ): Promise<GenerationResult> {
    // Start timing
    const startTime = performance.now();

    // Merge options
    const mergedOptions: Required<GenerationOptions> = {
      ...this.defaultOptions,
      ...options,
      prettierConfig: {
        ...this.defaultOptions.prettierConfig,
        ...options?.prettierConfig,
      },
    };

    // Create builder context
    // Check if component has onClick event binding (Level 1.5 - Task 4.4 / Task 4.6 fix)
    // If so, component needs to accept onClick prop and forward it to root element
    // NOTE: The relationship is stored in flow.trigger.componentId, NOT in component.events
    // We search through flows to find any that target this component
    let hasOnClickEvent = false;
    if (manifest.flows) {
      const onClickFlow = Object.values(manifest.flows).find(
        flow => flow.trigger.componentId === component.id && flow.trigger.type === 'onClick'
      );
      hasOnClickEvent = !!onClickFlow;
    }
    
    const context: BuilderContext = {
      component,
      manifest,
      options: mergedOptions,
      indentLevel: 0,
      // When component has onClick event, it receives onClick as a prop from App.jsx
      // and forwards it to the root element: onClick={onClick}
      onClickHandler: hasOnClickEvent ? 'onClick' : undefined,
    };

    try {
      // Phase 1: Build imports
      const importResult = this.importBuilder.build(context);

      // Phase 2: Build props
      const propsResult = this.propsBuilder.build(context);

      // Phase 3: Build JSX
      const jsxResult = this.jsxBuilder.build(context);

      // Phase 4: Build comment header
      const commentResult = this.commentBuilder.build(context);

      // Phase 5: Assemble all parts
      const assemblyResult = this.assembler.build({
        parts: {
          imports: importResult.code,
          commentHeader: commentResult.code,
          componentName: component.displayName,
          props: propsResult.code,
          jsx: jsxResult.code,
        },
        options: mergedOptions,
      });

      // Phase 6: Format with Prettier
      let formattedCode: string;
      try {
        formattedCode = await this.formatWithPrettier(assemblyResult.code, mergedOptions);
      } catch (formatError) {
        // If Prettier fails, return unformatted code with warning
        console.warn(
          `[ReactCodeGenerator] Prettier formatting failed for ${component.displayName}:`,
          formatError
        );
        formattedCode = assemblyResult.code;
      }

      // Calculate duration
      const durationMs = performance.now() - startTime;

      return {
        success: true,
        componentId: component.id,
        componentName: component.displayName,
        code: formattedCode,
        filename: assemblyResult.filename,
        filepath: assemblyResult.filepath,
        metadata: {
          generatedAt: commentResult.timestamp,
          level: 1,
          durationMs,
        },
      };
    } catch (error) {
      // Calculate duration even on error
      const durationMs = performance.now() - startTime;

      // Determine which phase failed
      const errorMessage = error instanceof Error ? error.message : String(error);
      const phase = this.determineErrorPhase(errorMessage);

      return {
        success: false,
        componentId: component.id,
        componentName: component.displayName,
        code: '',
        filename: '',
        filepath: '',
        error: errorMessage,
        errorDetails: {
          phase,
          originalError: errorMessage,
        },
        metadata: {
          generatedAt: new Date().toISOString(),
          level: 1,
          durationMs,
        },
      };
    }
  }

  /**
   * Generate React code for all components in a manifest
   *
   * @param manifest - Full manifest with components
   * @param options - Generation options
   * @returns Promise<BatchGenerationResult> with all results
   *
   * @example
   * ```typescript
   * const results = await generator.generateAll(manifest);
   * console.log(`Success: ${results.successCount}/${results.results.length}`);
   * if (!results.success) {
   *   console.log('Failures:', results.failures);
   * }
   * ```
   */
  async generateAll(
    manifest: Manifest,
    options?: GenerationOptions
  ): Promise<BatchGenerationResult> {
    const startTime = performance.now();
    const results: GenerationResult[] = [];
    const failures: Array<{ componentId: string; componentName: string; error: string }> = [];

    // Get all components from manifest
    const components = Object.values(manifest.components);

    // Generate each component
    for (const component of components) {
      const result = await this.generateComponent(component, manifest, options);
      results.push(result);

      // Track failures
      if (!result.success) {
        failures.push({
          componentId: result.componentId,
          componentName: result.componentName,
          error: result.error || 'Unknown error',
        });
      }
    }

    // Calculate totals
    const successCount = results.filter((r) => r.success).length;
    const failureCount = results.length - successCount;
    const totalDurationMs = performance.now() - startTime;

    return {
      success: failureCount === 0,
      results,
      successCount,
      failureCount,
      totalDurationMs,
      failures,
    };
  }

  /**
   * Generate React code for specific components by ID
   *
   * @param componentIds - Array of component IDs to generate
   * @param manifest - Full manifest
   * @param options - Generation options
   * @returns Promise<BatchGenerationResult>
   */
  async generateSelected(
    componentIds: string[],
    manifest: Manifest,
    options?: GenerationOptions
  ): Promise<BatchGenerationResult> {
    const startTime = performance.now();
    const results: GenerationResult[] = [];
    const failures: Array<{ componentId: string; componentName: string; error: string }> = [];

    // Generate each selected component
    for (const componentId of componentIds) {
      const component = manifest.components[componentId];

      if (!component) {
        // Component not found in manifest
        failures.push({
          componentId,
          componentName: 'Unknown',
          error: `Component "${componentId}" not found in manifest`,
        });
        results.push({
          success: false,
          componentId,
          componentName: 'Unknown',
          code: '',
          filename: '',
          filepath: '',
          error: `Component "${componentId}" not found in manifest`,
          metadata: {
            generatedAt: new Date().toISOString(),
            level: 1,
          },
        });
        continue;
      }

      const result = await this.generateComponent(component, manifest, options);
      results.push(result);

      if (!result.success) {
        failures.push({
          componentId: result.componentId,
          componentName: result.componentName,
          error: result.error || 'Unknown error',
        });
      }
    }

    // Calculate totals
    const successCount = results.filter((r) => r.success).length;
    const failureCount = results.length - successCount;
    const totalDurationMs = performance.now() - startTime;

    return {
      success: failureCount === 0,
      results,
      successCount,
      failureCount,
      totalDurationMs,
      failures,
    };
  }

  /**
   * Format code with Prettier
   *
   * @param code - Raw code to format
   * @param options - Generation options with Prettier config
   * @returns Promise<string> with formatted code
   */
  private async formatWithPrettier(
    code: string,
    options: Required<GenerationOptions>
  ): Promise<string> {
    const prettierOptions = {
      parser: 'babel' as const,
      ...options.prettierConfig,
    };

    return prettier.format(code, prettierOptions);
  }

  /**
   * Determine which phase caused an error (for debugging)
   *
   * @param errorMessage - The error message
   * @returns The phase that likely failed
   */
  private determineErrorPhase(
    errorMessage: string
  ): 'validation' | 'import' | 'props' | 'jsx' | 'assembly' | 'format' {
    const lower = errorMessage.toLowerCase();

    if (lower.includes('import') || lower.includes('child')) {
      return 'import';
    }
    if (lower.includes('prop') || lower.includes('property')) {
      return 'props';
    }
    if (lower.includes('jsx') || lower.includes('element')) {
      return 'jsx';
    }
    if (lower.includes('assemble') || lower.includes('combine')) {
      return 'assembly';
    }
    if (lower.includes('format') || lower.includes('prettier')) {
      return 'format';
    }

    return 'validation';
  }

  /**
   * Update default options for this generator instance
   *
   * @param options - New options to merge
   */
  setOptions(options: GenerationOptions): void {
    this.defaultOptions = {
      ...this.defaultOptions,
      ...options,
      prettierConfig: {
        ...this.defaultOptions.prettierConfig,
        ...options.prettierConfig,
      },
    };
  }

  /**
   * Get current options
   */
  getOptions(): Required<GenerationOptions> {
    return { ...this.defaultOptions };
  }
}

/**
 * Factory function to create ReactCodeGenerator instance
 */
export function createReactCodeGenerator(options?: GenerationOptions): ReactCodeGenerator {
  return new ReactCodeGenerator(options);
}

/**
 * Quick helper to generate a single component
 *
 * @param component - Component to generate
 * @param manifest - Full manifest
 * @param options - Optional generation options
 * @returns Promise<GenerationResult>
 */
export async function generateComponent(
  component: Component,
  manifest: Manifest,
  options?: GenerationOptions
): Promise<GenerationResult> {
  const generator = new ReactCodeGenerator(options);
  return generator.generateComponent(component, manifest);
}

/**
 * Quick helper to generate all components in a manifest
 *
 * @param manifest - Full manifest
 * @param options - Optional generation options
 * @returns Promise<BatchGenerationResult>
 */
export async function generateAllComponents(
  manifest: Manifest,
  options?: GenerationOptions
): Promise<BatchGenerationResult> {
  const generator = new ReactCodeGenerator(options);
  return generator.generateAll(manifest);
}
