# Variable Scopes in Rise

> **Understanding where data lives and how long it persists**

---

## Overview

Rise provides three distinct variable scopes, each with different lifetimes and use cases. Understanding these scopes is essential for building well-architected applications.

| Scope | Lifetime | Cleared When | Primary Use Case |
|-------|----------|--------------|------------------|
| **Execution** | Single flow run | Flow completes | Accumulating data within a flow |
| **Page** | Page mount | Page unmounts or navigates away | UI state, form data |
| **App** | Browser session | Page refresh or app close | Auth, cart, theme, user preferences |

---

## Execution Scope (`$exec`)

**Lifetime:** Created when a flow starts executing, automatically destroyed when the flow completes.

**Memory safety:** Zero risk of memory leaks. Garbage collected immediately after flow ends.

**Access syntax:** `$exec.variableName`

### What It's For

Execution variables are **scratch space within a single flow execution**. They're perfect for:

- Accumulating results while looping through items
- Collecting validation errors from multiple checks
- Building up data from parallel branches before merge
- Storing intermediate calculations

### What It's NOT For

- Persisting data between user interactions (use Page scope)
- Sharing data between different flows (use Page or App scope)
- Storing data that components need to display (use Page or App scope)

### Example: Accumulating Validation Errors

```
[Form Submit] 
    │
    ├─→ [Validate Email] ─→ [Append to $exec.errors if invalid]
    │
    ├─→ [Validate Password] ─→ [Append to $exec.errors if invalid]
    │
    ├─→ [Validate Terms] ─→ [Append to $exec.errors if invalid]
    │
    └─→ [Merge] ─→ [If $exec.errors.length > 0] 
                        │
                        ├─(yes)─→ [Show Errors: $exec.errors]
                        │
                        └─(no)─→ [Submit Form]
```

After this flow completes, `$exec.errors` is automatically cleared. The next form submission starts fresh.

### Example: Loop with Running Total

```
[Loop: cartItems]
    │
    │  $loop.item = current item
    │  $exec.runningTotal starts at 0
    │
    └─→ [Calculate] ─→ [Set $exec.runningTotal += $loop.item.price]
    
[After Loop]
    │
    └─→ [Display Total: $exec.runningTotal]
```

### Node: Set Execution Variable

```
┌─────────────────────────────────┐
│ Set Execution Variable          │
│ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ │
│ name: errors                    │
│ operation:                      │
│   • set (replace value)         │
│   • append (add to array)       │
│   • increment (add to number)   │
│   • merge (shallow merge obj)   │
│ value: { field: "email", ... }  │
│ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ │
│ Signals: ◀run ▶done ▶failed     │
│ Output: json: { errors: [...] } │
└─────────────────────────────────┘
```

---

## Page Scope (`$page`)

**Lifetime:** Created when a page component mounts, destroyed when the page unmounts (navigation away).

**Memory consideration:** Cleared automatically on navigation. Safe for typical use.

**Access syntax:** `$page.variableName`

### What It's For

Page variables store **UI state that persists across interactions within a single page**:

- Form field values
- UI toggles (sidebar open, modal visible)
- Filter/sort selections
- Pagination state
- Temporary data being edited

### What It's NOT For

- Data that should survive navigation (use App scope)
- Data only needed within one flow execution (use Execution scope)
- Global application state (use App scope)

### Example: Form State

```
// User types in email field
[Input onChange] ─→ [SetState: $page.formData.email = $event.value]

// User toggles "remember me"
[Checkbox onChange] ─→ [SetState: $page.formData.rememberMe = $event.checked]

// Form submit reads accumulated state
[Submit onClick] ─→ [HTTP Request: body = $page.formData]
```

If user navigates away and comes back, form is reset (page scope cleared on unmount).

### Example: UI Toggle State

```
// Toggle sidebar
[Menu Button onClick] ─→ [SetState: $page.sidebarOpen = !$page.sidebarOpen]

// Sidebar component reads state
<Sidebar visible={$page.sidebarOpen} />
```

### Reactive Updates

Page variables are **reactive**. When a flow updates `$page.formData.email`, any component displaying `{{ $page.formData.email }}` automatically re-renders.

This is the "Noodl magic" - you don't need to manually wire up listeners. The reactivity is built in.

---

## App Scope (`$app`)

**Lifetime:** Created on app initialization, persists until browser refresh or tab close.

**Memory consideration:** Use judiciously. Large objects persist for entire session.

**Access syntax:** `$app.variableName`

### What It's For

App variables store **global state that persists across page navigation**:

- Authentication state (user object, tokens)
- Shopping cart contents
- User preferences (theme, language)
- Feature flags
- Cached data (to avoid re-fetching)

### What It's NOT For

- Page-specific UI state (use Page scope)
- Temporary calculation data (use Execution scope)
- Sensitive data that shouldn't persist (consider security implications)

### Example: Shopping Cart

```
// Add item (from any page)
[Add to Cart onClick] ─→ [Set $app.cart.items = [...$app.cart.items, newItem]]
                      ─→ [Set $app.cart.total = calculateTotal($app.cart.items)]

// Cart icon (in header, visible on all pages)
<CartBadge count={$app.cart.items.length} />

// Cart page
<CartItemList items={$app.cart.items} />
```

User can navigate between Product → Category → Home → Cart, and cart data persists.

### Example: Authentication

