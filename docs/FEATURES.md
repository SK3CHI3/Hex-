# Hex Features

## Core Capabilities

### Multi-Provider AI Support
- **13 AI Providers**: OpenAI, Anthropic, Google Gemini, DeepSeek, OpenRouter, ModelScope, xAI, Ollama, LM Studio, llama.cpp, vLLM, Jan.ai, Custom
- **Interactive Setup**: First-run wizard guides you through provider selection with connection testing
- **Runtime Switching**: Change providers with `/provider` command without restarting
- **Environment Variables**: Override config with `HEX_PROVIDER`, `HEX_MODEL`, etc.
- **API Key Management**: Secure storage in `~/.hex/config.json`
- **Model Discovery**: Automatically queries local servers for available models

### Execution Modes
- **Direct Mode** (default): Run tools directly on your machine
- **Docker Mode**: Isolated execution in Kali Linux container with 42+ pre-installed tools
- **Automatic Detection**: Checks tool availability before execution

### Tool Execution
- **17 Built-in Tools**: Pre-configured pentesting tools (nmap, sqlmap, hydra, hashcat, nikto, gobuster, etc.)
- **Automatic Tool Installation**: AI installs missing tools on-the-fly via `install_tool`
- **Smart Tool Loading**: Only sends relevant tools to AI based on context
- **Agentic Loop**: Multi-step task execution with automatic tool chaining (up to 100 rounds)
- **Real-time Output**: Stream tool output as it executes

### Skills System
- **Reusable Workflows**: Create multi-step attack sequences with `/skill` command
- **Variable Substitution**: Use `{{target}}`, `{{domain}}` placeholders in skills
- **Built-in Skills**: web-recon, network-scan, password-audit, vuln-scan
- **AI-Created Skills**: Ask AI to "save this as a skill" and it creates reusable workflows
- **Skill Management**: List, create, delete skills with `skill_manage` tool

### Web Search
- **DuckDuckGo Integration**: Search the internet without API keys
- **OSINT Capabilities**: Research CVEs, exploits, vulnerabilities
- **Technology Lookup**: Identify tech stacks and subdomains
- **Documentation Search**: Find tool documentation and usage examples
- **Result Caching**: 1-hour cache for repeated queries

### Autonomous Planning
- **Multi-Step Execution**: AI creates and follows numbered plans
- **Progress Tracking**: Shows "Step 1/5: Reconnaissance..." style updates
- **Result Integration**: Each step's output informs the next step
- **Up to 100 Rounds**: Complex tasks can chain multiple tool executions

### Thinking Models
- **Reasoning Support**: Works with models that output thinking/reasoning
- **Collapsible Display**: Toggle between compact and expanded thinking views
- **Visual Indicators**: 💭 shows when AI is reasoning
- **Command**: `/thinking` to toggle display mode

## User Interface

### React + Ink Terminal UI
- **Component-Based Architecture**: Modular React components for all UI elements
- **Fixed Input at Bottom**: Input box stays at terminal bottom while content scrolls
- **Virtual Scrolling**: Only renders visible messages for performance
- **Semantic Color Themes**: Dark/light themes with consistent color categories
- **Syntax Highlighting**: Color-coded slash commands, file paths, and variables

### Status Indicators
- **Animated Braille Spinner**: Cycles through frames during AI thinking and tool execution
- **Inline Updates**: Status appears on the same line, keeping interface clean
- **Color Coding**: Different colors for thinking (blue), tools (amber), responses (sage green)
- **Processing Indicator**: Shows "Processing..." during slash command execution

### Input Features
- **Ghost Text Autocomplete**: Inline suggestions for slash commands
- **Paste Handling**: Detects large pastes, shows placeholder, expands on submit
- **Reverse Search**: Ctrl+R searches command history
- **External Editor**: Ctrl+X Ctrl+E opens input in vim/nano/etc.
- **Multi-line Input**: Shift+Enter or Ctrl+J for newlines

