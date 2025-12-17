# Bidirectional Sync

## Overview

Bidirectional sync allows developers to edit generated code directly in their IDE, then have those changes automatically reflected back in the visual editor. This creates a truly hybrid workflow where you can switch between visual and code editing seamlessly.

> **Status**: Stretch goal for post-MVP. Initial release will support visual → code (one direction only).

## The Challenge

Keeping two representations synchronized:

```
Visual Editor (Manifest) ←→ Generated Code (Files)
```

**Easy Direction** (Already working):
- Manifest → Code: Code generation from manifest

**Hard Direction** (This document):
- Code → Manifest: Reverse engineering edits back to manifest

## Core Concepts

### 1. Change Detection

**File Watcher** monitors for file changes:

```typescript
class FileWatcher {
  watch(projectPath: string) {
    const watcher = chokidar.watch(`${projectPath}/src/**/*.{jsx,tsx}`, {
      ignored: ['node_modules', 'dist'],
      persistent: true
    });

    watcher.on('change', async (filepath) => {
      const change = await this.analyzeChange(filepath);
      
      if (change.source === 'tool') {
        // Ignore - we generated this
        return;
      }
      
      if (change.source === 'user') {
        // User edited manually - sync needed
        await this.syncToManifest(filepath, change);
      }
    });
  }
}
```

### 2. Source Attribution

**How to know who made the change?**

**Approach 1: Comment Markers**

```jsx
/**
 * @lowcode:generated
 * @lowcode:component-id: userCard
 * @lowcode:last-generated: 2025-10-25T10:00:00Z
 * @lowcode:checksum: a1b2c3d4
 */
export default function UserCard({ user }) {
  // Component code
}
```

**Approach 2: Git-style Tracking**

```typescript
interface FileMetadata {
  filepath: string;
  lastGenerated: Date;
  generatedChecksum: string;
  currentChecksum: string;
  isUserModified: boolean;
}
```

**Decision Logic**:

```typescript
function getChangeSource(file: File): 'tool' | 'user' {
  const metadata = this.getMetadata(file.path);
  
  // If we just generated this file (within last 1 second)
  if (Date.now() - metadata.lastGenerationTime < 1000) {
    return 'tool';
  }
  
  // If checksum matches last generation
  if (file.checksum === metadata.generatedChecksum) {
    return 'tool';
  }
  
  // Otherwise, user edited it
  return 'user';
}
```

---

## Reverse Engineering Strategy

### Parsing Approach

Use **AST (Abstract Syntax Tree)** parsing:

```typescript
import * as babel from '@babel/parser';
import traverse from '@babel/traverse';

class ReverseEngineer {
  parseComponent(code: string): Component {
    // Parse code to AST
    const ast = babel.parse(code, {
      sourceType: 'module',
      plugins: ['jsx', 'typescript']
    });
    
    const component: Partial<Component> = {};
    
    // Traverse AST to extract component info
    traverse(ast, {
      // Find function component
      FunctionDeclaration(path) {
        if (this.isComponentFunction(path)) {
          component.name = path.node.id.name;
          component.props = this.extractProps(path);
        }
      },
      
      // Find useState calls
      CallExpression(path) {
        if (this.isUseStateCall(path)) {
          component.state = this.extractState(path);
        }
      },
      
      // Find JSX return
      ReturnStatement(path) {
        if (this.isJSXReturn(path)) {
          component.children = this.extractJSX(path);
        }
      }
    });
    
    return component as Component;
  }
}
```

### What Can Be Parsed Automatically

✅ **High Confidence**:
- Component name
- Props interface/types
- State variables (useState)
- JSX structure (elements, nesting)
- Static prop values
- Simple expressions
- Event handlers (basic)

⚠️ **Medium Confidence** (needs validation):
- Complex expressions
- Conditional rendering
- Loops/maps
- Custom hooks
- Component composition

❌ **Requires AI Assistance**:
- Business logic interpretation
- Complex state transformations
- Side effects
- API calls
- Non-standard patterns

