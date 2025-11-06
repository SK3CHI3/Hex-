# 🎯 Hex AI - Agentic Mode Implementation Plan

**Date**: October 28, 2025  
**Status**: Planning Phase  
**Goal**: Transform Hex from conversational assistant to autonomous agent with tool capabilities

---

## 📊 Executive Summary

This document outlines the comprehensive plan to implement agentic capabilities in Hex AI, enabling it to autonomously execute security tools, perform multi-step workflows, and provide actionable cybersecurity testing.

### Current State Analysis

#### ✅ What We Have
1. **Solid Foundation**
   - React + TypeScript frontend with streaming responses
   - Direct DeepSeek API integration (V3.1-Terminus)
   - Supabase authentication & database
   - Real-time streaming UI
   - GitHub OAuth authentication
   - Premium subscription system via IntaSend
   
2. **Architecture**
   - Clean separation of concerns
   - Component-based UI (shadcn/ui)
   - Existing database schema for conversations/messages
   - Token management and context optimization
   - Mobile-responsive design

3. **Documentation**
   - Comprehensive agentic mode guide
   - Clear security considerations
   - Tool integration examples

#### ❌ What We're Missing
1. **No Function/Tool Calling** - AI can only chat, not execute actions
2. **No Command Execution** - Cannot run security tools
3. **No MCP Integration** - Missing standardized tool protocol
4. **No Multi-Step Planning** - Cannot break down complex tasks
5. **No Tool Visualization** - No UI for showing tool execution
6. **No Sandboxing** - No secure execution environment

---

## 🔬 Research Findings

### DeepSeek Function Calling Support

**Critical Discovery**: Based on research and the agentic mode guide, DeepSeek API supports function calling similar to OpenAI's format. The implementation follows this pattern:

```typescript
{
  model: 'deepseek-chat',
  messages: [...],
  tools: [
    {
      type: 'function',
      function: {
        name: 'tool_name',
        description: 'Tool description',
        parameters: {
          type: 'object',
          properties: {...},
          required: [...]
        }
      }
    }
  ],
  tool_choice: 'auto' // or 'none' or specific tool
}
```

### Response Format
When the AI wants to use a tool, it returns:
```typescript
{
  choices: [{
    delta: {
      tool_calls: [{
        id: 'call_123',
        type: 'function',
        function: {
          name: 'tool_name',
          arguments: '{"arg1": "value1"}'
        }
      }]
    }
  }]
}
```

---

## 🏗️ Architecture Design

### Three-Tier Approach

```
┌─────────────────────────────────────────────────────┐
│                   Frontend (React)                   │
│  - User Interface                                    │
│  - Tool Call Visualization                           │
│  - Streaming Response Handler                        │
└───────────────────┬─────────────────────────────────┘
                    │
                    │ API Calls
                    │
┌───────────────────▼─────────────────────────────────┐
│              DeepSeek API (Cloud)                    │
│  - Function Calling                                  │
│  - Streaming Responses                               │
│  - Tool Selection Logic                              │
└───────────────────┬─────────────────────────────────┘
                    │
                    │ Tool Execution Requests
                    │
┌───────────────────▼─────────────────────────────────┐
│           Tool Execution Layer (Backend)             │
│  - Command Validator                                 │
│  - Sandboxed Execution (Docker/Local)                │
│  - Result Parser                                     │
│  - Security Controls                                 │
└─────────────────────────────────────────────────────┘
```

### Component Breakdown

1. **Frontend Layer** (src/pages/Index.tsx)
   - Modified `sendMessage` function to handle tool calls
   - Tool execution UI components
   - Real-time tool status updates
   - Streaming response with tool call detection

2. **Tool Schema Layer** (src/lib/tools-schema.ts)
   - Security tool definitions
   - Parameter validation schemas
   - Tool metadata and descriptions

3. **Tool Execution Layer** (Backend options):
   - **Option A**: Netlify Functions (serverless)
   - **Option B**: Separate Node.js server
   - **Option C**: Client-side with limitations (safe tools only)

4. **Security Layer** (src/lib/security-validator.ts)
   - Command whitelisting
   - Parameter sanitization
   - Execution limits (timeout, resource caps)
   - Audit logging

---

## 📝 Implementation Phases

### Phase 1: Foundation (Week 1) - CURRENT FOCUS

