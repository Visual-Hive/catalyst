# Data Flow Model

## Overview

This tool uses a **hybrid data flow model** combining the best of component-based and reactive paradigms:

- **Props for Parent/Child**: Explicit, local data passing through component tree
- **Reactive Variables for Cross-Cutting**: Shared state accessible from anywhere
- **Events for Communication**: Components emit events, others can listen

This gives you the clarity of React's unidirectional data flow with the convenience of global reactive state.

---

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

**Benefits**:
- Multiple independent logic flows can coordinate through shared state
- Components automatically react to state changes
- State survives across logic flow executions
- No need for complex flow-to-flow connections

### State Scopes

Rise provides three levels of state scope:

#### 1. **App-Level State** (global, persists across pages)
- User authentication
- Theme preferences
- Shopping cart
- Global settings

#### 2. **Page-Level State** (persists while page mounted)
- Form data
- UI toggles (dropdowns, modals)
- Filters, search terms
- Validation errors

#### 3. **Component-Level State** (local to instance)
- Input focus
- Hover state
- Animation progress

See [LOGIC_SYSTEM.md](./LOGIC_SYSTEM.md) for complete implementation details.

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

---

## The Three Data Flow Patterns

### 1. Props Down (Parent → Child)

**When to use**: Passing data from parent to direct children

```
Parent Component
  ├─ prop: userData
  ↓
Child Component
  └─ receives: userData
```

**In Manifest**:
```json
{
  "id": "userCard",
  "type": "UserCard",
  "props": {
    "user": {
      "type": "binding",
      "source": "parent.userData"
    }
  }
}
```

**Generated Code**:
```jsx
<UserCard user={userData} />
```

**Visual Editor**: Drag wire from parent's `userData` state to child's `user` prop input

---

### 2. Events Up (Child → Parent)

**When to use**: Child needs to notify parent of actions

```
Child Component
  ├─ event: onUserClick
  ↑
Parent Component
  └─ handler: handleUserClick
```

**In Manifest**:
```json
{
  "id": "userCard",
  "events": {
    "onUserClick": {
      "type": "emit"
    }
  }
},
{
  "id": "userList",
  "handlers": {
    "userCard.onUserClick": {
      "type": "function",
      "action": "handleUserClick"
    }
  }
}
```

**Generated Code**:
```jsx
// UserCard.jsx
export function UserCard({ onUserClick }) {
  return <button onClick={() => onUserClick(user)}>Click</button>;
}

// UserList.jsx
export function UserList() {
  const handleUserClick = (user) => {
    console.log('User clicked:', user);
  };
  
  return <UserCard onUserClick={handleUserClick} />;
}
```

**Visual Editor**: Draw connection from child's `onUserClick` output to parent's handler

---

### 3. Reactive Variables (Global State)

**When to use**: Data needed across multiple unrelated components

```
Component A
  ↓ updates
Global.currentUser
  ↓ reads
Component B (anywhere in tree)
```

**In Variables Config** (`.lowcode/variables.json`):
```json
{
  "currentUser": {
    "type": "object",
    "reactive": true,
    "default": null,
    "schema": {
      "id": "string",
      "name": "string",
      "email": "string"
    }
  },
  "theme": {
    "type": "string",
    "reactive": true,
    "default": "light",
    "options": ["light", "dark"]
  }
}
```

**In Component Manifest**:
```json
{
  "id": "userProfile",
  "props": {
    "userName": {
      "type": "expression",
      "value": "global.currentUser.name"
    }
  }
}
```

**Generated Code**:
```jsx
import { useGlobalState } from '../runtime/globalState';

export function UserProfile() {
  const currentUser = useGlobalState('currentUser');
  
  return <h1>{currentUser.name}</h1>;
}
```

**Visual Editor**: 
- See reactive variables in a global panel
- Reference them in any property field
- Shows which components use which variables

---

## Component State Exposure

Components can expose internal state to become available for connections:

### Internal State (Private)

```json
{
  "id": "searchBox",
  "state": {
    "query": {
      "type": "string",
      "default": "",
      "exposed": false  // ← Only this component can access
    }
  }
}
```

### Exposed State (Public)

```json
{
  "id": "searchBox",
  "state": {
    "query": {
      "type": "string",
      "default": "",
      "exposed": true  // ← Other components can read/connect
    }
  }
}
```

When exposed, other components can bind to it:

```json
{
  "id": "searchResults",
  "props": {
    "searchTerm": {
      "type": "binding",
      "source": "searchBox.state.query"
    }
  }
}
```

---

## Data Flow Visualization

The visual editor shows connections:

```
┌─────────────────┐
│   UserList      │
│                 │
│  state:         │
│  • users []     │◄─── (binds to) ─────┐
│                 │                      │
│  events:        │                      │
│  • onUserClick  │─────────┐           │
└─────────────────┘          │           │
                             │           │
         ┌───────────────────▼───────────┼──────┐
         │                               │      │
         │  ┌─────────────────┐   ┌──────▼────┐ │
         │  │   UserCard      │   │  global   │ │
         │  │                 │   │           │ │
         │  │  props:         │   │ • users   │ │
         │  │  • user         │   │ • theme   │ │
         │  │  • onClick      │   └───────────┘ │
         │  └─────────────────┘                 │
         │                                      │
         └──────────────────────────────────────┘
```

**Wire Colors**:
- 🔵 Blue: Props (data down)
- 🟢 Green: Events (actions up)
- 🟣 Purple: Reactive variables (global)
- 🟡 Yellow: Exposed state (peer-to-peer)

