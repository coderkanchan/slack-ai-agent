import axios from 'axios';

export class SearchService {
  
  public async executeSearch(query: string): Promise<string> {
    try {
      const response = await axios.get(`https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
      });

      const html = response.data;
      const matchRegex = /<a class="result__snip"[^>]*>([\s\S]*?)<\/a>/g;
      const snippets: string[] = [];
      let match;

      while ((match = matchRegex.exec(html)) !== null && snippets.length < 3) {
        const cleanText = match[1].replace(/<[^>]*>/g, '').trim();
        if (cleanText) snippets.push(cleanText);
      }

      if (snippets.length === 0) {
        return "Search executed but no clear text snippets were retrieved.";
      }

      return snippets.join(' | ');
    } catch (error) {
      console.error('[Search Utility Error] Failed fetching real-time web context:', error);
      return "Unable to retrieve real-time internet data due to a connectivity exception.";
    }
  }
}