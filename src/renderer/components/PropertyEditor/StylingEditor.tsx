/**
 * @file StylingEditor.tsx
 * @description Editor for component Tailwind CSS classes
 * 
 * @architecture Phase 2, Task 2.3B - Property Panel Editor
 * @created 2025-11-26
 * @author AI (Cline) + Human Review
 * @confidence 9/10 - Tag-style class editor with add/remove
 * 
 * @see .implementation/phase-2-component-management/task-2.3-property-panel-editor.md
 * @see src/renderer/store/manifestStore.ts - updateComponent action
 * 
 * PROBLEM SOLVED:
 * Users need to edit Tailwind CSS classes on components:
 * - View existing classes as tags
 * - Add new classes
 * - Remove existing classes
 * - See custom CSS (read-only in Level 1)
 * 
 * SOLUTION:
 * Tag-based UI that shows classes as removable pills.
 * Text input with Enter or Add button to add new classes.
 * Updates manifestStore.updateComponent() on changes.
 * 
 * LAYOUT:
 * ┌─────────────────────────────────────────────────────┐
 * │ Styling                                             │
 * ├─────────────────────────────────────────────────────┤
 * │ Tailwind Classes:                                   │
 * │ ┌─────────────────────────────────────────────────┐ │
 * │ │ [bg-blue-500 x] [text-white x] [px-4 x] [py-2 x]│ │
 * │ └─────────────────────────────────────────────────┘ │
 * │ [____________ Add class __________] [+]            │
 * │                                                     │
 * │ Custom CSS: (read-only preview)                    │
 * │ ┌─────────────────────────────────────────────────┐ │
 * │ │ .custom { ... }                                 │ │
 * │ └─────────────────────────────────────────────────┘ │
 * └─────────────────────────────────────────────────────┘
 * 
 * @security-critical false
 * @performance-critical false
 */

import React, { useCallback, useState } from 'react';
import { PaintBrushIcon, XMarkIcon, PlusIcon } from '@heroicons/react/24/outline';
import { useManifestStore } from '../../store/manifestStore';
import type { Component, ComponentStyling } from '../../../core/manifest/types';

/**
 * Props for StylingEditor component
 */
interface StylingEditorProps {
  /** Component to edit styling for */
  component: Component;
}

/**
 * Styling Editor Component
 * 
 * Section for editing component Tailwind CSS classes.
 * Shows existing classes as removable tags and provides
 * input for adding new classes.
 * 
 * @param props - StylingEditor props
 * @returns Styling editor section
 * 
 * @example
 * ```tsx
 * <StylingEditor component={selectedComponent} />
 * ```
 */
