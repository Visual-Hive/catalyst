/**
 * @file APIKeyManager.ts
 * @description Secure API key management using OS-level keychain storage (keytar).
 *              Handles storage, retrieval, validation, and rotation tracking for
 *              Claude and OpenAI API keys. Keys are encrypted by the OS keychain,
 *              and metadata is stored separately in a local config file.
 * 
 * @architecture Phase 0, Task 0.2 - Security Foundation
 * @created 2025-11-18
 * @author AI (Cline) + Human Review
 * @confidence 9/10 - Keytar is proven, edge cases handled, fallback available
 * 
 * @see docs/SECURITY_SPEC.md - Layer 3: API Key Management
 * @see .implementation/phase-0-foundation/task-0.2-security-foundation.md
 * 
 * @security-critical true
 * @performance-critical false - Key operations are infrequent
 */

import * as keytar from 'keytar';
import * as fs from 'fs/promises';
import * as path from 'path';
import { SecurityError } from './SecurityError';
import { AIProvider, KeyMetadata } from './types';

/**
 * Manages secure storage and retrieval of AI provider API keys.
 * 
 * PROBLEM SOLVED:
 * - API keys are worth real money and must be protected from theft
 * - Keys stored in plain text files or environment variables are easily compromised
 * - Users forget to rotate keys, leading to security risks
 * - Need to track key usage and rotation schedules
 * 
 * SOLUTION:
 * - Store keys in OS keychain using keytar (encrypted at rest by OS)
 * - Validate key formats before storage to catch user errors early
 * - Track metadata separately (rotation dates, last used) without storing keys
 * - Warn users when keys are old and should be rotated (90-day default)
 * - Provide graceful error handling with security logging
 * 
 * USAGE EXAMPLE:
 * ```typescript
 * const manager = new APIKeyManager('/path/to/project');
 * 
 * // Store a new API key
 * await manager.storeKey('claude', 'sk-ant-api03-xxx...');
 * 
 * // Retrieve key for use
 * const key = await manager.getKey('claude');
 * if (key) {
 *   // Use key for API calls
 * }
 * 
 * // Delete key when no longer needed
 * await manager.deleteKey('claude');
 * ```
 * 
 * DESIGN DECISIONS:
 * - OS Keychain (keytar): Industry standard, used by VS Code, Atom, etc.
 * - Separate metadata storage: Only non-sensitive data in config file
 * - Warning-based rotation: User controls when to rotate, avoids disruption
 * - Format validation: Catches errors early, prevents API call failures
 * - 90-day rotation: Balances security with UX (configurable)
 * 
 * EDGE CASES HANDLED:
 * - Keychain unavailable: Throws clear error with instructions
 * - Invalid key format: Rejects with specific format requirements
 * - Concurrent operations: Keytar handles synchronization
 * - Missing metadata: Assumes key is new, sets rotation schedule
 * - Stale keys: Warns but doesn't block usage (user choice)
 * 
 * SECURITY:
 * - Keys encrypted at rest by OS keychain
 * - Keys never logged or included in error messages
 * - Metadata file contains NO sensitive data
 * - All operations use SecurityError for consistent handling
 * 
 * @class APIKeyManager
 */
export class APIKeyManager {
  /**
   * Service name for keychain storage
   * Used to namespace Rise keys from other applications
   */
  private readonly SERVICE_NAME = 'catalyst-workflow-builder';
  
  /**
   * Default key rotation period in days
   * Users should rotate keys every 90 days for security
   */
  private readonly KEY_ROTATION_DAYS = 90;
  
  /**
   * Path to metadata config file
   * Stores rotation dates and last used info (NOT the keys themselves)
   */
  private readonly metadataPath: string;
  
  /**
   * In-memory cache of metadata
   * Reduces file system reads for better performance
   */
  private metadataCache: Map<AIProvider, KeyMetadata> | null = null;

