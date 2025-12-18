# Catalyst Phase 1: Core Runtime Tasks
## Detailed Task Specifications

**Phase Duration:** ~2 weeks  
**Dependencies:** Phase 0 complete  
**Goal:** Build the Python code generation engine with performance-optimized runtime

---

## Overview

Phase 1 establishes the core code generation capabilities:
1. Python workflow code generator
2. Performance-optimized runtime stack
3. ExecutionContext for zero-copy data flow
4. Connection pool management
5. Expression compilation system
6. FastAPI integration with lifespan management

---

## Task 1.1: Python Code Generator Core

**Duration:** 2 days  
**Confidence Target:** 7/10  
**Dependencies:** Phase 0 complete

### Objective
Create the main code generation engine that converts workflow manifests to Python code.

### File Structure
```
src/core/codegen/python/
├── index.ts
├── PythonWorkflowGenerator.ts
├── WorkflowAnalyzer.ts
├── ImportBuilder.ts
├── NodeCodeGenerator.ts
├── CodeAssembler.ts
└── templates/
    ├── main.py.ts
    ├── workflow.py.ts
    ├── config.py.ts
    └── requirements.txt.ts
```

### File: `src/core/codegen/python/PythonWorkflowGenerator.ts`

```typescript
/**
 * @file PythonWorkflowGenerator.ts
 * @description Main generator that converts Catalyst manifests to Python code
 * 
 * @architecture Phase 1, Task 1.1 - Python Code Generator Core
 * @created 2025-12-XX
 * @author AI (Cline) + Human Review
 * @confidence 7/10
 * 
 * @see CATALYST_SPECIFICATION.md Section 3 - Code Generation
 * @see CATALYST_PERFORMANCE_REQUIREMENTS.md - Performance optimizations
 */

import type { CatalystManifest, WorkflowDefinition } from '../../workflow/types';
import { WorkflowAnalyzer } from './WorkflowAnalyzer';
import { ImportBuilder } from './ImportBuilder';
import { NodeCodeGenerator } from './NodeCodeGenerator';
import { CodeAssembler } from './CodeAssembler';
import { ExpressionCompiler } from './ExpressionCompiler';

export interface GeneratedProject {
  files: Map<string, string>;
  entryPoint: string;
}

export class PythonWorkflowGenerator {
  private analyzer: WorkflowAnalyzer;
  private importBuilder: ImportBuilder;
  private nodeGenerator: NodeCodeGenerator;
  private assembler: CodeAssembler;
  private expressionCompiler: ExpressionCompiler;

  constructor() {
    this.analyzer = new WorkflowAnalyzer();
    this.importBuilder = new ImportBuilder();
    this.nodeGenerator = new NodeCodeGenerator();
    this.assembler = new CodeAssembler();
    this.expressionCompiler = new ExpressionCompiler();
  }

  /**
   * Generate complete Python project from manifest
   */
  async generate(manifest: CatalystManifest): Promise<GeneratedProject> {
    const files = new Map<string, string>();

    // Generate main.py with uvloop and performance setup
    files.set('main.py', this.generateMain(manifest));

    // Generate config.py
    files.set('config.py', this.generateConfig(manifest));

    // Generate requirements.txt with performance dependencies
    files.set('requirements.txt', this.generateRequirements());

    // Generate runtime utilities
    files.set('runtime/context.py', this.generateExecutionContext());
    files.set('runtime/pools.py', this.generateConnectionPools());
    files.set('runtime/__init__.py', '');

    // Generate each workflow
    for (const [id, workflow] of Object.entries(manifest.workflows)) {
      const code = this.generateWorkflow(workflow, manifest);
      files.set(`workflows/${id}.py`, code);
    }

    // Generate workflows/__init__.py
    files.set('workflows/__init__.py', this.generateWorkflowsInit(manifest));

    return { files, entryPoint: 'main.py' };
  }

  private generateMain(manifest: CatalystManifest): string {
    return `"""
Catalyst Generated FastAPI Application
Project: ${manifest.metadata.projectName}
Generated: ${new Date().toISOString()}
"""

# Performance: Install uvloop for 2-4x faster event loop
import uvloop
uvloop.install()

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.responses import ORJSONResponse
from fastapi.middleware.cors import CORSMiddleware

