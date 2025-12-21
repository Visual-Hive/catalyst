# Phase 2.5: Developer Experience & Testing
## Making Catalyst Actually Usable for Building Workflows

**Duration:** 2-3 weeks  
**Status:** 🔵 Not Started  
**Dependencies:** Phase 2 (LLM Integration) must be complete

---

## Overview

Phase 2 gave us Python code generation and LLM integration, but Catalyst isn't truly usable yet because:
- ❌ No way to configure nodes visually (properties panel missing)
- ❌ No way to test individual nodes (all-or-nothing testing)
- ❌ No execution history to learn from past runs
- ❌ No way to pin test data to nodes
- ❌ Data doesn't flow through nodes properly (n8n's "dunno which item" problem)

This phase fixes all of that, transforming Catalyst from a prototype into a productive workflow builder.

### Key Goals

1. **Visual Configuration** - Properties panel for node configuration
2. **Execution Tracking** - SQLite-based execution logging
3. **History Viewer** - UI for browsing past executions
4. **Data Pinning** - Pin JSON data to nodes for testing
5. **Step Debugging** - Execute workflows node-by-node
6. **Data Passthrough** - Solve n8n's "unknown item" problem

---

## Phase 2.5 Tasks

### Task 2.10: Workflow Properties Panel (2-3 days)
**File:** `task-2.10-properties-panel.md`

Build visual properties panel for node configuration.

**Key Deliverables:**
- Right-side properties panel component
- Dynamic form generator based on node type
- Config field metadata in node registry
- Real-time config updates to workflow store

**Why Critical:** Without this, users can't configure nodes - everything is hardcoded.

---

### Task 2.11: Execution Logging System (1-2 days)
**File:** `task-2.11-execution-logging.md`

Log all workflow executions to SQLite database.

**Key Deliverables:**
- SQLite database with execution schema
- ExecutionLogger class
- IPC handlers for execution history
- Generated Python sends logs back to editor

**Why Important:** Foundation for execution history, debugging, and learning.

---

### Task 2.12: Execution History Viewer UI (1-2 days)
**File:** `task-2.12-execution-history-ui.md`

Build UI for browsing and inspecting past executions.

**Key Deliverables:**
- Execution history panel
- Timeline view of node-by-node execution
- Filter by status (success/error)
- Expandable node details with input/output

**Why Important:** Makes execution logging useful - can see what happened.

---

### Task 2.13: Node Data Pinning System (1 day)
**File:** `task-2.13-node-pinning.md`

Pin JSON data to nodes for testing without running full workflow.

**Key Deliverables:**
- Right-click context menu with "Pin Data"
- JSON editor modal
- Visual indicator for pinned nodes
- Generated Python uses pinned data

**Why Important:** Critical for testing individual nodes and iterating on workflow logic.

---

### Task 2.14: Node-by-Node Execution (2 days)
**File:** `task-2.14-node-execution.md`

Execute workflow up to specific node, step through debugging.

**Key Deliverables:**
- "Execute to Here" in context menu
- Partial workflow generation
- Debugger UI with step controls
- Current node highlighting

**Why Useful:** Advanced debugging feature like n8n's "Execute to here".

**Note:** Can be deferred if timeline is tight (confidence 7/10).

---

### Task 2.15: Copy Execution to Canvas (1 day)
**File:** `task-2.15-copy-execution.md`

Copy execution data to canvas as pinned data.

**Key Deliverables:**
- "Copy to Canvas" button in execution details
- Pins all node outputs automatically
- Success notification

**Why Useful:** Freeze good execution results for further development.

**Note:** Nice-to-have, can be deferred (confidence 9/10).

---

### Task 2.16: Data Passthrough Architecture (2-3 days)
**File:** `task-2.16-data-passthrough.md`

Solve n8n's "dunno which item" problem with optional data passthrough.

**Key Deliverables:**
- Passthrough toggle on all nodes
- ExecutionContext tracks data lineage
- Expression support for {{origin.field}}
- No more "unknown item" errors

**Why Critical:** Prevents n8n's biggest pain point - losing track of data between nodes.

**Note:** Complex feature (confidence 6/10), may need extra time.

---

## Task Dependencies

```
Phase 2 Complete
      ↓
   Task 2.10 (Properties Panel) ──┬──> Task 2.11 (Execution Logging)
                                   │           ↓
                                   │    Task 2.12 (History Viewer)
                                   │           ↓
                                   │    Task 2.13 (Node Pinning)
                                   │           ↓
                                   │    Task 2.15 (Copy to Canvas)
                                   │
                                   └──> Task 2.16 (Data Passthrough)
   
   Task 2.11 + 2.12 + 2.13 → Task 2.14 (Node-by-Node Execution)
```

