/**
 * @file Level15SchemaValidator.ts
 * @description Schema validator for Level 1.5 (Micro Logic Editor) manifests
 * 
 * @architecture Phase 4, Task 4.0 - Logic System Foundation
 * @created 2025-11-29
 * @author AI (Cline) + Human Review
 * @confidence 9/10 - Extends proven Level 1 validator with clear Level 1.5 rules
 * 
 * @see .implementation/phase-4-logic-editor/task-4.0-logic-system-foundation.md
 * @see .implementation/phase-4-logic-editor/phase-4-micro-logic-editor.md
 * @see docs/SCHEMA_LEVELS.md - Level progression
 * 
 * PROBLEM SOLVED:
 * Level 1 validator doesn't handle logic system structures:
 * - pageState (state variables)
 * - flows (logic flows with nodes and edges)
 * - component events (onClick handlers)
 * 
 * SOLUTION:
 * Extend Level 1 validation with Level 1.5 specific checks:
 * - Validate pageState structure and types
 * - Validate flows, nodes, and edges
 * - Validate component events reference valid flows
 * - Enforce Level 1.5 constraints (no expressions, limited node types)
 * 
 * LEVEL 1.5 CONSTRAINTS ENFORCED:
 * - Only onClick events
 * - Only 3 action node types: setState, alert, console
 * - Only static values (no expressions)
 * - Only page-level state (no global state)
 * 
 * @security-critical false
 * @performance-critical true - Runs before every code generation
 */

import {
  ValidationResult,
  ValidationError,
  ComponentManifest,
  Component,
  StateValidationError,
} from './types';
import {
  LEVEL_15_RULES,
  LEVEL_15_ERROR_CODES,
  isAllowedEventType,
  isAllowedNodeType,
  isAllowedStateType,
  isValidStateVariableName,
  isValidFlowId,
} from './ValidationRules';
import { SchemaValidator } from './SchemaValidator';
import {
  isSetStateNode,
  isAlertNode,
  isConsoleNode,
  FlowNode,
  SetStateNode,
  AlertNode,
  ConsoleNode,
} from '../logic/types';

/**
 * Validates Level 1.5 (Micro Logic Editor) manifests.
 * 
 * @class Level15SchemaValidator
 */
export class Level15SchemaValidator {
  private readonly rules = LEVEL_15_RULES;
  private readonly baseValidator = new SchemaValidator();
  
  /**
   * Validate complete manifest against Level 1.5 schema rules.
   */
  validate(manifest: any): ValidationResult {
    const startTime = Date.now();
    const allErrors: ValidationError[] = [];
    
    // Basic structure check
    if (!manifest || typeof manifest !== 'object') {
      return this.buildResult(
        [{
          field: 'manifest',
          message: 'Manifest must be a valid object',
          severity: 'ERROR',
          path: 'manifest',
          code: LEVEL_15_ERROR_CODES.MISSING_REQUIRED_FIELD,
        }],
        0, 0, 0,
        Date.now() - startTime
      );
    }
    
    // For Level 1 manifests, delegate to base validator
    if (manifest.level !== undefined && manifest.level < 1.5) {
      return this.baseValidator.validate(manifest);
    }
    
    // Run Level 1 validation first
    const manifestForBase = { ...manifest, level: 1 };
    const baseResult = this.baseValidator.validate(manifestForBase);
    allErrors.push(...baseResult.errors);
    
    // Level 1.5 specific validation
    if (manifest.pageState) {
      allErrors.push(...this.validatePageState(manifest.pageState));
    }
    
    if (manifest.flows) {
      allErrors.push(...this.validateFlows(manifest.flows, manifest));
    }
    
    if (manifest.components) {
      allErrors.push(...this.validateAllComponentEvents(manifest.components, manifest));
    }
    
    allErrors.push(...this.validateCrossReferences(manifest));
    
    const stateVarCount = manifest.pageState ? Object.keys(manifest.pageState).length : 0;
    const flowCount = manifest.flows ? Object.keys(manifest.flows).length : 0;
    
    return this.buildResult(
      allErrors,
      baseResult.componentCount || 0,
      stateVarCount,
      flowCount,
      Date.now() - startTime
    );
  }
  
