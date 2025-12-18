# Task 0.1: File Watcher with Hash Detection

**Phase:** Phase 0 - Foundation  
**Duration Estimate:** 3 days  
**Actual Duration:** [To be filled when complete]  
**Status:** 🟡 Ready to Start  
**Assigned:** Cline + Human Review  
**Priority:** P0 - Critical Foundation  
**Started:** [YYYY-MM-DD]  
**Completed:** [YYYY-MM-DD]  

---

## 🎯 Task Overview

### Objective
Implement hash-based file change detection to prevent infinite loops between code generation and file watching, enabling safe bidirectional file system operations.

### Problem Statement
Without proper change detection, the system creates an infinite loop:
1. Tool generates code → saves file
2. File watcher detects change → triggers regeneration  
3. Tool generates code again → saves file
4. ∞ **Infinite loop continues forever**

The hash-based approach distinguishes between:
- **Tool-generated changes** (expected, should be ignored)
- **User edits** (unexpected, should trigger response)

### Why This Matters
This is **foundational infrastructure** that every other system component will depend on:
- Code generator (Phase 3)
- Preview system (Phase 4)
- Manifest manager (Phase 2)

**Without this, the entire system is unstable.**

### Success Criteria
- [ ] FileChangeTracker class fully implemented with hash-based detection
- [ ] Handles concurrent edits without race conditions
- [ ] Works reliably on slow file systems (network drives, cloud storage)
- [ ] Handles large files efficiently (>10MB without memory issues)
- [ ] No infinite loops in any test scenario (50+ test cases)
- [ ] Unit test coverage >90%
- [ ] Integration tests passing (100%)
- [ ] Performance benchmarks met (hash time <5ms for 1MB files)
- [ ] Human review completed and approved

### References
- **CLINE_IMPLEMENTATION_PLAN.md** - Phase 0, Task 0.1
- **docs/MVP_ROADMAP.md** - Phase 0.3 File Watcher Algorithm
- **docs/ARCHITECTURE.md** - File System Watcher section (lines 342-389)
- **docs/FILE_STRUCTURE_SPEC.md** - Project structure
- **docs/SECURITY_SPEC.md** - File system security requirements

### Dependencies
- ✅ None (this is the first implementation task)
- ✅ All documentation reviewed and approved
- ✅ Development environment set up

---

## 🗺️ Implementation Roadmap

### Milestone 1: Design & Edge Case Analysis
**Duration:** 4-6 hours  
**Confidence Target:** 8/10  
**Status:** 🔵 Ready to Start

**Activities:**
- [ ] Read and deeply analyze all reference documentation
  - [ ] MVP_ROADMAP.md Phase 0.3 (file watcher algorithm)
  - [ ] ARCHITECTURE.md file system section
  - [ ] SECURITY_SPEC.md file system restrictions
- [ ] Map out the infinite loop scenario in detail with sequence diagrams
- [ ] Design FileChangeTracker class structure
- [ ] Identify ALL edge cases (target: 10+)
- [ ] Create sequence diagrams for each scenario
- [ ] Document design decisions with confidence ratings
- [ ] Get human approval before coding

**Design Decisions to Make:**

| Decision | Options to Consider | Evaluation Criteria |
|----------|-------------------|---------------------|
| **Hash Algorithm** | MD5 (fast), SHA-1 (deprecated), SHA-256 (secure) | Speed vs security trade-off |
| **Storage Strategy** | In-memory Map, SQLite DB, JSON file | Performance vs persistence |
| **Pause Strategy** | Time-based, Event-based, Hybrid | Reliability vs complexity |
| **Hash Scope** | Full file, Partial file, Metadata | Performance vs accuracy |
| **Error Handling** | Fail-fast, Graceful degradation, Retry | Safety vs usability |
| **Concurrency Model** | Locks, Promises, Event queue | Race condition prevention |

