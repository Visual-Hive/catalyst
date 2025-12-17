# Logic System

> Node-based visual logic with persistent reactive state management

**Status**: 📋 Planned for Schema Level 2 | **Inspiration**: Noodl, Toddle, Backendless

---

## Overview

Rise separates **visual building** (what users see) from **logic building** (what happens when they interact). This separation provides:

- **Cleaner mental model**: Structure vs. behavior
- **Better organization**: Logic doesn't clutter the visual tree
- **Independent flows**: Multiple logic components can run independently while sharing state
- **Reusability**: Logic flows can be saved as templates
- **Debuggability**: Test logic flows in isolation

## Core Concepts

### The Three Bridges

Visual components and logic flows connect through three key mechanisms:

```
┌─────────────────┐
│ Visual Builder  │  "Here's what the user sees"
└────────┬────────┘
         │
    ┌────┴────┬─────────┬────────┐
    │         │         │        │
 Events    State    Actions   Data Binding
    │         │         │        │
    ↓         ↓         ↓        ↓
┌─────────────────────────────────┐
│      Logic Canvas               │  "Here's what happens"
└─────────────────────────────────┘
```

**1. Events** (Components → Logic)
- User interactions trigger logic flows
- `onClick`, `onChange`, `onMount`, etc.

**2. State** (Shared Data Layer)
- Persistent reactive variables
- Survives across logic flow executions
- Automatically updates all subscribers

**3. Actions** (Logic → Components)
- Direct component manipulation
- `Toast.show()`, `Navigate`, `ScrollTo`

**4. Data Binding** (State → Components)
- Template expressions: `{{ state.authMode }}`
- Automatic re-rendering on state changes

---

## Persistent Reactive State

### The Key Innovation

Unlike ephemeral function-local state, Rise's state **persists throughout the page session**:

```javascript
// ❌ Traditional approach (state dies after function)
function handleClick() {
  let toggle = true;  // Dies when function ends
  showMenu();
}

// ✅ Rise approach (state persists)
Page State: { toggle: false }

Logic Flow A: [Button Click] → [Set toggle = true]
                                     ↓
                          State persists globally
                                     ↓
Logic Flow B: [Read toggle] → "It's true now!"
```

### State Scopes

Rise provides three levels of state scope:

```
┌────────────────────────────────────────────────────┐
│ App-Level State (persists across pages)           │
│  - User authentication                             │
│  - Theme preferences                               │
│  - Shopping cart                                   │
│  - Global settings                                 │
└────────────────────────────────────────────────────┘
                     ↓
┌────────────────────────────────────────────────────┐
│ Page-Level State (persists while page mounted)    │
│  - Form data                                       │
│  - UI toggles (dropdowns, modals)                 │
│  - Current filters, search terms                  │
│  - Validation errors                              │
└────────────────────────────────────────────────────┘
                     ↓
┌────────────────────────────────────────────────────┐
│ Component-Level State (local to instance)         │
│  - Input focus state                               │
│  - Hover state                                     │
│  - Animation progress                              │
└────────────────────────────────────────────────────┘
```

### State Lifecycle

**Page State Example:**

```typescript
// Generated Zustand store for LoginPage
export const useLoginPageState = create((set, get) => ({
  // Initial state (defined in manifest)
  authMode: 'signup',
  email: '',
  emailError: false,
  
  // Actions (generated from logic flows)
  setAuthMode: (mode) => set({ authMode: mode }),
  setEmail: (email) => set({ email }),
  setEmailError: (hasError) => set({ emailError: hasError }),
  
  // Convenience toggle
  toggleAuthMode: () => set({ 
    authMode: get().authMode === 'login' ? 'signup' : 'login' 
  }),
  
  // Reset to initial state
  reset: () => set({ authMode: 'signup', email: '', emailError: false })
}));
```

**Lifecycle:**
1. **Page Mount**: State initialized with defaults
2. **Logic Flows Execute**: Read and write state
3. **Components React**: Auto-update when state changes
4. **Page Unmount**: State destroyed (unless app-level)

---

## Logic Canvas Interface

### UI Layout

**Toddle-Style Layout (Recommended):**

