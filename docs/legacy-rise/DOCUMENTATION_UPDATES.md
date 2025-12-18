# Documentation Updates Required

> Summary of changes needed to integrate the Logic System into existing Rise documentation

---

## Files to Update

### 1. SCHEMA_LEVELS.md

**Location**: `docs/SCHEMA_LEVELS.md`

**Changes needed:**

#### Update Level 2 section:

**BEFORE:**
```markdown
## Schema Level 2: Enhanced (Post-MVP)

Adds computed values and event handling:
- Expression system for dynamic properties
- Event handlers (onClick, onChange, etc.)
- Component-local state
- Basic data connections between components
```

**AFTER:**
```markdown
## Schema Level 2: Enhanced (Post-MVP)

Adds computed values, persistent reactive state, and node-based logic:

**Expression System:**
- Template expressions in properties: `{{ state.value }}`
- Computed properties with automatic dependencies
- Expression validation and type checking

**Logic System:**
- Node-based visual logic canvas (React Flow)
- Persistent reactive state (page-level, app-level)
- Event triggers (onClick, onChange, onMount, etc.)
- Logic flows with state nodes, API nodes, action nodes
- Independent flows that share state
- Visual debugging and execution traces

**State Management:**
- Page-level state (persists while page mounted)
- App-level state (persists across pages)
- Component-local state (instance-specific)
- Generated Zustand stores for reactivity

**Data Flow:**
- Components → Logic (events)
- Logic → Components (data binding, actions)
- Logic ↔ State (read/write persistent variables)

**Key Features:**
- Separation of visual building and logic building
- Multiple logic flows running independently
- State persistence throughout page session
- Automatic component re-rendering on state changes
```

---

### 2. DATA_FLOW.md

**Location**: `docs/DATA_FLOW.md`

**Changes needed:**

#### Add new section after "Overview":

```markdown
## State Persistence Model

### The Key Difference: Ephemeral vs Persistent State

Rise's state system uses **persistent reactive state** that survives across logic flow executions:

```javascript
// ❌ Traditional (ephemeral - state dies after function)
function handleClick() {
  let toggle = true;  // Dies when function ends
  showMenu();
}

// ✅ Rise (persistent - state lives throughout page session)
Page State: { toggle: false }

Logic Flow A: [Button Click] → [Set toggle = true]
                                     ↓
                          State persists globally
                                     ↓
Logic Flow B: [Button Click Again] → [Read toggle] → "It's true, toggle it off"
```

**Benefits:**
- Multiple independent logic flows can coordinate through shared state
- Components automatically react to state changes
- State survives across logic flow executions
- No need for complex flow-to-flow connections

### State Scopes

Rise provides three levels of state scope:

1. **App-Level State** (global, persists across pages)
   - User authentication
   - Theme preferences
   - Shopping cart
   - Global settings

2. **Page-Level State** (persists while page mounted)
   - Form data
   - UI toggles (dropdowns, modals)
   - Filters, search terms
   - Validation errors

3. **Component-Level State** (local to instance)
   - Input focus
   - Hover state
   - Animation progress

See [LOGIC_SYSTEM.md](./LOGIC_SYSTEM.md) for complete implementation details.
```

#### Update "Reactive Variables" section:

**ADD:**
```markdown
### State Lifecycle

**Page State:**
1. **Page Mount**: State initialized with defaults from manifest
2. **Logic Flows Execute**: Read and write state values
3. **Components React**: Auto-update when state changes
4. **Logic Flows Re-execute**: Can read updated state
5. **Page Unmount**: State destroyed (unless app-level)

**State Generation:**

Generated Zustand store from manifest:

```typescript
// From manifest state definition
{
  "state": {
    "authMode": { "type": "string", "default": "signup" },
    "email": { "type": "string", "default": "" }
  }
}

// Generated code
import { create } from 'zustand';

export const usePageState = create((set, get) => ({
  authMode: 'signup',
  email: '',
  
  setAuthMode: (mode) => set({ authMode: mode }),
  setEmail: (email) => set({ email }),
  toggleAuthMode: () => set({ 
    authMode: get().authMode === 'login' ? 'signup' : 'login' 
  }),
  
  reset: () => set({ authMode: 'signup', email: '' })
}));
```
```

---

### 3. COMPONENT_SCHEMA.md

**Location**: `docs/COMPONENT_SCHEMA.md`

**Changes needed:**

#### Add new top-level property (in Schema Level 2+):

After the `children` property, add:

