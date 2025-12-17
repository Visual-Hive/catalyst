# Schema Levels Specification

> Defining the progression from simple MVP schema to full-featured production schema.

## Problem Statement

The COMPONENT_SCHEMA.md document shows the **complete vision** of Rise's component schema, including sophisticated features like:
- Live database queries
- Real-time WebSocket connections
- Complex computed properties
- AI code review integration
- Performance monitoring

However, implementing all these features in the MVP would:
- Take 6+ months instead of 3-4 months
- Introduce significant complexity and bugs
- Delay user feedback on core value proposition

**Solution**: Define progressive schema levels that build on each other.

---

## Schema Version Strategy

```
Level 1 (MVP)       →  Level 2 (Post-MVP)  →  Level 3 (Future)
───────────────────    ──────────────────     ────────────────
Basic Components       Data Connections       Advanced Features
Static Properties      Event System           Real-time Data
Simple Expressions     Computed Props         AI Integration
                       State Management       Performance Metrics
```

---

## Level 1: MVP Schema (Weeks 1-12)

### Goal
**Prove core value**: Visual editor → clean code generation → working app

### Supported Features

#### ✅ Component Definition
```json
{
  "components": {
    "comp_button_001": {
      "id": "comp_button_001",
      "displayName": "Button",
      "type": "PrimitiveComponent",
      "category": "basic",
      
      "properties": {
        "label": {
          "type": "static",
          "value": "Click me"
        },
        "disabled": {
          "type": "static",
          "value": false
        }
      },
      
      "styling": {
        "baseClasses": ["btn", "btn-primary"]
      }
    }
  }
}
```

**What's Included**:
- ✅ Component ID and name
- ✅ Basic metadata (type, category)
- ✅ Static property values
- ✅ CSS class names
- ✅ Component hierarchy (parent/child)

**What's Excluded**:
- ❌ Expressions (added in Level 2)
- ❌ State management (added in Level 2)
- ❌ Event handlers (added in Level 2)
- ❌ Data connections (added in Level 3)
- ❌ AI integration (added in Level 3)

#### ✅ Simple Component Hierarchy
```json
{
  "comp_app_001": {
    "displayName": "App",
    "children": [
      "comp_header_001",
      "comp_main_001",
      "comp_footer_001"
    ]
  },
  "comp_header_001": {
    "displayName": "Header",
    "children": ["comp_logo_001", "comp_nav_001"]
  }
}
```

**Constraints**:
- Maximum nesting depth: 5 levels
- Maximum children per component: 20
- No circular references

#### ✅ Basic Styling
```json
{
  "styling": {
    "baseClasses": ["container", "flex", "items-center"],
    "customCSS": ".button { background: blue; }"
  }
}
```

**What's Included**:
- ✅ Tailwind utility classes
- ✅ Custom CSS (sanitized)
- ✅ Conditional classes (simple)

**What's Excluded**:
- ❌ Dynamic style calculations
- ❌ Theme variables (added in Level 2)
- ❌ Responsive breakpoints (added in Level 2)

#### ✅ Props (Component Inputs)
```json
{
  "properties": {
    "user": {
      "type": "prop",
      "dataType": "object",
      "required": true,
      "default": null
    }
  }
}
```

**What's Included**:
- ✅ Prop definition
- ✅ Type specification (string, number, boolean, object, array)
- ✅ Required flag
- ✅ Default values

**What's Excluded**:
- ❌ Prop validation schemas (added in Level 2)
- ❌ Prop transformations (added in Level 2)

### Generated Code Example (Level 1)

```jsx
import React from 'react';

/**
 * @rise:generated
 * Component: Button
 * Level: 1 (MVP)
 * Generated: 2025-10-25T10:00:00Z
 */
export function Button({ label = "Click me", disabled = false }) {
  return (
    <button 
      className="btn btn-primary"
      disabled={disabled}
    >
      {label}
    </button>
  );
}
```

