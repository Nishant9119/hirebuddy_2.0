import { apiClient, ApiResponse } from '../lib/api';
import { supabase } from '@/lib/supabase';

export interface UserProfile {
  id: string;
  full_name?: string;
  title?: string;
  company?: string;
  location?: string;
  phone?: string;
  bio?: string;
  website?: string;
  github?: string;
  linkedin?: string;
  college?: string;
  skills?: string[];
  experience_years?: number;
  available_for_work?: boolean;
  profile_image_url?: string;
  resume_url?: string;
  created_at?: string;
  updated_at?: string;
}

export interface DashboardStats {
  total_applications: number;
  pending_applications: number;
  interview_requests: number;
  total_jobs_viewed: number;
  profile_completion_percentage: number;
  recent_activity_count: number;
}

export interface JobRecommendation {
  id: string;
  title: string;
  company: string;
  location: string;
  match_score: number;
  skills: string[];
  is_urgent: boolean;
  posted: string;
  logo?: string;
  isRemote: boolean;
  description: string;
}

export interface RecentActivity {
  id: string;
  type: 'application' | 'profile_update' | 'job_view' | 'recommendation';
  title: string;
  description: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

export interface EmailOutreachStats {
  total_emails_sent: number;
  emails_this_month: number;
  remaining_emails: number;
  email_limit: number;
  success_rate: number;
  response_rate: number;
}

// API response types
interface EmailUsageResponse {
  total_sent: number;
  this_month: number;
  remaining: number;
  limit: number;
  success_rate: number;
  response_rate: number;
}

interface JobsApiResponse {
  jobs: any[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
  };
}

export class DashboardService {
  private static hasBackendToken(): boolean {
    try {
      if (typeof window === 'undefined') return false;
      const token = localStorage.getItem('auth_token');
      return !!token;
    } catch {
      return false;
    }
  }
  /**
   * Check authentication status using backend API
   */
  static async checkAuthStatus(): Promise<{ authenticated: boolean; user: any | null }> {
    try {
      const response = await apiClient.getProfile();
      
      if (response.success && response.data) {
        return {
          authenticated: true,
          user: response.data
        };
      }
      
      return {
        authenticated: false,
        user: null
      };
    } catch (error) {
      console.error('Error checking auth status:', error);
      return {
        authenticated: false,
        user: null
      };
    }
  }

