/**
 * @file NewProjectDialog.tsx
 * @description Multi-step wizard for creating new React projects
 * 
 * @architecture Phase 1, Task 1.3A - Core Project Creation
 * @created 2025-11-19
 * @author AI (Cline) + Human Review
 * @confidence 9/10 - Complete wizard implementation with validation
 * 
 * PROBLEM SOLVED:
 * - Need intuitive UI for creating new projects
 * - Guide users through name, location, and setup process
 * - Show progress during long operations (npm install)
 * - Handle errors gracefully with retry options
 * 
 * SOLUTION:
 * - 4-step wizard (NAME → LOCATION → PROGRESS → SUCCESS)
 * - Real-time validation with helpful error messages
 * - Progress tracking for npm install
 * - Error handling with retry functionality
 * - Clean state management via Zustand store
 * 
 * DIALOG FLOW:
 * 1. NAME: Enter project name with validation
 * 2. LOCATION: Choose parent directory
 * 3. PROGRESS: Show creation progress + npm install status
 * 4. SUCCESS: Confirmation with option to close
 * 
 * ERROR HANDLING:
 * - Validation errors shown inline
 * - Creation failures show error message
 * - npm install failures offer retry option
 * - Always provides clear next steps
 * 
 * @performance O(1) render per step, no expensive computations
 * @security-critical false (validation done server-side)
 * @performance-critical false
 */

