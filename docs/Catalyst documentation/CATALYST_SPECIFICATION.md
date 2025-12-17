# Catalyst: Server-Side Workflow Builder
## Visual Programming That Generates Real Python Code

**Project Name:** Catalyst  
**Forked From:** Rise (Visual React Builder)  
**Target Runtime:** Python 3.11+ / FastAPI / LangGraph  
**Author:** Richard / Technical Architecture  
**Version:** 0.1.0 (Specification Draft)  
**Date:** December 2025  

---

## Executive Summary

Catalyst is a visual workflow builder that generates production-ready Python code for server-side automation, API orchestration, and AI agent systems. Unlike n8n, Windmill, or Temporal, Catalyst produces clean, portable Python that you own completely—no proprietary runtime, no vendor lock-in.

**The Core Problem:**
n8n and similar tools create workflows that compile to proprietary runtimes. You can't optimize the generated code, can't truly parallelize execution, and can't stream results efficiently. When you need sub-second latency and 1000+ concurrent users, these tools hit architectural ceilings.

**The Catalyst Solution:**
Visual workflow design → Clean Python code generation → Deploy anywhere

**Key Differentiators:**
- **Zero Vendor Lock-in**: Generated code is standard Python/FastAPI
- **True Parallelism**: Native async/await with real concurrent execution
- **Streaming-First**: Built for real-time AI responses and progressive results
- **LLM-Native**: First-class support for Claude, GPT, Groq with tool calling
- **Visual + Code**: Edit visually or dive into generated code—your choice

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Manifest Schema](#2-manifest-schema)
3. [Node Type Library](#3-node-type-library)
4. [Code Generation](#4-code-generation)
5. [Implementation Phases](#5-implementation-phases)
6. [Task Breakdown](#6-task-breakdown)
7. [Visual Hive Migration](#7-visual-hive-migration)
8. [Technical Decisions](#8-technical-decisions)

---

## 1. Architecture Overview

### 1.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     CATALYST EDITOR                              │
│                    (Electron Desktop App)                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │  Workflow       │  │  Node           │  │  Properties     │ │
│  │  Navigator      │  │  Canvas         │  │  Panel          │ │
│  │                 │  │  (React Flow)   │  │                 │ │
│  │  - Workflows    │  │                 │  │  - Node Config  │ │
│  │  - Variables    │  │  - Drag/Drop    │  │  - Connections  │ │
│  │  - Secrets      │  │  - Connections  │  │  - Testing      │ │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘ │
│                                                                  │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                    Test Runner Panel                       │  │
│  │  - Request Builder | Execution Trace | Response Viewer    │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                  │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             │ Manifest JSON
                             │
┌────────────────────────────▼────────────────────────────────────┐
│                    CODE GENERATION ENGINE                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  manifest.json ──► WorkflowCodeGenerator ──► Python Project     │
│                                                                  │
│  Generated Output:                                               │
│  ├── main.py              (FastAPI application)                 │
│  ├── workflows/                                                  │
│  │   ├── __init__.py                                            │
│  │   ├── conference_search.py                                   │
│  │   └── user_matching.py                                       │
│  ├── nodes/               (Reusable node implementations)       │
│  ├── utils/               (Helpers, auth, caching)              │
│  ├── config.py            (Environment & secrets)               │
│  ├── requirements.txt                                           │
│  └── Dockerfile                                                 │
│                                                                  │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             │ Hot Reload
                             │
┌────────────────────────────▼────────────────────────────────────┐
│                    LOCAL TEST RUNTIME                            │
│                    (Python subprocess)                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  FastAPI Dev Server ◄──── Vite-like hot reload on manifest     │
│       │                   changes                                │
│       │                                                          │
│       ├── /api/v1/search      (workflow endpoints)              │
│       ├── /ws/stream          (WebSocket streaming)             │
│       └── /_catalyst/health   (runtime status)                  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 1.2 What We Inherit from Rise

| Rise Component | Catalyst Usage | Changes Needed |
|---------------|----------------|----------------|
| Electron shell | ✅ Keep as-is | Minor branding |
| React Flow canvas | ✅ Keep as-is | New node types |
| Manifest system | ✅ Extend | New workflow schema |
| Zustand stores | ✅ Adapt | workflowStore vs manifestStore |
| Properties panel | ✅ Adapt | New node config editors |
| File management | ✅ Adapt | Python output instead of React |
| IPC handlers | ✅ Extend | Python subprocess management |
| Code generation architecture | ✅ Adapt | PythonWorkflowGenerator |

### 1.3 What We Build New

| Component | Description | Priority |
|-----------|-------------|----------|
| Workflow manifest schema | JSON structure for workflows | P0 |
| PythonWorkflowGenerator | Main code generator | P0 |
| Node type library | 50+ node implementations | P0 |
| Python runtime manager | Subprocess + hot reload | P0 |
| Test runner UI | Request builder + trace viewer | P1 |
| Streaming support | SSE + WebSocket generation | P1 |
| Secret management | Encrypted .env handling | P1 |
| Directus SDK integration | Visual table/field selection | P2 |
| Deployment helpers | Docker, Railway, Fly.io | P2 |

---

## 2. Manifest Schema

### 2.1 Top-Level Structure

```json
{
  "schemaVersion": "1.0.0",
  "projectType": "workflow",
  "metadata": {
    "projectName": "Visual Hive Backend",
    "description": "Conference discovery API",
    "author": "Richard",
    "createdAt": "2025-12-17T10:00:00Z",
    "updatedAt": "2025-12-17T10:00:00Z"
  },
  "config": {
    "runtime": "python",
    "pythonVersion": "3.11",
    "framework": "fastapi",
    "port": 8000,
    "cors": {
      "origins": ["*"],
      "methods": ["GET", "POST", "PUT", "DELETE"]
    }
  },
  "secrets": {
    "ANTHROPIC_API_KEY": { "required": true, "description": "Claude API key" },
    "QDRANT_URL": { "required": true },
    "QDRANT_API_KEY": { "required": false },
    "DATABASE_URL": { "required": true }
  },
  "globalVariables": {
    "DEFAULT_MODEL": "claude-sonnet-4-5-20250514",
    "MAX_RESULTS": 20,
    "CACHE_TTL": 3600
  },
  "workflows": {
    "conference_search": { /* ... */ },
    "user_matching": { /* ... */ }
  },
  "sharedNodes": {
    "auth_middleware": { /* reusable node definitions */ }
  }
}
```

### 2.2 Workflow Definition

```json
{
  "workflows": {
    "conference_search": {
      "id": "wf_conference_search",
      "name": "Conference Search",
      "description": "AI-powered attendee and exhibitor discovery",
      "trigger": {
        "type": "httpEndpoint",
        "config": {
          "method": "POST",
          "path": "/api/v1/search",
          "authentication": "bearer",
          "rateLimit": {
            "requests": 100,
            "window": "1m"
          }
        }
      },
      "input": {
        "query": { "type": "string", "required": true },
        "userContext": { "type": "object", "required": true },
        "filters": { "type": "object", "required": false }
      },
      "output": {
        "type": "stream",
        "format": "sse",
        "events": ["thought", "result", "evaluation", "complete"]
      },
      "nodes": { /* node definitions */ },
      "edges": [ /* connections */ ],
      "executionConfig": {
        "timeout": 30000,
        "retries": 2,
        "retryDelay": 1000
      }
    }
  }
}
```

### 2.3 Node Definition

```json
{
  "nodes": {
    "node_parallel_search": {
      "id": "node_parallel_search",
      "type": "parallel",
      "name": "Parallel Search Strategies",
      "position": { "x": 400, "y": 200 },
      "config": {
        "mode": "all",
        "timeout": 5000
      },
      "children": ["node_semantic", "node_keyword", "node_collaborative"]
    },
    "node_semantic": {
      "id": "node_semantic",
      "type": "qdrantSearch",
      "name": "Semantic Vector Search",
      "position": { "x": 600, "y": 100 },
      "config": {
        "collection": "attendees",
        "queryVector": "{{ embedding(input.query) }}",
        "limit": 20,
        "scoreThreshold": 0.7,
        "filter": "{{ input.filters }}"
      }
    },
    "node_claude_enrich": {
      "id": "node_claude_enrich",
      "type": "anthropicCompletion",
      "name": "Enrich Results with Claude",
      "position": { "x": 800, "y": 200 },
      "config": {
        "model": "{{ env.DEFAULT_MODEL }}",
        "streaming": true,
        "systemPrompt": "You are a conference matchmaking assistant...",
        "messages": [
          {
            "role": "user",
            "content": "Given these search results: {{ nodes.node_merge.output }}\n\nProvide a relevance assessment for user: {{ input.userContext }}"
          }
        ],
        "maxTokens": 1000,
        "temperature": 0.7
      }
    }
  }
}
```

### 2.4 Edge Definition

```json
{
  "edges": [
    {
      "id": "edge_001",
      "source": "node_trigger",
      "target": "node_parallel_search",
      "sourceHandle": "output",
      "targetHandle": "input"
    },
    {
      "id": "edge_002",
      "source": "node_parallel_search",
      "target": "node_merge",
      "sourceHandle": "results",
      "targetHandle": "input",
      "condition": null
    },
    {
      "id": "edge_003",
      "source": "node_condition",
      "target": "node_refine_search",
      "sourceHandle": "false",
      "targetHandle": "input",
      "condition": "{{ nodes.node_evaluate.output.confidence < 0.7 }}"
    }
  ]
}
```

---

## 3. Node Type Library

### 3.1 Complete Node Inventory

Based on Visual Hive requirements and general workflow needs:

#### TRIGGERS (6 types)

| Node Type | Description | Config Options |
|-----------|-------------|----------------|
| `httpEndpoint` | REST API endpoint | method, path, auth, rateLimit, validation |
| `webhookReceiver` | External webhook handler | secret, validation, transform |
| `scheduledTask` | Cron-based execution | cron, timezone, overlap handling |
| `subworkflowTrigger` | Called by other workflows | input schema, async |
| `websocketEndpoint` | WebSocket connection handler | path, auth, heartbeat |
| `queueConsumer` | Message queue consumer | queue, concurrency, ack mode |

#### LLM / AI (8 types)

| Node Type | Description | Config Options |
|-----------|-------------|----------------|
| `anthropicCompletion` | Claude API calls | model, messages, streaming, tools, cache |
| `openaiCompletion` | OpenAI API calls | model, messages, streaming, functions |
| `groqCompletion` | Groq API calls | model, messages, streaming |
| `azureOpenaiCompletion` | Azure OpenAI | deployment, messages, streaming |
| `embeddingGenerate` | Generate embeddings | provider (azure/openai), model, input |
| `promptTemplate` | Construct prompts | template, variables, format |
| `agenticToolCall` | Tool use with LLMs | tools, model, maxIterations |
| `llmRouter` | Route to best model | models, criteria, fallback |

#### DATA SOURCES (8 types)

| Node Type | Description | Config Options |
|-----------|-------------|----------------|
| `qdrantSearch` | Vector similarity search | collection, vector, filter, limit |
| `qdrantUpsert` | Insert/update vectors | collection, points, wait |
| `qdrantScroll` | Paginated point retrieval | collection, filter, limit, offset |
| `qdrantPayload` | Update point payloads | collection, pointId, payload |
| `postgresQuery` | SQL database queries | query, params, transaction |
| `directusQuery` | Directus SDK operations | table, operation, fields, filter |
| `graphqlQuery` | GraphQL with pagination | endpoint, query, variables, pagination |
| `redisOperation` | Cache operations | operation (get/set/del), key, ttl |

#### HTTP / EXTERNAL (4 types)

| Node Type | Description | Config Options |
|-----------|-------------|----------------|
| `httpRequest` | External API calls | url, method, headers, body, auth, pagination |
| `gmailOperation` | Gmail API | operation, auth (oauth/service), to, subject, body |
| `webhookSend` | Send webhooks | url, method, headers, retry |
| `graphqlMutation` | GraphQL mutations | endpoint, mutation, variables |

#### CONTROL FLOW (8 types)

| Node Type | Description | Config Options |
|-----------|-------------|----------------|
| `condition` | If/else branching | expression, trueTarget, falseTarget |
| `switch` | Multi-way branching | expression, cases, default |
| `loop` | Iterate over items | items, itemVariable, indexVariable, parallel |
| `parallel` | Fan-out execution | mode (all/race/allSettled), timeout |
| `aggregate` | Fan-in / merge results | strategy (merge/concat/first), timeout |
| `retry` | Retry with backoff | maxAttempts, delay, backoff, condition |
| `delay` | Wait/sleep | duration, until |
| `earlyReturn` | Exit workflow early | condition, response |

#### TRANSFORM (8 types)

| Node Type | Description | Config Options |
|-----------|-------------|----------------|
| `editFields` | Set/modify fields | fields (static or expression) |
| `javascriptFunction` | Custom JS code | code, async, timeout |
| `pythonFunction` | Custom Python code | code, imports, async |
| `jsonTransform` | JSONata/JMESPath | expression, language |
| `mapArray` | Transform each item | expression, parallel |
| `filterArray` | Filter items | expression |
| `reduceArray` | Reduce to single value | expression, initial |
| `splitArray` | Split into batches | batchSize, overlap |

#### STREAMING (5 types)

| Node Type | Description | Config Options |
|-----------|-------------|----------------|
| `streamStart` | Begin streaming response | format (sse/websocket/ndjson) |
| `streamChunk` | Send chunk to client | event, data |
| `streamEnd` | End streaming | finalData |
| `streamMerge` | Merge multiple streams | strategy (interleave/buffer) |
| `streamBuffer` | Buffer before sending | size, timeout |

#### UTILITIES (8 types)

| Node Type | Description | Config Options |
|-----------|-------------|----------------|
| `cryptoGenerate` | Generate secure values | type (uuid/password/hash), options |
| `executionData` | Get/set execution context | operation, key, value |
| `globalVariable` | Access global vars | variable, operation (get/set) |
| `errorHandler` | Catch and handle errors | errorTypes, fallback |
| `log` | Structured logging | level, message, data |
| `metrics` | Record metrics | name, value, tags |
| `rateLimit` | Rate limiting check | key, limit, window |
| `validate` | Schema validation | schema, data, strict |

#### SPECIALIZED (Visual Hive specific) (4 types)

| Node Type | Description | Config Options |
|-----------|-------------|----------------|
| `directusSDK` | Full Directus SDK wrapper | collection, operation, fields, filter, sort |
| `conferenceContext` | Build user context | userId, eventId, enrich |
| `resultDedup` | Deduplicate results | key, strategy |
| `confidenceScore` | Calculate match confidence | weights, normalize |

### 3.2 Node Interface Specification

Every node follows this interface:

```typescript
interface NodeDefinition {
  // Identity
  id: string;                    // Unique within workflow
  type: NodeType;                // From node type library
  name: string;                  // Display name
  description?: string;          // Optional description
  
  // Visual
  position: { x: number; y: number };
  collapsed?: boolean;
  
  // Configuration (type-specific)
  config: Record<string, any>;
  
  // Connections
  inputs?: string[];             // Input handle names
  outputs?: string[];            // Output handle names
  
  // Execution
  timeout?: number;              // Node-specific timeout
  retries?: number;              // Node-specific retries
  cache?: {
    enabled: boolean;
    ttl: number;
    key: string;                 // Cache key expression
  };
  
  // Error handling
  onError?: 'throw' | 'continue' | 'fallback';
  fallbackValue?: any;
}
```

### 3.3 Expression Syntax

Catalyst uses a template expression syntax for dynamic values:

```
{{ expression }}
```

**Available Contexts:**

| Context | Description | Example |
|---------|-------------|---------|
| `input` | Workflow input | `{{ input.query }}` |
| `nodes.<id>.output` | Previous node output | `{{ nodes.node_search.output.results }}` |
| `env` | Environment variables | `{{ env.ANTHROPIC_API_KEY }}` |
| `global` | Global variables | `{{ global.DEFAULT_MODEL }}` |
| `secrets` | Secret values | `{{ secrets.API_KEY }}` |
| `execution` | Execution context | `{{ execution.id }}` |
| `item` | Current loop item | `{{ item.name }}` |
| `index` | Current loop index | `{{ index }}` |

**Built-in Functions:**

```javascript
// String
{{ input.query | lowercase }}
{{ input.name | truncate(50) }}
{{ concat(input.first, ' ', input.last) }}

// Array
{{ nodes.search.output | length }}
{{ nodes.search.output | first }}
{{ nodes.search.output | pluck('id') }}

// JSON
{{ input.data | json }}
{{ input.json | parse }}

// Date
{{ now() }}
{{ now() | format('YYYY-MM-DD') }}

// Utility
{{ uuid() }}
{{ hash(input.email, 'sha256') }}
{{ embedding(input.query) }}  // Calls embedding service
```

---

## 4. Code Generation

### 4.1 Generated Project Structure

```
project-name/
├── main.py                      # FastAPI application entry
├── config.py                    # Configuration management
├── requirements.txt             # Python dependencies
├── Dockerfile                   # Container deployment
├── docker-compose.yml           # Local development stack
├── .env.example                 # Environment template
│
├── workflows/
│   ├── __init__.py
│   ├── conference_search.py     # Generated workflow
│   └── user_matching.py         # Generated workflow
│
├── nodes/
│   ├── __init__.py
│   ├── llm/
│   │   ├── anthropic.py         # Claude integration
│   │   ├── openai.py            # OpenAI integration
│   │   └── groq.py              # Groq integration
│   ├── data/
│   │   ├── qdrant.py            # Vector database
│   │   ├── postgres.py          # SQL database
│   │   └── directus.py          # Directus SDK
│   ├── transform/
│   │   └── functions.py         # Transform utilities
│   └── streaming/
│       └── sse.py               # SSE helpers
│
├── utils/
│   ├── __init__.py
│   ├── auth.py                  # Authentication helpers
│   ├── cache.py                 # Redis caching
│   ├── expressions.py           # Expression evaluator
│   └── execution.py             # Execution context
│
└── tests/
    ├── __init__.py
    ├── test_conference_search.py
    └── fixtures/
        └── sample_requests.json
```

### 4.2 Generated Workflow Example

**Input Manifest (simplified):**
```json
{
  "workflows": {
    "conference_search": {
      "trigger": {
        "type": "httpEndpoint",
        "config": { "method": "POST", "path": "/api/v1/search" }
      },
      "nodes": {
        "node_search": {
          "type": "qdrantSearch",
          "config": {
            "collection": "attendees",
            "queryVector": "{{ embedding(input.query) }}",
            "limit": 20
          }
        },
        "node_enrich": {
          "type": "anthropicCompletion",
          "config": {
            "model": "claude-sonnet-4-5-20250514",
            "streaming": true,
            "messages": [{ "role": "user", "content": "Analyze: {{ nodes.node_search.output }}" }]
          }
        }
      },
      "edges": [
        { "source": "trigger", "target": "node_search" },
        { "source": "node_search", "target": "node_enrich" }
      ]
    }
  }
}
```

**Generated Python (`workflows/conference_search.py`):**

```python
"""
@catalyst:workflow
Workflow: conference_search
Generated: 2025-12-17T10:00:00Z
DO NOT EDIT: Changes will be overwritten by Catalyst
"""

from fastapi import APIRouter, Request
from fastapi.responses import StreamingResponse
from typing import AsyncGenerator
import asyncio

from nodes.data.qdrant import qdrant_search
from nodes.llm.anthropic import anthropic_completion_stream
from utils.expressions import evaluate
from utils.execution import ExecutionContext
from utils.cache import cache_result

router = APIRouter()


@router.post("/api/v1/search")
async def conference_search(request: Request):
    """
    @catalyst:endpoint
    Conference Search - AI-powered attendee discovery
    """
    # Parse input
    body = await request.json()
    ctx = ExecutionContext(
        workflow_id="conference_search",
        input=body
    )
    
    async def generate() -> AsyncGenerator[str, None]:
        try:
            # Node: node_search (qdrantSearch)
            search_results = await qdrant_search(
                collection="attendees",
                query_vector=await ctx.embedding(body.get("query")),
                limit=20
            )
            ctx.set_node_output("node_search", search_results)
            
            # Node: node_enrich (anthropicCompletion) - streaming
            prompt = f"Analyze: {search_results}"
            
            async for chunk in anthropic_completion_stream(
                model="claude-sonnet-4-5-20250514",
                messages=[{"role": "user", "content": prompt}]
            ):
                yield f"data: {chunk}\n\n"
            
            yield "data: [DONE]\n\n"
            
        except Exception as e:
            yield f"data: {{'error': '{str(e)}'}}\n\n"
    
    return StreamingResponse(
        generate(),
        media_type="text/event-stream"
    )
```

### 4.3 Code Generator Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                   PythonWorkflowGenerator                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Manifest ──►┬──► WorkflowAnalyzer                              │
│              │    - Validates workflow                           │
│              │    - Computes execution order (topological sort) │
│              │    - Identifies parallelism opportunities        │
│              │                                                   │
│              ├──► ImportBuilder                                  │
│              │    - Collects required imports                    │
│              │    - Deduplicates across nodes                    │
│              │                                                   │
│              ├──► NodeCodeGenerator                              │
│              │    - Generates code for each node type           │
│              │    - Handles expressions and templating          │
│              │    - Manages async/await patterns                │
│              │                                                   │
│              ├──► StreamingGenerator                             │
│              │    - SSE response handling                        │
│              │    - WebSocket support                            │
│              │    - Chunk formatting                             │
│              │                                                   │
│              ├──► RouterGenerator                                │
│              │    - FastAPI router setup                         │
│              │    - Authentication middleware                    │
│              │    - Rate limiting                                │
│              │                                                   │
│              └──► ProjectScaffolder                              │
│                   - main.py generation                           │
│                   - requirements.txt                             │
│                   - Docker files                                 │
│                   - Config management                            │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 5. Implementation Phases

### Phase 0: Foundation (Week 1)
**Goal:** Fork Rise, establish new project structure, design schemas

- [ ] Fork Rise codebase → Catalyst
- [ ] Update branding (name, icons, splash)
- [ ] Design and document manifest schema (Section 2)
- [ ] Create node type interfaces and validation
- [ ] Set up Python project template generator
- [ ] Create basic PythonWorkflowGenerator skeleton

**Deliverables:**
- Catalyst codebase with working Electron shell
- Manifest schema TypeScript types
- Empty workflows render in React Flow canvas

### Phase 1: Core Runtime (Weeks 2-3)
**Goal:** Generate working Python code and run locally

- [ ] Implement PythonWorkflowGenerator core
- [ ] Create FastAPI main.py generator
- [ ] Implement Python subprocess manager
- [ ] Create hot-reload watcher (manifest → regenerate → restart)
- [ ] Build basic test runner UI (request builder)
- [ ] Implement 5 core nodes:
  - `httpEndpoint` trigger
  - `editFields` transform
  - `httpRequest` external calls
  - `condition` branching
  - `log` debugging

**Deliverables:**
- Generate valid Python from simple workflows
- Local test server runs and hot-reloads
- Can test endpoints from UI

### Phase 2: LLM Integration (Weeks 4-5)
**Goal:** Full LLM support with streaming

- [ ] Implement `anthropicCompletion` node (streaming)
- [ ] Implement `groqCompletion` node
- [ ] Implement `openaiCompletion` node
- [ ] Implement `azureOpenaiCompletion` node
- [ ] Implement `embeddingGenerate` node (Azure AI Foundry)
- [ ] Implement `promptTemplate` node
- [ ] Build streaming response infrastructure (SSE)
- [ ] Add prompt caching support for Claude

**Deliverables:**
- LLM calls work with streaming responses
- Embedding generation functional
- Cost tracking for LLM calls

### Phase 3: Data Integration (Weeks 6-7)
**Goal:** Vector DB, SQL, and external data sources

- [ ] Implement `qdrantSearch` node
- [ ] Implement `qdrantUpsert` node
- [ ] Implement `qdrantScroll` node
- [ ] Implement `qdrantPayload` node
- [ ] Implement `postgresQuery` node
- [ ] Implement `redisOperation` node (caching)
- [ ] Implement `directusQuery` node (basic)
- [ ] Implement `graphqlQuery` node with pagination

**Deliverables:**
- Qdrant vector operations working
- Database queries functional
- Caching layer operational

### Phase 4: Control Flow & Transform (Weeks 8-9)
**Goal:** Complex workflow patterns

- [ ] Implement `parallel` node (fan-out)
- [ ] Implement `aggregate` node (fan-in)
- [ ] Implement `loop` node
- [ ] Implement `switch` node
- [ ] Implement `retry` node with backoff
- [ ] Implement `javascriptFunction` node (sandboxed)
- [ ] Implement `pythonFunction` node
- [ ] Implement `filterArray`, `mapArray`, `reduceArray`
- [ ] Implement `splitArray` (batching)

**Deliverables:**
- Parallel execution working
- Loop/iteration functional
- Custom code execution sandboxed

### Phase 5: Advanced Features (Weeks 10-11)
**Goal:** Production-ready capabilities

- [ ] Implement `agenticToolCall` node
- [ ] Implement `gmailOperation` node (OAuth + service account)
- [ ] Implement `webhookSend` node
- [ ] Implement `directusSDK` node (full SDK with UI field picker)
- [ ] Add authentication middleware generation
- [ ] Add rate limiting generation
- [ ] Implement secret management (encrypted .env)
- [ ] Add execution tracing and debugging UI
- [ ] Implement `cryptoGenerate` node

**Deliverables:**
- Agentic tool calling functional
- OAuth integrations working
- Full debugging capabilities

### Phase 6: Polish & Production (Weeks 12-14)
**Goal:** Deploy Visual Hive backend on Catalyst

- [ ] Comprehensive error handling
- [ ] Retry logic and circuit breakers
- [ ] Logging and observability (structured logs)
- [ ] Performance optimization
- [ ] Docker deployment generation
- [ ] Railway/Fly.io deployment helpers
- [ ] Migrate Visual Hive conference_search workflow
- [ ] Migrate Visual Hive user_matching workflow
- [ ] Load testing (1000 concurrent users)
- [ ] Documentation and tutorials

**Deliverables:**
- Visual Hive running on Catalyst-generated code
- Deployment working on Railway/Fly.io
- Performance targets met (sub-second first result)

---

## 6. Task Breakdown

### Phase 0 Tasks

#### Task 0.1: Fork and Rebrand
**Duration:** 0.5 day  
**Confidence:** 9/10

**Activities:**
- [ ] Clone Rise repository
- [ ] Rename to Catalyst throughout codebase
- [ ] Update package.json, electron metadata
- [ ] Create new icons and splash screen
- [ ] Update window titles and about dialog

**Files Modified:**
- `package.json`
- `electron/main.ts`
- `src/renderer/App.tsx`
- `public/` assets

---

#### Task 0.2: Manifest Schema Design
**Duration:** 1 day  
**Confidence:** 8/10

**Activities:**
- [ ] Create `src/core/workflow/types.ts` with all interfaces
- [ ] Define WorkflowManifest, WorkflowDefinition, NodeDefinition
- [ ] Create node type enum with all 55+ types
- [ ] Define expression syntax types
- [ ] Create validation schemas (Zod)

**Files Created:**
- `src/core/workflow/types.ts`
- `src/core/workflow/schema.ts`
- `src/core/workflow/validation.ts`
- `src/core/workflow/expressions.ts`

---

#### Task 0.3: Node Type System
**Duration:** 1 day  
**Confidence:** 8/10

**Activities:**
- [ ] Create node category definitions
- [ ] Define config schemas for each node type
- [ ] Create node metadata (icons, colors, descriptions)
- [ ] Build node registry system
- [ ] Create React Flow node components (visual)

**Files Created:**
- `src/core/workflow/nodes/index.ts`
- `src/core/workflow/nodes/registry.ts`
- `src/core/workflow/nodes/triggers/`
- `src/core/workflow/nodes/llm/`
- `src/core/workflow/nodes/data/`
- `src/core/workflow/nodes/control/`
- `src/core/workflow/nodes/transform/`

---

#### Task 0.4: Workflow Store
**Duration:** 0.5 day  
**Confidence:** 9/10

**Activities:**
- [ ] Create Zustand store for workflow state
- [ ] Implement CRUD for workflows
- [ ] Implement CRUD for nodes within workflows
- [ ] Implement edge management
- [ ] Connect to React Flow state

**Files Created:**
- `src/renderer/store/workflowStore.ts`

---

#### Task 0.5: Canvas Adaptation
**Duration:** 0.5 day  
**Confidence:** 9/10

**Activities:**
- [ ] Update LogicCanvas → WorkflowCanvas
- [ ] Register new node types with React Flow
- [ ] Update node rendering for workflow nodes
- [ ] Update edge styling for workflow connections

**Files Modified:**
- `src/renderer/components/LogicCanvas/` → `WorkflowCanvas/`

---

### Phase 1 Tasks

#### Task 1.1: PythonWorkflowGenerator Core
**Duration:** 2 days  
**Confidence:** 7/10

**Activities:**
- [ ] Create generator architecture (mirrors ReactCodeGenerator)
- [ ] Implement workflow analysis (topological sort)
- [ ] Implement import collection
- [ ] Create code assembly pipeline
- [ ] Add Black formatting integration

**Files Created:**
- `src/core/codegen/python/PythonWorkflowGenerator.ts`
- `src/core/codegen/python/WorkflowAnalyzer.ts`
- `src/core/codegen/python/ImportBuilder.ts`
- `src/core/codegen/python/CodeAssembler.ts`

---

#### Task 1.2: FastAPI Generator
**Duration:** 1 day  
**Confidence:** 8/10

**Activities:**
- [ ] Generate main.py with FastAPI setup
- [ ] Generate router registration
- [ ] Generate config.py for settings
- [ ] Generate requirements.txt
- [ ] Generate Dockerfile

**Files Created:**
- `src/core/codegen/python/FastAPIGenerator.ts`
- `src/core/codegen/python/templates/` (template strings)

---

#### Task 1.3: Python Runtime Manager
**Duration:** 1.5 days  
**Confidence:** 7/10

**Activities:**
- [ ] Create PythonRuntimeManager class
- [ ] Implement subprocess spawning (uvicorn)
- [ ] Implement hot-reload on file changes
- [ ] Create IPC handlers for runtime control
- [ ] Handle Python virtual environment

**Files Created:**
- `electron/python-runtime.ts`
- `electron/python-handlers.ts`

---

#### Task 1.4: Test Runner UI
**Duration:** 1.5 days  
**Confidence:** 8/10

**Activities:**
- [ ] Create TestRunner panel component
- [ ] Build request builder (method, URL, headers, body)
- [ ] Implement response viewer (JSON, streaming)
- [ ] Add execution trace visualization
- [ ] Create saved request library

**Files Created:**
- `src/renderer/components/TestRunner/`
- `src/renderer/store/testRunnerStore.ts`

---

#### Task 1.5: Core Node Implementations
**Duration:** 2 days  
**Confidence:** 8/10

**Activities:**
- [ ] Implement `httpEndpoint` code generation
- [ ] Implement `editFields` code generation
- [ ] Implement `httpRequest` code generation
- [ ] Implement `condition` code generation
- [ ] Implement `log` code generation

**Files Created:**
- `src/core/codegen/python/nodes/httpEndpoint.ts`
- `src/core/codegen/python/nodes/editFields.ts`
- `src/core/codegen/python/nodes/httpRequest.ts`
- `src/core/codegen/python/nodes/condition.ts`
- `src/core/codegen/python/nodes/log.ts`

---

### Phase 2-6 Tasks

*(Detailed task breakdowns follow same pattern - I'll create separate task files for each phase)*

---

## 7. Visual Hive Migration

### 7.1 Current n8n Workflows to Migrate

| Workflow | Complexity | Priority | Notes |
|----------|------------|----------|-------|
| Conference Search | High | P0 | Main user-facing query endpoint |
| User Profile Sync | Medium | P1 | Directus → Qdrant sync |
| Exhibitor Matching | High | P1 | Similar to conference search |
| Session Recommendations | Medium | P2 | Based on user interests |
| Daily Digest Email | Medium | P2 | Scheduled task |
| Webhook Handlers | Low | P2 | External integrations |

### 7.2 Migration Strategy

1. **Phase 1: Shadow Mode**
   - Run Catalyst-generated code alongside n8n
   - Compare responses for accuracy
   - Measure latency differences

2. **Phase 2: Gradual Rollout**
   - 10% traffic to Catalyst
   - Monitor error rates
   - Increase gradually

3. **Phase 3: Full Migration**
   - 100% traffic to Catalyst
   - Keep n8n on standby
   - Decommission after 2 weeks stable

### 7.3 Expected Performance Improvements

| Metric | n8n Current | Catalyst Target | Improvement |
|--------|-------------|-----------------|-------------|
| First result latency | 6-8s | <1s | 6-8x |
| Full response time | 8-10s | 3-4s | 2-3x |
| Concurrent users | 50 | 1000+ | 20x |
| LLM cost per query | $0.03 | $0.01 | 3x (caching) |

---

## 8. Technical Decisions

### 8.1 Why Python + FastAPI

| Alternative | Pros | Cons | Decision |
|------------|------|------|----------|
| **Python + FastAPI** | Best LLM ecosystem, native async, Qdrant SDK excellent | GIL limits CPU parallelism | ✅ **Selected** |
| Bun + TypeScript | Fastest runtime, shared types with editor | Younger AI ecosystem | Consider for v2 |
| Node.js + Express | Mature, widespread | Slower than Bun, callback patterns | ❌ Rejected |
| Go + Gin | Extremely fast | No LangChain equivalent | ❌ Rejected |

### 8.2 Why LangGraph

- Purpose-built for agentic workflows
- Native streaming support
- Excellent state management
- Active development by LangChain team
- Direct integration with LangChain ecosystem

### 8.3 Code Generation vs Runtime Execution

| Approach | Pros | Cons |
|----------|------|------|
| **Code Generation** (Catalyst) | Full optimization control, no runtime overhead, portable | Requires regeneration on changes |
| Runtime Execution (n8n) | Instant updates | Proprietary runtime, limited optimization |

**Decision:** Code generation. The regeneration overhead (< 1 second) is negligible compared to the benefits of optimized, portable code.

### 8.4 Expression Language

Options considered:
- Jinja2 templates
- Custom DSL
- JSONata
- JavaScript subset

**Decision:** Custom template syntax (`{{ expression }}`) that compiles to Python. Reasons:
- Simpler than Jinja2 for our use case
- Type-safe compilation
- Can validate at design time
- Familiar to n8n users

---

## Appendix A: Node Configuration Schemas

### A.1 httpEndpoint

```typescript
interface HttpEndpointConfig {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  path: string;  // e.g., "/api/v1/search"
  authentication?: {
    type: 'none' | 'bearer' | 'apiKey' | 'basic' | 'oauth2';
    // Type-specific config
  };
  rateLimit?: {
    requests: number;
    window: string;  // "1m", "1h", etc.
  };
  validation?: {
    body?: object;   // JSON Schema
    query?: object;
    headers?: object;
  };
  cors?: {
    origins: string[];
    methods: string[];
  };
}
```

### A.2 anthropicCompletion

```typescript
interface AnthropicCompletionConfig {
  model: string;  // or expression
  messages: Array<{
    role: 'user' | 'assistant' | 'system';
    content: string;  // supports expressions
  }>;
  systemPrompt?: string;
  maxTokens?: number;
  temperature?: number;
  streaming?: boolean;
  tools?: Array<{
    name: string;
    description: string;
    inputSchema: object;
  }>;
  cache?: {
    enabled: boolean;
    breakpoints?: string[];  // Cache breakpoint markers
  };
}
```

### A.3 qdrantSearch

```typescript
interface QdrantSearchConfig {
  collection: string;
  queryVector: string;  // expression that resolves to vector
  limit?: number;
  scoreThreshold?: number;
  filter?: object;  // Qdrant filter syntax or expression
  withPayload?: boolean | string[];
  withVectors?: boolean;
}
```

### A.4 parallel

```typescript
interface ParallelConfig {
  mode: 'all' | 'race' | 'allSettled';
  timeout?: number;  // ms
  children: string[];  // Node IDs to execute in parallel
}
```

### A.5 loop

```typescript
interface LoopConfig {
  items: string;  // expression resolving to array
  itemVariable?: string;  // default: "item"
  indexVariable?: string;  // default: "index"
  parallel?: boolean;  // Execute iterations in parallel
  batchSize?: number;  // For parallel mode
}
```

---

## Appendix B: Generated Code Patterns

### B.1 Parallel Execution

```python
# Node: parallel_search (parallel, mode: all)
async def execute_parallel_search(ctx: ExecutionContext):
    results = await asyncio.gather(
        execute_node_semantic(ctx),
        execute_node_keyword(ctx),
        execute_node_collaborative(ctx),
        return_exceptions=True
    )
    
    # Filter out exceptions, log them
    valid_results = []
    for i, result in enumerate(results):
        if isinstance(result, Exception):
            logger.error(f"Parallel task {i} failed: {result}")
        else:
            valid_results.append(result)
    
    return valid_results
```

### B.2 Streaming Response

```python
@router.post("/api/v1/search")
async def search_endpoint(request: Request):
    body = await request.json()
    
    async def generate():
        # ... workflow execution ...
        
        async for chunk in claude_stream(messages):
            yield f"event: chunk\ndata: {json.dumps(chunk)}\n\n"
        
        yield f"event: done\ndata: {json.dumps({'status': 'complete'})}\n\n"
    
    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
        }
    )
```

### B.3 Conditional Branching

```python
# Node: condition_check (condition)
confidence = ctx.get_node_output("node_evaluate")["confidence"]

if confidence >= 0.7:
    # True branch
    result = await execute_node_return_results(ctx)
else:
    # False branch
    result = await execute_node_refine_search(ctx)

ctx.set_node_output("condition_check", result)
```

### B.4 Loop with Batching

```python
# Node: process_items (loop, parallel: true, batchSize: 10)
items = ctx.get_node_output("node_fetch")["items"]
results = []

for batch in chunks(items, 10):
    batch_results = await asyncio.gather(*[
        process_single_item(ctx, item, i)
        for i, item in enumerate(batch)
    ])
    results.extend(batch_results)

ctx.set_node_output("process_items", results)
```

---

## Appendix C: Cline Implementation Prompts

### Prompt for Task 0.2 (Manifest Schema)

```
Implement the Catalyst workflow manifest schema.

## Context
Catalyst is a visual workflow builder that generates Python code. 
This task creates the TypeScript types for the manifest JSON format.

## Requirements

### Create src/core/workflow/types.ts

Define these interfaces:

1. **CatalystManifest** (top-level)
   - schemaVersion: string
   - projectType: "workflow"
   - metadata: ProjectMetadata
   - config: RuntimeConfig
   - secrets: Record<string, SecretDefinition>
   - globalVariables: Record<string, any>
   - workflows: Record<string, WorkflowDefinition>

2. **WorkflowDefinition**
   - id: string
   - name: string
   - description?: string
   - trigger: TriggerDefinition
   - input: Record<string, InputField>
   - output: OutputDefinition
   - nodes: Record<string, NodeDefinition>
   - edges: EdgeDefinition[]
   - executionConfig?: ExecutionConfig

3. **NodeDefinition** (base)
   - id: string
   - type: NodeType
   - name: string
   - position: { x: number, y: number }
   - config: Record<string, any>
   - timeout?: number
   - retries?: number
   - cache?: CacheConfig

4. **NodeType** (enum)
   Include all 55+ node types from the specification.

5. **EdgeDefinition**
   - id: string
   - source: string
   - target: string
   - sourceHandle?: string
   - targetHandle?: string
   - condition?: string

## Validation
- Use Zod for runtime validation
- Create validateManifest() function
- Validate node configs against their type schemas

## Testing
- Create test manifests in tests/fixtures/
- Test validation accepts valid manifests
- Test validation rejects invalid manifests

## Files to Create
- src/core/workflow/types.ts
- src/core/workflow/validation.ts
- tests/core/workflow/validation.test.ts
- tests/fixtures/manifests/valid-workflow.json
```

---

**End of Specification**

*This document should be updated as implementation progresses and requirements evolve.*
