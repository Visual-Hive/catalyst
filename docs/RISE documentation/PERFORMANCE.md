# Performance Strategy

> Scaling a visual low-code development tool: from 10 components to 1000+ component enterprise applications

## Philosophy

Rise must perform well across all scales:

1. **🚀 Instant Feedback** - Visual changes feel immediate (< 100ms)
2. **📈 Linear Scaling** - Performance degrades gracefully with project size
3. **💾 Memory Efficiency** - Handle large projects without memory bloat
4. **⚡ Fast Generation** - Code generation scales with complexity, not size
5. **🔄 Smooth Preview** - Real-time preview stays responsive

---

## Performance Targets

### User Experience Benchmarks

| Action | Target Time | Maximum Acceptable |
|--------|-------------|-------------------|
| App startup | < 2s | < 5s |
| Open project | < 1s | < 3s |
| Add component | < 100ms | < 300ms |
| Property change | < 50ms | < 150ms |
| Expression validation | < 20ms | < 100ms |
| Code generation (full) | < 2s | < 10s |
| Preview reload | < 500ms | < 2s |
| Component tree scroll | 60 FPS | 30 FPS |

### Scale Benchmarks

| Project Size | Components | Response Time | Memory Usage |
|-------------|------------|---------------|--------------|
| Small | 1-20 | < 50ms | < 100MB |
| Medium | 21-100 | < 100ms | < 250MB |
| Large | 101-500 | < 200ms | < 500MB |
| Enterprise | 501-1000+ | < 500ms | < 1GB |

---

## Visual Editor Performance

### 1. Component Tree Optimization

**Problem**: Large component trees (100+ components) can freeze the UI

**Solution**: Virtual scrolling and lazy rendering

```typescript
// VirtualizedComponentTree.tsx
import { FixedSizeList as List } from 'react-window';

interface VirtualizedTreeProps {
  components: Component[];
  height: number;
}

export function VirtualizedComponentTree({ components, height }: VirtualizedTreeProps) {
  const ItemRenderer = ({ index, style }) => {
    const component = components[index];
    
    return (
      <div style={style}>
        <ComponentTreeItem 
          component={component}
          onSelect={onSelectComponent}
          isSelected={selectedComponentId === component.id}
        />
      </div>
    );
  };

  return (
    <List
      height={height}
      itemCount={components.length}
      itemSize={32} // Height of each tree item
      overscanCount={10} // Render extra items for smooth scrolling
    >
      {ItemRenderer}
    </List>
  );
}
```

**Performance Gains**:
- ✅ Handles 10,000+ components smoothly
- ✅ Constant memory usage regardless of tree size
- ✅ 60 FPS scrolling maintained

### 2. Property Panel Optimization

**Problem**: Complex property panels re-render frequently

**Solution**: Granular memoization and debounced updates

```typescript
// OptimizedPropertyPanel.tsx
import { memo, useCallback, useMemo } from 'react';
import { debounce } from 'lodash';

interface PropertyPanelProps {
  component: Component;
  onPropertyChange: (property: string, value: any) => void;
}

export const PropertyPanel = memo(({ component, onPropertyChange }: PropertyPanelProps) => {
  // Debounce property changes to avoid excessive re-renders
  const debouncedPropertyChange = useCallback(
    debounce((property: string, value: any) => {
      onPropertyChange(property, value);
    }, 150), // 150ms debounce
    [onPropertyChange]
  );

  // Memoize property editors to prevent unnecessary re-renders
  const propertyEditors = useMemo(() => {
    return Object.entries(component.properties).map(([key, property]) => (
      <PropertyEditor
        key={key}
        name={key}
        property={property}
        onChange={(value) => debouncedPropertyChange(key, value)}
      />
    ));
  }, [component.properties, debouncedPropertyChange]);

  return (
    <div className="property-panel">
      <h3>Properties</h3>
      {propertyEditors}
    </div>
  );
});

// Memoized property editor
const PropertyEditor = memo(({ name, property, onChange }) => {
  // Only re-render if this specific property changes
  return (
    <div className="property-editor">
      <label>{name}</label>
      {property.type === 'expression' ? (
        <ExpressionEditor 
          value={property.expression}
          onChange={onChange}
        />
      ) : (
        <input 
          value={property.value}
          onChange={(e) => onChange(e.target.value)}
        />
      )}
    </div>
  );
});
```

### 3. Canvas/Preview Optimization

**Problem**: Preview updates can cause layout thrashing

**Solution**: RAF-based updates and viewport-aware rendering

