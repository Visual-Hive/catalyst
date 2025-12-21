# Task 2.16: Data Passthrough Architecture

**Phase:** Phase 2.5 - Developer Experience & Testing  
**Duration Estimate:** 2-3 days  
**Actual Duration:** [To be filled when complete]  
**Status:** 🔵 Not Started  
**Assigned:** AI + Human Review  
**Confidence:** 6/10 - Complex feature requiring careful design  
**Priority:** ✅ CRITICAL - Prevents n8n's biggest pain point  

---

## Task Overview

### Objective
Solve n8n's "dunno which item" problem by implementing optional data passthrough that threads previous node data through all subsequent nodes, preventing data loss in multi-node workflows.

### The Problem

In n8n, this common pattern fails:

```
HTTP Request (gets user data: {userId: 123, name: "Alice"})
  ↓
HTTP Request (fetches profile photo: {photoUrl: "..."})  ← LOSES userId!
  ↓
IF condition (needs to check userId)  ← ERROR: "unknown item - userId not found"
```

The second HTTP request returns new data, and the original user data is lost.

### The Solution

**Optional passthrough** - nodes can opt-in to merge parent data with their output:

```
HTTP Request (returns {userId: 123, name: "Alice"})
  ↓
HTTP Request (passthrough: true, returns {userId: 123, name: "Alice", photoUrl: "..."})
  ↓
IF condition (can access userId: 123)  ← SUCCESS!
```

### Success Criteria
- [ ] Passthrough toggle on all nodes
- [ ] ExecutionContext tracks data lineage
- [ ] Expression support for {{origin.field}} and {{output.nodeId.field}}
- [ ] No "unknown item" errors
- [ ] Backwards compatible (off by default)
- [ ] Test coverage >85%
- [ ] Performance impact <5% when enabled

---

## Milestones

### Milestone 1: Design Lineage Tracking Architecture
**Confidence:** 6/10  
**Status:** 🔵 Not Started  

#### Design Decisions

| Decision | Options Considered | Choice Made | Rationale | Confidence |
|----------|-------------------|-------------|-----------|------------|
| Passthrough mechanism | Always-on, opt-out, opt-in toggle | Opt-in toggle per node | Explicit control, backwards compatible, no surprise behavior | 8/10 |
| Data merging strategy | Deep merge, shallow merge, wrap | Shallow merge + origin wrapper | Simple, predictable, preserves original | 7/10 |
| Lineage tracking | Full graph, parent-only, none | Parent chain tracking | Balance of features and complexity | 6/10 |
| Expression access | Direct only, lineage aware | Lineage aware ({{origin}}, {{output}}) | Powerful, explicit, clear intent | 7/10 |

#### Passthrough Flow Diagram

```
Node A Output: {userId: 123, name: "Alice"}
       ↓ (passthrough: false)
Node B Output: {photoUrl: "url"} 
       → User can't access userId anymore ❌

Node A Output: {userId: 123, name: "Alice"}
       ↓ (passthrough: true)
Node B Output: {
  userId: 123,           // Merged from parent
  name: "Alice",         // Merged from parent
  photoUrl: "url",       // Current output
  _origin: {...},        // Original parent data
  _current: {...}        // Current node output only
}
       → User can access userId! ✅
```

---

### Milestone 2: Update Node Schema
**Confidence:** 9/10  
**Status:** 🔵 Not Started  

#### Files Modified
- `src/core/workflow/types.ts`

```typescript
export interface NodeConfig {
  // ... existing node-specific config
  
  // NEW: Universal passthrough option (underscore prefix to distinguish)
  _passthrough?: boolean;
}
```

---

### Milestone 3: Add Passthrough UI
**Confidence:** 8/10  
**Status:** 🔵 Not Started  

#### Files Modified
- `src/renderer/components/WorkflowCanvas/NodeConfigForm.tsx`

