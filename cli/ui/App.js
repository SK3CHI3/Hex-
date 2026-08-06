/**
 * App component - root component for Hex terminal UI
 * Manages the overall layout and state coordination
 */

import React from 'react';
import { Box, Text } from 'ink';
import { getTheme } from './themes.js';
import InputBox from './InputBox.js';
import MessageHistory from './MessageHistory.js';

const App = ({
  messages = [],
  onSendMessage,
  streaming = false,
  banner = null,
}) => {
  const theme = getTheme();
  
  return React.createElement(
    Box,
    { flexDirection: 'column', height: '100%' },
    // Banner
    banner && React.createElement(
      Box,
      { key: 'banner', flexDirection: 'column' },
      banner
    ),
    // Message history
    React.createElement(
      Box,
      { key: 'history', flexDirection: 'column', flexGrow: 1 },
      React.createElement(MessageHistory, { messages, streaming })
    ),
    // Input box at bottom
    React.createElement(InputBox, {
      key: 'input',
      onSubmit: onSendMessage,
      disabled: streaming,
      streaming,
    })
  );
};

export default App;
