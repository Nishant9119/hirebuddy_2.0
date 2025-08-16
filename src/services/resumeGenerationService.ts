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
  private apiBaseUrl = '/api/resume-generation';

  /**
   * Generate email content using the resume generation API through Next.js API route
   */
  async generateEmailWithResume(request: ResumeGenerationRequest): Promise<ResumeGenerationResponse> {
    try {
      console.log('🚀 Generating email with resume using Next.js API route:', request);

      // Get the current user's session token
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error('User not authenticated');
      }

      const response = await fetch(this.apiBaseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(request),
      });

      console.log('📡 Resume Generation API Response:', response.status, response.statusText);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Resume Generation API Error:', { status: response.status, error: errorText });
        
        let errorMessage = 'Failed to generate email';
        if (response.status === 400) {
          errorMessage = `Invalid request: ${errorText}`;
        } else if (response.status === 401) {
          errorMessage = 'Authentication failed. Please check your credentials.';
        } else if (response.status === 403) {
          errorMessage = 'Access forbidden. Please check your permissions.';
        } else if (response.status === 429) {
          errorMessage = 'Rate limit exceeded. Please try again later.';
        } else if (response.status === 500) {
          errorMessage = 'Server error. Please try again later or contact support.';
        } else {
          errorMessage = `Failed to generate email: ${response.status} - ${errorText}`;
        }
        
        throw new Error(errorMessage);
      }

      const data = await response.json();
      console.log('✅ Email generated successfully:', data);
      
      return {
        success: true,
        email_body: data.email_body,
        subject: data.subject
      };
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
