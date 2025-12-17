/**
 * @file ProjectManager.ts
 * @description Core project management orchestrator for Catalyst
 * 
 * CENTRAL COORDINATOR for all project operations including:
 * - Creating new projects with templates
 * - Managing recent projects list
 * - Project validation and security checks
 * - npm dependency installation
 * - File system operations
 * 
 * This class is instantiated once in the main process and accessed
 * via IPC from the renderer process.
 * 
 * @architecture Phase 1, Task 1.3A - Core Project Creation
 * @created 2025-11-19
 * @author AI (Cline) + Human Review
 * @confidence 8/10 - Comprehensive, but npm install needs real-world testing
 * 
 * @see .implementation/phase-1-application-shell/task-1.3A-core-project-creation.md
 * @see docs/FILE_STRUCTURE_SPEC.md - Project directory structure
 * 
 * @security-critical true - Manages file system operations
 * @performance-critical false - Operations are infrequent
 */

import * as path from 'path';
import * as fs from 'fs/promises';
import { spawn } from 'child_process';
import { app } from 'electron';
import { v4 as uuidv4 } from 'uuid';
import { ProjectValidator } from './ProjectValidator';
import {
  Project,
  CreateProjectParams,
  RecentProject,
  RecentProjectsData,
  Result,
  InstallProgress,
  InstallStep,
  ProjectSettings,
  ValidationError,
  ValidationWarning,
} from './types';

/**
 * ProjectManager - Central orchestrator for project operations
 * 
 * PROBLEM SOLVED:
 * Users need a reliable, secure way to create and manage Catalyst projects.
 * This class provides:
 * - Validated project creation
 * - Secure file operations
 * - Recent projects tracking
 * - Dependency installation
 * 
 * SOLUTION:
 * Single manager class that coordinates all project operations.
 * Uses ProjectValidator for security, ProjectTemplates for generation.
 * Persists recent projects to app data directory.
 * 
 * DESIGN DECISIONS:
 * - Singleton pattern (one instance in main process)
 * - Async/await for all I/O operations
 * - Result<T, E> return type for error handling
 * - Events for progress updates (npm install)
 * - Recent projects stored as JSON (max 10)
 * 
 * USAGE EXAMPLE:
 * ```typescript
 * const manager = new ProjectManager();
 * await manager.initialize();
 * 
 * const result = await manager.createProject({
 *   name: 'my-app',
 *   location: '/Users/richard/projects',
 *   framework: 'react',
 *   template: 'basic'
 * });
 * 
 * if (result.success) {
 *   console.log('Created:', result.data.path);
 * }
 * ```
 * 
 * @class ProjectManager
 */
export class ProjectManager {
  private validator: ProjectValidator;
  private currentProject: Project | null = null;
  private recentProjectsPath: string;
  private readonly MAX_RECENT_PROJECTS = 10;
  
  // Event callback for npm install progress
  // Set this to receive progress updates
  public onInstallProgress?: (progress: InstallProgress) => void;

  /**
   * Initialize ProjectManager
   * 
   * Call this once during app startup before using any methods.
   * Sets up paths and loads recent projects.
   */
  constructor() {
    this.validator = new ProjectValidator();
    
    // Recent projects stored in app data directory
    // macOS: ~/Library/Application Support/Catalyst/recent-projects.json
    // Windows: %APPDATA%/Catalyst/recent-projects.json
    // Linux: ~/.config/Catalyst/recent-projects.json
    const userDataPath = app.getPath('userData');
    this.recentProjectsPath = path.join(userDataPath, 'recent-projects.json');
    
    console.log('[ProjectManager] Initialized');
    console.log('[ProjectManager] Recent projects path:', this.recentProjectsPath);
  }

