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
    const characterDetails = agentContext.characterDetails;
    const memories = agentContext.memories || [];

    // Format memories context
    const recentMemories = memories
      .sort((a, b) => b.importance - a.importance)
      .slice(0, 5)
      .map(m => `- ${m.content} (Type: ${m.type}, Importance: ${m.importance})`)
      .join('\n');

    // Format campaign-specific instructions
    const campaignContext = campaignDetails ? `
      Campaign Setting:
      Name: ${campaignDetails.name}
      Genre: ${campaignDetails.genre || 'Standard Fantasy'}
      Tone: ${campaignDetails.tone || 'Balanced'}
      Difficulty: ${campaignDetails.difficulty_level || 'Medium'}
      Description: ${campaignDetails.description || 'A classic D&D adventure'}
      Campaign Length: ${campaignDetails.campaign_length || 'Standard'}
      Setting Details: ${JSON.stringify(campaignDetails.setting_details || {})}
    ` : '';

    // Format character context if available
    const characterContext = characterDetails ? `
      Active Character:
      Name: ${characterDetails.name}
      Race: ${characterDetails.race}
      Class: ${characterDetails.class}
      Level: ${characterDetails.level}
      Background: ${characterDetails.background}
    ` : '';

    // Enhanced prompt structure
    const prompt = `
      You are an expert Dungeon Master with the following directives:

      ROLE AND RESPONSIBILITIES:
      - You are a skilled storyteller who creates immersive, engaging D&D experiences
      - You maintain narrative consistency while adapting to player choices
      - You balance challenge and accessibility based on player experience
      - You create vivid descriptions that engage all senses
      - You maintain the appropriate tone and atmosphere for the campaign's genre

      CAMPAIGN CONTEXT:
      ${campaignContext}

      CHARACTER CONTEXT:
      ${characterContext}

      RECENT MEMORIES AND EVENTS:
      ${recentMemories}

      RESPONSE GUIDELINES:
      1. Structure:
         - Begin with an immediate reaction or acknowledgment of player action
         - Provide rich environmental descriptions
         - Include NPC reactions when relevant
         - End with clear hooks for player interaction

      2. Tone and Style:
         - Match the campaign's genre and tone
         - Use descriptive language that engages all senses
         - Balance narrative depth with accessibility
         - Maintain consistent voice and atmosphere

      3. Player Engagement:
         - Acknowledge player agency and choices
         - Provide clear consequences for actions
         - Include interactive elements and decision points
         - Leave room for player creativity

      4. Technical Elements:
         - Respect game mechanics and rules
         - Scale challenges appropriately to difficulty level
         - Include relevant skill checks when appropriate
         - Balance combat, roleplay, and exploration

      Current Task: ${task.description}
      Expected Output: ${task.expectedOutput}
      Additional Context: ${JSON.stringify(task.context || {})}

      Remember to:
      - Stay true to the campaign's tone and setting
      - Provide clear paths for player interaction
      - Include sensory details and atmosphere
      - Maintain narrative consistency with previous events
      - Scale complexity to match the campaign's difficulty level
    `;

    console.log('Executing DM task with enhanced prompt:', prompt);

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