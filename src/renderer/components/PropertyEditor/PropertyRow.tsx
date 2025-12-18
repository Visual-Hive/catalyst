/**
 * @file PropertyRow.tsx
 * @description Single property row with label, input, type badge, description, and remove button
 * 
 * @architecture Phase 2, Task 2.3A - Property Panel Editor
 * @updated 2025-11-29 - Task 3.5bis: Added template-based descriptions
 * @created 2025-11-26
 * @author AI (Cline) + Human Review
 * @confidence 9/10 - Standard row layout with action buttons + template integration
 * 
 * @see .implementation/phase-2-component-management/task-2.3-property-panel-editor.md
 * @see .implementation/phase-3-code-generation-and-preview/task-3.5bis-property-panel-enhancements.md
 * @see src/core/manifest/types.ts - ComponentProperty type
 * 
 * PROBLEM SOLVED:
 * Each property needs a consistent UI row showing:
 * - Property name (label)
 * - Data type badge
 * - Remove button
 * - Appropriate input control
 * - Required indicator
 * - (Task 3.5bis) Description from template
 * 
 * SOLUTION:
 * Reusable PropertyRow component that composes PropertyInput
 * and handles the surrounding layout and actions.
 * Uses templateRegistry for descriptions and enum options.
 * 
 * LAYOUT:
 * ┌─────────────────────────────────────────────────────┐
 * │ propertyName                              [type] [x]│
 * │ ┌─────────────────────────────────────────────────┐ │
 * │ │ [input control based on type]                   │ │
 * │ └─────────────────────────────────────────────────┘ │
 * │ ⓘ Description from template (Task 3.5bis)          │
 * │ Required (if applicable)                           │
 * └─────────────────────────────────────────────────────┘
 * 
 * @security-critical false
 * @performance-critical false
 */

import React, { useMemo } from 'react';
import { XMarkIcon, InformationCircleIcon } from '@heroicons/react/24/outline';
import { PropertyInput } from './PropertyInput';
import { templateRegistry } from '../../../core/templates';
import type { ComponentProperty, StaticProperty, PropProperty } from '../../../core/legacy-manifest/types';

/**
 * Props for PropertyRow component
 */
interface PropertyRowProps {
  /** Property name (used as label and key) */
  name: string;
  /** Property definition from manifest */
  property: ComponentProperty;
  /** Callback when property value changes */
  onChange: (name: string, value: unknown) => void;
  /** Callback when property should be removed */
  onRemove: (name: string) => void;
  /** Component type for template lookup (Task 3.5bis) */
  componentType?: string;
}

/**
 * Get the editable value from a property
 * 
 * For StaticProperty: returns .value
 * For PropProperty: returns .default (read-only in Level 1)
 * 
 * @param property - Property definition
 * @returns The current value to display/edit
 */
function getPropertyValue(property: ComponentProperty): unknown {
  if (property.type === 'static') {
    return (property as StaticProperty).value;
  }
  // For PropProperty, use default value (read-only editing in Level 1)
  return (property as PropProperty).default;
}

/**
 * Check if a property is editable in Level 1
 * 
 * Only StaticProperty values are editable.
 * PropProperty with type='prop' would need expression bindings (Level 2).
 * 
 * @param property - Property definition
 * @returns true if the property can be edited
 */
function isPropertyEditable(property: ComponentProperty): boolean {
  return property.type === 'static';
}

/**
 * Property row component
 * 
 * Displays a single property with:
 * - Name label
 * - Data type badge (string, number, boolean, etc.)
 * - Remove button (X)
 * - PropertyInput component for value editing
 * - Required indicator if property.required is true
 * 
 * @param props - PropertyRow props
 * @returns Property row element
 * 
 * @example
 * ```tsx
 * <PropertyRow
 *   name="label"
 *   property={{ type: 'static', dataType: 'string', value: 'Click me' }}
 *   onChange={(name, val) => updateProperty(name, val)}
 *   onRemove={(name) => removeProperty(name)}
 * />
 * ```
 */
export function PropertyRow({
  name,
  property,
  onChange,
  onRemove,
  componentType,
}: PropertyRowProps): React.ReactElement {
  // Get the value to display/edit
  const value = getPropertyValue(property);
  
  // Check if this property is editable
  const editable = isPropertyEditable(property);
  
  // Get display-friendly data type
  const dataType = property.dataType || 'string';

  // Get template property info for description and options (Task 3.5bis)
  const templateProp = useMemo(() => {
    if (!componentType) return undefined;
    return templateRegistry.getPropertyTemplate(componentType, name);
  }, [componentType, name]);

  // Get description from template if available
  const description = templateProp?.description;

  return (
    <div className="p-3 bg-white border border-gray-200 rounded-lg">
      {/* Header row: name, type badge, remove button */}
      <div className="flex items-center justify-between mb-2">
        {/* Property name */}
        <span className="text-sm font-medium text-gray-700">{name}</span>
        
        {/* Right side: type badge + remove button */}
        <div className="flex items-center gap-2">
          {/* Data type badge */}
          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
            {dataType}
          </span>
          
          {/* Property type indicator if not static */}
          {property.type !== 'static' && (
            <span className="text-xs text-purple-500 bg-purple-50 px-2 py-0.5 rounded" title="This is a prop definition (Level 2 feature)">
              prop
            </span>
          )}
          
          {/* Remove button */}
          <button
            onClick={() => onRemove(name)}
            className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded
                       transition-colors focus:outline-none focus:ring-2 focus:ring-red-500"
            title="Remove property"
            aria-label={`Remove ${name} property`}
          >
            <XMarkIcon className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Property input */}
      <PropertyInput
        name={name}
        property={property}
        value={value}
        onChange={onChange}
        disabled={!editable}
        componentType={componentType}
      />

      {/* Footer: description and indicators */}
      <div className="flex items-start gap-2 mt-2">
        {/* Description from template (Task 3.5bis) */}
        {description && (
          <div className="flex items-start gap-1 flex-1">
            <InformationCircleIcon className="w-3 h-3 text-gray-400 flex-shrink-0 mt-0.5" />
            <span className="text-xs text-gray-500">{description}</span>
          </div>
        )}
        {/* Right side indicators */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Required indicator - from template or PropProperty */}
          {(templateProp?.required || (property.type === 'prop' && (property as PropProperty).required)) && (
            <span className="text-xs text-red-500">Required</span>
          )}
          
          {/* Non-editable indicator */}
          {!editable && (
            <span className="text-xs text-gray-400 italic">
              Read-only (prop definition)
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
