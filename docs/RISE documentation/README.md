# Rise: Visual Low-Code Builder

> An AI-powered visual low-code development tool that generates clean, maintainable code while providing an intuitive visual interface for component architecture.

**Status**: 🔄 Phase 3 In Progress | **Version**: 0.1.0-alpha | **MVP Timeline**: 14-18 weeks

---

## 📊 Development Progress

| Phase | Status | Completed |
|-------|--------|-----------|
| **Phase 0**: Foundation | ✅ Complete | Nov 19, 2025 |
| **Phase 1**: Application Shell | ✅ Complete | Nov 24, 2025 |
| **Phase 2**: Component Management | ✅ Complete | Nov 27, 2025 |
| **Phase 3**: Code Generation & Preview | 🔄 In Progress | ~95% done |
| **Phase 4**: Testing & Polish | 🔵 Not Started | - |
| **Phase 5**: Release Prep | 🔵 Not Started | - |

**Current Task**: Task 3.3 - Live Preview Integration (connecting code generation to preview pane)

---

## 🎯 Vision

Rise bridges the gap between AI-assisted coding (like Replit/v0) and visual low-code builders (like Noodl/Bubble). It combines:

- **🎯 User Empowerment**: Write real JavaScript in expressions and global functions
- **🤖 AI as Copilot**: Intelligent assistance without taking over - review, suggest, generate
- **🔓 Zero Lock-in**: Clean code output that developers can take anywhere
- **🔮 Future-Proof**: Plugin system supports any framework or library (React first, others later)

---

## 🚀 What's in MVP (Schema Level 1)

The MVP focuses on **proven core value**: Visual editor → clean code → working app.

### ✅ Included in MVP

**Component Management** *(Implemented ✅)*:
- Visual component tree editor
- Add/edit/delete components
- Component hierarchy (max 5 levels deep)
- Basic component properties (static values only)

**Code Generation** *(Implemented ✅)*:
- Clean React code generation (ReactCodeGenerator)
- Vite project scaffolding
- Standard imports and exports
- Tailwind CSS integration
- @lowcode comment markers for tracking

**Preview & Development** *(In Progress 🔄)*:
- Live preview with hot reload (ViteServerManager ready)
- Component isolation view
- Full app preview
- Error boundary handling

**AI Assistance** *(Implemented ✅)*:
- Component generation from natural language prompts
- Claude API integration (Sonnet model)
- Cost estimation before API calls
- Budget tracking and limits
- Level 1 schema enforcement on generated components

**Security** *(Implemented ✅)*:
- API key encryption (OS keychain via keytar)
- Input sanitization
- File system restrictions
- Secure IPC communication
- 90-day key rotation warnings

### ❌ NOT in MVP (Coming in Level 2 & 3)

**Deferred to Post-MVP** (see [SCHEMA_LEVELS.md](./docs/SCHEMA_LEVELS.md)):
- ❌ Expressions & computed properties (Level 2)
- ❌ Logic system with node-based editor (Level 2)
- ❌ Persistent reactive state management (Level 2)
- ❌ Event handlers with visual logic flows (Level 2)
- ❌ Data connections / Database (Level 3)
- ❌ Real-time features (Level 3)
- ❌ AI code review (Level 3)
- ❌ Step debugger (Level 3)
- ❌ Bidirectional sync (Post-MVP)
- ❌ TypeScript support (Post-MVP)
- ❌ Vue/Svelte plugins (Post-MVP)
- ❌ Hosted backend system with Parse Server (Post-MVP) - See [HOSTED_BACKEND.md](./docs/HOSTED_BACKEND.md)

**Why this scope?**  
Focused MVP allows us to ship in 14-18 weeks instead of 6+ months, get real user feedback, and build a solid foundation for advanced features.

---

## 🏗️ Architecture Highlights

### Core Design Principles

1. **Schema-Driven Development**
   - Components defined in clean JSON manifest
   - Progressive levels: Simple → Enhanced → Advanced
   - Framework-agnostic core

2. **Plugin-Ready Architecture**
   - React plugin ships with MVP
   - Vue/Svelte/Angular via future plugins
   - UI component libraries (MUI, shadcn) via plugins

