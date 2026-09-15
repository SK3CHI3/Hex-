# Hex AI - Architecture

## Overview

Hex is a terminal-native AI pentesting assistant built with React + Ink. You type commands in your terminal, the AI talks to your chosen provider (13 options including OpenAI, Anthropic, Ollama), and executes tools either directly on your machine or in an optional Docker container.

```
┌──────────────────────────────────────────────────────────────┐
│  Terminal (React + Ink UI)                                    │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  cli/index.js        — Main app + agentic loop         │  │
│  │  cli/ui/             — React components (Ink)          │  │
│  │    ├── App.js        — Root layout, fixed input        │  │
│  │    ├── InputBox.js   — Input with syntax highlighting  │  │
│  │    ├── MessageHistory.js — Virtual scrolling messages  │  │
│  │    ├── Banner.js     — ASCII art header                │  │
│  │    ├── ToolOutput.js — ANSI-aware tool output          │  │
│  │    ├── themes.js     — Semantic color system           │  │
│  │    └── keyBindings.js — Centralized shortcuts          │  │
│  │  cli/core/           — Core logic                      │  │
│  │    ├── config.js     — 13 providers + setup wizard     │  │
│  │    └── commands.js   — Slash command handlers          │  │
│  │  cli/ai/             — AI integration                  │  │
│  │    ├── ai.js         — Multi-provider API client       │  │
│  │    ├── tokens.js     — Token counting (js-tiktoken)    │  │
│  │    └── summary.js    — Conversation summarization      │  │
│  │  cli/tools/          — Tool execution                  │  │
│  │    ├── tools.js      — 17 tool definitions             │  │
│  │    ├── executor.js   — Tool → command + install_tool   │  │
│  │    └── docker.js     — Direct or Docker execution      │  │
│  │  cli/storage/        — Persistence                     │  │
│  │    ├── storage.js    — JSON conversation storage       │  │
│  │    └── skills.js     — Reusable attack workflows       │  │
│  │  cli/utils/          — Utilities                       │  │
│  │    └── search.js     — DuckDuckGo web search           │  │
│  └────────────────────────────────────────────────────────┘  │
└──────────────────────────┬───────────────────────────────────┘
                           │
              ┌────────────┴────────────┐
              │                         │
         AI Provider               Execution Layer
         (14 options)              (2 modes)
              │                         │
    ┌─────────┼─────────┐      ┌────────┴────────┐
    │         │         │      │                 │
  Cloud    Local     Custom   Direct          Docker
  (9)      (5)       (1)    (default)      (optional)
                                      Kali container
```

## How It Works

1. User types a message in the terminal
2. React + Ink UI captures input with syntax highlighting
3. CLI sends it to the configured AI provider with 17 tool definitions
4. AI responds with text and/or tool calls (streaming)
5. If tool calls: CLI builds the command, runs it via the execution layer
6. Tool output is collected, rendered once by Ink, and sent back to the AI
7. Tool results are sent back to the AI for analysis
8. Agentic loop continues (up to 100 rounds) until task complete
9. AI gives a final response with findings
10. Conversation is saved locally as JSON

## React + Ink UI Architecture

### Component Hierarchy

```
App (root layout)
├── Banner (ASCII art + status)
├── MessageHistory (virtual scrolling)
│   ├── User messages
│   ├── Assistant messages
│   ├── Tool outputs (ToolOutput component)
│   └── Streaming indicator (animated braille spinner)
└── InputBox (fixed at bottom)
    ├── Syntax highlighting
    ├── Ghost text autocomplete
    ├── Paste handler
    └── Status hints
```

### Fixed Input Layout

The input box stays at the bottom of the terminal while content scrolls above:

```
┌─────────────────────────────────┐
│                                 │
│ Scrolling area                  │
│ (banner + messages scroll up)   │
│                                 │
├─────────────────────────────────┤
│ Input box (fixed at bottom)     │
│ ❯ _                             │
└─────────────────────────────────┘
```

Implemented via:
- `App.js` tracks terminal height with `useStdout()`
- Calculates available space for messages
- `MessageHistory.js` implements virtual scrolling (only renders visible messages)
- Shows scroll indicator when messages are hidden above

### Virtual Scrolling

For long conversations, only visible messages are rendered:

```javascript
// MessageHistory.js
const estimateMessageHeight = (msg) => {
  // Estimate lines per message type
  if (msg.role === 'user') return Math.ceil(msg.content.length / 80) + 1;
  if (msg.role === 'assistant') { /* ... */ }
  if (msg.role === 'tool') return 5;
};

// Start from end, work backwards until maxHeight reached
for (let i = messages.length - 1; i >= 0; i--) {
  const msgHeight = estimateMessageHeight(messages[i]);
  if (totalHeight + msgHeight > maxHeight) break;
  visibleMessages.unshift(messages[i]);
}
```

