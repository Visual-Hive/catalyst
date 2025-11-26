/**
 * @file types.ts
 * @description Type definitions for Rise manifest (Level 1 - MVP)
 * 
 * @architecture Phase 2, Task 2.1 - Component Tree UI
 * @created 2025-11-25
 * @author AI (Cline) + Human Review
 * @confidence 9/10 - Based on COMPONENT_SCHEMA.md Level 1
 * 
 * @see docs/COMPONENT_SCHEMA.md - Level 1 schema specification
 * @see docs/SCHEMA_LEVELS.md - Progressive schema levels
 * 
 * PROBLEM SOLVED:
 * - Type-safe manifest structure for Level 1 MVP
 * - Component hierarchy representation
 * - Property definitions with static values and props
 * - Validation and error handling types
 * 
 * SOLUTION:
 * - TypeScript interfaces matching Level 1 schema
 * - No expressions, state, or event handlers (Level 2)
 * - No data connections or advanced features (Level 3)
 * - Clean, simple types for MVP
 * 
 * LEVEL 1 FEATURES ONLY:
 * - Static property values
 * - Props (component inputs)
 * - Basic styling with Tailwind
 * - Component hierarchy (max 5 levels)
 * - Metadata tracking
 * 
 * @security-critical false
 * @performance-critical false
 */

/**
 * Schema version and level
 */
export interface ManifestVersion {
  schemaVersion: string; // e.g., "1.0.0"
  level: 1; // Level 1 for MVP
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
 */
export interface ComponentStyling {
  baseClasses: string[]; // Always-applied Tailwind classes
  conditionalClasses?: {
    container?: string[]; // Conditional class expressions (simple ternaries only)
  };
  customCSS?: string; // Inline CSS (sanitized)
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
 * Component definition (Level 1)
 */
export interface Component {
  id: string; // Unique component ID (e.g., "comp_button_001")
  displayName: string; // Human-readable name
  type: string; // HTML element or component type (e.g., "button", "div", "UserCard")
  category?: 'basic' | 'layout' | 'form' | 'custom'; // Component category
  
  properties: Record<string, ComponentProperty>; // Component properties
  
  styling: ComponentStyling; // Visual styling
  
  children: string[]; // Array of child component IDs
  
  metadata: ComponentMetadata; // Creation and tracking info
}

/**
 * Complete manifest structure (Level 1)
 */
export interface Manifest extends ManifestVersion {
  metadata: ProjectMetadata;
  buildConfig: BuildConfig;
  plugins: PluginConfig;
  components: Record<string, Component>; // Keyed by component ID
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
}

/**
 * Default empty manifest
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
