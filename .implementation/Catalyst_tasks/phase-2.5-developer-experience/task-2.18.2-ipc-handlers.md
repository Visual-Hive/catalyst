# Task 2.18.2: IPC Handlers for Workflow Execution

**Parent Task:** Task 2.18 - Local Workflow Execution Runner  
**Duration Estimate:** 2-3 hours  
**Status:** 🔵 Not Started  
**Priority:** 🔴 CRITICAL - Bridges UI and executor  

---

## Overview

This subtask implements the IPC (Inter-Process Communication) handlers that connect the React UI to the WorkflowExecutor in the Electron main process. These handlers enable the RequestSimulator to trigger workflow execution and receive results.

### Objective

Create IPC handlers for:
1. **workflow:execute** - Execute workflow with trigger data
2. **workflow:stop** - Stop running execution
3. **workflow:get-active** - Get list of active executions
4. **python:check** - Validate Python environment
5. **python:install-deps** - Install missing dependencies

### Success Criteria

- [ ] IPC handlers registered in main process
- [ ] Preload script exposes handlers to renderer
- [ ] Type-safe IPC communication
- [ ] Error handling for all handlers
- [ ] Works with existing ExecutionLogger
- [ ] Test coverage >85%

---

## Implementation

### File 1: `electron/workflow-execution-handlers.ts`

