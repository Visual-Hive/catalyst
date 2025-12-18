# Task 1.4: Preview Renderer

**Phase:** Phase 1 - Application Shell  
**Duration Estimate:** 5-6 days (split into 3 subtasks)  
**Actual Duration:** In Progress  
**Status:** 🟡 In Progress (Task 1.4A Complete)  
**Assigned:** AI (Cline) + Human Review  
**Priority:** P1 - Core Feature  
**Dependencies:** Task 1.3A ✅, Task 1.3B ✅, Task 1.3C ✅  
**Started:** 2025-11-25  
**Completed:** [YYYY-MM-DD]

---

## 📋 Task Split Overview

This task was split into 3 subtasks for better manageability:

| Subtask | Name | Status | Documentation |
|---------|------|--------|---------------|
| **1.4A** | Vite Server Manager | ✅ Complete | [task-1.4A-vite-server-manager.md](task-1.4A-vite-server-manager.md) |
| **1.4B** | Preview Panel UI | 🔵 Not Started | (To be created) |
| **1.4C** | Console Capture & Polish | 🔵 Not Started | (To be created) |

### Task 1.4A: Vite Server Manager ✅
- Type definitions (`src/main/preview/types.ts`)
- Port finder (`src/main/preview/PortFinder.ts`) - 17/17 tests passing
- Vite server manager (`src/main/preview/ViteServerManager.ts`)
- IPC handlers for preview control
- Preload API for renderer
- App cleanup on quit

### Task 1.4B: Preview Panel UI (Next)
- `previewStore.ts` - Zustand state management
- `PreviewPanel.tsx` - Main preview component
- `PreviewToolbar.tsx` - Viewport and zoom controls
- `PreviewFrame.tsx` - Sandboxed iframe
- `PreviewError.tsx` / `PreviewLoading.tsx` - States
- Project lifecycle integration

### Task 1.4C: Console Capture & Polish
- Console log capture from iframe
- `ConsolePanel.tsx` / `ConsoleEntry.tsx`
- Error handling refinements
- Manual testing and polish

---

## 🎯 Original Task Overview

> **Note:** The sections below are from the original task planning.
> For implementation details, see the subtask documentation files.

### Objective
Implement a live preview system that renders the user's React project inside the Rise editor, with hot module replacement (HMR) support, error handling, and responsive viewport controls.

### Problem Statement
After project creation (Task 1.3), users need to see their application running. The preview system must:
- **Start Vite dev server** for the user's project (not Rise's own dev server)
- **Embed preview** securely in an iframe/webview
- **Support HMR** for instant updates without full reload
- **Handle errors gracefully** with clear error displays
- **Capture console logs** for debugging
- **Provide viewport controls** for responsive design testing

### Why This Matters
The preview is the **core value proposition** of Rise - users build visually and see results immediately. Without a robust preview system:
1. Users can't validate their work
2. The edit → preview feedback loop breaks
3. Phase 2 (component editing) and Phase 3 (code generation) become unusable

### Success Criteria
- [ ] Vite dev server starts automatically when project is opened
- [ ] Vite dev server stops when project is closed
- [ ] Preview displays in sandboxed iframe in Editor panel
- [ ] HMR updates preview instantly (< 500ms)
- [ ] Syntax/runtime errors display clearly in preview area
- [ ] Console logs captured and displayed in Console tab
- [ ] Viewport controls work (mobile, tablet, desktop presets)
- [ ] Custom viewport size input works
- [ ] Zoom controls work (50%, 75%, 100%, 150%, 200%)
- [ ] Preview can be refreshed manually
- [ ] Preview URL is displayed (for debugging)
- [ ] Security: iframe is sandboxed, no node integration
- [ ] Performance: Server starts in < 5 seconds
- [ ] Memory: No leaks on project switch
- [ ] Manual testing completed
- [ ] Human review approved

### References
- **docs/ARCHITECTURE.md** - Preview rendering strategy
- **docs/SECURITY_SPEC.md** - Webview security requirements
- **docs/PERFORMANCE.md** - Performance targets
- **Task 1.1** - Electron security configuration
- **Task 1.2** - Editor panel with Preview tab placeholder

