/**
 * @file AddPropertyDialog.tsx
 * @description Dialog for adding new properties to a component with template suggestions
 * 
 * @architecture Phase 2, Task 2.3C - Property Panel Editor
 * @updated 2025-11-29 - Task 3.5bis: Added template-based property suggestions
 * @created 2025-11-26
 * @author AI (Cline) + Human Review
 * @confidence 9/10 - Standard form dialog with validation + template integration
 * 
 * @see .implementation/phase-2-component-management/task-2.3-property-panel-editor.md
 * @see .implementation/phase-3-code-generation-and-preview/task-3.5bis-property-panel-enhancements.md
 * @see src/renderer/components/Modal.tsx - Reusable modal component
 * 
 * PROBLEM SOLVED:
 * Users need to add new properties to components:
 * - Property name (valid identifier, unique)
 * - Data type selection (string, number, boolean)
 * - Default value (type-appropriate input)
 * - Validation before submission
 * - (Task 3.5bis) Suggestions from component templates
 * 
 * SOLUTION:
 * Modal dialog with:
 * - Template suggestions section (when componentType is provided)
 * - Quick add checkboxes for suggested properties
 * - Custom property form as fallback
 * - Uses templateRegistry for suggestions
 * 
 * LAYOUT (Task 3.5bis):
 * ┌─────────────────────────────────────────────────────┐
 * │ Add Property                                        │
 * ├─────────────────────────────────────────────────────┤
 * │ Suggested Properties (Button):                      │
 * │ ┌─────────────────────────────────────────────────┐ │
 * │ │ ☐ label      Text displayed on the button       │ │
 * │ │ ☐ variant    Visual style (primary, secondary)  │ │
 * │ │ ☐ disabled   Whether the button is disabled     │ │
 * │ │ ☐ type       Button type (button, submit)       │ │
 * │ └─────────────────────────────────────────────────┘ │
 * │                                                     │
 * │ ─── OR add custom property ───                      │
 * │                                                     │
 * │ Property Name: [________________]                   │
 * │ Data Type:     [string ▼]                           │
 * │ Default Value: [________________]                   │
 * │                                                     │
 * │ [Cancel] [Add Selected]                             │
 * └─────────────────────────────────────────────────────┘
 * 
 * @security-critical false
 * @performance-critical false
 */

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { Modal } from '../Modal';
import { templateRegistry } from '../../../core/templates';
import type { PropertyDataType } from '../../../core/legacy-manifest/types';

/**
 * Data returned when a property is added
 */
export interface AddPropertyData {
  /** Property name (identifier) */
  name: string;
  /** Property data type */
  dataType: PropertyDataType;
  /** Default/initial value */
  value: string | number | boolean | null;
}

/**
 * Props for AddPropertyDialog component
 */
interface AddPropertyDialogProps {
  /** Whether dialog is open */
  isOpen: boolean;
  /** Callback when dialog should close */
  onClose: () => void;
  /** Callback when property is added - receives property data */
  onAdd: (data: AddPropertyData) => void;
  /** List of existing property names (for uniqueness validation) */
  existingPropertyNames: string[];
  /** Component type for template-based suggestions (Task 3.5bis) */
  componentType?: string;
}

/**
 * Available data types for new properties
 */
const DATA_TYPES: Array<{ value: PropertyDataType; label: string }> = [
  { value: 'string', label: 'String (text)' },
  { value: 'number', label: 'Number' },
  { value: 'boolean', label: 'Boolean (true/false)' },
];

/**
 * Add Property Dialog
 * 
 * Modal dialog for creating new properties on a component.
 * Includes validation for property name and type-appropriate
 * default value input.
 * 
 * @param props - Dialog props
 * @returns Dialog component
 * 
 * @example
 * ```tsx
 * <AddPropertyDialog
 *   isOpen={showDialog}
 *   onClose={() => setShowDialog(false)}
 *   onAdd={(data) => addProperty(data)}
 *   existingPropertyNames={['label', 'disabled']}
 * />
 * ```
 */
