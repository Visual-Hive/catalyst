# Glossary

> Definitive terminology for Rise project - ensuring consistency across all documentation.

---

## Core Concepts

### **Rise**
The name of this visual low-code builder project. Represents "rising" from traditional low-code limitations to true developer empowerment.

### **Schema Level**
Progressive feature tiers:
- **Level 1 (MVP)**: Static components, basic props
- **Level 2 (Post-MVP)**: Expressions, state, events
- **Level 3 (Advanced)**: Real-time data, AI integration

See: [SCHEMA_LEVELS.md](./SCHEMA_LEVELS.md)

### **Manifest**
The JSON file (`.lowcode/manifest.json`) that defines the complete component architecture. This is the "source of truth" for the visual editor.

### **Component Schema**
The JSON structure that defines a single component's properties, state, children, and metadata. See: [COMPONENT_SCHEMA.md](./COMPONENT_SCHEMA.md)

---

## Architecture Terms

### **Electron**
The desktop application framework (Chromium + Node.js) that powers Rise. Allows us to build cross-platform native apps with web technologies.

### **Main Process**
The Node.js process in Electron that manages the application window, file system, and system-level operations.

### **Renderer Process**
The Chromium process in Electron that renders the React UI. Sandboxed for security.

### **IPC (Inter-Process Communication)**
The communication mechanism between Electron's main and renderer processes. Uses `ipcMain` and `ipcRenderer`.

### **Context Bridge**
Electron's security mechanism that safely exposes APIs from main process to renderer. Prevents direct access to Node.js APIs.

---

## Component Concepts

### **Component**
A reusable UI element that can be:
- **Primitive**: Button, Input, Text, etc.
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

### **State**
Data that can change over time, triggering re-renders:
- **Local State**: Component-specific (useState)
- **Global State**: Shared across components (Zustand)

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

## Property Types (Schema Level 2+)

### **Expression**
User-written JavaScript code that computes a value:
```json
{
  "type": "expression",
  "expression": "props.user.firstName + ' ' + props.user.lastName"
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

## Logic System Terms (Schema Level 2+)

### **Logic Canvas**
Visual node-based editor for creating interactive logic. Similar to Noodl's node graph or Unreal's Blueprints. Uses React Flow library.

### **Logic Flow**
A connected sequence of logic nodes that executes in response to a trigger (event, page load, timer, etc.). Each flow becomes a generated function.

### **Logic Node**
Individual unit of logic in the canvas. Types include:
- **State Nodes**: Get/Set/Toggle state
- **Logic Nodes**: If/Else, Switch, Loop
- **API Nodes**: HTTP Request, Parse JSON
- **Action Nodes**: Navigate, Show Toast, Focus
- **Data Nodes**: Get URL Param, Local Storage

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

### **State Scope**
The lifetime and visibility of state variables:
- **App-Level**: Persists across pages (authentication, theme, cart)
- **Page-Level**: Persists while page mounted (form data, UI toggles)
- **Component-Level**: Local to component instance (hover, focus)

### **Event Trigger**
What causes a logic flow to execute:
- **Component Events**: onClick, onChange, onMount, etc.
- **Page Events**: Page Load, Page Unload
- **Custom Events**: User-defined events fired by logic
- **Timer Events**: Delayed or recurring execution

### **Node Connection**
Visual wire connecting one node's output to another's input. Determines execution order and data flow.

### **Execution Context**
The runtime environment when a logic flow executes, including:
- Current state values
- Event data (click position, input value, etc.)
- Previous node outputs
- Component references

### **State Inspector**
Debugging tool that shows current state values, change history, and which components/flows are reading/writing each variable.

### **Execution Trace**
Debug view showing the execution path of a logic flow, including:
- Which nodes executed
- Execution duration
- Input/output values
- Errors encountered

---

## Data Flow Terms

### **Binding**
Connecting one component's output to another's input. Visual "wire" in graph editor.

### **Connection**
A data flow link between components, stored in `connections.json`.

### **Reactive Variable**
Global state that automatically updates all dependent components when changed (uses Zustand).

### **Event Handler**
Function that responds to user interactions (onClick, onSubmit, etc.). Level 2 feature.

---

## Code Generation Terms

### **Code Generator**
The engine that transforms manifest JSON into actual React code.

### **Template**
A code pattern used to generate components. E.g., function component template, class component template.

### **Framework Plugin**
An adapter that generates code for a specific framework (React, Vue, Svelte, etc.).

See: [PLUGIN_SYSTEM.md](./PLUGIN_SYSTEM.md)

### **@rise:generated**
Comment marker in generated code indicating it was created by Rise:
```jsx
/**
 * @rise:generated
 * DO NOT EDIT: Changes will be overwritten
 */