export function StylingEditor({ component }: StylingEditorProps): React.ReactElement {
  // Get updateComponent action from store
  const updateComponent = useManifestStore((s) => s.updateComponent);

  // Subscribe to manifest to ensure re-renders on changes
  const freshComponent = useManifestStore((s) => 
    s.manifest?.components[component.id]
  ) || component;

  // Local state for new class input
  const [newClass, setNewClass] = useState('');

  // Get current base classes (with fallback to empty array) - use freshComponent
  const baseClasses = freshComponent.styling?.baseClasses || [];

  /**
   * Add a new Tailwind class
   * 
   * Trims whitespace, validates not empty, and adds to baseClasses.
   * Handles space-separated classes (splits into multiple).
   */
  const handleAddClass = useCallback(() => {
    const trimmed = newClass.trim();
    if (!trimmed) return;

    // Split by spaces to handle multiple classes at once
    const classesToAdd = trimmed.split(/\s+/).filter(Boolean);
    
    // Filter out duplicates
    const uniqueNewClasses = classesToAdd.filter(
      (cls) => !baseClasses.includes(cls)
    );

    if (uniqueNewClasses.length === 0) {
      // All classes already exist
      setNewClass('');
      return;
    }

    // Create updated classes array
    const updatedClasses = [...baseClasses, ...uniqueNewClasses];

    // Create updated styling object
    const updatedStyling: ComponentStyling = {
      ...freshComponent.styling,
      baseClasses: updatedClasses,
    };

    // Update component in manifest
    updateComponent(freshComponent.id, { styling: updatedStyling });

    // Clear input
    setNewClass('');
  }, [newClass, baseClasses, freshComponent, updateComponent]);

  /**
   * Remove a Tailwind class
   * 
   * @param classToRemove - Class name to remove
   */
  const handleRemoveClass = useCallback(
    (classToRemove: string) => {
      // Filter out the class to remove
      const updatedClasses = baseClasses.filter((cls) => cls !== classToRemove);

      // Create updated styling object
      const updatedStyling: ComponentStyling = {
        ...freshComponent.styling,
        baseClasses: updatedClasses,
      };

      // Update component in manifest
      updateComponent(freshComponent.id, { styling: updatedStyling });
    },
    [baseClasses, freshComponent, updateComponent]
  );

  /**
   * Handle Enter key in class input
   * Adds the class when Enter is pressed
   */
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleAddClass();
      }
    },
    [handleAddClass]
  );

  return (
    <section>
      {/* Section header */}
      <div className="flex items-center gap-2 mb-3">
        <PaintBrushIcon className="w-4 h-4 text-gray-500" />
        <h3 className="text-xs font-medium text-gray-700 uppercase tracking-wider">
          Styling
        </h3>
      </div>

      <div className="space-y-3">
        {/* Tailwind Classes section */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-2">
            Tailwind Classes
          </label>

          {/* Class tags */}
          {baseClasses.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-2">
              {baseClasses.map((className, index) => (
                <span
                  key={`${className}-${index}`}
                  className="inline-flex items-center gap-1 px-2 py-1 text-xs 
                             font-mono bg-blue-50 text-blue-700 border border-blue-200 rounded
                             group"
                >
                  {className}
                  <button
                    onClick={() => handleRemoveClass(className)}
                    className="text-blue-400 hover:text-red-500 transition-colors
                               focus:outline-none focus:text-red-500"
                    title={`Remove ${className}`}
                    aria-label={`Remove ${className} class`}
                  >
                    <XMarkIcon className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          )}

          {/* Add class input */}
          <div className="flex gap-2">
            <input
              type="text"
              value={newClass}
              onChange={(e) => setNewClass(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Add class (e.g., bg-gray-100)"
              className="flex-1 px-3 py-2 text-xs font-mono border border-gray-300 rounded
                         focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={handleAddClass}
              disabled={!newClass.trim()}
              className="px-3 py-2 text-xs bg-blue-500 text-white rounded 
                         hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed
                         transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
              title="Add class"
              aria-label="Add class"
            >
              <PlusIcon className="w-4 h-4" />
            </button>
          </div>

          {/* Tip for multiple classes */}
          <p className="mt-1 text-xs text-gray-400">
            Press Enter or click + to add. Separate multiple classes with spaces.
          </p>
        </div>

        {/* Conditional classes (read-only preview in Level 1) */}
        {component.styling?.conditionalClasses?.container && 
         component.styling.conditionalClasses.container.length > 0 && (
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-2">
              Conditional Classes
              <span className="ml-2 text-gray-400 font-normal">(read-only)</span>
            </label>
            <div className="space-y-1">
              {component.styling.conditionalClasses.container.map((expr, index) => (
                <div
                  key={index}
                  className="px-3 py-2 text-xs font-mono bg-purple-50 text-purple-700 
                             border border-purple-200 rounded"
                >
                  {expr}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Custom CSS preview (read-only in Level 1) */}
        {component.styling?.customCSS && (
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-2">
              Custom CSS
              <span className="ml-2 text-gray-400 font-normal">(read-only)</span>
            </label>
            <pre className="px-3 py-2 text-xs font-mono bg-gray-50 border border-gray-200 
                           rounded overflow-x-auto text-gray-600 max-h-32 overflow-y-auto">
              {component.styling.customCSS}
            </pre>
          </div>
        )}

        {/* Empty state */}
        {baseClasses.length === 0 && 
         !component.styling?.conditionalClasses?.container?.length &&
         !component.styling?.customCSS && (
          <p className="text-xs text-gray-500 italic text-center py-2">
            No styling defined. Add Tailwind classes above.
          </p>
        )}
      </div>
    </section>
  );
}
