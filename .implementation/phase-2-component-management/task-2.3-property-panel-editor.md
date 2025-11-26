# Task 2.3: Property Panel Editor

**Phase:** Phase 2 - Component Management  
**Duration Estimate:** 3-4 days (split into 4 subtasks)  
**Actual Duration:** [To be filled when complete]  
**Status:** 🔵 Not Started  
**Assigned:** AI (Cline) + Human Review  
**Priority:** P0 - Critical Path  
**Dependencies:** Task 2.1 ✅, Task 2.2 ✅  
**Started:** [YYYY-MM-DD]  
**Completed:** [YYYY-MM-DD]

---

## 📋 Task Split Overview

| Subtask | Name | Duration | Status |
|---------|------|----------|--------|
| **2.3A** | Basic Property Inputs | 1 day | 🔵 Not Started |
| **2.3B** | Component Info & Styling Editors | 0.5-1 day | 🔵 Not Started |
| **2.3C** | Add/Remove Properties | 0.5-1 day | 🔵 Not Started |
| **2.3D** | Validation & Polish | 0.5 day | 🔵 Not Started |

---

## 🔧 Refined Implementation Plan (2025-11-26)

### Level 1 Simplifications (Agreed)

Based on planning discussion, the following simplifications apply:

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Property type support | **StaticProperty only** | Ignore PropProperty for MVP - simpler value editing |
| Object/array properties | **Read-only with message** | Show "Complex type - coming in Level 2" |
| New properties | **Always StaticProperty** | All user-created props are static values |

### Implementation Order (Reordered)

The subtasks are reordered for better workflow:

| Phase | Components | Description |
|-------|------------|-------------|
| **Phase 1** | `index.ts`, `PropertyInput.tsx`, `PropertyRow.tsx` | Create folder + basic type-switching inputs |
| **Phase 2** | `AddPropertyDialog.tsx` | Modal for adding new properties (uses existing Modal) |
| **Phase 3** | `PropertiesEditor.tsx` | Property list with add/remove functionality |
| **Phase 4** | `ComponentInfoEditor.tsx`, `StylingEditor.tsx` | Name/category + Tailwind class editing |
| **Phase 5** | `PropertiesPanel.tsx` refactor | Integration + manual testing + polish |

### Files to Create

```
src/renderer/components/PropertyEditor/
├── index.ts                    # Barrel exports
├── PropertyInput.tsx           # Smart input switcher (string/number/boolean/select)
├── PropertyRow.tsx             # Label + input + type badge + remove button
├── PropertiesEditor.tsx        # Property list + add button
├── ComponentInfoEditor.tsx     # Display name + category editor
├── StylingEditor.tsx           # Tailwind class tags
└── AddPropertyDialog.tsx       # Modal for adding properties
```

### Implementation Progress

- [ ] **Phase 1:** PropertyEditor folder + PropertyInput + PropertyRow
- [ ] **Phase 2:** AddPropertyDialog (modal)
- [ ] **Phase 3:** PropertiesEditor (property list)
- [ ] **Phase 4:** ComponentInfoEditor + StylingEditor
- [ ] **Phase 5:** PropertiesPanel integration + testing

---

## 🎯 Task Overview

### Objective
Transform the read-only PropertiesPanel (built in Task 2.1) into a fully functional property editor that allows users to edit component properties with appropriate input types, validation, and real-time manifest updates.

### Problem Statement
Task 2.1 built a read-only properties view. Users can see component details but cannot edit them. To complete the visual editor experience, users need to:
- **Edit component names** directly in the Properties panel
- **Modify property values** with appropriate input controls
- **Add new properties** to components
- **Remove existing properties** they don't need
- **Edit styling** (Tailwind classes)
- **See changes immediately** in the manifest (and ultimately in preview)

### What Already Exists (from Tasks 2.1 & 2.2)

| Feature | Status | Location |
|---------|--------|----------|
| PropertiesPanel component | ✅ Read-only | `src/renderer/components/PropertiesPanel.tsx` |
| Selected component state | ✅ Complete | `manifestStore.selectedComponentId` |
| Component data access | ✅ Complete | `manifestStore.getComponent()` |
| Update component action | ✅ Complete | `manifestStore.updateComponent()` |
| Auto-save to disk | ✅ Complete | Task 2.2 persistence |
| Component types/schema | ✅ Complete | `src/core/manifest/types.ts` |

### What This Task Adds

| Feature | Description |
|---------|-------------|
| Editable displayName | Text input for component name |
| Property value editors | Text, number, boolean, dropdown inputs |
| Add property dialog | Form to add new properties |
| Remove property button | Delete existing properties |
| Styling editor | Edit Tailwind base classes |
| Input validation | Type checking, required fields |
| Real-time updates | Changes sync to manifestStore immediately |

