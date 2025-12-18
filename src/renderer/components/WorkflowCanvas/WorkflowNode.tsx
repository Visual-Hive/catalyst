/**
 * @file WorkflowNode.tsx
 * @description Generic node renderer for all 55+ Catalyst workflow node types
 * 
 * @architecture Phase 0, Task 0.5 - Canvas Adaptation
 * @created 2025-12-18
 * @author AI (Cline) + Human Review
 * @confidence 8/10 - Dynamic rendering based on node registry metadata
 * 
 * @see src/renderer/components/WorkflowCanvas/WorkflowCanvas.tsx - Parent canvas
 * @see src/core/workflow/nodes/registry.ts - Node metadata source
 * @see src/renderer/components/LogicEditor/nodes/BaseNode.tsx - Reused styling
 * 
 * PROBLEM SOLVED:
 * - Need to render 55+ different node types without creating 55+ components
 * - Each node type has different inputs, outputs, colors, icons
 * - Must support dynamic handle generation for conditional outputs
 * - Need to show config summary without full editing interface
 * 
 * SOLUTION:
 * - Single component that looks up metadata from NODE_REGISTRY
 * - Dynamically generates handles based on metadata.inputs/outputs
 * - Reuses BaseNode for consistent styling
 * - Delegates config display to ConfigSummary component
 * - Shows phase badges for stub vs implemented nodes
 * 
 * DESIGN DECISIONS:
 * - Use BaseNode wrapper (proven design from LogicEditor)
 * - Dynamic handles: Loop over metadata.inputs/outputs arrays
 * - Config summary: Separate component for maintainability
 * - Stub indicator: Grayed appearance + 🚧 badge
 * - Multiple outputs: Stack vertically on right side
 * 
 * @security-critical false
 * @performance-critical false - User-driven interactions
 */

import React from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import type { NodeDefinition } from '../../../core/workflow/types';
import { getNodeMetadata } from '../../../core/workflow/nodes';
import { BaseNode } from '../LogicEditor/nodes/BaseNode';
import { ConfigSummary } from './ConfigSummary';

// ============================================================
// TYPES
// ============================================================

/**
 * Data passed to WorkflowNode via React Flow
 * The 'data' prop contains our NodeDefinition
 */
export type WorkflowNodeData = NodeDefinition;

/**
 * Props for WorkflowNode component
 * React Flow provides these automatically
 */
export type WorkflowNodeProps = NodeProps<WorkflowNodeData>;

// ============================================================
// COMPONENT
// ============================================================

/**
 * WorkflowNode - Generic renderer for all Catalyst workflow nodes
 * 
 * This single component can render any of the 55+ node types by:
 * 1. Looking up metadata from NODE_REGISTRY using node.type
 * 2. Extracting icon, color, name from metadata
 * 3. Dynamically generating handles based on metadata.inputs/outputs
 * 4. Displaying config summary via ConfigSummary component
 * 5. Showing stub indicator if node not yet implemented
 * 
 * VISUAL STRUCTURE:
 * ┌────────────────────────┐
 * │ [●] 🤖 Claude (Ant... │ ← Header from BaseNode
 * │────────────────────────│
 * │ Model: Claude 3.5 S... │ ← ConfigSummary
 * │ 📡 Streaming          │
 * │ 🚧 Phase 1            │ ← Phase badge (if stub)
 * │                      [●]← Dynamic output handles
 * └────────────────────────┘
 * 
 * @example
 * Used automatically by React Flow:
 * ```tsx
 * const nodeTypes = {
 *   workflowNode: WorkflowNode,
 * };
 * 
 * <ReactFlow nodes={nodes} nodeTypes={nodeTypes} />
 * ```
 * 
 * @param props - React Flow node props with our NodeDefinition as data
 */
export function WorkflowNode({ data, selected }: WorkflowNodeProps) {
  // Look up node metadata from registry
  const metadata = getNodeMetadata(data.type);
  
  // Fallback if node type not found in registry (should never happen)
  if (!metadata) {
    console.warn(`[WorkflowNode] No metadata found for node type: ${data.type}`);
    return (
      <div className="px-4 py-3 bg-red-50 border-2 border-red-300 rounded-lg">
        <div className="font-semibold text-red-700">Unknown Node Type</div>
        <div className="text-xs text-red-500">{data.type}</div>
      </div>
    );
  }
  
  // Determine if this is a stub node (not yet implemented)
  const isStub = !metadata.implemented;
  
  // Get node display name (use custom name if set, otherwise metadata name)
  const displayName = data.name || metadata.name;
  
  // Apply grayscale filter to stub nodes for visual distinction
  const stubStyle = isStub ? { opacity: 0.7, filter: 'grayscale(50%)' } : {};
  
  return (
    <div style={stubStyle} className="workflow-node">
      {/* 
        Render dynamic input handles
        Each input gets a Handle component on the left side
        Handles are stacked vertically if multiple inputs
      */}
      {metadata.inputs.map((input, index) => {
        // Calculate vertical position for handle
        // If single input: center (50%)
        // If multiple: distribute evenly (25%, 50%, 75%, etc.)
        const positionPercent = metadata.inputs.length === 1 
          ? 50 
          : (100 / (metadata.inputs.length + 1)) * (index + 1);
        
        return (
          <Handle
            key={input.id}
            type="target"
            position={Position.Left}
            id={input.id}
            className={`
              !w-3 !h-3 !border-2 !border-white
              ${input.type === 'conditional' 
                ? '!bg-yellow-500 !rounded-sm' 
                : '!bg-gray-500 !rounded-full'
              }
            `}
            style={{ 
              top: `${positionPercent}%`,
              transform: 'translateY(-50%)',
            }}
            title={input.name}
          />
        );
      })}
      
      {/* 
        BaseNode wrapper provides consistent styling
        Reuses the proven design from LogicEditor
      */}
      <BaseNode
        title={displayName}
        icon={getIconFromMetadata(metadata.icon)}
        colorClass={getColorClass(metadata.color, isStub)}
        hasInput={false}  // We handle inputs manually above
        hasOutput={false}  // We handle outputs manually below
        selected={selected}
      >
        {/* Config summary shows key properties */}
        <ConfigSummary 
          type={data.type} 
          config={data.config} 
          isStub={isStub}
        />
        
        {/* Phase badge for stub nodes */}
        {isStub && metadata.phase !== undefined && (
          <div className="mt-2 pt-2 border-t border-gray-200">
            <div className="text-xs text-gray-400">
              🚧 Phase {metadata.phase}
            </div>
          </div>
        )}
      </BaseNode>
      
      {/* 
        Render dynamic output handles
        Each output gets a Handle component on the right side
        Conditional outputs (true/false, cases) shown as squares
      */}
      {metadata.outputs.map((output, index) => {
        // Calculate vertical position for handle
        const positionPercent = metadata.outputs.length === 1 
          ? 50 
          : (100 / (metadata.outputs.length + 1)) * (index + 1);
        
        return (
          <Handle
            key={output.id}
            type="source"
            position={Position.Right}
            id={output.id}
            className={`
              !w-3 !h-3 !border-2 !border-white
              ${output.type === 'conditional' 
                ? '!bg-yellow-500 !rounded-sm' 
                : '!bg-gray-500 !rounded-full'
              }
            `}
            style={{ 
              top: `${positionPercent}%`,
              transform: 'translateY(-50%)',
            }}
            title={output.name}
          />
        );
      })}
    </div>
  );
}

