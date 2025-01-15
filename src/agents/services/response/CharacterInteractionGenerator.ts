import { Character } from '@/types/character';
import { supabase } from '@/integrations/supabase/client';

interface ConversationState {
  currentNPC: string | null;
  dialogueHistory: Array<{ speaker: string; text: string }>;
  playerChoices: string[];
  lastResponse: string | null;
}

export class CharacterInteractionGenerator {
  async generateInteractions(
    worldId: string, 
    character: Character,
    conversationState?: ConversationState
  ) {
    // If we're in an active conversation, generate contextual dialogue
    if (conversationState?.currentNPC) {
      return this.generateActiveConversation(worldId, character, conversationState);
    }

    // Otherwise, generate initial NPC reactions
    return this.generateInitialInteractions(worldId, character);
  }

  private async generateActiveConversation(
    worldId: string,
    character: Character,
    conversationState: ConversationState
  ) {
    // Fetch NPC details from database
    const { data: npcData } = await supabase
      .from('npcs')
      .select('*')
      .eq('world_id', worldId)
      .eq('name', conversationState.currentNPC)
      .single();

    // Generate contextual dialogue based on conversation history
    const lastPlayerMessage = conversationState.dialogueHistory[conversationState.dialogueHistory.length - 1];
    const npcPersonality = npcData?.personality || 'neutral';
    
    let dialogue = this.generateContextualDialogue(
      lastPlayerMessage?.text || '',
      npcPersonality,
      character,
      conversationState.dialogueHistory
    );

    return {
      activeNPCs: [conversationState.currentNPC],
      reactions: this.generateNPCReactions(character, npcPersonality),
      dialogue
    };
  }

  private async generateInitialInteractions(worldId: string, character: Character) {
    // Fetch available NPCs in the area
    const { data: npcs } = await supabase
      .from('npcs')
      .select('name, personality, race')
      .eq('world_id', worldId)
      .limit(3);

    const reactions = this.generateNPCReactions(character);
    const dialogue = this.generateInitialDialogue(character, npcs?.[0]?.personality);

    return {
      activeNPCs: npcs?.map(npc => npc.name) || [],
      reactions,
      dialogue
    };
  }

  private generateContextualDialogue(
    lastPlayerMessage: string,
    npcPersonality: string,
    character: Character,
    history: Array<{ speaker: string; text: string }>
  ): string {
    // Generate response based on conversation context
    const responseOptions = [
      `"Interesting perspective, ${character.name}. Tell me more about your adventures."`,
      `"I've never met a ${character.race} ${character.class} before. Your presence here is... intriguing."`,
      `"These are dangerous times. Someone with your abilities could be quite useful..."`,
      `"Perhaps you'd be interested in helping us with a certain... situation?"`,
    ];

    return responseOptions[Math.floor(Math.random() * responseOptions.length)];
  }

  private generateNPCReactions(character: Character, personality: string = 'neutral'): string[] {
    const reactions = [];
    
    // Race-based reactions
    if (character.race.toLowerCase() === 'dragonborn') {
      reactions.push('watches with barely concealed awe at your draconic presence');
    }
    
    // Class-based reactions
    if (character.class.toLowerCase() === 'wizard') {
      reactions.push('eyes your arcane implements with a mixture of respect and caution');
    }

    // Personality-based reactions
    switch (personality.toLowerCase()) {
      case 'friendly':
        reactions.push('smiles warmly and gestures welcomingly');
        break;
      case 'suspicious':
        reactions.push('keeps a careful distance while studying you');
        break;
      case 'mysterious':
        reactions.push('regards you with an enigmatic expression');
        break;
      default:
        reactions.push('regards you with curiosity');
    }

    return reactions;
  }

  private generateInitialDialogue(character: Character, npcPersonality: string = 'neutral'): string {
    const dialogueOptions = [
      `"We don't see many ${character.race}s in these parts," a local remarks with interest.`,
      `"A wielder of the arcane arts? These are... interesting times," a merchant muses quietly.`,
      `"Welcome to our humble village," the guard says, though their eyes betray a mix of wonder and unease.`,
      `"Perhaps you're here about the... recent troubles?" an elderly villager asks cryptically.`
    ];

    return dialogueOptions[Math.floor(Math.random() * dialogueOptions.length)];
  }
}