### Success Criteria
- [ ] Component displayName editable
- [ ] String properties → text input
- [ ] Number properties → number input  
- [ ] Boolean properties → checkbox
- [ ] Enum/options properties → dropdown
- [ ] Can add new properties to components
- [ ] Can remove existing properties
- [ ] Can edit base Tailwind classes
- [ ] Validation shows errors for invalid input
- [ ] Changes update manifestStore in real-time
- [ ] Changes auto-save to disk (via Task 2.2)
- [ ] NO expression editor (Level 1 restriction)
- [ ] TypeScript strict mode passing
- [ ] Manual testing completed
- [ ] Human review approved

### References
- **Task 2.1** - PropertiesPanel read-only implementation
- **Task 2.2** - Manifest persistence
- **docs/SCHEMA_LEVELS.md** - Level 1 restrictions
- **docs/COMPONENT_SCHEMA.md** - Property structure
- **CLINE_IMPLEMENTATION_PLAN.md** - Task 2.3 requirements

### Dependencies
- ✅ Task 2.1: Component Tree UI (PropertiesPanel exists)
- ✅ Task 2.2: Manifest Persistence (auto-save working)
- ⚠️ **BLOCKS:** Task 2.4 (AI Generation benefits from property editing)
- ⚠️ **BLOCKS:** Phase 3 (Code generation needs editable components)

### Out of Scope (Level 1 Restrictions)
- ❌ Expression editor → Level 2
- ❌ Expression toggle on properties → Level 2
- ❌ State binding → Level 2
- ❌ Event handlers → Level 2
- ❌ Computed properties → Level 2
- ❌ Conditional styling editor → Level 2

---

## 🏗️ Architecture Overview

### Data Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                      Property Edit Flow                          │
│                                                                  │
│  User types in input                                            │
│         │                                                        │
│         ▼                                                        │
│  ┌─────────────────┐                                            │
│  │ PropertyInput   │                                            │
│  │ onChange        │                                            │
│  └────────┬────────┘                                            │
│           │                                                      │
│           ▼                                                      │
│  ┌─────────────────┐     ┌─────────────────┐                   │
│  │ Validation      │────▶│ Show error if   │                   │
│  │ (type check)    │     │ invalid         │                   │
│  └────────┬────────┘     └─────────────────┘                   │
│           │                                                      │
│           │ if valid                                            │
│           ▼                                                      │
│  ┌─────────────────┐                                            │
│  │ manifestStore   │                                            │
│  │ updateComponent │                                            │
│  └────────┬────────┘                                            │
│           │                                                      │
│           │ triggers (from Task 2.2)                            │
│           ▼                                                      │
│  ┌─────────────────┐     ┌─────────────────┐                   │
│  │ Debounced save  │────▶│ manifest:save   │                   │
│  │ (500ms)         │     │ IPC handler     │                   │
│  └─────────────────┘     └─────────────────┘                   │
└─────────────────────────────────────────────────────────────────┘
```

### Component Hierarchy

```
PropertiesPanel (existing - to be modified)
├── PropertyPanelHeader (existing)
│   └── Component icon + name
├── ComponentInfoEditor (NEW)
│   ├── DisplayNameInput
│   └── CategorySelect
├── PropertiesEditor (NEW)
│   ├── PropertyRow (per property)
│   │   ├── PropertyLabel
│   │   ├── PropertyInput (type-specific)
│   │   │   ├── TextPropertyInput
│   │   │   ├── NumberPropertyInput
│   │   │   ├── BooleanPropertyInput
│   │   │   └── SelectPropertyInput
│   │   └── RemovePropertyButton
│   └── AddPropertyButton → AddPropertyDialog
├── StylingEditor (NEW)
│   └── ClassListEditor (tag-style input)
└── MetadataDisplay (existing - keep read-only)
```

### Property Input Type Mapping

| Property dataType | Input Component | Notes |
|-------------------|-----------------|-------|
| `string` | `<input type="text">` | Standard text input |
| `number` | `<input type="number">` | With step controls |
| `boolean` | `<input type="checkbox">` | Toggle switch style |
| `object` | JSON editor (simplified) | Or "Edit as JSON" button |
| `array` | JSON editor (simplified) | Or list editor |
| enum (has `options`) | `<select>` | Dropdown from options |

---

## 🗺️ Implementation Roadmap

### Task 2.3A: Basic Property Inputs
**Duration:** 1 day  
**Confidence Target:** 9/10  
**Status:** 🔵 Not Started

#### Objective
Create the core property input components that render appropriate editors based on property type.

#### Files to Create

**`src/renderer/components/PropertyEditor/PropertyInput.tsx`** (~200 lines)
```typescript
/**
 * @file PropertyInput.tsx
 * @description Smart property input that renders appropriate control based on type
 * 
 * @architecture Phase 2, Task 2.3A - Property Panel Editor
 * 
 * PROBLEM SOLVED:
 * Different property types need different input controls:
 * - string → text input
 * - number → number input
 * - boolean → checkbox
 * - options → dropdown
 * 
 * SOLUTION:
 * Single component that switches on dataType and renders appropriate input.
 * Handles validation and change propagation.
 */

