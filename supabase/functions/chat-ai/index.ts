import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { fetchRelevantMemories, updateMemoryImportance } from './memory-utils.ts';

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

    // Fetch relevant memories for context
    const memories = await fetchRelevantMemories(sessionId, message.context);
    console.log(`Retrieved ${memories.length} relevant memories`);

    // Call DM Agent through edge function with memories
    const agentResponse = await fetch(
      `${Deno.env.get('SUPABASE_URL')}/functions/v1/dm-agent-execute`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
        },
        body: JSON.stringify({
          task: {
            id: crypto.randomUUID(),
            description: `Process player message: ${message.text}`,
            expectedOutput: 'Engaging D&D response with context',
            context: {
              messageHistory: [message],
              memories,
              campaignId,
              characterId,
              sessionId
            }
          }
        })
      }
    );

    if (!agentResponse.ok) {
      throw new Error(`DM Agent responded with status: ${agentResponse.status}`);
    }

    const agentData = await agentResponse.json();
    
    if (!agentData || !agentData.response) {
      throw new Error('Invalid response from DM Agent');
    }

    console.log('DM Agent response:', agentData);

    // Update memory importance based on agent response
    if (memories.length > 0) {
      await updateMemoryImportance(memories, agentData.response);
    }

    const aiResponse = {
      id: crypto.randomUUID(),
      text: agentData.response,
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