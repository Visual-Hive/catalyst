# Rise Examples

Real-world component examples showing how Rise's visual editor, component schema, and code generation work together.

---

## Example 1: User Profile Card

### Visual Editor Interface

```
┌─────────────────────────────────────────┐
│ UserCard Component                      │
├─────────────────────────────────────────┤
│ Properties:                             │
│                                         │
│ ┌─ displayName ───────────────────────┐ │
│ │ [Expression ▼]                      │ │
│ │ user.firstName + ' ' + user.lastName │ │
│ │ ✓ Valid expression                  │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ ┌─ avatarUrl ─────────────────────────┐ │
│ │ [Expression ▼]                      │ │
│ │ user.avatar || '/default-avatar.png' │ │
│ │ ✓ Valid expression                  │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ ┌─ badgeText ─────────────────────────┐ │
│ │ [Custom Function ▼]                 │ │
│ │ getUserBadgeText(user)              │ │
│ │ 🔗 Links to global function         │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ Events:                                 │
│ • onClick → Navigate to user profile   │
│                                         │
└─────────────────────────────────────────┘
```

### Component Schema (Simplified for MVP)

```json
{
  "components": {
    "comp_user_card_001": {
      "id": "comp_user_card_001",
      "displayName": "UserCard",
      "type": "composite",
      
      "properties": {
        "user": {
          "type": "prop",
          "dataType": "object",
          "required": true,
          "schema": {
            "id": "string",
            "firstName": "string",
            "lastName": "string",
            "avatar": "string",
            "role": "string"
          }
        },
        
        "displayName": {
          "type": "expression",
          "expression": "user.firstName + ' ' + user.lastName",
          "dependencies": ["props.user.firstName", "props.user.lastName"]
        },
        
        "avatarUrl": {
          "type": "expression", 
          "expression": "user.avatar || '/default-avatar.png'",
          "dependencies": ["props.user.avatar"]
        },
        
        "badgeText": {
          "type": "customFunction",
          "functionName": "getUserBadgeText",
          "args": ["props.user"],
          "dependencies": ["props.user", "globalFunctions.getUserBadgeText"]
        }
      },
      
      "eventHandlers": {
        "onClick": {
          "type": "navigation",
          "target": "/profile/${props.user.id}"
        }
      },
      
      "styling": {
        "className": "user-card",
        "conditionalClasses": {
          "premium": "user.role === 'premium'"
        }
      },
      
      "children": [
        "comp_avatar_001",
        "comp_user_name_001", 
        "comp_user_badge_001"
      ]
    }
  },
  
  "globalFunctions": {
    "getUserBadgeText": {
      "code": "function getUserBadgeText(user) {\n  if (user.role === 'admin') return '👑 Admin';\n  if (user.role === 'premium') return '⭐ Premium';\n  if (user.isOnline) return '🟢 Online';\n  return '⚪ Offline';\n}",
      "description": "Returns appropriate badge text based on user status",
      "parameters": [{"name": "user", "type": "object"}],
      "returns": "string"
    }
  }
}
```

### Generated React Code

```jsx
import React from 'react';
import { getUserBadgeText } from '../utils/globalFunctions.js';
import Avatar from './Avatar';
import UserName from './UserName';
import UserBadge from './UserBadge';

/**
 * User profile card with dynamic badge and navigation
 * 
 * @component UserCard
 * @generated Rise v1.0.0 - 2025-10-25T10:00:00Z
 */
export default function UserCard({ user, onClick }) {
  // Simple expressions (sandboxed)
  const displayName = user.firstName + ' ' + user.lastName;
  const avatarUrl = user.avatar || '/default-avatar.png';
  
  // Custom function (full power)
  const badgeText = getUserBadgeText(user);
  
  // Event handlers
  const handleClick = () => {
    navigate(`/profile/${user.id}`);
    if (onClick) onClick(user);
  };
  
  // Conditional styling
  const className = `user-card ${user.role === 'premium' ? 'premium' : ''}`;
  
  return (
    <div className={className} onClick={handleClick}>
      <Avatar src={avatarUrl} alt={displayName} />
      <UserName>{displayName}</UserName>
      <UserBadge>{badgeText}</UserBadge>
    </div>
  );
}

UserCard.propTypes = {
  user: PropTypes.shape({
    id: PropTypes.string.isRequired,
    firstName: PropTypes.string.isRequired,
    lastName: PropTypes.string.isRequired,
    avatar: PropTypes.string,
    role: PropTypes.string
  }).isRequired,
  onClick: PropTypes.func
};
```

