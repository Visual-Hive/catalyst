# Task 0.1: Fork and Rebrand

**Phase:** Phase 0 - Foundation  
**Duration Estimate:** 0.5 day  
**Actual Duration:** [To be filled when complete]  
**Status:** 🔵 Not Started  
**Assigned:** AI + Human Review  
**Started:** [YYYY-MM-DD]  
**Completed:** [YYYY-MM-DD]  

---

## Task Overview

### Objective
Transform the Rise codebase into Catalyst with new branding, renaming all references and updating configuration files.

This task establishes the new identity for the Catalyst project. Since Catalyst is evolving from Rise (a React UI builder) to a Python workflow builder, we need to rebrand all user-facing elements while preserving the existing code infrastructure that will be adapted in subsequent tasks.

### Success Criteria
- [ ] Application launches as "Catalyst"
- [ ] Window title shows "Catalyst"
- [ ] No "Rise" references in user-visible UI
- [ ] Package name is "catalyst" in package.json
- [ ] About dialog shows Catalyst branding
- [ ] All configuration files updated
- [ ] Human review completed

### References
- CATALYST_PHASE_0_TASKS.md - Task 0.1
- CATALYST_PROJECT_SUMMARY.md - Project Overview
- CATALYST_SPECIFICATION.md - Vision and Goals

### Dependencies
- None (this is the starting task)

---

## Milestones

### Milestone 1: Audit Existing Codebase
**Date:** [YYYY-MM-DD]  
**Confidence:** [X/10]  
**Status:** 🔵 Not Started  
**Time Spent:** [X hours]  

#### Activities
- [ ] Search for all "Rise" references in codebase
- [ ] Identify files requiring modification
- [ ] Document current branding locations
- [ ] Check for any Rise-specific assets

#### Audit Commands
```bash
# Find all Rise references in TypeScript/JavaScript files
grep -r "Rise" --include="*.ts" --include="*.tsx" --include="*.json" .

# Find in HTML files
grep -r "Rise" --include="*.html" .

# Find case-insensitive
grep -ri "rise" --include="*.ts" --include="*.tsx" .
```

#### Files to Check
| File | Purpose | Expected Changes |
|------|---------|------------------|
| `package.json` | Package configuration | name, productName, description |
| `electron/main.ts` | Main process | Window title, about dialog |
| `src/renderer/App.tsx` | React app root | Title components |
| `public/index.html` | HTML template | Page title |
| `README.md` | Documentation | Project name, description |
| `public/icons/` | App icons | Replace if Rise-branded |

#### Notes
Review each Rise reference to determine if it should be:
1. Replaced with "Catalyst"
2. Removed entirely
3. Kept (if it refers to external dependencies)

---

### Milestone 2: Update Configuration Files
**Date:** [YYYY-MM-DD]  
**Confidence:** [X/10]  
**Status:** 🔵 Not Started  
**Time Spent:** [X hours]  

#### Activities
- [ ] Update package.json with new branding
- [ ] Update any build configuration
- [ ] Update environment configurations

#### Design Decisions

| Decision | Options Considered | Choice Made | Rationale | Confidence |
|----------|-------------------|-------------|-----------|------------|
| Package name format | `catalyst`, `catalyst-workflow`, `@visual-hive/catalyst` | `catalyst` | Simple, clear, matches product name | 9/10 |
| Version reset | Keep existing version, Reset to 0.1.0 | Reset to 0.1.0 | Fresh start for new product direction | 9/10 |

#### package.json Changes
```json
{
  "name": "catalyst",
  "productName": "Catalyst",
  "description": "Visual workflow builder that generates Python code",
  "version": "0.1.0",
  "author": "Visual Hive",
  "license": "MIT"
}
```

#### Files Modified
- `package.json` - Name, description, version updates

---

### Milestone 3: Update Electron Main Process
**Date:** [YYYY-MM-DD]  
**Confidence:** [X/10]  
**Status:** 🔵 Not Started  
**Time Spent:** [X hours]  

#### Activities
- [ ] Change window title to "Catalyst"
- [ ] Update about dialog text
- [ ] Modify any Rise-specific references
- [ ] Update application menu labels if present

#### electron/main.ts Changes
```typescript
// Update window title
const win = new BrowserWindow({
  title: 'Catalyst',
  // ... other options
});

// Update about dialog (if present)
app.setAboutPanelOptions({
  applicationName: 'Catalyst',
  applicationVersion: '0.1.0',
  copyright: 'Visual Hive',
  version: '0.1.0',
});
```

#### Files Modified
- `electron/main.ts` - Window title, about dialog

---

### Milestone 4: Update React Application
**Date:** [YYYY-MM-DD]  
**Confidence:** [X/10]  
**Status:** 🔵 Not Started  
**Time Spent:** [X hours]  

#### Activities
- [ ] Update App.tsx with Catalyst branding
- [ ] Update any title/header components
- [ ] Check for Rise references in renderer code

