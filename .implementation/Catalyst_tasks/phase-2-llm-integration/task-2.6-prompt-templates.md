# Task 2.6: Prompt Templates

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
Implement the `promptTemplate` node for building dynamic prompts with variable interpolation, multi-message support, and system/user/assistant role handling.

Prompt engineering is critical for LLM success. This node allows users to build reusable prompt templates with dynamic variables, making it easy to construct complex prompts without hardcoding values. The templates will use Catalyst's expression system for variable interpolation and support multi-turn conversations.

### Success Criteria
- [ ] Variable interpolation works (`{{variable}}` syntax)
- [ ] Multi-message templates supported
- [ ] System/user/assistant roles work correctly
- [ ] Expression system integration complete
- [ ] Output format compatible with all LLM nodes
- [ ] Template validation and error handling
- [ ] Test coverage >90%
- [ ] Human review completed

### References
- CATALYST_PHASE_2_TASKS.md - Task 2.6: Prompt Template Node
- Task 1.6: Expression Compiler (Phase 1 dependency)
- CATALYST_SPECIFICATION.md - Expression System

### Dependencies
- Phase 1: Expression Compiler (completed)
- Phase 0: Node type system (completed)

---

## Milestones

### Milestone 1: Design Template System
**Date:** [YYYY-MM-DD]  
**Confidence:** [X/10]  
**Status:** 🔵 Not Started  
**Time Spent:** [X hours]  

#### Activities
- [ ] Design template syntax
- [ ] Plan expression integration
- [ ] Design multi-message structure
- [ ] Plan validation strategy

#### Design Decisions

| Decision | Options Considered | Choice Made | Rationale | Confidence |
|----------|-------------------|-------------|-----------|------------|
| Syntax | {{var}}, ${var}, {var} | {{variable}} | Consistent with Handlebars, clear | 9/10 |
| Expression integration | Compile-time, Runtime | Compile-time (Phase 1 compiler) | More efficient, validated early | 9/10 |
| Message structure | Flat, Nested | Array of {role, content} objects | Standard LLM format | 9/10 |
| Validation | Runtime only, Compile-time | Both (template syntax + runtime values) | Catch errors early when possible | 8/10 |

#### Template Features

| Feature | Description | Priority |
|---------|-------------|----------|
| Variable interpolation | `{{user.name}}` → "John" | High |
| Expressions | `{{user.age * 2}}` → "42" | High |
| Conditionals | `{{if user.premium}}...{{/if}}` | Medium (Phase 3) |
| Loops | `{{for item in items}}...{{/for}}` | Medium (Phase 3) |
| Filters | `{{text \| uppercase}}` | Low (Phase 3) |

#### Notes
- **Phase 2 Scope**: Focus on simple variable interpolation and expressions
- **Phase 3 Extensions**: Add conditionals, loops, filters for advanced prompting
- **Security**: All expressions run through Phase 1 security sandbox
- **Use Cases**: RAG prompts, multi-turn conversations, dynamic system prompts

---

### Milestone 2: Implement Node Metadata
**Date:** [YYYY-MM-DD]  
**Confidence:** [X/10]  
**Status:** 🔵 Not Started  
**Time Spent:** [X hours]  

#### Files Created/Modified
- `src/core/workflow/nodes/configs/llm.ts` - Add prompt template metadata
- `src/core/workflow/types.ts` - Ensure `promptTemplate` in NodeType

#### Node Metadata

```typescript
{
  type: 'promptTemplate',
  category: 'llm',
  name: 'Prompt Template',
  description: 'Build prompts with variable interpolation',
  icon: 'FileText',
  color: 'bg-purple-500',
  inputs: [
    { id: 'input', name: 'Variables', type: 'default' }
  ],
  outputs: [
    { id: 'output', name: 'Prompt', type: 'default' }
  ],
  defaultConfig: {
    system: '',
    messages: [
      { role: 'user', content: '' }
    ],
    variables: {}
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
- `src/core/codegen/python/nodes/llm/prompt.py.ts` - Python template
- `src/core/codegen/python/NodeCodeGenerator.ts` - Add prompt template case

#### Implementation Notes

**Core Functions:**

1. **execute_prompt_template(ctx, config) -> Dict**
   - Main template processing function
   - Interpolates variables using context
   - Returns formatted messages for LLM nodes

2. **_interpolate(template, ctx, variables) -> str**
   - Core interpolation logic
   - Handles both context values and passed variables
   - Expressions compiled at code generation time

**Configuration Mapping:**
- `system` - Optional system message template
- `messages` - Array of {role, content} message templates
- `variables` - Additional variables for interpolation

**Template Processing:**
```python
# Example template
system: "You are a helpful assistant for {{company.name}}"
messages: [
    {
        "role": "user",
        "content": "Hello, my name is {{user.name}} and I'm {{user.age}} years old"
    }
]

# With context:
{
    "company": {"name": "Acme Corp"},
    "user": {"name": "John", "age": 30}
}

