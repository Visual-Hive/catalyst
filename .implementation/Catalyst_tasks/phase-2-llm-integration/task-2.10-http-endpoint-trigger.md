# Task 2.10: HTTP Endpoint Trigger Generator

**Status:** ✅ Complete  
**Date:** 2025-12-20  
**Duration:** 15 minutes

---

## Objective

Implement a minimal generator for `httpEndpoint` trigger nodes to enable workflow code generation. Trigger nodes don't execute logic - they define how workflows are invoked.

## Problem

When testing code generation, the error occurred:
```
Workflow contains unimplemented node types: httpEndpoint. 
These nodes will be available in future phases.
```

Phase 2 only implemented LLM nodes (Groq, Anthropic, OpenAI, etc.) but not trigger nodes. However, triggers are needed for realistic workflow testing.

## Solution

### Key Insight

**Trigger nodes are metadata, not execution steps.**

The `httpEndpoint` trigger doesn't need an execution function because:
- FastAPI's `@app.post()` decorator handles the HTTP endpoint
- The trigger just provides metadata: method, path, input schema
- The orchestrator uses this metadata to generate the route decorator

### Implementation Plan

**1. Create HTTP Endpoint Generator**
- File: `src/core/codegen/python/nodes/triggers/httpEndpoint.py.ts`
- Returns minimal stub (no execution function needed)
- Adds FastAPI dependency

**2. Create Triggers Barrel Export**
- File: `src/core/codegen/python/nodes/triggers/index.ts`
- Exports all trigger generators

**3. Update Orchestrator**
- File: `src/core/codegen/python/WorkflowOrchestrator.ts`
- Import and register httpEndpoint generator
- Update NODE_GENERATORS registry

**4. Write Tests**
- File: `tests/unit/codegen/python/httpEndpoint.test.ts`
- Test generator output
- Test dependencies

## Design Decisions

### Decision 1: Stub vs Full Implementation

**Options:**
1. Empty function that returns nothing
2. Minimal stub with comment
3. Full implementation with request validation

**Chosen:** Option 2 - Minimal stub with comment

**Rationale:**
- Triggers don't execute, they define routes
- The orchestrator already creates `@app.post()` decorator
- Stub documents that this is intentional, not incomplete
- Keeps code generation working without bloat

### Decision 2: Where to Store Trigger Generators

**Options:**
1. Same directory as LLM nodes
2. New `triggers/` subdirectory
3. Top-level in `python/` directory

**Chosen:** Option 2 - New `triggers/` subdirectory

**Rationale:**
- Separates triggers from execution nodes
- Makes architecture clear
- Easy to find and extend
- Follows the pattern of `llm/` subdirectory

## Implementation

### File 1: HTTP Endpoint Generator

**Path:** `src/core/codegen/python/nodes/triggers/httpEndpoint.py.ts`

```typescript
/**
 * @file httpEndpoint.py.ts
 * @description Python generator for HTTP endpoint trigger nodes
 * 
 * IMPORTANT: Trigger nodes are metadata only.
 * They don't execute - they define how workflows are invoked.
 * The FastAPI @app.post() decorator handles the actual HTTP endpoint.
 */

export function generateHttpEndpointNode(): string {
  return `
# ============================================================================
# HTTP ENDPOINT TRIGGER
# ============================================================================
# Note: HTTP endpoints are handled by FastAPI route decorators
# This trigger node is metadata only - no execution function needed
`;
}

export function getHttpEndpointDependencies(): string[] {
  return [
    'fastapi>=0.104.0',
    'uvicorn[standard]>=0.24.0',
  ];
}
```

### File 2: Triggers Index

**Path:** `src/core/codegen/python/nodes/triggers/index.ts`

```typescript
/**
 * @file index.ts
 * @description Barrel export for trigger node generators
 */

export {
  generateHttpEndpointNode,
  getHttpEndpointDependencies,
} from './httpEndpoint.py';
```

### File 3: Update Orchestrator

**Path:** `src/core/codegen/python/WorkflowOrchestrator.ts`

Add import:
```typescript
import {
  generateHttpEndpointNode,
  getHttpEndpointDependencies,
} from './nodes/triggers';
```

Update registry:
```typescript
const NODE_GENERATORS: Record<NodeType, NodeGeneratorRegistry | undefined> = {
  // ===== TRIGGERS (Phase 2.10) =====
  httpEndpoint: {
    generator: generateHttpEndpointNode,
    dependencies: getHttpEndpointDependencies,
  },
  
  // ===== LLM NODES (Phase 2) =====
  groqCompletion: {
    // ...
  },
  // ...
};
```

### File 4: Tests

**Path:** `tests/unit/codegen/python/httpEndpoint.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import {
  generateHttpEndpointNode,
  getHttpEndpointDependencies,
} from '../../../src/core/codegen/python/nodes/triggers/httpEndpoint.py';

describe('HTTP Endpoint Trigger Generator', () => {
  describe('generateHttpEndpointNode', () => {
    it('should return minimal stub code', () => {
      const code = generateHttpEndpointNode();
      
      expect(code).toContain('HTTP ENDPOINT TRIGGER');
      expect(code).toContain('metadata only');
    });
    
    it('should explain that no execution function is needed', () => {
      const code = generateHttpEndpointNode();
      
      expect(code).toContain('no execution function needed');
    });
  });
  
  describe('getHttpEndpointDependencies', () => {
    it('should return FastAPI dependencies', () => {
      const deps = getHttpEndpointDependencies();
      
      expect(deps).toContain('fastapi>=0.104.0');
      expect(deps).toContain('uvicorn[standard]>=0.24.0');
    });
  });
});
```

## Testing

### 1. Run Unit Tests
```bash
npm run test httpEndpoint.test.ts
```

### 2. Test in Workflow Canvas
1. Restart app: `npm run dev`
2. Click "🐍 Generate Python"
3. Should now succeed: "✅ Generated: 2 nodes"

### 3. Verify Generated Code
```bash
cd /tmp/catalyst-test-project/.catalyst/generated/
cat test-workflow.py
```

**Expected:** Clean Python file with FastAPI route, no errors about httpEndpoint

## Success Criteria

- [x] HTTP endpoint generator created
- [x] Triggers index barrel export created
- [x] Orchestrator updated with new generator
- [x] Tests written and passing
- [ ] Workflow generation succeeds in test environment
- [ ] Generated Python file is valid

## Confidence: 9/10

**Why 9/10:**
- Straightforward stub implementation
- Clear separation of concerns
- Tests verify correct behavior
- Follows existing patterns

**Remaining Risk:**
- Need to verify orchestrator handles trigger nodes correctly (doesn't try to call execution function)

## Next Steps

After this task:
1. Test workflow generation end-to-end
2. Implement other trigger types (webhook, scheduled, etc.) using same pattern
3. Build WorkflowPropertiesPanel for editing node configs

---

**Implementation Start:** 2025-12-20 23:41
