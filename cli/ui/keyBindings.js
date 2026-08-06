/**
 * Centralized key binding system for Hex terminal UI
 * All keyboard shortcuts defined in one place for easy customization
 */

export const Command = {
  // Input control
  SUBMIT: 'submit',
  NEWLINE: 'newline',
  ESCAPE: 'escape',
  CLEAR_INPUT: 'clear_input',
  
  // Cursor movement
  HOME: 'home',
  END: 'end',
  MOVE_LEFT: 'move_left',
  MOVE_RIGHT: 'move_right',
  MOVE_UP: 'move_up',
  MOVE_DOWN: 'move_down',
  
  // Text editing
  DELETE_WORD_BACKWARD: 'delete_word_backward',
  DELETE_WORD_FORWARD: 'delete_word_forward',
  KILL_LINE_LEFT: 'kill_line_left',
  KILL_LINE_RIGHT: 'kill_line_right',
  
  // History
  HISTORY_PREV: 'history_prev',
  HISTORY_NEXT: 'history_next',
  REVERSE_SEARCH: 'reverse_search',
  
  // Special
  OPEN_EXTERNAL_EDITOR: 'open_external_editor',
  TOGGLE_SHORTCUTS: 'toggle_shortcuts',
  CANCEL: 'cancel',
  
  // Expand/collapse
  EXPAND_OUTPUT: 'expand_output',
  EXPAND_THINKING: 'expand_thinking',
  
  // Navigation
  PAGE_UP: 'page_up',
  PAGE_DOWN: 'page_down',
};

/**
 * Default key bindings configuration
 * Each command maps to an array of key combinations
 */
export const defaultKeyBindings = {
  // Input control
  [Command.SUBMIT]: [
    { key: 'return' },
  ],
  [Command.NEWLINE]: [
    { key: 'return', shift: true },
    { key: 'j', ctrl: true },
  ],
  [Command.ESCAPE]: [
    { key: 'escape' },
  ],
  [Command.CLEAR_INPUT]: [
    { key: 'c', ctrl: true },
    { key: 'u', ctrl: true },
  ],
  
  // Cursor movement
  [Command.HOME]: [
    { key: 'a', ctrl: true },
    { key: 'home' },
  ],
  [Command.END]: [
    { key: 'e', ctrl: true },
    { key: 'end' },
  ],
  [Command.MOVE_LEFT]: [
    { key: 'left' },
    { key: 'b', ctrl: true },
  ],
  [Command.MOVE_RIGHT]: [
    { key: 'right' },
    { key: 'f', ctrl: true },
  ],
  [Command.MOVE_UP]: [
    { key: 'up' },
    { key: 'p', ctrl: true },
  ],
  [Command.MOVE_DOWN]: [
    { key: 'down' },
    { key: 'n', ctrl: true },
  ],
  
  // Text editing
  [Command.DELETE_WORD_BACKWARD]: [
    { key: 'w', ctrl: true },
    { key: 'backspace', meta: true },
  ],
  [Command.DELETE_WORD_FORWARD]: [
    { key: 'd', meta: true },
  ],
  [Command.KILL_LINE_LEFT]: [
    { key: 'u', ctrl: true },
  ],
  [Command.KILL_LINE_RIGHT]: [
    { key: 'k', ctrl: true },
  ],
  
  // History
  [Command.HISTORY_PREV]: [
    { key: 'up' },
    { key: 'p', ctrl: true },
  ],
  [Command.HISTORY_NEXT]: [
    { key: 'down' },
    { key: 'n', ctrl: true },
  ],
  [Command.REVERSE_SEARCH]: [
    { key: 'r', ctrl: true },
  ],
  
  // Special
  [Command.OPEN_EXTERNAL_EDITOR]: [
    { key: 'e', ctrl: true, meta: true },  // Ctrl+X Ctrl+E (simplified)
  ],
  [Command.TOGGLE_SHORTCUTS]: [
    { key: '?' },
  ],
  [Command.CANCEL]: [
    { key: 'c', ctrl: true },
    { key: 'escape' },
  ],
  
  // Expand/collapse
  [Command.EXPAND_OUTPUT]: [
    { key: 'e', ctrl: true },
  ],
  [Command.EXPAND_THINKING]: [
    { key: 't', ctrl: true },
  ],
  
  // Navigation
  [Command.PAGE_UP]: [
    { key: 'pageup' },
    { key: 'b', meta: true },
  ],
  [Command.PAGE_DOWN]: [
    { key: 'pagedown' },
    { key: 'f', meta: true },
  ],
};

/**
 * Check if a key press matches a key binding
 */
export function matchKeyBinding(key, binding) {
  // Check key name or sequence
  if (binding.key && key.name !== binding.key && key.sequence !== binding.key) {
    return false;
  }
  
  // Check modifiers
  if (binding.ctrl !== undefined) {
    if (binding.ctrl && !key.ctrl) return false;
    if (!binding.ctrl && key.ctrl) return false;
  }
  
  if (binding.shift !== undefined) {
    if (binding.shift && !key.shift) return false;
    if (!binding.shift && key.shift) return false;
  }
  
  if (binding.meta !== undefined) {
    if (binding.meta && !key.meta) return false;
    if (!binding.meta && key.meta) return false;
  }
  
  return true;
}

/**
 * Check if a key press matches any binding for a command
 */
export function matchCommand(key, command, bindings = defaultKeyBindings) {
  const commandBindings = bindings[command];
  if (!commandBindings) return false;
  
  return commandBindings.some(binding => matchKeyBinding(key, binding));
}

/**
 * Create key matchers object for all commands
 */
export function createKeyMatchers(bindings = defaultKeyBindings) {
  const matchers = {};
  
  for (const command of Object.values(Command)) {
    matchers[command] = (key) => matchCommand(key, command, bindings);
  }
  
  return matchers;
}

// Default key matchers instance
export const keyMatchers = createKeyMatchers();

/**
 * Get human-readable description of key binding
 */
export function getKeyDescription(command, bindings = defaultKeyBindings) {
  const commandBindings = bindings[command];
  if (!commandBindings || commandBindings.length === 0) {
    return 'Not bound';
  }
  
  return commandBindings.map(binding => {
    const parts = [];
    if (binding.ctrl) parts.push('Ctrl');
    if (binding.shift) parts.push('Shift');
    if (binding.meta) parts.push('Alt');
    
    const keyName = binding.key || '???';
    parts.push(keyName.toUpperCase());
    
    return parts.join('+');
  }).join(' or ');
}

/**
 * Get all key bindings as a formatted list
 */
export function getAllKeyBindings(bindings = defaultKeyBindings) {
  const result = [];
  
  for (const [command, commandBindings] of Object.entries(bindings)) {
    result.push({
      command,
      keys: commandBindings.map(b => getKeyDescription(command, { [command]: [b] })),
    });
  }
  
  return result;
}
