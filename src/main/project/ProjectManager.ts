/**
 * @file ProjectManager.ts
 * @description Core project management orchestrator for Catalyst
 * 
 * CENTRAL COORDINATOR for all project operations including:
 * - Creating new projects with templates
 * - Managing recent projects list
 * - Project validation and security checks
 * - npm dependency installation
 * - File system operations
 * 
 * This class is instantiated once in the main process and accessed
 * via IPC from the renderer process.
 * 
 * @architecture Phase 1, Task 1.3A - Core Project Creation
 * @created 2025-11-19
 * @author AI (Cline) + Human Review
 * @confidence 8/10 - Comprehensive, but npm install needs real-world testing
 * 
 * @see .implementation/phase-1-application-shell/task-1.3A-core-project-creation.md
 * @see docs/FILE_STRUCTURE_SPEC.md - Project directory structure
 * 
 * @security-critical true - Manages file system operations
 * @performance-critical false - Operations are infrequent
 */

import * as path from 'path';
import * as fs from 'fs/promises';
import { spawn } from 'child_process';
import { app } from 'electron';
import { v4 as uuidv4 } from 'uuid';
import { ProjectValidator } from './ProjectValidator';
import {
  Project,
  CreateProjectParams,
  RecentProject,
  RecentProjectsData,
  Result,
  InstallProgress,
  InstallStep,
  ProjectSettings,
  ValidationError,
  ValidationWarning,
} from './types';

/**
 * ProjectManager - Central orchestrator for project operations
 * 
 * PROBLEM SOLVED:
 * Users need a reliable, secure way to create and manage Catalyst projects.
 * This class provides:
 * - Validated project creation
 * - Secure file operations
 * - Recent projects tracking
 * - Dependency installation
 * 
 * SOLUTION:
 * Single manager class that coordinates all project operations.
 * Uses ProjectValidator for security, ProjectTemplates for generation.
 * Persists recent projects to app data directory.
 * 
 * DESIGN DECISIONS:
 * - Singleton pattern (one instance in main process)
 * - Async/await for all I/O operations
 * - Result<T, E> return type for error handling
 * - Events for progress updates (npm install)
 * - Recent projects stored as JSON (max 10)
 * 
 * USAGE EXAMPLE:
 * ```typescript
 * const manager = new ProjectManager();
 * await manager.initialize();
 * 
 * const result = await manager.createProject({
 *   name: 'my-app',
 *   location: '/Users/richard/projects',
 *   framework: 'react',
 *   template: 'basic'
 * });
 * 
 * if (result.success) {
 *   console.log('Created:', result.data.path);
 * }
 * ```
 * 
 * @class ProjectManager
 */
export class ProjectManager {
  private validator: ProjectValidator;
  private currentProject: Project | null = null;
  private recentProjectsPath: string;
  private readonly MAX_RECENT_PROJECTS = 10;
  
  // Event callback for npm install progress
  // Set this to receive progress updates
  public onInstallProgress?: (progress: InstallProgress) => void;

  /**
   * Initialize ProjectManager
   * 
   * Call this once during app startup before using any methods.
   * Sets up paths and loads recent projects.
   */
  constructor() {
    this.validator = new ProjectValidator();
    
    // Recent projects stored in app data directory
    // macOS: ~/Library/Application Support/Catalyst/recent-projects.json
    // Windows: %APPDATA%/Catalyst/recent-projects.json
    // Linux: ~/.config/Catalyst/recent-projects.json
    const userDataPath = app.getPath('userData');
    this.recentProjectsPath = path.join(userDataPath, 'recent-projects.json');
    
    console.log('[ProjectManager] Initialized');
    console.log('[ProjectManager] Recent projects path:', this.recentProjectsPath);
  }

  /**
   * Initialize the project manager (async setup)
   * 
   * Ensures userData directory exists and recent projects file is created.
   * Safe to call multiple times (idempotent).
   * 
   * @returns Promise that resolves when initialization complete
   * @async
   */
  async initialize(): Promise<void> {
    try {
      // Ensure userData directory exists
      const userDataPath = app.getPath('userData');
      await fs.mkdir(userDataPath, { recursive: true });
      
      // Ensure recent projects file exists
      try {
        await fs.access(this.recentProjectsPath);
      } catch {
        // File doesn't exist, create empty recent projects list
        const emptyData: RecentProjectsData = {
          recentProjects: [],
          maxRecentProjects: this.MAX_RECENT_PROJECTS,
          version: '1.0.0',
        };
        
        await fs.writeFile(
          this.recentProjectsPath,
          JSON.stringify(emptyData, null, 2),
          'utf-8'
        );
        
        console.log('[ProjectManager] Created recent projects file');
      }
      
      console.log('[ProjectManager] Initialization complete');
    } catch (error) {
      console.error('[ProjectManager] Initialization failed:', error);
      throw error;
    }
  }

