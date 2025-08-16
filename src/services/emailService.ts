import { EnvironmentValidator, SecureErrorHandler, InputValidator, InputSanitizer } from '../utils/security';
import { getConfig } from '@/config/environment';
import { supabase } from '@/lib/supabase';
import { resumeGenerationService } from './resumeGenerationService';

export interface EmailSendRequest {
  sender: string;
  to: string;
  subject: string;
  body: string;
  attachment_path?: string;
  isHtml?: boolean;
  content_type?: string;
  mime_type?: string;
}

export interface FollowUpRequest {
  sender: string;
  body: string;
  to: string;
  subject?: string;
  isHtml?: boolean;
  content_type?: string;
  mime_type?: string;
}

export interface EmailConversationRequest {
  sender: string;
  to: string;
}

export interface EmailSendResponse {
  messageId: string;
  threadId: string;
  subject: string;
}

export interface EmailConversation {
  id: string;
  subject: string;
  from: string;
  to?: string;
  date: string;
  body: string;
  thread_id?: string;
  metadata?: any;
}

export interface ContactInfo {
  name: string;
  email: string;
  company?: string;
  position?: string;
  linkedin_link?: string;
}

export interface UserProfileData {
  full_name?: string;
  title?: string;
  company?: string;
  location?: string;
  bio?: string;
  skills?: string[];
  experience_years?: number;
  college?: string;
  degree?: string;
  linkedin?: string;
  github?: string;
  website?: string;
  phone?: string;
  available_for_work?: boolean;
  experiences?: Array<{
    job_title: string;
    company: string;
    location?: string;
    start_date?: string;
    end_date?: string;
    is_current?: boolean;
    description?: string;
    achievements?: string[];
    skills_used?: string[];
  }>;
}

export interface AIEmailGenerationRequest {
  contact: ContactInfo;
  userProfile: UserProfileData;
  emailType: 'cold_outreach' | 'follow_up' | 'job_application' | 'networking' | 'partnership';
  customInstructions?: string;
  tone?: 'professional' | 'friendly' | 'formal' | 'casual';
  targetRoles?: string[];
}

export interface AIEmailResponse {
  subject: string;
  body: string;
  reasoning?: string;
}

class EmailService {
  private apiBaseUrl: string;
  private openaiProxyUrl: string;
  private useHtmlEmails: boolean = true; // Enable HTML emails for proper formatting and line spacing

