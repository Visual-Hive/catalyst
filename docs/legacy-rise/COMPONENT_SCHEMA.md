# COMPONENT_SCHEMA.md - Critical Updates Required

> Based on comprehensive audit findings - reduce scope to MVP Level 1, add schema level indicators

---

## 🚨 CRITICAL SCOPE REDUCTION

### Problem Identified

Current COMPONENT_SCHEMA.md shows **Level 3 (Advanced) features** but MVP only implements **Level 1 (Basic)**.

**Examples of features shown that are NOT in MVP**:
- ❌ Live database queries (dataConnections)
- ❌ Real-time WebSocket transport
- ❌ AI code review integration
- ❌ Performance metrics
- ❌ Testing integration
- ❌ Complex expressions
- ❌ Event handlers
- ❌ State management

**Impact**: Misleading for developers, creates impossible expectations

---

## ✅ REQUIRED CHANGES

### 1. Add Schema Level Indicator at Top

**Location**: After "Philosophy" section, before "Schema Overview"

**✅ Required Addition**:

```markdown
## Schema Levels

Rise implements a **progressive schema system** to manage complexity:

```
📊 Schema Version Levels
├─ Level 1 (MVP)       - Weeks 1-12  - This document shows mostly Level 1
├─ Level 2 (Enhanced)  - Weeks 13-24 - Some Level 2 features shown
└─ Level 3 (Advanced)  - Week 25+    - Level 3 features marked clearly
```

**Legend used in this document**:
- 🟢 **Level 1 (MVP)**: Ready for initial implementation
- 🟡 **Level 2 (Enhanced)**: Post-MVP, weeks 13-24
- 🔴 **Level 3 (Advanced)**: Future, week 25+

**See**: [SCHEMA_LEVELS.md](./SCHEMA_LEVELS.md) for complete level definitions

**Critical**: Only implement features matching your current level!
```

---

### 2. Update Schema Overview Section

**Location**: Replace entire "Version 1.0.0 Structure" section

**❌ Remove**: Current structure showing all advanced features

**✅ Replace With**:

```markdown
### Level 1 (MVP) Schema Structure 🟢

```json
{
  "schemaVersion": "1.0.0",
  "level": 1,
  "metadata": { 
    "projectName": "string",
    "framework": "react",
    "createdAt": "datetime"
  },
  "buildConfig": { 
    "bundler": "vite",
    "cssFramework": "tailwind" 
  },
  "plugins": { 
    "framework": {
      "name": "@rise/plugin-react",
      "version": "1.0.0"
    }
  },
  "components": { 
    /* Component definitions - see below */
  }
}
```

**What's NOT in Level 1**:
- ❌ globalFunctions (Level 2)
- ❌ globalState (Level 2)
- ❌ connections (Level 2)
- ❌ routes (Level 3)
- ❌ api (Level 3)
- ❌ database (Level 3)
- ❌ analytics (Level 3)
- ❌ migrations (Level 3)

---

### Level 2 (Enhanced) Schema Additions 🟡

**Available**: Weeks 13-24

**Adds**:
```json
{
  "globalFunctions": { /* User-defined functions */ },
  "globalState": { /* Reactive variables */ },
  "connections": [ /* Data flow connections */ ]
}
```

---

### Level 3 (Advanced) Schema Additions 🔴

**Available**: Week 25+

**Adds**:
```json
{
  "routes": [ /* Application routing */ ],
  "api": { /* API configuration */ },
  "database": { /* Database setup */ },
  "analytics": { /* Performance metrics */ }
}
```
```

---

### 3. Replace ChatMessage Example

**Location**: "Complete Component Definition" section

**❌ Current Problem**: Shows Level 3 features (dataConnections, codeReview, performance monitoring)

**✅ Replace With Level 1 Example**:

```markdown
## Level 1 (MVP) Component Example 🟢

### Simple Button Component

```json
{
  "components": {
    "comp_button_001": {
      "id": "comp_button_001",
      "displayName": "Button",
      "type": "button",
      "category": "basic",
      
      "properties": {
        "label": {
          "type": "static",
          "value": "Click me",
          "dataType": "string"
        },
        "disabled": {
          "type": "static",
          "value": false,
          "dataType": "boolean"
        },
        "variant": {
          "type": "prop",
          "dataType": "string",
          "required": false,
          "default": "primary",
          "options": ["primary", "secondary", "danger"]
        }
      },
      
      "styling": {
        "baseClasses": ["btn", "rounded-lg", "px-4", "py-2"],
        "conditionalClasses": {
          "container": [
            "props.variant === 'primary' ? 'bg-blue-500 text-white' : ''",
            "props.variant === 'secondary' ? 'bg-gray-200 text-gray-800' : ''",
            "props.variant === 'danger' ? 'bg-red-500 text-white' : ''"
          ]
        }
      },
      
      "children": [],
      
      "metadata": {
        "createdAt": "2025-10-25T10:00:00Z",
        "author": "user",
        "version": "1.0.0"
      }
    }
  }
}
```

### Generated Code (Level 1)

```jsx
import React from 'react';

/**
 * @rise:generated
 * Level: 1 (MVP)
 * Component: Button
 * Generated: 2025-10-25T10:00:00Z
 */
export function Button({ 
  label = "Click me", 
  disabled = false,
  variant = "primary" 
}) {
  // Determine variant classes
  const variantClass = 
    variant === 'primary' ? 'bg-blue-500 text-white' :
    variant === 'secondary' ? 'bg-gray-200 text-gray-800' :
    variant === 'danger' ? 'bg-red-500 text-white' :
    'bg-blue-500 text-white'; // default

  return (
    <button 
      className={`btn rounded-lg px-4 py-2 ${variantClass}`}
      disabled={disabled}
    >
      {label}
    </button>
  );
}
```

**Characteristics**:
- ✅ Clean, simple React
- ✅ No hooks or complex state
- ✅ Standard props
- ✅ Basic conditional styling
- ✅ Fully functional

---

## Level 2 (Enhanced) Component Example 🟡

**Available**: Post-MVP (Weeks 13-24)

Shows expressions, state, events:

```json
{
  "comp_user_card_001": {
    "id": "comp_user_card_001",
    "displayName": "UserCard",
    "level": 2,
    
    "properties": {
      "user": {
        "type": "prop",
        "dataType": "object",
        "required": true
      },
      "displayName": {
        "type": "expression",
        "expression": "props.user.firstName + ' ' + props.user.lastName",
        "dependencies": ["props.user.firstName", "props.user.lastName"]
      }
    },
    
    "localState": {
      "isExpanded": {
        "type": "boolean",
        "default": false
      }
    },
    
    "eventHandlers": {
      "onClick": {
        "action": "setState",
        "target": "isExpanded",
        "value": "!state.isExpanded"
      }
    }
  }
}
```

**Note**: This requires SECURITY_SPEC.md expression sandboxing!

---

## Level 3 (Advanced) Component Example 🔴

**Available**: Future (Week 25+)

Shows real-time data, AI review, performance monitoring:

```json
{
  "comp_chat_message_001": {
    "id": "comp_chat_message_001",
    "displayName": "ChatMessage",
    "level": 3,
    
    "dataConnections": {
      "reactions": {
        "type": "liveQuery",
        "source": "supabase.reactions",
        "realtime": true
      }
    },
    
    "codeReview": {
      "aiFindings": ["Performance: Good memoization"],
      "userAcknowledged": true
    },
    
    "performance": {
      "memoization": ["displayName", "timeAgo"],
      "metrics": {
        "renderTime": "12ms"
      }
    }
  }
}
```

**Note**: This requires Supabase plugin, AI integration, performance monitoring!
```

---

### 4. Update Property Types Section

**Location**: "Property Types Reference" section

**✅ Add Level Indicators**:

```markdown
## Property Types by Level

### Level 1 (MVP) 🟢

#### Static Values
```json
{
  "title": {
    "type": "static",
    "value": "Dashboard",
    "dataType": "string"
  }
}
```

#### Props (Component Inputs)
```json
{
  "userData": {
    "type": "prop",
    "dataType": "object",
    "required": true,
    "default": null
  }
}
```

**That's it for Level 1!** No expressions, state, or events yet.

---

### Level 2 (Enhanced) 🟡

Adds these property types:

#### Expressions
```json
{
  "dynamicText": {
    "type": "expression",
    "expression": "props.user.firstName + ' ' + props.user.lastName",
    "dependencies": ["props.user.firstName", "props.user.lastName"]
  }
}
```

**Security**: Must implement SECURITY_SPEC.md before using!

#### State Variables
```json
{
  "isVisible": {
    "type": "state",
    "dataType": "boolean",
    "default": false
  }
}
```

#### Event Handlers
```json
{
  "onClick": {
    "type": "eventHandler",
    "action": "setState",
    "target": "isVisible",
    "value": "!state.isVisible"
  }
}
```

---

### Level 3 (Advanced) 🔴

Adds these property types:

#### Data Connections
```json
{
  "userList": {
    "type": "liveQuery",
    "source": "database.users",
    "realtime": true
  }
}
```

**Requirements**: Database plugin, WebSocket handling
```

