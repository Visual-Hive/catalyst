# Task 2.11: Execution Logging System

**Phase:** Phase 2.5 - Developer Experience & Testing  
**Duration Estimate:** 1-2 days  
**Actual Duration:** [To be filled when complete]  
**Status:** 🔵 Not Started  
**Assigned:** AI + Human Review  
**Started:** [YYYY-MM-DD]  
**Completed:** [YYYY-MM-DD]  

---

## Task Overview

### Objective
Build a SQLite-based execution logging system that captures all workflow runs with complete node-level execution data. This is the foundation for execution history, debugging, and learning from past runs.

Currently, when workflows execute, there's no record of:
- What data was sent to the workflow
- What each node outputted
- How long execution took
- What errors occurred

This task creates a persistent, queryable record of all executions.

### Success Criteria
- [ ] SQLite database created with proper schema
- [ ] ExecutionLogger class with CRUD operations
- [ ] IPC handlers for execution history queries
- [ ] Generated Python sends execution data back to editor
- [ ] Node-level execution data captured (input, output, duration, errors)
- [ ] Execution receiver endpoint working in Electron
- [ ] Test coverage >85%
- [ ] Human review completed

### References
- Phase 2.5 README.md - Execution Logging overview
- better-sqlite3 documentation
- .clinerules/implementation-standards.md

### Dependencies
- Phase 2 complete (workflow generation working)
- Node.js with better-sqlite3 package
- IPC handlers functional

---

## Milestones

### Milestone 1: Design Execution Schema
**Date:** [YYYY-MM-DD]  
**Confidence:** 9/10  
**Status:** 🔵 Not Started  
**Time Spent:** [X hours]  

#### Design Decisions

| Decision | Options Considered | Choice Made | Rationale | Confidence |
|----------|-------------------|-------------|-----------|------------|
| Storage backend | PostgreSQL, SQLite, JSON files | SQLite | Local-first, no external dependencies, fast queries, portable | 9/10 |
| Data format | JSON text, separate tables, hybrid | Hybrid (structured + JSON) | Balance of queryability and flexibility | 8/10 |
| Node execution storage | Separate table, embedded JSON | Separate table with FK | Better queries, can index on node status | 9/10 |
| Execution ID | UUID, auto-increment, timestamp | UUID | Distributed-safe, no collisions, trackable across systems | 9/10 |

#### Schema Design

```sql
-- Main executions table
CREATE TABLE IF NOT EXISTS executions (
  id TEXT PRIMARY KEY,                 -- UUID
  workflow_id TEXT NOT NULL,
  workflow_name TEXT NOT NULL,
  status TEXT NOT NULL,                -- 'running', 'success', 'error'
  started_at TEXT NOT NULL,            -- ISO 8601 timestamp
  completed_at TEXT,
  duration_ms INTEGER,
  trigger_type TEXT NOT NULL,          -- 'http', 'manual', 'scheduled'
  trigger_data TEXT NOT NULL,          -- JSON
  error_message TEXT,
  error_stack TEXT,
  error_node_id TEXT,                  -- Which node failed
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Node executions table
CREATE TABLE IF NOT EXISTS node_executions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  execution_id TEXT NOT NULL,
  node_id TEXT NOT NULL,
  node_name TEXT NOT NULL,
  node_type TEXT NOT NULL,
  status TEXT NOT NULL,                -- 'pending', 'running', 'success', 'error', 'skipped'
  started_at TEXT,
  completed_at TEXT,
  duration_ms INTEGER,
  input TEXT,                          -- JSON
  output TEXT,                         -- JSON
  error_message TEXT,
  error_stack TEXT,
  FOREIGN KEY (execution_id) REFERENCES executions(id) ON DELETE CASCADE
);

-- Indexes for fast queries
CREATE INDEX IF NOT EXISTS idx_executions_workflow ON executions(workflow_id);
CREATE INDEX IF NOT EXISTS idx_executions_status ON executions(status);
CREATE INDEX IF NOT EXISTS idx_executions_started ON executions(started_at DESC);
CREATE INDEX IF NOT EXISTS idx_node_executions_execution ON node_executions(execution_id);
CREATE INDEX IF NOT EXISTS idx_node_executions_node ON node_executions(node_id);
```

---

### Milestone 2: Implement ExecutionLogger Class
**Date:** [YYYY-MM-DD]  
**Confidence:** 8/10  
**Status:** 🔵 Not Started  
**Time Spent:** [X hours]  

#### Files Created
- `electron/execution-logger.ts` - Main logging class
- `src/core/execution/types.ts` - TypeScript types