import React, { useEffect } from 'react';
import { Modal, ModalFooter } from './Modal';
import { useProjectStore, DialogStep } from '../store/projectStore';
import {
  FolderIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';

// Get electronAPI with type safety
const electronAPI = (window as any).electronAPI;

/**
 * New Project Dialog Component
 * 
 * Multi-step wizard that guides users through creating a new React project.
 * Integrates with projectStore for state management and IPC for project creation.
 * 
 * STEP SEQUENCE:
 * 1. NAME (1): User enters project name
 * 2. LOCATION (2): User selects parent directory
 * 3. PROGRESS (3): System creates project + installs dependencies
 * 4. SUCCESS (4): Confirmation, user closes dialog
 * 
 * @returns NewProjectDialog component
 * 
 * @example
 * ```typescript
 * // In App.tsx:
 * import { NewProjectDialog } from './components/NewProjectDialog';
 * 
 * function App() {
 *   return (
 *     <>
 *       {/* ... other components *\/}
 *       <NewProjectDialog />
 *     </>
 *   );
 * }
 * ```
 */
export function NewProjectDialog() {
  // Get state and actions from Zustand store
  const {
    isDialogOpen,
    currentStep,
    projectName,
    projectLocation,
    nameValidationError,
    isCreating,
    error,
    installProgress,
    closeDialog,
    setProjectName,
    setProjectLocation,
    validateAndNextStep,
    createProject,
    resetDialogState,
  } = useProjectStore();

  /**
   * Handle dialog close
   * Resets state when dialog is closed
   */
  const handleClose = () => {
    closeDialog();
    // Small delay before resetting to allow modal close animation
    setTimeout(() => resetDialogState(), 300);
  };

  /**
   * Render content based on current step
   */
  const renderStepContent = () => {
    switch (currentStep) {
      case DialogStep.NAME:
        return <NameStep />;
      case DialogStep.LOCATION:
        return <LocationStep />;
      case DialogStep.PROGRESS:
        return <ProgressStep />;
      case DialogStep.SUCCESS:
        return <SuccessStep />;
      default:
        return null;
    }
  };

  /**
   * Render footer buttons based on current step
   */
  const renderFooter = () => {
    // No footer during progress or success
    if (currentStep === DialogStep.PROGRESS || currentStep === DialogStep.SUCCESS) {
      return null;
    }

    // Error state with retry option
    if (error) {
      return (
        <ModalFooter>
          <button
            onClick={handleClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={createProject}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
          >
            Retry
          </button>
        </ModalFooter>
      );
    }

    // Normal navigation buttons
    return (
      <ModalFooter>
        <button
          onClick={handleClose}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          onClick={validateAndNextStep}
          disabled={isCreating}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {currentStep === DialogStep.LOCATION ? 'Create Project' : 'Next'}
        </button>
      </ModalFooter>
    );
  };

  return (
    <Modal
      isOpen={isDialogOpen}
      onClose={handleClose}
      title="New Project"
      size="lg"
      showCloseButton={currentStep !== DialogStep.PROGRESS}
    >
      {/* Step Indicator */}
      <StepIndicator currentStep={currentStep} />

      {/* Step Content */}
      <div className="mt-6 min-h-[300px]">
        {renderStepContent()}
      </div>

      {/* Footer */}
      {renderFooter()}
    </Modal>
  );
}

/**
 * Step Indicator Component
 * 
 * Shows visual progress through the 4-step wizard
 */
function StepIndicator({ currentStep }: { currentStep: DialogStep }) {
  const steps = [
    { number: 1, label: 'Name', step: DialogStep.NAME },
    { number: 2, label: 'Location', step: DialogStep.LOCATION },
    { number: 3, label: 'Create', step: DialogStep.PROGRESS },
    { number: 4, label: 'Done', step: DialogStep.SUCCESS },
  ];

  return (
    <div className="flex items-center justify-between">
      {steps.map((step, index) => (
        <React.Fragment key={step.number}>
          {/* Step Circle */}
          <div className="flex flex-col items-center">
            <div
              className={`
                w-10 h-10 rounded-full flex items-center justify-center font-medium text-sm
                ${currentStep >= step.step
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-500'
                }
              `}
            >
              {currentStep > step.step ? (
                <CheckCircleIcon className="w-6 h-6" />
              ) : (
                step.number
              )}
            </div>
            <span className="mt-2 text-xs font-medium text-gray-600">
              {step.label}
            </span>
          </div>

          {/* Connector Line */}
          {index < steps.length - 1 && (
            <div
              className={`
                flex-1 h-1 mx-2 rounded
                ${currentStep > step.step ? 'bg-blue-600' : 'bg-gray-200'}
              `}
            />
          )}
        </React.Fragment>
      ))}
    </div>
  );
}

/**
 * Step 1: Project Name Input
 * 
 * User enters project name with real-time validation
 */
function NameStep() {
  const { projectName, nameValidationError, setProjectName } = useProjectStore();

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold text-gray-900">
          Choose a Project Name
        </h3>
        <p className="mt-1 text-sm text-gray-600">
          This will be used as the folder name and project identifier.
        </p>
      </div>

      {/* Name Input */}
      <div>
        <label htmlFor="project-name" className="block text-sm font-medium text-gray-700 mb-2">
          Project Name
        </label>
        <input
          id="project-name"
          type="text"
          value={projectName}
          onChange={(e) => setProjectName(e.target.value)}
          placeholder="my-awesome-app"
          className={`
            w-full px-4 py-2 border rounded-lg text-sm
            focus:ring-2 focus:ring-blue-500 focus:border-blue-500
            ${nameValidationError ? 'border-red-500' : 'border-gray-300'}
          `}
          autoFocus
        />
        
        {/* Validation Error */}
        {nameValidationError && (
          <p className="mt-2 text-sm text-red-600 flex items-center gap-2">
            <ExclamationTriangleIcon className="w-4 h-4" />
            {nameValidationError}
          </p>
        )}

        {/* Help Text */}
        {!nameValidationError && (
          <p className="mt-2 text-xs text-gray-500">
            Use lowercase letters, numbers, hyphens, and underscores (3-50 characters)
          </p>
        )}
      </div>

      {/* Template Info */}
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-blue-900">
          <strong>Template:</strong> Catalyst Workflow Builder
        </p>
        <p className="mt-1 text-xs text-blue-700">
          Your project will be set up for visual workflow development and Python code generation.
        </p>
      </div>
    </div>
  );
}

/**
 * Step 2: Location Selection
 * 
 * User selects parent directory where project will be created
 */
function LocationStep() {
  const { projectName, projectLocation, setProjectLocation } = useProjectStore();

  /**
   * Open native folder picker dialog
   */
  const handleBrowse = async () => {
    if (!electronAPI?.selectDirectory) {
      console.error('selectDirectory API not available');
      return;
    }

    try {
      const result = await electronAPI.selectDirectory();
      if (result) {
        setProjectLocation(result);
      }
    } catch (error) {
      console.error('Failed to select directory:', error);
    }
  };

  // Calculate full project path
  const fullPath = projectLocation
    ? `${projectLocation}/${projectName}`
    : 'No location selected';

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold text-gray-900">
          Choose Project Location
        </h3>
        <p className="mt-1 text-sm text-gray-600">
          Select the parent folder where your project will be created.
        </p>
      </div>

      {/* Location Display */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Parent Directory
        </label>
        
        {/* Browse Button */}
        <button
          onClick={handleBrowse}
          className="w-full px-4 py-3 bg-white border-2 border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors text-left flex items-center gap-3"
        >
          <FolderIcon className="w-5 h-5 text-gray-400" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">
              {projectLocation || 'Click to select folder'}
            </p>
          </div>
        </button>

        {/* Full Path Preview */}
        {projectLocation && (
          <div className="mt-3 p-3 bg-gray-50 border border-gray-200 rounded-lg">
            <p className="text-xs text-gray-500 mb-1">Project will be created at:</p>
            <p className="text-sm font-mono text-gray-900 break-all">
              {fullPath}
            </p>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
        <p className="text-sm text-gray-900">
          <strong>What happens next:</strong>
        </p>
        <ul className="mt-2 space-y-1 text-xs text-gray-600">
          <li>• Create project folder: <code className="px-1 py-0.5 bg-white rounded">{projectName}</code></li>
          <li>• Generate React + TypeScript template</li>
          <li>• Install npm dependencies (may take 1-2 minutes)</li>
          <li>• Initialize git repository</li>
        </ul>
      </div>
    </div>
  );
}

/**
 * Step 3: Progress Display
 * 
 * Shows project creation progress and npm install status
 */
function ProgressStep() {
  const { installProgress, error } = useProjectStore();

  return (
    <div className="space-y-6">
      {/* Error State */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex gap-3">
            <ExclamationTriangleIcon className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-semibold text-red-900">
                Project Creation Failed
              </h4>
              <p className="mt-1 text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Progress State */}
      {!error && installProgress && (
        <>
          <div className="text-center">
            <h3 className="text-lg font-semibold text-gray-900">
              Creating Your Project
            </h3>
            <p className="mt-1 text-sm text-gray-600">
              This may take a minute or two...
            </p>
          </div>

          {/* Progress Bar */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">
                {installProgress.step}
              </span>
              <span className="text-sm font-medium text-blue-600">
                {installProgress.percent}%
              </span>
            </div>
            <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-600 transition-all duration-300 ease-out"
                style={{ width: `${installProgress.percent}%` }}
              />
            </div>
          </div>

          {/* Status Message */}
          {installProgress.message && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-900 flex items-center gap-2">
                <ArrowPathIcon className="w-4 h-4 animate-spin" />
                {installProgress.message}
              </p>
            </div>
          )}

          {/* Activity Log */}
          <div className="max-h-32 overflow-y-auto bg-gray-900 rounded-lg p-3 font-mono text-xs text-green-400">
            {installProgress.step}...
          </div>
        </>
      )}
    </div>
  );
}

/**
 * Step 4: Success Confirmation
 * 
 * Shows success message and allows user to close dialog
 */
function SuccessStep() {
  const { projectName, projectLocation, closeDialog } = useProjectStore();

  const fullPath = `${projectLocation}/${projectName}`;

  return (
    <div className="space-y-6 text-center">
      {/* Success Icon */}
      <div className="flex justify-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
          <CheckCircleIcon className="w-10 h-10 text-green-600" />
        </div>
      </div>

      {/* Success Message */}
      <div>
        <h3 className="text-xl font-semibold text-gray-900">
          Project Created Successfully!
        </h3>
        <p className="mt-2 text-sm text-gray-600">
          Your project <strong>{projectName}</strong> is ready to use.
        </p>
      </div>

      {/* Project Path */}
      <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg text-left">
        <p className="text-xs text-gray-500 mb-1">Project location:</p>
        <p className="text-sm font-mono text-gray-900 break-all">
          {fullPath}
        </p>
      </div>

      {/* Next Steps */}
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg text-left">
        <p className="text-sm font-semibold text-blue-900 mb-2">
          Next Steps:
        </p>
        <ul className="space-y-1 text-sm text-blue-800">
          <li>• Project files will appear in the Navigator panel</li>
          <li>• Start building workflows by adding nodes to the canvas</li>
          <li>• Generated Python code will appear in .catalyst/generated/</li>
        </ul>
      </div>

      {/* Close Button */}
      <button
        onClick={closeDialog}
        className="w-full px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
      >
        Close
      </button>
    </div>
  );
}