#### src/renderer/App.tsx Changes
Look for:
- Application title in header/navbar
- Welcome screen text
- Any "Rise" branded components

#### Files Modified
- `src/renderer/App.tsx` - Title components
- Any branded header/nav components

---

### Milestone 5: Update HTML and Assets
**Date:** [YYYY-MM-DD]  
**Confidence:** [X/10]  
**Status:** 🔵 Not Started  
**Time Spent:** [X hours]  

#### Activities
- [ ] Update index.html title tag
- [ ] Update or replace app icons
- [ ] Update splash screen if present
- [ ] Check for branded images

#### public/index.html Changes
```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/icons/icon.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Catalyst</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/renderer/main.tsx"></script>
  </body>
</html>
```

#### Asset Updates
- [ ] Create placeholder Catalyst icon (or use existing if not Rise-branded)
- [ ] Update favicon if branded
- [ ] Update any splash screen images

#### Files Modified
- `public/index.html` - Title tag
- `public/icons/` - App icons (if needed)

---

### Milestone 6: Update Documentation
**Date:** [YYYY-MM-DD]  
**Confidence:** [X/10]  
**Status:** 🔵 Not Started  
**Time Spent:** [X hours]  

#### Activities
- [ ] Update README.md with Catalyst branding
- [ ] Update any developer documentation
- [ ] Check CONTRIBUTING.md if present

#### README.md Updates
```markdown
# Catalyst

Visual workflow builder that generates clean, production-ready Python code.

## Overview

Catalyst is an AI-powered desktop application for building server-side workflows 
visually. Design your workflows with a node-based editor, and Catalyst generates 
clean Python/FastAPI code.

## Features

- Visual workflow editor with React Flow
- 55+ built-in node types (LLM, API, Data, Control Flow)
- Real-time Python code generation
- AI-assisted workflow creation
- Expression system for dynamic values
```

#### Files Modified
- `README.md` - Project description and branding

---

### Milestone 7: Verification and Testing
**Date:** [YYYY-MM-DD]  
**Confidence:** [X/10]  
**Status:** 🔵 Not Started  
**Time Spent:** [X hours]  

#### Activities
- [ ] Run application and verify title
- [ ] Check about dialog (if accessible)
- [ ] Search for remaining Rise references
- [ ] Verify build succeeds

#### Verification Checklist
| Check | Expected | Pass/Fail |
|-------|----------|-----------|
| Application window title | "Catalyst" | |
| About dialog name | "Catalyst" | |
| package.json name | "catalyst" | |
| HTML title tag | "Catalyst" | |
| No "Rise" in UI | True | |
| Build succeeds | No errors | |
| App launches | Successful | |

#### Verification Commands
```bash
# Search for remaining Rise references
grep -ri "rise" --include="*.ts" --include="*.tsx" --include="*.json" --include="*.html" .

# Build the application
npm run build

# Launch the application
npm run dev
```

---

### Milestone 8: Human Review
**Date:** [YYYY-MM-DD]  
**Confidence:** [X/10]  
**Status:** 🔵 Not Started  
**Time Spent:** [X hours]  

#### Human Review

**Reviewer:** [Name]  
**Date:** [YYYY-MM-DD]  
**Duration:** [X minutes]  

**Review Focus:**
- All user-visible branding updated
- No Rise references remaining
- Application launches correctly
- Build succeeds without errors

**Feedback Received:**

**Positive:**
- ✅ [To be filled]

**Concerns:**
- ⚠️ [To be filled]

**Sign-off:**
- [ ] Branding changes approved
- [ ] No Rise references in UI
- [ ] Ready for Task 0.2

**Final Confidence:** [X/10]

---

## Final Summary

### Deliverables
- [ ] Updated package.json with Catalyst branding
- [ ] Updated electron/main.ts with new window title
- [ ] Updated src/renderer/App.tsx branding
- [ ] Updated public/index.html title
- [ ] Updated README.md documentation
- [ ] Verified no Rise references in UI
- [ ] Human review completed

### What Was Accomplished
[To be filled upon completion]

### Lessons Learned
[To be filled upon completion]

### Technical Debt Created
- None expected for this task (pure renaming)

### Next Steps
- [ ] Proceed to Task 0.2: Manifest Schema Design
- [ ] Create workflow type definitions
- [ ] Set up validation system

---

## Appendix

### Key Files
- `package.json` - Main package configuration
- `electron/main.ts` - Electron main process
- `src/renderer/App.tsx` - React application root
- `public/index.html` - HTML template
- `README.md` - Project documentation

### Useful Commands
```bash
# Find all Rise references
grep -ri "rise" --include="*.ts" --include="*.tsx" --include="*.json" .

# Build application
npm run build

# Run development server
npm run dev
```

### Related Tasks
- Task 0.2: Manifest Schema Design (next)

---

**Task Status:** 🔵 Not Started  
**Ready for:** Implementation  
**Last Updated:** 2025-12-18
