# MCP Migration Plan: DeepSeek + MCP Adapter

**Status:** Planning Phase - NOT STARTED
**Created:** 2025-01-28
**Target Completion:** TBD

---

## Executive Summary

Migrate Hex AI from direct DeepSeek API integration to Model Context Protocol (MCP) architecture while maintaining DeepSeek as the LLM provider. This will provide better architecture, standardization, and tool management while keeping costs low.

---

## 1. Current Architecture Analysis

### 1.1 Current Flow
```
┌─────────────┐         ┌──────────────┐        ┌────────────┐
│   Frontend  │────────▶│  DeepSeek    │◀───────│   Tools    │
│  (React)    │  HTTP   │     API      │        │  (Docker)  │
└─────────────┘         └──────────────┘        └────────────┘
       │                                                │
       │                                                │
       └──────────────── WebSocket ────────────────────┘
              (Direct Tool Execution)
```

### 1.2 Current Components

#### **Frontend (`src/pages/Index.tsx`)**
- Direct DeepSeek API calls via `fetch()` to `https://api.deepseek.com/chat/completions`
- Handles streaming responses
- Manages function calling with `professionalSecurityTools` schema
- Lines 648-676: Core API integration

#### **Tool Schema (`src/lib/tools-schema.ts`)**
- OpenAI-compatible function calling format
- 17 security tools defined
- Tool-to-command mapping in `toolCommandMap`

#### **Tool Execution (`src/hooks/use-tool-execution.ts`)**
- WebSocket connection to backend execution server
- Real-time command streaming
- Exit code and output handling
- Auto-reconnection with exponential backoff

#### **Backend Server (`server/index.js`)**
- Express + WebSocket server on port 8081
- Executes commands in Docker container `hex-kali-tools`
- Supabase authentication
- Command validation and security checks
- Real-time stdout/stderr streaming

### 1.3 Current Pain Points
1. ❌ **Tight coupling** - Frontend directly calls DeepSeek API
2. ❌ **No abstraction** - Tool schema is DeepSeek-specific
3. ❌ **Hard to switch** - Can't easily swap LLM providers
4. ❌ **No tool discovery** - Tools are hardcoded
5. ❌ **Complex error handling** - Frontend manages all API logic
6. ✅ **Good**: Low cost with DeepSeek
7. ✅ **Good**: Real-time tool execution works well

---

## 2. Target MCP Architecture

### 2.1 New Flow
```
┌─────────────┐        ┌──────────────┐        ┌────────────────┐       ┌────────────┐
│   Frontend  │───────▶│  MCP Client  │───────▶│   MCP Server   │──────▶│   Tools    │
│  (React)    │  HTTP  │ (DeepSeek)   │  MCP   │  (Pentesting)  │ spawn │  (Docker)  │
└─────────────┘        └──────────────┘        └────────────────┘       └────────────┘
                              │                         │
                              │                         │
                              └─── Standardized MCP ────┘
                                   Protocol Messages
```

### 2.2 New Components

#### **A. Frontend MCP Client** (New)
- **Location**: `src/lib/mcp-client.ts`
- **Purpose**: Abstracts LLM communication via MCP
- **Responsibilities**:
  - Connect to MCP server via SSE or WebSocket
  - Send user messages
  - Receive streaming responses
  - Handle tool calls via MCP protocol
  - Provider-agnostic interface

#### **B. DeepSeek MCP Adapter** (New)
- **Location**: `server/mcp-adapter/`
- **Purpose**: Translate between MCP protocol and DeepSeek API
- **Responsibilities**:
  - Accept MCP messages
  - Convert to DeepSeek API format
  - Stream DeepSeek responses
  - Translate DeepSeek tool calls to MCP tool calls
  - Maintain conversation context

#### **C. MCP Tool Server** (Modified from existing)
- **Location**: `server/mcp-server/`
- **Purpose**: Expose pentesting tools via MCP protocol
- **Responsibilities**:
  - Register tools in MCP format
  - Handle tool execution requests
  - Stream tool outputs
  - Maintain tool state
  - Security validation

