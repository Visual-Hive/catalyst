/**
 * @file StylingEditor.tsx
 * @description Editor for component Tailwind CSS classes and inline styles
 * 
 * @architecture Phase 2, Task 2.3B - Property Panel Editor
 * @updated 2025-11-29 - Task 3.6: Added Visual Style Editor toggle
 * @created 2025-11-26
 * @author AI (Cline) + Human Review
 * @confidence 9/10 - Tag-style class editor with add/remove + inline styles + visual editor
 * 
 * @see .implementation/phase-2-component-management/task-2.3-property-panel-editor.md
 * @see .implementation/phase-3-code-generation-and-preview/task-3.5bis-property-panel-enhancements.md
 * @see .implementation/phase-3-code-generation-and-preview/task-3.6-visual-style-controls.md
 * @see src/renderer/store/manifestStore.ts - updateComponent action
 * 
 * PROBLEM SOLVED:
 * Users need to edit styling on components:
 * - View existing Tailwind classes as tags (Text mode)
 * - Add new classes with autocomplete suggestions (Text mode)
 * - Visual controls for common styles (Visual mode - Task 3.6)
 * - See and edit inline CSS styles (Task 3.5bis)
 * - See custom CSS (read-only in Level 1)
 * 
 * SOLUTION:
 * - Toggle between "Visual" and "Text" editing modes
 * - Visual mode: VisualStyleEditor with collapsible sections
 * - Text mode: Tag-based UI shows classes as removable pills
 * - Autocomplete dropdown for Tailwind class suggestions
 * - InlineStylesEditor shows/edits CSS properties
 * - Updates manifestStore.updateComponent() on changes
 * 
 * LAYOUT:
 * ┌─────────────────────────────────────────────────────┐
 * │ Styling                                             │
 * ├─────────────────────────────────────────────────────┤
 * │ Tailwind Classes:                                   │
 * │ ┌─────────────────────────────────────────────────┐ │
 * │ │ [bg-blue-500 x] [text-white x] [px-4 x] [py-2 x]│ │
 * │ └─────────────────────────────────────────────────┘ │
 * │ [flex_________________] ← autocomplete dropdown     │
 * │                                                     │
 * │ Inline Styles:                                      │
 * │ ┌─────────────────────────────────────────────────┐ │
 * │ │ ► Layout    (3 properties)                      │ │
 * │ │ ► Flexbox   (2 properties)                      │ │
 * │ └─────────────────────────────────────────────────┘ │
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

import React, { useCallback, useState, useMemo, useRef, useEffect } from 'react';
import { PaintBrushIcon, XMarkIcon, PlusIcon, EyeIcon, CodeBracketIcon } from '@heroicons/react/24/outline';
import { useManifestStore } from '../../store/manifestStore';
import { InlineStylesEditor } from './InlineStylesEditor';
import { VisualStyleEditor } from '../StyleEditor';
import { TAILWIND_CLASS_SUGGESTIONS } from '../../../core/templates/componentTemplates';
import type { Component, ComponentStyling } from '../../../core/legacy-manifest/types';

/**
 * Editing mode for styling: visual controls vs text-based
 */
type StylingMode = 'visual' | 'text';

/**
 * Flatten all Tailwind suggestions into a single searchable array
 * Creates array of unique class names from all categories
 */
