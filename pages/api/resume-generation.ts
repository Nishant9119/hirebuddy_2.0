import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Handle CORS
  res.setHeader('Access-Control-Allow-Origin', 'https://www.hirebuddy.net');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Verify authentication
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'No authorization header' });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Validate request body
    const { supabase_link, r_name, c_name } = req.body;
    if (!supabase_link || !r_name || !c_name) {
      return res.status(400).json({ 
        error: 'Invalid request: supabase_link, r_name, and c_name are required' 
      });
    }

    // Make request to AWS API Gateway
    const awsResponse = await fetch('https://9dfupb4d2a.execute-api.us-east-1.amazonaws.com/upload_resume', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ supabase_link, r_name, c_name }),
    });

    if (!awsResponse.ok) {
      const errorData = await awsResponse.text();
      return res.status(awsResponse.status).json({ 
        error: `AWS API error: ${awsResponse.status} - ${errorData}` 
      });
    }

    const data = await awsResponse.json();
    return res.status(200).json(data);

  } catch (error) {
    console.error('Resume generation error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
