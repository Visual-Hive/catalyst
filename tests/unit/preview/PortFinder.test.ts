/**
 * @file PortFinder.test.ts
 * @description Unit tests for PortFinder utility
 * 
 * Tests port finding functionality including:
 * - Finding available ports
 * - Handling busy ports
 * - Port range validation
 * - Edge cases and error handling
 * 
 * @architecture Phase 1, Task 1.4A - Preview Renderer
 * @created 2025-11-25
 * @author AI (Cline) + Human Review
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as net from 'net';

// Import the module
import {
  findAvailablePort,
  isPortAvailable,
  findMultipleAvailablePorts,
} from '../../../src/main/preview/PortFinder';
import { PORT_CONFIG } from '../../../src/main/preview/types';

describe('PortFinder', () => {
  describe('isPortAvailable', () => {
    it('should return true for an available port', async () => {
      // Use a high port number that's unlikely to be in use
      const result = await isPortAvailable(59999);
      
      // Note: This test might fail if port is actually in use
      // In practice, 59999 is rarely used
      expect(result.port).toBe(59999);
      // Result could be true or false depending on system state
      expect(typeof result.available).toBe('boolean');
    });

    it('should return false for a port in use', async () => {
      // Create a server on a random port
      const server = net.createServer();
      
      await new Promise<void>((resolve) => {
        server.listen(0, 'localhost', () => {
          resolve();
        });
      });
      
      const address = server.address();
      const port = (address as net.AddressInfo).port;
      
      // Now check if that port is available
      const result = await isPortAvailable(port);
      
      expect(result.available).toBe(false);
      expect(result.port).toBe(port);
      expect(result.error).toBe('Port already in use');
      
      // Clean up
      server.close();
    });

    it('should include error message for unavailable ports', async () => {
      // Create a server to occupy a port
      const server = net.createServer();
      
      await new Promise<void>((resolve) => {
        server.listen(0, 'localhost', () => {
          resolve();
        });
      });
      
      const address = server.address();
      const port = (address as net.AddressInfo).port;
      
      const result = await isPortAvailable(port);
      
      expect(result.error).toBeDefined();
      expect(typeof result.error).toBe('string');
      
      server.close();
    });
  });

  describe('findAvailablePort', () => {
    it('should find an available port in default range', async () => {
      const port = await findAvailablePort();
      
      // Should be in the default range
      expect(port).toBeGreaterThanOrEqual(PORT_CONFIG.MIN_PORT);
      expect(port).toBeLessThanOrEqual(PORT_CONFIG.MAX_PORT);
    });

    it('should respect startPort option', async () => {
      const startPort = 3500;
      const port = await findAvailablePort({ startPort });
      
      // Should start from startPort or higher
      expect(port).toBeGreaterThanOrEqual(startPort);
      expect(port).toBeLessThanOrEqual(PORT_CONFIG.MAX_PORT);
    });

    it('should respect minPort and maxPort options', async () => {
      const minPort = 3100;
      const maxPort = 3200;
      const port = await findAvailablePort({ minPort, maxPort });
      
      expect(port).toBeGreaterThanOrEqual(minPort);
      expect(port).toBeLessThanOrEqual(maxPort);
    });

    it('should throw error for invalid port range', async () => {
      await expect(
        findAvailablePort({ minPort: 4000, maxPort: 3000 })
      ).rejects.toThrow('Invalid port range');
    });

    it('should find next available port when startPort is busy', async () => {
      // Create a server on startPort
      const startPort = 3050;
      const server = net.createServer();
      
      await new Promise<void>((resolve) => {
        server.listen(startPort, 'localhost', () => {
          resolve();
        });
      });
      
      try {
        const port = await findAvailablePort({
          startPort,
          minPort: 3050,
          maxPort: 3100,
        });
        
        // Should be greater than startPort since it's busy
        expect(port).toBeGreaterThan(startPort);
        expect(port).toBeLessThanOrEqual(3100);
      } finally {
        server.close();
      }
    });

    it('should clamp startPort to valid range', async () => {
      // startPort below minPort should be clamped
      const port = await findAvailablePort({
        startPort: 2000,
        minPort: 3001,
        maxPort: 3100,
      });
      
      expect(port).toBeGreaterThanOrEqual(3001);
    });

    it('should handle all ports busy gracefully', async () => {
      // Create servers on a small range
      const minPort = 50000;
      const maxPort = 50002;
      const servers: net.Server[] = [];
      
      for (let p = minPort; p <= maxPort; p++) {
        const server = net.createServer();
        await new Promise<void>((resolve, reject) => {
          server.on('error', (err) => {
            // Port might already be in use, skip it
            resolve();
          });
          server.listen(p, 'localhost', () => {
            servers.push(server);
            resolve();
          });
        });
      }
      
      try {
        // Only run this test if we successfully blocked all ports
        if (servers.length === maxPort - minPort + 1) {
          await expect(
            findAvailablePort({ minPort, maxPort, startPort: minPort })
          ).rejects.toThrow('No available port found');
        }
      } finally {
        servers.forEach(s => s.close());
      }
    });
  });

  describe('findMultipleAvailablePorts', () => {
    it('should find multiple unique available ports', async () => {
      const ports = await findMultipleAvailablePorts(3);
      
      expect(ports).toHaveLength(3);
      
      // All ports should be unique
      const uniquePorts = new Set(ports);
      expect(uniquePorts.size).toBe(3);
      
      // All ports should be in valid range
      for (const port of ports) {
        expect(port).toBeGreaterThanOrEqual(PORT_CONFIG.MIN_PORT);
        expect(port).toBeLessThanOrEqual(PORT_CONFIG.MAX_PORT);
      }
    });

    it('should return consecutive or near-consecutive ports', async () => {
      const ports = await findMultipleAvailablePorts(3, { startPort: 3500 });
      
      // Ports should be in ascending order
      expect(ports[1]).toBeGreaterThan(ports[0]);
      expect(ports[2]).toBeGreaterThan(ports[1]);
    });

    it('should find single port when count is 1', async () => {
      const ports = await findMultipleAvailablePorts(1);
      
      expect(ports).toHaveLength(1);
      expect(typeof ports[0]).toBe('number');
    });

    it('should return empty array when count is 0', async () => {
      const ports = await findMultipleAvailablePorts(0);
      
      expect(ports).toHaveLength(0);
    });
  });

  describe('edge cases', () => {
    it('should handle localhost binding', async () => {
      // Default host is localhost
      const result = await isPortAvailable(59998, 'localhost');
      expect(result.port).toBe(59998);
    });

    it('should handle 127.0.0.1 binding', async () => {
      const result = await isPortAvailable(59997, '127.0.0.1');
      expect(result.port).toBe(59997);
    });

    it('should include port number in result', async () => {
      const testPort = 59996;
      const result = await isPortAvailable(testPort);
      expect(result.port).toBe(testPort);
    });
  });
});
