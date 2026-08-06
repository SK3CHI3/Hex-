/**
 * ToolOutput component - renders tool execution results with ANSI support
 * Handles expandable/collapsible output for long results
 */

import React, { useState } from 'react';
import { Box, Text } from 'ink';
import { themeManager } from './themes.js';

const MAX_LINES = 15;

// Parse ANSI escape codes
const parseAnsi = (text) => {
  const ansiRegex = /\x1b\[[0-9;]*m/g;
  const parts = [];
  let lastIndex = 0;
  let match;
  
  while ((match = ansiRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ text: text.slice(lastIndex, match.index), codes: [] });
    }
    parts.push({ text: '', codes: match[0] });
    lastIndex = match.index + match[0].length;
  }
  
  if (lastIndex < text.length) {
    parts.push({ text: text.slice(lastIndex), codes: [] });
  }
  
  return parts;
};

// Apply ANSI color codes
const applyAnsiCodes = (text, codes) => {
  if (!codes) return text;
  
  const codeMap = {
    '30': 'black',
    '31': 'red',
    '32': 'green',
    '33': 'yellow',
    '34': 'blue',
    '35': 'magenta',
    '36': 'cyan',
    '37': 'white',
    '90': 'gray',
    '91': 'redBright',
    '92': 'greenBright',
    '93': 'yellowBright',
    '94': 'blueBright',
    '95': 'magentaBright',
    '96': 'cyanBright',
    '97': 'whiteBright',
  };
  
  const codeNumbers = codes.match(/\d+/g) || [];
  const color = codeMap[codeNumbers[0]];
  
  if (color) {
    return React.createElement(Text, { color }, text);
  }
  
  return text;
};

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
  
  // Render line with ANSI support
  const renderLine = (line, i) => {
    // Check if line contains ANSI codes
    if (line.includes('\x1b[')) {
      const parts = parseAnsi(line);
      return React.createElement(
        Box,
        { key: i },
        ...parts.map((part, j) => {
          if (part.codes) {
            return applyAnsiCodes(part.text, part.codes);
          }
          return React.createElement(Text, { key: j, color: error ? theme.status.error : theme.text.primary }, part.text);
        })
      );
    }
    
    return React.createElement(Text, { key: i, color: error ? theme.status.error : theme.text.primary }, line || ' ');
  };
  
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
      ...displayLines.map(renderLine)
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
