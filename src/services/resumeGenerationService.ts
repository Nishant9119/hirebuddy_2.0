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
  private apiBaseUrl = 'https://9dfupb4d2a.execute-api.us-east-1.amazonaws.com';

  /**
   * Generate email content using the resume generation API directly
   */
  async generateEmailWithResume(request: ResumeGenerationRequest): Promise<ResumeGenerationResponse> {
    try {
      console.log('🚀 Generating email with resume using API directly:', request);

      // Use XMLHttpRequest as a fallback if fetch has CORS issues
      return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        
        xhr.open('POST', `${this.apiBaseUrl}/upload_resume`, true);
        xhr.setRequestHeader('Content-Type', 'application/json');
        
        xhr.onload = function() {
          console.log('📡 Resume Generation API Response:', xhr.status, xhr.statusText);
          
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const data = JSON.parse(xhr.responseText);
              console.log('✅ Email generated successfully:', data);
              
              resolve({
                success: true,
                email_body: data.email_body,
                subject: data.subject
              });
            } catch (parseError) {
              console.error('Error parsing response:', parseError);
              reject(new Error('Invalid response format from API'));
            }
          } else {
            console.error('❌ Resume Generation API Error:', { status: xhr.status, error: xhr.responseText });
            
            let errorMessage = 'Failed to generate email';
            if (xhr.status === 400) {
              errorMessage = `Invalid request: ${xhr.responseText}`;
            } else if (xhr.status === 401) {
              errorMessage = 'Authentication failed. Please check your API credentials.';
            } else if (xhr.status === 403) {
              errorMessage = 'Access forbidden. Please check your permissions.';
            } else if (xhr.status === 429) {
              errorMessage = 'Rate limit exceeded. Please try again later.';
            } else if (xhr.status === 500) {
              errorMessage = 'Server error. Please try again later or contact support.';
            } else {
              errorMessage = `Failed to generate email: ${xhr.status} - ${xhr.responseText}`;
            }
            
            reject(new Error(errorMessage));
          }
        };
        
        xhr.onerror = function() {
          console.error('❌ Network error during API call');
          reject(new Error('Network error occurred while calling the API'));
        };
        
        xhr.ontimeout = function() {
          console.error('❌ Request timeout');
          reject(new Error('Request timeout - please try again'));
        };
        
        xhr.timeout = 30000; // 30 second timeout
        
        try {
          xhr.send(JSON.stringify(request));
        } catch (sendError) {
          console.error('Error sending request:', sendError);
          reject(new Error('Failed to send request to API'));
        }
      });
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
