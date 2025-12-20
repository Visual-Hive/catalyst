# Phase 2: LLM Integration

**Duration:** ~2 weeks (5.5 days implementation)  
**Status:** 🔵 Not Started  
**Dependencies:** Phase 0 complete, Phase 1 complete

---

## Overview

Phase 2 implements comprehensive LLM provider integrations with first-class streaming support. This phase transforms Catalyst from a workflow builder into a powerful AI automation platform by integrating with major LLM providers and implementing real-time streaming capabilities.

### Key Goals

1. **Streaming Infrastructure** - Server-Sent Events (SSE) for real-time token streaming
2. **Multi-Provider Support** - Integrate Anthropic Claude, OpenAI GPT, and Groq
3. **Embedding Generation** - Vector embeddings for RAG and semantic search
4. **Prompt Engineering** - Dynamic templates with variable interpolation
5. **Intelligent Routing** - Automatic provider selection based on cost/speed/quality

---

## Phase 2 Tasks

### Task 2.1: Streaming Infrastructure (0.5 day)
**File:** `task-2.1-streaming-infrastructure.md`

Build SSE foundation for real-time LLM responses.

**Key Deliverables:**
- `format_sse()` function with orjson
- `streaming_response()` with proper headers
- `stream_tokens()` for LLM output
- X-Accel-Buffering header for nginx

**Why Critical:** All LLM nodes depend on this for streaming support.

---

### Task 2.2: Anthropic Claude (1.5 days)
**File:** `task-2.2-anthropic-claude.md`

Integrate Claude 3.5 Sonnet, Haiku, and Opus models.

**Key Deliverables:**
- `anthropicCompletion` node
- Streaming and non-streaming modes
- System prompt support
- All Claude models (Opus, Sonnet, Haiku)

**Why Important:** Claude is known for high-quality reasoning and long context (200K tokens).

---

### Task 2.3: OpenAI Completion (1 day)
**File:** `task-2.3-openai-completion.md`

Integrate GPT-4, GPT-4 Turbo, and GPT-3.5 models.

**Key Deliverables:**
- `openaiCompletion` node
- Function calling support
- JSON mode
- All GPT models

**Why Important:** OpenAI is widely used and offers function calling for agentic workflows.

---

### Task 2.4: Groq Integration (0.5 day)
**File:** `task-2.4-groq-integration.md`

Integrate Groq for ultra-fast inference (500-800 tokens/sec).

**Key Deliverables:**
- `groqCompletion` node
- Llama and Mixtral models
- Ultra-low latency (<100ms first token)

**Why Important:** Groq provides 10-100x faster inference for real-time applications.

---

### Task 2.5: Embedding Generation (1 day)
**File:** `task-2.5-embedding-generation.md`

Generate vector embeddings for RAG and semantic search.

**Key Deliverables:**
- `embeddingGenerate` node
- OpenAI embeddings (text-embedding-3-small/large)
- Voyage AI embeddings
- Batch processing

**Why Important:** Essential for RAG workflows and vector search in Qdrant.

---

### Task 2.6: Prompt Templates (0.5 day)
**File:** `task-2.6-prompt-templates.md`

Build dynamic prompts with variable interpolation.

**Key Deliverables:**
- `promptTemplate` node
- Variable interpolation (`{{variable}}`)
- Multi-message support
- Expression integration

**Why Important:** Enables reusable, dynamic prompt engineering.

---

### Task 2.7: LLM Router (0.5 day)
**File:** `task-2.7-llm-router.md`

Intelligent routing based on cost/speed/quality criteria.

**Key Deliverables:**
- `llmRouter` node
- Cost/speed/quality presets
- Custom condition support
- Fallback mechanism

**Why Important:** Optimizes costs and performance by routing to the right provider.

---

## Task Dependencies

```
Phase 0 Complete
      ↓
   Task 2.1 (Streaming) ──┬─→ Task 2.2 (Claude)
                          ├─→ Task 2.3 (OpenAI)
                          └─→ Task 2.4 (Groq)
                                   ↓
                          Tasks 2.2-2.4 → Task 2.7 (Router)
   
   Phase 0 Complete → Task 2.5 (Embeddings)
   
   Phase 1 Complete → Task 2.6 (Prompt Templates)
```

