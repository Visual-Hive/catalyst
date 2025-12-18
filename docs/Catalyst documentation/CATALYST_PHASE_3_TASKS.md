# Catalyst Phase 3: Data Integration Tasks
## Detailed Task Specifications

**Phase Duration:** ~2 weeks  
**Dependencies:** Phase 2 complete  
**Goal:** Implement data source nodes with caching infrastructure

---

## Overview

Phase 3 implements data integration capabilities:
1. Qdrant vector database operations
2. PostgreSQL query nodes
3. Redis operations
4. Directus CMS integration
5. GraphQL query/mutation nodes
6. Caching infrastructure for performance

---

## Task 3.1: Qdrant Search Node

**Duration:** 1 day  
**Confidence Target:** 8/10  
**Dependencies:** Phase 2 complete (embeddings)

### Objective
Implement Qdrant vector search with filtering and scoring.

### File: `src/core/codegen/python/nodes/data/qdrant.py.ts`

```typescript
/**
 * @file qdrant.py.ts
 * @description Template for Qdrant vector database nodes
 */

export const QDRANT_SEARCH_TEMPLATE = `"""
Qdrant vector search node.

Features:
- Semantic search with embeddings
- Filter support
- Score threshold
- Payload retrieval
"""

from typing import Any, Dict, List, Optional
from qdrant_client import AsyncQdrantClient
from qdrant_client.models import Filter, FieldCondition, MatchValue, Range
from runtime.context import ExecutionContext


async def execute_qdrant_search(
    ctx: ExecutionContext,
    config: Dict[str, Any],
) -> Dict[str, Any]:
    """
    Execute Qdrant vector search.
    
    Config:
        collection: Collection name
        vector: Query vector (list of floats)
        limit: Max results (default 10)
        score_threshold: Minimum score (optional)
        filter: Qdrant filter conditions (optional)
        with_payload: Include payload (default True)
        with_vectors: Include vectors (default False)
    
    Returns:
        {
            "results": List[{
                "id": str,
                "score": float,
                "payload": Dict (if with_payload),
                "vector": List (if with_vectors),
            }]
        }
    """
    client = ctx.qdrant
    if not client:
        raise RuntimeError("Qdrant not configured")
    
    # Build filter if provided
    query_filter = None
    if config.get("filter"):
        query_filter = _build_filter(config["filter"])
    
    # Execute search
    results = await client.search(
        collection_name=config["collection"],
        query_vector=config["vector"],
        limit=config.get("limit", 10),
        score_threshold=config.get("score_threshold"),
        query_filter=query_filter,
        with_payload=config.get("with_payload", True),
        with_vectors=config.get("with_vectors", False),
    )
    
    # Format results
    return {
        "results": [
            {
                "id": str(r.id),
                "score": r.score,
                "payload": r.payload if r.payload else {},
                "vector": r.vector if r.vector else None,
            }
            for r in results
        ]
    }


def _build_filter(filter_config: Dict[str, Any]) -> Filter:
    """
    Build Qdrant filter from config.
    
    Filter config format:
        {
            "must": [
                {"field": "category", "match": "tech"},
                {"field": "year", "range": {"gte": 2020}},
            ],
            "should": [...],
            "must_not": [...],
        }
    """
    must = []
    should = []
    must_not = []
    
    for cond in filter_config.get("must", []):
        must.append(_build_condition(cond))
    
    for cond in filter_config.get("should", []):
        should.append(_build_condition(cond))
    
    for cond in filter_config.get("must_not", []):
        must_not.append(_build_condition(cond))
    
    return Filter(
        must=must if must else None,
        should=should if should else None,
        must_not=must_not if must_not else None,
    )


def _build_condition(cond: Dict[str, Any]) -> FieldCondition:
    """Build a single filter condition."""
    field = cond["field"]
    
    if "match" in cond:
        return FieldCondition(
            key=field,
            match=MatchValue(value=cond["match"]),
        )
    
    if "range" in cond:
        return FieldCondition(
            key=field,
            range=Range(**cond["range"]),
        )
    
    raise ValueError(f"Unknown condition type for field {field}")
