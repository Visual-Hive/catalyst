/**
 * @file electron/preload.ts
 * @description Preload script for secure IPC communication via contextBridge
 * 
 * SECURITY CRITICAL: This is the ONLY bridge between the renderer process and
 * the main process. It uses Electron's contextBridge API to safely expose a
 * limited set of APIs to the renderer without giving it full Node.js access.
 * 
 * ALL IPC communication must go through this file. Never expose the entire
 * ipcRenderer or any Node.js APIs directly.
 * 
 * @architecture Phase 1, Task 1.1 - Electron Application Shell
 * @created 2025-11-19
 * @updated 2025-11-25 - Added preview system API (Task 1.4A)
 * @author AI (Cline) + Human Review
 * @confidence 9/10 - Following Electron security best practices
 * 
 * @see docs/SECURITY_SPEC.md - IPC security requirements
 * @see .clinerules/project-rules.md - Security rules
 * 
 * @security-critical true - This is the security boundary
 * @performance-critical false
 */

import { contextBridge, ipcRenderer } from 'electron';

/**
 * Preview server state type (from main process)
 */
interface PreviewServerState {
  status: 'stopped' | 'starting' | 'running' | 'stopping' | 'error';
  port: number | null;
  url: string | null;
  error: string | null;
  projectPath: string | null;
  pid: number | null;
  startedAt: Date | null;
}

/**
 * AI Generation API interface
 * 
 * Controls AI component generation via Claude API.
 * All operations go through the main process for security (API key protection).
 */
/**
 * Generation API interface
 * 
 * Controls code generation from manifest to files.
 * Calls FileManager in main process via IPC.
 */
export interface GenerationAPI {
  /** Generate files from manifest (incremental by default) */
  generate: (request: GenerateRequest) => Promise<GenerateResult>;
  
  /** Force full regeneration of all files */
  regenerateAll: (request: GenerateRequest) => Promise<GenerateResult>;
  
  /** Cleanup FileManager when project closes */
  cleanup: () => Promise<{ success: boolean }>;
  
  /** Get current FileManager status (for debugging) */
  status: () => Promise<{ initialized: boolean; projectPath: string | null }>;
}

/**
 * Generation request parameters
 */
export interface GenerateRequest {
  /** Absolute path to project root */
  projectPath: string;
  
  /** Complete manifest object */
  manifest: any;
  
  /** If true, only regenerate changed components (default: true) */
  incremental?: boolean;
}

/**
 * Generation result
 */
export interface GenerateResult {
  /** Whether generation succeeded */
  success: boolean;
  
  /** Generation summary on success */
  data?: {
    filesWritten: number;
    filesFailed: number;
    durationMs: number;
    breakdown?: {
      added: number;
      modified: number;
      removed: number;
      appRegenerated: boolean;
    };
  };
  
  /** Error message on failure */
  error?: string;
  
  /** Detailed errors (if any files failed) */
  errors?: Array<{
    filepath: string;
    error: string;
  }>;
}

export interface AIAPI {
  /** Initialize AI generator for a project */
  initialize: (projectPath: string) => Promise<{ success: boolean; error?: string }>;
  
  /** Cleanup AI generator when project closes */
  cleanup: () => Promise<{ success: boolean }>;
  
  /** Check if API key is configured */
  hasKey: () => Promise<{ success: boolean; hasKey: boolean; error?: string }>;
  
  /** Validate an API key (makes test API call) */
  validateKey: (apiKey: string) => Promise<{ success: boolean; valid: boolean; error?: string; errorCode?: string }>;
  
  /** Store API key (validates first) */
  storeKey: (apiKey: string) => Promise<{ success: boolean; error?: string; errorCode?: string }>;
  
  /** Delete stored API key */
  deleteKey: () => Promise<{ success: boolean; deleted: boolean; error?: string }>;
  
  /** Estimate cost for a prompt */
  estimateCost: (prompt: string) => Promise<{ success: boolean; estimate?: CostEstimate; error?: string }>;
  