**Edge Cases to Handle:**
1. **Rapid successive changes** (user typing fast)
2. **Concurrent edits** (user edits while tool generates)
3. **Slow file systems** (network drives with delay)
4. **Very large files** (>10MB, >100MB)
5. **File deleted during hash** (race condition)
6. **File created/deleted/created** (rapid lifecycle)
7. **Permission errors** (read-only files)
8. **Symbolic links** (should follow or ignore?)
9. **Binary files** (images, fonts - should skip?)
10. **Encoding issues** (UTF-8 vs other encodings)

**Deliverables:**
- Design document with class structure
- Sequence diagrams (4+ scenarios)
- Edge case analysis with solutions
- Confidence rating on approach

---

### Milestone 2: Core Implementation
**Duration:** 8-12 hours  
**Confidence Target:** 8/10  
**Status:** 🔵 Pending Milestone 1

**Activities:**
- [ ] Set up project structure (`src/core/FileChangeTracker.ts`)
- [ ] Implement hash computation (SHA-256 via crypto)
- [ ] Implement generation tracking (before/after hooks)
- [ ] Implement pause mechanism for specific paths
- [ ] Implement user edit detection
- [ ] Add comprehensive logging (debug level)
- [ ] Handle all identified edge cases
- [ ] Add TypeScript types and JSDoc comments

**Code Structure:**
```typescript
// src/core/FileChangeTracker.ts

import crypto from 'crypto';
import { EventEmitter } from 'events';

interface FileChangeEvent {
  filepath: string;
  changeType: 'user-edit' | 'tool-generated' | 'unknown';
  timestamp: number;
  hash: string;
}

export class FileChangeTracker extends EventEmitter {
  private generationHashes: Map<string, string>;
  private pausedPaths: Set<string>;
  private pendingWrites: Map<string, Promise<void>>;
  
  constructor(private options: FileChangeTrackerOptions) {
    super();
    this.generationHashes = new Map();
    this.pausedPaths = new Set();
    this.pendingWrites = new Map();
  }
  
  /**
   * Compute SHA-256 hash of file content
   * @param content File content as string
   * @returns Hash as hex string
   */
  public computeHash(content: string): string {
    return crypto
      .createHash('sha256')
      .update(content, 'utf8')
      .digest('hex');
  }
  
  /**
   * Call BEFORE generating/writing a file
   * Pauses watching and stores expected hash
   */
  public async onBeforeGenerate(
    filepath: string, 
    content: string
  ): Promise<void> {
    // TODO: Implement
  }
  
  /**
   * Call AFTER generating/writing a file
   * Resumes watching after delay
   */
  public async onAfterGenerate(
    filepath: string
  ): Promise<void> {
    // TODO: Implement
  }
  
  /**
   * Check if a file change was a user edit
   * @returns true if user edit, false if tool-generated
   */
  public async isUserEdit(
    filepath: string,
    newContent: string
  ): Promise<boolean> {
    // TODO: Implement
  }
  
  /**
   * Handle file system watcher event
   */
  public async handleFileChange(
    filepath: string
  ): Promise<FileChangeEvent> {
    // TODO: Implement
  }
  
  /**
   * Clean up resources
   */
  public destroy(): void {
    this.generationHashes.clear();
    this.pausedPaths.clear();
    this.removeAllListeners();
  }
}
```

**Implementation Challenges to Solve:**
1. **Race Condition:** User edits file while hash is computing
   - **Solution:** Use pending writes map with promises
2. **Memory Leak:** Hashes never cleared for deleted files
   - **Solution:** Periodic cleanup or TTL-based expiry
3. **Slow Hash:** Large files take too long
   - **Solution:** Hash first 1MB + last 1MB + file size
4. **Network Delay:** File write not immediately visible
   - **Solution:** Exponential backoff retry (50ms, 100ms, 200ms)

**Performance Targets:**
- Hash computation: <5ms for 1MB files
- Memory usage: <10MB for 1000 tracked files
- False positive rate: <0.1%

---

### Milestone 3: Unit Testing
**Duration:** 6-8 hours  
**Confidence Target:** 9/10  
**Status:** 🔵 Pending Milestone 2