### Generated Global Functions

```javascript
// src/utils/globalFunctions.js

/**
 * Global functions defined in Rise visual editor
 * 
 * These functions have full JavaScript power and can:
 * - Make API calls
 * - Access localStorage
 * - Perform complex computations
 * - Use any npm packages
 * 
 * @generated Rise v1.0.0
 */

export function getUserBadgeText(user) {
  if (user.role === 'admin') return '👑 Admin';
  if (user.role === 'premium') return '⭐ Premium';
  if (user.isOnline) return '🟢 Online';
  return '⚪ Offline';
}

// Performance tracking (added automatically)
if (process.env.NODE_ENV === 'development') {
  const originalGetUserBadgeText = getUserBadgeText;
  getUserBadgeText = function(...args) {
    const start = performance.now();
    const result = originalGetUserBadgeText.apply(this, args);
    const time = performance.now() - start;
    console.log(`getUserBadgeText: ${time.toFixed(2)}ms`);
    return result;
  };
}
```

---

## Example 2: Todo List with AI Generation

### AI Generation Prompt

```
User Input: "Create a TodoList component that shows a list of tasks. 
Each task should have a checkbox, text, and delete button. 
Add a form at the top to add new tasks."

AI Response: "I'll create a TodoList component with task management. 
Let me break this down into sub-components..."
```

### AI-Generated Schema

```json
{
  "components": {
    "comp_todo_list_001": {
      "id": "comp_todo_list_001",
      "displayName": "TodoList",
      "type": "composite",
      "aiGenerated": true,
      "aiPrompt": "Create a TodoList component that shows a list of tasks...",
      
      "localState": {
        "newTaskText": {
          "type": "string",
          "default": "",
          "description": "Text for new task being typed"
        }
      },
      
      "properties": {
        "tasks": {
          "type": "prop",
          "dataType": "array",
          "required": true,
          "schema": {
            "items": {
              "id": "string",
              "text": "string", 
              "completed": "boolean"
            }
          }
        },
        
        "remainingCount": {
          "type": "expression",
          "expression": "tasks.filter(task => !task.completed).length",
          "dependencies": ["props.tasks"]
        }
      },
      
      "eventHandlers": {
        "onAddTask": {
          "type": "customFunction",
          "functionName": "addNewTask",
          "args": ["state.newTaskText", "props.onTasksChange"]
        },
        
        "onToggleTask": {
          "type": "customFunction", 
          "functionName": "toggleTaskCompleted",
          "args": ["taskId", "props.tasks", "props.onTasksChange"]
        }
      },
      
      "children": [
        "comp_add_task_form_001",
        "comp_task_summary_001", 
        "comp_task_list_001"
      ]
    }
  },
  
  "globalFunctions": {
    "addNewTask": {
      "code": "function addNewTask(text, onTasksChange) {\n  if (!text.trim()) return;\n  \n  const newTask = {\n    id: Date.now().toString(),\n    text: text.trim(),\n    completed: false\n  };\n  \n  onTasksChange(prev => [...prev, newTask]);\n}",
      "aiGenerated": true,
      "description": "Adds a new task to the list"
    },
    
    "toggleTaskCompleted": {
      "code": "function toggleTaskCompleted(taskId, tasks, onTasksChange) {\n  const updatedTasks = tasks.map(task => \n    task.id === taskId \n      ? { ...task, completed: !task.completed }\n      : task\n  );\n  \n  onTasksChange(updatedTasks);\n}",
      "aiGenerated": true,
      "description": "Toggles completion status of a task"
    }
  }
}
```

### Generated React Code

