/**
 * @file JSXBuilder.ts
 * @description Builds JSX element tree for React components (Level 1 - MVP)
 *
 * @architecture Phase 3, Task 3.1 - React Code Generator
 * @created 2025-11-27
 * @author AI (Cline) + Human Review
 * @confidence 8/10 - Complex logic for children and attributes, needs thorough testing
 *
 * @see docs/SCHEMA_LEVELS.md - Level 1 feature boundaries
 * @see src/core/codegen/types.ts - Type definitions and constants
 * @see src/core/manifest/types.ts - Component type definitions
 *
 * PROBLEM SOLVED:
 * - Generate JSX element tree from component definition
 * - Apply className from styling.baseClasses
 * - Handle self-closing elements (input, img, br, etc.)
 * - Render child components from children[] array
 * - Handle text content (label, text props)
 * - Determine which props are attributes vs content
 *
 * SOLUTION:
 * - Use component.type as HTML element tag
 * - Join baseClasses with space for className
 * - Check SELF_CLOSING_TAGS for void elements
 * - Render children as component references
 * - Use text props (label, text) as children content
 *
 * DESIGN DECISIONS:
 * - className always uses double quotes (JSX convention)
 * - Props that are standard attributes go on element
 * - Props that represent text content render as {propName}
 * - Self-closing tags never have children
 * - Indentation is 2 spaces
 *
 * LEVEL 1 RESTRICTIONS:
 * - NO event handlers (onClick, onChange, etc.)
 * - NO conditional rendering
 * - NO dynamic expressions beyond prop interpolation
 * - Only static className (no conditional classes)
 *
 * @security-critical false
 * @performance-critical false
 */

import type { Component, ComponentProperty } from '../manifest/types';
import type { BuilderContext, JSXBuildResult, IBuilder } from './types';
import {
  isSelfClosingTag,
  isTextContentProp,
  isElementAttribute,
  isBooleanAttribute,
  isStaticProperty,
  isPropProperty,
  getPropertyValue,
  getPropertyDataType,
  PROP_NAME_MAPPINGS,
} from './types';

/**
 * JSXBuilder generates JSX element tree for React components
 *
 * USAGE:
 * ```typescript
 * const builder = new JSXBuilder();
 * const result = builder.build(context);
 * // result.code = '<button className="btn">{label}</button>'
 * ```
 *
 * OUTPUT FORMATS:
 * - Simple element: `<div className="container"></div>`
 * - With text content: `<button className="btn">{label}</button>`
 * - Self-closing: `<input className="input" placeholder={placeholder} />`
 * - With children: `<div className="card">\n  <Header />\n  <Content />\n</div>`
 *
 * INDENTATION:
 * - Base indentation is provided via context.indentLevel
 * - Each level adds 2 spaces
 * - Children are indented one level deeper
 */
export class JSXBuilder implements IBuilder<BuilderContext, JSXBuildResult> {
  /**
   * Number of spaces per indentation level
   */
  private readonly INDENT_SIZE = 2;

  /**
   * Build JSX for a component
   *
   * @param context - The builder context containing component, manifest, and options
   * @returns JSXBuildResult with generated JSX code
   *
   * @example
   * ```typescript
   * const result = builder.build(context);
   * // For a button with label prop:
   * // result.code contains valid JSX
   * // result.isSelfClosing = false
   * // result.childComponents = []
   * ```
   */
  build(context: BuilderContext): JSXBuildResult {
    const { component, manifest, indentLevel } = context;

    // Determine if this is a self-closing element
    const selfClosing = isSelfClosingTag(component.type);

    // Build attribute string (className, other attributes)
    const attributes = this.buildAttributes(component);

    // Get indent strings
    const baseIndent = this.getIndentString(indentLevel);
    const childIndent = this.getIndentString(indentLevel + 1);

    // Track child components for result
    const childComponents: string[] = [];

    // Build the element
    let code: string;

    if (selfClosing) {
      // Self-closing element: <input className="..." />
      code = `<${component.type}${attributes} />`;
    } else {
      // Regular element with potential children
      const children = this.buildChildren(component, manifest, indentLevel + 1, childComponents);

      if (children.trim() === '') {
        // Empty element: <div className="..."></div>
        code = `<${component.type}${attributes}></${component.type}>`;
      } else if (this.isSimpleContent(children)) {
        // Simple content (single expression): <span>{label}</span>
        code = `<${component.type}${attributes}>${children}</${component.type}>`;
      } else {
        // Complex content with line breaks: <div>\n  children\n</div>
        code = `<${component.type}${attributes}>\n${children}\n${baseIndent}</${component.type}>`;
      }
    }

    return {
      code,
      isSelfClosing: selfClosing,
      childComponents,
    };
  }

  /**
   * Build the attributes string for an element
   * Includes className and other applicable props
   *
   * @param component - The component definition
   * @returns Attribute string like ' className="btn" disabled={disabled}'
   */
  private buildAttributes(component: Component): string {
    const attrs: string[] = [];

    // 1. Add className from styling.baseClasses
    const className = this.buildClassName(component);
    if (className) {
      attrs.push(`className="${className}"`);
    }

    // 2. Add props that should be element attributes
    // For Level 1, we only add props that are standard HTML attributes
    const propAttrs = this.buildPropAttributes(component);
    attrs.push(...propAttrs);

    // Return with leading space if we have attributes
    if (attrs.length === 0) {
      return '';
    }

    return ' ' + attrs.join(' ');
  }

