/**
 * @file PropertyInput.tsx
 * @description Smart property input that renders appropriate control based on property type
 * 
 * @architecture Phase 2, Task 2.3A - Property Panel Editor
 * @updated 2025-11-29 - Task 3.5bis: Added template-based enum detection
 * @created 2025-11-26
 * @author AI (Cline) + Human Review
 * @confidence 9/10 - Standard form input patterns with type switching + template integration
 * 
 * @see .implementation/phase-2-component-management/task-2.3-property-panel-editor.md
 * @see .implementation/phase-3-code-generation-and-preview/task-3.5bis-property-panel-enhancements.md
 * @see src/core/manifest/types.ts - ComponentProperty type
 * 
 * PROBLEM SOLVED:
 * Different property types need different input controls:
 * - string → text input
 * - number → number input
 * - boolean → checkbox
 * - options → dropdown (from PropProperty OR from template)
 * - object/array → read-only message (Level 1)
 * 
 * SOLUTION:
 * Single component that switches on dataType and renders the appropriate input.
 * Handles validation and change propagation to parent.
 * Uses templateRegistry to detect enum options for StaticProperty.
 * 
 * LEVEL 1 RESTRICTIONS:
 * - Only StaticProperty values are editable
 * - Object/array types show "Complex type" message
 * - No expression toggle
 * 
 * @security-critical false
 * @performance-critical false
 */

import React, { useMemo } from 'react';
import { templateRegistry } from '../../../core/templates';
import type { ComponentProperty, PropProperty } from '../../../core/legacy-manifest/types';
import type { EnumOption } from '../../../core/templates/types';

/**
 * Props for the PropertyInput component
 */
export interface PropertyInputProps {
  /** Property name (for onChange callback) */
  name: string;
  /** Property definition from manifest */
  property: ComponentProperty;
  /** Current value */
  value: unknown;
  /** Callback when value changes */
  onChange: (name: string, value: unknown) => void;
  /** Whether input is disabled */
  disabled?: boolean;
  /** Component type for template lookup (Task 3.5bis) */
  componentType?: string;
}

/**
 * Props for individual input components
 */
interface InputProps {
  name: string;
  value: unknown;
  onChange: (name: string, value: unknown) => void;
  disabled?: boolean;
}

/**
 * Props for SelectInput (includes options)
 */
interface SelectInputProps extends InputProps {
  options: string[];
}

/**
 * Props for EnumSelectInput (includes EnumOption objects with labels)
 */
interface EnumSelectInputProps extends InputProps {
  options: EnumOption[];
}

/**
 * Smart property input component
 * 
 * Renders the appropriate input control based on property.dataType:
 * - string → TextInput
 * - number → NumberInput
 * - boolean → BooleanInput
 * - string with options → SelectInput
 * - object/array → ComplexTypeMessage (read-only)
 * 
 * @param props - PropertyInput props
 * @returns Appropriate input component for the property type
 * 
 * @example
 * ```tsx
 * <PropertyInput
 *   name="label"
 *   property={{ type: 'static', dataType: 'string', value: 'Click me' }}
 *   value="Click me"
 *   onChange={(name, val) => updateProperty(name, val)}
 * />
 * ```
 */
export function PropertyInput({
  name,
  property,
  value,
  onChange,
  disabled = false,
  componentType,
}: PropertyInputProps): React.ReactElement {
  // Get dataType - default to string if not specified
  const dataType = property.dataType || 'string';

  // Check for options (enum-style) - from PropProperty  
  const propOptions = (property as PropProperty).options;

  // Get template enum options if available (Task 3.5bis)
  // This enables dropdown for StaticProperty when template defines options
  const templateEnumOptions = useMemo(() => {
    if (!componentType) return undefined;
    return templateRegistry.getEnumOptions(componentType, name);
  }, [componentType, name]);

  // Render based on dataType
  switch (dataType) {
    case 'boolean':
      return (
        <BooleanInput
          name={name}
          value={value}
          onChange={onChange}
          disabled={disabled}
        />
      );

    case 'number':
      return (
        <NumberInput
          name={name}
          value={value}
          onChange={onChange}
          disabled={disabled}
        />
      );

    case 'object':
    case 'array':
      // Complex types are read-only in Level 1
      return <ComplexTypeMessage dataType={dataType} value={value} />;

    case 'string':
    default:
      // Check if property has options (enum) from PropProperty
      if (propOptions && propOptions.length > 0) {
        return (
          <SelectInput
            name={name}
            value={value}
            options={propOptions}
            onChange={onChange}
            disabled={disabled}
          />
        );
      }

      // Check for template enum options (Task 3.5bis)
      if (templateEnumOptions && templateEnumOptions.length > 0) {
        return (
          <EnumSelectInput
            name={name}
            value={value}
            options={templateEnumOptions}
            onChange={onChange}
            disabled={disabled}
          />
        );
      }

      return (
        <TextInput
          name={name}
          value={value}
          onChange={onChange}
          disabled={disabled}
        />
      );
  }
}

