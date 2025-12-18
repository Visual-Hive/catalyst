# Task 3.7: Enhanced AI Generation

**Phase:** Phase 3 - Code Generation & Preview (Extended)  
**Duration Estimate:** 2-3 days  
**Actual Duration:** [To be filled when complete]  
**Status:** 🟢 Complete  
**Assigned:** AI + Human Review  
**Started:** 2025-11-29  
**Completed:** 2025-11-29  

---

## Task Overview

### Objective
Enhance the AI component generation system to produce visually complete, well-structured components that match user expectations - not minimal proof-of-concept stubs.

### Problem Statement
Currently, when a user asks for a "header bar with menu items," the AI generates:
- A single component with minimal structure
- Basic or no styling
- Single text element instead of proper layout
- Missing visual hierarchy

The result is visually underwhelming and doesn't demonstrate Rise's capabilities. Users see a single line of text instead of a proper header with navigation items.

### Solution
Improve the AI prompt template and response processing to:
1. Generate complete component hierarchies (parent + children)
2. Include comprehensive Tailwind styling
3. Create proper HTML structure for common UI patterns
4. Use realistic default content
5. Apply component templates from Task 3.5

### What This IS NOT
- ❌ Adding Level 2 features (events, state, interactivity)
- ❌ Making components functional/interactive
- ❌ Breaking schema restrictions

### What This IS
- ✅ Better visual output within Level 1 constraints
- ✅ Richer component structures
- ✅ More complete styling
- ✅ Child component generation
- ✅ Realistic placeholder content

### Success Criteria
- [ ] AI generates visually complete components
- [ ] Header requests produce multi-element layouts
- [ ] Form requests produce labeled inputs with structure
- [ ] Card requests produce proper card layouts
- [ ] All generated components remain Level 1 compliant
- [ ] Generated components use component templates (Task 3.5)
- [ ] Styling is comprehensive and professional
- [ ] Test coverage >80%
- [ ] Human review completed

### References
- `.implementation/phase-2-component-management/task-2.4-AI-component-generation.md`
- `src/main/ai/AIComponentGenerator.ts` - Current implementation
- `docs/SCHEMA_LEVELS.md` - Level 1 restrictions
- Task 3.5: Component Property Templates

### Dependencies
- ✅ Task 2.4: AI Component Generation (Complete)
- ⚠️ Recommended after Task 3.5 (use templates in generation)

---

## 🎯 Problem Analysis

### Current AI Output (Example)

**User Request:** "Create a header with logo and navigation menu"

**Current Output:**
```json
{
  "id": "comp_header_001",
  "type": "container",
  "displayName": "Header",
  "properties": {
    "content": {
      "type": "static",
      "dataType": "string",
      "value": "Header"
    }
  },
  "styling": {
    "baseClasses": ["flex", "items-center"]
  },
  "children": []
}
```

**Visual Result:** A single word "Header" with basic flex styling. Disappointing.

### Desired AI Output

**Same Request:** "Create a header with logo and navigation menu"

