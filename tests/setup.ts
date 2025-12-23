/**
 * @file setup.ts
 * @description Global test setup for Vitest
 * 
 * This file runs once before all tests to configure the test environment.
 * It sets up testing utilities, custom matchers, and mock globals.
 * 
 * @architecture Phase 0, Task 0.4 - Testing Infrastructure
 * @created 2025-11-19
 * @author AI (Cline) + Human Review
 * @confidence 9/10 - Standard test setup patterns
 * 
 * @see vitest.config.ts - Main configuration
 * @see docs/TESTING_STRATEGY.md - Testing strategy
 * 
 * @security-critical false
 * @performance-critical false
 */

import { expect, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';

/**
 * CUSTOM MATCHERS
 * 
 * Extend Vitest's expect API with custom matchers.
 * - @testing-library/jest-dom provides DOM matchers (toBeInTheDocument, toHaveValue, etc.)
 * - Custom matchers below are specific to Catalyst/Rise
 */

interface CustomMatchers<R = unknown> {
  /**
   * Check if a component schema is valid
   * 
   * @example
   * expect(component).toBeValidComponent();
   */
  toBeValidComponent(): R;
  
  /**
   * Check if a manifest is valid
   * 
   * @example
   * expect(manifest).toBeValidManifest();
   */
  toBeValidManifest(): R;
}

declare module 'vitest' {
  interface Assertion<T = any> extends CustomMatchers<T> {}
  interface AsymmetricMatchersContaining extends CustomMatchers {}
}

// Custom matcher: toBeValidComponent
// Validates that an object has required component properties
expect.extend({
  toBeValidComponent(received: any) {
    const { isNot } = this;
    
    // Check if component has required fields
    const hasId = received && typeof received.id === 'string';
    const hasDisplayName = received && typeof received.displayName === 'string';
    const hasType = received && typeof received.type === 'string';
    const hasProperties = received && typeof received.properties === 'object';
    
    const isValid = hasId && hasDisplayName && hasType && hasProperties;
    
    return {
      pass: isValid,
      message: () => {
        if (isNot) {
          return `Expected component not to be valid, but it was`;
        }
        
        const missing: string[] = [];
        if (!hasId) missing.push('id');
        if (!hasDisplayName) missing.push('displayName');
        if (!hasType) missing.push('type');
        if (!hasProperties) missing.push('properties');
        
        return `Expected component to be valid, but missing: ${missing.join(', ')}`;
      },
    };
  },
  
  // Custom matcher: toBeValidManifest
  // Validates that an object has required manifest properties
  toBeValidManifest(received: any) {
    const { isNot } = this;
    
    // Check if manifest has required fields
    const hasSchemaVersion = received && typeof received.schemaVersion === 'string';
    const hasLevel = received && typeof received.level === 'number';
    const hasMetadata = received && typeof received.metadata === 'object';
    const hasComponents = received && typeof received.components === 'object';
    
    const isValid = hasSchemaVersion && hasLevel && hasMetadata && hasComponents;
    
    return {
      pass: isValid,
      message: () => {
        if (isNot) {
          return `Expected manifest not to be valid, but it was`;
        }
        
        const missing: string[] = [];
        if (!hasSchemaVersion) missing.push('schemaVersion');
        if (!hasLevel) missing.push('level');
        if (!hasMetadata) missing.push('metadata');
        if (!hasComponents) missing.push('components');
        
        return `Expected manifest to be valid, but missing: ${missing.join(', ')}`;
      },
    };
  },
});

/**
 * GLOBAL MOCKS
 * 
 * Mock browser APIs and Node.js globals that may not be available
 * or behave differently in test environment.
 */

// Mock console methods to reduce noise in tests
// Tests can still explicitly call console.log/error if needed
const originalConsole = { ...console };

// Suppress console output during tests (can be overridden per test)
if (process.env.VITEST_SILENT !== 'false') {
  global.console = {
    ...console,
    log: vi.fn(),
    debug: vi.fn(),
    info: vi.fn(),
    // Keep warn and error visible for debugging
    warn: originalConsole.warn,
    error: originalConsole.error,
  };
}

// Restore original console for debugging
export function restoreConsole() {
  global.console = originalConsole;
}

/**
 * CLEANUP
 * 
 * Clean up resources after tests to prevent memory leaks and test pollution.
 */

// No explicit cleanup needed yet, but this is where it would go
// Example: clearing intervals, closing connections, etc.
