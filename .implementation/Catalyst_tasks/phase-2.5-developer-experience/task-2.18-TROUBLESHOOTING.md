# Task 2.18 Troubleshooting Guide: Local Execution & Execution History Fixes

**Created:** 2025-12-23  
**Purpose:** Guide for Cline to diagnose and fix local workflow execution issues  
**Priority:** 🔴 CRITICAL - App is currently unusable due to infinite loops

---

## Executive Summary

The local execution system has **three critical issues** that must be fixed in order:

| Priority | Issue | Impact | Fix Effort |
|----------|-------|--------|------------|
| P0 | Infinite Query Loop | App unusable, must force quit | 30 min |
| P1 | Cross-Project Execution Pollution | Wrong data appears | 2-4 hours |
| P2 | Workflow Execution Not Logging | No visible results | 1-2 hours |

**⚠️ IMPORTANT:** Fix P0 FIRST. The infinite loop prevents testing any other fixes.

---

## Problem 1: Infinite Query Loop (P0 - FIX FIRST)

### Symptoms
```
[ExecutionHandlers] Querying executions: { workflowId: 'New Workflow', ... }
[ExecutionHandlers] Querying executions: { workflowId: 'New Workflow', ... }
[ExecutionHandlers] Querying executions: { workflowId: 'New Workflow', ... }
... (repeats infinitely, 10+ times per second)
```

- App becomes unresponsive within seconds
- High CPU usage
- Must force quit the app
- Console log spam

### Root Cause

The `useAutoRefresh` hook in `ExecutionHistoryPanel` creates a feedback loop:

```
Query fires → Data updates → Component re-renders → Query fires again (immediately, not after 3s)
```

The React Query configuration is missing critical settings that prevent immediate refetches.

### File to Fix

`src/renderer/components/ExecutionHistory/hooks/useAutoRefresh.ts`

### The Fix

**REPLACE the entire `useAutoRefresh` function with this:**

```typescript
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState, useCallback } from 'react';

/**
 * Hook for managing execution history with optional auto-refresh
 * 
 * FIXED: Added proper React Query configuration to prevent infinite loops
 * - staleTime prevents immediate refetches
 * - refetchOnMount/WindowFocus disabled to prevent unwanted queries
 * - Manual refresh function for user-triggered updates
 */
export function useAutoRefresh(workflowId: string) {
  const [isAutoRefreshEnabled, setIsAutoRefreshEnabled] = useState(false); // CHANGED: Default to false
  const queryClient = useQueryClient();

  const { data: executions, isLoading, error, refetch } = useQuery({
    queryKey: ['executions', workflowId],
    queryFn: async () => {
      console.log('[useAutoRefresh] Fetching executions for:', workflowId);
      
      // Safety check - don't query if no workflowId
      if (!workflowId) {
        console.log('[useAutoRefresh] No workflowId, returning empty array');
        return [];
      }
      
      const result = await window.electronAPI.execution.query({
        workflowId,
        limit: 100,
        sortOrder: 'desc',
      });
      
      console.log('[useAutoRefresh] Received', result?.length || 0, 'executions');
      return result || [];
    },
    
    // CRITICAL: These settings prevent the infinite loop
    staleTime: 5000,              // Data is fresh for 5 seconds - don't refetch
    gcTime: 5 * 60 * 1000,        // Keep in cache for 5 minutes (was cacheTime in v4)
    refetchInterval: isAutoRefreshEnabled ? 5000 : false,  // 5s interval, not 3s
    refetchOnWindowFocus: false,  // Don't refetch when window gains focus
    refetchOnMount: false,        // Don't refetch if cache is valid
    refetchOnReconnect: false,    // Don't refetch on reconnect
    retry: 1,                     // Only retry once on failure
    retryDelay: 1000,             // Wait 1s between retries
    
    // Only run query if we have a workflowId
    enabled: Boolean(workflowId),
  });

  // Manual refresh function - use this instead of auto-refresh
  const manualRefresh = useCallback(async () => {
    console.log('[useAutoRefresh] Manual refresh triggered');
    await refetch();
  }, [refetch]);

  // Toggle auto-refresh with safety
  const toggleAutoRefresh = useCallback((enabled: boolean) => {
    console.log('[useAutoRefresh] Auto-refresh toggled:', enabled);
    setIsAutoRefreshEnabled(enabled);
  }, []);

  return {
    executions: executions || [],
    isLoading,
    error,
    isAutoRefreshEnabled,
    setIsAutoRefreshEnabled: toggleAutoRefresh,
    refetch: manualRefresh,
  };
}
```

