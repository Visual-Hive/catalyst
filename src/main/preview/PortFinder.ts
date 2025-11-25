/**
 * @file PortFinder.ts
 * @description Utility for finding available TCP ports in a specified range
 * 
 * Used by ViteServerManager to find an unused port for the Vite dev server.
 * Avoids port conflicts by attempting to bind to ports before using them.
 * 
 * ALGORITHM:
 * 1. Start from preferred port (or minPort)
 * 2. Try to create TCP server on port
 * 3. If EADDRINUSE, increment and retry
 * 4. If bound successfully, close and return port
 * 5. If maxPort exceeded, throw error
 * 
 * @architecture Phase 1, Task 1.4A - Preview Renderer
 * @created 2025-11-25
 * @author AI (Cline) + Human Review
 * @confidence 9/10 - Standard port finding approach
 * 
 * @see .implementation/phase-1-application-shell/task-1.4-preview-renderer.md
 * 
 * @security-critical false
 * @performance-critical false - Only called during server startup
 */

import * as net from 'net';
import { PORT_CONFIG } from './types';

/**
 * Options for port finding
 * 
 * @interface PortFinderOptions
 */
export interface PortFinderOptions {
  /** Port to try first (defaults to PORT_CONFIG.PREFERRED_PORT) */
  startPort?: number;
  
  /** Minimum port in range (defaults to PORT_CONFIG.MIN_PORT) */
  minPort?: number;
  
  /** Maximum port in range (defaults to PORT_CONFIG.MAX_PORT) */
  maxPort?: number;
  
  /** Host to bind to (defaults to 'localhost') */
  host?: string;
}

/**
 * Result of port availability check
 * 
 * @interface PortCheckResult
 */
export interface PortCheckResult {
  /** Whether port is available */
  available: boolean;
  
  /** Port that was checked */
  port: number;
  
  /** Error message if not available */
  error?: string;
}

/**
 * Find an available port in the specified range
 * 
 * Sequentially tries ports from startPort to maxPort until one is available.
 * Uses TCP socket binding to verify availability (more reliable than just checking).
 * 
 * PERFORMANCE:
 * - Best case: O(1) if startPort is available
 * - Worst case: O(n) where n = maxPort - startPort
 * - Typical: 1-3 attempts
 * 
 * @param options - Configuration options
 * @returns Promise with available port number
 * 
 * @throws {Error} If no port available in range
 * 
 * @example
 * ```typescript
 * // Find any available port in default range
 * const port = await findAvailablePort();
 * console.log('Found port:', port);
 * 
 * // Find port starting from 3500
 * const port = await findAvailablePort({ startPort: 3500 });
 * ```
 */
export async function findAvailablePort(
  options: PortFinderOptions = {}
): Promise<number> {
  // Apply defaults from PORT_CONFIG
  const minPort = options.minPort ?? PORT_CONFIG.MIN_PORT;
  const maxPort = options.maxPort ?? PORT_CONFIG.MAX_PORT;
  const startPort = options.startPort ?? PORT_CONFIG.PREFERRED_PORT;
  const host = options.host ?? 'localhost';
  
  // Validate port range
  if (minPort > maxPort) {
    throw new Error(`Invalid port range: minPort (${minPort}) > maxPort (${maxPort})`);
  }
  
  // Clamp startPort to valid range
  const effectiveStartPort = Math.max(minPort, Math.min(startPort, maxPort));
  
  console.log(
    `[PortFinder] Searching for available port starting from ${effectiveStartPort} ` +
    `(range: ${minPort}-${maxPort})`
  );
  
  // Try each port in sequence
  let currentPort = effectiveStartPort;
  let attempts = 0;
  const maxAttempts = maxPort - minPort + 1;
  
  while (attempts < maxAttempts) {
    const result = await isPortAvailable(currentPort, host);
    
    if (result.available) {
      console.log(`[PortFinder] Found available port: ${currentPort} (after ${attempts + 1} attempts)`);
      return currentPort;
    }
    
    // Log if port was busy (not an error, just informational)
    if (attempts < 5) {
      console.log(`[PortFinder] Port ${currentPort} busy, trying next...`);
    }
    
    // Move to next port, wrapping around if needed
    currentPort++;
    if (currentPort > maxPort) {
      currentPort = minPort;
    }
    
    // Avoid infinite loop if we've checked all ports
    attempts++;
  }
  
  // No port found in entire range
  throw new Error(
    `No available port found in range ${minPort}-${maxPort} ` +
    `(checked ${maxAttempts} ports)`
  );
}

