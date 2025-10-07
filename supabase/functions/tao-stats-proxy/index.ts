import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const TAOSTATS_API_KEY = Deno.env.get('TAOSTATS_API_KEY');
const TAOSTATS_BASE_URL = 'https://api.taostats.io/v1';

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const endpoint = url.searchParams.get('endpoint');

    if (!endpoint) {
      throw new Error('Missing endpoint parameter');
    }

    if (!TAOSTATS_API_KEY) {
      console.error('TAOSTATS_API_KEY not configured');
      throw new Error('API key not configured');
    }

    console.log(`Proxying request to TaoStats: ${endpoint}`);

    // Construct the full API URL
    const apiUrl = `${TAOSTATS_BASE_URL}${endpoint}`;
    
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Authorization': TAOSTATS_API_KEY,
        'accept': 'application/json'
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`TaoStats API error: ${response.status} - ${errorText}`);
      throw new Error(`TaoStats API error: ${response.status}`);
    }

    const data = await response.json();

    return new Response(JSON.stringify(data), {
      headers: { 
        ...corsHeaders, 
        'Content-Type': 'application/json' 
      },
    });
  } catch (error) {
    console.error('Error in tao-stats-proxy:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: 'Failed to fetch data from TaoStats API'
      }), 
      {
        status: 500,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        },
      }
    );
  }
});
