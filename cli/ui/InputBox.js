/**
 * InputBox component - bordered input with placeholder and syntax highlighting
 * The main input interface for Hex, replacing raw readline
 */

import React, { useState, useRef, useEffect } from 'react';
import { Box, Text, useInput } from 'ink';
import { themeManager } from './themes.js';
import { keyMatchers, Command } from './keyBindings.js';

const InputBox = ({ 
  onSubmit, 
  placeholder = 'Type a command or /help',
  disabled = false,
  streaming = false,
}) => {
  const [value, setValue] = useState('');
  const [cursorPosition, setCursorPosition] = useState(0);
  const inputRef = useRef(value);
  
  const theme = themeManager.getTheme();
  
  // Keep ref in sync
  useEffect(() => {
    inputRef.current = value;
  }, [value]);

  // Handle keyboard input
  useInput((input, key) => {
    if (disabled) return;
    
    // Submit
    if (key.return) {
      if (value.trim()) {
        onSubmit(value);
        setValue('');
        setCursorPosition(0);
      }
      return;
    }
    
    // Clear input (Ctrl+C or Ctrl+U)
    if ((key.ctrl && input === 'c') || (key.ctrl && input === 'u')) {
      setValue('');
      setCursorPosition(0);
      return;
    }
    
    // Home (Ctrl+A)
    if (key.ctrl && input === 'a') {
      setCursorPosition(0);
      return;
    }
    
    // End (Ctrl+E)
    if (key.ctrl && input === 'e') {
      setCursorPosition(value.length);
      return;
    }
    
    // Delete word backward (Ctrl+W)
    if (key.ctrl && input === 'w') {
      const beforeCursor = value.slice(0, cursorPosition);
      const afterCursor = value.slice(cursorPosition);
      const words = beforeCursor.split(/\s+/);
      words.pop();
      const newValue = words.join(' ') + (beforeCursor.match(/\s+$/) || [''])[0];
      setValue(newValue + afterCursor);
      setCursorPosition(newValue.length);
      return;
    }
    
    // Kill line left (Ctrl+U)
    if (key.ctrl && input === 'u') {
      setValue(value.slice(cursorPosition));
      setCursorPosition(0);
      return;
    }
    
    // Kill line right (Ctrl+K)
    if (key.ctrl && input === 'k') {
      setValue(value.slice(0, cursorPosition));
      return;
    }
    
    // Backspace
    if (key.backspace || key.delete) {
      if (cursorPosition > 0) {
        const newValue = value.slice(0, cursorPosition - 1) + value.slice(cursorPosition);
        setValue(newValue);
        setCursorPosition(cursorPosition - 1);
      }
      return;
    }
    
    // Left arrow
    if (key.leftArrow && cursorPosition > 0) {
      setCursorPosition(cursorPosition - 1);
      return;
    }
    
    // Right arrow
    if (key.rightArrow && cursorPosition < value.length) {
      setCursorPosition(cursorPosition + 1);
      return;
    }
    
    // Regular character input
    if (input && !key.ctrl && !key.meta) {
      const newValue = value.slice(0, cursorPosition) + input + value.slice(cursorPosition);
      setValue(newValue);
      setCursorPosition(cursorPosition + 1);
    }
  });

  // Syntax highlighting for input
  const renderHighlightedText = () => {
    if (!value) return null;
    
    // Detect slash commands
    if (value.startsWith('/')) {
      const parts = value.split(' ');
      const command = parts[0];
      const rest = parts.slice(1).join(' ');
      
      return React.createElement(
        Box,
        null,
        React.createElement(Text, { color: theme.syntax.command }, command),
        rest && React.createElement(Text, { color: theme.text.primary }, ' ' + rest)
      );
    }
    
    // Detect @file paths
    if (value.includes('@')) {
      const parts = value.split(/(@[^\s]+)/);
      return React.createElement(
        Box,
        null,
        ...parts.map((part, i) => {
          if (part.startsWith('@')) {
            return React.createElement(Text, { key: i, color: theme.syntax.path }, part);
          }
          return React.createElement(Text, { key: i, color: theme.text.primary }, part);
        })
      );
    }
    
    // Default: plain text
    return React.createElement(Text, { color: theme.text.primary }, value);
  };

  // Render cursor
  const renderCursor = () => {
    if (disabled) return null;
    
    const cursorChar = value[cursorPosition] || ' ';
    return React.createElement(
      Text,
      { color: theme.ui.cursor, inverse: true },
      cursorChar
    );
  };

  // Render placeholder
  const renderPlaceholder = () => {
    if (value || disabled) return null;
    
    return React.createElement(
      Text,
      { color: theme.text.muted },
      placeholder[0],
      React.createElement(Text, { color: theme.text.secondary }, placeholder.slice(1))
    );
  };

  const borderColor = streaming ? theme.status.thinking : theme.border.focused;
  const terminalWidth = process.stdout.columns || 80;
  const borderWidth = terminalWidth - 2; // Account for box borders

  return React.createElement(
    Box,
    { flexDirection: 'column', marginTop: 1 },
    // Top border with label
    React.createElement(
      Box,
      null,
      React.createElement(
        Text,
        { color: borderColor },
        '─'.repeat(borderWidth - 8) + ' ',
        React.createElement(Text, { color: theme.text.secondary }, 'Input'),
        ' ' + '─'.repeat(3)
      )
    ),
    // Input area
    React.createElement(
      Box,
      {
        borderStyle: 'single',
        borderTop: false,
        borderBottom: true,
        borderLeft: false,
        borderRight: false,
        borderColor: borderColor,
      },
      React.createElement(Text, { color: theme.ui.prompt }, '❯ '),
      React.createElement(
        Box,
        { flexGrow: 1 },
        renderPlaceholder(),
        value ? renderHighlightedText() : null,
        renderCursor()
      )
    ),
    // Status hint
    streaming && React.createElement(
      Box,
      { marginTop: 0 },
      React.createElement(Text, { color: theme.status.thinking }, 'AI is thinking... (Ctrl+C to cancel)')
    )
  );
};

export default InputBox;
