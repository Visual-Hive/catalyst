/**
 * @file index.ts
 * @description Main exports and helper functions for the node type system
 * 
 * @architecture Phase 0, Task 0.3 - Node Type System
 * @created 2025-12-18
 * @author AI (Cline) + Human Review
 * @confidence 9/10 - Clean helper functions, well tested
 * 
 * @see src/core/workflow/nodes/registry.ts - Node registry
 * @see src/core/workflow/nodes/categories.ts - Category definitions
 * 
 * PROBLEM SOLVED:
 * - Need convenient API for querying node metadata
 * - UI needs to filter nodes by category
 * - Need to search nodes by name/description
 * - Need to validate node types
 * 
 * SOLUTION:
 * - Helper functions for common operations
 * - Centralized exports for clean imports
 * - Type guards for runtime validation
 * 
 * @security-critical false
 * @performance-critical false
 */

import type { NodeType } from '../types';
import type { NodeMetadata, NodeCategory } from './types';
import { NODE_REGISTRY } from './registry';
import { CATEGORY_REGISTRY, getAllCategories, getCategoryMetadata } from './categories';

// ============================================================
// RE-EXPORTS
// ============================================================

export { NODE_REGISTRY } from './registry';
export { CATEGORY_REGISTRY, getAllCategories, getCategoryMetadata } from './categories';
export type { NodeMetadata, NodeCategory, HandleDefinition, CategoryMetadata } from './types';

// ============================================================
// NODE QUERY FUNCTIONS
// ============================================================

/**
 * Get node metadata by type
 * 
 * @param type - Node type
 * @returns NodeMetadata or undefined if not found
 * 
 * @example
 * ```typescript
 * const metadata = getNodeMetadata('anthropicCompletion');
 * console.log(metadata.name); // "Claude (Anthropic)"
 * ```
 */
export function getNodeMetadata(type: NodeType): NodeMetadata | undefined {
  return NODE_REGISTRY[type];
}

/**
 * Get all nodes in a specific category
 * 
 * @param category - Node category
 * @returns Array of NodeMetadata for the category
 * 
 * @example
 * ```typescript
 * const llmNodes = getNodesByCategory('llm');
 * llmNodes.forEach(node => console.log(node.name));
 * ```
 */
export function getNodesByCategory(category: NodeCategory): NodeMetadata[] {
  return Object.values(NODE_REGISTRY).filter(node => node.category === category);
}

/**
 * Get all implemented nodes (core nodes from Phase 0)
 * 
 * @returns Array of NodeMetadata for implemented nodes
 * 
 * @example
 * ```typescript
 * const implemented = getImplementedNodes();
 * console.log(`${implemented.length} nodes ready`); // "10 nodes ready"
 * ```
 */
export function getImplementedNodes(): NodeMetadata[] {
  return Object.values(NODE_REGISTRY).filter(node => node.implemented);
}

/**
 * Get all stub nodes (not yet implemented)
 * 
 * @returns Array of NodeMetadata for stub nodes
 */
export function getStubNodes(): NodeMetadata[] {
  return Object.values(NODE_REGISTRY).filter(node => !node.implemented);
}

/**
 * Get nodes by implementation phase
 * 
 * @param phase - Phase number (0-6)
 * @returns Array of NodeMetadata for the phase
 * 
 * @example
 * ```typescript
 * const phase0 = getNodesByPhase(0); // Core nodes
 * const phase2 = getNodesByPhase(2); // Streaming nodes
 * ```
 */
export function getNodesByPhase(phase: number): NodeMetadata[] {
  return Object.values(NODE_REGISTRY).filter(node => node.phase === phase);
}

/**
 * Search nodes by name or description
 * Case-insensitive partial match
 * 
 * @param query - Search query
 * @returns Array of NodeMetadata matching the query
 * 
 * @example
 * ```typescript
 * const results = searchNodes('claude');
 * // Returns anthropicCompletion node
 * 
 * const llmResults = searchNodes('completion');
 * // Returns all LLM completion nodes
 * ```
 */
export function searchNodes(query: string): NodeMetadata[] {
  const lowerQuery = query.toLowerCase();
  
  return Object.values(NODE_REGISTRY).filter(node => {
    return (
      node.name.toLowerCase().includes(lowerQuery) ||
      node.description.toLowerCase().includes(lowerQuery) ||
      node.type.toLowerCase().includes(lowerQuery)
    );
  });
}

