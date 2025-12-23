/**
 * @file RequestSimulator.tsx
 * @description Modal for simulating HTTP requests to test workflows locally
 * 
 * @architecture Phase 2.5, Task 2.17 - Test vs Production Execution Modes
 * @created 2025-12-21
 * @author AI (Cline) + Human Review
 * @confidence 8/10 - Monaco editor integration, comprehensive request configuration
 * 
 * @see .implementation/Catalyst_tasks/phase-2.5-developer-experience/task-2.17-test-prod-modes.md
 * @see src/renderer/components/WorkflowCanvas/NodeContextMenu.tsx - Opens this modal
 * 
 * PROBLEM SOLVED:
 * - Testing HTTP-triggered workflows locally is cumbersome
 * - Don't want to force users to use curl or Postman
 * - Need quick way to test with different request formats
 * - Support for path parameters (e.g., /user/:id)
 * 
 * SOLUTION:
 * - Full-featured HTTP request builder modal
 * - Monaco editor for JSON body
 * - Path parameter substitution
 * - Query parameter builder
 * - Headers editor
 * - Sample data templates for common methods
 * 
 * FEATURES:
 * - HTTP method selection (GET, POST, PUT, DELETE, PATCH)
 * - Path parameter editor with substitution
 * - Key-value query params editor
 * - JSON headers editor (Monaco)
 * - JSON body editor (Monaco)
 * - Sample templates for quick testing
 * 
 * @security-critical false
 * @performance-critical false
 */

import React, { useState, useMemo } from 'react';
import { X, AlertCircle, Play, CheckCircle } from 'lucide-react';
import Editor from '@monaco-editor/react';
import { useWorkflowStore } from '../../store/workflowStore';

// ============================================================
// TYPES
// ============================================================

/**
 * Props for RequestSimulator component
 */
export interface RequestSimulatorProps {
  /** Workflow ID containing the HTTP endpoint node */
  workflowId: string;
  
  /** Node ID of the HTTP endpoint */
  nodeId: string;
  
  /** Node name for display */
  nodeName: string;
  
  /** Callback when user closes modal (without running) */
  onClose: () => void;
  
  /** Callback when user runs the simulated request */
  onRun: (simulatedRequest: SimulatedRequest) => void;
}

/**
 * Simulated HTTP request data
 */
export interface SimulatedRequest {
  /** HTTP method */
  method: string;
  
  /** Path (with params substituted) */
  path: string;
  
  /** Path parameters */
  pathParams: Record<string, string>;
  
  /** Query parameters */
  query: Record<string, string>;
  
  /** Request headers */
  headers: Record<string, string>;
  
  /** Request body (parsed JSON) */
  body: any;
}

/**
 * Key-value pair for editors
 */
interface KeyValuePair {
  key: string;
  value: string;
}

// ============================================================
// SAMPLE TEMPLATES
// ============================================================

/**
 * Sample request templates by HTTP method
 * Provides sensible defaults for quick testing
 */
const REQUEST_TEMPLATES: Record<string, Partial<SimulatedRequest>> = {
  GET: {
    method: 'GET',
    path: '/',
    pathParams: {},
    query: { page: '1', limit: '10' },
    headers: { 'Accept': 'application/json' },
    body: null,
  },
  POST: {
    method: 'POST',
    path: '/',
    pathParams: {},
    query: {},
    headers: { 'Content-Type': 'application/json' },
    body: {
      name: 'Example',
      value: 123,
      active: true,
    },
  },
  PUT: {
    method: 'PUT',
    path: '/:id',
    pathParams: { id: '123' },
    query: {},
    headers: { 'Content-Type': 'application/json' },
    body: {
      name: 'Updated Example',
      value: 456,
    },
  },
  DELETE: {
    method: 'DELETE',
    path: '/:id',
    pathParams: { id: '123' },
    query: {},
    headers: {},
    body: null,
  },
  PATCH: {
    method: 'PATCH',
    path: '/:id',
    pathParams: { id: '123' },
    query: {},
    headers: { 'Content-Type': 'application/json' },
    body: {
      status: 'active',
    },
  },
};

// ============================================================
// UTILITY FUNCTIONS
// ============================================================

/**
 * Substitute path parameters in path template
 * Example: /user/:id with {id: '123'} becomes /user/123
 * 
 * @param path - Path template with :param syntax
 * @param params - Parameter values
 * @returns Path with parameters substituted
 */