```
┌──────────────────────────────────────────────────────┐
│ Visual Builder: DOM Tree + Live Preview             │
│                                                      │
│ [Selected: Button "action-button"]                  │
│ Properties: text, disabled, onClick ⚡               │
└──────────────────────────────────────────────────────┘
                        ↓
┌──────────────────────────────────────────────────────┐
│ Logic Canvas ──────────────────── [Expand ⛶] [- ✕] │
├──────────────────────────────────────────────────────┤
│                                                      │
│ ┌─ Page State ────────────────────────────────────┐ │
│ │ authMode: "signup"    email: ""                 │ │
│ │ emailError: false     showError: false          │ │
│ └──────────────────────────────────────────────────┘ │
│                                                      │
│ Flows: [All] [Page Load] [Interactions] [Custom]    │
│                                                      │
│ ┌─ Flow: Page Load ────────────────────────────────┐ │
│ │ [Page Load] → [Get URL Param] → [Switch]        │ │
│ │                   ↓                  ↓           │ │
│ │              paramValue      [Set authMode]      │ │
│ └──────────────────────────────────────────────────┘ │
│                                                      │
│ ┌─ Flow: action-button.clicked ◀─ Highlighted ────┐ │
│ │ [Button Clicked] → [Validate] → [Switch]        │ │
│ │                        ↓              ↓          │ │
│ │                   valid?    [login/signup]       │ │
│ │                    ├─────────┬──────────┐        │ │
│ │                    ↓         ↓          ↓        │ │
│ │              [Set Error] [API Login] [API Signup]│ │
│ └──────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────┘
```

### Navigation Between Views

**From Visual Builder:**
- Click component's `⚡` event indicator → Opens logic canvas focused on that flow
- Click "Logic" tab at bottom → Opens full logic canvas view

**From Logic Canvas:**
- Click node referencing a component → Highlights component in visual builder
- Click state variable → Shows all components bound to it

---

## Node Types

### Event Nodes (Triggers)

Entry points for logic flows:

```
┌─────────────────┐
│ Page Load       │  Fires when page mounts
│                 │ → output: void
└─────────────────┘

┌─────────────────┐
│ Component Event │  Fires on user interaction
│ ─ ─ ─ ─ ─ ─ ─ ─│
│ component: btn  │  component: button ID
│ event: onClick  │  event: onClick, onChange, etc.
│                 │ → output: event data
└─────────────────┘

┌─────────────────┐
│ Timer           │  Fires after delay
│ ─ ─ ─ ─ ─ ─ ─ ─│
│ delay: 2000ms   │
│                 │ → output: void
└─────────────────┘

┌─────────────────┐
│ Custom Event    │  Fires when triggered by logic
│ ─ ─ ─ ─ ─ ─ ─ ─│
│ name: "refresh" │
│                 │ → output: payload
└─────────────────┘
```

### State Nodes

Read and write persistent state:

```
┌─────────────────┐
│ Get State       │  Read state variable
│ ─ ─ ─ ─ ─ ─ ─ ─│
│ variable: email │  input: none
│ scope: page     │ → output: current value
└─────────────────┘

┌─────────────────┐
│ Set State       │  Write state variable
│ ─ ─ ─ ─ ─ ─ ─ ─│
│ variable: email │ ← input: new value
│ scope: page     │ → output: void (triggers reactivity)
└─────────────────┘

┌─────────────────┐
│ Toggle State    │  Flip boolean or cycle values
│ ─ ─ ─ ─ ─ ─ ─ ─│
│ variable: mode  │  input: none
│ values: [a, b]  │ → output: new value
└─────────────────┘

┌─────────────────┐
│ Update State    │  Merge object properties
│ ─ ─ ─ ─ ─ ─ ─ ─│
│ variable: user  │ ← input: { name: "John" }
│ merge: true     │ → output: updated object
└─────────────────┘

┌─────────────────┐
│ Clear State     │  Reset to default
│ ─ ─ ─ ─ ─ ─ ─ ─│
│ variables: [    │  input: none
│   emailError,   │ → output: void
│   showError ]   │
└─────────────────┘
```

### Logic Nodes

Control flow and data transformation:

```
┌─────────────────┐
│ If/Else         │  Conditional branch
│ ─ ─ ─ ─ ─ ─ ─ ─│
│ condition       │ ← input: boolean expression
│                 │ → output true: path A
│                 │ → output false: path B
└─────────────────┘

┌─────────────────┐
│ Switch/Case     │  Multiple branches
│ ─ ─ ─ ─ ─ ─ ─ ─│
│ value           │ ← input: any value
│ cases: {        │ → output case1: path A
│   login: ...,   │ → output case2: path B
│   signup: ...   │ → output default: path C
│ }               │
└─────────────────┘

┌─────────────────┐
│ Loop            │  Iterate array
│ ─ ─ ─ ─ ─ ─ ─ ─│
│ array           │ ← input: array
│                 │ → output: for each item
└─────────────────┘

┌─────────────────┐
│ Transform       │  Map/filter/reduce
│ ─ ─ ─ ─ ─ ─ ─ ─│
│ operation       │ ← input: array
│ expression      │ → output: transformed
└─────────────────┘

┌─────────────────┐
│ Validate        │  Check conditions
│ ─ ─ ─ ─ ─ ─ ─ ─│
│ rules: [        │ ← input: values
│   email: regex, │ → output: { valid, errors }
│   required, ... │
│ ]               │
└─────────────────┘
```

### API Nodes

External data interactions:

```
┌─────────────────┐
│ HTTP Request    │  Call API endpoint
│ ─ ─ ─ ─ ─ ─ ─ ─│
│ method: POST    │ ← input: body, headers
│ url: /api/auth  │ → output success: response
│ timeout: 5000   │ → output error: error
└─────────────────┘

┌─────────────────┐
│ Parse JSON      │  Parse response
│ ─ ─ ─ ─ ─ ─ ─ ─│
│                 │ ← input: string
│                 │ → output: object
└─────────────────┘

┌─────────────────┐
│ Error Handler   │  Catch errors
│ ─ ─ ─ ─ ─ ─ ─ ─│
│ retry: 3        │ ← input: promise
│ fallback: ...   │ → output success: data
│                 │ → output error: error
└─────────────────┘
```

### Action Nodes

Trigger side effects:

```
┌─────────────────┐
│ Navigate        │  Change route
│ ─ ─ ─ ─ ─ ─ ─ ─│
│ to: /dashboard  │ ← input: path
│ replace: false  │ → output: void
└─────────────────┘

┌─────────────────┐
│ Show Toast      │  Display notification
│ ─ ─ ─ ─ ─ ─ ─ ─│
│ type: error     │ ← input: message
│ duration: 3000  │ → output: void
└─────────────────┘

┌─────────────────┐
│ Scroll To       │  Scroll to element
│ ─ ─ ─ ─ ─ ─ ─ ─│
│ target: #footer │ ← input: selector
│ smooth: true    │ → output: void
└─────────────────┘

┌─────────────────┐
│ Focus           │  Focus input
│ ─ ─ ─ ─ ─ ─ ─ ─│
│ target: #email  │ ← input: component ID
│                 │ → output: void
└─────────────────┘

┌─────────────────┐
│ Console Log     │  Debug output
│ ─ ─ ─ ─ ─ ─ ─ ─│
│ level: info     │ ← input: any value
│                 │ → output: void (logs to console)
└─────────────────┘

┌─────────────────┐
│ Trigger Event   │  Fire custom event
│ ─ ─ ─ ─ ─ ─ ─ ─│
│ event: "refresh"│ ← input: payload
│                 │ → output: void (triggers listeners)
└─────────────────┘
```

### Data Nodes

Access external data sources:

```
┌─────────────────┐
│ Get URL Param   │  Read query string
│ ─ ─ ─ ─ ─ ─ ─ ─│
│ param: "page"   │  input: none
│                 │ → output: value
└─────────────────┘

┌─────────────────┐
│ Local Storage   │  Read/write browser storage
│ ─ ─ ─ ─ ─ ─ ─ ─│
│ key: "userData" │ ← input: value (set)
│ operation: get  │ → output: value (get)
└─────────────────┘

┌─────────────────┐
│ Session Storage │  Read/write session storage
│ ─ ─ ─ ─ ─ ─ ─ ─│
│ key: "token"    │ ← input: value (set)
│ operation: set  │ → output: value (get)
└─────────────────┘

┌─────────────────┐
│ Date/Time       │  Get current date/time
│ ─ ─ ─ ─ ─ ─ ─ ─│
│ format: ISO     │  input: none
│                 │ → output: date string
└─────────────────┘
```

---

## Complete Example: Login/Signup Page

### Visual Builder Structure

