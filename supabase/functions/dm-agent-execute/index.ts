import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { GoogleGenerativeAI } from "https://esm.sh/@google/generative-ai@0.1.3";
import { ChatMessage, AgentContext, TaskExecutionResponse } from './types.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const genAI = new GoogleGenerativeAI(Deno.env.get('GEMINI_API_KEY') || '');
const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const supabase = createClient(supabaseUrl, supabaseKey);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const calculateModifier = (score: number): number => Math.floor((score - 10) / 2);

const describeAbilityScore = (ability: string, score: number): string => {
  if (score >= 18) return `exceptionally skilled`;
  if (score >= 16) return `very capable`;
  if (score >= 14) return `above average`;
  if (score >= 12) return `slightly above average`;
  if (score >= 10) return `average`;
  if (score >= 8) return `slightly below average`;
  return `struggles with ${ability}-based tasks`;
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { task, agentContext } = await req.json();
    const campaignDetails = agentContext.campaignDetails;
    const characterId = agentContext.characterDetails?.id;
    const memories = agentContext.memories || [];

    console.log('Fetching character details for:', characterId);

    // Fetch complete character data
    const { data: characterData, error: characterError } = await supabase
      .from('characters')
      .select(`
        *,
        character_stats!inner(*),
        character_equipment(*)
      `)
      .eq('id', characterId)
      .single();

    if (characterError) {
      console.error('Error fetching character data:', characterError);
      throw characterError;
    }

    // Structure character context
    const characterContext = {
      name: characterData.name,
      race: characterData.race,
      class: characterData.class,
      level: characterData.level,
      background: characterData.background,
      description: characterData.description,
      alignment: characterData.alignment,
      
      hitPoints: {
        current: characterData.character_stats.current_hit_points,
        max: characterData.character_stats.max_hit_points,
        temporary: characterData.character_stats.temporary_hit_points
      },
      
      abilityScores: {
        strength: { 
          score: characterData.character_stats.strength,
          modifier: calculateModifier(characterData.character_stats.strength)
        },
        dexterity: { 
          score: characterData.character_stats.dexterity,
          modifier: calculateModifier(characterData.character_stats.dexterity)
        },
        constitution: { 
          score: characterData.character_stats.constitution,
          modifier: calculateModifier(characterData.character_stats.constitution)
        },
        intelligence: { 
          score: characterData.character_stats.intelligence,
          modifier: calculateModifier(characterData.character_stats.intelligence)
        },
        wisdom: { 
          score: characterData.character_stats.wisdom,
          modifier: calculateModifier(characterData.character_stats.wisdom)
        },
        charisma: { 
          score: characterData.character_stats.charisma,
          modifier: calculateModifier(characterData.character_stats.charisma)
        }
      },
      
      armorClass: characterData.character_stats.armor_class,
      initiative: characterData.character_stats.initiative_bonus,
      speed: characterData.character_stats.speed,
      
      equipment: characterData.character_equipment.map((item: any) => ({
        name: item.item_name,
        type: item.item_type,
        equipped: item.equipped,
        quantity: item.quantity
      }))
    };

    // Format memories context
    const recentMemories = memories
      .sort((a: any, b: any) => b.importance - a.importance)
      .slice(0, 5)
      .map((m: any) => `- ${m.content} (Type: ${m.type}, Importance: ${m.importance})`)
      .join('\n');

    // Enhanced prompt structure with character context
    const prompt = `
      You are an expert Dungeon Master guiding ${characterContext.name}, 
      a level ${characterContext.level} ${characterContext.race} ${characterContext.class}.

      CHARACTER DETAILS:
      Background: ${characterContext.background}
      Alignment: ${characterContext.alignment}
      Description: ${characterContext.description || 'No specific description provided'}

      ABILITIES:
      - Strength (${characterContext.abilityScores.strength.score}): ${describeAbilityScore('strength', characterContext.abilityScores.strength.score)}
      - Dexterity (${characterContext.abilityScores.dexterity.score}): ${describeAbilityScore('dexterity', characterContext.abilityScores.dexterity.score)}
      - Constitution (${characterContext.abilityScores.constitution.score}): ${describeAbilityScore('constitution', characterContext.abilityScores.constitution.score)}
      - Intelligence (${characterContext.abilityScores.intelligence.score}): ${describeAbilityScore('intelligence', characterContext.abilityScores.intelligence.score)}
      - Wisdom (${characterContext.abilityScores.wisdom.score}): ${describeAbilityScore('wisdom', characterContext.abilityScores.wisdom.score)}
      - Charisma (${characterContext.abilityScores.charisma.score}): ${describeAbilityScore('charisma', characterContext.abilityScores.charisma.score)}

      COMBAT STATUS:
      HP: ${characterContext.hitPoints.current}/${characterContext.hitPoints.max} (${characterContext.hitPoints.temporary || 0} temporary)
      AC: ${characterContext.armorClass}
      Initiative: ${characterContext.initiative}
      Speed: ${characterContext.speed}ft

      EQUIPMENT:
      ${characterContext.equipment.map(item => `- ${item.name} (${item.equipped ? 'equipped' : 'carried'})`).join('\n')}

      CAMPAIGN CONTEXT:
      ${campaignDetails ? `
      Campaign Setting:
      Name: ${campaignDetails.name}
      Genre: ${campaignDetails.genre || 'Standard Fantasy'}
      Tone: ${campaignDetails.tone || 'Balanced'}
      Difficulty: ${campaignDetails.difficulty_level || 'Medium'}
      Description: ${campaignDetails.description || 'A classic D&D adventure'}
      Campaign Length: ${campaignDetails.campaign_length || 'Standard'}
      Setting Details: ${JSON.stringify(campaignDetails.setting_details || {})}
      ` : ''}

      RECENT MEMORIES AND EVENTS:
      ${recentMemories}

      RESPONSE GUIDELINES:
      1. Structure:
         - Begin with an immediate reaction or acknowledgment of player action
         - Provide rich environmental descriptions that consider the character's perceptive abilities
         - Include NPC reactions that account for the character's presence and abilities
         - End with clear hooks for player interaction

      2. Character Integration:
         - Reference their specific abilities when relevant
         - Consider their equipment in scene descriptions
         - Account for their background in social interactions
         - Reflect their current health status in action descriptions
         - Use their movement speed for spatial descriptions

      3. Tone and Style:
         - Match the campaign's genre and tone
         - Use descriptive language that engages all senses
         - Balance narrative depth with accessibility
         - Maintain consistent voice and atmosphere

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

    console.log('Executing DM task with enhanced prompt');

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