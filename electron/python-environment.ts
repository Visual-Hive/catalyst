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
 * - Check on app startup (user requirement)
 * - Cache validation for 5 minutes
 * - Support both `python` and `python3` commands
 * - Use pip for package management
 * - Provide clear error messages with solutions
 * 
 * @security-critical false - Only reads environment, doesn't execute user code
 * @performance-critical false - Only runs on app startup
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import { promises as fs } from 'fs';
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
   * Path to requirements.txt file
   */
  private readonly REQUIREMENTS_FILE = path.join(
    process.cwd(),
    'requirements.txt'
  );
  
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
   * Ensure Python environment is ready for execution
   * 
   * Checks:
   * 1. Python is installed and accessible
   * 2. Python version is 3.11+
   * 3. Required packages are installed
   * 4. Auto-installs missing packages from requirements.txt
   * 
   * Uses cache if validation was recent (within TTL).
   * 
   * @param autoInstall - If true, automatically install missing dependencies (default: true)
   * @throws {PythonNotFoundError} If Python not found
   * @throws {PythonVersionError} If Python version too old
   * @throws {DependencyError} If required packages missing and autoInstall is false
   */
  public async ensureDependencies(autoInstall: boolean = true): Promise<void> {
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
    
    // Step 3: Check packages from requirements.txt
    const requiredPackages = await this.parseRequirementsFile();
    const missingPackages = await this.checkPackages(pythonPath, requiredPackages);
    
    // If packages are missing, try to auto-install
    if (missingPackages.length > 0) {
      console.log(`[PythonEnvironment] Missing packages: ${missingPackages.join(', ')}`);
      
      if (autoInstall) {
        console.log('[PythonEnvironment] Auto-installing missing packages...');
        
        try {
          await this.installFromRequirements(pythonPath);
          console.log('[PythonEnvironment] Successfully installed missing packages');
          
          // Re-check packages after installation
          const stillMissing = await this.checkPackages(pythonPath, requiredPackages);
          
          if (stillMissing.length > 0) {
            throw new DependencyError(
              `Failed to install packages: ${stillMissing.join(', ')}`,
              stillMissing
            );
          }
        } catch (error) {
          if (error instanceof DependencyError) {
            throw error;
          }
          throw new DependencyError(
            `Failed to auto-install packages: ${error instanceof Error ? error.message : String(error)}`,
            missingPackages
          );
        }
      } else {
        throw new DependencyError(
          `Missing required packages: ${missingPackages.join(', ')}`,
          missingPackages
        );
      }
    }
    
    // Cache successful validation
    this.validationCache = {
      pythonPath,
      version,
      missingPackages: [],
      timestamp: Date.now(),
    };
    
    console.log('[PythonEnvironment] Environment ready for execution');
  }
  
  /**
   * Validate Python environment (legacy method)
   * 
   * @deprecated Use ensureDependencies() instead
   * @throws {PythonNotFoundError} If Python not found
   * @throws {PythonVersionError} If Python version too old
   * @throws {DependencyError} If required packages missing
   */
  public async validate(): Promise<void> {
    await this.ensureDependencies(false);
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
   * CRITICAL: Uses `python -m pip` instead of calling `pip` directly because
   * `python3` and `pip3` can point to different Python installations!
   * 
   * @param packages - Package names to install
   * @returns Installation result
   */
  public async installPackages(packages: string[]): Promise<InstallResult> {
    console.log(`[PythonEnvironment] Installing packages: ${packages.join(', ')}`);
    
    const pythonPath = await this.getPythonPath();
    
    try {
      const packageList = packages.join(' ');
      // Use python -m pip to ensure packages install to the SAME Python
      // that will be used for execution (python3 and pip3 can be different!)
      // --break-system-packages is required for Homebrew Python (PEP 668)
      const { stdout, stderr } = await execAsync(
        `"${pythonPath}" -m pip install ${packageList} --break-system-packages`
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
        const { stdout } = await execAsync(`"${candidate}" --version`);
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
    const { stdout } = await execAsync(`"${pythonPath}" --version`);
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
   * Parse requirements.txt file and extract package names
   * 
   * Handles:
   * - Package names with versions (e.g., "fastapi>=0.104.0")
   * - Comments (lines starting with #)
   * - Empty lines
   * - Optional dependencies (commented out)
   * 
   * @returns Array of package names (without version specifiers)
   */
  private async parseRequirementsFile(): Promise<string[]> {
    try {
      const content = await fs.readFile(this.REQUIREMENTS_FILE, 'utf-8');
      const lines = content.split('\n');
      const packages: string[] = [];
      
      for (const line of lines) {
        const trimmed = line.trim();
        
        // Skip empty lines and comments
        if (!trimmed || trimmed.startsWith('#')) {
          continue;
        }
        
        // Extract package name (before version specifier)
        const packageName = trimmed.split(/[>=<\[]/)[0].trim();
        
        if (packageName) {
          packages.push(packageName);
        }
      }
      
      console.log(`[PythonEnvironment] Found ${packages.length} packages in requirements.txt`);
      return packages;
      
    } catch (error) {
      console.warn('[PythonEnvironment] Could not read requirements.txt:', error);
      // Fall back to minimal required packages
      return ['httpx', 'anthropic', 'openai', 'groq', 'fastapi', 'uvicorn'];
    }
  }
  
  /**
   * Install all packages from requirements.txt
   * 
   * Uses `python -m pip` to install from the requirements file directly.
   * CRITICAL: Uses `python -m pip` instead of calling `pip` directly because
   * `python3` and `pip3` can point to different Python installations!
   * 
   * @param pythonPath - Path to Python executable
   */
  private async installFromRequirements(pythonPath: string): Promise<void> {
    console.log(`[PythonEnvironment] Installing packages from ${this.REQUIREMENTS_FILE}`);
    
    try {
      // Use python -m pip to ensure packages install to the SAME Python
      // that will be used for execution (python3 and pip3 can be different!)
      // --break-system-packages is required for Homebrew Python (PEP 668)
      const { stdout, stderr } = await execAsync(
        `"${pythonPath}" -m pip install -r "${this.REQUIREMENTS_FILE}" --break-system-packages`
      );
      
      console.log('[PythonEnvironment] Installation output:');
      console.log(stdout);
      
      if (stderr && !stderr.includes('Successfully installed')) {
        console.warn('[PythonEnvironment] Installation warnings:', stderr);
      }
      
    } catch (error: any) {
      console.error('[PythonEnvironment] Installation failed:', error);
      throw new Error(
        `Failed to install packages: ${error.message}\n\nStderr: ${error.stderr}`
      );
    }
  }
  
  /**
   * Check which required packages are installed
   * 
   * @param pythonPath - Path to Python executable
   * @param packages - List of package names to check
   * @returns Array of missing package names
   */
  private async checkPackages(
    pythonPath: string,
    packages: string[]
  ): Promise<string[]> {
    const missing: string[] = [];
    
    for (const packageName of packages) {
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
   * Uses `python -m pip show` to check if package exists in this Python environment.
   * CRITICAL: Uses `python -m pip` instead of calling `pip` directly because
   * `python3` and `pip3` can point to different Python installations!
   * This ensures we check packages in the SAME Python that will run the workflow.
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
      // Use python -m pip to ensure we check the SAME Python's packages
      // that will be used for execution (python3 and pip3 can be different!)
      await execAsync(`"${pythonPath}" -m pip show ${packageName}`, { timeout: 5000 });
      return true;
    } catch (error) {
      // Package not found
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

export interface ValidationStatus {
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