### Verification Steps

1. Apply the fix
2. Restart the app: `npm run dev`
3. Open a workflow
4. Watch the console for 30 seconds
5. **Expected:** Queries appear at most once every 5 seconds (if auto-refresh is on) or not at all
6. **If still looping:** Check if there's another component also querying executions

### If Fix Doesn't Work - Nuclear Option

Temporarily hide the entire ExecutionHistoryPanel:

**File:** `src/renderer/components/Layout.tsx` (or wherever ExecutionHistoryPanel is rendered)

```typescript
// Temporarily comment out until fixed
{/* <ExecutionHistoryPanel workflowId={currentWorkflowId} /> */}
<div className="p-4 text-gray-500 text-sm">
  Execution history temporarily disabled for debugging
</div>
```

---

## Problem 2: Cross-Project Execution Pollution (P1)

### Symptoms

- Create Project A, run workflow, see execution
- Create Project B (new project)
- Open execution history in Project B
- **BUG:** Executions from Project A appear in Project B

### Root Cause

`ExecutionLogger` uses a **global SQLite database** without project isolation:

```typescript
// electron/execution-logger.ts - CURRENT (BAD)
constructor() {
  const dbPath = path.join(app.getPath('userData'), 'executions.db');
  // ^^^^ Single global database for ALL projects
  this.db = new Database(dbPath);
}
```

The database schema has no `project_path` column, so all executions are mixed together.

### The Fix - Per-Project Databases

**Step 1: Modify `electron/execution-logger.ts`**

Replace the class with a project-aware version:

