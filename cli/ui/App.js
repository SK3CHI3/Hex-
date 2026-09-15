/**
 * Full-height terminal application.
 *
 * The conversation is a bounded viewport; the composer owns a fixed four-row
 * footer, so output can never push it away from the bottom of the terminal.
 */
import React, { useEffect, useState } from 'react';
import { Box, useStdout } from 'ink';
import InputBox from './InputBox.js';
import MessageHistory from './MessageHistory.js';

const INPUT_HEIGHT = 4;

const App = ({
  messages = [], onSendMessage, streaming = false, processing = false,
  banner = null, model = '', executionMode = 'Direct', tokenCount = 0,
  showThinking = false, onToggleThinking = () => {},
  agentStatus = { phase: 'idle', toolName: null }, liveResponse = null,
}) => {
  const [showToolOutput, setShowToolOutput] = useState(false);
  const { stdout } = useStdout();
  const [rows, setRows] = useState(Math.max(8, stdout?.rows || 24));

  useEffect(() => {
    if (!stdout) return undefined;
    const onResize = () => setRows(Math.max(8, stdout.rows || 24));
    stdout.on('resize', onResize);
    return () => stdout.off('resize', onResize);
  }, [stdout]);

  // Ink 4 clears the screen when a dynamic frame reaches stdout.rows. Leave
  // one terminal row unused while still keeping the composer screen-anchored.
  const appHeight = Math.max(7, rows - 1);
  const historyHeight = Math.max(3, appHeight - INPUT_HEIGHT);

  return React.createElement(
    Box,
    { flexDirection: 'column', height: appHeight, overflow: 'hidden' },
    React.createElement(
      Box,
      { flexDirection: 'column', height: historyHeight, overflow: 'hidden' },
      React.createElement(MessageHistory, {
        messages, streaming, processing, showThinking, showToolOutput,
        agentStatus, banner, liveResponse, maxHeight: historyHeight,
      })
    ),
    React.createElement(InputBox, {
      key: 'input', onSubmit: onSendMessage, disabled: streaming || processing,
      streaming, model, executionMode, tokenCount, showThinking,
      onToggleThinking, onToggleToolOutput: () => setShowToolOutput(value => !value), agentStatus,
    })
  );
};

export default App;