**Characteristics**:
- Clean, readable React
- No complex logic
- Standard props
- Basic styling

### Level 1 Validation Rules

```typescript
class Level1SchemaValidator {
  validate(schema: ComponentSchema): ValidationResult {
    const errors: ValidationError[] = [];

    // Only allow supported property types
    for (const prop of schema.properties) {
      if (!['static', 'prop'].includes(prop.type)) {
        errors.push({
          field: prop.name,
          message: `Property type '${prop.type}' not supported in Level 1. Use 'static' or 'prop'.`,
          level: 'ERROR',
        });
      }
    }

    // No event handlers allowed
    if (schema.eventHandlers) {
      errors.push({
        field: 'eventHandlers',
        message: 'Event handlers not supported in Level 1 (added in Level 2)',
        level: 'ERROR',
      });
    }

    // No state management
    if (schema.localState || schema.globalState) {
      errors.push({
        field: 'state',
        message: 'State management not supported in Level 1 (added in Level 2)',
        level: 'ERROR',
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
      level: 1,
    };
  }
}
```

### Level 1 UI Features

**Visual Editor**:
- ✅ Component tree view
- ✅ Add/delete/move components
- ✅ Property editor (text inputs)
- ✅ Preview panel
- ✅ Code view (read-only)

**NOT Included**:
- ❌ Visual graph editor (added Level 2)
- ❌ Expression editor (added Level 2)
- ❌ Debugger (added Level 3)

---

## Level 2: Enhanced Schema (Weeks 13-24)

### Goal
**Add interactivity**: Events, state, expressions, and node-based logic flows

### New Features

Adds computed values, persistent reactive state, and node-based logic:

#### ✅ Expression System

Template expressions in properties: `{{ state.value }}`

```json
{
  "properties": {
    "displayText": {
      "type": "expression",
      "expression": "{{ state.authMode === 'login' ? 'Log In' : 'Sign Up' }}",
      "dependencies": ["state.authMode"],
      "author": "user",
      "userEditable": true
    }
  }
}
```

**Features**:
- Computed properties with automatic dependencies
- Expression validation and type checking
- Security sandboxing (VM2)
- AST parsing and checking
- Timeout protection (100ms)

#### ✅ Logic System

Node-based visual logic canvas (React Flow):

**Key Features**:
- Persistent reactive state (page-level, app-level)
- Event triggers (onClick, onChange, onMount, etc.)
- Logic flows with state nodes, API nodes, action nodes
- Independent flows that share state
- Visual debugging and execution traces

**State Persistence**:
Unlike ephemeral function-local state, Rise's state **persists throughout the page session**:

```javascript
// Traditional approach (state dies after function)
function handleClick() {
  let toggle = true;  // Dies when function ends
}

// Rise approach (state persists)
Page State: { toggle: false }
Logic Flow A: [Button Click] → [Set toggle = true]
Logic Flow B: [Button Click Again] → [Read toggle] → "It's true!"
```

**Benefits**:
- Multiple independent logic flows can coordinate through shared state
- Components automatically react to state changes
- State survives across logic flow executions
- No need for complex flow-to-flow connections

#### ✅ State Management

**Page-level state** (persists while page mounted):
- Form data
- UI toggles (dropdowns, modals)
- Filters, search terms
- Validation errors

**App-level state** (persists across pages):
- User authentication
- Theme preferences
- Shopping cart
- Global settings

**Component-level state** (local to instance):
- Input focus
- Hover state
- Animation progress

**Generated Zustand stores** for reactivity:

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
    }
  }
}
```

Generates:

```javascript
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

#### ✅ Data Flow

**Components → Logic** (events):
- User interactions trigger logic flows
- `onClick`, `onChange`, `onMount`, etc.

**Logic → Components** (data binding, actions):
- Template expressions: `{{ state.authMode }}`
- Direct actions: `Toast.show()`, `Navigate`, `Focus`

