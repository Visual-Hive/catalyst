/**
 * @file workflowStore.test.ts
 * @description Unit tests for workflow store
 * 
 * @architecture Phase 0, Task 0.4 - Workflow Store Tests
 * @created 2025-12-18
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useWorkflowStore } from '../../../src/renderer/store/workflowStore';
import {
  createEmptyManifest,
  createWorkflow,
  createNode,
  createEdge,
} from '../../../src/core/workflow/types';
import type { CatalystManifest } from '../../../src/core/workflow/types';

describe('WorkflowStore', () => {
  // Reset store before each test to ensure isolation
  beforeEach(() => {
    useWorkflowStore.getState().resetManifest();
  });

  describe('Initial State', () => {
    it('should initialize with null manifest', () => {
      const { manifest } = useWorkflowStore.getState();
      expect(manifest).toBeNull();
    });

    it('should initialize with clean state (not dirty)', () => {
      const { isDirty } = useWorkflowStore.getState();
      expect(isDirty).toBe(false);
    });

    it('should initialize with no active workflow', () => {
      const { activeWorkflowId } = useWorkflowStore.getState();
      expect(activeWorkflowId).toBeNull();
    });

    it('should initialize with no selected node', () => {
      const { selectedNodeId } = useWorkflowStore.getState();
      expect(selectedNodeId).toBeNull();
    });
  });

  describe('Manifest Operations', () => {
    describe('loadManifest', () => {
      it('should load a manifest', () => {
        const manifest = createEmptyManifest();
        useWorkflowStore.getState().loadManifest(manifest);

        const state = useWorkflowStore.getState();
        expect(state.manifest).toEqual(manifest);
      });

      it('should reset editor state when loading', () => {
        // Set up some state
        const manifest = createEmptyManifest();
        useWorkflowStore.setState({
          manifest,
          isDirty: true,
          activeWorkflowId: 'test',
          selectedNodeId: 'node1',
        });

        // Load new manifest
        const newManifest = createEmptyManifest();
        newManifest.metadata.projectName = 'New Project';
        useWorkflowStore.getState().loadManifest(newManifest);

        const state = useWorkflowStore.getState();
        expect(state.manifest?.metadata.projectName).toBe('New Project');
        expect(state.isDirty).toBe(false);
        expect(state.activeWorkflowId).toBeNull();
        expect(state.selectedNodeId).toBeNull();
      });
    });

    describe('resetManifest', () => {
      it('should clear all state', () => {
        // Set up some state
        const manifest = createEmptyManifest();
        useWorkflowStore.setState({
          manifest,
          isDirty: true,
          activeWorkflowId: 'test',
          selectedNodeId: 'node1',
        });

        // Reset
        useWorkflowStore.getState().resetManifest();

        const state = useWorkflowStore.getState();
        expect(state.manifest).toBeNull();
        expect(state.isDirty).toBe(false);
        expect(state.activeWorkflowId).toBeNull();
        expect(state.selectedNodeId).toBeNull();
      });
    });

    describe('saveManifest', () => {
      it('should mark manifest as clean after save', async () => {
        const manifest = createEmptyManifest();
        useWorkflowStore.setState({ manifest, isDirty: true });

        await useWorkflowStore.getState().saveManifest();

        // Wait for debounce
        await new Promise((resolve) => setTimeout(resolve, 600));

        const { isDirty } = useWorkflowStore.getState();
        expect(isDirty).toBe(false);
      });

      it('should handle save with no manifest gracefully', async () => {
        useWorkflowStore.setState({ manifest: null });

        // Should not throw
        await expect(
          useWorkflowStore.getState().saveManifest()
        ).resolves.toBeUndefined();
      });
    });
  });

  describe('Workflow CRUD Operations', () => {
    describe('createWorkflow', () => {
      it('should create a workflow with default trigger', () => {
        const id = useWorkflowStore.getState().createWorkflow('Test Workflow');

        const state = useWorkflowStore.getState();
        expect(state.manifest).not.toBeNull();
        expect(state.manifest!.workflows[id]).toBeDefined();
        expect(state.manifest!.workflows[id].name).toBe('Test Workflow');
        expect(state.manifest!.workflows[id].trigger.type).toBe('httpEndpoint');
      });

      it('should set new workflow as active', () => {
        const id = useWorkflowStore.getState().createWorkflow('Test Workflow');

        const { activeWorkflowId } = useWorkflowStore.getState();
        expect(activeWorkflowId).toBe(id);
      });

      it('should mark manifest as dirty', () => {
        useWorkflowStore.getState().createWorkflow('Test Workflow');

        const { isDirty } = useWorkflowStore.getState();
        expect(isDirty).toBe(true);
      });

      it('should create manifest if none exists', () => {
        const state = useWorkflowStore.getState();
        expect(state.manifest).toBeNull();

        useWorkflowStore.getState().createWorkflow('Test Workflow');

        const newState = useWorkflowStore.getState();
        expect(newState.manifest).not.toBeNull();
      });

      it('should support custom trigger types', () => {
        const id = useWorkflowStore
          .getState()
          .createWorkflow('Scheduled Workflow', 'scheduledTask');

        const workflow = useWorkflowStore.getState().manifest!.workflows[id];
        expect(workflow.trigger.type).toBe('scheduledTask');
      });
    });

    describe('updateWorkflow', () => {
      it('should update workflow name', () => {
        const id = useWorkflowStore.getState().createWorkflow('Test Workflow');

        useWorkflowStore.getState().updateWorkflow(id, { name: 'Updated Name' });

        const workflow = useWorkflowStore.getState().manifest!.workflows[id];
        expect(workflow.name).toBe('Updated Name');
      });

      it('should update workflow description', () => {
        const id = useWorkflowStore.getState().createWorkflow('Test Workflow');

        useWorkflowStore
          .getState()
          .updateWorkflow(id, { description: 'New description' });

        const workflow = useWorkflowStore.getState().manifest!.workflows[id];
        expect(workflow.description).toBe('New description');
      });

      it('should mark manifest as dirty', () => {
        const id = useWorkflowStore.getState().createWorkflow('Test Workflow');
        useWorkflowStore.setState({ isDirty: false }); // Reset dirty flag

        useWorkflowStore.getState().updateWorkflow(id, { name: 'Updated' });

        const { isDirty } = useWorkflowStore.getState();
        expect(isDirty).toBe(true);
      });

      it('should handle update of non-existent workflow gracefully', () => {
        const manifest = createEmptyManifest();
        useWorkflowStore.getState().loadManifest(manifest);

        // Should not throw
        useWorkflowStore.getState().updateWorkflow('invalid-id', { name: 'Test' });

        // Manifest should be unchanged
        expect(useWorkflowStore.getState().manifest!.workflows).toEqual({});
      });
    });

    describe('deleteWorkflow', () => {
      it('should delete a workflow', () => {
        const id = useWorkflowStore.getState().createWorkflow('Test Workflow');

        useWorkflowStore.getState().deleteWorkflow(id);

        const workflows = useWorkflowStore.getState().manifest!.workflows;
        expect(workflows[id]).toBeUndefined();
      });

      it('should clear active workflow if deleted workflow was active', () => {
        const id = useWorkflowStore.getState().createWorkflow('Test Workflow');
        expect(useWorkflowStore.getState().activeWorkflowId).toBe(id);

        useWorkflowStore.getState().deleteWorkflow(id);

        expect(useWorkflowStore.getState().activeWorkflowId).toBeNull();
      });

      it('should clear selected node if workflow deleted', () => {
        const id = useWorkflowStore.getState().createWorkflow('Test Workflow');
        useWorkflowStore.setState({ selectedNodeId: 'node1' });

        useWorkflowStore.getState().deleteWorkflow(id);

        expect(useWorkflowStore.getState().selectedNodeId).toBeNull();
      });

      it('should mark manifest as dirty', () => {
        const id = useWorkflowStore.getState().createWorkflow('Test Workflow');
        useWorkflowStore.setState({ isDirty: false });

        useWorkflowStore.getState().deleteWorkflow(id);

        expect(useWorkflowStore.getState().isDirty).toBe(true);
      });
    });

    describe('setActiveWorkflow', () => {
      it('should set active workflow', () => {
        const id = useWorkflowStore.getState().createWorkflow('Test Workflow');
        useWorkflowStore.setState({ activeWorkflowId: null });

        useWorkflowStore.getState().setActiveWorkflow(id);

        expect(useWorkflowStore.getState().activeWorkflowId).toBe(id);
      });

      it('should clear node selection when switching workflows', () => {
        const id1 = useWorkflowStore.getState().createWorkflow('Workflow 1');
        const id2 = useWorkflowStore.getState().createWorkflow('Workflow 2');
        useWorkflowStore.setState({ selectedNodeId: 'node1' });

        useWorkflowStore.getState().setActiveWorkflow(id1);

        expect(useWorkflowStore.getState().selectedNodeId).toBeNull();
      });

      it('should support clearing active workflow', () => {
        const id = useWorkflowStore.getState().createWorkflow('Test Workflow');

        useWorkflowStore.getState().setActiveWorkflow(null);

        expect(useWorkflowStore.getState().activeWorkflowId).toBeNull();
      });
    });
  });

  describe('Node Operations', () => {
    let workflowId: string;

    beforeEach(() => {
      workflowId = useWorkflowStore.getState().createWorkflow('Test Workflow');
      useWorkflowStore.setState({ isDirty: false }); // Reset for testing
    });

    describe('addNode', () => {
      it('should add a node to workflow', () => {
        const node = createNode('log', 'Log Node', { x: 100, y: 100 });

        useWorkflowStore.getState().addNode(workflowId, node);

        const nodes = useWorkflowStore.getState().manifest!.workflows[workflowId]
          .nodes;
        expect(nodes[node.id]).toEqual(node);
      });

      it('should mark manifest as dirty', () => {
        const node = createNode('log', 'Log Node', { x: 100, y: 100 });

        useWorkflowStore.getState().addNode(workflowId, node);

        expect(useWorkflowStore.getState().isDirty).toBe(true);
      });

      it('should handle adding to non-existent workflow gracefully', () => {
        const node = createNode('log', 'Log Node', { x: 100, y: 100 });

        // Should not throw
        useWorkflowStore.getState().addNode('invalid-id', node);
      });
    });

    describe('updateNode', () => {
      it('should update node name', () => {
        const node = createNode('log', 'Log Node', { x: 100, y: 100 });
        useWorkflowStore.getState().addNode(workflowId, node);

        useWorkflowStore.getState().updateNode(workflowId, node.id, {
          name: 'Updated Log',
        });

        const updatedNode = useWorkflowStore.getState().manifest!.workflows[
          workflowId
        ].nodes[node.id];
        expect(updatedNode.name).toBe('Updated Log');
      });

      it('should update node position', () => {
        const node = createNode('log', 'Log Node', { x: 100, y: 100 });
        useWorkflowStore.getState().addNode(workflowId, node);

        useWorkflowStore.getState().updateNode(workflowId, node.id, {
          position: { x: 200, y: 200 },
        });

        const updatedNode = useWorkflowStore.getState().manifest!.workflows[
          workflowId
        ].nodes[node.id];
        expect(updatedNode.position).toEqual({ x: 200, y: 200 });
      });

      it('should update node config', () => {
        const node = createNode('log', 'Log Node', { x: 100, y: 100 });
        useWorkflowStore.getState().addNode(workflowId, node);

        useWorkflowStore.getState().updateNode(workflowId, node.id, {
          config: { level: 'error', message: 'Error occurred' },
        });

        const updatedNode = useWorkflowStore.getState().manifest!.workflows[
          workflowId
        ].nodes[node.id];
        expect(updatedNode.config).toEqual({
          level: 'error',
          message: 'Error occurred',
        });
      });

      it('should mark manifest as dirty', () => {
        const node = createNode('log', 'Log Node', { x: 100, y: 100 });
        useWorkflowStore.getState().addNode(workflowId, node);
        useWorkflowStore.setState({ isDirty: false });

        useWorkflowStore.getState().updateNode(workflowId, node.id, {
          name: 'Updated',
        });

        expect(useWorkflowStore.getState().isDirty).toBe(true);
      });
    });

    describe('deleteNode', () => {
      it('should delete a node', () => {
        const node = createNode('log', 'Log Node', { x: 100, y: 100 });
        useWorkflowStore.getState().addNode(workflowId, node);

        useWorkflowStore.getState().deleteNode(workflowId, node.id);

        const nodes = useWorkflowStore.getState().manifest!.workflows[workflowId]
          .nodes;
        expect(nodes[node.id]).toBeUndefined();
      });

      it('should delete edges connected to deleted node', () => {
        const node1 = createNode('log', 'Log 1', { x: 100, y: 100 });
        const node2 = createNode('log', 'Log 2', { x: 200, y: 200 });
        useWorkflowStore.getState().addNode(workflowId, node1);
        useWorkflowStore.getState().addNode(workflowId, node2);

        const edge = createEdge(node1.id, node2.id);
        useWorkflowStore.getState().addEdge(workflowId, edge);

        useWorkflowStore.getState().deleteNode(workflowId, node1.id);

        const edges = useWorkflowStore.getState().manifest!.workflows[workflowId]
          .edges;
        expect(edges.length).toBe(0);
      });

      it('should clear selection if deleted node was selected', () => {
        const node = createNode('log', 'Log Node', { x: 100, y: 100 });
        useWorkflowStore.getState().addNode(workflowId, node);
        useWorkflowStore.setState({ selectedNodeId: node.id });

        useWorkflowStore.getState().deleteNode(workflowId, node.id);

        expect(useWorkflowStore.getState().selectedNodeId).toBeNull();
      });

      it('should mark manifest as dirty', () => {
        const node = createNode('log', 'Log Node', { x: 100, y: 100 });
        useWorkflowStore.getState().addNode(workflowId, node);
        useWorkflowStore.setState({ isDirty: false });

        useWorkflowStore.getState().deleteNode(workflowId, node.id);

        expect(useWorkflowStore.getState().isDirty).toBe(true);
      });
    });

    describe('selectNode', () => {
      it('should select a node', () => {
        useWorkflowStore.getState().selectNode('node1');

        expect(useWorkflowStore.getState().selectedNodeId).toBe('node1');
      });

      it('should support deselecting nodes', () => {
        useWorkflowStore.setState({ selectedNodeId: 'node1' });

        useWorkflowStore.getState().selectNode(null);

        expect(useWorkflowStore.getState().selectedNodeId).toBeNull();
      });
    });
  });

  describe('Edge Operations', () => {
    let workflowId: string;
    let node1Id: string;
    let node2Id: string;

    beforeEach(() => {
      workflowId = useWorkflowStore.getState().createWorkflow('Test Workflow');
      const node1 = createNode('log', 'Log 1', { x: 100, y: 100 });
      const node2 = createNode('log', 'Log 2', { x: 200, y: 200 });
      useWorkflowStore.getState().addNode(workflowId, node1);
      useWorkflowStore.getState().addNode(workflowId, node2);
      node1Id = node1.id;
      node2Id = node2.id;
      useWorkflowStore.setState({ isDirty: false });
    });

    describe('addEdge', () => {
      it('should add an edge to workflow', () => {
        const edge = createEdge(node1Id, node2Id);

        useWorkflowStore.getState().addEdge(workflowId, edge);

        const edges = useWorkflowStore.getState().manifest!.workflows[workflowId]
          .edges;
        expect(edges).toHaveLength(1);
        expect(edges[0]).toEqual(edge);
      });

      it('should mark manifest as dirty', () => {
        const edge = createEdge(node1Id, node2Id);

        useWorkflowStore.getState().addEdge(workflowId, edge);

        expect(useWorkflowStore.getState().isDirty).toBe(true);
      });
    });

    describe('updateEdge', () => {
      it('should update edge condition', () => {
        const edge = createEdge(node1Id, node2Id);
        useWorkflowStore.getState().addEdge(workflowId, edge);

        useWorkflowStore.getState().updateEdge(workflowId, edge.id, {
          condition: '{{ result.success }}',
        });

        const edges = useWorkflowStore.getState().manifest!.workflows[workflowId]
          .edges;
        expect(edges[0].condition).toBe('{{ result.success }}');
      });

      it('should mark manifest as dirty', () => {
        const edge = createEdge(node1Id, node2Id);
        useWorkflowStore.getState().addEdge(workflowId, edge);
        useWorkflowStore.setState({ isDirty: false });

        useWorkflowStore.getState().updateEdge(workflowId, edge.id, {
          condition: '{{ true }}',
        });

        expect(useWorkflowStore.getState().isDirty).toBe(true);
      });
    });

    describe('deleteEdge', () => {
      it('should delete an edge', () => {
        const edge = createEdge(node1Id, node2Id);
        useWorkflowStore.getState().addEdge(workflowId, edge);

        useWorkflowStore.getState().deleteEdge(workflowId, edge.id);

        const edges = useWorkflowStore.getState().manifest!.workflows[workflowId]
          .edges;
        expect(edges).toHaveLength(0);
      });

      it('should mark manifest as dirty', () => {
        const edge = createEdge(node1Id, node2Id);
        useWorkflowStore.getState().addEdge(workflowId, edge);
        useWorkflowStore.setState({ isDirty: false });

        useWorkflowStore.getState().deleteEdge(workflowId, edge.id);

        expect(useWorkflowStore.getState().isDirty).toBe(true);
      });
    });
  });

  describe('React Flow Synchronization', () => {
    let workflowId: string;
    let node1Id: string;
    let node2Id: string;

    beforeEach(() => {
      workflowId = useWorkflowStore.getState().createWorkflow('Test Workflow');
      const node1 = createNode('log', 'Log 1', { x: 100, y: 100 });
      const node2 = createNode('log', 'Log 2', { x: 200, y: 200 });
      useWorkflowStore.getState().addNode(workflowId, node1);
      useWorkflowStore.getState().addNode(workflowId, node2);
      node1Id = node1.id;
      node2Id = node2.id;
      useWorkflowStore.setState({ isDirty: false });
    });

    describe('syncNodesFromReactFlow', () => {
      it('should update node positions from React Flow', () => {
        const rfNodes = [
          { id: node1Id, position: { x: 300, y: 300 }, data: {} },
          { id: node2Id, position: { x: 400, y: 400 }, data: {} },
        ];

        useWorkflowStore.getState().syncNodesFromReactFlow(workflowId, rfNodes as any);

        const nodes = useWorkflowStore.getState().manifest!.workflows[workflowId]
          .nodes;
        expect(nodes[node1Id].position).toEqual({ x: 300, y: 300 });
        expect(nodes[node2Id].position).toEqual({ x: 400, y: 400 });
      });

      it('should mark manifest as dirty', () => {
        const rfNodes = [{ id: node1Id, position: { x: 300, y: 300 }, data: {} }];

        useWorkflowStore.getState().syncNodesFromReactFlow(workflowId, rfNodes as any);

        expect(useWorkflowStore.getState().isDirty).toBe(true);
      });
    });

    describe('syncEdgesFromReactFlow', () => {
      it('should update edges from React Flow', () => {
        const rfEdges = [
          {
            id: 'edge1',
            source: node1Id,
            target: node2Id,
            sourceHandle: null,
            targetHandle: null,
          },
        ];

        useWorkflowStore.getState().syncEdgesFromReactFlow(workflowId, rfEdges as any);

        const edges = useWorkflowStore.getState().manifest!.workflows[workflowId]
          .edges;
        expect(edges).toHaveLength(1);
        expect(edges[0].source).toBe(node1Id);
        expect(edges[0].target).toBe(node2Id);
      });

      it('should preserve edge conditions during sync', () => {
        // Add edge with condition
        const edge = createEdge(node1Id, node2Id, '{{ result.success }}');
        useWorkflowStore.getState().addEdge(workflowId, edge);

        // Sync from React Flow (which doesn't have conditions)
        const rfEdges = [
          {
            id: edge.id,
            source: node1Id,
            target: node2Id,
            sourceHandle: null,
            targetHandle: null,
          },
        ];

        useWorkflowStore.getState().syncEdgesFromReactFlow(workflowId, rfEdges as any);

        const edges = useWorkflowStore.getState().manifest!.workflows[workflowId]
          .edges;
        expect(edges[0].condition).toBe('{{ result.success }}');
      });

      it('should mark manifest as dirty', () => {
        const rfEdges = [
          {
            id: 'edge1',
            source: node1Id,
            target: node2Id,
            sourceHandle: null,
            targetHandle: null,
          },
        ];

        useWorkflowStore.getState().syncEdgesFromReactFlow(workflowId, rfEdges as any);

        expect(useWorkflowStore.getState().isDirty).toBe(true);
      });
    });
  });

  describe('Getters', () => {
    let workflowId: string;

    beforeEach(() => {
      workflowId = useWorkflowStore.getState().createWorkflow('Test Workflow');
    });

    describe('getActiveWorkflow', () => {
      it('should return active workflow', () => {
        const workflow = useWorkflowStore.getState().getActiveWorkflow();

        expect(workflow).not.toBeNull();
        expect(workflow!.id).toBe(workflowId);
        expect(workflow!.name).toBe('Test Workflow');
      });

      it('should return null if no active workflow', () => {
        useWorkflowStore.setState({ activeWorkflowId: null });

        const workflow = useWorkflowStore.getState().getActiveWorkflow();

        expect(workflow).toBeNull();
      });

      it('should return null if no manifest loaded', () => {
        useWorkflowStore.setState({ manifest: null });

        const workflow = useWorkflowStore.getState().getActiveWorkflow();

        expect(workflow).toBeNull();
      });
    });

    describe('getWorkflowNodes', () => {
      it('should return workflow nodes as array', () => {
        const node1 = createNode('log', 'Log 1', { x: 100, y: 100 });
        const node2 = createNode('log', 'Log 2', { x: 200, y: 200 });
        useWorkflowStore.getState().addNode(workflowId, node1);
        useWorkflowStore.getState().addNode(workflowId, node2);

        const nodes = useWorkflowStore.getState().getWorkflowNodes(workflowId);

        expect(nodes).toHaveLength(2);
        expect(nodes.map((n) => n.id)).toContain(node1.id);
        expect(nodes.map((n) => n.id)).toContain(node2.id);
      });

      it('should return empty array for non-existent workflow', () => {
        const nodes = useWorkflowStore.getState().getWorkflowNodes('invalid-id');

        expect(nodes).toEqual([]);
      });
    });

    describe('getWorkflowEdges', () => {
      it('should return workflow edges', () => {
        const node1 = createNode('log', 'Log 1', { x: 100, y: 100 });
        const node2 = createNode('log', 'Log 2', { x: 200, y: 200 });
        useWorkflowStore.getState().addNode(workflowId, node1);
        useWorkflowStore.getState().addNode(workflowId, node2);

        const edge = createEdge(node1.id, node2.id);
        useWorkflowStore.getState().addEdge(workflowId, edge);

        const edges = useWorkflowStore.getState().getWorkflowEdges(workflowId);

        expect(edges).toHaveLength(1);
        expect(edges[0]).toEqual(edge);
      });

      it('should return empty array for non-existent workflow', () => {
        const edges = useWorkflowStore.getState().getWorkflowEdges('invalid-id');

        expect(edges).toEqual([]);
      });
    });

    describe('getReactFlowNodes', () => {
      it('should convert nodes to React Flow format', () => {
        const node = createNode('log', 'Log Node', { x: 100, y: 100 }, {
          level: 'info',
        });
        useWorkflowStore.getState().addNode(workflowId, node);

        const rfNodes = useWorkflowStore.getState().getReactFlowNodes(workflowId);

        expect(rfNodes).toHaveLength(1);
        expect(rfNodes[0].id).toBe(node.id);
        expect(rfNodes[0].type).toBe('workflowNode');
        expect(rfNodes[0].position).toEqual({ x: 100, y: 100 });
        expect(rfNodes[0].data).toEqual(node);
      });

      it('should return empty array for non-existent workflow', () => {
        const rfNodes = useWorkflowStore
          .getState()
          .getReactFlowNodes('invalid-id');

        expect(rfNodes).toEqual([]);
      });
    });

    describe('getReactFlowEdges', () => {
      it('should convert edges to React Flow format', () => {
        const node1 = createNode('log', 'Log 1', { x: 100, y: 100 });
        const node2 = createNode('log', 'Log 2', { x: 200, y: 200 });
        useWorkflowStore.getState().addNode(workflowId, node1);
        useWorkflowStore.getState().addNode(workflowId, node2);

        const edge = createEdge(node1.id, node2.id, '{{ result.success }}');
        useWorkflowStore.getState().addEdge(workflowId, edge);

        const rfEdges = useWorkflowStore.getState().getReactFlowEdges(workflowId);

        expect(rfEdges).toHaveLength(1);
        expect(rfEdges[0].id).toBe(edge.id);
        expect(rfEdges[0].source).toBe(node1.id);
        expect(rfEdges[0].target).toBe(node2.id);
      });

      it('should return empty array for non-existent workflow', () => {
        const rfEdges = useWorkflowStore
          .getState()
          .getReactFlowEdges('invalid-id');

        expect(rfEdges).toEqual([]);
      });
    });
  });
});
