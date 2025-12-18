# Task 3.5: Component Property Templates

## Implementation Status: ✅ PARTIALLY COMPLETE (Core Foundation Done)

**Completed:** 2025-11-29  
**Confidence:** 9/10

### Summary

This task implemented the core foundation of the Component Property Templates system:

1. **Template Types & Registry** (Milestone 1) ✅
   - Created `src/core/templates/types.ts` with PropertyTemplate, ComponentTemplate, EnumOption interfaces
   - Created `src/core/templates/componentTemplates.ts` with 25 templates (21 unique types)
   - Created `src/core/templates/TemplateRegistry.ts` with lookup, grouping, and default-building methods
   - Created `src/core/templates/index.ts` for module exports

2. **ManifestStore Integration** (Milestone 2) ✅
   - Modified `src/renderer/store/manifestStore.ts` to use templateRegistry
   - New components now get template-based defaults (properties, styling)
   - Falls back to legacy `getDefaultsForType` for unknown types
   - Added 'display' to Component category type

3. **Unit Tests** (Milestone 5) ✅
   - Created `tests/unit/templates/TemplateRegistry.test.ts` with 31 passing tests
   - Coverage includes all registry methods, template validation, custom registration

### Deferred to Follow-up Task

The following UI enhancements require more substantial changes and are deferred:

- **Milestone 3A:** Enhance PropertyInput for labeled enum options
- **Milestone 3B:** Enhance PropertyRow to show descriptions  
- **Milestone 3C:** Enhance PropertiesEditor with category grouping
- **Milestone 4:** Update AddComponentDialog to use templates

### Files Created/Modified

**Created:**
- `src/core/templates/types.ts`
- `src/core/templates/componentTemplates.ts`
- `src/core/templates/TemplateRegistry.ts`
- `src/core/templates/index.ts`
- `tests/unit/templates/TemplateRegistry.test.ts`

**Modified:**
- `src/renderer/store/manifestStore.ts` - Import templateRegistry, use for defaults
- `src/core/manifest/types.ts` - Added 'display' to category type

### Templates Included (25 total, 21 unique types)

**Basic (10):** button, text (span), h1, h2, h3, paragraph (p), image (img), link (a), ul, li
**Layout (6):** container (div), card (div), section, header, footer, nav
**Form (6):** input, textarea, select, checkbox (input), label, form
**Display (3):** badge (span), avatar (img), divider (hr)

---

**Phase:** Phase 3 - Code Generation & Preview (Extended)  
**Duration Estimate:** 3-4 days  
**Actual Duration:** [To be filled when complete]  
**Status:** 🔵 Not Started  
**Assigned:** AI + Human Review  
**Started:** [YYYY-MM-DD]  
**Completed:** [YYYY-MM-DD]  

---

## Task Overview

### Objective
Implement component-aware property templates that pre-populate the property panel with common, discoverable properties when users add components, eliminating the "blank slate" problem where users don't know what properties are available.

### Problem Statement
Currently, when a user adds a component (e.g., a Button), the property panel is empty. Users must:
1. Know what properties exist for that component type
2. Manually add each property by name
3. Guess at data types and valid values

This creates a significant usability barrier - even experienced developers won't know what Rise expects without documentation, and new users will be completely lost.

### Solution
Pre-define property templates for common component types. When a user adds a Button, the property panel immediately shows:
- `label` (string) - "Click me"
- `variant` (enum) - primary/secondary/outline
- `size` (enum) - sm/md/lg
- `disabled` (boolean) - false
- `fullWidth` (boolean) - false

Users can then modify these values, remove unwanted properties, or add custom ones.

### Success Criteria
- [ ] Property templates defined for 10+ common component types
- [ ] Templates auto-populate when component is created
- [ ] Users can modify/remove template properties
- [ ] Users can still add custom properties
- [ ] Template system is extensible (easy to add new templates)
- [ ] Templates respect Level 1 schema restrictions
- [ ] Property descriptions/hints shown in UI
- [ ] Test coverage >85%
- [ ] Human review completed