  /**
   * Initialize the project manager (async setup)
   * 
   * Ensures userData directory exists and recent projects file is created.
   * Safe to call multiple times (idempotent).
   * 
   * @returns Promise that resolves when initialization complete
   * @async
   */
  async initialize(): Promise<void> {
    try {
      // Ensure userData directory exists
      const userDataPath = app.getPath('userData');
      await fs.mkdir(userDataPath, { recursive: true });
      
      // Ensure recent projects file exists
      try {
        await fs.access(this.recentProjectsPath);
      } catch {
        // File doesn't exist, create empty recent projects list
        const emptyData: RecentProjectsData = {
          recentProjects: [],
          maxRecentProjects: this.MAX_RECENT_PROJECTS,
          version: '1.0.0',
        };
        
        await fs.writeFile(
          this.recentProjectsPath,
          JSON.stringify(emptyData, null, 2),
          'utf-8'
        );
        
        console.log('[ProjectManager] Created recent projects file');
      }
      
      console.log('[ProjectManager] Initialization complete');
    } catch (error) {
      console.error('[ProjectManager] Initialization failed:', error);
      throw error;
    }
  }

  /**
   * Create a new Catalyst project
   * 
   * WORKFLOW:
   * 1. Validate project name
   * 2. Validate project path
   * 3. Create project directory
   * 4. Generate all template files
   * 5. Initialize git (optional)
   * 6. Install npm dependencies
   * 7. Add to recent projects
   * 8. Set as current project
   * 
   * @param params - Project creation parameters
   * @returns Promise with Result containing Project or Error
   * 
   * @throws Never throws - returns errors in Result
   * 
   * @example
   * ```typescript
   * const result = await manager.createProject({
   *   name: 'my-app',
   *   location: '/Users/richard/projects',
   *   framework: 'react',
   *   template: 'basic'
   * });
   * 
   * if (result.success) {
   *   console.log('Project created at:', result.data.path);
   * } else {
   *   console.error('Failed:', result.error.message);
   * }
   * ```
   * 
   * @async
   */
  async createProject(
    params: CreateProjectParams
  ): Promise<Result<Project, Error>> {
    try {
      console.log('[ProjectManager] Creating project:', params.name);
      
      // 1. Validate project name
      const nameValidation = this.validator.validateProjectName(params.name);
      if (!nameValidation.isValid) {
        const error = nameValidation.errors[0];
        return {
          success: false,
          error: new Error(`Invalid project name: ${error.message}`),
        };
      }
      
      // 2. Construct and validate project path
      // Project will be: {location}/{name}
      const projectPath = path.join(params.location, params.name);
      
      const pathValidation = await this.validator.validatePath(projectPath);
      if (!pathValidation.isValid) {
        const error = pathValidation.errors[0];
        return {
          success: false,
          error: new Error(`Invalid project path: ${error.message}`),
        };
      }
      
      // Log warnings (non-blocking)
      if (pathValidation.warnings && pathValidation.warnings.length > 0) {
        pathValidation.warnings.forEach(warning => {
          console.warn('[ProjectManager]', warning.message);
        });
      }
      
      // 3. Create project directory
      console.log('[ProjectManager] Creating directory:', projectPath);
      await fs.mkdir(projectPath, { recursive: true });
      
      // 4. Generate project from template
      console.log('[ProjectManager] Generating template files...');
      await this.generateProjectTemplate(projectPath, params);
      
      // 5. Initialize git (optional)
      if (params.initGit) {
        console.log('[ProjectManager] Initializing git repository...');
        await this.initializeGitRepo(projectPath);
      }
      
      // 6. Install npm dependencies
      console.log('[ProjectManager] Installing dependencies...');
      await this.installDependencies(projectPath);
      
      // 7. Create Project object
      const project: Project = {
        id: uuidv4(),
        name: params.name,
        path: projectPath,
        framework: params.framework,
        schemaVersion: '1.0.0',
        createdAt: new Date(),
        lastOpenedAt: new Date(),
      };
      
      // 8. Add to recent projects
      await this.addToRecentProjects(project);
      
      // 9. Set as current project
      this.currentProject = project;
      
      console.log('[ProjectManager] Project created successfully:', project.id);
      
      return {
        success: true,
        data: project,
      };
      
    } catch (error) {
      console.error('[ProjectManager] Failed to create project:', error);
      
      return {
        success: false,
        error: error instanceof Error ? error : new Error(String(error)),
      };
    }
  }

