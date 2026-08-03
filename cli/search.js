/**
 * Web search using DuckDuckGo Instant Answer API
 * No API key required
 * 
 * Note: This API works best for well-known topics, CVEs, and technical terms.
 * For comprehensive web search, consider configuring a search API key.
 */

export async function webSearch(query, maxResults = 5) {
  try {
    const url = `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`;
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });

    if (!response.ok) {
      return { error: `Search failed with status ${response.status}` };
    }

    const data = await response.json();
    const results = [];
    
    // Abstract (main answer)
    if (data.Abstract && data.AbstractURL) {
      results.push({
        title: data.Heading || 'Summary',
        url: data.AbstractURL,
        snippet: data.Abstract || '',
      });
    }
    
    // Related topics
    if (data.RelatedTopics && Array.isArray(data.RelatedTopics)) {
      for (const topic of data.RelatedTopics) {
        if (results.length >= maxResults) break;
        
        if (topic.FirstURL && topic.Text) {
          results.push({
            title: topic.Text.split(' - ')[0] || topic.Text.substring(0, 60),
            url: topic.FirstURL,
            snippet: topic.Text,
          });
        }
      }
    }
    
    // Definition
    if (data.Definition && data.DefinitionURL && results.length < maxResults) {
      results.push({
        title: 'Definition',
        url: data.DefinitionURL,
        snippet: data.Definition,
      });
    }
    
    // Results array
    if (data.Results && Array.isArray(data.Results)) {
      for (const result of data.Results) {
        if (results.length >= maxResults) break;
        if (result.FirstURL && result.Text) {
          results.push({
            title: result.Text.split(' - ')[0] || result.Text.substring(0, 60),
            url: result.FirstURL,
            snippet: result.Text,
          });
        }
      }
    }
    
    if (results.length === 0) {
      return { query, results: [], message: 'No results found. Try a more specific query or well-known topic.' };
    }

    return { query, results };
  } catch (err) {
    return { error: `Search error: ${err.message}` };
  }
}

/**
 * Format search results for display
 */
export function formatSearchResults(searchResult) {
  if (searchResult.error) {
    return `Search error: ${searchResult.error}`;
  }
  
  if (!searchResult.results || searchResult.results.length === 0) {
    return searchResult.message || `No results found for: ${searchResult.query}`;
  }
  
  let output = `Search results for: "${searchResult.query}"\n\n`;
  
  searchResult.results.forEach((r, i) => {
    output += `${i + 1}. ${r.title}\n`;
    output += `   ${r.url}\n`;
    if (r.snippet) {
      output += `   ${r.snippet}\n`;
    }
    output += '\n';
  });
  
  return output;
}
