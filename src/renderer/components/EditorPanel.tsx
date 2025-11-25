/**
 * @file EditorPanel.tsx
 * @description Center editor panel with Preview/Code/Console tabs
 * 
 * @architecture Phase 1, Task 1.2 - Three-Panel Layout
 * @created 2025-11-19
 * @updated 2025-11-25 - Added PreviewPanel integration (Task 1.4B)
 * @author AI (Cline) + Human Review
 * @confidence 9/10 - Tab system with preview integration
 * 
 * PROBLEM SOLVED:
 * - Provides multi-view interface for preview, code, and console
 * - Tab system allows switching between different editor modes
 * - Preview panel with live Vite dev server
 * 
 * SOLUTION:
 * - Headless UI Tab component for accessibility
 * - Keyboard shortcuts for tab switching
 * - State persistence via useLayout hook
 * - PreviewPanel for live preview rendering
 * 
 * TABS:
 * - Preview: Live component preview via Vite dev server
 * - Code: Generated code viewer (Task 3.1+)
 * - Console: Debug output (Phase 3+)
 * 
 * @performance O(1) tab switching, lazy loading of tab content
 * @security-critical false
 * @performance-critical false
 */

import React from 'react';
import { Tab } from '@headlessui/react';
import {
  EyeIcon,
  CodeBracketIcon,
  CommandLineIcon,
} from '@heroicons/react/24/outline';
import { useLayout } from '../hooks/useLayout';
import { useHotkeys } from 'react-hotkeys-hook';
import { PreviewPanel } from './Preview';

/**
 * Code tab content (placeholder)
 * 
 * Will display generated React code in Task 3.1+
 */
function CodeTabContent() {
  return (
    <div className="flex items-center justify-center h-full bg-gray-50">
      <div className="text-center max-w-md px-6">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-100 mb-6">
          <CodeBracketIcon className="w-10 h-10 text-green-600" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Code
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          View the generated React code for your components. Clean, production-ready code.
        </p>
        <div className="px-4 py-2 bg-green-50 border border-green-200 rounded text-xs text-green-700 italic">
          🚧 Code generation coming in Phase 3 - Task 3.1
        </div>
      </div>
    </div>
  );
}

/**
 * Console tab content (placeholder)
 * 
 * Will display debug output and logs in Phase 3+
 */
function ConsoleTabContent() {
  return (
    <div className="flex items-center justify-center h-full bg-gray-50">
      <div className="text-center max-w-md px-6">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-purple-100 mb-6">
          <CommandLineIcon className="w-10 h-10 text-purple-600" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Console
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          View runtime logs, errors, and debug information. Monitor your application's behavior.
        </p>
        <div className="px-4 py-2 bg-purple-50 border border-purple-200 rounded text-xs text-purple-700 italic">
          🚧 Console output coming in Phase 3 - Debugging Features
        </div>
      </div>
    </div>
  );
}

/**
 * Editor Panel component
 * 
 * Center panel containing the tabbed interface for Preview, Code, and Console views.
 * Uses Headless UI for accessible tabs and react-hotkeys-hook for keyboard shortcuts.
 * 
 * KEYBOARD SHORTCUTS:
 * - Cmd+Shift+P: Switch to Preview tab
 * - Cmd+Shift+C: Switch to Code tab
 * - Cmd+Shift+O: Switch to Console tab
 * 
 * @returns EditorPanel component
 * 
 * @example
 * ```typescript
 * <Panel id="editor">
 *   <EditorPanel />
 * </Panel>
 * ```
 */
export function EditorPanel() {
  const { activeTab, setActiveTab } = useLayout();

  // Map tab IDs to indices for Headless UI Tab component
  const tabIdToIndex: Record<string, number> = {
    preview: 0,
    code: 1,
    console: 2,
  };

  const indexToTabId: Record<number, 'preview' | 'code' | 'console'> = {
    0: 'preview',
    1: 'code',
    2: 'console',
  };

  // Get current tab index
  const selectedIndex = tabIdToIndex[activeTab] || 0;

  // Handle tab change
  const handleTabChange = (index: number) => {
    const tabId = indexToTabId[index];
    if (tabId) {
      setActiveTab(tabId);
    }
  };

  // Keyboard shortcuts for tab switching
  useHotkeys('mod+shift+p', (e) => {
    e.preventDefault();
    setActiveTab('preview');
  }, [setActiveTab]);

  useHotkeys('mod+shift+c', (e) => {
    e.preventDefault();
    setActiveTab('code');
  }, [setActiveTab]);

  useHotkeys('mod+shift+o', (e) => {
    e.preventDefault();
    setActiveTab('console');
  }, [setActiveTab]);

  return (
    <div
      className="h-full flex flex-col bg-white"
      data-panel-id="editor"
      tabIndex={-1}
    >
      <Tab.Group selectedIndex={selectedIndex} onChange={handleTabChange}>
        {/* Tab List */}
        <Tab.List className="flex items-center gap-1 px-4 py-2 bg-gray-50 border-b border-gray-200">
          {/* Preview Tab */}
          <Tab
            className={({ selected }) =>
              `flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-t transition-colors
              ${
                selected
                  ? 'bg-white text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`
            }
          >
            <EyeIcon className="w-4 h-4" />
            <span>Preview</span>
          </Tab>

          {/* Code Tab */}
          <Tab
            className={({ selected }) =>
              `flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-t transition-colors
              ${
                selected
                  ? 'bg-white text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`
            }
          >
            <CodeBracketIcon className="w-4 h-4" />
            <span>Code</span>
          </Tab>

          {/* Console Tab */}
          <Tab
            className={({ selected }) =>
              `flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-t transition-colors
              ${
                selected
                  ? 'bg-white text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`
            }
          >
            <CommandLineIcon className="w-4 h-4" />
            <span>Console</span>
          </Tab>
        </Tab.List>

        {/* Tab Panels - flex-1 with min-h-0 to allow proper shrinking in flex container */}
        <Tab.Panels className="flex-1 min-h-0 flex flex-col">
          <Tab.Panel className="flex-1 min-h-0 flex flex-col">
            <PreviewPanel />
          </Tab.Panel>
          <Tab.Panel className="flex-1 min-h-0 flex flex-col">
            <CodeTabContent />
          </Tab.Panel>
          <Tab.Panel className="flex-1 min-h-0 flex flex-col">
            <ConsoleTabContent />
          </Tab.Panel>
        </Tab.Panels>
      </Tab.Group>
    </div>
  );
}