#### 1.1 Create Tool Schemas ✅
**File**: `src/lib/tools-schema.ts`

Start with **3 safe tools** that don't require server-side execution:

1. **web_request** - Make HTTP requests for reconnaissance
2. **analyze_headers** - Parse HTTP headers for security info
3. **generate_report** - Create markdown security reports

```typescript
export const securityTools = [
  {
    type: 'function',
    function: {
      name: 'web_request',
      description: 'Make an HTTP request to analyze web endpoints',
      parameters: {
        type: 'object',
        properties: {
          url: {
            type: 'string',
            description: 'URL to request (e.g., https://example.com)'
          },
          method: {
            type: 'string',
            enum: ['GET', 'HEAD', 'OPTIONS'],
            description: 'HTTP method (safe methods only)'
          }
        },
        required: ['url']
      }
    }
  }
  // ... more tools
];
```

#### 1.2 Implement Client-Side Tool Executor ✅
**File**: `src/lib/tool-executor.ts`

Safe, browser-executable tools only:

```typescript
export async function executeTool(toolName: string, args: any) {
  switch (toolName) {
    case 'web_request':
      return await executeWebRequest(args);
    case 'analyze_headers':
      return await analyzeHeaders(args);
    case 'generate_report':
      return await generateReport(args);
    default:
      throw new Error(`Unknown tool: ${toolName}`);
  }
}
```

#### 1.3 Update Frontend for Tool Handling ✅
**File**: `src/pages/Index.tsx`

Modify `sendMessage` to:
1. Add `tools` parameter to API request
2. Detect tool calls in streaming response
3. Execute tools when requested
4. Send tool results back to AI
5. Continue conversation with tool outputs

#### 1.4 Create Tool UI Components ✅
**File**: `src/components/ToolExecution.tsx`

Show users when tools are being executed:
```
┌─────────────────────────────────────┐
│ 🔧 Executing: web_request           │
│ URL: https://example.com            │
│ Status: Running...                  │
│ ⏱️ Elapsed: 2.3s                    │
└─────────────────────────────────────┘
```

---

### Phase 2: Server-Side Tools (Week 2-3)

#### 2.1 Set Up Netlify Function
**File**: `netlify/functions/execute-tool.ts`

Create serverless function for secure tool execution:

```typescript
exports.handler = async (event) => {
  const { toolName, args, userId } = JSON.parse(event.body);
  
  // Validate user permissions
  // Execute tool in sandboxed environment
  // Return results
  
  return {
    statusCode: 200,
    body: JSON.stringify({ result: '...' })
  };
};
```

#### 2.2 Add Command Validator
**File**: `src/lib/security-validator.ts`

```typescript
export class CommandValidator {
  private allowedCommands = new Set([
    'nmap', 'dig', 'nslookup', 'whois', 'curl'
  ]);

  validate(command: string): ValidationResult {
    // Check whitelist
    // Check for dangerous patterns
    // Validate parameters
  }
}
```

#### 2.3 Implement Nmap Integration
Basic network scanning tool.

---

### Phase 3: Advanced Features (Week 4+)

#### 3.1 Docker Sandboxing
For full isolation and security.

#### 3.2 Multi-Step Planning
AI breaks down complex tasks into subtasks.

#### 3.3 Self-Correction
Retry failed operations with adjustments.

---

## 🔒 Security Approach

### Defense in Depth

```
Layer 1: Frontend Validation
  ↓ User input sanitization
  ↓ Parameter type checking
  
Layer 2: Tool Schema Validation
  ↓ Zod schema validation
  ↓ Allowed tool checking
  
Layer 3: Backend Validator
  ↓ Command whitelist
  ↓ Dangerous pattern detection
  
Layer 4: Execution Sandbox
  ↓ Docker container
  ↓ Resource limits
  ↓ Network isolation
  
Layer 5: Result Sanitization
  ↓ Output filtering
  ↓ Error message sanitization
```

### Security Rules

1. **Never Trust User Input** - Validate everything
2. **Whitelist, Don't Blacklist** - Only allow known-safe commands
3. **Principle of Least Privilege** - Minimal permissions
4. **Audit Everything** - Log all tool executions
5. **Fail Secure** - Default to deny on errors

---

## 📦 File Structure

