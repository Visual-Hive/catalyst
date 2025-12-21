# Task 2.12: Execution History Viewer UI

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
Build a UI for browsing and inspecting past workflow executions. This makes the execution logging system (Task 2.11) useful by providing visual access to execution history with node-by-node details.

### Success Criteria
- [ ] Execution history panel displays all executions for a workflow
- [ ] Filter by status (all/success/error)
- [ ] Timeline view shows node-by-node execution
- [ ] Can expand nodes to see input/output data
- [ ] Error details displayed for failed executions
- [ ] Refresh button updates list
- [ ] Delete execution functionality
- [ ] Responsive UI (<200ms load time)
- [ ] Test coverage >85%

### References
- Phase 2.5 README.md - Execution History UI overview
- Task 2.11 - Execution Logging (provides data)
- n8n execution history for UX reference

### Dependencies
- Task 2.11 complete (execution logging working)
- IPC handlers functional
- React Flow canvas

---

## Milestones

### Milestone 1: Design UI Architecture
**Confidence:** 8/10  
**Status:** 🔵 Not Started  

#### Design Decisions

| Decision | Options Considered | Choice Made | Rationale | Confidence |
|----------|-------------------|-------------|-----------|------------|
| Layout | Modal, sidebar, separate tab | Sidebar panel | Keeps context, doesn't block canvas | 8/10 |
| List vs Timeline | List only, timeline only, tabs | Tabs with both | Flexibility for different use cases | 9/10 |
| Virtual scrolling | All items, virtual scroll | Virtual for >50 items | Performance with large history | 8/10 |
| Auto-refresh | Polling, manual, WebSocket | Manual refresh button | Simple, no overhead, user control | 9/10 |

---

### Milestone 2: Create ExecutionHistoryPanel
**Confidence:** 8/10  
**Status:** 🔵 Not Started  

#### Files Created
- `src/renderer/components/ExecutionHistory/ExecutionHistoryPanel.tsx`
- `src/renderer/components/ExecutionHistory/ExecutionListItem.tsx`
- `src/renderer/components/ExecutionHistory/ExecutionDetails.tsx`
- `src/renderer/components/ExecutionHistory/ExecutionTimeline.tsx`

#### Implementation

```typescript
/**
 * @file ExecutionHistoryPanel.tsx
 * @description Main execution history viewer
 * @architecture Phase 2.5, Task 2.12
 */

import React, { useEffect, useState } from 'react';
import { WorkflowExecution } from '@/core/execution/types';
import { RefreshCw, Filter } from 'lucide-react';

interface ExecutionHistoryPanelProps {
  workflowId: string;
}

export function ExecutionHistoryPanel({ workflowId }: ExecutionHistoryPanelProps) {
  const [executions, setExecutions] = useState<WorkflowExecution[]>([]);
  const [selectedExecution, setSelectedExecution] = useState<WorkflowExecution | null>(null);
  const [filter, setFilter] = useState<'all' | 'success' | 'error'>('all');
  const [loading, setLoading] = useState(false);
  
  useEffect(() => {
    loadExecutions();
  }, [workflowId]);
  
  const loadExecutions = async () => {
    setLoading(true);
    try {
      const result = await window.electronAPI.execution.getHistory(workflowId);
      setExecutions(result);
    } catch (error) {
      console.error('Failed to load executions:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const filteredExecutions = executions.filter((exec) => {
    if (filter === 'all') return true;
    return exec.status === filter;
  });
  
  return (
    <div className="h-full flex">
      {/* Execution List */}
      <div className="w-80 border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200 bg-white">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold">Execution History</h2>
            <button
              onClick={loadExecutions}
              disabled={loading}
              className="p-1 hover:bg-gray-100 rounded"
              title="Refresh"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
          
          {/* Filter */}
          <div className="flex gap-2">
            <FilterButton
              active={filter === 'all'}
              onClick={() => setFilter('all')}
              label="All"
              count={executions.length}
            />
            <FilterButton
              active={filter === 'success'}
              onClick={() => setFilter('success')}
              label="Success"
              count={executions.filter(e => e.status === 'success').length}
              color="green"
            />
            <FilterButton
              active={filter === 'error'}
              onClick={() => setFilter('error')}
              label="Error"
              count={executions.filter(e => e.status === 'error').length}
              color="red"
            />
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto">
          {filteredExecutions.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              {loading ? 'Loading...' : 'No executions found'}
            </div>
          ) : (
            filteredExecutions.map((execution) => (
              <ExecutionListItem
                key={execution.id}
                execution={execution}
                isSelected={selectedExecution?.id === execution.id}
                onClick={() => setSelectedExecution(execution)}
              />
            ))
          )}
        </div>
      </div>
      
      {/* Execution Details */}
      <div className="flex-1">
        {selectedExecution ? (
          <ExecutionDetails execution={selectedExecution} />
        ) : (
          <EmptyState />
        )}
      </div>
    </div>
  );
}
```

