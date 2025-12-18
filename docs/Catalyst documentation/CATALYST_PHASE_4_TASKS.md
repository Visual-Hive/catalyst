# Catalyst Phase 4: Control Flow Tasks
## Detailed Task Specifications

**Phase Duration:** ~2 weeks  
**Dependencies:** Phase 3 complete  
**Goal:** Implement control flow nodes with rate limiting and parallel streaming

---

## Overview

Phase 4 implements control flow capabilities:
1. Parallel execution with context cloning
2. Loop/iteration nodes
3. Conditional branching
4. Rate limiting infrastructure
5. Parallel result streaming
6. Custom code execution

---

## Task 4.1: Parallel Execution Node

**Duration:** 1.5 days  
**Confidence Target:** 7/10  
**Dependencies:** Phase 1 (ExecutionContext)

### Objective
Implement parallel execution that clones context for each branch.

### Key Design Decisions
- Clone ExecutionContext for each parallel branch
- Merge results back to parent context
- Support timeout and cancellation
- Stream partial results as they complete

### File: `src/core/codegen/python/nodes/control/parallel.py.ts`

```typescript
/**
 * @file parallel.py.ts
 * @description Template for parallel execution node
 */

export const PARALLEL_NODE_TEMPLATE = `"""
Parallel execution node.

Features:
- Execute multiple branches concurrently
- Clone context for each branch (zero-copy safety)
- Merge results back
- Timeout and cancellation support
- Stream partial results
"""

import asyncio
from typing import Any, Dict, List, Callable, Awaitable
from runtime.context import ExecutionContext


async def execute_parallel(
    ctx: ExecutionContext,
    config: Dict[str, Any],
    branch_executors: Dict[str, Callable[[ExecutionContext], Awaitable[Any]]],
) -> Dict[str, Any]:
    """
    Execute branches in parallel.
    
    Config:
        timeout: Max wait time in seconds (optional)
        on_error: "fail_fast" | "continue" | "ignore" (default: fail_fast)
        merge_strategy: "object" | "array" (default: object)
    
    Args:
        ctx: Parent execution context
        branch_executors: Dict of branch_id -> async executor function
    
    Returns:
        {
            "results": Dict[str, Any] or List[Any],
            "errors": Dict[str, str] (if any),
            "completed": int,
            "failed": int,
        }
    """
    timeout = config.get("timeout")
    on_error = config.get("on_error", "fail_fast")
    merge_strategy = config.get("merge_strategy", "object")
    
    results = {}
    errors = {}
    
    async def run_branch(branch_id: str, executor: Callable) -> tuple:
        """Run single branch with cloned context."""
        # Clone context for this branch (zero-copy safety)
        branch_ctx = ctx.clone()
        
        try:
            result = await executor(branch_ctx)
            return (branch_id, "success", result)
        except Exception as e:
            return (branch_id, "error", str(e))
    
    # Create tasks
    tasks = [
        asyncio.create_task(run_branch(bid, executor))
        for bid, executor in branch_executors.items()
    ]
    
    # Execute with timeout
    try:
        if timeout:
            done, pending = await asyncio.wait(
                tasks,
                timeout=timeout,
                return_when=asyncio.ALL_COMPLETED if on_error != "fail_fast" else asyncio.FIRST_EXCEPTION,
            )
            
            # Cancel pending tasks
            for task in pending:
                task.cancel()
                errors[f"timeout_{id(task)}"] = "Timeout exceeded"
            
            completed_tasks = done
        else:
            if on_error == "fail_fast":
                # Stop on first error
                completed_tasks = await asyncio.gather(*tasks, return_exceptions=False)
            else:
                # Continue on errors
                completed_tasks = await asyncio.gather(*tasks, return_exceptions=True)
    except Exception as e:
        # Handle fail_fast exception
        for task in tasks:
            if not task.done():
                task.cancel()
        raise
    
    # Process results
    for item in completed_tasks:
        if asyncio.iscoroutine(item) or isinstance(item, asyncio.Task):
            item = await item
        
        if isinstance(item, tuple) and len(item) == 3:
            branch_id, status, value = item
            if status == "success":
                results[branch_id] = value
            else:
                errors[branch_id] = value
                if on_error == "fail_fast":
                    raise RuntimeError(f"Branch {branch_id} failed: {value}")
    
    # Format output
    output = {
        "completed": len(results),
        "failed": len(errors),
        "errors": errors if errors else None,
    }
    
    if merge_strategy == "array":
        output["results"] = list(results.values())
    else:
        output["results"] = results
    
    return output
