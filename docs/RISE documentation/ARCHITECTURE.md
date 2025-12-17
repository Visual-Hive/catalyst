# Architecture Overview

## System Design Philosophy

This tool is built on three core principles:

1. **Clean Code Generation**: Output must be standard, framework-idiomatic code that any developer can read and extend
2. **Visual-First Experience**: Low-code developers should work primarily in the visual editor
3. **Bidirectional Workflow**: Changes in code or visual editor stay synchronized

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    ELECTRON DESKTOP APP                      │
├──────────────────┬──────────────────────┬───────────────────┤
│                  │                      │                   │
│  Component Tree  │   Canvas/Preview     │   Properties      │
│   Navigator      │      Editor          │     Panel         │
│                  │                      │                   │
│  - File tree     │  - Component view    │  - Property       │
│  - Visual graph  │  - Full app preview  │    editor         │
│  - Search        │  - Step debugger     │  - Connections    │
│                  │                      │  - State viewer   │
└──────────────────┴──────────────────────┴───────────────────┘
         ↓                    ↓                      ↓
┌─────────────────────────────────────────────────────────────┐
│                     CORE ENGINE                              │
├──────────────────┬──────────────────────┬───────────────────┤
│                  │                      │                   │
│   Manifest       │   Code Generator     │   File System     │
│   Manager        │                      │   Watcher         │
│                  │                      │                   │
│  - Parse JSON    │  - React compiler    │  - Monitor edits  │
│  - Validate      │  - Framework plugin  │  - Trigger sync   │
│  - Update state  │  - Optimize output   │  - Save manifest  │
└──────────────────┴──────────────────────┴───────────────────┘
         ↓                    ↓                      ↓
┌─────────────────────────────────────────────────────────────┐
│                  GENERATED PROJECT                           │
│                                                              │
│  .lowcode/              src/                  Standard       │
│  ├── manifest.json      ├── components/      Vite/React     │
│  ├── connections.json   ├── scripts/         Project        │
│  └── variables.json     └── App.jsx                         │
└─────────────────────────────────────────────────────────────┘
         ↓                                           ↓
┌──────────────────────────┐      ┌─────────────────────────┐
│   VITE DEV SERVER        │      │   AI COPILOT            │
│                          │      │                         │
│  - Hot reload            │      │  - Component generation │
│  - Debug instrumentation │      │  - Code review          │
│  - Preview webview       │      │  - Reverse engineering  │
└──────────────────────────┘      └─────────────────────────┘
```

## Technology Stack

### Desktop Application
- **Framework**: Electron 28+
- **UI**: React 18+ with TypeScript
- **State Management**: Zustand (lightweight, reactive)
- **Editor**: Monaco Editor (VSCode engine)
- **Styling**: Tailwind CSS

### Code Processing
- **Parser**: Babel (AST manipulation)
- **Generator**: Custom React code generator with framework plugins
- **Linter**: ESLint integration
- **Formatter**: Prettier integration

### Visualization
- **Component Graph**: React Flow
- **Logic Canvas**: React Flow (node-based logic editor)
- **File Tree**: react-arborist
- **Preview**: Embedded Vite dev server in Electron webview

### AI Integration
- **Primary**: Anthropic Claude API (via Cline-style interaction)
- **Fallback**: OpenAI API support
- **Local**: Ollama support for offline mode (future)

### Generated Project Stack
- **Build Tool**: Vite 5+
- **Framework**: React 18+ (MVP), plugins for Vue/Svelte/Angular later
- **Routing**: React Router (optional)
- **State**: Zustand for reactive global variables
- **Styling**: Tailwind CSS + component libraries (MUI, shadcn)

## Core Components

### 1. Manifest Manager

**Responsibility**: Single source of truth for component architecture

```typescript
interface ManifestManager {
  load(projectPath: string): Promise<Manifest>;
  save(manifest: Manifest): Promise<void>;
  validate(manifest: Manifest): ValidationResult;
  update(componentId: string, changes: Partial<Component>): void;
  addComponent(parent: string, component: Component): void;
  removeComponent(componentId: string): void;
  getComponent(componentId: string): Component | null;
  getTree(): ComponentTree;
}
```

**Storage**: `.lowcode/manifest.json`

### 2. Code Generator

**Responsibility**: Transform manifest into framework-specific code

```typescript
interface CodeGenerator {
  generate(manifest: Manifest, framework: Framework): GeneratedFiles;
  compile(component: Component): string;
  optimizeImports(code: string): string;
  format(code: string): string;
}
```

**Plugin System**: Framework adapters implement `FrameworkPlugin` interface

### 3. File System Watcher

**Responsibility**: Detect manual code edits and trigger reverse engineering

```typescript
interface FileWatcher {
  watch(projectPath: string): void;
  onFileChange(path: string, callback: (diff: FileDiff) => void): void;
  isUserEdit(change: FileChange): boolean; // vs. tool-generated
  pauseWatch(): void; // During compilation
  resumeWatch(): void;
}
```

**Uses**: chokidar for file watching

### 4. Reverse Engineer

**Responsibility**: Parse code changes back into manifest updates

```typescript
interface ReverseEngineer {
  parseComponent(code: string): Component;
  detectChanges(oldCode: string, newCode: string): ComponentDiff;
  updateManifest(manifest: Manifest, diff: ComponentDiff): Manifest;
  inferConnections(component: Component): Connection[];
}
```

**Uses**: Babel AST parsing + AI assistance for ambiguous cases

### 5. Logic System (Schema Level 2+)

**Responsibility**: Visual node-based logic with persistent reactive state

```typescript
interface LogicSystem {
  // State management
  createStateStore(stateDefinition: StateDefinition): ZustandStore;
  
