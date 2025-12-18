# Task 1.4D: Console UI Components & Integration (Final)

**Phase:** Phase 1 - Application Shell  
**Duration Estimate:** 1.5-2 days  
**Actual Duration:** [TBD]  
**Status:** 🔵 Not Started  
**Assigned:** AI (Cline) + Human Review  
**Priority:** P1 - Core Feature  
**Dependencies:** Task 1.4C ✅  
**Started:** [YYYY-MM-DD]  
**Completed:** [YYYY-MM-DD]

---

## 🎯 Task Overview

### Objective
Complete the console system by implementing all UI components (ObjectTree, ConsoleEntry, ConsolePanel) and integrating them with the preview iframe to create a fully functional Chrome DevTools-style console.

### Problem Statement
Task 1.4C established the foundation (types, injection, state management). Now we need:
- Visual components to display console logs
- Recursive object tree inspection
- Virtual scrolling for performance
- Filter/search functionality
- Integration with preview iframe
- User-friendly error display

### Success Criteria
- [ ] ObjectTree component renders nested objects recursively
- [ ] ConsoleEntry displays all log types (log, warn, error, table, group, trace)
- [ ] ConsoleTable renders tabular data
- [ ] ConsolePanel with virtual scrolling handles 10k+ logs
- [ ] Filter by type with counts
- [ ] Search with regex support
- [ ] Error count badge on Console tab
- [ ] Console injection works in preview iframe
- [ ] Clear console on project switch
- [ ] Export logs functionality
- [ ] Auto-scroll control
- [ ] Performance: <10ms to append log entry

### References
- **Task 1.4C** - Console Foundation (types, injection, state)
- **Task 1.4B** - PreviewPanel (iframe where console runs)
- **docs/PERFORMANCE.md** - Virtual scrolling requirements
- **docs/ARCHITECTURE.md** - Console architecture

---

## 🏗️ Architecture

### Component Hierarchy

```
EditorPanel
└── Console Tab
    └── ConsolePanel (main container)
        ├── ConsoleToolbar
        │   ├── Filter Buttons (All, Log, Warn, Error, Info, Table, Group)
        │   │   └── Count Badges
        │   ├── Search Input (regex support)
        │   ├── Clear Button
        │   ├── Export Button (JSON/text)
        │   └── Auto-scroll Toggle
        ├── ConsoleBody (react-window virtual list)
        │   └── ConsoleEntry[] (virtualized)
        │       ├── Timestamp
        │       ├── Type Icon
        │       ├── Message Content
        │       │   ├── Primitives (inline)
        │       │   ├── ObjectTree (expandable)
        │       │   └── ConsoleTable (tabular)
        │       └── StackTrace (collapsible)
        └── ConsoleFooter
            ├── Total log count
            ├── Error/warning counts
            └── Filter/search status
```

### Data Flow

```
Preview Iframe (user's app)
        ↓
console.log('Hello', {data: 123})
        ↓
Injected Override (consoleInjector.ts)
        ↓
Serialize arguments + metadata
        ↓
postMessage to parent
        ↓
PreviewFrame (addEventListener)
        ↓
previewStore.addConsoleLog()
        ↓
ConsolePanel (subscribes to store)
        ↓
Virtual List renders visible entries
        ↓
ConsoleEntry → ObjectTree/ConsoleTable
```

### State Management (Already in Task 1.4C)

```typescript
// previewStore.ts (console slice)
interface ConsoleState {
  logs: ConsoleEntry[];           // All log entries
  maxLogs: 10000;                 // Limit for memory
  filter: ConsoleFilter;          // Active filter
  searchQuery: string;            // Search text
  searchRegex: boolean;           // Regex mode?
  autoScroll: boolean;            // Auto-scroll to bottom?
  errorCount: number;             // Total errors
  warningCount: number;           // Total warnings
}
```

---

## 📋 Implementation Phases

### Phase 1: ObjectTree Component (HIGH COMPLEXITY)

#### 1.1 ObjectTree Component
**File:** `src/renderer/components/Console/ObjectTree.tsx`  
**Lines:** ~350  
**Complexity:** HIGH (recursive rendering)

