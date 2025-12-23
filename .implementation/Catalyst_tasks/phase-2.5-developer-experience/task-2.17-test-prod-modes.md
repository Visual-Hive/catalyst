# Task 2.17: Test vs Production Execution Modes

**Phase:** Phase 2.5 - Developer Experience & Testing  
**Duration Estimate:** 2-3 days  
**Status:** 🔵 Not Started  
**Priority:** HIGH - Critical for webhook testing UX  
**Dependencies:** Task 2.11 (Execution Logging), Task 2.13 (Data Pinning)

---

## Problem Statement

**n8n's approach (works because it's server-side):**
- Test mode: Run workflows in connected environment, external webhooks can reach it
- Production mode: Activate workflow, runs in background

**Catalyst's challenge:**
- We're local-first (Electron app)
- Can't receive external webhooks on localhost without tunneling (annoying)
- Need clean testing UX without forcing users to setup ngrok/tunneling

---

## Solution: Hybrid Test/Production Architecture

### Core Concept

Don't fight the local-first architecture - embrace it with smart request capture & replay.

```
┌─────────────────────────────────────────────────────┐
│ TEST MODE (Local in Catalyst)                       │
├─────────────────────────────────────────────────────┤
│ ✓ Manual triggers: Click "Run Test" button         │
│ ✓ HTTP triggers: Simulate request OR use pinned    │
│ ✓ Can replay real production requests locally      │
│ ✓ Full execution logging (marked as "test")        │
│ ✓ Fast iteration, no deployment needed             │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│ PRODUCTION MODE (Deployed to server)                │
├─────────────────────────────────────────────────────┤
│ ✓ Real webhooks from external services             │
│ ✓ Execution logs (marked as "production")          │
│ ✓ Optional: Sync logs back to dev machine          │
│ ✓ Can toggle workflow on/off from Catalyst UI      │
└─────────────────────────────────────────────────────┘
```

### Testing HTTP Triggers: Three Options

**Option 1: Request Simulator** (Best for development)
```
[HTTP Endpoint Node]
  → Right-click → "Simulate Request"
  → Modal opens:
     Method: [POST ▼]
     Headers: { "Content-Type": "application/json" }
     Body: { "user_id": 123, "action": "purchase" }
  → [Run Test] → Executes locally
```

**Option 2: Pin Production Request** (Best for debugging real issues)
```
[Production webhook receives real request]
  → View in Execution History
  → Right-click execution → "Pin Request as Test Data"
  → HTTP trigger node now uses this pinned request
  → Can test locally with real production data
```

**Option 3: Optional Tunnel** (For advanced users who need it)
```
[Catalyst] → [ngrok/cloudflared tunnel] → [localhost:3000]
  ↑
[External webhook] can now reach local test server
Note: We don't force this, just document it as option
```

---

## Implementation Plan

### Milestone 1: Add Execution Mode to Schema

**Update:** `src/core/execution/types.ts`

```typescript
export interface WorkflowExecution {
  id: string;
  workflowId: string;
  workflowName: string;
  executionMode: 'test' | 'production'; // NEW
  status: 'running' | 'success' | 'error';
  startedAt: string;
  completedAt?: string;
  durationMs?: number;
  trigger: {
    type: string;
    data: any;
    isSimulated?: boolean; // NEW - marks simulated requests
  };
  nodeExecutions: NodeExecution[];
  error?: {
    message: string;
    stack?: string;
    nodeId?: string;
  };
}
```

**Update:** `electron/execution-logger.ts` (SQLite schema)

```sql
ALTER TABLE executions ADD COLUMN execution_mode TEXT DEFAULT 'test';
ALTER TABLE executions ADD COLUMN is_simulated BOOLEAN DEFAULT 0;
```

---

### Milestone 2: Request Simulator UI

**File:** `src/renderer/components/WorkflowCanvas/RequestSimulator.tsx`

