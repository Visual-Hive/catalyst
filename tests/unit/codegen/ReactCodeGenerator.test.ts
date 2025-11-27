/**
 * @file ReactCodeGenerator.test.ts
 * @description Comprehensive tests for React code generation (Level 1 - MVP)
 *
 * @architecture Phase 3, Task 3.1 - React Code Generator
 * @created 2025-11-27
 * @author AI (Cline) + Human Review
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  ReactCodeGenerator,
  ImportBuilder,
  PropsBuilder,
  JSXBuilder,
  CommentHeaderBuilder,
  CodeAssembler,
  COMMENT_MARKERS,
  DEFAULT_GENERATION_OPTIONS,
  generateComponent,
  generateAllComponents,
} from '../../../src/core/codegen';
import type { Component, Manifest } from '../../../src/core/manifest/types';

// ============================================================================
// TEST FIXTURES
// ============================================================================

/**
 * Create a minimal valid manifest
 */
function createMinimalManifest(components: Record<string, Component> = {}): Manifest {
  return {
    schemaVersion: '1.0.0',
    level: 1,
    metadata: {
      projectName: 'Test Project',
      framework: 'react',
      createdAt: '2025-11-27T00:00:00.000Z',
      updatedAt: '2025-11-27T00:00:00.000Z',
    },
    buildConfig: {
      bundler: 'vite',
      cssFramework: 'tailwind',
    },
    plugins: {
      framework: {
        name: '@rise/plugin-react',
        version: '1.0.0',
      },
    },
    components,
  };
}

/**
 * Create a simple button component
 */
function createButtonComponent(): Component {
  return {
    id: 'comp_button_001',
    displayName: 'PrimaryButton',
    type: 'button',
    category: 'basic',
    properties: {
      label: {
        type: 'static',
        value: 'Click me',
        dataType: 'string',
      },
      disabled: {
        type: 'static',
        value: false,
        dataType: 'boolean',
      },
    },
    styling: {
      baseClasses: ['btn', 'btn-primary', 'px-4', 'py-2', 'rounded'],
    },
    children: [],
    metadata: {
      createdAt: '2025-11-27T00:00:00.000Z',
      updatedAt: '2025-11-27T00:00:00.000Z',
      author: 'user',
      version: '1.0.0',
    },
  };
}

/**
 * Create an input component (self-closing)
 */
function createInputComponent(): Component {
  return {
    id: 'comp_input_001',
    displayName: 'TextInput',
    type: 'input',
    category: 'form',
    properties: {
      placeholder: {
        type: 'static',
        value: 'Enter text...',
        dataType: 'string',
      },
      disabled: {
        type: 'static',
        value: false,
        dataType: 'boolean',
      },
    },
    styling: {
      baseClasses: ['border', 'rounded', 'px-3', 'py-2'],
    },
    children: [],
    metadata: {
      createdAt: '2025-11-27T00:00:00.000Z',
      updatedAt: '2025-11-27T00:00:00.000Z',
      author: 'user',
      version: '1.0.0',
    },
  };
}

/**
 * Create a card component with children
 */
function createCardWithChildren(): { card: Component; header: Component; content: Component } {
  const header: Component = {
    id: 'comp_header_001',
    displayName: 'CardHeader',
    type: 'div',
    properties: {
      title: {
        type: 'static',
        value: 'Card Title',
        dataType: 'string',
      },
    },
    styling: {
      baseClasses: ['text-lg', 'font-bold'],
    },
    children: [],
    metadata: {
      createdAt: '2025-11-27T00:00:00.000Z',
      updatedAt: '2025-11-27T00:00:00.000Z',
      author: 'user',
      version: '1.0.0',
    },
  };

  const content: Component = {
    id: 'comp_content_001',
    displayName: 'CardContent',
    type: 'div',
    properties: {},
    styling: {
      baseClasses: ['p-4'],
    },
    children: [],
    metadata: {
      createdAt: '2025-11-27T00:00:00.000Z',
      updatedAt: '2025-11-27T00:00:00.000Z',
      author: 'user',
      version: '1.0.0',
    },
  };

  const card: Component = {
    id: 'comp_card_001',
    displayName: 'InfoCard',
    type: 'div',
    properties: {},
    styling: {
      baseClasses: ['bg-white', 'rounded-lg', 'shadow-md'],
    },
    children: ['comp_header_001', 'comp_content_001'],
    metadata: {
      createdAt: '2025-11-27T00:00:00.000Z',
      updatedAt: '2025-11-27T00:00:00.000Z',
      author: 'user',
      version: '1.0.0',
    },
  };

  return { card, header, content };
}

