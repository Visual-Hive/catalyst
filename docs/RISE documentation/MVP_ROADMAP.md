# MVP Roadmap (Updated)

> **Last Updated**: November 28, 2025  
> **Status**: Phase 3 In Progress

---

## Vision & Scope

**Goal**: Build a functional Electron-based visual low-code builder that generates clean React code from a visual component editor, with AI assistance for component creation.

**Target MVP Timeline**: 14-18 weeks (with AI assistance via Cline/Claude)
- **Phase 0 (Foundation)**: 2 weeks - Security specs, schema design, architecture validation
- **Phase 1-5 (Implementation)**: 12-16 weeks - Core development

**MVP Feature Scope**: Schema Level 1 ONLY (see [SCHEMA_LEVELS.md](./SCHEMA_LEVELS.md))

---

## 📊 Current Progress

| Phase | Name | Status | Duration | Completed |
|-------|------|--------|----------|-----------|
| **0** | Foundation | ✅ Complete | ~2 weeks | Nov 19, 2025 |
| **1** | Application Shell | ✅ Complete | ~1 week | Nov 24, 2025 |
| **2** | Component Management | ✅ Complete | ~3 days | Nov 27, 2025 |
| **3** | Code Generation & Preview | 🔄 In Progress | ~2 days so far | - |
| **4** | Testing & Polish | 🔵 Not Started | Est. 2-3 weeks | - |
| **5** | Release Preparation | 🔵 Not Started | Est. 1-2 weeks | - |

**Observation**: Development is proceeding faster than original estimates due to effective AI-assisted development and thorough upfront planning.

---

## ✅ Success Criteria

- ✅ Can create new React project with Vite
- ✅ Can add/edit components visually (static properties only)
- ✅ Can organize component hierarchy (max 5 levels deep)
- ✅ Generates clean, standard React code
- 🔄 Preview works with hot reload *(in progress)*
- ✅ AI assists with component generation (Claude API integrated)
- ✅ All security measures implemented (SECURITY_SPEC.md)

---

## Explicitly OUT OF SCOPE for MVP

- ❌ Expressions (Level 2 - Post-MVP)
- ❌ State management (Level 2 - Post-MVP)
- ❌ Event handlers (Level 2 - Post-MVP)
- ❌ Data connections / Database integration (Level 3 - Future)
- ❌ Real-time features / WebSockets (Level 3 - Future)
- ❌ AI code review (Level 3 - Future)
- ❌ Step debugger (Level 3 - Future)
- ❌ Bidirectional sync (Post-MVP)
- ❌ TypeScript support (Post-MVP Phase 6)
- ❌ Plugin system beyond React (Post-MVP Phase 8)
- ❌ Hosted backend with Parse Server (Post-MVP - see [HOSTED_BACKEND.md](./HOSTED_BACKEND.md))

---

## Development Approach

### AI vs Human Split

**AI/Cline Handled (70% of MVP)**:
- ✅ Electron app boilerplate and setup
- ✅ Basic React UI components (panels, trees, forms)
- ✅ File system operations (read/write/watch)
- ✅ JSON manifest management (CRUD operations)
- ✅ Code generation (Level 1 templates)
- ✅ Vite project scaffolding
- ✅ Basic IPC communication
- ✅ UI styling with Tailwind

**Human Developer Required (30% of MVP)**:
- ✅ Security implementation review (P0)
- ✅ File watcher infinite loop prevention (P0)
- ✅ Architecture decisions and trade-offs
- 🔄 Complex error handling edge cases
- 🔄 Performance optimization
- 🔄 Security audit and validation
- 🔄 Testing strategy implementation
- 🔄 UX refinement and polish

---

## Phase 0: Foundation ✅ COMPLETE

**Duration**: ~2 weeks (completed Nov 19, 2025)  
**Status**: ✅ All tasks complete and reviewed

### Completed Tasks

#### Task 0.1: File Watcher with Hash Detection ✅
- FileChangeTracker class with SHA-256 hash detection
- Prevents infinite loops between code generation and file watching
- Handles concurrent edits and slow file systems
- >95% test coverage

