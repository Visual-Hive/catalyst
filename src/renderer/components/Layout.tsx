/**
 * @file Layout.tsx
 * @description Main application layout with three resizable panels
 * 
 * @architecture Phase 1, Task 1.2 - Three-Panel Layout
 * @created 2025-11-19
 * @author AI (Cline) + Human Review
 * @confidence 9/10 - Standard layout with proven libraries
 * 
 * PROBLEM SOLVED:
 * - Provides professional three-panel layout (Navigator | Editor | Properties)
 * - Panels are resizable and persist sizes across sessions
 * - Keyboard shortcuts for quick panel navigation
 * - Foundation for entire application UI
 * 
 * SOLUTION:
 * - react-resizable-panels for panel management
 * - localStorage for state persistence (handled by library)
 * - react-hotkeys-hook for keyboard shortcuts
 * - Responsive design with constraints
 * 
 * ARCHITECTURE:
 * - Left: Navigator panel (Component tree, File explorer)
 * - Center: Editor panel (Preview, Code, Console tabs)
 * - Right: Properties panel (Component properties)
 * 
 * KEYBOARD SHORTCUTS:
 * - Cmd+1: Focus Navigator panel
 * - Cmd+2: Focus Editor panel
 * - Cmd+3: Focus Properties panel
 * 
 * @performance O(1) render, smooth 60 FPS resizing
 * @security-critical false
 * @performance-critical true - Main UI layout, affects all user interactions
 */

import React from 'react';
import { PanelGroup, Panel, PanelResizeHandle } from 'react-resizable-panels';
import { useHotkeys } from 'react-hotkeys-hook';
import { NavigatorPanel } from './NavigatorPanel';
import { EditorPanel } from './EditorPanel';
import { PropertiesPanel } from './PropertiesPanel';
import { Toolbar } from './Toolbar';
import { StatusBar } from './StatusBar';
import { useLayout } from '../hooks/useLayout';

/**
 * Main Layout component
 * 
 * Assembles the complete application layout with:
 * - Toolbar at top
 * - Three resizable panels in the middle
 * - Status bar at bottom
 * 
 * Panel sizes are automatically persisted by react-resizable-panels
 * using its built-in localStorage integration.
 * 
 * PANEL CONSTRAINTS:
 * - Navigator: 15% min, 40% max, 20% default
 * - Editor: 30% min, no max, 55% default
 * - Properties: 15% min, 40% max, 25% default
 * 
 * @returns Layout component
 * 
 * @example
 * ```typescript
 * function App() {
 *   return <Layout />;
 * }
 * ```
 */
export function Layout() {
  const { focusPanel } = useLayout();

  // Keyboard shortcuts for panel focus
  // Cmd+1 (macOS) or Ctrl+1 (Windows/Linux) - Focus Navigator
  useHotkeys('mod+1', (e) => {
    e.preventDefault();
    focusPanel('navigator');
  }, [focusPanel]);

  // Cmd+2 - Focus Editor
  useHotkeys('mod+2', (e) => {
    e.preventDefault();
    focusPanel('editor');
  }, [focusPanel]);

  // Cmd+3 - Focus Properties
  useHotkeys('mod+3', (e) => {
    e.preventDefault();
    focusPanel('properties');
  }, [focusPanel]);

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-gray-100">
      {/* Top Toolbar */}
      <Toolbar />

      {/* Main Content Area with Resizable Panels */}
      <div className="flex-1 overflow-hidden">
        <PanelGroup
          direction="horizontal"
          autoSaveId="rise-panel-layout"
        >
          {/* Navigator Panel (Left) */}
          <Panel
            id="navigator"
            defaultSize={20}
            minSize={15}
            maxSize={40}
            order={1}
          >
            <NavigatorPanel />
          </Panel>

          {/* Resize Handle between Navigator and Editor */}
          <PanelResizeHandle className="w-1 bg-gray-300 hover:bg-blue-500 transition-colors cursor-col-resize" />

          {/* Editor Panel (Center) */}
          <Panel
            id="editor"
            defaultSize={55}
            minSize={30}
            order={2}
          >
            <EditorPanel />
          </Panel>

          {/* REMOVED: Properties Panel - WorkflowCanvas has its own WorkflowPropertiesPanel */}
          {/* This was the RISE properties panel for React components */}
          {/* Catalyst workflows use WorkflowPropertiesPanel built into WorkflowCanvas */}
        </PanelGroup>
      </div>

      {/* Bottom Status Bar */}
      <StatusBar />
    </div>
  );
}