### References
- `.implementation/phase-2-component-management/task-2.3-property-panel-editor.md`
- `docs/COMPONENT_SCHEMA.md` - Property structure
- `docs/SCHEMA_LEVELS.md` - Level 1 restrictions

### Dependencies
- ✅ Task 2.3: Property Panel Editor (Complete)
- ✅ Task 3.3: Live Preview (for testing visual feedback)

---

## 🎯 Design Specification

### Component Template Structure

```typescript
// src/core/templates/types.ts

/**
 * Defines a property template for auto-population
 */
interface PropertyTemplate {
  /** Property name (e.g., "label", "variant") */
  name: string;
  
  /** Data type for the property */
  dataType: 'string' | 'number' | 'boolean' | 'enum';
  
  /** Default value */
  default: string | number | boolean;
  
  /** For enum types, the available options */
  options?: Array<{ value: string; label: string }>;
  
  /** Human-readable description shown in UI */
  description: string;
  
  /** Whether this property is required */
  required: boolean;
  
  /** Category for grouping (basics, styling, behavior) */
  category: 'basics' | 'styling' | 'behavior' | 'advanced';
  
  /** Placeholder text for input fields */
  placeholder?: string;
}

/**
 * Defines a component type's full template
 */
interface ComponentTemplate {
  /** Component type identifier */
  type: string;
  
  /** Display name for the component */
  displayName: string;
  
  /** Icon identifier for UI */
  icon: string;
  
  /** Category in component palette */
  category: 'basic' | 'layout' | 'form' | 'display' | 'composite';
  
  /** Pre-defined properties */
  properties: PropertyTemplate[];
  
  /** Default Tailwind classes */
  defaultClasses: string[];
  
  /** Default children structure (for containers) */
  defaultChildren?: string[];
}
```

### Initial Component Templates

#### Basic Components

**Button**
```typescript
{
  type: 'button',
  displayName: 'Button',
  icon: 'cursor-click',
  category: 'basic',
  properties: [
    {
      name: 'label',
      dataType: 'string',
      default: 'Click me',
      description: 'Text displayed on the button',
      required: true,
      category: 'basics',
    },
    {
      name: 'variant',
      dataType: 'enum',
      default: 'primary',
      options: [
        { value: 'primary', label: 'Primary' },
        { value: 'secondary', label: 'Secondary' },
        { value: 'outline', label: 'Outline' },
        { value: 'ghost', label: 'Ghost' },
        { value: 'danger', label: 'Danger' },
      ],
      description: 'Visual style of the button',
      required: false,
      category: 'styling',
    },
    {
      name: 'size',
      dataType: 'enum',
      default: 'md',
      options: [
        { value: 'sm', label: 'Small' },
        { value: 'md', label: 'Medium' },
        { value: 'lg', label: 'Large' },
      ],
      description: 'Size of the button',
      required: false,
      category: 'styling',
    },
    {
      name: 'disabled',
      dataType: 'boolean',
      default: false,
      description: 'Whether the button is disabled',
      required: false,
      category: 'behavior',
    },
    {
      name: 'fullWidth',
      dataType: 'boolean',
      default: false,
      description: 'Whether button spans full width',
      required: false,
      category: 'styling',
    },
  ],
  defaultClasses: ['px-4', 'py-2', 'rounded', 'font-medium'],
}
```

**Text / Heading**
```typescript
{
  type: 'text',
  displayName: 'Text',
  icon: 'text',
  category: 'basic',
  properties: [
    {
      name: 'content',
      dataType: 'string',
      default: 'Enter text here',
      description: 'The text content to display',
      required: true,
      category: 'basics',
    },
    {
      name: 'as',
      dataType: 'enum',
      default: 'p',
      options: [
        { value: 'h1', label: 'Heading 1' },
        { value: 'h2', label: 'Heading 2' },
        { value: 'h3', label: 'Heading 3' },
        { value: 'h4', label: 'Heading 4' },
        { value: 'p', label: 'Paragraph' },
        { value: 'span', label: 'Span' },
      ],
      description: 'HTML element to render',
      required: false,
      category: 'basics',
    },
    {
      name: 'align',
      dataType: 'enum',
      default: 'left',
      options: [
        { value: 'left', label: 'Left' },
        { value: 'center', label: 'Center' },
        { value: 'right', label: 'Right' },
      ],
      description: 'Text alignment',
      required: false,
      category: 'styling',
    },
  ],
  defaultClasses: [],
}
```

