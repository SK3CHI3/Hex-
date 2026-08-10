# Local LLM Integration

Hex supports running AI models locally on your machine. No API keys, no cloud costs, no rate limits — your hardware, your models.

## Supported Local Servers

| Server | Default URL | Notes |
|--------|------------|-------|
| **Ollama** | `http://localhost:11434/v1` | Most popular. Easy model management via `ollama pull`. |
| **LM Studio** | `http://localhost:1234/v1` | Desktop app with GUI. Download models from HuggingFace. |
| **llama.cpp** | `http://localhost:8080/v1` | Lightweight C++ server. Best performance on CPU. |
| **vLLM** | `http://localhost:8000/v1` | High-throughput. Production-grade. Needs GPU. |
| **Jan.ai** | `http://127.0.0.1:1337/v1` | Desktop app. Built-in model hub. |
| **text-generation-webui** | `http://localhost:5000/v1` | Oobabooga. Needs `--api` flag. |

All servers expose an OpenAI-compatible API. Hex talks to them the same way it talks to OpenAI.

## Quick Start

### Ollama (Recommended)

1. Install Ollama: https://ollama.com/download
2. Pull a model:
   ```bash
   ollama pull llama3
   ```
3. Start Hex and select Ollama as provider:
   ```bash
   hex
   ```
   Choose `Ollama (Local)` from the provider list, then pick your model.

Or configure directly:
```bash
hex config set provider ollama
hex config set model llama3
```

### LM Studio

1. Download LM Studio: https://lmstudio.ai/
2. Download a model (e.g. Llama 3, Mistral, Qwen)
3. Start the local server (click "Start Server" in the app)
4. In Hex, select `LM Studio (Local)` as provider

### llama.cpp

1. Build llama.cpp: https://github.com/ggerganov/llama.cpp
2. Start the server:
   ```bash
   ./llama-server -m /path/to/model.gguf --port 8080
   ```
3. In Hex, select `llama.cpp (Local)` as provider

### Any OpenAI-Compatible Server

If your server exposes `/v1/chat/completions`, use the `Custom (OpenAI-compatible)` provider:
```bash
hex config set provider custom
hex config set base_url http://your-server:port/v1
hex config set model your-model-name
```

## How It Works

All local servers implement the same OpenAI-compatible API:

```
POST http://localhost:<port>/v1/chat/completions
Content-Type: application/json

{
  "model": "llama3",
  "messages": [...],
  "stream": true
}
```

Hex sends requests to your local server instead of a cloud API. No data leaves your machine.

## Model Discovery

When you select a local provider during setup, Hex queries the server's `/v1/models` endpoint and shows you the models that are actually available. You don't need to guess model names.

## Choosing a Model

For pentesting work, you want a model that's good at:
- Following complex instructions
- Generating shell commands accurately
- Reasoning about network security concepts

**Recommended models (by VRAM requirement):**

| VRAM | Model | Notes |
|------|-------|-------|
| 8 GB | `llama3:8b`, `mistral:7b`, `qwen2.5:7b` | Good for basic tasks |
| 16 GB | `llama3:70b` (Q4), `qwen2.5:32b` | Better reasoning |
| 24 GB | `qwen2.5-coder:32b`, `deepseek-coder-v2:16b` | Best for code generation |
| 48+ GB | `llama3:70b` (Q8), `qwen2.5:72b` | Top tier |

Bigger models are smarter but slower. Start with 8B and scale up if you need better results.

## Context Window

Local models have a fixed context window. Ollama defaults to 2048 tokens, which is too small for Hex's tool output.

**Fix for Ollama:**
```bash
# Set when starting Ollama
OLLAMA_CONTEXT_LENGTH=8192 ollama serve

# Or set in your environment before running Hex
export OLLAMA_CONTEXT_LENGTH=8192
```

Hex automatically requests up to 8192 tokens of context when talking to local models.

## Environment Variables

| Variable | Purpose | Example |
|----------|---------|---------|
| `OLLAMA_API_BASE` | Override Ollama URL | `http://192.168.1.50:11434/v1` |
| `OLLAMA_CONTEXT_LENGTH` | Ollama context size | `8192` |
| `HEX_PROVIDER` | Force provider | `ollama` |
| `HEX_MODEL` | Force model | `llama3` |

## Remote Local Server

Running Ollama on another machine? Point Hex at it:
```bash
export OLLAMA_API_BASE=http://192.168.1.50:11434/v1
hex
```

Make sure the Ollama server allows remote connections:
```bash
OLLAMA_HOST=0.0.0.0 ollama serve
```

## Troubleshooting

**"Connection refused"**
- Make sure the local server is running
- Check the port is correct (default: Ollama 11434, LM Studio 1234, llama.cpp 8080)
- Check firewall settings

**"Model not found"**
- Ollama: `ollama pull llama3` to download the model first
- LM Studio: download a model in the app and load it in the server
- Use Hex's model discovery (it queries the server for available models)

**Responses are cut off or incomplete**
- Increase context window size (see Context Window section)
- Try a model with more capacity

**Slow responses**
- Local models run on your hardware. CPU-only inference is slow.
- Use a smaller model (8B instead of 70B)
- Use GPU acceleration if available (CUDA, Metal, ROCm)