#### Task 0.2: Security Foundation ✅
- APIKeyManager with keytar (OS keychain) integration
- APIUsageTracker for cost management and budget limits
- Input sanitization utilities
- 90-day key rotation warnings
- AES-256 encryption for sensitive data

#### Task 0.3: Schema Level 1 Validator ✅
- SchemaValidator enforcing Level 1 boundaries
- Blocks all Level 2/3 features with helpful messages
- Circular reference detection
- Depth and children limits (5 levels, 20 children)
- <100ms validation for 100 components

#### Task 0.4: Testing Infrastructure ✅
- Vitest configuration for unit and integration tests
- Test fixtures for manifests
- Coverage targets defined (90%+)

---

## Phase 1: Application Shell ✅ COMPLETE

**Duration**: ~1 week (completed Nov 24, 2025)  
**Status**: ✅ All tasks complete and reviewed

### Completed Tasks

#### Task 1.1: Electron + React Setup ✅
- Electron 28+ with React 18 and TypeScript
- Three-config TypeScript setup (electron, renderer, node)
- Secure IPC with contextBridge
- CSP configured (dev/prod split)

#### Task 1.2: Basic UI Layout ✅
- Three-panel layout with react-resizable-panels
- Navigator panel (left) - component tree
- Editor panel (center) - preview
- Properties panel (right) - property editing
- Dark theme with Tailwind

#### Task 1.3: Project Management ✅
- ProjectManager for create/open/save operations
- Vite project scaffolding
- .lowcode/ metadata directory structure
- Recent projects tracking

#### Task 1.4: Preview System Foundation ✅
- ViteServerManager starts/stops Vite dev server
- PreviewPanel with iframe and viewport controls
- Zoom controls and device simulation
- Hot reload working

---

## Phase 2: Component Management ✅ COMPLETE

**Duration**: ~3 days (completed Nov 27, 2025)  
**Status**: ✅ All tasks complete and human verified

### Completed Tasks

#### Task 2.1: Component Tree UI ✅
- ComponentTree with hierarchical display
- Selection state management
- Add/delete component operations
- Expand/collapse nodes

#### Task 2.2: Manifest Persistence ✅
- manifestStore (Zustand) for reactive state
- Auto-save with 500ms debounce
- Load/save to .lowcode/manifest.json
- Change detection

#### Task 2.3: Property Panel Editor ✅
- PropertiesPanel with type-specific inputs
- String, number, boolean editors
- Styling editor (Tailwind classes)
- Real-time manifest updates

#### Task 2.4: AI Component Generation ✅
**Completed faster than estimated (2 days vs 4-5 days)**

- AIComponentGenerator with Claude API integration
- AIPromptDialog with cost estimation
- API key validation before storage
- Budget tracking and daily limits
- Level 1 enforcement on generated components
- Auto-fix for expression/state/event violations

**Key Implementation Decisions**:
- Using Claude Sonnet model for balance of quality/cost
- Cost estimation before every API call (no surprises)
- Debounced cost display (500ms) for smooth UX
- Level 1 violations auto-fixed, not rejected

---

## Phase 3: Code Generation & Preview 🔄 IN PROGRESS

**Duration**: Started Nov 27, 2025  
**Status**: 🔄 Tasks 3.1-3.2 complete, Task 3.3 in progress

### Task 3.1: React Code Generator ✅ COMPLETE
**Completed**: Nov 27, 2025

- Modular builder architecture:
  - ImportBuilder - React + child component imports
  - PropsBuilder - Destructuring with defaults
  - JSXBuilder - Element tree generation
  - CommentHeaderBuilder - @lowcode markers
  - CodeAssembler - Combines all parts
  - ReactCodeGenerator - Main orchestrator
- Prettier integration for formatting
- Template strings approach (simpler than AST for Level 1)
- Performance: 50 components in ~284ms (target was <500ms)
- 35 tests, all passing

**Key Decision**: Used template strings instead of AST manipulation (Babel) because Level 1 has simple, predictable output. AST would be needed for Level 2 expressions.

### Task 3.2: File Management with Hash Watcher ✅ COMPLETE
**Completed**: Nov 27, 2025 (1 day vs 3-4 day estimate)

