/**
 * MessageHistory component - renders conversation messages with virtual scrolling
 * Displays user messages, AI responses, thinking, and tool outputs
 */

import React, { useState } from 'react';
import { Box, Text } from 'ink';
import { themeManager } from './themes.js';
import ToolOutput from './ToolOutput.js';

const MessageHistory = ({ messages = [], streaming = false }) => {
  const theme = themeManager.getTheme();
  
  if (messages.length === 0) {
    return null;
  }
  
  const renderMessage = (msg, index) => {
    // User message
    if (msg.role === 'user') {
      return React.createElement(
        Box,
        { key: index, flexDirection: 'column', marginTop: 1 },
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
      
      // Thinking content (if present)
      if (msg.thinking) {
        children.push(
          React.createElement(
            Box,
            { key: 'thinking', flexDirection: 'column', marginLeft: 2 },
            React.createElement(Text, { color: theme.status.thinking }, '💭 Thinking:'),
            React.createElement(
              Box,
              { marginLeft: 2 },
              React.createElement(Text, { color: theme.text.muted }, msg.thinking)
            )
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
        { key: index, flexDirection: 'column', marginTop: 1 },
        ...children
      );
    }
    
    // Tool result
    if (msg.role === 'tool') {
      return React.createElement(ToolOutput, {
        key: index,
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