  constructor() {
    // Resolve API base URL from config with safe fallbacks; do not hard-throw on load
    const cfg = getConfig();
    this.apiBaseUrl = cfg.api.awsBaseUrl || cfg.api.baseUrl;
    const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL || '') as string;
    this.openaiProxyUrl = supabaseUrl ? `${supabaseUrl}/functions/v1/openai-proxy` : '';
  }

  /**
   * Send an email using the AWS API
   */
  async sendEmail(request: EmailSendRequest): Promise<EmailSendResponse> {
    try {
      // Input validation and sanitization
      if (!InputValidator.isValidEmail(request.to)) {
        throw new Error('Invalid recipient email address');
      }
      if (!InputValidator.isValidEmail(request.sender)) {
        throw new Error('Invalid sender email address');
      }
      if (!InputValidator.isSafeText(request.subject)) {
        throw new Error('Invalid characters in email subject');
      }
      if (request.isHtml && !InputValidator.isSafeHtmlEmail(request.body)) {
        throw new Error('Unsafe HTML content in email body');
      } else if (!request.isHtml && !InputValidator.isSafeText(request.body)) {
        throw new Error('Invalid characters in email body');
      }



      // Sanitize inputs
      const sanitizedRequest = {
        ...request,
        to: InputSanitizer.sanitizeEmail(request.to),
        sender: InputSanitizer.sanitizeEmail(request.sender),
        subject: InputSanitizer.sanitizeText(request.subject),
        body: request.isHtml ? InputSanitizer.sanitizeHtmlEmail(request.body) : InputSanitizer.sanitizeText(request.body)
      };

      console.log('🚀 Sending email via AWS API...', { 
        to: sanitizedRequest.to, 
        subject: sanitizedRequest.subject,
        sender: sanitizedRequest.sender,
        isHtml: sanitizedRequest.isHtml,
        content_type: sanitizedRequest.content_type,
        mime_type: sanitizedRequest.mime_type,
        bodyPreview: sanitizedRequest.body.substring(0, 200) + '...'
      });

      const response = await fetch(`${this.apiBaseUrl}/send_email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Content-Type-Options': 'nosniff',
          'X-Frame-Options': 'DENY',
        },
        body: JSON.stringify(sanitizedRequest),
      });

      console.log('📡 AWS API Response:', response.status, response.statusText);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ AWS API Error:', { status: response.status, error: errorText });
        
        // Provide more specific error messages based on status codes
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
          throw new Error(`Failed to send email: ${response.status} - ${errorText}`);
        }
      }

      const data = await response.json();
      console.log('✅ Email sent successfully:', data);

      // Log successful AWS email to useremaillog for accurate per-user stats
      try {
        const { data: userData } = await supabase.auth.getUser();
        const currentUser = userData?.user;
        if (currentUser?.email) {
          await supabase
            .from('useremaillog')
            .insert({
              sent_at: new Date().toISOString(),
              to: sanitizedRequest.to,
              user_id: currentUser.email, // useremaillog uses email as user_id
              messageId: data.messageId || `aws-${Date.now()}`,
              threadId: data.threadId || data.messageId,
              subject: sanitizedRequest.subject
            });
        }
      } catch (logError) {
        console.warn('Failed to log AWS email to useremaillog:', logError);
      }
      
      // Handle different response types
      if (typeof data === 'string') {
        // Handle string responses like "Upgrade your plan. Email limit reached."
        throw new Error(data);
      }

      return data as EmailSendResponse;
    } catch (error) {
      console.error('❌ Error sending email:', error);
      
      // Use secure error handling to prevent information leakage
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw SecureErrorHandler.createSafeError(error, 'Unable to connect to email service. Please check your internet connection.');
      }
      
      // Check if error message is safe to show to user
      if (error instanceof Error && SecureErrorHandler.isSafeErrorMessage(error.message)) {
        throw error;
      }
      
      // For any other errors, return a generic message
      throw SecureErrorHandler.createSafeError(error, 'Failed to send email. Please try again later.');
    }
  }

  /**
   * Send a follow-up email using the AWS API
   */
  async sendFollowUp(request: FollowUpRequest): Promise<{ message: string }> {
    try {
      // Input validation and sanitization for follow-up emails
      if (!InputValidator.isValidEmail(request.to)) {
        throw new Error('Invalid recipient email address');
      }
      if (!InputValidator.isValidEmail(request.sender)) {
        throw new Error('Invalid sender email address');
      }
      if (request.isHtml && !InputValidator.isSafeHtmlEmail(request.body)) {
        throw new Error('Unsafe HTML content in follow-up email body');
      } else if (!request.isHtml && !InputValidator.isSafeText(request.body)) {
        throw new Error('Invalid characters in follow-up email body');
      }

      // Sanitize inputs
      const sanitizedRequest = {
        ...request,
        to: InputSanitizer.sanitizeEmail(request.to),
        sender: InputSanitizer.sanitizeEmail(request.sender),
        body: request.isHtml ? InputSanitizer.sanitizeHtmlEmail(request.body) : InputSanitizer.sanitizeText(request.body)
      };

      console.log('🚀 Sending follow-up email via AWS API...', { 
        to: sanitizedRequest.to, 
        sender: sanitizedRequest.sender,
        isHtml: sanitizedRequest.isHtml,
        content_type: sanitizedRequest.content_type,
        mime_type: sanitizedRequest.mime_type,
        bodyPreview: sanitizedRequest.body.substring(0, 200) + '...'
      });

      const response = await fetch(`${this.apiBaseUrl}/send_followup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(sanitizedRequest),
      });

      console.log('📡 AWS API Follow-up Response:', response.status, response.statusText);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ AWS API Follow-up Error:', { status: response.status, error: errorText });
        
        // Provide more specific error messages based on status codes
        if (response.status === 400) {
          throw new Error(`Invalid follow-up request: ${errorText}`);
        } else if (response.status === 401) {
          throw new Error('Authentication failed. Please check your API credentials.');
        } else if (response.status === 403) {
          throw new Error('Access forbidden. Please check your permissions.');
        } else if (response.status === 429) {
          throw new Error('Rate limit exceeded. Please try again later.');
        } else if (response.status === 500) {
          throw new Error('Server error. Please try again later or contact support.');
        } else {
          throw new Error(`Failed to send follow-up: ${response.status} - ${errorText}`);
        }
      }

      const data = await response.json();
      console.log('✅ Follow-up sent successfully:', data);
      
      // Log follow-up to followuplogs for accurate last-communication tracking
      try {
        const { data: userData } = await supabase.auth.getUser();
        const currentUser = userData?.user;
        if (currentUser?.email) {
          await supabase
            .from('followuplogs')
            .insert({
              sent_at: new Date().toISOString(),
              to: sanitizedRequest.to,
              user_id: currentUser.email, // followuplogs uses email as user_id
              followup_count: '1',
              subject: sanitizedRequest.subject || null,
              body: sanitizedRequest.body || null
            });
        }
      } catch (logError) {
        console.warn('Failed to log follow-up to followuplogs:', logError);
      }
      return data;
    } catch (error) {
      console.error('❌ Error sending follow-up:', error);
      
      // Re-throw with more context if it's a network error
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('Network error: Unable to connect to email service. Please check your internet connection.');
      }
      
      throw error;
    }
  }

  /**
   * Get email conversation and replies using the Gmail API backend
   */
  async getEmailConversation(request: EmailConversationRequest): Promise<EmailConversation[]> {
    try {
      console.log('Calling backend API for conversation:', request);
      
      const response = await fetch(`${this.apiBaseUrl}/get_email_and_replies`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Backend API error:', errorText);
        throw new Error(`Failed to get conversation: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log('Raw backend response:', data);
      
      // Handle different response formats from the backend
      let emails: any[] = [];
      
      if (Array.isArray(data)) {
        emails = data;
      } else if (data && typeof data === 'object') {
        // Handle case where backend returns an object with conversation data
        if (data.messages) {
          emails = data.messages;
        } else if (data.emails) {
          emails = data.emails;
        } else if (data.conversation) {
          emails = data.conversation;
        } else {
          // Single email response
          emails = [data];
        }
      }
      
      console.log('Processed emails array:', emails);
      
      // Transform the backend response to match our EmailConversation interface
      const transformedEmails = emails.map((email: any, index: number) => {
        // Handle different possible field names from the backend
        const messageId = email.id || email.messageId || email.message_id || `msg-${index}`;
        const subject = email.subject || email.Subject || 'No Subject';
        const fromEmail = email.from || email.From || email.sender || email.sender_email || '';
        const toEmail = email.to || email.To || email.recipient || email.recipient_email || '';
        const body = email.body || email.Body || email.content || email.snippet || '';
        const date = email.date || email.Date || email.sent_at || email.internalDate || new Date().toISOString();
        
        // Additional metadata that might be useful
        const threadId = email.threadId || email.thread_id || email.labelIds;
        
        console.log('Transforming email:', {
          messageId,
          subject,
          fromEmail,
          toEmail,
          body: body.substring(0, 100) + '...',
          date
        });

        return {
          id: messageId,
          subject: subject,
          from: fromEmail,
          to: toEmail,
          date: date,
          body: body,
          thread_id: threadId,
          metadata: {
            original_data: email
          }
        };
      });
      
      console.log('Final transformed emails:', transformedEmails.length);
      return transformedEmails;
      
    } catch (error) {
      console.error('Error getting email conversation:', error);
      // Return empty array instead of throwing to prevent UI crashes
      return [];
    }
  }

  /**
   * Test API connection
   */
  async testConnection(): Promise<{ success: boolean; message: string }> {
    try {
      // First try a simple GET request to the root endpoint
      const rootResponse = await fetch(`${this.apiBaseUrl}/`, {
        method: 'GET',
      });

      if (rootResponse.ok) {
        const data = await rootResponse.json();
        return {
          success: true,
          message: data.message || 'AWS Email API connection successful'
        };
      }

      // If root endpoint fails, try the send_email endpoint with test data
      const response = await fetch(`${this.apiBaseUrl}/send_email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sender: 'test@example.com',
          to: 'test@example.com',
          subject: 'Test Connection',
          body: 'Testing API connectivity'
        }),
      });

      // Consider 400, 422, and 500 as successful connections (API is responding)
      // These indicate the API is working but our test data doesn't meet requirements
      if (response.status === 400 || response.status === 422 || response.status === 500) {
        return {
          success: true,
          message: 'AWS Email API connection successful (API reachable and responding)'
        };
      }

      if (response.ok) {
        return {
          success: true,
          message: 'AWS Email API connection successful'
        };
      }

      const errorText = await response.text();
      return {
        success: false,
        message: `API connection failed: ${response.status} - ${errorText}`
      };
    } catch (error) {
      return {
        success: false,
        message: `API connection error: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Generate AI-powered follow-up email (short reminder)
   */
  async generateAIFollowUp(request: AIEmailGenerationRequest): Promise<AIEmailResponse> {
    try {
      const systemPrompt = this.buildFollowUpSystemPrompt(request.tone || 'professional');
      const userPrompt = this.buildFollowUpUserPrompt(request);

      // Get current session for authentication
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        throw new Error('Authentication required for AI features');
      }

      const response = await fetch(this.openaiProxyUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
          'apikey': (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || '') as string
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          temperature: 0.6,
          max_tokens: 500, // Much shorter for follow-ups
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`OpenAI API error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
      }

      const data = await response.json();
      const aiResponse = data.choices[0]?.message?.content || '';

      // Parse the AI response to extract subject and body
      return this.parseAIResponse(aiResponse);
    } catch (error) {
      console.error('Error generating AI follow-up:', error);
      throw error;
    }
  }

  /**
   * Generate AI-powered personalized email content using OpenAI 4o-mini
   */
  async generateAIEmail(request: AIEmailGenerationRequest): Promise<AIEmailResponse> {
    try {
      // Use Python-style prompt provided by product requirements for outreach emails
      const userPrompt = this.buildPythonStyleEmailPrompt(request);

              // Get current session for authentication
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session?.access_token) {
          throw new Error('Authentication required for AI features');
        }

        const response = await fetch(this.openaiProxyUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
            'apikey': (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || '') as string
          },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'user', content: userPrompt }
          ],
          // Match Python example determinism for reproducibility
          temperature: 0,
          max_tokens: 1500,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`OpenAI API error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
      }

      const data = await response.json();
      const aiResponse = data.choices[0]?.message?.content || '';

      // Parse the AI response to extract subject and body
      return this.parseAIResponse(aiResponse);
    } catch (error) {
      console.error('Error generating AI email:', error);
      throw error;
    }
  }

  /**
   * Generate email content using the resume generation API
   * This method uses the new API endpoint for resume-based email generation
   */
  async generateEmailWithResume(contactName: string, companyName: string): Promise<AIEmailResponse> {
    try {
      console.log('🚀 Generating email using resume generation API for:', { contactName, companyName });

      const response = await resumeGenerationService.generateEmailForContact(contactName, companyName);

      if (!response.success) {
        throw new Error(response.error || 'Failed to generate email with resume');
      }

      if (!response.email_body || !response.subject) {
        throw new Error('Invalid response from resume generation API');
      }

      return {
        subject: response.subject,
        body: response.email_body,
        reasoning: 'Generated using resume-based API'
      };
    } catch (error) {
      console.error('Error generating email with resume:', error);
      throw error;
    }
  }

  /**
   * Build system prompt specifically for follow-up emails
   */
  private buildFollowUpSystemPrompt(tone: string): string {
    return `You are a professional email assistant specializing in creating SHORT, EFFECTIVE follow-up emails. Your follow-ups should be:

1. EXTREMELY BRIEF - 30-50 words maximum (not including greeting/closing)
2. GENTLE REMINDER - Don't be pushy or aggressive
3. VALUE-FOCUSED - Quickly remind them of your real value using only provided data
4. ACTION-ORIENTED - Clear, simple call to action
5. RESPECTFUL - Acknowledge they're busy

TONE: ${tone}

CRITICAL DATA USAGE RULES FOR FOLLOW-UPS:
- Use ONLY the real data provided about the sender and recipient
- NEVER make up names, companies, titles, or achievements
- Use the exact recipient and sender names as provided
- Reference only real achievements and experience from the provided data
- Include the sender's phone number and LinkedIn profile URL exactly as provided in the data
- If information is missing, do not invent it

FOLLOW-UP SPECIFIC GUIDELINES:
- This is a FOLLOW-UP to a previous email, not a first introduction
- Keep it shorter than a text message
- Reference the previous email briefly
- Don't repeat all your qualifications again
- Just a gentle reminder with one real reason to respond from the provided data
- Be understanding that they're busy
- Maximum 2-3 sentences for the main content

EMAIL STRUCTURE FOR FOLLOW-UPS:
- Greeting: Use recipient's actual name from the data
- Context: "I wanted to follow up on my previous email."
- Value reminder: ONE brief sentence about real value/benefit from provided data
- Call to action: Simple, specific request
- Closing: Use sender's actual name from the data
- Include phone number and LinkedIn in signature if provided in the data

