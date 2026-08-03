# Hex AI - Quick Start

## Install & Run

```bash
git clone https://github.com/SK3CHI3/Hex-.git
cd Hex-
npm install
npm start                    # Setup wizard runs on first launch
```

## First Run

The setup wizard will guide you through:

1. **Choose AI Provider**
   - OpenAI (GPT-4, GPT-3.5)
   - Anthropic (Claude 3)
   - Google Gemini
   - Ollama (local, free)
   - Custom (OpenAI-compatible)

2. **Enter API Key** (not needed for Ollama)

3. **Select Model** (e.g., gpt-4-turbo, claude-3-opus)

4. **Choose Execution Mode**
   - Direct (run tools on your machine) — default
   - Docker (run tools in Kali container) — optional

## Usage

```
  ██╗  ██╗███████╗██╗  ██╗
  ██║  ██║██╔════╝██║  ██║
  ███████║█████╗  ███████║
  ██╔══██║██╔══╝  ██╔══██║
  ██║  ██║███████╗██║  ██║
  ╚═╝  ╚═╝╚══════╝╚═╝  ╚═╝

  AI-Powered Pentesting Assistant
  Provider: OpenAI | Model: gpt-4-turbo
  Mode: Direct | Type /help for commands

❯ scan 192.168.1.1 for open ports
```

## Commands

| Command | Description |
|---------|-------------|
| `/help` | Show available commands |
| `/clear` | Clear conversation |
| `/history` | List saved conversations |
| `/resume <id>` | Resume a conversation |
| `/tools` | List available pentesting tools |
| `/config` | Show current configuration |
| `/setup` | Re-run setup wizard (change provider/model) |
| `/status` | Check execution environment |
| `/quit` | Exit Hex |

## Example Prompts

- "Scan 192.168.1.1 for open ports"
- "Check example.com for SQL injection"
- "Find hidden directories on http://testsite.local"
- "Enumerate SMB shares on 192.168.1.100"
- "What SSL/TLS protocols does example.com support?"

## Switching Providers

Run `/setup` anytime to change AI provider or model:

```
❯ /setup

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

## Using Ollama (Local/Free)

1. Install Ollama: https://ollama.com
2. Download a model: `ollama pull llama3`
3. Start Ollama: `ollama serve`
4. Run Hex, select "Ollama" in setup
5. No API key needed!

## Using Docker (Optional)

If you prefer isolated tool execution:

```bash
# Build Kali container (~15-30 min)
npm run docker:build

# Start container
npm run docker:up

# In Hex, run /setup and select "Docker" execution mode
```

## Configuration

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

Edit this file directly or use `/setup` to reconfigure.