**Improved Output:**
```json
{
  "id": "comp_header_001",
  "type": "container",
  "displayName": "Header",
  "properties": {},
  "styling": {
    "baseClasses": [
      "w-full", "px-6", "py-4",
      "bg-white", "border-b", "border-gray-200",
      "flex", "items-center", "justify-between"
    ]
  },
  "children": [
    {
      "id": "comp_logo_001",
      "type": "container",
      "displayName": "Logo",
      "properties": {},
      "styling": {
        "baseClasses": ["flex", "items-center", "gap-2"]
      },
      "children": [
        {
          "id": "comp_logo_icon_001",
          "type": "text",
          "displayName": "LogoIcon",
          "properties": {
            "content": { "type": "static", "value": "🚀" }
          },
          "styling": { "baseClasses": ["text-2xl"] }
        },
        {
          "id": "comp_logo_text_001",
          "type": "text",
          "displayName": "LogoText",
          "properties": {
            "content": { "type": "static", "value": "Acme Corp" }
          },
          "styling": { "baseClasses": ["text-xl", "font-bold", "text-gray-800"] }
        }
      ]
    },
    {
      "id": "comp_nav_001",
      "type": "container",
      "displayName": "Navigation",
      "properties": {},
      "styling": {
        "baseClasses": ["flex", "items-center", "gap-6"]
      },
      "children": [
        {
          "id": "comp_nav_item_001",
          "type": "link",
          "displayName": "NavHome",
          "properties": {
            "text": { "type": "static", "value": "Home" },
            "href": { "type": "static", "value": "#" }
          },
          "styling": { "baseClasses": ["text-gray-600", "hover:text-gray-900", "font-medium"] }
        },
        {
          "id": "comp_nav_item_002",
          "type": "link",
          "displayName": "NavProducts",
          "properties": {
            "text": { "type": "static", "value": "Products" },
            "href": { "type": "static", "value": "#" }
          },
          "styling": { "baseClasses": ["text-gray-600", "hover:text-gray-900", "font-medium"] }
        },
        {
          "id": "comp_nav_item_003",
          "type": "link",
          "displayName": "NavAbout",
          "properties": {
            "text": { "type": "static", "value": "About" },
            "href": { "type": "static", "value": "#" }
          },
          "styling": { "baseClasses": ["text-gray-600", "hover:text-gray-900", "font-medium"] }
        },
        {
          "id": "comp_nav_item_004",
          "type": "link",
          "displayName": "NavContact",
          "properties": {
            "text": { "type": "static", "value": "Contact" },
            "href": { "type": "static", "value": "#" }
          },
          "styling": { "baseClasses": ["text-gray-600", "hover:text-gray-900", "font-medium"] }
        }
      ]
    },
    {
      "id": "comp_cta_001",
      "type": "button",
      "displayName": "CTAButton",
      "properties": {
        "label": { "type": "static", "value": "Get Started" }
      },
      "styling": {
        "baseClasses": [
          "px-4", "py-2",
          "bg-blue-600", "text-white",
          "rounded-lg", "font-medium",
          "hover:bg-blue-700"
        ]
      }
    }
  ]
}
```

**Visual Result:** A proper header with logo, navigation items, and CTA button. Professional.

---

## 🎯 Design Specification

### Enhanced Prompt Template

```typescript
// src/main/ai/promptTemplates.ts

export const ENHANCED_COMPONENT_PROMPT = `You are a React component architect for Rise, a visual low-code builder.
Generate a VISUALLY COMPLETE component schema based on the user's request.

USER REQUEST:
{userPrompt}

CONTEXT:
- Framework: React
- Schema Level: 1 (MVP - static properties only, NO events/state)
- Available component types: container, text, button, image, link, input, card
- Styling: Tailwind CSS classes

CRITICAL REQUIREMENTS:

1. VISUAL COMPLETENESS:
   - Create FULL component hierarchies, not minimal stubs
   - Include child components for complex layouts
   - Use realistic placeholder content (names, text, etc.)
   - Apply comprehensive Tailwind styling for a polished look

2. COMPONENT STRUCTURE PATTERNS:
   
   For HEADERS:
   - Container with flex justify-between
   - Logo section (icon + text)
   - Navigation container with link children
   - Optional CTA button
   
   For CARDS:
   - Container with padding, shadow, rounded
   - Image at top (if requested)
   - Title (h3), description (p), metadata
   - Optional action buttons
   
   For FORMS:
   - Container with vertical stack (flex-col gap)
   - Each field: label + input grouped
   - Submit button at bottom
   
   For LISTS:
   - Container with gap spacing
   - Multiple list item children
   - At least 3-4 realistic items

3. STYLING GUIDELINES:
   - Always include: layout classes (flex, grid), spacing (p-*, m-*, gap-*)
   - Colors: Use Tailwind color palette (gray-*, blue-*, etc.)
   - Typography: text-*, font-*, leading-*
   - Borders: border, border-*, rounded-*
   - Shadows: shadow-*, for cards and buttons
   - Hover states: hover:* classes where appropriate