**Features:**
- Recursive tree rendering with expand/collapse
- Type-aware display (strings, numbers, booleans, objects, arrays, functions)
- Syntax highlighting:
  - Strings: `text-green-600` ("value")
  - Numbers: `text-blue-600` (123)
  - Booleans: `text-purple-600` (true/false)
  - Null/Undefined: `text-gray-500`
  - Keys: `text-gray-700`
  - Functions: `text-gray-600 italic` (ƒ functionName())
- Circular reference markers: `text-red-600 italic` [[Circular]]
- Max depth limiting (prevent infinite recursion)
- Lazy rendering (only render expanded nodes)
- Array index display: [0], [1], [2]...
- Object property count: {3 properties}
- Function signature extraction

**Internal State:**
```typescript
interface ObjectTreeProps {
  value: SerializedValue;
  depth?: number;
  maxDepth?: number;
  path?: string;
}

// Expand state tracked per path
const [expanded, setExpanded] = useState<Set<string>>(new Set());
```

**Edge Cases:**
- Very long strings (truncate at 10k chars)
- Large arrays (show first 100, "... X more items")
- Deep nesting (stop at depth 50)
- Circular references (detect and display marker)
- Empty objects/arrays (show inline)
- Symbols, WeakMaps, WeakSets (show type only)

---

### Phase 2: Console Entry Components

#### 2.1 ConsoleEntry Component
**File:** `src/renderer/components/Console/ConsoleEntry.tsx`  
**Lines:** ~300  
**Complexity:** MEDIUM

**Features:**
- Renders individual log entry
- Type-specific styling:
  - Log: Gray icon, normal text
  - Info: Blue icon, blue accent
  - Warn: Orange icon, orange background
  - Error: Red icon, red background
  - Table: Purple icon, table view
  - Group: Green icon, indented content
- Timestamp display (HH:MM:SS.mmm)
- Group indentation (nested groups)
- Timer badges (duration display)
- Counter display
- Message rendering:
  - Multiple arguments displayed inline
  - Objects use ObjectTree
  - Tables use ConsoleTable
- Stack trace (collapsible)

**Props:**
```typescript
interface ConsoleEntryProps {
  entry: ConsoleEntry;
  style?: React.CSSProperties;  // For react-window
}
```

**Styling by Type:**
```typescript
const typeStyles = {
  log: 'text-gray-700 bg-white',
  info: 'text-blue-700 bg-blue-50 border-l-4 border-blue-500',
  warn: 'text-orange-700 bg-orange-50 border-l-4 border-orange-500',
  error: 'text-red-700 bg-red-50 border-l-4 border-red-500',
  table: 'text-purple-700 bg-purple-50',
  group: 'text-green-700 bg-green-50',
  // ... etc
};
```

#### 2.2 ConsoleTable Component
**File:** `src/renderer/components/Console/ConsoleTable.tsx`  
**Lines:** ~250  
**Complexity:** MEDIUM

**Features:**
- Renders console.table() as HTML table
- Sortable columns (click header)
- Array indices as first column (Index)
- Object properties as columns
- Nested objects displayed collapsed (click to expand)
- Responsive horizontal scroll
- Alternating row colors
- Max 1000 rows (truncate with warning)

**Data Structure:**
```typescript
// From task 1.4C types
interface TableData {
  headers: string[];      // Column names
  rows: TableRow[];       // Row data
}

interface TableRow {
  index: number | string; // Array index or object key
  values: (SerializedValue | null)[];
}
```

**Rendering:**
```tsx
<table className="console-table">
  <thead>
    <tr>
      <th>Index</th>
      {headers.map(h => <th key={h} onClick={() => sort(h)}>{h}</th>)}
    </tr>
  </thead>
  <tbody>
    {rows.map((row, i) => (
      <tr key={i}>
        <td>{row.index}</td>
        {row.values.map((v, j) => (
          <td key={j}>
            {renderValue(v)}  {/* Use ObjectTree for objects */}
          </td>
        ))}
      </tr>
    ))}
  </tbody>
</table>
```