import React from 'react';
import type { ComponentProperty } from '../../../core/manifest/types';

interface PropertyInputProps {
  name: string;
  property: ComponentProperty;
  value: any;
  onChange: (name: string, value: any) => void;
  onRemove?: (name: string) => void;
  disabled?: boolean;
}

export function PropertyInput({ 
  name, 
  property, 
  value, 
  onChange, 
  onRemove,
  disabled 
}: PropertyInputProps) {
  const dataType = property.dataType || 'string';
  
  // Render based on dataType
  switch (dataType) {
    case 'boolean':
      return (
        <BooleanInput 
          name={name}
          value={value}
          onChange={onChange}
          disabled={disabled}
        />
      );
    
    case 'number':
      return (
        <NumberInput
          name={name}
          value={value}
          onChange={onChange}
          disabled={disabled}
        />
      );
    
    case 'string':
    default:
      // Check if property has options (enum)
      if (property.options && property.options.length > 0) {
        return (
          <SelectInput
            name={name}
            value={value}
            options={property.options}
            onChange={onChange}
            disabled={disabled}
          />
        );
      }
      
      return (
        <TextInput
          name={name}
          value={value}
          onChange={onChange}
          disabled={disabled}
        />
      );
  }
}

// Individual input components...
function TextInput({ name, value, onChange, disabled }) {
  return (
    <input
      type="text"
      value={value ?? ''}
      onChange={(e) => onChange(name, e.target.value)}
      disabled={disabled}
      className="w-full px-3 py-2 text-sm border border-gray-300 rounded 
                 focus:outline-none focus:ring-2 focus:ring-blue-500
                 disabled:bg-gray-100 disabled:cursor-not-allowed"
    />
  );
}

function NumberInput({ name, value, onChange, disabled }) {
  return (
    <input
      type="number"
      value={value ?? ''}
      onChange={(e) => onChange(name, e.target.value === '' ? null : Number(e.target.value))}
      disabled={disabled}
      className="w-full px-3 py-2 text-sm border border-gray-300 rounded 
                 focus:outline-none focus:ring-2 focus:ring-blue-500
                 disabled:bg-gray-100 disabled:cursor-not-allowed"
    />
  );
}

function BooleanInput({ name, value, onChange, disabled }) {
  return (
    <label className="flex items-center gap-2 cursor-pointer">
      <input
        type="checkbox"
        checked={value ?? false}
        onChange={(e) => onChange(name, e.target.checked)}
        disabled={disabled}
        className="w-4 h-4 text-blue-500 rounded border-gray-300 
                   focus:ring-blue-500 disabled:cursor-not-allowed"
      />
      <span className="text-sm text-gray-700">
        {value ? 'True' : 'False'}
      </span>
    </label>
  );
}

function SelectInput({ name, value, options, onChange, disabled }) {
  return (
    <select
      value={value ?? ''}
      onChange={(e) => onChange(name, e.target.value)}
      disabled={disabled}
      className="w-full px-3 py-2 text-sm border border-gray-300 rounded 
                 focus:outline-none focus:ring-2 focus:ring-blue-500
                 disabled:bg-gray-100 disabled:cursor-not-allowed"
    >
      <option value="">Select...</option>
      {options.map((opt: string) => (
        <option key={opt} value={opt}>{opt}</option>
      ))}
    </select>
  );
}
```

**`src/renderer/components/PropertyEditor/PropertyRow.tsx`** (~120 lines)
```typescript
/**
 * @file PropertyRow.tsx
 * @description Single property row with label, input, and actions
 * 
 * LAYOUT:
 * ┌─────────────────────────────────────────────────────┐
 * │ propertyName                              [type] [x]│
 * │ ┌─────────────────────────────────────────────────┐ │
 * │ │ [input control based on type]                   │ │
 * │ └─────────────────────────────────────────────────┘ │
 * └─────────────────────────────────────────────────────┘
 */

import React from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { PropertyInput } from './PropertyInput';
import type { ComponentProperty } from '../../../core/manifest/types';

interface PropertyRowProps {
  name: string;
  property: ComponentProperty;
  onChange: (name: string, value: any) => void;
  onRemove: (name: string) => void;
}

