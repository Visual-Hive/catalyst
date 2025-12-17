# Implementation Decisions Log

> Key architectural and implementation decisions made during Rise MVP development  
> **Last Updated**: November 28, 2025

---

## Overview

This document captures significant decisions made during implementation that weren't fully specified in the original architecture documents. These decisions should be considered when updating core documentation or when working on related features.

---

## Phase 0: Foundation

### Task 0.1: File Watcher

| Decision | Choice | Alternatives Considered | Rationale |
|----------|--------|------------------------|-----------|
| Hash algorithm | SHA-256 | MD5, SHA-1, file size | Industry standard, collision-resistant, fast enough for our use case |
| Hash storage | In-memory Map | File-based, SQLite | Simpler, no persistence needed (hashes regenerate on startup) |
| Debounce timing | 100ms | 50ms, 200ms, 500ms | Fast enough for responsiveness, slow enough to batch rapid changes |
| Pause strategy | Per-file pause | Global pause | Allows concurrent operations on different files |

### Task 0.2: Security Foundation

| Decision | Choice | Alternatives Considered | Rationale |
|----------|--------|------------------------|-----------|
| Key storage | keytar (OS keychain) | Encrypted file, environment vars | OS-native security, no custom encryption needed |
| Key rotation | 90-day warnings | Auto-rotation, no warnings | Balance between security and usability |
| Usage tracking | Daily budgets | Per-request limits, monthly | Predictable daily cost control |
| Budget default | $1.00/day | $5, $10, unlimited | Conservative default, easily adjustable |

### Task 0.3: Schema Validator

| Decision | Choice | Alternatives Considered | Rationale |
|----------|--------|------------------------|-----------|
| Validation approach | Single-pass with early exit | Multi-pass, lazy validation | Performance + clear error reporting |
| Error format | Rich context with suggestions | Simple error strings | Better UX, helps users fix issues |
| Level 2/3 blocking | Helpful message + docs link | Silent rejection, generic error | Educational, guides users to roadmap |
| Circular detection | DFS with visited set | BFS, Floyd's algorithm | Simple, efficient for tree structures |

---

## Phase 1: Application Shell

### Task 1.1: Electron Setup

| Decision | Choice | Alternatives Considered | Rationale |
|----------|--------|------------------------|-----------|
| TypeScript config | Three separate configs | Single config, two configs | Clean separation: main, renderer, node contexts |
| CSP approach | Dev disabled, prod enabled | Always enabled, always disabled | HMR requires unsafe-eval in dev; production secure |
| IPC pattern | contextBridge only | nodeIntegration, preload scripts | Maximum security, explicit API surface |
| React version | React 18 | React 17 | Latest features, concurrent rendering |

### Task 1.4: Preview Foundation

| Decision | Choice | Alternatives Considered | Rationale |
|----------|--------|------------------------|-----------|
| Dev server | Vite | Webpack, Parcel, esbuild | Fastest HMR, great React support |
| Preview iframe | Sandboxed iframe | WebView, same-window | Security isolation, standard web APIs |
| Port management | Dynamic port assignment | Fixed port, port range | Avoids conflicts with user apps |

---

## Phase 2: Component Management

### Task 2.3: Property Panel

| Decision | Choice | Alternatives Considered | Rationale |
|----------|--------|------------------------|-----------|
| Property types for MVP | StaticProperty only | Include PropProperty | Simpler for Level 1; props come from manifest structure |
| Object/array editing | Read-only with message | JSON editor, nested forms | Complexity deferred to Level 2 |
| New property type | Always StaticProperty | Type selection dialog | Simplifies UX, expressions are Level 2 |

### Task 2.4: AI Component Generation

| Decision | Choice | Alternatives Considered | Rationale |
|----------|--------|------------------------|-----------|
| AI model | Claude Sonnet | GPT-4, Claude Opus, Haiku | Balance of quality and cost |
| Cost estimation | Before every call | After call, no estimation | No surprise charges; user sees cost before committing |
| Cost display | Debounced 500ms | Real-time, on-blur | Smooth UX without excessive recalculation |
| Level 1 violations | Auto-fix silently | Reject with error, warn user | Better UX; AI sometimes adds hooks/events |
| API key validation | Minimal ping before save | Save then test, no validation | Immediate feedback; prevents invalid keys |
| Streaming | Disabled (wait for full) | Streaming response | Simpler implementation; response is small enough |

**Auto-fix behavior for AI-generated components:**
- `useState` → Removed, default value used as static
- `useEffect` → Removed entirely
- `onClick` → Removed entirely
- Expression properties → Converted to static with evaluated value
- Event handlers → Removed entirely

---

## Phase 3: Code Generation

### Task 3.1: React Code Generator

