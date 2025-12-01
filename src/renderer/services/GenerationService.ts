/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * @file GenerationService.ts
 * @description Coordinates code generation with manifest changes and preview updates
 * 
 * This service listens to manifest store changes and triggers code generation,
 * then refreshes the preview when files are updated. It implements debouncing
 * to avoid excessive generation during rapid edits.
 * 
 * DATA FLOW:
 * 
 *   Manifest Change (manifestStore)
 *         |
 *         v
 *   Debounce (500ms)
 *         |
 *         v
 *   Generate Files (IPC → FileManager)
 *         |
 *         v
 *   Refresh Preview (via Vite HMR)
 * 
 * EDGE CASES HANDLED:
 * - Rapid successive changes (debouncing)
 * - Generation in progress (skips new requests during generation)
 * - Project not loaded (no-op)
 * - Generation errors (updates store with error state)
 * 
 * @architecture Phase 3, Task 3.3 - Live Preview Integration
 * @created 2025-11-27
 * @author AI (Cline) + Human Review
 * @confidence 8/10 - Integrates existing components
 * 
 * @see src/renderer/store/generationStore.ts - Generation state
 * @see src/renderer/store/manifestStore.ts - Manifest state
 * @see src/renderer/store/previewStore.ts - Preview state
 * 
 * @security-critical false
 * @performance-critical true - Affects user perceived latency
 */

import { useManifestStore } from '../store/manifestStore';
import { useGenerationStore } from '../store/generationStore';
import { useProjectStore } from '../store/projectStore';
import type { Manifest } from '../../core/manifest/types';
import type { ElectronAPI } from '../types/electron';

// Access to Electron API via contextBridge
// The global Window interface is augmented in electron.d.ts
declare const window: Window & { electronAPI: ElectronAPI };

/**
 * Service configuration options
 */
interface GenerationServiceOptions {
  /** Delay before triggering generation after manifest change (ms) */
  debounceMs: number;
  
  /** Whether to auto-generate on manifest changes */
  autoGenerate: boolean;
  
  /** Whether to skip generation if one is already in progress */
  skipIfInProgress: boolean;
}

/**
 * Default service configuration
 */
const DEFAULT_OPTIONS: GenerationServiceOptions = {
  debounceMs: 500,
  autoGenerate: true,
  skipIfInProgress: true,
};

/**
 * Subscription cleanup function type
 */
type UnsubscribeFn = () => void;

/**
 * GenerationService Class
 * 
 * Singleton service that coordinates manifest changes → code generation → preview refresh.
 * Must be initialized after stores are available and cleaned up on app unmount.
 * 
 * USAGE EXAMPLE:
 * ```typescript
 * // In App.tsx useEffect:
 * useEffect(() => {
 *   GenerationService.getInstance().initialize();
 *   return () => GenerationService.getInstance().cleanup();
 * }, []);
 * ```
 */
class GenerationServiceImpl {
  // Singleton instance
  private static instance: GenerationServiceImpl | null = null;
  
  // Service state
  private options: GenerationServiceOptions = DEFAULT_OPTIONS;
  private subscriptions: UnsubscribeFn[] = [];
  private debounceTimer: NodeJS.Timeout | null = null;
  private initialized = false;
  private lastManifestHash: string = '';
  
  /**
   * Get the singleton instance
   */
  static getInstance(): GenerationServiceImpl {
    if (!GenerationServiceImpl.instance) {
      GenerationServiceImpl.instance = new GenerationServiceImpl();
    }
    return GenerationServiceImpl.instance;
  }
  
  /**
   * Private constructor for singleton pattern
   */
  private constructor() {
    // Private - use getInstance()
  }
  
  /**
   * Initialize the service
   * 
   * Sets up subscriptions to manifest store changes.
   * Should be called once when the app starts.
   * 
   * @param options - Optional configuration overrides
   */
  initialize(options?: Partial<GenerationServiceOptions>): void {
    // Prevent double initialization
    if (this.initialized) {
      console.warn('[GenerationService] Already initialized');
      return;
    }
    
    // Merge options
    this.options = { ...DEFAULT_OPTIONS, ...options };
    
    // Subscribe to manifest changes
    if (this.options.autoGenerate) {
      this.subscribeToManifestChanges();
    }
    
    this.initialized = true;
    console.log('[GenerationService] Initialized', this.options);
    
    // CRITICAL: Check if manifest is already loaded and trigger initial generation
    // This handles the case where manifest loads BEFORE this service initializes
    const manifestStore = useManifestStore.getState();
    if (manifestStore.manifest) {
      console.log('[GenerationService] Manifest already loaded, triggering initial generation');
      // Reset the hash to force generation
      this.lastManifestHash = '';
      this.handleManifestChange(manifestStore.manifest);
    }
  }
  
