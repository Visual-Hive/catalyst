/**
 * @file ValidationRules.ts
 * @description Level 1 (MVP) and Level 1.5 (Logic Editor) schema validation rules
 * 
 * @architecture Phase 0, Task 0.3 - Schema Level 1 Validator
 * @architecture Phase 4, Task 4.0 - Logic System Foundation (Level 1.5)
 * @created 2025-11-19
 * @updated 2025-11-29
 * @author AI (Cline) + Human Review
 * @confidence 9/10 - Rules well-defined in SCHEMA_LEVELS.md and phase-4-micro-logic-editor.md
 * 
 * @see docs/SCHEMA_LEVELS.md - Level 1 specification
 * @see docs/COMPONENT_SCHEMA.md - Complete schema reference
 * @see .implementation/phase-0-foundation/task-0.3-schema-validator.md
 * @see .implementation/phase-4-logic-editor/task-4.0-logic-system-foundation.md
 * 
 * @security-critical false
 * @performance-critical false
 */

import { ValidationRules, Level15ValidationRules } from './types';

/**
 * Level 1 (MVP) validation rules.
 * 
 * DESIGN PHILOSOPHY:
 * These rules define the "gatekeeper" boundaries for MVP.
 * - Conservative: Block anything not explicitly allowed
 * - Clear: Each rule has a specific purpose
 * - Documented: Each rule references the spec
 * 
 * RULE CATEGORIES:
 * 1. Schema Structure: Root-level required fields
 * 2. Component Rules: What makes a valid component
 * 3. Property Rules: What property types are allowed
 * 4. Blocked Features: What Level 2/3 features to reject
 * 
 * WHY THESE SPECIFIC VALUES?
 * - maxDepth: 5 - Prevents overly complex nesting, keeps code readable
 * - maxChildren: 20 - Reasonable limit, forces better component design
 * - idPattern: comp_* - Consistent, predictable naming
 * - namePattern: PascalCase - React/component convention
 * 
 * @see docs/SCHEMA_LEVELS.md for Level 1 feature list
 */
