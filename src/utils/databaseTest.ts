import { supabase } from '@/lib/supabase';
import { getConfig } from '@/config/environment';

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

    // Test basic connection
    const { data, error, count } = await supabase
      .from('testdb')
      .select('*', { count: 'exact' });

    if (error) {
      console.error('❌ Database query failed:', error);
      return {
        success: false,
        message: `Database query failed: ${error.message}`,
        details: error
      };
    }

    console.log('✅ Database connection successful');
    console.log(`📊 Found ${count} contacts in the database`);

    if (data && data.length > 0) {
      console.log('📋 Sample contacts:');
      data.slice(0, 3).forEach((contact, index) => {
        console.log(`  ${index + 1}. ${contact.full_name || contact.first_name || 'Unknown'} - ${contact.email || 'No email'}`);
      });
    }

    return {
      success: true,
      message: `Successfully connected to database. Found ${count} contacts.`,
      contactCount: count || 0,
      details: data?.slice(0, 3)
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

    const { data, error } = await supabase
      .from('testdb')
      .insert([sampleContact])
      .select()
      .single();

    if (error) {
      return {
        success: false,
        message: `Failed to add sample contact: ${error.message}`,
        details: error
      };
    }

    return {
      success: true,
      message: 'Successfully added sample contact',
      details: data
    };

  } catch (error) {
    return {
      success: false,
      message: `Error adding sample contact: ${error instanceof Error ? error.message : 'Unknown error'}`,
      details: error
    };
  }
} 