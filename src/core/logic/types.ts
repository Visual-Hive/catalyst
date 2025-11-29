/**
 * @file types.ts
 * @description Type definitions for Rise Logic System - Level 1.5 (Micro Logic Editor)
 * 
 * @architecture Phase 4, Task 4.0 - Logic System Foundation
 * @created 2025-11-29
 * @author AI (Cline) + Human Review
 * @confidence 9/10 - Based on clear Level 1.5 spec from phase-4-micro-logic-editor.md
 * 
 * @see .implementation/phase-4-logic-editor/phase-4-micro-logic-editor.md - Phase overview
 * @see .implementation/phase-4-logic-editor/task-4.0-logic-system-foundation.md - Task details
 * @see docs/LOGIC_SYSTEM.md - Full Level 2 spec (for reference)
 * 
 * PROBLEM SOLVED:
 * The Level 1 schema only supports static properties. To add visual logic editing
 * capabilities, we need types for:
 * - Events: What triggers logic (onClick for Level 1.5)
 * - Page State: Reactive state variables at page level
 * - Flows: Visual logic flows with nodes and edges
 * 
 * SOLUTION:
 * Define comprehensive TypeScript interfaces for the logic system with:
 * - Strict Level 1.5 constraints (no expressions, limited node types)
 * - Future-proof design (easy to extend for Level 2)
 * - Type guards for runtime validation
 * 
 * LEVEL 1.5 CONSTRAINTS:
 * - Only onClick events (no onChange, onSubmit, etc.)
 * - Only 3 action node types: SetState, Alert, Console
 * - Only page-level state (no global/component state)
 * - Only static values (no expressions)
 * - Single-step flows (event → action, no chaining)
 * 
 * @security-critical false
 * @performance-critical false
 */

// ============================================================
// EVENT TYPES
// ============================================================

/**
 * Supported event types in Level 1.5
 * 
 * LEVEL 1.5: Only onClick is supported
 * LEVEL 2 will add: onChange, onSubmit, onMount, onUnmount, onFocus, onBlur, etc.
 */
export type EventType = 'onClick';

/**
 * All possible event types (for future reference)
 * Used for documentation and type checking in Level 2+
 */
export type AllEventTypes = 
  | 'onClick'       // Level 1.5
  | 'onChange'      // Level 2
  | 'onSubmit'      // Level 2
  | 'onMount'       // Level 2
  | 'onUnmount'     // Level 2
  | 'onFocus'       // Level 2
  | 'onBlur'        // Level 2
  | 'onKeyDown'     // Level 2
  | 'onKeyUp';      // Level 2

/**
 * Event definition on a component
 * 
 * DESIGN DECISION: Events reference flows by ID rather than embedding flow data
 * This keeps the component definition clean and allows flows to be managed
 * separately in the flows section of the manifest.
 * 
 * @example
 * {
 *   flowId: "flow_button_click_001"
 * }
 */
export interface ComponentEvent {
  /** 
   * Reference to the flow that handles this event 
   * Must exist in manifest.flows
   */
  flowId: string;
}

/**
 * Events map on a component (event type → handler)
 * 
 * LEVEL 1.5: Only onClick is allowed
 * 
 * @example
 * {
 *   onClick: {
 *     flowId: "flow_001"
 *   }
 * }
 */
export interface ComponentEvents {
  /** Click event handler - the only event type in Level 1.5 */
  onClick?: ComponentEvent;
  
  // Level 2 will add:
  // onChange?: ComponentEvent;
  // onSubmit?: ComponentEvent;
  // onMount?: ComponentEvent;
  // onUnmount?: ComponentEvent;
}

// ============================================================
// PAGE STATE
// ============================================================

/**
 * Supported state variable types in Level 1.5
 * 
 * These are primitive types that can be safely serialized to JSON
 * and used in the logic system without expression evaluation.
 */
export type StateVariableType = 'string' | 'number' | 'boolean';

/**
 * Definition of a page-level state variable
 * 
 * DESIGN DECISION: Store type separately from initialValue
 * This allows for type validation at design time (before runtime)
 * and makes the generated code types more explicit.
 * 
 * @example
 * {
 *   type: "number",
 *   initialValue: 0
 * }
 */