export const LEVEL_1_RULES: ValidationRules = {
  /**
   * Root schema structure rules.
   * 
   * Every manifest MUST have these fields at the root level.
   * Missing any of these = invalid manifest.
   */
  schema: {
    // Expected schema version for Level 1
    version: '1.0.0',
    
    // Schema level (1 = MVP, 2 = Enhanced, 3 = Advanced)
    level: 1,
    
    // Required fields at manifest root
    // NOTE: components can be empty object, but must exist
    requiredFields: ['schemaVersion', 'level', 'metadata', 'components'],
  },
  
  /**
   * Component structure rules.
   * 
   * Defines what makes a valid component in Level 1.
   * These rules ensure generated code is clean and predictable.
   */
  component: {
    // Every component MUST have these fields
    // Without these, we can't generate valid React code
    requiredFields: ['id', 'displayName', 'type', 'properties'],
    
    // Valid component types in Level 1
    // PrimitiveComponent: Basic HTML-like components (button, div, etc.)
    // CompositeComponent: User-created composed components
    validTypes: ['PrimitiveComponent', 'CompositeComponent'],
    
    // Maximum nesting depth: 5 levels
    // Prevents overly complex hierarchies that are hard to understand
    // Example: Page > Container > Card > Header > Title (5 levels)
    maxDepth: 5,
    
    // Maximum children per component: 20
    // Forces better component design - if you need >20, split it up
    // Keeps generated code readable and maintainable
    maxChildren: 20,
    
    // Component ID pattern: comp_[alphanumeric_underscore]
    // Examples: comp_button_001, comp_user_card, comp_main_header
    // 
    // WHY THIS PATTERN?
    // - Prefix 'comp_' prevents collision with JS keywords
    // - Clear identification in codebase
    // - Consistent, predictable naming
    idPattern: /^comp_[a-zA-Z0-9_]+$/,
    
    // Display name pattern: PascalCase (recommended, not enforced)
    // Examples: Button, UserCard, MainHeader
    // 
    // WHY PASCALCASE?
    // - React component convention
    // - Generated code looks professional
    // - Clear visual distinction from functions/variables
    // 
    // NOTE: This is a WARNING, not an ERROR
    // Users can use other formats if needed
    namePattern: /^[A-Z][a-zA-Z0-9]*$/,
  },
  
  /**
   * Property type rules.
   * 
   * Defines what property types are allowed in Level 1.
   * Level 1 is STATIC ONLY - no expressions, computed values, or state.
   */
  property: {
    // ONLY these property types allowed in Level 1
    // 
    // 'static': Fixed value set at design time
    //   Example: { type: 'static', value: 'Click me' }
    // 
    // 'prop': Component input from parent
    //   Example: { type: 'prop', dataType: 'string', required: true }
    allowedTypes: ['static', 'prop'],
    
    // These property types are BLOCKED in Level 1 (Level 2/3 features)
    // 
    // 'expression': Template expressions like {{ state.value }}
    //   Requires: Security sandboxing (Level 2)
    // 
    // 'computed': Calculated values
    //   Requires: Expression system (Level 2)
    // 
    // 'state': Reactive state variables
    //   Requires: State management (Level 2)
    blockedTypes: ['expression', 'computed', 'state'],
    
    // Allowed data types for property values
    // These are TypeScript-compatible types that we can generate code for
    allowedDataTypes: ['string', 'number', 'boolean', 'object', 'array'],
  },
  
  /**
   * Blocked Level 2/3 features.
   * 
   * These features are not available in MVP and should be rejected
   * with clear messages about when they'll be available.
   * 
   * MESSAGING STRATEGY:
   * - Don't just say "not supported"
   * - Explain WHEN it will be available (Level 2, Level 3)
   * - Suggest alternatives for MVP
   */
  blockedFeatures: [
    // === LEVEL 2 FEATURES (Weeks 13-24) ===
    
    // Local component state (useState equivalent)
    'localState',
    
    // Global application state (Zustand stores)
    'globalState',
    
    // Event handlers (onClick, onChange, etc.)
    'eventHandlers',
    
    // Template expressions ({{ }})
    'expressions',
    
    // User-defined global functions
    'globalFunctions',
    
    // Computed properties
    'computedProperties',
    
    // === LEVEL 3 FEATURES (Week 25+) ===
    
    // Data connections (database, API)
    'dataConnections',
    
    // Application routing
    'routes',
    
    // API configuration
    'api',
    
    // Database setup
    'database',
    
    // AI code review
    'codeReview',
    
    // Performance monitoring
    'performance',
    
    // Testing integration
    'testing',
    
    // Analytics
    'analytics',
  ],
};

/**
 * Error code constants for programmatic error handling.
 * 
 * USAGE:
 * Use these codes in validation errors for consistent error identification.
 * Allows UI to show context-specific help or documentation.
 * 
 * @example
 * {
 *   code: ERROR_CODES.UNSUPPORTED_PROPERTY_TYPE,
 *   message: 'Expression properties not supported in Level 1',
 *   // ...
 * }
 */
