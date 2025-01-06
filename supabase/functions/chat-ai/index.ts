import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { GoogleGenerativeAI } from "https://esm.sh/@google/generative-ai@0.1.3";

const genAI = new GoogleGenerativeAI(Deno.env.get('GEMINI_API_KEY') || '');

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

    // Initialize Gemini model
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    // Create chat context
    const prompt = `You are a Dungeon Master in a D&D game. Respond to the player's message in an engaging and immersive way.
    Keep responses concise but descriptive. Focus on advancing the story and creating an engaging atmosphere.
    
    Player's message: "${message.text}"`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const dmResponse = response.text();
    
    console.log('Generated DM response:', dmResponse);

    const aiResponse = {
      id: crypto.randomUUID(),
      text: dmResponse,
      sender: 'dm',
      timestamp: new Date().toISOString(),
      context: {
        emotion: 'neutral',
        intent: 'response',
      }
    };

    return new Response(
      JSON.stringify(aiResponse),
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