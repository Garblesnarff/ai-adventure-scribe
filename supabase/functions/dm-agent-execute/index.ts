import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { DMResponse } from './types.ts';

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
    const { narrativeResponse } = agentContext;

    // Format the narrative response into natural language
    const formattedResponse = formatNarrativeResponse(narrativeResponse as DMResponse);

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
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

function formatNarrativeResponse(response: DMResponse): string {
  if (!response) return "The Dungeon Master ponders for a moment...";

  const { environment, characters, opportunities, mechanics } = response;

  // Build the narrative response
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