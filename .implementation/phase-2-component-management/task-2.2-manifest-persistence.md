# Task 2.2: Manifest Persistence

**Phase:** Phase 2 - Component Management  
**Duration Estimate:** 2-3 days (split into 4 subtasks)  
**Actual Duration:** 1 day (2025-11-26)  
**Status:** ✅ COMPLETE (Tasks 2.2A-C)  
**Assigned:** AI (Cline) + Human Review  
**Priority:** P0 - Critical Path  
**Dependencies:** Task 2.1 ✅  
**Started:** 2025-11-26  
**Completed:** 2025-11-26

---

## 📋 Task Split Overview

This task is split into 4 subtasks:

| Subtask | Name | Duration | Status |
|---------|------|----------|--------|
| **2.2A** | Manifest IPC Handlers | 0.5 day | 🔵 Not Started |
| **2.2B** | Auto-Load on Project Open | 0.5 day | 🔵 Not Started |
| **2.2C** | Save Integration | 0.5 day | 🔵 Not Started |
| **2.2D** | Validation & Error UI | 0.5-1 day | 🔵 Not Started |

---

## 🎯 Task Overview

### Objective
Connect the manifestStore (built in Task 2.1) to the file system via IPC, enabling manifests to load when projects open and save when components change.

### Problem Statement
Task 2.1 built a fully functional in-memory manifest store with CRUD operations. However:
- Manifests don't load when projects open (store starts with `null`)
- Save operations log to console instead of writing to disk
- Changes are lost when the app closes
- No validation feedback when manifests have issues

### What Already Exists (from Task 2.1)

| Feature | Status | Location |
|---------|--------|----------|
| Zustand manifest store | ✅ Complete | `src/renderer/store/manifestStore.ts` |
| CRUD operations | ✅ Complete | add/update/delete/duplicate/move |
| Debounce logic (500ms) | ✅ Complete | `saveManifest()` has debounce |
| Basic validation | ✅ Complete | `validate()` method |
| Tree computation | ✅ Complete | `getComponentTree()` |
| Component types | ✅ Complete | `src/core/manifest/types.ts` |

### What This Task Adds

| Feature | Description |
|---------|-------------|
| `manifest:load` IPC | Read and parse `.lowcode/manifest.json` |
| `manifest:save` IPC | Validate and write manifest to disk |
| `manifest:exists` IPC | Quick check for manifest existence |
| Auto-load on project open | Trigger manifest load when project opens |
| Auto-clear on project close | Clear manifest when project closes |
| Missing manifest handling | Error with "Initialize" option |
| Validation error UI | Banner showing issues, blocking saves |
| Level 1 schema integration | Use `Level1SchemaValidator` from Phase 0 |

### Success Criteria
- [ ] Manifest loads automatically when project opens
- [ ] Manifest saves automatically when components change (debounced)
- [ ] Missing manifest shows helpful error with Initialize option
- [ ] Invalid manifest loads with warning banner
- [ ] Saves blocked when validation errors exist
- [ ] Level 1 schema validation integrated
- [ ] Error messages are user-friendly
- [ ] No data loss on app restart
- [ ] TypeScript strict mode passing
- [ ] Unit tests for IPC handlers
- [ ] Manual testing completed
- [ ] Human review approved

