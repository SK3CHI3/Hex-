import { loadConfig, getProvider, getApiKey, getBaseUrl, isLocalProvider } from '../core/config.js';

const MAX_RETRIES = 3;
const RETRY_DELAYS = [1000, 2000, 4000]; // Exponential backoff

// Quick network connectivity check
async function checkNetwork() {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);
    await fetch('https://api.github.com', { method: 'HEAD', signal: controller.signal });
    clearTimeout(timeout);
    return true;
  } catch {
    return false;
  }
}

export async function chat({ messages, tools, onContent, onToolCall, onThinking, onError, abortSignal, onRetry }) {
  const config = loadConfig();
  const provider = getProvider();
  const apiKey = getApiKey(config.provider);
  const baseUrl = getBaseUrl(config.provider);

  if (!apiKey && !isLocalProvider(config.provider)) {
    onError(new Error(`API key not set for ${provider.name}. Run /setup or set ${provider.envKey} env var.`));
    return;
  }

  if (!baseUrl) {
    onError(new Error(`Base URL not configured for ${provider.name}.`));
    return;
  }

  const payload = {
    model: config.model || provider.defaultModel,
    messages,
    temperature: 0.7,
    max_tokens: 8192,
    stream: true,
  };

  if (tools && tools.length > 0) {
    payload.tools = tools;
    payload.tool_choice = 'auto';
  }

  const controller = new AbortController();

  // Listen for external abort signal (Ctrl+C or Escape)
  if (abortSignal) {
    abortSignal.addEventListener('abort', () => {
      controller.abort();
    });
  }

  let lastError = null;

  // Retry loop
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      if (attempt > 0) {
        // Check network before retrying
        const online = await checkNetwork();
        if (!online) {
          onError(new Error('No network connection. Check your internet and try again.'));
          return;
        }

        const delay = RETRY_DELAYS[attempt - 1] || RETRY_DELAYS[RETRY_DELAYS.length - 1];
        if (onRetry) {
          onRetry(attempt, delay);
        }
        await sleep(delay);
      }

      const response = await makeRequest(baseUrl, payload, config.provider, apiKey, controller.signal);

      if (!response.ok) {
        const text = await response.text().catch(() => '');
        const error = new Error(`API error ${response.status}: ${text || 'Check your API key and credits.'}`);

        // Don't retry on client errors (4xx) except 429 (rate limit)
        if (response.status >= 400 && response.status < 500 && response.status !== 429) {
          onError(error);
          return;
        }

        lastError = error;
        continue; // Retry on server errors (5xx) or rate limits (429)
      }

      // Success - process the stream
      if (provider.apiFormat === 'anthropic') {
        await processAnthropicStream(response, onContent, onToolCall, onThinking, controller.signal);
      } else {
        await processStream(response, onContent, onToolCall, onThinking, controller.signal);
      }
      return; // Exit retry loop on success

    } catch (err) {
      if (err.name === 'AbortError') {
        onError(new Error('Request cancelled by user.'));
        return;
      }

      // Handle network errors specifically
      if (err.message.includes('fetch') || err.message.includes('network') || err.code === 'ECONNREFUSED') {
        lastError = new Error(`Connection failed: ${err.message}. Check if the API server is running.`);
      } else {
        lastError = err;
      }

      // Don't retry on certain errors
      if (err.message.includes('API key') || err.message.includes('authentication')) {
        onError(err);
        return;
      }

      // Continue to next retry attempt
      if (attempt < MAX_RETRIES) {
        continue;
      }
    }
  }

  // All retries exhausted
  if (lastError) {
    onError(lastError);
  } else {
    onError(new Error('Request failed after multiple retries.'));
  }
}

