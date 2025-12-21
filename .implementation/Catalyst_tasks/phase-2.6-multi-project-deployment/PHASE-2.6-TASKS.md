# Catalyst Phase 2.6: Multi-Project System & Deployment Management
## Project Grouping, Sub-Workflow Calls, and Production Monitoring

**Phase Duration:** 2-3 weeks  
**Goal:** Enable multiple workflows per project, sub-workflow calls, and deployment management  
**Dependencies:** Phase 2.5 (Developer Experience) must be complete

---

## Overview

Phase 2.6 transforms Catalyst from a single-workflow tool into a professional multi-project system that matches n8n's convenience while maintaining local development benefits.

**Key Features:**
- ✅ **Projects**: Group multiple workflows into deployable units
- ✅ **Sub-Workflow Calls**: Call workflows within the same project (no HTTP overhead)
- ✅ **Deployment Targets**: One project = one FastAPI app = one deployment
- ✅ **Project Dashboard**: Visual overview of all projects and their health
- ✅ **Git Integration**: Version control built-in
- ✅ **Deployment Monitoring**: Real-time status, logs, and metrics

**Why This Matters:**
n8n users group related workflows on the same server. Catalyst needs this capability, but better - with proper versioning, multiple deployment targets, and local development speed.

---

## Task 2.6.1: Project Management System

**Duration:** 2-3 days  
**Confidence:** 8/10  
**Priority:** CRITICAL - Foundation for everything else

### Problem Statement

Currently, Catalyst treats each workflow independently:
- No way to group related workflows
- Can't share code between workflows
- Each workflow would need separate deployment
- Can't call one workflow from another efficiently

### User Story

As a workflow builder, I want to:
1. Create a "project" that contains multiple workflows
2. Mark some workflows as "public" (HTTP endpoints)
3. Mark some workflows as "internal" (sub-routines)
4. Have all workflows in a project share secrets and configuration
5. Deploy the entire project as one unit

### Implementation Plan

#### Step 1: Update Manifest Schema

**File:** `src/core/project/types.ts`

```typescript
export interface CatalystProject {
  // Project metadata
  id: string;
  name: string;
  description: string;
  version: string;
  createdAt: string;
  updatedAt: string;
  
  // Git integration
  git?: {
    repoUrl: string;
    branch: string;
    lastCommit?: string;
    lastCommitAt?: string;
  };
  
  // Deployment targets
  deploymentTargets: Record<string, DeploymentTarget>;
  
  // Workflows in this project
  workflows: Record<string, WorkflowDefinition>;
  
  // Shared secrets (encrypted)
  secrets: Record<string, EncryptedSecret>;
  
  // Shared environment variables
  envVars: Record<string, string>;
  
  // Shared utility functions
  sharedFunctions?: Record<string, SharedFunction>;
}

export interface DeploymentTarget {
  id: string;
  name: string;
  platform: 'railway' | 'fly' | 'render' | 'cloud-run' | 'azure' | 'docker';
  
  // Deployment status
  status: 'not-deployed' | 'deploying' | 'deployed' | 'error' | 'stopped';
  lastDeployedAt?: string;
  deployedVersion?: string; // Git commit hash
  
  // Platform URLs
  url?: string; // Production URL
  webhookUrl?: string; // For deployment notifications
  
  // Platform-specific config
  platformConfig: {
    region?: string;
    instanceSize?: string;
    autoscaling?: {
      enabled: boolean;
      minInstances?: number;
      maxInstances?: number;
    };
  };
  
  // Health monitoring
  health?: {
    status: 'healthy' | 'degraded' | 'down';
    lastCheckAt: string;
    uptime?: number; // seconds
    responseTime?: number; // ms
    errorRate?: number; // percentage
  };
  
  // Deployment history
  deployments?: DeploymentHistory[];
}

export interface DeploymentHistory {
  id: string;
  version: string; // Git commit hash
  deployedAt: string;
  deployedBy?: string;
  status: 'success' | 'failed' | 'rolled-back';
  duration?: number; // seconds
  logs?: string;
  rollbackOf?: string; // ID of deployment this rolled back
}

export interface WorkflowDefinition {
  // ... existing fields
  
  // NEW: Deployment configuration
  deploymentTargetId: string; // Which target this workflow deploys to
  
  // NEW: Visibility
  visibility: 'public' | 'internal';
  // public = HTTP endpoint exposed
  // internal = only callable by other workflows
  
  // NEW: HTTP endpoint config (if public)
  endpoint?: {
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
    path: string; // e.g., "/api/process-user"
  };
}

export interface EncryptedSecret {
  name: string;
  value: string; // Encrypted with project key
  description?: string;
  updatedAt: string;
}

export interface SharedFunction {
  id: string;
  name: string;
  description: string;
  code: string; // Python function code
  language: 'python' | 'javascript';
}
```

#### Step 2: Create Project Store

**File:** `src/renderer/store/projectStore.ts`

