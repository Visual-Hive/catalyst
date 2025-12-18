# Catalyst Performance Requirements
## Architectural Enhancements for Maximum Speed

**Document Purpose:** This document specifies performance optimizations to be integrated into the Catalyst roadmap and implementation plan. These requirements should be incorporated into existing phases where appropriate, with new tasks added as needed.

**For Cline:** Please update `CATALYST_CLINE_IMPLEMENTATION.md` and related planning documents to incorporate these performance requirements into the task breakdown.

---

## Overview

After researching high-performance workflow engines and modern Python async patterns, we've identified several architectural improvements that will make Catalyst significantly faster than alternatives. These aren't optional nice-to-haves—they're core architectural decisions that should be baked into the foundation.

**Performance Philosophy:**
- Generate optimized code, don't interpret at runtime
- Pass data by reference, copy only when necessary
- Use the fastest libraries available for hot paths
- Pool connections, never create per-request
- Stream by default, buffer only when required

---

## 1. Runtime Performance Stack

### Requirements

All generated Catalyst projects must use the optimized Python performance stack:

| Component | Standard | Required | Rationale |
|-----------|----------|----------|-----------|
| Event Loop | asyncio | **uvloop** | 2-4x faster (uses libuv) |
| JSON | json | **orjson** | 10x faster (Rust-based) |
| HTTP Parsing | Python | **httptools** | 10x faster (C-based) |
| HTTP Client | requests | **httpx** | Async + connection pooling |
| PostgreSQL | psycopg2 | **asyncpg** | 3x faster + native async |
| Validation | Pydantic v1 | **Pydantic v2** or **msgspec** | 5x faster |

### Implementation Tasks

**Task: Performance Stack Generator** (Add to Phase 1)
- Generate `requirements.txt` with performance dependencies
- Generate `main.py` with uvloop installation
- Configure FastAPI to use ORJSONResponse by default
- Estimated: 0.5 days, Confidence: 9/10

```python
# Required in all generated main.py files:
import uvloop
uvloop.install()

from fastapi import FastAPI
from fastapi.responses import ORJSONResponse

app = FastAPI(default_response_class=ORJSONResponse)
```

---

## 2. Zero-Copy Execution Context

### Requirements

Data should flow through workflows by reference, not by copying. This is critical for performance when handling large payloads.

**Pattern:**
- Create a single `ExecutionContext` object per request
- Pass it by reference through all nodes
- Clone **only** when entering parallel branches
- Use `__slots__` for memory efficiency (35% reduction)

### Implementation Tasks

**Task: ExecutionContext Implementation** (Add to Phase 1)
- Create `ExecutionContext` class with `__slots__`
- Implement `clone()` method for parallel execution
- Add timing utilities (nanosecond precision)
- Store node outputs in dict (O(1) access)
- Estimated: 0.5 days, Confidence: 8/10

```python
class ExecutionContext:
    """
    Zero-copy execution context.
    Passed by reference through all nodes.
    """
    __slots__ = (
        'workflow_id', 'execution_id', 'input', 'node_outputs',
        'global_vars', 'secrets', '_pools', '_start_time'
    )
    
    def set_output(self, node_id: str, output: Any) -> None:
        """O(1) dict assignment."""
        self.node_outputs[node_id] = output
    
    def get_output(self, node_id: str) -> Any:
        """O(1) dict lookup."""
        return self.node_outputs[node_id]
    
    def clone(self) -> 'ExecutionContext':
        """Deep clone for parallel branches only."""
        # Clone node_outputs, share immutable data
        ...
```

**Task: Update Parallel Node** (Modify Phase 4)
- Call `ctx.clone()` for each parallel branch
- Merge results back to parent context
- Ensure proper cleanup on timeout/cancellation

---

## 3. Connection Pool Singletons

### Requirements

Database and HTTP connections must be pooled and shared across all workflow executions. Creating connections per-request is a major performance killer.

**Pattern:**
- Create all connection pools at application startup
- Store in a singleton accessible to all workflows
- Configure appropriate pool sizes per service
- Graceful shutdown with connection cleanup

### Implementation Tasks

**Task: ConnectionPools Implementation** (Add to Phase 1)
- Create `ConnectionPools` dataclass
- Implement async `create()` factory method
- Implement `close()` for graceful shutdown
- Add to FastAPI lifespan events
- Estimated: 1 day, Confidence: 8/10

```python
@dataclass
class ConnectionPools:
    """Singleton connection pools created at startup."""
    http: httpx.AsyncClient           # General HTTP
    anthropic: httpx.AsyncClient      # Dedicated LLM pool
    postgres: Optional[asyncpg.Pool]  # Database
    redis: Optional[aioredis.Redis]   # Cache
    qdrant: Optional[AsyncQdrantClient]
    
    @classmethod
    async def create(cls, config: RuntimeConfig) -> 'ConnectionPools':
        http = httpx.AsyncClient(
            limits=httpx.Limits(
                max_keepalive_connections=100,
                max_connections=200,
            ),
            timeout=httpx.Timeout(30.0, connect=5.0)
        )
        # ... create other pools
        return cls(http=http, ...)
    
    async def close(self):
        """Cleanup all connections."""
        await self.http.aclose()
        # ... close other pools
```