  /**
   * Validate page state definitions.
   */
  private validatePageState(pageState: any): ValidationError[] {
    const errors: ValidationError[] = [];
    
    if (typeof pageState !== 'object' || pageState === null) {
      errors.push({
        field: 'pageState',
        message: 'pageState must be an object',
        severity: 'ERROR',
        path: 'pageState',
        code: LEVEL_15_ERROR_CODES.MISSING_REQUIRED_FIELD,
      });
      return errors;
    }
    
    const entries = Object.entries(pageState);
    
    if (entries.length > this.rules.stateVariable.maxVariables) {
      errors.push({
        field: 'pageState',
        message: `Too many state variables (${entries.length}). Maximum is ${this.rules.stateVariable.maxVariables}`,
        severity: 'ERROR',
        path: 'pageState',
        code: LEVEL_15_ERROR_CODES.TOO_MANY_STATE_VARIABLES,
      });
    }
    
    for (const [varName, varDef] of entries) {
      const varDefTyped = varDef as any;
      
      if (!isValidStateVariableName(varName)) {
        const error: StateValidationError = {
          field: 'name',
          message: `Invalid state variable name: "${varName}"`,
          severity: 'ERROR',
          path: `pageState.${varName}`,
          code: LEVEL_15_ERROR_CODES.INVALID_STATE_VAR_NAME,
          variableName: varName,
        };
        errors.push(error);
      }
      
      if (!varDefTyped || typeof varDefTyped !== 'object') {
        errors.push({
          field: varName,
          message: `State variable "${varName}" must be an object`,
          severity: 'ERROR',
          path: `pageState.${varName}`,
          code: LEVEL_15_ERROR_CODES.MISSING_REQUIRED_FIELD,
        });
        continue;
      }
      
      if (!varDefTyped.type) {
        errors.push({
          field: 'type',
          message: `State variable "${varName}" is missing type`,
          severity: 'ERROR',
          path: `pageState.${varName}.type`,
          code: LEVEL_15_ERROR_CODES.MISSING_REQUIRED_FIELD,
        });
      } else if (!isAllowedStateType(varDefTyped.type)) {
        errors.push({
          field: 'type',
          message: `Invalid type "${varDefTyped.type}" for state variable "${varName}"`,
          severity: 'ERROR',
          path: `pageState.${varName}.type`,
          code: LEVEL_15_ERROR_CODES.INVALID_STATE_VAR_TYPE,
        });
      }
      
      if (varDefTyped.initialValue === undefined) {
        errors.push({
          field: 'initialValue',
          message: `State variable "${varName}" is missing initialValue`,
          severity: 'ERROR',
          path: `pageState.${varName}.initialValue`,
          code: LEVEL_15_ERROR_CODES.MISSING_REQUIRED_FIELD,
        });
      } else if (varDefTyped.type && typeof varDefTyped.initialValue !== varDefTyped.type) {
        errors.push({
          field: 'initialValue',
          message: `State variable "${varName}" type mismatch`,
          severity: 'ERROR',
          path: `pageState.${varName}.initialValue`,
          code: LEVEL_15_ERROR_CODES.STATE_TYPE_MISMATCH,
        });
      }
    }
    
    return errors;
  }
  
  /**
   * Validate all flows.
   */
  private validateFlows(flows: any, manifest: ComponentManifest): ValidationError[] {
    const errors: ValidationError[] = [];
    
    if (typeof flows !== 'object' || flows === null) {
      errors.push({
        field: 'flows',
        message: 'flows must be an object',
        severity: 'ERROR',
        path: 'flows',
        code: LEVEL_15_ERROR_CODES.MISSING_REQUIRED_FIELD,
      });
      return errors;
    }
    
    const entries = Object.entries(flows);
    
    if (entries.length > this.rules.flow.maxFlows) {
      errors.push({
        field: 'flows',
        message: `Too many flows (${entries.length})`,
        severity: 'ERROR',
        path: 'flows',
        code: LEVEL_15_ERROR_CODES.TOO_MANY_FLOWS,
      });
    }
    
    for (const [flowId, flow] of entries) {
      errors.push(...this.validateFlow(flowId, flow as any, manifest));
    }
    
    return errors;
  }
  
