# Task 2.6.4: Project-Based Code Generation

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
Transform the code generation architecture from generating single workflows to generating entire projects with multiple workflows. This is a major architectural change that enables the multi-project system.

Currently: `WorkflowOrchestrator` generates code for ONE workflow.  
New: `ProjectOrchestrator` generates code for an ENTIRE PROJECT (multiple workflows as one FastAPI app).

### Success Criteria
- [ ] `ProjectOrchestrator` class implemented
- [ ] Generates one FastAPI app per deployment target
- [ ] All workflows in target included as modules
- [ ] Public workflows exposed as HTTP endpoints
- [ ] Internal workflows not exposed (only callable)
- [ ] Shared code generated in runtime/ directory
- [ ] Requirements.txt includes all dependencies
- [ ] Dockerfile optimized for target platform
- [ ] Platform-specific configs generated (Railway, Fly.io, Render, Cloud Run)
- [ ] Test coverage >85%
- [ ] Human review completed

### References
- PHASE-2.6-TASKS.md - Task 2.6.4 details
- Task 2.6.1 - Uses project types
- Task 2.6.3 - Integrates workflow calls
- .clinerules/implementation-standards.md

### Dependencies
- Task 2.6.1: Project Management System (MUST be complete)
- Task 2.6.3: Workflow Call Node (for sub-workflows)
- Python code generation infrastructure

---

## Milestones

### Milestone 1: Design Project Orchestrator Architecture
**Date:** [YYYY-MM-DD]  
**Confidence:** 7/10  
**Status:** 🔵 Not Started  
**Time Spent:** [X hours]  

#### Activities
- [ ] Design `ProjectOrchestrator` class structure
- [ ] Plan file generation strategy
- [ ] Design workflow module organization
- [ ] Plan dependency collection
- [ ] Design platform-specific config generation

#### Design Decisions

| Decision | Options Considered | Choice Made | Rationale | Confidence |
|----------|-------------------|-------------|-----------|------------|
| Entry point | One file, multiple files | One main.py | Standard FastAPI pattern | 9/10 |
| Workflow organization | Flat structure, nested modules | workflows/ directory with modules | Clear organization, easy imports | 9/10 |
| Dependency management | Manual, automatic collection | Automatic from nodes | Reduces errors, DRY | 8/10 |
| Platform configs | Hardcoded, templated | Templated with platform-specific logic | Flexible, maintainable | 8/10 |

#### Architecture Overview

```
generated-project/
├── main.py                    # FastAPI app entry point
├── requirements.txt           # All dependencies
├── Dockerfile                 # Container image
├── .env.example              # Environment variables template
├── workflows/                # Workflow modules
│   ├── __init__.py
│   ├── main_workflow.py      # Public workflow
│   ├── extract_data.py       # Internal workflow
│   └── process_results.py    # Internal workflow
├── runtime/                  # Shared runtime code
│   ├── __init__.py
│   ├── context.py           # ExecutionContext
│   └── connections.py       # Connection pooling
└── platform-configs/
    ├── railway.json         # Railway config
    ├── fly.toml            # Fly.io config
    └── render.yaml         # Render config
```

---

### Milestone 2: Implement ProjectOrchestrator Core
**Date:** [YYYY-MM-DD]  
**Confidence:** 7/10  
**Status:** 🔵 Not Started  
**Time Spent:** [X hours]  

#### Activities
- [ ] Create `src/core/codegen/python/ProjectOrchestrator.ts`
- [ ] Implement constructor
- [ ] Implement `generateForTarget()` method
- [ ] Add file organization logic
- [ ] Add error handling

#### Class Structure

**File:** `src/core/codegen/python/ProjectOrchestrator.ts`