---

## Sync Scenarios

### Scenario 1: Simple Property Edit

**User Changes**:
```jsx
// Before
<Text>Welcome</Text>

// After
<Text>Hello, User!</Text>
```

**Sync Result**:
```json
{
  "props": {
    "children": {
      "type": "static",
      "value": "Hello, User!"
    }
  }
}
```

**Confidence**: ✅ High - Direct mapping

---

### Scenario 2: Add New State

**User Changes**:
```jsx
// Before
export default function UserCard({ user }) {
  return <div>{user.name}</div>;
}

// After
export default function UserCard({ user }) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  return (
    <div onClick={() => setIsExpanded(!isExpanded)}>
      {user.name}
    </div>
  );
}
```

**Sync Result**:
```json
{
  "state": {
    "isExpanded": {
      "type": "boolean",
      "default": false,
      "exposed": false
    }
  },
  "handlers": {
    "onClick": {
      "type": "inline",
      "action": "setIsExpanded(!isExpanded)"
    }
  }
}
```

**Confidence**: ✅ High - Standard React pattern

---

### Scenario 3: Complex Expression

**User Changes**:
```jsx
// Before
<Text>{user.name}</Text>

// After
<Text>
  {user.firstName} {user.lastName} 
  {user.role === 'admin' && ' (Admin)'}
</Text>
```

**Parsing Result**:
```typescript
{
  type: 'expression',
  raw: "user.firstName + ' ' + user.lastName + (user.role === 'admin' && ' (Admin)')",
  confidence: 0.7  // Medium confidence - complex expression
}
```

**AI Validation**:
```
🤖 AI Review Request:
─────────────────────
User edited expression in UserCard.name:

Old: user.name
New: {user.firstName} {user.lastName} {user.role === 'admin' && ' (Admin)'}

Parsed as:
  user.firstName + ' ' + user.lastName + (user.role === 'admin' && ' (Admin)')

Is this correct? [Yes] [No - suggest correction]
```

---

### Scenario 4: New Component Addition

**User Changes**:
```jsx
// User adds entirely new component in middle
export default function UserCard({ user }) {
  return (
    <div>
      <Text>{user.name}</Text>
      <Badge color="blue">Premium</Badge>  {/* NEW */}
      <Button>Contact</Button>
    </div>
  );
}
```

**Sync Challenge**: Parser finds new `<Badge>` component

**Options**:

**Option A: Auto-add to manifest**
```json
{
  "children": [
    { "type": "Text", "props": {...} },
    { 
      "type": "Badge",  // Auto-detected
      "props": {
        "color": { "type": "static", "value": "blue" },
        "children": { "type": "static", "value": "Premium" }
      },
      "metadata": {
        "userAdded": true,  // Flag as manually added
        "needsReview": true
      }
    },
    { "type": "Button", "props": {...} }
  ]
}
```

**Option B: Prompt user**
```
┌────────────────────────────────────────────────┐
│ 🆕 New Component Detected                     │
├────────────────────────────────────────────────┤
│                                                │
│ You added: <Badge color="blue">Premium</Badge>│
│                                                │
│ How should this be registered?                │
│                                                │
│ ○ Standard component (from library)           │
│ ○ Custom component (create new)               │
│ ○ Inline element (don't track)                │
│                                                │
│ [Continue]                                     │
└────────────────────────────────────────────────┘
```

---

## AI-Assisted Sync

For ambiguous changes, leverage AI:

### AI Sync Pipeline

