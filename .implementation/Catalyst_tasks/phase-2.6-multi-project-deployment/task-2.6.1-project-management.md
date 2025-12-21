# Task 2.6.1: Project Management System

**Phase:** Phase 2.6 - Multi-Project System & Deployment Management  
**Duration Estimate:** 2-3 days  
**Actual Duration:** [To be filled when complete]  
**Status:** 🔵 Not Started  
**Assigned:** AI + Human Review  
**Started:** [YYYY-MM-DD]  
**Completed:** [YYYY-MM-DD]  

---

## Task Overview

### Objective
Build the foundational project management system that allows grouping multiple workflows into deployable projects with shared secrets, environment variables, and deployment targets.

Currently, Catalyst treats each workflow independently with no way to group related workflows, share configuration, or deploy them as a unit. This task creates the core infrastructure for multi-project management.

### Success Criteria
- [ ] Project data types defined with proper TypeScript interfaces
- [ ] Zustand store for project state management implemented
- [ ] Project CRUD operations functional
- [ ] Deployment target management working
- [ ] Secrets encryption and storage implemented
- [ ] Project selector UI component created
- [ ] Can create, update, delete projects
- [ ] Can assign workflows to projects
- [ ] Test coverage >85%
- [ ] Human review completed

### References
- PHASE-2.6-TASKS.md - Task 2.6.1 details
- docs/Catalyst documentation/CATALYST_SPECIFICATION.md
- .clinerules/implementation-standards.md

### Dependencies
- Phase 2: LLM Integration (complete)
- Phase 2.5: Developer Experience (complete)
- Zustand package installed

---

## Milestones

### Milestone 1: Define Project Schema
**Date:** [YYYY-MM-DD]  
**Confidence:** 9/10  
**Status:** 🔵 Not Started  
**Time Spent:** [X hours]  

#### Activities
- [ ] Create `src/core/project/types.ts`
- [ ] Define `CatalystProject` interface
- [ ] Define `DeploymentTarget` interface
- [ ] Define `EncryptedSecret` interface
- [ ] Define `SharedFunction` interface
- [ ] Update `WorkflowDefinition` with project fields

#### Design Decisions

| Decision | Options Considered | Choice Made | Rationale | Confidence |
|----------|-------------------|-------------|-----------|------------|
| Project ID format | Auto-increment, UUID, timestamp-based | Timestamp-based (`project_${Date.now()}`) | Simple, unique, sortable, no external dependencies | 9/10 |
| Secrets storage | Plain text, encrypted in store, system keychain | Encrypted in store (with keychain for future) | Balance of security and ease of implementation | 8/10 |
| Deployment targets | Single target per project, multiple targets | Multiple targets per project | Enables staging/production separation | 10/10 |
| Workflow visibility | All public, manual config | Enum: 'public' \| 'internal' | Clear intent, enables sub-workflow pattern | 9/10 |

#### Type Definitions

**File:** `src/core/project/types.ts`

