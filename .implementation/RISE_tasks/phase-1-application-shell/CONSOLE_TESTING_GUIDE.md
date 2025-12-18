# Console System - Manual Testing Guide

**Created:** 2025-11-25  
**For Tasks:** 1.4C (Foundation) + 1.4D (UI/Integration)

---

## 🎯 Testing Overview

This guide provides step-by-step manual testing instructions for the Rise console system.

**Current Status:**
- ✅ **Task 1.4C Complete:** Foundation (types, injection, state management)
- ⏳ **Task 1.4D Pending:** UI components and integration

---

## 📋 Pre-Testing Checklist

### Files That Should Exist (Task 1.4C)
- [ ] `src/renderer/components/Console/types.ts`
- [ ] `src/renderer/components/Console/consoleInjector.ts`
- [ ] `src/renderer/store/previewStore.ts` (console state added)

### Files That Will Be Created (Task 1.4D)
- [ ] `src/renderer/components/Console/ObjectTree.tsx`
- [ ] `src/renderer/components/Console/ConsoleEntry.tsx`
- [ ] `src/renderer/components/Console/ConsoleTable.tsx`
- [ ] `src/renderer/components/Console/StackTrace.tsx`
- [ ] `src/renderer/components/Console/ConsoleToolbar.tsx`
- [ ] `src/renderer/components/Console/ConsolePanel.tsx`
- [ ] `src/renderer/components/Console/ConsoleFooter.tsx`
- [ ] `src/renderer/components/Console/index.ts`

### Integration Changes (Task 1.4D)
- [ ] `src/renderer/components/Preview/PreviewFrame.tsx` (console injection)
- [ ] `src/renderer/components/EditorPanel.tsx` (ConsolePanel + badge)
- [ ] `src/renderer/App.tsx` (clear console on project switch)

---

## 🧪 Testing Phase 1: Foundation (Task 1.4C)

**Status:** ✅ Can test NOW (code exists)

### Test 1.1: Verify Files Exist

```bash
# Check that foundation files were created
ls -la src/renderer/components/Console/types.ts
ls -la src/renderer/components/Console/consoleInjector.ts

# Check previewStore was updated
grep -A 10 "console" src/renderer/store/previewStore.ts
```

**Expected:**
- Both Console files exist
- previewStore.ts contains console state (logs, filter, errorCount, etc.)

### Test 1.2: Verify TypeScript Compilation

```bash
# Compile TypeScript to check for errors
npm run type-check
```

**Expected:**
- No TypeScript errors in Console files
- All types properly defined

### Test 1.3: Verify Console Injection Code

Open `src/renderer/components/Console/consoleInjector.ts` and verify:

- [ ] Exports `consoleInjectorCode` as a string
- [ ] Overrides all console methods:
  - log, warn, error, info
  - table, group, groupCollapsed, groupEnd
  - time, timeLog, timeEnd
  - trace, assert, count, countReset
  - dir, dirxml, clear
- [ ] Uses `postMessage` to communicate with parent
- [ ] Preserves original console behavior
- [ ] Handles circular references with WeakSet
- [ ] Serializes all data types (primitives, objects, arrays, functions, DOM, etc.)

### Test 1.4: Verify State Management

Open `src/renderer/store/previewStore.ts` and verify:

- [ ] Console state interface defined with:
  - `logs: ConsoleEntry[]`
  - `maxLogs: 10000`
  - `filter: ConsoleFilter`
  - `searchQuery: string`
  - `errorCount: number`
  - `warningCount: number`
- [ ] Actions defined:
  - `addConsoleLog(entry: ConsoleEntry)`
  - `clearConsole()`
  - `setConsoleFilter(filter: ConsoleFilter)`
  - `setConsoleSearch(query: string)`
  - `exportConsoleLogs(format: 'json' | 'text')`

---

## 🧪 Testing Phase 2: UI Components (Task 1.4D)

**Status:** ⏳ Test AFTER implementing Task 1.4D

### Pre-Flight: Start the Application

