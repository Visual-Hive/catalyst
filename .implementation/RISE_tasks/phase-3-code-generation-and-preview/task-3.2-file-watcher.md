# Task 3.2: File Management with Hash Watcher

**Phase:** Phase 3 - Code Generation & Preview  
**Duration Estimate:** 3-4 days  
**Actual Duration:** 1 day  
**Status:** ✅ Complete  
**Assigned:** Cline + Human Review  
**Priority:** P0 - Critical Path  
**Dependencies:** Task 0.1 (FileChangeTracker) ✅, Task 3.1 (ReactCodeGenerator) ✅  
**Started:** 2025-11-27  
**Completed:** 2025-11-27

---

## 🎯 Task Overview

### Objective

Implement the file management system that writes generated React code to disk while integrating with the FileChangeTracker to prevent infinite loops and protect user edits. This is the bridge between code generation and the file system.

### Problem Statement

Task 3.1 generates React code as strings, but they exist only in memory. Without Task 3.2:
- Generated code never reaches the file system
- The preview system (Task 3.3) has no files to serve
- Users can't see or use their generated components
- There's no App.jsx to run the application

**The Core Challenge:**
File watching creates a feedback loop danger:
1. Tool generates code → writes file
2. File watcher detects change → triggers regeneration
3. Tool generates code again → writes file
4. **∞ INFINITE LOOP**

Task 3.2 solves this by integrating FileChangeTracker (from Phase 0) to distinguish tool-generated changes from user edits.

### Why This Matters

This task is the **critical link** between code generation and visual preview:

1. **Makes code real**: Generated strings become actual files on disk
2. **Enables preview**: Files on disk can be served by Vite (Task 3.3)
3. **Prevents disasters**: Hash-based detection stops infinite loops
4. **Respects users**: Tracks which files users have edited
5. **Enables incremental builds**: Only regenerate changed components

**Without this task, code generation is useless - just strings that vanish.**

### Success Criteria

- [x] Components written to `src/components/{ComponentName}.jsx`
- [x] FileChangeTracker.onBeforeGenerate() called before every file write
- [x] FileChangeTracker.onAfterGenerate() called after every file write
- [x] App.jsx generated with all root component imports
- [x] main.jsx generated as application entry point
- [x] Incremental generation works (only changed components regenerated)
- [x] No infinite loops when files change
- [x] User-edited files tracked and not silently overwritten
- [x] File deletion handled gracefully
- [x] Large projects (50+ components) perform well (<2s full regeneration)
- [x] Unit test coverage >85% (31 tests passing)
- [ ] Human review approved

### References

- **docs/FILE_STRUCTURE_SPEC.md** - Output file locations and structure
- **src/core/FileChangeTracker.ts** - Hash-based change detection (Phase 0)
- **src/core/codegen/ReactCodeGenerator.ts** - Code generation (Task 3.1)
- **docs/PERFORMANCE.md** - Incremental generation strategy
- **CLINE_IMPLEMENTATION_PLAN.md** - Phase 3, Task 3.2

### Out of Scope (Future Tasks)

- ❌ Live preview rendering (Task 3.3)
- ❌ Vite dev server integration (Task 3.3)
- ❌ Bidirectional sync (parsing user edits back to manifest) → Post-MVP
- ❌ Runtime files (globalState.js, debugger.js) → Level 2+
- ❌ TypeScript output (.tsx) → Post-MVP option

---

## 🏗️ Architecture Overview