`;
```

### Success Criteria
- [ ] Parallel branches execute concurrently
- [ ] Context properly cloned for each branch
- [ ] Results merged correctly
- [ ] Timeout cancels pending branches
- [ ] Error handling works per config

---

## Task 4.2: Parallel Result Streaming

**Duration:** 0.5 day  
**Confidence Target:** 7/10  
**Dependencies:** Task 4.1, Phase 2 (Streaming)

### Objective
Stream results from parallel operations as they complete, not waiting for all.

### File: `src/core/codegen/python/nodes/control/parallel_stream.py.ts`

```typescript
/**
 * @file parallel_stream.py.ts
 * @description Template for parallel streaming node
 */

export const PARALLEL_STREAM_TEMPLATE = `"""
Parallel result streaming.

Features:
- Stream results as they complete using asyncio.as_completed()
- Don't wait for all branches to finish
- Emit partial results immediately
- Merge final results
"""

import asyncio
from typing import Any, Dict, Callable, Awaitable, AsyncGenerator
from runtime.context import ExecutionContext
from runtime.streaming import format_sse


async def stream_parallel_results(
    ctx: ExecutionContext,
    branch_executors: Dict[str, Callable[[ExecutionContext], Awaitable[Any]]],
    config: Dict[str, Any] = None,
) -> AsyncGenerator[bytes, None]:
    """
    Stream parallel results as Server-Sent Events.
    
    Events emitted:
    - "partial": Each result as it completes
    - "done": All results merged
    
    Usage in workflow:
        async def handle_request():
            return streaming_response(
                stream_parallel_results(ctx, branches)
            )
    """
    config = config or {}
    results = {}
    errors = {}
    
    # Create coroutines with branch IDs
    async def run_branch(branch_id: str, executor: Callable) -> tuple:
        branch_ctx = ctx.clone()
        try:
            result = await executor(branch_ctx)
            return (branch_id, "success", result)
        except Exception as e:
            return (branch_id, "error", str(e))
    
    # Create tasks
    coros = [
        run_branch(bid, executor)
        for bid, executor in branch_executors.items()
    ]
    
    # Stream results as they complete
    for coro in asyncio.as_completed(coros):
        branch_id, status, value = await coro
        
        if status == "success":
            results[branch_id] = value
            yield format_sse("partial", {
                "branch_id": branch_id,
                "result": value,
            })
        else:
            errors[branch_id] = value
            yield format_sse("error", {
                "branch_id": branch_id,
                "error": value,
            })
    
    # Emit final merged result
    yield format_sse("done", {
        "results": results,
        "errors": errors if errors else None,
        "completed": len(results),
        "failed": len(errors),
    })
`;
```

### Success Criteria
- [ ] Results stream as they complete
- [ ] Uses asyncio.as_completed()
- [ ] Partial events emitted immediately
- [ ] Final "done" event includes all results

---

## Task 4.3: Loop Node

**Duration:** 1 day  
**Confidence Target:** 8/10  
**Dependencies:** Phase 1 complete

### Objective
Implement loop/iteration for processing arrays.

### File: `src/core/codegen/python/nodes/control/loop.py.ts`