1. **Install dependencies** (if needed):
   ```bash
   npm install
   npm install react-window @types/react-window
   ```

2. **Start the development server**:
   ```bash
   npm run dev
   ```

3. **Open Rise application**

4. **Create or open a test project**:
   - Click "New Project" or "Open Project"
   - Use a simple React project for testing

---

### Test 2.1: Basic Console Display

**Objective:** Verify console panel appears and is functional

1. Open a project
2. Click on **Console** tab in Editor Panel
3. Verify:
   - [ ] Console panel renders without errors
   - [ ] Toolbar is visible at top
   - [ ] Footer is visible at bottom
   - [ ] Empty state shows "No logs yet" message
   - [ ] No console errors in Rise's own DevTools

---

### Test 2.2: Basic Logging

**Objective:** Test simple console.log() calls

1. In your test project, add this to `src/App.jsx`:
   ```javascript
   console.log('Hello from preview!');
   console.log('Number:', 42);
   console.log('Boolean:', true);
   console.log('Null:', null);
   console.log('Undefined:', undefined);
   ```

2. Save the file and wait for preview to reload

3. **Verify in Console tab:**
   - [ ] All 5 log entries appear
   - [ ] Timestamps are shown (HH:MM:SS.mmm format)
   - [ ] Each entry has correct type (log icon)
   - [ ] Text is readable and properly formatted
   - [ ] Primitives render inline (not as objects)

---

### Test 2.3: Different Log Types

**Objective:** Verify all console types render correctly

1. Add to your test project:
   ```javascript
   console.info('This is info');
   console.warn('This is a warning');
   console.error('This is an error');
   console.log('This is a log');
   ```

2. **Verify in Console tab:**
   - [ ] Info entry has blue styling and info icon
   - [ ] Warning entry has orange styling and warning icon
   - [ ] Error entry has red styling and error icon
   - [ ] Log entry has gray styling and log icon
   - [ ] Each has appropriate left border color

3. **Verify error count badge:**
   - [ ] Console tab shows red badge with "1" (one error)
   - [ ] Badge updates when more errors occur

---

### Test 2.4: Object Inspection

**Objective:** Test recursive object tree rendering

1. Add various object types:
   ```javascript
   // Simple object
   console.log('Simple:', { name: 'John', age: 30 });
   
   // Nested object
   console.log('Nested:', {
     user: {
       profile: {
         name: 'Jane',
         settings: { theme: 'dark' }
       }
     }
   });
   
   // Array
   console.log('Array:', [1, 2, 3, 4, 5]);
   
   // Mixed
   console.log('Mixed:', {
     numbers: [1, 2, 3],
     strings: ['a', 'b', 'c'],
     nested: { deep: { value: 'here' } }
   });
   ```

2. **Verify ObjectTree rendering:**
   - [ ] Objects show as `{...}` collapsed by default
   - [ ] Click to expand object
   - [ ] Properties display with correct types
   - [ ] Nested objects can expand further
   - [ ] Keys are in dark gray
   - [ ] Strings are in green with quotes
   - [ ] Numbers are in blue
   - [ ] Booleans are in purple
   - [ ] Null/undefined are in gray

3. **Verify array rendering:**
   - [ ] Arrays show as `[...]` collapsed
   - [ ] Click to expand array
   - [ ] Indices show as [0], [1], [2], etc.
   - [ ] Values render with correct types

---

### Test 2.5: Circular References

**Objective:** Verify circular reference detection

1. Add circular reference:
   ```javascript
   const obj = { name: 'Test' };
   obj.self = obj; // Circular reference
   console.log('Circular:', obj);
   ```

2. **Verify:**
   - [ ] Object renders without crashing
   - [ ] Expand object shows properties
   - [ ] `self` property shows `[[Circular]]` marker in red italic
   - [ ] No infinite recursion or stack overflow

---

### Test 2.6: Console.table

**Objective:** Test tabular data rendering