### Out of Scope (Future Tasks)
- ❌ Component isolation view (single component preview) → Phase 2
- ❌ Code generation triggering preview updates → Phase 3
- ❌ Multiple preview windows → Post-MVP
- ❌ Preview on external devices → Post-MVP

---

## 🏗️ Architecture Overview

### System Components

```
┌─────────────────────────────────────────────────────────────────┐
│                         Rise Editor                              │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                    Main Process                           │   │
│  │  ┌─────────────────┐    ┌─────────────────────────────┐  │   │
│  │  │ ViteServerManager│    │ ConsoleLogCapture           │  │   │
│  │  │ - start()       │    │ - intercept console.*       │  │   │
│  │  │ - stop()        │    │ - forward to renderer       │  │   │
│  │  │ - getPort()     │    └─────────────────────────────┘  │   │
│  │  │ - isRunning()   │                                      │   │
│  │  └─────────────────┘                                      │   │
│  └──────────────────────────────────────────────────────────┘   │
│                              │ IPC                               │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                   Renderer Process                        │   │
│  │  ┌─────────────────┐    ┌─────────────────────────────┐  │   │
│  │  │  PreviewPanel   │    │  ViewportControls           │  │   │
│  │  │  - iframe       │    │  - presets (mobile/tablet)  │  │   │
│  │  │  - error overlay│    │  - custom size              │  │   │
│  │  │  - loading state│    │  - zoom                     │  │   │
│  │  └─────────────────┘    └─────────────────────────────┘  │   │
│  │           │                                               │   │
│  │  ┌────────▼──────────────────────────────────────────┐   │   │
│  │  │              Sandboxed iframe                      │   │   │
│  │  │  src="http://localhost:{dynamicPort}"              │   │   │
│  │  │  sandbox="allow-scripts allow-same-origin"         │   │   │
│  │  └────────────────────────────────────────────────────┘   │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    User's Project                                │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │              Vite Dev Server (spawned)                    │   │
│  │  - Port: Dynamic (3001-3999)                              │   │
│  │  - HMR enabled                                            │   │
│  │  - Serves user's React app                                │   │
│  │  - Separate from Rise's own Vite                          │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

### Key Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Preview container | iframe (not webview) | Simpler, sufficient security with sandbox attribute, better HMR support |
| Server management | Spawn child process | Clean separation, easy to start/stop, captures stdout/stderr |
| Port allocation | Dynamic (3001-3999) | Avoid conflicts with Rise's port (5173) and common ports |
| Console capture | Inject script into preview | Captures console.* calls, forwards via postMessage |
| Error display | Overlay in preview area | Non-intrusive, preserves layout, easy to dismiss |

---

## 🗺️ Implementation Roadmap

### Day 1: Vite Server Manager

#### Milestone 1: ViteServerManager Class
**Duration:** 1 day  
**Confidence Target:** 9/10  
**Status:** ✅ Complete (Task 1.4A)

> **Implementation:** See [task-1.4A-vite-server-manager.md](task-1.4A-vite-server-manager.md)

##### Objective
Create a robust manager for spawning and controlling Vite dev servers for user projects.

##### Files to Create

**`src/main/preview/ViteServerManager.ts`** (~300 lines)
```typescript
/**
 * @file ViteServerManager.ts
 * @description Manages Vite dev server lifecycle for user projects
 * 
 * RESPONSIBILITIES:
 * - Start Vite dev server for a project
 * - Find available port (3001-3999)
 * - Monitor server health
 * - Capture stdout/stderr
 * - Stop server cleanly on project close
 * - Handle crashes/restarts
 * 
 * SECURITY:
 * - Only runs Vite from within validated project directories
 * - No shell execution (spawn with explicit args)
 * - Port restricted to safe range
 */
