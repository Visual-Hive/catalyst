/**
 * @file WorkflowNodePalette.tsx
 * @description Categorized, searchable palette of all 55+ workflow node types
 * 
 * @architecture Phase 0, Task 0.5 - Canvas Adaptation
 * @created 2025-12-18
 * @author AI (Cline) + Human Review
 * @confidence 8/10 - Complex UI with search/filter/category logic
 * 
 * @see src/renderer/components/WorkflowCanvas/WorkflowCanvas.tsx - Parent
 * @see src/core/workflow/nodes/registry.ts - Node metadata source
 * 
 * PROBLEM SOLVED:
 * - Need to display 55+ node types in discoverable way
 * - Flat list would be overwhelming and hard to navigate
 * - Users need to find nodes quickly via search or browsing
 * - Must distinguish implemented vs stub nodes
 * 
 * SOLUTION:
 * - Organize nodes into 8 collapsible categories
 * - Search box filters across all nodes
 * - Triggers and LLM categories expanded by default
 * - Drag-and-drop to canvas
 * - Visual indicators for stub vs implemented nodes
 * - Category counts in headers
 * 
 * DESIGN DECISIONS:
 * - Collapsible sections to reduce visual clutter
 * - Search highlights relevant categories
 * - Stub nodes always visible with indicators (per user preference)
 * - Color-coded by category for quick identification
 * 
 * @security-critical false
 * @performance-critical false - User-driven interactions
 */

import React, { useState, useMemo } from 'react';
import { 
  getNodesGroupedByCategory, 
  searchNodes, 
  getCategoryMetadata 
} from '../../../core/workflow/nodes';
import type { NodeMetadata, NodeCategory } from '../../../core/workflow/nodes';

// ============================================================
// TYPES
// ============================================================

/**
 * Category expansion state
 * Maps category name to expanded boolean
 */
type CategoryExpansion = Record<NodeCategory, boolean>;

// ============================================================
// MAIN COMPONENT
// ============================================================

/**
 * WorkflowNodePalette - Categorized palette of workflow nodes
 * 
 * Displays all 55+ node types organized into 8 categories:
 * - 🟢 Triggers (6 nodes)
 * - 🟣 LLM/AI (8 nodes)
 * - 🔵 Data Sources (8 nodes)
 * - 🟠 HTTP/External (4 nodes)
 * - 🟡 Control Flow (8 nodes)
 * - 🔵 Transform (8 nodes)
 * - 🩷 Streaming (5 nodes)
 * - ⚪ Utilities (8 nodes)
 * 
 * Features:
 * - Search box filters nodes by name/description
 * - Collapsible category sections
 * - Drag-and-drop to canvas
 * - Stub node indicators
 * - Phase badges
 * 
 * @example
 * ```tsx
 * <Panel position="top-left">
 *   <WorkflowNodePalette />
 * </Panel>
 * ```
 */