```markdown
### `state` (Schema Level 2+)

Page-level or app-level state definitions.

**Type:** `object` (map of variable name → state definition)

**Structure:**
```json
{
  "state": {
    "variableName": {
      "type": "string" | "number" | "boolean" | "object" | "array",
      "default": any,
      "scope": "page" | "app" | "component",
      "description": "Optional description"
    }
  }
}
```

**Example:**
```json
{
  "state": {
    "authMode": {
      "type": "string",
      "default": "signup",
      "scope": "page",
      "description": "Current authentication mode: 'login' or 'signup'"
    },
    "email": {
      "type": "string",
      "default": "",
      "scope": "page"
    },
    "emailError": {
      "type": "boolean",
      "default": false,
      "scope": "page"
    }
  }
}
```

**Notes:**
- State persists throughout the page session (or app session for app-level)
- Generates Zustand store with getters/setters
- All state changes trigger component re-renders
- Can be read/written by logic flows and component bindings

---

### `logicFlows` (Schema Level 2+)

Definition of node-based logic flows for the page/component.

**Type:** `object` (map of flow ID → logic flow definition)

**Structure:**
```json
{
  "logicFlows": {
    "flowId": {
      "id": "string",
      "displayName": "string",
      "trigger": {
        "type": "pageLoad" | "componentEvent" | "customEvent" | "timer",
        "componentId": "string",  // For componentEvent
        "event": "string"         // For componentEvent (onClick, onChange, etc.)
      },
      "reads": ["stateVar1", "stateVar2"],
      "writes": ["stateVar3"],
      "nodes": [
        {
          "id": "string",
          "type": "getState" | "setState" | "httpRequest" | "ifElse" | ...,
          "config": { /* node-specific config */ },
          "position": { "x": number, "y": number }
        }
      ],
      "connections": [
        {
          "from": "nodeId",
          "fromPort": "output",
          "to": "nodeId",
          "toPort": "input"
        }
      ]
    }
  }
}
```

**Example:**
```json
{
  "logicFlows": {
    "handleToggleMode": {
      "id": "flow_toggle_001",
      "displayName": "Handle Toggle Mode",
      "trigger": {
        "type": "componentEvent",
        "componentId": "toggle-button",
        "event": "onClick"
      },
      "reads": ["authMode"],
      "writes": ["authMode"],
      "nodes": [
        {
          "id": "node_001",
          "type": "toggleState",
          "config": {
            "variable": "authMode",
            "values": ["login", "signup"]
          },
          "position": { "x": 100, "y": 100 }
        }
      ],
      "connections": []
    }
  }
}
```

**Notes:**
- Each flow becomes a generated function
- Flows are triggered by events or lifecycle hooks
- Nodes are executed based on connection topology
- Can access and modify page/app state
- Visual editor uses React Flow for node canvas

See [LOGIC_SYSTEM.md](./LOGIC_SYSTEM.md) for complete node types and patterns.
```

---

### 4. ARCHITECTURE.md

**Location**: `docs/ARCHITECTURE.md`

**Changes needed:**

#### Update "Technology Stack" section:

Under "Visualization", add:

```markdown
### Visualization
- **Component Graph**: React Flow
- **Logic Canvas**: React Flow (node-based logic editor)
- **File Tree**: react-arborist
- **Preview**: Embedded Vite dev server in Electron webview
```

#### Add new section after "Core Components":

```markdown
### 5. Logic System (Schema Level 2+)

**Responsibility**: Visual node-based logic with persistent reactive state

```typescript
interface LogicSystem {
  // State management
  createStateStore(stateDefinition: StateDefinition): ZustandStore;
  
  // Logic flow execution
  executeFlow(flowId: string, trigger: Event): Promise<void>;
  
  // Node execution
  executeNode(node: LogicNode, context: ExecutionContext): Promise<any>;
  
  // State access
  getState(variable: string, scope: 'page' | 'app'): any;
  setState(variable: string, value: any, scope: 'page' | 'app'): void;
  
  // Debugging
  traceExecution(flowId: string): ExecutionTrace;
  getStateHistory(): StateChange[];
}

interface LogicNode {
  id: string;
  type: NodeType;
  config: Record<string, any>;
  position: { x: number; y: number };
}

type NodeType = 
  | 'getState' | 'setState' | 'toggleState'
  | 'ifElse' | 'switch' | 'loop'
  | 'httpRequest' | 'parseJson'
  | 'navigate' | 'showToast' | 'focus'
  | 'getUrlParam' | 'localStorage'
  | 'custom';
```

**Implementation:**
- React Flow for visual node canvas
- Zustand for state management
- Topological sort for node execution order
- Code generation from logic flows to JavaScript functions

**Key Features:**
- Persistent reactive state (page-level, app-level)
- Independent logic flows sharing state
- Visual debugging with execution traces
- State inspector with change history
- Breakpoints and step-through debugging

See [LOGIC_SYSTEM.md](./docs/LOGIC_SYSTEM.md) for detailed design.
```

