/**
 * @file AddPropertyDialog.tsx
 * @description Dialog for adding new properties to a component
 * 
 * @architecture Phase 2, Task 2.3C - Property Panel Editor
 * @created 2025-11-26
 * @author AI (Cline) + Human Review
 * @confidence 9/10 - Standard form dialog with validation
 * 
 * @see .implementation/phase-2-component-management/task-2.3-property-panel-editor.md
 * @see src/renderer/components/Modal.tsx - Reusable modal component
 * 
 * PROBLEM SOLVED:
 * Users need to add new properties to components. This requires:
 * - Property name (valid identifier, unique)
 * - Data type selection (string, number, boolean)
 * - Default value (type-appropriate input)
 * - Validation before submission
 * 
 * SOLUTION:
 * Modal dialog with form fields and validation.
 * Uses existing Modal component for consistent UX.
 * 
 * LEVEL 1 RESTRICTIONS:
 * - Only creates StaticProperty (not PropProperty)
 * - No expression option
 * - Simple data types only (no object/array creation)
 * 
 * FORM FIELDS:
 * - Property Name (text, required, unique)
 * - Data Type (dropdown: string, number, boolean)
 * - Default Value (type-appropriate input)
 * 
 * @security-critical false
 * @performance-critical false
 */

import React, { useState, useCallback, useEffect } from 'react';
import { Modal } from '../Modal';
import type { PropertyDataType } from '../../../core/manifest/types';

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
}: AddPropertyDialogProps): React.ReactElement {
  // Form state
  const [name, setName] = useState('');
  const [dataType, setDataType] = useState<PropertyDataType>('string');
  const [stringValue, setStringValue] = useState('');
  const [numberValue, setNumberValue] = useState(0);
  const [booleanValue, setBooleanValue] = useState(false);
  
  // Validation state
  const [error, setError] = useState<string | null>(null);

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
   * Handle form submission
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
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Error message */}
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded text-sm text-red-600">
            {error}
          </div>
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
            autoFocus
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
    </Modal>
  );
}
