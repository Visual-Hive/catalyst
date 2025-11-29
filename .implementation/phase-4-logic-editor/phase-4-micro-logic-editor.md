# Phase 4: Micro Logic Editor

**Duration:** 3-4 weeks (Weeks 15-18)  
**Status:** 🔵 Planning  
**Dependencies:** Phase 3 Complete (Preview Working)  
**Goal:** Demonstrate the logic editing concept with minimal but functional implementation

---

## 🎯 Phase Objective

Add a **working but severely constrained** logic system to the MVP that demonstrates Rise's vision for visual logic editing. This is NOT the full Level 2 logic system - it's a "Level 1.5" proof of concept that shows users what's coming while keeping scope manageable.

### What Success Looks Like

A user can:
1. Add a button component
2. Open the Logic tab
3. See a React Flow canvas
4. Create a simple flow: `onClick → Set State → Update UI`
5. See the button click actually change something in the preview

This single workflow demonstrates the entire vision without requiring the full expression system, complex state management, or dozens of node types.

---

## 🚫 Strict Scope Boundaries

### ✅ IN SCOPE (Level 1.5)

| Feature | Description | Rationale |
|---------|-------------|-----------|
| **onClick events only** | No onChange, onSubmit, onMount, etc. | Simplest event type |
| **3 action nodes** | SetState, Alert, Console.log | Minimum viable actions |
| **Page-level state only** | No global/app state | Simplest state scope |
| **Static values only** | No expressions, no computed values | Avoids sandboxing complexity |
| **Single-step flows** | Event → Action (no chaining) | Keeps flows simple |
| **Read state in text** | `{{state.variableName}}` in labels | Shows reactivity |

### ❌ OUT OF SCOPE (Deferred to Level 2)

| Feature | Why Deferred |
|---------|--------------|
| Expression system | Requires security sandbox (2-3 weeks alone) |
| Multiple event types | onClick is sufficient for demo |
| Complex node types | API calls, conditionals, loops |
| Flow chaining | Event → Action → Action → ... |
| Global state | Page state demonstrates the concept |
| State persistence | Ephemeral state is fine for demo |
| Undo/redo in canvas | Nice-to-have, not essential |
| Node copy/paste | Nice-to-have, not essential |

### ⚠️ SCOPE CREEP WARNINGS

If you find yourself implementing any of these, **STOP**:
- Expression parsing or evaluation
- Security sandboxing
- More than 3 node types
- Events other than onClick
- State scopes other than page
- Async operations in flows
- Conditional branching nodes

---

## 🏗️ Architecture Overview

### New Components

```
src/
├── renderer/
│   ├── components/
│   │   └── LogicEditor/
│   │       ├── LogicCanvas.tsx        # React Flow wrapper
│   │       ├── nodes/
│   │       │   ├── EventNode.tsx      # onClick trigger
│   │       │   ├── SetStateNode.tsx   # Set state value
│   │       │   ├── AlertNode.tsx      # Show alert
│   │       │   └── ConsoleNode.tsx    # Console.log
│   │       ├── NodePalette.tsx        # Drag-and-drop node list
│   │       └── FlowToolbar.tsx        # Save, delete, etc.
│   └── store/
│       └── logicStore.ts              # Zustand store for flows
├── core/
│   ├── logic/
│   │   ├── types.ts                   # Flow, Node, Edge types
│   │   ├── FlowValidator.ts           # Validate flow structure
│   │   └── FlowCodeGenerator.ts       # Generate event handler code
│   └── state/
│       └── PageStateManager.ts        # Simple page state
└── electron/
    └── ipc-handlers.ts                # Add flow-related handlers
```

### Schema Extension (Level 1.5)

```json
{
  "schemaVersion": "1.0.0",
  "level": 1.5,
  "components": {
    "comp_button_001": {
      "id": "comp_button_001",
      "displayName": "SubmitButton",
      "type": "button",
      "properties": {
        "label": {
          "type": "static",
          "value": "Click Me",
          "dataType": "string"
        }
      },
      "events": {
        "onClick": {
          "flowId": "flow_001"
        }
      }
    }
  },
  "pageState": {
    "clickCount": {
      "type": "number",
      "initialValue": 0
    },
    "message": {
      "type": "string", 
      "initialValue": "Hello"
    }
  },
  "flows": {
    "flow_001": {
      "id": "flow_001",
      "name": "Handle Button Click",
      "trigger": {
        "type": "onClick",
        "componentId": "comp_button_001"
      },
      "nodes": [
        {
          "id": "node_1",
          "type": "setState",
          "config": {
            "variable": "clickCount",
            "value": { "type": "static", "value": 1 }
          }
        }
      ]
    }
  }
}
```

### Data Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                        User Interaction                          │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│  1. User clicks button in Preview                                │
│     └── Triggers onClick event                                   │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│  2. Generated handler executes                                   │
│     └── handleClick_comp_button_001() {                         │
│           setPageState('clickCount', 1);                        │
│           alert('Button clicked!');                              │
│         }                                                        │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│  3. State updates → Components re-render                         │
│     └── Any component using {{state.clickCount}} updates        │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📋 Task Breakdown

### Task 4.0: Logic System Foundation (2-3 days)
- Extend schema for Level 1.5 (events, pageState, flows)
- Update SchemaValidator for new structures
- Define TypeScript types for logic system
- Update manifest types

### Task 4.1: React Flow Integration (2-3 days)
- Install and configure React Flow
- Create LogicCanvas component
- Implement basic pan/zoom/select
- Add node rendering infrastructure
- Create NodePalette for drag-and-drop