/**
 * Text input for string properties
 * 
 * @param props - Input props
 * @returns Text input element
 */
function TextInput({ name, value, onChange, disabled }: InputProps): React.ReactElement {
  return (
    <input
      type="text"
      value={(value as string) ?? ''}
      onChange={(e) => onChange(name, e.target.value)}
      disabled={disabled}
      className="w-full px-3 py-2 text-sm border border-gray-300 rounded 
                 focus:outline-none focus:ring-2 focus:ring-blue-500
                 disabled:bg-gray-100 disabled:cursor-not-allowed"
    />
  );
}

/**
 * Number input for numeric properties
 * 
 * Converts empty string to null for optional fields
 * 
 * @param props - Input props
 * @returns Number input element
 */
function NumberInput({ name, value, onChange, disabled }: InputProps): React.ReactElement {
  return (
    <input
      type="number"
      value={value === null || value === undefined ? '' : String(value)}
      onChange={(e) => {
        // Convert empty string to null, otherwise parse as number
        const newValue = e.target.value === '' ? null : Number(e.target.value);
        onChange(name, newValue);
      }}
      disabled={disabled}
      className="w-full px-3 py-2 text-sm border border-gray-300 rounded 
                 focus:outline-none focus:ring-2 focus:ring-blue-500
                 disabled:bg-gray-100 disabled:cursor-not-allowed"
    />
  );
}

/**
 * Boolean input (checkbox with label)
 * 
 * @param props - Input props
 * @returns Checkbox with True/False label
 */
function BooleanInput({ name, value, onChange, disabled }: InputProps): React.ReactElement {
  const checked = Boolean(value);

  return (
    <label className="flex items-center gap-2 cursor-pointer">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(name, e.target.checked)}
        disabled={disabled}
        className="w-4 h-4 text-blue-500 rounded border-gray-300 
                   focus:ring-blue-500 disabled:cursor-not-allowed"
      />
      <span className={`text-sm ${disabled ? 'text-gray-400' : 'text-gray-700'}`}>
        {checked ? 'True' : 'False'}
      </span>
    </label>
  );
}

/**
 * Select input for properties with predefined options (string array)
 * 
 * @param props - SelectInput props including options array
 * @returns Select dropdown element
 */
function SelectInput({ name, value, options, onChange, disabled }: SelectInputProps): React.ReactElement {
  return (
    <select
      value={(value as string) ?? ''}
      onChange={(e) => onChange(name, e.target.value)}
      disabled={disabled}
      className="w-full px-3 py-2 text-sm border border-gray-300 rounded 
                 focus:outline-none focus:ring-2 focus:ring-blue-500
                 disabled:bg-gray-100 disabled:cursor-not-allowed"
    >
      <option value="">Select...</option>
      {options.map((opt) => (
        <option key={opt} value={opt}>
          {opt}
        </option>
      ))}
    </select>
  );
}

/**
 * Enum select input for properties with EnumOption objects (Task 3.5bis)
 * 
 * Shows value as option value, label as display text.
 * Used when template defines enum options with labels.
 * 
 * @param props - EnumSelectInput props including EnumOption array
 * @returns Select dropdown element with labels
 */
function EnumSelectInput({ name, value, options, onChange, disabled }: EnumSelectInputProps): React.ReactElement {
  return (
    <select
      value={(value as string) ?? ''}
      onChange={(e) => onChange(name, e.target.value)}
      disabled={disabled}
      className="w-full px-3 py-2 text-sm border border-gray-300 rounded 
                 focus:outline-none focus:ring-2 focus:ring-blue-500
                 disabled:bg-gray-100 disabled:cursor-not-allowed"
    >
      <option value="">Select...</option>
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}

/**
 * Props for ComplexTypeMessage component
 */
interface ComplexTypeMessageProps {
  dataType: string;
  value: unknown;
}

/**
 * Read-only message for complex types (object/array)
 * 
 * Level 1 MVP doesn't support editing complex types.
 * Shows a message directing users to Level 2.
 * 
 * @param props - ComplexTypeMessage props
 * @returns Info message with JSON preview
 */
function ComplexTypeMessage({ dataType, value }: ComplexTypeMessageProps): React.ReactElement {
  // Show a preview of the value in JSON format
  const preview = value !== null && value !== undefined
    ? JSON.stringify(value, null, 2)
    : 'null';

  return (
    <div className="space-y-2">
      {/* Info message */}
      <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded px-2 py-1">
        Complex type ({dataType}) - editing coming in Level 2
      </p>
      
      {/* JSON preview - collapsed if large */}
      <pre className="px-3 py-2 text-xs font-mono bg-gray-50 border border-gray-200 
                      rounded overflow-x-auto text-gray-600 max-h-24 overflow-y-auto">
        {preview}
      </pre>
    </div>
  );
}