```typescript
/**
 * @file ProjectOrchestrator.ts
 * @description Generates complete deployable projects with multiple workflows
 * @architecture Phase 2.6, Task 2.6.4 - Project Code Generation
 * @created 2025-12-21
 * @confidence 7/10 - Major architectural change
 * 
 * @see .implementation/Catalyst_tasks/phase-2.6-multi-project-deployment/task-2.6.4-project-code-generation.md
 * @performance-critical true - Generates all production code
 */

import { CatalystProject, DeploymentTarget, WorkflowDefinition } from '@/core/project/types';
import { WorkflowModuleGenerator } from './WorkflowModuleGenerator';
import { DependencyCollector } from './DependencyCollector';

/**
 * Orchestrates code generation for entire projects.
 * 
 * PROBLEM SOLVED:
 * - Need to deploy multiple workflows as one unit
 * - Workflows must call each other efficiently (no HTTP)
 * - Shared configuration, secrets, and connections
 * 
 * SOLUTION:
 * - Generate one FastAPI app per deployment target
 * - All workflows in target become Python modules
 * - Public workflows exposed as HTTP endpoints
 * - Internal workflows callable as functions
 * 
 * USAGE:
 * const orchestrator = new ProjectOrchestrator(project);
 * const files = orchestrator.generateForTarget('production');
 * // files = { 'main.py': '...', 'workflows/...': '...', ... }
 */
export class ProjectOrchestrator {
  private project: CatalystProject;
  
  constructor(project: CatalystProject) {
    this.project = project;
  }
  
  /**
   * Generate complete project for a deployment target.
   * 
   * @param targetId - ID of deployment target
   * @returns Map of file paths to contents
   * 
   * @throws Error if target not found
   * @throws Error if no workflows assigned to target
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
    
    // Generate all files
    return {
      'main.py': this.generateMainPy(workflows, target),
      'requirements.txt': this.generateRequirements(workflows),
      'Dockerfile': this.generateDockerfile(target),
      '.env.example': this.generateEnvExample(),
      'workflows/': this.generateWorkflowModules(workflows),
      'runtime/': this.generateRuntimeHelpers(),
      ...this.generatePlatformConfigs(target),
    };
  }
}

interface GeneratedProject {
  [path: string]: string | Record<string, string>;
}
```

---

### Milestone 3: Generate main.py (FastAPI Entry Point)
**Date:** [YYYY-MM-DD]  
**Confidence:** 8/10  
**Status:** 🔵 Not Started  
**Time Spent:** [X hours]  

#### Activities
- [ ] Implement `generateMainPy()` method
- [ ] Import all public workflow routers
- [ ] Mount routers to FastAPI app
- [ ] Add health check endpoint
- [ ] Add root endpoint with workflow list
- [ ] Configure CORS middleware
- [ ] Add uvloop for performance

#### Generated main.py Structure

```python
"""
Project Name
Generated by Catalyst

Deployment Target: Production
Platform: Railway
Workflows: main_workflow, extract_data, process_results
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvloop

# Install uvloop for better async performance
uvloop.install()

# Create FastAPI app
app = FastAPI(
    title="Project Name",
    description="Project description",
    version="0.1.0",
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Import and mount workflow routers (PUBLIC workflows only)
from workflows.main_workflow import router as main_workflow_router
app.include_router(main_workflow_router)

# Health check endpoint
@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "project": "Project Name",
        "version": "0.1.0",
        "workflows": ["main_workflow"],
    }

# Root endpoint
@app.get("/")
async def root():
    return {
        "message": "Welcome to Project Name",
        "workflows": ["/api/main"],
    }
```

---

### Milestone 4: Generate requirements.txt
**Date:** [YYYY-MM-DD]  
**Confidence:** 9/10  
**Status:** 🔵 Not Started  
**Time Spent:** [X hours]  

#### Activities
- [ ] Implement `DependencyCollector` class
- [ ] Collect dependencies from all nodes
- [ ] Add base FastAPI dependencies
- [ ] Remove duplicates
- [ ] Sort alphabetically
- [ ] Specify minimum versions

#### Dependency Collection

**Base Dependencies:**
- `fastapi>=0.104.0`
- `uvicorn[standard]>=0.24.0`
- `uvloop>=0.19.0`
- `httpx>=0.25.0`
- `orjson>=3.9.0`
- `python-dotenv>=1.0.0`

**Node-Specific Dependencies:**
- LLM nodes → `anthropic`, `openai`, `groq`
- Database nodes → `asyncpg`, `psycopg2-binary`
- Vector nodes → `qdrant-client`

---

### Milestone 5: Generate Workflow Modules
**Date:** [YYYY-MM-DD]  
**Confidence:** 8/10  
**Status:** 🔵 Not Started  
**Time Spent:** [X hours]  

#### Activities
- [ ] Implement `generateWorkflowModules()` method
- [ ] Use `WorkflowModuleGenerator` for each workflow
- [ ] Generate `__init__.py` for module
- [ ] Handle PUBLIC vs INTERNAL workflows
- [ ] Add HTTP routes for public workflows
- [ ] Make all workflows callable as functions

