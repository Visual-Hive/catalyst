/**
 * @file NodeConfigForm.tsx
 * @description Dynamic form generator based on node type metadata
 * 
 * @architecture Phase 2.5, Task 2.10 - Properties Panel
 * @created 2025-12-21
 * @author AI (Cline) + Human Review
 * @confidence 9/10 - Straightforward form generator
 * 
 * @see src/core/workflow/nodes/types.ts - ConfigFieldDefinition
 * @see src/core/workflow/nodes/registry.ts - NODE_REGISTRY
 * @see src/renderer/components/WorkflowCanvas/form-fields/DynamicFormField.tsx - Field renderer
 * 
 * PROBLEM SOLVED:
 * - Need dynamic forms for 55+ node types without writing 55 forms
 * - Config structure varies by node type
 * - Need to handle nested config paths
 * 
 * SOLUTION:
 * - Read configFields from node metadata in registry
 * - Generate form dynamically using DynamicFormField
 * - Handle value extraction from nested config objects
 * - Update store on every change
 * 
 * @performance-critical false
 * @security-critical false
 */

import React from 'react';
import { ExclamationCircleIcon } from '@heroicons/react/24/outline';
import type { NodeDefinition } from '../../../core/workflow/types';
import { NODE_REGISTRY } from '../../../core/workflow/nodes/registry';
import { useWorkflowStore } from '../../store/workflowStore';
import { DynamicFormField } from './form-fields/DynamicFormField';

interface NodeConfigFormProps {
  /** Workflow ID containing the node */
  workflowId: string;
  
  /** Node being configured */
  node: NodeDefinition;
}

/**
 * NodeConfigForm - Generates configuration form dynamically based on node type
 * 
 * DESIGN:
 * - Looks up node metadata from NODE_REGISTRY
 * - Iterates through configFields array
 * - Renders appropriate input component for each field via DynamicFormField
 * - Updates workflow store on every change (immediate feedback)
 * 
 * FIELD VALUE EXTRACTION:
 * - Handles nested paths like 'options.temperature'
 * - Special case: 'name' is top-level node property, not config
 * - Returns undefined for missing values (shows as empty input)
 * 
 * @example
 * ```tsx
 * <NodeConfigForm
 *   workflowId="workflow_123"
 *   node={selectedNode}
 * />
 * ```
 */
export function NodeConfigForm({ workflowId, node }: NodeConfigFormProps) {
  const updateNodeConfig = useWorkflowStore((state) => state.updateNodeConfig);
  
  // Get node metadata from registry
  const nodeMetadata = NODE_REGISTRY[node.type];
  
  // Unknown node type (shouldn't happen if registry is complete)
  if (!nodeMetadata) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-md">
        <div className="flex items-start">
          <ExclamationCircleIcon className="w-5 h-5 text-red-600 mr-2 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-red-800">
              Unknown node type: {node.type}
            </p>
            <p className="text-xs text-red-600 mt-1">
              This node type is not registered in the node registry.
            </p>
          </div>
        </div>
      </div>
    );
  }
  
  /**
   * Handler for field changes
   * Updates the workflow store immediately (no debounce)
   */
  const handleFieldChange = (fieldPath: string, value: any) => {
    updateNodeConfig(workflowId, node.id, fieldPath, value);
  };
  
  /**
   * Get nested config value from node
   * Supports dot notation (e.g., 'options.temperature')
   * 
   * @param path - Field path (dot-separated for nested)
   * @returns Field value or undefined if not set
   */
  const getConfigValue = (path: string): any => {
    // Special case: 'name' is a top-level node property
    if (path === 'name') {
      return node.name;
    }
    
    // Navigate nested config object
    const parts = path.split('.');
    let value: any = node.config;
    
    for (const part of parts) {
      value = value?.[part];
      if (value === undefined) break;
    }
    
    return value;
  };
  
  return (
    <div className="space-y-4">
      {/* Node Name (always shown first, before config fields) */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          Node Name
          <span className="text-red-500 ml-1">*</span>
        </label>
        <input
          type="text"
          value={node.name || ''}
          onChange={(e) => handleFieldChange('name', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm
                     focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
          placeholder="Enter node name"
        />
        <p className="text-xs text-gray-500">
          A descriptive name for this node
        </p>
      </div>
      
      {/* Dynamic fields based on node type */}
      {nodeMetadata.configFields && nodeMetadata.configFields.length > 0 ? (
        <>
          {nodeMetadata.configFields.map((field) => (
            <DynamicFormField
              key={field.path}
              field={field}
              value={getConfigValue(field.path)}
              onChange={(value) => handleFieldChange(field.path, value)}
            />
          ))}
        </>
      ) : (
        <div className="p-4 bg-gray-50 border border-gray-200 rounded-md">
          <p className="text-sm text-gray-600">
            This node type has no configurable fields.
          </p>
        </div>
      )}
      
      {/* Node ID (read-only, for debugging) */}
      <div className="pt-4 border-t border-gray-200">
        <p className="text-xs text-gray-400">
          Node ID: <code className="bg-gray-100 px-1 py-0.5 rounded font-mono">{node.id}</code>
        </p>
      </div>
    </div>
  );
}
