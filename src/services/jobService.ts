import { Job, JobSearchParams } from '../types/job';
import { apiClient, ApiResponse } from '../lib/api';
import { supabase } from '../lib/supabase';

// Define API response types for proper type safety
interface JobsApiResponse {
  jobs: any[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
  };
}

interface JobStatsResponse {
  total: number;
  remote: number;
  thisWeek: number;
  companies: number;
}

export class JobService {
  /**
   * Transform database job to frontend Job type
   */
  private static transformDatabaseJob(dbJob: any): Job {
    const fallbackLogo = this.generateFallbackLogo(dbJob.company_name || 'Unknown Company');
    
    return {
      id: dbJob.job_id,
      title: dbJob.job_title || 'Untitled Position',
      company: dbJob.company_name || 'Unknown Company',
      location: dbJob.job_location || 'Location not specified',
      description: dbJob.job_description || 'No description available',
      isRemote: dbJob.remote_flag || false,
      isProbablyRemote: dbJob.probably_remote || false,
      createdAt: dbJob.created_at,
      posted: this.formatPostedDate(dbJob.created_at),
      logo: fallbackLogo,
      tags: this.generateJobTags(dbJob),
      type: 'Full-time',
      applyLink: dbJob.apply_link,
      experienceRequired: dbJob.experience_required || 'Not specified',
      city: dbJob.city,
      state: dbJob.state
    };
  }

  /**
   * Generate fallback logo for companies
   */
  private static generateFallbackLogo(companyName: string): string {
    const firstLetter = companyName.charAt(0).toUpperCase();
    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F'];
    const colorIndex = companyName.length % colors.length;
    const backgroundColor = colors[colorIndex];
    
    return `data:image/svg+xml,${encodeURIComponent(`
      <svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
        <rect width="40" height="40" fill="${backgroundColor}" rx="8"/>
        <text x="20" y="25" text-anchor="middle" fill="white" font-family="Arial, sans-serif" font-size="16" font-weight="bold">${firstLetter}</text>
      </svg>
    `)}`;
  }

