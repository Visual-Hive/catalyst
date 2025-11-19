/**
 * @file SchemaValidator.ts
 * @description Main schema validator for Level 1 (MVP) manifests - the gatekeeper
 * 
 * @architecture Phase 0, Task 0.3 - Schema Level 1 Validator
 * @created 2025-11-19
 * @author AI (Cline) + Human Review
 * @confidence 9/10 - Clear requirements, comprehensive testing planned
 * 
 * @see docs/SCHEMA_LEVELS.md - Level 1 specification
 * @see docs/COMPONENT_SCHEMA.md - Complete schema reference
 * @see .implementation/phase-0-foundation/task-0.3-schema-validator.md
 * 
 * @security-critical false
 * @performance-critical true - Runs before every code generation
 */

import {
  ValidationResult,
  ValidationError,
  ComponentManifest,
  Component,
  ComponentProperty,
} from './types';
import {
  LEVEL_1_RULES,
  ERROR_CODES,
  DOCS_URLS,
  isAllowedPropertyType,
  isValidComponentType,
  isValidComponentId,
  isPascalCase,
  isBlockedFeature,
} from './ValidationRules';
import { CircularReferenceDetector } from './CircularReferenceDetector';

/**
 * Validates Level 1 (MVP) manifests against schema rules.
 * 
 * PROBLEM SOLVED:
 * Without validation, invalid manifests cause:
 * - Code generation failures (cryptic errors)
 * - Runtime errors in generated code
 * - Inconsistent UI behavior
 * - User confusion about supported features
 * 
 * SOLUTION:
 * Act as a "gatekeeper" that validates manifests before code generation:
 * 1. Check schema structure (version, level, required fields)
 * 2. Validate each component (structure, properties, limits)
 * 3. Check component relationships (circular refs, depth)
 * 4. Block Level 2/3 features with helpful messages
 * 
 * VALIDATION FLOW:
 * ```
 * validate(manifest)
 *   ↓
 *   1. validateSchemaStructure()  - Root fields, version, level
 *   ↓
 *   2. validateMetadata()         - Project info, framework
 *   ↓
 *   3. validateComponent() [×N]   - For each component
 *   ↓
 *   4. validateComponentRelationships() - Circular refs, depth
 *   ↓
 *   5. checkBlockedFeatures()     - Level 2/3 features
 *   ↓
 *   ValidationResult
 * ```
 * 
 * USAGE EXAMPLE:
 * ```typescript
 * const validator = new SchemaValidator();
 * const result = validator.validate(manifest);
 * 
 * if (!result.isValid) {
 *   console.error('Validation failed:', result.errors);
 *   return; // Don't generate code
 * }
 * 
 * if (result.warnings.length > 0) {
 *   console.warn('Validation warnings:', result.warnings);
 *   // Can still generate code
 * }
 * 
 * // Safe to generate code
 * generateCode(manifest);
 * ```
 * 
 * DESIGN DECISIONS:
 * - Collect ALL errors, don't stop at first (better UX)
 * - Separate errors (block) from warnings (don't block)
 * - Rich error context (path, suggestion, docs link)
 * - Performance target: <100ms for 100 components
 * 
 * EDGE CASES HANDLED:
 * - Empty manifest (missing components)
 * - Malformed JSON (checked before this validator)
 * - Missing component references
 * - Circular dependencies
 * - Excessive nesting depth
 * 
 * FUTURE IMPROVEMENTS:
 * - Level 2 validator (extends this class)
 * - Caching for repeated validations
 * - Partial validation (single component)
 * 
 * @class SchemaValidator
 */
export class SchemaValidator {
  private readonly rules = LEVEL_1_RULES;
  
