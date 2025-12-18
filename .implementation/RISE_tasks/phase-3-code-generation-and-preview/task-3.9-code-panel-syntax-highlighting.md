# Task: Implement Proper Syntax Highlighting in Code Panel

**Status:** ✅ COMPLETED  
**Priority:** HIGH (Bug Fix + Enhancement)  
**Estimated Time:** 2-3 hours  
**Actual Time:** ~1 hour  
**Complexity:** Medium  
**Phase:** 3 (Code Generation & Preview)  
**Completed:** 2025-12-01

---

## 🎯 Objective

Replace the fragile regex-based syntax highlighting in `CodePanel.tsx` with a proper syntax highlighting library (Prism.js) to fix the "600 span everywhere" bug and provide professional-grade code display.

### Current Problem

The `CodeLine` component uses sequential regex replacements that cause overlapping HTML spans:
- Numbers regex matches "600" in CSS class names like `text-purple-600`
- Results in broken HTML: `<span class="text-purple-<span class="text-amber-600">600</span>">`
- Code becomes unreadable with hundreds of malformed span tags

### Solution

Implement Prism.js for proper tokenization and syntax highlighting with:
- Correct JSX/React syntax support
- No overlapping HTML tags
- Better performance
- More accurate highlighting
- Theme customization support

---

## 📋 Implementation Roadmap

### Step 1: Install Prism.js Dependencies
**Confidence:** 10/10 ✅

```bash
npm install prismjs
npm install --save-dev @types/prismjs
```

**Required Prism Components:**
- `prism-core` - Base tokenizer
- `prism-jsx` - JSX syntax support
- `prism-typescript` - TypeScript support (if needed)
- `prism-css` - For inline styles
- `prism-tomorrow` - Theme (or choose another)

---

### Step 2: Create Prism Configuration
**Confidence:** 9/10 ✅

**File:** `src/renderer/utils/prismConfig.ts` (NEW)  
**Lines:** ~30

```typescript
/**
 * @file prismConfig.ts
 * @description Prism.js configuration for syntax highlighting
 * 
 * Imports required Prism languages and themes for code display.
 * Configured for JSX/React syntax highlighting.
 */

import Prism from 'prismjs';

// Import languages
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-jsx';
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-tsx';
import 'prismjs/components/prism-css';
import 'prismjs/components/prism-markup'; // HTML

// Import theme CSS
import 'prismjs/themes/prism-tomorrow.css';

/**
 * Highlight code using Prism
 * 
 * @param code - Code string to highlight
 * @param language - Prism language identifier (default: 'jsx')
 * @returns HTML string with syntax highlighting
 */
export function highlightCode(code: string, language: 'jsx' | 'tsx' | 'javascript' | 'typescript' = 'jsx'): string {
  try {
    const grammar = Prism.languages[language];
    if (!grammar) {
      console.warn(`Prism language '${language}' not found, falling back to plain text`);
      return Prism.util.encode(code) as string;
    }
    return Prism.highlight(code, grammar, language);
  } catch (error) {
    console.error('Prism highlighting error:', error);
    return Prism.util.encode(code) as string; // Fallback to escaped plain text
  }
}

export default Prism;
```

**Why this approach:**
- Centralized configuration
- Lazy loading of languages
- Error handling with fallback
- Type-safe API

---

### Step 3: Refactor CodeLine Component
**Confidence:** 9/10 ✅

**File:** `src/renderer/components/CodeViewer/CodePanel.tsx` (MODIFY)

**Changes Required:**

1. **Remove old CodeLine function** (lines ~280-350)
2. **Add Prism import** at top:
   ```typescript
   import { highlightCode } from '../../utils/prismConfig';
   ```

3. **Replace CodeLine component:**

