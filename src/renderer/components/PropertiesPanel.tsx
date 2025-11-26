/**
 * @file PropertiesPanel.tsx
 * @description Right properties panel for editing component properties and project settings
 * 
 * @architecture Phase 2, Task 2.3D - Property Panel Editor Integration
 * @created 2025-11-19
 * @updated 2025-11-26
 * @author AI (Cline) + Human Review
 * @confidence 9/10 - Integrates new editable property components
 * 
 * @see .implementation/phase-2-component-management/task-2.3-property-panel-editor.md
 * 
 * PROBLEM SOLVED:
 * - Provides visual editor for component properties
 * - Shows project settings when no component selected
 * - Professional appearance maintains user confidence
 * 
 * SOLUTION:
 * - Uses new PropertyEditor components for editable sections
 * - Shows ProjectSettings when project is open, no component selected
 * - Keeps metadata and children sections read-only
 * 
 * STATE (Task 2.3D):
 * - ✅ Shows project settings when project open, no component selected
 * - ✅ Full property editing when component selected
 * - ✅ Auto-save via manifestStore (Task 2.2)
 * 
 * @performance O(1) render - delegates to child components
 * @security-critical false
 * @performance-critical false
 */

import React from 'react';
import { 
  CubeIcon,
  CalendarIcon,
  UserIcon,
} from '@heroicons/react/24/outline';
import { useProjectStore } from '../store/projectStore';
import { useManifestStore } from '../store/manifestStore';
import { ProjectSettings } from './ProjectSettings';
import { 
  ComponentInfoEditor, 
  PropertiesEditor, 
  StylingEditor 
} from './PropertyEditor';

/**
 * Properties Panel component
 * 
 * Right sidebar that shows:
 * - Project settings when project is open and no component selected
 * - Component property editor when component selected (Task 2.3)
 * - Placeholder when no project is open
 * 
 * @returns PropertiesPanel component
 * 
 * @example
 * ```typescript
 * <Panel id="properties">
 *   <PropertiesPanel />
 * </Panel>
 * ```
 */
export function PropertiesPanel(): React.ReactElement {
  // Get current project from store
  const currentProject = useProjectStore((state) => state.currentProject);
  
  // Get selected component from manifest store
  // IMPORTANT: Subscribe directly to the component data via selector
  // This ensures React re-renders when the component changes
  const selectedComponent = useManifestStore((state) => 
    state.selectedComponentId 
      ? state.manifest?.components[state.selectedComponentId] ?? null
      : null
  );
  
  return (
    <div
      className="h-full flex flex-col bg-gray-50"
      data-panel-id="properties"
      tabIndex={-1}
    >
      {/* Panel Header */}
      <div className="px-4 py-3 border-b border-gray-200 bg-white">
        <h2 className="text-sm font-semibold text-gray-900">Properties</h2>
      </div>

      {/* Panel Content */}
      <div className="flex-1 overflow-y-auto scrollbar-thin">
        {/* Case 1: Project open, no component selected - show ProjectSettings */}
        {currentProject && !selectedComponent && (
          <ProjectSettings />
        )}

        {/* Case 2: No project open - show placeholder */}
        {!currentProject && (
          <NoProjectPlaceholder />
        )}

        {/* Case 3: Component selected - show editable property editors */}
        {selectedComponent && (
          <div className="p-4 space-y-6">
            {/* Editable Component Info */}
            <ComponentInfoEditor component={selectedComponent} />

            {/* Editable Properties */}
            <PropertiesEditor component={selectedComponent} />

            {/* Editable Styling */}
            <StylingEditor component={selectedComponent} />

            {/* Read-only Metadata */}
            <MetadataSection component={selectedComponent} />

            {/* Read-only Children count */}
            <ChildrenSection component={selectedComponent} />
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Placeholder component when no project is open
 */
function NoProjectPlaceholder(): React.ReactElement {
  return (
    <div className="p-4">
      <div className="text-center py-12">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-200 mb-4">
          <CubeIcon className="w-8 h-8 text-gray-400" />
        </div>
        <p className="text-sm text-gray-600 mb-2">
          No project open
        </p>
        <p className="text-xs text-gray-400">
          Create or open a project to get started
        </p>
      </div>
    </div>
  );
}

/**
 * Props for Metadata and Children sections
 */
interface ComponentSectionProps {
  component: {
    metadata: {
      createdAt: string;
      updatedAt: string;
      author: 'user' | 'ai';
      version: string;
    };
    children: string[];
  };
}

/**
 * Read-only metadata section
 * 
 * Displays creation/update times, author, and version.
 * Not editable - these are system-managed values.
 */
function MetadataSection({ component }: ComponentSectionProps): React.ReactElement {
  return (
    <section>
      <div className="flex items-center gap-2 mb-3">
        <CalendarIcon className="w-4 h-4 text-gray-500" />
        <h3 className="text-xs font-medium text-gray-700 uppercase tracking-wider">
          Metadata
        </h3>
      </div>
      
      <div className="space-y-2 text-xs">
        <div className="flex justify-between py-2 border-b border-gray-200">
          <span className="text-gray-600">Created</span>
          <span className="text-gray-900">
            {formatDate(component.metadata.createdAt)}
          </span>
        </div>
        <div className="flex justify-between py-2 border-b border-gray-200">
          <span className="text-gray-600">Updated</span>
          <span className="text-gray-900">
            {formatDate(component.metadata.updatedAt)}
          </span>
        </div>
        <div className="flex justify-between py-2 border-b border-gray-200">
          <span className="text-gray-600">Author</span>
          <span className="flex items-center gap-1 text-gray-900">
            <UserIcon className="w-3 h-3" />
            {component.metadata.author === 'ai' ? 'AI Generated' : 'User'}
          </span>
        </div>
        <div className="flex justify-between py-2">
          <span className="text-gray-600">Version</span>
          <span className="text-gray-900">{component.metadata.version}</span>
        </div>
      </div>
    </section>
  );
}

/**
 * Read-only children count section
 * 
 * Shows how many child components exist.
 * Managing children is done via the ComponentTree, not here.
 */
function ChildrenSection({ component }: ComponentSectionProps): React.ReactElement {
  const childCount = component.children.length;

  return (
    <section>
      <div className="flex items-center gap-2 mb-3">
        <CubeIcon className="w-4 h-4 text-gray-500" />
        <h3 className="text-xs font-medium text-gray-700 uppercase tracking-wider">
          Children
        </h3>
      </div>
      
      {childCount > 0 ? (
        <div className="text-xs text-gray-900">
          {childCount} child component{childCount !== 1 ? 's' : ''}
        </div>
      ) : (
        <p className="text-xs text-gray-500 italic">No children</p>
      )}
    </section>
  );
}

/**
 * Format ISO date string to locale format
 * 
 * @param isoDate - ISO date string
 * @returns Formatted date string
 */
function formatDate(isoDate: string): string {
  try {
    return new Date(isoDate).toLocaleString();
  } catch {
    return isoDate;
  }
}
