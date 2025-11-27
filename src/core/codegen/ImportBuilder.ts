/**
 * @file ImportBuilder.ts
 * @description Builds import statements for React components (Level 1 - MVP)
 *
 * @architecture Phase 3, Task 3.1 - React Code Generator
 * @created 2025-11-27
 * @author AI (Cline) + Human Review
 * @confidence 9/10 - Simple logic, well-defined behavior
 *
 * @see docs/SCHEMA_LEVELS.md - Level 1 feature boundaries
 * @see src/core/codegen/types.ts - Type definitions
 *
 * PROBLEM SOLVED:
 * - Generate import statements for React components
 * - Import React itself (configurable)
 * - Import child components referenced in component.children[]
 * - Deduplicate imports from same child appearing multiple times
 *
 * SOLUTION:
 * - Always start with React import (if configured)
 * - Look up each child ID in manifest to get displayName
 * - Generate named imports for child components
 * - All components assumed to be in same folder for MVP
 *
 * DESIGN DECISIONS:
 * - Use named exports for components (allows tree-shaking)
 * - Relative imports from same folder (MVP simplification)
 * - Skip missing children with warning (graceful degradation)
 *
 * @security-critical false
 * @performance-critical false
 */

import type { BuilderContext, ImportBuildResult, IBuilder } from './types';

/**
 * ImportBuilder generates import statements for React components
 *
 * USAGE:
 * ```typescript
 * const builder = new ImportBuilder();
 * const result = builder.build(context);
 * // result.code = "import React from 'react';\nimport { Header } from './Header';"
 * ```
 *
 * IMPORTS GENERATED:
 * 1. React import (if includeReactImport option is true)
 * 2. Child component imports (from component.children[])
 *
 * EDGE CASES HANDLED:
 * - No children → only React import
 * - Duplicate children → deduplicated
 * - Missing child in manifest → skipped with console warning
 * - Empty displayName → skipped with warning
 */
export class ImportBuilder implements IBuilder<BuilderContext, ImportBuildResult> {
  /**
   * Build import statements for a component
   *
   * @param context - The builder context containing component, manifest, and options
   * @returns ImportBuildResult with generated import code
   *
   * @example
   * ```typescript
   * const result = builder.build({
   *   component: myButton,
   *   manifest: fullManifest,
   *   options: defaultOptions,
   *   indentLevel: 0
   * });
   * ```
   */
  build(context: BuilderContext): ImportBuildResult {
    const { component, manifest, options } = context;

    // Track what we import for the result
    const importedComponents: string[] = [];

    // Collect all import lines
    const importLines: string[] = [];

    // 1. React import (if configured)
    // The new JSX transform doesn't require React import, but we include it
    // by default for compatibility with older setups
    if (options.includeReactImport) {
      importLines.push("import React from 'react';");
    }

    // 2. Child component imports
    // Get unique child IDs to avoid duplicate imports
    const uniqueChildIds = this.getUniqueChildIds(component.children);

    // Process each child
    for (const childId of uniqueChildIds) {
      // Look up child component in manifest
      const childComponent = manifest.components[childId];

      // Handle missing child gracefully
      if (!childComponent) {
        console.warn(
          `[ImportBuilder] Child component "${childId}" not found in manifest ` +
            `for component "${component.displayName}" (${component.id}). Skipping import.`
        );
        continue;
      }

      // Validate child has a displayName
      const childName = childComponent.displayName;
      if (!childName || childName.trim() === '') {
        console.warn(
          `[ImportBuilder] Child component "${childId}" has empty displayName. Skipping import.`
        );
        continue;
      }

      // Sanitize component name for use in import
      const sanitizedName = this.sanitizeComponentName(childName);

      // Generate import statement
      // Uses named import from same directory (MVP: all components in src/components/)
      const importStatement = `import { ${sanitizedName} } from './${sanitizedName}';`;
      importLines.push(importStatement);

      // Track for result
      importedComponents.push(sanitizedName);
    }

    // Join all imports with newlines
    const code = importLines.join('\n');

    return {
      code,
      importedComponents,
    };
  }

  /**
   * Get unique child IDs from children array
   * Uses Set to deduplicate (child may appear multiple times if used in loops)
   *
   * @param children - Array of child component IDs
   * @returns Array of unique child IDs in original order
   *
   * @example
   * getUniqueChildIds(['comp_btn_001', 'comp_btn_001', 'comp_icon_001'])
   * // Returns: ['comp_btn_001', 'comp_icon_001']
   */
  private getUniqueChildIds(children: string[]): string[] {
    // Use Set to track seen IDs, but return array to preserve order
    const seen = new Set<string>();
    const unique: string[] = [];

    for (const childId of children) {
      // Skip empty or null IDs
      if (!childId) {
        continue;
      }

      // Skip if already seen
      if (seen.has(childId)) {
        continue;
      }

      // Add to tracking
      seen.add(childId);
      unique.push(childId);
    }

    return unique;
  }

  /**
   * Sanitize component name for use in import statement
   * Ensures name is valid JavaScript identifier
   *
   * @param name - Raw component displayName
   * @returns Sanitized name safe for imports
   *
   * SANITIZATION RULES:
   * - Remove spaces and special characters
   * - Ensure starts with letter or underscore
   * - Convert to PascalCase
   *
   * @example
   * sanitizeComponentName('My Button Component')
   * // Returns: 'MyButtonComponent'
   *
   * sanitizeComponentName('123Button')
   * // Returns: '_123Button'
   */
  private sanitizeComponentName(name: string): string {
    // Remove any characters that aren't alphanumeric or underscore
    let sanitized = name.replace(/[^a-zA-Z0-9_]/g, '');

    // If empty after sanitization, use fallback
    if (sanitized.length === 0) {
      sanitized = 'Component';
    }

    // Ensure doesn't start with number
    if (/^[0-9]/.test(sanitized)) {
      sanitized = '_' + sanitized;
    }

    // Ensure first letter is uppercase (PascalCase for React components)
    sanitized = sanitized.charAt(0).toUpperCase() + sanitized.slice(1);

    return sanitized;
  }
}

/**
 * Factory function to create ImportBuilder instance
 * Provided for consistency with other builders
 */
export function createImportBuilder(): ImportBuilder {
  return new ImportBuilder();
}
