import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { DMResponse } from './types.ts';
import { buildCharacterContext, buildCampaignContext } from './contextBuilder.ts';
import { buildPrompt } from './promptBuilder.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { task, agentContext } = await req.json();
    const { campaignDetails, characterDetails, memories } = agentContext;

    console.log('Processing DM Agent task:', {
      taskType: task.description,
      campaign: campaignDetails?.name,
      character: characterDetails?.name,
      memoryCount: memories?.length
    });

    // Build narrative response based on context
    const narrativeResponse: DMResponse = {
      environment: {
        description: generateEnvironmentDescription(campaignDetails),
        atmosphere: campaignDetails.atmosphere || 'mysterious',
        sensoryDetails: generateSensoryDetails(campaignDetails)
      },
      characters: {
        activeNPCs: getActiveNPCs(memories),
        reactions: generateNPCReactions(characterDetails),
        dialogue: generateContextualDialogue(campaignDetails, characterDetails)
      },
      opportunities: {
        immediate: generateImmediateActions(campaignDetails, characterDetails),
        nearby: getKeyLocations(campaignDetails),
        questHooks: generateQuestHooks(memories)
      },
      mechanics: {
        availableActions: getAvailableActions(characterDetails),
        relevantRules: [],
        suggestions: generateActionSuggestions(campaignDetails, characterDetails)
      }
    };

    // Format the narrative response into natural language
    const formattedResponse = formatNarrativeResponse(narrativeResponse);

    return new Response(
      JSON.stringify({
        response: formattedResponse,
        context: agentContext,
        raw: narrativeResponse
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in DM agent execution:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

function generateEnvironmentDescription(campaign: any): string {
  const timeOfDay = ['dawn', 'morning', 'afternoon', 'dusk', 'night'][Math.floor(Math.random() * 5)];
  const atmosphere = campaign.atmosphere || 'mysterious';
  
  if (campaign.genre === 'dark-fantasy') {
    return `The ${timeOfDay} casts long shadows across ${campaign.setting_details?.location || 'the land'}, where ${atmosphere} permeates the air. ${campaign.setting_details?.description || ''}`;
  }
  
  return `You find yourself in ${campaign.setting_details?.location || 'a mysterious place'}, where ${atmosphere} fills the air.`;
}

function generateSensoryDetails(campaign: any): string[] {
  const details = [];
  const atmosphere = campaign.atmosphere || 'mysterious';

  if (atmosphere.includes('dark') || atmosphere.includes('foreboding')) {
    details.push('A chill wind carries whispers of ancient secrets');
    details.push('Shadows seem to move with a life of their own');
  }

  if (campaign.genre === 'dark-fantasy') {
    details.push('The air is thick with an otherworldly presence');
  }

  return details;
}

function getActiveNPCs(memories: any[]): string[] {
  return memories
    ?.filter(m => m.type === 'npc' && m.metadata?.status === 'active')
    ?.map(m => m.metadata?.name)
    ?.filter(Boolean) || [];
}

function generateNPCReactions(character: any): string[] {
  const reactions = [];
  if (character?.race && character?.class) {
    reactions.push(`Locals regard the ${character.race} ${character.class} with a mix of curiosity and caution`);
  }
  return reactions;
}

function generateContextualDialogue(campaign: any, character: any): string {
  if (campaign.genre === 'dark-fantasy') {
    return `"These are dark times, traveler," a weathered villager mutters, eyeing your ${character?.class || 'adventurer'} equipment.`;
  }
  return "A nearby villager nods in greeting.";
}

function generateImmediateActions(campaign: any, character: any): string[] {
  const actions = [
    'Explore the immediate area',
    'Talk to nearby locals',
    'Check your equipment'
  ];

  if (character?.class === 'Wizard') {
    actions.push('Study the magical atmosphere');
  }

  if (campaign.genre === 'dark-fantasy') {
    actions.push('Investigate the unsettling shadows');
  }

  return actions;
}

function getKeyLocations(campaign: any): string[] {
  return campaign.thematic_elements?.keyLocations || [];
}

function generateQuestHooks(memories: any[]): string[] {
  return memories
    ?.filter(m => m.type === 'quest' && m.metadata?.status === 'available')
    ?.map(m => m.content)
    ?.filter(Boolean) || [];
}

function getAvailableActions(character: any): string[] {
  const baseActions = ['Move', 'Interact', 'Attack'];
  
  if (character?.class === 'Wizard') {
    baseActions.push('Cast Spell');
  }
  
  return baseActions;
}

function generateActionSuggestions(campaign: any, character: any): string[] {
  const suggestions = [];
  
  if (campaign.genre === 'dark-fantasy') {
    suggestions.push('Remain vigilant');
    suggestions.push('Search for clues about the darkness');
  }

  if (character?.class === 'Wizard') {
    suggestions.push('Analyze magical anomalies');
  }

  return suggestions;
}

function formatNarrativeResponse(response: DMResponse): string {
  const { environment, characters, opportunities, mechanics } = response;
  
  const narrative = [
    // Scene description
    environment.description,
    ...environment.sensoryDetails,

    // Character interactions
    characters.dialogue,
    ...characters.reactions,

    // Available opportunities
    "\nYou can:",
    ...opportunities.immediate.map(action => `- ${action}`),

    // Nearby locations
    "\nNearby:",
    ...opportunities.nearby.map(location => `- ${location}`),

    // Quest hooks if any
    opportunities.questHooks.length > 0 ? "\nRumors speak of:" : "",
    ...opportunities.questHooks.map(quest => `- ${quest}`)
  ].filter(Boolean).join('\n');

  return narrative;
}