```
Page: LoginSignupPage
├── Container (id: "auth-container")
│   ├── Text (id: "auth-title")
│   │   └─ text: {{ state.authMode === 'login' ? 'Log In' : 'Sign Up' }}
│   ├── Input (id: "email-field")
│   │   ├─ value: {{ state.email }}
│   │   ├─ error: {{ state.emailError }}
│   │   └─ className: {{ state.emailError ? 'border-red-500' : 'border-gray-300' }}
│   ├── Input (id: "password-field")
│   │   └─ value: {{ state.password }}
│   ├── Input (id: "confirm-password" - hidden: {{ state.authMode === 'login' }})
│   │   └─ value: {{ state.confirmPassword }}
│   ├── Button (id: "action-button")
│   │   ├─ text: {{ state.authMode === 'login' ? 'Log In' : 'Sign Up' }}
│   │   ├─ disabled: {{ state.email === '' }}
│   │   ├─ backgroundColor: {{ state.email === '' ? '#6B7280' : '#3B82F6' }}
│   │   └─ [onClick] ⚡ → fires "action-button.clicked"
│   ├── Button (id: "toggle-mode-button")
│   │   ├─ text: {{ state.authMode === 'login' ? 'Need an account?' : 'Already have an account?' }}
│   │   └─ [onClick] ⚡ → fires "toggle-mode.clicked"
│   └── Text (id: "error-message" - hidden: {{ !state.showError }})
│       └─ text: {{ state.errorMessage }}
└── Toast (id: "toast-notification")
```

### State Definition

```json
{
  "pageId": "login-signup-page",
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
    "confirmPassword": {
      "type": "string",
      "default": "",
      "scope": "page"
    },
    "emailError": {
      "type": "boolean",
      "default": false,
      "scope": "page"
    },
    "showError": {
      "type": "boolean",
      "default": false,
      "scope": "page"
    },
    "errorMessage": {
      "type": "string",
      "default": "",
      "scope": "page"
    }
  }
}
```

### Logic Flows

#### Flow 1: Page Load Handler

```
┌─────────────────────────────────────────────────────────────┐
│ Flow: handlePageLoad                                        │
│ Trigger: Page Load                                          │
│ Reads: []                                                   │
│ Writes: [authMode]                                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  [Page Load] → [Get URL Param] → [If/Else]                │
│                     ↓                  ↓                    │
│                paramValue      param === "login"?           │
│                                       ↓                     │
│                              [Set authMode = "login"]       │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Generated Code:**

```javascript
const handlePageLoad = () => {
  const state = useLoginSignupPageState.getState();
  const urlParams = new URLSearchParams(window.location.search);
  const pageParam = urlParams.get('page');
  
  if (pageParam === 'login') {
    state.setAuthMode('login');
  }
};
```

#### Flow 2: Toggle Mode Handler

```
┌─────────────────────────────────────────────────────────────┐
│ Flow: handleToggleMode                                      │
│ Trigger: toggle-mode-button.clicked                        │
│ Reads: [authMode]                                          │
│ Writes: [authMode]                                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  [Button Clicked] → [Toggle State]                         │
│                           ↓                                 │
│                     authMode                                │
│                 (signup ↔ login)                            │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Generated Code:**

```javascript
const handleToggleMode = () => {
  const state = useLoginSignupPageState.getState();
  state.toggleAuthMode();
};
```

#### Flow 3: Action Button Handler

```
┌─────────────────────────────────────────────────────────────┐
│ Flow: handleActionButton                                    │
│ Trigger: action-button.clicked                             │
│ Reads: [authMode, email, password, confirmPassword]        │
│ Writes: [emailError, showError, errorMessage]              │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  [Button Clicked] → [Validate Fields]                      │
│                           ↓                                 │
│                     ┌─────┴─────┐                          │
│                valid?            invalid                    │
│                     ↓                 ↓                     │
│            [Get authMode]    [Set emailError = true]       │
│                     ↓                                       │
│            [Switch/Case]                                    │
│              ↓         ↓                                    │
│         "login"    "signup"                                 │
│              ↓         ↓                                    │
│       [HTTP POST   [HTTP POST                               │
│        /auth/login] /auth/signup]                          │
│              ↓         ↓                                    │
│         ┌────┴────┬────┴────┐                              │
│      success    error      error                           │
│         ↓          ↓          ↓                            │
│    [Navigate] [Set Error] [Set Error]                      │
│    /dashboard      ↓          ↓                            │
│              [Show Toast] [Show Toast]                      │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Generated Code:**

```javascript
const handleActionButton = async () => {
  const state = useLoginSignupPageState.getState();
  const { authMode, email, password, confirmPassword } = state;
  
  // Validate
  const isValid = email && password && 
    (authMode === 'login' || confirmPassword);
  
  if (!isValid) {
    state.setEmailError(true);
    return;
  }
  
  // Clear previous errors
  state.clearError();
  
  try {
    const endpoint = authMode === 'login' 
      ? '/api/auth/login' 
      : '/api/auth/signup';
    
    const body = authMode === 'login'
      ? { email, password }
      : { email, password, confirmPassword };
    
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    
    if (response.ok) {
      // Success - navigate
      navigate('/dashboard');
    } else {
      throw new Error('Authentication failed');
    }
  } catch (error) {
    // Error handling
    state.setError('Something went wrong. Please try again.');
    toast.show('error', error.message);
  }
};
```

### Visual Connections

**State → Components (Data Binding):**

```
State: authMode = "signup"
              ↓
