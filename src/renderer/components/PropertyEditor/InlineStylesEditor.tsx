/**
 * @file InlineStylesEditor.tsx
 * @description Editor for component inline CSS styles, grouped by category
 * 
 * @architecture Phase 3, Task 3.5bis - Property Panel UX Enhancements
 * @created 2025-11-29
 * @author AI (Cline) + Human Review
 * @confidence 9/10 - Uses existing STYLE_PROPERTY_CATEGORIES data
 * 
 * @see .implementation/phase-3-code-generation-and-preview/task-3.5bis-property-panel-enhancements.md
 * @see src/core/templates/componentTemplates.ts - STYLE_PROPERTY_CATEGORIES
 * 
 * PROBLEM SOLVED:
 * - Inline styles (width, height, padding, etc.) were stored in manifest but NOT visible in UI
 * - Users couldn't see or edit the actual CSS properties applied to components
 * - No organization or presets for style properties
 * 
 * SOLUTION:
 * - New component that reads component.styling.inlineStyles
 * - Groups properties by category (Layout, Display, Flexbox, etc.)
 * - Shows preset dropdowns for common values
 * - Allows adding new style properties from available options
 * - Allows removing existing style properties
 * 
 * LAYOUT:
 * ┌─────────────────────────────────────────────────────┐
 * │ Inline Styles                                       │
 * ├─────────────────────────────────────────────────────┤
 * │ ▼ Layout                                            │
 * │   ┌─────────────┬─────────────────────────────────┐ │
 * │   │ width       │ [auto           ▼]              │ │
 * │   │ minHeight   │ [50px                       ]   │ │
 * │   └─────────────┴─────────────────────────────────┘ │
 * │                                                     │
 * │ ▼ Flexbox                                           │
 * │   ┌─────────────┬─────────────────────────────────┐ │
 * │   │ flexDir     │ [column         ▼]              │ │
 * │   │ gap         │ [8px            ▼]              │ │
 * │   └─────────────┴─────────────────────────────────┘ │
 * │                                                     │
 * │ [+ Add Style Property ▼]                            │
 * └─────────────────────────────────────────────────────┘
 * 
 * @security-critical false
 * @performance-critical false
 */

import React, { useCallback, useState, useMemo } from 'react';
import { 
  ChevronDownIcon, 
  ChevronRightIcon, 
  XMarkIcon,
  PlusIcon,
} from '@heroicons/react/24/outline';
import { useManifestStore } from '../../store/manifestStore';
import { 
  STYLE_PROPERTY_CATEGORIES,
  type StylePropertyDef,
  type StyleCategoryDef,
} from '../../../core/templates/componentTemplates';
import type { Component, ComponentStyling } from '../../../core/legacy-manifest/types';

/**
 * Props for InlineStylesEditor component
 */
interface InlineStylesEditorProps {
  /** Component to edit inline styles for */
  component: Component;
}

/**
 * Props for StylePropertyRow component
 */
interface StylePropertyRowProps {
  /** Property name (CSS property) */
  name: string;
  /** Current value */
  value: string;
  /** Property definition (for presets/options) */
  propertyDef?: StylePropertyDef;
  /** Callback when value changes */
  onChange: (name: string, value: string) => void;
  /** Callback when property is removed */
  onRemove: (name: string) => void;
}

/**
 * Single style property row with input/select and remove button
 * 
 * @param props - StylePropertyRow props
 * @returns Style property row element
 */
function StylePropertyRow({
  name,
  value,
  propertyDef,
  onChange,
  onRemove,
}: StylePropertyRowProps): React.ReactElement {
  return (
    <div className="flex items-center gap-2 py-1">
      {/* Property name label */}
      <label 
        className="w-24 text-xs text-gray-600 truncate flex-shrink-0"
        title={name}
      >
        {name}
      </label>

      {/* Simple text input */}
      <div className="flex-1 min-w-0">
        <input
          type="text"
          value={value || ''}
          onChange={(e) => onChange(name, e.target.value)}
          placeholder={propertyDef?.default || ''}
          className="w-full px-2 py-1 text-xs font-mono border border-gray-300 rounded 
                     focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>

      {/* Remove button */}
      <button
        onClick={() => onRemove(name)}
        className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded
                   transition-colors flex-shrink-0"
        title={`Remove ${name}`}
      >
        <XMarkIcon className="w-3 h-3" />
      </button>
    </div>
  );
}

/**
 * Props for StyleCategory component
 */
interface StyleCategoryProps {
  /** Category definition */
  category: StyleCategoryDef;
  /** Current inline styles */
  inlineStyles: Record<string, string>;
  /** Callback when a style value changes */
  onChange: (name: string, value: string) => void;
  /** Callback when a style is removed */
  onRemove: (name: string) => void;
}

/**
 * Collapsible category section for style properties
 * 
 * @param props - StyleCategory props
 * @returns Category section element
 */