**Critical Path:** Task 2.1 → Task 2.2 → Task 2.7

---

## Success Criteria

### Technical Requirements
- [ ] All 7 LLM-related node types implemented
- [ ] Streaming works end-to-end in browser
- [ ] First token latency <300ms
- [ ] All providers have error handling
- [ ] Test coverage >85%
- [ ] Performance benchmarks met

### Integration Requirements
- [ ] Node metadata in registry
- [ ] Canvas can place and connect LLM nodes
- [ ] Configuration panels work
- [ ] Expression system integrated
- [ ] Workflow validation includes LLM nodes

### Performance Targets
- [ ] SSE streaming (no buffering)
- [ ] First token: <300ms (Claude/OpenAI), <100ms (Groq)
- [ ] Tokens/sec: 40-80 (Claude), 50-100 (OpenAI), 500-800 (Groq)
- [ ] orjson for JSON serialization
- [ ] X-Accel-Buffering: no header set

---

## Key Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Streaming format | Server-Sent Events (SSE) | Browser-native, works with nginx, simpler than WebSockets |
| JSON serialization | orjson | 2-3x faster than stdlib, critical for streaming |
| Claude default model | Claude 3.5 Sonnet | Best balance of quality/speed/cost |
| OpenAI default model | GPT-4 Turbo | Fast, high-quality, 128K context |
| Groq positioning | Speed-critical tasks | 10-100x faster inference |
| Router strategy | Config-driven presets | Flexible, no code changes needed |

---

## LLM Provider Comparison

| Provider | Model | Speed | Quality | Cost | Best For |
|----------|-------|-------|---------|------|----------|
| **Anthropic** | Claude 3.5 Sonnet | Fast | High | $$ | General purpose, reasoning |
| Anthropic | Claude 3 Opus | Slow | Highest | $$$ | Complex analysis |
| Anthropic | Claude 3 Haiku | Fastest | Good | $ | Simple tasks |
| **OpenAI** | GPT-4 Turbo | Fast | Highest | $$ | General purpose, 128K context |
| OpenAI | GPT-4 | Slow | Highest | $$$ | Complex reasoning (legacy) |
| OpenAI | GPT-3.5 Turbo | Fastest | Good | $ | Simple, high-volume |
| **Groq** | Llama 3.1 70B | Ultra-fast | High | $ | Real-time, demos |
| Groq | Llama 3.1 8B | Extreme | Good | $ | Ultra-fast simple tasks |
| Groq | Mixtral 8x7B | Ultra-fast | High | $ | Fast reasoning |

**Recommended defaults in bold**

---

## Performance Benchmarks (Target)

| Metric | Claude | OpenAI | Groq | Notes |
|--------|--------|--------|------|-------|
| First token latency | 300-400ms | 200-300ms | 50-100ms | Time to first streamed token |
| Tokens per second | 40-80 | 50-100 | 500-800 | Streaming throughput |
| 100-token response | 1.5-2.5s | 1-2s | 200-300ms | End-to-end time |
| Context window | 200K | 128K | 32K-128K | Maximum input tokens |

---

## Implementation Timeline

### Week 1
- **Days 1-2:** Task 2.1 (Streaming) + Task 2.2 (Claude)
- **Days 3-4:** Task 2.3 (OpenAI) + Task 2.4 (Groq)
- **Day 5:** Task 2.5 (Embeddings)

### Week 2
- **Days 1-2:** Task 2.6 (Prompts) + Task 2.7 (Router)
- **Days 3-4:** Integration testing, bug fixes
- **Day 5:** Human review, documentation, Phase 2 complete

---

## Human Review Checkpoints

**After Task 2.1:**
- [ ] Streaming infrastructure works
- [ ] SSE format correct
- [ ] Headers set properly

