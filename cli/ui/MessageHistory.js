/**
 * Append-only conversation output.
 *
 * Completed items are emitted through Ink's Static region, so the terminal
 * scrolls them normally while only the small activity indicator is refreshed.
 */
import React, { useEffect, useRef, useState } from 'react';
import { Box, Static, Text } from 'ink';
import { getTheme } from './themes.js';
import ToolOutput from './ToolOutput.js';

const BRAILLE_FRAMES = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];

const formatAgentStatus = ({ phase, toolName, toolIndex, toolTotal, detail } = {}) => {
  if (phase === 'planning') return 'Planning response...';
  if (phase === 'thinking') return 'Reasoning...';
  if (phase === 'running') {
    const position = toolTotal ? ` ${toolIndex || 1}/${toolTotal}` : '';
    return `Running${position}: ${detail || toolName || 'tool'}...`;
  }
  if (phase === 'continuing') return 'Reviewing tool results...';
  return 'Working...';
};

const renderMessage = (msg, index, theme, showThinking, showToolOutput) => {
  if (!msg || typeof msg !== 'object') return null;
  if (msg.role === 'user') {
    return React.createElement(Box, { key: `user-${index}`, flexDirection: 'column', marginTop: 1, paddingX: 1 },
      React.createElement(Text, { color: theme.ui.prompt, bold: true }, '❯ '),
      React.createElement(Text, { color: theme.text.accent }, msg.content || ''));
  }
  if (msg.role === 'assistant') {
    if (msg.isCommandResult) {
      return React.createElement(Box, { key: `command-${index}`, flexDirection: 'column', marginTop: 1, marginLeft: 2, paddingX: 1 },
        React.createElement(Text, { color: theme.text.primary }, msg.content || ''));
    }
    const children = [];
    if (msg.thinking) {
      const lines = msg.thinking.split('\n');
      const preview = lines[0] + (lines.length > 1 ? '…' : '');
      children.push(React.createElement(Box, { key: 'thinking', flexDirection: 'column', marginLeft: 2 },
        React.createElement(Text, { color: theme.status.thinking }, '💭 Thinking:'),
        React.createElement(Text, { color: theme.text.muted }, showThinking ? msg.thinking : ` ${preview}`)));
    }
    if (msg.content) children.push(React.createElement(Box, { key: 'content', marginLeft: 2, flexDirection: 'column' },
      React.createElement(Text, { color: theme.text.primary }, msg.content)));
    const totalToolCalls = msg.tool_calls?.length || 0;
    for (const [toolIndex, toolCall] of (msg.tool_calls || []).entries()) {
      children.push(React.createElement(ToolOutput, { key: `tool-${toolIndex}`, toolName: toolCall.function?.name || 'tool', output: toolCall.function?.arguments || '', label: `Queued tool ${toolIndex + 1}/${totalToolCalls}`, expanded: showToolOutput }));
    }
    return React.createElement(Box, { key: `assistant-${index}`, flexDirection: 'column', marginTop: 1, paddingX: 1 }, ...children);
  }
  if (msg.role === 'tool') {
    return React.createElement(Box, { key: `tool-result-${index}`, paddingX: 1 }, React.createElement(ToolOutput, {
      toolName: msg.name || 'tool', output: msg.content || '', error: msg.isError,
      label: msg.isError ? 'Tool failed' : 'Tool result', expanded: showToolOutput, fullOutputId: msg.fullOutputId,
    }));
  }
  return null;
};

const tail = (text, lineLimit = 4) => {
  const lines = String(text || '').split('\n');
  return lines.length > lineLimit ? `…\n${lines.slice(-lineLimit).join('\n')}` : lines.join('\n');
};

const MessageHistory = ({ messages = [], streaming = false, processing = false, showThinking = false, showToolOutput = false, agentStatus = { phase: 'idle' }, banner = null, liveResponse = null }) => {
  const theme = getTheme();
  const [frame, setFrame] = useState(0);
  const [epoch, setEpoch] = useState(0);
  const previousLength = useRef(messages.length);
  const isActive = streaming || processing;

  useEffect(() => {
    if (messages.length < previousLength.current) setEpoch(value => value + 1);
    previousLength.current = messages.length;
  }, [messages.length]);
  useEffect(() => {
    if (!isActive) return undefined;
    const id = setInterval(() => setFrame(value => (value + 1) % BRAILLE_FRAMES.length), 80);
    return () => clearInterval(id);
  }, [isActive]);

  // The banner is the first immutable transcript item. Once a prompt is sent,
  // it scrolls upward with regular output instead of staying over the reply.
  const items = banner
    ? [{ kind: 'banner', value: banner }, ...messages.map((value, index) => ({ kind: 'message', value, index }))]
    : messages.map((value, index) => ({ kind: 'message', value, index }));

  return React.createElement(React.Fragment, null,
    React.createElement(Static, { key: `transcript-${epoch}`, items }, item => item.kind === 'banner'
      ? React.createElement(Box, { key: 'banner', flexDirection: 'column', marginBottom: 1, paddingX: 1 }, item.value)
      : renderMessage(item.value, item.index, theme, showThinking, showToolOutput)),
    liveResponse?.content && React.createElement(Box, { flexDirection: 'column', marginLeft: 3, paddingX: 1 },
      React.createElement(Text, { color: theme.text.primary }, tail(liveResponse.content))),
    showThinking && liveResponse?.thinking && React.createElement(Box, { flexDirection: 'column', marginLeft: 3, paddingX: 1 },
      React.createElement(Text, { color: theme.status.thinking }, '💭 Thinking:'),
      React.createElement(Text, { color: theme.text.muted }, tail(liveResponse.thinking, 2))),
    isActive && React.createElement(Box, { marginLeft: 3, paddingX: 1 },
      React.createElement(Text, { color: theme.status.thinking }, `${BRAILLE_FRAMES[frame]} ${processing && !streaming ? 'Processing command...' : formatAgentStatus(agentStatus)}`)));
};

export default MessageHistory;
