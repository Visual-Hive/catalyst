/**
 * @file FileManager.ts
 * @description Main orchestrator for file management - coordinates code generation,
 *              change detection, file writing, and user edit tracking
 * 
 * @architecture Phase 3, Task 3.2 - File Management with Hash Watcher
 * @created 2025-11-27
 * @author AI (Cline) + Human Review
 * @confidence 8/10 - Complex orchestration, well-tested components
 * 
 * @see src/core/filemanager/ChangeDetector.ts - Change detection
 * @see src/core/filemanager/FileWriter.ts - File writing (CRITICAL)
 * @see src/core/filemanager/AppGenerator.ts - App.jsx/main.jsx generation
 * @see src/core/codegen/ReactCodeGenerator.ts - Component code generation
 * 
 * PROBLEM SOLVED:
 * - Need to orchestrate the complete pipeline: manifest → code → files
 * - Must coordinate multiple components:
 *   - ChangeDetector: What changed?
 *   - ReactCodeGenerator: Generate component code
 *   - AppGenerator: Generate App.jsx and main.jsx
 *   - FileWriter: Write files safely (with tracker integration)
 * - Track user-edited files to prevent overwriting
 * - Emit events for progress tracking in UI
 * 
 * SOLUTION:
 * - FileManager is the single entry point for file generation
 * - generateAll(): Full regeneration (all components)
 * - generateIncremental(): Only changed components
 * - User edit tracking with persistence option
 * - EventEmitter for progress/error events
 * 
 * PIPELINE:
 * 1. Receive manifest from UI/store
 * 2. ChangeDetector: Find what changed
 * 3. ReactCodeGenerator: Generate code for changed components
 * 4. FileWriter: Write component files (with tracker)
 * 5. AppGenerator: Regenerate App.jsx if needed
 * 6. ChangeDetector: Update cache
 * 7. Emit completion event
 * 
 * @security-critical false
 * @performance-critical true - Full pipeline on critical path
 */

import * as path from 'path';
import * as fs from 'fs/promises';
import { EventEmitter } from 'events';
import type { Manifest, Component } from '../manifest/types';
import type { FileChangeTracker } from '../FileChangeTracker';
import { ReactCodeGenerator } from '../codegen/ReactCodeGenerator';
import { FlowCodeGenerator } from '../codegen/FlowCodeGenerator';
import { ChangeDetector } from './ChangeDetector';
import { FileWriter } from './FileWriter';
import { AppGenerator, type RootComponentInfo } from './AppGenerator';
import {
  FILE_PATHS,
  DEFAULT_FILE_MANAGER_OPTIONS,
  SKIPPED_GENERATION_SUMMARY,
  type IFileManager,
  type FileManagerOptions,
  type RequiredFileManagerOptions,
  type GenerationSummary,
  type ChangeDetectionResult,
  type FileToWrite,
  type FileWriteResult,
  type UserEditInfo,
  type UserEditsCache,
  type UserEditConflict,
  type FileManagerEventType,
  type GenerationStartEvent,
  type GenerationProgressEvent,
  type GenerationCompleteEvent,
  type GenerationErrorEvent,
  type UserEditConflictEvent,
} from './types';
import type { LogicContext } from './AppGenerator';

/**
 * FileManager orchestrates the complete file generation pipeline
 * 
 * USAGE:
 * ```typescript
 * const tracker = new FileChangeTracker();
 * const fileManager = new FileManager({
 *   projectPath: '/path/to/project',
 *   fileChangeTracker: tracker,
 * });
 * 
 * // Full generation
 * const summary = await fileManager.generateAll(manifest);
 * console.log(`Generated ${summary.filesWritten} files`);
 * 
 * // Incremental generation  
 * const summary2 = await fileManager.generateIncremental(manifest);
 * if (summary2.skipped) {
 *   console.log('No changes detected');
 * }
 * 
 * // Event handling
 * fileManager.on('generation:progress', (event) => {
 *   console.log(`Generating ${event.componentName} (${event.current}/${event.total})`);
 * });
 * ```
 * 
 * COORDINATE COMPONENTS:
 * - ChangeDetector: Determines what changed
 * - ReactCodeGenerator: Generates component code
 * - AppGenerator: Generates App.jsx and main.jsx
 * - FileWriter: Writes files with tracker integration
 * 
 * USER EDIT PROTECTION:
 * Files marked as user-edited are not overwritten silently.
 * A 'user-edit:conflict' event is emitted, and the file is skipped.
 * 
 * @class FileManager
 * @extends {EventEmitter}
 * @implements {IFileManager}
 */