**Image**
```typescript
{
  type: 'image',
  displayName: 'Image',
  icon: 'photo',
  category: 'basic',
  properties: [
    {
      name: 'src',
      dataType: 'string',
      default: 'https://via.placeholder.com/300x200',
      description: 'Image URL or path',
      required: true,
      category: 'basics',
      placeholder: 'https://example.com/image.jpg',
    },
    {
      name: 'alt',
      dataType: 'string',
      default: 'Image description',
      description: 'Alt text for accessibility',
      required: true,
      category: 'basics',
    },
    {
      name: 'width',
      dataType: 'string',
      default: 'auto',
      description: 'Image width (px, %, auto)',
      required: false,
      category: 'styling',
      placeholder: '300px or 100%',
    },
    {
      name: 'height',
      dataType: 'string',
      default: 'auto',
      description: 'Image height (px, %, auto)',
      required: false,
      category: 'styling',
    },
    {
      name: 'objectFit',
      dataType: 'enum',
      default: 'cover',
      options: [
        { value: 'contain', label: 'Contain' },
        { value: 'cover', label: 'Cover' },
        { value: 'fill', label: 'Fill' },
        { value: 'none', label: 'None' },
      ],
      description: 'How image fills its container',
      required: false,
      category: 'styling',
    },
  ],
  defaultClasses: ['max-w-full'],
}
```

**Link**
```typescript
{
  type: 'link',
  displayName: 'Link',
  icon: 'link',
  category: 'basic',
  properties: [
    {
      name: 'text',
      dataType: 'string',
      default: 'Click here',
      description: 'Link text',
      required: true,
      category: 'basics',
    },
    {
      name: 'href',
      dataType: 'string',
      default: '#',
      description: 'Link destination URL',
      required: true,
      category: 'basics',
      placeholder: 'https://example.com',
    },
    {
      name: 'target',
      dataType: 'enum',
      default: '_self',
      options: [
        { value: '_self', label: 'Same tab' },
        { value: '_blank', label: 'New tab' },
      ],
      description: 'Where to open the link',
      required: false,
      category: 'behavior',
    },
  ],
  defaultClasses: ['text-blue-600', 'hover:underline'],
}
```

#### Form Components

**Input**
```typescript
{
  type: 'input',
  displayName: 'Input',
  icon: 'input',
  category: 'form',
  properties: [
    {
      name: 'label',
      dataType: 'string',
      default: 'Label',
      description: 'Input label text',
      required: false,
      category: 'basics',
    },
    {
      name: 'placeholder',
      dataType: 'string',
      default: 'Enter value...',
      description: 'Placeholder text',
      required: false,
      category: 'basics',
    },
    {
      name: 'type',
      dataType: 'enum',
      default: 'text',
      options: [
        { value: 'text', label: 'Text' },
        { value: 'email', label: 'Email' },
        { value: 'password', label: 'Password' },
        { value: 'number', label: 'Number' },
        { value: 'tel', label: 'Phone' },
        { value: 'url', label: 'URL' },
      ],
      description: 'Input type',
      required: false,
      category: 'basics',
    },
    {
      name: 'required',
      dataType: 'boolean',
      default: false,
      description: 'Whether input is required',
      required: false,
      category: 'behavior',
    },
    {
      name: 'disabled',
      dataType: 'boolean',
      default: false,
      description: 'Whether input is disabled',
      required: false,
      category: 'behavior',
    },
  ],
  defaultClasses: ['w-full', 'px-3', 'py-2', 'border', 'rounded'],
}
```

#### Layout Components