```jsx
import React, { useState } from 'react';
import { addNewTask, toggleTaskCompleted } from '../utils/globalFunctions.js';
import AddTaskForm from './AddTaskForm';
import TaskSummary from './TaskSummary';
import TaskList from './TaskList';

/**
 * Todo list component with add, toggle, and delete functionality
 * 
 * @component TodoList  
 * @generated Rise v1.0.0 - AI Generated from prompt
 */
export default function TodoList({ tasks, onTasksChange }) {
  const [newTaskText, setNewTaskText] = useState('');
  
  // Simple expression
  const remainingCount = tasks.filter(task => !task.completed).length;
  
  // Event handlers using custom functions
  const handleAddTask = () => {
    addNewTask(newTaskText, onTasksChange);
    setNewTaskText(''); // Clear input after adding
  };
  
  const handleToggleTask = (taskId) => {
    toggleTaskCompleted(taskId, tasks, onTasksChange);
  };
  
  return (
    <div className="todo-list">
      <AddTaskForm 
        value={newTaskText}
        onChange={setNewTaskText}
        onSubmit={handleAddTask}
      />
      <TaskSummary 
        total={tasks.length}
        remaining={remainingCount}
      />
      <TaskList 
        tasks={tasks}
        onToggle={handleToggleTask}
        onDelete={(id) => onTasksChange(tasks.filter(t => t.id !== id))}
      />
    </div>
  );
}
```

---

## Example 3: Real-time Chat Component

### Advanced Schema with Global State

```json
{
  "globalState": {
    "currentUser": {
      "type": "reactive",
      "dataType": "object",
      "default": null,
      "schema": {
        "id": "string",
        "name": "string",
        "avatar": "string"
      }
    },
    
    "messages": {
      "type": "reactive",
      "dataType": "array", 
      "default": [],
      "realtime": true,
      "source": "websocket"
    }
  },
  
  "components": {
    "comp_chat_message_001": {
      "id": "comp_chat_message_001",
      "displayName": "ChatMessage",
      "type": "composite",
      
      "properties": {
        "message": {
          "type": "prop",
          "dataType": "object",
          "required": true
        },
        
        "isOwnMessage": {
          "type": "expression",
          "expression": "message.userId === global.currentUser.id",
          "dependencies": ["props.message.userId", "global.currentUser.id"]
        },
        
        "timeAgo": {
          "type": "customFunction",
          "functionName": "formatTimeAgo",
          "args": ["props.message.createdAt"]
        },
        
        "shouldShowAvatar": {
          "type": "expression",
          "expression": "!isOwnMessage && message.showAvatar",
          "dependencies": ["computed.isOwnMessage", "props.message.showAvatar"]
        }
      },
      
      "eventHandlers": {
        "onReply": {
          "type": "customFunction",
          "functionName": "startReplyToMessage", 
          "args": ["props.message.id"]
        }
      },
      
      "globalTriggers": {
        "onMessageRead": {
          "trigger": "global:messages:item:viewed",
          "condition": "viewedMessage.id === props.message.id",
          "action": "markMessageAsRead"
        }
      }
    }
  },
  
  "globalFunctions": {
    "formatTimeAgo": {
      "code": "function formatTimeAgo(date) {\n  const now = new Date();\n  const diff = now - new Date(date);\n  const minutes = Math.floor(diff / 60000);\n  \n  if (minutes < 1) return 'just now';\n  if (minutes < 60) return `${minutes}m ago`;\n  \n  const hours = Math.floor(minutes / 60);\n  if (hours < 24) return `${hours}h ago`;\n  \n  const days = Math.floor(hours / 24);\n  return `${days}d ago`;\n}",
      "description": "Converts timestamp to human-readable time ago"
    },
    
    "startReplyToMessage": {
      "code": "function startReplyToMessage(messageId) {\n  // Set global state to show reply UI\n  setGlobalState('replyingTo', messageId);\n  \n  // Focus the input field\n  document.querySelector('.message-input')?.focus();\n  \n  // Track analytics\n  if (window.analytics) {\n    window.analytics.track('Message Reply Started', { messageId });\n  }\n}",
      "description": "Initiates reply flow for a message"
    },
    
    "markMessageAsRead": {
      "code": "async function markMessageAsRead(messageId) {\n  try {\n    // Update local state immediately\n    updateGlobalState('messages', messages => \n      messages.map(msg => \n        msg.id === messageId \n          ? { ...msg, isRead: true }\n          : msg\n      )\n    );\n    \n    // Sync with server\n    await fetch(`/api/messages/${messageId}/read`, {\n      method: 'POST',\n      headers: { 'Authorization': `Bearer ${getAuthToken()}` }\n    });\n  } catch (error) {\n    console.error('Failed to mark message as read:', error);\n  }\n}",
      "description": "Marks a message as read locally and on server",
      "triggers": ["global:messages:item:viewed"]
    }
  }
}
```