```typescript
/**
 * @file loop.py.ts
 * @description Template for loop/iteration node
 */

export const LOOP_NODE_TEMPLATE = `"""
Loop node for array iteration.

Features:
- Iterate over arrays
- Batch processing
- Parallel batch execution
- Index and item access
"""

import asyncio
from typing import Any, Dict, List, Callable, Awaitable
from runtime.context import ExecutionContext


async def execute_loop(
    ctx: ExecutionContext,
    config: Dict[str, Any],
    item_executor: Callable[[ExecutionContext, Any, int], Awaitable[Any]],
) -> Dict[str, Any]:
    """
    Execute loop over items.
    
    Config:
        items: Array to iterate (or expression that resolves to array)
        batch_size: Items per batch (default 1)
        parallel: Execute batches in parallel (default False)
        max_concurrent: Max concurrent items if parallel (default 10)
        continue_on_error: Continue if item fails (default False)
    
    Returns:
        {
            "results": List[Any],
            "errors": List[{index, error}],
            "processed": int,
            "failed": int,
        }
    """
    items = config["items"]
    batch_size = config.get("batch_size", 1)
    parallel = config.get("parallel", False)
    max_concurrent = config.get("max_concurrent", 10)
    continue_on_error = config.get("continue_on_error", False)
    
    results = []
    errors = []
    
    if parallel:
        # Parallel execution with semaphore
        semaphore = asyncio.Semaphore(max_concurrent)
        
        async def run_item(index: int, item: Any) -> tuple:
            async with semaphore:
                try:
                    result = await item_executor(ctx, item, index)
                    return (index, "success", result)
                except Exception as e:
                    return (index, "error", str(e))
        
        tasks = [run_item(i, item) for i, item in enumerate(items)]
        completed = await asyncio.gather(*tasks)
        
        # Sort by index and extract results
        completed.sort(key=lambda x: x[0])
        for index, status, value in completed:
            if status == "success":
                results.append(value)
            else:
                errors.append({"index": index, "error": value})
                if not continue_on_error:
                    raise RuntimeError(f"Item {index} failed: {value}")
    else:
        # Sequential execution
        for index, item in enumerate(items):
            try:
                result = await item_executor(ctx, item, index)
                results.append(result)
            except Exception as e:
                errors.append({"index": index, "error": str(e)})
                if not continue_on_error:
                    raise
    
    return {
        "results": results,
        "errors": errors if errors else None,
        "processed": len(results),
        "failed": len(errors),
    }
`;
```

### Success Criteria
- [ ] Sequential iteration works
- [ ] Batch processing works
- [ ] Parallel execution with semaphore
- [ ] Error handling per config

---

## Task 4.4: Condition Node

**Duration:** 0.5 day  
**Confidence Target:** 9/10  
**Dependencies:** Task 1.6 (ExpressionCompiler)

### Objective
Implement conditional branching based on expressions.

### File: `src/core/codegen/python/nodes/control/condition.py.ts`

```typescript
/**
 * @file condition.py.ts
 * @description Template for condition/branching node
 */

export const CONDITION_NODE_TEMPLATE = `"""
Condition node for branching.

Features:
- Boolean expression evaluation
- True/False branches
- Multiple conditions (if/elif/else)
"""

from typing import Any, Dict
from runtime.context import ExecutionContext


async def execute_condition(
    ctx: ExecutionContext,
    config: Dict[str, Any],
) -> Dict[str, Any]:
    """
    Evaluate condition and determine branch.
    
    Config:
        conditions: List of {expression, branch_id}
        default_branch: Branch if no conditions match
    
    Returns:
        {
            "branch": str (branch_id to execute),
            "matched_condition": int (index of matched condition),
        }
    
    Note:
        Expressions are compiled to Python at generation time.
        This function receives the already-evaluated boolean values.
    """
    conditions = config.get("conditions", [])
    default_branch = config.get("default_branch", "else")
    
    for index, cond in enumerate(conditions):
        # Expression should already be evaluated to boolean
        # (compiled at generation time)
        if cond.get("value", False):
            return {
                "branch": cond["branch_id"],
                "matched_condition": index,
            }
    
    return {
        "branch": default_branch,
        "matched_condition": -1,
    }
