/**
 * @file FlowCodeGenerator.ts
 * @description Converts logic flow definitions into executable JavaScript event handler code
 *
 * @architecture Phase 4, Task 4.4 - Event Binding & Code Generation
 * @created 2025-11-30
 * @author AI (Cline) + Human Review
 * @confidence 8/10 - Core code generation logic, needs thorough testing
 *
 * @see src/core/logic/types.ts - Flow and node type definitions
 * @see src/core/state/PageStateRuntime.ts - State management code generation
 * @see .implementation/phase-4-logic-editor/task-4.4-event-binding-codegen.md
 *
 * PROBLEM SOLVED:
 * - Convert visual flow definitions into JavaScript event handlers
 * - Generate clean, readable handler function code
 * - Support setState, alert, and console action nodes
 * - Handle execution order through topological sort
 *
 * SOLUTION:
 * - FlowCodeGenerator class processes Flow objects
 * - Generates handler functions with descriptive names
 * - Converts each node type to appropriate JavaScript code
 * - Uses topological sort for correct action ordering
 *
 * LEVEL 1.5 CONSTRAINTS:
 * - Only onClick handlers generated
 * - Only 3 action types: setState, alert, console
 * - Only static values (no expressions)
 * - Sequential execution (no branching)
 *
 * GENERATED CODE EXAMPLE:
 * ```typescript
 * const handleButtonClick = () => {
 *   setClickCount(5);
 *   alert("Button clicked!");
 *   console.log("Click event fired");
 * };
 * ```
 *
 * @security-critical false - generates code that will be bundled and executed in preview
 * @performance-critical false
 */

import type {
  Flow,
  FlowNode,
  FlowEdge,
  SetStateNode,
  AlertNode,
  ConsoleNode,
} from '../logic/types';
import {
  isSetStateNode,
  isAlertNode,
  isConsoleNode,
} from '../logic/types';

// ============================================================
// TYPES
// ============================================================

/**
 * Result of generating a single handler
 */
export interface GeneratedHandler {
  /** Handler function name (e.g., "handleButtonClick") */
  name: string;
  
  /** Generated function code as string */
  code: string;
  
  /** State setters used by this handler (e.g., ["setClickCount"]) */
  stateSetters: string[];
  
  /** Flow ID this handler was generated from */
  flowId: string;
  
  /** Component ID this handler is bound to */
  componentId: string;
}

/**
 * Result of generating all handlers for a manifest
 */
export interface FlowGenerationResult {
  /** All generated handlers */
  handlers: GeneratedHandler[];
  
  /** Combined list of state setters used (deduplicated) */
  stateSetters: string[];
  
  /** Any warnings during generation */
  warnings: string[];
  
  /** True if all flows generated successfully */
  success: boolean;
}

// ============================================================
// MAIN GENERATOR CLASS
// ============================================================

/**
 * FlowCodeGenerator - Converts logic flows to JavaScript handler code
 *
 * USAGE:
 * ```typescript
 * const generator = new FlowCodeGenerator();
 * 
 * // Generate single handler
 * const handler = generator.generateHandler(flow);
 * 
 * // Generate all handlers for a manifest
 * const result = generator.generateAll(flows);
 * ```
 *
 * OUTPUT:
 * - Handler functions as strings
 * - Names derived from flow name + component ID
 * - Action statements in correct execution order
 */
export class FlowCodeGenerator {
  // --------------------------------------------------------
  // PUBLIC API
  // --------------------------------------------------------

  /**
   * Generate handlers for all flows in a manifest
   *
   * @param flows - Map of flow ID to flow definition
   * @returns FlowGenerationResult with all handlers and metadata
   */
  generateAll(flows: Record<string, Flow>): FlowGenerationResult {
    const handlers: GeneratedHandler[] = [];
    const allSetters = new Set<string>();
    const warnings: string[] = [];
    let success = true;

    // Process each flow
    for (const flow of Object.values(flows)) {
      try {
        const handler = this.generateHandler(flow);
        handlers.push(handler);
        
        // Collect state setters
        handler.stateSetters.forEach((s) => allSetters.add(s));
      } catch (error) {
        // Log warning but continue with other flows
        const message = error instanceof Error ? error.message : String(error);
        warnings.push(`Failed to generate handler for flow "${flow.name}" (${flow.id}): ${message}`);
        success = false;
      }
    }

    return {
      handlers,
      stateSetters: Array.from(allSetters).sort(),
      warnings,
      success: success || handlers.length > 0, // Partial success is still success
    };
  }