/**
 * Create component with all property types
 */
function createAllPropTypesComponent(): Component {
  return {
    id: 'comp_badge_001',
    displayName: 'Badge',
    type: 'span',
    properties: {
      text: {
        type: 'static',
        value: 'New',
        dataType: 'string',
      },
      count: {
        type: 'static',
        value: 5,
        dataType: 'number',
      },
      visible: {
        type: 'static',
        value: true,
        dataType: 'boolean',
      },
    },
    styling: {
      baseClasses: ['inline-flex', 'px-2', 'py-1', 'text-xs', 'rounded-full'],
    },
    children: [],
    metadata: {
      createdAt: '2025-11-27T00:00:00.000Z',
      updatedAt: '2025-11-27T00:00:00.000Z',
      author: 'user',
      version: '1.0.0',
    },
  };
}

// ============================================================================
// IMPORT BUILDER TESTS
// ============================================================================

describe('ImportBuilder', () => {
  let builder: ImportBuilder;
  let manifest: Manifest;

  beforeEach(() => {
    builder = new ImportBuilder();
    manifest = createMinimalManifest();
  });

  it('should generate React import by default', () => {
    const component = createButtonComponent();
    manifest.components[component.id] = component;

    const result = builder.build({
      component,
      manifest,
      options: DEFAULT_GENERATION_OPTIONS,
      indentLevel: 0,
    });

    expect(result.code).toContain("import React from 'react';");
    expect(result.importedComponents).toHaveLength(0);
  });

  it('should not include React import when disabled', () => {
    const component = createButtonComponent();
    manifest.components[component.id] = component;

    const result = builder.build({
      component,
      manifest,
      options: { ...DEFAULT_GENERATION_OPTIONS, includeReactImport: false },
      indentLevel: 0,
    });

    expect(result.code).not.toContain('React');
  });

  it('should import child components', () => {
    const { card, header, content } = createCardWithChildren();
    manifest.components[card.id] = card;
    manifest.components[header.id] = header;
    manifest.components[content.id] = content;

    const result = builder.build({
      component: card,
      manifest,
      options: DEFAULT_GENERATION_OPTIONS,
      indentLevel: 0,
    });

    expect(result.code).toContain("import { CardHeader } from './CardHeader';");
    expect(result.code).toContain("import { CardContent } from './CardContent';");
    expect(result.importedComponents).toContain('CardHeader');
    expect(result.importedComponents).toContain('CardContent');
  });

  it('should deduplicate child imports', () => {
    const component = createButtonComponent();
    // Same child twice (unusual, but should handle)
    component.children = ['comp_header_001', 'comp_header_001'];

    const header: Component = {
      ...createButtonComponent(),
      id: 'comp_header_001',
      displayName: 'Header',
    };

    manifest.components[component.id] = component;
    manifest.components[header.id] = header;

    const result = builder.build({
      component,
      manifest,
      options: DEFAULT_GENERATION_OPTIONS,
      indentLevel: 0,
    });

    // Should only have one import for Header
    const headerImportCount = (result.code.match(/import.*Header/g) || []).length;
    expect(headerImportCount).toBe(1);
  });

  it('should handle missing child gracefully', () => {
    const component = createButtonComponent();
    component.children = ['comp_nonexistent_001'];
    manifest.components[component.id] = component;

    const result = builder.build({
      component,
      manifest,
      options: DEFAULT_GENERATION_OPTIONS,
      indentLevel: 0,
    });

    // Should just have React import
    expect(result.importedComponents).toHaveLength(0);
    expect(result.code).toContain("import React from 'react';");
  });
});

