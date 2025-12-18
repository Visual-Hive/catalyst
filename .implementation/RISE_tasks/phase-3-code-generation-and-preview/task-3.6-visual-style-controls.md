# Task 3.6: Visual Style Controls

**Phase:** Phase 3 - Code Generation & Preview (Extended)  
**Duration Estimate:** 4-5 days  
**Actual Duration:** [To be filled when complete]  
**Status:** ✅ Complete  
**Assigned:** AI + Human Review  
**Started:** 2025-11-29  
**Completed:** 2025-11-29  

---

## Task Overview

### Objective
Implement visual style controls in the property panel that provide intuitive, categorized styling options for spacing, colors, typography, sizing, and borders - eliminating the need to manually type Tailwind class names.

### Problem Statement
Currently, styling components requires:
1. Knowing Tailwind class names by heart (e.g., `px-4`, `bg-blue-500`, `rounded-lg`)
2. Manually typing class names as text tags
3. No visual feedback until you add the class
4. No discovery mechanism for available styling options

This is a significant barrier even for developers familiar with Tailwind, and completely inaccessible to low-code users.

### Solution
Replace the raw class input with categorized visual controls:
- **Spacing**: Numeric inputs or sliders for padding/margin (all sides or individual)
- **Colors**: Color pickers for background, text, border colors
- **Typography**: Dropdowns for font size, weight, alignment
- **Size**: Inputs for width, height with unit selection
- **Borders**: Controls for width, radius, style
- **Effects**: Shadow, opacity controls

The controls translate user selections into Tailwind classes automatically.

### Success Criteria
- [ ] Spacing controls (padding, margin) with all-sides and individual options
- [ ] Color pickers for bg, text, border colors (with Tailwind palette)
- [ ] Typography controls (size, weight, align, family)
- [ ] Size controls (width, height, min/max variants)
- [ ] Border controls (width, radius, style, color)
- [ ] Shadow/opacity controls
- [ ] All controls generate valid Tailwind classes
- [ ] Bidirectional: existing classes populate controls correctly
- [ ] Test coverage >80%
- [ ] Human review completed

### References
- `.implementation/phase-2-component-management/task-2.3-property-panel-editor.md`
- Task 3.5: Component Property Templates (parallel development)
- Tailwind CSS documentation for class mappings

### Dependencies
- ✅ Task 2.3: Property Panel Editor (Complete)
- ✅ Task 3.3: Live Preview (for testing visual feedback)
- ⚠️ Recommended after Task 3.5 (property templates provide structure)

---

## 🎯 Design Specification

### Style Control Categories

```typescript
// src/renderer/components/StyleEditor/types.ts

/**
 * Categories of style controls
 */
type StyleCategory = 
  | 'spacing'    // padding, margin
  | 'sizing'     // width, height
  | 'typography' // font-size, weight, color, align
  | 'background' // bg color, gradient
  | 'border'     // width, radius, color, style
  | 'effects'    // shadow, opacity
  | 'layout';    // display, position, flex props

/**
 * Spacing value configuration
 */
interface SpacingValue {
  all?: number;      // Apply to all sides
  top?: number;
  right?: number;
  bottom?: number;
  left?: number;
  x?: number;        // Horizontal (left + right)
  y?: number;        // Vertical (top + bottom)
}

/**
 * Size value with unit
 */
interface SizeValue {
  value: number | string;
  unit: 'px' | '%' | 'rem' | 'auto' | 'full' | 'screen';
}
```

### Tailwind Class Mappings

#### Spacing Scale (Tailwind Default)
```typescript
const SPACING_SCALE: Record<number, string> = {
  0: '0',
  1: '1',    // 0.25rem = 4px
  2: '2',    // 0.5rem = 8px
  3: '3',    // 0.75rem = 12px
  4: '4',    // 1rem = 16px
  5: '5',    // 1.25rem = 20px
  6: '6',    // 1.5rem = 24px
  8: '8',    // 2rem = 32px
  10: '10',  // 2.5rem = 40px
  12: '12',  // 3rem = 48px
  16: '16',  // 4rem = 64px
  20: '20',  // 5rem = 80px
  24: '24',  // 6rem = 96px
};

// Generates: p-4, px-2, mt-8, etc.
```