### System Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                     File Management Pipeline                             │
│                                                                          │
│  Manifest Change Event                                                   │
│  (from manifestStore)                                                    │
│         │                                                                │
│         ▼                                                                │
│  ┌──────────────────┐                                                   │
│  │ FileManager      │ ─── Main orchestrator                             │
│  │                  │     Coordinates generation + file I/O              │
│  └────────┬─────────┘                                                   │
│           │                                                              │
│           ▼                                                              │
│  ┌──────────────────┐                                                   │
│  │ ChangeDetector   │ ─── Determine which components changed            │
│  │                  │     Compare manifest hash with cached hash         │
│  └────────┬─────────┘                                                   │
│           │ changed components                                           │
│           ▼                                                              │
│  ┌──────────────────┐                                                   │
│  │ReactCodeGenerator│ ─── Generate code strings (Task 3.1)              │
│  │ (from Task 3.1)  │                                                   │
│  └────────┬─────────┘                                                   │
│           │ generated code                                               │
│           ▼                                                              │
│  ┌──────────────────┐    ┌──────────────────┐                          │
│  │ FileWriter       │───▶│ FileChangeTracker│                          │
│  │                  │    │ (from Task 0.1)  │                          │
│  │ For each file:   │    │                  │                          │
│  │ 1. onBeforeGen() │◀───│ - Store hash     │                          │
│  │ 2. writeFile()   │    │ - Pause watching │                          │
│  │ 3. onAfterGen()  │───▶│ - Resume watching│                          │
│  └────────┬─────────┘    └──────────────────┘                          │
│           │                                                              │
│           ▼                                                              │
│  ┌──────────────────┐                                                   │
│  │ AppGenerator     │ ─── Generate App.jsx and main.jsx                 │
│  │                  │     Import all root components                     │
│  └────────┬─────────┘                                                   │
│           │                                                              │
│           ▼                                                              │
│      Files on Disk                                                       │
│  src/components/*.jsx                                                    │
│  src/App.jsx                                                             │
│  src/main.jsx                                                            │
└─────────────────────────────────────────────────────────────────────────┘
```

### File Writing Sequence (Critical)

```
FileWriter           FileChangeTracker         FileSystem
    │                        │                      │
    │  onBeforeGenerate()    │                      │
    │  (filepath, content)   │                      │
    │───────────────────────▶│                      │
    │                        │──compute hash        │
    │                        │──store hash          │
    │                        │──pause file          │
    │                        │──set 5s timeout      │
    │◀───────────────────────│                      │
    │                        │                      │
    │  writeFile()           │                      │
    │───────────────────────────────────────────────▶
    │                        │                      │
    │  onAfterGenerate()     │                      │
    │───────────────────────▶│                      │
    │                        │──clear timeout       │
    │                        │──wait 100ms          │
    │                        │──resume watching     │
    │◀───────────────────────│                      │
    │                        │                      │
```

**CRITICAL TIMING:**
1. `onBeforeGenerate()` MUST be called BEFORE `writeFile()`
2. `onAfterGenerate()` MUST be called AFTER `writeFile()` completes
3. If timing is wrong, infinite loops WILL occur

---

## 📁 Generated File Structure

### Output Directory Structure

```
{projectPath}/
├── src/
│   ├── components/           # All generated components
│   │   ├── Button.jsx
│   │   ├── Header.jsx
│   │   ├── Card.jsx
│   │   └── ...
│   │
│   ├── App.jsx               # Main app component (generated)
│   └── main.jsx              # Entry point (generated)
│
└── .lowcode/
    └── manifest.json         # Source of truth
```

### Generated File Examples

#### Component File: `src/components/Button.jsx`
```jsx
import React from 'react';

/**
 * @lowcode:generated
 * @lowcode:component-id: comp_button_001
 * @lowcode:level: 1
 * @lowcode:last-generated: 2025-11-27T12:00:00.000Z
 * DO NOT EDIT: This file is auto-generated. Changes will be overwritten.
 */
export function Button({ label = 'Click me', disabled = false }) {
  return (
    <button className="btn btn-primary px-4 py-2" disabled={disabled}>
      {label}
    </button>
  );
}

export default Button;
```

#### App.jsx (Root Components)
```jsx
import React from 'react';

/**
 * @lowcode:generated
 * @lowcode:level: 1
 * @lowcode:last-generated: 2025-11-27T12:00:00.000Z
 * Main application component - imports all root-level components
 * DO NOT EDIT: This file is auto-generated. Changes will be overwritten.
 */
import { Header } from './components/Header';
import { MainContent } from './components/MainContent';
import { Footer } from './components/Footer';

export default function App() {
  return (
    <div className="app">
      <Header />
      <MainContent />
      <Footer />
    </div>
  );
}
```

#### main.jsx (Entry Point)
```jsx
import React from 'react';
import ReactDOM from 'react-dom/client';

/**
 * @lowcode:generated
 * @lowcode:level: 1
 * @lowcode:last-generated: 2025-11-27T12:00:00.000Z
 * Application entry point
 * DO NOT EDIT: This file is auto-generated. Changes will be overwritten.
 */
import App from './App';
import './styles/globals.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

---

## 📁 Files to Create

### Core Implementation

| File | Description | Est. Lines |
|------|-------------|------------|
| `src/core/filemanager/types.ts` | Type definitions | ~120 |
| `src/core/filemanager/FileManager.ts` | Main orchestrator class | ~350 |
| `src/core/filemanager/ChangeDetector.ts` | Detect changed components | ~150 |
| `src/core/filemanager/FileWriter.ts` | Write files with tracker integration | ~200 |
| `src/core/filemanager/AppGenerator.ts` | Generate App.jsx and main.jsx | ~180 |
| `src/core/filemanager/index.ts` | Module exports | ~30 |