`;
```

### Success Criteria
- [ ] Vector search returns results
- [ ] Filtering works correctly
- [ ] Score threshold filters results
- [ ] Payloads included when requested

---

## Task 3.2: Qdrant Upsert Node

**Duration:** 0.5 day  
**Confidence Target:** 8/10  
**Dependencies:** Task 3.1

### Objective
Implement Qdrant upsert for adding/updating vectors.

### File Addition to `qdrant.py.ts`

```typescript
export const QDRANT_UPSERT_TEMPLATE = `"""
Qdrant upsert node.
"""

async def execute_qdrant_upsert(
    ctx: ExecutionContext,
    config: Dict[str, Any],
) -> Dict[str, Any]:
    """
    Upsert points to Qdrant collection.
    
    Config:
        collection: Collection name
        points: List of {id, vector, payload}
        wait: Wait for indexing (default True)
    
    Returns:
        {"status": "ok", "count": int}
    """
    from qdrant_client.models import PointStruct
    
    client = ctx.qdrant
    if not client:
        raise RuntimeError("Qdrant not configured")
    
    # Build points
    points = [
        PointStruct(
            id=p["id"],
            vector=p["vector"],
            payload=p.get("payload", {}),
        )
        for p in config["points"]
    ]
    
    # Upsert
    await client.upsert(
        collection_name=config["collection"],
        points=points,
        wait=config.get("wait", True),
    )
    
    return {"status": "ok", "count": len(points)}
`;
```

### Success Criteria
- [ ] Points upserted correctly
- [ ] Payloads stored
- [ ] Batch upsert works

---

## Task 3.3: PostgreSQL Query Node

**Duration:** 1 day  
**Confidence Target:** 8/10  
**Dependencies:** Phase 1 (ConnectionPools)

### Objective
Implement PostgreSQL query execution with parameterized queries.

### File: `src/core/codegen/python/nodes/data/postgres.py.ts`

```typescript
/**
 * @file postgres.py.ts
 * @description Template for PostgreSQL query node
 */

export const POSTGRES_QUERY_TEMPLATE = `"""
PostgreSQL query node.

Features:
- Parameterized queries (SQL injection safe)
- Connection pooling via asyncpg
- Transaction support
- Multiple result formats
"""

from typing import Any, Dict, List, Optional
from runtime.context import ExecutionContext


async def execute_postgres_query(
    ctx: ExecutionContext,
    config: Dict[str, Any],
) -> Dict[str, Any]:
    """
    Execute PostgreSQL query.
    
    Config:
        query: SQL query string
        params: Query parameters (list or dict)
        operation: "fetch" | "fetchrow" | "execute" | "fetchval"
        transaction: Wrap in transaction (default False)
    
    Returns:
        {
            "rows": List[Dict] (for fetch),
            "row": Dict (for fetchrow),
            "value": Any (for fetchval),
            "affected": int (for execute),
        }
    """
    pool = ctx.postgres
    if not pool:
        raise RuntimeError("PostgreSQL not configured")
    
    query = config["query"]
    params = config.get("params", [])
    operation = config.get("operation", "fetch")
    
    async with pool.acquire() as conn:
        if config.get("transaction"):
            async with conn.transaction():
                return await _execute(conn, query, params, operation)
        else:
            return await _execute(conn, query, params, operation)


async def _execute(conn, query: str, params, operation: str) -> Dict[str, Any]:
    """Execute query with specified operation."""
    
    if operation == "fetch":
        rows = await conn.fetch(query, *params)
        return {"rows": [dict(r) for r in rows]}
    
    elif operation == "fetchrow":
        row = await conn.fetchrow(query, *params)
        return {"row": dict(row) if row else None}
    
    elif operation == "fetchval":
        value = await conn.fetchval(query, *params)
        return {"value": value}
    
    elif operation == "execute":
        result = await conn.execute(query, *params)
        # Parse "INSERT 0 1" format
        affected = int(result.split()[-1]) if result else 0
        return {"affected": affected}
    
    else:
        raise ValueError(f"Unknown operation: {operation}")
