import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { ChatMessage } from './types.ts';

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
    console.log('Processing chat request...');
    
    const { message, sessionId, campaignId, characterId } = await req.json();
    
    if (!message || !sessionId || !campaignId || !characterId) {
      console.error('Missing required parameters:', { message, sessionId, campaignId, characterId });
      throw new Error('Missing required parameters');
    }
    
    console.log('Request data:', { sessionId, messageContent: message.text });
    
    // For now, just echo back a simple response
    // This will be enhanced with AI integration later
    const response = {
      id: crypto.randomUUID(),
      text: `Received your message: ${message.text}`,
      sender: 'dm',
      timestamp: new Date().toISOString(),
      context: {
        emotion: 'neutral',
        intent: 'response',
      }
    };

    return new Response(
      JSON.stringify(response),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json'
        } 
      },
    );
  } catch (error) {
    console.error('Error in chat-ai function:', error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: error.stack
      }),
      { 
        status: 500,
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      },
    );
  }
});