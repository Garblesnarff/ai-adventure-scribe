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
    const reactions = [];
    
    if (String(character.race).toLowerCase() === 'dragonborn') {
      reactions.push('watches with barely concealed awe at your draconic presence');
    }
    
    if (String(character.class).toLowerCase() === 'wizard') {
      reactions.push('eyes your arcane implements with a mixture of respect and caution');
    }

    return reactions.length ? reactions : ['regards you with curiosity'];
  }

  private generateNPCDialogue(npcs: any[], character: Character): string {
    const dialogueOptions = [
      `"We don't see many ${String(character.race)}s in these parts," ${npcs?.[0]?.name || 'a villager'} remarks.`,
      `"A wielder of the arcane arts? These are... interesting times," ${npcs?.[0]?.name || 'a merchant'} muses quietly.`,
      `"Welcome to our humble village," ${npcs?.[0]?.name || 'the guard'} says, though their eyes betray a mix of wonder and unease.`
    ];

    return dialogueOptions[Math.floor(Math.random() * dialogueOptions.length)];
  }
}