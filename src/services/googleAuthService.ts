import { supabase } from '@/lib/supabase';
import { getConfig } from '@/config/environment';

export interface GoogleUser {
  id: string;
  google_id: string;
  email: string;
  name: string;
  profile_picture?: string;
  access_token: string;
  refresh_token?: string;
  provider: string;
  created_at: string;
  updated_at: string;
}

export interface GoogleContact {
  id: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  title?: string;
}

class GoogleAuthService {
  private clientId: string;
  private redirectUri: string;
  private scope: string;

  constructor() {
    this.clientId = getConfig().google.clientId;
    this.redirectUri = `${window.location.origin}/auth/google/callback`;
    this.scope = [
      'https://www.googleapis.com/auth/gmail.send',
      'https://www.googleapis.com/auth/gmail.readonly',
      'https://www.googleapis.com/auth/gmail.labels',
      'https://www.googleapis.com/auth/gmail.addons.current.message.readonly',
      'https://www.googleapis.com/auth/userinfo.email',
      'https://www.googleapis.com/auth/userinfo.profile',
    ].join(' ');
  }

  // Initialize Google OAuth flow
  async initiateAuth(forceReauth: boolean = false): Promise<void> {
    const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
    authUrl.searchParams.set('client_id', this.clientId);
    authUrl.searchParams.set('redirect_uri', this.redirectUri);
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('scope', this.scope);
    authUrl.searchParams.set('access_type', 'offline');
    authUrl.searchParams.set('state', 'email_outreach'); // Add state parameter for security
    
    // Force consent screen for reauthentication or first-time auth
    if (forceReauth) {
      authUrl.searchParams.set('prompt', 'consent select_account');
      authUrl.searchParams.set('include_granted_scopes', 'false');
    } else {
      authUrl.searchParams.set('prompt', 'consent');
    }
    
    // Store current user session for later reference
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      localStorage.setItem('pending_google_auth_user', session.user.id);
    }
    