---

### 5. GLOSSARY.md

**Location**: `docs/GLOSSARY.md`

**Changes needed:**

#### Add new section "Logic System Terms (Schema Level 2+)":

```markdown
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
```

---

### 6. EXAMPLES.md

**Location**: `docs/EXAMPLES.md`

**Changes needed:**

#### Add new comprehensive example:

```markdown
## Example 4: Login/Signup Page with Logic Flows

**Description**: Complete authentication page demonstrating persistent state, multiple independent logic flows, and component reactivity.

**Features:**
- Page-level persistent state
- URL parameter detection on page load
- Toggle between login/signup modes
- Form validation
- API calls with error handling
- Component auto-updates based on state

### Visual Structure

```
LoginSignupPage
├── Container (id: "auth-container")
│   ├── Text (id: "auth-title")
│   │   └─ text: {{ state.authMode === 'login' ? 'Log In' : 'Sign Up' }}
│   ├── Input (id: "email-field")
│   │   ├─ value: {{ state.email }}
│   │   └─ className: {{ state.emailError ? 'border-red-500' : 'border-gray-300' }}
│   ├── Input (id: "password-field")
│   ├── Input (id: "confirm-password" - hidden: {{ state.authMode === 'login' }})
│   ├── Button (id: "action-button")
│   │   ├─ text: {{ state.authMode === 'login' ? 'Log In' : 'Sign Up' }}
│   │   ├─ disabled: {{ state.email === '' }}
│   │   └─ [onClick] ⚡
│   └── Button (id: "toggle-mode-button")
│       ├─ text: {{ state.authMode === 'login' ? 'Need account?' : 'Have account?' }}
│       └─ [onClick] ⚡
```

### State Definition

```json
{
  "state": {
    "authMode": {
      "type": "string",
      "default": "signup",
      "scope": "page"
    },
    "email": {
      "type": "string",
      "default": "",
      "scope": "page"
    },
    "password": {
      "type": "string",
      "default": "",
      "scope": "page"
    },
    "emailError": {
      "type": "boolean",
      "default": false,
      "scope": "page"
    }
  }
}
```

### Logic Flows

**Flow 1: Page Load (detects URL param)**

```
[Page Load] → [Get URL Param "page"] → [If param === "login"]
                                              ↓
                                     [Set authMode = "login"]
```

**Flow 2: Toggle Mode (switches login ↔ signup)**

```
[toggle-button.clicked] → [Toggle State: authMode]
```

**Flow 3: Handle Submit (validates & calls API)**

```
[action-button.clicked] → [Validate email & password]
                               ↓              ↓
                          valid?          invalid
                               ↓              ↓
                        [Get authMode]  [Set emailError = true]
                               ↓
                        [Switch Case]
                         ↓          ↓
                    "login"    "signup"
                         ↓          ↓
                  [API Call]  [API Call]
                    /login      /signup
                         ↓          ↓
                    ┌────┴──────────┴────┐
                success              error
                    ↓                  ↓
              [Navigate]         [Show Toast]
              /dashboard         [Set showError]
```

### Generated Code

```javascript
import { create } from 'zustand';

// Generated state store
const useLoginPageState = create((set, get) => ({
  authMode: 'signup',
  email: '',
  password: '',
  emailError: false,
  
  setAuthMode: (mode) => set({ authMode: mode }),
  setEmail: (email) => set({ email }),
  setPassword: (password) => set({ password }),
  setEmailError: (error) => set({ emailError: error }),
  toggleAuthMode: () => set({ 
    authMode: get().authMode === 'login' ? 'signup' : 'login' 
  }),
}));

// Flow 1: Page Load Handler
const handlePageLoad = () => {
  const urlParams = new URLSearchParams(window.location.search);
  const pageParam = urlParams.get('page');
  
  if (pageParam === 'login') {
    useLoginPageState.getState().setAuthMode('login');
  }
};

// Flow 2: Toggle Mode Handler
const handleToggleMode = () => {
  useLoginPageState.getState().toggleAuthMode();
};

// Flow 3: Submit Handler
const handleSubmit = async () => {
  const state = useLoginPageState.getState();
  const { authMode, email, password } = state;
  
  // Validate
  if (!email || !password) {
    state.setEmailError(true);
    return;
  }
  
  // Call API
  try {
    const endpoint = authMode === 'login' ? '/api/auth/login' : '/api/auth/signup';
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    
    if (response.ok) {
      navigate('/dashboard');
    } else {
      throw new Error('Authentication failed');
    }
  } catch (error) {
    toast.show('error', error.message);
  }
};