3. **AI as Copilot**
   - Generate components from natural language
   - Cost-aware API usage with budget limits
   - User always has final control

### What's Been Built

**Phase 0 - Foundation**:
- FileChangeTracker with SHA-256 hash detection (prevents infinite loops)
- SchemaValidator enforcing Level 1 boundaries
- APIKeyManager with keytar integration
- APIUsageTracker for cost management
- Testing infrastructure with Vitest

**Phase 1 - Application Shell**:
- Electron + React + TypeScript setup
- Three-panel UI (Navigator, Editor, Properties)
- Project creation and management
- ViteServerManager for preview server
- Secure IPC communication

**Phase 2 - Component Management**:
- ComponentTree with drag-and-drop
- PropertiesPanel with type-specific editors
- Manifest persistence with auto-save
- AI component generation (Claude API)
- Settings dialog with API key management

**Phase 3 - Code Generation** *(Current)*:
- ReactCodeGenerator with modular builders
- FileManager with hash-based change tracking
- GenerationService for auto-regeneration
- Live preview integration (in progress)

---

## 📁 Documentation

### Quick Start
- [**README.md**](./README.md) - This file
- [**GETTING_STARTED.md**](./docs/GETTING_STARTED.md) - Setup and first steps

### Architecture & Design
- [**ARCHITECTURE.md**](./docs/ARCHITECTURE.md) - System design and technology stack
- [**SCHEMA_LEVELS.md**](./docs/SCHEMA_LEVELS.md) - Feature progression (Level 1→2→3)
- [**COMPONENT_SCHEMA.md**](./docs/COMPONENT_SCHEMA.md) - Complete JSON manifest specification
- [**FILE_STRUCTURE_SPEC.md**](./docs/FILE_STRUCTURE_SPEC.md) - Project layout and organization

### Security & Quality
- [**SECURITY_SPEC.md**](./docs/SECURITY_SPEC.md) - Security architecture and threat model
- [**TESTING_STRATEGY.md**](./docs/TESTING_STRATEGY.md) - Testing requirements and coverage
- [**ERROR_HANDLING.md**](./docs/ERROR_HANDLING.md) - Error management strategy

### Features & Implementation
- [**DATA_FLOW.md**](./docs/DATA_FLOW.md) - Props, state, and reactive variables
- [**EXPRESSION_SYSTEM.md**](./docs/EXPRESSION_SYSTEM.md) - Dynamic properties (Level 2)
- [**DEBUGGER_DESIGN.md**](./docs/DEBUGGER_DESIGN.md) - Visual debugging (Level 3)
- [**HOSTED_BACKEND.md**](./docs/HOSTED_BACKEND.md) - Optional Parse Server backend (Future)

### Extensibility
- [**PLUGIN_SYSTEM.md**](./docs/PLUGIN_SYSTEM.md) - Framework adapter interface (Post-MVP)
- [**BIDIRECTIONAL_SYNC.md**](./docs/BIDIRECTIONAL_SYNC.md) - Code↔Manifest sync (Post-MVP)

### Development
- [**MVP_ROADMAP.md**](./docs/MVP_ROADMAP.md) - Development phases and timeline
- [**CLINE_IMPLEMENTATION_PLAN.md**](./CLINE_IMPLEMENTATION_PLAN.md) - AI-assisted development guide

**📚 [Complete Documentation Index](./DOCUMENTATION_INDEX.md)**

---

## 🎨 Example: Simple Button Component

### What You Define (manifest.json)

```json
{
  "comp_button_001": {
    "id": "comp_button_001",
    "displayName": "Button",
    "type": "PrimitiveComponent",
    "element": "button",
    "properties": {
      "label": { "type": "static", "value": "Click me", "dataType": "string" },
      "disabled": { "type": "static", "value": false, "dataType": "boolean" }
    },
    "styling": {
      "baseClasses": ["btn", "btn-primary", "px-4", "py-2"]
    },
    "children": []
  }
}
```

### What Rise Generates (Button.jsx)