```

**Key Features:**
- `start(projectPath: string): Promise<{ port: number; url: string }>`
- `stop(): Promise<void>`
- `restart(): Promise<void>`
- `isRunning(): boolean`
- `getPort(): number | null`
- `getUrl(): string | null`
- `onReady(callback: () => void)`
- `onError(callback: (error: Error) => void)`
- `onOutput(callback: (line: string, type: 'stdout' | 'stderr') => void)`

##### Files to Create

**`src/main/preview/PortFinder.ts`** (~80 lines)
```typescript
/**
 * @file PortFinder.ts
 * @description Find available ports in a safe range
 * 
 * RANGE: 3001-3999 (avoids 3000 which is common, and Rise's 5173)
 * 
 * ALGORITHM:
 * 1. Start from 3001
 * 2. Try to bind TCP socket
 * 3. If busy, increment and retry
 * 4. Return first available port
 */
```

**`src/main/preview/types.ts`** (~50 lines)
```typescript
/**
 * @file types.ts
 * @description Type definitions for preview system
 */

export interface ViteServerState {
  status: 'stopped' | 'starting' | 'running' | 'error';
  port: number | null;
  url: string | null;
  error: string | null;
  projectPath: string | null;
}

export interface PreviewMessage {
  type: 'console' | 'error' | 'ready' | 'navigation';
  payload: unknown;
}

export interface ViewportPreset {
  name: string;
  width: number;
  height: number;
  icon: string;
}
```

##### Validation Criteria
- [x] Server starts successfully for valid project
- [x] Server stops cleanly (no orphan processes)
- [x] Port conflicts handled gracefully
- [x] Crashes detected and reported
- [x] Restart works after crash
- [ ] Multiple project switches work without leaks (needs UI testing)

---

### Day 2: IPC Handlers & Preview Store

#### Milestone 2: Preview IPC Handlers
**Duration:** 0.5 day  
**Confidence Target:** 9/10  
**Status:** ✅ Complete (Task 1.4A)

> **Implementation:** Added to `electron/ipc-handlers.ts` and `electron/preload.ts`

##### Objective
Create IPC handlers for renderer to control preview server.

##### Files to Modify

**`electron/ipc-handlers.ts`** (+100 lines)
```typescript
// Add preview-related handlers:

/**
 * Start Vite dev server for current project
 * @returns { success: boolean, data?: { port, url }, error?: string }
 */
ipcMain.handle('preview:start', async (_, projectPath: string) => {
  // Validate projectPath
  // Start ViteServerManager
  // Return port and URL
});

/**
 * Stop Vite dev server
 */
ipcMain.handle('preview:stop', async () => {
  // Stop server
  // Clean up resources
});

/**
 * Get current preview server status
 */
ipcMain.handle('preview:status', async () => {
  // Return ViteServerState
});

/**
 * Restart preview server (useful after npm install)
 */
ipcMain.handle('preview:restart', async () => {
  // Stop then start
});
```

##### Files to Modify

**`electron/preload.ts`** (+20 lines)
```typescript
// Add to electronAPI:
preview: {
  start: (projectPath: string) => ipcRenderer.invoke('preview:start', projectPath),
  stop: () => ipcRenderer.invoke('preview:stop'),
  status: () => ipcRenderer.invoke('preview:status'),
  restart: () => ipcRenderer.invoke('preview:restart'),
  onOutput: (callback: (line: string, type: string) => void) => {
    ipcRenderer.on('preview:output', (_, line, type) => callback(line, type));
  },
  onError: (callback: (error: string) => void) => {
    ipcRenderer.on('preview:error', (_, error) => callback(error));
  },
  onReady: (callback: () => void) => {
    ipcRenderer.on('preview:ready', () => callback());
  },
}
```

#### Milestone 3: Preview Store
**Duration:** 0.5 day  
**Confidence Target:** 9/10  
**Status:** 🔵 Not Started

##### Objective
Create Zustand store for preview state management.

##### Files to Create

**`src/renderer/store/previewStore.ts`** (~150 lines)
```typescript
/**
 * @file previewStore.ts
 * @description Zustand store for preview state
 * 
 * STATE:
 * - Server status (stopped/starting/running/error)
 * - Preview URL
 * - Viewport settings (width, height, zoom)
 * - Console logs array
 * - Current error (if any)
 * 
 * ACTIONS:
 * - startPreview(projectPath)
 * - stopPreview()
 * - restartPreview()
 * - setViewport(preset | custom)
 * - setZoom(level)
 * - clearConsole()
 * - refreshPreview()
 */

