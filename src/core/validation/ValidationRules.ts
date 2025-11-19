/**
 * @file ValidationRules.ts
 * @description Level 1 (MVP) schema validation rules and constraints
 * 
 * @architecture Phase 0, Task 0.3 - Schema Level 1 Validator
 * @created 2025-11-19
 * @author AI (Cline) + Human Review
 * @confidence 9/10 - Rules well-defined in SCHEMA_LEVELS.md
 * 
 * @see docs/SCHEMA_LEVELS.md - Level 1 specification
 * @see docs/COMPONENT_SCHEMA.md - Complete schema reference
 * @see .implementation/phase-0-foundation/task-0.3-schema-validator.md
 * 
 * @security-critical false
 * @performance-critical false
 */

import { ValidationRules } from './types';

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
