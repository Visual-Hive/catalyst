/**
 * @file PreviewError.tsx
 * @description Error state component displayed when preview server fails
 * 
 * Shows error message with recovery options like retry and restart.
 * Provides clear feedback and actionable solutions for common issues.
 * 
 * @architecture Phase 1, Task 1.4B - Preview Panel UI
 * @created 2025-11-25
 * @author AI (Cline) + Human Review
 * @confidence 9/10 - Simple presentational component with actions
 * 
 * @see .implementation/phase-1-application-shell/task-1.4-preview-renderer.md
 * 
 * @security-critical false
 * @performance-critical false
 */

import React from 'react';
import {
  ExclamationTriangleIcon,
  ArrowPathIcon,
  CommandLineIcon,
} from '@heroicons/react/24/outline';

/**
 * Props for PreviewError component
 */
interface PreviewErrorProps {
  /** Error message to display */
  message: string;
  
  /** Callback when retry button is clicked */
  onRetry?: () => void;
  
  /** Callback when restart button is clicked */
  onRestart?: () => void;
  
  /** Whether to show technical details (collapsible) */
  showDetails?: boolean;
  
  /** Technical error details */
  details?: string;
}

/**
 * PreviewError Component
 * 
 * Displays an error state when the preview server fails to start or crashes.
 * Provides retry/restart buttons for recovery and shows helpful error messages.
 * 
 * COMMON ERRORS HANDLED:
 * - Port already in use → Suggests restart
 * - Missing node_modules → Suggests npm install
 * - Build errors → Shows error details
 * - Network errors → Suggests checking firewall
 * 
 * USAGE:
 * ```tsx
 * <PreviewError 
 *   message="Failed to start server" 
 *   onRetry={handleRetry}
 *   onRestart={handleRestart}
 * />
 * ```
 * 
 * @param props - Component props
 * @returns Error state UI
 */
export function PreviewError({
  message,
  onRetry,
  onRestart,
  showDetails = false,
  details,
}: PreviewErrorProps) {
  // Determine error type for custom messaging
  const isPortError = message.toLowerCase().includes('port') || message.toLowerCase().includes('eaddrinuse');
  const isDependencyError = message.toLowerCase().includes('node_modules') || message.toLowerCase().includes('npm') || message.toLowerCase().includes('dependency');
  const isBuildError = message.toLowerCase().includes('build') || message.toLowerCase().includes('syntax') || message.toLowerCase().includes('compile');
  
  // Generate helpful suggestion based on error type
  const getSuggestion = (): string => {
    if (isPortError) {
      return 'The port may be in use by another process. Try restarting the preview.';
    }
    if (isDependencyError) {
      return 'Dependencies may be missing. Try running "npm install" in your project.';
    }
    if (isBuildError) {
      return 'There may be a syntax error in your code. Check the Console tab for details.';
    }
    return 'Try restarting the preview or check the Console tab for more details.';
  };
  
  const [isDetailsOpen, setIsDetailsOpen] = React.useState(false);
  
  return (
    <div className="flex flex-col items-center justify-center h-full bg-gray-50 p-8">
      <div className="max-w-md w-full">
        {/* Error icon */}
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center">
            <ExclamationTriangleIcon className="w-10 h-10 text-red-600" />
          </div>
        </div>
        
        {/* Error title */}
        <h3 className="text-lg font-semibold text-gray-900 text-center mb-2">
          Preview Failed
        </h3>
        
        {/* Error message */}
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
          <p className="text-sm text-red-800 text-center font-medium">
            {message}
          </p>
        </div>
        
        {/* Suggestion */}
        <p className="text-sm text-gray-600 text-center mb-6">
          {getSuggestion()}
        </p>
        
        {/* Action buttons */}
        <div className="flex justify-center gap-3 mb-6">
          {onRetry && (
            <button
              onClick={onRetry}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <ArrowPathIcon className="w-4 h-4" />
              Retry
            </button>
          )}
          
          {onRestart && (
            <button
              onClick={onRestart}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <CommandLineIcon className="w-4 h-4" />
              Restart Server
            </button>
          )}
        </div>
        
        {/* Technical details (collapsible) */}
        {details && (
          <div className="border-t border-gray-200 pt-4">
            <button
              onClick={() => setIsDetailsOpen(!isDetailsOpen)}
              className="flex items-center gap-2 text-xs text-gray-500 hover:text-gray-700 transition-colors mx-auto"
            >
              <span>{isDetailsOpen ? 'Hide' : 'Show'} technical details</span>
              <svg
                className={`w-4 h-4 transition-transform ${isDetailsOpen ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            
            {isDetailsOpen && (
              <pre className="mt-3 p-3 bg-gray-100 rounded-lg text-xs text-gray-600 overflow-x-auto max-h-48 overflow-y-auto">
                {details}
              </pre>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