**Logic ↔ State** (read/write persistent variables):
- State nodes: Get State, Set State, Toggle State
- Automatic component re-rendering on state changes

### Generated Code Example (Level 2)

```jsx
import React, { useState, useMemo } from 'react';
import { useGlobalState } from '../runtime/globalState';
import { formatTimeAgo } from '../utils/globalFunctions/user';

/**
 * @rise:generated
 * Component: UserCard
 * Level: 2 (Enhanced)
 * Generated: 2025-10-25T10:00:00Z
 */
export function UserCard({ user }) {
  // Local state
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Global state
  const currentUser = useGlobalState('currentUser');
  
  // Computed properties
  const fullName = useMemo(
    () => user.firstName + ' ' + user.lastName,
    [user.firstName, user.lastName]
  );
  
  const timeAgo = useMemo(
    () => formatTimeAgo(user.createdAt),
    [user.createdAt]
  );
  
  // Event handlers
  const handleClick = () => {
    setIsExpanded(!isExpanded);
  };
  
  return (
    <div 
      className="card"
      onClick={handleClick}
    >
      <h2>{fullName}</h2>
      <p>{timeAgo}</p>
      {isExpanded && (
        <div>{user.bio}</div>
      )}
    </div>
  );
}
```

**Characteristics**:
- Uses React hooks properly
- Memoization for performance
- Clean state management
- User-defined functions integrated

### Level 2 Validation Rules

```typescript
class Level2SchemaValidator extends Level1SchemaValidator {
  validate(schema: ComponentSchema): ValidationResult {
    const errors: ValidationError[] = [];

    // Validate expressions
    for (const prop of schema.properties) {
      if (prop.type === 'expression') {
        const securityCheck = this.validateExpression(prop.expression);
        if (!securityCheck.isValid) {
          errors.push(...securityCheck.errors);
        }
      }
    }

    // Validate global functions
    for (const fn of schema.globalFunctions || []) {
      if (!fn.namespace) {
        errors.push({
          field: fn.name,
          message: 'Global functions must have namespace in Level 2',
          level: 'ERROR',
        });
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      level: 2,
    };
  }

  private validateExpression(expr: string): ValidationResult {
    // Use SECURITY_SPEC.md validation
    const parser = new ExpressionParser();
    const validator = new ExpressionValidator();
    
    const ast = parser.parse(expr);
    return validator.validate(ast);
  }
}
```

---

## Level 3: Advanced Schema (Week 25+)

### Goal
**Production-ready**: Real-time data, AI assistance, performance optimization

### New Features

#### ✅ Data Connections
```json
{
  "dataConnections": {
    "users": {
      "type": "liveQuery",
      "source": "supabase.users",
      "filter": "isActive === true",
      "realtime": true,
      "transport": "websocket"
    }
  }
}
```

**Requirements**:
- Supabase/Firebase plugin
- WebSocket handling
- Error recovery
- Optimistic updates

#### ✅ AI Integration
```json
{
  "codeReview": {
    "lastReviewDate": "2025-10-25T15:30:00Z",
    "aiFindings": [
      "Performance: Consider memoizing expensive calculations",
      "Security: Input validation looks good"
    ],
    "userAcknowledged": true
  }
}
```

**Features**:
- AI code review
- Optimization suggestions
- Security analysis
- User can accept/reject

#### ✅ Performance Monitoring
```json
{
  "performance": {
    "memoization": ["timeDisplay", "userAvatar"],
    "lazyLoading": ["threadComments"],
    "virtualScrolling": true,
    "metrics": {
      "renderTime": "12ms",
      "memoryUsage": "850KB"
    }
  }
}
```

#### ✅ Advanced Routing
```json
{
  "routes": [
    {
      "path": "/users/:id",
      "component": "comp_user_detail_001",
      "guards": ["authenticated"],
      "preload": ["userData"]
    }
  ]
}
```