| Decision | Choice | Alternatives Considered | Rationale |
|----------|--------|------------------------|-----------|
| Generation approach | Template strings | Babel AST, ts-morph, recast | Level 1 output is predictable; AST complexity not needed yet |
| Prettier integration | In-process | Subprocess, no formatting | Faster than spawning process; consistent output |
| Builder pattern | Separate builder classes | Single monolithic generator | Testable, maintainable, extensible for Level 2 |
| Export style | Named + default export | Named only, default only | Maximum compatibility with different import styles |

**When to switch to AST:**
- Level 2 expressions require AST for safe code injection
- Bidirectional sync requires AST for parsing user edits
- Template strings are fine for Level 1's simple, predictable output

### Task 3.2: File Management

| Decision | Choice | Alternatives Considered | Rationale |
|----------|--------|------------------------|-----------|
| Change detection | Hash comparison | Timestamp, file size, always regenerate | Accurate; prevents unnecessary writes |
| Incremental generation | Only changed components | Always regenerate all | Performance for large projects |
| User edit tracking | Hash mismatch detection | Explicit markers, file attributes | Automatic; no user action required |
| App.jsx generation | On every manifest change | Only when root components change | Simplifies logic; App.jsx is small |

### Task 3.3: Live Preview (In Progress)

| Decision | Choice | Alternatives Considered | Rationale |
|----------|--------|------------------------|-----------|
| Regeneration trigger | manifestStore subscription | File watcher, polling | Direct; no intermediate state |
| Debounce timing | 300ms | 100ms, 500ms, 1000ms | Responsive but not excessive |
| HMR integration | Let Vite handle it | Custom HMR, full reload | Vite's HMR is excellent; no custom work needed |

---

## Cross-Cutting Decisions

### State Management

| Decision | Choice | Alternatives Considered | Rationale |
|----------|--------|------------------------|-----------|
| Store library | Zustand | Redux, MobX, Jotai | Simple API, good TypeScript support, no boilerplate |
| Store structure | Multiple stores | Single store, context | Separation of concerns; independent updates |
| Persistence | Debounced file write | Immediate, periodic | Balance between data safety and performance |

### Error Handling

| Decision | Choice | Alternatives Considered | Rationale |
|----------|--------|------------------------|-----------|
| Error type | Rich error objects | Error strings, error codes | Context for debugging, user-friendly messages |
| Error display | Toast notifications | Modal dialogs, inline errors | Non-blocking, dismissible |
| Logging | Console + file (future) | Console only, external service | Development visibility; production debugging |

### Performance Targets

| Metric | Target | Achieved | Notes |
|--------|--------|----------|-------|
| Code generation (50 components) | <500ms | ~284ms | Exceeded target |
| Schema validation (100 components) | <100ms | ~50ms | Exceeded target |
| File operations | <500ms | <100ms | Well under target |
| Preview update | <500ms | TBD | In progress (Task 3.3) |

---

## Deferred Decisions

These decisions were explicitly deferred to later phases:

| Decision | Deferred To | Reason |
|----------|-------------|--------|
| AST-based code generation | Level 2 | Not needed for static properties |
| Expression sandboxing approach | Level 2 | No expressions in Level 1 |
| Bidirectional sync strategy | Post-MVP | Complex; needs user research |
| Plugin API design | Post-MVP | React-only for MVP |
| Database integration | Level 3 | Scope control |
| Streaming AI responses | Post-MVP | Current response size is fine |

---

## Lessons Learned

### What Worked Well

1. **Thorough upfront planning** - Reduced implementation surprises significantly
2. **Phase 0 foundation work** - FileChangeTracker and SchemaValidator prevented many issues
3. **Modular builder pattern** - Made code generation testable and maintainable
4. **AI-assisted development** - 70% productivity gain with Cline
5. **Debounce everywhere** - Prevents performance issues and infinite loops

### What Could Be Improved

1. **Task estimation** - Most tasks completed faster than estimated (good problem to have)
2. **Documentation timing** - Should update docs immediately after decisions, not later
3. **Test-first approach** - Some tests written after implementation

### Patterns to Reuse

1. **Three-config TypeScript** for Electron apps
2. **Hash-based change detection** for any file-generating tool
3. **Cost estimation before API calls** for any AI integration
4. **Builder pattern** for complex string/code generation
5. **Debounced subscriptions** for reactive state changes

---

## Document Maintenance

This document should be updated:
- After each significant implementation decision
- When changing an existing decision
- During phase reviews

**Format for new decisions:**
```markdown
| Decision | Choice | Alternatives Considered | Rationale |
|----------|--------|------------------------|-----------|
| [What was decided] | [What we chose] | [Other options] | [Why this choice] |
```

---

**Last Updated**: November 28, 2025  
**Status**: Living document - update as decisions are made