```typescript
// PreviewManager.ts
class PreviewManager {
  private updateQueue: Set<string> = new Set();
  private isUpdateScheduled = false;

  scheduleUpdate(componentId: string) {
    this.updateQueue.add(componentId);
    
    if (!this.isUpdateScheduled) {
      this.isUpdateScheduled = true;
      requestAnimationFrame(() => {
        this.flushUpdates();
      });
    }
  }

  private flushUpdates() {
    const componentsToUpdate = Array.from(this.updateQueue);
    this.updateQueue.clear();
    this.isUpdateScheduled = false;

    // Batch DOM updates
    componentsToUpdate.forEach(componentId => {
      this.updateComponent(componentId);
    });
  }

  private updateComponent(componentId: string) {
    // Use DocumentFragment for efficient DOM manipulation
    const fragment = document.createDocumentFragment();
    const newElement = this.generateComponentElement(componentId);
    fragment.appendChild(newElement);
    
    // Replace existing element
    const existing = document.getElementById(componentId);
    if (existing) {
      existing.parentNode.replaceChild(fragment, existing);
    }
  }
}
```

---

## Manifest Management Performance

### 1. Efficient Data Structures

**Problem**: Linear searches through component arrays

**Solution**: Indexed data structures with Maps

```typescript
// PerformantManifestManager.ts
class PerformantManifestManager {
  private componentsById = new Map<string, Component>();
  private componentsByParent = new Map<string, Set<string>>();
  private componentsByType = new Map<string, Set<string>>();
  private propertyDependencies = new Map<string, Set<string>>();

  addComponent(parentId: string, component: Component): void {
    // O(1) insertion
    this.componentsById.set(component.id, component);
    
    // Maintain parent-child relationships
    if (!this.componentsByParent.has(parentId)) {
      this.componentsByParent.set(parentId, new Set());
    }
    this.componentsByParent.get(parentId)!.add(component.id);
    
    // Index by type for quick filtering
    if (!this.componentsByType.has(component.type)) {
      this.componentsByType.set(component.type, new Set());
    }
    this.componentsByType.get(component.type)!.add(component.id);
    
    // Index property dependencies
    this.indexPropertyDependencies(component);
  }

  getComponent(id: string): Component | undefined {
    // O(1) lookup
    return this.componentsById.get(id);
  }

  getComponentsByType(type: string): Component[] {
    // O(k) where k is number of components of this type
    const ids = this.componentsByType.get(type) || new Set();
    return Array.from(ids).map(id => this.componentsById.get(id)!);
  }

  getAffectedComponents(propertyPath: string): string[] {
    // O(k) where k is number of dependent components
    const dependents = this.propertyDependencies.get(propertyPath) || new Set();
    return Array.from(dependents);
  }

  private indexPropertyDependencies(component: Component): void {
    Object.values(component.properties).forEach(property => {
      if (property.dependencies) {
        property.dependencies.forEach(dep => {
          if (!this.propertyDependencies.has(dep)) {
            this.propertyDependencies.set(dep, new Set());
          }
          this.propertyDependencies.get(dep)!.add(component.id);
        });
      }
    });
  }
}
```

### 2. Change Detection Optimization

**Problem**: Full manifest diffing on every change

**Solution**: Granular change tracking with dirty flags

```typescript
// ChangeTracker.ts
interface ChangeEvent {
  type: 'component.added' | 'component.removed' | 'property.changed' | 'expression.updated';
  componentId: string;
  property?: string;
  oldValue?: any;
  newValue?: any;
  timestamp: number;
}

class ChangeTracker {
  private changes: ChangeEvent[] = [];
  private affectedComponents = new Set<string>();
  private isDirty = false;

  trackPropertyChange(componentId: string, property: string, oldValue: any, newValue: any): void {
    this.changes.push({
      type: 'property.changed',
      componentId,
      property,
      oldValue,
      newValue,
      timestamp: performance.now()
    });

    this.affectedComponents.add(componentId);
    this.isDirty = true;

    // Schedule regeneration if not already scheduled
    this.scheduleRegeneration();
  }

  private scheduleRegeneration = debounce(() => {
    if (this.isDirty) {
      this.regenerateAffectedComponents();
      this.flushChanges();
    }
  }, 100);

  private regenerateAffectedComponents(): void {
    // Only regenerate components that actually changed
    const componentsToRegenerate = Array.from(this.affectedComponents);
    
    componentsToRegenerate.forEach(componentId => {
      codeGenerator.regenerateComponent(componentId);
    });
  }

  private flushChanges(): void {
    this.changes = [];
    this.affectedComponents.clear();
    this.isDirty = false;
  }
}
```