```typescript
/**
 * @file execution-logger.ts
 * @description Project-aware SQLite execution logging
 * 
 * FIXED: Now uses per-project databases in .lowcode/executions.db
 * instead of a global database in userData.
 */

import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import type {
  WorkflowExecution,
  NodeExecution,
  ExecutionQueryOptions,
  ExecutionStats,
} from '../src/core/execution/types';

export class ExecutionLogger {
  private db: Database.Database | null = null;
  private currentProjectPath: string | null = null;
  private static instance: ExecutionLogger;

  private constructor() {
    // Don't initialize DB in constructor - wait for setProjectPath
  }

  public static getInstance(): ExecutionLogger {
    if (!ExecutionLogger.instance) {
      ExecutionLogger.instance = new ExecutionLogger();
    }
    return ExecutionLogger.instance;
  }

  /**
   * Set the current project path and initialize/switch database
   * 
   * MUST be called before any logging or querying operations.
   * Safe to call multiple times - only switches DB if path changed.
   */
  public setProjectPath(projectPath: string): void {
    // Skip if already connected to this project
    if (this.currentProjectPath === projectPath && this.db) {
      return;
    }

    console.log('[ExecutionLogger] Switching to project:', projectPath);

    // Close existing connection
    if (this.db) {
      try {
        this.db.close();
      } catch (e) {
        console.warn('[ExecutionLogger] Error closing previous DB:', e);
      }
    }

    // Create .lowcode directory if it doesn't exist
    const lowcodePath = path.join(projectPath, '.lowcode');
    if (!fs.existsSync(lowcodePath)) {
      fs.mkdirSync(lowcodePath, { recursive: true });
    }

    // Open project-specific database
    const dbPath = path.join(lowcodePath, 'executions.db');
    console.log('[ExecutionLogger] Opening database:', dbPath);
    
    this.db = new Database(dbPath);
    this.db.pragma('journal_mode = WAL');
    this.currentProjectPath = projectPath;
    
    this.initializeDatabase();
  }

  /**
   * Get current project path (for debugging)
   */
  public getCurrentProjectPath(): string | null {
    return this.currentProjectPath;
  }

  /**
   * Check if logger is ready (has active project)
   */
  public isReady(): boolean {
    return this.db !== null && this.currentProjectPath !== null;
  }

  private ensureReady(): void {
    if (!this.db) {
      throw new Error(
        '[ExecutionLogger] Database not initialized. Call setProjectPath() first.'
      );
    }
  }

  private initializeDatabase(): void {
    this.ensureReady();
    
    this.db!.exec(`
      CREATE TABLE IF NOT EXISTS executions (
        id TEXT PRIMARY KEY,
        workflow_id TEXT NOT NULL,
        workflow_name TEXT NOT NULL,
        execution_mode TEXT DEFAULT 'test',
        status TEXT NOT NULL,
        started_at TEXT NOT NULL,
        completed_at TEXT,
        duration_ms INTEGER,
        trigger_type TEXT NOT NULL,
        trigger_data TEXT NOT NULL,
        error_message TEXT,
        error_stack TEXT,
        error_node_id TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE TABLE IF NOT EXISTS node_executions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        execution_id TEXT NOT NULL,
        node_id TEXT NOT NULL,
        node_name TEXT NOT NULL,
        node_type TEXT NOT NULL,
        status TEXT NOT NULL,
        started_at TEXT,
        completed_at TEXT,
        duration_ms INTEGER,
        input TEXT,
        output TEXT,
        error_message TEXT,
        error_stack TEXT,
        FOREIGN KEY (execution_id) REFERENCES executions(id) ON DELETE CASCADE
      );
      
      CREATE INDEX IF NOT EXISTS idx_executions_workflow 
        ON executions(workflow_id);
      CREATE INDEX IF NOT EXISTS idx_executions_status 
        ON executions(status);
      CREATE INDEX IF NOT EXISTS idx_executions_started 
        ON executions(started_at DESC);
      CREATE INDEX IF NOT EXISTS idx_node_executions_execution 
        ON node_executions(execution_id);
    `);
    
    console.log('[ExecutionLogger] Database initialized');
  }

  /**
   * Log a workflow execution
   */
  public logExecution(execution: WorkflowExecution): void {
    this.ensureReady();
    
    console.log('[ExecutionLogger] Logging execution:', execution.id);

    const insertExecution = this.db!.prepare(`
      INSERT INTO executions (
        id, workflow_id, workflow_name, execution_mode, status,
        started_at, completed_at, duration_ms,
        trigger_type, trigger_data,
        error_message, error_stack, error_node_id
      ) VALUES (
        @id, @workflowId, @workflowName, @executionMode, @status,
        @startedAt, @completedAt, @durationMs,
        @triggerType, @triggerData,
        @errorMessage, @errorStack, @errorNodeId
      )
    `);

    const insertNodeExecution = this.db!.prepare(`
      INSERT INTO node_executions (
        execution_id, node_id, node_name, node_type, status,
        started_at, completed_at, duration_ms,
        input, output, error_message, error_stack
      ) VALUES (
        @executionId, @nodeId, @nodeName, @nodeType, @status,
        @startedAt, @completedAt, @durationMs,
        @input, @output, @errorMessage, @errorStack
      )
    `);

    // Use transaction for atomicity
    const transaction = this.db!.transaction(() => {
      insertExecution.run({
        id: execution.id,
        workflowId: execution.workflowId,
        workflowName: execution.workflowName,
        executionMode: execution.executionMode || 'test',
        status: execution.status,
        startedAt: execution.startedAt,
        completedAt: execution.completedAt || null,
        durationMs: execution.durationMs || null,
        triggerType: execution.trigger?.type || 'unknown',
        triggerData: JSON.stringify(execution.trigger?.data || {}),
        errorMessage: execution.error?.message || null,
        errorStack: execution.error?.stack || null,
        errorNodeId: execution.error?.nodeId || null,
      });

      // Insert node executions
      for (const nodeExec of execution.nodeExecutions || []) {
        insertNodeExecution.run({
          executionId: execution.id,
          nodeId: nodeExec.nodeId,
          nodeName: nodeExec.nodeName,
          nodeType: nodeExec.nodeType,
          status: nodeExec.status,
          startedAt: nodeExec.startedAt || null,
          completedAt: nodeExec.completedAt || null,
          durationMs: nodeExec.durationMs || null,
          input: JSON.stringify(nodeExec.input || null),
          output: JSON.stringify(nodeExec.output || null),
          errorMessage: nodeExec.error?.message || null,
          errorStack: nodeExec.error?.stack || null,
        });
      }
    });

    transaction();
    console.log('[ExecutionLogger] Execution logged successfully');
  }

  /**
   * Query executions with filtering
   */
  public queryExecutions(options: ExecutionQueryOptions = {}): WorkflowExecution[] {
    this.ensureReady();
    
    const {
      workflowId,
      status,
      limit = 100,
      offset = 0,
      sortOrder = 'desc',
    } = options;

    let query = 'SELECT * FROM executions WHERE 1=1';
    const params: any[] = [];

    if (workflowId) {
      query += ' AND workflow_id = ?';
      params.push(workflowId);
    }

    if (status) {
      query += ' AND status = ?';
      params.push(status);
    }

    query += ` ORDER BY started_at ${sortOrder === 'asc' ? 'ASC' : 'DESC'}`;
    query += ' LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const rows = this.db!.prepare(query).all(...params) as any[];

    return rows.map((row) => this.rowToExecution(row));
  }

  /**
   * Get single execution by ID
   */
  public getExecution(executionId: string): WorkflowExecution | null {
    this.ensureReady();
    
    const row = this.db!.prepare(
      'SELECT * FROM executions WHERE id = ?'
    ).get(executionId) as any;

    if (!row) return null;

    return this.rowToExecution(row);
  }

  /**
   * Get node executions for an execution
   */
  public getNodeExecutions(executionId: string): NodeExecution[] {
    this.ensureReady();
    
    const rows = this.db!.prepare(
      'SELECT * FROM node_executions WHERE execution_id = ? ORDER BY id ASC'
    ).all(executionId) as any[];

    return rows.map((row) => ({
      nodeId: row.node_id,
      nodeName: row.node_name,
      nodeType: row.node_type,
      status: row.status,
      startedAt: row.started_at,
      completedAt: row.completed_at,
      durationMs: row.duration_ms,
      input: row.input ? JSON.parse(row.input) : null,
      output: row.output ? JSON.parse(row.output) : null,
      error: row.error_message
        ? { message: row.error_message, stack: row.error_stack }
        : undefined,
    }));
  }

  /**
   * Delete execution by ID
   */
  public deleteExecution(executionId: string): boolean {
    this.ensureReady();
    
    const result = this.db!.prepare(
      'DELETE FROM executions WHERE id = ?'
    ).run(executionId);
    
    return result.changes > 0;
  }

  /**
   * Clear all executions for a workflow
   */
  public clearWorkflowExecutions(workflowId: string): number {
    this.ensureReady();
    
    const result = this.db!.prepare(
      'DELETE FROM executions WHERE workflow_id = ?'
    ).run(workflowId);
    
    return result.changes;
  }

  /**
   * Get execution statistics
   */
  public getStats(workflowId?: string): ExecutionStats {
    this.ensureReady();
    
    let query = `
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END) as success,
        SUM(CASE WHEN status = 'error' THEN 1 ELSE 0 END) as error,
        AVG(duration_ms) as avgDuration
      FROM executions
    `;
    
    const params: any[] = [];
    if (workflowId) {
      query += ' WHERE workflow_id = ?';
      params.push(workflowId);
    }

    const row = this.db!.prepare(query).get(...params) as any;

    return {
      total: row.total || 0,
      success: row.success || 0,
      error: row.error || 0,
      avgDurationMs: row.avgDuration || 0,
    };
  }

  private rowToExecution(row: any): WorkflowExecution {
    const execution: WorkflowExecution = {
      id: row.id,
      workflowId: row.workflow_id,
      workflowName: row.workflow_name,
      executionMode: row.execution_mode || 'test',
      status: row.status,
      startedAt: row.started_at,
      completedAt: row.completed_at,
      durationMs: row.duration_ms,
      trigger: {
        type: row.trigger_type,
        data: JSON.parse(row.trigger_data || '{}'),
      },
      nodeExecutions: this.getNodeExecutions(row.id),
    };

    if (row.error_message) {
      execution.error = {
        message: row.error_message,
        stack: row.error_stack,
        nodeId: row.error_node_id,
      };
    }

    return execution;
  }
}
```

