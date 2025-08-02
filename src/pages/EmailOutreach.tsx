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
import { supabase } from '@/lib/supabase';
import { conversationService } from '@/services/conversationService';
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
      const contactsData = await googleAuthService.getContacts(googleUser.access_token);
      setGoogleContacts(contactsData);
      
      // Convert Google contacts to our contact format
      const convertedContacts: ContactForDisplay[] = contactsData.map(contact => ({
        id: contact.id || '',
        name: contact.name || 'Unknown',
        email: contact.email || '',
        company: contact.company || '',
        title: contact.title || '',
        phone: contact.phone || '',
        linkedin_link: '',
        company_website: '',
        email_sent_on: '',
        status: 'active' as const,
        email_sent: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }));
      
      setContacts(convertedContacts);
      console.log(`Loaded ${convertedContacts.length} contacts from Gmail`);
    } catch (error) {
      console.error('Error loading Google contacts:', error);
      toast.error('Failed to load Gmail contacts');
    } finally {
      setIsLoadingContacts(false);
    }
  };

  // Load contacts from database
  const loadContactsFromDatabase = async () => {
    setIsLoadingContacts(true);
    try {
      const contactsData = await contactsService.getContacts();
      setContacts(contactsData);
      console.log(`Loaded ${contactsData.length} contacts from database`);
    } catch (error) {
      console.error('Error loading database contacts:', error);
      toast.error('Failed to load contacts from database');
    } finally {
      setIsLoadingContacts(false);
    }
  };

  // Test AWS API connection
  const testAwsApiConnection = async () => {
    try {
      const result = await testDatabaseConnection();
      setDatabaseConnected(result.success);
      setAwsApiStatus({
        connected: result.success,
        message: result.success ? 'Connected to AWS API' : 'Failed to connect to AWS API' 
      });
    } catch (error) {
      console.error('AWS API connection test failed:', error);
      setAwsApiStatus({ connected: false, message: 'AWS API connection failed' });
    }
  };

  // Handle Google authentication
  const handleGoogleAuthentication = async () => {
    setIsGoogleAuthenticating(true);
    try {
      await googleAuthService.initiateAuth();
    } catch (error) {
      console.error('Google authentication failed:', error);
      toast.error('Failed to start Google authentication');
      setIsGoogleAuthenticating(false);
    }
  };

  // Handle authentication success
  const handleAuthSuccess = useCallback((user: GoogleUser) => {
    setGoogleUser(user);
    setUseGmailMode(true);
    setHasAttemptedAuth(true);
    
    toast.success(`Successfully authenticated as ${user.email}`);
    console.log('Authentication successful:', user.email);
    
    // Load Google contacts after successful authentication
    loadGoogleContacts();
  }, []);

  // Load email stats
  const loadEmailStats = async () => {
    try {
      const stats = await DashboardService.getEmailOutreachStats();
      setEmailsSentCount(stats.total_emails_sent);
      setFollowupsNeededCount(0); // This field doesn't exist in the API response
      setRepliesReceivedCount(Math.round(stats.total_emails_sent * stats.response_rate / 100));
      setTotalContactsCount(0); // This field doesn't exist in the API response
    } catch (error) {
      console.error('Error loading email stats:', error);
    }
  };

  // Check for OAuth callback in URL
  const checkForCallbackAuth = useCallback(async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const scope = urlParams.get('scope');
    
    if (code && scope) {
      setIsGoogleAuthenticating(true);
      console.log('OAuth callback detected, exchanging code for tokens...');
      
      try {
        const user = await googleAuthService.handleCallback(code);
        
        // Clear URL parameters
        window.history.replaceState({}, document.title, window.location.pathname);
        
        // Handle successful authentication
        handleAuthSuccess(user);
      } catch (error) {
        console.error('Error exchanging code for tokens:', error);
        toast.error('Authentication failed. Please try again.');
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
    setIsSending(true);

    try {
      const canSendResult = await checkCanSendEmails(selectedContacts.length);
      if (!canSendResult.canSend) {
        toast.error(canSendResult.message || 'You have reached your email limit. Please upgrade your plan.');
        return;
    }

      const selectedContactsData = contacts.filter(contact => 
        selectedContacts.includes(contact.id)
      );

      console.log('Sending emails to:', selectedContactsData.length, 'contacts');
      
      // Send emails one by one
      let successCount = 0;
      let failureCount = 0;

      for (const contact of selectedContactsData) {
        try {
          if (useGmailMode && googleUser) {
            // Use Gmail API to send
            await googleAuthService.sendEmail(
              googleUser.access_token,
              contact.email,
              subject,
              body,
              isHtml
            );
          } else {
            // Use AWS SES to send
            await emailService.sendEmail({
              sender: 'noreply@hirebuddy.co',
              to: contact.email,
              subject,
              body,
              isHtml
            });
          }
          
          successCount++;
          
          // Increment email count
          await incrementEmailCount(1);
          
                    // Track the sent email in conversations
          try {
            await conversationService.createConversationThread(contact.id, subject);
          } catch (convError) {
            console.warn('Failed to create conversation thread:', convError);
           }
          
        } catch (error) {
          console.error(`Failed to send email to ${contact.email}:`, error);
          failureCount++;
        }
      }

      // Show results
      if (successCount > 0) {
        toast.success(`Successfully sent ${successCount} email(s)`);
        
        // Update email stats
        setEmailsSentCount(prev => prev + successCount);
        
        // Refresh usage after sending
        await refreshUsage();
      }
      
      if (failureCount > 0) {
        toast.error(`Failed to send ${failureCount} email(s)`);
      }
      
      // Close composer
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
                  </BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
          
        </header>

        {/* Main Content */}
        <div className="flex-1 overflow-auto">
          {/* Content accessible to all users */}
            <div className="p-4 md:p-6 space-y-4 md:space-y-6">
              {/* Re-authentication Section */}
              <Card className="border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50">
                <CardContent className="p-3 md:p-4">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 md:gap-4">
                    <div className="flex items-start md:items-center gap-2 md:gap-3 min-w-0 flex-1">
                      <div className="bg-blue-100 p-1.5 md:p-2 rounded-full flex-shrink-0">
                        <Shield className="h-3 w-3 md:h-5 md:w-5 text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col md:flex-row md:items-center gap-1 md:gap-2">
                          <h3 className="text-sm md:text-base font-medium md:font-semibold text-blue-900">Gmail Authentication</h3>
                          <Button
                            onClick={() => setShowLearnMoreDialog(true)}
                            variant="ghost"
                            size="sm"
                            className="text-blue-600 hover:text-blue-800 hover:bg-blue-100 p-0.5 md:p-1 h-auto w-fit text-xs"
                          >
                            <Info className="h-3 w-3 md:h-4 md:w-4" />
                            <span className="text-xs ml-1">Learn More</span>
                          </Button>
                        </div>
                        <p className="text-xs md:text-sm text-blue-700 mt-0.5 md:mt-1 break-words">
                          {googleUser 
                            ? `Connected as ${googleUser.email}. Use Re-authenticate if experiencing issues.` 
                            : 'Connect your Gmail account to send emails'
                          }
                        </p>
                      </div>
                    </div>
                  <div className="flex gap-2 flex-wrap flex-shrink-0">
                      {googleUser && (
                      <Badge className="text-xs bg-green-100 text-green-800 border-green-200">
                        <CheckCircle className="h-2.5 w-2.5 md:h-3 md:w-3 mr-1" />
                          Connected
                        </Badge>
                      )}
                        <Button
                      onClick={() => setShowAuthOptions(!showAuthOptions)}
                      variant="outline"
                          size="sm"
                      disabled={isGoogleAuthenticating}
                      className="text-xs px-2 py-1"
                        >
                          {isGoogleAuthenticating ? (
                            <>
                          <Loader2 className="h-3 w-3 animate-spin mr-1" />
                          <span className="hidden md:inline">Authenticating...</span>
                          <span className="md:hidden">Auth...</span>
                        </>
                      ) : googleUser ? (
                        <>
                          <RefreshCw className="h-3 w-3 mr-1" />
                          <span className="hidden md:inline">Re-authenticate</span>
                          <span className="md:hidden">Re-auth</span>
                                </>
                              ) : (
                                <>
                          <Shield className="h-3 w-3 mr-1" />
                          <span className="hidden md:inline">Authenticate</span>
                          <span className="md:hidden">Auth</span>
                            </>
                          )}
                        </Button>
                      </div>
                    </div>

              {/* Authentication Options */}
              {showAuthOptions && (
                  <div className="mt-3 pt-3 border-t border-blue-200">
                    <div className="flex flex-col sm:flex-row gap-2">
                        <Button
                        onClick={async () => {
                          setShowAuthOptions(false);
                          await handleGoogleAuthentication();
                        }}
                        variant="default"
                            size="sm"
                            disabled={isGoogleAuthenticating}
                        className="text-xs"
                      >
                        <Shield className="h-3 w-3 mr-1" />
                        <span>Gmail OAuth</span>
                          </Button>
                            <Button
                        onClick={() => {
                          setShowAuthOptions(false);
                          setUseGmailMode(false);
                          setGoogleUser(null);
                          googleAuthService.clearStoredAuth();
                          loadContactsFromDatabase();
                        }}
                              variant="outline"
                              size="sm"
                        className="text-xs"
                      >
                        <Database className="h-3 w-3 mr-1" />
                        <span>Use Database Contacts</span>
                            </Button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

            {/* Email Usage Progress */}
                <div className="mb-6">
                  <EmailUsageProgress
                    usage={emailUsage}
                    loading={emailUsageLoading}
                    onRenewClick={() => setShowRenewalDialog(true)}
                    compact={false}
                  />
                </div>

            {/* Email Stats Dashboard */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
              <Card className="p-3 md:p-4">
                <div className="flex items-center gap-2 md:gap-3">
                  <div className="p-1.5 md:p-2 bg-blue-100 rounded-full flex-shrink-0">
                    <Send className="h-3 w-3 md:h-4 md:w-4 text-blue-600" />
                      </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs md:text-sm text-gray-600 truncate">Emails Sent</p>
                    <p className="text-lg md:text-2xl font-bold">
                      <span className="text-xs md:text-base">{emailsSentCount}</span>
                    </p>
                      </div>
                    </div>
                </Card>
              <Card className="p-3 md:p-4">
                <div className="flex items-center gap-2 md:gap-3">
                  <div className="p-1.5 md:p-2 bg-green-100 rounded-full flex-shrink-0">
                    <MessageSquare className="h-3 w-3 md:h-4 md:w-4 text-green-600" />
                      </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs md:text-sm text-gray-600 truncate">Replies</p>
                    <p className="text-lg md:text-2xl font-bold">
                      <span className="text-xs md:text-base">{repliesReceivedCount}</span>
                    </p>
                      </div>
                    </div>
                </Card>
              <Card className="p-3 md:p-4">
                <div className="flex items-center gap-2 md:gap-3">
                  <div className="p-1.5 md:p-2 bg-yellow-100 rounded-full flex-shrink-0">
                    <Calendar className="h-3 w-3 md:h-4 md:w-4 text-yellow-600" />
                      </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs md:text-sm text-gray-600 truncate">Follow-ups</p>
                    <p className="text-lg md:text-2xl font-bold">
                      <span className="text-xs md:text-base">{followupsNeededCount}</span>
                    </p>
                      </div>
                    </div>
                </Card>
              <Card className="p-3 md:p-4">
                <div className="flex items-center gap-2 md:gap-3">
                  <div className="p-1.5 md:p-2 bg-purple-100 rounded-full flex-shrink-0">
                    <TrendingUp className="h-3 w-3 md:h-4 md:w-4 text-purple-600" />
                      </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs md:text-sm text-gray-600 truncate">Success Rate</p>
                    <p className="text-lg md:text-2xl font-bold">
                      <span className="text-xs">{repliesReceivedCount > 0 ? `${Math.round((repliesReceivedCount / Math.max(emailsSentCount, 1)) * 100)}%` : '0%'}</span>
                    </p>
                      </div>
                    </div>
                </Card>
              </div>

            {/* Contact Management */}
            <div className="space-y-3 md:space-y-4">
              {/* Action Buttons */}
              <div className="flex flex-col md:flex-row gap-2 md:gap-4">
                  {/* Mobile Action Button */}
                  <div className="md:hidden">
                  <MobileButton
                    className="w-full text-sm"
                      onClick={handleRefreshContacts}
                      disabled={isLoadingContacts}
                    >
                    <div className="flex items-center justify-center gap-2">
                        {isLoadingContacts ? (
                          <>
                            <Loader2 className="h-3 w-3 animate-spin" />
                            <span>Refreshing...</span>
                          </>
                        ) : (
                          <>
                            <RefreshCw className="h-3 w-3" />
                            <span>Refresh Contacts</span>
                          </>
                        )}
                      </div>
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
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Refreshing...
                    </>
                    ) : (
                    <>
                      <RefreshCw className="h-4 w-4" />
                      Refresh Contacts
                    </>
                    )}
                  </Button>
                </div>
                
              {/* Contact List */}
              <ContactList
                contacts={contacts}
                  selectedContacts={selectedContacts}
                  onContactSelect={handleContactSelect}
                  onSelectAll={handleSelectAll}
                  onClearSelection={handleClearSelection}
                onSendEmail={handleSendEmail}
                loading={isLoadingContacts}
                />
              </div>
            </div>
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
          
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-semibold text-blue-900 mb-2">What we access:</h4>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Your email address for authentication</li>
                <li>• Send emails on your behalf when you explicitly compose and send them</li>
                <li>• Read email responses to track job application replies</li>
                <li>• Access your contacts to help you manage your outreach</li>
              </ul>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h4 className="font-semibold text-green-900 mb-2">How we protect your data:</h4>
              <ul className="text-sm text-green-700 space-y-1">
                <li>• All communications are encrypted</li>
                <li>• We only access emails related to job applications</li>
                <li>• Your credentials are stored securely using OAuth 2.0</li>
                <li>• You can revoke access at any time</li>
                <li>• We comply with Gmail's security standards</li>
              </ul>
            </div>

            <div className="text-sm text-gray-600">
              <p>
                We use Gmail's official API with OAuth 2.0 authentication. This is the same secure method used by major applications like Slack, Trello, and other trusted services. You maintain full control and can revoke our access anytime through your Google Account settings.
              </p>
              <p className="mt-2">
                For complete details, please review our{' '}
                <Link 
                  to="/privacy-policy" 
                  className="text-blue-600 hover:underline"
                  onClick={() => setShowLearnMoreDialog(false)}
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
          </div>
        </DialogContent>
      </Dialog>

      {/* Subscription Renewal Dialog */}
      <SubscriptionRenewalDialog
        isOpen={showRenewalDialog}
        onClose={() => setShowRenewalDialog(false)}
        emailUsage={emailUsage}
        onRenewalSuccess={() => {
          setShowRenewalDialog(false);
          refreshUsage();
        }}
      />
    </div>
  );
};

export default EmailOutreach; 