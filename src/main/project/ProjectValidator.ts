/**
 * @file ProjectValidator.ts
 * @description Security-critical validation for all project operations
 * 
 * SECURITY CRITICAL: This class is the primary defense against:
 * - Path traversal attacks (../../etc/passwd)
 * - Writing to system directories
 * - Invalid project names
 * - Malformed manifest.json files
 * - Level 2+ features in Level 1 projects
 * 
 * ALL project operations MUST validate through this class before
 * performing any file system operations.
 * 
 * @architecture Phase 1, Task 1.3A - Core Project Creation
 * @created 2025-11-19
 * @author AI (Cline) + Human Review
 * @confidence 8/10 - Comprehensive validation, needs security review
 * 
 * @see .implementation/phase-1-application-shell/task-1.3A-core-project-creation.md
 * @see docs/SECURITY_SPEC.md - File system security requirements
 * @see docs/COMPONENT_SCHEMA.md - Level 1 manifest validation
 * 
 * @security-critical true - PRIMARY SECURITY BOUNDARY
 * @performance-critical false - Validation is fast, happens infrequently
 */

import * as path from 'path';
import * as fs from 'fs/promises';
import { homedir } from 'os';
import {
  ValidationResult,
  ValidationError,
  ValidationErrorCode,
  ValidationWarning,
} from './types';

/**
 * ProjectValidator - Security-critical validation for project operations
 * 
 * PROBLEM SOLVED:
 * Without validation, malicious or accidental user input could:
 * - Write files outside intended directories (path traversal)
 * - Overwrite system files
 * - Create projects with invalid names
 * - Corrupt manifest.json with Level 2+ features
 * 
 * SOLUTION:
 * Comprehensive validation of all inputs before file operations.
 * Fail fast with clear error messages.
 * 
 * DESIGN DECISIONS:
 * - Synchronous validation where possible (fast, predictable)
 * - Async validation for file system checks (fs.access)
 * - Explicit error codes for programmatic handling
 * - Helpful suggestions in error messages
 * 
 * USAGE EXAMPLE:
 * ```typescript
 * const validator = new ProjectValidator();
 * const result = validator.validateProjectName('my-project');
 * if (!result.isValid) {
 *   console.error('Invalid name:', result.errors[0].message);
 * }
 * ```
 * 
 * @class ProjectValidator
 */
export class ProjectValidator {
  // System directories that should NEVER contain Rise projects
  // These represent critical system paths across different operating systems
  private readonly BLOCKED_PATHS = [
    // macOS system directories
    '/System',
    '/Library',
    '/bin',
    '/sbin',
    '/usr',
    '/etc',
    '/var',
    '/private',
    
    // Windows system directories
    'C:\\Windows',
    'C:\\Program Files',
    'C:\\Program Files (x86)',
    'C:\\ProgramData',
    
    // Linux system directories
    '/boot',
    '/dev',
    '/proc',
    '/sys',
    '/root',
  ];