from config import settings
from runtime.pools import ConnectionPools

# Import workflows
${Object.keys(manifest.workflows).map(id => `from workflows.${id} import router as ${id}_router`).join('\n')}

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan - manage connection pools."""
    # Startup: Initialize connection pools
    app.state.pools = await ConnectionPools.create(settings)
    yield
    # Shutdown: Close all connections
    await app.state.pools.close()

# Create FastAPI app with performance optimizations
app = FastAPI(
    title="${manifest.metadata.projectName}",
    description="${manifest.metadata.description || 'Catalyst Generated API'}",
    default_response_class=ORJSONResponse,  # 10x faster JSON
    lifespan=lifespan,
)

# CORS configuration
${manifest.config.cors ? `
app.add_middleware(
    CORSMiddleware,
    allow_origins=${JSON.stringify(manifest.config.cors.origins)},
    allow_methods=${JSON.stringify(manifest.config.cors.methods)},
    allow_credentials=True,
    allow_headers=["*"],
)` : '# CORS not configured'}

# Register workflow routers
${Object.keys(manifest.workflows).map(id => `app.include_router(${id}_router)`).join('\n')}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=${manifest.config.port},
        reload=True,
    )
`;
  }

  private generateConfig(manifest: CatalystManifest): string {
    return `"""
Configuration for ${manifest.metadata.projectName}
"""
from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    # Server
    port: int = ${manifest.config.port}
    
    # Secrets
${Object.entries(manifest.secrets).map(([key, def]) => 
  `    ${key.toLowerCase()}: ${def.required ? 'str' : 'Optional[str]'} = ${def.default ? `"${def.default}"` : 'None'}`
).join('\n')}
    
    # Database (if configured)
    postgres_url: Optional[str] = None
    redis_url: Optional[str] = None
    qdrant_url: Optional[str] = None
    
    class Config:
        env_file = ".env"

settings = Settings()
`;
  }

  private generateRequirements(): string {
    return `# Catalyst Generated Requirements
# Performance-optimized Python stack

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
pydantic-settings>=2.0.0
`;
  }

  private generateExecutionContext(): string {
    // Delegated to Task 1.3
    return '# See Task 1.3 for full implementation';
  }

  private generateConnectionPools(): string {
    // Delegated to Task 1.4
    return '# See Task 1.4 for full implementation';
  }

  private generateWorkflow(workflow: WorkflowDefinition, manifest: CatalystManifest): string {
    // Analyze workflow structure
    const analysis = this.analyzer.analyze(workflow);
    
    // Build imports
    const imports = this.importBuilder.build(analysis);
    
    // Generate node code
    const nodeCode = this.nodeGenerator.generateAll(workflow.nodes, this.expressionCompiler);
    
    // Assemble final code
    return this.assembler.assemble({
      workflow,
      imports,
      nodeCode,
      analysis,
    });
  }

  private generateWorkflowsInit(manifest: CatalystManifest): string {
    return Object.keys(manifest.workflows)
      .map(id => `from .${id} import router as ${id}_router`)
      .join('\n');
  }
}
```

### Success Criteria
- [ ] Generates valid Python syntax
- [ ] main.py includes uvloop setup
- [ ] FastAPI uses ORJSONResponse default
- [ ] requirements.txt includes all performance deps
- [ ] All workflows generate to separate files

---

## Task 1.2: Performance Stack Generator

**Duration:** 0.5 day  
**Confidence Target:** 9/10  
**Dependencies:** Task 1.1

### Objective
Ensure all generated projects include the optimized Python performance stack.

### Requirements

All generated Catalyst projects must use:

| Component | Standard | Required | Rationale |
|-----------|----------|----------|-----------|
| Event Loop | asyncio | **uvloop** | 2-4x faster (uses libuv) |
| JSON | json | **orjson** | 10x faster (Rust-based) |
| HTTP Parsing | Python | **httptools** | 10x faster (C-based) |
| HTTP Client | requests | **httpx** | Async + connection pooling |
| PostgreSQL | psycopg2 | **asyncpg** | 3x faster + native async |
| Validation | Pydantic v1 | **Pydantic v2** | 5x faster |

### File: `src/core/codegen/python/templates/main.py.ts`

```typescript
/**
 * @file main.py.ts
 * @description Template for main.py with performance optimizations
 */

export function generateMainPy(config: MainPyConfig): string {
  return `"""
