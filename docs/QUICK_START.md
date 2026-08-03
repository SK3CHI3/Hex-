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
  ██║  ██║██╔════╝╚██╗██╔╝
  ███████║███████╗ ╚███╔╝ 
  ██╔══██║██╔════╝ ██╔██╗ 
  ██║  ██║███████╗██╔╝ ██╗
  ╚═╝  ╚═╝╚══════╝ ╚═╝  ╚═╝

  The AI-Powered Pentesting Assistant
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Provider: ModelScope | Model: Qwen3.7-Plus
  Mode: Direct | Type /help for commands

❯ scan 192.168.1.1 for open ports
```

## Autonomous Planning Mode

For complex tasks, Hex creates and executes a plan automatically:

```
❯ pentest example.com

I'll create a plan:
  1. Reconnaissance - scan ports, enumerate subdomains
  2. Web testing - check for vulnerabilities
  3. Analysis - compile findings

Executing Step 1/3: Reconnaissance...
[executes nmap, subfinder]
Step 1 complete. Found 3 open ports, 5 subdomains.

Executing Step 2/3: Web Testing...
[executes nikto, sqlmap]
...
```

## Web Search

Hex can search the internet for OSINT, CVE lookups, and research:

```
❯ search for CVE-2024-1234
❯ find information about SQL injection
❯ research target.com technology stack
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
| `/provider` | Switch AI provider |
| `/setup` | Re-run setup wizard (change provider/model) |
| `/status` | Check execution environment |
| `/thinking` | Toggle thinking display (collapsed/expanded) |
| `/quit` | Exit Hex |

## Interface Features

### Status Indicators
Hex shows real-time status while working:
- **AI is thinking...** - Shows when the AI is processing
- **Running [tool]...** - Shows during tool execution
- Status updates inline, keeping the interface clean

### Collapsible Thinking
By default, AI reasoning is shown compactly:
```
💭 [Thinking] (123 chars)
```

Toggle full thinking display with `/thinking`:
- **Collapsed** (default): Shows character count only
- **Expanded**: Shows full reasoning process

### Cancellation
Press **Ctrl+C** to cancel the current operation:
- Stops AI thinking mid-stream
- Cancels tool execution
- Returns to prompt gracefully
- Conversation history is preserved

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
