# Hosted Backend System

> Optional integrated backend solution for Rise applications, removing the complexity of backend infrastructure for prototypes and proof-of-concepts.

**Status**: 🔮 Future Feature (Post-MVP) | **Estimated Timeline**: TBD | **Complexity**: High

---

## 🎯 Vision

Rise's hosted backend system addresses a critical pain point in modern application development: **backend infrastructure friction for prototypes and POCs**. While developers can already integrate any backend (Directus, Supabase, n8n, custom APIs), Rise will offer a first-party hosted backend option that provides seamless integration and removes the monthly cost burden during the early development phase.

### The Problem

**Current State for Developers**:
- Building a POC requires setting up backend infrastructure (Azure, AWS, etc.)
- Monthly costs accrue even with minimal usage (few infrequent users)
- Multiple services need configuration (database, cloud functions, auth, scheduling)
- Context switching between Rise and external backend management
- Stakeholder demos require deployed infrastructure

**Example Pain Points**:
- "I just want to show this POC once a week to stakeholders, but I'm paying $50/month for near-zero usage"
- "I need to juggle n8n, Directus, and a cloud hosting provider just to get basic backend functionality"
- "Setting up CRON jobs or scheduled workflows requires managing separate services"

### The Solution

**Rise Hosted Backend**:
- **Optional Choice**: Use Rise's hosted backend OR connect your own (Directus, Supabase, custom API, etc.)
- **Zero Infrastructure**: Deploy with one click, no Azure/AWS setup required
- **Fully Integrated**: Managed directly within Rise editor with visual workflow builder
- **Cost Efficient**: Free for development, pay only when you scale to production usage
- **Exit-Friendly**: Export data and schema at any time, no vendor lock-in

---

## 🏗️ Architecture Overview

### Core Components

```
┌─────────────────────────────────────────────────────────┐
│                    Rise Application                      │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ┌────────────────┐         ┌─────────────────────┐    │
│  │  Frontend       │         │  Backend Panel      │    │
│  │  Components     │◄────────│  (Optional)         │    │
│  │                 │         │  • Functions        │    │
│  │  • Login        │         │  • Schema           │    │
│  │  • Sign Up      │         │  • Scheduled Jobs   │    │
│  │  • CRUD Nodes   │         │  • Parse Dashboard  │    │
│  │  • Call Backend │         └─────────────────────┘    │
│  └────────────────┘                                      │
│         │                                                │
│         │ Parse SDK Integration                         │
│         ▼                                                │
└─────────────────────────────────────────────────────────┘
         │
         │ JWT Authentication
         │ HTTPS API Calls
         ▼
┌─────────────────────────────────────────────────────────┐
│               Rise Cloud Services                        │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ┌────────────────────────────────────────────────────┐ │
│  │  Parse Server Instance (Per-Project)                │ │
│  │  • MongoDB OR PostgreSQL                            │ │
│  │  • Cloud Functions                                  │ │
│  │  • File Storage                                     │ │
│  │  • LiveQuery (Real-time)                           │ │
│  │  • Push Notifications                              │ │
│  │  • User Sessions & Auth                           │ │
│  └────────────────────────────────────────────────────┘ │
│                                                          │
│  ┌────────────────────────────────────────────────────┐ │
│  │  Custom Scheduling Service                          │ │
│  │  • Workflow Queue                                   │ │
│  │  • Datetime-based Triggers                         │ │
│  │  • Manual Modification UI                          │ │
│  │  • Programmatic Cancellation                       │ │
│  └────────────────────────────────────────────────────┘ │
│                                                          │
│  ┌────────────────────────────────────────────────────┐ │
│  │  Parse Dashboard (Embedded)                         │ │
│  │  • Schema Designer                                  │ │
│  │  • Data Browser                                    │ │
│  │  • Cloud Functions Manager                         │ │
│  │  • CRON Jobs                                       │ │
│  │  • DB Triggers (beforeSave, afterSave, etc.)      │ │
│  └────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

---

## 🔌 Backend Options: User Choice

### Option 1: Rise Hosted Backend (Integrated)

**When to Use**:
- Rapid prototyping and POCs
- No backend infrastructure available
- Want visual workflow builder
- Need scheduled backend functions
- Prefer all-in-one solution

**Features**:
- One-click deployment
- Visual backend function builder (React Flow)
- Embedded Parse Dashboard
- Scheduled workflows
- Free local development
- Easy data export

### Option 2: Bring Your Own Backend (BYOB)

**When to Use**:
- Already using Directus, Supabase, Pocketbase, etc.
- Need specific backend features
- Have existing infrastructure
- Prefer open-source self-hosted
- Want full backend control

**Features**:
- Use Rise AI to generate integration code
- No restrictions on backend choice
- Standard REST/GraphQL APIs
- Community nodes for popular services
- Full flexibility

**Example Integration**:
```javascript
// Rise AI generates integration code for your backend
// Example: Connecting to Directus