---

### 5. Add MVP Limitations Section

**Location**: Add new section after "Property Types"

**✅ Required Addition**:

```markdown
## MVP Limitations (Level 1) 🟢

### What You CAN Do in MVP:

✅ **Components**:
- Create unlimited components
- Nest components (max 5 levels deep)
- Use props to pass data down
- Basic conditional styling

✅ **Properties**:
- Static values (strings, numbers, booleans)
- Props from parent components
- Simple conditional classes

✅ **Styling**:
- Tailwind utility classes
- Custom CSS (sanitized)
- Variant-based styling

✅ **Generated Code**:
- Clean, readable React
- Standard component patterns
- Works with any React project

---

### What You CANNOT Do in MVP (Coming Soon):

❌ **Not Until Level 2** (Weeks 13-24):
- Custom JavaScript expressions
- Component state (useState)
- Event handlers (onClick, etc.)
- Computed properties
- Global state management
- Global functions

❌ **Not Until Level 3** (Week 25+):
- Real-time data connections
- Database integration
- AI code review
- Performance monitoring
- Advanced routing
- Testing integration

**See**: [SCHEMA_LEVELS.md](./SCHEMA_LEVELS.md) for migration path
```

---

### 6. Remove or Clearly Mark Advanced Examples

**Location**: Throughout document

**✅ Required Changes**:

**Option A**: Remove all Level 2 and Level 3 examples from this doc and move them to separate docs:
- SCHEMA_LEVEL_2_EXAMPLES.md
- SCHEMA_LEVEL_3_EXAMPLES.md

**Option B**: Keep examples but add prominent warnings:

```markdown
---
⚠️ **LEVEL 3 EXAMPLE - NOT FOR MVP**

The following example shows **advanced features** that will not be available until Week 25+.

**Requirements**:
- Database plugin installed
- WebSocket support
- AI integration
- Performance monitoring

**Do not attempt to implement these features in MVP!**

---

[example here]
```

**Recommendation**: Use Option A (separate docs) to avoid confusion

---

### 7. Update "AI Integration Features" Section

**Location**: "AI Integration Features" section

**❌ Current Problem**: Shows Level 3 features without warning

**✅ Required Update**:

Add at top of section:

```markdown
## AI Integration Features 🔴 **LEVEL 3 ONLY**

**Available**: Week 25+  
**Status**: Not in MVP  
**Dependencies**: AI provider integration, cost management system

⚠️ **This section describes future functionality**

---

[existing content with warning maintained]
```

---

### 8. Update Code Generation Examples

**Location**: "Code Generation Examples" section

**✅ Required Addition**:

```markdown
## Code Generation Examples by Level

### Level 1 (MVP) Output 🟢

**Simple, clean React with no complexity**:

```jsx
import React from 'react';

/**
 * @rise:generated
 * Level: 1 (MVP)
 * Component: Button
 * Generated: 2025-10-25T10:00:00Z
 */
export function Button({ label, disabled, variant = 'primary' }) {
  const variantClass = 
    variant === 'primary' ? 'bg-blue-500' :
    variant === 'secondary' ? 'bg-gray-200' :
    'bg-blue-500';

  return (
    <button 
      className={`btn ${variantClass}`}
      disabled={disabled}
    >
      {label}
    </button>
  );
}
```

**Characteristics**:
- No hooks
- No complex logic
- Standard props only
- Conditional styling with ternary
- Fully functional and testable

---

### Level 2 (Enhanced) Output 🟡

**With hooks, state, and expressions**:

```jsx
import React, { useState, useMemo } from 'react';
import { formatTimeAgo } from '../utils/globalFunctions/user';

/**
 * @rise:generated
 * Level: 2 (Enhanced)
 * Component: UserCard
 * Generated: 2025-10-25T10:00:00Z
 */
