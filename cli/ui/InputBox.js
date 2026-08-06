/**
 * InputBox component - bordered input with placeholder, syntax highlighting, and advanced features
 * The main input interface for Hex, replacing raw readline
 */

import React, { useState, useRef, useEffect } from 'react';
import { Box, Text, useInput } from 'ink';
import { getTheme } from './themes.js';
import { keyMatchers, Command } from './keyBindings.js';
import { editInExternalEditor } from './externalEditor.js';
import { handlePaste, expandPastePlaceholders } from './pasteHandler.js';

const InputBox = ({
  onSubmit,
  placeholder = 'Type a command or /help',
  disabled = false,
  streaming = false,
  model = '',
  tokenCount = 0,
  showThinking = false,
  onToggleThinking = () => {},
}) => {
  const [value, setValue] = useState('');
  const [cursorPosition, setCursorPosition] = useState(0);
  const [ghostText, setGhostText] = useState('');
  const [reverseSearchActive, setReverseSearchActive] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [vimMode, setVimMode] = useState(false);
  const [vimInsertMode, setVimInsertMode] = useState(true);
  const [waitingForEditorKey, setWaitingForEditorKey] = useState(false);
  const [pasteCache, setPasteCache] = useState(new Map());
  const inputRef = useRef(value);
  const historyRef = useRef([]);
  const historyIndexRef = useRef(-1);
  
  const theme = getTheme();
  
  // Keep ref in sync
  useEffect(() => {
    inputRef.current = value;
  }, [value]);

  // Ghost text autocomplete for slash commands
  useEffect(() => {
    if (value.startsWith('/') && !reverseSearchActive) {
      const commands = [
        '/help', '/clear', '/history', '/resume', '/tools', '/skills',
        '/skill', '/config', '/provider', '/setup', '/status', '/thinking',
        '/tokens', '/summarize', '/theme', '/fullscreen', '/editor', '/quit'
      ];
      const match = commands.find(cmd => cmd.startsWith(value) && cmd !== value);
      setGhostText(match ? match.slice(value.length) : '');
    } else {
      setGhostText('');
    }
  }, [value, reverseSearchActive]);

  // Handle keyboard input
  useInput((input, key) => {
    if (disabled) return;
    
    // Handle Ctrl+X Ctrl+E for external editor
    if (waitingForEditorKey) {
      setWaitingForEditorKey(false);
      if (input === 'e') {
        // Open external editor
        editInExternalEditor(value).then(editedContent => {
          setValue(editedContent);
          setCursorPosition(editedContent.length);
        }).catch(err => {
          console.error('Editor error:', err);
        });
      }
      return;
    }
    
    // Vim mode handling
    if (vimMode) {
      if (key.escape) {
        setVimInsertMode(false);
        return;
      }
      
      if (!vimInsertMode) {
        // Normal mode commands
        if (input === 'i') {
          setVimInsertMode(true);
          return;
        }
        if (input === 'h' && cursorPosition > 0) {
          setCursorPosition(cursorPosition - 1);
          return;
        }
        if (input === 'l' && cursorPosition < value.length) {
          setCursorPosition(cursorPosition + 1);
          return;
        }
        if (input === '0') {
          setCursorPosition(0);
          return;
        }
        if (input === '$') {
          setCursorPosition(value.length);
          return;
        }
        if (input === 'w') {
          // Move to next word
          const rest = value.slice(cursorPosition);
          const match = rest.match(/\s+\S/);
          if (match) {
            setCursorPosition(cursorPosition + match.index + match[0].length);
          } else {
            setCursorPosition(value.length);
          }
          return;
        }
        if (input === 'b') {
          // Move to previous word
          const before = value.slice(0, cursorPosition);
          const match = before.match(/\S+\s*$/);
          if (match) {
            setCursorPosition(cursorPosition - match[0].length);
          } else {
            setCursorPosition(0);
          }
          return;
        }
        if (input === 'x' && cursorPosition < value.length) {
          // Delete character
          const newValue = value.slice(0, cursorPosition) + value.slice(cursorPosition + 1);
          setValue(newValue);
          return;
        }
        if (input === 'd') {
          // Delete line (dd in vim normal mode)
          setValue('');
          setCursorPosition(0);
          return;
        }
        return;
      }
    }
    
    // Reverse search mode
    if (reverseSearchActive) {
      if (key.escape) {
        setReverseSearchActive(false);
        setSearchQuery('');
        return;
      }
      if (key.return) {
        setReverseSearchActive(false);
        // Keep the matched value
        return;
      }
      if (key.backspace || key.delete) {
        setSearchQuery(searchQuery.slice(0, -1));
        return;
      }
      if (input && !key.ctrl && !key.meta) {
        setSearchQuery(searchQuery + input);
        // Search history for match
        const match = historyRef.current.find(h => h.includes(searchQuery + input));
        if (match) {
          setValue(match);
          setCursorPosition(match.length);
        }
      }
      return;
    }
    
    // Toggle vim mode (Ctrl+V)
    if (key.ctrl && input === 'v') {
      setVimMode(!vimMode);
      setVimInsertMode(true);
      return;
    }

    // Toggle thinking display (Ctrl+T)
    if (key.ctrl && input === 't') {
      onToggleThinking();
      return;
    }

    // Reverse search (Ctrl+R)
    if (key.ctrl && input === 'r') {
      setReverseSearchActive(true);
      setSearchQuery('');
      return;
    }
    
    // External editor (Ctrl+X)
    if (key.ctrl && input === 'x') {
      setWaitingForEditorKey(true);
      return;
    }
    
    // Submit
    if (key.return) {
      if (value.trim()) {
        // Expand paste placeholders
        const expandedValue = expandPastePlaceholders(value, pasteCache);
        
        // Add to history
        historyRef.current = [expandedValue, ...historyRef.current.slice(0, 99)];
        historyIndexRef.current = -1;
        
        onSubmit(expandedValue);
        setValue('');
        setCursorPosition(0);
      }
      return;
    }
    
    // Newline (Shift+Enter or Ctrl+J)
    if ((key.return && key.shift) || (key.ctrl && input === 'j')) {
      const newValue = value.slice(0, cursorPosition) + '\n' + value.slice(cursorPosition);
      setValue(newValue);
      setCursorPosition(cursorPosition + 1);
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
    
    // Accept ghost text (Tab or Right Arrow at end)
    if ((key.tab || key.rightArrow) && ghostText && cursorPosition === value.length) {
      setValue(value + ghostText);
      setCursorPosition(value.length + ghostText.length);
      return;
    }
    
    // History navigation (Up/Down)
    if (key.upArrow && historyRef.current.length > 0) {
      if (historyIndexRef.current < historyRef.current.length - 1) {
        historyIndexRef.current++;
        const histValue = historyRef.current[historyIndexRef.current];
        setValue(histValue);
        setCursorPosition(histValue.length);
      }
      return;
    }
    
    if (key.downArrow && historyIndexRef.current > 0) {
      historyIndexRef.current--;
      const histValue = historyRef.current[historyIndexRef.current];
      setValue(histValue);
      setCursorPosition(histValue.length);
      return;
    }
    
    if (key.downArrow && historyIndexRef.current === 0) {
      historyIndexRef.current = -1;
      setValue('');
      setCursorPosition(0);
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

  // Render ghost text
  const renderGhostText = () => {
    if (!ghostText || cursorPosition !== value.length) return null;
    
    return React.createElement(
      Text,
      { color: theme.text.muted },
      ghostText
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

  // Render reverse search prompt
  const renderReverseSearch = () => {
    if (!reverseSearchActive) return null;
    
    return React.createElement(
      Box,
      { marginTop: 1 },
      React.createElement(Text, { color: theme.status.info }, `(reverse-i-search)\`${searchQuery}': ${value}`)
    );
  };

  // Render vim mode indicator
  const renderVimIndicator = () => {
    if (!vimMode) return null;
    
    const mode = vimInsertMode ? 'INSERT' : 'NORMAL';
    const color = vimInsertMode ? theme.status.success : theme.status.warning;
    
    return React.createElement(
      Text,
      { color, bold: true },
      ` [${mode}]`
    );
  };

  // Render editor waiting indicator
  const renderEditorWaiting = () => {
    if (!waitingForEditorKey) return null;
    
    return React.createElement(
      Text,
      { color: theme.status.info },
      ' (Press Ctrl+E to open editor)'
    );
  };

  const borderColor = theme.text.muted;
  const terminalWidth = process.stdout.columns || 80;
  const borderWidth = terminalWidth - 2;

  return React.createElement(
    Box,
    { flexDirection: 'column', marginTop: 1 },
    // Top border (no label)
    React.createElement(
      Box,
      null,
      React.createElement(
        Text,
        { color: borderColor },
        '─'.repeat(borderWidth)
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
        renderGhostText(),
        renderCursor(),
        renderVimIndicator(),
        renderEditorWaiting()
      )
    ),
    // Reverse search display
    renderReverseSearch(),
    // Status hint
    streaming && React.createElement(
      Box,
      { marginTop: 0 },
      React.createElement(Text, { color: theme.status.thinking }, 'AI is thinking... (Ctrl+C to cancel)')
    ),
    // Help hint
    !streaming && React.createElement(
      Box,
      { marginTop: 0 },
      React.createElement(Text, { color: theme.text.muted }, `${model} | ${tokenCount.toLocaleString()} tokens`)
    )
  );
};

export default InputBox;
