# Rise Architecture Summary - With Logic System

> Complete visual overview of how visual building, logic flows, and persistent state work together

---

## The Big Picture

```
┌─────────────────────────────────────────────────────────────────┐
│                        RISE APPLICATION                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌────────────────────┐         ┌──────────────────────┐       │
│  │  VISUAL BUILDER    │         │   LOGIC CANVAS       │       │
│  │                    │         │                      │       │
│  │  - DOM Tree        │◄───────►│  - Node Graph        │       │
│  │  - Live Preview    │         │  - Flow Editor       │       │
│  │  - Properties      │         │  - State Inspector   │       │
│  │                    │         │  - Debugger          │       │
│  └────────┬───────────┘         └──────────┬───────────┘       │
│           │                                 │                   │
│           │        ┌────────────────────┐  │                   │
│           └───────►│  PERSISTENT STATE  │◄─┘                   │
│                    │                    │                       │
│                    │  Page State:       │                       │
│                    │   - authMode       │                       │
│                    │   - email          │                       │
│                    │   - errors         │                       │
│                    │                    │                       │
│                    │  App State:        │                       │
│                    │   - user           │                       │
│                    │   - theme          │                       │
│                    │   - cart           │                       │
│                    └────────────────────┘                       │
│                             │                                    │
│                    ┌────────▼────────┐                          │
│                    │  CODE GENERATOR  │                         │
│                    │                  │                         │
│                    │  Generates:      │                         │
│                    │  - Components    │                         │
│                    │  - State stores  │                         │
│                    │  - Event handlers│                         │
│                    │  - Logic flows   │                         │
│                    └─────────┬────────┘                         │
│                              ▼                                   │
│                    ┌──────────────────┐                         │
│                    │  CLEAN REACT APP │                         │
│                    │                  │                         │
│                    │  - Vite project  │                         │
│                    │  - Zustand state │                         │
│                    │  - Standard code │                         │
│                    └──────────────────┘                         │
└─────────────────────────────────────────────────────────────────┘
```

---

## The Three Bridges

### 1. Components → Logic (Events)

```
┌──────────────────────────────────┐
│ Visual Component                 │
│                                  │
│ Button "action-button"           │
│  ├─ text: "Submit"              │
│  └─ [onClick] ⚡                │
└───────────────┬──────────────────┘
                │
        fires event
                │
                ▼
┌──────────────────────────────────┐
│ Logic Canvas                     │
│                                  │
│ [action-button.clicked]          │
│         ↓                        │
│    [Logic Flow...]               │
└──────────────────────────────────┘
```

### 2. Logic ↔ State (Read/Write)

```
┌──────────────────────────────────────────┐
│ Persistent State                         │
│  authMode: "signup"                      │
│  email: ""                               │
│  emailError: false                       │
└───────────┬──────────────────────────────┘
            ↕ (read/write)
┌───────────▼──────────────────────────────┐
│ Logic Flows                              │
│                                          │
│ Flow A: [Get authMode] → [Switch]       │
│ Flow B: [Set emailError = true]         │
│ Flow C: [Toggle authMode]               │
└──────────────────────────────────────────┘
```

### 3. State → Components (Data Binding)

```
┌──────────────────────────────────────────┐
│ Persistent State                         │
│  authMode: "login"                       │
│  emailError: true                        │
└───────────┬──────────────────────────────┘
            │ (data binding)
            ▼
┌──────────────────────────────────────────┐
│ Visual Components (auto-update)          │
│                                          │
│ Title text: {{ authMode === 'login'     │
│              ? 'Log In' : 'Sign Up' }}  │
│   → renders: "Log In"                   │
│                                          │
│ Email className: {{ emailError          │
│                   ? 'red' : 'gray' }}   │
│   → renders: "red"                      │
└──────────────────────────────────────────┘
```

---

## Complete Data Flow Example

### Scenario: User clicks "Log In" button

```
1. USER ACTION
   │
   ├─► Button clicked
   │
   ▼

2. EVENT TRIGGER
   │
   ├─► [action-button.clicked] event fires
   │
   ▼

3. LOGIC FLOW EXECUTES
   │
   ├─► [Get State: email, password]
   │      ↓
   ├─► [Validate] 
   │      ↓
   ├─► [If valid]
   │      ↓
   ├─► [Get State: authMode] → "login"
   │      ↓
   ├─► [HTTP POST /api/auth/login]
   │      ↓
   │    ┌─────┬─────┐
   │  success    error
   │    │         │
   │    ▼         ▼
   │  [Navigate] [Set State: showError=true]
   │  /dashboard  [Set State: errorMsg="..."]
   │              [Show Toast]
   │
   ▼

4. STATE CHANGES
   │
   ├─► State updated:
   │    showError: false → true
   │    errorMessage: "" → "Login failed"
   │
   ▼

5. COMPONENTS RE-RENDER
   │
   ├─► Error message appears (hidden → visible)
   ├─► Toast notification shows
   └─► All components bound to state update automatically
```