4. REALISTIC CONTENT:
   - Use believable placeholder text, not "Lorem ipsum"
   - Names like "John Smith", "Acme Corp", "Product Alpha"
   - Prices like "$99.00", dates like "March 15, 2024"
   - Action text like "Learn More", "Get Started", "Contact Us"

5. LEVEL 1 RESTRICTIONS (MUST FOLLOW):
   ❌ NO onClick, onChange, or any event handlers
   ❌ NO useState, expressions, or dynamic values
   ❌ NO conditional rendering logic
   ✅ Only static values and props
   ✅ Styling-based hover states are OK (hover: classes)

OUTPUT FORMAT:
Return a valid JSON object with this structure:
{
  "id": "comp_[descriptive]_001",
  "type": "container|text|button|image|link|input|card",
  "displayName": "PascalCaseName",
  "properties": {
    "propName": {
      "type": "static",
      "dataType": "string|number|boolean",
      "value": "actual value"
    }
  },
  "styling": {
    "baseClasses": ["array", "of", "tailwind", "classes"]
  },
  "children": [
    // Nested components with same structure
  ]
}

IMPORTANT: Respond ONLY with valid JSON. No markdown, no explanation, just the JSON object.`;
```

### UI Pattern Library (Embedded in Prompt)

Include examples of common patterns directly in the prompt for reference:

```typescript
export const UI_PATTERN_EXAMPLES = {
  header: `
Example header structure:
- Container (flex, justify-between, items-center, px-6, py-4, bg-white, border-b)
  - Logo container (flex, items-center, gap-2)
    - Logo icon (text-2xl)
    - Logo text (text-xl, font-bold)
  - Nav container (flex, gap-6)
    - Link items (text-gray-600, hover:text-gray-900)
  - CTA button (px-4, py-2, bg-blue-600, text-white, rounded-lg)
`,

  card: `
Example card structure:
- Container (bg-white, rounded-lg, shadow-md, overflow-hidden)
  - Image (w-full, h-48, object-cover)
  - Content container (p-4)
    - Title (text-lg, font-semibold, text-gray-800)
    - Description (text-sm, text-gray-600, mt-2)
    - Footer (flex, justify-between, items-center, mt-4)
      - Price (text-lg, font-bold, text-blue-600)
      - Button (px-3, py-1, bg-blue-600, text-white, rounded)
`,

  form: `
Example form structure:
- Container (flex, flex-col, gap-4, max-w-md)
  - Field group (flex, flex-col, gap-1)
    - Label (text-sm, font-medium, text-gray-700)
    - Input (w-full, px-3, py-2, border, rounded-md)
  - Repeat for each field...
  - Submit button (w-full, py-2, bg-blue-600, text-white, rounded-md, font-medium)
`,

  list: `
Example list structure:
- Container (flex, flex-col, gap-3)
  - List item (flex, items-center, gap-3, p-3, bg-white, rounded-lg, shadow-sm)
    - Icon/avatar (w-10, h-10, rounded-full, bg-gray-200)
    - Content (flex-1)
      - Title (font-medium)
      - Subtitle (text-sm, text-gray-500)
    - Action (text-blue-600)
`,
};
```

---

## 🗺️ Implementation Roadmap

### Milestone 1: Enhanced Prompt Template
**Duration:** 0.5 day  
**Confidence Target:** 8/10  
**Status:** 🔵 Not Started

#### Deliverables
- [ ] `src/main/ai/promptTemplates.ts` - New enhanced prompt
- [ ] UI pattern examples embedded
- [ ] Context-aware prompt building
- [ ] Unit tests for prompt generation

#### Code Changes

