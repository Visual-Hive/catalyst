/**
 * @file PreviewLoading.tsx
 * @description Loading state component displayed while Vite server starts
 * 
 * Shows a spinner and status message during server startup.
 * Provides visual feedback to users during the ~3-5 second startup time.
 * 
 * @architecture Phase 1, Task 1.4B - Preview Panel UI
 * @created 2025-11-25
 * @author AI (Cline) + Human Review
 * @confidence 9/10 - Simple presentational component
 * 
 * @see .implementation/phase-1-application-shell/task-1.4-preview-renderer.md
 * 
 * @security-critical false
 * @performance-critical false
 */

import React from 'react';

/**
 * Props for PreviewLoading component
 */
interface PreviewLoadingProps {
  /** Optional custom message to display */
  message?: string;
}

/**
 * PreviewLoading Component
 * 
 * Displays a loading spinner and message while the Vite dev server
 * is starting up. Centered in the preview area with subtle animation.
 * 
 * USAGE:
 * ```tsx
 * <PreviewLoading message="Starting development server..." />
 * ```
 * 
 * @param props - Component props
 * @returns Loading state UI
 */
export function PreviewLoading({ message = 'Starting development server...' }: PreviewLoadingProps) {
  return (
    <div className="flex flex-col items-center justify-center h-full bg-gray-50">
      {/* Spinner container with subtle background */}
      <div className="flex flex-col items-center gap-6 p-8 rounded-xl">
        {/* Animated spinner */}
        <div className="relative">
          {/* Outer ring - static */}
          <div className="w-16 h-16 rounded-full border-4 border-gray-200" />
          
          {/* Inner spinning arc */}
          <div className="absolute top-0 left-0 w-16 h-16 rounded-full border-4 border-transparent border-t-blue-500 animate-spin" />
          
          {/* Center icon */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
            <svg
              className="w-6 h-6 text-blue-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z"
              />
            </svg>
          </div>
        </div>
        
        {/* Status message */}
        <div className="text-center">
          <p className="text-sm font-medium text-gray-700">{message}</p>
          <p className="text-xs text-gray-500 mt-1">This may take a few seconds</p>
        </div>
        
        {/* Animated dots indicator */}
        <div className="flex space-x-1">
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" />
        </div>
      </div>
    </div>
  );
}
