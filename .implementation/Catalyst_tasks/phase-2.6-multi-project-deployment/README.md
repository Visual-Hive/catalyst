# Phase 2.6: Multi-Project System & Deployment Management

**Duration:** 2-3 weeks  
**Status:** 🔵 Not Started  
**Started:** [YYYY-MM-DD]  
**Completed:** [YYYY-MM-DD]  

---

## Phase Overview

Phase 2.6 transforms Catalyst from a single-workflow tool into a professional multi-project system that matches n8n's convenience while maintaining local development benefits.

### Key Capabilities

✅ **Projects**: Group multiple workflows into deployable units  
✅ **Sub-Workflow Calls**: Call workflows within the same project (no HTTP overhead)  
✅ **Deployment Targets**: One project = one FastAPI app = one deployment  
✅ **Project Dashboard**: Visual overview of all projects and their health  
✅ **Git Integration**: Version control built-in  
✅ **Deployment Monitoring**: Real-time status, logs, and metrics  

### Why This Matters

n8n users group related workflows on the same server. Catalyst needs this capability, but better - with proper versioning, multiple deployment targets, and local development speed.

---

## Tasks

### Task 2.6.1: Project Management System ⚡ CRITICAL
**Duration:** 2-3 days | **Status:** 🔵 Not Started

Foundation for everything else. Creates project data structures, Zustand store, deployment targets, and secrets management.

**Key Deliverables:**
- `src/core/project/types.ts` - Project, DeploymentTarget, WorkflowDefinition types
- `src/renderer/store/projectStore.ts` - Zustand store for project management
- `src/renderer/components/ProjectSelector/` - Project selector UI component
- Project CRUD operations
- Deployment target management
- Secrets encryption and storage

[→ Full Task Documentation](./task-2.6.1-project-management.md)

---

### Task 2.6.2: Project Dashboard UI ⚡ CRITICAL
**Duration:** 3-4 days | **Status:** 🔵 Not Started

Main UX for project management. Visual dashboard showing all projects with health metrics, deployment status, and detailed project views.

**Key Deliverables:**
- `src/renderer/components/ProjectDashboard/ProjectDashboard.tsx` - Main dashboard
- `src/renderer/components/ProjectDashboard/ProjectCard.tsx` - Project cards with metrics
- `src/renderer/components/ProjectDashboard/ProjectDetailView.tsx` - Detailed project view
- Health status indicators (green/yellow/red)
- Deployment history
- Git integration display

[→ Full Task Documentation](./task-2.6.2-project-dashboard.md)

---

### Task 2.6.3: Workflow Call Node (Sub-Workflows) ⚡ CRITICAL
**Duration:** 2-3 days | **Status:** 🔵 Not Started

Enables calling workflows from within other workflows. Supports both local calls (same project, no HTTP) and HTTP calls (different projects).

**Key Deliverables:**
- `workflowCall` node in registry
- `src/core/codegen/python/node-generators/workflow-call.py.ts` - Code generator
- Local call support (direct function calls)
- HTTP call support (network requests)
- Template expression support for input data
- Timeout and error handling

[→ Full Task Documentation](./task-2.6.3-workflow-call-node.md)

---

### Task 2.6.4: Project-Based Code Generation ⚡ CRITICAL
**Duration:** 3-4 days | **Status:** 🔵 Not Started

Major architectural change. Generates code for entire projects (multiple workflows) instead of single workflows. One project = one FastAPI app.

**Key Deliverables:**
- `src/core/codegen/python/ProjectOrchestrator.ts` - Project-level orchestrator
- `src/core/codegen/python/WorkflowModuleGenerator.ts` - Workflow module generator
- Multi-workflow FastAPI app generation
- Platform-specific configs (Railway, Fly.io, Render, Cloud Run)
- Dockerfile and requirements.txt generation
- Shared code and utilities

[→ Full Task Documentation](./task-2.6.4-project-code-generation.md)

---

### Task 2.6.5: Deployment Health Monitoring 🟢 MEDIUM
**Duration:** 2-3 days | **Status:** 🔵 Not Started

Real-time monitoring of deployed projects. Tracks uptime, response time, error rates, and deployment status.

**Key Deliverables:**
- `electron/health-monitor.ts` - Health monitoring service
- Health check endpoints in generated code
- Auto-monitoring on app launch
- Real-time dashboard updates
- Status indicators (healthy/degraded/down)

[→ Full Task Documentation](./task-2.6.5-health-monitoring.md)

