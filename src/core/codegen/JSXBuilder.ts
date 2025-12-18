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

import type { Component, ComponentProperty } from '../legacy-manifest/types';
import type { BuilderContext, JSXBuildResult, IBuilder } from './types';
import {
  isSelfClosingTag,
  isTextContentProp,
  isElementAttribute,
  isBooleanAttribute,
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

    // Handle special types: 'checkbox' → input, 'text' → p/h1-h6/span based on 'as' prop
    const actualElementType = this.getActualElementType(component.type, component);
    
    // Determine if this is a self-closing element
    const selfClosing = isSelfClosingTag(component.type);

    // Build attribute string (className, onClick handler, other attributes)
    // Pass onClickHandler from context for event binding (Task 4.4)
    const attributes = this.buildAttributes(component, actualElementType, context.onClickHandler);

    // Get indent string for multi-line content
    const baseIndent = this.getIndentString(indentLevel);

    // Track child components for result
    const childComponents: string[] = [];

    // Build the element
    let code: string;

    if (selfClosing) {
      // Self-closing element: <input className="..." />
      code = `<${actualElementType}${attributes} />`;
      
      // Check if this input/checkbox has a label that should wrap it
      code = this.wrapWithLabel(component, code, actualElementType);
    } else {
      // Regular element with potential children
      const children = this.buildChildren(component, manifest, indentLevel + 1, childComponents);

      if (children.trim() === '') {
        // Empty element: <div className="..."></div>
        code = `<${actualElementType}${attributes}></${actualElementType}>`;
      } else if (this.isSimpleContent(children)) {
        // Simple content (single expression): <span>{label}</span>
        code = `<${actualElementType}${attributes}>${children}</${actualElementType}>`;
      } else {
        // Complex content with line breaks: <div>\n  children\n</div>
        code = `<${actualElementType}${attributes}>\n${children}\n${baseIndent}</${actualElementType}>`;
      }
    }

    return {
      code,
      isSelfClosing: selfClosing,
      childComponents,
    };
  }

  /**
   * Get the actual HTML element type for a component type
   * 
   * Handles Rise virtual types that map to different HTML elements:
   * - 'checkbox' → 'input' (with type="checkbox" attribute)
   * - 'text' → dynamic based on 'as' prop (p, h1-h6, span) - defaults to 'p'
   * - 'icon' → handled specially (see buildIcon method)
   * 
   * @param componentType - The component type from manifest
   * @param component - The component definition (optional, for 'text' type resolution)
   * @returns Actual HTML element type to render
   */
  private getActualElementType(componentType: string, component?: Component): string {
    // Map Rise virtual types to actual HTML elements
    const typeMapping: Record<string, string> = {
      'checkbox': 'input',
      'icon': 'span', // Icon renders as span wrapper (actual icon import handled separately)
    };
    
    // Special handling for 'text' type - uses 'as' property
    if (componentType === 'text' && component) {
      const asProperty = component.properties?.as;
      if (asProperty && asProperty.type === 'static' && typeof asProperty.value === 'string') {
        // Valid values: p, h1, h2, h3, h4, h5, h6, span
        const validTags = ['p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'span'];
        if (validTags.includes(asProperty.value)) {
          return asProperty.value;
        }
      }
      // Default to 'p' for text
      return 'p';
    }
    
    return typeMapping[componentType] || componentType;
  }

  /**
   * Wrap a form input with a label element when label prop exists
   * 
   * NOTE: For Level 1 MVP, we keep it simple - just return the input without wrapper.
   * The label is handled as a prop in the component.
   * Label wrapper JSX is complex and can cause indentation/formatting issues.
   * 
   * TODO: Level 2 will add proper label wrapping with correct indentation handling.
   * 
   * @param _component - The component definition (unused in Level 1)
   * @param inputCode - The generated input element code
   * @param _elementType - The actual HTML element type (unused in Level 1)
   * @returns The input code (label wrapper deferred to Level 2)
   */
  private wrapWithLabel(_component: Component, inputCode: string, _elementType: string): string {
    // For Level 1 MVP, just return the input without wrapper
    // Labels are included in the component's props but not rendered as wrapper elements
    // This keeps the generated code simple and avoids formatting issues
    return inputCode;
  }

  /**
   * Build the attributes string for an element
   * Includes className, style, onClick handler, and other applicable props
   *
   * @param component - The component definition
   * @param _actualElementType - The actual HTML element type (after mapping virtual types) - reserved for future use
   * @param onClickHandler - Optional onClick handler name from context (Task 4.4)
   * @returns Attribute string like ' className="btn" style={{...}} onClick={handler} disabled={disabled}'
   */
  private buildAttributes(component: Component, _actualElementType: string, onClickHandler?: string): string {
    const attrs: string[] = [];

    // 1. Add className from styling.baseClasses
    const className = this.buildClassName(component);
    if (className) {
      attrs.push(`className="${className}"`);
    }

    // 2. Add style attribute from styling.inlineStyles
    const styleAttr = this.buildStyleAttribute(component);
    if (styleAttr) {
      attrs.push(styleAttr);
    }

    // 3. For checkbox type, add type="checkbox" attribute
    if (component.type === 'checkbox') {
      attrs.push('type="checkbox"');
    }

    // 4. Add onClick handler if provided (Task 4.4 - Event Binding)
    // This connects the component to its logic flow handler
    if (onClickHandler) {
      attrs.push(`onClick={${onClickHandler}}`);
    }

    // 5. Add props that should be element attributes
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
   * Build style attribute from inline styles
   * Converts camelCase CSS properties to React style object
   *
   * @param component - The component definition
   * @returns Style attribute string like 'style={{ padding: "8px 16px", backgroundColor: "#3b82f6" }}'
   *          or empty string if no inline styles
   */
  private buildStyleAttribute(component: Component): string {
    const inlineStyles = component.styling?.inlineStyles;

    // Return empty if no inline styles
    if (!inlineStyles || Object.keys(inlineStyles).length === 0) {
      return '';
    }

    // Build style object entries
    const styleEntries: string[] = [];

    for (const [prop, value] of Object.entries(inlineStyles)) {
      // Skip empty values
      if (!value && value !== '0') continue;

      // Quote string values, but numbers don't need quotes in JSX
      // All our values are strings (from template defaults)
      styleEntries.push(`${prop}: "${value}"`);
    }

    if (styleEntries.length === 0) {
      return '';
    }

    // Return as React style object: style={{ prop: "value", ... }}
    return `style={{ ${styleEntries.join(', ')} }}`;
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

    for (const [propName] of Object.entries(properties)) {
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

    // Fallback: Find the first string prop to use as display text
    // This ensures AI-generated components with custom prop names still display something
    return this.findFallbackTextProp(component);
  }

  /**
   * Find a fallback string prop to use as text content
   * Used when no standard text props (label, text, content, children) are found
   *
   * PRIORITY:
   * 1. Props with 'name' in the name (e.g., userName, displayName)
   * 2. Props with 'title' in the name
   * 3. Any other string prop
   *
   * @param component - The component definition
   * @returns The prop name and definition, or null if none found
   */
  private findFallbackTextProp(
    component: Component
  ): { name: string; prop: ComponentProperty } | null {
    const properties = component.properties || {};
    const propEntries = Object.entries(properties);

    if (propEntries.length === 0) {
      return null;
    }

    // First pass: look for props with 'name' or 'title' in the name
    for (const [propName, prop] of propEntries) {
      const dataType = getPropertyDataType(prop);
      if (dataType !== 'string') continue;

      const lowerName = propName.toLowerCase();
      if (lowerName.includes('name') || lowerName.includes('title')) {
        return { name: propName, prop };
      }
    }

    // Second pass: any string prop
    for (const [propName, prop] of propEntries) {
      const dataType = getPropertyDataType(prop);
      if (dataType === 'string') {
        return { name: propName, prop };
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
