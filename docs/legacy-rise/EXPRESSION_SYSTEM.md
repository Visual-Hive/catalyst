# Expression System

## Philosophy

The expression system bridges visual low-code editing with code-based flexibility. Key principles:

1. **No Magic Syntax**: Expressions are just JavaScript - no special {{ }} or template languages
2. **Context-Aware**: Visual editor knows what's available (props, state, globals)
3. **Type-Safe**: Validate expressions against expected types
4. **Debuggable**: Expressions visible in step debugger

## Property Types

Every component property can be set in three ways:

### 1. Static Value

**Use case**: Fixed values that never change

**In Visual Editor**:
```
Property: text
Type: [Static ▼]
Value: "Welcome to Dashboard"
```

**In Manifest**:
```json
{
  "props": {
    "text": {
      "type": "static",
      "value": "Welcome to Dashboard"
    }
  }
}
```

**Generated Code**:
```jsx
<Text>Welcome to Dashboard</Text>
```

---

### 2. Expression

**Use case**: Dynamic values computed from available context

**In Visual Editor**:
```
Property: text
Type: [Expression ▼]
┌──────────────────────────────────────┐
│ user.firstName + ' ' + user.lastName │  ← JavaScript editor
└──────────────────────────────────────┘

Available context:
  • props.user (object)
  • state.isHovered (boolean)
  • global.theme (string)
```

**In Manifest**:
```json
{
  "props": {
    "text": {
      "type": "expression",
      "value": "user.firstName + ' ' + user.lastName"
    }
  }
}
```

**Generated Code**:
```jsx
<Text>{user.firstName + ' ' + user.lastName}</Text>
```

**Editor Features**:
- Syntax highlighting
- Auto-completion for available context
- Inline error checking
- Type validation

---

### 3. Binding

**Use case**: Direct connection to another component's state or output

**In Visual Editor**:
```
Property: searchTerm
Type: [Binding ▼]
Source: [Select Component ▼]
  ↳ SearchBox
    ↳ [Select Property ▼]
      ↳ state.query
```

Or visually draw wire from SearchBox's `query` output to this component's `searchTerm` input.

**In Manifest**:
```json
{
  "props": {
    "searchTerm": {
      "type": "binding",
      "source": "searchBox.state.query"
    }
  }
}
```

**Generated Code**:
```jsx
// Handled through props or Context depending on relationship
<SearchResults searchTerm={searchQuery} />
```

---

## Available Context

Expressions can reference:

### Props (from parent)
```javascript
// Access props directly by name
props.user
props.onClick
props.children
```

### Component State
```javascript
// Internal state of the component
state.isHovered
state.count
state.selectedId
```

### Global Reactive Variables
```javascript
// From .lowcode/variables.json
global.currentUser
global.theme
global.isAuthenticated
```

### Other Components (if exposed)
```javascript
// From other components with exposed state
searchBox.state.query
userList.state.selectedUser
sidebar.state.isOpen
```

### Functions & Utilities
```javascript
// Built-in helpers (auto-imported)
formatDate(date, 'YYYY-MM-DD')
capitalize(string)
filter(array, condition)

// Custom script nodes
validateEmail(email)
calculateTotal(items)
```

---

## Expression Examples

### Simple Transformations

```javascript
// String manipulation
user.name.toUpperCase()
user.email.toLowerCase()

// Number formatting
price.toFixed(2)
(count * 100).toString() + '%'

// Array operations
items.length
items[0].name
items.map(item => item.id)

// Object access
user.profile.avatar
settings.theme.colors.primary
```

### Conditional Logic

```javascript
// Ternary operator
user.isPremium ? 'gold' : 'gray'

// Logical operators
isLoggedIn && user.name
isLoading || 'Click to load'

// Nullish coalescing
user.nickname ?? user.name
```

### Complex Expressions

```javascript
// Combining multiple sources
global.currentUser.id === props.userId ? 'Edit' : 'View'

// Array filtering
items.filter(item => item.category === selectedCategory)

// Computed values
items.reduce((sum, item) => sum + item.price, 0)

// Date formatting
new Date(user.createdAt).toLocaleDateString('en-US')
```

---

## Script Nodes for Reusable Logic

When expressions get too complex, extract to script nodes:

### Creating a Script Node

**Visual Editor**: Add "Script Node" from component palette

**Configure**:
```
Name: formatUserData
Inputs:
  • rawUser (object)
  • locale (string)
Outputs:
  • displayName (string)
  • joinDate (string)
  • canEdit (boolean)
```

**Write Script** (`scripts/formatUserData.js`):
```javascript
export function formatUserData(inputs) {
  const { rawUser, locale } = inputs;
  
  return {
    displayName: `${rawUser.firstName} ${rawUser.lastName}`,
    joinDate: new Date(rawUser.createdAt).toLocaleDateString(locale),
    canEdit: rawUser.role === 'admin' || rawUser.id === inputs.currentUserId
  };
}

// Metadata for visual editor
export const metadata = {
  name: 'Format User Data',
  description: 'Transforms raw user object into display-ready format',
  inputs: {
    rawUser: { 
      type: 'object', 
      required: true,
      schema: {
        firstName: 'string',
        lastName: 'string',
        createdAt: 'string',
        role: 'string',
        id: 'string'
      }
    },
    locale: { 
      type: 'string', 
      default: 'en-US' 
    }
  },
  outputs: {
    displayName: { type: 'string' },
    joinDate: { type: 'string' },
    canEdit: { type: 'boolean' }
  }
};
```

### Using Script Node Output

In another component's property:

**Visual Editor**:
```
Property: text
Type: [Expression ▼]
┌─────────────────────────────┐
│ formatUserData.displayName  │
└─────────────────────────────┘
```

