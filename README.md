# Rise: Visual Low-Code Builder

> An AI-powered visual low-code development tool that generates clean, maintainable code while providing an intuitive visual interface for component architecture.

**Status**: 🏗️ Architecture Complete | **Version**: 0.1.0-alpha | **MVP Timeline**: 14-18 weeks

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

**Component Management**:
- Visual component tree editor
- Add/edit/delete components
- Component hierarchy (max 5 levels deep)
- Basic component properties (static values only)

**Code Generation**:
- Clean React code generation
- Vite project scaffolding
- Standard imports and exports
- Tailwind CSS integration

**Preview & Development**:
- Live preview with hot reload
- Component isolation view
- Full app preview
- Error boundary handling

**AI Assistance**:
- Component generation from prompts
- Basic template suggestions
- Cost tracking and budget limits

**Security**:
- API key encryption (OS keychain)
- Input sanitization
- File system restrictions
- Secure IPC communication

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

**Why this scope?**  
Focused MVP allows us to ship in 14-18 weeks instead of 6+ months, get real user feedback, and build a solid foundation for advanced features.

**Logic System (Level 2)**:
- Node-based visual logic editor (React Flow)
- Persistent reactive state (page-level, app-level)
- Event triggers and logic flows
- State nodes, API nodes, action nodes
- Visual debugging and execution traces
- See [LOGIC_SYSTEM.md](./docs/LOGIC_SYSTEM.md)

---

## 🏗️ Architecture Highlights

### Core Design Principles

1. **Schema-Driven Development**
   - Components defined in clean JSON manifest
   - Progressive levels: Simple → Enhanced → Advanced
   - Framework-agnostic core

2. **Security First**
   - Expression sandboxing (Level 2+)
   - Plugin isolation
   - API key encryption
   - Input validation everywhere

3. **Standard Output**
   - Generated projects are normal React/Vite apps
   - No vendor lock-in
   - Deploy anywhere (Vercel, Netlify, AWS)
   - Works with standard tooling

4. **AI as Copilot**
   - User always in control
   - AI suggests, user decides
   - Review and override any AI output
   - Cost tracking and budget controls

### Technology Stack

**Desktop App**:
- Electron 28+ (cross-platform)
- React 18+ with TypeScript
- Zustand (state management)
- Tailwind CSS (styling)

**Generated Projects**:
- Vite 5+ (blazing fast builds)
- React 18+ (hooks, functional components)
- Standard npm dependencies
- ESLint + Prettier

**AI Integration**:
- Anthropic Claude API (primary)
- OpenAI support (future)
- Cost tracking and limits
- Secure key management

---

## 📊 Project Status

### ✅ Phase 0: Foundation (COMPLETE)

All critical architecture documents complete:
- [x] ARCHITECTURE.md - System design
- [x] COMPONENT_SCHEMA.md - JSON format specification
- [x] SCHEMA_LEVELS.md - Progressive feature levels
- [x] SECURITY_SPEC.md - Security architecture
- [x] TESTING_STRATEGY.md - Test requirements
- [x] API_INTEGRATION.md - AI provider integration
- [x] ERROR_HANDLING.md - Error management
- [x] MVP_ROADMAP.md - Implementation plan
- [x] GLOSSARY.md - Terminology reference

### ⏳ Phase 1-5: Implementation (Weeks 3-18)

**Phase 1** (Weeks 3-5): Application Shell
- Electron app setup
- Basic UI layout
- Project management
- File system operations

**Phase 2** (Weeks 6-8): Component Management
- Component tree view
- Property editor
- Manifest CRUD
- AI component generation

**Phase 3** (Weeks 9-11): Code Generation & Preview
- React code generator (Level 1)
- File generation
- Preview system
- Hot reload

**Phase 4** (Weeks 12-14): Core Features Polish
- Tailwind integration
- Component library (shadcn/ui basic)
- AI improvements
- Bug fixing

**Phase 5** (Weeks 15-18): Testing & Release
- Comprehensive testing (80%+ coverage)
- Security audit
- Documentation
- First release

---

## 📚 Documentation

### 🏗️ Architecture & Design
- [**ARCHITECTURE.md**](./docs/ARCHITECTURE.md) - System design and technology stack
- [**SCHEMA_LEVELS.md**](./docs/SCHEMA_LEVELS.md) - Feature progression (Level 1→2→3)
- [**COMPONENT_SCHEMA.md**](./docs/COMPONENT_SCHEMA.md) - Complete JSON manifest specification
- [**FILE_STRUCTURE_SPEC.md**](./docs/FILE_STRUCTURE_SPEC.md) - Project layout and organization

### 🔐 Security & Quality
- [**SECURITY_SPEC.md**](./docs/SECURITY_SPEC.md) - Security architecture and threat model
- [**TESTING_STRATEGY.md**](./docs/TESTING_STRATEGY.md) - Testing requirements and coverage
- [**ERROR_HANDLING.md**](./docs/ERROR_HANDLING.md) - Error management strategy

### ⚡ Features & Implementation
- [**DATA_FLOW.md**](./docs/DATA_FLOW.md) - Props, state, and reactive variables
- [**EXPRESSION_SYSTEM.md**](./docs/EXPRESSION_SYSTEM.md) - Dynamic properties (Level 2)
- [**DEBUGGER_DESIGN.md**](./docs/DEBUGGER_DESIGN.md) - Visual debugging (Level 3)
- [**API_INTEGRATION.md**](./docs/API_INTEGRATION.md) - AI provider integration

