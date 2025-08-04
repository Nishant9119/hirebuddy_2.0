import React, { useState, useEffect, useRef, useCallback } from 'react';
import { convertParsedResumeToEnhancedFormat } from "@/lib/resume-data-converter";
import type { Resume } from "@/types/resume";
import { Button } from "@/components/ui/button";
import { RainbowButton } from "@/components/ui/rainbow-button";
import { ShimmerButton } from "@/components/ui/shimmer-button";
import { ShinyButton } from "@/components/ui/shiny-button";
import { InteractiveHoverButton } from "@/components/ui/interactive-hover-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { 
  ArrowLeft, 
  Download, 
  Save, 
  Eye, 
  Zap, 
  Target, 
  CheckCircle2, 
  Circle, 
  Sparkles,
  FileText,
  User,
  Briefcase,
  GraduationCap,
  Code,
  Award,
  Globe,
  Languages,
  Heart,
  Plus,
  Minus,
  RotateCcw,
  Share2,
  Settings,
  Palette,
  Layout,
  Type,
  Maximize2,
  Minimize2,
  Upload,
  Loader2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { ResumeSectionDock } from "@/components/ui/resume-dock";
import MobileCard from "@/components/mobile/MobileCard";
import MobileButton from "@/components/mobile/MobileButton";
import { useIsMobile } from "@/hooks/use-mobile";


// Enhanced form sections
import { EnhancedPersonalInfoSection } from "./enhanced-sections/EnhancedPersonalInfoSection";
import { EnhancedSummarySection } from "./enhanced-sections/EnhancedSummarySection";
import { EnhancedExperienceSection } from "./enhanced-sections/EnhancedExperienceSection";
import { EnhancedEducationSection } from "./enhanced-sections/EnhancedEducationSection";
import { EnhancedSkillsSection } from "./enhanced-sections/EnhancedSkillsSection";
import { EnhancedProjectsSection } from "./enhanced-sections/EnhancedProjectsSection";
import { EnhancedCertificationsSection } from "./enhanced-sections/EnhancedCertificationsSection";
import { EnhancedLanguagesSection } from "./enhanced-sections/EnhancedLanguagesSection";
import { EnhancedVolunteerSection } from "./enhanced-sections/EnhancedVolunteerSection";
import { EnhancedAwardsSection } from "./enhanced-sections/EnhancedAwardsSection";

// AI Components
import { AIDashboard } from "./ai/AIDashboard";

// Cover Letter Generator
import { CoverLetterGenerator } from "./CoverLetterGenerator";

// Enhanced preview component
import { EnhancedResumePreview } from "./EnhancedResumePreview";

// Types
interface ResumeData {
  personalInfo: {
    name: string;
    email: string;
    phone: string;
    location: string;
    website: string;
    linkedin: string;
    github: string;
  };
  summary: string;
  experience: Array<{
    id: string;
    jobTitle: string;
    company: string;
    location: string;
    startDate: string;
    endDate: string;
    current: boolean;
    description: string;
    achievements: string[];
  }>;
  education: Array<{
    id: string;
    degree: string;
    school: string;
    location: string;
    startDate: string;
    endDate: string;
    gpa: string;
    honors: string;
    coursework: string[];
  }>;
  skills: {
    technical: string[];
    soft: string[];
    languages: string[];
    frameworks: string[];
  };
  projects: Array<{
    id: string;
    name: string;
    description: string;
    technologies: string[];
    link: string;
    github: string;
    startDate: string;
    endDate: string;
  }>;
  certifications: Array<{
    id: string;
    name: string;
    issuer: string;
    date: string;
    expiryDate: string;
    credentialId: string;
    link: string;
  }>;
  languages: Array<{
    id: string;
    language: string;
    proficiency: string;
  }>;
  volunteer: Array<{
    id: string;
    organization: string;
    role: string;
    startDate: string;
    endDate: string;
    description: string;
  }>;
  awards: Array<{
    id: string;
    title: string;
    issuer: string;
    date: string;
    description: string;
  }>;
}

interface Settings {
  template: string;
  fontSize: number;
  fontFamily: string;
  colorScheme: string;
  spacing: string;
  showPhoto: boolean;
  sectionOrder: string[];
  enabledSections: Record<string, boolean>;
  margins?: string;
  headerStyle?: string;
  showDividers?: boolean;
  bulletStyle?: string;
  sectionSpacing?: number;
  textAlign?: string;
}

interface EnhancedResumeBuilderProps {
  template: string;
  onBack: () => void;
}

