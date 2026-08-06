/**
 * MessageHistory component - renders conversation messages with virtual scrolling
 * Displays user messages, AI responses, thinking, and tool outputs
 */

import React, { useState, useEffect } from 'react';
import { Box, Text, useInput } from 'ink';
import { themeManager } from './themes.js';
import ToolOutput from './ToolOutput.js';

const MessageHistory = ({ messages = [], streaming = false }) => {
  const theme = themeManager.getTheme();
  const [scrollOffset, setScrollOffset] = useState(0);
  const [viewportHeight, setViewportHeight] = useState(20);
  
  // Update viewport height on terminal resize
  useEffect(() => {
    const updateHeight = () => {
      // Reserve space for banner (~15 lines) and input box (~5 lines)
      const available = process.stdout.rows - 20;
      setViewportHeight(Math.max(10, available));
    };
    
    updateHeight();
    process.stdout.on('resize', updateHeight);
    return () => process.stdout.off('resize', updateHeight);
  }, []);
  
  // Handle scroll keys
  useInput((input, key) => {
    if (key.pageUp || (key.ctrl && input === 'b')) {
      setScrollOffset(Math.max(0, scrollOffset - viewportHeight));
    } else if (key.pageDown || (key.ctrl && input === 'f')) {
      setScrollOffset(Math.min(messages.length - 1, scrollOffset + viewportHeight));
    } else if (key.upArrow && key.shift) {
      setScrollOffset(Math.max(0, scrollOffset - 1));
    } else if (key.downArrow && key.shift) {
      setScrollOffset(Math.min(messages.length - 1, scrollOffset + 1));
    }
  });
  
  if (messages.length === 0) {
    return null;
  }
  
  // Calculate visible messages
  const visibleMessages = messages.slice(scrollOffset, scrollOffset + viewportHeight);
  const hasMoreAbove = scrollOffset > 0;
  const hasMoreBelow = scrollOffset + viewportHeight < messages.length;
  
  const renderMessage = (msg, index) => {
    const actualIndex = scrollOffset + index;
    
    // User message
    if (msg.role === 'user') {
      return React.createElement(
        Box,
        { key: actualIndex, flexDirection: 'column', marginTop: 1 },
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
        { key: actualIndex, flexDirection: 'column', marginTop: 1 },
        ...children
      );
    }
    
    // Tool result
    if (msg.role === 'tool') {
      return React.createElement(ToolOutput, {
        key: actualIndex,
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
    // Scroll indicator (top)
    hasMoreAbove && React.createElement(
      Box,
      { key: 'scroll-top', justifyContent: 'center' },
      React.createElement(Text, { color: theme.text.muted }, `↑ ${scrollOffset} more messages (Shift+Up/PageUp to scroll)`)
    ),
    // Messages
    ...visibleMessages.map((msg, index) => renderMessage(msg, index)),
    // Streaming indicator
    streaming && React.createElement(
      Box,
      { key: 'streaming', marginTop: 1, marginLeft: 2 },
      React.createElement(Text, { color: theme.status.thinking }, '⠋ AI is thinking...')
    ),
    // Scroll indicator (bottom)
    hasMoreBelow && React.createElement(
      Box,
      { key: 'scroll-bottom', justifyContent: 'center' },
      React.createElement(Text, { color: theme.text.muted }, `↓ ${messages.length - scrollOffset - viewportHeight} more messages (Shift+Down/PageDown to scroll)`)
    )
  );
};

export default MessageHistory;
