/**
 * Smart paste handler - detects large pastes and images
 */

/**
 * Handle paste result - consistent return type
 */
export const handlePaste = (text, onPaste) => {
  // Detect large pastes (>1000 chars or >10 lines)
  const lines = text.split('\n');
  const isLargePaste = text.length > 1000 || lines.length > 10;
  
  if (isLargePaste) {
    // Return placeholder
    return {
      type: 'large',
      display: `[Pasted Content: ${text.length} chars, ${lines.length} lines]`,
      original: text,
    };
  }
  
  // Detect image paths (common image extensions)
  const imageExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.bmp', '.svg', '.webp'];
  const trimmed = text.trim();
  
  if (imageExtensions.some(ext => trimmed.toLowerCase().endsWith(ext))) {
    return {
      type: 'image',
      display: `[Image: ${trimmed}]`,
      original: text,
    };
  }
  
  // Detect IP addresses
  const ipRegex = /\b(?:\d{1,3}\.){3}\d{1,3}\b/g;
  const ips = trimmed.match(ipRegex);
  if (ips && ips.length > 0) {
    return {
      type: 'ips',
      value: ips,
      display: ips.join(', '),
      original: text,
    };
  }
  
  // Detect URLs
  const urlRegex = /https?:\/\/[^\s]+/g;
  const urls = trimmed.match(urlRegex);
  if (urls && urls.length > 0) {
    return {
      type: 'urls',
      value: urls,
      display: urls.join(', '),
      original: text,
    };
  }
  
  // Regular text
  return {
    type: 'text',
    display: text,
    original: text,
  };
};

/**
 * Expand paste placeholders back to full content
 */
export const expandPastePlaceholders = (text, pasteCache) => {
  if (!pasteCache || pasteCache.size === 0) return text;
  
  return text.replace(/\[Pasted Content: \d+ chars, \d+ lines\]/g, (match) => {
    return pasteCache.get(match) || match;
  });
};

/**
 * Get display text from paste result
 */
export const getPasteDisplay = (result) => {
  if (typeof result === 'string') return result;
  return result.display || result.original || '';
};

/**
 * Get original text from paste result
 */
export const getPasteOriginal = (result) => {
  if (typeof result === 'string') return result;
  return result.original || result.display || '';
};