export interface StateVariable {
  /** 
   * Variable type - must be a primitive type
   * Used for validation and code generation
   */
  type: StateVariableType;
  
  /** 
   * Initial value - must match the declared type
   * This is what the state starts with on component mount
   */
  initialValue: string | number | boolean;
}

/**
 * Page state definition (variable name → definition)
 * 
 * Page state is the simplest scope in Level 1.5:
 * - Accessible to all components on the page
 * - Reset when the page unmounts
 * - No cross-page sharing (Level 2 feature)
 * 
 * @example
 * {
 *   "clickCount": {
 *     type: "number",
 *     initialValue: 0
 *   },
 *   "userName": {
 *     type: "string",
 *     initialValue: ""
 *   },
 *   "isActive": {
 *     type: "boolean",
 *     initialValue: false
 *   }
 * }
 */
export interface PageState {
  [variableName: string]: StateVariable;
}

// ============================================================
// STATIC VALUES
// ============================================================

/**
 * Static value wrapper
 * 
 * DESIGN DECISION: Wrap values in { type: 'static', value: ... }
 * This future-proofs for Level 2 where we'll add expressions:
 * - { type: 'static', value: 5 }
 * - { type: 'expression', expression: 'state.count + 1' }
 * 
 * In Level 1.5, only 'static' type is allowed.
 */
export interface StaticValue {
  /** Always 'static' in Level 1.5 */
  type: 'static';
  /** The actual value - must be a primitive type */
  value: string | number | boolean;
}

/**
 * Expression value (Level 2 - NOT SUPPORTED in Level 1.5)
 * Defined here for type completeness and future reference.
 */
export interface ExpressionValue {
  /** Expression type - NOT ALLOWED in Level 1.5 */
  type: 'expression';
  /** Template expression string */
  expression: string;
}

/**
 * Union type for all value types
 * In Level 1.5, only StaticValue is valid
 */
export type FlowValue = StaticValue | ExpressionValue;

// ============================================================
// FLOW NODES
// ============================================================

/**
 * Node types available in Level 1.5
 * 
 * - event: Trigger node (auto-generated, shows which component triggered)
 * - setState: Updates a page state variable
 * - alert: Shows a browser alert dialog
 * - console: Logs to browser console
 * 
 * Level 2 will add: condition, loop, apiCall, navigate, etc.
 */
export type NodeType = 'event' | 'setState' | 'alert' | 'console';

/**
 * All possible node types (for future reference)
 */
export type AllNodeTypes =
  | 'event'       // Level 1.5
  | 'setState'    // Level 1.5
  | 'alert'       // Level 1.5
  | 'console'     // Level 1.5
  | 'condition'   // Level 2 - if/else branching
  | 'loop'        // Level 2 - for/while loops
  | 'apiCall'     // Level 2 - fetch data
  | 'navigate'    // Level 2 - route navigation
  | 'delay'       // Level 2 - wait/timeout
  | 'custom';     // Level 2 - user-defined functions

/**
 * Position on the React Flow canvas
 * 
 * React Flow expects position as { x, y } coordinates.
 * These are stored in the manifest so the canvas state persists.
 */
export interface NodePosition {
  /** X coordinate on canvas (pixels from left) */
  x: number;
  /** Y coordinate on canvas (pixels from top) */
  y: number;
}

/**
 * Base node interface
 * 
 * All flow nodes share these common properties.
 * Specific node types extend this with their own config.
 */
export interface BaseNode {
  /** 
   * Unique node ID within the flow
   * Format: node_[type]_[timestamp]_[random]
   * Example: node_setState_1701234567890_a1b2
   */
  id: string;
  
  /** Node type - determines what this node does */
  type: NodeType;
  
  /** 
   * Position on React Flow canvas
   * Stored so the visual layout persists across sessions
   */
  position: NodePosition;
}

/**
 * Event node - the trigger/entry point of a flow
 * 
 * Event nodes are auto-generated when you create a flow from a component.
 * They are read-only (user cannot edit) and show which component/event
 * triggered this flow.
 * 
 * VISUAL: Shows as the leftmost node, output handle only (no input)
 * 
 * @example
 * {
 *   id: "node_event_001",
 *   type: "event",
 *   position: { x: 100, y: 100 },
 *   config: {
 *     eventType: "onClick",
 *     componentId: "comp_button_001"
 *   }
 * }
 */
