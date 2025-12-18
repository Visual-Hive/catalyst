# Task 3.5bis: Property Panel UX Enhancements

**Phase:** Phase 3 - Code Generation & Preview (Extended)  
**Duration Estimate:** 2-3 days  
**Status:** ✅ Complete  
**Assigned:** AI + Human Review  
**Risk Level:** LOW  
**User Impact:** HIGH - Critical usability improvement  

---

## Executive Summary

The property panel templates system (Task 3.5) created the data infrastructure - component templates with default properties, style definitions (`STYLE_PROPERTY_CATEGORIES`), and Tailwind suggestions (`TAILWIND_CLASS_SUGGESTIONS`). However, the UI doesn't surface this data effectively, leaving users with:

1. **Empty free-text inputs** when adding properties (no suggestions from templates)
2. **Hidden inline styles** - width, height, display, etc. are applied but invisible in the UI
3. **No autocomplete** for Tailwind classes or CSS properties
4. **No property descriptions** or enum dropdowns from templates

This task fixes these gaps by enhancing the property panel UI components.

---

## Problem Analysis

### Current State

#### AddPropertyDialog.tsx
- Shows a free-text input for property name
- User must know valid property names
- No suggestions from component templates
- No descriptions shown

#### StylingEditor.tsx
- Only shows `baseClasses` (Tailwind) as tags
- **Does NOT show `inlineStyles`** - This is why width/height are invisible!
- Free-text input to add classes
- No autocomplete suggestions

#### What Data Exists (but is unused)

In `componentTemplates.ts`:
```typescript
// Template properties with descriptions, defaults, options
textTemplate.properties = [
  { name: 'content', description: 'The text content to display', ... },
  { name: 'as', options: ['p', 'h1', 'h2', ...], ... }
]

// Inline styles applied to new components (HIDDEN IN UI!)
containerTemplate.defaultStyles = {
  width: 'auto',
  minHeight: '50px',
  display: 'flex',
  flexDirection: 'column',
  padding: '16px',
  gap: '8px',
}

// Style property definitions with presets (UNUSED!)
STYLE_PROPERTY_CATEGORIES.layout.properties = [
  { name: 'width', presets: ['auto', '100%', '50%', ...] },
  { name: 'height', presets: ['auto', '100%', 'fit-content', ...] },
  ...
]

// Tailwind suggestions (UNUSED!)
TAILWIND_CLASS_SUGGESTIONS.flexDirection = ['flex-row', 'flex-col', ...]
```

---

## Success Criteria

- [x] Users can see and edit inline styles (width, height, padding, etc.)
- [x] Style property editor has category organization
- [x] Style property inputs have preset dropdowns
- [x] Add Property shows suggestions from template
- [x] Add Class input has autocomplete dropdown
- [x] Enum properties render as dropdowns with labels
- [x] Property descriptions shown as helper text
- [ ] Test coverage maintained (existing tests still pass)

---

## Milestone 1: Inline Styles Editor (Priority)

**Duration:** 1 day  
**Why First:** This is why users can't see width/height - the highest priority fix

### Objective
Create an `InlineStylesEditor` component that displays and edits `styling.inlineStyles`.

### Current Problem
```typescript
// In manifest, component has:
component.styling = {
  baseClasses: ['cursor-pointer', 'hover:bg-blue-600'], // ✅ Shown in UI
  inlineStyles: {                                        // ❌ COMPLETELY HIDDEN!
    width: 'auto',
    minHeight: '50px',
    display: 'flex',
    padding: '16px',
  }
}
```

### Solution

Create new component: `src/renderer/components/PropertyEditor/InlineStylesEditor.tsx`

```
┌─────────────────────────────────────────────────────┐
│ Inline Styles                                       │
├─────────────────────────────────────────────────────┤
│ ▼ Layout                                            │
│   ┌─────────────┬─────────────────────────────────┐ │
│   │ width       │ [auto           ▼]              │ │
│   │ minHeight   │ [50px                       ]   │ │
│   │ display     │ [flex           ▼]              │ │
│   └─────────────┴─────────────────────────────────┘ │
│                                                     │
│ ▼ Flexbox                                           │
│   ┌─────────────┬─────────────────────────────────┐ │
│   │ flexDir     │ [column         ▼]              │ │
│   │ gap         │ [8px            ▼]              │ │
│   └─────────────┴─────────────────────────────────┘ │
│                                                     │
│ [+ Add Style Property ▼]                            │
└─────────────────────────────────────────────────────┘
```

### Implementation Details