  /** Generate a component from natural language */
  generate: (prompt: string, context: GenerationContext) => Promise<{ success: boolean; result?: GenerationResult; error?: string }>;
  
  /** Generate a component with full hierarchy (Task 3.7 Enhanced) */
  generateEnhanced: (prompt: string, context: GenerationContext) => Promise<{ success: boolean; result?: EnhancedGenerationResult; error?: string }>;
  
  /** Get current usage statistics */
  getUsageStats: () => Promise<{ success: boolean; stats?: UsageStats; error?: string }>;
  
  /** Get budget configuration */
  getBudgetConfig: () => Promise<{ success: boolean; config?: BudgetConfig; error?: string }>;
  
  /** Update budget configuration */
  updateBudgetConfig: (config: Partial<BudgetConfig>) => Promise<{ success: boolean; error?: string }>;
}

/**
 * AI types (simplified for preload context)
 */
interface GenerationContext {
  framework: 'react';
  schemaLevel: 1;
  parentComponentId?: string;
  parentComponentType?: string;
  existingComponentNames: string[];
}

interface GenerationResult {
  success: boolean;
  component?: any; // Component type from manifest
  error?: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    cost: number;
  };
}

/**
 * Enhanced generation result (Task 3.7)
 * Includes flattened component hierarchy
 */
interface EnhancedGenerationResult extends GenerationResult {
  /** All components including root and descendants, keyed by ID */
  allComponents?: Record<string, any>;
}

interface CostEstimate {
  estimatedCost: number;
  remainingBudget: number;
  canAfford: boolean;
  warning?: string;
}

interface UsageStats {
  todaySpent: number;
  dailyBudget: number;
  remaining: number;
  requestCount: number;
  percentUsed: number;
}

interface BudgetConfig {
  dailyBudgetUSD: number;
  warningThreshold: number;
  strictMode: boolean;
}

/**
 * Manifest API interface
 * 
 * Manages manifest file operations (load, save, initialize).
 */
export interface ManifestAPI {
  /** Load manifest from project */
  load: (projectPath: string) => Promise<ManifestLoadResult>;
  
  /** Save manifest to project */
  save: (projectPath: string, manifest: any) => Promise<ManifestSaveResult>;
  
  /** Check if manifest exists */
  exists: (projectPath: string) => Promise<ManifestExistsResult>;
  
  /** Initialize empty manifest */
  initialize: (projectPath: string, projectName: string) => Promise<ManifestSaveResult>;
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
 * Workflow API interface
 * 
 * Controls Python code generation from workflow definitions.
 */
export interface WorkflowAPI {
  /** Generate Python code from workflow */
  generatePython: (request: GeneratePythonRequest) => Promise<GeneratePythonResult>;
  
  /** Validate workflow without generating code */
  validate: (request: ValidateWorkflowRequest) => Promise<ValidateWorkflowResult>;
  
  /** Get code preview without writing files */
  getCodePreview: (request: PreviewCodeRequest) => Promise<PreviewCodeResult>;
}

/**
 * Workflow generation request parameters
 */
export interface GeneratePythonRequest {
  projectPath: string;
  workflowId: string;
  filename?: string;
}

export interface ValidateWorkflowRequest {
  workflowId: string;
}

export interface PreviewCodeRequest {
  workflowId: string;
}

/**
 * Workflow generation result types
 */
export interface GeneratePythonResult {
  success: boolean;
  data?: {
    filepath: string;
    nodeCount: number;
    dependencies: string[];
    warnings?: string[];
  };
  error?: string;
}

export interface ValidateWorkflowResult {
  success: boolean;
  errors?: string[];
  warnings?: string[];
}

export interface PreviewCodeResult {
  success: boolean;
  code?: string;
  dependencies?: string[];
  error?: string;
}

/**
 * Preview API interface
 * 
 * Controls the Vite dev server for project preview.
 */
export interface PreviewAPI {
  /** Start Vite dev server for a project */
  start: (projectPath: string) => Promise<{ success: boolean; data?: { port: number; url: string }; error?: string }>;
  
