# Task 4.4: Event Binding & Code Generation

**Phase:** Phase 4 - Micro Logic Editor  
**Duration Estimate:** 3-4 days  
**Actual Duration:** [To be filled]  
**Status:** 🟡 In Progress  
**Assigned:** Cline + Human Review  
**Priority:** P0 - Critical  
**Started:** 2025-11-30  
**Completed:** [YYYY-MM-DD]  

---

## 🎯 Task Overview

### Objective
Connect the logic flow system to code generation. This includes binding events on components to flows, generating event handler code from flows, and updating the ReactCodeGenerator to include event handlers in component output.

### Problem Statement
We have:
- Flow definitions (from Task 4.0-4.2)
- State management (from Task 4.3)
- Component generation (from Phase 3)

Now we need to connect them:
- When a component has an event, generate an onClick handler
- The handler should execute the flow's actions
- Generated code should be clean and readable

### Success Criteria
- [x] Components with events get onClick props in generated code
- [x] FlowCodeGenerator converts flows to handler functions
- [x] Handler functions execute SetState, Alert, Console actions
- [x] Generated code imports and uses page state runtime
- [ ] Preview shows working event handlers
- [ ] Clicking button in preview updates state
- [ ] Components using `{{state.var}}` update reactively
- [ ] Unit tests for FlowCodeGenerator
- [ ] Integration tests for end-to-end flow
- [ ] Human review completed

### References
- **Task 3.1** - ReactCodeGenerator (to extend)
- **Task 4.0** - Flow and node types
- **Task 4.3** - PageStateRuntime

### Dependencies
- ✅ **Task 4.0-4.3** - All previous Phase 4 tasks
- ⚠️ **BLOCKS:** Task 4.5 (Integration)

---

## 🗺️ Implementation Roadmap

### Milestone 1: Event Binding UI
**Duration:** 0.5 day  
**Confidence Target:** 9/10  
**Status:** ✅ Complete

#### Objective
Add UI to bind events on components to flows.

#### Deliverables

**Create `src/renderer/components/PropertyEditor/EventsSection.tsx`:**

```tsx
// ============================================================
// EVENTS SECTION - Component Event Binding
// ============================================================
// Shows in Property Panel when a component is selected.
// Allows binding component events (onClick) to logic flows.
// ============================================================

import React from 'react';
import { useComponentStore } from '../../store/componentStore';
import { useLogicStore } from '../../store/logicStore';

interface EventsSectionProps {
  componentId: string;
}

/**
 * EventsSection - Manage component event bindings
 */
export function EventsSection({ componentId }: EventsSectionProps) {
  const component = useComponentStore((state) => state.components[componentId]);
  const flows = useLogicStore((state) => state.flows);
  const createFlow = useLogicStore((state) => state.createFlow);
  const setActiveFlow = useLogicStore((state) => state.setActiveFlow);
  const updateComponent = useComponentStore((state) => state.updateComponent);
  
  if (!component) return null;
  
  // Get the currently bound flow for onClick
  const onClickFlowId = component.events?.onClick?.flowId;
  const onClickFlow = onClickFlowId ? flows[onClickFlowId] : null;
  
  // --------------------------------------------------------
  // HANDLERS
  // --------------------------------------------------------
  
  /**
   * Create a new flow and bind it to onClick
   */
  const handleCreateFlow = () => {
    const flowId = createFlow({
      type: 'onClick',
      componentId,
    });
    
    // Update component to reference the new flow
    updateComponent(componentId, {
      events: {
        ...component.events,
        onClick: { flowId },
      },
    });
    
    // Switch to Logic tab and show the new flow
    setActiveFlow(flowId);
  };
  
  /**
   * Edit existing flow
   */
  const handleEditFlow = () => {
    if (onClickFlowId) {
      setActiveFlow(onClickFlowId);
      // TODO: Switch to Logic tab
    }
  };
  
  /**
   * Remove event binding
   */
  const handleRemoveBinding = () => {
    if (!confirm('Remove onClick handler? The flow will still exist.')) {
      return;
    }
    
    const { onClick, ...otherEvents } = component.events || {};
    updateComponent(componentId, {
      events: Object.keys(otherEvents).length > 0 ? otherEvents : undefined,
    });
  };
  
  // --------------------------------------------------------
  // RENDER
  // --------------------------------------------------------
  
  return (
    <div className="border-t border-gray-200 pt-4 mt-4">
      <h3 className="text-sm font-semibold text-gray-700 mb-3">
        Events
      </h3>
      
      {/* onClick binding */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">onClick</span>
          
          {onClickFlow ? (
            <div className="flex items-center gap-2">
              <span className="text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded">
                ⚡ {onClickFlow.name}
              </span>
              <button
                className="text-xs text-blue-500 hover:text-blue-600"
                onClick={handleEditFlow}
              >
                Edit
              </button>
              <button
                className="text-xs text-red-500 hover:text-red-600"
                onClick={handleRemoveBinding}
              >
                Remove
              </button>
            </div>
          ) : (
            <button
              className="text-xs px-2 py-1 bg-blue-100 text-blue-600 rounded hover:bg-blue-200"
              onClick={handleCreateFlow}
            >
              + Add Handler
            </button>
          )}
        </div>
      </div>
      
      {/* Level 1.5 notice */}
      <p className="text-xs text-gray-400 mt-3">
        Level 1.5: Only onClick events supported
      </p>
    </div>
  );
}

export default EventsSection;
```

