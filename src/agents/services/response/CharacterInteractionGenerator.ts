import { supabase } from '@/integrations/supabase/client';
import { Character } from '@/types/character';

export class CharacterInteractionGenerator {
  async generateInteractions(worldId: string, character: Character) {
    const { data: npcs } = await supabase
      .from('npcs')
      .select('name, personality, race')
      .eq('world_id', worldId);

    return {
      activeNPCs: npcs?.map(npc => npc.name) || [],
      reactions: this.generateNPCReactions(npcs, character),
      dialogue: this.generateNPCDialogue(npcs, character)
    };
  }

  private generateNPCReactions(npcs: any[], character: Character): string[] {
    return npcs?.map(npc => {
      const reaction = this.getReactionBasedOnContext(npc, character);
      return `${npc.name} ${reaction}`;
    }) || [];
  }

  private getReactionBasedOnContext(npc: any, character: Character): string {
    const reactions = [];
    
    // Race-based reactions
    if (character.race === 'Dragonborn') {
      reactions.push('watches with barely concealed awe at your draconic presence');
    }
    
    // Class-based reactions
    if (character.class === 'Wizard') {
      reactions.push('eyes your arcane implements with a mixture of respect and caution');
    }

    // Personality-based reactions
    if (npc.personality?.includes('friendly')) {
      reactions.push('offers a warm, if somewhat nervous, greeting');
    } else if (npc.personality?.includes('suspicious')) {
      reactions.push('whispers hurriedly to nearby companions while casting furtive glances your way');
    }

    // Return a random reaction if multiple are applicable
    return reactions[Math.floor(Math.random() * reactions.length)] || 'acknowledges your presence';
  }

  private generateNPCDialogue(npcs: any[], character: Character): string {
    const npc = npcs?.[0];
    if (!npc) return '';
    
    const dialogueOptions = [
      `"We don't see many ${character.race}s in these parts," ${npc.name} remarks, trying to mask their curiosity.`,
      `"A wielder of the arcane arts? These are... interesting times," ${npc.name} muses quietly.`,
      `"Welcome to our humble village," ${npc.name} says, though their eyes betray a mix of wonder and unease.`
    ];

    return dialogueOptions[Math.floor(Math.random() * dialogueOptions.length)];
  }
}