export class FileManager extends EventEmitter implements IFileManager {
  /**
   * Absolute path to project root
   */
  private projectPath: string;

  /**
   * FileChangeTracker for infinite loop prevention
   */
  private fileChangeTracker: FileChangeTracker;

  /**
   * Component change detector
   */
  private changeDetector: ChangeDetector;

  /**
   * React code generator
   */
  private codeGenerator: ReactCodeGenerator;

  /**
   * App.jsx and main.jsx generator 
   */
  private appGenerator: AppGenerator;

  /**
   * File writer with tracker integration
   */
  private fileWriter: FileWriter;

  /**
   * Configuration options
   */
  private options: RequiredFileManagerOptions;

  /**
   * Set of user-edited file paths
   * Files in this set will not be overwritten
   */
  private userEditedFiles: Map<string, UserEditInfo>;

  /**
   * Resolved file paths for this project
   */
  private paths: {
    componentsDir: string;
    appJsx: string;
    mainJsx: string;
    userEditsFile: string;
  };

  /**
   * Whether main.jsx has been generated (only needs generating once)
   */
  private mainJsxGenerated: boolean = false;

  /**
   * Create a new FileManager instance
   * 
   * @param options - Configuration options (projectPath and fileChangeTracker required)
   * @throws Error if required options are missing
   * 
   * @example
   * ```typescript
   * const fileManager = new FileManager({
   *   projectPath: '/path/to/project',
   *   fileChangeTracker: new FileChangeTracker(),
   * });
   * ```
   */
  constructor(options: FileManagerOptions) {
    super();

    // Validate required options
    if (!options.projectPath) {
      throw new Error('FileManager requires projectPath option');
    }
    if (!options.fileChangeTracker) {
      throw new Error('FileManager requires fileChangeTracker option (CRITICAL for infinite loop prevention)');
    }

    // Store references
    this.projectPath = options.projectPath;
    this.fileChangeTracker = options.fileChangeTracker;

    // Apply default options
    this.options = {
      ...DEFAULT_FILE_MANAGER_OPTIONS,
      ...options,
    } as RequiredFileManagerOptions;

    // Initialize user edit tracking
    this.userEditedFiles = new Map();

    // Build resolved paths
    this.paths = {
      componentsDir: path.join(this.projectPath, FILE_PATHS.COMPONENTS_DIR),
      appJsx: path.join(this.projectPath, FILE_PATHS.APP_JSX),
      mainJsx: path.join(this.projectPath, FILE_PATHS.MAIN_JSX),
      userEditsFile: path.join(this.projectPath, FILE_PATHS.USER_EDITS_FILE),
    };

    // Initialize child components
    this.changeDetector = new ChangeDetector({ debug: this.options.debug });
    this.codeGenerator = new ReactCodeGenerator();
    this.appGenerator = new AppGenerator({ debug: this.options.debug });
    this.fileWriter = new FileWriter({
      fileChangeTracker: this.fileChangeTracker,
      maxConcurrentWrites: this.options.maxConcurrentWrites,
      debug: this.options.debug,
    });

    // Log initialization
    if (this.options.debug) {
      console.log(
        '[FileManager] Initialized\n' +
        `  projectPath: ${this.projectPath}\n` +
        `  componentsDir: ${this.paths.componentsDir}\n` +
        `  persistUserEdits: ${this.options.persistUserEdits}`
      );
    }
  }