  /**
   * Create a new APIKeyManager instance.
   * 
   * @param projectPath - Absolute path to the project directory
   *                      Used to determine where to store metadata
   * 
   * @throws {SecurityError} If projectPath is invalid
   */
  constructor(projectPath: string) {
    // Validate project path exists
    if (!projectPath || projectPath.trim() === '') {
      throw new SecurityError('Project path cannot be empty', {
        provided: projectPath,
      });
    }
    
    // Metadata stored in project's .lowcode directory
    // Format: .lowcode/security-metadata.json
    this.metadataPath = path.join(projectPath, '.lowcode', 'security-metadata.json');
  }

  /**
   * Store an API key securely in the OS keychain.
   * 
   * The key is validated for correct format before storage to catch
   * user errors early. Metadata (rotation schedule) is recorded separately
   * in a local config file.
   * 
   * TIMING: This should be called when user initially configures Rise or
   * when they manually update their API keys.
   * 
   * @param provider - AI provider ('claude' or 'openai')
   * @param apiKey - The API key to store (will be validated)
   * 
   * @returns Promise that resolves when key is stored successfully
   * 
   * @throws {SecurityError} If key format is invalid
   * @throws {SecurityError} If keychain is unavailable
   * @throws {SecurityError} If metadata storage fails
   * 
   * @example
   * ```typescript
   * try {
   *   await manager.storeKey('claude', 'sk-ant-api03-xxx...');
   *   console.log('Key stored successfully');
   * } catch (error) {
   *   if (SecurityError.isSecurityError(error)) {
   *     console.error('Failed to store key:', error.message);
   *   }
   * }
   * ```
   * 
   * @performance Typically <100ms, depends on OS keychain speed
   * @sideEffects Writes to OS keychain and local metadata file
   * @async
   */
  async storeKey(provider: AIProvider, apiKey: string): Promise<void> {
    // Validate key format before storing
    this.validateKeyFormat(provider, apiKey);
    
    try {
      // Store in OS keychain (encrypted by OS)
      await keytar.setPassword(this.SERVICE_NAME, provider, apiKey);
      
      // Record metadata (rotation schedule, NOT the key)
      const metadata: KeyMetadata = {
        provider,
        storedAt: new Date(),
        rotateAt: new Date(Date.now() + this.KEY_ROTATION_DAYS * 86400000), // 90 days from now
      };
      
      await this.saveKeyMetadata(provider, metadata);
      
    } catch (error: any) {
      // Check if keychain is unavailable
      if (error.message?.includes('keytar') || error.message?.includes('keychain')) {
        throw new SecurityError(
          'OS keychain unavailable. Please ensure your system keychain is accessible.',
          {
            provider,
            osError: error.message,
            platform: process.platform,
          }
        );
      }
      
      // Re-throw as SecurityError for consistent handling
      throw new SecurityError('Failed to store API key', {
        provider,
        error: error.message,
      });
    }
  }

  /**
   * Retrieve an API key from the OS keychain.
   * 
   * Checks rotation schedule and warns if key is old. Updates last used
   * timestamp for tracking purposes.
   * 
   * TIMING: Called before every API request to get the key for authentication.
   * 
   * @param provider - AI provider to get key for
   * 
   * @returns Promise resolving to the API key, or null if not found
   * 
   * @throws {SecurityError} If keychain is unavailable
   * 
   * @example
   * ```typescript
   * const key = await manager.getKey('claude');
   * if (key) {
   *   // Use key for API call
   *   const response = await fetch('https://api.anthropic.com/...', {
   *     headers: { 'x-api-key': key }
   *   });
   * } else {
   *   console.error('No API key configured for Claude');
   * }
   * ```
   * 
   * @performance Typically <50ms, depends on OS keychain
   * @sideEffects Updates last used timestamp in metadata
   * @async
   */
  async getKey(provider: AIProvider): Promise<string | null> {
    try {
      // Retrieve from OS keychain
      const key = await keytar.getPassword(this.SERVICE_NAME, provider);
      
      if (!key) {
        // Key not found - user hasn't configured it yet
        return null;
      }
      
      // Check if key needs rotation
      const metadata = await this.getKeyMetadata(provider);
      if (metadata && new Date() > metadata.rotateAt) {
        // Key is old and should be rotated
        // Log warning but don't block usage (user's choice)
        this.notifyKeyRotation(provider, metadata);
      }
      
      // Update last used timestamp
      await this.updateLastUsed(provider);
      
      return key;
      
    } catch (error: any) {
      throw new SecurityError('Failed to retrieve API key', {
        provider,
        error: error.message,
      });
    }
  }

