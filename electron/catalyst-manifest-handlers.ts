/**
 * @file catalyst-manifest-handlers.ts
 * @description IPC handlers for Catalyst workflow manifest persistence
 * 
 * @architecture Phase 2, Task 2.X - Catalyst Manifest Persistence (Bug Fix)
 * @created 2025-12-21
 * @author AI (Cline) + Human Review
 * @confidence 9/10 - Standard file I/O patterns
 * 
 * @see src/renderer/store/workflowStore.ts - Calls these handlers
 * @see src/core/workflow/types.ts - CatalystManifest type
 * 
 * PROBLEM SOLVED:
 * - Workflows created in editor disappear on reopen
 * - workflowStore.saveManifest() had a TODO and never saved to disk
 * - Need persistent storage for workflow manifests
 * 
 * SOLUTION:
 * - IPC handlers for save/load/initialize operations
 * - Write to .catalyst/manifest.json in project directory
 * - Create .catalyst/generated/ folder for Python files
 * - Return structured results with error handling
 * 
 * IPC CHANNELS:
 * - catalyst:manifest:save - Save manifest to .catalyst/manifest.json
 * - catalyst:manifest:load - Load manifest from .catalyst/manifest.json
 * - catalyst:manifest:initialize - Create .catalyst/ structure with empty manifest
 * 
 * FILE STRUCTURE:
 * project-root/
 * ├── .catalyst/
 * │   ├── manifest.json          (workflows, nodes, edges)
 * │   └── generated/
 * │       ├── my_workflow.py     (generated Python)
 * │       └── requirements.txt   (Python dependencies)
 * 
 * @security-critical false - operates on local project files only
 * @performance-critical false - user-initiated save/load operations
 */

import { ipcMain } from 'electron';
import * as fs from 'fs/promises';
import * as path from 'path';
import type { CatalystManifest } from '../src/core/workflow/types';
import { createEmptyManifest } from '../src/core/workflow/types';

// =============================================================================
// TYPES
// =============================================================================

/**
 * Request to save Catalyst manifest
 */
interface SaveManifestRequest {
  /** Absolute path to project root directory */
  projectPath: string;
  
  /** Complete Catalyst manifest to save */
  manifest: CatalystManifest;
}

/**
 * Result of save operation
 */
interface SaveManifestResult {
  /** Whether save succeeded */
  success: boolean;
  
  /** Error message on failure */
  error?: string;
}

/**
 * Request to load Catalyst manifest
 */
interface LoadManifestRequest {
  /** Absolute path to project root directory */
  projectPath: string;
}

/**
 * Result of load operation
 */
interface LoadManifestResult {
  /** Whether load succeeded */
  success: boolean;
  
  /** Loaded manifest (if success) */
  manifest?: CatalystManifest | null;
  
  /** Error message on failure */
  error?: string;
  
  /** Error code for specific error types */
  errorCode?: 'MISSING_FILE' | 'INVALID_JSON' | 'IO_ERROR';
}

/**
 * Request to initialize new Catalyst project
 */
interface InitializeManifestRequest {
  /** Absolute path to project root directory */
  projectPath: string;
  
  /** Project name for manifest metadata */
  projectName: string;
}

/**
 * Result of initialization
 */
interface InitializeManifestResult {
  /** Whether initialization succeeded */
  success: boolean;
  
  /** Error message on failure */
  error?: string;
}

// =============================================================================
// HELPERS
// =============================================================================

/**
 * Get path to .catalyst directory
 * 
 * @param projectPath - Project root path
 * @returns Absolute path to .catalyst directory
 */
function getCatalystDir(projectPath: string): string {
  return path.join(projectPath, '.catalyst');
}

/**
 * Get path to manifest.json file
 * 
 * @param projectPath - Project root path
 * @returns Absolute path to .catalyst/manifest.json
 */
function getManifestPath(projectPath: string): string {
  return path.join(getCatalystDir(projectPath), 'manifest.json');
}

/**
 * Get path to generated/ directory
 * 
 * @param projectPath - Project root path
 * @returns Absolute path to .catalyst/generated/
 */