### 🔧 Extensibility
- [**PLUGIN_SYSTEM.md**](./docs/PLUGIN_SYSTEM.md) - Framework adapter interface (Post-MVP)
- [**BIDIRECTIONAL_SYNC.md**](./docs/BIDIRECTIONAL_SYNC.md) - Code↔Manifest sync (Post-MVP)

### 🚀 Getting Started
- [**MVP_ROADMAP.md**](./docs/MVP_ROADMAP.md) - Development phases and timeline
- [**GETTING_STARTED.md**](./docs/GETTING_STARTED.md) - Setup and development workflow
- [**GLOSSARY.md**](./docs/GLOSSARY.md) - Terminology reference

**📚 [Complete Documentation Index](./DOCUMENTATION_INDEX.md)**

---

## 🎨 Example: Simple Button Component

### Schema Level 1 (MVP)

**Visual Editor**:
```
┌─────────────────────────────────┐
│ Button Component                │
├─────────────────────────────────┤
│ Properties:                     │
│ • label: "Click me"  [Static]   │
│ • disabled: false    [Static]   │
│                                 │
│ Styling:                        │
│ • Classes: btn, btn-primary     │
└─────────────────────────────────┘
```

**Generated Code**:
```jsx
import React from 'react';

/**
 * @rise:generated
 * Component: Button
 * Level: 1 (MVP)
 * Generated: 2025-10-25T10:00:00Z
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

**Key Points**:
- Clean, readable React code
- Standard props pattern
- No complex logic
- Deployable anywhere

---

## 🔐 Security Commitment

Security is **non-negotiable** and built into every layer:

### Expression Sandboxing (Level 2+)
```typescript
// User expressions run in isolated VM2 sandbox
const sandbox = new VM({
  timeout: 100, // ms
  sandbox: { props, state, global },
  eval: false,
  wasm: false
});
```

### API Key Protection
- Stored in OS keychain (keytar)
- Encrypted with AES-256
- Never logged or transmitted
- Cost tracking and budget limits

### Plugin Security (Post-MVP)
- Plugins run in isolated VM
- Limited file system access
- Resource limits (CPU, memory)
- Code signing (future)

### Input Validation
- All user input sanitized
- Path traversal prevention
- Component name validation
- Reserved word blocking

**See**: [SECURITY_SPEC.md](./docs/SECURITY_SPEC.md) for complete details

---

## 🎯 Target Users

### Primary: **Empowered Low-Code Developers**
- Want speed of visual tools with power of code
- Comfortable with JavaScript basics
- Need clean output for long-term projects
- Value understanding over black-box solutions

### Secondary: **Rapid Prototyping Developers**
- Need quick scaffolding for complex apps
- Want AI help with boilerplate
- Require production-ready output
- Looking for modern alternative to traditional low-code

### Stretch: **No-Code Graduates**
- Outgrowing traditional no-code platforms
- Ready to learn real development
- Want gradual learning curve
- Need AI mentorship

---

## 🚧 Current Limitations (MVP)

Be aware of these MVP constraints:

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
- Foundation & security
- Visual component editor
- React code generation
- AI-assisted component creation
- Preview with hot reload

### 🚀 Post-MVP Phase 1 (Weeks 19-30): Schema Level 2
- Expression system with sandboxing
- State management (local + global)
- Event handlers
- Computed properties
- Global functions

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

**Phase 0 (Current)**:
- Review architecture documents
- Provide feedback on design decisions
- Identify potential issues

**Phase 1-5 (Implementation)**:
- Report bugs and issues
- Suggest improvements
- Test features
- Improve documentation

**Post-MVP**:
- Build framework plugins
- Create component libraries
- Write tutorials and examples

### Documentation
Help improve docs:
- Fix typos and clarify explanations
- Add code examples
- Create tutorials
- Translate to other languages

### Community
- **GitHub Issues**: Bug reports and feature requests
- **Discussions**: Architecture questions and ideas
- **Discord**: Real-time chat (coming soon)

---

## 💰 Budget & Resources

### MVP Development Costs

**AI Development** (Cline/Claude):
- API usage: $800-1,600
- 70% of implementation work

**Human Developer**:
- Phase 0: 80 hours ($8,000)
- Phase 1-4: 180 hours ($18,000)
- Phase 5: 160 hours ($16,000)
- Total: 420 hours ($42,000)

**Tools**: ~$200 (mostly free tools)

**Total MVP**: $43,000-45,000

**ROI**: Foundation for Level 2/3, saves months vs. manual development

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

## 📧 Contact

- **Website**: rise-builder.com (coming soon)
- **Email**: hello@rise-builder.com
- **GitHub**: github.com/rise-builder
- **Twitter**: @rise_builder

---

## 🎉 Getting Started

Ready to build? Here's your path:

### For Developers Working on Rise

1. **Read Architecture Docs** (2-3 hours)
   - ARCHITECTURE.md - System design
   - SCHEMA_LEVELS.md - Feature levels
   - SECURITY_SPEC.md - Security requirements

2. **Set Up Environment** (30 min)
   - Clone repository
   - Install dependencies
   - Configure API keys

3. **Start Development** (Follow roadmap)
   - Phase 0: Review foundation (Week 0-2)
   - Phase 1: Build app shell (Week 3-5)
   - Phase 2-5: Implement features (Week 6-18)

### For Users (Post-MVP)

1. **Download Rise** (rise-builder.com/download)
2. **Follow Tutorial** (30 minutes)
3. **Create Your First App**
4. **Deploy Anywhere**

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

**Last Updated**: October 25, 2025  
**Status**: 🏗️ Phase 0 Complete, Ready for Implementation  
**Next Milestone**: Begin Phase 1 Development

---

**⭐ Star us on GitHub if you believe in empowering developers!**
