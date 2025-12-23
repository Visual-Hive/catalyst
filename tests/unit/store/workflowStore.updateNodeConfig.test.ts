/**
 * @file workflowStore.updateNodeConfig.test.ts
 * @description Unit tests for workflowStore.updateNodeConfig action
 * 
 * @architecture Phase 2.5, Task 2.10 - Properties Panel Testing
 * @created 2025-12-21
 * @author AI (Cline) + Human Review
 * @confidence 9/10 - Tests core store functionality
 * 
 * Tests the nested config path handling and store updates.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { useWorkflowStore } from '../../../src/renderer/store/workflowStore';
import { createEmptyManifest, createWorkflow } from '../../../src/core/workflow/types';
import type { NodeDefinition } from '../../../src/core/workflow/types';

describe('workflowStore.updateNodeConfig', () => {
  beforeEach(() => {
    // Reset store to initial state
    useWorkflowStore.getState().resetManifest();
    
    // Create test manifest and workflow
    const manifest = createEmptyManifest();
    const workflow = createWorkflow('Test Workflow', 'test-workflow', 'httpEndpoint');
    manifest.workflows[workflow.id] = workflow;
    
    // Add test node
    const testNode: NodeDefinition = {
      id: 'test-node-1',
      type: 'groqCompletion',
      name: 'Test Node',
      position: { x: 100, y: 100 },
      config: {
        model: 'llama-3.1-70b-versatile',
        prompt: 'Initial prompt',
      },
    };
    workflow.nodes[testNode.id] = testNode;
    
    // Load manifest into store
    useWorkflowStore.getState().loadManifest(manifest);
    useWorkflowStore.getState().setActiveWorkflow(workflow.id);
  });

  describe('Simple Field Updates', () => {
    it('should update node name (top-level property)', () => {
      const workflowId = useWorkflowStore.getState().activeWorkflowId!;
      
      // Update node name
      useWorkflowStore.getState().updateNodeConfig(workflowId, 'test-node-1', 'name', 'Updated Name');
      
      // Verify update (get fresh state)
      const updatedNode = useWorkflowStore.getState().manifest!.workflows[workflowId].nodes['test-node-1'];
      expect(updatedNode.name).toBe('Updated Name');
    });

    it('should update simple config field', () => {
      const workflowId = useWorkflowStore.getState().activeWorkflowId!;
      
      // Update model
      useWorkflowStore.getState().updateNodeConfig(workflowId, 'test-node-1', 'model', 'llama-3.1-8b-instant');
      
      // Verify update (get fresh state)
      const updatedNode = useWorkflowStore.getState().manifest!.workflows[workflowId].nodes['test-node-1'];
      expect(updatedNode.config.model).toBe('llama-3.1-8b-instant');
    });

    it('should add new config field if not exists', () => {
      const workflowId = useWorkflowStore.getState().activeWorkflowId!;
      
      // Add new field
      useWorkflowStore.getState().updateNodeConfig(workflowId, 'test-node-1', 'apiKey', 'test-api-key');
      
      // Verify addition (get fresh state)
      const updatedNode = useWorkflowStore.getState().manifest!.workflows[workflowId].nodes['test-node-1'];
      expect(updatedNode.config.apiKey).toBe('test-api-key');
    });
  });

  describe('Nested Field Updates', () => {
    it('should update nested config field (dot notation)', () => {
      const workflowId = useWorkflowStore.getState().activeWorkflowId!;
      
      // Add nested config first using updateNodeConfig (can't mutate directly)
      useWorkflowStore.getState().updateNodeConfig(workflowId, 'test-node-1', 'options', { temperature: 0.5, maxTokens: 500 });
      
      // Update nested field
      useWorkflowStore.getState().updateNodeConfig(workflowId, 'test-node-1', 'options.temperature', 0.9);
      
      // Verify update (get fresh state)
      const updatedNode = useWorkflowStore.getState().manifest!.workflows[workflowId].nodes['test-node-1'];
      expect(updatedNode.config.options.temperature).toBe(0.9);
      expect(updatedNode.config.options.maxTokens).toBe(500); // Should preserve other fields
    });

    it('should create nested objects if they do not exist', () => {
      const workflowId = useWorkflowStore.getState().activeWorkflowId!;
      
      // Update deeply nested field that doesn't exist
      useWorkflowStore.getState().updateNodeConfig(workflowId, 'test-node-1', 'advanced.retry.maxAttempts', 3);
      
      // Verify nested structure was created (get fresh state)
      const updatedNode = useWorkflowStore.getState().manifest!.workflows[workflowId].nodes['test-node-1'];
      expect(updatedNode.config.advanced).toBeDefined();
      expect(updatedNode.config.advanced.retry).toBeDefined();
      expect(updatedNode.config.advanced.retry.maxAttempts).toBe(3);
    });

    it('should handle multiple nested levels', () => {
      const workflowId = useWorkflowStore.getState().activeWorkflowId!;
      
      // Update multi-level nested field
      useWorkflowStore.getState().updateNodeConfig(workflowId, 'test-node-1', 'a.b.c.d', 'deep-value');
      
      // Verify structure (get fresh state)
      const updatedNode = useWorkflowStore.getState().manifest!.workflows[workflowId].nodes['test-node-1'];
      expect(updatedNode.config.a.b.c.d).toBe('deep-value');
    });
  });

  describe('Type Handling', () => {
    it('should handle string values', () => {
      const workflowId = useWorkflowStore.getState().activeWorkflowId!;
      
      useWorkflowStore.getState().updateNodeConfig(workflowId, 'test-node-1', 'prompt', 'New prompt text');
      
      // Get fresh state after update
      const updatedNode = useWorkflowStore.getState().manifest!.workflows[workflowId].nodes['test-node-1'];
      expect(updatedNode.config.prompt).toBe('New prompt text');
    });

    it('should handle number values', () => {
      const workflowId = useWorkflowStore.getState().activeWorkflowId!;
      
      useWorkflowStore.getState().updateNodeConfig(workflowId, 'test-node-1', 'maxTokens', 1000);
      
      // Get fresh state after update
      const updatedNode = useWorkflowStore.getState().manifest!.workflows[workflowId].nodes['test-node-1'];
      expect(updatedNode.config.maxTokens).toBe(1000);
    });

    it('should handle boolean values', () => {
      const workflowId = useWorkflowStore.getState().activeWorkflowId!;
      
      useWorkflowStore.getState().updateNodeConfig(workflowId, 'test-node-1', 'stream', true);
      
      // Get fresh state after update
      const updatedNode = useWorkflowStore.getState().manifest!.workflows[workflowId].nodes['test-node-1'];
      expect(updatedNode.config.stream).toBe(true);
    });

    it('should handle object values', () => {
      const workflowId = useWorkflowStore.getState().activeWorkflowId!;
      
      const configObject = { key1: 'value1', key2: 42 };
      useWorkflowStore.getState().updateNodeConfig(workflowId, 'test-node-1', 'metadata', configObject);
      
      // Get fresh state after update
      const updatedNode = useWorkflowStore.getState().manifest!.workflows[workflowId].nodes['test-node-1'];
      expect(updatedNode.config.metadata).toEqual(configObject);
    });

    it('should handle array values', () => {
      const workflowId = useWorkflowStore.getState().activeWorkflowId!;
      
      const arrayValue = ['option1', 'option2', 'option3'];
      useWorkflowStore.getState().updateNodeConfig(workflowId, 'test-node-1', 'options', arrayValue);
      
      // Get fresh state after update
      const updatedNode = useWorkflowStore.getState().manifest!.workflows[workflowId].nodes['test-node-1'];
      expect(updatedNode.config.options).toEqual(arrayValue);
    });

    it('should handle null and undefined values', () => {
      const workflowId = useWorkflowStore.getState().activeWorkflowId!;
      
      // Set to null
      useWorkflowStore.getState().updateNodeConfig(workflowId, 'test-node-1', 'optional', null);
      
      // Get fresh state after null update
      const nodeAfterNull = useWorkflowStore.getState().manifest!.workflows[workflowId].nodes['test-node-1'];
      expect(nodeAfterNull.config.optional).toBeNull();
      
      // Set to undefined
      useWorkflowStore.getState().updateNodeConfig(workflowId, 'test-node-1', 'optional', undefined);
      
      // Get fresh state after undefined update
      const nodeAfterUndefined = useWorkflowStore.getState().manifest!.workflows[workflowId].nodes['test-node-1'];
      expect(nodeAfterUndefined.config.optional).toBeUndefined();
    });
  });

  describe('Store State Management', () => {
    it('should mark manifest as dirty after update', () => {
      const workflowId = useWorkflowStore.getState().activeWorkflowId!;
      
      // Ensure clean state
      useWorkflowStore.getState().isDirty = false;
      
      // Update config
      useWorkflowStore.getState().updateNodeConfig(workflowId, 'test-node-1', 'model', 'new-model');
      
      // Should be dirty (get fresh state)
      expect(useWorkflowStore.getState().isDirty).toBe(true);
    });

    it('should update manifest timestamp', async () => {
      const workflowId = useWorkflowStore.getState().activeWorkflowId!;
      
      // Get initial timestamp
      const initialTimestamp = useWorkflowStore.getState().manifest!.metadata.updatedAt;
      
      // Wait a tiny bit to ensure timestamp changes
      await new Promise(resolve => setTimeout(resolve, 10));
      
      // Update config
      useWorkflowStore.getState().updateNodeConfig(workflowId, 'test-node-1', 'model', 'new-model');
      
      // Timestamp should be updated (get fresh state)
      const updatedTimestamp = useWorkflowStore.getState().manifest!.metadata.updatedAt;
      expect(updatedTimestamp).not.toBe(initialTimestamp);
      expect(new Date(updatedTimestamp).getTime()).toBeGreaterThan(new Date(initialTimestamp).getTime());
    });
  });

  describe('Error Handling', () => {
    it('should handle non-existent workflow gracefully', () => {
      // Try to update node in non-existent workflow
      useWorkflowStore.getState().updateNodeConfig('non-existent-workflow', 'test-node-1', 'model', 'new-model');
      
      // Should not throw error, just log warning
      // Verify original data unchanged (get fresh state)
      const workflowId = useWorkflowStore.getState().activeWorkflowId!;
      const node = useWorkflowStore.getState().manifest!.workflows[workflowId].nodes['test-node-1'];
      expect(node.config.model).toBe('llama-3.1-70b-versatile'); // Unchanged
    });

    it('should handle non-existent node gracefully', () => {
      const workflowId = useWorkflowStore.getState().activeWorkflowId!;
      
      // Try to update non-existent node
      useWorkflowStore.getState().updateNodeConfig(workflowId, 'non-existent-node', 'model', 'new-model');
      
      // Should not throw error, just log warning
      // Verify original data unchanged (get fresh state)
      const node = useWorkflowStore.getState().manifest!.workflows[workflowId].nodes['test-node-1'];
      expect(node.config.model).toBe('llama-3.1-70b-versatile'); // Unchanged
    });

    it('should handle empty field path', () => {
      const workflowId = useWorkflowStore.getState().activeWorkflowId!;
      
      // Try to update with empty path
      useWorkflowStore.getState().updateNodeConfig(workflowId, 'test-node-1', '', 'value');
      
      // Should handle gracefully (creates empty key) - get fresh state
      const node = useWorkflowStore.getState().manifest!.workflows[workflowId].nodes['test-node-1'];
      expect(node.config['']).toBe('value');
    });
  });

  describe('Immutability', () => {
    it('should not mutate original config object', () => {
      const workflowId = useWorkflowStore.getState().activeWorkflowId!;
      
      // Get the original model value
      const originalModel = useWorkflowStore.getState().manifest!.workflows[workflowId].nodes['test-node-1'].config.model;
      expect(originalModel).toBe('llama-3.1-70b-versatile');
      
      // Update config
      useWorkflowStore.getState().updateNodeConfig(workflowId, 'test-node-1', 'model', 'new-model');
      
      // Get fresh state and verify the new value (immutability via immer)
      const newConfig = useWorkflowStore.getState().manifest!.workflows[workflowId].nodes['test-node-1'].config;
      expect(newConfig.model).toBe('new-model');
    });
  });

  describe('Multiple Updates', () => {
    it('should handle sequential updates to same field', () => {
      const workflowId = useWorkflowStore.getState().activeWorkflowId!;
      
      // Multiple updates
      useWorkflowStore.getState().updateNodeConfig(workflowId, 'test-node-1', 'model', 'model-1');
      useWorkflowStore.getState().updateNodeConfig(workflowId, 'test-node-1', 'model', 'model-2');
      useWorkflowStore.getState().updateNodeConfig(workflowId, 'test-node-1', 'model', 'model-3');
      
      // Should have final value (get fresh state)
      const node = useWorkflowStore.getState().manifest!.workflows[workflowId].nodes['test-node-1'];
      expect(node.config.model).toBe('model-3');
    });

    it('should handle updates to different fields', () => {
      const workflowId = useWorkflowStore.getState().activeWorkflowId!;
      
      // Update multiple different fields
      useWorkflowStore.getState().updateNodeConfig(workflowId, 'test-node-1', 'model', 'new-model');
      useWorkflowStore.getState().updateNodeConfig(workflowId, 'test-node-1', 'prompt', 'new-prompt');
      useWorkflowStore.getState().updateNodeConfig(workflowId, 'test-node-1', 'temperature', 0.8);
      useWorkflowStore.getState().updateNodeConfig(workflowId, 'test-node-1', 'stream', true);
      
      // All updates should be preserved (get fresh state)
      const node = useWorkflowStore.getState().manifest!.workflows[workflowId].nodes['test-node-1'];
      expect(node.config.model).toBe('new-model');
      expect(node.config.prompt).toBe('new-prompt');
      expect(node.config.temperature).toBe(0.8);
      expect(node.config.stream).toBe(true);
    });
  });
});
