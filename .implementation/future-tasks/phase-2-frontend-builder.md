# Phase 2: Frontend Builder Integration

**Status:** 📋 PLANNED  
**Priority:** HIGH (Strategic Feature)  
**Estimated Effort:** 15-20 development days  
**Dependencies:** Phase 1 complete ✅

---

## Executive Summary

Transform Catalyst from a backend workflow builder into a complete **full-stack visual development tool** by integrating the proven Rise component builder for frontend React generation.

**Current State:**
- ✅ Phase 1: Backend workflow builder (Python/FastAPI generation)
- 🔄 Phase 2: Frontend component builder (dormant, ready for activation)

**Future State:**
- ✅ Unified tool: Visual backend + Visual frontend
- ✅ Full-stack code generation in single click
- ✅ Type-safe integration between layers
- ✅ Complete applications from visual design

---

## Vision: Catalyst Full-Stack Builder

### The Problem
Developers currently face a disconnect between backend and frontend development:
- Backend logic requires manual API endpoint creation
- Frontend components require manual API integration
- Type mismatches between layers cause runtime errors
- No unified view of full application architecture

### The Solution
Catalyst Phase 2 provides a unified visual tool where:
1. **Workflows tab** → Build backend APIs visually (Python/FastAPI)
2. **Components tab** → Build frontend UI visually (React/JSX)
3. **Integration tab** → Connect frontend to backend with type safety
4. **Generate** → Single button creates complete full-stack app

---

## Current Architecture (Phase 1)

### Backend System (✅ ACTIVE)
- **Store:** `src/renderer/store/workflowStore.ts`
- **Manifest:** `.catalyst/manifest.json`
- **UI:** WorkflowCanvas (node-based visual editor)
- **Output:** Python/FastAPI + HTTP endpoints
- **Code:** `src/core/codegen/python/`
- **Status:** Production-ready

### Frontend System (🔄 DORMANT)
- **Store:** `src/renderer/store/manifestStore.ts`
- **Manifest:** `.lowcode/manifest.json`
- **UI:** Component Tree (hierarchy-based editor)
- **Output:** React/JSX components
- **Code:** `src/core/codegen/ReactCodeGenerator.ts`
- **Status:** Functional but inactive (preserved from Rise)

---

## Phase 2 Project Structure

### Integrated Full-Stack Project
```
my-fullstack-app/
├── .catalyst/                    # Backend workflow definitions
│   ├── manifest.json             # Workflow nodes, triggers, connections
│   └── generated/
│       ├── main.py               # FastAPI server entry point
│       ├── endpoints.py          # HTTP route handlers
│       ├── models.py             # Pydantic data models
│       └── workflows/            # Generated workflow logic
│           ├── user_auth.py
│           └── data_processing.py
│
├── .lowcode/                     # Frontend component definitions
│   └── manifest.json             # Component tree, props, styling
│
├── src/                          # Generated React frontend
│   ├── components/               # UI components
│   │   ├── UserCard.tsx
│   │   ├── Dashboard.tsx
│   │   └── LoginForm.tsx
│   ├── pages/
│   │   ├── Home.tsx
│   │   └── Profile.tsx
│   ├── api/                      # Auto-generated API client
│   │   ├── client.ts             # Type-safe API calls
│   │   └── types.ts              # TypeScript interfaces from Python models
│   └── App.tsx
│
├── package.json                  # Frontend dependencies
├── requirements.txt              # Backend dependencies
└── README.md                     # Generated project documentation
```

---

## Implementation Roadmap

### Phase 2.1: Reactivate Component Builder
**Duration:** 2-3 days  
**Objective:** Make Rise component system accessible in Catalyst UI

**Tasks:**
1. Add "Components" tab to main navigation
2. Restore Component Tree panel
3. Enable React code generation
4. Test basic component creation workflow
5. Verify `.lowcode/manifest.json` persistence

**Success Criteria:**
- User can create React components visually
- Components save to `.lowcode/manifest.json`
- React code generates correctly
- No interference with workflow system

---

### Phase 2.2: Dual Manifest Support
**Duration:** 1-2 days  
**Objective:** Projects can use both manifest types simultaneously

**Tasks:**
1. Update `ProjectManager` to recognize both folders
2. Update `ProjectValidator` to validate both manifests
3. Support independent save/load for each system
4. UI tabs switch between workflow and component contexts
5. Create unified project dashboard