${config.projectName} - Generated by Catalyst
"""

# CRITICAL: uvloop must be installed before any async imports
import uvloop
uvloop.install()

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.responses import ORJSONResponse
from fastapi.middleware.cors import CORSMiddleware

from config import settings
from runtime.pools import ConnectionPools
from runtime.context import ExecutionContext

${config.workflowImports}

@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application lifespan management.
    
    Creates connection pools at startup:
    - HTTP client with keep-alive
    - Database connections (if configured)
    - Redis connection (if configured)
    - LLM provider clients
    
    Closes all connections on shutdown.
    """
    # Startup
    app.state.pools = await ConnectionPools.create(settings)
    yield
    # Shutdown
    await app.state.pools.close()

app = FastAPI(
    title="${config.projectName}",
    description="${config.description}",
    version="${config.version}",
    default_response_class=ORJSONResponse,
    lifespan=lifespan,
)

${config.corsMiddleware}

${config.routerIncludes}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=${config.port}, reload=True)
`;
}

export interface MainPyConfig {
  projectName: string;
  description: string;
  version: string;
  port: number;
  workflowImports: string;
  corsMiddleware: string;
  routerIncludes: string;
}
```

### Success Criteria
- [ ] Generated code imports uvloop first
- [ ] uvloop.install() called before FastAPI
- [ ] ORJSONResponse is default response class
- [ ] All JSON uses orjson, not json module
- [ ] requirements.txt includes uvloop, orjson, httptools

---

## Task 1.3: ExecutionContext Implementation

**Duration:** 0.5 day  
**Confidence Target:** 8/10  
**Dependencies:** Task 1.1

### Objective
Implement zero-copy ExecutionContext that passes data by reference through workflows.

### Key Design Decisions
- Use `__slots__` for 35% memory reduction
- Pass by reference, clone only for parallel branches
- O(1) node output access via dict
- Nanosecond precision timing

### File: `src/core/codegen/python/templates/context.py.ts`

```typescript
/**
 * @file context.py.ts
 * @description Template for ExecutionContext with zero-copy semantics
 */

export const EXECUTION_CONTEXT_TEMPLATE = `"""
ExecutionContext - Zero-copy execution context for workflows.

Design:
- Passed by reference through all nodes
- Clone ONLY when entering parallel branches
- Uses __slots__ for 35% memory reduction
- O(1) node output access

Usage:
    ctx = ExecutionContext.create(workflow_id, input_data, pools)
    await node.execute(ctx)
    result = ctx.get_output("node_id")
"""

import time
import uuid
from typing import Any, Dict, Optional
from dataclasses import dataclass
from copy import deepcopy