export function PropertyRow({ name, property, onChange, onRemove }: PropertyRowProps) {
  const value = property.type === 'static' ? property.value : property.default;
  
  return (
    <div className="p-3 bg-white border border-gray-200 rounded-lg">
      {/* Header row */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-gray-700">{name}</span>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
            {property.dataType || 'string'}
          </span>
          <button
            onClick={() => onRemove(name)}
            className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded"
            title="Remove property"
          >
            <XMarkIcon className="w-4 h-4" />
          </button>
        </div>
      </div>
      
      {/* Input */}
      <PropertyInput
        name={name}
        property={property}
        value={value}
        onChange={onChange}
      />
      
      {/* Required indicator */}
      {property.required && (
        <span className="text-xs text-red-500 mt-1">Required</span>
      )}
    </div>
  );
}
```

**`src/renderer/components/PropertyEditor/PropertiesEditor.tsx`** (~150 lines)
```typescript
/**
 * @file PropertiesEditor.tsx
 * @description Main properties editor section with all property rows
 * 
 * LAYOUT:
 * ┌─────────────────────────────────────────────────────┐
 * │ Properties                            [+ Add Property]│
 * ├─────────────────────────────────────────────────────┤
 * │ ┌─────────────────────────────────────────────────┐ │
 * │ │ PropertyRow (label)                             │ │
 * │ └─────────────────────────────────────────────────┘ │
 * │ ┌─────────────────────────────────────────────────┐ │
 * │ │ PropertyRow (disabled)                          │ │
 * │ └─────────────────────────────────────────────────┘ │
 * │ ...more properties...                               │
 * └─────────────────────────────────────────────────────┘
 */

import React, { useCallback, useState } from 'react';
import { PlusIcon, BoltIcon } from '@heroicons/react/24/outline';
import { PropertyRow } from './PropertyRow';
import { AddPropertyDialog } from './AddPropertyDialog';
import { useManifestStore } from '../../store/manifestStore';
import type { Component, ComponentProperty } from '../../../core/manifest/types';

interface PropertiesEditorProps {
  component: Component;
}

export function PropertiesEditor({ component }: PropertiesEditorProps) {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const updateComponent = useManifestStore((s) => s.updateComponent);
  
  const handlePropertyChange = useCallback((name: string, value: any) => {
    // Update the property value in the manifest
    const updatedProperties = {
      ...component.properties,
      [name]: {
        ...component.properties[name],
        value: value, // For static properties
      },
    };
    
    updateComponent(component.id, { properties: updatedProperties });
  }, [component, updateComponent]);
  
  const handlePropertyRemove = useCallback((name: string) => {
    const { [name]: removed, ...remainingProperties } = component.properties;
    updateComponent(component.id, { properties: remainingProperties });
  }, [component, updateComponent]);
  
  const handleAddProperty = useCallback((propertyData: {
    name: string;
    dataType: string;
    value: any;
    required: boolean;
  }) => {
    const newProperty: ComponentProperty = {
      type: 'static',
      dataType: propertyData.dataType,
      value: propertyData.value,
      required: propertyData.required,
    };
    
    updateComponent(component.id, {
      properties: {
        ...component.properties,
        [propertyData.name]: newProperty,
      },
    });
    
    setShowAddDialog(false);
  }, [component, updateComponent]);
  
  const propertyEntries = Object.entries(component.properties);
  
  return (
    <section>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <BoltIcon className="w-4 h-4 text-gray-500" />
          <h3 className="text-xs font-medium text-gray-700 uppercase tracking-wider">
            Properties
          </h3>
        </div>
        <button
          onClick={() => setShowAddDialog(true)}
          className="flex items-center gap-1 px-2 py-1 text-xs text-blue-600 
                     hover:bg-blue-50 rounded transition-colors"
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
            />
          ))}
        </div>
      ) : (
        <p className="text-xs text-gray-500 italic py-4 text-center">
          No properties defined. Click "Add" to create one.
        </p>
      )}
      
      {/* Add Property Dialog */}
      <AddPropertyDialog
        isOpen={showAddDialog}
        onClose={() => setShowAddDialog(false)}
        onAdd={handleAddProperty}
        existingPropertyNames={Object.keys(component.properties)}
      />
    </section>
  );
}
```

**`src/renderer/components/PropertyEditor/index.ts`** (~10 lines)
```typescript
export { PropertyInput } from './PropertyInput';
export { PropertyRow } from './PropertyRow';
export { PropertiesEditor } from './PropertiesEditor';
export { AddPropertyDialog } from './AddPropertyDialog';
export { ComponentInfoEditor } from './ComponentInfoEditor';
export { StylingEditor } from './StylingEditor';
```

#### Validation Criteria (2.3A)
- [ ] TextInput renders for string properties
- [ ] NumberInput renders for number properties
- [ ] BooleanInput renders for boolean properties
- [ ] SelectInput renders for properties with options
- [ ] onChange propagates to parent
- [ ] PropertyRow shows label, type badge, remove button
- [ ] PropertiesEditor lists all properties
- [ ] Changes update manifestStore

---

### Task 2.3B: Component Info & Styling Editors
**Duration:** 0.5-1 day  
**Confidence Target:** 9/10  
**Status:** 🔵 Not Started

#### Objective
Create editors for component name/category and Tailwind styling classes.

#### Files to Create

**`src/renderer/components/PropertyEditor/ComponentInfoEditor.tsx`** (~120 lines)
```typescript
/**
 * @file ComponentInfoEditor.tsx
 * @description Editor for component displayName and category
 * 
 * LAYOUT:
 * ┌─────────────────────────────────────────────────────┐
 * │ Component Info                                      │
 * ├─────────────────────────────────────────────────────┤
 * │ Name:  [___________________]                        │
 * │ Type:  button (read-only)                           │
 * │ Category: [Basic ▼]                                 │
 * │ ID:    comp_button_001 (read-only)                  │
 * └─────────────────────────────────────────────────────┘
 */