  /**
   * Validate a single flow.
   */
  private validateFlow(flowId: string, flow: any, manifest: ComponentManifest): ValidationError[] {
    const errors: ValidationError[] = [];
    
    if (!flow || typeof flow !== 'object') {
      errors.push({
        field: flowId,
        message: `Flow "${flowId}" must be an object`,
        severity: 'ERROR',
        path: `flows.${flowId}`,
        code: LEVEL_15_ERROR_CODES.MISSING_REQUIRED_FIELD,
      });
      return errors;
    }
    
    if (!isValidFlowId(flowId)) {
      errors.push({
        field: 'id',
        message: `Invalid flow ID format: "${flowId}"`,
        severity: 'ERROR',
        path: `flows.${flowId}`,
        code: LEVEL_15_ERROR_CODES.INVALID_FLOW_ID,
      });
    }
    
    if (flow.id && flow.id !== flowId) {
      errors.push({
        field: 'id',
        message: `Flow ID "${flow.id}" doesn't match key "${flowId}"`,
        severity: 'ERROR',
        path: `flows.${flowId}.id`,
        code: LEVEL_15_ERROR_CODES.FLOW_ID_MISMATCH,
      });
    }
    
    if (!flow.name || typeof flow.name !== 'string') {
      errors.push({
        field: 'name',
        message: `Flow "${flowId}" is missing name`,
        severity: 'ERROR',
        path: `flows.${flowId}.name`,
        code: LEVEL_15_ERROR_CODES.MISSING_REQUIRED_FIELD,
      });
    }
    
    errors.push(...this.validateFlowTrigger(flowId, flow.trigger, manifest));
    
    const nodeIds = new Set<string>();
    if (flow.nodes && Array.isArray(flow.nodes)) {
      if (flow.nodes.length > this.rules.flow.maxNodesPerFlow) {
        errors.push({
          field: 'nodes',
          message: `Flow "${flowId}" has too many nodes`,
          severity: 'ERROR',
          path: `flows.${flowId}.nodes`,
          code: LEVEL_15_ERROR_CODES.TOO_MANY_FLOW_NODES,
        });
      }
      
      for (const node of flow.nodes) {
        errors.push(...this.validateFlowNode(flowId, node, nodeIds, manifest));
        if (node?.id) nodeIds.add(node.id);
      }
    }
    
    if (flow.edges && Array.isArray(flow.edges)) {
      errors.push(...this.validateFlowEdges(flowId, flow.edges, nodeIds));
    }
    
    return errors;
  }
  
  /**
   * Validate flow trigger.
   */
  private validateFlowTrigger(flowId: string, trigger: any, manifest: ComponentManifest): ValidationError[] {
    const errors: ValidationError[] = [];
    
    if (!trigger || typeof trigger !== 'object') {
      errors.push({
        field: 'trigger',
        message: `Flow "${flowId}" is missing trigger`,
        severity: 'ERROR',
        path: `flows.${flowId}.trigger`,
        code: LEVEL_15_ERROR_CODES.MISSING_FLOW_TRIGGER,
      });
      return errors;
    }
    
    if (!trigger.type) {
      errors.push({
        field: 'type',
        message: `Flow "${flowId}" trigger is missing type`,
        severity: 'ERROR',
        path: `flows.${flowId}.trigger.type`,
        code: LEVEL_15_ERROR_CODES.MISSING_REQUIRED_FIELD,
      });
    } else if (!isAllowedEventType(trigger.type)) {
      errors.push({
        field: 'type',
        message: `Unsupported event type "${trigger.type}"`,
        severity: 'ERROR',
        path: `flows.${flowId}.trigger.type`,
        code: LEVEL_15_ERROR_CODES.UNSUPPORTED_EVENT_TYPE,
      });
    }
    
    if (!trigger.componentId) {
      errors.push({
        field: 'componentId',
        message: `Flow "${flowId}" trigger is missing componentId`,
        severity: 'ERROR',
        path: `flows.${flowId}.trigger.componentId`,
        code: LEVEL_15_ERROR_CODES.MISSING_REQUIRED_FIELD,
      });
    } else if (!manifest.components?.[trigger.componentId]) {
      errors.push({
        field: 'componentId',
        message: `Flow "${flowId}" references non-existent component`,
        severity: 'ERROR',
        path: `flows.${flowId}.trigger.componentId`,
        code: LEVEL_15_ERROR_CODES.INVALID_TRIGGER_COMPONENT,
      });
    }
    
    return errors;
  }
  
