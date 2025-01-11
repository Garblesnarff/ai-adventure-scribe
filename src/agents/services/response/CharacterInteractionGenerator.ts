import { supabase } from '@/integrations/supabase/client';

export class CharacterInteractionGenerator {
  async generateInteractions(worldId: string) {
    const { data: npcs } = await supabase
      .from('npcs')
      .select('name, personality')
      .eq('world_id', worldId);

    return {
      activeNPCs: npcs?.map(npc => npc.name) || [],
      reactions: this.generateNPCReactions(npcs),
      dialogue: this.generateNPCDialogue(npcs)
    };
  }

  private generateNPCReactions(npcs: any[]): string[] {
    return npcs?.map(npc => `${npc.name} ${this.getReactionBasedOnPersonality(npc.personality)}`) || [];
  }

  private getReactionBasedOnPersonality(personality: string): string {
    if (personality?.includes('friendly')) {
      return 'greets you warmly';
    }
    if (personality?.includes('suspicious')) {
      return 'eyes you warily';
    }
    return 'acknowledges your presence';
  }

  private generateNPCDialogue(npcs: any[]): string {
    const npc = npcs?.[0];
    if (!npc) return '';
    
    return `"Greetings," ${npc.name} says.`;
  }
}