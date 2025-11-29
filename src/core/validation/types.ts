/**
 * @file types.ts
 * @description Type definitions for Level 1 & Level 1.5 schema validation system
 * 
 * @architecture Phase 0, Task 0.3 - Schema Level 1 Validator
 * @architecture Phase 4, Task 4.0 - Logic System Foundation (Level 1.5)
 * @created 2025-11-19
 * @updated 2025-11-29
 * @author AI (Cline) + Human Review
 * @confidence 10/10 - Straightforward type definitions
 * 
 * @see docs/SCHEMA_LEVELS.md - Level 1 specification
 * @see docs/COMPONENT_SCHEMA.md - Complete schema reference
 * @see .implementation/phase-0-foundation/task-0.3-schema-validator.md
 * @see .implementation/phase-4-logic-editor/task-4.0-logic-system-foundation.md
 * 
 * @security-critical false
 * @performance-critical false
 */

import type {
  ComponentEvents,
  PageState,
  FlowsMap,
  Flow,
  FlowNode,
  FlowEdge,
  StateVariable,
} from '../logic/types';

/**
 * Severity levels for validation messages.
 * 
 * ERROR: Blocks code generation, must be fixed
 * WARNING: Doesn't block generation but should be addressed
 * INFO: Informational message for best practices
 */
export type ValidationSeverity = 'ERROR' | 'WARNING' | 'INFO';

/**
 * Validation error with detailed context and actionable guidance.
 * 
 * DESIGN DECISION: Include rich context to help users fix issues quickly
 * - path: Shows exact location in manifest JSON
 * - suggestion: Actionable fix guidance
 * - code: Machine-readable error identifier for programmatic handling
 * 
 * @example
 * {
 *   field: 'properties.displayText.type',
 *   message: 'Expression properties not supported in Level 1',
 *   severity: 'ERROR',
 *   path: 'components.comp_button_001.properties.displayText',
 *   suggestion: 'Use "static" or "prop" type instead',
 *   code: 'UNSUPPORTED_PROPERTY_TYPE'
 * }
 */
export interface ValidationError {
  /** Name of the field that failed validation */
  field: string;
  
  /** Human-readable error message */
  message: string;
  
  /** Severity level - ERROR blocks generation */
  severity: ValidationSeverity;
  
  /** JSON path to the problematic field (e.g., "components.comp_001.properties.label") */
  path: string;
  
  /** Component ID where error occurred (for easier debugging) */
  componentId?: string;
  
  /** Component display name (user-friendly reference) */
  componentName?: string;
  
  /** Actionable suggestion for fixing the error */
  suggestion?: string;
  
  /** Machine-readable error code for programmatic handling */
  code?: string;
  
  /** Link to relevant documentation */
  documentation?: string;
}

/**
 * Result of schema validation with detailed error/warning information.
 * 
 * USAGE:
 * Check isValid first. If false, review errors[] for blocking issues.
 * Warnings don't block generation but should be shown to users.
 * 
 * @example
 * const result = validator.validate(manifest);
 * if (!result.isValid) {
 *   console.error('Validation failed:', result.errors);
 *   return;
 * }
 * if (result.warnings.length > 0) {
 *   console.warn('Validation warnings:', result.warnings);
 * }
 */
export interface ValidationResult {
  /** True if no ERROR-level issues found */
  isValid: boolean;
  
  /** Array of ERROR-level validation failures (blocks generation) */
  errors: ValidationError[];
  
  /** Array of WARNING-level validation issues (doesn't block) */
  warnings: ValidationError[];
  
  /** Schema level validated against (1, 1.5, 2, or 3) */
  level: number;
  
  /** Number of components validated */
  componentCount?: number;
  
  /** Validation execution time in milliseconds */
  validationTime?: number;
  
  /** Maximum tree depth found during validation */
  maxDepth?: number;
  
  /** Number of state variables validated (Level 1.5+) */
  stateVariableCount?: number;
  
  /** Number of flows validated (Level 1.5+) */
  flowCount?: number;
}

/**
 * Rule configuration for Level 1 schema validation.
 * 
 * These rules define the boundaries of what's allowed in MVP.
 * Any feature not listed here should be rejected.
 */
export interface ValidationRules {
  schema: {
    /** Expected schema version */
    version: string;
    /** Expected schema level */
    level: number;
    /** Required root-level fields */
    requiredFields: string[];
  };
  
  component: {
    /** Required fields in every component */
    requiredFields: string[];
    /** Allowed component types */
    validTypes: string[];
    /** Maximum nesting depth */
    maxDepth: number;
    /** Maximum children per component */
    maxChildren: number;
    /** Component ID pattern (comp_alphanumeric_underscore) */
    idPattern: RegExp;
    /** Display name pattern (PascalCase recommended) */
    namePattern: RegExp;
  };
  
  property: {
    /** Allowed property types in Level 1 */
    allowedTypes: string[];
    /** Blocked property types (Level 2/3 features) */
    blockedTypes: string[];
    /** Allowed data types for property values */
    allowedDataTypes: string[];
  };
  