`;
```

### Success Criteria
- [ ] SELECT queries return rows
- [ ] INSERT/UPDATE return affected count
- [ ] Parameters properly escaped
- [ ] Connection pooling used

---

## Task 3.4: Redis Operations Node

**Duration:** 0.5 day  
**Confidence Target:** 9/10  
**Dependencies:** Phase 1 (ConnectionPools)

### Objective
Implement Redis operations for caching and data storage.

### File: `src/core/codegen/python/nodes/data/redis.py.ts`

```typescript
/**
 * @file redis.py.ts
 * @description Template for Redis operations node
 */

export const REDIS_NODE_TEMPLATE = `"""
Redis operations node.

Features:
- Get/Set with TTL
- Hash operations
- List operations
- JSON support via orjson
"""

import orjson
from typing import Any, Dict, Optional
from runtime.context import ExecutionContext


async def execute_redis_operation(
    ctx: ExecutionContext,
    config: Dict[str, Any],
) -> Dict[str, Any]:
    """
    Execute Redis operation.
    
    Config:
        operation: "get" | "set" | "delete" | "hget" | "hset" | "lpush" | "rpop"
        key: Redis key
        value: Value for set operations
        ttl: TTL in seconds (for set)
        field: Hash field (for hget/hset)
        json: Serialize/deserialize as JSON (default True)
    
    Returns:
        {"value": Any} for get operations
        {"ok": True} for set operations
    """
    redis = ctx.redis
    if not redis:
        raise RuntimeError("Redis not configured")
    
    op = config["operation"]
    key = config["key"]
    use_json = config.get("json", True)
    
    if op == "get":
        value = await redis.get(key)
        if value and use_json:
            value = orjson.loads(value)
        return {"value": value}
    
    elif op == "set":
        value = config["value"]
        if use_json:
            value = orjson.dumps(value).decode()
        ttl = config.get("ttl")
        if ttl:
            await redis.setex(key, ttl, value)
        else:
            await redis.set(key, value)
        return {"ok": True}
    
    elif op == "delete":
        await redis.delete(key)
        return {"ok": True}
    
    elif op == "hget":
        field = config["field"]
        value = await redis.hget(key, field)
        if value and use_json:
            value = orjson.loads(value)
        return {"value": value}
    
    elif op == "hset":
        field = config["field"]
        value = config["value"]
        if use_json:
            value = orjson.dumps(value).decode()
        await redis.hset(key, field, value)
        return {"ok": True}
    
    else:
        raise ValueError(f"Unknown Redis operation: {op}")
`;
```

### Success Criteria
- [ ] Get/Set operations work
- [ ] TTL expires correctly
- [ ] JSON serialization works
- [ ] Hash operations work

---

## Task 3.5: Cache Utilities

**Duration:** 0.5 day  
**Confidence Target:** 8/10  
**Dependencies:** Task 3.4 (Redis)

### Objective
Implement caching decorator and utilities for performance optimization.

### Key Design Decisions
- Support both in-memory (LRU) and Redis caching
- Configurable TTL
- Custom key functions
- Async-safe implementation

### File: `src/core/codegen/python/templates/cache.py.ts`

```typescript
/**
 * @file cache.py.ts
 * @description Template for caching utilities
 */

export const CACHE_UTILS_TEMPLATE = `"""
Caching utilities for workflow performance.

Features:
- @cached decorator for async functions
- In-memory LRU for single instance
- Redis backend for distributed
- Custom key generation
"""

import hashlib
import orjson
from functools import wraps
from typing import Any, Callable, Optional, TypeVar, ParamSpec
from cachetools import TTLCache

# Type variables for decorator typing
P = ParamSpec('P')
T = TypeVar('T')