import { create } from 'zustand';
import type { ViteServerState, ViewportPreset } from '../../main/preview/types';

interface ConsoleEntry {
  id: string;
  timestamp: Date;
  type: 'log' | 'warn' | 'error' | 'info';
  args: unknown[];
}

interface PreviewState {
  // Server state
  serverStatus: ViteServerState['status'];
  previewUrl: string | null;
  serverError: string | null;
  
  // Viewport
  viewportWidth: number;
  viewportHeight: number;
  zoom: number;
  activePreset: string | null;
  
  // Console
  consoleLogs: ConsoleEntry[];
  
  // Actions
  startPreview: (projectPath: string) => Promise<void>;
  stopPreview: () => Promise<void>;
  restartPreview: () => Promise<void>;
  setViewport: (width: number, height: number, presetName?: string) => void;
  setZoom: (zoom: number) => void;
  addConsoleLog: (entry: Omit<ConsoleEntry, 'id' | 'timestamp'>) => void;
  clearConsole: () => void;
  refreshPreview: () => void;
}

// Viewport presets
export const VIEWPORT_PRESETS: ViewportPreset[] = [
  { name: 'iPhone SE', width: 375, height: 667, icon: 'phone' },
  { name: 'iPhone 14', width: 390, height: 844, icon: 'phone' },
  { name: 'iPad', width: 768, height: 1024, icon: 'tablet' },
  { name: 'iPad Pro', width: 1024, height: 1366, icon: 'tablet' },
  { name: 'Laptop', width: 1280, height: 800, icon: 'laptop' },
  { name: 'Desktop', width: 1920, height: 1080, icon: 'desktop' },
  { name: 'Responsive', width: -1, height: -1, icon: 'arrows' }, // Fill available space
];

export const ZOOM_LEVELS = [0.5, 0.75, 1, 1.25, 1.5, 2];
```

##### Validation Criteria
- [ ] Store initializes with correct defaults
- [ ] Start/stop actions work correctly
- [ ] Viewport changes update state
- [ ] Console logs accumulate (with max limit)
- [ ] State persists during session

---

### Day 3: Preview Panel UI

#### Milestone 4: PreviewPanel Component
**Duration:** 1 day  
**Confidence Target:** 9/10  
**Status:** 🔵 Not Started (Task 1.4B)

##### Objective
Replace the placeholder Preview tab content with a fully functional preview panel.

##### Files to Create

**`src/renderer/components/Preview/PreviewPanel.tsx`** (~250 lines)
```typescript
/**
 * @file PreviewPanel.tsx
 * @description Main preview panel with iframe and controls
 * 
 * LAYOUT:
 * ┌─────────────────────────────────────────┐
 * │ [Viewport] [Zoom] [URL] [Refresh]       │  <- Toolbar
 * ├─────────────────────────────────────────┤
 * │                                         │
 * │          ┌───────────────┐              │
 * │          │               │              │
 * │          │    iframe     │              │  <- Centered, sized
 * │          │               │              │
 * │          └───────────────┘              │
 * │                                         │
 * └─────────────────────────────────────────┘
 * 
 * STATES:
 * - No project: "Open a project to see preview"
 * - Starting: Spinner + "Starting dev server..."
 * - Running: iframe with preview
 * - Error: Error message with retry button
 */
```

**`src/renderer/components/Preview/PreviewToolbar.tsx`** (~200 lines)
```typescript
/**
 * @file PreviewToolbar.tsx
 * @description Toolbar with viewport, zoom, and refresh controls
 * 
 * CONTROLS:
 * - Viewport dropdown (presets + custom)
 * - Width x Height inputs (when custom)
 * - Zoom dropdown (50% - 200%)
 * - URL display (copyable)
 * - Refresh button
 * - Open in browser button
 */
