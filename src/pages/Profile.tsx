import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { NewSidebar } from "@/components/layout/NewSidebar";
import { Separator } from "@/components/ui/separator";
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage } from "@/components/ui/breadcrumb";
import { useAuth } from "@/contexts/AuthContext";
import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { ProfileCompletionPopup } from "@/components/ui/profile-completion-warning";
import { calculateProfileCompletion, checkEmailPermission } from "@/lib/utils";
import { 
  Edit, Save, User, Briefcase, MapPin, Mail, Phone, Globe, 
  Upload, Plus, X, Loader2, AlertCircle, CheckCircle2,
  FileText, Download, Trash2, Camera, Settings, Search,
  Github, Linkedin, ExternalLink, Calendar, GraduationCap, Eye
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ProfileService, UserProfile, UserExperience } from "@/services/profileService";
import { useToast } from "@/hooks/use-toast";
import { ExperienceManager } from "@/components/profile/ExperienceManager";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const Profile = () => {
  const { user, signOut, isFirstTimeUser, markUserAsReturning } = useAuth();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [experiences, setExperiences] = useState<UserExperience[]>([]);
  const [newSkill, setNewSkill] = useState("");
  const [userName, setUserName] = useState(user?.user_metadata?.full_name || user?.email?.split('@')[0] || "User");
  const [showResumePreview, setShowResumePreview] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(true);
  const [showCompletionPopup, setShowCompletionPopup] = useState(false);
  const userInitials = userName.split(' ').map(n => n[0]).join('').toUpperCase();

  // Calculate profile completion percentage using the utility function
  const profileCompletion = calculateProfileCompletion(profile, experiences);
  
  // Get missing fields for the completion popup
  const emailPermission = checkEmailPermission(profile, experiences);

  // Update username when user auth state changes
  useEffect(() => {
    if (user) {
      setUserName(user.user_metadata?.full_name || user.email?.split('@')[0] || user.email || "User");
    }
  }, [user]);

  // Show completion popup for new users or when redirected from signup
  useEffect(() => {
    const isNewUserFromParams = searchParams.get('newUser') === 'true';
    if ((isFirstTimeUser || isNewUserFromParams) && !isLoading && profile) {
      const timer = setTimeout(() => {
        setShowCompletionPopup(true);
      }, 500); // Small delay to ensure smooth transition
      
      return () => clearTimeout(timer);
    }
  }, [isFirstTimeUser, isLoading, profile, searchParams]);

  const handleCloseCompletionPopup = () => {
    setShowCompletionPopup(false);
    markUserAsReturning();
    // Remove the newUser query parameter from URL
    if (searchParams.get('newUser')) {
      window.history.replaceState({}, '', '/profile');
    }
  };

  // Load profile data on component mount
  useEffect(() => {
    if (user?.id) {
      loadProfile();
    } else {
      // If no user, create a mock profile for demo purposes
              setProfile({
          full_name: "Demo User",
          title: "Software Developer",
          company: "Tech Company",
          location: "San Francisco, CA",
          phone: "+91 1234567890",
          bio: "Passionate software developer with experience in modern web technologies. I love building scalable applications and working with cutting-edge technologies.",
          website: "https://demouser.dev",
          github: "demouser",
          linkedin: "demouser",
          college: "IIT Bombay",
          skills: ["React", "TypeScript", "Node.js", "Python", "AWS", "Docker"],
          experience_years: 5,
          available_for_work: true,
          profile_image_url: null,
          resume_url: "/sample-resume.pdf",
          resume_filename: "Demo_User_Resume.pdf",
          resume_uploaded_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days ago
        });
      setIsLoading(false);
    }
  }, [user?.id]);

  const loadProfile = async () => {
    if (!user?.id) return;
    
    try {
      setIsLoading(true);
      
      // Try to load from database, but fallback to mock data if it fails
      try {
        const [profileData, experiencesData] = await Promise.all([
          ProfileService.getProfile(user.id),
          ProfileService.getUserExperiences(user.id)
        ]);
        
        if (profileData) {
          setProfile(profileData);
        } else {
          // Create initial profile if none exists
          const initialProfile = {
            full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || "User",
            skills: []
          };
          const newProfile = await ProfileService.upsertProfile(user.id, initialProfile);
          setProfile(newProfile);
        }
        
        setExperiences(experiencesData || []);
      } catch (dbError) {
        console.warn('Database not connected, using mock data:', dbError);
        // Fallback to mock data when database is not available
        setProfile({
          full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || "User",
          title: "",
          company: "",
          location: "",
          phone: "",
          bio: "",
          linkedin: "",
          github: "",
          website: "",
          college: "",
          skills: [],
          experience_years: 0,
          available_for_work: false,
          profile_image_url: null,
          resume_url: null,
          resume_filename: null,
          resume_uploaded_at: null
        });
        
        // Mock experience data
        setExperiences([
          {
            job_title: "Senior Software Engineer",
            company: "Tech Corp",
            location: "San Francisco, CA",
            start_date: "2022-01",
            end_date: "",
            is_current: true,
            description: "Leading development of web applications using React and Node.js",
            achievements: [
              "Improved application performance by 40%",
              "Led a team of 5 developers"
            ],
            skills_used: ["React", "Node.js", "TypeScript", "AWS"]
          }
        ]);
        
        toast({
          title: "Demo Mode",
          description: "Database not connected. Using demo data. Changes won't be saved.",
          variant: "default"
        });
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      toast({
        title: "Error",
        description: "Failed to load profile data",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: keyof UserProfile, value: any) => {
    if (!profile) return;
    setProfile({ ...profile, [field]: value });
  };

  const handleExperiencesUpdate = (updatedExperiences: UserExperience[]) => {
    // Just update local state - saving happens when user clicks "Save"
    setExperiences(updatedExperiences);
  };

  const saveExperiences = async () => {
    if (!user?.id) return;

    try {
      // Get current experiences from database to handle deletions
      const currentDbExperiences = await ProfileService.getUserExperiences(user.id);
      
      // Find experiences that were deleted (exist in DB but not in current state)
      const deletedExperiences = currentDbExperiences.filter(dbExp => 
        dbExp.id && !experiences.find(exp => exp.id === dbExp.id)
      );
      
      // Delete removed experiences
      for (const deletedExp of deletedExperiences) {
        if (deletedExp.id) {
          await ProfileService.deleteExperience(deletedExp.id);
        }
      }
      
      // Handle new experiences (without id)
      const newExperiences = experiences.filter(exp => !exp.id);
      const existingExperiences = experiences.filter(exp => exp.id);
      
      // Create new experiences
      for (const newExp of newExperiences) {
        await ProfileService.createExperience(user.id, newExp);
      }
      
      // Update existing experiences
      for (const existingExp of existingExperiences) {
        if (existingExp.id) {
          await ProfileService.updateExperience(existingExp.id, existingExp);
        }
      }
      
      // Reload experiences to get updated data with IDs
      const refreshedExperiences = await ProfileService.getUserExperiences(user.id);
      setExperiences(refreshedExperiences);
    } catch (error) {
      console.error('Error saving experiences:', error);
      throw error; // Re-throw to be handled by caller
    }
  };

  const handleSave = async () => {
    if (!profile) return;

    try {
      setIsSaving(true);
      
      if (user?.id) {
        // Try to save to database
        try {
          // Save profile data
          const updatedProfile = await ProfileService.updateProfile(user.id, profile);
          setProfile(updatedProfile);
          
          // Save experiences data
          await saveExperiences();
          
          setIsEditing(false);
          toast({
            title: "Success",
            description: "Profile and experience updated successfully",
          });
        } catch (dbError) {
          console.warn('Database not connected, saving locally only:', dbError);
          // Just update local state if database is not available
          setIsEditing(false);
          toast({
            title: "Demo Mode",
            description: "Changes saved locally only. Database not connected.",
            variant: "default"
          });
        }
      } else {
        // No user logged in, just update local state
        setIsEditing(false);
        toast({
          title: "Demo Mode",
          description: "Changes saved locally only. Please log in to save permanently.",
          variant: "default"
        });
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      toast({
        title: "Error",
        description: "Failed to save profile",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddSkill = () => {
    if (!newSkill.trim() || !profile) return;
    
    const currentSkills = profile.skills || [];
    if (!currentSkills.includes(newSkill.trim())) {
      handleInputChange('skills', [...currentSkills, newSkill.trim()]);
      setNewSkill("");
    }
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    if (!profile) return;
    const currentSkills = profile.skills || [];
    handleInputChange('skills', currentSkills.filter(skill => skill !== skillToRemove));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, fileType: 'profile_picture' | 'resume') => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (fileType === 'profile_picture') {
      handleImageUpload(file);
    } else {
      handleResumeUpload(file);
    }
  };

  const handleImageUpload = async (file: File) => {
    // Validate file type
    const allowedImageTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedImageTypes.includes(file.type)) {
      toast({
        title: "Invalid File Type",
        description: "Please upload a JPEG, PNG, WebP, or GIF image.",
        variant: "destructive"
      });
      return;
    }

    // Validate file size (5MB limit for images)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File Too Large",
        description: "Please upload an image smaller than 5MB.",
        variant: "destructive"
      });
      return;
    }

    try {
      setUploading(true);
      
      if (user?.id) {
        // Try to upload to database storage
        try {
          const imageUrl = await ProfileService.uploadProfileImage(user.id, file);
          setProfile(prev => prev ? { ...prev, profile_image_url: imageUrl } : null);
          toast({
            title: "Success",
            description: "Profile image updated successfully",
          });
        } catch (dbError) {
          console.warn('Database not connected, using local preview:', dbError);
          // Create a local preview URL for demo purposes
          const localImageUrl = URL.createObjectURL(file);
          setProfile(prev => prev ? { ...prev, profile_image_url: localImageUrl } : null);
          toast({
            title: "Demo Mode",
            description: "Image preview only. Database not connected.",
            variant: "default"
          });
        }
      } else {
        // No user logged in, just show local preview
        const localImageUrl = URL.createObjectURL(file);
        setProfile(prev => prev ? { ...prev, profile_image_url: localImageUrl } : null);
        toast({
          title: "Demo Mode",
          description: "Image preview only. Please log in to save permanently.",
          variant: "default"
        });
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      toast({
        title: "Error",
        description: "Failed to upload image",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };

  const handleResumeUpload = async (file: File) => {
    // Validate file type
    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Invalid File Type",
        description: "Please upload a PDF or Word document.",
        variant: "destructive"
      });
      return;
    }

    // Validate file size (10MB limit for resumes)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "File Too Large",
        description: "Please upload a file smaller than 10MB.",
        variant: "destructive"
      });
      return;
    }

    try {
      setUploading(true);
      
      if (user?.id) {
        // Try to upload to database storage
        try {
          const { url, filename } = await ProfileService.uploadResume(user.id, file);
          setProfile(prev => prev ? { 
            ...prev, 
            resume_url: url,
            resume_filename: filename,
            resume_uploaded_at: new Date().toISOString()
          } : null);
          toast({
            title: "Success",
            description: "Resume uploaded successfully",
          });
        } catch (dbError) {
          console.warn('Database not connected, using local preview:', dbError);
          // Create a local preview for demo purposes
          const localResumeUrl = URL.createObjectURL(file);
          setProfile(prev => prev ? { 
            ...prev, 
            resume_url: localResumeUrl,
            resume_filename: file.name,
            resume_uploaded_at: new Date().toISOString()
          } : null);
          toast({
            title: "Demo Mode",
            description: "Resume preview only. Database not connected.",
            variant: "default"
          });
        }
      } else {
        // No user logged in, just show local preview
        const localResumeUrl = URL.createObjectURL(file);
        setProfile(prev => prev ? { 
          ...prev, 
          resume_url: localResumeUrl,
          resume_filename: file.name,
          resume_uploaded_at: new Date().toISOString()
        } : null);
        toast({
          title: "Demo Mode",
          description: "Resume preview only. Please log in to save permanently.",
          variant: "default"
        });
      }
    } catch (error) {
      console.error('Error uploading resume:', error);
      toast({
        title: "Error",
        description: "Failed to upload resume",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };

  const handleResumeDownload = async () => {
    if (!profile?.resume_url || !profile?.resume_filename) return;

    try {
      if (user?.id && !profile.resume_url.startsWith('blob:')) {
        // Download from database storage
        await ProfileService.downloadResume(profile.resume_url, profile.resume_filename);
      } else {
        // For demo mode or blob URLs, create download link
        const link = document.createElement('a');
        link.href = profile.resume_url;
        link.download = profile.resume_filename || 'resume.pdf';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
      
      toast({
        title: "Success",
        description: "Resume download started",
      });
    } catch (error) {
      console.error('Error downloading resume:', error);
      toast({
        title: "Error",
        description: "Failed to download resume",
        variant: "destructive"
      });
    }
  };

  const getFileSize = (url: string): string => {
    // This is a mock function since we can't get actual file size from URL
    // In a real implementation, you'd store this info when uploading
    return "<10MB";
  };

  const getFileType = (filename: string): string => {
    const extension = filename?.split('.').pop()?.toUpperCase();
    if (extension === 'PDF') return 'PDF';
    if (extension === 'DOC' || extension === 'DOCX') return 'DOC';
    return 'FILE';
  };

  const handleResumeDelete = async () => {
    if (!profile?.resume_url || !user?.id) return;

    try {
      setUploading(true);
      
      if (!profile.resume_url.startsWith('blob:')) {
        // Delete from database storage
        await ProfileService.deleteResume(user.id, profile.resume_url);
      }
      
      // Update local state
      setProfile(prev => prev ? { 
        ...prev, 
        resume_url: null,
        resume_filename: null,
        resume_uploaded_at: null
      } : null);
      
      toast({
        title: "Success",
        description: "Resume deleted successfully",
      });
    } catch (error) {
      console.error('Error deleting resume:', error);
      toast({
        title: "Error",
        description: "Failed to delete resume",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white md:flex">
        <NewSidebar />
        <div className="flex-1 flex flex-col w-full">
          <div className="flex items-center justify-center h-[80vh]">
            <div className="flex flex-col items-center gap-4 bg-white p-8 rounded-lg shadow-sm">
              <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-sm text-gray-500">Loading your profile...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-white md:flex">
        <NewSidebar />
        <div className="flex-1 flex flex-col w-full">
          <div className="flex items-center justify-center h-[80vh]">
            <div className="text-center bg-white p-8 rounded-lg shadow-sm">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">Profile Not Found</h2>
              <p className="text-gray-600 mb-4">Unable to load your profile data.</p>
              <Button onClick={loadProfile}>
                Try Again
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white md:flex">
      <NewSidebar />
      <div className="flex-1 flex flex-col w-full">
        {/* Header */}
        <header className="hidden md:flex h-16 shrink-0 items-center justify-between px-6 border-b bg-white sticky top-0 z-10 shadow-sm">
          <div className="flex items-center gap-4">
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbPage>Profile</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
            
            <div className="flex items-center gap-4">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="rounded-full flex items-center gap-2 p-1 pl-2">
                    <span className="text-sm font-medium hidden md:inline">{userName}</span>
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={profile?.profile_image_url || user?.user_metadata?.avatar_url} />
                      <AvatarFallback>{userInitials}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>My Account</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>
                    <User className="mr-2 h-4 w-4" />
                    <span>Profile</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Settings</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => signOut?.()}>
                    Log out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>

          {/* Main Content */}
          <div className="flex flex-1 flex-col max-w-7xl mx-auto px-4 md:px-6 py-4 md:py-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">My Profile</h1>
                <p className="text-gray-600 mt-1">Manage your personal information and preferences</p>
              </div>
              <Button 
                onClick={isEditing ? handleSave : () => setIsEditing(true)}
                disabled={isSaving}
                className="min-w-[120px]"
              >
                {isSaving ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : isEditing ? (
                  <Save className="h-4 w-4 mr-2" />
                ) : (
                  <Edit className="h-4 w-4 mr-2" />
                )}
                {isSaving ? "Saving..." : isEditing ? "Save Changes" : "Edit Profile"}
              </Button>
            </div>

            {/* Profile Completion Bar */}
            <Card className="mb-6">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                    <h3 className="font-semibold text-gray-900">Profile Completion</h3>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-bold text-blue-600">{profileCompletion}%</span>
                    <p className="text-xs text-gray-500">Complete</p>
                  </div>
                </div>
                <Progress value={profileCompletion} className="h-3 mb-2" />
                <p className="text-sm text-gray-600">
                  {profileCompletion < 50 
                    ? "Complete your profile to improve your visibility to recruiters" 
                    : profileCompletion < 80 
                    ? "You're doing great! Add a few more details to maximize your profile"
                    : "Excellent! Your profile is well-optimized for opportunities"}
                </p>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column - Profile Info */}
              <div className="lg:col-span-2 space-y-6">
                {/* Basic Information */}
                <Card>
                  <CardHeader>
                    <CardTitle>Basic Information</CardTitle>
                    <CardDescription>Your personal details and contact information</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="flex items-center space-x-6">
                      <div className="relative group">
                        <Avatar className="w-20 h-20">
                          <AvatarImage src={profile?.profile_image_url || undefined} />
                          <AvatarFallback className="text-lg font-semibold">
                            {user?.email?.charAt(0).toUpperCase() || profile?.full_name?.charAt(0).toUpperCase() || "U"}
                          </AvatarFallback>
                        </Avatar>
                        {isEditing && (
                          <>
                            <Label htmlFor="profile-picture" className="absolute inset-0 cursor-pointer">
                              <div className="absolute inset-0 bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                                <Camera className="w-5 h-5 text-white" />
                              </div>
                            </Label>
                            <Input
                              id="profile-picture"
                              type="file"
                              accept="image/*"
                              onChange={(e) => handleFileUpload(e, 'profile_picture')}
                              className="hidden"
                              disabled={uploading}
                            />
                          </>
                        )}
                      </div>
                      <div className="flex-1">
                        <h3 className="text-xl font-semibold">{profile.full_name || "Your Name"}</h3>
                        
                        {profile.college && (
                          <p className="text-sm text-gray-600 flex items-center mt-1">
                            <GraduationCap className="w-3 h-3 mr-1" />
                            {profile.college}
                          </p>
                        )}
                        <p className="text-sm text-gray-500 flex items-center mt-1">
                          <Mail className="w-3 h-3 mr-1" />
                          {user?.email}
                        </p>
                        
                        
                        {/* Quick Social Links */}
                        <div className="flex items-center gap-3 mt-2">
                        {profile.linkedin && (
                            <a 
                              href={profile.linkedin.startsWith('http') ? profile.linkedin : `https://linkedin.com/in/${profile.linkedin.replace('linkedin.com/in/', '')}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-gray-500 hover:text-blue-700 transition-colors"
                              title="LinkedIn"
                            >
                              <Linkedin className="w-4 h-4" />
                            </a>
                          )}
                          {profile.github && (
                            <a 
                              href={profile.github.startsWith('http') ? profile.github : `https://github.com/${profile.github.replace('github.com/', '')}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-gray-500 hover:text-gray-900 transition-colors"
                              title="GitHub"
                            >
                              <Github className="w-4 h-4" />
                            </a>
                          )}
                          
                          {profile.website && (
                            <a 
                              href={profile.website.startsWith('http') ? profile.website : `https://${profile.website}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-gray-500 hover:text-blue-600 transition-colors"
                              title="Website"
                            >
                              <Globe className="w-4 h-4" />
                            </a>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="full_name">Full Name</Label>
                        {isEditing ? (
                          <Input
                            id="full_name"
                            value={profile.full_name || ""}
                            onChange={(e) => handleInputChange('full_name', e.target.value)}
                            placeholder="Enter your full name"
                          />
                        ) : (
                          <p className="mt-1 text-sm text-gray-900">
                            {profile.full_name || "Not set"}
                          </p>
                        )}
                      </div>

                      <div>
                        <Label htmlFor="location">Location</Label>
                        {isEditing ? (
                          <Input
                            id="location"
                            value={profile.location || ""}
                            onChange={(e) => handleInputChange('location', e.target.value)}
                            placeholder="e.g. San Francisco, CA"
                          />
                        ) : (
                          <p className="mt-1 text-sm text-gray-900 flex items-center">
                            {profile.location ? (
                              <>
                                <MapPin className="w-4 h-4 mr-1 text-gray-500" />
                                {profile.location}
                              </>
                            ) : (
                              "Not set"
                            )}
                          </p>
                        )}
                      </div>

                      <div>
                        <Label htmlFor="phone">Phone</Label>
                        {isEditing ? (
                          <Input
                            id="phone"
                            value={profile.phone || ""}
                            onChange={(e) => handleInputChange('phone', e.target.value)}
                            placeholder="Enter your phone number"
                            type="tel"
                          />
                        ) : (
                          <p className="mt-1 text-sm text-gray-900 flex items-center">
                            {profile.phone ? (
                              <>
                                <Phone className="w-4 h-4 mr-1 text-gray-500" />
                                <a href={`tel:${profile.phone}`} className="text-blue-600 hover:text-blue-800 hover:underline">
                                  {profile.phone}
                                </a>
                              </>
                            ) : (
                              "Not set"
                            )}
                          </p>
                        )}
                      </div>

                      <div>
                        <Label htmlFor="experience_years">Years of Experience</Label>
                        {isEditing ? (
                          <Input
                            id="experience_years"
                            value={profile.experience_years || ""}
                            onChange={(e) => handleInputChange('experience_years', parseInt(e.target.value) || 0)}
                            placeholder="e.g. 5"
                            type="number"
                            min="0"
                            max="50"
                          />
                        ) : (
                          <p className="mt-1 text-sm text-gray-900 flex items-center">
                            {profile.experience_years ? (
                              <>
                                <Calendar className="w-4 h-4 mr-1 text-gray-500" />
                                {profile.experience_years} {profile.experience_years === 1 ? 'year' : 'years'}
                              </>
                            ) : (
                              "Not set"
                            )}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Education Section */}
                    <div className="pt-4 border-t">
                      <h4 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
                        <GraduationCap className="w-4 h-4 mr-2 text-gray-500" />
                        Education
                      </h4>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="college">College/University</Label>
                          {isEditing ? (
                            <Input
                              id="college"
                              value={profile.college || ""}
                              onChange={(e) => handleInputChange('college', e.target.value)}
                              placeholder="e.g. Harvard University"
                            />
                          ) : (
                            <p className="mt-1 text-sm text-gray-900">
                              {profile.college || "Not set"}
                            </p>
                          )}
                        </div>
                        <div>
                          <Label htmlFor="degree">Degree</Label>
                          {isEditing ? (
                            <Input
                              id="degree"
                              value={profile.degree || ""}
                              onChange={(e) => handleInputChange('degree', e.target.value)}
                              placeholder="e.g. Bachelor of Science in Computer Science"
                            />
                          ) : (
                            <p className="mt-1 text-sm text-gray-900">
                              {profile.degree || "Not set"}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Social Links Section */}
                    <div className="pt-4 border-t">
                      <h4 className="text-sm font-medium text-gray-900 mb-3">Links & Social</h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        
                      <div>
                          <Label htmlFor="linkedin">LinkedIn</Label>
                          {isEditing ? (
                            <Input
                              id="linkedin"
                              value={profile.linkedin || ""}
                              onChange={(e) => handleInputChange('linkedin', e.target.value)}
                              placeholder="linkedin.com/in/username or username"
                            />
                          ) : (
                            <p className="mt-1 text-sm text-gray-900">
                              {profile.linkedin ? (
                                <a 
                                  href={profile.linkedin.startsWith('http') ? profile.linkedin : `https://linkedin.com/in/${profile.linkedin.replace('linkedin.com/in/', '')}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-600 hover:text-blue-800 hover:underline flex items-center"
                                >
                                  <Linkedin className="w-4 h-4 mr-1" />
                                  LinkedIn
                                  <ExternalLink className="w-3 h-3 ml-1" />
                                </a>
                              ) : (
                                "Not set"
                              )}
                            </p>
                          )}
                        </div>

                        <div>
                          <Label htmlFor="github">GitHub</Label>
                          {isEditing ? (
                            <Input
                              id="github"
                              value={profile.github || ""}
                              onChange={(e) => handleInputChange('github', e.target.value)}
                              placeholder="github.com/username or username"
                            />
                          ) : (
                            <p className="mt-1 text-sm text-gray-900">
                              {profile.github ? (
                                <a 
                                  href={profile.github.startsWith('http') ? profile.github : `https://github.com/${profile.github.replace('github.com/', '')}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-600 hover:text-blue-800 hover:underline flex items-center"
                                >
                                  <Github className="w-4 h-4 mr-1" />
                                  GitHub
                                  <ExternalLink className="w-3 h-3 ml-1" />
                                </a>
                              ) : (
                                "Not set"
                              )}
                            </p>
                          )}
                        </div>

                        <div>
                          <Label htmlFor="website">Website</Label>
                          {isEditing ? (
                            <Input
                              id="website"
                              value={profile.website || ""}
                              onChange={(e) => handleInputChange('website', e.target.value)}
                              placeholder="https://yourwebsite.com"
                              type="url"
                            />
                          ) : (
                            <p className="mt-1 text-sm text-gray-900">
                              {profile.website ? (
                                <a 
                                  href={profile.website.startsWith('http') ? profile.website : `https://${profile.website}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-600 hover:text-blue-800 hover:underline flex items-center"
                                >
                                  <Globe className="w-4 h-4 mr-1" />
                                  Website
                                  <ExternalLink className="w-3 h-3 ml-1" />
                                </a>
                              ) : (
                                "Not set"
                              )}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* About */}
                <Card>
                  <CardHeader>
                    <CardTitle>About</CardTitle>
                    <CardDescription>Tell us about yourself and your experience</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {isEditing ? (
                      <Textarea
                        value={profile.bio || ""}
                        onChange={(e) => handleInputChange('bio', e.target.value)}
                        placeholder="Tell us about yourself, your experience, and what you're passionate about..."
                        rows={4}
                      />
                    ) : (
                      <p className="text-gray-700 leading-relaxed">
                        {profile.bio || "Share your story, experience, and what makes you unique..."}
                      </p>
                    )}
                  </CardContent>
                </Card>

                {/* Skills */}
                <Card>
                  <CardHeader>
                    <CardTitle>Skills</CardTitle>
                    <CardDescription>Add your technical and professional skills</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2 mb-4">
                      {(profile.skills || []).map((skill, index) => (
                        <Badge 
                          key={skill} 
                          variant="secondary" 
                          className="px-3 py-1"
                        >
                          {skill}
                          {isEditing && (
                            <button
                              onClick={() => handleRemoveSkill(skill)}
                              className="ml-2 hover:text-red-600 transition-colors"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          )}
                        </Badge>
                      ))}
                    </div>
                    
                    {isEditing && (
                      <div className="flex space-x-2">
                        <Input
                          value={newSkill}
                          onChange={(e) => setNewSkill(e.target.value)}
                          placeholder="Add a skill..."
                          onKeyPress={(e) => e.key === 'Enter' && handleAddSkill()}
                        />
                        <Button onClick={handleAddSkill} size="sm">
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Work Experience */}
                <ExperienceManager
                  experiences={experiences}
                  onUpdate={handleExperiencesUpdate}
                  isEditing={isEditing}
                />
              </div>

              {/* Right Column - Resume & Settings */}
              <div className="space-y-6">
                {/* Resume */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="w-5 h-5 text-blue-600" />
                      Resume
                    </CardTitle>
                    <CardDescription>Upload and manage your resume</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-5">
                    {profile?.resume_url ? (
                      <>
                        {/* Resume File Display */}
                        <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                              <FileText className="w-5 h-5 text-blue-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-gray-900 truncate">
                                {profile.resume_filename}
                              </p>
                              <div className="flex items-center gap-3 mt-1.5">
                                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                                  {getFileType(profile.resume_filename || '')}
                                </span>
                                <span className="text-xs text-gray-500">
                                  {getFileSize(profile.resume_url)}
                                </span>
                                {profile.resume_uploaded_at && (
                                  <span className="text-xs text-gray-500">
                                    {new Date(profile.resume_uploaded_at).toLocaleDateString()}
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                              <span className="text-xs text-green-600 font-medium">Active</span>
                            </div>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-3 pt-1">
                          <Dialog 
                            open={showResumePreview} 
                            onOpenChange={(open) => {
                              setShowResumePreview(open);
                              if (open) setPdfLoading(true);
                            }}
                          >
                            <DialogTrigger asChild>
                              <Button variant="outline" className="flex-1">
                                <Eye className="w-4 h-4 mr-2" />
                                Preview
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-5xl w-[90vw] h-[90vh] p-0">
                              <div className="flex flex-col h-full">
                                {/* Header */}
                                <div className="flex items-center justify-between p-4 border-b bg-gray-50">
                                  <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                                      <FileText className="w-4 h-4 text-blue-600" />
                                    </div>
                                    <div>
                                      <DialogTitle className="text-lg font-semibold">
                                        {profile.resume_filename}
                                      </DialogTitle>
                                      <DialogDescription className="text-sm">
                                        Resume Preview • {getFileType(profile.resume_filename || '')} • {getFileSize(profile.resume_url)}
                                      </DialogDescription>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={handleResumeDownload}
                                    >
                                      <Download className="w-4 h-4 mr-2" />
                                      Download
                                    </Button>
                                  </div>
                                </div>

                                                                 {/* Preview Content */}
                                 <div className="flex-1 p-4 relative">
                                   {profile.resume_url.endsWith('.pdf') || profile.resume_filename?.endsWith('.pdf') ? (
                                     <>
                                       {pdfLoading && (
                                         <div className="absolute inset-4 flex items-center justify-center bg-white rounded-lg border border-gray-200">
                                           <div className="text-center">
                                             <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-3" />
                                             <p className="text-sm text-gray-600">Loading PDF preview...</p>
                                           </div>
                                         </div>
                                       )}
                                       <iframe
                                         src={`${profile.resume_url}#toolbar=1&navpanes=0&scrollbar=1&view=FitH`}
                                         className="w-full h-full border border-gray-200 rounded-lg bg-white"
                                         title="Resume Preview"
                                         onLoad={() => setPdfLoading(false)}
                                         onError={() => setPdfLoading(false)}
                                       />
                                     </>
                                   ) : (
                                     <div className="flex items-center justify-center h-full bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                                       <div className="text-center p-8">
                                         <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                           <FileText className="w-8 h-8 text-gray-400" />
                                         </div>
                                         <h4 className="font-medium text-gray-900 mb-2">Preview not available</h4>
                                         <p className="text-sm text-gray-500 mb-4">
                                           {getFileType(profile.resume_filename || '')} files cannot be previewed in the browser
                                         </p>
                                         <Button
                                           onClick={handleResumeDownload}
                                           size="sm"
                                         >
                                           <Download className="w-4 h-4 mr-2" />
                                           Download to View
                                         </Button>
                                       </div>
                                     </div>
                                   )}
                                 </div>
                              </div>
                            </DialogContent>
                          </Dialog>

                          <Button
                            variant="outline"
                            onClick={handleResumeDownload}
                          >
                            <Download className="w-4 h-4 mr-2" />
                            Download
                          </Button>

                          <Button
                            variant="outline"
                            onClick={handleResumeDelete}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </>
                    ) : (
                      <div className="text-center py-6">
                        <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-5 border-2 border-dashed border-blue-200">
                          <Upload className="w-6 h-6 text-blue-500" />
                        </div>
                        <h4 className="font-medium text-gray-900 mb-2">No resume uploaded</h4>
                        <p className="text-gray-500 text-sm mb-5">
                          Upload your resume to help recruiters find you
                        </p>
                        <div className="flex items-center justify-center gap-4 text-xs text-gray-400">
                          <span>PDF, DOC, DOCX</span>
                          <span>•</span>
                          <span>Up to 10MB</span>
                        </div>
                      </div>
                    )}
                    
                    {/* Upload Button */}
                    <div className="pt-2">
                      <Label htmlFor="resume" className="cursor-pointer">
                      <div className="flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-lg hover:bg-blue-700 transition-colors font-medium w-full">
                        {uploading ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Uploading...
                          </>
                        ) : (
                          <>
                            <Upload className="w-4 h-4" />
                            {profile?.resume_url ? 'Replace Resume' : 'Upload Resume'}
                          </>
                        )}
                                              </div>
                      </Label>
                      <Input
                        id="resume"
                        type="file"
                        accept=".pdf,.doc,.docx"
                        onChange={(e) => handleFileUpload(e, 'resume')}
                        className="hidden"
                        disabled={uploading}
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Account Settings */}
                <Card>
                  <CardHeader>
                    <CardTitle>Account Settings</CardTitle>
                    <CardDescription>Manage your account preferences</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Available for Work</p>
                        <p className="text-sm text-gray-600">Show recruiters you're open to opportunities</p>
                      </div>
                      <Switch
                        checked={profile.available_for_work || false}
                        onCheckedChange={(checked) => handleInputChange('available_for_work', checked)}
                        disabled={!isEditing}
                      />
                    </div>
                    
                    <Separator />
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Email</span>
                        <span>{user?.email || "Not available"}</span>
                      </div>
                      {profile.experience_years && (
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Experience</span>
                          <span>{profile.experience_years} {profile.experience_years === 1 ? 'year' : 'years'}</span>
                        </div>
                      )}
                      {user?.created_at && (
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Member Since</span>
                          <span>{new Date(user.created_at).toLocaleDateString()}</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>

          {/* Loading Overlay */}
          {uploading && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <Card className="p-6">
                <div className="text-center space-y-2">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p>Uploading file...</p>
                </div>
              </Card>
            </div>
          )}

          {/* Profile Completion Popup for New Users */}
          <ProfileCompletionPopup
            isOpen={showCompletionPopup}
            onClose={handleCloseCompletionPopup}
            completionPercentage={profileCompletion}
            missingFields={emailPermission.missingFields}
            isNewUser={isFirstTimeUser || searchParams.get('newUser') === 'true'}
          />
        </div>
      </div>
  );
};

export default Profile;