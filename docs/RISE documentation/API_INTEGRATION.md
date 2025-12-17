# API Integration Specification

> Managing AI provider integrations with cost control, fallbacks, and user transparency.

## Philosophy

Rise uses AI as a **copilot, not a replacement** for developer thinking. This means:

1. **User Controls AI**: Users decide when and how to use AI
2. **Transparent Costs**: Users always know what AI requests will cost
3. **Graceful Degradation**: Tool works without AI when needed
4. **Multiple Providers**: Not locked to single AI provider
5. **Privacy First**: User code never leaves their machine without consent

---

## Supported AI Providers

### Primary: Anthropic Claude

**Why Primary**:
- Best at code generation and understanding
- Excellent at following complex instructions
- Strong at component architecture reasoning
- Good at maintaining context across requests

**API Details**:
- **Endpoint**: `https://api.anthropic.com/v1/messages`
- **Model**: `claude-sonnet-4-20250514` (default)
- **Authentication**: API key (Bearer token)
- **Rate Limit**: 60 requests/minute per key

### Secondary: OpenAI (Future)

**Why Secondary**:
- Fallback if Claude unavailable
- Some users may prefer GPT-4
- Competitive pricing

**API Details**:
- **Endpoint**: `https://api.openai.com/v1/chat/completions`
- **Model**: `gpt-4-turbo` (when available)
- **Authentication**: API key (Bearer token)

### Offline: Local Model (Future Phase 3)

**Why Offline**:
- Privacy-sensitive users
- No internet dependency
- No usage costs

**Implementation**:
- Ollama integration
- Smaller model (e.g., CodeLlama 7B)
- Reduced capabilities but functional

---

## API Key Management

### Storage Architecture

```typescript
import keytar from 'keytar';
import { EventEmitter } from 'events';

class APIKeyManager extends EventEmitter {
  private readonly SERVICE_NAME = 'rise-builder';
  private readonly KEY_ROTATION_DAYS = 90;
  
  // Supported providers
  private readonly PROVIDERS = ['claude', 'openai'] as const;
  type Provider = typeof this.PROVIDERS[number];

  async storeKey(provider: Provider, apiKey: string): Promise<void> {
    // 1. Validate key format
    this.validateKeyFormat(provider, apiKey);

    // 2. Test key works
    await this.testKey(provider, apiKey);

    // 3. Store in OS keychain (encrypted)
    await keytar.setPassword(this.SERVICE_NAME, provider, apiKey);

    // 4. Record metadata (NOT the key!)
    await this.recordKeyMetadata(provider, {
      storedAt: new Date(),
      rotateAt: new Date(Date.now() + this.KEY_ROTATION_DAYS * 86400000),
      lastUsed: null,
      requestCount: 0,
    });

    this.emit('keyStored', { provider });
  }

  async getKey(provider: Provider): Promise<string | null> {
    try {
      const key = await keytar.getPassword(this.SERVICE_NAME, provider);
      
      if (!key) {
        return null;
      }

      // Check if key needs rotation
      const metadata = await this.getKeyMetadata(provider);
      if (metadata && new Date() > metadata.rotateAt) {
        this.emit('keyRotationNeeded', { provider, metadata });
      }

      // Update last used
      await this.updateLastUsed(provider);

      return key;
    } catch (error) {
      console.error('Error retrieving API key:', error);
      return null;
    }
  }

  async deleteKey(provider: Provider): Promise<void> {
    await keytar.deletePassword(this.SERVICE_NAME, provider);
    await this.deleteKeyMetadata(provider);
    this.emit('keyDeleted', { provider });
  }

  async hasKey(provider: Provider): Promise<boolean> {
    const key = await this.getKey(provider);
    return key !== null;
  }

  private validateKeyFormat(provider: Provider, key: string): void {
    const patterns: Record<Provider, RegExp> = {
      claude: /^sk-ant-api03-[a-zA-Z0-9_-]{95}$/,
      openai: /^sk-[a-zA-Z0-9]{48,}$/,
    };

    const pattern = patterns[provider];
    if (!pattern.test(key)) {
      throw new Error(`Invalid API key format for ${provider}`);
    }
  }

  private async testKey(provider: Provider, key: string): Promise<void> {
    // Make minimal test request
    try {
      const response = await this.makeTestRequest(provider, key);
      if (!response.ok) {
        throw new Error(`API key test failed: ${response.status}`);
      }
    } catch (error) {
      throw new Error(`Invalid API key: ${error.message}`);
    }
  }

  private async makeTestRequest(
    provider: Provider,
    key: string
  ): Promise<Response> {
    const endpoints = {
      claude: 'https://api.anthropic.com/v1/messages',
      openai: 'https://api.openai.com/v1/chat/completions',
    };

    const endpoint = endpoints[provider];
    
    if (provider === 'claude') {
      return fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': key,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 10,
          messages: [{ role: 'user', content: 'test' }],
        }),
      });
    } else {
      return fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${key}`,
        },
        body: JSON.stringify({
          model: 'gpt-4-turbo',
          max_tokens: 10,
          messages: [{ role: 'user', content: 'test' }],
        }),
      });
    }
  }
}
```

### User Flow: Adding API Key

```
┌────────────────────────────────────────────────┐
│ Settings → AI Providers                        │
├────────────────────────────────────────────────┤
│                                                │
│ Claude (Anthropic)              [Not Set]     │
│ ┌────────────────────────────────────────────┐ │
│ │ API Key: [sk-ant-api03-*************]     │ │
│ │                                            │ │
│ │ [Test Connection] [Save]                  │ │
│ └────────────────────────────────────────────┘ │
│                                                │
│ ⚠️ Your API key is stored securely in your    │
│    system keychain and never sent to Rise     │
│    servers. You can delete it anytime.        │
│                                                │
│ Budget: $10/day [Change]                       │
│ Usage: $2.47 / $10.00 (24.7%)                 │
│                                                │
└────────────────────────────────────────────────┘
```

---

## Cost Management

### Usage Tracking

```typescript
interface UsageRecord {
  provider: 'claude' | 'openai';
  timestamp: Date;
  promptTokens: number;
  completionTokens: number;
  estimatedCost: number;
  feature: 'component-generation' | 'code-review' | 'optimization' | 'chat';
}