class ExecutionContext:
    """
    Zero-copy execution context.
    Passed by reference through all nodes.
    """
    __slots__ = (
        'workflow_id',
        'execution_id', 
        'input',
        'node_outputs',
        'node_timings',
        'global_vars',
        'secrets',
        '_pools',
        '_start_time',
    )
    
    def __init__(
        self,
        workflow_id: str,
        execution_id: str,
        input_data: Dict[str, Any],
        pools: 'ConnectionPools',
        secrets: Dict[str, str],
        global_vars: Optional[Dict[str, Any]] = None,
    ):
        self.workflow_id = workflow_id
        self.execution_id = execution_id
        self.input = input_data
        self.node_outputs: Dict[str, Any] = {}
        self.node_timings: Dict[str, float] = {}
        self.global_vars = global_vars or {}
        self.secrets = secrets
        self._pools = pools
        self._start_time = time.monotonic_ns()
    
    @classmethod
    def create(
        cls,
        workflow_id: str,
        input_data: Dict[str, Any],
        pools: 'ConnectionPools',
        secrets: Dict[str, str],
        global_vars: Optional[Dict[str, Any]] = None,
    ) -> 'ExecutionContext':
        """Factory method to create new context."""
        execution_id = str(uuid.uuid4())
        return cls(
            workflow_id=workflow_id,
            execution_id=execution_id,
            input_data=input_data,
            pools=pools,
            secrets=secrets,
            global_vars=global_vars,
        )
    
    def set_output(self, node_id: str, output: Any) -> None:
        """O(1) dict assignment for node output."""
        self.node_outputs[node_id] = output
    
    def get_output(self, node_id: str) -> Any:
        """O(1) dict lookup for node output."""
        return self.node_outputs.get(node_id)
    
    def set_timing(self, node_id: str, elapsed_ms: float) -> None:
        """Record node execution time."""
        self.node_timings[node_id] = elapsed_ms
    
    @property
    def elapsed_ms(self) -> float:
        """Total execution time in milliseconds."""
        return (time.monotonic_ns() - self._start_time) / 1_000_000
    
    @property
    def http(self) -> 'httpx.AsyncClient':
        """Access HTTP client pool."""
        return self._pools.http
    
    @property
    def anthropic(self) -> 'httpx.AsyncClient':
        """Access Anthropic-dedicated HTTP pool."""
        return self._pools.anthropic
    
    @property
    def postgres(self) -> Optional['asyncpg.Pool']:
        """Access PostgreSQL pool."""
        return self._pools.postgres
    
    @property
    def redis(self) -> Optional['redis.Redis']:
        """Access Redis client."""
        return self._pools.redis
    
    @property
    def qdrant(self) -> Optional['AsyncQdrantClient']:
        """Access Qdrant client."""
        return self._pools.qdrant
    
    def clone(self) -> 'ExecutionContext':
        """
        Deep clone for parallel branches only.
        
        Clones:
        - node_outputs (so parallel branches don't conflict)
        - node_timings
        
        Shares (immutable/thread-safe):
        - input
        - pools
        - secrets
        - global_vars
        """
        cloned = ExecutionContext.__new__(ExecutionContext)
        cloned.workflow_id = self.workflow_id
        cloned.execution_id = self.execution_id
        cloned.input = self.input  # Shared - don't modify
        cloned.node_outputs = deepcopy(self.node_outputs)
        cloned.node_timings = deepcopy(self.node_timings)
        cloned.global_vars = self.global_vars  # Shared
        cloned.secrets = self.secrets  # Shared
        cloned._pools = self._pools  # Shared - thread-safe
        cloned._start_time = self._start_time
        return cloned
    
    def get_metadata(self) -> Dict[str, Any]:
        """Get execution metadata for response."""
        return {
            "workflow_id": self.workflow_id,
            "execution_id": self.execution_id,
            "elapsed_ms": self.elapsed_ms,
            "node_timings": self.node_timings,
        }
`;
```

### Success Criteria
- [ ] Uses `__slots__` for memory efficiency
- [ ] clone() creates proper deep copy for parallel
- [ ] O(1) get_output/set_output operations
- [ ] elapsed_ms uses nanosecond precision
- [ ] Pool access via properties

---

## Task 1.4: ConnectionPools Implementation

**Duration:** 1 day  
**Confidence Target:** 8/10  
**Dependencies:** Task 1.1

### Objective
Create singleton connection pools created at application startup.

### Key Design Decisions
- Create all pools at startup, not per-request
- Dedicated pool for LLM providers (different timeout needs)
- Configurable pool sizes
- Graceful shutdown with connection cleanup

### File: `src/core/codegen/python/templates/pools.py.ts`

```typescript
/**
 * @file pools.py.ts
 * @description Template for ConnectionPools singleton
 */

export const CONNECTION_POOLS_TEMPLATE = `"""
ConnectionPools - Singleton connection pools created at startup.

Design:
- Created once in FastAPI lifespan
- Shared across all workflow executions
- Proper cleanup on shutdown

Performance Impact:
- Eliminates per-request connection overhead
- Keep-alive connections reduce latency
- Dedicated LLM pool handles long-running requests
"""

from dataclasses import dataclass
from typing import Optional
import httpx

# Optional imports - only if configured
try:
    import asyncpg
except ImportError:
    asyncpg = None

try:
    import redis.asyncio as redis
except ImportError:
    redis = None

try:
    from qdrant_client import AsyncQdrantClient
except ImportError:
    AsyncQdrantClient = None


