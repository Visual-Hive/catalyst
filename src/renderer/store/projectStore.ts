/**
 * @file projectStore.ts
 * @description Zustand store for project state management
 * 
 * Manages all project-related state including:
 * - Current project
 * - Recent projects
 * - New project dialog state
 * - Project creation progress
 * - Form validation
 * 
 * @architecture Phase 1, Task 1.3A - Core Project Creation
 * @created 2025-11-19
 * @author AI (Cline) + Human Review
 * @confidence 9/10 - Standard Zustand patterns
 * 
 * @see .implementation/phase-1-application-shell/task-1.3A-core-project-creation.md
 * 
 * @security-critical false
 * @performance-critical false
 */

import { create } from 'zustand';

/**
 * electronAPI helper to access the window.electronAPI with proper typing
 * The preload script exposes this API via contextBridge
 */
const electronAPI = (window as any).electronAPI;

/**
 * Project type (simplified for renderer)
 */
interface Project {
  id: string;
  name: string;
  path: string;
  framework: 'react';
  schemaVersion: string;
  createdAt: Date;
  lastOpenedAt: Date;
}

/**
 * Recent project entry
 */
interface RecentProject {
  id: string;
  name: string;
  path: string;
  lastOpenedAt: string;
}

/**
 * Install progress tracking
 */
interface InstallProgress {
  step: string;
  progress: number;
  percent: number; // Alias for progress (0-100)
  message: string;
}

/**
 * Dialog step enumeration
 */
enum DialogStep {
  NAME = 1,
  LOCATION = 2,
  PROGRESS = 3,
  SUCCESS = 4,
}

/**
 * Project Store State Interface
 * 
 * Complete state for project management including dialog flow,
 * form data, progress tracking, and error handling.
 */
interface ProjectState {
  // ===== Current Project State =====
  currentProject: Project | null;
  recentProjects: RecentProject[];
  
  // ===== New Project Dialog State =====
  isDialogOpen: boolean;
  dialogStep: DialogStep;
  currentStep: DialogStep; // Alias for dialogStep
  
  // ===== Open Project Dialog State =====
  isOpenDialogOpen: boolean;
  
  // ===== Form Data =====
  projectName: string;
  projectLocation: string;
  
  // ===== Progress Tracking =====
  isCreating: boolean;
  installProgress: InstallProgress | null;
  createdProject: Project | null; // Stored on success for Step 4
  
  // ===== Error States =====
  error: string | null;
  nameValidationError: string | null;
  
  // ===== New Project Dialog Actions =====
  openDialog: () => void;
  closeDialog: () => void;
  resetDialog: () => void;
  resetDialogState: () => void; // Alias for resetDialog
  nextStep: () => void;
  prevStep: () => void;
  validateAndNextStep: () => void; // Validate and advance to next step
  
  // ===== Open Project Dialog Actions =====
  openOpenDialog: () => void;
  closeOpenDialog: () => void;
  openExistingProject: (projectPath: string) => Promise<boolean>;
  
  // ===== Form Actions =====
  setProjectName: (name: string) => void;
  setProjectLocation: (location: string) => void;
  selectLocation: () => Promise<void>;
  
  // ===== Project Actions =====
  createProject: () => Promise<void>;
  loadRecentProjects: () => Promise<void>;
  setCurrentProject: (project: Project | null) => void;
}

/**
 * Validate project name
 * 
 * Rules:
 * - 3-50 characters
 * - Alphanumeric + hyphens and underscores
 * - No leading/trailing hyphens or underscores
 * - No special characters or spaces
 * 
 * @param name - Project name to validate
 * @returns Error message or null if valid
 */
function validateProjectName(name: string): string | null {
  if (!name || name.length < 3) {
    return 'Project name must be at least 3 characters';
  }
  
  if (name.length > 50) {
    return 'Project name must be 50 characters or less';
  }
  
  // Check for valid characters
  if (!/^[a-zA-Z0-9_-]+$/.test(name)) {
    return 'Project name can only contain letters, numbers, hyphens, and underscores';
  }
  
  // Check for leading/trailing hyphens or underscores
  if (/^[-_]|[-_]$/.test(name)) {
    return 'Project name cannot start or end with hyphens or underscores';
  }
  
  return null;
}

/**
 * Get default project location
 * 
 * Returns empty string - user must select location via folder picker.
 * We can't access process.env in renderer, so we don't pre-fill the location.
 * 
 * @returns Empty string (user will select via dialog)
 */
function getDefaultLocation(): string {
  // Return empty string - forces user to select location
  // This avoids accessing process.env which doesn't exist in renderer
  return '';
}