1. **Group by category** using `STYLE_PROPERTY_CATEGORIES`
2. **Preset dropdowns**: If property has `presets`, show dropdown with common values
3. **Enum dropdowns**: If property has `options`, show dropdown select
4. **Free text fallback**: Allow typing custom values
5. **Add new property**: Dropdown showing unset properties from all categories
6. **Remove property**: X button to remove a style

### Files to Modify/Create

| File | Change |
|------|--------|
| `PropertyEditor/InlineStylesEditor.tsx` | **CREATE** - New component |
| `PropertyEditor/StylingEditor.tsx` | Import and render InlineStylesEditor |
| `PropertyEditor/index.ts` | Export new component |

### Data Flow

```
InlineStylesEditor
  ├── Props: component (with styling.inlineStyles)
  ├── Import: STYLE_PROPERTY_CATEGORIES from componentTemplates.ts
  ├── State: Tracks which categories are expanded
  └── Actions: 
      ├── updateComponent({ styling: { ...styling, inlineStyles: updated } })
      ├── Add property → merge new property into inlineStyles
      └── Remove property → delete from inlineStyles
```

---

## Milestone 2: Property Suggestions in AddPropertyDialog

**Duration:** 0.5 day

### Objective
When user clicks "+ Add Property", show suggested properties from the component's template.

### Current Problem
- AddPropertyDialog doesn't know what component type it's for
- Shows generic string/number/boolean options
- User must know property names

### Solution

Add `componentType` prop to AddPropertyDialog and show suggestions:

```
┌─────────────────────────────────────────────────────┐
│ Add Property                                        │
├─────────────────────────────────────────────────────┤
│ Suggested Properties (Button):                      │
│ ┌─────────────────────────────────────────────────┐ │
│ │ ☐ label      Text displayed on the button       │ │
│ │ ☐ variant    Visual style (primary, secondary)  │ │
│ │ ☐ disabled   Whether the button is disabled     │ │
│ │ ☐ type       Button type (button, submit)       │ │
│ └─────────────────────────────────────────────────┘ │
│                                                     │
│ ─── OR add custom property ───                      │
│                                                     │
│ Property Name: [________________]                   │
│ Data Type:     [string ▼]                           │
│ Default Value: [________________]                   │
│                                                     │
│ [Cancel] [Add Selected]                             │
└─────────────────────────────────────────────────────┘
```

### Implementation Details

