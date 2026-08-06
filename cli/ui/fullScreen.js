/**
 * Full-screen mode using alternate screen buffer
 * Enables proper scrolling and full terminal usage
 */

// Enter alternate screen buffer (like vim, less)
export const enterAlternateScreen = () => {
  process.stdout.write('\x1b[?1049h'); // Enter alternate screen
  process.stdout.write('\x1b[H');      // Move cursor to top-left
};

// Exit alternate screen buffer
export const exitAlternateScreen = () => {
  process.stdout.write('\x1b[?1049l'); // Exit alternate screen
};

// Hide cursor
export const hideCursor = () => {
  process.stdout.write('\x1b[?25l');
};

// Show cursor
export const showCursor = () => {
  process.stdout.write('\x1b[?25h');
};

// Clear screen
export const clearScreen = () => {
  process.stdout.write('\x1b[2J'); // Clear entire screen
  process.stdout.write('\x1b[H');  // Move cursor to top-left
};

// Scroll terminal
export const scrollUp = (lines = 1) => {
  process.stdout.write(`\x1b[${lines}S`);
};

export const scrollDown = (lines = 1) => {
  process.stdout.write(`\x1b[${lines}T`);
};

// Save/restore cursor position
export const saveCursorPosition = () => {
  process.stdout.write('\x1b[s');
};

export const restoreCursorPosition = () => {
  process.stdout.write('\x1b[u');
};

// Full-screen mode manager
export class FullScreenManager {
  constructor() {
    this.isFullScreen = false;
    this.onEnter = null;
    this.onExit = null;
  }
  
  enter() {
    if (this.isFullScreen) return;
    
    enterAlternateScreen();
    clearScreen();
    this.isFullScreen = true;
    
    if (this.onEnter) {
      this.onEnter();
    }
  }
  
  exit() {
    if (!this.isFullScreen) return;
    
    exitAlternateScreen();
    this.isFullScreen = false;
    
    if (this.onExit) {
      this.onExit();
    }
  }
  
  toggle() {
    if (this.isFullScreen) {
      this.exit();
    } else {
      this.enter();
    }
  }
  
  isActive() {
    return this.isFullScreen;
  }
}

// Global instance
export const fullScreenManager = new FullScreenManager();

// Cleanup on process exit
process.on('exit', () => {
  if (fullScreenManager.isActive()) {
    fullScreenManager.exit();
  }
});

process.on('SIGINT', () => {
  if (fullScreenManager.isActive()) {
    fullScreenManager.exit();
  }
  process.exit();
});
