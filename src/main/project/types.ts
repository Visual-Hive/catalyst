/**
 * @file types.ts
 * @description TypeScript type definitions for project management (forked from Rise)
 * 
 * Provides core interfaces for:
 * - Project data structures
 * - Project creation/loading parameters
 * - Recent projects tracking
 * - Project settings configuration
 * - Validation results
 * 
 * @architecture Phase 1, Task 1.3A - Core Project Creation
 * @created 2025-11-19
 * @author AI (Cline) + Human Review
 * @confidence 9/10 - Clear, well-defined types for Level 1 MVP
 * 
 * @see .implementation/phase-1-application-shell/task-1.3A-core-project-creation.md
 * @see docs/COMPONENT_SCHEMA.md - Level 1 schema structure
 * 
 * @security-critical false - Just type definitions
 * @performance-critical false
 */

/**
 * Core project data structure
 * 
 * Represents a Rise low-code project with all metadata needed to
 * manage and track projects across sessions.
 * 
 * IMMUTABILITY: Projects should be treated as immutable once created.
 * Use spread operators to create modified copies rather than mutating.
 */
export interface Project {
  /** Unique identifier (UUID v4) */
  id: string;
  
  /** User-provided project name (3-50 characters, validated) */
  name: string;
  
  /** Absolute path to project root directory */
  path: string;
  
  /** Framework - React only for Level 1 MVP */
  framework: 'react';
  
  /** Schema version for manifest.json compatibility */
  schemaVersion: '1.0.0';
  
  /** Timestamp when project was created */
  createdAt: Date;
  
  /** Timestamp when project was last opened in Rise */
  lastOpenedAt: Date;
}

/**
 * Parameters for creating a new project
 * 
 * Used by NewProjectDialog and IPC handlers to pass creation parameters
 * from renderer to main process.
 */
export interface CreateProjectParams {
  /** Project name (must pass validation: 3-50 chars, alphanumeric + -_) */
  name: string;
  
  /** Parent directory where project folder will be created */
  location: string;
  
  /** Framework for the project - React only for MVP */
  framework: 'react';
  
  /** Template to use - basic only for MVP */
  template: 'basic';
  
  /** Optional: Initialize git repository (default: false) */
  initGit?: boolean;
}

/**
 * Simplified project info for recent projects list
 * 
 * Stored in recent-projects.json with minimal data to keep file small
 * and fast to load on app startup.
 */
export interface RecentProject {
  /** Project UUID */
  id: string;
  
  /** Display name */
  name: string;
  
  /** Absolute path (may become invalid if project moved/deleted) */
  path: string;
  
  /** ISO 8601 timestamp of last open */
  lastOpenedAt: string;
}

/**
 * Recent projects storage file structure
 * 
 * Persisted to app data directory as JSON file.
 * Location:
 * - macOS: ~/Library/Application Support/Catalyst/recent-projects.json
 * - Windows: %APPDATA%/Catalyst/recent-projects.json
 * - Linux: ~/.config/Catalyst/recent-projects.json
 */
export interface RecentProjectsData {
  /** List of recent projects (max 10) */
  recentProjects: RecentProject[];
  
  /** Maximum number of projects to track */
  maxRecentProjects: number;
  
  /** Schema version for future migrations */
  version: string;
}

/**
 * Project settings stored in .lowcode/settings.json
 * 
 * User-configurable per-project settings that persist across sessions.
 * Editable in Project Settings panel (Task 1.3B).
 */
export interface ProjectSettings {
  /** Vite dev server port (1024-65535) */
  defaultPort: number;
  
  /** Auto-save manifest.json on changes */
  autoSave: boolean;
  
  /** UI theme preference */
  theme: 'light' | 'dark' | 'system';
  
  /** Show hidden files in Navigator */
  showHiddenFiles?: boolean;
  
  /** Enable TypeScript strict mode (default: true) */
  strictMode?: boolean;
}

/**
 * Result of validation operations
 * 
 * Used throughout the system for consistent error handling.
 * Follows the Result pattern (success/failure with data or error).
 */
export interface ValidationResult {
  /** Whether validation passed */
  isValid: boolean;
  
  /** Validation errors (empty if isValid = true) */
  errors: ValidationError[];
  
  /** Optional warnings that don't prevent operation */
  warnings?: ValidationWarning[];
}

/**
 * Validation error details
 */
export interface ValidationError {
  /** Field or context that failed validation */
  field: string;
  
  /** Human-readable error message */
  message: string;
  
  /** Specific error code for programmatic handling */
  code: ValidationErrorCode;
  
  /** Optional suggestion to fix the error */
  suggestion?: string;
}

/**
 * Validation warning (non-blocking)
 */
export interface ValidationWarning {
  /** Context that triggered warning */
  field: string;
  
  /** Warning message */
  message: string;
}

/**
 * Standard validation error codes
 */