  /**
   * Validate complete manifest against Level 1 schema rules.
   * 
   * This is the main entry point for validation.
   * Orchestrates all validation checks and collects errors/warnings.
   * 
   * TIMING: Must complete in <100ms for 100 components (performance-critical)
   * 
   * @param manifest - The manifest object to validate (any type to handle malformed input)
   * @returns ValidationResult with isValid flag, errors, and warnings
   * 
   * @throws Never throws - always returns ValidationResult (even for completely invalid input)
   * 
   * @example
   * const validator = new SchemaValidator();
   * const result = validator.validate(manifest);
   * if (!result.isValid) {
   *   throw new Error('Invalid manifest');
   * }
   * 
   * @performance Target: <100ms for 100 components, <1s for 1000 components
   * @sideEffects None - pure validation, no state changes
   */
  validate(manifest: any): ValidationResult {
    // Start performance timer
    const startTime = Date.now();
    
    // Collect all errors and warnings
    const allErrors: ValidationError[] = [];
    
    // 1. SCHEMA STRUCTURE VALIDATION
    // Check root-level fields, version, level
    allErrors.push(...this.validateSchemaStructure(manifest));
    
    // If critical structure missing, can't continue validation
    // (Need components object to validate further)
    if (!manifest || typeof manifest !== 'object') {
      return this.buildResult(allErrors, 0, Date.now() - startTime);
    }
    
    // 2. METADATA VALIDATION
    // Check project info, framework specified
    if (manifest.metadata) {
      allErrors.push(...this.validateMetadata(manifest.metadata));
    }
    
    // 3. COMPONENT VALIDATION
    // Validate each component's structure and properties
    const componentCount = manifest.components
      ? Object.keys(manifest.components).length
      : 0;
    
    if (manifest.components && typeof manifest.components === 'object') {
      // Validate each component individually
      for (const [componentId, component] of Object.entries(manifest.components)) {
        allErrors.push(...this.validateComponent(componentId, component as any, manifest));
      }
      
      // 4. COMPONENT RELATIONSHIPS
      // Check circular references, depth limits, missing references
      allErrors.push(...this.validateComponentRelationships(manifest.components));
    }
    
    // 5. BLOCKED FEATURES CHECK
    // Ensure no Level 2/3 features are present
    allErrors.push(...this.checkBlockedFeatures(manifest));
    
    // Build final result
    const validationTime = Date.now() - startTime;
    return this.buildResult(allErrors, componentCount, validationTime);
  }
  
  /**
   * Validate root-level schema structure.
   * 
   * CHECKS:
   * - Required fields present (schemaVersion, level, metadata, components)
   * - Schema version matches expected (1.0.0)
   * - Schema level is 1 (MVP)
   * - Fields have correct types
   * 
   * WHY THIS MATTERS:
   * Without proper schema structure, we can't safely process the manifest.
   * These are fundamental requirements.
   * 
   * @param manifest - Manifest to validate (any type to handle malformed)
   * @returns Array of validation errors (empty if valid)
   */
  private validateSchemaStructure(manifest: any): ValidationError[] {
    const errors: ValidationError[] = [];
    
    // Check manifest is an object
    if (!manifest || typeof manifest !== 'object') {
      errors.push({
        field: 'manifest',
        message: 'Manifest must be a valid object',
        severity: 'ERROR',
        path: 'manifest',
        code: ERROR_CODES.INVALID_SCHEMA_VERSION,
        suggestion: 'Ensure manifest is valid JSON object',
        documentation: DOCS_URLS.COMPONENT_SCHEMA,
      });
      
      return errors; // Can't continue without valid object
    }
    
    // Check required fields
    for (const field of this.rules.schema.requiredFields) {
      if (!(field in manifest)) {
        errors.push({
          field,
          message: `Required field '${field}' is missing`,
          severity: 'ERROR',
          path: field,
          code: ERROR_CODES.MISSING_REQUIRED_FIELD,
          suggestion: `Add '${field}' field to manifest root`,
          documentation: DOCS_URLS.COMPONENT_SCHEMA,
        });
      }
    }
    
    // Validate schema version
    if (manifest.schemaVersion !== this.rules.schema.version) {
      errors.push({
        field: 'schemaVersion',
        message: `Invalid schema version '${manifest.schemaVersion}'. Expected '${this.rules.schema.version}'`,
        severity: 'ERROR',
        path: 'schemaVersion',
        code: ERROR_CODES.INVALID_SCHEMA_VERSION,
        suggestion: `Set schemaVersion to '${this.rules.schema.version}'`,
        documentation: DOCS_URLS.SCHEMA_LEVELS,
      });
    }
    
    // Validate schema level
    if (manifest.level !== this.rules.schema.level) {
      errors.push({
        field: 'level',
        message: `Invalid schema level ${manifest.level}. Expected ${this.rules.schema.level} for Level 1 validator`,
        severity: 'ERROR',
        path: 'level',
        code: ERROR_CODES.INVALID_SCHEMA_LEVEL,
        suggestion: `Set level to ${this.rules.schema.level} for MVP features only`,
        documentation: DOCS_URLS.LEVEL_1_GUIDE,
      });
    }
    
    // Validate components is an object
    if (manifest.components && typeof manifest.components !== 'object') {
      errors.push({
        field: 'components',
        message: 'Components must be an object',
        severity: 'ERROR',
        path: 'components',
        code: ERROR_CODES.MISSING_REQUIRED_FIELD,
        suggestion: 'Use object format: { "comp_id": { ... } }',
        documentation: DOCS_URLS.COMPONENT_SCHEMA,
      });
    }
    
    return errors;
  }
  