### Tests

| File | Description | Est. Lines |
|------|-------------|------------|
| `tests/unit/filemanager/ChangeDetector.test.ts` | Change detection tests | ~150 |
| `tests/unit/filemanager/FileWriter.test.ts` | File writing tests | ~200 |
| `tests/unit/filemanager/AppGenerator.test.ts` | App.jsx generation tests | ~150 |
| `tests/unit/filemanager/FileManager.test.ts` | Integration tests | ~300 |

**Total Estimated:** ~1,830 lines (implementation + tests)

---

## 🔒 Critical Safety Requirements

### FileChangeTracker Integration

**MANDATORY for every file write:**

```typescript
// CORRECT - Safe file writing
async function writeGeneratedFile(filepath: string, content: string): Promise<void> {
  // 1. Tell tracker we're about to write (BEFORE writeFile)
  await this.fileChangeTracker.onBeforeGenerate(filepath, content);
  
  try {
    // 2. Actually write the file
    await fs.promises.writeFile(filepath, content, 'utf-8');
    
    // 3. Tell tracker we finished (AFTER writeFile)
    await this.fileChangeTracker.onAfterGenerate(filepath);
  } catch (error) {
    // Still call onAfterGenerate to prevent file being permanently paused
    await this.fileChangeTracker.onAfterGenerate(filepath);
    throw error;
  }
}

// WRONG - Will cause infinite loops
async function writeGeneratedFileBad(filepath: string, content: string): Promise<void> {
  // ❌ NO tracker integration - INFINITE LOOP GUARANTEED
  await fs.promises.writeFile(filepath, content, 'utf-8');
}
```

### User Edit Detection

When the file watcher detects a change, check if it was a user edit:

```typescript
watcher.on('change', async (filepath) => {
  const content = await fs.promises.readFile(filepath, 'utf-8');
  
  if (this.fileChangeTracker.isUserEdit(filepath, content)) {
    // User edited the file - DO NOT overwrite without warning
    this.markFileAsUserEdited(filepath);
    console.log(`User edited: ${filepath}`);
  } else {
    // Tool generated this change - ignore
  }
});
```

### User Edit Protection

Files marked as user-edited should not be silently overwritten:

```typescript
async function regenerateComponent(componentId: string): Promise<void> {
  const filepath = this.getComponentPath(componentId);
  
  if (this.userEditedFiles.has(filepath)) {
    // Emit warning event instead of overwriting
    this.emit('user-edit-conflict', {
      filepath,
      componentId,
      message: 'This file has been manually edited. Regenerating will overwrite your changes.'
    });
    return; // Don't overwrite without explicit confirmation
  }
  
  // Safe to regenerate
  await this.writeGeneratedFile(filepath, generatedCode);
}
```

---

## 🗺️ Implementation Roadmap

### Milestone 1: Types & Architecture Design
**Duration:** 0.5 day  
**Confidence Target:** 9/10  
**Status:** 🔵 Not Started

#### Objective
Define all TypeScript types and design the file management architecture.

#### Deliverables
- [ ] `src/core/filemanager/types.ts` with:
  - `FileManagerOptions` interface
  - `FileWriteResult` interface
  - `GenerationSummary` interface
  - `ComponentFileInfo` type
  - `UserEditConflict` event type
  - Constants for file paths, extensions

#### Design Decisions to Make

| Decision | Options | Recommendation |
|----------|---------|----------------|
| File writing | Sequential vs parallel | Parallel with concurrency limit (5) |
| Change detection | Hash manifest vs individual components | Hash individual components (granular) |
| User edit tracking | In-memory vs persisted | Persisted to `.lowcode/user-edits.json` |
| Error handling | Stop on first error vs continue | Continue and collect errors |

#### Human Checkpoint
None - low risk, proceed to Milestone 2

---

### Milestone 2: Change Detector
**Duration:** 0.5 day  
**Confidence Target:** 9/10  
**Status:** 🔵 Not Started

#### Objective
Build the ChangeDetector class that determines which components need regeneration.

#### Deliverables
- [ ] `src/core/filemanager/ChangeDetector.ts`:
  - Hash individual component definitions
  - Cache component hashes
  - Compare current vs cached to find changes
  - Detect added, removed, and modified components
  - Track dependencies (if child changes, parent may need update)
- [ ] Unit tests:
  - Test: no changes → empty array
  - Test: one component changed → returns that component
  - Test: new component added → detected
  - Test: component removed → detected
  - Test: child changed → parent flagged for App.jsx update

