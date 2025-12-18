/**
 * @file validation.test.ts
 * @description Unit tests for workflow manifest validation
 * 
 * @architecture Phase 0, Task 0.2 - Manifest Schema Design
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';
import { validateManifest, validateWorkflow, validateNode } from '../../../src/core/workflow/validation';
import { createEmptyManifest, createWorkflow } from '../../../src/core/workflow/types';

describe('Workflow Validation', () => {
  describe('validateManifest', () => {
    it('should accept valid empty manifest', () => {
      const manifest = createEmptyManifest();
      const result = validateManifest(manifest);
      
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.errors).toBeNull();
    });
    
    it('should accept manifest with workflow', () => {
      const manifest = createEmptyManifest();
      manifest.workflows['test'] = createWorkflow('test', 'Test Workflow');
      
      const result = validateManifest(manifest);
      
      if (!result.success) {
        console.log('Validation errors:', result.errors);
      }
      expect(result.success).toBe(true);
    });
    
    it('should reject manifest with invalid projectType', () => {
      const manifest = createEmptyManifest();
      (manifest as any).projectType = 'invalid';
      
      const result = validateManifest(manifest);
      
      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors!.length).toBeGreaterThan(0);
    });
    
    it('should reject manifest with missing required fields', () => {
      const invalid = {
        schemaVersion: '1.0.0',
        // missing projectType
      };
      
      const result = validateManifest(invalid);
      
      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
    });
    
    it('should validate simple-http.json fixture', () => {
      const fixturePath = join(__dirname, '../../fixtures/workflows/simple-http.json');
      const json = JSON.parse(readFileSync(fixturePath, 'utf-8'));
      
      const result = validateManifest(json);
      
      expect(result.success).toBe(true);
    });
    
    it('should validate llm-completion.json fixture', () => {
      const fixturePath = join(__dirname, '../../fixtures/workflows/llm-completion.json');
      const json = JSON.parse(readFileSync(fixturePath, 'utf-8'));
      
      const result = validateManifest(json);
      
      expect(result.success).toBe(true);
    });
  });
  
  describe('validateWorkflow', () => {
    it('should accept valid workflow definition', () => {
      const workflow = createWorkflow('test', 'Test');
      const result = validateWorkflow(workflow);
      
      expect(result.success).toBe(true);
    });
    
    it('should reject workflow with invalid trigger type', () => {
      const workflow = createWorkflow('test', 'Test');
      (workflow.trigger as any).type = 'invalidTrigger';
      
      const result = validateWorkflow(workflow);
      
      expect(result.success).toBe(false);
    });
    
    it('should reject workflow with missing required fields', () => {
      const invalid = {
        id: 'test',
        // missing name, trigger, etc.
      };
      
      const result = validateWorkflow(invalid);
      
      expect(result.success).toBe(false);
    });
  });
  
  describe('validateNode', () => {
    it('should accept valid node definition', () => {
      const node = {
        id: 'node_1',
        type: 'log',
        name: 'Test Log',
        position: { x: 0, y: 0 },
        config: { level: 'info', message: 'test' },
      };
      
      const result = validateNode(node);
      
      expect(result.success).toBe(true);
    });
    
    it('should reject node with invalid type', () => {
      const node = {
        id: 'node_1',
        type: 'invalidNodeType',
        name: 'Test',
        position: { x: 0, y: 0 },
        config: {},
      };
      
      const result = validateNode(node);
      
      expect(result.success).toBe(false);
    });
    
    it('should reject node with missing position', () => {
      const node = {
        id: 'node_1',
        type: 'log',
        name: 'Test',
        // missing position
        config: {},
      };
      
      const result = validateNode(node);
      
      expect(result.success).toBe(false);
    });
  });
});