**Container / Div**
```typescript
{
  type: 'container',
  displayName: 'Container',
  icon: 'square',
  category: 'layout',
  properties: [
    {
      name: 'display',
      dataType: 'enum',
      default: 'block',
      options: [
        { value: 'block', label: 'Block' },
        { value: 'flex', label: 'Flex' },
        { value: 'grid', label: 'Grid' },
        { value: 'inline', label: 'Inline' },
        { value: 'inline-flex', label: 'Inline Flex' },
      ],
      description: 'Display mode',
      required: false,
      category: 'styling',
    },
    {
      name: 'flexDirection',
      dataType: 'enum',
      default: 'row',
      options: [
        { value: 'row', label: 'Row' },
        { value: 'column', label: 'Column' },
        { value: 'row-reverse', label: 'Row Reverse' },
        { value: 'column-reverse', label: 'Column Reverse' },
      ],
      description: 'Flex direction (when display is flex)',
      required: false,
      category: 'styling',
    },
    {
      name: 'justifyContent',
      dataType: 'enum',
      default: 'start',
      options: [
        { value: 'start', label: 'Start' },
        { value: 'center', label: 'Center' },
        { value: 'end', label: 'End' },
        { value: 'between', label: 'Space Between' },
        { value: 'around', label: 'Space Around' },
        { value: 'evenly', label: 'Space Evenly' },
      ],
      description: 'Main axis alignment',
      required: false,
      category: 'styling',
    },
    {
      name: 'alignItems',
      dataType: 'enum',
      default: 'stretch',
      options: [
        { value: 'start', label: 'Start' },
        { value: 'center', label: 'Center' },
        { value: 'end', label: 'End' },
        { value: 'stretch', label: 'Stretch' },
        { value: 'baseline', label: 'Baseline' },
      ],
      description: 'Cross axis alignment',
      required: false,
      category: 'styling',
    },
    {
      name: 'gap',
      dataType: 'string',
      default: '0',
      description: 'Gap between children (e.g., 4, 8, 16)',
      required: false,
      category: 'styling',
      placeholder: '4',
    },
  ],
  defaultClasses: [],
}
```

**Card**
```typescript
{
  type: 'card',
  displayName: 'Card',
  icon: 'rectangle',
  category: 'layout',
  properties: [
    {
      name: 'padding',
      dataType: 'enum',
      default: 'md',
      options: [
        { value: 'none', label: 'None' },
        { value: 'sm', label: 'Small' },
        { value: 'md', label: 'Medium' },
        { value: 'lg', label: 'Large' },
      ],
      description: 'Internal padding',
      required: false,
      category: 'styling',
    },
    {
      name: 'shadow',
      dataType: 'enum',
      default: 'md',
      options: [
        { value: 'none', label: 'None' },
        { value: 'sm', label: 'Small' },
        { value: 'md', label: 'Medium' },
        { value: 'lg', label: 'Large' },
        { value: 'xl', label: 'Extra Large' },
      ],
      description: 'Shadow depth',
      required: false,
      category: 'styling',
    },
    {
      name: 'rounded',
      dataType: 'enum',
      default: 'md',
      options: [
        { value: 'none', label: 'None' },
        { value: 'sm', label: 'Small' },
        { value: 'md', label: 'Medium' },
        { value: 'lg', label: 'Large' },
        { value: 'full', label: 'Full' },
      ],
      description: 'Border radius',
      required: false,
      category: 'styling',
    },
  ],
  defaultClasses: ['bg-white', 'border', 'border-gray-200'],
}
```

### Additional Templates (10+ total)

| Component | Category | Key Properties |
|-----------|----------|----------------|
| Button | basic | label, variant, size, disabled |
| Text | basic | content, as, align |
| Image | basic | src, alt, width, height, objectFit |
| Link | basic | text, href, target |
| Input | form | label, placeholder, type, required |
| Textarea | form | label, placeholder, rows |
| Select | form | label, options, placeholder |
| Checkbox | form | label, checked |
| Container | layout | display, flexDirection, gap |
| Card | layout | padding, shadow, rounded |
| Stack | layout | direction, spacing, align |
| Grid | layout | columns, gap |
| Badge | display | text, variant, size |
| Avatar | display | src, alt, size, rounded |
| Divider | display | orientation, color |

---

## 🗺️ Implementation Roadmap

### Milestone 1: Template Data Structure & Registry
**Duration:** 0.5 day  
**Confidence Target:** 9/10  
**Status:** 🔵 Not Started

