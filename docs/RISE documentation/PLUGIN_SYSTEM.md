# Plugin System

## Vision

A framework-agnostic architecture that starts with React but allows the community to build adapters for any JavaScript framework - Vue, Svelte, Angular, Solid, or even vanilla JS.

## Design Principles

1. **React as Reference**: React plugin is built-in and serves as reference implementation
2. **Clean Abstraction**: Framework plugins implement a well-defined interface
3. **No Lock-in**: Generated projects work with standard tooling (Vite, webpack, etc.)
4. **Community-Driven**: Plugin system designed for third-party contributions
5. **Feature Parity**: All features should work across frameworks (or gracefully degrade)

---

## Plugin Architecture

### Plugin Discovery

Plugins are npm packages with naming convention: `@lowcode-builder/plugin-{framework}`

**Auto-Discovery Locations**:
1. Built-in plugins: `electron/plugins/`
2. User plugins: `~/.lowcode/plugins/`
3. Project plugins: `{project}/.lowcode/plugins/`
4. Global npm: `node_modules/@lowcode-builder/plugin-*`

### Plugin Structure

```
@lowcode-builder/plugin-react/
├── package.json
├── index.js                 # Plugin entry point
├── generator/
│   ├── component.js         # Component code generation
│   ├── app.js              # App entry code generation
│   └── imports.js          # Import statement generation
├── parser/
│   ├── component.js         # Parse component → manifest
│   └── detector.js         # Detect if file is this framework
├── runtime/
│   ├── debugger.js         # Debug runtime adapter
│   └── state.js            # State management adapter
├── templates/
│   ├── project/            # New project template
│   └── component.jsx       # Component template
└── schema/
    └── types.json          # Framework-specific types
```

---

## Plugin Interface

### Core Interface

```typescript
// index.js
export interface FrameworkPlugin {
  // Metadata
  name: string;                    // 'react', 'vue', 'svelte'
  version: string;                 // '0.1.0'
  frameworkVersion: string;        // '18.2.0'
  displayName: string;             // 'React'
  description: string;
  
  // Capabilities (optional features)
  capabilities: {
    debugger: boolean;             // Supports step debugging
    hotReload: boolean;            // Supports HMR
    typescript: boolean;           // TypeScript support
    stateManagement: boolean;      // Global state support
    routing: boolean;              // Routing support
  };

  // Generator
  generator: GeneratorAdapter;
  
  // Parser (for bidirectional sync)
  parser: ParserAdapter;
  
  // Runtime
  runtime: RuntimeAdapter;
  
  // Project scaffolding
  project: ProjectAdapter;
}
```

### Generator Adapter

```typescript
interface GeneratorAdapter {
  // Generate component code from manifest
  generateComponent(component: Component, options: GeneratorOptions): string;
  
  // Generate main app entry point
  generateApp(manifest: Manifest): string;
  
  // Generate imports for components
  generateImports(components: Component[]): string;
  
  // Generate routing (if supported)
  generateRoutes?(routes: Route[]): string;
  
  // Generate state management setup
  generateStateSetup?(variables: Variables): string;
  
  // Optimize generated code
  optimize?(code: string): string;
}

interface GeneratorOptions {
  typescript: boolean;
  formatting: 'prettier' | 'eslint' | 'none';
  comments: boolean;
  minify: boolean;
}
```

### Parser Adapter

```typescript
interface ParserAdapter {
  // Parse component file → manifest component
  parseComponent(code: string, filepath: string): Component;
  
  // Detect if file belongs to this framework
  detectFramework(code: string, filepath: string): boolean;
  
  // Parse imports to find dependencies
  parseImports(code: string): Import[];
  
  // Extract component metadata
  extractMetadata(code: string): ComponentMetadata;
}
```

### Runtime Adapter

```typescript
interface RuntimeAdapter {
  // Get debug runtime code to inject
  getDebugRuntime(): string;
  
  // Get state management runtime
  getStateRuntime?(variables: Variables): string;
  
  // Get routing runtime
  getRoutingRuntime?(): string;
  
  // Transform code for preview
  transformForPreview?(code: string): string;
}
```

