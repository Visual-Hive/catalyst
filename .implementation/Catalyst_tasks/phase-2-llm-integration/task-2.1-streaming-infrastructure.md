# Task 2.1: Streaming Infrastructure

**Phase:** Phase 2 - LLM Integration  
**Duration Estimate:** 0.5 day  
**Actual Duration:** [To be filled when complete]  
**Status:** 🔵 Not Started  
**Assigned:** AI + Human Review  
**Started:** [YYYY-MM-DD]  
**Completed:** [YYYY-MM-DD]  

---

## Task Overview

### Objective
Build first-class streaming support for LLM responses using Server-Sent Events (SSE) with proper headers and async generator patterns.

This task establishes the foundation for all LLM streaming in Catalyst. We need fast, efficient token streaming that works with nginx reverse proxies and never buffers responses in memory. The streaming infrastructure will be used by all LLM provider nodes (Anthropic, OpenAI, Groq) to deliver real-time AI responses.

### Success Criteria
- [ ] `format_sse()` function uses orjson for fast serialization
- [ ] `StreamingResponse` has proper headers (Cache-Control, X-Accel-Buffering)
- [ ] `stream_tokens()` yields tokens as they arrive
- [ ] `stream_partial_results()` handles parallel operations
- [ ] No response buffering - true streaming
- [ ] Test coverage >90%
- [ ] Human review completed

### References
- CATALYST_PHASE_2_TASKS.md - Task 2.1: Streaming Infrastructure
- CATALYST_SPECIFICATION.md - Section 5: Python Code Generation
- https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events

### Dependencies
- Phase 0 complete (workflow system foundation)
- Phase 1 complete (Python code generation)

---

## Milestones

### Milestone 1: Design Streaming Architecture
**Date:** [YYYY-MM-DD]  
**Confidence:** [X/10]  
**Status:** 🔵 Not Started  
**Time Spent:** [X hours]  

#### Activities
- [ ] Research SSE format standards
- [ ] Design async generator patterns
- [ ] Plan header configuration
- [ ] Document streaming flow

#### Design Decisions

| Decision | Options Considered | Choice Made | Rationale | Confidence |
|----------|-------------------|-------------|-----------|------------|
| Streaming format | WebSockets, SSE, HTTP chunked | Server-Sent Events (SSE) | Browser-native, works with nginx, simpler than WS | 9/10 |
| JSON serialization | json, orjson, ujson | orjson | 2-3x faster, important for high-frequency token streaming | 9/10 |
| Event types | Single "data" event, Multiple event types | Multiple (token, partial, done, error) | Clearer semantics, easier client handling | 8/10 |
| Generator pattern | Callbacks, Async generators | Async generators | Pythonic, memory-efficient, backpressure handling | 9/10 |

#### Notes
- **Why SSE over WebSockets?** SSE is unidirectional (server→client), which is perfect for LLM streaming. Simpler protocol, automatic reconnection, works through proxies.
- **Nginx compatibility:** Must set `X-Accel-Buffering: no` header to prevent nginx from buffering the response.
- **Memory efficiency:** Async generators allow yielding tokens one at a time without buffering the entire response.

---

### Milestone 2: Implement Core Streaming Utilities
**Date:** [YYYY-MM-DD]  
**Confidence:** [X/10]  
**Status:** 🔵 Not Started  
**Time Spent:** [X hours]  

#### Files Created/Modified
- `src/core/codegen/python/templates/streaming.py.ts` - Streaming utility templates
- `tests/unit/codegen/python/streaming.test.ts` - Test suite

#### Implementation Notes

**Core Functions to Implement:**

1. **format_sse(event: str, data: Any) -> bytes**
   - Formats SSE according to spec: `event: {type}\ndata: {json}\n\n`
   - Uses orjson for serialization
   - Returns encoded bytes ready to yield

2. **streaming_response(generator, media_type) -> StreamingResponse**
   - Wraps FastAPI StreamingResponse
   - Sets headers: Cache-Control, X-Accel-Buffering, Connection
   - Returns response object

3. **stream_tokens(token_generator, include_done) -> AsyncGenerator[bytes]**
   - Consumes async generator of tokens
   - Yields formatted SSE events
   - Optionally emits "done" event with full text

4. **stream_partial_results(result_generators, merge_results) -> AsyncGenerator[bytes]**
   - Uses asyncio.as_completed()
   - Streams results as they finish (not all at once)
   - Useful for parallel LLM calls

---

### Milestone 3: Testing & Validation
**Date:** [YYYY-MM-DD]  
**Confidence:** [X/10]  
**Status:** 🔵 Not Started  
**Time Spent:** [X hours]  

#### Test Results

**Unit Tests:**
```
[To be filled during implementation]
```

**Integration Tests:**
- [ ] Generate code with streaming endpoint
- [ ] Start FastAPI server
- [ ] Make request, verify SSE format
- [ ] Measure first token latency (<50ms from generator)

**Manual Testing:**

| Test Scenario | Expected | Actual | Pass/Fail | Notes |
|---------------|----------|--------|-----------|-------|
| Token streaming | Tokens arrive one by one | [To test] | - | - |
| SSE format | Valid SSE with event types | [To test] | - | - |
| Nginx compatibility | X-Accel-Buffering: no set | [To test] | - | - |
| Memory usage | No buffering, constant memory | [To test] | - | - |

---

### Milestone 4: Human Review
**Date:** [YYYY-MM-DD]  
**Confidence:** [X/10]  
**Status:** 🔵 Not Started  
**Time Spent:** [X hours]  

#### Human Review

**Reviewer:** [Name]  
**Date:** [YYYY-MM-DD]  
**Duration:** [X minutes]  

**Feedback Received:**

**Positive:**
- ✅ [To be filled]

**Concerns:**
- ⚠️ [To be filled]

**Sign-off:**
- [ ] Streaming utilities approved
- [ ] SSE format validated
- [ ] Ready for Task 2.2 (Claude integration)

**Final Confidence:** [X/10]

---

## Final Summary

### Deliverables
- [ ] `src/core/codegen/python/templates/streaming.py.ts` - Streaming utilities template
- [ ] `format_sse()` function with orjson
- [ ] `streaming_response()` with proper headers
- [ ] `stream_tokens()` for LLM responses
- [ ] `stream_partial_results()` for parallel ops
- [ ] Test coverage >90%
- [ ] Human review completed

### What Was Accomplished
[To be filled upon completion]

### Lessons Learned

**What Worked Well:**
- [To be filled]

**What Could Be Improved:**
- [To be filled]

**Reusable Patterns:**
- [To be filled]

### Technical Debt Created
- None expected

### Next Steps
- [ ] Proceed to Task 2.2: Anthropic Claude integration
- [ ] Use streaming utilities in all LLM nodes

---

## Appendix

### Key Files
- `src/core/codegen/python/templates/streaming.py.ts` - Main streaming utilities

### SSE Format Reference
```
event: token
data: {"text": "Hello"}

event: token
data: {"text": " world"}

event: done
data: {"text": "Hello world", "token_count": 2}

```

### Required Headers
- `Content-Type: text/event-stream`
- `Cache-Control: no-cache`
- `X-Accel-Buffering: no` (for nginx)
- `Connection: keep-alive`

### Related Tasks
- Task 2.2: Anthropic Claude (uses streaming)
- Task 2.3: OpenAI Completion (uses streaming)
- Task 2.4: Groq Integration (uses streaming)

---

**Task Status:** 🔵 Not Started  
**Ready for:** Implementation  
**Last Updated:** 2025-12-20