  /** Stop the current Vite dev server */
  stop: () => Promise<{ success: boolean; error?: string }>;
  
  /** Restart the Vite dev server */
  restart: () => Promise<{ success: boolean; data?: { port: number; url: string }; error?: string }>;
  
  /** Get current server status */
  status: () => Promise<{ success: boolean; data?: PreviewServerState; error?: string }>;
  
  /** Listen for server ready events */
  onReady: (callback: (data: { port: number; url: string }) => void) => () => void;
  
  /** Listen for server error events */
  onError: (callback: (data: { message: string; code?: string }) => void) => () => void;
  
  /** Listen for server output (stdout/stderr) */
  onOutput: (callback: (data: { line: string; type: 'stdout' | 'stderr' }) => void) => () => void;
  
  /** Listen for state changes */
  onStateChange: (callback: (state: PreviewServerState) => void) => () => void;
}

/**
 * Exposed API interface for renderer process
 * 
 * This defines what the React app can call via window.electronAPI
 * Keep this minimal and only expose what's necessary for the app to function
 */
export interface ElectronAPI {
  // System information
  platform: NodeJS.Platform;
  
  // Basic communication test
  ping: () => Promise<string>;
  
  // Application info
  getVersion: () => Promise<string>;
  
  // Project creation (Task 1.3A)
  createProject: (params: CreateProjectParams) => Promise<{ success: boolean; project?: any; error?: string }>;
  onInstallProgress: (callback: (progress: InstallProgress) => void) => () => void;
  
  // Project management (Task 1.3B)
  openFolderDialog: () => Promise<string | undefined>;
  openProject: (path: string) => Promise<{ success: boolean; project?: any; error?: string }>;
  getRecentProjects: () => Promise<{ success: boolean; projects?: any[]; error?: string }>;
  getCurrentProject: () => Promise<{ success: boolean; project?: any }>;
  getProjectSettings: (path: string) => Promise<{ success: boolean; settings?: any; error?: string }>;
  updateProjectSettings: (path: string, settings: any) => Promise<{ success: boolean; error?: string }>;
  
  // File tree operations (Task 1.3A)
  getProjectFiles: (dirPath: string) => Promise<{ success: boolean; files?: any[]; error?: string }>;
  selectDirectory: () => Promise<string | null>;
  
  // Clipboard operations (Task 1.3C)
  writeClipboardText: (text: string) => Promise<{ success: boolean; error?: string }>;
  
  // Shell operations (Task 1.3C)
  showItemInFolder: (fullPath: string) => Promise<{ success: boolean; error?: string }>;
  
  // Preview system (Task 1.4A)
  preview: PreviewAPI;
  
  // Manifest system (Task 2.2A)
  manifest: ManifestAPI;
  
  // AI system (Task 2.4A)
  ai: AIAPI;
  
  // Code generation system (Task 3.3)
  generation: GenerationAPI;
  
  // Workflow system (Phase 2 LLM integration)
  workflow: WorkflowAPI;
  