**Critical Path:** Task 2.10 → Task 2.11 → Task 2.12 → Task 2.13 → Task 2.16

**Optional:** Task 2.14, Task 2.15 (can be deferred to Phase 2.6 if needed)

---

## Success Criteria

### Technical Requirements
- [ ] Properties panel works for all node types
- [ ] Execution logging captures all workflow runs
- [ ] History UI displays executions with node details
- [ ] Node pinning allows testing individual nodes
- [ ] Data passthrough prevents "unknown item" errors
- [ ] Test coverage >85%

### Usability Requirements
- [ ] Can configure any node without writing code
- [ ] Can test individual nodes with sample data
- [ ] Can see what happened in past executions
- [ ] Can iterate on workflow logic quickly
- [ ] No data loss between nodes

### Performance Targets
- [ ] Properties panel updates <16ms (no jank)
- [ ] Execution history loads <200ms
- [ ] SQLite queries <50ms
- [ ] Node pinning UI responsive (<100ms)

---

## Key Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Config metadata location | Node registry | Centralized, type-safe, used by both canvas and codegen |
| Form generation | Dynamic based on metadata | DRY principle, no duplication of field definitions |
| Execution storage | SQLite | Local-first, fast queries, no external dependencies |
| Data pinning format | JSON in node config | Simple, serializable, works with existing workflow store |
| Passthrough implementation | Optional toggle per node | Opt-in, backwards compatible, explicit control |
| History viewer architecture | React components + IPC | Separation of concerns, reusable components |

---

## Implementation Timeline

### Week 1
- **Days 1-3:** Task 2.10 (Properties Panel)
  - Design form system
  - Implement dynamic form generation
  - Add config fields to all node types
  - Test with each node type

- **Days 4-5:** Task 2.11 (Execution Logging)
  - Design SQLite schema
  - Implement ExecutionLogger
  - Add logging to generated Python
  - Test end-to-end

### Week 2
- **Days 1-2:** Task 2.12 (History Viewer) + Task 2.13 (Pinning)
  - Build history UI
  - Implement pin data modal
  - Test with real executions
  
- **Days 3-5:** Task 2.16 (Data Passthrough)
  - Design lineage tracking
  - Update ExecutionContext
  - Modify all node generators
  - Comprehensive testing

### Week 3 (Optional)
- **Days 1-2:** Task 2.14 (Node-by-Node Execution)
  - If time permits, otherwise defer
  
- **Day 3:** Task 2.15 (Copy Execution)
  - Quick win if time available

- **Days 4-5:** Integration testing, bug fixes, human review

---

## Phase 2.5 Deliverables Summary

| Task | Deliverable | Critical? | Confidence |
|------|-------------|-----------|------------|
| 2.10 | Properties Panel | ✅ YES | 7/10 |
| 2.11 | Execution Logging | ✅ YES | 8/10 |
| 2.12 | Execution History UI | ✅ YES | 8/10 |
| 2.13 | Node Pinning | ✅ YES | 8/10 |
| 2.14 | Node-by-Node Execution | ⚠️ NICE | 7/10 |
| 2.15 | Copy Execution to Canvas | ⚠️ NICE | 9/10 |
| 2.16 | Data Passthrough | ✅ YES | 6/10 |

---

## Human Review Checkpoints

**After Task 2.10:**
- [ ] Properties panel usable for all nodes
- [ ] Form validation working
- [ ] Config updates save correctly

**After Task 2.11:**
- [ ] Executions logged to SQLite
- [ ] Node-level data captured
- [ ] Python sends logs back to editor

**After Task 2.12:**
- [ ] History UI loads executions
- [ ] Timeline shows node execution
- [ ] Can inspect inputs/outputs

**After Task 2.13:**
- [ ] Can pin data via UI
- [ ] Pinned nodes show indicator
- [ ] Generated Python uses pinned data

**After Task 2.16:**
- [ ] Passthrough toggle works
- [ ] Data lineage tracked correctly
- [ ] No "unknown item" errors

**End of Phase 2.5:**
- [ ] All critical tasks complete
- [ ] Integration tested
- [ ] Ready for Phase 3 (Data Integration)

---

## Files Created This Phase