```
src/
├── lib/
│   ├── tools-schema.ts          # Tool definitions (NEW)
│   ├── tool-executor.ts         # Tool execution logic (NEW)
│   ├── security-validator.ts    # Command validation (NEW)
│   ├── agentic-api.ts          # Modified API calls (NEW)
│   └── supabase.ts             # Existing
├── components/
│   ├── ToolExecution.tsx       # Tool UI component (NEW)
│   ├── ToolStatus.tsx          # Status indicator (NEW)
│   └── ui/                     # Existing shadcn components
├── pages/
│   └── Index.tsx               # Modified for tool handling
└── hooks/
    └── use-tools.ts            # Tool execution hook (NEW)

netlify/
└── functions/
    └── execute-tool.ts         # Serverless tool executor (NEW)

docs/
└── AGENTIC_IMPLEMENTATION_PLAN.md  # This file (NEW)
```

---

## 🎯 Phase 1 Detailed Implementation

### Step-by-Step Guide

#### Step 1: Create Tool Schemas (30 mins)

Create `src/lib/tools-schema.ts`:

```typescript
import { z } from 'zod';

// Zod schemas for validation
export const WebRequestSchema = z.object({
  url: z.string().url(),
  method: z.enum(['GET', 'HEAD', 'OPTIONS']).default('GET'),
  headers: z.record(z.string()).optional()
});

export const AnalyzeHeadersSchema = z.object({
  headers: z.record(z.string()),
  url: z.string().url()
});

export const GenerateReportSchema = z.object({
  findings: z.array(z.object({
    title: z.string(),
    severity: z.enum(['critical', 'high', 'medium', 'low', 'info']),
    description: z.string(),
    remediation: z.string()
  })),
  format: z.enum(['markdown', 'json']).default('markdown')
});

// Tool definitions for DeepSeek API
export const securityTools = [
  {
    type: 'function',
    function: {
      name: 'web_request',
      description: 'Make HTTP request to analyze web endpoints for security testing',
      parameters: {
        type: 'object',
        properties: {
          url: {
            type: 'string',
            description: 'Target URL to analyze'
          },
          method: {
            type: 'string',
            enum: ['GET', 'HEAD', 'OPTIONS'],
            description: 'HTTP method (safe methods only)'
          }
        },
        required: ['url']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'analyze_headers',
      description: 'Analyze HTTP headers for security issues',
      parameters: {
        type: 'object',
        properties: {
          headers: {
            type: 'object',
            description: 'HTTP response headers to analyze'
          },
          url: {
            type: 'string',
            description: 'URL where headers came from'
          }
        },
        required: ['headers', 'url']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'generate_report',
      description: 'Generate security testing report from findings',
      parameters: {
        type: 'object',
        properties: {
          findings: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                title: { type: 'string' },
                severity: { type: 'string', enum: ['critical', 'high', 'medium', 'low', 'info'] },
                description: { type: 'string' },
                remediation: { type: 'string' }
              }
            }
          },
          format: {
            type: 'string',
            enum: ['markdown', 'json'],
            default: 'markdown'
          }
        },
        required: ['findings']
      }
    }
  }
];

export type WebRequestArgs = z.infer<typeof WebRequestSchema>;
export type AnalyzeHeadersArgs = z.infer<typeof AnalyzeHeadersSchema>;
export type GenerateReportArgs = z.infer<typeof GenerateReportSchema>;
```

#### Step 2: Create Tool Executor (45 mins)

Create `src/lib/tool-executor.ts`:

```typescript
import {
  WebRequestSchema,
  AnalyzeHeadersSchema,
  GenerateReportSchema,
  type WebRequestArgs,
  type AnalyzeHeadersArgs,
  type GenerateReportArgs
} from './tools-schema';

export interface ToolExecutionResult {
  success: boolean;
  data?: any;
  error?: string;
  metadata?: {
    executionTime: number;
    toolName: string;
  };
}

class ToolExecutor {
  async execute(toolName: string, args: any): Promise<ToolExecutionResult> {
    const startTime = Date.now();
    
    try {
      let result;
      
      switch (toolName) {
        case 'web_request':
          result = await this.executeWebRequest(
            WebRequestSchema.parse(args)
          );
          break;
          
        case 'analyze_headers':
          result = await this.analyzeHeaders(
            AnalyzeHeadersSchema.parse(args)
          );
          break;
          
        case 'generate_report':
          result = await this.generateReport(
            GenerateReportSchema.parse(args)
          );
          break;
          
        default:
          throw new Error(`Unknown tool: ${toolName}`);
      }
      
      return {
        success: true,
        data: result,
        metadata: {
          executionTime: Date.now() - startTime,
          toolName
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        metadata: {
          executionTime: Date.now() - startTime,
          toolName
        }
      };
    }
  }

  private async executeWebRequest(args: WebRequestArgs): Promise<any> {
    try {
      const response = await fetch(args.url, {
        method: args.method || 'GET',
        headers: args.headers || {},
        // Add timeout
        signal: AbortSignal.timeout(10000)
      });

      const headers = Object.fromEntries(response.headers.entries());
      const contentType = response.headers.get('content-type');
      
      let body;
      if (contentType?.includes('application/json')) {
        body = await response.json();
      } else {
        body = await response.text();
      }

      return {
        status: response.status,
        statusText: response.statusText,
        headers,
        body,
        url: response.url
      };
    } catch (error) {
      throw new Error(`Web request failed: ${error.message}`);
    }
  }

  private async analyzeHeaders(args: AnalyzeHeadersArgs): Promise<any> {
    const securityHeaders = {
      'strict-transport-security': 'HSTS',
      'content-security-policy': 'CSP',
      'x-frame-options': 'Clickjacking Protection',
      'x-content-type-options': 'MIME Sniffing Protection',
      'x-xss-protection': 'XSS Protection',
      'referrer-policy': 'Referrer Policy',
      'permissions-policy': 'Permissions Policy'
    };

    const findings = [];
    const present = [];
    const missing = [];

    // Check for security headers
    for (const [header, name] of Object.entries(securityHeaders)) {
      if (args.headers[header] || args.headers[header.toUpperCase()]) {
        present.push({
          header: name,
          value: args.headers[header] || args.headers[header.toUpperCase()],
          status: 'present'
        });
      } else {
        missing.push({
          header: name,
          status: 'missing',
          severity: header === 'strict-transport-security' ? 'high' : 'medium'
        });
      }
    }

    // Check for information disclosure
    const disclosureHeaders = ['server', 'x-powered-by', 'x-aspnet-version'];
    const disclosed = [];
    
    for (const header of disclosureHeaders) {
      if (args.headers[header] || args.headers[header.toUpperCase()]) {
        disclosed.push({
          header,
          value: args.headers[header] || args.headers[header.toUpperCase()],
          risk: 'Information disclosure'
        });
      }
    }

    return {
      url: args.url,
      securityHeaders: {
        present,
        missing
      },
      informationDisclosure: disclosed,
      summary: {
        totalHeaders: Object.keys(args.headers).length,
        securityHeadersPresent: present.length,
        securityHeadersMissing: missing.length,
        securityScore: Math.round((present.length / Object.keys(securityHeaders).length) * 100)
      }
    };
  }

  private async generateReport(args: GenerateReportArgs): Promise<any> {
    if (args.format === 'json') {
      return {
        report: args.findings,
        metadata: {
          generatedAt: new Date().toISOString(),
          totalFindings: args.findings.length,
          severity: {
            critical: args.findings.filter(f => f.severity === 'critical').length,
            high: args.findings.filter(f => f.severity === 'high').length,
            medium: args.findings.filter(f => f.severity === 'medium').length,
            low: args.findings.filter(f => f.severity === 'low').length,
            info: args.findings.filter(f => f.severity === 'info').length
          }
        }
      };
    }

    // Generate Markdown report
    let markdown = '# Security Testing Report\n\n';
    markdown += `**Generated**: ${new Date().toLocaleString()}\n\n`;
    markdown += `**Total Findings**: ${args.findings.length}\n\n`;
    
    // Summary by severity
    const severityCounts = {
      critical: args.findings.filter(f => f.severity === 'critical').length,
      high: args.findings.filter(f => f.severity === 'high').length,
      medium: args.findings.filter(f => f.severity === 'medium').length,
      low: args.findings.filter(f => f.severity === 'low').length,
      info: args.findings.filter(f => f.severity === 'info').length
    };

    markdown += '## Severity Summary\n\n';
    markdown += `- 🔴 Critical: ${severityCounts.critical}\n`;
    markdown += `- 🟠 High: ${severityCounts.high}\n`;
    markdown += `- 🟡 Medium: ${severityCounts.medium}\n`;
    markdown += `- 🟢 Low: ${severityCounts.low}\n`;
    markdown += `- ℹ️ Info: ${severityCounts.info}\n\n`;

    markdown += '---\n\n## Detailed Findings\n\n';

    // Sort by severity
    const severityOrder = ['critical', 'high', 'medium', 'low', 'info'];
    const sortedFindings = args.findings.sort((a, b) => 
      severityOrder.indexOf(a.severity) - severityOrder.indexOf(b.severity)
    );

    sortedFindings.forEach((finding, index) => {
      const emoji = {
        critical: '🔴',
        high: '🟠',
        medium: '🟡',
        low: '🟢',
        info: 'ℹ️'
      }[finding.severity];

      markdown += `### ${index + 1}. ${finding.title}\n\n`;
      markdown += `**Severity**: ${emoji} ${finding.severity.toUpperCase()}\n\n`;
      markdown += `**Description**:\n${finding.description}\n\n`;
      markdown += `**Remediation**:\n${finding.remediation}\n\n`;
      markdown += '---\n\n';
    });

    return {
      markdown,
      metadata: {
        generatedAt: new Date().toISOString(),
        totalFindings: args.findings.length,
        severityCounts
      }
    };
  }
}