### References
- **Task 2.1** - manifestStore implementation
- **docs/COMPONENT_SCHEMA.md** - Manifest structure
- **docs/SCHEMA_LEVELS.md** - Level 1 boundaries
- **src/core/validation/** - Level1SchemaValidator from Phase 0
- **electron/ipc-handlers.ts** - Existing IPC patterns

### Dependencies
- ✅ Task 2.1: Component Tree UI (manifestStore exists)
- ✅ Task 0.3: Schema Level 1 Validator
- ⚠️ **BLOCKS:** Task 2.3 (Property Panel needs working persistence)
- ⚠️ **BLOCKS:** Task 2.4 (AI Generation needs to save results)

### Out of Scope (Future Tasks)
- ❌ Import from existing React projects → Post-MVP
- ❌ Schema migration between versions → Post-MVP
- ❌ Conflict resolution with code changes → Post-MVP
- ❌ Undo/redo → Post-MVP
- ❌ Backup/versioning → Post-MVP

---

## 🏗️ Architecture Overview

### Data Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                      Project Open Flow                          │
│                                                                  │
│  User clicks "Open Project"                                     │
│         │                                                        │
│         ▼                                                        │
│  ┌─────────────────┐     ┌─────────────────┐                   │
│  │  projectStore   │────▶│  project:open   │ (existing)        │
│  │  openProject()  │     │  IPC handler    │                   │
│  └────────┬────────┘     └─────────────────┘                   │
│           │                                                      │
│           │ on success                                          │
│           ▼                                                      │
│  ┌─────────────────┐     ┌─────────────────┐                   │
│  │ manifestStore   │────▶│  manifest:load  │ (NEW)             │
│  │ loadFromFile()  │     │  IPC handler    │                   │
│  └────────┬────────┘     └────────┬────────┘                   │
│           │                       │                              │
│           │              ┌────────┴────────┐                    │
│           │              │                 │                     │
│           │         [manifest.json    [no manifest]             │
│           │           exists]              │                     │
│           │              │                 ▼                     │
│           │              │         ┌─────────────────┐          │
│           │              │         │  Show error:    │          │
│           │              │         │  "Initialize?"  │          │
│           │              │         └─────────────────┘          │
│           │              ▼                                       │
│           │     ┌─────────────────┐                             │
│           │     │ Parse & Validate│                             │
│           │     │ Level 1 Schema  │                             │
│           │     └────────┬────────┘                             │
│           │              │                                       │
│           │     ┌────────┴────────┐                             │
│           │     │                 │                              │
│           │  [valid]        [has errors]                        │
│           │     │                 │                              │
│           │     ▼                 ▼                              │
│           │  Load into      Load into store                     │
│           │  store          + show error banner                 │
│           │                 + block saves                        │
│           │                                                      │
│           ▼                                                      │
│  ┌─────────────────┐                                            │
│  │  Component Tree │                                            │
│  │  renders        │                                            │
│  └─────────────────┘                                            │
└─────────────────────────────────────────────────────────────────┘
```

### Save Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                      Component Save Flow                         │
│                                                                  │
│  User adds/edits/deletes component                              │
│         │                                                        │
│         ▼                                                        │
│  ┌─────────────────┐                                            │
│  │ manifestStore   │                                            │
│  │ addComponent()  │                                            │
│  │ updateComponent │                                            │
│  │ deleteComponent │                                            │
│  └────────┬────────┘                                            │
│           │                                                      │
│           │ triggers                                             │
│           ▼                                                      │
│  ┌─────────────────┐     ┌─────────────────┐                   │
│  │ saveManifest()  │────▶│ Check validation│                   │
│  │ (debounced)     │     │ errors exist?   │                   │
│  └─────────────────┘     └────────┬────────┘                   │
│                                   │                              │
│                          ┌────────┴────────┐                    │
│                          │                 │                     │
│                     [no errors]      [has errors]               │
│                          │                 │                     │
│                          ▼                 ▼                     │
│                 ┌─────────────────┐  ┌─────────────────┐       │
│                 │  manifest:save  │  │  Skip save      │       │
│                 │  IPC handler    │  │  Show banner    │       │
│                 └────────┬────────┘  └─────────────────┘       │
│                          │                                       │
│                          ▼                                       │
│                 ┌─────────────────┐                             │
│                 │ Write to        │                             │
│                 │ .lowcode/       │                             │
│                 │ manifest.json   │                             │
│                 └─────────────────┘                             │
└─────────────────────────────────────────────────────────────────┘
```

### Validation Error States

```
┌─────────────────────────────────────────────────────────────────┐
│                    Validation State Machine                      │
│                                                                  │
│  ┌─────────┐      ┌─────────────┐      ┌─────────────┐         │
│  │  VALID  │◀────▶│  WARNINGS   │◀────▶│   ERRORS    │         │
│  └────┬────┘      └──────┬──────┘      └──────┬──────┘         │
│       │                  │                    │                  │
│       ▼                  ▼                    ▼                  │
│  ┌─────────┐      ┌─────────────┐      ┌─────────────┐         │
│  │ Saves   │      │ Saves OK    │      │ Saves       │         │
│  │ enabled │      │ Show banner │      │ BLOCKED     │         │
│  │ No UI   │      │ (yellow)    │      │ Show banner │         │
│  └─────────┘      └─────────────┘      │ (red)       │         │
│                                        └─────────────┘         │
└─────────────────────────────────────────────────────────────────┘

Validation Error Severities:
- WARNING: Minor issues (e.g., missing optional field, deprecated pattern)
  → Allow saves, show yellow banner
- ERROR: Major issues (e.g., invalid property type, circular reference)
  → Block saves, show red banner
```

---

## 🗺️ Implementation Roadmap

### Task 2.2A: Manifest IPC Handlers
**Duration:** 0.5 day  
**Confidence Target:** 9/10  
**Status:** 🔵 Not Started

#### Objective
Create IPC handlers for manifest file operations.

#### Files to Create

**`electron/manifest-handlers.ts`** (~250 lines)
```typescript
/**
 * @file manifest-handlers.ts
 * @description IPC handlers for manifest file operations
 * 
 * @architecture Phase 2, Task 2.2A - Manifest IPC Handlers
 * 
 * HANDLERS:
 * - manifest:load - Read and parse manifest.json
 * - manifest:save - Validate and write manifest.json
 * - manifest:exists - Check if manifest exists
 * - manifest:initialize - Create empty manifest
 * 
 * VALIDATION:
 * - Uses Level1SchemaValidator from Phase 0
 * - Returns validation errors with user-friendly messages
 * 
 * ERROR HANDLING:
 * - File not found → specific error code
 * - Parse error → specific error code
 * - Validation error → returns errors array
 * - Write error → specific error code
 */

