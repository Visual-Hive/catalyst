/**
 * @file useLayout.ts
 * @description Custom hook for managing layout state with localStorage persistence
 * 
 * @architecture Phase 1, Task 1.2 - Three-Panel Layout
 * @created 2025-11-19
 * @author AI (Cline) + Human Review
 * @confidence 9/10 - Standard React hook pattern, well-tested approach
 * 
 * PROBLEM SOLVED:
 * - Manages panel sizes and active tab state
 * - Persists user preferences across app restarts
 * - Provides centralized state management for layout
 * 
 * SOLUTION:
 * - Uses localStorage for persistence
 * - Provides hooks for panel focus management
 * - Handles keyboard shortcut state
 * 
 * USAGE EXAMPLE:
 * ```typescript
 * const { activeTab, setActiveTab, focusPanel } = useLayout();
 * ```
 * 
 * @performance O(1) for state reads, localStorage writes are debounced by browser
 * @security-critical false
 * @performance-critical false - UI state only
 */

import { useState, useEffect, useCallback } from 'react';

/**
 * Storage keys for persisting layout state
 */
const STORAGE_KEYS = {
  ACTIVE_TAB: 'rise-editor-active-tab',
  PANEL_SIZES: 'rise-panel-sizes',
} as const;

/**
 * Default panel size percentages
 */
const DEFAULT_PANEL_SIZES = {
  navigator: 20,
  editor: 55,
  properties: 25,
} as const;

/**
 * Panel identifiers
 */
export type PanelId = 'navigator' | 'editor' | 'properties';

/**
 * Tab identifiers for the editor panel
 * Phase 4: Added 'logic' tab for visual logic editing
 */
export type TabId = 'preview' | 'code' | 'console' | 'logic';

/**
 * Panel size configuration
 */
export interface PanelSizes {
  navigator: number;
  editor: number;
  properties: number;
}

/**
 * Layout hook return type
 */
export interface UseLayoutResult {
  activeTab: TabId;
  setActiveTab: (tab: TabId) => void;
  panelSizes: PanelSizes;
  setPanelSizes: (sizes: number[]) => void;
  focusPanel: (panel: PanelId) => void;
}

/**
 * Custom hook for managing layout state
 * 
 * Manages:
 * - Active tab in editor panel
 * - Panel sizes (persisted to localStorage)
 * - Panel focus state
 * 
 * @returns Layout state and control functions
 * 
 * @example
 * ```typescript
 * const { activeTab, setActiveTab, focusPanel } = useLayout();
 * 
 * // Switch to code tab
 * setActiveTab('code');
 * 
 * // Focus editor panel (for keyboard shortcuts)
 * focusPanel('editor');
 * ```
 */
export function useLayout(): UseLayoutResult {
  // Active tab state with localStorage persistence
  const [activeTab, setActiveTabState] = useState<TabId>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.ACTIVE_TAB);
    return (saved as TabId) || 'preview';
  });

  // Panel sizes state with localStorage persistence
  const [panelSizes, setPanelSizesState] = useState<PanelSizes>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.PANEL_SIZES);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return DEFAULT_PANEL_SIZES;
      }
    }
    return DEFAULT_PANEL_SIZES;
  });

  /**
   * Sets the active tab and persists to localStorage
   * 
   * @param tab - Tab identifier to activate
   */
  const setActiveTab = useCallback((tab: TabId) => {
    setActiveTabState(tab);
    localStorage.setItem(STORAGE_KEYS.ACTIVE_TAB, tab);
  }, []);

  /**
   * Updates panel sizes from react-resizable-panels
   * 
   * @param sizes - Array of panel sizes [navigator, editor, properties]
   */
  const setPanelSizes = useCallback((sizes: number[]) => {
    // Convert array to object
    const newSizes: PanelSizes = {
      navigator: sizes[0] || DEFAULT_PANEL_SIZES.navigator,
      editor: sizes[1] || DEFAULT_PANEL_SIZES.editor,
      properties: sizes[2] || DEFAULT_PANEL_SIZES.properties,
    };
    
    setPanelSizesState(newSizes);
    localStorage.setItem(STORAGE_KEYS.PANEL_SIZES, JSON.stringify(newSizes));
  }, []);

  /**
   * Focuses a specific panel (for keyboard shortcuts)
   * 
   * This function uses DOM manipulation to focus the panel
   * element, enabling keyboard navigation.
   * 
   * @param panel - Panel identifier to focus
   */
  const focusPanel = useCallback((panel: PanelId) => {
    // Find the panel element by data-panel-id attribute
    const panelElement = document.querySelector(`[data-panel-id="${panel}"]`);
    if (panelElement instanceof HTMLElement) {
      panelElement.focus();
    }
  }, []);

  return {
    activeTab,
    setActiveTab,
    panelSizes,
    setPanelSizes,
    focusPanel,
  };
}
