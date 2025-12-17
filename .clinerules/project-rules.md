# Catalyst Workflow Builder - Project Rules

## Security

### Sensitive Files
DO NOT read or modify:
- .env files
- API keys or secrets
- User's keychain data

### Critical Security
- Expression sandboxing must be secure
- Never bypass security for convenience
- All user code runs in isolated contexts
- Validate and sanitize all input

## Architecture

### Core Principles
1. Plugin-ready design
2. Manifest as source of truth
3. Workflow-based automation
4. Clean, maintainable Python code output

### Plugin Interface
- Use WorkflowPlugin interface
- Keep Python-specific code in PythonPlugin
- Design for extensibility
- Use semantic descriptions

### Node System
- Workflow nodes define operations
- Connections define data flow
- Triggers initiate workflows
- Control flow nodes manage execution

## Code Style

### TypeScript (Editor)
- Strict mode
- Define all interfaces
- Avoid `any`, use `unknown`
- Use type guards

### React (Editor UI)
- Functional components only
- Hooks for state
- Error boundaries
- PropTypes for generated code

### Python (Generated)
- Python 3.11+ features
- Type hints everywhere
- Async/await patterns
- FastAPI conventions

### Naming
- Components: PascalCase
- Utilities: camelCase
- Constants: UPPER_SNAKE_CASE
- Tests: Component.test.tsx

### Error Handling
- Try-catch for async
- Return Result types
- Never swallow errors
- Include context

### Performance
- Debounce changes (500ms)
- React.memo for expensive components
- Virtual scrolling > 50 items
- Profile before optimizing

## Testing

### Unit Tests For:
- Manifest validation
- Node type definitions
- Code generation
- Plugin interfaces

### Integration Tests For:
- Complete workflows
- File system ops
- IPC communication
- Python runtime

### Manual Testing For:
- UI/UX flows
- Accessibility
- Cross-platform

## Documentation

Update when changing:
- Relevant docs in `docs/`
- Code comments
- README.md
- Catalyst documentation

## Git Workflow

### Commits
Format: `[component] description`

Examples:
- `[manifest] Add workflow validation`
- `[codegen] Implement Python generator`
- `[ui] Add node canvas context menu`

### Branches
- `main`: Stable only
- `develop`: Integration
- `feature/*`: New features
- `fix/*`: Bug fixes
