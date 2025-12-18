/**
 * @file ComponentIcon.tsx
 * @description Icons for different component types in the component tree
 * 
 * @architecture Phase 2, Task 2.1 - Component Tree UI
 * @created 2025-11-25
 * @author AI (Cline) + Human Review
 * @confidence 9/10 - Simple icon mapping
 * 
 * PROBLEM SOLVED:
 * - Visual differentiation between component types
 * - Consistent iconography across the tree
 * - Quick recognition of component categories
 * 
 * SOLUTION:
 * - Map component types to HeroIcons
 * - Color coding by category
 * - Fallback icon for unknown types
 * 
 * @security-critical false
 * @performance-critical false
 */

import React from 'react';
import {
  CubeIcon,
  RectangleGroupIcon,
  Square2StackIcon,
  DocumentTextIcon,
  PhotoIcon,
  TableCellsIcon,
  ListBulletIcon,
  Bars3Icon,
  ChevronRightIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';
import type { Component } from '../../../core/legacy-manifest/types';

/**
 * Component icon props
 */
interface ComponentIconProps {
  component: Component;
  className?: string;
}

/**
 * Icon mapping by component type
 * 
 * Maps common HTML elements and custom component types
 * to appropriate icons from HeroIcons.
 */
const TYPE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  // Layout
  'div': Square2StackIcon,
  'section': RectangleGroupIcon,
  'article': DocumentTextIcon,
  'header': Bars3Icon,
  'footer': Bars3Icon,
  'nav': ChevronRightIcon,
  'main': RectangleGroupIcon,
  'aside': RectangleGroupIcon,
  
  // Content
  'h1': DocumentTextIcon,
  'h2': DocumentTextIcon,
  'h3': DocumentTextIcon,
  'h4': DocumentTextIcon,
  'h5': DocumentTextIcon,
  'h6': DocumentTextIcon,
  'p': DocumentTextIcon,
  'span': DocumentTextIcon,
  'a': ChevronRightIcon,
  
  // Lists
  'ul': ListBulletIcon,
  'ol': ListBulletIcon,
  'li': ListBulletIcon,
  
  // Media
  'img': PhotoIcon,
  'video': PhotoIcon,
  'audio': PhotoIcon,
  
  // Tables
  'table': TableCellsIcon,
  'thead': TableCellsIcon,
  'tbody': TableCellsIcon,
  'tr': TableCellsIcon,
  'td': TableCellsIcon,
  'th': TableCellsIcon,
  
  // Forms
  'form': DocumentTextIcon,
  'input': DocumentTextIcon,
  'textarea': DocumentTextIcon,
  'button': CubeIcon,
  'select': DocumentTextIcon,
  'label': DocumentTextIcon,
  
  // Custom (default to sparkles for AI-generated)
  'custom': SparklesIcon,
};

/**
 * Color mapping by category
 * 
 * Provides visual differentiation between component categories.
 */
const CATEGORY_COLORS: Record<string, string> = {
  'basic': 'text-blue-500',
  'layout': 'text-purple-500',
  'form': 'text-green-500',
  'custom': 'text-orange-500',
};

/**
 * ComponentIcon component
 * 
 * Displays an appropriate icon for a component based on its type and category.
 * Falls back to CubeIcon for unknown types.
 * 
 * @param component - Component to show icon for
 * @param className - Additional CSS classes
 * 
 * @returns Icon element
 * 
 * @example
 * ```tsx
 * <ComponentIcon component={component} className="w-4 h-4" />
 * ```
 */
export function ComponentIcon({ component, className = 'w-4 h-4' }: ComponentIconProps) {
  // Get icon for component type
  const IconComponent = TYPE_ICONS[component.type.toLowerCase()] || CubeIcon;
  
  // Get color for category
  const categoryColor = component.category 
    ? CATEGORY_COLORS[component.category] 
    : CATEGORY_COLORS['custom'];
  
  // Combine with AI author indicator if AI-generated
  const isAIGenerated = component.metadata.author === 'ai';
  const colorClass = isAIGenerated ? 'text-purple-400' : categoryColor;
  
  return (
    <div className="relative inline-flex">
      <IconComponent className={`${className} ${colorClass}`} />
      {isAIGenerated && (
        <SparklesIcon 
          className="w-2 h-2 text-purple-400 absolute -top-0.5 -right-0.5" 
          title="AI-generated component"
        />
      )}
    </div>
  );
}
