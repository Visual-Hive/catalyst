/**
 * @file Toolbar.tsx
 * @description Top toolbar with action buttons for common operations
 * 
 * @architecture Phase 1, Task 1.2 - Three-Panel Layout (updated Task 1.3A)
 * @created 2025-11-19
 * @updated 2025-11-19
 * @author AI (Cline) + Human Review
 * @confidence 9/10 - Toolbar with working New Project button
 * 
 * PROBLEM SOLVED:
 * - Provides quick access to common application actions
 * - Establishes visual hierarchy and navigation structure
 * - Placeholder for future functionality (Task 1.3+)
 * 
 * SOLUTION:
 * - Responsive toolbar with icon buttons
 * - Tooltips showing keyboard shortcuts
 * - Disabled state for not-yet-implemented features
 * 
 * USAGE EXAMPLE:
 * ```typescript
 * <Toolbar />
 * ```
 * 
 * ACTIONS:
 * - New Project: ✅ Opens new project dialog (Task 1.3A)
 * - Open Project: Coming in Task 1.3B
 * - Save: Coming in Phase 2+
 * - Undo/Redo: Coming in Phase 2+
 * - Settings: Coming in Phase 3+
 * 
 * @performance O(1) render, no complex computations
 * @security-critical false
 * @performance-critical false
 */

import React, { useState } from 'react';
import {
  PlusIcon,
  FolderOpenIcon,
  ArrowUturnLeftIcon,
  ArrowUturnRightIcon,
  Cog6ToothIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';
import { useProjectStore } from '../store/projectStore';
import { AIGenerateButton } from './AIGeneration';
import { SettingsDialog } from './Settings';

/**
 * Props for individual toolbar button
 */
interface ToolbarButtonProps {
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
  disabled?: boolean;
  shortcut?: string;
}

/**
 * Individual toolbar button component
 * 
 * Displays an icon button with tooltip showing label and keyboard shortcut
 * 
 * @param props - Button configuration
 */
function ToolbarButton({
  icon,
  label,
  onClick,
  disabled = false,
  shortcut,
}: ToolbarButtonProps) {
  // Build tooltip text with shortcut if provided
  const tooltipText = shortcut ? `${label} (${shortcut})` : label;

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={tooltipText}
      className={`
        flex items-center gap-2 px-3 py-2 text-sm font-medium
        rounded transition-colors
        ${
          disabled
            ? 'text-gray-400 cursor-not-allowed'
            : 'text-gray-700 hover:bg-gray-100 active:bg-gray-200'
        }
      `}
      aria-label={label}
    >
      <div className="w-5 h-5">{icon}</div>
      <span className="hidden md:inline">{label}</span>
    </button>
  );
}

/**
 * Toolbar component with application actions
 * 
 * Displays a horizontal toolbar at the top of the application with
 * common action buttons. "New Project" button is now functional and
 * opens the project creation dialog.
 * 
 * LAYOUT:
 * - Left: Primary actions (New, Open)
 * - Middle: Edit actions (Undo, Redo)
 * - Right: Settings
 * 
 * @returns Toolbar component
 * 
 * @example
 * ```typescript
 * <div className="app">
 *   <Toolbar />
 *   <main>{/* content *\/}</main>
 * </div>
 * ```
 */
export function Toolbar() {
  // Get dialog actions from project store
  const openDialog = useProjectStore((state) => state.openDialog);
  const openOpenDialog = useProjectStore((state) => state.openOpenDialog);
  const currentProject = useProjectStore((state) => state.currentProject);
  
  // Settings dialog state
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsTab, setSettingsTab] = useState<'project' | 'ai'>('project');
  
  // Open settings at specific tab
  const openSettings = (tab: 'project' | 'ai' = 'project') => {
    setSettingsTab(tab);
    setSettingsOpen(true);
  };

  return (
    <div
      className="
        flex items-center gap-2 px-4 py-2
        bg-white border-b border-gray-200
        shadow-sm
      "
      role="toolbar"
      aria-label="Application toolbar"
    >
      {/* Left section - Primary actions */}
      <div className="flex items-center gap-1">
        <ToolbarButton
          icon={<PlusIcon className="w-5 h-5" />}
          label="New Project"
          shortcut="Cmd+N"
          onClick={openDialog}
          disabled={false}
        />
        <ToolbarButton
          icon={<FolderOpenIcon className="w-5 h-5" />}
          label="Open"
          shortcut="Cmd+O"
          onClick={openOpenDialog}
          disabled={false}
        />
      </div>

      {/* Divider */}
      <div className="w-px h-6 bg-gray-300 mx-2" aria-hidden="true" />

      {/* Middle section - Edit actions */}
      <div className="flex items-center gap-1">
        <ToolbarButton
          icon={<ArrowUturnLeftIcon className="w-5 h-5" />}
          label="Undo"
          shortcut="Cmd+Z"
          disabled={true}
        />
        <ToolbarButton
          icon={<ArrowUturnRightIcon className="w-5 h-5" />}
          label="Redo"
          shortcut="Cmd+Shift+Z"
          disabled={true}
        />
      </div>

      {/* Spacer - pushes next items to the right */}
      <div className="flex-1" aria-hidden="true" />

      {/* AI Generate Button (only show when project is open) */}
      {currentProject && (
        <>
          <AIGenerateButton />
          <div className="w-px h-6 bg-gray-300 mx-2" aria-hidden="true" />
        </>
      )}

      {/* Right section - Settings */}
      <ToolbarButton
        icon={<Cog6ToothIcon className="w-5 h-5" />}
        label="Settings"
        shortcut="Cmd+,"
        onClick={() => openSettings('project')}
        disabled={!currentProject}
      />
      
      {/* Settings Dialog */}
      <SettingsDialog
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        initialTab={settingsTab}
      />
    </div>
  );
}