  /**
   * Validate manifest metadata.
   * 
   * CHECKS:
   * - Project name specified
   * - Framework specified (react, vue, svelte)
   * - Timestamps valid (if present)
   * 
   * @param metadata - Metadata object to validate
   * @returns Array of validation errors
   */
  private validateMetadata(metadata: any): ValidationError[] {
    const errors: ValidationError[] = [];
    
    // Check metadata is object
    if (!metadata || typeof metadata !== 'object') {
      errors.push({
        field: 'metadata',
        message: 'Metadata must be an object',
        severity: 'ERROR',
        path: 'metadata',
        code: ERROR_CODES.MISSING_REQUIRED_FIELD,
        suggestion: 'Add metadata object with projectName and framework',
        documentation: DOCS_URLS.COMPONENT_SCHEMA,
      });
      
      return errors;
    }
    
    // Check required metadata fields
    if (!metadata.projectName || typeof metadata.projectName !== 'string') {
      errors.push({
        field: 'projectName',
        message: 'Project name is required in metadata',
        severity: 'ERROR',
        path: 'metadata.projectName',
        code: ERROR_CODES.MISSING_REQUIRED_FIELD,
        suggestion: 'Add metadata.projectName field with project name',
      });
    }
    
    if (!metadata.framework || typeof metadata.framework !== 'string') {
      errors.push({
        field: 'framework',
        message: 'Framework is required in metadata',
        severity: 'ERROR',
        path: 'metadata.framework',
        code: ERROR_CODES.MISSING_REQUIRED_FIELD,
        suggestion: 'Add metadata.framework field (e.g., "react")',
      });
    }
    
    // Validate framework is supported (Level 1 = react only)
    if (metadata.framework && metadata.framework !== 'react') {
      errors.push({
        field: 'framework',
        message: `Framework '${metadata.framework}' not supported in Level 1. Only 'react' is available in MVP.`,
        severity: 'ERROR',
        path: 'metadata.framework',
        code: ERROR_CODES.UNSUPPORTED_FEATURE,
        suggestion: 'Use "react" for Level 1. Vue and Svelte support coming in Level 2.',
        documentation: DOCS_URLS.LEVEL_1_GUIDE,
      });
    }
    
    return errors;
  }
  
