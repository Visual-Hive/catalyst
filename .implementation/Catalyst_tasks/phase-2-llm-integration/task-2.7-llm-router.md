# Task 2.7: LLM Router

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
Implement the `llmRouter` node for intelligent routing to different LLM providers based on conditions like cost, speed, quality, or custom criteria.

The LLM Router enables cost optimization and performance tuning by automatically selecting the best LLM provider for each request. For example, simple queries can route to Groq (fast/cheap), while complex reasoning routes to Claude Opus (high quality). This gives users flexibility without hardcoding provider choices.

### Success Criteria
- [ ] Conditional routing works (if/else logic)
- [ ] Cost-based routing strategy
- [ ] Speed-based routing strategy
- [ ] Quality-based routing strategy
- [ ] Custom condition support
- [ ] Fallback mechanism when conditions fail
- [ ] Routes to all LLM nodes (Claude, OpenAI, Groq)
- [ ] Test coverage >85%
- [ ] Human review completed

### References
- CATALYST_PHASE_2_TASKS.md - Task 2.7: LLM Router Node
- Tasks 2.2-2.4: LLM provider nodes (dependencies)

### Dependencies
- Task 2.2: Anthropic Claude (completed)
- Task 2.3: OpenAI Completion (completed)
- Task 2.4: Groq Integration (completed)
- Phase 1: Expression Compiler (for condition evaluation)

---

## Milestones

### Milestone 1: Design Router Architecture
**Date:** [YYYY-MM-DD]  
**Confidence:** [X/10]  
**Status:** 🔵 Not Started  
**Time Spent:** [X hours]  

#### Activities
- [ ] Design routing condition system
- [ ] Plan strategy presets (cost/speed/quality)
- [ ] Design fallback mechanism
- [ ] Plan configuration schema

#### Design Decisions

| Decision | Options Considered | Choice Made | Rationale | Confidence |
|----------|-------------------|-------------|-----------|------------|
| Routing logic | Config-driven, Code-driven | Config-driven with presets | Flexible, no code changes needed | 9/10 |
| Condition syntax | Python expressions, DSL | Python expressions (compiled) | Reuse Phase 1 compiler, powerful | 9/10 |
| Strategies | Hardcoded, Configurable | Presets + custom | Best of both worlds | 8/10 |
| Fallback | First route, Specific provider | Configurable default | User choice is important | 9/10 |

#### Routing Strategies

| Strategy | Logic | Use Case |
|----------|-------|----------|
| Cost | Route to cheapest model that meets requirements | High-volume, budget-conscious |
| Speed | Route to fastest model | Real-time, latency-sensitive |
| Quality | Route to highest quality model | Complex reasoning, accuracy-critical |
| Balanced | Optimize cost/speed/quality tradeoff | General purpose |
| Custom | User-defined conditions | Specific business logic |

#### Notes
- **Dynamic Routing**: Decisions made at runtime based on input
- **Preset Strategies**: Common patterns pre-configured
- **Custom Conditions**: Full flexibility via expressions
- **Observability**: Log routing decisions for debugging

---

### Milestone 2: Implement Node Metadata
**Date:** [YYYY-MM-DD]  
**Confidence:** [X/10]  
**Status:** 🔵 Not Started  
**Time Spent:** [X hours]  

#### Files Created/Modified
- `src/core/workflow/nodes/configs/llm.ts` - Add router node metadata
- `src/core/workflow/types.ts` - Ensure `llmRouter` in NodeType

#### Node Metadata

```typescript
{
  type: 'llmRouter',
  category: 'llm',
  name: 'LLM Router',
  description: 'Route to different LLMs based on conditions',
  icon: 'GitBranch',
  color: 'bg-purple-500',
  inputs: [
    { id: 'input', name: 'Input', type: 'default' }
  ],
  outputs: [
    { id: 'output', name: 'Response', type: 'default' }
  ],
  defaultConfig: {
    strategy: 'balanced',
    routes: [
      {
        condition: 'always',
        provider: 'anthropic',
        model: 'claude-3-5-sonnet-20241022'
      }
    ],
    fallback: {
      provider: 'anthropic',
      model: 'claude-3-5-sonnet-20241022'
    },
    messages: []
  },
  configSchema: { /* ... */ },
  supportsStreaming: false,
  experimental: true
}
```

