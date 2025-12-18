/**
 * @file promptTemplates.ts
 * @description Enhanced prompt templates for AI component generation
 * 
 * @architecture Phase 3, Task 3.7 - Enhanced AI Generation
 * @created 2025-11-29
 * @author AI (Cline) + Human Review
 * @confidence 9/10 - Well-structured prompts with comprehensive examples
 * 
 * @see .implementation/phase-3-code-generation-and-preview/task-3.7-enhanced-ai-generation.md
 * @see src/main/ai/AIComponentGenerator.ts - Uses these prompts
 * @see docs/SCHEMA_LEVELS.md - Level 1 restrictions
 * 
 * PROBLEM SOLVED:
 * - Current AI generates minimal stub components without structure
 * - Users expect "header with navigation" to produce a full header layout
 * - Generated components lack comprehensive styling and realistic content
 * 
 * SOLUTION:
 * - Enhanced prompt template with explicit instructions for full hierarchies
 * - Pattern detection to provide relevant examples
 * - Embedded UI pattern examples showing expected structures
 * - Clear instructions for nested child component generation
 * 
 * USAGE:
 * ```typescript
 * import { buildEnhancedPrompt, detectRequestedType } from './promptTemplates';
 * 
 * const type = detectRequestedType(userPrompt);
 * const fullPrompt = buildEnhancedPrompt(userPrompt, context);
 * ```
 * 
 * @security-critical false
 * @performance-critical false - Prompt building is fast
 */

import type { GenerationContext } from './types';

/**
 * Detected component pattern types
 * Used to select relevant examples in the prompt
 */
export type ComponentPatternType =
  | 'header'
  | 'footer'
  | 'card'
  | 'form'
  | 'list'
  | 'hero'
  | 'navigation'
  | 'profile'
  | 'generic';

/**
 * UI Pattern Examples
 * 
 * These examples are embedded in prompts to guide AI output structure.
 * Each pattern shows the expected hierarchy and styling for common UI elements.
 * 
 * DESIGN DECISION: Examples use realistic Tailwind classes that produce
 * professional-looking output without requiring custom CSS.
 */