import { ipcMain } from 'electron';
import * as fs from 'fs/promises';
import * as path from 'path';
import { Level1SchemaValidator } from '../src/core/validation/SchemaValidator';
import { createEmptyManifest } from '../src/core/manifest/types';

/**
 * Manifest IPC channel names
 */
export const ManifestChannels = {
  LOAD: 'manifest:load',
  SAVE: 'manifest:save',
  EXISTS: 'manifest:exists',
  INITIALIZE: 'manifest:initialize',
} as const;

/**
 * Result types for manifest operations
 */
export interface ManifestLoadResult {
  success: boolean;
  manifest?: Manifest;
  validationErrors?: ValidationError[];
  validationWarnings?: ValidationError[];
  error?: string;
  errorCode?: 'NOT_FOUND' | 'PARSE_ERROR' | 'READ_ERROR';
}

export interface ManifestSaveResult {
  success: boolean;
  error?: string;
  errorCode?: 'VALIDATION_FAILED' | 'WRITE_ERROR';
}

export interface ManifestExistsResult {
  exists: boolean;
  hasLowcodeFolder: boolean;
}

/**
 * Register all manifest IPC handlers
 */
export function registerManifestHandlers(): void {
  const validator = new Level1SchemaValidator();

  /**
   * Load manifest from project
   * 
   * Reads .lowcode/manifest.json, parses it, and validates against Level 1 schema.
   * Returns manifest even if validation errors exist (for error recovery).
   */
  ipcMain.handle(ManifestChannels.LOAD, async (_event, projectPath: string): Promise<ManifestLoadResult> => {
    console.log('[Manifest] Load requested for:', projectPath);
    
    const manifestPath = path.join(projectPath, '.lowcode', 'manifest.json');
    
    try {
      // Check if file exists
      try {
        await fs.access(manifestPath);
      } catch {
        return {
          success: false,
          error: 'Manifest file not found. This project may need to be initialized.',
          errorCode: 'NOT_FOUND',
        };
      }
      
      // Read file
      const content = await fs.readFile(manifestPath, 'utf-8');
      
      // Parse JSON
      let manifest;
      try {
        manifest = JSON.parse(content);
      } catch (parseError) {
        return {
          success: false,
          error: 'Manifest file is corrupted (invalid JSON).',
          errorCode: 'PARSE_ERROR',
        };
      }
      
      // Validate against Level 1 schema
      const validationResult = validator.validate(manifest);
      
      // Separate errors from warnings
      const errors = validationResult.errors.filter(e => e.severity === 'ERROR');
      const warnings = validationResult.errors.filter(e => e.severity === 'WARNING');
      
      return {
        success: true,
        manifest,
        validationErrors: errors.length > 0 ? errors : undefined,
        validationWarnings: warnings.length > 0 ? warnings : undefined,
      };
      
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('[Manifest] Load error:', message);
      return {
        success: false,
        error: `Failed to read manifest: ${message}`,
        errorCode: 'READ_ERROR',
      };
    }
  });

  /**
   * Save manifest to project
   * 
   * Validates manifest before saving. Rejects if validation errors exist.
   */
  ipcMain.handle(ManifestChannels.SAVE, async (_event, projectPath: string, manifest: Manifest): Promise<ManifestSaveResult> => {
    console.log('[Manifest] Save requested for:', projectPath);
    
    const manifestPath = path.join(projectPath, '.lowcode', 'manifest.json');
    
    try {
      // Validate before saving
      const validationResult = validator.validate(manifest);
      const errors = validationResult.errors.filter(e => e.severity === 'ERROR');
      
      if (errors.length > 0) {
        return {
          success: false,
          error: `Cannot save: ${errors.length} validation error(s)`,
          errorCode: 'VALIDATION_FAILED',
        };
      }
      
      // Update modifiedAt timestamp
      manifest.metadata.modifiedAt = new Date().toISOString();
      
      // Write file with pretty formatting
      const content = JSON.stringify(manifest, null, 2);
      await fs.writeFile(manifestPath, content, 'utf-8');
      
      console.log('[Manifest] Saved successfully');
      return { success: true };
      
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('[Manifest] Save error:', message);
      return {
        success: false,
        error: `Failed to save manifest: ${message}`,
        errorCode: 'WRITE_ERROR',
      };
    }
  });

  /**
   * Check if manifest exists
   * 
   * Quick check without reading/parsing the file.
   */
  ipcMain.handle(ManifestChannels.EXISTS, async (_event, projectPath: string): Promise<ManifestExistsResult> => {
    const lowcodePath = path.join(projectPath, '.lowcode');
    const manifestPath = path.join(lowcodePath, 'manifest.json');
    
    let hasLowcodeFolder = false;
    let exists = false;
    
    try {
      await fs.access(lowcodePath);
      hasLowcodeFolder = true;
      
      await fs.access(manifestPath);
      exists = true;
    } catch {
      // File or folder doesn't exist
    }
    
    return { exists, hasLowcodeFolder };
  });

  /**
   * Initialize empty manifest for project
   * 
   * Creates .lowcode folder if needed and writes empty manifest.
   */
  ipcMain.handle(ManifestChannels.INITIALIZE, async (_event, projectPath: string, projectName: string): Promise<ManifestSaveResult> => {
    console.log('[Manifest] Initialize requested for:', projectPath);
    
    const lowcodePath = path.join(projectPath, '.lowcode');
    const manifestPath = path.join(lowcodePath, 'manifest.json');
    
    try {
      // Create .lowcode folder if it doesn't exist
      await fs.mkdir(lowcodePath, { recursive: true });
      
      // Create empty manifest
      const manifest = createEmptyManifest(projectName);
      
      // Write file
      const content = JSON.stringify(manifest, null, 2);
      await fs.writeFile(manifestPath, content, 'utf-8');
      
      console.log('[Manifest] Initialized successfully');
      return { success: true };
      
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('[Manifest] Initialize error:', message);
      return {
        success: false,
        error: `Failed to initialize manifest: ${message}`,
        errorCode: 'WRITE_ERROR',
      };
    }
  });
}
```

#### Files to Modify

**`electron/ipc-handlers.ts`** (+5 lines)
```typescript
// Add import and registration
import { registerManifestHandlers } from './manifest-handlers';