---

### Milestone 3: Implement Python Code Generation
**Date:** [YYYY-MM-DD]  
**Confidence:** [X/10]  
**Status:** 🔵 Not Started  
**Time Spent:** [X hours]  

#### Files Created/Modified
- `src/core/codegen/python/nodes/llm/router.py.ts` - Python template
- `src/core/codegen/python/NodeCodeGenerator.ts` - Add router case

#### Implementation Notes

**Core Functions:**

1. **execute_llm_router(ctx, config) -> Dict**
   - Main routing function
   - Evaluates conditions in order
   - Routes to selected provider
   - Falls back to default if no match

2. **_evaluate_condition(condition, ctx) -> bool**
   - Evaluates routing condition
   - Supports predefined strategies and custom expressions

3. **_get_provider_config(route, base_config) -> Dict**
   - Builds provider-specific configuration
   - Merges route config with base config

**Configuration Mapping:**
- `strategy` - "cost", "speed", "quality", "balanced", or "custom"
- `routes` - Array of {condition, provider, model} rules
- `fallback` - Default provider/model when no conditions match
- `messages` - Input messages to route

**Routing Logic:**
```python
# Evaluate routes in order
for route in config.get("routes", []):
    if _evaluate_condition(route["condition"], ctx):
        provider = route["provider"]
        model = route.get("model")
        break
else:
    # No match - use fallback
    provider = config["fallback"]["provider"]
    model = config["fallback"]["model"]

# Route to provider
if provider == "anthropic":
    return await execute_anthropic_completion(ctx, provider_config)
elif provider == "openai":
    return await execute_openai_completion(ctx, provider_config)
elif provider == "groq":
    return await execute_groq_completion(ctx, provider_config)
```

**Preset Strategies:**

```python
STRATEGIES = {
    "cost": [
        {"condition": "len(messages) < 500", "provider": "groq", "model": "llama-3.1-8b-instant"},
        {"condition": "len(messages) < 2000", "provider": "groq", "model": "llama-3.1-70b-versatile"},
        {"condition": "always", "provider": "anthropic", "model": "claude-3-5-sonnet-20241022"}
    ],
    "speed": [
        {"condition": "always", "provider": "groq", "model": "llama-3.1-70b-versatile"}
    ],
    "quality": [
        {"condition": "len(messages) < 1000", "provider": "anthropic", "model": "claude-3-5-sonnet-20241022"},
        {"condition": "always", "provider": "anthropic", "model": "claude-3-opus-20240229"}
    ],
    "balanced": [
        {"condition": "len(messages) < 500", "provider": "groq", "model": "llama-3.1-70b-versatile"},
        {"condition": "always", "provider": "anthropic", "model": "claude-3-5-sonnet-20241022"}
    ]
}
```

**Error Handling:**
- Provider not available → Clear error with available providers
- Invalid condition → Caught at compile time
- All routes fail → Use fallback
- Fallback fails → Propagate error

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
- [ ] Generate workflow with router node
- [ ] Test cost strategy
- [ ] Test speed strategy
- [ ] Test quality strategy
- [ ] Test custom conditions
- [ ] Test fallback mechanism
- [ ] Verify routing decisions

**Manual Testing:**

| Test Scenario | Expected | Actual | Pass/Fail | Notes |
|---------------|----------|--------|-----------|-------|
| Cost strategy (short) | Routes to Groq | [To test] | - | - |
| Cost strategy (long) | Routes to Claude | [To test] | - | - |
| Speed strategy | Always Groq | [To test] | - | - |
| Quality strategy | Claude Opus for complex | [To test] | - | - |
| Custom condition | Evaluates correctly | [To test] | - | - |
| Fallback | Uses default when no match | [To test] | - | - |
| All providers work | Claude, OpenAI, Groq | [To test] | - | - |

**Routing Decision Validation:**

| Input Size | Cost Strategy | Speed Strategy | Quality Strategy |
|-----------|---------------|----------------|------------------|
| <500 chars | Groq 8B | Groq 70B | Claude Sonnet |
| 500-2000 | Groq 70B | Groq 70B | Claude Sonnet |
| >2000 | Claude Sonnet | Groq 70B | Claude Opus |

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
- [ ] Router logic approved
- [ ] Strategies validated
- [ ] All providers tested
- [ ] Ready for production use