#### Color Palette (Tailwind Default)
```typescript
const COLOR_PALETTE = {
  gray: ['50', '100', '200', '300', '400', '500', '600', '700', '800', '900'],
  red: ['50', '100', '200', '300', '400', '500', '600', '700', '800', '900'],
  orange: ['50', '100', '200', '300', '400', '500', '600', '700', '800', '900'],
  yellow: ['50', '100', '200', '300', '400', '500', '600', '700', '800', '900'],
  green: ['50', '100', '200', '300', '400', '500', '600', '700', '800', '900'],
  blue: ['50', '100', '200', '300', '400', '500', '600', '700', '800', '900'],
  indigo: ['50', '100', '200', '300', '400', '500', '600', '700', '800', '900'],
  purple: ['50', '100', '200', '300', '400', '500', '600', '700', '800', '900'],
  pink: ['50', '100', '200', '300', '400', '500', '600', '700', '800', '900'],
  // Special
  white: [],
  black: [],
  transparent: [],
};

// Generates: bg-blue-500, text-gray-700, border-red-300, etc.
```

#### Typography Scale
```typescript
const FONT_SIZE_SCALE = {
  'xs': 'text-xs',      // 0.75rem
  'sm': 'text-sm',      // 0.875rem
  'base': 'text-base',  // 1rem
  'lg': 'text-lg',      // 1.125rem
  'xl': 'text-xl',      // 1.25rem
  '2xl': 'text-2xl',    // 1.5rem
  '3xl': 'text-3xl',    // 1.875rem
  '4xl': 'text-4xl',    // 2.25rem
  '5xl': 'text-5xl',    // 3rem
};

const FONT_WEIGHT_SCALE = {
  'thin': 'font-thin',         // 100
  'light': 'font-light',       // 300
  'normal': 'font-normal',     // 400
  'medium': 'font-medium',     // 500
  'semibold': 'font-semibold', // 600
  'bold': 'font-bold',         // 700
  'extrabold': 'font-extrabold', // 800
};
```

---

## 🎨 UI Design

### Styling Panel Layout

```
┌─────────────────────────────────────────────────────┐
│ Styling                                    [Reset]  │
├─────────────────────────────────────────────────────┤
│                                                     │
│ ▼ Spacing                                           │
│   ┌───────────────────────────────────────────────┐ │
│   │              Padding                          │ │
│   │   ┌─────┐                                     │ │
│   │   │  8  │  ← All sides                        │ │
│   │   └─────┘                                     │ │
│   │   [○ All] [● Individual]                      │ │
│   │                                               │ │
│   │     ┌───┐                                     │ │
│   │     │ 8 │ Top                                 │ │
│   │   ┌─┴───┴─┐                                   │ │
│   │   │       │                                   │ │
│   │ 4 │       │ 4  Left/Right                     │ │
│   │   │       │                                   │ │
│   │   └─┬───┬─┘                                   │ │
│   │     │ 8 │ Bottom                              │ │
│   │     └───┘                                     │ │
│   │                                               │ │
│   │              Margin                           │ │
│   │   ┌─────┐                                     │ │
│   │   │  4  │  ← All sides                        │ │
│   │   └─────┘                                     │ │
│   └───────────────────────────────────────────────┘ │
│                                                     │
│ ▼ Colors                                            │
│   ┌───────────────────────────────────────────────┐ │
│   │ Background    [████████] blue-500       [×]   │ │
│   │ Text          [████████] white          [×]   │ │
│   │ Border        [████████] blue-600       [×]   │ │
│   └───────────────────────────────────────────────┘ │
│                                                     │
│ ▼ Typography                                        │
│   ┌───────────────────────────────────────────────┐ │
│   │ Size      [  Base (1rem)     ▼]               │ │
│   │ Weight    [  Medium          ▼]               │ │
│   │ Align     [◀] [≡] [▶] [⊞]                     │ │
│   └───────────────────────────────────────────────┘ │
│                                                     │
│ ▼ Size                                              │
│   ┌───────────────────────────────────────────────┐ │
│   │ Width     [────────] auto  [▼ unit]           │ │
│   │ Height    [────────] auto  [▼ unit]           │ │
│   │ [○] Full width                                │ │
│   └───────────────────────────────────────────────┘ │
│                                                     │
│ ▼ Border                                            │
│   ┌───────────────────────────────────────────────┐ │
│   │ Width     [0] [1] [2] [4] [8]                  │ │
│   │ Radius    [0] [sm] [md] [lg] [full]           │ │
│   │ Style     [solid ▼]                           │ │
│   └───────────────────────────────────────────────┘ │
│                                                     │
│ ▶ Effects (collapsed)                               │
│                                                     │
│ ─────────────────────────────────────────────────── │
│ Raw Classes                              [Expand ▼] │
│ px-4 py-2 bg-blue-500 text-white rounded-lg        │
└─────────────────────────────────────────────────────┘
```

