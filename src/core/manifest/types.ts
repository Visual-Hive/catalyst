/**
 * @file types.ts
 * @description Type definitions for Rise manifest (Level 1 & Level 1.5)
 * 
 * @architecture Phase 2, Task 2.1 - Component Tree UI (Level 1)
 * @architecture Phase 4, Task 4.0 - Logic System Foundation (Level 1.5)
 * @created 2025-11-25
 * @updated 2025-11-29
 * @author AI (Cline) + Human Review
 * @confidence 9/10 - Based on COMPONENT_SCHEMA.md and phase-4-micro-logic-editor.md
 * 
 * @see docs/COMPONENT_SCHEMA.md - Level 1 schema specification
 * @see docs/SCHEMA_LEVELS.md - Progressive schema levels
 * @see .implementation/phase-4-logic-editor/phase-4-micro-logic-editor.md - Level 1.5 spec
 * 
 * PROBLEM SOLVED:
 * - Type-safe manifest structure for Level 1 MVP
 * - Component hierarchy representation
 * - Property definitions with static values and props
 * - Validation and error handling types
 * - Level 1.5: Events, page state, and visual logic flows
 * 
 * SOLUTION:
 * - TypeScript interfaces matching Level 1 & 1.5 schema
 * - Level 1: Static properties, no state/events
 * - Level 1.5: onClick events, page state, basic flows
 * - No expressions (Level 2) or data connections (Level 3)
 * 
 * LEVEL 1 FEATURES:
 * - Static property values
 * - Props (component inputs)
 * - Basic styling with Tailwind
 * - Component hierarchy (max 5 levels)
 * - Metadata tracking
 * 
 * LEVEL 1.5 FEATURES (Micro Logic Editor):
 * - onClick events only
 * - Page-level state variables
 * - Visual logic flows (3 node types: setState, alert, console)
 * - Static values only (no expressions)
 * 
 * @security-critical false
 * @performance-critical false
 */

import type {
  ComponentEvents,
  PageState,
  FlowsMap,
} from '../logic/types';

/**
 * Schema level type
 * 
 * - Level 1: MVP with static properties only
 * - Level 1.5: Micro Logic Editor (onClick events, page state, basic flows)
 * - Level 2: Full logic system with expressions (future)
 * - Level 3: Data connections and advanced features (future)
 */
export type SchemaLevel = 1 | 1.5 | 2 | 3;

/**
 * Schema version and level
 */
export interface ManifestVersion {
  schemaVersion: string; // e.g., "1.0.0"
  level: SchemaLevel; // Level 1, 1.5, 2, or 3
}

/**
 * Project metadata
 */
export interface ProjectMetadata {
  projectName: string;
  framework: 'react'; // Only React in MVP
  createdAt: string; // ISO datetime
  updatedAt: string; // ISO datetime
  author?: string;
  description?: string;
}

/**
 * Build configuration
 */
export interface BuildConfig {
  bundler: 'vite'; // Only Vite in MVP
  cssFramework: 'tailwind'; // Only Tailwind in MVP
  typescript?: boolean; // Level 2 feature, default false
}

/**
 * Plugin configuration (React only in MVP)
 */
export interface PluginConfig {
  framework: {
    name: '@rise/plugin-react';
    version: string;
  };
}

/**
 * Property data types
 */
export type PropertyDataType = 
  | 'string'
  | 'number'
  | 'boolean'
  | 'object'
  | 'array';

/**
 * Static property (fixed value)
 * Level 1 feature
 */
export interface StaticProperty {
  type: 'static';
  value: string | number | boolean | null;
  dataType: PropertyDataType;
}

/**
 * Prop property (passed from parent)
 * Level 1 feature
 */
export interface PropProperty {
  type: 'prop';
  dataType: PropertyDataType;
  required: boolean;
  default?: string | number | boolean | null;
  options?: string[]; // For enum-style props
  description?: string;
}

/**
 * Union type for all property types supported in Level 1
 */
export type ComponentProperty = StaticProperty | PropProperty;

/**
 * Component styling configuration
 * 
 * Hybrid approach: Use Tailwind classes for interactive states (hover, focus, etc.)
 * and inline styles for arbitrary values (specific px values, colors, etc.)
 */
export interface ComponentStyling {
  baseClasses: string[]; // Tailwind classes (interactive states, utilities)
  inlineStyles?: Record<string, string>; // CSS properties as key-value pairs (e.g., { padding: '8px 16px' })
  conditionalClasses?: {
    container?: string[]; // Conditional class expressions (simple ternaries only)
  };
  customCSS?: string; // Legacy: raw CSS string (prefer inlineStyles)
}