// In registerAllHandlers():
registerManifestHandlers();
```

**`electron/preload.ts`** (+40 lines)
```typescript
// Add manifest API to exposed interface
manifest: {
  load: (projectPath: string) => ipcRenderer.invoke('manifest:load', projectPath),
  save: (projectPath: string, manifest: Manifest) => ipcRenderer.invoke('manifest:save', projectPath, manifest),
  exists: (projectPath: string) => ipcRenderer.invoke('manifest:exists', projectPath),
  initialize: (projectPath: string, projectName: string) => ipcRenderer.invoke('manifest:initialize', projectPath, projectName),
},
```

**`src/renderer/types/electron.d.ts`** (+20 lines)
```typescript
// Add type definitions for manifest API
manifest: {
  load: (projectPath: string) => Promise<ManifestLoadResult>;
  save: (projectPath: string, manifest: Manifest) => Promise<ManifestSaveResult>;
  exists: (projectPath: string) => Promise<ManifestExistsResult>;
  initialize: (projectPath: string, projectName: string) => Promise<ManifestSaveResult>;
};
```

#### Validation Criteria (2.2A)
- [ ] `manifest:load` reads and parses manifest.json
- [ ] `manifest:load` returns validation errors/warnings separately
- [ ] `manifest:load` handles missing file gracefully
- [ ] `manifest:load` handles corrupted JSON gracefully
- [ ] `manifest:save` validates before writing
- [ ] `manifest:save` rejects if validation errors exist
- [ ] `manifest:save` updates modifiedAt timestamp
- [ ] `manifest:exists` returns correct status
- [ ] `manifest:initialize` creates .lowcode folder
- [ ] `manifest:initialize` creates valid empty manifest
- [ ] All handlers have proper error logging
- [ ] TypeScript types exported for renderer

---

### Task 2.2B: Auto-Load on Project Open
**Duration:** 0.5 day  
**Confidence Target:** 9/10  
**Status:** 🔵 Not Started

#### Objective
Automatically load the manifest when a project opens, and clear it when the project closes.

#### Files to Modify

**`src/renderer/store/manifestStore.ts`** (~+80 lines)
```typescript
/**
 * Add new actions for file-based operations
 */

// New state fields
validationErrors: ValidationError[];
validationWarnings: ValidationError[];
saveBlocked: boolean;  // True when errors exist

// New actions
loadFromFile: async (projectPath: string) => Promise<void>;
saveToFile: async () => Promise<void>;
initializeManifest: async (projectPath: string, projectName: string) => Promise<void>;
clearManifest: () => void;

/**
 * Load manifest from file via IPC
 * 
 * Called automatically when project opens.
 * Handles missing manifest, validation errors, etc.
 */
loadFromFile: async (projectPath: string) => {
  set((state) => {
    state.isLoading = true;
    state.error = null;
    state.validationErrors = [];
    state.validationWarnings = [];
  });
  
  try {
    const result = await window.electronAPI.manifest.load(projectPath);
    
    if (!result.success) {
      set((state) => {
        state.isLoading = false;
        state.error = result.error || 'Failed to load manifest';
        state.errorCode = result.errorCode;
      });
      return;
    }
    
    set((state) => {
      state.manifest = result.manifest;
      state.isLoading = false;
      state.validationErrors = result.validationErrors || [];
      state.validationWarnings = result.validationWarnings || [];
      state.saveBlocked = (result.validationErrors?.length || 0) > 0;
      state.selectedComponentId = null;
      state.expandedComponentIds = new Set();
    });
    
  } catch (error) {
    set((state) => {
      state.isLoading = false;
      state.error = error instanceof Error ? error.message : 'Unknown error';
    });
  }
};

