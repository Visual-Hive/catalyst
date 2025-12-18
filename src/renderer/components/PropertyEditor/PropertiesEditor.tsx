/**
 * @file PropertiesEditor.tsx
 * @description Main properties editor section with property list and add functionality
 * 
 * @architecture Phase 2, Task 2.3A - Property Panel Editor
 * @created 2025-11-26
 * @author AI (Cline) + Human Review
 * @confidence 9/10 - Orchestrates PropertyRow components with CRUD
 * 
 * @see .implementation/phase-2-component-management/task-2.3-property-panel-editor.md
 * @see src/renderer/store/manifestStore.ts - updateComponent action
 * 
 * PROBLEM SOLVED:
 * Need a section that:
 * - Lists all properties of a component
 * - Allows editing property values
 * - Allows adding new properties
 * - Allows removing existing properties
 * - Updates manifestStore on changes (auto-saves via Task 2.2)
 * 
 * SOLUTION:
 * Container component that:
 * - Renders PropertyRow for each property
 * - Has "Add Property" button that opens AddPropertyDialog
 * - Handles property CRUD via manifestStore.updateComponent()
 * 
 * LAYOUT:
 * ┌─────────────────────────────────────────────────────┐
 * │ Properties                          [+ Add Property]│
 * ├─────────────────────────────────────────────────────┤
 * │ ┌─────────────────────────────────────────────────┐ │
 * │ │ PropertyRow (label)                             │ │
 * │ └─────────────────────────────────────────────────┘ │
 * │ ┌─────────────────────────────────────────────────┐ │
 * │ │ PropertyRow (disabled)                          │ │
 * │ └─────────────────────────────────────────────────┘ │
 * │ ...more properties...                               │
 * │                                                     │
 * │ (empty state if no properties)                      │
 * └─────────────────────────────────────────────────────┘
 * 
 * @security-critical false
 * @performance-critical false - property count typically <20
 */

import React, { useCallback, useState } from 'react';
import { PlusIcon, BoltIcon } from '@heroicons/react/24/outline';
import { PropertyRow } from './PropertyRow';
import { AddPropertyDialog, type AddPropertyData } from './AddPropertyDialog';
import { useManifestStore } from '../../store/manifestStore';
import type { Component, ComponentProperty, StaticProperty, PropertyDataType } from '../../../core/legacy-manifest/types';

/**
 * Props for PropertiesEditor component
 */
interface PropertiesEditorProps {
  /** Component to edit properties for */
  component: Component;
}

/**
 * Properties Editor Component
 * 
 * Main section for editing component properties.
 * Lists all properties with edit/remove capability,
 * and provides add functionality via dialog.
 * 
 * Data flow:
 * 1. User edits value → PropertyRow.onChange → handlePropertyChange → updateComponent
 * 2. User removes → PropertyRow.onRemove → handlePropertyRemove → updateComponent
 * 3. User adds → AddPropertyDialog.onAdd → handleAddProperty → updateComponent
 * 
 * All changes trigger manifestStore.updateComponent() which:
 * - Updates the manifest in memory
 * - Triggers debounced save to disk (Task 2.2)
 * 
 * @param props - PropertiesEditor props
 * @returns Properties editor section
 * 
 * @example
 * ```tsx
 * <PropertiesEditor component={selectedComponent} />
 * ```
 */