export enum ValidationErrorCode {
  // Project name errors
  NAME_TOO_SHORT = 'NAME_TOO_SHORT',
  NAME_TOO_LONG = 'NAME_TOO_LONG',
  NAME_INVALID_CHARS = 'NAME_INVALID_CHARS',
  
  // Path errors
  PATH_INVALID = 'PATH_INVALID',
  PATH_NOT_ABSOLUTE = 'PATH_NOT_ABSOLUTE',
  PATH_SYSTEM_DIRECTORY = 'PATH_SYSTEM_DIRECTORY',
  PATH_NO_PERMISSION = 'PATH_NO_PERMISSION',
  PATH_ALREADY_EXISTS = 'PATH_ALREADY_EXISTS',
  PATH_TRAVERSAL_ATTEMPT = 'PATH_TRAVERSAL_ATTEMPT',
  
  // Project structure errors
  PROJECT_NOT_FOUND = 'PROJECT_NOT_FOUND',
  PROJECT_INVALID_STRUCTURE = 'PROJECT_INVALID_STRUCTURE',
  MANIFEST_NOT_FOUND = 'MANIFEST_NOT_FOUND',
  MANIFEST_INVALID = 'MANIFEST_INVALID',
  MANIFEST_WRONG_LEVEL = 'MANIFEST_WRONG_LEVEL',
  
  // Settings errors
  SETTINGS_INVALID = 'SETTINGS_INVALID',
  PORT_OUT_OF_RANGE = 'PORT_OUT_OF_RANGE',
  
  // Generic
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

/**
 * Generic Result type for operations that can succeed or fail
 * 
 * Follows functional programming pattern to avoid throwing exceptions
 * in many cases. Forces caller to handle both success and failure cases.
 * 
 * @example
 * ```typescript
 * const result = await projectManager.createProject(params);
 * if (result.success) {
 *   console.log('Project created:', result.data.name);
 * } else {
 *   console.error('Failed:', result.error);
 * }
 * ```
 */
export type Result<T, E = Error> =
  | { success: true; data: T }
  | { success: false; error: E };

/**
 * npm install progress information
 * 
 * Sent from main process to renderer during dependency installation
 * to provide real-time progress feedback.
 */
export interface InstallProgress {
  /** Current step in installation process */
  step: InstallStep;
  
  /** Progress percentage (0-100) */
  progress: number;
  
  /** Optional status message */
  message?: string;
  
  /** Optional current package being installed */
  currentPackage?: string;
}

/**
 * Steps in npm install process
 */
export enum InstallStep {
  INITIALIZING = 'INITIALIZING',
  RESOLVING_DEPENDENCIES = 'RESOLVING_DEPENDENCIES',
  FETCHING_PACKAGES = 'FETCHING_PACKAGES',
  LINKING_DEPENDENCIES = 'LINKING_DEPENDENCIES',
  BUILDING_PACKAGES = 'BUILDING_PACKAGES',
  COMPLETE = 'COMPLETE',
  FAILED = 'FAILED',
}

/**
 * File tree node for Navigator file explorer
 * 
 * Represents a file or folder in the project directory structure.
 * Tree is built recursively and supports lazy loading of children.
 */
export interface FileTreeNode {
  /** Unique identifier (full path) */
  id: string;
  
  /** File/folder name (not full path) */
  name: string;
  
  /** Absolute path to file/folder */
  path: string;
  
  /** Type of node */
  type: 'file' | 'folder';
  
  /** Children (for folders) - undefined means not yet loaded */
  children?: FileTreeNode[];
  
  /** Whether folder is expanded in UI */
  isExpanded?: boolean;
  
  /** Whether children are currently being loaded */
  isLoading?: boolean;
  
  /** File extension (e.g., 'tsx', 'json') */
  extension?: string;
  
  /** Size in bytes (for files) */
  size?: number;
  
  /** Last modified timestamp */
  modifiedAt?: Date;
}

/**
 * Parameters for reading directory contents
 */
export interface ReadDirectoryParams {
  /** Absolute path to directory */
  path: string;
  
  /** Include hidden files (starting with .) */
  includeHidden?: boolean;
  
  /** Recursively read subdirectories */
  recursive?: boolean;
  
  /** Maximum depth for recursive read (default: 10) */
  maxDepth?: number;
}

/**
 * IPC communication types
 * 
 * Type-safe interfaces for IPC calls between renderer and main process.
 * Each handler should have a corresponding interface here.
 */

/** Result of project creation IPC call */
export interface CreateProjectResult {
  success: boolean;
  project?: Project;
  error?: string;
}

/** Result of get recent projects IPC call */
export interface GetRecentProjectsResult {
  success: boolean;
  projects?: RecentProject[];
  error?: string;
}

/** Result of get files IPC call */
export interface GetFilesResult {
  success: boolean;
  files?: FileTreeNode[];
  error?: string;
}

/** Result of project validation IPC call */
export interface ValidateProjectResult {
  success: boolean;
  isValid?: boolean;
  errors?: ValidationError[];
  warnings?: ValidationWarning[];
  error?: string;
}
