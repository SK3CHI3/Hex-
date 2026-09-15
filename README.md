<div align="center">

```
  ██╗  ██╗███████╗██╗  ██╗
  ██║  ██║██╔════╝╚██╗██╔╝
  ███████║███████╗ ╚███╔╝
  ██╔══██║██╔════╝ ██╔██╗
  ██║  ██║███████╗██╔╝ ██╗
  ╚═╝  ╚═╝╚══════╝ ╚═╝  ╚═╝
```

**AI-Powered Pentesting Assistant for Terminal**

[![Node](https://img.shields.io/badge/Node-18+-339933?style=flat-square&logo=node.js&logoColor=white)](https://nodejs.org)
[![Docker](https://img.shields.io/badge/Docker-Optional-2496ED?style=flat-square&logo=docker)](https://docker.com)
[![License](https://img.shields.io/badge/License-MIT-blue?style=flat-square)](LICENSE)
[![Stars](https://img.shields.io/github/stars/SK3CHI3/Hex-?style=flat-square&logo=github)](https://github.com/SK3CHI3/Hex-/stargazers)

</div>



## About

Hex is a terminal-native AI pentesting assistant built with React + Ink. Chat with AI, execute security tools through natural language, create reusable attack workflows with skills, and automatically install missing tools — all without leaving your terminal. Supports 13 AI providers (5 local, 7 cloud, and 1 custom endpoint) and optional Docker isolation with Kali Linux.

---

## Installation

```bash
npm install -g hex-ai
hex
```

The setup wizard configures your AI provider and execution mode on first run.

### Recommended Local Model

For unrestricted pentesting assistance, we recommend running **llama2-uncensored** locally with Ollama:

```bash
ollama pull llama2-uncensored
```

Unlike cloud providers, local models have no content filters — ideal for security research and pentesting workflows where you need complete freedom in tool usage and analysis.

### Development

```bash
git clone https://github.com/SK3CHI3/Hex-.git
cd Hex-
npm install
npm start
```

---

## Documentation

Complete guides and references:

| Document | Description |
|----------|-------------|
| **[Features](docs/FEATURES.md)** | Complete feature overview |
| **[Setup Guide](docs/SETUP_GUIDE.md)** | Installation, configuration, and first run |
| **[Quick Start](docs/QUICK_START.md)** | CLI commands and usage examples |
| **[Multi-Provider AI](docs/MULTI_PROVIDER.md)** | Configure 13 AI providers (OpenAI, Anthropic, Ollama, etc.) |
| **[Tool Arsenal](docs/TOOL_ARSENAL.md)** | 17 built-in tools + automatic tool installation |
| **[Custom Tools](docs/CUSTOM_TOOLS.md)** | Install and use additional tools beyond the built-in set |
| **[Architecture](docs/ARCHITECTURE.md)** | How Hex works under the hood |
| **[Local LLM](docs/local-llm.md)** | Running AI models locally with Ollama, LM Studio, etc. |

---

## Tech Stack

- **Runtime:** Node.js 18+ with React + Ink for terminal UI
- **UI:** Component-based architecture with semantic color themes
- **AI:** 13 providers — OpenAI, Anthropic, Google, DeepSeek, Ollama, LM Studio, and more
- **Execution:** Direct (default) or Docker + Kali Linux
- **Storage:** Local JSON in `~/.hex/`
- **Skills:** Reusable multi-step attack workflows

---

## Key Features

- **17 Built-in Tools** — nmap, sqlmap, hydra, hashcat, nikto, gobuster, and more
- **Automatic Tool Installation** — AI installs missing tools on-the-fly via `install_tool`
- **Skills System** — Create reusable attack workflows with `/skill` command
- **Agentic Loop** — Multi-step task execution with automatic tool chaining (up to 100 rounds)
- **Web Search** — DuckDuckGo integration for OSINT, CVE research, and documentation
- **Multi-Provider AI** — Switch between 13 providers with `/provider` command
- **React + Ink UI** — Fixed input at bottom, scrolling output, syntax highlighting
- **Thinking Models** — Support for models with reasoning capabilities
- **Conversation Management** — Persistent history with `/resume` and `/history`
- **Docker Isolation** — Optional Kali Linux container with 42+ pre-installed tools

---

## Contributing

PRs welcome! See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

---

<div align="center">

**Hack Ethically · Learn Continuously · Share Knowledge**

[Report Bug](https://github.com/SK3CHI3/Hex-/issues) · [Request Feature](https://github.com/SK3CHI3/Hex-/issues) · [Security](SECURITY.md)

</div>
