/**
 * @file PreviewToolbar.tsx
 * @description Toolbar component with viewport, zoom, and refresh controls
 * 
 * Provides controls for:
 * - Viewport presets (mobile, tablet, desktop, responsive)
 * - Custom viewport dimensions
 * - Zoom level adjustment
 * - Preview refresh
 * - Open in external browser
 * 
 * @architecture Phase 1, Task 1.4B - Preview Panel UI
 * @created 2025-11-25
 * @author AI (Cline) + Human Review
 * @confidence 9/10 - Standard toolbar implementation
 * 
 * @see .implementation/phase-1-application-shell/task-1.4-preview-renderer.md
 * 
 * @security-critical false
 * @performance-critical false
 */

import React, { useState, useCallback } from 'react';
import {
  DevicePhoneMobileIcon,
  DeviceTabletIcon,
  ComputerDesktopIcon,
  ArrowsPointingOutIcon,
  ArrowPathIcon,
  ArrowTopRightOnSquareIcon,
  MagnifyingGlassMinusIcon,
  MagnifyingGlassPlusIcon,
  ClipboardDocumentIcon,
  CheckIcon,
} from '@heroicons/react/24/outline';
import { usePreviewStore, VIEWPORT_PRESETS, ZOOM_LEVELS } from '../../store/previewStore';

/**
 * Get icon component for a viewport preset
 * 
 * @param icon - Icon type identifier
 * @returns React icon component
 */
function getPresetIcon(icon: string): React.ReactElement {
  switch (icon) {
    case 'phone':
      return <DevicePhoneMobileIcon className="w-4 h-4" />;
    case 'tablet':
      return <DeviceTabletIcon className="w-4 h-4" />;
    case 'laptop':
    case 'desktop':
      return <ComputerDesktopIcon className="w-4 h-4" />;
    case 'arrows':
    default:
      return <ArrowsPointingOutIcon className="w-4 h-4" />;
  }
}

/**
 * Format zoom level as percentage string
 * 
 * @param zoom - Zoom level (0.25 - 2)
 * @returns Formatted percentage string (e.g., "100%")
 */
function formatZoom(zoom: number): string {
  return `${Math.round(zoom * 100)}%`;
}

/**
 * PreviewToolbar Component
 * 
 * Provides controls for adjusting the preview viewport and zoom.
 * Displays current preview URL and provides quick actions.
 * 
 * CONTROLS:
 * - Viewport dropdown with device presets
 * - Custom width/height inputs
 * - Zoom dropdown (25% - 200%)
 * - URL display with copy button
 * - Refresh button
 * - Open in browser button
 * 
 * USAGE:
 * ```tsx
 * <PreviewToolbar />
 * ```
 * 
 * @returns Toolbar component
 */
