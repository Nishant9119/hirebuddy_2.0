import { supabase } from '@/lib/supabase';

export interface ResumeGenerationRequest {
  supabase_link: string;
  r_name: string;
  c_name: string;
}

export interface ResumeGenerationResponse {
  success: boolean;
  email_body?: string;
  subject?: string;
  error?: string;
}

export class ResumeGenerationService {
  private supabaseUrl: string;

  constructor() {
    this.supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL || '') as string;
  }

  /**
   * Generate email content using the resume generation API via Supabase Edge Function
   */
  async generateEmailWithResume(request: ResumeGenerationRequest): Promise<ResumeGenerationResponse> {
    try {
      console.log('🚀 Generating email with resume using Supabase Edge Function:', request);

      // Get current session for authentication
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        throw new Error('Authentication required for resume generation');
      }

      const response = await fetch(`${this.supabaseUrl}/functions/v1/resume-generation-proxy`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
          'apikey': (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || '') as string
        },
        body: JSON.stringify(request),
      });

      console.log('📡 Resume Generation Proxy Response:', response.status, response.statusText);

      if (!response.ok) {
        const errorData = await response.json();
        console.error('❌ Resume Generation Proxy Error:', { status: response.status, error: errorData });
        
        // Extract error message from the proxy response
        const errorMessage = errorData.error || `Failed to generate email: ${response.status}`;
        throw new Error(errorMessage);
      }

      const data = await response.json();
      console.log('✅ Email generated successfully:', data);

      return data;
    } catch (error) {
      console.error('Error generating email with resume:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Get user's resume URL from Supabase profile
   */
  async getUserResumeUrl(): Promise<string | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      const { data: profile, error } = await supabase
        .from('user_profiles')
        .select('resume_url')
        .eq('user_id', user.id)
        .single();

      if (error) {
        console.error('Error fetching user profile:', error);
        return null;
      }

      return profile?.resume_url || null;
    } catch (error) {
      console.error('Error getting user resume URL:', error);
      return null;
    }
  }

  /**
   * Generate email content for a specific contact using resume data
   */
  async generateEmailForContact(contactName: string, companyName: string): Promise<ResumeGenerationResponse> {
    try {
      const resumeUrl = await this.getUserResumeUrl();
      
      if (!resumeUrl) {
        return {
          success: false,
          error: 'No resume found. Please upload your resume in your profile first. You can upload your resume in your profile settings.'
        };
      }

      // Validate that we have the required parameters
      if (!contactName || !contactName.trim()) {
        return {
          success: false,
          error: 'Contact name is required for resume-based email generation.'
        };
      }

      if (!companyName || !companyName.trim()) {
        return {
          success: false,
          error: 'Company name is required for resume-based email generation.'
        };
      }

      const request: ResumeGenerationRequest = {
        supabase_link: resumeUrl,
        r_name: contactName.trim(),
        c_name: companyName.trim()
      };

      return await this.generateEmailWithResume(request);
    } catch (error) {
      console.error('Error generating email for contact:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }
}

// Export singleton instance
export const resumeGenerationService = new ResumeGenerationService();
