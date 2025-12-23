# Catalyst Status Report - December 22, 2025

**Status**: 🟡 Partially Functional - Critical Issues Present  
**Last Updated**: 2025-12-22  
**Phase**: 2.5 - Developer Experience & Local Execution

---

## Executive Summary

Catalyst has made significant progress but is currently blocked by architectural issues in the execution system. The core workflow visual editor, code generation, and LLM integration nodes all work correctly. However, the execution logging and history system has fundamental flaws that cause:

1. **Infinite query loops** when viewing execution history
2. **Cross-project execution pollution** - executions from all projects appear in all projects
3. **No project isolation** in the SQLite execution database

These issues stem from architectural decisions made early in Phase 2.5 that didn't account for multi-project support.

---

## What's Working ✅

### Core Editor
- ✅ **Visual workflow canvas** - Drag, drop, connect nodes
- ✅ **Node library** - HTTP endpoint, LLM nodes (Anthropic, OpenAI, Groq), prompt templates, router
- ✅ **Properties panel** - Configure node settings with dynamic forms
- ✅ **Node pinning** - Pin test data for debugging
- ✅ **Request simulator** - Test HTTP triggers with mock requests
- ✅ **Manifest persistence** - Workflows save to `.lowcode/manifest.json`

### Code Generation
- ✅ **Python code generation** - Converts workflows to FastAPI applications
- ✅ **Streaming support** - LLM nodes generate streaming-compatible Python code
- ✅ **HTTP endpoint triggers** - Generates FastAPI route handlers
- ✅ **LLM node implementations** - All providers (Anthropic, OpenAI, Groq) working
- ✅ **Prompt templates** - Variable substitution in prompts
- ✅ **Router node** - Conditional branching based on content

### Python Environment
- ✅ **Python detection** - Finds Python 3.11+ on system
- ✅ **Dependency validation** - Checks for required packages
- ✅ **Auto-install** - Automatically installs missing packages from requirements.txt
- ✅ **Version checking** - Validates Python version meets minimum requirements

### Workflow Execution (Partially)
- ✅ **Subprocess spawning** - Python workflows execute in isolated process
- ✅ **Trigger data passing** - Request data passed via stdin
- ✅ **Output capture** - stdout/stderr captured from Python process
- ✅ **Error handling** - Python exceptions captured and displayed

---

## What's Broken 🔴

### 1. Infinite Query Loop (Critical)

**Symptom:**
```
[ExecutionHandlers] Querying executions: { workflowId: 'New Workflow', ... }
[ExecutionHandlers] Querying executions: { workflowId: 'New Workflow', ... }
[ExecutionHandlers] Querying executions: { workflowId: 'New Workflow', ... }
... (repeats infinitely)
```

**Root Cause:**
The `useAutoRefresh` hook in `ExecutionHistoryPanel` creates a query → state update → re-render → query cycle:

```typescript
// src/renderer/components/ExecutionHistory/hooks/useAutoRefresh.ts
const { data: executions } = useQuery({
  queryKey: ['executions', workflowId],
  queryFn: () => window.api.execution.query({ workflowId, limit: 100 }),
  refetchInterval: isAutoRefreshEnabled ? 3000 : false, // Queries every 3s
});
```

When React Query updates the data, it triggers a re-render, which somehow re-triggers the query immediately instead of waiting 3 seconds. This creates an infinite loop.

**Impact:**
- App becomes unusable within seconds
- Main process logs spam infinitely
- High CPU usage
- Must force quit the app

**Quick Fix:**
Disable auto-refresh in `useAutoRefresh.ts`:
```typescript
refetchInterval: false, // Disabled until we fix the loop
```

**Proper Solution:**
1. Add request deduplication
2. Use `staleTime` to prevent immediate re-fetches
3. Debounce state updates
4. Add max concurrent query limit

---

### 2. Cross-Project Execution Pollution (Critical)

**Symptom:**
When you create a new project, execution history from previous projects still appears.

**Root Cause:**
`ExecutionLogger` stores ALL executions in a global SQLite database (`userData/executions.db`) without project isolation:

```typescript
// electron/execution-logger.ts
export class ExecutionLogger {
  private db: Database;
  
  constructor() {
    const userDataPath = app.getPath('userData');
    const dbPath = path.join(userDataPath, 'executions.db'); // Global DB!
    this.db = new Database(dbPath);
    this.initializeDatabase();
  }
  
  public queryExecutions(filters: ExecutionQuery): WorkflowExecution[] {
    // Only filters by workflowId, not by project
    if (filters.workflowId) {
      query += ' AND workflow_id = ?';
      params.push(filters.workflowId);
    }
  }
}
```

The database schema doesn't include a `project_id` column:
```sql
CREATE TABLE IF NOT EXISTS executions (
  id TEXT PRIMARY KEY,
  workflow_id TEXT NOT NULL,
  workflow_name TEXT NOT NULL,
  -- NO project_id column!
  ...
)
```

**Impact:**
- Projects are not isolated
- Creating a new project shows old execution data
- No way to filter executions by project
- Confusing UX - "New Workflow" shows executions from a completely different project

**Quick Fix:**
None without schema migration. Best option is to delete the database file:
```bash
rm ~/Library/Application\ Support/Catalyst/executions.db
```

**Proper Solution:**
1. Add `project_path` column to executions table
2. Update `ExecutionLogger.logExecution()` to include project path
3. Update query methods to filter by project
4. Create migration system for database schema changes
5. Consider per-project SQLite databases instead of global

---

### 3. Unspecified Workflow Error

**Status:** Need more information

**What we know:**
- User mentioned "There's an error in the workflow"
- No stack trace or error message provided
- Could be related to:
  - Python execution failing
  - Code generation issue
  - Missing dependencies
  - Invalid workflow configuration

**Next Steps:**
Need to see the actual error message to diagnose.

---

## Architectural Issues

### Issue 1: No Project Context in Execution System

**Problem:**
The execution logging system was designed before multi-project support was added. It assumes a single global context.

**Evidence:**
```typescript
// electron/execution-logger.ts - No project awareness
constructor() {
  const dbPath = path.join(app.getPath('userData'), 'executions.db');
  // Single global database for all projects
}

// electron/workflow-executor.ts - No project ID passed
public async executeWorkflow(
  workflow: WorkflowDefinition,
  triggerData: SimulatedRequest,
  // No projectId parameter!
) {
  // ...
  executionLogger.logExecution(executionData); // No project context
}
```

**Impact:**
- Executions are globally shared across projects
- No way to isolate execution history
- Query performance degrades as executions accumulate
- Cleanup is difficult (can't delete just one project's executions)

**Solution Architecture:**
Two options:

**Option A: Per-Project Databases (Recommended)**
```
projects/
  my-api/
    .lowcode/
      manifest.json
      executions.db    ← Project-specific execution history
  another-api/
    .lowcode/
      manifest.json
      executions.db    ← Separate execution history
```

Pros:
- Perfect isolation
- Easy cleanup (delete project = delete executions)
- Better performance (smaller databases)
- Simpler queries (no project filtering needed)

Cons:
- Can't query across projects (probably not needed)
- Slightly more complex to manage multiple DB connections

**Option B: Add Project Column to Global Database**
```sql
CREATE TABLE executions (
  id TEXT PRIMARY KEY,
  project_path TEXT NOT NULL,  ← Add this
  workflow_id TEXT NOT NULL,
  ...
)
CREATE INDEX idx_executions_project ON executions(project_path);
```

Pros:
- Single database to manage
- Can query across projects if needed
- Easier migration path

Cons:
- Still have global state
- Cleanup is harder
- Performance degrades over time
- Need schema migration system

---

### Issue 2: React Query + Auto-Refresh = Infinite Loop

**Problem:**
React Query's aggressive caching and the auto-refresh hook create a feedback loop.

**Code Path:**
```
1. useAutoRefresh hook queries executions
2. React Query caches result
3. Data updates → component re-renders
4. Re-render somehow triggers immediate re-fetch
5. Goto step 2 (infinite loop)
```

