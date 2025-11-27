/**
 * @file AISettingsPanel.tsx
 * @description Settings panel for AI API key management and usage tracking
 * 
 * @architecture Phase 2, Task 2.4D - AI Settings UI
 * @created 2025-11-27
 * @author AI (Cline) + Human Review
 * @confidence 9/10 - Standard form patterns with IPC integration
 * 
 * @see src/renderer/store/aiStore.ts - AI state management
 * @see electron/ai-handlers.ts - IPC handlers
 * 
 * @security-critical true - Handles API key input (but keys stay in main process)
 * @performance-critical false
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useAIStore } from '../../store/aiStore';

/**
 * AI Settings Panel Component
 */
export function AISettingsPanel() {
  // Store state
  const { 
    hasApiKey, 
    isInitialized,
    usageStats,
    budgetConfig,
    checkApiKey,
    storeKey,
    deleteKey,
    refreshUsageStats,
    updateBudgetConfig: storeupdateBudget,
  } = useAIStore();
  
  // Local state
  const [keyInput, setKeyInput] = useState('');
  const [budgetInput, setBudgetInput] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Load initial state
  useEffect(() => {
    if (isInitialized) {
      checkApiKey();
      refreshUsageStats();
    }
  }, [isInitialized, checkApiKey, refreshUsageStats]);
  
  // Set budget input from config
  useEffect(() => {
    if (budgetConfig) {
      setBudgetInput(budgetConfig.dailyBudgetUSD.toFixed(2));
    }
  }, [budgetConfig]);
  
  /**
   * Validate API key format
   */
  const isValidKeyFormat = (key: string): boolean => {
    return key.startsWith('sk-ant-') && key.length > 20;
  };
  
  /**
   * Handle save key
   */
  const handleSaveKey = useCallback(async () => {
    if (!keyInput.trim()) return;
    
    if (!isValidKeyFormat(keyInput)) {
      setError('Invalid API key format. Claude API keys start with "sk-ant-"');
      return;
    }
    
    setIsValidating(true);
    setError(null);
    setSuccess(null);
    
    try {
      const result = await storeKey(keyInput);
      
      if (result.success) {
        setSuccess('API key saved and validated successfully!');
        setKeyInput('');
        await checkApiKey();
        await refreshUsageStats();
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(result.error || 'Failed to validate API key');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsValidating(false);
    }
  }, [keyInput, storeKey, checkApiKey, refreshUsageStats]);
  
  /**
   * Handle delete key
   */
  const handleDeleteKey = useCallback(async () => {
    setIsDeleting(true);
    setError(null);
    
    try {
      const deleted = await deleteKey();
      
      if (deleted) {
        setShowDeleteConfirm(false);
        setSuccess('API key deleted successfully');
        await checkApiKey();
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError('Failed to delete API key');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsDeleting(false);
    }
  }, [deleteKey, checkApiKey]);
  
  /**
   * Handle budget update
   */
  const handleUpdateBudget = useCallback(async () => {
    const budget = parseFloat(budgetInput);
    
    if (isNaN(budget) || budget < 0) {
      setError('Please enter a valid budget amount');
      return;
    }
    
    setIsSaving(true);
    setError(null);
    
    try {
      await storeupdateBudget({ dailyBudgetUSD: budget });
      setSuccess('Budget updated successfully');
      await refreshUsageStats();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsSaving(false);
    }
  }, [budgetInput, storeupdateBudget, refreshUsageStats]);
  
  // Calculate usage percentage
  const usagePercentage = usageStats && budgetConfig
    ? (usageStats.todaySpent / budgetConfig.dailyBudgetUSD) * 100
    : 0;
  
  const isOverBudget = usagePercentage >= 100;
  const isNearBudget = usagePercentage >= 80 && usagePercentage < 100;
  
  // Show message if not initialized
  if (!isInitialized) {
    return (
      <div className="p-4 text-center">
        <p className="text-sm text-gray-500">
          Open a project to configure AI settings
        </p>
      </div>
    );
  }
  
  return (
    <div className="p-4 space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <SparklesIcon className="w-5 h-5 text-purple-600" />
          <h3 className="text-sm font-semibold text-gray-900">AI Settings</h3>
        </div>
        <p className="text-xs text-gray-500">Configure Claude API key and usage limits</p>
      </div>
      
      {/* API Key Status */}
      <div className={`p-3 rounded-lg ${
        hasApiKey ? 'bg-green-50 border border-green-200' : 'bg-gray-50 border border-gray-200'
      }`}>
        <div className="flex items-center gap-2">
          {hasApiKey ? (
            <>
              <CheckIcon className="w-5 h-5 text-green-600" />
              <span className="text-sm text-green-700 font-medium">API key configured</span>
            </>
          ) : (
            <>
              <KeyIcon className="w-5 h-5 text-gray-400" />
              <span className="text-sm text-gray-600">No API key configured</span>
            </>
          )}
        </div>
      </div>
      
      {/* API Key Input */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {hasApiKey ? 'Update API Key' : 'Add API Key'}
        </label>
        <input
          type="password"
          value={keyInput}
          onChange={(e) => setKeyInput(e.target.value)}
          placeholder="sk-ant-api03-..."
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
        />
        <p className="mt-1 text-xs text-gray-500">
          Get your API key from{' '}
          <a 
            href="https://console.anthropic.com/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-purple-600 hover:underline"
          >console.anthropic.com</a>
        </p>
      </div>
      
      {/* Key Actions */}
      <div className="flex items-center gap-2">
        <button
          onClick={handleSaveKey}
          disabled={!keyInput.trim() || isValidating}
          className={`px-4 py-2 text-sm font-medium rounded ${
            !keyInput.trim() || isValidating
              ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
              : 'bg-purple-500 text-white hover:bg-purple-600'
          }`}
        >
          {isValidating ? (
            <span className="flex items-center gap-2">
              <LoadingSpinner className="w-4 h-4" />
              Validating...
            </span>
          ) : 'Save Key'}
        </button>
        
        {hasApiKey && !showDeleteConfirm && (
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded"
          >
            Delete Key
          </button>
        )}
        
        {showDeleteConfirm && (
          <>
            <button
              onClick={handleDeleteKey}
              disabled={isDeleting}
              className="px-4 py-2 text-sm font-medium bg-red-500 text-white rounded hover:bg-red-600"
            >
              {isDeleting ? 'Deleting...' : 'Confirm Delete'}
            </button>
            <button
              onClick={() => setShowDeleteConfirm(false)}
              className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded"
            >
              Cancel
            </button>
          </>
        )}
      </div>
      
      {/* Budget Configuration - only show if API key exists */}
      {hasApiKey && (
        <>
          <div className="border-t border-gray-200 pt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Daily Budget ($USD)
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                step="0.01"
                min="0"
                value={budgetInput}
                onChange={(e) => setBudgetInput(e.target.value)}
                className="w-32 px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              <button
                onClick={handleUpdateBudget}
                disabled={isSaving || budgetInput === budgetConfig?.dailyBudgetUSD.toFixed(2)}
                className={`px-4 py-2 text-sm font-medium rounded ${
                  isSaving || budgetInput === budgetConfig?.dailyBudgetUSD.toFixed(2)
                    ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                    : 'bg-gray-600 text-white hover:bg-gray-700'
                }`}
              >
                {isSaving ? 'Saving...' : 'Update'}
              </button>
            </div>
            <p className="mt-1 text-xs text-gray-500">AI generation blocked when exceeded</p>
          </div>
          
          {/* Usage Stats */}
          <div className="border-t border-gray-200 pt-4">
            <h4 className="text-sm font-medium text-gray-700 mb-3">Usage Today</h4>
            
            {usageStats && budgetConfig ? (
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Spent:</span>
                  <span className={`font-mono ${isOverBudget ? 'text-red-600' : 'text-gray-900'}`}>
                    ${usageStats.todaySpent.toFixed(4)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Budget:</span>
                  <span className="font-mono text-gray-900">
                    ${budgetConfig.dailyBudgetUSD.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-sm font-medium">
                  <span className="text-gray-700">Remaining:</span>
                  <span className={`font-mono ${isOverBudget ? 'text-red-600' : isNearBudget ? 'text-orange-500' : 'text-green-600'}`}>
                    ${Math.max(0, budgetConfig.dailyBudgetUSD - usageStats.todaySpent).toFixed(2)}
                  </span>
                </div>
                
                {/* Progress Bar */}
                <div className="mt-2">
                  <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all ${
                        isOverBudget ? 'bg-red-500' : isNearBudget ? 'bg-orange-400' : 'bg-green-500'
                      }`}
                      style={{ width: `${Math.min(100, usagePercentage)}%` }}
                    />
                  </div>
                  <p className="mt-1 text-xs text-gray-500 text-right">{usagePercentage.toFixed(1)}% used</p>
                </div>
                
                {/* Warnings */}
                {isOverBudget && (
                  <div className="p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">
                    <strong>Budget exceeded.</strong> AI blocked until tomorrow.
                  </div>
                )}
                {isNearBudget && !isOverBudget && (
                  <div className="p-2 bg-orange-50 border border-orange-200 rounded text-xs text-orange-700">
                    <strong>Approaching limit.</strong> {(100 - usagePercentage).toFixed(1)}% remaining.
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-gray-500">Loading usage data...</p>
            )}
          </div>
        </>
      )}
      
      {/* Messages */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}
      {success && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-sm text-green-700">{success}</p>
        </div>
      )}
      
      {/* Security Info */}
      <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
        <div className="flex items-start gap-2">
          <InfoIcon className="w-4 h-4 text-gray-500 flex-shrink-0 mt-0.5" />
          <div className="text-xs text-gray-600">
            <p className="font-medium mb-1">API Key Security:</p>
            <ul className="list-disc list-inside space-y-0.5 text-gray-500">
              <li>Stored in system keychain</li>
              <li>Never logged or sent except to Anthropic</li>
              <li>Validated before storage</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

// ===== Icons =====

function SparklesIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
    </svg>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  );
}

function KeyIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" />
    </svg>
  );
}

function InfoIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
    </svg>
  );
}

function LoadingSpinner({ className }: { className?: string }) {
  return (
    <svg className={`animate-spin ${className}`} fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
    </svg>
  );
}