---

## Expression System Performance

### 1. Expression Compilation Caching

**Problem**: Re-parsing expressions on every evaluation

**Solution**: Compiled expression cache with LRU eviction

```typescript
// ExpressionCache.ts
import LRU from 'lru-cache';

interface CompiledExpression {
  ast: any;
  dependencies: string[];
  evaluate: Function;
  complexity: number;
}

class ExpressionCache {
  private cache = new LRU<string, CompiledExpression>({
    max: 1000, // Cache up to 1000 expressions
    maxAge: 1000 * 60 * 10, // 10 minutes TTL
    length: (expr) => expr.complexity, // Weight by complexity
    dispose: (key, expr) => {
      // Cleanup when evicted
      console.log(`Evicting expression: ${key}`);
    }
  });

  compile(expression: string): CompiledExpression {
    const cached = this.cache.get(expression);
    if (cached) {
      return cached;
    }

    // Compile new expression
    const ast = parse(expression);
    const dependencies = extractDependencies(ast);
    const evaluate = compileToFunction(ast);
    const complexity = calculateComplexity(ast);

    const compiled: CompiledExpression = {
      ast,
      dependencies,
      evaluate,
      complexity
    };

    this.cache.set(expression, compiled);
    return compiled;
  }

  // Precompile frequently used expressions
  precompileCommonExpressions(): void {
    const commonExpressions = [
      'user.name',
      'items.length > 0',
      'theme === "dark"',
      'props.title || "Untitled"'
    ];

    commonExpressions.forEach(expr => {
      this.compile(expr);
    });
  }
}

function calculateComplexity(ast: any): number {
  // Simple heuristic: count nodes in AST
  let complexity = 0;
  
  function traverse(node: any) {
    complexity++;
    if (node.type === 'CallExpression') complexity += 2; // Function calls are expensive
    if (node.type === 'MemberExpression') complexity += 1;
    
    Object.values(node).forEach(child => {
      if (child && typeof child === 'object') {
        traverse(child);
      }
    });
  }
  
  traverse(ast);
  return complexity;
}
```

### 2. Dependency Tracking Optimization

**Problem**: Recalculating all dependent expressions when any value changes

**Solution**: Granular dependency graph with minimal updates

```typescript
// DependencyGraph.ts
class DependencyGraph {
  private dependencies = new Map<string, Set<string>>(); // property -> components
  private reverseDependencies = new Map<string, Set<string>>(); // component -> properties

  addDependency(property: string, componentId: string): void {
    // Forward dependency: property -> components that use it
    if (!this.dependencies.has(property)) {
      this.dependencies.set(property, new Set());
    }
    this.dependencies.get(property)!.add(componentId);

    // Reverse dependency: component -> properties it depends on
    if (!this.reverseDependencies.has(componentId)) {
      this.reverseDependencies.set(componentId, new Set());
    }
    this.reverseDependencies.get(componentId)!.add(property);
  }

  getAffectedComponents(property: string): string[] {
    const affected = this.dependencies.get(property);
    return affected ? Array.from(affected) : [];
  }

  removeComponent(componentId: string): void {
    // Clean up reverse dependencies
    const properties = this.reverseDependencies.get(componentId);
    if (properties) {
      properties.forEach(property => {
        this.dependencies.get(property)?.delete(componentId);
      });
    }
    this.reverseDependencies.delete(componentId);
  }

  // Get minimal update set using topological sort
  getUpdateOrder(changedProperties: string[]): string[] {
    const affected = new Set<string>();
    const queue = [...changedProperties];

    // BFS to find all affected components
    while (queue.length > 0) {
      const property = queue.shift()!;
      const components = this.dependencies.get(property);
      
      if (components) {
        components.forEach(componentId => {
          if (!affected.has(componentId)) {
            affected.add(componentId);
            
            // Add properties this component might affect
            const componentProperties = this.reverseDependencies.get(componentId);
            if (componentProperties) {
              componentProperties.forEach(prop => {
                if (!changedProperties.includes(prop)) {
                  queue.push(prop);
                }
              });
            }
          }
        });
      }
    }

    return Array.from(affected);
  }
}
```

---

## Code Generation Performance

### 1. Incremental Generation

**Problem**: Regenerating entire codebase on small changes

**Solution**: Component-level incremental generation