import React, { useCallback, useState } from 'react';
import { InformationCircleIcon } from '@heroicons/react/24/outline';
import { useManifestStore } from '../../store/manifestStore';
import { ComponentIcon } from '../ComponentTree/ComponentIcon';
import type { Component } from '../../../core/manifest/types';

const CATEGORIES = [
  { value: 'basic', label: 'Basic' },
  { value: 'layout', label: 'Layout' },
  { value: 'form', label: 'Form' },
  { value: 'custom', label: 'Custom' },
];

interface ComponentInfoEditorProps {
  component: Component;
}

export function ComponentInfoEditor({ component }: ComponentInfoEditorProps) {
  const updateComponent = useManifestStore((s) => s.updateComponent);
  const [nameValue, setNameValue] = useState(component.displayName);
  
  const handleNameChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setNameValue(e.target.value);
  }, []);
  
  const handleNameBlur = useCallback(() => {
    if (nameValue.trim() && nameValue !== component.displayName) {
      updateComponent(component.id, { displayName: nameValue.trim() });
    }
  }, [nameValue, component, updateComponent]);
  
  const handleCategoryChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    updateComponent(component.id, { category: e.target.value });
  }, [component, updateComponent]);
  
  return (
    <section>
      <div className="flex items-center gap-2 mb-3">
        <InformationCircleIcon className="w-4 h-4 text-gray-500" />
        <h3 className="text-xs font-medium text-gray-700 uppercase tracking-wider">
          Component Info
        </h3>
      </div>
      
      <div className="space-y-3">
        {/* Icon + Type display */}
        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
          <ComponentIcon type={component.type} size="lg" />
          <div>
            <div className="text-sm font-medium text-gray-900">{component.type}</div>
            <div className="text-xs text-gray-500 font-mono">{component.id}</div>
          </div>
        </div>
        
        {/* Display Name */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Display Name
          </label>
          <input
            type="text"
            value={nameValue}
            onChange={handleNameChange}
            onBlur={handleNameBlur}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded 
                       focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        
        {/* Category */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Category
          </label>
          <select
            value={component.category || 'basic'}
            onChange={handleCategoryChange}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded 
                       focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {CATEGORIES.map((cat) => (
              <option key={cat.value} value={cat.value}>{cat.label}</option>
            ))}
          </select>
        </div>
      </div>
    </section>
  );
}
```

**`src/renderer/components/PropertyEditor/StylingEditor.tsx`** (~180 lines)
```typescript
/**
 * @file StylingEditor.tsx
 * @description Editor for component Tailwind classes
 * 
 * LAYOUT:
 * ┌─────────────────────────────────────────────────────┐
 * │ Styling                                             │
 * ├─────────────────────────────────────────────────────┤
 * │ Base Classes:                                       │
 * │ ┌─────────────────────────────────────────────────┐ │
 * │ │ [bg-blue-500] [text-white] [px-4] [py-2] [+]    │ │
 * │ └─────────────────────────────────────────────────┘ │
 * │                                                     │
 * │ Custom CSS: (read-only preview in Level 1)         │
 * └─────────────────────────────────────────────────────┘
 */

import React, { useCallback, useState } from 'react';
import { PaintBrushIcon, XMarkIcon, PlusIcon } from '@heroicons/react/24/outline';
import { useManifestStore } from '../../store/manifestStore';
import type { Component } from '../../../core/manifest/types';

interface StylingEditorProps {
  component: Component;
}

export function StylingEditor({ component }: StylingEditorProps) {
  const updateComponent = useManifestStore((s) => s.updateComponent);
  const [newClass, setNewClass] = useState('');
  
  const baseClasses = component.styling?.baseClasses || [];
  
  const handleAddClass = useCallback(() => {
    if (!newClass.trim()) return;
    
    const updatedClasses = [...baseClasses, newClass.trim()];
    updateComponent(component.id, {
      styling: {
        ...component.styling,
        baseClasses: updatedClasses,
      },
    });
    setNewClass('');
  }, [newClass, baseClasses, component, updateComponent]);
  
  const handleRemoveClass = useCallback((classToRemove: string) => {
    const updatedClasses = baseClasses.filter(c => c !== classToRemove);
    updateComponent(component.id, {
      styling: {
        ...component.styling,
        baseClasses: updatedClasses,
      },
    });
  }, [baseClasses, component, updateComponent]);
  
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddClass();
    }
  }, [handleAddClass]);
  
  return (
    <section>
      <div className="flex items-center gap-2 mb-3">
        <PaintBrushIcon className="w-4 h-4 text-gray-500" />
        <h3 className="text-xs font-medium text-gray-700 uppercase tracking-wider">
          Styling
        </h3>
      </div>
      
      <div className="space-y-3">
        {/* Base Classes */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-2">
            Tailwind Classes
          </label>
          
          {/* Class tags */}
          <div className="flex flex-wrap gap-1 mb-2">
            {baseClasses.map((className, index) => (
              <span
                key={`${className}-${index}`}
                className="inline-flex items-center gap-1 px-2 py-1 text-xs 
                           font-mono bg-blue-50 text-blue-700 border border-blue-200 rounded"
              >
                {className}
                <button
                  onClick={() => handleRemoveClass(className)}
                  className="hover:text-red-500"
                >
                  <XMarkIcon className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
          
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
                         hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <PlusIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
        
        {/* Custom CSS preview (read-only in Level 1) */}
        {component.styling?.customCSS && (
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-2">
              Custom CSS
              <span className="ml-2 text-gray-400 font-normal">(read-only)</span>
            </label>
            <pre className="px-3 py-2 text-xs font-mono bg-gray-50 border border-gray-200 
                           rounded overflow-x-auto text-gray-600">
              {component.styling.customCSS}
            </pre>
          </div>
        )}
        
        {baseClasses.length === 0 && !component.styling?.customCSS && (
          <p className="text-xs text-gray-500 italic text-center py-2">
            No styling defined. Add Tailwind classes above.
          </p>
        )}
      </div>
    </section>
  );
}
```

#### Validation Criteria (2.3B)
- [ ] DisplayName input updates on blur
- [ ] Category dropdown changes update immediately
- [ ] Component icon and type displayed correctly
- [ ] Component ID displayed (read-only)
- [ ] Tailwind classes shown as tags
- [ ] Can add new Tailwind classes
- [ ] Can remove existing classes
- [ ] Enter key adds class
- [ ] Custom CSS shown read-only (if exists)

---

### Task 2.3C: Add Property Dialog
**Duration:** 0.5-1 day  
**Confidence Target:** 8/10  
**Status:** 🔵 Not Started

#### Objective
Create dialog for adding new properties with name, type, and default value.

#### Files to Create

**`src/renderer/components/PropertyEditor/AddPropertyDialog.tsx`** (~200 lines)
```typescript
/**
 * @file AddPropertyDialog.tsx
 * @description Dialog for adding new properties to a component
 * 
 * FORM FIELDS:
 * - Property Name (text, required, unique)
 * - Data Type (dropdown: string, number, boolean)
 * - Default Value (type-appropriate input)
 * - Required (checkbox)
 * 
 * LEVEL 1 RESTRICTION:
 * - Only 'static' type properties
 * - No expression option
 */

import React, { useState, useCallback } from 'react';
import { Modal } from '../Modal';

interface AddPropertyDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (data: {
    name: string;
    dataType: string;
    value: any;
    required: boolean;
  }) => void;
  existingPropertyNames: string[];
}

const DATA_TYPES = [
  { value: 'string', label: 'String (text)' },
  { value: 'number', label: 'Number' },
  { value: 'boolean', label: 'Boolean (true/false)' },
];

export function AddPropertyDialog({
  isOpen,
  onClose,
  onAdd,
  existingPropertyNames,
}: AddPropertyDialogProps) {
  const [name, setName] = useState('');
  const [dataType, setDataType] = useState('string');
  const [stringValue, setStringValue] = useState('');
  const [numberValue, setNumberValue] = useState(0);
  const [booleanValue, setBooleanValue] = useState(false);
  const [required, setRequired] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const resetForm = useCallback(() => {
    setName('');
    setDataType('string');
    setStringValue('');
    setNumberValue(0);
    setBooleanValue(false);
    setRequired(false);
    setError(null);
  }, []);
  
  const handleClose = useCallback(() => {
    resetForm();
    onClose();
  }, [resetForm, onClose]);
  
  const validate = useCallback((): boolean => {
    if (!name.trim()) {
      setError('Property name is required');
      return false;
    }
    
    if (!/^[a-zA-Z][a-zA-Z0-9]*$/.test(name)) {
      setError('Property name must start with a letter and contain only letters/numbers');
      return false;
    }
    
    if (existingPropertyNames.includes(name)) {
      setError('A property with this name already exists');
      return false;
    }
    
    setError(null);
    return true;
  }, [name, existingPropertyNames]);
  
  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validate()) return;
    
    let value: any;
    switch (dataType) {
      case 'number':
        value = numberValue;
        break;
      case 'boolean':
        value = booleanValue;
        break;
      default:
        value = stringValue;
    }
    
    onAdd({
      name: name.trim(),
      dataType,
      value,
      required,
    });
    
    resetForm();
  }, [name, dataType, stringValue, numberValue, booleanValue, required, validate, onAdd, resetForm]);
  
  return (
    <Modal isOpen={isOpen} onClose={handleClose}>
      <form onSubmit={handleSubmit} className="p-6 w-96">
        <h2 className="text-lg font-semibold mb-4">Add Property</h2>
        
        {/* Error message */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-600">
            {error}
          </div>
        )}
        
        {/* Property Name */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Property Name *
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., label, disabled, variant"
            className="w-full px-3 py-2 border border-gray-300 rounded 
                       focus:outline-none focus:ring-2 focus:ring-blue-500"
            autoFocus
          />
        </div>
        
        {/* Data Type */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Data Type
          </label>
          <select
            value={dataType}
            onChange={(e) => setDataType(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded 
                       focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {DATA_TYPES.map((type) => (
              <option key={type.value} value={type.value}>{type.label}</option>
            ))}
          </select>
        </div>
        
        {/* Default Value - type-specific */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Default Value
          </label>
          {dataType === 'string' && (
            <input
              type="text"
              value={stringValue}
              onChange={(e) => setStringValue(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded 
                         focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          )}
          {dataType === 'number' && (
            <input
              type="number"
              value={numberValue}
              onChange={(e) => setNumberValue(Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded 
                         focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          )}
          {dataType === 'boolean' && (
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={booleanValue}
                onChange={(e) => setBooleanValue(e.target.checked)}
                className="w-4 h-4 text-blue-500 rounded"
              />
              <span className="text-sm">{booleanValue ? 'True' : 'False'}</span>
            </label>
          )}
        </div>
        
        {/* Required checkbox */}
        <div className="mb-6">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={required}
              onChange={(e) => setRequired(e.target.checked)}
              className="w-4 h-4 text-blue-500 rounded"
            />
            <span className="text-sm">Required property</span>
          </label>
        </div>
        
        {/* Level 1 notice */}
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded text-xs text-blue-700">
          <strong>Level 1 MVP:</strong> Only static values supported. 
          Expression bindings coming in Level 2.
        </div>
        
        {/* Actions */}
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={handleClose}
            className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Add Property
          </button>
        </div>
      </form>
    </Modal>
  );
}
```

#### Validation Criteria (2.3C)
- [ ] Dialog opens from "Add" button
- [ ] Property name required
- [ ] Property name must be valid identifier
- [ ] Property name must be unique
- [ ] Data type selection works
- [ ] Default value input matches selected type
- [ ] Required checkbox works
- [ ] Cancel closes without saving
- [ ] Submit adds property to component
- [ ] Form resets after submit
- [ ] Level 1 notice displayed

---

### Task 2.3D: Integration & Polish
**Duration:** 0.5 day  
**Confidence Target:** 9/10  
**Status:** 🔵 Not Started

#### Objective
Integrate all editors into PropertiesPanel and polish the UX.

#### Files to Modify

**`src/renderer/components/PropertiesPanel.tsx`** (major refactor)
```typescript
/**
 * REFACTORED PropertiesPanel
 * 
 * Replace the read-only sections with editable components:
 * - ComponentInfoEditor (replaces read-only info)
 * - PropertiesEditor (replaces read-only properties)
 * - StylingEditor (replaces read-only styling)
 * - Keep MetadataDisplay as read-only
 * - Keep Children count as read-only
 */

// Import new editors
import { 
  ComponentInfoEditor, 
  PropertiesEditor, 
  StylingEditor 
} from './PropertyEditor';

// In the render, when selectedComponent exists:
{selectedComponent && (
  <div className="p-4 space-y-6">
    {/* Editable Component Info */}
    <ComponentInfoEditor component={selectedComponent} />
    
    {/* Editable Properties */}
    <PropertiesEditor component={selectedComponent} />
    
    {/* Editable Styling */}
    <StylingEditor component={selectedComponent} />
    
    {/* Read-only Metadata */}
    <MetadataDisplay component={selectedComponent} />
    
    {/* Read-only Children count */}
    <ChildrenDisplay component={selectedComponent} />
  </div>
)}
```

#### Validation Criteria (2.3D)
- [ ] All editors integrated into PropertiesPanel
- [ ] Smooth UX when switching selected components
- [ ] No flickering or layout jumps
- [ ] Changes persist (verify in manifest.json file)
- [ ] Undo via Cmd+Z would be nice (optional)
- [ ] Keyboard navigation works (Tab between fields)
- [ ] Focus management correct

---

## 📁 Deliverables Summary

### New Files (7)

1. `src/renderer/components/PropertyEditor/PropertyInput.tsx` (~200 lines)
2. `src/renderer/components/PropertyEditor/PropertyRow.tsx` (~120 lines)
3. `src/renderer/components/PropertyEditor/PropertiesEditor.tsx` (~150 lines)
4. `src/renderer/components/PropertyEditor/ComponentInfoEditor.tsx` (~120 lines)
5. `src/renderer/components/PropertyEditor/StylingEditor.tsx` (~180 lines)
6. `src/renderer/components/PropertyEditor/AddPropertyDialog.tsx` (~200 lines)
7. `src/renderer/components/PropertyEditor/index.ts` (~10 lines)

### Modified Files (1)

1. `src/renderer/components/PropertiesPanel.tsx` (major refactor)

### Estimated Total
- **New Code:** ~980 lines
- **Modified Code:** ~200 lines (refactor)
- **Grand Total:** ~1,180 lines

---

## ⚡ Performance Requirements

| Metric | Target | Measurement |
|--------|--------|-------------|
| Input responsiveness | < 16ms | From keystroke to display |
| Property change → store | < 50ms | From input to manifestStore update |
| Store → disk save | 500ms (debounced) | Via Task 2.2 |
| Component switch | < 100ms | From click to editor populated |

---

## 🔒 Level 1 Restrictions

### What's Allowed ✅
- Static property values (strings, numbers, booleans)
- Tailwind class editing
- Component name/category changes
- Add/remove properties

### What's NOT Allowed ❌
- Expression editor or toggle
- State bindings
- Event handlers
- Computed properties
- Conditional class expressions (Level 2)

### User Messaging
When users might expect Level 2 features, show:
```
"Expression bindings available in Level 2 (post-MVP)"
```

---

## 🚨 Risk Assessment

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| Complex property types (object/array) | MEDIUM | MEDIUM | Defer to JSON editor or Level 2 |
| Input validation edge cases | LOW | MEDIUM | Comprehensive validation |
| Performance with many properties | LOW | LOW | Virtual list if needed |
| State sync issues | MEDIUM | LOW | Single source of truth in store |

---

## 👨‍💻 Human Checkpoints

### Checkpoint 1: After Task 2.3B
**Review Focus:**
- [ ] Input UX feels good
- [ ] Styling editor intuitive
- [ ] Changes save correctly

### Checkpoint 2: After Task 2.3D (Complete)
**Review Focus:**
- [ ] Full editing workflow works
- [ ] No data loss
- [ ] Ready for Task 2.4

---

## ✅ Definition of Done

Task 2.3 is complete when:

1. [ ] All subtasks (2.3A-D) completed
2. [ ] Can edit component displayName
3. [ ] Can edit all property types (string, number, boolean, enum)
4. [ ] Can add new properties
5. [ ] Can remove existing properties
6. [ ] Can edit Tailwind classes
7. [ ] Changes auto-save to disk
8. [ ] NO expression editor present (Level 1)
9. [ ] Input validation working
10. [ ] TypeScript strict mode passing
11. [ ] Manual testing completed
12. [ ] Human review approved
13. [ ] **GATE:** Ready for Task 2.4 (AI Component Generation)

---

## 📝 Cline Prompt for Task 2.3A

```
Implement basic property input components for Rise's Property Panel Editor.

## Context
- Rise is a visual React application builder
- Task 2.1 built a read-only PropertiesPanel
- Task 2.2 added manifest persistence (auto-save working)
- Task 2.3 converts the panel to editable
- This is Task 2.3A - creating the core property input components

## Requirements

### Create src/renderer/components/PropertyEditor/PropertyInput.tsx

Smart component that renders appropriate input based on property.dataType:
- string → text input
- number → number input  
- boolean → checkbox/toggle
- string with options → dropdown/select

Props:
- name: string
- property: ComponentProperty
- value: any
- onChange: (name: string, value: any) => void
- disabled?: boolean

### Create src/renderer/components/PropertyEditor/PropertyRow.tsx

Single property row with:
- Property name label
- Type badge (string, number, etc.)
- Remove button (X icon)
- PropertyInput component
- Required indicator if property.required

### Create src/renderer/components/PropertyEditor/PropertiesEditor.tsx

Main properties section with:
- Header "Properties" with Add button
- List of PropertyRow for each property
- Empty state if no properties
- Opens AddPropertyDialog (placeholder for now)

Calls manifestStore.updateComponent() when values change.

### Create src/renderer/components/PropertyEditor/index.ts

Barrel exports for all components.

## References
- @src/renderer/components/PropertiesPanel.tsx - Current read-only implementation
- @src/renderer/store/manifestStore.ts - updateComponent action
- @src/core/manifest/types.ts - ComponentProperty type

## Level 1 Restrictions
- ONLY static values
- NO expression toggle
- NO state bindings

## Success Criteria
- [ ] Text input works for string properties
- [ ] Number input works for number properties
- [ ] Checkbox works for boolean properties
- [ ] Dropdown works for properties with options
- [ ] Changes call updateComponent()
- [ ] Remove button removes property
- [ ] TypeScript strict mode passes

State your approach and confidence level (1-10) before implementing.
```

---

**Task Status:** 🔵 Not Started  
**Critical Path:** YES - Blocks Task 2.4 and Phase 3  
**Risk Level:** LOW - Clear scope, existing patterns  
**Next Task:** Task 2.4 - AI Component Generation

---

**Last Updated:** 2025-11-26  
**Document Version:** 1.0  
**Prepared By:** Claude (Planning Assistant)  
**Requires Sign-off:** Project Lead (Richard)
