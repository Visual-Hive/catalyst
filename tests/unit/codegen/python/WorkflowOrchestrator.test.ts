/**
 * @file WorkflowOrchestrator.test.ts
 * @description Unit tests for Python workflow code generation with test mode support
 * 
 * @architecture Phase 2.5, Task 2.18.3 - Test Mode Execution
 * @created 2025-12-22
 * @author AI (Cline) + Human Review
 * @confidence 9/10 - Test coverage for test mode generation
 */

import { describe, it, expect } from 'vitest';
import { generatePythonWorkflow } from '../../../../src/core/codegen/python/WorkflowOrchestrator';
import type { WorkflowDefinition } from '../../../../src/core/workflow/types';

describe('WorkflowOrchestrator - Test Mode Generation', () => {
  // Helper to create minimal workflow for testing
  function createMockWorkflow(name: string = 'Test Workflow'): WorkflowDefinition {
    return {
      id: 'workflow-1',
      name,
      description: 'Test workflow description',
      nodes: {
        'node-1': {
          id: 'node-1',
          name: 'Prompt Node',
          type: 'promptTemplate',
          position: { x: 0, y: 0 },
          config: {
            template: 'Hello {{name}}',
            variables: { name: 'World' },
          },
        },
      },
      edges: [],
      trigger: {
        type: 'httpEndpoint',
        config: {},
      },
      input: {},
      output: {
        type: 'json',
      },
    };
  }

  describe('Mode Detection Code Generation', () => {
    it('should include CATALYST_EXECUTION_MODE environment variable check', () => {
      const workflow = createMockWorkflow();
      const result = generatePythonWorkflow(workflow);

      expect(result.code).toContain('CATALYST_EXECUTION_MODE');
      expect(result.code).toContain("os.getenv('CATALYST_EXECUTION_MODE', 'production')");
    });

    it('should include both test and production mode branches', () => {
      const workflow = createMockWorkflow();
      const result = generatePythonWorkflow(workflow);

      expect(result.code).toContain("if execution_mode == 'test':");
      expect(result.code).toContain('# TEST MODE: Execute workflow once and exit');
      expect(result.code).toContain('else:');
      expect(result.code).toContain('# PRODUCTION MODE: Start FastAPI server');
    });

    it('should import necessary modules for test mode', () => {
      const workflow = createMockWorkflow();
      const result = generatePythonWorkflow(workflow);

      expect(result.code).toContain('import sys');
      expect(result.code).toContain('import json');
      expect(result.code).toContain('import asyncio');
    });
  });

  describe('Test Execution Function Generation', () => {
    it('should generate execute_workflow_test function', () => {
      const workflow = createMockWorkflow();
      const result = generatePythonWorkflow(workflow);

      expect(result.code).toContain('async def execute_workflow_test(trigger_data: dict) -> dict:');
      expect(result.code).toContain('Execute workflow once with provided trigger data (test mode)');
    });

    it('should include execution ID generation in test function', () => {
      const workflow = createMockWorkflow();
      const result = generatePythonWorkflow(workflow);

      expect(result.code).toContain('execution_id = str(uuid.uuid4())');
      expect(result.code).toContain('[TEST MODE] Starting workflow:');
    });

    it('should include execution context initialization', () => {
      const workflow = createMockWorkflow();
      const result = generatePythonWorkflow(workflow);

      expect(result.code).toContain('ctx = ExecutionContext(');
      expect(result.code).toContain('secrets={');
      expect(result.code).toContain('input_data=trigger_data');
    });

    it('should return structured execution result', () => {
      const workflow = createMockWorkflow();
      const result = generatePythonWorkflow(workflow);

      expect(result.code).toContain('execution_result = {');
      expect(result.code).toContain('"workflowId":');
      expect(result.code).toContain('"status": "success"');
      expect(result.code).toContain('"nodeExecutions":');
      expect(result.code).toContain('return execution_result');
    });

    it('should handle errors gracefully in test function', () => {
      const workflow = createMockWorkflow();
      const result = generatePythonWorkflow(workflow);

      expect(result.code).toContain('except Exception as e:');
      expect(result.code).toContain('"status": "error"');
      expect(result.code).toContain('traceback.format_exc()');
    });
  });

  describe('Test Mode Main Block', () => {
    it('should read trigger data from stdin', () => {
      const workflow = createMockWorkflow();
      const result = generatePythonWorkflow(workflow);

      expect(result.code).toContain('trigger_data_str = sys.stdin.read()');
      expect(result.code).toContain('trigger_data = json.loads(trigger_data_str)');
    });

    it('should use asyncio.run to execute workflow', () => {
      const workflow = createMockWorkflow();
      const result = generatePythonWorkflow(workflow);

      expect(result.code).toContain('execution_result = asyncio.run(execute_workflow_test(trigger_data))');
    });

    it('should print execution markers for parsing', () => {
      const workflow = createMockWorkflow();
      const result = generatePythonWorkflow(workflow);

      expect(result.code).toContain('print("__CATALYST_EXECUTION_START__")');
      expect(result.code).toContain('print(json.dumps(execution_result, indent=2))');
      expect(result.code).toContain('print("__CATALYST_EXECUTION_END__")');
    });

    it('should exit with code 0 on success', () => {
      const workflow = createMockWorkflow();
      const result = generatePythonWorkflow(workflow);

      expect(result.code).toContain('sys.exit(0)');
    });

    it('should handle JSON decode errors', () => {
      const workflow = createMockWorkflow();
      const result = generatePythonWorkflow(workflow);

      expect(result.code).toContain('except json.JSONDecodeError as e:');
      expect(result.code).toContain('Invalid JSON in trigger data');
      expect(result.code).toContain('sys.exit(1)');
    });

    it('should handle general exceptions in test mode', () => {
      const workflow = createMockWorkflow();
      const result = generatePythonWorkflow(workflow);

      expect(result.code).toContain('except Exception as e:');
      expect(result.code).toContain('Test execution failed');
    });
  });

  describe('Production Mode Preservation', () => {
    it('should still generate FastAPI setup code', () => {
      const workflow = createMockWorkflow();
      const result = generatePythonWorkflow(workflow);

      expect(result.code).toContain('from fastapi import FastAPI');
      expect(result.code).toContain('app = FastAPI(');
    });

    it('should still generate FastAPI endpoint', () => {
      const workflow = createMockWorkflow();
      const result = generatePythonWorkflow(workflow);

      expect(result.code).toContain('@app.post("/workflow/');
      expect(result.code).toContain('async def workflow_');
    });

    it('should include uvicorn server startup in production mode', () => {
      const workflow = createMockWorkflow();
      const result = generatePythonWorkflow(workflow);

      expect(result.code).toContain('import uvicorn');
      expect(result.code).toContain('uvicorn.run(');
      expect(result.code).toContain('host="0.0.0.0"');
      expect(result.code).toContain('port=8000');
    });
  });

  describe('Node Execution Logic', () => {
    it('should generate same node execution code for both modes', () => {
      const workflow = createMockWorkflow();
      const result = generatePythonWorkflow(workflow);

      // Test function should have similar node execution as FastAPI endpoint
      const testFunctionMatch = result.code.match(/async def execute_workflow_test[\s\S]*?(?=^# ====)/m);
      const fastApiMatch = result.code.match(/@app\.post[\s\S]*?(?=^# ====)/m);

      expect(testFunctionMatch).toBeTruthy();
      expect(fastApiMatch).toBeTruthy();

      // Both should execute the prompt template node
      expect(result.code).toContain('execute_prompt_template');
    });

    it('should track node executions in test mode', () => {
      const workflow = createMockWorkflow();
      const result = generatePythonWorkflow(workflow);

      const testFunctionCode = result.code.substring(
        result.code.indexOf('async def execute_workflow_test')
      );

      expect(testFunctionCode).toContain('NodeExecution(');
      expect(testFunctionCode).toContain('node_id=');
      expect(testFunctionCode).toContain('node_name=');
      expect(testFunctionCode).toContain('node_type=');
    });
  });

  describe('Workflow Name Sanitization', () => {
    it('should sanitize workflow name with special characters', () => {
      const workflow = createMockWorkflow('My Workflow!');
      const result = generatePythonWorkflow(workflow);

      expect(result.workflowName).toBe('my_workflow');
      expect(result.code).toContain('@app.post("/workflow/my_workflow")');
    });

    it('should handle workflow name with hyphens', () => {
      const workflow = createMockWorkflow('User-API-v2');
      const result = generatePythonWorkflow(workflow);

      expect(result.workflowName).toBe('user_api_v2');
    });
  });

  describe('Complete File Structure', () => {
    it('should generate complete Python file with all sections', () => {
      const workflow = createMockWorkflow();
      const result = generatePythonWorkflow(workflow);

      // Check for all major sections
      expect(result.code).toContain('# EXECUTION LOGGING');
      expect(result.code).toContain('# EXECUTION CONTEXT');
      expect(result.code).toContain('# FASTAPI APPLICATION');
      expect(result.code).toContain('# NODE LIBRARY FUNCTIONS');
      expect(result.code).toContain('# WORKFLOW ENDPOINTS');
      expect(result.code).toContain('# TEST EXECUTION FUNCTION');
      expect(result.code).toContain('# MAIN');
    });

    it('should include workflow metadata in header', () => {
      const workflow = createMockWorkflow('My Test Workflow');
      const result = generatePythonWorkflow(workflow);

      expect(result.code).toContain('Catalyst Workflow: My Test Workflow');
      expect(result.code).toContain('Test workflow description');
      expect(result.code).toContain('@catalyst:generated');
    });

    it('should return correct metadata', () => {
      const workflow = createMockWorkflow();
      const result = generatePythonWorkflow(workflow);

      expect(result.workflowName).toBe('test_workflow');
      expect(result.nodeCount).toBe(1);
      expect(result.dependencies).toBeInstanceOf(Array);
      expect(result.warnings).toBeInstanceOf(Array);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty workflow name', () => {
      const workflow = createMockWorkflow('   ');
      const result = generatePythonWorkflow(workflow);

      expect(result.workflowName).toBe('workflow'); // fallback
    });

    it('should handle workflow with multiple nodes', () => {
      const workflow = createMockWorkflow();
      workflow.nodes['node-2'] = {
        id: 'node-2',
        name: 'LLM Node',
        type: 'groqCompletion',
        position: { x: 100, y: 0 },
        config: {
          model: 'llama-3.3-70b-versatile',
          prompt: 'Test prompt',
        },
      };

      const result = generatePythonWorkflow(workflow);

      expect(result.nodeCount).toBe(2);
      expect(result.code).toContain('result_1');
      expect(result.code).toContain('result_2');
    });
  });
});
