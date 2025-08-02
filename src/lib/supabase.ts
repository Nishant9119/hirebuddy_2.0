import { createClient } from '@supabase/supabase-js';
import { getConfig } from '../config/environment';

const config = getConfig();
const supabaseUrl = config.supabase.url;
const supabaseAnonKey = config.supabase.anonKey;

// Debug logging for development
if (config.isDevelopment) {
  console.log('🔧 Supabase Configuration:', {
    url: supabaseUrl ? '✓ Present' : '❌ Missing',
    anonKey: supabaseAnonKey ? '✓ Present' : '❌ Missing',
  });
}

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing required Supabase configuration. Please check your environment variables.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
  global: {
    headers: {
      'X-Client-Info': 'hirebuddy-dashboard',
    },
  },
});

// Test connection function
export const testConnection = async () => {
  try {
    const { data, error } = await supabase
      .from('testdb')
      .select('count', { count: 'exact', head: true })
      .limit(1);
    
    if (error) {
      console.error('Database connection test failed:', error);
      return false;
    }
    
    console.log('✅ Database connection successful');
    return true;
  } catch (error) {
    console.error('Database connection test error:', error);
    return false;
  }
};