#### ✅ Testing Integration
```json
{
  "testing": {
    "testId": "user-card",
    "scenarios": [
      "renders user name correctly",
      "expands on click",
      "handles missing data gracefully"
    ],
    "coverage": {
      "statements": 85,
      "branches": 78,
      "functions": 90
    }
  }
}
```

---

## Feature Compatibility Matrix

| Feature | Level 1 (MVP) | Level 2 (Enhanced) | Level 3 (Advanced) |
|---------|---------------|--------------------|--------------------|
| **Components** |
| Basic components | ✅ | ✅ | ✅ |
| Component hierarchy | ✅ | ✅ | ✅ |
| Custom components | ❌ | ✅ | ✅ |
| Component libraries | ❌ | ⚠️ Basic | ✅ Full |
| **Properties** |
| Static values | ✅ | ✅ | ✅ |
| Props (inputs) | ✅ | ✅ | ✅ |
| Expressions | ❌ | ✅ | ✅ |
| Computed properties | ❌ | ✅ | ✅ |
| **State** |
| Local state | ❌ | ✅ | ✅ |
| Global state | ❌ | ✅ | ✅ |
| Context API | ❌ | ❌ | ✅ |
| **Events** |
| Event handlers | ❌ | ✅ | ✅ |
| Custom events | ❌ | ⚠️ Basic | ✅ Full |
| Event propagation | ❌ | ❌ | ✅ |
| **Data** |
| Static data | ✅ | ✅ | ✅ |
| API calls | ❌ | ⚠️ Manual | ✅ Integrated |
| Real-time data | ❌ | ❌ | ✅ |
| Database queries | ❌ | ❌ | ✅ |
| **Styling** |
| CSS classes | ✅ | ✅ | ✅ |
| Conditional styles | ⚠️ Simple | ✅ | ✅ |
| Themes | ❌ | ✅ | ✅ |
| Responsive design | ❌ | ✅ | ✅ |
| **Advanced** |
| Routing | ❌ | ⚠️ Basic | ✅ Advanced |
| Testing | ❌ | ⚠️ Manual | ✅ Integrated |
| Performance monitoring | ❌ | ❌ | ✅ |
| AI assistance | ❌ | ❌ | ✅ |
| Debugger | ❌ | ❌ | ✅ |

**Legend**:
- ✅ Fully supported
- ⚠️ Partially supported
- ❌ Not supported (yet)

---

## Migration Path

### Level 1 → Level 2

**Automatic migration script**:

```typescript
class SchemaUpgrader {
  upgradeToLevel2(level1Schema: ComponentSchema): ComponentSchema {
    const level2Schema = { ...level1Schema };
    
    // Add schema version
    level2Schema.schemaVersion = "2.0.0";
    level2Schema.level = 2;
    
    // Convert any user-added inline functions to global functions
    level2Schema.globalFunctions = this.extractGlobalFunctions(level1Schema);
    
    // Add default state management if needed
    if (this.hasInteractivity(level1Schema)) {
      level2Schema.localState = this.generateDefaultState(level1Schema);
    }
    
    return level2Schema;
  }
}
```

**What changes**:
- Properties can now be expressions
- State management available
- Event handlers can be added

**What stays the same**:
- Component IDs
- Component hierarchy
- Existing static properties

### Level 2 → Level 3

**Automatic migration**:

```typescript
class SchemaUpgrader {
  upgradeToLevel3(level2Schema: ComponentSchema): ComponentSchema {
    const level3Schema = { ...level2Schema };
    
    // Add schema version
    level3Schema.schemaVersion = "3.0.0";
    level3Schema.level = 3;
    
    // Enable AI features
    level3Schema.aiAssistant = {
      role: "copilot",
      permissions: ["review", "suggest"],
    };
    
    // Add performance monitoring
    level3Schema.performance = {
      memoization: this.detectMemoizationOpportunities(level2Schema),
    };
    
    return level3Schema;
  }
}
```

