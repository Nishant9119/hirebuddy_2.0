import { getConfig } from '@/config/environment';
import { apiClient } from '@/lib/api';

export interface DatabaseTestResult {
  success: boolean;
  message: string;
  details?: any;
  contactCount?: number;
}

export async function testDatabaseConnection(): Promise<DatabaseTestResult> {
  try {
    console.log('🔍 Testing database connection...');
    console.log('Environment check:');
      console.log('- VITE_SUPABASE_URL:', getConfig().supabase.url ? '✓ Present' : '❌ Missing');
  console.log('- VITE_SUPABASE_ANON_KEY:', getConfig().supabase.anonKey ? '✓ Present' : '❌ Missing');

    // Test basic connection via backend
    const health = await apiClient.getDbHealth();
    const countResponse = await apiClient.getContactsCount();

    console.log('✅ Database connection successful (via backend)');
    const count = (countResponse.data as any)?.count ?? 0;
    console.log(`📊 Found ${count} contacts in the database`);

    return {
      success: true,
      message: `Successfully connected to database. Found ${count} contacts.`,
      contactCount: count || 0,
      details: { health }
    };

  } catch (error) {
    console.error('❌ Database connection error:', error);
    return {
      success: false,
      message: `Database connection error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      details: error
    };
  }
}

export async function addSampleContact(): Promise<DatabaseTestResult> {
  try {
    const sampleContact = {
      full_name: 'Test Contact',
      first_name: 'Test',
      email: `test-${Date.now()}@example.com`,
      company_name: 'Test Company',
      title: 'Test Title',
      linkedin_link: 'https://linkedin.com/in/test',
      company_website_full: 'https://test.com'
    };

    const response = await apiClient.createContact(sampleContact);
    if (!response.success) {
      return {
        success: false,
        message: `Failed to add sample contact: ${response.error || 'Unknown error'}`,
        details: response
      };
    }

    return {
      success: true,
      message: 'Successfully added sample contact',
      details: response.data
    };

  } catch (error) {
    return {
      success: false,
      message: `Error adding sample contact: ${error instanceof Error ? error.message : 'Unknown error'}`,
      details: error
    };
  }
} 