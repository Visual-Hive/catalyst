# Task 2.3: OpenAI Completion Integration

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
Implement the `openaiCompletion` node with streaming support for GPT-4, GPT-4 Turbo, and GPT-3.5 models, including function calling and JSON mode.

This task adds OpenAI's GPT models to Catalyst. GPT-4 Turbo offers excellent performance with 128K context, and GPT-3.5 provides a cost-effective option for simpler tasks. We'll support advanced features like function calling (for agentic workflows) and JSON mode (for structured outputs).

### Success Criteria
- [ ] Non-streaming completion works
- [ ] Streaming yields tokens in real-time
- [ ] GPT-4, GPT-4 Turbo, and GPT-3.5 models supported
- [ ] Function calling support implemented
- [ ] JSON mode for structured outputs
- [ ] Temperature and max_tokens configurable
- [ ] Proper error handling for API failures
- [ ] Usage tracking (prompt/completion tokens)
- [ ] Test coverage >85%
- [ ] Human review completed

### References
- CATALYST_PHASE_2_TASKS.md - Task 2.3: OpenAI Node
- https://platform.openai.com/docs/api-reference/chat
- https://platform.openai.com/docs/guides/function-calling

### Dependencies
- Task 2.1: Streaming Infrastructure (completed)
- Phase 1: Python code generation (completed)

---

## Milestones

### Milestone 1: Design OpenAI Integration
**Date:** [YYYY-MM-DD]  
**Confidence:** [X/10]  
**Status:** 🔵 Not Started  
**Time Spent:** [X hours]  

#### Activities
- [ ] Study OpenAI API documentation
- [ ] Design node configuration schema
- [ ] Plan function calling implementation
- [ ] Design JSON mode handling

#### Design Decisions

| Decision | Options Considered | Choice Made | Rationale | Confidence |
|----------|-------------------|-------------|-----------|------------|
| API client | httpx directly, openai SDK | openai SDK (AsyncOpenAI) | Official SDK, handles streaming, retries | 9/10 |
| Model default | GPT-4, GPT-4 Turbo, GPT-3.5 | GPT-4 Turbo | Best balance of speed/quality/cost | 8/10 |
| Function calling | Phase 2, Defer to Phase 3 | Phase 2 (basic support) | Core feature, needed for agentic workflows | 7/10 |
| JSON mode | Phase 2, Defer to Phase 3 | Phase 2 | Increasingly common use case | 8/10 |
| Connection pool | Shared, Dedicated | Use shared httpx from context | OpenAI endpoints are fast enough | 8/10 |

#### OpenAI Model Comparison

| Model | Context | Speed | Quality | Cost | Use Case |
|-------|---------|-------|---------|------|----------|
| GPT-4 Turbo | 128K | Fast | Highest | $$ | General purpose, best overall |
| GPT-4 | 8K | Slow | Highest | $$$ | Complex reasoning (legacy) |
| GPT-3.5 Turbo | 16K | Fastest | Good | $ | Simple tasks, high volume |

#### Notes
- **Function Calling**: Essential for tool use, agents, structured outputs
- **JSON Mode**: Uses `response_format: {"type": "json_object"}` parameter
- **Streaming**: Works with function calling (yields deltas)

---

### Milestone 2: Implement Node Metadata
**Date:** [YYYY-MM-DD]  
**Confidence:** [X/10]  
**Status:** 🔵 Not Started  
**Time Spent:** [X hours]  

#### Files Created/Modified
- `src/core/workflow/nodes/configs/llm.ts` - Add OpenAI node metadata
- `src/core/workflow/types.ts` - Ensure `openaiCompletion` in NodeType

#### Node Metadata

```typescript
{
  type: 'openaiCompletion',
  category: 'llm',
  name: 'OpenAI',
  description: 'OpenAI GPT completion with function calling',
  icon: 'Bot',
  color: 'bg-purple-500',
  inputs: [
    { id: 'input', name: 'Input', type: 'default' }
  ],
  outputs: [
    { id: 'output', name: 'Response', type: 'default' },
    { id: 'stream', name: 'Stream', type: 'stream' },
    { id: 'function_call', name: 'Function Call', type: 'conditional' }
  ],
  defaultConfig: {
    model: 'gpt-4-turbo-preview',
    maxTokens: 4096,
    temperature: 0.7,
    responseFormat: 'text',
    functions: []
  },
  configSchema: { /* ... */ },
  supportsStreaming: true
}
```

---

### Milestone 3: Implement Python Code Generation
**Date:** [YYYY-MM-DD]  
**Confidence:** [X/10]  
**Status:** 🔵 Not Started  
**Time Spent:** [X hours]  

#### Files Created/Modified
- `src/core/codegen/python/nodes/llm/openai.py.ts` - Python template for OpenAI
- `src/core/codegen/python/NodeCodeGenerator.ts` - Add OpenAI case