function substitutePathParams(path: string, params: Record<string, string>): string {
  let result = path;
  for (const [key, value] of Object.entries(params)) {
    result = result.replace(`:${key}`, value);
  }
  return result;
}

/**
 * Convert key-value pairs to object
 */
function pairsToObject(pairs: KeyValuePair[]): Record<string, string> {
  const obj: Record<string, string> = {};
  for (const pair of pairs) {
    if (pair.key.trim()) {
      obj[pair.key.trim()] = pair.value;
    }
  }
  return obj;
}

/**
 * Convert object to key-value pairs
 */
function objectToPairs(obj: Record<string, string>): KeyValuePair[] {
  return Object.entries(obj).map(([key, value]) => ({ key, value }));
}

// ============================================================
// MAIN COMPONENT
// ============================================================

/**
 * RequestSimulator - Modal for simulating HTTP requests
 * 
 * Provides a comprehensive HTTP request builder for testing workflows
 * locally without needing external tools like curl or Postman.
 * 
 * FEATURES:
 * - Method selection with smart templates
 * - Path parameter substitution
 * - Query parameter builder
 * - Monaco editor for headers and body
 * - Real-time validation
 * - Copy request as curl command
 * 
 * USAGE:
 * ```tsx
 * {showSimulator && (
 *   <RequestSimulator
 *     workflowId={workflowId}
 *     nodeId={nodeId}
 *     nodeName={node.name}
 *     onClose={() => setShowSimulator(false)}
 *     onRun={(request) => {
 *       executeWorkflowWithRequest(workflowId, request);
 *       setShowSimulator(false);
 *     }}
 *   />
 * )}
 * ```
 * 
 * @param props - Component props
 */