import { createDirectus, rest, authentication } from '@directus/sdk';

const client = createDirectus('https://your-directus.com')
  .with(authentication('json'))
  .with(rest());

// Rise generates CRUD nodes compatible with your backend
async function fetchUsers() {
  const users = await client.request(readItems('users'));
  return users;
}
```

---

## 🎨 User Experience Flow

### Initial Setup

1. **Create New Rise Project**
   ```
   User creates project → Sees "Backend Options" panel
   ```

2. **Choose Backend Type**
   ```
   ┌─────────────────────────────────────────┐
   │  Select Your Backend                     │
   ├─────────────────────────────────────────┤
   │                                          │
   │  ○ Rise Hosted Backend (Recommended)    │
   │    • Integrated visual builder           │
   │    • Free for development                │
   │    • One-click deployment                │
   │                                          │
   │  ○ Custom Backend (Advanced)            │
   │    • Directus, Supabase, Pocketbase      │
   │    • Your own API                        │
   │    • Full control                        │
   │                                          │
   │  ○ No Backend (Static Only)             │
   │    • Frontend-only application           │
   │                                          │
   └─────────────────────────────────────────┘
   ```

3. **Rise Hosted Backend Path**
   ```
   User selects "Rise Hosted Backend"
   ↓
   Prompted to "Log In" or "Create Account"
   ↓
   Authentication via Rise Cloud Services
   ↓
   Backend panel becomes available in editor
   ```

---

## 🧩 Frontend Integration: Rise SDK Components

When a user enables Rise Hosted Backend, the Parse SDK is automatically integrated and visual components become available:

### 1. Authentication Components

#### Login Component
```json
{
  "type": "RiseLogin",
  "props": {
    "onSuccess": {
      "type": "action",
      "value": "navigateTo('/dashboard')"
    },
    "onError": {
      "type": "action", 
      "value": "showError(errorMessage)"
    }
  }
}
```

**Visual Interface**:
- Username/email input field
- Password input field
- Login button
- "Remember me" checkbox
- Error message display

#### Sign Up Component
```json
{
  "type": "RiseSignUp",
  "props": {
    "requiredFields": ["email", "password", "username"],
    "onSuccess": {
      "type": "action",
      "value": "sendWelcomeEmail(user.id)"
    }
  }
}
```

### 2. CRUD Components

#### Create Data Node
```json
{
  "type": "RiseCreateData",
  "props": {
    "table": {
      "type": "dropdown",
      "options": ["Users", "Posts", "Comments"], // Auto-populated from backend schema
      "value": "Posts"
    },
    "fields": {
      "title": { "type": "expression", "value": "titleInput.value" },
      "content": { "type": "expression", "value": "contentInput.value" },
      "author": { "type": "expression", "value": "currentUser.id" }
    },
    "onSuccess": {
      "type": "action",
      "value": "navigateTo('/posts/' + result.id)"
    }
  }
}
```

**Visual Interface**:
- Table dropdown (automatically populated from Parse Server schema)
- Field mapping form (dynamically created based on table schema)
- Success/error handlers

#### Read Data Node
```json
{
  "type": "RiseFetchData",
  "props": {
    "table": "Posts",
    "filters": {
      "author": { "type": "expression", "value": "currentUser.id" },
      "published": true
    },
    "sort": { "field": "createdAt", "order": "desc" },
    "limit": 10
  }
}
```

#### Update Data Node
```json
{
  "type": "RiseUpdateData",
  "props": {
    "table": "Posts",
    "objectId": { "type": "expression", "value": "selectedPost.id" },
    "fields": {
      "title": { "type": "expression", "value": "updatedTitle" }
    }
  }
}
```

#### Delete Data Node
```json
{
  "type": "RiseDeleteData",
  "props": {
    "table": "Posts",
    "objectId": { "type": "expression", "value": "selectedPost.id" },
    "confirm": true // Show confirmation dialog
  }
}
```

### 3. File Upload Component

```json
{
  "type": "RiseFileUpload",
  "props": {
    "accept": "image/*",
    "maxSize": 5242880, // 5MB in bytes
    "uploadPath": "/user-avatars",
    "onComplete": {
      "type": "action",
      "value": "updateUserAvatar(fileUrl)"
    }
  }
}
```

**Features**:
- Automatic upload to Parse Server file storage
- Progress indicator
- File validation
- Returns file URL for storage in database

### 4. Call Backend Function Node

```json
{
  "type": "RiseCallFunction",
  "props": {
    "functionName": {
      "type": "dropdown",
      "options": ["sendWelcomeEmail", "processPayment", "generateReport"], // Auto-populated
      "value": "sendWelcomeEmail"
    },
    "parameters": {
      "userId": { "type": "expression", "value": "currentUser.id" },
      "emailTemplate": "welcome_v2"
    },
    "requireAuth": true, // Requires valid JWT token
    "onSuccess": {
      "type": "action",
      "value": "showToast('Email sent!')"
    }
  }
}
```

**Security Model**:
- **Public Functions**: No authentication required (use for webhooks, public APIs)
- **Private Functions**: Requires valid user JWT token
  - Parse Server automatically validates JWT
  - Function receives authenticated user context
  - Prevents unauthorized access

**Example Private Function Security**:
```javascript
// Backend function automatically checks JWT validity
Parse.Cloud.define('sendWelcomeEmail', async (request) => {
  // request.user is automatically populated if JWT is valid
  // Returns null if JWT is invalid/missing (for private functions)
  
  if (!request.user) {
    throw new Error('Authentication required');
  }
  
  const userId = request.params.userId;
  
  // Verify user can only call function for themselves
  if (request.user.id !== userId) {
    throw new Error('Unauthorized: Cannot send email for other users');
  }
  
  // Function logic here...
  await sendEmail(request.user.email, 'Welcome!');
  
  return { success: true };
});
```

---

## 🔧 Backend Functions: Visual Builder

### Creating Backend Functions

Backend functions are created using the same visual logic system (React Flow) as frontend logic, but with backend-specific triggers and capabilities.

### Function Triggers

#### 1. Call from App (User-initiated)
```
User Action → Frontend calls function → JWT validated → Function executes
```

**Security Options**:
- **Public**: Anyone can call (for webhooks, public APIs)
- **Private**: Requires authenticated user (JWT validation)

**Visual Node**:
```
[Trigger: Call from App]
├─ Authentication: Private (JWT required)
├─ Input Parameters:
│  ├─ userId (string, required)
│  ├─ emailTemplate (string, optional)
└─ Output: { success: boolean, message: string }
```

#### 2. HTTP Endpoint (External API)
```
External service → Public endpoint → Function executes
```

**Use Cases**:
- Webhook receivers (Stripe, GitHub, etc.)
- Third-party integrations
- Public APIs

**Security Considerations**:
- User responsible for API key verification
- Rate limiting recommended
- Input validation critical

**Visual Node**:
```
[Trigger: HTTP Endpoint]
├─ Method: POST
├─ Path: /api/webhook/stripe
├─ Public: true
└─ Security Step: Verify API Key (user-configured)
```

#### 3. Database Triggers (Parse Dashboard)
```
Data change → Parse trigger fires → Function executes
```

**Managed in Parse Dashboard**:
- `beforeSave`: Validate/modify data before saving
- `afterSave`: Perform actions after successful save
- `beforeDelete`: Prevent deletion based on conditions
- `afterDelete`: Cleanup related data

**Example**: Automatically send welcome email when user signs up
```javascript
// Configured in Parse Dashboard
Parse.Cloud.afterSave('User', async (request) => {
  if (request.object.isNew()) {
    // New user created, send welcome email
    await Parse.Cloud.run('sendWelcomeEmail', { 
      userId: request.object.id 
    });
  }
});
```

#### 4. Manual Triggers (Parse Dashboard)
```
Developer → Parse Dashboard → Manually runs function
```

**Use Cases**:
- Data cleanup scripts
- One-time migrations
- Testing backend functions
- Administrative tasks

### Function Capabilities

#### Available Operations

**Data Operations** (via Parse SDK):
- Query data with filters
- Create new records
- Update existing records
- Delete records
- Batch operations
- Aggregate queries

**External APIs** (via community nodes or Rise AI):
- HTTP requests (fetch API)
- Email sending (Brevo, SendGrid)
- Payment processing (Stripe)
- SMS (Twilio)
- Push notifications
- AI APIs (OpenAI, Anthropic)

**Example: Send Email via Brevo**
```
[Query Data: Get User]
  ↓
