/**
 * @file src/renderer/App.tsx
 * @description Root React component for the Catalyst application (forked from Rise)
 * 
 * @architecture Phase 1, Task 1.2 - Three-Panel Layout (updated Task 1.4B)
 * @created 2025-11-19
 * @updated 2025-11-25 - Added preview lifecycle management (Task 1.4B)
 * @author AI (Cline) + Human Review
 * @confidence 9/10 - App with dialogs, shortcuts, and preview lifecycle
 * 
 * TASK HISTORY:
 * - Task 1.1: Created basic Electron + React shell with placeholder panels
 * - Task 1.2: Implemented production-ready three-panel layout with tabs
 * - Task 1.3A: Added New Project dialog with keyboard shortcuts
 * - Task 1.4B: Added preview lifecycle management (start/stop/switch)
 * 
 * This component now renders the complete application layout including:
 * - Toolbar with action buttons
 * - Three resizable panels (Navigator | Editor | Properties)
 * - Tab system in Editor panel (Preview, Code, Console)
 * - Status bar with system information
 * - Keyboard shortcuts for navigation
 * - New Project dialog
 * - Preview lifecycle management (auto-start/stop with projects)
 * 
 * @performance O(1) render, delegates to child components
 * @security-critical false
 * @performance-critical false
 */

import React, { useEffect, useRef } from 'react';
import { Layout } from './components/Layout';
import { NewProjectDialog } from './components/NewProjectDialog';
import { OpenProjectDialog } from './components/OpenProjectDialog';
import { MissingManifestDialog } from './components/MissingManifestDialog';
import { AIPromptDialog } from './components/AIGeneration';
import { useProjectStore } from './store/projectStore';
import { usePreviewStore } from './store/previewStore';
import { useManifestStore } from './store/manifestStore';
import { useWorkflowStore } from './store/workflowStore';
import { useAIStore } from './store/aiStore';
import { useGenerationStore } from './store/generationStore';
import { GenerationService } from './services/GenerationService';

// TEMPORARY: Import WorkflowCanvasTest for testing (Task 0.5)
import { WorkflowCanvasTest } from './components/WorkflowCanvas/WorkflowCanvasTest';

// TEMPORARY: Set to true to test WorkflowCanvas, false for normal app
const SHOW_WORKFLOW_TEST = false;

/**
 * Root application component
 * 
 * Renders the main Layout component and global dialogs.
 * Handles global keyboard shortcuts and preview lifecycle.
 * 
 * FEATURES IMPLEMENTED:
 * - ✅ Three-panel resizable layout
 * - ✅ Tab system (Preview, Code, Console)
 * - ✅ Toolbar and Status bar
 * - ✅ Keyboard shortcuts (Cmd+1/2/3 for panels, Cmd+Shift+P/C/O for tabs, Cmd+N for new project)
 * - ✅ State persistence (panel sizes and active tab)
 * - ✅ New Project dialog with 4-step wizard
 * - ✅ Professional placeholder content
 * - ✅ Preview lifecycle (auto-start/stop with projects)
 * 
 * KEYBOARD SHORTCUTS:
 * - Cmd/Ctrl+N: New Project
 * - Cmd/Ctrl+O: Open Project
 * 
 * @returns App component with complete layout and dialogs
 */
