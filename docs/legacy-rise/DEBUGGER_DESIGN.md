# Debugger Design

## Vision

A visual step-through debugger that lets you pause execution at each user interaction, inspect state, and trace data flow through your application - inspired by Chrome DevTools breakpoints and Bubble's step-by-step mode.

## Core Concept

**Event-Level Debugging**: Pause before and after each event (clicks, inputs, lifecycle hooks), not at every code statement.

This gives you:
- ✅ Clear understanding of what happens when user interacts
- ✅ State snapshots at meaningful moments
- ✅ Data flow visualization between components
- ❌ Not overwhelming with low-level code steps

## Debugger UI

### Main Debugger Panel

```
┌────────────────────────────────────────────────────────────────┐
│ 🔍 Debugger                                    [● Recording]    │
├────────────────────────────────────────────────────────────────┤
│                                                                 │
│ ▶️ Run  ⏸️ Pause  ⏭️ Step  ⏮️ Step Back  🔄 Restart  ⏹️ Stop   │
│                                                                 │
├────────────────────────────────────────────────────────────────┤
│ Event Timeline:                                                 │
│                                                                 │
│  1. ⏱️ 0.00s  App mounted                                      │
│  2. ⏱️ 0.15s  UserList rendered                                │
│  3. ⏱️ 1.23s ⏸ onClick (Button #submit-btn) ← PAUSED HERE     │
│  4. ⏱️ -      → handleSubmit() (pending)                       │
│  5. ⏱️ -      → validateForm() (pending)                       │
│  6. ⏱️ -      → updateGlobal('formData') (pending)             │
│                                                                 │
├────────────────────────────────────────────────────────────────┤
│ Current State:                                                  │
│                                                                 │
│  Component: SubmitButton                                        │
│  ├─ Props:                                                      │
│  │   • disabled: false                                         │
│  │   • onClick: [Function]                                     │
│  ├─ State:                                                      │
│  │   • isHovered: true                                         │
│  │   • clickCount: 3 → 4 (pending)                            │
│  └─ Context:                                                    │
│      • formData: { name: "John", email: "j@ex.com" }          │
│                                                                 │
│  Global Variables:                                              │
│  ├─ currentUser: { id: 123, name: "Jane" }                    │
│  ├─ theme: "dark"                                              │
│  └─ isAuthenticated: true                                      │
│                                                                 │
├────────────────────────────────────────────────────────────────┤
│ Affected Components (will re-render):                           │
│  • SubmitButton                                                │
│  • FormSummary (uses formData)                                 │
│  • StatusIndicator (uses formData.isValid)                     │
│                                                                 │
└────────────────────────────────────────────────────────────────┘
```

### Data Flow Visualization

```
┌────────────────────────────────────────────────────────────────┐
│ 📊 Data Flow (Current Step)                                    │
├────────────────────────────────────────────────────────────────┤
│                                                                 │
│  [SubmitButton]                                                │
│       │                                                         │
│       │ onClick(event)                                         │
│       ↓                                                         │
│  [handleSubmit]                                                │
│       │                                                         │
│       ├─→ reads: formData                                      │
│       │   { name: "John", email: "j@ex.com" }                 │
│       │                                                         │
│       ├─→ calls: validateForm(formData)                        │
│       │   returns: { valid: true, errors: [] }                │
│       │                                                         │
│       └─→ updates: global.submittedForms                       │
│           [existing items] + [new submission]                  │
│                                                                 │
│  Components Reading global.submittedForms:                     │
│  ├─ FormHistory (will re-render)                              │
│  └─ SubmissionCount (will re-render)                          │
│                                                                 │
└────────────────────────────────────────────────────────────────┘
```

---

## Implementation Strategy

### 1. Code Instrumentation

Wrap event handlers during compilation:

**Original Code**:
```jsx
<button onClick={handleSubmit}>Submit</button>
```

**Debug Mode Compilation**:
```jsx
import { __debugWrap } from '../runtime/debugger';

<button onClick={__debugWrap('handleSubmit', handleSubmit, {
  componentId: 'submitButton',
  eventType: 'onClick',
  metadata: { /* ... */ }
})}>
  Submit
</button>
```

### 2. Debug Runtime

**Debug Wrapper Implementation**:

```typescript
// runtime/debugger.ts

class DebugRuntime {
  private isPaused = false;
  private breakpoints: Set<string> = new Set();
  private eventQueue: DebugEvent[] = [];
  private stateSnapshots: StateSnapshot[] = [];
  private electronBridge: ElectronBridge;

  // Wrap event handlers
  __debugWrap(name: string, handler: Function, metadata: EventMetadata) {
    return async (...args: any[]) => {
      // Capture pre-execution state
      const preState = this.captureState();
      
      // Send pause notification to Electron
      await this.notifyElectron({
        type: 'BEFORE_EVENT',
        name,
        metadata,
        state: preState,
        timestamp: Date.now()
      });
      
      // Wait for user to press "Step" if paused
      if (this.isPaused) {
        await this.waitForContinue();
      }
      
      // Execute the actual handler
      const result = await handler(...args);
      
      // Capture post-execution state
      const postState = this.captureState();
      
      // Calculate diff
      const stateDiff = this.diffState(preState, postState);
      
      // Send completion notification
      await this.notifyElectron({
        type: 'AFTER_EVENT',
        name,
        result,
        stateDiff,
        timestamp: Date.now()
      });
      
      return result;
    };
  }

  // Capture current application state
  captureState(): StateSnapshot {
    return {
      components: this.captureComponentStates(),
      globals: this.captureGlobalVariables(),
      props: this.captureProps(),
      context: this.captureReactContext()
    };
  }

  // Wait for debugger continue signal
  waitForContinue(): Promise<void> {
    return new Promise((resolve) => {
      this.continueResolvers.push(resolve);
    });
  }

  // Resume execution (called from Electron)
  continue() {
    const resolver = this.continueResolvers.shift();
    if (resolver) resolver();
  }
}

export const debugRuntime = new DebugRuntime();
export const __debugWrap = debugRuntime.__debugWrap.bind(debugRuntime);
```

### 3. Electron Bridge

**IPC Communication**:

```typescript
// Main Process (Electron)
ipcMain.on('debug:pause', () => {
  debugState.isPaused = true;
  mainWindow.webContents.send('debugger:paused');
});

ipcMain.on('debug:step', () => {
  debugState.step();
});

ipcMain.on('debug:continue', () => {
  debugState.isPaused = false;
  debugState.continue();
});

// Renderer Process (Preview Webview)
window.electronAPI = {
  notifyEvent: (event) => ipcRenderer.send('debug:event', event),
  onPause: (callback) => ipcRenderer.on('debug:pause', callback),
  onContinue: (callback) => ipcRenderer.on('debug:continue', callback)
};
```

---

## Debugging Features

### 1. Breakpoints

**Set Breakpoints Visually**:

In the component tree or visual graph, right-click any event:

```
[UserCard]
  └─ Events:
      • onClick         ⭕ (click to add breakpoint)
      • onHover         ⭕
      • onMount         🔴 (breakpoint set)
```

**Conditional Breakpoints**:

```
Breakpoint: UserCard.onClick
Condition: user.id === 123
```

Only pauses when condition is true.

### 2. State Snapshots

**Automatic Snapshots**:
- Before each event
- After each event
- On component mount/unmount
- When global variables change

**Manual Snapshots**:
- Click "Capture Snapshot" button anytime
- Add to timeline for comparison

**Snapshot Comparison**:

```
┌────────────────────────────────────────────────────────┐
│ Compare Snapshots                                      │
├────────────────────────────────────────────────────────┤
│                                                        │
│  Snapshot A (1.23s)         Snapshot B (1.45s)        │
│  ─────────────────          ─────────────────         │
│  formData:                  formData:                 │
│    name: "John"              name: "John"             │
│    email: "j@ex.com"         email: "j@ex.com"        │
│    isValid: false        →   isValid: true    ✓       │
│                                                        │
│  clickCount: 3          →   clickCount: 4     ✓       │
│                                                        │
│  global.submittedForms: →   global.submittedForms:    │
│    [12 items]                [13 items]       ✓       │
│                                                        │
└────────────────────────────────────────────────────────┘
```

### 3. Time Travel

**Step Backward**:
- Rewind to previous state
- Restore component states
- Re-render at previous point

**Implementation**:
Store immutable snapshots, restore when stepping back:

```typescript
class TimeTravel {
  private history: StateSnapshot[] = [];
  private currentIndex = 0;

  stepBack() {
    if (this.currentIndex > 0) {
      this.currentIndex--;
      this.restore(this.history[this.currentIndex]);
    }
  }

  stepForward() {
    if (this.currentIndex < this.history.length - 1) {
      this.currentIndex++;
      this.restore(this.history[this.currentIndex]);
    }
  }
}
```

### 4. Watch Expressions

Add custom expressions to monitor:

```
Watch List:
  ☑ user.role
  ☑ items.length
  ☑ global.currentUser.id
  ☑ formData.isValid && !isSubmitting
```

Shows live values in sidebar during debugging.

---

## Advanced Features

### Performance Profiling

**Event Timing**:

```
┌────────────────────────────────────────────────────────┐
│ ⏱️ Performance Timeline                                │
├────────────────────────────────────────────────────────┤
│                                                        │
│  handleSubmit           ████████ 45ms                 │
│  ├─ validateForm        ███ 12ms                      │
│  ├─ transformData       █ 3ms                         │
│  ├─ updateGlobal        ██ 8ms                        │
│  └─ triggerRerender     █████████ 22ms ⚠️ Slow       │
│                                                        │
│  Total: 45ms                                           │
│  Slowest: triggerRerender (22ms)                      │
│                                                        │
└────────────────────────────────────────────────────────┘
```

