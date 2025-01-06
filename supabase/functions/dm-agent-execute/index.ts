import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { GoogleGenerativeAI } from "https://esm.sh/@google/generative-ai@0.1.3";
import { formatMemoryContext } from '../chat-ai/memory-utils.ts';

const genAI = new GoogleGenerativeAI(Deno.env.get('GEMINI_API_KEY') || '');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { task } = await req.json();
    const { messageHistory, memories, campaignId } = task.context;

    // Format memory context
    const memoryContext = formatMemoryContext(memories);

    // Format the complete prompt for the DM agent
    const prompt = `You are a Dungeon Master in a D&D game. Your role is to create an engaging, immersive experience.
    
    Player's latest message: "${messageHistory[0].text}"
    
    ${memoryContext}
    
    Respond in character as the DM, incorporating relevant memories and maintaining narrative consistency.
    Keep responses concise but descriptive. Focus on advancing the story and creating an engaging atmosphere.`;

    console.log('Executing DM task with prompt:', prompt);

    // Call Gemini API
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    console.log('Generated response:', text);

    return new Response(
      JSON.stringify({ response: text }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    console.error('Error in dm-agent-execute:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});