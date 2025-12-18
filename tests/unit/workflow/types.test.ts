/**
 * @file types.test.ts
 * @description Unit tests for workflow type factory functions
 * 
 * @architecture Phase 0, Task 0.2 - Manifest Schema Design
 */

import { describe, it, expect } from 'vitest';
import {
  createEmptyManifest,
  createWorkflow,
  createNode,
  createEdge,
  generateNodeId,
  generateEdgeId,
  generateWorkflowId,
} from '../../../src/core/workflow/types';

describe('Workflow Type Factory Functions', () => {
  describe('createEmptyManifest', () => {
    it('should create a valid empty manifest', () => {
      const manifest = createEmptyManifest();
      
      expect(manifest.schemaVersion).toBe('1.0.0');
      expect(manifest.projectType).toBe('workflow');
      expect(manifest.metadata.projectName).toBe('New Project');
      expect(manifest.config.runtime).toBe('python');
      expect(manifest.config.pythonVersion).toBe('3.11');
      expect(manifest.config.framework).toBe('fastapi');
      expect(manifest.config.port).toBe(8000);
      expect(manifest.workflows).toEqual({});
      expect(manifest.secrets).toEqual({});
      expect(manifest.globalVariables).toEqual({});
    });
    
    it('should have valid ISO datetime strings', () => {
      const manifest = createEmptyManifest();
      
      expect(manifest.metadata.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
      expect(manifest.metadata.updatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
      expect(new Date(manifest.metadata.createdAt).toString()).not.toBe('Invalid Date');
    });
  });
  
  describe('createWorkflow', () => {
    it('should create a workflow with httpEndpoint trigger by default', () => {
      const workflow = createWorkflow('test', 'Test Workflow');
      
      expect(workflow.id).toBe('test');
      expect(workflow.name).toBe('Test Workflow');
      expect(workflow.trigger.type).toBe('httpEndpoint');
      expect(workflow.trigger.config).toHaveProperty('method', 'POST');
      expect(workflow.trigger.config).toHaveProperty('path', '/api/test');
      expect(workflow.output.type).toBe('json');
      expect(workflow.nodes).toEqual({});
      expect(workflow.edges).toEqual([]);
    });
    
    it('should create a workflow with scheduledTask trigger', () => {
      const workflow = createWorkflow('cron', 'Cron Workflow', 'scheduledTask');
      
      expect(workflow.trigger.type).toBe('scheduledTask');
      expect(workflow.trigger.config).toEqual({});
    });
    
    it('should have empty input and output objects', () => {
      const workflow = createWorkflow('test', 'Test');
      
      expect(workflow.input).toEqual({});
      expect(workflow.output).toHaveProperty('type');
    });
  });
  
  describe('createNode', () => {
    it('should create a node with all required properties', () => {
      const node = createNode(
        'log',
        'Test Log',
        { x: 100, y: 200 },
        { level: 'info', message: 'Test' }
      );
      
      expect(node.id).toMatch(/^node_log_/);
      expect(node.type).toBe('log');
      expect(node.name).toBe('Test Log');
      expect(node.position).toEqual({ x: 100, y: 200 });
      expect(node.config).toEqual({ level: 'info', message: 'Test' });
    });
    
    it('should create node with empty config if not provided', () => {
      const node = createNode('log', 'Test', { x: 0, y: 0 });
      
      expect(node.config).toEqual({});
    });
    
    it('should generate unique IDs for multiple nodes', () => {
      const node1 = createNode('log', 'Test 1', { x: 0, y: 0 });
      const node2 = createNode('log', 'Test 2', { x: 0, y: 0 });
      
      expect(node1.id).not.toBe(node2.id);
    });
  });
  
  describe('createEdge', () => {
    it('should create an edge with source and target', () => {
      const edge = createEdge('node_1', 'node_2');
      
      expect(edge.id).toMatch(/^edge_/);
      expect(edge.source).toBe('node_1');
      expect(edge.target).toBe('node_2');
      expect(edge.condition).toBeUndefined();
    });
    
    it('should create an edge with condition', () => {
      const edge = createEdge('node_1', 'node_2', '{{ result.success }}');
      
      expect(edge.condition).toBe('{{ result.success }}');
    });
    
    it('should generate unique IDs for multiple edges', () => {
      const edge1 = createEdge('node_1', 'node_2');
      const edge2 = createEdge('node_1', 'node_2');
      
      expect(edge1.id).not.toBe(edge2.id);
    });
  });
  
  describe('ID Generators', () => {
    it('generateNodeId should include node type', () => {
      const id = generateNodeId('anthropicCompletion');
      
      expect(id).toMatch(/^node_anthropicCompletion_\d+_[a-z0-9]{4}$/);
    });
    
    it('generateEdgeId should have correct format', () => {
      const id = generateEdgeId();
      
      expect(id).toMatch(/^edge_\d+_[a-z0-9]{4}$/);
    });
    
    it('generateWorkflowId should slugify name', () => {
      const id = generateWorkflowId('Conference Search');
      
      expect(id).toMatch(/^wf_conference_search_\d+$/);
    });
    
    it('generateWorkflowId should handle special characters', () => {
      const id = generateWorkflowId('Test & Demo!');
      
      expect(id).toMatch(/^wf_test_demo_\d+$/);
    });
  });
});