export function PropertiesEditor({ component }: PropertiesEditorProps): React.ReactElement {
  // Dialog state
  const [showAddDialog, setShowAddDialog] = useState(false);

  // Get updateComponent action from store
  const updateComponent = useManifestStore((s) => s.updateComponent);

  // Subscribe to manifest to ensure re-renders on changes
  // This is needed because the component prop may not trigger re-render
  const freshComponent = useManifestStore((s) => 
    s.manifest?.components[component.id]
  ) || component;

  /**
   * Handle property value change
   * 
   * Updates the property value in the manifest.
   * Only works for StaticProperty - PropProperty is read-only in Level 1.
   * 
   * @param name - Property name
   * @param value - New value
   */
  const handlePropertyChange = useCallback(
    (name: string, value: unknown) => {
      const existingProperty = freshComponent.properties[name];
      
      // Only update if property exists and is static
      if (!existingProperty || existingProperty.type !== 'static') {
        console.warn(`[PropertiesEditor] Cannot update non-static property: ${name}`);
        return;
      }

      // Create updated properties object with new value
      const updatedProperties: Record<string, ComponentProperty> = {
        ...freshComponent.properties,
        [name]: {
          ...existingProperty,
          value: value as StaticProperty['value'],
        },
      };

      // Update component in manifest
      updateComponent(freshComponent.id, { properties: updatedProperties });
    },
    [freshComponent, updateComponent]
  );

  /**
   * Handle property removal
   * 
   * Removes a property from the component.
   * 
   * @param name - Property name to remove
   */
  const handlePropertyRemove = useCallback(
    (name: string) => {
      // Create new properties object without the removed property
      const { [name]: _removed, ...remainingProperties } = freshComponent.properties;

      // Update component in manifest
      updateComponent(freshComponent.id, { properties: remainingProperties });
    },
    [freshComponent, updateComponent]
  );

  /**
   * Handle adding a new property
   * 
   * Creates a new StaticProperty and adds it to the component.
   * Called from AddPropertyDialog when form is submitted.
   * 
   * @param data - Property data from dialog
   */
  const handleAddProperty = useCallback(
    (data: AddPropertyData) => {
      // Create new StaticProperty
      const newProperty: StaticProperty = {
        type: 'static',
        dataType: data.dataType as PropertyDataType,
        value: data.value,
      };

      // Add to component properties
      const updatedProperties: Record<string, ComponentProperty> = {
        ...freshComponent.properties,
        [data.name]: newProperty,
      };

      // Update component in manifest
      updateComponent(freshComponent.id, { properties: updatedProperties });

      // Close dialog
      setShowAddDialog(false);
    },
    [freshComponent, updateComponent]
  );

  // Get property entries for rendering - use freshComponent
  const propertyEntries = Object.entries(freshComponent.properties);

  return (
    <section>
      {/* Header with title and add button */}
      <div className="flex items-center justify-between mb-3">
        {/* Section title */}
        <div className="flex items-center gap-2">
          <BoltIcon className="w-4 h-4 text-gray-500" />
          <h3 className="text-xs font-medium text-gray-700 uppercase tracking-wider">
            Properties
          </h3>
          {/* Property count badge */}
          {propertyEntries.length > 0 && (
            <span className="text-xs text-gray-400">
              ({propertyEntries.length})
            </span>
          )}
        </div>

        {/* Add button */}
        <button
          onClick={() => setShowAddDialog(true)}
          className="flex items-center gap-1 px-2 py-1 text-xs text-blue-600 
                     hover:bg-blue-50 rounded transition-colors
                     focus:outline-none focus:ring-2 focus:ring-blue-500"
          title="Add new property"
        >
          <PlusIcon className="w-3 h-3" />
          Add
        </button>
      </div>

      {/* Property list */}
      {propertyEntries.length > 0 ? (
        <div className="space-y-2">
          {propertyEntries.map(([name, property]) => (
            <PropertyRow
              key={name}
              name={name}
              property={property}
              onChange={handlePropertyChange}
              onRemove={handlePropertyRemove}
              componentType={freshComponent.type}
            />
          ))}
        </div>
      ) : (
        /* Empty state */
        <div className="py-6 text-center">
          <p className="text-xs text-gray-500 italic mb-2">
            No properties defined
          </p>
          <button
            onClick={() => setShowAddDialog(true)}
            className="text-xs text-blue-600 hover:text-blue-700 hover:underline"
          >
            Add your first property
          </button>
        </div>
      )}

      {/* Add Property Dialog */}
      <AddPropertyDialog
        isOpen={showAddDialog}
        onClose={() => setShowAddDialog(false)}
        onAdd={handleAddProperty}
        existingPropertyNames={Object.keys(component.properties)}
        componentType={component.type}
      />
    </section>
  );
}
