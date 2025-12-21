/**
 * @file TextInput.tsx
 * @description Single-line text input field component
 * 
 * @architecture Phase 2.5, Task 2.10 - Properties Panel
 * @created 2025-12-21
 * @author AI (Cline) + Human Review
 * @confidence 9/10 - Standard input component
 * 
 * @performance-critical false
 * @security-critical false
 */

import React from 'react';
import type { ConfigFieldDefinition } from '../../../../core/workflow/nodes/types';

interface TextInputProps {
  field: ConfigFieldDefinition;
  value: any;
  onChange: (value: string) => void;
}

/**
 * TextInput - Single-line text input
 * 
 * Features:
 * - Required field indicator (red asterisk)
 * - Placeholder text support
 * - Description help text
 * - Consistent styling with Tailwind
 */
export function TextInput({ field, value, onChange }: TextInputProps) {
  return (
    <div className="space-y-2">
      {/* Label */}
      <label className="block text-sm font-medium text-gray-700">
        {field.label}
        {field.required && <span className="text-red-500 ml-1">*</span>}
      </label>
      
      {/* Input */}
      <input
        type="text"
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder={field.placeholder}
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
