# Task 2.6.5: Deployment Health Monitoring

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
Implement real-time health monitoring for deployed projects, tracking uptime, response time, error rates, and deployment status. This provides users with visibility into their production systems.

Users need to know if their deployed workflows are running properly, responding quickly, and free of errors - all without leaving the Catalyst editor.

### Success Criteria
- [ ] Health check endpoints added to generated code
- [ ] `HealthMonitor` service implemented in Electron
- [ ] Health checks run every 60 seconds
- [ ] Response time measured and tracked
- [ ] Status updates reflected in project store
- [ ] Dashboard shows real-time health status
- [ ] Monitoring auto-starts on app launch
- [ ] Monitoring stops on app quit
- [ ] Handles network errors gracefully
- [ ] Test coverage >85%
- [ ] Human review completed

### References
- PHASE-2.6-TASKS.md - Task 2.6.5 details
- Task 2.6.1 - Updates project store
- Task 2.6.2 - Dashboard displays health data
- Task 2.6.4 - Generates health endpoints
- .clinerules/implementation-standards.md

### Dependencies
- Task 2.6.1: Project Management System (complete)
- Task 2.6.2: Project Dashboard (displays health data)
- Task 2.6.4: Project Code Generation (generates health endpoints)
- axios or httpx for HTTP requests

---

## Milestones

### Milestone 1: Add Health Endpoints to Generated Code
**Date:** [YYYY-MM-DD]  
**Confidence:** 9/10  
**Status:** 🔵 Not Started  
**Time Spent:** [X hours]  

#### Activities
- [ ] Update `ProjectOrchestrator` to include health endpoint
- [ ] Track uptime since app start
- [ ] Include project version in response
- [ ] Add workflow list to response
- [ ] Test health endpoint

#### Design Decisions

| Decision | Options Considered | Choice Made | Rationale | Confidence |
|----------|-------------------|-------------|-----------|------------|
| Check interval | 30s, 60s, 120s | 60s | Balance of freshness and overhead | 9/10 |
| Timeout | 3s, 5s, 10s | 5s | Reasonable for most networks | 8/10 |
| Storage | In-memory, SQLite, Zustand | Zustand (project store) | Reactive updates to UI | 9/10 |
| Retry logic | None, exponential backoff | None (mark as down) | Simple, clear status | 8/10 |

#### Health Endpoint

Already included in Task 2.6.4 `main.py`:

```python
@app.get("/health")
async def health_check():
    """
    Health check endpoint for monitoring.
    Returns application status and metadata.
    """
    return {
        "status": "healthy",
        "project": "Project Name",
        "version": "0.1.0",
        "uptime": get_uptime_seconds(),
        "workflows": ["main_workflow", "extract_data"],
        "timestamp": datetime.utcnow().isoformat(),
    }

def get_uptime_seconds() -> int:
    """Get application uptime in seconds"""
    global app_start_time
    return int((datetime.utcnow() - app_start_time).total_seconds())

# Initialize at app start
app_start_time = datetime.utcnow()
```

---

### Milestone 2: Implement HealthMonitor Service
**Date:** [YYYY-MM-DD]  
**Confidence:** 8/10  
**Status:** 🔵 Not Started  
**Time Spent:** [X hours]  

#### Activities
- [ ] Create `electron/health-monitor.ts`
- [ ] Implement `HealthMonitor` class
- [ ] Add `startMonitoring()` method
- [ ] Add `stopMonitoring()` method
- [ ] Add `checkHealth()` method
- [ ] Handle timeouts and errors
- [ ] Update project store with results

#### Implementation

**File:** `electron/health-monitor.ts`

