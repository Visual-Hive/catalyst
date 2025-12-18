/**
 * @file types.ts
 * @description Type definitions for node metadata and registry system
 * 
 * @architecture Phase 0, Task 0.3 - Node Type System
 * @created 2025-12-18
 * @author AI (Cline) + Human Review
 * @confidence 9/10 - Clear type definitions, standard patterns
 * 
 * @see src/core/workflow/types.ts - Core workflow types
 * @see docs/Catalyst documentation/CATALYST_PHASE_0_TASKS.md - Task 0.3 details
 * 
 * PROBLEM SOLVED:
 * - Need metadata system for 55+ node types
 * - UI needs icons, colors, descriptions for each node
 * - Need to know input/output handles for visual connections
 * - Need to organize nodes into categories for palette
 * 
 * SOLUTION:
 * - NodeMetadata interface with all display information
 * - HandleDefinition for input/output ports
 * - NodeCategory enum for organization
 * - Registry pattern for centralized metadata access
 * 
 * @security-critical false
 * @performance-critical false
 */

import type { z } from 'zod';
import type { NodeType } from '../types';

// ============================================================
// NODE CATEGORIES
// ============================================================

/**
 * Node category for UI organization
 * Each category represents a group of related node types
 */
export type NodeCategory =
  | 'triggers'      // Entry points for workflows
  | 'llm'           // LLM and AI operations
  | 'data'          // Database and vector operations
  | 'http'          // HTTP and external API calls
  | 'control'       // Control flow (if/loop/parallel)
  | 'transform'     // Data transformation
  | 'streaming'     // Real-time streaming
  | 'utilities';    // Helper nodes

// ============================================================
// HANDLE DEFINITIONS
// ============================================================

/**
 * Handle (connection port) definition
 * Defines input/output ports for visual node connections
 */
export interface HandleDefinition {
  id: string;                           // Unique handle ID
  name: string;                         // Display name
  type: 'default' | 'conditional';      // Handle type (for conditional branching)
  required?: boolean;                   // Whether connection is required
}

// ============================================================
// NODE METADATA
// ============================================================

/**
 * Complete metadata for a node type
 * Used by the UI to render nodes in the palette and canvas
 * 
 * @example
 * ```typescript
 * const metadata: NodeMetadata = {
 *   type: 'anthropicCompletion',
 *   category: 'llm',
 *   name: 'Claude (Anthropic)',
 *   description: 'Claude AI completions with streaming support',
 *   icon: 'SparklesIcon',
 *   color: 'bg-purple-500',
 *   inputs: [{ id: 'input', name: 'Input', type: 'default' }],
 *   outputs: [{ id: 'output', name: 'Response', type: 'default' }],
 *   configSchema: anthropicCompletionConfigSchema,
 * };
 * ```
 */
export interface NodeMetadata {
  // Identity
  type: NodeType;                       // Node type from types.ts enum
  category: NodeCategory;               // Category for organization
  
  // Display
  name: string;                         // User-facing display name
  description: string;                  // Short description for tooltips
  icon: string;                         // Heroicon name (without 'Icon' suffix)
  color: string;                        // Tailwind bg-* color class
  
  // Connections
  inputs: HandleDefinition[];           // Input handles (ports)
  outputs: HandleDefinition[];          // Output handles (ports)
  
  // Configuration
  configSchema: z.ZodTypeAny;           // Zod schema for validation
  
  // Documentation
  documentation?: string;               // Optional detailed documentation
  examples?: string[];                  // Optional usage examples
  
  // Status
  implemented: boolean;                 // Whether node is fully implemented
  phase?: number;                       // Implementation phase (0-6)
}

// ============================================================
// CATEGORY METADATA
// ============================================================

/**
 * Category metadata for UI organization
 */
export interface CategoryMetadata {
  id: NodeCategory;
  name: string;
  description: string;
  icon: string;                         // Heroicon name
  color: string;                        // Tailwind color class
  order: number;                        // Display order in palette
}

// ============================================================
// REGISTRY TYPES
// ============================================================

/**
 * Node registry mapping all node types to their metadata
 */
export type NodeRegistry = Record<NodeType, NodeMetadata>;

/**
 * Category registry mapping categories to their metadata
 */
export type CategoryRegistry = Record<NodeCategory, CategoryMetadata>;
