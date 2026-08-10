/**
 * MessageHistory component - renders conversation messages
 * Implements virtual scrolling to keep input fixed at bottom
 * Banner is treated as first scrollable item
 */

import React, { useState, useEffect } from 'react';
import { Box, Text } from 'ink';
import { getTheme } from './themes.js';
import ToolOutput from './ToolOutput.js';

const BRAILLE_FRAMES = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];

// Estimate lines per message type for virtual scrolling
const estimateMessageHeight = (msg) => {
  if (msg.role === 'user') {
    // User message: ~1-2 lines
    return Math.ceil((msg.content?.length || 0) / 80) + 1;
  }
  if (msg.role === 'assistant') {
    let lines = 1;
    if (msg.thinking) lines += Math.ceil(msg.thinking.split('\n').length * 0.5); // Collapsed by default
    if (msg.content) lines += Math.ceil((msg.content?.length || 0) / 80);
    if (msg.tool_calls) lines += msg.tool_calls.length * 3; // Tool calls take ~3 lines each
    return lines;
  }
  if (msg.role === 'tool') {
    // Tool output: variable, estimate 5 lines average
    return 5;
  }
  return 3;
};

const MessageHistory = ({ messages = [], streaming = false, processing = false, showThinking = false, maxHeight = 20, banner = null }) => {
  const theme = getTheme();
  const [frame, setFrame] = useState(0);
  const [scrollOffset, setScrollOffset] = useState(0);
  const isActive = streaming || processing;

  useEffect(() => {
    if (!isActive) return;
    const id = setInterval(() => setFrame(f => (f + 1) % BRAILLE_FRAMES.length), 80);
    return () => clearInterval(id);
  }, [isActive]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    setScrollOffset(0); // Reset to show latest
  }, [messages.length]);

  // Calculate banner height (14 lines)
  const bannerHeight = banner ? 14 : 0;
  const availableForMessages = maxHeight - bannerHeight;

  // Calculate which messages to render (virtual scrolling)
  let totalHeight = 0;
  const visibleMessages = [];
  let hiddenCount = 0;

  // Start from the end (most recent) and work backwards
  for (let i = messages.length - 1; i >= 0; i--) {
    const msgHeight = estimateMessageHeight(messages[i]);
    if (totalHeight + msgHeight > availableForMessages && visibleMessages.length > 0) {
      hiddenCount = i + 1; // Messages above this are hidden
      break;
    }
    totalHeight += msgHeight;
    visibleMessages.unshift({ msg: messages[i], index: i });
  }

  // Adjust for scroll offset
  const renderMessages = visibleMessages.slice(scrollOffset);

  const renderMessage = (msg, index) => {
    // User message
    if (msg.role === 'user') {
      return React.createElement(
        Box,
        { key: `user-${index}`, flexDirection: 'column', marginTop: 1 },
        React.createElement(
          Box,
          null,
          React.createElement(Text, { color: theme.ui.prompt, bold: true }, '❯ '),
          React.createElement(Text, { color: theme.text.accent }, msg.content)
        )
      );
    }

    // Assistant message
    if (msg.role === 'assistant') {
      const children = [];

      // Command result - render differently
      if (msg.isCommandResult) {
        children.push(
          React.createElement(
            Box,
            { key: 'cmd', flexDirection: 'column', marginLeft: 2 },
            React.createElement(Text, { color: theme.text.primary }, msg.content)
          )
        );
        return React.createElement(
          Box,
          { key: `cmd-${index}`, flexDirection: 'column', marginTop: 1 },
          ...children
        );
      }

      // Thinking content (if present)
      if (msg.thinking) {
        const thinkingLines = msg.thinking.split('\n');
        const preview = thinkingLines[0] + (thinkingLines.length > 1 ? '...' : '');

        children.push(
          React.createElement(
            Box,
            { key: 'thinking', flexDirection: 'column', marginLeft: 2 },
            React.createElement(
              Box,
              null,
              React.createElement(Text, { color: theme.status.thinking }, '💭 Thinking:'),
              !showThinking
                ? React.createElement(Text, { color: theme.text.muted }, ` ${preview} [Ctrl+T to expand]`)
                : null
            ),
            showThinking
              ? React.createElement(
                  Box,
                  { marginLeft: 2, flexDirection: 'column' },
                  React.createElement(Text, { color: theme.text.muted }, msg.thinking),
                  React.createElement(Text, { color: theme.text.muted }, '[Ctrl+T to collapse]')
                )
              : null
          )
        );
      }

      // AI response
      if (msg.content) {
        children.push(
          React.createElement(
            Box,
            { key: 'content', flexDirection: 'column', marginLeft: 2 },
            React.createElement(Text, { color: theme.text.primary }, msg.content)
          )
        );
      }

      // Tool calls
      if (msg.tool_calls) {
        msg.tool_calls.forEach((tc, tcIndex) => {
          children.push(
            React.createElement(ToolOutput, {
              key: `tool-${tcIndex}`,
              toolName: tc.function.name,
              output: tc.function.arguments,
            })
          );
        });
      }

      return React.createElement(
        Box,
        { key: `assistant-${index}`, flexDirection: 'column', marginTop: 1 },
        ...children
      );
    }

    // Tool result
    if (msg.role === 'tool') {
      return React.createElement(ToolOutput, {
        key: `toolresult-${index}`,
        toolName: msg.name || 'tool',
        output: msg.content,
        error: msg.isError,
      });
    }

    return null;
  };

  return React.createElement(
    Box,
    { flexDirection: 'column', paddingX: 1 },
    // Banner (first scrollable item)
    banner && React.createElement(
      Box,
      { key: 'banner', flexDirection: 'column', marginBottom: 1 },
      banner
    ),
    // Scroll indicator
    hiddenCount > 0 && React.createElement(
      Box,
      { key: 'scroll-indicator', marginTop: 1 },
      React.createElement(Text, { color: theme.text.muted }, `  ↑ ${hiddenCount} more message${hiddenCount === 1 ? '' : 's'} above`)
    ),
    // Visible messages
    ...renderMessages.map(({ msg, index }) => renderMessage(msg, index)),
    // Streaming/processing indicator
    isActive && React.createElement(
      Box,
      { key: 'streaming', marginTop: 1, marginLeft: 2 },
      React.createElement(Text, { color: theme.status.thinking }, `${BRAILLE_FRAMES[frame]} ${processing && !streaming ? 'Processing...' : 'AI is thinking...'}`)
    )
  );
};

export default MessageHistory;