```typescript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { CatalystProject, DeploymentTarget } from '@/core/project/types';

interface ProjectStore {
  // Projects
  projects: Record<string, CatalystProject>;
  activeProjectId: string | null;
  
  // CRUD operations
  createProject: (name: string, description: string) => string;
  deleteProject: (projectId: string) => void;
  updateProject: (projectId: string, updates: Partial<CatalystProject>) => void;
  setActiveProject: (projectId: string) => void;
  
  // Deployment targets
  addDeploymentTarget: (projectId: string, target: DeploymentTarget) => void;
  updateDeploymentTarget: (projectId: string, targetId: string, updates: Partial<DeploymentTarget>) => void;
  removeDeploymentTarget: (projectId: string, targetId: string) => void;
  
  // Workflow assignment
  assignWorkflowToTarget: (projectId: string, workflowId: string, targetId: string) => void;
  setWorkflowVisibility: (projectId: string, workflowId: string, visibility: 'public' | 'internal') => void;
  
  // Secrets management
  addSecret: (projectId: string, name: string, value: string) => void;
  updateSecret: (projectId: string, name: string, value: string) => void;
  deleteSecret: (projectId: string, name: string) => void;
  
  // Environment variables
  setEnvVar: (projectId: string, key: string, value: string) => void;
  deleteEnvVar: (projectId: string, key: string) => void;
}

export const useProjectStore = create<ProjectStore>()(
  persist(
    (set) => ({
      projects: {},
      activeProjectId: null,
      
      createProject: (name, description) => {
        const projectId = `project_${Date.now()}`;
        const project: CatalystProject = {
          id: projectId,
          name,
          description,
          version: '0.1.0',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          deploymentTargets: {
            // Create default local target
            local: {
              id: 'local',
              name: 'Local Development',
              platform: 'docker',
              status: 'not-deployed',
              platformConfig: {},
            },
          },
          workflows: {},
          secrets: {},
          envVars: {},
        };
        
        set((state) => ({
          projects: {
            ...state.projects,
            [projectId]: project,
          },
          activeProjectId: projectId,
        }));
        
        return projectId;
      },
      
      deleteProject: (projectId) => {
        set((state) => {
          const { [projectId]: _, ...remainingProjects } = state.projects;
          return {
            projects: remainingProjects,
            activeProjectId: state.activeProjectId === projectId 
              ? null 
              : state.activeProjectId,
          };
        });
      },
      
      updateProject: (projectId, updates) => {
        set((state) => ({
          projects: {
            ...state.projects,
            [projectId]: {
              ...state.projects[projectId],
              ...updates,
              updatedAt: new Date().toISOString(),
            },
          },
        }));
      },
      
      setActiveProject: (projectId) => {
        set({ activeProjectId: projectId });
      },
      
      addDeploymentTarget: (projectId, target) => {
        set((state) => ({
          projects: {
            ...state.projects,
            [projectId]: {
              ...state.projects[projectId],
              deploymentTargets: {
                ...state.projects[projectId].deploymentTargets,
                [target.id]: target,
              },
            },
          },
        }));
      },
      
      updateDeploymentTarget: (projectId, targetId, updates) => {
        set((state) => ({
          projects: {
            ...state.projects,
            [projectId]: {
              ...state.projects[projectId],
              deploymentTargets: {
                ...state.projects[projectId].deploymentTargets,
                [targetId]: {
                  ...state.projects[projectId].deploymentTargets[targetId],
                  ...updates,
                },
              },
            },
          },
        }));
      },
      
      assignWorkflowToTarget: (projectId, workflowId, targetId) => {
        set((state) => ({
          projects: {
            ...state.projects,
            [projectId]: {
              ...state.projects[projectId],
              workflows: {
                ...state.projects[projectId].workflows,
                [workflowId]: {
                  ...state.projects[projectId].workflows[workflowId],
                  deploymentTargetId: targetId,
                },
              },
            },
          },
        }));
      },
      
      setWorkflowVisibility: (projectId, workflowId, visibility) => {
        set((state) => ({
          projects: {
            ...state.projects,
            [projectId]: {
              ...state.projects[projectId],
              workflows: {
                ...state.projects[projectId].workflows,
                [workflowId]: {
                  ...state.projects[projectId].workflows[workflowId],
                  visibility,
                },
              },
            },
          },
        }));
      },
      
      addSecret: (projectId, name, value) => {
        // TODO: Encrypt value before storing
        set((state) => ({
          projects: {
            ...state.projects,
            [projectId]: {
              ...state.projects[projectId],
              secrets: {
                ...state.projects[projectId].secrets,
                [name]: {
                  name,
                  value, // Should be encrypted
                  updatedAt: new Date().toISOString(),
                },
              },
            },
          },
        }));
      },
      
      deleteSecret: (projectId, name) => {
        set((state) => {
          const { [name]: _, ...remainingSecrets } = state.projects[projectId].secrets;
          return {
            projects: {
              ...state.projects,
              [projectId]: {
                ...state.projects[projectId],
                secrets: remainingSecrets,
              },
            },
          };
        });
      },
      
      setEnvVar: (projectId, key, value) => {
        set((state) => ({
          projects: {
            ...state.projects,
            [projectId]: {
              ...state.projects[projectId],
              envVars: {
                ...state.projects[projectId].envVars,
                [key]: value,
              },
            },
          },
        }));
      },
      
      deleteEnvVar: (projectId, key) => {
        set((state) => {
          const { [key]: _, ...remainingVars } = state.projects[projectId].envVars;
          return {
            projects: {
              ...state.projects,
              [projectId]: {
                ...state.projects[projectId],
                envVars: remainingVars,
              },
            },
          };
        });
      },
    }),
    {
      name: 'catalyst-projects',
    }
  )
);
```

#### Step 3: Create Project Selector UI

**File:** `src/renderer/components/ProjectSelector/ProjectSelector.tsx`

```typescript
import React from 'react';
import { useProjectStore } from '@/renderer/store/projectStore';
import { ChevronDown, Plus, Settings } from 'lucide-react';

export function ProjectSelector() {
  const { projects, activeProjectId, setActiveProject, createProject } = useProjectStore();
  const [showDropdown, setShowDropdown] = React.useState(false);
  
  const activeProject = activeProjectId ? projects[activeProjectId] : null;
  
  const handleCreateProject = () => {
    const name = prompt('Project name:');
    if (!name) return;
    
    const description = prompt('Project description (optional):');
    createProject(name, description || '');
  };
  
  return (
    <div className="relative">
      {/* Current project display */}
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 
                   rounded-lg hover:bg-gray-50 transition-colors"
      >
        {activeProject ? (
          <>
            <div className="w-2 h-2 rounded-full bg-green-500" />
            <span className="font-medium">{activeProject.name}</span>
          </>
        ) : (
          <span className="text-gray-500">No project selected</span>
        )}
        <ChevronDown className="w-4 h-4 text-gray-400" />
      </button>
      
      {/* Dropdown menu */}
      {showDropdown && (
        <div className="absolute top-full left-0 mt-2 w-80 bg-white border border-gray-200 
                        rounded-lg shadow-lg z-50">
          <div className="p-2">
            <div className="text-xs font-semibold text-gray-500 uppercase px-3 py-2">
              Projects
            </div>
            
            {/* Project list */}
            <div className="space-y-1">
              {Object.values(projects).map((project) => (
                <button
                  key={project.id}
                  onClick={() => {
                    setActiveProject(project.id);
                    setShowDropdown(false);
                  }}
                  className={`
                    w-full flex items-center justify-between px-3 py-2 rounded
                    hover:bg-gray-100 transition-colors text-left
                    ${activeProjectId === project.id ? 'bg-blue-50' : ''}
                  `}
                >
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate">
                      {project.name}
                    </div>
                    <div className="text-xs text-gray-500 truncate">
                      {Object.keys(project.workflows).length} workflows
                    </div>
                  </div>
                  
                  {activeProjectId === project.id && (
                    <div className="w-2 h-2 rounded-full bg-blue-500" />
                  )}
                </button>
              ))}
            </div>
            
            {/* Create new project */}
            <div className="border-t border-gray-200 mt-2 pt-2">
              <button
                onClick={handleCreateProject}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm 
                           text-blue-600 hover:bg-blue-50 rounded transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>New Project</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
```

