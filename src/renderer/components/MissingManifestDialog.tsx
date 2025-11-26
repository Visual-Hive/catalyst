/**
 * @file MissingManifestDialog.tsx
 * @description Dialog shown when manifest.json is missing or corrupted
 * 
 * @architecture Phase 2, Task 2.2B - Auto-Load on Project Open
 * @created 2025-11-26
 * @author AI (Cline) + Human Review
 * @confidence 9/10 - Standard dialog pattern
 * 
 * PROBLEM SOLVED:
 * - User opens project without manifest
 * - Manifest is corrupted/unparseable
 * - Provides clear options to initialize or close
 * 
 * SOLUTION:
 * - Modal dialog with error explanation
 * - Initialize button creates empty manifest
 * - Close button returns to project selection
 * - Clear messaging about what went wrong
 * 
 * USAGE:
 * ```tsx
 * <MissingManifestDialog />
 * ```
 * 
 * @security-critical false
 * @performance-critical false
 */

import React, { useState } from 'react';
import { useManifestStore } from '../store/manifestStore';
import { useProjectStore } from '../store/projectStore';
import { Modal } from './Modal';

/**
 * MissingManifestDialog Component
 * 
 * Displays when manifest load fails with NOT_FOUND or PARSE_ERROR.
 * Offers options to initialize new manifest or close project.
 * 
 * STATE MANAGEMENT:
 * - Reads error/errorCode from manifestStore
 * - Calls initializeManifest() on user action
 * - Closes automatically on success
 * 
 * ERROR TYPES:
 * - NOT_FOUND: No .lowcode/manifest.json file
 * - PARSE_ERROR: File exists but is corrupted JSON
 * - READ_ERROR: File system error
 */
export const MissingManifestDialog: React.FC = () => {
  const { error, errorCode, initializeManifest, clearManifest } = useManifestStore();
  const { currentProject, setCurrentProject } = useProjectStore();
  
  const [isInitializing, setIsInitializing] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);

  // Only show if there's a manifest error
  const isOpen = !!error && !!errorCode && currentProject !== null;

  /**
   * Get user-friendly error message based on error code
   */
  const getErrorMessage = (): { title: string; description: string } => {
    switch (errorCode) {
      case 'NOT_FOUND':
        return {
          title: 'Manifest Not Found',
          description: 'This project does not have a manifest.json file in the .lowcode folder. This file is required to manage components in Rise.',
        };
      
      case 'PARSE_ERROR':
        return {
          title: 'Manifest Corrupted',
          description: 'The manifest.json file exists but contains invalid JSON and cannot be parsed. This may have been caused by manual editing or file corruption.',
        };
      
      case 'READ_ERROR':
        return {
          title: 'Cannot Read Manifest',
          description: 'The manifest.json file cannot be read due to file system permissions or other errors.',
        };
      
      default:
        return {
          title: 'Manifest Error',
          description: error || 'An unknown error occurred while loading the manifest.',
        };
    }
  };

  const { title, description } = getErrorMessage();

  /**
   * Initialize new manifest for project
   * Creates .lowcode folder and empty manifest.json
   */
  const handleInitialize = async () => {
    if (!currentProject) return;
    
    setIsInitializing(true);
    setInitError(null);
    
    try {
      await initializeManifest(currentProject.path, currentProject.name);
      
      // Success - dialog will close automatically as error is cleared
      setIsInitializing(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to initialize manifest';
      setInitError(message);
      setIsInitializing(false);
    }
  };

  /**
   * Close project and return to project selection
   * Clears manifest state and current project
   */
  const handleCloseProject = () => {
    clearManifest();
    setCurrentProject(null);
  };

  /**
   * Get action button text based on error type
   */
  const getActionButtonText = (): string => {
    if (errorCode === 'NOT_FOUND') {
      return 'Initialize Manifest';
    }
    if (errorCode === 'PARSE_ERROR') {
      return 'Replace with Empty Manifest';
    }
    return 'Create New Manifest';
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleCloseProject}
      title={title}
      size="md"
    >
      <div className="space-y-4">
        {/* Error Description */}
        <div className="text-sm text-gray-600 dark:text-gray-300">
          {description}
        </div>

        {/* Error Details */}
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded p-3">
          <div className="text-xs font-mono text-red-800 dark:text-red-200">
            Error: {error}
          </div>
          <div className="text-xs text-red-600 dark:text-red-300 mt-1">
            Project: {currentProject?.path}
          </div>
        </div>

        {/* Warning for PARSE_ERROR */}
        {errorCode === 'PARSE_ERROR' && (
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded p-3">
            <div className="flex gap-2">
              <svg
                className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
              <div className="text-xs text-yellow-800 dark:text-yellow-200">
                <strong>Warning:</strong> Creating a new manifest will replace the corrupted file.
                Any data in the corrupted file will be lost.
              </div>
            </div>
          </div>
        )}

        {/* Initialization Error */}
        {initError && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded p-3">
            <div className="text-sm text-red-800 dark:text-red-200">
              <strong>Initialization Failed:</strong> {initError}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3 pt-2">
          {/* Initialize Button */}
          <button
            onClick={handleInitialize}
            disabled={isInitializing}
            className={`
              flex-1 px-4 py-2 rounded
              text-sm font-medium
              transition-colors
              ${
                isInitializing
                  ? 'bg-blue-400 text-white cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }
            `}
          >
            {isInitializing ? (
              <span className="flex items-center justify-center gap-2">
                <svg
                  className="animate-spin h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Initializing...
              </span>
            ) : (
              getActionButtonText()
            )}
          </button>

          {/* Close Project Button */}
          <button
            onClick={handleCloseProject}
            disabled={isInitializing}
            className={`
              px-4 py-2 rounded
              text-sm font-medium
              border border-gray-300 dark:border-gray-600
              transition-colors
              ${
                isInitializing
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
              }
            `}
          >
            Close Project
          </button>
        </div>

        {/* Help Text */}
        <div className="text-xs text-gray-500 dark:text-gray-400 pt-2 border-t border-gray-200 dark:border-gray-700">
          <strong>What is a manifest?</strong> The manifest.json file stores all
          information about your components, their properties, and relationships.
          It's the source of truth for your Rise project.
        </div>
      </div>
    </Modal>
  );
};