[Condition: User has email]
  ↓
[Community Node: Brevo Send Email]
  ├─ To: user.email
  ├─ Template: welcome_template
  └─ Variables: { name: user.name }
  ↓
[Update Data: Mark email sent]
```

**Example: Stripe Payment Processing**
```
[Trigger: Call from App]
  ↓
[Community Node: Stripe Create Checkout]
  ├─ Amount: payment.amount
  ├─ Currency: USD
  └─ Success URL: /payment/success
  ↓
[Store Data: Save checkout session]
  ↓
[Return: { checkoutUrl: session.url }]
```

#### Community Nodes & Extensibility

**Built-in Nodes**:
- Parse CRUD operations
- Basic JavaScript logic
- Conditional branching
- Loops and iterations

**Community Nodes** (installed via npm):
- `@rise/node-brevo` - Brevo email service
- `@rise/node-stripe` - Stripe payments
- `@rise/node-openai` - OpenAI API
- `@rise/node-twilio` - Twilio SMS

**Custom Nodes** (via Rise AI):
```
User: "Create a custom node to integrate with my company's internal API"

Rise AI generates:
- Node definition
- Input/output schema
- API integration code
- Error handling
```

---

## 📅 Scheduled Workflows: Queue System

One of Rise's most powerful features is the ability to schedule backend functions to run at specific times - similar to Bubble's workflow scheduling.

### Use Cases

**Onboarding Sequences**:
```
User signs up
  → Schedule "Send welcome email" for now + 1 hour
  → Schedule "Prompt profile completion" for now + 24 hours
  → Schedule "Feature highlight email" for now + 3 days
