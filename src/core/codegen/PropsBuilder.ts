/**
 * @file PropsBuilder.ts
 * @description Builds props destructuring with default values for React components (Level 1 - MVP)
 *
 * @architecture Phase 3, Task 3.1 - React Code Generator
 * @created 2025-11-27
 * @author AI (Cline) + Human Review
 * @confidence 8/10 - String escaping edge cases need careful handling
 *
 * @see docs/SCHEMA_LEVELS.md - Level 1 feature boundaries
 * @see src/core/codegen/types.ts - Type definitions
 * @see src/core/manifest/types.ts - Property type definitions
 *
 * PROBLEM SOLVED:
 * - Generate props destructuring syntax for React components
 * - Handle different property types (string, number, boolean)
 * - Properly escape string values
 * - Handle components with no properties
 *
 * SOLUTION:
 * - Extract properties from component.properties object
 * - Format each property with its default value
 * - Handle StaticProperty (has value) and PropProperty (has default)
 * - Use proper JavaScript literal syntax for each type
 *
 * DESIGN DECISIONS:
 * - Always use destructuring (even for single prop)
 * - Include default values when available
 * - Props with no default get undefined (JavaScript default)
 * - Sort props alphabetically for consistency
 *
 * EDGE CASES HANDLED:
 * - Empty properties object → empty string (no params)
 * - String with quotes → properly escaped
 * - String with newlines → escaped as \n
 * - null/undefined values → literal null/undefined
 * - Reserved JavaScript words → allowed (they work in destructuring)
 *
 * @security-critical false
 * @performance-critical false
 */

import type { ComponentProperty } from '../legacy-manifest/types';
import type { BuilderContext, PropsBuildResult, IBuilder } from './types';
import { isStaticProperty, isPropProperty, getPropertyValue, getPropertyDataType } from './types';

/**
 * PropsBuilder generates props destructuring syntax for React components
 *
 * USAGE:
 * ```typescript
 * const builder = new PropsBuilder();
 * const result = builder.build(context);
 * // result.code = "{ label = 'Click me', disabled = false }"
 * ```
 *
 * OUTPUT FORMATS:
 * - String props: `{ name = 'value' }`
 * - Number props: `{ count = 42 }`
 * - Boolean props: `{ active = true }`
 * - No default: `{ data }` (undefined default)
 * - Mixed: `{ name = 'John', age = 30, active = true }`
 * - Empty: `` (no properties)
 */
export class PropsBuilder implements IBuilder<BuilderContext, PropsBuildResult> {
  /**
   * Build props destructuring for a component
   *
   * @param context - The builder context containing component and options
   * @returns PropsBuildResult with generated props code
   *
   * @example
   * ```typescript
   * const result = builder.build(context);
   * // For component with label and disabled props:
   * // result.code = "{ label = 'Click me', disabled = false }"
   * // result.propNames = ['label', 'disabled']
   * // result.hasProps = true
   * ```
   */
  build(context: BuilderContext): PropsBuildResult {
    const { component, onClickHandler } = context;
    const properties = component.properties;

    // Get property entries and sort alphabetically for consistency
    const propEntries = Object.entries(properties);
    
    // Track event handler props that need to be added (Task 4.4)
    // When a component has onClick event binding, it receives onClick as a prop
    const eventProps: string[] = [];
    if (onClickHandler) {
      eventProps.push('onClick');
    }

    // Handle empty properties (but may still have event handlers)
    if (propEntries.length === 0 && eventProps.length === 0) {
      return {
        code: '',
        propNames: [],
        hasProps: false,
      };
    }

    // Sort props alphabetically for consistent output
    propEntries.sort((a, b) => a[0].localeCompare(b[0]));

    // Build each prop string
    const propStrings: string[] = [];
    const propNames: string[] = [];

    for (const [propName, propDef] of propEntries) {
      // Track prop name
      propNames.push(propName);

      // Get the default value for this prop
      const defaultValue = this.getDefaultValue(propDef);

      // Format as destructuring with default
      const propString = this.formatPropWithDefault(propName, defaultValue, propDef);
      propStrings.push(propString);
    }
    
    // Add event handler props at the end (Task 4.4 - Event Binding)
    // These are function props passed from parent (App.jsx) without defaults
    for (const eventProp of eventProps) {
      propNames.push(eventProp);
      propStrings.push(eventProp); // Just the name, no default value
    }

    // Join props with comma and space
    const code = propStrings.length > 0 ? `{ ${propStrings.join(', ')} }` : '';

    return {
      code,
      propNames,
      hasProps: true,
    };
  }

  /**
   * Get the default value for a property
   * Works with both StaticProperty and PropProperty
   *
   * @param prop - The property definition
   * @returns The default value (may be undefined)
   */
  private getDefaultValue(prop: ComponentProperty): unknown {
    // For static properties, the value IS the default
    if (isStaticProperty(prop)) {
      return prop.value;
    }

    // For prop properties, use the default field
    if (isPropProperty(prop)) {
      return prop.default;
    }

    // Fallback for any other type
    return getPropertyValue(prop);
  }