**Task: FastAPI Lifespan Integration** (Add to Phase 1)
- Generate lifespan context manager
- Initialize pools on startup
- Close pools on shutdown
- Pass pools to ExecutionContext

```python
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    app.state.pools = await ConnectionPools.create(config)
    yield
    # Shutdown
    await app.state.pools.close()
```

---

## 4. Compiled Expression Evaluation

### Requirements

Expressions like `{{ input.query }}` must be compiled to Python code at **generation time**, not interpreted at runtime. Runtime interpretation (eval/exec) is 10x slower and a security risk.

**Pattern:**
- Parse expressions during code generation
- Convert to Python f-strings or direct attribute access
- Never use `eval()` in generated code
- Support common filters (length, first, default, json)

### Implementation Tasks

**Task: ExpressionCompiler** (Add to Phase 1)
- Implement expression parser
- Convert template syntax to Python code
- Support: input, nodes, env, secrets, global
- Support filters: length, first, default, json, upper, lower
- Estimated: 1 day, Confidence: 7/10

```python
class ExpressionCompiler:
    """
    Compile {{ expressions }} to Python at generation time.
    """
    
    @staticmethod
    def compile(expression: str) -> str:
        """
        {{ input.query }}           -> ctx.input["query"]
        {{ nodes.search.output }}   -> ctx.get_output("search")
        {{ env.API_KEY }}           -> ctx.secrets["API_KEY"]
        {{ input.items | length }}  -> len(ctx.input["items"])
        {{ uuid() }}                -> str(uuid.uuid4())
        """
        # Implementation here
```

**Task: Update Node Code Generator** (Modify Phase 1)
- Use ExpressionCompiler for all node configurations
- Generate f-strings instead of runtime evaluation
- Add compile-time validation for expressions

---

## 5. Built-in Rate Limiting

### Requirements

Workflows need rate limiting for external API calls (especially LLMs). This should be built-in without requiring Redis for simple cases.

**Pattern:**
- In-memory rate limiter for single-instance deployments
- Redis-backed rate limiter for distributed deployments
- Simple API: ensure minimum interval between calls
- Per-key rate limiting (per user, per API, etc.)

### Implementation Tasks

**Task: RateLimiter Implementation** (Add to Phase 4 or utilities)
- Implement in-memory rate limiter
- Support per-key rate limiting
- Async-safe with locks
- Estimated: 0.5 days, Confidence: 9/10

```python
class RateLimiter:
    """In-memory rate limiter."""
    
    async def acquire(self, key: str, min_interval_ms: float) -> float:
        """
        Ensure at least min_interval_ms since last call for this key.
        Returns actual wait time in ms.
        
        Usage:
            # 10 requests/second max
            await rate_limiter.acquire("anthropic_api", 100)
        """
```

**Task: rateLimit Node** (Add to Phase 4)
- Visual node for rate limiting
- Configure: key expression, interval, timeout
- Generate rate limiter code

---

## 6. Streaming Optimizations

### Requirements

Streaming must be first-class, not bolted on. LLM responses should stream token-by-token to clients with minimal latency.

**Pattern:**
- Use async generators throughout
- Never buffer full responses in memory
- Stream partial results as they complete
- Proper SSE formatting with event types

### Implementation Tasks

**Task: Streaming Infrastructure** (Enhance Phase 2)
- Create `format_sse()` utility function
- Support multiple event types (partial, token, done)
- Add `X-Accel-Buffering: no` header for nginx
- Estimated: 0.5 days, Confidence: 8/10

```python
def format_sse(event: str, data: Any) -> bytes:
    """Format Server-Sent Event. Uses orjson for speed."""
    json_data = orjson.dumps(data).decode()
    return f"event: {event}\ndata: {json_data}\n\n".encode()

async def streaming_response(ctx: ExecutionContext):
    """Example streaming workflow."""
    # Stream partial results as searches complete
    for coro in asyncio.as_completed(search_tasks):
        result = await coro
        yield format_sse("partial", result)
    
    # Stream LLM tokens
    async for token in claude_stream(...):
        yield format_sse("token", {"text": token})
    
    yield format_sse("done", {"elapsed_ms": ctx.elapsed_ms})
```

**Task: Parallel Result Streaming** (Add to Phase 4)
- Stream results from `asyncio.as_completed()`
- Don't wait for all parallel branches to finish
- Send partial results as available

---

## 7. Caching Infrastructure

### Requirements

Repeated computations (especially embeddings) should be cached. Support both in-memory and Redis caching.

### Implementation Tasks

**Task: Cache Utilities** (Add to Phase 3)
- Implement `@cached` decorator for async functions
- Support TTL configuration
- In-memory LRU cache for single instance
- Redis cache for distributed
- Estimated: 0.5 days, Confidence: 8/10

