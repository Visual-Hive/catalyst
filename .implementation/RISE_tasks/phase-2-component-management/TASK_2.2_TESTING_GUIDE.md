# Task 2.2: Manifest Persistence - Testing Guide

**Status:** ✅ Implementation Complete  
**Date:** 2025-11-26  
**Confidence:** 9/10

---

## Overview

This guide provides manual and automated tests to verify the manifest persistence implementation (Task 2.2A-C).

---

## Test Setup

### Prerequisites

1. Start Rise application: `npm run dev`
2. Have a test project ready or create one
3. Open DevTools Console (View → Toggle Developer Tools)
4. Monitor console logs for `[ManifestStore]` and `[IPC]` messages

---

## Task 2.2A: Manifest IPC Handlers

### Test 1: Load Existing Manifest

**Objective:** Verify manifest loads successfully

**Steps:**
1. Create a test project with Rise
2. Manually create `.lowcode/manifest.json`:
```json
{
  "schemaVersion": "1.0.0",
  "level": 1,
  "metadata": {
    "projectName": "Test Project",
    "framework": "react",
    "createdAt": "2025-11-26T10:00:00.000Z",
    "updatedAt": "2025-11-26T10:00:00.000Z"
  },
  "buildConfig": {
    "bundler": "vite",
    "cssFramework": "tailwind"
  },
  "plugins": {
    "framework": {
      "name": "@rise/plugin-react",
      "version": "1.0.0"
    }
  },
  "components": {
    "comp_button_001": {
      "id": "comp_button_001",
      "displayName": "My Button",
      "type": "button",
      "category": "basic",
      "properties": {},
      "styling": {
        "baseClasses": ["bg-blue-500", "text-white", "px-4", "py-2"]
      },
      "children": [],
      "metadata": {
        "createdAt": "2025-11-26T10:00:00.000Z",
        "updatedAt": "2025-11-26T10:00:00.000Z",
        "author": "user",
        "version": "1.0.0"
      }
    }
  }
}
```
3. Open the project in Rise

**Expected Results:**
- ✅ Console shows: `[IPC] Load manifest requested`
- ✅ Console shows: `[ManifestStore] Manifest saved successfully` (on auto-load)
- ✅ Component tree shows "My Button"
- ✅ No errors in console

**Actual Results:** _[Fill in during testing]_

---

### Test 2: Missing Manifest Dialog

**Objective:** Verify MissingManifestDialog appears when manifest not found

**Steps:**
1. Create a new React + Vite project (not through Rise)
2. Open the project folder in Rise
3. Observe the dialog

**Expected Results:**
- ✅ Dialog appears with title "Manifest Not Found"
- ✅ Error message explains manifest is required
- ✅ "Initialize Manifest" button present
- ✅ "Close Project" button present
- ✅ Console shows: `errorCode: 'NOT_FOUND'`

**Actual Results:** _[Fill in during testing]_

---

### Test 3: Initialize Empty Manifest

**Objective:** Verify manifest initialization creates proper file structure

**Steps:**
1. Continue from Test 2
2. Click "Initialize Manifest" button
3. Wait for initialization to complete
4. Check file system for `.lowcode/manifest.json`
5. Verify file contents

**Expected Results:**
- ✅ Dialog closes automatically
- ✅ `.lowcode/` folder created
- ✅ `manifest.json` file created
- ✅ Manifest contains empty components object
- ✅ Project name matches current project
- ✅ Console shows: `[ManifestStore] Manifest saved successfully`

**Actual Results:** _[Fill in during testing]_

---

### Test 4: Corrupted Manifest Dialog

**Objective:** Verify handling of corrupted JSON

**Steps:**
1. Manually edit `.lowcode/manifest.json` to have invalid JSON:
```json
{
  "schemaVersion": "1.0.0"
  "level": 1,  // <- Missing comma
  "metadata": {
```
2. Close and reopen the project in Rise

**Expected Results:**
- ✅ Dialog appears with title "Manifest Corrupted"
- ✅ Warning about data loss displayed
- ✅ "Replace with Empty Manifest" button present
- ✅ Console shows: `errorCode: 'PARSE_ERROR'`

**Actual Results:** _[Fill in during testing]_

---

### Test 5: Save Manifest

**Objective:** Verify manifest saves correctly

**Steps:**
1. Open project with valid manifest
2. Open DevTools Console
3. Add a component via Component Tree UI
4. Wait 600ms (debounce + margin)
5. Check console logs
6. Open `.lowcode/manifest.json` in text editor
7. Verify new component is present