# In-memory LRU cache (for single instance deployments)
_memory_cache: TTLCache = TTLCache(maxsize=1000, ttl=3600)


def cached(
    ttl: int = 3600,
    key_fn: Optional[Callable[..., str]] = None,
    backend: str = "memory",
) -> Callable[[Callable[P, T]], Callable[P, T]]:
    """
    Cache decorator for async functions.
    
    Args:
        ttl: Cache TTL in seconds (default 1 hour)
        key_fn: Custom key generation function
        backend: "memory" or "redis"
    
    Usage:
        @cached(ttl=3600, key_fn=lambda ctx, text: f"emb:{hash(text)}")
        async def get_embedding(ctx: ExecutionContext, text: str) -> List[float]:
            return await generate_embedding(ctx, text)
    
    Note:
        For Redis backend, ctx must have redis connection available.
    """
    def decorator(func: Callable[P, T]) -> Callable[P, T]:
        @wraps(func)
        async def wrapper(*args: P.args, **kwargs: P.kwargs) -> T:
            # Generate cache key
            if key_fn:
                cache_key = key_fn(*args, **kwargs)
            else:
                cache_key = _default_key(func.__name__, args, kwargs)
            
            # Try to get from cache
            if backend == "memory":
                cached_value = _memory_cache.get(cache_key)
                if cached_value is not None:
                    return cached_value
            
            elif backend == "redis":
                # First arg should be ctx with redis connection
                ctx = args[0] if args else kwargs.get("ctx")
                if ctx and ctx.redis:
                    cached_value = await ctx.redis.get(cache_key)
                    if cached_value:
                        return orjson.loads(cached_value)
            
            # Cache miss - execute function
            result = await func(*args, **kwargs)
            
            # Store in cache
            if backend == "memory":
                _memory_cache[cache_key] = result
            
            elif backend == "redis":
                ctx = args[0] if args else kwargs.get("ctx")
                if ctx and ctx.redis:
                    await ctx.redis.setex(
                        cache_key,
                        ttl,
                        orjson.dumps(result).decode(),
                    )
            
            return result
        
        return wrapper
    return decorator


def _default_key(func_name: str, args: tuple, kwargs: dict) -> str:
    """Generate default cache key from function name and arguments."""
    # Skip ctx argument (first positional) as it contains non-hashable data
    hashable_args = args[1:] if args else ()
    
    key_data = {
        "func": func_name,
        "args": hashable_args,
        "kwargs": {k: v for k, v in kwargs.items() if k != "ctx"},
    }
    
    key_json = orjson.dumps(key_data, option=orjson.OPT_SORT_KEYS)
    return f"cache:{hashlib.md5(key_json).hexdigest()}"


async def invalidate_cache(
    ctx: 'ExecutionContext',
    pattern: str,
    backend: str = "memory",
) -> int:
    """
    Invalidate cache entries matching pattern.
    
    Args:
        ctx: Execution context
        pattern: Key pattern (supports * wildcard for Redis)
        backend: "memory" or "redis"
    
    Returns:
        Number of keys invalidated
    """
    count = 0
    
    if backend == "memory":
        keys_to_delete = [k for k in _memory_cache.keys() if pattern in k]
        for key in keys_to_delete:
            del _memory_cache[key]
            count += 1
    
    elif backend == "redis" and ctx.redis:
        async for key in ctx.redis.scan_iter(match=pattern):
            await ctx.redis.delete(key)
            count += 1
    
    return count


# Convenience decorator for embedding caching
def cached_embedding(ttl: int = 86400):
    """
    Specialized cache decorator for embeddings.
    
    Uses content hash as key for deduplication.
    Default TTL of 24 hours (embeddings don't change).
    """
    def key_fn(ctx, text: str) -> str:
        text_hash = hashlib.md5(text.encode()).hexdigest()
        return f"embedding:{text_hash}"
    
    return cached(ttl=ttl, key_fn=key_fn, backend="redis")
