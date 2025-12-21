/**
 * @file BooleanInput.tsx
 * @description Checkbox toggle field component
 * 
 * @architecture Phase 2.5, Task 2.10 - Properties Panel
 * @created 2025-12-21
 * @author AI (Cline) + Human Review
 * @confidence 9/10 - Standard checkbox component
 * 
 * @performance-critical false
 * @security-critical false
 */

import React from 'react';
import type { ConfigFieldDefinition } from '../../../../core/workflow/nodes/types';

interface BooleanInputProps {
  field: ConfigFieldDefinition;
  value: any;
  onChange: (value: boolean) => void;
}

/**
 * BooleanInput - Checkbox toggle
 * 
 * Features:
 * - Simple on/off toggle
 * - Label appears next to checkbox
 * - Default to false if undefined
 */
export function BooleanInput({ field, value, onChange }: BooleanInputProps) {
  return (
    <div className="space-y-2">
      {/* Checkbox with inline label */}
      <div className="flex items-start">
        <div className="flex items-center h-5">
          <input
            type="checkbox"
            checked={!!value}
            onChange={(e) => onChange(e.target.checked)}
            className="w-4 h-4 text-blue-600 border-gray-300 rounded
                       focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="ml-3">
          <label className="text-sm font-medium text-gray-700">
            {field.label}
          </label>
        </div>
      </div>
      
      {/* Description */}
      {field.description && (
        <p className="text-xs text-gray-500 ml-7">{field.description}</p>
      )}
    </div>
  );
}
