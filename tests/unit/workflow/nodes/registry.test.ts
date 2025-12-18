/**
 * @file registry.test.ts
 * @description Unit tests for node registry system
 * 
 * @architecture Phase 0, Task 0.3 - Node Type System
 * @created 2025-12-18
 */

import { describe, it, expect } from 'vitest';
import {
  NODE_REGISTRY,
  CATEGORY_REGISTRY,
  getNodeMetadata,
  getNodesByCategory,
  getImplementedNodes,
  getStubNodes,
  getNodesByPhase,
  searchNodes,
  getAllNodeTypes,
  isValidNodeType,
  isNodeImplemented,
  getNodeStats,
  getNodesGroupedByCategory,
  getAllCategories,
  getCategoryMetadata,
  validateNodeConfig,
} from '../../../../src/core/workflow/nodes';

describe('Node Registry', () => {
  describe('NODE_REGISTRY', () => {
    it('should contain all 55 node types', () => {
      const nodeTypes = Object.keys(NODE_REGISTRY);
      expect(nodeTypes.length).toBe(55);
    });

    it('should have valid metadata for each node', () => {
      Object.entries(NODE_REGISTRY).forEach(([type, metadata]) => {
        expect(metadata.type).toBe(type);
        expect(metadata.name).toBeTruthy();
        expect(metadata.description).toBeTruthy();
        expect(metadata.icon).toBeTruthy();
        expect(metadata.color).toBeTruthy();
        expect(metadata.category).toBeTruthy();
        expect(Array.isArray(metadata.inputs)).toBe(true);
        expect(Array.isArray(metadata.outputs)).toBe(true);
        expect(metadata.configSchema).toBeTruthy();
        expect(typeof metadata.implemented).toBe('boolean');
      });
    });

    it('should have exactly 10 implemented (CORE) nodes', () => {
      const implemented = Object.values(NODE_REGISTRY).filter(n => n.implemented);
      expect(implemented.length).toBe(10);
      
      // Verify the 10 CORE nodes
      const coreNodes = [
        'httpEndpoint',
        'scheduledTask',
        'anthropicCompletion',
        'openaiCompletion',
        'qdrantSearch',
        'postgresQuery',
        'condition',
        'parallel',
        'editFields',
        'log',
      ];
      
      coreNodes.forEach(nodeType => {
        expect(NODE_REGISTRY[nodeType as keyof typeof NODE_REGISTRY].implemented).toBe(true);
      });
    });

    it('should have 45 stub nodes', () => {
      const stub = Object.values(NODE_REGISTRY).filter(n => !n.implemented);
      expect(stub.length).toBe(45);
    });

    it('should have valid Tailwind color classes', () => {
      const validColors = [
        'bg-green-500',
        'bg-purple-500',
        'bg-blue-500',
        'bg-orange-500',
        'bg-yellow-500',
        'bg-teal-500',
        'bg-pink-500',
        'bg-gray-500',
      ];

      Object.values(NODE_REGISTRY).forEach(node => {
        expect(validColors).toContain(node.color);
      });
    });

    it('should have valid category for each node', () => {
      const validCategories = [
        'triggers',
        'llm',
        'data',
        'http',
        'control',
        'transform',
        'streaming',
        'utilities',
      ];

      Object.values(NODE_REGISTRY).forEach(node => {
        expect(validCategories).toContain(node.category);
      });
    });

    it('should have valid handle definitions', () => {
      Object.values(NODE_REGISTRY).forEach(node => {
        node.inputs.forEach(handle => {
          expect(handle.id).toBeTruthy();
          expect(handle.name).toBeTruthy();
          expect(['default', 'conditional']).toContain(handle.type);
        });

        node.outputs.forEach(handle => {
          expect(handle.id).toBeTruthy();
          expect(handle.name).toBeTruthy();
          expect(['default', 'conditional']).toContain(handle.type);
        });
      });
    });

    it('triggers should have no inputs', () => {
      const triggers = Object.values(NODE_REGISTRY).filter(
        n => n.category === 'triggers'
      );

      triggers.forEach(trigger => {
        expect(trigger.inputs.length).toBe(0);
        expect(trigger.outputs.length).toBeGreaterThan(0);
      });
    });
  });

  describe('CATEGORY_REGISTRY', () => {
    it('should contain all 8 categories', () => {
      const categories = Object.keys(CATEGORY_REGISTRY);
      expect(categories.length).toBe(8);
    });

    it('should have valid metadata for each category', () => {
      Object.entries(CATEGORY_REGISTRY).forEach(([id, metadata]) => {
        expect(metadata.id).toBe(id);
        expect(metadata.name).toBeTruthy();
        expect(metadata.description).toBeTruthy();
        expect(metadata.icon).toBeTruthy();
        expect(metadata.color).toBeTruthy();
        expect(typeof metadata.order).toBe('number');
      });
    });

    it('should have sequential order numbers', () => {
      const orders = Object.values(CATEGORY_REGISTRY).map(c => c.order);
      const sortedOrders = [...orders].sort((a, b) => a - b);
      expect(orders).toEqual(sortedOrders);
      expect(orders).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
    });
  });

  describe('getNodeMetadata', () => {
    it('should return metadata for valid node type', () => {
      const metadata = getNodeMetadata('anthropicCompletion');
      expect(metadata).toBeDefined();
      expect(metadata?.name).toBe('Claude (Anthropic)');
      expect(metadata?.category).toBe('llm');
    });

    it('should return undefined for invalid node type', () => {
      const metadata = getNodeMetadata('invalidNodeType' as any);
      expect(metadata).toBeUndefined();
    });
  });

  describe('getNodesByCategory', () => {
    it('should return all triggers (6 nodes)', () => {
      const triggers = getNodesByCategory('triggers');
      expect(triggers.length).toBe(6);
      triggers.forEach(node => {
        expect(node.category).toBe('triggers');
      });
    });

    it('should return all LLM nodes (8 nodes)', () => {
      const llmNodes = getNodesByCategory('llm');
      expect(llmNodes.length).toBe(8);
    });

    it('should return all data nodes (8 nodes)', () => {
      const dataNodes = getNodesByCategory('data');
      expect(dataNodes.length).toBe(8);
    });

    it('should return all HTTP nodes (4 nodes)', () => {
      const httpNodes = getNodesByCategory('http');
      expect(httpNodes.length).toBe(4);
    });

    it('should return all control flow nodes (8 nodes)', () => {
      const controlNodes = getNodesByCategory('control');
      expect(controlNodes.length).toBe(8);
    });

    it('should return all transform nodes (8 nodes)', () => {
      const transformNodes = getNodesByCategory('transform');
      expect(transformNodes.length).toBe(8);
    });

    it('should return all streaming nodes (5 nodes)', () => {
      const streamingNodes = getNodesByCategory('streaming');
      expect(streamingNodes.length).toBe(5);
    });

    it('should return all utility nodes (8 nodes)', () => {
      const utilityNodes = getNodesByCategory('utilities');
      expect(utilityNodes.length).toBe(8);
    });
  });

  describe('getImplementedNodes', () => {
    it('should return 10 implemented nodes', () => {
      const implemented = getImplementedNodes();
      expect(implemented.length).toBe(10);
      implemented.forEach(node => {
        expect(node.implemented).toBe(true);
        expect(node.phase).toBe(0);
      });
    });
  });

  describe('getStubNodes', () => {
    it('should return 45 stub nodes', () => {
      const stub = getStubNodes();
      expect(stub.length).toBe(45);
      stub.forEach(node => {
        expect(node.implemented).toBe(false);
        expect(node.phase).toBeGreaterThan(0);
      });
    });
  });

  describe('getNodesByPhase', () => {
    it('should return Phase 0 nodes (10 CORE nodes)', () => {
      const phase0 = getNodesByPhase(0);
      expect(phase0.length).toBe(10);
      phase0.forEach(node => {
        expect(node.phase).toBe(0);
        expect(node.implemented).toBe(true);
      });
    });

    it('should return Phase 1 nodes', () => {
      const phase1 = getNodesByPhase(1);
      expect(phase1.length).toBeGreaterThan(0);
      phase1.forEach(node => {
        expect(node.phase).toBe(1);
      });
    });

    it('should return empty array for non-existent phase', () => {
      const phase99 = getNodesByPhase(99);
      expect(phase99.length).toBe(0);
    });
  });

  describe('searchNodes', () => {
    it('should find nodes by name', () => {
      const results = searchNodes('claude');
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].name).toContain('Claude');
    });

    it('should find nodes by description', () => {
      const results = searchNodes('streaming');
      expect(results.length).toBeGreaterThan(0);
    });

    it('should find nodes by type', () => {
      const results = searchNodes('anthropic');
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].type).toBe('anthropicCompletion');
    });

    it('should be case-insensitive', () => {
      const lower = searchNodes('claude');
      const upper = searchNodes('CLAUDE');
      expect(lower).toEqual(upper);
    });

    it('should return empty array for no matches', () => {
      const results = searchNodes('nonexistentnodexyz123');
      expect(results.length).toBe(0);
    });

    it('should find multiple nodes with partial match', () => {
      const results = searchNodes('completion');
      expect(results.length).toBeGreaterThanOrEqual(3); // Multiple LLM nodes
    });
  });

  describe('getAllNodeTypes', () => {
    it('should return all 55 node types', () => {
      const types = getAllNodeTypes();
      expect(types.length).toBe(55);
    });

    it('should include known node types', () => {
      const types = getAllNodeTypes();
      expect(types).toContain('anthropicCompletion');
      expect(types).toContain('httpEndpoint');
      expect(types).toContain('condition');
    });
  });

  describe('isValidNodeType', () => {
    it('should return true for valid node types', () => {
      expect(isValidNodeType('anthropicCompletion')).toBe(true);
      expect(isValidNodeType('httpEndpoint')).toBe(true);
      expect(isValidNodeType('condition')).toBe(true);
    });

    it('should return false for invalid node types', () => {
      expect(isValidNodeType('invalidNodeType')).toBe(false);
      expect(isValidNodeType('')).toBe(false);
      expect(isValidNodeType('not-a-node')).toBe(false);
    });
  });

  describe('isNodeImplemented', () => {
    it('should return true for implemented nodes', () => {
      expect(isNodeImplemented('anthropicCompletion')).toBe(true);
      expect(isNodeImplemented('httpEndpoint')).toBe(true);
      expect(isNodeImplemented('condition')).toBe(true);
    });

    it('should return false for stub nodes', () => {
      expect(isNodeImplemented('webhookReceiver')).toBe(false);
      expect(isNodeImplemented('groqCompletion')).toBe(false);
      expect(isNodeImplemented('loop')).toBe(false);
    });
  });

  describe('getNodeStats', () => {
    it('should return correct total count', () => {
      const stats = getNodeStats();
      expect(stats.total).toBe(55);
    });

    it('should return correct implemented count', () => {
      const stats = getNodeStats();
      expect(stats.implemented).toBe(10);
    });

    it('should return correct stub count', () => {
      const stats = getNodeStats();
      expect(stats.stub).toBe(45);
    });

    it('should return correct category counts', () => {
      const stats = getNodeStats();
      expect(stats.byCategory.triggers).toBe(6);
      expect(stats.byCategory.llm).toBe(8);
      expect(stats.byCategory.data).toBe(8);
      expect(stats.byCategory.http).toBe(4);
      expect(stats.byCategory.control).toBe(8);
      expect(stats.byCategory.transform).toBe(8);
      expect(stats.byCategory.streaming).toBe(5);
      expect(stats.byCategory.utilities).toBe(8);
    });

    it('should return phase counts', () => {
      const stats = getNodeStats();
      expect(stats.byPhase[0]).toBe(10);
      expect(Object.keys(stats.byPhase).length).toBeGreaterThan(1);
    });
  });

  describe('getNodesGroupedByCategory', () => {
    it('should group all nodes by category', () => {
      const grouped = getNodesGroupedByCategory();
      
      expect(grouped.triggers.length).toBe(6);
      expect(grouped.llm.length).toBe(8);
      expect(grouped.data.length).toBe(8);
      expect(grouped.http.length).toBe(4);
      expect(grouped.control.length).toBe(8);
      expect(grouped.transform.length).toBe(8);
      expect(grouped.streaming.length).toBe(5);
      expect(grouped.utilities.length).toBe(8);
    });

    it('should have correct category assignment', () => {
      const grouped = getNodesGroupedByCategory();
      
      grouped.triggers.forEach(node => {
        expect(node.category).toBe('triggers');
      });
      
      grouped.llm.forEach(node => {
        expect(node.category).toBe('llm');
      });
    });
  });

  describe('getAllCategories', () => {
    it('should return all 8 categories', () => {
      const categories = getAllCategories();
      expect(categories.length).toBe(8);
    });

    it('should return categories sorted by order', () => {
      const categories = getAllCategories();
      const orders = categories.map(c => c.order);
      expect(orders).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
    });
  });

  describe('getCategoryMetadata', () => {
    it('should return metadata for valid category', () => {
      const metadata = getCategoryMetadata('triggers');
      expect(metadata).toBeDefined();
      expect(metadata?.name).toBe('Triggers');
      expect(metadata?.order).toBe(1);
    });

    it('should return undefined for invalid category', () => {
      const metadata = getCategoryMetadata('invalid');
      expect(metadata).toBeUndefined();
    });
  });

  describe('validateNodeConfig', () => {
    it('should accept valid config', () => {
      const result = validateNodeConfig('anthropicCompletion', {
        model: 'claude-sonnet-4-5-20250514',
        messages: [],
      });
      
      expect(result.success).toBe(true);
      expect(result.errors).toBeNull();
    });

    it('should reject invalid node type', () => {
      const result = validateNodeConfig('invalidNodeType' as any, {});
      
      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors?.[0]).toContain('Unknown node type');
    });

    it('should validate against schema', () => {
      // All nodes currently use genericNodeConfigSchema which accepts any config
      // This test will be more meaningful when specific schemas are implemented
      const result = validateNodeConfig('anthropicCompletion', {
        someRandomField: 'value',
      });
      
      expect(result.success).toBe(true);
    });
  });

  describe('Node Count Verification', () => {
    it('should have exactly 55 nodes total', () => {
      const allTypes = getAllNodeTypes();
      expect(allTypes.length).toBe(55);
    });

    it('should have 10 CORE + 45 STUB = 55 total', () => {
      const implemented = getImplementedNodes();
      const stub = getStubNodes();
      expect(implemented.length + stub.length).toBe(55);
    });

    it('should have correct distribution across categories', () => {
      const stats = getNodeStats();
      const categoryTotal = Object.values(stats.byCategory).reduce((sum, count) => sum + count, 0);
      expect(categoryTotal).toBe(55);
    });
  });
});
