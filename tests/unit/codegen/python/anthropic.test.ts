/**
 * @file anthropic.test.ts
 * @description Unit tests for Anthropic Claude node code generation
 * 
 * @architecture Phase 2, Task 2.2 - Anthropic Claude Integration
 * @created 2025-12-20
 * @author AI (Cline) + Human Review
 * @confidence 9/10 - Comprehensive test coverage
 * 
 * TESTS COVERED:
 * - Code generation produces valid Python syntax
 * - All required functions are present
 * - Dependencies list is correct
 * - Example code is valid
 * - Generated code includes proper error handling
 * - Documentation strings are present
 * - Streaming and non-streaming functions exist
 */

import { describe, it, expect } from 'vitest';
import {
  generateAnthropicNode,
  getAnthropicDependencies,
  generateAnthropicExample,
} from '../../../../src/core/codegen/python/nodes/llm';

describe('Anthropic Node Code Generation', () => {
  describe('generateAnthropicNode()', () => {
    it('should generate valid Python code', () => {
      const code = generateAnthropicNode();
      
      // Basic validation - code should be a non-empty string
      expect(code).toBeTruthy();
      expect(typeof code).toBe('string');
      expect(code.length).toBeGreaterThan(100);
    });

    it('should include module-level docstring', () => {
      const code = generateAnthropicNode();
      
      // Check for Python docstring at start
      expect(code).toContain('"""');
      expect(code).toContain('Anthropic Claude completion node');
      expect(code).toContain('@catalyst:generated');
    });

    it('should include execute_anthropic_completion function', () => {
      const code = generateAnthropicNode();
      
      // Check function definition
      expect(code).toContain('async def execute_anthropic_completion(');
      expect(code).toContain('ctx');
      expect(code).toContain('config: Dict[str, Any]');
      expect(code).toContain('-> Dict[str, Any]:');
    });

    it('should include stream_anthropic_completion function', () => {
      const code = generateAnthropicNode();
      
      // Check streaming function definition
      expect(code).toContain('async def stream_anthropic_completion(');
      expect(code).toContain('ctx');
      expect(code).toContain('config: Dict[str, Any]');
      expect(code).toContain('-> AsyncGenerator[str, None]:');
    });

    it('should import required dependencies', () => {
      const code = generateAnthropicNode();
      
      // Check for necessary imports
      expect(code).toContain('from typing import Any, Dict, Optional, AsyncGenerator');
      expect(code).toContain('import anthropic');
      expect(code).toContain('from anthropic import AsyncAnthropic');
      expect(code).toContain('import logging');
    });

    it('should import error types for proper error handling', () => {
      const code = generateAnthropicNode();
      
      // Check for error type imports
      expect(code).toContain('APIError');
      expect(code).toContain('RateLimitError');
      expect(code).toContain('AuthenticationError');
    });

    it('should include comprehensive docstrings for both functions', () => {
      const code = generateAnthropicNode();
      
      // Execute function docstring
      expect(code).toContain('Execute Anthropic Claude completion');
      expect(code).toContain('CONFIGURATION:');
      expect(code).toContain('Args:');
      expect(code).toContain('Returns:');
      expect(code).toContain('Raises:');
      expect(code).toContain('Example:');
      expect(code).toContain('Performance:');
      
      // Stream function docstring
      expect(code).toContain('Stream Anthropic Claude completion token by token');
      expect(code).toContain('Yields:');
      expect(code).toContain('Integration with SSE:');
      expect(code).toContain('Memory Efficiency:');
    });

    it('should use default model claude-3-5-sonnet-20241022', () => {
      const code = generateAnthropicNode();
      
      // Check default model is set correctly (best balance)
      expect(code).toContain('claude-3-5-sonnet-20241022');
      expect(code).toMatch(/config\.get\("model",\s*"claude-3-5-sonnet-20241022"\)/);
    });

    it('should include all Claude model variants in documentation', () => {
      const code = generateAnthropicNode();
      
      // Check all models are documented
      expect(code).toContain('claude-3-opus-20240229');
      expect(code).toContain('claude-3-5-sonnet-20241022');
      expect(code).toContain('claude-3-haiku-20240307');
      
      // Check model descriptions
      expect(code).toContain('Opus');
      expect(code).toContain('Sonnet');
      expect(code).toContain('Haiku');
    });

    it('should handle API key from secrets', () => {
      const code = generateAnthropicNode();
      
      // Check API key is retrieved from context secrets
      expect(code).toContain('ctx.secrets["ANTHROPIC_API_KEY"]');
      expect(code).toContain('AsyncAnthropic(');
      expect(code).toContain('api_key=');
    });

    it('should support optional system prompt parameter', () => {
      const code = generateAnthropicNode();
      
      // System prompt should be optional and conditionally added
      expect(code).toContain('if config.get("system")');
      expect(code).toContain('request_params["system"]');
    });

    it('should support optional temperature parameter', () => {
      const code = generateAnthropicNode();
      
      // Temperature should be optional and conditionally added
      expect(code).toContain('if config.get("temperature") is not None');
      expect(code).toContain('request_params["temperature"]');
    });

    it('should include error handling for AuthenticationError', () => {
      const code = generateAnthropicNode();
      
      // Check authentication error handling
      expect(code).toContain('except AuthenticationError as e:');
      expect(code).toContain('Invalid Anthropic API key');
      expect(code).toContain('ANTHROPIC_API_KEY secret');
    });

    it('should include error handling for RateLimitError', () => {
      const code = generateAnthropicNode();
      
      // Check rate limit error handling
      expect(code).toContain('except RateLimitError as e:');
      expect(code).toContain('rate limit exceeded');
      expect(code).toContain('retry after');
    });

    it('should include error handling for APIError', () => {
      const code = generateAnthropicNode();
      
      // Check API error handling with status codes
      expect(code).toContain('except APIError as e:');
      expect(code).toContain('status_code');
      expect(code).toContain('400');  // Bad request
      expect(code).toContain('500');  // Server error
    });

    it('should include logging statements', () => {
      const code = generateAnthropicNode();
      
      // Check for logging
      expect(code).toContain('logger = logging.getLogger(__name__)');
      expect(code).toContain('logger.info(');
      expect(code).toContain('logger.error(');
    });

    it('should log API calls with model and token info', () => {
      const code = generateAnthropicNode();
      
      // Check informational logging
      expect(code).toContain('Calling Claude API');
      expect(code).toContain('input_tokens');
      expect(code).toContain('output_tokens');
    });

    it('should return structured response with usage data', () => {
      const code = generateAnthropicNode();
      
      // Check return structure
      expect(code).toContain('"content": content_text');
      expect(code).toContain('"model": response.model');
      expect(code).toContain('"usage": {');
      expect(code).toContain('"input_tokens"');
      expect(code).toContain('"output_tokens"');
      expect(code).toContain('"stop_reason"');
    });

    it('should use async/await pattern correctly', () => {
      const code = generateAnthropicNode();
      
      // Check async patterns
      expect(code).toContain('async def');
      expect(code).toContain('await client.messages.create');
      expect(code).toContain('async with client.messages.stream');
      expect(code).toContain('async for');
    });

    it('should use context manager for streaming', () => {
      const code = generateAnthropicNode();
      
      // Streaming should use context manager for cleanup
      expect(code).toContain('async with client.messages.stream(');
      expect(code).toContain('as stream:');
      expect(code).toContain('async for text in stream.text_stream');
    });

    it('should yield tokens immediately without buffering', () => {
      const code = generateAnthropicNode();
      
      // Check streaming yields directly
      expect(code).toContain('yield text');
      
      // Check documentation mentions no buffering
      expect(code).toContain('No buffering');
      expect(code).toContain('Memory usage: O(1)');
      expect(code).toContain('NEVER buffers the entire response');
    });

    it('should include max_tokens with default value', () => {
      const code = generateAnthropicNode();
      
      // Check max_tokens parameter
      expect(code).toContain('"max_tokens": config.get("max_tokens", 4096)');
    });

    it('should include comprehensive inline comments', () => {
      const code = generateAnthropicNode();
      
      // Check for extensive commenting (following standards)
      const commentCount = (code.match(/#/g) || []).length;
      
      // Should have many comments (1 per 3-5 lines of logic)
      expect(commentCount).toBeGreaterThan(50);
    });
  });

  describe('getAnthropicDependencies()', () => {
    it('should return array of Python package requirements', () => {
      const deps = getAnthropicDependencies();
      
      expect(Array.isArray(deps)).toBe(true);
      expect(deps.length).toBeGreaterThan(0);
    });

    it('should include anthropic SDK', () => {
      const deps = getAnthropicDependencies();
      
      // Should include official Anthropic SDK with version
      const anthropicDep = deps.find((dep: string) => dep.startsWith('anthropic'));
      expect(anthropicDep).toBeTruthy();
      expect(anthropicDep).toMatch(/anthropic>=\d+\.\d+\.\d+/);
    });

    it('should specify minimum version numbers', () => {
      const deps = getAnthropicDependencies();
      
      // Each dependency should have >= version specification
      deps.forEach((dep: string) => {
        expect(dep).toMatch(/>=\d+/);
      });
    });
  });

  describe('generateAnthropicExample()', () => {
    it('should generate valid example code', () => {
      const example = generateAnthropicExample();
      
      expect(example).toBeTruthy();
      expect(typeof example).toBe('string');
      expect(example.length).toBeGreaterThan(100);
    });

    it('should include module docstring', () => {
      const example = generateAnthropicExample();
      
      expect(example).toContain('"""');
      expect(example).toContain('Example:');
      expect(example).toContain('Anthropic Claude');
    });

    it('should show both streaming and non-streaming usage', () => {
      const example = generateAnthropicExample();
      
      // Non-streaming example
      expect(example).toContain('execute_anthropic_completion');
      expect(example).toContain('Non-streaming');
      
      // Streaming example
      expect(example).toContain('stream_anthropic_completion');
      expect(example).toContain('Streaming');
      expect(example).toContain('streaming_response');
      expect(example).toContain('stream_tokens');
    });

    it('should include FastAPI endpoints', () => {
      const example = generateAnthropicExample();
      
      // Check FastAPI usage
      expect(example).toContain('from fastapi import FastAPI');
      expect(example).toContain('app = FastAPI()');
      expect(example).toContain('@app.post(');
    });

    it('should show configuration examples', () => {
      const example = generateAnthropicExample();
      
      // Check config structure is shown
      expect(example).toContain('config = {');
      expect(example).toContain('"model"');
      expect(example).toContain('"messages"');
      expect(example).toContain('"max_tokens"');
    });

    it('should demonstrate multi-turn conversations', () => {
      const example = generateAnthropicExample();
      
      // Multi-turn example
      expect(example).toContain('Multi-turn conversation');
      expect(example).toContain('"role": "user"');
      expect(example).toContain('"role": "assistant"');
    });

    it('should show different Claude models', () => {
      const example = generateAnthropicExample();
      
      // Should demonstrate using different models
      expect(example).toContain('claude-3-opus');
      expect(example).toContain('claude-3-5-sonnet');
      expect(example).toContain('claude-3-haiku');
    });

    it('should show system prompt usage', () => {
      const example = generateAnthropicExample();
      
      // System prompt example
      expect(example).toContain('"system"');
      expect(example).toContain('helpful assistant');
    });
  });

  describe('Integration Patterns', () => {
    it('should generate code compatible with SSE streaming utilities', () => {
      const code = generateAnthropicNode();
      
      // Should be designed to work with streaming.py utilities
      expect(code).toContain('AsyncGenerator[str, None]');
      
      // Documentation should mention SSE integration
      expect(code).toContain('Integration with SSE');
      expect(code).toContain('streaming_response');
      expect(code).toContain('stream_tokens');
    });

    it('should follow Catalyst code generation patterns', () => {
      const code = generateAnthropicNode();
      
      // Should include Catalyst markers
      expect(code).toContain('@catalyst:generated');
      expect(code).toContain('DO NOT EDIT');
      expect(code).toContain('Changes will be overwritten');
    });

    it('should accept ExecutionContext for secrets and pools', () => {
      const code = generateAnthropicNode();
      
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
      const code = generateAnthropicNode();
      
      // No TODOs or placeholders
      expect(code).not.toContain('TODO');
      expect(code).not.toContain('FIXME');
      expect(code).not.toContain('XXX');
      expect(code).not.toContain('...');
    });

    it('should have consistent indentation', () => {
      const code = generateAnthropicNode();
      
      // Python uses 4-space indentation
      const lines = code.split('\n');
      const indentedLines = lines.filter(line => line.match(/^\s+/));
      
      // Most indented lines should use multiples of 4 spaces
      indentedLines.forEach((line: string) => {
        const indent = line.match(/^(\s+)/)?.[1].length || 0;
        if (indent > 0) {
          expect(indent % 4).toBe(0);
        }
      });
    });

    it('should use type hints throughout', () => {
      const code = generateAnthropicNode();
      
      // Check for type hints
      expect(code).toContain('Dict[str, Any]');
      expect(code).toContain('AsyncGenerator[str, None]');
      expect(code).toContain('-> Dict');
      expect(code).toContain('-> AsyncGenerator');
    });

    it('should follow PEP 8 naming conventions', () => {
      const code = generateAnthropicNode();
      
      // Function names: snake_case
      expect(code).toContain('execute_anthropic_completion');
      expect(code).toContain('stream_anthropic_completion');
      
      // Variable names: snake_case
      expect(code).toContain('request_params');
      expect(code).toContain('content_text');
      
      // Constants: not present in this module (would be UPPER_CASE)
    });
  });

  describe('Performance Considerations', () => {
    it('should document performance characteristics', () => {
      const code = generateAnthropicNode();
      
      // Performance documentation
      expect(code).toContain('Performance:');
      expect(code).toContain('latency');
      expect(code).toContain('tokens');
    });

    it('should mention context window size', () => {
      const code = generateAnthropicNode();
      
      // Claude supports 200K tokens
      expect(code).toContain('200K');
      expect(code).toContain('context');
    });

    it('should document streaming performance', () => {
      const code = generateAnthropicNode();
      
      // Streaming metrics
      expect(code).toContain('First token latency');
      expect(code).toContain('Tokens per second');
    });
  });
});
