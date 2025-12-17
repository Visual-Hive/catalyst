# Visual Hive n8n → Catalyst Migration Guide
## Node Mapping and Migration Strategy

**Document Version:** 1.0  
**Created:** December 2025  
**Purpose:** Map existing n8n nodes to Catalyst equivalents and plan migration

---

## Current n8n Node Usage Analysis

Based on your description, here's the complete mapping of n8n nodes you use to Catalyst equivalents:

### Triggers

| n8n Node | Catalyst Node | Status | Notes |
|----------|---------------|--------|-------|
| HTTP Endpoint | `httpEndpoint` | ✅ Phase 1 | Full parity |
| Subworkflow Trigger | `subworkflowTrigger` | ✅ Phase 1 | Called by other workflows |
| Webhook | `webhookReceiver` | ✅ Phase 5 | For external services |
| Schedule | `scheduledTask` | ⏳ Phase 5 | Daily digest emails |

### LLM / AI Nodes

| n8n Node | Catalyst Node | Status | Notes |
|----------|---------------|--------|-------|
| Anthropic (Claude) | `anthropicCompletion` | ✅ Phase 2 | Streaming + caching |
| Groq | `groqCompletion` | ✅ Phase 2 | Fast inference |
| OpenAI | `openaiCompletion` | ✅ Phase 2 | GPT models |
| Azure OpenAI | `azureOpenaiCompletion` | ✅ Phase 2 | Enterprise deployments |
| Azure AI Foundry Embeddings | `embeddingGenerate` | ✅ Phase 2 | Vector generation |
| Agentic Tool Calling | `agenticToolCall` | ✅ Phase 5 | Tool use with LLMs |

### Data Sources

| n8n Node | Catalyst Node | Status | Notes |
|----------|---------------|--------|-------|
| Qdrant - Search | `qdrantSearch` | ✅ Phase 3 | Vector similarity |
| Qdrant - Scroll Points | `qdrantScroll` | ✅ Phase 3 | Paginated retrieval |
| Qdrant - Upsert Points | `qdrantUpsert` | ✅ Phase 3 | Insert/update |
| Qdrant - Override Payload | `qdrantPayload` | ✅ Phase 3 | Metadata updates |
| Directus | `directusSDK` | ✅ Phase 5 | Full SDK with field picker |
| GraphQL | `graphqlQuery` | ✅ Phase 3 | With pagination |
| Postgres | `postgresQuery` | ✅ Phase 3 | SQL queries |

### HTTP / External

| n8n Node | Catalyst Node | Status | Notes |
|----------|---------------|--------|-------|
| HTTP Request | `httpRequest` | ✅ Phase 1 | Auth types + pagination |
| Gmail | `gmailOperation` | ✅ Phase 5 | OAuth + service account |

### Control Flow

| n8n Node | Catalyst Node | Status | Notes |
|----------|---------------|--------|-------|
| IF | `condition` | ✅ Phase 1 | True/false branching |
| Switch | `switch` | ✅ Phase 4 | Multi-way branching |
| Loop (Items) | `loop` | ✅ Phase 4 | Iterate with optional parallelism |
| Split In Batches | `splitArray` | ✅ Phase 4 | Batch processing |
| Merge/Aggregate | `aggregate` | ✅ Phase 4 | Combine results |
| Filter | `filterArray` | ✅ Phase 4 | Filter items |
| Limit | `filterArray` | ✅ Phase 4 | Use with limit expression |

### Transform / Data Manipulation

| n8n Node | Catalyst Node | Status | Notes |
|----------|---------------|--------|-------|
| Edit Fields | `editFields` | ✅ Phase 1 | Static + dynamic JSON |
| Code (JavaScript) | `javascriptFunction` | ✅ Phase 4 | Sandboxed execution |
| Code (Python) | `pythonFunction` | ✅ Phase 4 | Native Python |

### Utilities

