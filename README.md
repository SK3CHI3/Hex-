<div align="center">

# Hex

**AI-Powered Pentesting Assistant — Runs in Your Terminal**

[![Node](https://img.shields.io/badge/Node-18+-339933?style=flat-square&logo=node.js&logoColor=white)](https://nodejs.org)
[![Docker](https://img.shields.io/badge/Docker-Optional-2496ED?style=flat-square&logo=docker)](https://docker.com)
[![License](https://img.shields.io/badge/License-MIT-blue?style=flat-square)](LICENSE)
[![Stars](https://img.shields.io/github/stars/SK3CHI3/Hex-?style=flat-square&logo=github)](https://github.com/SK3CHI3/Hex-/stargazers)

</div>

---

## About

Hex is a terminal-native AI pentesting assistant. Type `hex` in your terminal and chat with an AI that can run 42+ security tools. Choose your AI provider (OpenAI, Anthropic, Google, Ollama, or custom), run tools directly on your machine or in an optional Docker container, and get real-time results — all without leaving your terminal.

---

## Quick Start

```bash
git clone https://github.com/SK3CHI3/Hex-.git
cd Hex-
npm install
npm start                    # Launch Hex (setup wizard runs on first launch)
```

That's it. The setup wizard will walk you through choosing your AI provider and execution mode.

---

## Features

- **Multi-Provider AI** — OpenAI, Anthropic, Google Gemini, Ollama (local), or any OpenAI-compatible API
- **Direct Execution** — Run pentesting tools directly on your machine (default)
- **Optional Docker** — Isolate tools in a Kali Linux container if preferred
- **14 Built-in Tools** — nmap, sqlmap, hydra, hashcat, gobuster, nikto, and more
- **Local History** — Conversations saved to ~/.hex/ (never leaves your machine)
- **Interactive Setup** — First-run wizard configures everything

---

## Usage

```bash
npm start
```

On first run, you'll see the setup wizard:

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

Enter number (1-5):
```

After setup, just chat:

```
❯ scan 192.168.1.1 for open ports

  ⚡ Running nmap_scan...
  $ nmap -sV -sC 192.168.1.1

  Starting Nmap 7.94 ( https://nmap.org )
  Nmap scan report for 192.168.1.1
  PORT    STATE SERVICE  VERSION
  22/tcp  open  ssh      OpenSSH 8.9
  80/tcp  open  http     nginx 1.18.0

  Found 2 open ports. Want me to dig deeper?
```

### Commands

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

---

## AI Providers

| Provider | Setup | Best For |
|----------|-------|----------|
| **OpenAI** | API key from platform.openai.com | Best overall quality |
| **Anthropic** | API key from console.anthropic.com | Long context, careful analysis |
| **Google** | API key from makersuite.google.com | Free tier available |
| **Ollama** | Run `ollama serve` locally | 100% offline, no API costs |
| **Custom** | Any OpenAI-compatible endpoint | Self-hosted models, Azure, etc. |

Switch providers anytime with `/setup`.

---

## Execution Modes

### Direct Mode (Default)
Tools run directly on your machine. Best for:
- Local network pentesting
- Quick scans without container overhead
- Using your existing tool installations

### Docker Mode
Tools run in an isolated Kali Linux container. Best for:
- Pre-built tool environment (42+ tools)
- Isolation from host system
- Reproducible results

To use Docker mode:
```bash
npm run docker:build    # Build Kali container (~15-30 min)
npm run docker:up       # Start container
```

Then run `/setup` in Hex and select "Docker" execution mode.

---

## Documentation

| Doc | Description |
|-----|-------------|
| [Setup Guide](docs/SETUP_GUIDE.md) | Installation and configuration |
| [Quick Start](docs/QUICK_START.md) | CLI usage and commands |
| [Architecture](docs/ARCHITECTURE.md) | How Hex works under the hood |
| [Tool Arsenal](docs/TOOL_ARSENAL.md) | All 42+ available tools |

---

## Tech Stack

| Component | Tech |
|-----------|------|
| CLI | Node.js + readline + chalk |
| AI | OpenAI / Anthropic / Google / Ollama / Custom |
| Tools | Direct execution or Docker + Kali Linux |
| Storage | Local JSON files (~/.hex/) |

---

## Support the Project

<div align="center">

### Star this repo — it helps others discover Hex!

[![GitHub Repo stars](https://img.shields.io/github/stars/SK3CHI3/Hex-?style=for-the-badge&logo=github&color=gold)](https://github.com/SK3CHI3/Hex-/stargazers)

</div>

---

## Contributing

PRs welcome! See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

---

<div align="center">

**Hack Ethically · Learn Continuously · Share Knowledge**

[Report Bug](https://github.com/SK3CHI3/Hex-/issues) · [Request Feature](https://github.com/SK3CHI3/Hex-/issues) · [Security](SECURITY.md)

</div>