  /**
   * Generate project files from template
   * 
   * Creates all necessary files for a new React + Vite project:
   * - package.json
   * - vite.config.ts
   * - tsconfig.json
   * - index.html
   * - src/App.tsx
   * - src/main.tsx
   * - .lowcode/manifest.json
   * - .lowcode/settings.json
   * - .gitignore
   * - README.md
   * 
   * TIMING: This should be fast (<1 second for all files)
   * 
   * @param projectPath - Absolute path to project directory
   * @param params - Project creation parameters
   * @returns Promise that resolves when complete
   * 
   * @private
   * @async
   */
  private async generateProjectTemplate(
    projectPath: string,
    params: CreateProjectParams
  ): Promise<void> {
    // We'll use a dedicated ProjectTemplates class in the next iteration
    // For now, inline generation to keep things moving
    
    // Create .lowcode directory
    const lowcodeDir = path.join(projectPath, '.lowcode');
    await fs.mkdir(lowcodeDir, { recursive: true });
    
    // Create src directory
    const srcDir = path.join(projectPath, 'src');
    await fs.mkdir(srcDir, { recursive: true });
    
    // Create public directory
    const publicDir = path.join(projectPath, 'public');
    await fs.mkdir(publicDir, { recursive: true });
    
    // Generate manifest.json (empty for clean start)
    // NOTE: Start with empty components - user will add their own
    // Using actual HTML elements (div, button, etc.) rather than abstract types
    const manifest = {
      schemaVersion: '1.0.0',
      level: 1,
      metadata: {
        projectName: params.name,
        framework: params.framework,
        createdAt: new Date().toISOString(),
        modifiedAt: new Date().toISOString(),
      },
      // Start with no components - user adds them via the UI
      components: {},
    };
    
    await fs.writeFile(
      path.join(lowcodeDir, 'manifest.json'),
      JSON.stringify(manifest, null, 2),
      'utf-8'
    );
    
    // Generate settings.json
    const settings = {
      defaultPort: 5173,
      autoSave: true,
      theme: 'system',
      showHiddenFiles: false,
      strictMode: true,
    };
    
    await fs.writeFile(
      path.join(lowcodeDir, 'settings.json'),
      JSON.stringify(settings, null, 2),
      'utf-8'
    );
    
    // Generate package.json
    // Include Tailwind CSS and dependencies for styling
    const packageJson = {
      name: params.name,
      private: true,
      version: '0.1.0',
      type: 'module',
      scripts: {
        dev: 'vite',
        build: 'tsc && vite build',
        preview: 'vite preview',
      },
      dependencies: {
        react: '^18.2.0',
        'react-dom': '^18.2.0',
      },
      devDependencies: {
        '@types/react': '^18.2.43',
        '@types/react-dom': '^18.2.17',
        '@vitejs/plugin-react': '^4.2.1',
        autoprefixer: '^10.4.16',
        postcss: '^8.4.32',
        tailwindcss: '^3.4.0',
        typescript: '^5.3.3',
        vite: '^5.0.8',
      },
    };
    
    await fs.writeFile(
      path.join(projectPath, 'package.json'),
      JSON.stringify(packageJson, null, 2),
      'utf-8'
    );
    
    // Generate vite.config.ts
    const viteConfig = `import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
  },
})
`;
    
    await fs.writeFile(
      path.join(projectPath, 'vite.config.ts'),
      viteConfig,
      'utf-8'
    );
    
    // Generate tsconfig.json
    const tsconfig = {
      compilerOptions: {
        target: 'ES2020',
        useDefineForClassFields: true,
        lib: ['ES2020', 'DOM', 'DOM.Iterable'],
        module: 'ESNext',
        skipLibCheck: true,
        moduleResolution: 'bundler',
        allowImportingTsExtensions: true,
        resolveJsonModule: true,
        isolatedModules: true,
        noEmit: true,
        jsx: 'react-jsx',
        strict: true,
        noUnusedLocals: true,
        noUnusedParameters: true,
        noFallthroughCasesInSwitch: true,
      },
      include: ['src'],
      references: [{ path: './tsconfig.node.json' }],
    };
    
    await fs.writeFile(
      path.join(projectPath, 'tsconfig.json'),
      JSON.stringify(tsconfig, null, 2),
      'utf-8'
    );
    
    // Generate tsconfig.node.json
    const tsconfigNode = {
      compilerOptions: {
        composite: true,
        skipLibCheck: true,
        module: 'ESNext',
        moduleResolution: 'bundler',
        allowSyntheticDefaultImports: true,
      },
      include: ['vite.config.ts'],
    };
    
    await fs.writeFile(
      path.join(projectPath, 'tsconfig.node.json'),
      JSON.stringify(tsconfigNode, null, 2),
      'utf-8'
    );
    
    // Generate index.html
    // NOTE: Uses .jsx extension to match code generator output (not .tsx)
    const indexHtml = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${params.name}</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
`;
    
    await fs.writeFile(
      path.join(projectPath, 'index.html'),
      indexHtml,
      'utf-8'
    );
    
    // Generate src/App.jsx (uses .jsx to match code generator output)
    const appJsx = `import React from 'react'
import './App.css'

function App() {
  return (
    <div className="app-container">
      <h1>Welcome to Catalyst</h1>
      <p>Your project <strong>${params.name}</strong> is ready!</p>
      <p className="info">
        Start building your workflow by adding nodes in Catalyst.
      </p>
    </div>
  )
}

export default App
`;
    
    await fs.writeFile(
      path.join(srcDir, 'App.jsx'),
      appJsx,
      'utf-8'
    );
    
    // Generate src/main.jsx (uses .jsx to match code generator output)
    const mainJsx = `import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
`;
    
    await fs.writeFile(
      path.join(srcDir, 'main.jsx'),
      mainJsx,
      'utf-8'
    );
    
    // Generate src/App.css
    const appCss = `.app-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
  text-align: center;
}

h1 {
  font-size: 3rem;
  margin-bottom: 1rem;
  color: #333;
}

p {
  font-size: 1.2rem;
  margin-bottom: 1rem;
  color: #666;
}

.info {
  margin-top: 2rem;
  padding: 1rem;
  background: #f0f0f0;
  border-radius: 8px;
}
`;
    
    await fs.writeFile(
      path.join(srcDir, 'App.css'),
      appCss,
      'utf-8'
    );
    
    // Generate src/index.css with Tailwind directives
    // IMPORTANT: These directives are required for Tailwind to work
    const indexCss = `@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  font-family: Inter, system-ui, Avenir, Helvetica, Arial, sans-serif;
  line-height: 1.5;
  font-weight: 400;
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  min-height: 100vh;
}