  /**
   * Generate all files from manifest (full regeneration)
   * 
   * Regenerates ALL components, App.jsx, and main.jsx.
   * Use this for initial generation or when cache is invalid.
   * 
   * @param manifest - Complete manifest
   * @returns Promise<GenerationSummary> with generation results
   * 
   * @example
   * ```typescript
   * const summary = await fileManager.generateAll(manifest);
   * if (summary.errors.length > 0) {
   *   console.error('Some files failed:', summary.errors);
   * }
   * ```
   */
  async generateAll(manifest: Manifest): Promise<GenerationSummary> {
    const startTime = performance.now();

    // Emit start event
    this.emitEvent('generation:start', {
      type: 'full',
      totalComponents: Object.keys(manifest.components).length,
    } as GenerationStartEvent);

    const errors: FileWriteResult[] = [];
    let filesWritten = 0;
    const components = Object.values(manifest.components);

    try {
      // Step 1: Generate all component files
      const componentFiles: FileToWrite[] = [];
      let current = 0;

      for (const component of components) {
        current++;

        // Emit progress event
        this.emitEvent('generation:progress', {
          current,
          total: components.length,
          componentId: component.id,
          componentName: component.displayName,
        } as GenerationProgressEvent);

        // Get file path
        const filepath = this.getComponentFilePath(component.displayName);

        // Check for user edit conflict
        if (this.isUserEdited(filepath)) {
          // Emit conflict event
          this.emitConflict(filepath, component.id);
          continue; // Skip this file
        }

        // Generate code
        const result = await this.codeGenerator.generateComponent(component, manifest);

        if (result.success) {
          componentFiles.push({
            filepath,
            content: result.code,
            componentId: component.id,
            type: 'component',
          });
        } else {
          // Generation failed
          errors.push({
            success: false,
            filepath,
            error: result.error || 'Code generation failed',
          });
        }
      }

      // Step 2: Write component files
      const writeResults = await this.fileWriter.writeFiles(componentFiles);
      
      for (const result of writeResults) {
        if (result.success) {
          filesWritten++;
        } else {
          errors.push(result);
        }
      }

      // Step 3: Generate and write App.jsx (with logic context for Level 1.5)
      const rootComponents = this.findRootComponents(manifest);
      const logicContext = this.buildLogicContext(manifest);
      const appCode = await this.appGenerator.generateAppJsx(rootComponents, logicContext);
      const appResult = await this.fileWriter.writeFile(this.paths.appJsx, appCode);
      
      if (appResult.success) {
        filesWritten++;
      } else {
        errors.push(appResult);
      }

      // Step 4: Generate and write main.jsx (only if not already generated)
      if (!this.mainJsxGenerated) {
        const mainCode = await this.appGenerator.generateMainJsx();
        const mainResult = await this.fileWriter.writeFile(this.paths.mainJsx, mainCode);
        
        if (mainResult.success) {
          filesWritten++;
          this.mainJsxGenerated = true;
        } else {
          errors.push(mainResult);
        }
      }

      // Step 5: Update change detector cache
      this.changeDetector.updateCache(manifest.components);

      // Calculate duration
      const durationMs = performance.now() - startTime;

      // Build summary
      const summary: GenerationSummary = {
        type: 'full',
        totalComponents: components.length,
        filesWritten,
        filesFailed: errors.length,
        errors,
        durationMs,
        breakdown: {
          added: components.length,
          modified: 0,
          removed: 0,
          appRegenerated: true,
          mainRegenerated: !this.mainJsxGenerated || this.mainJsxGenerated,
        },
      };

      // Emit complete event
      this.emitEvent('generation:complete', {
        summary,
      } as GenerationCompleteEvent);

      // Log summary
      if (this.options.debug) {
        console.log(
          `[FileManager] generateAll completed in ${durationMs.toFixed(2)}ms\n` +
          `  Files written: ${filesWritten}\n` +
          `  Errors: ${errors.length}`
        );
      }

      return summary;

    } catch (error) {
      // Emit error event
      this.emitEvent('generation:error', {
        error: error instanceof Error ? error.message : String(error),
      } as GenerationErrorEvent);

      // Return error summary
      const durationMs = performance.now() - startTime;
      return {
        type: 'full',
        totalComponents: components.length,
        filesWritten,
        filesFailed: errors.length + 1,
        errors: [
          ...errors,
          {
            success: false,
            filepath: '',
            error: error instanceof Error ? error.message : String(error),
          },
        ],
        durationMs,
      };
    }
  }

