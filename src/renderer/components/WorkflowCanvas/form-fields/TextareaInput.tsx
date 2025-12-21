/**
 * @file TextareaInput.tsx
 * @description Multi-line text input field component
 * 
 * @architecture Phase 2.5, Task 2.10 - Properties Panel
 * @created 2025-12-21
 * @author AI (Cline) + Human Review
 * @confidence 9/10 - Standard textarea component
 * 
 * @performance-critical false
 * @security-critical false
 */

import React from 'react';
import type { ConfigFieldDefinition } from '../../../../core/workflow/nodes/types';

interface TextareaInputProps {
  field: ConfigFieldDefinition;
  value: any;
  onChange: (value: string) => void;
}

/**
 * TextareaInput - Multi-line text input
 * 
 * Features:
 * - Configurable number of rows
 * - Auto-resizing textarea
 * - Placeholder support
 * - Required field indicator
 */
export function TextareaInput({ field, value, onChange }: TextareaInputProps) {
  return (
    <div className="space-y-2">
      {/* Label */}
      <label className="block text-sm font-medium text-gray-700">
        {field.label}
        {field.required && <span className="text-red-500 ml-1">*</span>}
      </label>
      
      {/* Textarea */}
      <textarea
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder={field.placeholder}
        rows={field.rows ?? 4}
        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm
                   focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                   placeholder-gray-400 text-sm resize-y"
      />
      
      {/* Description */}
      {field.description && (
        <p className="text-xs text-gray-500">{field.description}</p>
      )}
    </div>
  );
}
