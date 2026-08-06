/**
 * Banner component - displays the Hex ASCII art banner and status info
 */

import React from 'react';
import { Box, Text } from 'ink';
import { getTheme } from './themes.js';

const Banner = ({ provider, model, executionMode, tokenCount, tokenLimit }) => {
  const theme = getTheme();
  const percentage = tokenLimit > 0 ? Math.round((tokenCount / tokenLimit) * 100) : 0;
  
  return React.createElement(
    Box,
    { flexDirection: 'column', paddingX: 1, paddingTop: 1 },
    // ASCII Art Logo
    React.createElement(
      Box,
      { flexDirection: 'column' },
      React.createElement(Text, { color: theme.ui.prompt, bold: true }, '  ██╗  ██╗███████╗██╗  ██╗'),
      React.createElement(Text, { color: theme.ui.prompt, bold: true }, '  ██║  ██║██╔════╝╚██╗██╔╝'),
      React.createElement(Text, { color: theme.ui.prompt, bold: true }, '  ███████║███████╗ ╚███╔╝ '),
      React.createElement(Text, { color: theme.ui.prompt, bold: true }, '  ██╔══██║██╔════╝ ██╔██╗ '),
      React.createElement(Text, { color: theme.ui.prompt, bold: true }, '  ██║  ██║███████╗██╔╝ ██╗'),
      React.createElement(Text, { color: theme.ui.prompt, bold: true }, '  ╚═╝  ╚═╝╚══════╝ ╚═╝  ╚═╝')
    ),
    // Subtitle
    React.createElement(
      Box,
      { marginTop: 1 },
      React.createElement(Text, { color: theme.text.secondary }, '  The AI-Powered Pentesting Assistant')
    ),
    React.createElement(
      Box,
      null,
      React.createElement(Text, { color: theme.text.muted }, '  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    ),
    // Status info
    React.createElement(
      Box,
      { flexDirection: 'column', marginTop: 1 },
      React.createElement(
        Text,
        { color: theme.text.secondary },
        '  Provider: ',
        React.createElement(Text, { color: theme.text.accent }, provider),
        ' | Model: ',
        React.createElement(Text, { color: theme.text.accent }, model)
      ),
      React.createElement(
        Text,
        { color: theme.text.secondary },
        '  Mode: ',
        React.createElement(Text, { color: theme.text.accent }, executionMode),
        ' | Type /help for commands'
      ),
      React.createElement(
        Text,
        { color: theme.text.secondary },
        '  Tokens: ',
        React.createElement(Text, { color: theme.text.accent }, tokenCount.toLocaleString()),
        ' / ',
        React.createElement(Text, { color: theme.text.accent }, tokenLimit.toLocaleString()),
        ` (${percentage}%)`
      )
    ),
    React.createElement(
      Box,
      { marginTop: 1 },
      React.createElement(Text, { color: theme.text.muted }, '  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    )
  );
};

export default Banner;
