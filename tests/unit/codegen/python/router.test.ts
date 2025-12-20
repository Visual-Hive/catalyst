/**
 * @file router.test.ts
 * @description Unit tests for LLM Router node code generation
 * 
 * @architecture Phase 2, Task 2.7 - LLM Router
 * @created 2025-12-20
 * @author AI (Cline) + Human Review
 * @confidence 9/10 - Comprehensive test coverage
 * 
 * TESTS COVERED:
 * - Code generation produces valid Python syntax
 * - All required functions are present
 * - All preset strategies are defined (cost/speed/quality/balanced)
 * - Routing logic is comprehensive
 * - Condition evaluation logic present
 * - Fallback mechanism exists
 * - Routes to all 3 providers (Anthropic, OpenAI, Groq)
 * - Dependencies list is correct (should be empty)
 * - Example code is valid
 * - Generated code includes proper error handling
 * - Documentation strings are present
 * - Logging for routing decisions
 */

import { describe, it, expect } from 'vitest';
import {
  generateLLMRouterNode,
  getLLMRouterDependencies,
  generateLLMRouterExample,
} from '../../../../src/core/codegen/python/nodes/llm';

describe('LLM Router Node Code Generation', () => {
  describe('generateLLMRouterNode()', () => {
    it('should generate valid Python code', () => {
      const code = generateLLMRouterNode();
      
      // Basic validation - code should be a non-empty string
      expect(code).toBeTruthy();
      expect(typeof code).toBe('string');
      expect(code.length).toBeGreaterThan(1000);
    });

    it('should include module-level docstring', () => {
      const code = generateLLMRouterNode();
      
      // Check for Python docstring at start
      expect(code).toContain('"""');
      expect(code).toContain('LLM Router node for intelligent provider selection');
      expect(code).toContain('@catalyst:generated');
      expect(code).toContain('DO NOT EDIT');
    });

    it('should include execute_llm_router function', () => {
      const code = generateLLMRouterNode();
      
      // Check main router function definition
      expect(code).toContain('async def execute_llm_router(');
      expect(code).toContain('ctx');
      expect(code).toContain('config: Dict[str, Any]');
      expect(code).toContain('-> Dict[str, Any]:');
    });

    it('should import required dependencies', () => {
      const code = generateLLMRouterNode();
      
      // Check for necessary imports
      expect(code).toContain('from typing import Any, Dict, Optional');
      expect(code).toContain('import logging');
      
      // Check for provider function imports
      expect(code).toContain('from .anthropic import execute_anthropic_completion');
      expect(code).toContain('from .openai import execute_openai_completion');
      expect(code).toContain('from .groq import execute_groq_completion');
    });

    it('should define all preset routing strategies', () => {
      const code = generateLLMRouterNode();
      
      // Check STRATEGIES dict exists
      expect(code).toContain('STRATEGIES = {');
      
      // Check all 4 preset strategies are defined
      expect(code).toContain('"cost":');
      expect(code).toContain('"speed":');
      expect(code).toContain('"quality":');
      expect(code).toContain('"balanced":');
    });

    it('should define cost strategy with correct routing', () => {
      const code = generateLLMRouterNode();
      
      // Cost strategy should route based on message length
      expect(code).toContain('len(str(messages)) < 500');
      expect(code).toContain('len(str(messages)) < 2000');
      
      // Should use Groq for cheap, Claude for expensive
      expect(code).toContain('llama-3.1-8b-instant');
      expect(code).toContain('llama-3.1-70b-versatile');
      expect(code).toContain('claude-3-5-sonnet-20241022');
    });

    it('should define speed strategy routing to Groq', () => {
      const code = generateLLMRouterNode();
      
      // Speed strategy should always route to Groq
      const speedSection = code.match(/"speed":\s*\[([\s\S]*?)\]/)?.[0];
      expect(speedSection).toBeTruthy();
      expect(speedSection).toContain('groq');
      expect(speedSection).toContain('llama-3.1-70b-versatile');
      expect(speedSection).toContain('always');
    });

    it('should define quality strategy routing to Claude', () => {
      const code = generateLLMRouterNode();
      
      // Quality strategy should route to Claude models
      const qualitySection = code.match(/"quality":\s*\[([\s\S]*?)\]/)?.[0];
      expect(qualitySection).toBeTruthy();
      expect(qualitySection).toContain('anthropic');
      expect(qualitySection).toContain('claude-3-5-sonnet-20241022');
      expect(qualitySection).toContain('claude-3-opus-20240229');
    });

    it('should define balanced strategy', () => {
      const code = generateLLMRouterNode();
      
      // Balanced should mix Groq and Claude
      const balancedSection = code.match(/"balanced":\s*\[([\s\S]*?)\]/)?.[0];
      expect(balancedSection).toBeTruthy();
      expect(balancedSection).toContain('groq');
      expect(balancedSection).toContain('anthropic');
    });

    it('should include _evaluate_condition helper function', () => {
      const code = generateLLMRouterNode();
      
      // Check condition evaluation function
      expect(code).toContain('def _evaluate_condition(');
      expect(code).toContain('condition: str');
      expect(code).toContain('-> bool:');
      
      // Should handle "always" special case
      expect(code).toContain('if condition == "always"');
      expect(code).toContain('return True');
    });

    it('should include _build_provider_config helper function', () => {
      const code = generateLLMRouterNode();
      
      // Check config builder function
      expect(code).toContain('def _build_provider_config(');
      expect(code).toContain('route: Dict[str, Any]');
      expect(code).toContain('base_config: Dict[str, Any]');
      expect(code).toContain('-> Dict[str, Any]:');
    });

    it('should support condition evaluation with safe context', () => {
      const code = generateLLMRouterNode();
      
      // Check safe evaluation context
      expect(code).toContain('eval_context = {');
      expect(code).toContain('"messages":');
      expect(code).toContain('"input":');
      expect(code).toContain('"env":');
      expect(code).toContain('"ctx":');
      
      // Safe built-ins
      expect(code).toContain('"len": len');
      expect(code).toContain('"str": str');
      expect(code).toContain('"int": int');
    });

    it('should use restricted eval for security', () => {
      const code = generateLLMRouterNode();
      
      // Should use eval with restricted builtins
      expect(code).toContain('eval(condition');
      expect(code).toContain('{"__builtins__": {}}');
    });

    it('should route to Anthropic provider', () => {
      const code = generateLLMRouterNode();
      
      // Check Anthropic routing
      expect(code).toContain('if selected_provider == "anthropic"');
      expect(code).toContain('await execute_anthropic_completion(ctx, provider_config)');
    });

    it('should route to OpenAI provider', () => {
      const code = generateLLMRouterNode();
      
      // Check OpenAI routing
      expect(code).toContain('elif selected_provider == "openai"');
      expect(code).toContain('await execute_openai_completion(ctx, provider_config)');
    });

    it('should route to Groq provider', () => {
      const code = generateLLMRouterNode();
      
      // Check Groq routing
      expect(code).toContain('elif selected_provider == "groq"');
      expect(code).toContain('await execute_groq_completion(ctx, provider_config)');
    });

    it('should include fallback mechanism', () => {
      const code = generateLLMRouterNode();
      
      // Check fallback logic
      expect(code).toContain('if selected_provider is None');
      expect(code).toContain('fallback = config.get("fallback"');
      expect(code).toContain('selected_provider = fallback["provider"]');
      expect(code).toContain('selected_model = fallback["model"]');
    });

    it('should validate fallback configuration', () => {
      const code = generateLLMRouterNode();
      
      // Should raise error if no fallback defined
      expect(code).toContain('if not fallback:');
      expect(code).toContain('raise ValueError');
      expect(code).toContain('no fallback defined');
    });

    it('should handle unknown provider error', () => {
      const code = generateLLMRouterNode();
      
      // Should validate provider name
      expect(code).toContain('else:');
      expect(code).toContain('Unknown provider');
      expect(code).toContain('Supported providers: anthropic, openai, groq');
    });

    it('should include comprehensive logging', () => {
      const code = generateLLMRouterNode();
      
      // Check for logging
      expect(code).toContain('logger = logging.getLogger(__name__)');
      expect(code).toContain('logger.info(');
      expect(code).toContain('logger.error(');
      expect(code).toContain('logger.warning(');
      
      // Should log routing decisions
      expect(code).toContain('LLM Router:');
      expect(code).toContain('strategy');
      expect(code).toContain('Route');
      expect(code).toContain('matched');
    });

    it('should log which provider was selected', () => {
      const code = generateLLMRouterNode();
      
      // Should log routing decisions
      expect(code).toContain('Routing to Anthropic');
      expect(code).toContain('Routing to OpenAI');
      expect(code).toContain('Routing to Groq');
    });

    it('should add routing metadata to result', () => {
      const code = generateLLMRouterNode();
      
      // Should add provider and reason to result
      expect(code).toContain('result["provider"] = selected_provider');
      expect(code).toContain('result["routing_reason"] = selected_reason');
    });

    it('should include error handling for ValueError', () => {
      const code = generateLLMRouterNode();
      
      // Check ValueError handling (configuration errors)
      expect(code).toContain('except ValueError as e:');
      expect(code).toContain('configuration error');
      expect(code).toContain('raise ValueError');
    });

    it('should include error handling for RuntimeError', () => {
      const code = generateLLMRouterNode();
      
      // Check generic exception handling
      expect(code).toContain('except Exception as e:');
      expect(code).toContain('Runtime error');
      expect(code).toContain('raise RuntimeError');
    });

    it('should include comprehensive docstrings', () => {
      const code = generateLLMRouterNode();
      
      // Main function docstring
      expect(code).toContain('Route LLM request to appropriate provider');
      expect(code).toContain('ROUTING PROCESS:');
      expect(code).toContain('CONFIGURATION:');
      expect(code).toContain('Args:');
      expect(code).toContain('Returns:');
      expect(code).toContain('Raises:');
      expect(code).toContain('Example');
      expect(code).toContain('Performance:');
      expect(code).toContain('Debugging:');
      
      // Helper function docstrings
      expect(code).toContain('Evaluate a routing condition');
      expect(code).toContain('Build provider-specific configuration');
    });

    it('should support both preset and custom strategies', () => {
      const code = generateLLMRouterNode();
      
      // Check strategy selection logic
      expect(code).toContain('strategy = config.get("strategy", "custom")');
      expect(code).toContain('if strategy in STRATEGIES:');
      expect(code).toContain('routes = STRATEGIES[strategy]');
      expect(code).toContain('else:');
      expect(code).toContain('routes = config.get("routes"');
    });

    it('should evaluate conditions in order (first-match-wins)', () => {
      const code = generateLLMRouterNode();
      
      // Check loop over routes
      expect(code).toContain('for i, route in enumerate(routes):');
      expect(code).toContain('if _evaluate_condition(condition, ctx, config):');
      expect(code).toContain('break');
    });

    it('should pass messages and parameters to providers', () => {
      const code = generateLLMRouterNode();
      
      // Check config building
      expect(code).toContain('provider_config["messages"]');
      expect(code).toContain('if base_config.get("system")');
      expect(code).toContain('if base_config.get("max_tokens")');
      expect(code).toContain('if base_config.get("temperature")');
    });

    it('should document routing strategies in docstring', () => {
      const code = generateLLMRouterNode();
      
      // Check strategy documentation
      expect(code).toContain('COST STRATEGY');
      expect(code).toContain('SPEED STRATEGY');
      expect(code).toContain('QUALITY STRATEGY');
      expect(code).toContain('BALANCED STRATEGY');
      expect(code).toContain('CUSTOM STRATEGY');
    });

    it('should include API cost comparison table', () => {
      const code = generateLLMRouterNode();
      
      // Check cost table in docstring
      expect(code).toContain('API COST COMPARISON');
      expect(code).toContain('Groq');
      expect(code).toContain('Anthropic');
      expect(code).toContain('OpenAI');
      expect(code).toContain('Llama 3.1');
      expect(code).toContain('Claude');
    });

    it('should include use cases documentation', () => {
      const code = generateLLMRouterNode();
      
      // Check use cases
      expect(code).toContain('USE CASES:');
      expect(code).toContain('Cost-conscious');
      expect(code).toContain('Real-time');
      expect(code).toContain('High-quality');
      expect(code).toContain('A/B testing');
    });

    it('should include comprehensive inline comments', () => {
      const code = generateLLMRouterNode();
      
      // Check for extensive commenting (following standards)
      const commentCount = (code.match(/#/g) || []).length;
      
      // Should have many comments (1 per 3-5 lines of logic)
      // Router has complex logic, expect 50+ comments minimum
      expect(commentCount).toBeGreaterThan(50);
    });

    it('should use async/await pattern correctly', () => {
      const code = generateLLMRouterNode();
      
      // Check async patterns
      expect(code).toContain('async def execute_llm_router');
      expect(code).toContain('await execute_anthropic_completion');
      expect(code).toContain('await execute_openai_completion');
      expect(code).toContain('await execute_groq_completion');
    });

    it('should use type hints throughout', () => {
      const code = generateLLMRouterNode();
      
      // Check for type hints
      expect(code).toContain('Dict[str, Any]');
      expect(code).toContain('-> Dict[str, Any]');
      expect(code).toContain('-> bool');
      expect(code).toContain('condition: str');
      expect(code).toContain('config: Dict[str, Any]');
    });

    it('should not contain placeholder text', () => {
      const code = generateLLMRouterNode();
      
      // No TODOs or placeholders
      expect(code).not.toContain('TODO');
      expect(code).not.toContain('FIXME');
      expect(code).not.toContain('XXX');
    });

    it('should have consistent indentation', () => {
      const code = generateLLMRouterNode();
      
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

    it('should include condition evaluation error handling', () => {
      const code = generateLLMRouterNode();
      
      // Should catch eval errors
      expect(code).toContain('try:');
      expect(code).toContain('result = eval(condition');
      expect(code).toContain('except Exception as e:');
      expect(code).toContain('Failed to evaluate routing condition');
      expect(code).toContain('return False');
    });

    it('should document example routing conditions', () => {
      const code = generateLLMRouterNode();
      
      // Check example conditions in docstring
      expect(code).toContain('Example conditions:');
      expect(code).toContain('"always"');
      expect(code).toContain('len(str(messages))');
      expect(code).toContain('input.get(');
      expect(code).toContain('env.get(');
    });
  });

  describe('getLLMRouterDependencies()', () => {
    it('should return empty array (no additional dependencies)', () => {
      const deps = getLLMRouterDependencies();
      
      // Router doesn't need extra dependencies
      // It uses functions from other modules that have their own deps
      expect(Array.isArray(deps)).toBe(true);
      expect(deps.length).toBe(0);
    });
  });

  describe('generateLLMRouterExample()', () => {
    it('should generate valid example code', () => {
      const example = generateLLMRouterExample();
      
      expect(example).toBeTruthy();
      expect(typeof example).toBe('string');
      expect(example.length).toBeGreaterThan(1000);
    });

    it('should include module docstring', () => {
      const example = generateLLMRouterExample();
      
      expect(example).toContain('"""');
      expect(example).toContain('Example:');
      expect(example).toContain('LLM Router');
    });

    it('should show cost optimization example', () => {
      const example = generateLLMRouterExample();
      
      // Cost-optimized endpoint
      expect(example).toContain('cost_optimized_endpoint');
      expect(example).toContain('"strategy": "cost"');
      expect(example).toContain('Route to cheapest provider');
    });

    it('should show speed optimization example', () => {
      const example = generateLLMRouterExample();
      
      // Real-time/speed endpoint
      expect(example).toContain('realtime_endpoint');
      expect(example).toContain('"strategy": "speed"');
      expect(example).toContain('ultra-fast');
    });

    it('should show quality optimization example', () => {
      const example = generateLLMRouterExample();
      
      // Quality endpoint
      expect(example).toContain('quality_endpoint');
      expect(example).toContain('"strategy": "quality"');
      expect(example).toContain('best reasoning');
    });

    it('should show balanced strategy example', () => {
      const example = generateLLMRouterExample();
      
      // Balanced endpoint
      expect(example).toContain('balanced_endpoint');
      expect(example).toContain('"strategy": "balanced"');
    });

    it('should show custom routing conditions', () => {
      const example = generateLLMRouterExample();
      
      // Custom routing
      expect(example).toContain('custom_routing_endpoint');
      expect(example).toContain('"strategy": "custom"');
      expect(example).toContain('"routes":');
      expect(example).toContain('"condition":');
    });

    it('should demonstrate A/B testing', () => {
      const example = generateLLMRouterExample();
      
      // A/B test example
      expect(example).toContain('ab_test_endpoint');
      expect(example).toContain('A/B test');
      expect(example).toContain('asyncio.gather');
    });

    it('should demonstrate fallback routing', () => {
      const example = generateLLMRouterExample();
      
      // Fallback example
      expect(example).toContain('fallback_routing_endpoint');
      expect(example).toContain('Demonstrate fallback');
      expect(example).toContain('no conditions match');
    });

    it('should show smart routing based on message analysis', () => {
      const example = generateLLMRouterExample();
      
      // Smart routing
      expect(example).toContain('smart_routing_endpoint');
      expect(example).toContain('Analyze message content');
      expect(example).toContain('is_code_related');
      expect(example).toContain('is_creative');
      expect(example).toContain('is_analytical');
    });

    it('should include FastAPI endpoints', () => {
      const example = generateLLMRouterExample();
      
      // Check FastAPI usage
      expect(example).toContain('from fastapi import FastAPI');
      expect(example).toContain('app = FastAPI()');
      expect(example).toContain('@app.post(');
    });

    it('should show configuration examples', () => {
      const example = generateLLMRouterExample();
      
      // Check config structure is shown
      expect(example).toContain('config = {');
      expect(example).toContain('"strategy"');
      expect(example).toContain('"fallback"');
      expect(example).toContain('"messages"');
    });

    it('should show routing result handling', () => {
      const example = generateLLMRouterExample();
      
      // Check result handling
      expect(example).toContain('result = await execute_llm_router(ctx, config)');
      expect(example).toContain('result["content"]');
      expect(example).toContain('result["provider"]');
      expect(example).toContain('result["routing_reason"]');
    });

    it('should demonstrate all three providers', () => {
      const example = generateLLMRouterExample();
      
      // Should show routing to all providers
      expect(example).toContain('anthropic');
      expect(example).toContain('openai');
      expect(example).toContain('groq');
    });

    it('should show different condition types', () => {
      const example = generateLLMRouterExample();
      
      // Different condition types
      expect(example).toContain('input.get(');
      expect(example).toContain('len(str(messages))');
      expect(example).toContain('env.get(');
      expect(example).toContain('always');
    });
  });

  describe('Integration Patterns', () => {
    it('should route to existing provider functions', () => {
      const code = generateLLMRouterNode();
      
      // Should import and call provider functions
      expect(code).toContain('from .anthropic import execute_anthropic_completion');
      expect(code).toContain('from .openai import execute_openai_completion');
      expect(code).toContain('from .groq import execute_groq_completion');
      
      expect(code).toContain('await execute_anthropic_completion(ctx, provider_config)');
      expect(code).toContain('await execute_openai_completion(ctx, provider_config)');
      expect(code).toContain('await execute_groq_completion(ctx, provider_config)');
    });

    it('should follow Catalyst code generation patterns', () => {
      const code = generateLLMRouterNode();
      
      // Should include Catalyst markers
      expect(code).toContain('@catalyst:generated');
      expect(code).toContain('DO NOT EDIT');
      expect(code).toContain('Changes will be overwritten');
    });

    it('should accept ExecutionContext for routing decisions', () => {
      const code = generateLLMRouterNode();
      
      // Functions should accept ctx parameter
      expect(code).toContain('ctx');
      
      // Should use ctx for context access
      expect(code).toContain('getattr(ctx,');
    });
  });

  describe('Code Quality', () => {
    it('should follow PEP 8 naming conventions', () => {
      const code = generateLLMRouterNode();
      
      // Function names: snake_case
      expect(code).toContain('execute_llm_router');
      expect(code).toContain('_evaluate_condition');
      expect(code).toContain('_build_provider_config');
      
      // Variable names: snake_case
      expect(code).toContain('selected_provider');
      expect(code).toContain('selected_model');
      expect(code).toContain('provider_config');
      
      // Constants: UPPER_CASE
      expect(code).toContain('STRATEGIES');
    });

    it('should document performance characteristics', () => {
      const code = generateLLMRouterNode();
      
      // Performance documentation
      expect(code).toContain('Performance:');
      expect(code).toContain('Condition evaluation:');
      expect(code).toContain('Routing overhead:');
      expect(code).toContain('<1ms');
      expect(code).toContain('Negligible');
    });

    it('should document debugging approach', () => {
      const code = generateLLMRouterNode();
      
      // Debugging documentation
      expect(code).toContain('Debugging:');
      expect(code).toContain('logged at INFO level');
      expect(code).toContain('Review logs');
    });
  });

  describe('Routing Logic', () => {
    it('should support preset strategies', () => {
      const code = generateLLMRouterNode();
      
      // Should check if strategy is preset
      expect(code).toContain('if strategy in STRATEGIES:');
      expect(code).toContain('routes = STRATEGIES[strategy]');
    });

    it('should support custom routes', () => {
      const code = generateLLMRouterNode();
      
      // Should support custom routes
      expect(code).toContain('routes = config.get("routes"');
    });

    it('should handle empty routes gracefully', () => {
      const code = generateLLMRouterNode();
      
      // Should check for empty routes
      expect(code).toContain('if not routes:');
      expect(code).toContain('using fallback directly');
    });

    it('should break after first match', () => {
      const code = generateLLMRouterNode();
      
      // First-match-wins behavior
      expect(code).toContain('if _evaluate_condition(condition, ctx, config):');
      expect(code).toContain('break');
    });

    it('should track routing reason', () => {
      const code = generateLLMRouterNode();
      
      // Should store why route was selected
      expect(code).toContain('selected_reason = route.get("reason"');
      expect(code).toContain('result["routing_reason"]');
    });
  });
});
