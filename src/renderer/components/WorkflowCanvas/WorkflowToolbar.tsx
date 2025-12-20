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

import React, { useState } from 'react';
import { useReactFlow } from 'reactflow';
import { useWorkflowStore } from '../../store/workflowStore';
import { useProjectStore } from '../../store/projectStore';

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
      
      {/* Generate Python button */}
      <button
        onClick={handleGeneratePython}
        disabled={isGenerating || !manifest || !currentProject}
        className="px-3 py-1 text-sm bg-green-50 hover:bg-green-100 text-green-700 rounded border border-green-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        title="Generate Python/FastAPI code from workflow"
      >
        {isGenerating ? '⏳ Generating...' : '🐍 Generate Python'}
      </button>
      
      {/* Validate button (future feature) */}
      <button
        onClick={handleValidate}
        className="px-3 py-1 text-sm bg-blue-50 hover:bg-blue-100 text-blue-700 rounded border border-blue-300 transition-colors"
        title="Validate workflow"
        disabled
      >
        ✅ Validate
      </button>
    </div>
  );
}

export default WorkflowToolbar;