---

## File Structure After Level 2

```
my-app/
├── .lowcode/
│   ├── manifest.json              # Components + State + Logic
│   │   {
│   │     "components": [...],
│   │     "state": {               # NEW in Level 2
│   │       "authMode": {...},
│   │       "email": {...}
│   │     },
│   │     "logicFlows": {          # NEW in Level 2
│   │       "handleLogin": {...},
│   │       "handleToggle": {...}
│   │     }
│   │   }
│   │
│   └── metadata.json              # Project settings
│
├── src/
│   ├── components/
│   │   └── LoginPage.jsx          # Generated component
│   │
│   ├── stores/                    # NEW in Level 2
│   │   └── loginPageState.js      # Generated Zustand store
│   │
│   ├── logic/                     # NEW in Level 2
│   │   └── loginPageFlows.js      # Generated logic functions
│   │
│   └── App.jsx
│
├── package.json
└── vite.config.js
```

---

## Generated Code Structure (Level 2)

### Generated Component

```jsx
// src/components/LoginPage.jsx
import React, { useEffect } from 'react';
import { useLoginPageState } from '../stores/loginPageState';
import { handlePageLoad, handleToggle, handleSubmit } from '../logic/loginPageFlows';

export default function LoginPage() {
  // Subscribe to state (auto re-render on changes)
  const authMode = useLoginPageState(s => s.authMode);
  const email = useLoginPageState(s => s.email);
  const emailError = useLoginPageState(s => s.emailError);
  
  // Page load logic
  useEffect(() => {
    handlePageLoad();
  }, []);
  
  return (
    <div>
      <h1>{authMode === 'login' ? 'Log In' : 'Sign Up'}</h1>
      
      <input
        type="email"
        value={email}
        onChange={(e) => useLoginPageState.getState().setEmail(e.target.value)}
        className={emailError ? 'border-red-500' : 'border-gray-300'}
      />
      
      <button onClick={handleSubmit}>
        {authMode === 'login' ? 'Log In' : 'Sign Up'}
      </button>
      
      <button onClick={handleToggle}>
        {authMode === 'login' ? 'Need an account?' : 'Have an account?'}
      </button>
    </div>
  );
}
```

### Generated State Store

```javascript
// src/stores/loginPageState.js
import { create } from 'zustand';

export const useLoginPageState = create((set, get) => ({
  // State variables (from manifest)
  authMode: 'signup',
  email: '',
  password: '',
  emailError: false,
  showError: false,
  errorMessage: '',
  
  // Setters (auto-generated)
  setAuthMode: (mode) => set({ authMode: mode }),
  setEmail: (email) => set({ email }),
  setPassword: (password) => set({ password }),
  setEmailError: (error) => set({ emailError: error }),
  setShowError: (show) => set({ showError: show }),
  setErrorMessage: (msg) => set({ errorMessage: msg }),
  
  // Convenience methods (from logic flows)
  toggleAuthMode: () => set({ 
    authMode: get().authMode === 'login' ? 'signup' : 'login' 
  }),
  
  clearErrors: () => set({ 
    emailError: false, 
    showError: false, 
    errorMessage: '' 
  }),
  
  // Reset to defaults
  reset: () => set({
    authMode: 'signup',
    email: '',
    password: '',
    emailError: false,
    showError: false,
    errorMessage: ''
  })
}));
```

### Generated Logic Functions

```javascript
// src/logic/loginPageFlows.js
import { useLoginPageState } from '../stores/loginPageState';
import { navigate } from '../utils/navigation';
import { toast } from '../utils/toast';

// Flow 1: Page Load
export const handlePageLoad = () => {
  const state = useLoginPageState.getState();
  const urlParams = new URLSearchParams(window.location.search);
  const pageParam = urlParams.get('page');
  
  if (pageParam === 'login') {
    state.setAuthMode('login');
  }
};

// Flow 2: Toggle Mode
export const handleToggle = () => {
  const state = useLoginPageState.getState();
  state.toggleAuthMode();
};

// Flow 3: Submit
export const handleSubmit = async () => {
  const state = useLoginPageState.getState();
  const { authMode, email, password } = state;
  
  // Validate
  if (!email || !password) {
    state.setEmailError(true);
    return;
  }
  
  state.clearErrors();
  
  // API Call
  try {
    const endpoint = authMode === 'login' 
      ? '/api/auth/login' 
      : '/api/auth/signup';
    
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
    state.setShowError(true);
    state.setErrorMessage('Something went wrong. Please try again.');
    toast.show('error', error.message);
  }
};
```

