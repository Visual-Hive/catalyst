/**
 * @file index.ts
 * @description Module exports for React code generation (Level 1 - MVP)
 *
 * @architecture Phase 3, Task 3.1 - React Code Generator
 * @created 2025-11-27
 * @author AI (Cline) + Human Review
 * @confidence 9/10 - Simple re-exports
 *
 * @see docs/SCHEMA_LEVELS.md - Level 1 feature boundaries
 * @see src/core/codegen/types.ts - Type definitions
 *
 * USAGE:
 * ```typescript
 * import {
 *   ReactCodeGenerator,
 *   generateComponent,
 *   generateAllComponents,
 * } from '../core/codegen';
 *
 * // Create generator
 * const generator = new ReactCodeGenerator();
 *
 * // Or use helper functions
 * const result = await generateComponent(component, manifest);
 * ```
 */

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type {
  // Generation options and results
  GenerationOptions,
  GenerationResult,
  BatchGenerationResult,
  // Builder types
  BuilderContext,
  ImportBuildResult,
  PropsBuildResult,
  JSXBuildResult,
  CommentHeaderBuildResult,
  CodeParts,
  // Interfaces
  IBuilder,
  IAsyncBuilder,
} from './types';

// ============================================================================
// CONSTANT EXPORTS
// ============================================================================

export {
  // Default options
  DEFAULT_GENERATION_OPTIONS,
  // HTML constants
  SELF_CLOSING_TAGS,
  RESERVED_PROP_NAMES,
  PROP_NAME_MAPPINGS,
  BOOLEAN_ATTRIBUTES,
  ELEMENT_ATTRIBUTES,
  TEXT_CONTENT_PROPS,
  COMMENT_MARKERS,
  // Type guards
  isStaticProperty,
  isPropProperty,
  isSelfClosingTag,
  isBooleanAttribute,
  isTextContentProp,
  isElementAttribute,
  // Utility functions
  getPropertyValue,
  getPropertyDataType,
} from './types';

// ============================================================================
// BUILDER EXPORTS
// ============================================================================

export { ImportBuilder, createImportBuilder } from './ImportBuilder';
export { PropsBuilder, createPropsBuilder } from './PropsBuilder';
export { JSXBuilder, createJSXBuilder } from './JSXBuilder';
export {
  CommentHeaderBuilder,
  createCommentHeaderBuilder,
  generateCommentHeader,
  parseCommentHeader,
} from './CommentHeaderBuilder';
export {
  CodeAssembler,
  createCodeAssembler,
  assembleCode,
  type AssemblerInput,
  type AssemblerOutput,
} from './CodeAssembler';

// ============================================================================
// MAIN GENERATOR EXPORTS
// ============================================================================

export {
  ReactCodeGenerator,
  createReactCodeGenerator,
  generateComponent,
  generateAllComponents,
} from './ReactCodeGenerator';
