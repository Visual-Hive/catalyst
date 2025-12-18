# Task 3.4: Bug Fixes - AI Component Preview & FileTree

**Phase:** Phase 3 - Code Generation & Preview  
**Duration Estimate:** 2-4 hours  
**Status:** ✅ Bug 1 Fixed, Bug 2 Logging Added  
**Assigned:** Cline + Human Review  
**Priority:** P1 - Important  
**Dependencies:** Task 3.3 (Live Preview) ✅  
**Started:** 2025-11-28  
**Last Updated:** 2025-11-28

---

## 🎯 Task Overview

### Objective

Fix two bugs discovered during Task 3.3 testing:
1. **Bug 1**: AI-generated components render empty JSX (no visible content)
2. **Bug 2**: FileTree cannot expand the `src/components/` directory

### Bug Summary Table

| Bug | Severity | Root Cause | Fix Location |
|-----|----------|------------|--------------|
| Empty AI Component JSX | High | JSXBuilder only looks for specific text props | AIComponentGenerator + JSXBuilder |
| FileTree expansion | Medium | Unknown - needs investigation | FileTree.tsx |

---

## 🐛 Bug 1: AI-Generated Components Render Empty JSX

### Symptom

When the AI generates a component like "UserCard", the generated JSX file has an empty div:

```jsx
// Generated usercard.jsx
export function UserCard({
  avatarUrl = 'https://via.placeholder.com/64',
  userEmail = 'john.doe@example.com',
  userName = 'John Doe',
}) {
  return (
    <div className="p-6 bg-white rounded-lg shadow-md border max-w-sm"></div>
  );  // ← EMPTY! Props are never used
}
```

### Root Cause Analysis

**JSXBuilder.ts** (`src/core/codegen/JSXBuilder.ts`):

The `buildChildren()` method only renders content if:
1. `component.children[]` has child component IDs, OR
2. A text prop exists named exactly: `children`, `label`, `text`, or `content`

```typescript
// Line 182-189 in JSXBuilder.ts
private findTextContentProp(component: Component): { name: string; prop: ComponentProperty } | null {
  const textProps = ['children', 'label', 'text', 'content'];
  
  for (const propName of textProps) {
    if (propName in properties) {
      return { name: propName, prop: properties[propName] };
    }
  }
  return null;  // ← Returns null for avatarUrl, userName, etc.
}
```

**AIComponentGenerator.ts** (`src/main/ai/AIComponentGenerator.ts`):

The AI prompt doesn't explicitly require a `text` or `label` prop for visible content. The example shows one, but the AI generates custom prop names instead.

### Solution Strategy

**Two-pronged fix:**

1. **Update AI Prompt** - Explicitly instruct the AI to use `text` or `label` props for visible content
2. **Add JSXBuilder Fallback** - If no text prop found, use the first string prop as fallback text

### Implementation Plan

#### Step 1: Update AI Prompt Template

In `src/main/ai/AIComponentGenerator.ts`, update the `buildPrompt()` method to add clearer instructions:

```typescript
// Add to the prompt:
IMPORTANT FOR VISIBLE CONTENT:
- If the component should display any text, you MUST include a "text" property
- Use "text" for the primary text content that will be visible
- Other props like "userName", "email", etc. can be used as inputs, but include a "text" prop with default value like:
  "text": {
    "type": "prop",
    "dataType": "string",
    "default": "Hello World"
  }
```

#### Step 2: Add JSXBuilder Fallback

In `src/core/codegen/JSXBuilder.ts`, add a fallback in `buildChildren()`:

```typescript
// If no text prop found, fall back to first string prop
if (!textContentProp) {
  const fallbackProp = this.findFallbackTextProp(component);
  if (fallbackProp) {
    textContentProp = fallbackProp;
  }
}
```

---

## 🐛 Bug 2: FileTree Cannot Expand Components Folder

### Symptom

User cannot click to expand the `src/components/` folder in the FileTree, even though files exist inside it (confirmed via Finder).

### Root Cause Analysis

**Suspected causes:**

1. **IPC handler issue** - `loadDirectory()` may be returning empty array
2. **Path encoding** - Generated paths might have encoding issues
3. **State update timing** - `childrenMap` not updating reactively

### Investigation Steps

1. Add console logging to `handleToggle`:
   ```typescript
   console.log('[FileTree] Toggle:', node.path, 'isDirectory:', node.isDirectory);
   ```

2. Add logging to `loadDirectory`:
   ```typescript
   console.log('[FileTree] loadDirectory result:', dirPath, result);
   ```

3. Check IPC handler response for components folder

### Solution Strategy

Once root cause identified, fix appropriately:
- If IPC issue: Fix in `electron/ipc-handlers.ts`
- If state issue: Fix in `FileTree.tsx` state management
- If path issue: Fix path handling

---

## 📋 Implementation Checklist

### Bug 1: Empty JSX Fix ✅ VERIFIED COMPLETE

- [x] Update AI prompt to require `text` prop for visible content
- [x] Add `findFallbackTextProp()` method to JSXBuilder
- [x] Update `buildChildren()` to use fallback
- [x] Test AI generation produces visible content ✅

**Verification Result (2025-11-28):**
```jsx
// AI now generates:
text = 'John Doe',
// ...
return (
  <div className="...">
    {text}   // ← Text now renders!
  </div>
);
```

### Bug 2: FileTree Fix - Logging Added

- [x] Add diagnostic logging to `handleToggle` and `loadDirectory`
- [ ] User to test and share console output
- [ ] Identify root cause from logs
- [ ] Implement fix based on findings
- [ ] Test folder expansion

### Verification

- [ ] AI-generated components show content in preview
- [ ] FileTree can expand all folders
- [ ] No console errors during normal operation

---

## 🎯 Success Criteria

1. AI-generated components display visible content in preview
2. FileTree can expand `src/components/` folder
3. No regressions in existing functionality
4. Console is clean during normal operation

---

## 📁 Files to Modify

| File | Changes |
|------|---------|
| `src/main/ai/AIComponentGenerator.ts` | Update prompt template |
| `src/core/codegen/JSXBuilder.ts` | Add fallback text prop logic |
| `src/renderer/components/FileTree/FileTree.tsx` | Add logging, fix issue |

---

## ✅ Implementation Notes (2025-11-28)

### Bug 1 Changes Made

**File: `src/main/ai/AIComponentGenerator.ts`**
- Added clear instruction in AI prompt requiring `text` property for visible content
- Added example showing proper `text` prop format

**File: `src/core/codegen/JSXBuilder.ts`**  
- Added `findFallbackTextProp()` method that looks for:
  1. Props with 'name' or 'title' in the name (e.g., `userName`, `displayName`)
  2. Any string prop as last resort
- Modified `findTextContentProp()` to call fallback when standard props not found

### Bug 2 Changes Made

**File: `src/renderer/components/FileTree/FileTree.tsx`**
- Added console logging to `handleToggle` with path, name, isDirectory
- Added console logging to `loadDirectory` with result details
- This will help diagnose why components folder won't expand

### Testing Instructions

1. **For Bug 1**: Generate a new AI component and check:
   - Does it now include a `text` prop?
   - If not, does a userName-like prop display in preview?

2. **For Bug 2**: Try to expand the components folder and share:
   - Console log output from `[FileTree]` entries
   - Whether expansion succeeds or fails

---

**Document Version:** 1.1  
**Created:** 2025-11-28  
**Updated:** 2025-11-28
