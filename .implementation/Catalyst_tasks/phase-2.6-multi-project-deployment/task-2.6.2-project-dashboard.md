# Task 2.6.2: Project Dashboard UI

**Phase:** Phase 2.6 - Multi-Project System & Deployment Management  
**Duration Estimate:** 3-4 days  
**Actual Duration:** [To be filled when complete]  
**Status:** 🔵 Not Started  
**Assigned:** AI + Human Review  
**Started:** [YYYY-MM-DD]  
**Completed:** [YYYY-MM-DD]  

---

## Task Overview

### Objective
Build the main user interface for project management - a visual dashboard showing all projects with health metrics, deployment status, and detailed project views.

This is the primary UX for Phase 2.6, providing users with at-a-glance visibility into all their projects, deployment health, and the ability to drill down into details.

### Success Criteria
- [ ] Dashboard shows all projects in grid layout
- [ ] Project cards display key metrics (workflows, uptime, response time, error rate)
- [ ] Health status indicated with colors (green = healthy, yellow = degraded, red = down)
- [ ] Search and filter functionality works
- [ ] Can click project to see detailed view
- [ ] Detailed view shows workflows, deployment history, health metrics
- [ ] Production URLs are accessible
- [ ] Git commit information visible
- [ ] Last deployment timestamp shown
- [ ] Empty state handles no projects gracefully
- [ ] Test coverage >85%
- [ ] Human review completed

### References
- PHASE-2.6-TASKS.md - Task 2.6.2 details
- Task 2.6.1 - Depends on project store and types
- .clinerules/implementation-standards.md

### Dependencies
- Task 2.6.1: Project Management System (MUST be complete)
- date-fns package for date formatting
- lucide-react for icons

---

## Milestones

### Milestone 1: Project Dashboard Component
**Date:** [YYYY-MM-DD]  
**Confidence:** 8/10  
**Status:** 🔵 Not Started  
**Time Spent:** [X hours]  

#### Activities
- [ ] Create `src/renderer/components/ProjectDashboard/` directory
- [ ] Implement `ProjectDashboard.tsx` main component
- [ ] Add search functionality
- [ ] Add "New Project" button
- [ ] Create empty state component
- [ ] Style with Tailwind CSS
- [ ] Test responsive layout

#### Design Decisions

| Decision | Options Considered | Choice Made | Rationale | Confidence |
|----------|-------------------|-------------|-----------|------------|
| Layout | List view, grid view, table | Grid view (responsive columns) | Better visual hierarchy, easier to scan | 9/10 |
| Search | Client-side, server-side | Client-side filtering | All data already loaded, instant results | 10/10 |
| Empty state | Minimal, onboarding | Rich onboarding with CTA | Better first-time user experience | 8/10 |
| Project creation | Modal, inline form, prompt | Browser prompt (simple) | Quick MVP, can enhance later | 7/10 |

#### Component Structure

**File:** `src/renderer/components/ProjectDashboard/ProjectDashboard.tsx`

```typescript
import React from 'react';
import { useProjectStore } from '@/renderer/store/projectStore';
import { ProjectCard } from './ProjectCard';
import { Plus, Search } from 'lucide-react';

export function ProjectDashboard() {
  const { projects, createProject } = useProjectStore();
  const [searchQuery, setSearchQuery] = React.useState('');
  
  const projectList = Object.values(projects);
  const filteredProjects = projectList.filter((project) =>
    project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    project.description.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header with search and create button */}
      <div className="bg-white border-b border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Projects</h1>
            <p className="text-sm text-gray-500 mt-1">
              Manage your workflow projects and deployments
            </p>
          </div>
          
          <button
            onClick={() => {
              const name = prompt('Project name:');
              if (name) createProject(name, '');
            }}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white 
                       rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            <span>New Project</span>
          </button>
        </div>
        
        {/* Search bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search projects..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg
                       focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>
      
      {/* Project grid */}
      <div className="flex-1 overflow-y-auto p-6">
        {filteredProjects.length === 0 ? (
          <EmptyState 
            hasProjects={projectList.length > 0}
            onCreateProject={createProject} 
          />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredProjects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function EmptyState({ 
  hasProjects,
  onCreateProject 
}: { 
  hasProjects: boolean;
  onCreateProject: (name: string, desc: string) => void;
}) {
  if (hasProjects) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No projects match your search</p>
      </div>
    );
  }
  
  return (
    <div className="flex flex-col items-center justify-center h-96 text-center">
      <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mb-4">
        <Plus className="w-8 h-8 text-gray-400" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        No projects yet
      </h3>
      <p className="text-gray-500 mb-6 max-w-md">
        Create your first project to start building workflows that can be deployed together.
      </p>
      <button
        onClick={() => {
          const name = prompt('Project name:');
          if (name) onCreateProject(name, '');
        }}
        className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
      >
        Create Your First Project
      </button>
    </div>
  );
}
```

