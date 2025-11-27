/**
 * @file CommentHeaderBuilder.ts
 * @description Builds @lowcode comment header blocks for generated React components (Level 1 - MVP)
 *
 * @architecture Phase 3, Task 3.1 - React Code Generator
 * @created 2025-11-27
 * @author AI (Cline) + Human Review
 * @confidence 9/10 - Simple string formatting, well-defined format
 *
 * @see docs/FILE_STRUCTURE_SPEC.md - Comment marker format
 * @see src/core/codegen/types.ts - COMMENT_MARKERS constants
 *
 * PROBLEM SOLVED:
 * - Generate standardized comment headers for generated files
 * - Include markers for bidirectional sync tracking
 * - Identify auto-generated code vs user-written code
 * - Link generated file back to manifest component
 *
 * SOLUTION:
 * - Generate JSDoc-style comment block
 * - Include all required @lowcode markers
 * - Include "DO NOT EDIT" warning for users
 * - Timestamp generation for change detection
 *
 * MARKERS INCLUDED:
 * - @lowcode:generated - Indicates file is auto-generated
 * - @lowcode:component-id - Links to manifest component
 * - @lowcode:level - Schema level (1 for MVP)
 * - @lowcode:last-generated - ISO timestamp
 *
 * @security-critical false
 * @performance-critical false
 */

import type { BuilderContext, CommentHeaderBuildResult, IBuilder } from './types';
import { COMMENT_MARKERS } from './types';

/**
 * CommentHeaderBuilder generates the @lowcode comment header for generated files
 *
 * USAGE:
 * ```typescript
 * const builder = new CommentHeaderBuilder();
 * const result = builder.build(context);
 * // result.code contains the full comment block
 * ```
 *
 * OUTPUT FORMAT:
 * ```
 * /**
 *  * @lowcode:generated
 *  * @lowcode:component-id: comp_button_001
 *  * @lowcode:level: 1
 *  * @lowcode:last-generated: 2025-11-27T12:00:00.000Z
 *  * DO NOT EDIT: This file is auto-generated. Changes will be overwritten.
 *  *\/
 * ```
 *
 * PURPOSE OF MARKERS:
 * - GENERATED: Allows tooling to identify auto-generated files
 * - COMPONENT_ID: Links file to source manifest component
 * - LEVEL: Indicates schema version for compatibility
 * - LAST_GENERATED: Enables change detection and freshness checks
 */
export class CommentHeaderBuilder implements IBuilder<BuilderContext, CommentHeaderBuildResult> {
  /**
   * Build comment header for a component
   *
   * @param context - The builder context containing component
   * @returns CommentHeaderBuildResult with generated comment block
   *
   * @example
   * ```typescript
   * const result = builder.build(context);
   * // result.code = '/**\n * @lowcode:generated\n * ...\n *\/'
   * // result.timestamp = '2025-11-27T12:00:00.000Z'
   * ```
   */
  build(context: BuilderContext): CommentHeaderBuildResult {
    const { component } = context;

    // Generate timestamp for this generation run
    const timestamp = new Date().toISOString();

    // Build comment lines
    const lines: string[] = [
      '/**',
      ` * ${COMMENT_MARKERS.GENERATED}`,
      ` * ${COMMENT_MARKERS.COMPONENT_ID}: ${component.id}`,
      ` * ${COMMENT_MARKERS.LEVEL}: 1`,
      ` * ${COMMENT_MARKERS.LAST_GENERATED}: ${timestamp}`,
      ` * ${COMMENT_MARKERS.DO_NOT_EDIT}`,
      ' */',
    ];

    // Join all lines
    const code = lines.join('\n');

    return {
      code,
      timestamp,
    };
  }
}

/**
 * Factory function to create CommentHeaderBuilder instance
 */
export function createCommentHeaderBuilder(): CommentHeaderBuilder {
  return new CommentHeaderBuilder();
}

/**
 * Generate a comment header with a specific timestamp
 * Useful for testing or when timestamp needs to be controlled
 *
 * @param componentId - The component ID to include
 * @param timestamp - The timestamp to use (defaults to now)
 * @returns The comment header string
 */
export function generateCommentHeader(componentId: string, timestamp?: string): string {
  const ts = timestamp || new Date().toISOString();

  return `/**
 * ${COMMENT_MARKERS.GENERATED}
 * ${COMMENT_MARKERS.COMPONENT_ID}: ${componentId}
 * ${COMMENT_MARKERS.LEVEL}: 1
 * ${COMMENT_MARKERS.LAST_GENERATED}: ${ts}
 * ${COMMENT_MARKERS.DO_NOT_EDIT}
 */`;
}

/**
 * Parse comment header to extract metadata
 * Useful for reading existing generated files
 *
 * @param commentBlock - The comment block to parse
 * @returns Object with parsed values, or null if not a valid header
 */
export function parseCommentHeader(
  commentBlock: string
): {
  componentId: string;
  level: number;
  lastGenerated: string;
} | null {
  // Check if it's a lowcode generated block
  if (!commentBlock.includes(COMMENT_MARKERS.GENERATED)) {
    return null;
  }

  // Extract component ID
  const componentIdMatch = commentBlock.match(
    new RegExp(`${COMMENT_MARKERS.COMPONENT_ID}:\\s*([^\\s\\n]+)`)
  );
  if (!componentIdMatch) {
    return null;
  }

  // Extract level
  const levelMatch = commentBlock.match(new RegExp(`${COMMENT_MARKERS.LEVEL}:\\s*(\\d+)`));
  const level = levelMatch ? parseInt(levelMatch[1], 10) : 1;

  // Extract timestamp
  const timestampMatch = commentBlock.match(
    new RegExp(`${COMMENT_MARKERS.LAST_GENERATED}:\\s*([^\\s\\n]+)`)
  );
  const lastGenerated = timestampMatch ? timestampMatch[1] : '';

  return {
    componentId: componentIdMatch[1],
    level,
    lastGenerated,
  };
}