  /**
   * Generate only changed files (incremental update)
   * 
   * Compares manifest with cached state and only regenerates changed components.
   * Much faster for large projects.
   * 
   * @param manifest - Complete manifest
   * @returns Promise<GenerationSummary> with generation results
   * 
   * @example
   * ```typescript
   * const summary = await fileManager.generateIncremental(manifest);
   * if (summary.skipped) {
   *   console.log('No changes detected');
   * }
   * ```
   */
  async generateIncremental(manifest: Manifest): Promise<GenerationSummary> {
    const startTime = performance.now();

    // Step 1: Detect changes in components
    const changes = this.changeDetector.detectChanges(manifest.components);
    
    // Step 1b: Check if there's logic data that needs App.jsx regeneration
    // IMPORTANT: Logic (flows, pageState) changes require App.jsx regeneration
    // even if no components changed (e.g., user edited a flow node's message)
    // Task 4.6 fix: Always regenerate App.jsx when there's logic data
    const logicContext = this.buildLogicContext(manifest);
    const hasLogic = !!logicContext;

    // If no component changes AND no logic data, skip generation entirely
    if (!changes.hasChanges && !hasLogic) {
      if (this.options.debug) {
        console.log('[FileManager] generateIncremental: No changes detected and no logic, skipping');
      }
      return {
        ...SKIPPED_GENERATION_SUMMARY,
        totalComponents: Object.keys(manifest.components).length,
      };
    }

    // Emit start event
    this.emitEvent('generation:start', {
      type: 'incremental',
      totalComponents: changes.totalChanges,
      changes,
    } as GenerationStartEvent);

    const errors: FileWriteResult[] = [];
    let filesWritten = 0;

    try {
      // Step 2: Generate code for added and modified components
      const componentsToGenerate = [...changes.added, ...changes.modified];
      const componentFiles: FileToWrite[] = [];
      let current = 0;

      for (const componentId of componentsToGenerate) {
        current++;
        const component = manifest.components[componentId];

        if (!component) {
          errors.push({
            success: false,
            filepath: '',
            error: `Component ${componentId} not found in manifest`,
          });
          continue;
        }

        // Emit progress event
        this.emitEvent('generation:progress', {
          current,
          total: componentsToGenerate.length,
          componentId: component.id,
          componentName: component.displayName,
        } as GenerationProgressEvent);

        // Get file path
        const filepath = this.getComponentFilePath(component.displayName);

        // Check for user edit conflict
        if (this.isUserEdited(filepath)) {
          this.emitConflict(filepath, component.id);
          continue;
        }

        // Generate code
        const result = await this.codeGenerator.generateComponent(component, manifest);

        if (result.success) {
          componentFiles.push({
            filepath,
            content: result.code,
            componentId: component.id,
            type: 'component',
          });
        } else {
          errors.push({
            success: false,
            filepath,
            error: result.error || 'Code generation failed',
          });
        }
      }

      // Step 3: Write component files
      const writeResults = await this.fileWriter.writeFiles(componentFiles);
      
      for (const result of writeResults) {
        if (result.success) {
          filesWritten++;
        } else {
          errors.push(result);
        }
      }

      // Step 4: Delete removed component files
      // Note: We need to track old displayNames for this to work properly
      // For now, emit events for removed components
      for (const componentId of changes.removed) {
        this.emitEvent('component:removed', { componentId });
      }

      // Step 5: Regenerate App.jsx if root components changed OR if we have logic data
      // Logic data (pageState, flows) needs to be regenerated in App.jsx
      // Note: logicContext was already computed at the start of generateIncremental
      const needsAppRegeneration = changes.appNeedsUpdate || hasLogic;
      
      if (needsAppRegeneration) {
        const rootComponents = this.findRootComponents(manifest);
        const appCode = await this.appGenerator.generateAppJsx(rootComponents, logicContext);
        const appResult = await this.fileWriter.writeFile(this.paths.appJsx, appCode);
        
        if (appResult.success) {
          filesWritten++;
        } else {
          errors.push(appResult);
        }
      }

      // Step 5b: Generate main.jsx if not already generated
      // This ensures the template's main.jsx is replaced on first generation
      if (!this.mainJsxGenerated) {
        const mainCode = await this.appGenerator.generateMainJsx();
        const mainResult = await this.fileWriter.writeFile(this.paths.mainJsx, mainCode);
        
        if (mainResult.success) {
          filesWritten++;
          this.mainJsxGenerated = true;
        } else {
          errors.push(mainResult);
        }
      }

      // Step 6: Update change detector cache
      this.changeDetector.updateCache(manifest.components);

      // Calculate duration
      const durationMs = performance.now() - startTime;

      // Build summary
      const summary: GenerationSummary = {
        type: 'incremental',
        totalComponents: changes.totalChanges,
        filesWritten,
        filesFailed: errors.length,
        errors,
        durationMs,
        breakdown: {
          added: changes.added.length,
          modified: changes.modified.length,
          removed: changes.removed.length,
          appRegenerated: changes.appNeedsUpdate,
          mainRegenerated: false,
        },
      };

      // Emit complete event
      this.emitEvent('generation:complete', {
        summary,
      } as GenerationCompleteEvent);

      // Log summary
      if (this.options.debug) {
        console.log(
          `[FileManager] generateIncremental completed in ${durationMs.toFixed(2)}ms\n` +
          `  Added: ${changes.added.length}\n` +
          `  Modified: ${changes.modified.length}\n` +
          `  Removed: ${changes.removed.length}\n` +
          `  Files written: ${filesWritten}`
        );
      }

      return summary;

    } catch (error) {
      // Emit error event
      this.emitEvent('generation:error', {
        error: error instanceof Error ? error.message : String(error),
      } as GenerationErrorEvent);

      const durationMs = performance.now() - startTime;
      return {
        type: 'incremental',
        totalComponents: changes.totalChanges,
        filesWritten,
        filesFailed: errors.length + 1,
        errors: [
          ...errors,
          {
            success: false,
            filepath: '',
            error: error instanceof Error ? error.message : String(error),
          },
        ],
        durationMs,
      };
    }
  }