| n8n Node | Catalyst Node | Status | Notes |
|----------|---------------|--------|-------|
| Crypto (UUID) | `cryptoGenerate` | ✅ Phase 5 | uuid, password, hash |
| Crypto (Password) | `cryptoGenerate` | ✅ Phase 5 | Secure random |
| Execution Data | `executionData` | ✅ Phase 5 | Global vars in execution |
| Global Variables | `globalVariable` | ✅ Phase 0 | .env style access |

### Streaming (NEW in Catalyst)

| n8n Workaround | Catalyst Node | Status | Notes |
|----------------|---------------|--------|-------|
| N/A (not supported) | `streamStart` | ✅ Phase 4 | Begin SSE stream |
| N/A | `streamChunk` | ✅ Phase 4 | Send chunk |
| N/A | `streamEnd` | ✅ Phase 4 | End stream |
| N/A | `streamMerge` | ✅ Phase 4 | Merge parallel streams |

---

## Node Implementation Priority

### Phase 1 (Critical Path - Week 2-3)
Must have for basic workflow execution:

```
✅ httpEndpoint     - Entry point for API
✅ editFields       - Data transformation
✅ httpRequest      - External API calls
✅ condition        - Basic branching
✅ log              - Debugging
```

### Phase 2 (LLM Integration - Week 4-5)
Must have for AI features:

```
✅ anthropicCompletion  - Claude calls with streaming
✅ groqCompletion       - Fast inference
✅ openaiCompletion     - GPT calls
✅ azureOpenaiCompletion - Enterprise
✅ embeddingGenerate    - Vector embeddings
✅ promptTemplate       - Prompt construction
```

### Phase 3 (Data Integration - Week 6-7)
Must have for Visual Hive data access:

```
✅ qdrantSearch     - Vector search
✅ qdrantUpsert     - Vector updates
✅ qdrantScroll     - Paginated retrieval
✅ qdrantPayload    - Metadata updates
✅ postgresQuery    - SQL access
✅ redisOperation   - Caching
✅ directusQuery    - Basic Directus
✅ graphqlQuery     - GraphQL with pagination
```

### Phase 4 (Advanced Control - Week 8-9)
Required for complex workflows:

```
✅ parallel         - Fan-out execution
✅ aggregate        - Fan-in results
✅ loop             - Iteration
✅ switch           - Multi-way branch
✅ retry            - Error recovery
✅ javascriptFunction - Custom code
✅ pythonFunction   - Python code
✅ filterArray      - Filtering
✅ mapArray         - Transformation
✅ splitArray       - Batching
✅ streamStart/Chunk/End - Streaming
✅ streamMerge      - Parallel streams
```

### Phase 5 (Polish - Week 10-11)
Nice to have for full parity:

```
✅ agenticToolCall  - Tool use
✅ directusSDK      - Full SDK integration
✅ gmailOperation   - Email
✅ cryptoGenerate   - UUIDs, passwords
✅ executionData    - Execution context
✅ webhookSend      - Outgoing webhooks
✅ scheduledTask    - Cron jobs
```

---

## Feature Gap Analysis

### Features n8n Has That Catalyst Will Improve

| Feature | n8n Limitation | Catalyst Solution |
|---------|---------------|-------------------|
| Streaming | Not supported | Native SSE/WebSocket |
| Parallelism | Limited, sequential under load | True async/await parallel |
| Caching | Manual implementation | Built-in with Redis |
| Prompt Caching | Not supported | Claude cache_control |
| Code Export | Proprietary JSON | Clean Python code |
| Performance | ~500ms cold start | <10ms (native Python) |
| Concurrent Users | ~50 practical limit | 1000+ with async |

### Features n8n Has That Catalyst Must Match

| Feature | n8n Implementation | Catalyst Implementation |
|---------|-------------------|------------------------|
| Visual Field Picker | Directus node UI | `directusSDK` with schema introspection |
| Pagination Control | UI parameters | Expression-based cursor handling |
| Auth Types | Dropdown selection | Type-safe config schema |
| Error Handling | Per-node settings | `onError` + `retry` nodes |
| Variable Interpolation | `{{ $json.field }}` | `{{ nodes.x.output.field }}` |

