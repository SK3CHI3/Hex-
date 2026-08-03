# Hex AI - Architecture

## Overview

Hex is a terminal-native AI pentesting assistant. You type commands in your terminal, the AI talks to your chosen provider (OpenAI, Anthropic, Google, Ollama, or custom), and executes tools either directly on your machine or in an optional Docker container.

```
┌──────────────────────────────────────────────┐
│  Terminal (CLI)                               │
│  ┌────────────────────────────────────────┐  │
│  │  cli/index.js    — chat loop (readline)│  │
│  │  cli/config.js   — provider config     │  │
│  │  cli/ai.js       — multi-provider API  │  │
│  │  cli/tools.js    — tool definitions    │  │
│  │  cli/executor.js — tool → command      │  │
│  │  cli/docker.js   — execution layer     │  │
│  │  cli/storage.js  — local JSON history  │  │
│  └────────────────────────────────────────┘  │
└──────────────────┬───────────────────────────┘
                   │
         ┌─────────┴──────────┐
         │                    │
    AI Provider          Execution Layer
    (configurable)       (direct or Docker)
         │                    │
    - OpenAI            - Direct (default)
    - Anthropic           Run tools on your machine
    - Google              for local network testing
    - Ollama (local)    
    - Custom            - Docker (optional)
                          Isolated Kali container
```

## How It Works

1. User types a message in the terminal
2. CLI sends it to the configured AI provider with tool definitions
3. AI responds with text and/or tool calls
4. If tool calls: CLI builds the command, runs it via the execution layer
5. Output streams back to terminal in real-time
6. Tool results are sent back to the AI for analysis
7. AI gives a final response with findings
8. Conversation is saved locally as JSON

## Multi-Provider Support

Hex supports multiple AI providers through a unified interface:

### Provider Configuration
Stored in `~/.hex/config.json`:
```json
{
  "provider": "openai",
  "apiKey": "sk-...",
  "baseUrl": "https://api.openai.com/v1",
  "model": "gpt-4-turbo",
  "executionMode": "direct"
}
```

### Supported Providers
- **OpenAI** — GPT-4, GPT-3.5 (https://api.openai.com/v1)
- **Anthropic** — Claude 3 (https://api.anthropic.com/v1)
- **Google** — Gemini (https://generativelanguage.googleapis.com/v1beta)
- **Ollama** — Local models (http://localhost:11434/v1)
- **Custom** — Any OpenAI-compatible endpoint

### Provider Switching
Run `/setup` anytime to change providers. Configuration is saved locally and persists across sessions.

## Execution Modes

### Direct Mode (Default)
Tools execute directly on your machine using your installed tools.

**Best for:**
- Local network pentesting
- Quick scans without container overhead
- Using your existing tool installations

**How it works:**
- Commands spawn directly via Node.js `child_process`
- Tools must be installed on your system
- Output streams in real-time to terminal

### Docker Mode
Tools execute in an isolated Kali Linux container.

**Best for:**
- Pre-built tool environment (42+ tools)
- Isolation from host system
- Reproducible results

**How it works:**
- Commands run via `docker exec hex-kali-tools <command>`
- Container runs as non-root user (`hexagent`)
- 5-minute timeout per command

## Project Structure

```
Hex-/
├── cli/                    # CLI application
│   ├── index.js            # Entry point + chat loop + agentic loop
│   ├── config.js           # Provider configuration + setup wizard
│   ├── ai.js               # Multi-provider API client + abort support
│   ├── tools.js            # Tool definitions (function calling)
│   ├── executor.js         # Tool call → command builder + executor
│   ├── docker.js           # Execution layer (direct or Docker)
│   ├── storage.js          # Local JSON conversation storage
│   └── search.js           # Web search (DuckDuckGo)
│
├── server/
│   └── docker/             # Kali Linux container (optional)
│       ├── Dockerfile.kali # 42+ pentesting tools
│       ├── docker-compose.yml
│       └── verify-tools.sh
│
├── docs/                   # Documentation
├── package.json
└── README.md
```

## Tool Execution Flow

Tools are defined in `cli/tools.js` using the OpenAI-compatible function calling format. When the AI decides to use a tool:

1. `executor.js` maps the tool name + arguments to a shell command
2. `docker.js` runs it via the configured execution mode:
   - **Direct:** `spawn(command, args)` on your machine
   - **Docker:** `docker exec hex-kali-tools <command> <args>`
3. Output streams to the terminal and back to the AI

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
│  Yes → Loop back (max 10 rounds)        │
│  No  → Final response, done             │
└─────────────────────────────────────────┘
```

**Key features:**
- Loop continues as long as AI calls tools
- Max 10 rounds prevents infinite loops
- Each iteration: AI thinks → acts → observes → thinks again
- Results from each step inform the next step

This is the standard pattern used by Claude Code, OpenAI Codex CLI, Cursor agent mode, etc.

## AbortController & Cancellation

Hex supports graceful cancellation of operations:

- **Ctrl+C** during AI thinking: Aborts the fetch request
- **Ctrl+C** during tool execution: Stops the current tool
- **AbortController** passed to `chat()` function
- SIGINT handler manages cancellation gracefully
- Conversation history preserved after cancellation

## Thinking Models

Hex supports models with reasoning/thinking capabilities:

- Detects `delta.reasoning_content` and `delta.thinking` from streaming responses
- Displays thinking with 💭 indicator in dim text
- Collapsible display: `/thinking` toggles between compact and expanded views
- Thinking shown before actual response

## Web Search

Web search via DuckDuckGo Instant Answer API:

- No API key required
- Works for CVEs, security concepts, OSINT
- Integrated as `web_search` tool
- Results formatted for AI consumption

## OS-Aware System Prompt

System prompt adapts to the operating system:

- **Windows**: Suggests PowerShell/CMD commands (dir, Get-Command, where.exe)
- **macOS**: Suggests Unix commands (which, ls, grep)
- **Linux**: Standard Linux commands
- Prevents AI from generating incompatible commands

## Data Storage

No database required. Conversations are stored as JSON files in `~/.hex/conversations/`.

Configuration is stored in `~/.hex/config.json`.

## Security

### Direct Mode
- Commands run as your user on your machine
- Tools must be installed locally
- Best for trusted local network testing

### Docker Mode
- Commands run in an isolated Docker container
- Non-root user (`hexagent`) inside the container
- 5-minute timeout per command
- Tool whitelist in the executor
- API key stored locally in `~/.hex/config.json` (never sent anywhere except your chosen AI provider)

## AI Provider Security

- API keys stored locally in `~/.hex/config.json`
- Keys only sent to the configured provider's API endpoint
- For Ollama, no API key needed (local execution)
- Conversation history never leaves your machine
