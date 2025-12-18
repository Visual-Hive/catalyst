# Catalyst Phase 2: LLM Integration Tasks
## Detailed Task Specifications

**Phase Duration:** ~2 weeks  
**Dependencies:** Phase 1 complete  
**Goal:** Implement LLM provider integrations with streaming support

---

## Overview

Phase 2 implements LLM and AI capabilities:
1. Anthropic Claude integration with streaming
2. OpenAI, Groq, Azure OpenAI providers
3. Embedding generation nodes
4. Streaming infrastructure for SSE responses
5. Prompt template nodes

---

## Task 2.1: Streaming Infrastructure

**Duration:** 0.5 day  
**Confidence Target:** 8/10  
**Dependencies:** Phase 1 complete

### Objective
Build first-class streaming support for LLM responses and workflow outputs.

### Key Design Decisions
- Use async generators throughout
- Never buffer full responses in memory
- Stream partial results as they complete
- Proper SSE formatting with event types
- Support `X-Accel-Buffering: no` header for nginx

### File: `src/core/codegen/python/templates/streaming.py.ts`

```typescript
/**
 * @file streaming.py.ts
 * @description Template for streaming utilities
 */

export const STREAMING_UTILS_TEMPLATE = `"""
Streaming utilities for Server-Sent Events (SSE).

Design:
- Use orjson for fast JSON serialization
- Support multiple event types
- Proper SSE formatting
- Headers for nginx buffering bypass
"""

import orjson
from typing import Any, AsyncGenerator
from fastapi import Response
from fastapi.responses import StreamingResponse


def format_sse(event: str, data: Any) -> bytes:
    """
    Format Server-Sent Event with orjson for maximum speed.
    
    Args:
        event: Event type (e.g., "token", "partial", "done")
        data: Data to serialize as JSON
        
    Returns:
        Encoded SSE bytes
    """
    json_data = orjson.dumps(data).decode()
    return f"event: {event}\\ndata: {json_data}\\n\\n".encode()


def streaming_response(
    generator: AsyncGenerator[bytes, None],
    media_type: str = "text/event-stream"
) -> StreamingResponse:
    """
    Create StreamingResponse with proper headers.
    
    Headers:
    - Cache-Control: no-cache (prevent caching)
    - X-Accel-Buffering: no (bypass nginx buffering)
    - Connection: keep-alive
    """
    return StreamingResponse(
        generator,
        media_type=media_type,
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
            "Connection": "keep-alive",
        },
    )


async def stream_tokens(
    token_generator: AsyncGenerator[str, None],
    include_done: bool = True,
) -> AsyncGenerator[bytes, None]:
    """
    Stream LLM tokens as SSE events.
    
    Events emitted:
    - "token": Each token as it arrives
    - "done": Final event with full text
    
    Usage:
        async def generate():
            async for token in claude.stream(...):
                yield token
        
        return streaming_response(
            stream_tokens(generate())
        )
    """
    full_text = []
    
    async for token in token_generator:
        full_text.append(token)
        yield format_sse("token", {"text": token})
    
    if include_done:
        yield format_sse("done", {
            "text": "".join(full_text),
            "token_count": len(full_text),
        })


async def stream_partial_results(
    result_generators: list,
    merge_results: bool = True,
) -> AsyncGenerator[bytes, None]:
    """
    Stream partial results from parallel operations.
    
    Uses asyncio.as_completed() to emit results as they finish,
    not waiting for all to complete.
    
    Events emitted:
    - "partial": Each result as it completes
    - "done": All results merged (if merge_results=True)
    """
    import asyncio
    
    results = []
    
    for coro in asyncio.as_completed(result_generators):
        result = await coro
        results.append(result)
        yield format_sse("partial", result)
    
    if merge_results:
        yield format_sse("done", {"results": results})
`;
```

### Success Criteria
- [ ] format_sse() uses orjson for speed
- [ ] StreamingResponse has proper headers
- [ ] X-Accel-Buffering: no for nginx
- [ ] stream_tokens() handles LLM output
- [ ] stream_partial_results() for parallel ops

---

## Task 2.2: Anthropic Claude Node

**Duration:** 1.5 days  
**Confidence Target:** 8/10  
**Dependencies:** Task 2.1

### Objective
Implement the anthropicCompletion node with streaming support.

### File: `src/core/codegen/python/nodes/llm/anthropic.py.ts`

```typescript
/**
 * @file anthropic.py.ts
 * @description Template for Anthropic Claude node
 */

export const ANTHROPIC_NODE_TEMPLATE = `"""
Anthropic Claude completion node.

Features:
- Streaming support (token by token)
- Uses dedicated connection pool
- Prompt caching support
- All Claude models supported
"""