**Root Cause:**
Likely one of:
- Missing dependency array causing hook to re-create on every render
- Query key changing on every render
- `refetchInterval` not respecting its timer
- State update in query callback causing re-render

**Investigation Needed:**
```typescript
// src/renderer/components/ExecutionHistory/hooks/useAutoRefresh.ts
export function useAutoRefresh(workflowId: string) {
  const [isAutoRefreshEnabled, setIsAutoRefreshEnabled] = useState(true);
  
  const { data: executions } = useQuery({
    queryKey: ['executions', workflowId], // Does workflowId change?
    queryFn: () => window.api.execution.query({
      workflowId,
      limit: 100,
      sortOrder: 'desc',
    }),
    refetchInterval: isAutoRefreshEnabled ? 3000 : false, // Why immediate?
  });
  
  // Is something causing workflowId to change on every render?
  // Is component unmounting/remounting rapidly?
}
```

**Solution:**
1. Add `staleTime` to prevent immediate re-fetches
2. Use `enabled` flag to pause queries when not needed
3. Add request deduplication
4. Investigate what's causing rapid re-renders

---

## Lessons Learned

### 1. Design for Multi-Project from Day One

**What Happened:**
We built the execution system assuming a single project, then added multi-project support later. Now we have architectural debt.

**Lesson:**
Always consider multi-tenancy/multi-project support in initial architecture, even if not implemented immediately. Adding project isolation later requires schema migrations, data migrations, and API changes throughout the codebase.

**Example:**
```typescript
// Should have been designed as:
interface ExecutionLog {
  id: string;
  projectId: string;  ← Always include context
  workflowId: string;
  // ...
}

// Instead we have:
interface ExecutionLog {
  id: string;
  workflowId: string;  ← No context
  // ...
}
```

---

### 2. React Query Requires Careful Configuration

**What Happened:**
We used React Query's defaults which are very aggressive about caching and refetching. Combined with auto-refresh, this created an infinite loop.

**Lesson:**
React Query needs explicit configuration:
- `staleTime`: How long data is considered fresh
- `cacheTime`: How long to keep unused data
- `refetchInterval`: Auto-refresh interval
- `refetchOnWindowFocus`: Refetch when window gains focus
- `refetchOnMount`: Refetch when component mounts

**Example:**
```typescript
// Bad: Using defaults
useQuery({
  queryKey: ['executions'],
  queryFn: fetchExecutions,
  refetchInterval: 3000, // Dangerous with defaults
});

// Good: Explicit configuration
useQuery({
  queryKey: ['executions'],
  queryFn: fetchExecutions,
  refetchInterval: 3000,
  staleTime: 2000,          ← Don't refetch if data is <2s old
  cacheTime: 5 * 60 * 1000, ← Keep cache for 5 minutes
  refetchOnWindowFocus: false, ← Don't refetch on focus
  refetchOnMount: false,    ← Don't refetch on mount if cache valid
});
```

---

### 3. Database Schema Migrations Are Essential

**What Happened:**
We created the executions database without a migration system. Now we need to add columns but have no way to update existing databases safely.

**Lesson:**
Always implement schema versioning from the start:

```typescript
class ExecutionLogger {
  private readonly SCHEMA_VERSION = 1;
  
  private initializeDatabase(): void {
    // Check current version
    const currentVersion = this.getDatabaseVersion();
    
    if (currentVersion === 0) {
      // Fresh database, create tables
      this.createTables();
      this.setDatabaseVersion(this.SCHEMA_VERSION);
    } else if (currentVersion < this.SCHEMA_VERSION) {
      // Run migrations
      this.migrate(currentVersion, this.SCHEMA_VERSION);
    }
  }
  
  private migrate(from: number, to: number): void {
    for (let version = from + 1; version <= to; version++) {
      console.log(`Migrating database from v${version - 1} to v${version}`);
      this[`migrateToV${version}`]();
    }
  }
  
  private migrateToV2(): void {
    // Add project_path column
    this.db.exec('ALTER TABLE executions ADD COLUMN project_path TEXT');
    this.db.exec('CREATE INDEX idx_executions_project ON executions(project_path)');
  }
}
```

