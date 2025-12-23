/**
 * @file useAutoRefresh.ts
 * @description Hook for auto-refreshing execution history with configurable interval
 * 
 * @architecture Phase 2.5, Task 2.12 - Execution History UI
 * @created 2025-12-21
 * @author AI (Cline) + Human Review
 * @confidence 9/10 - Standard React pattern for polling
 * 
 * PROBLEM SOLVED:
 * - Need auto-refresh for execution history
 * - Should pause when tab is hidden (performance)
 * - User-controllable via checkbox
 * - Persist preference in localStorage
 * 
 * SOLUTION:
 * - setInterval-based polling
 * - Page Visibility API to pause when hidden
 * - localStorage for persistence
 * - Cleanup on unmount
 * 
 * @performance-critical false - only runs when enabled
 */

import React, { useEffect, useRef, useState } from 'react';

/**
 * Options for auto-refresh behavior
 */
export interface AutoRefreshOptions {
  /** Whether auto-refresh is enabled */
  enabled: boolean;
  
  /** Refresh interval in milliseconds (default: 5000) */
  interval?: number;
  
  /** Whether to pause when page is hidden (default: true) */
  pauseWhenHidden?: boolean;
}

/**
 * Hook for auto-refreshing data with configurable interval
 * 
 * Automatically pauses refresh when the page is hidden (tab switched away)
 * to save resources. Resumes when page becomes visible again.
 * 
 * @param refreshFn - Function to call on each refresh interval
 * @param options - Auto-refresh configuration
 * 
 * @example
 * ```typescript
 * const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(false);
 * 
 * useAutoRefresh(
 *   () => loadExecutions(),
 *   { 
 *     enabled: autoRefreshEnabled,
 *     interval: 5000 
 *   }
 * );
 * ```
 */
export function useAutoRefresh(
  refreshFn: () => void | Promise<void>,
  options: AutoRefreshOptions
): void {
  const { enabled, interval = 5000, pauseWhenHidden = true } = options;
  
  // Store interval ID ref
  const intervalIdRef = useRef<NodeJS.Timeout | null>(null);
  
  // Store page visibility state
  const isVisibleRef = useRef<boolean>(!document.hidden);
  
  useEffect(() => {
    // Don't set up interval if not enabled
    if (!enabled) {
      return;
    }
    
    /**
     * Start the refresh interval
     * Called when page becomes visible or initially
     */
    const startInterval = () => {
      // Clear any existing interval
      if (intervalIdRef.current) {
        clearInterval(intervalIdRef.current);
      }
      
      // Set up new interval
      intervalIdRef.current = setInterval(() => {
        // Only refresh if page is visible (or if we don't care about visibility)
        if (!pauseWhenHidden || isVisibleRef.current) {
          refreshFn();
        }
      }, interval);
    };
    
    /**
     * Stop the refresh interval
     * Called when page becomes hidden
     */
    const stopInterval = () => {
      if (intervalIdRef.current) {
        clearInterval(intervalIdRef.current);
        intervalIdRef.current = null;
      }
    };
    
    /**
     * Handle page visibility changes
     * Pause interval when hidden, resume when visible
     */
    const handleVisibilityChange = () => {
      const isVisible = !document.hidden;
      isVisibleRef.current = isVisible;
      
      if (!pauseWhenHidden) {
        return; // Don't pause/resume if option is disabled
      }
      
      if (isVisible) {
        // Page became visible - resume interval
        startInterval();
        
        // Immediately refresh to get latest data
        refreshFn();
      } else {
        // Page became hidden - pause interval
        stopInterval();
      }
    };
    
    // Set up visibility change listener
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Start initial interval
    startInterval();
    
    // Cleanup on unmount or when dependencies change
    return () => {
      stopInterval();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [enabled, interval, pauseWhenHidden, refreshFn]);
}

/**
 * Hook for managing auto-refresh state with localStorage persistence
 * 
 * Automatically saves auto-refresh preference to localStorage
 * and restores it on mount.
 * 
 * @param storageKey - localStorage key for persistence (default: 'execution-history-auto-refresh')
 * @param defaultEnabled - Default value if no saved preference exists (default: false)
 * @returns Tuple of [enabled, setEnabled]
 * 
 * @example
 * ```typescript
 * const [autoRefreshEnabled, setAutoRefreshEnabled] = useAutoRefreshState();
 * 
 * // Use with useAutoRefresh
 * useAutoRefresh(loadData, { enabled: autoRefreshEnabled });
 * 
 * // Toggle in UI
 * <input 
 *   type="checkbox" 
 *   checked={autoRefreshEnabled}
 *   onChange={(e) => setAutoRefreshEnabled(e.target.checked)}
 * />
 * ```
 */
export function useAutoRefreshState(
  storageKey = 'execution-history-auto-refresh',
  defaultEnabled = false
): [boolean, (enabled: boolean) => void] {
  // Load initial state from localStorage
  const getInitialState = (): boolean => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored !== null) {
        return stored === 'true';
      }
    } catch (error) {
      console.warn('[useAutoRefreshState] Failed to read from localStorage:', error);
    }
    return defaultEnabled;
  };
  
  const [enabled, setEnabledState] = useState<boolean>(getInitialState);
  
  // Save to localStorage whenever state changes
  const setEnabled = (newEnabled: boolean) => {
    setEnabledState(newEnabled);
    
    try {
      localStorage.setItem(storageKey, String(newEnabled));
    } catch (error) {
      console.warn('[useAutoRefreshState] Failed to write to localStorage:', error);
    }
  };
  
  return [enabled, setEnabled];
}
