/**
 * @file CircularReferenceDetector.ts
 * @description Detects circular references and validates tree depth in component hierarchies
 * 
 * @architecture Phase 0, Task 0.3 - Schema Level 1 Validator
 * @created 2025-11-19
 * @author AI (Cline) + Human Review
 * @confidence 8/10 - Standard graph algorithm, well-tested approach
 * 
 * @see docs/SCHEMA_LEVELS.md - Level 1 depth constraints
 * @see .implementation/phase-0-foundation/task-0.3-schema-validator.md
 * 
 * @security-critical false
 * @performance-critical true - Runs on every validation
 */

import { ValidationError, Component } from './types';
import { ERROR_CODES, DOCS_URLS, LEVEL_1_RULES } from './ValidationRules';

/**
 * Detects circular references in component hierarchies using Depth-First Search.
 * 
 * PROBLEM SOLVED:
 * Component A has child B, B has child C, C has child A = circular reference.
 * This would cause infinite loops in:
 * - Code generation (infinite recursion)
 * - Tree rendering (stack overflow)
 * - Serialization (JSON.stringify fails)
 * 
 * SOLUTION:
 * Use DFS with a recursion stack to detect cycles.
 * - visited set: Tracks all explored nodes (prevents re-processing)
 * - recursion stack: Tracks current path being explored (detects cycles)
 * - If we encounter a node already in recursion stack = cycle found
 * 
 * ALGORITHM:
 * ```
 * For each component:
 *   DFS(component):
 *     if in recursion stack: CYCLE DETECTED
 *     if visited: skip
 *     
 *     add to visited
 *     add to recursion stack
 *     
 *     for each child:
 *       DFS(child)
 *     
 *     remove from recursion stack
 * ```
 * 
 * BONUS: Also validates tree depth during traversal (no extra pass needed).
 * 
 * @example
 * const detector = new CircularReferenceDetector(components);
 * const errors = detector.detect();
 * if (errors.length > 0) {
 *   // Handle circular reference errors
 * }
 * 
 * @performance O(V + E) where V = components, E = parent-child relationships
 */
export class CircularReferenceDetector {
  // Components being validated
  private components: Record<string, Component>;
  
  // Tracks all visited components (prevents re-processing)
  private visited: Set<string>;
  
  // Tracks current DFS path (detects cycles)
  private recursionStack: Set<string>;
  
  // Current path for error messages (shows cycle path)
  private currentPath: string[];
  
  // Maximum depth found during traversal
  private maxDepthFound: number;
  
  /**
   * Create circular reference detector for component hierarchy.
   * 
   * @param components - Record of all components in manifest
   */
  constructor(components: Record<string, Component>) {
    this.components = components;
    this.visited = new Set();
    this.recursionStack = new Set();
    this.currentPath = [];
    this.maxDepthFound = 0;
  }
  
  /**
   * Detect all circular references and depth violations in component tree.
   * 
   * STRATEGY:
   * - Start DFS from each unvisited component
   * - Multiple roots are allowed (not all components need a common parent)
   * - Checks both circular references AND depth limits in one pass
   * 
   * @returns Array of validation errors (empty if no issues)
   * 
   * @performance O(V + E) - visits each component once, each relationship once
   */
  detect(): ValidationError[] {
    const errors: ValidationError[] = [];
    
    // Reset state for fresh detection
    this.visited = new Set();
    this.recursionStack = new Set();
    this.maxDepthFound = 0;
    
    // Check each component as a potential root
    // Some components may not be referenced (orphans or multiple roots)
    for (const componentId of Object.keys(this.components)) {
      // Skip if already explored from another root
      if (!this.visited.has(componentId)) {
        // Start DFS from this component at depth 1
        this.dfs(componentId, 1, errors);
      }
    }
    
    return errors;
  }
  
