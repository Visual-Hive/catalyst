/**
 * @file PageStateRuntime.ts
 * @description Generates runtime code for page state (useState hooks) in React components
 * 
 * @architecture Phase 4, Task 4.3 - Page State System
 * @created 2025-11-30
 * @author AI (Cline) + Human Review
 * @confidence 9/10 - Follows established React patterns for state management
 * 
 * @see src/core/logic/types.ts - PageState types
 * @see src/core/state/TemplateParser.ts - Template parsing
 * @see .implementation/phase-4-logic-editor/task-4.3-page-state-system.md
 * 
 * PROBLEM SOLVED:
 * - Generate useState hooks from page state definitions
 * - Create state object for template interpolation
 * - Generate setter functions for use in event handlers
 * 
 * SOLUTION:
 * - Generate useState hook for each state variable
 * - Create a combined state object for easy access
 * - Generate type-safe setter function mapping
 * 
 * GENERATED CODE STRUCTURE:
 * ```typescript
 * // State hooks
 * const [clickCount, setClickCount] = useState<number>(0);
 * const [userName, setUserName] = useState<string>('');
 * 
 * // Combined state object for template interpolation
 * const state = { clickCount, userName };
 * 
 * // Setter mapping for logic flows
 * const setters = { setClickCount, setUserName };
 * ```
 * 
 * @performance O(n) where n = number of state variables
 * @security-critical false
 * @performance-critical false
 */

import type { PageState, StateVariable, StateVariableType } from '../logic/types';

// ============================================================
// TYPES
// ============================================================

/**
 * Generated state code segments
 */
export interface GeneratedStateCode {
  /** Import statements needed (useState from react) */
  imports: string[];
  
  /** useState hook declarations */
  hooks: string[];
  
  /** Combined state object creation */
  stateObject: string;
  
  /** Setter mapping for event handlers */
  setterMapping: string;
  
  /** Full code block combining all segments */
  fullCode: string;
}

// ============================================================
// CODE GENERATION
// ============================================================

/**
 * Generate React useState hooks and state object from page state
 * 
 * Creates the runtime code needed for state management in generated components.
 * 
 * @param pageState - Page state definitions from manifest
 * @returns Generated code segments
 * 
 * @example
 * ```typescript
 * const pageState = {
 *   clickCount: { type: 'number', initialValue: 0 },
 *   userName: { type: 'string', initialValue: '' }
 * };
 * 
 * const code = generateStateCode(pageState);
 * // code.hooks = [
 * //   "const [clickCount, setClickCount] = useState<number>(0);",
 * //   "const [userName, setUserName] = useState<string>('');"
 * // ]
 * ```
 */
export function generateStateCode(pageState: PageState): GeneratedStateCode {
  // Get sorted variable names for consistent output
  const varNames = Object.keys(pageState).sort();
  
  // Handle empty state case
  if (varNames.length === 0) {
    return {
      imports: [],
      hooks: [],
      stateObject: '',
      setterMapping: '',
      fullCode: '',
    };
  }
  
  // Generate imports
  const imports = ['import { useState } from \'react\';'];
  
  // Generate hooks for each state variable
  const hooks = varNames.map((name) => {
    const variable = pageState[name];
    return generateUseStateHook(name, variable);
  });
  
  // Generate combined state object
  const stateObjectProps = varNames.join(', ');
  const stateObject = `const state = { ${stateObjectProps} };`;
  
  // Generate setter mapping
  const setterProps = varNames
    .map((name) => `set${capitalize(name)}`)
    .join(', ');
  const setterMapping = `const setters = { ${setterProps} };`;
  
  // Combine into full code block
  const fullCode = [
    '// Page State',
    ...hooks,
    '',
    '// State object for template interpolation',
    stateObject,
    '',
    '// Setter mapping for event handlers',
    setterMapping,
  ].join('\n');
  
  return {
    imports,
    hooks,
    stateObject,
    setterMapping,
    fullCode,
  };
}

/**
 * Generate a single useState hook declaration
 * 
 * @param name - Variable name
 * @param variable - Variable definition
 * @returns useState hook code line
 * 
 * @example
 * ```typescript
 * generateUseStateHook('clickCount', { type: 'number', initialValue: 0 })
 * // Returns: "const [clickCount, setClickCount] = useState<number>(0);"
 * ```
 */
