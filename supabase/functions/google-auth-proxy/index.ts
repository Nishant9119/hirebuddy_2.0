// @ts-ignore - Deno runtime globals
declare const Deno: {
  env: {
    get(key: string): string | undefined
  }
  serve(handler: (req: Request) => Promise<Response> | Response): void
}

// @ts-ignore - Deno ESM import
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-requested-with',
  'Access-Control-Allow-Methods': 'POST, OPTIONS, GET',
  'Access-Control-Max-Age': '86400',
}

interface TokenExchangeRequest {
  code: string
  redirect_uri: string
}

interface TokenRefreshRequest {
  refresh_token: string
  grant_type: 'refresh_token'
}

const handler = async (req: Request): Promise<Response> => {
  console.log('Google Auth Proxy called with method:', req.method);
  console.log('Request headers:', Object.fromEntries(req.headers.entries()));
  
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    console.log('Handling CORS preflight request');
    return new Response(null, { 
      status: 200,
      headers: corsHeaders 
    })
  }

  if (req.method !== "POST") {
    console.log('Method not allowed:', req.method);
    return new Response(
      JSON.stringify({ error: "Method not allowed" }), 
      { 
        status: 405, 
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        }
      }
    )
  }

  try {
    console.log('Processing POST request');
    
    // Verify authentication
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    )

    const authHeader = req.headers.get("Authorization")
    if (!authHeader) {
      console.error('No authorization header provided');
      throw new Error("No authorization header")
    }

    const token = authHeader.replace("Bearer ", "")
    console.log('Verifying user token...');
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token)
    
    if (authError || !user) {
      console.error('Authentication error:', authError);
      throw new Error("Unauthorized")
    }

    console.log('User authenticated:', user.email);

    // Get Google OAuth credentials from environment
    const clientId = Deno.env.get("GOOGLE_CLIENT_ID")
    const clientSecret = Deno.env.get("GOOGLE_CLIENT_SECRET")
    
    if (!clientId || !clientSecret) {
      console.error('Google OAuth credentials not configured');
      throw new Error("Google OAuth credentials not configured")
    }

    // Parse request body
    const requestBody: TokenExchangeRequest | TokenRefreshRequest = await req.json()
    console.log('Request body type:', 'code' in requestBody ? 'token exchange' : 'token refresh');

    let tokenResponse: Response

    if ('code' in requestBody) {
      // Handle authorization code exchange
      console.log('Exchanging authorization code for tokens...');
      tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: clientId,
          client_secret: clientSecret,
          code: requestBody.code,
          grant_type: 'authorization_code',
          redirect_uri: requestBody.redirect_uri,
        }),
      })
    } else if ('refresh_token' in requestBody) {
      // Handle token refresh
      console.log('Refreshing access token...');
      tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: clientId,
          client_secret: clientSecret,
          refresh_token: requestBody.refresh_token,
          grant_type: 'refresh_token',
        }),
      })
    } else {
      throw new Error("Invalid request: must provide either code or refresh_token")
    }

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text()
      console.error('Google OAuth error:', errorData)
      throw new Error('Failed to exchange tokens with Google')
    }

    const tokens = await tokenResponse.json()
    console.log('Successfully received tokens from Google');

    return new Response(
      JSON.stringify(tokens),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    )

  } catch (error) {
    console.error('Google Auth Proxy Error:', error)
    
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'An unexpected error occurred' 
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    )
  }
}

Deno.serve(handler) 