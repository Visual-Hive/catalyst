/**
 * @file CodePanel.tsx
 * @description Code viewer panel displaying generated React code for components
 * 
 * @architecture Phase 3, Task 3.1 + Task 3.9 - React Code Generator UI + Syntax Highlighting
 * @created 2025-11-27
 * @updated 2025-12-01
 * @author AI (Cline) + Human Review
 * @confidence 9/10 - Proper Prism.js syntax highlighting
 * 
 * @see src/core/codegen/ReactCodeGenerator.ts - Code generation logic
 * @see src/renderer/store/manifestStore.ts - Component selection state
 * @see src/renderer/utils/prismConfig.ts - Prism.js configuration
 * 
 * PROBLEM SOLVED:
 * - Displays generated React code for selected component
 * - Live updates when manifest or selection changes
 * - Copy to clipboard functionality
 * - Professional syntax highlighting with Prism.js
 * 
 * SOLUTION:
 * - Uses ReactCodeGenerator to generate code on-the-fly
 * - Subscribes to manifestStore for component selection
 * - Uses Prism.js for proper JSX tokenization (no regex hacks)
 * - Theme customizable via CSS
 * - Responsive layout with scrolling
 * 
 * PREVIOUS ISSUE (Fixed in Task 3.9):
 * - Old regex-based highlighting caused overlapping HTML spans
 * - Numbers in CSS classes (like "text-purple-600") were incorrectly highlighted
 * - Now using Prism.js for proper tokenization
 * 
 * @security-critical false
 * @performance-critical false - Code generation and highlighting are fast
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  DocumentDuplicateIcon,
  CheckIcon,
  ExclamationTriangleIcon,
  DocumentTextIcon,
} from '@heroicons/react/24/outline';
import { useManifestStore } from '../../store/manifestStore';
import { useProjectStore } from '../../store/projectStore';
import { ReactCodeGenerator } from '../../../core/codegen/ReactCodeGenerator';
import { AppGenerator } from '../../../core/filemanager/AppGenerator';
import { highlightCode } from '../../utils/prismConfig';
import '../../styles/prism-custom.css';

/**
 * Format for displaying generated code
 * Includes basic syntax highlighting tokens
 */
interface HighlightedLine {
  content: string;
  lineNumber: number;
}

/**
 * Code display modes
 */
type CodeMode = 'component' | 'app' | 'main';

/**
 * CodePanel component
 * 
 * Displays generated React code for the currently selected component.
 * When no component is selected, shows the App.jsx or main.jsx.
 * 
 * FEATURES:
 * - Real-time code generation
 * - Line numbers
 * - Copy to clipboard
 * - Tab switching (Component/App/Main)
 * 
 * @returns CodePanel component
 */