export const ERROR_CODES = {
  // Schema structure errors
  MISSING_REQUIRED_FIELD: 'MISSING_REQUIRED_FIELD',
  INVALID_SCHEMA_VERSION: 'INVALID_SCHEMA_VERSION',
  INVALID_SCHEMA_LEVEL: 'INVALID_SCHEMA_LEVEL',
  
  // Component errors
  MISSING_COMPONENT_FIELD: 'MISSING_COMPONENT_FIELD',
  INVALID_COMPONENT_ID: 'INVALID_COMPONENT_ID',
  INVALID_COMPONENT_TYPE: 'INVALID_COMPONENT_TYPE',
  INVALID_DISPLAY_NAME: 'INVALID_DISPLAY_NAME',
  
  // Hierarchy errors
  CIRCULAR_REFERENCE: 'CIRCULAR_REFERENCE',
  EXCESSIVE_DEPTH: 'EXCESSIVE_DEPTH',
  TOO_MANY_CHILDREN: 'TOO_MANY_CHILDREN',
  MISSING_COMPONENT_REFERENCE: 'MISSING_COMPONENT_REFERENCE',
  
  // Property errors
  UNSUPPORTED_PROPERTY_TYPE: 'UNSUPPORTED_PROPERTY_TYPE',
  MISSING_PROPERTY_VALUE: 'MISSING_PROPERTY_VALUE',
  MISSING_PROPERTY_DATATYPE: 'MISSING_PROPERTY_DATATYPE',
  INVALID_PROPERTY_DATATYPE: 'INVALID_PROPERTY_DATATYPE',
  
  // Blocked feature errors
  LEVEL_2_FEATURE: 'LEVEL_2_FEATURE',
  LEVEL_3_FEATURE: 'LEVEL_3_FEATURE',
  UNSUPPORTED_FEATURE: 'UNSUPPORTED_FEATURE',
} as const;

/**
 * Documentation URLs for error messages.
 * 
 * FUTURE: Update these with actual documentation URLs when deployed.
 * For now, use relative paths to docs folder.
 */
export const DOCS_URLS = {
  SCHEMA_LEVELS: 'docs/SCHEMA_LEVELS.md',
  COMPONENT_SCHEMA: 'docs/COMPONENT_SCHEMA.md',
  LEVEL_1_GUIDE: 'docs/SCHEMA_LEVELS.md#level-1-mvp-schema-weeks-1-12',
  LEVEL_2_GUIDE: 'docs/SCHEMA_LEVELS.md#level-2-enhanced-schema-weeks-13-24',
  LEVEL_3_GUIDE: 'docs/SCHEMA_LEVELS.md#level-3-advanced-schema-week-25',
  MIGRATION_GUIDE: 'docs/SCHEMA_LEVELS.md#migration-path',
} as const;

/**
 * Helper function to check if a feature is blocked in Level 1.
 * 
 * @param featureName - Name of the feature to check
 * @returns true if feature is blocked, false if allowed
 * 
 * @example
 * if (isBlockedFeature('localState')) {
 *   // Add error: state management not available in Level 1
 * }
 */
export function isBlockedFeature(featureName: string): boolean {
  return LEVEL_1_RULES.blockedFeatures.includes(featureName);
}

/**
 * Helper function to check if a property type is allowed in Level 1.
 * 
 * @param propertyType - Property type to check
 * @returns true if allowed, false if blocked
 * 
 * @example
 * if (!isAllowedPropertyType('expression')) {
 *   // Add error: expressions not available in Level 1
 * }
 */
export function isAllowedPropertyType(propertyType: string): boolean {
  return LEVEL_1_RULES.property.allowedTypes.includes(propertyType);
}

/**
 * Helper function to check if a component type is valid.
 * 
 * @param componentType - Component type to check
 * @returns true if valid, false if invalid
 * 
 * @example
 * if (!isValidComponentType('CustomComponent')) {
 *   // Add error: invalid component type
 * }
 */
export function isValidComponentType(componentType: string): boolean {
  return LEVEL_1_RULES.component.validTypes.includes(componentType);
}

/**
 * Helper function to validate component ID format.
 * 
 * @param componentId - Component ID to validate
 * @returns true if valid format, false if invalid
 * 
 * @example
 * if (!isValidComponentId('comp_button_001')) {
 *   // Add error: invalid component ID format
 * }
 */
export function isValidComponentId(componentId: string): boolean {
  return LEVEL_1_RULES.component.idPattern.test(componentId);
}

/**
 * Helper function to validate display name format (PascalCase).
 * 
 * NOTE: This is a recommendation, not a hard requirement.
 * Used for generating WARNINGs, not ERRORs.
 * 
 * @param displayName - Display name to validate
 * @returns true if PascalCase, false otherwise
 * 
 * @example
 * if (!isPascalCase('button')) {
 *   // Add warning: recommend PascalCase for display names
 * }
 */