#### Implementation Notes

```typescript
/**
 * @file execution-logger.ts
 * @description SQLite-based execution logging system
 * @architecture Phase 2.5, Task 2.11 - Execution Logging
 * @created 2025-12-21
 * @confidence 8/10 - Well-established pattern
 * 
 * @performance-critical true - Used for all workflow executions
 */

import Database from 'better-sqlite3';
import path from 'path';
import { app } from 'electron';
import { WorkflowExecution, NodeExecution } from '@/core/execution/types';

/**
 * Manages workflow execution logging to SQLite database.
 * 
 * PROBLEM SOLVED:
 * - No record of past workflow executions
 * - Can't debug failed runs
 * - Can't learn from successful patterns
 * 
 * SOLUTION:
 * - Persistent SQLite database
 * - Fast indexed queries
 * - Complete execution history with node-level details
 * 
 * DESIGN:
 * - Singleton pattern (one database connection)
 * - Prepared statements for performance
 * - Automatic schema initialization
 * - Cascade deletes for cleanup
 */
export class ExecutionLogger {
  private db: Database.Database;
  private static instance: ExecutionLogger;
  
  constructor() {
    // Store database in user data directory
    const dbPath = path.join(app.getPath('userData'), 'executions.db');
    this.db = new Database(dbPath);
    
    // Enable WAL mode for better concurrent access
    this.db.pragma('journal_mode = WAL');
    
    this.initializeDatabase();
  }
  
  /**
   * Get singleton instance (lazy initialization).
   */
  public static getInstance(): ExecutionLogger {
    if (!ExecutionLogger.instance) {
      ExecutionLogger.instance = new ExecutionLogger();
    }
    return ExecutionLogger.instance;
  }
  
  /**
   * Initialize database schema.
   * Safe to call multiple times (IF NOT EXISTS).
   */
  private initializeDatabase(): void {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS executions (
        id TEXT PRIMARY KEY,
        workflow_id TEXT NOT NULL,
        workflow_name TEXT NOT NULL,
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
      CREATE INDEX IF NOT EXISTS idx_node_executions_node 
        ON node_executions(node_id);
    `);
  }
  
  /**
   * Log a complete workflow execution.
   * 
   * @param execution - Execution data with node executions
   */
  public logExecution(execution: WorkflowExecution): void {
    // Start transaction for atomic insert
    const insertExecution = this.db.transaction(() => {
      // Insert main execution
      const stmt = this.db.prepare(`
        INSERT INTO executions (
          id, workflow_id, workflow_name, status, started_at, 
          completed_at, duration_ms, trigger_type, trigger_data,
          error_message, error_stack, error_node_id
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      
      stmt.run(
        execution.id,
        execution.workflowId,
        execution.workflowName,
        execution.status,
        execution.startedAt,
        execution.completedAt || null,
        execution.durationMs || null,
        execution.trigger.type,
        JSON.stringify(execution.trigger.data),
        execution.error?.message || null,
        execution.error?.stack || null,
        execution.error?.nodeId || null
      );
      
      // Insert node executions
      if (execution.nodeExecutions.length > 0) {
        const nodeStmt = this.db.prepare(`
          INSERT INTO node_executions (
            execution_id, node_id, node_name, node_type, status,
            started_at, completed_at, duration_ms, input, output,
            error_message, error_stack
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);
        
        for (const nodeExec of execution.nodeExecutions) {
          nodeStmt.run(
            execution.id,
            nodeExec.nodeId,
            nodeExec.nodeName,
            nodeExec.nodeType,
            nodeExec.status,
            nodeExec.startedAt || null,
            nodeExec.completedAt || null,
            nodeExec.durationMs || null,
            JSON.stringify(nodeExec.input),
            nodeExec.output ? JSON.stringify(nodeExec.output) : null,
            nodeExec.error?.message || null,
            nodeExec.error?.stack || null
          );
        }
      }
    });
    
    insertExecution();
  }
  
  /**
   * Get execution history for a workflow.
   * 
   * @param workflowId - Workflow ID to query
   * @param limit - Maximum executions to return
   * @param offset - Pagination offset
   * @returns Array of executions with node data
   */
  public getExecutions(
    workflowId: string,
    limit = 50,
    offset = 0
  ): WorkflowExecution[] {
    const stmt = this.db.prepare(`
      SELECT * FROM executions 
      WHERE workflow_id = ?
      ORDER BY started_at DESC
      LIMIT ? OFFSET ?
    `);
    
    const rows = stmt.all(workflowId, limit, offset) as any[];
    
    return rows.map((row) => this.rowToExecution(row));
  }
  
  /**
   * Get single execution by ID.
   */
  public getExecution(executionId: string): WorkflowExecution | null {
    const stmt = this.db.prepare(`
      SELECT * FROM executions WHERE id = ?
    `);
    
    const row = stmt.get(executionId) as any;
    if (!row) return null;
    
    return this.rowToExecution(row);
  }
  
  /**
   * Delete execution and all node executions (cascade).
   */
  public deleteExecution(executionId: string): void {
    const stmt = this.db.prepare('DELETE FROM executions WHERE id = ?');
    stmt.run(executionId);
  }
  
  /**
   * Clear all executions for a workflow.
   */
  public clearWorkflowExecutions(workflowId: string): void {
    const stmt = this.db.prepare('DELETE FROM executions WHERE workflow_id = ?');
    stmt.run(workflowId);
  }
  
  /**
   * Convert database row to WorkflowExecution object.
   */
  private rowToExecution(row: any): WorkflowExecution {
    // Get node executions
    const nodeStmt = this.db.prepare(`
      SELECT * FROM node_executions 
      WHERE execution_id = ?
      ORDER BY id ASC
    `);
    
    const nodeRows = nodeStmt.all(row.id) as any[];
    
    return {
      id: row.id,
      workflowId: row.workflow_id,
      workflowName: row.workflow_name,
      status: row.status,
      startedAt: row.started_at,
      completedAt: row.completed_at || undefined,
      durationMs: row.duration_ms || undefined,
      trigger: {
        type: row.trigger_type,
        data: JSON.parse(row.trigger_data),
      },
      nodeExecutions: nodeRows.map((nodeRow) => ({
        nodeId: nodeRow.node_id,
        nodeName: nodeRow.node_name,
        nodeType: nodeRow.node_type,
        status: nodeRow.status,
        startedAt: nodeRow.started_at || undefined,
        completedAt: nodeRow.completed_at || undefined,
        durationMs: nodeRow.duration_ms || undefined,
        input: JSON.parse(nodeRow.input),
        output: nodeRow.output ? JSON.parse(nodeRow.output) : undefined,
        error: nodeRow.error_message
          ? {
              message: nodeRow.error_message,
              stack: nodeRow.error_stack || undefined,
            }
          : undefined,
      })),
      error: row.error_message
        ? {
            message: row.error_message,
            stack: row.error_stack || undefined,
            nodeId: row.error_node_id || undefined,
          }
        : undefined,
    };
  }
  
  /**
   * Close database connection.
   */
  public close(): void {
    this.db.close();
  }
}

