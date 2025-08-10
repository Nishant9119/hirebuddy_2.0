import { NewSidebar } from "@/components/layout/NewSidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CompanyLogo } from "@/components/ui/company-logo";
import { useProgressiveLogos } from "@/hooks/useProgressiveLogos";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { BlurFade } from "../components/ui/blur-fade";
import { 
  DashboardService, 
  DashboardStats, 
  JobRecommendation, 
  RecentActivity,
  UserProfile,
  EmailOutreachStats
} from "@/services/dashboardService";
import { AppliedJobsWidget } from "@/components/dashboard/AppliedJobsWidget";
import { AIJobRecommendations } from "@/components/dashboard/AIJobRecommendations";
import { SkillsAnalyticsWidget } from "@/components/dashboard/SkillsAnalyticsWidget";
import { CareerProgressWidget } from "@/components/dashboard/CareerProgressWidget";
import { useJobs } from "@/hooks/useJobs";
import { Job } from "@/types/job";
import { usePremiumUser } from "@/hooks/usePremiumUser";
import { PremiumBadge } from "@/components/ui/premium-badge";
import MobileCard from "@/components/mobile/MobileCard";
import MobileButton from "@/components/mobile/MobileButton";
import { 
  Search, 
  Settings, 
  User,
  BriefcaseBusiness,
  FileText,
  Mail,
  TrendingUp,
  Calendar,
  ArrowUpRight,
  Target,
  Send,
  CheckCircle,
  Clock,
  Users,
  BarChart3,
  Star,
  Sparkles,
  ArrowRight,
  Plus,
  TrendingDown,
  Zap,
  Trophy,
  Eye,
  MessageSquare,
  BookOpen,
  Globe,
  Briefcase,
  PieChart,
  Activity,
  Filter,
  MapPin,
  DollarSign,
  Timer,
  ThumbsUp,
  AlertCircle,

  Share2,
  Download,
  ChevronRight,
  ExternalLink,
  Building,
  GraduationCap,
  Rocket,
  Shield,
  Lightbulb,
  Network,
  Loader2,
  Crown,
  ArrowLeft
} from "lucide-react";
import { cn } from "@/lib/utils";