export interface EventNode extends BaseNode {
  type: 'event';
  config: {
    /** Event type that triggers this flow */
    eventType: EventType;
    /** Component ID that this event is attached to */
    componentId: string;
  };
}

/**
 * SetState node - updates a page state variable
 * 
 * The most important action node - this is how flows change the UI.
 * User selects a state variable and enters a static value.
 * 
 * LEVEL 1.5 CONSTRAINT: Only static values allowed
 * Level 2 will support expressions like: state.count + 1
 * 
 * @example
 * {
 *   id: "node_setState_001",
 *   type: "setState",
 *   position: { x: 300, y: 100 },
 *   config: {
 *     variable: "clickCount",
 *     value: { type: "static", value: 1 }
 *   }
 * }
 */
export interface SetStateNode extends BaseNode {
  type: 'setState';
  config: {
    /** 
     * Name of the state variable to update
     * Must exist in manifest.pageState
     */
    variable: string;
    
    /** 
     * Value to set - static only in Level 1.5
     * The value type should match the state variable's type
     */
    value: StaticValue;
  };
}

/**
 * Alert node - shows a browser alert dialog
 * 
 * Simple debugging/demo node that shows an alert() popup.
 * Useful for confirming flows are working.
 * 
 * LEVEL 1.5 CONSTRAINT: Message is static string only
 * Level 2 will support expressions in the message.
 * 
 * @example
 * {
 *   id: "node_alert_001",
 *   type: "alert",
 *   position: { x: 300, y: 200 },
 *   config: {
 *     message: { type: "static", value: "Button clicked!" }
 *   }
 * }
 */
export interface AlertNode extends BaseNode {
  type: 'alert';
  config: {
    /** 
     * Message to display in alert dialog
     * Static string only in Level 1.5
     */
    message: StaticValue;
  };
}

/**
 * Console node - logs to browser console
 * 
 * Debugging node that calls console.log/warn/error.
 * Useful for development and understanding flow execution.
 * 
 * LEVEL 1.5 CONSTRAINT: Message is static string only
 * 
 * @example
 * {
 *   id: "node_console_001",
 *   type: "console",
 *   position: { x: 300, y: 300 },
 *   config: {
 *     level: "log",
 *     message: { type: "static", value: "Flow executed!" }
 *   }
 * }
 */
export interface ConsoleNode extends BaseNode {
  type: 'console';
  config: {
    /** Console method to call */
    level: 'log' | 'warn' | 'error';
    
    /** 
     * Message to log
     * Static string only in Level 1.5
     */
    message: StaticValue;
  };
}

/**
 * Union of all node types
 * 
 * Use type guards (isEventNode, isSetStateNode, etc.) to narrow
 * the type when working with a FlowNode.
 */
export type FlowNode = EventNode | SetStateNode | AlertNode | ConsoleNode;

// ============================================================
// FLOW EDGES
// ============================================================

/**
 * Edge connecting two nodes
 * 
 * Edges define the execution flow - which node runs after which.
 * In Level 1.5, edges are simple: event → action (one step).
 * Level 2 will support branching and chaining.
 * 
 * @example
 * {
 *   id: "edge_001",
 *   source: "node_event_001",
 *   target: "node_setState_001"
 * }
 */
export interface FlowEdge {
  /** 
   * Unique edge ID
   * Format: edge_[timestamp]_[random]
   */
  id: string;
  
  /** 
   * Source node ID (where the connection starts)
   * Must reference an existing node in the flow
   */
  source: string;
  
  /** 
   * Target node ID (where the connection ends)
   * Must reference an existing node in the flow
   */
  target: string;
  
  /** 
   * Source handle ID (for nodes with multiple outputs)
   * Not used in Level 1.5, but included for React Flow compatibility
   */
  sourceHandle?: string;
  
  /** 
   * Target handle ID (for nodes with multiple inputs)
   * Not used in Level 1.5, but included for React Flow compatibility
   */
  targetHandle?: string;
}

// ============================================================
// FLOWS
// ============================================================

/**
 * Flow trigger definition
 * 
 * Defines what starts a flow's execution.
 * In Level 1.5, only onClick events on components.
 */