export function CodePanel() {
  // State
  const [copied, setCopied] = useState(false);
  const [codeMode, setCodeMode] = useState<CodeMode>('component');
  const [error, setError] = useState<string | null>(null);
  const [generatedCode, setGeneratedCode] = useState<string>('// Loading...');
  const [isGenerating, setIsGenerating] = useState(false);
  
  // Store subscriptions
  const { manifest, selectedComponentId, getComponent } = useManifestStore();
  const { currentProject } = useProjectStore();
  
  // Get selected component
  const selectedComponent = selectedComponentId ? getComponent(selectedComponentId) : null;
  
  // Generate code when dependencies change
  useEffect(() => {
    const generateCode = async () => {
      setError(null);
      setIsGenerating(true);
      
      if (!manifest) {
        setGeneratedCode('// No manifest loaded\n// Open a project to see generated code');
        setIsGenerating(false);
        return;
      }
      
      try {
        if (codeMode === 'component') {
          if (!selectedComponent) {
            setGeneratedCode('// No component selected\n// Select a component from the tree to see its code');
            setIsGenerating(false);
            return;
          }
          // Use ReactCodeGenerator for component code
          const generator = new ReactCodeGenerator();
          const result = await generator.generateComponent(selectedComponent, manifest);
          if (result.success) {
            setGeneratedCode(result.code);
          } else {
            setGeneratedCode(`// Error generating code\n// ${result.error || 'Unknown error'}`);
            setError(result.error || 'Generation failed');
          }
        } else if (codeMode === 'app') {
          // Use AppGenerator for App.jsx
          const appGenerator = new AppGenerator();
          // Find root components (no parent)
          const rootComponents = Object.values(manifest.components)
            .filter((comp) => {
              // Component is root if no other component has it as a child
              return !Object.values(manifest.components).some(
                (other) => other.children.includes(comp.id)
              );
            })
            .map((comp) => ({ id: comp.id, displayName: comp.displayName }));
          const appCode = await appGenerator.generateAppJsx(rootComponents);
          setGeneratedCode(appCode);
        } else {
          // Use AppGenerator for main.jsx
          const appGenerator = new AppGenerator();
          const mainCode = await appGenerator.generateMainJsx();
          setGeneratedCode(mainCode);
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        setError(message);
        setGeneratedCode(`// Error generating code\n// ${message}`);
      } finally {
        setIsGenerating(false);
      }
    };
    
    generateCode();
  }, [manifest, selectedComponent, codeMode]);
  
  // Process code into lines with numbers
  const codeLines: HighlightedLine[] = useMemo(() => {
    return generatedCode.split('\n').map((content: string, index: number) => ({
      content,
      lineNumber: index + 1,
    }));
  }, [generatedCode]);
  
  // Copy to clipboard handler
  const handleCopy = useCallback(async () => {
    try {
      await window.navigator.clipboard.writeText(generatedCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
    }
  }, [generatedCode]);
  
  // Get filename for header
  const getFilename = () => {
    if (codeMode === 'component' && selectedComponent) {
      // Convert displayName to PascalCase filename
      const filename = selectedComponent.displayName.replace(/\s+/g, '');
      return `${filename}.jsx`;
    } else if (codeMode === 'app') {
      return 'App.jsx';
    } else {
      return 'main.jsx';
    }
  };
  
  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 bg-white border-b border-gray-200">
        {/* Mode tabs */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => setCodeMode('component')}
            className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${
              codeMode === 'component'
                ? 'bg-blue-100 text-blue-700'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Component
          </button>
          <button
            onClick={() => setCodeMode('app')}
            className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${
              codeMode === 'app'
                ? 'bg-blue-100 text-blue-700'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            App.jsx
          </button>
          <button
            onClick={() => setCodeMode('main')}
            className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${
              codeMode === 'main'
                ? 'bg-blue-100 text-blue-700'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            main.jsx
          </button>
        </div>
        
        {/* Actions */}
        <div className="flex items-center gap-2">
          {/* Filename badge */}
          <div className="flex items-center gap-1.5 px-2 py-1 bg-gray-100 rounded text-xs text-gray-600">
            <DocumentTextIcon className="w-3.5 h-3.5" />
            <span>{getFilename()}</span>
          </div>
          
          {/* Copy button */}
          <button
            onClick={handleCopy}
            disabled={isGenerating}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors disabled:opacity-50"
            title="Copy to clipboard"
          >
            {copied ? (
              <>
                <CheckIcon className="w-4 h-4 text-green-600" />
                <span className="text-green-600">Copied!</span>
              </>
            ) : (
              <>
                <DocumentDuplicateIcon className="w-4 h-4" />
                <span>Copy</span>
              </>
            )}
          </button>
        </div>
      </div>
      
      {/* Error banner */}
      {error && (
        <div className="flex items-center gap-2 px-4 py-2 bg-red-50 border-b border-red-200">
          <ExclamationTriangleIcon className="w-4 h-4 text-red-500" />
          <span className="text-sm text-red-700">{error}</span>
        </div>
      )}
      
      {/* Loading indicator */}
      {isGenerating && (
        <div className="flex items-center justify-center py-4 bg-blue-50 border-b border-blue-200">
          <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mr-2" />
          <span className="text-sm text-blue-700">Generating code...</span>
        </div>
      )}
      
      {/* Code display */}
      <div className="flex-1 overflow-auto">
        <div className="min-w-max">
          <table className="w-full border-collapse">
            <tbody className="font-mono text-sm">
              {codeLines.map((line) => (
                <tr
                  key={line.lineNumber}
                  className="hover:bg-gray-100/50 transition-colors"
                >
                  {/* Line number */}
                  <td className="select-none text-right pr-4 pl-4 py-0.5 text-gray-400 text-xs bg-gray-50 border-r border-gray-200 sticky left-0">
                    {line.lineNumber}
                  </td>
                  {/* Code content */}
                  <td className="pl-4 pr-4 py-0.5 whitespace-pre">
                    <CodeLine content={line.content} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Footer info */}
      <div className="flex items-center justify-between px-4 py-2 bg-white border-t border-gray-200 text-xs text-gray-500">
        <span>
          {codeLines.length} lines
        </span>
        <span>
          {currentProject?.name || 'No project loaded'}
        </span>
      </div>
    </div>
  );
}

/**
 * CodeLine component - Professional syntax highlighting using Prism.js
 * 
 * Uses Prism.js tokenizer for proper JSX syntax highlighting.
 * Replaces the previous regex-based approach that caused overlapping
 * HTML spans (e.g., numbers in "text-purple-600" were incorrectly highlighted).
 * 
 * FEATURES:
 * - Proper JSX/React tokenization
 * - No overlapping HTML tags
 * - Correct handling of strings containing numbers
 * - Comments, keywords, functions all properly styled
 * 
 * @param content - Line content to highlight
 * 
 * @see src/renderer/utils/prismConfig.ts - Prism configuration
 * @see src/renderer/styles/prism-custom.css - Token styling
 */
function CodeLine({ content }: { content: string }) {
  // Handle empty lines - render non-breaking space to maintain line height
  if (!content.trim()) {
    return <span>&nbsp;</span>;
  }
  
  // Use Prism.js for proper syntax highlighting
  // This produces HTML with .token classes that are styled by prism-custom.css
  const highlighted = highlightCode(content, 'jsx');
  
  return (
    <span 
      className="prism-code-line"
      dangerouslySetInnerHTML={{ __html: highlighted }}
    />
  );
}

export default CodePanel;
