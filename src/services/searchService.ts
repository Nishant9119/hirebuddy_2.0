// Enhanced Search Service for improved job search and filtering
import { Job, JobSearchParams, JobFilters } from '@/types/job';
import { LocationService } from './locationService';

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

export interface SearchResult {
  jobs: Job[];
  total: number;
  suggestions?: string[];
}

export class SearchService {
  // Search jobs with enhanced algorithm
  static async searchJobs(jobs: Job[], params: EnhancedSearchParams): Promise<SearchResult> {
    let filteredJobs = [...jobs];

    // Apply filters first
    if (params.filters) {
      filteredJobs = this.applyFilters(filteredJobs, params.filters);
    }

    // Apply text search
    if (params.query) {
      filteredJobs = this.applyTextSearch(filteredJobs, params.query, params.fuzzySearch);
    }

    // Calculate relevance scores
    const jobsWithScores = this.calculateRelevanceScores(filteredJobs, params);

    // Sort by relevance and other criteria
    const searchResults = jobsWithScores.sort((a, b) => b.score - a.score);

    // Apply sorting if specified
    if (params.sortBy && params.sortOrder) {
      this.applySorting(searchResults, params.sortBy, params.sortOrder);
    }

    // Apply pagination
    const paginatedResults = this.applyPagination(searchResults, params.limit, params.offset);

    return {
      jobs: paginatedResults.map(job => job.job),
      total: searchResults.length
    };
  }

  // Apply filters to jobs
  private static applyFilters(jobs: Job[], filters: Partial<JobFilters>): Job[] {
    return jobs.filter(job => {
      // Location filter with enhanced matching
      if (filters.location && filters.location.trim()) {
        const jobLocation = job.location || '';
        const normalizedFilterLocation = LocationService.normalizeLocation(filters.location);
        const jobLocationVariations = LocationService.getLocationVariations(jobLocation);
        const filterLocationVariations = LocationService.getLocationVariations(normalizedFilterLocation);
        
        const locationMatch = jobLocationVariations.some(jobLoc => 
          filterLocationVariations.some(filterLoc => 
            jobLoc.toLowerCase().includes(filterLoc.toLowerCase()) ||
            filterLoc.toLowerCase().includes(jobLoc.toLowerCase())
          )
        );
        
        if (!locationMatch) return false;
      }

      // Experience filter
      if (filters.experience && filters.experience !== 'any') {
        const jobExperience = this.extractExperienceLevel(job.description || '');
        if (!this.matchesExperienceFilter(jobExperience, filters.experience)) {
          return false;
        }
      }

      // Remote filter
      if (filters.remote && filters.remote !== 'all') {
        const isRemote = job.isRemote || job.isProbablyRemote || false;
        if (filters.remote === 'remote' && !isRemote) return false;
        if (filters.remote === 'onsite' && isRemote) return false;
      }

      // Company filter
      if (filters.company && filters.company.trim()) {
        const companyName = job.company || '';
        if (!companyName.toLowerCase().includes(filters.company.toLowerCase())) {
          return false;
        }
      }

      return true;
    });
  }

  // Apply text search with enhanced matching
  private static applyTextSearch(jobs: Job[], query: string, fuzzySearch: boolean = true): Job[] {
    if (!query.trim()) return jobs;

    const queryLower = query.toLowerCase();
    const searchTerms = queryLower.split(/\s+/).filter(term => term.length > 0);

    return jobs.filter(job => {
      const searchableText = [
        job.title || '',
        job.company || '',
        job.description || '',
        job.location || '',
        job.tags?.join(' ') || ''
      ].join(' ').toLowerCase();

      // Check for exact matches first
      if (searchableText.includes(queryLower)) {
        return true;
      }

      // Check for partial matches
      const hasPartialMatch = searchTerms.some(term => {
        if (term.length < 2) return false;
        return searchableText.includes(term);
      });

      if (hasPartialMatch) {
        return true;
      }

      // Fuzzy search for typos and similar terms
      if (fuzzySearch) {
        const hasFuzzyMatch = searchTerms.some(term => {
          if (term.length < 3) return false;
          
          // Check each searchable field for fuzzy matches
          const fields = [job.title, job.company, job.location];
          return fields.some(field => {
            if (!field) return false;
            const fieldLower = field.toLowerCase();
            const words = fieldLower.split(/\s+/);
            
            return words.some(word => {
              if (word.length < 3) return false;
              const similarity = this.calculateSimilarity(word, term);
              return similarity > 0.7; // 70% similarity threshold
            });
          });
        });

        if (hasFuzzyMatch) {
          return true;
        }
      }

      return false;
    });
  }

