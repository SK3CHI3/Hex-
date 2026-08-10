# Hex AI - Setup Guide

## Prerequisites

- **Node.js 18+**
- **Git** (for source installation)
- **One of the following:**
  - OpenAI API key (https://platform.openai.com)
  - Anthropic API key (https://console.anthropic.com)
  - Google Gemini API key (https://makersuite.google.com)
  - DeepSeek API key (https://platform.deepseek.com)
  - Ollama installed locally (https://ollama.com)
  - LM Studio installed locally (https://lmstudio.ai)
  - Any OpenAI-compatible API endpoint

## Installation

### Option 1: npm (Recommended)

```bash
# Install globally
npm install -g hex-ai

# Run Hex (setup wizard runs automatically)
hex
```

### Option 2: From Source

```bash
# 1. Clone the repo
git clone https://github.com/SK3CHI3/Hex-.git
cd Hex-

# 2. Install dependencies
npm install

# 3. Launch Hex (setup wizard runs automatically)
npm start
```

## First-Time Setup

On first launch, you'll see the setup wizard:

```
╔═══════════════════════════════════════╗
║  Welcome to Hex - Initial Setup      ║
╚═══════════════════════════════════════╝

CLOUD PROVIDERS:
  1. OpenAI
  2. Anthropic
  3. Google Gemini
  4. DeepSeek
  5. OpenRouter
  6. ModelScope
  7. xAI (Grok)

LOCAL PROVIDERS (run models on your machine):
  8. Ollama
  9. LM Studio
  10. llama.cpp
  11. vLLM
  12. Jan.ai

OTHER:
  13. Custom (any OpenAI-compatible server)

Enter number (1-13):
```

### Choosing a Provider

**OpenAI (Recommended for quality)**
- Best overall quality and tool use
- Requires API key from https://platform.openai.com
- Models: gpt-4-turbo, gpt-4, gpt-3.5-turbo

**Anthropic**
- Excellent for long context and careful analysis
- Requires API key from https://console.anthropic.com
- Models: claude-3-opus, claude-3-sonnet, claude-3-haiku

**Google Gemini**
- Free tier available
- Requires API key from https://makersuite.google.com
- Models: gemini-1.5-pro, gemini-1.5-flash

**DeepSeek**
- Cost-effective alternative
- Requires API key from https://platform.deepseek.com
- Models: deepseek-chat, deepseek-coder

**Ollama (Recommended for local/free)**
- 100% offline, no API costs
- Requires Ollama installed (https://ollama.com)
- Run `ollama serve` before using Hex
- Models: llama3, llama2-uncensored, mistral, qwen2.5

**LM Studio**
- Desktop app with GUI
- Download models from HuggingFace
- Start the local server in the app
- No API key needed

**Custom**
- Any OpenAI-compatible API endpoint
- Works with Azure OpenAI, self-hosted models, etc.
- You provide: base URL, API key (if needed), model name

### Local Provider Setup

For local providers (Ollama, LM Studio, etc.), Hex will:

1. **Test the connection** to the local server
2. **Discover available models** by querying `/v1/models`
3. **Show install instructions** if the server isn't running

Example:
```
Testing connection to http://localhost:11434/v1...

✗ Could not connect to Ollama at http://localhost:11434/v1
  Connection refused

To use Ollama:
  1. Install: https://ollama.com/download
  2. Start:   ollama serve
  3. Models:  ollama pull <model>

What would you like to do?
  1. Retry connection (I just started it)
  2. Choose a different provider
  3. Continue anyway (I'll configure it later)
```

### Execution Mode

You'll also choose how tools execute:

**Direct Mode (Default)**
- Tools run directly on your machine
- Best for local network pentesting
- Uses your installed tools (nmap, sqlmap, etc.)
- Hex can install missing tools automatically
- No Docker required

**Docker Mode**
- Tools run in isolated Kali Linux container
- Pre-built environment with 42+ tools
- Better isolation, reproducible results
- Requires Docker Desktop

To use Docker mode:
```bash
npm run docker:build    # Build Kali container (~15-30 min)
npm run docker:up       # Start container
```

Then run `/setup` in Hex and select "Docker" execution mode.

## Configuration File

Your settings are saved to `~/.hex/config.json`:

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

You can edit this file directly or run `/setup` to reconfigure.

## Changing Providers

Run `/setup` anytime to switch providers or models:

```
❯ /setup

Welcome to Hex - Initial Setup

Select AI Provider:
  1. OpenAI
  2. Anthropic
  ...
```

Or use `/provider` for quick switching:

```
❯ /provider
Available providers:
  1. OpenAI
  2. Anthropic
  ...
Enter number: 2
✓ Switched to Anthropic
```

## Verifying Setup

### Check Configuration
```
❯ /config

  Current Configuration:
  Provider: OpenAI
  Model: gpt-4-turbo
  Base URL: https://api.openai.com/v1
  API Key: ***abcd
  Execution: direct
```

### Check Execution Environment
```
❯ /status

  ✓ Direct execution mode (tools run on your machine)
  ✓ nmap is available
  ✓ curl is available
  ✓ whois is available
```

Or if using Docker:
```
❯ /status

  ✓ Docker container is running
```

### Test a Tool
```
❯ Scan 127.0.0.1 for open ports
```

Hex should execute nmap and show the results.

## Environment Variables

You can override config with environment variables:

```bash
# Override provider
export HEX_PROVIDER=ollama
export HEX_MODEL=llama3

# Override API key
export OPENAI_API_KEY=sk-...

# Override execution mode
export HEX_EXECUTION_MODE=docker

# Run Hex
hex
```

Environment variables take priority over config file.

## Troubleshooting

**API key errors?**
- Verify your API key is correct
- Check you have credits/billing enabled
- Try `/setup` to reconfigure

**Ollama not connecting?**
- Make sure Ollama is running: `ollama serve`
- Verify model is downloaded: `ollama list`
- Check base URL is `http://localhost:11434/v1`
- Set context length: `OLLAMA_CONTEXT_LENGTH=8192 ollama serve`

**LM Studio not connecting?**
- Start the local server in the LM Studio app
- Check the port (default: 1234)
- Load a model in the server

**Tools not found (Direct mode)?**
- Hex can install missing tools automatically
- Or install manually: `sudo apt install nmap`
- Or use Docker mode with pre-installed tools

**Docker container not running?**
```bash
cd server/docker && docker compose up -d
```

**Want to switch providers?**
```
❯ /setup
```

**Permission errors installing tools?**
- Use `sudo` for apt installations
- Or install to user directory: `~/.local/bin`
- Or use Docker mode

**Slow responses from local models?**
- Use a smaller model (8B instead of 70B)
- Use GPU acceleration if available
- Increase context window: `OLLAMA_CONTEXT_LENGTH=8192`

## Next Steps

Once setup is complete:

1. **Try a basic scan:**
   ```
   ❯ Scan 192.168.1.1 for open ports
   ```

2. **Explore commands:**
   ```
   ❯ /help
   ```

3. **Check available tools:**
   ```
   ❯ /tools
   ```

4. **Learn about skills:**
   ```
   ❯ /skills
   ```

5. **Read the Quick Start guide:**
   See [QUICK_START.md](QUICK_START.md) for usage examples.