#### Implementation Notes

**Core Functions:**

1. **execute_openai_completion(ctx, config) -> Dict**
   - Non-streaming completion
   - Returns complete response with usage data
   - Handles function calls in response

2. **stream_openai_completion(ctx, config) -> AsyncGenerator[str]**
   - Streaming completion
   - Yields text deltas as they arrive
   - Handles function call deltas

**Configuration Mapping:**
- `messages` - Chat messages array
- `model` - GPT model identifier
- `max_tokens` - Output length limit
- `temperature` - Sampling temperature (0-2 for OpenAI)
- `response_format` - "text" or {"type": "json_object"}
- `functions` - Optional function definitions for calling

**Function Calling:**
```python
# If functions are provided
if config.get("functions"):
    request_params["functions"] = config["functions"]
    
# Response may have function_call
if response.choices[0].message.function_call:
    return {
        "function_call": {
            "name": response.choices[0].message.function_call.name,
            "arguments": response.choices[0].message.function_call.arguments
        }
    }
```

**Error Handling:**
- API key missing/invalid → Clear error message
- Rate limit → Include retry-after info
- Context length exceeded → Token count info
- Invalid JSON mode → Explain JSON mode requirements

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
- [ ] Generate workflow with OpenAI node
- [ ] Test all models (GPT-4, GPT-4 Turbo, GPT-3.5)
- [ ] Test function calling
- [ ] Test JSON mode
- [ ] Test streaming

**Manual Testing:**

| Test Scenario | Expected | Actual | Pass/Fail | Notes |
|---------------|----------|--------|-----------|-------|
| Simple completion | Response with text | [To test] | - | - |
| Streaming mode | Tokens arrive progressively | [To test] | - | - |
| Function calling | Function call returned | [To test] | - | - |
| JSON mode | Valid JSON response | [To test] | - | - |
| Invalid API key | Clear error message | [To test] | - | - |
| All models | GPT-4, Turbo, 3.5 work | [To test] | - | - |

**Performance Benchmarks:**

| Metric | Target | Actual | Notes |
|--------|--------|--------|-------|
| First token latency | <200ms | [To measure] | GPT-4 Turbo is fast |
| Streaming delay | <30ms between tokens | [To measure] | OpenAI is typically fast |
| Function call latency | <500ms | [To measure] | Includes parsing |

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
- [ ] OpenAI integration approved
- [ ] Function calling works
- [ ] JSON mode validated
- [ ] Ready for production use

**Final Confidence:** [X/10]

---

## Final Summary

### Deliverables
- [ ] OpenAI node metadata in registry
- [ ] `execute_openai_completion()` function
- [ ] `stream_openai_completion()` function
- [ ] All GPT models supported
- [ ] Function calling support
- [ ] JSON mode support
- [ ] Comprehensive error handling
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
- **Vision support**: GPT-4 Vision not implemented (defer to Phase 3)
- **Assistants API**: Not using Assistants API (separate from chat completions)

### Future Improvements
- GPT-4 Vision for image understanding
- Assistants API integration
- Fine-tuned model support
- Batch API for high-volume processing

### Next Steps
- [ ] Proceed to Task 2.4: Groq Integration
- [ ] Test OpenAI with real workflows
- [ ] Monitor token usage and costs

---

## Appendix

### Key Files
- `src/core/workflow/nodes/configs/llm.ts` - Node metadata
- `src/core/codegen/python/nodes/llm/openai.py.ts` - Python template

### API Key Configuration
```python
# In ExecutionContext
ctx.secrets["OPENAI_API_KEY"]
```

### Example Usage
```python
# Simple completion
response = await execute_openai_completion(ctx, {
    "model": "gpt-4-turbo-preview",
    "messages": [
        {"role": "user", "content": "Hello!"}
    ]
})

# Function calling
response = await execute_openai_completion(ctx, {
    "model": "gpt-4-turbo-preview",
    "messages": [{"role": "user", "content": "What's the weather?"}],
    "functions": [{
        "name": "get_weather",
        "description": "Get weather for a location",
        "parameters": {
            "type": "object",
            "properties": {
                "location": {"type": "string"}
            }
        }
    }]
})

# JSON mode
response = await execute_openai_completion(ctx, {
    "model": "gpt-4-turbo-preview",
    "messages": [{"role": "user", "content": "Return user data as JSON"}],
    "response_format": {"type": "json_object"}
})
```

### Related Tasks
- Task 2.1: Streaming Infrastructure (dependency)
- Task 2.2: Anthropic Claude (similar pattern)
- Task 2.7: LLM Router (uses this node)

### Useful Links
- https://platform.openai.com/docs/guides/text-generation
- https://github.com/openai/openai-python

---

**Task Status:** 🔵 Not Started  
**Ready for:** Implementation  
**Last Updated:** 2025-12-20