### Network Monitoring

If script nodes make API calls:

```
┌────────────────────────────────────────────────────────┐
│ 🌐 Network Activity                                    │
├────────────────────────────────────────────────────────┤
│                                                        │
│  [handleSubmit]                                        │
│      ↓                                                 │
│  POST /api/users                                       │
│  Status: 201 Created                                   │
│  Time: 234ms                                           │
│  Request: { name: "John", email: "j@ex.com" }         │
│  Response: { id: 456, created: true }                 │
│                                                        │
└────────────────────────────────────────────────────────┘
```

### Component Re-render Tracking

**Highlight Components That Re-render**:

In preview, flash components that re-render after each step:

```
🟢 UserCard (re-rendered - props changed)
🟢 FormSummary (re-rendered - global state changed)
⚪ Header (no re-render)
⚪ Footer (no re-render)
```

### Error Handling

**Caught Errors**:

```
┌────────────────────────────────────────────────────────┐
│ ❌ Error During Execution                              │
├────────────────────────────────────────────────────────┤
│                                                        │
│  Event: onClick (SubmitButton)                        │
│  Error: Cannot read property 'email' of undefined     │
│                                                        │
│  Stack:                                                │
│  at handleSubmit (FormContainer.jsx:23)               │
│  at __debugWrap (debugger.ts:45)                      │
│                                                        │
│  State at error:                                       │
│  • formData: undefined ← This is the problem          │
│  • user: { id: 123, name: "Jane" }                   │
│                                                        │
│  [View State] [Restart] [Continue]                    │
│                                                        │
└────────────────────────────────────────────────────────┘
```

---

## Debug Modes

### 1. Run Mode (Normal)
- No instrumentation
- Full speed execution
- No debug overhead

### 2. Record Mode
- Records event timeline
- Captures state snapshots
- Can replay later
- Minimal overhead

### 3. Step Mode
- Pauses before each event
- Shows state inspector
- Manual step-through
- Full debugging features

### 4. Replay Mode
- Plays back recorded session
- Can step through past events
- Useful for bug reports

---

## Keyboard Shortcuts

```
F5      - Start/Stop debugging
F8      - Continue execution
F10     - Step over
F11     - Step into (if available)
Shift+F11 - Step out
Ctrl+Shift+F5 - Restart

Shift+F9  - Toggle breakpoint
Ctrl+Shift+B - Breakpoints panel
```

---

## Integration with Visual Editor

### Component Inspector

While debugging, click any component in preview:

```
┌────────────────────────────────────────────────────────┐
│ 🔍 UserCard #user-123 (LIVE)                          │
├────────────────────────────────────────────────────────┤
│                                                        │
│  Current Props:                                        │
│  • user: { id: 123, name: "John Doe" }               │
│  • onClick: [Function]                                │
│                                                        │
│  Current State:                                        │
│  • isHovered: true                                    │
│  • clickCount: 4                                      │
│                                                        │
│  [Edit in Visual Editor]  [View Component Code]       │
│                                                        │
└────────────────────────────────────────────────────────┘
```

Clicking "Edit in Visual Editor" takes you to that component's properties.

---

## Limitations & Future Work

### Current Limitations

❌ **Cannot step into** individual JavaScript statements (only event-level)
❌ **Cannot edit values** during debug (read-only inspection)
❌ **No async stepping** (pauses at event boundaries only)
❌ **Limited to instrumented code** (external libraries not debuggable)

### Future Enhancements

🎯 **Statement-level debugging** (like Chrome DevTools)
🎯 **Hot value editing** (change values mid-execution)
🎯 **Async flow visualization** (trace promises/async-await)
🎯 **Memory profiling** (detect memory leaks)
🎯 **Redux DevTools integration** (for state management)
🎯 **Visual regression testing** (snapshot testing UI)

---

## Implementation Checklist

### Phase 1: Basic Debugging (MVP)
- [ ] Event wrapping infrastructure
- [ ] Electron IPC bridge
- [ ] Basic pause/continue controls
- [ ] State snapshot capture
- [ ] Timeline view
- [ ] Simple state inspector

### Phase 2: Enhanced Features
- [ ] Breakpoints (event-level)
- [ ] Conditional breakpoints
- [ ] Watch expressions
- [ ] Step backward (time travel)
- [ ] Snapshot comparison
- [ ] Component re-render highlighting

### Phase 3: Advanced
- [ ] Performance profiling
- [ ] Network monitoring
- [ ] Error boundary integration
- [ ] Recording and replay
- [ ] Export debug sessions
- [ ] Share debug links (for bug reports)

---

**See Also**:
- [Data Flow Model](./DATA_FLOW.md) - Understanding what state is captured
- [Expression System](./EXPRESSION_SYSTEM.md) - How expressions are evaluated during debug
- [Architecture](./ARCHITECTURE.md) - Technical implementation details