```typescript
class AISyncAssistant {
  async analyzeChange(oldCode: string, newCode: string): Promise<SyncPlan> {
    const diff = this.computeDiff(oldCode, newCode);
    
    // If changes are clear, proceed automatically
    if (diff.confidence > 0.9) {
      return {
        action: 'auto-sync',
        changes: diff.manifestChanges
      };
    }
    
    // If ambiguous, ask AI
    const aiAnalysis = await this.getAIAnalysis(oldCode, newCode, diff);
    
    return {
      action: 'review-required',
      suggestion: aiAnalysis.suggestion,
      alternatives: aiAnalysis.alternatives
    };
  }
  
  async getAIAnalysis(oldCode: string, newCode: string, diff: Diff): Promise<AIAnalysis> {
    const prompt = `
      A user edited a React component. Help me understand their intent.
      
      Old code:
      ${oldCode}
      
      New code:
      ${newCode}
      
      Changes detected:
      ${JSON.stringify(diff, null, 2)}
      
      Questions:
      1. What was the user trying to accomplish?
      2. How should this be represented in the component manifest?
      3. Are there any concerns or ambiguities?
      
      Respond with JSON:
      {
        "intent": "string",
        "manifestChanges": {...},
        "confidence": 0-1,
        "concerns": ["..."]
      }
    `;
    
    const response = await callClaudeAPI(prompt);
    return JSON.parse(response);
  }
}
```

---

## Conflict Resolution

### Conflict Types

**1. Concurrent Edits**

User edits code while visual editor is also making changes:

```
Time 0: User opens file in VSCode
Time 1: User edits line 10
Time 2: Visual editor regenerates file (overwrites line 10)
Time 3: Conflict!
```

**Solution**: Git-like merge

```
┌────────────────────────────────────────────────┐
│ ⚠️ Merge Conflict                             │
├────────────────────────────────────────────────┤
│                                                │
│ Line 10: <Text fontSize={16}>                 │
│                                                │
│ <<<<<<< Visual Editor                          │
│ <Text fontSize={18}>                           │
│ =======                                        │
│ <Text fontSize={20}>                           │
│ >>>>>>> Your Changes                           │
│                                                │
│ Choose:                                        │
│ ○ Keep visual editor version (18)             │
│ ○ Keep your version (20)                      │
│ ○ Edit manually                                │
│                                                │
│ [Resolve]                                      │
└────────────────────────────────────────────────┘
```

**2. Manifest vs Code Mismatch**

Manifest and code diverge over time:

```typescript
interface ManifestCodeMismatch {
  componentId: string;
  issue: 'missing' | 'extra' | 'different';
  manifestVersion: any;
  codeVersion: any;
  recommendation: 'trust-manifest' | 'trust-code' | 'manual-review';
}
```

**Solution**: Trust manifest as source of truth (with option to override)

```
┌────────────────────────────────────────────────┐
│ ⚠️ Sync Mismatch                              │
├────────────────────────────────────────────────┤
│                                                │
│ Component: UserCard                            │
│ Property: fontSize                             │
│                                                │
│ Manifest says: 18                              │
│ Code says:     20                              │
│                                                │
│ [Trust Manifest] [Trust Code] [Review]        │
└────────────────────────────────────────────────┘
```

---

## Sync Modes

### Mode 1: Auto-Sync (Aggressive)

- Automatically parse and update manifest
- Show notification of changes
- Allow undo

**Use case**: Experienced developers who know what they're doing

### Mode 2: Review Required (Safe, Default)

- Parse changes and show diff
- Require user approval before updating manifest
- Highlight ambiguous changes

**Use case**: Default for most users

### Mode 3: Manual Sync (Conservative)

- Only sync when user explicitly clicks "Sync"
- Show full diff with explanations
- Allow editing suggestions before applying

**Use case**: Users who prefer full control

---

## Limitations & Edge Cases

### Cannot Automatically Sync

❌ **Complex Custom Logic**
```jsx
// This is too complex to reverse engineer
const processedData = useMemo(() => {
  return data
    .filter(item => someComplexCondition(item))
    .map(transformItem)
    .reduce(aggregateResults, initialValue);
}, [data, dep1, dep2]);
```

**Solution**: Mark as "user-maintained region" - don't touch

❌ **External Dependencies**
```jsx
import { someUtil } from '@external/library';

// Uses external logic
const result = someUtil(data);
```

**Solution**: Treat as opaque - preserve but don't parse

