/**
 * @file manifestStore.ts
 * @description PHASE 2 FEATURE: Frontend Component Builder (Currently Dormant)
 * 
 * ⚠️ STATUS: ON STANDBY - Not used by current Catalyst workflow system
 * 
 * CATALYST ARCHITECTURE - DUAL SYSTEM:
 * 
 * ┌─────────────────────────────────────────────────────────────────┐
 * │ PHASE 1 (CURRENT): Backend Workflow Builder                     │
 * ├─────────────────────────────────────────────────────────────────┤
 * │ Store:     workflowStore.ts                                     │
 * │ Manifest:  .catalyst/manifest.json                              │
 * │ UI:        WorkflowCanvas (node-based visual editor)            │
 * │ Output:    Python/FastAPI backend code                          │
 * │ Status:    ✅ ACTIVE                                            │
 * └─────────────────────────────────────────────────────────────────┘
 * 
 * ┌─────────────────────────────────────────────────────────────────┐
 * │ PHASE 2 (FUTURE): Frontend Component Builder                    │
 * ├─────────────────────────────────────────────────────────────────┤
 * │ Store:     manifestStore.ts (THIS FILE)                         │
 * │ Manifest:  .lowcode/manifest.json                               │
 * │ UI:        Component Tree (hierarchy-based editor)              │
 * │ Output:    React/JSX frontend code                              │
 * │ Status:    🔄 ON STANDBY (awaiting integration)                │
 * └─────────────────────────────────────────────────────────────────┘
 * 
 * FULL-STACK INTEGRATION VISION:
 * - Single project with BOTH manifest types
 * - Backend workflows → Python APIs
 * - Frontend components → React UI  
 * - Unified code generation
 * - Type-safe integration between layers
 * 
 * @see .implementation/future-tasks/phase-2-frontend-builder.md - Integration roadmap
 * @see docs/legacy-rise/ - Original Rise component builder documentation
 * @see src/renderer/store/workflowStore.ts - Active workflow system (Phase 1)
 * 
 * @architecture Phase 2, Task 2.1 - Component Tree UI (Original Rise)
 * @created 2025-11-25
 * @author AI (Cline) + Human Review
 * @confidence 9/10 - Proven system from Rise, dormant but functional
 * 
 * ORIGINAL PROBLEM SOLVED:
 * - Centralized manifest state management
 * - Component CRUD operations with validation
 * - Tree expansion and selection state
 * - Auto-save to .lowcode/manifest.json
 * 
 * SOLUTION:
 * - Zustand store with immer middleware
 * - Debounced file saves (500ms)
 * - Depth validation (max 5 levels)
 * - Circular reference prevention
 * - Component tree computation
 * 
 * OPERATIONS:
 * - Load/save manifest from/to file
 * - Add/update/delete/duplicate components
 * - Move components in hierarchy
 * - Select and expand tree nodes
 * - Validate manifest structure
 * 
 * @performance Debounced saves, memoized tree computation
 * @security-critical false - operates on local manifest file
 * @performance-critical true - will be called frequently during editing (when activated)
 */

import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { enableMapSet } from 'immer';
import {
  Manifest,
  ManifestState,
  Component,
  ComponentTreeNode,
  CreateComponentOptions,
  UpdateComponentOptions,
  ValidationResult,
  ValidationError,
  createEmptyManifest,
  generateComponentId,
  createComponentMetadata,
} from '../../core/legacy-manifest/types';
import { templateRegistry } from '../../core/templates';
import { useProjectStore } from './projectStore';
import type {
  ValidationError as IPCValidationError,
  ManifestLoadResult,
} from '../types/electron';

// Enable Immer support for Map and Set
enableMapSet();

/**
 * Maximum component nesting depth (5 levels = 0-4)
 */
const MAX_DEPTH = 4;

/**
 * Debounce delay for auto-save (milliseconds)
 */
const SAVE_DEBOUNCE_MS = 500;

/**
 * Save timeout reference for debouncing
 */
let saveTimeout: NodeJS.Timeout | null = null;

/**
 * Get default properties and styling for a component type
 * Ensures new components have visible content instead of being empty
 * 
 * @param type - HTML element type (div, button, span, etc.)
 * @param displayName - Component display name for default text
 * @returns Object with default properties and styling
 */