```typescript
// IncrementalCodeGenerator.ts
class IncrementalCodeGenerator {
  private generatedFiles = new Map<string, GeneratedFile>();
  private dependencyGraph = new CodeDependencyGraph();

  async generateProject(manifest: Manifest): Promise<GeneratedProject> {
    const startTime = performance.now();
    
    // Only regenerate components that changed
    const changedComponents = this.getChangedComponents(manifest);
    const affectedComponents = this.dependencyGraph.getAffectedComponents(changedComponents);
    
    console.log(`Regenerating ${affectedComponents.length} of ${Object.keys(manifest.components).length} components`);

    // Parallel generation for independent components
    const generationPromises = affectedComponents.map(componentId => 
      this.generateComponent(manifest.components[componentId])
    );

    const results = await Promise.all(generationPromises);
    
    // Update file cache
    results.forEach(({ componentId, code }) => {
      this.generatedFiles.set(`${componentId}.jsx`, {
        content: code,
        lastGenerated: Date.now(),
        checksum: this.calculateChecksum(code)
      });
    });

    const totalTime = performance.now() - startTime;
    console.log(`Code generation completed in ${totalTime.toFixed(2)}ms`);

    return this.buildProject();
  }

  private async generateComponent(component: Component): Promise<{ componentId: string; code: string }> {
    // Check if component actually needs regeneration
    const existingFile = this.generatedFiles.get(`${component.id}.jsx`);
    const componentChecksum = this.calculateComponentChecksum(component);
    
    if (existingFile && existingFile.componentChecksum === componentChecksum) {
      return { componentId: component.id, code: existingFile.content };
    }

    // Generate new code
    const startTime = performance.now();
    const code = await this.generateComponentCode(component);
    const generationTime = performance.now() - startTime;

    // Track performance metrics
    this.trackGenerationMetrics(component.id, generationTime, code.length);

    return { componentId: component.id, code };
  }

  private trackGenerationMetrics(componentId: string, time: number, size: number): void {
    const metrics = {
      componentId,
      generationTime: time,
      codeSize: size,
      complexity: this.calculateComponentComplexity(componentId),
      timestamp: Date.now()
    };

    // Store metrics for performance analysis
    this.performanceMetrics.push(metrics);
    
    // Warn about slow generation
    if (time > 100) {
      console.warn(`Slow component generation: ${componentId} took ${time.toFixed(2)}ms`);
    }
  }
}
```

### 2. Template Optimization

**Problem**: String concatenation is slow for large components

**Solution**: Template AST compilation

```typescript
// TemplateCompiler.ts
interface TemplateNode {
  type: 'text' | 'expression' | 'loop' | 'conditional';
  content: string;
  children?: TemplateNode[];
}

class TemplateCompiler {
  private compiledTemplates = new Map<string, CompiledTemplate>();

  compile(templateString: string): CompiledTemplate {
    const cached = this.compiledTemplates.get(templateString);
    if (cached) return cached;

    // Parse template into AST
    const ast = this.parseTemplate(templateString);
    
    // Compile to optimized function
    const renderFunction = this.compileToFunction(ast);
    
    const compiled: CompiledTemplate = {
      ast,
      render: renderFunction,
      dependencies: this.extractDependencies(ast)
    };

    this.compiledTemplates.set(templateString, compiled);
    return compiled;
  }

  private compileToFunction(ast: TemplateNode[]): (context: any) => string {
    // Generate optimized render function
    const functionBody = this.generateFunctionBody(ast);
    
    return new Function('context', `
      const { component, properties, globalFunctions } = context;
      ${functionBody}
    `) as (context: any) => string;
  }

  private generateFunctionBody(nodes: TemplateNode[]): string {
    return nodes.map(node => {
      switch (node.type) {
        case 'text':
          return `result += ${JSON.stringify(node.content)};`;
        case 'expression':
          return `result += String(${node.content});`;
        case 'conditional':
          return `if (${node.content}) { ${this.generateFunctionBody(node.children!)} }`;
        case 'loop':
          return `for (const item of ${node.content}) { ${this.generateFunctionBody(node.children!)} }`;
        default:
          return '';
      }
    }).join('\n');
  }
}
```

---

## Memory Management

### 1. Component Lifecycle Management

**Problem**: Memory leaks from event listeners and watchers

**Solution**: Automatic cleanup with WeakRef tracking