function getGeneratedDir(projectPath: string): string {
  return path.join(getCatalystDir(projectPath), 'generated');
}

/**
 * Ensure .catalyst directory structure exists
 * 
 * Creates:
 * - .catalyst/
 * - .catalyst/generated/
 * 
 * @param projectPath - Project root path
 */
async function ensureCatalystStructure(projectPath: string): Promise<void> {
  const catalystDir = getCatalystDir(projectPath);
  const generatedDir = getGeneratedDir(projectPath);
  
  try {
    // Create .catalyst/ directory
    await fs.mkdir(catalystDir, { recursive: true });
    
    // Create .catalyst/generated/ directory
    await fs.mkdir(generatedDir, { recursive: true });
    
    console.log(`[CatalystManifest] Created directory structure at: ${catalystDir}`);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`Failed to create .catalyst directory structure: ${message}`);
  }
}

/**
 * Check if manifest file exists
 * 
 * @param projectPath - Project root path
 * @returns true if manifest.json exists
 */
async function manifestExists(projectPath: string): Promise<boolean> {
  const manifestPath = getManifestPath(projectPath);
  
  try {
    await fs.access(manifestPath);
    return true;
  } catch {
    return false;
  }
}

// =============================================================================
// HANDLERS
// =============================================================================

/**
 * Setup IPC handlers for Catalyst manifest operations
 * 
 * Call this once during app initialization (in main.ts).
 */
export function setupCatalystManifestHandlers(): void {
  console.log('[CatalystManifestHandlers] Setting up IPC handlers');
  
  /**
   * catalyst:manifest:save
   * 
   * Save Catalyst manifest to .catalyst/manifest.json
   * Creates .catalyst directory structure if it doesn't exist.
   * 
   * @param request - Save request with projectPath and manifest
   * @returns SaveManifestResult indicating success/failure
   */
  ipcMain.handle(
    'catalyst:manifest:save',
    async (_event, request: SaveManifestRequest): Promise<SaveManifestResult> => {
      try {
        const { projectPath, manifest } = request;
        
        // Validate inputs
        if (!projectPath) {
          return {
            success: false,
            error: 'Missing projectPath in save request',
          };
        }
        
        if (!manifest) {
          return {
            success: false,
            error: 'Missing manifest in save request',
          };
        }
        
        // Ensure .catalyst directory structure exists
        await ensureCatalystStructure(projectPath);
        
        // Get manifest file path
        const manifestPath = getManifestPath(projectPath);
        
        // Serialize manifest to JSON (pretty print for readability)
        const manifestJson = JSON.stringify(manifest, null, 2);
        
        // Write to file
        await fs.writeFile(manifestPath, manifestJson, 'utf-8');
        
        console.log(`[CatalystManifest] Saved manifest to: ${manifestPath}`);
        
        return {
          success: true,
        };
      } catch (error) {
        console.error('[CatalystManifest] Save error:', error);
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to save manifest',
        };
      }
    }
  );
  
  /**
   * catalyst:manifest:load
   * 
   * Load Catalyst manifest from .catalyst/manifest.json
   * Returns null manifest if file doesn't exist (not an error).
   * 
   * @param request - Load request with projectPath
   * @returns LoadManifestResult with manifest or error
   */
  ipcMain.handle(
    'catalyst:manifest:load',
    async (_event, request: LoadManifestRequest): Promise<LoadManifestResult> => {
      try {
        const { projectPath } = request;
        
        // Validate input
        if (!projectPath) {
          return {
            success: false,
            error: 'Missing projectPath in load request',
            errorCode: 'IO_ERROR',
          };
        }
        
        // Get manifest file path
        const manifestPath = getManifestPath(projectPath);
        
        // Check if file exists
        const exists = await manifestExists(projectPath);
        if (!exists) {
          console.log(`[CatalystManifest] No manifest found at: ${manifestPath}`);
          return {
            success: true,
            manifest: null, // Not an error - project may not have manifest yet
            errorCode: 'MISSING_FILE',
          };
        }
        
        // Read file
        const manifestJson = await fs.readFile(manifestPath, 'utf-8');
        
        // Parse JSON
        let manifest: CatalystManifest;
        try {
          manifest = JSON.parse(manifestJson);
        } catch (parseError) {
          console.error('[CatalystManifest] Invalid JSON:', parseError);
          return {
            success: false,
            error: 'Invalid JSON in manifest file',
            errorCode: 'INVALID_JSON',
          };
        }
        
        console.log(`[CatalystManifest] Loaded manifest from: ${manifestPath}`);
        
        return {
          success: true,
          manifest,
        };
      } catch (error) {
        console.error('[CatalystManifest] Load error:', error);
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to load manifest',
          errorCode: 'IO_ERROR',
        };
      }
    }
  );
  
  /**
   * catalyst:manifest:initialize
   * 
   * Initialize new Catalyst project with empty manifest.
   * Creates .catalyst directory structure and empty manifest.json.
   * 
   * Used when creating a new project or initializing an existing directory.
   * 
   * @param request - Initialize request with projectPath and projectName
   * @returns InitializeManifestResult indicating success/failure
   */
  ipcMain.handle(
    'catalyst:manifest:initialize',
    async (_event, request: InitializeManifestRequest): Promise<InitializeManifestResult> => {
      try {
        const { projectPath, projectName } = request;
        
        // Validate inputs
        if (!projectPath) {
          return {
            success: false,
            error: 'Missing projectPath in initialize request',
          };
        }
        
        if (!projectName) {
          return {
            success: false,
            error: 'Missing projectName in initialize request',
          };
        }
        
        // Ensure .catalyst directory structure exists
        await ensureCatalystStructure(projectPath);
        
        // Create empty manifest with project metadata
        const manifest = createEmptyManifest();
        manifest.metadata.projectName = projectName;
        manifest.metadata.createdAt = new Date().toISOString();
        manifest.metadata.updatedAt = new Date().toISOString();
        
        // Get manifest file path
        const manifestPath = getManifestPath(projectPath);
        
        // Serialize manifest to JSON
        const manifestJson = JSON.stringify(manifest, null, 2);
        
        // Write to file
        await fs.writeFile(manifestPath, manifestJson, 'utf-8');
        
        console.log(`[CatalystManifest] Initialized new manifest at: ${manifestPath}`);
        
        return {
          success: true,
        };
      } catch (error) {
        console.error('[CatalystManifest] Initialize error:', error);
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to initialize manifest',
        };
      }
    }
  );
}