```

**Payment Reminders**:
```
Subscription expires soon
  → Schedule "Payment reminder" for 7 days before expiration
  → Schedule "Final reminder" for 1 day before expiration
```

**Conditional Cancellation**:
```
User completes profile
  → Cancel scheduled "Profile completion reminder"
  
Payment processed
  → Cancel scheduled "Payment reminder"
```

### How It Works

#### 1. Schedule a Backend Function

**Visual Node**:
```
[Action: Schedule Backend Function]
├─ Function: sendProfileReminder
├─ Run At: $now + 24 hours
├─ Parameters:
│  ├─ userId: currentUser.id
│  └─ reminderType: 'profile_incomplete'
└─ Returns: workflowId (string)
```

**Generated Code**:
```javascript
const workflowId = await scheduleWorkflow({
  functionName: 'sendProfileReminder',
  runAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
  parameters: {
    userId: currentUser.id,
    reminderType: 'profile_incomplete'
  }
});

// Store workflowId in database for later cancellation
await saveData('UserOnboarding', {
  userId: currentUser.id,
  profileReminderWorkflowId: workflowId,
  createdAt: new Date()
});
```

#### 2. Store Workflow ID

**Critical Pattern**: Always store the returned `workflowId` so you can cancel the workflow later if needed.

```json
{
  "type": "RiseCreateData",
  "props": {
    "table": "UserOnboarding",
    "fields": {
      "userId": "currentUser.id",
      "profileReminderWorkflowId": "scheduledWorkflow.id", // Store this!
      "createdAt": "now()"
    }
  }
}
```

#### 3. Cancel Scheduled Workflow

**Visual Node**:
```
[Action: Cancel Scheduled Workflow]
├─ Workflow ID: userOnboarding.profileReminderWorkflowId
└─ Reason: 'User completed profile'
```

**Example Logic Flow**:
```
[Trigger: User updates profile]
  ↓
[Condition: Profile is complete]
  ↓
[Query: Get UserOnboarding record]
  ↓
[Cancel Workflow: profileReminderWorkflowId]
  ↓
[Update: Mark reminder as cancelled]
```

**Generated Code**:
```javascript
// User completed profile, cancel reminder
const onboarding = await fetchData('UserOnboarding', {
  userId: currentUser.id
});

if (onboarding.profileReminderWorkflowId) {
  await cancelScheduledWorkflow(
    onboarding.profileReminderWorkflowId,
    { reason: 'User completed profile' }
  );
  
  await updateData('UserOnboarding', onboarding.id, {
    reminderCancelled: true,
    cancelledAt: new Date()
  });
}
```

### Workflow Queue Management UI

#### View Scheduled Workflows

**Location**: Backend Panel → Scheduled Workflows

**UI Features**:
```
┌─────────────────────────────────────────────────────────────────┐
│  Scheduled Workflows                             [Filter] [Search]│
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ sendProfileReminder                                         │ │
│  │ ├─ Status: Pending                                         │ │
│  │ ├─ Scheduled: Nov 25, 2025 3:00 PM                        │ │
│  │ ├─ Created: Nov 24, 2025 3:00 PM                          │ │
│  │ ├─ Parameters:                                             │ │
│  │ │  • userId: 123abc                                        │ │
│  │ │  • reminderType: profile_incomplete                      │ │
│  │ └─ Actions: [Edit Parameters] [Cancel] [Run Now]          │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ sendPaymentReminder                                         │ │
│  │ ├─ Status: Completed                                       │ │
│  │ ├─ Executed: Nov 24, 2025 2:00 PM                         │ │
│  │ ├─ Result: ✓ Email sent successfully                      │ │
│  │ └─ Actions: [View Logs]                                    │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ sendFeatureHighlight                                        │ │
│  │ ├─ Status: Cancelled                                       │ │
│  │ ├─ Reason: User completed profile                          │ │
│  │ ├─ Cancelled: Nov 24, 2025 4:30 PM                        │ │
│  │ └─ Actions: [View Details]                                 │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