/**
 * Component metadata
 */
export interface ComponentMetadata {
  createdAt: string; // ISO datetime
  updatedAt: string; // ISO datetime
  author: 'user' | 'ai'; // Track if AI-generated
  version: string; // Component version
  description?: string;
  tags?: string[];
}

/**
 * Component definition (Level 1 & Level 1.5)
 * 
 * Level 1: Static properties, styling, children
 * Level 1.5: Adds events field for onClick handlers
 */
export interface Component {
  id: string; // Unique component ID (e.g., "comp_button_001")
  displayName: string; // Human-readable name
  type: string; // HTML element or component type (e.g., "button", "div", "UserCard")
  category?: 'basic' | 'layout' | 'form' | 'display' | 'custom'; // Component category
  
  properties: Record<string, ComponentProperty>; // Component properties
  
  styling: ComponentStyling; // Visual styling
  
  children: string[]; // Array of child component IDs
  
  metadata: ComponentMetadata; // Creation and tracking info
  
  /**
   * Event handlers for this component (Level 1.5+)
   * Maps event type to flow reference
   * 
   * Level 1.5: Only onClick is supported
   * Level 2+: Will add onChange, onSubmit, onMount, etc.
   * 
   * @example
   * {
   *   onClick: { flowId: "flow_001" }
   * }
   */
  events?: ComponentEvents;
}

/**
 * Complete manifest structure (Level 1 & Level 1.5)
 * 
 * Level 1: Basic structure with components
 * Level 1.5: Adds pageState and flows for logic editor
 */
export interface Manifest extends ManifestVersion {
  metadata: ProjectMetadata;
  buildConfig: BuildConfig;
  plugins: PluginConfig;
  components: Record<string, Component>; // Keyed by component ID
  
  /**
   * Page-level reactive state (Level 1.5+)
   * 
   * Simple state variables accessible to all components on the page.
   * Each variable has a type and initial value.
   * 
   * Level 1.5 constraints:
   * - Only primitive types: string, number, boolean
   * - No expressions in values
   * - No cross-page state sharing
   * 
   * @example
   * {
   *   "clickCount": { type: "number", initialValue: 0 },
   *   "userName": { type: "string", initialValue: "" }
   * }
   */
  pageState?: PageState;
  
  /**
   * Logic flows (Level 1.5+)
   * 
   * Visual logic sequences that execute when events fire.
   * Each flow has a trigger, nodes (actions), and edges (connections).
   * 
   * Level 1.5 constraints:
   * - Only onClick triggers
   * - Only 3 node types: setState, alert, console
   * - Only static values (no expressions)
   * - Single-step execution (no chaining)
   * 
   * @example
   * {
   *   "flow_001": {
   *     id: "flow_001",
   *     name: "Handle Click",
   *     trigger: { type: "onClick", componentId: "comp_button_001" },
   *     nodes: [...],
   *     edges: [...]
   *   }
   * }
   */
  flows?: FlowsMap;
}

/**
 * Validation error
 */
export interface ValidationError {
  field: string; // Field that failed validation
  componentId?: string; // Component ID if applicable
  message: string; // Error message
  hint?: string; // Suggestion for fixing
  level: 'ERROR' | 'WARNING'; // Severity
}

/**
 * Validation result
 */
export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings?: ValidationError[];
  level: 1; // Schema level validated against
}

/**
 * Component tree node (for UI rendering)
 * Extends Component with computed properties
 */
export interface ComponentTreeNode extends Component {
  depth: number; // Nesting depth (0-4 for max 5 levels)
  parentId: string | null; // Parent component ID
  hasChildren: boolean; // Quick check for children
  isExpanded: boolean; // UI state: is node expanded
  isSelected: boolean; // UI state: is node selected
}

/**
 * Component creation options
 */
export interface CreateComponentOptions {
  displayName: string;
  type: string;
  category?: Component['category'];
  parentId?: string | null; // Parent component to nest under
  properties?: Record<string, ComponentProperty>;
  styling?: ComponentStyling;
}

/**
 * Component update options
 * Partial updates to existing component
 */
export interface UpdateComponentOptions {
  displayName?: string;
  type?: string;
  category?: Component['category'];
  properties?: Record<string, ComponentProperty>;
  styling?: ComponentStyling;
}