### Generated React Code with Global State

```jsx
import React, { useMemo } from 'react';
import { useGlobalState } from '../hooks/useGlobalState';
import { formatTimeAgo, startReplyToMessage } from '../utils/globalFunctions.js';

/**
 * Chat message component with real-time updates
 * 
 * @component ChatMessage
 * @features real-time, global-state, custom-functions
 */
export default function ChatMessage({ message }) {
  const currentUser = useGlobalState('currentUser');
  
  // Simple expressions (sandboxed)
  const isOwnMessage = useMemo(() => 
    message.userId === currentUser?.id, 
    [message.userId, currentUser?.id]
  );
  
  const shouldShowAvatar = useMemo(() => 
    !isOwnMessage && message.showAvatar,
    [isOwnMessage, message.showAvatar]
  );
  
  // Custom function (full power)
  const timeAgo = formatTimeAgo(message.createdAt);
  
  // Event handlers
  const handleReply = () => {
    startReplyToMessage(message.id);
  };
  
  const messageClassName = `message ${isOwnMessage ? 'own' : 'other'}`;
  
  return (
    <div className={messageClassName}>
      {shouldShowAvatar && (
        <img 
          src={message.user.avatar} 
          alt={message.user.name}
          className="message-avatar"
        />
      )}
      
      <div className="message-content">
        {!isOwnMessage && (
          <div className="message-author">{message.user.name}</div>
        )}
        
        <div className="message-text">{message.text}</div>
        
        <div className="message-footer">
          <span className="message-time">{timeAgo}</span>
          <button onClick={handleReply} className="reply-button">
            Reply
          </button>
        </div>
      </div>
    </div>
  );
}
```

### Generated Global State Hook

```javascript
// src/hooks/useGlobalState.js
import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

/**
 * Global state management for Rise app
 * @generated from globalState schema
 */
export const useGlobalState = create(
  subscribeWithSelector((set, get) => ({
    // State
    currentUser: null,
    messages: [],
    replyingTo: null,
    
    // Actions
    setCurrentUser: (user) => set({ currentUser: user }),
    setMessages: (messages) => set({ messages }),
    updateGlobalState: (key, updater) => set((state) => ({
      [key]: typeof updater === 'function' ? updater(state[key]) : updater
    })),
    
    // Reset
    reset: () => set({
      currentUser: null,
      messages: [],
      replyingTo: null
    })
  }))
);

// Global state helpers for custom functions
window.setGlobalState = (key, value) => {
  useGlobalState.setState({ [key]: value });
};

window.updateGlobalState = (key, updater) => {
  useGlobalState.setState((state) => ({
    [key]: typeof updater === 'function' ? updater(state[key]) : updater
  }));
};

window.getGlobalState = (key) => {
  return useGlobalState.getState()[key];
};
```

---

## Example 4: E-commerce Product Card

### Complex Component with Multiple Features