#### 2.3 StackTrace Component
**File:** `src/renderer/components/Console/StackTrace.tsx`  
**Lines:** ~150  
**Complexity:** LOW

**Features:**
- Pretty-print stack trace
- Collapsible by default
- Parse file paths, line numbers, function names
- Syntax highlighting:
  - File paths: blue underline
  - Line numbers: gray
  - Function names: bold
- Click to expand/collapse
- Max 50 stack frames

**Stack Trace Parsing:**
```typescript
// Stack trace line formats:
// Chrome: "    at functionName (file.js:123:45)"
// Firefox: "functionName@file.js:123:45"

interface StackFrame {
  functionName?: string;
  file?: string;
  line?: number;
  column?: number;
}

function parseStackTrace(stack: string): StackFrame[] {
  // Parse both formats
  // Return structured data
}
```

---

### Phase 3: Console Panel & Toolbar

#### 3.1 ConsoleToolbar Component
**File:** `src/renderer/components/Console/ConsoleToolbar.tsx`  
**Lines:** ~200  
**Complexity:** MEDIUM

**Features:**
- Filter buttons with counts:
  - All (total count)
  - Log, Warn, Error, Info, Table, Group (individual counts)
  - Active filter highlighted
- Search input:
  - Text or regex mode
  - Debounced (300ms)
  - Case-insensitive by default
  - Match count display
- Clear button:
  - Confirmation dialog
  - Clears all logs
- Export button:
  - Export as JSON (preserves structure)
  - Export as text (formatted)
  - Downloads file
- Auto-scroll toggle:
  - Enable/disable auto-scroll
  - Icon changes on toggle

**Filter Logic:**
```typescript
const getFilteredLogs = (logs: ConsoleEntry[], filter: ConsoleFilter, search: string) => {
  let filtered = logs;
  
  // Apply type filter
  if (filter !== 'all') {
    filtered = filtered.filter(log => log.type === filter);
  }
  
  // Apply search
  if (search) {
    const regex = new RegExp(search, 'i');
    filtered = filtered.filter(log => {
      // Search in serialized args
      const text = JSON.stringify(log.args);
      return regex.test(text);
    });
  }
  
  return filtered;
};
```

#### 3.2 ConsolePanel Component
**File:** `src/renderer/components/Console/ConsolePanel.tsx`  
**Lines:** ~400  
**Complexity:** HIGH (virtual scrolling)

**Features:**
- Main container component
- react-window VariableSizeList for virtual scrolling
- Renders only visible log entries
- Auto-scroll to bottom on new logs (if enabled)
- Empty state (when no logs)
- Performance optimized (handles 10k+ logs)

**Virtual Scrolling Setup:**
```typescript
import { VariableSizeList as List } from 'react-window';

// Get filtered logs from store
const filteredLogs = usePreviewStore(state => 
  getFilteredLogs(state.console.logs, state.console.filter, state.console.searchQuery)
);

// Calculate row height (dynamic based on content)
const getItemSize = (index: number) => {
  const entry = filteredLogs[index];
  // Base height + content height
  return calculateEntryHeight(entry);
};

// Render virtual list
<List
  height={height}
  itemCount={filteredLogs.length}
  itemSize={getItemSize}
  width="100%"
>
  {({ index, style }) => (
    <ConsoleEntry
      entry={filteredLogs[index]}
      style={style}
    />
  )}
</List>
```

**Auto-scroll Logic:**
```typescript
const listRef = useRef<List>(null);

useEffect(() => {
  if (autoScroll && listRef.current) {
    // Scroll to bottom on new log
    listRef.current.scrollToItem(filteredLogs.length - 1, 'end');
  }
}, [filteredLogs.length, autoScroll]);
```

#### 3.3 ConsoleFooter Component
**File:** `src/renderer/components/Console/ConsoleFooter.tsx`  
**Lines:** ~80  
**Complexity:** LOW

**Features:**
- Status bar at bottom
- Displays:
  - Total log count: "1,234 logs"
  - Error count: "12 errors" (red)
  - Warning count: "5 warnings" (orange)
  - Active filter: "Filtered by: Error"
  - Search results: "23 matches"
