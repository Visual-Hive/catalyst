# Task 2.15: Copy Execution to Canvas (Optional)

**Phase:** Phase 2.5 - Developer Experience & Testing  
**Duration Estimate:** 1 day  
**Status:** 🔵 Not Started - OPTIONAL (can defer to Phase 2.6)  
**Confidence:** 9/10  
**Priority:** ⚠️ NICE-TO-HAVE  

---

## Task Overview

### Objective
Add "Copy to Canvas" button in execution details that automatically pins all node outputs from a past execution, allowing users to "freeze" successful execution data for further development.

### Success Criteria
- [ ] "Copy to Canvas" button in execution details
- [ ] Pins all node outputs automatically
- [ ] Success notification shown
- [ ] Can continue editing workflow with real data

### Why Optional
While useful, this is a convenience feature. Users can manually pin data to nodes using Task 2.13's functionality. Can be added in Phase 2.6.

---

## Implementation Summary

### Files to Modify
- `src/renderer/components/ExecutionHistory/ExecutionDetails.tsx` - Add button
- `electron/execution-handlers.ts` - Add copy-to-canvas handler

### Implementation

```typescript
// In ExecutionDetails.tsx
const handleCopyToCanvas = async () => {
  const result = await window.electronAPI.execution.copyToCanvas(execution.id);
  
  // Pin all nodes
  for (const pin of result.nodePins) {
    useWorkflowStore.getState().pinNodeData(
      result.workflowId,
      pin.nodeId,
      pin.data
    );
  }
  
  toast.success(`Pinned data from ${result.nodePins.length} nodes`);
};

// IPC Handler
ipcMain.handle('execution:copy-to-canvas', async (event, executionId: string) => {
  const execution = executionLogger.getExecution(executionId);
  if (!execution) throw new Error('Execution not found');
  
  return {
    workflowId: execution.workflowId,
    nodePins: execution.nodeExecutions.map((nodeExec) => ({
      nodeId: nodeExec.nodeId,
      data: nodeExec.output || nodeExec.input,
    })),
  };
});
```

---

## Decision: Defer to Phase 2.6

**Rationale:** Task 2.13 (Node Pinning) provides the core functionality. This is a workflow optimization that can wait until after critical features are stable.

---

**Task Status:** 🟡 Deferred to Phase 2.6  
**Last Updated:** 2025-12-21