export function isPascalCase(displayName: string): boolean {
  return LEVEL_1_RULES.component.namePattern.test(displayName);
}

// ============================================================
// LEVEL 1.5 VALIDATION RULES
// ============================================================

/**
 * Level 1.5 (Micro Logic Editor) validation rules.
 * 
 * EXTENDS Level 1 with:
 * - onClick events (only onClick, no other events)
 * - Page-level state (string, number, boolean types only)
 * - Logic flows (event, setState, alert, console nodes only)
 * - Static values only (no expressions)
 * 
 * DESIGN PHILOSOPHY:
 * Level 1.5 is a constrained "proof of concept" for the logic system.
 * It demonstrates the vision without the complexity of expressions,
 * multiple event types, or advanced node types.
 * 
 * @see .implementation/phase-4-logic-editor/phase-4-micro-logic-editor.md
 */
export const LEVEL_15_RULES: Level15ValidationRules = {
  /**
   * Root schema structure rules for Level 1.5
   */
  schema: {
    version: '1.0.0',
    level: 1.5,
    requiredFields: ['schemaVersion', 'level', 'metadata', 'components'],
  },
  
  /**
   * Component structure rules (same as Level 1)
   */
  component: {
    requiredFields: ['id', 'displayName', 'type', 'properties'],
    validTypes: ['PrimitiveComponent', 'CompositeComponent'],
    maxDepth: 5,
    maxChildren: 20,
    idPattern: /^comp_[a-zA-Z0-9_]+$/,
    namePattern: /^[A-Z][a-zA-Z0-9]*$/,
  },
  
  /**
   * Property type rules (same as Level 1)
   */
  property: {
    allowedTypes: ['static', 'prop'],
    blockedTypes: ['expression', 'computed', 'state'],
    allowedDataTypes: ['string', 'number', 'boolean', 'object', 'array'],
  },
  
  /**
   * State variable rules for Level 1.5
   * 
   * CONSTRAINTS:
   * - Only primitive types (string, number, boolean)
   * - Variable names must be valid JavaScript identifiers
   * - Reasonable limit on total variables
   */
  stateVariable: {
    // Only primitive types in Level 1.5
    // Level 2 will add: object, array
    allowedTypes: ['string', 'number', 'boolean'],
    
    // Valid JavaScript identifier pattern
    // Must start with letter, can contain letters, numbers, underscores
    namePattern: /^[a-zA-Z][a-zA-Z0-9_]*$/,
    
    // Reasonable limit for demo purposes
    // Prevents overly complex state that's hard to manage
    maxVariables: 20,
  },
  
  /**
   * Flow rules for Level 1.5
   * 
   * CONSTRAINTS:
   * - Only onClick events (Level 2 adds more)
   * - Only 4 node types: event, setState, alert, console
   * - Reasonable limits on complexity
   */
  flow: {
    // Level 1.5: Only onClick events
    // Level 2 will add: onChange, onSubmit, onMount, etc.
    allowedEventTypes: ['onClick'],
    
    // Level 1.5: Limited node types
    // - event: Auto-generated trigger (required, exactly 1 per flow)
    // - setState: Update a state variable
    // - alert: Show browser alert (for debugging/demo)
    // - console: Log to console (for debugging/demo)
    // Level 2 will add: condition, loop, apiCall, navigate, etc.
    allowedNodeTypes: ['event', 'setState', 'alert', 'console'],
    
    // Reasonable complexity limits
    maxNodesPerFlow: 20,
    maxFlows: 50,
    
    // Flow ID pattern (similar to component ID)
    idPattern: /^flow_[a-zA-Z0-9_]+$/,
  },
  
  /**
   * Value rules for Level 1.5
   * 
   * CONSTRAINTS:
   * - Only static values (no expressions)
   * - This is the key limitation of Level 1.5
   */
  value: {
    // Level 1.5: Only static values
    allowedTypes: ['static'],
    
    // Level 1.5: Expressions are NOT allowed
    // This avoids needing the security sandbox
    blockedTypes: ['expression'],
  },
  
  /**
   * Blocked features in Level 1.5
   * Same as Level 1 plus expression-related features
   */
  blockedFeatures: [
    // Level 2 features
    'localState',
    'globalState',
    'eventHandlers', // Use events.onClick instead
    'expressions',
    'globalFunctions',
    'computedProperties',
    
    // Level 3 features
    'dataConnections',
    'routes',
    'api',
    'database',
    'codeReview',
    'performance',
    'testing',
    'analytics',
  ],
};

