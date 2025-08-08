import * as pdfjsLib from 'pdfjs-dist';
import { Resume, ResumeWorkExperience, ResumeEducation, ResumeSkills } from '../types/resume';

// Set the worker source for PDF.js
pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';

export class OpenAIResumeParser {
  private openaiApiKey: string;

  constructor() {
    // Get OpenAI API key from environment variable (without VITE prefix)
    this.openaiApiKey = (process.env.NEXT_PUBLIC_OPENAI_API_KEY || process.env.OPENAI_API_KEY || process.env.VITE_OPENAI_API_KEY || '') as string;
    
    if (!this.openaiApiKey) {
      console.warn('OpenAI API key not found. Resume parsing may not work.');
    }
  }

  /**
   * Extract text content from PDF file with better error handling
   * Supports both File objects and file URLs (strings)
   */
  private async extractTextFromPDF(fileInput: File | string): Promise<string> {
    try {
      console.log('Starting PDF text extraction...');
      
      let arrayBuffer: ArrayBuffer;
      let fileType: string = '';
      let fileSize: number = 0;

      if (typeof fileInput === 'string') {
        // Handle file URL
        console.log('Loading PDF from URL:', fileInput);
        
        try {
          const response = await fetch(fileInput);
          if (!response.ok) {
            throw new Error(`Failed to fetch PDF from URL: ${response.status} ${response.statusText}`);
          }
          
          arrayBuffer = await response.arrayBuffer();
          fileType = response.headers.get('content-type') || '';
          fileSize = arrayBuffer.byteLength;
          
          // For blob URLs, we need to check the actual content
          if (!fileType || !fileType.includes('pdf')) {
            // Try to detect PDF by checking the file header
            const uint8Array = new Uint8Array(arrayBuffer.slice(0, 4));
            const header = Array.from(uint8Array).map(b => String.fromCharCode(b)).join('');
            if (header !== '%PDF') {
              throw new Error('File does not appear to be a valid PDF');
            }
          }
        } catch (fetchError) {
          console.error('Error fetching file from URL:', fetchError);
          throw new Error('Failed to load PDF file. Please try uploading the file again.');
        }
      } else {
        // Handle File object
        console.log('Processing File object:', fileInput.name);
        console.log('File type:', fileInput.type);
        console.log('File size:', fileInput.size);
        
        fileType = fileInput.type || '';
        fileSize = fileInput.size;

        if (fileType && !fileType.includes('pdf')) {
          throw new Error('File must be a PDF');
        }

        arrayBuffer = await fileInput.arrayBuffer();
      }

      console.log('File type:', fileType);
      console.log('File size:', fileSize);

      if (fileSize > 10 * 1024 * 1024) { // 10MB limit
        throw new Error('PDF file is too large (max 10MB)');
      }

      console.log('ArrayBuffer created, size:', arrayBuffer.byteLength);

      // Configure PDF.js with better error handling
      const loadingTask = pdfjsLib.getDocument({
        data: arrayBuffer,
        verbosity: 0, // Reduce console noise
        disableFontFace: true, // Helps with compatibility
        useSystemFonts: true
      });

      const pdf = await loadingTask.promise;
      console.log('PDF loaded successfully, pages:', pdf.numPages);

      let fullText = '';

      for (let i = 1; i <= pdf.numPages; i++) {
        try {
          console.log(`Processing page ${i}/${pdf.numPages}`);
          const page = await pdf.getPage(i);
          const textContent = await page.getTextContent();
          
          const pageText = textContent.items
            .filter((item: any) => item.str && item.str.trim()) // Filter out empty strings
            .map((item: any) => item.str.trim())
            .join(' ');
          
          if (pageText.trim()) {
            fullText += pageText + '\n\n';
          }
        } catch (pageError) {
          console.warn(`Error processing page ${i}:`, pageError);
          // Continue with other pages even if one fails
        }
      }

      const result = fullText.trim();
      console.log('Text extraction completed. Length:', result.length);
      
      if (!result) {
        throw new Error('No readable text found in the PDF. The PDF might be image-based or corrupted.');
      }

      return result;
    } catch (error) {
      console.error('Error extracting text from PDF:', error);
      
      if (error instanceof Error) {
        if (error.message.includes('Invalid PDF')) {
          throw new Error('The uploaded file appears to be corrupted or not a valid PDF. Please try uploading a different PDF file.');
        } else if (error.message.includes('password')) {
          throw new Error('The PDF is password-protected. Please upload an unprotected PDF file.');
        } else {
          throw new Error(error.message);
        }
      }
      
      throw new Error('Failed to extract text from PDF. Please ensure the PDF is not corrupted and try again.');
    }
  }