async function makeRequest(baseUrl, payload, provider, apiKey, signal) {
  if (provider === 'anthropic') {
    return fetch(`${baseUrl}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify(toAnthropicPayload(payload)),
      signal,
    });
  }

  const headers = {
    'Content-Type': 'application/json',
  };

  // Provider-specific auth
  if (!isLocalProvider(provider)) {
    headers['Authorization'] = `Bearer ${apiKey}`;
  }

  return fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
    signal,
  });
}

function toAnthropicPayload(payload) {
  const system = payload.messages
    .filter(message => message.role === 'system' && message.content)
    .map(message => message.content)
    .join('\n\n');
  const messages = [];

  for (const message of payload.messages) {
    if (message.role === 'system') continue;

    if (message.role === 'tool') {
      const previous = messages[messages.length - 1];
      const result = { type: 'tool_result', tool_use_id: message.tool_call_id, content: message.content || '' };
      if (previous?.role === 'user' && Array.isArray(previous.content)) previous.content.push(result);
      else messages.push({ role: 'user', content: [result] });
      continue;
    }

    if (message.role === 'assistant' && message.tool_calls) {
      const content = [];
      if (message.content) content.push({ type: 'text', text: message.content });
      for (const toolCall of message.tool_calls) {
        let input = {};
        try { input = JSON.parse(toolCall.function.arguments || '{}'); } catch {}
        content.push({ type: 'tool_use', id: toolCall.id, name: toolCall.function.name, input });
      }
      messages.push({ role: 'assistant', content });
      continue;
    }

    messages.push({ role: message.role === 'assistant' ? 'assistant' : 'user', content: message.content || '' });
  }

  const result = { model: payload.model, max_tokens: payload.max_tokens, stream: true, messages };
  if (system) result.system = system;
  if (payload.tools?.length) {
    result.tools = payload.tools.map(tool => ({
      name: tool.function.name,
      description: tool.function.description,
      input_schema: tool.function.parameters,
    }));
  }
  return result;
}

export async function processStream(response, onContent, onToolCall, onThinking, signal) {
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  const toolCallsMap = new Map();
  let partialContent = '';
  let buffer = '';

  const processLine = (line) => {
    if (!line.startsWith('data: ')) return;
    const data = line.slice(6);
    if (data === '[DONE]') return;

    try {
      const parsed = JSON.parse(data);
      const delta = parsed.choices?.[0]?.delta;
      if (!delta) return;

      if (delta.content) {
        partialContent += delta.content;
        onContent(delta.content);
      }

      if (delta.reasoning_content || delta.thinking) {
        onThinking?.(delta.reasoning_content || delta.thinking);
      }

      for (const tc of delta.tool_calls || []) {
        const idx = tc.index ?? 0;
        if (!toolCallsMap.has(idx)) {
          toolCallsMap.set(idx, { id: '', name: '', arguments: '' });
        }
        const acc = toolCallsMap.get(idx);
        if (tc.id) acc.id = tc.id;
        if (tc.function?.name) acc.name = tc.function.name;
        if (tc.function?.arguments) acc.arguments += tc.function.arguments;
      }
    } catch {
      // Ignore malformed events. A future complete event may still arrive.
    }
  };

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      if (signal.aborted) {
        reader.cancel();
        break;
      }

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop();

      lines.forEach(processLine);
    }
    // Some providers omit the final newline. Process that buffered event too.
    if (buffer) processLine(buffer);
  } catch (streamErr) {
    // Connection dropped mid-stream - preserve what we have
    if (streamErr.name === 'AbortError') {
      throw streamErr; // Let caller handle cancellation
    }
    // For other errors, emit what we have so far
    console.error('Stream interrupted:', streamErr.message);
  } finally {
    reader.releaseLock();
  }

  // Emit completed tool calls
  for (const [, tc] of toolCallsMap) {
    if (tc.name && tc.arguments) {
      try {
        onToolCall({
          id: tc.id,
          name: tc.name,
          arguments: JSON.parse(tc.arguments),
        });
      } catch {
        // Skip invalid tool calls
      }
    }
  }

  // Return partial content info for caller
  return { partialContent };
}

async function processAnthropicStream(response, onContent, onToolCall, onThinking, signal) {
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  const toolCalls = new Map();
  let buffer = '';

  const processEvent = (line) => {
    if (!line.startsWith('data: ')) return;
    try {
      const event = JSON.parse(line.slice(6));
      if (event.type === 'content_block_start' && event.content_block?.type === 'tool_use') {
        toolCalls.set(event.index, { id: event.content_block.id, name: event.content_block.name, arguments: '' });
      } else if (event.type === 'content_block_delta') {
        if (event.delta?.type === 'text_delta') onContent(event.delta.text || '');
        if (event.delta?.type === 'thinking_delta') onThinking?.(event.delta.thinking || '');
        if (event.delta?.type === 'input_json_delta') {
          const tool = toolCalls.get(event.index);
          if (tool) tool.arguments += event.delta.partial_json || '';
        }
      }
    } catch {
      // Ignore malformed streaming events; a complete event is handled once buffered.
    }
  };

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (signal.aborted) { await reader.cancel(); break; }
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop();
      lines.forEach(processEvent);
    }
    if (buffer) processEvent(buffer);
  } finally {
    reader.releaseLock();
  }

  for (const tool of toolCalls.values()) {
    if (!tool.name) continue;
    try { onToolCall({ id: tool.id, name: tool.name, arguments: JSON.parse(tool.arguments || '{}') }); } catch {}
  }
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