### Color Picker Component

```
┌──────────────────────────────────────┐
│ Background Color                     │
├──────────────────────────────────────┤
│ ┌──────────────────────────────────┐ │
│ │ gray   ○○○○○●○○○○                │ │
│ │ red    ○○○○○○○○○○                │ │
│ │ orange ○○○○○○○○○○                │ │
│ │ yellow ○○○○○○○○○○                │ │
│ │ green  ○○○○○○○○○○                │ │
│ │ blue   ○○○○○●○○○○  ← selected    │ │
│ │ indigo ○○○○○○○○○○                │ │
│ │ purple ○○○○○○○○○○                │ │
│ │ pink   ○○○○○○○○○○                │ │
│ └──────────────────────────────────┘ │
│                                      │
│ Selected: blue-500                   │
│ Preview: [████████████████████]      │
│                                      │
│ [Clear]                    [Apply]   │
└──────────────────────────────────────┘
```

---

## 🗺️ Implementation Roadmap

### Milestone 1: Core Utilities & Class Parser
**Duration:** 1 day  
**Confidence Target:** 9/10  
**Status:** 🔵 Not Started

#### Objective
Create utilities for parsing existing Tailwind classes and generating new ones from control values.

#### Deliverables
- [ ] `src/renderer/utils/tailwindParser.ts` - Parse classes to structured data
- [ ] `src/renderer/utils/tailwindGenerator.ts` - Generate classes from data
- [ ] `src/renderer/utils/tailwindMappings.ts` - Scale/palette constants
- [ ] Unit tests for parsing and generation

#### Key Code

