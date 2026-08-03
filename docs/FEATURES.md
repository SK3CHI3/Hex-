# Hex Features

## Core Capabilities

### Multi-Provider AI Support
- **9 AI Providers**: OpenAI, Anthropic, Google Gemini, Ollama, DeepSeek, OpenRouter, ModelScope, xAI, Custom
- **Interactive Setup**: First-run wizard guides you through provider selection
- **Runtime Switching**: Change providers with `/provider` command without restarting
- **Environment Variables**: Override config with `HEX_PROVIDER`, `HEX_MODEL`, etc.
- **API Key Management**: Secure storage in `~/.hex/config.json`

### Execution Modes
- **Direct Mode** (default): Run tools directly on your machine
- **Docker Mode**: Isolated execution in Kali Linux container with 42+ pre-installed tools
- **Automatic Detection**: Checks tool availability before execution

### Tool Execution
- **42+ Built-in Tools**: Pre-configured pentesting tools (nmap, sqlmap, hydra, etc.)
- **Custom Tools**: Ask Hex to install any tool you need
- **Smart Tool Loading**: Only sends relevant tools to AI based on context
- **Agentic Loop**: Multi-step task execution with automatic tool chaining
- **Real-time Output**: Stream tool output as it executes

### Web Search
- **DuckDuckGo Integration**: Search the internet without API keys
- **OSINT Capabilities**: Research CVEs, exploits, vulnerabilities
- **Technology Lookup**: Identify tech stacks and subdomains
- **Documentation Search**: Find tool documentation and usage examples

### Autonomous Planning
- **Multi-Step Execution**: AI creates and follows numbered plans
- **Progress Tracking**: Shows "Step 1/5: Reconnaissance..." style updates
- **Result Integration**: Each step's output informs the next step
- **Up to 10 Rounds**: Complex tasks can chain multiple tool executions

### Thinking Models
- **Reasoning Support**: Works with models that output thinking/reasoning
- **Collapsible Display**: Toggle between compact and expanded thinking views
- **Visual Indicators**: 💭 shows when AI is reasoning
- **Command**: `/thinking` to toggle display mode

## User Interface

### Status Indicators
- **Active Status**: Shows "AI is thinking..." and "Running [tool]..." in real-time
- **Inline Updates**: Status appears on the same line, keeping interface clean
- **Color Coding**: Different colors for thinking (dim), tools (yellow), responses (green)

### Cancellation
- **Ctrl+C**: Cancel current operation during thinking or tool execution
- **Graceful Abort**: Stops AI request and returns to prompt
- **Context Preserved**: Conversation history maintained after cancellation

### Conversation Management
- **Persistent History**: Conversations saved to `~/.hex/conversations/`
- **Resume Sessions**: `/resume <id>` to continue previous conversations
- **List History**: `/history` shows all saved conversations
- **Clear Context**: `/clear` starts fresh conversation

### Command System
- `/help` - Show available commands
- `/clear` - Clear conversation and start fresh
- `/history` - List saved conversations
- `/resume <id>` - Resume a previous conversation
- `/tools` - List available pentesting tools
- `/config` - Show current configuration
- `/provider` - Switch AI provider
- `/setup` - Run setup wizard to change provider/model
- `/status` - Check execution environment status
- `/thinking` - Toggle thinking display (collapsed/expanded)
- `/quit` - Exit Hex

## Security & Privacy

### Local-First
- **No Cloud Required**: All data stays on your machine
- **Local Storage**: Conversations and config in `~/.hex/`
- **API Keys**: Stored locally, only sent to chosen provider

### Execution Safety
- **Authorization Reminder**: AI reminds you to only test authorized systems
- **Docker Isolation**: Optional containerized execution for safety
- **Timeout Protection**: 5-minute timeout per command
- **Non-Root User**: Docker container runs as `hexagent` user

### Ethical Guidelines
- Built-in ethical reminders in system prompt
- AI refuses to test unauthorized targets
- Encourages responsible disclosure

## Platform Support

### Cross-Platform
- **Windows**: Full support with PowerShell/CMD commands
- **macOS**: Unix command support
- **Linux**: Native Linux commands
- **OS Detection**: Automatically uses correct command syntax

### Installation Methods
- **npm Global**: `npm install -g hex-ai` then run `hex`
- **From Source**: Clone repo and run `npm start`
- **Docker**: Optional Kali container for tool isolation

## Advanced Features

### Custom Tool Installation
- Ask Hex to install any tool: "Install rustscan"
- Works in both Direct and Docker modes
- AI handles installation commands automatically
- Tools persist across sessions in Direct mode

### Smart Context
- **OS Awareness**: Knows your operating system and uses correct commands
- **Tool Availability**: Checks if tools are installed before use
- **Conversation Context**: Maintains context across multiple turns
- **Tool Result Integration**: Feeds tool output back to AI for analysis

### Configuration Priority
1. Environment variables (highest)
2. Config file (`~/.hex/config.json`)
3. Setup wizard defaults (lowest)

### Extensibility
- **Custom Tools**: Install and use any pentesting tool
- **Custom Providers**: Connect to any OpenAI-compatible API
- **Tool Definitions**: Add new tools in `cli/tools.js`
- **Open Architecture**: Easy to extend and customize

## Performance

### Optimized Payloads
- Smart tool loading reduces API payload size
- Only sends relevant tools based on context
- Saves bandwidth and reduces latency

### Streaming Responses
- Real-time token streaming for fast feedback
- No waiting for complete response
- See AI thinking as it happens

### Efficient Execution
- Parallel tool execution when possible
- Minimal overhead in Direct mode
- Docker execution optimized for speed

## Developer Features

### Clean Architecture
- Modular design with separate concerns
- Easy to add new providers
- Simple tool definition format
- Extensible command system

### Debugging
- Verbose error messages
- Tool execution logging
- Conversation history inspection
- Config file transparency

### Testing
- Built-in `/status` command for environment checks
- Tool availability verification
- Docker container health checks
- API connectivity testing

## Roadmap Ideas

Potential future enhancements:
- Plugin system for custom tools
- Web UI for conversation management
- Export conversations to PDF/HTML
- Custom tool profiles for different engagement types
- Integration with vulnerability databases
- Automated report generation
- Team collaboration features
- Cloud sync for conversations (optional)

---

**Hex** is actively developed with focus on usability, security, and extensibility. All features work together to provide a seamless pentesting assistance experience.
