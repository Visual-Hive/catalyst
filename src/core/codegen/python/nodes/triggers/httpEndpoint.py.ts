/**
 * @file httpEndpoint.py.ts
 * @description Python generator for HTTP endpoint trigger nodes
 * 
 * @architecture Phase 2, Task 2.10 - HTTP Endpoint Trigger
 * @created 2025-12-20
 * @author AI (Cline) + Human Review
 * @confidence 9/10 - Simple stub implementation, well-documented
 * 
 * @see src/core/codegen/python/WorkflowOrchestrator.ts - Registers this generator
 * @see docs/Catalyst documentation/CATALYST_PHASE_2_TASKS.md - Task 2.10
 * 
 * PROBLEM SOLVED:
 * - Workflows need trigger nodes to define how they're invoked
 * - HTTP endpoint triggers were causing generation to fail
 * - "Unimplemented node type: httpEndpoint" error
 * 
 * SOLUTION:
 * - Minimal stub generator (triggers don't execute, they define routes)
 * - FastAPI @app.post() decorator handles the actual HTTP endpoint
 * - This generator just adds comments for documentation
 * - Dependencies include FastAPI and Uvicorn
 * 
 * KEY INSIGHT:
 * Trigger nodes are metadata only. They don't need execution functions
 * because the FastAPI route decorator handles the HTTP endpoint.
 * The orchestrator uses trigger metadata (method, path) to generate
 * the @app.post() route, but the trigger itself doesn't execute code.
 * 
 * DESIGN DECISIONS:
 * - Minimal stub (not empty) to document intentional design
 * - Comment explains why no execution function is needed
 * - Keeps generated code clean without unnecessary functions
 * 
 * @security-critical false - generates comments only
 * @performance-critical false - minimal code generation
 */

/**
 * Generate Python code for HTTP endpoint trigger node
 * 
 * HTTP endpoint triggers are special - they don't need execution functions
 * because the FastAPI route decorator handles the HTTP endpoint.
 * 
 * This function returns a minimal stub with documentation comments
 * to explain that triggers are metadata only.
 * 
 * GENERATED CODE:
 * - Comments explaining trigger behavior
 * - No execution function (not needed)
 * 
 * The WorkflowOrchestrator uses the trigger's config (method, path)
 * to generate the FastAPI route decorator:
 * 
 * ```python
 * @app.post("/workflow/my-workflow")
 * async def workflow_my_workflow(input_data: dict):
 *     # Execute workflow nodes...
 * ```
 * 
 * @returns Python module code (minimal stub)
 * 
 * @example
 * const code = generateHttpEndpointNode();
 * // Returns stub with comments
 */
export function generateHttpEndpointNode(): string {
  return `
# ============================================================================
# HTTP ENDPOINT TRIGGER
# ============================================================================
# Note: HTTP endpoints are handled by FastAPI route decorators (@app.post, etc.)
# This trigger node is metadata only - it defines how the workflow is invoked,
# but doesn't execute any code itself.
#
# The WorkflowOrchestrator uses trigger config (method, path) to generate:
# @app.post("/workflow/name")
# async def workflow_name(input_data: dict):
#     # workflow execution logic
#
# No execute_http_endpoint() function is needed.
`;
}

/**
 * Get Python dependencies for HTTP endpoint triggers
 * 
 * Returns FastAPI and Uvicorn packages needed for HTTP endpoints.
 * These are core dependencies for any Catalyst workflow.
 * 
 * @returns Array of Python package requirements
 * 
 * @example
 * const deps = getHttpEndpointDependencies();
 * // ['fastapi>=0.104.0', 'uvicorn[standard]>=0.24.0']
 */
export function getHttpEndpointDependencies(): string[] {
  return [
    'fastapi>=0.104.0',
    'uvicorn[standard]>=0.24.0',
  ];
}
