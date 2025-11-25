/**
 * @file types.ts
 * @description Type definitions for the preview system
 * 
 * Defines interfaces and types for:
 * - Vite server state management
 * - Preview IPC communication
 * - Viewport presets and configuration
 * 
 * @architecture Phase 1, Task 1.4A - Preview Renderer
 * @created 2025-11-25
 * @author AI (Cline) + Human Review
 * @confidence 9/10 - Standard type definitions
 * 
 * @see .implementation/phase-1-application-shell/task-1.4-preview-renderer.md
 * 
 * @security-critical false
 * @performance-critical false
 */

/**
 * Vite server operational status
 * 
 * STATE MACHINE:
 * stopped -> starting -> running
 *    ^          |          |
 *    |          v          v
 *    +------- error <------+
 * 
 * @enum ViteServerStatus
 */
export type ViteServerStatus = 'stopped' | 'starting' | 'running' | 'stopping' | 'error';

/**
 * Complete state of the Vite dev server
 * 
 * Represents current server status including connection details and errors.
 * Used for IPC communication between main and renderer processes.
 * 
 * @interface ViteServerState
 */
export interface ViteServerState {
  /** Current operational status */
  status: ViteServerStatus;
  
  /** Port the server is listening on (null if not running) */
  port: number | null;
  
  /** Full URL to access the preview (null if not running) */
  url: string | null;
  
  /** Error message if status is 'error' */
  error: string | null;
  
  /** Path to the project being served */
  projectPath: string | null;
  
  /** Process ID of the Vite server (for debugging) */
  pid: number | null;
  
  /** Timestamp when server started */
  startedAt: Date | null;
}

/**
 * Message types sent from preview iframe to parent window
 * 
 * Used for console capture and runtime error reporting.
 * Will be implemented in Task 1.4C.
 * 
 * @interface PreviewMessage
 */
export interface PreviewMessage {
  /** Type of message */
  type: 'console' | 'error' | 'ready' | 'navigation';
  
  /** Message payload (varies by type) */
  payload: unknown;
}

/**
 * Console log entry captured from preview
 * 
 * @interface ConsoleLogPayload
 */
export interface ConsoleLogPayload {
  /** Log level (matches console method name) */
  level: 'log' | 'warn' | 'error' | 'info' | 'debug';
  
  /** Serialized arguments passed to console method */
  args: unknown[];
  
  /** Stack trace (for errors) */
  stack?: string;
  
  /** Timestamp when log was captured */
  timestamp: number;
}

/**
 * Runtime error payload from preview
 * 
 * @interface RuntimeErrorPayload
 */
export interface RuntimeErrorPayload {
  /** Error message */
  message: string;
  
  /** Source file where error occurred */
  filename?: string;
  
  /** Line number in source file */
  lineno?: number;
  
  /** Column number in source file */
  colno?: number;
  
  /** Full stack trace */
  stack?: string;
}

/**
 * Viewport preset configuration
 * 
 * Defines common device viewport sizes for responsive design testing.
 * 
 * @interface ViewportPreset
 */
export interface ViewportPreset {
  /** Display name for the preset (e.g., "iPhone SE") */
  name: string;
  
  /** Viewport width in pixels (-1 for responsive/fill) */
  width: number;
  
  /** Viewport height in pixels (-1 for responsive/fill) */
  height: number;
  
  /** Icon identifier for UI display */
  icon: 'phone' | 'tablet' | 'laptop' | 'desktop' | 'arrows';
  
  /** Device pixel ratio (optional, defaults to 1) */
  devicePixelRatio?: number;
}

/**
 * Configuration for Vite server startup
 * 
 * @interface ViteServerConfig
 */
export interface ViteServerConfig {
  /** Absolute path to project directory */
  projectPath: string;
  
  /** Preferred port (will find alternative if busy) */
  preferredPort?: number;
  
  /** Minimum port in search range */
  minPort?: number;
  
  /** Maximum port in search range */
  maxPort?: number;
  
  /** Timeout for server startup in milliseconds */
  startupTimeout?: number;
}

