# Task 4.0: Logic System Foundation

**Status:** ✅ COMPLETE  
**Objective:** Establish the type system and validation for Level 1.5 (Micro Logic Editor)  
**Confidence:** 9/10

---

## Summary

This task creates the foundation for Phase 4's visual logic editor by defining:
1. Core type definitions for the logic system
2. Manifest extensions for Level 1.5 support
3. Schema validation for logic structures
4. Level 1.5 constraints enforcement

---

## Files Created/Modified

### New Files Created

| File | Purpose |
|------|---------|
| `src/core/logic/types.ts` | Core type definitions for Level 1.5 logic system |
| `src/core/logic/index.ts` | Barrel exports for logic module |
| `src/core/validation/Level15SchemaValidator.ts` | Validator for Level 1.5 manifests |
| `tests/fixtures/manifests/valid/level-15-with-logic.json` | Test fixture |

### Files Modified

| File | Changes |
|------|---------|
| `src/core/manifest/types.ts` | Added events, pageState, flows fields; utility functions |
| `src/core/validation/types.ts` | Added Level 1.5 validation types |
| `src/core/validation/ValidationRules.ts` | Added LEVEL_15_RULES, error codes, helpers |
| `src/core/validation/index.ts` | Exported Level 1.5 validator and rules |

---

## Design Decisions

### 1. Type System Architecture

**Decision:** Separate logic types in `src/core/logic/` module  
**Rationale:** 
- Clear separation of concerns (logic vs manifest vs codegen)
- Easy to extend for Level 2 in the future
- Avoids circular dependencies

### 2. Value Wrapper Pattern

**Decision:** Wrap values in `{ type: 'static', value: ... }`  
**Rationale:**
- Future-proofs for Level 2 expressions: `{ type: 'expression', expression: '...' }`
- Clear distinction between static and dynamic values
- Easier to validate and generate code for

### 3. Flows as Separate Collection

**Decision:** Store flows in `manifest.flows` separate from components  
**Rationale:**
- Flows can reference multiple components
- Easier to visualize and edit in React Flow
- Cleaner separation of structure (components) and behavior (flows)

### 4. Schema Level Progression

**Decision:** Use numeric levels (1, 1.5, 2, 3) with decimal for minor additions  
**Rationale:**
- Level 1.5 is a "proof of concept" addition, not a full Level 2
- Easy to understand progression
- Backward compatible (Level 1 manifests work fine)

---

## Level 1.5 Constraints Enforced

| Constraint | Implementation |
|------------|----------------|
| Only onClick events | `isAllowedEventType()` helper |
| Only 4 node types | `isAllowedNodeType()` helper |
| Only primitive state types | `isAllowedStateType()` helper |
| Only static values | `isAllowedValueType()` helper |
| No expressions | `EXPRESSIONS_NOT_SUPPORTED` error code |
| Max 20 state variables | `LEVEL_15_RULES.stateVariable.maxVariables` |
| Max 50 flows | `LEVEL_15_RULES.flow.maxFlows` |
| Max 20 nodes per flow | `LEVEL_15_RULES.flow.maxNodesPerFlow` |

---

## Type Definitions Summary

### Event Types (Level 1.5)
```typescript
type EventType = 'onClick';  // Only onClick in Level 1.5
```

### Node Types (Level 1.5)
```typescript
type NodeType = 'event' | 'setState' | 'alert' | 'console';
```

### State Variable Types
```typescript
type StateVariableType = 'string' | 'number' | 'boolean';
```

### Key Interfaces
- `ComponentEvents` - Event handlers on components
- `PageState` - Page-level state variables
- `Flow` - Complete flow definition
- `FlowNode` - Union of EventNode | SetStateNode | AlertNode | ConsoleNode
- `FlowEdge` - Connection between nodes

### Factory Functions
- `createFlow()` - Create new flow with event node
- `createSetStateNode()` - Create setState action node
- `createAlertNode()` - Create alert action node
- `createConsoleNode()` - Create console action node
- `createEdge()` - Create edge between nodes

---

## Validation Coverage

### PageState Validation
- ✅ Variable name validity (JavaScript identifier)
- ✅ Type validation (string/number/boolean only)
- ✅ InitialValue type matching
- ✅ Variable count limits

### Flow Validation
- ✅ Flow ID format
- ✅ Flow ID consistency (key matches id field)
- ✅ Trigger validation (onClick only)
- ✅ Trigger component existence
- ✅ Node count limits

### Node Validation
- ✅ Node ID uniqueness
- ✅ Node type validity
- ✅ Position validity
- ✅ Config validation per node type
- ✅ SetState variable reference validity
- ✅ Static value enforcement

### Edge Validation
- ✅ Edge ID uniqueness
- ✅ Source node existence
- ✅ Target node existence

### Component Events Validation
- ✅ Event type validity (onClick only)
- ✅ Flow reference validity

---

## Testing

### Test Fixture Created
`tests/fixtures/manifests/valid/level-15-with-logic.json`
- Complete Level 1.5 manifest example
- Button with onClick event
- Page state with 3 variables
- Flow with event, setState, and console nodes

### Unit Tests (for next task)
Will be created in Task 4.1 for comprehensive validation testing.

---

## Dependencies for Next Tasks

Task 4.0 provides the foundation for:

| Task | Uses From 4.0 |
|------|---------------|
| 4.1 React Flow Integration | FlowNode, FlowEdge, NodePosition types |
| 4.2 Node Types | Node interfaces, type guards |
| 4.3 Page State System | PageState, StateVariable types |
| 4.4 Event Binding | ComponentEvents, Flow types |
| 4.5 Integration | All types and validation |

---

## Next Steps

1. **Task 4.1:** Integrate React Flow with custom node components
2. **Task 4.2:** Build UI for each node type (setState, alert, console)
3. **Task 4.3:** Create page state management UI
4. **Task 4.4:** Generate event binding code
5. **Task 4.5:** Integration testing and polish

---

## Completion Checklist

- [x] Create `src/core/logic/types.ts` with all logic types
- [x] Create `src/core/logic/index.ts` barrel export
- [x] Extend `src/core/manifest/types.ts` for Level 1.5
- [x] Extend `src/core/validation/types.ts` for logic validation
- [x] Add Level 1.5 rules to `ValidationRules.ts`
- [x] Create `Level15SchemaValidator.ts`
- [x] Update `src/core/validation/index.ts` exports
- [x] Create test fixture
- [x] TypeScript compilation passes
- [x] Document design decisions

---

**Completed:** 2025-11-29  
**Author:** AI (Cline) + Human Review