RESPONSE FORMAT:
You must respond in this exact JSON format:
{
  "subject": "Follow-up: [Brief subject]",
  "body": "Follow-up email body with proper line breaks using \\n\\n for paragraphs",
  "reasoning": "Brief explanation of approach"
}`;
  }

  /**
   * Build user prompt specifically for follow-up emails
   */
  private buildFollowUpUserPrompt(request: AIEmailGenerationRequest): string {
    const { contact, userProfile, customInstructions } = request;

    let prompt = `Generate a SHORT follow-up email (reminder) with the following information:

RECIPIENT:
- Name: ${contact.name}
- Email: ${contact.email}`;

    if (contact.company) prompt += `\n- Company: ${contact.company}`;
    if (contact.position) prompt += `\n- Position: ${contact.position}`;

    prompt += `\n\nSENDER:`;
    if (userProfile.full_name) prompt += `\n- Name: ${userProfile.full_name}`;
    if (userProfile.title) prompt += `\n- Title: ${userProfile.title}`;
    if (userProfile.company) prompt += `\n- Company: ${userProfile.company}`;
    if (userProfile.phone) prompt += `\n- Phone: ${userProfile.phone}`;
    if (userProfile.linkedin) prompt += `\n- LinkedIn: ${userProfile.linkedin}`;

    // Only include the most impressive achievement for follow-ups
    if (userProfile.experiences && userProfile.experiences.length > 0) {
      const topExperience = userProfile.experiences[0];
      if (topExperience.achievements && topExperience.achievements.length > 0) {
        prompt += `\n- Key Achievement: ${topExperience.achievements[0]}`;
      }
    }

    if (customInstructions) {
      prompt += `\n\nCUSTOM INSTRUCTIONS: ${customInstructions}`;
    }

    // Build signature components
    let signatureComponents = [];
    if (userProfile.phone) signatureComponents.push(`Phone: ${userProfile.phone}`);
    if (userProfile.linkedin) signatureComponents.push(`LinkedIn: ${userProfile.linkedin}`);

    prompt += `\n\nCRITICAL FOLLOW-UP INSTRUCTIONS - MUST FOLLOW EXACTLY:

DATA USAGE REQUIREMENTS:
1. Use ONLY the real information provided above - NO fake data
2. Use the recipient's exact name: "${contact.name}"
3. ${userProfile.full_name ? `Use the sender's exact name: "${userProfile.full_name}"` : 'Use a generic closing if sender name not provided'}
4. Include signature with: ${signatureComponents.length > 0 ? signatureComponents.join(' and ') : 'no additional contact info if not provided'}
5. Use only the real achievements and experience data provided above
6. If any information is missing, do not make it up

FOLLOW-UP EMAIL REQUIREMENTS:
1. Acknowledges this is a follow-up to a previous email
2. Briefly reminds them of ONE real key value from the provided data
3. Includes a simple, non-pushy call to action
4. Stays under 50 words for the main content (excluding greeting/closing)
5. Uses understanding tone - they're busy people
6. Structure: Greeting → Follow-up context → Brief real value reminder → Simple CTA → Closing with signature

FORMATTING REQUIREMENTS:
- Start with "Hi ${contact.name},"
- Maximum 3 short sentences for main content
- End with "Best regards,\\n${userProfile.full_name || '[Your name]'}"
- ${userProfile.phone ? `Include in signature: "Phone: ${userProfile.phone}"` : ''}
- ${userProfile.linkedin ? `Include in signature: "LinkedIn: ${userProfile.linkedin}"` : ''}
- NO placeholder text like [Name], [title], [achievement] - use only real data

Keep it SHORT, RESPECTFUL, and VALUE-FOCUSED using only real information. This should feel like a gentle reminder, not a sales pitch.`;

    return prompt;
  }

  /**
   * Build system prompt based on email type and tone
   */
  private buildSystemPrompt(emailType: string, tone: string): string {
    const basePrompt = `You are a professional email writing assistant specializing in creating personalized, effective emails for job seekers and professionals. Your emails should be:

1. PERSONALIZED - Use ONLY the specific details provided about the recipient and sender - NO FAKE DATA
2. CONCISE - Keep it very brief and to the point (100-150 words max)
3. PROFESSIONAL - Maintain appropriate business tone
4. ACTION-ORIENTED - Include a clear call to action
5. AUTHENTIC - Sound genuine and human, not robotic

TONE: ${tone}
EMAIL TYPE: ${emailType}

CRITICAL DATA USAGE RULES:
- Use ONLY the real data provided in the user prompt
- NEVER make up or assume information not explicitly provided
- If a field is missing or empty, DO NOT create fake information
- Use the exact names, companies, titles, and achievements as provided
- Include the sender's phone number and LinkedIn profile URL exactly as provided in the data
- Focus on 1-2 most relevant real achievements or skills only
- Use the recipient's actual name and company naturally

EMAIL FORMATTING REQUIREMENTS:
- Use \\n\\n to separate paragraphs (this creates proper spacing)
- Start with a brief greeting using the recipient's actual name
- Structure: Greeting → One sentence context → Key value proposition from real data → Call to action → Brief closing with sender's actual name and contact info
- Maximum 2-3 paragraphs total
- Each paragraph should be 1-2 sentences maximum
- Eliminate unnecessary transitional phrases
- Get straight to the point

RESPONSE FORMAT:
You must respond in this exact JSON format:
{
  "subject": "Compelling subject line here",
  "body": "Email body here with proper line breaks using \\n\\n for paragraphs and \\n for line breaks within paragraphs",
  "reasoning": "Brief explanation of personalization choices"
}`;

    const typeSpecificGuidelines = {
      'cold_outreach': 'Lead with ONE real impressive achievement from the provided data that would interest them. Skip small talk.',
      'follow_up': 'Brief reference to previous contact. Add ONE new piece of value.',
      'job_application': 'State the role. Highlight ONE relevant achievement with numbers. Show enthusiasm briefly.',
      'networking': 'Mention ONE mutual connection or shared interest. Keep extremely conversational.',
      'partnership': 'State ONE specific mutual benefit or collaboration opportunity immediately.'
    };

    return `${basePrompt}\n\nSPECIFIC GUIDELINES FOR ${emailType.toUpperCase()}:\n${typeSpecificGuidelines[emailType as keyof typeof typeSpecificGuidelines]}`;
  }

  /**
   * Build user prompt with contact and profile information
   */
  private buildUserPrompt(request: AIEmailGenerationRequest): string {
    const { contact, userProfile, customInstructions, targetRoles } = request;

    let prompt = `Generate a personalized email with the following information:

RECIPIENT INFORMATION:
- Name: ${contact.name}
- Email: ${contact.email}`;

    if (contact.company) prompt += `\n- Company: ${contact.company}`;
    if (contact.position) prompt += `\n- Position: ${contact.position}`;
    if (contact.linkedin_link) prompt += `\n- LinkedIn: ${contact.linkedin_link}`;

    prompt += `\n\nSENDER (USER) INFORMATION:`;
    if (userProfile.full_name) prompt += `\n- Name: ${userProfile.full_name}`;
    if (userProfile.title) prompt += `\n- Current Title: ${userProfile.title}`;
    if (userProfile.company) prompt += `\n- Current Company: ${userProfile.company}`;
    if (userProfile.location) prompt += `\n- Location: ${userProfile.location}`;
    if (userProfile.college) prompt += `\n- Education: ${userProfile.college}`;
    if (userProfile.experience_years) prompt += `\n- Years of Experience: ${userProfile.experience_years}`;
    if (userProfile.phone) prompt += `\n- Phone: ${userProfile.phone}`;
    if (userProfile.linkedin) prompt += `\n- LinkedIn: ${userProfile.linkedin}`;
    if (userProfile.available_for_work !== undefined) {
      prompt += `\n- Available for Work: ${userProfile.available_for_work ? 'Yes' : 'No'}`;
    }
    if (userProfile.bio) prompt += `\n- Bio: ${userProfile.bio}`;
    
    if (userProfile.skills && userProfile.skills.length > 0) {
      const topSkills = userProfile.skills.slice(0, 4); // Limit to top 4 skills for conciseness
      prompt += `\n- Key Skills: ${topSkills.join(', ')}`;
    }

    // Add focused work experience information
    if (userProfile.experiences && userProfile.experiences.length > 0) {
      prompt += `\n- Most Recent Experience:`;
      // Focus on just the most recent/relevant experience to keep emails concise
      const topExperience = userProfile.experiences[0];
      
      prompt += `\n  Current: ${topExperience.job_title} at ${topExperience.company}`;
      if (topExperience.start_date || topExperience.end_date) {
        const startDate = topExperience.start_date ? new Date(topExperience.start_date).getFullYear() : 'Unknown';
        const endDate = topExperience.is_current ? 'Present' : (topExperience.end_date ? new Date(topExperience.end_date).getFullYear() : 'Unknown');
        prompt += ` (${startDate} - ${endDate})`;
      }
      
      if (topExperience.achievements && topExperience.achievements.length > 0) {
        // Include only the most impressive achievement
        const topAchievement = topExperience.achievements[0];
        prompt += `\n  Top Achievement: ${topAchievement}`;
      }
      if (topExperience.skills_used && topExperience.skills_used.length > 0) {
        // Include top 3 skills only
        const topSkills = topExperience.skills_used.slice(0, 3);
        prompt += `\n  Key Skills: ${topSkills.join(', ')}`;
      }
    }

    if (userProfile.github) prompt += `\n- GitHub: ${userProfile.github}`;
    if (userProfile.website) prompt += `\n- Website: ${userProfile.website}`;

    if (targetRoles && targetRoles.length > 0) {
      prompt += `\n\nTARGET ROLES:\nThe sender is looking for opportunities in the following roles: ${targetRoles.join(', ')}`;
    }

    if (customInstructions) {
      prompt += `\n\nCUSTOM INSTRUCTIONS:\n${customInstructions}`;
    }

    prompt += `\n\nCRITICAL INSTRUCTIONS - MUST FOLLOW EXACTLY:

DATA USAGE REQUIREMENTS:
1. Use ONLY the real information provided above - NO fake data, names, companies, or achievements
2. Use the recipient's exact name: "${contact.name}"
3. ${contact.company ? `Use the recipient's exact company: "${contact.company}"` : 'Do not mention a company name if not provided'}
4. ${userProfile.full_name ? `Use the sender's exact name: "${userProfile.full_name}"` : 'Use a generic closing if sender name not provided'}
5. ${userProfile.linkedin ? `Include the sender's LinkedIn profile: "${userProfile.linkedin}"` : 'Do not include LinkedIn if not provided'}
6. Use only the real achievements, skills, and experience data provided above
7. If any information is missing, do not make it up - work with what is available

EMAIL GENERATION REQUIREMENTS:
1. Uses ONLY the real data provided above (1-2 key points maximum from actual achievements)
2. References "${contact.name}" and ${contact.company ? `"${contact.company}"` : 'their role'} naturally
3. Highlights ONE specific real achievement or skill from the provided data
4. Sounds natural and conversational, not like a template
6. Ends with a specific, actionable call to action
7. Keeps the total length under 100-120 words maximum
8. ${targetRoles && targetRoles.length > 0 ? `Focus on alignment with these target roles: ${targetRoles.join(', ')}` : 'Focus on general professional value'}

STRICT FORMATTING REQUIREMENTS:
- Start with "Hi ${contact.name},"
- Use \\n\\n to separate paragraphs (maximum 2-3 paragraphs)
- Structure: Greeting → One context sentence → Key real value/achievement → Call to action → Brief closing
- Each paragraph: 1-2 sentences maximum
- NO placeholder text like [Name], [Company], [Title] - use only real data
- Get straight to the point immediately
- End with "Best regards,\\n${userProfile.full_name || '[Your name]'}"
- ${userProfile.phone ? `Include in signature: "Phone: ${userProfile.phone}"` : ''}
- ${userProfile.linkedin ? `Include LinkedIn in signature: "LinkedIn: ${userProfile.linkedin}"` : ''}

CONTENT FOCUS:
- Choose the SINGLE most impressive real achievement or skill from the provided data
- Mention "${contact.company || 'their company'}" naturally for personalization
- Focus on actual value you can provide based on real experience
- Make every word count - eliminate redundancy
- Never invent or assume information not explicitly provided

Remember to respond in the exact JSON format specified in the system prompt.`;

    return prompt;
  }

  /**
   * Parse AI response to extract subject and body
   */
  private parseAIResponse(aiResponse: string): AIEmailResponse {
    try {
      // Clean the response to ensure it's valid JSON
      const cleanedResponse = aiResponse.trim();
      const jsonMatch = cleanedResponse.match(/\{[\s\S]*\}/);
      const jsonString = jsonMatch ? jsonMatch[0] : cleanedResponse;
      
      const parsed = JSON.parse(jsonString);
      
      // Accept either {subject, body} or {subject, email_body}
      const bodyField = parsed.body || parsed.email_body;
      if (!parsed.subject || !bodyField) {
        throw new Error('Invalid AI response format');
      }

      return {
        subject: parsed.subject,
        body: bodyField,
        reasoning: parsed.reasoning || ''
      };
    } catch (error) {
      console.error('Error parsing AI response:', error);
      
      // Fallback: try to extract subject and body manually
      const lines = aiResponse.split('\n').filter(line => line.trim());
      const subjectLine = lines.find(line => line.toLowerCase().includes('subject:'));
      const subject = subjectLine ? subjectLine.replace(/subject:/i, '').trim() : 'Follow-up';
      
      // Use the full response as body if parsing fails
      const body = aiResponse.includes('{') ? 
        'Hi ' + (aiResponse.includes('Hi') ? aiResponse.split('Hi')[1] : aiResponse) :
        aiResponse;

      return {
        subject,
        body: body.trim(),
        reasoning: 'AI response parsing failed, using fallback format'
      };
    }
  }

  /**
   * Build Python-style prompt for email generation matching provided spec
   */
  private buildPythonStyleEmailPrompt(request: AIEmailGenerationRequest): string {
    const { contact, userProfile } = request;

    const recruiterName = contact.name || 'there';
    const companyName = contact.company || '';

    // Build a resume-like plain text block from available profile data
    const parts: string[] = [];
    if (userProfile.full_name) parts.push(`Name: ${userProfile.full_name}`);
    if (userProfile.college) parts.push(`College: ${userProfile.college}`);
    if (userProfile.title) parts.push(`Title: ${userProfile.title}`);
    if (userProfile.company) parts.push(`Current Company: ${userProfile.company}`);
    if (userProfile.experience_years !== undefined) parts.push(`Experience: ${userProfile.experience_years} years`);
    if (userProfile.skills && userProfile.skills.length > 0) parts.push(`Skills: ${userProfile.skills.join(', ')}`);
    if (userProfile.linkedin) parts.push(`LinkedIn: ${userProfile.linkedin}`);
    if (userProfile.phone) parts.push(`Phone: ${userProfile.phone}`);

    // Add a concise experience summary
    if (userProfile.experiences && userProfile.experiences.length > 0) {
      const expSummaries = userProfile.experiences.slice(0, 3).map(exp => {
        const dates: string[] = [];
        if (exp.start_date) dates.push(new Date(exp.start_date).getFullYear().toString());
        if (exp.is_current) {
          dates.push('Present');
        } else if (exp.end_date) {
          dates.push(new Date(exp.end_date).getFullYear().toString());
        }
        const dateRange = dates.length > 0 ? ` (${dates.join(' - ')})` : '';
        const achievements = exp.achievements && exp.achievements.length > 0 ? ` | Achievements: ${exp.achievements.slice(0,2).join('; ')}` : '';
        const skillsUsed = exp.skills_used && exp.skills_used.length > 0 ? ` | Skills: ${exp.skills_used.slice(0,3).join(', ')}` : '';
        return `${exp.job_title} at ${exp.company}${dateRange}${achievements}${skillsUsed}`;
      });
      parts.push(`Experience: \n- ${expSummaries.join('\n- ')}`);
    }

    const resumeDataParsed = parts.join('\n');

    const emailGenerationPrompt = `You are a professional email writer. Write an email based on the information provided below. 