  /**
   * Validate a flow node.
   */
  private validateFlowNode(flowId: string, node: any, existingIds: Set<string>, manifest: ComponentManifest): ValidationError[] {
    const errors: ValidationError[] = [];
    
    if (!node || typeof node !== 'object') {
      errors.push({
        field: 'node',
        message: `Flow "${flowId}" has invalid node`,
        severity: 'ERROR',
        path: `flows.${flowId}.nodes`,
        code: LEVEL_15_ERROR_CODES.MISSING_REQUIRED_FIELD,
      });
      return errors;
    }
    
    if (!node.id) {
      errors.push({
        field: 'id',
        message: `Flow "${flowId}" has node without ID`,
        severity: 'ERROR',
        path: `flows.${flowId}.nodes`,
        code: LEVEL_15_ERROR_CODES.MISSING_REQUIRED_FIELD,
      });
    } else if (existingIds.has(node.id)) {
      errors.push({
        field: 'id',
        message: `Duplicate node ID "${node.id}"`,
        severity: 'ERROR',
        path: `flows.${flowId}.nodes.${node.id}`,
        code: LEVEL_15_ERROR_CODES.DUPLICATE_NODE_ID,
      });
    }
    
    if (!node.type) {
      errors.push({
        field: 'type',
        message: `Node is missing type`,
        severity: 'ERROR',
        path: `flows.${flowId}.nodes.${node.id || 'unknown'}.type`,
        code: LEVEL_15_ERROR_CODES.MISSING_REQUIRED_FIELD,
      });
    } else if (!isAllowedNodeType(node.type)) {
      errors.push({
        field: 'type',
        message: `Unsupported node type "${node.type}"`,
        severity: 'ERROR',
        path: `flows.${flowId}.nodes.${node.id || 'unknown'}.type`,
        code: LEVEL_15_ERROR_CODES.UNSUPPORTED_NODE_TYPE,
      });
    }
    
    if (!node.position || typeof node.position !== 'object') {
      errors.push({
        field: 'position',
        message: `Node is missing position`,
        severity: 'ERROR',
        path: `flows.${flowId}.nodes.${node.id || 'unknown'}.position`,
        code: LEVEL_15_ERROR_CODES.INVALID_NODE_POSITION,
      });
    } else if (typeof node.position.x !== 'number' || typeof node.position.y !== 'number') {
      errors.push({
        field: 'position',
        message: `Node has invalid position`,
        severity: 'ERROR',
        path: `flows.${flowId}.nodes.${node.id || 'unknown'}.position`,
        code: LEVEL_15_ERROR_CODES.INVALID_NODE_POSITION,
      });
    }
    
    if (node.type && node.id) {
      errors.push(...this.validateNodeConfig(flowId, node, manifest));
    }
    
    return errors;
  }
  
  /**
   * Validate node configuration.
   */
  private validateNodeConfig(flowId: string, node: FlowNode, manifest: ComponentManifest): ValidationError[] {
    const errors: ValidationError[] = [];
    
    if (!node.config && node.type !== 'event') {
      errors.push({
        field: 'config',
        message: `Node "${node.id}" is missing config`,
        severity: 'ERROR',
        path: `flows.${flowId}.nodes.${node.id}.config`,
        code: LEVEL_15_ERROR_CODES.MISSING_NODE_CONFIG,
      });
      return errors;
    }
    
    if (isSetStateNode(node)) {
      errors.push(...this.validateSetStateConfig(flowId, node, manifest));
    } else if (isAlertNode(node)) {
      errors.push(...this.validateAlertConfig(flowId, node));
    } else if (isConsoleNode(node)) {
      errors.push(...this.validateConsoleConfig(flowId, node));
    }
    
    return errors;
  }
  
  /**
   * Validate SetState node config.
   */
  private validateSetStateConfig(flowId: string, node: SetStateNode, manifest: ComponentManifest): ValidationError[] {
    const errors: ValidationError[] = [];
    const config = node.config;
    
    if (!config.variable) {
      errors.push({
        field: 'variable',
        message: `SetState node "${node.id}" is missing variable`,
        severity: 'ERROR',
        path: `flows.${flowId}.nodes.${node.id}.config.variable`,
        code: LEVEL_15_ERROR_CODES.MISSING_REQUIRED_FIELD,
      });
    } else if (manifest.pageState && !manifest.pageState[config.variable]) {
      errors.push({
        field: 'variable',
        message: `SetState references undefined variable "${config.variable}"`,
        severity: 'ERROR',
        path: `flows.${flowId}.nodes.${node.id}.config.variable`,
        code: LEVEL_15_ERROR_CODES.INVALID_STATE_REFERENCE,
      });
    }
    
    if (!config.value) {
      errors.push({
        field: 'value',
        message: `SetState node "${node.id}" is missing value`,
        severity: 'ERROR',
        path: `flows.${flowId}.nodes.${node.id}.config.value`,
        code: LEVEL_15_ERROR_CODES.MISSING_REQUIRED_FIELD,
      });
    } else if (config.value.type !== 'static') {
      errors.push({
        field: 'value.type',
        message: `Level 1.5 only supports static values`,
        severity: 'ERROR',
        path: `flows.${flowId}.nodes.${node.id}.config.value.type`,
        code: LEVEL_15_ERROR_CODES.EXPRESSIONS_NOT_SUPPORTED,
      });
    }
    
    return errors;
  }
  
