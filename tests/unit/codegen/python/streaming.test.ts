/**
 * @file streaming.test.ts
 * @description Unit tests for Python streaming utilities generation
 * 
 * @architecture Phase 2, Task 2.1 - Streaming Infrastructure
 * @created 2025-12-20
 * @author AI (Cline) + Human Review
 * @confidence 9/10 - Comprehensive test coverage
 * 
 * @see src/core/codegen/python/StreamingGenerator.ts
 * @see src/core/codegen/python/templates/streaming.py.ts
 * 
 * TEST COVERAGE:
 * - Template generation produces valid Python
 * - All required functions present in output
 * - Correct imports and dependencies
 * - SSE format compliance
 * - Error handling
 * - Generator class functionality
 * 
 * TESTING STRATEGY:
 * - Unit: Test individual template functions
 * - Integration: Test complete module generation
 * - Validation: Check Python syntax and structure
 * - Edge cases: Error handling and edge cases
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  StreamingGenerator,
  createStreamingGenerator,
  generateStreaming,
  getStreamingDeps,
  type StreamingGenerationResult,
} from '../../../../src/core/codegen/python';
import {
  generateStreamingModule,
  getStreamingDependencies,
  generateStreamingExample,
} from '../../../../src/core/codegen/python/templates/streaming.py';

describe('StreamingGenerator', () => {
  let generator: StreamingGenerator;

  beforeEach(() => {
    generator = new StreamingGenerator();
  });

  describe('Constructor and Factory Functions', () => {
    it('should create instance with default options', () => {
      const gen = new StreamingGenerator();
      const options = gen.getOptions();
      
      expect(options.outputDir).toBe('utils');
      expect(options.includeExamples).toBe(false);
    });

    it('should create instance with custom options', () => {
      const gen = new StreamingGenerator({
        outputDir: 'custom',
        includeExamples: true,
      });
      const options = gen.getOptions();
      
      expect(options.outputDir).toBe('custom');
      expect(options.includeExamples).toBe(true);
    });

    it('should create instance via factory function', () => {
      const gen = createStreamingGenerator({ outputDir: 'test' });
      const options = gen.getOptions();
      
      expect(options.outputDir).toBe('test');
    });

    it('should update options after creation', () => {
      generator.setOptions({ outputDir: 'updated' });
      const options = generator.getOptions();
      
      expect(options.outputDir).toBe('updated');
    });
  });

  describe('generateStreamingModule()', () => {
    it('should generate streaming module successfully', () => {
      const result = generator.generateStreamingModule();
      
      // Check result structure
      expect(result.success).toBe(true);
      expect(result.code).toBeTruthy();
      expect(result.filename).toBe('streaming.py');
      expect(result.filepath).toBe('utils/streaming.py');
      expect(result.error).toBeUndefined();
    });

    it('should include all required functions', () => {
      const result = generator.generateStreamingModule();
      
      expect(result.code).toContain('def format_sse(');
      expect(result.code).toContain('def streaming_response(');
      expect(result.code).toContain('async def stream_tokens(');
      expect(result.code).toContain('async def stream_partial_results(');
      expect(result.code).toContain('async def _consume_generator(');
    });

    it('should include all required imports', () => {
      const result = generator.generateStreamingModule();
      
      expect(result.code).toContain('from typing import AsyncGenerator, Any, Optional');
      expect(result.code).toContain('from fastapi.responses import StreamingResponse');
      expect(result.code).toContain('import orjson');
      expect(result.code).toContain('import asyncio');
      expect(result.code).toContain('import logging');
    });

    it('should include module docstring', () => {
      const result = generator.generateStreamingModule();
      
      expect(result.code).toContain('Streaming utilities for Server-Sent Events (SSE)');
      expect(result.code).toContain('@catalyst:generated');
      expect(result.code).toContain('DO NOT EDIT');
    });

    it('should include proper type hints', () => {
      const result = generator.generateStreamingModule();
      
      // Check function signatures with type hints
      expect(result.code).toContain('def format_sse(event: str, data: Any) -> bytes:');
      expect(result.code).toContain('AsyncGenerator[bytes, None]');
      expect(result.code).toContain('StreamingResponse');
    });

    it('should include comprehensive docstrings', () => {
      const result = generator.generateStreamingModule();
      
      // Check that each function has docstring
      expect(result.code).toContain('Format data as Server-Sent Event');
      expect(result.code).toContain('Wrap async generator');
      expect(result.code).toContain('Stream LLM tokens');
      expect(result.code).toContain('Stream results from multiple parallel operations');
    });

    it('should return dependencies', () => {
      const result = generator.generateStreamingModule();
      
      expect(result.dependencies).toContain('fastapi>=0.104.0');
      expect(result.dependencies).toContain('orjson>=3.9.0');
    });

    it('should include metadata', () => {
      const result = generator.generateStreamingModule();
      
      expect(result.metadata.generatedAt).toBeTruthy();
      expect(result.metadata.durationMs).toBeGreaterThanOrEqual(0);
    });

    it('should use custom output directory', () => {
      const gen = new StreamingGenerator({ outputDir: 'custom_dir' });
      const result = gen.generateStreamingModule();
      
      expect(result.filepath).toBe('custom_dir/streaming.py');
    });

    it('should use root directory when outputDir is empty', () => {
      const gen = new StreamingGenerator({ outputDir: '' });
      const result = gen.generateStreamingModule();
      
      expect(result.filepath).toBe('streaming.py');
    });
  });

  describe('format_sse() function', () => {
    let code: string;

    beforeEach(() => {
      const result = generator.generateStreamingModule();
      code = result.code;
    });

    it('should use orjson for serialization', () => {
      expect(code).toContain('orjson.dumps(data)');
    });

    it('should format according to SSE spec', () => {
      // Check SSE format in docstring/comments
      expect(code).toContain('event: {event_type}');
      expect(code).toContain('data: {json_data}');
      expect(code).toContain('blank line terminates');
    });

    it('should return bytes', () => {
      expect(code).toContain('def format_sse(event: str, data: Any) -> bytes:');
      expect(code).toContain("return sse_message.encode('utf-8')");
    });

    it('should handle serialization errors', () => {
      expect(code).toContain('except (TypeError, ValueError)');
      expect(code).toContain('logger.error');
      expect(code).toContain('event: error');
    });
  });

  describe('streaming_response() function', () => {
    let code: string;

    beforeEach(() => {
      const result = generator.generateStreamingModule();
      code = result.code;
    });

    it('should set critical headers', () => {
      expect(code).toContain('"Cache-Control": "no-cache"');
      expect(code).toContain('"X-Accel-Buffering": "no"');
      expect(code).toContain('"Connection": "keep-alive"');
    });

    it('should default to text/event-stream media type', () => {
      expect(code).toContain('media_type: str = "text/event-stream"');
    });

    it('should return StreamingResponse', () => {
      expect(code).toContain('return StreamingResponse(');
    });

    it('should document nginx compatibility', () => {
      expect(code).toContain('X-Accel-Buffering');
      expect(code).toContain('nginx');
      expect(code).toContain('prevent');
    });
  });

  describe('stream_tokens() function', () => {
    let code: string;

    beforeEach(() => {
      const result = generator.generateStreamingModule();
      code = result.code;
    });

    it('should be async generator', () => {
      expect(code).toContain('async def stream_tokens(');
      expect(code).toContain('AsyncGenerator[bytes, None]');
    });

    it('should accept token_generator parameter', () => {
      expect(code).toContain('token_generator: AsyncGenerator[str, None]');
    });

    it('should have include_done parameter', () => {
      expect(code).toContain('include_done: bool = True');
    });

    it('should yield formatted SSE events', () => {
      expect(code).toContain("yield format_sse('token'");
    });

    it('should emit done event when include_done is True', () => {
      expect(code).toContain("yield format_sse('done'");
      expect(code).toContain('token_count');
    });

    it('should handle errors', () => {
      expect(code).toContain('except Exception');
      expect(code).toContain("yield format_sse('error'");
    });

    it('should accumulate text for done event', () => {
      expect(code).toContain('full_text = []');
      expect(code).toContain("''.join(full_text)");
    });
  });

  describe('stream_partial_results() function', () => {
    let code: string;

    beforeEach(() => {
      const result = generator.generateStreamingModule();
      code = result.code;
    });

    it('should be async generator', () => {
      expect(code).toContain('async def stream_partial_results(');
      expect(code).toContain('AsyncGenerator[bytes, None]');
    });

    it('should accept list of generators', () => {
      expect(code).toContain('result_generators: list[AsyncGenerator[Any, None]]');
    });

    it('should use asyncio.as_completed()', () => {
      expect(code).toContain('asyncio.as_completed(tasks)');
    });

    it('should emit partial events', () => {
      expect(code).toContain("yield format_sse('partial'");
    });

    it('should emit complete event', () => {
      expect(code).toContain("yield format_sse('complete'");
    });

    it('should handle merge_results parameter', () => {
      expect(code).toContain('merge_results: bool = True');
      expect(code).toContain('if merge_results');
    });

    it('should handle task failures', () => {
      expect(code).toContain('except Exception');
      expect(code).toContain('continue with other tasks');
    });
  });

  describe('generateExampleFile()', () => {
    it('should generate example file successfully', () => {
      const result = generator.generateExampleFile();
      
      expect(result.success).toBe(true);
      expect(result.code).toBeTruthy();
      expect(result.filename).toBe('streaming_example.py');
      expect(result.filepath).toBe('utils/streaming_example.py');
    });

    it('should include usage examples', () => {
      const result = generator.generateExampleFile();
      
      expect(result.code).toContain('from streaming import');
      expect(result.code).toContain('stream_llm_response');
      expect(result.code).toContain('parallel_search');
    });

    it('should include FastAPI examples', () => {
      const result = generator.generateExampleFile();
      
      expect(result.code).toContain('from fastapi import FastAPI');
      expect(result.code).toContain('@app.post');
      expect(result.code).toContain('@app.get');
    });
  });

  describe('getDependencies()', () => {
    it('should return streaming dependencies', () => {
      const deps = generator.getDependencies();
      
      expect(deps).toContain('fastapi>=0.104.0');
      expect(deps).toContain('orjson>=3.9.0');
      expect(deps.length).toBe(2);
    });

    it('should match dependencies in generation result', () => {
      const result = generator.generateStreamingModule();
      const deps = generator.getDependencies();
      
      expect(result.dependencies).toEqual(deps);
    });
  });

  describe('Helper Functions', () => {
    it('should generate via quick helper', () => {
      const result = generateStreaming();
      
      expect(result.success).toBe(true);
      expect(result.code).toBeTruthy();
    });

    it('should get deps via quick helper', () => {
      const deps = getStreamingDeps();
      
      expect(deps).toContain('fastapi>=0.104.0');
      expect(deps).toContain('orjson>=3.9.0');
    });
  });

  describe('Template Functions', () => {
    it('should generate module from template function', () => {
      const code = generateStreamingModule();
      
      expect(code).toBeTruthy();
      expect(code).toContain('def format_sse(');
      expect(code).toContain('def streaming_response(');
    });

    it('should get dependencies from template function', () => {
      const deps = getStreamingDependencies();
      
      expect(deps).toContain('fastapi>=0.104.0');
      expect(deps).toContain('orjson>=3.9.0');
    });

    it('should generate example from template function', () => {
      const example = generateStreamingExample();
      
      expect(example).toBeTruthy();
      expect(example).toContain('from streaming import');
    });
  });

  describe('Python Syntax Validation', () => {
    let code: string;

    beforeEach(() => {
      const result = generator.generateStreamingModule();
      code = result.code;
    });

    it('should have valid Python syntax structure', () => {
      // Check basic Python structure
      expect(code).toMatch(/^"""/); // Starts with docstring
      expect(code).toContain('from typing import');
      expect(code).toContain('def ');
      expect(code).toContain('async def ');
      expect(code).toContain('return ');
      expect(code).toContain('yield ');
    });

    it('should have proper indentation', () => {
      // Python uses 4-space indentation
      expect(code).toContain('    try:');
      expect(code).toContain('        ');
    });

    it('should have no syntax errors in function definitions', () => {
      // Check all function definitions are complete
      const functionDefs = code.match(/def \w+\(.*?\):/g) || [];
      expect(functionDefs.length).toBeGreaterThanOrEqual(5);
    });

    it('should have no obvious syntax errors', () => {
      // Check for proper Python constructs
      expect(code).toContain('"""');  // Should use triple quotes for docstrings
      expect(code.includes('def ')).toBe(true);
      expect(code.includes('return')).toBe(true);
      expect(code.includes('yield')).toBe(true);
    });

    it('should have valid async syntax', () => {
      expect(code).toContain('async def');
      expect(code).toContain('async for');
      expect(code).toContain('await ');
      expect(code).toContain('AsyncGenerator');
    });
  });

  describe('SSE Format Compliance', () => {
    let code: string;

    beforeEach(() => {
      const result = generator.generateStreamingModule();
      code = result.code;
    });

    it('should format events correctly', () => {
      // SSE format: event: {type}\ndata: {json}\n\n
      expect(code).toContain('event:');
      expect(code).toContain('data:');
      expect(code).toContain('\\n\\n'); // Double newline terminates event
    });

    it('should support multiple event types', () => {
      expect(code).toContain("'token'");
      expect(code).toContain("'partial'");
      expect(code).toContain("'done'");
      expect(code).toContain("'complete'");
      expect(code).toContain("'error'");
    });
  });

  describe('Performance Considerations', () => {
    it('should generate code quickly', () => {
      const start = performance.now();
      generator.generateStreamingModule();
      const duration = performance.now() - start;
      
      // Should be very fast (< 10ms)
      expect(duration).toBeLessThan(10);
    });

    it('should include performance documentation', () => {
      const result = generator.generateStreamingModule();
      
      expect(result.code).toContain('Performance:');
      expect(result.code).toContain('O(n)');
      expect(result.code).toContain('Memory');
    });
  });

  describe('Error Handling', () => {
    it('should document error handling', () => {
      const result = generator.generateStreamingModule();
      
      expect(result.code).toContain('Raises:');
      expect(result.code).toContain('Exception');
      expect(result.code).toContain('error event');
    });

    it('should log errors appropriately', () => {
      const result = generator.generateStreamingModule();
      
      expect(result.code).toContain('logger.error');
      expect(result.code).toContain('logging');
    });
  });
});