  // File operations (to be implemented in future tasks)
  // readFile: (filepath: string) => Promise<string>;
  // writeFile: (filepath: string, content: string) => Promise<void>;
  // onFileChanged: (callback: (filepath: string) => void) => void;
  // onProjectError: (callback: (error: string) => void) => void;
}

/**
 * Type imports for API signatures
 */
interface CreateProjectParams {
  name: string;
  location: string;
  framework: 'react';
  template: 'basic';
  initGit?: boolean;
}

interface InstallProgress {
  step: string;
  progress: number;
  message: string;
}

/**
 * Expose safe APIs to the renderer process
 * 
 * SECURITY: Only these specific APIs are available to the renderer.
 * The renderer CANNOT access Node.js, file system, or any other native APIs
 * except through these explicitly defined methods.
 */
const electronAPI: ElectronAPI = {
  // Platform information (safe to expose)
  platform: process.platform,
  
  // Test IPC communication
  ping: () => ipcRenderer.invoke('ping'),
  
  // Get app version
  getVersion: () => ipcRenderer.invoke('get-version'),
  
  // Project creation (Task 1.3A)
  createProject: (params: CreateProjectParams) => 
    ipcRenderer.invoke('project:create', params),
  
  onInstallProgress: (callback: (progress: InstallProgress) => void) => {
    // Set up listener for progress events
    const listener = (_event: any, progress: InstallProgress) => callback(progress);
    ipcRenderer.on('project:install-progress', listener);
    
    // Return cleanup function
    return () => {
      ipcRenderer.removeListener('project:install-progress', listener);
    };
  },
  
  // Project management (Task 1.3B)
  openFolderDialog: () => ipcRenderer.invoke('dialog:open-folder'),
  openProject: (path: string) => ipcRenderer.invoke('project:open', path),
  getRecentProjects: () => ipcRenderer.invoke('project:get-recent'),
  getCurrentProject: () => ipcRenderer.invoke('project:get-current'),
  getProjectSettings: (path: string) => ipcRenderer.invoke('project:get-settings', path),
  updateProjectSettings: (path: string, settings: any) => 
    ipcRenderer.invoke('project:update-settings', path, settings),
  
  // File tree operations (Task 1.3A)
  getProjectFiles: (dirPath: string) => ipcRenderer.invoke('project:get-files', dirPath),
  selectDirectory: () => ipcRenderer.invoke('dialog:select-directory'),
  
  // Clipboard operations (Task 1.3C)
  writeClipboardText: (text: string) => ipcRenderer.invoke('clipboard:write-text', text),
  
  // Shell operations (Task 1.3C)
  showItemInFolder: (fullPath: string) => ipcRenderer.invoke('shell:show-item-in-folder', fullPath),
  
  // Preview system (Task 1.4A)
  preview: {
    // Start Vite dev server
    start: (projectPath: string) => ipcRenderer.invoke('preview:start', projectPath),
    
    // Stop Vite dev server
    stop: () => ipcRenderer.invoke('preview:stop'),
    
    // Restart Vite dev server
    restart: () => ipcRenderer.invoke('preview:restart'),
    
    // Get current server status
    status: () => ipcRenderer.invoke('preview:status'),
    
    // Listen for server ready events
    onReady: (callback: (data: { port: number; url: string }) => void) => {
      const listener = (_event: any, data: { port: number; url: string }) => callback(data);
      ipcRenderer.on('preview:ready', listener);
      // Return cleanup function
      return () => {
        ipcRenderer.removeListener('preview:ready', listener);
      };
    },
    
    // Listen for server error events
    onError: (callback: (data: { message: string; code?: string }) => void) => {
      const listener = (_event: any, data: { message: string; code?: string }) => callback(data);
      ipcRenderer.on('preview:error', listener);
      return () => {
        ipcRenderer.removeListener('preview:error', listener);
      };
    },
    
    // Listen for server output
    onOutput: (callback: (data: { line: string; type: 'stdout' | 'stderr' }) => void) => {
      const listener = (_event: any, data: { line: string; type: 'stdout' | 'stderr' }) => callback(data);
      ipcRenderer.on('preview:output', listener);
      return () => {
        ipcRenderer.removeListener('preview:output', listener);
      };
    },
    
    // Listen for state changes
    onStateChange: (callback: (state: PreviewServerState) => void) => {
      const listener = (_event: any, state: PreviewServerState) => callback(state);
      ipcRenderer.on('preview:state-change', listener);
      return () => {
        ipcRenderer.removeListener('preview:state-change', listener);
      };
    },
  },
  
  // Manifest system (Task 2.2A)
  manifest: {
    // Load manifest from project
    load: (projectPath: string) => ipcRenderer.invoke('manifest:load', projectPath),
    
    // Save manifest to project
    save: (projectPath: string, manifest: any) => 
      ipcRenderer.invoke('manifest:save', projectPath, manifest),
    
    // Check if manifest exists
    exists: (projectPath: string) => ipcRenderer.invoke('manifest:exists', projectPath),
    
    // Initialize empty manifest
    initialize: (projectPath: string, projectName: string) => 
      ipcRenderer.invoke('manifest:initialize', projectPath, projectName),
  },
  
  // AI system (Task 2.4A)
  ai: {
    // Initialize AI generator for a project
    initialize: (projectPath: string) => ipcRenderer.invoke('ai:initialize', projectPath),
    
    // Cleanup AI generator
    cleanup: () => ipcRenderer.invoke('ai:cleanup'),
    
    // Check if API key is configured
    hasKey: () => ipcRenderer.invoke('ai:has-key'),
    
    // Validate an API key
    validateKey: (apiKey: string) => ipcRenderer.invoke('ai:validate-key', apiKey),
    
    // Store API key
    storeKey: (apiKey: string) => ipcRenderer.invoke('ai:store-key', apiKey),
    
    // Delete API key
    deleteKey: () => ipcRenderer.invoke('ai:delete-key'),
    
    // Estimate cost for a prompt
    estimateCost: (prompt: string) => ipcRenderer.invoke('ai:estimate-cost', prompt),
    
    // Generate component from prompt
    generate: (prompt: string, context: GenerationContext) => 
      ipcRenderer.invoke('ai:generate', prompt, context),

    // Generate component with full hierarchy (Task 3.7 Enhanced)
    generateEnhanced: (prompt: string, context: GenerationContext) => 
      ipcRenderer.invoke('ai:generate-enhanced', prompt, context),
    
    // Get usage statistics
    getUsageStats: () => ipcRenderer.invoke('ai:get-usage-stats'),
    
    // Get budget configuration
    getBudgetConfig: () => ipcRenderer.invoke('ai:get-budget-config'),
    
    // Update budget configuration
    updateBudgetConfig: (config: Partial<BudgetConfig>) => 
      ipcRenderer.invoke('ai:update-budget-config', config),
  },
  
  // Code generation system (Task 3.3)
  generation: {
    // Generate files from manifest (incremental by default)
    generate: (request: GenerateRequest) => 
      ipcRenderer.invoke('generation:generate', request),
    
    // Force full regeneration of all files
    regenerateAll: (request: GenerateRequest) => 
      ipcRenderer.invoke('generation:regenerate-all', request),
    
    // Cleanup FileManager when project closes
    cleanup: () => ipcRenderer.invoke('generation:cleanup'),
    
    // Get current FileManager status
    status: () => ipcRenderer.invoke('generation:status'),
  },
  
  // Workflow system (Phase 2 LLM integration)
  workflow: {
    // Generate Python code from workflow
    generatePython: (request: GeneratePythonRequest) =>
      ipcRenderer.invoke('workflow:generate-python', request),
    
    // Validate workflow without generating code
    validate: (request: ValidateWorkflowRequest) =>
      ipcRenderer.invoke('workflow:validate', request),
    
    // Get code preview without writing files
    getCodePreview: (request: PreviewCodeRequest) =>
      ipcRenderer.invoke('workflow:get-code-preview', request),
  },
  
  // File operations will be added in future tasks
  // readFile: (filepath: string) => ipcRenderer.invoke('read-file', filepath),
  // writeFile: (filepath: string, content: string) => 
  //   ipcRenderer.invoke('write-file', filepath, content),
  
  // Event listeners will be added as needed
  // onFileChanged: (callback: (filepath: string) => void) => {
  //   ipcRenderer.on('file-changed', (_, filepath) => callback(filepath));
  // },
  // onProjectError: (callback: (error: string) => void) => {
  //   ipcRenderer.on('project-error', (_, error) => callback(error));
  // },
};

/**
 * Expose the API to the renderer process
 * 
 * This makes the API available as window.electronAPI in the renderer
 * The renderer can then call: window.electronAPI.ping()
 */
contextBridge.exposeInMainWorld('electronAPI', electronAPI);

/**
 * TypeScript declaration for window.electronAPI
 * This will be available in the renderer process
 */
declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}

/**
 * Log that preload script loaded successfully
 * This helps with debugging during development
 */
console.log('[PRELOAD] Preload script loaded successfully');
console.log('[PRELOAD] Platform:', process.platform);
