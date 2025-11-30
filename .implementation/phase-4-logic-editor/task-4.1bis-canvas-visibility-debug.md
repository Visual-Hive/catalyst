# Task 4.1bis: Canvas Visibility Debugging

**Phase:** Phase 4 - Micro Logic Editor  
**Duration Estimate:** 0.5-1 day  
**Status:** 🔴 Blocking  
**Priority:** P0 - Critical Blocker  
**Created:** 2024-11-30  
**Reason:** Nodes added to React Flow canvas are not visible  

---

## 🐛 Problem Statement

When adding nodes to the React Flow canvas (via drag-drop from palette or programmatically), the nodes do not appear visually. The canvas itself may render, but nodes are invisible or positioned off-screen.

**Symptoms:**
- [ ] Canvas renders but appears empty
- [ ] Nodes are added to state but don't display
- [ ] Drag from palette appears to work but nothing shows
- [ ] Console may or may not show errors

---

## 🔍 Diagnostic Checklist

Run through each diagnostic in order. Check the box and note findings.

### Step 1: Console Errors

```bash
# Open DevTools in Electron
# View → Toggle Developer Tools (or Cmd+Option+I / Ctrl+Shift+I)
```

- [ ] Check for React errors (red)
- [ ] Check for React Flow warnings (yellow)
- [ ] Check for TypeScript/runtime errors
- [ ] Note any errors here: `_______________`

**Common errors:**
- `Invalid node type` - nodeTypes not registered correctly
- `Cannot read property 'x' of undefined` - node position missing
- `Node not found` - node ID mismatch

---

### Step 2: React DevTools Inspection

Install React DevTools extension if not already.

- [ ] Find `<ReactFlow>` component in tree
- [ ] Check `nodes` prop - are nodes present?
- [ ] Check `nodeTypes` prop - are custom types registered?
- [ ] Check if nodes have valid `position: { x, y }` values

**What to look for:**
```jsx
// nodes prop should look like:
[
  {
    id: "node_001",
    type: "setState",  // Must match key in nodeTypes
    position: { x: 100, y: 100 },  // Must have valid numbers
    data: { ... }
  }
]

// nodeTypes prop should look like:
{
  event: EventNodeComponent,
  setState: SetStateNodeComponent,
  alert: AlertNodeComponent,
  console: ConsoleNodeComponent
}
```

---

### Step 3: Height Propagation Check

React Flow requires explicit height. Inspect the DOM:

- [ ] Right-click canvas area → Inspect Element
- [ ] Check computed height of `.react-flow` container
- [ ] Check computed height of parent containers up to root

**Problem indicators:**
- Height is `0` or `auto`
- Height is very small (< 100px)
- Parent has `overflow: hidden` cutting off content

**Fix:** Ensure CSS Grid or explicit heights all the way up:
```css
/* Parent chain must all have height */
.logic-panel { height: 100%; }
.logic-canvas-wrapper { height: 100%; }
.react-flow { height: 100%; }
```

---

### Step 4: Node Position Check

Nodes might be positioned off-screen (negative or very large coordinates).

- [ ] Log node positions when added
- [ ] Check if positions are reasonable (0-1000 range typically)
- [ ] Try manually setting position to `{ x: 100, y: 100 }`

**Add temporary debug logging:**
```tsx
// In LogicCanvas.tsx or where nodes are added
console.log('Adding node:', {
  id: newNode.id,
  type: newNode.type,
  position: newNode.position,
  data: newNode.data
});
```

---

### Step 5: Node Type Registration

If `nodeTypes` isn't correctly passed or memoized, React Flow silently fails.

- [ ] Verify `nodeTypes` is defined OUTSIDE the component (or memoized)
- [ ] Verify all type keys match what nodes use
- [ ] Check for typos: `setState` vs `SetState` vs `setstate`