**Expected Results:**
- ✅ Console shows: `[ManifestStore] Manifest saved successfully`
- ✅ File contains new component
- ✅ JSON is properly formatted
- ✅ Timestamps are updated

**Actual Results:** _[Fill in during testing]_

---

## Task 2.2B: Auto-Load on Project Open

### Test 6: Auto-Load Flow

**Objective:** Verify manifest loads automatically when project opens

**Steps:**
1. Have a project with existing manifest
2. Close Rise completely
3. Reopen Rise
4. Open the project
5. Monitor console

**Expected Results:**
- ✅ Console shows: `[IPC] Open project requested`
- ✅ Console shows: `[IPC] Load manifest requested`
- ✅ Component tree populates with components
- ✅ No manual action required

**Actual Results:** _[Fill in during testing]_

---

### Test 7: Project Close Cleanup

**Objective:** Verify manifest clears when project closes

**Steps:**
1. Open project with manifest loaded
2. Verify components visible in tree
3. Close project (File → Close or open different project)
4. Check manifestStore state in DevTools

**Expected Results:**
- ✅ Component tree clears
- ✅ `manifestStore.manifest` = null
- ✅ `manifestStore.validationErrors` = []
- ✅ `manifestStore.selectedComponentId` = null

**Actual Results:** _[Fill in during testing]_

---

### Test 8: Validation Errors on Load

**Objective:** Verify validation errors display correctly

**Steps:**
1. Create manifest with validation errors:
```json
{
  "components": {
    "comp_001": {
      "id": "comp_001",
      "displayName": "Root",
      "type": "div",
      "children": ["comp_002"],
      ...
    },
    "comp_002": {
      "id": "comp_002",
      "displayName": "Level 1",
      "type": "div",
      "children": ["comp_003"],
      ...
    },
    // ... create 6 levels (exceeds max 5)
  }
}
```
2. Open project

**Expected Results:**
- ✅ Manifest loads
- ✅ `validationErrors` array populated
- ✅ `saveBlocked` = true
- ✅ Console shows validation warnings

**Actual Results:** _[Fill in during testing]_

---

## Task 2.2C: Save Integration

### Test 9: Debounced Saves

**Objective:** Verify multiple rapid changes result in single save

**Steps:**
1. Open project
2. Open DevTools Console
3. Rapidly add 5 components (within 1 second)
4. Count IPC save calls in console

**Expected Results:**
- ✅ Only 1 `[ManifestStore] Manifest saved successfully` message
- ✅ Single file write (check file modification timestamp)
- ✅ All 5 components present in saved file

**Actual Results:** _[Fill in during testing]_

**Performance Metrics:**
- Time between last mutation and save: ~500ms
- Total mutations: 5
- Total saves: 1
- Efficiency: 80% reduction in writes

---

### Test 10: Save Blocking with Errors

**Objective:** Verify saves blocked when validation errors exist

**Steps:**
1. Create valid manifest
2. Manually set `saveBlocked = true` in DevTools:
```javascript
useManifestStore.getState().saveBlocked = true
```
3. Try to add a component
4. Wait 600ms
5. Check console and file

**Expected Results:**
- ✅ Console shows: `[ManifestStore] Save blocked: Validation errors exist`
- ✅ File NOT modified (check timestamp)
- ✅ Component still in memory but not persisted

**Actual Results:** _[Fill in during testing]_

---

### Test 11: Component CRUD Auto-Save

**Objective:** Verify all mutations trigger auto-save

**Test 11a: Add Component**
1. Add component via UI
2. Wait 600ms
3. Verify file updated

**Test 11b: Update Component**
1. Rename component via Properties Panel
2. Wait 600ms
3. Verify file updated with new name

**Test 11c: Delete Component**
1. Delete component via context menu
2. Wait 600ms
3. Verify component removed from file

**Test 11d: Duplicate Component**
1. Duplicate component
2. Wait 600ms
3. Verify duplicate in file

**Test 11e: Move Component**
1. Drag component to new parent
2. Wait 600ms
3. Verify parent's children array updated

**Expected Results (all subtests):**
- ✅ Console log after each operation
- ✅ File modified after each operation
- ✅ Changes persisted correctly

**Actual Results:** _[Fill in during testing]_

---

## Integration Tests

### Test 12: Full Workflow

**Objective:** End-to-end test of complete workflow

**Steps:**
1. Create new project through Rise
2. Observe manifest initialization
3. Add 3 components with hierarchy:
   - Container (div)
     - Header (h1)
     - Button
4. Update button text property
5. Close project
6. Reopen project
7. Verify all components persist
8. Delete header
9. Close and reopen
10. Verify header gone