/**
 * Clear manifest state
 * 
 * Called when project closes.
 */
clearManifest: () => {
  set((state) => {
    state.manifest = null;
    state.selectedComponentId = null;
    state.expandedComponentIds = new Set();
    state.validationErrors = [];
    state.validationWarnings = [];
    state.saveBlocked = false;
    state.error = null;
  });
};
```

**`src/renderer/store/projectStore.ts`** (~+30 lines)
```typescript
// Import manifestStore
import { useManifestStore } from './manifestStore';

// In openProject action, after successful project open:
openProject: async (projectPath: string) => {
  // ... existing code ...
  
  if (result.success) {
    // Existing: set current project
    set({ currentProject: result.project });
    
    // NEW: Load manifest
    await useManifestStore.getState().loadFromFile(projectPath);
  }
  
  return result;
};

// In closeProject action:
closeProject: () => {
  // NEW: Clear manifest first
  useManifestStore.getState().clearManifest();
  
  // Existing: clear project
  set({ currentProject: null });
};
```

#### New Component: Missing Manifest Dialog

**`src/renderer/components/MissingManifestDialog.tsx`** (~150 lines)
```typescript
/**
 * @file MissingManifestDialog.tsx
 * @description Dialog shown when project has no manifest.json
 * 
 * OPTIONS:
 * - Initialize: Create empty manifest
 * - Cancel: Close project
 * 
 * FUTURE:
 * - Import: Analyze existing React code (post-MVP)
 */

interface MissingManifestDialogProps {
  projectPath: string;
  projectName: string;
  errorCode: 'NOT_FOUND' | 'PARSE_ERROR';
  onInitialize: () => void;
  onCancel: () => void;
}

export function MissingManifestDialog({
  projectPath,
  projectName,
  errorCode,
  onInitialize,
  onCancel,
}: MissingManifestDialogProps) {
  const [isInitializing, setIsInitializing] = useState(false);
  
  const handleInitialize = async () => {
    setIsInitializing(true);
    try {
      await window.electronAPI.manifest.initialize(projectPath, projectName);
      await useManifestStore.getState().loadFromFile(projectPath);
      onInitialize();
    } catch (error) {
      // Show error toast
    } finally {
      setIsInitializing(false);
    }
  };
  
  return (
    <Modal isOpen onClose={onCancel}>
      <div className="p-6 max-w-md">
        <div className="flex items-center gap-3 mb-4">
          <ExclamationTriangleIcon className="w-8 h-8 text-yellow-500" />
          <h2 className="text-lg font-semibold">
            {errorCode === 'NOT_FOUND' ? 'Manifest Not Found' : 'Manifest Corrupted'}
          </h2>
        </div>
        
        <p className="text-gray-600 mb-4">
          {errorCode === 'NOT_FOUND' 
            ? "This project doesn't have a Rise manifest file."
            : "The manifest file is corrupted and cannot be read."}
        </p>
        
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <p className="text-sm text-gray-500 mb-2">Options:</p>
          <ul className="text-sm space-y-1">
            <li>• <strong>Initialize</strong> - Create a new empty manifest</li>
            <li className="text-gray-400">• Import from code - Coming in a future release</li>
          </ul>
        </div>
        
        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded"
          >
            Cancel
          </button>
          <button
            onClick={handleInitialize}
            disabled={isInitializing}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
          >
            {isInitializing ? 'Initializing...' : 'Initialize Manifest'}
          </button>
        </div>
      </div>
    </Modal>
  );
}
```

#### Validation Criteria (2.2B)
- [ ] Manifest loads automatically when project opens
- [ ] Manifest clears when project closes
- [ ] Missing manifest shows dialog with Initialize option
- [ ] Corrupted manifest shows dialog with Initialize option
- [ ] Initialize creates valid empty manifest
- [ ] After initialize, manifest loads successfully
- [ ] Loading state shows while manifest loads
- [ ] Error state handled gracefully

---

### Task 2.2C: Save Integration
**Duration:** 0.5 day  
**Confidence Target:** 9/10  
**Status:** 🔵 Not Started

#### Objective
Connect the existing debounced save logic to the IPC handler.

#### Files to Modify

**`src/renderer/store/manifestStore.ts`** (~+50 lines)
```typescript
/**
 * Replace the existing saveManifest with IPC-connected version
 */

saveToFile: async () => {
  const state = get();
  
  // Don't save if no manifest or saves are blocked
  if (!state.manifest) {
    console.warn('[ManifestStore] No manifest to save');
    return;
  }
  
  if (state.saveBlocked) {
    console.warn('[ManifestStore] Saves blocked due to validation errors');
    return;
  }
  
  // Get current project path
  const currentProject = useProjectStore.getState().currentProject;
  if (!currentProject) {
    console.warn('[ManifestStore] No project open');
    return;
  }
  
  try {
    const result = await window.electronAPI.manifest.save(
      currentProject.path,
      state.manifest
    );
    
    if (!result.success) {
      console.error('[ManifestStore] Save failed:', result.error);
      // Could show toast notification here
      return;
    }
    
    console.log('[ManifestStore] Saved successfully');
    
  } catch (error) {
    console.error('[ManifestStore] Save error:', error);
  }
};

