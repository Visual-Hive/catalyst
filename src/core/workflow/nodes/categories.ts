/**
 * @file categories.ts
 * @description Category metadata for organizing nodes in the UI palette
 * 
 * @architecture Phase 0, Task 0.3 - Node Type System
 * @created 2025-12-18
 * @author AI (Cline) + Human Review
 * @confidence 10/10 - Simple metadata definitions
 * 
 * @see src/core/workflow/nodes/types.ts - Type definitions
 * 
 * PROBLEM SOLVED:
 * - Need to organize 55+ nodes into logical categories
 * - UI palette needs category headers with icons and colors
 * - Need consistent ordering of categories
 * 
 * SOLUTION:
 * - Define CategoryMetadata for each of 8 categories
 * - Assign Heroicons and Tailwind colors
 * - Set display order for palette
 * 
 * @security-critical false
 * @performance-critical false
 */

import type { CategoryRegistry } from './types';

/**
 * Category metadata registry
 * Defines all categories with their display properties
 */
export const CATEGORY_REGISTRY: CategoryRegistry = {
  triggers: {
    id: 'triggers',
    name: 'Triggers',
    description: 'Workflow entry points (HTTP, webhooks, schedules)',
    icon: 'Bolt',
    color: 'bg-green-500',
    order: 1,
  },
  
  llm: {
    id: 'llm',
    name: 'LLM & AI',
    description: 'Language models and AI operations',
    icon: 'Sparkles',
    color: 'bg-purple-500',
    order: 2,
  },
  
  data: {
    id: 'data',
    name: 'Data Sources',
    description: 'Databases, vector stores, and data queries',
    icon: 'CircleStack',
    color: 'bg-blue-500',
    order: 3,
  },
  
  http: {
    id: 'http',
    name: 'HTTP & External',
    description: 'External API calls and integrations',
    icon: 'ArrowsRightLeft',
    color: 'bg-orange-500',
    order: 4,
  },
  
  control: {
    id: 'control',
    name: 'Control Flow',
    description: 'Branching, loops, and execution control',
    icon: 'ArrowPath',
    color: 'bg-yellow-500',
    order: 5,
  },
  
  transform: {
    id: 'transform',
    name: 'Transform',
    description: 'Data transformation and manipulation',
    icon: 'Wrench',
    color: 'bg-teal-500',
    order: 6,
  },
  
  streaming: {
    id: 'streaming',
    name: 'Streaming',
    description: 'Real-time streaming and server-sent events',
    icon: 'Signal',
    color: 'bg-pink-500',
    order: 7,
  },
  
  utilities: {
    id: 'utilities',
    name: 'Utilities',
    description: 'Helper nodes and utility functions',
    icon: 'Cog6Tooth',
    color: 'bg-gray-500',
    order: 8,
  },
};

/**
 * Get all categories sorted by display order
 * 
 * @returns Array of CategoryMetadata sorted by order
 * 
 * @example
 * ```typescript
 * const categories = getAllCategories();
 * categories.forEach(cat => {
 *   console.log(cat.name, cat.description);
 * });
 * ```
 */
export function getAllCategories() {
  return Object.values(CATEGORY_REGISTRY).sort((a, b) => a.order - b.order);
}

/**
 * Get category metadata by ID
 * 
 * @param id - Category ID
 * @returns CategoryMetadata or undefined
 */
export function getCategoryMetadata(id: string) {
  return CATEGORY_REGISTRY[id as keyof typeof CATEGORY_REGISTRY];
}