### Project Adapter

```typescript
interface ProjectAdapter {
  // Get new project template
  getProjectTemplate(): ProjectTemplate;
  
  // Get package.json dependencies
  getDependencies(): {
    dependencies: Record<string, string>;
    devDependencies: Record<string, string>;
  };
  
  // Get build configuration
  getBuildConfig(): BuildConfig;
  
  // Get dev server config
  getDevServerConfig(): DevServerConfig;
}
```

---

## React Plugin (Reference Implementation)

### Component Generation

**Input Manifest**:
```json
{
  "id": "userCard",
  "type": "UserCard",
  "props": {
    "user": {
      "type": "prop",
      "propType": "object"
    }
  },
  "state": {
    "isHovered": {
      "type": "boolean",
      "default": false
    }
  },
  "children": [
    {
      "type": "div",
      "props": {
        "className": { "type": "static", "value": "card" }
      },
      "children": [
        {
          "type": "Text",
          "props": {
            "children": {
              "type": "expression",
              "value": "user.name"
            }
          }
        }
      ]
    }
  ]
}
```

**Generated React Code**:
```jsx
import React, { useState } from 'react';
import Text from './Text';

/**
 * @lowcode:generated
 * Component: UserCard
 * ID: userCard
 * Generated: 2025-10-25T10:00:00Z
 */
export default function UserCard({ user }) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div 
      className="card"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Text>{user.name}</Text>
    </div>
  );
}
```

### Parser (Reverse Engineering)

**Input Code**:
```jsx
export default function UserCard({ user }) {
  const [isHovered, setIsHovered] = useState(false);
  
  return (
    <div className="card">
      <Text>{user.name}</Text>
    </div>
  );
}
```

**Parsed to Manifest** (simplified):
```json
{
  "id": "userCard",
  "type": "UserCard",
  "props": {
    "user": { "type": "prop", "propType": "object" }
  },
  "state": {
    "isHovered": { "type": "boolean", "default": false }
  }
}
```

---

## Vue Plugin Example

### Component Generation

**Same Manifest** → **Generated Vue Code**:

```vue
<template>
  <div 
    class="card"
    @mouseenter="isHovered = true"
    @mouseleave="isHovered = false"
  >
    <Text>{{ user.name }}</Text>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import Text from './Text.vue';

/**
 * @lowcode:generated
 * Component: UserCard
 * ID: userCard
 * Generated: 2025-10-25T10:00:00Z
 */
const props = defineProps({
  user: {
    type: Object,
    required: true
  }
});

const isHovered = ref(false);
</script>

<style scoped>
/* Styles if needed */
</style>
```

---

## Svelte Plugin Example

### Component Generation

**Same Manifest** → **Generated Svelte Code**:

```svelte
<!--
  @lowcode:generated
  Component: UserCard
  ID: userCard
  Generated: 2025-10-25T10:00:00Z
-->
<script>
  import Text from './Text.svelte';
  
  export let user;
  
  let isHovered = false;
</script>

<div 
  class="card"
  on:mouseenter={() => isHovered = true}
  on:mouseleave={() => isHovered = false}
>
  <Text>{user.name}</Text>
</div>

<style>
  /* Styles if needed */
</style>
```

---

## Plugin Registration

### Manual Registration

```typescript
// In project's .lowcode/config.js
import reactPlugin from '@lowcode-builder/plugin-react';
import vuePlugin from '@lowcode-builder/plugin-vue';

export default {
  framework: 'react',
  plugins: {
    react: reactPlugin,
    vue: vuePlugin
  }
};
```

### Auto-Discovery

```typescript
// Plugin manager auto-discovers plugins
class PluginManager {
  async discoverPlugins(): Promise<FrameworkPlugin[]> {
    const plugins = [];
    
    // 1. Check built-in plugins
    plugins.push(...this.loadBuiltInPlugins());
    
    // 2. Check user plugins directory
    plugins.push(...this.loadUserPlugins());
    
    // 3. Check project plugins
    plugins.push(...this.loadProjectPlugins());
    
    // 4. Check node_modules
    plugins.push(...this.loadNpmPlugins());
    
    return plugins;
  }
  
  async loadNpmPlugins(): Promise<FrameworkPlugin[]> {
    const pkgJsons = await glob('node_modules/@lowcode-builder/plugin-*/package.json');
    return Promise.all(
      pkgJsons.map(async (pkg) => {
        const module = await import(path.dirname(pkg));
        return module.default;
      })
    );
  }
}
```