---

## Computed Values

Components can define computed values that update reactively:

```json
{
  "id": "userStats",
  "computed": {
    "fullName": {
      "type": "expression",
      "value": "global.currentUser.firstName + ' ' + global.currentUser.lastName"
    },
    "isAdmin": {
      "type": "expression",
      "value": "global.currentUser.role === 'admin'"
    }
  }
}
```

**Generated Code**:
```jsx
import { useGlobalState } from '../runtime/globalState';
import { useMemo } from 'react';

export function UserStats() {
  const currentUser = useGlobalState('currentUser');
  
  const fullName = useMemo(
    () => currentUser.firstName + ' ' + currentUser.lastName,
    [currentUser.firstName, currentUser.lastName]
  );
  
  const isAdmin = useMemo(
    () => currentUser.role === 'admin',
    [currentUser.role]
  );
  
  return <div>{fullName} {isAdmin && '(Admin)'}</div>;
}
```

---

## Script Nodes (Non-Visual Components)

For complex logic, create script nodes that sit between components:

```json
{
  "id": "validateUser",
  "type": "ScriptNode",
  "inputs": {
    "userData": { "type": "object" }
  },
  "outputs": {
    "isValid": { "type": "boolean" },
    "errors": { "type": "array" }
  },
  "script": "./scripts/validateUser.js"
}
```

**In Visual Editor**: Appears as node that can be wired to components

```
┌─────────────┐       ┌──────────────┐       ┌─────────────┐
│ UserForm    │       │ validateUser │       │ SubmitBtn   │
│             │       │              │       │             │
│ • userData  │──────▶│ • userData   │       │ • disabled  │
│             │       │              │       │             │
│             │       │ • isValid    │──────▶│             │
│             │       │ • errors     │       │             │
└─────────────┘       └──────────────┘       └─────────────┘
```

**Script File** (`scripts/validateUser.js`):
```javascript
export function validateUser(inputs) {
  const { userData } = inputs;
  const errors = [];
  
  if (!userData.email.includes('@')) {
    errors.push('Invalid email');
  }
  
  if (userData.password.length < 8) {
    errors.push('Password too short');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

export const metadata = {
  inputs: {
    userData: { type: 'object', required: true }
  },
  outputs: {
    isValid: { type: 'boolean' },
    errors: { type: 'array' }
  }
};
```

---

## Data Flow Debugging

The step debugger shows data flow in real-time:

**Debug Mode UI**:
```
┌─────────────────────────────────────────────────────────┐
│ Step Debugger                                           │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ Current Event: onClick (UserCard #user-123)            │
│                                                         │
│ Data Flow:                                              │
│  1. ✓ Button clicked                                   │
│  2. → Event emitted: onUserClick({ id: 123 })         │
│  3. → Parent handler: handleUserClick(user)            │
│  4. ⏸ About to execute: updateGlobal('currentUser')   │
│                                                         │
│ Component State:                                        │
│  • UserCard.state.isHovered: true                      │
│  • UserList.state.selectedId: null → 123  (pending)   │
│                                                         │
│ Reactive Variables:                                     │
│  • global.currentUser: { id: 100 } → { id: 123 }     │
│    ↳ Will trigger re-render in: UserProfile, Header   │
│                                                         │
│ [Continue] [Step Over] [Step Into]                     │
└─────────────────────────────────────────────────────────┘
```

---

## Best Practices

### ✅ DO:
- Use **props** for data that flows down the component tree
- Use **events** to notify parents of user actions
- Use **reactive variables** for truly global state (user, theme, app config)
- **Expose state** when sibling components need to coordinate
- Use **script nodes** for reusable logic that multiple components need

### ❌ DON'T:
- Pass data through many prop layers (use reactive variables instead)
- Put component-specific state in global variables
- Create too many reactive variables (keep them minimal)
- Forget to expose state that siblings need
- Put complex logic directly in component properties (use script nodes)

---

## Implementation Notes

### Reactive Variable System

Uses Zustand for global state management:

```typescript
// runtime/globalState.ts
import create from 'zustand';

interface GlobalState {
  currentUser: User | null;
  theme: 'light' | 'dark';
  setCurrentUser: (user: User) => void;
  setTheme: (theme: 'light' | 'dark') => void;
}

export const useGlobalState = create<GlobalState>((set) => ({
  currentUser: null,
  theme: 'light',
  setCurrentUser: (user) => set({ currentUser: user }),
  setTheme: (theme) => set({ theme })
}));
```

Generated automatically from `.lowcode/variables.json`

### Props & Events

Standard React patterns - no magic needed

### State Exposure

Managed through React Context when needed for sibling access:

```jsx
// Auto-generated when state is exposed
export const SearchContext = createContext();

export function SearchBox() {
  const [query, setQuery] = useState('');
  
  return (
    <SearchContext.Provider value={{ query, setQuery }}>
      {/* component content */}
    </SearchContext.Provider>
  );
}

// Other components can access
export function SearchResults() {
  const { query } = useContext(SearchContext);
  return <div>Results for: {query}</div>;
}
```

---

**See Also**:
- [Expression System](./EXPRESSION_SYSTEM.md) - How to reference data in properties
- [Debugger Design](./DEBUGGER_DESIGN.md) - How data flow is visualized during debug
- [Component Schema](./COMPONENT_SCHEMA.md) - How data flow is represented in manifest