// ============================================================================
// PROPS BUILDER TESTS
// ============================================================================

describe('PropsBuilder', () => {
  let builder: PropsBuilder;
  let manifest: Manifest;

  beforeEach(() => {
    builder = new PropsBuilder();
    manifest = createMinimalManifest();
  });

  it('should return empty string for no props', () => {
    const component: Component = {
      ...createButtonComponent(),
      properties: {},
    };
    manifest.components[component.id] = component;

    const result = builder.build({
      component,
      manifest,
      options: DEFAULT_GENERATION_OPTIONS,
      indentLevel: 0,
    });

    expect(result.code).toBe('');
    expect(result.hasProps).toBe(false);
    expect(result.propNames).toHaveLength(0);
  });

  it('should generate string prop with default', () => {
    const component = createButtonComponent();
    manifest.components[component.id] = component;

    const result = builder.build({
      component,
      manifest,
      options: DEFAULT_GENERATION_OPTIONS,
      indentLevel: 0,
    });

    expect(result.code).toContain("label = 'Click me'");
    expect(result.hasProps).toBe(true);
    expect(result.propNames).toContain('label');
  });

  it('should generate boolean prop with default', () => {
    const component = createButtonComponent();
    manifest.components[component.id] = component;

    const result = builder.build({
      component,
      manifest,
      options: DEFAULT_GENERATION_OPTIONS,
      indentLevel: 0,
    });

    expect(result.code).toContain('disabled = false');
    expect(result.propNames).toContain('disabled');
  });

  it('should generate number prop with default', () => {
    const component = createAllPropTypesComponent();
    manifest.components[component.id] = component;

    const result = builder.build({
      component,
      manifest,
      options: DEFAULT_GENERATION_OPTIONS,
      indentLevel: 0,
    });

    expect(result.code).toContain('count = 5');
  });

  it('should escape special characters in strings', () => {
    const component: Component = {
      ...createButtonComponent(),
      properties: {
        message: {
          type: 'static',
          value: "It's a \"test\"\nwith newline",
          dataType: 'string',
        },
      },
    };
    manifest.components[component.id] = component;

    const result = builder.build({
      component,
      manifest,
      options: DEFAULT_GENERATION_OPTIONS,
      indentLevel: 0,
    });

    expect(result.code).toContain("\\'"); // Escaped single quote
    expect(result.code).toContain('\\n'); // Escaped newline
  });

  it('should sort props alphabetically', () => {
    const component: Component = {
      ...createButtonComponent(),
      properties: {
        zebra: { type: 'static', value: 'z', dataType: 'string' },
        apple: { type: 'static', value: 'a', dataType: 'string' },
        monkey: { type: 'static', value: 'm', dataType: 'string' },
      },
    };
    manifest.components[component.id] = component;

    const result = builder.build({
      component,
      manifest,
      options: DEFAULT_GENERATION_OPTIONS,
      indentLevel: 0,
    });

    const appleIdx = result.code.indexOf('apple');
    const monkeyIdx = result.code.indexOf('monkey');
    const zebraIdx = result.code.indexOf('zebra');

    expect(appleIdx).toBeLessThan(monkeyIdx);
    expect(monkeyIdx).toBeLessThan(zebraIdx);
  });
});

// ============================================================================
// JSX BUILDER TESTS
// ============================================================================

