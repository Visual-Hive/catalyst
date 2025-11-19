/**
 * @file vitest.config.ts
 * @description Vitest configuration for Rise testing infrastructure
 * 
 * @architecture Phase 0, Task 0.4 - Testing Infrastructure
 * @created 2025-11-19
 * @author AI (Cline) + Human Review
 * @confidence 9/10 - Standard Vitest config, proven patterns
 * 
 * @see docs/TESTING_STRATEGY.md - Complete testing strategy
 * @see .implementation/phase-0-foundation/task-0.4-testing-infrastructure.md
 * 
 * @security-critical false
 * @performance-critical true - Fast test execution is key to developer experience
 */

import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    // Test environment
    // Use 'node' for core logic tests (faster)
    // Use 'jsdom' for React component tests (full DOM simulation)
    environment: 'node',
    
    // Enable globals (describe, it, expect) without imports
    // This matches Jest behavior and reduces boilerplate
    globals: true,
    
    // Setup files run before each test file
    setupFiles: ['./tests/setup.ts'],
    
    // Coverage configuration
    coverage: {
      provider: 'v8', // Using v8 instead of c8 (newer, faster)
      reporter: ['text', 'json', 'html', 'lcov'],
      
      // Files to exclude from coverage
      exclude: [
        'node_modules/',
        'tests/',
        '**/*.test.ts',
        '**/*.spec.ts',
        '**/*.d.ts',
        '**/types.ts',
        'dist/',
        '.lowcode/',
        'coverage/',
        '*.config.ts',
        '*.config.js',
      ],
      
      // Coverage thresholds
      // Start with 80% target (can be increased as codebase matures)
      thresholds: {
        statements: 80,
        branches: 75,
        functions: 80,
        lines: 80,
      },
      
      // Source files to include in coverage
      include: ['src/**/*.ts', 'src/**/*.tsx'],
    },
    
    // Test file patterns
    include: ['tests/**/*.{test,spec}.{js,ts,tsx}'],
    exclude: ['node_modules', 'dist', '.lowcode', 'coverage'],
    
    // Timeouts (in milliseconds)
    testTimeout: 10000, // 10 seconds for regular tests
    hookTimeout: 10000, // 10 seconds for hooks (beforeEach, afterEach)
    
    // Reporters
    // 'default' shows detailed test results in terminal
    // 'html' generates browsable HTML report
    reporters: ['default', 'html'],
    
    // Watch mode settings
    watch: false, // Disabled by default, enable with --watch flag
    
    // Parallel execution for faster tests
    // Tests run in parallel by default using worker threads
    pool: 'threads',
    maxConcurrency: 4, // Max 4 parallel tests
    
    // Retry failed tests (useful for flaky tests)
    retry: process.env.CI ? 2 : 0, // Retry twice in CI, not locally
    
    // Silent console output during tests (can be overridden per test)
    silent: false,
    
    // Fail fast - stop on first test failure (useful during development)
    bail: 0, // 0 = run all tests, 1 = stop after first failure
    
    // Mock settings
    mockReset: true, // Reset mocks between tests
    restoreMocks: true, // Restore original implementations after tests
    clearMocks: true, // Clear mock call history between tests
  },
  
  // Path aliases (must match tsconfig.json)
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@tests': path.resolve(__dirname, './tests'),
      '@core': path.resolve(__dirname, './src/core'),
    },
  },
});