---

### Milestone 2: Flow Code Generator
**Duration:** 1.5 days  
**Confidence Target:** 8/10  
**Status:** ✅ Complete

#### Objective
Create FlowCodeGenerator that converts flow definitions to JavaScript handler code.

#### Deliverables

**Create `src/core/codegen/FlowCodeGenerator.ts`:**

```typescript
// ============================================================
// FLOW CODE GENERATOR - Convert Flows to Handler Code
// ============================================================
// Transforms logic flow definitions into executable JavaScript
// event handler functions.
// 
// Level 1.5 Constraints:
// - Only onClick handlers
// - Only 3 action types: setState, alert, console
// - Only static values (no expressions)
// - Sequential execution (no branching)
// ============================================================

import { 
  Flow, 
  FlowNode, 
  SetStateNode, 
  AlertNode, 
  ConsoleNode,
  isSetStateNode,
  isAlertNode,
  isConsoleNode,
} from '../logic/types';

// ============================================================
// TYPES
// ============================================================

export interface GeneratedHandler {
  /** Handler function name */
  name: string;
  /** Generated function code */
  code: string;
  /** Imports needed for this handler */
  imports: string[];
}

export interface FlowGenerationResult {
  /** All generated handlers */
  handlers: GeneratedHandler[];
  /** Combined imports (deduplicated) */
  imports: string[];
  /** Any warnings during generation */
  warnings: string[];
}

// ============================================================
// MAIN GENERATOR
// ============================================================

/**
 * FlowCodeGenerator - Converts flows to JavaScript handlers
 */
export class FlowCodeGenerator {
  /**
   * Generate handler code for all flows in a manifest
   */
  generateHandlers(flows: Record<string, Flow>): FlowGenerationResult {
    const handlers: GeneratedHandler[] = [];
    const allImports = new Set<string>();
    const warnings: string[] = [];
    
    for (const flow of Object.values(flows)) {
      try {
        const result = this.generateHandler(flow);
        handlers.push(result);
        result.imports.forEach((imp) => allImports.add(imp));
      } catch (error) {
        warnings.push(`Failed to generate handler for flow ${flow.id}: ${error}`);
      }
    }
    
    return {
      handlers,
      imports: Array.from(allImports),
      warnings,
    };
  }
  
  /**
   * Generate handler for a single flow
   */
  generateHandler(flow: Flow): GeneratedHandler {
    const handlerName = this.generateHandlerName(flow);
    const imports: string[] = [];
    
    // Get action nodes (skip event node)
    const actionNodes = flow.nodes.filter((n) => n.type !== 'event');
    
    // Sort nodes by edge connections (topological sort for execution order)
    const sortedNodes = this.sortNodesByEdges(actionNodes, flow.edges);
    
    // Generate code for each action
    const actionStatements = sortedNodes
      .map((node) => this.generateNodeCode(node, imports))
      .filter(Boolean);
    
    // Build the handler function
    const code = this.buildHandlerFunction(handlerName, actionStatements);
    
    return {
      name: handlerName,
      code,
      imports,
    };
  }
  
  // --------------------------------------------------------
  // NAME GENERATION
  // --------------------------------------------------------
  
  /**
   * Generate a handler function name from flow
   */
  private generateHandlerName(flow: Flow): string {
    // Convert flow name to camelCase function name
    const baseName = flow.name
      .replace(/[^a-zA-Z0-9\s]/g, '')
      .split(/\s+/)
      .map((word, i) => 
        i === 0 
          ? word.toLowerCase() 
          : word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
      )
      .join('');
    
    // Add handler prefix and component reference for uniqueness
    return `handle${baseName.charAt(0).toUpperCase() + baseName.slice(1)}_${flow.trigger.componentId}`;
  }
  
  // --------------------------------------------------------
  // NODE CODE GENERATION
  // --------------------------------------------------------
  
  /**
   * Generate code for a single node
   */
  private generateNodeCode(node: FlowNode, imports: string[]): string {
    if (isSetStateNode(node)) {
      return this.generateSetStateCode(node, imports);
    }
    
    if (isAlertNode(node)) {
      return this.generateAlertCode(node);
    }
    
    if (isConsoleNode(node)) {
      return this.generateConsoleCode(node);
    }
    
    return `// Unknown node type: ${node.type}`;
  }
  
  /**
   * Generate setState action code
   */
  private generateSetStateCode(node: SetStateNode, imports: string[]): string {
    // Ensure setPageState is imported
    if (!imports.includes('setPageState')) {
      imports.push('setPageState');
    }
    
    const { variable, value } = node.config;
    const valueCode = JSON.stringify(value.value);
    
    return `    setPageState('${variable}', ${valueCode});`;
  }
  
  /**
   * Generate alert action code
   */
  private generateAlertCode(node: AlertNode): string {
    const message = JSON.stringify(node.config.message.value);
    return `    alert(${message});`;
  }
  
  /**
   * Generate console action code
   */
  private generateConsoleCode(node: ConsoleNode): string {
    const { level, message } = node.config;
    const messageCode = JSON.stringify(message.value);
    return `    console.${level}(${messageCode});`;
  }
  
  // --------------------------------------------------------
  // FUNCTION BUILDING
  // --------------------------------------------------------
  
  /**
   * Build the complete handler function
   */
  private buildHandlerFunction(
    name: string, 
    statements: string[]
  ): string {
    const body = statements.length > 0
      ? statements.join('\n')
      : '    // No actions defined';
    
    return `
  /**
   * @rise:handler
   * Auto-generated event handler
   */
  const ${name} = () => {
${body}
  };`;
  }
  
  // --------------------------------------------------------
  // TOPOLOGICAL SORT
  // --------------------------------------------------------
  
  /**
   * Sort nodes by edge connections for execution order
   * Simple implementation for Level 1.5 (no complex graphs)
   */
  private sortNodesByEdges(
    nodes: FlowNode[], 
    edges: Flow['edges']
  ): FlowNode[] {
    // Build adjacency map
    const nodeMap = new Map(nodes.map((n) => [n.id, n]));
    const incomingEdges = new Map<string, string[]>();
    
    nodes.forEach((n) => incomingEdges.set(n.id, []));
    
    edges.forEach((edge) => {
      const incoming = incomingEdges.get(edge.target);
      if (incoming) {
        incoming.push(edge.source);
      }
    });
    
    // Simple topological sort
    const sorted: FlowNode[] = [];
    const visited = new Set<string>();
    
    const visit = (nodeId: string) => {
      if (visited.has(nodeId)) return;
      visited.add(nodeId);
      
      const incoming = incomingEdges.get(nodeId) || [];
      incoming.forEach(visit);
      
      const node = nodeMap.get(nodeId);
      if (node) sorted.push(node);
    };
    
    nodes.forEach((n) => visit(n.id));
    
    return sorted;
  }
}

