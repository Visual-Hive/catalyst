/**
 * @file expressions.test.ts
 * @description Unit tests for expression validation and parsing
 * 
 * @architecture Phase 0, Task 0.2 - Manifest Schema Design
 */

import { describe, it, expect } from 'vitest';
import {
  isExpression,
  extractExpressions,
  validateExpression,
  validateConfigExpressions,
  getExpressionContexts,
  usesContext,
  suggestCorrections,
  isValidContext,
  isValidFunction,
  isValidFilter,
} from '../../../src/core/workflow/expressions';

describe('Expression System', () => {
  describe('isExpression', () => {
    it('should detect valid expression syntax', () => {
      expect(isExpression('{{ input.query }}')).toBe(true);
      expect(isExpression('Text with {{ expression }}')).toBe(true);
      expect(isExpression('{{ nodes.node_1.output }}')).toBe(true);
    });
    
    it('should reject non-expression strings', () => {
      expect(isExpression('Plain text')).toBe(false);
      expect(isExpression('{ single brace }')).toBe(false);
      expect(isExpression('')).toBe(false);
    });
  });
  
  describe('extractExpressions', () => {
    it('should extract single expression', () => {
      const result = extractExpressions('{{ input.query }}');
      
      expect(result).toEqual(['input.query']);
    });
    
    it('should extract multiple expressions', () => {
      const result = extractExpressions('Hello {{ input.name }}, your score is {{ nodes.calc.output }}');
      
      expect(result).toEqual(['input.name', 'nodes.calc.output']);
    });
    
    it('should return empty array for no expressions', () => {
      const result = extractExpressions('Plain text');
      
      expect(result).toEqual([]);
    });
    
    it('should trim whitespace from extracted expressions', () => {
      const result = extractExpressions('{{  input.query  }}');
      
      expect(result).toEqual(['input.query']);
    });
  });
  
  describe('validateExpression', () => {
    describe('valid expressions', () => {
      it('should accept simple context access', () => {
        const result = validateExpression('input.query');
        
        expect(result.valid).toBe(true);
        expect(result.errors).toEqual([]);
      });
      
      it('should accept nested property access', () => {
        const result = validateExpression('nodes.node_search.output.results');
        
        expect(result.valid).toBe(true);
      });
      
      it('should accept function calls', () => {
        expect(validateExpression('now()').valid).toBe(true);
        expect(validateExpression('uuid()').valid).toBe(true);
        expect(validateExpression('hash()').valid).toBe(true);
      });
      
      it('should accept expressions with filters', () => {
        expect(validateExpression('input.name | lowercase').valid).toBe(true);
        expect(validateExpression('input.text | truncate').valid).toBe(true);
      });
      
      it('should accept all valid contexts', () => {
        expect(validateExpression('input.value').valid).toBe(true);
        expect(validateExpression('nodes.node_1.output').valid).toBe(true);
        expect(validateExpression('env.API_KEY').valid).toBe(true);
        expect(validateExpression('global.CONFIG').valid).toBe(true);
        expect(validateExpression('secrets.TOKEN').valid).toBe(true);
        expect(validateExpression('execution.id').valid).toBe(true);
        expect(validateExpression('item.name').valid).toBe(true);
        expect(validateExpression('index').valid).toBe(true);
      });
    });
    
    describe('invalid expressions', () => {
      it('should reject empty expression', () => {
        const result = validateExpression('');
        
        expect(result.valid).toBe(false);
        expect(result.errors.length).toBeGreaterThan(0);
      });
      
      it('should reject unknown context', () => {
        const result = validateExpression('unknown.value');
        
        expect(result.valid).toBe(false);
        expect(result.errors[0].message).toContain('Unknown context');
      });
      
      it('should reject invalid syntax', () => {
        const result = validateExpression('..invalid');
        
        expect(result.valid).toBe(false);
      });
      
      it('should reject unknown functions', () => {
        const result = validateExpression('unknownFunc()');
        
        expect(result.valid).toBe(false);
        expect(result.errors[0].message).toContain('Unknown function');
      });
      
      it('should reject unknown filters', () => {
        const result = validateExpression('input.value | unknownFilter');
        
        expect(result.valid).toBe(false);
        expect(result.errors[0].message).toContain('Unknown filter');
      });
      
      it('should reject nodes access without node ID', () => {
        const result = validateExpression('nodes.output');
        
        expect(result.valid).toBe(false);
        expect(result.errors[0].message).toContain('node ID and property');
      });
    });
  });
  
  describe('validateConfigExpressions', () => {
    it('should validate expressions in string values', () => {
      const errors = validateConfigExpressions({
        message: '{{ input.query }}',
      });
      
      expect(errors).toEqual([]);
    });
    
    it('should validate expressions in nested objects', () => {
      const errors = validateConfigExpressions({
        config: {
          prompt: '{{ input.text }}',
          model: '{{ global.MODEL }}',
        },
      });
      
      expect(errors).toEqual([]);
    });
    
    it('should detect invalid expressions in nested structures', () => {
      const errors = validateConfigExpressions({
        messages: [
          { content: '{{ unknown.value }}' },
        ],
      });
      
      expect(errors.length).toBeGreaterThan(0);
    });
    
    it('should validate arrays', () => {
      const errors = validateConfigExpressions([
        '{{ input.value1 }}',
        '{{ input.value2 }}',
      ]);
      
      expect(errors).toEqual([]);
    });
  });
  
  describe('getExpressionContexts', () => {
    it('should identify single context', () => {
      const contexts = getExpressionContexts('{{ input.query }}');
      
      expect(contexts).toEqual(['input']);
    });
    
    it('should identify multiple contexts', () => {
      const contexts = getExpressionContexts('{{ input.query }} {{ env.API_KEY }}');
      
      expect(contexts).toContain('input');
      expect(contexts).toContain('env');
    });
    
    it('should deduplicate contexts', () => {
      const contexts = getExpressionContexts('{{ input.a }} {{ input.b }}');
      
      expect(contexts).toEqual(['input']);
    });
  });
  
  describe('usesContext', () => {
    it('should detect context usage', () => {
      expect(usesContext('{{ input.query }}', 'input')).toBe(true);
      expect(usesContext('{{ env.KEY }}', 'env')).toBe(true);
    });
    
    it('should return false for unused context', () => {
      expect(usesContext('{{ input.query }}', 'env')).toBe(false);
    });
  });
  
  describe('suggestCorrections', () => {
    it('should suggest corrections for common typos', () => {
      const suggestions = suggestCorrections('inputs.query');
      
      expect(suggestions).toContain('input.query');
    });
    
    it('should suggest corrections for node/nodes typo', () => {
      const suggestions = suggestCorrections('node.search.output');
      
      expect(suggestions).toContain('nodes.search.output');
    });
    
    it('should suggest similar valid contexts', () => {
      const suggestions = suggestCorrections('inp.query');
      
      expect(suggestions.some(s => s.startsWith('input'))).toBe(true);
    });
  });
  
  describe('Helper Functions', () => {
    it('isValidContext should validate context names', () => {
      expect(isValidContext('input')).toBe(true);
      expect(isValidContext('nodes')).toBe(true);
      expect(isValidContext('invalid')).toBe(false);
    });
    
    it('isValidFunction should validate function names', () => {
      expect(isValidFunction('now')).toBe(true);
      expect(isValidFunction('uuid')).toBe(true);
      expect(isValidFunction('invalid')).toBe(false);
    });
    
    it('isValidFilter should validate filter names', () => {
      expect(isValidFilter('lowercase')).toBe(true);
      expect(isValidFilter('truncate')).toBe(true);
      expect(isValidFilter('invalid')).toBe(false);
    });
  });
});