class UsageTracker {
  private readonly DAILY_BUDGET_DEFAULT = 10; // $10 USD
  private dailyUsage = new Map<string, UsageRecord[]>();

  async trackRequest(record: UsageRecord): Promise<void> {
    const today = this.getToday();
    const records = this.dailyUsage.get(today) || [];
    records.push(record);
    this.dailyUsage.set(today, records);

    // Persist to disk
    await this.saveToDisk();

    // Calculate today's total
    const totalCost = this.calculateTotalCost(records);
    const budget = await this.getDailyBudget();

    // Emit events for UI updates
    this.emit('usageUpdated', {
      totalCost,
      budget,
      percentage: (totalCost / budget) * 100,
      remainingBudget: budget - totalCost,
    });

    // Warn at 80%
    if (totalCost >= budget * 0.8 && totalCost < budget) {
      this.emit('budgetWarning', {
        totalCost,
        budget,
        percentage: 80,
      });
    }

    // Block at 100%
    if (totalCost >= budget) {
      this.emit('budgetExceeded', {
        totalCost,
        budget,
      });
      throw new Error(
        `Daily API budget exceeded ($${totalCost.toFixed(2)} / $${budget})`
      );
    }
  }

  async estimateCost(
    provider: 'claude' | 'openai',
    promptLength: number
  ): Promise<CostEstimate> {
    // Approximate tokens (1 token ≈ 4 characters)
    const promptTokens = Math.ceil(promptLength / 4);
    const completionTokens = promptTokens * 2; // Assume 2x response

    // Pricing (as of 2025)
    const pricing = {
      claude: {
        prompt: 0.000003, // $3 per 1M input tokens
        completion: 0.000015, // $15 per 1M output tokens
      },
      openai: {
        prompt: 0.00001, // $10 per 1M input tokens
        completion: 0.00003, // $30 per 1M output tokens
      },
    };

    const rates = pricing[provider];
    const cost =
      promptTokens * rates.prompt + completionTokens * rates.completion;

    const remaining = await this.getRemainingBudget();

    return {
      provider,
      promptTokens,
      completionTokens,
      estimatedCost: cost,
      remainingBudget: remaining,
      canAfford: cost <= remaining,
    };
  }