export interface FlowTrigger {
  /** Event type that triggers this flow */
  type: EventType;
  
  /** Component ID that this flow is triggered from */
  componentId: string;
}

/**
 * Complete flow definition
 * 
 * A flow represents a visual logic sequence:
 * - Triggered by an event on a component
 * - Contains nodes (actions) connected by edges
 * - Executes nodes in order based on edge connections
 * 
 * LEVEL 1.5 STRUCTURE:
 * - One event node (auto-generated trigger)
 * - One or more action nodes (setState, alert, console)
 * - Edges connecting event to actions (no branching)
 * 
 * @example
 * {
 *   id: "flow_001",
 *   name: "Handle Button Click",
 *   trigger: {
 *     type: "onClick",
 *     componentId: "comp_button_001"
 *   },
 *   nodes: [...],
 *   edges: [...]
 * }
 */
export interface Flow {
  /** 
   * Unique flow ID
   * Format: flow_[name]_[timestamp]_[random]
   */
  id: string;
  
  /** 
   * Human-readable name
   * Displayed in the UI for identification
   */
  name: string;
  
  /** 
   * What triggers this flow's execution
   * Contains event type and component reference
   */
  trigger: FlowTrigger;
  
  /** 
   * Nodes in this flow
   * Array of event/action nodes
   */
  nodes: FlowNode[];
  
  /** 
   * Connections between nodes
   * Defines execution order
   */
  edges: FlowEdge[];
}

/**
 * Flows map (flow ID → flow definition)
 * 
 * Top-level flows collection in the manifest.
 * 
 * @example
 * {
 *   "flow_001": { id: "flow_001", name: "...", ... },
 *   "flow_002": { id: "flow_002", name: "...", ... }
 * }
 */
export interface FlowsMap {
  [flowId: string]: Flow;
}

// ============================================================
// TYPE GUARDS
// ============================================================

/**
 * Type guard for EventNode
 * 
 * @param node - Node to check
 * @returns True if node is an EventNode
 * 
 * @example
 * if (isEventNode(node)) {
 *   console.log(node.config.eventType); // TypeScript knows it's EventNode
 * }
 */
export function isEventNode(node: FlowNode): node is EventNode {
  return node.type === 'event';
}

/**
 * Type guard for SetStateNode
 * 
 * @param node - Node to check
 * @returns True if node is a SetStateNode
 */
export function isSetStateNode(node: FlowNode): node is SetStateNode {
  return node.type === 'setState';
}

/**
 * Type guard for AlertNode
 * 
 * @param node - Node to check
 * @returns True if node is an AlertNode
 */
export function isAlertNode(node: FlowNode): node is AlertNode {
  return node.type === 'alert';
}

/**
 * Type guard for ConsoleNode
 * 
 * @param node - Node to check
 * @returns True if node is a ConsoleNode
 */
export function isConsoleNode(node: FlowNode): node is ConsoleNode {
  return node.type === 'console';
}

/**
 * Check if a value is a valid static value type
 * 
 * @param value - Value to check
 * @returns True if value is string, number, or boolean
 * 
 * @example
 * if (isValidStaticValue(userInput)) {
 *   // Safe to use in StaticValue
 * }
 */
export function isValidStaticValue(value: unknown): value is string | number | boolean {
  return typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean';
}

/**
 * Check if a value wrapper is a StaticValue (not an expression)
 * 
 * @param value - Value wrapper to check
 * @returns True if it's a static value (Level 1.5 compatible)
 */
export function isStaticValue(value: FlowValue): value is StaticValue {
  return value.type === 'static';
}

/**
 * Check if a node type is allowed in Level 1.5
 * 
 * @param nodeType - Node type to check
 * @returns True if allowed in Level 1.5
 */
export function isLevel15NodeType(nodeType: string): nodeType is NodeType {
  return ['event', 'setState', 'alert', 'console'].includes(nodeType);
}

/**
 * Check if an event type is allowed in Level 1.5
 * 
 * @param eventType - Event type to check
 * @returns True if allowed in Level 1.5 (only onClick)
 */
export function isLevel15EventType(eventType: string): eventType is EventType {
  return eventType === 'onClick';
}