#### **D. Tool Executor** (Keep existing)
- **Location**: `server/index.js` (refactored)
- **Purpose**: Execute commands in Docker
- **Responsibilities**: (Same as current)
  - Docker command execution
  - Output streaming
  - Timeout management
  - Process cleanup

### 2.3 MCP Protocol Messages

#### Tool Definition (MCP Format)
```json
{
  "name": "nmap_scan",
  "description": "Perform network reconnaissance using Nmap",
  "inputSchema": {
    "type": "object",
    "properties": {
      "target": {"type": "string"},
      "scan_type": {"type": "string", "enum": ["ping", "quick", "full"]}
    },
    "required": ["target", "scan_type"]
  }
}
```

#### Tool Call Request (MCP)
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/call",
  "params": {
    "name": "nmap_scan",
    "arguments": {
      "target": "example.com",
      "scan_type": "quick"
    }
  }
}
```

#### Tool Call Response (MCP)
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "content": [
      {
        "type": "text",
        "text": "Nmap scan results..."
      }
    ],
    "isError": false
  }
}
```

---

## 3. Detailed Migration Steps

### Phase 1: MCP Tool Server Setup
**Goal**: Convert existing tool execution to MCP server

**Files to Create:**
- `server/mcp-server/index.js` - Main MCP server
- `server/mcp-server/tools.js` - Tool definitions in MCP format
- `server/mcp-server/executor.js` - Tool execution handler

**Files to Modify:**
- `server/package.json` - Add MCP SDK: `@modelcontextprotocol/sdk`

**Steps:**
1. Install MCP SDK: `npm install @modelcontextprotocol/sdk`
2. Create MCP server using `@modelcontextprotocol/sdk/server`
3. Convert `professionalSecurityTools` to MCP tool format
4. Implement tool handlers that call existing Docker executor
5. Add stdio transport for MCP communication
6. Test tool discovery and execution locally

**Verification:**
```bash
# Test MCP server
node server/mcp-server/index.js

# Should list all tools
curl http://localhost:8082/mcp/tools

# Should execute tool
curl -X POST http://localhost:8082/mcp/tools/call \
  -H "Content-Type: application/json" \
  -d '{"name": "nmap_scan", "arguments": {"target": "localhost", "scan_type": "ping"}}'
```

---

### Phase 2: DeepSeek MCP Adapter
**Goal**: Create adapter between DeepSeek API and MCP

**Files to Create:**
- `server/mcp-adapter/deepseek-adapter.js` - Main adapter
- `server/mcp-adapter/message-translator.js` - Format conversion
- `server/mcp-adapter/streaming-handler.js` - Streaming responses

**Steps:**
1. Create adapter server that accepts MCP messages
2. Translate MCP messages to DeepSeek API format
3. Forward to DeepSeek API with streaming
4. Translate DeepSeek tool calls back to MCP format
5. Stream responses in MCP format
6. Handle errors and retries