**Create `src/main/ai/promptTemplates.ts`**
```typescript
/**
 * @file promptTemplates.ts
 * @description Enhanced prompt templates for AI component generation
 */

import { GenerationContext } from './types';

/**
 * Build the enhanced prompt for component generation
 */
export function buildEnhancedPrompt(
  userPrompt: string,
  context: GenerationContext
): string {
  // Detect what kind of component is being requested
  const componentType = detectRequestedType(userPrompt);
  
  // Get relevant pattern example
  const patternHint = UI_PATTERN_EXAMPLES[componentType] || '';
  
  // Build full prompt
  return ENHANCED_COMPONENT_PROMPT
    .replace('{userPrompt}', userPrompt)
    .replace('{patternHint}', patternHint)
    .replace('{existingComponents}', formatExistingComponents(context));
}

/**
 * Detect the type of component being requested
 */
function detectRequestedType(prompt: string): string {
  const lower = prompt.toLowerCase();
  
  if (lower.includes('header') || lower.includes('navbar') || lower.includes('navigation')) {
    return 'header';
  }
  if (lower.includes('card') || lower.includes('tile')) {
    return 'card';
  }
  if (lower.includes('form') || lower.includes('input') || lower.includes('signup') || lower.includes('login')) {
    return 'form';
  }
  if (lower.includes('list') || lower.includes('items') || lower.includes('menu')) {
    return 'list';
  }
  if (lower.includes('hero') || lower.includes('banner')) {
    return 'hero';
  }
  if (lower.includes('footer')) {
    return 'footer';
  }
  
  return 'generic';
}
```

---

### Milestone 2: Response Processing Improvements
**Duration:** 0.5 day  
**Confidence Target:** 8/10  
**Status:** 🔵 Not Started

#### Objective
Improve how AI responses are parsed and validated to handle nested structures.

#### Deliverables
- [ ] Enhanced JSON parsing with nested component support
- [ ] Recursive ID generation for children
- [ ] Styling validation and enhancement
- [ ] Component type validation against templates

#### Code Changes

**Modify `src/main/ai/AIComponentGenerator.ts`**
```typescript
/**
 * Parse AI response and process nested components
 */
private parseResponse(responseText: string, context: GenerationContext): Component {
  // Extract JSON from response
  const jsonMatch = responseText.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('No valid JSON found in AI response');
  }
  
  const parsed = JSON.parse(jsonMatch[0]);
  
  // Process recursively to handle nested children
  return this.processComponent(parsed, context, 0);
}

/**
 * Process a component and its children recursively
 */
private processComponent(
  raw: any,
  context: GenerationContext,
  depth: number
): Component {
  // Validate depth limit
  if (depth > 5) {
    throw new Error('Component nesting exceeds maximum depth (5)');
  }
  
  // Generate unique ID if not provided or invalid
  const id = this.ensureValidId(raw.id, raw.displayName || raw.type);
  
  // Ensure proper property structure
  const properties = this.normalizeProperties(raw.properties || {});
  
  // Enhance styling if sparse
  const styling = this.enhanceStyling(raw.styling, raw.type);
  
  // Process children recursively
  const children = (raw.children || []).map((child: any) =>
    this.processComponent(child, context, depth + 1)
  );
  
  return {
    id,
    type: raw.type || 'container',
    displayName: raw.displayName || this.generateDisplayName(raw.type),
    properties,
    styling,
    children,
    metadata: {
      created: new Date().toISOString(),
      modified: new Date().toISOString(),
      generatedBy: 'ai',
    },
  };
}

/**
 * Enhance styling if AI provided minimal classes
 */
private enhanceStyling(
  styling: any,
  componentType: string
): ComponentStyling {
  const baseClasses = styling?.baseClasses || [];
  
  // If too few classes, add sensible defaults based on type
  if (baseClasses.length < 3) {
    const defaults = this.getDefaultStyling(componentType);
    return {
      baseClasses: [...new Set([...defaults, ...baseClasses])],
    };
  }
  
  return { baseClasses };
}

/**
 * Get default styling for component types
 */
private getDefaultStyling(type: string): string[] {
  const defaults: Record<string, string[]> = {
    container: ['flex', 'flex-col'],
    button: ['px-4', 'py-2', 'bg-blue-600', 'text-white', 'rounded-lg', 'font-medium'],
    text: ['text-gray-800'],
    card: ['bg-white', 'rounded-lg', 'shadow-md', 'p-4'],
    input: ['w-full', 'px-3', 'py-2', 'border', 'border-gray-300', 'rounded-md'],
    image: ['max-w-full', 'h-auto'],
    link: ['text-blue-600', 'hover:underline'],
  };
  
  return defaults[type] || [];
}
```