#### Workflow Module Pattern

**Public Workflow (main_workflow.py):**
```python
"""
Main Workflow - PUBLIC
Exposed as HTTP endpoint
"""

from fastapi import APIRouter, Request
from typing import Any, Optional
from runtime.context import ExecutionContext

# HTTP router for public access
router = APIRouter()

@router.post("/api/main")
async def main_workflow_endpoint(request: Request):
    """HTTP endpoint for main workflow"""
    trigger_data = await request.json()
    result = await execute_main_workflow(trigger_data)
    return result

# Callable function for local calls
async def execute_main_workflow(
    trigger_data: Any,
    parent_context: Optional[ExecutionContext] = None
) -> Any:
    """Execute main workflow"""
    context = ExecutionContext(trigger_data) if not parent_context else parent_context.create_child_context(trigger_data)
    
    # Execute nodes
    # ...
    
    return context.get_final_output()
```

**Internal Workflow (extract_data.py):**
```python
"""
Extract Data - INTERNAL
Only callable by other workflows
"""

from typing import Any, Optional
from runtime.context import ExecutionContext

# No HTTP router - internal only

async def execute_extract_data(
    trigger_data: Any,
    parent_context: Optional[ExecutionContext] = None
) -> Any:
    """Execute extract data workflow"""
    context = ExecutionContext(trigger_data) if not parent_context else parent_context.create_child_context(trigger_data)
    
    # Execute nodes
    # ...
    
    return context.get_final_output()
```

---

### Milestone 6: Generate Dockerfile & Platform Configs
**Date:** [YYYY-MM-DD]  
**Confidence:** 8/10  
**Status:** 🔵 Not Started  
**Time Spent:** [X hours]  

#### Activities
- [ ] Implement `generateDockerfile()` method
- [ ] Implement `generateRailwayConfig()` method
- [ ] Implement `generateFlyConfig()` method
- [ ] Implement `generateRenderConfig()` method
- [ ] Implement `generateCloudRunConfig()` method
- [ ] Optimize for each platform

#### Platform-Specific Configurations

**Railway (railway.json):**
```json
{
  "build": {
    "builder": "DOCKERFILE"
  },
  "deploy": {
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 3
  }
}
```

**Fly.io (fly.toml):**
```toml
app = "project-name"

[build]
  dockerfile = "Dockerfile"

[env]
  PORT = "8080"

[[services]]
  internal_port = 8080
  protocol = "tcp"

  [[services.ports]]
    handlers = ["http"]
    port = 80

  [[services.ports]]
    handlers = ["tls", "http"]
    port = 443
```

**Render (render.yaml):**
```yaml
services:
  - type: web
    name: project-name
    env: python
    buildCommand: pip install -r requirements.txt
    startCommand: uvicorn main:app --host 0.0.0.0 --port $PORT
```

---

### Milestone 7: Generate Runtime Helpers
**Date:** [YYYY-MM-DD]  
**Confidence:** 8/10  
**Status:** 🔵 Not Started  
**Time Spent:** [X hours]  

#### Activities
- [ ] Implement `generateRuntimeHelpers()` method
- [ ] Generate `ExecutionContext` class
- [ ] Generate `ConnectionManager` class
- [ ] Add connection pooling
- [ ] Add configuration management

#### Runtime Helpers

**runtime/context.py:**
```python
"""
Execution Context
Manages workflow execution state, connections, and data flow
"""

from typing import Any, Dict, Optional
import httpx

class ExecutionContext:
    """
    Manages execution state for a workflow run.
    
    Responsibilities:
    - Store node outputs
    - Manage HTTP client
    - Handle connection pooling
    - Pass data between nodes
    """
    
    def __init__(self, trigger_data: Any):
        self.trigger_data = trigger_data
        self.node_outputs: Dict[str, Any] = {}
        self.http = httpx.AsyncClient()
    
    def create_child_context(self, trigger_data: Any) -> 'ExecutionContext':
        """
        Create child context for sub-workflow.
        Shares HTTP client and configuration.
        """
        child = ExecutionContext(trigger_data)
        child.http = self.http  # Share connection pool
        return child
    
    def set_node_output(
        self,
        node_id: str,
        output: Any,
        parent_node_id: Optional[str] = None,
        passthrough: bool = False
    ):
        """Store node output"""
        self.node_outputs[node_id] = output
    
    def get_node_output(self, node_id: str) -> Any:
        """Get node output"""
        return self.node_outputs.get(node_id)
    
    def get_final_output(self) -> Any:
        """Get final workflow output"""
        # Return last node's output
        if self.node_outputs:
            return list(self.node_outputs.values())[-1]
        return self.trigger_data
    
    async def cleanup(self):
        """Cleanup resources"""
        await self.http.aclose()
```