---

## Framework-Specific Features

### Handling Framework Differences

**State Management**:

| Framework | State Pattern | Plugin Approach |
|-----------|---------------|-----------------|
| React | `useState` hooks | Generate hooks code |
| Vue | `ref` reactivity | Generate composition API |
| Svelte | Reactive variables | Generate `let` declarations |
| Angular | `BehaviorSubject` | Generate RxJS observables |

**Plugin Implementation**:

```typescript
// React plugin
generateState(stateVar: StateVariable): string {
  return `const [${stateVar.name}, set${capitalize(stateVar.name)}] = useState(${stateVar.default});`;
}

// Vue plugin
generateState(stateVar: StateVariable): string {
  return `const ${stateVar.name} = ref(${stateVar.default});`;
}

// Svelte plugin
generateState(stateVar: StateVariable): string {
  return `let ${stateVar.name} = ${stateVar.default};`;
}
```

---

## Capability Detection

Some features may not be available in all frameworks:

```typescript
class FeatureSupport {
  checkFeature(plugin: FrameworkPlugin, feature: string): boolean {
    switch (feature) {
      case 'debugger':
        return plugin.capabilities.debugger;
      case 'hotReload':
        return plugin.capabilities.hotReload;
      default:
        return false;
    }
  }
  
  gracefulDegradation(feature: string) {
    // If feature not supported, show warning and disable
    console.warn(`${feature} not supported by current framework`);
    // Offer alternative or disable feature in UI
  }
}
```

**UI Behavior**:

```
┌────────────────────────────────────────────────┐
│ Framework: Svelte                              │
│ ⚠️ Step Debugger not yet supported in Svelte  │
│                                                │
│ Available: ✓ Hot Reload  ✓ TypeScript         │
│ Limited:   ⚠️ Debugger   ⚠️ State Management  │
│                                                │
│ [Switch to React] [Continue Anyway]           │
└────────────────────────────────────────────────┘
```

---

## Plugin Development

### Creating a New Plugin

**1. Use Plugin Template**:

```bash
npm create @lowcode-builder/plugin my-framework
cd my-framework
npm install
```

**2. Implement Interface**:

```typescript
// index.ts
import { FrameworkPlugin } from '@lowcode-builder/types';

const myPlugin: FrameworkPlugin = {
  name: 'my-framework',
  version: '0.1.0',
  frameworkVersion: '1.0.0',
  displayName: 'My Framework',
  description: 'Plugin for My Framework',
  
  capabilities: {
    debugger: false,
    hotReload: true,
    typescript: true,
    stateManagement: true,
    routing: false
  },
  
  generator: {
    generateComponent: (component, options) => {
      // Your code generation logic
      return `/* Generated component code */`;
    },
    
    generateApp: (manifest) => {
      // Your app generation logic
      return `/* Generated app code */`;
    },
    
    // ... implement other methods
  },
  
  parser: {
    parseComponent: (code, filepath) => {
      // Your parsing logic
      return { /* parsed component */ };
    },
    
    detectFramework: (code) => {
      // Return true if code is this framework
      return code.includes('my-framework');
    },
    
    // ... implement other methods
  },
  
  // ... implement runtime, project adapters
};

export default myPlugin;
```

**3. Test Plugin**:

```bash
npm test
npm run test:integration
```

**4. Publish**:

```bash
npm publish --access public
```

### Plugin Testing

```typescript
// tests/generator.test.ts
import { describe, it, expect } from 'vitest';
import plugin from '../src/index';

describe('Component Generation', () => {
  it('generates basic component', () => {
    const manifest = { /* test manifest */ };
    const code = plugin.generator.generateComponent(manifest, {});
    
    expect(code).toContain('export default function');
    expect(code).toContain('return');
  });
  
  it('handles props correctly', () => {
    // Test prop generation
  });
  
  it('handles state correctly', () => {
    // Test state generation
  });
});
```

