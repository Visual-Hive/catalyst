# Catalyst Implementation Plan for Cline
## Overview and Phase Index

**Document Version:** 2.0  
**Created:** December 2025  
**Updated:** December 2025 (Split into phase documents)  
**Purpose:** Provide Cline with implementation guidance and phase navigation

---

## Overview

This document serves as the main entry point for Catalyst implementation. Detailed task specifications have been split into separate phase documents for easier navigation and reduced token usage.

**Catalyst** is a visual workflow builder that generates production-ready Python/FastAPI code. Each phase builds on the previous one to create a complete workflow automation system.

---

## Document Structure

| Document | Purpose | When to Read |
|----------|---------|--------------|
| [CATALYST_SPECIFICATION.md](./CATALYST_SPECIFICATION.md) | Full technical specification | Before starting any phase |
| [CATALYST_PERFORMANCE_REQUIREMENTS.md](./CATALYST_PERFORMANCE_REQUIREMENTS.md) | Performance optimizations | During Phases 1-4 |
| **Phase Task Documents:** | | |
| [CATALYST_PHASE_0_TASKS.md](./CATALYST_PHASE_0_TASKS.md) | Foundation & setup | Week 1 |
| [CATALYST_PHASE_1_TASKS.md](./CATALYST_PHASE_1_TASKS.md) | Core runtime & codegen | Weeks 2-3 |
| [CATALYST_PHASE_2_TASKS.md](./CATALYST_PHASE_2_TASKS.md) | LLM integration | Weeks 4-5 |
| [CATALYST_PHASE_3_TASKS.md](./CATALYST_PHASE_3_TASKS.md) | Data integration | Weeks 6-7 |
| [CATALYST_PHASE_4_TASKS.md](./CATALYST_PHASE_4_TASKS.md) | Control flow | Weeks 8-9 |

---

## Development Methodology

1. **Read** the specification document for full context
2. **Complete** tasks in order within each phase
3. **Achieve** confidence ≥8/10 before moving on
4. **Request** human review at checkpoints
5. **Write** tests alongside implementation
6. **Update** task progress in phase documents

---

## Phase Overview

### Phase 0: Foundation (~1 week)
**Goal:** Transform Rise codebase into Catalyst

| Task | Description | Duration |
|------|-------------|----------|
| 0.1 | Fork and Rebrand | 0.5d |
| 0.2 | Manifest Schema Design | 1d |
| 0.3 | Node Type System | 1d |
| 0.4 | Workflow Store | 0.5d |
| 0.5 | Canvas Adaptation | 0.5d |

**Deliverables:**
- Catalyst branding complete
- Workflow manifest types
- Node registry (55+ types)
- Workflow canvas renders

---

### Phase 1: Core Runtime (~2 weeks)
**Goal:** Python code generation with performance optimizations

| Task | Description | Duration |
|------|-------------|----------|
| 1.1 | Python Code Generator | 2d |
| 1.2 | Performance Stack Generator | 0.5d |
| 1.3 | ExecutionContext Implementation | 0.5d |
| 1.4 | ConnectionPools Implementation | 1d |
| 1.5 | FastAPI Lifespan Integration | 0.25d |
| 1.6 | ExpressionCompiler | 1d |
| 1.7 | Execution Timing | 0.25d |

**Key Performance Features:**
- uvloop for 2-4x faster event loop
- orjson for 10x faster JSON
- Connection pooling at startup
- Expression compilation (no eval())

---

### Phase 2: LLM Integration (~2 weeks)
**Goal:** LLM providers with streaming support

| Task | Description | Duration |
|------|-------------|----------|
| 2.1 | Streaming Infrastructure | 0.5d |
| 2.2 | Anthropic Claude Node | 1.5d |
| 2.3 | OpenAI Node | 1d |
| 2.4 | Groq Node | 0.5d |
| 2.5 | Embedding Generation | 1d |
| 2.6 | Prompt Template | 0.5d |
| 2.7 | LLM Router | 0.5d |

**Key Features:**
- Token-by-token streaming
- Dedicated LLM connection pool
- SSE with proper headers
- First token latency <300ms

---

### Phase 3: Data Integration (~2 weeks)
**Goal:** Data sources with caching

| Task | Description | Duration |
|------|-------------|----------|
| 3.1 | Qdrant Search Node | 1d |
| 3.2 | Qdrant Upsert Node | 0.5d |
| 3.3 | PostgreSQL Query Node | 1d |
| 3.4 | Redis Operations Node | 0.5d |
| 3.5 | Cache Utilities | 0.5d |
| 3.6 | Directus SDK Node | 1d |
| 3.7 | GraphQL Query Node | 0.5d |