```typescript
export function NodeConfigForm({ workflowId, node }: NodeConfigFormProps) {
  return (
    <div className="space-y-4">
      {/* ... existing config fields */}
      
      {/* Passthrough toggle - shown for ALL nodes (except triggers) */}
      {!node.type.includes('Trigger') && !node.type.includes('trigger') && (
        <div className="pt-4 border-t border-gray-200">
          <label className="flex items-start gap-3">
            <input
              type="checkbox"
              checked={node.config._passthrough || false}
              onChange={(e) => 
                updateNodeConfig(workflowId, node.id, '_passthrough', e.target.checked)
              }
              className="mt-1 w-4 h-4 text-blue-600 rounded"
            />
            <div>
              <div className="font-medium text-sm">Enable Data Passthrough</div>
              <div className="text-xs text-gray-500 mt-1">
                Include input data in output. Prevents "unknown item" errors by 
                preserving data from previous nodes. Useful when this node's output 
                needs to include data from earlier in the workflow.
              </div>
            </div>
          </label>
        </div>
      )}
    </div>
  );
}
```

---

### Milestone 4: Update ExecutionContext
**Confidence:** 7/10  
**Status:** 🔵 Not Started  

#### Files Modified
- `src/core/codegen/python/templates/execution-context.py.template`

```python
class ExecutionContext:
    """
    Manages workflow execution state with data lineage tracking.
    
    LINEAGE TRACKING:
    - Tracks parent-child relationships between nodes
    - Enables passthrough data merging
    - Allows accessing origin data from any point in workflow
    """
    
    def __init__(self, trigger_data: Any):
        self.node_outputs: dict[str, Any] = {}
        self.trigger_data = trigger_data
        
        # NEW: Data lineage tracking
        # Maps node_id -> list of parent node IDs in execution order
        self.data_lineage: dict[str, list[str]] = {}
    
    def set_node_output(
        self, 
        node_id: str, 
        output: Any,
        parent_node_id: str | None = None,
        passthrough: bool = False
    ) -> None:
        """
        Set node output with optional passthrough data merging.
        
        Args:
            node_id: ID of node producing output
            output: The output data from the node
            parent_node_id: ID of parent node (input source)
            passthrough: Whether to merge parent data into output
        """
        
        # Track lineage
        if parent_node_id:
            parent_lineage = self.data_lineage.get(parent_node_id, [])
            self.data_lineage[node_id] = parent_lineage + [parent_node_id]
        else:
            self.data_lineage[node_id] = []
        
        # Handle passthrough
        if passthrough and parent_node_id:
            parent_output = self.node_outputs.get(parent_node_id)
            
            if parent_output is not None:
                # Merge parent data with current output
                if isinstance(output, dict) and isinstance(parent_output, dict):
                    # Both are dicts - merge with current taking precedence
                    merged = {
                        **parent_output,  # Parent data first
                        **output,          # Current data overrides
                        '_origin': parent_output,   # Preserve original
                        '_current': output,         # Preserve current
                    }
                    self.node_outputs[node_id] = merged
                else:
                    # Not both dicts - wrap in object
                    self.node_outputs[node_id] = {
                        '_origin': parent_output,
                        '_current': output,
                    }
            else:
                # No parent output, just store current
                self.node_outputs[node_id] = output
        else:
            # No passthrough, just store output
            self.node_outputs[node_id] = output
    
    def get_node_output(self, node_id: str) -> Any:
        """Get output from a specific node."""
        return self.node_outputs.get(node_id)
    
    def get_origin_data(self, node_id: str) -> Any:
        """
        Get the original input data that started this execution path.
        Follows lineage back to the trigger or first node.
        """
        lineage = self.data_lineage.get(node_id, [])
        
        if not lineage:
            # No lineage, return trigger data
            return self.trigger_data
        
        # Follow lineage back to origin
        origin_node_id = lineage[0]
        return self.node_outputs.get(origin_node_id, self.trigger_data)
```

---

### Milestone 5: Update Node Generators
**Confidence:** 6/10  
**Status:** 🔵 Not Started  

#### Implementation Strategy

Every node generator must be updated to:
1. Check if passthrough is enabled
2. Pass parent node ID to context
3. Pass passthrough flag to context

#### Example: HTTP Request Node

```typescript
// In src/core/codegen/python/nodes/http/request.py.ts
export function generateHttpRequestNode(
  node: NodeDefinition,
  workflow: WorkflowDefinition
): string {
  const config = node.config;
  const passthrough = config._passthrough || false;
  
  // Find parent node
  const incomingEdge = workflow.edges.find(e => e.target === node.id);
  const parentNodeId = incomingEdge?.source;
  
  return `