---

## Phase Dependencies

**Required Before Starting:**
- ✅ Phase 2: LLM Integration (complete)
- ✅ Phase 2.5: Developer Experience (complete)

**Enables:**
- Phase 3: Data Integration (Qdrant, PostgreSQL, etc.)
- Phase 4: Advanced Features

---

## Architecture Changes

### Before Phase 2.6
```
Workflow 1 → Generate Code → Deploy Separately
Workflow 2 → Generate Code → Deploy Separately
Workflow 3 → Generate Code → Deploy Separately
```

### After Phase 2.6
```
Project {
  Workflow 1 (public)
  Workflow 2 (internal)
  Workflow 3 (internal)
} → Generate Single FastAPI App → Deploy Once
```

**Benefits:**
- Workflows can call each other locally (no HTTP overhead)
- Shared secrets and environment variables
- Single deployment per project
- Better organization and management
- Version control at project level

---

## Success Criteria

### Functional Requirements
- [ ] Can create and manage projects
- [ ] Can assign workflows to projects
- [ ] Can set workflow visibility (public/internal)
- [ ] Sub-workflow calls work locally and via HTTP
- [ ] Project generates single FastAPI app
- [ ] Can deploy to Railway, Fly.io, Render
- [ ] Dashboard shows all projects with metrics
- [ ] Health monitoring tracks deployment status
- [ ] Git integration tracks versions

### Technical Requirements
- [ ] Project data stored in Zustand
- [ ] Secrets encrypted properly
- [ ] Code generation produces working FastAPI apps
- [ ] Health checks run every 60 seconds
- [ ] Platform configs generated correctly
- [ ] Test coverage >85% for new code

### User Experience
- [ ] Project selector intuitive
- [ ] Dashboard clear and informative
- [ ] Health status immediately visible
- [ ] Deployment process straightforward
- [ ] Sub-workflow setup simple

---

## Testing Strategy

### Unit Tests
- Project store operations
- Code generation functions
- Health monitoring logic
- Type validation

### Integration Tests
- Create project → Add workflows → Generate code
- Local workflow calls
- HTTP workflow calls
- Deployment target assignment
- Health check integration

### Manual Testing
- Full project lifecycle
- Deploy to Railway
- Deploy to Fly.io
- Test sub-workflow calls
- Verify health monitoring
- Check dashboard accuracy

---

## Risk Assessment

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| Breaking change to code generation | High | Medium | Maintain backward compatibility, versioned schemas |
| Secrets encryption complexity | High | Low | Use system keychain, follow security best practices |
| Platform-specific deployment issues | Medium | Medium | Test on all target platforms, provide clear error messages |
| Health monitoring overhead | Low | Low | Lightweight checks, configurable intervals |
| Dashboard performance with many projects | Medium | Low | Virtual scrolling, pagination, lazy loading |

---

## Documentation Updates

After completing Phase 2.6, update:
- [ ] `docs/Catalyst documentation/CATALYST_SPECIFICATION.md` - Project management
- [ ] `docs/Catalyst documentation/CATALYST_PHASE_2_TASKS.md` - Mark Phase 2.6 complete
- [ ] `docs/Catalyst documentation/CATALYST_PHASE_3_TASKS.md` - Update dependencies
- [ ] User guides for project creation and deployment
- [ ] API documentation for new IPC handlers

---

## Timeline

```
Week 1:
- Task 2.6.1: Project Management System (2-3 days)
- Task 2.6.2: Project Dashboard UI (start)

Week 2:
- Task 2.6.2: Project Dashboard UI (complete)
- Task 2.6.3: Workflow Call Node (2-3 days)

Week 3:
- Task 2.6.4: Project-Based Code Generation (3-4 days)
- Task 2.6.5: Health Monitoring (2-3 days)
- Final testing and integration
```

---

## Human Review Checkpoints

### After Task 2.6.1
- Project data structure appropriate?
- Secrets management secure?
- Store patterns clean?

### After Task 2.6.2
- Dashboard UX intuitive?
- Information hierarchy clear?
- Performance acceptable?

### After Task 2.6.4
- Generated code quality good?
- Platform configs correct?
- Ready for production deployment?

### Phase Complete
- All tasks tested and documented
- Ready for Phase 3

---

**Phase Status:** 🔵 Not Started  
**Next Phase:** [Phase 3: Data Integration](../phase-3-data-integration/)  
**Last Updated:** 2025-12-21