1. Add console.table calls:
   ```javascript
   // Array of objects
   console.table([
     { name: 'Alice', age: 25, city: 'NYC' },
     { name: 'Bob', age: 30, city: 'LA' },
     { name: 'Charlie', age: 35, city: 'SF' }
   ]);
   
   // Object of objects
   console.table({
     alice: { age: 25, city: 'NYC' },
     bob: { age: 30, city: 'LA' }
   });
   ```

2. **Verify table rendering:**
   - [ ] Table renders as HTML table with borders
   - [ ] First column shows indices (0, 1, 2) or keys (alice, bob)
   - [ ] Column headers show property names (name, age, city)
   - [ ] Cells show values correctly
   - [ ] Click column header to sort (ascending/descending)
   - [ ] Alternating row colors for readability
   - [ ] Table scrolls horizontally if too wide

---

### Test 2.7: Console.group

**Objective:** Test group nesting and collapsing

1. Add grouped logs:
   ```javascript
   console.group('User Actions');
   console.log('User clicked button');
   console.log('User entered text');
   
   console.group('Nested Group');
   console.log('Deep log 1');
   console.log('Deep log 2');
   console.groupEnd();
   
   console.log('Back to parent group');
   console.groupEnd();
   
   console.groupCollapsed('Collapsed Group');
   console.log('This is hidden by default');
   console.groupEnd();
   ```

2. **Verify grouping:**
   - [ ] Group headers render with folder icon
   - [ ] Group is expanded by default (unless groupCollapsed)
   - [ ] Child logs are indented (+16px per level)
   - [ ] Nested groups indent further
   - [ ] Click group header to collapse/expand
   - [ ] `groupCollapsed` starts collapsed
   - [ ] groupEnd() properly closes groups

---

### Test 2.8: Console.time

**Objective:** Test timing methods

1. Add timer calls:
   ```javascript
   console.time('fetchData');
   // Simulate work
   setTimeout(() => {
     console.timeLog('fetchData'); // Should show elapsed time
     setTimeout(() => {
       console.timeEnd('fetchData'); // Should show total time
     }, 500);
   }, 500);
   ```

2. **Verify timing:**
   - [ ] `time()` is silent (no log entry)
   - [ ] `timeLog()` shows elapsed time badge (e.g., "500ms")
   - [ ] `timeEnd()` shows total time badge (e.g., "1000ms")
   - [ ] Multiple timers can run simultaneously
   - [ ] Timer names are case-sensitive

---

### Test 2.9: Console.trace

**Objective:** Test stack trace rendering

1. Add function calls with trace:
   ```javascript
   function levelThree() {
     console.trace('Stack trace here');
   }
   
   function levelTwo() {
     levelThree();
   }
   
   function levelOne() {
     levelTwo();
   }
   
   levelOne();
   ```

2. **Verify stack trace:**
   - [ ] Trace icon shown
   - [ ] Stack trace is collapsible (collapsed by default)
   - [ ] Click to expand shows call stack
   - [ ] Function names are highlighted
   - [ ] File paths are shown (e.g., App.jsx:10:5)
   - [ ] Line and column numbers displayed
   - [ ] Stack frames are in correct order (most recent first)

---

### Test 2.10: Filtering

**Objective:** Test console filtering by type

1. Generate mixed logs:
   ```javascript
   console.log('Log 1');
   console.info('Info 1');
   console.warn('Warn 1');
   console.error('Error 1');
   console.log('Log 2');
   console.warn('Warn 2');
   ```

2. **Test each filter:**
   - Click **All** button:
     - [ ] All 6 entries visible
     - [ ] Badge shows total count (6)
   
   - Click **Log** button:
     - [ ] Only 2 log entries visible
     - [ ] Badge shows (2)
   
   - Click **Info** button:
     - [ ] Only 1 info entry visible
     - [ ] Badge shows (1)
   
   - Click **Warn** button:
     - [ ] Only 2 warn entries visible
     - [ ] Badge shows (2)
   
   - Click **Error** button:
     - [ ] Only 1 error entry visible
     - [ ] Badge shows (1)

3. **Verify active filter styling:**
   - [ ] Active filter button is highlighted
   - [ ] Footer shows "Filtered by: [Type]"