```typescript
/**
 * CodeLine component - Syntax highlighting using Prism.js
 * 
 * @param content - Line content to highlight
 */
function CodeLine({ content }: { content: string }) {
  // Handle empty lines
  if (!content.trim()) {
    return <span>&nbsp;</span>;
  }
  
  // Highlight with Prism
  const highlighted = highlightCode(content, 'jsx');
  
  return (
    <span 
      className="prism-code-line"
      dangerouslySetInnerHTML={{ __html: highlighted }}
    />
  );
}
```

**Key Changes:**
- Removed ~70 lines of fragile regex code
- Single call to `highlightCode()` utility
- Proper JSX tokenization
- No overlapping HTML tags
- Better performance (Prism is optimized)

---

### Step 4: Add Custom Prism Styles (Optional)
**Confidence:** 8/10 ✅

**File:** `src/renderer/styles/prism-custom.css` (NEW)  
**Lines:** ~50

Create custom theme overrides to match Rise's design system:

```css
/**
 * Custom Prism.js theme for Rise Code Panel
 * Based on Prism Tomorrow theme with Rise color adjustments
 */

/* Base code styling */
.prism-code-line {
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 13px;
  line-height: 1.5;
  white-space: pre;
}

/* Token colors matching Rise design */
.token.comment,
.token.prolog,
.token.doctype,
.token.cdata {
  color: #6b7280; /* gray-500 */
  font-style: italic;
}

.token.punctuation {
  color: #4b5563; /* gray-600 */
}

.token.property,
.token.tag,
.token.boolean,
.token.number,
.token.constant,
.token.symbol,
.token.deleted {
  color: #f59e0b; /* amber-500 */
}

.token.selector,
.token.attr-name,
.token.string,
.token.char,
.token.builtin,
.token.inserted {
  color: #10b981; /* green-500 */
}

.token.operator,
.token.entity,
.token.url,
.language-css .token.string,
.style .token.string {
  color: #3b82f6; /* blue-500 */
}

.token.atrule,
.token.attr-value,
.token.keyword {
  color: #8b5cf6; /* purple-500 */
  font-weight: 500;
}

.token.function,
.token.class-name {
  color: #2563eb; /* blue-600 */
  font-weight: 500;
}

.token.regex,
.token.important,
.token.variable {
  color: #ef4444; /* red-500 */
}

.token.important,
.token.bold {
  font-weight: bold;
}

.token.italic {
  font-style: italic;
}
```

**Import in CodePanel.tsx:**
```typescript
import '../../styles/prism-custom.css';
```

---

### Step 5: Test Edge Cases
**Confidence:** 9/10 ✅

**Test Cases:**

1. **Basic JSX Component:**
   ```jsx
   export function Component() {
     return <div className="text-blue-600">Hello</div>;
   }
   ```
   - ✅ No "600" wrapped in extra spans
   - ✅ className highlighted correctly
   - ✅ String content highlighted

2. **Complex Numbers:**
   ```jsx
   const values = [100, 200, 300];
   const className = "mt-600 px-4";
   ```
   - ✅ Array numbers highlighted
   - ✅ className numbers NOT highlighted separately

3. **Comments:**
   ```jsx
   // This is a comment with numbers 123
   /* Multi-line comment
      with more numbers 456 */
   ```
   - ✅ Entire comment styled correctly
   - ✅ Numbers inside comments not separately highlighted

4. **Template Literals:**
   ```jsx
   const msg = `Value is ${value}`;
   ```
   - ✅ Proper highlighting with interpolation

5. **Multi-line JSX:**
   ```jsx
   return (
     <div className="container">
       <h1>Title</h1>
     </div>
   );
   ```
   - ✅ Proper nesting visualization
   - ✅ Consistent indentation

---

## 📁 Files to Create/Modify

### New Files (2):
1. `src/renderer/utils/prismConfig.ts` (~30 lines)
2. `src/renderer/styles/prism-custom.css` (~50 lines, optional)

### Modified Files (1):
1. `src/renderer/components/CodeViewer/CodePanel.tsx`
   - Add import: `import { highlightCode } from '../../utils/prismConfig';`
   - Remove: Old `CodeLine` function (~70 lines of regex)
   - Replace: With new Prism-based `CodeLine` (~15 lines)
   - Optional: Import custom CSS