**Generated Code**:
```jsx
import { formatUserData } from './scripts/formatUserData';

export function UserProfile({ rawUser, locale }) {
  const { displayName, joinDate, canEdit } = formatUserData({ rawUser, locale });
  
  return (
    <div>
      <h1>{displayName}</h1>
      <p>Joined: {joinDate}</p>
      {canEdit && <button>Edit</button>}
    </div>
  );
}
```

---

## Type Validation

The expression editor validates types at edit time:

### Type Inference

```javascript
// ✅ Valid
<Text fontSize={12 + 4}>  // → number (fontSize expects number)

// ❌ Invalid
<Text fontSize="large">  // → string (fontSize expects number)
```

**Visual Editor Shows**:
```
⚠️ Type mismatch: fontSize expects number, got string
```

### Type Casting

```javascript
// Convert types explicitly
Number(user.age)  // string → number
String(count)     // number → string
Boolean(value)    // any → boolean
```

---

## Auto-Completion

The expression editor provides intelligent suggestions:

**Typing `user.`**:
```
┌─────────────────────────┐
│ user.                   │
├─────────────────────────┤
│ ↳ id          (string)  │
│ ↳ name        (string)  │
│ ↳ email       (string)  │
│ ↳ role        (string)  │
│ ↳ isPremium   (boolean) │
│ ↳ createdAt   (string)  │
└─────────────────────────┘
```

**Typing `global.`**:
```
┌──────────────────────────────┐
│ global.                      │
├──────────────────────────────┤
│ ↳ currentUser    (object)    │
│ ↳ theme          (string)    │
│ ↳ isAuthenticated (boolean)  │
└──────────────────────────────┘
```

Context is inferred from:
- Component prop types
- Global variable definitions
- Parent component state
- TypeScript interfaces (if available)

---

## Expression Compilation

### Simple Expressions

**Manifest**:
```json
{
  "type": "expression",
  "value": "user.name.toUpperCase()"
}
```

**Compiled**:
```jsx
{user.name.toUpperCase()}
```

### Complex Expressions with Dependencies

**Manifest**:
```json
{
  "type": "expression",
  "value": "global.users.find(u => u.id === props.userId).name"
}
```

**Compiled** (detects global dependency):
```jsx
import { useGlobalState } from '../runtime/globalState';

export function Component({ userId }) {
  const users = useGlobalState('users');
  
  return <div>{users.find(u => u.id === userId).name}</div>;
}
```

### Optimized Computed Values

**Manifest**:
```json
{
  "type": "expression",
  "value": "items.filter(i => i.price > 100).length"
}
```

**Compiled** (memoized for performance):
```jsx
import { useMemo } from 'react';

export function Component({ items }) {
  const expensiveItemsCount = useMemo(
    () => items.filter(i => i.price > 100).length,
    [items]
  );
  
  return <div>{expensiveItemsCount} expensive items</div>;
}
```

---

## Debugging Expressions

### Runtime Errors

If expression fails at runtime:

```javascript
// Expression: user.profile.avatar
// Error: Cannot read property 'avatar' of undefined
```

**Visual Editor Shows**:
```
⚠️ Runtime Error in UserCard.avatar:
   Cannot read property 'avatar' of undefined
   
   Expression: user.profile.avatar
   Context: user.profile is undefined
   
   Suggestion: Use optional chaining
   ✓ user.profile?.avatar
```

### Step Debugger

When stepping through execution:

```
┌─────────────────────────────────────────────┐
│ Evaluating Expression                       │
├─────────────────────────────────────────────┤
│ Component: UserCard                         │
│ Property: displayName                       │
│ Expression: user.firstName + ' ' + user... │
│                                             │
│ Available Context:                          │
│  • user = {                                 │
│      firstName: "John",                     │
│      lastName: "Doe"                        │
│    }                                        │
│                                             │
│ Result: "John Doe"                          │
└─────────────────────────────────────────────┘
```

---

## Best Practices

### ✅ DO:

**Keep expressions simple**
```javascript
// Good
user.name

// Good
user.firstName + ' ' + user.lastName

// Good
items.length > 0 ? 'Items available' : 'No items'
```

**Use optional chaining**
```javascript
// Good - handles undefined safely
user.profile?.avatar

// Good - provides fallback
user.nickname ?? user.firstName
```

**Extract complex logic to script nodes**
```javascript
// Instead of:
items.filter(i => i.category === cat && i.price < 100).map(i => i.name).join(', ')

// Do:
filterAndFormatItems({ items, category: cat, maxPrice: 100 })
```

### ❌ DON'T:

**Don't write multi-line expressions**
```javascript
// Bad
items.map(item => {
  if (item.price > 100) {
    return item.name.toUpperCase();
  }
  return item.name;
}).join(', ')

// Use script node instead
```

**Don't mutate state in expressions**
```javascript
// Bad - side effects
items.push(newItem)

// Bad - modifies array
items.sort()

// Use event handlers instead
```

**Don't access external APIs directly**
```javascript
// Bad
fetch('/api/users')

// Bad
localStorage.getItem('user')

// Use script nodes with proper async handling
```

---

## Future Enhancements

- **Visual Expression Builder**: Drag-drop expression construction (like n8n)
- **Expression Templates**: Library of common patterns
- **AI Assistance**: Natural language → expression conversion
- **Performance Profiling**: Identify slow expressions
- **Live Expression Testing**: Test expressions with sample data

---

**See Also**:
- [Data Flow Model](./DATA_FLOW.md) - How expressions fit into data architecture
- [Component Schema](./COMPONENT_SCHEMA.md) - Expression storage format
- [Debugger Design](./DEBUGGER_DESIGN.md) - Debugging expression evaluation