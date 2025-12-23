# Task 2.18.1: Python Environment Validation

**Parent Task:** Task 2.18 - Local Workflow Execution Runner  
**Duration Estimate:** 4-6 hours  
**Status:** 🔵 Not Started  
**Priority:** 🔴 CRITICAL - Required for workflow execution  

---

## Overview

This subtask implements Python environment detection and validation. Before executing any workflow, we need to ensure Python 3.11+ is installed and all required packages (httpx, anthropic, openai, groq, etc.) are available.

### Objective

Create a `PythonEnvironment` class that:
1. Detects Python installation and version
2. Validates required packages are installed
3. Provides auto-installation of missing packages
4. Caches validation results
5. Shows helpful error messages

### Success Criteria

- [ ] Can detect Python 3.11+ installation
- [ ] Can validate required packages
- [ ] Can auto-install missing packages via pip
- [ ] Validation results cached (don't check every time)
- [ ] Helpful error messages with installation instructions
- [ ] Works on macOS, Windows, and Linux

---

## Implementation

### File: `electron/python-environment.ts`

```typescript
/**
 * @file python-environment.ts
 * @description Python environment detection and validation
 * 
 * @architecture Phase 2.5, Task 2.18.1 - Python Environment Validation
 * @created 2025-12-22
 * @author AI (Cline) + Human Review
 * @confidence 8/10 - Cross-platform Python detection is well-established
 * 
 * @see electron/workflow-executor.ts - Uses this for validation
 * @see .implementation/Catalyst_tasks/phase-2.5-developer-experience/task-2.18.1-python-environment.md
 * 
 * PROBLEM SOLVED:
 * - Need to ensure Python is installed before executing workflows
 * - Need to validate required packages are available
 * - Need helpful error messages for missing dependencies
 * - Want to avoid validating on every execution (caching)
 * 
 * SOLUTION:
 * - Detect Python via PATH or common installation locations
 * - Check version using `python --version`
 * - Validate packages using `pip list` or `pip show`
 * - Cache validation results in memory
 * - Provide auto-install option for missing packages
 * 
 * DESIGN DECISIONS:
 * - Lazy validation (only check on first use)
 * - Cache validation for 5 minutes
 * - Support both `python` and `python3` commands
 * - Use pip for package management
 * - Provide clear error messages with solutions
 * 
 * @security-critical false - Only reads environment, doesn't execute user code
 * @performance-critical false - Only runs on first execution
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import * as path from 'path';
import * as os from 'os';

const execAsync = promisify(exec);

/**
 * Python environment validation and management
 * 
 * RESPONSIBILITIES:
 * - Detect Python installation
 * - Validate Python version (3.11+)
 * - Check required packages
 * - Install missing packages
 * - Cache validation results
 * 
 * USAGE:
 * ```typescript
 * const pythonEnv = PythonEnvironment.getInstance();
 * 
 * // Validate environment (throws if invalid)
 * await pythonEnv.validate();
 * 
 * // Get Python path for execution
 * const pythonPath = await pythonEnv.getPythonPath();
 * 
 * // Install missing packages
 * await pythonEnv.installPackages(['httpx', 'anthropic']);
 * ```
 */
export class PythonEnvironment {
  private static instance: PythonEnvironment;
  private validationCache: ValidationCache | null = null;
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes
  
  /**
   * Required Python packages for workflow execution
   */
  private readonly REQUIRED_PACKAGES = [
    'httpx',      // HTTP requests
    'anthropic',  // Claude integration
    'openai',     // GPT integration
    'groq',       // Groq integration
  ];
  
  /**
   * Minimum required Python version
   */
  private readonly MIN_PYTHON_VERSION = { major: 3, minor: 11 };
  
  private constructor() {}
  
  /**
   * Get singleton instance
   */
  public static getInstance(): PythonEnvironment {
    if (!PythonEnvironment.instance) {
      PythonEnvironment.instance = new PythonEnvironment();
    }
    return PythonEnvironment.instance;
  }
  
  /**
   * Validate Python environment
   * 
   * Checks:
   * 1. Python is installed and accessible
   * 2. Python version is 3.11+
   * 3. Required packages are installed
   * 
   * Uses cache if validation was recent (within TTL).
   * 
   * @throws {PythonNotFoundError} If Python not found
   * @throws {PythonVersionError} If Python version too old
   * @throws {DependencyError} If required packages missing
   */
  public async validate(): Promise<void> {
    // Check cache
    if (this.isCacheValid()) {
      console.log('[PythonEnvironment] Using cached validation');
      return;
    }
    
    console.log('[PythonEnvironment] Validating Python environment...');
    
    // Step 1: Find Python
    const pythonPath = await this.findPython();
    if (!pythonPath) {
      throw new PythonNotFoundError(
        'Python 3.11+ not found. Please install Python from python.org'
      );
    }
    
    // Step 2: Check version
    const version = await this.getPythonVersion(pythonPath);
    if (!this.isVersionValid(version)) {
      throw new PythonVersionError(
        `Python ${version.major}.${version.minor} found, but 3.11+ required. Please upgrade Python.`
      );
    }
    
    // Step 3: Check packages
    const missingPackages = await this.checkPackages(pythonPath);
    
    // Cache successful validation
    this.validationCache = {
      pythonPath,
      version,
      missingPackages,
      timestamp: Date.now(),
    };
    
    if (missingPackages.length > 0) {
      throw new DependencyError(
        `Missing required packages: ${missingPackages.join(', ')}`,
        missingPackages
      );
    }
    
    console.log('[PythonEnvironment] Validation successful');
  }
  
  /**
   * Get Python executable path
   * 
   * @returns Python path (e.g., /usr/bin/python3)
   * @throws {Error} If Python not validated yet
   */
  public async getPythonPath(): Promise<string> {
    if (!this.validationCache) {
      await this.validate();
    }
    return this.validationCache!.pythonPath;
  }
  
  /**
   * Install missing packages via pip
   * 
   * @param packages - Package names to install
   * @returns Installation result
   */
  public async installPackages(packages: string[]): Promise<InstallResult> {
    console.log(`[PythonEnvironment] Installing packages: ${packages.join(', ')}`);
    
    const pythonPath = await this.getPythonPath();
    const pipPath = pythonPath.replace(/python3?$/, 'pip3');
    
    try {
      const packageList = packages.join(' ');
      const { stdout, stderr } = await execAsync(
        `${pipPath} install ${packageList}`
      );
      
      console.log('[PythonEnvironment] Installation successful');
      console.log(stdout);
      
      // Clear cache to force revalidation
      this.validationCache = null;
      
      return {
        success: true,
        installedPackages: packages,
        output: stdout,
      };
    } catch (error: any) {
      console.error('[PythonEnvironment] Installation failed:', error);
      
      return {
        success: false,
        installedPackages: [],
        error: error.message,
        output: error.stderr,
      };
    }
  }
  
  /**
   * Check if validation cache is still valid
   */
  private isCacheValid(): boolean {
    if (!this.validationCache) {
      return false;
    }
    
    const age = Date.now() - this.validationCache.timestamp;
    return age < this.CACHE_TTL;
  }
  
  /**
   * Find Python executable in PATH or common locations
   * 
   * Tries in order:
   * 1. `python3` command
   * 2. `python` command (if version is 3.11+)
   * 3. Common installation paths
   * 
   * @returns Python path or null if not found
   */
  private async findPython(): Promise<string | null> {
    const candidates = [
      'python3',
      'python',
      ...this.getCommonPythonPaths(),
    ];
    
    for (const candidate of candidates) {
      try {
        const { stdout } = await execAsync(`${candidate} --version`);
        const version = this.parseVersion(stdout);
        
        if (this.isVersionValid(version)) {
          console.log(`[PythonEnvironment] Found Python at: ${candidate}`);
          return candidate;
        }
      } catch (error) {
        // Command not found or failed, try next
        continue;
      }
    }
    
    return null;
  }
  
  /**
   * Get common Python installation paths by platform
   */
  private getCommonPythonPaths(): string[] {
    const platform = os.platform();
    
    if (platform === 'darwin') {
      // macOS
      return [
        '/usr/local/bin/python3',
        '/opt/homebrew/bin/python3',
        '/usr/bin/python3',
      ];
    } else if (platform === 'win32') {
      // Windows
      return [
        'C:\\Python311\\python.exe',
        'C:\\Python312\\python.exe',
        path.join(os.homedir(), 'AppData', 'Local', 'Programs', 'Python', 'Python311', 'python.exe'),
      ];
    } else {
      // Linux
      return [
        '/usr/bin/python3',
        '/usr/local/bin/python3',
      ];
    }
  }
  
  /**
   * Get Python version
   * 
   * @param pythonPath - Path to Python executable
   * @returns Version object
   */
  private async getPythonVersion(pythonPath: string): Promise<Version> {
    const { stdout } = await execAsync(`${pythonPath} --version`);
    return this.parseVersion(stdout);
  }
  
  /**
   * Parse version string (e.g., "Python 3.11.5")
   * 
   * @param versionString - Output from `python --version`
   * @returns Parsed version object
   */
  private parseVersion(versionString: string): Version {
    const match = versionString.match(/Python (\d+)\.(\d+)\.(\d+)/);
    if (!match) {
      throw new Error(`Failed to parse Python version: ${versionString}`);
    }
    
    return {
      major: parseInt(match[1], 10),
      minor: parseInt(match[2], 10),
      patch: parseInt(match[3], 10),
    };
  }
  
  /**
   * Check if version meets minimum requirements
   * 
   * @param version - Python version to check
   * @returns true if version is valid
   */
  private isVersionValid(version: Version): boolean {
    if (version.major < this.MIN_PYTHON_VERSION.major) {
      return false;
    }
    if (version.major === this.MIN_PYTHON_VERSION.major) {
      return version.minor >= this.MIN_PYTHON_VERSION.minor;
    }
    return true;
  }
  
  /**
   * Check which required packages are installed
   * 
   * @param pythonPath - Path to Python executable
   * @returns Array of missing package names
   */
  private async checkPackages(pythonPath: string): Promise<string[]> {
    const missing: string[] = [];
    
    for (const packageName of this.REQUIRED_PACKAGES) {
      const isInstalled = await this.isPackageInstalled(pythonPath, packageName);
      if (!isInstalled) {
        missing.push(packageName);
      }
    }
    
    return missing;
  }
  
  /**
   * Check if a specific package is installed
   * 
   * @param pythonPath - Path to Python executable
   * @param packageName - Package name to check
   * @returns true if installed
   */
  private async isPackageInstalled(
    pythonPath: string,
    packageName: string
  ): Promise<boolean> {
    try {
      // Try to import the package
      const { stdout } = await execAsync(
        `${pythonPath} -c "import ${packageName}"`
      );
      return true;
    } catch (error) {
      return false;
    }
  }
  
  /**
   * Clear validation cache (force revalidation)
   */
  public clearCache(): void {
    this.validationCache = null;
  }
  
  /**
   * Get validation status without throwing errors
   * 
   * @returns Validation status object
   */
  public async getStatus(): Promise<ValidationStatus> {
    try {
      await this.validate();
      
      return {
        isValid: true,
        pythonVersion: this.validationCache!.version,
        missingPackages: [],
      };
    } catch (error) {
      if (error instanceof PythonNotFoundError) {
        return {
          isValid: false,
          error: 'Python not found',
          pythonVersion: null,
          missingPackages: [],
        };
      } else if (error instanceof PythonVersionError) {
        return {
          isValid: false,
          error: error.message,
          pythonVersion: this.validationCache?.version || null,
          missingPackages: [],
        };
      } else if (error instanceof DependencyError) {
        return {
          isValid: false,
          error: error.message,
          pythonVersion: this.validationCache?.version || null,
          missingPackages: error.missingPackages,
        };
      } else {
        return {
          isValid: false,
          error: 'Unknown validation error',
          pythonVersion: null,
          missingPackages: [],
        };
      }
    }
  }
}

/**
 * Type definitions
 */

interface Version {
  major: number;
  minor: number;
  patch: number;
}

interface ValidationCache {
  pythonPath: string;
  version: Version;
  missingPackages: string[];
  timestamp: number;
}

interface InstallResult {
  success: boolean;
  installedPackages: string[];
  output?: string;
  error?: string;
}

interface ValidationStatus {
  isValid: boolean;
  error?: string;
  pythonVersion: Version | null;
  missingPackages: string[];
}

/**
 * Custom error types
 */

export class PythonNotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PythonNotFoundError';
  }
}

export class PythonVersionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PythonVersionError';
  }
}

export class DependencyError extends Error {
  public missingPackages: string[];
  
  constructor(message: string, missingPackages: string[]) {
    super(message);
    this.name = 'DependencyError';
    this.missingPackages = missingPackages;
  }
}

// Export singleton instance
export const pythonEnvironment = PythonEnvironment.getInstance();
```

---

## Testing

### Unit Tests

```typescript
describe('PythonEnvironment', () => {
  let pythonEnv: PythonEnvironment;
  
  beforeEach(() => {
    pythonEnv = PythonEnvironment.getInstance();
    pythonEnv.clearCache();
  });
  
  it('should detect Python installation', async () => {
    const pythonPath = await pythonEnv.getPythonPath();
    expect(pythonPath).toBeTruthy();
    expect(pythonPath).toMatch(/python3?/);
  });
  
  it('should validate Python version', async () => {
    await pythonEnv.validate();
    const status = await pythonEnv.getStatus();
    
    expect(status.isValid).toBe(true);
    expect(status.pythonVersion!.major).toBeGreaterThanOrEqual(3);
    expect(status.pythonVersion!.minor).toBeGreaterThanOrEqual(11);
  });
  
  it('should detect missing packages', async () => {
    const status = await pythonEnv.getStatus();
    
    if (status.missingPackages.length > 0) {
      expect(status.isValid).toBe(false);
      expect(status.error).toContain('Missing required packages');
    }
  });
  
  it('should cache validation results', async () => {
    const start1 = Date.now();
    await pythonEnv.validate();
    const time1 = Date.now() - start1;
    
    const start2 = Date.now();
    await pythonEnv.validate();
    const time2 = Date.now() - start2;
    
    // Second validation should be much faster (cached)
    expect(time2).toBeLessThan(time1 / 10);
  });
});
```

### Manual Testing

1. **Python Installed:**
   - Run validation
   - Should succeed if Python 3.11+ installed

2. **Python Not Installed:**
   - Temporarily rename Python executable
   - Run validation
   - Should show "Python not found" error

3. **Old Python Version:**
   - Test with Python 3.10 or older
   - Should show version error

4. **Missing Packages:**
   - Uninstall httpx: `pip uninstall httpx`
   - Run validation
   - Should show dependency error
   - Try auto-install
   - Should succeed

---

## Error Messages

### Python Not Found

```
Python 3.11+ Not Found

Catalyst requires Python 3.11 or later to execute workflows.

Installation instructions:

macOS:
  brew install python@3.11

Windows:
  Download from python.org/downloads

Linux:
  sudo apt-get install python3.11

[Download Python] [Check Again] [Cancel]
```

### Missing Packages

```
Missing Python Packages

The following packages are required but not installed:
  • httpx
  • anthropic
  • groq

Would you like to install them automatically?

[Install Automatically] [Manual Instructions] [Cancel]
```

---

## Success Criteria

- [ ] Detects Python 3.11+ correctly
- [ ] Validates required packages
- [ ] Caches validation results
- [ ] Provides auto-install option
- [ ] Works on macOS, Windows, Linux
- [ ] Helpful error messages
- [ ] Test coverage >85%

---

**Status:** 🔵 Ready for Implementation  
**Estimated Effort:** 4-6 hours  
**Confidence:** 8/10