@dataclass
class ConnectionPools:
    """Singleton connection pools created at startup."""
    
    # General HTTP client with connection pooling
    http: httpx.AsyncClient
    
    # Dedicated pool for LLM providers (longer timeouts)
    anthropic: httpx.AsyncClient
    
    # Database connections (optional)
    postgres: Optional['asyncpg.Pool'] = None
    redis: Optional['redis.Redis'] = None
    qdrant: Optional['AsyncQdrantClient'] = None
    
    @classmethod
    async def create(cls, settings: 'Settings') -> 'ConnectionPools':
        """
        Create all connection pools.
        
        Called once at application startup in FastAPI lifespan.
        """
        # General HTTP client
        http = httpx.AsyncClient(
            limits=httpx.Limits(
                max_keepalive_connections=100,
                max_connections=200,
            ),
            timeout=httpx.Timeout(30.0, connect=5.0),
        )
        
        # Dedicated LLM client (longer timeout for streaming)
        anthropic = httpx.AsyncClient(
            limits=httpx.Limits(
                max_keepalive_connections=20,
                max_connections=50,
            ),
            timeout=httpx.Timeout(120.0, connect=10.0),
            headers={
                "anthropic-version": "2023-06-01",
            },
        )
        
        # PostgreSQL pool (if configured)
        postgres = None
        if settings.postgres_url and asyncpg:
            postgres = await asyncpg.create_pool(
                settings.postgres_url,
                min_size=5,
                max_size=20,
            )
        
        # Redis client (if configured)
        redis_client = None
        if settings.redis_url and redis:
            redis_client = redis.from_url(
                settings.redis_url,
                encoding="utf-8",
                decode_responses=True,
            )
        
        # Qdrant client (if configured)
        qdrant = None
        if settings.qdrant_url and AsyncQdrantClient:
            qdrant = AsyncQdrantClient(url=settings.qdrant_url)
        
        return cls(
            http=http,
            anthropic=anthropic,
            postgres=postgres,
            redis=redis_client,
            qdrant=qdrant,
        )
    
    async def close(self) -> None:
        """
        Close all connections gracefully.
        
        Called at application shutdown in FastAPI lifespan.
        """
        await self.http.aclose()
        await self.anthropic.aclose()
        
        if self.postgres:
            await self.postgres.close()
        
        if self.redis:
            await self.redis.close()
        
        if self.qdrant:
            await self.qdrant.close()
`;
```

### Success Criteria
- [ ] Pools created at startup, not per-request
- [ ] Dedicated LLM pool with longer timeouts
- [ ] Optional pools only created if configured
- [ ] Graceful close() method
- [ ] Integration with FastAPI lifespan

---

## Task 1.5: FastAPI Lifespan Integration

**Duration:** 0.25 day  
**Confidence Target:** 9/10  
**Dependencies:** Task 1.4

### Objective
Generate FastAPI lifespan context manager for pool management.

### File: `src/core/codegen/python/templates/lifespan.py.ts`

```typescript
/**
 * @file lifespan.py.ts
 * @description Template for FastAPI lifespan with pool management
 */

export function generateLifespan(): string {
  return `