```typescript
interface RequestSimulatorProps {
  nodeId: string;
  onRun: (simulatedRequest: any) => void;
  onClose: () => void;
}

export function RequestSimulator({ nodeId, onRun, onClose }: RequestSimulatorProps) {
  const [method, setMethod] = useState('POST');
  const [headers, setHeaders] = useState('{\n  "Content-Type": "application/json"\n}');
  const [body, setBody] = useState('{\n  "example": "data"\n}');
  
  const handleRun = () => {
    const simulatedRequest = {
      method,
      headers: JSON.parse(headers),
      body: JSON.parse(body),
      query: {},
      params: {}
    };
    onRun(simulatedRequest);
    onClose();
  };
  
  return (
    <Modal title="Simulate HTTP Request" onClose={onClose}>
      <div className="space-y-4">
        <Select label="Method" value={method} onChange={setMethod}>
          <option value="GET">GET</option>
          <option value="POST">POST</option>
          <option value="PUT">PUT</option>
          <option value="DELETE">DELETE</option>
        </Select>
        
        <CodeEditor
          label="Headers (JSON)"
          value={headers}
          onChange={setHeaders}
          language="json"
        />
        
        <CodeEditor
          label="Body (JSON)"
          value={body}
          onChange={setBody}
          language="json"
        />
        
        <div className="flex gap-2 justify-end">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={handleRun}>Run Test</Button>
        </div>
      </div>
    </Modal>
  );
}
```

---

### Milestone 3: Context Menu Integration

**Update:** `src/renderer/components/WorkflowCanvas/NodeContextMenu.tsx`

```typescript
// Add to context menu for HTTP endpoint nodes
if (node.type === 'httpEndpoint') {
  menuItems.push({
    label: '🌐 Simulate Request',
    onClick: () => setShowRequestSimulator(true)
  });
}

// Render simulator modal
{showRequestSimulator && (
  <RequestSimulator
    nodeId={selectedNode.id}
    onRun={(request) => handleSimulatedRequest(request)}
    onClose={() => setShowRequestSimulator(false)}
  />
)}
```

---

### Milestone 4: Pin Production Request Feature

**Update:** `src/renderer/components/ExecutionHistory/ExecutionDetailPanel.tsx`

```typescript
// Add action button in execution detail view
<Button
  onClick={() => handlePinRequest(execution)}
  disabled={execution.trigger.type !== 'http'}
>
  📌 Pin Request as Test Data
</Button>

function handlePinRequest(execution: WorkflowExecution) {
  // Find the HTTP trigger node
  const triggerNode = workflow.nodes.find(n => n.type === 'httpEndpoint');
  
  if (triggerNode) {
    // Pin the production request data
    updateNodeConfig(triggerNode.id, {
      pinnedData: {
        method: execution.trigger.data.method,
        headers: execution.trigger.data.headers,
        body: execution.trigger.data.body,
        query: execution.trigger.data.query,
        _captured: execution.startedAt, // When this was captured
        _executionId: execution.id
      }
    });
    
    toast.success('Request pinned! Next test run will use this data.');
  }
}
```

---

### Milestone 5: Production Deployment Config

**New File:** `src/core/deployment/types.ts`

```typescript
export interface ProductionDeployment {
  id: string;
  workflowId: string;
  deployedAt: string;
  status: 'active' | 'inactive';
  endpoint: string; // e.g., "https://my-workflow.example.com"
  logWebhook?: string; // Optional: POST execution logs here
  environment: {
    [key: string]: string; // Environment variables for production
  };
}
```

**UI Component:** `src/renderer/components/Deployment/DeploymentPanel.tsx`

