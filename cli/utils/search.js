/**
 * Web search using DuckDuckGo Instant Answer API
 * No API key required
 * 
 * Features:
 * - 10-second timeout
 * - Result caching (1 hour)
 * - Result filtering
 * - Enhanced error handling
 */

// ========== CACHE SYSTEM ==========
const searchCache = new Map();
const CACHE_TTL = 3600000; // 1 hour

function getCachedSearch(query) {
  const cached = searchCache.get(query);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.results;
  }
  return null;
}

function setCachedSearch(query, results) {
  searchCache.set(query, { 
    results, 
    timestamp: Date.now() 
  });
  
  // Limit cache size to 100 entries
  if (searchCache.size > 100) {
    const oldest = Array.from(searchCache.keys())[0];
    searchCache.delete(oldest);
  }
}

// ========== MAIN SEARCH FUNCTION ==========
export async function webSearch(query, maxResults = 5, options = {}) {
  const {
    filterDomain = null,
    excludeDomain = null,
    minSnippetLength = 0,
  } = options;
  
  // Check cache first
  const cached = getCachedSearch(query);
  if (cached) {
    return { ...cached, fromCache: true };
  }
  
  // Setup timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 seconds
  
  try {
    const url = `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`;
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);

    if (!response.ok) {
      return { 
        query, 
        results: [], 
        error: `Search failed with status ${response.status}` 
      };
    }

    const data = await response.json();
    const results = [];
    
    // Abstract (main answer)
    if (data.Abstract && data.AbstractURL) {
      results.push({
        title: data.Heading || 'Summary',
        url: data.AbstractURL,
        snippet: data.Abstract || '',
        source: data.AbstractSource || 'DuckDuckGo',
      });
    }
    
    // Related topics
    if (data.RelatedTopics && Array.isArray(data.RelatedTopics)) {
      for (const topic of data.RelatedTopics) {
        if (results.length >= maxResults * 2) break; // Get extra for filtering
        
        if (topic.FirstURL && topic.Text) {
          results.push({
            title: topic.Text.split(' - ')[0] || topic.Text.substring(0, 60),
            url: topic.FirstURL,
            snippet: topic.Text,
            source: 'DuckDuckGo',
          });
        }
        
        // Nested topics
        if (topic.Topics && Array.isArray(topic.Topics)) {
          for (const sub of topic.Topics) {
            if (results.length >= maxResults * 2) break;
            if (sub.FirstURL && sub.Text) {
              results.push({
                title: sub.Text.split(' - ')[0] || sub.Text.substring(0, 60),
                url: sub.FirstURL,
                snippet: sub.Text,
                source: 'DuckDuckGo',
              });
            }
          }
        }
      }
    }
    
    // Definition
    if (data.Definition && data.DefinitionURL && results.length < maxResults) {
      results.push({
        title: 'Definition',
        url: data.DefinitionURL,
        snippet: data.Definition,
        source: data.DefinitionSource || 'DuckDuckGo',
      });
    }
    
    // Results array
    if (data.Results && Array.isArray(data.Results)) {
      for (const result of data.Results) {
        if (results.length >= maxResults * 2) break;
        if (result.FirstURL && result.Text) {
          results.push({
            title: result.Text.split(' - ')[0] || result.Text.substring(0, 60),
            url: result.FirstURL,
            snippet: result.Text,
            source: 'DuckDuckGo',
          });
        }
      }
    }
    
    // Apply filters
    let filtered = results;
    
    if (filterDomain) {
      filtered = filtered.filter(r => {
        try {
          return new URL(r.url).hostname.includes(filterDomain);
        } catch {
          return false;
        }
      });
    }
    
    if (excludeDomain) {
      filtered = filtered.filter(r => {
        try {
          return !new URL(r.url).hostname.includes(excludeDomain);
        } catch {
          return true;
        }
      });
    }
    
    if (minSnippetLength > 0) {
      filtered = filtered.filter(r => 
        r.snippet && r.snippet.length >= minSnippetLength
      );
    }
    
    // Trim to maxResults after filtering
    filtered = filtered.slice(0, maxResults);
    
    const searchResult = {
      query,
      results: filtered,
      count: filtered.length,
      provider: 'DuckDuckGo',
      timestamp: new Date().toISOString(),
      message: filtered.length === 0 ? 'No results found. Try a more specific query or well-known topic.' : null,
    };
    
    // Cache the results
    setCachedSearch(query, searchResult);
    
    return searchResult;
    
  } catch (err) {
    clearTimeout(timeoutId);
    
    if (err.name === 'AbortError') {
      return { 
        query, 
        results: [], 
        error: 'Search timed out after 10 seconds. Try a simpler query.' 
      };
    }
    
    return { 
      query, 
      results: [], 
      error: `Search error: ${err.message}` 
    };
  }
}