```
// Login flow
[Login Submit] ─→ [HTTP: /api/login] 
               ─→ [Set $app.auth.user = response.user]
               ─→ [Set $app.auth.token = response.token]
               ─→ [Navigate: /dashboard]

// Protected page check
[Page Load] ─→ [If !$app.auth.user] ─→ [Navigate: /login]

// Header (all pages)
<UserMenu name={$app.auth.user?.name} />
```

### Persistence Warning

App scope does NOT persist across browser refresh. For true persistence, combine with:

- localStorage (via dedicated node)
- Backend session
- Cookie storage

```
// On login
[Set $app.auth] ─→ [Save to localStorage: "auth"]

// On app start
[App Initialize] ─→ [Load from localStorage: "auth"] ─→ [Set $app.auth]
```

---

## Scope Decision Flowchart

```
                    ┌─────────────────────────────┐
                    │ Where should this data live? │
                    └─────────────────────────────┘
                                  │
                                  ▼
                    ┌─────────────────────────────┐
                    │ Is it only needed within    │
                    │ this one flow execution?    │
                    └─────────────────────────────┘
                          │              │
                         YES             NO
                          │              │
                          ▼              ▼
                    ┌──────────┐  ┌─────────────────────────────┐
                    │ $exec    │  │ Does it need to survive     │
                    │ scope    │  │ navigation to other pages?  │
                    └──────────┘  └─────────────────────────────┘
                                        │              │
                                       YES             NO
                                        │              │
                                        ▼              ▼
                                  ┌──────────┐  ┌──────────┐
                                  │ $app     │  │ $page    │
                                  │ scope    │  │ scope    │
                                  └──────────┘  └──────────┘
```

---

## Quick Reference

### Setting Variables

| Scope | Node | Syntax |
|-------|------|--------|
| Execution | Set Execution Variable | `$exec.myVar` |
| Page | SetState | `$page.myVar` |
| App | SetState | `$app.myVar` |

### Reading Variables

**In flow nodes:**
```
$exec.validationErrors
$page.formData.email
$app.cart.items
```

**In component expressions:**
```
{{ $page.formData.email }}
{{ $app.cart.items.length }}
{{ $app.auth.user?.name ?? 'Guest' }}
```

Note: Execution variables (`$exec`) are NOT available in component expressions - they only exist during flow execution.

### Reactivity

| Scope | Reactive? | Components auto-update? |
|-------|-----------|------------------------|
| Execution | No | N/A (not visible to components) |
| Page | Yes | Yes |
| App | Yes | Yes |

---

## Common Patterns

### Pattern: Form with Validation

```
Variables used:
- $page.formData (form field values)
- $page.errors (validation error messages)
- $exec.validationResults (temporary during validation)

[Input onChange] ─→ [SetState: $page.formData.email]

[Submit onClick] 
    ─→ [Validate All Fields] 
    ─→ [Build $exec.validationResults]
    ─→ [If valid] 
          ├─(yes)─→ [HTTP Submit] ─→ [Clear $page.formData]
          └─(no)─→ [SetState: $page.errors = $exec.validationResults]
```

### Pattern: Multi-Page Wizard

```
Variables used:
- $app.wizard.step1Data (persists across pages)
- $app.wizard.step2Data
- $app.wizard.currentStep
- $page.localFormData (current step's draft)

[Step 1 Next] 
    ─→ [Set $app.wizard.step1Data = $page.localFormData]
    ─→ [Set $app.wizard.currentStep = 2]
    ─→ [Navigate: /wizard/step-2]

[Step 2 loads]
    ─→ [Set $page.localFormData = $app.wizard.step2Data ?? {}]
```

### Pattern: Optimistic UI Update

```
Variables used:
- $app.cart.items (source of truth)
- $exec.previousCart (rollback data)

[Remove Item onClick]
    ─→ [Set $exec.previousCart = $app.cart.items]  // Save for rollback
    ─→ [Set $app.cart.items = filtered list]       // Optimistic update
    ─→ [HTTP: DELETE /api/cart/item]
          ├─(done)─→ [Success - already updated]
          └─(failed)─→ [Set $app.cart.items = $exec.previousCart]  // Rollback
```

---

## Anti-Patterns to Avoid

### ❌ Using App Scope for Everything

```
// Bad - form data doesn't need to survive navigation
$app.loginForm.email
$app.loginForm.password

// Good
$page.loginForm.email
$page.loginForm.password
```

**Why it's bad:** Memory bloat, stale data issues, harder to reason about.

### ❌ Using Page Scope for Cross-Page Data

```
// Bad - will be lost on navigation
$page.shoppingCart

// Good
$app.shoppingCart
```

**Why it's bad:** User loses cart when browsing products.

### ❌ Not Using Execution Scope for Temp Data

```
// Bad - pollutes page state with temporary data
$page.tempValidationResult
$page.loopAccumulator

// Good
$exec.validationResult
$exec.loopAccumulator
```

**Why it's bad:** Stale data between interactions, unnecessary re-renders.

---

## Related Documentation

- **[LOGIC_PATTERNS.md](./LOGIC_PATTERNS.md)** - Flow patterns using variables
- **[GLOSSARY_LOGIC_FLOWS.md](./GLOSSARY_LOGIC_FLOWS.md)** - Term definitions
- **[COMPONENT_SCHEMA.md](./COMPONENT_SCHEMA.md)** - Expression syntax in components

---

**Last Updated:** 2024-11-30  
**Status:** ✅ Complete  
**Schema Level:** Level 2+