**`src/renderer/utils/tailwindParser.ts`**
```typescript
/**
 * @file tailwindParser.ts
 * @description Parse Tailwind classes into structured style data
 * 
 * Enables bidirectional sync: classes ↔ visual controls
 */

import { SPACING_SCALE, COLOR_PALETTE, FONT_SIZE_SCALE } from './tailwindMappings';

export interface ParsedStyles {
  padding: SpacingValue;
  margin: SpacingValue;
  backgroundColor?: string;
  textColor?: string;
  borderColor?: string;
  fontSize?: string;
  fontWeight?: string;
  textAlign?: string;
  width?: string;
  height?: string;
  borderWidth?: string;
  borderRadius?: string;
  shadow?: string;
  opacity?: string;
  // Classes that couldn't be parsed (preserved as-is)
  unknownClasses: string[];
}

/**
 * Parse Tailwind class string into structured style data
 */
export function parseClasses(classString: string): ParsedStyles {
  const classes = classString.split(/\s+/).filter(Boolean);
  const result: ParsedStyles = {
    padding: {},
    margin: {},
    unknownClasses: [],
  };
  
  for (const cls of classes) {
    // Padding
    if (cls.match(/^p-(\d+)$/)) {
      result.padding.all = parseInt(cls.slice(2));
    } else if (cls.match(/^px-(\d+)$/)) {
      result.padding.x = parseInt(cls.slice(3));
    } else if (cls.match(/^py-(\d+)$/)) {
      result.padding.y = parseInt(cls.slice(3));
    } else if (cls.match(/^pt-(\d+)$/)) {
      result.padding.top = parseInt(cls.slice(3));
    } else if (cls.match(/^pr-(\d+)$/)) {
      result.padding.right = parseInt(cls.slice(3));
    } else if (cls.match(/^pb-(\d+)$/)) {
      result.padding.bottom = parseInt(cls.slice(3));
    } else if (cls.match(/^pl-(\d+)$/)) {
      result.padding.left = parseInt(cls.slice(3));
    }
    
    // Margin (similar pattern)
    else if (cls.match(/^m-(\d+)$/)) {
      result.margin.all = parseInt(cls.slice(2));
    }
    // ... etc
    
    // Background color
    else if (cls.match(/^bg-(\w+)-(\d+)$/)) {
      result.backgroundColor = cls.slice(3);
    } else if (cls === 'bg-white' || cls === 'bg-black' || cls === 'bg-transparent') {
      result.backgroundColor = cls.slice(3);
    }
    
    // Text color
    else if (cls.match(/^text-(\w+)-(\d+)$/)) {
      result.textColor = cls.slice(5);
    }
    
    // Font size
    else if (cls.match(/^text-(xs|sm|base|lg|xl|2xl|3xl|4xl|5xl)$/)) {
      result.fontSize = cls.slice(5);
    }
    
    // ... continue for other properties
    
    // Unknown - preserve for raw display
    else {
      result.unknownClasses.push(cls);
    }
  }
  
  return result;
}

/**
 * Generate Tailwind class string from structured style data
 */
export function generateClasses(styles: ParsedStyles): string {
  const classes: string[] = [];
  
  // Padding
  if (styles.padding.all !== undefined) {
    classes.push(`p-${styles.padding.all}`);
  } else {
    if (styles.padding.x !== undefined) classes.push(`px-${styles.padding.x}`);
    if (styles.padding.y !== undefined) classes.push(`py-${styles.padding.y}`);
    if (styles.padding.top !== undefined) classes.push(`pt-${styles.padding.top}`);
    if (styles.padding.right !== undefined) classes.push(`pr-${styles.padding.right}`);
    if (styles.padding.bottom !== undefined) classes.push(`pb-${styles.padding.bottom}`);
    if (styles.padding.left !== undefined) classes.push(`pl-${styles.padding.left}`);
  }
  
  // Margin
  if (styles.margin.all !== undefined) {
    classes.push(`m-${styles.margin.all}`);
  }
  // ... etc
  
  // Colors
  if (styles.backgroundColor) {
    classes.push(`bg-${styles.backgroundColor}`);
  }
  if (styles.textColor) {
    classes.push(`text-${styles.textColor}`);
  }
  
  // Preserve unknown classes
  classes.push(...styles.unknownClasses);
  
  return classes.join(' ');
}
```

---

### Milestone 2: Spacing Controls Component
**Duration:** 1 day  
**Confidence Target:** 8/10  
**Status:** 🔵 Not Started

#### Deliverables
- [ ] `src/renderer/components/StyleEditor/SpacingControl.tsx`
- [ ] Visual box model UI for padding/margin
- [ ] Toggle between "all sides" and "individual" modes
- [ ] Numeric inputs with Tailwind scale validation
- [ ] Unit tests

#### Key UI Component