export const UI_PATTERN_EXAMPLES: Record<ComponentPatternType, string> = {
  header: `
HEADER PATTERN EXAMPLE:
A header should have this structure:
- Container (flex justify-between items-center px-6 py-4 bg-white border-b border-gray-200)
  - Logo container (flex items-center gap-2)
    - Logo icon (text element with emoji/text, text-2xl)
    - Logo text (text element, text-xl font-bold text-gray-800)
  - Navigation container (flex items-center gap-6)
    - Nav link 1 (link with text "Home", text-gray-600 hover:text-gray-900 font-medium)
    - Nav link 2 (link with text "Products")
    - Nav link 3 (link with text "About")
    - Nav link 4 (link with text "Contact")
  - CTA button (button, px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700)

Generate at least 3-4 navigation links with realistic names.`,

  footer: `
FOOTER PATTERN EXAMPLE:
A footer should have this structure:
- Container (bg-gray-900 text-white px-6 py-12)
  - Footer content row (flex justify-between flex-wrap gap-8 max-w-6xl mx-auto)
    - Company section (flex flex-col gap-4)
      - Company name (text element, text-xl font-bold)
      - Tagline (text element, text-gray-400 text-sm)
    - Links section (flex flex-col gap-2)
      - Section title (text element, font-semibold mb-2)
      - Links (multiple link children, text-gray-400 hover:text-white)
    - Contact section similar structure
  - Copyright row (border-t border-gray-800 mt-8 pt-8 text-center text-gray-500 text-sm)

Include multiple columns with realistic link text like "Privacy Policy", "Terms of Service", etc.`,

  card: `
CARD PATTERN EXAMPLE:
A card should have this structure:
- Container (bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow)
  - Image container (if image requested)
    - Image (w-full h-48 object-cover)
  - Content container (p-6)
    - Title (text element, text-lg font-semibold text-gray-800)
    - Description (text element, text-gray-600 text-sm mt-2)
    - Metadata row (flex items-center gap-4 mt-4)
      - Price or date (text element, text-blue-600 font-bold)
      - Additional info (text element, text-gray-500 text-sm)
  - Actions container (px-6 pb-6 flex gap-3)
    - Primary button (button, flex-1 py-2 bg-blue-600 text-white rounded-lg)
    - Secondary button (button, px-4 py-2 border border-gray-300 rounded-lg)

Use realistic content like product names, prices ($99.00), dates, etc.`,

  form: `
FORM PATTERN EXAMPLE:
A form should have this structure:
- Container (flex flex-col gap-6 max-w-md p-6 bg-white rounded-lg shadow-md)
  - Title (text element, text-2xl font-bold text-gray-800 mb-2)
  - Field group 1 (flex flex-col gap-2)
    - Label (text element, text-sm font-medium text-gray-700)
    - Input (input, w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent)
  - Field group 2 (same structure for email)
  - Field group 3 (same structure for message, but larger)
  - Checkbox row (flex items-center gap-2)
    - Checkbox input
    - Label text
  - Submit button (w-full py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700)

Include realistic field labels like "Full Name", "Email Address", "Message".`,

  list: `
LIST PATTERN EXAMPLE:
A list should have this structure:
- Container (flex flex-col gap-3)
  - List item 1 (flex items-center gap-4 p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow)
    - Avatar/icon (w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center)
    - Content (flex-1)
      - Title (text element, font-medium text-gray-800)
      - Subtitle (text element, text-sm text-gray-500)
    - Action (text element or button, text-blue-600 hover:text-blue-800)
  - List item 2 (same structure)
  - List item 3 (same structure)
  - List item 4 (same structure)

Generate at least 3-4 list items with realistic names, descriptions, etc.`,

  hero: `
HERO PATTERN EXAMPLE:
A hero section should have this structure:
- Container (min-h-96 flex items-center justify-center bg-gradient-to-br from-blue-600 to-purple-700 px-6 py-20)
  - Content container (max-w-4xl text-center)
    - Badge/eyebrow (text element, text-blue-200 text-sm font-medium uppercase tracking-wide)
    - Headline (text element, text-4xl md:text-5xl font-bold text-white mt-4)
    - Subheadline (text element, text-xl text-blue-100 mt-6 max-w-2xl mx-auto)
    - CTA container (flex items-center justify-center gap-4 mt-8)
      - Primary button (px-8 py-4 bg-white text-blue-600 rounded-lg font-semibold hover:bg-blue-50)
      - Secondary button (px-8 py-4 border-2 border-white text-white rounded-lg font-semibold hover:bg-white/10)

Use compelling marketing text like "Build faster with Rise", "The future of low-code development".`,

  navigation: `
NAVIGATION PATTERN EXAMPLE:
A navigation menu should have this structure:
- Container (flex items-center gap-1 bg-gray-100 p-1 rounded-lg)
  - Nav item 1 (px-4 py-2 rounded-md bg-white shadow-sm font-medium text-gray-800)
  - Nav item 2 (px-4 py-2 rounded-md text-gray-600 hover:bg-white hover:shadow-sm)
  - Nav item 3 (same structure)
  - Nav item 4 (same structure)

OR for sidebar navigation:
- Container (flex flex-col gap-1 w-64 bg-gray-800 p-4 min-h-screen)
  - Logo section at top
  - Nav group with multiple link items
  - Footer section at bottom

Generate appropriate navigation items based on context.`,

  profile: `
PROFILE PATTERN EXAMPLE:
A profile section should have this structure:
- Container (flex flex-col items-center p-8 bg-white rounded-xl shadow-lg max-w-sm)
  - Avatar (w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold)
  - Name (text element, text-xl font-bold text-gray-800 mt-4)
  - Title/role (text element, text-gray-500)
  - Bio (text element, text-center text-gray-600 mt-4 text-sm)
  - Stats row (flex gap-8 mt-6)
    - Stat 1 (flex flex-col items-center)
      - Number (font-bold text-xl)
      - Label (text-sm text-gray-500)
    - Stat 2, Stat 3 (same structure)
  - Action buttons (flex gap-3 mt-6)
    - Follow button (px-6 py-2 bg-blue-600 text-white rounded-lg)
    - Message button (px-6 py-2 border border-gray-300 rounded-lg)

Use realistic user data like "Sarah Johnson", "Product Designer", follower counts, etc.`,

  generic: `
GENERIC COMPONENT GUIDELINES:
For any component, ensure:
- Proper container with padding (p-4 or p-6)
- Background color (bg-white or appropriate)
- Border radius (rounded-lg or rounded-xl)
- Shadow if it's a card-like element (shadow-md or shadow-lg)
- Appropriate text hierarchy (text-lg font-bold for titles, text-sm text-gray-600 for secondary)
- Spacing between children (gap-4 or gap-6 in flex containers)
- Hover states where appropriate (hover:shadow-lg, hover:bg-gray-50)

Generate multiple child elements to create meaningful structure.`,
};

/**
 * Enhanced Component Generation Prompt
 * 
 * This prompt template instructs Claude to generate complete component hierarchies
 * with nested children, comprehensive styling, and realistic content.
 * 
 * PLACEHOLDERS:
 * - {userPrompt} - The user's original request
 * - {patternHint} - Pattern-specific example (from UI_PATTERN_EXAMPLES)
 * - {existingComponents} - List of existing component names to avoid conflicts
 */