```

**`src/renderer/components/Preview/PreviewFrame.tsx`** (~150 lines)
```typescript
/**
 * @file PreviewFrame.tsx
 * @description Sandboxed iframe for preview with error boundary
 * 
 * SECURITY:
 * - sandbox="allow-scripts allow-same-origin allow-forms"
 * - No allow-top-navigation
 * - No allow-popups
 * 
 * FEATURES:
 * - Centers iframe in available space
 * - Applies zoom transform
 * - Shows device frame (optional)
 * - Injects console capture script
 */
```

**`src/renderer/components/Preview/PreviewError.tsx`** (~80 lines)
```typescript
/**
 * @file PreviewError.tsx
 * @description Error overlay for preview failures
 * 
 * SHOWS:
 * - Error icon
 * - Error message (user-friendly)
 * - Technical details (collapsible)
 * - Retry button
 * - "Open DevTools" button
 */
```

**`src/renderer/components/Preview/PreviewLoading.tsx`** (~60 lines)
```typescript
/**
 * @file PreviewLoading.tsx
 * @description Loading state while Vite server starts
 * 
 * SHOWS:
 * - Spinner
 * - "Starting development server..."
 * - Progress indicator (if available)
 * - Cancel button (if taking too long)
 */
```

##### Files to Modify

**`src/renderer/components/EditorPanel.tsx`**
- Replace `PreviewTabContent()` placeholder with `<PreviewPanel />`
- Import PreviewPanel component

##### Validation Criteria
- [ ] Preview panel renders correctly
- [ ] Toolbar controls work
- [ ] iframe loads preview URL
- [ ] Loading state shows during startup
- [ ] Error state shows on failure
- [ ] Viewport changes resize iframe
- [ ] Zoom scales iframe correctly

---

### Day 4: Console Capture & Display

#### Milestone 5: Console Log Capture
**Duration:** 0.5 day  
**Confidence Target:** 8/10  
**Status:** 🔵 Not Started

##### Objective
Capture console.log/warn/error from the preview iframe and display in Console tab.

##### Files to Create

**`src/renderer/components/Preview/consoleInjector.ts`** (~100 lines)
```typescript
/**
 * @file consoleInjector.ts
 * @description Script to inject into preview for console capture
 * 
 * APPROACH:
 * 1. Override console.log, console.warn, console.error, console.info
 * 2. Serialize arguments (handle circular refs, DOM nodes, etc.)
 * 3. PostMessage to parent window
 * 4. Call original console method
 * 
 * INJECTION:
 * - Injected via iframe.contentWindow.eval() after load
 * - Or via Vite plugin that injects on build
 * 
 * MESSAGE FORMAT:
 * {
 *   type: 'console',
 *   payload: {
 *     level: 'log' | 'warn' | 'error' | 'info',
 *     args: serializedArgs[],
 *     stack: string | null
 *   }
 * }
 */
```

**`src/renderer/components/Console/ConsolePanel.tsx`** (~200 lines)
```typescript
/**
 * @file ConsolePanel.tsx
 * @description Console output display for preview logs
 * 
 * FEATURES:
 * - Virtual list for performance (1000+ logs)
 * - Color coding by type (log=gray, warn=yellow, error=red)
 * - Expandable objects/arrays
 * - Stack traces for errors
 * - Copy to clipboard
 * - Clear button
 * - Filter by type
 * - Search
 */
```

**`src/renderer/components/Console/ConsoleEntry.tsx`** (~120 lines)
```typescript
/**
 * @file ConsoleEntry.tsx
 * @description Single console log entry
 * 
 * DISPLAYS:
 * - Timestamp
 * - Log level icon
 * - Formatted arguments
 * - Expandable for objects
 */