---

### Milestone 2: Project Card Component
**Date:** [YYYY-MM-DD]  
**Confidence:** 9/10  
**Status:** 🔵 Not Started  
**Time Spent:** [X hours]  

#### Activities
- [ ] Create `ProjectCard.tsx` component
- [ ] Display project name and description
- [ ] Show health status with color coding
- [ ] Display metrics (workflows, uptime, response time, error rate)
- [ ] Show deployment info (platform, last deployed, version)
- [ ] Add action buttons (Open, Settings)
- [ ] Handle click to navigate to detail view
- [ ] Format dates with date-fns

#### Component Features

**Health Status Color Coding:**
- 🟢 Green (Healthy): System operational
- 🟡 Yellow (Degraded): Performance issues
- 🔴 Red (Down): System offline
- ⚪ Gray (Unknown): No deployment or no health data

**Metrics Display:**
- Workflow count
- Uptime percentage (99.9%)
- Average response time (45ms)
- Error rate percentage (0.2%)

**File:** `src/renderer/components/ProjectDashboard/ProjectCard.tsx` (See PHASE-2.6-TASKS.md for full implementation)

---

### Milestone 3: Project Detail View
**Date:** [YYYY-MM-DD]  
**Confidence:** 8/10  
**Status:** 🔵 Not Started  
**Time Spent:** [X hours]  

#### Activities
- [ ] Create `ProjectDetailView.tsx` component
- [ ] Implement back navigation
- [ ] Show project header with quick stats
- [ ] Create workflow list section
- [ ] Create deployment history section
- [ ] Create health metrics panel
- [ ] Add Deploy and Settings buttons
- [ ] Handle routing with react-router

#### Layout Design

```
┌────────────────────────────────────────────┐
│ ← Project Name              [Deploy] [⚙️]  │
├────────────────────────────────────────────┤
│ [Workflows] [Version] [Last Deploy] [●]    │
├─────────────────────────┬──────────────────┤
│                         │                  │
│ Workflows               │ Health Metrics   │
│ ├─ workflow1 (PUBLIC)   │ Status: Healthy  │
│ ├─ workflow2 (INTERNAL) │ Uptime: 99.9%    │
│ └─ workflow3 (INTERNAL) │ Response: 45ms   │
│                         │ Errors: 0.2%     │
│ Recent Deployments      │                  │
│ ✓ v1.2.3 - 2h ago      │ Production URL   │
│ ✓ v1.2.2 - 1d ago      │ https://...      │
│ ✗ v1.2.1 - 2d ago      │ [Visit] [Copy]   │
│                         │                  │
└─────────────────────────┴──────────────────┘
```

---

### Milestone 4: Supporting Components
**Date:** [YYYY-MM-DD]  
**Confidence:** 8/10  
**Status:** 🔵 Not Started  
**Time Spent:** [X hours]  

#### Activities
- [ ] Create `WorkflowList.tsx` component
- [ ] Create `DeploymentHistory.tsx` component
- [ ] Create `HealthMetrics.tsx` component
- [ ] Implement workflow visibility badges (PUBLIC/INTERNAL)
- [ ] Format deployment duration and status
- [ ] Create metric cards with icons

#### Components to Create

**1. WorkflowList.tsx**
- Lists all workflows in project
- Shows visibility (PUBLIC/INTERNAL)
- Displays endpoint path for public workflows
- Indicates sub-workflow calls
- Click to navigate to workflow canvas