**Final Confidence:** [X/10]

---

## Final Summary

### Deliverables
- [ ] LLM Router node metadata in registry
- [ ] `execute_llm_router()` function
- [ ] Cost/speed/quality strategy presets
- [ ] Custom condition support
- [ ] Fallback mechanism
- [ ] Routes to all 3 providers
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
- **Load balancing**: Not implemented (defer to Phase 3)
- **A/B testing**: Not implemented (defer to Phase 3)
- **Caching**: Not implemented (defer to Phase 3)

### Future Improvements
- Add load balancing across providers
- A/B testing between models
- Response caching for repeated queries
- Cost tracking and budget limits
- Performance monitoring per provider

### Next Steps
- [ ] Phase 2 complete - begin Phase 3
- [ ] Test router in real workflows
- [ ] Document routing best practices

---

## Appendix

### Key Files
- `src/core/workflow/nodes/configs/llm.ts` - Node metadata
- `src/core/codegen/python/nodes/llm/router.py.ts` - Python template

### Example Usage

**Cost-Optimized Routing:**
```python
response = await execute_llm_router(ctx, {
    "strategy": "cost",
    "messages": [
        {"role": "user", "content": "Simple question"}
    ]
})
# Routes to Groq (cheapest) for short messages
```

**Custom Conditions:**
```python
response = await execute_llm_router(ctx, {
    "routes": [
        {
            "condition": "input.get('priority') == 'high'",
            "provider": "anthropic",
            "model": "claude-3-opus-20240229"
        },
        {
            "condition": "input.get('type') == 'code'",
            "provider": "openai",
            "model": "gpt-4-turbo-preview"
        },
        {
            "condition": "always",
            "provider": "groq",
            "model": "llama-3.1-70b-versatile"
        }
    ],
    "messages": messages
})
```

**Quality-First with Fallback:**
```python
response = await execute_llm_router(ctx, {
    "strategy": "quality",
    "fallback": {
        "provider": "anthropic",
        "model": "claude-3-5-sonnet-20241022"
    },
    "messages": messages
})
```

### Condition Examples

```python
# Input length
"len(input['messages'][0]['content']) < 500"

# Priority field
"input.get('priority') == 'high'"

# Environment variable
"env.get('USE_FAST_MODEL') == 'true'"

# Time-based
"datetime.now().hour < 9"  # Off-peak hours

# User tier
"user.get('tier') == 'premium'"

# Always route
"always"
```

### Cost Comparison (Approximate)

| Provider | Model | Cost per 1M input tokens | Cost per 1M output tokens |
|----------|-------|-------------------------|--------------------------|
| Groq | Llama 3.1 8B | Free tier / $0.05 | Free tier / $0.08 |
| Groq | Llama 3.1 70B | Free tier / $0.59 | Free tier / $0.79 |
| Groq | Mixtral 8x7B | Free tier / $0.24 | Free tier / $0.24 |
| Anthropic | Claude 3.5 Sonnet | $3.00 | $15.00 |
| Anthropic | Claude 3 Opus | $15.00 | $75.00 |
| OpenAI | GPT-4 Turbo | $10.00 | $30.00 |
| OpenAI | GPT-3.5 Turbo | $0.50 | $1.50 |

### Routing Decision Tree

```
Request arrives
    ↓
Evaluate strategy/conditions
    ↓
  ┌─────────────┬─────────────┬─────────────┐
  │             │             │             │
Cost         Speed        Quality      Custom
  ↓             ↓             ↓             ↓
Groq 8B      Groq 70B    Claude Opus   Evaluate
(short)                               expressions
  ↓
Groq 70B
(medium)
  ↓
Claude Sonnet
(long)
```

### Related Tasks
- Task 2.2: Anthropic Claude (routing target)
- Task 2.3: OpenAI Completion (routing target)
- Task 2.4: Groq Integration (routing target)

### Useful Links
- [Anthropic Pricing](https://www.anthropic.com/pricing)
- [OpenAI Pricing](https://openai.com/pricing)
- [Groq Pricing](https://wow.groq.com/groq-cloud-pricing/)

---

**Task Status:** 🔵 Not Started  
**Ready for:** Implementation  
**Last Updated:** 2025-12-20