**Step 2: Update `electron/execution-handlers.ts`**

Add project path handling to IPC handlers:

```typescript
// At the top of the file, add this helper
function ensureLoggerReady(projectPath?: string): ExecutionLogger {
  const logger = ExecutionLogger.getInstance();
  
  if (projectPath) {
    logger.setProjectPath(projectPath);
  } else if (!logger.isReady()) {
    throw new Error('ExecutionLogger not initialized - no project path provided');
  }
  
  return logger;
}

// Update the query handler
ipcMain.handle('execution:query', async (event, options: ExecutionQueryOptions & { projectPath?: string }) => {
  try {
    const { projectPath, ...queryOptions } = options;
    const logger = ensureLoggerReady(projectPath);
    return logger.queryExecutions(queryOptions);
  } catch (error) {
    console.error('[ExecutionHandlers] Query error:', error);
    throw error;
  }
});
```

**Step 3: Update `electron/workflow-execution-handlers.ts`**

Pass project path when executing workflows:

```typescript
ipcMain.handle(
  'workflow:execute',
  async (_event, workflowId: string, triggerData: SimulatedRequest, manifest: CatalystManifest, projectPath: string) => {
    try {
      console.log(`[IPC] workflow:execute for ${workflowId} in project ${projectPath}`);
      
      // Set project path on execution logger
      const executionLogger = ExecutionLogger.getInstance();
      executionLogger.setProjectPath(projectPath);
      
      // ... rest of execution logic
    } catch (error) {
      // ... error handling
    }
  }
);
```