# Output:
{
    "system": "You are a helpful assistant for Acme Corp",
    "messages": [
        {
            "role": "user",
            "content": "Hello, my name is John and I'm 30 years old"
        }
    ]
}
```

**Code Generation Strategy:**
- **Compile-time**: Phase 1 expression compiler processes `{{expr}}` into Python f-strings
- **Runtime**: Minimal processing, just format string substitution
- **Security**: All expressions validated and sandboxed during compilation

**Error Handling:**
- Missing variable → Clear error with variable name
- Invalid expression → Caught during code generation (compile-time)
- Type errors → Runtime error with context
- Empty template → Warning but allowed

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
- [ ] Generate workflow with prompt template
- [ ] Test simple variable interpolation
- [ ] Test nested variable access (obj.property)
- [ ] Test expression evaluation
- [ ] Test multi-message templates
- [ ] Connect to Claude node and verify output

**Manual Testing:**

| Test Scenario | Expected | Actual | Pass/Fail | Notes |
|---------------|----------|--------|-----------|-------|
| Simple variable | {{name}} → "John" | [To test] | - | - |
| Nested property | {{user.name}} → "John" | [To test] | - | - |
| Expression | {{age * 2}} → "60" | [To test] | - | - |
| System message | Interpolates correctly | [To test] | - | - |
| Multi-message | Array of messages | [To test] | - | - |
| Missing variable | Clear error | [To test] | - | - |
| Connect to LLM | Prompt works in Claude | [To test] | - | - |

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
- [ ] Prompt template system approved
- [ ] Expression integration works
- [ ] Output format validated
- [ ] Ready for production use

**Final Confidence:** [X/10]

---

## Final Summary

### Deliverables
- [ ] Prompt template node metadata in registry
- [ ] `execute_prompt_template()` function
- [ ] Variable interpolation with {{}} syntax
- [ ] Expression system integration
- [ ] Multi-message support
- [ ] System/user/assistant roles
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
- **Conditionals**: Not implemented (defer to Phase 3)
- **Loops**: Not implemented (defer to Phase 3)
- **Filters**: Not implemented (defer to Phase 3)

### Future Improvements
- Add conditional blocks (`{{if}}...{{/if}}`)
- Add loop blocks (`{{for}}...{{/for}}`)
- Add filters (`{{text | uppercase}}`)
- Template library/snippets
- AI-powered template suggestions

### Next Steps
- [ ] Proceed to Task 2.7: LLM Router
- [ ] Create example prompt templates
- [ ] Document best practices

---

## Appendix

### Key Files
- `src/core/workflow/nodes/configs/llm.ts` - Node metadata
- `src/core/codegen/python/nodes/llm/prompt.py.ts` - Python template

### Example Usage
```python
# Simple interpolation
result = await execute_prompt_template(ctx, {
    "system": "You are {{assistant_name}}",
    "messages": [
        {
            "role": "user",
            "content": "My name is {{user.name}}"
        }
    ],
    "variables": {
        "assistant_name": "Helper Bot",
        "user": {"name": "Alice"}
    }
})
# Output: {"system": "You are Helper Bot", "messages": [...]}

# RAG template
result = await execute_prompt_template(ctx, {
    "system": "Answer using the following context:\n{{context}}",
    "messages": [
        {
            "role": "user",
            "content": "{{query}}"
        }
    ],
    "variables": {
        "context": documents_text,
        "query": user_question
    }
})

# Multi-turn conversation
result = await execute_prompt_template(ctx, {
    "messages": [
        {
            "role": "system",
            "content": "You are {{bot_personality}}"
        },
        {
            "role": "user",
            "content": "{{history[0].message}}"
        },
        {
            "role": "assistant",
            "content": "{{history[0].response}}"
        },
        {
            "role": "user",
            "content": "{{current_message}}"
        }
    ]
})
```

### Template Syntax Reference

```
Variable: {{variable}}
Nested: {{object.property}}
Array: {{array[0]}}
Expression: {{value * 2}}
String: {{f"Hello {name}"}}
```

### Common Patterns

**RAG Prompt:**
```
System: "Answer the question using only the provided context.

Context:
{{documents}}

If the answer is not in the context, say 'I don't know'."

User: "{{user_question}}"
```

**Few-Shot Learning:**
```
System: "You are a sentiment classifier."

Messages: [
    {role: "user", content: "I love this!"},
    {role: "assistant", content: "positive"},
    {role: "user", content: "This is terrible"},
    {role: "assistant", content: "negative"},
    {role: "user", content: "{{text_to_classify}}"}
]
```

### Related Tasks
- Task 1.6: Expression Compiler (dependency)
- Task 2.2: Anthropic Claude (consumes templates)
- Task 2.3: OpenAI Completion (consumes templates)

### Useful Links
- https://platform.openai.com/docs/guides/prompt-engineering
- https://docs.anthropic.com/claude/docs/prompt-engineering

---

**Task Status:** 🔵 Not Started  
**Ready for:** Implementation  
**Last Updated:** 2025-12-20
