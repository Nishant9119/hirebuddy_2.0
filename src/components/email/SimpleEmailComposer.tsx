import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { checkEmailPermission, ProfileCompletionData, ExperienceData } from '@/lib/utils';
import { ProfileCompletionWarning } from '@/components/ui/profile-completion-warning';
import emailService, { AIEmailGenerationRequest, UserProfileData } from '@/services/emailService';
import { ProfileService, UserProfile } from '@/services/profileService';
import { JOB_ROLES, DEFAULT_JOB_ROLE } from '@/constants/jobRoles';
import { Send, Mail, Users, X, Loader2, Sparkles, Settings, Lightbulb, Eye } from 'lucide-react';
import EmailPreview from './EmailPreview';

interface EmailContact {
  id: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  title?: string;
}

interface SimpleEmailComposerProps {
  selectedContacts: EmailContact[];
  onSendEmail: (subject: string, body: string, isHtml: boolean) => Promise<void>;
  onClose: () => void;
  isOpen: boolean;
  sending?: boolean;
}

const SimpleEmailComposer: React.FC<SimpleEmailComposerProps> = ({
  selectedContacts,
  onSendEmail,
  onClose,
  isOpen,
  sending = false
}) => {
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [isHtml, setIsHtml] = useState(false);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [showAiSettings, setShowAiSettings] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfileData | null>(null);
  const [profileData, setProfileData] = useState<ProfileCompletionData | null>(null);
  const [experienceData, setExperienceData] = useState<ExperienceData[]>([]);
  const [profileLoading, setProfileLoading] = useState(true);
  const [aiSettings, setAiSettings] = useState({
    emailType: 'job_application' as AIEmailGenerationRequest['emailType'],
    tone: 'professional' as AIEmailGenerationRequest['tone'],
    customInstructions: '',
    targetRoles: [] as string[]
  });
  const [customRole, setCustomRole] = useState('');

  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    const loadUserProfile = async () => {
      setProfileLoading(true);
      if (user?.id) {
        try {
          const [profile, experiences] = await Promise.all([
            ProfileService.getProfile(user.id),
            ProfileService.getUserExperiences(user.id)
          ]);
          
          if (profile) {
            const enhancedProfile: UserProfileData = {
              full_name: profile.full_name,
              title: profile.title,
              company: profile.company,
              location: profile.location,
              bio: profile.bio,
              skills: profile.skills,
              experience_years: profile.experience_years,
              college: profile.college,
              linkedin: profile.linkedin,
              github: profile.github,
              website: profile.website,
              phone: profile.phone,
              available_for_work: profile.available_for_work,
              experiences: experiences.map(exp => ({
                job_title: exp.job_title,
                company: exp.company,
                location: exp.location,
                start_date: exp.start_date,
                end_date: exp.end_date,
                is_current: exp.is_current,
                description: exp.description,
                achievements: exp.achievements,
                skills_used: exp.skills_used
              }))
            };
            setUserProfile(enhancedProfile);
            setProfileData(profile);
          }
          
          setExperienceData(experiences || []);
        } catch (error) {
          console.error('Error loading user profile:', error);
        }
      }
      setProfileLoading(false);
    };

    loadUserProfile();
  }, [user?.id]);

  const generateAIEmail = async () => {
    if (selectedContacts.length === 0) {
      toast({
        title: "No Recipients",
        description: "Cannot generate AI email without selected contacts.",
        variant: "destructive",
      });
      return;
    }

    // For simplicity, use the first contact for AI generation
    const contact = selectedContacts[0];
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
        website: userProfile?.website
      };

      const aiRequest: AIEmailGenerationRequest = {
        contact: {
          name: contact.name,
          email: contact.email,
          company: contact.company,
          position: contact.title,
        },
        userProfile: userProfileData,
        emailType: aiSettings.emailType,
        tone: aiSettings.tone,
        customInstructions: aiSettings.customInstructions || undefined,
        targetRoles: aiSettings.targetRoles.length > 0 ? aiSettings.targetRoles : undefined
      };

      const aiResponse = await emailService.generateAIEmail(aiRequest);

      setSubject(aiResponse.subject);
      setBody(aiResponse.body);

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

  const handleSend = async () => {
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

    if (!subject.trim() || !body.trim()) {
      toast({
        title: "Missing Content",
        description: "Please fill in both subject and message",
        variant: "destructive",
      });
      return;
    }

    await onSendEmail(subject, body, isHtml);
  };

  const getContactInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const handleClose = () => {
    if (!sending) {
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-[#d35c65]" />
            Compose Email
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Recipients */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Users className="h-4 w-4" />
                Recipients ({selectedContacts.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                {selectedContacts.map((contact) => (
                  <div
                    key={contact.id}
                    className="flex items-center gap-2 bg-[#d35c65]/10 border border-[#d35c65]/20 rounded-lg px-3 py-2"
                  >
                    <Avatar className="w-6 h-6">
                      <AvatarFallback className="bg-[#d35c65]/20 text-[#d35c65] text-xs font-semibold">
                        {getContactInitials(contact.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col min-w-0">
                      <span className="text-sm font-medium text-gray-900 truncate">
                        {contact.name}
                      </span>
                      <span className="text-xs text-gray-600 truncate">
                        {contact.email}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

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
                <Button
                  onClick={generateAIEmail}
                  disabled={selectedContacts.length === 0 || isGeneratingAI}
                  className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                >
                  {isGeneratingAI ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Generating AI Email...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 mr-2" />
                      Generate AI Email
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          )}

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

          {/* Email Form */}
          <div className="space-y-4">
            {/* Subject */}
            <div className="space-y-2">
              <Label htmlFor="subject" className="text-sm font-medium">
                Subject *
              </Label>
              <Input
                id="subject"
                placeholder="Enter email subject..."
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                disabled={sending}
              />
            </div>

            {/* HTML Toggle */}
            <div className="flex items-center space-x-2">
              <Switch
                id="html-mode"
                checked={isHtml}
                onCheckedChange={setIsHtml}
                disabled={sending}
              />
              <Label htmlFor="html-mode" className="text-sm">
                HTML Format
              </Label>
            </div>

            {/* Message Body */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="body" className="text-sm font-medium">
                  Message *
                </Label>
                <EmailPreview 
                  subject={subject} 
                  body={body}
                >
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={!body}
                    className="flex items-center gap-2"
                  >
                    <Eye className="h-4 w-4" />
                    Preview
                  </Button>
                </EmailPreview>
              </div>
              <Textarea
                id="body"
                placeholder={
                  isHtml 
                    ? "Enter your HTML email content..."
                    : "Enter your email message... or use AI generation to create personalized content based on your profile and the selected contacts."
                }
                value={body}
                onChange={(e) => setBody(e.target.value)}
                rows={12}
                disabled={sending}
                className="min-h-[200px]"
              />
              {isHtml && (
                <p className="text-xs text-gray-500">
                  You can use HTML tags like &lt;b&gt;, &lt;i&gt;, &lt;a&gt;, &lt;br&gt;, etc.
                </p>
              )}
              {isGeneratingAI && (
                <div className="flex items-center gap-2 text-sm text-purple-600 bg-purple-50 p-2 rounded">
                  <Sparkles className="h-4 w-4 animate-pulse" />
                  AI is generating personalized email content based on your profile and contact information...
                </div>
              )}
            </div>

            {/* Email Preview */}
            {body && (
              <Card className="bg-gray-50">
                <CardHeader>
                  <CardTitle className="text-sm">Preview</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div>
                      <strong>Subject:</strong> {subject || '(No subject)'}
                    </div>
                    <div>
                      <strong>Message:</strong>
                      <div className="mt-2 p-3 bg-white border rounded-md">
                        {isHtml ? (
                          <div dangerouslySetInnerHTML={{ __html: body }} />
                        ) : (
                          <div className="whitespace-pre-wrap">{body}</div>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-4 border-t">
            <div className="text-sm text-gray-600">
              Ready to send to {selectedContacts.length} contact{selectedContacts.length !== 1 ? 's' : ''}
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={handleClose}
                disabled={sending}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSend}
                disabled={!subject.trim() || !body.trim() || sending || (() => {
                  const emailPermission = checkEmailPermission(profileData, experienceData);
                  return !emailPermission.canSendEmail;
                })()}
                className="bg-[#d35c65] hover:bg-[#b24e55] text-white"
              >
                {sending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Send Email
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SimpleEmailComposer; 