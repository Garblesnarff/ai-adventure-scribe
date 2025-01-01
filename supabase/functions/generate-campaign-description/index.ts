import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { genre, difficulty, length, tone } = await req.json();
    
    console.log('Generating campaign description for:', { genre, difficulty, length, tone });

    const response = await fetch('https://api.cerebras.cloud/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('CEREBRAS_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b',
        messages: [
          {
            role: 'system',
            content: 'You are a creative D&D campaign description writer. Create engaging and thematic campaign descriptions.'
          },
          {
            role: 'user',
            content: `Generate a compelling campaign description for a ${genre} campaign with ${difficulty} difficulty, ${length} length, and a ${tone} tone. The description should be 2-3 paragraphs long.`
          }
        ]
      })
    });

    const data = await response.json();
    console.log('Cerebras API response:', data);

    return new Response(JSON.stringify({ description: data.choices[0].message.content }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error generating campaign description:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});