- FileManager orchestrates all file operations
- ChangeDetector determines which components changed
- FileWriter integrates with FileChangeTracker (Phase 0)
- AppGenerator creates App.jsx and main.jsx
- Incremental generation (only changed components)
- User edit protection

### Task 3.3: Live Preview Integration 🔄 IN PROGRESS
**Current Task**

- GenerationService subscribes to manifest changes
- Debounced regeneration (300ms)
- generationStore for status tracking
- GenerationStatus UI component
- Vite HMR automatically updates preview

**Expected Completion**: ~1 day

---

## Phase 4: Testing & Polish 🔵 NOT STARTED

**Estimate**: 2-3 weeks

### Planned Tasks

#### Task 4.1: Comprehensive Testing
- Unit tests for all core modules
- Integration tests for workflows
- E2E tests for critical paths
- Target: 90%+ coverage

#### Task 4.2: Error Handling Polish
- User-friendly error messages
- Error boundaries in UI
- Graceful degradation
- Error logging

#### Task 4.3: Performance Optimization
- Profile and optimize hot paths
- Lazy loading for large projects
- Memory leak detection
- Startup time optimization

#### Task 4.4: UX Polish
- Keyboard shortcuts
- Accessibility audit
- UI consistency pass
- Loading states and feedback

---

## Phase 5: Release Preparation 🔵 NOT STARTED

**Estimate**: 1-2 weeks

### Planned Tasks

#### Task 5.1: Documentation
- User guide
- API documentation
- Tutorial creation
- Changelog

#### Task 5.2: Packaging
- Build configuration
- Installers (Windows, Mac, Linux)
- Auto-update setup
- Code signing

#### Task 5.3: Beta Release
- Internal testing
- Bug fixes
- Performance validation
- Release candidate

---

## Post-MVP Phases

### Phase 6: Schema Level 2 (Weeks 19-30)
- Expression system with sandboxing
- State management (local + global)
- Event handlers
- Computed properties
- Global functions
- Node-based logic system (React Flow)

**See**: [SCHEMA_LEVELS.md](./SCHEMA_LEVELS.md) - Level 2

### Phase 7: Enhanced Features (Weeks 31-42)
- TypeScript support
- Component library plugins (MUI, Ant Design)
- Advanced styling system
- Performance optimization

### Phase 8: Framework Plugins (Weeks 43-46)
- Plugin system interface
- Vue plugin
- Svelte plugin

**See**: [PLUGIN_SYSTEM.md](./PLUGIN_SYSTEM.md)

### Phase 9: Bidirectional Sync (Weeks 47-58)
- AST parsing of user edits
- AI-assisted reverse engineering
- Conflict resolution
- Protected regions

**See**: [BIDIRECTIONAL_SYNC.md](./BIDIRECTIONAL_SYNC.md)

### Phase 10: Schema Level 3 - Advanced Features (Weeks 59+)
- Step debugger
- Real-time data connections
- Database integration
- AI code review
- Performance monitoring
- Hosted backend system (Parse Server)

**See**: [SCHEMA_LEVELS.md](./SCHEMA_LEVELS.md) - Level 3  
**See**: [HOSTED_BACKEND.md](./HOSTED_BACKEND.md) - Backend system

---

## Resource Requirements

### AI Development (Cline/Claude)
- **Availability**: Continuous throughout project
- **Usage**: Primary development tool for 70% of features
- **Cost**: ~$800-1,600 for MVP (API usage)
- **Best For**: UI implementation, CRUD operations, code generation

### Human Developer
- **Phase 0**: Full-time (2 weeks) - Foundation
- **Phase 1-3**: Part-time (10-15 hours/week) - Architecture review
- **Phase 4**: Part-time (15-20 hours/week) - Feature review
- **Phase 5**: Full-time (4 weeks) - Testing, polish, release
- **Total**: ~320-400 hours for MVP

---

## Risk Mitigation

### Technical Risks

| Risk | Mitigation | Status |
|------|------------|--------|
| Expression security vulnerabilities | Deferred to Level 2 with full security spec | ✅ Mitigated |
| File watcher infinite loops | FileChangeTracker with hash detection | ✅ Implemented |
| AI generates invalid code | Level 1 validation + auto-fix | ✅ Implemented |
| Preview crashes frequently | Error boundaries, sandboxing | 🔄 In progress |
| API costs spiral | Cost tracking, budget limits | ✅ Implemented |

