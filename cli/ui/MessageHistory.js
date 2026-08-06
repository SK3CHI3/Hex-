/**
 * MessageHistory component - renders conversation messages
 * Thinking blocks are collapsed by default, Ctrl+T toggles expansion
 */

import React from 'react';
import { Box, Text } from 'ink';
import { getTheme } from './themes.js';
import ToolOutput from './ToolOutput.js';

const MessageHistory = ({ messages = [], streaming = false, showThinking = false }) => {
  const theme = getTheme();

  if (messages.length === 0) {
    return null;
  }

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
                  { marginLeft: 2 },
                  React.createElement(Text, { color: theme.text.muted }, msg.thinking)
                )
              : null,
            showThinking
              ? React.createElement(Text, { color: theme.text.muted }, '  [Ctrl+T to collapse]')
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
    ...messages.map((msg, index) => renderMessage(msg, index)),
    // Streaming indicator
    streaming && React.createElement(
      Box,
      { key: 'streaming', marginTop: 1, marginLeft: 2 },
      React.createElement(Text, { color: theme.status.thinking }, '⠋ AI is thinking...')
    )
  );
};

export default MessageHistory;