```typescript
export function DeploymentPanel({ workflow }: { workflow: Workflow }) {
  const [deployment, setDeployment] = useState<ProductionDeployment | null>(null);
  
  return (
    <Panel title="Production Deployment">
      {!deployment ? (
        <div className="text-center py-8">
          <p className="text-gray-600 mb-4">
            This workflow is not deployed to production yet.
          </p>
          <Button onClick={handleDeploy}>
            🚀 Deploy to Production
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">Production Endpoint</label>
            <code className="block mt-1 p-2 bg-gray-100 rounded">
              {deployment.endpoint}
            </code>
          </div>
          
          <Toggle
            label="Workflow Active"
            checked={deployment.status === 'active'}
            onChange={(active) => handleToggleActive(active)}
          />
          
          <div>
            <label className="text-sm font-medium">
              Sync Logs to Catalyst (Optional)
            </label>
            <input
              type="text"
              placeholder="https://my-catalyst.example.com/webhook"
              value={deployment.logWebhook || ''}
              onChange={(e) => handleUpdateLogWebhook(e.target.value)}
              className="w-full mt-1 px-3 py-2 border rounded"
            />
            <p className="text-xs text-gray-500 mt-1">
              If provided, production execution logs will be sent here
            </p>
          </div>
        </div>
      )}
    </Panel>
  );
}
```

---

### Milestone 6: Update Generated Python

**Update:** `src/core/codegen/python/WorkflowOrchestrator.ts`

```typescript
// Add execution mode parameter
private generateMainFunction(workflow: Workflow, executionMode: 'test' | 'production'): string {
  return `
# ============================================================================
# MAIN EXECUTION FUNCTION
# ============================================================================

async def execute_workflow(trigger_data: dict, execution_mode: str = "${executionMode}"):
    """
    Execute the workflow with given trigger data.
    
    Args:
        trigger_data: Input data from trigger
        execution_mode: "test" or "production"
    """
    execution_id = str(uuid.uuid4())
    execution_start = datetime.now()
    
    execution_data = {
        "id": execution_id,
        "workflowId": "${workflow.id}",
        "workflowName": "${workflow.name}",
        "executionMode": execution_mode,
        "status": "running",
        "startedAt": execution_start.isoformat(),
        "trigger": {
            "type": "${workflow.nodes.find(n => n.data.isEntry)?.type}",
            "data": trigger_data,
            "isSimulated": execution_mode == "test"
        },
        "nodeExecutions": []
    }
    
    try:
        # Execute workflow...
        result = await run_workflow(trigger_data)
        
        execution_data["status"] = "success"
        execution_data["completedAt"] = datetime.now().isoformat()
        execution_data["durationMs"] = int((datetime.now() - execution_start).total_seconds() * 1000)
        
    except Exception as e:
        execution_data["status"] = "error"
        execution_data["error"] = {"message": str(e), "stack": traceback.format_exc()}
    
    # Log execution (local SQLite or webhook)
    await log_execution(execution_data, execution_mode)
    
    return execution_data
  `;
}
```

---

## Testing Strategy

### Manual Testing Checklist

**Test Mode:**
- [ ] Click "Run Test" on manual trigger workflow → executes locally
- [ ] Right-click HTTP node → "Simulate Request" → modal opens
- [ ] Enter request data → "Run Test" → workflow executes with simulated request
- [ ] Execution appears in history with `executionMode: "test"`
- [ ] View production execution → "Pin Request" → data pinned to node
- [ ] Run test again → uses pinned production data

**Production Mode:**
- [ ] Deploy workflow to test server
- [ ] Send real webhook → workflow executes
- [ ] Execution logged with `executionMode: "production"`
- [ ] If log webhook configured → execution synced to dev Catalyst

### Integration Tests

```typescript
describe('Test vs Production Execution Modes', () => {
  it('should mark local test runs as test mode', async () => {
    const execution = await runLocalTest(workflow, simulatedRequest);
    expect(execution.executionMode).toBe('test');
    expect(execution.trigger.isSimulated).toBe(true);
  });
  
  it('should allow pinning production request data', async () => {
    const prodExecution = createMockProductionExecution();
    await pinRequestAsTestData(prodExecution);
    
    const node = getNode(workflow, 'httpEndpoint');
    expect(node.config.pinnedData).toBeDefined();
    expect(node.config.pinnedData._executionId).toBe(prodExecution.id);
  });
  
  it('should use pinned data when running test', async () => {
    const pinnedRequest = { method: 'POST', body: { test: 'data' } };
    await pinData(httpNode, pinnedRequest);
    
    const execution = await runLocalTest(workflow);
    expect(execution.trigger.data).toEqual(pinnedRequest);
  });
});
```

