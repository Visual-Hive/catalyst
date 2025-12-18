/**
 * @file ComponentNode.tsx
 * @description Single node in the component tree
 * 
 * @architecture Phase 2, Task 2.1 - Component Tree UI
 * @created 2025-11-25
 * @author AI (Cline) + Human Review
 * @confidence 9/10 - Adapted from FileTree/TreeNode.tsx
 * 
 * PROBLEM SOLVED:
 * - Render individual component in tree hierarchy
 * - Show expand/collapse affordance
 * - Visual indentation based on depth
 * - Selection and hover states
 * 
 * SOLUTION:
 * - Similar to FileTree TreeNode
 * - Depth-based left padding
 * - Chevron for expand/collapse
 * - Click to select, right-click for context menu
 * 
 * @performance O(1) rendering per node
 * @security-critical false
 * @performance-critical true - rendered for each visible component
 */

import React, { useCallback } from 'react';
import { ChevronRightIcon } from '@heroicons/react/24/outline';
import type { ComponentTreeNode } from '../../../core/legacy-manifest/types';
import { ComponentIcon } from './ComponentIcon';

/**
 * Component node props
 */
interface ComponentNodeProps {
  node: ComponentTreeNode;
  onToggleExpand: (id: string) => void;
  onSelect: (id: string) => void;
  onContextMenu?: (node: ComponentTreeNode, event: React.MouseEvent) => void;
}

/**
 * ComponentNode component
 * 
 * Renders a single component in the tree with:
 * - Indentation based on depth
 * - Expand/collapse chevron if has children
 * - Component icon
 * - Component display name and type
 * - Selection highlight
 * - Hover state
 * 
 * INTERACTION:
 * - Click: Select component
 * - Right-click: Show context menu (future)
 * - Click chevron: Expand/collapse
 * 
 * @param node - Component tree node to render
 * @param onToggleExpand - Called when chevron clicked
 * @param onSelect - Called when node clicked
 * @param onContextMenu - Called on right-click (optional)
 * 
 * @returns TreeNode element
 * 
 * @example
 * ```tsx
 * <ComponentNode
 *   node={componentNode}
 *   onToggleExpand={handleToggle}
 *   onSelect={handleSelect}
 * />
 * ```
 */
export function ComponentNode({
  node,
  onToggleExpand,
  onSelect,
  onContextMenu,
}: ComponentNodeProps) {
  /**
   * Handle click on node (select)
   * Prevents event from bubbling to parent nodes
   */
  const handleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect(node.id);
  }, [node.id, onSelect]);

  /**
   * Handle click on expand/collapse chevron
   * Prevents selection when toggling expansion
   */
  const handleToggleExpand = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleExpand(node.id);
  }, [node.id, onToggleExpand]);

  /**
   * Handle right-click (context menu)
   */
  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onContextMenu) {
      onContextMenu(node, e);
    }
  }, [node, onContextMenu]);

  // Calculate indentation based on depth
  // 16px per level (pl-4 = 1rem = 16px per Tailwind default)
  const indentClass = `pl-${node.depth * 4}`;
  const indentStyle = { paddingLeft: `${node.depth * 16}px` };

  // Determine if we show the chevron
  const showChevron = node.hasChildren;

  // Chevron rotation based on expanded state
  const chevronRotation = node.isExpanded ? 'rotate-90' : '';

  return (
    <div
      className={`
        flex items-center gap-1 px-2 py-1 cursor-pointer
        hover:bg-gray-100 transition-colors
        ${node.isSelected ? 'bg-blue-50 border-l-2 border-l-blue-500' : ''}
      `}
      style={indentStyle}
      onClick={handleClick}
      onContextMenu={handleContextMenu}
      title={`${node.displayName} (${node.type})`}
    >
      {/* Expand/Collapse Chevron */}
      <div className="w-4 h-4 flex items-center justify-center flex-shrink-0">
        {showChevron ? (
          <button
            onClick={handleToggleExpand}
            className="p-0.5 rounded hover:bg-gray-200 transition-colors"
            aria-label={node.isExpanded ? 'Collapse' : 'Expand'}
          >
            <ChevronRightIcon 
              className={`w-3 h-3 text-gray-600 transition-transform ${chevronRotation}`}
            />
          </button>
        ) : (
          // Empty space to maintain alignment
          <div className="w-3 h-3" />
        )}
      </div>

      {/* Component Icon */}
      <ComponentIcon component={node} className="w-4 h-4 flex-shrink-0" />

      {/* Component Info */}
      <div className="flex-1 flex items-center gap-2 min-w-0">
        {/* Display Name */}
        <span className={`
          text-sm truncate
          ${node.isSelected ? 'font-semibold text-blue-700' : 'text-gray-900'}
        `}>
          {node.displayName}
        </span>

        {/* Type Badge */}
        <span className="text-xs text-gray-500 truncate">
          {node.type}
        </span>

        {/* Children Count */}
        {node.hasChildren && (
          <span className="text-xs text-gray-400 ml-auto flex-shrink-0">
            ({node.children.length})
          </span>
        )}
      </div>
    </div>
  );
}