**Net Change:** 
- Remove: ~70 lines of buggy code
- Add: ~45 lines of clean code
- Dependencies: +2 npm packages

---

## ✅ Success Criteria

### Functional Requirements:
- [ ] Code displays with proper syntax highlighting
- [ ] No overlapping or malformed HTML spans
- [ ] Numbers in CSS classes NOT separately highlighted
- [ ] JSX tags and attributes correctly colored
- [ ] Comments fully styled (not partially)
- [ ] Strings, keywords, functions all distinct
- [ ] Performance acceptable (<50ms per render)

### Code Quality:
- [ ] No regex-based string manipulation
- [ ] Proper error handling with fallbacks
- [ ] Type-safe Prism usage
- [ ] Documentation comments present
- [ ] Import statements organized

### Testing:
- [ ] All 5 edge cases pass
- [ ] No console errors or warnings
- [ ] Browser DevTools shows clean HTML
- [ ] Copy-paste from code panel works correctly

---

## 🧪 Testing Procedure

### Manual Testing:

1. **Start Rise application**
2. **Open a project with React components**
3. **Select NavigationBar component** (from your example)
4. **Inspect Code Panel:**
   - View source in browser DevTools
   - Verify: No `<span class="text-purple-<span>` patterns
   - Verify: Clean nested structure
5. **Test different code patterns:**
   - Components with className attributes
   - Code with numbers (arrays, calculations)
   - Code with comments
   - Multi-line JSX
6. **Performance check:**
   - Switch between components rapidly
   - Monitor: No lag or stuttering
   - Console: No errors

### Automated Testing (Future):

```typescript
// Example test for prismConfig.ts
describe('highlightCode', () => {
  it('should not wrap numbers in CSS class names', () => {
    const code = 'className="text-blue-600"';
    const result = highlightCode(code, 'jsx');
    
    // Should NOT contain nested spans around "600"
    expect(result).not.toMatch(/<span[^>]*>600<\/span>/);
    
    // Should contain single span for string
    expect(result).toMatch(/text-blue-600/);
  });
  
  it('should highlight JSX components', () => {
    const code = '<NavigationBar />';
    const result = highlightCode(code, 'jsx');
    
    expect(result).toContain('token');
    expect(result).toContain('NavigationBar');
  });
});
```

---

## 🚨 Risk Assessment

### Low Risk:
- **Prism.js is mature** (10+ years, widely used)
- **Well-documented** with extensive examples
- **Small API surface** (one function call)
- **Fallback available** (plain text if highlighting fails)

### Considerations:
- **Bundle size:** Prism adds ~50KB (minified)
  - Mitigation: Only import needed languages
  - Languages we need: JSX, TSX (~20KB total)
- **Theme customization:** May need CSS tweaks
  - Mitigation: Custom CSS override file provided
- **Performance:** Highlighting large files
  - Current approach already renders line-by-line
  - Prism is optimized and fast

---

## 📚 Documentation Updates Needed

### After Implementation:

1. **Update CodePanel.tsx header comment:**
   ```typescript
   /**
    * SOLUTION:
    * - Uses Prism.js for professional syntax highlighting
    * - Proper JSX tokenization (no regex hacks)
    * - Theme customizable via CSS
    * - Responsive layout with scrolling
    */
   ```

2. **Create documentation entry:**
   - File: `.implementation/architecture/CODE_PANEL_HIGHLIGHTING.md`
   - Content: Decision rationale, Prism setup, customization guide

3. **Update README.md:**
   - Add Prism.js to dependencies list
   - Note syntax highlighting capabilities

---

## 🎯 Ready-to-Use Prompt for Cline