```jsx
import React from 'react';

/**
 * @lowcode:generated
 * @lowcode:component-id: comp_button_001
 * @lowcode:level: 1
 * @lowcode:last-generated: 2025-11-27T12:00:00.000Z
 * DO NOT EDIT: This file is auto-generated. Changes will be overwritten.
 */
export function Button({ label = 'Click me', disabled = false }) {
  return (
    <button className="btn btn-primary px-4 py-2" disabled={disabled}>
      {label}
    </button>
  );
}

export default Button;
```

---

## ⚠️ Current MVP Limitations

1. **React Only**: Vue, Svelte support in plugin system (post-MVP)
2. **Static Properties**: No expressions until Level 2
3. **No State Management**: Coming in Level 2
4. **No Event Handlers**: Coming in Level 2
5. **No Database Integration**: Coming in Level 3
6. **JavaScript Only**: TypeScript support post-MVP
7. **Manual Code Edits**: Bidirectional sync post-MVP

**Why?** Focused scope allows us to ship quality MVP in 14-18 weeks vs. 6+ months for everything.

---

## 📈 Roadmap

### 🎯 MVP (Weeks 0-18): Schema Level 1
- ✅ Foundation & security
- ✅ Visual component editor
- ✅ React code generation
- ✅ AI-assisted component creation
- 🔄 Preview with hot reload (in progress)

### 🚀 Post-MVP Phase 1 (Weeks 19-30): Schema Level 2
- Expression system with sandboxing
- State management (local + global)
- Event handlers
- Computed properties
- Global functions
- Node-based logic system (React Flow)

### 🌟 Post-MVP Phase 2 (Weeks 31-42): Enhanced Features
- TypeScript support
- Component library plugins (MUI, Ant Design)
- Advanced styling system
- Performance optimization

### 🔮 Future (Weeks 43+): Schema Level 3
- Plugin system (Vue, Svelte, Angular)
- Bidirectional sync
- Step debugger
- Real-time data connections
- AI code review
- Hosted backend system (Parse Server)
- Database integration

**See**: [MVP_ROADMAP.md](./docs/MVP_ROADMAP.md) for detailed timeline

---

## 🤝 Contributing

### Development
Rise is in active development. Ways to contribute:

**Current Phase (Phase 3)**:
- Test code generation output
- Report bugs and issues
- Suggest improvements
- Review generated code quality

**Post-MVP**:
- Build framework plugins
- Create component libraries
- Write tutorials and examples

### Documentation
Help improve docs:
- Fix typos and clarify explanations
- Add code examples
- Create tutorials

---

## 💰 Budget & Resources

### MVP Development Costs

**AI Development** (Cline/Claude):
- API usage: $800-1,600
- 70% of implementation work

**Human Developer**:
- Phase 0: 80 hours
- Phase 1-4: 180 hours
- Phase 5: 160 hours
- Total: ~420 hours

**Tools**: ~$200 (mostly free tools)

---

## 📜 License

MIT License - see [LICENSE](./LICENSE) for details

---

## 🙏 Acknowledgments

**Built with**:
- ⚛️ React - UI library
- ⚡ Vite - Build tool
- 🔌 Electron - Desktop framework
- 🤖 Claude AI - Development assistance
- 💙 Open Source Community

**Inspired by**:
- Bubble.io - Visual development
- Noodl - Node-based UI
- Webflow - Design tools
- Replit - AI coding
- v0 - AI component generation

---

## 🌟 The Rise Promise

1. **You Own Your Code**: Generated code is clean, standard, and yours forever
2. **No Vendor Lock-in**: Deploy anywhere, use any tools
3. **AI Assists, You Decide**: Full control with intelligent help
4. **Privacy First**: Your data stays on your machine
5. **Open & Extensible**: Plugin system for any framework

---

**Rise: Where AI meets empowerment. Where visual meets code. Where lock-in meets freedom.**

*Building the future of low-code development - no compromises, maximum empowerment, unlimited extensibility.*

---

**Last Updated**: November 28, 2025  
**Status**: 🔄 Phase 3 In Progress  
**Next Milestone**: Complete Task 3.3 (Live Preview Integration)

---

**⭐ Star us on GitHub if you believe in empowering developers!**