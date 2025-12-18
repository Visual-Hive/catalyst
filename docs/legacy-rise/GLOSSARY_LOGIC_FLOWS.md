# Rise Glossary

> Comprehensive terminology reference for Rise visual application builder

---

## Core Concepts

### **Rise**
Visual low-code React application builder that generates clean, maintainable code without vendor lock-in.

### **Manifest**
JSON file that serves as the source of truth for all visual components, logic flows, state, and application structure. Located in the project root as `rise.manifest.json`.

### **Schema Level**
Version of the manifest schema indicating which features are available:
- **Level 1** (MVP): Static components, basic properties
- **Level 1.5** (Phase 4): Level 1 + Quick Logic (onClick, simple nodes)
- **Level 2** (Post-MVP): Expressions, reusable workflows, full logic system
- **Level 3** (Advanced): Database connections, real-time data, AI features

---

## Component Terms

### **Component**
Reusable UI element defined in the manifest. Three types:
- **Basic**: button, input, div, text
- **Composite**: UserCard, Navigation, etc.
- **Container**: Layout components that hold other components

### **Component ID**
Unique identifier for a component in the manifest, format: `comp_name_001` (semantic + numeric).

### **Display Name**
Human-readable name shown in the visual editor, e.g., "UserCard", "SubmitButton".

### **Component Hierarchy**
The parent-child tree structure of components. MVP limit: 5 levels deep, 20 children per component.

### **Props** (Properties)
Inputs to a component passed from parent. Like function parameters.

```jsx
<Button label="Click me" disabled={false} />
//      ↑ props
```

---

## Property Types (Schema Level 1)

### **Static Property**
A fixed value that doesn't change:
```json
{
  "type": "static",
  "value": "Hello World"
}
```

### **Prop Property**
A property passed from parent component:
```json
{
  "type": "prop",
  "dataType": "string",
  "required": true
}
```

---

## Logic System Terms (Level 1.5+)