export function UserCard({ user }) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const displayName = useMemo(
    () => user.firstName + ' ' + user.lastName,
    [user.firstName, user.lastName]
  );
  
  return (
    <div onClick={() => setIsExpanded(!isExpanded)}>
      <h2>{displayName}</h2>
      {isExpanded && <p>{user.bio}</p>}
    </div>
  );
}
```

---

### Level 3 (Advanced) Output 🔴

**With real-time data and AI optimizations**:

[Complex example with Supabase, WebSockets, etc.]
```

---

### 9. Update Cross-Framework Translation Section

**Location**: "Cross-Framework Translation" section

**✅ Add at top**:

```markdown
## Cross-Framework Translation

**Level 1 (MVP)**: React only  
**Level 2 (Enhanced)**: React + Vue plugin  
**Level 3 (Advanced)**: All framework plugins

---

[existing content]
```

---

### 10. Add Validation Rules Section

**Location**: After "Property Types" section

**✅ Required Addition**:

```markdown
## Schema Validation Rules

### Level 1 Validator

```typescript
class Level1SchemaValidator {
  validate(schema: ComponentSchema): ValidationResult {
    const errors: ValidationError[] = [];

    // Only static and prop types allowed
    for (const prop of Object.values(schema.properties)) {
      if (!['static', 'prop'].includes(prop.type)) {
        errors.push({
          field: prop.name,
          message: `Property type '${prop.type}' not supported in Level 1`,
          hint: 'Use type "static" or "prop" only',
          level: 'ERROR'
        });
      }
    }

    // No event handlers
    if (schema.eventHandlers) {
      errors.push({
        field: 'eventHandlers',
        message: 'Event handlers not available in Level 1',
        hint: 'Event handlers coming in Level 2 (weeks 13-24)',
        level: 'ERROR'
      });
    }

    // No state management
    if (schema.localState || schema.globalState) {
      errors.push({
        field: 'state',
        message: 'State management not available in Level 1',
        hint: 'State management coming in Level 2',
        level: 'ERROR'
      });
    }

    // No expressions
    for (const prop of Object.values(schema.properties)) {
      if (prop.type === 'expression') {
        errors.push({
          field: prop.name,
          message: 'Expressions not available in Level 1',
          hint: 'Expressions require security sandbox (Level 2)',
          level: 'ERROR'
        });
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      level: 1
    };
  }
}
```

**Implementation**: This validator MUST run before code generation in MVP!
```

---

## 📝 GLOBAL SEARCH & REPLACE

### Required Text Replacements:

1. **Replace all occurrences**:
   - "Component Schema v1.0.0" → "Component Schema v1.0.0 (Progressive Levels)"

2. **Add to every complex example**:
   - Add level indicator: `🟢 Level 1 (MVP)` or `🟡 Level 2` or `🔴 Level 3`

3. **Add to every code generation example**:
   ```jsx
   /**
    * @rise:generated
    * Level: 1 (MVP)  // ← ADD THIS LINE
    * Component: ComponentName
    */
   ```

---

## ✅ VALIDATION CHECKLIST

Before considering COMPONENT_SCHEMA.md complete:

- [ ] Schema levels prominently displayed at top
- [ ] All examples marked with level indicators (🟢🟡🔴)
- [ ] MVP limitations section added
- [ ] ChatMessage example replaced with simple Button
- [ ] Level 1 validator code added
- [ ] Advanced features clearly marked as Level 3
- [ ] Cross-references to SCHEMA_LEVELS.md added
- [ ] Generated code shows level in comments
- [ ] Property types organized by level
- [ ] Database/API features marked as Level 3

---

## IMPACT ON OTHER DOCUMENTS

These COMPONENT_SCHEMA.md updates require corresponding changes in:

1. **MVP_ROADMAP.md**:
   - Remove any references to Level 2/3 features from MVP phase
   - Align Phase 1 with Level 1 schema only

2. **GETTING_STARTED.md**:
   - Show only Level 1 examples
   - Remove expression editor screenshots
   - Add note about upcoming levels

3. **README.md**:
   - Update feature matrix with levels
   - Clarify what's MVP vs post-MVP

4. **EXPRESSION_SYSTEM.md**:
   - Add prominent "Level 2 Feature" warning at top
   - Reference SCHEMA_LEVELS.md

---

**Priority**: 🚨 **CRITICAL - Must complete before MVP implementation**

**Review Required**: 
- Lead Developer
- Product Manager
- Technical Writer

**Estimated Time**: 6-8 hours to apply all updates

---

**Last Updated**: October 25, 2025  
**Status**: 🔴 Pending Implementation