#root {
  width: 100%;
}
`;
    
    await fs.writeFile(
      path.join(srcDir, 'index.css'),
      indexCss,
      'utf-8'
    );
    
    // Generate tailwind.config.js
    const tailwindConfig = `/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
`;
    
    await fs.writeFile(
      path.join(projectPath, 'tailwind.config.js'),
      tailwindConfig,
      'utf-8'
    );
    
    // Generate postcss.config.js
    const postcssConfig = `export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
`;
    
    await fs.writeFile(
      path.join(projectPath, 'postcss.config.js'),
      postcssConfig,
      'utf-8'
    );
    
    // Generate .gitignore
    const gitignore = `# Logs
logs
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*
pnpm-debug.log*
lerna-debug.log*

node_modules
dist
dist-ssr
*.local

# Editor directories and files
.vscode/*
!.vscode/extensions.json
.idea
.DS_Store
*.suo
*.ntvs*
*.njsproj
*.sln
*.sw?
`;
    
    await fs.writeFile(
      path.join(projectPath, '.gitignore'),
      gitignore,
      'utf-8'
    );
    
    // Generate README.md
    const readme = `# ${params.name}

A workflow automation project built with Catalyst - an AI-powered visual workflow builder.

## Getting Started

This project was created with Catalyst and generates Python + FastAPI code.

### Development

\`\`\`bash
npm run dev
\`\`\`

### Build

\`\`\`bash
npm run build
\`\`\`

### Preview

\`\`\`bash
npm run preview
\`\`\`

## Project Structure

- \`.lowcode/\` - Catalyst project configuration
  - \`manifest.json\` - Component definitions
  - \`settings.json\` - Project settings
- \`src/\` - Application source code
- \`public/\` - Static assets

## Learn More

- [Catalyst Documentation](https://github.com/Visual-Hive/catalyst)
- [Vite Documentation](https://vitejs.dev/)
- [React Documentation](https://react.dev/)
`;
    
    await fs.writeFile(
      path.join(projectPath, 'README.md'),
      readme,
      'utf-8'
    );
    
    console.log('[ProjectManager] Template files generated successfully');
  }

  /**
   * Initialize git repository in project directory
   * 
   * Runs `git init` in the project directory.
   * Non-critical - if git is not installed, logs warning but doesn't fail.
   * 
   * @param projectPath - Absolute path to project directory
   * @returns Promise that resolves when complete
   * 
   * @private
   * @async
   */
  private async initializeGitRepo(projectPath: string): Promise<void> {
    return new Promise((resolve) => {
      const git = spawn('git', ['init'], {
        cwd: projectPath,
        shell: true,
      });
      
      git.on('close', (code) => {
        if (code === 0) {
          console.log('[ProjectManager] Git repository initialized');
        } else {
          console.warn('[ProjectManager] Git init failed (code ' + code + ')');
        }
        resolve();
      });
      
      git.on('error', (error) => {
        console.warn('[ProjectManager] Git not available:', error.message);
        resolve(); // Don't fail project creation if git unavailable
      });
    });
  }

  /**
   * Install npm dependencies
   * 
   * Runs `npm install` in the project directory with progress updates.
   * This can take 30-60 seconds depending on network speed.
   * 
   * PROGRESS EVENTS:
   * Calls this.onInstallProgress() with progress updates if set.
   * 
   * @param projectPath - Absolute path to project directory
   * @returns Promise that resolves when installation complete
   * 
   * @throws Error if npm install fails
   * 
   * @private
   * @async
   */
  private async installDependencies(projectPath: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.sendInstallProgress({
        step: InstallStep.INITIALIZING,
        progress: 0,
        message: 'Starting npm install...',
      });
      
      const npm = spawn('npm', ['install'], {
        cwd: projectPath,
        shell: true,
      });
      
      let output = '';
      
      npm.stdout?.on('data', (data) => {
        const text = data.toString();
        output += text;
        
        // Parse npm output for progress
        if (text.includes('idealTree')) {
          this.sendInstallProgress({
            step: InstallStep.RESOLVING_DEPENDENCIES,
            progress: 20,
            message: 'Resolving dependencies...',
          });
        } else if (text.includes('reify')) {
          this.sendInstallProgress({
            step: InstallStep.FETCHING_PACKAGES,
            progress: 40,
            message: 'Fetching packages...',
          });
        } else if (text.includes('added')) {
          this.sendInstallProgress({
            step: InstallStep.LINKING_DEPENDENCIES,
            progress: 80,
            message: 'Linking dependencies...',
          });
        }
      });
      
      npm.stderr?.on('data', (data) => {
        console.warn('[ProjectManager] npm stderr:', data.toString());
      });
      
      npm.on('close', (code) => {
        if (code === 0) {
          this.sendInstallProgress({
            step: InstallStep.COMPLETE,
            progress: 100,
            message: 'Dependencies installed successfully',
          });
          
          console.log('[ProjectManager] Dependencies installed successfully');
          resolve();
        } else {
          this.sendInstallProgress({
            step: InstallStep.FAILED,
            progress: 0,
            message: 'npm install failed',
          });
          
          reject(new Error(`npm install failed with code ${code}`));
        }
      });
      
      npm.on('error', (error) => {
        this.sendInstallProgress({
          step: InstallStep.FAILED,
          progress: 0,
          message: error.message,
        });
        
        reject(error);
      });
    });
  }

  /**
   * Send install progress update
   * 
   * Calls the onInstallProgress callback if set.
   * IPC handler should set this callback to forward events to renderer.
   * 
   * @param progress - Progress information
   * 
   * @private
   */
  private sendInstallProgress(progress: InstallProgress): void {
    if (this.onInstallProgress) {
      this.onInstallProgress(progress);
    }
  }

  /**
   * Add project to recent projects list
   * 
   * Adds project to the front of the list, removes duplicates,
   * and trims to MAX_RECENT_PROJECTS.
   * 
   * @param project - Project to add
   * @returns Promise that resolves when saved
   * 
   * @private
   * @async
   */
  private async addToRecentProjects(project: Project): Promise<void> {
    try {
      // Load current recent projects
      const data = await this.loadRecentProjectsData();
      
      // Create recent project entry
      const recentProject: RecentProject = {
        id: project.id,
        name: project.name,
        path: project.path,
        lastOpenedAt: project.lastOpenedAt.toISOString(),
      };
      
      // Remove any existing entry for this path (avoid duplicates)
      data.recentProjects = data.recentProjects.filter(
        (p) => p.path !== project.path
      );
      
      // Add to front of list
      data.recentProjects.unshift(recentProject);
      
      // Trim to max length
      if (data.recentProjects.length > this.MAX_RECENT_PROJECTS) {
        data.recentProjects = data.recentProjects.slice(0, this.MAX_RECENT_PROJECTS);
      }
      
      // Save
      await this.saveRecentProjectsData(data);
      
      console.log('[ProjectManager] Added to recent projects:', project.name);
    } catch (error) {
      console.error('[ProjectManager] Failed to add to recent projects:', error);
      // Non-critical - don't fail project creation
    }
  }

  /**
   * Get recent projects list
   * 
   * Returns list of recently opened projects, validating that paths still exist.
   * Automatically removes invalid paths from the list.
   * 
   * VALIDATION:
   * - Checks if project directory exists
   * - Checks if .lowcode folder exists within directory
   * - Removes entries that fail validation
   * 
   * @returns Promise with array of recent projects
   * 
   * @async
   */
  async getRecentProjects(): Promise<RecentProject[]> {
    try {
      const data = await this.loadRecentProjectsData();
      
      // Validate each project path still exists AND has .lowcode folder
      const validatedProjects: RecentProject[] = [];
      let hasInvalidProject = false;
      
      for (const project of data.recentProjects) {
        try {
          // Check if project directory exists
          await fs.access(project.path);
          
          // Also check if .lowcode folder exists (project might be partially deleted)
          const lowcodeDir = path.join(project.path, '.lowcode');
          await fs.access(lowcodeDir);
          
          // Both exist, keep it
          validatedProjects.push(project);
        } catch {
          // Path or .lowcode doesn't exist anymore, skip it
          console.log('[ProjectManager] Removed invalid recent project:', project.name, '-', project.path);
          hasInvalidProject = true;
        }
      }
      
      // If list changed, save updated list
      if (hasInvalidProject) {
        data.recentProjects = validatedProjects;
        await this.saveRecentProjectsData(data);
        console.log('[ProjectManager] Saved updated recent projects list:', validatedProjects.length, 'valid projects');
      }
      
      return validatedProjects;
    } catch (error) {
      console.error('[ProjectManager] Failed to get recent projects:', error);
      return [];
    }
  }

  /**
   * Load recent projects data from disk
   * 
   * @returns Promise with RecentProjectsData
   * @private
   * @async
   */
  private async loadRecentProjectsData(): Promise<RecentProjectsData> {
    try {
      const content = await fs.readFile(this.recentProjectsPath, 'utf-8');
      return JSON.parse(content);
    } catch {
      // If file doesn't exist or is invalid, return empty data
      return {
        recentProjects: [],
        maxRecentProjects: this.MAX_RECENT_PROJECTS,
        version: '1.0.0',
      };
    }
  }

  /**
   * Save recent projects data to disk
   * 
   * @param data - Data to save
   * @returns Promise that resolves when saved
   * @private
   * @async
   */
  private async saveRecentProjectsData(data: RecentProjectsData): Promise<void> {
    await fs.writeFile(
      this.recentProjectsPath,
      JSON.stringify(data, null, 2),
      'utf-8'
    );
  }

  /**
   * Load an existing Catalyst project
   * 
   * Opens and validates a Catalyst project from disk, loading its manifest
   * and settings. If valid, adds to recent projects and sets as current.
   * 
   * WORKFLOW:
   * 1. Validate project directory exists
   * 2. Validate project structure (.lowcode/ exists)
   * 3. Validate manifest.json
   * 4. Load project settings
   * 5. Create Project object
   * 6. Add to recent projects
   * 7. Set as current project
   * 
   * @param projectPath - Absolute path to project root directory
   * @returns Promise with Result containing Project or Error
   * 
   * @throws Never throws - returns errors in Result
   * 
   * @example
   * ```typescript
   * const result = await manager.loadProject('/Users/richard/projects/my-app');
   * 
   * if (result.success) {
   *   console.log('Project loaded:', result.data.name);
   * } else {
   *   console.error('Failed to load:', result.error.message);
   * }
   * ```
   * 
   * @async
   */
  async loadProject(projectPath: string): Promise<Result<Project, Error>> {
    try {
      console.log('[ProjectManager] Loading project:', projectPath);
      
      // 1. Validate project directory exists
      try {
        const stats = await fs.stat(projectPath);
        if (!stats.isDirectory()) {
          return {
            success: false,
            error: new Error('Path is not a directory'),
          };
        }
      } catch (error) {
        return {
          success: false,
          error: new Error('Project directory does not exist'),
        };
      }
      
      // 2. Validate project structure
      const validation = await this.validator.validateExistingProject(projectPath);
      if (!validation.isValid) {
        const errorMessages = validation.errors
          .map((e: ValidationError) => e.message)
          .join(', ');
        return {
          success: false,
          error: new Error(`Invalid project structure: ${errorMessages}`),
        };
      }
      
      // Log warnings (non-blocking)
      if (validation.warnings && validation.warnings.length > 0) {
        validation.warnings.forEach((warning: ValidationWarning) => {
          console.warn('[ProjectManager]', warning.message);
        });
      }
      
      // 3. Load manifest to get project metadata
      const manifestPath = path.join(projectPath, '.lowcode', 'manifest.json');
      const manifestContent = await fs.readFile(manifestPath, 'utf-8');
      const manifest = JSON.parse(manifestContent);
      
      // Extract project name from manifest (fallback to directory name)
      const projectName = manifest.metadata?.projectName || path.basename(projectPath);
      
      // 4. Load settings (non-critical)
      let settings: ProjectSettings;
      try {
        settings = await this.loadProjectSettings(projectPath);
        console.log('[ProjectManager] Settings loaded');
      } catch (error) {
        console.warn('[ProjectManager] Failed to load settings, using defaults');
        settings = this.getDefaultSettings();
      }
      
      // 5. Create Project object
      const project: Project = {
        id: uuidv4(),
        name: projectName,
        path: projectPath,
        framework: 'react',
        schemaVersion: manifest.schemaVersion || '1.0.0',
        createdAt: manifest.metadata?.createdAt 
          ? new Date(manifest.metadata.createdAt) 
          : new Date(),
        lastOpenedAt: new Date(),
      };
      
      // 6. Add to recent projects
      await this.addToRecentProjects(project);
      
      // 7. Set as current project
      this.currentProject = project;
      
      console.log('[ProjectManager] Project loaded successfully:', project.id);
      
      return {
        success: true,
        data: project,
      };
      
    } catch (error) {
      console.error('[ProjectManager] Failed to load project:', error);
      
      return {
        success: false,
        error: error instanceof Error ? error : new Error(String(error)),
      };
    }
  }

  /**
   * Load project settings from .lowcode/settings.json
   * 
   * Reads and parses the project settings file. If file doesn't exist
   * or is invalid, returns default settings.
   * 
   * @param projectPath - Absolute path to project root directory
   * @returns Promise with ProjectSettings
   * 
   * @async
   */
  async loadProjectSettings(projectPath: string): Promise<ProjectSettings> {
    try {
      const settingsPath = path.join(projectPath, '.lowcode', 'settings.json');
      const content = await fs.readFile(settingsPath, 'utf-8');
      const settings = JSON.parse(content);
      
      // Validate and merge with defaults to ensure all fields present
      return {
        ...this.getDefaultSettings(),
        ...settings,
      };
    } catch (error) {
      console.warn('[ProjectManager] Settings file not found or invalid, using defaults');
      return this.getDefaultSettings();
    }
  }

  /**
   * Save project settings to .lowcode/settings.json
   * 
   * Validates and persists settings to disk. Validates port range
   * and merges with existing settings.
   * 
   * @param projectPath - Absolute path to project root directory
   * @param settings - Settings to save
   * @returns Promise that resolves when saved
   * 
   * @throws Error if settings validation fails or write fails
   * 
   * @async
   */
  async saveProjectSettings(
    projectPath: string,
    settings: ProjectSettings
  ): Promise<void> {
    try {
      // Validate port range
      if (settings.defaultPort < 1024 || settings.defaultPort > 65535) {
        throw new Error('Port must be between 1024 and 65535');
      }
      
      // Validate theme
      if (!['light', 'dark', 'system'].includes(settings.theme)) {
        throw new Error('Invalid theme value');
      }
      
      // Load existing settings and merge
      const existingSettings = await this.loadProjectSettings(projectPath);
      const mergedSettings = {
        ...existingSettings,
        ...settings,
      };
      
      // Write to disk
      const settingsPath = path.join(projectPath, '.lowcode', 'settings.json');
      await fs.writeFile(
        settingsPath,
        JSON.stringify(mergedSettings, null, 2),
        'utf-8'
      );
      
      console.log('[ProjectManager] Settings saved successfully');
    } catch (error) {
      console.error('[ProjectManager] Failed to save settings:', error);
      throw error;
    }
  }

  /**
   * Get default project settings
   * 
   * Returns the default settings used when creating new projects
   * or when settings file is missing/invalid.
   * 
   * @returns Default ProjectSettings
   * @private
   */
  private getDefaultSettings(): ProjectSettings {
    return {
      defaultPort: 5173,
      autoSave: true,
      theme: 'system',
      showHiddenFiles: false,
      strictMode: true,
    };
  }

  /**
   * Get current project
   * 
   * @returns Current project or null if none open
   */
  getCurrentProject(): Project | null {
    return this.currentProject;
  }

  /**
   * Set current project
   * 
   * @param project - Project to set as current (or null to clear)
   */
  setCurrentProject(project: Project | null): void {
    this.currentProject = project;
    
    if (project) {
      console.log('[ProjectManager] Current project:', project.name);
    } else {
      console.log('[ProjectManager] No current project');
    }
  }
}