`;
```

### Success Criteria
- [ ] Boolean conditions evaluate correctly
- [ ] Correct branch selected
- [ ] Default branch works
- [ ] Multiple conditions (elif) work

---

## Task 4.5: Switch Node

**Duration:** 0.5 day  
**Confidence Target:** 9/10  
**Dependencies:** Task 4.4

### Objective
Implement switch/case branching.

### File: `src/core/codegen/python/nodes/control/switch.py.ts`

```typescript
/**
 * @file switch.py.ts
 * @description Template for switch/case node
 */

export const SWITCH_NODE_TEMPLATE = `"""
Switch node for multi-way branching.

Features:
- Match value against cases
- Default case
- Multiple values per case
"""

from typing import Any, Dict, List
from runtime.context import ExecutionContext


async def execute_switch(
    ctx: ExecutionContext,
    config: Dict[str, Any],
) -> Dict[str, Any]:
    """
    Execute switch/case branching.
    
    Config:
        value: Value to match
        cases: List of {values: List, branch_id: str}
        default_branch: Branch if no cases match
    
    Returns:
        {
            "branch": str (branch_id to execute),
            "matched_value": Any (the value that matched),
        }
    """
    value = config["value"]
    cases = config.get("cases", [])
    default_branch = config.get("default_branch", "default")
    
    for case in cases:
        case_values = case.get("values", [])
        if value in case_values:
            return {
                "branch": case["branch_id"],
                "matched_value": value,
            }
    
    return {
        "branch": default_branch,
        "matched_value": None,
    }
`;
```

### Success Criteria
- [ ] Value matching works
- [ ] Multiple values per case
- [ ] Default case works

---

## Task 4.6: RateLimiter Implementation

**Duration:** 0.5 day  
**Confidence Target:** 9/10  
**Dependencies:** Phase 1 complete

### Objective
Implement in-memory rate limiter for API calls.

### Key Design Decisions
- In-memory for single-instance (no Redis dependency)
- Per-key rate limiting
- Async-safe with locks
- Simple API: ensure minimum interval

### File: `src/core/codegen/python/templates/ratelimit.py.ts`

```typescript
/**
 * @file ratelimit.py.ts
 * @description Template for rate limiting utilities
 */

export const RATE_LIMITER_TEMPLATE = `"""
In-memory rate limiter.

Features:
- Per-key rate limiting
- Minimum interval enforcement
- Async-safe with locks
- Simple sliding window

Usage:
    rate_limiter = RateLimiter()
    
    # 10 requests/second max (100ms between requests)
    await rate_limiter.acquire("anthropic_api", min_interval_ms=100)
"""

import asyncio
import time
from typing import Dict
from dataclasses import dataclass, field