function App() {
  // Get dialog actions from project store
  const openDialog = useProjectStore((state) => state.openDialog);
  const openOpenDialog = useProjectStore((state) => state.openOpenDialog);
  const currentProject = useProjectStore((state) => state.currentProject);
  
  // Get preview store actions
  const startPreview = usePreviewStore((state) => state.startPreview);
  const stopPreview = usePreviewStore((state) => state.stopPreview);
  const initializeListeners = usePreviewStore((state) => state.initializeListeners);
  
  // Get manifest store actions (Task 2.2B)
  const clearManifest = useManifestStore((state) => state.clearManifest);
  
  // Get workflow store actions (Catalyst manifest)
  const loadWorkflowManifest = useWorkflowStore((state) => state.loadManifest);
  const resetWorkflowManifest = useWorkflowStore((state) => state.resetManifest);
  
  // Get AI store actions (Task 2.4E)
  const initializeAI = useAIStore((state) => state.initialize);
  const cleanupAI = useAIStore((state) => state.cleanup);
  
  // AI dialog state (managed at App level for global keyboard shortcut)
  const [aiDialogOpen, setAiDialogOpen] = React.useState(false);
  
  // Track the previous project path for detecting project changes
  const previousProjectPath = useRef<string | null>(null);
  
  /**
   * Initialize preview IPC event listeners on mount
   * 
   * Sets up listeners for server ready/error events from main process.
   * Cleans up listeners on unmount to prevent memory leaks.
   */
  useEffect(() => {
    const cleanup = initializeListeners();
    return cleanup;
  }, [initializeListeners]);
  
  /**
   * Handle preview, AI, and generation lifecycle based on project changes
   * 
   * BEHAVIOR:
   * - When a project is opened: Start preview, initialize AI, start generation watching
   * - When a project is closed: Stop preview, cleanup AI, stop generation
   * - When switching projects: Stop old, start new
   * 
   * TASK 3.3: Added GenerationService lifecycle management
   */
  useEffect(() => {
    const currentPath = currentProject?.path ?? null;
    const previousPath = previousProjectPath.current;
    
    // Project changed
    if (currentPath !== previousPath) {
      // If there was a previous project, stop its preview, clear manifest, cleanup AI, stop generation
      if (previousPath) {
        stopPreview();
        clearManifest(); // Task 2.2B: Clear manifest on project close
        resetWorkflowManifest(); // Clear Catalyst manifest on project close
        cleanupAI(); // Task 2.4E: Cleanup AI on project close
        
        // Task 3.3: Cleanup generation service
        GenerationService.getInstance().cleanup();
        useGenerationStore.getState().reset();
      }
      
      // If there's a new project, start its preview, initialize AI, start generation
      if (currentPath) {
        startPreview(currentPath);
        initializeAI(currentPath); // Task 2.4E: Initialize AI on project open
        
        // Load Catalyst manifest from .catalyst/manifest.json
        // This handles workflow persistence on project open
        (async () => {
          try {
            const electronAPI = (window as any).electronAPI;
            const result = await electronAPI.catalyst.manifest.load(currentPath);
            
            if (result.success && result.manifest) {
              console.log('[App] Loaded Catalyst manifest:', result.manifest);
              loadWorkflowManifest(result.manifest);
            } else if (result.error?.includes('ENOENT')) {
              // Manifest doesn't exist yet - this is okay for new projects
              console.log('[App] No Catalyst manifest found, will create on first save');
              resetWorkflowManifest();
            } else {
              console.error('[App] Failed to load Catalyst manifest:', result.error);
              resetWorkflowManifest();
            }
          } catch (error) {
            console.error('[App] Error loading Catalyst manifest:', error);
            resetWorkflowManifest();
          }
        })();
        
        // Task 3.3: Initialize generation service and mark as watching
        // The service will start listening for manifest changes automatically
        GenerationService.getInstance().initialize();
        useGenerationStore.getState().setWatching(true);
        
        // Note: Initial generation happens automatically when manifest loads
        // via the manifestStore subscription in GenerationService
      }
      
      // Update the ref for next comparison
      previousProjectPath.current = currentPath;
    }
  }, [currentProject?.path, startPreview, stopPreview, clearManifest, initializeAI, cleanupAI]);

  /**
   * Handle global keyboard shortcuts
   */
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd+N / Ctrl+N - New Project
      if ((e.metaKey || e.ctrlKey) && e.key === 'n') {
        e.preventDefault();
        openDialog();
      }
      
      // Cmd+O / Ctrl+O - Open Project
      if ((e.metaKey || e.ctrlKey) && e.key === 'o') {
        e.preventDefault();
        openOpenDialog();
      }
      
      // Cmd+R / Ctrl+R - Refresh file tree
      if ((e.metaKey || e.ctrlKey) && e.key === 'r') {
        e.preventDefault();
        
        // Trigger refresh via window-stored function (from FileTree)
        const refreshFn = (window as any).__fileTreeRefresh;
        if (refreshFn && typeof refreshFn === 'function') {
          refreshFn();
        }
      }
      
      // Cmd+Shift+G / Ctrl+Shift+G - Open AI Generate dialog (Task 2.4E)
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'g') {
        e.preventDefault();
        if (currentProject) {
          setAiDialogOpen(true);
        }
      }
    };

    // Add event listener
    window.addEventListener('keydown', handleKeyDown);

    // Cleanup on unmount
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [openDialog, openOpenDialog, currentProject]);

  // TEMPORARY: Show WorkflowCanvas test page instead of normal app
  if (SHOW_WORKFLOW_TEST) {
    return <WorkflowCanvasTest />;
  }

  return (
    <>
      <Layout />
      <NewProjectDialog />
      <OpenProjectDialog />
      <MissingManifestDialog />
      {/* AI Prompt Dialog - can be opened via keyboard shortcut Cmd+Shift+G */}
      <AIPromptDialog
        isOpen={aiDialogOpen}
        onClose={() => setAiDialogOpen(false)}
      />
    </>
  );
}

export default App;