---

## User Stories

### Story 1: Developer Testing Locally
```
As a workflow developer,
I want to test HTTP-triggered workflows locally
Without setting up tunneling or deploying to production
So I can iterate quickly
```

**Acceptance:**
- Can simulate HTTP requests with custom data
- Can pin real production requests for local testing
- Execution logs clearly marked as "test"

### Story 2: Debugging Production Issues
```
As a workflow developer,
When a production webhook fails
I want to capture that exact request
And replay it locally to debug
So I can fix the issue without affecting production
```

**Acceptance:**
- Can view production execution in history
- Can pin that request to HTTP trigger node
- Local test uses exact production data
- Can iterate until fixed, then redeploy

### Story 3: Production Monitoring
```
As a workflow operator,
I want to see production executions in Catalyst
Even though the workflow runs on a remote server
So I can monitor health and debug issues
```

**Acceptance:**
- Production logs can sync to dev Catalyst (optional)
- Execution history shows both test and prod runs
- Can filter by execution mode
- Production executions clearly distinguished

---

## Design Decisions

### Decision 1: No Forced Tunneling

**Options:**
1. Force users to setup ngrok/cloudflared for local testing
2. Embed tunneling in Catalyst (complex, security concerns)
3. **Chosen:** Request simulation + production request capture

**Rationale:**
- Tunneling is annoying setup for most users
- Most testing can be done with simulated/pinned data
- Advanced users can setup tunneling themselves if needed
- Simpler, more predictable testing experience

### Decision 2: Optional Production Log Sync

**Options:**
1. Always sync production logs to dev machine
2. Never sync (only view on server)
3. **Chosen:** Optional webhook for log sync

**Rationale:**
- Some users want centralized monitoring (sync enabled)
- Others prefer production logs stay on server (sync disabled)
- Webhook approach is simple and flexible
- No complex bidirectional sync protocol needed

### Decision 3: Pin Request vs Save as Test Fixture

**Options:**
1. Pin directly to node (data lives in workflow manifest)
2. Save as separate test fixture file
3. **Chosen:** Pin to node (leverages existing Task 2.13)

**Rationale:**
- Reuses existing data pinning infrastructure
- Data stays with workflow (portable)
- Simpler mental model
- Can still export/share pinned data if needed

---

## Success Criteria

- [ ] Can simulate HTTP requests for local testing
- [ ] Can pin production requests to nodes
- [ ] Local test runs marked as "test" mode
- [ ] Production runs (when deployed) marked as "production" mode
- [ ] Execution history filters by mode
- [ ] Optional production log sync webhook works
- [ ] No forced tunneling setup required
- [ ] Documentation includes deployment guide
- [ ] Test coverage >85%

---

## Security Considerations

- [ ] Simulated requests validated before execution
- [ ] Production log webhook requires authentication token
- [ ] Pinned request data sanitized (no secrets exposed)
- [ ] Execution mode cannot be spoofed
- [ ] Production deployment uses separate environment variables

---

## Documentation Requirements

### User Guide: "Testing Workflows with HTTP Triggers"

Topics to cover:
1. **Local Testing Options**
   - Simulate requests manually
   - Pin production data
   - Optional tunneling setup

2. **Production Deployment**
   - Where to deploy (Docker, VPS, cloud)
   - Setting up webhooks
   - Monitoring production executions

3. **Best Practices**
   - Use simulated requests for happy path testing
   - Pin production failures for debugging
   - Keep test and prod data separate
   - Use environment variables for secrets

---

## Follow-up Tasks (Future)

- **Task X.X:** Deployment automation (one-click deploy to Docker/VPS)
- **Task X.X:** Production log aggregation dashboard
- **Task X.X:** Request diff viewer (compare test vs prod data)
- **Task X.X:** Scheduled execution for production workflows

---

**Task Status:** 🔵 Ready for Implementation  
**Dependencies Met:** After Task 2.11 (Logging) and Task 2.13 (Pinning)  
**Estimated Effort:** 2-3 days  
**Confidence:** 8/10 - Clean architecture, builds on existing systems