┌─────────────────────────────────────┐
│ Components that auto-update:        │
├─────────────────────────────────────┤
│ • auth-title.text                   │
│ • action-button.text                │
│ • confirm-password.hidden           │
│ • toggle-mode-button.text           │
└─────────────────────────────────────┘

State: emailError = true
              ↓
┌─────────────────────────────────────┐
│ Components that auto-update:        │
├─────────────────────────────────────┤
│ • email-field.className             │
│ • email-field.error                 │
└─────────────────────────────────────┘
```

---

## Manifest Storage Format

### Page with Logic

```json
{
  "type": "page",
  "id": "login-signup-page",
  "displayName": "Login/Signup Page",
  
  "state": {
    "authMode": {
      "type": "string",
      "default": "signup",
      "scope": "page",
      "description": "Current authentication mode"
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
  },
  
  "logicFlows": {
    "handlePageLoad": {
      "id": "flow_page_load_001",
      "displayName": "Handle Page Load",
      "trigger": {
        "type": "pageLoad"
      },
      "reads": [],
      "writes": ["authMode"],
      "nodes": [
        {
          "id": "node_001",
          "type": "getUrlParam",
          "config": {
            "param": "page"
          },
          "position": { "x": 100, "y": 100 }
        },
        {
          "id": "node_002",
          "type": "ifElse",
          "config": {
            "condition": "{{ $node_001 === 'login' }}"
          },
          "position": { "x": 300, "y": 100 }
        },
        {
          "id": "node_003",
          "type": "setState",
          "config": {
            "variable": "authMode",
            "value": "login"
          },
          "position": { "x": 500, "y": 100 }
        }
      ],
      "connections": [
        {
          "from": "node_001",
          "fromPort": "output",
          "to": "node_002",
          "toPort": "input"
        },
        {
          "from": "node_002",
          "fromPort": "true",
          "to": "node_003",
          "toPort": "input"
        }
      ]
    },
    
    "handleToggleMode": {
      "id": "flow_toggle_001",
      "displayName": "Handle Toggle Mode",
      "trigger": {
        "type": "componentEvent",
        "componentId": "toggle-mode-button",
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
    },
    
    "handleActionButton": {
      "id": "flow_action_001",
      "displayName": "Handle Action Button",
      "trigger": {
        "type": "componentEvent",
        "componentId": "action-button",
        "event": "onClick"
      },
      "reads": ["authMode", "email", "password", "confirmPassword"],
      "writes": ["emailError", "showError", "errorMessage"],
      "nodes": [
        // ... nodes for validation, API calls, etc.
      ],
      "connections": [
        // ... connections between nodes
      ]
    }
  },
  
  "children": [
    // ... visual components
  ]
}
```

---

## Implementation with React Flow

### React Flow Setup

```bash
npm install reactflow
```

### Custom Node Types

```typescript
// Custom node components for Rise
import { Handle, Position } from 'reactflow';

// State Get Node
export const GetStateNode = ({ data }) => {
  return (
    <div className="px-4 py-2 shadow-md rounded-md bg-white border-2 border-blue-500">
      <div className="font-bold text-sm">Get State</div>
      <div className="text-xs text-gray-500">{data.variable}</div>
      <Handle type="source" position={Position.Right} />
    </div>
  );
};

// State Set Node
export const SetStateNode = ({ data }) => {
  return (
    <div className="px-4 py-2 shadow-md rounded-md bg-white border-2 border-green-500">
      <div className="font-bold text-sm">Set State</div>
      <div className="text-xs text-gray-500">{data.variable}</div>
      <Handle type="target" position={Position.Left} />
    </div>
  );
};

// HTTP Request Node
export const HttpNode = ({ data }) => {
  return (
    <div className="px-4 py-2 shadow-md rounded-md bg-white border-2 border-purple-500">
      <div className="font-bold text-sm">HTTP Request</div>
      <div className="text-xs text-gray-500">{data.method} {data.url}</div>
      <Handle type="target" position={Position.Left} id="input" />
      <Handle type="source" position={Position.Right} id="success" />
      <Handle type="source" position={Position.Bottom} id="error" />
    </div>
  );
};

const nodeTypes = {
  getState: GetStateNode,
  setState: SetStateNode,
  httpRequest: HttpNode,
  // ... more node types
};
```

### Logic Canvas Component

```typescript
import ReactFlow, { Background, Controls, MiniMap } from 'reactflow';
import 'reactflow/dist/style.css';

export const LogicCanvas = ({ flowId, nodes, edges, onNodesChange, onEdgesChange }) => {
  return (
    <div style={{ height: '400px' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        fitView
      >
        <Background />
        <Controls />
        <MiniMap />
      </ReactFlow>
    </div>
  );
};
```

---

## Code Generation Strategy

### From Logic Flow to Code

Each logic flow becomes a function:

```typescript
// Generator
class LogicFlowGenerator {
  generate(flow: LogicFlow): string {
    const functionName = flow.id;
    const nodes = this.topologicalSort(flow.nodes, flow.connections);
    
    const code = `
const ${functionName} = async () => {
  const state = use${flow.pageId}State.getState();
  
  ${nodes.map(node => this.generateNodeCode(node)).join('\n  ')}
};
    `.trim();
    
    return code;
  }
  
  generateNodeCode(node: LogicNode): string {
    switch (node.type) {
      case 'getState':
        return `const ${node.id} = state.${node.config.variable};`;
      
      case 'setState':
        return `state.set${capitalize(node.config.variable)}(${node.config.value});`;
      
      case 'httpRequest':
        return `
const ${node.id} = await fetch('${node.config.url}', {
  method: '${node.config.method}',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(${node.config.body})
});
        `.trim();
      
      // ... more node types
    }
  }
}
```

### Generated Component with Logic

```jsx
import React from 'react';
import { create } from 'zustand';

// Generated state store
const useLoginSignupPageState = create((set, get) => ({
  authMode: 'signup',
  email: '',
  emailError: false,
  
  setAuthMode: (mode) => set({ authMode: mode }),
  setEmail: (email) => set({ email }),
  setEmailError: (hasError) => set({ emailError: hasError }),
  toggleAuthMode: () => set({ 
    authMode: get().authMode === 'login' ? 'signup' : 'login' 
  }),
}));

// Generated logic flows
const handlePageLoad = () => {
  const state = useLoginSignupPageState.getState();
  const urlParams = new URLSearchParams(window.location.search);
  const pageParam = urlParams.get('page');
  
  if (pageParam === 'login') {
    state.setAuthMode('login');
  }
};

const handleToggleMode = () => {
  const state = useLoginSignupPageState.getState();
  state.toggleAuthMode();
};

// Generated component
export default function LoginSignupPage() {
  const authMode = useLoginSignupPageState(state => state.authMode);
  const email = useLoginSignupPageState(state => state.email);
  const emailError = useLoginSignupPageState(state => state.emailError);
  
  React.useEffect(() => {
    handlePageLoad();
  }, []);
  
  return (
    <div className="auth-container">
      <h1>{authMode === 'login' ? 'Log In' : 'Sign Up'}</h1>
      
      <input
        type="email"
        value={email}
        onChange={(e) => useLoginSignupPageState.getState().setEmail(e.target.value)}
        className={emailError ? 'border-red-500' : 'border-gray-300'}
      />
      
      <button onClick={handleToggleMode}>
        {authMode === 'login' ? 'Need an account?' : 'Already have an account?'}
      </button>
    </div>
  );
}
```

---

## Debugging Features

### State Inspector

```
┌─ State Inspector ────────────────────────────────────┐
│ Page: LoginSignupPage                   [History ▼] │
├──────────────────────────────────────────────────────┤
│ Current State:                                       │
│  authMode: "signup"                                  │
│  email: "user@example.com"                          │
│  emailError: false                                   │
│  showError: false                                    │
│                                                      │
│ State Changes (last 10):                            │
│  13:45:23 - setEmail("user@example.com")            │
│  13:45:20 - setAuthMode("signup")                   │
│  13:45:18 - toggleAuthMode()                        │
│  13:45:15 - setEmailError(false)                    │
│                                                      │
│ Watching:                                           │
│  ☑ authMode                                         │
│  ☑ email                                            │
│  ☐ emailError                                       │
└──────────────────────────────────────────────────────┘
```

### Flow Execution Trace

```
┌─ Execution Trace ────────────────────────────────────┐
│ Flow: handleActionButton                             │
│ Trigger: 13:45:30                                    │
│ Duration: 342ms                                      │
├──────────────────────────────────────────────────────┤
│                                                      │
│ ✓ [Validate Fields] - 2ms                           │
│    input: { email, password }                        │
│    output: { valid: true }                          │
│                                                      │
│ ✓ [Get State: authMode] - 0ms                       │
│    output: "signup"                                  │
│                                                      │
│ ✓ [HTTP POST /api/auth/signup] - 320ms              │
│    status: 200                                       │
│    response: { token: "..." }                       │
│                                                      │
│ ✓ [Navigate /dashboard] - 20ms                      │
│                                                      │
└──────────────────────────────────────────────────────┘
```

### Breakpoints

- Click node to add breakpoint
- Execution pauses at breakpoint
- Inspect current state and variables
- Step through node by node
- Resume execution

---

## Best Practices

### 1. Keep Flows Focused

❌ **Bad**: One giant flow that does everything

```
[Button Click] → [Validate] → [API Call] → [Parse] → [Update State]
              → [Show Toast] → [Navigate] → [Log Analytics]
              → [Update Cache] → [Trigger Animation]
```

✅ **Good**: Multiple focused flows

```
Flow 1: [Button Click] → [Validate] → [Trigger Submit Event]
Flow 2: [Submit Event] → [API Call] → [Handle Response]
Flow 3: [Response Success] → [Update State] → [Navigate]
Flow 4: [Response Error] → [Show Toast] → [Log Error]
```

### 2. Use State for Coordination

❌ **Bad**: Direct flow-to-flow connections

✅ **Good**: Flows communicate through state

```
Flow A: Sets state.step = 2
Flow B: Reads state.step, acts accordingly
```

### 3. Name Things Clearly

❌ **Bad**: `flow_001`, `node_abc`

✅ **Good**: `handleLogin`, `validateEmail`, `callAuthAPI`

### 4. Handle Errors Explicitly

Always provide error paths:

```
[API Call] ─success→ [Update State]
          └─error──→ [Show Error Toast]
```

### 5. Use Custom Events for Complex Coordination

```
Flow A: [Button Click] → [Validate] → [Trigger Event: "formSubmit"]
Flow B: [Listen: "formSubmit"] → [API Call]
Flow C: [Listen: "formSubmit"] → [Track Analytics]
```

---

## Future Enhancements

### Phase 1 (MVP Level 2)
- ✅ Core node types (state, logic, API, actions)
- ✅ Persistent page-level state
- ✅ Visual logic canvas with React Flow
- ✅ Event triggers from components
- ✅ Basic debugging (state inspector)

### Phase 2 (Post-MVP)
- ⏳ App-level state (global state across pages)
- ⏳ Custom node types (user-created)
- ⏳ Logic flow templates library
- ⏳ Advanced debugging (breakpoints, step-through)
- ⏳ Flow execution history & replay

### Phase 3 (Advanced)
- ⏳ Real-time collaboration on logic flows
- ⏳ AI assistance for logic generation
- ⏳ Performance profiling (slow node detection)
- ⏳ Automated testing of logic flows
- ⏳ Version control for logic flows

---

## Related Documentation

- **[DATA_FLOW.md](./DATA_FLOW.md)** - Data flow patterns and reactive variables
- **[EXPRESSION_SYSTEM.md](./EXPRESSION_SYSTEM.md)** - Template expressions in components
- **[COMPONENT_SCHEMA.md](./COMPONENT_SCHEMA.md)** - How logic is stored in manifest
- **[DEBUGGER_DESIGN.md](./DEBUGGER_DESIGN.md)** - Debugging logic flows

---

**Next**: Read [EXPRESSION_SYSTEM.md](./EXPRESSION_SYSTEM.md) to learn about template expressions like `{{ state.authMode }}`