  /**
   * Validate single component structure and properties.
   * 
   * CHECKS:
   * - Required fields (id, displayName, type, properties)
   * - ID format matches pattern
   * - Display name follows conventions (warning only)
   * - Component type is valid
   * - Properties are valid Level 1 types
   * - Children count within limits
   * 
   * @param componentId - Component ID from manifest key
   * @param component - Component object to validate
   * @param manifest - Full manifest (for context)
   * @returns Array of validation errors
   */
  private validateComponent(
    componentId: string,
    component: any,
    manifest: any
  ): ValidationError[] {
    const errors: ValidationError[] = [];
    
    // Check component is object
    if (!component || typeof component !== 'object') {
      errors.push({
        field: componentId,
        message: `Component '${componentId}' must be an object`,
        severity: 'ERROR',
        path: `components.${componentId}`,
        componentId,
        code: ERROR_CODES.MISSING_COMPONENT_FIELD,
      });
      
      return errors; // Can't validate further
    }
    
    // REQUIRED FIELDS CHECK
    for (const field of this.rules.component.requiredFields) {
      if (!(field in component)) {
        errors.push({
          field,
          message: `Component '${componentId}' missing required field '${field}'`,
          severity: 'ERROR',
          path: `components.${componentId}.${field}`,
          componentId,
          componentName: component.displayName,
          code: ERROR_CODES.MISSING_COMPONENT_FIELD,
          suggestion: `Add '${field}' field to component`,
        });
      }
    }
    
    // ID VALIDATION
    // Check ID matches key
    if (component.id && component.id !== componentId) {
      errors.push({
        field: 'id',
        message: `Component ID '${component.id}' doesn't match key '${componentId}'`,
        severity: 'ERROR',
        path: `components.${componentId}.id`,
        componentId,
        componentName: component.displayName,
        code: ERROR_CODES.INVALID_COMPONENT_ID,
        suggestion: `Change id to '${componentId}' or change object key to '${component.id}'`,
      });
    }
    
    // Check ID format
    if (component.id && !isValidComponentId(component.id)) {
      errors.push({
        field: 'id',
        message: `Component ID '${component.id}' doesn't match required pattern: comp_[alphanumeric_underscore]`,
        severity: 'ERROR',
        path: `components.${componentId}.id`,
        componentId,
        componentName: component.displayName,
        code: ERROR_CODES.INVALID_COMPONENT_ID,
        suggestion: 'Use format: comp_button_001, comp_user_card, etc.',
        documentation: DOCS_URLS.COMPONENT_SCHEMA,
      });
    }
    
    // DISPLAY NAME VALIDATION
    // Check PascalCase (warning only)
    if (component.displayName && !isPascalCase(component.displayName)) {
      errors.push({
        field: 'displayName',
        message: `Display name '${component.displayName}' should use PascalCase`,
        severity: 'WARNING',
        path: `components.${componentId}.displayName`,
        componentId,
        componentName: component.displayName,
        code: ERROR_CODES.INVALID_DISPLAY_NAME,
        suggestion: 'Use PascalCase: Button, UserCard, NavigationBar',
      });
    }
    
    // TYPE VALIDATION
    if (component.type && !isValidComponentType(component.type)) {
      errors.push({
        field: 'type',
        message: `Invalid component type '${component.type}'. Must be one of: ${this.rules.component.validTypes.join(', ')}`,
        severity: 'ERROR',
        path: `components.${componentId}.type`,
        componentId,
        componentName: component.displayName,
        code: ERROR_CODES.INVALID_COMPONENT_TYPE,
        suggestion: `Use 'PrimitiveComponent' or 'CompositeComponent'`,
      });
    }
    
    // PROPERTIES VALIDATION
    if (component.properties) {
      errors.push(...this.validateProperties(componentId, component.properties, component.displayName));
    }
    
    // CHILDREN COUNT VALIDATION
    if (component.children && Array.isArray(component.children)) {
      if (component.children.length > this.rules.component.maxChildren) {
        errors.push({
          field: 'children',
          message: `Component has ${component.children.length} children, exceeds maximum of ${this.rules.component.maxChildren}`,
          severity: 'ERROR',
          path: `components.${componentId}.children`,
          componentId,
          componentName: component.displayName,
          code: ERROR_CODES.TOO_MANY_CHILDREN,
          suggestion: 'Split into smaller components or use different layout strategy',
          documentation: DOCS_URLS.LEVEL_1_GUIDE,
        });
      }
    }
    
    return errors;
  }
  
