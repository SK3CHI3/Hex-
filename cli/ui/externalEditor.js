/**
 * External editor integration
 * Opens input in external editor for complex multi-line editing
 */

import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import os from 'os';

// Get user's preferred editor
export const getEditor = () => {
  return process.env.EDITOR || process.env.VISUAL || (process.platform === 'win32' ? 'notepad' : 'vim');
};

// Create temporary file for editing
export const createTempFile = (content = '') => {
  const tempDir = os.tmpdir();
  const tempFile = path.join(tempDir, `hex-input-${Date.now()}.txt`);
  
  fs.writeFileSync(tempFile, content, 'utf-8');
  return tempFile;
};

// Clean up temporary file
export const cleanupTempFile = (filePath) => {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch (err) {
    // Ignore cleanup errors
  }
};

// Open file in external editor
export const openInEditor = (filePath) => {
  return new Promise((resolve, reject) => {
    const editor = getEditor();
    
    // Disable mouse and show cursor before opening editor
    process.stdout.write('\x1b[?1000l'); // Disable mouse
    process.stdout.write('\x1b[?25h');   // Show cursor
    
    const proc = spawn(editor, [filePath], {
      stdio: 'inherit',
      shell: process.platform === 'win32',
    });
    
    proc.on('close', (code) => {
      if (code === 0) {
        const content = fs.readFileSync(filePath, 'utf-8');
        resolve(content);
      } else {
        reject(new Error(`Editor exited with code ${code}`));
      }
    });
    
    proc.on('error', (err) => {
      reject(err);
    });
  });
};

// Main function: open content in editor and return edited content
export const editInExternalEditor = async (currentContent = '') => {
  const tempFile = createTempFile(currentContent);
  
  try {
    const editedContent = await openInEditor(tempFile);
    return editedContent;
  } finally {
    cleanupTempFile(tempFile);
  }
};

// Check if external editor is available
export const isEditorAvailable = () => {
  const editor = getEditor();
  
  try {
    // Try to find the editor in PATH
    const which = process.platform === 'win32' ? 'where' : 'which';
    const proc = spawn(which, [editor], { stdio: 'ignore' });
    
    return new Promise((resolve) => {
      proc.on('close', (code) => {
        resolve(code === 0);
      });
      proc.on('error', () => {
        resolve(false);
      });
    });
  } catch {
    return Promise.resolve(false);
  }
};

// Get editor info for display
export const getEditorInfo = () => {
  const editor = getEditor();
  return {
    name: editor,
    envVar: process.env.EDITOR ? 'EDITOR' : process.env.VISUAL ? 'VISUAL' : 'default',
  };
};