// ============================================================
// SINGLETON EXPORT
// ============================================================

export const flowCodeGenerator = new FlowCodeGenerator();
export default FlowCodeGenerator;
```

---

### Milestone 3: ReactCodeGenerator Integration
**Duration:** 1 day  
**Confidence Target:** 8/10  
**Status:** ✅ Complete (via JSXBuilder + AppGenerator)

#### Objective
Update ReactCodeGenerator to include event handlers and state in generated components.

#### Deliverables

**Update `src/core/codegen/ReactCodeGenerator.ts`:**

Add the following capabilities:

```typescript
// Add to existing ReactCodeGenerator class:

/**
 * Generate component with event handlers and state
 */
generateComponentWithLogic(
  component: Component,
  manifest: ComponentManifest
): GeneratedComponent {
  // Get basic component generation
  const baseResult = this.generateComponent(component, manifest);
  
  // Check if component has events
  if (!component.events || !manifest.flows) {
    return baseResult;
  }
  
  // Generate handlers for component's flows
  const handlerResults: GeneratedHandler[] = [];
  
  if (component.events.onClick) {
    const flow = manifest.flows[component.events.onClick.flowId];
    if (flow) {
      handlerResults.push(flowCodeGenerator.generateHandler(flow));
    }
  }
  
  // Build enhanced component code
  const enhancedCode = this.buildEnhancedComponent(
    component,
    manifest,
    baseResult,
    handlerResults
  );
  
  return {
    ...baseResult,
    code: enhancedCode,
    imports: this.mergeImports(baseResult.imports, handlerResults),
  };
}