describe('JSXBuilder', () => {
  let builder: JSXBuilder;
  let manifest: Manifest;

  beforeEach(() => {
    builder = new JSXBuilder();
    manifest = createMinimalManifest();
  });

  it('should generate simple element with className', () => {
    const component = createButtonComponent();
    manifest.components[component.id] = component;

    const result = builder.build({
      component,
      manifest,
      options: DEFAULT_GENERATION_OPTIONS,
      indentLevel: 0,
    });

    expect(result.code).toContain('<button');
    expect(result.code).toContain('className="btn btn-primary px-4 py-2 rounded"');
    expect(result.isSelfClosing).toBe(false);
  });

  it('should generate self-closing element for input', () => {
    const component = createInputComponent();
    manifest.components[component.id] = component;

    const result = builder.build({
      component,
      manifest,
      options: DEFAULT_GENERATION_OPTIONS,
      indentLevel: 0,
    });

    expect(result.code).toContain('<input');
    expect(result.code).toContain('/>');
    expect(result.code).not.toContain('</input>');
    expect(result.isSelfClosing).toBe(true);
  });

  it('should render child components', () => {
    const { card, header, content } = createCardWithChildren();
    manifest.components[card.id] = card;
    manifest.components[header.id] = header;
    manifest.components[content.id] = content;

    const result = builder.build({
      component: card,
      manifest,
      options: DEFAULT_GENERATION_OPTIONS,
      indentLevel: 0,
    });

    expect(result.code).toContain('<CardHeader />');
    expect(result.code).toContain('<CardContent />');
    expect(result.childComponents).toContain('CardHeader');
    expect(result.childComponents).toContain('CardContent');
  });

  it('should render text content from label prop', () => {
    const component = createButtonComponent();
    manifest.components[component.id] = component;

    const result = builder.build({
      component,
      manifest,
      options: DEFAULT_GENERATION_OPTIONS,
      indentLevel: 0,
    });

    expect(result.code).toContain('{label}');
  });

  it('should handle empty element', () => {
    const component: Component = {
      ...createButtonComponent(),
      properties: {},
      children: [],
    };
    manifest.components[component.id] = component;

    const result = builder.build({
      component,
      manifest,
      options: DEFAULT_GENERATION_OPTIONS,
      indentLevel: 0,
    });

    expect(result.code).toContain('<button');
    expect(result.code).toContain('></button>');
  });

  it('should omit className when no baseClasses', () => {
    const component: Component = {
      ...createButtonComponent(),
      styling: { baseClasses: [] },
    };
    manifest.components[component.id] = component;

    const result = builder.build({
      component,
      manifest,
      options: DEFAULT_GENERATION_OPTIONS,
      indentLevel: 0,
    });

    expect(result.code).not.toContain('className');
  });
});

// ============================================================================
// COMMENT HEADER BUILDER TESTS
// ============================================================================