    window.location.href = authUrl.toString();
  }

  // Handle OAuth callback and exchange code for tokens
  async handleCallback(code: string): Promise<GoogleUser | null> {
    try {
      console.log('Handling Google OAuth callback...');
      
      // Use Supabase Edge Function for secure token exchange
      const { data, error } = await supabase.functions.invoke('google-auth-proxy', {
        body: {
          code,
          redirect_uri: this.redirectUri,
        },
      });

      if (error) {
        console.error('Auth proxy error:', error);
        throw new Error('Failed to exchange code for tokens');
      }

      const tokenData = data;
      if (!tokenData.access_token) {
        console.error('No access token received from Google');
        throw new Error('No access token received');
      }
      
      console.log('Successfully received tokens from Google');
      
      // Get user info from Google
      const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: {
          Authorization: `Bearer ${tokenData.access_token}`,
        },
      });

      if (!userInfoResponse.ok) {
        console.error('Failed to get user info from Google');
        throw new Error('Failed to get user info');
      }

      const userInfo = await userInfoResponse.json();
      console.log('Retrieved user info:', userInfo.email);
      
      // Store user info and tokens in Supabase
      const googleUser = await this.storeUserTokens({
        google_id: userInfo.id,
        email: userInfo.email,
        name: userInfo.name,
        profile_picture: userInfo.picture,
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token,
      });

      console.log('Successfully stored user tokens');
      return googleUser;
    } catch (error) {
      console.error('Error handling Google OAuth callback:', error);
      return null;
    }
  }

  // Store user tokens in Supabase
  private async storeUserTokens(userData: {
    google_id: string;
    email: string;
    name: string;
    profile_picture?: string;
    access_token: string;
    refresh_token?: string;
  }): Promise<GoogleUser> {
    const { data, error } = await supabase
      .from('users')
      .upsert({
        google_id: userData.google_id,
        email: userData.email,
        name: userData.name,
        profile_picture: userData.profile_picture,
        access_token: userData.access_token,
        refresh_token: userData.refresh_token,
        provider: 'google',
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'google_id',
        ignoreDuplicates: false
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to store user tokens: ${error.message}`);
    }

    return data;
  }

  // Get stored user by current session and validate tokens
  async getStoredUser(): Promise<GoogleUser | null> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        console.log('No active session found');
        return null;
      }

      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', session.user.email)
        .single();

      if (error || !data) {
        console.log('No stored Google user found for email:', session.user.email);
        return null;
      }

      // Validate that user has both access_token and refresh_token
      if (!data.access_token) {
        console.log('User found but no access token');
        return null;
      }

      // Test if the access token is still valid
      const isValid = await this.validateAccessToken(data.access_token);
      if (isValid) {
        console.log('Access token is valid');
        return data;
      }

      // If access token is invalid, try to refresh it
      if (data.refresh_token) {
        console.log('Access token expired, attempting to refresh...');
        const newAccessToken = await this.refreshAccessToken(data.refresh_token);
        if (newAccessToken) {
          // Update the access token in database
          const { data: updatedData, error: updateError } = await supabase
            .from('users')
            .update({ 
              access_token: newAccessToken,
              updated_at: new Date().toISOString()
            })
            .eq('id', data.id)
            .select()
            .single();

          if (!updateError && updatedData) {
            console.log('Successfully refreshed access token');
            return updatedData;
          }
        }
      }

      // If we can't refresh the token, the user needs to re-authenticate
      console.log('Unable to refresh token, user needs to re-authenticate');
      return null;
    } catch (error) {
      console.error('Error in getStoredUser:', error);
      return null;
    }
  }

  // Validate access token by making a test API call
  private async validateAccessToken(accessToken: string): Promise<boolean> {
    try {
      const response = await fetch('https://www.googleapis.com/oauth2/v1/tokeninfo', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (response.ok) {
        const tokenInfo = await response.json();
        // Check if token has required scopes
        const requiredScopes = [
          'https://www.googleapis.com/auth/gmail.send',
          'https://www.googleapis.com/auth/gmail.readonly',
          'https://www.googleapis.com/auth/gmail.labels',
          'https://www.googleapis.com/auth/gmail.addons.current.message.readonly',
          'https://www.googleapis.com/auth/userinfo.email',
          'https://www.googleapis.com/auth/userinfo.profile',
          'https://www.googleapis.com/auth/contacts.readonly'
        ];
        
        const tokenScopes = tokenInfo.scope ? tokenInfo.scope.split(' ') : [];
        const hasRequiredScopes = requiredScopes.every(scope => 
          tokenScopes.includes(scope)
        );

        return hasRequiredScopes;
      }

      return false;
    } catch (error) {
      console.error('Error validating access token:', error);
      return false;
    }
  }

  // Clear stored authentication - for forcing re-authentication
  async clearStoredAuth(): Promise<void> {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return;

    // First, try to get the current user data to revoke the token
    const { data: userData } = await supabase
      .from('users')
      .select('access_token')
      .eq('email', session.user.email)
      .single();

    // Revoke the access token if it exists
    if (userData?.access_token) {
      try {
        await this.revokeAccess(userData.access_token);
        console.log('Access token revoked successfully');
      } catch (error) {
        console.warn('Failed to revoke access token:', error);
      }
    }

    // Clear the stored authentication data
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('email', session.user.email);

    if (error) {
      console.error('Error clearing stored auth:', error);
    }
  }

  // Refresh access token if needed
  async refreshAccessToken(refreshToken: string): Promise<string | null> {
    try {
      // Use Supabase Edge Function for secure token refresh
      const { data, error } = await supabase.functions.invoke('google-auth-proxy', {
        body: {
          refresh_token: refreshToken,
          grant_type: 'refresh_token',
        },
      });

      if (error) {
        console.error('Token refresh proxy error:', error);
        throw new Error('Failed to refresh token');
      }

      return data.access_token;
    } catch (error) {
      console.error('Error refreshing access token:', error);
      return null;
    }
  }

  // Get Google contacts
  async getContacts(accessToken: string): Promise<GoogleContact[]> {
    try {
      const response = await fetch(
        'https://people.googleapis.com/v1/people/me/connections?personFields=names,emailAddresses,phoneNumbers,organizations',
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch contacts');
      }

      const data = await response.json();
      
      return (data.connections || []).map((connection: {
        resourceName: string;
        names?: Array<{ displayName: string }>;
        emailAddresses?: Array<{ value: string }>;
        phoneNumbers?: Array<{ value: string }>;
        organizations?: Array<{ name: string; title: string }>;
      }) => ({
        id: connection.resourceName,
        name: connection.names?.[0]?.displayName || 'Unknown',
        email: connection.emailAddresses?.[0]?.value || '',
        phone: connection.phoneNumbers?.[0]?.value,
        company: connection.organizations?.[0]?.name,
        title: connection.organizations?.[0]?.title,
      })).filter((contact: GoogleContact) => contact.email);
    } catch (error) {
      console.error('Error fetching contacts:', error);
      return [];
    }
  }

  // Send email via Gmail API
  async sendEmail(
    accessToken: string,
    to: string,
    subject: string,
    body: string,
    isHtml = false
  ): Promise<boolean> {
    try {
      const email = [
        `To: ${to}`,
        `Subject: ${subject}`,
        `Content-Type: ${isHtml ? 'text/html' : 'text/plain'}; charset=utf-8`,
        '',
        body
      ].join('\n');

      const encodedEmail = btoa(unescape(encodeURIComponent(email)))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');

      const response = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          raw: encodedEmail,
        }),
      });

      if (response.ok) {
        // Log successful email to useremaillog table
        try {
          const responseData = await response.json();
          const { data: user } = await supabase.auth.getUser();
          
          if (user.user?.email) {
            await supabase
              .from('useremaillog')
              .insert({
                sent_at: new Date().toISOString(),
                to: to,
                user_id: user.user.email, // useremaillog uses email as user_id
                messageId: responseData.id || `gmail-${Date.now()}`,
                threadId: responseData.threadId || responseData.id,
                reference: 'gmail-manual',
                subject: subject
              });
            console.log(`Logged Gmail email to useremaillog for ${to}`);
          }
        } catch (logError) {
          console.error('Failed to log Gmail email to useremaillog:', logError);
          // Don't fail the email send if logging fails
        }
      }

      return response.ok;
    } catch (error) {
      console.error('Error sending email:', error);
      return false;
    }
  }

  // Revoke access
  async revokeAccess(accessToken: string): Promise<boolean> {
    try {
      const response = await fetch(`https://oauth2.googleapis.com/revoke?token=${accessToken}`, {
        method: 'POST',
      });
      return response.ok;
    } catch (error) {
      console.error('Error revoking access:', error);
      return false;
    }
  }
}

export const googleAuthService = new GoogleAuthService(); 