### New Capabilities in Catalyst

| Feature | Description | Benefit |
|---------|-------------|---------|
| Sub-second streaming | First result in <1s | 6-8x faster perceived response |
| Speculative execution | Race multiple strategies | Best result wins |
| Visual debugging | Execution trace in UI | Easier troubleshooting |
| Code inspection | View generated Python | Learn and customize |
| Self-hosted | Full code ownership | Zero vendor lock-in |

---

## Migration Workflow-by-Workflow

### Workflow 1: Conference Search (P0)

**Current n8n Structure:**
```
HTTP Trigger
    ↓
Groq (Profile Summary)
    ↓
Anthropic (Search Planning)
    ↓
Qdrant Search x4 (Sequential)
    ↓
Groq (Reranking)
    ↓
Anthropic (Response Composition)
    ↓
HTTP Response
```

**Catalyst Optimized Structure:**
```
httpEndpoint (POST /api/v1/search)
    ↓
parallel (mode: all)
    ├── qdrantSearch (semantic)
    ├── qdrantSearch (keyword)
    ├── qdrantSearch (collaborative)
    └── qdrantSearch (exploration)
    ↓
aggregate (merge + dedupe)
    ↓
streamStart (SSE)
    ↓
anthropicCompletion (streaming: true)
    ↓ (chunks)
streamChunk (forward to client)
    ↓
streamEnd
```

**Expected Improvements:**
- Latency: 6-8s → <1s first result
- Parallelism: 4 sequential → 4 concurrent
- Streaming: Batch → Progressive
- LLM Calls: 4 → 1 (with caching)

---

### Workflow 2: User Profile Sync (P1)

**Current n8n Structure:**
```
Schedule Trigger (daily)
    ↓
Directus (Get Users)
    ↓
Loop (each user)
    ↓
Edit Fields (prepare payload)
    ↓
Azure Embeddings
    ↓
Qdrant Upsert
```

**Catalyst Structure:**
```
scheduledTask (cron: "0 2 * * *")
    ↓
directusSDK (collection: users, fields: [...])
    ↓
loop (parallel: true, batchSize: 10)
    ├── editFields (prepare payload)
    ├── embeddingGenerate (Azure)
    └── qdrantUpsert
    ↓
log (summary)
```

**Expected Improvements:**
- Duration: 30min → 5min (parallel batches)
- Memory: Linear → Constant (streaming)
- Reliability: Manual retry → Automatic

---

### Workflow 3: Exhibitor Matching (P1)

Similar to Conference Search, with additional:
- GraphQL queries to external systems
- Multiple Qdrant collections
- Confidence scoring

---

## Expression Syntax Migration

### n8n Expressions → Catalyst Expressions

| n8n | Catalyst | Notes |
|-----|----------|-------|
| `{{ $json.field }}` | `{{ input.field }}` | Input data |
| `{{ $node["X"].json.field }}` | `{{ nodes.X.output.field }}` | Node output |
| `{{ $env.VAR }}` | `{{ env.VAR }}` | Environment |
| `{{ $execution.id }}` | `{{ execution.id }}` | Execution context |
| `{{ $today }}` | `{{ now() \| format('YYYY-MM-DD') }}` | Date functions |
| `{{ $jmespath($json, 'query') }}` | `{{ input \| jmespath('query') }}` | JMESPath |

### Common Patterns

**Conditional Value:**
```
# n8n
{{ $json.status === 'active' ? 'Yes' : 'No' }}

# Catalyst
{{ 'Yes' if input.status == 'active' else 'No' }}
```

**Array Operations:**
```
# n8n
{{ $json.items.map(i => i.name).join(', ') }}

# Catalyst
{{ input.items | pluck('name') | join(', ') }}
```

