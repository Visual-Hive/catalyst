/**
 * @file electron/main.ts
 * @description Electron main process entry point
 * 
 * This file initializes the Electron application with proper security settings,
 * window management, and lifecycle handling. It follows Electron security best
 * practices with nodeIntegration disabled and contextIsolation enabled.
 * 
 * @architecture Phase 1, Task 1.1 - Electron Application Shell
 * @created 2025-11-19
 * @author AI (Cline) + Human Review
 * @confidence 9/10 - Following Electron security best practices
 * 
 * @see docs/ARCHITECTURE.md - Electron architecture section
 * @see docs/SECURITY_SPEC.md - IPC security requirements
 * 
 * @security-critical true
 * @performance-critical false
 */

import { app, BrowserWindow, Menu, shell } from 'electron';
import path from 'path';
import { setupIpcHandlers, cleanupPreviewServer, cleanupIpcHandlers } from './ipc-handlers';
import { setupWorkflowGenerationHandlers, cleanupWorkflowGenerationHandlers } from './workflow-generation-handlers';

/**
 * Main application window instance
 * Kept as singleton for this MVP
 */
let mainWindow: BrowserWindow | null = null;

/**
 * Flag to track if app is in development mode
 */
const isDevelopment = process.env.NODE_ENV === 'development' || !app.isPackaged;

/**
 * Creates the main application window with secure configuration
 * 
 * SECURITY CRITICAL: This function implements all security best practices:
 * - nodeIntegration: false (prevents Node.js access from renderer)
 * - contextIsolation: true (isolates preload script context)
 * - sandbox: true (additional security layer)
 * - Only specific APIs exposed via contextBridge in preload
 * 
 * @returns Promise that resolves when window is ready
 */
async function createWindow(): Promise<void> {
  // Create window with security settings
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    // Window styling
    title: 'Catalyst - Visual Workflow Builder',
    backgroundColor: '#ffffff',
    // Disable menu bar initially (we'll set custom menu)
    autoHideMenuBar: false,
    webPreferences: {
      // ⚠️ CRITICAL SECURITY SETTINGS - DO NOT CHANGE
      nodeIntegration: false,           // Never enable this
      contextIsolation: true,            // Must be true
      sandbox: true,                     // Additional security
      // Preload script for secure IPC
      preload: path.join(__dirname, 'preload.js'),
      // Disable potentially dangerous features
      webSecurity: true,
      allowRunningInsecureContent: false,
      // Disable experimental features
      experimentalFeatures: false,
    },
  });

  // Set Content Security Policy
  // In development, we need to allow Vite's HMR inline scripts
  // In production, use stricter policy
  if (!isDevelopment) {
    mainWindow.webContents.session.webRequest.onHeadersReceived((details, callback) => {
      callback({
        responseHeaders: {
          ...details.responseHeaders,
          'Content-Security-Policy': [
            "default-src 'self'",
            "script-src 'self'",
            "style-src 'self' 'unsafe-inline'",
            "img-src 'self' data:",
            "font-src 'self'",
            "connect-src 'self'",
          ].join('; '),
        },
      });
    });
  }

  // Load the app
  if (isDevelopment) {
    // Development: Load from Vite dev server
    await mainWindow.loadURL('http://localhost:5173');
    
    // Open DevTools automatically in development
    mainWindow.webContents.openDevTools();
  } else {
    // Production: Load from built files
    await mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  // Handle external links - open in default browser, not in Electron
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    // Only allow http(s) URLs to be opened externally
    if (url.startsWith('http://') || url.startsWith('https://')) {
      shell.openExternal(url);
    }
    return { action: 'deny' }; // Prevent new windows
  });

  // Handle window closed
  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

/**
 * Creates application menu
 * Provides standard menu items for File, Edit, View, Window, and Help
 */