#### Deliverables
- [ ] `src/core/templates/types.ts` - TypeScript interfaces
- [ ] `src/core/templates/componentTemplates.ts` - Template definitions
- [ ] `src/core/templates/TemplateRegistry.ts` - Registry class
- [ ] Unit tests for registry

#### Files to Create

**`src/core/templates/TemplateRegistry.ts`**
```typescript
/**
 * @file TemplateRegistry.ts
 * @description Central registry for component property templates
 * 
 * Provides lookup and retrieval of templates by component type.
 * Supports extensibility for custom/user templates in future.
 */

import { ComponentTemplate, PropertyTemplate } from './types';
import { COMPONENT_TEMPLATES } from './componentTemplates';

export class TemplateRegistry {
  private templates: Map<string, ComponentTemplate>;
  
  constructor() {
    this.templates = new Map();
    this.registerBuiltinTemplates();
  }
  
  /**
   * Register all built-in component templates
   */
  private registerBuiltinTemplates(): void {
    COMPONENT_TEMPLATES.forEach(template => {
      this.templates.set(template.type, template);
    });
  }
  
  /**
   * Get template for a component type
   */
  getTemplate(type: string): ComponentTemplate | undefined {
    return this.templates.get(type);
  }
  
  /**
   * Get all available templates
   */
  getAllTemplates(): ComponentTemplate[] {
    return Array.from(this.templates.values());
  }
  
  /**
   * Get templates by category
   */
  getTemplatesByCategory(category: string): ComponentTemplate[] {
    return this.getAllTemplates().filter(t => t.category === category);
  }
  
  /**
   * Check if a template exists for a type
   */
  hasTemplate(type: string): boolean {
    return this.templates.has(type);
  }
  
  /**
   * Register a custom template (for extensibility)
   */
  registerTemplate(template: ComponentTemplate): void {
    this.templates.set(template.type, template);
  }
}

// Singleton instance
export const templateRegistry = new TemplateRegistry();
```

---

### Milestone 2: Integration with Component Creation
**Duration:** 1 day  
**Confidence Target:** 8/10  
**Status:** 🔵 Not Started

#### Objective
When a component is added to the manifest, automatically populate its properties from the matching template.

