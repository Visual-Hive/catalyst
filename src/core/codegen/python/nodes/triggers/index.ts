/**
 * @file index.ts
 * @description Barrel export for trigger node generators
 * 
 * @architecture Phase 2, Task 2.10 - HTTP Endpoint Trigger
 * @created 2025-12-20
 * @author AI (Cline) + Human Review
 * @confidence 10/10 - Simple barrel export
 * 
 * Exports all trigger generators for use in WorkflowOrchestrator.
 * 
 * TRIGGER NODES:
 * Triggers define how workflows are invoked, not what they execute.
 * - httpEndpoint: HTTP POST/GET/etc. endpoints
 * - scheduledTask: Cron-based scheduling (future)
 * - webhookReceiver: Webhook handlers (future)
 * - etc.
 * 
 * @see src/core/codegen/python/WorkflowOrchestrator.ts - Uses these generators
 */

// HTTP Endpoint Trigger
export {
  generateHttpEndpointNode,
  getHttpEndpointDependencies,
} from './httpEndpoint.py';

// Future trigger types will be exported here:
// - scheduledTask
// - webhookReceiver
// - subworkflowTrigger
// - websocketEndpoint
// - queueConsumer
