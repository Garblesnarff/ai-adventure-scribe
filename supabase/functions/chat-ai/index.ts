import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { GoogleGenerativeAI } from "https://esm.sh/@google/generative-ai@0.1.3"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

/**
 * Maps our application roles to Gemini API roles
 */
const mapRole = (role: string): string => {
  switch (role) {
    case 'player':
      return 'user';
    case 'dm':
    case 'system':
      return 'model';
    default:
      return 'user';
  }
};

/**
 * Handles the chat request and generates AI responses
 * @param messages - Array of chat messages
 * @returns AI generated response
 */
async function handleChat(messages: any[]) {
  const genAI = new GoogleGenerativeAI(Deno.env.get('GEMINI_API_KEY') || '');
  const model = genAI.getGenerativeModel({ model: "gemini-pro" });

  try {
    console.log('Processing chat request with messages:', messages);
    
    const chat = model.startChat({
      history: messages.map(msg => ({
        role: mapRole(msg.sender),
        parts: msg.text,
      })),
      generationConfig: {
        temperature: 0.9,
        topK: 1,
        topP: 1,
        maxOutputTokens: 2048,
      },
    });

    const result = await chat.sendMessage(messages[messages.length - 1].text);
    const response = await result.response;
    const text = response.text();

    console.log('Generated AI response:', text);

    return {
      text,
      sender: 'dm',
      context: {
        emotion: 'neutral',
        intent: 'response',
      }
    };
  } catch (error) {
    console.error('Error in AI chat:', error);
    throw error;
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { messages } = await req.json()
    const response = await handleChat(messages)

    return new Response(
      JSON.stringify(response),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json'
        } 
      },
    )
  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      },
    )
  }
})