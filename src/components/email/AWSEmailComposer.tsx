import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { checkEmailPermission, ProfileCompletionData, ExperienceData } from '@/lib/utils';
import { ProfileCompletionWarning } from '@/components/ui/profile-completion-warning';
import emailService, { EmailSendRequest, FollowUpRequest, AIEmailGenerationRequest, UserProfileData } from '@/services/emailService';
import { ProfileService, UserProfile } from '@/services/profileService';
import { contactsService } from '@/services/contactsService';
import { conversationService, ContactWithConversation, EmailConversation } from '@/services/conversationService';
import { JOB_ROLES, DEFAULT_JOB_ROLE } from '@/constants/jobRoles';
import WhatsAppLikeConversation from './WhatsAppLikeConversation';
import EmailPreview from './EmailPreview';
import { 
  Mail, 
  Send, 
  Shield, 
  AlertTriangle, 
  CheckCircle,
  Clock,
  User,
  Users,
  Search,
  MessageSquare,
  RefreshCw,
  Loader2,
  Building2,
  Briefcase,
  Linkedin,
  ExternalLink,
  Sparkles,
  Settings,
  Lightbulb,
  FileText,
  Paperclip,
  X,
  Download,
  Eye
} from 'lucide-react';

interface Contact {
  id: string;
  name: string;
  email: string;
  company?: string;
  position?: string;
  linkedin_link?: string;
  email_sent_on?: string;
}

interface AWSEmailComposerProps {
  contacts: Contact[];
  selectedContacts: string[];
  onContactSelect: (contactId: string) => void;
  onSelectAll: () => void;
  onClearSelection: () => void;
}