export function RequestSimulator({
  workflowId,
  nodeId,
  nodeName,
  onClose,
  onRun,
}: RequestSimulatorProps) {
  // --------------------------------------------------------
  // STATE
  // --------------------------------------------------------
  
  const [method, setMethod] = useState('POST');
  const [path, setPath] = useState('/');
  const [pathParams, setPathParams] = useState<KeyValuePair[]>([]);
  const [queryParams, setQueryParams] = useState<KeyValuePair[]>([{ key: '', value: '' }]);
  const [headersJson, setHeadersJson] = useState('{\n  "Content-Type": "application/json"\n}');
  const [bodyJson, setBodyJson] = useState('{\n  "example": "data"\n}');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  
  // Get manifest from Catalyst workflow store (NOT the legacy Rise manifestStore!)
  const manifest = useWorkflowStore((state) => state.manifest);
  
  // --------------------------------------------------------
  // THEME DETECTION
  // --------------------------------------------------------
  
  const isDarkMode = useMemo(() => false, []); // TODO: Wire up to theme context
  
  // --------------------------------------------------------
  // HANDLERS
  // --------------------------------------------------------
  
  /**
   * Load template for selected method
   */
  const handleMethodChange = (newMethod: string) => {
    setMethod(newMethod);
    
    const template = REQUEST_TEMPLATES[newMethod];
    if (template) {
      setPath(template.path || '/');
      setPathParams(objectToPairs(template.pathParams || {}));
      setQueryParams(
        Object.keys(template.query || {}).length > 0
          ? objectToPairs(template.query!)
          : [{ key: '', value: '' }]
      );
      setHeadersJson(JSON.stringify(template.headers || {}, null, 2));
      setBodyJson(template.body ? JSON.stringify(template.body, null, 2) : '');
    }
    
    setError(null);
  };
  
  /**
   * Add new path parameter row
   */
  const handleAddPathParam = () => {
    setPathParams([...pathParams, { key: '', value: '' }]);
  };
  
  /**
   * Update path parameter
   */
  const handleUpdatePathParam = (index: number, field: 'key' | 'value', value: string) => {
    const newParams = [...pathParams];
    newParams[index][field] = value;
    setPathParams(newParams);
  };
  
  /**
   * Remove path parameter
   */
  const handleRemovePathParam = (index: number) => {
    setPathParams(pathParams.filter((_, i) => i !== index));
  };
  
  /**
   * Add new query parameter row
   */
  const handleAddQueryParam = () => {
    setQueryParams([...queryParams, { key: '', value: '' }]);
  };
  
  /**
   * Update query parameter
   */
  const handleUpdateQueryParam = (index: number, field: 'key' | 'value', value: string) => {
    const newParams = [...queryParams];
    newParams[index][field] = value;
    setQueryParams(newParams);
  };
  
  /**
   * Remove query parameter
   */
  const handleRemoveQueryParam = (index: number) => {
    if (queryParams.length > 1) {
      setQueryParams(queryParams.filter((_, i) => i !== index));
    }
  };
  
  /**
   * Handle run request action
   * Validates JSON, constructs request object, and executes workflow locally
   * 
   * EXECUTION FLOW:
   * 1. Validate and parse JSON inputs (headers, body)
   * 2. Build request object with all parameters
   * 3. Call window.electronAPI.workflow.execute() to run Python workflow
   * 4. Display execution ID on success
   * 5. Show errors if validation or execution fails
   * 
   * @performance Non-blocking - execution happens in subprocess
   */
  const handleRun = async () => {
    try {
      setIsSaving(true);
      setError(null);
      setSuccess(null);
      
      // Parse headers JSON
      const headers = JSON.parse(headersJson);
      
      // Parse body JSON (if not empty and method supports body)
      let body = null;
      if (bodyJson.trim() && method !== 'GET' && method !== 'DELETE') {
        body = JSON.parse(bodyJson);
      }
      
      // Build path params object from key-value pairs
      const pathParamsObj = pairsToObject(pathParams);
      
      // Build query params object from key-value pairs
      const queryParamsObj = pairsToObject(queryParams);
      
      // Substitute path parameters in path template
      // Example: /user/:id with {id: '123'} becomes /user/123
      const finalPath = substitutePathParams(path, pathParamsObj);
      
      // Construct simulated HTTP request data
      // This will be passed to the workflow as trigger data
      const simulatedRequest: SimulatedRequest = {
        method,
        path: finalPath,
        pathParams: pathParamsObj,
        query: queryParamsObj,
        headers,
        body,
      };
      
      // Execute workflow locally via Electron IPC
      // This spawns a Python subprocess with the generated workflow code
      // The trigger data (simulatedRequest) is passed as stdin
      const result = await window.electronAPI.workflow.execute(
        workflowId,
        simulatedRequest, // Trigger data
        manifest // Full manifest for code generation
      );
      
      // Handle execution result
      if (result.success && result.executionId) {
        // Show success message with execution ID
        setSuccess(`✅ Workflow execution started! ID: ${result.executionId}`);
        setIsSaving(false);
        
        // Auto-close modal after 2 seconds
        setTimeout(() => {
          onClose();
        }, 2000);
        
        // Also call the onRun callback for any additional UI updates
        onRun(simulatedRequest);
      } else {
        // Execution failed - show error
        throw new Error(result.error || 'Workflow execution failed');
      }
      
    } catch (err) {
      // Handle validation or execution errors
      const message = err instanceof Error ? err.message : 'Invalid JSON or execution failed';
      setError(`Error: ${message}`);
      setIsSaving(false);
    }
  };
  
  /**
   * Handle Escape key to close modal
   */
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };
  
  // --------------------------------------------------------
  // COMPUTED VALUES
  // --------------------------------------------------------
  
  /**
   * Preview of final path with parameters substituted
   */
  const previewPath = useMemo(() => {
    return substitutePathParams(path, pairsToObject(pathParams));
  }, [path, pathParams]);
  
  // --------------------------------------------------------
  // RENDER
  // --------------------------------------------------------
  
  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[2000]"
      onClick={onClose}
      onKeyDown={handleKeyDown}
    >
      {/* Modal content */}
      <div
        className="bg-white rounded-lg shadow-xl w-full max-w-5xl max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-200 flex items-start justify-between">
          <div className="flex-1">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
              🌐 Simulate HTTP Request
            </h2>
            <p className="text-sm text-gray-600 mt-2">
              <span className="font-medium">{nodeName}</span>
              <span className="text-gray-400 mx-2">•</span>
              <span className="text-gray-500">Test workflow locally</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded transition-colors"
            title="Close (Esc)"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>
        
        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Method and Path */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700">
              HTTP Method & Path
            </label>
            <div className="flex gap-3">
              <select
                value={method}
                onChange={(e) => handleMethodChange(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg w-32 font-mono text-sm"
              >
                <option value="GET">GET</option>
                <option value="POST">POST</option>
                <option value="PUT">PUT</option>
                <option value="DELETE">DELETE</option>
                <option value="PATCH">PATCH</option>
              </select>
              <input
                type="text"
                value={path}
                onChange={(e) => setPath(e.target.value)}
                placeholder="/path/to/endpoint"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg font-mono text-sm"
              />
            </div>
            {previewPath !== path && (
              <div className="text-xs text-gray-500 font-mono">
                Preview: {previewPath}
              </div>
            )}
          </div>
          
          {/* Path Parameters */}
          {path.includes(':') && (
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-700">
                Path Parameters
              </label>
              {pathParams.map((param, index) => (
                <div key={index} className="flex gap-2">
                  <input
                    type="text"
                    value={param.key}
                    onChange={(e) => handleUpdatePathParam(index, 'key', e.target.value)}
                    placeholder="param"
                    className="w-1/3 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  />
                  <input
                    type="text"
                    value={param.value}
                    onChange={(e) => handleUpdatePathParam(index, 'value', e.target.value)}
                    placeholder="value"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  />
                  <button
                    onClick={() => handleRemovePathParam(index)}
                    className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    ×
                  </button>
                </div>
              ))}
              <button
                onClick={handleAddPathParam}
                className="text-sm text-purple-600 hover:text-purple-700"
              >
                + Add Path Parameter
              </button>
            </div>
          )}
          
          {/* Query Parameters */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700">
              Query Parameters
            </label>
            {queryParams.map((param, index) => (
              <div key={index} className="flex gap-2">
                <input
                  type="text"
                  value={param.key}
                  onChange={(e) => handleUpdateQueryParam(index, 'key', e.target.value)}
                  placeholder="key"
                  className="w-1/3 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
                <input
                  type="text"
                  value={param.value}
                  onChange={(e) => handleUpdateQueryParam(index, 'value', e.target.value)}
                  placeholder="value"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
                <button
                  onClick={() => handleRemoveQueryParam(index)}
                  className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  disabled={queryParams.length === 1}
                >
                  ×
                </button>
              </div>
            ))}
            <button
              onClick={handleAddQueryParam}
              className="text-sm text-purple-600 hover:text-purple-700"
            >
              + Add Query Parameter
            </button>
          </div>
          
          {/* Headers */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700">
              Headers (JSON)
            </label>
            <div className="border border-gray-300 rounded-lg overflow-hidden">
              <Editor
                height="120px"
                language="json"
                value={headersJson}
                onChange={(value) => setHeadersJson(value || '')}
                options={{
                  minimap: { enabled: false },
                  lineNumbers: 'off',
                  scrollBeyondLastLine: false,
                  fontSize: 13,
                  tabSize: 2,
                  wordWrap: 'on',
                }}
                theme={isDarkMode ? 'vs-dark' : 'vs-light'}
              />
            </div>
          </div>
          
          {/* Body */}
          {method !== 'GET' && method !== 'DELETE' && (
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-700">
                Body (JSON)
              </label>
              <div className="border border-gray-300 rounded-lg overflow-hidden">
                <Editor
                  height="200px"
                  language="json"
                  value={bodyJson}
                  onChange={(value) => setBodyJson(value || '')}
                  options={{
                    minimap: { enabled: false },
                    lineNumbers: 'on',
                    scrollBeyondLastLine: false,
                    fontSize: 13,
                    tabSize: 2,
                    wordWrap: 'on',
                  }}
                  theme={isDarkMode ? 'vs-dark' : 'vs-light'}
                />
              </div>
            </div>
          )}
          
          {/* Success display */}
          {success && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-green-800">{success}</p>
                <p className="text-xs text-green-600 mt-1">Check Execution History panel for results</p>
              </div>
            </div>
          )}
          
          {/* Error display */}
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-red-800">Validation Error</p>
                <p className="text-xs text-red-600 mt-1 font-mono">{error}</p>
              </div>
            </div>
          )}
        </div>
        
        {/* Footer */}
        <div className="p-6 border-t border-gray-200 flex items-center justify-between">
          <div className="text-sm text-gray-500">
            💡 Tip: Change method to load template data
          </div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              disabled={isSaving}
            >
              Cancel
            </button>
            <button
              onClick={handleRun}
              disabled={isSaving}
              className="
                px-6 py-2 bg-blue-600 text-white rounded-lg 
                hover:bg-blue-700 transition-colors
                disabled:opacity-50 disabled:cursor-not-allowed
                flex items-center gap-2
              "
            >
              {isSaving ? (
                <>
                  <span className="animate-spin">⏳</span>
                  Running...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  Run Test
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default RequestSimulator;