The email will be sent to a recruiter, so make it crisp and to the point, without adding anything extra or made-up.

Instructions:
1. Greet the employer with "Hi" or "Hello", do not use "Dear".
2. In the first paragraph:
   - Introduce yourself using name, college, degree, and CGPA/marks (include CGPA only if >8 or marks only if >80%).
   - Mention the company name and include a short, genuine compliment (e.g., "Lovely to see what you are building at {c_name}").
3. In the second paragraph:
   - Highlight work experience/internships, publications, relevant coursework, and skills in bullet points.
   - If there are no internships or work experience, mention projects instead.
4. Politely ask if there are any relevant jobs or internships available in the domain (based on previous internships/degree) and request a meeting.
5. The signature must include: name → college/current company → LinkedIn (if available) → phone number.
6. Make the tone humble, slightly respectful, and casual.
7. Do not use bold or italics.
8. Write naturally and do not use very optimistic and those words which humans generally do not use in daily conversations, so it does not sound like it was generated by an AI.
9. Generate a subject line that looks appealing like exploring opportunities at {c_name} or would love to work at {c_name}.
10. output in json with two keys as email_body and subject and email body should be in html markdown format.
Inputs:
recruiter_name: {r_name}
resume_data_parsed: {resume_data_parsed}
company_name: {c_name}`;

    // Fill template
    const filled = emailGenerationPrompt
      .replace(/{r_name}/g, recruiterName)
      .replace(/{c_name}/g, companyName)
      .replace(/{resume_data_parsed}/g, resumeDataParsed || '');

    return filled;
  }

  /**
   * Legacy method for backward compatibility
   * WARNING: This method uses static template data and hardcoded information.
   * For AI-generated personalized emails using real user data, use generateAIEmail() instead.
   */
  async generateEmailContent(companyName: string, founderName: string): Promise<{ subject: string; body: string }> {
    const template = {
      subject: `Partnership Opportunity - ${companyName}`,
      body: `Hi ${founderName},

I hope this email finds you well. I'm reaching out because I believe there might be a great opportunity for collaboration between ${companyName} and Hirebuddy.

Hirebuddy is a job search and automation platform with a growing community of 10,000+ students and working professionals. We collaborate with top-tier institutions like Master's Union and Tetr School of Business, and have successfully helped numerous companies hire qualified talent quickly and efficiently.

I'd love to explore how we can work together to help ${companyName} find the right talent while providing our community with exciting opportunities.

Would you be open to a brief 15-minute call this week to discuss this further?

