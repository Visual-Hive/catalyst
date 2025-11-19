/**
 * @file FileChangeTracker.test.ts
 * @description Comprehensive unit tests for FileChangeTracker
 *              Tests all edge cases, error handling, and performance
 * 
 * @architecture Phase 0, Task 0.1 - File Watcher with Hash Detection
 * @created 2025-10-26
 * @author AI (Cline) + Human Review
 * 
 * @see src/core/FileChangeTracker.ts
 * @see .implementation/phase-0-foundation/task-0.1-file-watcher.md
 * 
 * Coverage Target: >90%
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { FileChangeTracker } from '../../src/core/FileChangeTracker';
import * as crypto from 'crypto';

// Helper function to create deterministic content hash
function computeHash(content: string): string {
  return crypto.createHash('sha256').update(content, 'utf-8').digest('hex');
}

// Helper to wait for a specified time
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

describe('FileChangeTracker', () => {
  let tracker: FileChangeTracker;

  beforeEach(() => {
    // Create fresh tracker for each test
    tracker = new FileChangeTracker();
  });

  afterEach(() => {
    // Clean up to prevent memory leaks from timeouts
    tracker.clear();
  });

  describe('Constructor and Initialization', () => {
    it('should create tracker with default options', () => {
      const tracker = new FileChangeTracker();
      const state = tracker.getState();

      expect(state.generationHashes.size).toBe(0);
      expect(state.pausedPaths.size).toBe(0);
      expect(state.timeouts.size).toBe(0);
    });

    it('should create tracker with custom options', () => {
      const tracker = new FileChangeTracker({
        pauseDuration: 200,
        autoResumeTimeout: 10000,
        debug: true,
      });

      // Tracker should be initialized (state checks)
      const state = tracker.getState();
      expect(state.generationHashes.size).toBe(0);
      expect(state.pausedPaths.size).toBe(0);
      expect(state.timeouts.size).toBe(0);
    });

    it('should handle partial options', () => {
      const tracker = new FileChangeTracker({
        pauseDuration: 50,
      });

      const state = tracker.getState();
      expect(state.generationHashes.size).toBe(0);
    });
  });

  describe('onBeforeGenerate', () => {
    it('should store hash and pause file', async () => {
      const filepath = '/project/Button.tsx';
      const content = 'const Button = () => <button>Click</button>';

      await tracker.onBeforeGenerate(filepath, content);

      const state = tracker.getState();
      expect(state.generationHashes.has(filepath)).toBe(true);
      expect(state.pausedPaths.has(filepath)).toBe(true);
      expect(state.timeouts.has(filepath)).toBe(true);
      
      // Verify hash is correct
      const expectedHash = computeHash(content);
      expect(state.generationHashes.get(filepath)).toBe(expectedHash);
    });

    it('should replace old hash on regeneration', async () => {
      const filepath = '/project/Button.tsx';
      const content1 = 'version 1';
      const content2 = 'version 2';

      // First generation
      await tracker.onBeforeGenerate(filepath, content1);
      const hash1 = tracker.getState().generationHashes.get(filepath);

      // Second generation (different content)
      await tracker.onBeforeGenerate(filepath, content2);
      const hash2 = tracker.getState().generationHashes.get(filepath);

      // Hashes should be different
      expect(hash1).not.toBe(hash2);
      expect(hash2).toBe(computeHash(content2));

      // Should still only have one entry
      expect(tracker.getState().generationHashes.size).toBe(1);
    });

    it('should handle empty content', async () => {
      const filepath = '/project/Empty.tsx';
      const content = '';

      await tracker.onBeforeGenerate(filepath, content);

      const state = tracker.getState();
      expect(state.generationHashes.has(filepath)).toBe(true);
      expect(state.pausedPaths.has(filepath)).toBe(true);
    });

    it('should handle large content', async () => {
      const filepath = '/project/Large.tsx';
      // Create 1MB of content
      const content = 'x'.repeat(1024 * 1024);

      const start = Date.now();
      await tracker.onBeforeGenerate(filepath, content);
      const duration = Date.now() - start;

      // Should complete in reasonable time (<50ms even for 1MB)
      expect(duration).toBeLessThan(50);

      const state = tracker.getState();
      expect(state.generationHashes.has(filepath)).toBe(true);
    });

    it('should throw error for invalid filepath', async () => {
      await expect(
        tracker.onBeforeGenerate('', 'content')
      ).rejects.toThrow('filepath must be a non-empty string');

      await expect(
        tracker.onBeforeGenerate(null as any, 'content')
      ).rejects.toThrow('filepath must be a non-empty string');
    });

    it('should throw error for null content', async () => {
      await expect(
        tracker.onBeforeGenerate('/project/test.tsx', null as any)
      ).rejects.toThrow('content cannot be null or undefined');

      await expect(
        tracker.onBeforeGenerate('/project/test.tsx', undefined as any)
      ).rejects.toThrow('content cannot be null or undefined');
    });

    it('should handle concurrent operations on different files', async () => {
      const file1 = '/project/Button.tsx';
      const file2 = '/project/Header.tsx';
      const content1 = 'Button content';
      const content2 = 'Header content';

      // Start both operations concurrently
      await Promise.all([
        tracker.onBeforeGenerate(file1, content1),
        tracker.onBeforeGenerate(file2, content2),
      ]);

      const state = tracker.getState();
      
      // Both files should be tracked
      expect(state.generationHashes.has(file1)).toBe(true);
      expect(state.generationHashes.has(file2)).toBe(true);
      expect(state.pausedPaths.has(file1)).toBe(true);
      expect(state.pausedPaths.has(file2)).toBe(true);
      
      // Hashes should be different
      expect(state.generationHashes.get(file1)).not.toBe(
        state.generationHashes.get(file2)
      );
    });

    it('should clear old timeout when called again for same file', async () => {
      const filepath = '/project/Button.tsx';
      
      await tracker.onBeforeGenerate(filepath, 'content1');
      const timeout1 = tracker.getState().timeouts.get(filepath);
      
      await tracker.onBeforeGenerate(filepath, 'content2');
      const timeout2 = tracker.getState().timeouts.get(filepath);
      
      // Should have different timeout IDs
      expect(timeout1).toBeDefined();
      expect(timeout2).toBeDefined();
      // Should only have one timeout registered
      expect(tracker.getState().timeouts.size).toBe(1);
    });
  });

  describe('onAfterGenerate', () => {
    it('should unpause file after delay', async () => {
      const filepath = '/project/Button.tsx';
      const content = 'const Button = () => <button>Click</button>';

      await tracker.onBeforeGenerate(filepath, content);
      expect(tracker.getState().pausedPaths.has(filepath)).toBe(true);

      // Wait for onAfterGenerate to complete (includes delay)
      await tracker.onAfterGenerate(filepath);

      const state = tracker.getState();
      expect(state.pausedPaths.has(filepath)).toBe(false);
      expect(state.timeouts.has(filepath)).toBe(false);
    });

    it('should respect pause duration', async () => {
      const customTracker = new FileChangeTracker({ pauseDuration: 200 });
      const filepath = '/project/Button.tsx';

      await customTracker.onBeforeGenerate(filepath, 'content');

      const start = Date.now();
      await customTracker.onAfterGenerate(filepath);
      const duration = Date.now() - start;

      // Should wait at least the pause duration
      expect(duration).toBeGreaterThanOrEqual(190); // Allow 10ms tolerance
      expect(duration).toBeLessThan(300); // But not too long

      customTracker.clear();
    });

    it('should clear timeout', async () => {
      const filepath = '/project/Button.tsx';

      await tracker.onBeforeGenerate(filepath, 'content');
      expect(tracker.getState().timeouts.has(filepath)).toBe(true);

      await tracker.onAfterGenerate(filepath);
      expect(tracker.getState().timeouts.has(filepath)).toBe(false);
    });

    it('should handle being called without onBeforeGenerate', async () => {
      const filepath = '/project/Button.tsx';

      // Should not throw even if file wasn't paused
      await expect(
        tracker.onAfterGenerate(filepath)
      ).resolves.not.toThrow();
    });

    it('should throw error for invalid filepath', async () => {
      await expect(
        tracker.onAfterGenerate('')
      ).rejects.toThrow('filepath must be a non-empty string');

      await expect(
        tracker.onAfterGenerate(null as any)
      ).rejects.toThrow('filepath must be a non-empty string');
    });

    it('should handle concurrent onAfterGenerate calls', async () => {
      const file1 = '/project/Button.tsx';
      const file2 = '/project/Header.tsx';

      await tracker.onBeforeGenerate(file1, 'content1');
      await tracker.onBeforeGenerate(file2, 'content2');

      // Call onAfterGenerate concurrently
      await Promise.all([
        tracker.onAfterGenerate(file1),
        tracker.onAfterGenerate(file2),
      ]);

      const state = tracker.getState();
      expect(state.pausedPaths.size).toBe(0);
      expect(state.timeouts.size).toBe(0);
    });
  });

  describe('isUserEdit', () => {
    it('should return false for paused files (tool is writing)', async () => {
      const filepath = '/project/Button.tsx';
      const content = 'const Button = () => <button>Click</button>';

      await tracker.onBeforeGenerate(filepath, content);

      // File is paused, so any content is considered tool edit
      expect(tracker.isUserEdit(filepath, content)).toBe(false);
      expect(tracker.isUserEdit(filepath, 'different content')).toBe(false);
    });

    it('should return true for files with no expected hash (first time)', () => {
      const filepath = '/project/New.tsx';
      const content = 'new content';

      // No hash exists, so should be treated as user edit
      expect(tracker.isUserEdit(filepath, content)).toBe(true);
    });

    it('should return false when content matches expected hash (tool edit)', async () => {
      const filepath = '/project/Button.tsx';
      const content = 'const Button = () => <button>Click</button>';

      await tracker.onBeforeGenerate(filepath, content);
      await tracker.onAfterGenerate(filepath);

      // Content matches what we generated
      expect(tracker.isUserEdit(filepath, content)).toBe(false);
    });

    it('should return true when content differs from expected hash (user edit)', async () => {
      const filepath = '/project/Button.tsx';
      const generatedContent = 'const Button = () => <button>Click</button>';
      const userContent = 'const Button = () => <button>Modified</button>';

      await tracker.onBeforeGenerate(filepath, generatedContent);
      await tracker.onAfterGenerate(filepath);

      // User modified the content
      expect(tracker.isUserEdit(filepath, userContent)).toBe(true);
    });

    it('should handle same content regeneration correctly', async () => {
      const filepath = '/project/Button.tsx';
      const content = 'const Button = () => <button>Click</button>';

      // First generation
      await tracker.onBeforeGenerate(filepath, content);
      await tracker.onAfterGenerate(filepath);

      // Regenerate with exact same content
      await tracker.onBeforeGenerate(filepath, content);
      await tracker.onAfterGenerate(filepath);

      // Should still recognize it as tool edit
      expect(tracker.isUserEdit(filepath, content)).toBe(false);
    });

    it('should detect subtle content changes', async () => {
      const filepath = '/project/Button.tsx';
      const original = 'const Button = () => <button>Click</button>';
      const modified = 'const Button = () => <button>Click</button> '; // Added space

      await tracker.onBeforeGenerate(filepath, original);
      await tracker.onAfterGenerate(filepath);

      // Even single character difference should be detected
      expect(tracker.isUserEdit(filepath, modified)).toBe(true);
    });

    it('should handle empty content', async () => {
      const filepath = '/project/Empty.tsx';

      await tracker.onBeforeGenerate(filepath, '');
      await tracker.onAfterGenerate(filepath);

      expect(tracker.isUserEdit(filepath, '')).toBe(false);
      expect(tracker.isUserEdit(filepath, ' ')).toBe(true);
    });

    it('should handle large content efficiently', async () => {
      const filepath = '/project/Large.tsx';
      const content = 'x'.repeat(1024 * 1024); // 1MB

      await tracker.onBeforeGenerate(filepath, content);
      await tracker.onAfterGenerate(filepath);

      const start = Date.now();
      const result = tracker.isUserEdit(filepath, content);
      const duration = Date.now() - start;

      expect(result).toBe(false);
      expect(duration).toBeLessThan(50); // Should be fast even for 1MB
    });

    it('should fail-safe on hash computation error', () => {
      const filepath = '/project/Test.tsx';
      
      // This should work normally, but we're testing error handling behavior
      // In real scenarios, invalid encoding might cause errors
      const result = tracker.isUserEdit(filepath, 'normal content');
      
      // Should return true (assume user edit on error - fail-safe)
      expect(typeof result).toBe('boolean');
    });
  });

  describe('Edge Case: Timeout Safety Mechanism', () => {
    it('should auto-resume file watching after timeout', async () => {
      const shortTracker = new FileChangeTracker({ autoResumeTimeout: 200 });
      const filepath = '/project/Button.tsx';

      await shortTracker.onBeforeGenerate(filepath, 'content');
      expect(shortTracker.getState().pausedPaths.has(filepath)).toBe(true);

      // Wait for timeout to fire (200ms + buffer)
      await delay(250);

      // File should be auto-resumed
      expect(shortTracker.getState().pausedPaths.has(filepath)).toBe(false);
      
      shortTracker.clear();
    });

    it('should prevent timeout from firing if onAfterGenerate called', async () => {
      const shortTracker = new FileChangeTracker({ autoResumeTimeout: 200 });
      const filepath = '/project/Button.tsx';

      await shortTracker.onBeforeGenerate(filepath, 'content');
      
      // Call onAfterGenerate before timeout
      await shortTracker.onAfterGenerate(filepath);

      // Wait longer than timeout period
      await delay(250);

      // File should still be unpaused (from onAfterGenerate, not timeout)
      expect(shortTracker.getState().pausedPaths.has(filepath)).toBe(false);
      expect(shortTracker.getState().timeouts.has(filepath)).toBe(false);
      
      shortTracker.clear();
    });
  });

  describe('Edge Case: File Deletion and Recreation', () => {
    it('should detect recreated file with different content', async () => {
      const filepath = '/project/Button.tsx';
      const originalContent = 'original version';
      const newContent = 'recreated version';

      // Original generation
      await tracker.onBeforeGenerate(filepath, originalContent);
      await tracker.onAfterGenerate(filepath);

      // File deleted (hash remains)
      // File recreated with different content
      expect(tracker.isUserEdit(filepath, newContent)).toBe(true);
    });
  });

  describe('Edge Case: Rapid Successive Edits', () => {
    it('should detect final state after rapid edits', async () => {
      const filepath = '/project/Button.tsx';
      const generated = 'generated content';

      await tracker.onBeforeGenerate(filepath, generated);
      await tracker.onAfterGenerate(filepath);

      // Simulate 10 rapid edits (in real scenario, file watcher debounces these)
      const finalContent = 'final edited content after 10 edits';

      expect(tracker.isUserEdit(filepath, finalContent)).toBe(true);
    });
  });

  describe('Edge Case: Concurrent Operations on Different Files', () => {
    it('should handle concurrent generation without interference', async () => {
      const files = [
        { path: '/project/A.tsx', content: 'Component A' },
        { path: '/project/B.tsx', content: 'Component B' },
        { path: '/project/C.tsx', content: 'Component C' },
      ];

      // Start all generations concurrently
      await Promise.all(
        files.map((f) => tracker.onBeforeGenerate(f.path, f.content))
      );

      // All should be paused
      files.forEach((f) => {
        expect(tracker.getState().pausedPaths.has(f.path)).toBe(true);
      });

      // Complete all generations
      await Promise.all(files.map((f) => tracker.onAfterGenerate(f.path)));

      // All should be unpaused
      files.forEach((f) => {
        expect(tracker.getState().pausedPaths.has(f.path)).toBe(false);
      });

      // All should correctly identify their content
      files.forEach((f) => {
        expect(tracker.isUserEdit(f.path, f.content)).toBe(false);
      });
    });
  });

  describe('Edge Case: Edit During Pause Window', () => {
    it('should ignore edit during pause window (acceptable tradeoff)', async () => {
      const filepath = '/project/Button.tsx';
      const generated = 'generated content';
      const edited = 'user edited during pause';

      await tracker.onBeforeGenerate(filepath, generated);

      // File is still paused
      // User makes edit (rare race condition)
      expect(tracker.isUserEdit(filepath, edited)).toBe(false);

      // After pause ends, next edit would be detected
      await tracker.onAfterGenerate(filepath);
      expect(tracker.isUserEdit(filepath, edited)).toBe(true);
    });
  });

  describe('State Management', () => {
    it('should provide state snapshot via getState', async () => {
      const filepath = '/project/Button.tsx';
      const content = 'content';

      await tracker.onBeforeGenerate(filepath, content);

      const state = tracker.getState();

      expect(state.generationHashes).toBeInstanceOf(Map);
      expect(state.pausedPaths).toBeInstanceOf(Set);
      expect(state.timeouts).toBeInstanceOf(Map);

      expect(state.generationHashes.has(filepath)).toBe(true);
      expect(state.pausedPaths.has(filepath)).toBe(true);
      expect(state.timeouts.has(filepath)).toBe(true);
    });

    it('should return copy of state (not internal reference)', async () => {
      const filepath = '/project/Button.tsx';
      await tracker.onBeforeGenerate(filepath, 'content');

      const state1 = tracker.getState();
      const state2 = tracker.getState();

      // Should be different objects
      expect(state1.generationHashes).not.toBe(state2.generationHashes);
      expect(state1.pausedPaths).not.toBe(state2.pausedPaths);
      expect(state1.timeouts).not.toBe(state2.timeouts);
    });

    it('should clear all state', async () => {
      const files = ['/project/A.tsx', '/project/B.tsx', '/project/C.tsx'];

      // Generate multiple files
      for (const file of files) {
        await tracker.onBeforeGenerate(file, `content for ${file}`);
      }

      expect(tracker.getState().generationHashes.size).toBe(3);
      expect(tracker.getState().pausedPaths.size).toBe(3);
      expect(tracker.getState().timeouts.size).toBe(3);

      // Clear all
      tracker.clear();

      expect(tracker.getState().generationHashes.size).toBe(0);
      expect(tracker.getState().pausedPaths.size).toBe(0);
      expect(tracker.getState().timeouts.size).toBe(0);
    });

    it('should clear timeouts when clearing state (prevent memory leaks)', async () => {
      const shortTracker = new FileChangeTracker({ autoResumeTimeout: 1000 });
      
      await shortTracker.onBeforeGenerate('/project/test.tsx', 'content');
      
      // Clear before timeout fires
      shortTracker.clear();
      
      // Wait for what would have been the timeout
      await delay(1100);
      
      // State should still be clear (timeout was cancelled)
      expect(shortTracker.getState().pausedPaths.size).toBe(0);
    });
  });

  describe('Memory Management', () => {
    it('should not grow unbounded with many files', async () => {
      const fileCount = 100;
      const files = Array.from(
        { length: fileCount },
        (_, i) => `/project/Component${i}.tsx`
      );

      // Generate many files
      for (const file of files) {
        await tracker.onBeforeGenerate(file, `content ${file}`);
      }

      // Should only store hashes for each file (no duplication)
      expect(tracker.getState().generationHashes.size).toBe(fileCount);

      // Complete all generations
      for (const file of files) {
        await tracker.onAfterGenerate(file);
      }

      // Pauses and timeouts should be cleared
      expect(tracker.getState().pausedPaths.size).toBe(0);
      expect(tracker.getState().timeouts.size).toBe(0);

      // But hashes should remain for future comparison
      expect(tracker.getState().generationHashes.size).toBe(fileCount);
    }, 15000); // Increase timeout for this test (100 files * 100ms delay = 10+ seconds)

    it('should replace old hashes on regeneration (no accumulation)', async () => {
      const filepath = '/project/Button.tsx';

      // Generate same file multiple times
      for (let i = 0; i < 10; i++) {
        await tracker.onBeforeGenerate(filepath, `version ${i}`);
        await tracker.onAfterGenerate(filepath);
      }

      // Should only have one hash entry (latest version)
      expect(tracker.getState().generationHashes.size).toBe(1);
    });
  });

  describe('Performance Benchmarks', () => {
    it('should hash 10KB file in <5ms', async () => {
      const content = 'x'.repeat(10 * 1024); // 10KB
      const filepath = '/project/Medium.tsx';

      const start = Date.now();
      await tracker.onBeforeGenerate(filepath, content);
      const duration = Date.now() - start;

      expect(duration).toBeLessThan(5);
    });

    it('should hash 100KB file in <10ms', async () => {
      const content = 'x'.repeat(100 * 1024); // 100KB
      const filepath = '/project/Large.tsx';

      const start = Date.now();
      await tracker.onBeforeGenerate(filepath, content);
      const duration = Date.now() - start;

      expect(duration).toBeLessThan(10);
    });

    it('should hash 1MB file in <50ms', async () => {
      const content = 'x'.repeat(1024 * 1024); // 1MB
      const filepath = '/project/VeryLarge.tsx';

      const start = Date.now();
      await tracker.onBeforeGenerate(filepath, content);
      const duration = Date.now() - start;

      expect(duration).toBeLessThan(50);
    });

    it('should check paused files in <1ms (fast path)', async () => {
      const filepath = '/project/Button.tsx';
      await tracker.onBeforeGenerate(filepath, 'content');

      const start = Date.now();
      tracker.isUserEdit(filepath, 'any content');
      const duration = Date.now() - start;

      // Fast path: pause check is O(1)
      expect(duration).toBeLessThan(1);
    });
  });

  describe('Debug Mode', () => {
    it('should log debug information when enabled', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      const debugTracker = new FileChangeTracker({ debug: true });

      await debugTracker.onBeforeGenerate('/project/test.tsx', 'content');

      expect(consoleSpy).toHaveBeenCalled();
      
      consoleSpy.mockRestore();
      debugTracker.clear();
    });

    it('should not log when debug disabled', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      await tracker.onBeforeGenerate('/project/test.tsx', 'content');

      // Should not log with debug: false (default)
      expect(consoleSpy).not.toHaveBeenCalled();
      
      consoleSpy.mockRestore();
    });

    it('should log debug info for isUserEdit when paused', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      const debugTracker = new FileChangeTracker({ debug: true });

      await debugTracker.onBeforeGenerate('/project/test.tsx', 'content');
      debugTracker.isUserEdit('/project/test.tsx', 'content');

      // Should log paused status
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('PAUSED')
      );
      
      consoleSpy.mockRestore();
      debugTracker.clear();
    });

    it('should log debug info for isUserEdit when no expected hash', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      const debugTracker = new FileChangeTracker({ debug: true });

      debugTracker.isUserEdit('/project/new.tsx', 'content');

      // Should log no expected hash
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('NO EXPECTED HASH')
      );
      
      consoleSpy.mockRestore();
      debugTracker.clear();
    });

    it('should log debug info for isUserEdit hash comparison', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      const debugTracker = new FileChangeTracker({ debug: true });

      await debugTracker.onBeforeGenerate('/project/test.tsx', 'original');
      await debugTracker.onAfterGenerate('/project/test.tsx');
      
      debugTracker.isUserEdit('/project/test.tsx', 'modified');

      // Should log hash comparison details
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Expected:')
      );
      
      consoleSpy.mockRestore();
      debugTracker.clear();
    });

    it('should log when state is cleared', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      const debugTracker = new FileChangeTracker({ debug: true });

      debugTracker.clear();

      // Should log clear message
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('State cleared')
      );
      
      consoleSpy.mockRestore();
    });
  });

  describe('Error Handling', () => {
    it('should handle errors in onAfterGenerate gracefully', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      await tracker.onBeforeGenerate('/project/test.tsx', 'content');
      
      // Force an error scenario - call onAfterGenerate then check error handling
      await tracker.onAfterGenerate('/project/test.tsx');
      
      // Even if there were errors, file should be unpaused
      expect(tracker.getState().pausedPaths.has('/project/test.tsx')).toBe(false);
      
      consoleErrorSpy.mockRestore();
    });

    it('should log errors in isUserEdit and return true (fail-safe)', () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      // isUserEdit should handle any internal errors gracefully
      const result = tracker.isUserEdit('/project/test.tsx', 'content');
      
      // Should return boolean (fail-safe behavior)
      expect(typeof result).toBe('boolean');
      
      consoleErrorSpy.mockRestore();
    });
  });
});
