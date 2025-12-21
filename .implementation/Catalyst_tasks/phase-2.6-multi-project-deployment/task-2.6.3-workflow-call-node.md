# Task 2.6.3: Workflow Call Node (Sub-Workflows)

**Phase:** Phase 2.6 - Multi-Project System & Deployment Management  
**Duration Estimate:** 2-3 days  
**Actual Duration:** [To be filled when complete]  
**Status:** 🔵 Not Started  
**Assigned:** AI + Human Review  
**Started:** [YYYY-MM-DD]  
**Completed:** [YYYY-MM-DD]  

---

## Task Overview

### Objective
Implement a workflow call node that enables workflows to call other workflows, supporting both local calls (same project, no HTTP overhead) and HTTP calls (external projects).

This enables the sub-workflow pattern where complex workflows can be broken down into smaller, reusable workflows that call each other.

### Success Criteria
- [ ] `workflowCall` node appears in node palette
- [ ] Can select target workflow from dropdown (populated from project workflows)
- [ ] Local calls execute without HTTP overhead (direct function calls)
- [ ] HTTP calls work to external projects (network requests)
- [ ] Timeout handling works correctly
- [ ] Error messages are clear and actionable
- [ ] Can pass input data using template expressions
- [ ] Generated Python code is correct and efficient
- [ ] Test coverage >85%
- [ ] Human review completed

### References
- PHASE-2.6-TASKS.md - Task 2.6.3 details
- Task 2.6.1 - Uses project types
- Task 2.6.4 - Code generation integration
- .clinerules/implementation-standards.md

### Dependencies
- Task 2.6.1: Project Management System (complete)
- Expression system for template compilation
- Python code generation infrastructure

---

## Milestones

### Milestone 1: Add workflowCall to Node Registry
**Date:** [YYYY-MM-DD]  
**Confidence:** 9/10  
**Status:** 🔵 Not Started  
**Time Spent:** [X hours]  

#### Activities
- [ ] Add `workflowCall` definition to registry
- [ ] Define config fields (target workflow, call type, URL, input, timeout)
- [ ] Set node category to 'control'
- [ ] Add appropriate icon and color
- [ ] Test node appears in palette

#### Design Decisions

| Decision | Options Considered | Choice Made | Rationale | Confidence |
|----------|-------------------|-------------|-----------|------------|
| Call types | Local only, HTTP only, both | Both local and HTTP | Maximum flexibility | 10/10 |
| Input format | JSON, JavaScript object, template | Template with {{}} syntax | Consistent with other nodes | 9/10 |
| Timeout default | 10s, 30s, 60s | 30s | Balance of responsiveness and reliability | 8/10 |
| Target selection | Dropdown, text input | Dropdown (dynamic options) | Better UX, prevents typos | 9/10 |

#### Registry Entry

**File:** `src/core/workflow/nodes/registry.ts`

```typescript
workflowCall: {
  type: 'workflowCall',
  category: 'control',
  name: 'Call Workflow',
  description: 'Execute another workflow (local or HTTP)',
  icon: 'ArrowPath',
  color: 'green',
  configFields: [
    {
      path: 'targetWorkflowId',
      label: 'Target Workflow',
      type: 'select',
      required: true,
      options: [], // Populated dynamically from project workflows
      description: 'Which workflow to call',
    },
    {
      path: 'callType',
      label: 'Call Type',
      type: 'select',
      required: true,
      options: [
        { label: 'Local (same project, no HTTP)', value: 'local' },
        { label: 'HTTP (external project)', value: 'http' },
      ],
      description: 'How to call the workflow',
    },
    {
      path: 'httpUrl',
      label: 'HTTP URL',
      type: 'text',
      required: false,
      placeholder: 'https://other-project.railway.app/api/workflow',
      description: 'URL for HTTP calls (only if call type is HTTP)',
      condition: { path: 'callType', equals: 'http' },
    },
    {
      path: 'input',
      label: 'Input Data',
      type: 'textarea',
      required: false,
      placeholder: '{"userId": "{{input.userId}}", "action": "process"}',
      rows: 6,
      description: 'Data to pass to the workflow (supports {{}} templates)',
    },
    {
      path: 'timeout',
      label: 'Timeout (seconds)',
      type: 'number',
      required: false,
      placeholder: '30',
      min: 1,
      max: 300,
      description: 'Maximum time to wait for response',
    },
  ],
},
```

---

### Milestone 2: Create Workflow Call Code Generator
**Date:** [YYYY-MM-DD]  
**Confidence:** 8/10  
**Status:** 🔵 Not Started  
**Time Spent:** [X hours]  

#### Activities
- [ ] Create `src/core/codegen/python/nodes/control/workflowCall.py.ts`
- [ ] Implement `generateWorkflowCallNode()` function
- [ ] Implement local call generation
- [ ] Implement HTTP call generation
- [ ] Implement template expression compilation
- [ ] Add error handling (timeout, network errors)
- [ ] Add comprehensive comments