  // Calculate relevance scores for jobs
  private static calculateRelevanceScores(jobs: Job[], params: EnhancedSearchParams): Array<{ job: Job; score: number }> {
    return jobs.map(job => {
      let score = 0;

      // Base score for recent jobs
      if (params.boostRecent) {
        const daysSincePosted = this.getDaysSincePosted(job.createdAt);
        if (daysSincePosted <= 7) score += 50;
        else if (daysSincePosted <= 30) score += 30;
        else if (daysSincePosted <= 90) score += 10;
      }

      // Boost for remote jobs if user prefers remote
      if (params.boostRemote && params.filters?.remote === 'remote') {
        if (job.isRemote || job.isProbablyRemote) {
          score += 30;
        }
      }

      // Boost for experience match
      if (params.boostExperience && params.filters?.experience && params.filters.experience !== 'any') {
        const jobExperience = this.extractExperienceLevel(job.description || '');
        if (this.matchesExperienceFilter(jobExperience, params.filters.experience)) {
          score += 25;
        }
      }

      // Boost for popular companies
      if (this.isPopularCompany(job.company || '')) {
        score += 15;
      }

      // Text relevance boost
      if (params.query) {
        const queryLower = params.query.toLowerCase();
        const searchableText = [
          job.title || '',
          job.company || '',
          job.description || '',
          job.location || ''
        ].join(' ').toLowerCase();

        // Exact match gets high score
        if (searchableText.includes(queryLower)) {
          score += 100;
        }

        // Partial matches get medium score
        const searchTerms = queryLower.split(/\s+/);
        const partialMatches = searchTerms.filter(term => 
          term.length > 1 && searchableText.includes(term)
        ).length;
        score += partialMatches * 20;

        // Title match gets extra boost
        if (job.title && job.title.toLowerCase().includes(queryLower)) {
          score += 50;
        }

        // Company match gets extra boost
        if (job.company && job.company.toLowerCase().includes(queryLower)) {
          score += 40;
        }
      }

      return { job, score };
    });
  }

