// @deno-types="https://deno.land/x/types/index.d.ts"
declare const Deno: any;

// @ts-ignore - Deno runtime module
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
// @ts-ignore - Deno runtime module  
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-requested-with",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Max-Age": "86400",
};

interface ResumeGenerationRequest {
  supabase_link: string;
  r_name: string;
  c_name: string;
}

interface ResumeGenerationResponse {
  success: boolean;
  email_body?: string;
  subject?: string;
  error?: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { 
      status: 200,
      headers: corsHeaders 
    });
  }

  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method not allowed" }), 
      { 
        status: 405, 
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        }
      }
    );
  }

  try {
    // Verify authentication
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header");
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user } } = await supabaseClient.auth.getUser(token);
    
    if (!user) {
      throw new Error("Unauthorized");
    }

    // Parse request body
    const requestBody: ResumeGenerationRequest = await req.json();

    // Validate request
    if (!requestBody.supabase_link || !requestBody.r_name || !requestBody.c_name) {
      throw new Error("Invalid request: supabase_link, r_name, and c_name are required");
    }

    // Make request to the resume generation API
    const resumeApiResponse = await fetch("https://9dfupb4d2a.execute-api.us-east-1.amazonaws.com/api/upload_resume", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Content-Type-Options": "nosniff",
        "X-Frame-Options": "DENY",
      },
      body: JSON.stringify({
        supabase_link: requestBody.supabase_link,
        r_name: requestBody.r_name,
        c_name: requestBody.c_name
      }),
    });

    if (!resumeApiResponse.ok) {
      const errorText = await resumeApiResponse.text();
      console.error('Resume API Error:', { status: resumeApiResponse.status, error: errorText });
      
      // Provide specific error messages based on status codes
      let errorMessage = "Failed to generate email";
      if (resumeApiResponse.status === 400) {
        errorMessage = `Invalid request: ${errorText}`;
      } else if (resumeApiResponse.status === 401) {
        errorMessage = "Authentication failed. Please check your API credentials.";
      } else if (resumeApiResponse.status === 403) {
        errorMessage = "Access forbidden. Please check your permissions.";
      } else if (resumeApiResponse.status === 429) {
        errorMessage = "Rate limit exceeded. Please try again later.";
      } else if (resumeApiResponse.status === 500) {
        errorMessage = "Server error. Please try again later or contact support.";
      } else {
        errorMessage = `Failed to generate email: ${resumeApiResponse.status} - ${errorText}`;
      }
      
      throw new Error(errorMessage);
    }

    const data = await resumeApiResponse.json();
    console.log('Resume API Response:', data);

    // Validate response format
    if (!data.email_body || !data.subject) {
      throw new Error("Invalid response from resume generation API: missing email_body or subject");
    }

    const response: ResumeGenerationResponse = {
      success: true,
      email_body: data.email_body,
      subject: data.subject
    };

    return new Response(JSON.stringify(response), {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
    });

  } catch (error) {
    console.error('Resume generation proxy error:', error);
    
    // Determine appropriate status code based on error type
    let status = 500;
    let errorMessage = "Internal server error";
    
    if (error instanceof Error) {
      if (error.message.includes("Unauthorized") || error.message.includes("No authorization header")) {
        status = 401;
        errorMessage = "Authentication required";
      } else if (error.message.includes("Invalid request")) {
        status = 400;
        errorMessage = error.message;
      } else if (error.message.includes("Rate limit exceeded")) {
        status = 429;
        errorMessage = error.message;
      } else if (error.message.includes("Authentication failed") || error.message.includes("Access forbidden")) {
        status = 403;
        errorMessage = error.message;
      } else if (error.message.includes("Server error")) {
        status = 502;
        errorMessage = error.message;
      } else {
        errorMessage = error.message;
      }
    }
    
    const errorResponse: ResumeGenerationResponse = {
      success: false,
      error: errorMessage
    };
    
    return new Response(
      JSON.stringify(errorResponse),
      {
        status,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
};

serve(handler);
