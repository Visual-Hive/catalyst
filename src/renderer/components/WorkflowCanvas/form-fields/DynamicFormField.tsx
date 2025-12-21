/**
 * @file DynamicFormField.tsx
 * @description Router component that renders the appropriate field component based on type
 * 
 * @architecture Phase 2.5, Task 2.10 - Properties Panel
 * @created 2025-12-21
 * @author AI (Cline) + Human Review
 * @confidence 9/10 - Simple router pattern, well-tested pattern
 * 
 * @see src/core/workflow/nodes/types.ts - ConfigFieldDefinition
 * @see src/renderer/components/WorkflowCanvas/NodeConfigForm.tsx - Consumer
 * 
 * PROBLEM SOLVED:
 * - Need to render different input components based on field type
 * - Want single entry point for form field rendering
 * - Type safety for field props
 * 
 * SOLUTION:
 * - Router component that maps field type to component
 * - Pass through common props (value, onChange, field metadata)
 * - Handle unknown field types gracefully
 * 
 * @performance-critical false
 * @security-critical false
 */

import React from 'react';
import type { ConfigFieldDefinition } from '../../../../core/workflow/nodes/types';
import { TextInput } from './TextInput';
import { NumberInput } from './NumberInput';
import { SelectInput } from './SelectInput';
import { TextareaInput } from './TextareaInput';
import { BooleanInput } from './BooleanInput';
import { SecretInput } from './SecretInput';

/**
 * Props for DynamicFormField component
 */
interface DynamicFormFieldProps {
  /** Field definition from node metadata */
  field: ConfigFieldDefinition;
  
  /** Current field value */
  value: any;
  
  /** Change handler - called when value changes */
  onChange: (value: any) => void;
}

/**
 * DynamicFormField - Routes to appropriate input component based on field type
 * 
 * This component acts as a router, selecting the correct input component
 * based on the field's type property. All field-specific logic is
 * delegated to the individual input components.
 * 
 * SUPPORTED TYPES:
 * - text: Single-line text input
 * - number: Number input with min/max/step
 * - select: Dropdown with predefined options
 * - textarea: Multi-line text input
 * - boolean: Checkbox toggle
 * - secret: Password-style masked input
 * 
 * @example
 * ```tsx
 * <DynamicFormField
 *   field={{
 *     path: 'apiKey',
 *     label: 'API Key',
 *     type: 'secret',
 *     required: true,
 *   }}
 *   value={config.apiKey}
 *   onChange={(value) => updateConfig('apiKey', value)}
 * />
 * ```
 */
export function DynamicFormField({ field, value, onChange }: DynamicFormFieldProps) {
  // Route to appropriate component based on field type
  switch (field.type) {
    case 'text':
      return <TextInput field={field} value={value} onChange={onChange} />;
    
    case 'number':
      return <NumberInput field={field} value={value} onChange={onChange} />;
    
    case 'select':
      return <SelectInput field={field} value={value} onChange={onChange} />;
    
    case 'textarea':
      return <TextareaInput field={field} value={value} onChange={onChange} />;
    
    case 'boolean':
      return <BooleanInput field={field} value={value} onChange={onChange} />;
    
    case 'secret':
      return <SecretInput field={field} value={value} onChange={onChange} />;
    
    default:
      // Unknown field type - show error message
      return (
        <div className="space-y-2">
          <label className="block text-sm font-medium text-red-700">
            {field.label}
          </label>
          <div className="p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-800">
              Unknown field type: <code className="font-mono">{(field as any).type}</code>
            </p>
          </div>
        </div>
      );
  }
}