**Correct pattern:**
```tsx
// OUTSIDE component - defined once at module level
const nodeTypes: NodeTypes = {
  event: EventNodeComponent,
  setState: SetStateNodeComponent,
  alert: AlertNodeComponent,
  console: ConsoleNodeComponent,
};

function LogicCanvas() {
  // nodeTypes passed directly, not recreated
  return <ReactFlow nodeTypes={nodeTypes} ... />;
}
```

**Wrong pattern:**
```tsx
function LogicCanvas() {
  // ❌ Recreated every render - causes issues
  const nodeTypes = {
    event: EventNodeComponent,
    ...
  };
  return <ReactFlow nodeTypes={nodeTypes} ... />;
}
```

---

### Step 6: React Flow Provider

React Flow hooks require `<ReactFlowProvider>` wrapper.

- [ ] Check if `useReactFlow()` is used anywhere
- [ ] If yes, verify `<ReactFlowProvider>` wraps the canvas
- [ ] Provider should be in parent, not same component as `<ReactFlow>`

**Correct structure:**
```tsx
// Parent component
function LogicPanel() {
  return (
    <ReactFlowProvider>
      <LogicCanvasInner />
    </ReactFlowProvider>
  );
}

// Child component uses hooks
function LogicCanvasInner() {
  const { fitView } = useReactFlow(); // ✅ Works
  return <ReactFlow ... />;
}
```

---

### Step 7: FlowNode → ReactFlow Node Conversion

Check if the conversion from Rise's FlowNode format to React Flow's Node format is correct.

- [ ] Find `flowNodeToReactFlowNode` function (or equivalent)
- [ ] Verify it returns correct structure
- [ ] Check that `type` field matches nodeTypes keys

**Expected React Flow node structure:**
```typescript
interface ReactFlowNode {
  id: string;           // Required, unique
  type: string;         // Required, must match nodeTypes key
  position: {           // Required
    x: number;
    y: number;
  };
  data: any;            // Required, passed to node component
  // Optional fields:
  draggable?: boolean;
  selectable?: boolean;
  connectable?: boolean;
}
```

---

### Step 8: Store Synchronization

Check if logicStore updates are reaching the canvas.

- [ ] Add nodes via palette
- [ ] Check logicStore state (React DevTools or console)
- [ ] Verify canvas component receives updated nodes

**Debug logging:**
```tsx
// In LogicCanvas
const flow = useLogicStore((state) => state.flows[flowId]);
console.log('Current flow:', flow);
console.log('Nodes count:', flow?.nodes?.length);
```

---

### Step 9: Initial Viewport / Fit View

Nodes might exist but viewport is looking elsewhere.

- [ ] Try calling `fitView()` after nodes are added
- [ ] Check `defaultViewport` prop on ReactFlow
- [ ] Try setting `fitView` prop to `true`

**Quick fix to try:**
```tsx
<ReactFlow
  nodes={nodes}
  edges={edges}
  nodeTypes={nodeTypes}
  fitView  // Add this
  fitViewOptions={{ padding: 0.2 }}
>
```

---

### Step 10: CSS Conflicts

Other styles might hide nodes.

- [ ] Check if nodes have `opacity: 0` or `visibility: hidden`
- [ ] Check if nodes have `display: none`
- [ ] Check for `z-index` issues
- [ ] Check for `transform` that moves nodes off-screen

**Inspect a node element if it exists in DOM:**
```
Right-click canvas → Inspect → Search for `.react-flow__node`
```

---

## 🔧 Common Fixes

### Fix 1: Height Chain

Ensure every container from root to canvas has explicit height:

```tsx
// LogicPanel.tsx
<div className="h-full grid grid-rows-[auto_1fr]">
  <FlowToolbar />
  <div className="h-full min-h-0"> {/* min-h-0 crucial for grid */}
    <LogicCanvas />
  </div>
</div>

// LogicCanvas.tsx
<div className="h-full w-full">
  <ReactFlow ... className="h-full w-full">
```

### Fix 2: Memoize nodeTypes