export const ENHANCED_COMPONENT_PROMPT = `You are a React component architect for Catalyst, a visual workflow builder (forked from Rise).
Your task is to generate a VISUALLY COMPLETE component schema with proper hierarchy, styling, and content.

USER REQUEST:
{userPrompt}

CONTEXT:
- Framework: React
- Schema Level: 1 (MVP - static properties only, NO events/state)
- Existing components: {existingComponents}

{patternHint}

=== CRITICAL OUTPUT REQUIREMENTS ===

1. GENERATE COMPLETE HIERARCHIES:
   - Create FULL component trees, NOT minimal stubs
   - Include child components as nested objects in the "children" array
   - Aim for 3-5 levels of nesting where appropriate
   - Multiple children per container (headers have logo + nav + button, etc.)

2. DETAILED TAILWIND STYLING:
   - Every component needs baseClasses with 5+ Tailwind classes
   - Layout: flex, grid, items-center, justify-between, gap-*
   - Spacing: p-*, m-*, px-*, py-*
   - Typography: text-*, font-*, leading-*
   - Colors: bg-*, text-*, border-*
   - Effects: shadow-*, rounded-*, hover:*
   - Responsive: md:*, lg:* where appropriate

3. REALISTIC CONTENT:
   - Use believable placeholder text, NOT "Lorem ipsum"
   - Names: "Sarah Johnson", "Acme Corp", "TechStart Inc"
   - Prices: "$99.00", "$149/month"
   - Dates: "March 15, 2024"
   - Actions: "Get Started", "Learn More", "Contact Us"
   - Emails: "contact@example.com"

4. LEVEL 1 RESTRICTIONS (MUST FOLLOW):
   ❌ NO onClick, onChange, or any event handlers
   ❌ NO useState, expressions, or dynamic values
   ❌ NO type: "expression" - only "static" or "prop"
   ❌ NO conditional rendering logic
   ✅ Only static values and props
   ✅ Styling-based hover states are OK (hover:* classes)

5. COMPONENT TYPES:
   Use these types for HTML elements:
   - div, span, section, article, header, footer, nav, main
   - button, a (for links), img
   - h1, h2, h3, p
   - ul, li
   - input, label, form, textarea
   - card (maps to div with card styling)

=== OUTPUT FORMAT ===

Return ONLY valid JSON. NO markdown, NO explanation, NO code blocks.

{
  "displayName": "ComponentName",
  "type": "div",
  "category": "layout",
  "properties": {
    "text": {
      "type": "static",
      "dataType": "string",
      "value": "Visible text content"
    }
  },
  "styling": {
    "baseClasses": ["flex", "items-center", "justify-between", "px-6", "py-4", "bg-white"]
  },
  "children": [
    {
      "displayName": "ChildComponent",
      "type": "div",
      "category": "basic",
      "properties": {
        "text": {
          "type": "static",
          "dataType": "string",
          "value": "Child content"
        }
      },
      "styling": {
        "baseClasses": ["flex", "items-center", "gap-2"]
      },
      "children": []
    }
  ]
}

=== PROPERTY FORMATS ===

Static property (fixed value):
{
  "propertyName": {
    "type": "static",
    "dataType": "string",
    "value": "the value"
  }
}

Prop property (can be customized later):
{
  "propertyName": {
    "type": "prop",
    "dataType": "string",
    "required": false,
    "default": "default value"
  }
}

For components displaying text, include a "text" property with visible content.
For images, include "src" and "alt" properties.
For links, include "href" and "text" properties.
For buttons, include "text" property (will render as button text).
For inputs, include "placeholder" and optionally "label" properties.

=== REMEMBER ===

1. Generate COMPLETE structures - a header needs logo, nav items, and buttons
2. Use REALISTIC content - not placeholder123 or Lorem ipsum
3. Include COMPREHENSIVE styling - at least 5 classes per component
4. Nest children INLINE as objects - they will be flattened later
5. Maximum depth: 5 levels of nesting

Generate the component schema now:`;

/**
 * Detect the type of component being requested from user prompt
 * 
 * Analyzes keywords in the prompt to determine which UI pattern
 * example should be included in the prompt.
 * 
 * @param prompt - User's natural language request
 * @returns Detected component pattern type
 * 
 * DESIGN DECISION: Uses simple keyword matching for reliability.
 * More sophisticated NLP would add complexity without much benefit.
 * 
 * @example
 * detectRequestedType('Create a header with logo')  // 'header'
 * detectRequestedType('User profile card')          // 'profile'
 * detectRequestedType('Contact form')               // 'form'
 */