/**
 * Get all node types as array
 * 
 * @returns Array of all NodeType values
 */
export function getAllNodeTypes(): NodeType[] {
  return Object.keys(NODE_REGISTRY) as NodeType[];
}

/**
 * Check if a string is a valid node type
 * Type guard function
 * 
 * @param type - String to check
 * @returns true if valid NodeType
 * 
 * @example
 * ```typescript
 * if (isValidNodeType(userInput)) {
 *   const metadata = getNodeMetadata(userInput);
 * }
 * ```
 */
export function isValidNodeType(type: string): type is NodeType {
  return type in NODE_REGISTRY;
}

/**
 * Check if a node type is implemented
 * 
 * @param type - Node type to check
 * @returns true if node is fully implemented
 * 
 * @example
 * ```typescript
 * if (isNodeImplemented('anthropicCompletion')) {
 *   // Can generate code for this node
 * }
 * ```
 */
export function isNodeImplemented(type: NodeType): boolean {
  const metadata = NODE_REGISTRY[type];
  return metadata ? metadata.implemented : false;
}

/**
 * Get node count statistics
 * 
 * @returns Object with node counts by category and status
 * 
 * @example
 * ```typescript
 * const stats = getNodeStats();
 * console.log(stats.total); // 55
 * console.log(stats.implemented); // 10
 * console.log(stats.byCategory.llm); // 8
 * ```
 */
export function getNodeStats() {
  const allNodes = Object.values(NODE_REGISTRY);
  
  const byCategory: Record<NodeCategory, number> = {
    triggers: 0,
    llm: 0,
    data: 0,
    http: 0,
    control: 0,
    transform: 0,
    streaming: 0,
    utilities: 0,
  };
  
  const byPhase: Record<number, number> = {};
  
  allNodes.forEach(node => {
    byCategory[node.category]++;
    
    if (node.phase !== undefined) {
      byPhase[node.phase] = (byPhase[node.phase] || 0) + 1;
    }
  });
  
  return {
    total: allNodes.length,
    implemented: allNodes.filter(n => n.implemented).length,
    stub: allNodes.filter(n => !n.implemented).length,
    byCategory,
    byPhase,
  };
}

/**
 * Get nodes grouped by category
 * Useful for rendering node palette
 * 
 * @returns Map of category to nodes array
 * 
 * @example
 * ```typescript
 * const grouped = getNodesGroupedByCategory();
 * 
 * Object.entries(grouped).forEach(([category, nodes]) => {
 *   console.log(`${category}: ${nodes.length} nodes`);
 * });
 * ```
 */
export function getNodesGroupedByCategory(): Record<NodeCategory, NodeMetadata[]> {
  const grouped: Record<NodeCategory, NodeMetadata[]> = {
    triggers: [],
    llm: [],
    data: [],
    http: [],
    control: [],
    transform: [],
    streaming: [],
    utilities: [],
  };
  
  Object.values(NODE_REGISTRY).forEach(node => {
    grouped[node.category].push(node);
  });
  
  return grouped;
}

/**
 * Validate node configuration against schema
 * 
 * @param type - Node type
 * @param config - Configuration to validate
 * @returns Validation result with success flag and errors
 * 
 * @example
 * ```typescript
 * const result = validateNodeConfig('anthropicCompletion', {
 *   model: 'claude-sonnet-4-5-20250514',
 *   messages: [{ role: 'user', content: 'Hello' }],
 * });
 * 
 * if (result.success) {
 *   console.log('Config is valid');
 * } else {
 *   console.error('Validation errors:', result.errors);
 * }
 * ```
 */
export function validateNodeConfig(type: NodeType, config: unknown) {
  const metadata = NODE_REGISTRY[type];
  
  if (!metadata) {
    return {
      success: false,
      errors: [`Unknown node type: ${type}`],
    };
  }
  
  const result = metadata.configSchema.safeParse(config);
  
  if (result.success) {
    return {
      success: true,
      errors: null,
    };
  } else {
    return {
      success: false,
      errors: result.error.issues.map((err) => {
        const path = err.path.join('.');
        return `${path}: ${err.message}`;
      }),
    };
  }
}