  /**
   * Generate handler code for a single flow
   *
   * @param flow - Flow definition to convert
   * @returns GeneratedHandler with name, code, and metadata
   *
   * @example
   * ```typescript
   * const handler = generator.generateHandler(buttonClickFlow);
   * // handler.code = "const handleButtonClick = () => {\n  setCount(1);\n};"
   * ```
   */
  generateHandler(flow: Flow): GeneratedHandler {
    // Generate handler name from flow
    const handlerName = this.generateHandlerName(flow);
    
    // Get action nodes (exclude event trigger node)
    const actionNodes = flow.nodes.filter((n) => n.type !== 'event');
    
    // Sort by execution order (based on edge connections)
    const sortedNodes = this.topologicalSort(actionNodes, flow.edges);
    
    // Track state setters used
    const stateSetters: string[] = [];
    
    // Generate code for each action
    const actionStatements = sortedNodes
      .map((node) => this.generateNodeCode(node, stateSetters))
      .filter((code) => code.length > 0);
    
    // Build the complete handler function
    const code = this.buildHandlerFunction(handlerName, actionStatements);
    
    return {
      name: handlerName,
      code,
      stateSetters,
      flowId: flow.id,
      componentId: flow.trigger.componentId,
    };
  }

  /**
   * Get handler name for a component's onClick event
   * Used by JSXBuilder to reference the handler
   *
   * @param flows - All flows in manifest
   * @param componentId - Component to find handler for
   * @returns Handler name or null if no onClick handler
   */
  getHandlerNameForComponent(
    flows: Record<string, Flow>,
    componentId: string
  ): string | null {
    // Find flow triggered by this component's onClick
    const flow = Object.values(flows).find(
      (f) => f.trigger.componentId === componentId && f.trigger.type === 'onClick'
    );
    
    if (!flow) {
      return null;
    }
    
    return this.generateHandlerName(flow);
  }

  // --------------------------------------------------------
  // HANDLER NAME GENERATION
  // --------------------------------------------------------

  /**
   * Generate a unique handler function name from flow
   *
   * PUBLIC API: This method is used by both FlowCodeGenerator and FileManager
   * to ensure consistent handler names across code generation and prop wiring.
   *
   * Format: handle{FlowNamePascalCase}
   *
   * @param flow - Flow to generate name for
   * @returns Handler function name (e.g., "handleButtonClick")
   *
   * @example
   * ```typescript
   * const generator = new FlowCodeGenerator();
   * const name = generator.generateHandlerName(flow);
   * // name = "handleButtonClick"
   * ```
   */
  public generateHandlerName(flow: Flow): string {
    // Convert flow name to PascalCase
    const pascalName = flow.name
      .replace(/[^a-zA-Z0-9\s]/g, '') // Remove special chars
      .split(/\s+/) // Split on whitespace
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join('');
    
    // If name is empty or just whitespace, use component ID
    const baseName = pascalName || 'Click';
    
    // Add handler prefix
    return `handle${baseName}`;
  }

  // --------------------------------------------------------
  // NODE CODE GENERATION
  // --------------------------------------------------------

  /**
   * Generate JavaScript code for a single node
   *
   * @param node - Flow node to convert
   * @param stateSetters - Array to push setter names to (mutated)
   * @returns JavaScript statement string
   */
  private generateNodeCode(node: FlowNode, stateSetters: string[]): string {
    // Use type guards to determine node type and generate appropriate code
    if (isSetStateNode(node)) {
      return this.generateSetStateCode(node, stateSetters);
    }
    
    if (isAlertNode(node)) {
      return this.generateAlertCode(node);
    }
    
    if (isConsoleNode(node)) {
      return this.generateConsoleCode(node);
    }
    
    // Unknown node type - skip with warning comment
    return `// Unknown node type: ${node.type}`;
  }

  /**
   * Generate setState action code
   *
   * @param node - SetState node
   * @param stateSetters - Array to track setter names
   * @returns Statement like "setCount(5);"
   */
  private generateSetStateCode(node: SetStateNode, stateSetters: string[]): string {
    const { variable, value } = node.config;
    
    // Generate setter function name
    const setterName = `set${this.capitalize(variable)}`;
    
    // Track this setter for import/declaration
    if (!stateSetters.includes(setterName)) {
      stateSetters.push(setterName);
    }
    
    // Format the value based on type
    const valueCode = this.formatValue(value.value);
    
    return `    ${setterName}(${valueCode});`;
  }

  /**
   * Generate alert action code
   *
   * @param node - Alert node
   * @returns Statement like 'alert("Hello!");'
   */
  private generateAlertCode(node: AlertNode): string {
    const messageCode = this.formatValue(node.config.message.value);
    return `    alert(${messageCode});`;
  }