  // ===========================================================================
  // USER EDIT TRACKING
  // ===========================================================================

  /**
   * Mark a file as user-edited (won't be overwritten)
   * 
   * @param filepath - Absolute path to file
   * @param componentId - Optional component ID
   */
  markUserEdited(filepath: string, componentId?: string): void {
    const info: UserEditInfo = {
      filepath,
      componentId,
      detectedAt: new Date().toISOString(),
      contentHash: '', // Could compute hash here if needed
    };

    this.userEditedFiles.set(filepath, info);

    // Emit event
    this.emitEvent('user-edit:detected', { filepath, componentId });

    // Persist if enabled
    if (this.options.persistUserEdits) {
      this.persistUserEdits().catch((error) => {
        console.error('[FileManager] Failed to persist user edits:', error);
      });
    }

    if (this.options.debug) {
      console.log(`[FileManager] Marked user-edited: ${filepath}`);
    }
  }

  /**
   * Clear user edit flag for a file
   * 
   * @param filepath - Absolute path to file
   */
  clearUserEdited(filepath: string): void {
    this.userEditedFiles.delete(filepath);

    // Emit event
    this.emitEvent('user-edit:cleared', { filepath });

    // Persist if enabled
    if (this.options.persistUserEdits) {
      this.persistUserEdits().catch((error) => {
        console.error('[FileManager] Failed to persist user edits:', error);
      });
    }

    if (this.options.debug) {
      console.log(`[FileManager] Cleared user-edited: ${filepath}`);
    }
  }

  /**
   * Get list of user-edited files
   * 
   * @returns Array of absolute file paths
   */
  getUserEditedFiles(): string[] {
    return Array.from(this.userEditedFiles.keys());
  }

  /**
   * Check if a file is marked as user-edited
   * 
   * @param filepath - Absolute path to check
   * @returns true if file is user-edited
   */
  isUserEdited(filepath: string): boolean {
    return this.userEditedFiles.has(filepath);
  }