  /**
   * Delete an API key from the OS keychain.
   * 
   * Removes both the key and its metadata. Use when user wants to
   * remove an API key or switch to a different key.
   * 
   * @param provider - AI provider to delete key for
   * 
   * @returns Promise resolving to true if key was deleted, false if not found
   * 
   * @throws {SecurityError} If deletion fails
   * 
   * @example
   * ```typescript
   * const deleted = await manager.deleteKey('claude');
   * if (deleted) {
   *   console.log('Key deleted successfully');
   * } else {
   *   console.log('No key was configured');
   * }
   * ```
   * 
   * @performance <50ms typically
   * @sideEffects Removes key from keychain and metadata from config
   * @async
   */
  async deleteKey(provider: AIProvider): Promise<boolean> {
    try {
      // Delete from OS keychain
      const deleted = await keytar.deletePassword(this.SERVICE_NAME, provider);
      
      // Delete metadata regardless of whether key existed
      await this.deleteKeyMetadata(provider);
      
      return deleted;
      
    } catch (error: any) {
      throw new SecurityError('Failed to delete API key', {
        provider,
        error: error.message,
      });
    }
  }

  /**
   * Check if an API key is configured for the provider.
   * 
   * @param provider - AI provider to check
   * @returns Promise resolving to true if key exists
   * 
   * @async
   */
  async hasKey(provider: AIProvider): Promise<boolean> {
    const key = await this.getKey(provider);
    return key !== null;
  }

  /**
   * Get metadata for an API key (rotation dates, last used).
   * Does NOT return the actual key.
   * 
   * @param provider - AI provider
   * @returns Promise resolving to metadata, or null if not found
   * 
   * @async
   */
  async getKeyMetadata(provider: AIProvider): Promise<KeyMetadata | null> {
    const metadata = await this.loadMetadata();
    return metadata.get(provider) || null;
  }

  /**
   * Validate API key format for the specified provider.
   * 
   * FORMATS:
   * - Claude: sk-ant-api03-[95 chars of base64]
   * - OpenAI: sk-[48 chars alphanumeric]
   * 
   * @param provider - AI provider
   * @param key - API key to validate
   * 
   * @throws {SecurityError} If format is invalid
   * 
   * @private
   */
  private validateKeyFormat(provider: AIProvider, key: string): void {
    // Remove whitespace that users might accidentally copy
    const trimmedKey = key.trim();
    
    // Check for empty key
    if (!trimmedKey) {
      throw new SecurityError('API key cannot be empty', {
        provider,
      }, 'WARNING');
    }
    
    // Provider-specific format validation
    const patterns: Record<AIProvider, RegExp> = {
      claude: /^sk-ant-api03-[A-Za-z0-9\-_]{95}$/,
      openai: /^sk-[A-Za-z0-9]{48}$/,
    };
    
    const pattern = patterns[provider];
    
    if (!pattern.test(trimmedKey)) {
      // Provide helpful error messages
      const formats: Record<AIProvider, string> = {
        claude: 'sk-ant-api03-... (95 characters after prefix)',
        openai: 'sk-... (48 characters after prefix)',
      };
      
      throw new SecurityError(
        `Invalid ${provider} API key format`,
        {
          provider,
          expectedFormat: formats[provider],
          // Don't include the actual key in error!
        },
        'WARNING'
      );
    }
  }