---

## Key Benefits of This Architecture

### 1. Clear Separation of Concerns

```
Visual Builder     →  "What does it look like?"
Logic Canvas       →  "What does it do?"
Persistent State   →  "What's the current situation?"
```

### 2. Independent Logic Flows

```
Flow A: Checks URL, sets authMode
         ↓ (writes to state)
         
Flow B: User clicks toggle
         ↓ (reads state, writes new value)
         
Flow C: User submits form
         ↓ (reads state for API call)
         
All flows coordinate through shared state!
```

### 3. Automatic Reactivity

```
State changes:
  authMode: "signup" → "login"
         ↓
All components using {{ state.authMode }} re-render
         ↓
UI updates automatically (title, button text, hidden fields)
```

### 4. Clean Generated Code

- Standard React patterns
- Zustand for state (industry standard)
- Normal functions for logic
- No vendor lock-in
- Can be manually edited

---

## User Experience Flow

### 1. Building Visually

```
User: "I want a login page"
   ↓
[ Create components in DOM tree ]
   ↓
[ Add text bindings: {{ state.authMode }} ]
   ↓
[ Components show ⚡ for events ]
```

### 2. Adding Logic

```
User: "When button is clicked..."
   ↓
[ Click ⚡ icon on button ]
   ↓
[ Logic canvas opens ]
   ↓
[ Drag nodes: Validate → API Call → Navigate ]
   ↓
[ Connect nodes with wires ]
   ↓
[ Test in preview mode ]
```

### 3. Managing State

```
User: "I need to track the current mode"
   ↓
[ Add state variable: authMode ]
   ↓
[ Set default value: "signup" ]
   ↓
[ State appears in logic canvas ]
   ↓
[ Components can bind to it: {{ state.authMode }} ]
   ↓
[ Logic flows can read/write it ]
```

---

## Comparison with Other Tools

### vs Noodl

**Similar:**
- ✅ Node-based logic
- ✅ Persistent state across flows
- ✅ Visual + logic in same tool

**Different:**
- ✅ Separate visual/logic views (cleaner)
- ✅ Clean code generation (not proprietary)
- ✅ No spaghetti (logic grouped by flow)

### vs Backendless

**Similar:**
- ✅ DOM tree visual builder
- ✅ Logic button on components
- ✅ Event handlers

**Different:**
- ✅ Node-based instead of Blockly
- ✅ More flexible (power + approachability)
- ✅ Better for complex logic

### vs Bubble/Webflow

**Similar:**
- ✅ Visual builder
- ✅ State management

**Different:**
- ✅ True code generation (not hosted runtime)
- ✅ Visual logic flows (not just dropdowns)
- ✅ Developer-friendly output

---

## Schema Levels Recap

### Level 1 (MVP) - Static

```
✅ Visual component tree
✅ Basic properties (static values)
✅ Component hierarchy
✅ Code generation
✅ Live preview
```

### Level 2 (Post-MVP) - Interactive

```
⏳ Template expressions: {{ state.value }}
⏳ Persistent reactive state (page + app level)
⏳ Node-based logic flows
⏳ Event triggers
⏳ State nodes, API nodes, action nodes
⏳ Visual debugger with execution traces
```

### Level 3 (Advanced) - Connected

```
⏳ Database connections
⏳ Real-time data sync
⏳ Authentication integration
⏳ Advanced API integrations
⏳ AI-assisted logic generation
```

---

## Next Steps for Implementation

### Phase 1: Core State System
1. Design state storage in manifest
2. Implement Zustand store generation
3. Add state UI in properties panel
4. Test state persistence

### Phase 2: Logic Canvas UI
1. Integrate React Flow
2. Create custom node components
3. Build logic canvas panel
4. Implement node connections

### Phase 3: Node Execution
1. Define node type interfaces
2. Implement node executors
3. Build execution engine
4. Add error handling

### Phase 4: Code Generation
1. Logic flow → function generator
2. State → Zustand store generator
3. Component → hooks integration
4. Test generated code

### Phase 5: Debugging
1. State inspector UI
2. Execution trace viewer
3. Breakpoint system
4. Step-through debugger

---

**See complete documentation:**
- [LOGIC_SYSTEM.md](./docs/LOGIC_SYSTEM.md) - Full system design
- [DOCUMENTATION_UPDATES.md](./DOCUMENTATION_UPDATES.md) - Integration with existing docs