#### Code Example
```typescript
interface ChangeDetectionResult {
  added: string[];      // Component IDs added
  modified: string[];   // Component IDs changed
  removed: string[];    // Component IDs removed
  appNeedsUpdate: boolean; // Root components changed
}

class ChangeDetector {
  private componentHashes: Map<string, string> = new Map();
  
  detectChanges(manifest: Manifest): ChangeDetectionResult {
    const result: ChangeDetectionResult = {
      added: [],
      modified: [],
      removed: [],
      appNeedsUpdate: false,
    };
    
    const currentIds = new Set(Object.keys(manifest.components));
    const cachedIds = new Set(this.componentHashes.keys());
    
    // Find added components
    for (const id of currentIds) {
      if (!cachedIds.has(id)) {
        result.added.push(id);
        // If root component, App.jsx needs update
        if (this.isRootComponent(id, manifest)) {
          result.appNeedsUpdate = true;
        }
      }
    }
    
    // Find removed components
    for (const id of cachedIds) {
      if (!currentIds.has(id)) {
        result.removed.push(id);
        result.appNeedsUpdate = true; // Root structure changed
      }
    }
    
    // Find modified components
    for (const id of currentIds) {
      if (cachedIds.has(id)) {
        const currentHash = this.hashComponent(manifest.components[id]);
        const cachedHash = this.componentHashes.get(id);
        if (currentHash !== cachedHash) {
          result.modified.push(id);
        }
      }
    }
    
    return result;
  }
  
  updateCache(manifest: Manifest): void {
    this.componentHashes.clear();
    for (const [id, component] of Object.entries(manifest.components)) {
      this.componentHashes.set(id, this.hashComponent(component));
    }
  }
  
  private hashComponent(component: Component): string {
    // Hash the component definition (excluding metadata.updatedAt)
    const hashable = { ...component };
    delete hashable.metadata?.updatedAt;
    return crypto.createHash('sha256')
      .update(JSON.stringify(hashable))
      .digest('hex');
  }
  
  private isRootComponent(id: string, manifest: Manifest): boolean {
    // Root components have no parent (not in any component's children array)
    for (const comp of Object.values(manifest.components)) {
      if (comp.children.includes(id)) {
        return false;
      }
    }
    return true;
  }
}
```

#### Human Checkpoint
None - low risk, proceed to Milestone 3

---

### Milestone 3: File Writer with Tracker Integration
**Duration:** 1 day  
**Confidence Target:** 8/10  
**Status:** 🔵 Not Started

#### Objective
Build the FileWriter class that safely writes files using FileChangeTracker.

#### Deliverables
- [ ] `src/core/filemanager/FileWriter.ts`:
  - Integration with FileChangeTracker (onBeforeGenerate/onAfterGenerate)
  - Atomic file writes (write to temp, then rename)
  - Directory creation if not exists
  - Error handling with tracker cleanup
  - Parallel writes with concurrency limit
  - Delete removed component files
- [ ] Unit tests:
  - Test: successful write with tracker calls
  - Test: write error still calls onAfterGenerate
  - Test: directory created if missing
  - Test: parallel writes don't conflict
  - Test: deleted components → files removed

#### Code Example
```typescript
class FileWriter {
  private fileChangeTracker: FileChangeTracker;
  private concurrencyLimit = 5;
  
  async writeFile(filepath: string, content: string): Promise<FileWriteResult> {
    // Ensure directory exists
    const dir = path.dirname(filepath);
    await fs.promises.mkdir(dir, { recursive: true });
    
    // CRITICAL: Call onBeforeGenerate BEFORE writing
    await this.fileChangeTracker.onBeforeGenerate(filepath, content);
    
    try {
      // Write to temp file first (atomic write)
      const tempPath = `${filepath}.tmp`;
      await fs.promises.writeFile(tempPath, content, 'utf-8');
      
      // Rename temp to actual file (atomic on most systems)
      await fs.promises.rename(tempPath, filepath);
      
      return { success: true, filepath };
    } catch (error) {
      return { 
        success: false, 
        filepath, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    } finally {
      // CRITICAL: Always call onAfterGenerate, even on error
      await this.fileChangeTracker.onAfterGenerate(filepath);
    }
  }
  
  async writeFiles(files: Array<{ filepath: string; content: string }>): Promise<FileWriteResult[]> {
    const results: FileWriteResult[] = [];
    
    // Process in batches to limit concurrency
    for (let i = 0; i < files.length; i += this.concurrencyLimit) {
      const batch = files.slice(i, i + this.concurrencyLimit);
      const batchResults = await Promise.all(
        batch.map(({ filepath, content }) => this.writeFile(filepath, content))
      );
      results.push(...batchResults);
    }
    
    return results;
  }
  
  async deleteFile(filepath: string): Promise<void> {
    try {
      await fs.promises.unlink(filepath);
    } catch (error) {
      // Ignore if file doesn't exist
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
        throw error;
      }
    }
  }
}
```

