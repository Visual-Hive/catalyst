/**
 * @file NumberInput.tsx
 * @description Number input field with min/max/step support
 * 
 * @architecture Phase 2.5, Task 2.10 - Properties Panel
 * @created 2025-12-21
 * @author AI (Cline) + Human Review
 * @confidence 9/10 - Standard number input
 * 
 * @performance-critical false
 * @security-critical false
 */

import React from 'react';
import type { ConfigFieldDefinition } from '../../../../core/workflow/nodes/types';

interface NumberInputProps {
  field: ConfigFieldDefinition;
  value: any;
  onChange: (value: number | undefined) => void;
}

/**
 * NumberInput - Number input with validation
 * 
 * Features:
 * - Min/max/step constraints
 * - Empty value handling (undefined)
 * - Numeric validation
 * - Required field indicator
 */
export function NumberInput({ field, value, onChange }: NumberInputProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value;
    
    // Empty string = undefined
    if (rawValue === '') {
      onChange(undefined);
      return;
    }
    
    // Parse and validate
    const numValue = parseFloat(rawValue);
    if (!isNaN(numValue)) {
      onChange(numValue);
    }
  };
  
  return (
    <div className="space-y-2">
      {/* Label */}
      <label className="block text-sm font-medium text-gray-700">
        {field.label}
        {field.required && <span className="text-red-500 ml-1">*</span>}
      </label>
      
      {/* Input */}
      <input
        type="number"
        value={value ?? ''}
        onChange={handleChange}
        placeholder={field.placeholder}
        min={field.min}
        max={field.max}
        step={field.step ?? 'any'}
        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm
                   focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                   placeholder-gray-400 text-sm"
      />
      
      {/* Description */}
      {field.description && (
        <p className="text-xs text-gray-500">{field.description}</p>
      )}
    </div>
  );
}
