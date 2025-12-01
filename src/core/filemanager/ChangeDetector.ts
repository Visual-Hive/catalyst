/**
 * @file ChangeDetector.ts
 * @description Hash-based component change detection for incremental code generation
 *              Determines which components need regeneration by comparing hashes
 * 
 * @architecture Phase 3, Task 3.2 - File Management with Hash Watcher
 * @created 2025-11-27
 * @author AI (Cline) + Human Review
 * @confidence 9/10 - Straightforward hashing and comparison logic
 * 
 * @see src/core/filemanager/types.ts - Type definitions
 * @see src/core/manifest/types.ts - Component types
 * 
 * PROBLEM SOLVED:
 * - Full regeneration is slow for large projects (50+ components)
 * - Without change detection, we regenerate everything on each manifest save
 * - This wastes CPU and causes unnecessary file writes
 * 
 * SOLUTION:
 * - Hash each component definition (excluding volatile metadata like updatedAt)
 * - Cache hashes in memory and optionally on disk
 * - Compare current hashes with cached hashes to find changes
 * - Return only the components that actually changed
 * 
 * CHANGE DETECTION ALGORITHM:
 * 1. Get all component IDs from current manifest
 * 2. Get all component IDs from cached hashes
 * 3. Added = current IDs not in cache
 * 4. Removed = cached IDs not in current
 * 5. Modified = IDs in both where hash differs
 * 6. App update needed = any root component added/removed/modified
 * 
 * @security-critical false
 * @performance-critical true - Called on every manifest change
 */

import * as crypto from 'crypto';
import type { Component } from '../manifest/types';
import type {
  IChangeDetector,
  ChangeDetectionResult,
  ComponentHashEntry,
  ComponentHashCache,
  EMPTY_CHANGE_RESULT,
} from './types';

/**
 * Configuration options for ChangeDetector
 */
export interface ChangeDetectorOptions {
  /** Enable debug logging (default: false) */
  debug?: boolean;
}

/**
 * ChangeDetector compares manifest state to find changed components
 * 
 * USAGE:
 * ```typescript
 * const detector = new ChangeDetector();
 * 
 * // First call: all components are "added" (no cache yet)
 * const changes = detector.detectChanges(manifest.components);
 * console.log(changes.added); // All component IDs
 * 
 * // Update cache after successful generation
 * detector.updateCache(manifest.components);
 * 
 * // Second call: only actual changes returned
 * const nextChanges = detector.detectChanges(updatedManifest.components);
 * console.log(nextChanges.modified); // Only modified component IDs
 * ```
 * 
 * ROOT COMPONENT DETECTION:
 * A root component is one that has no parent (not in any component's children array).
 * When root components change, App.jsx needs to be regenerated.
 * 
 * HASH COMPUTATION:
 * - Uses SHA-256 for collision resistance
 * - Excludes `metadata.updatedAt` from hash (changes on every save)
 * - Includes all other properties (displayName, type, properties, styling, children)
 * - Result is deterministic: same component definition = same hash
 */
export class ChangeDetector implements IChangeDetector {
  /**
   * In-memory cache of component hashes
   * Maps component ID to hash entry
   */
  private componentHashes: Map<string, ComponentHashEntry>;

  /**
   * Cached set of root component IDs (for change detection)
   * Root components are those not listed in any component's children array
   */
  private rootComponentIds: Set<string>;

  /**
   * Configuration options
   */
  private options: Required<ChangeDetectorOptions>;

  /**
   * Create a new ChangeDetector instance
   * 
   * @param options - Configuration options
   */
  constructor(options: ChangeDetectorOptions = {}) {
    // Initialize data structures
    this.componentHashes = new Map();
    this.rootComponentIds = new Set();

    // Apply default options
    this.options = {
      debug: options.debug ?? false,
    };

    if (this.options.debug) {
      console.log('[ChangeDetector] Initialized');
    }
  }