#### Manual Workflow Modification

**Edit Parameters**:
- Modify input parameters before execution
- Change scheduled datetime
- Update function version (if function was modified)

**Cancel Workflow**:
- Remove from queue
- Optionally provide cancellation reason
- Cannot cancel already-executed workflows

**Run Now**:
- Skip scheduled time
- Execute immediately
- Useful for testing or urgent execution

### Technical Implementation

#### Queue Service Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                  Workflow Queue Service                      │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌────────────────────┐        ┌──────────────────────┐    │
│  │  Queue Manager     │◄──────►│  Execution Engine    │    │
│  │  • Add workflow    │        │  • Run scheduled     │    │
│  │  • Cancel workflow │        │  • Retry on failure  │    │
│  │  • Update workflow │        │  • Log results       │    │
│  └────────────────────┘        └──────────────────────┘    │
│           │                              │                  │
│           ▼                              ▼                  │
│  ┌────────────────────┐        ┌──────────────────────┐    │
│  │  Database          │        │  Parse Cloud         │    │
│  │  • ScheduledJobs   │        │  Functions           │    │
│  │  • ExecutionLogs   │        │                      │    │
│  └────────────────────┘        └──────────────────────┘    │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

#### Database Schema

**ScheduledWorkflows Table**:
```javascript
{
  workflowId: String (unique, indexed),
  functionName: String,
  userId: String (indexed), // Who scheduled it
  parameters: Object,
  scheduledAt: Date (indexed), // When to execute
  status: String (enum: 'pending', 'running', 'completed', 'failed', 'cancelled'),
  createdAt: Date,
  executedAt: Date (nullable),
  cancelledAt: Date (nullable),
  cancellationReason: String (nullable),
  result: Object (nullable),
  error: Object (nullable),
  retryCount: Number,
  maxRetries: Number (default: 3)
}
```

#### Execution Engine

**Polling Mechanism**:
```javascript
// Runs every minute
setInterval(async () => {
  const now = new Date();
  
  // Find workflows due for execution
  const dueWorkflows = await Query('ScheduledWorkflows')
    .equalTo('status', 'pending')
    .lessThanOrEqualTo('scheduledAt', now)
    .find();
  
  for (const workflow of dueWorkflows) {
    await executeWorkflow(workflow);
  }
}, 60000); // Check every minute

async function executeWorkflow(workflow) {
  try {
    // Mark as running
    await workflow.set('status', 'running').save();
    
    // Execute the cloud function
    const result = await Parse.Cloud.run(
      workflow.get('functionName'),
      workflow.get('parameters')
    );
    
    // Mark as completed
    await workflow.set({
      status: 'completed',
      executedAt: new Date(),
      result: result
    }).save();
    
  } catch (error) {
    // Handle retry logic
    const retryCount = workflow.get('retryCount') || 0;
    const maxRetries = workflow.get('maxRetries') || 3;
    
    if (retryCount < maxRetries) {
      // Retry in 5 minutes
      await workflow.set({
        status: 'pending',
        scheduledAt: new Date(Date.now() + 5 * 60 * 1000),
        retryCount: retryCount + 1
      }).save();
    } else {
      // Max retries reached, mark as failed
      await workflow.set({
        status: 'failed',
        executedAt: new Date(),
        error: {
          message: error.message,
          stack: error.stack
        }
      }).save();
    }
  }
}
```

---

## 🌐 Deployment & Environments

### Local Development (Free & Unlimited)

**Setup**:
```bash
# Rise automatically starts local Parse Server
npm run dev

# Parse Server runs on localhost:1337
# MongoDB runs locally via Docker
```

**Features**:
- Full backend functionality locally
- No usage limits
- No internet connection required (after initial setup)
- Perfect for offline development
- Fast iteration cycles

**Local Parse Dashboard**:
```
Access at: http://localhost:4040/dashboard
- Schema management
- Data browser
- Cloud functions
- Database triggers
- No cloud account needed
```

### Cloud Deployment (Single Environment Initially)

**Current Scope** (MVP):
- **Single Environment**: One production instance per project
- Deploy backend functions and schema to cloud
- Access Parse Dashboard remotely
- Scheduled workflows run in cloud

**Push to Cloud**:
```
[Backend Panel]
  ↓
[Deploy] Button clicked
  ↓
├─ Upload cloud functions
├─ Sync database schema
├─ Migrate scheduled workflows
└─ Restart Parse Server instance
  ↓
[Success] Backend deployed to cloud
```

### Future: Multi-Environment Support (Post-MVP)

