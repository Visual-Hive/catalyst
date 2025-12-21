/**
 * @file SelectInput.tsx
 * @description Dropdown select field component
 * 
 * @architecture Phase 2.5, Task 2.10 - Properties Panel
 * @created 2025-12-21
 * @author AI (Cline) + Human Review
 * @confidence 9/10 - Standard select dropdown
 * 
 * @performance-critical false
 * @security-critical false
 */

import React from 'react';
import type { ConfigFieldDefinition } from '../../../../core/workflow/nodes/types';

interface SelectInputProps {
  field: ConfigFieldDefinition;
  value: any;
  onChange: (value: any) => void;
}

/**
 * SelectInput - Dropdown selection field
 * 
 * Features:
 * - Predefined options from field.options
 * - Empty option for optional fields
 * - Value can be string, number, or boolean
 * - Required field indicator
 */
export function SelectInput({ field, value, onChange }: SelectInputProps) {
  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const rawValue = e.target.value;
    
    // Empty string = undefined for optional fields
    if (rawValue === '') {
      onChange(undefined);
      return;
    }
    
    // Find the matching option to get its actual value (not string representation)
    const option = field.options?.find(opt => String(opt.value) === rawValue);
    onChange(option ? option.value : rawValue);
  };
  
  return (
    <div className="space-y-2">
      {/* Label */}
      <label className="block text-sm font-medium text-gray-700">
        {field.label}
        {field.required && <span className="text-red-500 ml-1">*</span>}
      </label>
      
      {/* Select */}
      <select
        value={value ?? ''}
        onChange={handleChange}
        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm
                   focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                   bg-white text-sm"
      >
        {/* Empty option for optional fields */}
        {!field.required && (
          <option value="">-- Select {field.label} --</option>
        )}
        
        {/* Options from field definition */}
        {field.options?.map((option, index) => (
          <option key={index} value={String(option.value)}>
            {option.label}
          </option>
        ))}
      </select>
      
      {/* Description */}
      {field.description && (
        <p className="text-xs text-gray-500">{field.description}</p>
      )}
    </div>
  );
}