#### Implementation Structure

**File:** `src/core/codegen/python/nodes/control/workflowCall.py.ts`

**Key Functions:**
- `generateWorkflowCallNode()` - Main entry point
- `generateLocalWorkflowCall()` - Direct function call
- `generateHttpWorkflowCall()` - HTTP request
- `compileExpression()` - Template → Python code

**Local Call Strategy:**
```python
# Import target workflow function
from workflows.target_workflow import execute_target_workflow

# Call directly (shares execution context)
result = await execute_target_workflow(
    trigger_data=workflow_input,
    parent_context=context  # Share connections, config
)
```

**HTTP Call Strategy:**
```python
# Use httpx for async HTTP
import httpx

response = await context.http.post(
    url,
    json=workflow_input,
    timeout=30,
)
result = response.json()
```

---

### Milestone 3: Implement Local Workflow Calls
**Date:** [YYYY-MM-DD]  
**Confidence:** 8/10  
**Status:** 🔵 Not Started  
**Time Spent:** [X hours]  

#### Activities
- [ ] Generate import statement for target workflow
- [ ] Pass trigger data to target workflow
- [ ] Share execution context (connection pooling)
- [ ] Handle return value
- [ ] Add metadata (workflow name, call type)
- [ ] Test with sample workflows

#### Local Call Generated Code

```python
async def node_workflow_call_1(context: ExecutionContext) -> Any:
    """
    Call Workflow - Local Call
    
    Calls another workflow in the same project directly.
    No HTTP overhead - function is called in-process.
    Execution context is shared for connection pooling.
    """
    from workflows.extract_data import execute_extract_data
    
    # Get input from previous node
    input_data = context.get_node_output("node_http_endpoint_1")
    
    # Prepare input for called workflow
    # Template compilation: {{input.userId}} → input_data.get("userId")
    workflow_input = {
        "userId": input_data.get("userId"),
        "action": "process"
    }
    
    # Call workflow locally (no HTTP overhead!)
    # Share execution context for connection pooling
    result = await execute_extract_data(
        trigger_data=workflow_input,
        parent_context=context
    )
    
    # Prepare output
    output = {
        "result": result,
        "workflow": "extract_data",
        "call_type": "local",
    }
    
    # Store output
    context.set_node_output(
        "node_workflow_call_1",
        output,
        parent_node_id="node_http_endpoint_1",
        passthrough=False
    )
    
    return output
```

---

### Milestone 4: Implement HTTP Workflow Calls
**Date:** [YYYY-MM-DD]  
**Confidence:** 7/10  
**Status:** 🔵 Not Started  
**Time Spent:** [X hours]  

#### Activities
- [ ] Use httpx for async HTTP requests
- [ ] Implement timeout handling
- [ ] Handle HTTP errors (4xx, 5xx)
- [ ] Handle network errors (connection timeout, DNS)
- [ ] Parse JSON response
- [ ] Add retry logic (optional)
- [ ] Test with external URL

#### HTTP Call Generated Code

```python
async def node_workflow_call_2(context: ExecutionContext) -> Any:
    """
    Call Workflow - HTTP Call
    
    Calls a workflow on a different server via HTTP.
    Handles timeouts, errors, and retries.
    """
    import httpx
    
    # Get input from previous node
    input_data = context.get_node_output("node_previous")
    
    # Prepare input
    workflow_input = {
        "userId": input_data.get("userId"),
        "action": "process"
    }
    
    # Make HTTP request to external workflow
    url = "https://other-project.railway.app/api/extract-data"
    
    try:
        response = await context.http.post(
            url,
            json=workflow_input,
            timeout=30,
        )
        response.raise_for_status()
        
        result = response.json()
        
        output = {
            "result": result,
            "call_type": "http",
            "status_code": response.status_code,
        }
        
    except httpx.TimeoutException:
        raise Exception(f"Workflow call timed out after 30s")
        
    except httpx.HTTPStatusError as e:
        raise Exception(
            f"Workflow call failed: {e.response.status_code} - {e.response.text}"
        )
        
    except Exception as e:
        raise Exception(f"Workflow call failed: {str(e)}")
    
    # Store output
    context.set_node_output(
        "node_workflow_call_2",
        output,
        parent_node_id="node_previous",
        passthrough=False
    )
    
    return output
```

---

### Milestone 5: Template Expression Compilation
**Date:** [YYYY-MM-DD]  
**Confidence:** 8/10  
**Status:** 🔵 Not Started  
**Time Spent:** [X hours]  

#### Activities
- [ ] Implement `compileExpression()` function
- [ ] Support `{{input.field}}` syntax
- [ ] Support `{{output.nodeId.field}}` syntax
- [ ] Handle nested fields
- [ ] Escape special characters
- [ ] Test with complex expressions

