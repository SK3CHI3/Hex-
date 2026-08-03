import { loadConfig, getProvider, getApiKey, getBaseUrl } from './config.js';

export async function chat({ messages, tools, onContent, onToolCall, onThinking, onError }) {
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
  const timeout = setTimeout(() => controller.abort(), 120000);

  let response;
  try {
    const headers = {
      'Content-Type': 'application/json',
    };

    // Provider-specific auth
    if (config.provider === 'anthropic') {
      headers['x-api-key'] = apiKey;
      headers['anthropic-version'] = '2023-06-01';
    } else if (config.provider !== 'ollama') {
      headers['Authorization'] = `Bearer ${apiKey}`;
    }

    response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    clearTimeout(timeout);
  } catch (err) {
    clearTimeout(timeout);
    if (err.name === 'AbortError') {
      onError(new Error('Request timed out after 2 minutes.'));
    } else {
      onError(err);
    }
    return;
  }

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    onError(new Error(`API error ${response.status}: ${text || 'Check your API key and credits.'}`));
    return;
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  const toolCallsMap = new Map();

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

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
        onError(new Error(`Failed to parse tool call arguments for ${tc.name}`));
      }
    }
  }
}