- Compact, single line
- Updates in real-time

```tsx
<div className="console-footer">
  <span className="text-gray-600">{totalCount} logs</span>
  {errorCount > 0 && (
    <span className="text-red-600">{errorCount} errors</span>
  )}
  {warningCount > 0 && (
    <span className="text-orange-600">{warningCount} warnings</span>
  )}
  {filter !== 'all' && (
    <span>Filtered by: {filter}</span>
  )}
  {search && (
    <span>{matchCount} matches</span>
  )}
</div>
```

---

### Phase 4: Integration

#### 4.1 Update PreviewFrame
**File:** `src/renderer/components/Preview/PreviewFrame.tsx`  
**Changes:** +50 lines

**Tasks:**
1. Import consoleInjector script
2. Inject after iframe loads
3. Add postMessage listener
4. Forward to previewStore

```typescript
// Import the injector code
import { consoleInjectorCode } from '../Console/consoleInjector';

// After iframe loads
useEffect(() => {
  if (!iframeRef.current || !previewUrl) return;
  
  const iframe = iframeRef.current;
  
  const handleLoad = () => {
    try {
      // Inject console override script
      const script = iframe.contentDocument!.createElement('script');
      script.textContent = consoleInjectorCode;
      iframe.contentDocument!.head.appendChild(script);
    } catch (err) {
      console.error('Failed to inject console script:', err);
    }
  };
  
  iframe.addEventListener('load', handleLoad);
  return () => iframe.removeEventListener('load', handleLoad);
}, [previewUrl]);

// Listen for console messages
useEffect(() => {
  const handleMessage = (event: MessageEvent) => {
    if (event.data?.type === 'console') {
      previewStore.getState().addConsoleLog(event.data.payload);
    }
  };
  
  window.addEventListener('message', handleMessage);
  return () => window.removeEventListener('message', handleMessage);
}, []);
```

#### 4.2 Update EditorPanel
**File:** `src/renderer/components/EditorPanel.tsx`  
**Changes:** +30 lines

**Tasks:**
1. Import ConsolePanel
2. Replace placeholder with ConsolePanel
3. Add error count badge to Console tab

```typescript
import { ConsolePanel } from './Console';
import { usePreviewStore } from '../store/previewStore';

// Get error count for badge
const errorCount = usePreviewStore(state => state.console.errorCount);

// Update tab rendering
const tabs = [
  { id: 'code', label: 'Code', icon: CodeBracketIcon },
  { id: 'preview', label: 'Preview', icon: ComputerDesktopIcon },
  { 
    id: 'console', 
    label: 'Console', 
    icon: CommandLineIcon,
    badge: errorCount > 0 ? errorCount : undefined  // Error badge
  },
  { id: 'properties', label: 'Properties', icon: Cog6ToothIcon }
];

// Render ConsolePanel
{activeTab === 'console' && <ConsolePanel />}
```

#### 4.3 Update App.tsx
**File:** `src/renderer/App.tsx`  
**Changes:** +20 lines

**Tasks:**
1. Clear console on project switch
2. Preserve console during hot reload (optional)

```typescript
import { usePreviewStore } from './store/previewStore';

// In project change effect
useEffect(() => {
  const currentProject = projectStore.getState().currentProject;
  
  if (currentProject) {
    // Clear console when switching projects
    previewStore.getState().clearConsole();
    
    // Start preview server
    previewStore.getState().startPreview(currentProject.path);
  } else {
    // Stop preview when closing project
    previewStore.getState().stopPreview();
    previewStore.getState().clearConsole();
  }
}, [/* project dependencies */]);
```

#### 4.4 Create Barrel Export
**File:** `src/renderer/components/Console/index.ts`  
**Lines:** ~30

```typescript
// Export all console components
export { default as ObjectTree } from './ObjectTree';
export { default as ConsoleEntry } from './ConsoleEntry';
export { default as ConsoleTable } from './ConsoleTable';
export { default as StackTrace } from './StackTrace';
export { default as ConsoleToolbar } from './ConsoleToolbar';
export { default as ConsolePanel } from './ConsolePanel';
export { default as ConsoleFooter } from './ConsoleFooter';

// Re-export types
export * from './types';
```