function generateUseStateHook(name: string, variable: StateVariable): string {
  // Get TypeScript type for hook generic
  const tsType = getTsType(variable.type);
  
  // Format initial value based on type
  const initialValue = formatInitialValue(variable.initialValue, variable.type);
  
  // Generate setter name (camelCase with 'set' prefix)
  const setterName = `set${capitalize(name)}`;
  
  return `const [${name}, ${setterName}] = useState(${initialValue});`;
}

/**
 * Get TypeScript type from state variable type
 */
function getTsType(type: StateVariableType): string {
  switch (type) {
    case 'string':
      return 'string';
    case 'number':
      return 'number';
    case 'boolean':
      return 'boolean';
    default:
      return 'unknown';
  }
}

/**
 * Format initial value for code generation
 * 
 * @param value - Initial value
 * @param type - Variable type
 * @returns Formatted value string for code
 */
function formatInitialValue(
  value: string | number | boolean,
  type: StateVariableType
): string {
  switch (type) {
    case 'string':
      // Use JSON.stringify for proper string escaping
      return JSON.stringify(value);
    case 'number':
      return String(value);
    case 'boolean':
      return String(value);
    default:
      return JSON.stringify(value);
  }
}

/**
 * Capitalize first letter of string
 */
function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// ============================================================
// HELPER GENERATORS
// ============================================================

/**
 * Generate state update function for logic flow actions
 * 
 * Creates the code to update a state variable from an event handler.
 * 
 * @param varName - State variable name
 * @param valueExpr - JavaScript expression for the new value
 * @returns State update code
 * 
 * @example
 * ```typescript
 * generateStateUpdate('clickCount', 'state.clickCount + 1')
 * // Returns: "setClickCount(state.clickCount + 1);"
 * ```
 */
export function generateStateUpdate(varName: string, valueExpr: string): string {
  const setterName = `set${capitalize(varName)}`;
  return `${setterName}(${valueExpr});`;
}

/**
 * Generate state toggle code (for booleans)
 * 
 * @param varName - Boolean state variable name
 * @returns Toggle code
 * 
 * @example
 * ```typescript
 * generateStateToggle('isVisible')
 * // Returns: "setIsVisible(prev => !prev);"
 * ```
 */
export function generateStateToggle(varName: string): string {
  const setterName = `set${capitalize(varName)}`;
  return `${setterName}(prev => !prev);`;
}

/**
 * Generate state increment code (for numbers)
 * 
 * @param varName - Number state variable name
 * @param amount - Amount to increment by (default: 1)
 * @returns Increment code
 * 
 * @example
 * ```typescript
 * generateStateIncrement('clickCount', 1)
 * // Returns: "setClickCount(prev => prev + 1);"
 * ```
 */
export function generateStateIncrement(varName: string, amount: number = 1): string {
  const setterName = `set${capitalize(varName)}`;
  if (amount === 1) {
    return `${setterName}(prev => prev + 1);`;
  }
  return `${setterName}(prev => prev + ${amount});`;
}

/**
 * Generate state decrement code (for numbers)
 * 
 * @param varName - Number state variable name
 * @param amount - Amount to decrement by (default: 1)
 * @returns Decrement code
 */
export function generateStateDecrement(varName: string, amount: number = 1): string {
  const setterName = `set${capitalize(varName)}`;
  if (amount === 1) {
    return `${setterName}(prev => prev - 1);`;
  }
  return `${setterName}(prev => prev - ${amount});`;
}

/**
 * Generate state reset code
 * 
 * @param varName - State variable name
 * @param initialValue - Initial value to reset to
 * @param type - Variable type
 * @returns Reset code
 */
export function generateStateReset(
  varName: string,
  initialValue: string | number | boolean,
  type: StateVariableType
): string {
  const setterName = `set${capitalize(varName)}`;
  const value = formatInitialValue(initialValue, type);
  return `${setterName}(${value});`;
}

// ============================================================
// EXPORTS
// ============================================================

export default {
  generateStateCode,
  generateStateUpdate,
  generateStateToggle,
  generateStateIncrement,
  generateStateDecrement,
  generateStateReset,
};
