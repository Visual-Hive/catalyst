# Catalyst Project Summary
## Quick Reference for Development

---

## What is Catalyst?

**Catalyst** is a visual workflow builder that generates production-ready Python code. It's forked from Rise (the React visual builder) and repurposed for server-side automation.

**Core Value Proposition:**
> "n8n-like visual workflows, but generating real Python code you own completely"

**Target Use Case:**
Replace Visual Hive's n8n backend with a faster, more scalable solution that supports streaming, true parallelism, and sub-second response times.

---

## Technology Stack

| Layer | Technology | Why |
|-------|------------|-----|
| Editor | Electron + React + TypeScript | Inherited from Rise |
| Canvas | React Flow | Visual node editing |
| State | Zustand | Predictable state management |
| Generated Code | Python 3.11+ | Best LLM ecosystem |
| Web Framework | FastAPI | Native async + streaming |
| Agent Framework | LangGraph | Agentic workflow patterns |
| Vector DB | Qdrant | Fast similarity search |
| Cache | Redis | Response caching |

---

## Timeline Overview

```
Week 1:    Phase 0 - Foundation
           ├── Fork Rise → Catalyst
           ├── Design manifest schema
           ├── Create node type system
           └── Adapt workflow canvas

Week 2-3:  Phase 1 - Core Runtime
           ├── Python code generator
           ├── FastAPI generator
           ├── Local runtime manager
           ├── Test runner UI
           └── 5 core nodes

Week 4-5:  Phase 2 - LLM Integration
           ├── Claude, GPT, Groq nodes
           ├── Embedding generation
           ├── Streaming responses
           └── Prompt caching

Week 6-7:  Phase 3 - Data Integration
           ├── Qdrant operations
           ├── PostgreSQL queries
           ├── Directus SDK
           ├── GraphQL + pagination
           └── Redis caching

Week 8-9:  Phase 4 - Control Flow
           ├── Parallel execution
           ├── Loops and batching
           ├── Switch/branching
           ├── Custom code nodes
           └── Stream merging

Week 10-11: Phase 5 - Advanced Features
           ├── Agentic tool calling
           ├── Gmail OAuth
           ├── Full Directus SDK
           ├── Crypto utilities
           └── Execution context

Week 12-14: Phase 6 - Production
           ├── Error handling
           ├── Observability
           ├── Visual Hive migration
           ├── Load testing
           └── Documentation
```

**Total: 14 weeks to production**

---

## Key Deliverables by Phase

### Phase 0 Deliverables
- [ ] Catalyst branding complete
- [ ] Manifest schema types and validation
- [ ] Node registry with 55+ types
- [ ] Workflow store (Zustand)
- [ ] Canvas renders workflow nodes

### Phase 1 Deliverables
- [ ] Generate valid Python from workflows
- [ ] Local FastAPI server runs
- [ ] Hot reload on manifest changes
- [ ] Test runner sends requests

### Phase 2 Deliverables
- [ ] Claude streaming works
- [ ] All 4 LLM providers functional
- [ ] Embeddings generate correctly
- [ ] SSE streaming to clients

### Phase 3 Deliverables
- [ ] Qdrant search/upsert works
- [ ] Database queries execute
- [ ] Caching reduces latency
- [ ] Directus basic operations

### Phase 4 Deliverables
- [ ] Parallel nodes execute concurrently
- [ ] Loops process items efficiently
- [ ] Custom code runs sandboxed
- [ ] Streams merge correctly

### Phase 5 Deliverables
- [ ] Tool calling with LLMs works
- [ ] Gmail sends emails
- [ ] Directus field picker UI
- [ ] Full utility library

### Phase 6 Deliverables
- [ ] Visual Hive migrated
- [ ] 1000 concurrent users supported
- [ ] <1s first result (p95)
- [ ] Documentation complete

---

## Node Categories (55+ Total)