```typescript
/**
 * @file types.ts
 * @description Core type definitions for multi-project system
 * @architecture Phase 2.6, Task 2.6.1 - Project Management
 * @created 2025-12-21
 * @confidence 9/10 - Well-designed schema
 * 
 * @see .implementation/Catalyst_tasks/phase-2.6-multi-project-deployment/task-2.6.1-project-management.md
 * @security-critical true - Handles secrets and deployment configs
 */

/**
 * Core project entity that groups multiple workflows.
 * 
 * DESIGN PHILOSOPHY:
 * - One project = one deployable unit
 * - Workflows within project can call each other locally
 * - Shared secrets and environment variables
 * - Multiple deployment targets (staging, production, etc.)
 */
export interface CatalystProject {
  // Project metadata
  id: string;                    // Format: project_${timestamp}
  name: string;                  // User-friendly name
  description: string;           // Project description
  version: string;               // Semantic version (e.g., "0.1.0")
  createdAt: string;            // ISO 8601 timestamp
  updatedAt: string;            // ISO 8601 timestamp
  
  // Git integration
  git?: {
    repoUrl: string;            // GitHub/GitLab URL
    branch: string;             // Current branch (e.g., "main")
    lastCommit?: string;        // Last commit hash
    lastCommitAt?: string;      // ISO 8601 timestamp
  };
  
  // Deployment configuration
  deploymentTargets: Record<string, DeploymentTarget>;
  
  // Workflows in this project
  workflows: Record<string, WorkflowDefinition>;
  
  // Shared secrets (encrypted)
  secrets: Record<string, EncryptedSecret>;
  
  // Shared environment variables (not sensitive)
  envVars: Record<string, string>;
  
  // Shared utility functions (optional)
  sharedFunctions?: Record<string, SharedFunction>;
}

/**
 * Deployment target configuration.
 * Represents a specific deployment (e.g., staging, production).
 */
export interface DeploymentTarget {
  id: string;                    // Unique identifier
  name: string;                  // Display name
  platform: 'railway' | 'fly' | 'render' | 'cloud-run' | 'azure' | 'docker';
  
  // Deployment status
  status: 'not-deployed' | 'deploying' | 'deployed' | 'error' | 'stopped';
  lastDeployedAt?: string;      // ISO 8601 timestamp
  deployedVersion?: string;     // Git commit hash of deployed version
  
  // Platform URLs
  url?: string;                 // Production/staging URL
  webhookUrl?: string;          // For deployment notifications
  
  // Platform-specific configuration
  platformConfig: {
    region?: string;            // e.g., "us-west1"
    instanceSize?: string;      // e.g., "small", "medium"
    autoscaling?: {
      enabled: boolean;
      minInstances?: number;
      maxInstances?: number;
    };
  };
  
  // Health monitoring
  health?: {
    status: 'healthy' | 'degraded' | 'down';
    lastCheckAt: string;        // ISO 8601 timestamp
    uptime?: number;            // Seconds
    responseTime?: number;      // Milliseconds
    errorRate?: number;         // Percentage (0-100)
  };
  
  // Deployment history
  deployments?: DeploymentHistory[];
}

/**
 * Historical deployment record.
 */
export interface DeploymentHistory {
  id: string;
  version: string;              // Git commit hash
  deployedAt: string;           // ISO 8601 timestamp
  deployedBy?: string;          // User who triggered deployment
  status: 'success' | 'failed' | 'rolled-back';
  duration?: number;            // Seconds
  logs?: string;                // Deployment logs
  rollbackOf?: string;          // ID of deployment this rolled back
}

/**
 * Extended workflow definition with project-specific fields.
 */
export interface WorkflowDefinition {
  // ... existing WorkflowDefinition fields
  
  // NEW: Deployment configuration
  deploymentTargetId: string;   // Which target this workflow deploys to
  
  // NEW: Visibility
  visibility: 'public' | 'internal';
  // public = HTTP endpoint exposed
  // internal = only callable by other workflows
  
  // NEW: HTTP endpoint config (if public)
  endpoint?: {
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
    path: string;               // e.g., "/api/process-user"
  };
}

/**
 * Encrypted secret value.
 * 
 * SECURITY NOTES:
 * - Value should be encrypted before storage
 * - Use system keychain for encryption key
 * - Never log or display decrypted values
 */
export interface EncryptedSecret {
  name: string;                 // Secret key name
  value: string;                // Encrypted value
  description?: string;         // What this secret is for
  updatedAt: string;            // ISO 8601 timestamp
}

/**
 * Shared utility function definition.
 * Code that can be used by multiple workflows.
 */
export interface SharedFunction {
  id: string;
  name: string;                 // Function name
  description: string;          // What it does
  code: string;                 // Function implementation
  language: 'python' | 'javascript';
}
```

---

### Milestone 2: Implement Project Store
**Date:** [YYYY-MM-DD]  
**Confidence:** 8/10  
**Status:** 🔵 Not Started  
**Time Spent:** [X hours]  

#### Activities
- [ ] Create `src/renderer/store/projectStore.ts`
- [ ] Implement Zustand store with persistence
- [ ] Add project CRUD operations
- [ ] Add deployment target management
- [ ] Add secrets management
- [ ] Add environment variable management
- [ ] Add workflow assignment functions

#### Implementation Notes

**File:** `src/renderer/store/projectStore.ts`

**Key Features:**
- Zustand for reactive state management
- Local storage persistence
- Type-safe operations
- Optimistic updates

**Store Methods:**
- `createProject(name, description)` - Create new project
- `deleteProject(projectId)` - Remove project
- `updateProject(projectId, updates)` - Update project fields
- `setActiveProject(projectId)` - Set currently active project
- `addDeploymentTarget(projectId, target)` - Add deployment target
- `updateDeploymentTarget(projectId, targetId, updates)` - Update target
- `assignWorkflowToTarget(projectId, workflowId, targetId)` - Assign workflow
- `setWorkflowVisibility(projectId, workflowId, visibility)` - Set public/internal
- `addSecret(projectId, name, value)` - Add encrypted secret
- `updateSecret(projectId, name, value)` - Update secret
- `deleteSecret(projectId, name)` - Remove secret
- `setEnvVar(projectId, key, value)` - Set environment variable
- `deleteEnvVar(projectId, key)` - Remove environment variable

**Storage Schema:**
```json
{
  "state": {
    "projects": {
      "project_1234567890": {
        "id": "project_1234567890",
        "name": "Production API",
        "workflows": {},
        "deploymentTargets": {},
        "secrets": {},
        "envVars": {}
      }
    },
    "activeProjectId": "project_1234567890"
  },
  "version": 0
}
```

---

### Milestone 3: Create Project Selector UI
**Date:** [YYYY-MM-DD]  
**Confidence:** 8/10  
**Status:** 🔵 Not Started  
**Time Spent:** [X hours]  