/**
 * Check if a specific port is available
 * 
 * Creates a TCP server and attempts to bind to the port.
 * If successful, the port is available. If EADDRINUSE, it's busy.
 * 
 * @param port - Port number to check
 * @param host - Host to bind to (default: 'localhost')
 * @returns Promise with check result
 * 
 * @example
 * ```typescript
 * const result = await isPortAvailable(3000);
 * if (result.available) {
 *   console.log('Port 3000 is free!');
 * }
 * ```
 */
export async function isPortAvailable(
  port: number,
  host: string = 'localhost'
): Promise<PortCheckResult> {
  return new Promise((resolve) => {
    // Create a TCP server to test the port
    const server = net.createServer();
    
    // Handle successful bind - port is available
    server.once('listening', () => {
      // Port is available, close the server
      server.close(() => {
        resolve({
          available: true,
          port,
        });
      });
    });
    
    // Handle bind error - port is busy or other error
    server.once('error', (err: NodeJS.ErrnoException) => {
      // EADDRINUSE means port is already in use
      if (err.code === 'EADDRINUSE') {
        resolve({
          available: false,
          port,
          error: 'Port already in use',
        });
      } else if (err.code === 'EACCES') {
        // Permission denied (usually for ports < 1024)
        resolve({
          available: false,
          port,
          error: 'Permission denied (try a port > 1024)',
        });
      } else {
        // Other error
        resolve({
          available: false,
          port,
          error: err.message,
        });
      }
    });
    
    // Attempt to bind to the port
    try {
      server.listen(port, host);
    } catch (err) {
      // Synchronous error (rare)
      resolve({
        available: false,
        port,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  });
}

/**
 * Find multiple available ports
 * 
 * Useful when you need to allocate several non-conflicting ports at once.
 * 
 * @param count - Number of ports to find
 * @param options - Port finder options
 * @returns Promise with array of available ports
 * 
 * @throws {Error} If not enough ports available in range
 * 
 * @example
 * ```typescript
 * // Find 3 available ports
 * const ports = await findMultipleAvailablePorts(3);
 * console.log('Found ports:', ports);
 * ```
 */
export async function findMultipleAvailablePorts(
  count: number,
  options: PortFinderOptions = {}
): Promise<number[]> {
  const ports: number[] = [];
  let nextStartPort = options.startPort ?? PORT_CONFIG.PREFERRED_PORT;
  
  for (let i = 0; i < count; i++) {
    // Find next available port
    const port = await findAvailablePort({
      ...options,
      startPort: nextStartPort,
    });
    
    ports.push(port);
    
    // Start searching from next port for subsequent iterations
    nextStartPort = port + 1;
  }
  
  return ports;
}

/**
 * Quick check if a port is likely available (non-blocking estimation)
 * 
 * This is a faster but less reliable check. Use isPortAvailable for
 * guaranteed accuracy.
 * 
 * @param port - Port to check
 * @returns Promise<boolean> - true if likely available
 * 
 * @deprecated Use isPortAvailable for reliable checks
 */
export async function isPortLikelyAvailable(port: number): Promise<boolean> {
  const result = await isPortAvailable(port);
  return result.available;
}

// Export default for convenience
export default {
  findAvailablePort,
  isPortAvailable,
  findMultipleAvailablePorts,
  isPortLikelyAvailable,
};