#### Deliverables
- [ ] Modify `manifestStore.addComponent()` to apply templates
- [ ] Handle case when no template exists (empty properties)
- [ ] Preserve any explicitly provided properties (don't overwrite)
- [ ] Integration tests

#### Code Changes

**Modify `src/renderer/store/manifestStore.ts`**
```typescript
import { templateRegistry } from '../../core/templates/TemplateRegistry';

// In addComponent action:
addComponent: (parentId, componentData) => {
  // Get template for this component type
  const template = templateRegistry.getTemplate(componentData.type);
  
  // Build default properties from template
  const defaultProperties: Record<string, Property> = {};
  
  if (template) {
    template.properties.forEach(prop => {
      defaultProperties[prop.name] = {
        type: 'static',
        dataType: prop.dataType === 'enum' ? 'string' : prop.dataType,
        value: prop.default,
        // Store template metadata for UI hints
        _template: {
          description: prop.description,
          options: prop.options,
          category: prop.category,
          required: prop.required,
        },
      };
    });
  }
  
  // Merge with any explicitly provided properties
  const finalProperties = {
    ...defaultProperties,
    ...(componentData.properties || {}),
  };
  
  // Apply default classes from template
  const defaultClasses = template?.defaultClasses || [];
  const finalClasses = [
    ...defaultClasses,
    ...(componentData.styling?.baseClasses || []),
  ];
  
  const newComponent: Component = {
    id: generateComponentId(componentData.displayName || template?.displayName || 'Component'),
    type: componentData.type,
    displayName: componentData.displayName || template?.displayName || 'Component',
    properties: finalProperties,
    styling: {
      baseClasses: finalClasses,
    },
    children: [],
    metadata: {
      created: new Date().toISOString(),
      modified: new Date().toISOString(),
    },
  };
  
  // ... rest of add logic
},
```

---

### Milestone 3: Property Panel UI Enhancements
**Duration:** 1 day  
**Confidence Target:** 8/10  
**Status:** 🔵 Not Started

#### Objective
Enhance the property panel to display template metadata (descriptions, categories, enum options).

#### Deliverables
- [ ] Property descriptions shown as tooltips/hints
- [ ] Enum properties render as dropdowns with labels
- [ ] Properties grouped by category (basics, styling, behavior)
- [ ] Required properties marked with indicator
- [ ] "Reset to default" option per property

#### UI Mockup

```
┌─────────────────────────────────────────────────────┐
│ Properties                                          │
├─────────────────────────────────────────────────────┤
│ ▼ Basics                                            │
│   ┌───────────────────────────────────────────────┐ │
│   │ label *                              [string] │ │
│   │ ┌─────────────────────────────────────────┐   │ │
│   │ │ Click me                                │   │ │
│   │ └─────────────────────────────────────────┘   │ │
│   │ ⓘ Text displayed on the button               │ │
│   └───────────────────────────────────────────────┘ │
│                                                     │
│ ▼ Styling                                           │
│   ┌───────────────────────────────────────────────┐ │
│   │ variant                               [enum]  │ │
│   │ ┌─────────────────────────────────────────┐   │ │
│   │ │ Primary                            ▼    │   │ │
│   │ └─────────────────────────────────────────┘   │ │
│   │ ⓘ Visual style of the button                 │ │
│   └───────────────────────────────────────────────┘ │
│                                                     │
│   ┌───────────────────────────────────────────────┐ │
│   │ size                                  [enum]  │ │
│   │ ┌─────────────────────────────────────────┐   │ │
│   │ │ Medium                             ▼    │   │ │
│   │ └─────────────────────────────────────────┘   │ │
│   └───────────────────────────────────────────────┘ │
│                                                     │
│ ▶ Behavior (2 properties)                           │
│                                                     │
│ [+ Add Custom Property]                             │
└─────────────────────────────────────────────────────┘
```

---

### Milestone 4: Component Palette Integration
**Duration:** 0.5 day  
**Confidence Target:** 9/10  
**Status:** 🔵 Not Started

#### Objective
Create a component palette that shows available component types from templates.

#### Deliverables
- [ ] Component palette UI in Navigator panel
- [ ] Components grouped by category (Basic, Layout, Form, Display)
- [ ] Icons for each component type
- [ ] Click/drag to add component
- [ ] Search/filter components

---

### Milestone 5: Testing & Documentation
**Duration:** 0.5 day  
**Confidence Target:** 9/10  
**Status:** 🔵 Not Started

#### Deliverables
- [ ] Unit tests for TemplateRegistry
- [ ] Integration tests for template application
- [ ] Update property panel tests
- [ ] Documentation for adding custom templates
- [ ] Update task file with results

---

## 📊 Success Metrics

| Metric | Target | How to Verify |
|--------|--------|---------------|
| Templates defined | 10+ components | Count in componentTemplates.ts |
| Auto-population works | 100% | Add component, verify properties appear |
| Descriptions shown | All template props | UI inspection |
| Enum dropdowns | All enum props | UI inspection |
| Category grouping | Working | UI inspection |
| Test coverage | >85% | Coverage report |

---

## 🚨 Risk Assessment

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| Template bloat | Medium | Medium | Keep minimal essential props |
| Override conflicts | Low | Low | Explicit merge precedence rules |
| Performance with many templates | Low | Low | Templates are static, loaded once |
| UI complexity increase | Medium | Medium | Collapsible categories, clean design |

---

## ✅ Definition of Done

Task 3.5 is complete when:

1. [ ] 10+ component templates defined
2. [ ] Templates auto-apply on component creation
3. [ ] Property panel shows descriptions and categories
4. [ ] Enum properties render as dropdowns
5. [ ] Component palette available in UI
6. [ ] All tests passing (>85% coverage)
7. [ ] Documentation complete
8. [ ] Human review approved

---

**Task Status:** 🔵 Not Started  
**Critical Path:** No - Enhancement task  
**Risk Level:** LOW  
**User Impact:** HIGH - Major usability improvement

---

**Last Updated:** November 29, 2025  
**Document Version:** 1.0  
**Prepared By:** Claude (Planning)