/**
 * Result of attempting to start Vite server
 * 
 * @interface ViteStartResult
 */
export interface ViteStartResult {
  /** Whether startup was successful */
  success: boolean;
  
  /** Port number if successful */
  port?: number;
  
  /** URL to access preview if successful */
  url?: string;
  
  /** Error message if failed */
  error?: string;
}

/**
 * Events emitted by ViteServerManager
 * 
 * Used for type-safe event handling.
 * 
 * @interface ViteServerEvents
 */
export interface ViteServerEvents {
  /** Server is ready and accepting connections */
  ready: { port: number; url: string };
  
  /** Server encountered an error */
  error: { message: string; code?: string };
  
  /** Server has stopped */
  stopped: void;
  
  /** Output from server stdout/stderr */
  output: { line: string; type: 'stdout' | 'stderr' };
  
  /** Server state changed */
  stateChange: ViteServerState;
}

/**
 * IPC channel names for preview system
 * 
 * Centralized channel names to prevent typos and enable refactoring.
 * 
 * @const PreviewChannels
 */
export const PreviewChannels = {
  // Request channels (renderer -> main)
  START: 'preview:start',
  STOP: 'preview:stop',
  RESTART: 'preview:restart',
  STATUS: 'preview:status',
  
  // Event channels (main -> renderer)
  READY: 'preview:ready',
  ERROR: 'preview:error',
  OUTPUT: 'preview:output',
  STATE_CHANGE: 'preview:state-change',
} as const;

/**
 * Default viewport presets for responsive design testing
 * 
 * Covers common device sizes from mobile to desktop.
 * "Responsive" preset (-1 values) fills available space.
 * 
 * @const DEFAULT_VIEWPORT_PRESETS
 */
export const DEFAULT_VIEWPORT_PRESETS: ViewportPreset[] = [
  { name: 'iPhone SE', width: 375, height: 667, icon: 'phone', devicePixelRatio: 2 },
  { name: 'iPhone 14', width: 390, height: 844, icon: 'phone', devicePixelRatio: 3 },
  { name: 'iPhone 14 Pro Max', width: 430, height: 932, icon: 'phone', devicePixelRatio: 3 },
  { name: 'iPad Mini', width: 768, height: 1024, icon: 'tablet', devicePixelRatio: 2 },
  { name: 'iPad Pro 12.9"', width: 1024, height: 1366, icon: 'tablet', devicePixelRatio: 2 },
  { name: 'Laptop', width: 1280, height: 800, icon: 'laptop' },
  { name: 'Desktop HD', width: 1920, height: 1080, icon: 'desktop' },
  { name: 'Desktop 4K', width: 2560, height: 1440, icon: 'desktop' },
  { name: 'Responsive', width: -1, height: -1, icon: 'arrows' },
];

/**
 * Available zoom levels for preview
 * 
 * @const ZOOM_LEVELS
 */
export const ZOOM_LEVELS = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 2] as const;

/**
 * Default zoom level (100%)
 * 
 * @const DEFAULT_ZOOM
 */
export const DEFAULT_ZOOM = 1;

/**
 * Port range for Vite dev server
 * 
 * Avoids:
 * - 3000: Common development port
 * - 5173: Rise's own Vite dev server
 * - >4000: Common for backend services
 * 
 * @const PORT_CONFIG
 */
export const PORT_CONFIG = {
  /** Minimum port to try */
  MIN_PORT: 3001,
  
  /** Maximum port to try */
  MAX_PORT: 3999,
  
  /** Default preferred port */
  PREFERRED_PORT: 3001,
} as const;

/**
 * Timeout configuration for server operations
 * 
 * @const SERVER_TIMEOUTS
 */
export const SERVER_TIMEOUTS = {
  /** Maximum time to wait for server to start (ms) */
  STARTUP: 30000,
  
  /** Time to wait for graceful shutdown before SIGKILL (ms) */
  GRACEFUL_SHUTDOWN: 5000,
  
  /** Time between health checks (ms) */
  HEALTH_CHECK_INTERVAL: 1000,
} as const;