  // Logic flow execution
  executeFlow(flowId: string, trigger: Event): Promise<void>;
  
  // Node execution
  executeNode(node: LogicNode, context: ExecutionContext): Promise<any>;
  
  // State access
  getState(variable: string, scope: 'page' | 'app'): any;
  setState(variable: string, value: any, scope: 'page' | 'app'): void;
  
  // Debugging
  traceExecution(flowId: string): ExecutionTrace;
  getStateHistory(): StateChange[];
}

interface LogicNode {
  id: string;
  type: NodeType;
  config: Record<string, any>;
  position: { x: number; y: number };
}

type NodeType = 
  | 'getState' | 'setState' | 'toggleState'
  | 'ifElse' | 'switch' | 'loop'
  | 'httpRequest' | 'parseJson'
  | 'navigate' | 'showToast' | 'focus'
  | 'getUrlParam' | 'localStorage'
  | 'custom';
```

**Implementation:**
- React Flow for visual node canvas
- Zustand for state management
- Topological sort for node execution order
- Code generation from logic flows to JavaScript functions

**Key Features:**
- Persistent reactive state (page-level, app-level)
- Independent logic flows sharing state
- Visual debugging with execution traces
- State inspector with change history
- Breakpoints and step-through debugging

See [LOGIC_SYSTEM.md](./LOGIC_SYSTEM.md) for detailed design.

### 6. Debug Runtime

**Responsibility**: Instrument generated code for step-through debugging

```typescript
interface DebugRuntime {
  instrument(code: string): string; // Add debug wrappers
  connect(webview: WebView): void; // Bridge to preview
  pause(): void;
  step(): void;
  continue(): void;
  getState(componentId: string): ComponentState;
  captureSnapshot(): DebugSnapshot;
}
```

**Implementation**: Injects `__debugWrap()` around event handlers

## Data Flow

### Component Creation Flow

```
User Request (UI or AI)
    ↓
Manifest Manager.addComponent()
    ↓
Validate against schema
    ↓
Update manifest.json
    ↓
Trigger Code Generator
    ↓
Generate React file
    ↓
Save to src/components/
    ↓
File Watcher detects (but ignores - tool-generated)
    ↓
Update UI tree view
```

### Manual Code Edit Flow

```
Developer edits in VSCode
    ↓
File Watcher detects change
    ↓
Check if tool-generated comment marker
    ↓
If user edit:
    ↓