import anthropic
from typing import Any, Dict, Optional, AsyncGenerator
from runtime.context import ExecutionContext


async def execute_anthropic_completion(
    ctx: ExecutionContext,
    config: Dict[str, Any],
) -> Dict[str, Any]:
    """
    Execute Anthropic Claude completion.
    
    Config:
        model: Claude model (claude-3-opus-20240229, etc.)
        system: System prompt
        messages: List of messages
        max_tokens: Maximum tokens to generate
        temperature: Sampling temperature (0-1)
        stream: Whether to stream response
    
    Returns:
        {
            "content": str,
            "model": str,
            "usage": {"input_tokens": int, "output_tokens": int},
            "stop_reason": str,
        }
    """
    # Use dedicated Anthropic pool for longer timeouts
    client = anthropic.AsyncAnthropic(
        api_key=ctx.secrets["ANTHROPIC_API_KEY"],
        http_client=ctx.anthropic,
    )
    
    # Build message request
    request_params = {
        "model": config.get("model", "claude-3-sonnet-20240229"),
        "max_tokens": config.get("max_tokens", 4096),
        "messages": config["messages"],
    }
    
    # Optional parameters
    if config.get("system"):
        request_params["system"] = config["system"]
    
    if config.get("temperature") is not None:
        request_params["temperature"] = config["temperature"]
    
    # Execute completion
    response = await client.messages.create(**request_params)
    
    return {
        "content": response.content[0].text,
        "model": response.model,
        "usage": {
            "input_tokens": response.usage.input_tokens,
            "output_tokens": response.usage.output_tokens,
        },
        "stop_reason": response.stop_reason,
    }


async def stream_anthropic_completion(
    ctx: ExecutionContext,
    config: Dict[str, Any],
) -> AsyncGenerator[str, None]:
    """
    Stream Anthropic Claude completion token by token.
    
    Yields:
        Each token as a string
    """
    client = anthropic.AsyncAnthropic(
        api_key=ctx.secrets["ANTHROPIC_API_KEY"],
        http_client=ctx.anthropic,
    )
    
    request_params = {
        "model": config.get("model", "claude-3-sonnet-20240229"),
        "max_tokens": config.get("max_tokens", 4096),
        "messages": config["messages"],
    }
    
    if config.get("system"):
        request_params["system"] = config["system"]
    
    if config.get("temperature") is not None:
        request_params["temperature"] = config["temperature"]
    
    async with client.messages.stream(**request_params) as stream:
        async for text in stream.text_stream:
            yield text
`;
```

### Node Configuration Schema

```typescript
export const ANTHROPIC_CONFIG_SCHEMA = {
  type: 'object',
  required: ['messages'],
  properties: {
    model: {
      type: 'string',
      enum: [
        'claude-3-opus-20240229',
        'claude-3-sonnet-20240229',
        'claude-3-haiku-20240307',
        'claude-3-5-sonnet-20241022',
      ],
      default: 'claude-3-sonnet-20240229',
      description: 'Claude model to use',
    },
    system: {
      type: 'string',
      description: 'System prompt',
    },
    messages: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          role: { type: 'string', enum: ['user', 'assistant'] },
          content: { type: 'string' },
        },
      },
      description: 'Conversation messages',
    },
    max_tokens: {
      type: 'number',
      default: 4096,
      description: 'Maximum tokens to generate',
    },
    temperature: {
      type: 'number',
      minimum: 0,
      maximum: 1,
      description: 'Sampling temperature',
    },
    stream: {
      type: 'boolean',
      default: false,
      description: 'Enable streaming response',
    },
  },
};
```

### Success Criteria
- [ ] Non-streaming completion works
- [ ] Streaming yields tokens correctly
- [ ] Uses dedicated connection pool
- [ ] All Claude models supported
- [ ] Error handling for API failures

---

## Task 2.3: OpenAI Node

**Duration:** 1 day  
**Confidence Target:** 8/10  
**Dependencies:** Task 2.1

### Objective
Implement OpenAI completion node with streaming.

### File: `src/core/codegen/python/nodes/llm/openai.py.ts`

```typescript
/**
 * @file openai.py.ts
 * @description Template for OpenAI completion node
 */

export const OPENAI_NODE_TEMPLATE = `"""
OpenAI completion node.

Features:
- Streaming support
- All GPT models supported
- Function calling support
- JSON mode support
"""

