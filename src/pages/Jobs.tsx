import { NewSidebar } from "@/components/layout/NewSidebar";
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage } from "@/components/ui/breadcrumb";
import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Briefcase, 
  MapPin, 
  Clock, 
  Search,
  Filter,
  ExternalLink,
  X,
  Loader2,
  AlertCircle,
  RefreshCw,
  Star,
  Heart,
  TrendingUp,
  Building,
  Users,
  DollarSign,
  Calendar,
  Eye,
  Send,
  Target,
  Zap,
  ChevronDown,
  SlidersHorizontal,
  Globe,
  MapPin as LocationIcon,
  Crown,
  Lock
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CompanyLogo } from "@/components/ui/company-logo";
import { useProgressiveLogos } from "@/hooks/useProgressiveLogos";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";

// Import our types and hooks
import { Job, JobFilters } from "@/types/job";
import { 
  useInfiniteJobs, 
  useInfiniteRemoteJobs, 
  useInfiniteExclusiveJobs, 
  useInfiniteRankedJobs,
  useJobStats 
} from "@/hooks/useJobs";
import { useAuth } from "@/contexts/AuthContext";
import { useCreateJobApplication, useCreateRegularApplication, useHasApplied, useUserApplications } from "@/hooks/useJobApplications";
import { ProfileService, UserProfile, UserExperience } from "@/services/profileService";
import { ApplicationConfirmationPopup } from "@/components/jobs/ApplicationConfirmationPopup";
import { useApplicationConfirmation } from "@/hooks/useApplicationConfirmation";
import { ProfileCompletionWarning } from "@/components/ui/profile-completion-warning";
import { checkJobApplicationPermission } from "@/lib/utils";
import { usePremiumUser } from "@/hooks/usePremiumUser";
import { Link } from "react-router-dom";
import MobileCard from "@/components/mobile/MobileCard";
import MobileButton from "@/components/mobile/MobileButton";
import MobileSearchBar from "@/components/mobile/MobileSearchBar";
import MobileJobCard from "@/components/mobile/MobileJobCard";
import { JobRankingService } from "@/services/jobRankingService";