Reverse Engineer.parseComponent()
    ↓
AI assistance if needed
    ↓
Generate ComponentDiff
    ↓
Manifest Manager.update()
    ↓
Update manifest.json
    ↓
Refresh visual editor UI
```

### Debug Session Flow

```
User clicks "Debug Mode"
    ↓
Code Generator instruments code
    ↓
Vite rebuilds
    ↓
Preview loads instrumented app
    ↓
User clicks button in preview
    ↓
Event handler wrapped by __debugWrap()
    ↓
Debug Runtime.pause()
    ↓
Send state snapshot to Electron
    ↓
UI shows current state
    ↓
User clicks "Step"
    ↓
Resume execution until next event
```

## Inter-Process Communication

Electron uses IPC for communication between main process and renderer:

```typescript
// Main Process API
ipcMain.handle('manifest:load', async (event, path) => {...});
ipcMain.handle('manifest:save', async (event, data) => {...});
ipcMain.handle('codegen:generate', async (event, manifest) => {...});
ipcMain.handle('ai:complete', async (event, prompt) => {...});

// Renderer Process API
ipcRenderer.invoke('manifest:load', projectPath);
ipcRenderer.invoke('codegen:generate', manifest);
```

**Security**: Use `contextBridge` to expose only necessary APIs to renderer

## Plugin Architecture

### Framework Plugin Interface

```typescript
interface FrameworkPlugin {
  name: string; // 'react', 'vue', 'svelte', 'angular'
  version: string;
  
  // Code generation
  generateComponent(component: Component): string;
  generateApp(manifest: Manifest): string;
  generateImports(components: Component[]): string;
  
  // Parsing (for reverse engineering)
  parseComponent(code: string): Component;
  detectFramework(code: string): boolean;
  
  // Project setup
  getProjectTemplate(): ProjectTemplate;
  getDevDependencies(): PackageJSON;
  
  // Runtime
  getDebugRuntime(): DebugRuntimeAdapter;
}
```

**Loading**: Plugins are npm packages in `node_modules/@lowcode-plugins/framework-*`

**Registration**: Auto-discover in `.lowcode/plugins/` directory

## Performance Considerations

### Manifest Loading
- **Strategy**: Lazy load component details, only load tree structure initially
- **Caching**: Keep parsed manifest in memory, save debounced (500ms)

### Code Generation
- **Strategy**: Incremental generation - only regenerate changed components
- **Optimization**: Generate in worker thread to avoid blocking UI

### File Watching
- **Strategy**: Debounce file events (200ms) to batch rapid changes
- **Filtering**: Ignore node_modules, build outputs, .git

### Preview Rendering
- **Strategy**: Vite's HMR for fast updates without full reload
- **Isolation**: Each component preview in separate iframe

## Security Considerations

1. **Sandbox Preview**: Preview webview runs with `nodeIntegration: false`
2. **Code Execution**: User scripts run in isolated context
3. **File Access**: Limit file operations to project directory
4. **API Keys**: Store AI API keys in encrypted system keychain
5. **Updates**: Auto-update Electron with signature verification

## Extensibility Points

Future plugin types beyond framework adapters:

- **Component Libraries**: shadcn, MUI, Ant Design adapters
- **Backends**: Supabase, Firebase, REST API connectors
- **Deployment**: Vercel, Netlify, AWS deployment plugins
- **AI Providers**: Custom AI provider plugins
- **Importers**: Figma, Sketch, Bubble import plugins

## Technical Debt & Future Work

1. **Performance**: Large projects (100+ components) need virtual scrolling
2. **Collaboration**: Multi-user editing via CRDT (like Figma)
3. **Version Control**: Visual git integration for manifest changes
4. **Testing**: Visual test recorder and component testing integration
5. **Accessibility**: Ensure generated code meets WCAG standards

---

**Next Steps**: See [MVP Roadmap](./MVP_ROADMAP.md) for implementation phases

# ARCHITECTURE.md - Critical Updates Required

> Based on comprehensive audit findings - these updates must be applied before implementation

---

## 🚨 CRITICAL FIXES REQUIRED

### 1. File Watcher Infinite Loop Protection

**Location**: Data Flow → Manual Code Edit Flow section

**Current Problem**:
```typescript
function getChangeSource(file: File): 'tool' | 'user' {
  // If we just generated this file (within last 1 second)
  if (Date.now() - metadata.lastGenerationTime < 1000) {
    return 'tool';
  }
}
```

**❌ Issue**: Time-based detection is fragile and will cause infinite loops

**✅ Required Fix**:
```typescript
class FileChangeTracker {
  private generationHashes = new Map<string, string>();
  private pausedPaths = new Set<string>();
  