### **Signal-Based Execution**
Control flow pattern where nodes have explicit signal ports (`run`, `done`, `failed`) that you wire together to define execution order. Inspired by Noodl. Much better than implicit top-to-bottom execution (n8n's approach).

### **Signal Ports**
Connection points on nodes for control flow:
- **run** (input): Triggers the node to execute
- **done** (output): Fires when node completes successfully
- **failed** (output): Fires when node encounters an error

### **JSON Output**
Every node outputs structured data: `{ json: {...}, binary: null }`. Later nodes reference previous outputs using expressions like `$('NodeName').json.propertyName`. Inspired by n8n's approach.

### **Node Reference Expression**
Syntax for accessing previous node outputs: `$('NodeName').json.propertyName`. Example: `$('node_001').json.value` gets the value property from node_001's JSON output.

### **Quick Logic**
Fast, throwaway logic attached directly to a component trigger (e.g., button onClick). Not reusable, scoped to that specific interaction. Perfect for simple button clicks, form validation, and one-off interactions. See LOGIC_PATTERNS.md.

### **Logic Canvas**
Visual node-based editor for creating interactive logic using React Flow. Used for both Quick Logic (Phase 4) and Reusable Workflows (Level 2).

### **Logic Flow**
A connected sequence of logic nodes that executes in response to a trigger. In Quick Logic, it's directly attached to a component event. In Reusable Workflows, it can be called from multiple places.

### **Logic Node**
Individual unit of logic in the canvas. Each node performs one operation and can connect to other nodes via signal ports.

**Phase 4 Nodes (Quick Logic):**
- **Get Component Property**: Read values from other components on the page
- **Set State**: Update page-level state variables
- **Alert**: Show browser alert dialog
- **Console**: Log messages to browser console

**Level 2 Nodes (Reusable Workflows):**
- **Call Workflow**: Invoke a reusable workflow
- **Workflow Output**: Return data from a workflow to its caller
- **If/Else**: Conditional branching
- **HTTP Request**: API calls
- **Loop**: Array iteration
- **Navigate**: Route changes
- And many more...

### **Get Component Property Node** (Phase 4)
Node that reads the current value or state from another component on the same page. Enables logic to access data from sibling components without coupling them. Examples:
- Read the value of an input field
- Check if a checkbox is checked
- Get the selected option from a dropdown

Similar to Noodl's component connections, but accessed through a node rather than a global canvas. Outputs: `{ json: { value: "..." }, binary: null }`

### **Reusable Workflow** (Level 2)
Named, callable logic workflow with defined inputs and outputs that can be invoked from multiple places. Like a function in code. Examples: "addItemToBasket", "validateEmail", "fetchUserProfile". 

Workflows have:
- `done` and `failed` signal outputs (for parent flow control)
- `json` output (for returning data to parent)
- Defined input parameters (like function arguments)
- Internal signal-based logic flow

See LOGIC_PATTERNS.md.

### **Call Workflow Node** (Level 2)
Node that invokes a reusable workflow, passing inputs and receiving outputs via signals and JSON. Similar to n8n's "Execute Workflow" node. Enables logic reuse across multiple components and pages.

Receives:
- Input parameters (mapped to workflow inputs)
- `run` signal (trigger)

Outputs:
- `done` signal (workflow completed successfully)
- `failed` signal (workflow error)
- `json` data (workflow's return value)

### **Workflow Output Node** (Level 2)
Special node inside a reusable workflow that returns data to the calling flow. Receives the workflow's final data, then fires the workflow's `done` or `failed` signal back to the Call Workflow node with the JSON output.

### **Workflow Scope** (Level 2)
The visibility level of a reusable workflow:
- **Component-Level**: Accessible to that component + children
- **Page-Level**: Accessible to all components on that page
- **App-Level**: Accessible throughout the entire application

---

## State Management Terms (Level 2+)

### **State**
Data that can change over time, triggering re-renders:
- **Local State**: Component-specific (useState)
- **Page State**: Shared across components on a page
- **App State**: Global, shared across the entire app

### **Persistent Reactive State**
State that survives across logic flow executions and automatically triggers component re-renders. Unlike ephemeral function-local variables.

```javascript
// Ephemeral state (dies after function)
function handler() {
  let toggle = true;  // Lost when function ends
}

// Persistent state (survives)
Page State: { toggle: false }
Logic Flow A: Sets toggle = true
Logic Flow B: Reads toggle (still true!)
```

---

## Expression System Terms (Level 2+)

### **Expression**
User-written JavaScript code that computes a value:
```json
{
  "type": "expression",
  "expression": "props.user.firstName + ' ' + props.user.lastName"
}
```

### **Template Expression**
Inline expression in a string using `{{ }}` syntax:
```json
{
  "label": "Welcome, {{state.userName}}!"
}
```

### **Computed Property**
A derived value that updates automatically (uses `useMemo`):
```json
{
  "computedProperties": {
    "fullName": {
      "expression": "props.firstName + ' ' + props.lastName"
    }
  }
}
```

### **Global Function**
User-defined reusable function available everywhere:
```json
{
  "globalFunctions": {
    "user.formatTimeAgo": {
      "code": "function formatTimeAgo(date) { ... }"
    }
  }
}
```

---

## Code Generation Terms

### **Generated Code**
Clean, standard React code produced by Rise from the manifest. Can be deployed anywhere (Vercel, Netlify, etc.) without vendor lock-in.

### **Code Generator**
System component that transforms the manifest into deployable React code. Uses templates and the manifest as source of truth.

### **HMR** (Hot Module Replacement)
Live preview technology that updates the running app without full page refresh when code changes.

---

## Development Terms

### **Phase**
Development milestone in the project roadmap:
- **Phase 0**: Foundation (security, file watching, schema validation)
- **Phase 1**: Application shell (Electron, three-panel layout)
- **Phase 2**: Component management (manifest store, tree UI)
- **Phase 3**: Visual editing (component addition, properties)
- **Phase 4**: Logic system (Quick Logic with React Flow)
- **Phase 5**: Polish (AI generation, testing, documentation)

### **Navigator Panel**
Left panel in Rise showing the component tree, file structure, and (in Level 2) workflows.

### **Properties Panel**
Right panel showing editable properties for the selected component.

### **Preview Panel**
Center panel showing live preview of the application with embedded Vite dev server.

### **React Flow**
Third-party library used for the visual node-based logic canvas. Provides draggable nodes, connections, and canvas controls.

---

## File System Terms

### **File Watcher**
System that monitors generated files for changes and updates the manifest accordingly. Uses SHA-256 hashing to detect modifications.

### **Hash Detection**
Technique using SHA-256 checksums to determine if a file has actually changed, preventing infinite loops between manifest updates and file generation.

---

## Security Terms

### **Expression Sandbox**
Isolated execution environment for user-written expressions that prevents access to dangerous APIs (eval, Function constructor, etc.).

### **API Key Manager**
Secure storage system for Claude API keys using OS-level credential storage (Keychain on macOS, Credential Manager on Windows).

### **Input Sanitizer**
Security component that validates and sanitizes user input to prevent XSS, path traversal, and injection attacks.

---

## Comparison Terms

### **Noodl-style**
Refers to Noodl's visual node-based approach where logic and components share the same canvas. Rise uses separate canvases for clarity.

### **n8n-style**
Refers to n8n's workflow system where reusable workflows can be called from multiple places. Rise's Reusable Workflows (Level 2) follow this pattern.

### **Bubble-style**
Refers to Bubble's hosted runtime approach. Rise generates deployable code instead, avoiding vendor lock-in.

### **Vendor Lock-in**
Situation where users can't take their application outside the platform. Rise avoids this by generating standard React code.

---

## Common Abbreviations

- **MVP**: Minimum Viable Product (Phase 4 deliverable)
- **HMR**: Hot Module Replacement (live preview)
- **API**: Application Programming Interface
- **UI**: User Interface
- **UX**: User Experience
- **JSON**: JavaScript Object Notation
- **JSX**: JavaScript XML (React syntax)
- **SHA**: Secure Hash Algorithm (for file change detection)

## Variable Scope Terms (Level 2+)

*Add this as a new section after "State Management Terms"*

### **Execution Scope** (`$exec`)
Variable scope that exists only for the duration of a single flow execution. Created when flow starts, automatically garbage collected when flow ends. Zero memory leak risk.

Use for: Accumulating loop results, collecting validation errors, temporary calculations.

Access: `$exec.variableName`

See [VARIABLE_SCOPES.md](./VARIABLE_SCOPES.md).

### **Page Scope** (`$page`)
Variable scope that persists while a page is mounted. Cleared when user navigates away. Reactive - components automatically re-render when values change.

Use for: Form data, UI toggles, filter/sort state, pagination.

Access: `$page.variableName` or in expressions `{{ $page.formData.email }}`

### **App Scope** (`$app`)
Variable scope that persists for the entire browser session (until refresh). Reactive - components automatically re-render when values change.

Use for: Authentication, shopping cart, user preferences, theme, cached data.

Access: `$app.variableName` or in expressions `{{ $app.cart.items.length }}`

### **Reactive Variable**
A Page or App scoped variable that automatically triggers re-renders in any component that references it. When a flow updates `$page.count`, all components displaying `{{ $page.count }}` update immediately.

Execution scope variables are NOT reactive (they don't exist outside flow execution).

---

## Loop Node Terms (Level 2+)

*Add this as a new section*

### **Loop Node**
Container node that executes its inner nodes once for each item in an input array. Provides iteration context and supports data accumulation across iterations.

```
┌─────────────────────────────────────────┐
│ Loop                                    │
│ input: $('node_001').json.items         │
│ ┌─────────────────────────────────────┐ │
│ │ [Inner Node 1] ─→ [Inner Node 2]    │ │
│ └─────────────────────────────────────┘ │
│ Signals: ◀run ▶done ▶itemDone ▶failed   │
└─────────────────────────────────────────┘
```

### **Loop Context** (`$loop`)
Special variables available inside a Loop node's body:

| Variable | Type | Description |
|----------|------|-------------|
| `$loop.item` | any | Current item being processed |
| `$loop.index` | number | Zero-based index of current item |
| `$loop.isFirst` | boolean | True if first iteration |
| `$loop.isLast` | boolean | True if last iteration |
| `$loop.data` | object | Accumulated data from previous iterations |

### **Loop Data Accumulator** (`$loop.data`)
Object that persists across loop iterations, allowing each iteration to read what previous iterations produced. Perfect for running totals, building result arrays, or LLM retry patterns with context.

```
Iteration 1: $loop.data = {}
  → Process → Append { total: 10 }
  
Iteration 2: $loop.data = { total: 10 }
  → Process → Append { total: 30 }
  
Iteration 3: $loop.data = { total: 30 }
  → Process → Append { total: 45 }
  
Final output: loopData = { total: 45 }
```

### **Append to Loop Data Node**
Node used inside Loop body to add data to the loop accumulator. Data becomes available to subsequent iterations via `$loop.data`.

```
┌─────────────────────────────────┐
│ Append to Loop Data             │
│ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ │
│ data: {                         │
│   total: $loop.data.total +     │
│          $loop.item.price       │
│ }                               │
│ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ │
│ Signals: ◀run ▶done             │
└─────────────────────────────────┘
```

### **Break Signal**
Signal that exits a loop early, skipping remaining iterations. Loop outputs accumulated `loopData` up to that point.

### **Continue Signal**
Signal that skips the rest of the current iteration and moves to the next item.

---

## Parallel Execution Terms (Level 2+)

*Add this as a new section*

### **Parallel Branches**
Multiple execution paths that run simultaneously from a single trigger point. Each branch executes independently until reaching a Merge node.

```
              ┌─→ [Branch A nodes...]─→┐
[Trigger] ─→ ─┤                        ├─→ [Merge] ─→ [Continue]
              └─→ [Branch B nodes...]─→┘
```

### **Merge Node**
Node that waits for all incoming parallel branches to complete, then combines their outputs into a single result.

```
┌─────────────────────────────────┐
│ Merge                           │
│ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ │
│ mode:                           │
│   • waitAll (default)           │
│   • waitAny (first to complete) │
│ combine:                        │
│   • append (array of results)   │
│   • merge (shallow object merge)│
│ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ │
│ Signals:                        │
│   ◀ run (multiple inputs)       │
│   ▶ done (all/any complete)     │
│   ▶ failed (any branch failed)  │
│ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ │
│ Output:                         │
│   json: {                       │
│     results: [branchA, branchB] │
│     // or merged object         │
│   }                             │
└─────────────────────────────────┘
```

### **Wait All Mode**
Merge mode that waits for ALL incoming branches to complete before firing `done` signal. Default behavior.

### **Wait Any Mode**
Merge mode that fires `done` signal as soon as ANY branch completes. Useful for racing parallel requests (first response wins).

---

## Event Bus Terms (Level 2+)

*Add this as a new section*

### **Event Bus**
Pub/sub messaging system for decoupled communication between components and workflows. Components can emit events without knowing who's listening, and listen for events without knowing who's emitting.

Two modes available:
- **Manual events**: Explicit Emit/OnEvent nodes for full control
- **Reactive state**: Automatic updates via `$page` and `$app` scopes

### **Emit Event Node**
Node that broadcasts a named event with optional payload. Any OnEvent listeners for that event name will be triggered.

```
┌─────────────────────────────────┐
│ Emit Event                      │
│ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ │
│ event: cart:itemAdded           │
│ payload: {                      │
│   item: $('node_001').json,     │
│   newTotal: 149.99              │
│ }                               │
│ scope: page / app               │
│ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ │
│ Signals: ◀run ▶done             │
└─────────────────────────────────┘
```

### **On Event Node** (Trigger)
Trigger node that starts a flow when a specific event is emitted. Similar to onClick but listens for custom events instead of DOM events.

```
┌─────────────────────────────────┐
│ On Event                        │
│ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ │
│ event: cart:itemAdded           │
│ scope: page / app               │
│ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ │
│ Signals:                        │
│   ▶ triggered                   │
│ Output:                         │
│   json: { payload: {...} }      │
│   Available as $event.payload   │
└─────────────────────────────────┘
```

### **Event Scope**
Where an event is broadcast:
- **Page scope**: Only listeners on the current page receive the event
- **App scope**: Listeners anywhere in the app receive the event

### **Reactive State vs Manual Events**

**Use Reactive State (`$page`/`$app`) when:**
- Data changes should automatically reflect in UI
- Multiple components display the same data
- Simple state updates (cart count, form values)

**Use Manual Events when:**
- You need to trigger actions, not just update data
- Cross-component communication with side effects
- Event payloads contain temporary data (not persisted state)
- You want explicit control over what happens when

**Example - Both approaches for cart:**
```
// Reactive approach (automatic)
[Add to Cart] ─→ [Set $app.cart.items = [...]]
// CartIcon automatically updates because it displays {{ $app.cart.items.length }}

// Manual event approach (explicit)
[Add to Cart] ─→ [Set $app.cart.items = [...]] 
              ─→ [Emit: cart:updated]

// Separate listener that shows toast
[On Event: cart:updated] ─→ [Show Toast: "Added to cart!"]
```

---

## Error Handling Terms (Level 2+)

*Add this as a new section*

### **Try/Catch Container**
Container node that wraps a sequence of nodes, catching any errors and routing them to an error handler branch instead of failing the entire flow.

```
┌─────────────────────────────────────────────────────────┐
│ Try/Catch                                               │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ TRY BRANCH                                          │ │
│ │ [Node 1] ─→ [Node 2] ─→ [Node 3]                    │ │
│ └─────────────────────────────────────────────────────┘ │
│                         │                               │
│                    (on error)                           │
│                         │                               │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ CATCH BRANCH                                        │ │
│ │ [Log Error] ─→ [Show User Message]                  │ │
│ │                                                     │ │
│ │ Available: $error.message, $error.node, $error.stack│ │
│ └─────────────────────────────────────────────────────┘ │
│                                                         │
│ Signals: ◀run ▶done ▶caught ▶failed                     │
└─────────────────────────────────────────────────────────┘
```

### **Error Context** (`$error`)
Variables available in the catch branch:

| Variable | Type | Description |
|----------|------|-------------|
| `$error.message` | string | Error message |
| `$error.node` | string | ID of node that failed |
| `$error.nodeType` | string | Type of node that failed |
| `$error.stack` | string | Stack trace (if available) |

### **Caught Signal**
Signal that fires when an error is caught and handled by the catch branch. Indicates the error was recovered from.

### **Failed Signal (in Try/Catch)**
Signal that fires if the catch branch itself fails, indicating an unrecoverable error.

---

## Component Action Terms (Level 2+)

*Add this as a new section*

### **Component Action Node**
Node that invokes a method on a component, rather than reading its properties. Used for imperative operations like focusing inputs, resetting forms, or triggering animations.

```
┌─────────────────────────────────┐
│ Component Action                │
│ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ │
│ component: email-input          │
│ action: focus                   │
│ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ │
│ Signals: ◀run ▶done ▶failed     │
└─────────────────────────────────┘
```

### **Available Component Actions**

| Action | Applies To | Description |
|--------|-----------|-------------|
| `focus` | Input, Textarea, Select | Focuses the element |
| `blur` | Input, Textarea, Select | Removes focus |
| `reset` | Form, Input | Clears value to default |
| `select` | Input, Textarea | Selects all text |
| `scrollIntoView` | Any | Scrolls element into viewport |
| `click` | Any | Programmatically clicks element |
| `play` | Video, Audio | Starts media playback |
| `pause` | Video, Audio | Pauses media playback |

### **Component Ref**
Internal reference to a component instance, enabling both property reading (Get Component Property) and action invocation (Component Action).

---

## Updated Comparison Terms

*Update the existing "Comparison Terms" section*

### **Noodl-style**
Refers to Noodl's visual node-based approach. Rise adopts:
- ✅ Signal-based execution (run/done/failed ports)
- ✅ Component connections (Get Component Property node)
- ✅ Reactive state (automatic UI updates)
- ❌ Single shared canvas (Rise uses separate logic canvases per component/workflow)

### **n8n-style**
Refers to n8n's workflow automation patterns. Rise adopts:
- ✅ JSON output references (`$('NodeName').json.property`)
- ✅ Reusable workflows (Level 2)
- ✅ Loop node with data accumulation
- ❌ Implicit top-to-bottom execution (Rise uses explicit signals)

---

## Node Type Summary Table (Level 2)

*Add this reference table*

| Node | Category | Signals In | Signals Out | Purpose |
|------|----------|------------|-------------|---------|
| Event | Trigger | - | triggered | Start flow from component event |
| On Event | Trigger | - | triggered | Start flow from custom event |
| Get Component Property | Data | run | done, failed | Read component value |
| Set Execution Variable | Data | run | done | Set flow-scoped variable |
| SetState | State | run | done, failed | Set page/app variable |
| Alert | Action | run | done | Show browser alert |
| Console | Action | run | done | Log to console |
| Component Action | Action | run | done, failed | Focus, blur, reset, etc. |
| Emit Event | Action | run | done | Broadcast custom event |
| HTTP Request | API | run | done, failed | Make API call |
| Loop | Control | run | done, itemDone, failed | Iterate array |
| Merge | Control | run (multiple) | done, failed | Wait for parallel branches |
| If/Else | Control | run | true, false | Conditional branch |
| Try/Catch | Container | run | done, caught, failed | Error handling |
| Call Workflow | Workflow | run | done, failed | Invoke reusable workflow |
| Workflow Output | Workflow | run | - | Return from workflow |

---

## Related Documentation

- **[LOGIC_PATTERNS.md](./LOGIC_PATTERNS.md)** - Detailed explanation of Quick Logic vs Reusable Workflows
- **[SCHEMA_LEVELS.md](./SCHEMA_LEVELS.md)** - Complete schema level definitions
- **[COMPONENT_SCHEMA.md](./COMPONENT_SCHEMA.md)** - Manifest schema reference
- **[ARCHITECTURE.md](./ARCHITECTURE.md)** - System architecture overview

---

**Last Updated:** 2024-11-30  
**Status:** ✅ Complete  
**Maintainer:** Rise Documentation Team