```

### **Protected Region**
Code section marked to prevent regeneration:
```jsx
/* @rise:start-preserve */
// User code here - won't be overwritten
/* @rise:end-preserve */
```

---

## Security Terms

### **Expression Sandbox**
Isolated execution environment for user JavaScript code using VM2 or Web Workers. Prevents malicious code execution.

See: [SECURITY_SPEC.md](./SECURITY_SPEC.md)

### **AST (Abstract Syntax Tree)**
Parsed representation of JavaScript code used for security validation and code generation.

### **Input Sanitization**
Cleaning and validating user input to prevent injection attacks.

### **API Key Manager**
Secure storage system for Claude/OpenAI API keys using OS keychain (keytar).

### **Cost Tracking**
Monitoring API usage to prevent runaway expenses. Default: $10/day budget.

### **Path Traversal**
Security attack where user input tries to access files outside allowed directory (e.g., `../../../etc/passwd`). Prevented by input sanitization.

---

## AI Terms

### **AI Copilot**
Rise's philosophy: AI assists but user always in control. Not "autopilot" where AI makes all decisions.

### **AI Code Review**
AI-powered analysis of generated code for performance, security, and best practices. Level 3 feature.

### **Prompt Template**
Pre-defined prompt structure for AI to generate specific types of components.

### **Token**
Unit of text for AI models (~4 characters). Costs calculated per token.

### **Context Window**
Amount of text AI can "see" at once (typically 100k-200k tokens for Claude).

---

## Testing Terms

### **Unit Test**
Test of a single function or component in isolation. Target: 80% coverage for core.

### **Integration Test**
Test of multiple components working together (e.g., component tree → manifest → code generation).

### **E2E Test** (End-to-End)
Test of complete user workflows using Playwright (e.g., create project, add components, preview).

### **Test Coverage**
Percentage of code executed by tests. MVP target: 80% for core engine.

### **Test ID**
HTML attribute for reliable test selection: `data-testid="user-card"`.

---

## File System Terms

### **Project Root**
Top-level directory of a Rise project, contains `.lowcode/`, `src/`, etc.

### **`.lowcode/` Directory**
Hidden folder containing Rise metadata:
- `manifest.json` - Component architecture
- `connections.json` - Data flow
- `variables.json` - Global state
- `config.json` - Project settings

### **File Watcher**
System that monitors file changes using chokidar library. Must prevent infinite loops.

### **Change Detection**
Algorithm to determine if file change was made by user or by Rise tool.

### **Generation Hash**
SHA-256 hash of generated code to detect if file was modified by user.

---

## UI Terms

### **Navigator Panel**
Left panel showing component tree and file explorer.

### **Editor Panel**
Center panel showing:
- Component preview (isolation or full app)
- Code view (read-only in Level 1)
- Visual graph editor (Level 2)

### **Properties Panel**
Right panel for editing selected component's properties.

### **Component Tree**
Hierarchical view of all components in the project.

### **Visual Graph**
Node-based view showing components and their connections (Level 2).

### **Isolation View**
Preview of a single component with mock props.

---

## Build Terms

### **Vite**
Modern build tool for web apps. Much faster than webpack. Used for generated projects.

### **HMR** (Hot Module Replacement)
Feature that updates code in browser without full reload. Makes development faster.

### **Tree Shaking**
Build optimization that removes unused code from final bundle.

### **Bundler**
Tool that combines all JavaScript files into optimized bundles for production (Vite, webpack, etc.).

---

## Deployment Terms

### **Generated Project**
The standard Vite + React project created by Rise. Can be deployed anywhere.

### **Static Site**
Website with pre-rendered HTML/CSS/JS (no server needed). Most Rise projects are static.

### **Deployment Target**
Platform where app is hosted: Vercel, Netlify, AWS, etc.

### **Zero Lock-in**
Rise's guarantee: generated code is standard and works anywhere. No vendor lock-in.

---

## Development Terms

### **MVP** (Minimum Viable Product)
First release with core features only (Schema Level 1). 14-18 weeks timeline.

### **Post-MVP**
Features added after initial release (Schema Level 2, TypeScript, etc.).

### **P0, P1, P2** (Priority Levels)
- **P0**: Critical, must complete before MVP
- **P1**: Important, should complete in MVP
- **P2**: Nice to have, can defer to post-MVP

### **Scope Creep**
When additional features are added beyond original plan, delaying project.

### **Phase Gate**
Review checkpoint between development phases. Must pass before continuing.

---

## User Roles

### **Low-Code Developer**
Primary user: knows some code but wants visual tools and AI assistance.

### **Developer**
Secondary user: experienced coder who wants rapid scaffolding.

### **No-Code Graduate**
Stretch user: transitioning from pure no-code tools to learning real development.

---

## Common Abbreviations

| Term | Meaning |
|------|---------|
| AI | Artificial Intelligence |
| API | Application Programming Interface |
| AST | Abstract Syntax Tree |
| CRUD | Create, Read, Update, Delete |
| CSP | Content Security Policy |
| CSS | Cascading Style Sheets |
| E2E | End-to-End (testing) |
| HMR | Hot Module Replacement |
| HTML | HyperText Markup Language |
| IPC | Inter-Process Communication |
| JSON | JavaScript Object Notation |
| JSX | JavaScript XML (React syntax) |
| MVP | Minimum Viable Product |
| OS | Operating System |
| P0/P1/P2 | Priority 0, 1, 2 |
| UX | User Experience |
| UI | User Interface |
| VM | Virtual Machine |
| XSS | Cross-Site Scripting |

---

## Framework-Specific Terms

### **React**
JavaScript library for building UIs. MVP framework.

### **Hook**
React function starting with "use" (useState, useEffect, useMemo, etc.).

### **Component Function**
Function that returns JSX:
```jsx
function Button({ label }) {
  return <button>{label}</button>;
}
```

### **JSX**
JavaScript syntax extension that looks like HTML:
```jsx
<Button label="Click me" />
```

### **Props Destructuring**
Extracting props in function signature:
```jsx
function Button({ label, onClick }) { ... }
```

---

## State Management Terms

### **Zustand**
Lightweight state management library used for global state in Rise.

### **Store**
Container for global state (Zustand store).

### **Selector**
Function to extract specific data from store:
```javascript
const user = useGlobalState('currentUser');
```

---

## Plugin System Terms (Post-MVP)

### **Framework Plugin**
Module that generates code for specific framework (React, Vue, Svelte).

### **Plugin Interface**
Contract that all plugins must implement:
```typescript
interface FrameworkPlugin {
  generateComponent(schema: ComponentSchema): string;
  parseComponent(code: string): ComponentSchema;
  // ... other methods
}
```

### **Plugin Sandbox**
Isolated environment where plugins run to prevent malicious code.

---

## Versioning Terms

### **Schema Version**
Version of the JSON manifest format (1.0.0, 2.0.0, etc.).

### **Schema Migration**
Automatic upgrade from older schema version to newer one.

### **Breaking Change**
Update that requires manual intervention (can't auto-migrate).

### **Semantic Versioning**
Version format: MAJOR.MINOR.PATCH (e.g., 1.2.3)
- MAJOR: Breaking changes
- MINOR: New features, backward compatible
- PATCH: Bug fixes

---

## Performance Terms

### **Memoization**
Caching computed values to avoid recalculation (useMemo, React.memo).

### **Lazy Loading**
Loading components/data only when needed, not upfront.

### **Code Splitting**
Breaking app into smaller bundles loaded on demand.

### **Virtual Scrolling**
Rendering only visible items in long lists for performance.

---

## Accessibility Terms

### **ARIA** (Accessible Rich Internet Applications)
HTML attributes for screen readers:
```jsx
<button aria-label="Close dialog">×</button>
```

### **Keyboard Navigation**
Using Tab, Enter, Escape keys to navigate without mouse.

### **Screen Reader**
Software that reads UI aloud for visually impaired users.

### **WCAG** (Web Content Accessibility Guidelines)
Standards for accessible web content (A, AA, AAA levels).

---

## Documentation Terms

### **Getting Started Guide**
Tutorial for new users to learn basic features.

### **API Reference**
Technical documentation of functions, classes, and interfaces.

### **Roadmap**
Plan showing what features will be built and when.

### **Changelog**
List of changes in each version.

### **Architecture Decision Record** (ADR)
Document explaining why specific technical decision was made.

---

## Status Indicators

| Icon | Meaning |
|------|---------|
| ✅ | Complete / Approved |
| ⚠️ | Warning / Partial |
| ❌ | Not supported / Blocked |
| 🔨 | Human developer required |
| ⚡ | AI can handle |
| 🟢 | Low risk |
| 🟡 | Medium risk |
| 🔴 | High risk |
| P0 | Priority 0 (critical) |
| P1 | Priority 1 (important) |
| P2 | Priority 2 (nice to have) |

---

## Common Confusions

### **Manifest vs Schema**
- **Manifest**: The complete JSON file with all components
- **Schema**: The structure/format of that JSON

### **Component vs Element**
- **Component**: Reusable piece (Button, UserCard)
- **Element**: Instance of a component in the tree

### **Static vs Expression**
- **Static**: Fixed value (Level 1)
- **Expression**: Computed value with JavaScript (Level 2)

### **Local vs Global State**
- **Local**: Component-specific, not shared
- **Global**: Shared across components

### **Framework vs Plugin**
- **Framework**: UI library (React, Vue, Svelte)
- **Plugin**: Adapter that generates code for a framework

### **Preview vs Generated App**
- **Preview**: Inside Rise for development
- **Generated App**: Standalone app deployed separately

---

## Anti-patterns to Avoid

### **"Bubble Mode"**
Treating Rise like a pure no-code tool. Remember: you can write real code!

### **"Over-AIing"**
Letting AI do everything without understanding. Always review AI output.

### **"Scope Creeping"**
Adding features beyond MVP plan. Stick to Schema Level 1 for MVP.

### **"Lock-in Thinking"**
Assuming you're stuck with Rise. Generated code is yours to take anywhere.

### **"Magic Syntax"**
Rise doesn't use special syntax. It's just JavaScript!

---

## Related Resources

### Internal Docs
- [COMPONENT_SCHEMA.md](./COMPONENT_SCHEMA.md) - Complete schema reference
- [SCHEMA_LEVELS.md](./SCHEMA_LEVELS.md) - Feature progression
- [SECURITY_SPEC.md](./SECURITY_SPEC.md) - Security architecture
- [ARCHITECTURE.md](./ARCHITECTURE.md) - System design

### External Resources
- [React Docs](https://react.dev/) - Learn React
- [Electron Docs](https://electronjs.org/) - Learn Electron
- [Vite Docs](https://vitejs.dev/) - Learn Vite
- [Zustand Docs](https://zustand.surge.sh/) - Learn Zustand

---

**Last Updated**: October 25, 2025  
**Status**: ✅ Complete  
**Maintained By**: Project team (update when adding new terms)

---

**Contributing**: When adding new features, update this glossary with new terminology. Consistency is key!