  /**
   * Load user edits from disk
   */
  async loadUserEdits(): Promise<void> {
    if (!this.options.persistUserEdits) return;

    try {
      const content = await fs.readFile(this.paths.userEditsFile, 'utf-8');
      const cache: UserEditsCache = JSON.parse(content);

      // Load edits
      this.userEditedFiles.clear();
      for (const [filepath, info] of Object.entries(cache.edits)) {
        this.userEditedFiles.set(filepath, info);
      }

      if (this.options.debug) {
        console.log(`[FileManager] Loaded ${this.userEditedFiles.size} user edits from disk`);
      }
    } catch (error) {
      // File doesn't exist or invalid - that's okay
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
        console.warn('[FileManager] Failed to load user edits:', error);
      }
    }
  }

  // ===========================================================================
  // UTILITIES
  // ===========================================================================

  /**
   * Get component file path from display name
   * 
   * @param displayName - Component display name
   * @returns Absolute file path
   */
  getComponentFilePath(displayName: string): string {
    return path.join(this.paths.componentsDir, `${displayName}.jsx`);
  }

  /**
   * Find root components (components with no parent)
   * Includes onClick handler references for components with event bindings
   * 
   * @param manifest - Manifest to search
   * @returns Array of root component info with handler references
   */
  private findRootComponents(manifest: Manifest): RootComponentInfo[] {
    // Collect all component IDs that are children of some component
    const childIds = new Set<string>();
    
    for (const component of Object.values(manifest.components)) {
      for (const childId of component.children) {
        childIds.add(childId);
      }
    }

    // Root components are those NOT in childIds
    const roots: RootComponentInfo[] = [];
    
    // Create a FlowCodeGenerator instance for consistent handler naming
    const flowCodeGen = new FlowCodeGenerator();
    
    for (const component of Object.values(manifest.components)) {
      if (!childIds.has(component.id)) {
        const info: RootComponentInfo = {
          id: component.id,
          displayName: component.displayName,
        };
        
        // Task 4.6 FIX: Look up onClick handler by searching flows for this component
        // The relationship is stored in flow.trigger.componentId, NOT in component.events
        // This is because flows are the source of truth - they define which component
        // triggers them via their trigger property
        if (manifest.flows) {
          // Find any flow that targets this component's onClick event
          const onClickFlow = Object.values(manifest.flows).find(
            flow => flow.trigger.componentId === component.id && flow.trigger.type === 'onClick'
          );
          
          if (onClickFlow) {
            // Use FlowCodeGenerator for consistent handler naming across codebase
            info.onClickHandler = flowCodeGen.generateHandlerName(onClickFlow);
          }
        }
        
        roots.push(info);
      }
    }

    // Sort alphabetically for consistent output
    return roots.sort((a, b) => a.displayName.localeCompare(b.displayName));
  }
  
  /**
   * Build LogicContext from manifest for App.jsx generation (Level 1.5)
   * Extracts pageState and flows from manifest for code generation
   * 
   * @param manifest - Manifest containing logic data
   * @returns LogicContext or undefined if no logic data
   */
  private buildLogicContext(manifest: Manifest): LogicContext | undefined {
    const hasPageState = manifest.pageState && Object.keys(manifest.pageState).length > 0;
    const hasFlows = manifest.flows && Object.keys(manifest.flows).length > 0;
    
    // If no logic data, return undefined (no useState needed)
    if (!hasPageState && !hasFlows) {
      return undefined;
    }
    
    return {
      pageState: manifest.pageState || {},
      flows: manifest.flows || {},
    };
  }

  /**
   * Persist user edits to disk
   */
  private async persistUserEdits(): Promise<void> {
    const cache: UserEditsCache = {
      schemaVersion: '1.0.0',
      edits: Object.fromEntries(this.userEditedFiles),
      updatedAt: new Date().toISOString(),
    };

    // Ensure directory exists
    const dir = path.dirname(this.paths.userEditsFile);
    await fs.mkdir(dir, { recursive: true });

    // Write file
    await fs.writeFile(
      this.paths.userEditsFile,
      JSON.stringify(cache, null, 2),
      'utf-8'
    );
  }

  /**
   * Emit event if events are enabled
   */
  private emitEvent(event: FileManagerEventType, data: unknown): void {
    if (this.options.emitEvents) {
      this.emit(event, data);
    }
  }

  /**
   * Emit user edit conflict event
   */
  private emitConflict(filepath: string, componentId?: string): void {
    const conflict: UserEditConflict = {
      filepath,
      componentId,
      message: `File "${filepath}" has been manually edited. Regenerating will overwrite your changes.`,
      detectedAt: new Date().toISOString(),
    };

    this.emitEvent('user-edit:conflict', {
      conflict,
    } as UserEditConflictEvent);

    if (this.options.debug) {
      console.log(`[FileManager] User edit conflict: ${filepath}`);
    }
  }

  /**
   * Get resolved paths for this project
   */
  getPaths(): typeof this.paths {
    return { ...this.paths };
  }

  /**
   * Get the ChangeDetector instance (for testing/debugging)
   */
  getChangeDetector(): ChangeDetector {
    return this.changeDetector;
  }

  /**
   * Get the FileWriter instance (for testing/debugging)
   */
  getFileWriter(): FileWriter {
    return this.fileWriter;
  }

  /**
   * Clear all caches (forces full regeneration)
   */
  clearCache(): void {
    this.changeDetector.clearCache();
    this.mainJsxGenerated = false;

    if (this.options.debug) {
      console.log('[FileManager] Cache cleared');
    }
  }
}

/**
 * Factory function to create FileManager instance
 */
export function createFileManager(options: FileManagerOptions): FileManager {
  return new FileManager(options);
}