  /**
   * Validate Alert node config.
   */
  private validateAlertConfig(flowId: string, node: AlertNode): ValidationError[] {
    const errors: ValidationError[] = [];
    const config = node.config;
    
    if (!config.message) {
      errors.push({
        field: 'message',
        message: `Alert node "${node.id}" is missing message`,
        severity: 'ERROR',
        path: `flows.${flowId}.nodes.${node.id}.config.message`,
        code: LEVEL_15_ERROR_CODES.MISSING_REQUIRED_FIELD,
      });
    } else if (config.message.type !== 'static') {
      errors.push({
        field: 'message.type',
        message: `Level 1.5 only supports static values`,
        severity: 'ERROR',
        path: `flows.${flowId}.nodes.${node.id}.config.message.type`,
        code: LEVEL_15_ERROR_CODES.EXPRESSIONS_NOT_SUPPORTED,
      });
    }
    
    return errors;
  }
  
  /**
   * Validate Console node config.
   */
  private validateConsoleConfig(flowId: string, node: ConsoleNode): ValidationError[] {
    const errors: ValidationError[] = [];
    const config = node.config;
    
    if (!config.level || !['log', 'warn', 'error'].includes(config.level)) {
      errors.push({
        field: 'level',
        message: `Console node "${node.id}" has invalid level`,
        severity: 'ERROR',
        path: `flows.${flowId}.nodes.${node.id}.config.level`,
        code: LEVEL_15_ERROR_CODES.INVALID_VALUE_TYPE,
      });
    }
    
    if (!config.message) {
      errors.push({
        field: 'message',
        message: `Console node "${node.id}" is missing message`,
        severity: 'ERROR',
        path: `flows.${flowId}.nodes.${node.id}.config.message`,
        code: LEVEL_15_ERROR_CODES.MISSING_REQUIRED_FIELD,
      });
    } else if (config.message.type !== 'static') {
      errors.push({
        field: 'message.type',
        message: `Level 1.5 only supports static values`,
        severity: 'ERROR',
        path: `flows.${flowId}.nodes.${node.id}.config.message.type`,
        code: LEVEL_15_ERROR_CODES.EXPRESSIONS_NOT_SUPPORTED,
      });
    }
    
    return errors;
  }
  
  /**
   * Validate flow edges.
   */
  private validateFlowEdges(flowId: string, edges: any[], nodeIds: Set<string>): ValidationError[] {
    const errors: ValidationError[] = [];
    const edgeIds = new Set<string>();
    
    for (const edge of edges) {
      if (!edge || typeof edge !== 'object') continue;
      
      if (!edge.id) {
        errors.push({
          field: 'id',
          message: `Edge in flow "${flowId}" is missing ID`,
          severity: 'ERROR',
          path: `flows.${flowId}.edges`,
          code: LEVEL_15_ERROR_CODES.MISSING_REQUIRED_FIELD,
        });
      } else if (edgeIds.has(edge.id)) {
        errors.push({
          field: 'id',
          message: `Duplicate edge ID "${edge.id}"`,
          severity: 'ERROR',
          path: `flows.${flowId}.edges.${edge.id}`,
          code: LEVEL_15_ERROR_CODES.DUPLICATE_EDGE_ID,
        });
      } else {
        edgeIds.add(edge.id);
      }
      
      if (!edge.source) {
        errors.push({
          field: 'source',
          message: `Edge is missing source`,
          severity: 'ERROR',
          path: `flows.${flowId}.edges.${edge.id || 'unknown'}.source`,
          code: LEVEL_15_ERROR_CODES.MISSING_REQUIRED_FIELD,
        });
      } else if (!nodeIds.has(edge.source)) {
        errors.push({
          field: 'source',
          message: `Edge references non-existent source node "${edge.source}"`,
          severity: 'ERROR',
          path: `flows.${flowId}.edges.${edge.id || 'unknown'}.source`,
          code: LEVEL_15_ERROR_CODES.INVALID_EDGE_SOURCE,
        });
      }
      
      if (!edge.target) {
        errors.push({
          field: 'target',
          message: `Edge is missing target`,
          severity: 'ERROR',
          path: `flows.${flowId}.edges.${edge.id || 'unknown'}.target`,
          code: LEVEL_15_ERROR_CODES.MISSING_REQUIRED_FIELD,
        });
      } else if (!nodeIds.has(edge.target)) {
        errors.push({
          field: 'target',
          message: `Edge references non-existent target node "${edge.target}"`,
          severity: 'ERROR',
          path: `flows.${flowId}.edges.${edge.id || 'unknown'}.target`,
          code: LEVEL_15_ERROR_CODES.INVALID_EDGE_TARGET,
        });
      }
    }
    
    return errors;
  }
  