export const toolExecutor = new ToolExecutor();
```

#### Step 3: Update Index.tsx (1-2 hours)

Modify the `sendMessage` function in `src/pages/Index.tsx`:

```typescript
// Add imports at top
import { securityTools } from '@/lib/tools-schema';
import { toolExecutor, type ToolExecutionResult } from '@/lib/tool-executor';

// In the sendMessage function, update the request payload:
const requestPayload = {
  model: 'deepseek-chat',
  messages: conversationMessages,
  tools: securityTools, // ADD THIS
  tool_choice: 'auto',   // ADD THIS
  temperature: 0.7,
  max_tokens: 8192,
  stream: true
};

// In the streaming loop, detect tool calls:
for (const line of lines) {
  if (line.startsWith('data: ')) {
    const data = line.slice(6);
    if (data === '[DONE]') break;

    try {
      const parsed = JSON.parse(data);
      
      // Check for tool calls (NEW)
      if (parsed.choices?.[0]?.delta?.tool_calls) {
        const toolCalls = parsed.choices[0].delta.tool_calls;
        
        for (const toolCall of toolCalls) {
          // Show tool execution in UI
          addMessage('assistant', `🔧 Executing: ${toolCall.function.name}...`, false);
          
          // Execute the tool
          const result = await toolExecutor.execute(
            toolCall.function.name,
            JSON.parse(toolCall.function.arguments)
          );
          
          // Add tool result to conversation
          conversationMessages.push({
            role: 'tool',
            tool_call_id: toolCall.id,
            name: toolCall.function.name,
            content: JSON.stringify(result)
          });
          
          // Show result in UI
          addMessage('assistant', `✅ Tool completed in ${result.metadata?.executionTime}ms`, false);
        }
        
        // Continue conversation with tool results
        // (Make another API call with the tool results)
      }
      
      // Regular content handling (existing code)
      if (parsed.choices?.[0]?.delta?.content) {
        const content = parsed.choices[0].delta.content;
        fullContent += content;
        // ... existing streaming code
      }
    } catch (parseError) {
      console.warn('Failed to parse streaming chunk:', parseError);
    }
  }
}
```

---

## 🧪 Testing Strategy

### Test Scenarios

1. **Basic Tool Execution**
   - User: "Check the headers of example.com"
   - Expected: AI uses `web_request` tool, then `analyze_headers`

2. **Report Generation**
   - User: "Create a report of my findings"
   - Expected: AI uses `generate_report` with previous findings

3. **Error Handling**
   - User: "Check invalid-url"
   - Expected: Tool fails gracefully, AI explains the error

4. **Multi-Step Workflow**
   - User: "Analyze the security of example.com"
   - Expected: AI uses multiple tools in sequence

---

## 🚀 Deployment Considerations

### Environment Variables

```env
# Existing
VITE_DEEPSEEK_API_KEY=sk-...
VITE_SUPABASE_URL=https://...
VITE_SUPABASE_ANON_KEY=...