describe('CommentHeaderBuilder', () => {
  let builder: CommentHeaderBuilder;
  let manifest: Manifest;

  beforeEach(() => {
    builder = new CommentHeaderBuilder();
    manifest = createMinimalManifest();
  });

  it('should include all required markers', () => {
    const component = createButtonComponent();
    manifest.components[component.id] = component;

    const result = builder.build({
      component,
      manifest,
      options: DEFAULT_GENERATION_OPTIONS,
      indentLevel: 0,
    });

    expect(result.code).toContain(COMMENT_MARKERS.GENERATED);
    expect(result.code).toContain(COMMENT_MARKERS.COMPONENT_ID);
    expect(result.code).toContain(COMMENT_MARKERS.LEVEL);
    expect(result.code).toContain(COMMENT_MARKERS.LAST_GENERATED);
    expect(result.code).toContain(COMMENT_MARKERS.DO_NOT_EDIT);
  });

  it('should include correct component ID', () => {
    const component = createButtonComponent();
    manifest.components[component.id] = component;

    const result = builder.build({
      component,
      manifest,
      options: DEFAULT_GENERATION_OPTIONS,
      indentLevel: 0,
    });

    expect(result.code).toContain('comp_button_001');
  });

  it('should include valid ISO timestamp', () => {
    const component = createButtonComponent();
    manifest.components[component.id] = component;

    const result = builder.build({
      component,
      manifest,
      options: DEFAULT_GENERATION_OPTIONS,
      indentLevel: 0,
    });

    expect(result.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
  });
});

// ============================================================================
// CODE ASSEMBLER TESTS
// ============================================================================

describe('CodeAssembler', () => {
  let assembler: CodeAssembler;

  beforeEach(() => {
    assembler = new CodeAssembler();
  });

  it('should assemble all parts correctly', () => {
    const result = assembler.build({
      parts: {
        imports: "import React from 'react';",
        commentHeader: '/** @lowcode:generated */',
        componentName: 'TestButton',
        props: "{ label = 'Click' }",
        jsx: '<button>{label}</button>',
      },
    });

    expect(result.code).toContain("import React from 'react';");
    expect(result.code).toContain('@lowcode:generated');
    expect(result.code).toContain('export function TestButton');
    expect(result.code).toContain("label = 'Click'");
    expect(result.code).toContain('<button>');
    expect(result.code).toContain('export default TestButton');
    expect(result.filename).toBe('TestButton.jsx');
  });

  it('should handle empty props', () => {
    const result = assembler.build({
      parts: {
        imports: "import React from 'react';",
        commentHeader: '/** comment */',
        componentName: 'Empty',
        props: '',
        jsx: '<div></div>',
      },
    });

    expect(result.code).toContain('export function Empty()');
  });

  it('should respect includeDefaultExport option', () => {
    const result = assembler.build({
      parts: {
        imports: "import React from 'react';",
        commentHeader: '/** comment */',
        componentName: 'Test',
        props: '',
        jsx: '<div></div>',
      },
      options: { includeDefaultExport: false },
    });

    expect(result.code).not.toContain('export default');
  });

  it('should generate correct filepath', () => {
    const result = assembler.build({
      parts: {
        imports: '',
        commentHeader: '',
        componentName: 'MyComponent',
        props: '',
        jsx: '<div></div>',
      },
    });

    expect(result.filepath).toBe('src/components/MyComponent.jsx');
  });
});

// ============================================================================
// REACT CODE GENERATOR INTEGRATION TESTS
// ============================================================================

describe('ReactCodeGenerator', () => {
  let generator: ReactCodeGenerator;

  beforeEach(() => {
    generator = new ReactCodeGenerator();
  });

  it('should generate complete component file', async () => {
    const component = createButtonComponent();
    const manifest = createMinimalManifest({ [component.id]: component });

    const result = await generator.generateComponent(component, manifest);

    expect(result.success).toBe(true);
    expect(result.componentId).toBe(component.id);
    expect(result.componentName).toBe('PrimaryButton');
    expect(result.code).toContain("import React from 'react';");
    expect(result.code).toContain('@lowcode:generated');
    expect(result.code).toContain('export function PrimaryButton');
    expect(result.code).toContain('export default PrimaryButton');
    expect(result.filename).toBe('PrimaryButton.jsx');
    expect(result.metadata.level).toBe(1);
    expect(result.metadata.durationMs).toBeDefined();
  });

  it('should generate self-closing elements correctly', async () => {
    const component = createInputComponent();
    const manifest = createMinimalManifest({ [component.id]: component });

    const result = await generator.generateComponent(component, manifest);

    expect(result.success).toBe(true);
    expect(result.code).toContain('<input');
    expect(result.code).toContain('/>');
  });

  it('should generate component with children', async () => {
    const { card, header, content } = createCardWithChildren();
    const manifest = createMinimalManifest({
      [card.id]: card,
      [header.id]: header,
      [content.id]: content,
    });

    const result = await generator.generateComponent(card, manifest);

    expect(result.success).toBe(true);
    expect(result.code).toContain("import { CardHeader } from './CardHeader'");
    expect(result.code).toContain("import { CardContent } from './CardContent'");
    expect(result.code).toContain('<CardHeader />');
    expect(result.code).toContain('<CardContent />');
  });

  it('should generate all components in manifest', async () => {
    const { card, header, content } = createCardWithChildren();
    const manifest = createMinimalManifest({
      [card.id]: card,
      [header.id]: header,
      [content.id]: content,
    });

    const result = await generator.generateAll(manifest);

    expect(result.success).toBe(true);
    expect(result.results).toHaveLength(3);
    expect(result.successCount).toBe(3);
    expect(result.failureCount).toBe(0);
  });

  it('should handle missing child component gracefully', async () => {
    const component: Component = {
      ...createButtonComponent(),
      children: ['nonexistent_child'],
    };
    const manifest = createMinimalManifest({ [component.id]: component });

    const result = await generator.generateComponent(component, manifest);

    // Should still succeed, just without the child import
    expect(result.success).toBe(true);
    expect(result.code).not.toContain('nonexistent');
  });

  it('should format code with Prettier', async () => {
    const component = createButtonComponent();
    const manifest = createMinimalManifest({ [component.id]: component });

    const result = await generator.generateComponent(component, manifest);

    // Prettier adds consistent formatting
    expect(result.success).toBe(true);
    // Check for proper indentation (Prettier will format)
    expect(result.code).toContain('  return');
  });

  it('should include all prop types correctly', async () => {
    const component = createAllPropTypesComponent();
    const manifest = createMinimalManifest({ [component.id]: component });

    const result = await generator.generateComponent(component, manifest);

    expect(result.success).toBe(true);
    expect(result.code).toContain('count = 5');
    expect(result.code).toContain("text = 'New'");
    expect(result.code).toContain('visible = true');
  });

  it('should report timing metrics', async () => {
    const component = createButtonComponent();
    const manifest = createMinimalManifest({ [component.id]: component });

    const result = await generator.generateComponent(component, manifest);

    expect(result.metadata.durationMs).toBeGreaterThanOrEqual(0);
    expect(result.metadata.generatedAt).toBeDefined();
  });

  describe('helper functions', () => {
    it('generateComponent should work', async () => {
      const component = createButtonComponent();
      const manifest = createMinimalManifest({ [component.id]: component });

      const result = await generateComponent(component, manifest);

      expect(result.success).toBe(true);
    });

    it('generateAllComponents should work', async () => {
      const component = createButtonComponent();
      const manifest = createMinimalManifest({ [component.id]: component });

      const result = await generateAllComponents(manifest);

      expect(result.success).toBe(true);
      expect(result.results).toHaveLength(1);
    });
  });
});

// ============================================================================
// PERFORMANCE TESTS
// ============================================================================

describe('Performance', () => {
  it('should generate 50 components in under 500ms', async () => {
    const generator = new ReactCodeGenerator();

    // Create 50 components
    const components: Record<string, Component> = {};
    for (let i = 0; i < 50; i++) {
      const component: Component = {
        id: `comp_perf_${i}`,
        displayName: `Component${i}`,
        type: 'div',
        properties: {
          label: { type: 'static', value: `Label ${i}`, dataType: 'string' },
          count: { type: 'static', value: i, dataType: 'number' },
        },
        styling: { baseClasses: ['p-4', 'bg-white'] },
        children: [],
        metadata: {
          createdAt: '2025-11-27T00:00:00.000Z',
          updatedAt: '2025-11-27T00:00:00.000Z',
          author: 'user',
          version: '1.0.0',
        },
      };
      components[component.id] = component;
    }

    const manifest = createMinimalManifest(components);

    const result = await generator.generateAll(manifest);

    expect(result.success).toBe(true);
    expect(result.results).toHaveLength(50);
    // Relaxed timing due to Prettier overhead - 500ms is reasonable
    expect(result.totalDurationMs).toBeLessThan(500);
  }, 10000); // Increase test timeout to 10s
});