  /**
   * Generate console action code
   *
   * @param node - Console node
   * @returns Statement like 'console.log("Message");'
   */
  private generateConsoleCode(node: ConsoleNode): string {
    const { level, message } = node.config;
    const messageCode = this.formatValue(message.value);
    return `    console.${level}(${messageCode});`;
  }

  // --------------------------------------------------------
  // FUNCTION BUILDING
  // --------------------------------------------------------

  /**
   * Build complete handler function from name and statements
   *
   * @param name - Handler function name
   * @param statements - Array of JavaScript statements
   * @returns Complete function code
   */
  private buildHandlerFunction(name: string, statements: string[]): string {
    // Handle empty flows gracefully
    const body = statements.length > 0
      ? statements.join('\n')
      : '    // No actions defined';
    
    return `  /**
   * @rise:handler
   * Auto-generated event handler from visual logic flow
   */
  const ${name} = () => {
${body}
  };`;
  }

  // --------------------------------------------------------
  // TOPOLOGICAL SORT
  // --------------------------------------------------------

  /**
   * Sort nodes by execution order based on edge connections
   *
   * Uses Kahn's algorithm for topological sorting.
   * For Level 1.5, this is usually linear (event → action),
   * but supports future multi-action flows.
   *
   * @param nodes - Action nodes to sort
   * @param edges - Edges defining connections
   * @returns Nodes in execution order
   */
  private topologicalSort(nodes: FlowNode[], edges: FlowEdge[]): FlowNode[] {
    // Build node lookup and adjacency
    const nodeMap = new Map(nodes.map((n) => [n.id, n]));
    const inDegree = new Map<string, number>();
    const adjacency = new Map<string, string[]>();
    
    // Initialize
    nodes.forEach((n) => {
      inDegree.set(n.id, 0);
      adjacency.set(n.id, []);
    });
    
    // Count incoming edges for action nodes only
    edges.forEach((edge) => {
      // Only consider edges that target action nodes (not event nodes)
      if (nodeMap.has(edge.target)) {
        const currentDegree = inDegree.get(edge.target) || 0;
        inDegree.set(edge.target, currentDegree + 1);
      }
      
      // Build adjacency for action nodes
      if (nodeMap.has(edge.source)) {
        const adjacent = adjacency.get(edge.source) || [];
        adjacent.push(edge.target);
        adjacency.set(edge.source, adjacent);
      }
    });
    
    // Find nodes with no incoming edges (from other action nodes)
    const queue: string[] = [];
    inDegree.forEach((degree, nodeId) => {
      if (degree === 0) {
        queue.push(nodeId);
      }
    });
    
    // Process queue (Kahn's algorithm)
    const sorted: FlowNode[] = [];
    while (queue.length > 0) {
      const nodeId = queue.shift()!;
      const node = nodeMap.get(nodeId);
      
      if (node) {
        sorted.push(node);
        
        // Reduce in-degree for adjacent nodes
        const adjacent = adjacency.get(nodeId) || [];
        adjacent.forEach((adjId) => {
          const newDegree = (inDegree.get(adjId) || 0) - 1;
          inDegree.set(adjId, newDegree);
          
          if (newDegree === 0) {
            queue.push(adjId);
          }
        });
      }
    }
    
    // If we couldn't sort all nodes, there might be a cycle
    // Fall back to original order
    if (sorted.length !== nodes.length) {
      console.warn('[FlowCodeGenerator] Topological sort incomplete, using insertion order');
      return nodes;
    }
    
    return sorted;
  }

  // --------------------------------------------------------
  // UTILITY METHODS
  // --------------------------------------------------------

  /**
   * Format a value for JavaScript code
   *
   * @param value - Value to format
   * @returns JavaScript literal string
   */
  private formatValue(value: string | number | boolean): string {
    if (typeof value === 'string') {
      // Use JSON.stringify for proper string escaping
      return JSON.stringify(value);
    }
    
    // Numbers and booleans can be used directly
    return String(value);
  }

  /**
   * Capitalize first letter of string
   *
   * @param str - String to capitalize
   * @returns Capitalized string
   */
  private capitalize(str: string): string {
    if (!str) return str;
    return str.charAt(0).toUpperCase() + str.slice(1);
  }
}

// ============================================================
// SINGLETON & EXPORTS
// ============================================================

/**
 * Singleton instance for convenience
 */
export const flowCodeGenerator = new FlowCodeGenerator();

/**
 * Quick helper to generate handler for a single flow
 */
export function generateFlowHandler(flow: Flow): GeneratedHandler {
  return flowCodeGenerator.generateHandler(flow);
}

/**
 * Quick helper to generate all handlers
 */
export function generateAllFlowHandlers(flows: Record<string, Flow>): FlowGenerationResult {
  return flowCodeGenerator.generateAll(flows);
}

export default FlowCodeGenerator;