export function WorkflowNodePalette() {
  // Search query state
  const [searchQuery, setSearchQuery] = useState('');
  
  // Category expansion state
  // Triggers and LLM expanded by default (per user preference)
  const [expandedCategories, setExpandedCategories] = useState<CategoryExpansion>({
    triggers: true,
    llm: true,
    data: false,
    http: false,
    control: false,
    transform: false,
    streaming: false,
    utilities: false,
  });
  
  // Get all nodes grouped by category
  const allNodesByCategory = useMemo(() => getNodesGroupedByCategory(), []);
  
  // Filter nodes based on search query
  const filteredNodesByCategory = useMemo(() => {
    // If no search query, return all nodes
    if (!searchQuery.trim()) {
      return allNodesByCategory;
    }
    
    // Search across all nodes
    const searchResults = searchNodes(searchQuery);
    
    // Group search results by category
    const filtered: Record<NodeCategory, NodeMetadata[]> = {
      triggers: [],
      llm: [],
      data: [],
      http: [],
      control: [],
      transform: [],
      streaming: [],
      utilities: [],
    };
    
    searchResults.forEach(node => {
      filtered[node.category].push(node);
    });
    
    return filtered;
  }, [searchQuery, allNodesByCategory]);
  
  // Toggle category expansion
  const toggleCategory = (category: NodeCategory) => {
    setExpandedCategories(prev => ({
      ...prev,
      [category]: !prev[category],
    }));
  };
  
  // Auto-expand categories with search results
  // When user searches, expand categories that have matches
  const shouldShowCategory = (category: NodeCategory): boolean => {
    const nodes = filteredNodesByCategory[category];
    return nodes.length > 0;
  };
  
  // Order of categories to display
  const categoryOrder: NodeCategory[] = [
    'triggers',
    'llm',
    'data',
    'http',
    'control',
    'transform',
    'streaming',
    'utilities',
  ];
  
  return (
    <div className="bg-white rounded-lg shadow-lg border border-gray-200 w-64 max-h-[80vh] flex flex-col">
      {/* Header */}
      <div className="p-3 border-b border-gray-200">
        <h3 className="text-sm font-semibold text-gray-800 mb-2">
          Node Palette
        </h3>
        
        {/* Search box */}
        <input
          type="text"
          placeholder="Search nodes..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      
      {/* Scrollable category list */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {categoryOrder.map(category => {
          const nodes = filteredNodesByCategory[category];
          const categoryMeta = getCategoryMetadata(category);
          const isExpanded = expandedCategories[category] || !!searchQuery.trim();
          const shouldShow = shouldShowCategory(category);
          
          // Hide category if no nodes match search
          if (!shouldShow && searchQuery.trim()) {
            return null;
          }
          
          return (
            <CategorySection
              key={category}
              category={category}
              categoryMeta={categoryMeta}
              nodes={nodes}
              isExpanded={isExpanded}
              onToggle={() => toggleCategory(category)}
            />
          );
        })}
        
        {/* No results message */}
        {searchQuery.trim() && Object.values(filteredNodesByCategory).every(n => n.length === 0) && (
          <div className="text-center py-8 text-gray-400 text-sm">
            No nodes found for "{searchQuery}"
          </div>
        )}
      </div>
      
      {/* Footer info */}
      <div className="p-2 border-t border-gray-200 text-xs text-gray-400">
        Drag nodes onto canvas
      </div>
    </div>
  );
}

// ============================================================
// CATEGORY SECTION COMPONENT
// ============================================================

interface CategorySectionProps {
  category: NodeCategory;
  categoryMeta: { name: string; icon: string; description: string };
  nodes: NodeMetadata[];
  isExpanded: boolean;
  onToggle: () => void;
}

/**
 * CategorySection - Collapsible section for a node category
 * 
 * Displays category header with expand/collapse button and
 * list of nodes when expanded.
 */
function CategorySection({
  category,
  categoryMeta,
  nodes,
  isExpanded,
  onToggle,
}: CategorySectionProps) {
  // Count implemented vs stub nodes
  const implementedCount = nodes.filter(n => n.implemented).length;
  const totalCount = nodes.length;
  
  return (
    <div className="border border-gray-200 rounded">
      {/* Category header - clickable to expand/collapse */}
      <button
        onClick={onToggle}
        className="w-full px-3 py-2 flex items-center justify-between hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="text-base">{categoryMeta.icon}</span>
          <span className="text-sm font-medium text-gray-700">
            {categoryMeta.name}
          </span>
          <span className="text-xs text-gray-400">
            ({implementedCount}/{totalCount})
          </span>
        </div>
        
        {/* Expand/collapse icon */}
        <span className="text-gray-400 text-xs">
          {isExpanded ? '▼' : '▶'}
        </span>
      </button>
      
      {/* Node list - shown when expanded */}
      {isExpanded && (
        <div className="border-t border-gray-200 bg-gray-50 p-2 space-y-1">
          {nodes.map(node => (
            <PaletteNodeItem key={node.type} node={node} />
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================
// PALETTE NODE ITEM COMPONENT
// ============================================================

interface PaletteNodeItemProps {
  node: NodeMetadata;
}

/**
 * PaletteNodeItem - Individual draggable node in palette
 * 
 * Shows node name, icon, and implementation status.
 * Draggable to canvas via React Flow drag-and-drop.
 */
function PaletteNodeItem({ node }: PaletteNodeItemProps) {
  /**
   * Handle drag start - store node type in transfer data
   * React Flow looks for 'application/reactflow' data type
   */
  const onDragStart = (event: React.DragEvent<HTMLDivElement>) => {
    event.dataTransfer.setData('application/reactflow', node.type);
    event.dataTransfer.effectAllowed = 'move';
  };
  
  // Get color based on category
  const colorClass = getCategoryColor(node.category);
  
  // Stub nodes get grayed appearance
  const stubClass = !node.implemented ? 'opacity-60 grayscale' : '';
  
  return (
    <div
      className={`
        px-2 py-1.5 rounded border cursor-grab hover:shadow-sm transition-all
        ${colorClass}
        ${stubClass}
      `}
      draggable
      onDragStart={onDragStart}
      title={`${node.description}${!node.implemented ? ` (Phase ${node.phase})` : ''}`}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="text-sm">{getNodeIcon(node.icon)}</span>
          <span className="text-xs font-medium text-gray-700 truncate">
            {node.name}
          </span>
        </div>
        
        {/* Badges */}
        <div className="flex items-center gap-1 flex-shrink-0">
          {node.implemented ? (
            <span className="text-[10px] text-green-600" title="Implemented">✅</span>
          ) : (
            <span className="text-[10px] text-gray-400" title={`Phase ${node.phase}`}>🚧</span>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// HELPER FUNCTIONS
// ============================================================

/**
 * Get Tailwind color classes for category
 */
function getCategoryColor(category: NodeCategory): string {
  const colorMap: Record<NodeCategory, string> = {
    triggers: 'bg-green-50 border-green-200 hover:bg-green-100',
    llm: 'bg-purple-50 border-purple-200 hover:bg-purple-100',
    data: 'bg-blue-50 border-blue-200 hover:bg-blue-100',
    http: 'bg-orange-50 border-orange-200 hover:bg-orange-100',
    control: 'bg-yellow-50 border-yellow-200 hover:bg-yellow-100',
    transform: 'bg-teal-50 border-teal-200 hover:bg-teal-100',
    streaming: 'bg-pink-50 border-pink-200 hover:bg-pink-100',
    utilities: 'bg-gray-50 border-gray-200 hover:bg-gray-100',
  };
  
  return colorMap[category] || colorMap.utilities;
}

/**
 * Get emoji icon for node
 * Simplified mapping for palette display
 */
function getNodeIcon(iconName: string): string {
  const iconMap: Record<string, string> = {
    GlobeAlt: '🌐',
    Globe: '🌐',
    Clock: '⏰',
    Sparkles: '✨',
    CpuChip: '🤖',
    MagnifyingGlass: '🔍',
    CircleStack: '🗄️',
    ArrowRightCircle: '➡️',
    ArrowTopRightOnSquare: '↗️',
    Wrench: '🔧',
    Signal: '📡',
    DocumentText: '📄',
  };
  
  return iconMap[iconName] || '📦';
}

export default WorkflowNodePalette;