export function detectRequestedType(prompt: string): ComponentPatternType {
  const lower = prompt.toLowerCase();
  
  // Header patterns
  if (
    lower.includes('header') ||
    lower.includes('navbar') ||
    lower.includes('top bar') ||
    lower.includes('app bar') ||
    lower.includes('topnav')
  ) {
    return 'header';
  }
  
  // Footer patterns
  if (lower.includes('footer') || lower.includes('bottom bar')) {
    return 'footer';
  }
  
  // Hero section patterns
  if (
    lower.includes('hero') ||
    lower.includes('banner') ||
    lower.includes('landing') ||
    lower.includes('welcome section') ||
    lower.includes('jumbotron')
  ) {
    return 'hero';
  }
  
  // Navigation patterns (not header)
  if (
    (lower.includes('nav') || lower.includes('menu') || lower.includes('sidebar')) &&
    !lower.includes('header')
  ) {
    return 'navigation';
  }
  
  // Form patterns
  if (
    lower.includes('form') ||
    lower.includes('signup') ||
    lower.includes('sign up') ||
    lower.includes('login') ||
    lower.includes('log in') ||
    lower.includes('contact') ||
    lower.includes('register') ||
    lower.includes('subscribe')
  ) {
    return 'form';
  }
  
  // Card patterns
  if (
    lower.includes('card') ||
    lower.includes('tile') ||
    lower.includes('product') ||
    lower.includes('article') ||
    lower.includes('post')
  ) {
    return 'card';
  }
  
  // List patterns
  if (
    lower.includes('list') ||
    lower.includes('items') ||
    lower.includes('table') ||
    lower.includes('grid of') ||
    lower.includes('collection')
  ) {
    return 'list';
  }
  
  // Profile patterns
  if (
    lower.includes('profile') ||
    lower.includes('user card') ||
    lower.includes('avatar') ||
    lower.includes('author') ||
    lower.includes('team member')
  ) {
    return 'profile';
  }
  
  // Default to generic
  return 'generic';
}

/**
 * Format existing component names for prompt context
 * 
 * Converts array of component names into a readable string
 * that helps AI avoid naming conflicts.
 * 
 * @param names - Array of existing component names
 * @returns Formatted string for prompt
 */
function formatExistingComponents(names: string[]): string {
  if (names.length === 0) {
    return 'None (this will be the first component)';
  }
  
  if (names.length <= 5) {
    return names.join(', ');
  }
  
  // For many components, show first 5 + count
  const first5 = names.slice(0, 5).join(', ');
  return `${first5} (+${names.length - 5} more)`;
}

/**
 * Build the enhanced prompt for component generation
 * 
 * Combines the base prompt template with:
 * - User's prompt
 * - Pattern-specific example based on detected type
 * - Existing component names for context
 * 
 * @param userPrompt - User's natural language description
 * @param context - Generation context with existing components
 * @returns Complete prompt ready for Claude API
 * 
 * @example
 * const prompt = buildEnhancedPrompt(
 *   'Create a header with logo and navigation',
 *   { framework: 'react', schemaLevel: 1, existingComponentNames: ['App'] }
 * );
 * 
 * DESIGN DECISION: Pattern hints are optional - we always include them
 * but they're helpful, not required. Generic still provides good guidance.
 */
export function buildEnhancedPrompt(
  userPrompt: string,
  context: GenerationContext
): string {
  // Detect what type of component the user is asking for
  const patternType = detectRequestedType(userPrompt);
  
  // Get the relevant pattern example
  const patternExample = UI_PATTERN_EXAMPLES[patternType];
  
  // Format the pattern hint section
  const patternHint = `=== PATTERN EXAMPLE ===\n${patternExample}`;
  
  // Format existing components
  const existingStr = formatExistingComponents(context.existingComponentNames);
  
  // Build the full prompt with replacements
  return ENHANCED_COMPONENT_PROMPT
    .replace('{userPrompt}', userPrompt)
    .replace('{patternHint}', patternHint)
    .replace('{existingComponents}', existingStr);
}

/**
 * Get pattern type display name for logging/debugging
 * 
 * @param type - ComponentPatternType
 * @returns Human-readable pattern name
 */
export function getPatternDisplayName(type: ComponentPatternType): string {
  const names: Record<ComponentPatternType, string> = {
    header: 'Header/Navbar',
    footer: 'Footer',
    card: 'Card/Tile',
    form: 'Form',
    list: 'List/Grid',
    hero: 'Hero Section',
    navigation: 'Navigation Menu',
    profile: 'Profile/User Card',
    generic: 'Generic Component',
  };
  
  return names[type];
}
