# Multi-Provider AI System

## Overview
Hex supports 14 AI providers with a unified interface. Users can switch between providers, use environment variables for API keys, and configure execution modes.

## Supported Providers (14)

### Cloud Providers (9)

| Provider | Base URL | Models | API Key |
|----------|----------|--------|---------|
| **OpenAI** | `https://api.openai.com/v1` | gpt-4-turbo, gpt-4, gpt-3.5-turbo | `OPENAI_API_KEY` |
| **Anthropic** | `https://api.anthropic.com/v1` | claude-3-opus, claude-3-sonnet, claude-3-haiku | `ANTHROPIC_API_KEY` |
| **Google Gemini** | `https://generativelanguage.googleapis.com/v1beta` | gemini-1.5-pro, gemini-1.5-flash, gemini-pro | `GOOGLE_API_KEY` |
| **DeepSeek** | `https://api.deepseek.com/v1` | deepseek-chat, deepseek-coder | `DEEPSEEK_API_KEY` |
| **OpenRouter** | `https://openrouter.ai/api/v1` | openai/gpt-4-turbo, anthropic/claude-3-opus, meta-llama/llama-3-70b-instruct | `OPENROUTER_API_KEY` |
| **ModelScope** | `https://api-inference.modelscope.ai/v1` | Qwen-Ambassador/Qwen3.7-Plus | `MODELSCOPE_API_KEY` |
| **xAI (Grok)** | `https://api.x.ai/v1` | grok-beta | `XAI_API_KEY` |

### Local Providers (5)

| Provider | Base URL | Models | API Key |
|----------|----------|--------|---------|
| **Ollama** | `http://localhost:11434/v1` | llama3, mistral, qwen2.5, codellama, phi3 | None (local) |
| **LM Studio** | `http://localhost:1234/v1` | Dynamic (from app) | None (local) |
| **llama.cpp** | `http://localhost:8080/v1` | Dynamic (from server) | None (local) |
| **vLLM** | `http://localhost:8000/v1` | Dynamic (from server) | None (local) |
| **Jan.ai** | `http://127.0.0.1:1337/v1` | Dynamic (from app) | None (local) |

### Custom Provider (1)

| Provider | Base URL | Models | API Key |
|----------|----------|--------|---------|
| **Custom** | User-defined | User-defined | `CUSTOM_API_KEY` |

Any OpenAI-compatible endpoint works with the Custom provider.

## Implemented Features

### 1. Configuration Priority
1. Environment variables (highest priority)
2. Config file (~/.hex/config.json)
3. Setup wizard defaults (lowest priority)

### 2. Environment Variables

**Global overrides:**
- `HEX_PROVIDER` - Override provider
- `HEX_MODEL` - Override model
- `HEX_EXECUTION_MODE` - Override execution mode (direct/docker)

**Provider-specific API keys:**
- `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `GOOGLE_API_KEY`, etc.
- `<PROVIDER>_BASE_URL` - Override base URL for any provider

### 3. CLI Commands
- `/provider` - Switch AI provider interactively
- `/config` - Show current configuration with env var status
- `/setup` - Run setup wizard
- `/status` - Check execution environment

### 4. Execution Modes
- **Direct** (default) - Run tools on user's machine
- **Docker** - Run tools in isolated Kali container

### 5. Model Discovery
For local providers, Hex queries the `/v1/models` endpoint and shows available models. You don't need to guess model names.

### 6. Connection Testing
During setup, Hex tests the connection to local providers and shows install instructions if the server isn't running.

## Architecture

### Config Module (cli/core/config.js)
- `loadConfig()` - Loads config with priority cascade
- `saveConfig()` - Saves to ~/.hex/config.json
- `getApiKey()` - Gets API key (env var or config)
- `getBaseUrl()` - Gets base URL (env var or provider default)
- `getProvider()` - Gets current provider config
- `isLocalProvider()` - Checks if provider is local (no API key needed)
- `setupWizard()` - Interactive setup with connection testing
- `testConnection()` - Tests connection to local provider
- `discoverModels()` - Queries `/v1/models` for available models

### AI Module (cli/ai/ai.js)
- `chat()` - Multi-provider API client with streaming
- `makeRequest()` - Provider-specific authentication (Anthropic uses x-api-key)
- `processStream()` - Handles streaming responses and tool calls
- Network resilience with 3 retries and exponential backoff
- Network connectivity check before retries

### Token Management (cli/ai/tokens.js)
- `countTokens()` - Accurate token counting with js-tiktoken
- `countMessagesTokens()` - Count tokens in message array
- `getTokenLimit()` - Model-specific token limits
- `shouldSummarize()` - Check if summarization needed (70% of limit)
- `getTokenUsage()` - Get current token usage stats

### Summarization (cli/ai/summary.js)
- `summarizeOldMessages()` - Summarize old messages to save tokens
- `truncateMessages()` - Aggressive truncation if summary fails
- Keeps system message + recent messages

## File Structure
```
cli/
├── index.js          - Main CLI loop, agentic loop, React rendering
├── core/
│   ├── config.js     - 14 provider configuration + setup wizard
│   └── commands.js   - Slash command handlers
├── ai/
│   ├── ai.js         - Multi-provider API client (streams responses)
│   ├── tokens.js     - Token counting (js-tiktoken)
│   └── summary.js    - Conversation summarization
├── tools/
│   ├── tools.js      - 17 tool definitions (function calling)
│   ├── executor.js   - Tool execution + install_tool
│   └── docker.js     - Execution layer (direct/docker)
├── storage/
│   ├── storage.js    - Conversation persistence (JSON)
│   └── skills.js     - Reusable attack workflows
└── utils/
    └── search.js     - Web search (DuckDuckGo)