---

## 📁 Files Summary

### New Files (7)

1. `src/renderer/components/Console/ObjectTree.tsx` - ~350 lines
2. `src/renderer/components/Console/ConsoleEntry.tsx` - ~300 lines
3. `src/renderer/components/Console/ConsoleTable.tsx` - ~250 lines
4. `src/renderer/components/Console/StackTrace.tsx` - ~150 lines
5. `src/renderer/components/Console/ConsoleToolbar.tsx` - ~200 lines
6. `src/renderer/components/Console/ConsolePanel.tsx` - ~400 lines
7. `src/renderer/components/Console/ConsoleFooter.tsx` - ~80 lines

**Total New Code:** ~1,730 lines

### Files to Modify (4)

1. `src/renderer/components/Console/index.ts` - +30 lines (barrel export)
2. `src/renderer/components/Preview/PreviewFrame.tsx` - +50 lines (injection)
3. `src/renderer/components/EditorPanel.tsx` - +30 lines (use ConsolePanel)
4. `src/renderer/App.tsx` - +20 lines (lifecycle management)

**Total Modified:** +130 lines

**Grand Total:** ~1,860 lines

**Combined with Task 1.4C:** ~3,210 lines (complete console system)

---

## 🔒 Security Considerations

### XSS Prevention
- All console output rendered as text, not HTML
- No `dangerouslySetInnerHTML` usage
- Object properties sanitized
- Stack traces parsed and displayed safely

### Iframe Sandboxing
- Console runs in sandboxed iframe (from Task 1.4B)
- postMessage for secure communication
- No direct DOM access from parent

### Performance
- Virtual scrolling prevents DOM overload
- Max 10,000 log entries (oldest dropped)
- Lazy object tree expansion
- Debounced search (300ms)

---

## ⚡ Performance Requirements

| Metric | Target | Strategy |
|--------|--------|----------|
| Log append time | <10ms | Immediate state update, deferred render |
| Initial render | <100ms | Virtual scrolling, render only visible |
| Search time | <50ms | Debounced, regex on serialized data |
| Object expansion | <20ms | Lazy rendering, max depth 10 |
| Scroll performance | 60fps | react-window optimization |
| Memory usage | <100MB for 10k logs | Serialized data, not DOM nodes |

---

## 🎨 UI Design Specifications

### Color Palette

**Log Types:**
- Log: `text-gray-700` / `bg-white`
- Info: `text-blue-700` / `bg-blue-50` / `border-blue-500`
- Warn: `text-orange-700` / `bg-orange-50` / `border-orange-500`
- Error: `text-red-700` / `bg-red-50` / `border-red-500`
- Table: `text-purple-700` / `bg-purple-50`
- Group: `text-green-700` / `bg-green-50`

**Syntax Highlighting:**
- Strings: `text-green-600` ("value")
- Numbers: `text-blue-600` (123)
- Booleans: `text-purple-600` (true/false)
- Null/Undefined: `text-gray-500`
- Keys: `text-gray-700`
- Functions: `text-gray-600 italic`
- Circular refs: `text-red-600 italic`

### Iconography (Heroicons)
- Log: `ChatBubbleLeftIcon`
- Info: `InformationCircleIcon`
- Warn: `ExclamationTriangleIcon`
- Error: `XCircleIcon`
- Table: `TableCellsIcon`
- Group: `FolderIcon`
- Trace: `BugAntIcon`

### Layout
- Toolbar: 48px height, fixed top
- Footer: 32px height, fixed bottom
- Body: Fill remaining space with virtual scroll
- Entry padding: 8px vertical, 12px horizontal
- Group indentation: +16px per level

---

## 🧪 Testing Strategy

### Unit Tests
- ObjectTree recursive rendering
- CircularReference detection
- Filter/search algorithms
- Export format (JSON/text)
- Virtual scroll calculations

### Integration Tests
- Console injection in iframe
- postMessage communication
- State updates on log events
- Filter/search interaction
- Auto-scroll behavior