```tsx
// At module level, outside component
const nodeTypes: NodeTypes = {
  event: EventNodeComponent,
  setState: SetStateNodeComponent,
  alert: AlertNodeComponent,
  console: ConsoleNodeComponent,
};

// OR inside component with useMemo
const nodeTypes = useMemo(() => ({
  event: EventNodeComponent,
  setState: SetStateNodeComponent,
  alert: AlertNodeComponent,
  console: ConsoleNodeComponent,
}), []);
```

### Fix 3: Ensure Valid Node Structure

```tsx
const createNode = (type: string, position: { x: number, y: number }) => {
  return {
    id: `node_${Date.now()}`,
    type,  // Must match nodeTypes key exactly
    position,  // Must have x and y as numbers
    data: {
      label: type,
      config: {}
    }
  };
};
```

### Fix 4: Add ReactFlowProvider

```tsx
// Wrap at the right level
import { ReactFlowProvider } from 'reactflow';

function LogicPanel() {
  return (
    <ReactFlowProvider>
      <LogicCanvas flowId={activeFlowId} />
    </ReactFlowProvider>
  );
}
```

### Fix 5: Force Viewport Fit

```tsx
import { useReactFlow } from 'reactflow';

function LogicCanvas() {
  const { fitView } = useReactFlow();
  
  // Fit view when nodes change
  useEffect(() => {
    if (nodes.length > 0) {
      setTimeout(() => fitView({ padding: 0.2 }), 50);
    }
  }, [nodes.length, fitView]);
  
  return <ReactFlow ... />;
}
```

### Fix 6: Debug Node Component Rendering

```tsx
// Temporarily simplify a node component to verify it's being called
export function SetStateNodeComponent({ data }: NodeProps) {
  console.log('SetStateNode rendering with data:', data);
  
  return (
    <div style={{ 
      background: 'red', 
      padding: 20, 
      border: '2px solid black' 
    }}>
      DEBUG: SetState Node
    </div>
  );
}
```

---

## 📋 Files to Inspect

| File | What to Check |
|------|---------------|
| `src/renderer/components/LogicEditor/LogicCanvas.tsx` | Main canvas, nodeTypes, ReactFlow props |
| `src/renderer/components/LogicEditor/LogicPanel.tsx` | Height chain, ReactFlowProvider |
| `src/renderer/components/LogicEditor/NodePalette.tsx` | Drop handler, node creation |
| `src/renderer/components/LogicEditor/nodes/index.ts` | Node component exports |
| `src/renderer/components/LogicEditor/nodes/*.tsx` | Individual node components |
| `src/renderer/store/logicStore.ts` | Node storage, flowNodeToReactFlowNode |
| `src/renderer/components/EditorPanel.tsx` | Parent height propagation |

---

## ✅ Success Criteria

- [ ] Nodes appear visually when dragged from palette
- [ ] Nodes appear at expected position (near drop location)
- [ ] Nodes are draggable after placement
- [ ] Nodes show correct type-specific UI (SetState vs Alert vs Console)
- [ ] Connections can be drawn between nodes
- [ ] No console errors related to React Flow

---

## 📝 Resolution Log

**Date:** ___________

**Root Cause:**
```
[Describe what was actually wrong]
```

**Fix Applied:**
```
[Describe the fix]
```

**Files Modified:**
```
- file1.tsx: [what changed]
- file2.tsx: [what changed]
```

**Lessons Learned:**
```
[What to watch out for next time]
```

---

## 🔗 References

- [React Flow Troubleshooting](https://reactflow.dev/docs/guides/troubleshooting/)
- [React Flow Custom Nodes](https://reactflow.dev/docs/api/nodes/custom-nodes/)
- [CSS Grid Height Issues](https://stackoverflow.com/questions/43311943/prevent-content-from-expanding-grid-items)

---

**Task Status:** 🔴 Blocking  
**Assigned:** [Developer]  
**Next Step:** Run diagnostic checklist from Step 1