/**
 * @file SettingsDialog.tsx
 * @description Tabbed settings dialog with Project and AI tabs
 * 
 * @architecture Phase 2, Task 2.4D - Settings UI
 * @created 2025-11-27
 * @author AI (Cline) + Human Review
 * @confidence 9/10 - Standard modal dialog pattern
 */

import React, { useState } from 'react';
import { Modal } from '../Modal';
import { ProjectSettings } from '../ProjectSettings';
import { AISettingsPanel } from './AISettingsPanel';

interface SettingsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'project' | 'ai';
}

/**
 * Tabbed Settings Dialog
 */
export function SettingsDialog({ isOpen, onClose, initialTab = 'project' }: SettingsDialogProps) {
  const [activeTab, setActiveTab] = useState<'project' | 'ai'>(initialTab);
  
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Settings" size="lg">
      {/* Tabs */}
      <div className="flex border-b border-gray-200 mb-4">
        <button
          onClick={() => setActiveTab('project')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'project'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          Project
        </button>
        <button
          onClick={() => setActiveTab('ai')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'ai'
              ? 'border-purple-500 text-purple-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          AI
        </button>
      </div>
      
      {/* Tab Content */}
      <div className="min-h-[400px] max-h-[60vh] overflow-y-auto">
        {activeTab === 'project' && <ProjectSettings />}
        {activeTab === 'ai' && <AISettingsPanel />}
      </div>
    </Modal>
  );
}
