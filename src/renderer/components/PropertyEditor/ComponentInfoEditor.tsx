/**
 * @file ComponentInfoEditor.tsx
 * @description Editor for component displayName and category
 * 
 * @architecture Phase 2, Task 2.3B - Property Panel Editor
 * @created 2025-11-26
 * @author AI (Cline) + Human Review
 * @confidence 9/10 - Standard form inputs with blur-save pattern
 * 
 * @see .implementation/phase-2-component-management/task-2.3-property-panel-editor.md
 * @see src/renderer/store/manifestStore.ts - updateComponent action
 * 
 * PROBLEM SOLVED:
 * Users need to edit basic component information:
 * - Display name (editable)
 * - Category (editable dropdown)
 * - Component type (read-only)
 * - Component ID (read-only)
 * 
 * SOLUTION:
 * Section with editable fields that save on blur/change.
 * Uses same updateComponent pattern as PropertiesEditor.
 * 
 * LAYOUT:
 * ┌─────────────────────────────────────────────────────┐
 * │ Component Info                                      │
 * ├─────────────────────────────────────────────────────┤
 * │ ┌─────────────────────────────────────────────────┐ │
 * │ │ [icon] ComponentType                            │ │
 * │ │        comp_xxx_xxx                             │ │
 * │ └─────────────────────────────────────────────────┘ │
 * │ Display Name: [___________________]                 │
 * │ Category:     [Basic ▼]                            │
 * └─────────────────────────────────────────────────────┘
 * 
 * @security-critical false
 * @performance-critical false
 */

import React, { useCallback, useState, useEffect } from 'react';
import { InformationCircleIcon } from '@heroicons/react/24/outline';
import { useManifestStore } from '../../store/manifestStore';
import { ComponentIcon } from '../ComponentTree/ComponentIcon';
import type { Component } from '../../../core/legacy-manifest/types';

/**
 * Available component categories
 */
const CATEGORIES = [
  { value: 'basic', label: 'Basic' },
  { value: 'layout', label: 'Layout' },
  { value: 'form', label: 'Form' },
  { value: 'custom', label: 'Custom' },
] as const;

/**
 * Props for ComponentInfoEditor component
 */
interface ComponentInfoEditorProps {
  /** Component to edit */
  component: Component;
}

/**
 * Component Info Editor
 * 
 * Section for editing basic component information:
 * - Displays component icon and type (read-only)
 * - Displays component ID (read-only)
 * - Editable display name (saves on blur)
 * - Editable category (saves on change)
 * 
 * @param props - ComponentInfoEditor props
 * @returns Component info editor section
 * 
 * @example
 * ```tsx
 * <ComponentInfoEditor component={selectedComponent} />
 * ```
 */
export function ComponentInfoEditor({ component }: ComponentInfoEditorProps): React.ReactElement {
  // Get updateComponent action from store
  const updateComponent = useManifestStore((s) => s.updateComponent);

  // Subscribe to manifest to ensure re-renders on changes
  // This is needed because the component prop may not trigger re-render
  const freshComponent = useManifestStore((s) => 
    s.manifest?.components[component.id]
  ) || component;

  // Local state for display name (for controlled input)
  const [nameValue, setNameValue] = useState(freshComponent.displayName);

  /**
   * Sync local name state when component changes
   * (e.g., user selects different component)
   */
  useEffect(() => {
    setNameValue(component.displayName);
  }, [component.id, component.displayName]);

  /**
   * Handle display name input change
   * Updates local state only - save happens on blur
   */
  const handleNameChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setNameValue(e.target.value);
    },
    []
  );

  /**
   * Handle display name blur
   * Saves the value if it has changed
   */
  const handleNameBlur = useCallback(() => {
    const trimmedName = nameValue.trim();
    
    // Only save if name has changed and is not empty
    if (trimmedName && trimmedName !== component.displayName) {
      updateComponent(component.id, { displayName: trimmedName });
    } else if (!trimmedName) {
      // Reset to original if empty
      setNameValue(component.displayName);
    }
  }, [nameValue, component.id, component.displayName, updateComponent]);

  /**
   * Handle Enter key in display name input
   * Blurs the input to trigger save
   */
  const handleNameKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        e.currentTarget.blur();
      }
    },
    []
  );

  /**
   * Handle category change
   * Saves immediately on selection
   */
  const handleCategoryChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const newCategory = e.target.value as Component['category'];
      updateComponent(component.id, { category: newCategory });
    },
    [component.id, updateComponent]
  );

  return (
    <section>
      {/* Section header */}
      <div className="flex items-center gap-2 mb-3">
        <InformationCircleIcon className="w-4 h-4 text-gray-500" />
        <h3 className="text-xs font-medium text-gray-700 uppercase tracking-wider">
          Component Info
        </h3>
      </div>

      <div className="space-y-3">
        {/* Component type and ID display (read-only) */}
        <div className="flex items-center gap-3 p-3 bg-gray-50 border border-gray-200 rounded-lg">
          {/* Component icon */}
          <ComponentIcon component={component} className="w-8 h-8 flex-shrink-0" />
          
          {/* Type and ID */}
          <div className="min-w-0 flex-1">
            <div className="text-sm font-medium text-gray-900">
              {component.type}
            </div>
            <div className="text-xs text-gray-500 font-mono truncate" title={component.id}>
              {component.id}
            </div>
          </div>
        </div>

        {/* Display Name input */}
        <div>
          <label 
            htmlFor="displayName" 
            className="block text-xs font-medium text-gray-700 mb-1"
          >
            Display Name
          </label>
          <input
            id="displayName"
            type="text"
            value={nameValue}
            onChange={handleNameChange}
            onBlur={handleNameBlur}
            onKeyDown={handleNameKeyDown}
            placeholder="Component name"
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded 
                       focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Category select */}
        <div>
          <label 
            htmlFor="category" 
            className="block text-xs font-medium text-gray-700 mb-1"
          >
            Category
          </label>
          <select
            id="category"
            value={component.category || 'custom'}
            onChange={handleCategoryChange}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded 
                       focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {CATEGORIES.map((cat) => (
              <option key={cat.value} value={cat.value}>
                {cat.label}
              </option>
            ))}
          </select>
        </div>
      </div>
    </section>
  );
}
