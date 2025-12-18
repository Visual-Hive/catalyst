# Task 4.6: Fix onClick Handler Wiring Bug

**Priority:** P0 - Critical  
**Status:** ✅ Completed  
**Phase:** Phase 4 - Micro Logic Editor  
**Related Task:** Task 4.4 - Event Binding & Code Generation  
**Created:** 2025-12-01  
**Completed:** 2025-12-01  
**Actual Duration:** 30 minutes  

---

## 🎯 Problem Statement

Clicking buttons in the preview did nothing - onClick handlers were being generated but not executed.

### Initial Symptoms

1. User adds onClick event in Logic Panel ✅
2. Flow is saved to manifest ✅
3. Component file regenerates ✅
4. App.jsx regenerates with handler code ✅
5. **BUT:** Button click does nothing ❌
6. **THEN:** Console shows "Ignored call to 'alert()'" error ❌

---

## 🔍 Root Cause Analysis

**THREE** separate issues were discovered:

### Bug 1: FileManager.findRootComponents() - Wrong Lookup Pattern

**File:** `src/core/filemanager/FileManager.ts`  
**Method:** `findRootComponents()`

The code was checking `component.events?.onClick?.flowId` which is **never populated**. In Rise's architecture, the event→flow relationship is stored on the **flow side**, not the component side:

```typescript
// ❌ WRONG - component.events is never populated
if (component.events?.onClick?.flowId && manifest.flows) {
  const flow = manifest.flows[component.events.onClick.flowId];
  ...
}

// ✅ CORRECT - flow.trigger stores the relationship
const onClickFlow = Object.values(manifest.flows).find(
  flow => flow.trigger.componentId === component.id && flow.trigger.type === 'onClick'
);
```

### Bug 2: ReactCodeGenerator.generateComponent() - Same Wrong Pattern

**File:** `src/core/codegen/ReactCodeGenerator.ts`  
**Method:** `generateComponent()`

Same issue - checking `component.events?.onClick?.flowId` instead of searching flows by `trigger.componentId`:

```typescript
// ❌ WRONG
const hasOnClickEvent = !!(component.events?.onClick?.flowId && manifest.flows?.[component.events.onClick.flowId]);

// ✅ CORRECT
let hasOnClickEvent = false;
if (manifest.flows) {
  const onClickFlow = Object.values(manifest.flows).find(
    flow => flow.trigger.componentId === component.id && flow.trigger.type === 'onClick'
  );
  hasOnClickEvent = !!onClickFlow;
}
```

### Bug 3: PreviewFrame.tsx - iframe sandbox blocking alert()

**File:** `src/renderer/components/Preview/PreviewFrame.tsx`

The iframe sandbox attribute didn't include `allow-modals`, which blocked `alert()`, `confirm()`, and `prompt()` calls:

```typescript
// ❌ BEFORE
sandbox="allow-scripts allow-same-origin allow-forms"

// ✅ AFTER
sandbox="allow-scripts allow-same-origin allow-forms allow-modals"
```

---

## 🛠️ Solutions Applied

### Fix 1: FileManager.ts

Updated `findRootComponents()` to search flows by `trigger.componentId`:

```typescript
// Task 4.6: Fixed - flow relationship is stored in flow.trigger, not component.events
// Search through flows to find any that target this component
let onClickFlow = null;
if (manifest.flows) {
  onClickFlow = Object.values(manifest.flows).find(
    flow => flow.trigger.componentId === component.id && flow.trigger.type === 'onClick'
  );
}

if (onClickFlow) {
  // Use FlowCodeGenerator to ensure handler names match
  const flowCodeGen = new FlowCodeGenerator();
  info.onClickHandler = flowCodeGen.generateHandlerName(onClickFlow);
}
```

### Fix 2: ReactCodeGenerator.ts

Updated `generateComponent()` to search flows by `trigger.componentId`:

```typescript
// Check if component has onClick event binding (Level 1.5 - Task 4.4 / Task 4.6 fix)
// NOTE: The relationship is stored in flow.trigger.componentId, NOT in component.events
let hasOnClickEvent = false;
if (manifest.flows) {
  const onClickFlow = Object.values(manifest.flows).find(
    flow => flow.trigger.componentId === component.id && flow.trigger.type === 'onClick'
  );
  hasOnClickEvent = !!onClickFlow;
}
```

### Fix 3: PreviewFrame.tsx

Added `allow-modals` to both iframe sandbox attributes (responsive and device viewport modes):

```typescript
// Responsive mode iframe
sandbox="allow-scripts allow-same-origin allow-forms allow-modals"

// Device viewport mode iframe  
sandbox="allow-scripts allow-same-origin allow-forms allow-modals"
```

---

## 📋 Files Modified

| File | Change | Lines |
|------|--------|-------|
| `src/core/filemanager/FileManager.ts` | Fixed flow lookup in `findRootComponents()` | ~575-600 |
| `src/core/codegen/ReactCodeGenerator.ts` | Fixed flow lookup in `generateComponent()` | ~155-170 |
| `src/renderer/components/Preview/PreviewFrame.tsx` | Added `allow-modals` to sandbox | ~175, ~235 |

---

## 🧪 Testing Verification

### Test 1: Basic onClick → Alert
1. Create a button component
2. Add onClick event binding
3. Add Alert node with message "Test"
4. Click button in preview
5. **Result:** ✅ Alert dialog shows "Test"

### Test 2: onClick → Console.log
1. Create button with onClick
2. Add Console node with message "Clicked!"
3. Click button in preview
4. **Result:** ✅ Console shows "Clicked!"

### Test 3: Multiple Actions
1. Create button with onClick
2. Add Alert → Console → Alert sequence
3. Click button
4. **Result:** ✅ All actions execute in order

---

## 📝 Key Learnings

### Architectural Insight

In Rise's manifest structure, event bindings are stored **uni-directionally** from the flow side:

```json
{
  "flows": {
    "flow-1": {
      "trigger": {
        "type": "onClick",
        "componentId": "button-1"  // ← Relationship stored HERE
      }
    }
  },
  "components": {
    "button-1": {
      // NO events field - relationship is on flow side
    }
  }
}
```

This means when finding flows for a component, you must **search flows by trigger.componentId**, not look up flows from the component.

### Why This Pattern?

- **Flexibility:** A component can have multiple flows for the same event
- **Decoupling:** Components don't need to know about flows (one-way dependency)
- **Simplicity:** Flow is the source of truth for event→action relationships

### Code Pattern to Use

```typescript
// ✅ CORRECT PATTERN for finding flows by component
function findFlowsForComponent(manifest: Manifest, componentId: string, eventType: string) {
  if (!manifest.flows) return [];
  
  return Object.values(manifest.flows).filter(
    flow => flow.trigger.componentId === componentId && 
            flow.trigger.type === eventType
  );
}
```

---

## ✅ Success Criteria

- [x] onClick handlers are passed to components as props in App.jsx
- [x] Clicking buttons in preview triggers handlers
- [x] Alert dialogs display correctly
- [x] Console logs appear correctly
- [x] No console errors when clicking buttons
- [x] Multiple components with onClick work simultaneously

---

## 🔗 Related Tasks

- **Task 4.4:** Event Binding & Code Generation (original implementation)
- **Task 4.5:** Integration Polish (cleanup and refinement)
- **Phase 1, Task 1.4B:** Preview Panel UI (iframe security)

---

**Last Updated:** 2025-12-01  
**Document Version:** 2.0  
**Status:** ✅ Completed