```json
{
  "components": {
    "comp_product_card_001": {
      "id": "comp_product_card_001",
      "displayName": "ProductCard",
      "type": "composite",
      
      "properties": {
        "product": {
          "type": "prop",
          "dataType": "object",
          "required": true
        },
        
        "discountPercent": {
          "type": "expression",
          "expression": "product.originalPrice > product.price ? Math.round((1 - product.price / product.originalPrice) * 100) : 0",
          "dependencies": ["props.product.originalPrice", "props.product.price"]
        },
        
        "formattedPrice": {
          "type": "customFunction",
          "functionName": "formatCurrency",
          "args": ["props.product.price", "global.userSettings.currency"]
        },
        
        "isInWishlist": {
          "type": "expression",
          "expression": "global.wishlist.includes(product.id)",
          "dependencies": ["global.wishlist", "props.product.id"]
        },
        
        "stockStatus": {
          "type": "customFunction",
          "functionName": "getStockStatus",
          "args": ["props.product.stock"]
        }
      },
      
      "eventHandlers": {
        "onAddToCart": {
          "type": "customFunction",
          "functionName": "addToCart",
          "args": ["props.product", "1"]
        },
        
        "onToggleWishlist": {
          "type": "customFunction",
          "functionName": "toggleWishlist", 
          "args": ["props.product.id"]
        },
        
        "onQuickView": {
          "type": "customFunction",
          "functionName": "openProductModal",
          "args": ["props.product.id"]
        }
      }
    }
  },
  
  "globalFunctions": {
    "formatCurrency": {
      "code": "function formatCurrency(amount, currency = 'USD') {\n  return new Intl.NumberFormat('en-US', {\n    style: 'currency',\n    currency: currency\n  }).format(amount);\n}",
      "description": "Formats price according to user's currency preference"
    },
    
    "getStockStatus": {
      "code": "function getStockStatus(stock) {\n  if (stock === 0) return { text: 'Out of Stock', className: 'out-of-stock' };\n  if (stock < 5) return { text: `Only ${stock} left!`, className: 'low-stock' };\n  if (stock < 20) return { text: 'Limited Stock', className: 'limited-stock' };\n  return { text: 'In Stock', className: 'in-stock' };\n}",
      "description": "Returns stock status with appropriate styling"
    },
    
    "addToCart": {
      "code": "async function addToCart(product, quantity = 1) {\n  try {\n    // Optimistic update\n    updateGlobalState('cart', cart => {\n      const existingItem = cart.find(item => item.productId === product.id);\n      if (existingItem) {\n        return cart.map(item => \n          item.productId === product.id\n            ? { ...item, quantity: item.quantity + quantity }\n            : item\n        );\n      }\n      return [...cart, { productId: product.id, quantity, product }];\n    });\n    \n    // Sync with backend\n    await fetch('/api/cart/add', {\n      method: 'POST',\n      headers: { 'Content-Type': 'application/json' },\n      body: JSON.stringify({ productId: product.id, quantity })\n    });\n    \n    // Show success notification\n    showNotification(`${product.name} added to cart!`, 'success');\n    \n    // Track analytics\n    analytics.track('Product Added to Cart', {\n      productId: product.id,\n      productName: product.name,\n      price: product.price,\n      quantity\n    });\n  } catch (error) {\n    // Revert optimistic update\n    location.reload(); // Simple rollback for MVP\n    showNotification('Failed to add to cart', 'error');\n  }\n}",
      "description": "Adds product to cart with optimistic updates"
    }
  }
}
```

### Generated React Code

```jsx
import React, { useMemo } from 'react';
import { useGlobalState } from '../hooks/useGlobalState';
import { 
  formatCurrency, 
  getStockStatus, 
  addToCart, 
  toggleWishlist, 
  openProductModal 
} from '../utils/globalFunctions.js';

/**
 * E-commerce product card with cart, wishlist, and quick view
 * 
 * @component ProductCard
 * @features cart, wishlist, analytics, optimistic-updates
 */
export default function ProductCard({ product }) {
  const wishlist = useGlobalState('wishlist');
  const userSettings = useGlobalState('userSettings');
  
  // Simple expressions (sandboxed)
  const discountPercent = useMemo(() => {
    return product.originalPrice > product.price 
      ? Math.round((1 - product.price / product.originalPrice) * 100) 
      : 0;
  }, [product.originalPrice, product.price]);
  
  const isInWishlist = useMemo(() => 
    wishlist.includes(product.id),
    [wishlist, product.id]
  );
  
  // Custom functions (full power)
  const formattedPrice = formatCurrency(product.price, userSettings.currency);
  const stockStatus = getStockStatus(product.stock);
  
  // Event handlers
  const handleAddToCart = () => addToCart(product, 1);
  const handleToggleWishlist = () => toggleWishlist(product.id);
  const handleQuickView = () => openProductModal(product.id);
  
  return (
    <div className="product-card">
      <div className="product-image-container">
        <img src={product.image} alt={product.name} />
        
        {discountPercent > 0 && (
          <div className="discount-badge">
            {discountPercent}% OFF
          </div>
        )}
        
        <button 
          className={`wishlist-button ${isInWishlist ? 'active' : ''}`}
          onClick={handleToggleWishlist}
          aria-label={isInWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
        >
          ♥
        </button>
      </div>
      
      <div className="product-info">
        <h3 className="product-name">{product.name}</h3>
        
        <div className="product-price">
          <span className="current-price">{formattedPrice}</span>
          {discountPercent > 0 && (
            <span className="original-price">
              {formatCurrency(product.originalPrice, userSettings.currency)}
            </span>
          )}
        </div>
        
        <div className={`stock-status ${stockStatus.className}`}>
          {stockStatus.text}
        </div>
        
        <div className="product-actions">
          <button 
            className="add-to-cart-button"
            onClick={handleAddToCart}
            disabled={product.stock === 0}
          >
            Add to Cart
          </button>
          
          <button 
            className="quick-view-button"
            onClick={handleQuickView}
          >
            Quick View
          </button>
        </div>
      </div>
    </div>
  );
}
```