```typescript
/**
 * @file health-monitor.ts
 * @description Real-time health monitoring for deployed projects
 * @architecture Phase 2.6, Task 2.6.5 - Health Monitoring
 * @created 2025-12-21
 * @confidence 8/10 - Standard monitoring pattern
 * 
 * @see .implementation/Catalyst_tasks/phase-2.6-multi-project-deployment/task-2.6.5-health-monitoring.md
 * @performance-critical false - Runs in background
 */

import axios from 'axios';
import { useProjectStore } from '@/renderer/store/projectStore';

/**
 * Monitors health of deployed projects.
 * 
 * PROBLEM SOLVED:
 * - Users need to know if deployments are up or down
 * - Need to track performance (response time)
 * - Need to identify issues before users report them
 * 
 * SOLUTION:
 * - Periodic health checks (every 60s)
 * - Measure response time
 * - Update project store reactively
 * - Dashboard shows real-time status
 * 
 * USAGE:
 * healthMonitor.startMonitoring(projectId, targetId, url);
 * // Checks run automatically every 60 seconds
 * healthMonitor.stopMonitoring(key);
 */
export class HealthMonitor {
  // Map of monitoring intervals by key (projectId:targetId)
  private intervals = new Map<string, NodeJS.Timeout>();
  
  /**
   * Start monitoring a deployment target.
   * 
   * @param projectId - Project ID
   * @param targetId - Deployment target ID
   * @param url - Base URL of deployment
   * 
   * @example
   * healthMonitor.startMonitoring(
   *   'project_123',
   *   'production',
   *   'https://myapp.railway.app'
   * );
   */
  startMonitoring(projectId: string, targetId: string, url: string): void {
    const key = `${projectId}:${targetId}`;
    
    // Stop existing monitor if any (prevents duplicates)
    this.stopMonitoring(key);
    
    // Check every 60 seconds
    const interval = setInterval(() => {
      this.checkHealth(projectId, targetId, url);
    }, 60000);
    
    this.intervals.set(key, interval);
    
    // Check immediately (don't wait 60s for first check)
    this.checkHealth(projectId, targetId, url);
    
    console.log(`[HealthMonitor] Started monitoring ${key} at ${url}`);
  }
  
  /**
   * Stop monitoring a deployment.
   * 
   * @param key - Monitor key (projectId:targetId)
   */
  stopMonitoring(key: string): void {
    const interval = this.intervals.get(key);
    if (interval) {
      clearInterval(interval);
      this.intervals.delete(key);
      console.log(`[HealthMonitor] Stopped monitoring ${key}`);
    }
  }
  
  /**
   * Check health of a deployment.
   * Makes HTTP request to /health endpoint and updates store.
   * 
   * @private
   */
  private async checkHealth(
    projectId: string,
    targetId: string,
    url: string
  ): Promise<void> {
    const startTime = Date.now();
    
    try {
      // Make health check request
      const response = await axios.get(`${url}/health`, {
        timeout: 5000, // 5 second timeout
        validateStatus: (status) => status === 200, // Only 200 is success
      });
      
      const responseTime = Date.now() - startTime;
      const data = response.data;
      
      // Update project store with healthy status
      useProjectStore.getState().updateDeploymentTarget(projectId, targetId, {
        health: {
          status: 'healthy',
          lastCheckAt: new Date().toISOString(),
          responseTime,
          uptime: data.uptime || 0,
          errorRate: 0,
        },
      });
      
      console.log(
        `[HealthMonitor] ${projectId}:${targetId} - Healthy (${responseTime}ms)`
      );
      
    } catch (error: any) {
      // Determine if degraded or down
      const responseTime = Date.now() - startTime;
      
      let status: 'degraded' | 'down' = 'down';
      
      // If we got a response but it was slow or non-200, it's degraded
      if (error.response && responseTime > 1000) {
        status = 'degraded';
      }
      
      // Update project store with error status
      useProjectStore.getState().updateDeploymentTarget(projectId, targetId, {
        health: {
          status,
          lastCheckAt: new Date().toISOString(),
          responseTime: error.response ? responseTime : undefined,
          uptime: undefined,
          errorRate: 100,
        },
      });
      
      console.error(
        `[HealthMonitor] ${projectId}:${targetId} - ${status} (${error.message})`
      );
    }
  }
  
  /**
   * Stop all monitoring.
   * Called when app quits.
   */
  stopAll(): void {
    for (const [key, interval] of this.intervals.entries()) {
      clearInterval(interval);
      console.log(`[HealthMonitor] Stopped monitoring ${key}`);
    }
    this.intervals.clear();
  }
  
  /**
   * Get currently monitored deployments.
   * 
   * @returns Array of monitor keys
   */
  getMonitored(): string[] {
    return Array.from(this.intervals.keys());
  }
}

// Singleton instance
export const healthMonitor = new HealthMonitor();
```