### Manual Testing Checklist
1. **Basic Logging**
   - [ ] console.log('text')
   - [ ] console.warn('warning')
   - [ ] console.error('error')
   - [ ] console.info('info')

2. **Object Inspection**
   - [ ] Simple object {a: 1}
   - [ ] Nested object {a: {b: {c: 1}}}
   - [ ] Array [1, 2, 3]
   - [ ] Large array (1000+ items)
   - [ ] Circular reference
   - [ ] Function
   - [ ] DOM element

3. **Console.table**
   - [ ] Array of objects
   - [ ] Object of objects
   - [ ] Sort columns
   - [ ] Large table (100+ rows)

4. **Console.group**
   - [ ] Single group
   - [ ] Nested groups
   - [ ] groupCollapsed
   - [ ] groupEnd

5. **Console.time**
   - [ ] time + timeEnd
   - [ ] timeLog
   - [ ] Multiple timers

6. **Console.trace**
   - [ ] Stack trace display
   - [ ] Expand/collapse

7. **Features**
   - [ ] Filter by type
   - [ ] Search (text)
   - [ ] Search (regex)
   - [ ] Clear console
   - [ ] Export JSON
   - [ ] Export text
   - [ ] Auto-scroll on/off
   - [ ] Error count badge

8. **Performance**
   - [ ] Log 10,000 entries (should not lag)
   - [ ] Scroll through 10,000 entries (60fps)
   - [ ] Deeply nested object (50 levels)
   - [ ] Search in 10,000 logs (<50ms)

---

## 🚨 Edge Cases

| Case | Solution |
|------|----------|
| 10k+ logs | Drop oldest, show "x logs dropped" warning |
| Huge objects (1MB+) | Truncate at 100 properties, show "... more" |
| 100+ deep nesting | Stop at depth 50, show "Max depth reached" |
| Circular references | Mark [[Circular]] on second occurrence |
| Very long strings | Truncate at 10,000 chars, show "... (truncated)" |
| Binary data | Show as "ArrayBuffer (X bytes)" |
| Promises | Show as "Promise { <pending/resolved/rejected> }" |
| Symbols | Show as "Symbol(description)" |
| WeakMap/WeakSet | Show type only (not inspectable) |
| Proxy objects | Try to inspect target, fallback to "Proxy" |
| Empty console | Show friendly "No logs yet" message |
| All logs filtered | Show "No logs match filter" |
| No search results | Show "No matches found" |

---

## 📊 Implementation Milestones

### Milestone 1: ObjectTree Component
**Duration:** 4-5 hours  
**Confidence:** TBD  
**Status:** 🔵 Not Started

**Tasks:**
- [ ] Create ObjectTree.tsx component
- [ ] Implement recursive rendering logic
- [ ] Add expand/collapse state management
- [ ] Implement syntax highlighting
- [ ] Handle circular references
- [ ] Add max depth limiting
- [ ] Lazy rendering optimization
- [ ] Test with various data types

**Deliverables:**
- ObjectTree component (~350 lines)
- Handles all SerializedValue types
- Performance optimized

**Challenges:**
- Complex recursive logic
- State management for expand/collapse
- Performance with large objects

---

### Milestone 2: Console Entry Components
**Duration:** 4-5 hours  
**Confidence:** TBD  
**Status:** 🔵 Not Started

**Tasks:**
- [ ] Create ConsoleEntry.tsx component
- [ ] Implement type-specific styling
- [ ] Add timestamp formatting
- [ ] Implement group indentation
- [ ] Create ConsoleTable.tsx component
- [ ] Implement table sorting
- [ ] Create StackTrace.tsx component
- [ ] Parse and format stack traces
- [ ] Test all console types

**Deliverables:**
- ConsoleEntry component (~300 lines)
- ConsoleTable component (~250 lines)
- StackTrace component (~150 lines)

**Challenges:**
- Handling all console types correctly
- Table sorting logic
- Stack trace parsing for different browsers

---

### Milestone 3: Console Panel & Toolbar
**Duration:** 5-6 hours  
**Confidence:** TBD  
**Status:** 🔵 Not Started