function createApplicationMenu(): void {
  const template: Electron.MenuItemConstructorOptions[] = [
    // File menu
    {
      label: 'File',
      submenu: [
        {
          label: 'New Project...',
          accelerator: 'CmdOrCtrl+N',
          click: () => {
            // TODO: Implement in Task 1.3
            console.log('New Project clicked');
          },
        },
        {
          label: 'Open Project...',
          accelerator: 'CmdOrCtrl+O',
          click: () => {
            // TODO: Implement in Task 1.3
            console.log('Open Project clicked');
          },
        },
        { type: 'separator' },
        {
          label: 'Save',
          accelerator: 'CmdOrCtrl+S',
          click: () => {
            // TODO: Implement in Task 1.3
            console.log('Save clicked');
          },
        },
        { type: 'separator' },
        { role: 'quit' },
      ],
    },
    // Edit menu
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { role: 'selectAll' },
      ],
    },
    // View menu
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' },
      ],
    },
    // Window menu
    {
      label: 'Window',
      submenu: [
        { role: 'minimize' },
        { role: 'zoom' },
        ...(process.platform === 'darwin'
          ? [
              { type: 'separator' as const },
              { role: 'front' as const },
            ]
          : []),
      ],
    },
    // Help menu
    {
      role: 'help',
      submenu: [
        {
          label: 'Learn More',
          click: async () => {
            await shell.openExternal('https://github.com/Visual-Hive/catalyst');
          },
        },
        {
          label: 'Documentation',
          click: async () => {
            await shell.openExternal('https://github.com/Visual-Hive/catalyst/docs');
          },
        },
      ],
    },
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

/**
 * Set up global error handlers for the main process
 * Prevents app from crashing silently on uncaught errors
 */
function setupErrorHandlers(): void {
  // Handle uncaught exceptions
  process.on('uncaughtException', (error) => {
    console.error('[FATAL] Uncaught Exception:', error);
    // In production, you might want to show error dialog
    // and write to log file before exiting
  });

  // Handle unhandled promise rejections
  process.on('unhandledRejection', (reason, promise) => {
    console.error('[ERROR] Unhandled Promise Rejection:', reason);
    console.error('Promise:', promise);
  });
}

/**
 * Application lifecycle: Ready event
 * This is called when Electron has finished initialization
 */
app.whenReady().then(async () => {
  // Set up error handlers first
  setupErrorHandlers();

  // Set up IPC handlers (now async for ProjectManager initialization)
  await setupIpcHandlers();
  
  // Set up workflow generation handlers (Phase 2 LLM integration)
  setupWorkflowGenerationHandlers();

  // Create application menu
  createApplicationMenu();

  // Create main window
  await createWindow();

  // macOS: Re-create window when dock icon clicked and no windows open
  app.on('activate', async () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      await createWindow();
    }
  });

  console.log('[INFO] Catalyst application started successfully');
});

/**
 * Application lifecycle: Window all closed
 * Quit on all platforms except macOS
 */
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

/**
 * Application lifecycle: Before quit
 * Clean up resources including preview server to prevent orphan processes
 * 
 * CRITICAL: This ensures no Vite dev server processes are left running
 * when the app closes. Without this, orphan Node.js processes would remain.
 */
app.on('before-quit', async (event) => {
  console.log('[INFO] Application quitting, cleaning up resources...');
  
  // Prevent quit until cleanup is done
  event.preventDefault();
  
  try {
    // Clean up preview server (kills any running Vite process)
    await cleanupPreviewServer();
    
    // Clean up IPC handlers
    cleanupIpcHandlers();
    
    // Clean up workflow generation handlers
    cleanupWorkflowGenerationHandlers();
    
    console.log('[INFO] Cleanup complete, quitting...');
  } catch (error) {
    console.error('[ERROR] Cleanup failed:', error);
  }
  
  // Now actually quit (without triggering before-quit again)
  app.exit(0);
});

/**
 * Security: Prevent navigation to untrusted URLs
 * This is a defense-in-depth measure
 */
app.on('web-contents-created', (event, contents) => {
  // Prevent navigation to external URLs
  contents.on('will-navigate', (navEvent, navigationUrl) => {
    const parsedUrl = new URL(navigationUrl);
    
    // Allow localhost in development
    if (isDevelopment && parsedUrl.hostname === 'localhost') {
      return;
    }
    
    // Prevent all other navigation
    console.warn('[SECURITY] Prevented navigation to:', navigationUrl);
    navEvent.preventDefault();
  });

  // Prevent new window creation (except via our window open handler)
  contents.setWindowOpenHandler(({ url }) => {
    console.warn('[SECURITY] Blocked window.open:', url);
    return { action: 'deny' };
  });
});
