# Task 2.5: Embedding Generation

**Phase:** Phase 2 - LLM Integration  
**Duration Estimate:** 1 day  
**Actual Duration:** [To be filled when complete]  
**Status:** 🔵 Not Started  
**Assigned:** AI + Human Review  
**Started:** [YYYY-MM-DD]  
**Completed:** [YYYY-MM-DD]  

---

## Task Overview

### Objective
Implement the `embeddingGenerate` node for converting text into vector embeddings, supporting multiple providers (OpenAI, Voyage AI) for vector search and semantic similarity.

Embeddings are essential for RAG (Retrieval-Augmented Generation), semantic search, and similarity matching. This node will generate high-quality vector representations of text that can be stored in Qdrant or other vector databases. We'll support batch processing for efficiency and multiple embedding models for different use cases.

### Success Criteria
- [ ] OpenAI embeddings work (text-embedding-3-small, text-embedding-3-large)
- [ ] Voyage AI embeddings work
- [ ] Batch processing for multiple texts
- [ ] Proper dimensionality handling
- [ ] Output format compatible with Qdrant
- [ ] Cost-efficient batching
- [ ] Test coverage >85%
- [ ] Human review completed

### References
- CATALYST_PHASE_2_TASKS.md - Task 2.5: Embedding Generation Node
- https://platform.openai.com/docs/guides/embeddings
- https://docs.voyageai.com/embeddings/

### Dependencies
- Phase 1: Python code generation (completed)
- Task 2.1: Streaming Infrastructure (for batch processing patterns)

---

## Milestones

### Milestone 1: Design Embedding System
**Date:** [YYYY-MM-DD]  
**Confidence:** [X/10]  
**Status:** 🔵 Not Started  
**Time Spent:** [X hours]  

#### Activities
- [ ] Study embedding APIs (OpenAI, Voyage)
- [ ] Design batch processing strategy
- [ ] Plan dimensionality handling
- [ ] Design output format for vector DBs

#### Design Decisions

| Decision | Options Considered | Choice Made | Rationale | Confidence |
|----------|-------------------|-------------|-----------|------------|
| Primary provider | OpenAI, Voyage, Cohere | OpenAI (with Voyage option) | OpenAI widely used, Voyage for quality | 8/10 |
| Batch size | Process individually, Batch up to 100 | Batch up to 100 | API supports batching, cost-efficient | 9/10 |
| Dimensionality | Fixed, Configurable | Configurable per model | Different models have different dimensions | 9/10 |
| Output format | Raw arrays, Qdrant-ready | Both (raw + metadata) | Flexible for different vector DBs | 8/10 |

#### Embedding Provider Comparison

| Provider | Model | Dimensions | Cost (per 1M tokens) | Quality | Use Case |
|----------|-------|------------|---------------------|---------|----------|
| OpenAI | text-embedding-3-small | 1536 | $0.02 | Good | General purpose, cost-effective |
| OpenAI | text-embedding-3-large | 3072 | $0.13 | High | High-quality search |
| Voyage | voyage-2 | 1024 | $0.12 | High | Specialized retrieval |
| Voyage | voyage-large-2 | 1536 | $0.12 | Highest | Best quality retrieval |

#### Notes
- **Batch Processing**: Critical for cost efficiency and performance
- **Normalization**: Embeddings are pre-normalized by APIs
- **Dimension Truncation**: OpenAI supports shortening embeddings (e.g., 1536 → 512) for speed
- **Use Cases**: RAG, semantic search, document similarity, recommendation systems

---

### Milestone 2: Implement Node Metadata
**Date:** [YYYY-MM-DD]  
**Confidence:** [X/10]  
**Status:** 🔵 Not Started  
**Time Spent:** [X hours]  

#### Files Created/Modified
- `src/core/workflow/nodes/configs/llm.ts` - Add embedding node metadata
- `src/core/workflow/types.ts` - Ensure `embeddingGenerate` in NodeType

#### Node Metadata

```typescript
{
  type: 'embeddingGenerate',
  category: 'llm',
  name: 'Generate Embedding',
  description: 'Generate vector embeddings from text',
  icon: 'Hash',
  color: 'bg-purple-500',
  inputs: [
    { id: 'input', name: 'Text', type: 'default' }
  ],
  outputs: [
    { id: 'output', name: 'Embeddings', type: 'default' }
  ],
  defaultConfig: {
    provider: 'openai',
    model: 'text-embedding-3-small',
    dimensions: null, // Use model default
    batchSize: 100
  },
  configSchema: { /* ... */ },
  supportsStreaming: false
}
```

---

### Milestone 3: Implement Python Code Generation
**Date:** [YYYY-MM-DD]  
**Confidence:** [X/10]  
**Status:** 🔵 Not Started  
**Time Spent:** [X hours]  

#### Files Created/Modified
- `src/core/codegen/python/nodes/llm/embeddings.py.ts` - Python template for embeddings
- `src/core/codegen/python/NodeCodeGenerator.ts` - Add embedding case

#### Implementation Notes

**Core Functions:**

1. **execute_embedding_generate(ctx, config) -> Dict**
   - Main embedding generation function
   - Routes to provider-specific implementation
   - Handles batching automatically

2. **_openai_embeddings(ctx, config) -> Dict**
   - OpenAI-specific implementation
   - Batch processing up to 100 texts
   - Handles both text-embedding-3-small and large

3. **_voyage_embeddings(ctx, config) -> Dict**
   - Voyage AI implementation
   - Uses httpx directly (no official async SDK)
   - Specialized for retrieval tasks

**Configuration Mapping:**
- `provider` - "openai" or "voyage"
- `model` - Embedding model name
- `input` - Single text string or array of strings
- `dimensions` - Optional dimension override (OpenAI only)