  /**
   * Clean up the service
   * 
   * Removes all subscriptions and timers.
   * Should be called when the app is unmounting.
   */
  cleanup(): void {
    // Clear debounce timer
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }
    
    // Unsubscribe from stores
    this.subscriptions.forEach(unsub => unsub());
    this.subscriptions = [];
    
    // Clean up generation handlers
    this.cleanupGeneration();
    
    this.initialized = false;
    console.log('[GenerationService] Cleaned up');
  }
  
  /**
   * Subscribe to manifest store changes
   * 
   * Uses Zustand's subscribe API to watch for manifest changes.
   * Triggers debounced generation when manifest updates.
   */
  private subscribeToManifestChanges(): void {
    // Subscribe to manifest changes using Zustand's subscribe
    // We watch the entire manifest object - any change should trigger generation
    const unsubscribe = useManifestStore.subscribe(
      (state) => {
        // Only trigger if we have a manifest
        if (state.manifest) {
          this.handleManifestChange(state.manifest);
        }
      }
    );
    
    this.subscriptions.push(unsubscribe);
  }
  
  /**
   * Handle manifest change event
   * 
   * Debounces rapid changes and triggers generation.
   * 
   * @param manifest - The updated manifest
   */
  private handleManifestChange(manifest: Manifest): void {
    // Compute a simple hash to detect actual changes
    // (Zustand may fire for non-content changes)
    const hash = this.computeManifestHash(manifest);
    
    // Skip if manifest hasn't actually changed
    if (hash === this.lastManifestHash) {
      return;
    }
    
    this.lastManifestHash = hash;
    
    // Clear existing debounce timer
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }
    
    // Set new debounce timer
    this.debounceTimer = setTimeout(() => {
      this.triggerGeneration();
    }, this.options.debounceMs);
  }
  
  /**
   * Compute a simple hash of manifest for change detection
   * 
   * @param manifest - The manifest to hash
   * @returns A string hash
   */
  private computeManifestHash(manifest: Manifest): string {
    // Simple hash: JSON stringify and count characters
    // This is good enough for detecting content changes
    const json = JSON.stringify(manifest);
    const componentCount = Object.keys(manifest.components).length;
    return `${json.length}-${componentCount}-${manifest.schemaVersion}`;
  }
  
  /**
   * Trigger code generation
   * 
   * Gets current manifest and project path, calls IPC to generate files.
   * Updates generation store with status.
   */
  private async triggerGeneration(): Promise<void> {
    const generationStore = useGenerationStore.getState();
    const manifestStore = useManifestStore.getState();
    const projectStore = useProjectStore.getState();
    
    // Check if generation is already in progress
    const isGenerating = generationStore.status === 'pending' || generationStore.status === 'generating';
    if (isGenerating && this.options.skipIfInProgress) {
      console.log('[GenerationService] Skipping - generation already in progress');
      return;
    }
    
    // Check if we have required data
    if (!manifestStore.manifest || !projectStore.currentProject) {
      console.log('[GenerationService] Skipping - no manifest or project');
      return;
    }
    
    const projectPath = projectStore.currentProject.path;
    const manifest = manifestStore.manifest;
    
    // Start generation
    console.log('[GenerationService] Starting code generation...');
    generationStore.setStatus('generating');
    
    try {
      // Call IPC to generate files
      // NOTE: Using incremental: false to force full regeneration
      // This ensures new fixes (like handler wiring) are applied immediately
      // TODO: After Task 4.6 fix is deployed, can change back to true for performance
      const result = await window.electronAPI.generation.generate({
        projectPath,
        manifest,
        incremental: true,
      });
      
      if (result.success && result.data) {
        // Update store with success
        generationStore.setLastGeneration({
          timestamp: Date.now(),
          filesWritten: result.data.filesWritten,
          durationMs: result.data.durationMs,
          breakdown: result.data.breakdown,
        });
        
        // Log summary
        console.log('[GenerationService] Generation complete:', {
          filesWritten: result.data.filesWritten,
          durationMs: result.data.durationMs,
          breakdown: result.data.breakdown,
        });
        
        // Preview will auto-refresh via Vite HMR
        // No explicit action needed
      } else {
        // Update store with error
        generationStore.setError(result.error || 'Unknown error');
        console.error('[GenerationService] Generation failed:', result.error);
      }
    } catch (error) {
      // Handle unexpected errors
      const message = error instanceof Error ? error.message : String(error);
      generationStore.setError(message);
      console.error('[GenerationService] Generation exception:', error);
    }
  }
  
  /**
   * Force a full regeneration
   * 
   * Called when user explicitly requests regeneration (e.g., from menu).
   * Does NOT skip if generation is in progress - queues instead.
   */
  async forceRegenerate(): Promise<void> {
    const generationStore = useGenerationStore.getState();
    const manifestStore = useManifestStore.getState();
    const projectStore = useProjectStore.getState();
    
    // Check if we have required data
    if (!manifestStore.manifest || !projectStore.currentProject) {
      console.warn('[GenerationService] Cannot regenerate - no manifest or project');
      return;
    }
    
    const projectPath = projectStore.currentProject.path;
    const manifest = manifestStore.manifest;
    
    // Start generation
    console.log('[GenerationService] Starting FULL regeneration...');
    generationStore.setStatus('generating');
    
    try {
      // Call IPC to force full regeneration
      const result = await window.electronAPI.generation.regenerateAll({
        projectPath,
        manifest,
        incremental: false,
      });
      
      if (result.success && result.data) {
        generationStore.setLastGeneration({
          timestamp: Date.now(),
          filesWritten: result.data.filesWritten,
          durationMs: result.data.durationMs,
          breakdown: result.data.breakdown,
        });
        console.log('[GenerationService] Full regeneration complete:', result.data);
      } else {
        generationStore.setError(result.error || 'Unknown error');
        console.error('[GenerationService] Full regeneration failed:', result.error);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      generationStore.setError(message);
      console.error('[GenerationService] Regeneration exception:', error);
    }
  }
  
  /**
   * Clean up the generation handlers in main process
   * 
   * Called when service is cleaned up.
   */
  private async cleanupGeneration(): Promise<void> {
    try {
      await window.electronAPI.generation.cleanup();
      console.log('[GenerationService] Generation handlers cleaned up');
    } catch (error) {
      console.error('[GenerationService] Cleanup error:', error);
    }
  }
  
  /**
   * Check if service is initialized
   */
  isInitialized(): boolean {
    return this.initialized;
  }
  
  /**
   * Get current options
   */
  getOptions(): GenerationServiceOptions {
    return { ...this.options };
  }
  
  /**
   * Update service options
   * 
   * Allows runtime reconfiguration (e.g., changing debounce time).
   * 
   * @param options - Options to update
   */
  updateOptions(options: Partial<GenerationServiceOptions>): void {
    this.options = { ...this.options, ...options };
    console.log('[GenerationService] Options updated:', this.options);
  }
}

/**
 * Export singleton instance getter
 */
export const GenerationService = {
  getInstance: () => GenerationServiceImpl.getInstance(),
};

/**
 * React hook for accessing generation service
 * 
 * Provides convenient access to the service from React components.
 * 
 * USAGE:
 * ```typescript
 * const { forceRegenerate, isInitialized } = useGenerationService();
 * ```
 */
export function useGenerationService() {
  const service = GenerationServiceImpl.getInstance();
  
  return {
    /** Force a full regeneration manually */
    forceRegenerate: () => service.forceRegenerate(),
    
    /** Check if service is initialized */
    isInitialized: () => service.isInitialized(),
    
    /** Get current options */
    getOptions: () => service.getOptions(),
    
    /** Update service options */
    updateOptions: (opts: Partial<GenerationServiceOptions>) => service.updateOptions(opts),
  };
}

export type { GenerationServiceOptions };