```typescript
// MemoryManager.ts
class MemoryManager {
  private componentRefs = new Map<string, WeakRef<Component>>();
  private eventListeners = new Map<string, Set<() => void>>();
  private watchers = new Map<string, Set<() => void>>();

  registerComponent(component: Component): void {
    this.componentRefs.set(component.id, new WeakRef(component));
    
    // Setup automatic cleanup
    this.setupCleanupWatcher(component.id);
  }

  private setupCleanupWatcher(componentId: string): void {
    const cleanup = () => {
      // Clean up event listeners
      const listeners = this.eventListeners.get(componentId);
      if (listeners) {
        listeners.forEach(removeListener => removeListener());
        this.eventListeners.delete(componentId);
      }

      // Clean up watchers
      const watchers = this.watchers.get(componentId);
      if (watchers) {
        watchers.forEach(stopWatcher => stopWatcher());
        this.watchers.delete(componentId);
      }

      this.componentRefs.delete(componentId);
    };

    // Use FinalizationRegistry for automatic cleanup
    const registry = new FinalizationRegistry((id: string) => {
      console.log(`Automatically cleaning up component: ${id}`);
      cleanup();
    });

    const componentRef = this.componentRefs.get(componentId);
    if (componentRef?.deref()) {
      registry.register(componentRef.deref()!, componentId);
    }
  }

  addEventListener(componentId: string, removeListener: () => void): void {
    if (!this.eventListeners.has(componentId)) {
      this.eventListeners.set(componentId, new Set());
    }
    this.eventListeners.get(componentId)!.add(removeListener);
  }

  // Periodic cleanup of dead references
  performGarbageCollection(): void {
    const deadComponents: string[] = [];

    this.componentRefs.forEach((ref, id) => {
      if (!ref.deref()) {
        deadComponents.push(id);
      }
    });

    deadComponents.forEach(id => {
      console.log(`Cleaning up dead component: ${id}`);
      this.cleanupComponent(id);
    });

    console.log(`Cleaned up ${deadComponents.length} dead components`);
  }
}
```

### 2. Large Project Optimization

**Problem**: Memory usage grows linearly with project size

**Solution**: Lazy loading and pagination

```typescript
// LazyProjectManager.ts
class LazyProjectManager {
  private loadedComponents = new Map<string, Component>();
  private componentIndex = new Map<string, ComponentMetadata>();
  private loadQueue = new Set<string>();

  async loadProject(projectPath: string): Promise<Project> {
    // Load only metadata initially
    const manifest = await this.loadManifestMetadata(projectPath);
    
    // Build lightweight index
    Object.entries(manifest.components).forEach(([id, component]) => {
      this.componentIndex.set(id, {
        id,
        displayName: component.displayName,
        type: component.type,
        hasChildren: Boolean(component.children?.length),
        parentId: this.findParentId(id, manifest),
        fileSize: 0 // Will be loaded on demand
      });
    });

    // Load root components immediately
    await this.loadRootComponents(manifest);

    return {
      metadata: manifest.metadata,
      componentIndex: this.componentIndex,
      loadedComponents: this.loadedComponents
    };
  }

  async getComponent(id: string): Promise<Component> {
    // Return from cache if already loaded
    if (this.loadedComponents.has(id)) {
      return this.loadedComponents.get(id)!;
    }

    // Load component on demand
    return this.loadComponent(id);
  }

  private async loadComponent(id: string): Promise<Component> {
    if (this.loadQueue.has(id)) {
      // Already loading, wait for completion
      return this.waitForComponentLoad(id);
    }

    this.loadQueue.add(id);

    try {
      const component = await this.loadComponentFromDisk(id);
      this.loadedComponents.set(id, component);
      
      // Preload immediate children
      if (component.children) {
        this.preloadComponents(component.children.slice(0, 5)); // Load first 5 children
      }

      return component;
    } finally {
      this.loadQueue.delete(id);
    }
  }

  private preloadComponents(componentIds: string[]): void {
    // Load components in background
    componentIds.forEach(id => {
      if (!this.loadedComponents.has(id) && !this.loadQueue.has(id)) {
        setTimeout(() => this.loadComponent(id), 0);
      }
    });
  }
}
```

---

## Preview Performance

### 1. Hot Module Replacement Optimization

**Problem**: Full page reloads are slow for large applications

**Solution**: Granular HMR with React Fast Refresh