#### Risks
- Race conditions with concurrent writes
- Tracker state corruption on errors
- File system permissions issues

#### Human Checkpoint
**REQUIRED** - Review tracker integration before proceeding

---

### Milestone 4: App Generator
**Duration:** 0.5 day  
**Confidence Target:** 9/10  
**Status:** 🔵 Not Started

#### Objective
Build the AppGenerator class that generates App.jsx and main.jsx.

#### Deliverables
- [ ] `src/core/filemanager/AppGenerator.ts`:
  - Generate App.jsx with root component imports
  - Generate main.jsx entry point
  - Include @lowcode comment markers
  - Handle empty manifest (no components)
  - Prettier formatting
- [ ] Unit tests:
  - Test: App.jsx with multiple root components
  - Test: App.jsx with single root component
  - Test: App.jsx with no components (empty state)
  - Test: main.jsx is valid entry point
  - Test: comment markers present

#### Code Example
```typescript
class AppGenerator {
  generateAppJsx(manifest: Manifest): string {
    const rootComponents = this.findRootComponents(manifest);
    
    // Build imports
    const imports = rootComponents.map(comp => 
      `import { ${comp.displayName} } from './components/${comp.displayName}';`
    ).join('\n');
    
    // Build JSX
    const jsx = rootComponents.length > 0
      ? rootComponents.map(comp => `      <${comp.displayName} />`).join('\n')
      : '      {/* No components yet */}';
    
    const code = `import React from 'react';

/**
 * @lowcode:generated
 * @lowcode:level: 1
 * @lowcode:last-generated: ${new Date().toISOString()}
 * Main application component - imports all root-level components
 * DO NOT EDIT: This file is auto-generated. Changes will be overwritten.
 */
${imports}

export default function App() {
  return (
    <div className="app">
${jsx}
    </div>
  );
}
`;
    
    return prettier.format(code, { parser: 'babel', singleQuote: true });
  }
  
  generateMainJsx(): string {
    const code = `import React from 'react';
import ReactDOM from 'react-dom/client';

/**
 * @lowcode:generated
 * @lowcode:level: 1
 * @lowcode:last-generated: ${new Date().toISOString()}
 * Application entry point
 * DO NOT EDIT: This file is auto-generated. Changes will be overwritten.
 */
import App from './App';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
`;
    
    return prettier.format(code, { parser: 'babel', singleQuote: true });
  }
  
  private findRootComponents(manifest: Manifest): Component[] {
    // Root components are not children of any other component
    const childIds = new Set<string>();
    for (const comp of Object.values(manifest.components)) {
      comp.children.forEach(id => childIds.add(id));
    }
    
    return Object.values(manifest.components)
      .filter(comp => !childIds.has(comp.id))
      .sort((a, b) => a.displayName.localeCompare(b.displayName));
  }
}
```

#### Human Checkpoint
None - low risk, proceed to Milestone 5

---

### Milestone 5: File Manager Orchestrator
**Duration:** 1 day  
**Confidence Target:** 8/10  
**Status:** 🔵 Not Started

#### Objective
Build the main FileManager class that orchestrates all operations.

#### Deliverables
- [ ] `src/core/filemanager/FileManager.ts`:
  - Initialize with project path and options
  - Subscribe to manifest changes
  - Coordinate ChangeDetector, ReactCodeGenerator, FileWriter, AppGenerator
  - Emit events for progress/errors
  - Handle full regeneration and incremental updates
  - Track user-edited files
  - Provide manual regeneration API
- [ ] `src/core/filemanager/index.ts` - Module exports
- [ ] Integration tests:
  - Test: full generation from empty
  - Test: incremental update (one component changed)
  - Test: component added
  - Test: component removed
  - Test: user edit protection

