/**
 * @file NodeContextMenu.tsx
 * @description Context menu for workflow nodes with pin/unpin data options
 * 
 * @architecture Phase 2.5, Task 2.13 - Node Data Pinning
 * @created 2025-12-21
 * @author AI (Cline) + Human Review
 * @confidence 8/10 - Standard context menu pattern
 * 
 * @see .implementation/Catalyst_tasks/phase-2.5-developer-experience/task-2.13-node-pinning.md
 * @see src/renderer/components/WorkflowCanvas/PinDataModal.tsx - Modal opened from this menu
 * 
 * PROBLEM SOLVED:
 * - Need right-click menu for workflow nodes
 * - Users should be able to pin/unpin test data
 * - Menu should show contextual options based on node state
 * - Clean UX with proper positioning and click-away behavior
 * 
 * SOLUTION:
 * - Context menu triggered by right-click on nodes
 * - Conditional rendering: "Pin Data" vs "Unpin Data"
 * - Click-away handler to close menu
 * - z-index layering for proper display
 * - Lucide icons for visual clarity
 * 
 * MENU OPTIONS:
 * - Pin Data / Unpin Data (conditional)
 * - Execute to Here (Task 2.14 - placeholder)
 * - Delete Node
 * 
 * @security-critical false
 * @performance-critical false
 */

import React, { useEffect, useRef } from 'react';
import { Pin, PinOff, Trash2, Play, Globe } from 'lucide-react';

// ============================================================
// TYPES
// ============================================================

/**
 * Props for NodeContextMenu component
 */
export interface NodeContextMenuProps {
  /** Node ID that was right-clicked */
  nodeId: string;
  
  /** Workflow ID containing the node */
  workflowId: string;
  
  /** Node type (for conditional menu items) */
  nodeType: string;
  
  /** Node name for display in modals */
  nodeName: string;
  
  /** Position to display menu (x, y screen coordinates) */
  position: { x: number; y: number };
  
  /** Whether the node has pinned data */
  hasPinnedData: boolean;
  
  /** Callback when user closes menu (click away, action selected) */
  onClose: () => void;
  
  /** Callback when user clicks "Pin Data" */
  onPinData: () => void;
  
  /** Callback when user clicks "Unpin Data" */
  onUnpinData: () => void;
  
  /** Callback when user clicks "Simulate Request" (HTTP nodes only) */
  onSimulateRequest?: () => void;
  
  /** Callback when user clicks "Delete Node" */
  onDeleteNode: () => void;
}

/**
 * Props for menu item component
 */
interface MenuItemProps {
  /** Icon to display */
  icon: React.ReactNode;
  
  /** Label text */
  label: string;
  
  /** Click handler */
  onClick: () => void;
  
  /** Optional CSS classes */
  className?: string;
  
  /** Whether item is disabled */
  disabled?: boolean;
}

// ============================================================
// MENU ITEM COMPONENT
// ============================================================

/**
 * Individual menu item with icon and label
 * 
 * @param props - MenuItem props
 */
