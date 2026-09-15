/**
 * App component - root component for Hex terminal UI
 * Fixed input at bottom, scrolling content above
 */

import React, { useState } from 'react';
import { Box } from 'ink';
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
  liveResponse = null,
}) => {
  const [showToolOutput, setShowToolOutput] = useState(false);
  return React.createElement(
    Box,
    { flexDirection: 'column' },
    // MessageHistory writes completed items above the live region through
    // Ink's Static component. It deliberately has no constrained height.
    React.createElement(MessageHistory, {
      messages, streaming, processing, showThinking, showToolOutput, agentStatus, banner, liveResponse,
    }),
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
