# Hex AI - Quick Start

## Install & Run

```bash
# Install globally via npm
npm install -g hex-ai

# Run Hex
hex
```

Or from source:

```bash
git clone https://github.com/SK3CHI3/Hex-.git
cd Hex-
npm install
npm start                    # Setup wizard runs on first launch
```

## First Run

The setup wizard will guide you through:

1. **Choose AI Provider** (14 options)
   - **Cloud**: OpenAI, Anthropic, Google Gemini, DeepSeek, OpenRouter, ModelScope, xAI
   - **Local**: Ollama, LM Studio, llama.cpp, vLLM, Jan.ai
   - **Custom**: Any OpenAI-compatible endpoint

2. **Enter API Key** (not needed for local providers)

3. **Select Model** (e.g., gpt-4-turbo, claude-3-opus, llama3)

4. **Choose Execution Mode**
   - Direct (run tools on your machine) — default
   - Docker (run tools in Kali container) — optional

## Interface

```
  ██╗  ██╗███████╗██╗  ██╗
  ██║  ██║██╔════╝╚██╗██╔╝
  ███████║███████╗ ╚███╔╝
  ██╔══██║██╔════╝ ██╔██╗
  ██║  ██║███████╗██╔╝ ██╗
  ╚═╝  ╚═╝╚══════╝ ╚═╝  ╚═╝

  The AI-Powered Pentesting Assistant
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Provider: DeepSeek | Model: deepseek-chat
  Mode: Direct | Type /help for commands
  Tokens: 1 609 / 8 192 (20%)

──────────────────────────────────────────────────────────────────────────────
❯ Type a command or /help
──────────────────────────────────────────────────────────────────────────────
deepseek-chat | 1 609 tokens
```

## Basic Usage

### Ask Hex to do something

```
❯ scan 192.168.1.1 for open ports
```

Hex will automatically use nmap and interpret the results.

### Multi-step tasks

```
❯ pentest example.com
```

Hex creates a plan and executes it step by step:
- Reconnaissance (nmap, whois, dns)
- Web testing (nikto, sqlmap, gobuster)
- Analysis and reporting

### Web search

```
❯ search for CVE-2024-1234
❯ find information about SQL injection
❯ research target.com technology stack
```

## Commands

| Command | Description |
|---------|-------------|
| `/help` | Show available commands and keyboard shortcuts |
| `/clear` | Clear conversation and start fresh |
| `/clear-memory` | Tell AI to forget previous context |
| `/history` | List saved conversations |
| `/resume <id>` | Resume a previous conversation |
| `/tools` | List available pentesting tools |
| `/skills` | List available skills |
| `/skill <name> [vars]` | Run a skill with optional variables |
| `/config` | Show current configuration |
| `/provider` | Switch AI provider |
| `/setup` | Re-run setup wizard (change provider/model) |
| `/status` | Check execution environment |
| `/thinking` | Toggle thinking display (collapsed/expanded) |
| `/tokens` | Show token usage |
| `/summarize` | Manually summarize conversation |
| `/theme` | Switch color theme (dark/light) |
| `/fullscreen` | Toggle fullscreen mode |
| `/editor` | Show external editor info |
| `/quit` | Exit Hex |

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+R` | Reverse search history |
| `Ctrl+T` | Toggle thinking display |
| `Ctrl+A` | Move to start of line |
| `Ctrl+E` | Move to end of line |
| `Ctrl+W` | Delete word backward |
| `Ctrl+U` | Clear line |
| `Ctrl+K` | Delete to end of line |
| `Ctrl+X Ctrl+E` | Open external editor |
| `Tab` | Accept ghost text suggestion |
| `Up/Down` | Navigate history |
| `Shift+Enter` | New line |
| `Ctrl+C` | Cancel input / dismiss error |

## Skills System

Skills are reusable multi-step workflows. Use built-in skills or create your own.

### Run a built-in skill

```
❯ /skill web-recon target=example.com
❯ /skill network-scan target=192.168.1.0/24
❯ /skill password-audit target=10.0.0.1 service=ssh
```

### Ask AI to create a skill

```
❯ Create a skill for web app testing that runs nikto, sqlmap, and gobuster
```

Hex will use the `skill_manage` tool to create a reusable skill.

### List available skills

```
❯ /skills
```

## Automatic Tool Installation

If a required tool is not installed, Hex can install it automatically:

```
❯ Install rustscan
❯ Use rustscan to scan 192.168.1.1
```

Hex uses the `install_tool` function to install tools via apt, pip, npm, go, or git.

## Example Prompts

### Basic Scanning
- "Scan 192.168.1.1 for open ports"
- "Check example.com for SQL injection"
- "Find hidden directories on http://testsite.local"

### Autonomous Tasks
- "Pentest example.com"
- "Full security assessment of target.com"
- "Reconnaissance on 10.0.0.1"

### Research & OSINT
- "Search for recent CVEs in Apache"
- "Find information about Log4j vulnerability"
- "Research target.com technology stack"

### Active Directory
- "Enumerate SMB shares on 192.168.1.100"
- "Check SSL/TLS configuration for example.com"

### Password Attacks
- "Brute force SSH on 10.0.0.1 with common passwords"
- "Crack this NTLM hash: abc123..."

## Switching Providers

Run `/setup` anytime to change AI provider or model:

```
❯ /setup

╔═══════════════════════════════════════╗
║  Welcome to Hex - Initial Setup      ║
╚═══════════════════════════════════════╝

CLOUD PROVIDERS:
  1. OpenAI
  2. Anthropic
  3. Google Gemini
  ...

LOCAL PROVIDERS:
  8. Ollama
  9. LM Studio
  ...
```

## Using Ollama (Local/Free)

1. Install Ollama: https://ollama.com
2. Download a model: `ollama pull llama2-uncensored`
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
  "model": "gpt-4-turbo",
  "executionMode": "direct",
  "apiKeys": {
    "openai": "sk-..."
  }
}
```

Edit this file directly or use `/setup` to reconfigure.

## Troubleshooting

**API key errors?**
- Verify your API key is correct
- Check you have credits/billing enabled
- Try `/setup` to reconfigure

**Ollama not connecting?**
- Make sure Ollama is running: `ollama serve`
- Verify model is downloaded: `ollama list`
- Check base URL is `http://localhost:11434/v1`

**Tools not found?**
- Hex can install missing tools automatically
- Or install manually: `sudo apt install nmap`
- Or use Docker mode with pre-installed tools

**Docker container not running?**
```bash
cd server/docker && docker compose up -d
```