```typescript
// HMRManager.ts
class HMRManager {
  private moduleGraph = new Map<string, Set<string>>();
  private componentToModule = new Map<string, string>();

  updateComponent(componentId: string, newCode: string): void {
    const modulePath = this.componentToModule.get(componentId);
    if (!modulePath) return;

    // Check if this is a hot-reloadable change
    if (this.isHotReloadable(componentId, newCode)) {
      this.performHotUpdate(modulePath, newCode);
    } else {
      this.performFullReload();
    }
  }

  private isHotReloadable(componentId: string, newCode: string): boolean {
    // Check if only component body changed, not interface
    const existingComponent = this.loadedComponents.get(componentId);
    const newComponent = this.parseComponent(newCode);

    return (
      existingComponent &&
      this.propsSignatureMatches(existingComponent, newComponent) &&
      this.stateSignatureMatches(existingComponent, newComponent)
    );
  }

  private performHotUpdate(modulePath: string, newCode: string): void {
    // Use Vite's HMR API
    const hmrPort = this.getHMRPort();
    
    hmrPort.send({
      type: 'update',
      updates: [{
        type: 'js-update',
        path: modulePath,
        acceptedPath: modulePath,
        timestamp: Date.now()
      }]
    });

    // Update module content
    this.writeModuleFile(modulePath, newCode);
  }

  // Track module dependencies for minimal updates
  private buildModuleGraph(manifest: Manifest): void {
    Object.values(manifest.components).forEach(component => {
      const modulePath = this.getModulePath(component.id);
      const dependencies = new Set<string>();

      // Add component dependencies
      if (component.children) {
        component.children.forEach(childId => {
          dependencies.add(this.getModulePath(childId));
        });
      }

      // Add global function dependencies
      Object.values(component.properties).forEach(property => {
        if (property.dependencies) {
          property.dependencies.forEach(dep => {
            if (dep.startsWith('globalFunctions.')) {
              dependencies.add('./utils/globalFunctions.js');
            }
          });
        }
      });

      this.moduleGraph.set(modulePath, dependencies);
    });
  }
}
```

### 2. Viewport-based Rendering

**Problem**: Rendering all components even when not visible

**Solution**: Intersection Observer-based lazy rendering

```typescript
// ViewportRenderer.tsx
import { useIntersectionObserver } from './hooks/useIntersectionObserver';

interface ViewportComponentProps {
  component: Component;
  renderComponent: (component: Component) => JSX.Element;
}

export function ViewportComponent({ component, renderComponent }: ViewportComponentProps) {
  const [ref, isVisible] = useIntersectionObserver({
    threshold: 0.1,
    rootMargin: '50px' // Start loading 50px before entering viewport
  });

  return (
    <div ref={ref} className="viewport-component">
      {isVisible ? (
        renderComponent(component)
      ) : (
        <ComponentPlaceholder component={component} />
      )}
    </div>
  );
}

function ComponentPlaceholder({ component }: { component: Component }) {
  return (
    <div 
      className="component-placeholder"
      style={{
        height: component.estimatedHeight || 100,
        backgroundColor: '#f3f4f6',
        border: '1px dashed #d1d5db',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}
    >
      <span className="text-gray-500">
        {component.displayName} (not loaded)
      </span>
    </div>
  );
}

// Custom hook for intersection observer
function useIntersectionObserver(options: IntersectionObserverInit) {
  const [isVisible, setIsVisible] = useState(false);
  const [ref, setRef] = useState<Element | null>(null);

  useEffect(() => {
    if (!ref) return;

    const observer = new IntersectionObserver(
      ([entry]) => setIsVisible(entry.isIntersecting),
      options
    );

    observer.observe(ref);

    return () => observer.disconnect();
  }, [ref, options]);

  return [setRef, isVisible] as const;
}
```

---

## Monitoring & Profiling

### 1. Performance Metrics Collection