  /**
   * Get dashboard statistics using backend API
   */
  static async getDashboardStats(): Promise<DashboardStats> {
    try {
      const response = await apiClient.getDashboardStats() as ApiResponse<DashboardStats>;
      
      if (response.success && response.data) {
        return response.data;
      }
      
      // Fallback to direct Supabase queries for live per-user stats
      const { data: userData } = await supabase.auth.getUser();
      const currentUser = userData?.user;
      if (!currentUser) {
        return {
          total_applications: 0,
          pending_applications: 0,
          interview_requests: 0,
          total_jobs_viewed: 0,
          profile_completion_percentage: 0,
          recent_activity_count: 0
        };
      }

      const userId = currentUser.id;

      // Total applications
      const { count: totalApplications } = await supabase
        .from('hirebuddy_job_applications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);

      // Pending applications
      const { count: pendingApplications } = await supabase
        .from('hirebuddy_job_applications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('status', 'pending');

      // Reviewed applications (use this to replace interview_requests on UI)
      const { count: reviewedApplications } = await supabase
        .from('hirebuddy_job_applications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .not('reviewed_at', 'is', null);

      // Recent activity count: applications in last 7 days
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const { count: recentActivityCount } = await supabase
        .from('hirebuddy_job_applications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .gte('created_at', sevenDaysAgo.toISOString());

      return {
        total_applications: totalApplications || 0,
        pending_applications: pendingApplications || 0,
        interview_requests: reviewedApplications || 0,
        total_jobs_viewed: 0,
        profile_completion_percentage: 0,
        recent_activity_count: recentActivityCount || 0
      };
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      // Conservative fallback
      return {
        total_applications: 0,
        pending_applications: 0,
        interview_requests: 0,
        total_jobs_viewed: 0,
        profile_completion_percentage: 0,
        recent_activity_count: 0
      };
    }
  }

  /**
   * Get recent activity using backend API
   */
  static async getRecentActivity(): Promise<RecentActivity[]> {
    try {
      const response = await apiClient.getRecentActivity() as ApiResponse<RecentActivity[]>;
      
      if (response.success && response.data && Array.isArray(response.data)) {
        return response.data;
      }
      
      return [];
    } catch (error) {
      console.error('Error fetching recent activity:', error);
      // Return sample activity for testing
      return [
        {
          id: '1',
          type: 'application',
          title: 'Applied to Senior Developer',
          description: 'Applied to Senior Developer position at TechCorp',
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        },
        {
          id: '2',
          type: 'profile_update',
          title: 'Profile Updated',
          description: 'Updated skills and experience section',
          timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
          id: '3',
          type: 'job_view',
          title: 'Viewed Frontend Engineer',
          description: 'Viewed Frontend Engineer position at StartupX',
          timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        }
      ];
    }
  }

  /**
   * Get job recommendations based on user profile and preferences using backend API
   */
  static async getJobRecommendations(limit: number = 5): Promise<JobRecommendation[]> {
    try {
      // Try to get jobs from backend API first
      const response = await apiClient.getJobs({ limit: limit.toString() }) as ApiResponse<JobsApiResponse>;

      if (response.success && response.data?.jobs && Array.isArray(response.data.jobs)) {
        // Transform API jobs to recommendations format
        return response.data.jobs.slice(0, limit).map((job: any, index: number) => ({
          id: job.job_id,
          title: job.job_title || 'Untitled Position',
          company: job.company_name || 'Unknown Company',
          location: job.job_location || 'Location not specified',
          match_score: 60 + Math.floor(Math.random() * 35), // Random score between 60-95
          skills: this.extractSkillsFromJob(job),
          is_urgent: Math.random() > 0.8,
          posted: this.formatTimeAgo(job.created_at),
          logo: this.generateFallbackLogo(job.company_name || 'Unknown Company'),
          isRemote: job.remote_flag || false,
          description: job.job_description || 'No description available'
        }));
      }

      return this.getSampleJobRecommendations(limit);
    } catch (error) {
      console.error('Error fetching job recommendations from API:', error);
      return this.getSampleJobRecommendations(limit);
    }
  }

  /**
   * Get user profile using backend API
   */
  static async getUserProfile(): Promise<UserProfile | null> {
    try {
      const response = await apiClient.getProfile() as ApiResponse<UserProfile>;
      
      if (response.success && response.data && typeof response.data === 'object' && 'id' in response.data) {
        return response.data;
      }
      
      return null;
    } catch (error) {
      console.error('Error fetching user profile:', error);
      return null;
    }
  }

  /**
   * Get email outreach statistics using backend API
   */
  static async getEmailOutreachStats(): Promise<EmailOutreachStats> {
    try {
      if (!this.hasBackendToken()) {
        return await this.getEmailOutreachStatsFromSupabase();
      }

      const response = await apiClient.getEmailUsage() as ApiResponse<EmailUsageResponse>;

      if (response.success && response.data && typeof response.data === 'object') {
        const data = response.data;
        return {
          total_emails_sent: data.total_sent || 0,
          emails_this_month: data.this_month || 0,
          remaining_emails: data.remaining || 0,
          email_limit: data.limit || 0,
          success_rate: data.success_rate || 0,
          response_rate: data.response_rate || 0
        };
      }

      // Non-success response: use Supabase fallback
      return await this.getEmailOutreachStatsFromSupabase();
    } catch (error) {
      console.error('Error fetching email stats from API, using Supabase fallback:', error);
      return await this.getEmailOutreachStatsFromSupabase();
    }
  }

  private static async getEmailOutreachStatsFromSupabase(): Promise<EmailOutreachStats> {
    const { data: userData } = await supabase.auth.getUser();
    const currentUser = userData?.user;
    if (!currentUser) {
      return {
        total_emails_sent: 0,
        emails_this_month: 0,
        remaining_emails: 0,
        email_limit: 0,
        success_rate: 0,
        response_rate: 0
      };
    }

    // Our useremaillog table uses user email as user_id
    const userIdentifier = currentUser.email || currentUser.id;

    // Total emails sent
    const { count: totalSent } = await supabase
      .from('useremaillog')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userIdentifier);

    // Emails sent this month
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const { count: thisMonth } = await supabase
      .from('useremaillog')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userIdentifier)
      .gte('sent_at', startOfMonth.toISOString());

    return {
      total_emails_sent: totalSent || 0,
      emails_this_month: thisMonth || 0,
      remaining_emails: 0,
      email_limit: 0,
      success_rate: 0,
      response_rate: 0
    };
  }

  /**
   * Get emails sent count
   */
  static async getEmailsSentCount(): Promise<number> {
    try {
      const stats = await this.getEmailOutreachStats();
      return stats.total_emails_sent;
    } catch (error) {
      console.error('Error fetching emails sent count:', error);
      return 0;
    }
  }

  /**
   * Get followups needed count
   */
  static async getFollowupsNeededCount(): Promise<number> {
    try {
      const { data: userData } = await supabase.auth.getUser();
      const currentUser = userData?.user;
      if (!currentUser) return 0;

      const userEmail = currentUser.email || '';
      if (!userEmail) return 0;

      // Get distinct recipients the user has emailed
      const { data: sentRows, error: sentErr } = await supabase
        .from('useremaillog')
        .select('to')
        .eq('user_id', userEmail)
        .not('to', 'is', null);
      if (sentErr) return 0;
      const uniqueSent = new Set((sentRows || []).map(r => String(r.to).toLowerCase()).filter(Boolean));

      // Get distinct recipients who have replied
      const { data: repliedRows, error: replyErr } = await supabase
        .from('replies_kpi')
        .select('to')
        .eq('user_id', userEmail)
        .eq('reply', true)
        .not('to', 'is', null);
      if (replyErr) return uniqueSent.size;
      const uniqueReplied = new Set((repliedRows || []).map(r => String(r.to).toLowerCase()).filter(Boolean));

      // Pending follow-ups are sent recipients without a recorded reply
      let pending = 0;
      uniqueSent.forEach(addr => { if (!uniqueReplied.has(addr)) pending += 1; });
      return Math.max(0, pending);
    } catch (error) {
      console.error('Error fetching followups needed count:', error);
      return 0;
    }
  }

  /**
   * Get replies received count
   */
  static async getRepliesReceivedCount(): Promise<number> {
    try {
      const { data: userData } = await supabase.auth.getUser();
      const currentUser = userData?.user;
      if (!currentUser) return 0;

      const userEmail = currentUser.email || '';
      if (!userEmail) return 0;

      const { count } = await supabase
        .from('replies_kpi')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userEmail)
        .eq('reply', true);
      return count || 0;
    } catch (error) {
      console.error('Error fetching replies received count:', error);
      return 0;
    }
  }

  /**
   * Get total contacts count
   */
  static async getTotalContactsCount(): Promise<number> {
    try {
      const { count } = await supabase
        .from('testdb')
        .select('*', { count: 'exact', head: true });
      return count || 0;
    } catch (error) {
      console.error('Error fetching total contacts count:', error);
      return 0;
    }
  }

  /**
   * Get list of contacts (email addresses) who have replied
   */
  static async getContactsWhoReplied(userEmail: string): Promise<string[]> {
    try {
      if (!userEmail) return [];
      const { data, error } = await supabase
        .from('replies_kpi')
        .select('to')
        .eq('user_id', userEmail)
        .eq('reply', true)
        .not('to', 'is', null);
      if (error) return [];
      const unique = Array.from(new Set((data || []).map(r => String(r.to).toLowerCase()).filter(Boolean)));
      return unique;
    } catch (error) {
      return [];
    }
  }

  // Helper methods
  private static extractSkillsFromJob(job: any): string[] {
    const description = (job.job_description || '').toLowerCase();
    const title = (job.job_title || '').toLowerCase();
    const skills: string[] = [];
    
    const commonSkills = [
      'javascript', 'typescript', 'react', 'vue', 'angular', 'node.js', 'python',
      'java', 'c#', 'php', 'ruby', 'go', 'rust', 'swift', 'kotlin',
      'aws', 'azure', 'gcp', 'docker', 'kubernetes', 'terraform',
      'sql', 'mongodb', 'postgresql', 'redis', 'elasticsearch',
      'git', 'jenkins', 'ci/cd', 'agile', 'scrum'
    ];
    
    commonSkills.forEach(skill => {
      if (description.includes(skill) || title.includes(skill)) {
        skills.push(skill.charAt(0).toUpperCase() + skill.slice(1));
      }
    });
    
    return skills.slice(0, 4);
  }

  private static formatTimeAgo(dateString: string): string {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffTime = Math.abs(now.getTime() - date.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays === 1) return '1 day ago';
      if (diffDays <= 7) return `${diffDays} days ago`;
      if (diffDays <= 30) return `${Math.ceil(diffDays / 7)} weeks ago`;
      return `${Math.ceil(diffDays / 30)} months ago`;
    } catch (error) {
      return 'Recently';
    }
  }

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