const Jobs = () => {
  // Auth and user state
  const { user } = useAuth();
  const { isPremium, loading: premiumLoading } = usePremiumUser();
  
  // State management
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState<JobFilters>({
    location: "",
    experience: "any",
    remote: "all",
    company: ""
  });
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState<'created_at' | 'job_title' | 'company_name'>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [appliedJobs, setAppliedJobs] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [activeTab, setActiveTab] = useState('all');
  const [showJobDetails, setShowJobDetails] = useState(false);
  
  // Application state
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [userExperiences, setUserExperiences] = useState<UserExperience[]>([]);
  const [profileLoading, setProfileLoading] = useState(false);
  const [showRankingInfo, setShowRankingInfo] = useState(false);

  // Fetch user's job applications from DB
  const { data: userApplications, isLoading: userApplicationsLoading } = useUserApplications(user?.id);

  // Update appliedJobs state from DB
  useEffect(() => {
    if (userApplications) {
      setAppliedJobs(new Set(userApplications.map(app => app.job_id)));
    }
  }, [userApplications]);

  // Prepare search parameters
  const searchParams = useMemo(() => {
    // Only include filters if they have actual values (not empty strings, "all", or "any")
    const hasActiveFilters = Object.values(filters).some(value => value !== "" && value !== "all" && value !== "any");
    
    return {
      query: searchQuery || undefined,
      filters: hasActiveFilters ? filters : undefined,
      sortBy,
      sortOrder,
      limit: 20 // Set page size to 20
    };
  }, [searchQuery, filters, sortBy, sortOrder]);

  // Determine if we should use ranked jobs
  const shouldUseRankedJobs = useMemo(() => {
    return user && userProfile && JobRankingService.hasEnoughProfileData(userProfile);
  }, [user, userProfile]);

  // Fetch jobs using infinite queries - use ranked jobs for authenticated users with complete profiles
  const { 
    data: allJobsData, 
    isLoading: allJobsLoading, 
    error: allJobsError, 
    fetchNextPage: fetchNextAllJobs,
    hasNextPage: hasNextAllJobs,
    isFetchingNextPage: isFetchingNextAllJobs
  } = shouldUseRankedJobs 
    ? useInfiniteRankedJobs(userProfile, searchParams)
    : useInfiniteJobs(searchParams);

  const { 
    data: remoteJobsData, 
    isLoading: remoteJobsLoading, 
    error: remoteJobsError, 
    fetchNextPage: fetchNextRemoteJobs,
    hasNextPage: hasNextRemoteJobs,
    isFetchingNextPage: isFetchingNextRemoteJobs
  } = useInfiniteRemoteJobs(searchParams);

  const { 
    data: exclusiveJobsData, 
    isLoading: exclusiveJobsLoading, 
    error: exclusiveJobsError, 
    fetchNextPage: fetchNextExclusiveJobs,
    hasNextPage: hasNextExclusiveJobs,
    isFetchingNextPage: isFetchingNextExclusiveJobs
  } = useInfiniteExclusiveJobs(searchParams);

  const { data: stats, isLoading: statsLoading } = useJobStats();
  
  // Job application hooks
  const createApplicationMutation = useCreateJobApplication();
  const createRegularApplicationMutation = useCreateRegularApplication();

  // Application confirmation system
  const applicationConfirmation = useApplicationConfirmation({
    onConfirmApplication: async (job: Job) => {
      if (!user) {
        toast.error('Please sign in to track applications');
        return;
      }

      await createRegularApplicationMutation.mutateAsync({
        userId: user.id,
        userEmail: user.email || '',
        job: {
          id: job.id,
          title: job.title,
          company: job.company,
          location: job.location,
          applyLink: job.applyLink
        },
        userProfile: userProfile || undefined
      });

      // Update applied jobs state
      const newApplied = new Set(appliedJobs);
      newApplied.add(job.id);
      setAppliedJobs(newApplied);
    }
  });

  // Transform infinite query data to flat arrays
  const allJobs = useMemo(() => {
    return allJobsData?.pages.flatMap(page => page.jobs) || [];
  }, [allJobsData]);

  const remoteJobs = useMemo(() => {
    return remoteJobsData?.pages.flatMap(page => page.jobs) || [];
  }, [remoteJobsData]);

  const exclusiveJobs = useMemo(() => {
    return exclusiveJobsData?.pages.flatMap(page => page.jobs) || [];
  }, [exclusiveJobsData]);

  // Get ranked job data for displaying match scores
  const rankedJobsData = useMemo(() => {
    if (shouldUseRankedJobs && allJobsData?.pages) {
      return allJobsData.pages.flatMap(page => (page as any).rankedJobs || []);
    }
    return [];
  }, [allJobsData, shouldUseRankedJobs]);

  const totalAllJobs = allJobsData?.pages[0]?.total || 0;
  const totalRemoteJobs = remoteJobsData?.pages[0]?.total || 0;
  const totalExclusiveJobs = exclusiveJobsData?.pages[0]?.total || 0;

  // Load user profile data
  useEffect(() => {
    const loadUserProfile = async () => {
      if (!user?.id) return;
      
      setProfileLoading(true);
      try {
        const [profile, experiences] = await Promise.all([
          ProfileService.getProfile(user.id),
          ProfileService.getUserExperiences(user.id)
        ]);
        
        setUserProfile(profile);
        setUserExperiences(experiences || []);
      } catch (error) {
        console.error('Error loading user profile:', error);
      } finally {
        setProfileLoading(false);
      }
    };

    loadUserProfile();
  }, [user?.id]);

  // Filter jobs based on active tab and applied jobs
  const filteredJobs = useMemo(() => {
    if (activeTab === 'applied') {
      // Show only jobs the user has applied for - combine all job types
      const appliedAllJobs = allJobs.filter(job => appliedJobs.has(job.id));
      const appliedRemoteJobs = remoteJobs.filter(job => appliedJobs.has(job.id) && !allJobs.some(j => j.id === job.id));
      const appliedExclusiveJobs = exclusiveJobs.filter(job => appliedJobs.has(job.id) && !allJobs.some(j => j.id === job.id) && !remoteJobs.some(j => j.id === job.id));
      return [...appliedAllJobs, ...appliedRemoteJobs, ...appliedExclusiveJobs];
    } else if (activeTab === 'exclusive') {
      // For exclusive tab, filter out applied jobs
      return exclusiveJobs.filter(job => !appliedJobs.has(job.id));
    } else if (activeTab === 'remote') {
      // For remote tab, show remote jobs and filter out applied
      return remoteJobs.filter(job => !appliedJobs.has(job.id));
    } else {
      // For all tab, show all jobs and filter out applied
      return allJobs.filter(job => !appliedJobs.has(job.id));
    }
  }, [allJobs, remoteJobs, exclusiveJobs, activeTab, appliedJobs]);

  // Use progressive logo loading for filtered jobs
  const { getJobLogo, isLogoLoading } = useProgressiveLogos(filteredJobs);



  // Handle job selection
  const handleJobClick = (job: Job) => {
    setSelectedJob(job);
    setShowJobDetails(true);
  };

  // Handle apply to job
  const handleApplyJob = async (job: Job, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    
    // Check profile completion for all job applications
    const jobPermission = checkJobApplicationPermission(userProfile, userExperiences);
    if (!jobPermission.canApply) {
      toast.error('Complete your profile to 85% before applying to jobs');
      return;
    }
    
    // Check if this is an exclusive job
    const isExclusiveJob = activeTab === 'exclusive' || exclusiveJobs.some(ej => ej.id === job.id);
    
    if (isExclusiveJob) {
      // Handle exclusive job application
      if (!user) {
        toast.error('Please sign in to apply for exclusive jobs');
        return;
      }

      if (!userProfile) {
        toast.error('Please complete your profile before applying');
        return;
      }

      if (!userProfile.resume_url) {
        toast.error('Please upload your resume before applying to exclusive jobs');
        return;
      }

      try {
        await createApplicationMutation.mutateAsync({
          userId: user.id,
          userEmail: user.email || '',
          jobData: {
            job_id: job.id,
            job_title: job.title,
            company_name: job.company,
            job_type: 'exclusive'
          },
          userProfile,
          userExperiences
        });

        const newApplied = new Set(appliedJobs);
        newApplied.add(job.id);
        setAppliedJobs(newApplied);
      } catch (error) {
        // Error is handled by the mutation
        console.error('Application error:', error);
      }
    } else {
      // Handle regular job application (external link)
      if (job.applyLink) {
        // Track the external application for confirmation popup
        applicationConfirmation.trackExternalApplication(job);
        
        // Open the external link
        window.open(job.applyLink, '_blank');
        
        toast.success('Application opened in new tab');
      } else {
        toast.info('No application link available for this job');
      }
    }
  };

  // Handle load more functionality
  const handleLoadMore = () => {
    if (activeTab === 'all') {
      fetchNextAllJobs();
    } else if (activeTab === 'remote') {
      fetchNextRemoteJobs();
    } else if (activeTab === 'exclusive') {
      fetchNextExclusiveJobs();
    }
  };

  // Get loading states
  const isLoading = activeTab === 'all' ? allJobsLoading : 
                   activeTab === 'remote' ? remoteJobsLoading : 
                   activeTab === 'exclusive' ? exclusiveJobsLoading : false;

  const isFetchingNext = activeTab === 'all' ? isFetchingNextAllJobs : 
                        activeTab === 'remote' ? isFetchingNextRemoteJobs : 
                        activeTab === 'exclusive' ? isFetchingNextExclusiveJobs : false;

  const hasNextPage = activeTab === 'all' ? hasNextAllJobs : 
                     activeTab === 'remote' ? hasNextRemoteJobs : 
                     activeTab === 'exclusive' ? hasNextExclusiveJobs : false;

  const error = activeTab === 'all' ? allJobsError : 
               activeTab === 'remote' ? remoteJobsError : 
               activeTab === 'exclusive' ? exclusiveJobsError : null;

  // Clear all filters
  const clearAllFilters = () => {
    setFilters({
      location: "",
      experience: "any",
      remote: "all",
      company: ""
    });
    setSearchQuery("");
    toast.info('All filters cleared');
  };

  // Count active filters
  const activeFilterCount = Object.values(filters).filter(value => value !== "" && value !== "all" && value !== "any").length + (searchQuery ? 1 : 0);

  // Get tab counts
  const getTabCount = (tab: string) => {
    switch (tab) {
      case 'applied':
        return appliedJobs.size;
      case 'remote':
        return totalRemoteJobs;
      case 'exclusive':
        return totalExclusiveJobs;
      default:
        return totalAllJobs;
    }
  };

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30 md:flex mobile-page">
        <NewSidebar />
        <div className="flex-1 flex flex-col max-h-screen overflow-hidden w-full">
          {/* Header */}
          <header className="hidden md:flex h-16 shrink-0 items-center gap-2 bg-white/80 backdrop-blur-sm border-b border-gray-200/60">
            <div className="flex items-center gap-2 px-6">
              <Breadcrumb>
                <BreadcrumbList>
                  <BreadcrumbItem>
                    <BreadcrumbPage className="font-semibold flex items-center gap-2">
                      <Briefcase className="w-4 h-4" />
                      Job Search
                    </BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            </div>
          </header>

          {/* Error State */}
          {error && (
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-red-50 border-b border-red-200 px-6 py-3"
            >
              <div className="flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-red-600" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-red-800">
                    Failed to Load Jobs
                  </p>
                  <p className="text-xs text-red-700">
                    There was an error loading jobs from the database. Please try again.
                  </p>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => {
                    // Refetch based on active tab
                    if (activeTab === 'all') {
                      fetchNextAllJobs();
                    } else if (activeTab === 'remote') {
                      fetchNextRemoteJobs();
                    } else if (activeTab === 'exclusive') {
                      fetchNextExclusiveJobs();
                    }
                  }}
                  className="text-red-700 border-red-300 hover:bg-red-100"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Retry
                </Button>
              </div>
            </motion.div>
          )}

          <div className="flex-1 flex overflow-hidden">
            {/* Main Content */}
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Search and Stats Header */}
              <div className="bg-white border-b border-gray-200 p-4 md:p-6 space-y-4">
                {/* Compact Stats Row */}
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                  className="grid grid-cols-2 md:grid-cols-4 gap-3"
                >
                  <div className="mobile-card-compact bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-2 border border-blue-200">
                    <div className="flex items-center gap-1.5">
                      <div className="w-6 h-6 md:w-10 md:h-10 bg-blue-500 rounded-full flex items-center justify-center mobile-touch-target-sm">
                        <Briefcase className="w-3 h-3 md:w-5 md:h-5 text-white" />
                      </div>
                      <div>
                        <p className="mobile-body-xs text-blue-600 font-medium">Total Jobs</p>
                        <p className="mobile-heading-sm md:text-lg font-bold text-blue-900">
                          {statsLoading ? <Skeleton className="h-4 w-8" /> : stats?.total || 0}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mobile-card-compact bg-gradient-to-r from-green-50 to-green-100 rounded-lg p-2 border border-green-200">
                    <div className="flex items-center gap-1.5">
                      <div className="w-6 h-6 md:w-10 md:h-10 bg-green-500 rounded-full flex items-center justify-center mobile-touch-target-sm">
                        <Globe className="w-3 h-3 md:w-5 md:h-5 text-white" />
                      </div>
                      <div>
                        <p className="mobile-body-xs text-green-600 font-medium">Remote</p>
                        <p className="mobile-heading-sm md:text-lg font-bold text-green-900">
                          {statsLoading ? <Skeleton className="h-4 w-8" /> : stats?.remote || 0}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mobile-card-compact bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg p-2 border border-purple-200">
                    <div className="flex items-center gap-1.5">
                      <div className="w-6 h-6 md:w-10 md:h-10 bg-purple-500 rounded-full flex items-center justify-center mobile-touch-target-sm">
                        <Building className="w-3 h-3 md:w-5 md:h-5 text-white" />
                      </div>
                      <div>
                        <p className="mobile-body-xs text-purple-600 font-medium">Companies</p>
                        <p className="mobile-heading-sm md:text-lg font-bold text-purple-900">
                          {statsLoading ? <Skeleton className="h-4 w-8" /> : stats?.companies || 0}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mobile-card-compact bg-gradient-to-r from-orange-50 to-orange-100 rounded-lg p-2 border border-orange-200">
                    <div className="flex items-center gap-1.5">
                      <div className="w-6 h-6 md:w-10 md:h-10 bg-orange-500 rounded-full flex items-center justify-center mobile-touch-target-sm">
                        <TrendingUp className="w-3 h-3 md:w-5 md:h-5 text-white" />
                      </div>
                      <div>
                        <p className="mobile-body-xs text-orange-600 font-medium">This Week</p>
                        <p className="mobile-heading-sm md:text-lg font-bold text-orange-900">
                          {statsLoading ? <Skeleton className="h-4 w-8" /> : stats?.thisWeek || 0}
                        </p>
                      </div>
                    </div>
                  </div>
                </motion.div>

                {/* Mobile Search Bar */}
                <div className="md:hidden">
                  <MobileSearchBar
                    value={searchQuery}
                    onChange={setSearchQuery}
                    placeholder="Search jobs, companies, skills..."
                    onFilter={() => setShowFilters(!showFilters)}
                    filterCount={activeFilterCount}
                    className="border-0 p-0 bg-transparent"
                  />
                </div>

                {/* Desktop Search Bar */}
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.1 }}
                  className="hidden md:flex items-center gap-4"
                >
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <Input
                      placeholder="Search jobs, companies, skills, or locations..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 pr-4 h-11 text-base border-2 border-gray-200 focus:border-blue-500 transition-colors"
                    />
                    {searchQuery && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSearchQuery("")}
                        className="absolute right-2 top-1/2 transform -translate-y-1/2"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                  
                  <Button
                    variant="outline"
                    onClick={() => setShowFilters(!showFilters)}
                    className="h-11 px-5 border-2 border-gray-200 hover:border-blue-500 transition-colors relative"
                  >
                    <SlidersHorizontal className="w-4 h-4 mr-2" />
                    Filters
                    {activeFilterCount > 0 && (
                      <Badge variant="destructive" className="absolute -top-2 -right-2 w-5 h-5 p-0 flex items-center justify-center text-xs">
                        {activeFilterCount}
                      </Badge>
                    )}
                  </Button>

                  <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                    <SelectTrigger className="w-44 h-11 border-2 border-gray-200">
                      <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="created_at">Date Posted</SelectItem>
                      <SelectItem value="job_title">Job Title</SelectItem>
                      <SelectItem value="company_name">Company</SelectItem>
                    </SelectContent>
                  </Select>
                </motion.div>

                {/* Advanced Filters */}
                <AnimatePresence>
                  {showFilters && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3 }}
                      className="bg-gray-50 rounded-lg p-4 border border-gray-200"
                    >
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div>
                          <label className="text-sm font-medium text-gray-700 mb-2 block">Location</label>
                          <Input
                            placeholder="City, State, or Remote"
                            value={filters.location}
                            onChange={(e) => setFilters({...filters, location: e.target.value})}
                            className="border-gray-300"
                          />
                        </div>
                        
                        <div>
                          <label className="text-sm font-medium text-gray-700 mb-2 block">Experience Level</label>
                          <Select value={filters.experience} onValueChange={(value) => setFilters({...filters, experience: value})}>
                            <SelectTrigger className="border-gray-300">
                              <SelectValue placeholder="Any Experience" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="any">Any Experience</SelectItem>
                              <SelectItem value="entry">Entry Level</SelectItem>
                              <SelectItem value="mid">Mid Level</SelectItem>
                              <SelectItem value="senior">Senior Level</SelectItem>
                              <SelectItem value="lead">Lead/Principal</SelectItem>
                              <SelectItem value="intern">Internship</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div>
                          <label className="text-sm font-medium text-gray-700 mb-2 block">Work Type</label>
                          <Select value={filters.remote} onValueChange={(value: any) => setFilters({...filters, remote: value})}>
                            <SelectTrigger className="border-gray-300">
                              <SelectValue placeholder="All Types" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">All Types</SelectItem>
                              <SelectItem value="remote">Remote Only</SelectItem>
                              <SelectItem value="onsite">On-site Only</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div>
                          <label className="text-sm font-medium text-gray-700 mb-2 block">Company</label>
                          <Input
                            placeholder="Company name"
                            value={filters.company}
                            onChange={(e) => setFilters({...filters, company: e.target.value})}
                            className="border-gray-300"
                          />
                        </div>
                      </div>
                      
                      <div className="flex justify-end gap-2 mt-4">
                        <Button variant="outline" onClick={clearAllFilters}>
                          Clear All
                        </Button>
                        <Button onClick={() => setShowFilters(false)}>
                          Apply Filters
                        </Button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Tabs Navigation */}
              <div className="bg-white border-b border-gray-200 px-3 md:px-6">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                  <TabsList className="grid w-full grid-cols-4 bg-gray-100 h-7 md:h-10 p-0.5 md:p-1">
                    <TabsTrigger value="all" className="flex items-center gap-1 md:gap-2 px-1 md:px-3 mobile-body-xs md:text-sm">
                      <Briefcase className="w-2.5 h-2.5 md:w-4 md:h-4" />
                      <span className="hidden sm:inline">All Jobs</span>
                      <span className="sm:hidden">All</span>
                      
                    </TabsTrigger>
                    <TabsTrigger value="applied" className="flex items-center gap-1 md:gap-2 px-1 md:px-3 mobile-body-xs md:text-sm">
                      <Send className="w-2.5 h-2.5 md:w-4 md:h-4" />
                      <span className="hidden sm:inline">Applied</span>
                      <span className="sm:hidden">App</span>
                      <Badge variant="secondary" className="ml-0.5 md:ml-1 mobile-body-xs px-1">
                        {getTabCount('applied')}
                      </Badge>
                    </TabsTrigger>
                    <TabsTrigger value="remote" className="flex items-center gap-1 md:gap-2 px-1 md:px-3 mobile-body-xs md:text-sm">
                      <Globe className="w-2.5 h-2.5 md:w-4 md:h-4" />
                      <span className="hidden sm:inline">Remote</span>
                      <span className="sm:hidden">Rem</span>
                      
                    </TabsTrigger>
                    <TabsTrigger value="exclusive" className="flex items-center gap-1 md:gap-2 px-1 md:px-3 mobile-body-xs md:text-sm">
                      <Star className="w-2.5 h-2.5 md:w-4 md:h-4" />
                      <span className="hidden sm:inline">Exclusive</span>
                      <span className="sm:hidden">Exc</span>
                      <Badge variant="secondary" className="ml-0.5 md:ml-1 mobile-body-xs px-1">
                        {getTabCount('exclusive')}
                      </Badge>
                    </TabsTrigger>
                  </TabsList>

                  
                </Tabs>
              </div>

              {/* Jobs List */}
              <div className="flex-1 overflow-auto p-6">
                {/* Profile Completion Warning */}
                {user && userProfile && (() => {
                  const jobPermission = checkJobApplicationPermission(userProfile, userExperiences);
                  return !jobPermission.canApply ? (
                    <div className="mb-6">
                      <ProfileCompletionWarning
                        completionPercentage={jobPermission.completionPercentage}
                        missingFields={jobPermission.missingFields}
                        requiredPercentage={85}
                      />
                    </div>
                  ) : null;
                })()}

                {/* Jobs List - Available to All Users */}
                <>
                    {isLoading ? (
                      <div className="space-y-4">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Card key={i} className="p-6">
                            <div className="flex items-start gap-4">
                              <Skeleton className="w-12 h-12 rounded-full" />
                              <div className="flex-1 space-y-2">
                                <Skeleton className="h-5 w-3/4" />
                                <Skeleton className="h-4 w-1/2" />
                                <Skeleton className="h-4 w-full" />
                                <div className="flex gap-2">
                                  <Skeleton className="h-6 w-16" />
                                  <Skeleton className="h-6 w-20" />
                                </div>
                              </div>
                            </div>
                          </Card>
                        ))}
                      </div>
                    ) : filteredJobs.length === 0 ? (
                      <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-center py-12"
                      >
                        <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                          <Briefcase className="w-12 h-12 text-gray-400" />
                        </div>
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">No jobs found</h3>
                        <p className="text-gray-600 mb-4">
                          {searchQuery || activeFilterCount > 0
                            ? "Try adjusting your search criteria or filters"
                            : "No jobs are available at the moment. Check back later!"
                          }
                        </p>
                        {(searchQuery || activeFilterCount > 0) && (
                          <Button onClick={clearAllFilters} variant="outline">
                            Clear All Filters
                          </Button>
                        )}
                      </motion.div>
                    ) : (
                      <>
                        {/* Mobile Job List */}
                        <div className="md:hidden space-y-3">
                          <AnimatePresence>
                            {filteredJobs.map((job, index) => (
                              <motion.div
                                key={job.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                transition={{ duration: 0.3, delay: index * 0.05 }}
                              >
                                <MobileJobCard
                                  job={{
                                    id: job.id,
                                    job_title: job.title,
                                    company_name: job.company,
                                    location: job.location,
                                    salary_range: job.salary,
                                    job_type: job.type,
                                    experience_level: job.experienceRequired || 'Not specified',
                                    created_at: job.posted,
                                    is_remote: job.isRemote,
                                    skills: job.tags
                                  }}
                                  onClick={() => handleJobClick(job)}
                                  onApply={() => handleApplyJob(job)}
                                  applied={appliedJobs.has(job.id)}
                                />
                              </motion.div>
                            ))}
                          </AnimatePresence>
                        </div>

                        {/* Desktop Job List */}
                        <div className="hidden md:block space-y-4">
                          <AnimatePresence>
                            {filteredJobs.map((job, index) => (
                              <motion.div
                                key={job.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                transition={{ duration: 0.3, delay: index * 0.05 }}
                                whileHover={{ y: -2 }}
                                onClick={() => handleJobClick(job)}
                              >
                                <Card className="cursor-pointer hover:shadow-lg transition-all duration-300 border-0 bg-white/80 backdrop-blur-sm group">
                                  <CardContent className="p-6">
                                  <div className="flex items-start gap-4">
                                    {/* Company Logo */}
                                    <div className="relative">
                                      <CompanyLogo 
                                        companyName={job.company}
                                        logoUrl={getJobLogo(job)}
                                        isLoading={isLogoLoading(job.id)}
                                        size="md"
                                        className="border-2 border-gray-100"
                                      />
                                      {job.isRemote && (
                                        <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                                          <Globe className="w-3 h-3 text-white" />
                                        </div>
                                      )}
                                    </div>

                                    {/* Job Details */}
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-start justify-between gap-4">
                                        <div className="flex-1 min-w-0">
                                          <div className="flex items-center gap-2 mb-1">
                                            <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-1">
                                              {job.title}
                                            </h3>
                                          </div>
                                          <p className="text-gray-600 font-medium">{job.company}</p>
                                          
                                          <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                                            <div className="flex items-center gap-1">
                                              <LocationIcon className="w-4 h-4" />
                                              <span>{job.location}</span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                              <Clock className="w-4 h-4" />
                                              <span>{job.posted}</span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                              <Briefcase className="w-4 h-4" />
                                              <span>{job.type}</span>
                                            </div>
                                          </div>

                                          <p className="text-gray-600 mt-2 line-clamp-2">
                                            {job.description}
                                          </p>

                                          {/* Tags */}
                                          <div className="flex flex-wrap gap-2 mt-3">
                                            {job.tags.slice(0, 4).map((tag, tagIndex) => (
                                              <Badge key={tagIndex} variant="secondary" className="text-xs">
                                                {tag}
                                              </Badge>
                                            ))}
                                            {job.tags.length > 4 && (
                                              <Badge variant="outline" className="text-xs">
                                                +{job.tags.length - 4} more
                                              </Badge>
                                            )}
                                          </div>
                                        </div>

                                        {/* Action Buttons */}
                                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                          <Tooltip>
                                            <TooltipTrigger asChild>
                                              <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={(e) => handleApplyJob(job, e)}
                                                className="text-gray-400 hover:text-green-600"
                                              >
                                                <ExternalLink className="w-4 h-4" />
                                              </Button>
                                            </TooltipTrigger>
                                            <TooltipContent>
                                              Apply to job
                                            </TooltipContent>
                                          </Tooltip>

                                          <Button
                                            size="sm"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              handleApplyJob(job);
                                            }}
                                            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                                            disabled={appliedJobs.has(job.id)}
                                          >
                                            {appliedJobs.has(job.id) ? (
                                              <>
                                                <Send className="w-4 h-4 mr-2" />
                                                Applied
                                              </>
                                            ) : (
                                              <>
                                                <Send className="w-4 h-4 mr-2" />
                                                Apply
                                              </>
                                            )}
                                          </Button>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            </motion.div>
                          ))}
                            </AnimatePresence>
                          </div>

                          {/* Load More Button */}
                          {hasNextPage && (
                            <div className="flex justify-center mt-8">
                              <Button
                                onClick={handleLoadMore}
                                disabled={isFetchingNext}
                                variant="outline"
                                size="lg"
                                className="px-8 py-3 text-base font-medium"
                              >
                                {isFetchingNext ? (
                                  <>
                                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                    Loading more jobs...
                                  </>
                                ) : (
                                  <>
                                    <ChevronDown className="w-5 h-5 mr-2" />
                                    Load More Jobs
                                  </>
                                )}
                              </Button>
                            </div>
                          )}
                        </>
                      )}
                </>
              </div>
            </div>

            {/* Job Details Sidebar */}
            <AnimatePresence>
              {selectedJob && showJobDetails && (
                <motion.div
                  initial={{ x: '100%' }}
                  animate={{ x: 0 }}
                  exit={{ x: '100%' }}
                  transition={{ type: 'spring', damping: 20, stiffness: 100 }}
                  className="w-96 bg-white border-l border-gray-200 flex flex-col"
                >
                  <div className="p-6 border-b border-gray-200">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <CompanyLogo 
                          companyName={selectedJob.company}
                          logoUrl={getJobLogo(selectedJob)}
                          isLoading={isLogoLoading(selectedJob.id)}
                          size="md"
                        />
                        <div>
                          <h2 className="text-lg font-semibold text-gray-900 line-clamp-2">
                            {selectedJob.title}
                          </h2>
                          <p className="text-gray-600">{selectedJob.company}</p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowJobDetails(false)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="flex-1 overflow-auto p-6 space-y-6">
                    {/* Job Info */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <LocationIcon className="w-4 h-4" />
                        <span>{selectedJob.location}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Clock className="w-4 h-4" />
                        <span>Posted {selectedJob.posted}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Briefcase className="w-4 h-4" />
                        <span>{selectedJob.type}</span>
                      </div>
                      {selectedJob.isRemote && (
                        <div className="flex items-center gap-2 text-sm text-green-600">
                          <Globe className="w-4 h-4" />
                          <span>Remote Work Available</span>
                        </div>
                      )}
                    </div>

                    <Separator />

                    {/* Tags */}
                    <div>
                      <h3 className="text-sm font-semibold text-gray-900 mb-2">Skills & Tags</h3>
                      <div className="flex flex-wrap gap-2">
                        {selectedJob.tags.map((tag, index) => (
                          <Badge key={index} variant="secondary">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <Separator />

                    {/* Description */}
                    <div>
                      <h3 className="text-sm font-semibold text-gray-900 mb-2">Job Description</h3>
                      <div className="text-sm text-gray-600 whitespace-pre-wrap">
                        {selectedJob.description}
                      </div>
                    </div>

                    {selectedJob.experienceRequired && (
                      <>
                        <Separator />
                        <div>
                          <h3 className="text-sm font-semibold text-gray-900 mb-2">Experience Required</h3>
                          <p className="text-sm text-gray-600">{selectedJob.experienceRequired}</p>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="p-6 border-t border-gray-200">
                    <Button
                      onClick={() => handleApplyJob(selectedJob)}
                      className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                      disabled={appliedJobs.has(selectedJob.id)}
                    >
                      {appliedJobs.has(selectedJob.id) ? (
                        <>
                          <Send className="w-4 h-4 mr-2" />
                          Applied
                        </>
                      ) : (
                        <>
                          <ExternalLink className="w-4 h-4 mr-2" />
                          Apply Now
                        </>
                      )}
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Application Confirmation Popup */}
      <ApplicationConfirmationPopup
        isOpen={applicationConfirmation.isPopupOpen}
        onClose={applicationConfirmation.closePopup}
        job={applicationConfirmation.pendingJob}
        onConfirmApplication={applicationConfirmation.confirmApplication}
        onDenyApplication={applicationConfirmation.denyApplication}
        isSubmitting={applicationConfirmation.isSubmitting}
      />
    </TooltipProvider>
  );
};

export default Jobs; 