---

### Milestone 3: Create ExecutionTimeline
**Confidence:** 8/10  
**Status:** 🔵 Not Started  

#### Implementation

```typescript
/**
 * Timeline view showing node-by-node execution flow.
 */
export function ExecutionTimeline({ execution }: { execution: WorkflowExecution }) {
  return (
    <div className="space-y-4 p-4">
      {/* Workflow Started */}
      <TimelineItem
        icon={<Clock className="w-4 h-4" />}
        title="Workflow Started"
        subtitle={`Triggered via ${execution.trigger.type}`}
        timestamp={execution.startedAt}
        status="success"
      />
      
      {/* Node Executions */}
      {execution.nodeExecutions.map((nodeExec, index) => (
        <NodeTimelineItem
          key={index}
          nodeExecution={nodeExec}
        />
      ))}
      
      {/* Workflow Completed/Failed */}
      {execution.status === 'success' ? (
        <TimelineItem
          icon={<CheckCircle className="w-4 h-4" />}
          title="Workflow Completed"
          subtitle={`Duration: ${execution.durationMs}ms`}
          timestamp={execution.completedAt!}
          status="success"
        />
      ) : (
        <TimelineItem
          icon={<XCircle className="w-4 h-4" />}
          title="Workflow Failed"
          subtitle={execution.error?.message}
          timestamp={execution.completedAt!}
          status="error"
        />
      )}
    </div>
  );
}

function NodeTimelineItem({ nodeExecution }: { nodeExecution: NodeExecution }) {
  const [expanded, setExpanded] = useState(false);
  
  return (
    <div className="relative">
      {/* Timeline line */}
      <div className="absolute left-2 top-6 bottom-0 w-px bg-gray-200" />
      
      <div 
        className="relative flex items-start gap-3 cursor-pointer hover:bg-gray-50 p-2 rounded"
        onClick={() => setExpanded(!expanded)}
      >
        {/* Status indicator */}
        <div className={`w-4 h-4 rounded-full flex items-center justify-center ${
          nodeExecution.status === 'success' ? 'bg-green-500' :
          nodeExecution.status === 'error' ? 'bg-red-500' :
          'bg-blue-500'
        }`}>
          {nodeExecution.status === 'success' && <CheckCircle className="w-3 h-3 text-white" />}
          {nodeExecution.status === 'error' && <XCircle className="w-3 h-3 text-white" />}
        </div>
        
        {/* Node info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <span className="font-medium text-sm">{nodeExecution.nodeName}</span>
            {nodeExecution.durationMs && (
              <span className="text-xs text-gray-500">{nodeExecution.durationMs}ms</span>
            )}
          </div>
          <div className="text-xs text-gray-500">{nodeExecution.nodeType}</div>
        </div>
      </div>
      
      {/* Expanded details */}
      {expanded && (
        <div className="ml-7 mt-2 space-y-2">
          <DataBlock title="Input" data={nodeExecution.input} />
          {nodeExecution.output && <DataBlock title="Output" data={nodeExecution.output} />}
          {nodeExecution.error && <ErrorBlock error={nodeExecution.error} />}
        </div>
      )}
    </div>
  );
}
```

---

### Milestone 4: Add IPC Integration
**Confidence:** 9/10  
**Status:** 🔵 Not Started  

#### Files Modified
- `electron/preload.ts` - Add execution API

```typescript
// Add to preload.ts
execution: {
  getHistory: (workflowId: string, limit?: number, offset?: number) => 
    ipcRenderer.invoke('execution:get-history', workflowId, limit, offset),
  
  getDetails: (executionId: string) => 
    ipcRenderer.invoke('execution:get-details', executionId),
  
  delete: (executionId: string) => 
    ipcRenderer.invoke('execution:delete', executionId),
  
  clearWorkflow: (workflowId: string) => 
    ipcRenderer.invoke('execution:clear-workflow', workflowId),
}
```

---

### Milestone 5: Testing
**Confidence:** [X/10]  
**Status:** 🔵 Not Started  

#### Test Plan
- Load execution history
- Filter by status
- Select execution
- Expand node details
- Delete execution
- Refresh list

---

### Milestone 6: Human Review
**Status:** 🔵 Not Started  

#### Review Checklist
- [ ] UI intuitive and responsive
- [ ] Timeline clearly shows execution flow
- [ ] Error details helpful for debugging
- [ ] Ready for Task 2.13

---

## Final Summary

### Deliverables
- [ ] ExecutionHistoryPanel component
- [ ] ExecutionTimeline component
- [ ] Filter and refresh functionality
- [ ] Node detail expansion
- [ ] IPC integration
- [ ] Test coverage >85%

### Next Steps
- [ ] Task 2.13: Node Data Pinning System

---

**Task Status:** 🔵 Not Started  
**Last Updated:** 2025-12-21