  /**
   * Build className string from styling.baseClasses
   *
   * @param component - The component definition
   * @returns Space-separated class string, or empty string if no classes
   *
   * @example
   * // Given styling.baseClasses = ['btn', 'btn-primary', 'px-4']
   * buildClassName(component)
   * // Returns: 'btn btn-primary px-4'
   */
  private buildClassName(component: Component): string {
    const baseClasses = component.styling?.baseClasses || [];

    if (baseClasses.length === 0) {
      return '';
    }

    // Filter out empty strings and join
    return baseClasses.filter((c) => c && c.trim()).join(' ');
  }

  /**
   * Build attribute strings for props that should be on the element
   * Only includes props that are standard HTML/React attributes
   *
   * @param component - The component definition
   * @returns Array of attribute strings like 'disabled={disabled}'
   */
  private buildPropAttributes(component: Component): string[] {
    const attrs: string[] = [];
    const properties = component.properties || {};

    for (const [propName, propDef] of Object.entries(properties)) {
      // Skip text content props (they go inside the element)
      if (isTextContentProp(propName) && !isElementAttribute(propName)) {
        continue;
      }

      // Only include standard element attributes
      if (!isElementAttribute(propName)) {
        // For non-standard props, skip (they're just component props)
        continue;
      }

      // Map prop names (class -> className, for -> htmlFor)
      const attrName = PROP_NAME_MAPPINGS[propName] || propName;

      // For Level 1, props are passed through function params
      // So we reference them as {propName} not literal values
      // However, if it's a static prop, we CAN use the literal value
      // But for consistency and flexibility, we'll use the prop reference

      if (isBooleanAttribute(attrName)) {
        // Boolean attributes: disabled={disabled}
        attrs.push(`${attrName}={${this.sanitizePropName(propName)}}`);
      } else {
        // Other attributes: placeholder={placeholder}
        attrs.push(`${attrName}={${this.sanitizePropName(propName)}}`);
      }
    }

    return attrs;
  }

  /**
   * Build children content for an element
   * Handles both child components and text content props
   *
   * @param component - The component definition
   * @param manifest - Full manifest for child lookups
   * @param indentLevel - Indentation level for children
   * @param childComponents - Array to track child component names (mutated)
   * @returns Children content string
   */
  private buildChildren(
    component: Component,
    manifest: { components: Record<string, Component> },
    indentLevel: number,
    childComponents: string[]
  ): string {
    const indent = this.getIndentString(indentLevel);

    // Check if we have child components
    const hasChildComponents = component.children && component.children.length > 0;

    // Check if we have text content props
    const textContentProp = this.findTextContentProp(component);

    // If we have child components, render them
    if (hasChildComponents) {
      const childLines: string[] = [];

      for (const childId of component.children) {
        const childComponent = manifest.components[childId];

        if (!childComponent) {
          console.warn(
            `[JSXBuilder] Child component "${childId}" not found in manifest ` +
              `for component "${component.displayName}" (${component.id}). Skipping.`
          );
          continue;
        }

        // Sanitize child component name
        const childName = this.sanitizeComponentName(childComponent.displayName);

        // Track for result
        childComponents.push(childName);

        // Render as self-closing component reference
        // In Level 1, we don't pass props to children (that's Level 2)
        childLines.push(`${indent}<${childName} />`);
      }

      return childLines.join('\n');
    }

    // If we have text content, render it
    if (textContentProp) {
      const { name } = textContentProp;
      // Render as expression: {label}
      return `{${this.sanitizePropName(name)}}`;
    }

    // No children
    return '';
  }

  /**
   * Find a text content prop (label, text, content, children)
   *
   * @param component - The component definition
   * @returns The prop name and definition, or null if none found
   */
  private findTextContentProp(
    component: Component
  ): { name: string; prop: ComponentProperty } | null {
    const properties = component.properties || {};

    // Check for common text content props in priority order
    const textProps = ['children', 'label', 'text', 'content'];

    for (const propName of textProps) {
      if (propName in properties) {
        return { name: propName, prop: properties[propName] };
      }
    }

    return null;
  }

  /**
   * Check if content is simple (single expression, no newlines)
   *
   * @param content - The children content string
   * @returns true if content is simple (single line)
   */
  private isSimpleContent(content: string): boolean {
    // Simple content doesn't contain newlines and is relatively short
    return !content.includes('\n') && content.length < 50;
  }

  /**
   * Get indentation string for given level
   *
   * @param level - Indentation level (0 = no indent)
   * @returns String of spaces
   */
  private getIndentString(level: number): string {
    return ' '.repeat(level * this.INDENT_SIZE);
  }

  /**
   * Sanitize component name for use in JSX
   *
   * @param name - Raw component displayName
   * @returns PascalCase component name
   */
  private sanitizeComponentName(name: string): string {
    // Remove invalid characters and ensure PascalCase
    let sanitized = name.replace(/[^a-zA-Z0-9_]/g, '');

    if (sanitized.length === 0) {
      sanitized = 'Component';
    }

    // Ensure starts with uppercase
    if (/^[0-9]/.test(sanitized)) {
      sanitized = '_' + sanitized;
    }

    return sanitized.charAt(0).toUpperCase() + sanitized.slice(1);
  }

  /**
   * Sanitize prop name for use in JSX expressions
   *
   * @param name - Raw prop name
   * @returns Valid JavaScript identifier
   */
  private sanitizePropName(name: string): string {
    // Replace hyphens with camelCase
    let safe = name.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());

    // Remove invalid characters
    safe = safe.replace(/[^a-zA-Z0-9_$]/g, '');

    // Ensure doesn't start with number
    if (/^[0-9]/.test(safe)) {
      safe = '_' + safe;
    }

    if (safe.length === 0) {
      safe = 'prop';
    }

    return safe;
  }
}

/**
 * Factory function to create JSXBuilder instance
 */
export function createJSXBuilder(): JSXBuilder {
  return new JSXBuilder();
}