```typescript
// PerformanceMonitor.ts
interface PerformanceMetric {
  name: string;
  value: number;
  timestamp: number;
  metadata?: Record<string, any>;
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private observers = new Map<string, PerformanceObserver>();

  startMonitoring(): void {
    // Monitor paint metrics
    this.observePerformanceEntries('paint', (entries) => {
      entries.forEach(entry => {
        this.recordMetric(entry.name, entry.startTime);
      });
    });

    // Monitor navigation timing
    this.observePerformanceEntries('navigation', (entries) => {
      entries.forEach(entry => {
        this.recordMetric('dom-interactive', entry.domInteractive);
        this.recordMetric('dom-complete', entry.domComplete);
        this.recordMetric('load-complete', entry.loadEventEnd);
      });
    });

    // Monitor memory usage
    this.startMemoryMonitoring();

    // Monitor user interactions
    this.startInteractionMonitoring();
  }

  private startMemoryMonitoring(): void {
    setInterval(() => {
      if ('memory' in performance) {
        const memory = (performance as any).memory;
        this.recordMetric('heap-used', memory.usedJSHeapSize);
        this.recordMetric('heap-total', memory.totalJSHeapSize);
        this.recordMetric('heap-limit', memory.jsHeapSizeLimit);
      }
    }, 5000); // Every 5 seconds
  }

  private startInteractionMonitoring(): void {
    // Monitor component selection time
    this.on('component:select:start', (componentId: string) => {
      const startTime = performance.now();
      
      this.once('component:select:complete', () => {
        const duration = performance.now() - startTime;
        this.recordMetric('component-select-time', duration, { componentId });
      });
    });

    // Monitor property change time
    this.on('property:change:start', ({ componentId, property }: any) => {
      const startTime = performance.now();
      
      this.once('property:change:complete', () => {
        const duration = performance.now() - startTime;
        this.recordMetric('property-change-time', duration, { componentId, property });
      });
    });
  }

  recordMetric(name: string, value: number, metadata?: Record<string, any>): void {
    this.metrics.push({
      name,
      value,
      timestamp: Date.now(),
      metadata
    });

    // Keep only last 1000 metrics to prevent memory bloat
    if (this.metrics.length > 1000) {
      this.metrics = this.metrics.slice(-1000);
    }

    // Check for performance regressions
    this.checkForRegressions(name, value);
  }

  private checkForRegressions(name: string, value: number): void {
    const recent = this.metrics
      .filter(m => m.name === name && m.timestamp > Date.now() - 60000) // Last minute
      .map(m => m.value);

    if (recent.length < 5) return; // Need at least 5 samples

    const average = recent.reduce((a, b) => a + b, 0) / recent.length;
    const threshold = this.getThreshold(name);

    if (value > average * 2 && value > threshold) {
      console.warn(`Performance regression detected: ${name} = ${value}ms (avg: ${average.toFixed(2)}ms)`);
      
      // Could trigger alerts or automatic optimization
      this.handlePerformanceRegression(name, value, average);
    }
  }

  getPerformanceReport(): PerformanceReport {
    const now = Date.now();
    const lastHour = this.metrics.filter(m => m.timestamp > now - 3600000);

    return {
      timeRange: '1h',
      totalMetrics: lastHour.length,
      averages: this.calculateAverages(lastHour),
      regressions: this.findRegressions(lastHour),
      recommendations: this.generateRecommendations(lastHour)
    };
  }
}
```

### 2. Automated Optimization

```typescript
// AutoOptimizer.ts
class AutoOptimizer {
  private optimizationHistory = new Map<string, OptimizationResult>();

  async optimizeProject(manifest: Manifest): Promise<OptimizationResult> {
    const optimizations: Optimization[] = [];

    // Analyze component complexity
    const complexComponents = this.findComplexComponents(manifest);
    if (complexComponents.length > 0) {
      optimizations.push({
        type: 'component-splitting',
        description: `Split ${complexComponents.length} complex components`,
        impact: 'medium',
        apply: () => this.splitComplexComponents(complexComponents)
      });
    }

    // Analyze expression performance
    const slowExpressions = this.findSlowExpressions(manifest);
    if (slowExpressions.length > 0) {
      optimizations.push({
        type: 'expression-caching',
        description: `Cache ${slowExpressions.length} expensive expressions`,
        impact: 'high',
        apply: () => this.cacheSlowExpressions(slowExpressions)
      });
    }

    // Analyze bundle size
    const bundleSize = await this.estimateBundleSize(manifest);
    if (bundleSize > 500 * 1024) { // 500KB threshold
      optimizations.push({
        type: 'code-splitting',
        description: 'Add code splitting for large components',
        impact: 'high',
        apply: () => this.addCodeSplitting(manifest)
      });
    }

    return {
      optimizations,
      estimatedImprovement: this.calculateEstimatedImprovement(optimizations),
      timeToApply: this.estimateApplicationTime(optimizations)
    };
  }

  private findComplexComponents(manifest: Manifest): Component[] {
    return Object.values(manifest.components).filter(component => {
      const complexity = this.calculateComponentComplexity(component);
      return complexity > 100; // Threshold for "complex"
    });
  }

  private calculateComponentComplexity(component: Component): number {
    let complexity = 0;
    
    // Properties add complexity
    complexity += Object.keys(component.properties || {}).length * 2;
    
    // Children add complexity
    complexity += (component.children || []).length * 5;
    
    // Expressions add complexity
    Object.values(component.properties || {}).forEach(property => {
      if (property.type === 'expression') {
        complexity += this.calculateExpressionComplexity(property.expression);
      }
    });
    
    return complexity;
  }

  private async addCodeSplitting(manifest: Manifest): Promise<void> {
    // Identify components that should be code-split
    const largComponents = Object.values(manifest.components)
      .filter(component => this.estimateComponentSize(component) > 50 * 1024) // 50KB
      .map(component => component.id);

    // Generate lazy-loaded imports
    largComponents.forEach(componentId => {
      this.generateLazyImport(componentId);
    });
  }

  private generateLazyImport(componentId: string): void {
    // Convert:
    // import UserCard from './UserCard';
    // 
    // To:
    // const UserCard = lazy(() => import('./UserCard'));
    
    console.log(`Converting ${componentId} to lazy-loaded component`);
  }
}
```