/**
 * Update the debounced save trigger
 * 
 * Called after any mutation (add, update, delete, etc.)
 */
triggerSave: () => {
  if (saveTimeout) {
    clearTimeout(saveTimeout);
  }
  
  saveTimeout = setTimeout(() => {
    get().saveToFile();
  }, SAVE_DEBOUNCE_MS);
};

// Update all mutation actions to call triggerSave():
addComponent: (options) => {
  // ... existing logic ...
  get().triggerSave();
};

updateComponent: (id, updates) => {
  // ... existing logic ...
  get().triggerSave();
};

deleteComponent: (id) => {
  // ... existing logic ...
  get().triggerSave();
};

// etc. for duplicateComponent, moveComponent
```

#### Optional: Save Indicator UI

**`src/renderer/components/SaveIndicator.tsx`** (~60 lines)
```typescript
/**
 * @file SaveIndicator.tsx
 * @description Small indicator showing save status
 * 
 * States:
 * - Hidden: No changes
 * - Saving: Debounce in progress
 * - Saved: Just saved (shows briefly)
 * - Blocked: Validation errors prevent save
 */
```

This could appear in the status bar or near the component tree header.

#### Validation Criteria (2.2C)
- [ ] Component changes trigger debounced save
- [ ] Save calls IPC handler with manifest data
- [ ] Save blocked when validation errors exist
- [ ] Console logs confirm save success/failure
- [ ] Multiple rapid changes only trigger one save
- [ ] Save completes before app quit (optional)

---

### Task 2.2D: Validation & Error UI
**Duration:** 0.5-1 day  
**Confidence Target:** 8/10  
**Status:** 🔵 Not Started

#### Objective
Show validation errors/warnings to users and block saves when errors exist.

#### Files to Create

**`src/renderer/components/ValidationBanner.tsx`** (~180 lines)
```typescript
/**
 * @file ValidationBanner.tsx
 * @description Banner showing manifest validation issues
 * 
 * LAYOUT:
 * ┌─────────────────────────────────────────────────────────────┐
 * │ ⚠️ 2 validation issues                              [Hide] │
 * │                                                             │
 * │ • comp_button_1: Property "onClick" is not allowed in      │
 * │   Level 1. Event handlers available in Level 2.            │
 * │                                                             │
 * │ • comp_card: Exceeds maximum depth (6 levels, max is 5)    │
 * │                                                             │
 * │ Fix these issues to enable saving.                         │
 * └─────────────────────────────────────────────────────────────┘
 * 
 * VARIANTS:
 * - Error (red): Blocks saves
 * - Warning (yellow): Allows saves but shows notice
 */

import React, { useState } from 'react';
import { 
  ExclamationTriangleIcon, 
  ExclamationCircleIcon,
  XMarkIcon,
  ChevronDownIcon,
  ChevronUpIcon,
} from '@heroicons/react/24/outline';
import { useManifestStore } from '../../store/manifestStore';
import type { ValidationError } from '../../../core/validation/types';