```
I need you to fix a bug in the Code Panel and implement proper syntax highlighting.

CURRENT PROBLEM:
The CodeLine component in src/renderer/components/CodeViewer/CodePanel.tsx uses regex-based syntax highlighting that creates overlapping HTML spans. Numbers in CSS class names (like "text-purple-600") are getting wrapped in their own span tags, creating malformed HTML.

SOLUTION REQUIRED:
Replace the regex approach with Prism.js for proper syntax highlighting.

IMPLEMENTATION STEPS:

1. Install dependencies:
   npm install prismjs
   npm install --save-dev @types/prismjs

2. Create src/renderer/utils/prismConfig.ts:
   - Import Prism core and JSX language
   - Export highlightCode() utility function
   - Include error handling with plain text fallback

3. Modify src/renderer/components/CodeViewer/CodePanel.tsx:
   - Import highlightCode from prismConfig
   - Replace the entire CodeLine function (lines ~280-350)
   - New CodeLine should be ~15 lines using Prism

4. Optional: Create src/renderer/styles/prism-custom.css:
   - Custom theme matching Rise color scheme
   - Token colors using Tailwind color palette

5. Test with NavigationBar component:
   - Verify no overlapping spans in browser DevTools
   - Verify className="text-blue-600" displays correctly
   - Verify comments, strings, keywords all properly highlighted

REQUIREMENTS:
- Remove all regex-based highlighting code
- Use Prism.js for tokenization
- Maintain dangerouslySetInnerHTML approach
- Handle empty lines (return nbsp)
- Include comprehensive error handling
- Add proper documentation comments

SUCCESS CRITERIA:
- No malformed HTML spans
- CSS class numbers not separately highlighted
- All JSX syntax properly colored
- No performance degradation
- Clean browser DevTools inspection

Please implement this solution with high code quality and proper error handling.
```

---

## 📖 Alternative Approaches Considered

### 1. **highlight.js**
- **Pros:** Similar to Prism, automatic language detection
- **Cons:** Larger bundle size (~90KB vs 50KB)
- **Decision:** Prism chosen for smaller footprint

### 2. **monaco-editor (VS Code)**
- **Pros:** Full-featured editor with IntelliSense
- **Cons:** Massive bundle (~5MB), overkill for read-only display
- **Decision:** Too heavy for simple code display

### 3. **Fix the regex approach**
- **Pros:** No new dependencies
- **Cons:** Always fragile, hard to maintain, limited features
- **Decision:** Not sustainable long-term

### 4. **Custom tokenizer**
- **Pros:** Full control, minimal bundle
- **Cons:** Weeks of development, testing, maintenance burden
- **Decision:** Not worth reinventing the wheel

---

## 🔄 Future Enhancements

### Phase 1 (Post-MVP):
- Add line highlighting for errors
- Add clickable import statements
- Add "Open in Editor" button per component

### Phase 2 (Advanced):
- Add diff view for comparing versions
- Add code search within displayed code
- Add collapsible imports/exports sections

### Phase 3 (Pro Features):
- Add theme switcher (light/dark/custom)
- Add export syntax highlighted PNG
- Add hover tooltips for component props

---

## 📝 Notes for Implementation

### Performance Optimization:
- Prism highlighting is fast but can be memoized
- Consider using `useMemo` for `highlightCode()` call
- Already using `useMemo` for `codeLines` array

### Bundle Size Management:
```javascript
// Only import needed languages
import 'prismjs/components/prism-jsx';
// Don't import everything:
// import 'prismjs/components'; ❌
```

### Accessibility:
- Syntax highlighting is cosmetic only
- Code remains readable in screen readers
- Consider adding `aria-label="Code display"` to container

### Browser Compatibility:
- Prism works in all modern browsers
- No polyfills needed for target Electron version
- Chromium 120+ fully supported

---

## ✅ Ready to Implement

This task is well-scoped and ready for Cline to execute. The implementation is straightforward, well-documented, and includes comprehensive testing procedures.

**Estimated Completion Time:** 2-3 hours  
**Confidence Rating:** 9/10  
**Risk Level:** Low

---

**Task Created:** 2025-12-01  
**Phase:** 3 - Code Generation & Preview  
**Category:** Bug Fix + Enhancement