#### Code Example
```typescript
class FileManager extends EventEmitter {
  private projectPath: string;
  private changeDetector: ChangeDetector;
  private codeGenerator: ReactCodeGenerator;
  private fileWriter: FileWriter;
  private appGenerator: AppGenerator;
  private fileChangeTracker: FileChangeTracker;
  private userEditedFiles: Set<string> = new Set();
  
  constructor(options: FileManagerOptions) {
    super();
    this.projectPath = options.projectPath;
    this.changeDetector = new ChangeDetector();
    this.codeGenerator = new ReactCodeGenerator();
    this.fileWriter = new FileWriter(options.fileChangeTracker);
    this.appGenerator = new AppGenerator();
    this.fileChangeTracker = options.fileChangeTracker;
  }
  
  /**
   * Generate all files from manifest (full regeneration)
   */
  async generateAll(manifest: Manifest): Promise<GenerationSummary> {
    const startTime = performance.now();
    this.emit('generation:start', { type: 'full' });
    
    // Generate all component code
    const codeResults = await this.codeGenerator.generateAll(manifest);
    
    // Write component files
    const componentFiles = codeResults.results
      .filter(r => r.success)
      .map(r => ({
        filepath: path.join(this.projectPath, 'src/components', r.filename),
        content: r.code,
      }));
    
    const writeResults = await this.fileWriter.writeFiles(componentFiles);
    
    // Generate and write App.jsx
    const appCode = await this.appGenerator.generateAppJsx(manifest);
    await this.fileWriter.writeFile(
      path.join(this.projectPath, 'src/App.jsx'),
      appCode
    );
    
    // Generate and write main.jsx
    const mainCode = await this.appGenerator.generateMainJsx();
    await this.fileWriter.writeFile(
      path.join(this.projectPath, 'src/main.jsx'),
      mainCode
    );
    
    // Update change detector cache
    this.changeDetector.updateCache(manifest);
    
    const duration = performance.now() - startTime;
    const summary: GenerationSummary = {
      type: 'full',
      totalComponents: Object.keys(manifest.components).length,
      filesWritten: writeResults.filter(r => r.success).length,
      errors: writeResults.filter(r => !r.success),
      durationMs: duration,
    };
    
    this.emit('generation:complete', summary);
    return summary;
  }
  
  /**
   * Incremental generation (only changed components)
   */
  async generateIncremental(manifest: Manifest): Promise<GenerationSummary> {
    const startTime = performance.now();
    const changes = this.changeDetector.detectChanges(manifest);
    
    // If nothing changed, skip
    if (changes.added.length === 0 && 
        changes.modified.length === 0 && 
        changes.removed.length === 0) {
      return {
        type: 'incremental',
        totalComponents: 0,
        filesWritten: 0,
        errors: [],
        durationMs: 0,
        skipped: true,
      };
    }
    
    this.emit('generation:start', { type: 'incremental', changes });
    
    // Generate code for added and modified components
    const toGenerate = [...changes.added, ...changes.modified];
    const componentFiles: Array<{ filepath: string; content: string }> = [];
    
    for (const id of toGenerate) {
      const component = manifest.components[id];
      const filepath = path.join(
        this.projectPath, 
        'src/components', 
        `${component.displayName}.jsx`
      );
      
      // Check for user edit conflict
      if (this.userEditedFiles.has(filepath)) {
        this.emit('user-edit-conflict', { filepath, componentId: id });
        continue; // Skip this file
      }
      
      const result = await this.codeGenerator.generateComponent(component, manifest);
      if (result.success) {
        componentFiles.push({ filepath, content: result.code });
      }
    }
    
    // Write component files
    const writeResults = await this.fileWriter.writeFiles(componentFiles);
    
    // Delete removed component files
    for (const id of changes.removed) {
      // We need to look up the old displayName - this is tricky
      // For now, emit event to handle externally
      this.emit('component:removed', { componentId: id });
    }
    
    // Regenerate App.jsx if root components changed
    if (changes.appNeedsUpdate) {
      const appCode = await this.appGenerator.generateAppJsx(manifest);
      await this.fileWriter.writeFile(
        path.join(this.projectPath, 'src/App.jsx'),
        appCode
      );
    }
    
    // Update cache
    this.changeDetector.updateCache(manifest);
    
    const duration = performance.now() - startTime;
    return {
      type: 'incremental',
      totalComponents: toGenerate.length,
      filesWritten: writeResults.filter(r => r.success).length,
      errors: writeResults.filter(r => !r.success),
      durationMs: duration,
    };
  }
  
  /**
   * Mark a file as user-edited (won't be overwritten)
   */
  markUserEdited(filepath: string): void {
    this.userEditedFiles.add(filepath);
    this.emit('user-edit:tracked', { filepath });
  }
  
  /**
   * Clear user edit flag (allow overwriting)
   */
  clearUserEdited(filepath: string): void {
    this.userEditedFiles.delete(filepath);
  }
  
  /**
   * Get list of user-edited files
   */
  getUserEditedFiles(): string[] {
    return Array.from(this.userEditedFiles);
  }
}
```