  /**
   * Validates a project name according to Rise naming rules
   * 
   * RULES:
   * - Minimum 3 characters
   * - Maximum 50 characters
   * - Only alphanumeric, hyphens, and underscores
   * - Cannot start or end with hyphen/underscore
   * - No whitespace
   * 
   * @param name - Project name to validate
   * @returns Validation result with errors if invalid
   * 
   * @example
   * ```typescript
   * const result = validator.validateProjectName('my-project');
   * // result.isValid = true
   * 
   * const result2 = validator.validateProjectName('ab');
   * // result2.isValid = false
   * // result2.errors[0].code = ValidationErrorCode.NAME_TOO_SHORT
   * ```
   */
  validateProjectName(name: string): ValidationResult {
    const errors: ValidationError[] = [];

    // Check minimum length
    if (name.length < 3) {
      errors.push({
        field: 'name',
        message: 'Project name must be at least 3 characters long',
        code: ValidationErrorCode.NAME_TOO_SHORT,
        suggestion: 'Try a longer name like "my-app" or "portfolio-site"',
      });
    }

    // Check maximum length
    if (name.length > 50) {
      errors.push({
        field: 'name',
        message: 'Project name must not exceed 50 characters',
        code: ValidationErrorCode.NAME_TOO_LONG,
        suggestion: 'Shorten the name to 50 characters or less',
      });
    }

    // Check for invalid characters
    // Allow: letters, numbers, hyphens, underscores
    const validNamePattern = /^[a-zA-Z0-9_-]+$/;
    if (!validNamePattern.test(name)) {
      errors.push({
        field: 'name',
        message: 'Project name can only contain letters, numbers, hyphens, and underscores',
        code: ValidationErrorCode.NAME_INVALID_CHARS,
        suggestion: 'Remove special characters and spaces',
      });
    }

    // Check for leading/trailing hyphens or underscores
    if (name.startsWith('-') || name.startsWith('_') || 
        name.endsWith('-') || name.endsWith('_')) {
      errors.push({
        field: 'name',
        message: 'Project name cannot start or end with hyphen or underscore',
        code: ValidationErrorCode.NAME_INVALID_CHARS,
        suggestion: 'Remove leading/trailing hyphens or underscores',
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validates a project path for security and feasibility
   * 
   * SECURITY CRITICAL:
   * This prevents path traversal attacks and writing to system directories.
   * 
   * CHECKS:
   * 1. Path is absolute (not relative)
   * 2. Path resolves correctly (no .. or .)
   * 3. Not in system directories
   * 4. Within user's home directory (or explicitly allowed location)
   * 5. Parent directory exists and is writable
   * 6. Target doesn't already exist
   * 
   * @param projectPath - Absolute path to validate
   * @param parentOnly - Only validate parent directory (for creation)
   * @returns Promise with validation result
   * 
   * @throws Never throws - returns errors in ValidationResult
   * 
   * @example
   * ```typescript
   * const result = await validator.validatePath('/Users/richard/my-project');
   * if (result.isValid) {
   *   // Safe to create project here
   * }
   * ```
   * 
   * @async
   */
  async validatePath(
    projectPath: string,
    parentOnly: boolean = false
  ): Promise<ValidationResult> {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // 1. Check if path is absolute
    if (!path.isAbsolute(projectPath)) {
      errors.push({
        field: 'path',
        message: 'Project path must be absolute',
        code: ValidationErrorCode.PATH_NOT_ABSOLUTE,
        suggestion: 'Provide the full path starting from root directory',
      });
      
      // If path isn't absolute, can't continue validation
      return { isValid: false, errors, warnings };
    }

    // 2. Resolve path to normalize and remove any .. or .
    // This prevents path traversal attacks
    const resolvedPath = path.resolve(projectPath);
    
    // If resolved path differs significantly, might be traversal attempt
    if (resolvedPath !== path.normalize(projectPath)) {
      errors.push({
        field: 'path',
        message: 'Invalid path - possible path traversal attempt detected',
        code: ValidationErrorCode.PATH_TRAVERSAL_ATTEMPT,
        suggestion: 'Use a direct path without .. or . segments',
      });
    }

    // 3. Check if path is in blocked system directories
    const isBlocked = this.BLOCKED_PATHS.some(blockedPath => {
      // On Windows, paths are case-insensitive
      const normalizedResolved = resolvedPath.toLowerCase();
      const normalizedBlocked = blockedPath.toLowerCase();
      return normalizedResolved.startsWith(normalizedBlocked);
    });

    if (isBlocked) {
      errors.push({
        field: 'path',
        message: 'Cannot create project in system directory',
        code: ValidationErrorCode.PATH_SYSTEM_DIRECTORY,
        suggestion: 'Choose a location in your home directory or Documents folder',
      });
    }

    // 4. Check if path is within user's home directory
    // This is recommended but not required (could be external drive, etc.)
    const homeDir = homedir();
    if (!resolvedPath.startsWith(homeDir)) {
      warnings.push({
        field: 'path',
        message: 'Project is outside your home directory - this is allowed but unusual',
      });
    }

    // 5. Check parent directory exists and is writable
    const parentDir = path.dirname(resolvedPath);
    
    try {
      // Check if parent exists
      const parentStats = await fs.stat(parentDir);
      
      if (!parentStats.isDirectory()) {
        errors.push({
          field: 'path',
          message: 'Parent path is not a directory',
          code: ValidationErrorCode.PATH_INVALID,
          suggestion: 'Choose a location within an existing directory',
        });
      }
      
      // Check if parent is writable
      try {
        await fs.access(parentDir, fs.constants.W_OK);
      } catch {
        errors.push({
          field: 'path',
          message: 'No write permission for parent directory',
          code: ValidationErrorCode.PATH_NO_PERMISSION,
          suggestion: 'Choose a location where you have write permission',
        });
      }
    } catch {
      errors.push({
        field: 'path',
        message: 'Parent directory does not exist',
        code: ValidationErrorCode.PATH_INVALID,
        suggestion: 'Choose an existing directory or create the parent first',
      });
    }

    // 6. Check if target already exists (only if not validating parent only)
    if (!parentOnly) {
      try {
        await fs.stat(resolvedPath);
        
        // Path exists - this could be okay if we're opening a project
        // But for creation, it's an error
        errors.push({
          field: 'path',
          message: 'A file or directory already exists at this location',
          code: ValidationErrorCode.PATH_ALREADY_EXISTS,
          suggestion: 'Choose a different name or location',
        });
      } catch {
        // Path doesn't exist - this is good for creation
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Validates a manifest.json file for Level 1 compliance
   * 
   * VALIDATION RULES:
   * - Must be valid JSON
   * - Must have schemaVersion: "1.0.0"
   * - Must have level: 1
   * - Must not contain Level 2+ features:
   *   - No expressions (type: "expression")
   *   - No state (localState, globalState)
   *   - No event handlers
   *   - No data connections
   * 
   * @param manifestContent - Raw manifest.json content (string or object)
   * @returns Validation result
   * 
   * @example
   * ```typescript
   * const content = await fs.readFile('.lowcode/manifest.json', 'utf-8');
   * const result = validator.validateManifest(content);
   * if (!result.isValid) {
   *   console.error('Invalid manifest:', result.errors);
   * }
   * ```
   */
  validateManifest(manifestContent: string | object): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    let manifest: any;

    // Parse JSON if string
    if (typeof manifestContent === 'string') {
      try {
        manifest = JSON.parse(manifestContent);
      } catch (error) {
        errors.push({
          field: 'manifest',
          message: 'manifest.json is not valid JSON',
          code: ValidationErrorCode.MANIFEST_INVALID,
          suggestion: 'Check for syntax errors in the JSON file',
        });
        
        return { isValid: false, errors, warnings };
      }
    } else {
      manifest = manifestContent;
    }

    // Detect manifest type: Catalyst (workflows) vs Rise (level/components)
    const isCatalystManifest = manifest.workflows !== undefined;
    const isRiseManifest = manifest.level !== undefined || manifest.components !== undefined;
    
    // Only validate Rise-specific fields for Rise manifests
    if (isRiseManifest && !isCatalystManifest) {
      // Check schema version (Rise only)
      if (manifest.schemaVersion !== '1.0.0') {
        errors.push({
          field: 'manifest.schemaVersion',
          message: `Unsupported schema version: ${manifest.schemaVersion}`,
          code: ValidationErrorCode.MANIFEST_INVALID,
          suggestion: 'This project requires a newer version of Rise',
        });
      }

      // Check level (Rise only)
      if (manifest.level !== 1) {
        errors.push({
          field: 'manifest.level',
          message: `Level ${manifest.level} projects are not supported in this version`,
          code: ValidationErrorCode.MANIFEST_WRONG_LEVEL,
          suggestion: 'This MVP only supports Level 1 projects',
        });
      }
    }
    
    // Catalyst manifests don't have level/schemaVersion validation
    // They use a different structure (workflows, nodes, edges)

    // Check for Level 2+ features in components
    if (manifest.components) {
      for (const [componentId, component] of Object.entries(manifest.components as Record<string, any>)) {
        // Check for expressions
        if (component.properties) {
          for (const [propName, prop] of Object.entries(component.properties as Record<string, any>)) {
            if (prop.type === 'expression') {
              errors.push({
                field: `components.${componentId}.properties.${propName}`,
                message: 'Expressions are not supported in Level 1 (type: "expression")',
                code: ValidationErrorCode.MANIFEST_WRONG_LEVEL,
                suggestion: 'Use type: "static" or "prop" instead',
              });
            }
          }
        }

        // Check for state
        if (component.localState || component.globalState) {
          errors.push({
            field: `components.${componentId}`,
            message: 'State management is not supported in Level 1',
            code: ValidationErrorCode.MANIFEST_WRONG_LEVEL,
            suggestion: 'Remove localState and globalState - coming in Level 2',
          });
        }

        // Check for event handlers
        if (component.eventHandlers) {
          errors.push({
            field: `components.${componentId}`,
            message: 'Event handlers are not supported in Level 1',
            code: ValidationErrorCode.MANIFEST_WRONG_LEVEL,
            suggestion: 'Remove eventHandlers - coming in Level 2',
          });
        }

        // Check for data connections
        if (component.dataConnections) {
          errors.push({
            field: `components.${componentId}`,
            message: 'Data connections are not supported in Level 1',
            code: ValidationErrorCode.MANIFEST_WRONG_LEVEL,
            suggestion: 'Remove dataConnections - coming in Level 3',
          });
        }
      }
    }

    // Check for global Level 2+ features
    if (manifest.globalFunctions) {
      errors.push({
        field: 'manifest.globalFunctions',
        message: 'Global functions are not supported in Level 1',
        code: ValidationErrorCode.MANIFEST_WRONG_LEVEL,
        suggestion: 'Remove globalFunctions - coming in Level 2',
      });
    }

    if (manifest.globalState) {
      errors.push({
        field: 'manifest.globalState',
        message: 'Global state is not supported in Level 1',
        code: ValidationErrorCode.MANIFEST_WRONG_LEVEL,
        suggestion: 'Remove globalState - coming in Level 2',
      });
    }

    if (manifest.connections) {
      errors.push({
        field: 'manifest.connections',
        message: 'Connections are not supported in Level 1',
        code: ValidationErrorCode.MANIFEST_WRONG_LEVEL,
        suggestion: 'Remove connections - coming in Level 2',
      });
    }

    // Level 3 features
    if (manifest.routes || manifest.api || manifest.database) {
      errors.push({
        field: 'manifest',
        message: 'Advanced features (routes, api, database) are not supported in Level 1',
        code: ValidationErrorCode.MANIFEST_WRONG_LEVEL,
        suggestion: 'Remove Level 3 features - coming in future release',
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Validates an existing Catalyst project
   * 
   * Alias for validateProjectStructure - validates that a directory
   * contains a valid Catalyst project.
   * 
   * @param projectPath - Absolute path to project directory
   * @returns Promise with validation result
   * 
   * @async
   */
  async validateExistingProject(projectPath: string): Promise<ValidationResult> {
    return this.validateProjectStructure(projectPath);
  }

  /**
   * Validates a complete project structure
   * 
   * Checks that a directory contains a valid Catalyst project with:
   * - .catalyst/ directory (or legacy .lowcode/ for backward compatibility)
   * - manifest.json (in .catalyst/ or .lowcode/)
   * 
   * Used when opening existing projects to ensure they're valid.
   * 
   * @param projectPath - Absolute path to project directory
   * @returns Promise with validation result
   * 
   * @async
   */
  async validateProjectStructure(projectPath: string): Promise<ValidationResult> {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // Check if directory exists
    try {
      const stats = await fs.stat(projectPath);
      if (!stats.isDirectory()) {
        errors.push({
          field: 'projectPath',
          message: 'Path is not a directory',
          code: ValidationErrorCode.PROJECT_INVALID_STRUCTURE,
          suggestion: 'Select a project directory',
        });
        return { isValid: false, errors, warnings };
      }
    } catch {
      errors.push({
        field: 'projectPath',
        message: 'Project directory does not exist',
        code: ValidationErrorCode.PROJECT_NOT_FOUND,
        suggestion: 'Check that the path is correct',
      });
      return { isValid: false, errors, warnings };
    }

    // Check for .catalyst directory (new) or .lowcode directory (legacy)
    const catalystDir = path.join(projectPath, '.catalyst');
    const lowcodeDir = path.join(projectPath, '.lowcode');
    
    let hasCatalystDir = false;
    let hasLowcodeDir = false;
    
    // Check for .catalyst/
    try {
      const stats = await fs.stat(catalystDir);
      if (stats.isDirectory()) {
        hasCatalystDir = true;
      }
    } catch {
      // .catalyst/ doesn't exist, that's okay if .lowcode/ exists
    }
    
    // Check for .lowcode/ (backward compatibility)
    try {
      const stats = await fs.stat(lowcodeDir);
      if (stats.isDirectory()) {
        hasLowcodeDir = true;
      }
    } catch {
      // .lowcode/ doesn't exist, that's okay if .catalyst/ exists
    }
    
    // Must have at least one
    if (!hasCatalystDir && !hasLowcodeDir) {
      errors.push({
        field: '.catalyst',
        message: 'Neither .catalyst/ nor .lowcode/ directory found',
        code: ValidationErrorCode.PROJECT_INVALID_STRUCTURE,
        suggestion: 'This does not appear to be a Catalyst project',
      });
    }

    // Check for manifest.json in .catalyst/ first, then .lowcode/
    let manifestPath: string;
    let manifestFound = false;
    
    if (hasCatalystDir) {
      manifestPath = path.join(projectPath, '.catalyst', 'manifest.json');
      try {
        const content = await fs.readFile(manifestPath, 'utf-8');
        manifestFound = true;
        
        // Validate manifest content
        const manifestResult = this.validateManifest(content);
        errors.push(...manifestResult.errors);
        if (manifestResult.warnings) {
          warnings.push(...manifestResult.warnings);
        }
      } catch {
        // Try .lowcode/ location
      }
    }
    
    // If not found in .catalyst/, try .lowcode/
    if (!manifestFound && hasLowcodeDir) {
      manifestPath = path.join(projectPath, '.lowcode', 'manifest.json');
      try {
        const content = await fs.readFile(manifestPath, 'utf-8');
        manifestFound = true;
        
        // Validate manifest content
        const manifestResult = this.validateManifest(content);
        errors.push(...manifestResult.errors);
        if (manifestResult.warnings) {
          warnings.push(...manifestResult.warnings);
        }
      } catch {
        // Manifest not found in either location
      }
    }
    
    // If still not found, error
    if (!manifestFound) {
      errors.push({
        field: 'manifest.json',
        message: 'manifest.json not found in .catalyst/ or .lowcode/ directory',
        code: ValidationErrorCode.MANIFEST_NOT_FOUND,
        suggestion: 'This project may be corrupted or incompatible',
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }
}
