/**
 * Accessibility features for screen readers and keyboard navigation
 */

import React from 'react';
import { Text } from 'ink';

// Detect if screen reader is active
export const isScreenReaderEnabled = () => {
  // Check common screen reader environment variables
  return Boolean(
    process.env.SCREEN_READER ||
    process.env.NVDA ||
    process.env.JAWS ||
    process.env.VOICEOVER
  );
};

// Accessible text alternatives for visual elements
export const accessibleLabels = {
  spinner: 'Loading',
  thinking: 'AI is thinking',
  toolRunning: 'Running tool',
  toolComplete: 'Tool complete',
  error: 'Error',
  success: 'Success',
  warning: 'Warning',
  info: 'Information',
};

// Accessible spinner component
export const AccessibleSpinner = ({ label = 'Loading' }) => {
  if (isScreenReaderEnabled()) {
    return React.createElement(Text, null, `${label}...`);
  }
  
  // Visual spinner for non-screen-reader users
  return null; // Will be handled by visual spinner component
};

// Accessible status message
export const AccessibleStatus = ({ type, message }) => {
  if (isScreenReaderEnabled()) {
    const label = accessibleLabels[type] || type;
    return React.createElement(Text, null, `${label}: ${message}`);
  }
  
  return null; // Visual status will be rendered separately
};

// Keyboard navigation hints
export const getKeyboardHints = () => {
  return [
    'Tab: Autocomplete commands',
    'Ctrl+R: Search history',
    'Ctrl+V: Toggle vim mode',
    'Up/Down: Navigate history',
    'Shift+Enter: New line',
    'Ctrl+C: Cancel input',
    'Ctrl+A: Move to start',
    'Ctrl+E: Move to end',
    'Ctrl+W: Delete word',
    'Ctrl+U: Clear line',
    'Ctrl+K: Delete to end',
    'PageUp/PageDown: Scroll history',
  ];
};

// Format help text for screen readers
export const formatAccessibleHelp = () => {
  const hints = getKeyboardHints();
  return [
    'Hex - AI-Powered Pentesting Assistant',
    '',
    'Keyboard Shortcuts:',
    ...hints.map(hint => `  ${hint}`),
    '',
    'Commands:',
    '  /help - Show this help',
    '  /clear - Clear conversation',
    '  /history - List saved conversations',
    '  /tools - List available tools',
    '  /skills - List available skills',
    '  /config - Show configuration',
    '  /quit - Exit Hex',
  ].join('\n');
};