**Development + Production Environments**:
```
┌────────────────────┐      ┌────────────────────┐
│   Development      │      │   Production       │
│   Environment      │      │   Environment      │
├────────────────────┤      ├────────────────────┤
│ • Test changes     │      │ • Live users       │
│ • Rapid iteration  │      │ • Stable version   │
│ • Debug mode       │      │ • Performance opt  │
│ • Unrestricted     │      │ • Rollback support │
└────────────────────┘      └────────────────────┘
         │                           │
         │    [Merge Dev → Prod]    │
         └──────────►│◄──────────────┘
                     │
                     ├─ Schema Migration
                     ├─ Function Deployment
                     ├─ Data Preservation
                     └─ Rollback Point Created
```

**Features**:
- **Merge Dev → Prod**: Deploy tested changes to production
- **Schema-Only Merge**: Update schema without affecting data
- **Read-Only Production**: Prevent direct edits to production (only via merge)
- **Rollback**: Revert production to previous version if bugs detected
- **Environment Variables**: Separate configs for dev/prod (API keys, etc.)

---

## 🗄️ Parse Server Features

Rise exposes **all Parse Server features** through the embedded Parse Dashboard:

### Core Features

1. **Database Schema Designer**
   - Create/modify tables (classes)
   - Define fields and types
   - Set indexes and constraints
   - Manage relationships

2. **Data Browser**
   - View and edit data
   - Run queries
   - Export data (CSV, JSON)
   - Import data

3. **Cloud Functions Manager**
   - Create/edit functions
   - View function logs
   - Test functions manually
   - Set function-level ACLs

4. **CRON Jobs**
   - Schedule recurring tasks
   - Cron expression editor
   - Execution history
   - Enable/disable jobs

5. **Database Triggers**
   - `beforeSave`: Validate data before saving
   - `afterSave`: Perform actions after save
   - `beforeDelete`: Prevent deletion
   - `afterDelete`: Cleanup related data
   - `beforeFind`: Modify queries
   - `afterFind`: Transform results

6. **User Management**
   - View all users
   - Manage roles and permissions
   - Reset passwords
   - Verify emails

7. **File Storage**
   - Upload files directly
   - View file metadata
   - Set file permissions
   - Manage storage quota

8. **LiveQuery (Real-time)**
   - Real-time data subscriptions
   - WebSocket connections
   - Live query monitoring
   - Connection management

9. **Push Notifications**
   - Send push notifications
   - Configure push providers (APNs, FCM)
   - Schedule notifications
   - Target specific users/segments

10. **API Browser**
    - Test REST API endpoints
    - View request/response
    - Generate curl commands

### Embedded Parse Dashboard in Rise

**Access**:
```
[Backend Panel] → [Parse Dashboard] Tab
  ↓
Embedded iframe with full Parse Dashboard
  • Schema Designer
  • Data Browser
  • Cloud Functions
  • CRON Jobs
  • All Parse features
```

**Benefits**:
- No context switching
- Direct access to backend
- Full feature parity with standalone Parse Dashboard
- Integrated authentication (logged in via Rise account)

---

## 💰 Pricing Model (Conceptual)

### Free Tier

**Local Development**:
- ✅ Unlimited local Parse Server usage
- ✅ Unlimited backend functions
- ✅ Unlimited database records
- ✅ Unlimited workflow runs
- ✅ Full Parse Dashboard access

**Cloud Hosted** (Free Tier):
- ✅ 5 active users/month
- ✅ 100 MB database storage
- ✅ 1,000 workflow runs/month
- ✅ 1 GB file storage
- ✅ Community support

**Perfect For**:
- Prototyping
- POC development
- Demos to stakeholders
- Learning and experimentation

### Paid Tier (Future)

**Unlimited Plan** (Estimated $20-50/month):
- ✅ Unlimited active users
- ✅ Unlimited database records
- ✅ Unlimited workflow runs
- ⚠️ Limited by vCPU and RAM allocation
- ✅ Usage monitoring dashboard
- ✅ Email support

**Scaling Indicators**:
```
┌──────────────────────────────────────────┐
│  Usage Monitor                            │
├──────────────────────────────────────────┤
│  vCPU Usage:    ████████░░  78%          │
│  RAM Usage:     ██████░░░░  58%          │
│  Database Size: 2.3 GB                   │
│  Monthly Runs:  15,432 workflows         │
│                                          │
│  💡 Tip: Your vCPU is nearing the limit  │
│     Consider optimizing queries or       │
│     upgrading to a higher tier.          │
└──────────────────────────────────────────┘
```

**Enterprise** (Custom Pricing):
- ✅ Dedicated Parse Server instances
- ✅ SLA guarantees
- ✅ Custom vCPU/RAM allocation
- ✅ Multi-region deployment
- ✅ Priority support
- ✅ White-label options

---

## 🚪 Exit Strategy: No Vendor Lock-in

### Data Export

