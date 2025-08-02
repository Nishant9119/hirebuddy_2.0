import React, { useState, useEffect } from 'react';
import { testDatabaseConnection, addSampleContact, DatabaseTestResult } from '@/utils/databaseTest';
import { contactsService } from '@/services/contactsService';
import { getConfig } from '@/config/environment';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import { 
  Database, 
  RefreshCw, 
  Plus, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Info
} from 'lucide-react';

const DatabaseTest: React.FC = () => {
  const [testResult, setTestResult] = useState<DatabaseTestResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isAddingContact, setIsAddingContact] = useState(false);

  const runDatabaseTest = async () => {
    setIsLoading(true);
    try {
      const result = await testDatabaseConnection();
      setTestResult(result);
      
      if (result.success) {
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      const errorResult: DatabaseTestResult = {
        success: false,
        message: `Test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        details: error
      };
      setTestResult(errorResult);
      toast.error(errorResult.message);
    } finally {
      setIsLoading(false);
    }
  };

  const addTestContact = async () => {
    setIsAddingContact(true);
    try {
      const result = await addSampleContact();
      if (result.success) {
        toast.success(result.message);
        // Re-run the test to show updated count
        await runDatabaseTest();
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      toast.error(`Failed to add test contact: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsAddingContact(false);
    }
  };

  const testContactsService = async () => {
    try {
      const contacts = await contactsService.getContacts();
      toast.success(`Contacts service test successful! Found ${contacts.length} contacts.`);
    } catch (error) {
      toast.error(`Contacts service test failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  useEffect(() => {
    runDatabaseTest();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Database Connection Test</h1>
          <p className="text-gray-600">Debug your Supabase database connection</p>
        </div>

        {/* Environment Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="h-5 w-5 text-blue-600" />
              Environment Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Badge variant="outline">Mode: {getConfig().isDevelopment ? 'development' : 'production'}</Badge>
              </div>
              <div>
                            <Badge variant={getConfig().supabase.url ? "default" : "destructive"}>
              Supabase URL: {getConfig().supabase.url ? 'Present' : 'Missing'}
            </Badge>
              </div>
              <div>
                            <Badge variant={getConfig().supabase.anonKey ? "default" : "destructive"}>
              Supabase Key: {getConfig().supabase.anonKey ? 'Present' : 'Missing'}
            </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Test Results */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5 text-purple-600" />
              Database Connection Test
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2">
              <Button
                onClick={runDatabaseTest}
                disabled={isLoading}
                className="flex items-center gap-2"
              >
                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                {isLoading ? 'Testing...' : 'Run Test'}
              </Button>
              
              <Button
                onClick={testContactsService}
                variant="outline"
                className="flex items-center gap-2"
              >
                <Database className="h-4 w-4" />
                Test Contacts Service
              </Button>

              <Button
                onClick={addTestContact}
                disabled={isAddingContact}
                variant="outline"
                className="flex items-center gap-2"
              >
                <Plus className={`h-4 w-4 ${isAddingContact ? 'animate-spin' : ''}`} />
                {isAddingContact ? 'Adding...' : 'Add Test Contact'}
              </Button>
            </div>

            {testResult && (
              <Alert className={testResult.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
                <div className="flex items-center gap-2">
                  {testResult.success ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-600" />
                  )}
                  <AlertDescription className={testResult.success ? 'text-green-800' : 'text-red-800'}>
                    <strong>
                      {testResult.success ? 'Success: ' : 'Error: '}
                    </strong>
                    {testResult.message}
                  </AlertDescription>
                </div>
              </Alert>
            )}

            {testResult?.success && testResult.contactCount !== undefined && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-semibold text-blue-800 mb-2">Database Stats</h4>
                <p className="text-blue-700">
                  Total Contacts: <strong>{testResult.contactCount}</strong>
                </p>
                
                {testResult.details && Array.isArray(testResult.details) && testResult.details.length > 0 && (
                  <div className="mt-3">
                    <h5 className="font-medium text-blue-800 mb-1">Sample Contacts:</h5>
                    <ul className="text-sm text-blue-700 space-y-1">
                      {testResult.details.map((contact: any, index: number) => (
                        <li key={index}>
                          • {contact.full_name || contact.first_name || 'Unknown'} - {contact.email || 'No email'}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {testResult && !testResult.success && testResult.details && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <h4 className="font-semibold text-red-800 mb-2">Error Details</h4>
                <pre className="text-sm text-red-700 whitespace-pre-wrap">
                  {JSON.stringify(testResult.details, null, 2)}
                </pre>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Instructions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-orange-600" />
              Troubleshooting Guide
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <h4 className="font-semibold">If the test fails:</h4>
              <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
                <li>Check that your environment variables are set in your deployment platform (Netlify, Vercel, etc.)</li>
                <li>Verify that VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are correctly configured</li>
                <li>Ensure the testdb table exists in your Supabase database</li>
                <li>Check your Supabase project settings and RLS policies</li>
                <li>Verify that your Supabase project is active and not paused</li>
              </ul>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-semibold">Environment Variables Needed:</h4>
              <div className="bg-gray-100 p-3 rounded text-sm font-mono">
                VITE_SUPABASE_URL=your_supabase_url<br/>
                VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DatabaseTest; 