---

## Platform-Specific Optimizations

### 1. Electron-Specific Optimizations

```typescript
// ElectronOptimizations.ts
class ElectronOptimizations {
  optimizeForElectron(): void {
    // Enable V8 optimizations
    app.commandLine.appendSwitch('--max-old-space-size', '4096');
    app.commandLine.appendSwitch('--optimize-for-size');
    
    // Optimize main process
    this.optimizeMainProcess();
    
    // Optimize renderer processes
    this.optimizeRendererProcesses();
  }

  private optimizeMainProcess(): void {
    // Use worker threads for heavy operations
    const codeGenWorker = new Worker('./workers/codeGeneration.js');
    const manifestWorker = new Worker('./workers/manifestProcessing.js');

    // Preload frequently used modules
    this.preloadModules([
      'path',
      'fs/promises',
      'crypto'
    ]);
  }

  private optimizeRendererProcesses(): void {
    // Enable context isolation
    new BrowserWindow({
      webPreferences: {
        contextIsolation: true,
        nodeIntegration: false,
        preload: path.join(__dirname, 'preload.js')
      }
    });

    // Use shared worker for heavy computations
    this.setupSharedWorkers();
  }
}
```

### 2. Web-Specific Optimizations

```typescript
// WebOptimizations.ts
class WebOptimizations {
  optimizeForWeb(): void {
    // Enable service worker for caching
    this.enableServiceWorker();
    
    // Setup Web Workers for heavy tasks
    this.setupWebWorkers();
    
    // Enable compression
    this.enableCompression();
  }

  private enableServiceWorker(): void {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').then(() => {
        console.log('Service Worker registered for caching');
      });
    }
  }

  private setupWebWorkers(): void {
    // Code generation in Web Worker
    const codeGenWorker = new Worker('/workers/codeGeneration.js');
    
    // Expression evaluation in Web Worker
    const expressionWorker = new Worker('/workers/expressionEval.js');
    
    // Manifest processing in Web Worker
    const manifestWorker = new Worker('/workers/manifestProcessing.js');
  }
}
```

---

## Performance Best Practices

### 1. Development Guidelines

✅ **DO**:
- Use `React.memo()` for components that re-render frequently
- Implement virtual scrolling for large lists (>100 items)
- Debounce user input events (typing, dragging)
- Cache computed values with `useMemo()`
- Use Web Workers for heavy computations
- Implement lazy loading for large components
- Monitor bundle size and code-split when needed

❌ **DON'T**:
- Create new objects/functions in render methods
- Use inline styles or className concatenation
- Re-parse expressions on every render
- Keep large objects in component state
- Synchronously execute expensive operations
- Ignore memory leaks from event listeners

### 2. Code Generation Best Practices

✅ **DO**:
- Generate optimized React code (memo, useMemo, useCallback)
- Include source maps for debugging
- Use incremental generation for large projects
- Cache compiled templates
- Generate TypeScript when possible
- Include performance comments in generated code

❌ **DON'T**:
- Generate unnecessary re-renders
- Create circular dependencies
- Include unused imports
- Generate synchronous code for async operations
- Ignore ESLint warnings in generated code

---

## Conclusion

Rise's performance strategy ensures scalability from small prototypes to enterprise applications through:

⚡ **Optimized Rendering**: Virtual scrolling, viewport-based rendering, granular updates  
🧠 **Smart Caching**: Expression compilation, template caching, incremental generation  
📊 **Proactive Monitoring**: Real-time metrics, regression detection, automated optimization  
🔧 **Platform Optimization**: Electron and web-specific optimizations  
📈 **Scalable Architecture**: O(1) lookups, lazy loading, efficient data structures

The result is a visual development tool that stays responsive and performant regardless of project complexity.

---

**See Also**:
- [Architecture](./ARCHITECTURE.md) - System design for performance  
- [Testing Strategy](./TESTING_STRATEGY.md) - Performance testing approach
- [MVP Roadmap](./MVP_ROADMAP.md) - Performance milestones and targets

---

**Last Updated**: October 25, 2025  
**Performance Strategy**: Multi-layer optimization  
**Status**: ✅ Ready for Implementation