/**
 * Project Store
 * 
 * Central state management for all project-related operations.
 * Handles dialog flow, form validation, project creation, and progress tracking.
 * 
 * USAGE EXAMPLE:
 * ```typescript
 * const { openDialog, projectName, setProjectName } = useProjectStore();
 * 
 * // Open new project dialog
 * openDialog();
 * 
 * // Update form
 * setProjectName('my-app');
 * ```
 */
export const useProjectStore = create<ProjectState>((set, get) => ({
  // ===== Initial State =====
  currentProject: null,
  recentProjects: [],
  
  isDialogOpen: false,
  dialogStep: DialogStep.NAME,
  currentStep: DialogStep.NAME,
  
  isOpenDialogOpen: false,
  
  projectName: '',
  projectLocation: getDefaultLocation(),
  
  isCreating: false,
  installProgress: null,
  createdProject: null,
  
  error: null,
  nameValidationError: null,
  
  // ===== Dialog Actions =====
  
  /**
   * Open the new project dialog
   * Resets all state to defaults
   */
  openDialog: () => {
    set({
      isDialogOpen: true,
      dialogStep: DialogStep.NAME,
      currentStep: DialogStep.NAME,
      projectName: '',
      projectLocation: getDefaultLocation(),
      isCreating: false,
      installProgress: null,
      createdProject: null,
      error: null,
      nameValidationError: null,
    });
  },
  
  /**
   * Close the dialog
   * Preserves created project for potential future use
   */
  closeDialog: () => {
    set({ isDialogOpen: false });
  },
  
  /**
   * Reset dialog to initial state
   * Called after successful completion or cancel
   */
  resetDialog: () => {
    set({
      isDialogOpen: false,
      dialogStep: DialogStep.NAME,
      currentStep: DialogStep.NAME,
      projectName: '',
      projectLocation: getDefaultLocation(),
      isCreating: false,
      installProgress: null,
      createdProject: null,
      error: null,
      nameValidationError: null,
    });
  },
  
  /**
   * Alias for resetDialog
   */
  resetDialogState: () => {
    get().resetDialog();
  },
  
  /**
   * Advance to next dialog step
   * Only advances if current step is valid
   */
  nextStep: () => {
    const { dialogStep, projectName, projectLocation } = get();
    
    // Validate before advancing
    if (dialogStep === DialogStep.NAME) {
      const validationError = validateProjectName(projectName);
      if (validationError) {
        set({ nameValidationError: validationError });
        return;
      }
      set({ nameValidationError: null });
    }
    
    if (dialogStep === DialogStep.LOCATION) {
      if (!projectLocation) {
        set({ error: 'Please select a location for your project' });
        return;
      }
    }
    
    // Advance to next step
    if (dialogStep < DialogStep.SUCCESS) {
      set({ 
        dialogStep: dialogStep + 1,
        currentStep: dialogStep + 1,
      });
    }
  },
  
  /**
   * Validate current step and advance to next
   * Combines validation with nextStep for convenience
   */
  validateAndNextStep: () => {
    const { dialogStep, projectName, projectLocation } = get();
    
    // Step 1: Validate name
    if (dialogStep === DialogStep.NAME) {
      const validationError = validateProjectName(projectName);
      if (validationError) {
        set({ nameValidationError: validationError });
        return;
      }
      set({ nameValidationError: null });
      // Advance to location step
      set({ 
        dialogStep: DialogStep.LOCATION,
        currentStep: DialogStep.LOCATION,
      });
      return;
    }
    
    // Step 2: Validate location and create project
    if (dialogStep === DialogStep.LOCATION) {
      if (!projectLocation) {
        set({ error: 'Please select a location for your project' });
        return;
      }
      // Start project creation
      get().createProject();
      return;
    }
  },
  
  /**
   * Go back to previous dialog step
   * Cannot go back from progress or success steps
   */
  prevStep: () => {
    const { dialogStep, isCreating } = get();
    
    // Cannot go back while creating
    if (isCreating) {
      return;
    }
    
    // Cannot go back from progress or success
    if (dialogStep === DialogStep.PROGRESS || dialogStep === DialogStep.SUCCESS) {
      return;
    }
    
    if (dialogStep > DialogStep.NAME) {
      set({ 
        dialogStep: dialogStep - 1,
        currentStep: dialogStep - 1,
        error: null,
      });
    }
  },
  
  // ===== Form Actions =====
  
  /**
   * Update project name with real-time validation
   * 
   * @param name - New project name
   */
  setProjectName: (name: string) => {
    const validationError = validateProjectName(name);
    set({ 
      projectName: name,
      nameValidationError: validationError,
    });
  },
  
  /**
   * Update project location
   * 
   * @param location - New project location path
   */
  setProjectLocation: (location: string) => {
    set({ projectLocation: location, error: null });
  },
  
  /**
   * Open Electron folder dialog to select location
   * Updates projectLocation on success
   */
  selectLocation: async () => {
    try {
      const selectedPath = await electronAPI.openFolderDialog();
      
      if (selectedPath) {
        set({ projectLocation: selectedPath, error: null });
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      set({ error: `Failed to select folder: ${message}` });
    }
  },
  
  // ===== Project Actions =====
  
  /**
   * Create a new project
   * 
   * WORKFLOW:
   * 1. Validate inputs
   * 2. Advance to progress step
   * 3. Set up progress listener
   * 4. Call IPC to create project
   * 5. Update state on success/failure
   * 6. Advance to success step
   * 
   * @async
   */
  createProject: async () => {
    const { projectName, projectLocation } = get();
    
    // Validate name
    const nameError = validateProjectName(projectName);
    if (nameError) {
      set({ nameValidationError: nameError });
      return;
    }
    
    // Validate location
    if (!projectLocation) {
      set({ error: 'Please select a project location' });
      return;
    }
    
    // Clear errors and set creating state
    set({
      isCreating: true,
      error: null,
      nameValidationError: null,
      dialogStep: DialogStep.PROGRESS,
      currentStep: DialogStep.PROGRESS,
      installProgress: {
        step: 'Initializing',
        progress: 0,
        percent: 0,
        message: 'Starting project creation...',
      },
    });
    
    try {
      // Set up progress listener
      const cleanupProgress = electronAPI.onInstallProgress((progress: any) => {
        set({ installProgress: progress });
      });
      
      // Create project via IPC
      const result = await electronAPI.createProject({
        name: projectName,
        location: projectLocation,
        framework: 'react',
        template: 'basic',
        initGit: false, // Optional: could be a checkbox in the UI
      });
      
      // Clean up progress listener
      cleanupProgress();
      
      if (result.success && result.project) {
        // Success! Store project and advance to success step
        set({
          isCreating: false,
          createdProject: result.project,
          currentProject: result.project,
          dialogStep: DialogStep.SUCCESS,
          currentStep: DialogStep.SUCCESS,
          installProgress: {
            step: 'Complete',
            progress: 100,
            percent: 100,
            message: 'Project created successfully!',
          },
        });
        
        // Reload recent projects
        await get().loadRecentProjects();
      } else {
        // Failed
        set({
          isCreating: false,
          error: result.error || 'Failed to create project',
          dialogStep: DialogStep.LOCATION, // Go back to location step
        });
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      set({
        isCreating: false,
        error: `Project creation failed: ${message}`,
        dialogStep: DialogStep.LOCATION,
      });
    }
  },
  
  /**
   * Load recent projects from main process
   * Updates recentProjects in state
   * 
   * @async
   */
  loadRecentProjects: async () => {
    try {
      const result = await electronAPI.getRecentProjects();
      
      if (result.success && result.projects) {
        set({ recentProjects: result.projects });
      }
    } catch (error) {
      console.error('[ProjectStore] Failed to load recent projects:', error);
      // Non-critical error, don't show to user
    }
  },
  
  /**
   * Set current project
   * 
   * @param project - Project to set as current (or null to clear)
   */
  setCurrentProject: (project: Project | null) => {
    set({ currentProject: project });
  },
  
  // ===== Open Project Dialog Actions =====
  
  /**
   * Open the "Open Project" dialog
   * Loads recent projects automatically
   */
  openOpenDialog: () => {
    set({ isOpenDialogOpen: true });
    // Load recent projects will be called by the dialog component
  },
  
  /**
   * Close the "Open Project" dialog
   */
  closeOpenDialog: () => {
    set({ isOpenDialogOpen: false });
  },
  
  /**
   * Open an existing project from a path
   * 
   * WORKFLOW:
   * 1. Call IPC to load project
   * 2. Validate project structure
   * 3. Load manifest and settings
   * 4. Set as current project
   * 5. Add to recent projects
   * 6. Load manifest (Task 2.2B)
   * 
   * @param projectPath - Absolute path to project directory
   * @returns Promise<boolean> - true if successful, false otherwise
   * @async
   */
  openExistingProject: async (projectPath: string): Promise<boolean> => {
    try {
      // Call IPC to open project
      const result = await electronAPI.openProject(projectPath);
      
      if (result.success && result.project) {
        // Success! Set as current project
        set({ currentProject: result.project });
        
        // Reload recent projects to include this one
        await get().loadRecentProjects();
        
        // Load manifest (Task 2.2B)
        const { useManifestStore } = await import('./manifestStore');
        await useManifestStore.getState().loadFromFile(projectPath);
        
        return true;
      } else {
        // Failed - error message is in result.error
        console.error('[ProjectStore] Failed to open project:', result.error);
        return false;
      }
    } catch (error) {
      console.error('[ProjectStore] Error opening project:', error);
      return false;
    }
  },
}));

/**
 * Export DialogStep enum for use in components
 */
export { DialogStep };
export type { Project, RecentProject, InstallProgress };
