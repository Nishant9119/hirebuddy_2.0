import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { resumeGenerationService } from '@/services/resumeGenerationService';
import { ProfileService } from '@/services/profileService';
import { 
  CheckCircle, 
  AlertCircle, 
  Loader2, 
  FileText,
  TestTube
} from 'lucide-react';

const ResumeAPITest = () => {
  const [testData, setTestData] = useState({
    contactName: 'John Smith',
    companyName: 'TechCorp Inc.'
  });
  const [isTesting, setIsTesting] = useState(false);
  const [result, setResult] = useState<{ subject: string; body: string } | null>(null);
  const [userResumeUrl, setUserResumeUrl] = useState<string | null>(null);
  const [apiStatus, setApiStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');

  const { toast } = useToast();
  const { user } = useAuth();

  // Load user's resume URL
  React.useEffect(() => {
    const loadUserResume = async () => {
      if (user?.id) {
        try {
          const profile = await ProfileService.getProfile(user.id);
          setUserResumeUrl(profile?.resume_url || null);
        } catch (error) {
          console.error('Error loading user resume:', error);
        }
      }
    };

    loadUserResume();
  }, [user?.id]);

  const handleTestAPI = async () => {
    if (!testData.contactName || !testData.companyName) {
      toast({
        title: "Missing Fields",
        description: "Please fill in both contact name and company name.",
        variant: "destructive",
      });
      return;
    }

    setIsTesting(true);
    setApiStatus('testing');
    setResult(null);

    try {
      const response = await resumeGenerationService.generateEmailForContact(
        testData.contactName,
        testData.companyName
      );

      if (response.success && response.email_body && response.subject) {
        setResult({
          subject: response.subject,
          body: response.email_body
        });
        setApiStatus('success');
        
        toast({
          title: "API Test Successful",
          description: "Resume generation API is working correctly!",
        });
      } else {
        setApiStatus('error');
        throw new Error(response.error || 'Failed to generate email');
      }
    } catch (error) {
      setApiStatus('error');
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      toast({
        title: "API Test Failed",
        description: errorMessage,
        variant: "destructive",
      });
      console.error('API test error:', error);
    } finally {
      setIsTesting(false);
    }
  };

  const getStatusIcon = () => {
    switch (apiStatus) {
      case 'testing':
        return <Loader2 className="h-4 w-4 animate-spin" />;
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      default:
        return <TestTube className="h-4 w-4" />;
    }
  };

  const getStatusText = () => {
    switch (apiStatus) {
      case 'testing':
        return 'Testing API...';
      case 'success':
        return 'API Test Successful';
      case 'error':
        return 'API Test Failed';
      default:
        return 'Ready to Test';
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <FileText className="h-5 w-5" />
              <span>Resume Generation API Test</span>
            </CardTitle>
            <CardDescription>
              Test the resume generation API directly without CORS issues
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* API Status */}
            <div className="flex items-center justify-between">
              <Alert className={apiStatus === 'success' ? "border-green-200 bg-green-50" : apiStatus === 'error' ? "border-red-200 bg-red-50" : "border-gray-200 bg-gray-50"}>
                <div className="flex items-center space-x-2">
                  {getStatusIcon()}
                  <AlertDescription className={apiStatus === 'success' ? "text-green-800" : apiStatus === 'error' ? "text-red-800" : "text-gray-800"}>
                    <strong>Status:</strong> {getStatusText()}
                  </AlertDescription>
                </div>
              </Alert>
            </div>

            {/* User Resume Info */}
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
              <h4 className="font-medium mb-2 text-blue-900">User Resume Information</h4>
              <div className="space-y-1 text-sm text-blue-800">
                <p><strong>User ID:</strong> {user?.id || 'Not logged in'}</p>
                <p><strong>Resume URL:</strong> {userResumeUrl ? 'Available' : 'Not uploaded'}</p>
                {userResumeUrl && (
                  <p className="text-xs break-all"><strong>URL:</strong> {userResumeUrl}</p>
                )}
              </div>
            </div>

            {/* Test Form */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="contact-name">Contact Name</Label>
                <Input
                  id="contact-name"
                  placeholder="John Smith"
                  value={testData.contactName}
                  onChange={(e) => setTestData(prev => ({ ...prev, contactName: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="company-name">Company Name</Label>
                <Input
                  id="company-name"
                  placeholder="TechCorp Inc."
                  value={testData.companyName}
                  onChange={(e) => setTestData(prev => ({ ...prev, companyName: e.target.value }))}
                />
              </div>
            </div>

            <Button 
              className="w-full"
              onClick={handleTestAPI}
              disabled={isTesting || !testData.contactName || !testData.companyName || !userResumeUrl}
            >
              {isTesting ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <FileText className="h-4 w-4 mr-2" />
              )}
              {isTesting ? 'Testing API...' : 'Test Resume Generation API'}
            </Button>

            {!userResumeUrl && (
              <Alert className="border-yellow-200 bg-yellow-50">
                <AlertCircle className="h-4 w-4 text-yellow-600" />
                <AlertDescription className="text-yellow-800">
                  You need to upload a resume to your profile first. Go to your profile settings to upload a resume.
                </AlertDescription>
              </Alert>
            )}

            {/* Results */}
            {result && (
              <div className="mt-4 p-4 bg-gray-50 rounded-md">
                <h4 className="font-semibold mb-2">Generated Email:</h4>
                <div className="space-y-2">
                  <div>
                    <strong>Subject:</strong> {result.subject}
                  </div>
                  <div>
                    <strong>Body:</strong>
                    <div className="mt-1 p-2 bg-white border rounded text-sm whitespace-pre-wrap">
                      {result.body}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Instructions */}
        <Card className="bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle className="text-blue-900">How to Test</CardTitle>
          </CardHeader>
          <CardContent className="text-blue-800">
            <div className="space-y-2 text-sm">
              <p><strong>Prerequisites:</strong></p>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li>You must be logged in to your account</li>
                <li>You must have uploaded a resume to your profile</li>
                <li>Enter a contact name and company name for testing</li>
              </ul>
              <p className="mt-3"><strong>What this tests:</strong></p>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li>Direct API communication without CORS issues</li>
                <li>Resume URL retrieval from your profile</li>
                <li>API response parsing and error handling</li>
                <li>Email generation using your actual resume data</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ResumeAPITest;