  /**
   * Validate component properties.
   * 
   * CHECKS:
   * - Property type is allowed in Level 1 (static, prop only)
   * - Static properties have values
   * - Prop properties have dataType
   * - Data types are valid
   * - No expression/computed/state properties (Level 2)
   * 
   * @param componentId - Component ID for error messages
   * @param properties - Properties object to validate
   * @param componentName - Component display name for error messages
   * @returns Array of validation errors
   */
  private validateProperties(
    componentId: string,
    properties: any,
    componentName?: string
  ): ValidationError[] {
    const errors: ValidationError[] = [];
    
    // Check properties is object
    if (typeof properties !== 'object' || properties === null) {
      errors.push({
        field: 'properties',
        message: 'Properties must be an object',
        severity: 'ERROR',
        path: `components.${componentId}.properties`,
        componentId,
        componentName,
        code: ERROR_CODES.MISSING_COMPONENT_FIELD,
      });
      
      return errors;
    }
    
    // Validate each property
    for (const [propName, prop] of Object.entries(properties)) {
      const propTyped = prop as ComponentProperty;
      
      // Check property type exists
      if (!propTyped.type) {
        errors.push({
          field: 'type',
          message: `Property '${propName}' missing type`,
          severity: 'ERROR',
          path: `components.${componentId}.properties.${propName}.type`,
          componentId,
          componentName,
          code: ERROR_CODES.UNSUPPORTED_PROPERTY_TYPE,
          suggestion: 'Add type field: "static" or "prop"',
        });
        
        continue;
      }
      
      // Check if property type is allowed in Level 1
      if (!isAllowedPropertyType(propTyped.type)) {
        // Determine which level this feature belongs to
        const featureLevel = ['expression', 'computed', 'state'].includes(propTyped.type)
          ? 'Level 2 (Post-MVP, Weeks 13-24)'
          : 'future level';
        
        errors.push({
          field: 'type',
          message: `Property type '${propTyped.type}' not supported in Level 1`,
          severity: 'ERROR',
          path: `components.${componentId}.properties.${propName}.type`,
          componentId,
          componentName,
          code: ERROR_CODES.UNSUPPORTED_PROPERTY_TYPE,
          suggestion: `Use 'static' or 'prop' for MVP. '${propTyped.type}' available in ${featureLevel}.`,
          documentation: DOCS_URLS.LEVEL_2_GUIDE,
        });
        
        continue;
      }
      
      // STATIC PROPERTY VALIDATION
      // Must have value field
      if (propTyped.type === 'static' && propTyped.value === undefined) {
        errors.push({
          field: 'value',
          message: `Static property '${propName}' must have a value`,
          severity: 'ERROR',
          path: `components.${componentId}.properties.${propName}.value`,
          componentId,
          componentName,
          code: ERROR_CODES.MISSING_PROPERTY_VALUE,
          suggestion: 'Add value field with the static value',
        });
      }
      
      // PROP PROPERTY VALIDATION
      // Must have dataType field
      if (propTyped.type === 'prop' && !propTyped.dataType) {
        errors.push({
          field: 'dataType',
          message: `Prop '${propName}' must specify dataType`,
          severity: 'ERROR',
          path: `components.${componentId}.properties.${propName}.dataType`,
          componentId,
          componentName,
          code: ERROR_CODES.MISSING_PROPERTY_DATATYPE,
          suggestion: `Add dataType field: ${this.rules.property.allowedDataTypes.join(', ')}`,
        });
      }
      
      // Validate dataType if present
      if (propTyped.dataType && !this.rules.property.allowedDataTypes.includes(propTyped.dataType)) {
        errors.push({
          field: 'dataType',
          message: `Invalid dataType '${propTyped.dataType}' for property '${propName}'`,
          severity: 'ERROR',
          path: `components.${componentId}.properties.${propName}.dataType`,
          componentId,
          componentName,
          code: ERROR_CODES.INVALID_PROPERTY_DATATYPE,
          suggestion: `Use one of: ${this.rules.property.allowedDataTypes.join(', ')}`,
        });
      }
    }
    
    return errors;
  }
  
  /**
   * Validate component relationships (circular refs, depth, missing refs).
   * 
   * Uses CircularReferenceDetector to perform DFS-based validation.
   * 
   * @param components - Components object from manifest
   * @returns Array of validation errors
   */
  private validateComponentRelationships(components: Record<string, Component>): ValidationError[] {
    // Use CircularReferenceDetector for graph validation
    const detector = new CircularReferenceDetector(components);
    
    // Detect circular references and depth violations
    const errors = detector.detect();
    
    // Also check for missing references
    errors.push(...detector.validateReferences());
    
    return errors;
  }
  