#### Risks
- Complex state management
- Event handling edge cases
- User edit tracking persistence

#### Human Checkpoint
**REQUIRED** - Review full integration before proceeding to testing

---

### Milestone 6: Comprehensive Testing
**Duration:** 0.5-1 day  
**Confidence Target:** 9/10  
**Status:** 🔵 Not Started

#### Objective
Write comprehensive tests and verify no infinite loops.

#### Deliverables
- [ ] All unit tests passing (>85% coverage)
- [ ] Integration tests:
  - Full generation creates correct files
  - Incremental generation only updates changed files
  - Deleted components → files removed
  - User edit protection works
  - No infinite loops (with file watcher enabled)
- [ ] Performance tests:
  - 50 components generates in <2s
  - 10 component incremental update <500ms

#### Critical Test: No Infinite Loops
```typescript
describe('FileManager infinite loop prevention', () => {
  it('should not trigger infinite loop when generating files', async () => {
    const fileManager = new FileManager({
      projectPath: testDir,
      fileChangeTracker: tracker,
    });
    
    // Set up file watcher that would trigger regeneration
    let regenerationCount = 0;
    const watcher = chokidar.watch(path.join(testDir, 'src'), {
      ignoreInitial: true,
    });
    
    watcher.on('all', async () => {
      regenerationCount++;
      // In a broken system, this would trigger infinite regeneration
    });
    
    // Generate all files
    await fileManager.generateAll(testManifest);
    
    // Wait for any potential cascading effects
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Should only have triggered once per file, not infinite times
    expect(regenerationCount).toBeLessThanOrEqual(Object.keys(testManifest.components).length + 2);
    
    watcher.close();
  });
});
```

#### Human Checkpoint
Review test coverage and run manual infinite loop test

---

### Milestone 7: Documentation & Final Polish
**Duration:** 0.5 day  
**Confidence Target:** 9/10  
**Status:** 🔵 Not Started

#### Objective
Finalize documentation and prepare for human review.

#### Deliverables
- [ ] Update this task document with actual results
- [ ] Code comments meet density standard (1 per 3-5 lines)
- [ ] All files have comprehensive headers
- [ ] README in src/core/filemanager/ explaining the module
- [ ] Update CLINE_IMPLEMENTATION_PLAN.md status

#### Human Checkpoint
**FINAL REVIEW** - Full code review before Task 3.2 sign-off

---

## 📊 Success Metrics

| Metric | Target | How to Verify |
|--------|--------|---------------|
| Files written correctly | 100% | All components exist in src/components/ |
| Tracker integration | 100% | onBeforeGenerate/onAfterGenerate called for every write |
| No infinite loops | 0 loops | Test with file watcher enabled |
| App.jsx correct | Valid | Imports all root components |
| Incremental works | Yes | Only changed files regenerated |
| User edit protection | Yes | Edited files not silently overwritten |
| Performance (full) | <2s for 50 components | Benchmark |
| Performance (incremental) | <500ms for 10 components | Benchmark |
| Test coverage | >85% | Coverage report |

---

## 🚨 Risk Assessment

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| Infinite loops | Critical | Medium | Tracker integration, comprehensive tests |
| Race conditions | High | Medium | Atomic writes, concurrency limits |
| User data loss | High | Low | User edit tracking, confirmation dialogs |
| Tracker state corruption | High | Low | Always call onAfterGenerate in finally block |
| Performance with large projects | Medium | Low | Parallel writes, incremental generation |
| File permission errors | Medium | Low | Graceful error handling, clear messages |

---

## ✅ Definition of Done

Task 3.2 is complete when:

1. [ ] All milestones (1-7) completed with confidence ≥8
2. [ ] Components written to src/components/{Name}.jsx
3. [ ] FileChangeTracker.onBeforeGenerate() called before every write
4. [ ] FileChangeTracker.onAfterGenerate() called after every write
5. [ ] App.jsx generated with root component imports
6. [ ] main.jsx generated as entry point
7. [ ] Incremental generation working
8. [ ] **NO INFINITE LOOPS** (critical)
9. [ ] User-edited files tracked and protected
10. [ ] Unit tests passing (>85% coverage)
11. [ ] Performance targets met
12. [ ] Human review approved
13. [ ] **GATE:** Ready for Task 3.3 (Live Preview)

---

## 👨‍💻 Human Review Checkpoints

### Checkpoint 1: After Milestone 3 (File Writer)
**Review Focus:**
- [ ] FileChangeTracker integration correct
- [ ] onBeforeGenerate/onAfterGenerate timing
- [ ] Error handling doesn't leave tracker in bad state