❌ **Non-Standard Patterns**
```jsx
// HOCs, render props, custom patterns
export default withAuth(withLogging(UserCard));
```

**Solution**: Preserve wrapper, sync inner component only

---

## Protected Regions

Allow users to mark code sections as "do not modify":

```jsx
export default function UserCard({ user }) {
  const [state, setState] = useState(false);
  
  /* @lowcode:start-preserve */
  // Custom business logic - tool will not modify this
  const complexCalculation = () => {
    // User's complex logic here
  };
  /* @lowcode:end-preserve */
  
  return <div>{user.name}</div>;
}
```

Visual editor shows:

```
┌────────────────────────────────────────────────┐
│ UserCard                                       │
├────────────────────────────────────────────────┤
│                                                │
│ Props: user                                    │
│ State: state                                   │
│                                                │
│ 🔒 Protected Region: complexCalculation        │
│    (Edited manually - not synced)             │
│                                                │
└────────────────────────────────────────────────┘
```

---

## Implementation Phases

### Phase 1: One-Way (MVP)
- ✅ Visual → Code generation
- ❌ No reverse sync

### Phase 2: Detection Only
- ✅ Detect user edits
- ✅ Show warning in UI
- ❌ No automatic sync
- Option: "Discard changes" or "Keep code as-is"

### Phase 3: Simple Sync
- ✅ Parse simple edits (text, props, basic state)
- ✅ Auto-sync high-confidence changes
- ⚠️ Flag complex changes for review

### Phase 4: AI-Assisted Sync
- ✅ Use AI for ambiguous parsing
- ✅ Suggest manifest updates
- ✅ Learn from user corrections

### Phase 5: Full Bidirectional (Future)
- ✅ Real-time sync
- ✅ Conflict resolution
- ✅ Protected regions
- ✅ Merge strategies

---

## Best Practices

### ✅ For Tool Developers:

**Prioritize manifest as source of truth**
- When in doubt, trust the manifest
- Code is a "view" of the manifest

**Be conservative**
- Better to ask user than make wrong assumption
- Flag ambiguous changes clearly

**Provide escape hatches**
- Protected regions
- Manual sync mode
- "Trust code" override

### ✅ For Users:

**Use visual editor for structure**
- Add/remove components
- Set properties
- Wire connections

**Use code editor for logic**
- Complex expressions
- Business logic
- Performance optimizations

**Mark protected regions**
- Custom hooks
- Complex calculations
- Third-party integrations

---

## Testing Strategy

### Unit Tests

```typescript
describe('ReverseEngineer', () => {
  it('parses simple component', () => {
    const code = `
      export default function Button({ label }) {
        return <button>{label}</button>;
      }
    `;
    
    const component = parser.parseComponent(code);
    
    expect(component.name).toBe('Button');
    expect(component.props.label).toBeDefined();
  });
  
  it('extracts useState', () => {
    const code = `
      const [count, setCount] = useState(0);
    `;
    
    const state = parser.extractState(code);
    
    expect(state.count.type).toBe('number');
    expect(state.count.default).toBe(0);
  });
});
```

### Integration Tests

```typescript
describe('Bidirectional Sync', () => {
  it('syncs simple text edit', async () => {
    // 1. Generate code from manifest
    const code = generator.generate(manifest);
    await fs.writeFile('UserCard.jsx', code);
    
    // 2. User edits code
    const edited = code.replace('Welcome', 'Hello');
    await fs.writeFile('UserCard.jsx', edited);
    
    // 3. Detect and sync
    await syncEngine.syncFile('UserCard.jsx');
    
    // 4. Verify manifest updated
    const updated = await loadManifest();
    expect(updated.components.userCard.props.text.value).toBe('Hello');
  });
});
```

---

**See Also**:
- [Architecture](./ARCHITECTURE.md) - File watching infrastructure
- [Component Schema](./COMPONENT_SCHEMA.md) - Manifest format
- [Plugin System](./PLUGIN_SYSTEM.md) - Framework-specific parsing