**Key Code Structure:**
```javascript
class DeepSeekMCPAdapter {
  async sendMessage(mcpMessage) {
    // 1. Translate MCP → DeepSeek format
    const deepseekRequest = this.translateToDeepSeek(mcpMessage);
    
    // 2. Call DeepSeek API
    const response = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${apiKey}` },
      body: JSON.stringify(deepseekRequest)
    });
    
    // 3. Stream and translate DeepSeek → MCP
    return this.streamResponse(response);
  }
}
```

---

### Phase 3: Frontend MCP Client
**Goal**: Replace direct API calls with MCP client

**Files to Create:**
- `src/lib/mcp-client.ts` - MCP client wrapper
- `src/hooks/use-mcp.ts` - React hook for MCP

**Files to Modify:**
- `src/pages/Index.tsx` - Replace DeepSeek API calls
- `src/lib/tools-schema.ts` - Convert to MCP format (or remove if server handles)

**Steps:**
1. Create MCP client that connects to adapter
2. Implement message sending/receiving
3. Handle streaming responses
4. Tool call handling via MCP
5. Replace DeepSeek API calls in Index.tsx
6. Test end-to-end flow

**New Hook Usage:**
```typescript
const { sendMessage, isConnected, messages } = useMCP({
  serverUrl: 'http://localhost:8083', // MCP adapter URL
  onToolCall: (toolName, args) => {
    // Handle tool execution
  }
});
```

---

### Phase 4: Integration & Testing
**Goal**: Wire everything together and test

**Steps:**
1. Start all servers:
   - MCP Tool Server (port 8082)
   - DeepSeek Adapter (port 8083)
   - Docker executor (existing port 8081)
2. Update frontend to connect to MCP adapter
3. Test complete flow: User message → DeepSeek → Tool call → Execution → Response
4. Test error handling and reconnection
5. Test streaming and cancellation
6. Performance testing

---

### Phase 5: Deployment & Cleanup
**Goal**: Deploy and remove old code

**Steps:**
1. Update Docker Compose to run all services
2. Update environment variables
3. Deploy to production
4. Monitor for issues
5. Remove old direct DeepSeek API code
6. Update documentation

---

## 4. File Structure After Migration

```
Hex-/
├── server/
│   ├── mcp-server/                   # ← NEW: MCP Tool Server
│   │   ├── index.js                  # Main MCP server
│   │   ├── tools.js                  # Tool definitions (MCP format)
│   │   ├── executor.js               # Tool execution handler
│   │   └── package.json              # Dependencies
│   │
│   ├── mcp-adapter/                  # ← NEW: DeepSeek MCP Adapter
│   │   ├── deepseek-adapter.js       # Main adapter
│   │   ├── message-translator.js     # Format conversion
│   │   ├── streaming-handler.js      # Streaming responses
│   │   └── package.json              # Dependencies
│   │
│   ├── index.js                      # ← MODIFIED: Docker executor (kept)
│   ├── docker-compose.yml            # ← MODIFIED: Add new services
│   └── package.json                  # ← MODIFIED: Add MCP SDK
│
├── src/
│   ├── lib/
│   │   ├── mcp-client.ts             # ← NEW: MCP client wrapper
│   │   ├── tools-schema.ts           # ← MODIFIED or REMOVED
│   │   └── supabase.ts               # (unchanged)
│   │
│   ├── hooks/
│   │   ├── use-mcp.ts                # ← NEW: MCP React hook
│   │   └── use-tool-execution.ts     # ← MODIFIED: Use MCP
│   │
│   ├── pages/
│   │   └── Index.tsx                 # ← MODIFIED: Use MCP client
│   │
│   └── ...
│
└── docs/
    └── MCP_MIGRATION_PLAN.md         # ← THIS FILE
```

---

## 5. Component Changes Detail

### 5.1 Frontend Changes

#### **Before (Index.tsx)**
```typescript
// Direct DeepSeek API call
const response = await fetch('https://api.deepseek.com/chat/completions', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${apiKey}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    model: 'deepseek-chat',
    messages: conversationMessages,
    tools: professionalSecurityTools,
    stream: true
  })
});
```

#### **After (Index.tsx)**
```typescript
// MCP client
import { useMCP } from '@/hooks/use-mcp';

const { sendMessage, isConnected } = useMCP({
  adapterUrl: import.meta.env.VITE_MCP_ADAPTER_URL || 'http://localhost:8083'
});