  /**
   * Make request to OpenAI API directly
   */
  private async makeOpenAIRequest(messages: any[], temperature = 0.1): Promise<string> {
    try {
      if (!this.openaiApiKey) {
        throw new Error('OpenAI API key is not configured. Please check your environment variables.');
      }

      console.log('Making request to OpenAI API...');

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.openaiApiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages,
          temperature,
          max_tokens: 2000,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { error: { message: errorText } };
        }
        
        if (response.status === 401) {
          throw new Error('Invalid OpenAI API key. Please check your configuration.');
        } else if (response.status === 429) {
          throw new Error('OpenAI API rate limit exceeded. Please try again in a few minutes.');
        } else if (response.status === 503) {
          throw new Error('OpenAI API is currently unavailable. Please try again later.');
        }
        
        throw new Error(errorData.error?.message || `OpenAI API error: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.choices || !data.choices[0] || !data.choices[0].message) {
        throw new Error('Invalid response format from OpenAI API');
      }

      console.log('OpenAI API request completed successfully');
      return data.choices[0].message.content;
    } catch (error) {
      console.error('Error making OpenAI request:', error);
      throw error;
    }
  }

  /**
   * Parse resume text using OpenAI
   */
  private async parseResumeWithAI(resumeText: string): Promise<any> {
    const prompt = `
You are an expert resume parser. Extract and structure the following resume text into a comprehensive JSON format.

RESUME TEXT:
${resumeText}

Please extract ALL available information and structure it into the following JSON format. If a section is not present or information is not available, use empty arrays or empty strings as appropriate:

{
  "profile": {
    "name": "Full name of the person",
    "email": "Email address",
    "phone": "Phone number",
    "location": "City, State or full address",
    "url": "Primary website/portfolio URL (extract the main one, not LinkedIn/GitHub)",
    "linkedin": "LinkedIn profile URL or username (separate from main URL)",
    "github": "GitHub profile URL or username (separate from main URL)",
    "summary": "Professional summary or objective statement"
  },
  "workExperiences": [
    {
      "company": "Company name",
      "jobTitle": "Job title/position",
      "date": "Employment dates (e.g., 'Jan 2020 - Present' or '2020-2022')",
      "jobDescription": "Brief overview of the role and main responsibilities (2-3 sentences max)",
      "achievements": ["Specific achievement with quantifiable results", "Another measurable accomplishment", "Key contribution or impact"]
    }
  ],
  "educations": [
    {
      "school": "Institution name",
      "degree": "Degree type and field of study",
      "date": "Graduation date or date range",
      "gpa": "GPA if mentioned",
      "coursework": ["Relevant coursework item 1", "Relevant coursework item 2"],
      "honors": ["Academic honors", "Dean's List", "Magna Cum Laude"],
      "activities": ["Student organizations", "Academic projects", "Leadership roles"]
    }
  ],
  "skills": {
    "programmingLanguages": ["JavaScript", "Python", "Java", "C++", "TypeScript", "Go", "Rust", "Swift", "Kotlin"],
    "frameworks": ["React", "Angular", "Vue", "Node.js", "Express", "Django", "Spring", "Laravel", "Flutter"],
    "technicalSkills": ["AWS", "Docker", "Kubernetes", "Git", "SQL", "MongoDB", "Redis", "GraphQL", "REST APIs"],
    "softSkills": ["Leadership", "Communication", "Problem Solving", "Team Collaboration", "Project Management"],
    "tools": ["VS Code", "IntelliJ", "Figma", "Photoshop", "Jira", "Slack", "Trello"]
  },
  "projects": [
    {
      "project": "Project name",
      "date": "Project date or date range",
      "descriptions": ["Project description", "Technologies used", "Key achievements"]
    }
  ],
  "certifications": [
    {
      "name": "Certification name",
      "issuer": "Issuing organization",
      "date": "Date obtained",
      "expiryDate": "Expiry date if mentioned",
      "credentialId": "Credential ID if mentioned"
    }
  ],
  "languages": [
    {
      "language": "Language name",
      "proficiency": "Proficiency level (e.g., Native, Fluent, Intermediate, Basic)"
    }
  ],
  "volunteers": [
    {
      "organization": "Organization name",
      "role": "Volunteer role/position",
      "date": "Date range of volunteer work",
      "descriptions": ["Description of volunteer work", "Achievements"]
    }
  ],
  "awards": [
    {
      "title": "Award or honor title",
      "issuer": "Issuing organization",
      "date": "Date received",
      "description": "Description of the award"
    }
  ]
}

CRITICAL PARSING INSTRUCTIONS:

1. CONTACT INFORMATION:
   - Extract email, phone, and location from header/contact section
   - For URLs: Separate LinkedIn, GitHub, and main website/portfolio URLs
   - LinkedIn: Look for linkedin.com/in/ patterns
   - GitHub: Look for github.com/ patterns  
   - Main URL: Portfolio, personal website, or other professional URLs

2. WORK EXPERIENCE - SEPARATE JOB DESCRIPTION FROM ACHIEVEMENTS:
   - jobDescription: Brief role overview and main responsibilities (avoid bullet points)
   - achievements: Specific accomplishments with numbers, metrics, or measurable impact
   - DO NOT duplicate content between jobDescription and achievements
   - achievements should be quantifiable results, not general responsibilities

3. EDUCATION - CATEGORIZE DESCRIPTIONS PROPERLY:
   - coursework: Only actual course names or academic subjects
   - honors: Academic achievements like "Dean's List", "Magna Cum Laude", "Summa Cum Laude"
   - activities: Student organizations, clubs, leadership roles, academic projects
   - DO NOT put everything in one array - categorize appropriately

4. SKILLS - INTELLIGENT CATEGORIZATION:
   - programmingLanguages: Only actual programming languages
   - frameworks: Libraries, frameworks, and development platforms
   - technicalSkills: Tools, databases, cloud services, methodologies
   - softSkills: Interpersonal and management skills
   - tools: Software applications and development tools
   - DO NOT put all skills in one category

5. GENERAL RULES:
   - Extract ALL information present in the resume
   - Break down long paragraphs into individual bullet points
   - Standardize date formats but keep original meaning
   - Make reasonable inferences based on context
   - Ensure JSON is valid and properly formatted
   - Do not add information not present in the resume

Return ONLY the JSON object, no additional text or explanation.
`;

    try {
      const messages = [
        { role: 'system', content: 'You are an expert resume parser. Always respond with valid JSON only.' },
        { role: 'user', content: prompt }
      ];
      const aiResponse = await this.makeOpenAIRequest(messages);
      
      // Clean and parse the JSON response
      const cleanedResponse = aiResponse.trim();
      const jsonMatch = cleanedResponse.match(/\{[\s\S]*\}/);
      const jsonString = jsonMatch ? jsonMatch[0] : cleanedResponse;
      
      return JSON.parse(jsonString);
    } catch (error) {
      console.error('Error parsing resume with AI:', error);
      throw new Error('Failed to parse resume with AI. Please try again.');
    }
  }

  /**
   * Convert OpenAI response to Resume type
   */
    private convertToResumeType(aiResponse: any): Resume {
    return {
      profile: {
        name: aiResponse.profile?.name || '',
        email: aiResponse.profile?.email || '',
        phone: aiResponse.profile?.phone || '',
        url: aiResponse.profile?.url || '',
        linkedin: aiResponse.profile?.linkedin || '',
        github: aiResponse.profile?.github || '',
        summary: aiResponse.profile?.summary || '',
        location: aiResponse.profile?.location || ''
      },
      workExperiences: (aiResponse.workExperiences || []).map((exp: any) => ({
        company: exp.company || '',
        jobTitle: exp.jobTitle || '',
        date: exp.date || '',
        jobDescription: exp.jobDescription || '',
        achievements: exp.achievements || [],
        descriptions: exp.achievements || [] // Backward compatibility
      })),
      educations: (aiResponse.educations || []).map((edu: any) => ({
        school: edu.school || '',
        degree: edu.degree || '',
        date: edu.date || '',
        gpa: edu.gpa || '',
        coursework: edu.coursework || [],
        honors: edu.honors || [],
        activities: edu.activities || [],
        descriptions: [...(edu.coursework || []), ...(edu.honors || []), ...(edu.activities || [])] // Backward compatibility
      })),
      projects: (aiResponse.projects || []).map((proj: any) => ({
        project: proj.project || '',
        date: proj.date || '',
        descriptions: proj.descriptions || []
      })),
      skills: {
        programmingLanguages: aiResponse.skills?.programmingLanguages || [],
        frameworks: aiResponse.skills?.frameworks || [],
        technicalSkills: aiResponse.skills?.technicalSkills || [],
        softSkills: aiResponse.skills?.softSkills || [],
        tools: aiResponse.skills?.tools || [],
        featuredSkills: [], // Backward compatibility
        descriptions: [
          ...(aiResponse.skills?.programmingLanguages || []),
          ...(aiResponse.skills?.frameworks || []),
          ...(aiResponse.skills?.technicalSkills || []),
          ...(aiResponse.skills?.softSkills || []),
          ...(aiResponse.skills?.tools || [])
        ] // Backward compatibility
      },
      awards: (aiResponse.awards || []).map((award: any) => ({
        title: award.title || '',
        issuer: award.issuer || '',
        date: award.date || '',
        description: award.description || ''
      })),
      volunteers: (aiResponse.volunteers || []).map((vol: any) => ({
        organization: vol.organization || '',
        role: vol.role || '',
        date: vol.date || '',
        descriptions: vol.descriptions || []
      })),
      certifications: (aiResponse.certifications || []).map((cert: any) => ({
        name: cert.name || '',
        issuer: cert.issuer || '',
        date: cert.date || '',
        expiryDate: cert.expiryDate || '',
        credentialId: cert.credentialId || ''
      })),
      languages: (aiResponse.languages || []).map((lang: any) => ({
        language: lang.language || '',
        proficiency: lang.proficiency || ''
      })),
      custom: {
        descriptions: []
      }
    };
  }

  /**
   * Main method to parse resume from PDF using OpenAI
   * Supports both File objects and file URLs (strings) for backward compatibility
   */
     async parseResumeFromPdf(fileInput: File | string): Promise<Resume> {
    try {
      console.log('Starting OpenAI-based resume parsing...');
      
      // Step 1: Extract text from PDF
      console.log('Extracting text from PDF...');
      const resumeText = await this.extractTextFromPDF(fileInput);
      
      if (!resumeText.trim()) {
        throw new Error('No text could be extracted from the PDF. Please ensure the PDF contains readable text.');
      }

      console.log('Extracted text length:', resumeText.length);
      
      // Step 2: Parse with OpenAI
      console.log('Parsing resume with OpenAI...');
      const aiResponse = await this.parseResumeWithAI(resumeText);
      
      // Step 3: Convert to Resume type
      console.log('Converting to Resume format...');
      const resume = this.convertToResumeType(aiResponse);
      
      console.log('Resume parsing completed successfully!');
      return resume;
      
    } catch (error) {
      console.error('Error in OpenAI resume parsing:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const openaiResumeParser = new OpenAIResumeParser();

// Export the main parsing function for backward compatibility
// Now supports both File objects and file URLs (strings)
export const parseResumeFromPdf = (fileInput: File | string): Promise<Resume> => {
  return openaiResumeParser.parseResumeFromPdf(fileInput);
}; 