```

##### Files to Modify

**`src/renderer/components/EditorPanel.tsx`**
- Replace `ConsoleTabContent()` placeholder with `<ConsolePanel />`

##### Validation Criteria
- [ ] Console captures log/warn/error/info
- [ ] Logs display in correct order
- [ ] Objects/arrays are expandable
- [ ] Stack traces show for errors
- [ ] Clear button works
- [ ] Filter by type works
- [ ] Performance OK with 1000+ logs

---

### Day 5: Integration & Error Handling

#### Milestone 6: Project Lifecycle Integration
**Duration:** 0.5 day  
**Confidence Target:** 9/10  
**Status:** 🔵 Not Started

##### Objective
Integrate preview system with project open/close lifecycle.

##### Files to Modify

**`src/renderer/store/projectStore.ts`** (+50 lines)
```typescript
// Add preview lifecycle hooks:

// When project opens:
// - Call previewStore.startPreview(projectPath)

// When project closes:
// - Call previewStore.stopPreview()

// When project switches:
// - Stop current preview
// - Start new preview
```

**`src/renderer/App.tsx`** (+20 lines)
```typescript
// Add useEffect to start preview when project changes
// Add cleanup on unmount
```

##### Validation Criteria
- [ ] Preview starts when project opens
- [ ] Preview stops when project closes
- [ ] Preview switches correctly between projects
- [ ] No orphan Vite processes on app quit
- [ ] Memory usage stable on project switch

#### Milestone 7: Error Handling & Recovery
**Duration:** 0.5 day  
**Confidence Target:** 8/10  
**Status:** 🔵 Not Started

##### Objective
Handle all error scenarios gracefully.

##### Error Scenarios to Handle

| Scenario | Detection | User Feedback | Recovery |
|----------|-----------|---------------|----------|
| Vite not installed in project | npm list check | "Run npm install first" | Button to run npm install |
| Port in use | EADDRINUSE error | "Port busy, trying another..." | Auto-retry with different port |
| Vite crash | Process exit code | "Server crashed" | Retry button |
| Build error (syntax) | Vite stderr | Show error in preview overlay | Fix code, auto-rebuild |
| Runtime error | window.onerror | Show error boundary | Refresh button |
| Network error | iframe onerror | "Cannot connect to preview" | Retry button |
| Project deleted while running | ENOENT on restart | "Project not found" | Close project |
| npm install needed | Missing node_modules | "Dependencies not installed" | Install button |

##### Files to Create

**`src/main/preview/ErrorHandler.ts`** (~100 lines)
```typescript
/**
 * @file ErrorHandler.ts
 * @description Centralized error handling for preview system
 * 
 * RESPONSIBILITIES:
 * - Classify error types
 * - Generate user-friendly messages
 * - Suggest recovery actions
 * - Log for debugging
 */