**One-Click Export**:
```
[Backend Panel] → [Settings] → [Export Data]
  ↓
Automated export process:
  ├─ All database tables → JSON/CSV
  ├─ File storage → ZIP archive
  ├─ User data → JSON
  └─ Logs → JSON
  ↓
Email sent with download links
```

**Export Contents**:
- All database records (JSON or CSV format)
- All uploaded files
- User authentication data
- Workflow history (for reference)
- Cloud function source code

### Schema Export

**Via Parse Dashboard**:
```
[Parse Dashboard] → [Core] → [Export Schema]
  ↓
Downloads: schema.json
```

**Schema File**:
```json
{
  "classLevelPermissions": {},
  "fields": {
    "title": { "type": "String" },
    "author": { "type": "Pointer", "targetClass": "_User" },
    "createdAt": { "type": "Date" }
  },
  "indexes": {
    "author_1": { "author": 1 }
  }
}
```

### Self-Host Parse Server

**Migration Steps**:

1. **Export Data** (via Rise)
   ```bash
   # Data dump emailed to user
   downloads/
   ├── database-dump.json
   ├── files.zip
   └── schema.json
   ```

2. **Set Up Self-Hosted Parse Server**
   ```bash
   # Install Parse Server locally or on cloud provider
   npm install -g parse-server
   
   # Start Parse Server with your MongoDB/Postgres
   parse-server --appId myAppId \
                --masterKey myMasterKey \
                --databaseURI mongodb://localhost:27017/mydb \
                --serverURL http://localhost:1337/parse
   ```

3. **Import Schema**
   ```bash
   # Use Parse Dashboard or API to import schema
   curl -X POST \
     -H "X-Parse-Application-Id: myAppId" \
     -H "X-Parse-Master-Key: myMasterKey" \
     -d @schema.json \
     http://localhost:1337/parse/schemas/Posts
   ```

4. **Import Data**
   ```bash
   # Import data via Parse API or direct database import
   mongoimport --db mydb --collection Posts --file database-dump.json
   ```

5. **Update Frontend**
   ```javascript
   // Change Parse Server endpoint in Rise project
   Parse.initialize("myAppId");
   Parse.serverURL = 'http://localhost:1337/parse'; // or your cloud URL
   ```

**Zero Lock-in**: You now have:
- Your own Parse Server
- Full control over infrastructure
- All your data
- Same API compatibility
- No monthly costs to Rise

---

## 🛠️ Technical Implementation Considerations

### Challenges & Solutions

#### Challenge 1: Parse Server Cloud Functions Integration

**Question**: How do we translate visual logic flows into Parse Server-compatible JavaScript?

**Potential Solution**:
- Visual logic → Abstract syntax tree (AST)
- AST → JavaScript code generation
- Deploy generated `.js` files to Parse Server's `cloud/` directory
- Parse Server automatically loads and registers functions

**Example**:
```
Visual Flow:
[Start] → [Query Users] → [Filter Active] → [Send Email] → [End]

Generated Cloud Function:
Parse.Cloud.define('sendActiveUsersEmail', async (request) => {
  const usersQuery = new Parse.Query('_User');
  usersQuery.equalTo('active', true);
  const users = await usersQuery.find();
  
  for (const user of users) {
    await sendEmail(user.get('email'), 'newsletter');
  }
  
  return { sent: users.length };
});
```

#### Challenge 2: Scheduling Service Implementation

**Question**: How do we implement Bubble-style scheduled workflows that don't exist natively in Parse Server?

**Potential Solution**:
- Custom Node.js service running alongside Parse Server
- Database table `ScheduledWorkflows` with datetime-indexed queries
- Polling mechanism checks for due workflows every minute
- Executes Parse Cloud Functions when scheduled time arrives
- Stores workflow IDs for cancellation

**Architecture**:
```
Rise Cloud Services
├── Parse Server (core backend)
└── Workflow Scheduler Service (custom)
    ├── Queue Manager
    ├── Execution Engine
    └── Database (ScheduledWorkflows table)
```

#### Challenge 3: Embedded Parse Dashboard

**Question**: How do we securely embed Parse Dashboard inside Electron app?

**Potential Solution**:
- Parse Dashboard is a React app
- Can be embedded in iframe with proper CORS headers
- Authentication via Parse Server session tokens
- User logs in to Rise → Gets Parse session → Embedded dashboard uses that session

**Security**:
- Parse Dashboard runs on user's Parse Server instance (cloud or local)
- Session tokens are short-lived and user-specific
- No master key exposed to frontend

#### Challenge 4: Multi-Tenant Parse Server Instances

**Question**: How do we provision separate Parse Server instances per project?

**Potential Solutions**:

**Option A: Kubernetes-based**
- Each project gets its own Parse Server pod
- Separate MongoDB/Postgres database per project
- Horizontal scaling based on usage
- Standard cloud infrastructure (AWS, Azure, GCP)