**Step 4: Update the renderer to pass projectPath**

In your RequestSimulator or wherever you call execute:

```typescript
// Get project path from your app state/store
const projectPath = useProjectStore((state) => state.currentProjectPath);

// Pass it to the IPC call
const result = await window.electronAPI.workflow.execute(
  workflowId,
  simulatedRequest,
  manifest,
  projectPath  // Add this parameter
);
```

### Verification Steps

1. Apply all changes
2. **Delete the old global database:**
   ```bash
   rm ~/Library/Application\ Support/Catalyst/executions.db
   ```
3. Restart the app
4. Create Project A, run a workflow
5. Verify execution appears in history
6. Create Project B (new project)
7. **Expected:** Execution history is empty in Project B
8. Check that `.lowcode/executions.db` exists in each project folder

---

## Problem 3: Workflow Execution Not Creating Records (P2)

### Symptoms

- Click "Run Test" in RequestSimulator
- No execution appears in history
- No errors shown
- Console may show Python output but nothing logged

### Possible Causes

1. **ExecutionLogger not initialized** - No project path set
2. **Python output not parsed** - Missing execution markers
3. **Logging errors swallowed** - Try-catch hiding issues
4. **IPC not wired up** - execute handler not called

### Diagnostic Steps

**Step 1: Check if Python is running**

Add logging to `electron/workflow-executor.ts`:

```typescript
// In executeWorkflow method, add verbose logging:
console.log('[WorkflowExecutor] Starting execution for workflow:', workflow.id);
console.log('[WorkflowExecutor] Trigger data:', JSON.stringify(triggerData, null, 2));
console.log('[WorkflowExecutor] Python path:', await this.pythonEnv.getPythonPath());

// After spawning process:
console.log('[WorkflowExecutor] Python process spawned, PID:', childProcess.pid);

// Capture ALL stdout:
childProcess.stdout.on('data', (data) => {
  console.log('[WorkflowExecutor] Python stdout:', data.toString());
});

// Capture ALL stderr:
childProcess.stderr.on('data', (data) => {
  console.log('[WorkflowExecutor] Python stderr:', data.toString());
});
```

**Step 2: Check execution markers**

The Python code should output:
```
__CATALYST_EXECUTION_START__
{"id": "...", "status": "success", ...}
__CATALYST_EXECUTION_END__
```

If you don't see these markers, the `WorkflowOrchestrator.ts` test mode generation is broken.

**Step 3: Check the generated Python code**

Look at the temp file:
```bash
ls -la /tmp/catalyst_workflow_*
cat /tmp/catalyst_workflow_*.py
```

Look for the test mode section:
```python
if __name__ == "__main__":
    execution_mode = os.getenv('CATALYST_EXECUTION_MODE', 'production')
    
    if execution_mode == 'test':
        # Should read stdin, execute, print markers
```

**Step 4: Manual Python test**

Run the generated Python manually:
```bash
echo '{"method": "POST", "body": {"test": true}}' | \
CATALYST_EXECUTION_MODE=test \
GROQ_API_KEY=your_key_here \
python /tmp/catalyst_workflow_your_id.py
```

