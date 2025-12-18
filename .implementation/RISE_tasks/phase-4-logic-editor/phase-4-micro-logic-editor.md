# Phase 4: Micro Logic Editor (Quick Logic MVP)

**Phase:** Phase 4 - Interactive Logic  
**Schema Level:** 1.5 (Between MVP and Level 2)  
**Duration Estimate:** 3-4 weeks  
**Status:** 🟡 In Progress  
**Priority:** P1 - Critical for MVP interactivity

---

## 🎯 Phase Overview

Phase 4 adds **Quick Logic** capability to Rise - a fast, intuitive way to add simple interactivity to components without the complexity of a full logic system. This is a carefully scoped addition that brings Rise from "static visual builder" to "interactive application builder" while maintaining the MVP timeline.

**What Quick Logic Is:**
- Fast, throwaway logic attached directly to component triggers
- Signal-based execution flow (inspired by Noodl) - explicit control over when nodes run
- JSON output system (inspired by n8n) - clean data references between nodes
- Perfect for button clicks, form validation, simple interactions
- Visual node-based canvas using React Flow
- No ceremony - just click ⚡ and add nodes

**What Quick Logic Is NOT:**
- Reusable workflows (that's Level 2)
- Complex business logic (that's Level 2)
- Full expression system (that's Level 2)

### Key Architectural Decisions

**1. Signal-Based Execution (Noodl-inspired)**
- Every node has `run`, `done`, and `failed` signal ports
- You explicitly wire signals to control execution order
- Much better than implicit top-to-bottom execution (n8n's approach)

**2. JSON Output System (n8n-inspired)**
- Every node outputs: `{ json: {...}, binary: null }`
- Later nodes reference: `$('NodeName').json.propertyName`
- Cleaner than individual property connectors (Noodl's approach)

**3. Component Property Access**
- Get Component Property node reads values from sibling components
- Gives Noodl's directness without requiring a global canvas
- Perfect for form validation, conditional logic

See **[LOGIC_PATTERNS.md](../docs/LOGIC_PATTERNS.md)** for complete explanation of Quick Logic vs Reusable Workflows.

---

---

> ⚠️ **MVP Implementation Notes**
>
> Phase 4 uses simplified implementations that will be improved in Level 2:
>
> **DOM Queries for Component Access**  
> The `Get Component Property` node currently uses `document.getElementById()` to read component values. This works but breaks React's mental model. Level 2 will implement proper React patterns using refs or a component registry.
>
> **Binary Field Reserved**  
> Every node outputs `{ json: {...}, binary: null }`. The `binary` field is reserved for future file/image handling (Level 3) and is always `null` in Phase 4 and Level 2.
>
> These shortcuts are intentional trade-offs to ship a working MVP faster. The architecture supports upgrading these implementations without breaking user flows.

---

## 📋 Scope Definition

### ✅ In Scope (Phase 4)

**Trigger:**
- ✅ onClick events ONLY
- ✅ Attached directly to button/clickable components

**Nodes (4 types):**
1. ✅ **Get Component Property** - Read values from other components
2. ✅ **SetState** - Update page-level state variables  
3. ✅ **Alert** - Show browser alert dialog
4. ✅ **Console** - Log to browser console

**Canvas:**
- ✅ React Flow visual editor
- ✅ Signal-based execution (run → done → failed)
- ✅ JSON output references `$('NodeName').json.property`
- ✅ Drag-and-drop node placement
- ✅ Wire nodes together
- ✅ Auto-save to manifest
- ✅ Live preview via HMR

**Data Access:**
- ✅ Component properties (via Get Component Property node)
- ✅ Page-level state (via SetState node)
- ✅ Static values only (no expressions)

**UI Integration:**
- ✅ ⚡ icon on components with logic
- ✅ Click to open logic canvas
- ✅ Visual feedback when logic executes

### ❌ Out of Scope (Deferred to Level 2)

**Events:**
- ❌ onChange, onEnter, onBlur, onFocus
- ❌ Page load triggers
- ❌ Timer triggers
- ❌ Custom events

**Logic Nodes:**
- ❌ If/Else conditionals
- ❌ Switch/Case
- ❌ Loop/Map
- ❌ HTTP Request (API calls)
- ❌ Navigate (routing)
- ❌ Show Toast
- ❌ Call Workflow (reusable workflows)
- ❌ Any Level 2+ nodes

**Data & Expressions:**
- ❌ Expression evaluation `{{ state.value + 1 }}`
- ❌ Computed properties
- ❌ Global functions
- ❌ App-level state (only page-level)

**Workflows:**
- ❌ Named, reusable workflows
- ❌ Workflow inputs/outputs
- ❌ Call Workflow node
- ❌ Workflow scoping (app/page/component)
- ❌ Extract to Workflow refactoring

---

## 🎨 User Experience

### Creating Quick Logic

```
1. User adds a button to the page
   ↓
2. User clicks the ⚡ icon next to the button in Navigator
   ↓
3. Logic canvas opens (React Flow)
   ↓
4. User drags nodes from palette:
   - Get Component Property (read email input value)
   - SetState (store form data)
   - Alert (show confirmation)
   ↓
5. User connects nodes with wires
   ↓
6. Canvas auto-saves to manifest
   ↓
7. User clicks button in preview → logic executes!
```

### Example: Simple Form Validation

**Visual Setup:**
- Email input field
- "Accept terms" checkbox  
- Submit button

**Logic Flow (Signal-Based):**
```
[Submit Button onClick] ──(run)──→ [Get Component Property: email]
                                         │
                                    (done)──→ [Get Component Property: checkbox]
                                                   │
                                              (done)──→ [SetState: formData]
                                                             │
                                                        (done)──→ [Alert: "Submitted!"]
```

**Signal Flow:**
1. Button click triggers first node's `run` signal
2. Get email `done` → triggers Get checkbox `run`
3. Get checkbox `done` → triggers SetState `run`
4. SetState `done` → triggers Alert `run`

**Data Flow (JSON outputs):**
```javascript
node_001: { json: { value: "user@example.com" }, binary: null }
node_002: { json: { checked: true }, binary: null }

// SetState references previous outputs
formData = {
  email: $('node_001').json.value,
  termsAccepted: $('node_002').json.checked
}
```

**What Happens:**
1. User clicks Submit button
2. First node runs → reads email → outputs JSON
3. `done` signal fires → second node runs → reads checkbox → outputs JSON
4. `done` signal fires → SetState runs, referencing both previous JSONs
5. `done` signal fires → Alert runs
6. Preview updates to show new state

**No Code Written - 100% Visual!**

---

## 🏗️ Technical Architecture

### Manifest Structure

```json
{
  "pages": {
    "login": {
      "state": {
        "formData": {
          "type": "object",
          "default": { "email": "", "termsAccepted": false }
        }
      },
      
      "components": {
        "comp_submit_button": {
          "type": "button",
          "properties": {
            "label": { "type": "static", "value": "Submit" }
          },
          
          "logicFlows": {
            "handleClick": {
              "id": "flow_001",
              "trigger": {
                "type": "componentEvent",
                "componentId": "comp_submit_button",
                "event": "onClick"
              },
              "nodes": [
                {
                  "id": "node_001",
                  "type": "getComponentProperty",
                  "config": {
                    "componentId": "comp_email_input",
                    "property": "value"
                  },
                  "position": { "x": 100, "y": 100 }
                },
                {
                  "id": "node_002",
                  "type": "getComponentProperty",
                  "config": {
                    "componentId": "comp_checkbox",
                    "property": "checked"
                  },
                  "position": { "x": 300, "y": 100 }
                },
                {
                  "id": "node_003",
                  "type": "setState",
                  "config": {
                    "variable": "formData",
                    "value": {
                      "email": "$('node_001').json.value",
                      "termsAccepted": "$('node_002').json.checked"
                    }
                  },
                  "position": { "x": 500, "y": 100 }
                },
                {
                  "id": "node_004",
                  "type": "alert",
                  "config": {
                    "message": "Form submitted!"
                  },
                  "position": { "x": 700, "y": 100 }
                }
              ],
              "connections": [
                {
                  "from": "node_001",
                  "fromPort": "done",
                  "to": "node_002",
                  "toPort": "run"
                },
                {
                  "from": "node_002",
                  "fromPort": "done",
                  "to": "node_003",
                  "toPort": "run"
                },
                {
                  "from": "node_003",
                  "fromPort": "done",
                  "to": "node_004",
                  "toPort": "run"
                }
              ]
            }
          }
        }
      }
    }
  }
}
```

**Key Manifest Features:**
- **Signal connections**: `fromPort: "done"` → `toPort: "run"` (explicit execution flow)
- **JSON references**: `$('node_001').json.value` (clean data access between nodes)
- **Node positions**: For React Flow canvas layout

### Generated Code

```jsx
import { useState, useCallback } from 'react';

export function LoginPage() {
  const [formData, setFormData] = useState({ 
    email: "", 
    termsAccepted: false 
  });

  const handleSubmitClick = useCallback(async () => {
    try {
      // Node 001: Get Component Property (email)
      // Signal: onClick → node_001.run
      const node_001_output = {
        json: { value: document.getElementById('email-input')?.value || '' },
        binary: null
      };
      // Signal: node_001.done → node_002.run
      
      // Node 002: Get Component Property (checkbox)
      const node_002_output = {
        json: { checked: document.getElementById('checkbox-terms')?.checked || false },
        binary: null
      };
      // Signal: node_002.done → node_003.run
      
      // Node 003: SetState (references previous node outputs)
      setFormData({
        email: node_001_output.json.value,         // $('node_001').json.value
        termsAccepted: node_002_output.json.checked  // $('node_002').json.checked
      });
      const node_003_output = { json: { updated: true }, binary: null };
      // Signal: node_003.done → node_004.run
      
      // Node 004: Alert
      alert('Form submitted!');
      const node_004_output = { json: { dismissed: true }, binary: null };
      
    } catch (error) {
      // Signal: failed → error handler
      console.error('Logic flow failed:', error);
    }
  }, []);

  return (
    <div>
      <input id="email-input" type="email" />
      <input id="checkbox-terms" type="checkbox" />
      <button onClick={handleSubmitClick}>Submit</button>
    </div>
  );
}
```

---

## 📦 Deliverables

### Core Implementation

1. **Logic Canvas UI** (`src/renderer/components/LogicCanvas/`)
   - React Flow integration
   - Custom node components (4 types)
   - Connection validation
   - Auto-save to manifest

2. **Node Types** (`src/renderer/components/LogicCanvas/nodes/`)
   - GetComponentPropertyNode.tsx
   - SetStateNode.tsx
   - AlertNode.tsx
   - ConsoleNode.tsx

3. **Logic Executor** (`src/core/logic/`)
   - Execute logic flows at runtime
   - Node execution pipeline
   - State management integration
   - Error handling

4. **Code Generator Updates** (`src/core/generation/`)
   - Generate event handlers from logic flows
   - Generate state management code
   - Generate node execution code

5. **Manifest Schema Updates** (`src/core/manifest/`)
   - Add `logicFlows` to component schema
   - Add `state` to page schema
   - Validation for logic structures

### UI Components

6. **Logic Canvas Panel**
   - Opens when ⚡ clicked
   - Shows in Editor panel (new tab)
   - Node palette (draggable)
   - Canvas controls (zoom, pan, fit)

7. **Navigator Updates**
   - Show ⚡ icon on components with logic
   - Click to open logic canvas
   - Visual feedback for active logic

8. **Properties Panel Updates**
   - Show logic flows section
   - Edit trigger settings
   - View node count

### Testing

9. **Unit Tests**
   - Node execution logic
   - State management
   - Code generation
   - Manifest validation

10. **Integration Tests**
    - Full logic flow execution
    - Multi-node workflows
    - State updates triggering re-renders
    - HMR updates

---

## 🎯 Success Criteria

- [ ] User can click ⚡ on a button to open logic canvas
- [ ] User can drag 4 node types onto canvas
- [ ] User can connect nodes with wires
- [ ] Logic auto-saves to manifest
- [ ] Generated code compiles without errors
- [ ] onClick triggers execute logic in preview
- [ ] State updates trigger component re-renders
- [ ] Get Component Property reads from sibling components
- [ ] Alert and Console nodes work as expected
- [ ] Performance: <100ms to execute simple logic flow
- [ ] Test coverage: >90% for logic execution code

---

## 🚧 Known Constraints

### Intentional Limitations (Phase 4)

1. **Only onClick events** - Keeps scope manageable
2. **Only 4 node types** - Proves the concept without feature bloat
3. **No conditionals** - Avoids complexity for MVP
4. **No API calls** - Reduces error handling scope
5. **Static values only** - No expression parser needed yet

These limitations are **temporary** and will be lifted in Level 2.

### Technical Constraints

1. **Component property access** - Uses DOM queries (getElementById) for MVP
2. **State management** - Page-level only (no app-level yet)
3. **Error handling** - Basic try/catch (no detailed debugging yet)

---

## 🔮 Future Enhancements (Level 2)

After Phase 4 is complete and validated, Level 2 will add significant capabilities organized into these categories:

### Variable System

| Feature | Description |
|---------|-------------|
| **Execution Scope** | `$exec.var` - Flow-scoped scratch space, auto garbage collected |
| **App Scope** | `$app.var` - Session-persistent state (cart, auth, preferences) |
| **Reactive Updates** | Automatic component re-renders when `$page` or `$app` values change |

See [VARIABLE_SCOPES.md](../docs/VARIABLE_SCOPES.md) for complete documentation.

### Control Flow Nodes

| Node | Purpose |
|------|---------|
| **Loop** | Iterate arrays with `$loop.item`, `$loop.index`, and `$loop.data` accumulator |
| **Merge** | Wait for parallel branches, combine outputs (waitAll/waitAny modes) |
| **If/Else** | Conditional branching with true/false signal outputs |
| **Switch** | Multi-way branching based on value matching |

### Event System

| Node | Purpose |
|------|---------|
| **Emit Event** | Broadcast named event with payload (page or app scope) |
| **On Event** | Trigger flow when event is emitted (decoupled communication) |

Use events for triggering actions across decoupled components. Use reactive state (`$page`/`$app`) for automatic UI updates.

### Error Handling

| Feature | Description |
|---------|-------------|
| **Try/Catch Container** | Wrap nodes in error-handling context with catch branch |
| **Error Context** | `$error.message`, `$error.node`, `$error.nodeType` available in catch |

### Component Interaction

| Node | Purpose |
|------|---------|
| **Component Action** | Invoke methods: focus, blur, reset, scrollIntoView, play, pause |
| **Enhanced Get Property** | Proper React patterns (refs/registry instead of DOM queries) |

### Workflow System

| Feature | Description |
|---------|-------------|
| **Reusable Workflows** | Named workflows with defined inputs/outputs |
| **Call Workflow** | Invoke workflow, receive done/failed signals and JSON output |
| **Workflow Scoping** | Component, Page, or App level visibility |
| **Extract to Workflow** | Refactor Quick Logic into reusable workflow |

### Additional Event Triggers

- onChange, onBlur, onFocus, onEnter
- Page Load / Page Unload
- Timer triggers (delayed, recurring)
- Custom event listeners

### Expression System

- Template expressions `{{ state.value }}`
- Computed properties
- Global functions
- Expression sandbox (security)

### Debugging Tools

- Execution traces (which nodes ran, timing, values)
- State inspector (current values, change history)
- Breakpoints
- Step-through debugging

---

## 📚 Related Documentation

- **[LOGIC_PATTERNS.md](../docs/LOGIC_PATTERNS.md)** - Quick Logic vs Reusable Workflows
- **[GLOSSARY.md](../docs/GLOSSARY.md)** - Terminology reference
- **[SCHEMA_LEVELS.md](../docs/SCHEMA_LEVELS.md)** - Level 1.5 specification
- **[COMPONENT_SCHEMA.md](../docs/COMPONENT_SCHEMA.md)** - Manifest schema

---

## 📝 Implementation Tasks

Tasks will be created in `.implementation/phase-4-logic-editor/`:

1. `task-4.1-react-flow-integration.md` - Setup React Flow canvas
2. `task-4.2-node-types.md` - Implement 4 node types
3. `task-4.3-logic-executor.md` - Runtime logic execution
4. `task-4.4-code-generation.md` - Generate event handlers
5. `task-4.5-ui-integration.md` - ⚡ icon and canvas panel
6. `task-4.6-state-management.md` - Page-level state system

---

**Ready to bring Rise to life with interactivity!** 🚀

---

**Last Updated:** 2024-11-30  
**Status:** 🟡 In Progress  
**Next Milestone:** React Flow integration complete