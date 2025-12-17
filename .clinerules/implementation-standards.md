# Catalyst Implementation Standards

**Philosophy: Quality over Speed. Documentation over Code. Understanding over Output.**

---

## Table of Contents

1. [Philosophy](#philosophy)
2. [Mandatory Code Documentation](#mandatory-code-documentation)
3. [Code Comment Standards](#code-comment-standards)
4. [Task Documentation Standards](#task-documentation-standards)
5. [Confidence Rating System](#confidence-rating-system)
6. [Performance Benchmarking](#performance-benchmarking)
7. [Testing Documentation](#testing-documentation)
8. [Human Review Process](#human-review-process)
9. [Pre-Completion Checklist](#pre-completion-checklist)
10. [Enforcement Rules](#enforcement-rules)

---

## Philosophy

Catalyst is a complex system that will evolve over years. Every line of code must be:

1. **Self-explanatory** through comments
2. **Well-documented** in external docs
3. **Tracked** with decision rationale
4. **Reviewable** by humans who weren't present during creation

**Core Principle**: Future developers (including your future self) should be able to understand WHY every decision was made, not just WHAT was implemented.

---

## Mandatory Code Documentation

### File-Level Documentation

**EVERY source file MUST start with this header:**

```typescript
/**
 * @file [FileName].ts
 * @description [Clear, concise description of file's purpose and role in system]
 *              [Can span multiple lines to explain context]
 * 
 * @architecture Phase [N], Task [N.N] - [Task Name]
 * @created [YYYY-MM-DD]
 * @author AI (Cline) + Human Review
 * @confidence [X/10] - [Brief reason for confidence level]
 * 
 * @see [docs/relevant-doc.md] - [Specific section]
 * @see [.implementation/phase-X/task-X.Y.md] - Implementation details
 * 
 * @security-critical [true/false]
 * @performance-critical [true/false] - [Why this matters]
 */
```

**Example:**

```typescript
/**
 * @file FileChangeTracker.ts
 * @description Hash-based file change detection to prevent infinite loops between
 *              code generation and file watching. Critical for system stability.
 * 
 * @architecture Phase 0, Task 0.1 - Foundation
 * @created 2025-10-25
 * @author AI (Cline) + Human Review
 * @confidence 9/10 - Extensively tested, edge cases handled
 * 
 * @see docs/MVP_ROADMAP.md - Phase 0.3 File Watcher Algorithm
 * @see .implementation/phase-0-foundation/task-0.1-file-watcher.md
 * 
 * @security-critical false
 * @performance-critical true - Used on every file operation
 */
```

---

### Class-Level Documentation

**EVERY class MUST include comprehensive documentation:**

```typescript
/**
 * [One-line description of what the class does]
 * 
 * PROBLEM SOLVED:
 * [Detailed explanation of the problem this class addresses]
 * [Use bullet points or numbered steps if it's a sequence]
 * 
 * SOLUTION:
 * [Explain the approach taken to solve the problem]
 * [Include key design decisions]
 * 
 * USAGE EXAMPLE:
 * ```typescript
 * // Show realistic usage
 * const instance = new ClassName(params);
 * instance.method();
 * ```
 * 
 * DESIGN DECISIONS:
 * - [Decision 1]: [Rationale]
 * - [Decision 2]: [Rationale]
 * 
 * EDGE CASES HANDLED:
 * - [Edge case 1]: [How it's handled]
 * - [Edge case 2]: [How it's handled]
 * 
 * PERFORMANCE:
 * - [Metric 1]: [Target value and actual]
 * - [Metric 2]: [Target value and actual]
 * 
 * TESTING:
 * - Unit tests: [path/to/test.ts] ([X%] coverage)
 * - Integration: [path/to/test.ts]
 * - Manual: [What was manually tested]
 * 
 * FUTURE IMPROVEMENTS:
 * - [Improvement 1] - [Why not implemented now]
 * 
 * @class [ClassName]
 * @implements {[InterfaceName]} (if applicable)
 */
```

---

### Method-Level Documentation

**EVERY public method MUST include:**

```typescript
/**
 * [Clear description of what the method does]
 * 
 * [Additional context if the purpose isn't obvious from the description]
 * 
 * TIMING/SEQUENCING: (if critical)
 * [Explain when this should be called relative to other methods]
 * 
 * @param [paramName] - [Description including type info, constraints, expected values]
 * @param [paramName] - [Description]
 * 
 * @returns [Description of return value, including possible values/states]
 * 
 * @throws {[ErrorType]} [When and why this error is thrown]
 * @throws {[ErrorType]} [Another error condition]
 * 
 * @example
 * ```typescript
 * // Realistic usage example
 * const result = await method(param1, param2);
 * ```
 * 
 * @performance [O notation if relevant, actual measured time if critical]
 * @sideEffects [List any side effects - state changes, external calls, etc.]
 * @async (if applicable)
 */
```

**Example:**

```typescript
/**
 * Stores the hash of content we're about to generate and pauses watching for this file.
 * Must be called BEFORE writing the file to prevent detecting our own change.
 * 
 * TIMING CRITICAL: Call immediately before fs.writeFile()
 * 
 * @param filepath - Absolute path to file being generated (must be within project)
 * @param content - Exact content that will be written (must match writeFile content)
 * 
 * @returns Promise that resolves when hash is stored and file is paused
 * 
 * @throws {InvalidPathError} If filepath is outside project directory
 * @throws {HashComputationError} If content cannot be hashed
 * 
 * @example
 * ```typescript
 * const code = generateReactComponent(schema);
 * await tracker.onBeforeGenerate('/project/src/Button.tsx', code);
 * await fs.writeFile('/project/src/Button.tsx', code);
 * await tracker.onAfterGenerate('/project/src/Button.tsx');
 * ```
 * 
 * @performance O(n) where n = content length, typically <5ms for files <1MB
 * @sideEffects Modifies internal pause state and hash cache
 * @async
 */
```

---

## Code Comment Standards

### Target Comment Density

**Goal: 1 comment per 3-5 lines of logic**

### Inline Code Comments

**EVERY non-obvious line needs explanation:**

```typescript
// Store hash of what we're about to write
// This becomes our "expected" hash for comparison later
const hash = this.computeHash(content);
this.generationHashes.set(filepath, hash);

// Pause watching this specific file during generation
// Prevents detecting our own fs.writeFile as a user edit
this.pausedPaths.add(filepath);

// Set timeout to auto-resume if onAfterGenerate never called
// Prevents orphaned pauses that would ignore real user edits
const timeoutId = setTimeout(() => {
  this.pausedPaths.delete(filepath);
  console.warn(`Auto-resumed watching ${filepath} after timeout`);
}, 5000);

this.timeouts.set(filepath, timeoutId);
```

### Comment Quality Standards

**✅ GOOD Comments:**
- Explain WHY, not just WHAT
- Provide context for complex logic
- Explain non-obvious behavior
- Document edge cases
- Clarify timing/sequencing requirements

**❌ BAD Comments:**
- Redundant with code: `// increment i`
- Outdated or incorrect
- Too vague: `// handle the data`
- Missing when needed

### Complex Logic Documentation

**For algorithms, include ASCII diagrams:**

```typescript
/**
 * Determines if a file change was made by the user vs. the tool.
 * 
 * DECISION FLOW:
 * 
 *   File Changed Event
 *          |
 *          v
 *   Is file paused? ──YES──> Ignore (tool is writing)
 *          |
 *          NO
 *          v
 *   Compute actual hash
 *          |
 *          v
 *   Expected hash exists? ──NO──> Process (first time seeing file)
 *          |
 *          YES
 *          v
 *   Hashes match? ──YES──> Ignore (tool wrote exactly what we expected)
 *          |
 *          NO
 *          v
 *   Process as user edit
 * 
 * @param filepath - Path to changed file
 * @param content - Current file content
 * @returns true if user made the edit, false if tool made it
 */
```

---

## Task Documentation Standards

### Location

All task documentation goes in `.implementation/phase-X-name/task-X.Y-name.md`

### When to Update

Update task file after each milestone:
- Design decisions made
- Implementation completed
- Tests written
- Issues encountered and resolved
- Human review completed

### Required Sections

1. **Task Overview** - Objective, success criteria, references
2. **Milestones** - Each significant step with confidence rating
3. **Design Decisions** - Options considered, choice made, rationale
4. **Implementation Notes** - Challenges, solutions, code locations
5. **Test Results** - Unit, integration, manual testing outcomes
6. **Human Review** - Feedback received and actions taken
7. **Lessons Learned** - What worked, what didn't, reusable patterns

### Milestone Template

Use `.implementation/templates/milestone-template.md` for structure.

---

## Confidence Rating System

### Scale (1-10)

- **10**: Perfect, no possible improvements, battle-tested
- **9**: Excellent, thoroughly tested, minor edge cases may exist
- **8**: Good, works well, may need refinement
- **7**: Solid, functional, some concerns
- **6**: Acceptable, works but needs improvement
- **5**: Functional but concerning, needs review
- **4**: Problematic, requires attention
- **3**: Serious issues, needs major work
- **2**: Barely working, major problems
- **1**: Broken, doesn't work

### When Confidence <8

**STOP and get human review before proceeding.**

This is not optional. Low confidence indicates:
- Uncertainty about approach
- Potential issues not fully resolved
- Need for expert input
- Risk to project stability

### Providing Confidence Ratings

Always include reasoning:

**✅ GOOD:**
```
Confidence: 8/10 - Algorithm proven in tests, but haven't 
tested on very slow network drives yet
```

**❌ BAD:**
```
Confidence: 8/10
```

---

## Performance Benchmarking

### When to Benchmark

Benchmark when code is **performance-critical**:
- Called frequently (>100 times/second)
- Handles large data (>1MB)
- On critical path (affects user experience)
- Part of system bottleneck

### How to Benchmark

1. Define target metrics
2. Create realistic test scenarios
3. Run multiple iterations (>100)
4. Record average, min, max
5. Document test environment

### Benchmark Format

```typescript
/**
 * Performance Benchmarks
 * 
 * Environment: MacBook Pro M1, 16GB RAM, Node 18.x
 * 
 * | File Size | Hash Time (avg) | Memory | Iterations |
 * |-----------|----------------|--------|------------|
 * | 10 KB     | 0.1ms          | 2 KB   | 1000       |
 * | 100 KB    | 0.5ms          | 8 KB   | 1000       |
 * | 1 MB      | 2.5ms          | 45 KB  | 500        |
 * | 10 MB     | 18ms           | 350 KB | 50         |
 * 
 * Target: <5ms for files <1MB
 * Result: ✅ Target met
 */
```

---

## Testing Documentation

### Test Names as Stories

**✅ GOOD:**
```typescript
describe('FileChangeTracker', () => {
  it('should ignore file changes during pause period to prevent detecting tool edits', () => {
    // test...
  });
  
  it('should detect user edits after tool generation completes', () => {
    // test...
  });
  
  it('should handle concurrent edits on different files without race conditions', () => {
    // test...
  });
});
```

**❌ BAD:**
```typescript
describe('FileChangeTracker', () => {
  it('test pausedPaths', () => {
    // test...
  });
  
  it('test user edit', () => {
    // test...
  });
});
```

### Test Documentation in Task Files

Always include:
- Test count and pass/fail
- Coverage percentage
- Notable failures and how they were fixed
- Manual test scenarios and results

---

## Human Review Process

### When Human Review is Required

**MANDATORY** review when:
- Confidence rating <8
- Security-critical code
- Architecture changes
- Performance-critical code
- Complex algorithms
- Edge case handling

### Documenting Review

**Template:**

```markdown
#### Human Review

**Reviewer:** [Name]
**Date:** [YYYY-MM-DD]
**Duration:** [X minutes]

**Feedback Received:**

**Positive:**
- ✅ Code quality excellent
- ✅ Edge cases well handled
- ✅ Test coverage comprehensive

**Concerns:**
1. ⚠️ Consider adding telemetry
   - **Action Taken:** Added TODO, defer to Phase 4
   - **Confidence Impact:** None (not critical)

2. ⚠️ What about concurrent tool operations?
   - **Action Taken:** Documented assumption (single-instance)
   - **Confidence Impact:** None (architectural constraint)

**Sign-off:**
- ✅ Code approved for merge
- ✅ Architecture approved
- ✅ Tests sufficient

**Final Confidence:** 10/10
```

---

## Pre-Completion Checklist

Before using `attempt_completion`, verify:

### Documentation
- [ ] Every file has header documentation
- [ ] Every class has comprehensive documentation
- [ ] Every public method documented
- [ ] Code-to-comment ratio is 1:3-5
- [ ] Complex logic has diagrams where helpful

### Task Tracking
- [ ] All milestones documented in task file
- [ ] All design decisions recorded
- [ ] All challenges and solutions documented
- [ ] Confidence ratings provided with reasoning
- [ ] Files created/modified listed

### Testing
- [ ] Tests written and passing
- [ ] Test names are descriptive stories
- [ ] Coverage meets targets
- [ ] Performance benchmarked (if applicable)

### Review
- [ ] Human review completed (if confidence <8)
- [ ] Feedback documented and addressed
- [ ] Lessons learned section written

### Completion
- [ ] Success criteria met
- [ ] Next steps identified
- [ ] Final summary written

**If ANY checkbox is unchecked, DO NOT use attempt_completion.**

---

## Enforcement Rules

### Rule 1: No Code Without Comments

Target: 1 comment per 3-5 lines of logic.

Violation: Code review rejection.

### Rule 2: Every File Has Header

No exceptions. Every source file gets full header documentation.

### Rule 3: Explain "Why" Not Just "What"

Comments that just repeat code are useless. Explain rationale.

### Rule 4: Document All Decisions

Every design decision must be in task file with options, choice, rationale.

### Rule 5: Update Task Files After Milestones

Not daily, but after each significant milestone. No exceptions.

### Rule 6: Confidence <8 = Human Review

This is non-negotiable. Get review before proceeding.

### Rule 7: Performance-Critical = Benchmark

Must have numbers, not guesses.

### Rule 8: Tests Tell Stories

Test names must be clear, descriptive sentences.

### Rule 9: All Review Feedback Documented

No "looks good" without details. Document specific feedback.

### Rule 10: Slow Down and Think

Before coding:
1. State understanding
2. State approach
3. Identify issues
4. Rate confidence
5. If <8, ask questions

**Understanding > Speed**  
**Documentation > Features**  
**Quality > Quantity**

---

## Example: Good vs Bad

### Bad Implementation

```typescript
// file.ts
class FileTracker {
  private hashes = new Map();
  
  check(path, content) {
    const h = hash(content);
    return h !== this.hashes.get(path);
  }
}
```

**Problems:**
- No file header
- No class documentation
- No method documentation
- No comments in code
- No explanation of purpose
- No task tracking

### Good Implementation

```typescript
/**
 * @file FileChangeTracker.ts
 * @description Hash-based file change detection to prevent infinite loops
 * @architecture Phase 0, Task 0.1
 * @created 2025-10-25
 * @confidence 9/10 - Tested extensively
 * @see .implementation/phase-0-foundation/task-0.1-file-watcher.md
 * @performance-critical true
 */

/**
 * Tracks file changes using content hashing to distinguish tool edits from user edits.
 * 
 * PROBLEM SOLVED:
 * - Tool generates code, file watcher detects it, triggers regeneration = infinite loop
 * 
 * SOLUTION:
 * - Store hash of generated content before writing
 * - Compare actual hash with expected on file change
 * - If match = tool edit (ignore), if differ = user edit (process)
 * 
 * USAGE EXAMPLE:
 * ```typescript
 * const tracker = new FileChangeTracker();
 * await tracker.onBeforeGenerate('Button.tsx', code);
 * await fs.writeFile('Button.tsx', code);
 * await tracker.onAfterGenerate('Button.tsx');
 * ```
 * 
 * @class FileChangeTracker
 */
class FileChangeTracker {
  // Maps file paths to expected content hashes
  // Used to detect if file content changed from what we generated
  private generationHashes = new Map<string, string>();
  
  /**
   * Checks if a file change was made by user (not tool).
   * 
   * @param filepath - Path to changed file
   * @param content - Current file content
   * @returns true if user edit, false if tool edit
   * 
   * @example
   * const isUserEdit = tracker.isUserEdit('/path/Button.tsx', content);
   * if (isUserEdit) {
   *   // Process user's changes
   * }
   */
  isUserEdit(filepath: string, content: string): boolean {
    // Compute hash of current content
    const actualHash = this.computeHash(content);
    
    // Get the hash we expected (from generation)
    const expectedHash = this.generationHashes.get(filepath);
    
    // If hashes match, tool wrote this (ignore)
    // If hashes differ, user modified it (process)
    return actualHash !== expectedHash;
  }
  
  // ... more methods with similar documentation
}
```

---

## Summary

These standards exist to create sustainable, maintainable code that:
1. Can be understood by anyone
2. Preserves knowledge over time  
3. Enables confident changes
4. Reduces bugs through clarity
5. Facilitates collaboration

**Slow and steady wins. Quality over speed. Always.**

---

**Last Updated:** 2025-10-25  
**Status:** ✅ Active - Must be followed for all code
