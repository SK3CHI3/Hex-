# 🔧 Hex AI - Technical Demo Script
## AI Tinkerers Nairobi - 15 Minutes

---

## **OPENING - THE PROBLEM (2 minutes)**

Hey everyone, I'm [Your Name]. So I want to show you Hex AI, but first let me quickly explain the problem we're solving.

You know how most AI assistants for security testing work? You ask them to scan something, they give you a command, you copy-paste it, run it, and if it fails... you're back to asking them again. It's a loop, and you're doing all the work.

The problem is these systems don't actually execute anything. They're just chatbots with security knowledge. They tell you what to do, but they don't do it. And when things go wrong, they can't see the error - you have to copy-paste it back, and they might give you another wrong answer.

So I thought, what if we built something that actually executes tools? Not just suggests commands, but runs them. And when they fail, it sees the error, understands what went wrong, and fixes it. That's what Hex AI is.

It's built for developers who need to do security testing but don't want to be stuck in that loop. It's an agentic system - it perceives, reasons, acts, and learns. It's not a chatbot.

Let me show you how it works.

---

## **DEMO 1: TOOL SCHEMA & FUNCTION CALLING (3 minutes)**

Okay, so the foundation is DeepSeek's function calling API. We define our tools as JSON schemas - you can see this in `src/lib/tools-schema.ts`. Each tool has a name, description, and parameters defined as JSON Schema.

When a user sends a message, we include these tool schemas in the DeepSeek API call. DeepSeek analyzes the request and decides which tool to use based on the schemas. It's not hardcoded prompts - the AI knows what tools are available through the schemas.

The interesting part is how we handle the streaming response. DeepSeek streams tool calls back, and the arguments come in pieces. We accumulate these as they stream in - you can see this logic in `Index.tsx` around the stream handling section. Once the stream completes, we parse the accumulated arguments and execute the tool.

The key is that we're using function calling, not prompt engineering. The AI makes decisions based on structured tool definitions, not free-form text.

---

## **DEMO 2: WEBSOCKET & REAL-TIME EXECUTION (3 minutes)**

When we get a tool call, we need to execute it somewhere safe. We use WebSocket for real-time bidirectional communication.

The frontend maintains a WebSocket connection - you can see this in `use-tool-execution.ts`. When a tool needs to execute, we build the command from the tool schema using the `buildCommand` function in `tools-schema.ts`, then send it via WebSocket to our backend.

The backend - that's in `server/index.js` - receives the message, authenticates the user via JWT, then executes the command in a Docker container. The container is running Kali Linux with security tools pre-installed.

The output streams back through WebSocket in real-time. The frontend receives these messages and updates the terminal UI. The terminal component - `TerminalWindow.tsx` - displays the output as it streams.

This is standard WebSocket streaming, but the interesting part is how we handle the lifecycle - authentication, execution tracking, error handling, and cleanup. All of that is in the WebSocket message handlers.

---

## **DEMO 3: ERROR ITERATION - THE KEY FEATURE (4 minutes)**

Now, here's the interesting part. When a command fails, we don't just show the error to the user. We send it back to the AI for analysis.

Let me show you what happens. I'll execute a command that will fail.

*[Execute failing command, show error]*

Okay, so it failed. Exit code 255, error message. Now, look at what happens. The `onComplete` callback in `Index.tsx` triggers. It checks the exit code - if it's not zero, it extracts the error output from the last few stderr messages, builds an error message, and sends it back to DeepSeek.

The `sendMessage` function has an `autoTrigger` flag that bypasses input validation. This lets us send messages programmatically. The error message includes the full context - exit code, error output, and instructions to analyze and fix.

DeepSeek receives this, analyzes the error, understands what went wrong, and provides a fix. It's not just guessing - it's reasoning about the actual error output. If we want, it can automatically retry with the corrected command.

This is autonomous error iteration. The AI sees the failure, reasons about it, and acts to fix it. It's built into our completion handler - every failed execution triggers this flow. The logic is in the `onComplete` callback in `Index.tsx`.

---

## **DEMO 4: MCP ARCHITECTURE (2 minutes)**

We're building this with Model Context Protocol principles. MCP is about standardizing how AI models interact with tools.

Our implementation follows MCP patterns. Tool definitions are JSON Schema format - that's standardized. Tool execution uses a standardized interface - command plus args. Result handling uses a structured output format. Error handling follows a standardized flow.

The tool schema maps to command execution through a mapping function. You can see `toolCommandMap` in `tools-schema.ts` - it maps tool names to commands. The `buildCommand` function transforms tool arguments to command-line flags.

This abstraction means we can add new tools by just defining a schema and mapping. The execution logic stays the same. It's extensible by design.

The full architecture is documented in the technical reference - you can see the MCP structure diagram there.

---

## **ARCHITECTURE OVERVIEW (1 minute)**

Quick overview of the full system. Frontend is React with TypeScript. Backend is Node.js with Express. WebSocket for real-time communication. Docker containers for execution. DeepSeek API for function calling.

The flow is: User input goes to DeepSeek, which decides on a tool. Tool call goes to frontend, which builds the command and sends it via WebSocket to backend. Backend executes in Docker, streams output back. Frontend displays in terminal. If there's an error, it goes back to DeepSeek for analysis.

Everything is containerized, isolated, and streams in real-time. The full architecture diagram is in the technical reference document.

---

## **Q&A (Remaining time)**

That's the technical overview. Questions?

---

## **CODE REFERENCES**

- Tool schemas: `src/lib/tools-schema.ts`
- Tool execution hook: `src/hooks/use-tool-execution.ts`
- Main chat interface: `src/pages/Index.tsx`
- Terminal component: `src/components/TerminalWindow.tsx`
- Backend server: `server/index.js`
- Docker setup: `server/docker/Dockerfile.kali`
- Technical reference: `docs/DEMO_TECHNICAL_REFERENCE.md`

---

**Keep it conversational, natural, and technical. Reference code locations, don't read code blocks. Focus on how it works, not why it's valuable.**