  async onBeforeGenerate(filepath: string, content: string): Promise<void> {
    // Pause watching this file
    this.pausedPaths.add(filepath);
    
    // Store hash of what we're about to write
    const hash = this.computeHash(content);
    this.generationHashes.set(filepath, hash);
  }
  
  async onAfterGenerate(filepath: string): Promise<void> {
    // Wait for file system to settle
    await this.delay(100);
    
    // Resume watching
    this.pausedPaths.delete(filepath);
  }
  
  isUserEdit(filepath: string, content: string): boolean {
    // File is paused - ignore
    if (this.pausedPaths.has(filepath)) {
      return false;
    }
    
    // Check if content matches what we generated
    const expectedHash = this.generationHashes.get(filepath);
    const actualHash = this.computeHash(content);
    
    return expectedHash !== actualHash;
  }
  
  private computeHash(content: string): string {
    return crypto.createHash('sha256').update(content).digest('hex');
  }
  
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
```

**Add New Section After "File System Watcher"**:

```markdown
### File Change Detection Algorithm

**Problem**: Distinguish between tool-generated changes and user edits to prevent infinite loops.

**Solution**: Hash-based detection with path pausing

**Implementation**:
1. Before generating code, pause file watcher for that specific file
2. Calculate hash of content being written
3. Store hash in metadata
4. Write file
5. Wait 100ms for filesystem to settle
6. Resume watching
7. On subsequent changes, compare new hash with stored hash
8. If hashes differ → user edit, trigger sync
9. If hashes match → tool generated, ignore

**Edge Cases Handled**:
- Concurrent edits (multiple files changing)
- Slow file systems (100ms delay)
- Generation taking > 1 second (hash-based, not time-based)
- User editing immediately after generation (hash will differ)
```

---

### 2. TypeScript Support Clarification

**Location**: Technology Stack section

**Current Problem**: Inconsistent messaging about TypeScript support

**✅ Required Fix**:

Replace ambiguous mentions with clear timeline:

```markdown
### Language Support

**MVP (Level 1)**:
- ✅ JavaScript (ES2020+)
- ❌ TypeScript (Post-MVP)

**Post-MVP (Level 2)** (Week 25+):
- ✅ TypeScript support
- ✅ Type inference for generated code
- ✅ .d.ts file generation

**Current Implementation**:
- All generated code uses JavaScript
- JSDoc comments for type hints
- Users can manually convert to TypeScript after generation
```

---

### 3. Security Architecture Section (NEW)

**Location**: Add new section after "Core Components"

**✅ Required Addition**:

```markdown
## Security Architecture

### Expression Sandboxing

All user expressions execute in isolated environments:

**Development (Electron)**:
- VM2 sandboxing
- AST validation before execution
- Resource limits (100ms timeout, 50MB memory)
- Whitelist of allowed globals

**Production (Browser)**:
- Web Workers for isolation
- CSP (Content Security Policy)
- No eval() or Function() constructors
- Strict mode enforcement

**See**: [SECURITY_SPEC.md](./SECURITY_SPEC.md) for complete details

### Plugin Sandboxing

Plugins run in isolated contexts with restricted file system access:

**Security Layers**:
1. Package validation (signature checking)
2. VM2 sandbox execution
3. File system restrictions (plugin directory only)
4. Resource monitoring (CPU, memory)
5. Network restrictions (no external requests)

**See**: [SECURITY_SPEC.md](./SECURITY_SPEC.md) - Plugin Security section

### API Key Protection

**Storage**: OS-level encrypted keychain (Keytar library)
**Access**: Never exposed in logs or error messages
**Budget**: Daily spending limits with warnings
**Rotation**: 90-day rotation reminders

**See**: [API_INTEGRATION.md](./API_INTEGRATION.md) for complete details
```

---

### 4. Error Handling Architecture (NEW)

**Location**: Add new section after "Security Architecture"

**✅ Required Addition**:

```markdown
## Error Handling Architecture

### Error Boundary Strategy

**React Error Boundaries**:
- Wrap all major UI sections
- Prevent cascading failures
- Provide recovery UI
- Log errors automatically

**Error Severity Levels**:
- DEBUG: Auto-logged
- INFO: Notable events
- WARNING: Non-blocking issues
- ERROR: Requires user attention
- CRITICAL: Core functionality affected
- FATAL: Requires restart

### Error Recovery

**Automatic Recovery**:
- Retry with exponential backoff (network errors)
- Fallback values (missing data)
- Graceful degradation (feature unavailable)

**User-Guided Recovery**:
- Clear error messages
- Actionable recovery steps
- Option to report issues

**See**: [ERROR_HANDLING.md](./ERROR_HANDLING.md) for complete specification
```

---

### 5. Performance Considerations (UPDATE)

**Location**: Performance Considerations section

**Current Problem**: No mention of debug overhead

**✅ Required Addition**:

```markdown
### Debug Mode Performance

**Debug Instrumentation Overhead**:
- Every event handler wrapped: ~5-10% performance cost
- State snapshots on each event: memory overhead
- IPC communication to Electron: latency added

**Mitigation Strategies**:

**Production Builds**:
```typescript
// Debug code completely removed via tree-shaking
const handler = __DEBUG__ 
  ? __debugWrap('handler', actualHandler, metadata)
  : actualHandler;
```

**Lazy Instrumentation**:
```typescript
// Only instrument when debugger is active
class DebugRuntime {
  private isActive = false;
  
  setActive(active: boolean): void {
    this.isActive = active;
    this.notifyComponents();
  }
}
```

**Sampling**:
- Capture state snapshots max 10/second
- User can disable expensive features
- Compress state before IPC send

**See**: [DEBUGGER_DESIGN.md](./DEBUGGER_DESIGN.md) - Performance section
```

---

### 6. Schema Level Integration (NEW)

**Location**: Add to Data Flow section

**✅ Required Addition**:

```markdown
## Schema Progression Model

Rise implements a **progressive schema system** to manage complexity:

### Level 1 (MVP) - Weeks 1-12
**Supported**:
- Static properties
- Basic component hierarchy
- Props (component inputs)
- Simple styling

**NOT Supported**:
- Expressions (coming Level 2)
- State management (coming Level 2)
- Event handlers (coming Level 2)

### Level 2 (Post-MVP) - Weeks 13-24
**Adds**:
- User expressions with sandboxing
- Local and global state
- Event handlers
- Computed properties
- Global functions (namespaced)

### Level 3 (Advanced) - Week 25+
**Adds**:
- Real-time data connections
- AI code review
- Performance monitoring
- Advanced routing

**See**: [SCHEMA_LEVELS.md](./SCHEMA_LEVELS.md) for complete progression plan

**Critical**: All examples in documentation must indicate which level they require.
```

---

## 🟡 IMPORTANT UPDATES

### 7. Plugin Loading Process

**Location**: Plugin Architecture section

**Current Problem**: No security validation steps

**✅ Required Update**:

```markdown
### Plugin Loading Process

1. **Discovery**: Find plugin packages
2. **Validation**: Check package.json format
3. **Security Scan**: Verify plugin signature (future: code signing)
4. **Sandbox Creation**: Initialize VM2 environment
5. **Interface Check**: Verify plugin implements required methods
6. **Test Run**: Execute with sample component
7. **Registration**: Add to plugin registry
8. **Caching**: Store plugin instance for reuse

**Error Handling**:
- Invalid plugins logged and skipped
- User notified of plugin failures
- Fallback to built-in React plugin
- Manual code editing always available

**Resource Limits**:
- 5-second load timeout
- Max 100MB memory per plugin
- CPU usage monitored
- File access restricted to plugin directory
```

---

### 8. Dependency Management

**Location**: Technology Stack section

**Current Problem**: No mention of security scanning

**✅ Required Addition**:

```markdown
### Dependency Security

**Automated Scanning**:
```bash
# Run on every PR and weekly
npm audit
npm audit fix

# Check for outdated packages
npm outdated
```

**Monitoring**:
- Dependabot alerts enabled
- Security advisories monitored
- Critical vulnerabilities patched within 48 hours
- Regular dependency updates (monthly)

**Version Pinning**:
- Exact versions in package.json
- Lock file committed to repository
- Major upgrades tested thoroughly
```

---

### 9. Testing Infrastructure

**Location**: Add new section after Architecture

**✅ Required Addition**:

```markdown
## Testing Architecture

### Test Levels

**Unit Tests** (Vitest):
- Coverage target: 80% for core engine
- Location: `tests/unit/`
- Focus: Manifest manager, code generator, validators

**Integration Tests**:
- Coverage target: All critical workflows
- Location: `tests/integration/`
- Focus: Component creation → generation → preview flow

**E2E Tests** (Playwright):
- Coverage target: Happy path + major errors
- Location: `tests/e2e/`
- Focus: User creates project, adds components, previews app

**Security Tests**:
- Expression injection attempts
- Plugin sandbox escape attempts
- API key extraction attempts
- Path traversal attempts

**See**: [TESTING_STRATEGY.md](./TESTING_STRATEGY.md) for complete strategy
```

---

## 📝 DOCUMENTATION CROSS-REFERENCES TO ADD

Add these cross-references throughout ARCHITECTURE.md:

**After "Expression System" section**:
```markdown
**See Also**:
- [SECURITY_SPEC.md](./SECURITY_SPEC.md) - Expression sandboxing implementation
- [SCHEMA_LEVELS.md](./SCHEMA_LEVELS.md) - When expressions become available
```

**After "Plugin System" section**:
```markdown
**See Also**:
- [PLUGIN_SYSTEM.md](./PLUGIN_SYSTEM.md) - Complete plugin specification
- [SECURITY_SPEC.md](./SECURITY_SPEC.md) - Plugin security model
```

**After "File System Watcher" section**:
```markdown
**See Also**:
- [BIDIRECTIONAL_SYNC.md](./BIDIRECTIONAL_SYNC.md) - Code-to-manifest sync
- [ERROR_HANDLING.md](./ERROR_HANDLING.md) - Handling file system errors
```

---

## ✅ VALIDATION CHECKLIST

Before considering ARCHITECTURE.md complete:

- [ ] File watcher uses hash-based detection
- [ ] TypeScript support timeline clarified
- [ ] Security architecture section added
- [ ] Error handling architecture section added
- [ ] Debug mode performance impact documented
- [ ] Schema levels integrated
- [ ] Plugin loading security steps documented
- [ ] Dependency security scanning mentioned
- [ ] Testing architecture section added
- [ ] All cross-references added
- [ ] All examples indicate schema level required

---

## IMPACT ON OTHER DOCUMENTS

These ARCHITECTURE.md updates require corresponding changes in:

1. **MVP_ROADMAP.md**:
   - Update Phase 1 to include file watcher implementation
   - Add security implementation to Phase 1 requirements
   - Clarify TypeScript is post-MVP

2. **GETTING_STARTED.md**:
   - Remove "TypeScript support" from MVP features
   - Add note about manual TypeScript conversion
   - Update prerequisites

3. **README.md**:
   - Clarify TypeScript timeline
   - Emphasize security features
   - Update feature matrix

---

**Priority**: 🚨 **CRITICAL - Must complete before MVP implementation**

**Review Required**: 
- Lead Developer
- Security Engineer
- Project Manager

**Estimated Time**: 4-6 hours to apply all updates

---

**Last Updated**: October 25, 2025  
**Status**: 🔴 Pending Implementation
