import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { GoogleGenerativeAI } from "https://esm.sh/@google/generative-ai@0.1.3";
import { ChatMessage, AgentContext, TaskExecutionResponse } from './types.ts';

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
    const campaignDetails = agentContext.campaignDetails;

    // Format campaign-specific instructions
    const campaignContext = campaignDetails ? `
      Campaign Context:
      Name: ${campaignDetails.name}
      Genre: ${campaignDetails.genre || 'Standard Fantasy'}
      Tone: ${campaignDetails.tone || 'Balanced'}
      Difficulty: ${campaignDetails.difficulty_level || 'Medium'}
      Description: ${campaignDetails.description || 'A classic D&D adventure'}
      Campaign Length: ${campaignDetails.campaign_length || 'Standard'}
      Setting Details: ${JSON.stringify(campaignDetails.setting_details || {})}
    ` : '';

    // Format the complete prompt for the DM agent
    const prompt = `
      You are a Dungeon Master with the following context:
      Role: ${agentContext.role}
      Goal: ${agentContext.goal}
      Backstory: ${agentContext.backstory}

      ${campaignContext}

      Task Description: ${task.description}
      Expected Output: ${task.expectedOutput}

      Please execute this task and provide a response that matches the expected output.
      Additional Context: ${JSON.stringify(task.context || {})}

      Important Guidelines:
      - Maintain the specified tone and difficulty level
      - Stay consistent with the campaign's genre and setting
      - Adapt your language and descriptions to match the campaign's style
    `;

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