  async getRemainingBudget(): Promise<number> {
    const today = this.getToday();
    const records = this.dailyUsage.get(today) || [];
    const totalCost = this.calculateTotalCost(records);
    const budget = await this.getDailyBudget();
    return Math.max(0, budget - totalCost);
  }

  private calculateTotalCost(records: UsageRecord[]): number {
    return records.reduce((sum, record) => sum + record.estimatedCost, 0);
  }

  private getToday(): string {
    return new Date().toISOString().split('T')[0];
  }

  async getDailyBudget(): Promise<number> {
    // Load from user settings
    const settings = await this.loadSettings();
    return settings.dailyBudget || this.DAILY_BUDGET_DEFAULT;
  }

  async setDailyBudget(amount: number): Promise<void> {
    if (amount <= 0) {
      throw new Error('Budget must be positive');
    }
    if (amount > 100) {
      throw new Error('Budget cannot exceed $100/day for safety');
    }

    const settings = await this.loadSettings();
    settings.dailyBudget = amount;
    await this.saveSettings(settings);

    this.emit('budgetUpdated', { newBudget: amount });
  }
}
```

### Cost Estimation UI

Before making AI request, show user:

```
┌────────────────────────────────────────────────┐
│ Generate Component with AI                     │
├────────────────────────────────────────────────┤
│                                                │
│ Prompt:                                        │
│ ┌────────────────────────────────────────────┐ │
│ │ Create a UserCard component with avatar,  │ │
│ │ name, email, and bio. Include hover state │ │
│ │ and click handler.                         │ │
│ └────────────────────────────────────────────┘ │
│                                                │
│ Estimated Cost: $0.0015                        │
│ Remaining Budget: $7.53 / $10.00 (75.3%)      │
│                                                │
│ [Cancel] [Generate - $0.0015]                 │
└────────────────────────────────────────────────┘
```

---

## AI Request Flow

### Component Generation Request

```typescript
class AIComponentGenerator {
  constructor(
    private keyManager: APIKeyManager,
    private usageTracker: UsageTracker
  ) {}

  async generateComponent(
    prompt: string,
    context: ComponentContext
  ): Promise<ComponentSchema> {
    // 1. Check if API key exists
    const hasKey = await this.keyManager.hasKey('claude');
    if (!hasKey) {
      throw new Error('No API key configured. Please add key in Settings.');
    }

    // 2. Estimate cost
    const estimate = await this.usageTracker.estimateCost(
      'claude',
      prompt.length
    );

    if (!estimate.canAfford) {
      throw new Error(
        `Insufficient budget. Cost: $${estimate.estimatedCost.toFixed(4)}, ` +
        `Remaining: $${estimate.remainingBudget.toFixed(2)}`
      );
    }

    // 3. Show confirmation to user (in UI)
    // (UI layer handles this)

    // 4. Get API key
    const apiKey = await this.keyManager.getKey('claude');
    if (!apiKey) {
      throw new Error('Failed to retrieve API key');
    }

    // 5. Build request
    const request = this.buildComponentGenerationRequest(prompt, context);

    // 6. Make API call
    const response = await this.makeClaudeRequest(apiKey, request);

    // 7. Track usage
    await this.usageTracker.trackRequest({
      provider: 'claude',
      timestamp: new Date(),
      promptTokens: response.usage.input_tokens,
      completionTokens: response.usage.output_tokens,
      estimatedCost: this.calculateCost(response.usage),
      feature: 'component-generation',
    });

    // 8. Parse response
    const componentSchema = this.parseComponentResponse(response.content);

    return componentSchema;
  }

  private buildComponentGenerationRequest(
    prompt: string,
    context: ComponentContext
  ): ClaudeRequest {
    return {
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      messages: [
        {
          role: 'user',
          content: this.buildPrompt(prompt, context),
        },
      ],
      temperature: 0.3, // Lower for more consistent output
    };
  }