`;
```

### Success Criteria
- [ ] @cached decorator works with async functions
- [ ] Memory backend uses LRU eviction
- [ ] Redis backend persists across restarts
- [ ] Custom key functions work
- [ ] TTL expires correctly

---

## Task 3.6: Directus SDK Node

**Duration:** 1 day  
**Confidence Target:** 7/10  
**Dependencies:** Phase 1 (HTTP client)

### Objective
Implement Directus CMS integration for content management.

### File: `src/core/codegen/python/nodes/data/directus.py.ts`

```typescript
/**
 * @file directus.py.ts
 * @description Template for Directus SDK node
 */

export const DIRECTUS_NODE_TEMPLATE = `"""
Directus SDK node.

Features:
- Items CRUD operations
- Authentication
- File uploads
- Relations support
"""

from typing import Any, Dict, List, Optional
from runtime.context import ExecutionContext


async def execute_directus_operation(
    ctx: ExecutionContext,
    config: Dict[str, Any],
) -> Dict[str, Any]:
    """
    Execute Directus SDK operation.
    
    Config:
        operation: "readItems" | "readItem" | "createItem" | "updateItem" | "deleteItem"
        collection: Collection name
        id: Item ID (for single item operations)
        data: Item data (for create/update)
        query: Query parameters (filter, sort, limit, fields)
    
    Returns:
        {"data": Any, "meta": Dict}
    """
    base_url = ctx.secrets["DIRECTUS_URL"]
    token = ctx.secrets.get("DIRECTUS_TOKEN")
    
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    
    op = config["operation"]
    collection = config["collection"]
    
    if op == "readItems":
        return await _read_items(ctx, base_url, headers, collection, config.get("query", {}))
    
    elif op == "readItem":
        return await _read_item(ctx, base_url, headers, collection, config["id"])
    
    elif op == "createItem":
        return await _create_item(ctx, base_url, headers, collection, config["data"])
    
    elif op == "updateItem":
        return await _update_item(ctx, base_url, headers, collection, config["id"], config["data"])
    
    elif op == "deleteItem":
        return await _delete_item(ctx, base_url, headers, collection, config["id"])
    
    else:
        raise ValueError(f"Unknown Directus operation: {op}")


async def _read_items(ctx, base_url: str, headers: Dict, collection: str, query: Dict) -> Dict:
    """Read multiple items with query."""
    params = {}
    
    if query.get("filter"):
        params["filter"] = query["filter"]
    if query.get("sort"):
        params["sort"] = query["sort"]
    if query.get("limit"):
        params["limit"] = query["limit"]
    if query.get("fields"):
        params["fields"] = ",".join(query["fields"])
    
    response = await ctx.http.get(
        f"{base_url}/items/{collection}",
        headers=headers,
        params=params,
    )
    response.raise_for_status()
    
    data = response.json()
    return {"data": data.get("data", []), "meta": data.get("meta", {})}


async def _read_item(ctx, base_url: str, headers: Dict, collection: str, item_id: str) -> Dict:
    """Read single item by ID."""
    response = await ctx.http.get(
        f"{base_url}/items/{collection}/{item_id}",
        headers=headers,
    )
    response.raise_for_status()
    
    data = response.json()
    return {"data": data.get("data")}


async def _create_item(ctx, base_url: str, headers: Dict, collection: str, data: Dict) -> Dict:
    """Create new item."""
    response = await ctx.http.post(
        f"{base_url}/items/{collection}",
        headers=headers,
        json=data,
    )
    response.raise_for_status()
    
    result = response.json()
    return {"data": result.get("data")}


async def _update_item(ctx, base_url: str, headers: Dict, collection: str, item_id: str, data: Dict) -> Dict:
    """Update existing item."""
    response = await ctx.http.patch(
        f"{base_url}/items/{collection}/{item_id}",
        headers=headers,
        json=data,
    )
    response.raise_for_status()
    
    result = response.json()
    return {"data": result.get("data")}