### Checkpoint 2: After Milestone 5 (FileManager)
**Review Focus:**
- [ ] Full generation works end-to-end
- [ ] Incremental generation works
- [ ] User edit protection logic

### Checkpoint 3: After Milestone 6 (Testing)
**Review Focus:**
- [ ] Infinite loop test passes
- [ ] All edge cases covered
- [ ] Performance targets met

### Final Review: After Milestone 7
**Review Focus:**
- [ ] Complete integration with Task 3.1
- [ ] Ready for Task 3.3 integration
- [ ] Documentation complete

---

## 🚀 Cline Prompt

Copy this prompt to start Task 3.2:

```
Implement file generation with FileChangeTracker integration.

## Context
You are implementing Task 3.2 of the Rise low-code builder. This task writes generated React code (from Task 3.1) to disk while integrating with FileChangeTracker (from Task 0.1) to prevent infinite loops.

## CRITICAL: FileChangeTracker Integration
Every file write MUST follow this pattern:

```typescript
// 1. BEFORE writing
await fileChangeTracker.onBeforeGenerate(filepath, content);

try {
  // 2. Write the file
  await fs.promises.writeFile(filepath, content);
} finally {
  // 3. AFTER writing (even on error!)
  await fileChangeTracker.onAfterGenerate(filepath);
}
```

**If you skip step 1 or 3, infinite loops WILL occur.**

## Requirements
1. Write components to src/components/{ComponentName}.jsx
2. Use FileChangeTracker.onBeforeGenerate() BEFORE every file write
3. Use FileChangeTracker.onAfterGenerate() AFTER every file write
4. Generate src/App.jsx (imports all root-level components)
5. Generate src/main.jsx (application entry point)
6. Update on manifest changes (subscribe to manifest store)
7. Incremental generation (only regenerate changed components)
8. Track user-edited files (don't silently overwrite)

## Architecture
Create these files:
- src/core/filemanager/types.ts - Type definitions
- src/core/filemanager/ChangeDetector.ts - Detect changed components
- src/core/filemanager/FileWriter.ts - Write files with tracker
- src/core/filemanager/AppGenerator.ts - Generate App.jsx and main.jsx
- src/core/filemanager/FileManager.ts - Main orchestrator
- src/core/filemanager/index.ts - Module exports

## References
Read these files FIRST:
- @src/core/FileChangeTracker.ts - CRITICAL: How to use the tracker
- @src/core/codegen/ReactCodeGenerator.ts - Code generation from Task 3.1
- @docs/FILE_STRUCTURE_SPEC.md - Output file structure
- @docs/PERFORMANCE.md - Incremental generation patterns

## Output Files

Components: src/components/{ComponentName}.jsx
App.jsx: src/App.jsx
main.jsx: src/main.jsx

All files must have @lowcode:generated comment markers.

## Success Criteria
- [ ] Files written to correct locations
- [ ] Hash tracker prevents infinite loops
- [ ] App.jsx imports all root components
- [ ] Incremental generation works
- [ ] User edits tracked and protected
- [ ] >85% test coverage

## Process
1. Read FileChangeTracker.ts to understand the API
2. Start with types.ts
3. Build ChangeDetector (detect what changed)
4. Build FileWriter (write with tracker integration)
5. Build AppGenerator (App.jsx and main.jsx)
6. Build FileManager (orchestrate everything)
7. Write comprehensive tests including infinite loop test
8. Document everything

State your approach and confidence (1-10) before starting each milestone.
If confidence <8, stop and ask for human review.

DO NOT BE LAZY. DO NOT OMIT CODE. Provide complete implementations.

## INFINITE LOOP TEST
Your implementation MUST pass this test:

```typescript
it('should not cause infinite loops', async () => {
  let fileChangeCount = 0;
  watcher.on('change', () => fileChangeCount++);
  
  await fileManager.generateAll(manifest);
  await sleep(500);
  
  // Should not trigger runaway file changes
  expect(fileChangeCount).toBeLessThan(100);
});
```

If this test fails, you have broken the integration. Fix it.
```

---

**Task Status:** 🔵 Ready to Start  
**Critical Path:** YES - Blocks Task 3.3 (Live Preview)  
**Risk Level:** HIGH - Infinite loop potential, file system operations  
**Next Task:** Task 3.3 - Live Preview with Vite

---

**Last Updated:** 2025-11-27  
**Document Version:** 1.0  
**Prepared By:** Claude (via Richard request)  
**Requires Sign-off:** Project Lead (Richard)