---

### Milestone 3: Template Integration
**Duration:** 0.5 day  
**Confidence Target:** 8/10  
**Status:** 🔵 Not Started

#### Objective
Use component templates from Task 3.5 to enhance AI-generated properties.

#### Deliverables
- [ ] Integrate TemplateRegistry into AI generator
- [ ] Apply template properties to generated components
- [ ] Merge AI-provided properties with template defaults
- [ ] Integration tests

---

### Milestone 4: Quality Improvements
**Duration:** 0.5 day  
**Confidence Target:** 9/10  
**Status:** 🔵 Not Started

#### Objective
Add validation, error recovery, and quality checks.

#### Deliverables
- [ ] Response quality scoring
- [ ] Retry logic for poor responses
- [ ] Fallback to simpler generation on failure
- [ ] Metrics/logging for generation quality

---

### Milestone 5: Testing & Examples
**Duration:** 0.5 day  
**Confidence Target:** 9/10  
**Status:** 🔵 Not Started

#### Deliverables
- [ ] Test fixtures for common prompts
- [ ] Visual comparison tests (generated vs expected)
- [ ] Update documentation with examples
- [ ] Create showcase of AI-generated components

---

## 📊 Test Cases

### Before/After Comparisons

| Prompt | Before | After |
|--------|--------|-------|
| "Create a header with logo and navigation" | Single text element | Full header with logo, nav links, CTA |
| "Make a contact form" | Empty container | Form with name, email, message inputs + submit |
| "Product card with image and price" | Basic card shape | Complete card with image, title, description, price, button |
| "User profile section" | Single text | Avatar, name, email, bio, edit button |
| "Footer with links" | Single row | Multi-column footer with sections |

### Validation Criteria

Each generated component must:
- [ ] Have at least 3 Tailwind classes
- [ ] Use appropriate component types
- [ ] Include realistic placeholder content
- [ ] Create children when logically required
- [ ] Remain Level 1 compliant (no events/state)

---

## 📊 Success Metrics

| Metric | Target | How to Verify |
|--------|--------|---------------|
| Visual completeness | Looks "real" | Manual inspection |
| Child components | Generated when appropriate | Structure inspection |
| Styling depth | 5+ classes avg | Count classes |
| Realistic content | No "Lorem ipsum" | Content inspection |
| Level 1 compliance | 100% | Validation check |
| User satisfaction | Positive feedback | User testing |

---

## 🚨 Risk Assessment

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| AI ignores prompt | High | Medium | Explicit instructions, examples |
| Token cost increase | Medium | High | Accept increased cost for quality |
| Inconsistent output | Medium | Medium | Quality scoring, retry logic |
| Over-generation | Low | Medium | Depth limits, size limits |

---

## ✅ Definition of Done

Task 3.7 is complete when:

1. [ ] Enhanced prompt template implemented
2. [ ] Nested component generation working
3. [ ] Common UI patterns generate correctly
4. [ ] Styling is comprehensive
5. [ ] Content is realistic
6. [ ] Level 1 compliance maintained
7. [ ] All tests passing (>80% coverage)
8. [ ] Before/after examples documented
9. [ ] Human review approved

---

**Task Status:** 🔵 Not Started  
**Critical Path:** No - Enhancement task  
**Risk Level:** MEDIUM  
**User Impact:** VERY HIGH - Makes AI generation actually useful

---

**Last Updated:** November 29, 2025  
**Document Version:** 1.0  
**Prepared By:** Claude (Planning)