@dataclass
class RateLimiter:
    """
    In-memory rate limiter for single-instance deployments.
    
    For distributed deployments, use Redis-backed rate limiter.
    """
    
    # Track last request time per key
    _last_request: Dict[str, float] = field(default_factory=dict)
    
    # Lock per key for thread safety
    _locks: Dict[str, asyncio.Lock] = field(default_factory=dict)
    
    def _get_lock(self, key: str) -> asyncio.Lock:
        """Get or create lock for key."""
        if key not in self._locks:
            self._locks[key] = asyncio.Lock()
        return self._locks[key]
    
    async def acquire(
        self,
        key: str,
        min_interval_ms: float,
    ) -> float:
        """
        Acquire rate limit permission.
        
        Waits if necessary to maintain minimum interval between calls.
        
        Args:
            key: Rate limit key (e.g., "anthropic_api", "user_123")
            min_interval_ms: Minimum milliseconds between calls
        
        Returns:
            Actual wait time in milliseconds
        """
        lock = self._get_lock(key)
        
        async with lock:
            now = time.monotonic() * 1000  # Convert to ms
            last = self._last_request.get(key, 0)
            
            elapsed = now - last
            wait_time = max(0, min_interval_ms - elapsed)
            
            if wait_time > 0:
                await asyncio.sleep(wait_time / 1000)  # Convert to seconds
            
            self._last_request[key] = time.monotonic() * 1000
            return wait_time
    
    async def try_acquire(
        self,
        key: str,
        min_interval_ms: float,
    ) -> bool:
        """
        Try to acquire without waiting.
        
        Returns:
            True if acquired, False if would need to wait
        """
        lock = self._get_lock(key)
        
        async with lock:
            now = time.monotonic() * 1000
            last = self._last_request.get(key, 0)
            
            if now - last >= min_interval_ms:
                self._last_request[key] = now
                return True
            return False
    
    def reset(self, key: str = None) -> None:
        """Reset rate limit state."""
        if key:
            self._last_request.pop(key, None)
        else:
            self._last_request.clear()


# Global rate limiter instance
_rate_limiter = RateLimiter()


async def rate_limit(key: str, requests_per_second: float) -> float:
    """
    Convenience function for rate limiting.
    
    Args:
        key: Rate limit key
        requests_per_second: Max requests per second
    
    Returns:
        Wait time in ms
    """
    min_interval_ms = 1000 / requests_per_second
    return await _rate_limiter.acquire(key, min_interval_ms)
`;
```

### Success Criteria
- [ ] Per-key rate limiting works
- [ ] Minimum interval enforced
- [ ] Async-safe (no race conditions)
- [ ] try_acquire for non-blocking check

---

## Task 4.7: rateLimit Node

**Duration:** 0.25 day  
**Confidence Target:** 9/10  
**Dependencies:** Task 4.6

### Objective
Visual node wrapper for rate limiting.

### File: `src/core/codegen/python/nodes/control/rate_limit_node.py.ts`

```typescript
/**
 * @file rate_limit_node.py.ts
 * @description Template for rate limit node
 */

export const RATE_LIMIT_NODE_TEMPLATE = `"""
Rate limit node.

Visual configuration for rate limiting API calls.
"""

from typing import Any, Dict
from runtime.context import ExecutionContext
from runtime.ratelimit import rate_limit


async def execute_rate_limit(
    ctx: ExecutionContext,
    config: Dict[str, Any],
) -> Dict[str, Any]:
    """
    Apply rate limiting.
    
    Config:
        key: Rate limit key (expression, e.g., "anthropic" or "{{ input.user_id }}")
        requests_per_second: Max RPS (default 10)
        timeout_ms: Max wait time before error (optional)
    
    Returns:
        {"waited_ms": float, "key": str}
    """
    key = config["key"]
    rps = config.get("requests_per_second", 10)
    timeout_ms = config.get("timeout_ms")
    
    # Calculate max wait from timeout
    if timeout_ms:
        min_interval_ms = 1000 / rps
        if min_interval_ms > timeout_ms:
            raise RuntimeError(
                f"Rate limit would exceed timeout: {min_interval_ms}ms > {timeout_ms}ms"
            )
    
    waited_ms = await rate_limit(key, rps)
    
    return {
        "waited_ms": waited_ms,
        "key": key,
    }
`;
```

### Success Criteria
- [ ] Node applies rate limiting
- [ ] Key expression works
- [ ] RPS configurable
- [ ] Timeout checking works

---

## Task 4.8: Custom Code Node

**Duration:** 1 day  
**Confidence Target:** 7/10  
**Dependencies:** Phase 1 complete

### Objective
Allow users to write custom Python code within workflows.

### File: `src/core/codegen/python/nodes/transform/custom_code.py.ts`