// Export singleton instance
export const executionLogger = ExecutionLogger.getInstance();
```

---

### Milestone 3: Add IPC Handlers
**Date:** [YYYY-MM-DD]  
**Confidence:** 9/10  
**Status:** 🔵 Not Started  
**Time Spent:** [X hours]  

#### Files Created
- `electron/execution-handlers.ts` - IPC handlers

#### Implementation

```typescript
import { ipcMain } from 'electron';
import { executionLogger } from './execution-logger';

/**
 * Register IPC handlers for execution history.
 */
export function registerExecutionHandlers(): void {
  // Get execution history for workflow
  ipcMain.handle('execution:get-history', async (event, workflowId: string, limit?: number, offset?: number) => {
    try {
      return executionLogger.getExecutions(workflowId, limit, offset);
    } catch (error) {
      console.error('Failed to get execution history:', error);
      throw error;
    }
  });
  
  // Get single execution details
  ipcMain.handle('execution:get-details', async (event, executionId: string) => {
    try {
      return executionLogger.getExecution(executionId);
    } catch (error) {
      console.error('Failed to get execution details:', error);
      throw error;
    }
  });
  
  // Delete execution
  ipcMain.handle('execution:delete', async (event, executionId: string) => {
    try {
      executionLogger.deleteExecution(executionId);
      return { success: true };
    } catch (error) {
      console.error('Failed to delete execution:', error);
      throw error;
    }
  });
  
  // Clear all executions for workflow
  ipcMain.handle('execution:clear-workflow', async (event, workflowId: string) => {
    try {
      executionLogger.clearWorkflowExecutions(workflowId);
      return { success: true };
    } catch (error) {
      console.error('Failed to clear workflow executions:', error);
      throw error;
    }
  });
}
```

---

### Milestone 4: Update Generated Python
**Date:** [YYYY-MM-DD]  
**Confidence:** 7/10  
**Status:** 🔵 Not Started  
**Time Spent:** [X hours]  

#### Files Modified
- Generated Python workflow files

#### Implementation Notes

Add execution logging to generated Python code that sends data back to Catalyst editor via HTTP POST.

```python
import httpx
from datetime import datetime
import uuid
import os

