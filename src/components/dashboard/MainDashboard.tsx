import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  BookOpen,
  BriefcaseBusiness,
  Calendar,
  CheckCircle,
  CircleCheck,
  CircleDashed,
  Clock,
  FileText,
  LineChart as LineChartIcon,
  PieChart as PieChartIcon,
  Plus,
  Search,
  Star,
  Target,
  TrendingUp,
  Users,
  Crown,
  Sparkles
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { StatCard } from "./StatCard";
import { RecommendedJobCard } from "./RecommendedJobCard";
import { TaskWidget } from "./TaskWidget";
import { RainbowButton } from "@/components/ui/rainbow-button";
import { ShinyButton } from "@/components/ui/shiny-button";
import { InteractiveHoverButton } from "@/components/ui/interactive-hover-button";
import { usePremiumUser } from "@/hooks/usePremiumUser";
import { useEffect, useState } from "react";
import { DashboardService, DashboardStats } from "@/services/dashboardService";
import { PremiumCard, PremiumHeader } from "@/components/ui/premium-badge";

export const MainDashboard = () => {
  const { isPremium, premiumData, loading: premiumLoading } = usePremiumUser();
  const [emailStats, setEmailStats] = useState<{ total: number; replies: number } | null>(null);
  const [stats, setStats] = useState<DashboardStats | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const [email, s] = await Promise.all([
        (async () => {
          const e = await DashboardService.getEmailOutreachStats();
          return { total: e.total_emails_sent, replies: Math.round((e.response_rate / 100) * e.total_emails_sent) };
        })(),
        DashboardService.getDashboardStats(),
      ]);
      if (mounted) {
        setEmailStats(email);
        setStats(s);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="px-4 md:px-0">
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6 mb-6 md:mb-8">
        {/* Column 1 and 2 (Job Board) */}
        <div className="lg:col-span-2 space-y-4 md:space-y-6">
          {/* Job Board */}
          <Card className={`overflow-hidden border-0 shadow-sm ${isPremium ? 'bg-white border-2 border-gray-200' : ''}`}>
            <CardHeader className={`border-b pb-3 ${isPremium ? 'bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-600 text-yellow-900' : 'bg-gradient-to-r from-blue-50 to-indigo-50'}`}>
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <CardTitle className={`${isPremium ? 'flex items-center gap-2' : ''} text-base md:text-lg`}>
                    {isPremium && <Crown className="h-4 w-4 md:h-5 md:w-5" />}
                    <span className="truncate">{isPremium ? 'Premium Job Opportunities' : 'Job Opportunities'}</span>
                  </CardTitle>
                  <CardDescription className={`${isPremium ? 'text-yellow-800' : ''} text-sm`}>
                    {isPremium ? 'Exclusive jobs curated for premium members' : 'Recommended based on your profile'}
                  </CardDescription>
                </div>
                <Link to="/jobs" className={`text-sm flex items-center gap-1 hover:underline ${isPremium ? 'text-yellow-800' : 'text-blue-600'} flex-shrink-0 ml-2`}>
                  <span className="hidden sm:inline">View all</span>
                  <ArrowUpRight className="h-3 w-3" />
                </Link>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y">
                <RecommendedJobCard
                  title="Senior Frontend Developer"
                  company="TechFlow Inc"
                  logo="T"
                  logoColor="bg-blue-100 text-blue-600"
                  location="San Francisco, CA"
                  salary="$120K - $160K"
                  postedTime="2 days ago"
                  matchScore={96}
                  skills={["React", "TypeScript", "Next.js"]}
                />
                <RecommendedJobCard
                  title="Full Stack Engineer"
                  company="StartupXYZ"
                  logo="S"
                  logoColor="bg-purple-100 text-purple-600"
                  location="Remote"
                  salary="$100K - $140K"
                  postedTime="3 days ago"
                  matchScore={92}
                  skills={["Node.js", "React", "AWS"]}
                />
                <RecommendedJobCard
                  title="Frontend Developer"
                  company="GrowthTech"
                  logo="G"
                  logoColor="bg-green-100 text-green-600"
                  location="Austin, TX"
                  salary="$90K - $120K" 
                  postedTime="1 day ago"
                  matchScore={88}
                  skills={["JavaScript", "React", "CSS"]}
                />
              </div>
              <div className="p-3 md:p-4 bg-gray-50 flex justify-center">
                <RainbowButton asChild>
                  <Link to="/jobs" className="flex items-center gap-1.5 text-sm">
                    <Search className="h-4 w-4" />
                    <span className="hidden sm:inline">Find More Jobs</span>
                    <span className="sm:hidden">More Jobs</span>
                  </Link>
                </RainbowButton>
              </div>
            </CardContent>
          </Card>

          {/* Email Outreach Tracker */}
          <Card className={`overflow-hidden border-0 shadow-sm ${isPremium ? 'bg-white border-2 border-gray-200' : ''}`}>
            <CardHeader className={`flex flex-row items-center justify-between pb-2 ${isPremium ? 'bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-600 text-yellow-900' : ''}`}>
              <div>
                <CardTitle className={isPremium ? 'flex items-center gap-2' : ''}>
                  {isPremium && <Crown className="h-5 w-5" />}
                  {isPremium ? 'Premium Email Outreach' : 'Email Outreach'}
                </CardTitle>
                <CardDescription className={isPremium ? 'text-yellow-800' : ''}>
                  {isPremium ? 'Advanced networking tools for premium members' : 'Connect with professionals'}
                </CardDescription>
              </div>
              <Link to="/email-outreach" className={`text-sm flex items-center gap-1 hover:underline ${isPremium ? 'text-yellow-800' : 'text-blue-600'}`}>
                <span>View all</span>
                <ArrowUpRight className="h-3 w-3" />
              </Link>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4 items-center mb-6">
                <div className="flex-1">
                  <div className="flex justify-between text-sm mb-1.5">
                    <span className="font-medium">Weekly Outreach Goal</span>
                    <span className="font-medium">12/15</span>
                  </div>
                  <div className="h-3 rounded-full bg-gray-100 overflow-hidden">
                    <div 
                      className={`h-full rounded-full ${isPremium ? 'bg-gradient-to-r from-yellow-500 to-yellow-600' : 'bg-gradient-to-r from-green-500 to-emerald-600'}`}
                      style={{ width: '80%' }}
                    ></div>
                  </div>
                  <div className="flex justify-between text-xs text-gray-500 mt-1.5">
                    <span>3 more to reach goal</span>
                    <span>80% complete</span>
                  </div>
                </div>
                <div className="hidden md:block">
                  <Button variant="outline" size="sm" asChild>
                    <Link to="/email-outreach">
                      Send Email
                    </Link>
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-blue-50 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-blue-700">{emailStats?.total ?? '…'}</div>
                  <div className="text-xs text-gray-600">Emails Sent</div>
                </div>
                <div className="bg-green-50 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-green-700">{emailStats?.replies ?? '…'}</div>
                  <div className="text-xs text-gray-600">Responses</div>
                </div>
                <div className="bg-amber-50 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-amber-700">{stats?.pending_applications ?? '…'}</div>
                  <div className="text-xs text-gray-600">Pending</div>
                </div>
                <div className="bg-indigo-50 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-indigo-700">{stats?.interview_requests ?? '…'}</div>
                  <div className="text-xs text-gray-600">Reviewed Applications</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Column 3 (Side Widgets) */}
        <div className="space-y-6">
          {/* Resume Score Card */}
          <Card className={`overflow-hidden border-0 shadow-sm ${isPremium ? 'bg-white border-2 border-gray-200' : ''}`}>
            <CardHeader className={`border-b pb-3 ${isPremium ? 'bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-600 text-yellow-900' : 'bg-gradient-to-r from-purple-50 to-indigo-50'}`}>
              <CardTitle className="flex items-center gap-2">
                <FileText className={`h-4 w-4 ${isPremium ? 'text-yellow-800' : 'text-indigo-600'}`} />
                {isPremium ? 'AI Resume Optimization' : 'Resume Optimization'}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between mb-4">
                <div className={`w-16 h-16 rounded-full border-4 flex items-center justify-center ${isPremium ? 'border-yellow-300' : 'border-indigo-100'}`}>
                  <span className={`text-xl font-bold ${isPremium ? 'text-yellow-700' : 'text-indigo-700'}`}>
                    {isPremium ? '95%' : '85%'}
                  </span>
                </div>
                <div className="flex-1 ml-4">
                  <h4 className="font-medium text-sm">Resume Score</h4>
                  <p className="text-xs text-gray-500 mt-1">
                    {isPremium 
                      ? 'Your premium-optimized resume outperforms 95% of applicants' 
                      : 'Your resume outperforms 75% of applicants in your field'
                    }
                  </p>
                </div>
              </div>
            
              <div className="space-y-3 mb-4">
                <div className="flex items-start gap-2">
                  <CircleCheck className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                   <div>
                    <div className="text-sm font-medium">Strong work experience</div>
                    <div className="text-xs text-gray-500">Clear project descriptions with metrics</div>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <CircleDashed className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="text-sm font-medium">
                      {isPremium ? 'AI-enhanced skills section' : 'Skills section needs work'}
                    </div>
                    <div className="text-xs text-gray-500">
                      {isPremium ? 'Optimized with AI-powered keywords' : 'Add more industry-specific keywords'}
                    </div>
                  </div>
                </div>
              </div>
            
              <Button className={`w-full ${isPremium ? 'bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700' : 'bg-indigo-600 hover:bg-indigo-700'}`} asChild>
                <Link to="/resume-builder">
                  {isPremium ? 'AI Optimize Resume' : 'Optimize Resume'}
                </Link>
              </Button>
            </CardContent>
          </Card>
        
          {/* Task Widget - Upcoming Schedule */}
          <TaskWidget
            tasks={[
              {
                id: "1",
                title: "TechFlow Interview",
                description: "Technical interview with senior developer",
                date: "Today",
                time: "2:00 PM - 3:00 PM",
                status: "upcoming",
                type: "interview"
              },
              {
                id: "2",
                title: "Networking Event",
                description: "Tech industry networking meetup",
                date: "Today",
                time: "6:00 PM - 8:00 PM",
                status: "upcoming",
                type: "task"
              },
              {
                id: "3",
                title: "Follow up with StartupXYZ",
                date: "Tomorrow",
                status: "upcoming",
                type: "followup"
              },
              {
                id: "4",
                title: "Update Portfolio",
                date: "Thursday",
                status: "upcoming",
                type: "task"
              }
            ]}
            title="Upcoming Schedule"
            description="Your calendar for the week"
          />
        
          {/* Skills Progress */}
          <Card className={`overflow-hidden border-0 shadow-sm ${isPremium ? 'bg-white border-2 border-gray-200' : ''}`}>
            <CardHeader className={`border-b pb-3 ${isPremium ? 'bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-600 text-yellow-900' : 'bg-gradient-to-r from-green-50 to-emerald-50'}`}>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className={`h-4 w-4 ${isPremium ? 'text-yellow-800' : 'text-green-600'}`} />
                {isPremium ? 'Premium Skills Progress' : 'Skills Progress'}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-3">
              <div className="space-y-1.5">
                <div className="flex justify-between text-sm">
                  <span className="font-medium">React</span>
                  <span>Advanced</span>
                </div>
                <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                  <div className={`h-full rounded-full ${isPremium ? 'bg-gradient-to-r from-yellow-500 to-yellow-600' : 'bg-green-500'}`} style={{ width: '90%' }}></div>
                </div>
              </div>
              <div className="space-y-1.5">
                <div className="flex justify-between text-sm">
                  <span className="font-medium">TypeScript</span>
                  <span>Intermediate</span>
                </div>
                <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                  <div className={`h-full rounded-full ${isPremium ? 'bg-gradient-to-r from-yellow-500 to-yellow-600' : 'bg-green-500'}`} style={{ width: '75%' }}></div>
                </div>
              </div>
              <div className="space-y-1.5">
                <div className="flex justify-between text-sm">
                  <span className="font-medium">System Design</span>
                  <span>Beginner</span>
                </div>
                <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                  <div className={`h-full rounded-full ${isPremium ? 'bg-gradient-to-r from-yellow-500 to-yellow-600' : 'bg-green-500'}`} style={{ width: '45%' }}></div>
                </div>
              </div>
              <Button variant="outline" size="sm" className="w-full" asChild>
                <Link to="/skills">
                  View All Skills
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Tasks & Profile Section */}
      <section className="mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <TaskWidget
            tasks={[
              {
                id: "5",
                title: "Connect with industry professionals",
                date: "Friday",
                status: "upcoming",
                type: "task"
              },
              {
                id: "6",
                title: "Update LinkedIn profile",
                date: "Saturday",
                status: "upcoming",
                type: "task"
              }
            ]}
            title="Action Items"
            description="Tasks to complete this week"
            maxItems={2}
          />
          
          <Card className={`overflow-hidden border-0 shadow-sm ${isPremium ? 'bg-white border-2 border-gray-200' : ''}`}>
            <CardHeader className={`pb-2 ${isPremium ? 'bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-600 text-yellow-900' : ''}`}>
              <CardTitle className={isPremium ? 'flex items-center gap-2' : ''}>
                {isPremium && <Crown className="h-5 w-5" />}
                {isPremium ? 'Premium Profile Analytics' : 'Profile Analytics'}
              </CardTitle>
              <CardDescription className={isPremium ? 'text-yellow-800' : ''}>
                {isPremium ? 'Advanced insights for premium members' : 'Track your profile performance'}
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-2">
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div className="bg-blue-50 rounded-lg p-3 text-center">
                  <div className="text-xl font-bold text-blue-700">{stats?.total_jobs_viewed ?? 0}</div>
                  <div className="text-xs text-gray-600">Jobs Viewed</div>
                </div>
                <div className="bg-amber-50 rounded-lg p-3 text-center">
                  <div className="text-xl font-bold text-amber-700">{`${stats?.profile_completion_percentage ?? 0}%`}</div>
                  <div className="text-xs text-gray-600">Resume Score</div>
                </div>
                <div className="bg-green-50 rounded-lg p-3 text-center">
                  <div className="text-xl font-bold text-green-700">{emailStats?.replies ?? 0}</div>
                  <div className="text-xs text-gray-600">Connections</div>
                </div>
                <div className="bg-purple-50 rounded-lg p-3 text-center">
                  <div className="text-xl font-bold text-purple-700">{`${stats?.profile_completion_percentage ?? 0}%`}</div>
                  <div className="text-xs text-gray-600">Completion</div>
                </div>
              </div>
              <Link to="/profile">
                <InteractiveHoverButton className="w-full">
                  View Profile Details
                </InteractiveHoverButton>
              </Link>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
};

