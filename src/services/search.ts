import axios from 'axios';

export class SearchService {
  private apiKey: string;

  constructor() {
    this.apiKey = process.env.TAVILY_API_KEY || '';
  }

  public async executeSearch(query: string): Promise<string> {
    if (!this.apiKey) {
      console.error('[Search Service] Tavily API key is missing in configuration.');
      return "Search optimization skipped: API credentials missing on the backend engine.";
    }

    try {
      const response = await axios.post('https://api.tavily.com/search', {
        api_key: this.apiKey,
        query: query,
        search_depth: "basic",
        include_answer: false,
        max_results: 3
      });

      const results = response.data.results;
      if (!results || results.length === 0) {
        return "Search pipeline executed successfully, but zero context indexes were matching.";
      }

      const formattedSnippets = results.map((res: any) => `[Source: ${res.title}] ${res.content}`).join(' | ');
      return formattedSnippets;

    } catch (error: any) {
      console.error('[Search Utility Error] High-performance pipeline execution failed:', error?.response?.data || error.message);
      return "Unable to resolve query due to remote data connectivity layer failures.";
    }
  }
}