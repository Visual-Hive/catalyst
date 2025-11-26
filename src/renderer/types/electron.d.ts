/**
 * @file electron.d.ts
 * @description TypeScript definitions for Electron API exposed to renderer
 * 
 * @architecture Phase 2, Task 2.2A - Manifest IPC Handlers
 * @created 2025-11-26
 * @author AI (Cline) + Human Review
 * @confidence 9/10 - Standard TypeScript declaration patterns
 * 
 * @see electron/preload.ts - API implementation
 * 
 * PROBLEM SOLVED:
 * - Type-safe access to Electron APIs from renderer
 * - IntelliSense support in VS Code
 * - Compile-time checking of API calls
 * 
 * SOLUTION:
 * - Declare global Window interface extension
 * - Mirror types from preload.ts
 * - Keep in sync with preload.ts API
 * 
 * @security-critical false
 * @performance-critical false
 */

/**
 * Validation error from manifest validation
 */
export interface ValidationError {
  field: string;
  componentId?: string;
  componentName?: string;
  message: string;
  severity: 'ERROR' | 'WARNING';
  path?: string;
  code?: string;
  suggestion?: string;
  documentation?: string;
  hint?: string;
  level?: 'ERROR' | 'WARNING';
}

/**
 * Manifest operation result types
 */
export interface ManifestLoadResult {
  success: boolean;
  manifest?: any;
  validationErrors?: ValidationError[];
  validationWarnings?: ValidationError[];
  error?: string;
  errorCode?: 'NOT_FOUND' | 'PARSE_ERROR' | 'READ_ERROR';
}

export interface ManifestSaveResult {
  success: boolean;
  error?: string;
  errorCode?: 'VALIDATION_FAILED' | 'WRITE_ERROR';
}

export interface ManifestExistsResult {
  exists: boolean;
  hasLowcodeFolder: boolean;
}

/**
 * Manifest API interface
 */
export interface ManifestAPI {
  load: (projectPath: string) => Promise<ManifestLoadResult>;
  save: (projectPath: string, manifest: any) => Promise<ManifestSaveResult>;
  exists: (projectPath: string) => Promise<ManifestExistsResult>;
  initialize: (projectPath: string, projectName: string) => Promise<ManifestSaveResult>;
}

/**
 * Preview server state
 */
export interface PreviewServerState {
  status: 'stopped' | 'starting' | 'running' | 'stopping' | 'error';
  port: number | null;
  url: string | null;
  error: string | null;
  projectPath: string | null;
  pid: number | null;
  startedAt: Date | null;
}

/**
 * Preview API interface
 */
export interface PreviewAPI {
  start: (projectPath: string) => Promise<{ success: boolean; data?: { port: number; url: string }; error?: string }>;
  stop: () => Promise<{ success: boolean; error?: string }>;
  restart: () => Promise<{ success: boolean; data?: { port: number; url: string }; error?: string }>;
  status: () => Promise<{ success: boolean; data?: PreviewServerState; error?: string }>;
  onReady: (callback: (data: { port: number; url: string }) => void) => () => void;
  onError: (callback: (data: { message: string; code?: string }) => void) => () => void;
  onOutput: (callback: (data: { line: string; type: 'stdout' | 'stderr' }) => void) => () => void;
  onStateChange: (callback: (state: PreviewServerState) => void) => () => void;
}

/**
 * Project creation parameters
 */
export interface CreateProjectParams {
  name: string;
  location: string;
  framework: 'react';
  template: 'basic';
  initGit?: boolean;
}

/**
 * Install progress tracking
 */
export interface InstallProgress {
  step: string;
  progress: number;
  message: string;
}

/**
 * Complete Electron API exposed to renderer
 */
export interface ElectronAPI {
  // System information
  platform: NodeJS.Platform;
  
  // Basic communication
  ping: () => Promise<string>;
  getVersion: () => Promise<string>;
  
  // Project creation
  createProject: (params: CreateProjectParams) => Promise<{ success: boolean; project?: any; error?: string }>;
  onInstallProgress: (callback: (progress: InstallProgress) => void) => () => void;
  
  // Project management
  openFolderDialog: () => Promise<string | undefined>;
  openProject: (path: string) => Promise<{ success: boolean; project?: any; error?: string }>;
  getRecentProjects: () => Promise<{ success: boolean; projects?: any[]; error?: string }>;
  getCurrentProject: () => Promise<{ success: boolean; project?: any }>;
  getProjectSettings: (path: string) => Promise<{ success: boolean; settings?: any; error?: string }>;
  updateProjectSettings: (path: string, settings: any) => Promise<{ success: boolean; error?: string }>;
  
  // File tree operations
  getProjectFiles: (dirPath: string) => Promise<{ success: boolean; files?: any[]; error?: string }>;
  selectDirectory: () => Promise<string | null>;
  
  // Clipboard operations
  writeClipboardText: (text: string) => Promise<{ success: boolean; error?: string }>;
  
  // Shell operations
  showItemInFolder: (fullPath: string) => Promise<{ success: boolean; error?: string }>;
  
  // Preview system
  preview: PreviewAPI;
  
  // Manifest system
  manifest: ManifestAPI;
}

/**
 * Extend Window interface to include electronAPI
 */
declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}

export {};