/**
 * Error codes for Level 1.5 validation.
 * Extends Level 1 error codes with logic-specific codes.
 */
export const LEVEL_15_ERROR_CODES = {
  // Include all Level 1 error codes
  ...ERROR_CODES,
  
  // ============================================================
  // STATE VARIABLE ERRORS
  // ============================================================
  
  /** State variable name is invalid (doesn't match pattern) */
  INVALID_STATE_VAR_NAME: 'INVALID_STATE_VAR_NAME',
  
  /** State variable type is not allowed (e.g., object, array) */
  INVALID_STATE_VAR_TYPE: 'INVALID_STATE_VAR_TYPE',
  
  /** State variable initialValue doesn't match declared type */
  STATE_TYPE_MISMATCH: 'STATE_TYPE_MISMATCH',
  
  /** Too many state variables defined */
  TOO_MANY_STATE_VARIABLES: 'TOO_MANY_STATE_VARIABLES',
  
  /** State variable referenced but not defined */
  UNDEFINED_STATE_VARIABLE: 'UNDEFINED_STATE_VARIABLE',
  
  // ============================================================
  // FLOW ERRORS
  // ============================================================
  
  /** Flow ID is invalid (doesn't match pattern) */
  INVALID_FLOW_ID: 'INVALID_FLOW_ID',
  
  /** Flow ID doesn't match the key in flows object */
  FLOW_ID_MISMATCH: 'FLOW_ID_MISMATCH',
  
  /** Flow references a component that doesn't exist */
  INVALID_TRIGGER_COMPONENT: 'INVALID_TRIGGER_COMPONENT',
  
  /** Flow is missing required trigger definition */
  MISSING_FLOW_TRIGGER: 'MISSING_FLOW_TRIGGER',
  
  /** Flow has too many nodes */
  TOO_MANY_FLOW_NODES: 'TOO_MANY_FLOW_NODES',
  
  /** Too many flows defined */
  TOO_MANY_FLOWS: 'TOO_MANY_FLOWS',
  
  // ============================================================
  // NODE ERRORS
  // ============================================================
  
  /** Node ID is duplicated within a flow */
  DUPLICATE_NODE_ID: 'DUPLICATE_NODE_ID',
  
  /** Node type is not supported in Level 1.5 */
  UNSUPPORTED_NODE_TYPE: 'UNSUPPORTED_NODE_TYPE',
  
  /** SetState node references undefined state variable */
  INVALID_STATE_REFERENCE: 'INVALID_STATE_REFERENCE',
  
  /** Node is missing required configuration */
  MISSING_NODE_CONFIG: 'MISSING_NODE_CONFIG',
  
  /** Node position is invalid (not a valid { x, y } object) */
  INVALID_NODE_POSITION: 'INVALID_NODE_POSITION',
  
  // ============================================================
  // EDGE ERRORS
  // ============================================================
  
  /** Edge source node doesn't exist */
  INVALID_EDGE_SOURCE: 'INVALID_EDGE_SOURCE',
  
  /** Edge target node doesn't exist */
  INVALID_EDGE_TARGET: 'INVALID_EDGE_TARGET',
  
  /** Edge creates a cycle (not allowed in Level 1.5) */
  EDGE_CREATES_CYCLE: 'EDGE_CREATES_CYCLE',
  
  /** Edge ID is duplicated */
  DUPLICATE_EDGE_ID: 'DUPLICATE_EDGE_ID',
  
  // ============================================================
  // EVENT ERRORS
  // ============================================================
  
  /** Event type is not supported in Level 1.5 (only onClick) */
  UNSUPPORTED_EVENT_TYPE: 'UNSUPPORTED_EVENT_TYPE',
  
  /** Component event references a flow that doesn't exist */
  INVALID_FLOW_REFERENCE: 'INVALID_FLOW_REFERENCE',
  
  // ============================================================
  // VALUE ERRORS
  // ============================================================
  
  /** Expression values are not supported in Level 1.5 */
  EXPRESSIONS_NOT_SUPPORTED: 'EXPRESSIONS_NOT_SUPPORTED',
  
  /** Value type is invalid for the context */
  INVALID_VALUE_TYPE: 'INVALID_VALUE_TYPE',
  
  /** Static value doesn't match expected type */
  VALUE_TYPE_MISMATCH: 'VALUE_TYPE_MISMATCH',
} as const;

