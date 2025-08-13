// Enhanced Search Service for improved job search and filtering
import { Job, JobSearchParams, JobFilters } from '@/types/job';
import { LocationService } from './locationService';

export interface SearchResult {
  job: Job;
  relevanceScore: number;
  matchReasons: string[];
}

export interface EnhancedSearchParams extends JobSearchParams {
  boostRecent?: boolean;
  boostRemote?: boolean;
  boostExperience?: boolean;
  fuzzySearch?: boolean;
  locationRadius?: number;
  query?: string;
  filters?: Partial<JobFilters>;
  sortBy?: 'created_at' | 'job_title' | 'company_name';
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

export class SearchService {
  /**
   * Enhanced job search with improved algorithms
   */
  static async searchJobs(
    jobs: Job[],
    params: EnhancedSearchParams
  ): Promise<{ jobs: Job[]; total: number; results: SearchResult[] }> {
    try {
      let filteredJobs = [...jobs];

      // Apply filters first
      filteredJobs = this.applyFilters(filteredJobs, params.filters);

      // Apply text search
      if (params.query) {
        filteredJobs = this.applyTextSearch(filteredJobs, params.query, params.fuzzySearch);
      }

      // Calculate relevance scores and rank results
      const searchResults = this.calculateRelevanceScores(filteredJobs, params);

      // Sort by relevance score
      searchResults.sort((a, b) => b.relevanceScore - a.relevanceScore);

      // Apply sorting if specified
      if (params.sortBy && params.sortOrder) {
        this.applySorting(searchResults, params.sortBy, params.sortOrder);
      }

      // Apply pagination
      const paginatedResults = this.applyPagination(searchResults, params.limit, params.offset);

      return {
        jobs: paginatedResults.map(result => result.job),
        total: searchResults.length,
        results: paginatedResults
      };
    } catch (error) {
      console.error('Error in enhanced job search:', error);
      return { jobs: [], total: 0, results: [] };
    }
  }

  /**
   * Apply filters to jobs
   */
  private static applyFilters(jobs: Job[], filters?: Partial<JobFilters>): Job[] {
    if (!filters) return jobs;

    return jobs.filter(job => {
      // Location filter with normalization
      if (filters.location && filters.location.trim()) {
        const normalizedFilterLocation = LocationService.normalizeLocation(filters.location);
        const normalizedJobLocation = LocationService.normalizeLocation(job.location);
        
        if (!normalizedJobLocation.toLowerCase().includes(normalizedFilterLocation.toLowerCase())) {
          return false;
        }
      }

      // Experience filter
      if (filters.experience && filters.experience !== 'any') {
        const jobExperience = this.extractExperienceLevel(job.description);
        if (!this.matchesExperienceFilter(jobExperience, filters.experience)) {
          return false;
        }
      }

      // Remote filter
      if (filters.remote && filters.remote !== 'all') {
        if (filters.remote === 'remote' && !job.isRemote && !job.isProbablyRemote) {
          return false;
        }
        if (filters.remote === 'onsite' && (job.isRemote || job.isProbablyRemote)) {
          return false;
        }
      }

      // Company filter
      if (filters.company && filters.company.trim()) {
        if (!job.company.toLowerCase().includes(filters.company.toLowerCase())) {
          return false;
        }
      }

      return true;
    });
  }

  /**
   * Apply enhanced text search
   */
  private static applyTextSearch(jobs: Job[], query: string, fuzzySearch: boolean = true): Job[] {
    if (!query.trim()) return jobs;

    const searchTerms = query.toLowerCase().split(/\s+/).filter(term => term.length > 0);
    
    return jobs.filter(job => {
      const searchableText = [
        job.title,
        job.company,
        job.location,
        job.description,
        ...job.tags
      ].join(' ').toLowerCase();

      // Check if all search terms are found
      return searchTerms.every(term => {
        if (fuzzySearch) {
          return this.fuzzyMatch(searchableText, term);
        } else {
          return searchableText.includes(term);
        }
      });
    });
  }

