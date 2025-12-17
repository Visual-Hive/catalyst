# Rise MVP: Cline Implementation Plan (Updated)

> **Comprehensive development plan for building Rise using Cline/Claude Sonnet 4**  
> **Timeline**: 14-18 weeks | **Schema Level**: 1 Only | **AI Coverage**: 70% | **Human Review**: 30%

---

## 🚨 CRITICAL: Read This First

### MVP Scope - Schema Level 1 ONLY

**This MVP implements ONLY Schema Level 1 features:**

✅ **What IS included:**
- Static component properties (strings, numbers, booleans)
- Component hierarchy (parent/child relationships)
- Props (component inputs)
- Basic styling (CSS classes, Tailwind)
- Simple component generation

❌ **What is NOT included (deferred to Level 2+):**
- ❌ Expressions (Level 2)
- ❌ State management (Level 2)
- ❌ Event handlers (Level 2)
- ❌ Global functions (Level 2)
- ❌ Computed properties (Level 2)
- ❌ Data connections (Level 3)
- ❌ Real-time features (Level 3)
- ❌ AI code review (Level 3)

**Before implementing ANY feature:**
1. Check `@docs/SCHEMA_LEVELS.md`
2. Confirm it's Level 1
3. If Level 2+, STOP and defer to post-MVP

---

## 📋 Quick Navigation

