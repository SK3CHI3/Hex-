# Hex AI - Setup Guide

## Prerequisites

- **Node.js 18+**
- **Git**
- **One of the following:**
  - OpenAI API key (https://platform.openai.com)
  - Anthropic API key (https://console.anthropic.com)
  - Google Gemini API key (https://makersuite.google.com)
  - Ollama installed locally (https://ollama.com)
  - Any OpenAI-compatible API endpoint

## Installation

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

Select AI Provider:
  1. OpenAI
  2. Anthropic
  3. Google Gemini
  4. Ollama (Local)
  5. Custom (OpenAI-compatible)
```

### Choosing a Provider

**OpenAI (Recommended)**
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

**Ollama (Local)**
- 100% offline, no API costs
- Requires Ollama installed (https://ollama.com)
- Run `ollama serve` before using Hex
- Models: llama3, llama2, codellama, mistral

**Custom**
- Any OpenAI-compatible API endpoint
- Works with Azure OpenAI, self-hosted models, etc.
- You provide: base URL, API key (if needed), model name

### Execution Mode

You'll also choose how tools execute:

**Direct Mode (Default)**
- Tools run directly on your machine
- Best for local network pentesting
- Uses your installed tools (nmap, sqlmap, etc.)
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
  "apiKey": "sk-...",
  "baseUrl": "https://api.openai.com/v1",
  "model": "gpt-4-turbo",
  "executionMode": "direct"
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

## Troubleshooting

**API key errors?**
- Verify your API key is correct
- Check you have credits/billing enabled
- Try `/setup` to reconfigure

**Ollama not connecting?**
- Make sure Ollama is running: `ollama serve`
- Verify model is downloaded: `ollama list`
- Check base URL is `http://localhost:11434/v1`

**Tools not found (Direct mode)?**
- Install the tools on your system:
  - nmap: https://nmap.org/download
  - sqlmap: https://sqlmap.org
  - Or use Docker mode instead

**Docker container not running?**
```bash
cd server/docker && docker compose up -d
```

**Want to switch providers?**
```
❯ /setup
```
