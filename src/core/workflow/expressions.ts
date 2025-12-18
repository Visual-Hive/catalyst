/**
 * @file expressions.ts
 * @description Expression parser and validator for Catalyst workflow {{ template }} syntax
 * 
 * @architecture Phase 0, Task 0.2 - Manifest Schema Design
 * @created 2025-12-18
 * @author AI (Cline) + Human Review
 * @confidence 7/10 - Expression parsing is complex, needs extensive testing
 * 
 * @see src/core/workflow/types.ts - Type definitions
 * @see docs/Catalyst documentation/CATALYST_SPECIFICATION.md - Expression syntax spec
 * 
 * PROBLEM SOLVED:
 * - Workflows use {{ template }} syntax for dynamic values
 * - Need to validate expression syntax at design time
 * - Need to catch common errors before code generation
 * - Need to support multiple contexts (input, nodes, env, etc.)
 * 
 * SOLUTION:
 * - Regex-based expression parser
 * - Context validation (input, nodes, env, global, secrets, execution, item, index)
 * - Function validation (now, uuid, hash, embedding, etc.)
 * - Filter/pipe validation (lowercase, truncate, json, etc.)
 * - Structured error messages with position info
 * 
 * EXPRESSION SYNTAX:
 * - Simple: {{ input.query }}
 * - Nested: {{ nodes.node_search.output.results }}
 * - Functions: {{ now() }}, {{ uuid() }}
 * - Filters: {{ input.name | lowercase }}, {{ input.text | truncate(50) }}
 * - Mixed: {{ input.date | format('YYYY-MM-DD') }}
 * 
 * @security-critical true - Validates user input for code generation
 * @performance-critical false - Called at design time, not runtime
 */

// ============================================================
// TYPES
// ============================================================

/**
 * Valid expression contexts
 */
export type ExpressionContext =
  | 'input'        // Workflow input parameters
  | 'nodes'        // Previous node outputs
  | 'env'          // Environment variables
  | 'global'       // Global variables
  | 'secrets'      // Secret values
  | 'execution'    // Execution context (id, timestamp, etc.)
  | 'item'         // Current loop item
  | 'index';       // Current loop index

/**
 * Built-in functions available in expressions
 */
export type ExpressionFunction =
  // String functions
  | 'concat'
  | 'lowercase'
  | 'uppercase'
  | 'trim'
  | 'truncate'
  // Date/time functions
  | 'now'
  | 'format'
  // Utility functions
  | 'uuid'
  | 'hash'
  | 'embedding'
  // JSON functions
  | 'json'
  | 'parse'
  // Array functions
  | 'length'
  | 'first'
  | 'last'
  | 'pluck';

/**
 * Filter operators (pipe syntax)
 */
export type ExpressionFilter =
  | 'lowercase'
  | 'uppercase'
  | 'trim'
  | 'truncate'
  | 'json'
  | 'parse'
  | 'format'
  | 'length'
  | 'first'
  | 'last';

/**
 * Expression token types
 */
export type TokenType =
  | 'context'      // input, nodes, env, etc.
  | 'property'     // .query, .output, etc.
  | 'function'     // now(), uuid(), etc.
  | 'filter'       // | lowercase, | truncate(50)
  | 'literal'      // String or number literal
  | 'whitespace'
  | 'invalid';

/**
 * Expression token
 */
export interface Token {
  type: TokenType;
  value: string;
  position: number;
}

/**
 * Parsed expression AST node
 */
export interface ExpressionNode {
  type: 'access' | 'function' | 'filter';
  context?: ExpressionContext;
  path?: string[];              // Property access path
  function?: ExpressionFunction;
  args?: any[];                 // Function arguments
  filter?: ExpressionFilter;
  filterArgs?: any[];           // Filter arguments
  source?: ExpressionNode;      // Source for filters
}

/**
 * Expression validation error
 */
export interface ExpressionError {
  message: string;
  position?: number;
  context?: string;
}

/**
 * Expression validation result
 */