**Success Criteria:**
- Single project has both `.catalyst/` and `.lowcode/`
- Both systems save independently
- No conflicts between manifests
- Clear UI separation between modes

---

### Phase 2.3: API Type Generation
**Duration:** 3-4 days  
**Objective:** Workflow endpoints auto-generate TypeScript types

**Tasks:**
1. Analyze Python Pydantic models in generated code
2. Generate TypeScript interfaces from Python types
3. Create type-safe API client code
4. Generate React hooks for API calls
5. Validate type consistency at generation time

**Technical Approach:**
```typescript
// From Python workflow endpoint:
class UserResponse(BaseModel):
    id: int
    name: str
    email: str

// Auto-generate TypeScript:
interface UserResponse {
    id: number;
    name: string;
    email: string;
}

// Auto-generate API client:
export async function getUser(id: number): Promise<UserResponse> {
    const response = await fetch(`/api/users/${id}`);
    return response.json();
}

// Auto-generate React hook:
export function useUser(id: number) {
    const [data, setData] = useState<UserResponse | null>(null);
    // ... fetch logic
    return { data, loading, error };
}
```

**Success Criteria:**
- Python models → TypeScript interfaces
- Type-safe API client generated
- No manual type duplication
- Compile-time type safety between layers

---

### Phase 2.4: Integration Layer
**Duration:** 4-5 days  
**Objective:** Visual connection between backend workflows and frontend components

**Tasks:**
1. Create "Integration" tab in UI
2. Visual data flow diagram (workflow → component)
3. Drag-drop API binding to component props
4. Auto-wire API calls to UI components
5. Live validation of data contracts

**UI Concept:**
```
┌──────────────────────────────────────────────────────┐
│ Integration Tab                                       │
├──────────────────────────────────────────────────────┤
│                                                       │
│  Backend                    Frontend                  │
│  ┌──────────────┐          ┌──────────────┐         │
│  │ GET /users   │─────────>│ UserList     │         │
│  │ UserResponse │          │ props.users  │         │
│  └──────────────┘          └──────────────┘         │
│                                                       │
│  ┌──────────────┐          ┌──────────────┐         │
│  │ POST /login  │─────────>│ LoginForm    │         │
│  │ LoginRequest │          │ onSubmit     │         │
│  └──────────────┘          └──────────────┘         │
│                                                       │
└──────────────────────────────────────────────────────┘
```

**Success Criteria:**
- Visual mapping of API → Component
- Automatic prop binding
- Validation of data contracts
- Generated integration code

---

### Phase 2.5: Unified Preview
**Duration:** 2-3 days  
**Objective:** Live preview of complete full-stack application

**Tasks:**
1. Split-screen preview: Backend + Frontend
2. Start Python backend in Docker/subprocess
3. Start React dev server (Vite)
4. Network traffic visualization
5. Hot-reload for both layers

**UI Concept:**
```
┌──────────────────────────────────────────┐
│ Preview                        [⟲ Reload]│
├────────────────┬─────────────────────────┤
│ Backend Logs   │ Frontend Preview        │
│                │                         │
│ ✅ FastAPI     │  ┌─────────────────┐   │
│    started     │  │  My App         │   │
│ ✅ Workflows   │  │  ┌───────────┐  │   │
│    loaded      │  │  │ User: John│  │   │
│                │  │  │ Email: @  │  │   │
│ 🌐 /api/users  │  │  └───────────┘  │   │
│    200 OK      │  │  [Load More]    │   │
│                │  └─────────────────┘   │
└────────────────┴─────────────────────────┘
```

**Success Criteria:**
- Both backend and frontend run simultaneously
- Real API calls between layers
- Hot-reload works for both
- Network traffic visible

---

## Technical Details

### File Updates Required

**Modified Files:**
1. `src/main/project/ProjectManager.ts`
   - Add dual manifest detection
   - Support both folder structures
   - Unified project initialization

2. `src/main/project/ProjectValidator.ts`
   - Validate both `.catalyst/` and `.lowcode/`
   - Cross-reference validation (API contracts)
   - Type consistency checks

3. `src/renderer/App.tsx`
   - Add "Components" and "Integration" tabs
   - Tab state management
   - Context switching between modes

4. `electron/manifest-handlers.ts`
   - Support both manifest types
   - Unified IPC interface

5. `src/core/codegen/ReactCodeGenerator.ts`
   - Update for modern React patterns
   - Integration with API client
   - Hook generation