// ============================================================
// HELPER FUNCTIONS
// ============================================================

/**
 * Convert icon identifier to emoji
 * 
 * NODE_REGISTRY stores icon names (e.g., "Sparkles", "Globe")
 * but we want to display emojis on the canvas.
 * 
 * This is a temporary mapping until we implement proper icon system.
 * 
 * @param iconName - Icon identifier from metadata
 * @returns Emoji string
 */
function getIconFromMetadata(iconName: string): string {
  const iconMap: Record<string, string> = {
    // Triggers
    'GlobeAlt': '🌐',
    'Globe': '🌐',
    'Clock': '⏰',
    'ArrowDownTray': '📥',
    'RectangleGroup': '📦',
    'SignalSlash': '📡',
    'QueueList': '📋',
    
    // LLM
    'Sparkles': '✨',
    'CpuChip': '🤖',
    'Bolt': '⚡',
    'Cloud': '☁️',
    'ChartBar': '📊',
    'DocumentText': '📄',
    'Wrench': '🔧',
    'ArrowsRightLeft': '↔️',
    
    // Data
    'MagnifyingGlass': '🔍',
    'ArrowUpTray': '📤',
    'ArrowsUpDown': '↕️',
    'PencilSquare': '✏️',
    'CircleStack': '🗄️',
    'TableCells': '📊',
    'CodeBracket': '💻',
    'Square3Stack3d': '📚',
    
    // HTTP
    'ArrowRightCircle': '➡️',
    'Envelope': '✉️',
    'PaperAirplane': '📨',
    
    // Control Flow
    'ArrowTopRightOnSquare': '↗️',
    'Squares2x2': '⊞',
    'ArrowPath': '🔄',
    'ArrowsPointingOut': '⇈',
    'ArrowsPointingIn': '⇊',
    'ArrowPathRoundedSquare': '↻',
    'ClockIcon': '⏱️',
    'ArrowUturnLeft': '↩️',
    
    // Transform
    'CodeBracketSquare': '💻',
    'CursorArrowRays': '✨',
    'ListBullet': '📋',
    'Funnel': '🔍',
    'FunnelIcon': '🔽',
    'Scissors': '✂️',
    
    // Streaming
    'Signal': '📡',
    'StopCircle': '⏹️',
    
    // Utilities
    'Key': '🔑',
    'InformationCircle': 'ℹ️',
    'Variable': '📌',
    'ExclamationTriangle': '⚠️',
    'ShieldCheck': '🛡️',
    'CheckCircle': '✅',
  };
  
  return iconMap[iconName] || '📦';
}

/**
 * Get Tailwind color classes for node styling
 * 
 * Converts registry color (e.g., "bg-purple-500") to full class string
 * with border and background. Applies grayscale for stub nodes.
 * 
 * @param registryColor - Color from node metadata
 * @param isStub - Whether this is a stub node
 * @returns Tailwind class string for BaseNode colorClass prop
 */
function getColorClass(registryColor: string, isStub: boolean): string {
  // Extract color name from registry (e.g., "bg-purple-500" → "purple")
  const colorMatch = registryColor.match(/bg-(\w+)-\d+/);
  const colorName = colorMatch ? colorMatch[1] : 'gray';
  
  // Stub nodes get gray color regardless of registry
  if (isStub) {
    return 'border-gray-300 bg-gray-50';
  }
  
  // Map color names to border + background classes
  const colorClassMap: Record<string, string> = {
    green: 'border-green-300 bg-green-50',
    purple: 'border-purple-300 bg-purple-50',
    blue: 'border-blue-300 bg-blue-50',
    orange: 'border-orange-300 bg-orange-50',
    yellow: 'border-yellow-300 bg-yellow-50',
    teal: 'border-teal-300 bg-teal-50',
    pink: 'border-pink-300 bg-pink-50',
    gray: 'border-gray-300 bg-gray-50',
  };
  
  return colorClassMap[colorName] || colorClassMap.gray;
}

export default WorkflowNode;