1. **Pass componentType** from PropertiesEditor to AddPropertyDialog
2. **Lookup template** using `templateRegistry.getTemplate(componentType)`
3. **Filter already-added** properties (don't suggest what already exists)
4. **Multi-select checkboxes** for quick bulk add
5. **Keep custom option** for properties not in template

### Files to Modify

| File | Change |
|------|--------|
| `PropertyEditor/AddPropertyDialog.tsx` | Add componentType prop, show suggestions |
| `PropertyEditor/PropertiesEditor.tsx` | Pass componentType to AddPropertyDialog |

---

## Milestone 3: Tailwind Class Autocomplete

**Duration:** 0.5 day

### Objective
Add autocomplete/suggestions when typing in the Tailwind class input.

### Current Problem
- Free-text input with no help
- User must know Tailwind class names
- `TAILWIND_CLASS_SUGGESTIONS` exists but unused

### Solution

Add autocomplete dropdown to StylingEditor:

```
┌─────────────────────────────────────────────────────┐
│ Tailwind Classes                                    │
│ [flex-col x] [gap-4 x] [p-4 x]                     │
│                                                     │
│ [flex_________________] ← As user types "flex"     │
│ ┌─────────────────────┐                             │
│ │ flex                │ ← Matching suggestions      │
│ │ flex-row            │                             │
│ │ flex-col            │                             │
│ │ flex-wrap           │                             │
│ │ flex-nowrap         │                             │
│ └─────────────────────┘                             │
└─────────────────────────────────────────────────────┘
```

### Implementation Details

1. **Use existing data**: `TAILWIND_CLASS_SUGGESTIONS` from componentTemplates.ts
2. **Flatten suggestions** into searchable list
3. **Fuzzy match** as user types (simple substring match is fine for MVP)
4. **Limit results** to 10-15 suggestions
5. **Keyboard navigation**: Arrow keys + Enter to select
6. **Click to select**: Close dropdown on selection

### Files to Modify

| File | Change |
|------|--------|
| `PropertyEditor/StylingEditor.tsx` | Add autocomplete dropdown to class input |

---

## Milestone 4: Property Descriptions & Enum Dropdowns

**Duration:** 0.5 day

### Objective
Surface template metadata in the property editor - descriptions as helper text, enums as dropdowns.

### Current Problem
- PropertyInput shows raw string/number/boolean inputs
- No context about what values are valid
- Enum properties (variant, size, type) show as text inputs

### Solution

Enhance PropertyInput to handle template metadata:

```
┌─────────────────────────────────────────────────────┐
│ variant                                    [string] │
│ ┌───────────────────────────────────────────────┐   │
│ │ Primary                               ▼       │   │
│ │ ┌───────────────────────────────────────────┐ │   │
│ │ │ ● Primary                                 │ │   │
│ │ │   Secondary                               │ │   │
│ │ │   Outline                                 │ │   │
│ │ │   Ghost                                   │ │   │
│ │ │   Danger                                  │ │   │
│ │ └───────────────────────────────────────────┘ │   │
│ └───────────────────────────────────────────────┘   │
│ ⓘ Visual style of the button                       │
└─────────────────────────────────────────────────────┘
```

### Implementation Details

1. **Store template metadata** on properties when created (already done in manifestStore)
2. **Read `_template` metadata** in PropertyInput
3. **Render dropdown** if `_template.options` exists
4. **Show description** as gray helper text below input
5. **Show required indicator** if `_template.required`

### Note on Existing Data

Properties created from templates already have `_template` metadata:
```typescript
// In manifestStore.addComponent():
defaultProperties[prop.name] = {
  type: 'static',
  value: prop.default,
  _template: {
    description: prop.description,
    options: prop.options,
    category: prop.category,
    required: prop.required,
  },
};
```

### Files to Modify

| File | Change |
|------|--------|
| `PropertyEditor/PropertyInput.tsx` | Read _template, render dropdown for enums |
| `PropertyEditor/PropertyRow.tsx` | Show description from _template |

---

## Technical Specifications

### STYLE_PROPERTY_CATEGORIES Structure

```typescript
// From componentTemplates.ts
STYLE_PROPERTY_CATEGORIES = {
  layout: {
    label: 'Layout',
    properties: [
      { name: 'width', type: 'string', default: 'auto', presets: ['auto', '100%', '50%', ...] },
      { name: 'height', type: 'string', default: 'auto', presets: ['auto', '100%', ...] },
      // ... more
    ],
  },
  display: { ... },
  flexbox: { ... },
  spacing: { ... },
  typography: { ... },
  background: { ... },
  border: { ... },
  effects: { ... },
};
```

### TAILWIND_CLASS_SUGGESTIONS Structure

```typescript
// From componentTemplates.ts
TAILWIND_CLASS_SUGGESTIONS = {
  display: ['block', 'inline-block', 'flex', 'grid', 'hidden'],
  flexDirection: ['flex-row', 'flex-col', 'flex-row-reverse', 'flex-col-reverse'],
  justifyContent: ['justify-start', 'justify-center', 'justify-end', 'justify-between'],
  // ... more categories
};
```

---

## Definition of Done

- [ ] Inline styles visible and editable in Styling section
- [ ] Style properties grouped by category (Layout, Typography, etc.)
- [ ] Preset dropdowns for style properties
- [ ] Add Property dialog shows template suggestions
- [ ] Tailwind class input has autocomplete
- [ ] Enum properties render as dropdown selects
- [ ] Property descriptions shown as helper text
- [ ] All existing tests pass
- [ ] Manual testing completed
- [ ] Human review approved

---

## Risk Assessment

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| Component complexity | Medium | Medium | Keep components focused, use hooks |
| Performance (large suggestion lists) | Low | Low | Virtualize if needed, limit results |
| Breaking existing functionality | Medium | Low | Run existing tests, careful refactoring |
| UI clutter | Medium | Medium | Use collapsible sections, clean design |

---

## Files Summary

### Create
- `src/renderer/components/PropertyEditor/InlineStylesEditor.tsx`

### Modify
- `src/renderer/components/PropertyEditor/StylingEditor.tsx`
- `src/renderer/components/PropertyEditor/AddPropertyDialog.tsx`
- `src/renderer/components/PropertyEditor/PropertiesEditor.tsx`
- `src/renderer/components/PropertyEditor/PropertyInput.tsx`
- `src/renderer/components/PropertyEditor/PropertyRow.tsx`
- `src/renderer/components/PropertyEditor/index.ts`

---

**Last Updated:** November 29, 2025  
**Document Version:** 1.0  
**Prepared By:** Claude (Planning)
