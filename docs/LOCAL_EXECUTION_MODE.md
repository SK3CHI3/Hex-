# 🖥️ Hex AI - Local Execution Mode Feature

> **Enable real-world red teaming with local tool execution while maintaining AI control**

## 📋 Table of Contents

- [Overview](#overview)
- [Problem Statement](#problem-statement)
- [Solution: Local Execution Mode](#solution-local-execution-mode)
- [Architecture](#architecture)
- [Key Features](#key-features)
- [Implementation Approach](#implementation-approach)
- [Security Considerations](#security-considerations)
- [User Flow](#user-flow)
- [Technical Architecture](#technical-architecture)
- [Benefits for Red Teamers](#benefits-for-red-teamers)
- [Implementation Roadmap](#implementation-roadmap)
- [Alternative Approaches](#alternative-approaches)

---

## 🎯 Overview

**Local Execution Mode** allows users to download and execute security tools **locally on their own machines** while maintaining **AI-controlled orchestration** through Hex AI. This feature is critical for professional red teamers who need to:

- Execute tools on their **local network** (internal network scanning)
- Use their **own computing resources** (better performance, no server limits)
- Maintain **full control** over their execution environment
- Still benefit from **AI-driven automation** and orchestration

---

## 🚨 Problem Statement

### Current Limitations

The current Hex AI architecture executes all tools in **remote Docker containers** on the server:

```
User → Frontend → WebSocket → Server → Docker Container (Remote)
```

**Issues for Real-World Red Teaming:**

1. **Network Limitations**
   - Cannot scan internal networks (192.168.x.x, 10.x.x.x)
   - Server's network perspective differs from user's network
   - Cannot access local services or internal assets
   - VPN/network restrictions prevent proper reconnaissance

2. **Performance & Resource Constraints**
   - Server resources are shared across all users
   - Limited CPU/memory for intensive scans
   - Network bandwidth limitations
   - No access to user's high-performance hardware (GPUs for hashcat, etc.)

3. **Legal & Compliance Issues**
   - Remote execution may violate organizational policies
   - Data privacy concerns (scan results on remote servers)
   - Compliance requirements (some organizations require local execution)
   - Audit trail concerns (execution happens on external servers)

4. **Red Team Workflow Issues**
   - Red teamers often work on **isolated networks** (air-gapped, VPN)
   - Need to test against **internal infrastructure** (active directory, internal web apps)
   - Require **offline capabilities** (no internet connection to server)
   - Need **custom tooling** and **local configurations**

---

## ✅ Solution: Local Execution Mode

### Concept

Enable users to **download Docker images** and run a **local execution agent** that:

1. **Downloads Tools Locally**: User downloads the Hex AI Kali Linux Docker image
2. **Runs Local Agent**: A lightweight agent runs on user's machine
3. **Connects to AI**: Agent connects to Hex AI backend (WebSocket/API)
4. **AI Controls Execution**: Hex AI sends commands to local agent
5. **Local Execution**: Agent executes commands in local Docker container
6. **Streams Results**: Results stream back to Hex AI for analysis

### Architecture Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    Hex AI Frontend (Browser)                 │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  Chat Interface                                        │  │
│  │  - User requests: "Scan my internal network"          │  │
│  │  - AI plans: "Run nmap scan on 192.168.1.0/24"       │  │
│  └───────────────────────────────────────────────────────┘  │
└────────────────────────┬────────────────────────────────────┘
                         │
                         │ HTTP/WebSocket
                         │ (Command & Control)
                         │
        ┌────────────────┴────────────────┐
        │                                 │
        ▼                                 ▼
┌───────────────┐              ┌──────────────────────┐
│ Hex AI Backend│              │ Local Execution Agent│
│ (Cloud Server)│              │ (User's Machine)     │
│               │              │                      │
│ - AI Planning │◄────────────►│ - Docker Executor    │
│ - Tool Schemas│   WebSocket  │ - Command Runner     │
│ - Orchestration│  Connection │ - Result Streaming   │
└───────────────┘              └──────────┬───────────┘
                                          │
                                          │ Docker Exec
                                          │
                                 ┌────────▼─────────┐
                                 │ Local Docker     │
                                 │ Container        │
                                 │ (hex-kali-tools) │
                                 │                  │
                                 │ - Nmap           │
                                 │ - SQLMap         │
                                 │ - Metasploit     │
                                 │ - etc.           │
                                 └──────────────────┘
```

---

## 🎨 Key Features

### 1. **Local Docker Image Download**

Users can download a pre-configured Docker image containing all security tools:

```bash
# Download Hex AI Kali Tools Image
docker pull hexai/kali-tools:latest

# Or download as tar file for offline use
wget https://hexai.com/downloads/hex-kali-tools-latest.tar
docker load -i hex-kali-tools-latest.tar
```

**Image Contents:**
- Kali Linux base image
- All security tools (nmap, sqlmap, metasploit, etc.)
- Pre-configured wordlists
- Hex AI agent binary
- Execution scripts

### 2. **Local Execution Agent**

A lightweight agent runs on the user's machine:

```bash
# Install Hex AI Local Agent
npm install -g @hexai/local-agent

# Or download binary
# Windows: hex-agent.exe
# Linux: hex-agent
# macOS: hex-agent

# Start agent
hex-agent start --mode local
```

**Agent Capabilities:**
- Connects to Hex AI backend via WebSocket
- Receives commands from AI
- Executes commands in local Docker container
- Streams stdout/stderr back to AI
- Handles authentication & authorization
- Manages Docker container lifecycle

### 3. **AI-Controlled Execution**

Hex AI maintains full control over tool execution:

- **Command Planning**: AI plans multi-step workflows
- **Tool Selection**: AI selects appropriate tools
- **Parameter Generation**: AI generates command arguments
- **Result Analysis**: AI analyzes outputs and generates reports
- **Error Handling**: AI handles errors and retries
- **Workflow Orchestration**: AI orchestrates complex multi-tool workflows

### 4. **Hybrid Mode Support**

Users can choose execution mode:

- **Cloud Mode**: Execute on remote server (current implementation)
- **Local Mode**: Execute on local machine (new feature)
- **Hybrid Mode**: Mix both (some tools local, some cloud)

---

## 🏗️ Implementation Approach

### Phase 1: Local Agent Development

#### 1.1 Local Agent Binary

Create a lightweight agent that runs on user's machine:

**Technologies:**
- **Node.js** or **Go** for cross-platform support
- **Docker SDK** for container management
- **WebSocket Client** for backend communication
- **Electron** (optional) for desktop GUI

**Agent Responsibilities:**
- Manage Docker container lifecycle
- Execute commands in container
- Stream output to backend
- Handle authentication
- Manage local configuration

**Example Agent Structure:**

```typescript
// local-agent/src/agent.ts
class HexLocalAgent {
  private docker: Docker;
  private ws: WebSocket;
  private containerId: string | null = null;

  async start() {
    // 1. Connect to Hex AI backend
    await this.connectToBackend();
    
    // 2. Pull/load Docker image
    await this.ensureDockerImage();
    
    // 3. Start Docker container
    await this.startContainer();
    
    // 4. Listen for commands
    this.listenForCommands();
  }

  async executeCommand(command: string, args: string[]) {
    // Execute in local Docker container
    const result = await this.docker.exec({
      container: this.containerId,
      command: [command, ...args],
      user: 'hexagent'
    });
    
    // Stream output to backend
    this.streamOutput(result);
  }
}
```

#### 1.2 Docker Image Distribution

**Option A: Docker Hub**
```bash
docker pull hexai/kali-tools:latest
```

**Option B: Direct Download (Tar File)**
```bash
# Download image as tar file
wget https://hexai.com/downloads/hex-kali-tools-latest.tar

# Load into Docker
docker load -i hex-kali-tools-latest.tar
```

**Option C: Docker Registry**
```bash
docker pull registry.hexai.com/kali-tools:latest
```

### Phase 2: Backend Integration

#### 2.1 Execution Mode Selection

Modify backend to support execution mode:

```typescript
// server/index.js
async function executeCommand(ws, payload, userId) {
  const { command, args, executionId, mode } = payload;
  
  if (mode === 'local') {
    // Route to local agent
    return await executeLocalCommand(ws, payload, userId);
  } else {
    // Execute in remote Docker (current implementation)
    return await executeRemoteCommand(ws, payload, userId);
  }
}
```

#### 2.2 Local Agent Communication

Backend communicates with local agents via WebSocket:

```typescript
// Backend tracks connected local agents
const localAgents = new Map<string, WebSocket>();

// Local agent connects
ws.on('message', (message) => {
  const { type, payload } = JSON.parse(message);
  
  if (type === 'agent_register') {
    localAgents.set(payload.agentId, ws);
  }
  
  if (type === 'execute_local') {
    const agentWs = localAgents.get(payload.agentId);
    agentWs.send(JSON.stringify({
      type: 'execute',
      payload: { command, args }
    }));
  }
});
```

### Phase 3: Frontend Integration

#### 3.1 Execution Mode Toggle

Add UI to select execution mode:

```typescript
// src/components/ExecutionModeToggle.tsx
function ExecutionModeToggle() {
  const [mode, setMode] = useState<'cloud' | 'local'>('cloud');
  
  return (
    <Select value={mode} onValueChange={setMode}>
      <SelectItem value="cloud">Cloud Execution</SelectItem>
      <SelectItem value="local">Local Execution</SelectItem>
    </Select>
  );
}
```

#### 3.2 Local Agent Status

Show local agent connection status:

```typescript
// src/components/LocalAgentStatus.tsx
function LocalAgentStatus() {
  const { isConnected, agentVersion } = useLocalAgent();
  
  return (
    <div>
      {isConnected ? (
        <Badge variant="success">Local Agent Connected</Badge>
      ) : (
        <Badge variant="warning">Local Agent Disconnected</Badge>
      )}
    </div>
  );
}
```

---

## 🔐 Security Considerations

### 1. **Authentication & Authorization**

**Local Agent Authentication:**
- Local agent authenticates with Hex AI backend using JWT token
- Token obtained from user's Hex AI session
- Token stored securely on local machine (encrypted)

**Command Authorization:**
- Backend validates all commands before sending to local agent
- Local agent validates commands before execution
- Whitelist of allowed tools and commands
- Block dangerous operations (rm -rf, format, etc.)

### 2. **Network Security**

**Secure Communication:**
- WebSocket connection over **WSS** (WebSocket Secure)
- TLS 1.3 encryption
- Certificate pinning for backend
- Mutual TLS (mTLS) for agent authentication (optional)

**Firewall Considerations:**
- Local agent initiates connection (outbound only)
- No inbound ports required on user's machine
- Works behind firewalls and NAT

### 3. **Local Execution Security**

**Docker Security:**
- Run containers as non-root user (`hexagent`)
- Resource limits (CPU, memory)
- Network isolation (optional)
- Read-only filesystem (optional)
- Capability dropping (remove dangerous capabilities)

**Command Validation:**
- Validate all commands before execution
- Block dangerous patterns (rm -rf, format, etc.)
- Rate limiting (prevent resource exhaustion)
- Timeout enforcement (prevent hanging processes)

### 4. **Data Privacy**

**Local Data:**
- Scan results stay on user's machine (optional)
- User controls what data is sent to backend
- Encrypted local storage
- Optional: Full offline mode (no data sent to backend)

**Backend Data:**
- Minimal data sent to backend (command outputs, logs)
- User consent for data sharing
- GDPR compliance
- Data retention policies

### 5. **Malware Protection**

**Image Integrity:**
- Signed Docker images (Docker Content Trust)
- Checksum verification
- Regular security audits
- Vulnerability scanning

**Agent Integrity:**
- Signed binaries (code signing)
- Checksum verification
- Automatic updates
- Vulnerability patching

---

## 👤 User Flow

### Step 1: Download & Install

```bash
# 1. Download Hex AI Local Agent
# Option A: npm
npm install -g @hexai/local-agent

# Option B: Binary download
wget https://hexai.com/downloads/hex-agent-latest-linux-amd64
chmod +x hex-agent-latest-linux-amd64
sudo mv hex-agent-latest-linux-amd64 /usr/local/bin/hex-agent

# 2. Download Docker Image
docker pull hexai/kali-tools:latest

# Or download tar file for offline use
wget https://hexai.com/downloads/hex-kali-tools-latest.tar
docker load -i hex-kali-tools-latest.tar
```

### Step 2: Authenticate

```bash
# Start local agent
hex-agent start

# Agent will prompt for authentication
# User logs in with Hex AI credentials
# Agent obtains JWT token and stores it securely
```

### Step 3: Connect to Hex AI

```bash
# Agent connects to Hex AI backend
# Connection status shown in Hex AI frontend
# User can see "Local Agent Connected" status
```

### Step 4: Execute Tools

```
1. User opens Hex AI frontend
2. User selects "Local Execution" mode
3. User requests: "Scan my internal network 192.168.1.0/24"
4. Hex AI plans: "Run nmap scan"
5. Hex AI sends command to local agent
6. Local agent executes: `nmap -sn 192.168.1.0/24`
7. Results stream back to Hex AI
8. Hex AI analyzes results and generates report
```

### Step 5: Monitor & Control

```
- User can see real-time output in Hex AI frontend
- User can cancel execution
- User can view execution history
- User can export results
```

---

## 🔧 Technical Architecture

### Component Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    Hex AI Frontend                           │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  Execution Mode Selector                               │  │
│  │  - Cloud Mode                                          │  │
│  │  - Local Mode                                          │  │
│  └───────────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  Local Agent Status                                    │  │
│  │  - Connection Status                                   │  │
│  │  - Agent Version                                       │  │
│  │  - Docker Status                                       │  │
│  └───────────────────────────────────────────────────────┘  │
└────────────────────────┬────────────────────────────────────┘
                         │
                         │ HTTP/WebSocket
                         │
        ┌────────────────┴────────────────┐
        │                                 │
        ▼                                 ▼
┌───────────────┐              ┌──────────────────────┐
│ Hex AI Backend│              │ Local Execution Agent│
│               │              │                      │
│ ┌───────────┐ │              │ ┌──────────────────┐ │
│ │ Auth      │ │              │ │ WebSocket Client │ │
│ │ Service   │ │◄─────────────┤ │                  │ │
│ └───────────┘ │   WebSocket  │ │ - Connects to    │ │
│               │   (WSS)      │ │   Backend        │ │
│ ┌───────────┐ │              │ │ - Authenticates  │ │
│ │ Command   │ │              │ │ - Receives cmds  │ │
│ │ Router    │ │              │ └──────────────────┘ │
│ └───────────┘ │              │                      │
│               │              │ ┌──────────────────┐ │
│ ┌───────────┐ │              │ │ Docker Manager   │ │
│ │ Execution │ │              │ │                  │ │
│ │ Service   │ │              │ │ - Pull Image     │ │
│ └───────────┘ │              │ │ - Start Container│ │
│               │              │ │ - Execute Commands│ │
│ ┌───────────┐ │              │ │ - Stream Output  │ │
│ │ AI Engine │ │              │ └──────────────────┘ │
│ │ (DeepSeek)│ │              │                      │
│ └───────────┘ │              │ ┌──────────────────┐ │
│               │              │ │ Command Validator│ │
│ ┌───────────┐ │              │ │                  │ │
│ │ Tool      │ │              │ │ - Validates cmds │ │
│ │ Registry  │ │              │ │ - Blocks dangerous│ │
│ └───────────┘ │              │ │ - Rate limiting  │ │
└───────────────┘              │ └──────────────────┘ │
                               └──────────┬───────────┘
                                          │
                                          │ Docker API
                                          │
                                 ┌────────▼─────────┐
                                 │ Local Docker     │
                                 │ Container        │
                                 │                  │
                                 │ - Kali Linux     │
                                 │ - Security Tools │
                                 │ - User: hexagent │
                                 └──────────────────┘
```

### Data Flow

```
1. User Request
   │
   ▼
2. Frontend sends request to backend
   │
   ▼
3. Backend AI plans execution
   │
   ▼
4. Backend routes to local agent (if local mode)
   │
   ▼
5. Local agent receives command
   │
   ▼
6. Local agent validates command
   │
   ▼
7. Local agent executes in Docker container
   │
   ▼
8. Docker container runs command
   │
   ▼
9. Output streams to local agent
   │
   ▼
10. Local agent streams to backend
   │
   ▼
11. Backend streams to frontend
   │
   ▼
12. Frontend displays output
   │
   ▼
13. Backend AI analyzes results
   │
   ▼
14. Frontend displays AI analysis
```

---

## 🎯 Benefits for Red Teamers

### 1. **Internal Network Access**

**Problem Solved:**
- Cannot scan internal networks from remote server
- Cannot access internal services (AD, internal web apps)

**Solution:**
- Execute tools on local network
- Access internal infrastructure
- Scan internal IP ranges (192.168.x.x, 10.x.x.x)

### 2. **Performance & Resources**

**Problem Solved:**
- Shared server resources (slow scans)
- Limited CPU/memory
- Network bandwidth constraints

**Solution:**
- Use local hardware (faster scans)
- Access to GPUs (hashcat, etc.)
- Local network bandwidth (faster internal scans)

### 3. **Offline Capabilities**

**Problem Solved:**
- Requires internet connection to server
- Cannot work in air-gapped environments

**Solution:**
- Offline mode (optional)
- Local execution without backend connection
- Air-gapped environment support

### 4. **Privacy & Compliance**

**Problem Solved:**
- Scan results on remote servers
- Data privacy concerns
- Compliance requirements

**Solution:**
- Results stay on local machine
- User controls data sharing
- Compliance-friendly (local execution)

### 5. **Custom Tooling**

**Problem Solved:**
- Limited to tools in remote container
- Cannot use custom tools
- Cannot modify tool configurations

**Solution:**
- Custom Docker images
- Local tool installation
- Custom configurations

---

## 📅 Implementation Roadmap

### Phase 1: Foundation (Weeks 1-2)

**Tasks:**
- [ ] Design local agent architecture
- [ ] Create local agent binary (Node.js/Go)
- [ ] Implement Docker image distribution
- [ ] Implement basic WebSocket communication
- [ ] Implement authentication

**Deliverables:**
- Local agent binary
- Docker image distribution
- Basic communication protocol

### Phase 2: Core Features (Weeks 3-4)

**Tasks:**
- [ ] Implement command execution
- [ ] Implement output streaming
- [ ] Implement command validation
- [ ] Implement error handling
- [ ] Implement container management

**Deliverables:**
- Functional local agent
- Command execution working
- Output streaming working

### Phase 3: Backend Integration (Weeks 5-6)

**Tasks:**
- [ ] Modify backend to support local mode
- [ ] Implement agent registration
- [ ] Implement command routing
- [ ] Implement execution mode selection
- [ ] Implement agent status tracking

**Deliverables:**
- Backend supports local execution
- Agent registration working
- Command routing working

### Phase 4: Frontend Integration (Weeks 7-8)

**Tasks:**
- [ ] Add execution mode selector
- [ ] Add local agent status UI
- [ ] Add local agent installation guide
- [ ] Add execution mode indicators
- [ ] Add local execution logs

**Deliverables:**
- Frontend supports local mode
- UI for local agent management
- Installation guide

### Phase 5: Security & Testing (Weeks 9-10)

**Tasks:**
- [ ] Implement security measures
- [ ] Implement command validation
- [ ] Implement rate limiting
- [ ] Implement timeout enforcement
- [ ] Security audit
- [ ] Performance testing
- [ ] User testing

**Deliverables:**
- Secure local agent
- Comprehensive testing
- Security audit report

### Phase 6: Documentation & Release (Weeks 11-12)

**Tasks:**
- [ ] Write user documentation
- [ ] Write developer documentation
- [ ] Create installation guides
- [ ] Create video tutorials
- [ ] Beta testing
- [ ] Release

**Deliverables:**
- Complete documentation
- Installation guides
- Video tutorials
- Beta release

---

## 🔄 Alternative Approaches

### Approach 1: Docker Desktop Extension

**Concept:**
- Create Docker Desktop extension
- Integrates with Docker Desktop UI
- Manages local execution

**Pros:**
- Easy installation (Docker Desktop users)
- Integrated with Docker Desktop
- Good UX

**Cons:**
- Requires Docker Desktop
- Platform-specific (Docker Desktop only)
- Limited customization

### Approach 2: Electron Desktop App

**Concept:**
- Create Electron desktop application
- Bundles local agent
- Provides GUI for management

**Pros:**
- Cross-platform (Windows, macOS, Linux)
- Native desktop experience
- Easy distribution

**Cons:**
- Larger download size
- Requires Electron runtime
- More complex development

### Approach 3: Browser Extension

**Concept:**
- Create browser extension
- Communicates with local agent
- Manages local execution

**Pros:**
- No separate installation
- Integrated with browser
- Easy distribution

**Cons:**
- Browser-specific
- Limited system access
- Security restrictions

### Approach 4: Tauri Desktop App

**Concept:**
- Create Tauri desktop application
- Smaller than Electron
- Better security

**Pros:**
- Smaller download size
- Better security
- Cross-platform

**Cons:**
- Newer technology
- Smaller ecosystem
- Learning curve

---

## 📝 Conclusion

**Local Execution Mode** is a **critical feature** for professional red teamers who need to:

- Execute tools on their **local network**
- Use their **own computing resources**
- Maintain **full control** over execution
- Benefit from **AI-driven automation**

This feature transforms Hex AI from a **cloud-only solution** to a **hybrid cloud/local platform** that supports both use cases.

**Next Steps:**
1. Review and approve architecture
2. Begin Phase 1 implementation
3. Create proof-of-concept
4. Iterate based on feedback

---

## 🔗 References

- [Docker SDK Documentation](https://docs.docker.com/engine/api/sdk/)
- [WebSocket API](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket)
- [Docker Content Trust](https://docs.docker.com/engine/security/trust/)
- [Electron Documentation](https://www.electronjs.org/docs)
- [Tauri Documentation](https://tauri.app/docs/)

---

**Document Version:** 1.0  
**Last Updated:** 2025-01-27  
**Author:** Hex AI Team  
**Status:** Draft - Ready for Review

