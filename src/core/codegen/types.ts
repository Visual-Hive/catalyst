/**
 * @file types.ts
 * @description Type definitions for the React code generation system (Level 1 - MVP)
 *
 * @architecture Phase 3, Task 3.1 - React Code Generator
 * @created 2025-11-27
 * @author AI (Cline) + Human Review
 * @confidence 9/10 - Well-defined types based on existing manifest types
 *
 * @see docs/SCHEMA_LEVELS.md - Level 1 feature boundaries
 * @see docs/FILE_STRUCTURE_SPEC.md - Comment marker format
 * @see src/core/manifest/types.ts - Manifest type definitions
 *
 * PROBLEM SOLVED:
 * - Type-safe code generation pipeline
 * - Clear contracts between builder classes
 * - Result types for error handling
 * - Constants for special cases (self-closing tags, etc.)
 *
 * SOLUTION:
 * - Import and extend existing manifest types
 * - Define GenerationResult for success/error outcomes
 * - Define BuilderContext for shared state between builders
 * - Export constants for self-closing HTML elements
 *
 * LEVEL 1 RESTRICTIONS:
 * - No hooks (useState, useEffect, etc.)
 * - No event handlers (onClick, onChange, etc.)
 * - No expressions ({{ state.value }})
 * - Only static props with defaults
 *
 * @security-critical false
 * @performance-critical false
 */

import type {
  Component,
  ComponentProperty,
  Manifest,
  StaticProperty,
  PropProperty,
} from '../manifest/types';

// ============================================================================
// GENERATION OPTIONS
// ============================================================================

/**
 * Options for configuring code generation behavior
 *
 * USAGE:
 * ```typescript
 * const options: GenerationOptions = {
 *   prettierConfig: { semi: true, singleQuote: true },
 *   includeDefaultExport: true,
 *   componentPath: 'src/components',
 * };
 * ```
 */
export interface GenerationOptions {
  /**
   * Prettier configuration for formatting output
   * These options are passed directly to Prettier
   */
  prettierConfig?: {
    semi?: boolean; // Use semicolons (default: true)
    singleQuote?: boolean; // Use single quotes (default: true)
    tabWidth?: number; // Spaces per indentation (default: 2)
    trailingComma?: 'none' | 'es5' | 'all'; // Trailing commas (default: 'es5')
    printWidth?: number; // Line width before wrap (default: 80)
    jsxSingleQuote?: boolean; // Single quotes in JSX (default: false)
  };

  /**
   * Whether to include `export default ComponentName;` at end of file
   * Default: true
   */
  includeDefaultExport?: boolean;

  /**
   * Base path for component files (used for import calculations)
   * Default: 'src/components'
   */
  componentPath?: string;

  /**
   * File extension for generated components
   * Default: '.jsx'
   */
  fileExtension?: '.jsx' | '.tsx';

  /**
   * Whether to include React import (might not be needed with new JSX transform)
   * Default: true
   */
  includeReactImport?: boolean;
}

/**
 * Default generation options
 * Used when no options are provided
 */
export const DEFAULT_GENERATION_OPTIONS: Required<GenerationOptions> = {
  prettierConfig: {
    semi: true,
    singleQuote: true,
    tabWidth: 2,
    trailingComma: 'es5',
    printWidth: 80,
    jsxSingleQuote: false,
  },
  includeDefaultExport: true,
  componentPath: 'src/components',
  fileExtension: '.jsx',
  includeReactImport: true,
};

// ============================================================================
// GENERATION RESULTS
// ============================================================================

/**
 * Result of generating a single component
 *
 * DESIGN DECISION: Return Result type instead of throwing
 * - More explicit error handling
 * - Allows batch processing with partial failures
 * - Clearer success/failure states
 *
 * USAGE:
 * ```typescript
 * const result = await generator.generateComponent(component, manifest);
 * if (result.success) {
 *   fs.writeFileSync(result.filepath, result.code);
 * } else {
 *   console.error(`Failed: ${result.error}`);
 * }
 * ```
 */
export interface GenerationResult {
  /**
   * Whether generation succeeded
   */
  success: boolean;

  /**
   * Component ID from manifest
   */
  componentId: string;

  /**
   * Component display name (used for function name)
   */
  componentName: string;

  /**
   * Generated React code (empty string if failed)
   */
  code: string;

  /**
   * Suggested filename for the component
   * e.g., "Button.jsx"
   */
  filename: string;

  /**
   * Full filepath relative to project root
   * e.g., "src/components/Button.jsx"
   */
  filepath: string;