**Activities:**
- [ ] Set up test infrastructure (Vitest)
- [ ] Write tests for hash computation
- [ ] Write tests for before/after hooks
- [ ] Write tests for user edit detection
- [ ] Write tests for all 10+ edge cases
- [ ] Write tests for concurrent operations
- [ ] Write tests for error conditions
- [ ] Achieve >90% code coverage

**Test Structure:**
```typescript
// tests/unit/FileChangeTracker.test.ts

describe('FileChangeTracker', () => {
  describe('Hash Computation', () => {
    it('computes consistent SHA-256 hashes', () => {});
    it('handles empty files', () => {});
    it('handles large files efficiently', () => {});
    it('handles special characters', () => {});
  });
  
  describe('Generation Tracking', () => {
    it('pauses watching before generation', () => {});
    it('resumes watching after generation', () => {});
    it('stores correct hash', () => {});
    it('handles concurrent generations', () => {});
  });
  
  describe('User Edit Detection', () => {
    it('detects user edits correctly', () => {});
    it('ignores tool-generated changes', () => {});
    it('handles rapid successive changes', () => {});
  });
  
  describe('Edge Cases', () => {
    it('handles deleted files gracefully', () => {});
    it('handles permission errors', () => {});
    it('handles slow file systems', () => {});
    // ... 7 more edge case tests
  });
  
  describe('Performance', () => {
    it('hashes 1MB file in <5ms', () => {});
    it('uses <10MB memory for 1000 files', () => {});
  });
});
```

**Coverage Requirements:**
- Line coverage: >90%
- Branch coverage: >85%
- Function coverage: 100%

---

### Milestone 4: Integration Testing
**Duration:** 4-6 hours  
**Confidence Target:** 8/10  
**Status:** 🔵 Pending Milestone 3

**Activities:**
- [ ] Create integration test environment
- [ ] Test with actual file system (temp directory)
- [ ] Test with chokidar file watcher integration
- [ ] Test full workflow: generate → watch → edit → detect
- [ ] Test with concurrent file operations
- [ ] Test with different file sizes (1KB, 1MB, 10MB)
- [ ] Test on different platforms (if possible)
- [ ] Document any platform-specific issues

**Integration Test Scenarios:**
```typescript
// tests/integration/fileWatcher.test.ts

describe('File Watcher Integration', () => {
  it('prevents infinite loop when tool generates code', async () => {
    // 1. Set up file watcher
    // 2. Generate file via FileChangeTracker
    // 3. Verify watcher doesn't trigger regeneration
    // 4. User edits file
    // 5. Verify watcher DOES trigger
  });
  
  it('handles rapid user edits correctly', async () => {
    // Simulate user typing (10 changes in 1 second)
  });
  
  it('works on slow file systems', async () => {
    // Add artificial delay to simulate network drive
  });
});
```

---

### Milestone 5: Human Review
**Duration:** 1-2 hours  
**Confidence Target:** 9/10  
**Status:** 🔵 Pending Milestone 4

**Review Checklist:**
- [ ] Code review: Architecture and design patterns
- [ ] Code review: Edge case handling
- [ ] Code review: Error handling and logging
- [ ] Code review: Performance and memory usage
- [ ] Test review: Coverage and quality
- [ ] Test review: Edge cases covered
- [ ] Security review: No vulnerabilities
- [ ] Documentation review: Code comments and JSDoc

**Questions for Reviewer:**
1. Is the hash-based approach sound?
2. Are all edge cases adequately handled?
3. Is the concurrency model safe?
4. Are there any security concerns?
5. Should we add any additional features?

**Approval Criteria:**
- All tests passing
- Coverage targets met
- No major security issues
- Performance benchmarks achieved
- Code follows project standards

---

## 📊 Design Decisions Log

### Decision 1: Hash Algorithm
**Options Considered:**
- MD5: Fast but deprecated, security concerns
- SHA-1: Deprecated, security concerns
- SHA-256: Standard, secure, reasonable performance

**Choice Made:** SHA-256

**Rationale:** 
- Security is priority zero in this project
- Performance is acceptable for our use case
- Industry standard with good library support
- Cryptographic security not strictly needed but doesn't hurt