  /**
   * Fuzzy string matching using Levenshtein distance
   */
  private static fuzzyMatch(text: string, query: string): boolean {
    if (text.includes(query)) return true;
    
    const words = text.split(/\s+/);
    return words.some(word => {
      const similarity = this.calculateSimilarity(query, word);
      return similarity > 0.7; // 70% similarity threshold
    });
  }

  /**
   * Calculate similarity between two strings
   */
  private static calculateSimilarity(str1: string, str2: string): number {
    const matrix = [];
    
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }
    
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }
    
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    
    const maxLength = Math.max(str1.length, str2.length);
    return 1 - (matrix[str2.length][str1.length] / maxLength);
  }

  /**
   * Calculate relevance scores for jobs
   */
  private static calculateRelevanceScores(
    jobs: Job[],
    params: EnhancedSearchParams
  ): SearchResult[] {
    return jobs.map(job => {
      let score = 50; // Base score
      const matchReasons: string[] = [];

      // Boost for recent jobs
      if (params.boostRecent) {
        const daysSincePosted = this.getDaysSincePosted(job.createdAt);
        if (daysSincePosted <= 7) {
          score += 20;
          matchReasons.push('Recently posted');
        } else if (daysSincePosted <= 30) {
          score += 10;
          matchReasons.push('Posted this month');
        }
      }

      // Boost for remote jobs if user prefers remote
      if (params.boostRemote && (job.isRemote || job.isProbablyRemote)) {
        score += 15;
        matchReasons.push('Remote opportunity');
      }

      // Boost for experience match
      if (params.boostExperience && params.filters?.experience && params.filters.experience !== 'any') {
        const jobExperience = this.extractExperienceLevel(job.description);
        if (this.matchesExperienceFilter(jobExperience, params.filters.experience)) {
          score += 15;
          matchReasons.push('Experience level match');
        }
      }

      // Boost for exact title matches
      if (params.query) {
        const queryLower = params.query.toLowerCase();
        if (job.title.toLowerCase().includes(queryLower)) {
          score += 25;
          matchReasons.push('Title match');
        }
        
        if (job.company.toLowerCase().includes(queryLower)) {
          score += 15;
          matchReasons.push('Company match');
        }
      }

      // Boost for location match
      if (params.filters?.location) {
        const normalizedFilterLocation = LocationService.normalizeLocation(params.filters.location);
        const normalizedJobLocation = LocationService.normalizeLocation(job.location);
        
        if (normalizedJobLocation.toLowerCase() === normalizedFilterLocation.toLowerCase()) {
          score += 20;
          matchReasons.push('Exact location match');
        } else if (normalizedJobLocation.toLowerCase().includes(normalizedFilterLocation.toLowerCase())) {
          score += 10;
          matchReasons.push('Location match');
        }
      }

      // Boost for popular companies (you can maintain a list of popular companies)
      if (this.isPopularCompany(job.company)) {
        score += 10;
        matchReasons.push('Popular company');
      }

      return {
        job,
        relevanceScore: Math.min(score, 100), // Cap at 100
        matchReasons
      };
    });
  }

  /**
   * Apply sorting to search results
   */
  private static applySorting(
    results: SearchResult[],
    sortBy: string,
    sortOrder: 'asc' | 'desc'
  ): void {
    results.sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'created_at':
          comparison = new Date(a.job.createdAt).getTime() - new Date(b.job.createdAt).getTime();
          break;
        case 'job_title':
          comparison = a.job.title.localeCompare(b.job.title);
          break;
        case 'company_name':
          comparison = a.job.company.localeCompare(b.job.company);
          break;
        default:
          comparison = b.relevanceScore - a.relevanceScore; // Default to relevance
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });
  }

  /**
   * Apply pagination
   */
  private static applyPagination(
    results: SearchResult[],
    limit?: number,
    offset?: number
  ): SearchResult[] {
    const start = offset || 0;
    const end = limit ? start + limit : results.length;
    return results.slice(start, end);
  }

  /**
   * Extract experience level from job description
   */
  private static extractExperienceLevel(description: string): string {
    const exp = description.toLowerCase();
    
    if (exp.includes('fresher') || exp.includes('entry level') || exp.includes('0-1 years')) {
      return 'entry';
    } else if (exp.includes('1-3 years') || exp.includes('2-4 years')) {
      return 'mid';
    } else if (exp.includes('3-5 years') || exp.includes('4-6 years')) {
      return 'senior';
    } else if (exp.includes('5+ years') || exp.includes('6+ years') || exp.includes('senior')) {
      return 'senior';
    } else if (exp.includes('lead') || exp.includes('manager') || exp.includes('architect')) {
      return 'lead';
    }
    
    return 'mid'; // Default
  }

  /**
   * Check if experience level matches filter
   */
  private static matchesExperienceFilter(jobExperience: string, filterExperience: string): boolean {
    const experienceHierarchy = ['entry', 'mid', 'senior', 'lead'];
    const jobIndex = experienceHierarchy.indexOf(jobExperience);
    const filterIndex = experienceHierarchy.indexOf(filterExperience);
    
    if (jobIndex === -1 || filterIndex === -1) return false;
    
    return jobIndex >= filterIndex;
  }

  /**
   * Get days since job was posted
   */
  private static getDaysSincePosted(createdAt: string): number {
    const created = new Date(createdAt);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - created.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  /**
   * Check if company is popular (you can maintain a list or use external API)
   */
  private static isPopularCompany(company: string): boolean {
    const popularCompanies = [
      'google', 'microsoft', 'amazon', 'apple', 'meta', 'facebook',
      'netflix', 'uber', 'airbnb', 'twitter', 'linkedin', 'salesforce',
      'oracle', 'ibm', 'intel', 'cisco', 'adobe', 'paypal', 'stripe',
      'shopify', 'zoom', 'slack', 'dropbox', 'spotify', 'snapchat',
      'tcs', 'infosys', 'wipro', 'hcl', 'tech mahindra', 'cognizant',
      'accenture', 'capgemini', 'mindtree', 'larsen & toubro', 'lt',
      'reliance', 'tata', 'mahindra', 'bharti airtel', 'airtel'
    ];
    
    return popularCompanies.some(popular => 
      company.toLowerCase().includes(popular.toLowerCase())
    );
  }

  /**
   * Get search suggestions based on query
   */
  static getSearchSuggestions(query: string, jobs: Job[]): string[] {
    if (!query || query.length < 2) return [];
    
    const suggestions = new Set<string>();
    const queryLower = query.toLowerCase();
    
    // Add job title suggestions
    jobs.forEach(job => {
      const words = job.title.toLowerCase().split(/\s+/);
      words.forEach(word => {
        if (word.startsWith(queryLower) && word.length > 2) {
          suggestions.add(word);
        }
      });
    });
    
    // Add company suggestions
    jobs.forEach(job => {
      const words = job.company.toLowerCase().split(/\s+/);
      words.forEach(word => {
        if (word.startsWith(queryLower) && word.length > 2) {
          suggestions.add(word);
        }
      });
    });
    
    // Add location suggestions
    const locationSuggestions = LocationService.searchLocations(query, 5);
    locationSuggestions.forEach(location => suggestions.add(location));
    
    return Array.from(suggestions).slice(0, 10);
  }

  /**
   * Get trending search terms
   */
  static getTrendingSearchTerms(jobs: Job[]): string[] {
    const termFrequency = new Map<string, number>();
    
    jobs.forEach(job => {
      const words = [
        ...job.title.toLowerCase().split(/\s+/),
        ...job.company.toLowerCase().split(/\s+/),
        ...job.tags.map(tag => tag.toLowerCase())
      ];
      
      words.forEach(word => {
        if (word.length > 2 && !this.isStopWord(word)) {
          termFrequency.set(word, (termFrequency.get(word) || 0) + 1);
        }
      });
    });
    
    return Array.from(termFrequency.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([term]) => term);
  }

  /**
   * Check if word is a stop word
   */
  private static isStopWord(word: string): boolean {
    const stopWords = [
      'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
      'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
      'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
      'should', 'may', 'might', 'must', 'can', 'this', 'that', 'these', 'those'
    ];
    
    return stopWords.includes(word);
  }
}