**New Files:**
1. `src/core/codegen/TypeScriptInterfaceGenerator.ts`
   - Python → TypeScript conversion
   - Type mapping logic

2. `src/core/codegen/APIClientGenerator.ts`
   - Generate fetch wrappers
   - React hooks for API calls

3. `src/renderer/components/IntegrationCanvas.tsx`
   - Visual API binding UI

4. `src/core/integration/ContractValidator.ts`
   - Validate API contracts between layers

**Already Working (No Changes):**
- ✅ `catalyst-manifest-handlers.ts` - Backend manifests
- ✅ `workflowStore.ts` - Workflow state
- ✅ `src/core/codegen/python/` - Backend generation
- ✅ `manifestStore.ts` - Component state (just needs activation)

---

## Migration Path

### For Existing Projects

**Backend-Only Projects:**
- Continue working as normal
- Add `.lowcode/` when ready for frontend
- Incremental adoption

**Frontend-Only Projects (if any):**
- Continue working as normal
- Add `.catalyst/` when ready for backend
- Incremental adoption

**No Breaking Changes:**
- Existing workflows unaffected
- Backward compatible
- Opt-in frontend features

---

## Risk Assessment

### Low Risk ✅
- Both systems proven separately (Rise + Catalyst Phase 1)
- No new external dependencies
- Clear separation of concerns
- Incremental rollout possible

### Medium Risk ⚠️
- Type generation complexity
- Real-time sync between layers
- Preview coordination (two processes)

### Mitigation Strategies
1. **Incremental Rollout**
   - Ship each phase independently
   - User feedback at each stage
   - A/B testing with power users

2. **Extensive Testing**
   - Unit tests for type generation
   - Integration tests for full stack
   - Manual QA for complex scenarios

3. **Fallback Options**
   - Users can still code manually
   - Export generated code for inspection
   - Disable features if issues arise

---

## Success Metrics

### User Success
- ✅ User creates backend workflow in <5 minutes
- ✅ User creates frontend UI in <5 minutes
- ✅ Generated code runs without errors
- ✅ Type safety prevents runtime issues
- ✅ Full-stack app deployed successfully

### Technical Success
- ✅ Type generation accuracy >95%
- ✅ Code generation <5 seconds
- ✅ Zero conflicts between manifests
- ✅ Hot-reload <1 second
- ✅ API call success rate >99%

### Business Success
- ✅ Competitive advantage (unique full-stack tool)
- ✅ Reduced development time by 10x
- ✅ Attracts frontend + backend developers
- ✅ Platform for future AI enhancements

---

## Estimated Timeline

| Phase | Duration | Start | End |
|-------|----------|-------|-----|
| 2.1: Reactivate Component Builder | 2-3 days | TBD | TBD |
| 2.2: Dual Manifest Support | 1-2 days | TBD | TBD |
| 2.3: API Type Generation | 3-4 days | TBD | TBD |
| 2.4: Integration Layer | 4-5 days | TBD | TBD |
| 2.5: Unified Preview | 2-3 days | TBD | TBD |
| **Buffer** | 3-5 days | TBD | TBD |
| **Total** | **15-22 days** | TBD | TBD |

---

## Dependencies

### Technical
- ✅ Phase 1 complete
- ✅ Rise codebase preserved
- ✅ React generation working
- ✅ Python generation working

### External
- None (all code already exists in codebase)

---

## Future Enhancements (Phase 3+)

### AI-Powered Integration
- AI suggests API bindings
- AI generates component layouts
- AI optimizes data flow

### Database Integration
- Visual database schema designer
- ORM code generation
- Migration management

### Deployment Tools
- One-click deployment to cloud
- Docker compose generation
- CI/CD pipeline creation

### Collaboration Features
- Multi-user editing
- Version control integration
- Component marketplace

---

## Conclusion

Phase 2 transforms Catalyst from a specialized backend tool into a **comprehensive full-stack development platform**. By leveraging the existing Rise frontend builder and integrating it with the proven workflow system, we create a unique tool that dramatically accelerates full-stack development.

This is not a rewrite - it's the strategic integration of two battle-tested systems into a unified platform that delivers exponential value.

---

**Document Version:** 1.0  
**Last Updated:** 2025-12-21  
**Author:** AI (Cline) + Human Product Vision  
**Status:** Ready for Implementation Planning

**Next Steps:**
1. Review and approve roadmap
2. Allocate development resources
3. Set milestone dates
4. Begin Phase 2.1 implementation