/**
 * Initialize Catalyst structure for a new project
 * 
 * Creates .catalyst/ directory and empty manifest.json.
 * Can be called directly from project creation code.
 * 
 * @param projectPath - Absolute path to project root
 * @param projectName - Name of project for manifest metadata
 */
export async function initializeCatalystStructure(
  projectPath: string,
  projectName: string
): Promise<void> {
  // Ensure .catalyst directory structure exists
  await ensureCatalystStructure(projectPath);
  
  // Create empty manifest with project metadata
  const manifest = createEmptyManifest();
  manifest.metadata.projectName = projectName;
  manifest.metadata.createdAt = new Date().toISOString();
  manifest.metadata.updatedAt = new Date().toISOString();
  
  // Get manifest file path
  const manifestPath = getManifestPath(projectPath);
  
  // Serialize manifest to JSON
  const manifestJson = JSON.stringify(manifest, null, 2);
  
  // Write to file
  await fs.writeFile(manifestPath, manifestJson, 'utf-8');
  
  console.log(`[CatalystManifest] Initialized structure at: ${projectPath}`);
}

/**
 * Cleanup all handlers and resources
 * 
 * Call this during app shutdown.
 */
export function cleanupCatalystManifestHandlers(): void {
  console.log('[CatalystManifestHandlers] Cleaning up');
  
  // Remove IPC handlers
  ipcMain.removeHandler('catalyst:manifest:save');
  ipcMain.removeHandler('catalyst:manifest:load');
  ipcMain.removeHandler('catalyst:manifest:initialize');
}