// Generated component
export default function LoginSignupPage() {
  const authMode = useLoginPageState(s => s.authMode);
  const email = useLoginPageState(s => s.email);
  const emailError = useLoginPageState(s => s.emailError);
  
  useEffect(() => {
    handlePageLoad();
  }, []);
  
  return (
    <div className="auth-container">
      <h1>{authMode === 'login' ? 'Log In' : 'Sign Up'}</h1>
      
      <input
        type="email"
        value={email}
        onChange={(e) => useLoginPageState.getState().setEmail(e.target.value)}
        className={emailError ? 'border-red-500' : 'border-gray-300'}
      />
      
      <input
        type="password"
        value={password}
        onChange={(e) => useLoginPageState.getState().setPassword(e.target.value)}
      />
      
      {authMode === 'signup' && (
        <input type="password" placeholder="Confirm Password" />
      )}
      
      <button 
        onClick={handleSubmit}
        disabled={!email}
      >
        {authMode === 'login' ? 'Log In' : 'Sign Up'}
      </button>
      
      <button onClick={handleToggleMode}>
        {authMode === 'login' ? 'Need an account?' : 'Already have an account?'}
      </button>
    </div>
  );
}
```

**Key Concepts Demonstrated:**
1. **Persistent State**: `authMode` set by one flow, read by others
2. **Independent Flows**: Three separate flows coordinate via shared state
3. **Component Reactivity**: UI auto-updates when state changes
4. **Data Binding**: Template expressions like `{{ state.authMode }}`
5. **Event Handling**: Button clicks trigger logic flows
6. **State Lifecycle**: State persists until page unmount

See [LOGIC_SYSTEM.md](./LOGIC_SYSTEM.md) for complete logic system documentation.
```

---

### 7. DOCUMENTATION_INDEX.md

**Location**: `DOCUMENTATION_INDEX.md`

**Changes needed:**

#### Under "Key Features" section, add:

```markdown
7. **[LOGIC_SYSTEM.md](./docs/LOGIC_SYSTEM.md)** - ✅ **COMPLETE** - Node-based visual logic with persistent reactive state
```

#### Update reading order:

For **Developers** section, add after EXPRESSION_SYSTEM.md:

```markdown
7. LOGIC_SYSTEM.md (node-based logic)
```

---

### 8. README.md

**Location**: `README.md`

**Changes needed:**

#### In the "NOT in MVP" section, update:

**BEFORE:**
```markdown
- ❌ State management (Level 2)
- ❌ Event handlers (Level 2)
```

**AFTER:**
```markdown
- ❌ Logic system with node-based editor (Level 2)
- ❌ Persistent reactive state management (Level 2)
- ❌ Event handlers with visual logic flows (Level 2)
```

#### Update the "Deferred to Post-MVP" explanation:

**ADD:**
```markdown
**Logic System (Level 2):**
- Node-based visual logic editor (React Flow)
- Persistent reactive state (page-level, app-level)
- Event triggers and logic flows
- State nodes, API nodes, action nodes
- Visual debugging and execution traces
- See [LOGIC_SYSTEM.md](./docs/LOGIC_SYSTEM.md)
```

---

## Summary of New Files

### Created:
1. ✅ **docs/LOGIC_SYSTEM.md** - Complete documentation of node-based logic system

### To Update:
1. ⏳ **docs/SCHEMA_LEVELS.md** - Expand Level 2 description
2. ⏳ **docs/DATA_FLOW.md** - Add persistent state model section
3. ⏳ **docs/COMPONENT_SCHEMA.md** - Add `state` and `logicFlows` properties
4. ⏳ **docs/ARCHITECTURE.md** - Add Logic System component
5. ⏳ **docs/GLOSSARY.md** - Add logic system terminology
6. ⏳ **docs/EXAMPLES.md** - Add login/signup example
7. ⏳ **DOCUMENTATION_INDEX.md** - Add LOGIC_SYSTEM.md reference
8. ⏳ **README.md** - Update Level 2 scope description

---

## Implementation Priority

**Phase 1 (Documentation Complete):**
1. Create LOGIC_SYSTEM.md ✅
2. Update SCHEMA_LEVELS.md
3. Update COMPONENT_SCHEMA.md
4. Update README.md

**Phase 2 (Extended Documentation):**
5. Update DATA_FLOW.md
6. Update ARCHITECTURE.md
7. Update GLOSSARY.md

**Phase 3 (Examples & Polish):**
8. Update EXAMPLES.md
9. Update DOCUMENTATION_INDEX.md
10. Review all docs for consistency

---

**Note**: All updates maintain backward compatibility with Schema Level 1 (MVP). Logic system is clearly marked as Level 2 (Post-MVP) throughout documentation.