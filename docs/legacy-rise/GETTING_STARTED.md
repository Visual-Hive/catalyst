# Getting Started

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js**: v18.0.0 or higher ([Download](https://nodejs.org/))
- **npm**: v9.0.0 or higher (comes with Node.js)
- **Git**: Latest version ([Download](https://git-scm.com/))
- **Code Editor**: VSCode recommended ([Download](https://code.visualstudio.com/))

### Recommended VSCode Extensions

- ESLint
- Prettier
- Tailwind CSS IntelliSense
- EditorConfig
- GitLens

---

## Installation

### Clone the Repository

```bash
git clone https://github.com/your-org/lowcode-visual-builder.git
cd lowcode-visual-builder
```

### Install Dependencies

```bash
npm install
```

This will install:
- Electron and Electron Forge
- React and React DOM
- Development tools (ESLint, Prettier, etc.)
- UI libraries (React Flow, Monaco Editor, etc.)

---

## Development

### Start the App

```bash
npm start
```

This will:
1. Start the Electron app in development mode
2. Enable hot reload for renderer process
3. Open DevTools automatically

**Expected Output**:
```
✓ Electron app started
✓ React dev server running
→ Opening window...
```

### Development Scripts

```bash
# Start development mode
npm start

# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Lint code
npm run lint

# Format code
npm run format

# Type check (if using TypeScript)
npm run type-check
```

---

## Project Structure

```
lowcode-visual-builder/
├── src/
│   ├── main/              # Electron main process
│   │   ├── index.js       # Main entry point
│   │   ├── ipc.js         # IPC handlers
│   │   └── fileSystem.js  # File operations
│   │
│   ├── renderer/          # Electron renderer process (React)
│   │   ├── App.jsx        # Root component
│   │   ├── components/    # UI components
│   │   ├── hooks/         # Custom React hooks
│   │   ├── store/         # State management (Zustand)
│   │   └── utils/         # Helper functions
│   │
│   ├── engine/            # Core logic
│   │   ├── manifest/      # Manifest management
│   │   ├── generator/     # Code generation
│   │   ├── parser/        # Code parsing
│   │   └── plugins/       # Framework plugins
│   │
│   └── shared/            # Shared types and constants
│
├── docs/                  # Documentation
├── tests/                 # Test files
├── templates/             # Project templates
└── public/                # Static assets
```

---

## Creating Your First Project

### 1. Launch the App

```bash
npm start
```

### 2. Create New Project

1. Click **"New Project"** button
2. Fill in project details:
   - **Name**: `my-first-app`
   - **Framework**: React (only option in MVP)
   - **Location**: Choose directory
3. Click **"Create"**

### 3. Add Components

1. Right-click in **Component Tree** panel
2. Select **"Add Component"**
3. Choose component type (e.g., `Button`)
4. Configure properties in **Properties Panel**

### 4. Preview

1. Click **"Preview"** tab in center panel
2. See your component rendered
3. Changes update automatically

### 5. View Generated Code

1. Click **"Code"** tab
2. See generated React code
3. Code is also saved in `my-first-app/src/components/`

---

## Using AI to Generate Components

### Basic AI Usage

1. Click **"AI Assistant"** button (or press `Ctrl+K`)
2. Describe component:
   ```
   Create a UserCard component that displays 
   a user's name, email, and avatar image
   ```
3. Review generated component in tree
4. Adjust properties as needed

### AI Best Practices

✅ **DO**:
- Be specific about what you want
- Mention props and state explicitly
- Describe layout (e.g., "in a card layout")
- Request styling (e.g., "using Tailwind classes")

❌ **DON'T**:
- Ask for entire applications at once
- Use vague descriptions
- Expect AI to understand complex business logic
- Assume AI knows your design system

### Example Prompts

**Good**:
```
Create a SearchBar component with:
- An input field for search query
- A search button
- OnSearch event that passes the query
- Use Tailwind for styling
```

**Better**:
```
Create a SearchBar component:

Props:
- placeholder (string)
- onSearch (function)

State:
- query (string)

UI:
- Input field (Tailwind rounded, border-gray-300)
- Search button (blue background, white text)
- Button triggers onSearch with current query
```

---

## Configuration

### Project Settings

Located in `.lowcode/config.json` (in generated projects):

```json
{
  "framework": "react",
  "typescript": false,
  "formatting": {
    "style": "prettier",
    "config": {
      "semi": true,
      "singleQuote": true,
      "tabWidth": 2
    }
  }
}
```

### App Settings

In the visual builder app, go to **Settings** (gear icon):

- **Theme**: Light/Dark mode
- **AI Provider**: Claude (default), OpenAI (future)
- **Auto-save**: Enable/disable
- **Preview Mode**: Isolation/Full app

---

## Keyboard Shortcuts

### Global

| Shortcut | Action |
|----------|--------|
| `Ctrl+N` | New project |
| `Ctrl+O` | Open project |
| `Ctrl+S` | Save |
| `Ctrl+Z` | Undo |
| `Ctrl+Shift+Z` | Redo |
| `Ctrl+K` | AI Assistant |
| `Ctrl+P` | Preview toggle |
| `F5` | Refresh preview |

### Component Tree

| Shortcut | Action |
|----------|--------|
| `Ctrl+A` | Add component |
| `Delete` | Delete selected |
| `Ctrl+D` | Duplicate |
| `Ctrl+Up` | Move up |
| `Ctrl+Down` | Move down |

### Editor

| Shortcut | Action |
|----------|--------|
| `Ctrl+F` | Find |
| `Ctrl+H` | Replace |
| `Ctrl+/` | Toggle comment |
| `Alt+Up/Down` | Move line |

---

## Troubleshooting

### App Won't Start

**Error**: `Cannot find module 'electron'`

**Solution**:
```bash
rm -rf node_modules package-lock.json
npm install
```

---

**Error**: `Port 3000 already in use`

**Solution**:
```bash
# Kill process using port 3000
npx kill-port 3000
# Or change port in vite.config.js
```

---

### Preview Not Loading

**Issue**: Preview shows blank screen

**Solutions**:
1. Check console for errors (right-click preview → Inspect)
2. Verify generated code compiles:
   ```bash
   cd my-first-app
   npm run build
   ```
3. Restart dev server

---

### Generated Code Has Errors

**Issue**: ESLint errors in generated code

**Solutions**:
1. Check manifest for invalid values
2. Regenerate code: Right-click component → "Regenerate"
3. Report bug if consistent

---

### AI Not Responding

**Issue**: AI request times out

**Solutions**:
1. Check internet connection
2. Verify API key in settings
3. Try simpler prompt
4. Check API status: https://status.anthropic.com/

---

## Working with Generated Projects

### Opening Generated Project

Generated projects are standard Vite + React apps:

```bash
cd my-first-app
npm install  # First time only
npm run dev  # Start dev server
```

Open in browser: http://localhost:3000

### Editing Generated Code

You can edit generated code directly:

1. Open project in VSCode
2. Edit files in `src/components/`
3. Changes appear in browser (HMR)

**Note**: Manual edits will be preserved, but visual editor sync is a post-MVP feature.

### Adding Dependencies

```bash
cd my-first-app
npm install axios  # Or any package
```

Then import in script nodes or protected regions.

### Deploying Generated Projects

Deploy like any Vite app:

#### Vercel

```bash
npm install -g vercel
cd my-first-app
vercel
```

#### Netlify

```bash
npm install -g netlify-cli
cd my-first-app
npm run build
netlify deploy --prod
```

#### Static Hosting

```bash
cd my-first-app
npm run build
# Upload dist/ folder to any host
```

---

## Contributing

### Setting Up Development Environment

1. Fork the repository
2. Create a branch:
   ```bash
   git checkout -b feature/my-feature
   ```
3. Make changes
4. Run tests:
   ```bash
   npm test
   ```
5. Commit:
   ```bash
   git commit -m "Add my feature"
   ```
6. Push and create PR

### Code Style

We use:
- **ESLint** for linting
- **Prettier** for formatting
- **Conventional Commits** for commit messages

Run before committing:
```bash
npm run lint
npm run format
```

### Testing

Add tests for new features:

```javascript
// tests/component.test.js
import { describe, it, expect } from 'vitest';

describe('ComponentManager', () => {
  it('adds component to manifest', () => {
    // Test code
  });
});
```

Run tests:
```bash
npm test
```

---

## Getting Help

### Documentation

- **Architecture**: [ARCHITECTURE.md](./ARCHITECTURE.md)
- **Component Schema**: [COMPONENT_SCHEMA.md](./COMPONENT_SCHEMA.md)
- **Data Flow**: [DATA_FLOW.md](./DATA_FLOW.md)
- **Expression System**: [EXPRESSION_SYSTEM.md](./EXPRESSION_SYSTEM.md)

### Community

- **GitHub Issues**: Bug reports and feature requests
- **Discussions**: Questions and ideas
- **Discord**: Real-time chat (coming soon)

### FAQ

**Q: Can I use this with TypeScript?**
A: Not in MVP, but planned for future release.

**Q: Can I use Vue/Svelte instead of React?**
A: Not in MVP. Plugin system for other frameworks is post-MVP.

**Q: Can I import existing React components?**
A: Partially. You can reference external components in script nodes, but visual editing of imported components is post-MVP.

**Q: Is this production-ready?**
A: MVP is for prototyping. Generated code is production-quality React, but the tool itself is early stage.

**Q: Do I need to know React?**
A: Basic understanding helps, but tool is designed for low-code developers with minimal React knowledge.

---

## Sample Projects

### Example 1: Todo App

```bash
npm run example:todo
```

Features:
- Add/remove todos
- Mark complete
- Filter (all/active/completed)
- Uses global state

### Example 2: User Dashboard

```bash
npm run example:dashboard
```

Features:
- User list and detail views
- Search and filter
- Component connections
- Script nodes for data transformation

### Example 3: Form Builder

```bash
npm run example:forms
```

Features:
- Dynamic form fields
- Validation
- Conditional logic
- Submit handling

---

## Next Steps

1. ✅ **Complete Tutorial**: Follow in-app tutorial
2. ✅ **Explore Examples**: Open and study sample projects
3. ✅ **Build Something**: Start with simple project
4. ✅ **Read Docs**: Deep dive into specific topics
5. ✅ **Join Community**: Share your creations

---

## Useful Resources

### Learning React
- [React Official Docs](https://react.dev/)
- [React Tutorial](https://react.dev/learn)

### Low-Code Concepts
- [Visual Programming](https://en.wikipedia.org/wiki/Visual_programming_language)
- [Low-Code Platforms](https://www.gartner.com/en/information-technology/glossary/low-code-development-platforms)

### Our Inspiration
- [Bubble.io](https://bubble.io/)
- [Noodl](https://www.noodl.net/)
- [Webflow](https://webflow.com/)
- [Replit](https://replit.com/)

---

## License

TBD

---

## Acknowledgments

Built with:
- ⚛️ React
- ⚡ Vite
- 🔌 Electron
- 🤖 Claude AI
- 💙 Open Source

---

**Questions?** Open an issue on GitHub or check the docs!

**Ready to build?** `npm start` and let's go! 🚀