// Send message
await sendMessage({
  role: 'user',
  content: messageToSend
});
```

### 5.2 Tool Schema Changes

#### **Before (tools-schema.ts)**
```typescript
// OpenAI/DeepSeek format
export const professionalSecurityTools = [
  {
    type: 'function',
    function: {
      name: 'nmap_scan',
      description: '...',
      parameters: { type: 'object', properties: {...} }
    }
  }
];
```

#### **After (MCP format)**
```typescript
// MCP format (in server/mcp-server/tools.js)
export const mcpTools = [
  {
    name: 'nmap_scan',
    description: '...',
    inputSchema: {
      type: 'object',
      properties: {...}
    }
  }
];
```

---

## 6. Benefits of Migration

### 6.1 Architecture Benefits
✅ **Decoupled** - Frontend doesn't know about LLM provider
✅ **Standardized** - Using industry-standard MCP protocol
✅ **Flexible** - Can swap DeepSeek for Claude/GPT easily
✅ **Scalable** - Can add multiple MCP tool servers
✅ **Maintainable** - Clear separation of concerns

### 6.2 Feature Benefits
✅ **Tool Discovery** - Dynamic tool registration
✅ **Better Error Handling** - MCP has built-in error types
✅ **Provider Agnostic** - Easy to switch or A/B test LLMs
✅ **Multi-Server** - Can have specialized tool servers (web, network, exploitation, etc.)
✅ **Cost Control** - Keep DeepSeek but get MCP benefits

---

## 7. Risks & Mitigation

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| Breaking existing functionality | High | Medium | Phase deployment, keep old code until stable |
| Performance degradation | Medium | Low | Benchmark before/after, optimize bottlenecks |
| MCP SDK compatibility issues | High | Low | Test thoroughly, have rollback plan |
| DeepSeek API changes | Medium | Low | Monitor API, maintain adapter flexibility |
| Complex debugging | Medium | High | Extensive logging, monitoring tools |

---

## 8. Testing Strategy

### 8.1 Unit Tests
- MCP message translation
- Tool schema conversion
- Error handling

### 8.2 Integration Tests
- Complete message flow
- Tool execution
- Streaming responses
- Reconnection logic

### 8.3 E2E Tests
- User sends message → Tool executes → Results displayed
- Multiple tool calls in sequence
- Error scenarios
- Cancellation

---

## 9. Rollback Plan

If migration fails, we can rollback:

1. **Phase 1-2**: Just don't deploy, no frontend changes yet
2. **Phase 3-4**: Revert frontend code, use old API integration
3. **Phase 5**: Keep both systems running, feature flag to toggle

**Rollback Command:**
```bash
git revert <migration-commit>
npm install
npm run dev
```

---

## 10. Timeline Estimate

| Phase | Duration | Effort |
|-------|----------|--------|
| Phase 1: MCP Tool Server | 4-6 hours | Medium |
| Phase 2: DeepSeek Adapter | 6-8 hours | High |
| Phase 3: Frontend Client | 4-6 hours | Medium |
| Phase 4: Integration & Testing | 8-10 hours | High |
| Phase 5: Deployment | 2-4 hours | Low |
| **TOTAL** | **24-34 hours** | **3-4 days** |

---

## 11. Dependencies & Prerequisites

### NPM Packages to Install
```json
{
  "dependencies": {
    "@modelcontextprotocol/sdk": "^0.5.0",
    "@anthropic-ai/sdk": "^0.9.0"  // Optional: if we add Claude support later
  }
}
```

### Environment Variables to Add
```env
# MCP Configuration
VITE_MCP_ADAPTER_URL=http://localhost:8083
MCP_TOOL_SERVER_PORT=8082
MCP_ADAPTER_PORT=8083

# Existing
VITE_DEEPSEEK_API_KEY=sk-...
VITE_WS_URL=ws://localhost:8081
```

---

## 12. Next Steps

**Ready to Execute?**

1. ✅ Review this plan
2. ⏳ User approval
3. ⏳ Create backup branch
4. ⏳ Begin Phase 1 implementation

**Commands to run when approved:**
```bash
# Create feature branch
git checkout -b feature/mcp-migration

# Install MCP SDK
cd server
npm install @modelcontextprotocol/sdk

# Start implementation
```

---

## 13. Questions to Resolve

Before starting:

1. ❓ **Ports**: Confirm ports 8082 (tool server) and 8083 (adapter) are available
2. ❓ **Transport**: Use stdio, SSE, or WebSocket for MCP? (Recommend: SSE for simplicity)
3. ❓ **Hosting**: Will all servers run on same machine or distributed?
4. ❓ **Monitoring**: Need logging/monitoring tools during migration?
5. ❓ **Feature flags**: Should we use feature flags for gradual rollout?

---

## 14. References

- **MCP Specification**: https://spec.modelcontextprotocol.io/
- **MCP SDK Docs**: https://github.com/modelcontextprotocol/sdk
- **DeepSeek API**: https://api-docs.deepseek.com/
- **Current Implementation**: `src/pages/Index.tsx` lines 640-900

---

**END OF MIGRATION PLAN**

*Last Updated: 2025-01-28*
*Status: AWAITING APPROVAL*