  // Apply sorting
  private static applySorting(jobsWithScores: Array<{ job: Job; score: number }>, sortBy: string, sortOrder: string) {
    jobsWithScores.sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case 'created_at':
          const dateA = new Date(a.job.createdAt || '').getTime();
          const dateB = new Date(b.job.createdAt || '').getTime();
          comparison = dateA - dateB;
          break;
        case 'job_title':
          comparison = (a.job.title || '').localeCompare(b.job.title || '');
          break;
        case 'company_name':
          comparison = (a.job.company || '').localeCompare(b.job.company || '');
          break;
        default:
          comparison = b.score - a.score; // Default to relevance score
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });
  }

  // Apply pagination
  private static applyPagination(jobsWithScores: Array<{ job: Job; score: number }>, limit?: number, offset?: number): Array<{ job: Job; score: number }> {
    if (!limit) return jobsWithScores;
    
    const start = offset || 0;
    const end = start + limit;
    return jobsWithScores.slice(start, end);
  }

  // Extract experience level from job description
  private static extractExperienceLevel(description: string): string {
    const desc = description.toLowerCase();
    
    if (desc.includes('intern') || desc.includes('internship') || desc.includes('student')) {
      return 'intern';
    }
    if (desc.includes('entry') || desc.includes('junior') || desc.includes('0-2') || desc.includes('1-2')) {
      return 'entry';
    }
    if (desc.includes('mid') || desc.includes('intermediate') || desc.includes('2-5') || desc.includes('3-5')) {
      return 'mid';
    }
    if (desc.includes('senior') || desc.includes('5+') || desc.includes('6+') || desc.includes('7+')) {
      return 'senior';
    }
    if (desc.includes('lead') || desc.includes('principal') || desc.includes('manager') || desc.includes('architect')) {
      return 'lead';
    }
    
    return 'any';
  }

  // Check if experience level matches filter
  private static matchesExperienceFilter(jobExperience: string, filterExperience: string): boolean {
    if (filterExperience === 'any') return true;
    return jobExperience === filterExperience;
  }

  // Get days since job was posted
  private static getDaysSincePosted(createdAt: string | Date): number {
    const created = new Date(createdAt);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - created.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  // Check if company is popular
  private static isPopularCompany(company: string): boolean {
    const popularCompanies = [
      'google', 'microsoft', 'amazon', 'apple', 'meta', 'facebook',
      'netflix', 'uber', 'airbnb', 'twitter', 'linkedin', 'salesforce',
      'oracle', 'ibm', 'intel', 'adobe', 'cisco', 'vmware', 'nvidia',
      'tcs', 'infosys', 'wipro', 'hcl', 'tech mahindra', 'cognizant',
      'accenture', 'capgemini', 'deloitte', 'ey', 'pwc', 'kpmg'
    ];
    
    return popularCompanies.some(popular => 
      company.toLowerCase().includes(popular)
    );
  }

  // Calculate similarity between two strings
  private static calculateSimilarity(str1: string, str2: string): number {
    if (str1 === str2) return 1.0;
    if (str1.length === 0) return 0.0;
    if (str2.length === 0) return 0.0;

    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;

    if (longer.length === 0) return 1.0;

    const editDistance = this.levenshteinDistance(longer, shorter);
    return (longer.length - editDistance) / longer.length;
  }

  // Levenshtein distance calculation
  private static levenshteinDistance(str1: string, str2: string): number {
    const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));

    for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
    for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;

    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1, // deletion
          matrix[j - 1][i] + 1, // insertion
          matrix[j - 1][i - 1] + indicator // substitution
        );
      }
    }

    return matrix[str2.length][str1.length];
  }

  // Get search suggestions based on jobs data
  static async getSearchSuggestions(jobs: Job[], query: string, limit: number = 8): Promise<string[]> {
    if (!query || query.trim().length < 2) {
      return this.getPopularSearchTerms(jobs, limit);
    }

    const queryLower = query.toLowerCase();
    const suggestions = new Set<string>();

    // Extract suggestions from job titles, companies, and skills
    jobs.forEach(job => {
      // Job title suggestions
      if (job.title) {
        const titleWords = job.title.toLowerCase().split(/\s+/);
        titleWords.forEach(word => {
          if (word.length >= 3 && word.includes(queryLower) && suggestions.size < limit) {
            suggestions.add(word.charAt(0).toUpperCase() + word.slice(1));
          }
        });
      }

      // Company suggestions
      if (job.company && job.company.toLowerCase().includes(queryLower)) {
        suggestions.add(job.company);
      }

      // Skills from description
      if (job.description) {
        const skills = this.extractSkillsFromDescription(job.description);
        skills.forEach(skill => {
          if (skill.toLowerCase().includes(queryLower) && suggestions.size < limit) {
            suggestions.add(skill);
          }
        });
      }
    });

    // Add location suggestions
    const locationSuggestions = LocationService.searchLocations(query, 3);
    locationSuggestions.forEach(location => {
      if (suggestions.size < limit) {
        suggestions.add(location);
      }
    });

    return Array.from(suggestions).slice(0, limit);
  }

  // Extract skills from job description
  private static extractSkillsFromDescription(description: string): string[] {
    const skills = [
      'JavaScript', 'TypeScript', 'React', 'Angular', 'Vue', 'Node.js', 'Python', 'Java', 'C++', 'C#',
      'Go', 'Rust', 'PHP', 'Ruby', 'Swift', 'Kotlin', 'Scala', 'R', 'MATLAB', 'SQL',
      'MongoDB', 'PostgreSQL', 'MySQL', 'Redis', 'Docker', 'Kubernetes', 'AWS', 'Azure', 'GCP',
      'Machine Learning', 'AI', 'Data Science', 'DevOps', 'CI/CD', 'Git', 'REST API', 'GraphQL',
      'Microservices', 'Agile', 'Scrum', 'Kanban', 'UI/UX', 'Frontend', 'Backend', 'Full Stack'
    ];

    const foundSkills: string[] = [];
    const descLower = description.toLowerCase();

    skills.forEach(skill => {
      if (descLower.includes(skill.toLowerCase())) {
        foundSkills.push(skill);
      }
    });

    return foundSkills;
  }

  // Get popular search terms
  private static getPopularSearchTerms(jobs: Job[], limit: number = 8): string[] {
    const terms = new Map<string, number>();

    jobs.forEach(job => {
      // Count job titles
      if (job.title) {
        const titleWords = job.title.toLowerCase().split(/\s+/);
        titleWords.forEach(word => {
          if (word.length >= 3) {
            terms.set(word, (terms.get(word) || 0) + 1);
          }
        });
      }

      // Count companies
      if (job.company) {
        terms.set(job.company.toLowerCase(), (terms.get(job.company.toLowerCase()) || 0) + 1);
      }
    });

    // Sort by frequency and return top terms
    return Array.from(terms.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([term]) => term.charAt(0).toUpperCase() + term.slice(1));
  }

  // Get trending search terms
  static async getTrendingSearchTerms(jobs: Job[]): Promise<string[]> {
    const recentJobs = jobs.filter(job => {
      const daysSincePosted = this.getDaysSincePosted(job.createdAt || '');
      return daysSincePosted <= 30; // Last 30 days
    });

    return this.getPopularSearchTerms(recentJobs, 5);
  }
}