#### Expression Compilation

**Input Template:**
```json
{
  "userId": "{{input.userId}}",
  "email": "{{input.user.email}}",
  "previousResult": "{{output.node_transform_1.data}}"
}
```

**Generated Python:**
```python
workflow_input = {
    "userId": input_data.get("userId"),
    "email": input_data.get("user", {}).get("email"),
    "previousResult": context.get_node_output("node_transform_1").get("data")
}
```

---

### Milestone 6: Update Workflow Module Generation
**Date:** [YYYY-MM-DD]  
**Confidence:** 7/10  
**Status:** 🔵 Not Started  
**Time Spent:** [X hours]  

#### Activities
- [ ] Update `WorkflowModuleGenerator` to make workflows callable
- [ ] Add `execute_workflow_name()` function signature
- [ ] Support `parent_context` parameter
- [ ] Create child execution context for sub-workflows
- [ ] Test nested workflow calls

#### Callable Workflow Pattern

**File:** `src/core/codegen/python/WorkflowModuleGenerator.ts`

```typescript
generateWorkflowModule(workflow: WorkflowDefinition): string {
  const functionName = `execute_${workflow.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
  
  return `
async def ${functionName}(
    trigger_data: Any,
    parent_context: Optional[ExecutionContext] = None
) -> Any:
    """
    Execute workflow: ${workflow.name}
    
    Can be called:
    - As HTTP endpoint (if visibility = 'public')
    - By other workflows (if visibility = 'internal')
    - Directly via function call
    
    Args:
        trigger_data: Input data
        parent_context: Parent execution context (for sub-workflow calls)
    
    Returns:
        Workflow result
    """
    # Create or reuse execution context
    if parent_context:
        # Sub-workflow: share parent context for connection pooling
        context = parent_context.create_child_context(trigger_data)
    else:
        # Top-level workflow: create new context
        context = ExecutionContext(trigger_data)
    
    # Execute workflow nodes
    ${this.generateNodeExecutions(workflow)}
    
    # Return final output
    return context.get_final_output()
`;
}
```

---

### Milestone 7: Testing & Validation
**Date:** [YYYY-MM-DD]  
**Confidence:** [X/10]  
**Status:** 🔵 Not Started  
**Time Spent:** [X hours]  

#### Test Results

**Unit Tests:**
- Node appears in palette
- Local call generates correct import
- HTTP call generates correct request
- Expression compilation works
- Timeout handling correct

**Integration Tests:**
- Create workflow A that calls workflow B locally
- Create workflow C that calls external workflow via HTTP
- Test nested calls (A → B → C)
- Test error handling
- Test timeout behavior

**Manual Testing:**

| Test Scenario | Expected | Actual | Pass/Fail | Notes |
|---------------|----------|--------|-----------|-------|
| Local call | Direct function call, fast | | | |
| HTTP call | Network request, slower | | | |
| Timeout | Error after configured seconds | | | |
| Invalid URL | Clear error message | | | |
| Template expressions | Correct data passed | | | |

---

### Milestone 8: Human Review
**Date:** [YYYY-MM-DD]  
**Status:** 🔵 Not Started  

#### Human Review Checklist
- [ ] Local calls efficient (no HTTP overhead)
- [ ] HTTP calls handle errors gracefully
- [ ] Template expressions intuitive
- [ ] Generated code quality good
- [ ] Ready for Task 2.6.4 (Project Code Generation)

---

## Final Summary

### Deliverables
- [ ] `workflowCall` node in registry
- [ ] `src/core/codegen/python/nodes/control/workflowCall.py.ts`
- [ ] Local call generation
- [ ] HTTP call generation
- [ ] Expression compilation
- [ ] Updated `WorkflowModuleGenerator`
- [ ] Test coverage: [X%] (target: >85%)

### What Was Accomplished
[To be filled upon completion]

### Lessons Learned

**What Worked Well:**
- [To be filled]

**What Could Be Improved:**
- [To be filled]

**Reusable Patterns:**
- Template expression compilation can be reused for other nodes
- Execution context sharing pattern useful for all control flow nodes

---

## Appendix

### Key Files
- `src/core/workflow/nodes/registry.ts` - Node definition
- `src/core/codegen/python/nodes/control/workflowCall.py.ts` - Code generator
- `src/core/codegen/python/WorkflowModuleGenerator.ts` - Callable workflows
- `tests/unit/codegen/python/workflowCall.test.ts` - Unit tests

### Related Tasks
- Task 2.6.1: Project Management (dependency)
- Task 2.6.4: Project Code Generation (uses this)

---

**Task Status:** 🔵 Not Started  
**Ready for:** Task 2.6.4 (after completion)  
**Last Updated:** 2025-12-21