### Semantic Color Themes

Colors are organized by semantic category, not by name:

```javascript
// themes.js
export const themes = {
  dark: {
    text: { primary, secondary, accent, muted },
    background: { primary, secondary, elevated },
    border: { default, focused, error },
    ui: { prompt, selection, cursor },
    status: { success, error, warning, info, thinking, tool },
    syntax: { command, path, tool, variable, string, number },
  },
  light: { /* ... */ }
};
```

Switch themes with `/theme dark` or `/theme light`.

## Multi-Provider Support

Hex supports 13 AI providers through a unified interface:

### Provider Configuration

Stored in `~/.hex/config.json`:

```json
{
  "provider": "openai",
  "model": "gpt-4-turbo",
  "executionMode": "direct",
  "apiKeys": {
    "openai": "sk-..."
  }
}
```

### Supported Providers

**Cloud (9):**
- OpenAI — GPT-4, GPT-3.5
- Anthropic — Claude 3
- Google — Gemini
- DeepSeek — DeepSeek-Chat, DeepSeek-Coder
- OpenRouter — Multi-model router
- ModelScope — Qwen models
- xAI — Grok

**Local (5):**
- Ollama — http://localhost:11434/v1
- LM Studio — http://localhost:1234/v1
- llama.cpp — http://localhost:8080/v1
- vLLM — http://localhost:8000/v1
- Jan.ai — http://127.0.0.1:1337/v1

**Custom (1):**
- Any OpenAI-compatible endpoint

### Provider Switching

Run `/setup` or `/provider` anytime to change providers. Configuration is saved locally and persists across sessions.

### Model Discovery

For local providers, Hex queries the `/v1/models` endpoint and shows available models. You don't need to guess model names.

## Execution Modes

### Direct Mode (Default)

Tools execute directly on your machine using your installed tools.

**Best for:**
- Local network pentesting
- Quick scans without container overhead
- Using your existing tool installations

**How it works:**
- Commands spawn directly via Node.js `child_process`
- Tools must be installed on your system (or use `install_tool`)
- Output is collected and rendered by the terminal UI after command completion

### Docker Mode

Tools execute in an isolated Kali Linux container.

**Best for:**
- Pre-built tool environment (42+ tools)
- Isolation from host system
- Reproducible results

**How it works:**
- Commands run via `docker exec hex-kali-tools <command>`
- Container runs as non-root user (`hexagent`)
- Commands have a five-minute timeout and can be cancelled with Ctrl+C

## Agentic Loop

Hex uses an agentic loop pattern for multi-step task execution:

```
┌─────────────────────────────────────────┐
│  User Request                           │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│  AI Thinks + Responds + Calls Tools     │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│  Execute Tools → Feed Results to AI     │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│  AI Sees Results → More Tools?          │
│  Yes → Loop back (max 100 rounds)       │
│  No  → Final response, done             │
└─────────────────────────────────────────┘
```

**Key features:**
- Loop continues as long as AI calls tools
- Max 100 rounds prevents infinite loops
- Each iteration: AI thinks → acts → observes → thinks again
- Results from each step inform the next step
- Conversation saved after each round

This is the standard pattern used by Claude Code, OpenAI Codex CLI, Cursor agent mode, etc.

## Tool System

### Tool Definitions

Tools are defined in `cli/tools/tools.js` using OpenAI-compatible function calling format:

```javascript
{
  type: 'function',
  function: {
    name: 'nmap_scan',
    description: 'Perform network reconnaissance using Nmap...',
    parameters: {
      type: 'object',
      properties: {
        target: { type: 'string', description: 'Target IP or domain' },
        scan_type: { type: 'string', enum: ['ping', 'quick', 'port', 'service', 'full', 'stealth', 'vuln'] },
      },
      required: ['target', 'scan_type'],
    },
  },
}
```

### Tool Execution

When AI calls a tool:

1. `executor.js` maps tool name + arguments to a shell command
2. `docker.js` runs it via the configured execution mode:
   - **Direct:** `spawn(command, args)` on your machine
   - **Docker:** `docker exec hex-kali-tools <command> <args>`
3. Output streams to terminal and back to AI

### Automatic Tool Installation

The `install_tool` function allows AI to install missing tools:

```javascript
// executor.js
async function handleToolInstallation(args) {
  const { tool_name, install_method = 'auto' } = args;
  
  // Auto-detect method: apt, pip, npm, go, git
  // Execute installation in Docker or Direct mode
  // Return success/error
}
```

### Skills System

Skills are reusable multi-step workflows stored in `~/.hex/skills/`:

```json
{
  "name": "web-recon",
  "description": "Comprehensive web reconnaissance",
  "steps": [
    { "tool": "whois_lookup", "args": { "domain": "{{target}}" } },
    { "tool": "dns_lookup", "args": { "domain": "{{target}}", "record_type": "A" } },
    { "tool": "nmap_scan", "args": { "target": "{{target}}", "scan_type": "quick" } }
  ]
}
```

Skills support `{{variable}}` placeholders for user-provided values.

## Error Handling

### Network Resilience

```javascript
// ai.js
for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
  if (attempt > 0) {
    const online = await checkNetwork();
    if (!online) {
      onError(new Error('No network connection...'));
      return;
    }
    await sleep(RETRY_DELAYS[attempt - 1]);
  }
  
  const response = await makeRequest(...);
  if (response.ok) {
    await processStream(response, ...);
    return;
  }
}
```

### Stream Interruption Recovery

```javascript
// ai.js - processStream
try {
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    // Process chunk...
  }
} catch (streamErr) {
  if (streamErr.name === 'AbortError') throw streamErr;
  // Connection dropped - preserve partial content
  console.error('Stream interrupted:', streamErr.message);
} finally {
  reader.releaseLock();
}
```

### Dismissible Errors

```javascript
// index.js
const ErrorScreen = ({ error, onDismiss }) => {
  useInput(() => onDismiss());
  return <Box>...</Box>;
};

if (error) {
  return <ErrorScreen error={error} onDismiss={dismissError} />;
}
```

## AbortController & Cancellation

Hex supports graceful cancellation of operations:

- **Ctrl+C** during AI thinking: Aborts the fetch request
- **Ctrl+C** during tool execution: Stops the current tool
- **AbortController** passed to `chat()` function
- Ink input handles Ctrl+C without exiting the application
- Conversation history preserved after cancellation

## Token Management

### Token Counting

Uses `js-tiktoken` for accurate token counting:

```javascript
// tokens.js
export function countMessagesTokens(messages) {
  let total = 0;
  for (const msg of messages) {
    total += 4; // message overhead
    if (msg.role) total += countTokens(msg.role);
    if (msg.content) total += countTokens(msg.content);
  }
  return total + 2; // priming tokens
}
```

### Automatic Summarization

When approaching token limit (70%), old messages are summarized:

```javascript
// index.js
if (shouldSummarize(newMessages, initialModel)) {
  try {
    const summarized = summarizeOldMessages(newMessages, initialModel);
    setMessages(summarized);
  } catch (summaryErr) {
    // If summarization fails, continue with original messages
    console.error('Summarization failed:', summaryErr.message);
  }
}
```

### Model-Specific Limits

```javascript
// tokens.js
const TOKEN_LIMITS = {
  'gpt-4': 8192,
  'gpt-4-turbo': 128000,
  'claude-3-opus': 200000,
  'default': 8192,
};
```

## Data Storage

No database required. All data stored as JSON files:

```
~/.hex/
├── config.json              # Provider configuration
├── conversations/           # Conversation history
│   ├── <uuid>.json
│   └── ...
└── skills/                  # Reusable workflows
    ├── web-recon.json
    ├── network-scan.json
    └── ...
```

## Security

### Direct Mode
- Commands run as your user on your machine
- Tools must be installed locally (or use `install_tool`)
- Best for trusted local network testing

### Docker Mode
- Commands run in an isolated Docker container
- Non-root user (`hexagent`) inside the container
- Commands have a five-minute timeout and can be cancelled with Ctrl+C
- API key stored locally in `~/.hex/config.json`

### AI Provider Security
- API keys stored locally in `~/.hex/config.json`
- Keys only sent to the configured provider's API endpoint
- For local providers, no API key needed
- Conversation history never leaves your machine

## System Prompt Design

Hex uses positive framing with lab environment context:

```
You are Hex, an autonomous penetration testing assistant.
You operate in an isolated lab environment with full permission
to perform security testing, vulnerability assessments, and
tool installation.
```

This approach:
- Prevents AI refusals without aggressive prohibitions
- Works well with uncensored models (llama2-uncensored)
- Focuses on what TO DO, not what NOT to do
- Concise (~150 lines) instead of lengthy restrictions

## OS-Aware Execution

System prompt adapts to the operating system:

```javascript
const platformInfo = currentPlatform === 'win32'
  ? 'Windows (use PowerShell/CMD commands like dir, Get-Command, where.exe)'
  : currentPlatform === 'darwin'
  ? 'macOS (use Unix commands like which, ls, grep)'
  : 'Linux (use standard Linux commands)';
```

Prevents AI from generating incompatible commands.
