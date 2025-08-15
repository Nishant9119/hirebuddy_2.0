class URLShortenerService {
  private static instance: URLShortenerService;

  private constructor() {}

  public static getInstance(): URLShortenerService {
    if (!URLShortenerService.instance) {
      URLShortenerService.instance = new URLShortenerService();
    }
    return URLShortenerService.instance;
  }

  /**
   * Creates a shortened URL using TinyURL API
   * @param longUrl - The original URL to shorten
   * @returns Promise<string> - The shortened URL
   */
  async shortenURL(longUrl: string): Promise<string> {
    try {
      console.log('Shortening URL:', longUrl);
      
      // Use TinyURL API for URL shortening
      const response = await fetch(`https://tinyurl.com/api-create.php?url=${encodeURIComponent(longUrl)}`, {
        method: 'GET',
        headers: {
          'Accept': 'text/plain',
        },
        // Add timeout to prevent hanging
        signal: AbortSignal.timeout(10000) // 10 second timeout
      });
      
      if (!response.ok) {
        throw new Error(`Failed to shorten URL: ${response.status} ${response.statusText}`);
      }
      
      const shortUrl = await response.text();
      
      // Validate that we got a proper URL back
      if (!shortUrl.startsWith('http')) {
        throw new Error('Invalid shortened URL received');
      }
      
      console.log('Successfully shortened URL to:', shortUrl);
      return shortUrl;
    } catch (error) {
      console.error('Error shortening URL:', error);
      
      // Fallback: return the original URL if shortening fails
      console.log('Using original URL as fallback');
      return longUrl;
    }
  }

  /**
   * Creates a professional resume link format
   * @param resumeUrl - The original resume URL
   * @returns Promise<string> - Formatted resume link text
   */
  async createResumeLink(resumeUrl: string): Promise<string> {
    try {
      console.log('Creating professional resume link for:', resumeUrl);
      const shortUrl = await this.shortenURL(resumeUrl);
      console.log('Shortened URL:', shortUrl);
      return `Here is my Resume = ${shortUrl}`;
    } catch (error) {
      console.error('Error creating resume link:', error);
      // Fallback to original format
      return `Here is my Resume = ${resumeUrl}`;
    }
  }
}

export default URLShortenerService.getInstance();
