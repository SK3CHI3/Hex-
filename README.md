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

---

## About

Hex is a terminal-native AI pentesting assistant that runs 42+ security tools through natural language. Chat with AI, execute nmap/sqlmap/hydra/hashcat, and get real-time results — all without leaving your terminal. Supports multiple AI providers (OpenAI, Anthropic, Google, Ollama) and optional Docker isolation.

---

## Installation

```bash
git clone https://github.com/SK3CHI3/Hex-.git
cd Hex-
npm install
npm start
```

The setup wizard configures your AI provider and execution mode on first run.

---

## Documentation

Complete guides and references:

| Document | Description |
|----------|-------------|
| **[Setup Guide](docs/SETUP_GUIDE.md)** | Installation, configuration, and first run |
| **[Quick Start](docs/QUICK_START.md)** | CLI commands and usage examples |
| **[Multi-Provider AI](docs/MULTI_PROVIDER.md)** | Configure OpenAI, Anthropic, Google, Ollama, or custom endpoints |
| **[Tool Arsenal](docs/TOOL_ARSENAL.md)** | All 42+ pentesting tools available |
| **[Custom Tools](docs/CUSTOM_TOOLS.md)** | Install and use additional tools beyond the built-in 42+ |
| **[Architecture](docs/ARCHITECTURE.md)** | How Hex works under the hood |

---

## Tech Stack

- **Runtime:** Node.js 18+ with readline + chalk
- **AI:** OpenAI / Anthropic / Google Gemini / Ollama / Custom OpenAI-compatible
- **Execution:** Direct (default) or Docker + Kali Linux
- **Storage:** Local JSON in `~/.hex/`

---

## Contributing

PRs welcome! See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

---

<div align="center">

**Hack Ethically · Learn Continuously · Share Knowledge**

[Report Bug](https://github.com/SK3CHI3/Hex-/issues) · [Request Feature](https://github.com/SK3CHI3/Hex-/issues) · [Security](SECURITY.md)

</div>