```

##### Validation Criteria
- [ ] All error scenarios handled
- [ ] User-friendly error messages
- [ ] Recovery actions work
- [ ] No crashes on errors
- [ ] Errors logged for debugging

---

### Day 6: Testing & Polish

#### Milestone 8: Manual Testing
**Duration:** 0.5 day  
**Confidence Target:** 9/10  
**Status:** 🔵 Not Started

##### Test Scenarios

**Basic Functionality:**
- [ ] Create new project → preview starts automatically
- [ ] Preview shows default Vite page
- [ ] Edit App.jsx → HMR updates preview
- [ ] Change viewport → iframe resizes
- [ ] Change zoom → iframe scales
- [ ] Click refresh → preview reloads
- [ ] Open in browser → opens in default browser
- [ ] Console.log in code → appears in Console tab

**Error Cases:**
- [ ] Close project → preview stops, shows empty state
- [ ] Delete node_modules → shows "npm install needed"
- [ ] Break syntax in code → shows error in preview
- [ ] Kill Vite process manually → Rise detects and shows error
- [ ] Quit Rise → no orphan Vite processes

**Performance:**
- [ ] Server starts in < 5 seconds
- [ ] HMR updates in < 500ms
- [ ] Viewport changes are instant
- [ ] 1000 console logs don't lag

**Edge Cases:**
- [ ] Project path with spaces
- [ ] Project path with unicode
- [ ] Very large project (100+ files)
- [ ] Multiple rapid project switches

#### Milestone 9: Unit Tests
**Duration:** 0.5 day  
**Confidence Target:** 8/10  
**Status:** 🔵 Not Started

##### Tests to Write

**`src/main/preview/__tests__/ViteServerManager.test.ts`**
- Server starts correctly
- Server stops correctly
- Port finding works
- Crash detection works
- Restart works

**`src/main/preview/__tests__/PortFinder.test.ts`**
- Finds available port
- Handles busy ports
- Respects port range

**`src/renderer/store/__tests__/previewStore.test.ts`**
- Initial state correct
- Actions update state
- Console logs accumulate

##### Validation Criteria
- [ ] 80%+ coverage on ViteServerManager
- [ ] 90%+ coverage on PortFinder
- [ ] All tests pass
- [ ] No flaky tests

---

## 📁 Files Summary

### New Files to Create (12)

**Main Process (4):**
1. `src/main/preview/ViteServerManager.ts` - ~300 lines
2. `src/main/preview/PortFinder.ts` - ~80 lines
3. `src/main/preview/ErrorHandler.ts` - ~100 lines
4. `src/main/preview/types.ts` - ~50 lines

**Renderer Process (7):**
5. `src/renderer/store/previewStore.ts` - ~150 lines
6. `src/renderer/components/Preview/PreviewPanel.tsx` - ~250 lines
7. `src/renderer/components/Preview/PreviewToolbar.tsx` - ~200 lines
8. `src/renderer/components/Preview/PreviewFrame.tsx` - ~150 lines
9. `src/renderer/components/Preview/PreviewError.tsx` - ~80 lines
10. `src/renderer/components/Preview/PreviewLoading.tsx` - ~60 lines
11. `src/renderer/components/Preview/consoleInjector.ts` - ~100 lines
12. `src/renderer/components/Console/ConsolePanel.tsx` - ~200 lines
13. `src/renderer/components/Console/ConsoleEntry.tsx` - ~120 lines

**Tests (3):**
14. `src/main/preview/__tests__/ViteServerManager.test.ts` - ~200 lines
15. `src/main/preview/__tests__/PortFinder.test.ts` - ~100 lines
16. `src/renderer/store/__tests__/previewStore.test.ts` - ~150 lines

### Files to Modify (4)

1. `electron/ipc-handlers.ts` - +100 lines
2. `electron/preload.ts` - +20 lines
3. `src/renderer/components/EditorPanel.tsx` - Replace placeholders
4. `src/renderer/store/projectStore.ts` - +50 lines (lifecycle hooks)
5. `src/renderer/App.tsx` - +20 lines (preview lifecycle)

### Estimated Total
- **New Code:** ~2,290 lines
- **Modified Code:** ~190 lines
- **Tests:** ~450 lines
- **Grand Total:** ~2,930 lines

---

## 🔒 Security Requirements

### Iframe Sandbox
The preview iframe MUST have these restrictions:
```html
<iframe
  sandbox="allow-scripts allow-same-origin allow-forms"
  src={previewUrl}