```python
@cached(ttl=3600, key_fn=lambda ctx, text: f"emb:{hash(text)}")
async def get_embedding(ctx: ExecutionContext, text: str) -> List[float]:
    """Cached embedding generation."""
    return await generate_embedding(ctx, text)
```

**Task: Embedding Cache Node** (Add to Phase 2)
- Visual configuration for embedding caching
- Redis or in-memory backend selection

---

## 8. Performance Monitoring

### Requirements

Generated code should include basic performance monitoring to help users identify bottlenecks.

### Implementation Tasks

**Task: Execution Timing** (Add to Phase 1)
- Track per-node execution time
- Include in response metadata
- Nanosecond precision timing
- Estimated: 0.25 days, Confidence: 9/10

```python
# In ExecutionContext
@property
def elapsed_ms(self) -> float:
    return (time.monotonic_ns() - self._start_time) / 1_000_000

# Per-node timing stored in context
ctx.set_timing("search", elapsed_ms)
```

---

## Updated Requirements.txt Template

```
# Core Framework
fastapi>=0.109.0
uvicorn[standard]>=0.27.0
starlette>=0.35.0

# Performance (REQUIRED)
uvloop>=0.19.0
orjson>=3.9.0
httptools>=0.6.0

# Async Clients
httpx>=0.26.0
asyncpg>=0.29.0
redis>=5.0.0

# Vector Database
qdrant-client>=1.7.0

# LLM Providers
anthropic>=0.18.0
openai>=1.10.0
groq>=0.4.0

# Utilities
python-dotenv>=1.0.0
tenacity>=8.2.0
pydantic>=2.5.0
```

---

## Task Summary for Roadmap Update

### New Tasks to Add

| Task | Phase | Duration | Confidence | Dependencies |
|------|-------|----------|------------|--------------|
| Performance Stack Generator | 1 | 0.5d | 9/10 | None |
| ExecutionContext Implementation | 1 | 0.5d | 8/10 | None |
| ConnectionPools Implementation | 1 | 1d | 8/10 | None |
| FastAPI Lifespan Integration | 1 | 0.25d | 9/10 | ConnectionPools |
| ExpressionCompiler | 1 | 1d | 7/10 | None |
| RateLimiter Implementation | 4 | 0.5d | 9/10 | None |
| rateLimit Node | 4 | 0.25d | 9/10 | RateLimiter |
| Streaming Infrastructure | 2 | 0.5d | 8/10 | None |
| Parallel Result Streaming | 4 | 0.5d | 7/10 | parallel node |
| Cache Utilities | 3 | 0.5d | 8/10 | Redis setup |
| Execution Timing | 1 | 0.25d | 9/10 | ExecutionContext |

**Total Additional Effort:** ~6 days

### Tasks to Modify

| Existing Task | Modification |
|---------------|--------------|
| PythonWorkflowGenerator | Use ExpressionCompiler, generate performance imports |
| FastAPI Generator | Add lifespan, ORJSONResponse, uvloop |
| parallel node | Use ctx.clone(), stream partial results |
| All LLM nodes | Use dedicated connection pool, support streaming |
| All data nodes | Use connection pools from context |

---

## Performance Targets

After implementing these optimizations, Catalyst should achieve:

| Scenario | Current Tools | Catalyst Target |
|----------|---------------|-----------------|
| Simple transform | 50ms | **<10ms** |
| Sequential HTTP chain | 300ms overhead | **<50ms overhead** |
| 4x Parallel DB queries | 800ms (sequential) | **200ms (parallel)** |
| LLM streaming first token | N/A | **<300ms** |
| 1000 concurrent requests | Unstable | **Stable, <5% error** |

---

## Implementation Priority

**Phase 1 (Foundation) - Add These First:**
1. ExecutionContext with __slots__
2. ConnectionPools singleton
3. ExpressionCompiler
4. Performance stack (uvloop, orjson)

**Phase 2-3 - Integrate:**
1. Streaming infrastructure for LLM nodes
2. Cache utilities for embeddings
3. Connection pools for data nodes

**Phase 4 - Complete:**
1. RateLimiter
2. Parallel result streaming
3. Zero-copy verification

---

## Validation Checklist

Before marking performance work complete, verify:

- [ ] Generated code imports uvloop and calls `uvloop.install()`
- [ ] FastAPI uses `ORJSONResponse` as default
- [ ] All JSON operations use `orjson`, not `json`
- [ ] Connection pools created at startup, closed at shutdown
- [ ] No `eval()` or `exec()` in generated code
- [ ] Expressions compiled to f-strings/direct access
- [ ] Parallel nodes clone context, don't share
- [ ] Streaming endpoints have `X-Accel-Buffering: no`
- [ ] LLM calls use dedicated connection pool
- [ ] Execution timing available in response metadata

---

**End of Performance Requirements Document**

*These optimizations are inspired by patterns from high-performance workflow engines and modern async Python best practices.*