---

### 4. SQLite in Electron Requires Native Module Care

**What Happened:**
`better-sqlite3` is a native Node.js module that must be compiled for Electron's specific Node.js version. Initial setup failed because it was compiled for system Node.js instead.

**Lesson:**
Native modules in Electron need special handling:
1. Use `@electron/rebuild` after installing native modules
2. Mark native modules as `external` in Vite config
3. Test in built Electron app, not just dev mode
4. Consider pure JS alternatives (like `sql.js`) for simpler deployment

**Solution:**
```bash
npm install better-sqlite3
npx @electron/rebuild -f -w better-sqlite3
```

```typescript
// vite.config.ts
export default defineConfig({
  build: {
    rollupOptions: {
      external: ['better-sqlite3'], ← Don't bundle native modules
    },
  },
});
```

---

### 5. Subprocess Management Is Powerful But Complex

**What Happened:**
We spawn Python subprocesses for workflow execution, which works great but requires careful handling of:
- stdin/stdout/stderr streams
- Process lifecycle (start, stop, cleanup)
- Timeout handling
- Temp file cleanup
- Environment variables

**Lesson:**
Subprocess execution is the right choice for isolation and production parity, but needs robust error handling:

```typescript
// Good patterns we used:
- Pass data via stdin (secure, handles large payloads)
- Capture stdout/stderr separately
- Use structured markers for output parsing
- Track active processes for cleanup
- Set timeouts to prevent hangs
- Clean up temp files even on error
```

---

## Quick Fixes (Band-Aids)

### Fix 1: Disable Auto-Refresh

**File:** `src/renderer/components/ExecutionHistory/hooks/useAutoRefresh.ts`

```typescript
export function useAutoRefresh(workflowId: string) {
  const [isAutoRefreshEnabled, setIsAutoRefreshEnabled] = useState(false); // Changed from true
  
  const { data: executions } = useQuery({
    queryKey: ['executions', workflowId],
    queryFn: () => window.api.execution.query({
      workflowId,
      limit: 100,
      sortOrder: 'desc',
    }),
    refetchInterval: false, // Completely disabled
    staleTime: 30000, // Data valid for 30 seconds
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });
  
  return {
    executions: executions || [],
    isAutoRefreshEnabled,
    setIsAutoRefreshEnabled, // Keep this for manual refresh later
  };
}
```

**Impact:** Stops infinite loop, but execution history won't auto-update.

---

### Fix 2: Delete Execution Database

**Command:**
```bash
rm ~/Library/Application\ Support/Catalyst/executions.db
```

**Impact:** Clears all execution history. Fresh start per session.

---

### Fix 3: Hide Execution History Panel

**Temporary workaround** if fixes 1 & 2 don't work:

**File:** `src/renderer/components/Layout.tsx`

```typescript
// Comment out ExecutionHistoryPanel
<div className="flex-1 flex flex-col">
  {/* <ExecutionHistoryPanel /> */}
  <div className="p-4 text-gray-500">
    Execution history temporarily disabled
  </div>
</div>
```

---

## Proper Solutions

### Solution 1: Per-Project Execution Databases

**Implementation Plan:**

1. **Move database to project directory**
```typescript
// electron/execution-logger.ts
export class ExecutionLogger {
  private db: Database | null = null;
  private currentProjectPath: string | null = null;
  
  public setProjectPath(projectPath: string): void {
    if (this.currentProjectPath === projectPath) {
      return; // Already connected
    }
    
    // Close existing connection
    if (this.db) {
      this.db.close();
    }
    
    // Open project-specific database
    const lowcodePath = path.join(projectPath, '.lowcode');
    const dbPath = path.join(lowcodePath, 'executions.db');
    
    // Ensure .lowcode directory exists
    if (!fs.existsSync(lowcodePath)) {
      fs.mkdirSync(lowcodePath, { recursive: true });
    }
    
    this.db = new Database(dbPath);
    this.currentProjectPath = projectPath;
    this.initializeDatabase();
  }
}
```