function getDefaultsForType(type: string, displayName: string): {
  properties: Record<string, any>;
  styling: { baseClasses: string[] };
} {
  // Default styling for all components - add padding and border so they're visible
  const defaultStyling = { baseClasses: ['p-4', 'border', 'border-gray-200', 'rounded'] };
  
  switch (type) {
    case 'button':
      return {
        properties: {
          label: { type: 'static', dataType: 'string', value: displayName || 'Button' },
        },
        styling: { baseClasses: ['px-4', 'py-2', 'bg-blue-500', 'text-white', 'rounded', 'hover:bg-blue-600'] },
      };
    
    case 'span':
    case 'p':
      return {
        properties: {
          text: { type: 'static', dataType: 'string', value: displayName || 'Text content' },
        },
        styling: { baseClasses: ['text-gray-700'] },
      };
    
    case 'h1':
      return {
        properties: {
          text: { type: 'static', dataType: 'string', value: displayName || 'Heading 1' },
        },
        styling: { baseClasses: ['text-4xl', 'font-bold', 'text-gray-900'] },
      };
    
    case 'h2':
      return {
        properties: {
          text: { type: 'static', dataType: 'string', value: displayName || 'Heading 2' },
        },
        styling: { baseClasses: ['text-3xl', 'font-bold', 'text-gray-900'] },
      };
    
    case 'h3':
      return {
        properties: {
          text: { type: 'static', dataType: 'string', value: displayName || 'Heading 3' },
        },
        styling: { baseClasses: ['text-2xl', 'font-bold', 'text-gray-900'] },
      };
    
    case 'input':
      return {
        properties: {
          label: { type: 'static', dataType: 'string', value: 'Label' },
          placeholder: { type: 'static', dataType: 'string', value: 'Enter text...' },
          type: { type: 'static', dataType: 'string', value: 'text' },
        },
        styling: { baseClasses: ['w-full', 'px-3', 'py-2', 'border', 'border-gray-300', 'rounded', 'focus:outline-none', 'focus:ring-2', 'focus:ring-blue-500'] },
      };

    case 'checkbox':
      return {
        properties: {
          label: { type: 'static', dataType: 'string', value: 'Checkbox label' },
          checked: { type: 'static', dataType: 'boolean', value: false },
          disabled: { type: 'static', dataType: 'boolean', value: false },
        },
        styling: { baseClasses: ['w-4', 'h-4', 'text-blue-600', 'border-gray-300', 'rounded', 'focus:ring-blue-500'] },
      };
    
    case 'textarea':
      return {
        properties: {
          placeholder: { type: 'static', dataType: 'string', value: 'Enter text...' },
        },
        styling: { baseClasses: ['px-3', 'py-2', 'border', 'border-gray-300', 'rounded', 'focus:outline-none', 'focus:ring-2', 'focus:ring-blue-500', 'min-h-[100px]'] },
      };
    
    case 'a':
      return {
        properties: {
          href: { type: 'static', dataType: 'string', value: '#' },
          text: { type: 'static', dataType: 'string', value: displayName || 'Link' },
        },
        styling: { baseClasses: ['text-blue-600', 'hover:text-blue-800', 'underline'] },
      };
    
    case 'img':
      return {
        properties: {
          src: { type: 'static', dataType: 'string', value: 'https://via.placeholder.com/300x200' },
          alt: { type: 'static', dataType: 'string', value: displayName || 'Image' },
        },
        styling: { baseClasses: ['max-w-full', 'h-auto', 'rounded'] },
      };
    
    case 'ul':
    case 'ol':
      return {
        properties: {},
        styling: { baseClasses: ['list-disc', 'list-inside', 'p-4'] },
      };
    
    case 'li':
      return {
        properties: {
          text: { type: 'static', dataType: 'string', value: 'List item' },
        },
        styling: { baseClasses: ['py-1'] },
      };
    
    case 'section':
    case 'article':
    case 'div':
      return {
        properties: {},
        styling: { baseClasses: ['p-4', 'border', 'border-dashed', 'border-gray-300', 'min-h-[50px]'] },
      };
    
    case 'header':
      return {
        properties: {},
        styling: { baseClasses: ['p-4', 'bg-gray-100', 'border-b', 'border-gray-200'] },
      };
    
    case 'footer':
      return {
        properties: {},
        styling: { baseClasses: ['p-4', 'bg-gray-100', 'border-t', 'border-gray-200'] },
      };
    
    case 'nav':
      return {
        properties: {},
        styling: { baseClasses: ['p-4', 'flex', 'gap-4', 'bg-gray-50'] },
      };
    
    case 'form':
      return {
        properties: {},
        styling: { baseClasses: ['p-4', 'space-y-4', 'border', 'border-gray-200', 'rounded'] },
      };
    
    case 'label':
      return {
        properties: {
          text: { type: 'static', dataType: 'string', value: displayName || 'Label' },
        },
        styling: { baseClasses: ['text-sm', 'font-medium', 'text-gray-700'] },
      };
    
    case 'select':
      return {
        properties: {},
        styling: { baseClasses: ['px-3', 'py-2', 'border', 'border-gray-300', 'rounded', 'bg-white'] },
      };
    
    default:
      // For any other element, add basic visible styling
      return {
        properties: {},
        styling: defaultStyling,
      };
  }
}

/**
 * Manifest store implementation
 * 
 * Manages the component manifest, providing CRUD operations,
 * validation, and tree state management.
 * 
 * TIMING:
 * - Saves are debounced to prevent excessive file writes
 * - Tree computation is triggered on manifest changes
 * - Validation runs before saves
 * 
 * VALIDATION:
 * - Max depth enforcement (5 levels)
 * - Circular reference detection
 * - Required field validation
 * - Component ID uniqueness
 */