```typescript
/**
 * @file SpacingControl.tsx
 * @description Visual spacing control with box model representation
 */

interface SpacingControlProps {
  type: 'padding' | 'margin';
  value: SpacingValue;
  onChange: (value: SpacingValue) => void;
}

export function SpacingControl({ type, value, onChange }: SpacingControlProps) {
  const [mode, setMode] = useState<'all' | 'individual'>('all');
  
  const label = type === 'padding' ? 'Padding' : 'Margin';
  const prefix = type === 'padding' ? 'p' : 'm';
  
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-700">{label}</span>
        <div className="flex gap-1">
          <button
            onClick={() => setMode('all')}
            className={`px-2 py-1 text-xs rounded ${
              mode === 'all' ? 'bg-blue-100 text-blue-700' : 'text-gray-500'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setMode('individual')}
            className={`px-2 py-1 text-xs rounded ${
              mode === 'individual' ? 'bg-blue-100 text-blue-700' : 'text-gray-500'
            }`}
          >
            Individual
          </button>
        </div>
      </div>
      
      {mode === 'all' ? (
        <SpacingInput
          value={value.all ?? 0}
          onChange={(v) => onChange({ all: v })}
          placeholder="0"
        />
      ) : (
        <BoxModelInput
          top={value.top ?? value.y ?? value.all ?? 0}
          right={value.right ?? value.x ?? value.all ?? 0}
          bottom={value.bottom ?? value.y ?? value.all ?? 0}
          left={value.left ?? value.x ?? value.all ?? 0}
          onChange={(side, v) => {
            const newValue = { ...value };
            delete newValue.all;
            delete newValue.x;
            delete newValue.y;
            newValue[side] = v;
            onChange(newValue);
          }}
        />
      )}
    </div>
  );
}
```

---

### Milestone 3: Color Picker Component
**Duration:** 1 day  
**Confidence Target:** 8/10  
**Status:** 🔵 Not Started

#### Deliverables
- [ ] `src/renderer/components/StyleEditor/ColorPicker.tsx`
- [ ] Tailwind color palette grid
- [ ] Shade selection (50-900)
- [ ] Preview swatch
- [ ] Clear/reset option
- [ ] Support for bg, text, border color types

---

### Milestone 4: Typography & Size Controls
**Duration:** 0.5 day  
**Confidence Target:** 9/10  
**Status:** 🔵 Not Started

#### Deliverables
- [ ] `src/renderer/components/StyleEditor/TypographyControl.tsx`
- [ ] Font size dropdown (Tailwind scale)
- [ ] Font weight dropdown
- [ ] Text alignment buttons
- [ ] `src/renderer/components/StyleEditor/SizeControl.tsx`
- [ ] Width/height inputs with unit selection

---

### Milestone 5: Border & Effects Controls
**Duration:** 0.5 day  
**Confidence Target:** 9/10  
**Status:** 🔵 Not Started

#### Deliverables
- [ ] `src/renderer/components/StyleEditor/BorderControl.tsx`
- [ ] Border width selector (0, 1, 2, 4, 8)
- [ ] Border radius selector (none, sm, md, lg, full)
- [ ] Border style dropdown
- [ ] `src/renderer/components/StyleEditor/EffectsControl.tsx`
- [ ] Shadow selector
- [ ] Opacity slider

---

### Milestone 6: Integration & Panel Assembly
**Duration:** 0.5 day  
**Confidence Target:** 8/10  
**Status:** 🔵 Not Started

#### Objective
Assemble all controls into the StylingEditor and integrate with manifest.

#### Deliverables
- [ ] Replace existing StylingEditor with new controls
- [ ] Collapsible category sections
- [ ] "Raw Classes" view (expandable, shows generated classes)
- [ ] Bidirectional sync working (existing classes → controls)
- [ ] Integration tests

---

### Milestone 7: Testing & Polish
**Duration:** 0.5 day  
**Confidence Target:** 9/10  
**Status:** 🔵 Not Started

#### Deliverables
- [ ] Comprehensive unit tests
- [ ] Visual regression tests
- [ ] Edge case handling
- [ ] Documentation
- [ ] Performance optimization

---

## 📊 Success Metrics

| Metric | Target | How to Verify |
|--------|--------|---------------|
| Spacing controls | Pad + Margin | UI functional |
| Color picker | bg/text/border | UI functional |
| Typography controls | size/weight/align | UI functional |
| Size controls | width/height | UI functional |
| Border controls | width/radius/style | UI functional |
| Bidirectional sync | Classes ↔ Controls | Load component with classes |
| Test coverage | >80% | Coverage report |

---

## 🚨 Risk Assessment

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| Tailwind class edge cases | Medium | Medium | Comprehensive parsing tests |
| UI complexity | Medium | Medium | Collapsible sections, clean design |
| Performance with many controls | Low | Low | Lazy rendering, memoization |
| Color picker accessibility | Medium | Low | Keyboard navigation, labels |

---

## ✅ Definition of Done

Task 3.6 is complete when:

1. [ ] All style control categories implemented
2. [ ] Bidirectional class ↔ control sync works
3. [ ] Controls generate valid Tailwind classes
4. [ ] Existing classes populate controls correctly
5. [ ] Raw class view available as fallback
6. [ ] All tests passing (>80% coverage)
7. [ ] Documentation complete
8. [ ] Human review approved

---

**Task Status:** 🔵 Not Started  
**Critical Path:** No - Enhancement task  
**Risk Level:** MEDIUM  
**User Impact:** HIGH - Major usability improvement

---

**Last Updated:** November 29, 2025  
**Document Version:** 1.0  
**Prepared By:** Claude (Planning)