async def ${node.id}(context: ExecutionContext) -> Any:
    """${node.name}"""
    
    # Get input from parent node (or trigger)
    ${parentNodeId 
      ? `input_data = context.get_node_output("${parentNodeId}")` 
      : 'input_data = context.trigger_data'}
    
    # Make HTTP request
    async with httpx.AsyncClient() as client:
        response = await client.${config.method.toLowerCase()}(
            "${config.url}",
            json=input_data,
            timeout=30.0
        )
        response.raise_for_status()
        output = response.json()
    
    # Store output with passthrough
    context.set_node_output(
        node_id="${node.id}",
        output=output,
        parent_node_id="${parentNodeId || ''}",
        passthrough=${passthrough}
    )
    
    return output
`;
}
```

#### Files to Modify
ALL node generators must be updated:
- `src/core/codegen/python/nodes/llm/*.py.ts`
- `src/core/codegen/python/nodes/http/*.py.ts`
- `src/core/codegen/python/nodes/data/*.py.ts`
- Future node types

---

### Milestone 6: Update Expression System
**Confidence:** 7/10  
**Status:** 🔵 Not Started  

#### Files Modified
- `src/core/codegen/python/expression-compiler.ts`

```typescript
/**
 * Compile template expressions with lineage support.
 * 
 * Supports:
 * - {{input.field}} - Current input
 * - {{output.nodeId.field}} - Specific node output
 * - {{origin.field}} - Original trigger/first node data
 */
export function compileExpression(expr: string, currentNodeId: string): string {
  // Replace {{origin.field}} with context.get_origin_data()
  expr = expr.replace(
    /\{\{origin\.(\w+)\}\}/g,
    `context.get_origin_data("${currentNodeId}").get("$1")`
  );
  
  // Replace {{output.nodeId.field}} with context.get_node_output()
  expr = expr.replace(
    /\{\{output\.(\w+)\.(\w+)\}\}/g,
    'context.get_node_output("$1").get("$2")'
  );
  
  // Replace {{input.field}} with input_data
  expr = expr.replace(
    /\{\{input\.(\w+)\}\}/g,
    'input_data.get("$1")'
  );
  
  return expr;
}
```

---

### Milestone 7: Testing Strategy
**Confidence:** [X/10]  
**Status:** 🔵 Not Started  

#### Test Scenarios

1. **Basic Passthrough**
   ```
   Node A (output: {a: 1})
   → Node B (passthrough: true, output: {b: 2})
   → Result: {a: 1, b: 2, _origin: {a: 1}, _current: {b: 2}}
   ```

2. **Chain Passthrough**
   ```
   Node A ({a: 1})
   → Node B (passthrough: true, {b: 2})  
   → Node C (passthrough: true, {c: 3})
   → Result: {a: 1, b: 2, c: 3}
   ```

3. **Selective Passthrough**
   ```
   Node A ({a: 1})
   → Node B (passthrough: false, {b: 2})  ← Data lost
   → Node C (can only access {b: 2})
   ```

4. **Origin Access**
   ```
   Node A ({userId: 123})
   → Node B (passthrough: false)
   → Node C (can still access {{origin.userId}})
   ```

5. **Performance**
   - Passthrough off: baseline
   - Passthrough on: <5% overhead

---

### Milestone 8: Human Review
**Confidence:** [X/10]  
**Status:** 🔵 Not Started  

#### Review Checklist
- [ ] Passthrough toggle works on all nodes
- [ ] Data merging predictable and correct
- [ ] No "unknown item" errors with passthrough
- [ ] Expressions access lineage correctly
- [ ] Performance acceptable
- [ ] Backwards compatible (off by default)
- [ ] Documentation clear

---

## Final Summary

### Deliverables
- [ ] Passthrough toggle in properties panel
- [ ] ExecutionContext with lineage tracking
- [ ] All node generators updated
- [ ] Expression compiler supports lineage
- [ ] Comprehensive test suite
- [ ] Documentation and examples

### Risk Mitigation

**Risk:** Complex feature, may have edge cases  
**Mitigation:** Extensive testing, opt-in design, clear documentation

**Risk:** Performance overhead  
**Mitigation:** Benchmark, optimize hot paths, make optional

**Risk:** Breaks existing workflows  
**Mitigation:** Off by default, backwards compatible

### Next Steps
- [ ] Phase 2.5 complete
- [ ] Ready for Phase 3: Data Integration

---

**Task Status:** 🔵 Not Started  
**Last Updated:** 2025-12-21
