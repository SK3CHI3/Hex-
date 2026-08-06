/**
 * Semantic color theme system for Hex terminal UI
 * Provides consistent color categories across all components
 */

export const themes = {
  dark: {
    // Text colors
    text: {
      primary: '#E0E0E0',      // Main text
      secondary: '#A0A0A0',    // Dimmed text, hints
      accent: '#00FF41',       // Highlights, prompts
      muted: '#5C6370',        // Very dim text
    },
    
    // Background colors
    background: {
      primary: '#1E1E1E',      // Main background
      secondary: '#252525',    // Slightly lighter
      elevated: '#2D2D2D',     // Cards, panels
    },
    
    // Border colors
    border: {
      default: '#3E3E3E',      // Inactive borders
      focused: '#00FF41',      // Active/focused borders
      error: '#E06C75',        // Error state borders
    },
    
    // UI element colors
    ui: {
      prompt: '#00FF41',       // Input prompt character
      selection: '#264F78',    // Selected text background
      cursor: '#FFFFFF',       // Cursor color
    },
    
    // Status colors
    status: {
      success: '#98C379',      // Success messages
      error: '#E06C75',        // Error messages
      warning: '#E5C07B',      // Warning messages
      info: '#61AFEF',         // Info messages
      thinking: '#C678DD',     // AI thinking state
      tool: '#E5C07B',         // Tool execution
    },
    
    // Syntax highlighting
    syntax: {
      command: '#61AFEF',      // Slash commands
      path: '#98C379',         // File paths
      tool: '#E5C07B',         // Tool names
      variable: '#C678DD',     // Variables
      string: '#98C379',       // String literals
      number: '#D19A66',       // Numbers
    },
  },
  
  light: {
    text: {
      primary: '#383A42',
      secondary: '#696C77',
      accent: '#00AA2A',
      muted: '#A0A3AB',
    },
    background: {
      primary: '#FAFAFA',
      secondary: '#F0F0F0',
      elevated: '#FFFFFF',
    },
    border: {
      default: '#D0D0D0',
      focused: '#00AA2A',
      error: '#E45649',
    },
    ui: {
      prompt: '#00AA2A',
      selection: '#ADD6FF',
      cursor: '#000000',
    },
    status: {
      success: '#50A14F',
      error: '#E45649',
      warning: '#C18401',
      info: '#4078F2',
      thinking: '#A626A4',
      tool: '#C18401',
    },
    syntax: {
      command: '#4078F2',
      path: '#50A14F',
      tool: '#C18401',
      variable: '#A626A4',
      string: '#50A14F',
      number: '#986801',
    },
  },
};

// Current active theme (can be changed at runtime)
let currentTheme = 'dark';

export const themeManager = {
  getTheme() {
    return themes[currentTheme];
  },
  
  setTheme(themeName) {
    if (themes[themeName]) {
      currentTheme = themeName;
      return true;
    }
    return false;
  },
  
  getAvailableThemes() {
    return Object.keys(themes);
  },
  
  getCurrentThemeName() {
    return currentTheme;
  },
};

// Convenience export for current theme
export const theme = themeManager.getTheme();