```typescript
/**
 * @file custom_code.py.ts
 * @description Template for custom Python code node
 */

export const CUSTOM_CODE_NODE_TEMPLATE = `"""
Custom Python code node.

Features:
- Execute user-defined Python code
- Access to context values
- Safe execution environment
- Return value handling
"""

from typing import Any, Dict
from runtime.context import ExecutionContext


async def execute_custom_code(
    ctx: ExecutionContext,
    config: Dict[str, Any],
) -> Dict[str, Any]:
    """
    Execute custom Python code.
    
    Config:
        code: Python code string (async function body)
        inputs: Dict of input values available as variables
    
    The code has access to:
        - input: The workflow input
        - nodes: Previous node outputs (via ctx.get_output)
        - ctx: Full execution context
        - Any values in config.inputs
    
    Returns:
        Whatever the code returns, wrapped in {"result": ...}
    
    Note:
        Code is compiled at generation time and embedded directly.
        This is safe because:
        1. Code is written by the workflow author
        2. Generated code is reviewed before deployment
        3. No eval() at runtime
    """
    # At generation time, the code is compiled into a function:
    # async def _custom_code(ctx, **inputs):
    #     <user code here>
    #
    # This template is a placeholder showing the interface.
    # Actual code is generated by CodeGenerator.
    
    inputs = config.get("inputs", {})
    
    # The actual generated code would look like:
    # result = await _custom_code_<node_id>(ctx, **inputs)
    # return {"result": result}
    
    raise NotImplementedError("Custom code is generated at compile time")
`;
```

### Code Generator Logic

```typescript
// In NodeCodeGenerator.ts
generateCustomCodeNode(node: NodeDefinition): string {
  const code = node.config.code;
  const nodeId = node.id.replace(/-/g, '_');
  
  return `
async def _custom_code_${nodeId}(ctx: ExecutionContext, **inputs) -> Any:
    """Custom code for node ${node.name}"""
    input = ctx.input
    
    def get_node_output(node_id: str) -> Any:
        return ctx.get_output(node_id)
    
    nodes = type('Nodes', (), {
        '__getattr__': lambda self, name: get_node_output(name)
    })()
    
    # User code starts here
    ${indentCode(code, 4)}
    # User code ends here
`;
}
```

### Success Criteria
- [ ] Custom code executes
- [ ] Context accessible
- [ ] Input values available
- [ ] Return value captured

---

## Phase 4 Deliverables Summary

| Task | Deliverable | Duration | Confidence |
|------|-------------|----------|------------|
| 4.1 | Parallel Execution | 1.5d | 7/10 |
| 4.2 | Parallel Streaming | 0.5d | 7/10 |
| 4.3 | Loop Node | 1d | 8/10 |
| 4.4 | Condition Node | 0.5d | 9/10 |
| 4.5 | Switch Node | 0.5d | 9/10 |
| 4.6 | RateLimiter | 0.5d | 9/10 |
| 4.7 | rateLimit Node | 0.25d | 9/10 |
| 4.8 | Custom Code Node | 1d | 7/10 |

**Total Phase 4 Duration:** ~5.75 days

---

## Human Review Checkpoints

**After Task 4.1:**
- Parallel branches execute concurrently
- Context cloning works correctly
- No race conditions

**After Task 4.6:**
- Rate limiting prevents API overload
- Async-safe operation

**End of Phase 4:**
- All control flow nodes functional
- Parallel streaming works

---

## Performance Validation Checklist

Before completing Phase 4, verify:

- [ ] Parallel nodes clone context, don't share
- [ ] Parallel result streaming uses asyncio.as_completed()
- [ ] Rate limiter is async-safe with locks
- [ ] Loop node uses semaphore for parallel execution
- [ ] Custom code has no eval() at runtime
- [ ] All control flow respects timeouts

---

**Previous Phase:** [CATALYST_PHASE_3_TASKS.md](./CATALYST_PHASE_3_TASKS.md)  
**Next Phase:** Phase 5-6 (Advanced Features & Production) - To be detailed
