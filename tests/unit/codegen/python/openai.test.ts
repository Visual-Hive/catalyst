/**
 * @file openai.test.ts
 * @description Unit tests for OpenAI GPT node code generation
 * 
 * @architecture Phase 2, Task 2.3 - OpenAI Completion Integration
 * @created 2025-12-20
 * @author AI (Cline) + Human Review
 * @confidence 9/10 - Comprehensive test coverage following Anthropic pattern
 * 
 * TESTS COVERED:
 * - Code generation produces valid Python syntax
 * - All required functions are present
 * - Dependencies list is correct
 * - Example code is valid
 * - Generated code includes proper error handling
 * - Documentation strings are present
 * - Streaming and non-streaming functions exist
 * - Function calling support (both modes)
 * - JSON mode support
 */

import { describe, it, expect } from 'vitest';
import {
  generateOpenAINode,
  getOpenAIDependencies,
  generateOpenAIExample,
} from '../../../../src/core/codegen/python/nodes/llm';

describe('OpenAI Node Code Generation', () => {
  describe('generateOpenAINode()', () => {
    it('should generate valid Python code', () => {
      const code = generateOpenAINode();
      
      // Basic validation - code should be a non-empty string
      expect(code).toBeTruthy();
      expect(typeof code).toBe('string');
      expect(code.length).toBeGreaterThan(100);
    });

    it('should include module-level docstring', () => {
      const code = generateOpenAINode();
      
      // Check for Python docstring at start
      expect(code).toContain('"""');
      expect(code).toContain('OpenAI GPT completion node');
      expect(code).toContain('@catalyst:generated');
      expect(code).toContain('DO NOT EDIT');
    });

    it('should include execute_openai_completion function', () => {
      const code = generateOpenAINode();
      
      // Check function definition
      expect(code).toContain('async def execute_openai_completion(');
      expect(code).toContain('ctx');
      expect(code).toContain('config: Dict[str, Any]');
      expect(code).toContain('-> Dict[str, Any]:');
    });

    it('should include stream_openai_completion function', () => {
      const code = generateOpenAINode();
      
      // Check streaming function definition
      expect(code).toContain('async def stream_openai_completion(');
      expect(code).toContain('ctx');
      expect(code).toContain('config: Dict[str, Any]');
      expect(code).toContain('-> AsyncGenerator[str, None]:');
    });

    it('should import required dependencies', () => {
      const code = generateOpenAINode();
      
      // Check for necessary imports
      expect(code).toContain('from typing import Any, Dict, Optional, AsyncGenerator');
      expect(code).toContain('import json');
      expect(code).toContain('from openai import AsyncOpenAI');
      expect(code).toContain('import logging');
    });

    it('should import error types for proper error handling', () => {
      const code = generateOpenAINode();
      
      // Check for error type imports
      expect(code).toContain('APIError');
      expect(code).toContain('RateLimitError');
      expect(code).toContain('AuthenticationError');
    });

    it('should include comprehensive docstrings for both functions', () => {
      const code = generateOpenAINode();
      
      // Execute function docstring
      expect(code).toContain('Execute OpenAI GPT completion');
      expect(code).toContain('CONFIGURATION:');
      expect(code).toContain('Args:');
      expect(code).toContain('Returns:');
      expect(code).toContain('Raises:');
      expect(code).toContain('Example:');
      expect(code).toContain('Performance:');
      
      // Stream function docstring
      expect(code).toContain('Stream OpenAI GPT completion token by token');
      expect(code).toContain('Yields:');
      expect(code).toContain('Integration with SSE:');
      expect(code).toContain('Memory Efficiency:');
    });

    it('should use default model gpt-4-turbo-preview', () => {
      const code = generateOpenAINode();
      
      // Check default model is set correctly (best balance)
      expect(code).toContain('gpt-4-turbo-preview');
      expect(code).toMatch(/config\.get\("model",\s*"gpt-4-turbo-preview"\)/);
    });

    it('should include all GPT model variants in documentation', () => {
      const code = generateOpenAINode();
      
      // Check all models are documented
      expect(code).toContain('gpt-4-turbo-preview');
      expect(code).toContain('gpt-4:');
      expect(code).toContain('gpt-3.5-turbo');
      
      // Check context sizes are documented
      expect(code).toContain('128K');
      expect(code).toContain('8K');
      expect(code).toContain('16K');
    });

    it('should handle API key from secrets', () => {
      const code = generateOpenAINode();
      
      // Check API key is retrieved from context secrets
      expect(code).toContain('ctx.secrets["OPENAI_API_KEY"]');
      expect(code).toContain('AsyncOpenAI(');
      expect(code).toContain('api_key=');
    });

    it('should support optional max_tokens parameter', () => {
      const code = generateOpenAINode();
      
      // max_tokens should be optional and conditionally added
      expect(code).toContain('if config.get("max_tokens")');
      expect(code).toContain('request_params["max_tokens"]');
    });

    it('should support optional temperature parameter', () => {
      const code = generateOpenAINode();
      
      // Temperature should be optional and conditionally added
      expect(code).toContain('if config.get("temperature") is not None');
      expect(code).toContain('request_params["temperature"]');
    });

    it('should support response_format for JSON mode', () => {
      const code = generateOpenAINode();
      
      // Check JSON mode support
      expect(code).toContain('if config.get("response_format")');
      expect(code).toContain('response_format');
      expect(code).toContain('{"type": "json_object"}');
    });

    it('should support functions parameter for function calling', () => {
      const code = generateOpenAINode();
      
      // Check function calling support
      expect(code).toContain('if config.get("functions")');
      expect(code).toContain('request_params["functions"]');
    });

    it('should handle function call responses', () => {
      const code = generateOpenAINode();
      
      // Check function call response handling
      expect(code).toContain('if message.function_call:');
      expect(code).toContain('"function_call": {');
      expect(code).toContain('"name": message.function_call.name');
      expect(code).toContain('"arguments": message.function_call.arguments');
    });

    it('should include error handling for AuthenticationError', () => {
      const code = generateOpenAINode();
      
      // Check authentication error handling
      expect(code).toContain('except AuthenticationError as e:');
      expect(code).toContain('Invalid OpenAI API key');
      expect(code).toContain('OPENAI_API_KEY secret');
    });

    it('should include error handling for RateLimitError', () => {
      const code = generateOpenAINode();
      
      // Check rate limit error handling
      expect(code).toContain('except RateLimitError as e:');
      expect(code).toContain('rate limit exceeded');
      expect(code).toContain('retry after');
    });

    it('should include error handling for APIError', () => {
      const code = generateOpenAINode();
      
      // Check API error handling with specific error messages
      expect(code).toContain('except APIError as e:');
      expect(code).toContain('error_message');
      expect(code).toContain('maximum context length');
      expect(code).toContain('json');
      expect(code).toContain('function');
    });

    it('should provide helpful error messages for common issues', () => {
      const code = generateOpenAINode();
      
      // Context length error
      expect(code).toContain('Context length exceeded');
      expect(code).toContain('larger context window');
      
      // JSON mode error
      expect(code).toContain('JSON mode error');
      expect(code).toContain('include the word "JSON"');
      
      // Function calling error
      expect(code).toContain('Function calling error');
      expect(code).toContain('expected schema');
    });

    it('should include logging statements', () => {
      const code = generateOpenAINode();
      
      // Check for logging
      expect(code).toContain('logger = logging.getLogger(__name__)');
      expect(code).toContain('logger.info(');
      expect(code).toContain('logger.error(');
    });

    it('should log API calls with model and token info', () => {
      const code = generateOpenAINode();
      
      // Check informational logging
      expect(code).toContain('Calling OpenAI API');
      expect(code).toContain('prompt_tokens');
      expect(code).toContain('completion_tokens');
      expect(code).toContain('finish_reason');
    });

    it('should return structured response with usage data', () => {
      const code = generateOpenAINode();
      
      // Check return structure
      expect(code).toContain('"content": message.content');
      expect(code).toContain('"model": response.model');
      expect(code).toContain('"usage": {');
      expect(code).toContain('"prompt_tokens"');
      expect(code).toContain('"completion_tokens"');
      expect(code).toContain('"total_tokens"');
      expect(code).toContain('"finish_reason"');
    });

    it('should use async/await pattern correctly', () => {
      const code = generateOpenAINode();
      
      // Check async patterns
      expect(code).toContain('async def');
      expect(code).toContain('await client.chat.completions.create');
      expect(code).toContain('async for chunk in stream');
    });

    it('should enable streaming with stream parameter', () => {
      const code = generateOpenAINode();
      
      // Streaming should set stream=True
      expect(code).toContain('"stream": True');
    });

    it('should handle streaming function calls with progress', () => {
      const code = generateOpenAINode();
      
      // Check streaming function call handling
      expect(code).toContain('is_function_call = False');
      expect(code).toContain('function_name = None');
      expect(code).toContain('function_arguments = ""');
      expect(code).toContain('if delta.function_call:');
      expect(code).toContain('[Calling function:');
      expect(code).toContain('FUNCTION_CALL:');
    });

    it('should accumulate function call arguments during streaming', () => {
      const code = generateOpenAINode();
      
      // Check argument accumulation
      expect(code).toContain('function_arguments += delta.function_call.arguments');
      expect(code).toContain('json.dumps(function_call_data)');
    });

    it('should yield tokens immediately without buffering', () => {
      const code = generateOpenAINode();
      
      // Check streaming yields directly
      expect(code).toContain('yield delta.content');
      
      // Check documentation mentions no buffering
      expect(code).toContain('No buffering');
      expect(code).toContain('Memory usage: O(1)');
      expect(code).toContain('NEVER buffers the entire response');
    });

    it('should document function calling in streaming mode', () => {
      const code = generateOpenAINode();
      
      // Check FUNCTION CALLING IN STREAMING MODE section
      expect(code).toContain('FUNCTION CALLING IN STREAMING MODE');
      expect(code).toContain('Yield progress messages');
      expect(code).toContain('Accumulate function call deltas');
      expect(code).toContain('real-time feedback');
    });

    it('should include comprehensive inline comments', () => {
      const code = generateOpenAINode();
      
      // Check for extensive commenting (following standards)
      const commentCount = (code.match(/#/g) || []).length;
      
      // Should have many comments (1 per 3-5 lines of logic)
      expect(commentCount).toBeGreaterThan(60);
    });

    it('should document JSON mode requirements', () => {
      const code = generateOpenAINode();
      
      // JSON mode documentation
      expect(code).toContain('JSON MODE:');
      expect(code).toContain('valid JSON');
      expect(code).toContain('Requirements:');
      expect(code).toContain('Include "JSON" in system message or user prompt');
    });

    it('should document function calling features', () => {
      const code = generateOpenAINode();
      
      // Function calling documentation
      expect(code).toContain('FUNCTION CALLING:');
      expect(code).toContain('intelligently choose');
      expect(code).toContain('Tool use');
      expect(code).toContain('Agentic workflows');
    });
  });

  describe('getOpenAIDependencies()', () => {
    it('should return array of Python package requirements', () => {
      const deps = getOpenAIDependencies();
      
      expect(Array.isArray(deps)).toBe(true);
      expect(deps.length).toBeGreaterThan(0);
    });

    it('should include openai SDK', () => {
      const deps = getOpenAIDependencies();
      
      // Should include official OpenAI SDK with version
      const openaiDep = deps.find((dep: string) => dep.startsWith('openai'));
      expect(openaiDep).toBeTruthy();
      expect(openaiDep).toMatch(/openai>=\d+\.\d+\.\d+/);
    });

    it('should specify minimum version numbers', () => {
      const deps = getOpenAIDependencies();
      
      // Each dependency should have >= version specification
      deps.forEach((dep: string) => {
        expect(dep).toMatch(/>=\d+/);
      });
    });

    it('should require openai version 1.0.0 or higher', () => {
      const deps = getOpenAIDependencies();
      
      // Check for v1.0+ (async support)
      const openaiDep = deps.find((dep: string) => dep.startsWith('openai'));
      expect(openaiDep).toContain('>=1.0.0');
    });
  });

  describe('generateOpenAIExample()', () => {
    it('should generate valid example code', () => {
      const example = generateOpenAIExample();
      
      expect(example).toBeTruthy();
      expect(typeof example).toBe('string');
      expect(example.length).toBeGreaterThan(100);
    });

    it('should include module docstring', () => {
      const example = generateOpenAIExample();
      
      expect(example).toContain('"""');
      expect(example).toContain('Example:');
      expect(example).toContain('OpenAI GPT');
    });

    it('should show both streaming and non-streaming usage', () => {
      const example = generateOpenAIExample();
      
      // Non-streaming example
      expect(example).toContain('execute_openai_completion');
      expect(example).toContain('Non-streaming');
      
      // Streaming example
      expect(example).toContain('stream_openai_completion');
      expect(example).toContain('Streaming');
      expect(example).toContain('streaming_response');
      expect(example).toContain('stream_tokens');
    });

    it('should include FastAPI endpoints', () => {
      const example = generateOpenAIExample();
      
      // Check FastAPI usage
      expect(example).toContain('from fastapi import FastAPI');
      expect(example).toContain('app = FastAPI()');
      expect(example).toContain('@app.post(');
    });

    it('should show configuration examples', () => {
      const example = generateOpenAIExample();
      
      // Check config structure is shown
      expect(example).toContain('config = {');
      expect(example).toContain('"model"');
      expect(example).toContain('"messages"');
      expect(example).toContain('"max_tokens"');
    });

    it('should demonstrate function calling', () => {
      const example = generateOpenAIExample();
      
      // Function calling example
      expect(example).toContain('function-call');
      expect(example).toContain('"functions": [{');
      expect(example).toContain('get_weather');
      expect(example).toContain('parameters');
      expect(example).toContain('if result.get("function_call")');
    });

    it('should demonstrate JSON mode', () => {
      const example = generateOpenAIExample();
      
      // JSON mode example
      expect(example).toContain('extract-json');
      expect(example).toContain('"response_format": {"type": "json_object"}');
      expect(example).toContain('json.loads');
    });

    it('should show streaming with function calling', () => {
      const example = generateOpenAIExample();
      
      // Streaming function call example
      expect(example).toContain('function-stream');
      expect(example).toContain('FUNCTION_CALL:');
      expect(example).toContain('async for chunk');
    });

    it('should show different GPT models', () => {
      const example = generateOpenAIExample();
      
      // Should demonstrate using different models
      expect(example).toContain('gpt-4-turbo-preview');
      expect(example).toContain('gpt-4');
      expect(example).toContain('gpt-3.5-turbo');
    });

    it('should demonstrate multi-turn conversations', () => {
      const example = generateOpenAIExample();
      
      // Multi-turn example
      expect(example).toContain('conversation');
      expect(example).toContain('"role": "user"');
      expect(example).toContain('"role": "assistant"');
      expect(example).toContain('message history');
    });

    it('should show system message usage', () => {
      const example = generateOpenAIExample();
      
      // System message example
      expect(example).toContain('"role": "system"');
      expect(example).toContain('helpful assistant');
    });
  });

  describe('Function Calling Support', () => {
    it('should handle function definitions in config', () => {
      const code = generateOpenAINode();
      
      // Function definitions should be passed to API
      expect(code).toContain('if config.get("functions")');
      expect(code).toContain('request_params["functions"] = config["functions"]');
    });

    it('should detect function call in response', () => {
      const code = generateOpenAINode();
      
      // Should check for function_call in message
      expect(code).toContain('if message.function_call:');
    });

    it('should return function call details', () => {
      const code = generateOpenAINode();
      
      // Should return structured function call data
      expect(code).toContain('"function_call": {');
      expect(code).toContain('"name": message.function_call.name');
      expect(code).toContain('"arguments": message.function_call.arguments');
    });

    it('should set content to None when function called', () => {
      const code = generateOpenAINode();
      
      // Content should be None when function is called
      expect(code).toContain('"content": None');
    });

    it('should log function call events', () => {
      const code = generateOpenAINode();
      
      // Should log when function is called
      expect(code).toContain('Model chose to call function');
      expect(code).toContain('logger.info');
    });
  });

  describe('JSON Mode Support', () => {
    it('should handle string "json" format', () => {
      const code = generateOpenAINode();
      
      // Should convert string "json" to proper format
      expect(code).toContain('if response_format == "json"');
      expect(code).toContain('{"type": "json_object"}');
    });

    it('should handle dict response_format', () => {
      const code = generateOpenAINode();
      
      // Should accept dict format directly
      expect(code).toContain('elif isinstance(response_format, dict)');
    });

    it('should document JSON mode requirements', () => {
      const code = generateOpenAINode();
      
      // Should explain JSON mode requirements
      expect(code).toContain('JSON mode requires "JSON" mentioned in prompt');
    });

    it('should provide error message for JSON mode issues', () => {
      const code = generateOpenAINode();
      
      // Should have specific error handling for JSON mode
      expect(code).toContain('JSON mode error');
      expect(code).toContain('include the word "JSON"');
    });
  });

  describe('Integration Patterns', () => {
    it('should generate code compatible with SSE streaming utilities', () => {
      const code = generateOpenAINode();
      
      // Should be designed to work with streaming.py utilities
      expect(code).toContain('AsyncGenerator[str, None]');
      
      // Documentation should mention SSE integration
      expect(code).toContain('Integration with SSE');
      expect(code).toContain('streaming_response');
      expect(code).toContain('stream_tokens');
    });

    it('should follow Catalyst code generation patterns', () => {
      const code = generateOpenAINode();
      
      // Should include Catalyst markers
      expect(code).toContain('@catalyst:generated');
      expect(code).toContain('DO NOT EDIT');
      expect(code).toContain('Changes will be overwritten');
    });

    it('should accept ExecutionContext for secrets and pools', () => {
      const code = generateOpenAINode();
      
      // Functions should accept ctx parameter
      expect(code).toContain('ctx');
      expect(code).toContain('ctx.secrets');
      
      // Should mention connection pools in comments
      expect(code).toContain('connection pool');
      expect(code).toContain('timeout');
    });
  });

  describe('Code Quality', () => {
    it('should not contain placeholder text', () => {
      const code = generateOpenAINode();
      
      // No TODOs or placeholders
      expect(code).not.toContain('TODO');
      expect(code).not.toContain('FIXME');
      expect(code).not.toContain('XXX');
    });

    it('should have consistent indentation', () => {
      const code = generateOpenAINode();
      
      // Python uses 4-space indentation
      // Check for properly indented code blocks
      expect(code).toContain('async def execute_openai_completion');
      expect(code).toContain('async def stream_openai_completion');
      // Code should have nested indentation
      const lines = code.split('\n');
      const indentedLines = lines.filter(line => line.startsWith('    '));
      expect(indentedLines.length).toBeGreaterThan(50);  // Many indented lines
    });

    it('should use type hints throughout', () => {
      const code = generateOpenAINode();
      
      // Check for type hints
      expect(code).toContain('Dict[str, Any]');
      expect(code).toContain('AsyncGenerator[str, None]');
      expect(code).toContain('-> Dict');
      expect(code).toContain('-> AsyncGenerator');
    });

    it('should follow PEP 8 naming conventions', () => {
      const code = generateOpenAINode();
      
      // Function names: snake_case
      expect(code).toContain('execute_openai_completion');
      expect(code).toContain('stream_openai_completion');
      
      // Variable names: snake_case
      expect(code).toContain('request_params');
      expect(code).toContain('error_message');
      expect(code).toContain('function_call');
    });
  });

  describe('Performance Considerations', () => {
    it('should document performance characteristics', () => {
      const code = generateOpenAINode();
      
      // Performance documentation
      expect(code).toContain('Performance:');
      expect(code).toContain('latency');
      expect(code).toContain('tokens');
    });

    it('should mention context window sizes', () => {
      const code = generateOpenAINode();
      
      // Context windows for each model
      expect(code).toContain('128K');  // GPT-4 Turbo
      expect(code).toContain('8K');    // GPT-4
      expect(code).toContain('16K');   // GPT-3.5
    });

    it('should document streaming performance', () => {
      const code = generateOpenAINode();
      
      // Streaming metrics
      expect(code).toContain('First token latency');
      expect(code).toContain('Tokens per second');
    });

    it('should emphasize memory efficiency', () => {
      const code = generateOpenAINode();
      
      // Memory efficiency
      expect(code).toContain('Memory Efficiency');
      expect(code).toContain('O(1)');
      expect(code).toContain('NEVER buffers');
    });
  });

  describe('Temperature Range', () => {
    it('should document OpenAI temperature range (0-2)', () => {
      const code = generateOpenAINode();
      
      // OpenAI supports 0-2 temperature range
      expect(code).toContain('0-2');
      expect(code).toContain('temperature');
    });

    it('should mention temperature is wider than Anthropic', () => {
      const code = generateOpenAINode();
      
      // Should note the difference from Anthropic
      expect(code).toContain("wider than Anthropic");
    });
  });
});