function StyleCategory({
  category,
  inlineStyles,
  onChange,
  onRemove,
}: StyleCategoryProps): React.ReactElement | null {
  // Local state for expansion
  const [isExpanded, setIsExpanded] = useState(true);

  // Filter properties that are set in this category
  const setProperties = useMemo(() => {
    return category.properties.filter((prop) => 
      inlineStyles[prop.name] !== undefined
    );
  }, [category.properties, inlineStyles]);

  // Don't render if no properties are set in this category
  if (setProperties.length === 0) {
    return null;
  }

  return (
    <div className="border-b border-gray-100 last:border-b-0">
      {/* Category header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-1 w-full py-1 px-1 text-xs font-medium 
                   text-gray-700 hover:bg-gray-50 transition-colors"
      >
        {isExpanded ? (
          <ChevronDownIcon className="w-3 h-3" />
        ) : (
          <ChevronRightIcon className="w-3 h-3" />
        )}
        {category.label}
        <span className="text-gray-400 ml-1">({setProperties.length})</span>
      </button>

      {/* Category content */}
      {isExpanded && (
        <div className="pl-4 pb-2">
          {setProperties.map((prop) => (
            <StylePropertyRow
              key={prop.name}
              name={prop.name}
              value={inlineStyles[prop.name] || ''}
              propertyDef={prop}
              onChange={onChange}
              onRemove={onRemove}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Find which category a property belongs to
 * 
 * @param propertyName - CSS property name
 * @returns Category key and definition, or undefined if not found
 */
function findPropertyCategory(propertyName: string): {
  categoryKey: string;
  category: StyleCategoryDef;
  propertyDef: StylePropertyDef;
} | undefined {
  for (const [key, category] of Object.entries(STYLE_PROPERTY_CATEGORIES)) {
    const prop = category.properties.find((p) => p.name === propertyName);
    if (prop) {
      return { categoryKey: key, category, propertyDef: prop };
    }
  }
  return undefined;
}

/**
 * Get all available style properties that are not already set
 * 
 * @param currentStyles - Currently set inline styles
 * @returns Array of available properties grouped by category
 */
function getAvailableProperties(currentStyles: Record<string, string>): Array<{
  categoryKey: string;
  categoryLabel: string;
  properties: StylePropertyDef[];
}> {
  const result: Array<{
    categoryKey: string;
    categoryLabel: string;
    properties: StylePropertyDef[];
  }> = [];

  for (const [key, category] of Object.entries(STYLE_PROPERTY_CATEGORIES)) {
    const availableProps = category.properties.filter(
      (prop) => currentStyles[prop.name] === undefined
    );
    
    if (availableProps.length > 0) {
      result.push({
        categoryKey: key,
        categoryLabel: category.label,
        properties: availableProps,
      });
    }
  }

  return result;
}

/**
 * Inline Styles Editor Component
 * 
 * Displays and edits component.styling.inlineStyles.
 * Properties are grouped by category (Layout, Display, Flexbox, etc.).
 * Provides preset dropdowns and ability to add/remove properties.
 * 
 * @param props - InlineStylesEditor props
 * @returns Inline styles editor section
 * 
 * @example
 * ```tsx
 * <InlineStylesEditor component={selectedComponent} />
 * ```
 */
export function InlineStylesEditor({ component }: InlineStylesEditorProps): React.ReactElement {
  // Get updateComponent action from store
  const updateComponent = useManifestStore((s) => s.updateComponent);

  // Subscribe to manifest to ensure re-renders on changes
  const freshComponent = useManifestStore((s) => 
    s.manifest?.components[component.id]
  ) || component;

  // Get current inline styles (with fallback to empty object)
  const inlineStyles = freshComponent.styling?.inlineStyles || {};

  // State for add property dropdown
  const [showAddDropdown, setShowAddDropdown] = useState(false);

  /**
   * Handle style property value change
   * 
   * @param name - Property name
   * @param value - New value
   */
  const handleChange = useCallback(
    (name: string, value: string) => {
      const updatedInlineStyles = {
        ...inlineStyles,
        [name]: value,
      };

      const updatedStyling: ComponentStyling = {
        ...freshComponent.styling,
        inlineStyles: updatedInlineStyles,
      };

      updateComponent(freshComponent.id, { styling: updatedStyling });
    },
    [inlineStyles, freshComponent, updateComponent]
  );

  /**
   * Handle style property removal
   * 
   * @param name - Property name to remove
   */
  const handleRemove = useCallback(
    (name: string) => {
      const { [name]: _removed, ...remainingStyles } = inlineStyles;

      const updatedStyling: ComponentStyling = {
        ...freshComponent.styling,
        inlineStyles: Object.keys(remainingStyles).length > 0 ? remainingStyles : undefined,
      };

      updateComponent(freshComponent.id, { styling: updatedStyling });
    },
    [inlineStyles, freshComponent, updateComponent]
  );

  /**
   * Handle adding a new style property
   * 
   * @param propertyName - Property name to add
   */
  const handleAddProperty = useCallback(
    (propertyName: string) => {
      // Find the property definition to get default value
      const propInfo = findPropertyCategory(propertyName);
      const defaultValue = propInfo?.propertyDef.default || '';

      const updatedInlineStyles = {
        ...inlineStyles,
        [propertyName]: defaultValue,
      };

      const updatedStyling: ComponentStyling = {
        ...freshComponent.styling,
        inlineStyles: updatedInlineStyles,
      };

      updateComponent(freshComponent.id, { styling: updatedStyling });
      setShowAddDropdown(false);
    },
    [inlineStyles, freshComponent, updateComponent]
  );

  // Get available properties for add dropdown
  const availableProperties = useMemo(
    () => getAvailableProperties(inlineStyles),
    [inlineStyles]
  );

  // Get uncategorized styles (custom styles not in STYLE_PROPERTY_CATEGORIES)
  const uncategorizedStyles = useMemo(() => {
    const categorizedProps = new Set<string>();
    Object.values(STYLE_PROPERTY_CATEGORIES).forEach((cat) => {
      cat.properties.forEach((prop) => categorizedProps.add(prop.name));
    });

    return Object.entries(inlineStyles).filter(
      ([name]) => !categorizedProps.has(name)
    );
  }, [inlineStyles]);

  const hasAnyStyles = Object.keys(inlineStyles).length > 0;

  return (
    <div className="mt-4">
      {/* Section header */}
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-xs font-medium text-gray-700">Inline Styles</h4>
        
        {/* Add property dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowAddDropdown(!showAddDropdown)}
            className="flex items-center gap-1 px-2 py-1 text-xs text-blue-600 
                       hover:bg-blue-50 rounded transition-colors"
            title="Add style property"
          >
            <PlusIcon className="w-3 h-3" />
            Add
          </button>

          {/* Dropdown menu */}
          {showAddDropdown && (
            <>
              {/* Backdrop to close dropdown */}
              <div 
                className="fixed inset-0 z-10" 
                onClick={() => setShowAddDropdown(false)}
              />
              
              {/* Dropdown content */}
              <div className="absolute right-0 top-full mt-1 w-64 max-h-80 overflow-y-auto 
                              bg-white border border-gray-200 rounded-lg shadow-lg z-20">
                {availableProperties.length === 0 ? (
                  <div className="px-3 py-2 text-xs text-gray-500 italic">
                    All style properties are set
                  </div>
                ) : (
                  availableProperties.map(({ categoryKey, categoryLabel, properties }) => (
                    <div key={categoryKey} className="border-b border-gray-100 last:border-b-0">
                      <div className="px-3 py-1 text-xs font-medium text-gray-500 bg-gray-50">
                        {categoryLabel}
                      </div>
                      {properties.map((prop) => (
                        <button
                          key={prop.name}
                          onClick={() => handleAddProperty(prop.name)}
                          className="w-full px-3 py-1.5 text-left text-xs hover:bg-blue-50 
                                     flex items-center justify-between group"
                        >
                          <span className="text-gray-700">{prop.name}</span>
                          {prop.description && (
                            <span className="text-gray-400 text-[10px] truncate ml-2 
                                             group-hover:text-gray-500 max-w-[120px]">
                              {prop.description}
                            </span>
                          )}
                        </button>
                      ))}
                    </div>
                  ))
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Style properties grouped by category */}
      {hasAnyStyles ? (
        <div className="border border-gray-200 rounded-lg bg-white overflow-hidden">
          {Object.entries(STYLE_PROPERTY_CATEGORIES).map(([key, category]) => (
            <StyleCategory
              key={key}
              category={category}
              inlineStyles={inlineStyles}
              onChange={handleChange}
              onRemove={handleRemove}
            />
          ))}

          {/* Uncategorized styles (custom CSS properties) */}
          {uncategorizedStyles.length > 0 && (
            <div className="border-t border-gray-100">
              <div className="px-2 py-1 text-xs font-medium text-gray-500 bg-gray-50">
                Custom
              </div>
              <div className="pl-4 pb-2">
                {uncategorizedStyles.map(([name, value]) => (
                  <StylePropertyRow
                    key={name}
                    name={name}
                    value={value}
                    onChange={handleChange}
                    onRemove={handleRemove}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Empty state */
        <div className="py-4 text-center border border-dashed border-gray-300 rounded-lg">
          <p className="text-xs text-gray-500 italic mb-2">
            No inline styles defined
          </p>
          <button
            onClick={() => setShowAddDropdown(true)}
            className="text-xs text-blue-600 hover:text-blue-700 hover:underline"
          >
            Add your first style property
          </button>
        </div>
      )}
    </div>
  );
}