@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application lifespan manager.
    
    Startup:
    - Create connection pools (HTTP, DB, Redis, Qdrant)
    - Initialize rate limiters
    - Warm up caches if needed
    
    Shutdown:
    - Close all connection pools gracefully
    - Flush pending metrics
    """
    # Startup
    logger.info("Initializing connection pools...")
    app.state.pools = await ConnectionPools.create(settings)
    logger.info("Connection pools ready")
    
    yield
    
    # Shutdown
    logger.info("Closing connection pools...")
    await app.state.pools.close()
    logger.info("Shutdown complete")
`;
}
```

### Success Criteria
- [ ] Lifespan context manager generated
- [ ] Pools stored in app.state
- [ ] Proper logging for startup/shutdown
- [ ] Pools passed to ExecutionContext

---

## Task 1.6: ExpressionCompiler

**Duration:** 1 day  
**Confidence Target:** 7/10  
**Dependencies:** Task 1.1

### Objective
Compile `{{ expressions }}` to Python code at generation time, not runtime.

### Key Design Decisions
- NO `eval()` or `exec()` in generated code
- Compile to f-strings or direct attribute access
- Support: input, nodes, env, secrets, global
- Support filters: length, first, default, json, upper, lower

### File: `src/core/codegen/python/ExpressionCompiler.ts`

```typescript
/**
 * @file ExpressionCompiler.ts
 * @description Compile {{ expressions }} to Python at generation time
 * 
 * SECURITY: Never generates eval() or exec() - all expressions 
 * are compiled to safe Python code at build time.
 */

export class ExpressionCompiler {
  /**
   * Compile a template expression to Python code.
   * 
   * Examples:
   *   {{ input.query }}           -> ctx.input["query"]
   *   {{ nodes.search.output }}   -> ctx.get_output("search")
   *   {{ env.API_KEY }}           -> ctx.secrets["API_KEY"]
   *   {{ input.items | length }}  -> len(ctx.input["items"])
   *   {{ input.name | default:"Guest" }} -> ctx.input.get("name", "Guest")
   *   {{ uuid() }}                -> str(uuid.uuid4())
   */
  compile(expression: string): string {
    // Remove {{ }} wrapper
    let expr = expression.trim();
    if (expr.startsWith('{{') && expr.endsWith('}}')) {
      expr = expr.slice(2, -2).trim();
    }
    
    // Check for filters (pipe syntax)
    const filterMatch = expr.match(/^(.+?)\s*\|\s*(\w+)(?::(.+))?$/);
    if (filterMatch) {
      const [, base, filter, arg] = filterMatch;
      return this.applyFilter(this.compileBase(base.trim()), filter, arg);
    }
    
    // Check for function calls
    if (expr.includes('(')) {
      return this.compileFunction(expr);
    }
    
    return this.compileBase(expr);
  }
  
  private compileBase(expr: string): string {
    // input.field -> ctx.input["field"]
    if (expr.startsWith('input.')) {
      const path = expr.slice(6);
      return this.compilePathAccess('ctx.input', path);
    }
    
    // nodes.nodeId.output -> ctx.get_output("nodeId")
    if (expr.startsWith('nodes.')) {
      const parts = expr.slice(6).split('.');
      const nodeId = parts[0];
      if (parts[1] === 'output') {
        return `ctx.get_output("${nodeId}")`;
      }
      // nodes.nodeId.output.field
      if (parts.length > 2) {
        const fieldPath = parts.slice(2).join('.');
        return this.compilePathAccess(`ctx.get_output("${nodeId}")`, fieldPath);
      }
      return `ctx.get_output("${nodeId}")`;
    }
    
    // env.VAR or secrets.VAR -> ctx.secrets["VAR"]
    if (expr.startsWith('env.') || expr.startsWith('secrets.')) {
      const varName = expr.split('.')[1];
      return `ctx.secrets["${varName}"]`;
    }
    
    // global.var -> ctx.global_vars["var"]
    if (expr.startsWith('global.')) {
      const varName = expr.slice(7);
      return `ctx.global_vars["${varName}"]`;
    }
    
    // execution.id, execution.timestamp
    if (expr.startsWith('execution.')) {
      const field = expr.slice(10);
      if (field === 'id') return 'ctx.execution_id';
      if (field === 'timestamp') return 'ctx._start_time';
      return `ctx.${field}`;
    }
    
    // Literal string or number
    if (/^["']/.test(expr) || /^\d+$/.test(expr)) {
      return expr;
    }
    
    // Default: treat as literal
    return `"${expr}"`;
  }
  
  private compilePathAccess(base: string, path: string): string {
    const parts = path.split('.');
    let result = base;
    for (const part of parts) {
      // Handle array index: items[0]
      const indexMatch = part.match(/^(\w+)\[(\d+)\]$/);
      if (indexMatch) {
        result = `${result}["${indexMatch[1]}"][${indexMatch[2]}]`;
      } else {
        result = `${result}["${part}"]`;
      }
    }
    return result;
  }
  
  private applyFilter(base: string, filter: string, arg?: string): string {
    switch (filter) {
      case 'length':
        return `len(${base})`;
      case 'first':
        return `${base}[0]`;
      case 'last':
        return `${base}[-1]`;
      case 'default':
        return `(${base} if ${base} is not None else ${arg || '""'})`;
      case 'json':
        return `orjson.dumps(${base}).decode()`;
      case 'upper':
        return `${base}.upper()`;
      case 'lower':
        return `${base}.lower()`;
      case 'strip':
        return `${base}.strip()`;
      case 'int':
        return `int(${base})`;
      case 'float':
        return `float(${base})`;
      case 'str':
        return `str(${base})`;
      case 'bool':
        return `bool(${base})`;
      default:
        throw new Error(`Unknown filter: ${filter}`);
    }
  }
  
  private compileFunction(expr: string): string {
    // uuid() -> str(uuid.uuid4())
    if (expr === 'uuid()') {
      return 'str(uuid.uuid4())';
    }
    
    // now() -> datetime.now(timezone.utc)
    if (expr === 'now()') {
      return 'datetime.now(timezone.utc)';
    }
    
    // timestamp() -> int(time.time())
    if (expr === 'timestamp()') {
      return 'int(time.time())';
    }
    
    throw new Error(`Unknown function: ${expr}`);
  }
  
  /**
   * Check if a string contains expressions
   */
  hasExpressions(text: string): boolean {
    return /\{\{.+?\}\}/.test(text);
  }
  
  /**
   * Compile a string that may contain multiple expressions
   */
  compileTemplate(template: string): string {
    if (!this.hasExpressions(template)) {
      return `"${template}"`;
    }
    
    // Replace all {{ }} with f-string interpolation
    const compiled = template.replace(
      /\{\{(.+?)\}\}/g,
      (_, expr) => `{${this.compile(expr.trim())}}`
    );
    
    return `f"${compiled}"`;
  }
}
```

### Success Criteria
- [ ] No eval() or exec() in generated code
- [ ] Supports input, nodes, env, secrets, global
- [ ] Supports filters: length, first, default, json
- [ ] Supports functions: uuid(), now(), timestamp()
- [ ] compileTemplate handles mixed text/expressions

---

## Task 1.7: Execution Timing

**Duration:** 0.25 day  
**Confidence Target:** 9/10  
**Dependencies:** Task 1.3

### Objective
Track per-node execution time with nanosecond precision.

### Integration with ExecutionContext

```python
# In node execution wrapper
async def execute_node(ctx: ExecutionContext, node_id: str, func):
    start = time.monotonic_ns()
    try:
        result = await func(ctx)
        ctx.set_output(node_id, result)
        return result
    finally:
        elapsed_ms = (time.monotonic_ns() - start) / 1_000_000
        ctx.set_timing(node_id, elapsed_ms)
```

### Success Criteria
- [ ] Per-node timing captured
- [ ] Nanosecond precision
- [ ] Included in response metadata
- [ ] Accessible via ctx.get_metadata()

---

## Phase 1 Deliverables Summary

| Task | Deliverable | Duration | Confidence |
|------|-------------|----------|------------|
| 1.1 | Python Code Generator | 2d | 7/10 |
| 1.2 | Performance Stack | 0.5d | 9/10 |
| 1.3 | ExecutionContext | 0.5d | 8/10 |
| 1.4 | ConnectionPools | 1d | 8/10 |
| 1.5 | FastAPI Lifespan | 0.25d | 9/10 |
| 1.6 | ExpressionCompiler | 1d | 7/10 |
| 1.7 | Execution Timing | 0.25d | 9/10 |

**Total Phase 1 Duration:** ~5.5 days

---

## Human Review Checkpoints

**After Task 1.1:**
- Generated Python is valid syntax
- Project structure is correct

**After Task 1.6:**
- Expressions compile correctly
- No security vulnerabilities

**End of Phase 1:**
- Complete generated project runs
- Performance stack working

---

## Performance Validation Checklist

Before completing Phase 1, verify:

- [ ] Generated code imports uvloop and calls `uvloop.install()`
- [ ] FastAPI uses `ORJSONResponse` as default
- [ ] All JSON operations use `orjson`, not `json`
- [ ] Connection pools created at startup, closed at shutdown
- [ ] No `eval()` or `exec()` in generated code
- [ ] Expressions compiled to f-strings/direct access
- [ ] ExecutionContext uses `__slots__`
- [ ] Execution timing available in response metadata

---

**Previous Phase:** [CATALYST_PHASE_0_TASKS.md](./CATALYST_PHASE_0_TASKS.md)  
**Next Phase:** [CATALYST_PHASE_2_TASKS.md](./CATALYST_PHASE_2_TASKS.md)