---

### Test 2.11: Search

**Objective:** Test search functionality

1. Add diverse logs:
   ```javascript
   console.log('The quick brown fox');
   console.log('jumps over the lazy dog');
   console.log({ message: 'contains fox' });
   console.error('Error with fox in message');
   ```

2. **Test text search:**
   - Type `fox` in search input
   - **Verify:**
     - [ ] 3 matching entries shown (2 direct + 1 in object)
     - [ ] Footer shows "3 matches"
     - [ ] Non-matching entries hidden
   
   - Clear search
   - **Verify:**
     - [ ] All entries visible again

3. **Test regex search:**
   - Type `/quick.*fox/` or use regex toggle + pattern
   - **Verify:**
     - [ ] Only matching the pattern are shown
     - [ ] Invalid regex shows error message

4. **Test case sensitivity:**
   - Type `FOX` (uppercase)
   - **Verify:**
     - [ ] Still matches "fox" (case-insensitive by default)

---

### Test 2.12: Clear Console

**Objective:** Test clearing console logs

1. Generate several logs
2. Click **Clear** button
3. **Verify:**
   - [ ] Confirmation dialog appears
   - [ ] Click Cancel → logs remain
   - [ ] Click Confirm → all logs cleared
   - [ ] Empty state returns ("No logs yet")
   - [ ] Error/warning counts reset to 0
   - [ ] Badge on Console tab disappears

---

### Test 2.13: Export Logs

**Objective:** Test log export functionality

1. Generate various logs (mixed types)

2. **Test JSON export:**
   - Click Export button → Select **JSON**
   - **Verify:**
     - [ ] File download triggered (console-logs.json)
     - [ ] Open file: valid JSON format
     - [ ] Contains all log entries with metadata
     - [ ] Timestamps, types, args preserved

3. **Test text export:**
   - Click Export button → Select **Text**
   - **Verify:**
     - [ ] File download triggered (console-logs.txt)
     - [ ] Open file: human-readable format
     - [ ] Each log on separate line
     - [ ] Format: `[HH:MM:SS] [TYPE] message`

---

### Test 2.14: Auto-scroll

**Objective:** Test auto-scroll behavior

1. Generate 20+ logs quickly:
   ```javascript
   for (let i = 0; i < 30; i++) {
     console.log(`Log entry ${i}`);
   }
   ```

2. **Verify auto-scroll ON (default):**
   - [ ] Console automatically scrolls to bottom
   - [ ] Latest log is always visible
   - [ ] New logs trigger scroll