2. **Update workflow executor to pass project context**
```typescript
// electron/workflow-executor.ts
public async executeWorkflow(
  workflow: WorkflowDefinition,
  triggerData: SimulatedRequest,
  projectPath: string, // Add this parameter
  options: ExecutionOptions = {}
): Promise<WorkflowExecution> {
  // Set project context before logging
  const executionLogger = ExecutionLogger.getInstance();
  executionLogger.setProjectPath(projectPath);
  
  // Rest of execution logic...
}
```

3. **Update IPC handlers to pass project path**
```typescript
// electron/workflow-execution-handlers.ts
ipcMain.handle('execute-workflow', async (event, workflow, triggerData) => {
  const projectPath = await getCurrentProjectPath(); // Get from manifest store
  const executor = WorkflowExecutor.getInstance();
  return executor.executeWorkflow(workflow, triggerData, projectPath);
});
```

**Effort:** Medium (2-4 hours)  
**Risk:** Low - Clean separation, no data migration needed

---

### Solution 2: Fix React Query Infinite Loop

**Implementation Plan:**

1. **Add proper configuration to useQuery**
```typescript
// src/renderer/components/ExecutionHistory/hooks/useAutoRefresh.ts
export function useAutoRefresh(workflowId: string) {
  const [isAutoRefreshEnabled, setIsAutoRefreshEnabled] = useState(true);
  
  const { data: executions, refetch } = useQuery({
    queryKey: ['executions', workflowId],
    queryFn: async () => {
      console.log('Fetching executions for:', workflowId);
      return window.api.execution.query({
        workflowId,
        limit: 100,
        sortOrder: 'desc',
      });
    },
    // Critical configurations:
    staleTime: 2000,           // Don't refetch if data is <2s old
    cacheTime: 5 * 60 * 1000,  // Keep in cache for 5 minutes
    refetchInterval: isAutoRefreshEnabled ? 3000 : false,
    refetchOnWindowFocus: false,
    refetchOnMount: false,      // Don't refetch if cache is valid
    refetchOnReconnect: false,
    retry: 1,                   // Only retry once on failure
    retryDelay: 1000,
  });
  
  return {
    executions: executions || [],
    isAutoRefreshEnabled,
    setIsAutoRefreshEnabled,
    refetch, // Manual refresh function
  };
}
```

2. **Add manual refresh button**
```typescript
// src/renderer/components/ExecutionHistory/ExecutionHistoryPanel.tsx
<div className="flex items-center gap-2">
  <button
    onClick={() => refetch()}
    className="px-3 py-1 text-sm bg-blue-500 text-white rounded"
  >
    Refresh
  </button>
  <label className="flex items-center gap-2">
    <input
      type="checkbox"
      checked={isAutoRefreshEnabled}
      onChange={(e) => setIsAutoRefreshEnabled(e.target.checked)}
    />
    Auto-refresh (3s)
  </label>
</div>
```

**Effort:** Low (1 hour)  
**Risk:** Low - Simple configuration changes

---

### Solution 3: Add Request Deduplication

**Implementation Plan:**

Create a request cache to prevent identical concurrent requests:

```typescript
// src/renderer/utils/requestCache.ts
class RequestCache {
  private pending = new Map<string, Promise<any>>();
  
  async dedupe<T>(key: string, fn: () => Promise<T>): Promise<T> {
    // If request is already in flight, return the existing promise
    if (this.pending.has(key)) {
      console.log('Deduping request:', key);
      return this.pending.get(key) as Promise<T>;
    }
    
    // Otherwise, start new request
    const promise = fn().finally(() => {
      // Clean up when done
      this.pending.delete(key);
    });
    
    this.pending.set(key, promise);
    return promise;
  }
}

export const requestCache = new RequestCache();

// Usage in hooks:
const { data } = useQuery({
  queryKey: ['executions', workflowId],
  queryFn: () => requestCache.dedupe(
    `executions-${workflowId}`,
    () => window.api.execution.query({ workflowId, limit: 100 })
  ),
});
```