const AWSEmailComposer = ({ 
  contacts, 
  selectedContacts, 
  onContactSelect, 
  onSelectAll, 
  onClearSelection 
}: AWSEmailComposerProps) => {
  const [emailData, setEmailData] = useState({
    subject: '',
    body: '',
    senderEmail: '',
    attachResume: false
  });
  const [followUpData, setFollowUpData] = useState({
    body: '',
    recipientEmail: ''
  });
  const [followUpContacts, setFollowUpContacts] = useState<Contact[]>([]);
  const [selectedFollowUpContact, setSelectedFollowUpContact] = useState<string>('');
  const [isLoadingFollowUpContacts, setIsLoadingFollowUpContacts] = useState(false);
  const [aiSettings, setAiSettings] = useState({
    emailType: 'job_application' as AIEmailGenerationRequest['emailType'],
    tone: 'professional' as AIEmailGenerationRequest['tone'],
    customInstructions: '',
    targetRoles: [] as string[]
  });
  const [followUpAiSettings, setFollowUpAiSettings] = useState({
    emailType: 'follow_up' as AIEmailGenerationRequest['emailType'],
    tone: 'professional' as AIEmailGenerationRequest['tone'],
    customInstructions: 'Keep this as a brief reminder, not a full introduction',
    targetRoles: [] as string[]
  });
  const [activeTab, setActiveTab] = useState<'compose' | 'followup' | 'conversation'>('compose');
  const [isSending, setIsSending] = useState(false);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [isGeneratingFollowUpAI, setIsGeneratingFollowUpAI] = useState(false);
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [apiStatus, setApiStatus] = useState<{ connected: boolean; message: string } | null>(null);
  const [conversationData, setConversationData] = useState<EmailConversation[]>([]);
  const [isLoadingConversation, setIsLoadingConversation] = useState(false);
  const [conversationContacts, setConversationContacts] = useState<ContactWithConversation[]>([]);
  const [selectedConversationContact, setSelectedConversationContact] = useState<string>('');
  const [isLoadingConversationContacts, setIsLoadingConversationContacts] = useState(false);
  const [conversationSearchTerm, setConversationSearchTerm] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [followUpSearchTerm, setFollowUpSearchTerm] = useState('');
  const [userProfile, setUserProfile] = useState<UserProfileData | null>(null);
  const [userProfileComplete, setUserProfileComplete] = useState<UserProfile | null>(null);
  const [profileData, setProfileData] = useState<ProfileCompletionData | null>(null);
  const [experienceData, setExperienceData] = useState<ExperienceData[]>([]);
  const [profileLoading, setProfileLoading] = useState(true);
  const [showAiSettings, setShowAiSettings] = useState(false);
  const [showFollowUpAiSettings, setShowFollowUpAiSettings] = useState(false);
  const [customRole, setCustomRole] = useState('');
  const [followUpCustomRole, setFollowUpCustomRole] = useState('');
  const [conversationStats, setConversationStats] = useState<{
    total_emails: number;
    outbound_emails: number;
    inbound_emails: number;
    last_email_date: string;
    first_email_date: string;
  } | null>(null);

  const { toast } = useToast();
  const { user } = useAuth();

  // Initialize sender email from authenticated user
  useEffect(() => {
    if (user?.email) {
      setEmailData(prev => ({ ...prev, senderEmail: user.email }));
    }
  }, [user]);

  // Load user profile and resume data on component mount
  useEffect(() => {
    if (user?.id) {
      loadUserProfile();
    }
  }, [user?.id]);

  // Filter contacts based on search term
  const filteredContacts = contacts.filter(contact =>
    contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (contact.company && contact.company.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (contact.position && contact.position.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Filter follow-up contacts based on search term
  const filteredFollowUpContacts = followUpContacts.filter(contact =>
    contact.name.toLowerCase().includes(followUpSearchTerm.toLowerCase()) ||
    (contact.company && contact.company.toLowerCase().includes(followUpSearchTerm.toLowerCase())) ||
    (contact.position && contact.position.toLowerCase().includes(followUpSearchTerm.toLowerCase()))
  );

  // Handle single contact selection
  const handleSingleContactSelect = (contactId: string) => {
    // Clear previous selection and select only this contact
    onClearSelection();
    onContactSelect(contactId);
  };

  // Handle follow-up contact selection
  const handleFollowUpContactSelect = (contactId: string) => {
    setSelectedFollowUpContact(contactId);
    const selectedContact = followUpContacts.find(c => c.id === contactId);
    if (selectedContact) {
      setFollowUpData(prev => ({ 
        ...prev, 
        recipientEmail: selectedContact.email 
      }));
    }
  };

  // Load user profile
  const loadUserProfile = async () => {
    setProfileLoading(true);
    try {
      if (user?.id) {
        const [profile, experiences] = await Promise.all([
          ProfileService.getProfile(user.id),
          ProfileService.getUserExperiences(user.id)
        ]);
        
        if (profile) {
          setUserProfile({
            full_name: profile.full_name || '',
            title: profile.title || '',
            company: profile.company || '',
            location: profile.location || '',
            bio: profile.bio || '',
            skills: profile.skills || [],
            experience_years: profile.experience_years,
            college: profile.college,
            linkedin: profile.linkedin,
            github: profile.github,
            website: profile.website,
            phone: profile.phone,
            available_for_work: profile.available_for_work
          });
          setUserProfileComplete(profile);
          setProfileData(profile);
        }
        
        setExperienceData(experiences || []);
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
    } finally {
      setProfileLoading(false);
    }
  };

  // Load contacts with sent emails for follow-up
  const loadFollowUpContacts = async () => {
    setIsLoadingFollowUpContacts(true);
    try {
      const contactsWithSentEmails = await contactsService.getContactsWithSentEmails();
      const transformedContacts: Contact[] = contactsWithSentEmails.map(contact => ({
        id: contact.id,
        name: contact.name,
        email: contact.email,
        company: contact.company,
        position: contact.title,
        linkedin_link: contact.linkedin_link,
        email_sent_on: contact.email_sent_on
      }));
      setFollowUpContacts(transformedContacts);
      
      if (transformedContacts.length === 0) {
        toast({
          title: "No follow-ups needed",
          description: "All contacts have been followed up within the last 24 hours, or you haven't sent any emails yet.",
          variant: "default",
        });
      }
    } catch (error) {
      console.error('Error loading follow-up contacts:', error);
      toast({
        title: "Error loading contacts",
        description: "Failed to load contacts for follow-up. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingFollowUpContacts(false);
    }
  };

  // Load follow-up contacts when tab changes
  useEffect(() => {
    if (activeTab === 'followup') {
      loadFollowUpContacts();
    }
    if (activeTab === 'conversation') {
      loadConversationContacts();
    }
  }, [activeTab]);

  useEffect(() => {
    testApiConnection();
  }, [user]);

  // Filter conversation contacts based on search
  const filteredConversationContacts = conversationContacts.filter(contact =>
    contact.name.toLowerCase().includes(conversationSearchTerm.toLowerCase()) ||
    contact.email.toLowerCase().includes(conversationSearchTerm.toLowerCase()) ||
    (contact.company && contact.company.toLowerCase().includes(conversationSearchTerm.toLowerCase()))
  );

  const testApiConnection = async () => {
    setIsTestingConnection(true);
    try {
      const result = await emailService.testConnection();
      setApiStatus({
        connected: result.success,
        message: result.success ? 'Email service ready' : result.message
      });
    } catch (error) {
      setApiStatus({
        connected: false,
        message: 'Failed to connect to email service'
      });
    } finally {
      setIsTestingConnection(false);
    }
  };

  const handleSendEmail = async () => {
    // Check profile completion before allowing email send
    const emailPermission = checkEmailPermission(profileData, experienceData);
    if (!emailPermission.canSendEmail) {
      toast({
        title: "Profile Incomplete",
        description: `Your profile is ${emailPermission.completionPercentage}% complete. You need at least 85% to send emails.`,
        variant: "destructive",
      });
      return;
    }

    if (!emailData.subject.trim()) {
      toast({
        title: "Subject Required",
        description: "Please enter a subject line.",
        variant: "destructive",
      });
      return;
    }

    if (!emailData.body.trim()) {
      toast({
        title: "Email Body Required",
        description: "Please enter the email content.",
        variant: "destructive",
      });
      return;
    }

    if (selectedContacts.length === 0) {
      toast({
        title: "No Recipient Selected",
        description: "Please select a contact to send the email to.",
        variant: "destructive",
      });
      return;
    }

    if (selectedContacts.length > 1) {
      toast({
        title: "Multiple Recipients Selected",
        description: "Please select only one contact at a time.",
        variant: "destructive",
      });
      return;
    }

    if (!emailData.senderEmail) {
      toast({
        title: "Sender Email Required",
        description: "Please enter your email address.",
        variant: "destructive",
      });
      return;
    }

    setIsSending(true);
    const contact = contacts.find(c => c.id === selectedContacts[0]);

    try {
      if (contact) {
        // Prepare email body with resume link if attachment is selected
        let emailBody = emailData.body;
        if (emailData.attachResume && userProfileComplete?.resume_url) {
          const resumeSection = `\n\n---\n📄 Resume: ${userProfileComplete.resume_url}\n(Click the link above to view or download my resume)`;
          emailBody = emailData.body + resumeSection;
        }

        const isHtmlEnabled = emailService.isHtmlEmailsEnabled();
        const request: EmailSendRequest = {
          sender: emailData.senderEmail,
          to: contact.email,
          subject: emailData.subject,
          body: emailService.getFormattedEmailContent(emailBody),
          isHtml: isHtmlEnabled,
          content_type: isHtmlEnabled ? 'text/html; charset=utf-8' : 'text/plain; charset=utf-8',
          mime_type: isHtmlEnabled ? 'text/html' : 'text/plain'
          // Removed attachment_path to avoid email sending issues
        };

        const response = await emailService.sendEmail(request);
        
        // Save email to conversation history
        try {
          await conversationService.saveEmailToConversation({
            contact_id: contact.id,
            sender_email: emailData.senderEmail,
            recipient_email: contact.email,
            subject: emailData.subject,
            body: emailData.body,
            email_type: 'outbound',
            message_id: response.messageId,
            thread_id: response.threadId
          });
        } catch (convError) {
          console.warn('Failed to save email to conversation history:', convError);
        }
        
        toast({
          title: "Email Sent Successfully",
          description: `Email sent to ${contact.name} (${contact.email})${emailData.attachResume ? ' with resume link included' : ''}`,
        });
        
        // Clear form after successful send
        setEmailData(prev => ({ ...prev, subject: '', body: '', attachResume: false }));
        onClearSelection();
        
        // Refresh conversation data if we're on the conversation tab
        if (activeTab === 'conversation') {
          await loadConversationContacts();
        }
      }
    } catch (error) {
      console.error('Failed to send email:', error);
      
      toast({
        title: "Email Failed",
        description: `Failed to send email: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
    }
  };

  const handleSendFollowUp = async () => {
    // Check profile completion before allowing email send
    const emailPermission = checkEmailPermission(profileData, experienceData);
    if (!emailPermission.canSendEmail) {
      toast({
        title: "Profile Incomplete",
        description: `Your profile is ${emailPermission.completionPercentage}% complete. You need at least 85% to send emails.`,
        variant: "destructive",
      });
      return;
    }

    if (!followUpData.body.trim()) {
      toast({
        title: "Message Required",
        description: "Please enter a follow-up message.",
        variant: "destructive",
      });
      return;
    }

    if (!selectedFollowUpContact) {
      toast({
        title: "Recipient Required",
        description: "Please select a contact to send the follow-up to.",
        variant: "destructive",
      });
      return;
    }

    if (!emailData.senderEmail) {
      toast({
        title: "Sender Email Required",
        description: "Please enter your email address.",
        variant: "destructive",
      });
      return;
    }

    setIsSending(true);

    try {
      const selectedContact = followUpContacts.find(c => c.id === selectedFollowUpContact);
      if (!selectedContact) {
        throw new Error('Selected contact not found');
      }

      // Use the follow-up API endpoint - backend automatically handles subject from original email
      const isHtmlEnabled = emailService.isHtmlEmailsEnabled();
      const followUpRequest: FollowUpRequest = {
        sender: emailData.senderEmail,
        to: selectedContact.email,
        body: emailService.getFormattedEmailContent(followUpData.body),
        isHtml: isHtmlEnabled,
        content_type: isHtmlEnabled ? 'text/html; charset=utf-8' : 'text/plain; charset=utf-8',
        mime_type: isHtmlEnabled ? 'text/html' : 'text/plain'
      };

      const response = await emailService.sendFollowUp(followUpRequest);
      
      // Save follow-up email to conversation history
      try {
        await conversationService.saveEmailToConversation({
          contact_id: selectedContact.id,
          sender_email: emailData.senderEmail,
          recipient_email: selectedContact.email,
          subject: `Re: Follow-up to ${selectedContact.name}`, // Generic subject for conversation history
          body: followUpData.body,
          email_type: 'follow_up'
        });
      } catch (convError) {
        console.warn('Failed to save follow-up to conversation history:', convError);
      }
      
      toast({
        title: "Follow-up Sent Successfully",
        description: response.message || `Follow-up sent to ${selectedContact.name} (${selectedContact.email})`,
      });
      
      // Clear form after successful send
      setFollowUpData({ body: '', recipientEmail: '' });
      setSelectedFollowUpContact('');
      
      // Refresh conversation data if we're on the conversation tab
      if (activeTab === 'conversation') {
        await loadConversationContacts();
      }
    } catch (error) {
      console.error('Failed to send follow-up:', error);
      
      toast({
        title: "Follow-up Failed",
        description: `Failed to send follow-up: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
    }
  };

  const loadConversationContacts = async () => {
    setIsLoadingConversationContacts(true);
    try {
      console.log('Loading conversation contacts...');
      const contactsWithConversations = await conversationService.getContactsWithConversations();
      console.log('Loaded conversation contacts:', contactsWithConversations);
      setConversationContacts(contactsWithConversations);
      
      if (contactsWithConversations.length === 0) {
        toast({
          title: "No Conversations Found",
          description: "You haven't had any email conversations yet. Send some emails first to see conversation history.",
        });
      } else {
        toast({
          title: "Contacts Loaded",
          description: `Found ${contactsWithConversations.length} contact${contactsWithConversations.length !== 1 ? 's' : ''} with conversation history.`,
        });
      }
    } catch (error) {
      console.error('Failed to load conversation contacts:', error);
      
      toast({
        title: "Failed to Load Conversations",
        description: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
      });
    } finally {
      setIsLoadingConversationContacts(false);
    }
  };

  const loadConversationHistory = async (contactId: string) => {
    setIsLoadingConversation(true);
    try {
      const selectedContact = conversationContacts.find(c => c.id === contactId);
      
      // Get sender email from user profile or form
      const senderEmail = emailData.senderEmail || user?.email;
      const recipientEmail = selectedContact?.email;
      
      const history = await conversationService.getConversationHistory(
        contactId, 
        senderEmail, 
        recipientEmail
      );
      setConversationData(history);
      
      // Load conversation statistics
      try {
        const stats = await conversationService.getConversationStats(contactId);
        setConversationStats(stats);
      } catch (statsError) {
        console.warn('Could not load conversation stats:', statsError);
        setConversationStats(null);
      }
      
      if (history.length === 0) {
        toast({
          title: "No Conversation History",
          description: "No email conversation found with this contact. Try sending an email first.",
        });
      } else {
        toast({
          title: "Conversation Loaded",
          description: `Found ${history.length} email${history.length !== 1 ? 's' : ''} in conversation.`,
        });
      }
    } catch (error) {
      console.error('Failed to load conversation history:', error);
      
      toast({
        title: "Failed to Load Conversation",
        description: `Error: ${error instanceof Error ? error.message : 'Unable to load conversation history'}`,
        variant: "destructive",
      });
    } finally {
      setIsLoadingConversation(false);
    }
  };

  const generateAIEmail = async () => {
    if (selectedContacts.length === 0) {
      toast({
        title: "No Contact Selected",
        description: "Please select a contact first.",
        variant: "destructive",
      });
      return;
    }

    const contact = contacts.find(c => c.id === selectedContacts[0]);
    if (!contact) return;

    setIsGeneratingAI(true);

    try {
      // Convert user profile to the format expected by AI service
      const userProfileData: UserProfileData = {
        full_name: userProfile?.full_name || user?.user_metadata?.full_name || user?.email?.split('@')[0],
        title: userProfile?.title,
        company: userProfile?.company,
        location: userProfile?.location,
        bio: userProfile?.bio,
        skills: userProfile?.skills,
        experience_years: userProfile?.experience_years,
        college: userProfile?.college,
        linkedin: userProfile?.linkedin,
        github: userProfile?.github,
        website: userProfile?.website,
        phone: userProfile?.phone,
        available_for_work: userProfile?.available_for_work
      };

      const aiRequest: AIEmailGenerationRequest = {
        contact: {
          name: contact.name,
          email: contact.email,
          company: contact.company,
          position: contact.position,
          linkedin_link: contact.linkedin_link
        },
        userProfile: userProfileData,
        emailType: aiSettings.emailType,
        tone: aiSettings.tone,
        customInstructions: aiSettings.customInstructions || undefined,
        targetRoles: aiSettings.targetRoles.length > 0 ? aiSettings.targetRoles : undefined
      };

      const aiResponse = await emailService.generateAIEmail(aiRequest);

      setEmailData(prev => ({
        ...prev,
        subject: aiResponse.subject,
        body: aiResponse.body
      }));

      toast({
        title: "AI Email Generated",
        description: "Email content has been generated successfully. Review and edit as needed.",
      });

      // Show reasoning if available
      if (aiResponse.reasoning) {
        console.log('AI Generation Reasoning:', aiResponse.reasoning);
      }
    } catch (error) {
      console.error('Failed to generate AI email:', error);
      
      toast({
        title: "AI Generation Failed",
        description: `Error: ${error instanceof Error ? error.message : 'Could not generate email content'}`,
        variant: "destructive",
      });
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const generateFollowUpAI = async () => {
    if (!selectedFollowUpContact) {
      toast({
        title: "No Contact Selected",
        description: "Please select a contact first.",
        variant: "destructive",
      });
      return;
    }

    const contact = followUpContacts.find(c => c.id === selectedFollowUpContact);
    if (!contact) return;

    setIsGeneratingFollowUpAI(true);

    try {
      // Convert user profile to the format expected by AI service
      const userProfileData: UserProfileData = {
        full_name: userProfile?.full_name || user?.user_metadata?.full_name || user?.email?.split('@')[0],
        title: userProfile?.title,
        company: userProfile?.company,
        location: userProfile?.location,
        bio: userProfile?.bio,
        skills: userProfile?.skills,
        experience_years: userProfile?.experience_years,
        college: userProfile?.college,
        linkedin: userProfile?.linkedin,
        github: userProfile?.github,
        website: userProfile?.website,
        phone: userProfile?.phone,
        available_for_work: userProfile?.available_for_work
      };

      const aiRequest: AIEmailGenerationRequest = {
        contact: {
          name: contact.name,
          email: contact.email,
          company: contact.company,
          position: contact.position,
          linkedin_link: contact.linkedin_link
        },
        userProfile: userProfileData,
        emailType: followUpAiSettings.emailType,
        tone: followUpAiSettings.tone,
        customInstructions: followUpAiSettings.customInstructions || undefined,
        targetRoles: followUpAiSettings.targetRoles.length > 0 ? followUpAiSettings.targetRoles : undefined
      };

      const aiResponse = await emailService.generateAIFollowUp(aiRequest);

      setFollowUpData(prev => ({
        ...prev,
        body: aiResponse.body
      }));

      toast({
        title: "AI Follow-up Generated",
        description: "Follow-up email content has been generated successfully. Review and edit as needed.",
      });

      // Show reasoning if available
      if (aiResponse.reasoning) {
        console.log('AI Follow-up Generation Reasoning:', aiResponse.reasoning);
      }
    } catch (error) {
      console.error('Failed to generate AI follow-up:', error);
      
      toast({
        title: "AI Generation Failed",
        description: `Error: ${error instanceof Error ? error.message : 'Could not generate follow-up content'}`,
        variant: "destructive",
      });
    } finally {
      setIsGeneratingFollowUpAI(false);
    }
  };

  const selectedContact = selectedContacts.length > 0 ? contacts.find(c => c.id === selectedContacts[0]) : null;

  return (
    <div className="space-y-3 md:space-y-6">
      {/* API Status */}
      <Alert className={apiStatus?.connected ? "border-green-200 bg-green-50" : "border-yellow-200 bg-yellow-50"}>
        <div className="flex items-center space-x-2">
          {isTestingConnection ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : apiStatus?.connected ? (
            <CheckCircle className="h-4 w-4 text-green-600" />
          ) : (
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
          )}
          <AlertDescription className={apiStatus?.connected ? "text-green-800" : "text-yellow-800"}>
            {apiStatus?.message || 'Checking connection...'}
          </AlertDescription>
        </div>
      </Alert>

      {/* Tab Navigation */}
      <div className="flex space-x-0.5 md:space-x-1 bg-gray-100 p-0.5 md:p-1 rounded-lg">
        <button
          onClick={() => setActiveTab('compose')}
          className={`flex-1 h-8 md:h-9 px-1.5 md:px-3 text-xs md:text-sm font-medium rounded-md transition-colors ${
            activeTab === 'compose' 
              ? 'bg-white text-gray-900 shadow-sm' 
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
          }`}
        >
          <div className="flex items-center justify-center gap-1 md:gap-2">
            <Mail className="h-3 w-3 md:h-4 md:w-4" />
            <span className="hidden sm:inline">Compose</span>
            <span className="sm:hidden">Comp</span>
          </div>
        </button>
        <button
          onClick={() => setActiveTab('followup')}
          className={`flex-1 h-8 md:h-9 px-1.5 md:px-3 text-xs md:text-sm font-medium rounded-md transition-colors ${
            activeTab === 'followup' 
              ? 'bg-white text-gray-900 shadow-sm' 
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
          }`}
        >
          <div className="flex items-center justify-center gap-1 md:gap-2">
            <MessageSquare className="h-3 w-3 md:h-4 md:w-4" />
            <span className="hidden sm:inline">Follow-up</span>
            <span className="sm:hidden">Follow</span>
          </div>
        </button>
        <button
          onClick={() => setActiveTab('conversation')}
          className={`flex-1 h-8 md:h-9 px-1.5 md:px-3 text-xs md:text-sm font-medium rounded-md transition-colors ${
            activeTab === 'conversation' 
              ? 'bg-white text-gray-900 shadow-sm' 
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
          }`}
        >
          <div className="flex items-center justify-center gap-1 md:gap-2">
            <User className="h-3 w-3 md:h-4 md:w-4" />
            <span className="hidden sm:inline">Conversation</span>
            <span className="sm:hidden">Chat</span>
          </div>
        </button>
      </div>

      {/* Sender Email Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Email Configuration</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="sender-email">Your Email Address</Label>
            <Input
              id="sender-email"
              type="email"
              placeholder="your-email@gmail.com"
           value={emailData.senderEmail}
              disabled
              className="bg-gray-50 text-gray-700"
            />
            <p className="text-xs text-gray-500">
              This is automatically set to your authenticated account email
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Compose Tab */}
      {activeTab === 'compose' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Mail className="h-5 w-5" />
                <span>Compose Email</span>
              </CardTitle>
              <CardDescription>
                Send emails using your email automation system
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* AI Settings Toggle */}
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">AI Email Generation</Label>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAiSettings(!showAiSettings)}
                  className="flex items-center gap-2"
                >
                  <Settings className="h-4 w-4" />
                  {showAiSettings ? 'Hide' : 'Show'} AI Settings
                </Button>
              </div>

              {/* AI Settings Panel */}
              {showAiSettings && (
                <Card className="bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-purple-600" />
                      AI Email Generation Settings
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-1 gap-3">
                      <div className="space-y-2">
                        <Label htmlFor="tone" className="text-xs">Tone</Label>
                        <Select 
                          value={aiSettings.tone} 
                          onValueChange={(value: AIEmailGenerationRequest['tone']) => 
                            setAiSettings(prev => ({ ...prev, tone: value }))
                          }
                        >
                          <SelectTrigger className="h-8">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="professional">Professional</SelectItem>
                            <SelectItem value="friendly">Friendly</SelectItem>
                            <SelectItem value="formal">Formal</SelectItem>
                            <SelectItem value="casual">Casual</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="target-roles" className="text-xs">Target Roles (Optional)</Label>
                        <div className="space-y-2">
                          <Select 
                            onValueChange={(value) => {
                              if (value === 'Other') {
                                if (!aiSettings.targetRoles.includes('Other')) {
                                  setAiSettings(prev => ({ 
                                    ...prev, 
                                    targetRoles: [...prev.targetRoles, 'Other'] 
                                  }));
                                }
                                return;
                              }
                              if (!aiSettings.targetRoles.includes(value)) {
                                setAiSettings(prev => ({ 
                                  ...prev, 
                                  targetRoles: [...prev.targetRoles, value] 
                                }));
                              }
                            }}
                          >
                            <SelectTrigger className="h-8">
                              <SelectValue placeholder="Select roles you're looking for..." />
                            </SelectTrigger>
                            <SelectContent>
                              {JOB_ROLES.map((role) => (
                                <SelectItem key={role} value={role}>{role}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {aiSettings.targetRoles.includes('Other') && (
                            <Input
                              placeholder="Enter custom role..."
                              value={customRole}
                              onChange={(e) => setCustomRole(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' && customRole.trim()) {
                                  setAiSettings(prev => ({ 
                                    ...prev, 
                                    targetRoles: prev.targetRoles.filter(r => r !== 'Other').concat([customRole.trim()])
                                  }));
                                  setCustomRole('');
                                }
                              }}
                              className="h-8"
                            />
                          )}
                          {aiSettings.targetRoles.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {aiSettings.targetRoles.map((role) => (
                                <Badge 
                                  key={role} 
                                  variant="secondary" 
                                  className="text-xs h-6 px-2"
                                >
                                  {role}
                                  <button
                                    onClick={() => {
                                      setAiSettings(prev => ({ 
                                        ...prev, 
                                        targetRoles: prev.targetRoles.filter(r => r !== role) 
                                      }));
                                    }}
                                    className="ml-1 hover:bg-gray-300 rounded-full w-3 h-3 flex items-center justify-center"
                                  >
                                    <X className="h-2 w-2" />
                                  </button>
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                        <p className="text-xs text-gray-500">
                          Select the types of roles you're looking for to personalize your email
                        </p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="custom-instructions" className="text-xs flex items-center gap-1">
                        <Lightbulb className="h-3 w-3" />
                        Custom Instructions (Optional)
                      </Label>
                      <Textarea
                        id="custom-instructions"
                        placeholder="e.g., Mention our mutual connection John, focus on React expertise, include portfolio link..."
                        value={aiSettings.customInstructions}
                        onChange={(e) => setAiSettings(prev => ({ ...prev, customInstructions: e.target.value }))}
                        className="h-16 text-xs"
                      />
                      <p className="text-xs text-gray-500">
                        Add specific instructions to customize the AI-generated email
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}

              <div className="space-y-2">
                <Label htmlFor="subject">Subject Line</Label>
                <Input
                  id="subject"
                  placeholder="Enter email subject..."
                  value={emailData.subject}
                  onChange={(e) => setEmailData(prev => ({ ...prev, subject: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="body">Email Content</Label>
                  <div className="flex items-center gap-2">
                    <EmailPreview 
                      subject={emailData.subject} 
                      body={emailData.body}
                    >
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={!emailData.body}
                        className="flex items-center gap-2"
                      >
                        <Eye className="h-4 w-4" />
                        Preview
                      </Button>
                    </EmailPreview>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={generateAIEmail}
                      disabled={selectedContacts.length === 0 || isGeneratingAI}
                      className="flex items-center gap-2 bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200 hover:from-purple-100 hover:to-blue-100"
                    >
                      {isGeneratingAI ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Sparkles className="h-4 w-4 text-purple-600" />
                      )}
                      {isGeneratingAI ? 'Generating...' : 'Generate with AI'}
                    </Button>
                  </div>
                </div>
                <Textarea
                  id="body"
                  placeholder="Write your email content here... or use AI generation to create personalized content based on your profile and the selected contact."
                  className="min-h-[300px]"
                  value={emailData.body}
                  onChange={(e) => setEmailData(prev => ({ ...prev, body: e.target.value }))}
                />
                {isGeneratingAI && (
                  <div className="flex items-center gap-2 text-sm text-purple-600 bg-purple-50 p-2 rounded">
                    <Sparkles className="h-4 w-4 animate-pulse" />
                    AI is generating personalized email content based on your profile and contact information...
                  </div>
                )}
              </div>

              <Separator />

              {/* Profile Completion Warning */}
              {!profileLoading && (() => {
                const emailPermission = checkEmailPermission(profileData, experienceData);
                return !emailPermission.canSendEmail ? (
                  <ProfileCompletionWarning
                    completionPercentage={emailPermission.completionPercentage}
                    missingFields={emailPermission.missingFields}
                    requiredPercentage={85}
                  />
                ) : null;
              })()}

              {/* Resume Link Section */}
              <div className="space-y-3">
                <Label className="text-sm md:text-base font-medium">Resume Link</Label>
                {userProfileComplete?.resume_url ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-2 md:p-3 bg-gray-50 rounded-lg border">
                      <div className="flex items-center gap-2 md:gap-3 min-w-0 flex-1">
                        <div className="w-6 h-6 md:w-8 md:h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <FileText className="w-3 h-3 md:w-4 md:h-4 text-blue-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs md:text-sm font-medium text-gray-900 truncate">
                            {userProfileComplete.resume_filename || 'Resume.pdf'}
                          </p>
                          <p className="text-xs text-gray-500">
                            {userProfileComplete.resume_uploaded_at ? 
                              `Uploaded ${new Date(userProfileComplete.resume_uploaded_at).toLocaleDateString()}` : 
                              'Available in your profile'
                            }
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 md:gap-2 flex-shrink-0 ml-2">
                        <button
                          onClick={() => window.open(userProfileComplete.resume_url, '_blank')}
                          className="p-1.5 md:p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded-md transition-colors"
                        >
                          <Download className="w-3 h-3 md:w-4 md:h-4" />
                        </button>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="attach-resume"
                        checked={emailData.attachResume}
                        onChange={(e) => setEmailData(prev => ({ ...prev, attachResume: e.target.checked }))}
                        className="w-3 h-3 md:w-4 md:h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                      />
                      <Label htmlFor="attach-resume" className="text-xs md:text-sm text-gray-700 cursor-pointer">
                        Include resume link in this email
                      </Label>
                    </div>
                    
                    {emailData.attachResume && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-xs md:text-sm text-green-600 bg-green-50 p-2 md:p-3 rounded-lg border border-green-200">
                          <Paperclip className="w-3 h-3 md:w-4 md:h-4 flex-shrink-0" />
                          <span className="flex-1">Resume link will be included in your email</span>
                          <Badge variant="secondary" className="bg-green-100 text-green-800 text-xs px-1 py-0.5 md:px-2 md:py-1">
                            {userProfileComplete.resume_filename?.split('.').pop()?.toUpperCase() || 'PDF'}
                          </Badge>
                        </div>
                        
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <h4 className="font-medium text-yellow-900 mb-1">No Resume Found</h4>
                        <p className="text-sm text-yellow-800 mb-2">
                          Upload your resume in your profile to include it as a link in emails.
                        </p>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open('/profile', '_blank')}
                          className="text-yellow-700 border-yellow-300 hover:bg-yellow-100"
                        >
                          Go to Profile
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <Separator />

              {/* Selected Contact Summary */}
              {selectedContact && (
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-medium text-blue-900 mb-2">Selected Recipient</h4>
                  <div className="space-y-1 text-sm text-blue-800">
                    <div className="flex items-center space-x-2">
                      <User className="h-4 w-4" />
                      <span>{selectedContact.name}</span>
                    </div>
                    
                    {selectedContact.company && (
                      <div className="flex items-center space-x-2">
                        <Building2 className="h-4 w-4" />
                        <span>{selectedContact.company}</span>
                      </div>
                    )}
                    {selectedContact.position && (
                      <div className="flex items-center space-x-2">
                        <Briefcase className="h-4 w-4" />
                        <span>{selectedContact.position}</span>
                      </div>
                    )}
                    
                    {emailData.attachResume && userProfileComplete?.resume_url && (
                      <div className="flex items-center space-x-2 mt-2 pt-2 border-t border-blue-200">
                        <Paperclip className="h-4 w-4" />
                        <span>Resume link included: {userProfileComplete.resume_filename || 'Resume.pdf'}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <Button 
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                onClick={handleSendEmail}
                disabled={isSending || selectedContacts.length === 0 || (() => {
                  const emailPermission = checkEmailPermission(profileData, experienceData);
                  return !emailPermission.canSendEmail;
                })()}
              >
                {isSending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    {emailData.attachResume && <Paperclip className="h-4 w-4 mr-1" />}
                  </>
                )}
                {isSending ? 'Sending...' : selectedContact ? 
                  `Send to ${selectedContact.name}${emailData.attachResume ? ' (with resume link)' : ''}` : 
                  'Select a recipient'
                }
              </Button>
            </CardContent>
          </Card>

          {/* Contact Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <User className="h-5 w-5" />
                <span>Select Contact</span>
              </CardTitle>
              <CardDescription>
                Choose a contact to send your email to (showing contacts who haven't been emailed in the last 7 days)
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Search */}
              <div className="space-y-4">
                <Input
                  placeholder="Search contacts..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full"
                />

                {/* Contact List */}
                <div className="space-y-2 max-h-[400px] overflow-y-auto">
                  {filteredContacts.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <User className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>No contacts available for email</p>
                      <p className="text-sm mt-1">All contacts have been emailed within the last 7 days</p>
                    </div>
                  ) : (
                    filteredContacts.map((contact) => (
                      <div
                        key={contact.id}
                        onClick={() => handleSingleContactSelect(contact.id)}
                        className={`p-3 border rounded-lg cursor-pointer transition-all hover:bg-gray-50 ${
                          selectedContacts.includes(contact.id)
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-2 mb-1">
                              <span className="font-medium text-gray-900 truncate">
                                {contact.name}
                              </span>
                              {selectedContacts.includes(contact.id) && (
                                <CheckCircle className="h-4 w-4 text-blue-600 flex-shrink-0" />
                              )}
                            </div>
                            

                            
                            {contact.company && (
                              <div className="flex items-center space-x-2 text-sm text-gray-500 mb-1">
                                <Building2 className="h-3 w-3 flex-shrink-0" />
                                <span className="truncate">{contact.company}</span>
                              </div>
                            )}
                            
                            {contact.position && (
                              <div className="flex items-center space-x-2 text-sm text-gray-500 mb-1">
                                <Briefcase className="h-3 w-3 flex-shrink-0" />
                                <span className="truncate">{contact.position}</span>
                              </div>
                            )}
                            
                            {contact.linkedin_link && (
                              <div className="flex items-center space-x-2 text-sm text-blue-600">
                                <Linkedin className="h-3 w-3 flex-shrink-0" />
                                <a 
                                  href={contact.linkedin_link} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="truncate hover:underline flex items-center space-x-1"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <span>LinkedIn Profile</span>
                                  <ExternalLink className="h-3 w-3" />
                                </a>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Clear Selection Button */}
                {selectedContacts.length > 0 && (
                  <div className="mt-4 pt-4 border-t">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={onClearSelection}
                      className="w-full"
                    >
                      Clear Selection
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Follow-up Tab */}
      {activeTab === 'followup' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <MessageSquare className="h-5 w-5" />
                <span>Compose Follow-up Email</span>
              </CardTitle>
                          <CardDescription>
              Send a brief follow-up reminder to contacts you've previously emailed (short, gentle reminders)
            </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* AI Settings Toggle for Follow-up */}
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">AI Follow-up Generation</Label>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowFollowUpAiSettings(!showFollowUpAiSettings)}
                  className="flex items-center gap-2"
                >
                  <Settings className="h-4 w-4" />
                  {showFollowUpAiSettings ? 'Hide' : 'Show'} AI Settings
                </Button>
              </div>

              {/* AI Settings Panel for Follow-up */}
              {showFollowUpAiSettings && (
                <Card className="bg-gradient-to-r from-green-50 to-teal-50 border-green-200">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-green-600" />
                      AI Follow-up Generation Settings
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label htmlFor="followup-tone" className="text-xs">Tone</Label>
                        <Select 
                          value={followUpAiSettings.tone} 
                          onValueChange={(value: AIEmailGenerationRequest['tone']) => 
                            setFollowUpAiSettings(prev => ({ ...prev, tone: value }))
                          }
                        >
                          <SelectTrigger className="h-8">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="professional">Professional</SelectItem>
                            <SelectItem value="friendly">Friendly</SelectItem>
                            <SelectItem value="formal">Formal</SelectItem>
                            <SelectItem value="casual">Casual</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="followup-custom-instructions" className="text-xs">Custom Instructions</Label>
                      <Textarea 
                        id="followup-custom-instructions"
                        placeholder="Add specific instructions for the brief follow-up reminder (e.g., mention a specific topic from previous email, etc.)"
                        className="min-h-[60px] text-xs"
                        value={followUpAiSettings.customInstructions}
                        onChange={(e) => setFollowUpAiSettings(prev => ({ ...prev, customInstructions: e.target.value }))}
                      />
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Generate AI Follow-up Button */}
              {selectedFollowUpContact && (
                                 <Button
                   onClick={generateFollowUpAI}
                   disabled={isGeneratingFollowUpAI}
                   variant="outline"
                   className="w-full bg-gradient-to-r from-green-50 to-teal-50 border-green-200 hover:from-green-100 hover:to-teal-100"
                 >
                  {isGeneratingFollowUpAI ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Sparkles className="h-4 w-4 mr-2 text-green-600" />
                  )}
                  {isGeneratingFollowUpAI ? 'Generating...' : 'Generate Follow-up with AI'}
                </Button>
              )}

              <Separator />

              {/* Profile Completion Warning for Follow-up */}
              {!profileLoading && (() => {
                const emailPermission = checkEmailPermission(profileData, experienceData);
                return !emailPermission.canSendEmail ? (
                  <ProfileCompletionWarning
                    completionPercentage={emailPermission.completionPercentage}
                    missingFields={emailPermission.missingFields}
                    requiredPercentage={85}
                  />
                ) : null;
              })()}

              {/* Follow-up Email Form */}
              <div className="space-y-4">
               

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="followup-body">Follow-up Message</Label>
                    <EmailPreview 
                      subject="Re: Follow-up" 
                      body={followUpData.body}
                    >
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={!followUpData.body}
                        className="flex items-center gap-2"
                      >
                        <Eye className="h-4 w-4" />
                        Preview
                      </Button>
                    </EmailPreview>
                  </div>
                  <Textarea
                    id="followup-body"
                    placeholder="Write your follow-up message here..."
                    className="min-h-[200px]"
                    value={followUpData.body}
                    onChange={(e) => setFollowUpData(prev => ({ ...prev, body: e.target.value }))}
                  />
                </div>

                <Button 
                  className="w-full"
                  onClick={handleSendFollowUp}
                  disabled={isSending || !selectedFollowUpContact || !followUpData.body.trim() || (() => {
                    const emailPermission = checkEmailPermission(profileData, experienceData);
                    return !emailPermission.canSendEmail;
                  })()}
                >
                  {isSending ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4 mr-2" />
                  )}
                  {isSending ? 'Sending Follow-up...' : `Send Follow-up${selectedFollowUpContact ? '' : ' (Select Contact)'}`}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Follow-up Contact Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Users className="h-5 w-5" />
                <span>Select Recipient</span>
              </CardTitle>
              <CardDescription>
                Choose from contacts that need follow-up (24+ hours since last communication, excluding those who replied)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search contacts..."
                    value={followUpSearchTerm}
                    onChange={(e) => setFollowUpSearchTerm(e.target.value)}
                    className="pl-9"
                  />
                </div>

                {/* Contact List */}
                <div className="space-y-2 max-h-[400px] overflow-y-auto">
                  {isLoadingFollowUpContacts ? (
                    <div className="text-center py-8 text-gray-500">
                      <Loader2 className="h-8 w-8 mx-auto mb-2 animate-spin" />
                      <p>Loading contacts...</p>
                    </div>
                  ) : filteredFollowUpContacts.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <User className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>No contacts need follow-up</p>
                      {followUpContacts.length === 0 ? (
                        <p className="text-sm mt-2">
                          You haven't sent any emails yet. Send some emails first to be able to follow up.
                        </p>
                      ) : (
                        <p className="text-sm mt-2">
                          All contacts have been followed up within the last 24 hours or have already replied. Check back later!
                        </p>
                      )}
                    </div>
                  ) : (
                    filteredFollowUpContacts.map((contact) => (
                      <div
                        key={contact.id}
                        onClick={() => handleFollowUpContactSelect(contact.id)}
                        className={`p-3 border rounded-lg cursor-pointer transition-all hover:bg-gray-50 ${
                          selectedFollowUpContact === contact.id
                            ? 'border-green-500 bg-green-50'
                            : 'border-gray-200'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-2 mb-1">
                              <span className="font-medium text-gray-900 truncate">
                                {contact.name}
                              </span>
                              {selectedFollowUpContact === contact.id && (
                                <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                              )}
                            </div>
                            

                            
                            {contact.company && (
                              <div className="flex items-center space-x-2 text-sm text-gray-500 mb-1">
                                <Building2 className="h-3 w-3 flex-shrink-0" />
                                <span className="truncate">{contact.company}</span>
                              </div>
                            )}

                            {/* Last communication timestamp */}
                            <div className="flex items-center space-x-2 text-xs text-orange-600 mb-1">
                              <Clock className="h-3 w-3 flex-shrink-0" />
                              <span>
                                Last contact: {(() => {
                                  const lastContact = new Date(contact.email_sent_on || Date.now());
                                  const now = new Date();
                                  const diffHours = Math.floor((now.getTime() - lastContact.getTime()) / (1000 * 60 * 60));
                                  const diffDays = Math.floor(diffHours / 24);
                                  
                                  if (diffDays > 0) {
                                    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
                                  } else {
                                    return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
                                  }
                                })()}
                              </span>
                            </div>
                            
                            {contact.position && (
                              <div className="flex items-center space-x-2 text-sm text-gray-500 mb-1">
                                <Briefcase className="h-3 w-3 flex-shrink-0" />
                                <span className="truncate">{contact.position}</span>
                              </div>
                            )}
                            
                            {contact.linkedin_link && (
                              <div className="flex items-center space-x-2 text-sm text-blue-600">
                                <Linkedin className="h-3 w-3 flex-shrink-0" />
                                <a 
                                  href={contact.linkedin_link} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="truncate hover:underline flex items-center space-x-1"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <span>LinkedIn Profile</span>
                                  <ExternalLink className="h-3 w-3" />
                                </a>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Refresh Button */}
                <div className="pt-4 border-t">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={loadFollowUpContacts}
                    disabled={isLoadingFollowUpContacts}
                    className="w-full"
                  >
                    {isLoadingFollowUpContacts ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <RefreshCw className="h-4 w-4 mr-2" />
                    )}
                    Refresh Contacts
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Conversation Tab */}
      {activeTab === 'conversation' && (
        <WhatsAppLikeConversation contacts={contacts} />
      )}
    </div>
  );
};

export default AWSEmailComposer; 