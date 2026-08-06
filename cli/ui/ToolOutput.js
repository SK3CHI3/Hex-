/**
 * ToolOutput component - renders tool execution results with ANSI support
 * Handles expandable/collapsible output for long results
 */

import React, { useState } from 'react';
import { Box, Text } from 'ink';
import { themeManager } from './themes.js';

const MAX_LINES = 15;

const ToolOutput = ({ 
  toolName, 
  output, 
  error = false,
  expandable = true,
}) => {
  const [expanded, setExpanded] = useState(false);
  const theme = themeManager.getTheme();
  
  if (!output) {
    return React.createElement(
      Box,
      { marginLeft: 2, marginTop: 1 },
      React.createElement(Text, { color: theme.text.muted }, '[No output]')
    );
  }
  
  const lines = output.split('\n');
  const isLong = lines.length > MAX_LINES;
  const shouldCollapse = isLong && !expanded && expandable;
  const displayLines = shouldCollapse ? lines.slice(0, MAX_LINES) : lines;
  const remainingLines = lines.length - MAX_LINES;
  
  return React.createElement(
    Box,
    { flexDirection: 'column', marginLeft: 2, marginTop: 1 },
    // Tool name header
    React.createElement(
      Box,
      null,
      React.createElement(Text, { color: theme.status.tool }, '⚡ '),
      React.createElement(Text, { color: theme.status.tool, bold: true }, toolName)
    ),
    // Output content
    React.createElement(
      Box,
      { flexDirection: 'column', marginLeft: 2, marginTop: 1 },
      ...displayLines.map((line, i) => 
        React.createElement(Text, { key: i, color: error ? theme.status.error : theme.text.primary }, line || ' ')
      )
    ),
    // Expand indicator
    shouldCollapse && React.createElement(
      Box,
      { marginTop: 1 },
      React.createElement(Text, { color: theme.text.muted }, `... ${remainingLines} more lines`),
      React.createElement(Text, { color: theme.status.info }, ' [Press Ctrl+E to expand]')
    )
  );
};

export default ToolOutput;
