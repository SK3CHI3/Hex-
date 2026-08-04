import { loadConfig, getProvider, getApiKey, getBaseUrl } from './config.js';

const MAX_RETRIES = 3;
const RETRY_DELAYS = [1000, 2000, 4000]; // Exponential backoff

export async function chat({ messages, tools, onContent, onToolCall, onThinking, onError, abortSignal, onRetry }) {
  const config = loadConfig();
  const provider = getProvider();
  const apiKey = getApiKey(config.provider);
  const baseUrl = getBaseUrl(config.provider);

  if (!apiKey && config.provider !== 'ollama') {
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
      await processStream(response, onContent, onToolCall, onThinking, controller.signal);
      return; // Exit retry loop on success

    } catch (err) {
      if (err.name === 'AbortError') {
        onError(new Error('Request cancelled by user.'));
        return;
      }
      
      lastError = err;
      
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
  const headers = {
    'Content-Type': 'application/json',
  };

  // Provider-specific auth
  if (provider === 'anthropic') {
    headers['x-api-key'] = apiKey;
    headers['anthropic-version'] = '2023-06-01';
  } else if (provider !== 'ollama') {
    headers['Authorization'] = `Bearer ${apiKey}`;
  }

  return fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
    signal,
  });
}

async function processStream(response, onContent, onToolCall, onThinking, signal) {
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  const toolCallsMap = new Map();

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    if (signal.aborted) {
      reader.cancel();
      break;
    }

    const chunk = decoder.decode(value, { stream: true });

    for (const line of chunk.split('\n')) {
      if (!line.startsWith('data: ')) continue;
      const data = line.slice(6);
      if (data === '[DONE]') break;

      try {
        const parsed = JSON.parse(data);
        const delta = parsed.choices?.[0]?.delta;
        if (!delta) continue;

        if (delta.content) {
          onContent(delta.content);
        }

        // Handle thinking/reasoning content from models that support it
        if (delta.reasoning_content || delta.thinking) {
          const thinkingContent = delta.reasoning_content || delta.thinking;
          if (onThinking) {
            onThinking(thinkingContent);
          }
        }

        if (delta.tool_calls) {
          for (const tc of delta.tool_calls) {
            const idx = tc.index ?? 0;
            if (!toolCallsMap.has(idx)) {
              toolCallsMap.set(idx, { id: '', name: '', arguments: '' });
            }
            const acc = toolCallsMap.get(idx);
            if (tc.id) acc.id = tc.id;
            if (tc.function?.name) acc.name = tc.function.name;
            if (tc.function?.arguments) acc.arguments += tc.function.arguments;
          }
        }
      } catch {
        // skip unparseable chunks
      }
    }
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
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
