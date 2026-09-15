/**
 * App component - root component for Hex terminal UI
 * Fixed input at bottom, scrolling content above
 */

import React, { useState, useEffect } from 'react';
import { Box, useStdout } from 'ink';
import InputBox from './InputBox.js';
import MessageHistory from './MessageHistory.js';

const App = ({
  messages = [],
  onSendMessage,
  streaming = false,
  processing = false,
  banner = null,
  model = '',
  tokenCount = 0,
  showThinking = false,
  onToggleThinking = () => {},
  agentStatus = { phase: 'idle', toolName: null },
}) => {
  const [showToolOutput, setShowToolOutput] = useState(false);
  const { stdout } = useStdout();
  const [terminalHeight, setTerminalHeight] = useState(stdout?.rows || 24);

  // Track terminal resize
  useEffect(() => {
    if (!stdout) return;

    const handleResize = () => {
      setTerminalHeight(stdout.rows);
    };

    stdout.on('resize', handleResize);
    return () => stdout.off('resize', handleResize);
  }, [stdout]);

  // InputBox occupies five rows: its top margin, divider, input/bottom
  // border, and status row. Reserving only four made the full-screen layout
  // overflow by one row, so Ink could not erase the previous frame cleanly.
  const inputHeight = 5;
  // All content (banner + messages) scrolls together, input stays fixed at bottom
  const messageMaxHeight = terminalHeight - inputHeight - 2; // -2 for padding

  return React.createElement(
    Box,
    { flexDirection: 'column', height: terminalHeight },
    // Scrolling content area (banner + messages all scroll together)
    React.createElement(
      Box,
      {
        key: 'content',
        flexDirection: 'column',
        flexGrow: 1,
        height: terminalHeight - inputHeight,
      },
      // Message history (includes banner as first item)
      React.createElement(MessageHistory, {
        messages,
        streaming,
        processing,
        showThinking,
        showToolOutput,
        agentStatus,
        maxHeight: messageMaxHeight,
        banner,
      })
    ),
    // Fixed input box at bottom
    React.createElement(InputBox, {
      key: 'input',
      onSubmit: onSendMessage,
      disabled: streaming || processing,
      streaming,
      model,
      tokenCount,
      showThinking,
      onToggleThinking,
      onToggleToolOutput: () => setShowToolOutput(value => !value),
      agentStatus,
    })
  );
};

export default App;
