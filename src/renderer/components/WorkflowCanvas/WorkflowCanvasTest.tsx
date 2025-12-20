/**
 * @file WorkflowCanvasTest.tsx
 * @description Quick test page for WorkflowCanvas
 * 
 * USAGE: Import this in App.tsx temporarily to test the canvas
 */

import React, { useEffect } from 'react';
import { WorkflowCanvas } from './WorkflowCanvas';
import { useWorkflowStore } from '../../store/workflowStore';
import { useProjectStore } from '../../store/projectStore';
import { createEmptyManifest } from '../../../core/workflow/types';

/**
 * WorkflowCanvasTest - Test page with sample workflow
 * 
 * Creates a test workflow with a few nodes to verify canvas functionality
 * 
 * UPDATED: Task 2.9 - Added mock project and manifest for code generation testing
 */
export function WorkflowCanvasTest() {
  const createWorkflow = useWorkflowStore((s) => s.createWorkflow);
  const addNode = useWorkflowStore((s) => s.addNode);
  const addEdge = useWorkflowStore((s) => s.addEdge);
  const activeWorkflowId = useWorkflowStore((s) => s.activeWorkflowId);
  const setActiveWorkflow = useWorkflowStore((s) => s.setActiveWorkflow);
  const loadManifest = useWorkflowStore((s) => s.loadManifest);
  
  // Mock project store for testing
  const setCurrentProject = useProjectStore((s) => s.setCurrentProject);
  
  // Initialize test workflow on mount
  useEffect(() => {
    // Step 1: Mock a project (required for Generate Python button)
    setCurrentProject({
      id: 'test-project-1',
      name: 'Test Project',
      path: '/tmp/catalyst-test-project',
      framework: 'react',
      schemaVersion: '1.0.0',
      createdAt: new Date(),
      lastOpenedAt: new Date(),
    });
    
    // Step 2: Initialize manifest with empty structure
    const manifest = createEmptyManifest();
    loadManifest(manifest);
    
    // Step 3: Create workflow
    const workflowId = createWorkflow('test-workflow', 'httpEndpoint');
    
    // Step 4: Add real Groq node with proper config for code generation testing
    addNode(workflowId, {
      id: 'node_groq_1',
      type: 'groqCompletion',
      name: 'Groq LLM',
      position: { x: 300, y: 200 },
      config: {
        apiKey: 'test-groq-api-key-12345',
        model: 'llama-3.1-70b-versatile',
        systemPrompt: 'You are a helpful AI assistant.',
        prompt: 'Analyze this data: {{input.data}}',
        temperature: 0.7,
        maxTokens: 1000,
        stream: true,
      },
    });
    
    // Step 5: Add HTTP endpoint trigger
    addNode(workflowId, {
      id: 'node_http_1',
      type: 'httpEndpoint',
      name: 'HTTP Trigger',
      position: { x: 100, y: 200 },
      config: {
        method: 'POST',
        path: '/api/analyze',
      },
    });
    
    // Step 6: Connect HTTP → Groq
    addEdge(workflowId, {
      id: 'edge_1',
      source: 'node_http_1',
      target: 'node_groq_1',
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