  /**
   * Create a new Catalyst project
   * 
   * WORKFLOW:
   * 1. Validate project name
   * 2. Validate project path
   * 3. Create project directory
   * 4. Generate template files (README.md)
   * 5. Initialize git (optional)
   * 6. Add to recent projects
   * 7. Set as current project
   * 
   * @param params - Project creation parameters
   * @returns Promise with Result containing Project or Error
   * 
   * @throws Never throws - returns errors in Result
   * 
   * @example
   * ```typescript
   * const result = await manager.createProject({
   *   name: 'my-app',
   *   location: '/Users/richard/projects',
   *   framework: 'react',
   *   template: 'basic'
   * });
   * 
   * if (result.success) {
   *   console.log('Project created at:', result.data.path);
   * } else {
   *   console.error('Failed:', result.error.message);
   * }
   * ```
   * 
   * @async
   */
  async createProject(
    params: CreateProjectParams
  ): Promise<Result<Project, Error>> {
    try {
      console.log('[ProjectManager] Creating project:', params.name);
      
      // 1. Validate project name
      const nameValidation = this.validator.validateProjectName(params.name);
      if (!nameValidation.isValid) {
        const error = nameValidation.errors[0];
        return {
          success: false,
          error: new Error(`Invalid project name: ${error.message}`),
        };
      }
      
      // 2. Construct and validate project path
      // Project will be: {location}/{name}
      const projectPath = path.join(params.location, params.name);
      
      const pathValidation = await this.validator.validatePath(projectPath);
      if (!pathValidation.isValid) {
        const error = pathValidation.errors[0];
        return {
          success: false,
          error: new Error(`Invalid project path: ${error.message}`),
        };
      }
      
      // Log warnings (non-blocking)
      if (pathValidation.warnings && pathValidation.warnings.length > 0) {
        pathValidation.warnings.forEach(warning => {
          console.warn('[ProjectManager]', warning.message);
        });
      }
      
      // 3. Create project directory
      console.log('[ProjectManager] Creating directory:', projectPath);
      await fs.mkdir(projectPath, { recursive: true });
      
      // 4. Generate project from template
      console.log('[ProjectManager] Generating template files...');
      await this.generateProjectTemplate(projectPath, params);
      
      // 5. Initialize git (optional)
      if (params.initGit) {
        console.log('[ProjectManager] Initializing git repository...');
        await this.initializeGitRepo(projectPath);
      }
      
      // Note: Skipping npm install - Catalyst projects don't need npm dependencies
      // The .catalyst/ folder structure will be created by initializeCatalystStructure()
      // in electron/ipc-handlers.ts after this method returns
      
      // 6. Create Project object
      // 6. Create Project object
      const project: Project = {
        id: uuidv4(),
        name: params.name,
        path: projectPath,
        framework: params.framework,
        schemaVersion: '1.0.0',
        createdAt: new Date(),
        lastOpenedAt: new Date(),
      };
      
      // 7. Add to recent projects
      await this.addToRecentProjects(project);
      
      // 8. Set as current project
      this.currentProject = project;
      
      console.log('[ProjectManager] Project created successfully:', project.id);
      
      return {
        success: true,
        data: project,
      };
      
    } catch (error) {
      console.error('[ProjectManager] Failed to create project:', error);
      
      return {
        success: false,
        error: error instanceof Error ? error : new Error(String(error)),
      };
    }
  }