export function AddPropertyDialog({
  isOpen,
  onClose,
  onAdd,
  existingPropertyNames,
  componentType,
}: AddPropertyDialogProps): React.ReactElement {
  // Form state for custom property
  const [name, setName] = useState('');
  const [dataType, setDataType] = useState<PropertyDataType>('string');
  const [stringValue, setStringValue] = useState('');
  const [numberValue, setNumberValue] = useState(0);
  const [booleanValue, setBooleanValue] = useState(false);
  
  // Validation state
  const [error, setError] = useState<string | null>(null);

  // Suggested properties state (Task 3.5bis)
  const [selectedSuggestions, setSelectedSuggestions] = useState<Set<string>>(new Set());
  const [showCustomForm, setShowCustomForm] = useState(false);

  /**
   * Get suggested properties from template, filtered by what's already added
   */
  const suggestedProperties = useMemo(() => {
    if (!componentType) return [];
    
    const templateProps = templateRegistry.getPropertyTemplates(componentType);
    return templateProps.filter(
      (prop) => !existingPropertyNames.includes(prop.name)
    );
  }, [componentType, existingPropertyNames]);

  /**
   * Check if we have any suggestions
   */
  const hasSuggestions = suggestedProperties.length > 0;

  /**
   * Reset form to initial state
   */
  const resetForm = useCallback(() => {
    setName('');
    setDataType('string');
    setStringValue('');
    setNumberValue(0);
    setBooleanValue(false);
    setError(null);
    setSelectedSuggestions(new Set());
    setShowCustomForm(false);
  }, []);

  /**
   * Handle dialog close - reset form and call onClose
   */
  const handleClose = useCallback(() => {
    resetForm();
    onClose();
  }, [resetForm, onClose]);

  /**
   * Reset form when dialog opens
   */
  useEffect(() => {
    if (isOpen) {
      resetForm();
    }
  }, [isOpen, resetForm]);

  /**
   * Validate form before submission
   * 
   * Checks:
   * - Name is not empty
   * - Name is a valid identifier (starts with letter, alphanumeric)
   * - Name is unique (not in existingPropertyNames)
   * 
   * @returns true if valid, false otherwise (sets error message)
   */
  const validate = useCallback((): boolean => {
    // Check name is not empty
    if (!name.trim()) {
      setError('Property name is required');
      return false;
    }

    // Check name is valid identifier
    // Must start with letter, contain only letters and numbers
    if (!/^[a-zA-Z][a-zA-Z0-9]*$/.test(name)) {
      setError('Property name must start with a letter and contain only letters/numbers');
      return false;
    }

    // Check name is unique
    if (existingPropertyNames.includes(name)) {
      setError('A property with this name already exists');
      return false;
    }

    // Validation passed
    setError(null);
    return true;
  }, [name, existingPropertyNames]);

  /**
   * Toggle suggestion selection
   */
  const toggleSuggestion = useCallback((propName: string) => {
    setSelectedSuggestions((prev) => {
      const next = new Set(prev);
      if (next.has(propName)) {
        next.delete(propName);
      } else {
        next.add(propName);
      }
      return next;
    });
  }, []);

  /**
   * Handle adding selected suggestions
   */
  const handleAddSuggestions = useCallback(() => {
    // Add each selected suggestion with its template defaults
    selectedSuggestions.forEach((propName) => {
      const prop = suggestedProperties.find((p) => p.name === propName);
      if (prop) {
        // Map template dataType to manifest dataType
        const manifestDataType: PropertyDataType = 
          prop.dataType === 'enum' ? 'string' : prop.dataType as PropertyDataType;
        
        onAdd({
          name: prop.name,
          dataType: manifestDataType,
          value: prop.default,
        });
      }
    });
    
    // Reset and close
    resetForm();
  }, [selectedSuggestions, suggestedProperties, onAdd, resetForm]);

  /**
   * Handle form submission (custom property)
   * 
   * Validates form, gets appropriate value based on dataType,
   * and calls onAdd callback.
   */
  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();

      // Validate form
      if (!validate()) {
        return;
      }

      // Get value based on selected data type
      let value: string | number | boolean | null;
      switch (dataType) {
        case 'number':
          value = numberValue;
          break;
        case 'boolean':
          value = booleanValue;
          break;
        case 'string':
        default:
          value = stringValue;
          break;
      }

      // Call onAdd with property data
      onAdd({
        name: name.trim(),
        dataType,
        value,
      });

      // Reset form (dialog will close via parent)
      resetForm();
    },
    [name, dataType, stringValue, numberValue, booleanValue, validate, onAdd, resetForm]
  );

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Add Property" size="sm">
      <div className="space-y-4">
        {/* Error message */}
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded text-sm text-red-600">
            {error}
          </div>
        )}

        {/* Suggested Properties Section (Task 3.5bis) */}
        {hasSuggestions && !showCustomForm && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Suggested Properties
              {componentType && (
                <span className="ml-2 text-gray-400 font-normal">
                  ({templateRegistry.getTemplate(componentType)?.displayName || componentType})
                </span>
              )}
            </label>
            
            <div className="border border-gray-200 rounded-lg max-h-48 overflow-y-auto">
              {suggestedProperties.map((prop) => (
                <label
                  key={prop.name}
                  className="flex items-start gap-3 p-3 hover:bg-gray-50 cursor-pointer 
                             border-b border-gray-100 last:border-b-0"
                >
                  <input
                    type="checkbox"
                    checked={selectedSuggestions.has(prop.name)}
                    onChange={() => toggleSuggestion(prop.name)}
                    className="mt-0.5 w-4 h-4 text-blue-500 rounded border-gray-300 
                               focus:ring-blue-500"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm text-gray-700">
                        {prop.name}
                      </span>
                      <span className="text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">
                        {prop.dataType}
                      </span>
                      {prop.required && (
                        <span className="text-xs text-red-500">*</span>
                      )}
                    </div>
                    {prop.description && (
                      <p className="text-xs text-gray-500 mt-0.5 truncate">
                        {prop.description}
                      </p>
                    )}
                  </div>
                </label>
              ))}
            </div>

            {/* Add selected suggestions button */}
            {selectedSuggestions.size > 0 && (
              <button
                type="button"
                onClick={handleAddSuggestions}
                className="mt-3 w-full px-4 py-2 text-sm bg-blue-500 text-white rounded 
                           hover:bg-blue-600 transition-colors
                           focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Add {selectedSuggestions.size} Selected{selectedSuggestions.size > 1 ? ' Properties' : ' Property'}
              </button>
            )}

            {/* Divider */}
            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="px-2 bg-white text-gray-500">
                  OR add custom property
                </span>
              </div>
            </div>

            {/* Show custom form button */}
            <button
              type="button"
              onClick={() => setShowCustomForm(true)}
              className="w-full px-4 py-2 text-sm text-gray-600 border border-gray-300 
                         rounded hover:bg-gray-50 transition-colors
                         focus:outline-none focus:ring-2 focus:ring-gray-500"
            >
              Create Custom Property
            </button>
          </div>
        )}

        {/* Custom Property Form */}
        {(!hasSuggestions || showCustomForm) && (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Back button if coming from suggestions */}
            {hasSuggestions && showCustomForm && (
              <button
                type="button"
                onClick={() => setShowCustomForm(false)}
                className="text-sm text-blue-600 hover:text-blue-700 hover:underline"
              >
                ← Back to suggestions
              </button>
            )}

            {/* Property Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Property Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., label, disabled, variant"
                className="w-full px-3 py-2 border border-gray-300 rounded 
                           focus:outline-none focus:ring-2 focus:ring-blue-500"
                autoFocus={!hasSuggestions || showCustomForm}
              />
              <p className="mt-1 text-xs text-gray-500">
                Must start with a letter, letters and numbers only
              </p>
            </div>

            {/* Data Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Data Type
              </label>
              <select
                value={dataType}
                onChange={(e) => setDataType(e.target.value as PropertyDataType)}
                className="w-full px-3 py-2 border border-gray-300 rounded 
                           focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {DATA_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Default Value - type-specific input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Default Value
              </label>
              
              {/* String input */}
              {dataType === 'string' && (
                <input
                  type="text"
                  value={stringValue}
                  onChange={(e) => setStringValue(e.target.value)}
                  placeholder="Enter text value"
                  className="w-full px-3 py-2 border border-gray-300 rounded 
                             focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              )}
              
              {/* Number input */}
              {dataType === 'number' && (
                <input
                  type="number"
                  value={numberValue}
                  onChange={(e) => setNumberValue(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded 
                             focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              )}
              
              {/* Boolean input */}
              {dataType === 'boolean' && (
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={booleanValue}
                    onChange={(e) => setBooleanValue(e.target.checked)}
                    className="w-4 h-4 text-blue-500 rounded border-gray-300 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">
                    {booleanValue ? 'True' : 'False'}
                  </span>
                </label>
              )}
            </div>

            {/* Level 1 notice */}
            <div className="p-3 bg-blue-50 border border-blue-200 rounded text-xs text-blue-700">
              <strong>Level 1 MVP:</strong> Only static values supported. 
              Expression bindings coming in Level 2.
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded
                           transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-sm bg-blue-500 text-white rounded 
                           hover:bg-blue-600 transition-colors
                           focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Add Property
              </button>
            </div>
          </form>
        )}

        {/* Cancel button for suggestions mode */}
        {hasSuggestions && !showCustomForm && selectedSuggestions.size === 0 && (
          <div className="flex justify-end pt-2">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded
                         transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500"
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    </Modal>
  );
}