/**
 * Build component with handlers and state
 */
private buildEnhancedComponent(
  component: Component,
  manifest: ComponentManifest,
  baseResult: GeneratedComponent,
  handlers: GeneratedHandler[]
): string {
  const lines: string[] = [];
  
  // Imports
  lines.push("import React from 'react';");
  
  // Add state import if needed
  if (manifest.pageState && Object.keys(manifest.pageState).length > 0) {
    lines.push("import { usePageState, setPageState } from './pageState';");
  }
  
  lines.push('');
  
  // Component header comment
  lines.push(this.generateHeaderComment(component));
  lines.push('');
  
  // Component function
  lines.push(`export function ${component.displayName}(props) {`);
  
  // Use state hook if component reads state
  if (this.componentUsesState(component, manifest)) {
    lines.push('  const state = usePageState();');
    lines.push('');
  }
  
  // Add handlers
  handlers.forEach((handler) => {
    lines.push(handler.code);
    lines.push('');
  });
  
  // Build JSX
  const jsxCode = this.buildJSXWithHandlers(component, handlers);
  lines.push(`  return (`);
  lines.push(`    ${jsxCode}`);
  lines.push(`  );`);
  lines.push(`}`);
  lines.push('');
  lines.push(`export default ${component.displayName};`);
  
  return lines.join('\n');
}

/**
 * Build JSX element with event handlers attached
 */
private buildJSXWithHandlers(
  component: Component,
  handlers: GeneratedHandler[]
): string {
  const element = component.type || 'div';
  const props: string[] = [];
  
  // Add className
  if (component.styling?.baseClasses?.length) {
    props.push(`className="${component.styling.baseClasses.join(' ')}"`);
  }
  
  // Add onClick handler
  if (component.events?.onClick) {
    const handler = handlers.find((h) => 
      h.name.includes(component.id)
    );
    if (handler) {
      props.push(`onClick={${handler.name}}`);
    }
  }
  
  // Add other props (process template syntax)
  for (const [key, propDef] of Object.entries(component.properties || {})) {
    if (propDef.type === 'static') {
      const value = this.processPropertyValue(propDef.value, key);
      props.push(value);
    }
  }
  
  const propsStr = props.length > 0 ? ' ' + props.join(' ') : '';
  
  // Self-closing or with children
  if (component.children?.length) {
    return `<${element}${propsStr}>
      {/* children */}
    </${element}>`;
  } else {
    return `<${element}${propsStr} />`;
  }
}