```typescript
/**
 * @file workflow-execution-handlers.ts
 * @description IPC handlers for workflow execution
 * 
 * @architecture Phase 2.5, Task 2.18.2 - IPC Handlers
 * @created 2025-12-22
 * @author AI (Cline) + Human Review
 * @confidence 9/10 - Standard IPC pattern
 * 
 * @see electron/workflow-executor.ts - Executor implementation
 * @see electron/preload.ts - Exposes handlers to renderer
 * @see .implementation/Catalyst_tasks/phase-2.5-developer-experience/task-2.18.2-ipc-handlers.md
 * 
 * PROBLEM SOLVED:
 * - Need to bridge React UI and Electron main process
 * - Need type-safe communication
 * - Need error handling across process boundary
 * - Need to pass large payloads (workflow data, execution results)
 * 
 * SOLUTION:
 * - IPC handlers using ipcMain.handle
 * - Structured request/response types
 * - Error serialization
 * - Async handlers for long-running operations
 * 
 * DESIGN DECISIONS:
 * - Use ipcMain.handle (not .on) for request/response pattern
 * - Serialize errors to plain objects
 * - Return structured responses with success/error
 * - Load workflow from manifest (not passed as argument)
 * 
 * @security-critical true - Executes user workflows
 * @performance-critical false - User-initiated operations
 */

import { ipcMain } from 'electron';
import { workflowExecutor, WorkflowExecutor } from './workflow-executor';
import { pythonEnvironment, PythonEnvironment } from './python-environment';
import { manifestStore } from './manifest-store'; // Hypothetical manifest loader
import type { WorkflowExecution, SimulatedRequest } from '../src/core/execution/types';
import type { Workflow } from '../src/core/workflow/types';

/**
 * Register all workflow execution IPC handlers
 * 
 * Call this once during Electron app initialization.
 * 
 * @example
 * ```typescript
 * // In electron/main.ts
 * import { registerWorkflowExecutionHandlers } from './workflow-execution-handlers';
 * 
 * app.whenReady().then(() => {
 *   registerWorkflowExecutionHandlers();
 *   // ...
 * });
 * ```
 */
export function registerWorkflowExecutionHandlers(): void {
  console.log('[IPC] Registering workflow execution handlers');
  
  // Execute workflow
  ipcMain.handle(
    'workflow:execute',
    async (event, workflowId: string, triggerData: SimulatedRequest) => {
      try {
        console.log(`[IPC] workflow:execute called for workflow ${workflowId}`);
        
        // Load workflow from manifest
        const workflow = await manifestStore.getWorkflow(workflowId);
        if (!workflow) {
          throw new Error(`Workflow ${workflowId} not found`);
        }
        
        // Extract API keys from node configurations
        const environment = extractEnvironmentVariables(workflow);
        
        // Execute workflow
        const execution = await workflowExecutor.executeWorkflow(
          workflow,
          triggerData,
          { environment }
        );
        
        return {
          success: true,
          data: execution,
        };
      } catch (error: any) {
        console.error('[IPC] workflow:execute error:', error);
        
        return {
          success: false,
          error: {
            message: error.message,
            name: error.name,
            stack: error.stack,
          },
        };
      }
    }
  );
  
  // Stop running execution
  ipcMain.handle(
    'workflow:stop',
    async (event, executionId: string) => {
      try {
        console.log(`[IPC] workflow:stop called for execution ${executionId}`);
        
        const stopped = workflowExecutor.stopExecution(executionId);
        
        return {
          success: true,
          data: { stopped },
        };
      } catch (error: any) {
        console.error('[IPC] workflow:stop error:', error);
        
        return {
          success: false,
          error: {
            message: error.message,
            name: error.name,
          },
        };
      }
    }
  );
  
  // Get active executions
  ipcMain.handle(
    'workflow:get-active',
    async (event) => {
      try {
        const activeExecutions = workflowExecutor.getActiveExecutions();
        
        return {
          success: true,
          data: activeExecutions,
        };
      } catch (error: any) {
        console.error('[IPC] workflow:get-active error:', error);
        
        return {
          success: false,
          error: {
            message: error.message,
            name: error.name,
          },
        };
      }
    }
  );
  
  // Check Python environment
  ipcMain.handle(
    'python:check',
    async (event) => {
      try {
        console.log('[IPC] python:check called');
        
        const status = await pythonEnvironment.getStatus();
        
        return {
          success: true,
          data: status,
        };
      } catch (error: any) {
        console.error('[IPC] python:check error:', error);
        
        return {
          success: false,
          error: {
            message: error.message,
            name: error.name,
          },
        };
      }
    }
  );
  
  // Install Python dependencies
  ipcMain.handle(
    'python:install-deps',
    async (event, packages: string[]) => {
      try {
        console.log(`[IPC] python:install-deps called for packages: ${packages.join(', ')}`);
        
        const result = await pythonEnvironment.installPackages(packages);
        
        return {
          success: result.success,
          data: result,
        };
      } catch (error: any) {
        console.error('[IPC] python:install-deps error:', error);
        
        return {
          success: false,
          error: {
            message: error.message,
            name: error.name,
          },
        };
      }
    }
  );
  
  console.log('[IPC] Workflow execution handlers registered');
}

/**
 * Extract environment variables from workflow node configurations
 * 
 * Looks for API keys in node configs and maps them to environment variables
 * that will be passed to the Python subprocess.
 * 
 * @param workflow - Workflow with configured nodes
 * @returns Environment variables object
 */
function extractEnvironmentVariables(workflow: Workflow): Record<string, string> {
  const env: Record<string, string> = {};
  
  // Iterate through nodes and extract API keys
  for (const node of workflow.nodes) {
    const config = node.config || {};
    
    // Map node types to environment variables
    switch (node.type) {
      case 'anthropic':
      case 'claudeChat':
        if (config.apiKey) {
          env.ANTHROPIC_API_KEY = config.apiKey;
        }
        break;
        
      case 'openai':
      case 'gptChat':
        if (config.apiKey) {
          env.OPENAI_API_KEY = config.apiKey;
        }
        break;
        
      case 'groq':
        if (config.apiKey) {
          env.GROQ_API_KEY = config.apiKey;
        }
        break;
    }
  }
  
  return env;
}

/**
 * Type definitions for IPC responses
 */

export interface IPCResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    name: string;
    stack?: string;
  };
}
```

---

### File 2: Update `electron/preload.ts`

Add workflow execution API to the preload script:

```typescript
import { contextBridge, ipcRenderer } from 'electron';

// Expose workflow execution API to renderer process
contextBridge.exposeInMainWorld('electron', {
  // ... existing APIs ...
  
  workflow: {
    /**
     * Execute workflow with trigger data
     * 
     * @param workflowId - Workflow ID to execute
     * @param triggerData - Simulated request or other trigger data
     * @returns Promise<WorkflowExecution>
     */
    execute: (workflowId: string, triggerData: any) =>
      ipcRenderer.invoke('workflow:execute', workflowId, triggerData),
    
    /**
     * Stop running execution
     * 
     * @param executionId - Execution ID to stop
     * @returns Promise<boolean>
     */
    stop: (executionId: string) =>
      ipcRenderer.invoke('workflow:stop', executionId),
    
    /**
     * Get list of active executions
     * 
     * @returns Promise<string[]>
     */
    getActive: () =>
      ipcRenderer.invoke('workflow:get-active'),
  },
  
  python: {
    /**
     * Check Python environment status
     * 
     * @returns Promise<ValidationStatus>
     */
    check: () =>
      ipcRenderer.invoke('python:check'),
    
    /**
     * Install missing Python packages
     * 
     * @param packages - Package names to install
     * @returns Promise<InstallResult>
     */
    installDeps: (packages: string[]) =>
      ipcRenderer.invoke('python:install-deps', packages),
  },
});
```

---

### File 3: Type definitions for renderer

Create `src/types/electron.d.ts`:

```typescript
/**
 * Type definitions for Electron IPC API
 */

import type { WorkflowExecution, SimulatedRequest } from '@/core/execution/types';

export interface WorkflowAPI {
  execute(workflowId: string, triggerData: SimulatedRequest): Promise<IPCResponse<WorkflowExecution>>;
  stop(executionId: string): Promise<IPCResponse<{ stopped: boolean }>>;
  getActive(): Promise<IPCResponse<string[]>>;
}

export interface PythonAPI {
  check(): Promise<IPCResponse<ValidationStatus>>;
  installDeps(packages: string[]): Promise<IPCResponse<InstallResult>>;
}

export interface IPCResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    name: string;
    stack?: string;
  };
}

export interface ValidationStatus {
  isValid: boolean;
  error?: string;
  pythonVersion: { major: number; minor: number; patch: number } | null;
  missingPackages: string[];
}

export interface InstallResult {
  success: boolean;
  installedPackages: string[];
  output?: string;
  error?: string;
}

declare global {
  interface Window {
    electron: {
      workflow: WorkflowAPI;
      python: PythonAPI;
      // ... other existing APIs ...
    };
  }
}
```

---

### File 4: Update `electron/main.ts`

Register handlers on app startup:

```typescript
import { app, BrowserWindow } from 'electron';
import { registerWorkflowExecutionHandlers } from './workflow-execution-handlers';
// ... other imports ...

app.whenReady().then(() => {
  // Register IPC handlers
  registerWorkflowExecutionHandlers();
  
  // ... rest of app initialization ...
});
```

---

## Testing

### Unit Tests

```typescript
describe('Workflow Execution IPC Handlers', () => {
  beforeAll(() => {
    registerWorkflowExecutionHandlers();
  });
  
  it('should handle workflow:execute', async () => {
    const mockWorkflow = createMockWorkflow();
    const mockTriggerData = {
      method: 'POST',
      body: { test: true },
    };
    
    // Mock ipcMain.handle call
    const response = await simulateIPCCall(
      'workflow:execute',
      mockWorkflow.id,
      mockTriggerData
    );
    
    expect(response.success).toBe(true);
    expect(response.data).toHaveProperty('id');
    expect(response.data).toHaveProperty('status');
  });
  
  it('should handle workflow:stop', async () => {
    const executionId = 'exec_123';
    
    const response = await simulateIPCCall(
      'workflow:stop',
      executionId
    );
    
    expect(response.success).toBe(true);
  });
  
  it('should handle python:check', async () => {
    const response = await simulateIPCCall('python:check');
    
    expect(response.success).toBe(true);
    expect(response.data).toHaveProperty('isValid');
    expect(response.data).toHaveProperty('pythonVersion');
  });
  
  it('should handle errors gracefully', async () => {
    const response = await simulateIPCCall(
      'workflow:execute',
      'invalid_workflow_id',
      {}
    );
    
    expect(response.success).toBe(false);
    expect(response.error).toBeDefined();
    expect(response.error.message).toContain('not found');
  });
});
```