#### Activities
- [ ] Create `src/renderer/components/ProjectSelector/` directory
- [ ] Implement `ProjectSelector.tsx` component
- [ ] Add dropdown menu for switching projects
- [ ] Add "Create New Project" button
- [ ] Add project indicator (current project display)
- [ ] Style with Tailwind CSS
- [ ] Test project switching

#### Component Design

**File:** `src/renderer/components/ProjectSelector/ProjectSelector.tsx`

**Features:**
- Dropdown showing all projects
- Current project indicator with status dot
- Quick create button
- Workflow count display
- Keyboard navigation support

**UI Layout:**
```
┌─────────────────────────────────┐
│ ● Production API        ▼       │ ← Current project
└─────────────────────────────────┘
        ↓ (click to expand)
┌─────────────────────────────────┐
│ PROJECTS                        │
│─────────────────────────────────│
│ ● Production API                │ ← Active
│   5 workflows                   │
│                                 │
│ ○ Staging Environment           │
│   3 workflows                   │
│                                 │
│ ○ Development                   │
│   1 workflow                    │
│─────────────────────────────────│
│ + New Project                   │
└─────────────────────────────────┘
```

---

### Milestone 4: Default Project Creation
**Date:** [YYYY-MM-DD]  
**Confidence:** 9/10  
**Status:** 🔵 Not Started  
**Time Spent:** [X hours]  

#### Activities
- [ ] Auto-create "Default Project" on first launch
- [ ] Migrate existing workflows to default project
- [ ] Add local deployment target by default
- [ ] Test migration logic

#### Implementation Notes

**Purpose:** Ensure backward compatibility for existing users.

**Approach:**
1. On app launch, check if any projects exist
2. If no projects exist, create "Default Project"
3. Assign any existing workflows to default project
4. Create "Local Development" deployment target

**Migration Logic:**
```typescript
function migrateToProjects() {
  const { projects, createProject } = useProjectStore.getState();
  
  // Check if migration needed
  if (Object.keys(projects).length === 0) {
    // Create default project
    const projectId = createProject(
      'Default Project',
      'Automatically created for existing workflows'
    );
    
    // Migrate existing workflows
    const existingWorkflows = loadExistingWorkflows();
    for (const workflow of existingWorkflows) {
      assignWorkflowToProject(projectId, workflow);
    }
  }
}
```

---

### Milestone 5: Testing & Documentation
**Date:** [YYYY-MM-DD]  
**Confidence:** [X/10]  
**Status:** 🔵 Not Started  
**Time Spent:** [X hours]  

#### Test Results

**Unit Tests:**
- Project store operations
- Type validations
- CRUD operations
- State persistence

**Integration Tests:**
- Create project → Add workflow → Verify assignment
- Switch projects → Verify UI updates
- Delete project → Verify cleanup

**Manual Testing:**

| Test Scenario | Expected | Actual | Pass/Fail | Notes |
|---------------|----------|--------|-----------|-------|
| Create new project | Project appears in selector | | | |
| Switch projects | Active project changes | | | |
| Delete project | Project removed from list | | | |
| Add deployment target | Target saved to project | | | |
| Add secret | Secret encrypted and stored | | | |

---

### Milestone 6: Human Review
**Date:** [YYYY-MM-DD]  
**Status:** 🔵 Not Started  

#### Human Review Checklist
- [ ] Project schema appropriate for multi-project use case
- [ ] Secrets encryption secure
- [ ] Store patterns follow best practices
- [ ] UI intuitive and accessible
- [ ] Ready for Task 2.6.2 (Dashboard UI)

#### Feedback Received

**Positive:**
- [To be filled during review]

**Concerns:**
- [To be filled during review]

**Action Items:**
- [To be filled during review]

**Final Confidence:** [X/10]

---

## Final Summary

### Deliverables
- [ ] `src/core/project/types.ts` - Complete type definitions
- [ ] `src/renderer/store/projectStore.ts` - Project state management
- [ ] `src/renderer/components/ProjectSelector/ProjectSelector.tsx` - UI component
- [ ] Migration logic for existing workflows
- [ ] Test coverage: [X%] (target: >85%)
- [ ] Human review: [Status]

### What Was Accomplished
[To be filled upon completion]

### Lessons Learned

**What Worked Well:**
- [To be filled]

**What Could Be Improved:**
- [To be filled]

**Reusable Patterns:**
- [To be filled]

---

## Appendix

### Key Files
- `src/core/project/types.ts` - Project type definitions
- `src/renderer/store/projectStore.ts` - Zustand store
- `src/renderer/components/ProjectSelector/ProjectSelector.tsx` - UI component
- `tests/unit/project-store.test.ts` - Unit tests

### Related Tasks
- Task 2.6.2: Project Dashboard UI (depends on this task)
- Task 2.6.3: Workflow Call Node (uses project data)
- Task 2.6.4: Project-Based Code Generation (uses project schema)

---

**Task Status:** 🔵 Not Started  
**Ready for:** Task 2.6.2 (after completion)  
**Last Updated:** 2025-12-21