  /**
   * Error message if generation failed
   */
  error?: string;

  /**
   * Detailed error information for debugging
   */
  errorDetails?: {
    phase: 'validation' | 'import' | 'props' | 'jsx' | 'assembly' | 'format';
    originalError?: string;
  };

  /**
   * Generation metadata
   */
  metadata: {
    /**
     * Timestamp when code was generated (ISO string)
     */
    generatedAt: string;

    /**
     * Schema level (always 1 for MVP)
     */
    level: 1;

    /**
     * Duration of generation in milliseconds
     */
    durationMs?: number;
  };
}

/**
 * Result of generating all components in a manifest
 */
export interface BatchGenerationResult {
  /**
   * Whether all components generated successfully
   */
  success: boolean;

  /**
   * Individual results for each component
   */
  results: GenerationResult[];

  /**
   * Count of successful generations
   */
  successCount: number;

  /**
   * Count of failed generations
   */
  failureCount: number;

  /**
   * Total duration in milliseconds
   */
  totalDurationMs: number;

  /**
   * Components that failed (for quick access)
   */
  failures: Array<{
    componentId: string;
    componentName: string;
    error: string;
  }>;
}

// ============================================================================
// BUILDER CONTEXT
// ============================================================================

/**
 * Shared context passed between builder classes
 * Contains the full manifest and current component being processed
 *
 * DESIGN DECISION: Use context object instead of passing multiple params
 * - Easier to extend with new data
 * - Single source of truth for component relationships
 * - Cleaner builder interfaces
 */
export interface BuilderContext {
  /**
   * The component being generated
   */
  component: Component;

  /**
   * Full manifest (needed for child component lookups)
   */
  manifest: Manifest;

  /**
   * Generation options
   */
  options: Required<GenerationOptions>;

  /**
   * Current indentation level (for JSX formatting)
   * 0 = root level
   */
  indentLevel: number;
}

// ============================================================================
// BUILDER OUTPUT TYPES
// ============================================================================

/**
 * Output from ImportBuilder
 */
export interface ImportBuildResult {
  /**
   * Complete import section as a string
   * e.g., "import React from 'react';\nimport { Button } from './Button';"
   */
  code: string;

  /**
   * List of imported component names (for debugging/analysis)
   */
  importedComponents: string[];
}

/**
 * Output from PropsBuilder
 */
export interface PropsBuildResult {
  /**
   * Props destructuring syntax
   * e.g., "{ label = 'Click me', disabled = false }"
   * Empty string if no props
   */
  code: string;

  /**
   * List of prop names (for analysis)
   */
  propNames: string[];

  /**
   * Whether component has any props
   */
  hasProps: boolean;
}

/**
 * Output from JSXBuilder
 */
export interface JSXBuildResult {
  /**
   * Complete JSX element tree
   * e.g., "<button className=\"btn\">{label}</button>"
   */
  code: string;

  /**
   * Whether the element is self-closing
   */
  isSelfClosing: boolean;

  /**
   * List of child components rendered
   */
  childComponents: string[];
}

/**
 * Output from CommentHeaderBuilder
 */
export interface CommentHeaderBuildResult {
  /**
   * Complete comment block
   */
  code: string;

  /**
   * Timestamp used in the header
   */
  timestamp: string;
}

/**
 * Parts collected for final assembly
 */
export interface CodeParts {
  /**
   * Import statements
   */
  imports: string;

  /**
   * Comment header with @lowcode markers
   */
  commentHeader: string;

  /**
   * Component function name (PascalCase)
   */
  componentName: string;

  /**
   * Props destructuring (may be empty)
   */
  props: string;