  private buildPrompt(prompt: string, context: ComponentContext): string {
    return `
You are a React component architect. Generate a component schema based on this request.

User Request: ${prompt}

Context:
- Framework: ${context.framework}
- Schema Level: ${context.schemaLevel}
- Available Components: ${context.availableComponents.join(', ')}
- Global Functions: ${context.globalFunctions.join(', ')}

Requirements:
1. Return ONLY valid JSON matching Rise component schema
2. Use schema level ${context.schemaLevel} features only
3. Follow React best practices
4. Include proper prop types and defaults
5. Add helpful comments in aiDescription fields

Response format:
{
  "id": "comp_[name]_001",
  "displayName": "[ComponentName]",
  "type": "PrimitiveComponent",
  "aiDescription": "Brief description of component purpose",
  "properties": { ... },
  "styling": { ... }
}

Generate component schema:
`;
  }

  private async makeClaudeRequest(
    apiKey: string,
    request: ClaudeRequest
  ): Promise<ClaudeResponse> {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Claude API error: ${error.error?.message || response.statusText}`);
    }

    return response.json();
  }

  private parseComponentResponse(content: string): ComponentSchema {
    // Extract JSON from response (handle markdown code blocks)
    let json = content.trim();
    
    // Remove markdown code blocks
    json = json.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

    try {
      const schema = JSON.parse(json);
      
      // Validate schema
      const validator = new SchemaValidator();
      const result = validator.validate(schema);
      
      if (!result.isValid) {
        throw new Error(`Invalid schema: ${result.errors[0].message}`);
      }

      return schema;
    } catch (error) {
      throw new Error(`Failed to parse AI response: ${error.message}`);
    }
  }

  private calculateCost(usage: { input_tokens: number; output_tokens: number }): number {
    const CLAUDE_INPUT_COST = 0.000003; // $3 per 1M tokens
    const CLAUDE_OUTPUT_COST = 0.000015; // $15 per 1M tokens

    return (
      usage.input_tokens * CLAUDE_INPUT_COST +
      usage.output_tokens * CLAUDE_OUTPUT_COST
    );
  }
}
```

---

## Rate Limiting

### Request Throttling

```typescript
class RateLimiter {
  private readonly MAX_REQUESTS_PER_MINUTE = 60;
  private readonly MAX_REQUESTS_PER_HOUR = 1000;
  
  private minuteRequests: Date[] = [];
  private hourRequests: Date[] = [];

  async checkLimit(): Promise<void> {
    const now = new Date();
    
    // Clean old requests
    this.cleanOldRequests(now);

    // Check minute limit
    if (this.minuteRequests.length >= this.MAX_REQUESTS_PER_MINUTE) {
      const oldestRequest = this.minuteRequests[0];
      const waitTime = 60000 - (now.getTime() - oldestRequest.getTime());
      
      throw new Error(
        `Rate limit exceeded. Please wait ${Math.ceil(waitTime / 1000)} seconds.`
      );
    }

    // Check hour limit
    if (this.hourRequests.length >= this.MAX_REQUESTS_PER_HOUR) {
      const oldestRequest = this.hourRequests[0];
      const waitTime = 3600000 - (now.getTime() - oldestRequest.getTime());
      
      throw new Error(
        `Hourly rate limit exceeded. Please wait ${Math.ceil(waitTime / 60000)} minutes.`
      );
    }

    // Record this request
    this.minuteRequests.push(now);
    this.hourRequests.push(now);
  }

  private cleanOldRequests(now: Date): void {
    const oneMinuteAgo = now.getTime() - 60000;
    const oneHourAgo = now.getTime() - 3600000;

    this.minuteRequests = this.minuteRequests.filter(
      (date) => date.getTime() > oneMinuteAgo
    );

    this.hourRequests = this.hourRequests.filter(
      (date) => date.getTime() > oneHourAgo
    );
  }

  getRemainingRequests(): { perMinute: number; perHour: number } {
    return {
      perMinute: this.MAX_REQUESTS_PER_MINUTE - this.minuteRequests.length,
      perHour: this.MAX_REQUESTS_PER_HOUR - this.hourRequests.length,
    };
  }
}
```

---

## Error Handling & Retry Logic

### Exponential Backoff

```typescript
class APIClient {
  private readonly MAX_RETRIES = 3;
  private readonly BASE_DELAY = 1000; // 1 second

  async makeRequestWithRetry<T>(
    requestFn: () => Promise<T>
  ): Promise<T> {
    let lastError: Error;

    for (let attempt = 0; attempt < this.MAX_RETRIES; attempt++) {
      try {
        return await requestFn();
      } catch (error) {
        lastError = error;

        // Don't retry on auth errors or invalid requests
        if (this.isNonRetryableError(error)) {
          throw error;
        }

        // Calculate backoff delay
        const delay = this.BASE_DELAY * Math.pow(2, attempt);
        
        console.warn(
          `API request failed (attempt ${attempt + 1}/${this.MAX_RETRIES}). ` +
          `Retrying in ${delay}ms...`
        );

        await this.sleep(delay);
      }
    }

    throw new Error(
      `API request failed after ${this.MAX_RETRIES} attempts: ${lastError.message}`
    );
  }

  private isNonRetryableError(error: any): boolean {
    // Don't retry on these errors
    const nonRetryableStatuses = [400, 401, 403, 404, 422];
    
    if (error.status && nonRetryableStatuses.includes(error.status)) {
      return true;
    }

    // Invalid API key
    if (error.message?.includes('invalid_api_key')) {
      return true;
    }

    return false;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
```

### User-Friendly Error Messages

```typescript
class AIErrorHandler {
  formatErrorForUser(error: Error): UserFriendlyError {
    // API key errors
    if (error.message.includes('invalid_api_key')) {
      return {
        title: 'Invalid API Key',
        message: 'Your API key is not valid. Please check and update it in Settings.',
        action: 'Open Settings',
        severity: 'error',
      };
    }

    // Rate limit errors
    if (error.message.includes('rate limit')) {
      return {
        title: 'Rate Limit Reached',
        message: 'You\'ve made too many requests. Please wait a moment and try again.',
        action: null,
        severity: 'warning',
      };
    }

    // Budget errors
    if (error.message.includes('budget exceeded')) {
      return {
        title: 'Daily Budget Exceeded',
        message: 'You\'ve reached your daily AI usage budget of $10. Increase budget or try tomorrow.',
        action: 'Increase Budget',
        severity: 'warning',
      };
    }

    // Network errors
    if (error.message.includes('network') || error.message.includes('timeout')) {
      return {
        title: 'Connection Error',
        message: 'Unable to connect to AI service. Check your internet connection.',
        action: 'Retry',
        severity: 'error',
      };
    }

    // Server errors (5xx)
    if (error.message.includes('500') || error.message.includes('503')) {
      return {
        title: 'Service Unavailable',
        message: 'The AI service is temporarily unavailable. Please try again later.',
        action: 'Retry',
        severity: 'warning',
      };
    }

    // Generic error
    return {
      title: 'AI Request Failed',
      message: error.message || 'An unexpected error occurred.',
      action: 'Retry',
      severity: 'error',
    };
  }
}
```

---

## Fallback Strategy

### Provider Cascading

```typescript
class AIService {
  private providers: AIProvider[] = [];

  constructor(
    private keyManager: APIKeyManager,
    private usageTracker: UsageTracker
  ) {
    // Order matters: try in sequence
    this.providers = [
      new ClaudeProvider(keyManager, usageTracker),
      new OpenAIProvider(keyManager, usageTracker),
      new OfflineFallback(),
    ];
  }

  async generateComponent(prompt: string): Promise<ComponentSchema> {
    let lastError: Error;

    for (const provider of this.providers) {
      try {
        // Check if provider is available
        if (!await provider.isAvailable()) {
          continue;
        }

        // Try this provider
        const result = await provider.generateComponent(prompt);
        
        // Success!
        return result;
      } catch (error) {
        lastError = error;
        console.warn(`Provider ${provider.name} failed: ${error.message}`);
      }
    }

    // All providers failed
    throw new Error(
      `All AI providers failed. Last error: ${lastError.message}`
    );
  }
}

class OfflineFallback implements AIProvider {
  name = 'offline-fallback';

  async isAvailable(): Promise<boolean> {
    return true; // Always available
  }

  async generateComponent(prompt: string): Promise<ComponentSchema> {
    // Provide basic template instead of AI generation
    return this.generateBasicTemplate(prompt);
  }

  private generateBasicTemplate(prompt: string): ComponentSchema {
    // Parse prompt for hints
    const name = this.extractComponentName(prompt);

    return {
      id: `comp_${name.toLowerCase()}_001`,
      displayName: name,
      type: 'PrimitiveComponent',
      aiDescription: `Basic template for ${name} (generated offline)`,
      properties: {
        children: {
          type: 'prop',
          dataType: 'node',
        },
      },
      metadata: {
        generatedBy: 'offline-fallback',
        userPrompt: prompt,
      },
    };
  }

  private extractComponentName(prompt: string): string {
    // Try to extract component name from prompt
    const match = prompt.match(/create (?:a |an )?([A-Za-z]+)/i);
    return match ? match[1] : 'Component';
  }
}
```

---

## Privacy & Data Handling

### What Gets Sent to AI

```typescript
interface AIRequestData {
  // ✅ Sent to AI
  userPrompt: string;
  componentContext: {
    framework: string;
    availableComponents: string[]; // Names only
    schemaLevel: number;
  };

  // ❌ Never sent to AI
  apiKeys: never;
  userCredentials: never;
  fileSystemPaths: never;
  environmentVariables: never;
  userPersonalInfo: never;
}
```

### User Consent

```
┌────────────────────────────────────────────────┐
│ AI Component Generation                        │
├────────────────────────────────────────────────┤
│                                                │
│ Your prompt will be sent to Claude AI:        │
│ ┌────────────────────────────────────────────┐ │
│ │ Create a UserCard with avatar and name    │ │
│ └────────────────────────────────────────────┘ │
│                                                │
│ ℹ️ What gets sent:                            │
│   • Your prompt                                │
│   • Available component names                  │
│   • Framework (React)                          │
│                                                │
│ ℹ️ What stays private:                        │
│   • Your API keys                              │
│   • Your code                                  │
│   • Your file paths                            │
│                                                │
│ [Cancel] [Send to AI]                         │
└────────────────────────────────────────────────┘
```

---

## Usage Analytics (Local Only)

### What We Track (Locally)

```typescript
interface LocalAnalytics {
  // Track locally for user insights
  totalRequests: number;
  totalCost: number;
  averageCost: number;
  featureUsage: {
    'component-generation': number;
    'code-review': number;
    'optimization': number;
  };
  successRate: number;
  
  // Never sent to Rise servers
  neverShared: never;
}
```

### Analytics Dashboard

```
┌────────────────────────────────────────────────┐
│ AI Usage Dashboard (This Month)                │
├────────────────────────────────────────────────┤
│                                                │
│ Total Requests: 147                            │
│ Total Cost: $12.34                             │
│ Avg Cost/Request: $0.084                       │
│                                                │
│ Feature Usage:                                 │
│ • Component Generation: 89 (60.5%)            │
│ • Code Review: 42 (28.6%)                     │
│ • Optimization: 16 (10.9%)                    │
│                                                │
│ Success Rate: 94.6%                            │
│                                                │
│ [Export Data] [Reset Stats]                   │
└────────────────────────────────────────────────┘
```

---

## Conclusion

This API integration strategy ensures:

1. **User Control**: Users always decide when and how to use AI
2. **Cost Transparency**: Clear visibility into costs before and after requests
3. **Privacy Protection**: User data never leaves their machine without consent
4. **Graceful Degradation**: Tool works without AI when needed
5. **Multiple Providers**: Flexibility to use different AI services

**Critical**: All API interactions must respect user privacy and provide cost transparency.

---

**See Also**:
- [SECURITY_SPEC.md](./SECURITY_SPEC.md) - API key security
- [COMPONENT_SCHEMA.md](./COMPONENT_SCHEMA.md) - AI-generated schemas
- [EXPRESSION_SYSTEM.md](./EXPRESSION_SYSTEM.md) - AI assistance for expressions

---

**Last Updated**: October 25, 2025  
**Status**: ✅ Complete - Ready for Implementation  
**Review Required**: Security Lead & Product Manager