### Task 4.2: Node Types Implementation (3-4 days)
- EventNode (onClick trigger - read-only, shows which component)
- SetStateNode (select variable, enter static value)
- AlertNode (enter message string)
- ConsoleNode (enter log message)
- Node connection validation (event → action only)

### Task 4.3: Page State System (2-3 days)
- PageStateManager class
- State variable CRUD in UI
- State panel in editor
- Template syntax for reading state: `{{state.varName}}`
- State injection in code generation

### Task 4.4: Event Binding & Code Generation (3-4 days)
- Event binding UI (component → flow connection)
- FlowCodeGenerator (flows → handler functions)
- Update ReactCodeGenerator for event handlers
- Runtime state management in generated code

### Task 4.5: Integration & Polish (2-3 days)
- End-to-end flow: edit canvas → save → regenerate → preview
- Error handling and validation messages
- Example flows for testing
- Documentation updates

---

## ⏱️ Timeline

```
Week 15: Foundation + React Flow
├── Task 4.0: Schema & Types (Days 1-2)
└── Task 4.1: React Flow Canvas (Days 3-5)

Week 16: Node Types + State
├── Task 4.2: Node Implementation (Days 1-3)
└── Task 4.3: Page State System (Days 4-5)

Week 17: Code Generation + Integration
├── Task 4.4: Event Binding & Codegen (Days 1-3)
└── Task 4.5: Integration (Days 4-5)

Week 18: Buffer + Polish
├── Bug fixes and edge cases
├── Documentation
└── Demo preparation
```

---

## 🎨 UI Design

### Logic Tab Layout

```
┌─────────────────────────────────────────────────────────────────┐
│ [Navigator]      │ [Editor: Preview | Code | Logic | Console]   │
│                  │                                               │
│ Component Tree   │  ┌─────────────────────────────────────────┐ │
│ ├─ App           │  │ Logic Canvas                      [Save] │ │
│ │  ├─ Header     │  ├─────────────────────────────────────────┤ │
│ │  ├─ Button ⚡  │  │                                         │ │
│ │  └─ Footer     │  │   ┌──────────┐      ┌──────────┐       │ │
│                  │  │   │ onClick  │──────│ SetState │       │ │
│ ───────────────  │  │   │ Button   │      │ count: 1 │       │ │
│ State Variables  │  │   └──────────┘      └──────────┘       │ │
│ ├─ clickCount: 0 │  │                                         │ │
│ └─ message: ""   │  │                                         │ │
│ [+ Add State]    │  │                                         │ │
│                  │  └─────────────────────────────────────────┘ │
│                  │  ┌─────────────────────────────────────────┐ │
│                  │  │ Node Palette                            │ │
│                  │  │ [SetState] [Alert] [Console.log]        │ │
│                  │  └─────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

### Node Designs

```
Event Node (Trigger):
┌─────────────────────┐
│ ⚡ onClick          │
│ ─────────────────── │
│ Component: Button   │
│                   ●─┼── (output handle)
└─────────────────────┘

SetState Node:
┌─────────────────────┐
│ 📝 Set State        │
│ ─────────────────── │
──●│ Variable: [count▼] │
│ Value: [    1     ] │
└─────────────────────┘

Alert Node:
┌─────────────────────┐
│ 🔔 Alert            │
│ ─────────────────── │
──●│ Message:          │
│ [Button clicked!  ] │
└─────────────────────┘
```

---

## 🔒 Risk Assessment

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| React Flow learning curve | Medium | Medium | Budget extra time, use tutorials |
| Scope creep to expressions | High | High | Strict code review, schema validation |
| State reactivity complexity | Medium | Medium | Keep it simple - full re-render OK |
| Code gen complexity | Medium | Low | Already have ReactCodeGenerator base |
| Integration with existing preview | Medium | Medium | Test early and often |

---

## ✅ Success Criteria

### Minimum Viable Demo
- [ ] User can add a button and open Logic tab
- [ ] Logic canvas displays with React Flow
- [ ] User can drag SetState node onto canvas
- [ ] User can connect onClick → SetState
- [ ] User can define page state variable
- [ ] Generated code includes event handler
- [ ] Clicking button in preview updates state
- [ ] Component using `{{state.var}}` reflects change

### Stretch Goals (if time permits)
- [ ] Alert and Console.log nodes working
- [ ] Multiple flows on different components
- [ ] Basic flow validation with error messages
- [ ] Undo/redo in canvas

---

## 📚 Resources

### React Flow
- Documentation: https://reactflow.dev/docs
- Examples: https://reactflow.dev/examples
- Custom nodes: https://reactflow.dev/docs/guides/custom-nodes/

### References
- `docs/LOGIC_SYSTEM.md` - Full Level 2 spec (for vision, not implementation)
- `docs/SCHEMA_LEVELS.md` - Level progression
- `docs/DATA_FLOW.md` - Data flow architecture

---

## 🚀 Getting Started

1. **Read this document completely**
2. **Review Task 4.0** - Start with schema extension
3. **Check existing code** - Understand ReactCodeGenerator, SchemaValidator
4. **Timebox React Flow exploration** - Max 4 hours to get comfortable
5. **Start small** - Get one node type working end-to-end first

---

**Next Step:** Begin Task 4.0 - Logic System Foundation

---

**Last Updated:** [Date]  
**Author:** Richard + Claude  
**Status:** Ready for Implementation