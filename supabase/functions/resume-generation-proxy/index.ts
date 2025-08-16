// @ts-ignore - Deno edge function imports
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
// @ts-ignore - Deno edge function imports  
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

    // Make request to AWS API Gateway
    const awsApiUrl = "https://9dfupb4d2a.execute-api.us-east-1.amazonaws.com/upload_resume";
    const awsResponse = await fetch(awsApiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    if (!awsResponse.ok) {
      const errorData = await awsResponse.text();
      throw new Error(`AWS API error: ${awsResponse.status} - ${errorData}`);
    }

    const data = await awsResponse.json();

    return new Response(JSON.stringify(data), {
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
      } else {
        errorMessage = error.message;
      }
    }
    
    return new Response(
      JSON.stringify({ 
        error: errorMessage,
        details: error instanceof Error ? error.message : "Unknown error" 
      }),
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