---

## Plugin Marketplace (Future)

**Discovery UI**:

```
┌────────────────────────────────────────────────────────┐
│ 🔌 Plugin Marketplace                                  │
├────────────────────────────────────────────────────────┤
│                                                        │
│  🔍 Search plugins...                                  │
│                                                        │
│  ⭐ Popular Plugins:                                   │
│                                                        │
│  📦 @lowcode/plugin-react        ✓ Installed          │
│     React 18+ support                                 │
│     ⭐ 4.8/5  •  1.2M downloads                       │
│                                                        │
│  📦 @lowcode/plugin-vue          [Install]            │
│     Vue 3 Composition API                             │
│     ⭐ 4.7/5  •  856K downloads                       │
│                                                        │
│  📦 @lowcode/plugin-svelte       [Install]            │
│     Svelte 4 support                                  │
│     ⭐ 4.6/5  •  432K downloads                       │
│                                                        │
│  📦 @community/plugin-angular    [Install]            │
│     Angular 17+ with standalone components            │
│     ⭐ 4.2/5  •  123K downloads                       │
│                                                        │
└────────────────────────────────────────────────────────┘
```

---

## Cross-Framework Considerations

### Universal Component Schema

The manifest format must work for all frameworks:

```json
{
  "component": {
    "type": "Button",
    "props": {
      "onClick": { "type": "event" },
      "disabled": { "type": "boolean" }
    }
  }
}
```

React interprets as:
```jsx
<Button onClick={handleClick} disabled={isDisabled} />
```

Vue interprets as:
```vue
<Button @click="handleClick" :disabled="isDisabled" />
```

Svelte interprets as:
```svelte
<Button on:click={handleClick} disabled={isDisabled} />
```

### Translation Layer

Plugin system provides translation utilities:

```typescript
class TranslationLayer {
  // Translate manifest event syntax to framework syntax
  translateEvent(eventName: string, framework: string): string {
    const translations = {
      react: `on${capitalize(eventName)}`,
      vue: `@${eventName}`,
      svelte: `on:${eventName}`,
      angular: `(${eventName})`
    };
    return translations[framework] || eventName;
  }
  
  // Translate binding syntax
  translateBinding(propName: string, framework: string): string {
    const translations = {
      react: propName,
      vue: `:${propName}`,
      svelte: propName,
      angular: `[${propName}]`
    };
    return translations[framework] || propName;
  }
}
```

---

## Migration Between Frameworks

**Framework Switcher**:

```
┌────────────────────────────────────────────────────────┐
│ 🔄 Switch Framework                                    │
├────────────────────────────────────────────────────────┤
│                                                        │
│  Current: React 18                                     │
│  Switch to: [Vue 3 ▼]                                 │
│                                                        │
│  ⚠️ This will regenerate all components               │
│                                                        │
│  Changes:                                              │
│  • All .jsx files → .vue files                        │
│  • State management updated                           │
│  • Build config changed                               │
│                                                        │
│  ✓ Manifest will be preserved                         │
│  ✓ Can switch back anytime                            │
│                                                        │
│  [Cancel]  [Create Backup & Switch]                   │
│                                                        │
└────────────────────────────────────────────────────────┘
```

---

## Best Practices for Plugin Authors

### ✅ DO:
- Follow the reference React plugin structure
- Implement comprehensive tests
- Document framework-specific limitations
- Provide migration guides
- Use semantic versioning
- Include TypeScript types

### ❌ DON'T:
- Add framework-specific features to manifest (use capabilities)
- Break the parser/generator contract
- Require manual code edits after generation
- Forget error handling
- Ignore performance optimization

---

**See Also**:
- [Architecture Overview](./ARCHITECTURE.md) - How plugins fit into system
- [Component Schema](./COMPONENT_SCHEMA.md) - Universal manifest format
- [Getting Started](./GETTING_STARTED.md) - Installing plugins