  /**
   * Generate project files from template
   * 
   * Creates minimal files for a new Catalyst workflow project:
   * - README.md (project documentation)
   * 
   * Note: .catalyst/ folder and manifest.json are created separately
   * by initializeCatalystStructure() in ipc-handlers.ts
   * 
   * TIMING: This should be instant (<100ms)
   * 
   * @param projectPath - Absolute path to project directory
   * @param params - Project creation parameters
   * @returns Promise that resolves when complete
   * 
   * @private
   * @async
   */
  private async generateProjectTemplate(
    projectPath: string,
    params: CreateProjectParams
  ): Promise<void> {
    // Generate README.md only
    // The .catalyst/ folder structure is created by initializeCatalystStructure()
    // in electron/ipc-handlers.ts after this method completes
    const readme = `# ${params.name}

A workflow automation project built with **Catalyst** - a visual workflow builder that generates production-ready Python code.

## Getting Started

Open this project in Catalyst to start building workflows:

1. **Add workflow nodes** - Drag and drop nodes onto the canvas
2. **Connect nodes** - Define your workflow logic
3. **Generate code** - Catalyst automatically generates Python/FastAPI code
4. **View output** - Check \`.catalyst/generated/\` for your Python files

## Project Structure

\`\`\`
${params.name}/
├── .catalyst/
│   ├── manifest.json        # Workflow definitions
│   └── generated/           # Generated Python code
└── README.md                # This file
\`\`\`

## Workflows

Your workflows are stored in \`.catalyst/manifest.json\` and automatically saved as you work.

Generated Python code appears in \`.catalyst/generated/\` and is ready to run with FastAPI.

## Learn More

- [Catalyst Documentation](https://github.com/Visual-Hive/catalyst)
- [Python FastAPI](https://fastapi.tiangolo.com/)
`;
    
    await fs.writeFile(
      path.join(projectPath, 'README.md'),
      readme,
      'utf-8'
    );
    
    console.log('[ProjectManager] Template files generated successfully');
  }

  /**
   * Initialize git repository in project directory
   * 
   * Runs `git init` in the project directory.
   * Non-critical - if git is not installed, logs warning but doesn't fail.
   * 
   * @param projectPath - Absolute path to project directory
   * @returns Promise that resolves when complete
   * 
   * @private
   * @async
   */
  private async initializeGitRepo(projectPath: string): Promise<void> {
    return new Promise((resolve) => {
      const git = spawn('git', ['init'], {
        cwd: projectPath,
        shell: true,
      });
      
      git.on('close', (code) => {
        if (code === 0) {
          console.log('[ProjectManager] Git repository initialized');
        } else {
          console.warn('[ProjectManager] Git init failed (code ' + code + ')');
        }
        resolve();
      });
      
      git.on('error', (error) => {
        console.warn('[ProjectManager] Git not available:', error.message);
        resolve(); // Don't fail project creation if git unavailable
      });
    });
  }