from openai import AsyncOpenAI
from typing import Any, Dict, AsyncGenerator
from runtime.context import ExecutionContext


async def execute_openai_completion(
    ctx: ExecutionContext,
    config: Dict[str, Any],
) -> Dict[str, Any]:
    """
    Execute OpenAI completion.
    """
    client = AsyncOpenAI(
        api_key=ctx.secrets["OPENAI_API_KEY"],
        http_client=ctx.http,
    )
    
    request_params = {
        "model": config.get("model", "gpt-4-turbo-preview"),
        "messages": config["messages"],
        "max_tokens": config.get("max_tokens", 4096),
    }
    
    if config.get("temperature") is not None:
        request_params["temperature"] = config["temperature"]
    
    if config.get("response_format"):
        request_params["response_format"] = config["response_format"]
    
    response = await client.chat.completions.create(**request_params)
    
    return {
        "content": response.choices[0].message.content,
        "model": response.model,
        "usage": {
            "prompt_tokens": response.usage.prompt_tokens,
            "completion_tokens": response.usage.completion_tokens,
            "total_tokens": response.usage.total_tokens,
        },
        "finish_reason": response.choices[0].finish_reason,
    }


async def stream_openai_completion(
    ctx: ExecutionContext,
    config: Dict[str, Any],
) -> AsyncGenerator[str, None]:
    """
    Stream OpenAI completion token by token.
    """
    client = AsyncOpenAI(
        api_key=ctx.secrets["OPENAI_API_KEY"],
        http_client=ctx.http,
    )
    
    request_params = {
        "model": config.get("model", "gpt-4-turbo-preview"),
        "messages": config["messages"],
        "max_tokens": config.get("max_tokens", 4096),
        "stream": True,
    }
    
    if config.get("temperature") is not None:
        request_params["temperature"] = config["temperature"]
    
    async for chunk in await client.chat.completions.create(**request_params):
        if chunk.choices[0].delta.content:
            yield chunk.choices[0].delta.content
`;
```

### Success Criteria
- [ ] Non-streaming completion works
- [ ] Streaming yields tokens correctly
- [ ] GPT-4 and GPT-3.5 models supported
- [ ] JSON mode works
- [ ] Function calling works

---

## Task 2.4: Groq Node

**Duration:** 0.5 day  
**Confidence Target:** 9/10  
**Dependencies:** Task 2.1

### Objective
Implement Groq LLM node for fast inference.

### File: `src/core/codegen/python/nodes/llm/groq.py.ts`

```typescript
/**
 * @file groq.py.ts
 * @description Template for Groq completion node
 */

export const GROQ_NODE_TEMPLATE = `"""
Groq completion node.

Features:
- Extremely fast inference
- Llama, Mixtral models
- Compatible with OpenAI API
"""

from groq import AsyncGroq
from typing import Any, Dict, AsyncGenerator
from runtime.context import ExecutionContext


async def execute_groq_completion(
    ctx: ExecutionContext,
    config: Dict[str, Any],
) -> Dict[str, Any]:
    """
    Execute Groq completion.
    """
    client = AsyncGroq(
        api_key=ctx.secrets["GROQ_API_KEY"],
    )
    
    response = await client.chat.completions.create(
        model=config.get("model", "llama-3.1-70b-versatile"),
        messages=config["messages"],
        max_tokens=config.get("max_tokens", 4096),
        temperature=config.get("temperature", 0.7),
    )
    
    return {
        "content": response.choices[0].message.content,
        "model": response.model,
        "usage": {
            "prompt_tokens": response.usage.prompt_tokens,
            "completion_tokens": response.usage.completion_tokens,
        },
    }


async def stream_groq_completion(
    ctx: ExecutionContext,
    config: Dict[str, Any],
) -> AsyncGenerator[str, None]:
    """
    Stream Groq completion.
    """
    client = AsyncGroq(
        api_key=ctx.secrets["GROQ_API_KEY"],
    )
    
    stream = await client.chat.completions.create(
        model=config.get("model", "llama-3.1-70b-versatile"),
        messages=config["messages"],
        max_tokens=config.get("max_tokens", 4096),
        stream=True,
    )
    
    async for chunk in stream:
        if chunk.choices[0].delta.content:
            yield chunk.choices[0].delta.content
`;
```

### Success Criteria
- [ ] Llama and Mixtral models work
- [ ] Streaming works
- [ ] Fast inference times

---

## Task 2.5: Embedding Generation Node

**Duration:** 1 day  
**Confidence Target:** 8/10  
**Dependencies:** Phase 1 complete

