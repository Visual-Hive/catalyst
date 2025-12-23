/**
 * @file WorkflowToolbar.tsx
 * @description Simple toolbar for workflow canvas controls
 * 
 * @architecture Phase 0, Task 0.5 - Canvas Adaptation
 * @created 2025-12-18
 * @author AI (Cline) + Human Review
 * @confidence 9/10 - Simple toolbar with basic controls
 * 
 * @see src/renderer/components/WorkflowCanvas/WorkflowCanvas.tsx - Parent
 * 
 * PROBLEM SOLVED:
 * - Users need quick access to canvas controls
 * - Fit view button for when nodes go off-screen
 * - Validation button to check workflow correctness
 * 
 * SOLUTION:
 * - Compact toolbar with essential controls
 * - Uses React Flow's useReactFlow hook for canvas operations
 * - Simple, clean design matching LogicEditor toolbar
 * 
 * @security-critical false
 * @performance-critical false
 */

import React, { useState, useRef, useEffect } from 'react';
import { useReactFlow } from 'reactflow';
import { useWorkflowStore } from '../../store/workflowStore';
import { useProjectStore } from '../../store/projectStore';
import { ChevronDown, Play } from 'lucide-react';
import RequestSimulator from './RequestSimulator';

// ============================================================
// TYPES
// ============================================================

interface WorkflowToolbarProps {
  /** ID of the workflow being edited */
  workflowId: string;
}

// ============================================================
// COMPONENT
// ============================================================

/**
 * WorkflowToolbar - Simple toolbar for canvas controls
 * 
 * Provides quick access to common canvas operations:
 * - Fit view: Centers and zooms to show all nodes
 * - Validate: Check workflow for errors (future feature)
 * 
 * USAGE:
 * ```tsx
 * <WorkflowToolbar workflowId={activeWorkflowId} />
 * ```
 */