**Confidence:** 9/10

---

### Decision 2: Storage Strategy
**Options Considered:**
- In-memory Map: Fast but no persistence
- SQLite DB: Persistent but overkill
- JSON file: Persistent but file I/O overhead

**Choice Made:** In-memory Map (with future persistence option)

**Rationale:**
- MVP doesn't need persistence across sessions
- In-memory is simplest and fastest
- Can add persistence later if needed
- Tracked files cleared on app restart is acceptable

**Confidence:** 8/10

---

### Decision 3: Pause Duration
**Options Considered:**
- Fixed 100ms: Simple but may be too short/long
- Dynamic based on file size: Complex but adaptive
- Event-based (wait for write complete): Most reliable

**Choice Made:** Event-based with 50ms safety buffer

**Rationale:**
- Wait for the actual write promise to complete
- Add small buffer for slow file systems
- More reliable than arbitrary timeout
- Handles variable file sizes automatically

**Confidence:** 7/10 (needs testing)

---

### Decision 4: Large File Handling
**Options Considered:**
- Hash full file: Accurate but slow for large files
- Hash first/last 1MB: Fast but less accurate
- Use file metadata: Very fast but inaccurate

**Choice Made:** Hybrid approach
- Files <1MB: Full hash
- Files >1MB: First 1MB + Last 1MB + file size

**Rationale:**
- Balances performance and accuracy
- Catches most changes (beginning/end modified)
- File size adds extra validation
- Good enough for code files (rarely >1MB)

**Confidence:** 8/10

---

## 🔍 Edge Cases & Solutions

### 1. Rapid Successive Changes (User Typing)
**Scenario:** User types quickly, 10+ changes in 1 second

**Solution:** 
- Debounce file watcher events (300ms)
- Only check hash on debounced final event
- Store sequence of hashes if needed

**Test:** Simulate rapid fs.writeFile() calls

---

### 2. Concurrent Edits (User + Tool)
**Scenario:** User edits file while tool is generating

**Solution:**
- Use promise-based locking
- Queue operations in order
- Last write wins (standard file system behavior)
- Log conflict if detected

**Test:** Concurrent fs.writeFile() from two sources

---

### 3. Slow File System (Network Drive)
**Scenario:** File write returns but file not visible for 500ms