---

## Example 5: Form with Validation

### AI-Assisted Form Generation

**User Prompt**: "Create a contact form with name, email, message fields. Add validation and submit handling."

### Generated Schema with Validation

```json
{
  "components": {
    "comp_contact_form_001": {
      "id": "comp_contact_form_001", 
      "displayName": "ContactForm",
      "type": "form",
      "aiGenerated": true,
      
      "localState": {
        "formData": {
          "type": "object",
          "default": {
            "name": "",
            "email": "",
            "message": ""
          }
        },
        
        "errors": {
          "type": "object", 
          "default": {}
        },
        
        "isSubmitting": {
          "type": "boolean",
          "default": false
        }
      },
      
      "properties": {
        "isValid": {
          "type": "customFunction",
          "functionName": "validateContactForm",
          "args": ["state.formData"]
        },
        
        "submitButtonText": {
          "type": "expression",
          "expression": "isSubmitting ? 'Sending...' : 'Send Message'",
          "dependencies": ["state.isSubmitting"]
        }
      },
      
      "eventHandlers": {
        "onSubmit": {
          "type": "customFunction",
          "functionName": "submitContactForm",
          "args": ["state.formData", "setState"]
        },
        
        "onFieldChange": {
          "type": "customFunction",
          "functionName": "handleFieldChange",
          "args": ["fieldName", "value", "setState"]
        }
      }
    }
  },
  
  "globalFunctions": {
    "validateContactForm": {
      "code": "function validateContactForm(formData) {\n  const errors = {};\n  \n  if (!formData.name.trim()) {\n    errors.name = 'Name is required';\n  }\n  \n  if (!formData.email.trim()) {\n    errors.email = 'Email is required';\n  } else if (!/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(formData.email)) {\n    errors.email = 'Please enter a valid email';\n  }\n  \n  if (!formData.message.trim()) {\n    errors.message = 'Message is required';\n  } else if (formData.message.length < 10) {\n    errors.message = 'Message must be at least 10 characters';\n  }\n  \n  return {\n    isValid: Object.keys(errors).length === 0,\n    errors\n  };\n}",
      "aiGenerated": true,
      "description": "Validates contact form data and returns errors"
    },
    
    "submitContactForm": {
      "code": "async function submitContactForm(formData, setState) {\n  // Validate first\n  const validation = validateContactForm(formData);\n  \n  setState(prev => ({\n    ...prev,\n    errors: validation.errors\n  }));\n  \n  if (!validation.isValid) {\n    return;\n  }\n  \n  setState(prev => ({ ...prev, isSubmitting: true }));\n  \n  try {\n    const response = await fetch('/api/contact', {\n      method: 'POST',\n      headers: {\n        'Content-Type': 'application/json'\n      },\n      body: JSON.stringify(formData)\n    });\n    \n    if (!response.ok) {\n      throw new Error('Failed to send message');\n    }\n    \n    // Success\n    showNotification('Message sent successfully!', 'success');\n    \n    // Reset form\n    setState({\n      formData: { name: '', email: '', message: '' },\n      errors: {},\n      isSubmitting: false\n    });\n    \n  } catch (error) {\n    showNotification('Failed to send message. Please try again.', 'error');\n    setState(prev => ({ ...prev, isSubmitting: false }));\n  }\n}",
      "aiGenerated": true,
      "description": "Handles form submission with validation and error handling"
    },
    
    "handleFieldChange": {
      "code": "function handleFieldChange(fieldName, value, setState) {\n  setState(prev => ({\n    ...prev,\n    formData: {\n      ...prev.formData,\n      [fieldName]: value\n    },\n    // Clear error when user starts typing\n    errors: {\n      ...prev.errors,\n      [fieldName]: undefined\n    }\n  }));\n}",
      "aiGenerated": true,
      "description": "Handles form field changes and clears errors"
    }
  }
}
```