export function WorkflowToolbar({ workflowId }: WorkflowToolbarProps) {
  // Get React Flow instance for canvas control
  const { fitView } = useReactFlow();
  
  // Get workflow store to access manifest
  const manifest = useWorkflowStore((state) => state.manifest);
  
  // Get current project path
  const currentProject = useProjectStore((state) => state.currentProject);
  
  // Generation state
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStatus, setGenerationStatus] = useState<string>('');
  
  // Run menu state
  const [showRunMenu, setShowRunMenu] = useState(false);
  const [showSimulator, setShowSimulator] = useState(false);
  const runMenuRef = useRef<HTMLDivElement>(null);
  
  /**
   * Fit all nodes into view
   * Animates the canvas to show all nodes with padding
   */
  const handleFitView = () => {
    fitView({
      padding: 0.2, // 20% padding around nodes
      duration: 300, // 300ms animation
    });
  };
  
  /**
   * Close run menu when clicking outside
   */
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (runMenuRef.current && !runMenuRef.current.contains(event.target as Node)) {
        setShowRunMenu(false);
      }
    }
    
    if (showRunMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showRunMenu]);
  
  /**
   * Find HTTP endpoint node in workflow
   */
  const getHttpEndpointNode = () => {
    if (!manifest) return null;
    const workflow = manifest.workflows[workflowId];
    if (!workflow) return null;
    
    const entry = Object.entries(workflow.nodes).find(
      ([_, node]) => node.type === 'httpEndpoint'
    );
    
    return entry ? { id: entry[0], node: entry[1] } : null;
  };
  
  /**
   * Check if workflow has HTTP endpoint trigger
   */
  const hasHttpEndpoint = () => {
    return getHttpEndpointNode() !== null;
  };
  
  /**
   * Toggle run menu dropdown
   */
  const handleRunClick = () => {
    setShowRunMenu(!showRunMenu);
  };
  
  /**
   * Open request simulator modal
   */
  const handleSimulateRequest = () => {
    const httpNode = getHttpEndpointNode();
    if (!httpNode) {
      console.error('[WorkflowToolbar] No HTTP endpoint node found');
      return;
    }
    setShowRunMenu(false);
    setShowSimulator(true);
  };
  
  /**
   * Handle execution after user configures request in simulator
   */
  const handleExecuteRequest = (simulatedRequest: any) => {
    console.log('[WorkflowToolbar] Executing workflow with request:', simulatedRequest);
    // RequestSimulator already handles execution via window.electronAPI.workflow.execute
    // This callback is just for additional UI updates if needed
  };
  
  /**
   * Execute workflow with pinned data
   * TODO: Task 2.14 - Implement execution with pinned data
   */
  const handleExecuteWithPinnedData = () => {
    setShowRunMenu(false);
    console.log('[WorkflowToolbar] Execute with pinned data - Coming in Task 2.14');
    // Future: Execute workflow using pinned node data
  };
  
  /**
   * Validate workflow
   * TODO: Implement validation logic in future phase
   */
  const handleValidate = () => {
    console.log('[WorkflowToolbar] Validate workflow:', workflowId);
    // Future: Check for disconnected nodes, invalid configs, etc.
  };
  
  /**
   * Generate Python code from workflow
   * Calls IPC handler to generate FastAPI Python file
   */
  const handleGeneratePython = async () => {
    if (!currentProject || !manifest) {
      console.error('[WorkflowToolbar] No project or manifest loaded');
      setGenerationStatus('❌ Error: No project loaded');
      setTimeout(() => setGenerationStatus(''), 3000);
      return;
    }
    
    try {
      setIsGenerating(true);
      setGenerationStatus('⏳ Generating...');
      
      console.log('[WorkflowToolbar] Generating Python for workflow:', workflowId);
      
      // Call IPC handler
      const result = await window.electronAPI.workflow.generatePython({
        projectPath: currentProject.path,
        workflowId: workflowId,
        manifest: manifest,
      });
      
      if (result.success && result.data) {
        console.log('[WorkflowToolbar] Generation successful:', result.data);
        setGenerationStatus(`✅ Generated: ${result.data.nodeCount} nodes`);
        setTimeout(() => setGenerationStatus(''), 5000);
      } else {
        console.error('[WorkflowToolbar] Generation failed:', result.error);
        setGenerationStatus(`❌ Error: ${result.error}`);
        setTimeout(() => setGenerationStatus(''), 5000);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      console.error('[WorkflowToolbar] Generation error:', message);
      setGenerationStatus(`❌ Error: ${message}`);
      setTimeout(() => setGenerationStatus(''), 5000);
    } finally {
      setIsGenerating(false);
    }
  };
  
  return (
    <>
      <div className="bg-white border-b border-gray-200 px-3 py-2 flex items-center gap-2">
        {/* Workflow name indicator */}
        <div className="text-sm font-medium text-gray-700 mr-auto">
          Workflow Canvas
        </div>
        
        {/* Generation status */}
        {generationStatus && (
          <div className="text-sm text-gray-600">
            {generationStatus}
          </div>
        )}
        
        {/* Fit view button */}
        <button
          onClick={handleFitView}
          className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded border border-gray-300 transition-colors"
          title="Fit all nodes in view"
        >
          🔍 Fit View
        </button>
        
        {/* Run workflow button with dropdown */}
        <div className="relative" ref={runMenuRef}>
          <button
            onClick={handleRunClick}
            className="px-3 py-1 text-sm bg-green-500 hover:bg-green-600 text-white rounded flex items-center gap-2 transition-colors"
            title="Run workflow"
          >
            <Play className="w-4 h-4" />
            Run Workflow
            <ChevronDown className="w-3 h-3" />
          </button>
          
          {/* Dropdown menu */}
          {showRunMenu && (
            <div className="absolute top-full left-0 mt-1 bg-white shadow-lg rounded border border-gray-200 py-1 min-w-[200px] z-50">
              {hasHttpEndpoint() && (
                <button
                  onClick={handleSimulateRequest}
                  className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2"
                >
                  🌐 Simulate HTTP Request
                </button>
              )}
              <button
                onClick={handleExecuteWithPinnedData}
                className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2 opacity-50 cursor-not-allowed"
                disabled
                title="Coming in Task 2.14"
              >
                📌 Execute with Pinned Data
              </button>
            </div>
          )}
        </div>
        
        {/* Generate Python button */}
        <button
          onClick={handleGeneratePython}
          disabled={isGenerating || !manifest || !currentProject}
          className="px-3 py-1 text-sm bg-blue-50 hover:bg-blue-100 text-blue-700 rounded border border-blue-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          title="Generate Python/FastAPI code from workflow"
        >
          {isGenerating ? '⏳ Generating...' : '🐍 Generate Python'}
        </button>
        
        {/* Validate button (future feature) */}
        <button
          onClick={handleValidate}
          className="px-3 py-1 text-sm bg-gray-50 hover:bg-gray-100 text-gray-700 rounded border border-gray-300 transition-colors opacity-50 cursor-not-allowed"
          title="Validate workflow (coming soon)"
          disabled
        >
          ✅ Validate
        </button>
      </div>
      
      {/* Request Simulator Modal */}
      {showSimulator && (() => {
        const httpNode = getHttpEndpointNode();
        if (!httpNode) return null;
        
        return (
          <RequestSimulator
            workflowId={workflowId}
            nodeId={httpNode.id}
            nodeName={httpNode.node.name || 'HTTP Endpoint'}
            onClose={() => setShowSimulator(false)}
            onRun={handleExecuteRequest}
          />
        );
      })()}
    </>
  );
}

export default WorkflowToolbar;
