import React, { useState, useEffect, useCallback } from 'react';
import { NewSidebar } from "@/components/layout/NewSidebar";
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage } from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { contactsService, ContactForDisplay } from '@/services/contactsService';
import { testDatabaseConnection } from '@/utils/databaseTest';
import ContactList from '@/components/email/ContactList';
import SimpleEmailComposer from '@/components/email/SimpleEmailComposer';
import AWSEmailComposer from '@/components/email/AWSEmailComposer';
import { useAuth } from '@/contexts/AuthContext';
import { usePremiumUser } from '@/hooks/usePremiumUser';
import { PremiumBadge } from '@/components/ui/premium-badge';
import { googleAuthService, GoogleUser, GoogleContact } from '@/services/googleAuthService';
import emailService from '@/services/emailService';
import { DashboardService } from '@/services/dashboardService';
import { 
  Mail, 
  Users, 
  CheckCircle, 
  AlertCircle, 
  Loader2, 
  RefreshCw,
  Database,
  Shield,
  ShieldCheck,
  Info,
  Zap,
  Cloud,
  AlertTriangle,
  Settings,
  Send,
  Crown,
  Lock,
  TrendingUp,
  MessageSquare,
  Calendar,
  Eye,
  Target
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import MobileCard from '@/components/mobile/MobileCard';
import MobileButton from '@/components/mobile/MobileButton';
import { EmailUsageProgress } from '@/components/email/EmailUsageProgress';
import { SubscriptionRenewalDialog } from '@/components/email/SubscriptionRenewalDialog';
import { useEmailUsage } from '@/hooks/useEmailUsage';

const EmailOutreach = () => {
  const { signOut } = useAuth();
  const { isPremium, loading: premiumLoading } = usePremiumUser();
  const [contacts, setContacts] = useState<ContactForDisplay[]>([]);
  const [selectedContacts, setSelectedContacts] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingContacts, setIsLoadingContacts] = useState(false);
  const [isComposerOpen, setIsComposerOpen] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [databaseConnected, setDatabaseConnected] = useState(false);
  const [awsApiStatus, setAwsApiStatus] = useState<{ connected: boolean; message: string } | null>(null);
  
  // Gmail authentication states
  const [googleUser, setGoogleUser] = useState<GoogleUser | null>(null);
  const [isGoogleAuthenticating, setIsGoogleAuthenticating] = useState(false);
  const [googleContacts, setGoogleContacts] = useState<GoogleContact[]>([]);
  const [useGmailMode, setUseGmailMode] = useState(false);
  const [hasAttemptedAuth, setHasAttemptedAuth] = useState(false);
  const [showAuthOptions, setShowAuthOptions] = useState(false);
  
  // Email stats
  const [emailsSentCount, setEmailsSentCount] = useState(0);
  const [followupsNeededCount, setFollowupsNeededCount] = useState(0);
  const [repliesReceivedCount, setRepliesReceivedCount] = useState(0);
  const [totalContactsCount, setTotalContactsCount] = useState(0);
  
  // Learn More dialog state
  const [showLearnMoreDialog, setShowLearnMoreDialog] = useState(false);
  
  // Email usage and renewal dialog state
  const [showRenewalDialog, setShowRenewalDialog] = useState(false);
  const { emailUsage, loading: emailUsageLoading, refreshUsage, checkCanSendEmails, incrementEmailCount } = useEmailUsage();

  // Load Google contacts
  const loadGoogleContacts = async () => {
    if (!googleUser) return;
    
    setIsLoadingContacts(true);
    try {
      const googleContactsData = await googleAuthService.getContacts(googleUser.access_token);
      setGoogleContacts(googleContactsData);
      
      // Convert Google contacts to display format
      const displayContacts: ContactForDisplay[] = googleContactsData.map(contact => ({
        id: contact.id,
        name: contact.name,
        email: contact.email,
        phone: contact.phone || '',
        company: contact.company || '',
        title: contact.title || '',
        status: 'active',
        email_sent: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }));
      
      setContacts(displayContacts);
      toast.success(`Loaded ${googleContactsData.length} contacts from Google`);
    } catch (error) {
      console.error('Error loading Google contacts:', error);
      toast.error('Failed to load Google contacts');
    } finally {
      setIsLoadingContacts(false);
    }
  };

  // Handle Gmail authentication
  const handleGmailAuth = async () => {
    setIsGoogleAuthenticating(true);
    setHasAttemptedAuth(true);
    try {
      await googleAuthService.initiateAuth();
    } catch (error) {
      console.error('Error initiating Google auth:', error);
      toast.error('Failed to initiate Gmail authentication');
      setIsGoogleAuthenticating(false);
    }
  };

  // Handle successful authentication
  const handleAuthSuccess = useCallback((user: GoogleUser) => {
    setGoogleUser(user);
    setIsGoogleAuthenticating(false);
    setShowAuthOptions(false);
    
    toast.success('Gmail authentication successful!');
    
    console.log('Gmail authentication details:', {
      email: user.email,
      hasAccessToken: !!user.access_token,
      hasRefreshToken: !!user.refresh_token,
      provider: user.provider
    });
  }, []);

  // Check authentication status and refresh if needed
  const checkAuthStatus = async () => {
    if (!googleUser) return;
    
    try {
      setIsGoogleAuthenticating(true);
      const refreshedUser = await googleAuthService.getStoredUser();
      
      if (refreshedUser) {
        setGoogleUser(refreshedUser);
        toast.success('Authentication verified');
      } else {
        setGoogleUser(null);
        toast.warning('Authentication expired. Please re-authenticate.');
        setShowAuthOptions(true);
      }
    } catch (error) {
      console.error('Error checking auth status:', error);
      toast.error('Error checking authentication status');
    } finally {
      setIsGoogleAuthenticating(false);
    }
  };

  // Handle forced reauthentication - clears existing auth and starts fresh
  const handleForceReauth = async () => {
    try {
      setIsGoogleAuthenticating(true);
      
      // Clear existing authentication data
      if (googleUser) {
        await googleAuthService.clearStoredAuth();
        setGoogleUser(null);
        toast.info('Previous authentication cleared');
      }
      
      // Start fresh authentication with force reauth flag
      await googleAuthService.initiateAuth(true);
    } catch (error) {
      console.error('Error during forced reauthentication:', error);
      toast.error('Failed to initiate reauthentication');
      setIsGoogleAuthenticating(false);
    }
  };

  // Switch between Gmail and Database modes
  const switchToGmailMode = () => {
    if (!googleUser) {
      setShowAuthOptions(true);
      toast.warning('Please authenticate with Gmail first');
      return;
    }
    setUseGmailMode(true);
    loadGoogleContacts();
  };

  const switchToDatabaseMode = () => {
    setUseGmailMode(false);
    setShowAuthOptions(false);
    loadContactsFromDatabase();
  };

  // Load contacts from Supabase database (filtered for compose section - no emails sent in last 7 days)
  const loadContactsFromDatabase = async () => {
    setIsLoadingContacts(true);
    try {
      console.log('🔍 Loading contacts from database (available for email)...');
      
      // First test the database connection
      const testResult = await testDatabaseConnection();
      if (!testResult.success) {
        console.error('Database connection test failed:', testResult);
        toast.error(`Database connection failed: ${testResult.message}`);
        setDatabaseConnected(false);
        return;
      }

      setDatabaseConnected(true);
      // Use the new method that filters contacts based on 7-day rule
      const contactsData = await contactsService.getContactsAvailableForEmail();
      setContacts(contactsData);
      
      if (contactsData.length > 0) {
        toast.success(`Loaded ${contactsData.length} contacts available for email (no emails sent in last 7 days)`);
      } else {
        toast.info('No contacts available for email - all contacts have been emailed within the last 7 days');
      }
    } catch (error) {
      console.error('Error loading contacts from database:', error);
      toast.error(`Failed to load contacts from database: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setDatabaseConnected(false);
    } finally {
      setIsLoadingContacts(false);
    }
  };

  // Test AWS API connection
  const testAwsApiConnection = async () => {
    try {
      const result = await emailService.testConnection();
      setAwsApiStatus({
        connected: result.success,
        message: result.success ? 'Email service ready' : result.message
      });
    } catch (error) {
      setAwsApiStatus({
        connected: false,
        message: 'Email service unavailable'
      });
    }
  };

  // Load email stats
  const loadEmailStats = async () => {
    try {
      const [emailsSent, followupsNeeded, repliesReceived, totalContacts] = await Promise.all([
        DashboardService.getEmailsSentCount(),
        DashboardService.getFollowupsNeededCount(),
        DashboardService.getRepliesReceivedCount(),
        DashboardService.getTotalContactsCount()
      ]);
      
      setEmailsSentCount(emailsSent);
      setFollowupsNeededCount(followupsNeeded);
      setRepliesReceivedCount(repliesReceived);
      setTotalContactsCount(totalContacts);
    } catch (error) {
      console.error('Error loading email stats:', error);
    }
  };

  // Check for OAuth callback authentication
  const checkForCallbackAuth = useCallback(async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const state = urlParams.get('state');
    
    if (code && state === 'email_outreach') {
      setIsGoogleAuthenticating(true);
      
      try {
        const user = await googleAuthService.handleCallback(code);
        handleAuthSuccess(user);
        
        // Clean up URL
        window.history.replaceState({}, document.title, window.location.pathname);
      } catch (error) {
        console.error('Error handling OAuth callback:', error);
        toast.error('Failed to complete authentication');
      } finally {
        setIsGoogleAuthenticating(false);
      }
    }
  }, [handleAuthSuccess]);

  // Initialize page
  useEffect(() => {
    const initializePage = async () => {
      setIsLoading(true);
      
      try {
        // Test AWS API connection
        await testAwsApiConnection();
        
        // Check for existing Google authentication
        const existingUser = await googleAuthService.getStoredUser();
        if (existingUser) {
          setGoogleUser(existingUser);
          console.log('Found existing Google authentication');
        }
        
        // Load database contacts by default
        await loadContactsFromDatabase();
        
        // Load email stats
        await loadEmailStats();
        
        // Check for OAuth callback
        await checkForCallbackAuth();
        
      } catch (error) {
        console.error('Error initializing page:', error);
        toast.error('Failed to initialize email outreach');
      } finally {
        setIsLoading(false);
      }
    };

    initializePage();
  }, [checkForCallbackAuth]);

  const handleContactSelect = (contactId: string) => {
    setSelectedContacts(prev => 
      prev.includes(contactId) 
        ? prev.filter(id => id !== contactId)
        : [...prev, contactId]
    );
  };

  const handleSelectAll = () => {
    setSelectedContacts(contacts.map(contact => contact.id));
  };

  const handleClearSelection = () => {
    setSelectedContacts([]);
  };

  const handleSendEmail = (contactIds: string[]) => {
    setSelectedContacts(contactIds);
    setIsComposerOpen(true);
  };

  const handleEmailSend = async (subject: string, body: string, isHtml: boolean) => {
    if (selectedContacts.length === 0) {
      toast.error('No contacts selected');
      return;
    }

    // Check email limits before sending (only for premium users)
    if (isPremium) {
      const canSendResult = await checkCanSendEmails(selectedContacts.length);
      if (!canSendResult.canSend) {
        toast.error(canSendResult.message || 'Email limit exceeded');
        setShowRenewalDialog(true);
        return;
      }
    }

    setIsSending(true);
    
    try {
      const selectedContactsData = contacts.filter(contact => 
        selectedContacts.includes(contact.id)
      );

      let successCount = 0;
      let failureCount = 0;

      // Send emails to selected contacts
      for (const contact of selectedContactsData) {
        try {
          if (useGmailMode && googleUser) {
            // Use Gmail API for sending
            await googleAuthService.sendEmail(
              googleUser.access_token,
              contact.email,
              subject,
              body,
              isHtml
            );
          } else {
            // Use simulation mode or AWS API
            console.log(`Simulating email send to ${contact.email}`);
            // In simulation, we just log the email
            await new Promise(resolve => setTimeout(resolve, 500)); // Simulate API call
          }
          
          successCount++;
          
                     // Update contact status in database if using database mode
           if (!useGmailMode) {
             try {
               await contactsService.markEmailSent(contact.id);
             } catch (dbError) {
               console.warn('Failed to update contact status in database:', dbError);
             }
           }
          
        } catch (error) {
          console.error(`Failed to send email to ${contact.email}:`, error);
          failureCount++;
        }
      }

      // Show results
      if (successCount > 0) {
        toast.success(
          `Successfully ${useGmailMode ? 'sent' : 'simulated'} ${successCount} email${successCount !== 1 ? 's' : ''}`
        );
        
        // Update email count for premium users
        if (isPremium && useGmailMode) {
          try {
            await incrementEmailCount(successCount);
          } catch (error) {
            console.error('Failed to update email count:', error);
          }
        }
      }
      
      if (failureCount > 0) {
        toast.error(`Failed to send ${failureCount} email${failureCount !== 1 ? 's' : ''}`);
      }

      // Refresh contacts to show updated email sent status
      if (!useGmailMode) {
        await loadContactsFromDatabase();
      }
      
      // Refresh email stats
      await loadEmailStats();
      
      // Close composer and clear selection
      setIsComposerOpen(false);
      setSelectedContacts([]);
    } catch (error) {
      console.error('Error sending emails:', error);
      toast.error('Failed to send emails');
    } finally {
      setIsSending(false);
    }
  };

  const handleRefreshContacts = () => {
    if (useGmailMode) {
      loadGoogleContacts();
    } else {
      loadContactsFromDatabase();
    }
    // Also refresh email stats
    loadEmailStats();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30 md:flex">
        <NewSidebar />
        <div className="flex-1 flex items-center justify-center w-full">
          <Card className="w-full max-w-md">
            <CardContent className="p-8 text-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Loading Email Outreach</h3>
              <p className="text-gray-600">Setting up your workspace...</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30 md:flex">
      <NewSidebar />
      <div className="flex-1 flex flex-col max-h-screen overflow-hidden w-full">
        {/* Header */}
        <header className="hidden md:flex h-16 shrink-0 items-center gap-2 bg-white/80 backdrop-blur-sm border-b border-gray-200/60">
          <div className="flex items-center gap-2 px-6 flex-1">
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbPage className="font-semibold flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    Email Outreach
                    {isPremium && (
                      <PremiumBadge variant="compact" />
                    )}
                  </BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
          
          
        </header>

        {/* Main Content */}
        <div className="flex-1 overflow-auto">
          {/* Premium Restriction Overlay */}
          {!isPremium && !premiumLoading && (
            <div className="relative h-full">
              {/* Blurred Content */}
              <div className="filter blur-sm pointer-events-none">
                <div className="p-6 space-y-6">
                  {/* Mock Gmail Authentication Section */}
                  <Card className="border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="bg-blue-100 p-2 rounded-full">
                            <Shield className="h-5 w-5 text-blue-600" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-blue-900">Premium Email Outreach</h3>
                            <p className="text-sm text-blue-700">
                              Connect with recruiters and hiring managers
                            </p>
                          </div>
                        </div>
                        <Badge className="bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-600 text-yellow-900 border-yellow-300">
                          <Crown className="w-3 h-3 mr-1" />
                          Premium
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Mock Stats Dashboard */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <Card>
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-600">Total Contacts</p>
                            <p className="text-2xl font-bold text-gray-900">{totalContactsCount}</p>
                          </div>
                          <div className="bg-blue-100 p-3 rounded-full">
                            <Users className="h-6 w-6 text-blue-600" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-600">Emails Sent</p>
                            <p className="text-2xl font-bold text-gray-900">89</p>
                          </div>
                          <div className="bg-green-100 p-3 rounded-full">
                            <Mail className="h-6 w-6 text-green-600" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-600">Response Rate</p>
                            <p className="text-2xl font-bold text-gray-900">23%</p>
                          </div>
                          <div className="bg-orange-100 p-3 rounded-full">
                            <AlertCircle className="h-6 w-6 text-orange-600" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-600">Interviews</p>
                            <p className="text-2xl font-bold text-gray-900">12</p>
                          </div>
                          <div className="bg-purple-100 p-3 rounded-full">
                            <CheckCircle className="h-6 w-6 text-purple-600" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Mock Email Composer */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Premium Email Composer</CardTitle>
                      <CardDescription>
                        Advanced email templates and AI-powered personalization
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="bg-gray-100 rounded-lg p-4 h-32"></div>
                        <div className="flex gap-2">
                          <Button className="bg-gradient-to-r from-blue-600 to-purple-600">
                            <Send className="w-4 h-4 mr-2" />
                            Send Campaign
                          </Button>
                          <Button variant="outline">Schedule</Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* Premium Upgrade Overlay */}
              <div className="absolute inset-0 bg-white/90 backdrop-blur-sm flex items-center justify-center p-6">
                <div className="text-center max-w-lg">
                  <div className="w-24 h-24 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Lock className="w-12 h-12 text-white" />
                  </div>
                  <h2 className="text-3xl font-bold text-gray-900 mb-4">
                    Premium Email Outreach
                  </h2>
                  <p className="text-lg text-gray-600 mb-6">
                    Unlock powerful email outreach tools to connect with recruiters and hiring managers. 
                    Send personalized campaigns, track responses, and land more interviews.
                  </p>
                  
                  <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-lg p-4 mb-6">
                    <h3 className="font-semibold text-yellow-800 mb-2">Premium Features Include:</h3>
                    <ul className="text-sm text-yellow-700 space-y-1">
                      <li>• Unlimited email campaigns</li>
                      <li>• AI-powered email templates</li>
                      <li>• Advanced analytics and tracking</li>
                      <li>• Gmail integration</li>
                      <li>• Response management</li>
                      <li>• Follow-up automation</li>
                    </ul>
                  </div>
                  
                  <div className="space-y-4">
                    <a 
                      href="https://payments.cashfree.com/forms/hirebuddy_premium_subscription" 
                      target="_parent"
                      className="block w-full"
                      style={{ textDecoration: 'none' }}
                    >
                      <Button className="w-full bg-gradient-to-r from-yellow-500 to-orange-600 hover:from-yellow-600 hover:to-orange-700 text-white font-semibold py-3 text-lg">
                        <Crown className="w-5 h-5 mr-2" />
                        Upgrade to Premium
                      </Button>
                    </a>
                    <p className="text-sm text-gray-500">
                      Join thousands of professionals who accelerated their job search
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Regular Content for Premium Users */}
          {isPremium && (
            <div className="p-4 md:p-6 space-y-4 md:space-y-6">
              {/* Re-authentication Section */}
              <Card className="border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50">
                <CardContent className="p-4">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="bg-blue-100 p-2 rounded-full">
                        <Shield className="h-5 w-5 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <div className="flex flex-col md:flex-row md:items-center gap-2">
                          <h3 className="font-semibold text-blue-900">Gmail Authentication</h3>
                          <Button
                            onClick={() => setShowLearnMoreDialog(true)}
                            variant="ghost"
                            size="sm"
                            className="text-blue-600 hover:text-blue-800 hover:bg-blue-100 p-1 h-auto w-fit"
                          >
                            <Info className="h-4 w-4" />
                            <span className="text-xs ml-1">Learn More</span>
                          </Button>
                        </div>
                        <p className="text-sm text-blue-700 mt-1">
                          {googleUser 
                            ? `Connected as ${googleUser.email}. Use Re-authenticate if experiencing issues.` 
                            : 'Connect your Gmail account to send emails'
                          }
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex flex-col md:flex-row items-stretch md:items-center gap-2">
                      {googleUser && (
                        <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-200 w-fit">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Connected
                        </Badge>
                      )}
                      
                      {/* Mobile Action Buttons */}
                      <div className="md:hidden space-y-2">
                        <MobileButton
                          onClick={googleUser ? checkAuthStatus : handleGmailAuth}
                          disabled={isGoogleAuthenticating}
                          variant={googleUser ? "outline" : "primary"}
                          icon={isGoogleAuthenticating ? Loader2 : (googleUser ? RefreshCw : Mail)}
                          className="w-full"
                        >
                          {isGoogleAuthenticating ? (
                            googleUser ? 'Verifying...' : 'Connecting...'
                          ) : (
                            googleUser ? 'Verify Connection' : 'Connect Gmail'
                          )}
                        </MobileButton>
                        
                        {googleUser && (
                          <MobileButton
                            onClick={handleForceReauth}
                            disabled={isGoogleAuthenticating}
                            variant="secondary"
                            icon={isGoogleAuthenticating ? Loader2 : Shield}
                            className="w-full"
                          >
                            {isGoogleAuthenticating ? 'Reauthenticating...' : 'Re-authenticate'}
                          </MobileButton>
                        )}
                      </div>
                      
                      {/* Desktop Action Buttons */}
                      <div className="hidden md:flex items-center gap-2">
                        <Button
                          onClick={googleUser ? checkAuthStatus : handleGmailAuth}
                          disabled={isGoogleAuthenticating}
                          variant={googleUser ? "outline" : "default"}
                          size="sm"
                          className="flex items-center gap-2"
                        >
                          {isGoogleAuthenticating ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin" />
                              {googleUser ? 'Verifying...' : 'Connecting...'}
                            </>
                          ) : (
                            <>
                              {googleUser ? (
                                <>
                                  <RefreshCw className="h-4 w-4" />
                                  Verify
                                </>
                              ) : (
                                <>
                                  <Mail className="h-4 w-4" />
                                  Connect Gmail
                                </>
                              )}
                            </>
                          )}
                        </Button>
                        
                        {googleUser && (
                          <Button
                            onClick={handleForceReauth}
                            disabled={isGoogleAuthenticating}
                            variant="secondary"
                            size="sm"
                            className="flex items-center gap-2"
                          >
                            {isGoogleAuthenticating ? (
                              <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Reauthenticating...
                              </>
                            ) : (
                              <>
                                <Shield className="h-4 w-4" />
                                Re-authenticate
                              </>
                            )}
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Authentication Options */}
              {showAuthOptions && (
                <Card className="border-blue-200 bg-blue-50/50">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Shield className="h-5 w-5 text-blue-600" />
                      Email Configuration
                    </CardTitle>
                    <CardDescription>
                      Manage your Gmail authentication settings and troubleshoot connection issues
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Alert className="border-blue-200 bg-blue-50">
                      <Info className="h-4 w-4 text-blue-600" />
                      <AlertDescription className="text-blue-800">
                        <strong>When to reauthenticate:</strong> If you're getting permission errors, emails aren't sending, 
                        or you've changed your Google account password, use the "Force Re-authenticate" option below.
                      </AlertDescription>
                    </Alert>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      
                      
                    </div>
                    
                    {!googleUser && (
                      <div className="pt-4 border-t">
                        <Button
                          onClick={handleGmailAuth}
                          disabled={isGoogleAuthenticating}
                          className="w-full"
                        >
                          {isGoogleAuthenticating ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Authenticating...
                            </>
                          ) : (
                            <>
                              <Mail className="h-4 w-4 mr-2" />
                              Authenticate with Gmail
                            </>
                          )}
                        </Button>
                      </div>
                    )}
                    
                    {googleUser && (
                      <div className="pt-4 border-t space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <ShieldCheck className="h-4 w-4 text-green-600" />
                            <span className="text-sm font-medium">Authenticated as {googleUser.email}</span>
                          </div>
                          <Button
                            onClick={checkAuthStatus}
                            variant="outline"
                            size="sm"
                            disabled={isGoogleAuthenticating}
                          >
                            {isGoogleAuthenticating ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <RefreshCw className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                        
                        {/* Reauthentication Options */}
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                          <h4 className="font-medium text-blue-900 mb-2">Having Issues?</h4>
                          <p className="text-sm text-blue-700 mb-3">
                            If you're experiencing problems sending emails or accessing your Gmail, try reauthenticating.
                          </p>
                          <div className="flex gap-2">
                            <Button
                              onClick={handleForceReauth}
                              disabled={isGoogleAuthenticating}
                              variant="outline"
                              size="sm"
                              className="border-blue-300 text-blue-700 hover:bg-blue-100"
                            >
                              {isGoogleAuthenticating ? (
                                <>
                                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                  Reauthenticating...
                                </>
                              ) : (
                                <>
                                  <Shield className="h-4 w-4 mr-2" />
                                  Force Re-authenticate
                                </>
                              )}
                            </Button>
                            <Button
                              onClick={checkAuthStatus}
                              disabled={isGoogleAuthenticating}
                              variant="outline"
                              size="sm"
                              className="border-blue-300 text-blue-700 hover:bg-blue-100"
                            >
                              {isGoogleAuthenticating ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <>
                                  <RefreshCw className="h-4 w-4 mr-2" />
                                  Verify Status
                                </>
                              )}
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Connection Status */}
              {!useGmailMode && !databaseConnected && (
                <Alert className="border-amber-200 bg-amber-50">
                  <AlertTriangle className="h-4 w-4 text-amber-600" />
                  <AlertDescription className="text-amber-800">
                    <strong>Connection Issue:</strong> Unable to load contacts from the database. 
                    Please check your connection and try refreshing.
                  </AlertDescription>
                </Alert>
              )}

              {/* Stats Dashboard */}
              {/* Mobile Stats */}
              <div className="md:hidden space-y-3">
                <MobileCard variant="elevated" padding="sm">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <Users className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <div className="text-xs font-medium text-gray-600 mb-1">Total Contacts</div>
                        <div className="text-xl font-bold text-gray-900">{totalContactsCount}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-1 text-xs font-medium text-blue-600">
                        <TrendingUp className="h-3 w-3" />
                        Active
                      </div>
                    </div>
                  </div>
                </MobileCard>

                <MobileCard variant="elevated" padding="sm">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                        <Mail className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <div className="text-xs font-medium text-gray-600 mb-1">Emails Sent</div>
                        <div className="text-xl font-bold text-gray-900">{emailsSentCount}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-1 text-xs font-medium text-green-600">
                        <Send className="h-3 w-3" />
                        Delivered
                      </div>
                    </div>
                  </div>
                </MobileCard>

                <MobileCard variant="elevated" padding="sm">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                        <AlertCircle className="h-5 w-5 text-orange-600" />
                      </div>
                      <div>
                        <div className="text-xs font-medium text-gray-600 mb-1">Follow Ups Needed</div>
                        <div className="text-xl font-bold text-gray-900">{followupsNeededCount}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-1 text-xs font-medium text-orange-600">
                        <Calendar className="h-3 w-3" />
                        Pending
                      </div>
                    </div>
                  </div>
                </MobileCard>

                <MobileCard variant="elevated" padding="sm">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                        <MessageSquare className="h-5 w-5 text-purple-600" />
                      </div>
                      <div>
                        <div className="text-xs font-medium text-gray-600 mb-1">Replies Received</div>
                        <div className="text-xl font-bold text-gray-900">{repliesReceivedCount}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-1 text-xs font-medium text-purple-600">
                        <Eye className="h-3 w-3" />
                        {repliesReceivedCount > 0 ? `${Math.round((repliesReceivedCount / Math.max(emailsSentCount, 1)) * 100)}%` : '0%'}
                      </div>
                    </div>
                  </div>
                </MobileCard>
              </div>

              {/* Email Usage Progress (Premium Users Only) */}
              {isPremium && (
                <div className="mb-6">
                  <EmailUsageProgress
                    usage={emailUsage}
                    loading={emailUsageLoading}
                    onRenewClick={() => setShowRenewalDialog(true)}
                    compact={false}
                  />
                </div>
              )}

              {/* Desktop Stats */}
              <div className="hidden md:grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Total Contacts</p>
                        <p className="text-2xl font-bold text-gray-900">{totalContactsCount}</p>
                      </div>
                      <div className="bg-blue-100 p-3 rounded-full">
                        <Users className="h-6 w-6 text-blue-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Emails Sent</p>
                        <p className="text-2xl font-bold text-gray-900">{emailsSentCount}</p>
                      </div>
                      <div className="bg-green-100 p-3 rounded-full">
                        <Mail className="h-6 w-6 text-green-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Follow Ups Needed</p>
                        <p className="text-2xl font-bold text-gray-900">{followupsNeededCount}</p>
                      </div>
                      <div className="bg-orange-100 p-3 rounded-full">
                        <AlertCircle className="h-6 w-6 text-orange-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Replies Received</p>
                        <p className="text-2xl font-bold text-gray-900">{repliesReceivedCount}</p>
                      </div>
                      <div className="bg-purple-100 p-3 rounded-full">
                        <CheckCircle className="h-6 w-6 text-purple-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Email Composer Section */}
              <div className="space-y-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">Email Composer</h2>
                    <p className="text-sm text-gray-600 mt-1">
                      Showing contacts who haven't been emailed in the last 7 days
                    </p>
                  </div>
                  
                  {/* Mobile Action Button */}
                  <div className="md:hidden">
                    <MobileButton
                      onClick={handleRefreshContacts}
                      variant="outline"
                      disabled={isLoadingContacts}
                      icon={isLoadingContacts ? Loader2 : RefreshCw}
                      className="w-full"
                      size="sm"
                    >
                      {isLoadingContacts ? 'Refreshing...' : 'Refresh Contacts'}
                    </MobileButton>
                  </div>
                  
                  {/* Desktop Action Button */}
                  <Button
                    onClick={handleRefreshContacts}
                    variant="outline"
                    disabled={isLoadingContacts}
                    className="hidden md:flex items-center gap-2"
                  >
                    {isLoadingContacts ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <RefreshCw className="h-4 w-4" />
                    )}
                    Refresh
                  </Button>
                </div>
                
                <AWSEmailComposer
                  contacts={contacts.map(c => ({
                    id: c.id,
                    name: c.name,
                    email: c.email,
                    company: c.company,
                    position: c.title,
                    linkedin_link: c.linkedin_link
                  }))}
                  selectedContacts={selectedContacts}
                  onContactSelect={handleContactSelect}
                  onSelectAll={handleSelectAll}
                  onClearSelection={handleClearSelection}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Email Composer Modal */}
      {isComposerOpen && (
        <SimpleEmailComposer
          selectedContacts={contacts.filter(contact => selectedContacts.includes(contact.id))}
          onSendEmail={handleEmailSend}
          onClose={() => setIsComposerOpen(false)}
          isOpen={isComposerOpen}
          sending={isSending}
        />
      )}

      {/* Learn More Dialog */}
      <Dialog open={showLearnMoreDialog} onOpenChange={setShowLearnMoreDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-blue-600" />
              Why We Need Gmail Permissions
            </DialogTitle>
            <DialogDescription>
              Understanding our Gmail integration and your data security
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Your Security is Our Priority
              </h4>
              <p className="text-sm text-blue-800">
                Your Gmail password is never shared with us, 
                and you can revoke access at any time through your Google Account settings.
              </p>
              <p className="text-sm text-blue-800 mt-2">
                For more details about how we handle your data, please read our{' '}
                <Link 
                  to="/privacy-policy" 
                  className="underline hover:text-blue-900 font-medium"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Privacy Policy
                </Link>
                .
              </p>
            </div>

            
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h4 className="font-semibold text-gray-900 mb-2">What we DON'T do:</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• We don't have access to your Gmail password</li>
                <li>• We don't read your personal emails</li>
                <li>• We don't send emails without your explicit action</li>
                <li>• We don't share your data with third parties</li>
                <li>• We don't access your emails outside of job application tracking</li>
              </ul>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h4 className="font-semibold text-green-900 mb-2 flex items-center gap-2">
                <ShieldCheck className="h-4 w-4" />
                You're in Control
              </h4>
              <p className="text-sm text-green-800">
                You can revoke our access at any time by visiting your{' '}
                <a 
                  href="https://myaccount.google.com/permissions" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="underline hover:text-green-900"
                >
                  Google Account permissions page
                </a>
                . Your job search data will remain in your HireBuddy account, but we won't be able to send emails 
                on your behalf until you re-authenticate.
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Subscription Renewal Dialog */}
      <SubscriptionRenewalDialog
        isOpen={showRenewalDialog}
        onClose={() => setShowRenewalDialog(false)}
        emailUsage={emailUsage}
        onRenewalSuccess={() => {
          refreshUsage();
          toast.success('Subscription renewed successfully!');
        }}
      />
    </div>
  );
};

export default EmailOutreach; 