**Effort:** Low (1 hour)  
**Risk:** Low - Additional safety layer

---

## Testing Plan

Once fixes are implemented:

### Test 1: No Infinite Loop
1. Open Catalyst
2. Open execution history panel
3. Watch console for 30 seconds
4. **Expected:** No more than 10 queries per 30s (one every 3s)
5. **Failure:** Queries appearing faster than 3s intervals

### Test 2: Project Isolation
1. Create Project A
2. Run workflow in Project A
3. Create Project B
4. Open execution history
5. **Expected:** No executions visible (fresh project)
6. **Failure:** Executions from Project A appear

### Test 3: Manual Refresh Works
1. Run a workflow
2. Click manual refresh button
3. **Expected:** New execution appears in list
4. **Failure:** No update or error

### Test 4: Auto-Refresh Works (Optional)
1. Enable auto-refresh toggle
2. Run a workflow
3. Wait 3 seconds
4. **Expected:** Execution appears automatically
5. **Failure:** No update or infinite queries

---

## Priority Recommendations

### P0 (Must Fix Immediately)
1. **Infinite loop** - Makes app unusable
   - Quick fix: Disable auto-refresh
   - Proper fix: Add staleTime and proper React Query config

### P1 (Fix Before Next Demo)
2. **Cross-project pollution** - Confusing UX, data integrity issue
   - Proper fix: Per-project execution databases

### P2 (Fix Before Production)
3. **Schema migrations** - Enable safe database updates
4. **Request deduplication** - Prevent race conditions

### P3 (Nice to Have)
5. **Database cleanup** - Delete old executions
6. **Export executions** - Download execution history as JSON
7. **Execution search** - Filter by date, status, etc.

---

## Current Development Blockers

1. **Infinite loop prevents testing** - Can't use the app to validate other fixes
2. **No clear way to test execution system** - Need to fix loop before testing other features
3. **Uncertainty about project context** - Many components don't know current project path

---

## Next Steps

### Immediate (Today)
1. ✅ Create this status document
2. ⬜ Implement Quick Fix #1 (disable auto-refresh)
3. ⬜ Test that app is usable again
4. ⬜ Investigate the actual workflow error mentioned by user

### Short Term (This Week)
1. ⬜ Implement Solution #2 (React Query config)
2. ⬜ Test execution history with proper config
3. ⬜ Implement Solution #1 (per-project databases)
4. ⬜ Test project isolation

### Medium Term (Next Sprint)
1. ⬜ Add schema migration system
2. ⬜ Add manual refresh UI
3. ⬜ Add auto-refresh toggle with visual indicator
4. ⬜ Add request deduplication

---

## Questions for Product Owner

1. **Multi-project priority:** How important is perfect project isolation? Could we live with a "clear execution history" button instead?

2. **Auto-refresh requirement:** Do we really need auto-refresh, or is manual refresh acceptable?

3. **Execution retention:** Should we auto-delete old executions? Keep last 100? Last 24 hours?

4. **Cross-project queries:** Will users ever want to see executions across all projects?

---

## Resources

### Relevant Files
- `electron/execution-logger.ts` - Database layer
- `electron/execution-handlers.ts` - IPC handlers
- `src/renderer/components/ExecutionHistory/` - UI components
- `src/renderer/components/ExecutionHistory/hooks/useAutoRefresh.ts` - Auto-refresh logic
- `electron/workflow-executor.ts` - Execution engine

### Documentation
- [React Query Docs](https://tanstack.com/query/latest/docs/react/overview)
- [Better SQLite3 Docs](https://github.com/WiseLibs/better-sqlite3)
- [Electron IPC Docs](https://www.electronjs.org/docs/latest/api/ipc-main)

### Similar Issues
- React Query infinite loops: [GitHub Issue #1234](https://github.com/TanStack/query/issues/1234)
- SQLite in Electron: [Stack Overflow](https://stackoverflow.com/questions/32504307)

---

**End of Status Report**

*Last updated: 2025-12-22 22:14 CET*