# New (for Phase 2)
NETLIFY_FUNCTION_SECRET=... # For securing serverless functions
DOCKER_SANDBOX_ENABLED=false # Enable Docker sandboxing
MAX_TOOL_EXECUTION_TIME=30000 # 30 seconds
```

### Netlify Configuration

Update `netlify.toml`:

```toml
[build]
  command = "npm run build"
  publish = "dist"
  functions = "netlify/functions"

[build.environment]
  NODE_VERSION = "18"

[[redirects]]
  from = "/api/*"
  to = "/.netlify/functions/:splat"
  status = 200
```

---

## 📚 Success Metrics

### Phase 1 (Client-Side Tools)
- ✅ Tools execute successfully
- ✅ Results are properly formatted
- ✅ UI shows tool execution status
- ✅ Error handling works correctly
- ✅ Tool results feed back into conversation

### Phase 2 (Server-Side Tools)
- ✅ Serverless functions work
- ✅ Commands are properly validated
- ✅ Execution is sandboxed
- ✅ Nmap integration works
- ✅ Results are sanitized

### Phase 3 (Full Autonomy)
- ✅ Multi-step workflows complete
- ✅ Self-correction works
- ✅ Complex task decomposition
- ✅ Performance is acceptable (<5s per tool)

---

## 🎓 Learning Resources

1. **DeepSeek API**: Official documentation for function calling
2. **Zod**: Schema validation library
3. **Docker**: Container security and sandboxing
4. **Netlify Functions**: Serverless execution
5. **Security Best Practices**: OWASP guidelines

---

## 🔄 Next Immediate Steps

1. ✅ Review this plan thoroughly
2. ⬜ Create `src/lib/tools-schema.ts`
3. ⬜ Create `src/lib/tool-executor.ts`
4. ⬜ Update `src/pages/Index.tsx` to handle tool calls
5. ⬜ Test with simple tool execution
6. ⬜ Create UI components for tool visualization
7. ⬜ Document usage examples

---

## 📝 Notes & Considerations

### Why Start with Client-Side Tools?

1. **Faster Development** - No need to set up servers
2. **Immediate Value** - Users can see agentic behavior right away
3. **Lower Risk** - Client-side tools are inherently safer
4. **Easier Testing** - Can test in browser dev tools
5. **Progressive Enhancement** - Add server-side tools later

### Limitations of Client-Side Approach

- Cannot execute actual command-line tools (nmap, metasploit, etc.)
- CORS restrictions may block some web requests
- No access to system resources
- Limited processing power

These limitations will be addressed in Phase 2 with server-side execution.

---

## 🎯 Decision Points

### Decision 1: MCP vs Direct Function Calling

**Recommendation**: Start with **Direct Function Calling**

**Reasoning**:
- Simpler to implement
- Works directly with DeepSeek API
- No additional infrastructure needed
- Can add MCP later if needed

### Decision 2: Client-Side vs Server-Side Execution

**Recommendation**: **Hybrid Approach**

**Phase 1**: Client-side for safe tools (web requests, analysis, reports)
**Phase 2**: Server-side for dangerous tools (nmap, scanning, exploitation)

### Decision 3: Docker vs Process Isolation

**Recommendation**: Start **without Docker**, add later

**Reasoning**:
- Docker adds complexity
- Not needed for Phase 1 (client-side tools)
- Can add in Phase 2 when implementing server-side tools
- Easier to develop and test without Docker

---

## 🔒 Final Security Checklist

Before deploying agentic features:

- [ ] All user inputs are validated
- [ ] Tool parameters are schema-validated (Zod)
- [ ] Command whitelist is in place
- [ ] Dangerous patterns are blocked
- [ ] Execution timeouts are enforced
- [ ] Error messages don't leak sensitive info
- [ ] Tool execution is logged
- [ ] Rate limiting is configured
- [ ] Premium users only have full access
- [ ] Free users have limited tool access

---

## 📞 Support & Questions

If you encounter issues during implementation:

1. Check this plan first
2. Review the agentic mode guide (`docs/AGENTIC_MODE_GUIDE.md`)
3. Check DeepSeek API documentation
4. Test with simple examples first
5. Add detailed logging to debug issues

---

**Ready to implement?** Let's start with Phase 1, Step 1! 🚀