**Tasks:**
- [ ] Create ConsoleToolbar.tsx component
- [ ] Implement filter buttons with counts
- [ ] Add search input (text + regex)
- [ ] Implement clear button with confirmation
- [ ] Add export functionality (JSON/text)
- [ ] Create ConsolePanel.tsx component
- [ ] Integrate react-window virtual scrolling
- [ ] Implement auto-scroll logic
- [ ] Add empty state
- [ ] Create ConsoleFooter.tsx component
- [ ] Display log counts and stats
- [ ] Test with 10k+ logs

**Deliverables:**
- ConsoleToolbar component (~200 lines)
- ConsolePanel component (~400 lines)
- ConsoleFooter component (~80 lines)
- Virtual scrolling working
- Performance targets met

**Challenges:**
- Virtual scrolling with dynamic heights
- Filter/search performance
- Auto-scroll behavior

---

### Milestone 4: Integration
**Duration:** 2-3 hours  
**Confidence:** TBD  
**Status:** 🔵 Not Started

**Tasks:**
- [ ] Update PreviewFrame.tsx
- [ ] Inject console script after iframe loads
- [ ] Add postMessage listener
- [ ] Update EditorPanel.tsx
- [ ] Replace placeholder with ConsolePanel
- [ ] Add error count badge
- [ ] Update App.tsx
- [ ] Clear console on project switch
- [ ] Create barrel export index.ts
- [ ] Test end-to-end flow

**Deliverables:**
- PreviewFrame updated (+50 lines)
- EditorPanel updated (+30 lines)
- App.tsx updated (+20 lines)
- index.ts created (~30 lines)
- Full integration working

**Challenges:**
- Timing of console injection
- postMessage security
- Error badge updates

---

### Milestone 5: Testing & Polish
**Duration:** 2-3 hours  
**Confidence:** TBD  
**Status:** 🔵 Not Started

**Tasks:**
- [ ] Manual test all console methods
- [ ] Test with 10k+ logs
- [ ] Test filter/search functionality
- [ ] Test edge cases
- [ ] Performance profiling
- [ ] Fix any bugs found
- [ ] UI polish (spacing, colors, icons)
- [ ] Update task documentation
- [ ] Human review

**Deliverables:**
- All features tested and working
- Performance targets met
- Documentation updated
- Human review sign-off

---

## ✅ Definition of Done

- [ ] ObjectTree renders nested objects recursively
- [ ] All console types display correctly (log, warn, error, info, table, group, trace)
- [ ] ConsoleTable displays tabular data with sorting
- [ ] Virtual scrolling handles 10k+ logs without lag
- [ ] Filter by type works with accurate counts
- [ ] Search works (text and regex)
- [ ] Clear console works
- [ ] Export logs works (JSON and text)
- [ ] Auto-scroll control works
- [ ] Error count badge displays on Console tab
- [ ] Console injection works in preview iframe
- [ ] Console clears on project switch
- [ ] Circular references detected and displayed
- [ ] Performance targets met (<10ms log append, 60fps scroll)
- [ ] All edge cases handled
- [ ] Manual testing complete
- [ ] Human review approved

---

## 🎓 Success Metrics

After Task 1.4D is complete, the console system should:

1. **Feature Completeness:** Match Chrome DevTools console for common use cases
2. **Performance:** Handle 10k+ logs at 60fps
3. **Usability:** Intuitive filters, search, and object inspection
4. **Stability:** No crashes with edge cases (circular refs, huge objects)
5. **Integration:** Seamless with preview system

---

## 🔮 After Task 1.4D

**Task 1.4 Series Will Be Complete:**
- ✅ Task 1.4A: ViteServerManager (server lifecycle)
- ✅ Task 1.4B: Preview Panel UI (viewport controls, iframe)
- ✅ Task 1.4C: Console Foundation (types, injection, state)
- ✅ Task 1.4D: Console UI & Integration (THIS TASK)

**Next Tasks:**
- Task 2.1: Component Tree & Inspector (Phase 2: Component Management)
- Task 2.2: Schema
