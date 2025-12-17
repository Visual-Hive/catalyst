/**
 * @file OpenProjectDialog.tsx
 * @description Dialog for opening existing Catalyst projects with recent projects list
 * 
 * @architecture Phase 1, Task 1.3B - Project Loading
 * @created 2025-11-19
 * @author AI (Cline) + Human Review
 * @confidence 9/10 - Follows proven patterns from NewProjectDialog
 * 
 * PROBLEM SOLVED:
 * - Users need to open existing Catalyst projects
 * - Quick access to recently opened projects
 * - Clear feedback on invalid/corrupted projects
 * 
 * SOLUTION:
 * - Recent projects list with click-to-open
 * - Folder browser for selecting project directory
 * - Validation preview before opening
 * - Loading state and error handling
 * 
 * USAGE EXAMPLE:
 * ```typescript
 * <OpenProjectDialog />
 * ```
 * 
 * SECURITY:
 * - All file system operations through IPC
 * - Path validation in main process
 * 
 * @see src/renderer/components/NewProjectDialog.tsx - Similar dialog pattern
 * @see .implementation/phase-1-application-shell/task-1.3B-project-loading.md
 * 
 * @security-critical false
 * @performance-critical false
 */

import React, { useEffect, useState } from 'react';
import { Modal } from './Modal';
import { useProjectStore, type RecentProject } from '../store/projectStore';
import {
  FolderOpenIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';

/**
 * electronAPI helper to access window.electronAPI with proper typing
 */
const electronAPI = (window as any).electronAPI;

/**
 * Open Project Dialog Component
 * 
 * Provides two ways to open a project:
 * 1. Quick-open from recent projects list
 * 2. Browse for folder using Electron dialog
 * 
 * WORKFLOW:
 * 1. Show recent projects list
 * 2. User clicks recent project OR browses for folder
 * 3. Show loading state
 * 4. Validate project (backend)
 * 5. Load project and close dialog
 * 6. Show error if validation fails
 * 
 * @returns OpenProjectDialog component
 */
export function OpenProjectDialog() {
  // Get state and actions from project store
  const {
    isOpenDialogOpen,
    closeOpenDialog,
    recentProjects,
    loadRecentProjects,
    openExistingProject,
  } = useProjectStore();

  // Local state for loading and errors
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedPath, setSelectedPath] = useState<string | null>(null);

  /**
   * Load recent projects when dialog opens
   */
  useEffect(() => {
    if (isOpenDialogOpen) {
      // Reset state
      setIsLoading(false);
      setError(null);
      setSelectedPath(null);

      // Load recent projects
      loadRecentProjects();
    }
  }, [isOpenDialogOpen, loadRecentProjects]);

  /**
   * Handle opening a project from path
   * 
   * @param path - Absolute path to project directory
   */
  const handleOpenProject = async (path: string) => {
    setIsLoading(true);
    setError(null);
    setSelectedPath(path);

    try {
      // Call store action to open project
      const success = await openExistingProject(path);

      if (success) {
        // Success! Close dialog
        closeOpenDialog();
      } else {
        // Error is set in store, but we'll show it here too
        setError('Failed to open project. Please check the project directory.');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setError(`Failed to open project: ${message}`);
    } finally {
      setIsLoading(false);
      setSelectedPath(null);
    }
  };

  /**
   * Handle browsing for a folder
   */
  const handleBrowseFolder = async () => {
    setError(null);

    try {
      // Open Electron folder dialog
      const selectedPath = await electronAPI.openFolderDialog();

      if (selectedPath) {
        // User selected a folder, try to open it
        await handleOpenProject(selectedPath);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setError(`Failed to select folder: ${message}`);
    }
  };

  /**
   * Format date string for display
   * 
   * @param dateString - ISO date string
   * @returns Formatted date string (e.g., "Nov 19, 2025")
   */
  const formatDate = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return 'Unknown date';
    }
  };

  /**
   * Close dialog and reset state
   */
  const handleClose = () => {
    if (!isLoading) {
      closeOpenDialog();
    }
  };

  return (
    <Modal
      isOpen={isOpenDialogOpen}
      onClose={handleClose}
      title="Open Project"
      size="large"
    >
      <div className="space-y-6">
        {/* Error Display */}
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
            <ExclamationTriangleIcon className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="text-sm font-medium text-red-900 mb-1">
                Failed to Open Project
              </h4>
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        )}

        {/* Browse for Folder Section */}
        <div>
          <h3 className="text-sm font-medium text-gray-900 mb-3">
            Browse for Project
          </h3>
          <button
            onClick={handleBrowseFolder}
            disabled={isLoading}
            className={`
              w-full px-4 py-3 border-2 border-dashed rounded-lg
              flex items-center justify-center gap-3
              transition-colors
              ${
                isLoading
                  ? 'border-gray-200 bg-gray-50 cursor-not-allowed'
                  : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50'
              }
            `}
          >
            {isLoading ? (
              <>
                <ArrowPathIcon className="w-5 h-5 text-gray-400 animate-spin" />
                <span className="text-sm text-gray-600">
                  Opening project...
                </span>
              </>
            ) : (
              <>
                <FolderOpenIcon className="w-5 h-5 text-gray-600" />
                <span className="text-sm font-medium text-gray-700">
                  Choose Project Folder
                </span>
              </>
            )}
          </button>
          <p className="mt-2 text-xs text-gray-500">
            Select a folder containing a Catalyst project (.lowcode directory)
          </p>
        </div>

        {/* Divider */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200" />
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="px-2 bg-white text-gray-500">
              Or open a recent project
            </span>
          </div>
        </div>

        {/* Recent Projects List */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <ClockIcon className="w-4 h-4 text-gray-500" />
            <h3 className="text-sm font-medium text-gray-900">
              Recent Projects
            </h3>
          </div>

          {recentProjects.length === 0 ? (
            // Empty state - no recent projects
            <div className="text-center py-8 px-4 border border-gray-200 rounded-lg bg-gray-50">
              <ClockIcon className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-600 mb-1">No recent projects</p>
              <p className="text-xs text-gray-500">
                Projects you open will appear here
              </p>
            </div>
          ) : (
            // Recent projects list
            <div className="space-y-2 max-h-64 overflow-y-auto scrollbar-thin">
              {recentProjects.map((project) => (
                <button
                  key={project.id}
                  onClick={() => handleOpenProject(project.path)}
                  disabled={isLoading}
                  className={`
                    w-full px-4 py-3 border rounded-lg text-left
                    flex items-start gap-3
                    transition-all
                    ${
                      isLoading && selectedPath === project.path
                        ? 'border-blue-500 bg-blue-50'
                        : isLoading
                        ? 'border-gray-200 bg-gray-50 cursor-not-allowed opacity-50'
                        : 'border-gray-200 hover:border-blue-400 hover:bg-blue-50'
                    }
                  `}
                >
                  {/* Icon */}
                  <div className="flex-shrink-0 mt-0.5">
                    {isLoading && selectedPath === project.path ? (
                      <ArrowPathIcon className="w-5 h-5 text-blue-600 animate-spin" />
                    ) : (
                      <FolderOpenIcon className="w-5 h-5 text-gray-400" />
                    )}
                  </div>

                  {/* Project Info */}
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium text-gray-900 mb-1 truncate">
                      {project.name}
                    </h4>
                    <p className="text-xs text-gray-500 truncate mb-1">
                      {project.path}
                    </p>
                    <p className="text-xs text-gray-400">
                      Last opened {formatDate(project.lastOpenedAt)}
                    </p>
                  </div>

                  {/* Arrow indicator */}
                  {!isLoading && (
                    <div className="flex-shrink-0 mt-1">
                      <svg
                        className="w-4 h-4 text-gray-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
          <button
            onClick={handleClose}
            disabled={isLoading}
            className={`
              px-4 py-2 text-sm font-medium rounded
              transition-colors
              ${
                isLoading
                  ? 'text-gray-400 cursor-not-allowed'
                  : 'text-gray-700 hover:bg-gray-100'
              }
            `}
          >
            Cancel
          </button>
        </div>
      </div>
    </Modal>
  );
}