// Legacy compatibility components
export const QuickStatCard = ({ title, value, trend, icon, color }) => {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className={`text-2xl font-bold ${color}`}>{value}</p>
          </div>
          <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center">
            {icon}
          </div>
        </div>
        <div className="mt-2 text-xs text-green-600">
          {trend} this week
        </div>
      </CardContent>
    </Card>
  );
};

export const JobCard = ({ title, company, location, match }) => {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-semibold text-lg">{title}</h3>
          <Badge variant="secondary" className="text-xs">
            {match}% match
          </Badge>
        </div>
        <p className="text-sm text-gray-600 mb-1">{company}</p>
        <p className="text-xs text-gray-500">{location}</p>
      </CardContent>
    </Card>
  );
};

export const ExtendedJobCard = ({ title, company, location, salary, match, skills }) => {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-semibold text-lg">{title}</h3>
          <Badge variant="secondary" className="text-xs">
            {match}% match
          </Badge>
        </div>
        <p className="text-sm text-gray-600 mb-1">{company}</p>
        <p className="text-xs text-gray-500 mb-2">{location}</p>
        <p className="text-sm font-medium text-primary mb-3">{salary}</p>
        <div className="flex flex-wrap gap-1">
          {skills.map((skill, index) => (
            <Badge key={index} variant="outline" className="text-xs">
              {skill}
            </Badge>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export const AnalyticsStat = ({ label, value, trend, icon }) => {
  return (
    <div className="bg-slate-50 p-2 rounded-lg border">
      <div className="flex items-center gap-1 mb-1">
        {icon}
        <span className="text-xs text-gray-600">{label}</span>
      </div>
      <div className="text-lg font-semibold">{value}</div>
      <div className="text-xs text-green-600">{trend}</div>
    </div>
  );
};