  /**
   * JSX body
   */
  jsx: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * HTML elements that are self-closing (void elements)
 * These elements cannot have children and should render as <tag />
 *
 * Reference: https://developer.mozilla.org/en-US/docs/Glossary/Void_element
 */
export const SELF_CLOSING_TAGS = new Set([
  'area',
  'base',
  'br',
  'col',
  'embed',
  'hr',
  'img',
  'input',
  'link',
  'meta',
  'param', // Deprecated but still void
  'source',
  'track',
  'wbr',
]);

/**
 * Reserved prop names that need special handling
 * These are either JavaScript reserved words or have special meaning in React
 */
export const RESERVED_PROP_NAMES = new Set([
  'class', // Use className in React
  'for', // Use htmlFor in React
  'default', // JavaScript reserved word
  'switch', // JavaScript reserved word
  'case', // JavaScript reserved word
]);

/**
 * Props that map to different JSX attributes
 */
export const PROP_NAME_MAPPINGS: Record<string, string> = {
  class: 'className',
  for: 'htmlFor',
};

/**
 * HTML attributes that accept boolean values
 * These render differently: <input disabled /> vs <input disabled="true" />
 */
export const BOOLEAN_ATTRIBUTES = new Set([
  'allowFullScreen',
  'async',
  'autoComplete',
  'autoFocus',
  'autoPlay',
  'checked',
  'controls',
  'default',
  'defer',
  'disabled',
  'formNoValidate',
  'hidden',
  'loop',
  'multiple',
  'muted',
  'noValidate',
  'open',
  'playsInline',
  'readOnly',
  'required',
  'reversed',
  'selected',
  'spellCheck',
]);

/**
 * Props that should be rendered directly on JSX elements (not as text content)
 * These are standard HTML attributes
 */
export const ELEMENT_ATTRIBUTES = new Set([
  'id',
  'className',
  'style',
  'title',
  'href',
  'src',
  'alt',
  'type',
  'name',
  'value',
  'placeholder',
  'disabled',
  'checked',
  'readOnly',
  'required',
  'min',
  'max',
  'step',
  'pattern',
  'maxLength',
  'minLength',
  'rows',
  'cols',
  'autoComplete',
  'autoFocus',
  'tabIndex',
  'target',
  'rel',
  'download',
  'role',
  'aria-label',
  'aria-hidden',
  'aria-describedby',
  'data-testid',
]);

/**
 * Props that typically represent text content to render inside element
 * These values are rendered as {propName} children
 */
export const TEXT_CONTENT_PROPS = new Set([
  'label',
  'text',
  'content',
  'children',
  'title', // Can be both attribute and content depending on element
]);

/**
 * Comment marker constants used in generated code
 * These markers enable bidirectional sync and code tracking
 *
 * Reference: docs/FILE_STRUCTURE_SPEC.md
 */
export const COMMENT_MARKERS = {
  /**
   * Indicates file is auto-generated by Rise
   */
  GENERATED: '@lowcode:generated',

  /**
   * Links to component ID in manifest
   */
  COMPONENT_ID: '@lowcode:component-id',

  /**
   * Schema level (1, 2, or 3)
   */
  LEVEL: '@lowcode:level',

  /**
   * Last generation timestamp
   */
  LAST_GENERATED: '@lowcode:last-generated',

  /**
   * Warning message for developers
   */
  DO_NOT_EDIT: 'DO NOT EDIT: This file is auto-generated. Changes will be overwritten.',
} as const;

// ============================================================================
// TYPE GUARDS
// ============================================================================

/**
 * Type guard to check if a property is a StaticProperty
 */
export function isStaticProperty(prop: ComponentProperty): prop is StaticProperty {
  return prop.type === 'static';
}

/**
 * Type guard to check if a property is a PropProperty
 */
export function isPropProperty(prop: ComponentProperty): prop is PropProperty {
  return prop.type === 'prop';
}

/**
 * Check if an HTML tag is self-closing
 */
export function isSelfClosingTag(tagName: string): boolean {
  return SELF_CLOSING_TAGS.has(tagName.toLowerCase());
}

/**
 * Check if a prop name is a boolean attribute
 */
export function isBooleanAttribute(propName: string): boolean {
  return BOOLEAN_ATTRIBUTES.has(propName);
}

/**
 * Check if a prop name typically represents text content
 */
export function isTextContentProp(propName: string): boolean {
  return TEXT_CONTENT_PROPS.has(propName);
}

/**
 * Check if a prop name is a standard HTML/React attribute
 */
export function isElementAttribute(propName: string): boolean {
  return ELEMENT_ATTRIBUTES.has(propName);
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

/**
 * Extracts the actual value from a ComponentProperty
 * Works with both StaticProperty and PropProperty
 */
export function getPropertyValue(prop: ComponentProperty): unknown {
  if (isStaticProperty(prop)) {
    return prop.value;
  }
  if (isPropProperty(prop)) {
    return prop.default;
  }
  return undefined;
}

/**
 * Gets the data type of a property
 */
export function getPropertyDataType(prop: ComponentProperty): string {
  return prop.dataType;
}

/**
 * Builder interface - all builders implement this pattern
 */
export interface IBuilder<TInput, TOutput> {
  /**
   * Build the output from input context
   */
  build(context: TInput): TOutput;
}

/**
 * Async builder interface for operations that may need async processing
 */
export interface IAsyncBuilder<TInput, TOutput> {
  /**
   * Build the output from input context
   */
  build(context: TInput): Promise<TOutput>;
}