**Key Features:**
- @cached decorator for async functions
- Memory and Redis cache backends
- Connection pooling for all databases
- Embedding cache with deduplication

---

### Phase 4: Control Flow (~2 weeks)
**Goal:** Control flow with rate limiting

| Task | Description | Duration |
|------|-------------|----------|
| 4.1 | Parallel Execution | 1.5d |
| 4.2 | Parallel Result Streaming | 0.5d |
| 4.3 | Loop Node | 1d |
| 4.4 | Condition Node | 0.5d |
| 4.5 | Switch Node | 0.5d |
| 4.6 | RateLimiter Implementation | 0.5d |
| 4.7 | rateLimit Node | 0.25d |
| 4.8 | Custom Code Node | 1d |

**Key Features:**
- Context cloning for parallel branches
- asyncio.as_completed() for streaming
- Per-key rate limiting
- No eval() in generated code

---

### Phases 5-6: Advanced & Production
**Goal:** Production readiness (To be detailed)

- Agentic tool calling
- Gmail OAuth integration
- Full Directus SDK
- Error handling & observability
- Visual Hive migration
- Load testing
- Documentation

---

## Human Review Checkpoints

| Phase | Checkpoint | Review Focus |
|-------|------------|--------------|
| 0 | After Task 0.2 | Schema design completeness |
| 0 | After Task 0.5 | Editor renders workflow nodes |
| 1 | After Task 1.1 | Generated Python is valid |
| 1 | After Task 1.6 | Expressions compile safely |
| 2 | After Task 2.2 | Streaming works correctly |
| 3 | After Task 3.5 | Caching reduces latency |
| 4 | After Task 4.1 | Parallel execution safe |
| 6 | Before deploy | Visual Hive workflows run |

---

## Quality Standards

### Code Quality
- TypeScript strict mode
- ESLint/Prettier formatting
- 1 comment per 3-5 lines
- File headers with @architecture tags

### Testing
- Unit tests for all generators
- Integration tests for code generation
- Manual testing for runtime
- Performance benchmarks

### Documentation
- Update README for Catalyst
- Document all node types
- Create getting started guide
- Document expression syntax

---

## Performance Targets

| Scenario | Target |
|----------|--------|
| Simple transform | <10ms |
| Sequential HTTP chain | <50ms overhead |
| 4x Parallel DB queries | 200ms (parallel) |
| LLM streaming first token | <300ms |
| 1000 concurrent requests | Stable, <5% error |

---

## Master Performance Validation Checklist

Before deployment, verify all performance requirements:

### Phase 1 Checks
- [ ] Generated code imports uvloop and calls `uvloop.install()`
- [ ] FastAPI uses `ORJSONResponse` as default
- [ ] All JSON operations use `orjson`, not `json`
- [ ] Connection pools created at startup, closed at shutdown
- [ ] No `eval()` or `exec()` in generated code
- [ ] Expressions compiled to f-strings/direct access
- [ ] ExecutionContext uses `__slots__`
- [ ] Execution timing available in response metadata

### Phase 2 Checks
- [ ] Streaming endpoints have `X-Accel-Buffering: no` header
- [ ] LLM calls use dedicated connection pool
- [ ] First token latency <300ms for streaming
- [ ] format_sse() uses orjson

### Phase 3 Checks
- [ ] All data nodes use connection pools from context
- [ ] PostgreSQL queries use parameterized queries
- [ ] Cache utilities support both memory and Redis backends
- [ ] Embedding cache uses content hash for deduplication

### Phase 4 Checks
- [ ] Parallel nodes clone context, don't share
- [ ] Parallel result streaming uses asyncio.as_completed()
- [ ] Rate limiter is async-safe with locks
- [ ] Custom code has no eval() at runtime

---

## Quick Start

1. **First time setup:**
   - Read `CATALYST_SPECIFICATION.md` for full context
   - Read `CATALYST_PERFORMANCE_REQUIREMENTS.md` for performance stack
   
2. **Starting a phase:**
   - Open the relevant `CATALYST_PHASE_X_TASKS.md`
   - Read phase overview
   - Start with first task

3. **Working on a task:**
   - Read task objective and activities
   - Implement following code examples
   - Check success criteria
   - Update task progress

4. **Completing a phase:**
   - Verify all success criteria met
   - Run performance validation checklist
   - Request human review at checkpoints
   - Proceed to next phase

---

**End of Implementation Overview**

*For detailed task specifications, see individual phase documents.*