  /**
   * Detect changes between current manifest components and cached state
   * 
   * @param manifestComponents - Current manifest components (Record<string, Component>)
   * @returns ChangeDetectionResult with added, modified, removed, and appNeedsUpdate
   * 
   * @example
   * ```typescript
   * const changes = detector.detectChanges(manifest.components);
   * if (changes.hasChanges) {
   *   console.log(`Added: ${changes.added.length}`);
   *   console.log(`Modified: ${changes.modified.length}`);
   *   console.log(`Removed: ${changes.removed.length}`);
   *   console.log(`App update needed: ${changes.appNeedsUpdate}`);
   * }
   * ```
   */
  detectChanges(manifestComponents: Record<string, Component>): ChangeDetectionResult {
    const startTime = performance.now();

    // Get current and cached component ID sets
    const currentIds = new Set(Object.keys(manifestComponents));
    const cachedIds = new Set(this.componentHashes.keys());

    // Initialize result
    const result: ChangeDetectionResult = {
      added: [],
      modified: [],
      removed: [],
      appNeedsUpdate: false,
      totalChanges: 0,
      hasChanges: false,
    };

    // Find current root components for comparison
    const currentRootIds = this.findRootComponentIds(manifestComponents);

    // -------------------------------------------------------------------------
    // STEP 1: Find ADDED components (in current but not in cache)
    // -------------------------------------------------------------------------
    for (const id of currentIds) {
      if (!cachedIds.has(id)) {
        result.added.push(id);
        
        // Check if added component is a root component (affects App.jsx)
        if (currentRootIds.has(id)) {
          result.appNeedsUpdate = true;
        }
      }
    }

    // -------------------------------------------------------------------------
    // STEP 2: Find REMOVED components (in cache but not in current)
    // -------------------------------------------------------------------------
    for (const id of cachedIds) {
      if (!currentIds.has(id)) {
        result.removed.push(id);
        
        // Check if removed component was a root component (affects App.jsx)
        if (this.rootComponentIds.has(id)) {
          result.appNeedsUpdate = true;
        }
      }
    }

    // -------------------------------------------------------------------------
    // STEP 3: Find MODIFIED components (in both, but hash differs)
    // -------------------------------------------------------------------------
    for (const id of currentIds) {
      // Skip if not in cache (already counted as added)
      if (!cachedIds.has(id)) continue;

      // Compute current hash
      const component = manifestComponents[id];
      const currentHash = this.computeComponentHash(component);

      // Get cached hash
      const cachedEntry = this.componentHashes.get(id);
      if (!cachedEntry) continue; // Shouldn't happen, but be safe

      // Compare hashes
      if (currentHash !== cachedEntry.hash) {
        result.modified.push(id);

        // Check if modified component is/was a root component
        const wasRoot = cachedEntry.isRoot;
        const isRoot = currentRootIds.has(id);

        // If root status changed OR root component was modified, update App.jsx
        if (wasRoot || isRoot) {
          result.appNeedsUpdate = true;
        }
      }
    }

    // -------------------------------------------------------------------------
    // STEP 4: Check for root component changes (parent/child relationship changes)
    // -------------------------------------------------------------------------
    // Even if no individual components were added/removed/modified,
    // the root set might have changed (component moved to/from root level)
    if (!result.appNeedsUpdate) {
      const cachedRootIds = this.rootComponentIds;
      
      // Check if root set changed
      if (currentRootIds.size !== cachedRootIds.size) {
        result.appNeedsUpdate = true;
      } else {
        // Same size, check if same members
        for (const id of currentRootIds) {
          if (!cachedRootIds.has(id)) {
            result.appNeedsUpdate = true;
            break;
          }
        }
      }
    }

    // -------------------------------------------------------------------------
    // STEP 5: Compute totals
    // -------------------------------------------------------------------------
    result.totalChanges = result.added.length + result.modified.length + result.removed.length;
    result.hasChanges = result.totalChanges > 0 || result.appNeedsUpdate;

    // Log results if debug enabled
    if (this.options.debug) {
      const duration = performance.now() - startTime;
      console.log(
        `[ChangeDetector] detectChanges completed in ${duration.toFixed(2)}ms\n` +
        `  Added: ${result.added.length}\n` +
        `  Modified: ${result.modified.length}\n` +
        `  Removed: ${result.removed.length}\n` +
        `  App update needed: ${result.appNeedsUpdate}\n` +
        `  Total changes: ${result.totalChanges}`
      );
    }

    return result;
  }

  /**
   * Update the cache with current manifest component hashes
   * 
   * Call this AFTER successful code generation to ensure cache
   * reflects what was actually written to disk.
   * 
   * @param manifestComponents - Current manifest components
   */
  updateCache(manifestComponents: Record<string, Component>): void {
    const startTime = performance.now();

    // Clear existing cache
    this.componentHashes.clear();
    this.rootComponentIds.clear();

    // Find root components
    const rootIds = this.findRootComponentIds(manifestComponents);
    this.rootComponentIds = rootIds;

    // Compute and store hash for each component
    for (const [id, component] of Object.entries(manifestComponents)) {
      const hash = this.computeComponentHash(component);
      const isRoot = rootIds.has(id);

      const entry: ComponentHashEntry = {
        id,
        displayName: component.displayName,
        hash,
        isRoot,
        computedAt: new Date().toISOString(),
      };

      this.componentHashes.set(id, entry);
    }

    // Log if debug enabled
    if (this.options.debug) {
      const duration = performance.now() - startTime;
      console.log(
        `[ChangeDetector] updateCache completed in ${duration.toFixed(2)}ms\n` +
        `  Components cached: ${this.componentHashes.size}\n` +
        `  Root components: ${this.rootComponentIds.size}`
      );
    }
  }

  /**
   * Clear the cache (forces full regeneration on next detectChanges)
   */
  clearCache(): void {
    this.componentHashes.clear();
    this.rootComponentIds.clear();

    if (this.options.debug) {
      console.log('[ChangeDetector] Cache cleared');
    }
  }

