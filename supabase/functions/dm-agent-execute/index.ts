import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { GoogleGenerativeAI } from "https://esm.sh/@google/generative-ai@0.1.3";
import { ChatMessage, AgentContext, TaskExecutionResponse } from './types.ts';

const genAI = new GoogleGenerativeAI(Deno.env.get('GEMINI_API_KEY') || '');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * Returns genre-specific guidelines
 */
const getGenreGuidelines = (genre: string) => {
  const guidelines = {
    'traditional-fantasy': 'Focus on classic fantasy elements like magic, mythical creatures, and heroic quests.',
    'dark-fantasy': 'Emphasize darker themes, moral ambiguity, supernatural horror, and grim circumstances.',
    'high-fantasy': 'Feature epic scales, powerful magic, world-changing events, and grand adventures.',
    'science-fantasy': 'Blend advanced technology with magical elements, mixing sci-fi and fantasy concepts.',
    'steampunk': 'Incorporate Victorian-era technology, steam-powered machinery, and industrial themes.',
    'horror': 'Focus on fear, tension, supernatural threats, and psychological elements.'
  };
  return guidelines[genre] || 'Use standard fantasy elements and tropes';
};

/**
 * Returns tone-specific guidelines
 */
const getToneGuidelines = (tone: string) => {
  const guidelines = {
    'serious': 'Maintain gravity and realism in descriptions and consequences.',
    'humorous': 'Allow for lighter moments while maintaining theme consistency.',
    'gritty': 'Emphasize harsh realities, struggles, and the weight of choices.'
  };
  return guidelines[tone] || 'Balance between serious and light elements';
};

/**
 * Returns difficulty-specific guidelines
 */
const getDifficultyGuidelines = (difficulty: string) => {
  const guidelines = {
    'easy': 'Provide clear paths forward, forgiving challenges, and obvious solutions.',
    'medium': 'Balance challenge and accessibility, with moderate consequences.',
    'hard': 'Present complex situations, significant consequences, and challenging decisions.'
  };
  return guidelines[difficulty] || 'Maintain moderate challenge level';
};

/**
 * Returns campaign length guidelines
 */
const getLengthGuidelines = (length: string) => {
  const guidelines = {
    'one-shot': 'Focus on a single, contained adventure that can be completed in one session.',
    'short': 'Plan for a brief series of connected adventures.',
    'full': 'Develop long-term story arcs and complex narrative threads.'
  };
  return guidelines[length] || 'Adapt to session context';
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { task, agentContext } = await req.json();
    const campaignDetails = agentContext.campaignDetails;
    
    console.log('Processing DM task with campaign details:', campaignDetails);

    // Format the complete prompt for the DM agent
    const prompt = `You are a Dungeon Master for a D&D game. Your role is to:
1. Narrate scenes and describe environments
2. Present clear choices and opportunities for player interaction
3. Respond to player actions
4. Maintain the campaign's established tone and setting

Campaign Parameters:
- Genre: ${campaignDetails?.genre || 'traditional-fantasy'}
- Tone: ${campaignDetails?.tone || 'serious'}
- Difficulty: ${campaignDetails?.difficulty_level || 'medium'}
- Length: ${campaignDetails?.campaign_length || 'short'}

Campaign Context:
Name: ${campaignDetails?.name || 'A D&D Adventure'}
Description: ${campaignDetails?.description || 'A classic fantasy adventure'}

Genre Guidelines: ${getGenreGuidelines(campaignDetails?.genre)}
Tone Guidelines: ${getToneGuidelines(campaignDetails?.tone)}
Difficulty Guidelines: ${getDifficultyGuidelines(campaignDetails?.difficulty_level)}
Length Guidelines: ${getLengthGuidelines(campaignDetails?.campaign_length)}

Important DM Guidelines:
1. ALWAYS end your descriptions with "What would you like to do?" or a similar prompt for action
2. Stay consistent with the campaign's tone and genre throughout all descriptions
3. Present clear situations and choices that match the difficulty level
4. Acknowledge and respond to player choices naturally
5. Keep the scope appropriate for the campaign length
6. Describe environments and situations vividly while maintaining the appropriate atmosphere
7. Create opportunities for meaningful player decisions

Current Game State: ${task.context?.currentState || 'initial'}
Task Description: ${task.description}

Remember to maintain the specified genre, tone, and difficulty in your response.
Always end with a prompt for player action.`;

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