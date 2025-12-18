/**
 * @file EventsSection.tsx
 * @description Component event binding section for the Properties Panel
 * 
 * @architecture Phase 4, Task 4.4 - Event Binding & Code Generation
 * @created 2025-11-30
 * @author AI (Cline) + Human Review
 * @confidence 9/10 - Standard UI component pattern
 * 
 * @see src/renderer/store/logicStore.ts - Flow management
 * @see src/renderer/store/manifestStore.ts - Component updates
 * @see src/core/logic/types.ts - Event and flow types
 * @see .implementation/phase-4-logic-editor/task-4.4-event-binding-codegen.md
 * 
 * PROBLEM SOLVED:
 * - Visual UI to bind component events (onClick) to logic flows
 * - Create new flow directly from component
 * - Edit existing flow binding
 * - Remove event binding
 * 
 * SOLUTION:
 * - Shows in Properties Panel when component is selected
 * - Creates flow in logicStore when "Add Handler" clicked
 * - Updates component.events in manifestStore
 * - Provides quick navigation to flow editor
 * 
 * LEVEL 1.5 CONSTRAINTS:
 * - Only onClick event type supported
 * - One handler per event type
 * 
 * @security-critical false
 * @performance-critical false
 */

import React, { useCallback } from 'react';
import { BoltIcon, PencilIcon, TrashIcon, PlusIcon } from '@heroicons/react/24/outline';
import { useLogicStore } from '../../store/logicStore';
import { useManifestStore } from '../../store/manifestStore';
import { useLayout } from '../../hooks/useLayout';
import type { Component } from '../../../core/legacy-manifest/types';

// ============================================================
// TYPES
// ============================================================

interface EventsSectionProps {
  /** The component to show events for */
  component: Component;
}

// ============================================================
// COMPONENT
// ============================================================

/**
 * EventsSection - Manage component event bindings
 * 
 * Shows in the Properties Panel below Styling.
 * Allows binding onClick to a logic flow.
 * 
 * FEATURES:
 * - "Add Handler" button when no handler exists
 * - Flow name badge when handler is bound
 * - Edit button to navigate to flow editor
 * - Remove button to unbind (keeps flow)
 * 
 * @param props - Component props
 * @returns EventsSection component
 * 
 * @example
 * ```tsx
 * <EventsSection component={selectedComponent} />
 * ```
 */
export function EventsSection({ component }: EventsSectionProps): React.ReactElement {
  // --------------------------------------------------------
  // STORES
  // --------------------------------------------------------
  
  // Get flow data from logic store
  const flows = useLogicStore((state) => state.flows);
  const createFlow = useLogicStore((state) => state.createFlow);
  const setActiveFlow = useLogicStore((state) => state.setActiveFlow);
  
  
  // Get layout actions for tab switching
  const { setActiveTab } = useLayout();
  
  // --------------------------------------------------------
  // DERIVED STATE
  // --------------------------------------------------------
  
  // Get the currently bound flow for onClick (if any)
  const onClickFlowId = component.events?.onClick?.flowId;
  const onClickFlow = onClickFlowId ? flows[onClickFlowId] : null;
  
  // --------------------------------------------------------
  // HANDLERS
  // --------------------------------------------------------
  
  /**
   * Create a new flow and bind it to onClick
   * 
   * FLOW:
   * 1. Create flow in logicStore (auto-creates event node)
   * 2. Update component.events.onClick to reference the new flow
   * 3. Switch to Logic tab and activate the new flow
   */
  const handleCreateFlow = useCallback(() => {
    // Create flow with descriptive name
    const flowName = `${component.displayName} Click`;
    const flowId = createFlow(component.id, 'onClick', flowName);
    
    // Update component's events directly via setState
    // (UpdateComponentOptions doesn't include events, so we access manifest directly)
    useManifestStore.setState((state) => {
      if (!state.manifest || !state.manifest.components[component.id]) {
        return state;
      }
      
      const comp = state.manifest.components[component.id];
      comp.events = {
        ...comp.events,
        onClick: { flowId },
      };
      
      // Update timestamp
      comp.metadata.updatedAt = new Date().toISOString();
      state.manifest.metadata.updatedAt = new Date().toISOString();
      
      return state;
    });
    
    // Trigger save
    useManifestStore.getState().saveManifest().catch(console.error);
    
    // Switch to Logic tab and show the new flow
    setActiveFlow(flowId);
    setActiveTab('logic');
  }, [component.id, component.displayName, createFlow, setActiveFlow, setActiveTab]);
  
  /**
   * Edit existing flow - navigate to Logic tab
   */
  const handleEditFlow = useCallback(() => {
    if (onClickFlowId) {
      setActiveFlow(onClickFlowId);
      setActiveTab('logic');
    }
  }, [onClickFlowId, setActiveFlow, setActiveTab]);
  
  /**
   * Remove event binding (keeps the flow for reuse)
   */
  const handleRemoveBinding = useCallback(() => {
    // Confirm before removing
    if (!confirm('Remove onClick handler? The flow will still exist and can be reattached.')) {
      return;
    }
    
    // Remove onClick from component's events
    useManifestStore.setState((state) => {
      if (!state.manifest || !state.manifest.components[component.id]) {
        return state;
      }
      
      const comp = state.manifest.components[component.id];
      
      // Remove onClick event
      if (comp.events) {
        const { onClick: _, ...remainingEvents } = comp.events;
        
        // Set events to undefined if no events remain, otherwise keep remaining
        comp.events = Object.keys(remainingEvents).length > 0 ? remainingEvents : undefined;
      }
      
      // Update timestamp
      comp.metadata.updatedAt = new Date().toISOString();
      state.manifest.metadata.updatedAt = new Date().toISOString();
      
      return state;
    });
    
    // Trigger save
    useManifestStore.getState().saveManifest().catch(console.error);
  }, [component.id]);
  
  // --------------------------------------------------------
  // RENDER
  // --------------------------------------------------------
  
  return (
    <section className="border-t border-gray-200 pt-4 mt-4">
      {/* Section Header */}
      <div className="flex items-center gap-2 mb-3">
        <BoltIcon className="w-4 h-4 text-gray-500" />
        <h3 className="text-xs font-medium text-gray-700 uppercase tracking-wider">
          Events
        </h3>
      </div>
      
      {/* onClick Event Row */}
      <div className="space-y-3">
        <div className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700">onClick</span>
          </div>
          
          {onClickFlow ? (
            // Handler is bound - show flow name with edit/remove actions
            <div className="flex items-center gap-2">
              <span 
                className="text-xs text-green-700 bg-green-100 px-2 py-1 rounded-md flex items-center gap-1"
              >
                <BoltIcon className="w-3 h-3" />
                {onClickFlow.name}
              </span>
              
              <button
                type="button"
                onClick={handleEditFlow}
                className="p-1 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded transition-colors"
                title="Edit flow"
              >
                <PencilIcon className="w-4 h-4" />
              </button>
              
              <button
                type="button"
                onClick={handleRemoveBinding}
                className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                title="Remove binding"
              >
                <TrashIcon className="w-4 h-4" />
              </button>
            </div>
          ) : (
            // No handler - show add button
            <button
              type="button"
              onClick={handleCreateFlow}
              className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors"
            >
              <PlusIcon className="w-3 h-3" />
              Add Handler
            </button>
          )}
        </div>
      </div>
      
      {/* Level 1.5 Info */}
      <p className="text-xs text-gray-400 mt-3 italic">
        Level 1.5: Only onClick events are supported
      </p>
    </section>
  );
}

export default EventsSection;