**2. DeploymentHistory.tsx**
- Shows recent deployments (last 10)
- Displays version (git commit hash)
- Shows deployment status (success/failed/rolled-back)
- Displays duration and timestamp
- Optional: View logs button

**3. HealthMetrics.tsx**
- Real-time health status display
- Uptime chart (optional: simple sparkline)
- Response time trend
- Error rate indicator
- Last check timestamp

---

### Milestone 5: Routing Integration
**Date:** [YYYY-MM-DD]  
**Confidence:** 9/10  
**Status:** 🔵 Not Started  
**Time Spent:** [X hours]  

#### Activities
- [ ] Add routes to router configuration
- [ ] Implement `/projects` route for dashboard
- [ ] Implement `/project/:projectId` route for detail view
- [ ] Implement `/project/:projectId/settings` route
- [ ] Add navigation guards (check project exists)
- [ ] Handle browser back/forward buttons

#### Route Structure

```typescript
// src/renderer/App.tsx or router config
const routes = [
  {
    path: '/projects',
    component: ProjectDashboard,
  },
  {
    path: '/project/:projectId',
    component: ProjectDetailView,
  },
  {
    path: '/project/:projectId/settings',
    component: ProjectSettings,
  },
];
```

---

### Milestone 6: Testing & Polish
**Date:** [YYYY-MM-DD]  
**Confidence:** [X/10]  
**Status:** 🔵 Not Started  
**Time Spent:** [X hours]  

#### Test Results

**Unit Tests:**
- ProjectDashboard renders correctly
- Search filtering works
- Empty state displays
- ProjectCard shows correct metrics
- Health status colors correct

**Integration Tests:**
- Navigate to project detail view
- Create project from dashboard
- Search updates filtered list
- Health metrics update in real-time

**Manual Testing:**

| Test Scenario | Expected | Actual | Pass/Fail | Notes |
|---------------|----------|--------|-----------|-------|
| Create first project | Empty state → project card | | | |
| Search projects | Filtered results | | | |
| Click project card | Navigate to detail view | | | |
| Health status colors | Green/yellow/red display | | | |
| Responsive layout | Works on small screens | | | |

---

### Milestone 7: Human Review
**Date:** [YYYY-MM-DD]  
**Status:** 🔵 Not Started  

#### Human Review Checklist
- [ ] Dashboard UX intuitive and easy to navigate
- [ ] Information hierarchy clear
- [ ] Health metrics meaningful and accurate
- [ ] Performance acceptable with many projects
- [ ] Ready for Task 2.6.3 (Workflow Call Node)

---

## Final Summary

### Deliverables
- [ ] `ProjectDashboard.tsx` - Main dashboard
- [ ] `ProjectCard.tsx` - Project cards with metrics
- [ ] `ProjectDetailView.tsx` - Detailed project view
- [ ] `WorkflowList.tsx` - Workflow display
- [ ] `DeploymentHistory.tsx` - Deployment timeline
- [ ] `HealthMetrics.tsx` - Health indicators
- [ ] Route configuration
- [ ] Test coverage: [X%] (target: >85%)

### What Was Accomplished
[To be filled upon completion]

### Lessons Learned

**What Worked Well:**
- [To be filled]

**What Could Be Improved:**
- [To be filled]

---

## Appendix

### Key Files
- `src/renderer/components/ProjectDashboard/ProjectDashboard.tsx`
- `src/renderer/components/ProjectDashboard/ProjectCard.tsx`
- `src/renderer/components/ProjectDashboard/ProjectDetailView.tsx`
- `src/renderer/components/ProjectDashboard/WorkflowList.tsx`
- `src/renderer/components/ProjectDashboard/DeploymentHistory.tsx`
- `src/renderer/components/ProjectDashboard/HealthMetrics.tsx`

### Related Tasks
- Task 2.6.1: Project Management System (dependency)
- Task 2.6.5: Health Monitoring (provides real-time data)

---

**Task Status:** 🔵 Not Started  
**Ready for:** Task 2.6.3 (after completion)  
**Last Updated:** 2025-12-21
