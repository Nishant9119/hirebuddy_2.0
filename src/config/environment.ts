/**
 * Environment Configuration
 * 
 * This file manages environment variables safely:
 * - Public configs are exposed (safe for client-side)
 * - Private configs are handled via server-side functions only
 */

interface PublicConfig {
  supabase: {
    url: string;
    anonKey: string;
  };
  google: {
    clientId: string;
  };
  api: {
    baseUrl: string;
    awsBaseUrl: string;
  };
  stack: {
    publishableKey: string;
  };
  isDevelopment: boolean;
  isProduction: boolean;
}

// Only expose truly public configuration
// NO sensitive keys should be here
export const config: PublicConfig = {
  supabase: {
    url: (process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL || '') as string,
    anonKey: (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || '') as string,
  },
  google: {
    clientId: (process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || process.env.VITE_GOOGLE_CLIENT_ID || '') as string,
  },
  api: {
    baseUrl: (process.env.NEXT_PUBLIC_API_URL || process.env.VITE_API_URL || 'http://localhost:3001') as string,
    awsBaseUrl: (process.env.NEXT_PUBLIC_AWS_API_BASE_URL || process.env.VITE_AWS_API_BASE_URL || '') as string,
  },
  stack: {
    publishableKey: (process.env.NEXT_PUBLIC_STACK_PUBLISHABLE_KEY || process.env.VITE_STACK_PUBLISHABLE_KEY || '') as string,
  },
  isDevelopment: process.env.NODE_ENV === 'development',
  isProduction: process.env.NODE_ENV === 'production',
};

// Validation helper to ensure required public configs are present
export function validatePublicConfig(): { isValid: boolean; missingVars: string[] } {
  const missingVars: string[] = [];
  
  if (!config.supabase.url) missingVars.push('NEXT_PUBLIC_SUPABASE_URL');
  if (!config.supabase.anonKey) missingVars.push('NEXT_PUBLIC_SUPABASE_ANON_KEY');
  if (!config.google.clientId) missingVars.push('NEXT_PUBLIC_GOOGLE_CLIENT_ID');
  
  return {
    isValid: missingVars.length === 0,
    missingVars
  };
}

// Helper to get config values safely
export function getConfig(): PublicConfig {
  const validation = validatePublicConfig();
  
  // Log but do not throw; individual services already handle missing values gracefully
  if (!validation.isValid) {
    console.error('Missing required environment variables:', validation.missingVars);
  }
  
  return config;
}

// For development debugging only
if (config.isDevelopment) {
  console.log('🔧 Environment Config:', {
    supabaseUrl: config.supabase.url ? '✓ Present' : '❌ Missing',
    supabaseKey: config.supabase.anonKey ? '✓ Present' : '❌ Missing',
    googleClientId: config.google.clientId ? '✓ Present' : '❌ Missing',
    apiBaseUrl: config.api.baseUrl ? '✓ Present' : '❌ Missing',
  });
} 