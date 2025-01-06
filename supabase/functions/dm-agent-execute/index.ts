import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { GoogleGenerativeAI } from "https://esm.sh/@google/generative-ai@0.1.3";
import { buildCharacterContext, buildCampaignContext } from './contextBuilder.ts';
import { buildPrompt } from './promptBuilder.ts';

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
    const { task, agentContext } = await req.json();
    
    // Build character context
    const characterContext = await buildCharacterContext(agentContext.characterDetails?.id);
    if (!characterContext) {
      throw new Error('Failed to build character context');
    }

    // Build campaign context
    const campaignContext = await buildCampaignContext(agentContext.campaignDetails?.id);
    if (!campaignContext) {
      throw new Error('Failed to build campaign context');
    }

    // Build the complete prompt
    const prompt = buildPrompt({
      campaignContext,
      characterContext,
      memories: agentContext.memories || []
    });

    console.log('Executing DM task with prompt:', prompt);

    // Call Gemini API
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    console.log('Generated response:', text);

    return new Response(
      JSON.stringify({ response: text }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in dm-agent-execute:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});