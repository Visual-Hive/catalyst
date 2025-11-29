/**
 * @file index.ts
 * @description Validation module exports - Level 1 (MVP) and Level 1.5 (Logic Editor) schema validation
 * 
 * @architecture Phase 0, Task 0.3 - Schema Level 1 Validator
 * @architecture Phase 4, Task 4.0 - Logic System Foundation (Level 1.5)
 * @created 2025-11-19
 * @updated 2025-11-29
 * @author AI (Cline) + Human Review
 * 
 * @see docs/SCHEMA_LEVELS.md - Level 1 specification
 * @see .implementation/phase-0-foundation/task-0.3-schema-validator.md
 * @see .implementation/phase-4-logic-editor/task-4.0-logic-system-foundation.md
 */

// Main validators
export { SchemaValidator } from './SchemaValidator';
export { Level15SchemaValidator } from './Level15SchemaValidator';

// Circular reference detection
export { CircularReferenceDetector } from './CircularReferenceDetector';

// Level 1 Validation rules and helpers
export {
  LEVEL_1_RULES,
  ERROR_CODES,
  DOCS_URLS,
  isBlockedFeature,
  isAllowedPropertyType,
  isValidComponentType,
  isValidComponentId,
  isPascalCase,
} from './ValidationRules';

// Level 1.5 Validation rules and helpers
export {
  LEVEL_15_RULES,
  LEVEL_15_ERROR_CODES,
  LEVEL_15_DOCS_URLS,
  isAllowedEventType,
  isAllowedNodeType,
  isAllowedStateType,
  isAllowedValueType,
  isValidStateVariableName,
  isValidFlowId,
  isLevel15OrHigher,
  getRulesForLevel,
} from './ValidationRules';

// Types
export type {
  ValidationResult,
  ValidationError,
  ValidationSeverity,
  ValidationRules,
  Level15ValidationRules,
  FlowValidationError,
  StateValidationError,
  ComponentManifest,
  Component,
  ComponentProperty,
  ComponentStyling,
  ComponentMetadata,
  ManifestMetadata,
} from './types';
