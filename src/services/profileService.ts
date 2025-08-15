import { supabase } from '@/lib/supabase';

export interface UserProfile {
  id?: string;
  user_id?: string;
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
  degree?: string;
  skills?: string[];
  experience_years?: number;
  available_for_work?: boolean;
  profile_image_url?: string;
  resume_url?: string;
  resume_filename?: string;
  resume_uploaded_at?: string;
  created_at?: string;
  updated_at?: string;
  // New onboarding fields
  preferred_roles?: string[];
  experience_level?: 'student' | 'entry' | 'mid' | 'senior' | 'leadership';
  work_mode?: 'remote' | 'hybrid' | 'onsite';
  salary_min?: number;
  salary_max?: number;
  salary_currency?: string;
  career_goals?: string[];
  onboarding_completed?: boolean;
  onboarding_completed_at?: string;
  job_search_urgency?: 'rush' | 'open';
}

export interface UserExperience {
  id?: string;
  user_id?: string;
  job_title: string;
  company: string;
  location?: string;
  start_date?: string;
  end_date?: string;
  is_current?: boolean;
  description?: string;
  achievements?: string[];
  skills_used?: string[];
  display_order?: number;
  created_at?: string;
  updated_at?: string;
}

export class ProfileService {
  // Get user profile
  static async getProfile(userId: string): Promise<UserProfile | null> {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No profile found, return null
          return null;
        }
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error fetching profile:', error);
      throw error;
    }
  }

  // Create or update user profile
  static async upsertProfile(userId: string, profileData: Partial<UserProfile>): Promise<UserProfile> {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .upsert({
          user_id: userId,
          ...profileData,
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      return data;
    } catch (error) {
      console.error('Error upserting profile:', error);
      throw error;
    }
  }

  // Update specific profile fields
  static async updateProfile(userId: string, updates: Partial<UserProfile>): Promise<UserProfile> {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .select()
        .single();

      if (error) throw error;

      return data;
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  }

  // Helper method to delete old file from storage
  private static async deleteOldFile(bucket: string, oldUrl?: string, userId?: string): Promise<void> {
    if (!oldUrl || !userId) return;
    
    try {
      const urlParts = oldUrl.split('/');
      const fileName = urlParts[urlParts.length - 1];
      const filePath = `${userId}/${fileName}`;
      
      await supabase.storage
        .from(bucket)
        .remove([filePath]);
    } catch (error) {
      console.error('Error deleting old file:', error);
    }
  }

  // Upload profile image (matching personal-profile-stash approach)
  static async uploadProfileImage(userId: string, file: File): Promise<string> {
    try {
      // Get current profile to check for existing image
      const currentProfile = await this.getProfile(userId);
      
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `${userId}/${fileName}`;

      // Delete old file if it exists
      await this.deleteOldFile('profile-pictures', currentProfile?.profile_image_url, userId);

      // Upload new file to profile-pictures bucket
      const { error: uploadError } = await supabase.storage
        .from('profile-pictures')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('profile-pictures')
        .getPublicUrl(filePath);

      // Update profile with new image URL
      await this.updateProfile(userId, { profile_image_url: publicUrl });

      return publicUrl;
    } catch (error) {
      console.error('Error uploading profile image:', error);
      throw error;
    }
  }

  // Delete profile image
  static async deleteProfileImage(userId: string, imageUrl: string): Promise<void> {
    try {
      await this.deleteOldFile('profile-pictures', imageUrl, userId);
      
      // Update profile to remove image URL
      await this.updateProfile(userId, { profile_image_url: null });
    } catch (error) {
      console.error('Error deleting profile image:', error);
      throw error;
    }
  }

  // Upload resume (matching personal-profile-stash approach)
  static async uploadResume(userId: string, file: File): Promise<{ url: string; filename: string }> {
    try {
      // Get current profile to check for existing resume
      const currentProfile = await this.getProfile(userId);
      
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `${userId}/${fileName}`;

      // Delete old file if it exists
      await this.deleteOldFile('resumes', currentProfile?.resume_url, userId);

      // Upload new file to resumes bucket
      const { error: uploadError } = await supabase.storage
        .from('resumes')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('resumes')
        .getPublicUrl(filePath);

      // Update profile with new resume URL and filename
      await this.updateProfile(userId, { 
        resume_url: publicUrl,
        resume_filename: file.name,
        resume_uploaded_at: new Date().toISOString()
      });

      return { url: publicUrl, filename: file.name };
    } catch (error) {
      console.error('Error uploading resume:', error);
      throw error;
    }
  }

  // Delete resume
  static async deleteResume(userId: string, resumeUrl: string): Promise<void> {
    try {
      await this.deleteOldFile('resumes', resumeUrl, userId);
      
      // Update profile to remove resume data
      await this.updateProfile(userId, { 
        resume_url: null,
        resume_filename: null,
        resume_uploaded_at: null
      });
    } catch (error) {
      console.error('Error deleting resume:', error);
      throw error;
    }
  }

  // Download resume
  static async downloadResume(resumeUrl: string, filename: string): Promise<void> {
    try {
      const response = await fetch(resumeUrl);
      const blob = await response.blob();
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading resume:', error);
      throw error;
    }
  }

  // Utility method to clean up orphaned files (optional, for maintenance)
  static async cleanupOrphanedFiles(userId: string): Promise<void> {
    try {
      const profile = await this.getProfile(userId);
      if (!profile) return;

      // List all files for this user in both buckets
      const [profileFiles, resumeFiles] = await Promise.all([
        supabase.storage.from('profile-pictures').list(userId),
        supabase.storage.from('resumes').list(userId)
      ]);

      // Clean up profile images
      if (profileFiles.data) {
        const currentImageFile = profile.profile_image_url ? 
          profile.profile_image_url.split('/').pop() : null;
        
        const filesToDelete = profileFiles.data
          .filter(file => file.name !== currentImageFile)
          .map(file => `${userId}/${file.name}`);

        if (filesToDelete.length > 0) {
          await supabase.storage.from('profile-pictures').remove(filesToDelete);
        }
      }

      // Clean up resume files
      if (resumeFiles.data) {
        const currentResumeFile = profile.resume_url ? 
          profile.resume_url.split('/').pop() : null;
        
        const filesToDelete = resumeFiles.data
          .filter(file => file.name !== currentResumeFile)
          .map(file => `${userId}/${file.name}`);

        if (filesToDelete.length > 0) {
          await supabase.storage.from('resumes').remove(filesToDelete);
        }
      }
    } catch (error) {
      console.error('Error cleaning up orphaned files:', error);
      // Don't throw error as this is a maintenance operation
    }
  }

  // Experience Management Methods

  // Get all experiences for a user
  static async getUserExperiences(userId: string): Promise<UserExperience[]> {
    try {
      const { data, error } = await supabase
        .from('user_experiences')
        .select('*')
        .eq('user_id', userId)
        .order('display_order', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('Error fetching user experiences:', error);
      throw error;
    }
  }

  // Create a new experience
  static async createExperience(userId: string, experience: Omit<UserExperience, 'id' | 'user_id' | 'created_at' | 'updated_at'>): Promise<UserExperience> {
    try {
      const { data, error } = await supabase
        .from('user_experiences')
        .insert({
          user_id: userId,
          ...experience
        })
        .select()
        .single();

      if (error) throw error;

      return data;
    } catch (error) {
      console.error('Error creating experience:', error);
      throw error;
    }
  }

  // Update an experience
  static async updateExperience(experienceId: string, updates: Partial<UserExperience>): Promise<UserExperience> {
    try {
      const { data, error } = await supabase
        .from('user_experiences')
        .update(updates)
        .eq('id', experienceId)
        .select()
        .single();

      if (error) throw error;

      return data;
    } catch (error) {
      console.error('Error updating experience:', error);
      throw error;
    }
  }

  // Delete an experience
  static async deleteExperience(experienceId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('user_experiences')
        .delete()
        .eq('id', experienceId);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting experience:', error);
      throw error;
    }
  }

  // Reorder experiences
  static async reorderExperiences(userId: string, experienceIds: string[]): Promise<void> {
    try {
      const updates = experienceIds.map((id, index) => ({
        id,
        display_order: experienceIds.length - index // Higher number = more recent
      }));

      for (const update of updates) {
        await supabase
          .from('user_experiences')
          .update({ display_order: update.display_order })
          .eq('id', update.id)
          .eq('user_id', userId);
      }
    } catch (error) {
      console.error('Error reordering experiences:', error);
      throw error;
    }
  }
} 