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
  executionMode = 'Direct',
  tokenCount = 0,
  showThinking = false,
  onToggleThinking = () => {},
  onToggleToolOutput = () => {},
  agentStatus = { phase: 'idle', toolName: null },
}) => {
  const [value, setValue] = useState('');
  const [cursorPosition, setCursorPosition] = useState(0);
  const [ghostText, setGhostText] = useState('');
  const [reverseSearchActive, setReverseSearchActive] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [waitingForEditorKey, setWaitingForEditorKey] = useState(false);
  const [pasteCache, setPasteCache] = useState(new Map());
  const inputRef = useRef(value);
  const historyRef = useRef([]);
  const historyIndexRef = useRef(-1);

  const theme = getTheme();

  // Ghost text calculation function (called directly in input handler)
  const calculateGhostText = (currentValue, isReverseSearchActive) => {
    if (currentValue.startsWith('/') && !isReverseSearchActive) {
      const commands = [
        '/help', '/clear', '/clear-memory', '/history', '/resume', '/tools', '/skills',
        '/skill', '/config', '/provider', '/setup', '/status', '/thinking',
        '/tokens', '/summarize', '/theme', '/fullscreen', '/editor', '/quit'
      ];
      const match = commands.find(cmd => cmd.startsWith(currentValue) && cmd !== currentValue);
      return match ? match.slice(currentValue.length) : '';
    }
    return '';
  };

  // Handle keyboard input
  useInput((input, key) => {
    // Display controls must remain available while the agent is active.
    // They only change local rendering and cannot submit another request.
    if (key.ctrl && input === 't') {
      onToggleThinking();
      return;
    }

    // Ctrl+O avoids Ctrl+E, which is already the conventional "move to end"
    // shortcut and part of Ctrl+X Ctrl+E.
    if (key.ctrl && input === 'o') {
      onToggleToolOutput();
      return;
    }

    if (disabled) return;
    
    // Handle Ctrl+X Ctrl+E for external editor
    if (waitingForEditorKey) {
      setWaitingForEditorKey(false);
      if (key.ctrl && input === 'e') {
        // Open external editor
        editInExternalEditor(value).then(editedContent => {
          setValue(editedContent);
          setCursorPosition(editedContent.length);
        }).catch(err => {
          // Show error to user by adding error state
          setValue(`[Editor failed: ${err.message}]\n${value}`);
        });
      }
      return;
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

    // Reverse search (Ctrl+R)
    if (key.ctrl && input === 'r') {
      setReverseSearchActive(true);
      setSearchQuery('');
      return;
    }
    
    // External editor (Ctrl+X Ctrl+E)
    if (key.ctrl && input === 'x') {
      setWaitingForEditorKey(true);
      return;
    }
    
    // Newline (Shift+Enter or Ctrl+J)
    if ((key.return && key.shift) || (key.ctrl && input === 'j')) {
      const newValue = value.slice(0, cursorPosition) + '\n' + value.slice(cursorPosition);
      setValue(newValue);
      setCursorPosition(cursorPosition + 1);
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

    // MessageHistory owns modified navigation keys for its viewport.
    if (key.shift && (key.upArrow || key.downArrow)) return;
    
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
      // Detect paste: multi-character input arriving at once
      if (input.length > 1) {
        const pasteResult = handlePaste(input);

        if (pasteResult.type === 'large') {
          // Store full content in cache, show placeholder
          const placeholder = pasteResult.display;
          const newValue = value.slice(0, cursorPosition) + placeholder + value.slice(cursorPosition);
          setValue(newValue);
          inputRef.current = newValue;
          setPasteCache(prev => {
            const next = new Map(prev);
            next.set(placeholder, pasteResult.original);
            return next;
          });
          setCursorPosition(cursorPosition + placeholder.length);
          setGhostText(calculateGhostText(newValue, reverseSearchActive));
        } else {
          // Regular paste — insert text directly
          const displayText = pasteResult.display || pasteResult.original;
          const newValue = value.slice(0, cursorPosition) + displayText + value.slice(cursorPosition);
          setValue(newValue);
          inputRef.current = newValue;
          setCursorPosition(cursorPosition + displayText.length);
          setGhostText(calculateGhostText(newValue, reverseSearchActive));
        }
      } else {
        // Single character — normal typing
        const newValue = value.slice(0, cursorPosition) + input + value.slice(cursorPosition);
        setValue(newValue);
        inputRef.current = newValue;
        setCursorPosition(cursorPosition + 1);
        setGhostText(calculateGhostText(newValue, reverseSearchActive));
      }
    }
  });

  // The prompt is intentionally a single visual row. Keeping it bounded means
  // the live Ink frame never grows into the transcript above it. Newlines stay
  // in the submitted value, but are represented by a visible return marker.
  const renderHighlightedText = () => {
    if (!value) return null;
    const beforeCursor = value.slice(0, cursorPosition).replace(/\n/g, ' ↵ ');
    const cursorChar = (value[cursorPosition] || ' ').replace(/\n/g, '↵');
    const afterCursor = value.slice(cursorPosition + 1).replace(/\n/g, ' ↵ ');
    const color = value.startsWith('/') ? theme.syntax.command : theme.text.primary;
    return React.createElement(Text, { color, wrap: 'truncate' },
      beforeCursor,
      React.createElement(Text, { color: theme.ui.cursor, inverse: true }, cursorChar),
      afterCursor,
      ghostText && cursorPosition === value.length ? React.createElement(Text, { color: theme.text.muted }, ghostText) : null);
  };

  // Render placeholder with cursor at start
  const renderPlaceholder = () => {
    if (value) return null;
    
    return React.createElement(
      Text,
      { wrap: 'truncate' },
      React.createElement(
        Text,
        { color: theme.ui.cursor, inverse: true },
        placeholder[0] // First char with cursor
      ),
      React.createElement(Text, { color: theme.text.muted }, placeholder.slice(1))
    );
  };

  // Render editor waiting indicator
  const renderEditorWaiting = () => {
    return null;
  };

  const footer = ` | ${executionMode}`;
  const statusText = waitingForEditorKey
    ? `Press Ctrl+E to open editor, any other key to cancel${footer}`
    : reverseSearchActive
    ? `(reverse-i-search)\`${searchQuery}': ${value.replace(/\n/g, ' ↵ ')}`
    : streaming
      ? `${formatAgentStatus(agentStatus)} (Esc to cancel)${footer}`
      : agentStatus.phase === 'complete'
        ? `✓ Response complete${footer}`
        : `${model} | ${tokenCount.toLocaleString()} tokens${footer}`;
  const statusColor = reverseSearchActive ? theme.status.info
    : streaming ? theme.status.thinking
      : agentStatus.phase === 'complete' ? (theme.status.success || theme.status.info)
        : theme.text.muted;

  return React.createElement(
    Box,
    { flexDirection: 'column', height: 4 },
    // Input area
    React.createElement(
      Box,
      {
        borderStyle: 'single',
        borderTop: true,
        borderBottom: true,
        borderLeft: false,
        borderRight: false,
        borderColor: theme.text.muted,
        height: 3,
      },
      React.createElement(Text, { color: theme.ui.prompt }, '❯ '),
      React.createElement(
        Box,
        { flexGrow: 1, overflow: 'hidden' },
        renderPlaceholder(),
        value ? renderHighlightedText() : null,
        renderEditorWaiting()
      )
    ),
    // Exactly one status row, regardless of mode.
    React.createElement(Text, { color: statusColor, wrap: 'truncate' }, statusText)
  );
};

const formatAgentStatus = ({ phase, toolName, toolIndex, toolTotal, detail } = {}) => {
  if (phase === 'planning') return 'AI is planning...';
  if (phase === 'thinking') return 'AI is reasoning...';
  if (phase === 'running') {
    const position = toolTotal ? ` ${toolIndex || 1}/${toolTotal}` : '';
    return `Running${position}: ${detail || toolName || 'tool'}...`;
  }
  if (phase === 'continuing') return 'Reviewing tool results...';
  return 'AI is working...';
};

export default InputBox;