### Objective
Implement embedding generation for vector search.

### File: `src/core/codegen/python/nodes/llm/embeddings.py.ts`

```typescript
/**
 * @file embeddings.py.ts
 * @description Template for embedding generation node
 */

export const EMBEDDING_NODE_TEMPLATE = `"""
Embedding generation node.

Features:
- OpenAI embeddings
- Voyage AI embeddings
- Batch processing
- Caching support
"""

from openai import AsyncOpenAI
from typing import Any, Dict, List
from runtime.context import ExecutionContext


async def execute_embedding_generate(
    ctx: ExecutionContext,
    config: Dict[str, Any],
) -> Dict[str, Any]:
    """
    Generate embeddings for text input.
    
    Config:
        provider: "openai" | "voyage"
        model: Embedding model name
        input: Single text or list of texts
    
    Returns:
        {
            "embeddings": List[List[float]],
            "model": str,
            "usage": {"total_tokens": int},
        }
    """
    provider = config.get("provider", "openai")
    
    if provider == "openai":
        return await _openai_embeddings(ctx, config)
    elif provider == "voyage":
        return await _voyage_embeddings(ctx, config)
    else:
        raise ValueError(f"Unknown embedding provider: {provider}")


async def _openai_embeddings(
    ctx: ExecutionContext,
    config: Dict[str, Any],
) -> Dict[str, Any]:
    """Generate OpenAI embeddings."""
    client = AsyncOpenAI(
        api_key=ctx.secrets["OPENAI_API_KEY"],
        http_client=ctx.http,
    )
    
    # Ensure input is a list
    input_text = config["input"]
    if isinstance(input_text, str):
        input_text = [input_text]
    
    response = await client.embeddings.create(
        model=config.get("model", "text-embedding-3-small"),
        input=input_text,
    )
    
    return {
        "embeddings": [item.embedding for item in response.data],
        "model": response.model,
        "usage": {"total_tokens": response.usage.total_tokens},
    }


async def _voyage_embeddings(
    ctx: ExecutionContext,
    config: Dict[str, Any],
) -> Dict[str, Any]:
    """Generate Voyage AI embeddings."""
    # Voyage uses httpx directly
    input_text = config["input"]
    if isinstance(input_text, str):
        input_text = [input_text]
    
    response = await ctx.http.post(
        "https://api.voyageai.com/v1/embeddings",
        headers={
            "Authorization": f"Bearer {ctx.secrets['VOYAGE_API_KEY']}",
            "Content-Type": "application/json",
        },
        json={
            "model": config.get("model", "voyage-2"),
            "input": input_text,
        },
    )
    response.raise_for_status()
    data = response.json()
    
    return {
        "embeddings": [item["embedding"] for item in data["data"]],
        "model": data["model"],
        "usage": {"total_tokens": data["usage"]["total_tokens"]},
    }
`;
```

### Success Criteria
- [ ] OpenAI embeddings work
- [ ] Voyage AI embeddings work
- [ ] Batch processing works
- [ ] Returns proper format for Qdrant

---

## Task 2.6: Prompt Template Node

**Duration:** 0.5 day  
**Confidence Target:** 9/10  
**Dependencies:** Task 1.6 (ExpressionCompiler)

### Objective
Implement prompt template node for building dynamic prompts.

### File: `src/core/codegen/python/nodes/llm/prompt.py.ts`

```typescript
/**
 * @file prompt.py.ts
 * @description Template for prompt template node
 */

export const PROMPT_TEMPLATE_NODE = `"""
Prompt template node.

Features:
- Expression interpolation
- Multi-message support
- System/user/assistant roles
"""

from typing import Any, Dict, List
from runtime.context import ExecutionContext


async def execute_prompt_template(
    ctx: ExecutionContext,
    config: Dict[str, Any],
) -> Dict[str, Any]:
    """
    Build prompt from template.
    
    Config:
        system: Optional system message template
        messages: List of {role, content} templates
        variables: Additional variables for interpolation
    
    Returns:
        {
            "system": str (optional),
            "messages": List[{role: str, content: str}],
        }
    """
    result = {}
    
    # Process system message
    if config.get("system"):
        result["system"] = _interpolate(config["system"], ctx, config.get("variables", {}))
    
    # Process messages
    messages = []
    for msg in config.get("messages", []):
        messages.append({
            "role": msg["role"],
            "content": _interpolate(msg["content"], ctx, config.get("variables", {})),
        })
    result["messages"] = messages
    
    return result


