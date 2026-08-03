# Multi-Provider AI System

## Overview
Hex now supports multiple AI providers with a unified interface. Users can switch between providers, use environment variables for API keys, and configure execution modes.

## Implemented Features

### 1. Provider Support (9 providers)
- **OpenAI** - GPT-4, GPT-3.5
- **Anthropic** - Claude 3 Opus/Sonnet/Haiku
- **Google** - Gemini Pro/Flash
- **DeepSeek** - DeepSeek-Chat, DeepSeek-Coder
- **OpenRouter** - Access to multiple models via one API
- **ModelScope** - Qwen models
- **xAI** - Grok
- **Ollama** - Local models (Llama, Mistral, etc.)
- **Custom** - Any OpenAI-compatible endpoint

### 2. Configuration Priority
1. Environment variables (highest priority)
2. Config file (~/.hex/config.json)
3. Setup wizard defaults (lowest priority)

### 3. Environment Variables
- `HEX_PROVIDER` - Override provider
- `HEX_MODEL` - Override model
- `HEX_EXECUTION_MODE` - Override execution mode (direct/docker)
- `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, etc. - Provider-specific keys
- `<PROVIDER>_BASE_URL` - Override base URL for any provider

### 4. CLI Commands
- `/provider` - Switch AI provider interactively
- `/config` - Show current configuration with env var status
- `/setup` - Run setup wizard
- `/status` - Check execution environment

### 5. Execution Modes
- **Direct** (default) - Run tools on user's machine
- **Docker** - Run tools in isolated Kali container

## Architecture

### Config Module (cli/config.js)
- `loadConfig()` - Loads config with priority cascade
- `saveConfig()` - Saves to ~/.hex/config.json
- `getApiKey()` - Gets API key (env var or config)
- `getBaseUrl()` - Gets base URL (env var or provider default)
- `getProvider()` - Gets current provider config
- `setupWizard()` - Interactive setup

### AI Module (cli/ai.js)
- Uses `getApiKey()` and `getBaseUrl()` for each request
- Supports provider-specific authentication (Anthropic uses x-api-key)
- Streams responses and handles tool calls

### Executor Module (cli/executor.js)
- `executeToolCall()` - Executes tool calls via Docker or direct
- Routes to `runCommand()` in docker.js

### Docker Module (cli/docker.js)
- `runCommand()` - Unified command execution
- `runDirect()` - Executes on user's machine
- `runInDocker()` - Executes in Kali container
- `isDockerAvailable()` - Checks container status
- `isToolAvailable()` - Checks if tool is installed

## File Structure
```
cli/
├── index.js       - Main CLI loop, command handling
├── config.js      - Multi-provider configuration
├── ai.js          - AI API client (streams responses)
├── tools.js       - Tool definitions (14 tools)
├── executor.js    - Tool execution coordinator
├── docker.js      - Execution layer (direct/docker)
└── storage.js     - Conversation persistence
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
- [x] All 9 providers are available