**After Task 2.2:**
- [ ] Claude streaming verified in browser
- [ ] First token latency <300ms
- [ ] All models work

**After Tasks 2.2-2.4:**
- [ ] All providers functional
- [ ] Streaming works end-to-end
- [ ] Performance targets met

**End of Phase 2:**
- [ ] All 7 nodes complete
- [ ] Integration tested
- [ ] Ready for Phase 3

---

## Files Created This Phase

### Core Implementation
```
src/core/codegen/python/templates/
├── streaming.py.ts

src/core/codegen/python/nodes/llm/
├── anthropic.py.ts
├── openai.py.ts
├── groq.py.ts
├── embeddings.py.ts
├── prompt.py.ts
└── router.py.ts
```

### Node Metadata
```
src/core/workflow/nodes/configs/
└── llm.ts (updated with 7+ new nodes)
```

### Tests
```
tests/unit/codegen/python/
├── streaming.test.ts
├── anthropic.test.ts
├── openai.test.ts
├── groq.test.ts
├── embeddings.test.ts
├── prompt.test.ts
└── router.test.ts
```

---

## Common Patterns

### Streaming Pattern
```python
async def stream_llm_completion(ctx, config):
    """Stream LLM tokens as they arrive."""
    async for token in provider_client.stream(...):
        yield format_sse("token", {"text": token})
    yield format_sse("done", {"text": full_text})
```

### Error Handling Pattern
```python
try:
    response = await client.messages.create(...)
    return format_response(response)
except APIError as e:
    if e.status_code == 429:
        raise RateLimitError(f"Rate limited. Retry after {e.retry_after}s")
    elif e.status_code == 401:
        raise AuthenticationError("Invalid API key")
    else:
        raise LLMError(f"API error: {e.message}")
```

### Provider Config Pattern
```python
def build_provider_config(config):
    """Build provider-specific configuration."""
    return {
        "model": config.get("model", DEFAULT_MODEL),
        "max_tokens": config.get("max_tokens", 4096),
        "temperature": config.get("temperature", 0.7),
        "messages": config["messages"],
    }
```

---

## Testing Strategy

### Unit Tests
- Each LLM node function
- Streaming utilities
- Router logic
- Template interpolation

### Integration Tests
- Generate workflow with LLM nodes
- Generate Python code
- Run with test API keys
- Verify streaming in browser

### Manual Tests
- Test all models
- Verify streaming speed
- Test error conditions
- Validate output formats

---

## Security Considerations

- [ ] API keys stored in system keychain
- [ ] No API keys in generated code (use ctx.secrets)
- [ ] Expression system sandboxed
- [ ] Input validation on all node configs
- [ ] Rate limiting respected
- [ ] Error messages don't leak sensitive info

---

## Cost Optimization Tips

1. **Use Router Node**: Automatically route simple queries to cheap providers
2. **Start with Groq**: Free tier, ultra-fast
3. **GPT-3.5 for Volume**: 100x cheaper than GPT-4
4. **Batch Embeddings**: Up to 100 texts per request
5. **Cache Responses**: Store common queries (Phase 3)

---

## Next Steps After Phase 2

### Phase 3: Data & HTTP Integration
- Qdrant vector database
- PostgreSQL queries
- HTTP requests
- Directus CMS
- GraphQL queries

### Phase 4: Advanced Features
- Agentic workflows
- Multi-step reasoning
- Tool calling
- Streaming aggregation

---

## References

- [CATALYST_PHASE_2_TASKS.md](../../docs/Catalyst%20documentation/CATALYST_PHASE_2_TASKS.md) - Detailed specifications
- [CATALYST_SPECIFICATION.md](../../docs/Catalyst%20documentation/CATALYST_SPECIFICATION.md) - Overall architecture
- [Anthropic Docs](https://docs.anthropic.com/)
- [OpenAI Docs](https://platform.openai.com/docs/)
- [Groq Docs](https://console.groq.com/docs/)

---

**Phase Status:** 🔵 Not Started  
**Ready for:** Implementation  
**Last Updated:** 2025-12-20