---

### Milestone 3: Auto-Start Monitoring on App Launch
**Date:** [YYYY-MM-DD]  
**Confidence:** 9/10  
**Status:** 🔵 Not Started  
**Time Spent:** [X hours]  

#### Activities
- [ ] Update `electron/main.ts` to start monitoring
- [ ] Load all projects on app launch
- [ ] Start monitoring for deployed targets
- [ ] Handle app quit gracefully
- [ ] Test auto-start behavior

#### Integration with Main Process

**File:** `electron/main.ts`

```typescript
import { healthMonitor } from './health-monitor';
import { useProjectStore } from '@/renderer/store/projectStore';

app.on('ready', () => {
  // ... existing setup code
  
  // Start health monitoring for all deployed projects
  initializeHealthMonitoring();
});

function initializeHealthMonitoring() {
  // Get all projects from store
  const projects = useProjectStore.getState().projects;
  
  let monitorCount = 0;
  
  // Start monitoring for each deployed target
  for (const project of Object.values(projects)) {
    for (const target of Object.values(project.deploymentTargets)) {
      // Only monitor if deployed and has URL
      if (target.status === 'deployed' && target.url) {
        healthMonitor.startMonitoring(project.id, target.id, target.url);
        monitorCount++;
      }
    }
  }
  
  console.log(`[HealthMonitor] Monitoring ${monitorCount} deployments`);
}

app.on('quit', () => {
  // Stop all health monitoring
  console.log('[HealthMonitor] Stopping all monitors');
  healthMonitor.stopAll();
});
```

---

### Milestone 4: Add IPC Handlers for Manual Control
**Date:** [YYYY-MM-DD]  
**Confidence:** 9/10  
**Status:** 🔵 Not Started  
**Time Spent:** [X hours]  

#### Activities
- [ ] Create IPC handler for starting monitoring
- [ ] Create IPC handler for stopping monitoring
- [ ] Create IPC handler for force check
- [ ] Create IPC handler for getting monitored list
- [ ] Test from renderer process

#### IPC Handlers

**File:** `electron/health-monitor-handlers.ts`

```typescript
import { ipcMain } from 'electron';
import { healthMonitor } from './health-monitor';

/**
 * Register IPC handlers for health monitoring control.
 */
export function registerHealthMonitorHandlers(): void {
  // Start monitoring a deployment
  ipcMain.handle(
    'health:start-monitoring',
    async (event, projectId: string, targetId: string, url: string) => {
      try {
        healthMonitor.startMonitoring(projectId, targetId, url);
        return { success: true };
      } catch (error) {
        console.error('Failed to start monitoring:', error);
        return { success: false, error: error.message };
      }
    }
  );
  
  // Stop monitoring a deployment
  ipcMain.handle(
    'health:stop-monitoring',
    async (event, projectId: string, targetId: string) => {
      try {
        const key = `${projectId}:${targetId}`;
        healthMonitor.stopMonitoring(key);
        return { success: true };
      } catch (error) {
        console.error('Failed to stop monitoring:', error);
        return { success: false, error: error.message };
      }
    }
  );
  
  // Get list of monitored deployments
  ipcMain.handle('health:get-monitored', async (event) => {
    try {
      const monitored = healthMonitor.getMonitored();
      return { success: true, monitored };
    } catch (error) {
      console.error('Failed to get monitored list:', error);
      return { success: false, error: error.message };
    }
  });
}
```

---

### Milestone 5: Dashboard Integration
**Date:** [YYYY-MM-DD]  
**Confidence:** 9/10  
**Status:** 🔵 Not Started  
**Time Spent:** [X hours]  

#### Activities
- [ ] Verify ProjectCard displays health status
- [ ] Verify status colors update in real-time
- [ ] Add "Last checked" timestamp
- [ ] Add manual refresh button
- [ ] Test reactive updates

#### Dashboard Updates

The health data is already displayed in Task 2.6.2's ProjectCard component:

```typescript
// Health status is automatically displayed via Zustand reactivity
const healthStatus = primaryTarget?.health?.status || 'unknown';

// Status colors
const statusConfig = {
  healthy: { color: 'text-green-500', bg: 'bg-green-50' },
  degraded: { color: 'text-yellow-500', bg: 'bg-yellow-50' },
  down: { color: 'text-red-500', bg: 'bg-red-50' },
  unknown: { color: 'text-gray-400', bg: 'bg-gray-50' },
};

// Display last check time
{primaryTarget?.health?.lastCheckAt && (
  <span className="text-xs text-gray-500">
    Last checked: {formatDistanceToNow(new Date(primaryTarget.health.lastCheckAt), {
      addSuffix: true
    })}
  </span>
)}
```

---

### Milestone 6: Error Handling & Edge Cases
**Date:** [YYYY-MM-DD]  
**Confidence:** 8/10  
**Status:** 🔵 Not Started  
**Time Spent:** [X hours]  

#### Activities
- [ ] Handle network errors (no internet)
- [ ] Handle DNS errors (invalid URL)
- [ ] Handle timeout errors (slow server)
- [ ] Handle 404/500 errors (deployment issue)
- [ ] Handle SSL certificate errors
- [ ] Test all error scenarios

#### Error Scenarios

| Error Type | Status | Handling |
|------------|--------|----------|
| Network unreachable | down | Mark as down, retry next interval |
| DNS failure | down | Mark as down, log error |
| Timeout (>5s) | degraded | Mark as degraded, log slow response |
| 404 Not Found | down | Mark as down, health endpoint missing |
| 500 Internal Error | degraded | Mark as degraded, server issues |
| SSL certificate invalid | down | Mark as down, log security issue |

---

### Milestone 7: Testing & Validation
**Date:** [YYYY-MM-DD]  
**Confidence:** [X/10]  
**Status:** 🔵 Not Started  
**Time Spent:** [X hours]  

#### Test Results

**Unit Tests:**
- HealthMonitor starts monitoring
- Health check makes HTTP request
- Status updates project store
- Monitoring stops on request
- All monitors stop on app quit

**Integration Tests:**
- Deploy project to Railway
- Verify monitoring starts automatically
- Wait 60 seconds, verify check runs
- Stop deployment, verify status changes to "down"
- Restart deployment, verify status changes to "healthy"

**Manual Testing:**

| Test Scenario | Expected | Actual | Pass/Fail | Notes |
|---------------|----------|--------|-----------|-------|
| Healthy deployment | Green status, low response time | | | |
| Slow deployment | Yellow status, high response time | | | |
| Down deployment | Red status, error message | | | |
| Network offline | Gray/red status | | | |
| Invalid URL | Red status, DNS error | | | |

---

### Milestone 8: Human Review
**Date:** [YYYY-MM-DD]  
**Status:** 🔵 Not Started  

#### Human Review Checklist
- [ ] Health monitoring accurate and reliable
- [ ] Dashboard updates in real-time
- [ ] Error handling graceful
- [ ] No performance impact on main app
- [ ] Phase 2.6 complete and ready for Phase 3

---

## Final Summary

### Deliverables
- [ ] Health endpoints in generated code
- [ ] `HealthMonitor` service in Electron
- [ ] Auto-start on app launch
- [ ] IPC handlers for manual control
- [ ] Dashboard integration
- [ ] Error handling
- [ ] Test coverage: [X%] (target: >85%)

### What Was Accomplished
[To be filled upon completion]

### Lessons Learned

**What Worked Well:**
- [To be filled]

**What Could Be Improved:**
- [To be filled]

**Reusable Patterns:**
- Health monitoring pattern can be reused for other services
- Interval-based checking is simple and effective

---

## Appendix

### Key Files
- `electron/health-monitor.ts` - Health monitoring service
- `electron/health-monitor-handlers.ts` - IPC handlers
- `electron/main.ts` - Auto-start integration
- `tests/unit/health-monitor.test.ts` - Unit tests

### Related Tasks
- Task 2.6.1: Project Management (uses project store)
- Task 2.6.2: Project Dashboard (displays health data)
- Task 2.6.4: Project Code Generation (generates health endpoints)

---

**Task Status:** 🔵 Not Started  
**Ready for:** Phase 3: Data Integration (after completion)  
**Last Updated:** 2025-12-21