// Enhanced Metric Card with better visual hierarchy
const EnhancedMetricCard = ({ 
  label, 
  value, 
  change, 
  changeType = 'positive',
  icon: Icon,
  subtitle,
  className = "",
  trend = [],
  isPremium = false
}: {
  label: string;
  value: string;
  change: string;
  changeType?: 'positive' | 'negative';
  icon: React.ComponentType<any>;
  subtitle?: string;
  className?: string;
  trend?: number[];
  isPremium?: boolean;
}) => {
  return (
    <Card className={`group border-0 shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden bg-white ${className}`}>
      <CardContent className="p-4 md:p-6 relative">
        <div className="absolute top-0 right-0 w-16 h-16 md:w-20 md:h-20 rounded-bl-3xl opacity-50 bg-gradient-to-br from-gray-50 to-gray-100"></div>
        <div className="flex justify-between items-start relative z-10">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors bg-gray-100 group-hover:bg-gray-200">
                <Icon className="h-4 w-4 text-gray-600" />
              </div>
              <div className="text-xs md:text-sm font-medium text-gray-600">
                {label}
              </div>
            </div>
            <div className="text-2xl md:text-3xl font-bold text-gray-900 mb-1">{value}</div>
            {subtitle && <div className="text-xs text-gray-500 mb-2">{subtitle}</div>}
            <div className={`flex items-center gap-1 text-xs md:text-sm font-medium ${
              changeType === 'positive' ? 'text-green-600' : 'text-red-500'
            }`}>
              {changeType === 'positive' ? 
                <TrendingUp className="h-3 w-3" /> : 
                <TrendingDown className="h-3 w-3" />
              }
              {change}
            </div>
          </div>
          {trend.length > 0 && (
            <div className="w-12 h-6 md:w-16 md:h-8 flex items-end gap-0.5">
              {trend.map((height, index) => (
                <div
                  key={index}
                  className="flex-1 rounded-sm transition-all duration-300"
                  style={{
                    backgroundColor: changeType === 'positive' ? '#10b981' : '#ef4444',
                    height: `${Math.max(height * 10, 5)}%`,
                    opacity: 0.7
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

// Mobile-specific metric card
const MobileMetricCard = ({ 
  label, 
  value, 
  change, 
  changeType = 'positive',
  icon: Icon,
  subtitle,
  className = "",
  isPremium = false
}: {
  label: string;
  value: string;
  change: string;
  changeType?: 'positive' | 'negative';
  icon: React.ComponentType<any>;
  subtitle?: string;
  className?: string;
  isPremium?: boolean;
}) => {
  return (
    <div className={cn("mobile-card-compact", className)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={cn(
            "w-8 h-8 rounded-lg flex items-center justify-center",
            isPremium 
              ? "bg-gradient-to-br from-yellow-100 to-amber-100" 
              : "bg-gradient-to-br from-[#b24e55]/10 to-[#d35c65]/10"
          )}>
            <Icon className={cn(
              "h-4 w-4",
              isPremium ? "text-yellow-600" : "text-[#b24e55]"
            )} />
          </div>
          <div>
            <div className="mobile-body-xs font-medium text-gray-600 mb-0.5">{label}</div>
            <div className="mobile-heading-sm font-bold text-gray-900">{value}</div>
          </div>
        </div>
        <div className="text-right">
          <div className={cn(
            "flex items-center gap-1 mobile-body-xs font-medium",
            changeType === 'positive' ? 'text-green-600' : 'text-red-500'
          )}>
            {changeType === 'positive' ? 
              <TrendingUp className="h-3 w-3" /> : 
              <TrendingDown className="h-3 w-3" />
            }
            {change}
          </div>
          {subtitle && <div className="mobile-body-xs text-gray-500 mt-0.5">{subtitle}</div>}
        </div>
      </div>
    </div>
  );
};

// Enhanced Job Card with better visual design
const EnhancedJobCard = ({ 
  job
}: {
  job: Job;
}) => {
  const formatSalary = (job: Job) => {
    // Job type doesn't have salary_range, so we'll show a default message
    return "Salary not specified";
  };

  const getSkills = (job: Job) => {
    if (job.tags && job.tags.length > 0) return job.tags;
    // Extract basic skills from job title/description
    const title = job.title.toLowerCase();
    const skills = [];
    if (title.includes('react')) skills.push('React');
    if (title.includes('typescript') || title.includes('ts')) skills.push('TypeScript');
    if (title.includes('node')) skills.push('Node.js');
    if (title.includes('python')) skills.push('Python');
    if (title.includes('java')) skills.push('Java');
    if (title.includes('aws')) skills.push('AWS');
    return skills.length > 0 ? skills : ['JavaScript', 'HTML', 'CSS'];
  };

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just posted';
    if (diffInHours < 24) return `${diffInHours} hours ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
  };

  const skills = getSkills(job);
  const matchScore = 85 + Math.floor(Math.random() * 15); // Generate a match score between 85-100

  return (
    <div className="group p-4 border-b last:border-b-0 hover:bg-gray-50 transition-all duration-200 relative">
      {Math.random() > 0.8 && (
        <div className="absolute top-2 right-2">
          <Badge className="bg-orange-100 text-orange-700 border-0 text-xs">
            <Zap className="h-3 w-3 mr-1" />
            Urgent
          </Badge>
        </div>
      )}
      <div className="flex items-start gap-4">
        <CompanyLogo 
          companyName={job.company}
          size="md"
          className="border-2 border-gray-100"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between mb-2">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-gray-900 group-hover:text-gray-700 transition-colors truncate">
                {job.title}
              </h3>
              <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                <Building className="h-3 w-3" />
                <span>{job.company}</span>
                <span>•</span>
                <MapPin className="h-3 w-3" />
                <span>{job.location || 'Location not specified'}</span>
                {(job.isRemote || job.isProbablyRemote) && (
                  <>
                    <span>•</span>
                    <Badge variant="outline" className="text-xs border-green-300 text-green-700">
                      Remote
                    </Badge>
                  </>
                )}
              </div>
            </div>
            <div className="flex flex-col items-end gap-1 ml-4">
              <Badge className="bg-green-100 text-green-700 border-0 text-xs">
                {matchScore}% match
              </Badge>
              <span className="text-xs text-gray-500">{job.posted}</span>
            </div>
          </div>
          
          <div className="flex items-center gap-2 mb-3">
            <DollarSign className="h-3 w-3 text-gray-500" />
            <span className="text-sm font-medium" style={{ color: '#b24e55' }}>{formatSalary(job)}</span>
          </div>
          
          <div className="flex flex-wrap gap-1 mb-3">
            {skills.slice(0, 4).map((skill, index) => (
              <Badge key={index} variant="outline" className="text-xs border-gray-300 text-gray-600">
                {skill}
              </Badge>
            ))}
            {skills.length > 4 && (
              <Badge variant="outline" className="text-xs border-gray-300 text-gray-500">
                +{skills.length - 4}
              </Badge>
            )}
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">

              <Button variant="ghost" size="sm" className="h-8 px-3 text-gray-600 hover:text-gray-900">
                <Share2 className="h-3 w-3 mr-1" />
                Share
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="h-8 border-gray-300 hover:bg-gray-50">
                View Details
              </Button>
              <Button size="sm" className="h-8 text-white hover:opacity-90" style={{ backgroundColor: '#b24e55' }} asChild>
                <a href={job.applyLink || '#'} target="_blank" rel="noopener noreferrer">
                  Apply Now
                </a>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Activity Timeline Component
const ActivityTimeline = ({ activities }: { activities: RecentActivity[] }) => {
  const getBgClassForType = (type: RecentActivity['type']): string => {
    switch (type) {
      case 'application':
        return 'bg-blue-100';
      case 'profile_update':
        return 'bg-purple-100';
      case 'job_view':
        return 'bg-orange-100';
      case 'recommendation':
        return 'bg-green-100';
      default:
        return 'bg-gray-100';
    }
  };

  const getIconForType = (type: RecentActivity['type']): string => {
    switch (type) {
      case 'application':
        return '📄';
      case 'profile_update':
        return '👤';
      case 'job_view':
        return '👀';
      case 'recommendation':
        return '⭐';
      default:
        return '•';
    }
  };

  const formatTimeAgo = (iso: string): string => {
    try {
      const date = new Date(iso);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / (1000 * 60));
      if (diffMins < 60) return `${diffMins}m ago`;
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `${diffHours}h ago`;
      const diffDays = Math.floor(diffHours / 24);
      return `${diffDays}d ago`;
    } catch {
      return 'Recently';
    }
  };
  if (!activities || activities.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm">No recent activity</p>
        <p className="text-xs mt-1">Start applying to jobs to see your activity here</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {activities.map((activity) => (
        <div key={activity.id} className="flex items-start gap-3">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${getBgClassForType(activity.type)}`}>
            <span className="text-sm">{getIconForType(activity.type)}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900">{activity.title}</p>
            {activity.description && <p className="text-xs text-gray-600">{activity.description}</p>}
            <p className="text-xs text-gray-500 mt-1">{formatTimeAgo(activity.timestamp)}</p>
          </div>
        </div>
      ))}
    </div>
  );
};

// Quick Action Button Component
const QuickActionButton = ({ 
  icon: Icon, 
  label, 
  description, 
  to, 
  color = 'default' 
}: {
  icon: React.ComponentType<any>;
  label: string;
  description: string;
  to: string;
  color?: 'default' | 'primary' | 'success' | 'warning';
}) => {
  const colorClasses = {
    default: 'bg-gray-50 hover:bg-gray-100 border-gray-200',
    primary: 'bg-blue-50 hover:bg-blue-100 border-blue-200',
    success: 'bg-green-50 hover:bg-green-100 border-green-200',
    warning: 'bg-orange-50 hover:bg-orange-100 border-orange-200'
  };

  return (
    <Link to={to} className="block">
      <div className={`p-4 rounded-lg border transition-all duration-200 hover:shadow-sm group ${colorClasses[color]}`}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-white shadow-sm flex items-center justify-center group-hover:shadow-md transition-shadow">
            <Icon className="h-5 w-5 text-gray-600" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-medium text-gray-900 text-sm">{label}</div>
            <div className="text-xs text-gray-600">{description}</div>
          </div>
          <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-gray-600 transition-colors" />
        </div>
      </div>
    </Link>
  );
};

const Dashboard = () => {
  const { user, signOut } = useAuth();
  const { isPremium, premiumData, loading: premiumLoading } = usePremiumUser();
  const [userName, setUserName] = useState(user?.user_metadata?.full_name || user?.email?.split('@')[0] || "User");
  const [isLoading, setIsLoading] = useState(true);
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [emailStats, setEmailStats] = useState<EmailOutreachStats | null>(null);

  const [error, setError] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'demo' | 'error'>('connected');

  // Use the useJobs hook to fetch job recommendations
  const { data: jobsData, isLoading: jobsLoading, error: jobsError } = useJobs({
    limit: 3,
    sortBy: 'created_at',
    sortOrder: 'desc'
  });

  const jobRecommendations = jobsData?.jobs || [];

  // Use progressive logo loading for job recommendations
  const { getJobLogo, isLogoLoading } = useProgressiveLogos(jobRecommendations);

  const userInitials = userName.split(' ').map(n => n[0]).join('').toUpperCase();

  useEffect(() => {
    if (user) {
      setUserName(user.user_metadata?.full_name || user.email?.split('@')[0] || user.email || "User");
    }
  }, [user]);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        console.log('🔄 Loading dashboard data...');

        // Load all dashboard data in parallel with better error handling
        const [
          statsData,
          activityData,
          profileData,
          emailData
        ] = await Promise.all([
          DashboardService.getDashboardStats().catch(err => {
            console.error('Error loading dashboard stats:', err);
            // Return fallback stats matching DashboardStats interface
            return {
              total_applications: 0,
              pending_applications: 0,
              interview_requests: 0,
              total_jobs_viewed: 0,
              profile_completion_percentage: 0,
              recent_activity_count: 0,
            } as DashboardStats;
          }),
          DashboardService.getRecentActivity().catch(err => {
            console.error('Error loading recent activity:', err);
            return [];
          }),
          DashboardService.getUserProfile().catch(err => {
            console.error('Error loading user profile:', err);
            return {
              id: 'demo-user',
              full_name: 'Demo User',
              profile_completion: 50,
              resume_score: 70,
            };
          }),
          DashboardService.getEmailOutreachStats().catch(err => {
            console.error('Error loading email stats:', err);
            return {
              total_emails_sent: 0,
              emails_this_month: 0,
              remaining_emails: 0,
              email_limit: 0,
              success_rate: 0,
              response_rate: 0,
            } as EmailOutreachStats;
          })
        ]);

        console.log('✅ Dashboard data loaded successfully:', {
          stats: !!statsData,
          activities: activityData.length,
          profile: !!profileData,
          email: !!emailData
        });

        // Determine connection status based on data quality
        setConnectionStatus('connected'); // Default to connected

        setDashboardStats(statsData as DashboardStats);
        setRecentActivity(activityData);
        setUserProfile(profileData);
        setEmailStats(emailData as EmailOutreachStats);



      } catch (err) {
        console.error('Error loading dashboard data:', err);
        setError('Failed to load dashboard data. Please try refreshing the page.');
      } finally {
        setIsLoading(false);
      }
    };

    // Load dashboard data regardless of authentication status
    // The DashboardService will handle demo mode if no user is authenticated
    loadDashboardData();
  }, [user]);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 17) return "Good Afternoon";
    return "Good Evening";
  };

  const formatNumber = (num: number) => {
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  // Removed weekly trend change calculation since stats do not include trend series

  if (error) {
    return (
      <div className="min-h-screen flex w-full bg-gray-50">
        <NewSidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Something went wrong</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <Button onClick={() => window.location.reload()} className="text-white" style={{ backgroundColor: '#b24e55' }}>
              Try Again
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 md:flex mobile-page">
      <NewSidebar />
      <div className="flex-1 flex flex-col w-full">
        {/* Enhanced Header */}
        <header className="hidden md:flex h-16 shrink-0 items-center justify-between px-6 border-b bg-white sticky top-0 z-10 shadow-sm">
          <div className="flex items-center gap-4">
            {/* Connection Status Indicator */}
            {connectionStatus === 'demo' && (
              <Badge className="bg-blue-100 text-blue-700 border-blue-200 text-xs">
                <div className="w-2 h-2 bg-blue-500 rounded-full mr-1"></div>
                Demo Mode
              </Badge>
            )}
            {connectionStatus === 'connected' && !isPremium && (
              <Badge className="bg-green-100 text-green-700 border-green-200 text-xs">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-1"></div>
                Live Data
              </Badge>
            )}
            {isPremium && (
              <Badge className="bg-gradient-to-r from-yellow-100 to-amber-100 text-yellow-800 border-yellow-300 text-xs font-medium shadow-sm">
                <Crown className="w-3 h-3 mr-1" />
                Premium
              </Badge>
            )}
          </div>
          
          <div className="flex items-center gap-3 pr-2 md:pr-0">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="rounded-full flex items-center gap-2 p-1 pl-3 hover:bg-gray-100">
                  <span className="text-sm font-medium hidden md:inline">{userName}</span>
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user?.user_metadata?.avatar_url} />
                    <AvatarFallback style={{ backgroundColor: '#b24e55' }} className="text-white">
                      {userInitials}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/profile" className="flex items-center cursor-pointer">
                    <User className="mr-2 h-4 w-4" />
                    <span>Profile</span>
                  </Link>
                </DropdownMenuItem>
                
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => signOut?.()}>
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>
        
        <div className="flex-1 mobile-app-content md:p-6 max-w-7xl mx-auto w-full">
          {(isLoading || jobsLoading) ? (
            <div className="flex items-center justify-center h-[80vh]">
              <div className="flex flex-col items-center gap-4">
                <Loader2 className="w-10 h-10 animate-spin" style={{ color: '#b24e55' }} />
                <p className="text-sm text-gray-500">Loading your personalized dashboard...</p>
              </div>
            </div>
          ) : (
            <>
              {/* Enhanced Greeting with Status */}
              <BlurFade delay={0.1}>
                <div className={cn(
                  "mobile-card-compact mb-4 md:mb-8 rounded-xl md:rounded-2xl p-3 md:p-6 border shadow-sm",
                  isPremium 
                    ? "bg-gradient-to-r from-yellow-50 via-amber-50 to-yellow-100 border-yellow-200" 
                    : "bg-gradient-to-r from-white to-gray-50 border-gray-100"
                )}>
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 md:gap-4">
                    <div className="flex-1">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 mb-2">
                        <h1 className="mobile-heading-md sm:text-2xl md:text-3xl font-bold text-gray-900">
                          {getGreeting()}, {userName} 👋
                        </h1>
                        
                      </div>
                      <p className="text-gray-600 mobile-body-sm sm:text-base md:text-lg mb-2 md:mb-3">
                        {isPremium 
                          ? "Welcome back to your premium dashboard experience!" 
                          : "Here's your job search progress today"
                        }
                      </p>
                      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4">
                        {isPremium && (
                          <div className="flex items-center gap-2">
                            <Crown className="h-4 w-4 text-yellow-600" />
                            <span className="text-xs sm:text-sm text-yellow-700 font-medium">
                              Premium Access Active
                            </span>
                          </div>
                        )}
                        {connectionStatus === 'demo' && (
                          <div className="flex items-center gap-2">
                            <Shield className="h-4 w-4 text-blue-600" />
                            <span className="text-xs sm:text-sm text-blue-700 font-medium">
                              Demo Mode - Sample Data
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                    {/* Mobile Quick Actions */}
                    <div className="lg:hidden flex gap-1.5 mt-3">
                      <Link to="/jobs" className="flex-1">
                        <MobileButton
                          variant="primary"
                          size="sm"
                          icon={Search}
                          className="w-full mobile-button-primary"
                          style={!isPremium ? { backgroundColor: '#b24e55' } : {}}
                        >
                          {isPremium ? "Premium Jobs" : "Find Jobs"}
                        </MobileButton>
                      </Link>
                      <Link to="/resume-builder" className="flex-1">
                        <MobileButton
                          variant="primary"
                          size="sm"
                          icon={FileText}
                          className="w-full mobile-button-primary"
                        >
                          Resume
                        </MobileButton>
                      </Link>
                    </div>
                    
                    {/* Desktop Quick Actions */}
                    <div className="hidden lg:flex items-center gap-3">
                      <Button className={`text-white ${isPremium ? 'bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700' : ''}`} style={!isPremium ? { backgroundColor: '#b24e55' } : {}} asChild>
                        <Link to="/jobs" className="flex items-center gap-2">
                          <Search className="h-4 w-4" />
                          {isPremium ? "Premium Jobs" : "Find Jobs"}
                        </Link>
                      </Button>
                      <Button variant="outline" asChild>
                        <Link to="/resume-builder" className="flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          {isPremium ? "AI Resume Builder" : "Optimize Resume"}
                        </Link>
                      </Button>
                    </div>
                  </div>
                </div>
              </BlurFade>

              {/* Enhanced Grid Layout */}
              <div className="mobile-grid-stack lg:grid lg:grid-cols-12 lg:gap-6">
                
                {/* Left Column - Main Content */}
                <div className="lg:col-span-8 space-y-4 md:space-y-6">
                  
                  {/* Enhanced Metrics Row */}
                  <BlurFade delay={0.2}>
                    {/* Mobile Metrics */}
                    <div className="md:hidden mobile-grid-stack">
                      <MobileMetricCard
                        label={isPremium ? "Premium Applications" : "Jobs Applied"}
                        value={formatNumber(dashboardStats?.total_applications || 0)}
                        change={`${dashboardStats?.recent_activity_count || 0} recent activities`}
                        icon={Briefcase}
                        subtitle={isPremium ? "Total applications" : "Total applications"}
                        isPremium={isPremium}
                      />
                      <MobileMetricCard
                        label={isPremium ? "Premium Outreach" : "Emails Sent"}
                        value={formatNumber(emailStats?.total_emails_sent || 0)}
                        change={(emailStats?.total_emails_sent || 0) > 0 
                          ? `${Math.round(emailStats?.response_rate || 0)}% response rate`
                          : '+0% response rate'}
                        icon={Mail}
                        subtitle={`${Math.round(((emailStats?.response_rate || 0) / 100) * (emailStats?.total_emails_sent || 0))} responses`}
                        isPremium={isPremium}
                      />
                      <MobileMetricCard
                        label={isPremium ? "Reviewed Applications" : "Reviewed Applications"}
                        value={formatNumber(dashboardStats?.interview_requests || 0)}
                        change={(dashboardStats?.interview_requests || 0) > 0 
                          ? `${Math.round(((dashboardStats?.interview_requests || 0) / Math.max(dashboardStats?.total_applications || 1, 1)) * 100)}% conversion`
                          : '+0% conversion'}
                        icon={Calendar}
                        subtitle={"From applications"}
                        isPremium={isPremium}
                      />
                    </div>
                    
                    {/* Desktop Metrics */}
                    <div className="hidden md:grid grid-cols-1 md:grid-cols-3 gap-4">
                      <EnhancedMetricCard
                        label={isPremium ? "Premium Applications" : "Jobs Applied"}
                        value={formatNumber(dashboardStats?.total_applications || 0)}
                        change={`${dashboardStats?.recent_activity_count || 0} recent activities`}
                        icon={Briefcase}
                        subtitle={isPremium ? "Total applications" : "Total applications"}
                        trend={[0, 0, 0, 0, 0, 0, 0]}
                        isPremium={isPremium}
                      />
                      <EnhancedMetricCard
                        label={isPremium ? "Premium Outreach" : "Emails Sent"}
                        value={formatNumber(emailStats?.total_emails_sent || 0)}
                        change={(emailStats?.total_emails_sent || 0) > 0 
                          ? `${Math.round(emailStats?.response_rate || 0)}% response rate`
                          : '+0% response rate'}
                        icon={Mail}
                        subtitle={`${Math.round(((emailStats?.response_rate || 0) / 100) * (emailStats?.total_emails_sent || 0))} responses`}
                        trend={[2, 3, 1, 4, 2, 5, 3]}
                        isPremium={isPremium}
                      />
                      <EnhancedMetricCard
                        label={isPremium ? "Reviewed Applications" : "Reviewed Applications"}
                        value={formatNumber(dashboardStats?.interview_requests || 0)}
                        change={(dashboardStats?.interview_requests || 0) > 0 
                          ? `${Math.round(((dashboardStats?.interview_requests || 0) / Math.max(dashboardStats?.total_applications || 1, 1)) * 100)}% conversion`
                          : '+0% conversion'}
                        icon={Calendar}
                        subtitle={"From applications"}
                        trend={[0, 1, 0, 2, 1, 1, 2]}
                        isPremium={isPremium}
                      />
                    </div>
                  </BlurFade>

                  {/* Applied Jobs Section */}
                  <BlurFade delay={0.25}>
                    <AppliedJobsWidget limit={5} />
                  </BlurFade>

                  {/* AI Job Recommendations Section - Full Width */}
                  <BlurFade delay={0.3}>
                    <AIJobRecommendations limit={5} />
                  </BlurFade>

                </div>

                {/* Right Column - Sidebar Content */}
                <div className="lg:col-span-4 space-y-4 md:space-y-6">
                  
                  {/* Career Progress Widget */}
                  <BlurFade delay={0.5}>
                    <CareerProgressWidget />
                  </BlurFade>

                  {/* Quick Actions */}
                  <BlurFade delay={0.6}>
                    <Card className="bg-white border-0 shadow-sm">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg font-bold text-gray-900 flex items-center gap-2">
                          <Rocket className="h-5 w-5" style={{ color: '#b24e55' }} />
                          Quick Actions
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <QuickActionButton
                          icon={FileText}
                          label="Optimize Resume"
                          description="AI-powered improvements"
                          to="/resume-builder"
                          color="primary"
                        />
                        <QuickActionButton
                          icon={Mail}
                          label="Email Campaign"
                          description="Connect with recruiters"
                          to="/email-outreach"
                          color="success"
                        />
                      </CardContent>
                    </Card>
                  </BlurFade>

                  {/* Skills Analytics Widget */}
                  <BlurFade delay={0.65}>
                    <SkillsAnalyticsWidget />
                  </BlurFade>

                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;