3. **Disable auto-scroll:**
   - Toggle auto-scroll button to OFF
   - Scroll to top of console
   - Add more logs
   - **Verify:**
     - [ ] Console stays at top (doesn't auto-scroll)
     - [ ] User maintains scroll position

4. **Re-enable auto-scroll:**
   - Toggle back to ON
   - Add more logs
   - **Verify:**
     - [ ] Auto-scroll resumes

---

### Test 2.15: Performance Testing

**Objective:** Test with large number of logs

1. Generate 10,000 logs:
   ```javascript
   console.time('10k logs');
   for (let i = 0; i < 10000; i++) {
     if (i % 100 === 0) {
       console.log(`Progress: ${i}/10000`, { data: i * 2 });
     }
   }
   console.timeEnd('10k logs');
   ```

2. **Verify performance:**
   - [ ] All logs appear (check footer count)
   - [ ] Scrolling is smooth (60fps)
   - [ ] No lag when scrolling
   - [ ] Virtual scrolling active (only visible logs rendered)
   - [ ] Memory usage acceptable (<100MB for logs)

3. **Test with 10k+ logs:**
   - Generate 12,000 logs
   - **Verify:**
     - [ ] Oldest 2,000 logs dropped
     - [ ] Console shows "2000 logs dropped" warning
     - [ ] Max 10,000 logs maintained

---

### Test 2.16: Edge Cases

**Objective:** Test edge case handling

1. **Very long strings:**
   ```javascript
   console.log('x'.repeat(15000)); // 15k chars
   ```
   - [ ] String truncated at 10k chars
   - [ ] Shows "... (truncated)" message

2. **Huge arrays:**
   ```javascript
   console.log(Array(2000).fill(0).map((_, i) => i));
   ```
   - [ ] First 100 items shown
   - [ ] Shows "... 1900 more items"

3. **Deep nesting:**
   ```javascript
   let deep = { level: 0 };
   let current = deep;
   for (let i = 1; i < 60; i++) {
     current.child = { level: i };
     current = current.child;
   }
   console.log(deep);
   ```
   - [ ] Object expands to depth 50
   - [ ] Shows "Max depth reached" at level 50

4. **Special types:**
   ```javascript
   console.log(() => 'function');
   console.log(Symbol('test'));
   console.log(Promise.resolve('done'));
   console.log(new ArrayBuffer(100));
   ```
   - [ ] Function shows `ƒ () => 'function'`
   - [ ] Symbol shows `Symbol(test)`
   - [ ] Promise shows `Promise { <resolved> }`
   - [ ] ArrayBuffer shows `ArrayBuffer (100 bytes)`

---

### Test 2.17: Project Lifecycle

**Objective:** Test console behavior across project operations

1. **Open project A:**
   - Generate logs in console
   - Note the logs

2. **Switch to project B:**
   - **Verify:**
     - [ ] Console clears automatically
     - [ ] Empty state shows
     - [ ] No logs from project A

3. **Close project:**
   - **Verify:**
     - [ ] Preview stops
     - [ ] Console clears
     - [ ] No errors in Rise DevTools

4. **Hot reload:**
   - Open project
   - Generate logs
   - Make small code change (trigger hot reload)
   - **Verify:**
     - [ ] Logs preserved during hot reload
     - [ ] New logs append to existing

---

### Test 2.18: Console Injection

**Objective:** Verify console injection works correctly

1. Open browser DevTools (for Rise itself, not preview)
2. Check console for errors during:
   - Preview loading
   - Console injection
   - First log event

3. In preview's own DevTools (if accessible):
   - [ ] Original console methods still work
   - [ ] Can see logs

 in both Rise and browser DevTools

---

### Test 2.19: Multiple Concurrent Operations

**Objective:** Test various features simultaneously

1. While previewing:
   - Generate 50 logs
   - Filter by errors
   - Search for "test"
   - Expand objects
   - Sort console.table
   - Clear console
   - Toggle auto-scroll

2. **Verify:**
   - [ ] No race conditions
   - [ ] All features work smoothly
   - [ ] No console errors
   - [ ] UI remains responsive

---

### Test 2.20: Accessibility

**Objective:** Test keyboard navigation and screen reader support

1. **Keyboard navigation:**
   - [ ] Tab through toolbar buttons
   - [ ] Enter/Space activates buttons
   - [ ] Arrow keys in search input
   - [ ] Tab to expand/collapse buttons in object trees

2. **Screen reader:**
   - [ ] Buttons have aria-labels
   - [ ] Filter counts announced
   - [ ] Error badge accessible

---

## 🐛 Known Issues / Limitations

Document any issues found during testing:

### Issues (to fix):
- [ ] Issue 1: [Description]
- [ ] Issue 2: [Description]

### Limitations (by design):
- Max 10,000 log entries
- Objects truncated at 100 properties
- Arrays truncated at 1000 items
- Strings truncated at 10,000 chars
- Max nesting depth: 50 levels

---

## ✅ Sign-off Checklist

After completing all tests:

- [ ] All features tested
- [ ] No critical bugs
- [ ] Performance acceptable
- [ ] Edge cases handled
- [ ] Documentation updated
- [ ] Ready for human review

**Tester:** [Your Name]  
**Date:** [YYYY-MM-DD]  
**Confidence:** [1-10]/10

---

## 📝 Notes

Use this section for any additional observations, improvements, or future enhancements.

---

**Last Updated:** 2025-11-25  
**Status:** ✅ Ready for Phase 2 Testing (after Task 1.4D implementation)
