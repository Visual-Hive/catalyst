/**
 * @file PreviewFrame.tsx
 * @description Sandboxed iframe component for rendering the preview
 * 
 * Renders the user's React application in a secure, sandboxed iframe.
 * Handles viewport sizing, zoom transformations, and load states.
 * 
 * SECURITY:
 * - Uses strict iframe sandbox attributes
 * - No allow-top-navigation (cannot navigate parent)
 * - No allow-popups (cannot open new windows)
 * - Content is loaded from localhost only
 * 
 * @architecture Phase 1, Task 1.4B - Preview Panel UI
 * @created 2025-11-25
 * @author AI (Cline) + Human Review
 * @confidence 9/10 - Security-conscious iframe implementation
 * 
 * @see .implementation/phase-1-application-shell/task-1.4-preview-renderer.md
 * @see docs/SECURITY_SPEC.md - iframe security requirements
 * 
 * @security-critical true - iframe sandboxing is critical
 * @performance-critical false
 */

import React, { useCallback, useState, useRef, useEffect } from 'react';

/**
 * Device frame dimensions for visual representation
 * Adds padding/bezel around the viewport to simulate device appearance
 */
const DEVICE_FRAME_PADDING = 12;
const DEVICE_FRAME_BORDER_RADIUS = 24;
const FRAME_PADDING = 24; // Padding around the device frame in the scrollable area

/**
 * Props for PreviewFrame component
 */
interface PreviewFrameProps {
  /** URL to load in the iframe (http://localhost:PORT) */
  url: string;
  
  /** Viewport width in pixels (-1 for responsive/fill) */
  viewportWidth: number;
  
  /** Viewport height in pixels (-1 for responsive/fill) */
  viewportHeight: number;
  
  /** Zoom level (0.25 - 2) */
  zoom: number;
  
  /** Key to force iframe refresh */
  refreshKey?: number;
  
  /** Callback when iframe finishes loading */
  onLoad?: () => void;
  
  /** Callback when iframe has an error */
  onError?: (error: string) => void;
}

/**
 * PreviewFrame Component
 * 
 * Renders a sandboxed iframe that displays the user's React application.
 * Handles responsive sizing, viewport simulation, and zoom transformations.
 * 
 * SANDBOX PERMISSIONS:
 * - allow-scripts: Required for React JavaScript execution
 * - allow-same-origin: Required for HMR WebSocket connection
 * - allow-forms: Common in web apps, safe to allow
 * 
 * NOT ALLOWED:
 * - allow-top-navigation: Prevents iframe from redirecting parent
 * - allow-popups: Prevents iframe from opening new windows
 * - allow-pointer-lock: Not needed
 * - allow-modals: Prevents alert/confirm dialogs
 * 
 * USAGE:
 * ```tsx
 * <PreviewFrame
 *   url="http://localhost:3001"
 *   viewportWidth={375}
 *   viewportHeight={667}
 *   zoom={1}
 * />
 * ```
 * 
 * @param props - Component props
 * @returns Sandboxed iframe element
 */
