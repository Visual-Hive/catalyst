/**
 * @file CodeAssembler.ts
 * @description Assembles all code parts into a complete React component file (Level 1 - MVP)
 *
 * @architecture Phase 3, Task 3.1 - React Code Generator
 * @created 2025-11-27
 * @author AI (Cline) + Human Review
 * @confidence 9/10 - Simple string assembly, well-defined structure
 *
 * @see docs/FILE_STRUCTURE_SPEC.md - Generated file structure
 * @see src/core/codegen/types.ts - CodeParts interface
 *
 * PROBLEM SOLVED:
 * - Combine output from all builders into complete file
 * - Maintain consistent file structure
 * - Handle variations (with/without props, with/without default export)
 * - Proper spacing between sections
 *
 * SOLUTION:
 * - Take CodeParts object from builders
 * - Assemble in correct order:
 *   1. Imports
 *   2. Blank line
 *   3. Comment header
 *   4. Function declaration
 *   5. Export default (optional)
 * - Return complete file content string
 *
 * OUTPUT STRUCTURE:
 * ```
 * import React from 'react';
 * import { Header } from './Header';
 *
 * /**
 *  * @lowcode:generated
 *  * ...
 *  *\/
 * export function MyComponent({ prop = 'default' }) {
 *   return (
 *     <div>...</div>
 *   );
 * }
 *
 * export default MyComponent;
 * ```
 *
 * @security-critical false
 * @performance-critical false
 */

import type { CodeParts, GenerationOptions, IBuilder } from './types';
import { DEFAULT_GENERATION_OPTIONS } from './types';

/**
 * Input for CodeAssembler
 */
export interface AssemblerInput {
  /**
   * Parts collected from all builders
   */
  parts: CodeParts;

  /**
   * Generation options
   */
  options?: GenerationOptions;
}

/**
 * Output from CodeAssembler
 */
export interface AssemblerOutput {
  /**
   * Complete file content
   */
  code: string;

  /**
   * Suggested filename
   */
  filename: string;

  /**
   * Full filepath relative to project
   */
  filepath: string;
}

/**
 * CodeAssembler combines all builder outputs into a complete React component file
 *
 * USAGE:
 * ```typescript
 * const assembler = new CodeAssembler();
 * const result = assembler.build({
 *   parts: { imports, commentHeader, componentName, props, jsx },
 *   options: generationOptions
 * });
 * // result.code = complete file content
 * ```
 *
 * FILE SECTIONS:
 * 1. Import statements (React + child components)
 * 2. Comment header with @lowcode markers
 * 3. Export function declaration
 * 4. Return statement with JSX
 * 5. Default export (optional)
 */
export class CodeAssembler implements IBuilder<AssemblerInput, AssemblerOutput> {
  /**
   * Assemble all parts into complete file
   *
   * @param input - Parts and options
   * @returns AssemblerOutput with complete code
   */
  build(input: AssemblerInput): AssemblerOutput {
    const { parts } = input;
    const options = { ...DEFAULT_GENERATION_OPTIONS, ...input.options };

    // Sanitize component name for use in code
    const safeName = this.sanitizeComponentName(parts.componentName);

    // Build function signature
    const signature = this.buildFunctionSignature(safeName, parts.props);

    // Build return statement with JSX
    const returnStatement = this.buildReturnStatement(parts.jsx);

    // Assemble all sections
    const sections: string[] = [];

    // 1. Imports
    if (parts.imports) {
      sections.push(parts.imports);
    }

    // 2. Blank line after imports
    sections.push('');

    // 3. Comment header
    sections.push(parts.commentHeader);

    // 4. Function with JSX
    sections.push(signature + ' {');
    sections.push(returnStatement);
    sections.push('}');

    // 5. Default export (optional)
    if (options.includeDefaultExport) {
      sections.push('');
      sections.push(`export default ${safeName};`);
    }

    // Join all sections
    const code = sections.join('\n');

    // Generate filename and filepath
    const filename = `${safeName}${options.fileExtension}`;
    const filepath = `${options.componentPath}/${filename}`;

    return {
      code,
      filename,
      filepath,
    };
  }

  /**
   * Build the function signature line
   *
   * @param name - Component name
   * @param props - Props destructuring string (may be empty)
   * @returns Function signature like "export function Button({ label = 'hi' })"
   */
  private buildFunctionSignature(name: string, props: string): string {
    // If no props, use empty parens
    const params = props || '';

    return `export function ${name}(${params})`;
  }

  /**
   * Build the return statement with proper indentation
   *
   * @param jsx - The JSX content
   * @returns Return statement with proper formatting
   */
  private buildReturnStatement(jsx: string): string {
    // Indent JSX for readability
    const indentedJsx = this.indentCode(jsx, 2);

    return `  return (\n${indentedJsx}\n  );`;
  }

  /**
   * Indent code by specified number of levels
   *
   * @param code - Code to indent
   * @param levels - Number of indent levels (2 spaces each)
   * @returns Indented code
   */
  private indentCode(code: string, levels: number): string {
    const indent = '  '.repeat(levels);

    // Split into lines, indent each, rejoin
    return code
      .split('\n')
      .map((line) => (line.trim() ? indent + line : line))
      .join('\n');
  }

  /**
   * Sanitize component name for use in code
   *
   * @param name - Raw component name
   * @returns Valid JavaScript identifier in PascalCase
   */
  private sanitizeComponentName(name: string): string {
    // Remove invalid characters
    let sanitized = name.replace(/[^a-zA-Z0-9_]/g, '');

    // Ensure not empty
    if (sanitized.length === 0) {
      sanitized = 'Component';
    }

    // Ensure doesn't start with number
    if (/^[0-9]/.test(sanitized)) {
      sanitized = '_' + sanitized;
    }

    // Ensure PascalCase
    sanitized = sanitized.charAt(0).toUpperCase() + sanitized.slice(1);

    return sanitized;
  }
}

/**
 * Factory function to create CodeAssembler instance
 */
export function createCodeAssembler(): CodeAssembler {
  return new CodeAssembler();
}

/**
 * Quick helper to assemble code parts with defaults
 *
 * @param parts - The code parts from builders
 * @param options - Optional generation options
 * @returns The assembled code string
 */
export function assembleCode(parts: CodeParts, options?: GenerationOptions): string {
  const assembler = new CodeAssembler();
  const result = assembler.build({ parts, options });
  return result.code;
}
