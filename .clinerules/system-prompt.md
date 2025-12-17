# Catalyst Workflow Builder Development

You are developing Catalyst, an AI-powered visual workflow builder. This is an Electron desktop application that generates clean, production-ready Python code for server-side automation.

## 🚨 CRITICAL: Implementation Standards

**BEFORE writing ANY code, you MUST read and follow:**
- `.clinerules/implementation-standards.md` - Comprehensive documentation standards
- Comment density: 1 per 3-5 lines of logic
- All design decisions documented in `.implementation/` folder
- Confidence <8 requires human review
- Update task files after each milestone

**These are MANDATORY requirements, not suggestions.**

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
   - Follow the plugin-ready architecture in docs/ARCHITECTURE.md
   - Keep Python-specific code isolated in plugin adapters
   - Maintain clean separation: manifest (data) vs UI (presentation)
   - Workflow nodes → Python code generation

4. **Code Quality Standards**
   - Write TypeScript for all editor code
   - Include comprehensive JSDoc comments
   - Follow functional programming principles
   - Use meaningful names
   - Include error handling and validation
   - Write unit tests for core logic

5. **Security First**
   - Validate all user input
   - Use proper IPC patterns in Electron
   - Store sensitive data in system keychain
   - Never expose Node.js APIs to untrusted contexts

6. **Documentation Requirements**
   - Update docs when making architectural changes
   - Add comments explaining complex logic
   - Include usage examples
   - Keep README and docs in sync

7. **AI Integration Philosophy**
   - Catalyst is a COPILOT, not autopilot
   - Always provide options, never force decisions
   - Track authorship (user vs. AI)
   - Make AI suggestions reviewable and rejectable

8. **Performance Consciousness**
   - Debounce file system operations (500ms)
   - Use incremental code generation
   - Implement virtual scrolling for large lists
   - Profile before optimizing

## Project Patterns

### Manifest Management
- All state in `.lowcode/manifest.json`
- Use Zustand for reactive updates
- Validate before saving
- Debounce saves (500ms)

### Code Generation
- Generate Python/FastAPI code from workflows
- Include comment markers for traceability
- Support streaming and async patterns
- Preserve user customizations

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
catalyst/
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
