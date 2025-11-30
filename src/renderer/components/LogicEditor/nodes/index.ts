/**
 * @file index.ts
 * @description Barrel file for Logic Editor custom node components
 * 
 * @architecture Phase 4, Task 4.2 - Node Types Implementation
 * @created 2025-11-29
 * @author AI (Cline) + Human Review
 * @confidence 9/10 - Standard barrel export pattern
 * 
 * @see src/renderer/components/LogicEditor/LogicCanvas.tsx - Uses these nodes
 * @see .implementation/phase-4-logic-editor/task-4.2-node-types.md - Task details
 * 
 * EXPORTS:
 * - BaseNode: Shared styling wrapper component
 * - EventNodeComponent: Read-only trigger display
 * - SetStateNodeComponent: State variable update configuration
 * - AlertNodeComponent: Browser alert configuration
 * - ConsoleNodeComponent: Console log configuration
 */

// ============================================================
// BASE COMPONENT
// ============================================================

export { BaseNode } from './BaseNode';
export type { BaseNodeProps } from './BaseNode';

// ============================================================
// NODE COMPONENTS
// ============================================================

export { EventNodeComponent } from './EventNode';
export type { EventNodeData } from './EventNode';

export { SetStateNodeComponent } from './SetStateNode';
export type { SetStateNodeData } from './SetStateNode';

export { AlertNodeComponent } from './AlertNode';
export type { AlertNodeData } from './AlertNode';

export { ConsoleNodeComponent } from './ConsoleNode';
export type { ConsoleNodeData } from './ConsoleNode';