  /**
   * Check for blocked Level 2/3 features.
   * 
   * BLOCKS:
   * - Level 2: localState, globalState, eventHandlers, expressions, etc.
   * - Level 3: dataConnections, routes, api, database, etc.
   * 
   * Provides helpful messages about when features will be available.
   * 
   * @param manifest - Full manifest to check
   * @returns Array of validation errors
   */
  private checkBlockedFeatures(manifest: any): ValidationError[] {
    const errors: ValidationError[] = [];
    
    // Check for blocked root-level features
    for (const feature of this.rules.blockedFeatures) {
      if (manifest[feature]) {
        // Determine feature level for helpful message
        const level2Features = ['localState', 'globalState', 'eventHandlers', 'expressions', 'globalFunctions', 'computedProperties'];
        const isLevel2 = level2Features.includes(feature);
        
        errors.push({
          field: feature,
          message: `Feature '${feature}' not available in Level 1 (MVP)`,
          severity: 'ERROR',
          path: feature,
          code: isLevel2 ? ERROR_CODES.LEVEL_2_FEATURE : ERROR_CODES.LEVEL_3_FEATURE,
          suggestion: isLevel2
            ? `'${feature}' available in Level 2 (Post-MVP, Weeks 13-24). Use static values for MVP.`
            : `'${feature}' available in Level 3 (Week 25+). Plan for future enhancement.`,
          documentation: isLevel2 ? DOCS_URLS.LEVEL_2_GUIDE : DOCS_URLS.LEVEL_3_GUIDE,
        });
      }
    }
    
    // Check for blocked component-level features
    if (manifest.components && typeof manifest.components === 'object') {
      for (const [componentId, component] of Object.entries(manifest.components)) {
        const comp = component as Component;
        
        // Check for event handlers
        if (comp.eventHandlers) {
          errors.push({
            field: 'eventHandlers',
            message: 'Event handlers not available in Level 1 (MVP)',
            severity: 'ERROR',
            path: `components.${componentId}.eventHandlers`,
            componentId,
            componentName: comp.displayName,
            code: ERROR_CODES.LEVEL_2_FEATURE,
            suggestion: 'Event handlers (onClick, onChange, etc.) available in Level 2. Use static components for MVP.',
            documentation: DOCS_URLS.LEVEL_2_GUIDE,
          });
        }
        
        // Check for local state
        if (comp.localState) {
          errors.push({
            field: 'localState',
            message: 'Local state not available in Level 1 (MVP)',
            severity: 'ERROR',
            path: `components.${componentId}.localState`,
            componentId,
            componentName: comp.displayName,
            code: ERROR_CODES.LEVEL_2_FEATURE,
            suggestion: 'State management available in Level 2. Use props for MVP.',
            documentation: DOCS_URLS.LEVEL_2_GUIDE,
          });
        }
        
        // Check for data connections (Level 3)
        if (comp.dataConnections) {
          errors.push({
            field: 'dataConnections',
            message: 'Data connections not available in Level 1 (MVP)',
            severity: 'ERROR',
            path: `components.${componentId}.dataConnections`,
            componentId,
            componentName: comp.displayName,
            code: ERROR_CODES.LEVEL_3_FEATURE,
            suggestion: 'Database/API connections available in Level 3. Use static data for MVP.',
            documentation: DOCS_URLS.LEVEL_3_GUIDE,
          });
        }
      }
    }
    
    return errors;
  }
  
  /**
   * Build final validation result from collected errors.
   * 
   * SEPARATES:
   * - ERROR severity: Blocks code generation (isValid = false)
   * - WARNING severity: Doesn't block, but user should fix
   * - INFO severity: Informational only
   * 
   * @param allErrors - All collected validation errors and warnings
   * @param componentCount - Number of components validated
   * @param validationTime - Time taken to validate (ms)
   * @returns ValidationResult object
   */
  private buildResult(
    allErrors: ValidationError[],
    componentCount: number,
    validationTime: number
  ): ValidationResult {
    // Separate errors by severity
    const errors = allErrors.filter(e => e.severity === 'ERROR');
    const warnings = allErrors.filter(e => e.severity === 'WARNING');
    
    // Validation passes if no ERROR-level issues
    const isValid = errors.length === 0;
    
    return {
      isValid,
      errors,
      warnings,
      level: this.rules.schema.level,
      componentCount,
      validationTime,
    };
  }
}