# Catalyst editor URL (for logging)
CATALYST_EDITOR_URL = os.getenv('CATALYST_EDITOR_URL', 'http://localhost:3000')

async def log_execution(execution_data: dict):
    """Send execution data back to Catalyst editor for logging."""
    try:
        async with httpx.AsyncClient() as client:
            await client.post(
                f"{CATALYST_EDITOR_URL}/api/executions",
                json=execution_data,
                timeout=2.0
            )
    except Exception as e:
        # Don't fail workflow if logging fails
        print(f"Warning: Failed to log execution: {e}")

# Wrap workflow execution with logging
@app.post("/api/workflow")
async def execute_workflow(request: Request):
    execution_id = str(uuid.uuid4())
    started_at = datetime.utcnow().isoformat()
    
    execution_data = {
        "id": execution_id,
        "workflowId": "{{workflow_id}}",
        "workflowName": "{{workflow_name}}",
        "status": "running",
        "startedAt": started_at,
        "trigger": {
            "type": "http",
            "data": await request.json()
        },
        "nodeExecutions": []
    }
    
    try:
        # Execute workflow nodes...
        result = await execute_nodes(request, execution_data)
        
        # Mark success
        execution_data["status"] = "success"
        execution_data["completedAt"] = datetime.utcnow().isoformat()
        execution_data["durationMs"] = int(
            (datetime.fromisoformat(execution_data["completedAt"]) - 
             datetime.fromisoformat(started_at)).total_seconds() * 1000
        )
        
        # Log asynchronously (don't block response)
        asyncio.create_task(log_execution(execution_data))
        
        return result
        
    except Exception as e:
        # Mark error
        execution_data["status"] = "error"
        execution_data["completedAt"] = datetime.utcnow().isoformat()
        execution_data["error"] = {
            "message": str(e),
            "stack": traceback.format_exc()
        }
        
        asyncio.create_task(log_execution(execution_data))
        raise
```

---

### Milestone 5: Create Execution Receiver
**Date:** [YYYY-MM-DD]  
**Confidence:** 8/10  
**Status:** 🔵 Not Started  
**Time Spent:** [X hours]  

#### Files Created
- `electron/execution-receiver.ts` - HTTP endpoint for receiving logs

```typescript
import express from 'express';
import { executionLogger } from './execution-logger';
import { WorkflowExecution } from '@/core/execution/types';

const app = express();
app.use(express.json());

/**
 * Receive execution logs from generated Python workflows.
 */
app.post('/api/executions', (req, res) => {
  try {
    const execution = req.body as WorkflowExecution;
    executionLogger.logExecution(execution);
    res.json({ success: true });
  } catch (error) {
    console.error('Failed to log execution:', error);
    res.status(500).json({ error: 'Failed to log execution' });
  }
});

/**
 * Start execution receiver server.
 */
export function startExecutionReceiver(port = 3000): void {
  app.listen(port, () => {
    console.log(`[ExecutionReceiver] Listening on port ${port}`);
  });
}
```

---

### Milestone 6: Testing
**Date:** [YYYY-MM-DD]  
**Confidence:** [X/10]  
**Status:** 🔵 Not Started  
**Time Spent:** [X hours]  

#### Test Results

**Unit Tests:**
- Database initialization
- Insert execution
- Query executions
- Delete execution
- Row to object conversion

**Integration Tests:**
- Generate workflow with logging
- Run workflow
- Verify execution logged
- Query execution history

---

### Milestone 7: Human Review
**Date:** [YYYY-MM-DD]  
**Status:** 🔵 Not Started  

#### Human Review Checklist
- [ ] Database schema appropriate
- [ ] Indexes optimize common queries
- [ ] Logging doesn't fail workflow
- [ ] Data sanitized (no sensitive info)
- [ ] Ready for Task 2.12

---

## Final Summary

### Deliverables
- [ ] ExecutionLogger class
- [ ] SQLite database with schema
- [ ] IPC handlers
- [ ] Generated Python logging
- [ ] Execution receiver endpoint
- [ ] Type definitions
- [ ] Test coverage >85%

### Next Steps
- [ ] Task 2.12: Execution History Viewer UI

---

**Task Status:** 🔵 Not Started  
**Last Updated:** 2025-12-21