  /**
   * Format posted date
   */
  private static formatPostedDate(dateString: string): string {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffTime = Math.abs(now.getTime() - date.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays === 1) return 'Yesterday';
      if (diffDays <= 7) return `${diffDays} days ago`;
      if (diffDays <= 30) return `${Math.ceil(diffDays / 7)} weeks ago`;
      if (diffDays <= 365) return `${Math.ceil(diffDays / 30)} months ago`;
      return `${Math.floor(diffDays / 365)} years ago`;
    } catch (error) {
      return 'Recently';
    }
  }

  /**
   * Generate job tags based on job data
   */
  private static generateJobTags(job: any): string[] {
    const tags: string[] = [];
    
    if (job.remote_flag) tags.push('Remote');
    if (job.probably_remote) tags.push('Possibly Remote');
    
    // Add experience level tag
    const experience = job.experience_required?.toLowerCase() || '';
    if (experience.includes('intern') || experience.includes('entry') || experience.includes('0-1')) {
      tags.push('Entry Level');
    } else if (experience.includes('senior') || experience.includes('lead') || experience.includes('5+')) {
      tags.push('Senior');
    } else if (experience.includes('junior') || experience.includes('1-3')) {
      tags.push('Junior');
    }
    
    // Add job type tags based on description
    const description = job.job_description?.toLowerCase() || '';
    const title = job.job_title?.toLowerCase() || '';
    
    if (description.includes('urgent') || title.includes('urgent')) {
      tags.push('Urgent');
    }
    
    if (description.includes('full-time') || title.includes('full-time')) {
      tags.push('Full-time');
    }
    
    return tags.slice(0, 3); // Limit to 3 tags
  }

  // Get all jobs with optional search and filtering - NOW USING API
  static async getJobs(params: JobSearchParams = {}): Promise<{ jobs: Job[]; total: number }> {
    try {
      console.log('JobService.getJobs called with params:', params);
      
      // Convert params to API format
      const apiParams: Record<string, string> = {};
      
      if (params.query) apiParams.query = params.query;
      if (params.sortBy) apiParams.sortBy = params.sortBy;
      if (params.sortOrder) apiParams.sortOrder = params.sortOrder;
      if (params.limit) apiParams.limit = params.limit.toString();
      if (params.offset) apiParams.offset = params.offset.toString();
      
      // Add filters as individual params
      if (params.filters) {
        if (params.filters.location) apiParams.location = params.filters.location;
        if (params.filters.experience && params.filters.experience !== 'any') {
          apiParams.experience = params.filters.experience;
        }
        if (params.filters.remote && params.filters.remote !== 'all') {
          apiParams.remote = params.filters.remote;
        }
        if (params.filters.company) apiParams.company = params.filters.company;
      }

      const response = await apiClient.getJobs(apiParams) as ApiResponse<JobsApiResponse>;

      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch jobs');
      }

      console.log(`JobService: Fetched ${response.data?.jobs?.length || 0} jobs out of ${response.data?.pagination?.total || 0} total`);
      
      const jobs = (response.data?.jobs || []).map(job => {
        try {
          return this.transformDatabaseJob(job);
        } catch (transformError) {
          console.error('Error transforming job:', job.job_id, transformError);
          // Return a basic job object if transformation fails
          const fallbackLogo = this.generateFallbackLogo(job.company_name || 'Unknown Company');
          return {
            id: job.job_id,
            title: job.job_title || 'Untitled Position',
            company: job.company_name || 'Unknown Company',
            location: job.job_location || 'Location not specified',
            description: job.job_description || 'No description available',
            isRemote: job.remote_flag || false,
            isProbablyRemote: job.probably_remote || false,
            createdAt: job.created_at,
            posted: 'Recently',
            logo: fallbackLogo,
            tags: ['Job'],
            type: 'Full-time'
          };
        }
      });
      
      return {
        jobs,
        total: response.data?.pagination?.total || 0
      };
    } catch (error) {
      console.error('Error fetching jobs from API:', error);
      // Return mock data as fallback
      return this.getMockJobs(params);
    }
  }

  // Get remote jobs - NOW USING API
  static async getRemoteJobs(params: JobSearchParams = {}): Promise<{ jobs: Job[]; total: number }> {
    try {
      console.log('JobService.getRemoteJobs called with params:', params);
      
      // Convert params to API format
      const apiParams: Record<string, string> = {};
      
      if (params.query) apiParams.query = params.query;
      if (params.sortBy) apiParams.sortBy = params.sortBy;
      if (params.sortOrder) apiParams.sortOrder = params.sortOrder;
      if (params.limit) apiParams.limit = params.limit.toString();
      if (params.offset) apiParams.offset = params.offset.toString();
      
      // Add filters as individual params
      if (params.filters) {
        if (params.filters.location) apiParams.location = params.filters.location;
        if (params.filters.experience && params.filters.experience !== 'any') {
          apiParams.experience = params.filters.experience;
        }
        if (params.filters.company) apiParams.company = params.filters.company;
      }

      const response = await apiClient.getRemoteJobs(apiParams) as ApiResponse<JobsApiResponse>;

      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch remote jobs');
      }

      console.log(`JobService: Fetched ${response.data?.jobs?.length || 0} remote jobs out of ${response.data?.pagination?.total || 0} total`);
      
      const jobs = (response.data?.jobs || []).map(job => {
        try {
          return this.transformDatabaseJob(job);
        } catch (transformError) {
          console.error('Error transforming remote job:', job.job_id, transformError);
          // Return a basic job object if transformation fails
          const fallbackLogo = this.generateFallbackLogo(job.company_name || 'Unknown Company');
          return {
            id: job.job_id,
            title: job.job_title || 'Untitled Position',
            company: job.company_name || 'Unknown Company',
            location: job.job_location || 'Location not specified',
            description: job.job_description || 'No description available',
            isRemote: true,
            isProbablyRemote: job.probably_remote || false,
            createdAt: job.created_at,
            posted: 'Recently',
            logo: fallbackLogo,
            tags: ['Remote'],
            type: 'Full-time'
          };
        }
      });
      
      return {
        jobs,
        total: response.data?.pagination?.total || 0
      };
    } catch (error) {
      console.error('Error fetching remote jobs from API:', error);
      // Return mock data as fallback
      return this.getMockRemoteJobs(params);
    }
  }

  // Get exclusive jobs - NOW USING API
  static async getExclusiveJobs(params: JobSearchParams = {}): Promise<{ jobs: Job[]; total: number }> {
    try {
      console.log('JobService.getExclusiveJobs called with params:', params);
      
      // Convert params to API format
      const apiParams: Record<string, string> = {};
      
      if (params.query) apiParams.query = params.query;
      if (params.sortBy) apiParams.sortBy = params.sortBy;
      if (params.sortOrder) apiParams.sortOrder = params.sortOrder;
      if (params.limit) apiParams.limit = params.limit.toString();
      if (params.offset) apiParams.offset = params.offset.toString();
      
      // Add filters as individual params
      if (params.filters) {
        if (params.filters.location) apiParams.location = params.filters.location;
        if (params.filters.experience && params.filters.experience !== 'any') {
          apiParams.experience = params.filters.experience;
        }
        if (params.filters.remote && params.filters.remote !== 'all') {
          apiParams.remote = params.filters.remote;
        }
        if (params.filters.company) apiParams.company = params.filters.company;
      }

      const response = await apiClient.getExclusiveJobs(apiParams) as ApiResponse<JobsApiResponse>;

      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch exclusive jobs');
      }

      console.log(`JobService: Fetched ${response.data?.jobs?.length || 0} exclusive jobs out of ${response.data?.pagination?.total || 0} total`);
      
      const jobs = (response.data?.jobs || []).map(job => {
        try {
          return this.transformDatabaseJob(job);
        } catch (transformError) {
          console.error('Error transforming exclusive job:', job.job_id, transformError);
          // Return a basic job object if transformation fails
          const fallbackLogo = this.generateFallbackLogo(job.company_name || 'Unknown Company');
          return {
            id: job.job_id,
            title: job.job_title || 'Untitled Position',
            company: job.company_name || 'Unknown Company',
            location: job.job_location || 'Location not specified',
            description: job.job_description || 'No description available',
            isRemote: job.remote_flag || false,
            isProbablyRemote: job.probably_remote || false,
            createdAt: job.created_at,
            posted: 'Recently',
            logo: fallbackLogo,
            tags: ['Exclusive'],
            type: 'Full-time'
          };
        }
      });
      
      return {
        jobs,
        total: response.data?.pagination?.total || 0
      };
    } catch (error) {
      console.error('Error fetching exclusive jobs from API:', error);
      // Return mock data as fallback
      return this.getMockExclusiveJobs(params);
    }
  }

  // Mock exclusive jobs data for testing when database table doesn't exist
  private static getMockExclusiveJobs(params: JobSearchParams = {}): { jobs: Job[]; total: number } {
    const mockJobs: Job[] = [
      {
        id: 'exclusive-1',
        title: 'Senior Full Stack Engineer - Exclusive Opportunity',
        company: 'TechCorp Elite',
        location: 'San Francisco, CA',
        city: 'San Francisco',
        state: 'CA',
        description: 'Join our exclusive team building next-generation AI-powered applications. This is a limited-time exclusive opportunity with exceptional benefits and equity package. Work with cutting-edge technologies including React, Node.js, and AI/ML frameworks.',
        experienceRequired: 'Senior Level (5+ years)',
        applyLink: 'https://example.com/apply/exclusive-1',
        isRemote: true,
        isProbablyRemote: true,
        createdAt: new Date().toISOString(),
        posted: '2 days ago',
        logo: 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=60&h=60&fit=crop&crop=center',
        tags: ['Exclusive', 'Senior Level', 'Remote', 'React', 'Node.js'],
        type: 'Full-time'
      },
      {
        id: 'exclusive-2',
        title: 'Principal Software Architect - Premium Role',
        company: 'Innovation Labs',
        location: 'New York, NY',
        city: 'New York',
        state: 'NY',
        description: 'Lead architectural decisions for our cutting-edge platform. Exclusive position with direct reporting to CTO and significant equity stake. Shape the future of our technology stack and mentor senior engineers.',
        experienceRequired: 'Principal Level (8+ years)',
        applyLink: 'https://example.com/apply/exclusive-2',
        isRemote: false,
        isProbablyRemote: false,
        createdAt: new Date().toISOString(),
        posted: '1 day ago',
        logo: 'https://images.unsplash.com/photo-1551650975-87deedd944c3?w=60&h=60&fit=crop&crop=center',
        tags: ['Exclusive', 'Principal Level', 'Architecture', 'Leadership'],
        type: 'Full-time'
      },
      {
        id: 'exclusive-3',
        title: 'VP of Engineering - Executive Opportunity',
        company: 'StartupX',
        location: 'Remote',
        city: 'Remote',
        state: 'Remote',
        description: 'Shape the future of our engineering organization. This exclusive executive role offers substantial equity and the opportunity to build a world-class team from the ground up.',
        experienceRequired: 'Executive Level (10+ years)',
        applyLink: 'https://example.com/apply/exclusive-3',
        isRemote: true,
        isProbablyRemote: true,
        createdAt: new Date().toISOString(),
        posted: '3 days ago',
        logo: 'https://images.unsplash.com/photo-1551434678-e076c223a692?w=60&h=60&fit=crop&crop=center',
        tags: ['Exclusive', 'Executive Level', 'Remote', 'Leadership', 'Management'],
        type: 'Full-time'
      },
      {
        id: 'exclusive-4',
        title: 'Lead Frontend Developer - Premium Position',
        company: 'DesignFirst',
        location: 'Austin, TX',
        city: 'Austin',
        state: 'TX',
        description: 'Lead our frontend engineering efforts with the latest technologies. Exclusive opportunity with flexible work arrangements and top-tier compensation. Work with React, TypeScript, and modern design systems.',
        experienceRequired: 'Lead Level (6+ years)',
        applyLink: 'https://example.com/apply/exclusive-4',
        isRemote: true,
        isProbablyRemote: true,
        createdAt: new Date().toISOString(),
        posted: '4 days ago',
        logo: 'https://images.unsplash.com/photo-1573164713714-d95e436ab8d6?w=60&h=60&fit=crop&crop=center',
        tags: ['Exclusive', 'Lead Level', 'Remote', 'React', 'TypeScript'],
        type: 'Full-time'
      },
      {
        id: 'exclusive-5',
        title: 'Senior Data Scientist - AI Division',
        company: 'DataCorp',
        location: 'Seattle, WA',
        city: 'Seattle',
        state: 'WA',
        description: 'Drive AI innovation in our exclusive data science division. Work with cutting-edge ML technologies and shape product direction. Opportunity to work on large-scale data problems with real-world impact.',
        experienceRequired: 'Senior Level (4+ years)',
        applyLink: 'https://example.com/apply/exclusive-5',
        isRemote: true,
        isProbablyRemote: true,
        createdAt: new Date().toISOString(),
        posted: '1 week ago',
        logo: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=60&h=60&fit=crop&crop=center',
        tags: ['Exclusive', 'Senior Level', 'Remote', 'Python', 'AI/ML'],
        type: 'Full-time'
      }
    ];

    // Apply basic filtering for mock data
    let filteredJobs = [...mockJobs];

    if (params.query) {
      const query = params.query.toLowerCase();
      filteredJobs = filteredJobs.filter(job => 
        job.title.toLowerCase().includes(query) ||
        job.company.toLowerCase().includes(query) ||
        job.description.toLowerCase().includes(query)
      );
    }

    if (params.filters) {
      const { location, experience, remote, company } = params.filters;
      
      if (location) {
        const loc = location.toLowerCase();
        filteredJobs = filteredJobs.filter(job => 
          job.location.toLowerCase().includes(loc) ||
          (job.city && job.city.toLowerCase().includes(loc)) ||
          (job.state && job.state.toLowerCase().includes(loc))
        );
      }
      
      if (experience && experience !== 'any') {
        filteredJobs = filteredJobs.filter(job => 
          job.experienceRequired?.toLowerCase().includes(experience.toLowerCase())
        );
      }
      
      if (remote === 'remote') {
        filteredJobs = filteredJobs.filter(job => job.isRemote);
      } else if (remote === 'onsite') {
        filteredJobs = filteredJobs.filter(job => !job.isRemote);
      }
      
      if (company) {
        filteredJobs = filteredJobs.filter(job => 
          job.company.toLowerCase().includes(company.toLowerCase())
        );
      }
    }

    // Apply pagination
    const limit = params.limit || 50;
    const offset = params.offset || 0;
    const paginatedJobs = filteredJobs.slice(offset, offset + limit);

    return {
      jobs: paginatedJobs,
      total: filteredJobs.length
    };
  }

  // Get a single job by ID
  static async getJobById(jobId: string): Promise<Job | null> {
    try {
      const response = await apiClient.getJobById(jobId);

      if (!response.success) {
        if (response.error === 'Job not found') {
          return null; // Job not found
        }
        throw new Error(response.error || 'Failed to fetch job by ID');
      }

      return this.transformDatabaseJob(response.data);
    } catch (error) {
      console.error('Error fetching job by ID:', error);
      throw error;
    }
  }

  // Create a new job
  static async createJob(jobData: any): Promise<Job> {
    try {
      const response = await apiClient.createJob(jobData);

      if (!response.success) {
        throw new Error(response.error || 'Failed to create job');
      }

      return this.transformDatabaseJob(response.data);
    } catch (error) {
      console.error('Error creating job:', error);
      throw error;
    }
  }

  // Update an existing job
  static async updateJob(updateData: any): Promise<Job> {
    try {
      const response = await apiClient.updateJob(updateData);

      if (!response.success) {
        throw new Error(response.error || 'Failed to update job');
      }

      return this.transformDatabaseJob(response.data);
    } catch (error) {
      console.error('Error updating job:', error);
      throw error;
    }
  }

  // Delete a job
  static async deleteJob(jobId: string): Promise<void> {
    try {
      const response = await apiClient.deleteJob(jobId);

      if (!response.success) {
        throw new Error(response.error || 'Failed to delete job');
      }
    } catch (error) {
      console.error('Error deleting job:', error);
      throw error;
    }
  }

  // Get jobs count by various criteria
  static async getJobsStats(): Promise<{
    total: number;
    remote: number;
    thisWeek: number;
    companies: number;
  }> {
    try {
      // Try API first, fallback to direct database query
      const response = await apiClient.getJobsStats() as ApiResponse<JobStatsResponse>;

      if (response.success && response.data) {
        return response.data;
      }
    } catch (error) {
      console.warn('API stats failed, falling back to direct database query:', error);
    }

    // Fallback to direct database queries against hirebuddy_job_board
    try {
      // Get total jobs count
      const { count: totalCount, error: totalError } = await supabase
        .from('hirebuddy_job_board')
        .select('*', { count: 'exact', head: true });

      if (totalError) {
        console.error('Error getting total jobs count:', totalError);
      }

      // Get remote jobs count (remote_flag = true OR probably_remote = true)
      const { count: remoteCount, error: remoteError } = await supabase
        .from('hirebuddy_job_board')
        .select('*', { count: 'exact', head: true })
        .or('remote_flag.eq.true,probably_remote.eq.true');

      if (remoteError) {
        console.error('Error getting remote jobs count:', remoteError);
      }

      // Get unique companies count (client-side distinct)
      const { data: companiesData, error: companiesError } = await supabase
        .from('hirebuddy_job_board')
        .select('company_name')
        .not('company_name', 'is', null);

      let companiesCount = 0;
      if (!companiesError && companiesData) {
        const uniqueCompanies = new Set((companiesData as { company_name: string }[]).map(item => item.company_name));
        companiesCount = uniqueCompanies.size;
      } else if (companiesError) {
        console.error('Error getting companies:', companiesError);
      }

      // Get jobs created in the last 7 days
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      const oneWeekAgoDateOnly = oneWeekAgo.toISOString().slice(0, 10); // YYYY-MM-DD for date column

      const { count: thisWeekCount, error: weekError } = await supabase
        .from('hirebuddy_job_board')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', oneWeekAgoDateOnly);

      if (weekError) {
        console.error('Error getting this week jobs count:', weekError);
      }

      const stats = {
        total: totalCount || 0,
        remote: remoteCount || 0,
        thisWeek: thisWeekCount || 0,
        companies: companiesCount
      };

      console.log('Direct database stats (hirebuddy_job_board):', stats);
      return stats;
    } catch (dbError) {
      console.error('Error fetching job stats from database:', dbError);
      return { total: 0, remote: 0, thisWeek: 0, companies: 0 };
    }
  }

  // Search for companies (for autocomplete)
  static async searchCompanies(query: string, limit: number = 10): Promise<string[]> {
    try {
      const response = await apiClient.searchCompanies(query, limit);

      if (!response.success) {
        throw new Error(response.error || 'Failed to search companies');
      }

      return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      console.error('Error searching companies:', error);
      return [];
    }
  }

  // Search for locations (for autocomplete)
  static async searchLocations(query: string, limit: number = 10): Promise<string[]> {
    try {
      const response = await apiClient.searchLocations(query, limit);

      if (!response.success) {
        throw new Error(response.error || 'Failed to search locations');
      }

      return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      console.error('Error searching locations:', error);
      return [];
    }
  }

  // Mock jobs data for fallback
  private static getMockJobs(params: JobSearchParams = {}): { jobs: Job[]; total: number } {
    return {
      jobs: [],
      total: 0
    };
  }

  // Mock remote jobs data for fallback
  private static getMockRemoteJobs(params: JobSearchParams = {}): { jobs: Job[]; total: number } {
    return {
      jobs: [],
      total: 0
    };
  }
} 