### Core Implementation
```
src/renderer/components/WorkflowCanvas/
├── WorkflowPropertiesPanel.tsx
├── NodeConfigForm.tsx
├── form-fields/
│   ├── DynamicFormField.tsx
│   ├── TextInput.tsx
│   ├── NumberInput.tsx
│   ├── SelectInput.tsx
│   ├── TextareaInput.tsx
│   ├── BooleanInput.tsx
│   └── SecretInput.tsx
├── NodeContextMenu.tsx
├── PinDataModal.tsx
└── WorkflowDebugger.tsx (optional)

src/renderer/components/ExecutionHistory/
├── ExecutionHistoryPanel.tsx
├── ExecutionListItem.tsx
├── ExecutionDetails.tsx
├── ExecutionTimeline.tsx
└── ExecutionData.tsx

electron/
├── execution-logger.ts
├── execution-handlers.ts
└── execution-receiver.ts

src/core/execution/
└── types.ts

src/core/codegen/python/templates/
└── execution-context.py.template (updated)
```

### Tests
```
tests/unit/
├── properties-panel.test.tsx
├── execution-logger.test.ts
├── node-pinning.test.ts
└── passthrough.test.ts
```

---

## Common Patterns

### Dynamic Form Generation Pattern
```typescript
// Define config fields in registry
configFields: [
  {
    path: 'apiKey',
    label: 'API Key',
    type: 'secret',
    required: true,
  },
  {
    path: 'model',
    label: 'Model',
    type: 'select',
    options: [...],
  },
]

// Form automatically generates based on metadata
<DynamicFormField field={field} value={value} onChange={onChange} />
```

### Execution Logging Pattern
```python
# In generated Python
execution_data = {
    "id": execution_id,
    "workflowId": "workflow-123",
    "nodeExecutions": []
}

# Log each node
execution_data["nodeExecutions"].append({
    "nodeId": "node-1",
    "status": "success",
    "input": input_data,
    "output": output_data,
})

# Send to editor
await log_execution(execution_data)
```

### Data Passthrough Pattern
```python
# ExecutionContext tracks lineage
context.set_node_output(
    node_id="node-2",
    output=new_data,
    parent_node_id="node-1",
    passthrough=True  # Merge parent data
)

# Result includes both old and new data
{
    "_origin": parent_data,
    "_current": new_data,
    **parent_data,
    **new_data
}
```

---

## Testing Strategy

### Unit Tests
- Properties panel components
- Form field components
- ExecutionLogger database ops
- Node pinning logic
- Passthrough data merging

### Integration Tests
- Configure node via properties panel
- Generate workflow with config
- Run workflow, verify logging
- Pin data, regenerate, verify used
- Enable passthrough, verify data merged

### Manual Tests
- Click through all node types
- Edit each field type
- View execution history
- Pin and unpin data
- Test with real workflows

---

## Security Considerations

- [ ] No sensitive data in execution logs (mask API keys)
- [ ] Pinned data validated before use
- [ ] SQLite database in secure location
- [ ] Expression evaluation still sandboxed
- [ ] No XSS in execution history viewer

---

## Performance Optimization Tips

1. **Properties Panel**: Use React.memo for form fields
2. **Execution History**: Virtual scrolling for long lists
3. **SQLite**: Index on workflow_id and started_at
4. **Data Pinning**: Debounce JSON editor changes
5. **Passthrough**: Only merge when enabled (opt-in)

---

## Common Pitfalls to Avoid

1. **Don't** hardcode form fields - use metadata
2. **Don't** buffer execution logs in memory - stream to SQLite
3. **Don't** show sensitive data in execution history
4. **Don't** make passthrough mandatory - keep it optional
5. **Don't** forget to close SQLite connections

---

## Next Steps After Phase 2.5

### Phase 3: Data Integration
- Qdrant vector database
- PostgreSQL queries
- HTTP requests/responses
- Directus CMS integration
- GraphQL queries

### Phase 4: Advanced Workflows
- Loops and iteration
- Conditional branching
- Error handling nodes
- Parallel execution
- Subworkflows

---

## References

- [CATALYST_PHASE_2_TASKS.md](../../docs/Catalyst%20documentation/CATALYST_PHASE_2_TASKS.md) - Phase 2 completion
- [CATALYST_SPECIFICATION.md](../../docs/Catalyst%20documentation/CATALYST_SPECIFICATION.md) - Overall architecture
- [.clinerules/implementation-standards.md](../../../.clinerules/implementation-standards.md) - Documentation standards
- [n8n Documentation](https://docs.n8n.io/) - Reference for features (execution history, pinning, etc.)

---

**Phase Status:** 🔵 Not Started  
**Ready for:** Implementation  
**Last Updated:** 2025-12-21