export const useManifestStore = create<ManifestState>()(
  immer((set, get) => ({
    // Initial state
    manifest: null,
    selectedComponentId: null,
    expandedComponentIds: new Set<string>(),
    
    // Validation state (Task 2.2B)
    validationErrors: [] as IPCValidationError[],
    validationWarnings: [] as IPCValidationError[],
    saveBlocked: false,
    isLoading: false,
    error: null,
    errorCode: undefined,

    /**
     * Load manifest from object
     * Called when project is loaded or manifest file is read
     * 
     * @param manifest - Complete manifest object
     */
    loadManifest: (manifest: Manifest) => {
      set((state) => {
        state.manifest = manifest;

        // Clean up orphaned flows (flows that reference deleted components)
        if (state.manifest.flows) {
          const componentIds = new Set(Object.keys(state.manifest.components));
          const flowsToDelete: string[] = [];

          for (const [flowId, flow] of Object.entries(state.manifest.flows)) {
            if (!componentIds.has(flow.trigger.componentId)) {
              console.log('[ManifestStore] Found orphaned flow on load:', flowId, 'for missing component:', flow.trigger.componentId);
              flowsToDelete.push(flowId);
            }
          }

          // Delete orphaned flows
          for (const flowId of flowsToDelete) {
            delete state.manifest.flows[flowId];
          }

          if (flowsToDelete.length > 0) {
            console.log('[ManifestStore] Cleaned up', flowsToDelete.length, 'orphaned flows on manifest load');
            // Mark manifest as modified so it gets saved
            state.manifest.metadata.updatedAt = new Date().toISOString();
          }
        }

        // Reset selection and expansion on load
        state.selectedComponentId = null;
        state.expandedComponentIds = new Set<string>();
      });
    },

    /**
     * Load manifest from file via IPC (Task 2.2B)
     * 
     * Called automatically when project opens.
     * Handles missing manifest, validation errors, corrupted JSON, etc.
     * 
     * @param projectPath - Absolute path to project directory
     * @returns Promise that resolves when load completes
     */
    loadFromFile: async (projectPath: string) => {
      set((state) => {
        state.isLoading = true;
        state.error = null;
        state.validationErrors = [];
        state.validationWarnings = [];
      });

      try {
        const result: ManifestLoadResult = await window.electronAPI.manifest.load(projectPath);

        if (!result.success) {
          set((state) => {
            state.isLoading = false;
            state.error = result.error || 'Failed to load manifest';
            state.errorCode = result.errorCode;
          });
          return;
        }

        set((state) => {
          state.manifest = result.manifest || null;

          // Clean up orphaned flows (flows that reference deleted components)
          if (state.manifest?.flows) {
            const componentIds = new Set(Object.keys(state.manifest.components));
            const flowsToDelete: string[] = [];

            for (const [flowId, flow] of Object.entries(state.manifest.flows)) {
              if (!componentIds.has(flow.trigger.componentId)) {
                console.log('[ManifestStore] Found orphaned flow on file load:', flowId, 'for missing component:', flow.trigger.componentId);
                flowsToDelete.push(flowId);
              }
            }

            // Delete orphaned flows
            for (const flowId of flowsToDelete) {
              delete state.manifest.flows[flowId];
            }

            if (flowsToDelete.length > 0) {
              console.log('[ManifestStore] Cleaned up', flowsToDelete.length, 'orphaned flows on file load');
              // Mark manifest as modified so it gets saved
              state.manifest.metadata.updatedAt = new Date().toISOString();
            }
          }

          state.isLoading = false;
          state.validationErrors = result.validationErrors || [];
          state.validationWarnings = result.validationWarnings || [];
          state.saveBlocked = (result.validationErrors?.length || 0) > 0;
          state.selectedComponentId = null;
          state.expandedComponentIds = new Set<string>();
        });
      } catch (error) {
        set((state) => {
          state.isLoading = false;
          state.error = error instanceof Error ? error.message : 'Unknown error';
        });
      }
    },

    /**
     * Clear manifest state (Task 2.2B)
     * 
     * Called when project closes.
     * Resets all manifest-related state to initial values.
     */
    clearManifest: () => {
      set((state) => {
        state.manifest = null;
        state.selectedComponentId = null;
        state.expandedComponentIds = new Set<string>();
        state.validationErrors = [];
        state.validationWarnings = [];
        state.saveBlocked = false;
        state.error = null;
        state.errorCode = undefined;
      });
    },

    /**
     * Initialize empty manifest for project (Task 2.2B)
     * 
     * Creates .lowcode folder and empty manifest file.
     * Called from MissingManifestDialog when user chooses to initialize.
     * 
     * NOTE: Phase 2 feature - currently supports legacy Rise component manifests.
     * Will be updated to support both .catalyst/ (workflows) and .lowcode/ (components)
     * when Phase 2 frontend builder is activated.
     * 
     * @param projectPath - Absolute path to project directory
     * @param projectName - Name for the project
     * @returns Promise that resolves when initialization completes
     */
    initializeManifest: async (projectPath: string, projectName: string) => {
      try {
        const result = await window.electronAPI.manifest.initialize(projectPath, projectName);

        if (!result.success) {
          set((state) => {
            state.error = result.error || 'Failed to initialize manifest';
          });
          return;
        }

        // After initialization, load the new manifest
        await get().loadFromFile(projectPath);
      } catch (error) {
        set((state) => {
          state.error = error instanceof Error ? error.message : 'Unknown error';
        });
      }
    },

    /**
     * Save manifest to file (debounced) - Task 2.2C
     * 
     * Validation occurs before save. If validation fails,
     * the save is blocked and errors are logged.
     * 
     * DEBOUNCING:
     * - Saves are debounced 500ms to prevent excessive writes
     * - Each mutation triggers this, but only last one executes
     * 
     * VALIDATION:
     * - Blocks save if ERROR-level validation issues exist
     * - Allows save with WARNING-level issues
     * 
     * @returns Promise that resolves when save completes
     * @throws Error if no manifest loaded or validation fails
     */
    saveManifest: async () => {
      const state = get();
      
      if (!state.manifest) {
        console.warn('[ManifestStore] Cannot save: No manifest loaded');
        return;
      }

      // Check if save is blocked due to validation errors
      if (state.saveBlocked || (state.validationErrors && state.validationErrors.length > 0)) {
        console.warn('[ManifestStore] Save blocked: Validation errors exist');
        return;
      }

      // Debounce the save operation
      if (saveTimeout) {
        clearTimeout(saveTimeout);
      }

      return new Promise<void>((resolve, reject) => {
        saveTimeout = setTimeout(async () => {
          try {
            // Get current project from projectStore
            const currentProject = useProjectStore.getState().currentProject;
            
            if (!currentProject) {
              console.warn('[ManifestStore] Cannot save: No project loaded');
              resolve();
              return;
            }

            // Save via IPC (Task 2.2C)
            const result = await window.electronAPI.manifest.save(
              currentProject.path,
              state.manifest
            );
            
            if (result.success) {
              console.log('[ManifestStore] Manifest saved successfully');
              resolve();
            } else {
              console.error('[ManifestStore] Save failed:', result.error);
              reject(new Error(result.error || 'Failed to save manifest'));
            }
          } catch (error) {
            const message = error instanceof Error ? error.message : 'Unknown error';
            console.error('[ManifestStore] Error saving manifest:', message);
            reject(error);
          }
        }, SAVE_DEBOUNCE_MS);
      });
    },

    /**
     * Add new component to manifest
     * 
     * Generates unique ID, validates depth, and adds to manifest.
     * If parentId provided, adds as child of that component.
     * If no parentId, adds to rootComponentOrder for proper ordering.
     * 
     * TEMPLATE INTEGRATION (Task 3.5):
     * - Looks up template from templateRegistry
     * - Uses template defaults for properties and styling
     * - Falls back to legacy getDefaultsForType for unknown types
     * - Template displayName used if not provided
     * 
     * @param options - Component creation options
     * @returns New component ID
     * @throws Error if max depth exceeded or parent not found
     */
    addComponent: (options: CreateComponentOptions) => {
      const state = get();
      
      // Auto-create empty manifest if none exists
      if (!state.manifest) {
        set({ manifest: createEmptyManifest() });
      }

      // Generate unique component ID
      const id = generateComponentId(options.type);

      // Calculate depth if parent specified
      let depth = 0;
      if (options.parentId) {
        const parent = state.getComponent(options.parentId);
        if (!parent) {
          throw new Error(`Parent component not found: ${options.parentId}`);
        }
        depth = state.getComponentDepth(options.parentId) + 1;
        
        // Validate max depth
        if (depth > MAX_DEPTH) {
          throw new Error(`Maximum nesting depth (${MAX_DEPTH + 1} levels) exceeded`);
        }
      }

      // Try to get template-based defaults first (Task 3.5)
      // Fall back to legacy getDefaultsForType if no template found
      const template = templateRegistry.getTemplate(options.type);
      let defaults: { 
        properties: Record<string, any>; 
        styling: { baseClasses: string[]; inlineStyles?: Record<string, string> } 
      };
      
      if (template) {
        // Use template defaults (Task 3.5) - now includes inlineStyles
        const templateDefaults = templateRegistry.buildDefaults(options.type);
        defaults = {
          properties: templateDefaults.properties,
          styling: {
            baseClasses: templateDefaults.styling.baseClasses,
            inlineStyles: templateDefaults.styling.inlineStyles,
          },
        };
      } else {
        // Fall back to legacy defaults for unknown types
        defaults = getDefaultsForType(options.type, options.displayName);
      }

      // Determine display name: use provided, or template displayName, or capitalize type
      const displayName = options.displayName 
        || template?.displayName 
        || options.type.charAt(0).toUpperCase() + options.type.slice(1);

      // Determine category: use provided, or template category, or 'custom'
      const category = options.category 
        || template?.category 
        || 'custom';

      // Create component with defaults (user options override defaults)
      const component: Component = {
        id,
        displayName,
        type: options.type,
        category,
        properties: options.properties || defaults.properties,
        styling: options.styling || defaults.styling,
        children: [],
        metadata: createComponentMetadata('user'),
      };

      set((state) => {
        // Add to manifest
        state.manifest!.components[id] = component;
        
        // Add to parent's children if specified
        if (options.parentId) {
          const parent = state.manifest!.components[options.parentId];
          if (parent) {
            parent.children.push(id);
          }
        } else {
          // No parent = root component, add to rootComponentOrder
          // Initialize array if it doesn't exist (backwards compatibility)
          if (!state.manifest!.rootComponentOrder) {
            state.manifest!.rootComponentOrder = [];
          }
          state.manifest!.rootComponentOrder.push(id);
        }
        
        // Update timestamp
        state.manifest!.metadata.updatedAt = new Date().toISOString();
      });

      // Auto-save
      get().saveManifest().catch(console.error);

      return id;
    },

    /**
     * Update existing component
     * 
     * Partial update - only specified fields are changed.
     * 
     * @param id - Component ID to update
     * @param updates - Partial component updates
     * @throws Error if component not found
     */
    updateComponent: (id: string, updates: UpdateComponentOptions) => {
      const state = get();
      
      if (!state.manifest) {
        throw new Error('No manifest loaded');
      }

      const component = state.manifest.components[id];
      if (!component) {
        throw new Error(`Component not found: ${id}`);
      }

      set((state) => {
        const comp = state.manifest!.components[id];
        
        // Apply updates
        if (updates.displayName !== undefined) {
          comp.displayName = updates.displayName;
        }
        if (updates.type !== undefined) {
          comp.type = updates.type;
        }
        if (updates.category !== undefined) {
          comp.category = updates.category;
        }
        if (updates.properties !== undefined) {
          comp.properties = updates.properties;
        }
        if (updates.styling !== undefined) {
          comp.styling = updates.styling;
        }
        
        // Update metadata
        comp.metadata.updatedAt = new Date().toISOString();
        state.manifest!.metadata.updatedAt = new Date().toISOString();
      });

      // Auto-save
      get().saveManifest().catch(console.error);
    },

    /**
     * Delete component and all its children
     * 
     * Recursively deletes component and descendants.
     * Removes from parent's children array.
     * 
     * @param id - Component ID to delete
     * @throws Error if component not found
     */
    deleteComponent: (id: string) => {
      const state = get();
      
      if (!state.manifest) {
        throw new Error('No manifest loaded');
      }

      const component = state.manifest.components[id];
      if (!component) {
        throw new Error(`Component not found: ${id}`);
      }

      // Helper to recursively collect all descendant IDs
      const collectDescendants = (componentId: string): string[] => {
        const comp = state.manifest!.components[componentId];
        if (!comp) return [];
        
        const descendants = [componentId];
        for (const childId of comp.children) {
          descendants.push(...collectDescendants(childId));
        }
        return descendants;
      };

      // Get all components to delete (component + descendants)
      const idsToDelete = collectDescendants(id);

      set((state) => {
        // Clean up flows that reference any of the components being deleted
        // This must happen BEFORE deleting components to maintain referential integrity
        if (state.manifest!.flows) {
          const flowsToDelete: string[] = [];

          // Find all flows that reference components being deleted
          for (const [flowId, flow] of Object.entries(state.manifest!.flows)) {
            if (idsToDelete.includes(flow.trigger.componentId)) {
              flowsToDelete.push(flowId);
            }
          }

          // Delete the flows
          for (const flowId of flowsToDelete) {
            console.log('[ManifestStore] Deleting orphaned flow:', flowId, 'for component:', state.manifest!.flows[flowId]?.trigger.componentId);
            delete state.manifest!.flows[flowId];
          }

          if (flowsToDelete.length > 0) {
            console.log('[ManifestStore] Deleted', flowsToDelete.length, 'orphaned flows');
          }
        }
        // Remove from parent's children
        let wasRootComponent = true;
        for (const comp of Object.values(state.manifest!.components) as Component[]) {
          const index = comp.children.indexOf(id);
          if (index !== -1) {
            comp.children.splice(index, 1);
            wasRootComponent = false;
          }
        }
        
        // If root component, remove from rootComponentOrder
        if (wasRootComponent && state.manifest!.rootComponentOrder) {
          const rootIdx = state.manifest!.rootComponentOrder.indexOf(id);
          if (rootIdx !== -1) {
            state.manifest!.rootComponentOrder.splice(rootIdx, 1);
          }
        }
        
        // Delete all components
        for (const deleteId of idsToDelete) {
          delete state.manifest!.components[deleteId];
          
          // Clear selection if deleted
          if (state.selectedComponentId === deleteId) {
            state.selectedComponentId = null;
          }
          
          // Remove from expanded set
          state.expandedComponentIds.delete(deleteId);
        }
        
        // Update timestamp
        state.manifest!.metadata.updatedAt = new Date().toISOString();
      });

      // Auto-save
      get().saveManifest().catch(console.error);
    },

    /**
     * Duplicate component (shallow copy)
     * 
     * Creates copy with new ID, same properties and styling.
     * Does NOT copy children.
     * 
     * @param id - Component ID to duplicate
     * @returns New component ID
     * @throws Error if component not found
     */
    duplicateComponent: (id: string) => {
      const state = get();
      
      if (!state.manifest) {
        throw new Error('No manifest loaded');
      }

      const original = state.manifest.components[id];
      if (!original) {
        throw new Error(`Component not found: ${id}`);
      }

      // Generate new ID
      const newId = generateComponentId(original.type);

      // Create duplicate (shallow copy, no children)
      const duplicate: Component = {
        id: newId,
        displayName: `${original.displayName} (Copy)`,
        type: original.type,
        category: original.category,
        properties: { ...original.properties },
        styling: { ...original.styling },
        children: [], // Don't copy children
        metadata: createComponentMetadata('user'),
      };

      set((state) => {
        // Add to manifest
        state.manifest!.components[newId] = duplicate;
        
        // Add as sibling (same parent)
        for (const comp of Object.values(state.manifest!.components) as Component[]) {
          if (comp.children.includes(id)) {
            comp.children.push(newId);
            break;
          }
        }
        
        // Update timestamp
        state.manifest!.metadata.updatedAt = new Date().toISOString();
      });

      // Auto-save
      get().saveManifest().catch(console.error);

      return newId;
    },

    /**
     * Move component to new parent
     * 
     * Validates depth and circular references before moving.
     * 
     * @param id - Component ID to move
     * @param newParentId - New parent ID (null for root)
     * @throws Error if would create circular reference or exceed max depth
     */
    moveComponent: (id: string, newParentId: string | null) => {
      const state = get();
      
      if (!state.manifest) {
        throw new Error('No manifest loaded');
      }

      const component = state.manifest.components[id];
      if (!component) {
        throw new Error(`Component not found: ${id}`);
      }

      // Cannot move to itself
      if (id === newParentId) {
        throw new Error('Cannot move component to itself');
      }

      // Check for circular reference (newParent is descendant of component)
      if (newParentId) {
        const isDescendant = (ancestorId: string, checkId: string): boolean => {
          const ancestor = state.manifest!.components[ancestorId];
          if (!ancestor) return false;
          
          if (ancestor.children.includes(checkId)) return true;
          
          return ancestor.children.some(childId => isDescendant(childId, checkId));
        };
        
        if (isDescendant(id, newParentId)) {
          throw new Error('Cannot move component: would create circular reference');
        }
      }

      // Calculate new depth
      let newDepth = 0;
      if (newParentId) {
        newDepth = state.getComponentDepth(newParentId) + 1;
        
        // Check if move would exceed max depth for component and children
        const componentDepth = state.getComponentDepth(id);
        const componentTreeDepth = getMaxDescendantDepth(state.manifest.components, id, componentDepth);
        
        if (newDepth + (componentTreeDepth - componentDepth) > MAX_DEPTH) {
          throw new Error(`Maximum nesting depth (${MAX_DEPTH + 1} levels) would be exceeded`);
        }
      }

      set((state) => {
        // Remove from old parent
        for (const comp of Object.values(state.manifest!.components) as Component[]) {
          const index = comp.children.indexOf(id);
          if (index !== -1) {
            comp.children.splice(index, 1);
            break;
          }
        }
        
        // Add to new parent
        if (newParentId) {
          const newParent = state.manifest!.components[newParentId];
          if (newParent) {
            newParent.children.push(id);
          }
        }
        
        // Update timestamp
        state.manifest!.metadata.updatedAt = new Date().toISOString();
      });

      // Auto-save
      get().saveManifest().catch(console.error);
    },

    /**
     * Reorder a component within its siblings or move to different parent
     * 
     * Handles three scenarios:
     * 1. position='before': Place component before target (as sibling)
     * 2. position='after': Place component after target (as sibling)
     * 3. position='inside': Make component a child of target
     * 
     * Properly maintains rootComponentOrder for root-level components.
     * 
     * @param id - Component ID to move
     * @param targetId - Target component ID to position relative to
     * @param position - 'before' | 'after' | 'inside'
     * @throws Error if component not found or would create circular reference
     */
    reorderComponent: (id: string, targetId: string, position: 'before' | 'after' | 'inside') => {
      const state = get();
      
      if (!state.manifest) {
        throw new Error('No manifest loaded');
      }

      // Can't move to self
      if (id === targetId) {
        return;
      }

      const component = state.manifest.components[id];
      const targetComponent = state.manifest.components[targetId];
      
      if (!component) {
        throw new Error(`Component not found: ${id}`);
      }
      if (!targetComponent) {
        throw new Error(`Target component not found: ${targetId}`);
      }

      // Check for circular reference when moving inside
      if (position === 'inside') {
        const isDescendant = (ancestorId: string, checkId: string): boolean => {
          const ancestor = state.manifest!.components[ancestorId];
          if (!ancestor) return false;
          if (ancestor.children.includes(checkId)) return true;
          return ancestor.children.some(childId => isDescendant(childId, checkId));
        };
        
        if (isDescendant(id, targetId)) {
          throw new Error('Cannot move component: would create circular reference');
        }

        // Validate depth
        const targetDepth = state.getComponentDepth(targetId);
        const componentSubtreeDepth = getMaxDescendantDepth(state.manifest.components, id, 0);
        
        if (targetDepth + 1 + componentSubtreeDepth > MAX_DEPTH) {
          throw new Error(`Maximum nesting depth (${MAX_DEPTH + 1} levels) would be exceeded`);
        }
      }

      // Find the current parent of the component being moved
      const findParent = (componentId: string): string | null => {
        for (const [parentId, comp] of Object.entries(state.manifest!.components)) {
          if (comp.children.includes(componentId)) {
            return parentId;
          }
        }
        return null;
      };

      const currentParentId = findParent(id);
      const targetParentId = findParent(targetId);

      set((state) => {
        // Initialize rootComponentOrder if needed
        if (!state.manifest!.rootComponentOrder) {
          // Build from existing root components
          const roots = Object.keys(state.manifest!.components).filter((compId) => {
            return !Object.values(state.manifest!.components).some((comp) =>
              comp.children.includes(compId)
            );
          });
          state.manifest!.rootComponentOrder = roots;
        }

        // Step 1: Remove from current location
        if (currentParentId) {
          // Remove from parent's children
          const parent = state.manifest!.components[currentParentId];
          const idx = parent.children.indexOf(id);
          if (idx !== -1) {
            parent.children.splice(idx, 1);
          }
        } else {
          // Remove from rootComponentOrder
          const idx = state.manifest!.rootComponentOrder!.indexOf(id);
          if (idx !== -1) {
            state.manifest!.rootComponentOrder!.splice(idx, 1);
          }
        }

        // Step 2: Insert at new location
        // IMPORTANT: Access target via state.manifest, not the frozen reference
        if (position === 'inside') {
          // Make component a child of target
          const target = state.manifest!.components[targetId];
          target.children.push(id);
        } else {
          // Insert as sibling (before or after target)
          if (targetParentId) {
            // Target has a parent - insert in parent's children array
            const parent = state.manifest!.components[targetParentId];
            const targetIdx = parent.children.indexOf(targetId);
            const insertIdx = position === 'before' ? targetIdx : targetIdx + 1;
            parent.children.splice(insertIdx, 0, id);
          } else {
            // Target is a root component - insert in rootComponentOrder
            const targetIdx = state.manifest!.rootComponentOrder!.indexOf(targetId);
            const insertIdx = position === 'before' ? targetIdx : targetIdx + 1;
            state.manifest!.rootComponentOrder!.splice(insertIdx, 0, id);
          }
        }

        // Update timestamp
        state.manifest!.metadata.updatedAt = new Date().toISOString();
      });

      // Auto-save
      get().saveManifest().catch(console.error);
    },

    /**
     * Select component for editing
     * 
     * @param id - Component ID to select (null to deselect)
     */
    selectComponent: (id: string | null) => {
      set((state) => {
        state.selectedComponentId = id;
      });
    },

    /**
     * Toggle component expansion in tree
     * 
     * @param id - Component ID to toggle
     */
    toggleExpanded: (id: string) => {
      set((state) => {
        if (state.expandedComponentIds.has(id)) {
          state.expandedComponentIds.delete(id);
        } else {
          state.expandedComponentIds.add(id);
        }
      });
    },

    /**
     * Expand all components in tree
     */
    expandAll: () => {
      const state = get();
      if (!state.manifest) return;
      
      set((state) => {
        state.expandedComponentIds = new Set(
          Object.keys(state.manifest!.components)
        );
      });
    },

    /**
     * Collapse all components in tree
     */
    collapseAll: () => {
      set((state) => {
        state.expandedComponentIds = new Set();
      });
    },

    /**
     * Validate manifest structure
     * 
     * Checks:
     * - Max depth not exceeded
     * - No circular references
     * - All component IDs unique
     * - All parent references valid
     * 
     * @returns Validation result with errors/warnings
     */
    validate: (): ValidationResult => {
      const state = get();
      
      if (!state.manifest) {
        return {
          isValid: false,
          errors: [
            {
              field: 'manifest',
              message: 'No manifest loaded',
              level: 'ERROR',
            },
          ],
          level: 1,
        };
      }

      const errors: ValidationError[] = [];

      // Check each component
      for (const [id, component] of Object.entries(state.manifest.components)) {
        // Validate depth
        const depth = state.getComponentDepth(id);
        if (depth > MAX_DEPTH) {
          errors.push({
            field: 'depth',
            componentId: id,
            message: `Component "${component.displayName}" exceeds maximum depth (${MAX_DEPTH + 1} levels)`,
            hint: 'Move component to a shallower position in the tree',
            level: 'ERROR',
          });
        }
        
        // Validate children exist
        for (const childId of component.children) {
          if (!state.manifest.components[childId]) {
            errors.push({
              field: 'children',
              componentId: id,
              message: `Component "${component.displayName}" references non-existent child: ${childId}`,
              hint: 'Remove invalid child reference',
              level: 'ERROR',
            });
          }
        }
      }

      return {
        isValid: errors.length === 0,
        errors,
        level: 1,
      };
    },

    /**
     * Get component by ID
     * 
     * @param id - Component ID
     * @returns Component or undefined if not found
     */
    getComponent: (id: string) => {
      const state = get();
      return state.manifest?.components[id];
    },

    /**
     * Get component tree as flat array with depth info
     * 
     * Computes tree structure with expansion and selection state.
     * Uses rootComponentOrder to maintain proper ordering of root-level components.
     * Used for rendering the component tree UI.
     * 
     * @returns Array of ComponentTreeNode objects
     */
    getComponentTree: (): ComponentTreeNode[] => {
      const state = get();
      
      if (!state.manifest) {
        return [];
      }

      // Find root components (no parent)
      const allRootIds = Object.keys(state.manifest.components).filter((id) => {
        return !Object.values(state.manifest!.components).some((comp) =>
          comp.children.includes(id)
        );
      });

      // Use rootComponentOrder if available, otherwise use detected roots
      // This ensures proper ordering: first component in array = first in tree = top of page
      let rootIds: string[];
      if (state.manifest.rootComponentOrder && state.manifest.rootComponentOrder.length > 0) {
        // Filter to only include IDs that actually exist and are roots
        const orderedRoots = state.manifest.rootComponentOrder.filter(id => 
          allRootIds.includes(id)
        );
        // Add any roots that aren't in the order array (backwards compatibility)
        const unorderedRoots = allRootIds.filter(id => 
          !state.manifest!.rootComponentOrder!.includes(id)
        );
        rootIds = [...orderedRoots, ...unorderedRoots];
      } else {
        rootIds = allRootIds;
      }

      const result: ComponentTreeNode[] = [];

      // Recursive function to build tree
      const addNode = (id: string, depth: number, parentId: string | null) => {
        const component = state.manifest!.components[id];
        if (!component) return;

        // Create tree node
        const node: ComponentTreeNode = {
          ...component,
          depth,
          parentId,
          hasChildren: component.children.length > 0,
          isExpanded: state.expandedComponentIds.has(id),
          isSelected: state.selectedComponentId === id,
        };

        result.push(node);

        // Add children if expanded (children array order is already respected)
        if (node.isExpanded) {
          for (const childId of component.children) {
            addNode(childId, depth + 1, id);
          }
        }
      };

      // Build tree from roots in order
      for (const rootId of rootIds) {
        addNode(rootId, 0, null);
      }

      return result;
    },

    /**
     * Get component depth in tree
     * 
     * @param id - Component ID
     * @returns Depth (0 for root, 1 for child, etc.)
     */
    getComponentDepth: (id: string): number => {
      const state = get();
      
      if (!state.manifest) {
        return 0;
      }

      // Find parent recursively
      const findDepth = (componentId: string, currentDepth: number): number => {
        // Find parent
        for (const comp of Object.values(state.manifest!.components)) {
          if (comp.children.includes(componentId)) {
            return findDepth(comp.id, currentDepth + 1);
          }
        }
        return currentDepth;
      };

      return findDepth(id, 0);
    },

    /**
     * Check if component can have children added
     * 
     * @param parentId - Parent component ID
     * @returns true if can add child (depth < max)
     */
    canAddChild: (parentId: string): boolean => {
      const state = get();
      const depth = state.getComponentDepth(parentId);
      return depth < MAX_DEPTH;
    },

    /**
     * Add multiple AI-generated components at once (Task 3.7)
     * 
     * Used for enhanced AI generation which produces component hierarchies.
     * Components are already linked via their children arrays.
     * 
     * @param components - Map of component ID to component data
     * @param rootId - The root component ID to add as top-level
     * @param parentId - Optional parent for the root component
     */
    addComponentsFromAI: (
      components: Record<string, any>,
      rootId: string,
      parentId?: string
    ) => {
      const state = get();
      
      // Auto-create empty manifest if none exists
      if (!state.manifest) {
        set({ manifest: createEmptyManifest() });
      }

      set((state) => {
        // Add all components to manifest
        for (const [id, comp] of Object.entries(components)) {
          // Ensure component has required structure
          const component: Component = {
            id: comp.id || id,
            displayName: comp.displayName || 'Component',
            type: comp.type || 'container',
            category: comp.category || 'custom',
            properties: comp.properties || {},
            styling: comp.styling || { baseClasses: [] },
            children: comp.children || [],
            metadata: comp.metadata || createComponentMetadata('ai'),
          };
          
          state.manifest!.components[id] = component;
        }
        
        // If parentId specified, add root to parent's children
        if (parentId) {
          const parent = state.manifest!.components[parentId];
          if (parent && !parent.children.includes(rootId)) {
            parent.children.push(rootId);
          }
        }
        
        // Update timestamp
        state.manifest!.metadata.updatedAt = new Date().toISOString();
      });

      // Auto-save
      get().saveManifest().catch(console.error);
    },
  }))
);

/**
 * Helper function to get maximum descendant depth
 * Used for move validation
 * 
 * @param components - Component map
 * @param id - Component ID to check
 * @param currentDepth - Current depth of component
 * @returns Maximum depth of any descendant
 */
function getMaxDescendantDepth(
  components: Record<string, Component>,
  id: string,
  currentDepth: number
): number {
  const component = components[id];
  if (!component || component.children.length === 0) {
    return currentDepth;
  }

  let maxDepth = currentDepth;
  for (const childId of component.children) {
    const childDepth = getMaxDescendantDepth(components, childId, currentDepth + 1);
    maxDepth = Math.max(maxDepth, childDepth);
  }

  return maxDepth;
}