```

## Usage Examples

### Setup with Environment Variables
```bash
export OPENAI_API_KEY=sk-...
export HEX_PROVIDER=openai
export HEX_MODEL=gpt-4-turbo
hex
```

### Setup with Config File
```bash
hex  # Run setup wizard
# Select provider, enter API key, choose execution mode
```

### Switch Provider at Runtime
```
❯ /provider
Available providers:
  1. OpenAI
  2. Anthropic
  ...
Enter number: 2
✓ Switched to Anthropic
```

### Check Configuration
```
❯ /config
Current Configuration:
  Provider: OpenAI
  Model: gpt-4-turbo
  Base URL: https://api.openai.com/v1
  API Key: ***abcd
  Execution: direct
  ✓ OPENAI_API_KEY set via environment
```

### Using Local Providers

**Ollama:**
```bash
# Install Ollama
# Download a model
ollama pull llama3

# Start Ollama
ollama serve

# In Hex, select Ollama
hex
# Choose "Ollama (Local)" from provider list
```

**LM Studio:**
```bash
# Download LM Studio app
# Download a model in the app
# Start the local server
# In Hex, select "LM Studio (Local)"
```

**Any OpenAI-compatible server:**
```bash
hex
# Choose "Custom (OpenAI-compatible)"
# Enter base URL: http://your-server:port/v1
# Enter model name
```

## Provider-Specific Notes

### Anthropic
- Uses `x-api-key` header instead of `Authorization: Bearer`
- Requires `anthropic-version: 2023-06-01` header

### Local Providers
- No API key required
- Hex queries `/v1/models` for model discovery
- Connection tested during setup
- Install instructions shown if server not running

### Custom Provider
- Works with any OpenAI-compatible endpoint
- Supports Azure OpenAI, self-hosted models, etc.
- You provide: base URL, API key (if needed), model name

## Error Handling

### Network Resilience
- **3 retry attempts** with exponential backoff (1s, 2s, 4s)
- **Network detection** before retrying
- **Partial content preservation** on stream interruption
- **Dismissible errors** — press any key to continue

### Provider-Specific Errors
- **401 Unauthorized** — Check API key
- **429 Rate Limit** — Wait and retry
- **500+ Server Errors** — Retry automatically
- **Connection Refused** — Check if local server is running

## Migration Notes
- Old `.env` file is no longer used
- Config moved from `.env` to `~/.hex/config.json`
- API keys can be stored in config file OR environment variables
- Environment variables take priority over config file

## Testing Checklist
- [x] Config loads correctly
- [x] Environment variables override config
- [x] Setup wizard works
- [x] Provider switching works
- [x] API calls use correct credentials
- [x] Tool execution works in both modes
- [x] All 13 providers are available
- [x] Local provider model discovery works
- [x] Connection testing works
- [x] Network resilience works