You should see the execution JSON output.

### Common Fixes

**Fix A: WorkflowOrchestrator not generating test mode**

Check `src/core/codegen/python/WorkflowOrchestrator.ts` has the `generateTestExecutionFunction` and mode detection in the main block.

**Fix B: Environment variables not passed**

In `WorkflowExecutor.spawnPythonProcess`:
```typescript
const env = {
  ...process.env,
  ...environment,
  CATALYST_EXECUTION_MODE: 'test',  // MUST be set
  // Ensure API keys are included
  GROQ_API_KEY: environment.GROQ_API_KEY || process.env.GROQ_API_KEY,
  OPENAI_API_KEY: environment.OPENAI_API_KEY || process.env.OPENAI_API_KEY,
  ANTHROPIC_API_KEY: environment.ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY,
};
```

**Fix C: Output parsing regex broken**

In `WorkflowExecutor.captureExecutionOutput`:
```typescript
// The regex should match:
const executionRegex = /__CATALYST_EXECUTION_START__\s*([\s\S]*?)\s*__CATALYST_EXECUTION_END__/;
const match = stdout.match(executionRegex);

if (match && match[1]) {
  try {
    const executionData = JSON.parse(match[1].trim());
    console.log('[WorkflowExecutor] Parsed execution:', executionData);
  } catch (e) {
    console.error('[WorkflowExecutor] Failed to parse execution JSON:', match[1]);
  }
}
```

---

## Quick Verification Checklist

After applying fixes, verify each component:

### 1. ✅ Infinite Loop Fixed
- [ ] Open app, wait 30 seconds
- [ ] Console shows < 10 queries total
- [ ] App remains responsive

### 2. ✅ Project Isolation Working
- [ ] Project A has executions
- [ ] Project B has no executions (new project)
- [ ] Each project has `.lowcode/executions.db`

### 3. ✅ Execution Logging Working
- [ ] Click "Run Test" on simple workflow
- [ ] Execution appears in history within 5 seconds
- [ ] Execution shows correct status (success/error)
- [ ] Node executions visible when expanded

### 4. ✅ Groq Node Working
- [ ] Groq API key is set in environment or node config
- [ ] Test workflow: HTTP Endpoint → Groq Chat
- [ ] Execution succeeds with LLM response in output

---

## Recommended Fix Order

```
Day 1 Morning:
├─ [30 min] Fix P0: Infinite Query Loop
├─ [15 min] Verify app is stable
└─ [15 min] Test manual refresh works

Day 1 Afternoon:
├─ [2 hr] Fix P1: Per-Project Databases
├─ [30 min] Update IPC handlers
└─ [30 min] Test project isolation

Day 2 Morning:
├─ [1 hr] Fix P2: Debug execution logging
├─ [30 min] Add verbose logging
└─ [30 min] Test end-to-end workflow

Day 2 Afternoon:
├─ [1 hr] Polish and cleanup
├─ [30 min] Remove debug logging
└─ [30 min] Update documentation
```

---

## Files Modified Summary

| File | Changes |
|------|---------|
| `src/renderer/components/ExecutionHistory/hooks/useAutoRefresh.ts` | Fix React Query config |
| `electron/execution-logger.ts` | Per-project database support |
| `electron/execution-handlers.ts` | Add projectPath parameter |
| `electron/workflow-execution-handlers.ts` | Pass projectPath to logger |
| `electron/workflow-executor.ts` | Add verbose logging (debug) |
| `src/core/codegen/python/WorkflowOrchestrator.ts` | Verify test mode generation |

---

## If All Else Fails

1. **Delete all execution databases:**
   ```bash
   rm ~/Library/Application\ Support/Catalyst/executions.db
   find ~/your-projects -name "executions.db" -delete
   ```

2. **Clear React Query cache:**
   ```typescript
   // In your app initialization
   queryClient.clear();
   ```

3. **Fresh start:**
   - `rm -rf node_modules`
   - `npm install`
   - `npm run dev`

4. **Contact for help:**
   - Check STATUS_REPORT_2025-12-22.md for additional context
   - Review task-2.18-local-execution-runner.md for original design

---

**Document Author:** Claude (Opus 4.5)  
**Based on:** STATUS_REPORT_2025-12-22.md, project knowledge, task specifications  
**Last Updated:** 2025-12-23