  /** List of Level 2/3 features that should be blocked */
  blockedFeatures: string[];
}

/**
 * Component manifest structure (minimal type for validation).
 * 
 * NOTE: This is a validation-focused subset, not the complete component schema.
 * See docs/COMPONENT_SCHEMA.md for full schema specification.
 * 
 * Level 1: Basic static components
 * Level 1.5: Adds pageState, flows, and component events
 */
export interface ComponentManifest {
  schemaVersion: string;
  level: number;
  metadata: ManifestMetadata;
  components: Record<string, Component>;
  buildConfig?: Record<string, any>;
  plugins?: Record<string, any>;
  
  // Level 1.5 features
  /**
   * Page-level state variables (Level 1.5+)
   * Key is variable name, value is StateVariable definition
   */
  pageState?: PageState;
  
  /**
   * Logic flows (Level 1.5+)
   * Key is flow ID, value is Flow definition
   */
  flows?: FlowsMap;
  
  // Level 2/3 features (should be absent in Level 1 and 1.5)
  globalFunctions?: any;
  globalState?: any;
  eventHandlers?: any;
  localState?: any;
  routes?: any;
  api?: any;
  database?: any;
  expressions?: any;
}

/**
 * Manifest metadata structure.
 */
export interface ManifestMetadata {
  projectName: string;
  framework: string;
  createdAt: string;
  modifiedAt?: string;
  author?: string;
  version?: string;
}

/**
 * Component structure (minimal type for validation).
 * 
 * Level 1: Basic properties and styling
 * Level 1.5: Adds events field for onClick handlers
 */
export interface Component {
  id: string;
  displayName: string;
  type: string;
  category?: string;
  properties?: Record<string, ComponentProperty>;
  children?: string[];
  styling?: ComponentStyling;
  metadata?: ComponentMetadata;
  
  // Level 1.5 features
  /**
   * Event handlers for this component (Level 1.5+)
   * Maps event type to flow reference
   * Level 1.5: Only onClick is supported
   */
  events?: ComponentEvents;
  
  // Level 2/3 features (should be absent in Level 1 and 1.5)
  eventHandlers?: any;  // Old-style handlers (deprecated)
  localState?: any;
  dataConnections?: any;
  codeReview?: any;
  performance?: any;
}

/**
 * Component property structure.
 */
export interface ComponentProperty {
  type: 'static' | 'prop' | 'expression' | 'computed' | 'state';
  value?: any;
  dataType?: string;
  required?: boolean;
  default?: any;
  options?: any[];
  
  // Level 2 features
  expression?: string;
  dependencies?: string[];
}

/**
 * Component styling structure.
 */
export interface ComponentStyling {
  baseClasses?: string[];
  conditionalClasses?: Record<string, string[]>;
  customCSS?: string;
}

/**
 * Component metadata structure.
 */
export interface ComponentMetadata {
  createdAt?: string;
  author?: string;
  version?: string;
  description?: string;
}

// ============================================================
// LEVEL 1.5 VALIDATION TYPES
// ============================================================

/**
 * Level 1.5 validation rules configuration
 * 
 * Extends Level 1 rules with logic system constraints
 */
export interface Level15ValidationRules {
  schema: {
    version: string;
    level: number;
    requiredFields: string[];
  };
  
  component: {
    requiredFields: string[];
    validTypes: string[];
    maxDepth: number;
    maxChildren: number;
    idPattern: RegExp;
    namePattern: RegExp;
  };
  
  property: {
    allowedTypes: string[];
    blockedTypes: string[];
    allowedDataTypes: string[];
  };
  
  /** Level 1.5 specific: State variable rules */
  stateVariable: {
    /** Allowed state variable types */
    allowedTypes: string[];
    /** Pattern for valid variable names */
    namePattern: RegExp;
    /** Maximum number of state variables */
    maxVariables: number;
  };
  
  /** Level 1.5 specific: Flow rules */
  flow: {
    /** Allowed event types (Level 1.5: only onClick) */
    allowedEventTypes: string[];
    /** Allowed node types (Level 1.5: event, setState, alert, console) */
    allowedNodeTypes: string[];
    /** Maximum nodes per flow */
    maxNodesPerFlow: number;
    /** Maximum total flows */
    maxFlows: number;
    /** Pattern for valid flow IDs */
    idPattern: RegExp;
  };
  
  /** Level 1.5 specific: Value rules */
  value: {
    /** Allowed value types (Level 1.5: only static) */
    allowedTypes: string[];
    /** Blocked value types (Level 1.5: expression) */
    blockedTypes: string[];
  };
  
  blockedFeatures: string[];
}

/**
 * Flow-specific validation error
 */
export interface FlowValidationError extends ValidationError {
  flowId?: string;
  flowName?: string;
  nodeId?: string;
  edgeId?: string;
}

/**
 * State variable validation error
 */
export interface StateValidationError extends ValidationError {
  variableName?: string;
}

// Re-export logic types for convenience
export type {
  ComponentEvents,
  PageState,
  FlowsMap,
  Flow,
  FlowNode,
  FlowEdge,
  StateVariable,
};