export interface ExpressionValidationResult {
  valid: boolean;
  errors: ExpressionError[];
  ast?: ExpressionNode;
}

// ============================================================
// CONSTANTS
// ============================================================

/**
 * Valid expression contexts
 */
const VALID_CONTEXTS: ExpressionContext[] = [
  'input',
  'nodes',
  'env',
  'global',
  'secrets',
  'execution',
  'item',
  'index',
];

/**
 * Valid built-in functions
 */
const VALID_FUNCTIONS: ExpressionFunction[] = [
  'concat',
  'lowercase',
  'uppercase',
  'trim',
  'truncate',
  'now',
  'format',
  'uuid',
  'hash',
  'embedding',
  'json',
  'parse',
  'length',
  'first',
  'last',
  'pluck',
];

/**
 * Valid filter operators
 */
const VALID_FILTERS: ExpressionFilter[] = [
  'lowercase',
  'uppercase',
  'trim',
  'truncate',
  'json',
  'parse',
  'format',
  'length',
  'first',
  'last',
];

// ============================================================
// REGEX PATTERNS
// ============================================================

/**
 * Expression pattern - matches {{ ... }}
 */
const EXPRESSION_PATTERN = /\{\{([^}]+)\}\}/g;

/**
 * Context access pattern - matches context.property.path
 */
const CONTEXT_ACCESS_PATTERN = /^([a-zA-Z_][a-zA-Z0-9_]*)(\.[a-zA-Z_][a-zA-Z0-9_]*)*$/;

/**
 * Function call pattern - matches functionName(args)
 */
const FUNCTION_PATTERN = /^([a-zA-Z_][a-zA-Z0-9_]*)\((.*?)\)$/;

/**
 * Filter pattern - matches | filterName or | filterName(args)
 */
const FILTER_PATTERN = /\|\s*([a-zA-Z_][a-zA-Z0-9_]*)(?:\((.*?)\))?/g;

// ============================================================
// CORE FUNCTIONS
// ============================================================

/**
 * Check if a string contains expression syntax
 * 
 * @param value - String to check
 * @returns true if contains {{ }} syntax
 * 
 * @example
 * isExpression('{{ input.query }}') // true
 * isExpression('Hello, World!') // false
 */
export function isExpression(value: string): boolean {
  return /\{\{.*?\}\}/.test(value);
}

/**
 * Extract all expressions from a string
 * 
 * @param value - String containing expressions
 * @returns Array of expression strings (without {{ }})
 * 
 * @example
 * extractExpressions('Hello {{ input.name }}, your score is {{ nodes.calc.output }}')
 * // ['input.name', 'nodes.calc.output']
 */
export function extractExpressions(value: string): string[] {
  const expressions: string[] = [];
  const matches = value.matchAll(EXPRESSION_PATTERN);
  
  for (const match of matches) {
    expressions.push(match[1].trim());
  }
  
  return expressions;
}

/**
 * Validate a single expression
 * 
 * @param expression - Expression string (without {{ }})
 * @returns ValidationResult with errors if invalid
 * 
 * @example
 * ```typescript
 * const result = validateExpression('input.query');
 * if (!result.valid) {
 *   console.error('Errors:', result.errors);
 * }
 * ```
 */
