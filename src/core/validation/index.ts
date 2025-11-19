/**
 * @file index.ts
 * @description Validation module exports - Level 1 (MVP) schema validation
 * 
 * @architecture Phase 0, Task 0.3 - Schema Level 1 Validator
 * @created 2025-11-19
 * @author AI (Cline) + Human Review
 * 
 * @see docs/SCHEMA_LEVELS.md - Level 1 specification
 * @see .implementation/phase-0-foundation/task-0.3-schema-validator.md
 */

// Main validator
export { SchemaValidator } from './SchemaValidator';

// Circular reference detection
export { CircularReferenceDetector } from './CircularReferenceDetector';

// Validation rules and helpers
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

// Types
export type {
  ValidationResult,
  ValidationError,
  ValidationSeverity,
  ValidationRules,
  ComponentManifest,
  Component,
  ComponentProperty,
  ComponentStyling,
  ComponentMetadata,
  ManifestMetadata,
} from './types';