def _interpolate(template: str, ctx: ExecutionContext, variables: Dict[str, Any]) -> str:
    """
    Interpolate template with context values.
    
    Note: At generation time, {{ expressions }} are compiled to Python f-strings.
    This function handles any remaining runtime interpolation.
    """
    # Most interpolation is done at code generation time
    # This handles runtime-only cases
    return template.format(**variables) if variables else template
`;
```

### Success Criteria
- [ ] System message interpolation works
- [ ] Multi-message templates work
- [ ] Variables can be passed in
- [ ] Outputs format for LLM nodes

---

## Task 2.7: LLM Router Node

**Duration:** 0.5 day  
**Confidence Target:** 8/10  
**Dependencies:** Tasks 2.2-2.4

### Objective
Route to different LLM providers based on conditions.

### File: `src/core/codegen/python/nodes/llm/router.py.ts`

```typescript
/**
 * @file router.py.ts
 * @description Template for LLM router node
 */

export const LLM_ROUTER_NODE = `"""
LLM Router node.

Features:
- Route to provider based on conditions
- Fallback support
- Cost optimization routing
"""

from typing import Any, Dict, Callable
from runtime.context import ExecutionContext


async def execute_llm_router(
    ctx: ExecutionContext,
    config: Dict[str, Any],
) -> Dict[str, Any]:
    """
    Route to appropriate LLM provider.
    
    Config:
        routes: List of {condition, provider, model}
        default: Default provider if no conditions match
        input: The messages to send
    
    Returns:
        Same as underlying LLM node
    """
    from nodes.llm import (
        execute_anthropic_completion,
        execute_openai_completion,
        execute_groq_completion,
    )
    
    PROVIDERS = {
        "anthropic": execute_anthropic_completion,
        "openai": execute_openai_completion,
        "groq": execute_groq_completion,
    }
    
    # Evaluate routes
    for route in config.get("routes", []):
        if _evaluate_condition(route["condition"], ctx):
            provider = route["provider"]
            model = route.get("model")
            break
    else:
        # Use default
        provider = config.get("default", "anthropic")
        model = None
    
    # Build provider config
    provider_config = {
        "messages": config["messages"],
        "max_tokens": config.get("max_tokens", 4096),
    }
    if model:
        provider_config["model"] = model
    
    # Execute
    executor = PROVIDERS.get(provider)
    if not executor:
        raise ValueError(f"Unknown provider: {provider}")
    
    return await executor(ctx, provider_config)


def _evaluate_condition(condition: str, ctx: ExecutionContext) -> bool:
    """
    Evaluate routing condition.
    
    Conditions:
    - "always": Always true
    - "input.length > 1000": Check input length
    - "env.USE_FAST == 'true'": Check environment
    """
    if condition == "always":
        return True
    
    # Compiled conditions are Python expressions
    # (safe because compiled at generation time)
    return False  # Placeholder
`;
```

### Success Criteria
- [ ] Routes to correct provider
- [ ] Fallback works
- [ ] Condition evaluation works
- [ ] Cost optimization routing

---

## Phase 2 Deliverables Summary

| Task | Deliverable | Duration | Confidence |
|------|-------------|----------|------------|
| 2.1 | Streaming Infrastructure | 0.5d | 8/10 |
| 2.2 | Anthropic Claude Node | 1.5d | 8/10 |
| 2.3 | OpenAI Node | 1d | 8/10 |
| 2.4 | Groq Node | 0.5d | 9/10 |
| 2.5 | Embedding Generation | 1d | 8/10 |
| 2.6 | Prompt Template | 0.5d | 9/10 |
| 2.7 | LLM Router | 0.5d | 8/10 |

**Total Phase 2 Duration:** ~5.5 days

---

## Human Review Checkpoints

**After Task 2.1:**
- Streaming infrastructure works
- SSE format correct

**After Task 2.2:**
- Claude streaming verified in browser
- First token latency <300ms

**End of Phase 2:**
- All LLM providers functional
- Streaming works end-to-end

---

## Performance Validation Checklist

Before completing Phase 2, verify:

- [ ] Streaming endpoints have `X-Accel-Buffering: no` header
- [ ] LLM calls use dedicated connection pool
- [ ] First token latency <300ms for streaming
- [ ] format_sse() uses orjson
- [ ] Token streaming doesn't buffer full response
- [ ] Embedding generation batches efficiently

---

**Previous Phase:** [CATALYST_PHASE_1_TASKS.md](./CATALYST_PHASE_1_TASKS.md)  
**Next Phase:** [CATALYST_PHASE_3_TASKS.md](./CATALYST_PHASE_3_TASKS.md)