**Batch Processing:**
```python
# Ensure input is a list
input_text = config["input"]
if isinstance(input_text, str):
    input_text = [input_text]

# OpenAI supports up to 100 texts per request
# Automatically batch if more
```

**Output Format:**
```python
{
    "embeddings": [
        [0.123, -0.456, ...],  # 1536-dim vector
        [0.789, -0.012, ...]
    ],
    "model": "text-embedding-3-small",
    "dimensions": 1536,
    "usage": {
        "total_tokens": 1234
    }
}
```

**Error Handling:**
- API key missing/invalid → Clear error message
- Text too long → Truncate or split with warning
- Rate limit → Standard retry logic
- Invalid model → List available models

---

### Milestone 4: Testing & Validation
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
- [ ] Generate workflow with embedding node
- [ ] Test single text embedding
- [ ] Test batch embedding (10 texts)
- [ ] Test large batch (200 texts, auto-batching)
- [ ] Verify output format
- [ ] Test with Qdrant upsert node

**Manual Testing:**

| Test Scenario | Expected | Actual | Pass/Fail | Notes |
|---------------|----------|--------|-----------|-------|
| Single text | 1536-dim vector | [To test] | - | - |
| Batch of 10 | 10 vectors | [To test] | - | - |
| Batch of 200 | Auto-batched, 200 vectors | [To test] | - | - |
| OpenAI small | Dimensions=1536 | [To test] | - | - |
| OpenAI large | Dimensions=3072 | [To test] | - | - |
| Voyage | Dimensions=1536 | [To test] | - | - |
| Qdrant integration | Vectors stored correctly | [To test] | - | - |

**Performance Benchmarks:**

| Metric | Target | Actual | Notes |
|--------|--------|--------|-------|
| Single embedding | <200ms | [To measure] | End-to-end |
| Batch of 100 | <1s | [To measure] | Should be efficient |
| Cost per 1000 embeddings | <$0.01 | [To calculate] | Using text-embedding-3-small |
| Throughput | >1000 texts/min | [To measure] | With batching |

---

### Milestone 5: Human Review
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
- [ ] Embedding generation approved
- [ ] Batch processing works efficiently
- [ ] Multiple providers tested
- [ ] Ready for production use

**Final Confidence:** [X/10]

---

## Final Summary

### Deliverables
- [ ] Embedding node metadata in registry
- [ ] `execute_embedding_generate()` function
- [ ] OpenAI embeddings support
- [ ] Voyage AI embeddings support
- [ ] Batch processing (up to 100 per request)
- [ ] Qdrant-compatible output format
- [ ] Test coverage >85%
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
- **Cohere embeddings**: Not implemented (defer to Phase 3 if needed)
- **Hugging Face**: Not implemented (defer if open-source embeddings needed)

### Future Improvements
- Add Cohere embeddings provider
- Support dimension truncation for OpenAI
- Caching for repeated texts
- Embedding fine-tuning support (when available)

### Next Steps
- [ ] Proceed to Task 2.6: Prompt Templates
- [ ] Test embeddings with Qdrant integration
- [ ] Create sample RAG workflow

---

## Appendix

### Key Files
- `src/core/workflow/nodes/configs/llm.ts` - Node metadata
- `src/core/codegen/python/nodes/llm/embeddings.py.ts` - Python template

### API Key Configuration
```python
# In ExecutionContext
ctx.secrets["OPENAI_API_KEY"]
ctx.secrets["VOYAGE_API_KEY"]  # Optional
```

### Example Usage
```python
# Single text
response = await execute_embedding_generate(ctx, {
    "provider": "openai",
    "model": "text-embedding-3-small",
    "input": "Hello, world!"
})
# Returns: {"embeddings": [[...]], "dimensions": 1536, ...}

# Batch processing
response = await execute_embedding_generate(ctx, {
    "provider": "openai",
    "model": "text-embedding-3-small",
    "input": ["Text 1", "Text 2", "Text 3", ...]
})
# Returns: {"embeddings": [[...], [...], [...]], ...}

# Voyage AI (high quality)
response = await execute_embedding_generate(ctx, {
    "provider": "voyage",
    "model": "voyage-large-2",
    "input": ["Document to embed"]
})
```

### Qdrant Integration Example
```python
# Generate embeddings
embeddings = await execute_embedding_generate(ctx, {
    "provider": "openai",
    "model": "text-embedding-3-small",
    "input": ["Doc 1", "Doc 2"]
})

# Upsert to Qdrant
await execute_qdrant_upsert(ctx, {
    "collection": "my_collection",
    "points": [
        {
            "id": 1,
            "vector": embeddings["embeddings"][0],
            "payload": {"text": "Doc 1"}
        },
        {
            "id": 2,
            "vector": embeddings["embeddings"][1],
            "payload": {"text": "Doc 2"}
        }
    ]
})
```

### Cost Optimization Tips
- Use text-embedding-3-small for most use cases ($0.02/1M tokens)
- Batch texts when possible (up to 100 per request)
- Cache embeddings for frequently used texts
- Consider dimension truncation for speed (OpenAI supports this)

### Related Tasks
- Task 1.3: Qdrant integration (vector storage)
- Task 3.X: RAG workflow implementation (Phase 3)

### Useful Links
- https://platform.openai.com/docs/guides/embeddings/what-are-embeddings
- https://docs.voyageai.com/docs/embeddings
- https://qdrant.tech/documentation/concepts/vectors/

---

**Task Status:** 🔵 Not Started  
**Ready for:** Implementation  
**Last Updated:** 2025-12-20