**Option B: Serverless Parse Server**
- Parse Server runs as serverless functions (AWS Lambda, Cloud Run)
- Cold start consideration
- Auto-scaling built-in
- Cost-efficient for low usage

**Option C: Shared Parse Server with App ID Isolation**
- Single Parse Server with multiple app IDs
- Database-level isolation (different databases)
- Shared infrastructure for cost efficiency
- Easier to manage initially

**MVP Recommendation**: Start with Option C (shared Parse Server), migrate to Option A (Kubernetes) as user base grows.

---

## 📋 Implementation Roadmap (High-Level)

### Phase 1: Foundation (Estimated 4-6 weeks)

- [ ] Research Parse Server deployment options
- [ ] Prototype scheduled workflows service
- [ ] Design authentication system for backend access
- [ ] Create technical specification document
- [ ] Define database schema for workflow queue
- [ ] Set up test Parse Server environment

### Phase 2: Local Development (Estimated 6-8 weeks)

- [ ] Integrate Parse SDK into Rise frontend
- [ ] Create visual backend function builder (React Flow)
- [ ] Implement code generation: visual logic → Parse Cloud Functions
- [ ] Embed Parse Dashboard in Rise app
- [ ] Local Parse Server auto-start on Rise project creation
- [ ] Test full local workflow

### Phase 3: Cloud Infrastructure (Estimated 8-10 weeks)

- [ ] Set up cloud Parse Server infrastructure (AWS/Azure/GCP)
- [ ] Implement user authentication and project provisioning
- [ ] Build workflow scheduling service
- [ ] Create usage monitoring and billing system
- [ ] Deploy test environment
- [ ] Beta testing with select users

### Phase 4: Frontend Components (Estimated 4-6 weeks)

- [ ] Develop Login/Sign Up components
- [ ] Create CRUD visual nodes
- [ ] Implement Call Backend Function node
- [ ] Add File Upload component
- [ ] Build security model (public/private functions)
- [ ] Comprehensive testing

### Phase 5: Polish & Launch (Estimated 4-6 weeks)

- [ ] UI/UX refinement
- [ ] Documentation and tutorials
- [ ] Video walkthroughs
- [ ] Performance optimization
- [ ] Security audit
- [ ] Public beta launch

**Total Estimated Timeline**: 26-36 weeks (6-9 months) for full implementation

**Note**: This is a major feature that would likely come after MVP completion and possibly after Schema Level 2 (expressions and state management).

---

## 🎯 Success Metrics

### User Adoption
- Number of projects using Rise Hosted Backend
- Monthly active backend deployments
- Workflow runs per month

### Performance
- Average API response time (<100ms target)
- Scheduled workflow execution accuracy (99%+ on-time)
- Uptime (99.9% target)

### User Satisfaction
- Support ticket volume
- Feature request trends
- Exit rate (how many export and self-host)

---

## 📚 See Also

**Related Documentation**:
- [DATA_FLOW.md](./DATA_FLOW.md) - State management and component communication
- [EXPRESSION_SYSTEM.md](./EXPRESSION_SYSTEM.md) - How expressions work with backend calls
- [SECURITY.md](./SECURITY.md) - Security model for backend functions
- [PLUGIN_SYSTEM.md](./PLUGIN_SYSTEM.md) - Extensibility patterns

**External Resources**:
- [Parse Server Documentation](https://docs.parseplatform.org/)
- [Parse Dashboard](https://github.com/parse-community/parse-dashboard)
- [Bubble Workflows](https://manual.bubble.io/core-resources/logic/workflows) - Inspiration for scheduling
- [Noodl Backend](https://docs.noodl.net/) - Prior art in visual backend building

---

## ❓ Open Questions for Future Research

1. **Parse Server Limitations**: What are the scale limits of Parse Server for multi-tenant scenarios?
2. **Cost Analysis**: What is the actual cost per user for cloud-hosted Parse Server?
3. **Alternative Backends**: Should we support Supabase/Firebase as alternative hosted options?
4. **WebSockets**: How do we handle Parse LiveQuery subscriptions in Rise visual editor?
5. **Database Choice**: MongoDB vs PostgreSQL - which should be default?
6. **Workflow Reliability**: What happens if a scheduled workflow fails multiple times?
7. **Data Migration**: Can we provide automated migration tools for common backends?

---

**Last Updated**: November 24, 2025  
**Status**: 🔮 Future Feature (Post-MVP)  
**Document Version**: 1.0  
**Next Review**: After MVP completion and Schema Level 2 implementation

**Feedback**: This document is a living specification. As we prototype and learn more about Parse Server and workflow scheduling, this document will be updated with concrete implementation details and architectural decisions.