/>
```

**ALLOWED:**
- `allow-scripts` - JavaScript execution (required for React)
- `allow-same-origin` - Same-origin access (required for HMR)
- `allow-forms` - Form submission (common in apps)

**NOT ALLOWED:**
- `allow-top-navigation` - Cannot navigate parent window
- `allow-popups` - Cannot open popups
- `allow-pointer-lock` - Cannot lock pointer
- `allow-modals` - Cannot show alerts/confirms

### Process Isolation
- Vite server runs as child process, not in Electron main process
- No `shell: true` in spawn (prevents command injection)
- Working directory restricted to project path
- Environment variables sanitized

### Network Isolation
- Preview only accessible on localhost
- Dynamic port prevents port scanning
- No external network access from preview (Vite config)

---

## ⚡ Performance Requirements

| Metric | Target | Measurement |
|--------|--------|-------------|
| Server start time | < 5 seconds | From project open to preview visible |
| HMR update time | < 500ms | From file save to preview update |
| Viewport change | < 50ms | From click to resize complete |
| Zoom change | < 50ms | From click to scale complete |
| Console log append | < 10ms | From postMessage to render |
| Memory per project | < 200MB | Including Vite process |
| Project switch | < 3 seconds | Stop old, start new |

---

## 🚨 Risk Assessment

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| Vite process orphaning | MEDIUM | MEDIUM | Process tracking, cleanup on quit, timeout kills |
| Port exhaustion | LOW | LOW | Wide port range (3001-3999), release on stop |
| HMR not working | HIGH | LOW | Fallback to full reload, document workarounds |
| Large console logs lag | MEDIUM | MEDIUM | Virtual list, log limit (10,000), clear option |
| iframe security bypass | CRITICAL | LOW | Strict sandbox, CSP headers, security review |
| Memory leaks on switch | MEDIUM | MEDIUM | Proper cleanup, memory profiling in tests |
| Windows path issues | MEDIUM | MEDIUM | Use path.normalize, test on Windows |
| Slow npm install delays | MEDIUM | HIGH | Clear messaging, progress indication |

---

## 🎓 Lessons Learned (to be filled)

### What Went Well
*[To be completed after implementation]*

### Challenges & Solutions
*[To be completed after implementation]*

### Reusable Patterns
*[To be completed after implementation]*

---

## ✅ Definition of Done

Task 1.4 is complete when:

1. [ ] All milestones (1-9) completed with confidence ≥8
2. [ ] Vite server starts/stops correctly
3. [ ] Preview displays in iframe
4. [ ] HMR works (< 500ms updates)
5. [ ] Viewport controls work (presets + custom)
6. [ ] Zoom controls work (50%-200%)
7. [ ] Console logs captured and displayed
8. [ ] Error handling covers all scenarios
9. [ ] Security requirements met (sandbox, isolation)
10. [ ] Performance targets met
11. [ ] Unit tests pass (80%+ coverage on core)
12. [ ] Manual testing completed
13. [ ] No orphan processes on quit
14. [ ] No memory leaks on project switch
15. [ ] Human review approved
16. [ ] **GATE:** Ready for Phase 2 (Component Management)

---

## 👨‍💻 Human Checkpoints

### Checkpoint 1: After Milestone 2 (IPC Complete)
**Review Focus:**
- [ ] IPC handler security (input validation)
- [ ] Preload API completeness
- [ ] Error handling patterns

### Checkpoint 2: After Milestone 4 (UI Complete)
**Review Focus:**
- [ ] Preview panel UX
- [ ] Viewport controls usability
- [ ] Loading/error states

### Checkpoint 3: After Milestone 7 (Error Handling Complete)
**Review Focus:**
- [ ] All error scenarios covered
- [ ] User-friendly messages
- [ ] Recovery actions work

### Final Review: After Milestone 9
**Review Focus:**
- [ ] End-to-end workflow
- [ ] Performance testing
- [ ] Security review
- [ ] Memory profiling

---

**Task Status:** 🟡 In Progress (1.4A Complete, 1.4B/1.4C Remaining)  
**Critical Path:** YES - Blocks Phase 2 (Component Management) and Phase 3 (Code Generation)  
**Risk Level:** MEDIUM - Complex child process management, security considerations  
**Next Task:** Task 1.4B - Preview Panel UI

---

## 📁 Task 1.4A Files Created

| File | Lines | Description |
|------|-------|-------------|
| `src/main/preview/types.ts` | ~240 | Type definitions and constants |
| `src/main/preview/PortFinder.ts` | ~230 | Port finding utilities |
| `src/main/preview/ViteServerManager.ts` | ~580 | Server lifecycle manager |
| `tests/unit/preview/PortFinder.test.ts` | ~220 | Port finder tests (17/17 passing) |
| `tests/unit/preview/ViteServerManager.test.ts` | ~550 | Server manager tests |

## 📁 Task 1.4A Files Modified

| File | Changes |
|------|---------|
| `electron/ipc-handlers.ts` | +150 lines - Preview IPC handlers |
| `electron/preload.ts` | +70 lines - Preview API for renderer |
| `electron/main.ts` | +25 lines - Cleanup on quit |

---

**Last Updated:** 2025-11-25  
**Document Version:** 1.1  
**Prepared By:** Claude (via Richard request)  
**Requires Sign-off:** Project Lead (Richard)