  /**
   * Depth-First Search to detect cycles and validate depth.
   * 
   * RECURSIVE ALGORITHM:
   * 1. Check if component is in recursion stack (cycle detection)
   * 2. Check if depth exceeds limit
   * 3. Mark as visited, add to recursion stack
   * 4. Recursively visit all children
   * 5. Remove from recursion stack (backtrack)
   * 
   * WHY RECURSION STACK?
   * The visited set alone isn't enough to detect cycles:
   * 
   * Tree:     A → B → C
   *           A → D → C
   * 
   * C is visited twice but no cycle (diamond pattern, which is valid).
   * 
   * Cycle:    A → B → C
   *                ↑___|
   * 
   * C is in recursion stack when we encounter it again from C's child = cycle!
   * 
   * @param componentId - Current component being explored
   * @param depth - Current depth in tree (starts at 1)
   * @param errors - Array to collect validation errors
   */
  private dfs(
    componentId: string,
    depth: number,
    errors: ValidationError[]
  ): void {
    // CYCLE DETECTION:
    // If component is in current recursion path, we've found a cycle
    if (this.recursionStack.has(componentId)) {
      // Build cycle path for error message
      const cycleStart = this.currentPath.indexOf(componentId);
      const cyclePath = [...this.currentPath.slice(cycleStart), componentId];
      
      errors.push({
        field: 'children',
        message: `Circular reference detected: ${cyclePath.join(' → ')}`,
        severity: 'ERROR',
        path: `components.${componentId}`,
        componentId,
        componentName: this.components[componentId]?.displayName,
        suggestion: 'Remove circular parent-child relationship. Components cannot be their own ancestors.',
        code: ERROR_CODES.CIRCULAR_REFERENCE,
        documentation: DOCS_URLS.SCHEMA_LEVELS,
      });
      
      return; // Stop exploring this path
    }
    
    // Skip if already fully explored from another path
    if (this.visited.has(componentId)) {
      return;
    }
    
    // DEPTH VALIDATION:
    // Check if current depth exceeds maximum allowed
    if (depth > LEVEL_1_RULES.component.maxDepth) {
      errors.push({
        field: 'children',
        message: `Component tree depth ${depth} exceeds maximum allowed depth of ${LEVEL_1_RULES.component.maxDepth}`,
        severity: 'ERROR',
        path: `components.${componentId}`,
        componentId,
        componentName: this.components[componentId]?.displayName,
        suggestion: `Flatten component hierarchy or split into multiple pages. Current path: ${this.currentPath.join(' → ')} → ${componentId}`,
        code: ERROR_CODES.EXCESSIVE_DEPTH,
        documentation: DOCS_URLS.LEVEL_1_GUIDE,
      });
      
      // Continue checking for other errors even if depth exceeded
    }
    
    // Track maximum depth found (for reporting)
    if (depth > this.maxDepthFound) {
      this.maxDepthFound = depth;
    }
    
    // Get component (check exists)
    const component = this.components[componentId];
    if (!component) {
      // Component referenced but doesn't exist
      errors.push({
        field: 'children',
        message: `Component '${componentId}' referenced but not found in manifest`,
        severity: 'ERROR',
        path: `components.${componentId}`,
        componentId,
        suggestion: 'Remove reference to non-existent component or add missing component definition',
        code: ERROR_CODES.MISSING_COMPONENT_REFERENCE,
        documentation: DOCS_URLS.COMPONENT_SCHEMA,
      });
      
      return; // Can't continue without component
    }
    
    // Mark as visited (won't re-process)
    this.visited.add(componentId);
    
    // Add to recursion stack (marks as "currently exploring")
    this.recursionStack.add(componentId);
    
    // Add to current path (for error messages)
    this.currentPath.push(componentId);
    
    // RECURSE INTO CHILDREN:
    // Explore all child components at depth + 1
    if (component.children && Array.isArray(component.children)) {
      for (const childId of component.children) {
        // Recursively check each child
        this.dfs(childId, depth + 1, errors);
      }
    }
    
    // BACKTRACK:
    // Remove from recursion stack (finished exploring this path)
    this.recursionStack.delete(componentId);
    
    // Remove from current path
    this.currentPath.pop();
  }
  
  /**
   * Get the maximum depth found during last detection run.
   * 
   * Useful for reporting statistics even when validation passes.
   * 
   * @returns Maximum tree depth found (0 if detect() not called yet)
   * 
   * @example
   * detector.detect();
   * console.log(`Max depth: ${detector.getMaxDepth()}`);
   */
  getMaxDepth(): number {
    return this.maxDepthFound;
  }
  
  /**
   * Validate that all component references exist.
   * 
   * CHECKS:
   * - All child IDs reference existing components
   * - No dangling references
   * 
   * NOTE: This is called separately from detect() for better error reporting.
   * detect() will find missing refs during DFS, but this finds ALL missing refs
   * even in unreachable components.
   * 
   * @returns Array of validation errors for missing references
   * 
   * @example
   * const errors = detector.validateReferences();
   */
  validateReferences(): ValidationError[] {
    const errors: ValidationError[] = [];
    
    // Check each component's children references
    for (const [componentId, component] of Object.entries(this.components)) {
      if (!component.children || !Array.isArray(component.children)) {
        continue; // No children, nothing to validate
      }
      
      // Check each child reference
      for (const childId of component.children) {
        // Check if child component exists
        if (!this.components[childId]) {
          errors.push({
            field: 'children',
            message: `Child component '${childId}' not found in manifest`,
            severity: 'ERROR',
            path: `components.${componentId}.children`,
            componentId,
            componentName: component.displayName,
            suggestion: `Add component '${childId}' to manifest or remove reference`,
            code: ERROR_CODES.MISSING_COMPONENT_REFERENCE,
            documentation: DOCS_URLS.COMPONENT_SCHEMA,
          });
        }
      }
    }
    
    return errors;
  }
  
  /**
   * Find all root components (components with no parents).
   * 
   * Useful for:
   * - Identifying entry points for tree traversal
   * - Finding orphaned components
   * - Building visual tree representations
   * 
   * @returns Array of component IDs that have no parents
   * 
   * @example
   * const roots = detector.findRoots();
   * console.log(`Found ${roots.length} root components`);
   */
  findRoots(): string[] {
    // Build set of all components that are children
    const childComponents = new Set<string>();
    
    for (const component of Object.values(this.components)) {
      if (component.children && Array.isArray(component.children)) {
        for (const childId of component.children) {
          childComponents.add(childId);
        }
      }
    }
    
    // Any component NOT in childComponents is a root
    const roots: string[] = [];
    for (const componentId of Object.keys(this.components)) {
      if (!childComponents.has(componentId)) {
        roots.push(componentId);
      }
    }
    
    return roots;
  }
}
