/**
 * @file SecretInput.tsx
 * @description Password-style masked input for sensitive data
 * 
 * @architecture Phase 2.5, Task 2.10 - Properties Panel
 * @created 2025-12-21
 * @author AI (Cline) + Human Review
 * @confidence 9/10 - Standard password input
 * 
 * @performance-critical false
 * @security-critical true - Handles API keys and secrets
 */

import React, { useState } from 'react';
import type { ConfigFieldDefinition } from '../../../../core/workflow/nodes/types';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';

interface SecretInputProps {
  field: ConfigFieldDefinition;
  value: any;
  onChange: (value: string) => void;
}

/**
 * SecretInput - Masked input for API keys and secrets
 * 
 * Features:
 * - Password-style masking
 * - Toggle visibility button
 * - Required field indicator
 * - Security warning about storage
 * 
 * SECURITY NOTE:
 * Currently stores secrets in manifest (plaintext).
 * Future enhancement: Integrate with system keychain.
 */
export function SecretInput({ field, value, onChange }: SecretInputProps) {
  const [showSecret, setShowSecret] = useState(false);
  
  return (
    <div className="space-y-2">
      {/* Label */}
      <label className="block text-sm font-medium text-gray-700">
        {field.label}
        {field.required && <span className="text-red-500 ml-1">*</span>}
      </label>
      
      {/* Input with toggle button */}
      <div className="relative">
        <input
          type={showSecret ? 'text' : 'password'}
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder}
          className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md shadow-sm
                     focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                     placeholder-gray-400 text-sm"
        />
        
        {/* Toggle visibility button */}
        <button
          type="button"
          onClick={() => setShowSecret(!showSecret)}
          className="absolute right-2 top-1/2 -translate-y-1/2 p-1 
                     text-gray-400 hover:text-gray-600 rounded"
          aria-label={showSecret ? 'Hide secret' : 'Show secret'}
        >
          {showSecret ? (
            <EyeSlashIcon className="w-5 h-5" />
          ) : (
            <EyeIcon className="w-5 h-5" />
          )}
        </button>
      </div>
      
      {/* Description */}
      {field.description && (
        <p className="text-xs text-gray-500">{field.description}</p>
      )}
      
      {/* Security warning */}
      <p className="text-xs text-amber-600">
        ⚠️ Secret stored in manifest file. Use environment variables for production.
      </p>
    </div>
  );
}