---

### Milestone 8: Integration with Electron
**Date:** [YYYY-MM-DD]  
**Confidence:** 8/10  
**Status:** 🔵 Not Started  
**Time Spent:** [X hours]  

#### Activities
- [ ] Add IPC handler for project generation
- [ ] Update workflow generation handlers to use ProjectOrchestrator
- [ ] Write generated files to disk
- [ ] Handle file structure creation
- [ ] Add progress reporting

#### IPC Handler

```typescript
// electron/workflow-generation-handlers.ts

ipcMain.handle('workflow:generate-project', async (event, projectId, targetId) => {
  try {
    const project = loadProject(projectId);
    const orchestrator = new ProjectOrchestrator(project);
    
    // Generate all files
    const files = orchestrator.generateForTarget(targetId);
    
    // Write to disk
    const outputDir = path.join(projectDir, '.catalyst', 'generated', targetId);
    await writeGeneratedFiles(outputDir, files);
    
    return { success: true, outputDir };
  } catch (error) {
    return { success: false, error: error.message };
  }
});
```

---

### Milestone 9: Testing & Validation
**Date:** [YYYY-MM-DD]  
**Confidence:** [X/10]  
**Status:** 🔵 Not Started  
**Time Spent:** [X hours]  

#### Test Results

**Unit Tests:**
- ProjectOrchestrator generates valid structure
- main.py includes all public workflows
- requirements.txt has all dependencies
- Dockerfile is valid
- Platform configs are valid

**Integration Tests:**
- Create project with 3 workflows (1 public, 2 internal)
- Generate code for production target
- Verify one FastAPI app created
- Verify public workflow has HTTP route
- Verify internal workflows callable
- Deploy and test

**Manual Testing:**

| Test Scenario | Expected | Actual | Pass/Fail | Notes |
|---------------|----------|--------|-----------|-------|
| Generate for Railway | Valid railway.json | | | |
| Generate for Fly.io | Valid fly.toml | | | |
| Deploy to Railway | Successful deployment | | | |
| Call public workflow | HTTP response | | | |
| Sub-workflow calls | Executes without HTTP | | | |

---

### Milestone 10: Human Review
**Date:** [YYYY-MM-DD]  
**Status:** 🔵 Not Started  

#### Human Review Checklist
- [ ] Generated code quality is production-ready
- [ ] Platform configs are correct
- [ ] All workflows deploy successfully
- [ ] Sub-workflow calls work efficiently
- [ ] Ready for Task 2.6.5 (Health Monitoring)

---

## Final Summary

### Deliverables
- [ ] `ProjectOrchestrator.ts` - Project-level orchestrator
- [ ] `WorkflowModuleGenerator.ts` - Workflow module generator
- [ ] `DependencyCollector.ts` - Dependency collection
- [ ] Platform config generators (Railway, Fly.io, Render, Cloud Run)
- [ ] Runtime helpers (ExecutionContext, ConnectionManager)
- [ ] IPC handlers for project generation
- [ ] Test coverage: [X%] (target: >85%)

### What Was Accomplished
[To be filled upon completion]

### Lessons Learned

**What Worked Well:**
- [To be filled]

**What Could Be Improved:**
- [To be filled]

**Reusable Patterns:**
- Project orchestration pattern can extend to other languages
- Platform config templates reusable

---

## Appendix

### Key Files
- `src/core/codegen/python/ProjectOrchestrator.ts`
- `src/core/codegen/python/WorkflowModuleGenerator.ts`
- `src/core/codegen/python/DependencyCollector.ts`
- `electron/workflow-generation-handlers.ts`
- `tests/unit/codegen/python/ProjectOrchestrator.test.ts`

### Related Tasks
- Task 2.6.1: Project Management (dependency)
- Task 2.6.3: Workflow Call Node (integrates with this)
- Task 2.6.5: Health Monitoring (uses generated code)

---

**Task Status:** 🔵 Not Started  
**Ready for:** Task 2.6.5 (after completion)  
**Last Updated:** 2025-12-21