/**
 * Check if component uses state (has template syntax)
 */
private componentUsesState(
  component: Component, 
  manifest: ComponentManifest
): boolean {
  const text = JSON.stringify(component.properties);
  return text.includes('{{state.');
}
```

---

### Milestone 4: End-to-End Testing
**Duration:** 0.5 day  
**Confidence Target:** 8/10  
**Status:** 🔵 Not Started

#### Objective
Test the complete flow from editor to preview.

#### Test Scenarios

| Scenario | Steps | Expected Result |
|----------|-------|-----------------|
| Basic click handler | Add button → Add onClick flow → Add alert node → Preview → Click | Alert shows |
| State update | Add state var → Add button → Add onClick with setState → Click | State changes |
| Reactive display | Add state var → Add display component with `{{state.var}}` → Update state | Display updates |
| Multiple actions | Add onClick flow with setState + console | Both execute |

---

## 🧪 Testing Requirements

### Unit Tests
- [ ] FlowCodeGenerator generates valid JS
- [ ] Handler names are unique
- [ ] All node types generate correct code
- [ ] Imports are correctly collected
- [ ] Topological sort works

### Integration Tests
- [ ] Generated code compiles without errors
- [ ] Handlers execute in preview
- [ ] State updates trigger re-renders
- [ ] Template syntax renders correctly

### Manual Testing
- [ ] Create flow in UI → generates working code
- [ ] Click button in preview → handler runs
- [ ] State changes reflect in UI

---

## 📋 Human Review Checklist

- [ ] Generated code is clean and readable
- [ ] Handler naming is intuitive
- [ ] State integration works correctly
- [ ] No security concerns with generated code
- [ ] Performance is acceptable

---

---

## 📝 Implementation Notes (Added 2025-11-30)

### Files Created/Modified

1. **src/renderer/components/PropertyEditor/EventsSection.tsx** (NEW)
   - UI component for managing onClick bindings
   - Shows flow bindings in Property Panel
   - Allows creating, editing, removing event handlers

2. **src/core/codegen/FlowCodeGenerator.ts** (NEW)
   - Converts Flow definitions to JavaScript handler code
   - Supports SetState, Alert, Console action nodes
   - Topological sort for execution order
   - Handler naming: `handle{FlowName}_{ComponentId}`

3. **src/core/codegen/types.ts** (MODIFIED)
   - Added `onClickHandler?: string` to BuilderContext
   - Enables JSXBuilder to add onClick attributes

4. **src/core/codegen/JSXBuilder.ts** (MODIFIED)
   - Updated buildAttributes to accept onClickHandler
   - Generates `onClick={handlerName}` when handler provided

5. **src/core/filemanager/AppGenerator.ts** (MODIFIED)
   - Added LogicContext interface for state/flows
   - Added generateAppJsx with logic support
   - Generates useState hooks from page state
   - Integrates FlowCodeGenerator for handlers
   - Passes onClick handlers to child components as props

6. **src/core/codegen/index.ts** (MODIFIED)
   - Exported FlowCodeGenerator and related types

### Design Decisions

1. **Page-Level State**: State hooks are generated in App.tsx (page scope)
2. **Handler Location**: Handlers also go in App.tsx to access state setters
3. **Prop Drilling**: Handlers passed to components via props for Level 1.5 simplicity
4. **No Expression Evaluation**: Only static values in flows (security)

### Next Steps
- Task 4.5: End-to-end integration and testing
- Wire up FileManager to use LogicContext when generating
- Test with actual flows in preview

**Task Status:** 🟡 In Progress  
**Next Step:** Testing and Task 4.5 Integration  
**Last Updated:** 2025-11-30