export function PreviewToolbar() {
  // Get store state and actions
  const {
    previewUrl,
    viewportWidth,
    viewportHeight,
    activePresetId,
    zoom,
    setViewportPreset,
    setCustomViewport,
    setZoom,
    refreshPreview,
  } = usePreviewStore();
  
  // Track if URL was copied
  const [copied, setCopied] = useState(false);
  
  // Track if viewport dropdown is open
  const [isViewportOpen, setIsViewportOpen] = useState(false);
  
  // Track if zoom dropdown is open
  const [isZoomOpen, setIsZoomOpen] = useState(false);
  
  // Refs and state for dropdown positioning (to avoid clipping by overflow:hidden parents)
  const viewportButtonRef = React.useRef<HTMLButtonElement>(null);
  const zoomButtonRef = React.useRef<HTMLButtonElement>(null);
  const [viewportDropdownPos, setViewportDropdownPos] = useState({ top: 0, left: 0 });
  const [zoomDropdownPos, setZoomDropdownPos] = useState({ top: 0, left: 0 });
  
  // Update dropdown position when opening
  React.useEffect(() => {
    if (isViewportOpen && viewportButtonRef.current) {
      const rect = viewportButtonRef.current.getBoundingClientRect();
      setViewportDropdownPos({ top: rect.bottom + 4, left: rect.left });
    }
  }, [isViewportOpen]);
  
  React.useEffect(() => {
    if (isZoomOpen && zoomButtonRef.current) {
      const rect = zoomButtonRef.current.getBoundingClientRect();
      setZoomDropdownPos({ top: rect.bottom + 4, left: rect.left });
    }
  }, [isZoomOpen]);
  
  // Get current preset name for display
  const currentPreset = VIEWPORT_PRESETS.find(p => p.id === activePresetId);
  const presetLabel = currentPreset
    ? currentPreset.name
    : viewportWidth > 0
    ? `${viewportWidth}×${viewportHeight}`
    : 'Responsive';
  
  // Handle viewport preset selection
  const handlePresetSelect = useCallback((presetId: string) => {
    setViewportPreset(presetId);
    setIsViewportOpen(false);
  }, [setViewportPreset]);
  
  // Handle custom dimension change
  const handleDimensionChange = useCallback((dimension: 'width' | 'height', value: string) => {
    const numValue = parseInt(value, 10);
    if (isNaN(numValue) || numValue < 100) return;
    
    const newWidth = dimension === 'width' ? numValue : viewportWidth;
    const newHeight = dimension === 'height' ? numValue : viewportHeight;
    
    setCustomViewport(Math.max(100, newWidth), Math.max(100, newHeight));
  }, [viewportWidth, viewportHeight, setCustomViewport]);
  
  // Handle zoom selection
  const handleZoomSelect = useCallback((level: number) => {
    setZoom(level);
    setIsZoomOpen(false);
  }, [setZoom]);
  
  // Handle copy URL to clipboard
  const handleCopyUrl = useCallback(async () => {
    if (!previewUrl) return;
    
    try {
      await navigator.clipboard.writeText(previewUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy URL:', error);
    }
  }, [previewUrl]);
  
  // Handle open in browser
  const handleOpenInBrowser = useCallback(() => {
    if (!previewUrl) return;
    // Use window.open for now; could use electron shell.openExternal
    window.open(previewUrl, '_blank');
  }, [previewUrl]);
  
  // Handle refresh
  const handleRefresh = useCallback(() => {
    refreshPreview();
  }, [refreshPreview]);
  
  return (
    <div className="relative flex items-center gap-2 px-3 py-2 bg-gray-50 border-b border-gray-200" style={{ zIndex: 10 }}>
      {/* Viewport selector */}
      <div className="relative">
        <button
          ref={viewportButtonRef}
          onClick={() => setIsViewportOpen(!isViewportOpen)}
          className="inline-flex items-center gap-2 px-3 py-1.5 text-sm bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          {currentPreset && getPresetIcon(currentPreset.icon)}
          <span className="text-gray-700">{presetLabel}</span>
          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        
        {/* Viewport dropdown - using fixed position to avoid parent overflow clipping */}
        {isViewportOpen && (
          <>
            {/* Backdrop to close dropdown */}
            <div 
              className="fixed inset-0 z-40" 
              onClick={() => setIsViewportOpen(false)}
            />
            
            <div 
              className="fixed w-56 bg-white border border-gray-200 rounded-lg shadow-lg z-50 py-1 max-h-80 overflow-y-auto"
              style={{ top: viewportDropdownPos.top, left: viewportDropdownPos.left }}
            >
              {VIEWPORT_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  onClick={() => handlePresetSelect(preset.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2 text-sm hover:bg-gray-50 transition-colors
                    ${activePresetId === preset.id ? 'bg-blue-50 text-blue-700' : 'text-gray-700'}`}
                >
                  {getPresetIcon(preset.icon)}
                  <span className="flex-1 text-left">{preset.name}</span>
                  {preset.width > 0 && (
                    <span className="text-xs text-gray-400">
                      {preset.width}×{preset.height}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
      
      {/* Custom dimensions (only show when not responsive) */}
      {viewportWidth > 0 && (
        <div className="flex items-center gap-1">
          <input
            type="number"
            value={viewportWidth}
            onChange={(e) => handleDimensionChange('width', e.target.value)}
            className="w-16 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
            min={100}
            max={3840}
          />
          <span className="text-gray-400">×</span>
          <input
            type="number"
            value={viewportHeight}
            onChange={(e) => handleDimensionChange('height', e.target.value)}
            className="w-16 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
            min={100}
            max={2160}
          />
        </div>
      )}
      
      {/* Separator */}
      <div className="w-px h-6 bg-gray-300" />
      
      {/* Zoom selector */}
      <div className="relative">
        <button
          onClick={() => setIsZoomOpen(!isZoomOpen)}
          className="inline-flex items-center gap-2 px-3 py-1.5 text-sm bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <MagnifyingGlassPlusIcon className="w-4 h-4 text-gray-500" />
          <span className="text-gray-700 w-10 text-center">{formatZoom(zoom)}</span>
          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        
        {/* Zoom dropdown */}
        {isZoomOpen && (
          <>
            <div 
              className="fixed inset-0 z-10" 
              onClick={() => setIsZoomOpen(false)}
            />
            
            <div className="absolute top-full left-0 mt-1 w-24 bg-white border border-gray-200 rounded-lg shadow-lg z-20 py-1">
              {ZOOM_LEVELS.map((level) => (
                <button
                  key={level}
                  onClick={() => handleZoomSelect(level)}
                  className={`w-full px-3 py-2 text-sm text-center hover:bg-gray-50 transition-colors
                    ${zoom === level ? 'bg-blue-50 text-blue-700' : 'text-gray-700'}`}
                >
                  {formatZoom(level)}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
      
      {/* Separator */}
      <div className="w-px h-6 bg-gray-300" />
      
      {/* URL display */}
      {previewUrl && (
        <div className="flex items-center gap-1 min-w-0">
          <span className="text-xs text-gray-500 truncate px-2 py-1 bg-gray-100 rounded max-w-[300px]" title={previewUrl}>
            {previewUrl}
          </span>
          <button
            onClick={handleCopyUrl}
            className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
            title="Copy URL"
          >
            {copied ? (
              <CheckIcon className="w-4 h-4 text-green-500" />
            ) : (
              <ClipboardDocumentIcon className="w-4 h-4" />
            )}
          </button>
        </div>
      )}
      
      {/* Spacer */}
      <div className="flex-1" />
      
      {/* Refresh button */}
      <button
        onClick={handleRefresh}
        className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
        title="Refresh preview"
      >
        <ArrowPathIcon className="w-5 h-5" />
      </button>
      
      {/* Open in browser button */}
      {previewUrl && (
        <button
          onClick={handleOpenInBrowser}
          className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          title="Open in browser"
        >
          <ArrowTopRightOnSquareIcon className="w-5 h-5" />
        </button>
      )}
    </div>
  );
}