/**
 * Format search results for terminal display with colors
 * Uses ANSI escape codes for better readability
 */
export function formatSearchResults(searchResult) {
  // Colors using ANSI escape codes
  const colors = {
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m',
    white: '\x1b[37m',
    gray: '\x1b[90m',
    bold: '\x1b[1m',
    dim: '\x1b[2m',
    underline: '\x1b[4m',
    reset: '\x1b[0m',
  };
  
  // Error state
  if (searchResult.error) {
    return `\n${colors.red}❌ Search error:${colors.reset} ${searchResult.error}\n`;
  }
  
  // No results
  if (!searchResult.results || searchResult.results.length === 0) {
    const message = searchResult.message || `No results found for: "${searchResult.query}"`;
    return `\n${colors.yellow}⚠️  ${message}${colors.reset}\n` +
           `${colors.gray}💡 Tip: Try more specific or well-known terms${colors.reset}\n`;
  }
  
  let output = '';
  
  // Header
  output += `\n${colors.cyan}${colors.bold}🔍 Search Results${colors.reset}`;
  output += ` ${colors.gray}(${searchResult.count} found`;
  
  if (searchResult.fromCache) {
    output += `${colors.green} • cached${colors.reset}`;
  }
  
  output += `)${colors.reset}\n`;
  output += `${colors.gray}Query: "${searchResult.query}"${colors.reset}\n`;
  output += `${colors.gray}Provider: ${searchResult.provider || 'DuckDuckGo'}${colors.reset}\n`;
  output += `${colors.gray}${'─'.repeat(70)}${colors.reset}\n\n`;
  
  // Results
  searchResult.results.forEach((r, i) => {
    // Number
    output += `${colors.green}${colors.bold}${i + 1}.${colors.reset} `;
    
    // Title
    output += `${colors.white}${colors.bold}${r.title}${colors.reset}\n`;
    
    // URL
    output += `   ${colors.blue}${colors.underline}${r.url}${colors.reset}\n`;
    
    // Snippet
    if (r.snippet) {
      let snippet = r.snippet;
      
      // Truncate long snippets
      if (snippet.length > 200) {
        snippet = snippet.substring(0, 200) + '...';
      }
      
      output += `   ${colors.gray}${snippet}${colors.reset}\n`;
    }
    
    // Source (if different from provider)
    if (r.source && r.source !== (searchResult.provider || 'DuckDuckGo')) {
      output += `   ${colors.gray}📍 Source: ${r.source}${colors.reset}\n`;
    }
    
    output += '\n';
  });
  
  // Footer
  output += `${colors.gray}${'─'.repeat(70)}${colors.reset}\n`;
  
  return output;
}

/**
 * Clear the search cache
 * Useful for testing or forcing fresh results
 */
export function clearSearchCache() {
  searchCache.clear();
  return { success: true, message: 'Search cache cleared' };
}

/**
 * Get cache statistics
 */
export function getCacheStats() {
  const entries = Array.from(searchCache.entries()).map(([query, data]) => ({
    query,
    age: Math.floor((Date.now() - data.timestamp) / 1000),
    results: data.results.count || 0,
  }));
  
  return {
    size: searchCache.size,
    maxSize: 100,
    ttl: CACHE_TTL / 1000, // in seconds
    entries: entries.slice(0, 10), // Show first 10
  };
}
