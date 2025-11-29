/**
 * @file index.ts
 * @description Barrel export for Rise Logic System types and utilities
 * 
 * @architecture Phase 4, Task 4.0 - Logic System Foundation
 * @created 2025-11-29
 * @author AI (Cline) + Human Review
 * @confidence 10/10 - Simple barrel export
 * 
 * @see ./types.ts - Type definitions
 */

// ============================================================
// TYPE EXPORTS
// ============================================================

export type {
  // Event types
  EventType,
  AllEventTypes,
  ComponentEvent,
  ComponentEvents,
  
  // State types
  StateVariableType,
  StateVariable,
  PageState,
  
  // Value types
  StaticValue,
  ExpressionValue,
  FlowValue,
  
  // Node types
  NodeType,
  AllNodeTypes,
  NodePosition,
  BaseNode,
  EventNode,
  SetStateNode,
  AlertNode,
  ConsoleNode,
  FlowNode,
  
  // Edge types
  FlowEdge,
  
  // Flow types
  FlowTrigger,
  Flow,
  FlowsMap,
} from './types';

// ============================================================
// TYPE GUARD EXPORTS
// ============================================================

export {
  isEventNode,
  isSetStateNode,
  isAlertNode,
  isConsoleNode,
  isValidStaticValue,
  isStaticValue,
  isLevel15NodeType,
  isLevel15EventType,
  isValidStateVariableType,
} from './types';

// ============================================================
// FACTORY FUNCTION EXPORTS
// ============================================================

export {
  generateFlowId,
  generateNodeId,
  generateEdgeId,
  createDefaultStateVariable,
  createEventNode,
  createSetStateNode,
  createAlertNode,
  createConsoleNode,
  createEdge,
  createFlow,
} from './types';