/**
 * Check if a state variable type is valid
 * 
 * @param type - Type to check
 * @returns True if valid state variable type
 */
export function isValidStateVariableType(type: string): type is StateVariableType {
  return ['string', 'number', 'boolean'].includes(type);
}

// ============================================================
// FACTORY FUNCTIONS
// ============================================================

/**
 * Generate a unique flow ID
 * 
 * @param name - Optional name to include in ID
 * @returns Unique flow ID
 */
export function generateFlowId(name?: string): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 6);
  const safeName = name 
    ? name.toLowerCase().replace(/[^a-z0-9]/g, '_').substring(0, 20)
    : 'flow';
  return `flow_${safeName}_${timestamp}_${random}`;
}

/**
 * Generate a unique node ID
 * 
 * @param type - Node type
 * @returns Unique node ID
 */
export function generateNodeId(type: NodeType): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 6);
  return `node_${type}_${timestamp}_${random}`;
}

/**
 * Generate a unique edge ID
 * 
 * @returns Unique edge ID
 */
export function generateEdgeId(): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 6);
  return `edge_${timestamp}_${random}`;
}

/**
 * Create a default state variable
 * 
 * @param type - Variable type
 * @returns StateVariable with default initial value
 */
export function createDefaultStateVariable(type: StateVariableType): StateVariable {
  const defaults: Record<StateVariableType, string | number | boolean> = {
    string: '',
    number: 0,
    boolean: false,
  };
  
  return {
    type,
    initialValue: defaults[type],
  };
}

/**
 * Create an event node for a flow
 * 
 * @param componentId - Component that triggers the event
 * @param eventType - Event type (onClick for Level 1.5)
 * @param position - Position on canvas
 * @returns EventNode
 */
export function createEventNode(
  componentId: string,
  eventType: EventType = 'onClick',
  position: NodePosition = { x: 100, y: 200 }
): EventNode {
  return {
    id: generateNodeId('event'),
    type: 'event',
    position,
    config: {
      eventType,
      componentId,
    },
  };
}

/**
 * Create a setState node
 * 
 * @param variable - State variable name
 * @param value - Value to set
 * @param position - Position on canvas
 * @returns SetStateNode
 */
export function createSetStateNode(
  variable: string,
  value: string | number | boolean,
  position: NodePosition = { x: 350, y: 200 }
): SetStateNode {
  return {
    id: generateNodeId('setState'),
    type: 'setState',
    position,
    config: {
      variable,
      value: { type: 'static', value },
    },
  };
}

/**
 * Create an alert node
 * 
 * @param message - Message to display
 * @param position - Position on canvas
 * @returns AlertNode
 */
export function createAlertNode(
  message: string,
  position: NodePosition = { x: 350, y: 300 }
): AlertNode {
  return {
    id: generateNodeId('alert'),
    type: 'alert',
    position,
    config: {
      message: { type: 'static', value: message },
    },
  };
}

/**
 * Create a console node
 * 
 * @param message - Message to log
 * @param level - Console level
 * @param position - Position on canvas
 * @returns ConsoleNode
 */
export function createConsoleNode(
  message: string,
  level: 'log' | 'warn' | 'error' = 'log',
  position: NodePosition = { x: 350, y: 400 }
): ConsoleNode {
  return {
    id: generateNodeId('console'),
    type: 'console',
    position,
    config: {
      level,
      message: { type: 'static', value: message },
    },
  };
}

/**
 * Create an edge between two nodes
 * 
 * @param source - Source node ID
 * @param target - Target node ID
 * @returns FlowEdge
 */
export function createEdge(source: string, target: string): FlowEdge {
  return {
    id: generateEdgeId(),
    source,
    target,
  };
}

/**
 * Create a new empty flow
 * 
 * @param name - Flow name
 * @param componentId - Component that triggers the flow
 * @param eventType - Event type
 * @returns Flow with event node
 */
export function createFlow(
  name: string,
  componentId: string,
  eventType: EventType = 'onClick'
): Flow {
  const eventNode = createEventNode(componentId, eventType);
  
  return {
    id: generateFlowId(name),
    name,
    trigger: {
      type: eventType,
      componentId,
    },
    nodes: [eventNode],
    edges: [],
  };
}