### Scope Risks

| Risk | Mitigation | Status |
|------|------------|--------|
| Feature creep | Strict Level 1 enforcement | ✅ Enforced |
| Database integration requests | Documented in Level 3 roadmap | ✅ Documented |
| TypeScript demands | Clear post-MVP timeline | ✅ Documented |
| Bidirectional sync pressure | Explained complexity, timeline | ✅ Documented |

---

## Success Metrics

### MVP Launch Criteria

✅ **Functionality**:
- ✅ Can create React project in < 2 minutes
- ✅ Can add 10+ components without issues
- ✅ Generated code compiles without errors
- 🔄 Preview loads in < 5 seconds
- ✅ AI generates usable components > 70% of time
- ✅ File operations complete in < 500ms

🔄 **Stability**:
- 🔄 No crashes in 1-hour session
- ✅ File watcher handles concurrent edits
- 🔄 Undo/redo works correctly
- 🔄 Manifest saves reliably

🔵 **Security**:
- ✅ API keys stored in OS keychain
- ✅ No Node.js exposure to renderer
- 🔄 Input sanitization complete
- 🔄 Security audit passed

🔵 **Performance**:
- ✅ Code generation < 100ms per component
- 🔄 UI responsive during operations
- 🔄 Memory usage < 500MB typical
- 🔄 Startup time < 5 seconds

---

## Key Decisions Made During Implementation

| Decision | Choice | Rationale | Task |
|----------|--------|-----------|------|
| Code generation approach | Template strings | Simpler than AST for Level 1; AST needed for Level 2 | 3.1 |
| API model | Claude Sonnet | Balance of quality and cost | 2.4 |
| Cost estimation | Before every call | No surprise charges | 2.4 |
| Hash algorithm | SHA-256 | Industry standard, fast enough | 0.1 |
| Key storage | keytar | OS-native keychain integration | 0.2 |
| Debounce timing | 300ms generation, 500ms save | Responsive but not excessive | Various |
| Level 1 violations | Auto-fix, don't reject | Better UX for AI generation | 2.4 |
| Prettier | In-process | Faster than subprocess | 3.1 |

---

## Documentation Status

| Document | Status | Notes |
|----------|--------|-------|
| README.md | ✅ Updated Nov 28 | Progress tracking added |
| MVP_ROADMAP.md | ✅ Updated Nov 28 | This document |
| DOCUMENTATION_INDEX.md | 🔄 Needs update | Status dates outdated |
| COMPONENT_SCHEMA.md | ⚠️ Has pending changes | Level indicators proposed but not applied |
| HOSTED_BACKEND.md | ✅ Correct | Properly marked as future |
| CLINE_IMPLEMENTATION_PLAN.md | ⚠️ Needs status markers | Phase statuses not marked |

---

## Summary

**Progress**: The MVP is progressing faster than originally estimated, with Phases 0-2 complete and Phase 3 nearly finished. The AI-assisted development approach with Cline is proving highly effective, with tasks often completing in 25-50% of estimated time.

**Next Steps**:
1. ✅ Complete Phase 0 (foundation) - DONE
2. ✅ Complete Phase 1 (application shell) - DONE
3. ✅ Complete Phase 2 (component management) - DONE
4. 🔄 Complete Phase 3 (code generation) - IN PROGRESS
5. 🔵 Begin Phase 4 (testing & polish)
6. 🔵 Ship Schema Level 1 MVP

**Expected MVP Completion**: Weeks 12-14 (ahead of 14-18 week estimate)

---

**See Also**:
- [SCHEMA_LEVELS.md](./SCHEMA_LEVELS.md) - Feature progression
- [SECURITY_SPEC.md](./SECURITY_SPEC.md) - Security requirements
- [TESTING_STRATEGY.md](./TESTING_STRATEGY.md) - Testing approach
- [ARCHITECTURE.md](./ARCHITECTURE.md) - Technical implementation
- [HOSTED_BACKEND.md](./HOSTED_BACKEND.md) - Future backend system

---

**Last Updated**: November 28, 2025  
**Status**: ✅ Updated with current progress  
**Review Required**: Project Lead