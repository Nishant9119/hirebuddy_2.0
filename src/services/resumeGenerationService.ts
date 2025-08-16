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
  private apiBaseUrl = 'https://9dfupb4d2a.execute-api.us-east-1.amazonaws.com/api';

  /**
   * Generate email content using the resume generation API
   */
  async generateEmailWithResume(request: ResumeGenerationRequest): Promise<ResumeGenerationResponse> {
    try {
      console.log('🚀 Generating email with resume using API:', request);

      const response = await fetch(`${this.apiBaseUrl}/upload_resume`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Content-Type-Options': 'nosniff',
          'X-Frame-Options': 'DENY',
        },
        body: JSON.stringify(request),
      });

      console.log('📡 Resume Generation API Response:', response.status, response.statusText);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Resume Generation API Error:', { status: response.status, error: errorText });
        
        // Provide specific error messages based on status codes
        if (response.status === 400) {
          throw new Error(`Invalid request: ${errorText}`);
        } else if (response.status === 401) {
          throw new Error('Authentication failed. Please check your API credentials.');
        } else if (response.status === 403) {
          throw new Error('Access forbidden. Please check your permissions.');
        } else if (response.status === 429) {
          throw new Error('Rate limit exceeded. Please try again later.');
        } else if (response.status === 500) {
          throw new Error('Server error. Please try again later or contact support.');
        } else {
          throw new Error(`Failed to generate email: ${response.status} - ${errorText}`);
        }
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