---

## Progressive UI Disclosure

The visual editor UI should match the schema level:

### Level 1 UI (MVP)
```
┌─────────────────────────────────────┐
│ Component Tree    │  Properties     │
│                   │                 │
│ + Button          │  Label: [____]  │
│   - Text          │  Disabled: [ ]  │
│   - Icon          │                 │
│                   │  Style: [____]  │
└─────────────────────────────────────┘
```

**Features**:
- Simple property inputs
- Basic tree view
- Static preview

### Level 2 UI (Enhanced)
```
┌─────────────────────────────────────┐
│ Tree │ Graph │ Properties │ State   │
│      │       │            │         │
│ Components   │  [Expression Editor] │
│ connected    │  props.user.name     │
│ visually     │  ✓ Valid             │
│              │                      │
│              │  [+ Add Event]       │
└─────────────────────────────────────┘
```

**Added Features**:
- Expression editor with autocomplete
- Visual graph of connections
- State panel
- Event handler editor

### Level 3 UI (Advanced)
```
┌─────────────────────────────────────┐
│ Full IDE Experience                 │
│ - Code editor with AI copilot       │
│ - Real-time preview with debugger   │
│ - Performance metrics               │
│ - Testing integration               │
└─────────────────────────────────────┘
```

---

## Documentation Strategy

### For Users

**Getting Started** should focus on Level 1:
- Simple examples
- Basic concepts
- Static components

**Advanced Guide** covers Level 2:
- Expressions and state
- Event handling
- Global functions

**Expert Guide** covers Level 3:
- Real-time data
- Performance optimization
- AI assistance

### For Developers

Each schema level has:
- Validation rules
- Code generation templates
- Test suites
- Migration scripts

---

## Implementation Timeline

### MVP (Level 1) - Weeks 1-12
- Week 1-3: Core manifest management
- Week 4-6: Basic code generation
- Week 7-9: Component tree UI
- Week 10-12: Preview and polish

### Post-MVP (Level 2) - Weeks 13-24
- Week 13-15: Expression system + security
- Week 16-18: State management
- Week 19-21: Event handlers
- Week 22-24: Testing and refinement

### Advanced (Level 3) - Week 25+
- Phased rollout based on user feedback
- Each feature released independently
- Beta testing with power users
- Full documentation per feature

---

## Success Metrics

### Level 1 Goals
- Users can create 10+ component apps
- Generated code compiles without errors
- Preview loads in < 5 seconds
- User satisfaction > 7/10

### Level 2 Goals
- Users use expressions regularly
- State management works reliably
- Event handlers execute correctly
- User satisfaction > 8/10

### Level 3 Goals
- Real-time features perform well
- AI suggestions helpful (> 70% accepted)
- Performance metrics accurate
- User satisfaction > 9/10

---

## Conclusion

By defining clear schema levels, we:

1. **Reduce MVP scope** from 6 months to 3 months
2. **Deliver value faster** with working features
3. **Get user feedback early** to guide development
4. **Maintain quality** with focused implementation
5. **Provide migration path** for users as we grow

**Critical**: All documentation must clearly indicate which level features belong to.

---

**Action Items**:
1. Update COMPONENT_SCHEMA.md to show Level 1 examples prominently
2. Update MVP_ROADMAP.md to align with Level 1 only
3. Add schema level indicators to all examples
4. Create validation rules for each level
5. Build migration scripts for level upgrades

**See Also**:
- [COMPONENT_SCHEMA.md](./COMPONENT_SCHEMA.md) - Complete schema reference
- [MVP_ROADMAP.md](./MVP_ROADMAP.md) - Implementation timeline
- [SECURITY_SPEC.md](./SECURITY_SPEC.md) - Security requirements

---

**Last Updated**: October 25, 2025  
**Status**: ✅ Complete - Ready for Implementation  
**Review Required**: Project Manager & Lead Developer