Best regards,
Sarvagya Kulshreshtha
Co-Founder, Hirebuddy (https://hirebuddy.net)
Phone: +91 92893 93231
Email: kulshreshthasarv@gmail.com`
    };

    return template;
  }

  /**
   * Validate email address format
   */
  isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Format email body as plain text with proper structure and spacing for email clients
   */
  formatAsPlainText(plainText: string): string {
    if (!plainText || typeof plainText !== 'string') {
      return 'No content provided';
    }

    // Clean the input text
    let cleanText = plainText.trim();
    
    // Handle different line break patterns that AI might use
    cleanText = cleanText
      // Normalize various line break patterns
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n')
      // Handle multiple consecutive line breaks (more than 2)
      .replace(/\n{3,}/g, '\n\n')
      // Clean up any trailing whitespace on lines
      .replace(/[ \t]+$/gm, '');

    // Split into paragraphs and ensure proper spacing
    const paragraphs = cleanText.split(/\n\n+/).filter(p => p.trim().length > 0);
    
    // Join paragraphs with double line breaks for proper email formatting
    return paragraphs.join('\n\n');
  }

  /**
   * Format email body as HTML with proper structure and spacing
   */
  formatAsHtml(plainText: string): string {
    if (!plainText || typeof plainText !== 'string') {
      return '<p>No content provided</p>';
    }

    // Clean the input text
    let cleanText = plainText.trim();
    
    // Handle different line break patterns that AI might use
    cleanText = cleanText
      // Normalize various line break patterns
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n')
      // Handle multiple consecutive line breaks (more than 2)
      .replace(/\n{3,}/g, '\n\n')
      // Clean up any trailing whitespace on lines
      .replace(/[ \t]+$/gm, '');

    // Split into paragraphs based on double line breaks
    const paragraphs = cleanText.split(/\n\n+/);
    
    // Process each paragraph
    const formattedParagraphs = paragraphs
      .filter(paragraph => paragraph.trim().length > 0)
      .map(paragraph => {
        // Handle single line breaks within paragraphs as soft breaks
        const formattedParagraph = paragraph
          .trim()
          .replace(/\n/g, '<br>')
          // Handle common email elements
          .replace(/^(Best regards|Best,|Sincerely,|Thanks,|Thank you,|Regards,)/i, '<br><br>$1')
          // Handle signature separators
          .replace(/^--$/gm, '<br>--<br>')
          // Handle bullet points or numbered lists
          .replace(/^[\s]*[-*•]\s+/gm, '&nbsp;&nbsp;• ')
          .replace(/^[\s]*(\d+\.)\s+/gm, '&nbsp;&nbsp;$1 ')
          // Handle email addresses and URLs (make them clickable)
          .replace(/(https?:\/\/[^\s<>"{}|\\^`[\]]+)/gi, '<a href="$1" style="color: #0066cc; text-decoration: underline;">$1</a>')
          .replace(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/gi, '<a href="mailto:$1" style="color: #0066cc; text-decoration: underline;">$1</a>');

        return `<p style="margin: 0 0 16px 0; line-height: 1.5;">${formattedParagraph}</p>`;
      });

    // Wrap in a container with proper email styling
    const emailBody = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 14px; line-height: 1.6; color: #333333; max-width: 600px; margin: 0; padding: 0;">
        ${formattedParagraphs.join('')}
      </div>
    `.trim();

    return emailBody;
  }

  /**
   * Generate a preview of how the email will look when formatted as HTML
   */
  previewEmailHtml(plainText: string): string {
    const formattedHtml = this.formatAsHtml(plainText);
    
    // Add additional styling for preview purposes
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Email Preview</title>
        <style>
          body {
            margin: 0;
            padding: 20px;
            background-color: #f5f5f5;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          }
          .email-container {
            background-color: white;
            border-radius: 8px;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
            padding: 0;
            margin: 0 auto;
            max-width: 600px;
          }
          .email-header {
            background-color: #f8f9fa;
            padding: 16px 24px;
            border-bottom: 1px solid #e9ecef;
            border-radius: 8px 8px 0 0;
            font-weight: 600;
            color: #495057;
          }
          .email-body {
            padding: 24px;
          }
        </style>
      </head>
      <body>
        <div class="email-container">
          <div class="email-header">Email Preview</div>
          <div class="email-body">
            ${formattedHtml}
          </div>
        </div>
      </body>
      </html>
    `.trim();
  }

  /**
   * Get properly formatted email content for sending
   * Uses plain text formatting for better compatibility until HTML backend support is confirmed
   */
  getFormattedEmailContent(plainTextBody: string, useHtml: boolean = this.useHtmlEmails): string {
    if (!useHtml) {
      return this.formatAsPlainText(plainTextBody);
    }
    const looksLikeHtml = /<\s*(p|br|div|ul|ol|li|a|strong|em|span|table|h[1-6])\b/i.test(plainTextBody);
    if (looksLikeHtml) {
      return this.wrapHtmlEmail(plainTextBody);
    }
    return this.formatAsHtml(plainTextBody);
  }

  /**
   * Sanitize and normalize existing HTML (strip scripts/styles, bold/italics per prompt, normalize breaks)
   */
  private sanitizeAndNormalizeHtml(html: string): string {
    let result = (html || '').trim();
    // Remove script and style blocks completely
    result = result.replace(/<\s*(script|style)[^>]*>[\s\S]*?<\s*\/\s*\1\s*>/gi, '');
    // Remove bold/italic tags but keep inner text (prompt requires no bold/italics)
    result = result.replace(/<\/?(b|strong|em|i)\b[^>]*>/gi, '');
    // Normalize <br> variations
    result = result.replace(/<br\s*\/?\s*>/gi, '<br>');
    return result;
  }

  /**
   * Wrap provided HTML inside a styled email container after sanitizing/normalizing
   */
  private wrapHtmlEmail(innerHtml: string): string {
    const safeInner = this.sanitizeAndNormalizeHtml(innerHtml);
    const emailBody = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 14px; line-height: 1.6; color: #333333; max-width: 600px; margin: 0; padding: 0;">
        ${safeInner}
      </div>
    `.trim();
    return emailBody;
  }

  /**
   * Check if HTML emails are enabled
   */
  isHtmlEmailsEnabled(): boolean {
    return this.useHtmlEmails;
  }

  /**
   * Enable or disable HTML emails (for when backend support is ready)
   */
  setHtmlEmailsEnabled(enabled: boolean): void {
    this.useHtmlEmails = enabled;
  }
}

export const emailService = new EmailService();
export default emailService; 