  /**
   * Check if a component is a root component (no parent)
   * 
   * @param componentId - Component ID to check
   * @param manifestComponents - Manifest components to search
   * @returns true if component has no parent
   */
  isRootComponent(componentId: string, manifestComponents: Record<string, Component>): boolean {
    // Check if any component has this ID in its children array
    for (const component of Object.values(manifestComponents)) {
      if (component.children.includes(componentId)) {
        return false; // Has a parent
      }
    }
    return true; // No parent found = root component
  }

  /**
   * Get the current hash cache (for persistence)
   * 
   * @returns ComponentHashCache structure suitable for JSON serialization
   */
  getCache(): ComponentHashCache {
    const hashes: Record<string, ComponentHashEntry> = {};

    for (const [id, entry] of this.componentHashes) {
      hashes[id] = entry;
    }

    return {
      schemaVersion: '1.0.0',
      hashes,
      updatedAt: new Date().toISOString(),
    };
  }

  /**
   * Load a previously saved hash cache
   * 
   * @param cache - Cache to load
   */
  loadCache(cache: ComponentHashCache): void {
    // Clear existing
    this.componentHashes.clear();
    this.rootComponentIds.clear();

    // Load from cache
    for (const [id, entry] of Object.entries(cache.hashes)) {
      this.componentHashes.set(id, entry);
      if (entry.isRoot) {
        this.rootComponentIds.add(id);
      }
    }

    if (this.options.debug) {
      console.log(
        `[ChangeDetector] Loaded cache from ${cache.updatedAt}\n` +
        `  Components: ${this.componentHashes.size}\n` +
        `  Root components: ${this.rootComponentIds.size}`
      );
    }
  }

  /**
   * Get list of root component IDs from cache
   * 
   * @returns Array of root component IDs
   */
  getRootComponentIds(): string[] {
    return Array.from(this.rootComponentIds);
  }

  /**
   * Get a specific component's hash entry
   * 
   * @param componentId - Component ID
   * @returns Hash entry or undefined if not cached
   */
  getComponentHash(componentId: string): ComponentHashEntry | undefined {
    return this.componentHashes.get(componentId);
  }

  /**
   * Get number of cached components
   */
  get size(): number {
    return this.componentHashes.size;
  }

  // ===========================================================================
  // PRIVATE METHODS
  // ===========================================================================

  /**
   * Compute SHA-256 hash of component definition
   * 
   * EXCLUDES from hash:
   * - metadata.updatedAt (changes on every save, not meaningful)
   * 
   * INCLUDES in hash:
   * - id, displayName, type, category
   * - properties (all)
   * - styling (all)
   * - children (array of IDs)
   * - metadata.createdAt, metadata.author, metadata.version
   * 
   * @param component - Component to hash
   * @returns SHA-256 hex digest
   */
  private computeComponentHash(component: Component): string {
    // Create a hashable representation excluding volatile fields
    const hashable = {
      id: component.id,
      displayName: component.displayName,
      type: component.type,
      category: component.category,
      properties: component.properties,
      styling: component.styling,
      children: component.children,
      events: component.events,
      // Include stable metadata, exclude updatedAt
      metadata: {
        createdAt: component.metadata.createdAt,
        author: component.metadata.author,
        version: component.metadata.version,
        description: component.metadata.description,
        tags: component.metadata.tags,
      },
    };

    // Convert to stable JSON string (sorted keys for consistency)
    const jsonString = this.stableStringify(hashable);

    // Compute SHA-256 hash
    return crypto
      .createHash('sha256')
      .update(jsonString, 'utf-8')
      .digest('hex');
  }

  /**
   * Convert object to JSON with sorted keys for stable hashing
   * 
   * JavaScript objects don't guarantee key order, but JSON.stringify
   * with a replacer function can produce consistent output.
   * 
   * @param obj - Object to stringify
   * @returns Stable JSON string
   */
  private stableStringify(obj: unknown): string {
    // Custom replacer that sorts object keys
    const sortedReplacer = (_key: string, value: unknown): unknown => {
      // If value is an object (not array, not null), sort its keys
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        const sorted: Record<string, unknown> = {};
        const keys = Object.keys(value as Record<string, unknown>).sort();
        for (const k of keys) {
          sorted[k] = (value as Record<string, unknown>)[k];
        }
        return sorted;
      }
      return value;
    };

    return JSON.stringify(obj, sortedReplacer);
  }

  /**
   * Find all root component IDs (components with no parent)
   * 
   * @param manifestComponents - All components to search
   * @returns Set of root component IDs
   */
  private findRootComponentIds(manifestComponents: Record<string, Component>): Set<string> {
    // Collect all IDs that are children of some component
    const childIds = new Set<string>();
    
    for (const component of Object.values(manifestComponents)) {
      for (const childId of component.children) {
        childIds.add(childId);
      }
    }

    // Root components are those NOT in the childIds set
    const rootIds = new Set<string>();
    
    for (const id of Object.keys(manifestComponents)) {
      if (!childIds.has(id)) {
        rootIds.add(id);
      }
    }

    return rootIds;
  }
}

/**
 * Factory function to create ChangeDetector instance
 */
export function createChangeDetector(options?: ChangeDetectorOptions): ChangeDetector {
  return new ChangeDetector(options);
}