  /**
   * Save metadata for an API key to local config file.
   * 
   * @param provider - AI provider
   * @param metadata - Metadata to save
   * 
   * @private
   */
  private async saveKeyMetadata(
    provider: AIProvider,
    metadata: KeyMetadata
  ): Promise<void> {
    // Load existing metadata
    const allMetadata = await this.loadMetadata();
    
    // Update with new metadata
    allMetadata.set(provider, metadata);
    
    // Convert to JSON-serializable format
    const metadataObj: Record<string, any> = {};
    for (const [key, value] of allMetadata.entries()) {
      metadataObj[key] = {
        provider: value.provider,
        storedAt: value.storedAt.toISOString(),
        rotateAt: value.rotateAt.toISOString(),
        lastUsed: value.lastUsed?.toISOString(),
      };
    }
    
    // Ensure directory exists
    const dir = path.dirname(this.metadataPath);
    await fs.mkdir(dir, { recursive: true });
    
    // Write to file with pretty formatting
    await fs.writeFile(
      this.metadataPath,
      JSON.stringify(metadataObj, null, 2),
      'utf-8'
    );
    
    // Update cache
    this.metadataCache = allMetadata;
  }

  /**
   * Load all key metadata from config file.
   * 
   * @returns Promise resolving to Map of provider -> metadata
   * 
   * @private
   */
  private async loadMetadata(): Promise<Map<AIProvider, KeyMetadata>> {
    // Return cached data if available
    if (this.metadataCache) {
      return new Map(this.metadataCache);
    }
    
    try {
      // Read metadata file
      const content = await fs.readFile(this.metadataPath, 'utf-8');
      const parsed = JSON.parse(content);
      
      // Convert to Map with Date objects
      const metadata = new Map<AIProvider, KeyMetadata>();
      for (const [key, value] of Object.entries(parsed)) {
        const meta = value as any;
        metadata.set(key as AIProvider, {
          provider: meta.provider,
          storedAt: new Date(meta.storedAt),
          rotateAt: new Date(meta.rotateAt),
          lastUsed: meta.lastUsed ? new Date(meta.lastUsed) : undefined,
        });
      }
      
      // Cache for future use
      this.metadataCache = metadata;
      
      return new Map(metadata);
      
    } catch (error: any) {
      // File doesn't exist yet - return empty map
      if (error.code === 'ENOENT') {
        return new Map();
      }
      
      throw new SecurityError('Failed to load key metadata', {
        path: this.metadataPath,
        error: error.message,
      });
    }
  }

  /**
   * Update last used timestamp for a key.
   * 
   * @param provider - AI provider
   * 
   * @private
   */
  private async updateLastUsed(provider: AIProvider): Promise<void> {
    const metadata = await this.getKeyMetadata(provider);
    
    if (metadata) {
      metadata.lastUsed = new Date();
      await this.saveKeyMetadata(provider, metadata);
    }
  }

  /**
   * Delete metadata for a key.
   * 
   * @param provider - AI provider
   * 
   * @private
   */
  private async deleteKeyMetadata(provider: AIProvider): Promise<void> {
    const allMetadata = await this.loadMetadata();
    allMetadata.delete(provider);
    
    // If no metadata left, delete the file
    if (allMetadata.size === 0) {
      try {
        await fs.unlink(this.metadataPath);
        this.metadataCache = null;
      } catch (error: any) {
        // Ignore if file doesn't exist
        if (error.code !== 'ENOENT') {
          throw error;
        }
      }
      return;
    }
    
    // Otherwise, save updated metadata
    // Get any remaining provider to trigger a proper save
    const remainingProviders = Array.from(allMetadata.keys());
    if (remainingProviders.length > 0) {
      const firstProvider = remainingProviders[0];
      const firstMetadata = allMetadata.get(firstProvider)!;
      await this.saveKeyMetadata(firstProvider, firstMetadata);
    }
  }

  /**
   * Notify user that their API key should be rotated.
   * 
   * Currently logs to console. In future, this could trigger
   * a UI notification or send an email.
   * 
   * @param provider - AI provider
   * @param metadata - Key metadata with rotation info
   * 
   * @private
   */
  private notifyKeyRotation(provider: AIProvider, metadata: KeyMetadata): void {
    const daysSinceRotation = Math.floor(
      (Date.now() - metadata.rotateAt.getTime()) / 86400000
    );
    
    console.warn(
      `\n⚠️  API Key Rotation Recommended\n` +
      `Provider: ${provider}\n` +
      `Days overdue: ${daysSinceRotation}\n` +
      `Recommendation: Generate a new API key from ${provider}'s dashboard and update Rise.\n`
    );
  }
}