### Success Criteria

- [ ] Can create projects with name and description
- [ ] Can switch between projects
- [ ] Workflows belong to a project
- [ ] Deployment targets belong to a project
- [ ] Secrets scoped to project
- [ ] Environment variables scoped to project
- [ ] Project selector shows all projects

### Files to Create

- `src/core/project/types.ts`
- `src/renderer/store/projectStore.ts`
- `src/renderer/components/ProjectSelector/ProjectSelector.tsx`
- `tests/project-management.test.ts`

---

## Task 2.6.2: Project Dashboard UI

**Duration:** 3-4 days  
**Confidence:** 8/10  
**Priority:** CRITICAL - Main UX for project management

### Problem Statement

Users need a visual overview of:
- All their projects
- Deployment status for each project
- Health metrics (uptime, errors, response time)
- Recent deployments
- Git status

### User Story

As a workflow builder, I want to:
1. See all my projects at a glance
2. Know which are deployed and which aren't
3. See deployment health (green/yellow/red status)
4. Click a project to see detailed metrics
5. Quickly deploy or rollback

### Implementation Plan

#### Step 1: Create Project Dashboard Component

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
      {/* Header */}
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
        
        {/* Search */}
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
          <EmptyState onCreateProject={createProject} />
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

function EmptyState({ onCreateProject }: { onCreateProject: (name: string, desc: string) => void }) {
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

#### Step 2: Create Project Card Component

**File:** `src/renderer/components/ProjectDashboard/ProjectCard.tsx`

```typescript
import React from 'react';
import { CatalystProject, DeploymentTarget } from '@/core/project/types';
import { 
  CheckCircle, XCircle, AlertTriangle, Clock, 
  GitBranch, Calendar, Zap, Settings, ExternalLink 
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useRouter } from '@/renderer/hooks/useRouter';

interface ProjectCardProps {
  project: CatalystProject;
}

export function ProjectCard({ project }: ProjectCardProps) {
  const router = useRouter();
  
  // Get primary deployment target (first non-local)
  const primaryTarget = Object.values(project.deploymentTargets).find(
    (t) => t.platform !== 'docker'
  );
  
  const workflowCount = Object.keys(project.workflows).length;
  
  // Calculate overall health status
  const healthStatus = primaryTarget?.health?.status || 'unknown';
  
  const statusConfig = {
    healthy: {
      icon: <CheckCircle className="w-5 h-5" />,
      color: 'text-green-500',
      bg: 'bg-green-50',
      border: 'border-green-200',
    },
    degraded: {
      icon: <AlertTriangle className="w-5 h-5" />,
      color: 'text-yellow-500',
      bg: 'bg-yellow-50',
      border: 'border-yellow-200',
    },
    down: {
      icon: <XCircle className="w-5 h-5" />,
      color: 'text-red-500',
      bg: 'bg-red-50',
      border: 'border-red-200',
    },
    unknown: {
      icon: <Clock className="w-5 h-5" />,
      color: 'text-gray-400',
      bg: 'bg-gray-50',
      border: 'border-gray-200',
    },
  };
  
  const status = statusConfig[healthStatus] || statusConfig.unknown;
  
  return (
    <div
      className={`
        bg-white rounded-lg border-2 ${status.border}
        hover:shadow-lg transition-all cursor-pointer
        overflow-hidden
      `}
      onClick={() => router.push(`/project/${project.id}`)}
    >
      {/* Header */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-gray-900 truncate">
              {project.name}
            </h3>
            <p className="text-sm text-gray-500 mt-1 line-clamp-2">
              {project.description || 'No description'}
            </p>
          </div>
          
          {/* Status indicator */}
          <div className={`${status.bg} ${status.color} p-2 rounded-lg ml-3`}>
            {status.icon}
          </div>
        </div>
      </div>
      
      {/* Metrics */}
      <div className="p-4 grid grid-cols-2 gap-4">
        <MetricItem
          icon={<Zap className="w-4 h-4" />}
          label="Workflows"
          value={workflowCount.toString()}
        />
        
        <MetricItem
          icon={<CheckCircle className="w-4 h-4" />}
          label="Uptime"
          value={
            primaryTarget?.health?.uptime
              ? formatUptime(primaryTarget.health.uptime)
              : 'N/A'
          }
        />
        
        <MetricItem
          icon={<Clock className="w-4 h-4" />}
          label="Avg Response"
          value={
            primaryTarget?.health?.responseTime
              ? `${primaryTarget.health.responseTime}ms`
              : 'N/A'
          }
        />
        
        <MetricItem
          icon={<AlertTriangle className="w-4 h-4" />}
          label="Error Rate"
          value={
            primaryTarget?.health?.errorRate !== undefined
              ? `${primaryTarget.health.errorRate.toFixed(1)}%`
              : 'N/A'
          }
        />
      </div>
      
      {/* Deployment info */}
      <div className="p-4 bg-gray-50 border-t border-gray-100">
        {primaryTarget ? (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Platform</span>
              <span className="font-medium capitalize">{primaryTarget.platform}</span>
            </div>
            
            {primaryTarget.lastDeployedAt && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600 flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  Last Deployed
                </span>
                <span className="font-medium">
                  {formatDistanceToNow(new Date(primaryTarget.lastDeployedAt), {
                    addSuffix: true,
                  })}
                </span>
              </div>
            )}
            
            {project.git?.lastCommit && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600 flex items-center gap-1">
                  <GitBranch className="w-3 h-3" />
                  Version
                </span>
                <span className="font-mono text-xs">
                  {project.git.lastCommit.slice(0, 7)}
                </span>
              </div>
            )}
            
            {primaryTarget.url && (
              <a
                href={primaryTarget.url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
              >
                <span>View Live</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
        ) : (
          <div className="text-sm text-gray-500 text-center py-2">
            Not deployed
          </div>
        )}
      </div>
      
      {/* Actions */}
      <div className="p-3 border-t border-gray-100 flex gap-2">
        <button
          onClick={(e) => {
            e.stopPropagation();
            router.push(`/project/${project.id}`);
          }}
          className="flex-1 px-3 py-2 bg-blue-600 text-white rounded text-sm
                     hover:bg-blue-700 transition-colors"
        >
          Open Project
        </button>
        
        <button
          onClick={(e) => {
            e.stopPropagation();
            router.push(`/project/${project.id}/settings`);
          }}
          className="px-3 py-2 border border-gray-300 rounded hover:bg-gray-50
                     transition-colors"
        >
          <Settings className="w-4 h-4 text-gray-600" />
        </button>
      </div>
    </div>
  );
}

function MetricItem({ 
  icon, 
  label, 
  value 
}: { 
  icon: React.ReactNode; 
  label: string; 
  value: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <div className="text-gray-400">{icon}</div>
      <div className="flex-1 min-w-0">
        <div className="text-xs text-gray-500">{label}</div>
        <div className="font-semibold text-sm truncate">{value}</div>
      </div>
    </div>
  );
}

function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  
  if (days > 0) {
    return `${days}d ${hours}h`;
  } else if (hours > 0) {
    return `${hours}h`;
  } else {
    return `${Math.floor(seconds / 60)}m`;
  }
}
```

#### Step 3: Create Detailed Project View

**File:** `src/renderer/components/ProjectDashboard/ProjectDetailView.tsx`

```typescript
import React from 'react';
import { useParams } from 'react-router-dom';
import { useProjectStore } from '@/renderer/store/projectStore';
import { 
  ArrowLeft, GitBranch, Calendar, TrendingUp, 
  Activity, AlertCircle, RefreshCw, Settings,
  ExternalLink, Clock, Zap
} from 'lucide-react';
import { DeploymentHistory } from './DeploymentHistory';
import { WorkflowList } from './WorkflowList';
import { HealthMetrics } from './HealthMetrics';

export function ProjectDetailView() {
  const { projectId } = useParams<{ projectId: string }>();
  const { projects } = useProjectStore();
  
  const project = projectId ? projects[projectId] : null;
  
  if (!project) {
    return <div>Project not found</div>;
  }
  
  const primaryTarget = Object.values(project.deploymentTargets).find(
    (t) => t.platform !== 'docker'
  );
  
  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-6">
        <div className="flex items-center gap-4 mb-4">
          <button
            onClick={() => window.history.back()}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900">
              {project.name}
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              {project.description}
            </p>
          </div>
          
          <button
            onClick={() => {/* Deploy logic */}}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white
                       rounded-lg hover:bg-blue-700 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Deploy</span>
          </button>
          
          <button
            onClick={() => {/* Settings logic */}}
            className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <Settings className="w-5 h-5 text-gray-600" />
          </button>
        </div>
        
        {/* Quick stats */}
        <div className="grid grid-cols-4 gap-4">
          <StatCard
            icon={<Zap className="w-5 h-5 text-blue-500" />}
            label="Workflows"
            value={Object.keys(project.workflows).length.toString()}
          />
          
          <StatCard
            icon={<GitBranch className="w-5 h-5 text-purple-500" />}
            label="Version"
            value={project.git?.lastCommit?.slice(0, 7) || 'N/A'}
          />
          
          <StatCard
            icon={<Calendar className="w-5 h-5 text-green-500" />}
            label="Last Deploy"
            value={
              primaryTarget?.lastDeployedAt
                ? new Date(primaryTarget.lastDeployedAt).toLocaleDateString()
                : 'Never'
            }
          />
          
          <StatCard
            icon={<Activity className="w-5 h-5 text-orange-500" />}
            label="Status"
            value={primaryTarget?.status || 'Not deployed'}
            valueColor={
              primaryTarget?.status === 'deployed'
                ? 'text-green-600'
                : 'text-gray-600'
            }
          />
        </div>
      </div>
      
      {/* Content tabs */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-6 grid grid-cols-3 gap-6">
          {/* Left column: Workflows */}
          <div className="col-span-2 space-y-6">
            <WorkflowList project={project} />
            <DeploymentHistory project={project} />
          </div>
          
          {/* Right column: Health & Metrics */}
          <div className="space-y-6">
            <HealthMetrics project={project} />
            
            {primaryTarget?.url && (
              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <h3 className="font-semibold mb-3">Production URL</h3>
                <a
                  href={primaryTarget.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-blue-600 hover:text-blue-700
                             break-all"
                >
                  <span className="text-sm">{primaryTarget.url}</span>
                  <ExternalLink className="w-4 h-4 flex-shrink-0" />
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  valueColor = 'text-gray-900',
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  valueColor?: string;
}) {
  return (
    <div className="bg-gray-50 rounded-lg p-4">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-white rounded-lg">{icon}</div>
        <div className="flex-1 min-w-0">
          <div className="text-xs text-gray-500 uppercase">{label}</div>
          <div className={`font-semibold truncate ${valueColor}`}>
            {value}
          </div>
        </div>
      </div>
    </div>
  );
}
```

### Success Criteria

- [ ] Dashboard shows all projects in grid layout
- [ ] Each project card shows key metrics
- [ ] Health status indicated with colors (green/yellow/red)
- [ ] Can search/filter projects
- [ ] Click project to see detailed view
- [ ] Detailed view shows workflows, deployments, health metrics
- [ ] Production URL accessible
- [ ] Git commit information visible
- [ ] Last deployment timestamp shown

### Files to Create

- `src/renderer/components/ProjectDashboard/ProjectDashboard.tsx`
- `src/renderer/components/ProjectDashboard/ProjectCard.tsx`
- `src/renderer/components/ProjectDashboard/ProjectDetailView.tsx`
- `src/renderer/components/ProjectDashboard/DeploymentHistory.tsx`
- `src/renderer/components/ProjectDashboard/WorkflowList.tsx`
- `src/renderer/components/ProjectDashboard/HealthMetrics.tsx`

---

## Task 2.6.3: Workflow Call Node (Sub-Workflows)

**Duration:** 2-3 days  
**Confidence:** 8/10  
**Priority:** CRITICAL - Enables sub-workflow pattern

### Problem Statement

Users need to call other workflows from within a workflow. Two scenarios:
1. **Local calls**: Same project, no HTTP overhead
2. **HTTP calls**: Different project, via network

### User Story

As a workflow builder, I want to:
1. Add a "Call Workflow" node to my canvas
2. Select which workflow to call
3. Pass input data to it
4. Get the result back
5. Have it be fast if calling within same project

### Implementation Plan

#### Step 1: Add workflowCall to Registry

**File:** `src/core/workflow/nodes/registry.ts`

```typescript
workflowCall: {
  type: 'workflowCall',
  category: 'control',
  name: 'Call Workflow',
  description: 'Execute another workflow',
  icon: 'ArrowPath',
  color: 'green',
  configFields: [
    {
      path: 'targetWorkflowId',
      label: 'Workflow',
      type: 'select',
      required: true,
      options: [], // Populated dynamically from project workflows
      description: 'Which workflow to call',
    },
    {
      path: 'callType',
      label: 'Call Type',
      type: 'select',
      required: true,
      options: [
        { label: 'Local (same project)', value: 'local' },
        { label: 'HTTP (external)', value: 'http' },
      ],
      description: 'How to call the workflow',
    },
    {
      path: 'httpUrl',
      label: 'HTTP URL',
      type: 'text',
      required: false,
      placeholder: 'https://other-project.railway.app',
      description: 'URL for HTTP calls (only if call type is HTTP)',
    },
    {
      path: 'input',
      label: 'Input Data',
      type: 'textarea',
      required: false,
      placeholder: '{"userId": "{{input.userId}}", "action": "process"}',
      rows: 6,
      description: 'Data to pass to the called workflow',
    },
    {
      path: 'timeout',
      label: 'Timeout (seconds)',
      type: 'number',
      required: false,
      placeholder: '30',
      min: 1,
      max: 300,
      description: 'Maximum time to wait for response',
    },
  ],
},
```

#### Step 2: Create Workflow Call Generator

**File:** `src/core/codegen/python/node-generators/workflow-call.py.ts`

```typescript
import { NodeDefinition, WorkflowDefinition } from '@/core/workflow/types';

export function generateWorkflowCallNode(
  node: NodeDefinition,
  workflow: WorkflowDefinition,
  allWorkflows: Record<string, WorkflowDefinition>
): string {
  const config = node.config;
  const incomingEdge = workflow.edges.find(edge => edge.target === node.id);
  const parentNodeId = incomingEdge?.source;
  
  const targetWorkflow = allWorkflows[config.targetWorkflowId];
  
  if (!targetWorkflow) {
    throw new Error(`Target workflow not found: ${config.targetWorkflowId}`);
  }
  
  // Determine if local or HTTP call
  const isLocalCall = config.callType === 'local';
  
  if (isLocalCall) {
    // LOCAL CALL - Direct function call
    return generateLocalWorkflowCall(node, parentNodeId, targetWorkflow, config);
  } else {
    // HTTP CALL - Network request
    return generateHttpWorkflowCall(node, parentNodeId, config);
  }
}

function generateLocalWorkflowCall(
  node: NodeDefinition,
  parentNodeId: string | undefined,
  targetWorkflow: WorkflowDefinition,
  config: any
): string {
  // Convert workflow name to Python function name
  const functionName = `execute_${targetWorkflow.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
  
  return `
async def ${node.id}(context: ExecutionContext) -> Any:
    """${node.name} - Call Workflow (Local)"""
    from workflows.${targetWorkflow.name.toLowerCase().replace(/[^a-z0-9]/g, '_')} import ${functionName}
    
    # Get input
    ${parentNodeId ? `input_data = context.get_node_output("${parentNodeId}")` : 'input_data = context.trigger_data'}
    
    # Prepare input for called workflow
    ${config.input ? `
    workflow_input = ${this.compileExpression(config.input, 'input_data')}
    ` : 'workflow_input = input_data'}
    
    # Call workflow locally (no HTTP overhead!)
    # Share execution context for connection pooling
    result = await ${functionName}(
        trigger_data=workflow_input,
        parent_context=context  # Share context for efficiency
    )
    
    output = {
        "result": result,
        "workflow": "${targetWorkflow.name}",
        "call_type": "local",
    }
    
    context.set_node_output(
        "${node.id}",
        output,
        parent_node_id="${parentNodeId || ''}",
        passthrough=${config._passthrough || false}
    )
    
    return output
`;
}

function generateHttpWorkflowCall(
  node: NodeDefinition,
  parentNodeId: string | undefined,
  config: any
): string {
  return `
async def ${node.id}(context: ExecutionContext) -> Any:
    """${node.name} - Call Workflow (HTTP)"""
    import httpx
    
    # Get input
    ${parentNodeId ? `input_data = context.get_node_output("${parentNodeId}")` : 'input_data = context.trigger_data'}
    
    # Prepare input
    ${config.input ? `
    workflow_input = ${this.compileExpression(config.input, 'input_data')}
    ` : 'workflow_input = input_data'}
    
    # Make HTTP request to external workflow
    url = "${config.httpUrl}"
    
    try:
        response = await context.http.post(
            url,
            json=workflow_input,
            timeout=${config.timeout || 30},
        )
        response.raise_for_status()
        
        result = response.json()
        
        output = {
            "result": result,
            "call_type": "http",
            "status_code": response.status_code,
        }
    except httpx.TimeoutException:
        raise Exception(f"Workflow call timed out after ${config.timeout || 30}s")
    except httpx.HTTPStatusError as e:
        raise Exception(f"Workflow call failed: {e.response.status_code} - {e.response.text}")
    
    context.set_node_output(
        "${node.id}",
        output,
        parent_node_id="${parentNodeId || ''}",
        passthrough=${config._passthrough || false}
    )
    
    return output
`;
}

private compileExpression(expr: string, contextVar: string): string {
  // Same as before - compile template expressions
  let compiled = expr;
  
  compiled = compiled.replace(
    /\{\{input\.(\w+)\}\}/g,
    `${contextVar}.get("$1")`
  );
  
  compiled = compiled.replace(
    /\{\{output\.(\w+)\.(\w+)\}\}/g,
    'context.get_node_output("$1").get("$2")'
  );
  
  return compiled;
}
```

#### Step 3: Update Workflow Module Generation

Each workflow needs to be callable as a function:

**File:** `src/core/codegen/python/WorkflowModuleGenerator.ts`

```typescript
export class WorkflowModuleGenerator {
  generateWorkflowModule(
    workflow: WorkflowDefinition,
    project: CatalystProject
  ): string {
    const functionName = `execute_${workflow.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
    
    return `
"""
Workflow: ${workflow.name}
${workflow.description || ''}

Generated by Catalyst
"""

from typing import Any, Optional
from runtime.context import ExecutionContext

${this.generateNodeFunctions(workflow)}

async def ${functionName}(
    trigger_data: Any,
    parent_context: Optional[ExecutionContext] = None
) -> Any:
    """
    Execute workflow: ${workflow.name}
    
    Args:
        trigger_data: Input data for the workflow
        parent_context: Optional parent execution context (for sub-workflow calls)
    
    Returns:
        Workflow result
    """
    # Create or reuse execution context
    if parent_context:
        # Sub-workflow: share parent context for connection pooling
        context = parent_context.create_child_context(trigger_data)
    else:
        # Top-level workflow: create new context
        context = ExecutionContext(trigger_data)
    
    # Execute nodes in order
    ${this.generateNodeExecutionOrder(workflow)}
    
    # Return final output
    return context.get_final_output()

${workflow.visibility === 'public' ? this.generateHttpRoute(workflow, functionName) : ''}
`;
  }
  
  private generateHttpRoute(workflow: WorkflowDefinition, functionName: string): string {
    if (!workflow.endpoint) return '';
    
    return `
# HTTP endpoint (public workflow)
from fastapi import APIRouter, Request

router = APIRouter()

@router.${workflow.endpoint.method.toLowerCase()}("${workflow.endpoint.path}")
async def ${workflow.name.toLowerCase()}_endpoint(request: Request):
    """HTTP endpoint for ${workflow.name}"""
    
    if request.method == "GET":
        trigger_data = dict(request.query_params)
    else:
        trigger_data = await request.json()
    
    result = await ${functionName}(trigger_data)
    
    return result
`;
  }
}
```

### Success Criteria

- [ ] workflowCall node appears in palette
- [ ] Can select target workflow from dropdown
- [ ] Local calls execute without HTTP overhead
- [ ] HTTP calls work to external projects
- [ ] Timeout handling works
- [ ] Error messages clear
- [ ] Can pass input data with template expressions

### Files to Create

- `src/core/codegen/python/node-generators/workflow-call.py.ts`
- `src/core/codegen/python/WorkflowModuleGenerator.ts`
- `tests/workflow-call.test.ts`

---

## Task 2.6.4: Project-Based Code Generation

**Duration:** 3-4 days  
**Confidence:** 7/10  
**Priority:** CRITICAL - Changes entire code generation architecture

### Problem Statement

Currently, WorkflowOrchestrator generates code for **one workflow**.  
New requirement: Generate code for **entire project** (multiple workflows).

### Implementation Plan

#### Step 1: Create ProjectOrchestrator

**File:** `src/core/codegen/python/ProjectOrchestrator.ts`

```typescript
import { CatalystProject, DeploymentTarget } from '@/core/project/types';
import { WorkflowModuleGenerator } from './WorkflowModuleGenerator';
import { DependencyCollector } from './DependencyCollector';

export class ProjectOrchestrator {
  private project: CatalystProject;
  
  constructor(project: CatalystProject) {
    this.project = project;
  }
  
  /**
   * Generate complete project for a deployment target
   */
  generateForTarget(targetId: string): GeneratedProject {
    const target = this.project.deploymentTargets[targetId];
    if (!target) {
      throw new Error(`Deployment target not found: ${targetId}`);
    }
    
    // Get workflows for this target
    const workflows = Object.values(this.project.workflows).filter(
      (w) => w.deploymentTargetId === targetId
    );
    
    if (workflows.length === 0) {
      throw new Error(`No workflows assigned to target: ${target.name}`);
    }
    
    // Generate files
    return {
      'main.py': this.generateMainPy(workflows, target),
      'requirements.txt': this.generateRequirements(workflows),
      'Dockerfile': this.generateDockerfile(target),
      '.env.example': this.generateEnvExample(),
      'workflows/': this.generateWorkflowModules(workflows),
      'runtime/': this.generateRuntimeHelpers(),
      
      // Platform-specific configs
      ...(target.platform === 'railway' && {
        'railway.json': this.generateRailwayConfig(),
      }),
      ...(target.platform === 'fly' && {
        'fly.toml': this.generateFlyConfig(target),
      }),
      ...(target.platform === 'render' && {
        'render.yaml': this.generateRenderConfig(),
      }),
    };
  }
  
  /**
   * Generate main.py with all workflows
   */
  private generateMainPy(
    workflows: WorkflowDefinition[],
    target: DeploymentTarget
  ): string {
    const publicWorkflows = workflows.filter((w) => w.visibility === 'public');
    
    return `
"""
${this.project.name}
Generated by Catalyst

Deployment Target: ${target.name}
Platform: ${target.platform}
Workflows: ${workflows.map((w) => w.name).join(', ')}
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvloop

# Install uvloop for better performance
uvloop.install()

# Create FastAPI app
app = FastAPI(
    title="${this.project.name}",
    description="${this.project.description}",
    version="${this.project.version}",
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Import and mount workflow routers
${publicWorkflows.map((w) => `
from workflows.${w.name.toLowerCase().replace(/[^a-z0-9]/g, '_')} import router as ${w.name.toLowerCase()}_router
app.include_router(${w.name.toLowerCase()}_router)
`).join('')}

# Health check endpoint
@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "project": "${this.project.name}",
        "version": "${this.project.version}",
        "workflows": [${publicWorkflows.map((w) => `"${w.name}"`).join(', ')}],
    }

# Root endpoint
@app.get("/")
async def root():
    return {
        "message": "Welcome to ${this.project.name}",
        "workflows": [${publicWorkflows.map((w) => `"${w.endpoint?.path}"`).join(', ')}],
    }
`;
  }
  
  /**
   * Generate requirements.txt
   */
  private generateRequirements(workflows: WorkflowDefinition[]): string {
    const collector = new DependencyCollector();
    
    // Collect dependencies from all workflows
    for (const workflow of workflows) {
      for (const node of Object.values(workflow.nodes)) {
        collector.collectFromNode(node);
      }
    }
    
    // Base dependencies
    const baseDeps = [
      'fastapi>=0.104.0',
      'uvicorn[standard]>=0.24.0',
      'uvloop>=0.19.0',
      'httpx>=0.25.0',
      'orjson>=3.9.0',
      'python-dotenv>=1.0.0',
    ];
    
    const allDeps = [...baseDeps, ...collector.getRequirements()];
    
    return allDeps.join('\n') + '\n';
  }
  
  /**
   * Generate Dockerfile
   */
  private generateDockerfile(target: DeploymentTarget): string {
    return `
# Optimized Dockerfile for ${target.platform}
FROM python:3.11-slim

WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Expose port
ENV PORT=8080
EXPOSE $PORT

# Run with uvicorn
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "$PORT"]
`;
  }
  
  /**
   * Generate .env.example
   */
  private generateEnvExample(): string {
    const envVars = Object.keys(this.project.envVars);
    const secrets = Object.keys(this.project.secrets);
    
    let content = '# Environment Variables\n\n';
    
    if (envVars.length > 0) {
      content += '# Project Variables\n';
      for (const key of envVars) {
        content += `${key}=${this.project.envVars[key]}\n`;
      }
      content += '\n';
    }
    
    if (secrets.length > 0) {
      content += '# Secrets (set these in your deployment platform)\n';
      for (const key of secrets) {
        content += `${key}=your_${key.toLowerCase()}_here\n`;
      }
    }
    
    return content;
  }
  
  /**
   * Generate workflow modules
   */
  private generateWorkflowModules(
    workflows: WorkflowDefinition[]
  ): Record<string, string> {
    const modules: Record<string, string> = {};
    const generator = new WorkflowModuleGenerator();
    
    for (const workflow of workflows) {
      const moduleName = workflow.name.toLowerCase().replace(/[^a-z0-9]/g, '_');
      modules[`${moduleName}.py`] = generator.generateWorkflowModule(
        workflow,
        this.project
      );
    }
    
    // Add __init__.py
    modules['__init__.py'] = '# Workflow modules\n';
    
    return modules;
  }
  
  /**
   * Generate runtime helper modules
   */
  private generateRuntimeHelpers(): Record<string, string> {
    return {
      '__init__.py': '',
      'context.py': this.generateExecutionContext(),
      'connections.py': this.generateConnectionManager(),
    };
  }
  
  // ... platform-specific config generators
}

interface GeneratedProject {
  [path: string]: string | Record<string, string>;
}
```

### Success Criteria

- [ ] Generates one FastAPI app per deployment target
- [ ] All workflows in target included as modules
- [ ] Public workflows exposed as HTTP endpoints
- [ ] Internal workflows not exposed
- [ ] Shared code generated in runtime/
- [ ] Requirements.txt includes all dependencies
- [ ] Dockerfile optimized for platform
- [ ] Platform configs generated correctly

### Files to Create

- `src/core/codegen/python/ProjectOrchestrator.ts`
- `tests/project-orchestrator.test.ts`

---

## Task 2.6.5: Deployment Health Monitoring

**Duration:** 2-3 days  
**Confidence:** 7/10  
**Priority:** MEDIUM - Nice to have

### Problem Statement

Users need to know if their deployed workflows are:
- Running or down
- Responding quickly or slowly
- Throwing errors or working fine

### Implementation Plan

#### Step 1: Add Health Check Endpoint to Generated Code

Already included in ProjectOrchestrator `main.py`:

```python
@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "uptime": get_uptime(),
        "version": "${project.version}",
    }
```

#### Step 2: Create Health Monitor Service

**File:** `electron/health-monitor.ts`

```typescript
import axios from 'axios';
import { useProjectStore } from '@/renderer/store/projectStore';

export class HealthMonitor {
  private intervals = new Map<string, NodeJS.Timeout>();
  
  /**
   * Start monitoring a deployment target
   */
  startMonitoring(projectId: string, targetId: string, url: string) {
    const key = `${projectId}:${targetId}`;
    
    // Stop existing monitor if any
    this.stopMonitoring(key);
    
    // Check every 60 seconds
    const interval = setInterval(() => {
      this.checkHealth(projectId, targetId, url);
    }, 60000);
    
    this.intervals.set(key, interval);
    
    // Check immediately
    this.checkHealth(projectId, targetId, url);
  }
  
  /**
   * Stop monitoring
   */
  stopMonitoring(key: string) {
    const interval = this.intervals.get(key);
    if (interval) {
      clearInterval(interval);
      this.intervals.delete(key);
    }
  }
  
  /**
   * Check health of deployment
   */
  private async checkHealth(projectId: string, targetId: string, url: string) {
    const startTime = Date.now();
    
    try {
      const response = await axios.get(`${url}/health`, {
        timeout: 5000,
      });
      
      const responseTime = Date.now() - startTime;
      
      // Update project store
      useProjectStore.getState().updateDeploymentTarget(projectId, targetId, {
        health: {
          status: 'healthy',
          lastCheckAt: new Date().toISOString(),
          responseTime,
          uptime: response.data.uptime,
          errorRate: 0,
        },
      });
    } catch (error) {
      // Update as down
      useProjectStore.getState().updateDeploymentTarget(projectId, targetId, {
        health: {
          status: 'down',
          lastCheckAt: new Date().toISOString(),
          responseTime: undefined,
          uptime: undefined,
          errorRate: 100,
        },
      });
    }
  }
  
  /**
   * Stop all monitoring
   */
  stopAll() {
    for (const interval of this.intervals.values()) {
      clearInterval(interval);
    }
    this.intervals.clear();
  }
}

export const healthMonitor = new HealthMonitor();
```

#### Step 3: Auto-Start Monitoring on App Launch

**File:** `electron/main.ts`

```typescript
import { healthMonitor } from './health-monitor';

app.on('ready', () => {
  // ... other setup
  
  // Start monitoring all deployed projects
  const projects = loadProjects();
  for (const project of Object.values(projects)) {
    for (const target of Object.values(project.deploymentTargets)) {
      if (target.status === 'deployed' && target.url) {
        healthMonitor.startMonitoring(project.id, target.id, target.url);
      }
    }
  }
});

app.on('quit', () => {
  healthMonitor.stopAll();
});
```

### Success Criteria

- [ ] Health checks run every 60 seconds
- [ ] Response time measured
- [ ] Status updates in project store
- [ ] Dashboard shows real-time status
- [ ] Monitoring starts on app launch
- [ ] Monitoring stops on app quit

---

## Phase 2.6 Deliverables Summary

| Task | Deliverable | Duration | Priority |
|------|-------------|----------|----------|
| 2.6.1 | Project Management System | 2-3 days | CRITICAL |
| 2.6.2 | Project Dashboard UI | 3-4 days | CRITICAL |
| 2.6.3 | Workflow Call Node | 2-3 days | CRITICAL |
| 2.6.4 | Project-Based Code Generation | 3-4 days | CRITICAL |
| 2.6.5 | Deployment Health Monitoring | 2-3 days | MEDIUM |

**Total Phase 2.6 Duration:** ~12-17 days (2-3 weeks)

---

## UI/UX Mockups

### Project Dashboard

```
┌────────────────────────────────────────────────────────────────────┐
│ Projects                                   [Search...] [+ New]      │
├────────────────────────────────────────────────────────────────────┤
│                                                                     │
│ ┌────────────────────┐  ┌────────────────────┐  ┌─────────────────┐│
│ │ 📦 visualhive-prod │  │ 📦 staging-tests   │  │ 📦 shared-utils ││
│ │ ● Healthy          │  │ ● Degraded         │  │ ● Down          ││
│ │                    │  │                    │  │                 ││
│ │ 🔧 5 workflows     │  │ 🔧 2 workflows     │  │ 🔧 3 workflows  ││
│ │ ⏱ 99.9% uptime    │  │ ⏱ 87.2% uptime    │  │ ⏱ 0% uptime    ││
│ │ ⚡ 45ms avg        │  │ ⚡ 230ms avg       │  │ ⚡ N/A          ││
│ │ 📊 0.2% errors     │  │ 📊 5.1% errors     │  │ 📊 100% errors  ││
│ │                    │  │                    │  │                 ││
│ │ Railway            │  │ Fly.io             │  │ Railway         ││
│ │ v1.2.3 (2h ago)    │  │ v0.9.1 (1d ago)    │  │ v0.5.0 (1w ago) ││
│ │                    │  │                    │  │                 ││
│ │ [Open] [Settings]  │  │ [Open] [Settings]  │  │ [Open] [Deploy] ││
│ └────────────────────┘  └────────────────────┘  └─────────────────┘│
│                                                                     │
└────────────────────────────────────────────────────────────────────┘
```

### Project Detail View

```
┌────────────────────────────────────────────────────────────────────┐
│ ← visualhive-production                         [Deploy] [Settings]│
├────────────────────────────────────────────────────────────────────┤
│ [5 Workflows] [v1.2.3] [Deployed 2h ago] [● Healthy]               │
├───────────────────────────────────────┬────────────────────────────┤
│                                       │                            │
│ Workflows                             │ Health Metrics             │
│                                       │                            │
│ ✓ conference-search (PUBLIC)          │ ● Status: Healthy          │
│   POST /api/conference-search         │ ⏱ Uptime: 99.9%           │
│   └─ Calls: extract-dates (LOCAL)    │ ⚡ Avg Response: 45ms      │
│   └─ Calls: search-vectors (LOCAL)   │ 📊 Error Rate: 0.2%        │
│                                       │                            │
│ ✓ user-matching (PUBLIC)              │ Last Checked: 30s ago      │
│   POST /api/user-matching             │                            │
│                                       │ ────────────────────────   │
│ ○ extract-dates (INTERNAL)            │                            │
│ ○ search-vectors (INTERNAL)           │ Production URL:            │
│ ○ format-results (INTERNAL)           │ https://vh-prod.rw.app    │
│                                       │ [Visit] [Copy]             │
│ ────────────────────────────────      │                            │
│                                       │ ────────────────────────   │
│ Recent Deployments                    │                            │
│                                       │ Git:                       │
│ ✓ v1.2.3 - 2h ago (abc1234)          │ main @ abc1234            │
│   Duration: 45s                       │ [View on GitHub]           │
│                                       │                            │
│ ✓ v1.2.2 - 1d ago (def5678)          │                            │
│   Duration: 52s                       │                            │
│                                       │                            │
│ ✗ v1.2.1 - 2d ago (ghi9012)          │                            │
│   Failed: Build error                 │                            │
│                                       │                            │
└───────────────────────────────────────┴────────────────────────────┘
```

---

## Testing Strategy

### Manual Testing

1. **Create multi-workflow project:**
   - Create project "test-project"
   - Add 3 workflows: main, sub1, sub2
   - Set main as PUBLIC, sub1/sub2 as INTERNAL
   - Add workflow_call nodes

2. **Deploy project:**
   - Generate code
   - Verify one FastAPI app created
   - Verify all workflows in workflows/ directory
   - Verify main.py includes all routers
   - Deploy to Railway

3. **Test sub-workflow calls:**
   - Call main workflow via HTTP
   - Verify it calls sub1 locally (no HTTP)
   - Check execution logs
   - Measure response time

4. **Monitor health:**
   - Wait 60 seconds
   - Verify health check runs
   - Check dashboard shows status
   - Stop deployment
   - Verify dashboard shows "down"

### Integration Tests

```typescript
describe('Multi-Project System', () => {
  it('should create project with workflows', () => {});
  it('should assign workflows to deployment targets', () => {});
  it('should generate one app per target', () => {});
  it('should include all workflows in app', () => {});
  it('should expose public workflows as endpoints', () => {});
  it('should not expose internal workflows', () => {});
  it('should generate workflow_call code correctly', () => {});
});
```

---

## Human Review Checkpoint

**After completing Phase 2.6:**

Review focus:
- Project management intuitive
- Dashboard shows accurate health metrics
- Sub-workflow calls working efficiently
- Code generation produces working apps
- Deployment to Railway/Fly.io successful

**Ready for Phase 3:** Data Integration (Qdrant, PostgreSQL, etc.)

---

**Previous Phase:** [CATALYST_PHASE_2.5_TASKS.md](./CATALYST_PHASE_2.5_TASKS.md) - Developer Experience  
**Next Phase:** [CATALYST_PHASE_3_TASKS.md](./CATALYST_PHASE_3_TASKS.md) - Data Integration