  /**
   * Validate all component events.
   */
  private validateAllComponentEvents(components: Record<string, Component>, manifest: ComponentManifest): ValidationError[] {
    const errors: ValidationError[] = [];
    
    for (const [compId, component] of Object.entries(components)) {
      if (component.events) {
        errors.push(...this.validateComponentEvents(compId, component, manifest));
      }
    }
    
    return errors;
  }
  
  /**
   * Validate a component's events.
   */
  private validateComponentEvents(compId: string, component: Component, manifest: ComponentManifest): ValidationError[] {
    const errors: ValidationError[] = [];
    const events = component.events;
    
    if (!events) return errors;
    
    for (const [eventType, eventConfig] of Object.entries(events)) {
      if (!isAllowedEventType(eventType)) {
        errors.push({
          field: 'events',
          message: `Component "${compId}" has unsupported event type "${eventType}"`,
          severity: 'ERROR',
          path: `components.${compId}.events.${eventType}`,
          code: LEVEL_15_ERROR_CODES.UNSUPPORTED_EVENT_TYPE,
        });
        continue;
      }
      
      if (!eventConfig?.flowId) {
        errors.push({
          field: 'flowId',
          message: `Event "${eventType}" on "${compId}" is missing flowId`,
          severity: 'ERROR',
          path: `components.${compId}.events.${eventType}.flowId`,
          code: LEVEL_15_ERROR_CODES.MISSING_REQUIRED_FIELD,
        });
      } else if (!manifest.flows?.[eventConfig.flowId]) {
        errors.push({
          field: 'flowId',
          message: `Event references non-existent flow "${eventConfig.flowId}"`,
          severity: 'ERROR',
          path: `components.${compId}.events.${eventType}.flowId`,
          code: LEVEL_15_ERROR_CODES.INVALID_FLOW_REFERENCE,
        });
      }
    }
    
    return errors;
  }
  
  /**
   * Validate cross-references between structures.
   */
  private validateCrossReferences(manifest: ComponentManifest): ValidationError[] {
    const errors: ValidationError[] = [];
    
    // Check that all flows have their trigger component registered
    if (manifest.flows) {
      for (const [flowId, flow] of Object.entries(manifest.flows)) {
        const trigger = (flow as any).trigger;
        if (trigger?.componentId && manifest.components?.[trigger.componentId]) {
          const comp = manifest.components[trigger.componentId];
          // Check if component has this event configured
          const events = (comp as any).events;
          if (!events?.onClick?.flowId || events.onClick.flowId !== flowId) {
            errors.push({
              field: 'events',
              message: `Flow "${flowId}" trigger component "${trigger.componentId}" doesn't have matching onClick event`,
              severity: 'WARNING',
              path: `components.${trigger.componentId}.events`,
              code: LEVEL_15_ERROR_CODES.INVALID_FLOW_REFERENCE,
            });
          }
        }
      }
    }
    
    return errors;
  }
  
  /**
   * Build the final validation result.
   */
  private buildResult(
    allErrors: ValidationError[],
    componentCount: number,
    stateVariableCount: number,
    flowCount: number,
    validationTime: number
  ): ValidationResult {
    const errors = allErrors.filter(e => e.severity === 'ERROR');
    const warnings = allErrors.filter(e => e.severity === 'WARNING');
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      level: 1.5,
      componentCount,
      stateVariableCount,
      flowCount,
      validationTime,
    };
  }
}
