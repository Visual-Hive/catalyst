/**
 * @file WorkflowCanvasTest.tsx
 * @description Quick test page for WorkflowCanvas
 * 
 * USAGE: Import this in App.tsx temporarily to test the canvas
 */

import React, { useEffect } from 'react';
import { WorkflowCanvas } from './WorkflowCanvas';
import { useWorkflowStore } from '../../store/workflowStore';

/**
 * WorkflowCanvasTest - Test page with sample workflow
 * 
 * Creates a test workflow with a few nodes to verify canvas functionality
 */
export function WorkflowCanvasTest() {
  const createWorkflow = useWorkflowStore((s) => s.createWorkflow);
  const addNode = useWorkflowStore((s) => s.addNode);
  const addEdge = useWorkflowStore((s) => s.addEdge);
  const activeWorkflowId = useWorkflowStore((s) => s.activeWorkflowId);
  const setActiveWorkflow = useWorkflowStore((s) => s.setActiveWorkflow);
  
  // Initialize test workflow on mount
  useEffect(() => {
    // Create workflow
    const workflowId = createWorkflow('Test Workflow', 'httpEndpoint');
    
    // Add a few test nodes
    addNode(workflowId, {
      id: 'node_http_1',
      type: 'httpEndpoint',
      name: 'HTTP Endpoint',
      position: { x: 100, y: 100 },
      config: {
        method: 'POST',
        path: '/api/test',
      },
    });
    
    addNode(workflowId, {
      id: 'node_claude_1',
      type: 'anthropicCompletion',
      name: 'Claude Analysis',
      position: { x: 400, y: 100 },
      config: {
        model: 'claude-3-5-sonnet-20241022',
        maxTokens: 1000,
      },
    });
    
    addNode(workflowId, {
      id: 'node_log_1',
      type: 'log',
      name: 'Log Result',
      position: { x: 700, y: 100 },
      config: {
        level: 'info',
        message: 'Result logged',
      },
    });
    
    // Connect nodes
    addEdge(workflowId, {
      id: 'edge_1',
      source: 'node_http_1',
      target: 'node_claude_1',
    });
    
    addEdge(workflowId, {
      id: 'edge_2',
      source: 'node_claude_1',
      target: 'node_log_1',
    });
    
    // Set as active
    setActiveWorkflow(workflowId);
  }, []); // Run once on mount
  
  if (!activeWorkflowId) {
    return <div>Initializing test workflow...</div>;
  }
  
  return (
    <div className="h-screen w-screen">
      <div className="p-4 bg-blue-50 border-b border-blue-200">
        <h1 className="text-xl font-bold text-blue-900">WorkflowCanvas Test Page</h1>
        <p className="text-sm text-blue-700">
          Try: Drag nodes from palette, connect nodes, drag to reposition
        </p>
      </div>
      <div className="h-[calc(100vh-80px)]">
        <WorkflowCanvas workflowId={activeWorkflowId} />
      </div>
    </div>
  );
}

export default WorkflowCanvasTest;