| Category | Count | Key Nodes |
|----------|-------|-----------|
| Triggers | 6 | httpEndpoint, scheduledTask |
| LLM/AI | 8 | anthropicCompletion, embeddingGenerate |
| Data Sources | 8 | qdrantSearch, directusSDK, postgresQuery |
| HTTP/External | 4 | httpRequest, gmailOperation |
| Control Flow | 8 | parallel, loop, condition, switch |
| Transform | 8 | editFields, javascriptFunction, filterArray |
| Streaming | 5 | streamStart, streamChunk, streamMerge |
| Utilities | 8 | cryptoGenerate, log, executionData |

---

## Performance Targets

| Metric | n8n Current | Catalyst Target | Improvement |
|--------|-------------|-----------------|-------------|
| First result | 6-8s | <1s | 6-8x faster |
| Full response | 8-10s | 3-4s | 2-3x faster |
| Concurrent users | 50 | 1000+ | 20x scale |
| LLM cost/query | $0.03 | $0.01 | 3x cheaper |
| Infrastructure | $634/mo | $380/mo | 40% savings |

---

## File Structure (Generated Python)

```
generated-project/
├── main.py              # FastAPI app
├── config.py            # Settings
├── requirements.txt     # Dependencies
├── Dockerfile           # Container
├── workflows/
│   ├── __init__.py
│   ├── conference_search.py
│   └── user_matching.py
├── nodes/
│   ├── llm/
│   ├── data/
│   └── transform/
└── utils/
    ├── auth.py
    ├── cache.py
    └── streaming.py
```

---

## Document Index

| Document | Purpose |
|----------|---------|
| `CATALYST_SPECIFICATION.md` | Full technical specification |
| `CATALYST_PROJECT_SUMMARY.md` | This document - quick reference |
| `CATALYST_VISUAL_HIVE_MIGRATION.md` | n8n → Catalyst migration guide |
| `CATALYST_PERFORMANCE_REQUIREMENTS.md` | Performance stack and optimization patterns |

### Implementation Task Documents

| Document | Phase | Key Topics |
|----------|-------|------------|
| `CATALYST_CLINE_IMPLEMENTATION.md` | Overview | Index to all phase documents, human review checkpoints |
| `CATALYST_PHASE_0_TASKS.md` | Phase 0 | Fork/rebrand, manifest schema, node types, workflow store |
| `CATALYST_PHASE_1_TASKS.md` | Phase 1 | Python codegen, performance stack, ExecutionContext, ConnectionPools |
| `CATALYST_PHASE_2_TASKS.md` | Phase 2 | LLM nodes, streaming infrastructure, embeddings |
| `CATALYST_PHASE_3_TASKS.md` | Phase 3 | Qdrant, PostgreSQL, Redis, @cached decorator |
| `CATALYST_PHASE_4_TASKS.md` | Phase 4 | Parallel execution, loops, RateLimiter, custom code |

---

## Quick Start for Cline

1. **Read** `CATALYST_SPECIFICATION.md` for full context
2. **Follow** `CATALYST_CLINE_IMPLEMENTATION.md` for task details
3. **Reference** `CATALYST_VISUAL_HIVE_MIGRATION.md` for node requirements
4. **Start** with Phase 0, Task 0.1 (Fork and Rebrand)

---

## Key Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Language | Python | Best LLM ecosystem |
| Framework | FastAPI | Native async + streaming |
| Agent lib | LangGraph | Built for agentic patterns |
| Expression syntax | `{{ expr }}` | Familiar, compiles to Python |
| Streaming format | SSE | Best browser support |
| Code generation | Templates | Faster than AST manipulation |

---

## Success Criteria

**MVP Success:**
- [ ] Conference Search workflow runs on Catalyst
- [ ] <1s first result latency
- [ ] Streaming works in browser
- [ ] No data loss vs n8n

**Full Success:**
- [ ] All Visual Hive workflows migrated
- [ ] 1000 concurrent users tested
- [ ] Zero downtime deployment
- [ ] 40%+ cost reduction achieved

---

**End of Summary**