/**
 * Documentation URLs for Level 1.5 error messages.
 */
export const LEVEL_15_DOCS_URLS = {
  ...DOCS_URLS,
  
  // Level 1.5 specific documentation
  LOGIC_SYSTEM: 'docs/LOGIC_SYSTEM.md',
  PAGE_STATE: 'docs/LOGIC_SYSTEM.md#page-state',
  FLOWS: 'docs/LOGIC_SYSTEM.md#flows',
  LEVEL_15_GUIDE: '.implementation/phase-4-logic-editor/phase-4-micro-logic-editor.md',
} as const;

// ============================================================
// LEVEL 1.5 HELPER FUNCTIONS
// ============================================================

/**
 * Check if an event type is allowed in Level 1.5.
 * 
 * @param eventType - Event type to check
 * @returns true if allowed (only onClick in Level 1.5)
 */
export function isAllowedEventType(eventType: string): boolean {
  return LEVEL_15_RULES.flow.allowedEventTypes.includes(eventType);
}

/**
 * Check if a node type is allowed in Level 1.5.
 * 
 * @param nodeType - Node type to check
 * @returns true if allowed (event, setState, alert, console)
 */
export function isAllowedNodeType(nodeType: string): boolean {
  return LEVEL_15_RULES.flow.allowedNodeTypes.includes(nodeType);
}

/**
 * Check if a state variable type is allowed in Level 1.5.
 * 
 * @param type - Type to check
 * @returns true if allowed (string, number, boolean)
 */
export function isAllowedStateType(type: string): boolean {
  return LEVEL_15_RULES.stateVariable.allowedTypes.includes(type);
}

/**
 * Check if a value type is allowed in Level 1.5.
 * 
 * @param valueType - Value type to check
 * @returns true if allowed (only static)
 */
export function isAllowedValueType(valueType: string): boolean {
  return LEVEL_15_RULES.value.allowedTypes.includes(valueType);
}

/**
 * Check if a state variable name is valid.
 * 
 * @param name - Variable name to check
 * @returns true if valid JavaScript identifier
 */
export function isValidStateVariableName(name: string): boolean {
  return LEVEL_15_RULES.stateVariable.namePattern.test(name);
}

/**
 * Check if a flow ID is valid.
 * 
 * @param flowId - Flow ID to check
 * @returns true if valid format
 */
export function isValidFlowId(flowId: string): boolean {
  return LEVEL_15_RULES.flow.idPattern.test(flowId);
}

/**
 * Check if the manifest level is Level 1.5 or higher.
 * 
 * @param level - Schema level to check
 * @returns true if Level 1.5+
 */
export function isLevel15OrHigher(level: number): boolean {
  return level >= 1.5;
}

/**
 * Get the appropriate validation rules for a schema level.
 * 
 * @param level - Schema level
 * @returns Validation rules for that level
 */
export function getRulesForLevel(level: number): ValidationRules | Level15ValidationRules {
  if (level >= 1.5) {
    return LEVEL_15_RULES;
  }
  return LEVEL_1_RULES;
}