function MenuItem({ 
  icon, 
  label, 
  onClick, 
  className = '',
  disabled = false
}: MenuItemProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        w-full flex items-center gap-3 px-3 py-2 text-sm
        hover:bg-gray-100 transition-colors text-left
        disabled:opacity-50 disabled:cursor-not-allowed
        ${className}
      `}
    >
      {icon}
      {label}
    </button>
  );
}

// ============================================================
// MAIN COMPONENT
// ============================================================

/**
 * NodeContextMenu - Right-click menu for workflow nodes
 * 
 * Displays contextual actions for workflow nodes:
 * - Pin/Unpin test data
 * - Execute to here (placeholder for Task 2.14)
 * - Delete node
 * 
 * FEATURES:
 * - Automatic click-away detection
 * - Boundary detection (keeps menu in viewport)
 * - Smooth animations
 * - Keyboard support (Escape to close)
 * 
 * USAGE:
 * ```tsx
 * {contextMenu && (
 *   <NodeContextMenu
 *     nodeId={contextMenu.nodeId}
 *     workflowId={workflowId}
 *     position={contextMenu.position}
 *     hasPinnedData={node.pinnedData?.enabled || false}
 *     onClose={() => setContextMenu(null)}
 *     onPinData={() => setShowPinModal(true)}
 *     onUnpinData={() => unpinNodeData(workflowId, nodeId)}
 *     onDeleteNode={() => deleteNode(workflowId, nodeId)}
 *   />
 * )}
 * ```
 * 
 * @param props - Component props
 */
export function NodeContextMenu({
  nodeId,
  workflowId,
  nodeType,
  nodeName,
  position,
  hasPinnedData,
  onClose,
  onPinData,
  onUnpinData,
  onSimulateRequest,
  onDeleteNode,
}: NodeContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  
  // Check if this is an HTTP endpoint node
  const isHttpEndpoint = nodeType === 'httpEndpoint';
  
  // --------------------------------------------------------
  // CLICK-AWAY HANDLER
  // --------------------------------------------------------
  
  useEffect(() => {
    /**
     * Handle clicks outside the menu
     * Closes menu when user clicks anywhere else
     */
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    }
    
    /**
     * Handle Escape key
     * Closes menu when user presses Escape
     */
    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose();
      }
    }
    
    // Add listeners
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    
    // Cleanup
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [onClose]);
  
  // --------------------------------------------------------
  // BOUNDARY DETECTION
  // --------------------------------------------------------
  
  /**
   * Adjust menu position to keep it in viewport
   * Prevents menu from overflowing screen edges
   */
  const adjustedPosition = React.useMemo(() => {
    const menuWidth = 200; // Approximate menu width
    const menuHeight = 150; // Approximate menu height
    const padding = 10; // Edge padding
    
    let x = position.x;
    let y = position.y;
    
    // Check right edge
    if (x + menuWidth > window.innerWidth - padding) {
      x = window.innerWidth - menuWidth - padding;
    }
    
    // Check bottom edge
    if (y + menuHeight > window.innerHeight - padding) {
      y = window.innerHeight - menuHeight - padding;
    }
    
    // Check left edge
    if (x < padding) {
      x = padding;
    }
    
    // Check top edge
    if (y < padding) {
      y = padding;
    }
    
    return { x, y };
  }, [position]);
  
  // --------------------------------------------------------
  // ACTION HANDLERS
  // --------------------------------------------------------
  
  /**
   * Handle pin/unpin data action
   * Closes menu after action
   */
  const handlePinToggle = () => {
    if (hasPinnedData) {
      onUnpinData();
    } else {
      onPinData();
    }
    onClose();
  };
  
  /**
   * Handle delete node action
   * Closes menu after action
   */
  const handleDelete = () => {
    onDeleteNode();
    onClose();
  };
  
  /**
   * Handle execute to here action
   * TODO: Task 2.14 - Node-by-Node Execution
   */
  const handleExecuteToHere = () => {
    console.log('[NodeContextMenu] Execute to here - Coming in Task 2.14');
    onClose();
  };
  
  // --------------------------------------------------------
  // RENDER
  // --------------------------------------------------------
  
  return (
    <div
      ref={menuRef}
      className="
        fixed bg-white rounded-lg shadow-lg border border-gray-200 
        py-1 min-w-[200px] z-[1000]
        animate-in fade-in slide-in-from-top-2 duration-200
      "
      style={{ 
        left: adjustedPosition.x, 
        top: adjustedPosition.y 
      }}
    >
      {/* Pin/Unpin Data */}
      <MenuItem
        icon={hasPinnedData 
          ? <PinOff className="w-4 h-4 text-purple-600" />
          : <Pin className="w-4 h-4 text-purple-600" />
        }
        label={hasPinnedData ? 'Unpin Data' : 'Pin Data'}
        onClick={handlePinToggle}
      />
      
      {/* Simulate Request (HTTP Endpoint only - Task 2.17) */}
      {isHttpEndpoint && onSimulateRequest && (
        <MenuItem
          icon={<Globe className="w-4 h-4 text-blue-600" />}
          label="Simulate Request"
          onClick={() => {
            onSimulateRequest();
            onClose();
          }}
        />
      )}
      
      {/* Execute to Here (Task 2.14) */}
      <MenuItem
        icon={<Play className="w-4 h-4 text-blue-600" />}
        label="Execute to Here"
        onClick={handleExecuteToHere}
        disabled={true}
        className="opacity-50"
      />
      
      {/* Divider */}
      <div className="border-t border-gray-200 my-1" />
      
      {/* Delete Node */}
      <MenuItem
        icon={<Trash2 className="w-4 h-4 text-red-500" />}
        label="Delete Node"
        onClick={handleDelete}
        className="text-red-600 hover:bg-red-50"
      />
    </div>
  );
}

export default NodeContextMenu;