### Generated React Code

```jsx
import React, { useState, useMemo } from 'react';
import { 
  validateContactForm, 
  submitContactForm, 
  handleFieldChange 
} from '../utils/globalFunctions.js';

/**
 * Contact form with validation and submission handling
 * 
 * @component ContactForm
 * @generated AI-assisted form generation
 */
export default function ContactForm() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: ''
  });
  
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Custom function validation
  const validation = useMemo(() => 
    validateContactForm(formData), 
    [formData]
  );
  
  // Simple expression
  const submitButtonText = isSubmitting ? 'Sending...' : 'Send Message';
  
  // Combined state setter for custom functions
  const setState = (updater) => {
    if (typeof updater === 'function') {
      const newState = updater({ formData, errors, isSubmitting });
      if (newState.formData) setFormData(newState.formData);
      if (newState.errors !== undefined) setErrors(newState.errors);
      if (newState.isSubmitting !== undefined) setIsSubmitting(newState.isSubmitting);
    } else {
      if (updater.formData) setFormData(updater.formData);
      if (updater.errors !== undefined) setErrors(updater.errors);
      if (updater.isSubmitting !== undefined) setIsSubmitting(updater.isSubmitting);
    }
  };
  
  // Event handlers
  const handleSubmit = (e) => {
    e.preventDefault();
    submitContactForm(formData, setState);
  };
  
  const handleChange = (fieldName) => (e) => {
    handleFieldChange(fieldName, e.target.value, setState);
  };
  
  return (
    <form onSubmit={handleSubmit} className="contact-form">
      <div className="form-field">
        <label htmlFor="name">Name</label>
        <input
          id="name"
          type="text"
          value={formData.name}
          onChange={handleChange('name')}
          className={errors.name ? 'error' : ''}
        />
        {errors.name && <span className="error-message">{errors.name}</span>}
      </div>
      
      <div className="form-field">
        <label htmlFor="email">Email</label>
        <input
          id="email"
          type="email"
          value={formData.email}
          onChange={handleChange('email')}
          className={errors.email ? 'error' : ''}
        />
        {errors.email && <span className="error-message">{errors.email}</span>}
      </div>
      
      <div className="form-field">
        <label htmlFor="message">Message</label>
        <textarea
          id="message"
          value={formData.message}
          onChange={handleChange('message')}
          className={errors.message ? 'error' : ''}
          rows="5"
        />
        {errors.message && <span className="error-message">{errors.message}</span>}
      </div>
      
      <button 
        type="submit" 
        disabled={!validation.isValid || isSubmitting}
        className="submit-button"
      >
        {submitButtonText}
      </button>
    </form>
  );
}
```

---

## Key Patterns Demonstrated

### 1. **Two-Tier Expression System**
- **Simple expressions**: Safe, sandboxed JavaScript for basic properties
- **Custom functions**: Full power for complex logic, API calls, etc.

### 2. **AI Integration**
- AI generates component schemas from natural language
- AI provides code review and optimization suggestions
- User always has final control and can override AI

### 3. **Global State Management**
- Reactive global variables accessible from any component
- Custom functions can update global state
- Automatic dependency tracking

### 4. **Event Handling**
- Navigation, form submission, data updates
- Custom functions handle complex event logic
- Global triggers for system-wide events

### 5. **Plugin-Ready Architecture**
- Semantic component definitions
- Framework-agnostic property system
- Clean separation between manifest and generated code

---

## Next Steps

These examples show Rise's vision in action. The MVP will focus on:

1. **Core Visual Editor**: Component tree, basic properties
2. **Expression System**: Simple expressions + custom functions  
3. **React Code Generation**: Clean, documented output
4. **AI Assistance**: Component generation and code review
5. **Live Preview**: Hot reload and error handling

Future versions will add Vue/Svelte plugins, advanced debugging, and team collaboration features.

---

**See Also**:
- [Component Schema](./COMPONENT_SCHEMA.md) - Full schema specification
- [Security Model](./SECURITY.md) - Expression sandboxing details
- [MVP Roadmap](./MVP_ROADMAP.md) - Implementation timeline