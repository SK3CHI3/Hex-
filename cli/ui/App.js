/**
 * App component - root component for Hex terminal UI
 * Fixed input at bottom, scrolling content above
 */

import React, { useState, useEffect, useRef } from 'react';
import { Box, Text, useStdout, useApp } from 'ink';
import { getTheme } from './themes.js';
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
}) => {
  const theme = getTheme();
  const [showThinking, setShowThinking] = useState(false);
  const { stdout } = useStdout();
  const [terminalHeight, setTerminalHeight] = useState(stdout?.rows || 24);
  const scrollContainerRef = useRef(null);

  // Track terminal resize
  useEffect(() => {
    if (!stdout) return;

    const handleResize = () => {
      setTerminalHeight(stdout.rows);
    };

    stdout.on('resize', handleResize);
    return () => stdout.off('resize', handleResize);
  }, [stdout]);

  // Calculate input height (border + content + border + status line)
  const inputHeight = 4;
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
      onToggleThinking: () => setShowThinking(!showThinking),
    })
  );
};

export default App;