| Section | Description |
|---------|-------------|
| [Timeline Overview](#timeline-overview) | 6-phase breakdown |
| [Setup & Configuration](#setup--configuration) | Initial environment setup |
| [Custom Instructions](#custom-instructions-for-cline) | Cline configuration |
| [Phase 0: Foundation](#phase-0-foundation-weeks-1-2) | Critical pre-implementation work |
| [Phase 1-5](#phase-1-application-shell-weeks-3-5) | Implementation phases |
| [Human Checkpoints](#human-review-checkpoints) | Required reviews |
| [Context Management](#context-management-strategy) | Managing Claude's context |

---

## 📅 Timeline Overview

### 6 Phases Over 14-18 Weeks

```
Phase 0: Foundation (Weeks 1-2)
├── File watcher with hash detection
├── Security foundation
├── Schema Level 1 validation
└── Testing infrastructure

Phase 1: Application Shell (Weeks 3-5)
├── Electron + React setup
├── Basic UI layout
├── Project management
└── File system operations

Phase 2: Component Management (Weeks 6-8)
├── Component tree UI
├── Property panel (static values only!)
├── Manifest CRUD (Level 1 only!)
└── AI component generation (basic)

Phase 3: Code Generation (Weeks 9-11)
├── React generator (Level 1 - no state/events!)
├── File management with hash watcher
└── Live preview

Phase 4: Testing & Polish (Weeks 12-15)
├── 80% unit test coverage
├── Integration tests
├── Security testing
└── Performance optimization

Phase 5: Release Prep (Weeks 16-18)
├── Documentation
├── Final security audit
└── Distribution setup
```

---

## 🚀 Setup & Configuration

### Pre-Development Checklist

- [ ] Install Cline extension in VSCode
- [ ] Configure Claude Sonnet 4 API key
- [ ] Set up custom instructions (copy from section below)
- [ ] Create `.clinerules/` directory in project root
- [ ] Copy project-rules.md to `.clinerules/` (see section below)
- [ ] Review all documentation in `docs/` folder
- [ ] Initialize git repository
- [ ] Create project directory structure

### Development Environment

**Required:**
- Node.js 18+
- npm or yarn
- VSCode with Cline extension
- Git

**Recommended Extensions:**
- ESLint
- Prettier
- React Developer Tools

---

## ⚙️ Custom Instructions for Cline

**Copy these to Cline's custom instructions field (⚙️ → Custom Instructions):**

```markdown
# Rise Low-Code Builder Development

You are developing Rise, an AI-powered visual low-code builder. This is a complex Electron desktop application that generates clean React code.

## 🚨 CRITICAL: Schema Level 1 Only for MVP

**MVP SCOPE RESTRICTION**:
- ❌ NO expression system (Level 2 feature)
- ❌ NO state management (Level 2 feature)
- ❌ NO event handlers (Level 2 feature)
- ❌ NO global functions (Level 2 feature)
- ✅ ONLY static properties with primitive values

**When implementing any feature, ALWAYS check @docs/SCHEMA_LEVELS.md to confirm it's Level 1.**

**If a feature requires Level 2+, you MUST:**
1. Stop immediately
2. Inform the user it's deferred to post-MVP
3. Do not implement it

## Security Requirements (P0)

**Every task must consider security implications:**
- Reference @docs/SECURITY_SPEC.md for all features
- Implement security measures from day 1
- No postponing security to "later phases"
- All security-critical code requires human review

## Core Principles

1. **DO NOT BE LAZY. DO NOT OMIT CODE.**
   - Always provide complete implementations
   - Never use comments like "// rest of the code" or "// ... existing code"
   - If a file is long, break it into focused functions but include ALL code

2. **Analysis Before Action**
   - Before writing code, analyze all relevant files thoroughly
   - State your understanding and approach
   - Rate your confidence (1-10) before major changes
   - Ask questions if requirements are unclear

3. **Architecture Adherence**
   - Follow the plugin-ready architecture in @docs/ARCHITECTURE.md
   - Keep React-specific code in ReactPlugin
   - Maintain clean separation: manifest (data) vs UI (presentation)
   - Level 1 means NO expressions - don't even create placeholders

4. **Code Quality Standards**
   - Write JavaScript for all generated code (TypeScript is post-MVP)
   - Include comprehensive JSDoc comments
   - Follow functional programming principles
   - Use meaningful names
   - Include error handling and validation
   - Write unit tests for core logic

5. **Security First**
   - All user input must be validated and sanitized
   - Use proper IPC patterns in Electron
   - Store sensitive data in system keychain
   - Never expose Node.js APIs to untrusted contexts
   - Expression sandboxing is Level 2 - don't implement yet

6. **Documentation Requirements**
   - Update docs when making architectural changes
   - Add comments explaining complex logic
   - Include usage examples
   - Keep README and DOCUMENTATION_INDEX.md in sync

7. **Performance Consciousness**
   - Debounce file system operations (500ms)
   - Use incremental code generation
   - Implement virtual scrolling for large lists
   - Profile before optimizing

## Updated Architecture References

**Always reference the latest architecture:**
- File watcher uses hash-based detection (not timestamp)
- Security architecture is comprehensive
- Error handling architecture is defined
- TypeScript is post-MVP only

## Project Patterns

### Manifest Management (Level 1 Only)
- All state in `.lowcode/manifest.json`
- Use Zustand for reactive updates
- Validate before saving
- Debounce saves (500ms)
- NO expressions, NO state, NO events in Level 1

### Code Generation (Level 1 Only)
- Generate in worker threads
- Use template strings (Babel is overkill for Level 1)
- Include comment markers
- Preserve user edits

### Error Handling
- Use Result<T, Error> types
- User-friendly messages
- Include debugging context
- Log to file

## Confidence Checks

- 9-10: Proceed
- 7-8: Proceed but flag for review
- 4-6: Ask questions first
- 1-3: Request human guidance

## File Organization

```
rise/
├── src/
│   ├── main/       # Electron main
│   ├── renderer/   # React UI
│   ├── core/       # Manifest, codegen
│   ├── plugins/    # Framework adapters
│   └── utils/      # Shared utilities
├── docs/
├── tests/
└── .lowcode/
```

## Workflow

1. Read relevant docs
2. Analyze existing code
3. State implementation plan
4. Break into chunks
5. Implement complete code
6. Test
7. Update docs
8. Summarize
```

---

## 📋 Project .clinerules

**The .clinerules/ files already exist in the project. Review them to ensure they match current requirements.**

---

## Phase 0: Foundation (Weeks 1-2)

> **CRITICAL**: This phase MUST be completed before any coding begins. These are foundational systems that prevent major problems later.

### Goals
- Implement hash-based file watcher (prevent infinite loops)
- Set up security foundation
- Create Level 1 schema validator
- Establish testing infrastructure

---

### Task 0.1: File Watcher with Hash Detection
**Duration**: 3 days | **AI Confidence**: 7+ (requires human review)

**Prompt:**
```
Implement hash-based file change detection to prevent infinite loops between code generation and file watcher.

Requirements:
1. FileChangeTracker class with hash-based detection
2. Before generating: pause watching, store content hash
3. After generating: wait 100ms, resume watching
4. On file change: compare hashes to detect user vs tool edits
5. Handle edge cases: concurrent edits, slow file systems

Reference @docs/MVP_ROADMAP.md - Phase 0.3 File Watcher Algorithm

State your approach and confidence (1-10) before implementing.
DO NOT OMIT ANY CODE.
```

**Implementation Details:**

```typescript
class FileChangeTracker {
  private generationHashes = new Map<string, string>();
  private pausedPaths = new Set<string>();
  
  async onBeforeGenerate(filepath: string, content: string): Promise<void> {
    // Pause watching this specific file
    this.pausedPaths.add(filepath);
    
    // Store hash of what we're about to write
    const hash = this.computeHash(content);
    this.generationHashes.set(filepath, hash);
  }
  
  async onAfterGenerate(filepath: string): Promise<void> {
    // Wait for file system to settle
    await this.delay(100);
    
    // Resume watching
    this.pausedPaths.delete(filepath);
  }
  
  isUserEdit(filepath: string, content: string): boolean {
    // File is paused during generation - ignore
    if (this.pausedPaths.has(filepath)) {
      return false;
    }
    
    // Check if content matches what we generated
    const expectedHash = this.generationHashes.get(filepath);
    const actualHash = this.computeHash(content);
    
    return expectedHash !== actualHash;
  }
  
  private computeHash(content: string): string {
    return crypto.createHash('sha256').update(content).digest('hex');
  }
  
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
```

**Success Criteria:**
- [ ] FileChangeTracker class implemented
- [ ] Hash-based detection working
- [ ] Handles concurrent edits
- [ ] No infinite loops in testing
- [ ] Edge cases handled (slow FS, rapid edits)

**Human Checkpoint:** ✅ **CRITICAL** - Test file watcher extensively
- Test rapid successive edits
- Test concurrent tool + user edits
- Test large files (> 1MB)
- Verify no infinite loops

---

### Task 0.2: Security Foundation
**Duration**: 4 days | **AI Confidence**: 6+ (requires security expert review)

**Prompt:**
```
Implement security foundation for Rise MVP.

Requirements:
1. APIKeyManager using keytar for OS keychain storage
2. InputSanitizer for all user inputs
3. File path validation (prevent traversal)
4. API usage tracking with daily budget limits
5. Error logging with sensitive data redaction

Reference @docs/SECURITY_SPEC.md - Layers 3 and 4

This is security-critical. State your approach, list potential vulnerabilities, and rate confidence (1-10).
```

**Implementation Details:**

```typescript
// API Key Manager
class APIKeyManager {
  private readonly SERVICE_NAME = 'rise-builder';
  
  async storeKey(provider: 'claude' | 'openai', apiKey: string): Promise<void> {
    this.validateKeyFormat(provider, apiKey);
    await keytar.setPassword(this.SERVICE_NAME, provider, apiKey);
    await this.recordKeyMetadata(provider, {
      storedAt: new Date(),
      rotateAt: new Date(Date.now() + 90 * 86400000), // 90 days
    });
  }
  
  async getKey(provider: string): Promise<string | null> {
    const key = await keytar.getPassword(this.SERVICE_NAME, provider);
    if (!key) return null;
    
    // Check if key needs rotation
    const metadata = await this.getKeyMetadata(provider);
    if (metadata && new Date() > metadata.rotateAt) {
      this.notifyKeyRotation(provider);
    }
    
    return key;
  }
}

// Input Sanitizer
class InputSanitizer {
  sanitizeComponentName(name: string): string {
    const sanitized = name
      .trim()
      .replace(/[^a-zA-Z0-9_-]/g, '')
      .replace(/^[^a-zA-Z]+/, '');
    
    if (!sanitized) {
      throw new SecurityError('Invalid component name', { name });
    }
    
    // Prevent reserved words
    const reserved = ['eval', 'function', 'constructor', 'prototype'];
    if (reserved.includes(sanitized.toLowerCase())) {
      throw new SecurityError('Component name is reserved', { name: sanitized });
    }
    
    return sanitized;
  }
  
  sanitizeFilePath(path: string, projectRoot: string): string {
    const resolved = nodePath.resolve(projectRoot, path);
    
    // Ensure path is within project
    if (!resolved.startsWith(projectRoot)) {
      throw new SecurityError('Path traversal detected', { path });
    }
    
    return resolved;
  }
}

// API Usage Tracker
class APIUsageTracker {
  private readonly DAILY_BUDGET_USD = 10;
  private usage = new Map<string, DailyUsage>();
  
  async trackRequest(provider: string, tokens: { prompt: number; completion: number }): Promise<void> {
    const today = this.getToday();
    const usage = this.usage.get(today) || this.createDailyUsage();
    
    const cost = this.calculateCost(provider, tokens);
    usage.totalCost += cost;
    usage.requestCount++;
    
    this.usage.set(today, usage);
    
    // Check budget
    if (usage.totalCost >= this.DAILY_BUDGET_USD * 0.8) {
      this.notifyBudgetWarning(usage);
    }
    
    if (usage.totalCost >= this.DAILY_BUDGET_USD) {
      throw new SecurityError('Daily API budget exceeded', {
        usage: usage.totalCost,
        budget: this.DAILY_BUDGET_USD,
      });
    }
  }
}
```

**Success Criteria:**
- [ ] API keys stored in OS keychain
- [ ] All user inputs sanitized
- [ ] File path validation prevents traversal
- [ ] API budget tracking works
- [ ] Sensitive data never logged

**Human Checkpoint:** ✅ **CRITICAL** Security Audit
- Verify key storage encryption
- Test input sanitization edge cases
- Test path traversal prevention
- Review error logging for data leaks

---

### Task 0.3: Schema Level 1 Validator
**Duration**: 2 days | **AI Confidence**: 8+

**Prompt:**
```
Implement Schema Level 1 validator to enforce MVP scope.

Requirements:
1. Level1SchemaValidator class
2. Validate components have ONLY Level 1 features:
   - Static properties only
   - No expressions
   - No state management
   - No event handlers
3. Return detailed validation errors
4. Integrate with manifest save/load

Reference @docs/SCHEMA_LEVELS.md - Level 1 section

State your understanding and confidence (1-10).
```

**Implementation:**

```typescript
class Level1SchemaValidator {
  validate(schema: ComponentSchema): ValidationResult {
    const errors: ValidationError[] = [];
    
    // Only allow supported property types
    for (const prop of schema.properties) {
      if (!['static', 'prop'].includes(prop.type)) {
        errors.push({
          field: prop.name,
          message: `Property type '${prop.type}' not supported in Level 1. Use 'static' or 'prop'.`,
          level: 'ERROR',
        });
      }
    }
    
    // No event handlers allowed
    if (schema.eventHandlers) {
      errors.push({
        field: 'eventHandlers',
        message: 'Event handlers not supported in Level 1 (added in Level 2)',
        level: 'ERROR',
      });
    }
    
    // No state management
    if (schema.localState || schema.globalState) {
      errors.push({
        field: 'state',
        message: 'State management not supported in Level 1 (added in Level 2)',
        level: 'ERROR',
      });
    }
    
    // No expressions
    for (const prop of schema.properties) {
      if (prop.type === 'expression') {
        errors.push({
          field: prop.name,
          message: 'Expressions not supported in Level 1 (added in Level 2)',
          level: 'ERROR',
        });
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      level: 1,
    };
  }
}
```

**Success Criteria:**
- [ ] Validator catches all Level 2+ features
- [ ] Error messages are clear and helpful
- [ ] Integrated into manifest save/load
- [ ] Unit tests pass

**Human Checkpoint:** None (straightforward validation logic)

---

### Task 0.4: Testing Infrastructure
**Duration**: 2-3 days | **AI Confidence**: 8+

**Prompt:**
```
Set up testing infrastructure for Rise MVP.

Requirements:
1. Vitest for unit tests
2. Playwright for E2E tests
3. Test file structure (tests/unit/, tests/integration/, tests/e2e/)
4. Coverage reporting (c8)
5. Example tests for each type

Reference @docs/TESTING_STRATEGY.md

State your approach and confidence (1-10).
```

**Success Criteria:**
- [ ] Vitest configured
- [ ] Playwright configured
- [ ] Test directories created
- [ ] Example tests written
- [ ] npm run test works
- [ ] Coverage reporting works

**Human Checkpoint:** None (standard test setup)

---

### Phase 0 Deliverable

```
✅ Foundation Complete:
   • File watcher prevents infinite loops (hash-based)
   • Security foundation implemented
   • Level 1 schema validator working
   • Testing infrastructure ready
   • GREEN LIGHT for Phase 1
```

**Total Estimate**: 2 weeks  
**Risk Level**: P0 - Must complete before coding

---

## Phase 1: Application Shell (Weeks 3-5)

### Goals
- Working Electron app with React
- Basic UI layout (3-panel)
- Project creation and loading
- File system operations (with hash watcher)

---

### Task 1.1: Electron + React Boilerplate
**Duration**: 3-4 days | **AI Confidence**: 8+

**Prompt:**
```
Set up Electron 28+ with React 18+ boilerplate for Rise.

Requirements:
1. Electron 28+, React 18+, Vite for dev
2. electron-builder for packaging
3. Three-panel layout structure (placeholder)
4. IPC communication setup (contextBridge)
5. Window state persistence
6. Security: contextBridge for IPC, nodeIntegration: false

Review @docs/ARCHITECTURE.md and @docs/FILE_STRUCTURE_SPEC.md

State confidence (1-10) and approach before implementing.
DO NOT OMIT ANY CODE.
```

**Success Criteria:**
- [ ] App launches successfully
- [ ] Three panels render (placeholders okay)
- [ ] Hot reload works
- [ ] IPC communication works
- [ ] Window state persists across restarts
- [ ] Security: contextBridge properly configured

**Human Checkpoint:** None (standard Electron setup)

---

### Task 1.2: Basic UI Layout
**Duration**: 3-4 days | **AI Confidence**: 8+

**Prompt:**
```
Implement three-panel layout with resizable panels.

Requirements:
1. Left panel: Component tree navigator (placeholder)
2. Center panel: Preview area (placeholder)
3. Right panel: Properties panel (placeholder)
4. Resizable panels (react-resizable-panels)
5. Tab system for center panel (Preview, Code, Console)
6. Toolbar with basic actions
7. Status bar at bottom

Use Tailwind CSS for styling.

State approach and confidence (1-10).
```

**Success Criteria:**
- [ ] Three panels visible
- [ ] Panels are resizable
- [ ] Tab system works
- [ ] Toolbar renders
- [ ] Responsive layout

**Human Checkpoint:** None

---

### Task 1.3: Project Creation System
**Duration**: 4 days | **AI Confidence**: 8+

**Prompt:**
```
Implement project creation and management.

Requirements:
1. "New Project" dialog (name, location, framework: React only)
2. Create Vite + React project structure
3. Generate `.lowcode/` directory with manifest.json
4. Load existing project functionality
5. Recent projects list (stored in app config)
6. Project validation on load

Level 1 Only: manifest.json should have NO expressions, NO state, NO events

Reference @docs/FILE_STRUCTURE_SPEC.md and @docs/SCHEMA_LEVELS.md

Rate confidence. Ask if unclear.
```

**Success Criteria:**
- [ ] Creates React project with Vite
- [ ] Generates .lowcode/manifest.json (Level 1 schema)
- [ ] Recent projects stored
- [ ] Opens existing projects
- [ ] Shows helpful errors
- [ ] Validates project structure

**Human Checkpoint:** ✅ Architecture Review
- Validate manifest structure is Level 1 only
- Review file system error handling
- Check security (path validation)

---

### Task 1.4: File System Operations with Hash Watcher
**Duration**: 3-4 days | **AI Confidence**: 7+ (requires testing)

**Prompt:**
```
Integrate Phase 0 FileChangeTracker with file operations.

Requirements:
1. Set up chokidar file watcher
2. Integrate FileChangeTracker from Phase 0
3. Watch src/components/ directory
4. Detect user edits vs tool edits using hash comparison
5. Trigger UI updates on user edits
6. Debounce file events (200ms)

This builds on Phase 0 Task 0.1. Use the hash-based detection system.

Reference @docs/ARCHITECTURE.md - File System Watcher section

State approach and confidence (1-10).
```

**Success Criteria:**
- [ ] Chokidar watches project files
- [ ] FileChangeTracker integrated
- [ ] Distinguishes user vs tool edits
- [ ] No infinite loops
- [ ] Debouncing works
- [ ] UI updates on user edits

**Human Checkpoint:** ✅ Testing
- Test concurrent edits
- Test rapid file changes
- Verify no infinite loops
- Test large files

---

### Phase 1 Deliverable

```
✅ Working Electron app that can:
   • Create new React/Vite projects
   • Load existing projects
   • Display basic UI panels
   • Watch for file changes safely
   • Show project structure
```

**Total Estimate**: 3 weeks with AI assistance

---

## Phase 2: Component Management (Weeks 6-8)

### Goals
- Visual component tree navigation
- Add/edit/delete components
- Property editing (STATIC VALUES ONLY!)
- Manifest CRUD operations (Level 1)

---

### Task 2.1: Component Tree UI
**Duration**: 4-5 days | **AI Confidence**: 8+

**Prompt:**
```
Implement component tree navigator.

Requirements:
1. Tree view using react-arborist
2. Display component hierarchy from manifest
3. Expand/collapse nodes
4. Single selection
5. Context menu (Add Component, Delete, Duplicate)
6. Drag-and-drop to reorder (simple - same parent only)
7. Max depth warning (5 levels)

Connect to Manifest Manager (Level 1 only).

State approach and confidence.
```

**Success Criteria:**
- [ ] Tree renders from manifest
- [ ] Expand/collapse works
- [ ] Selection works
- [ ] Context menu functional
- [ ] Drag-drop reordering works
- [ ] Shows depth warning at level 5

**Human Checkpoint:** None

---

### Task 2.2: Manifest Manager (Level 1 Only)
**Duration**: 4-5 days | **AI Confidence**: 8+

**Prompt:**
```
Implement Manifest Manager - single source of truth for component state.

Requirements:
1. ManifestManager class with Zustand store
2. CRUD operations: addComponent, updateComponent, removeComponent, getComponent
3. Load/save manifest.json with debouncing (500ms)
4. Validation using Level1SchemaValidator from Phase 0
5. Detailed error handling

CRITICAL: This is Level 1 ONLY - NO expressions, NO state, NO events

Reference @docs/COMPONENT_SCHEMA.md and @docs/SCHEMA_LEVELS.md

Analyze schema, state plan, rate confidence 1-10.
```

**Success Criteria:**
- [ ] ManifestManager class complete
- [ ] Zustand store works
- [ ] CRUD operations function
- [ ] Level 1 validation enforced
- [ ] Debounced saves work
- [ ] Unit tests pass (80%+ coverage)

**Human Checkpoint:** ✅ Code Review
- Verify Level 1 validation works
- Check race conditions
- Review error patterns
- Ensure no Level 2+ features snuck in

---

### Task 2.3: Property Panel (Static Values ONLY)
**Duration**: 4-5 days | **AI Confidence**: 8+

**Prompt:**
```
Implement properties panel for editing selected component.

Requirements:
1. Display properties for selected component
2. Input types: text (string), number, boolean (checkbox), dropdown (enums)
3. Property grouping (basics, styling, advanced)
4. Validation: type checking, required fields
5. Real-time updates to manifest

CRITICAL RESTRICTION - Level 1 MVP:
- NO "Expression" toggle
- NO expression editor
- ONLY static values
- If user tries to add expression, show: "Expressions available in Level 2 (post-MVP)"

Reference @docs/SCHEMA_LEVELS.md - Level 1

State approach and confidence.
```

**Success Criteria:**
- [ ] Property panel displays for selected component
- [ ] All input types work (text, number, boolean, dropdown)
- [ ] Property grouping clear
- [ ] Validation works
- [ ] Real-time manifest updates
- [ ] NO expression editor present

**Human Checkpoint:** None

---

### Task 2.4: AI Component Generation (Basic - Level 1 Only)
**Duration**: 5-6 days | **AI Confidence**: 7+

**Prompt:**
```
Implement basic AI component generation using Claude API.

Requirements:
1. AI prompt input field
2. Send prompt to Claude API (use APIKeyManager from Phase 0)
3. Parse AI response into Level 1 manifest format
4. Add generated component to tree
5. Preview generated component
6. Cost tracking with APIUsageTracker

CRITICAL: Only generate Level 1 components (static properties, no expressions, no state, no events)

Prompt template should instruct AI to generate ONLY Level 1 features.

Reference @docs/API_INTEGRATION.md and @docs/SECURITY_SPEC.md

State approach, list security concerns, rate confidence 1-10.
```

**Success Criteria:**
- [ ] AI prompt input works
- [ ] Claude API integration works
- [ ] Only Level 1 components generated
- [ ] Cost tracking functional
- [ ] Generated components valid
- [ ] Error handling robust

**Human Checkpoint:** ✅ Review
- Test AI output validation
- Verify Level 1 enforcement
- Check cost tracking
- Review error messages

---

### Phase 2 Deliverable

```
✅ Working visual editor that can:
   • Display component tree
   • Add/edit/delete components
   • Set static properties with validation
   • Use AI to generate basic Level 1 components
   • Save changes to manifest.json
   • Warn when approaching limits (depth, children)
```

**Total Estimate**: 3 weeks with AI assistance

---

## Phase 3: Code Generation & Preview (Weeks 9-11)

### Goals
- Generate React code from manifest (Level 1 only)
- File management with hash watcher
- Live preview with hot reload

---

### Task 3.1: React Code Generator (Level 1 ONLY)
**Duration**: 5-6 days | **AI Confidence**: 8+

**Prompt:**
```
Implement React code generator for Level 1 components.

Requirements:
1. Generate functional React components from manifest
2. Props handling (function params with defaults)
3. Static property rendering
4. Child component imports and usage
5. CSS class application
6. Comment markers (@lowcode:generated, @lowcode:component-id)
7. ESLint-compliant output
8. Prettier formatting

CRITICAL RESTRICTIONS - Level 1 ONLY:
- NO useState hooks
- NO event handlers (onClick, etc.)
- NO useEffect hooks
- NO computed properties
- ONLY static JSX with props

Reference @docs/SCHEMA_LEVELS.md and @docs/FILE_STRUCTURE_SPEC.md

State approach and confidence 1-10.
```

**Example Output:**
```jsx
import React from 'react';

/**
 * @lowcode:generated
 * @lowcode:component-id: comp_button_001
 * @lowcode:level: 1
 * DO NOT EDIT: Changes will be overwritten
 */
export function Button({ label = "Click me", disabled = false }) {
  return (
    <button 
      className="btn btn-primary"
      disabled={disabled}
    >
      {label}
    </button>
  );
}
```

**Success Criteria:**
- [ ] Generates valid React code
- [ ] All Level 1 property types translate
- [ ] Passes ESLint
- [ ] Prettier formatted
- [ ] Comment markers present
- [ ] NO Level 2+ features in output

**Human Checkpoint:** ✅ Code Quality Review
- Review generated examples
- Verify best practices
- Check edge cases
- Ensure no Level 2+ code

---

### Task 3.2: File Management with Hash Watcher
**Duration**: 3-4 days | **AI Confidence**: 7+ (builds on Phase 0)

**Prompt:**
```
Implement file generation with FileChangeTracker integration.

Requirements:
1. Write components to src/components/
2. Use FileChangeTracker.onBeforeGenerate() before writing
3. Use FileChangeTracker.onAfterGenerate() after writing
4. Generate src/App.jsx (Level 1 - just component imports)
5. Update on manifest changes
6. Incremental generation (only changed components)

This integrates Phase 0 Task 0.1 and Phase 3 Task 3.1.

Reference @docs/FILE_STRUCTURE_SPEC.md

State approach and confidence 1-10.
```

**Success Criteria:**
- [ ] Files written to correct locations
- [ ] Hash tracker prevents loops
- [ ] App.jsx generates correctly
- [ ] Incremental generation works
- [ ] User edits not overwritten accidentally

**Human Checkpoint:** ✅ Testing
- Test file generation
- Test concurrent edits
- Verify no infinite loops
- Test large projects (20+ components)

---

### Task 3.3: Live Preview with Vite
**Duration**: 5-6 days | **AI Confidence**: 8+

**Prompt:**
```
Implement live preview using Vite dev server.

Requirements:
1. Start Vite dev server for project
2. Embed preview in Electron webview (iframe)
3. HMR (hot module replacement) support
4. Error boundary for crashes
5. Console log capture
6. Viewport controls (responsive modes, zoom)

Security: Sandbox webview, disable nodeIntegration

State approach and confidence 1-10.
```

**Success Criteria:**
- [ ] Vite server starts/stops correctly
- [ ] Preview displays in iframe
- [ ] HMR updates instantly
- [ ] Viewport controls work
- [ ] Console logs captured
- [ ] Error handling robust

**Human Checkpoint:** ✅ Performance Testing
- Test large projects
- Verify HMR performance
- Check memory usage

---

### Phase 3 Deliverable

```
✅ End-to-end code generation and preview:
   • Visual changes → manifest → generated code → preview
   • Clean React code output (Level 1 only)
   • Hot module replacement working
   • No infinite loops
```

**Total Estimate**: 3 weeks with AI assistance

---

## Phase 4: Testing & Polish (Weeks 12-15)

### Goals
- 80%+ unit test coverage
- Integration tests for workflows
- Security testing per SECURITY_SPEC.md
- Performance optimization

---

### Task 4.1: Unit Test Suite
**Duration**: 6-7 days | **AI Confidence**: 8+

**Prompt:**
```
Implement comprehensive unit tests for Rise MVP.

Requirements:
1. Vitest unit tests
2. Core tests:
   - ManifestManager (80%+ coverage)
   - Level1SchemaValidator (100% coverage)
   - Code generator (85%+ coverage)
   - FileChangeTracker (90%+ coverage)
   - Input sanitizer (100% coverage)
3. Test utilities (mock generators)
4. Coverage reporting (c8)

Reference @docs/TESTING_STRATEGY.md

State testing strategy and confidence 1-10.
```

**Success Criteria:**
- [ ] 80%+ coverage for core engine
- [ ] All critical paths tested
- [ ] Tests pass consistently
- [ ] CI pipeline runs tests
- [ ] Coverage report generated

**Human Checkpoint:** ✅ Test Review
- Review coverage gaps
- Verify critical paths tested
- Check test quality

---

### Task 4.2: Integration Tests
**Duration**: 4-5 days | **AI Confidence**: 8+

**Prompt:**
```
Implement integration tests for complete workflows.

Requirements:
1. Test complete workflows:
   - Create project → add components → generate → preview
   - Load project → edit properties → save → regenerate
   - AI generation → validate → add to tree
2. Playwright for E2E
3. Mock file system where needed
4. Mock AI API

Reference @docs/TESTING_STRATEGY.md

State approach and confidence 1-10.
```

**Success Criteria:**
- [ ] Complete workflows tested
- [ ] Tests run reliably
- [ ] Edge cases covered
- [ ] No flaky tests

**Human Checkpoint:** ✅ Test Execution
- Run full suite manually
- Verify tests catch real bugs
- Test on different machines

---

### Task 4.3: Security Testing
**Duration**: 4-5 days | **AI Confidence**: 6+ (requires security expert)

**Prompt:**
```
Implement security tests for MVP.

Requirements:
1. Input validation tests:
   - Component name sanitization
   - File path validation (path traversal attempts)
   - Manifest injection attempts
2. API key security tests:
   - Verify keychain storage
   - Check key never logged
   - Test budget enforcement
3. Dependency scanning:
   - npm audit integration
   - Automated security checks

Reference @docs/SECURITY_SPEC.md

This is security-critical. State approach and confidence 1-10.
```

**Success Criteria:**
- [ ] All security tests pass
- [ ] Path traversal prevented
- [ ] API keys never exposed
- [ ] Dependencies scanned

**Human Checkpoint:** ✅ **CRITICAL** Security Audit
- Manual penetration testing
- Security expert review
- Sign off on security measures

---

### Task 4.4: Performance Optimization
**Duration**: 3-4 days | **AI Confidence**: 7+

**Prompt:**
```
Optimize performance for Rise MVP.

Requirements:
1. Profiling:
   - React DevTools profiling
   - Identify bottlenecks
2. Optimizations:
   - Debouncing (already implemented)
   - Virtual scrolling for component tree (if > 50 components)
   - Incremental code generation (already implemented)
   - Memory leak detection
3. Benchmarks:
   - App startup < 3s
   - Component generation < 500ms
   - Preview update < 500ms
   - Manifest save < 200ms

Reference @docs/PERFORMANCE.md

State approach and confidence 1-10.
```

**Success Criteria:**
- [ ] All benchmarks met
- [ ] No memory leaks
- [ ] Smooth UI interactions
- [ ] Large projects performant

**Human Checkpoint:** ✅ Performance Review
- Validate optimizations effective
- Test with realistic data
- Verify benchmarks on multiple machines

---

### Phase 4 Deliverable

```
✅ Production-ready quality:
   • 80%+ unit test coverage
   • Integration tests passing
   • Security audit complete
   • Performance benchmarks met
   • No critical bugs
```

**Total Estimate**: 4 weeks

---

## Phase 5: Release Prep (Weeks 16-18)

### Goals
- User documentation complete
- Final security audit
- Distribution setup
- Release candidate ready

---

### Task 5.1: User Documentation
**Duration**: 4-5 days | **AI Confidence**: 7+ (requires human review)

**Prompt:**
```
Create comprehensive user documentation for Rise MVP.

Requirements:
1. Getting Started Guide:
   - Installation instructions
   - First project walkthrough
   - Basic component creation
2. User Manual:
   - All features documented
   - Screenshots/videos
   - Common workflows
3. Troubleshooting Guide:
   - Common issues
   - Error messages explained
   - Support information
4. Limitations Document:
   - Level 1 constraints clearly explained
   - Level 2+ feature roadmap

State approach and confidence 1-10.
```

**Success Criteria:**
- [ ] Getting Started complete
- [ ] User Manual complete
- [ ] Troubleshooting Guide complete
- [ ] Level 1 limitations clearly documented
- [ ] Screenshots/examples included

**Human Checkpoint:** ✅ Documentation Review
- Verify clarity and completeness
- Test docs with new users
- Correct any confusion

---

### Task 5.2: Final Security Audit
**Duration**: 2-3 days | **AI Confidence**: N/A (human only)

**Checklist:**
- [ ] All security tests pass
- [ ] No security vulnerabilities in dependencies (npm audit)
- [ ] API keys properly encrypted
- [ ] File system access restricted
- [ ] Input validation comprehensive
- [ ] Error messages don't leak sensitive data
- [ ] Security documentation complete

**Human Checkpoint:** ✅ **CRITICAL** Final Security Sign-off
- Security expert final review
- Penetration testing if possible
- Document any known limitations

---

### Task 5.3: Distribution Setup
**Duration**: 3-4 days | **AI Confidence**: 8+

**Prompt:**
```
Set up distribution for Rise MVP.

Requirements:
1. electron-builder configuration:
   - Mac (dmg, zip)
   - Windows (exe, portable)
   - Linux (AppImage, deb)
2. Auto-updater integration
3. Code signing (certificates needed)
4. Release notes generator
5. Version management

State approach and confidence 1-10.
```

**Success Criteria:**
- [ ] Builds for all platforms
- [ ] Installers tested on all platforms
- [ ] Auto-update works
- [ ] Code signing configured
- [ ] Release process documented

**Human Checkpoint:** ✅ Release Testing
- Test installers on clean machines
- Verify auto-update
- Test on all target platforms

---

### Task 5.4: Release Candidate
**Duration**: 2-3 days | **AI Confidence**: N/A (human only)

**Final Checklist:**
- [ ] All Phase 0-4 deliverables complete
- [ ] Documentation complete
- [ ] Security audit passed
- [ ] All tests passing
- [ ] Performance benchmarks met
- [ ] Distribution builds successful
- [ ] Known issues documented
- [ ] Release notes written

**Human Checkpoint:** ✅ **CRITICAL** Go/No-Go Decision
- Review all deliverables
- Assess readiness for release
- Make final go/no-go decision

---

### Phase 5 Deliverable

```
✅ MVP RELEASE:
   • Fully documented application
   • Security audited and approved
   • Distribution packages for all platforms
   • Ready for beta users
```

**Total Estimate**: 3 weeks

---

## 👥 Human Review Checkpoints

### Summary of Required Human Reviews

| Phase | Task | Review Type | Priority | Est. Time |
|-------|------|-------------|----------|-----------|
| 0 | File Watcher | Testing | CRITICAL | 4h |
| 0 | Security Foundation | Security Audit | CRITICAL | 4h |
| 1 | Project Creation | Architecture Review | High | 2h |
| 1 | Hash Watcher Integration | Testing | CRITICAL | 3h |
| 2 | Manifest Manager | Code Review | High | 3h |
| 2 | AI Generation | Review | High | 2h |
| 3 | Code Generator | Code Quality | High | 3h |
| 3 | File Generation | Testing | CRITICAL | 3h |
| 3 | Live Preview | Performance | Medium | 2h |
| 4 | Unit Tests | Test Review | High | 3h |
| 4 | Integration Tests | Test Execution | High | 3h |
| 4 | Security Testing | Security Audit | CRITICAL | 6h |
| 4 | Performance | Performance Review | High | 3h |
| 5 | Documentation | Documentation Review | Medium | 4h |
| 5 | Security Audit | Final Sign-off | CRITICAL | 4h |
| 5 | Distribution | Release Testing | High | 4h |
| 5 | Release | Go/No-Go | CRITICAL | 2h |

**Total Human Time**: ~55 hours (~30% of project)

**CRITICAL Reviews** (must not be skipped): File Watcher, Security Foundation, Hash Watcher, Security Testing, Final Security Audit, Release Decision

---

## 📊 Context Management Strategy

### Managing Claude's Context Window

**Context Limit**: 200K tokens  
**Typical Task**: 10-30K tokens  
**Strategy**: Keep tasks focused and reference docs strategically

### Per-Task Context Pattern

```
1. Start new Cline conversation for each major task
2. Load ONLY relevant documentation:
   - @docs/SCHEMA_LEVELS.md (ALWAYS - enforces Level 1)
   - @docs/ARCHITECTURE.md (for architecture tasks)
   - @docs/SECURITY_SPEC.md (for security-related tasks)
   - @docs/[task-specific doc]
3. Reference previous work via summaries, not full code
4. Use attempt_completion to summarize results
5. Start next task fresh
```

### Documentation Priority

| Always Reference | Task-Specific | Rarely Needed |
|------------------|---------------|---------------|
| SCHEMA_LEVELS.md | TESTING_STRATEGY.md | GETTING_STARTED.md |
| (enforces Level 1) | (for testing tasks) | (end-user doc) |
| | SECURITY_SPEC.md | PERFORMANCE.md |
| | (for security tasks) | (unless optimizing) |
| | COMPONENT_SCHEMA.md | DEBUGGER_DESIGN.md |
| | (for manifest work) | (Level 3 feature) |

### Context-Saving Tips

1. **Summaries Over Code**: Reference implementations via summaries
2. **Incremental Loading**: Load docs as needed
3. **Task Isolation**: Each task independently understandable
4. **Clear Handoffs**: End each task with summary for next task

---

## 🎯 Success Criteria Summary

### Technical Success Criteria

✅ **Functionality**:
- Can create React projects in < 2 minutes
- Can add 20+ components without issues
- Generated code compiles without errors
- Preview loads in < 5 seconds
- AI generates usable Level 1 components
- File watcher prevents infinite loops

✅ **Stability**:
- No crashes in 1-hour session
- File operations complete in < 500ms
- Changes persist across restarts
- Memory usage < 500MB
- No security vulnerabilities

✅ **Quality**:
- 80%+ unit test coverage
- All integration tests pass
- ESLint compliant generated code
- Prettier formatted output
- Comprehensive error handling

✅ **Security**:
- API keys encrypted in OS keychain
- Input sanitization prevents attacks
- File access restricted to project directory
- No sensitive data in logs
- Budget tracking prevents API abuse

---

## 📝 Final Notes

### Post-MVP Roadmap Reference

**Level 2 Features (Post-MVP)**:
- Expression system with sandboxing
- State management (local + global)
- Event handlers
- Computed properties
- Global functions

**Level 3 Features (Future)**:
- Real-time data connections
- AI code review
- Step debugger
- Performance monitoring
- Database integration

See `@docs/SCHEMA_LEVELS.md` for complete progression plan.

### Key Success Factors

1. **Phase 0 is NON-NEGOTIABLE** - The file watcher and security foundation prevent major problems later
2. **Level 1 Enforcement is CRITICAL** - Any Level 2+ features will derail the MVP timeline
3. **Security Cannot Be Postponed** - Build it in from day 1
4. **Testing is Essential** - 80% coverage ensures quality
5. **Human Reviews Are Required** - Don't skip critical checkpoints

### Common Pitfalls to Avoid

❌ **DON'T:**
- Skip Phase 0 to "move faster"
- Implement expression features "just in case"
- Postpone security to "polish phase"
- Skip unit tests to "save time"
- Ignore human review checkpoints
- Use timestamp-based file change detection

✅ **DO:**
- Follow the phases in order
- Enforce Level 1 strictly
- Implement security from the start
- Write tests as you go
- Get human review on critical items
- Use hash-based file change detection

### Getting Started

**Day 1 Checklist:**
1. Install Cline extension in VSCode
2. Set up custom instructions (copy from this doc)
3. Review `.clinerules/` files (already in project)
4. Review all documentation in `docs/` folder
5. Start Phase 0, Task 0.1: File Watcher

**First Week Goals:**
- Complete Phase 0 foundation work
- All security measures implemented
- Level 1 validator working
- Testing infrastructure ready
- Human reviews completed

**First Month Goals:**
- Complete Phases 0-1
- Working Electron app
- Project creation functional
- File watcher proven safe
- Ready for Phase 2

---

## 📞 Support & Resources

### Documentation Quick Links

- **Architecture**: `docs/ARCHITECTURE.md`
- **Schema Levels**: `docs/SCHEMA_LEVELS.md` ⭐ CRITICAL
- **Security**: `docs/SECURITY_SPEC.md`
- **Testing**: `docs/TESTING_STRATEGY.md`
- **MVP Roadmap**: `docs/MVP_ROADMAP.md`

### When to Ask for Human Help

**Always ask for human help when:**
- Confidence < 7 on any task
- Security concerns arise
- Architecture decisions needed
- Level 1 vs Level 2+ feature unclear
- Performance issues discovered
- Test failures persist
- Any critical checkpoint

### Project Communication

**Status Updates:**
- End of each phase: Summary of deliverables
- End of each week: Progress report
- After each critical checkpoint: Review results
- When blocked: Immediate escalation

---

## ✅ Pre-Implementation Checklist

Before starting Phase 0, verify:

- [ ] All documentation reviewed
- [ ] Custom instructions configured in Cline
- [ ] `.clinerules/` files in place
- [ ] Development environment set up (Node.js, Git, VSCode)
- [ ] Claude Sonnet 4 API key configured
- [ ] Git repository initialized
- [ ] Team aligned on Level 1 scope
- [ ] Human reviewers identified
- [ ] Schedule planned (14-18 weeks)

---

## 📈 Progress Tracking

### Weekly Status Report Template

```markdown
## Week [N] Status Report

**Phase**: [Phase Name]
**Tasks Completed**:
- [x] Task N.N: [Name]
- [x] Task N.N: [Name]

**Tasks In Progress**:
- [ ] Task N.N: [Name] - [% complete]

**Blockers**:
- [List any blockers]

**Human Reviews Completed**:
- [List reviews completed this week]

**Next Week Plan**:
- [ ] Task N.N: [Name]
- [ ] Task N.N: [Name]

**Risk Assessment**:
- [Any risks or concerns]

**Questions**:
- [Any questions needing answers]
```

### Phase Completion Template

```markdown
## Phase [N] Complete: [Phase Name]

**Duration**: [Actual weeks]
**Deliverables**: [List all deliverables]
**Tests Passing**: [Yes/No + details]
**Human Reviews**: [All completed]
**Known Issues**: [List any known issues]
**Lessons Learned**: [What went well, what could improve]

**Ready for Phase [N+1]**: [Yes/No]
```

---

## 🎯 Ready to Start

**You are now ready to begin implementing the Rise MVP!**

**Next Steps:**
1. Complete the Pre-Implementation Checklist above
2. Configure Cline with the Custom Instructions provided
3. Start with **Phase 0, Task 0.1**: File Watcher with Hash Detection
4. Follow the implementation plan step-by-step
5. Get human review at each checkpoint
6. Track progress using the templates provided

**Remember:**
- 🚨 Level 1 ONLY for MVP
- 🔒 Security from day 1
- ✅ Testing as you go
- 👥 Human review on critical items
- 📊 Track progress weekly

---

**Good luck building Rise! 🚀**

---

*Document Version*: 2.0 (Complete Rewrite)  
*Last Updated*: October 25, 2025  
*Aligned With*: MVP_ROADMAP.md, SCHEMA_LEVELS.md, SECURITY_SPEC.md, TESTING_STRATEGY.md  
*Timeline*: 14-18 weeks  
*Schema Level*: 1 Only  
*Status*: ✅ Ready for Implementation
