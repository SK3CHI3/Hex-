/**
 * Terminal environment detection and adaptation
 */

// Detect if running inside tmux
export const isTmux = () => {
  return Boolean(process.env.TMUX);
};

// Detect if running inside screen
export const isScreen = () => {
  return Boolean(process.env.STY);
};

// Detect terminal type
export const getTerminalType = () => {
  const term = process.env.TERM || '';
  
  if (term.includes('xterm')) return 'xterm';
  if (term.includes('screen')) return 'screen';
  if (term.includes('tmux')) return 'tmux';
  if (term.includes('vt100')) return 'vt100';
  if (term.includes('ansi')) return 'ansi';
  
  return 'unknown';
};

// Detect if terminal supports colors
export const supportsColor = () => {
  if (process.env.NO_COLOR) return false;
  if (process.env.FORCE_COLOR) return true;
  
  const term = process.env.TERM || '';
  if (term === 'dumb') return false;
  
  // Most modern terminals support 256 colors
  if (term.includes('256color')) return '256';
  
  // Basic color support
  if (process.platform === 'win32') return 'basic';
  if (term) return 'basic';
  
  return false;
};

// Detect if running in CI
export const isCI = () => {
  return Boolean(process.env.CI || process.env.CONTINUOUS_INTEGRATION);
};

// Get terminal dimensions
export const getTerminalSize = () => {
  return {
    columns: process.stdout.columns || 80,
    rows: process.stdout.rows || 24,
  };
};

// Check if terminal supports unicode
export const supportsUnicode = () => {
  const lang = process.env.LANG || '';
  const lcAll = process.env.LC_ALL || '';
  
  return lang.includes('UTF-8') || lcAll.includes('UTF-8') || process.platform === 'win32';
};

// Get appropriate spinner frames based on terminal
export const getSpinnerFrames = () => {
  if (isTmux() || isScreen()) {
    // Simple frames for tmux/screen
    return ['. ', '..'];
  }
  
  // Full braille spinner for modern terminals
  return ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
};

// Get spinner interval based on terminal
export const getSpinnerInterval = () => {
  if (isTmux() || isScreen()) {
    return 750; // Slower for tmux/screen
  }
  
  return 80; // Fast for modern terminals
};