/**
 * Manifest store state interface
 */
export interface ManifestState {
  manifest: Manifest | null;
  selectedComponentId: string | null;
  expandedComponentIds: Set<string>;
  
  // Validation state (Task 2.2B)
  validationErrors: any[]; // ValidationError from electron types
  validationWarnings: any[]; // ValidationError from electron types
  saveBlocked: boolean;
  isLoading: boolean;
  error: string | null;
  errorCode?: 'NOT_FOUND' | 'PARSE_ERROR' | 'READ_ERROR';
  
  // Actions
  loadManifest: (manifest: Manifest) => void;
  loadFromFile: (projectPath: string) => Promise<void>;
  clearManifest: () => void;
  initializeManifest: (projectPath: string, projectName: string) => Promise<void>;
  saveManifest: () => Promise<void>;
  
  // Component CRUD
  addComponent: (options: CreateComponentOptions) => string; // Returns new component ID
  updateComponent: (id: string, updates: UpdateComponentOptions) => void;
  deleteComponent: (id: string) => void;
  duplicateComponent: (id: string) => string; // Returns new component ID
  moveComponent: (id: string, newParentId: string | null) => void;
  
  // Selection
  selectComponent: (id: string | null) => void;
  
  // Tree expansion
  toggleExpanded: (id: string) => void;
  expandAll: () => void;
  collapseAll: () => void;
  
  // Validation
  validate: () => ValidationResult;
  
  // Utility
  getComponent: (id: string) => Component | undefined;
  getComponentTree: () => ComponentTreeNode[];
  getComponentDepth: (id: string) => number;
  canAddChild: (parentId: string) => boolean; // Check if can add child (max depth)
  addComponentsFromAI: (components: Record<string, any>, rootId: string, parentId?: string) => void; // Task 3.7: Add AI-generated component hierarchy
}

/**
 * Default empty manifest
 * 
 * Creates a new manifest at Level 1 by default.
 * Use createEmptyLevel15Manifest() for Level 1.5.
 */
export const createEmptyManifest = (): Manifest => ({
  schemaVersion: '1.0.0',
  level: 1,
  metadata: {
    projectName: 'New Project',
    framework: 'react',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  buildConfig: {
    bundler: 'vite',
    cssFramework: 'tailwind',
  },
  plugins: {
    framework: {
      name: '@rise/plugin-react',
      version: '1.0.0',
    },
  },
  components: {},
});

/**
 * Create an empty Level 1.5 manifest with logic system support
 * 
 * Includes empty pageState and flows sections ready for the logic editor.
 */
export const createEmptyLevel15Manifest = (): Manifest => ({
  schemaVersion: '1.0.0',
  level: 1.5,
  metadata: {
    projectName: 'New Project',
    framework: 'react',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  buildConfig: {
    bundler: 'vite',
    cssFramework: 'tailwind',
  },
  plugins: {
    framework: {
      name: '@rise/plugin-react',
      version: '1.0.0',
    },
  },
  components: {},
  pageState: {},
  flows: {},
});

/**
 * Upgrade a Level 1 manifest to Level 1.5
 * 
 * Adds empty pageState and flows sections if they don't exist.
 * Preserves all existing data.
 * 
 * @param manifest - Level 1 manifest to upgrade
 * @returns Level 1.5 manifest
 */
export const upgradeToLevel15 = (manifest: Manifest): Manifest => ({
  ...manifest,
  level: 1.5,
  pageState: manifest.pageState || {},
  flows: manifest.flows || {},
});

/**
 * Check if a manifest is Level 1.5 or higher
 * 
 * @param manifest - Manifest to check
 * @returns True if manifest supports logic features
 */
export const hasLogicSupport = (manifest: Manifest): boolean => {
  return manifest.level >= 1.5;
};

/**
 * Check if a component has any events configured
 * 
 * @param component - Component to check
 * @returns True if component has at least one event handler
 */
export const hasEvents = (component: Component): boolean => {
  return !!component.events && Object.keys(component.events).length > 0;
};

/**
 * Generate unique component ID
 */
export const generateComponentId = (type: string): string => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 6);
  const sanitizedType = type.toLowerCase().replace(/[^a-z0-9]/g, '');
  return `comp_${sanitizedType}_${timestamp}_${random}`;
};

/**
 * Create default component metadata
 */
export const createComponentMetadata = (author: 'user' | 'ai' = 'user'): ComponentMetadata => ({
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  author,
  version: '1.0.0',
});