  /**
   * Install npm dependencies
   * 
   * Runs `npm install` in the project directory with progress updates.
   * This can take 30-60 seconds depending on network speed.
   * 
   * PROGRESS EVENTS:
   * Calls this.onInstallProgress() with progress updates if set.
   * 
   * @param projectPath - Absolute path to project directory
   * @returns Promise that resolves when installation complete
   * 
   * @throws Error if npm install fails
   * 
   * @private
   * @async
   */
  private async installDependencies(projectPath: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.sendInstallProgress({
        step: InstallStep.INITIALIZING,
        progress: 0,
        message: 'Starting npm install...',
      });
      
      const npm = spawn('npm', ['install'], {
        cwd: projectPath,
        shell: true,
      });
      
      let output = '';
      
      npm.stdout?.on('data', (data) => {
        const text = data.toString();
        output += text;
        
        // Parse npm output for progress
        if (text.includes('idealTree')) {
          this.sendInstallProgress({
            step: InstallStep.RESOLVING_DEPENDENCIES,
            progress: 20,
            message: 'Resolving dependencies...',
          });
        } else if (text.includes('reify')) {
          this.sendInstallProgress({
            step: InstallStep.FETCHING_PACKAGES,
            progress: 40,
            message: 'Fetching packages...',
          });
        } else if (text.includes('added')) {
          this.sendInstallProgress({
            step: InstallStep.LINKING_DEPENDENCIES,
            progress: 80,
            message: 'Linking dependencies...',
          });
        }
      });
      
      npm.stderr?.on('data', (data) => {
        console.warn('[ProjectManager] npm stderr:', data.toString());
      });
      
      npm.on('close', (code) => {
        if (code === 0) {
          this.sendInstallProgress({
            step: InstallStep.COMPLETE,
            progress: 100,
            message: 'Dependencies installed successfully',
          });
          
          console.log('[ProjectManager] Dependencies installed successfully');
          resolve();
        } else {
          this.sendInstallProgress({
            step: InstallStep.FAILED,
            progress: 0,
            message: 'npm install failed',
          });
          
          reject(new Error(`npm install failed with code ${code}`));
        }
      });
      
      npm.on('error', (error) => {
        this.sendInstallProgress({
          step: InstallStep.FAILED,
          progress: 0,
          message: error.message,
        });
        
        reject(error);
      });
    });
  }

  /**
   * Send install progress update
   * 
   * Calls the onInstallProgress callback if set.
   * IPC handler should set this callback to forward events to renderer.
   * 
   * @param progress - Progress information
   * 
   * @private
   */
  private sendInstallProgress(progress: InstallProgress): void {
    if (this.onInstallProgress) {
      this.onInstallProgress(progress);
    }
  }

  /**
   * Add project to recent projects list
   * 
   * Adds project to the front of the list, removes duplicates,
   * and trims to MAX_RECENT_PROJECTS.
   * 
   * @param project - Project to add
   * @returns Promise that resolves when saved
   * 
   * @private
   * @async
   */
  private async addToRecentProjects(project: Project): Promise<void> {
    try {
      // Load current recent projects
      const data = await this.loadRecentProjectsData();
      
      // Create recent project entry
      const recentProject: RecentProject = {
        id: project.id,
        name: project.name,
        path: project.path,
        lastOpenedAt: project.lastOpenedAt.toISOString(),
      };
      
      // Remove any existing entry for this path (avoid duplicates)
      data.recentProjects = data.recentProjects.filter(
        (p) => p.path !== project.path
      );
      
      // Add to front of list
      data.recentProjects.unshift(recentProject);
      
      // Trim to max length
      if (data.recentProjects.length > this.MAX_RECENT_PROJECTS) {
        data.recentProjects = data.recentProjects.slice(0, this.MAX_RECENT_PROJECTS);
      }
      
      // Save
      await this.saveRecentProjectsData(data);
      
      console.log('[ProjectManager] Added to recent projects:', project.name);
    } catch (error) {
      console.error('[ProjectManager] Failed to add to recent projects:', error);
      // Non-critical - don't fail project creation
    }
  }

  /**
   * Get recent projects list
   * 
   * Returns list of recently opened projects, validating that paths still exist.
   * Automatically removes invalid paths from the list.
   * 
   * VALIDATION:
   * - Checks if project directory exists
   * - Checks if .catalyst OR .lowcode folder exists (backward compatibility)
   * - Removes entries that fail validation
   * 
   * @returns Promise with array of recent projects
   * 
   * @async
   */
  async getRecentProjects(): Promise<RecentProject[]> {
    try {
      const data = await this.loadRecentProjectsData();
      
      // Validate each project path still exists AND has .catalyst or .lowcode folder
      const validatedProjects: RecentProject[] = [];
      let hasInvalidProject = false;
      
      for (const project of data.recentProjects) {
        try {
          // Check if project directory exists
          await fs.access(project.path);
          
          // Check if .catalyst OR .lowcode folder exists (backward compatibility)
          const catalystDir = path.join(project.path, '.catalyst');
          const lowcodeDir = path.join(project.path, '.lowcode');
          
          try {
            await fs.access(catalystDir);
            // .catalyst exists, keep it
            validatedProjects.push(project);
          } catch {
            // .catalyst doesn't exist, try .lowcode for backward compatibility
            try {
              await fs.access(lowcodeDir);
              // .lowcode exists, keep it
              validatedProjects.push(project);
            } catch {
              // Neither exists, project is invalid
              throw new Error('No .catalyst or .lowcode folder');
            }
          }
        } catch {
          // Path doesn't exist or has no valid folder
          console.log('[ProjectManager] Removed invalid recent project:', project.name, '-', project.path);
          hasInvalidProject = true;
        }
      }
      
      // If list changed, save updated list
      if (hasInvalidProject) {
        data.recentProjects = validatedProjects;
        await this.saveRecentProjectsData(data);
        console.log('[ProjectManager] Saved updated recent projects list:', validatedProjects.length, 'valid projects');
      }
      
      return validatedProjects;
    } catch (error) {
      console.error('[ProjectManager] Failed to get recent projects:', error);
      return [];
    }
  }

  /**
   * Load recent projects data from disk
   * 
   * @returns Promise with RecentProjectsData
   * @private
   * @async
   */
  private async loadRecentProjectsData(): Promise<RecentProjectsData> {
    try {
      const content = await fs.readFile(this.recentProjectsPath, 'utf-8');
      return JSON.parse(content);
    } catch {
      // If file doesn't exist or is invalid, return empty data
      return {
        recentProjects: [],
        maxRecentProjects: this.MAX_RECENT_PROJECTS,
        version: '1.0.0',
      };
    }
  }

  /**
   * Save recent projects data to disk
   * 
   * @param data - Data to save
   * @returns Promise that resolves when saved
   * @private
   * @async
   */
  private async saveRecentProjectsData(data: RecentProjectsData): Promise<void> {
    await fs.writeFile(
      this.recentProjectsPath,
      JSON.stringify(data, null, 2),
      'utf-8'
    );
  }

  /**
   * Load an existing Catalyst project
   * 
   * Opens and validates a Catalyst project from disk, loading its manifest
   * and settings. If valid, adds to recent projects and sets as current.
   * 
   * WORKFLOW:
   * 1. Validate project directory exists
   * 2. Validate project structure (.lowcode/ exists)
   * 3. Validate manifest.json
   * 4. Load project settings
   * 5. Create Project object
   * 6. Add to recent projects
   * 7. Set as current project
   * 
   * @param projectPath - Absolute path to project root directory
   * @returns Promise with Result containing Project or Error
   * 
   * @throws Never throws - returns errors in Result
   * 
   * @example
   * ```typescript
   * const result = await manager.loadProject('/Users/richard/projects/my-app');
   * 
   * if (result.success) {
   *   console.log('Project loaded:', result.data.name);
   * } else {
   *   console.error('Failed to load:', result.error.message);
   * }
   * ```
   * 
   * @async
   */
  async loadProject(projectPath: string): Promise<Result<Project, Error>> {
    try {
      console.log('[ProjectManager] Loading project:', projectPath);
      
      // 1. Validate project directory exists
      try {
        const stats = await fs.stat(projectPath);
        if (!stats.isDirectory()) {
          return {
            success: false,
            error: new Error('Path is not a directory'),
          };
        }
      } catch (error) {
        return {
          success: false,
          error: new Error('Project directory does not exist'),
        };
      }
      
      // 2. Validate project structure
      const validation = await this.validator.validateExistingProject(projectPath);
      if (!validation.isValid) {
        const errorMessages = validation.errors
          .map((e: ValidationError) => e.message)
          .join(', ');
        return {
          success: false,
          error: new Error(`Invalid project structure: ${errorMessages}`),
        };
      }
      
      // Log warnings (non-blocking)
      if (validation.warnings && validation.warnings.length > 0) {
        validation.warnings.forEach((warning: ValidationWarning) => {
          console.warn('[ProjectManager]', warning.message);
        });
      }
      
      // 3. Load manifest to get project metadata
      // Try .catalyst/manifest.json first, fall back to .lowcode/manifest.json
      let manifestPath = path.join(projectPath, '.catalyst', 'manifest.json');
      let manifestContent: string;
      
      try {
        manifestContent = await fs.readFile(manifestPath, 'utf-8');
      } catch {
        // Try legacy .lowcode location
        manifestPath = path.join(projectPath, '.lowcode', 'manifest.json');
        manifestContent = await fs.readFile(manifestPath, 'utf-8');
      }
      
      const manifest = JSON.parse(manifestContent);
      
      // Extract project name from manifest (fallback to directory name)
      const projectName = manifest.metadata?.projectName || path.basename(projectPath);
      
      // 4. Load settings (non-critical)
      let settings: ProjectSettings;
      try {
        settings = await this.loadProjectSettings(projectPath);
        console.log('[ProjectManager] Settings loaded');
      } catch (error) {
        console.warn('[ProjectManager] Failed to load settings, using defaults');
        settings = this.getDefaultSettings();
      }
      
      // 5. Create Project object
      const project: Project = {
        id: uuidv4(),
        name: projectName,
        path: projectPath,
        framework: 'react',
        schemaVersion: manifest.schemaVersion || '1.0.0',
        createdAt: manifest.metadata?.createdAt 
          ? new Date(manifest.metadata.createdAt) 
          : new Date(),
        lastOpenedAt: new Date(),
      };
      
      // 6. Add to recent projects
      await this.addToRecentProjects(project);
      
      // 7. Set as current project
      this.currentProject = project;
      
      console.log('[ProjectManager] Project loaded successfully:', project.id);
      
      return {
        success: true,
        data: project,
      };
      
    } catch (error) {
      console.error('[ProjectManager] Failed to load project:', error);
      
      return {
        success: false,
        error: error instanceof Error ? error : new Error(String(error)),
      };
    }
  }

  /**
   * Load project settings from .catalyst/settings.json
   * 
   * Reads and parses the project settings file. If file doesn't exist
   * or is invalid, returns default settings.
   * Backward compatible: tries .lowcode/settings.json if .catalyst version not found.
   * 
   * @param projectPath - Absolute path to project root directory
   * @returns Promise with ProjectSettings
   * 
   * @async
   */
  async loadProjectSettings(projectPath: string): Promise<ProjectSettings> {
    try {
      // Try .catalyst/settings.json first (new location)
      const settingsPath = path.join(projectPath, '.catalyst', 'settings.json');
      const content = await fs.readFile(settingsPath, 'utf-8');
      const settings = JSON.parse(content);
      
      // Validate and merge with defaults to ensure all fields present
      return {
        ...this.getDefaultSettings(),
        ...settings,
      };
    } catch (error) {
      // Try legacy .lowcode location for backward compatibility
      try {
        const legacySettingsPath = path.join(projectPath, '.lowcode', 'settings.json');
        const content = await fs.readFile(legacySettingsPath, 'utf-8');
        const settings = JSON.parse(content);
        
        console.log('[ProjectManager] Loaded settings from legacy .lowcode location');
        
        return {
          ...this.getDefaultSettings(),
          ...settings,
        };
      } catch {
        // Neither location exists, use defaults
        console.warn('[ProjectManager] Settings file not found, using defaults');
        return this.getDefaultSettings();
      }
    }
  }

  /**
   * Save project settings to .catalyst/settings.json
   * 
   * Validates and persists settings to disk. Validates port range
   * and merges with existing settings.
   * 
   * @param projectPath - Absolute path to project root directory
   * @param settings - Settings to save
   * @returns Promise that resolves when saved
   * 
   * @throws Error if settings validation fails or write fails
   * 
   * @async
   */
  async saveProjectSettings(
    projectPath: string,
    settings: ProjectSettings
  ): Promise<void> {
    try {
      // Validate port range
      if (settings.defaultPort < 1024 || settings.defaultPort > 65535) {
        throw new Error('Port must be between 1024 and 65535');
      }
      
      // Validate theme
      if (!['light', 'dark', 'system'].includes(settings.theme)) {
        throw new Error('Invalid theme value');
      }
      
      // Load existing settings and merge
      const existingSettings = await this.loadProjectSettings(projectPath);
      const mergedSettings = {
        ...existingSettings,
        ...settings,
      };
      
      // Ensure .catalyst directory exists
      const catalystDir = path.join(projectPath, '.catalyst');
      await fs.mkdir(catalystDir, { recursive: true });
      
      // Write to .catalyst/settings.json (new location)
      const settingsPath = path.join(catalystDir, 'settings.json');
      await fs.writeFile(
        settingsPath,
        JSON.stringify(mergedSettings, null, 2),
        'utf-8'
      );
      
      console.log('[ProjectManager] Settings saved successfully to .catalyst/settings.json');
    } catch (error) {
      console.error('[ProjectManager] Failed to save settings:', error);
      throw error;
    }
  }

  /**
   * Get default project settings
   * 
   * Returns the default settings used when creating new projects
   * or when settings file is missing/invalid.
   * 
   * @returns Default ProjectSettings
   * @private
   */
  private getDefaultSettings(): ProjectSettings {
    return {
      defaultPort: 5173,
      autoSave: true,
      theme: 'system',
      showHiddenFiles: false,
      strictMode: true,
    };
  }

  /**
   * Get current project
   * 
   * @returns Current project or null if none open
   */
  getCurrentProject(): Project | null {
    return this.currentProject;
  }

  /**
   * Set current project
   * 
   * @param project - Project to set as current (or null to clear)
   */
  setCurrentProject(project: Project | null): void {
    this.currentProject = project;
    
    if (project) {
      console.log('[ProjectManager] Current project:', project.name);
    } else {
      console.log('[ProjectManager] No current project');
    }
  }
}