export function validateExpression(expression: string): ExpressionValidationResult {
  const errors: ExpressionError[] = [];
  
  // Trim whitespace
  expression = expression.trim();
  
  // Empty expression
  if (!expression) {
    errors.push({
      message: 'Expression cannot be empty',
      context: expression,
    });
    return { valid: false, errors };
  }
  
  // Check for pipe filters
  const parts = expression.split('|');
  const basePart = parts[0].trim();
  const filterParts = parts.slice(1);
  
  // Validate base part (context access or function call)
  const baseValid = validateBasePart(basePart, errors);
  
  // Validate filters
  for (const filterPart of filterParts) {
    validateFilter(filterPart.trim(), errors);
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validate base part of expression (before pipe)
 * 
 * @param part - Expression base part
 * @param errors - Array to collect errors
 * @returns true if valid
 */
function validateBasePart(part: string, errors: ExpressionError[]): boolean {
  // Check if it's a function call
  const functionMatch = part.match(FUNCTION_PATTERN);
  if (functionMatch) {
    const functionName = functionMatch[1];
    if (!VALID_FUNCTIONS.includes(functionName as ExpressionFunction)) {
      errors.push({
        message: `Unknown function: ${functionName}`,
        context: part,
      });
      return false;
    }
    return true;
  }
  
  // Check if it's a context access
  if (!CONTEXT_ACCESS_PATTERN.test(part)) {
    errors.push({
      message: `Invalid expression syntax: ${part}`,
      context: part,
    });
    return false;
  }
  
  // Parse context access
  const segments = part.split('.');
  const context = segments[0];
  
  // Validate context
  if (!VALID_CONTEXTS.includes(context as ExpressionContext)) {
    errors.push({
      message: `Unknown context: ${context}. Valid contexts: ${VALID_CONTEXTS.join(', ')}`,
      context: part,
    });
    return false;
  }
  
  // Special validation for specific contexts
  if (context === 'nodes' && segments.length < 3) {
    errors.push({
      message: 'Node references must include node ID and property (e.g., nodes.node_id.output)',
      context: part,
    });
    return false;
  }
  
  return true;
}

/**
 * Validate filter expression
 * 
 * @param filter - Filter string (e.g., "lowercase" or "truncate(50)")
 * @param errors - Array to collect errors
 */
function validateFilter(filter: string, errors: ExpressionError[]): void {
  // Parse filter with optional arguments
  const match = filter.match(/^([a-zA-Z_][a-zA-Z0-9_]*)(?:\((.*?)\))?$/);
  
  if (!match) {
    errors.push({
      message: `Invalid filter syntax: ${filter}`,
      context: filter,
    });
    return;
  }
  
  const filterName = match[1];
  
  if (!VALID_FILTERS.includes(filterName as ExpressionFilter)) {
    errors.push({
      message: `Unknown filter: ${filterName}. Valid filters: ${VALID_FILTERS.join(', ')}`,
      context: filter,
    });
  }
}

/**
 * Validate all expressions in a config value
 * 
 * Recursively validates expressions in strings and objects.
 * 
 * @param value - Config value to validate (string, object, array, etc.)
 * @param path - Current path in object (for error messages)
 * @returns Array of validation errors
 * 
 * @example
 * ```typescript
 * const errors = validateConfigExpressions({
 *   prompt: '{{ input.query }}',
 *   settings: {
 *     maxResults: '{{ global.MAX_RESULTS }}'
 *   }
 * });
 * ```
 */
export function validateConfigExpressions(
  value: any,
  path: string = ''
): ExpressionError[] {
  const errors: ExpressionError[] = [];
  
  // Handle different value types
  if (typeof value === 'string') {
    // Extract and validate expressions
    const expressions = extractExpressions(value);
    for (const expr of expressions) {
      const result = validateExpression(expr);
      if (!result.valid) {
        errors.push(...result.errors.map(err => ({
          ...err,
          context: `${path}: ${err.context}`,
        })));
      }
    }
  } else if (Array.isArray(value)) {
    // Validate each array element
    value.forEach((item, index) => {
      const itemPath = `${path}[${index}]`;
      errors.push(...validateConfigExpressions(item, itemPath));
    });
  } else if (value && typeof value === 'object') {
    // Validate each object property
    for (const [key, val] of Object.entries(value)) {
      const propPath = path ? `${path}.${key}` : key;
      errors.push(...validateConfigExpressions(val, propPath));
    }
  }
  
  return errors;
}

/**
 * Get expression contexts used in a string
 * 
 * @param value - String containing expressions
 * @returns Array of unique contexts used
 * 
 * @example
 * getExpressionContexts('{{ input.query }} {{ nodes.search.output }}')
 * // ['input', 'nodes']
 */
export function getExpressionContexts(value: string): ExpressionContext[] {
  const contexts = new Set<ExpressionContext>();
  const expressions = extractExpressions(value);
  
  for (const expr of expressions) {
    const parts = expr.split('|')[0].trim().split('.');
    const context = parts[0];
    
    if (VALID_CONTEXTS.includes(context as ExpressionContext)) {
      contexts.add(context as ExpressionContext);
    }
  }
  
  return Array.from(contexts);
}

/**
 * Check if expression references a specific context
 * 
 * @param expression - Expression string
 * @param context - Context to check for
 * @returns true if expression uses the context
 * 
 * @example
 * usesContext('{{ input.query }}', 'input') // true
 * usesContext('{{ env.API_KEY }}', 'input') // false
 */
export function usesContext(expression: string, context: ExpressionContext): boolean {
  const contexts = getExpressionContexts(expression);
  return contexts.includes(context);
}

/**
 * Suggest corrections for common expression errors
 * 
 * @param expression - Invalid expression
 * @returns Array of suggested corrections
 * 
 * @example
 * suggestCorrections('inputs.query') // ['input.query']
 * suggestCorrections('node.search.output') // ['nodes.search.output']
 */
export function suggestCorrections(expression: string): string[] {
  const suggestions: string[] = [];
  const parts = expression.split('.');
  const first = parts[0];
  
  // Common typos
  const typos: Record<string, string> = {
    'inputs': 'input',
    'node': 'nodes',
    'environment': 'env',
    'vars': 'global',
    'secret': 'secrets',
  };
  
  if (first in typos) {
    const corrected = [typos[first], ...parts.slice(1)].join('.');
    suggestions.push(corrected);
  }
  
  // Suggest similar valid contexts
  const similar = VALID_CONTEXTS.filter(ctx => 
    ctx.startsWith(first[0]) || first.startsWith(ctx[0])
  );
  
  for (const ctx of similar) {
    const corrected = [ctx, ...parts.slice(1)].join('.');
    if (!suggestions.includes(corrected)) {
      suggestions.push(corrected);
    }
  }
  
  return suggestions;
}

/**
 * Format expression validation errors for display
 * 
 * @param errors - Array of expression errors
 * @returns Formatted error message
 * 
 * @example
 * const errors = [{ message: 'Unknown context: foo', context: 'foo.bar' }];
 * console.log(formatErrors(errors));
 * // "Expression errors:\n  - Unknown context: foo (in foo.bar)"
 */
export function formatErrors(errors: ExpressionError[]): string {
  if (errors.length === 0) return '';
  
  const lines = ['Expression validation errors:'];
  for (const err of errors) {
    const contextPart = err.context ? ` (in ${err.context})` : '';
    lines.push(`  - ${err.message}${contextPart}`);
  }
  
  return lines.join('\n');
}

// ============================================================
// HELPER FUNCTIONS
// ============================================================

/**
 * List all valid expression contexts
 * 
 * @returns Array of valid contexts
 */
export function getValidContexts(): ExpressionContext[] {
  return [...VALID_CONTEXTS];
}

/**
 * List all valid expression functions
 * 
 * @returns Array of valid functions
 */
export function getValidFunctions(): ExpressionFunction[] {
  return [...VALID_FUNCTIONS];
}

/**
 * List all valid expression filters
 * 
 * @returns Array of valid filters
 */
export function getValidFilters(): ExpressionFilter[] {
  return [...VALID_FILTERS];
}

/**
 * Check if a string is a valid context name
 * 
 * @param name - String to check
 * @returns true if valid context
 */
export function isValidContext(name: string): name is ExpressionContext {
  return VALID_CONTEXTS.includes(name as ExpressionContext);
}

/**
 * Check if a string is a valid function name
 * 
 * @param name - String to check
 * @returns true if valid function
 */
export function isValidFunction(name: string): name is ExpressionFunction {
  return VALID_FUNCTIONS.includes(name as ExpressionFunction);
}

/**
 * Check if a string is a valid filter name
 * 
 * @param name - String to check
 * @returns true if valid filter
 */
export function isValidFilter(name: string): name is ExpressionFilter {
  return VALID_FILTERS.includes(name as ExpressionFilter);
}