export function ValidationBanner() {
  const { validationErrors, validationWarnings, saveBlocked } = useManifestStore();
  const [isExpanded, setIsExpanded] = useState(true);
  const [isDismissed, setIsDismissed] = useState(false);
  
  const hasErrors = validationErrors.length > 0;
  const hasWarnings = validationWarnings.length > 0;
  
  // Don't show if no issues or dismissed (warnings only)
  if ((!hasErrors && !hasWarnings) || (isDismissed && !hasErrors)) {
    return null;
  }
  
  const issues = hasErrors ? validationErrors : validationWarnings;
  const isError = hasErrors;
  
  return (
    <div className={`
      border-l-4 p-3 mb-3 rounded-r
      ${isError 
        ? 'bg-red-50 border-red-500' 
        : 'bg-yellow-50 border-yellow-500'}
    `}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {isError 
            ? <ExclamationCircleIcon className="w-5 h-5 text-red-500" />
            : <ExclamationTriangleIcon className="w-5 h-5 text-yellow-500" />
          }
          <span className={`font-medium ${isError ? 'text-red-700' : 'text-yellow-700'}`}>
            {issues.length} validation {issues.length === 1 ? 'issue' : 'issues'}
          </span>
          {saveBlocked && (
            <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded">
              Saves blocked
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-1">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 hover:bg-black/5 rounded"
          >
            {isExpanded 
              ? <ChevronUpIcon className="w-4 h-4" />
              : <ChevronDownIcon className="w-4 h-4" />
            }
          </button>
          {!isError && (
            <button
              onClick={() => setIsDismissed(true)}
              className="p-1 hover:bg-black/5 rounded"
            >
              <XMarkIcon className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
      
      {/* Error list */}
      {isExpanded && (
        <ul className="mt-2 space-y-1">
          {issues.map((error, index) => (
            <ValidationErrorItem key={index} error={error} />
          ))}
        </ul>
      )}
      
      {/* Footer message */}
      {isError && isExpanded && (
        <p className="mt-2 text-sm text-red-600">
          Fix these issues to enable saving.
        </p>
      )}
    </div>
  );
}

function ValidationErrorItem({ error }: { error: ValidationError }) {
  return (
    <li className="text-sm text-gray-700 flex items-start gap-2">
      <span className="text-gray-400">•</span>
      <div>
        {error.path && (
          <span className="font-mono text-xs bg-gray-100 px-1 rounded mr-1">
            {error.path}
          </span>
        )}
        {error.message}
        {error.suggestion && (
          <span className="text-gray-500 ml-1">
            ({error.suggestion})
          </span>
        )}
      </div>
    </li>
  );
}
```

#### Files to Modify

**`src/renderer/components/NavigatorPanel.tsx`** (~+10 lines)
```typescript
// Add ValidationBanner above the tab content
import { ValidationBanner } from './ValidationBanner';

// In the Components tab section:
{activeTab === 'components' && (
  <>
    <ValidationBanner />
    <ComponentTree ... />
  </>
)}
```

#### User-Friendly Error Messages

Create a mapping from technical error codes to friendly messages:

**`src/renderer/utils/validationMessages.ts`** (~100 lines)
```typescript
/**
 * @file validationMessages.ts
 * @description User-friendly messages for validation errors
 */

export function getErrorMessage(error: ValidationError): string {
  // Map error codes to friendly messages
  const messages: Record<string, string> = {
    'BLOCKED_PROPERTY_TYPE': 
      `Property type "${error.details?.type}" is not available in Level 1. ` +
      `This feature is coming in Level 2 (post-MVP).`,
    
    'MAX_DEPTH_EXCEEDED':
      `Component is nested too deeply (${error.details?.depth} levels, max is 5). ` +
      `Try restructuring to reduce nesting.`,
    
    'CIRCULAR_REFERENCE':
      `Circular reference detected. A component cannot be its own ancestor.`,
    
    'INVALID_COMPONENT_ID':
      `Component ID "${error.details?.id}" is invalid. ` +
      `IDs must match pattern: comp_[alphanumeric]`,
    
    'MISSING_REQUIRED_FIELD':
      `Required field "${error.details?.field}" is missing.`,
    
    // ... more mappings
  };
  
  return messages[error.code] || error.message;
}

export function getSuggestion(error: ValidationError): string | undefined {
  const suggestions: Record<string, string> = {
    'BLOCKED_PROPERTY_TYPE': 
      'Remove the property or use a static value instead.',
    
    'MAX_DEPTH_EXCEEDED':
      'Move some components to a higher level or create separate component files.',
    
    // ... more suggestions
  };
  
  return suggestions[error.code];
}
```

#### Validation Criteria (2.2D)
- [ ] ValidationBanner shows when errors exist
- [ ] Banner is red for errors, yellow for warnings
- [ ] "Saves blocked" badge shows when appropriate
- [ ] Error list is expandable/collapsible
- [ ] Warnings can be dismissed
- [ ] Errors cannot be dismissed
- [ ] Error messages are user-friendly
- [ ] Suggestions help users fix issues
- [ ] Banner appears in Navigator panel
- [ ] Banner updates when errors are fixed

---

## 📁 Deliverables Summary

### New Files (4)

1. `electron/manifest-handlers.ts` (~250 lines)
2. `src/renderer/components/MissingManifestDialog.tsx` (~150 lines)
3. `src/renderer/components/ValidationBanner.tsx` (~180 lines)
4. `src/renderer/utils/validationMessages.ts` (~100 lines)

### Modified Files (5)

1. `electron/ipc-handlers.ts` (+5 lines)
2. `electron/preload.ts` (+40 lines)
3. `src/renderer/types/electron.d.ts` (+20 lines)
4. `src/renderer/store/manifestStore.ts` (~+130 lines)
5. `src/renderer/store/projectStore.ts` (~+30 lines)
6. `src/renderer/components/NavigatorPanel.tsx` (~+10 lines)

### Estimated Total
- **New Code:** ~680 lines
- **Modified Code:** ~235 lines
- **Grand Total:** ~915 lines

---

## ⚡ Performance Requirements

| Metric | Target | Measurement |
|--------|--------|-------------|
| Manifest load | < 100ms | From IPC call to store updated |
| Manifest save | < 100ms | From IPC call to file written |
| Validation | < 50ms | For manifests with 100 components |
| Debounce delay | 500ms | Between last change and save |
| Banner render | < 16ms | Single frame |

---

## 🔒 Security Considerations

### Path Validation
- All file paths validated before operations
- Prevent path traversal attacks (../)
- Only access files within project directory

### JSON Parsing
- Handle malformed JSON gracefully
- Don't expose raw error messages to UI
- Log detailed errors for debugging

### Validation
- Never save invalid manifests
- Level 1 boundaries enforced
- Reject Level 2/3 features

---

## 🚨 Risk Assessment

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| Data loss on save failure | HIGH | LOW | Validate before save, error handling |
| Validation false positives | MEDIUM | LOW | Thorough testing, clear messages |
| Race conditions (load/save) | MEDIUM | LOW | Debouncing, sequential operations |
| Large manifest performance | LOW | LOW | Async operations, progress feedback |
| Cross-platform path issues | MEDIUM | MEDIUM | Use path.join, test on all platforms |

---

## 👨‍💻 Human Checkpoints

### Checkpoint 1: After Task 2.2A (IPC Handlers)
**Review Focus:**
- [ ] IPC handler patterns match existing code
- [ ] Error handling comprehensive
- [ ] Type definitions complete

### Checkpoint 2: After Task 2.2D (Complete)
**Review Focus:**
- [ ] End-to-end flow works
- [ ] Error messages helpful
- [ ] No data loss scenarios
- [ ] Ready for Task 2.3

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

Task 2.2 is complete when:

1. [ ] All subtasks (2.2A-D) completed
2. [ ] Manifest loads automatically on project open
3. [ ] Manifest saves automatically on changes (debounced)
4. [ ] Missing manifest handled with Initialize option
5. [ ] Validation errors shown in banner
6. [ ] Saves blocked when errors exist
7. [ ] Level 1 schema validation integrated
8. [ ] No data loss on app restart
9. [ ] TypeScript strict mode passing
10. [ ] Manual testing completed
11. [ ] Human review approved
12. [ ] **GATE:** Ready for Task 2.3 (Property Panel)

---

## 📝 Cline Prompt for Task 2.2A

```
Implement Manifest IPC Handlers for Rise's manifest persistence system.

## Context
- Rise is a visual React application builder
- Task 2.1 built manifestStore with in-memory CRUD operations
- Task 2.2 adds file persistence via IPC
- This is Task 2.2A - creating the IPC handlers

## Requirements

### Create electron/manifest-handlers.ts

IPC Handlers to implement:

1. **manifest:load** (projectPath: string)
   - Read .lowcode/manifest.json
   - Parse JSON (handle parse errors)
   - Validate with Level1SchemaValidator from src/core/validation/SchemaValidator.ts
   - Return: { success, manifest?, validationErrors?, validationWarnings?, error?, errorCode? }
   - Error codes: NOT_FOUND, PARSE_ERROR, READ_ERROR

2. **manifest:save** (projectPath: string, manifest: Manifest)
   - Validate manifest before saving (reject if errors)
   - Update metadata.modifiedAt timestamp
   - Write to .lowcode/manifest.json with pretty formatting
   - Return: { success, error?, errorCode? }
   - Error codes: VALIDATION_FAILED, WRITE_ERROR

3. **manifest:exists** (projectPath: string)
   - Quick check without reading file
   - Return: { exists: boolean, hasLowcodeFolder: boolean }

4. **manifest:initialize** (projectPath: string, projectName: string)
   - Create .lowcode folder if needed
   - Create empty manifest using createEmptyManifest() from src/core/manifest/types.ts
   - Write manifest.json
   - Return: { success, error?, errorCode? }

### Modify electron/ipc-handlers.ts
- Import and call registerManifestHandlers()

### Modify electron/preload.ts
- Add manifest API:
  - load(projectPath)
  - save(projectPath, manifest)
  - exists(projectPath)
  - initialize(projectPath, projectName)

### Add types to src/renderer/types/electron.d.ts
- ManifestLoadResult
- ManifestSaveResult
- ManifestExistsResult

## Validation
- Use Level1SchemaValidator from Phase 0
- Separate ERROR severity (blocks saves) from WARNING severity (allows saves)
- Return user-friendly error messages

## References
- @electron/ipc-handlers.ts - Existing IPC patterns
- @electron/preload.ts - Existing preload patterns
- @src/core/validation/SchemaValidator.ts - Level 1 validator
- @src/core/manifest/types.ts - Manifest types and createEmptyManifest

## Success Criteria
- [ ] All 4 IPC handlers implemented
- [ ] Validation integrated correctly
- [ ] Error handling comprehensive
- [ ] Types exported for renderer
- [ ] Console logging for debugging
- [ ] TypeScript strict mode passes

State your approach and confidence level (1-10) before implementing.
```

---

**Task Status:** 🔵 Not Started  
**Critical Path:** YES - Blocks Tasks 2.3, 2.4 and all of Phase 3  
**Risk Level:** LOW - Clear scope, existing patterns to follow  
**Next Task:** Task 2.3 - Property Panel

---

**Last Updated:** 2025-11-26  
**Document Version:** 1.0  
**Prepared By:** Claude (Planning Assistant)  
**Requires Sign-off:** Project Lead (Richard)