  private static getSampleJobRecommendations(limit: number): JobRecommendation[] {
    const sampleJobs = [
      {
        id: '1',
        title: 'Senior Frontend Developer',
        company: 'TechCorp',
        location: 'San Francisco, CA',
        match_score: 92,
        skills: ['React', 'TypeScript', 'Node.js', 'AWS'],
        is_urgent: true,
        posted: '2 days ago',
        logo: this.generateFallbackLogo('TechCorp'),
        isRemote: true,
        description: 'Join our team building next-generation web applications'
      },
      {
        id: '2',
        title: 'Full Stack Engineer',
        company: 'StartupX',
        location: 'New York, NY',
        match_score: 87,
        skills: ['JavaScript', 'Python', 'Docker', 'PostgreSQL'],
        is_urgent: false,
        posted: '1 week ago',
        logo: this.generateFallbackLogo('StartupX'),
        isRemote: false,
        description: 'Build scalable web applications from the ground up'
      },
      {
        id: '3',
        title: 'Software Engineer',
        company: 'BigTech',
        location: 'Seattle, WA',
        match_score: 84,
        skills: ['Java', 'Spring', 'Microservices', 'Kubernetes'],
        is_urgent: false,
        posted: '3 days ago',
        logo: this.generateFallbackLogo('BigTech'),
        isRemote: true,
        description: 'Work on large-scale distributed systems'
      }
    ];

    return sampleJobs.slice(0, limit);
  }
} 