import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export interface ProfileCompletionData {
  full_name?: string;
  location?: string;
  phone?: string;
  bio?: string;
  skills?: string[];
  college?: string;
  degree?: string;
  linkedin?: string;
  github?: string;
  website?: string;
  resume_url?: string;
  experience_years?: number;
  title?: string;
  company?: string;
}

export interface ExperienceData {
  job_title: string;
  company: string;
  location?: string;
  start_date?: string;
  end_date?: string;
  is_current?: boolean;
  description?: string;
  achievements?: string[];
  skills_used?: string[];
}

/**
 * Calculate profile completion percentage based on profile data and experiences
 * IMPORTANT: Without resume upload, completion is capped at 80% to enforce resume requirement
 * @param profile - User profile data
 * @param experiences - User experiences array
 * @returns Profile completion percentage (0-100)
 */
export function calculateProfileCompletion(
  profile: ProfileCompletionData | null, 
  experiences: ExperienceData[] = []
): number {
  if (!profile) return 0;
  
  const fields = [
    { key: 'full_name', weight: 15 },
    { key: 'location', weight: 10 },
    { key: 'phone', weight: 10 },
    { key: 'bio', weight: 20 },
    { key: 'skills', weight: 15 },
    { key: 'college', weight: 8 },
    { key: 'degree', weight: 7 },
    { key: 'linkedin', weight: 5 },
    { key: 'github', weight: 5 },
    { key: 'website', weight: 5 },
    { key: 'resume_url', weight: 15 }
  ];
  
  let completedWeight = 0;
  const totalWeight = fields.reduce((sum, field) => sum + field.weight, 0);
  
  fields.forEach(field => {
    const value = profile[field.key as keyof ProfileCompletionData];
    if (value) {
      if (Array.isArray(value) && value.length > 0) {
        completedWeight += field.weight;
      } else if (typeof value === 'string' && value.trim().length > 0) {
        completedWeight += field.weight;
      } else if (typeof value === 'boolean' || typeof value === 'number') {
        completedWeight += field.weight;
      }
    }
  });
  
  // Add experience weight (10% for having at least one experience)
  if (experiences && experiences.length > 0) {
    completedWeight += 10;
  }
  
  const completionPercentage = Math.round((completedWeight / (totalWeight + 10)) * 100);
  
  // CRITICAL: Cap completion at 80% if no resume is uploaded
  // This ensures users must upload resume to reach 85% threshold for cold emails and auto-apply
  if (!profile.resume_url && completionPercentage >= 80) {
    return 80;
  }
  
  return completionPercentage;
}

/**
 * Check if user profile meets minimum completion percentage for email sending
 * @param profile - User profile data
 * @param experiences - User experiences array
 * @param minPercentage - Minimum required completion percentage (default: 85)
 * @returns Object with canSendEmail boolean and completion percentage
 */
export function checkEmailPermission(
  profile: ProfileCompletionData | null, 
  experiences: ExperienceData[] = [],
  minPercentage: number = 85
): { canSendEmail: boolean; completionPercentage: number; missingFields: string[] } {
  const completionPercentage = calculateProfileCompletion(profile, experiences);
  const canSendEmail = completionPercentage >= minPercentage;
  
  // Identify missing important fields
  const missingFields: string[] = [];
  if (!profile) {
    missingFields.push('profile');
    return { canSendEmail: false, completionPercentage: 0, missingFields };
  }
  
  const importantFields = [
    { key: 'full_name', label: 'Full Name' },
    { key: 'bio', label: 'Bio/Summary' },
    { key: 'skills', label: 'Skills' },
    { key: 'resume_url', label: 'Resume' },
    { key: 'location', label: 'Location' },
    { key: 'phone', label: 'Phone Number' }
  ];
  
  importantFields.forEach(field => {
    const value = profile[field.key as keyof ProfileCompletionData];
    if (!value || (Array.isArray(value) && value.length === 0) || 
        (typeof value === 'string' && value.trim().length === 0)) {
      missingFields.push(field.label);
    }
  });
  
  if (!experiences || experiences.length === 0) {
    missingFields.push('Work Experience');
  }
  
  return { canSendEmail, completionPercentage, missingFields };
}

/**
 * Check if user profile meets minimum completion percentage for job applications
 * @param profile - User profile data
 * @param experiences - User experiences array
 * @param minPercentage - Minimum required completion percentage (default: 85)
 * @returns Object with canApply boolean and completion percentage
 */
export function checkJobApplicationPermission(
  profile: ProfileCompletionData | null, 
  experiences: ExperienceData[] = [],
  minPercentage: number = 85
): { canApply: boolean; completionPercentage: number; missingFields: string[] } {
  const completionPercentage = calculateProfileCompletion(profile, experiences);
  const canApply = completionPercentage >= minPercentage;
  
  // Identify missing important fields
  const missingFields: string[] = [];
  if (!profile) {
    missingFields.push('profile');
    return { canApply: false, completionPercentage: 0, missingFields };
  }
  
  const importantFields = [
    { key: 'full_name', label: 'Full Name' },
    { key: 'bio', label: 'Bio/Summary' },
    { key: 'skills', label: 'Skills' },
    { key: 'resume_url', label: 'Resume' },
    { key: 'location', label: 'Location' },
    { key: 'phone', label: 'Phone Number' }
  ];
  
  importantFields.forEach(field => {
    const value = profile[field.key as keyof ProfileCompletionData];
    if (!value || (Array.isArray(value) && value.length === 0) || 
        (typeof value === 'string' && value.trim().length === 0)) {
      missingFields.push(field.label);
    }
  });
  
  if (!experiences || experiences.length === 0) {
    missingFields.push('Work Experience');
  }
  
  return { canApply, completionPercentage, missingFields };
}

/**
 * Check if user is a new user (first time signup)
 * @param user - Supabase user object
 * @returns boolean indicating if this is a new user
 */
export function isNewUser(user: any): boolean {
  if (!user) return false;
  
  const createdAt = new Date(user.created_at);
  const now = new Date();
  const timeDiff = now.getTime() - createdAt.getTime();
  const minutesSinceCreation = timeDiff / (1000 * 60);
  
  // Consider user "new" if account was created within the last 5 minutes
  return minutesSinceCreation <= 5;
}