  /**
   * Format a prop with its default value for destructuring
   *
   * @param name - Property name
   * @param defaultValue - Default value (may be undefined)
   * @param prop - Original property definition (for type info)
   * @returns Formatted prop string like "name = 'default'"
   *
   * @example
   * formatPropWithDefault('label', 'Click me', prop)
   * // Returns: "label = 'Click me'"
   *
   * formatPropWithDefault('count', 42, prop)
   * // Returns: "count = 42"
   *
   * formatPropWithDefault('active', true, prop)
   * // Returns: "active = true"
   */
  private formatPropWithDefault(
    name: string,
    defaultValue: unknown,
    prop: ComponentProperty
  ): string {
    // Sanitize prop name (ensure valid JavaScript identifier)
    const safeName = this.sanitizePropName(name);

    // If no default value, just return the prop name
    // This creates `{ propName }` which defaults to undefined
    if (defaultValue === undefined) {
      return safeName;
    }

    // Format the default value based on type
    const formattedDefault = this.formatValue(defaultValue, prop);

    return `${safeName} = ${formattedDefault}`;
  }

  /**
   * Format a value as a JavaScript literal
   *
   * @param value - The value to format
   * @param prop - Property definition (for type hints)
   * @returns Formatted JavaScript literal
   *
   * HANDLING BY TYPE:
   * - string: Single-quoted with escaping
   * - number: Raw number literal
   * - boolean: 'true' or 'false'
   * - null: 'null'
   * - object/array: JSON.stringify (fallback)
   */
  private formatValue(value: unknown, prop: ComponentProperty): string {
    // Get data type from property definition
    const dataType = getPropertyDataType(prop);

    // Handle null explicitly
    if (value === null) {
      return 'null';
    }

    // Handle undefined (shouldn't reach here, but be safe)
    if (value === undefined) {
      return 'undefined';
    }

    // Format based on data type from schema
    switch (dataType) {
      case 'string':
        return this.formatString(String(value));

      case 'number':
        return this.formatNumber(value);

      case 'boolean':
        return this.formatBoolean(value);

      case 'object':
      case 'array':
        // For complex types, use JSON (rare in Level 1)
        return JSON.stringify(value);

      default:
        // Fallback: infer from actual value type
        return this.formatByValueType(value);
    }
  }

  /**
   * Format a string value with proper escaping
   *
   * @param value - String value
   * @returns Escaped and quoted string
   *
   * ESCAPING RULES:
   * - Single quotes → \'
   * - Backslashes → \\
   * - Newlines → \n
   * - Carriage returns → \r
   * - Tabs → \t
   *
   * @example
   * formatString("Hello")
   * // Returns: "'Hello'"
   *
   * formatString("It's nice")
   * // Returns: "'It\\'s nice'"
   *
   * formatString("Line1\nLine2")
   * // Returns: "'Line1\\nLine2'"
   */
  private formatString(value: string): string {
    // Escape special characters
    const escaped = value
      // Backslashes first (before adding more)
      .replace(/\\/g, '\\\\')
      // Single quotes
      .replace(/'/g, "\\'")
      // Newlines
      .replace(/\n/g, '\\n')
      // Carriage returns
      .replace(/\r/g, '\\r')
      // Tabs
      .replace(/\t/g, '\\t');

    // Wrap in single quotes
    return `'${escaped}'`;
  }

  /**
   * Format a number value
   *
   * @param value - Number value (or value to convert to number)
   * @returns Number literal string
   *
   * @example
   * formatNumber(42)     // Returns: "42"
   * formatNumber(3.14)   // Returns: "3.14"
   * formatNumber(-10)    // Returns: "-10"
   */
  private formatNumber(value: unknown): string {
    const num = Number(value);

    // Handle NaN and Infinity
    if (Number.isNaN(num)) {
      return 'NaN';
    }
    if (!Number.isFinite(num)) {
      return num > 0 ? 'Infinity' : '-Infinity';
    }

    return String(num);
  }

  /**
   * Format a boolean value
   *
   * @param value - Boolean value (or value to convert to boolean)
   * @returns 'true' or 'false'
   */
  private formatBoolean(value: unknown): string {
    return Boolean(value) ? 'true' : 'false';
  }

  /**
   * Format value by inferring type from actual value
   * Used as fallback when dataType doesn't match
   *
   * @param value - Any value
   * @returns Formatted JavaScript literal
   */
  private formatByValueType(value: unknown): string {
    // Check actual JavaScript type
    switch (typeof value) {
      case 'string':
        return this.formatString(value);

      case 'number':
        return this.formatNumber(value);

      case 'boolean':
        return this.formatBoolean(value);

      case 'object':
        if (value === null) {
          return 'null';
        }
        return JSON.stringify(value);

      default:
        // Convert to string as last resort
        return this.formatString(String(value));
    }
  }

  /**
   * Sanitize property name to be valid JavaScript identifier
   *
   * @param name - Raw property name
   * @returns Safe identifier
   *
   * RULES:
   * - Remove invalid characters
   * - Ensure doesn't start with number
   * - Handle reserved words (they're actually OK in destructuring)
   *
   * @example
   * sanitizePropName('my-prop')  // Returns: 'myProp'
   * sanitizePropName('123abc')   // Returns: '_123abc'
   */
  private sanitizePropName(name: string): string {
    // Replace hyphens with camelCase
    let safe = name.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());

    // Remove any remaining invalid characters
    safe = safe.replace(/[^a-zA-Z0-9_$]/g, '');

    // Ensure doesn't start with number
    if (/^[0-9]/.test(safe)) {
      safe = '_' + safe;
    }

    // If empty, use generic name
    if (safe.length === 0) {
      safe = 'prop';
    }

    return safe;
  }
}

/**
 * Factory function to create PropsBuilder instance
 */
export function createPropsBuilder(): PropsBuilder {
  return new PropsBuilder();
}