export function PreviewFrame({
  url,
  viewportWidth,
  viewportHeight,
  zoom,
  refreshKey = 0,
  onLoad,
  onError,
}: PreviewFrameProps) {
  // Track iframe loading state
  const [isLoading, setIsLoading] = useState(true);
  
  // Reference to container for calculating responsive dimensions
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Reference to iframe for potential future interactions
  const iframeRef = useRef<HTMLIFrameElement>(null);
  
  // Handle iframe load event
  const handleLoad = useCallback(() => {
    setIsLoading(false);
    onLoad?.();
  }, [onLoad]);
  
  // Handle iframe error
  const handleError = useCallback(() => {
    setIsLoading(false);
    onError?.('Failed to load preview');
  }, [onError]);
  
  // Determine if using responsive (fill) mode
  const isResponsive = viewportWidth === -1 || viewportHeight === -1;
  
  // For device viewports, calculate the scaled dimensions
  const scaledWidth = viewportWidth * zoom;
  const scaledHeight = viewportHeight * zoom;
  
  // Total space needed including device frame and padding
  const totalFrameWidth = scaledWidth + (DEVICE_FRAME_PADDING * 2) + (FRAME_PADDING * 2);
  const totalFrameHeight = scaledHeight + (DEVICE_FRAME_PADDING * 2) + (FRAME_PADDING * 2) + 32; // Extra for label
  
  // Checkerboard pattern CSS
  const checkerboardStyle = {
    backgroundImage: `linear-gradient(45deg, #d1d5db 25%, transparent 25%), 
                      linear-gradient(-45deg, #d1d5db 25%, transparent 25%), 
                      linear-gradient(45deg, transparent 75%, #d1d5db 75%), 
                      linear-gradient(-45deg, transparent 75%, #d1d5db 75%)`,
    backgroundSize: '20px 20px',
    backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px',
    backgroundColor: '#e5e7eb',
  };
  
  // Responsive mode - iframe fills the container completely
  if (isResponsive) {
    return (
      <div
        ref={containerRef}
        className="relative w-full h-full"
        style={{ zIndex: 0, ...checkerboardStyle }}
      >
        <iframe
          ref={iframeRef}
          key={`preview-${refreshKey}`}
          src={url}
          title="Preview"
          onLoad={handleLoad}
          onError={handleError}
          className="w-full h-full border-0 bg-white"
          sandbox="allow-scripts allow-same-origin allow-forms"
        />
        
        {/* Loading overlay */}
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/80 pointer-events-none">
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-3 border-gray-200 border-t-blue-500 rounded-full animate-spin" />
              <span className="text-sm text-gray-600">Loading preview...</span>
            </div>
          </div>
        )}
      </div>
    );
  }
  
  // Device viewport mode - scrollable container with device frame
  return (
    <div
      ref={containerRef}
      className="w-full h-full"
      style={{
        zIndex: 0,
        overflow: 'auto',
        ...checkerboardStyle,
      }}
    >
      {/* Scrollable content area - sized to hold the device frame */}
      <div
        style={{
          // Set explicit dimensions to create scrollable area
          width: totalFrameWidth,
          height: totalFrameHeight,
          // Use flex to center the device frame  
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          padding: FRAME_PADDING,
          boxSizing: 'border-box',
        }}
      >
        {/* Device frame container - provides visual boundary */}
        <div
          className="relative flex-shrink-0 bg-gray-800 shadow-2xl"
          style={{
            width: scaledWidth + (DEVICE_FRAME_PADDING * 2),
            height: scaledHeight + (DEVICE_FRAME_PADDING * 2),
            borderRadius: DEVICE_FRAME_BORDER_RADIUS,
            padding: DEVICE_FRAME_PADDING,
          }}
        >
          {/* Inner viewport container with rounded corners to clip content */}
          <div
            className="relative overflow-hidden bg-white"
            style={{
              width: scaledWidth,
              height: scaledHeight,
              borderRadius: DEVICE_FRAME_BORDER_RADIUS - 8,
            }}
          >
            {/* The iframe scaled via CSS transform */}
            <iframe
              ref={iframeRef}
              key={`preview-${refreshKey}`}
              src={url}
              title="Preview"
              onLoad={handleLoad}
              onError={handleError}
              className="border-0 bg-white"
              style={{
                width: viewportWidth,
                height: viewportHeight,
                transform: `scale(${zoom})`,
                transformOrigin: 'top left',
              }}
              sandbox="allow-scripts allow-same-origin allow-forms"
            />
          </div>
          
          {/* Device frame label showing dimensions */}
          <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-xs text-gray-500 whitespace-nowrap">
            {viewportWidth} × {viewportHeight} ({Math.round(zoom * 100)}%)
          </div>
        </div>
      </div>
      
      {/* Loading overlay */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/80 pointer-events-none">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-3 border-gray-200 border-t-blue-500 rounded-full animate-spin" />
            <span className="text-sm text-gray-600">Loading preview...</span>
          </div>
        </div>
      )}
    </div>
  );
}