**Nested Access:**
```
# n8n
{{ $json.user?.profile?.name ?? 'Unknown' }}

# Catalyst
{{ input.user.profile.name | default('Unknown') }}
```

---

## Testing Strategy

### Unit Testing
Each node type should have unit tests covering:
- Valid input → expected output
- Invalid input → proper error
- Edge cases (empty arrays, null values)

### Integration Testing
Workflow-level tests:
- Full workflow execution
- Error handling paths
- Timeout behavior
- Streaming correctness

### Shadow Testing
Before full migration:
1. Run both n8n and Catalyst in parallel
2. Compare responses for same inputs
3. Measure latency differences
4. Verify data consistency

### Load Testing
Visual Hive targets:
- 1000 concurrent users
- <1s first result (p95)
- <5s complete response (p95)
- 99.9% uptime

---

## Rollout Plan

### Week 1: Development Complete
- [ ] All nodes implemented
- [ ] Conference Search workflow working
- [ ] Local testing passing

### Week 2: Shadow Mode
- [ ] Deploy Catalyst alongside n8n
- [ ] 0% traffic to Catalyst
- [ ] Compare responses offline
- [ ] Fix any discrepancies

### Week 3: Gradual Rollout
- [ ] 10% traffic to Catalyst (Mon)
- [ ] Monitor error rates
- [ ] 25% traffic (Wed)
- [ ] 50% traffic (Fri)

### Week 4: Full Migration
- [ ] 100% traffic to Catalyst
- [ ] n8n on hot standby
- [ ] Monitor for 1 week
- [ ] Decommission n8n

### Rollback Criteria
Immediately roll back to n8n if:
- Error rate > 5%
- Latency p95 > 10s
- Data inconsistencies detected
- Any critical bugs

---

## Cost Comparison

### Current (n8n)
```
Monthly costs at 10k queries:
- LLM API (no caching):     $335
- n8n Cloud:                $99
- Qdrant Cloud:             $200
- Total:                    $634/month
```

### Projected (Catalyst)
```
Monthly costs at 10k queries:
- LLM API (70% cache hit):  $100
- Compute (FastAPI):        $50
- Qdrant Cloud:             $200
- Redis (caching):          $30
- Total:                    $380/month

Savings: $254/month (40%)
```

At 100k queries (10x scale):
- n8n: Limited, would need multiple instances
- Catalyst: Same infrastructure, ~$800/month

---

## Appendix: Node Config Examples

### qdrantSearch
```json
{
  "type": "qdrantSearch",
  "config": {
    "collection": "attendees",
    "queryVector": "{{ embedding(input.query) }}",
    "limit": 20,
    "scoreThreshold": 0.7,
    "filter": {
      "must": [
        { "key": "event_id", "match": { "value": "{{ input.eventId }}" } }
      ]
    },
    "withPayload": true
  }
}
```

### anthropicCompletion
```json
{
  "type": "anthropicCompletion",
  "config": {
    "model": "claude-sonnet-4-5-20250514",
    "streaming": true,
    "systemPrompt": "You are a conference matchmaking assistant...",
    "messages": [
      {
        "role": "user",
        "content": "Find matches for: {{ input.query }}\n\nResults: {{ nodes.search.output }}"
      }
    ],
    "maxTokens": 1000,
    "cache": {
      "enabled": true,
      "breakpoints": ["system"]
    }
  }
}
```

### directusSDK
```json
{
  "type": "directusSDK",
  "config": {
    "operation": "readItems",
    "collection": "attendees",
    "query": {
      "fields": ["id", "name", "email", "profile.*"],
      "filter": {
        "event_id": { "_eq": "{{ input.eventId }}" },
        "status": { "_eq": "active" }
      },
      "limit": 100,
      "sort": ["-created_at"]
    }
  }
}
```

### parallel
```json
{
  "type": "parallel",
  "config": {
    "mode": "all",
    "timeout": 5000,
    "children": ["semantic_search", "keyword_search", "collaborative_search"]
  }
}
```

---

**End of Migration Guide**