const SECTION_CONFIGS = [
  { id: 'ai', label: 'Resume Copilot', icon: Sparkles, color: 'purple' },
  { id: 'personal', label: 'Personal Info', icon: User, color: 'blue' },
  { id: 'summary', label: 'Summary', icon: FileText, color: 'green' },
  { id: 'experience', label: 'Experience', icon: Briefcase, color: 'purple' },
  { id: 'education', label: 'Education', icon: GraduationCap, color: 'amber' },
  { id: 'skills', label: 'Skills', icon: Code, color: 'cyan' },
  { id: 'projects', label: 'Projects', icon: Globe, color: 'pink' },
  { id: 'certifications', label: 'Certifications', icon: Award, color: 'orange' },
  { id: 'languages', label: 'Languages', icon: Languages, color: 'indigo' },
  { id: 'volunteer', label: 'Volunteer', icon: Heart, color: 'red' },
  { id: 'awards', label: 'Awards', icon: Award, color: 'yellow' },
];

export const EnhancedResumeBuilder: React.FC<EnhancedResumeBuilderProps> = ({ 
  template, 
  onBack 
}) => {
  // Mobile detection
  const isMobile = useIsMobile();
  
  // State management
  const [resumeData, setResumeData] = useState<ResumeData>({
    personalInfo: {
      name: "",
      email: "",
      phone: "",
      location: "",
      website: "",
      linkedin: "",
      github: "",
    },
    summary: "",
    experience: [],
    education: [],
    skills: {
      technical: [],
      soft: [],
      languages: [],
      frameworks: [],
    },
    projects: [],
    certifications: [],
    languages: [],
    volunteer: [],
    awards: [],
  });

  const [settings, setSettings] = useState<Settings>({
    template: 'perfect-fit',
    fontSize: 11,
    fontFamily: 'Times New Roman',
    colorScheme: 'pink',
    spacing: 'normal',
    showPhoto: false,
    headerStyle: 'modern',
    sectionOrder: ['ai', 'personal', 'summary', 'experience', 'education', 'skills', 'projects', 'certifications', 'languages', 'volunteer', 'awards'],
    enabledSections: {
      ai: true,
      personal: true,
      summary: true,
      experience: true,
      education: true,
      skills: true,
      projects: true,
      certifications: true,
      languages: true,
      volunteer: true,
      awards: true,
    },
  });

  const [activeSection, setActiveSection] = useState('ai');
  const [atsScore, setAtsScore] = useState(0);
  const [isPreviewExpanded, setIsPreviewExpanded] = useState(false);
  const [isFullscreenPreview, setIsFullscreenPreview] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showManageSections, setShowManageSections] = useState(false);
  const [previewScale, setPreviewScale] = useState(0.8);
  const [showCoverLetterPopup, setShowCoverLetterPopup] = useState(false);

  // Refs
  const previewRef = useRef<HTMLDivElement>(null);
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout>();

  // Calculate completion and ATS score
  const calculateProgress = useCallback(() => {
    const sections = SECTION_CONFIGS.filter(section => 
      settings.enabledSections[section.id]
    );
    
    const completedSections = sections.filter(section => {
      switch (section.id) {
        case 'ai':
          return true; // AI section is always considered complete as it's a tool
        case 'personal':
          return resumeData.personalInfo.name && resumeData.personalInfo.email;
        case 'summary':
          return resumeData.summary.length > 50;
        case 'experience':
          return resumeData.experience.length > 0;
        case 'education':
          return resumeData.education.length > 0;
        case 'skills':
          return Object.values(resumeData.skills).some(arr => arr.length > 0);
        case 'projects':
          return resumeData.projects.length > 0;
        case 'certifications':
          return resumeData.certifications.length > 0;
        case 'languages':
          return resumeData.languages.length > 0;
        case 'volunteer':
          return resumeData.volunteer.length > 0;
        case 'awards':
          return resumeData.awards.length > 0;
        default:
          return false;
      }
    });

    const percentage = sections.length > 0 ? 
      Math.round((completedSections.length / sections.length) * 100) : 0;

    return { percentage, completedSections: completedSections.length, totalSections: sections.length };
  }, [resumeData, settings.enabledSections]);

  const calculateAtsScore = useCallback(() => {
    let score = 0;
    
    // Personal info (20 points)
    if (resumeData.personalInfo.name && resumeData.personalInfo.email && resumeData.personalInfo.phone) {
      score += 20;
    }
    
    // Summary (20 points)
    if (resumeData.summary && resumeData.summary.length > 100) {
      score += 20;
    } else if (resumeData.summary && resumeData.summary.length > 50) {
      score += 10;
    }
    
    // Experience (30 points)
    if (resumeData.experience.length > 0) {
      score += 15;
      const hasDetailedDescriptions = resumeData.experience.some(exp => 
        exp.description && exp.description.length > 100
      );
      if (hasDetailedDescriptions) score += 15;
    }
    
    // Education (15 points)
    if (resumeData.education.length > 0) score += 15;
    
    // Skills (15 points)
    const totalSkills = Object.values(resumeData.skills).flat().length;
    if (totalSkills >= 8) {
      score += 15;
    } else if (totalSkills >= 5) {
      score += 10;
    } else if (totalSkills >= 3) {
      score += 5;
    }
    
    return Math.min(score, 100);
  }, [resumeData]);

  // Effects
  useEffect(() => {
    setAtsScore(calculateAtsScore());
  }, [calculateAtsScore]);

  // Auto-save functionality
  useEffect(() => {
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }
    
    autoSaveTimeoutRef.current = setTimeout(() => {
      localStorage.setItem('enhanced_resume_data', JSON.stringify(resumeData));
      localStorage.setItem('enhanced_resume_settings', JSON.stringify(settings));
      setLastSaved(new Date());
    }, 2000);

    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, [resumeData, settings]);

  // Load saved data on mount
  useEffect(() => {
    // First check for parsed resume data (from import)
    const parsedResumeData = localStorage.getItem('parsedResumeData');
    if (parsedResumeData) {
      try {
        const parsedResume: Resume = JSON.parse(parsedResumeData);
        const convertedData = convertParsedResumeToEnhancedFormat(parsedResume);
        setResumeData(convertedData);
        // Clear the parsed data after using it
        localStorage.removeItem('parsedResumeData');
        return; // Don't load saved data if we have parsed data
      } catch (error) {
        console.error('Error loading parsed resume data:', error);
      }
    }
    
    // Load previously saved data if no parsed data
    const savedData = localStorage.getItem('enhanced_resume_data');
    const savedSettings = localStorage.getItem('enhanced_resume_settings');
    
    if (savedData) {
      try {
        const loadedData = JSON.parse(savedData);
        // Ensure all required fields exist for backward compatibility
        const migratedData = {
          personalInfo: loadedData.personalInfo || {
            name: "",
            email: "",
            phone: "",
            location: "",
            website: "",
            linkedin: "",
            github: "",
          },
          summary: loadedData.summary || "",
          experience: loadedData.experience || [],
          education: loadedData.education || [],
          skills: loadedData.skills || {
            technical: [],
            soft: [],
            languages: [],
            frameworks: [],
          },
          projects: loadedData.projects || [],
          certifications: loadedData.certifications || [],
          languages: loadedData.languages || [],
          volunteer: loadedData.volunteer || [],
          awards: loadedData.awards || [],
        };
        setResumeData(migratedData);
      } catch (error) {
        console.error('Error loading saved resume data:', error);
      }
    }
    
    if (savedSettings) {
      try {
        setSettings(prev => ({ ...prev, ...JSON.parse(savedSettings) }));
      } catch (error) {
        console.error('Error loading saved settings:', error);
      }
    }
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Escape key to close cover letter popup
      if (event.key === 'Escape' && showCoverLetterPopup) {
        setShowCoverLetterPopup(false);
        return;
      }

      // Existing keyboard shortcuts
      if (event.ctrlKey || event.metaKey) {
        switch (event.key) {
          case 'f':
            event.preventDefault();
            setIsFullscreenPreview(true);
            break;
          case 's':
            event.preventDefault();
            localStorage.setItem('enhanced_resume_data', JSON.stringify(resumeData));
            localStorage.setItem('enhanced_resume_settings', JSON.stringify(settings));
            setLastSaved(new Date());
            break;
        }
      }

      // Arrow navigation removed as requested
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [activeSection, settings.enabledSections, resumeData, settings, showCoverLetterPopup]);

  // Update functions
  const updateResumeData = (section: keyof ResumeData, data: any) => {
    setResumeData(prev => ({
      ...prev,
      [section]: data
    }));
  };

  const updateSettings = (newSettings: Partial<Settings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  };

  const toggleSection = (sectionId: string) => {
    // Skip if trying to toggle the AI section or Personal Info section
    if (sectionId === 'ai' || sectionId === 'personal') return;
    
    setSettings(prev => ({
      ...prev,
      enabledSections: {
        ...prev.enabledSections,
        [sectionId]: !prev.enabledSections[sectionId]
      }
    }));
  };

  const resetForm = () => {
    setResumeData({
      personalInfo: {
        name: "",
        email: "",
        phone: "",
        location: "",
        website: "",
        linkedin: "",
        github: "",
      },
      summary: "",
      experience: [],
      education: [],
      skills: {
        technical: [],
        soft: [],
        languages: [],
        frameworks: [],
      },
      projects: [],
      certifications: [],
      languages: [],
      volunteer: [],
      awards: [],
    });
    setActiveSection('personal');
  };

  const generatePDF = async () => {
    if (!previewRef.current) return;
    
    setIsGeneratingPdf(true);
    try {
      const { generateResumePDF } = await import('@/utils/pdfGenerator');
      
      // Find the actual resume content element
      const resumeContent = previewRef.current.querySelector('#resume-content') || previewRef.current;
      
      const contactInfo = {
        email: resumeData.personalInfo.email,
        phone: resumeData.personalInfo.phone,
        linkedin: resumeData.personalInfo.linkedin,
        github: resumeData.personalInfo.github,
        website: resumeData.personalInfo.website
      };
      
      const fileName = resumeData.personalInfo.name ? 
        `${resumeData.personalInfo.name.replace(/\s+/g, '_')}_Resume.pdf` : 
        'Resume.pdf';
        
      await generateResumePDF(resumeContent as HTMLElement, contactInfo, fileName);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate PDF. Please try again.');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const progress = calculateProgress();
  const getAtsScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  const getSectionIcon = (sectionId: string, completed: boolean) => {
    const config = SECTION_CONFIGS.find(s => s.id === sectionId);
    const IconComponent = config?.icon || Circle;
    return completed ? (
      <CheckCircle2 className="w-4 h-4 text-green-600" />
    ) : (
      <IconComponent className="w-4 h-4 text-gray-400" />
    );
  };

  const getCompletedSections = (): string[] => {
    const completed: string[] = [];
    
    // Personal info - check if basic fields are filled
    if (resumeData.personalInfo.name && resumeData.personalInfo.email) {
      completed.push('personal');
    }
    
    // Summary - check if summary exists and has content
    if (resumeData.summary && resumeData.summary.trim().length > 0) {
      completed.push('summary');
    }
    
    // Experience - check if at least one experience entry exists
    if (resumeData.experience && resumeData.experience.length > 0) {
      completed.push('experience');
    }
    
    // Education - check if at least one education entry exists
    if (resumeData.education && resumeData.education.length > 0) {
      completed.push('education');
    }
    
    // Skills - check if any skills are added
    const allSkills = [
      ...resumeData.skills.technical,
      ...resumeData.skills.soft,
      ...resumeData.skills.languages,
      ...resumeData.skills.frameworks
    ];
    if (allSkills.length > 0) {
      completed.push('skills');
    }
    
    // Projects - check if at least one project exists
    if (resumeData.projects && resumeData.projects.length > 0) {
      completed.push('projects');
    }
    
    // Certifications - check if at least one certification exists
    if (resumeData.certifications && resumeData.certifications.length > 0) {
      completed.push('certifications');
    }
    
    // Languages - check if at least one language exists
    if (resumeData.languages && resumeData.languages.length > 0) {
      completed.push('languages');
    }
    
    // Volunteer - check if at least one volunteer entry exists
    if (resumeData.volunteer && resumeData.volunteer.length > 0) {
      completed.push('volunteer');
    }
    
    // Awards - check if at least one award exists
    if (resumeData.awards && resumeData.awards.length > 0) {
      completed.push('awards');
    }
    
    // AI section is always considered "completed" since it's a tool
    completed.push('ai');
    
    return completed;
  };

  const renderSectionContent = () => {
    switch (activeSection) {
      case 'ai':
        return (
          <AIDashboard 
            resumeData={resumeData}
            onUpdateResumeData={updateResumeData}
          />
        );
      case 'personal':
        return (
          <EnhancedPersonalInfoSection
            data={resumeData.personalInfo}
            onUpdate={(data) => updateResumeData('personalInfo', data)}
          />
        );
      case 'summary':
        return (
          <EnhancedSummarySection
            data={resumeData.summary}
            onUpdate={(data) => updateResumeData('summary', data)}
          />
        );
      case 'experience':
        return (
          <EnhancedExperienceSection
            data={resumeData.experience}
            onUpdate={(data) => updateResumeData('experience', data)}
          />
        );
      case 'education':
        return (
          <EnhancedEducationSection
            data={resumeData.education}
            onUpdate={(data) => updateResumeData('education', data)}
          />
        );
      case 'skills':
        return (
          <EnhancedSkillsSection
            data={resumeData.skills}
            onUpdate={(data) => updateResumeData('skills', data)}
          />
        );
      case 'projects':
        return (
          <EnhancedProjectsSection
            data={resumeData.projects}
            onUpdate={(data) => updateResumeData('projects', data)}
          />
        );
      case 'certifications':
        return (
          <EnhancedCertificationsSection
            data={resumeData.certifications}
            onUpdate={(data) => updateResumeData('certifications', data)}
          />
        );
      case 'languages':
        return (
          <EnhancedLanguagesSection
            data={resumeData.languages}
            onUpdate={(data) => updateResumeData('languages', data)}
          />
        );
      case 'volunteer':
        return (
          <EnhancedVolunteerSection
            data={resumeData.volunteer}
            onUpdate={(data) => updateResumeData('volunteer', data)}
          />
        );
      case 'awards':
        return (
          <EnhancedAwardsSection
            data={resumeData.awards}
            onUpdate={(data) => updateResumeData('awards', data)}
          />
        );
      default:
        return null;
    }
  };

  return (
    <TooltipProvider>
      <div className="h-full bg-gradient-to-br from-slate-50 via-white to-blue-50/30">
        {/* Toolbar */}
        <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200/60 px-4 md:px-6 py-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-4">
              {/* Auto-save indicator */}
              <AnimatePresence>
                {lastSaved && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="text-xs text-gray-500 flex items-center gap-1"
                  >
                    <CheckCircle2 className="w-3 h-3 text-green-500" />
                    Saved {lastSaved.toLocaleTimeString()}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* ATS Score */}
              <Tooltip>
                <TooltipTrigger>
                  <div className="flex items-center gap-2 px-3 py-1 bg-gray-50 rounded-full">
                    <Target className="w-4 h-4 text-gray-500" />
                    <span className={`text-sm font-medium ${getAtsScoreColor(atsScore)}`}>
                      ATS: {atsScore}%
                    </span>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Applicant Tracking System compatibility score</p>
                </TooltipContent>
              </Tooltip>
            </div>

            {/* Mobile Action buttons */}
            <div className="md:hidden space-y-2">
              <div className="flex gap-2">
                <MobileButton
                  onClick={() => setShowSettings(true)}
                  variant="outline"
                  size="sm"
                  icon={Settings}
                  className="flex-1"
                >
                  Settings
                </MobileButton>
                <MobileButton
                  onClick={() => setIsFullscreenPreview(true)}
                  variant="outline"
                  size="sm"
                  icon={Eye}
                  className="flex-1"
                >
                  Preview
                </MobileButton>
              </div>
              <MobileButton 
                onClick={generatePDF}
                disabled={isGeneratingPdf}
                className="w-full"
                icon={isGeneratingPdf ? Loader2 : Download}
              >
                {isGeneratingPdf ? 'Generating...' : 'Download PDF'}
              </MobileButton>
            </div>

            {/* Desktop Action buttons */}
            <div className="hidden md:flex items-center gap-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <ShimmerButton
                    onClick={() => window.location.href = '/resume-import'}
                    className="h-9 px-3 text-sm flex items-center gap-2"
                    background="linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
                    borderRadius="6px"
                  >
                    <Upload className="w-4 h-4" />
                    Import Resume
                  </ShimmerButton>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Import an existing resume to auto-fill this form</p>
                </TooltipContent>
              </Tooltip>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowSettings(true)}
                className="h-9 px-3 text-sm"
              >
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowManageSections(true)}
                className="h-9 px-3 text-sm"
              >
                <Layout className="w-4 h-4 mr-2" />
                Sections
              </Button>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsFullscreenPreview(true)}
                    className="h-9 px-3 text-sm"
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    Preview
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Keyboard shortcut: Ctrl/Cmd + F</p>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowCoverLetterPopup(true)}
                    className="h-9 px-3 text-sm"
                  >
                    <motion.div
                      initial={{ scale: 1 }}
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ 
                        repeat: Infinity, 
                        repeatType: "reverse", 
                        duration: 1.5 
                      }}
                      className="mr-2 flex items-center"
                    >
                      <Sparkles className="w-4 h-4 text-blue-500" />
                    </motion.div>
                    Cover Letter
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Generate AI-powered cover letters</p>
                </TooltipContent>
              </Tooltip>

              <RainbowButton 
                onClick={generatePDF}
                disabled={isGeneratingPdf}
                className="h-9 px-3 text-sm"
              >
                {isGeneratingPdf ? (
                  <>
                    <div className="w-4 h-4 mr-2 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4 mr-2" />
                    Download PDF
                  </>
                )}
              </RainbowButton>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-4 md:p-6">
          <ResizablePanelGroup direction="horizontal" className="h-[calc(100vh-20rem)] bg-white rounded-lg shadow-sm">
            {/* Left Panel - Form */}
            <ResizablePanel defaultSize={isPreviewExpanded ? 30 : 50} minSize={25}>
              <div className="h-full pr-3">
                <ScrollArea className="h-full">
                  <div className="space-y-4 md:space-y-6 pb-32">
                    {/* Progress Card - Simplified since we have the dock */}
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <Card className="border-0 shadow-sm bg-white">
                        <CardHeader className="pb-4">
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-lg flex items-center gap-2">
                              <Target className="w-5 h-5 text-primary" />
                              Resume Progress
                            </CardTitle>
                            <Badge variant="outline" className="text-sm font-medium">
                              {progress.percentage}% Complete
                            </Badge>
                          </div>
                          <Progress value={progress.percentage} className="h-3" />
                        </CardHeader>
                        <CardContent>
                          <div className="text-center py-4">
                            <p className="text-sm text-gray-600 mb-3">
                              Use the dock at the bottom to navigate between sections
                            </p>
                            
                            <div className="text-xs text-gray-500 space-y-1">
                              <div className="flex items-center justify-center gap-4">
                                
                                <span>← → : Navigate sections</span>
                              </div>
                              
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>

                    {/* ATS Tips */}
                    <AnimatePresence>
                      {atsScore < 80 && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                        >
                          <Alert className="border-amber-200 bg-amber-50">
                            <Zap className="h-4 w-4 text-amber-600" />
                            <AlertDescription className="text-amber-800">
                              <strong>ATS Optimization Tips:</strong>
                              {atsScore < 60 && " Add more detailed work experience descriptions."}
                              {Object.values(resumeData.skills).flat().length < 5 && " Include more relevant skills."}
                              {!resumeData.summary && " Write a compelling professional summary."}
                            </AlertDescription>
                          </Alert>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Section Form */}
                    <motion.div
                      key={activeSection}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <Card className="border-0 shadow-sm bg-white">
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            {(() => {
                              const config = SECTION_CONFIGS.find(s => s.id === activeSection);
                              const IconComponent = config?.icon || FileText;
                              return <IconComponent className="w-5 h-5 text-primary" />;
                            })()}
                            {SECTION_CONFIGS.find(s => s.id === activeSection)?.label || 'Section'}
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          {renderSectionContent()}
                        </CardContent>
                      </Card>
                    </motion.div>

                    {/* Action Buttons */}
                    <div className="flex flex-col md:flex-row gap-3">
                      <div className="md:hidden space-y-2">
                        <MobileButton 
                          onClick={resetForm}
                          variant="outline"
                          className="w-full"
                          icon={RotateCcw}
                        >
                          Reset Form
                        </MobileButton>
                        <MobileButton 
                          className="w-full"
                          onClick={() => {
                            localStorage.setItem('enhanced_resume_data', JSON.stringify(resumeData));
                            localStorage.setItem('enhanced_resume_settings', JSON.stringify(settings));
                            setLastSaved(new Date());
                          }}
                          icon={Save}
                        >
                          Save Draft
                        </MobileButton>
                      </div>
                      <div className="hidden md:flex gap-3 flex-1">
                        <InteractiveHoverButton 
                          onClick={resetForm}
                          className="flex-1"
                        >
                          ↻ Reset Form
                        </InteractiveHoverButton>
                        <ShinyButton 
                          className="flex-1"
                          onClick={() => {
                            localStorage.setItem('enhanced_resume_data', JSON.stringify(resumeData));
                            localStorage.setItem('enhanced_resume_settings', JSON.stringify(settings));
                            setLastSaved(new Date());
                          }}
                        >
                          💾 Save Draft
                        </ShinyButton>
                      </div>
                    </div>
                  </div>
                </ScrollArea>
              </div>
            </ResizablePanel>

            <ResizableHandle withHandle />

            {/* Right Panel - Live Preview */}
            <ResizablePanel defaultSize={isPreviewExpanded ? 70 : 50} minSize={30}>
              <div className="h-full pl-3">
                <Card className="h-full border-0 shadow-lg bg-white/80 backdrop-blur-sm">
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        <Eye className="w-5 h-5 text-blue-600" />
                        Live Preview
                      </CardTitle>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-600">Scale:</span>
                          <Slider
                            value={[previewScale]}
                            onValueChange={([value]) => setPreviewScale(value)}
                            min={0.5}
                            max={1.2}
                            step={0.1}
                            className="w-20"
                          />
                          <span className="text-sm text-gray-600 w-12">
                            {Math.round(previewScale * 100)}%
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPreviewScale(0.5)}
                            className="px-2 py-1 text-xs"
                          >
                            50%
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPreviewScale(0.75)}
                            className="px-2 py-1 text-xs"
                          >
                            75%
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPreviewScale(1)}
                            className="px-2 py-1 text-xs"
                          >
                            100%
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPreviewScale(1.2)}
                            className="px-2 py-1 text-xs"
                          >
                            120%
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="flex-1 p-0">
                    <ScrollArea className="h-[calc(100%-4rem)]">
                      <div className="p-6">
                        <motion.div
                          ref={previewRef}
                          style={{ transform: `scale(${previewScale})`, transformOrigin: 'top left' }}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ duration: 0.5 }}
                        >
                          <EnhancedResumePreview
                            data={resumeData}
                            settings={settings}
                          />
                        </motion.div>
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              </div>
            </ResizablePanel>
          </ResizablePanelGroup>
        </div>

        {/* Settings Dialog */}
        <Dialog open={showSettings} onOpenChange={setShowSettings}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Resume Settings
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-6 mt-4">
              {/* Template Selection */}
              <div className="space-y-3">
                <label className="text-sm font-medium">Template</label>
                <Select value={settings.template} onValueChange={(value) => updateSettings({ template: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="perfect-fit">Software Engineer (Recommended)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Font Settings */}
              <div className="space-y-4">
                <div className="space-y-3">
                  <label className="text-sm font-medium">Font Size: {settings.fontSize}pt</label>
                  <Slider
                    value={[settings.fontSize]}
                    onValueChange={([value]) => updateSettings({ fontSize: value })}
                    min={8}
                    max={16}
                    step={0.5}
                  />
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>8pt</span>
                    <span>12pt</span>
                    <span>16pt</span>
                  </div>
                </div>

               
                
                {/* Font Preview */}
                <div className="p-4 border rounded-lg bg-gray-50">
                  <div className="text-sm font-medium text-gray-700 mb-2">Font Preview</div>
                  <div 
                    style={{ 
                      fontFamily: settings.fontFamily === 'Inter' ? 'Inter, sans-serif' :
                                 settings.fontFamily === 'Roboto' ? 'Roboto, sans-serif' :
                                 settings.fontFamily === 'Open Sans' ? '"Open Sans", sans-serif' :
                                 settings.fontFamily === 'Lato' ? 'Lato, sans-serif' :
                                 settings.fontFamily === 'Arial' ? 'Arial, sans-serif' :
                                 settings.fontFamily === 'Times New Roman' ? '"Times New Roman", serif' :
                                 settings.fontFamily === 'Georgia' ? 'Georgia, serif' : '"Times New Roman", serif',
                      fontSize: `${settings.fontSize}pt`,
                      lineHeight: settings.spacing === 'compact' ? 1.3 : settings.spacing === 'relaxed' ? 1.6 : 1.4
                    }}
                  >
                    <div className="font-bold mb-1">John Doe</div>
                    <div className="text-sm">Software Engineer with 5+ years of experience in full-stack development.</div>
                  </div>
                </div>
              </div>

              {/* Spacing Settings */}
              <div className="space-y-3">
                <label className="text-sm font-medium">Line Spacing</label>
                <Select value={settings.spacing} onValueChange={(value) => updateSettings({ spacing: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="compact">Compact (1.3)</SelectItem>
                    <SelectItem value="normal">Normal (1.4) (Recommended)</SelectItem>
                    <SelectItem value="relaxed">Relaxed (1.6)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Color Scheme */}
              <div className="space-y-3">
                <label className="text-sm font-medium">Color Scheme</label>
                <div className="grid grid-cols-4 gap-2">
                  {['blue', 'green', 'purple', 'red', 'orange', 'teal', 'pink', 'indigo'].map((color) => (
                    <Button
                      key={color}
                      variant={settings.colorScheme === color ? "default" : "outline"}
                      size="sm"
                      onClick={() => updateSettings({ colorScheme: color })}
                      className={`capitalize ${settings.colorScheme === color ? `bg-${color}-600` : ''}`}
                    >
                      {color}{color === 'pink' && " (Recommended)"}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Advanced Settings */}
              <div className="space-y-4 pt-4 border-t">
                <h4 className="text-sm font-semibold text-gray-900">Advanced Settings</h4>
                
                {/* Margins */}
                <div className="space-y-3">
                  <label className="text-sm font-medium">Page Margins</label>
                  <Select value={settings.margins || 'normal'} onValueChange={(value) => updateSettings({ margins: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="narrow">Narrow (0.5 inch)</SelectItem>
                      <SelectItem value="normal">Normal (0.75 inch) (Recommended)</SelectItem>
                      <SelectItem value="wide">Wide (1 inch)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Header Style */}
                <div className="space-y-3">
                  <label className="text-sm font-medium">Header Style</label>
                  <Select value={settings.headerStyle || 'modern'} onValueChange={(value) => updateSettings({ headerStyle: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="classic">Classic (Left-aligned)</SelectItem>
                      <SelectItem value="centered">Centered</SelectItem>
                      <SelectItem value="modern">Modern (Split layout) (Recommended)</SelectItem>
                      <SelectItem value="split-balanced">Split Balanced (Equal columns)</SelectItem>
                      <SelectItem value="split-contact-right">Split Contact (Contact info right)</SelectItem>
                      <SelectItem value="split-contact-left">Split Contact (Contact info left)</SelectItem>
                      <SelectItem value="minimalist">Minimalist (Clean spacing)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Section Spacing */}
                <div className="space-y-3">
                  <label className="text-sm font-medium">Section Spacing: {settings.sectionSpacing || 16}px</label>
                  <Slider
                    value={[settings.sectionSpacing || 16]}
                    onValueChange={([value]) => updateSettings({ sectionSpacing: value })}
                    min={8}
                    max={32}
                    step={2}
                  />
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>Tight</span>
                    <span>Normal</span>
                    <span>Loose</span>
                  </div>
                </div>

                {/* Section Dividers */}
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">Section Dividers</label>
                  <Switch
                    checked={settings.showDividers !== false}
                    onCheckedChange={(checked) => updateSettings({ showDividers: checked })}
                  />
                </div>

                {/* Bullet Points Style */}
                <div className="space-y-3">
                  <label className="text-sm font-medium">Bullet Point Style</label>
                  <Select value={settings.bulletStyle || 'bullet'} onValueChange={(value) => updateSettings({ bulletStyle: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bullet">• Bullet (Recommended)</SelectItem>
                      <SelectItem value="dash">- Dash</SelectItem>
                      <SelectItem value="arrow">→ Arrow</SelectItem>
                      <SelectItem value="chevron">› Chevron</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Text Alignment */}
                <div className="space-y-3">
                  <label className="text-sm font-medium">Text Alignment</label>
                  <Select value={settings.textAlign || 'left'} onValueChange={(value) => updateSettings({ textAlign: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="left">Left Aligned (Recommended)</SelectItem>
                      <SelectItem value="justify">Justified</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Theme Presets */}
              <div className="space-y-4 pt-4 border-t">
                <h4 className="text-sm font-semibold text-gray-900">Theme Presets</h4>
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => updateSettings({
                      fontFamily: 'Times New Roman',
                      fontSize: 11,
                      spacing: 'normal',
                      colorScheme: 'blue',
                      margins: 'normal',
                      headerStyle: 'classic'
                    })}
                    className="justify-start"
                  >
                    📄 Traditional
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => updateSettings({
                      fontFamily: 'Times New Roman',
                      fontSize: 10,
                      spacing: 'compact',
                      colorScheme: 'indigo',
                      margins: 'narrow',
                      headerStyle: 'modern'
                    })}
                    className="justify-start"
                  >
                    🚀 Modern (Recommended)
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => updateSettings({
                      fontFamily: 'Georgia',
                      fontSize: 12,
                      spacing: 'relaxed',
                      colorScheme: 'green',
                      margins: 'wide',
                      headerStyle: 'centered'
                    })}
                    className="justify-start"
                  >
                    🎨 Creative
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => updateSettings({
                      fontFamily: 'Arial',
                      fontSize: 9,
                      spacing: 'compact',
                      colorScheme: 'purple',
                      margins: 'narrow',
                      headerStyle: 'minimalist'
                    })}
                    className="justify-start"
                  >
                    💼 Executive
                  </Button>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Manage Sections Dialog */}
        <Dialog open={showManageSections} onOpenChange={setShowManageSections}>
          <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Layout className="w-5 h-5" />
                Manage Resume Sections
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-6 mt-4">
              <div className="space-y-3">
                <p className="text-sm text-gray-600">
                  Enable or disable sections to customize your resume. The Resume Copilot section is always enabled to help you optimize your resume.
                </p>
                <div className="grid grid-cols-1 gap-3">
                  {SECTION_CONFIGS.map((section) => (
                    <div key={section.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-2">
                        <section.icon className="w-4 h-4" />
                        <span className="text-sm">{section.label}</span>
                      </div>
                      <Switch
                        checked={settings.enabledSections[section.id]}
                        onCheckedChange={() => toggleSection(section.id)}
                        disabled={section.id === 'personal' || section.id === 'ai'} // Personal info and Resume Copilot are always required
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Fullscreen Preview Dialog */}
        <Dialog open={isFullscreenPreview} onOpenChange={setIsFullscreenPreview}>
          <DialogContent className="max-w-[95vw] max-h-[95vh] w-full h-full p-0">
            <DialogHeader className="p-6 pb-0">
              <div className="flex items-center justify-between">
                <DialogTitle className="flex items-center gap-2">
                  <Eye className="w-5 h-5" />
                  Fullscreen Preview
                </DialogTitle>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">Scale:</span>
                    <Slider
                      value={[previewScale]}
                      onValueChange={([value]) => setPreviewScale(value)}
                      min={0.3}
                      max={1.5}
                      step={0.1}
                      className="w-24"
                    />
                    <span className="text-sm text-gray-600 w-12">
                      {Math.round(previewScale * 100)}%
                    </span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPreviewScale(1)}
                  >
                    Reset Zoom
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={generatePDF}
                    disabled={isGeneratingPdf}
                    className="bg-primary hover:bg-primary/90"
                  >
                    {isGeneratingPdf ? (
                      <>
                        <div className="w-4 h-4 mr-2 animate-spin rounded-full border-2 border-gray-600 border-t-transparent" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Download className="w-4 h-4 mr-2" />
                        Download PDF
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </DialogHeader>
            <div className="flex-1 p-6 pt-4">
              <ScrollArea className="h-[calc(95vh-8rem)]">
                <div className="flex justify-center">
                  <motion.div
                    style={{ 
                      transform: `scale(${previewScale})`, 
                      transformOrigin: 'top center',
                      marginBottom: `${(1 - previewScale) * 500}px` // Adjust margin based on scale
                    }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5 }}
                  >
                    <EnhancedResumePreview
                      data={resumeData}
                      settings={settings}
                    />
                  </motion.div>
                </div>
              </ScrollArea>
            </div>
          </DialogContent>
        </Dialog>

        {/* Cover Letter Generator Popup */}
        {showCoverLetterPopup && (
          <div 
            className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setShowCoverLetterPopup(false);
              }
            }}
          >
            <div className="bg-white rounded-lg shadow-xl w-full max-w-7xl h-[90vh] flex flex-col">
              <CoverLetterGenerator
                resumeData={resumeData}
                onClose={() => setShowCoverLetterPopup(false)}
              />
            </div>
          </div>
        )}

        {/* Resume Section Dock */}
        {!showCoverLetterPopup && (
          <ResumeSectionDock
            sections={SECTION_CONFIGS}
            activeSection={activeSection}
            onSectionChange={setActiveSection}
            completedSections={getCompletedSections()}
            enabledSections={settings.enabledSections}
          />
        )}
      </div>
    </TooltipProvider>
  );
};