const ALL_TAILWIND_CLASSES: string[] = (() => {
  const allClasses = new Set<string>();
  Object.values(TAILWIND_CLASS_SUGGESTIONS).forEach((classes) => {
    classes.forEach((cls) => allClasses.add(cls));
  });
  return Array.from(allClasses).sort();
})();

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

  // Mode toggle: visual vs text-based editing
  const [mode, setMode] = useState<StylingMode>('visual');

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

  // Autocomplete state
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<HTMLDivElement>(null);

  /**
   * Filter suggestions based on current input
   * Matches classes that contain the input string (case-insensitive)
   */
  const filteredSuggestions = useMemo(() => {
    if (!newClass.trim()) return [];
    
    const query = newClass.toLowerCase();
    return ALL_TAILWIND_CLASSES
      .filter((cls) => 
        cls.toLowerCase().includes(query) && 
        !baseClasses.includes(cls)
      )
      .slice(0, 15); // Limit to 15 suggestions
  }, [newClass, baseClasses]);

  /**
   * Handle input change with autocomplete
   */
  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setNewClass(e.target.value);
      setShowAutocomplete(true);
      setSelectedIndex(0);
    },
    []
  );

  /**
   * Handle suggestion selection
   */
  const handleSelectSuggestion = useCallback(
    (suggestion: string) => {
      // Add the selected class
      if (!baseClasses.includes(suggestion)) {
        const updatedClasses = [...baseClasses, suggestion];
        const updatedStyling: ComponentStyling = {
          ...freshComponent.styling,
          baseClasses: updatedClasses,
        };
        updateComponent(freshComponent.id, { styling: updatedStyling });
      }
      
      // Clear input and hide autocomplete
      setNewClass('');
      setShowAutocomplete(false);
      inputRef.current?.focus();
    },
    [baseClasses, freshComponent, updateComponent]
  );

  /**
   * Handle keyboard navigation in autocomplete
   */
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        
        // If autocomplete is showing and has selection, use that
        if (showAutocomplete && filteredSuggestions.length > 0) {
          handleSelectSuggestion(filteredSuggestions[selectedIndex]);
        } else {
          handleAddClass();
        }
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (showAutocomplete && filteredSuggestions.length > 0) {
          setSelectedIndex((prev) => 
            prev < filteredSuggestions.length - 1 ? prev + 1 : 0
          );
        }
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (showAutocomplete && filteredSuggestions.length > 0) {
          setSelectedIndex((prev) => 
            prev > 0 ? prev - 1 : filteredSuggestions.length - 1
          );
        }
      } else if (e.key === 'Escape') {
        setShowAutocomplete(false);
      } else if (e.key === 'Tab' && showAutocomplete && filteredSuggestions.length > 0) {
        e.preventDefault();
        handleSelectSuggestion(filteredSuggestions[selectedIndex]);
      }
    },
    [handleAddClass, showAutocomplete, filteredSuggestions, selectedIndex, handleSelectSuggestion]
  );

  /**
   * Close autocomplete when clicking outside
   */
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        autocompleteRef.current && 
        !autocompleteRef.current.contains(e.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(e.target as Node)
      ) {
        setShowAutocomplete(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  /**
   * Scroll selected item into view
   */
  useEffect(() => {
    if (showAutocomplete && autocompleteRef.current) {
      const selectedEl = autocompleteRef.current.children[selectedIndex] as HTMLElement;
      if (selectedEl) {
        selectedEl.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [selectedIndex, showAutocomplete]);

  /**
   * Get current className string from base classes
   * Used for VisualStyleEditor integration
   */
  const currentClassName = useMemo(() => {
    return baseClasses.join(' ');
  }, [baseClasses]);

  /**
   * Handle className change from VisualStyleEditor
   * Parses the string back into baseClasses array
   */
  const handleClassNameChange = useCallback((newClassName: string) => {
    const newClasses = newClassName.split(/\s+/).filter(Boolean);
    
    const updatedStyling: ComponentStyling = {
      ...freshComponent.styling,
      baseClasses: newClasses,
    };
    
    updateComponent(freshComponent.id, { styling: updatedStyling });
  }, [freshComponent, updateComponent]);

  return (
    <section>
      {/* Section header with mode toggle */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <PaintBrushIcon className="w-4 h-4 text-gray-500" />
          <h3 className="text-xs font-medium text-gray-700 uppercase tracking-wider">
            Styling
          </h3>
        </div>
        
        {/* Mode toggle buttons */}
        <div className="flex rounded border border-gray-300 overflow-hidden">
          <button
            type="button"
            onClick={() => setMode('visual')}
            className={`flex items-center gap-1 px-2 py-1 text-[10px] font-medium transition-colors
                       ${mode === 'visual' 
                         ? 'bg-blue-500 text-white' 
                         : 'bg-white text-gray-600 hover:bg-gray-50'}
                       border-r border-gray-300`}
            title="Visual editing mode"
          >
            <EyeIcon className="w-3 h-3" />
            Visual
          </button>
          <button
            type="button"
            onClick={() => setMode('text')}
            className={`flex items-center gap-1 px-2 py-1 text-[10px] font-medium transition-colors
                       ${mode === 'text' 
                         ? 'bg-blue-500 text-white' 
                         : 'bg-white text-gray-600 hover:bg-gray-50'}`}
            title="Text editing mode"
          >
            <CodeBracketIcon className="w-3 h-3" />
            Text
          </button>
        </div>
      </div>

      {/* Visual Mode: Use VisualStyleEditor */}
      {mode === 'visual' && (
        <div className="space-y-3">
          <VisualStyleEditor
            className={currentClassName}
            onChange={handleClassNameChange}
          />
          
          {/* Inline Styles Editor (also in visual mode) */}
          <InlineStylesEditor component={component} />
        </div>
      )}

      {/* Text Mode: Original tag-based interface */}
      {mode === 'text' && (
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

          {/* Add class input with autocomplete */}
          <div className="relative">
            <div className="flex gap-2">
              <input
                ref={inputRef}
                type="text"
                value={newClass}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                onFocus={() => newClass.trim() && setShowAutocomplete(true)}
                placeholder="Add class (e.g., flex, bg-gray-100)"
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

            {/* Autocomplete dropdown */}
            {showAutocomplete && filteredSuggestions.length > 0 && (
              <div 
                ref={autocompleteRef}
                className="absolute z-10 w-full mt-1 bg-white border border-gray-200 
                           rounded-lg shadow-lg max-h-48 overflow-y-auto"
              >
                {filteredSuggestions.map((suggestion, index) => (
                  <button
                    key={suggestion}
                    onClick={() => handleSelectSuggestion(suggestion)}
                    className={`w-full px-3 py-1.5 text-left text-xs font-mono
                               hover:bg-blue-50 transition-colors
                               ${index === selectedIndex ? 'bg-blue-50 text-blue-700' : 'text-gray-700'}`}
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Tip for multiple classes */}
          <p className="mt-1 text-xs text-gray-400">
            Type to search. Press Enter, Tab, or click to add. Separate multiple classes with spaces.
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

        {/* Inline Styles Editor (Task 3.5bis) */}
        <InlineStylesEditor component={component} />

        {/* Empty state - only show if no Tailwind classes AND no inline styles */}
        {baseClasses.length === 0 && 
         !freshComponent.styling?.inlineStyles &&
         !component.styling?.conditionalClasses?.container?.length &&
         !component.styling?.customCSS && (
          <p className="text-xs text-gray-500 italic text-center py-2">
            No styling defined. Add Tailwind classes or inline styles above.
          </p>
        )}
        </div>
      )}
    </section>
  );
}
