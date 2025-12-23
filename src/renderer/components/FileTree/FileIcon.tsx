/**
 * @file FileIcon.tsx
 * @description File and folder icons based on file type
 * 
 * @architecture Phase 1, Task 1.3A - Core Project Creation
 * @created 2025-11-19
 * @author AI (Cline) + Human Review
 * @confidence 10/10 - Simple icon mapping
 * 
 * PROBLEM SOLVED:
 * - Need visual distinction between file types in file tree
 * - Users should quickly identify files by extension
 * - Folders need distinct appearance from files
 * 
 * SOLUTION:
 * - Map file extensions to appropriate Heroicons
 * - Color-code by file type (JS/TS blue, JSON green, CSS purple, etc.)
 * - Folder icons with expand/collapse indication
 * 
 * USAGE EXAMPLE:
 * ```typescript
 * <FileIcon name="App.tsx" isDirectory={false} />
 * <FileIcon name="components" isDirectory={true} isExpanded={true} />
 * ```
 * 
 * @performance O(1) - Simple if/else checks
 * @security-critical false
 * @performance-critical false
 */

import React from 'react';
import {
  FolderIcon,
  FolderOpenIcon,
  DocumentIcon,
  DocumentTextIcon,
  CogIcon,
  PhotoIcon,
} from '@heroicons/react/24/outline';

/**
 * Props for FileIcon component
 */
interface FileIconProps {
  /** File or folder name (including extension) */
  name: string;
  /** Whether this is a directory */
  isDirectory: boolean;
  /** Whether directory is expanded (only for directories) */
  isExpanded?: boolean;
  /** Optional size class (default: w-4 h-4) */
  size?: string;
}

/**
 * Get appropriate icon and color for a file based on extension
 * 
 * @param name - File name with extension
 * @returns Object with icon component and color class
 */
function getFileIcon(name: string) {
  // Extract extension
  const ext = name.split('.').pop()?.toLowerCase() || '';
  
  // Python files (Catalyst generated code)
  if (ext === 'py') {
    return {
      icon: DocumentTextIcon,
      color: 'text-yellow-600',
    };
  }
  
  // TypeScript/JavaScript files
  if (ext === 'ts' || ext === 'tsx' || ext === 'js' || ext === 'jsx') {
    return {
      icon: DocumentTextIcon,
      color: 'text-blue-500',
    };
  }
  
  // JSON files
  if (ext === 'json') {
    return {
      icon: DocumentTextIcon,
      color: 'text-green-500',
    };
  }
  
  // CSS/Style files
  if (ext === 'css' || ext === 'scss' || ext === 'sass' || ext === 'less') {
    return {
      icon: DocumentTextIcon,
      color: 'text-purple-500',
    };
  }
  
  // HTML files
  if (ext === 'html') {
    return {
      icon: DocumentTextIcon,
      color: 'text-orange-500',
    };
  }
  
  // Config files
  if (
    name === 'package.json' ||
    name === 'tsconfig.json' ||
    name === 'vite.config.ts' ||
    name === 'tailwind.config.js' ||
    name.endsWith('.config.js') ||
    name.endsWith('.config.ts')
  ) {
    return {
      icon: CogIcon,
      color: 'text-gray-500',
    };
  }
  
  // Image files
  if (
    ext === 'png' ||
    ext === 'jpg' ||
    ext === 'jpeg' ||
    ext === 'gif' ||
    ext === 'svg' ||
    ext === 'ico'
  ) {
    return {
      icon: PhotoIcon,
      color: 'text-pink-500',
    };
  }
  
  // Markdown files
  if (ext === 'md') {
    return {
      icon: DocumentTextIcon,
      color: 'text-gray-600',
    };
  }
  
  // Default for other files
  return {
    icon: DocumentIcon,
    color: 'text-gray-400',
  };
}

/**
 * FileIcon Component
 * 
 * Renders appropriate icon for files and folders with color coding.
 * Folders show different icons based on expanded state.
 * 
 * FILE TYPE COLORS:
 * - Python: Yellow (Catalyst generated code)
 * - TypeScript/JavaScript: Blue
 * - JSON: Green
 * - CSS: Purple
 * - HTML: Orange
 * - Config: Gray
 * - Images: Pink
 * - Markdown: Gray
 * - Default: Light gray
 * 
 * @param props - Icon configuration
 * @returns Icon component
 * 
 * @example
 * ```typescript
 * // File icon
 * <FileIcon name="Button.tsx" isDirectory={false} />
 * 
 * // Folder icon (collapsed)
 * <FileIcon name="components" isDirectory={true} isExpanded={false} />
 * 
 * // Folder icon (expanded)
 * <FileIcon name="components" isDirectory={true} isExpanded={true} />
 * ```
 */
export function FileIcon({
  name,
  isDirectory,
  isExpanded = false,
  size = 'w-4 h-4',
}: FileIconProps) {
  // Handle directories
  if (isDirectory) {
    // Special color for .catalyst directory (Catalyst project folder)
    const isCatalystDir = name === '.catalyst';
    const folderColor = isCatalystDir ? 'text-blue-600' : 'text-yellow-500';
    
    // Use different icon for expanded vs collapsed
    const FolderIconComponent = isExpanded ? FolderOpenIcon : FolderIcon;
    
    return <FolderIconComponent className={`${size} ${folderColor}`} />;
  }
  
  // Handle files
  const { icon: IconComponent, color } = getFileIcon(name);
  
  return <IconComponent className={`${size} ${color}`} />;
}