### Integration Tests

```typescript
describe('IPC Integration', () => {
  it('should execute workflow end-to-end via IPC', async () => {
    // Create test workflow
    const workflow = await createTestWorkflow();
    
    // Call IPC handler from renderer process (simulated)
    const response = await window.electron.workflow.execute(
      workflow.id,
      {
        method: 'POST',
        body: { query: 'test' },
      }
    );
    
    // Verify response
    expect(response.success).toBe(true);
    expect(response.data.status).toBe('success');
    
    // Verify logged to database
    const execution = await executionLogger.getExecution(response.data.id);
    expect(execution).toBeDefined();
  });
});
```

---

## Error Handling

### Error Response Format

All IPC handlers return consistent error format:

```typescript
{
  success: false,
  error: {
    message: "Workflow not found",
    name: "NotFoundError",
    stack: "Error: Workflow not found\n  at ..."
  }
}
```

### Common Errors

| Error | Status Code | User Message |
|-------|-------------|--------------|
| Workflow not found | `NotFoundError` | "Workflow not found. Please select a valid workflow." |
| Python not found | `PythonNotFoundError` | "Python 3.11+ not installed. Please install Python to execute workflows." |
| Missing dependencies | `DependencyError` | "Missing Python packages. Would you like to install them?" |
| Execution timeout | `TimeoutError` | "Workflow execution timed out after 60s." |
| Runtime error | `ExecutionError` | "Workflow execution failed: {error message}" |

---

## Security Considerations

- [ ] API keys extracted from node config (not stored in execution logs)
- [ ] Workflow ID validated before loading
- [ ] No arbitrary code execution from renderer
- [ ] Error messages don't expose sensitive data
- [ ] Environment variables passed securely to subprocess

---

## Performance Considerations

**IPC Overhead:**
- Single IPC call: ~5-10ms
- Large payload (workflow): ~20-30ms
- Acceptable for user-initiated operations

**Optimization:**
- Don't pass full workflow via IPC (load from manifest)
- Stream execution logs if needed (future)
- Cache Python validation results

---

## Usage Examples

### From React Component

```typescript
// In RequestSimulator.tsx
const handleRunWorkflow = async () => {
  try {
    setLoading(true);
    
    const response = await window.electron.workflow.execute(
      workflowId,
      simulatedRequest
    );
    
    if (response.success) {
      toast.success('Workflow executed successfully!');
      console.log('Execution:', response.data);
    } else {
      toast.error(response.error.message);
    }
  } catch (error) {
    console.error('IPC error:', error);
    toast.error('Failed to execute workflow');
  } finally {
    setLoading(false);
  }
};
```

### Check Python Environment

```typescript
// In PythonSetupDialog.tsx
const checkPythonStatus = async () => {
  const response = await window.electron.python.check();
  
  if (response.success) {
    const status = response.data;
    
    if (!status.isValid) {
      setError(status.error);
      setMissingPackages(status.missingPackages);
    }
  }
};
```

### Install Dependencies

```typescript
const installMissingDeps = async () => {
  setInstalling(true);
  
  const response = await window.electron.python.installDeps(
    missingPackages
  );
  
  if (response.success && response.data.success) {
    toast.success('Dependencies installed successfully!');
    await checkPythonStatus(); // Re-check
  } else {
    toast.error('Failed to install dependencies');
  }
  
  setInstalling(false);
};
```

---

## Success Criteria

- [ ] All IPC handlers registered
- [ ] Preload script exposes APIs
- [ ] Type definitions created
- [ ] Error handling works
- [ ] Integration with WorkflowExecutor
- [ ] Integration with PythonEnvironment
- [ ] Test coverage >85%

---

**Status:** 🔵 Ready for Implementation  
**Estimated Effort:** 2-3 hours  
**Confidence:** 9/10