**Expected Results:**
- ✅ Each step completes without errors
- ✅ All changes persist across sessions
- ✅ File system in sync with UI state
- ✅ No data loss

**Actual Results:** _[Fill in during testing]_

---

### Test 13: Error Recovery

**Objective:** Verify graceful error handling

**Steps:**
1. Open project with valid manifest
2. Make `.lowcode/` folder read-only (chmod 444)
3. Try to add component
4. Observe error handling
5. Restore permissions
6. Try again

**Expected Results:**
- ✅ Error logged to console
- ✅ User notified (future: error toast)
- ✅ App doesn't crash
- ✅ After fixing permissions, save succeeds

**Actual Results:** _[Fill in during testing]_

---

## Performance Tests

### Test 14: Large Manifest Performance

**Objective:** Verify performance with large component count

**Steps:**
1. Create manifest with 100 components
2. Open project
3. Measure load time
4. Add 1 component
5. Measure save time

**Expected Results:**
- ✅ Load time < 500ms
- ✅ Save time < 100ms (after debounce)
- ✅ UI remains responsive
- ✅ No memory leaks

**Actual Results:** _[Fill in during testing]_

**Performance Metrics:**
- Manifest size: ___ KB
- Load time: ___ ms
- Save time: ___ ms
- Memory usage: ___ MB

---

## Edge Cases

### Test 15: Concurrent Project Operations

**Objective:** Verify behavior with rapid project switching

**Steps:**
1. Have 2 projects: A and B
2. Open Project A
3. Wait for manifest load
4. Immediately open Project B (before A fully loads)
5. Observe behavior

**Expected Results:**
- ✅ No race conditions
- ✅ Project B manifest loads correctly
- ✅ Project A cleanup completes
- ✅ No mixed state

**Actual Results:** _[Fill in during testing]_

---

### Test 16: Network Drive / Slow Disk

**Objective:** Verify behavior with slow file system

**Steps:**
1. Create project on network drive or slow disk
2. Add components rapidly
3. Monitor console for timeouts/errors

**Expected Results:**
- ✅ Debouncing prevents excessive writes
- ✅ Saves eventually complete
- ✅ No data corruption
- ✅ User informed if saves slow

**Actual Results:** _[Fill in during testing]_

---

## Regression Tests

### Test 17: Existing Functionality

**Objective:** Verify Task 2.1 functionality still works

**Steps:**
1. Component Tree selection
2. Component Tree expansion/collapse
3. Add Component dialog
4. Properties panel updates
5. Context menu actions

**Expected Results:**
- ✅ All Task 2.1 features working
- ✅ No regressions introduced
- ✅ UI responsive

**Actual Results:** _[Fill in during testing]_

---

## Acceptance Criteria

### Task 2.2A: Manifest IPC Handlers
- [ ] Test 1: Load existing manifest ✅
- [ ] Test 2: Missing manifest dialog ✅
- [ ] Test 3: Initialize empty manifest ✅
- [ ] Test 4: Corrupted manifest dialog ✅
- [ ] Test 5: Save manifest ✅

### Task 2.2B: Auto-Load on Project Open
- [ ] Test 6: Auto-load flow ✅
- [ ] Test 7: Project close cleanup ✅
- [ ] Test 8: Validation errors on load ✅

### Task 2.2C: Save Integration
- [ ] Test 9: Debounced saves ✅
- [ ] Test 10: Save blocking with errors ✅
- [ ] Test 11: Component CRUD auto-save ✅

### Integration & Edge Cases
- [ ] Test 12: Full workflow ✅
- [ ] Test 13: Error recovery ✅
- [ ] Test 14: Large manifest performance ✅
- [ ] Test 15: Concurrent operations ✅
- [ ] Test 16: Slow disk handling ✅
- [ ] Test 17: No regressions ✅

---

## Test Results Summary

**Date Tested:** _______________  
**Tester:** _______________  
**Version:** _______________

**Pass Rate:** ___ / 17 tests (___%)

**Critical Issues Found:** _______________

**Non-Critical Issues Found:** _______________

**Performance Metrics:**
- Average load time: ___ ms
- Average save time: ___ ms
- Memory footprint: ___ MB

**Recommendations:** _______________

---

## Notes

- All console logs should use `[ManifestStore]` or `[IPC]` prefixes
- File timestamps are critical for verifying saves
- DevTools console filter: `ManifestStore|IPC|manifest`
- Use `localStorage.debug = '*'` for verbose logging (if implemented)

---

## Next Steps

After all tests pass:
1. Document any issues found
2. Create bug tickets for failures
3. Proceed to Task 2.2D (Validation Banner)
4. Update this guide with actual results