**Solution:**
- Exponential backoff retry (50ms, 100ms, 200ms, 400ms)
- Max 4 retries = 750ms total
- Log warning if file still not visible
- Continue gracefully (don't block)

**Test:** Add artificial delay in test environment

---

### 4. File Deleted During Hash
**Scenario:** File deleted between size check and read

**Solution:**
- Catch ENOENT error
- Remove from tracking map
- Return null hash
- Don't crash or throw

**Test:** Delete file mid-operation

---

### 5. Permission Errors
**Scenario:** File is read-only or locked

**Solution:**
- Catch EACCES/EPERM errors
- Log warning with filepath
- Skip hash computation
- Return previous hash if available

**Test:** Create read-only file

---

### 6. Binary Files
**Scenario:** Hashing image or font file

**Solution:**
- Hash as binary buffer (not UTF-8 string)
- Use same SHA-256 algorithm
- No special handling needed

**Test:** Hash test.png file

---

### 7. Encoding Issues
**Scenario:** File uses non-UTF-8 encoding

**Solution:**
- Read as binary buffer first
- Detect encoding if possible
- Convert to UTF-8 for hashing
- Log encoding warnings

**Test:** Create file with Latin-1 encoding

---

### 8. Symbolic Links
**Scenario:** File is a symlink to another file

**Solution:**
- Follow symlinks by default (fs.readFile does this)
- Track by resolved path
- Document in code comments

**Test:** Create symlink and test

---

### 9. File Created/Deleted/Created
**Scenario:** Rapid lifecycle changes

**Solution:**
- Clear hash on delete event
- Treat new create as new file
- Don't assume same file

**Test:** Rapid create/delete cycle

---

### 10. Memory Leak from Deleted Files
**Scenario:** Tracking map grows indefinitely

**Solution:**
- Periodic cleanup (every 5 minutes)
- Remove entries for non-existent files
- TTL-based expiry (optional)
- Max map size limit (optional)

**Test:** Track 10000 files, delete all, verify cleanup

---

## 🎯 Success Metrics

### Code Quality
- [ ] TypeScript strict mode enabled
- [ ] No `any` types except where necessary
- [ ] All functions have JSDoc comments
- [ ] All public methods have example usage
- [ ] Consistent naming conventions
- [ ] Error messages are helpful

### Testing
- [ ] >90% line coverage
- [ ] >85% branch coverage
- [ ] 100% function coverage
- [ ] All edge cases tested
- [ ] All integration tests passing
- [ ] No flaky tests

### Performance
- [ ] Hash computation <5ms for 1MB files
- [ ] Memory usage <10MB for 1000 files
- [ ] No memory leaks detected
- [ ] No infinite loops in any scenario
- [ ] False positive rate <0.1%

### Documentation
- [ ] README.md updated with usage
- [ ] API documentation complete
- [ ] Examples provided
- [ ] Edge cases documented
- [ ] Limitations noted

---

## 🚀 Next Steps After Completion

Once Task 0.1 is complete and approved:

1. **Task 0.2:** Security Foundation
   - Input sanitization
   - API key encryption
   - File system restrictions

2. **Task 0.3:** Schema Validator (Level 1)
   - JSON schema validation
   - Component tree validation
   - Error messages

3. **Integration:** Wire FileChangeTracker into:
   - Manifest Manager (Phase 2)
   - Code Generator (Phase 3)
   - Preview System (Phase 4)

---

## 📝 Notes for Cline

### Coding Guidelines
- Use TypeScript strict mode
- Follow functional programming where possible
- Prefer immutability
- Use async/await over promises
- Add comprehensive error handling
- Log at debug level (not info/warn)
- Write self-documenting code
- Add comments for complex logic

### Testing Guidelines
- Use Vitest for unit tests
- Test both happy path and error cases
- Use describe/it structure
- Mock file system operations where needed
- Test edge cases explicitly
- Aim for high coverage

### When to Ask for Help
- Confidence <7 on any decision
- Unsure about edge case handling
- Performance issues
- Test failures that don't make sense
- Security concerns
- Architecture questions

### Review Request
- Request review after Milestone 4
- Provide summary of changes
- List any open questions
- Note any deviations from plan
- Include test coverage report

---

## 📎 Appendix

### Useful Commands
```bash
# Run unit tests
npm test FileChangeTracker

# Run with coverage
npm test -- --coverage

# Run integration tests
npm test:integration fileWatcher

# Watch mode during development
npm test:watch

# Type check
npm run type-check

# Lint
npm run lint
```

### Key Files
- `src/core/FileChangeTracker.ts` - Main implementation
- `tests/unit/FileChangeTracker.test.ts` - Unit tests
- `tests/integration/fileWatcher.test.ts` - Integration tests
- `docs/architecture/file-watcher-design.md` - Design doc (create this)

### Related Documentation
- MVP_ROADMAP.md - Phase 0.3
- ARCHITECTURE.md - Lines 342-389
- SECURITY_SPEC.md - File system section
- FILE_STRUCTURE_SPEC.md - Project layout

### Git Workflow
1. Create feature branch: `git checkout -b phase-0/task-0.1-file-watcher`
2. Commit frequently with clear messages
3. Reference task number in commits
4. Create PR when ready for review
5. Merge after approval

---

**Task Status:** 🟡 Ready to Start  
**Estimated Duration:** 3 days (24-32 hours)  
**Critical Path:** Yes (blocks all other development)  
**Risk Level:** Medium (new system, complex edge cases)  
**Priority:** P0 - Must complete before any other task

**Ready for Cline!** 🚀

---

**Last Updated:** 2025-11-18  
**Document Version:** 1.0  
**Prepared By:** Claude (Planning Assistant)  
**Approved By:** [Awaiting human approval]