async def _delete_item(ctx, base_url: str, headers: Dict, collection: str, item_id: str) -> Dict:
    """Delete item."""
    response = await ctx.http.delete(
        f"{base_url}/items/{collection}/{item_id}",
        headers=headers,
    )
    response.raise_for_status()
    
    return {"deleted": True}
`;
```

### Success Criteria
- [ ] Read items with filters works
- [ ] Create/Update items works
- [ ] Delete items works
- [ ] Authentication works

---

## Task 3.7: GraphQL Query Node

**Duration:** 0.5 day  
**Confidence Target:** 8/10  
**Dependencies:** Phase 1 (HTTP client)

### Objective
Implement GraphQL query execution.

### File: `src/core/codegen/python/nodes/data/graphql.py.ts`

```typescript
/**
 * @file graphql.py.ts
 * @description Template for GraphQL query node
 */

export const GRAPHQL_NODE_TEMPLATE = `"""
GraphQL query node.

Features:
- Query execution
- Variables support
- Custom headers
- Error handling
"""

from typing import Any, Dict, Optional
from runtime.context import ExecutionContext


async def execute_graphql_query(
    ctx: ExecutionContext,
    config: Dict[str, Any],
) -> Dict[str, Any]:
    """
    Execute GraphQL query.
    
    Config:
        endpoint: GraphQL endpoint URL
        query: GraphQL query string
        variables: Query variables (optional)
        headers: Additional headers (optional)
    
    Returns:
        {"data": Dict, "errors": List (if any)}
    """
    endpoint = config["endpoint"]
    query = config["query"]
    variables = config.get("variables", {})
    
    headers = {"Content-Type": "application/json"}
    headers.update(config.get("headers", {}))
    
    # Add auth if configured
    if config.get("auth_header"):
        headers["Authorization"] = config["auth_header"]
    
    response = await ctx.http.post(
        endpoint,
        headers=headers,
        json={
            "query": query,
            "variables": variables,
        },
    )
    response.raise_for_status()
    
    result = response.json()
    
    return {
        "data": result.get("data"),
        "errors": result.get("errors"),
    }
`;
```

### Success Criteria
- [ ] Queries execute correctly
- [ ] Variables substituted
- [ ] Errors returned properly
- [ ] Headers passed through

---

## Phase 3 Deliverables Summary

| Task | Deliverable | Duration | Confidence |
|------|-------------|----------|------------|
| 3.1 | Qdrant Search Node | 1d | 8/10 |
| 3.2 | Qdrant Upsert Node | 0.5d | 8/10 |
| 3.3 | PostgreSQL Query Node | 1d | 8/10 |
| 3.4 | Redis Operations Node | 0.5d | 9/10 |
| 3.5 | Cache Utilities | 0.5d | 8/10 |
| 3.6 | Directus SDK Node | 1d | 7/10 |
| 3.7 | GraphQL Query Node | 0.5d | 8/10 |

**Total Phase 3 Duration:** ~5 days

---

## Human Review Checkpoints

**After Task 3.1:**
- Qdrant search returns relevant results
- Filtering works correctly

**After Task 3.5:**
- Cache hit/miss working
- TTL expiration tested

**End of Phase 3:**
- All data nodes functional
- Caching reduces latency

---

## Performance Validation Checklist

Before completing Phase 3, verify:

- [ ] All data nodes use connection pools from context
- [ ] PostgreSQL queries use parameterized queries (no SQL injection)
- [ ] Redis operations use orjson for serialization
- [ ] Cache utilities support both memory and Redis backends
- [ ] Embedding cache uses content hash for deduplication
- [ ] Qdrant filters compile correctly

---

**Previous Phase:** [CATALYST_PHASE_2_TASKS.md](./CATALYST_PHASE_2_TASKS.md)  
**Next Phase:** [CATALYST_PHASE_4_TASKS.md](./CATALYST_PHASE_4_TASKS.md)