### Keyboard Shortcuts
- **Ctrl+R**: Reverse search history
- **Ctrl+T**: Toggle thinking display
- **Ctrl+A/E**: Move to start/end of line
- **Ctrl+W**: Delete word backward
- **Ctrl+U/K**: Kill line left/right
- **Ctrl+X Ctrl+E**: Open external editor
- **Tab**: Accept ghost text suggestion
- **Up/Down**: Navigate history

### Cancellation
- **Ctrl+C**: Cancel current operation during thinking or tool execution
- **Graceful Abort**: Stops AI request and returns to prompt
- **Context Preserved**: Conversation history maintained after cancellation

### Conversation Management
- **Persistent History**: Conversations saved to `~/.hex/conversations/`
- **Resume Sessions**: `/resume <id>` to continue previous conversations
- **List History**: `/history` shows all saved conversations
- **Clear Context**: `/clear` starts fresh conversation
- **Clear Memory**: `/clear-memory` tells AI to forget previous context

### Command System
- `/help` - Show available commands and keyboard shortcuts
- `/clear` - Clear conversation and start fresh
- `/clear-memory` - Tell AI to forget previous context
- `/history` - List saved conversations
- `/resume <id>` - Resume a previous conversation
- `/tools` - List available pentesting tools
- `/skills` - List available skills
- `/skill <name> [vars]` - Run a skill with optional variables
- `/config` - Show current configuration
- `/provider` - Switch AI provider
- `/setup` - Run setup wizard to change provider/model
- `/status` - Check execution environment status
- `/thinking` - Toggle thinking display (collapsed/expanded)
- `/tokens` - Show token usage
- `/summarize` - Manually summarize conversation
- `/theme` - Switch color theme (dark/light)
- `/fullscreen` - Toggle fullscreen mode
- `/editor` - Show external editor info
- `/quit` - Exit Hex

## Error Handling

### Network Resilience
- **Automatic Retries**: 3 retry attempts with exponential backoff (1s, 2s, 4s)
- **Network Detection**: Checks connectivity before retrying
- **Partial Content Preservation**: Stream interruptions don't lose already-received content
- **Progress Saving**: Conversation saved before showing error

### Dismissible Errors
- **Error Screen**: Press any key to dismiss errors and continue
- **No App Death**: Errors don't crash the application
- **Context Preservation**: Conversation state maintained after errors

### Stream Handling
- **Connection Drop Recovery**: Partial content preserved when connection drops
- **Abort Handling**: Clean cancellation on Ctrl+C
- **Timeout Protection**: 10-second timeout on network checks

## Security & Privacy

### Local-First
- **No Cloud Required**: All data stays on your machine
- **Local Storage**: Conversations and config in `~/.hex/`
- **API Keys**: Stored locally, only sent to chosen provider

### Execution Safety
- **Docker Isolation**: Optional containerized execution for safety
- **Non-Root User**: Docker container runs as `hexagent` user
- **Tool Installation**: AI can install missing tools automatically

### Ethical Guidelines
- Lab environment framing in system prompt
- Positive framing to prevent refusals
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

### Automatic Tool Installation
- **install_tool**: AI installs missing tools on-the-fly
- **Multiple Methods**: Supports apt, pip, npm, go, git
- **Auto-Detection**: Determines best installation method
- **Docker & Direct**: Works in both execution modes

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
- **Tool Definitions**: Add new tools in `cli/tools/tools.js`
- **Skills**: Create reusable attack workflows
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
- Virtual scrolling for long conversations
- Progressive rendering of message history
- Minimal overhead in Direct mode
- Docker execution optimized for speed

### Token Management
- **Automatic Summarization**: Summarizes old messages when approaching token limit
- **Token Counting**: Accurate token counting with js-tiktoken
- **Model-Specific Limits**: Different limits for different models
- **Manual Summarization**: `/summarize` command for manual control

## Developer Features

### Clean Architecture
- Modular design with separate concerns
- React + Ink component-based UI
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

---

**Hex** is actively developed with focus on usability, security, and extensibility. All features work together to provide a seamless pentesting assistance experience.
