import { supabase } from '@/integrations/supabase/client';
import { DMResponse, CampaignContext } from '@/types/dm';
import { Memory, isValidMemoryType } from '@/components/game/memory/types';

interface ThematicElements {
  mainThemes: string[];
  recurringMotifs: string[];
  keyLocations: string[];
  importantNPCs: string[];
}

export class DMResponseGenerator {
  private campaignId: string;
  private sessionId: string;
  private context?: CampaignContext;
  private recentMemories: Memory[] = [];

  constructor(campaignId: string, sessionId: string) {
    this.campaignId = campaignId;
    this.sessionId = sessionId;
  }

  async initialize(): Promise<void> {
    await Promise.all([
      this.loadCampaignContext(),
      this.loadRecentMemories()
    ]);
  }

  private async loadCampaignContext(): Promise<void> {
    const { data: campaign, error } = await supabase
      .from('campaigns')
      .select(`
        genre,
        tone,
        era,
        location,
        atmosphere,
        thematic_elements
      `)
      .eq('id', this.campaignId)
      .single();

    if (error) throw error;

    // Parse and validate thematic elements
    let thematicElements: ThematicElements;
    
    try {
      const rawElements = campaign.thematic_elements as Record<string, unknown>;
      thematicElements = {
        mainThemes: Array.isArray(rawElements?.mainThemes) ? rawElements.mainThemes : [],
        recurringMotifs: Array.isArray(rawElements?.recurringMotifs) ? rawElements.recurringMotifs : [],
        keyLocations: Array.isArray(rawElements?.keyLocations) ? rawElements.keyLocations : [],
        importantNPCs: Array.isArray(rawElements?.importantNPCs) ? rawElements.importantNPCs : []
      };
    } catch (e) {
      // Fallback to default empty arrays if parsing fails
      thematicElements = {
        mainThemes: [],
        recurringMotifs: [],
        keyLocations: [],
        importantNPCs: []
      };
    }

    this.context = {
      genre: campaign.genre || 'fantasy',
      tone: campaign.tone || 'serious',
      setting: {
        era: campaign.era || 'medieval',
        location: campaign.location || 'unknown',
        atmosphere: campaign.atmosphere || 'mysterious'
      },
      thematicElements
    };
  }

  private async loadRecentMemories(): Promise<void> {
    const { data: memories, error } = await supabase
      .from('memories')
      .select('*')
      .eq('session_id', this.sessionId)
      .order('created_at', { ascending: false })
      .limit(5);

    if (error) throw error;
    
    // Transform and validate memories
    this.recentMemories = (memories || []).map(memory => ({
      id: memory.id,
      type: isValidMemoryType(memory.type) ? memory.type : 'general',
      content: memory.content,
      importance: memory.importance || 0,
      embedding: memory.embedding,
      metadata: memory.metadata || {},
      created_at: memory.created_at,
      session_id: memory.session_id,
      updated_at: memory.updated_at
    }));
  }

  private generateEnvironmentDescription(): DMResponse['environment'] {
    const { setting, thematicElements } = this.context!;
    
    return {
      description: `You find yourself in ${setting.location}, a place where ${setting.atmosphere} permeates the air.`,
      atmosphere: setting.atmosphere,
      sensoryDetails: this.generateSensoryDetails()
    };
  }

  private generateSensoryDetails(): string[] {
    const { setting } = this.context!;
    // Generate appropriate sensory details based on setting and atmosphere
    const details = [];
    
    if (setting.atmosphere.includes('mysterious')) {
      details.push('Strange whispers echo in the distance');
    }
    if (setting.atmosphere.includes('peaceful')) {
      details.push('A gentle breeze carries the scent of wildflowers');
    }
    // Add more atmospheric details based on context
    
    return details;
  }

  private async generateCharacterInteractions(): Promise<DMResponse['characters']> {
    const { data: npcs } = await supabase
      .from('npcs')
      .select('name, personality')
      .eq('world_id', (await this.getWorldId()));

    return {
      activeNPCs: npcs?.map(npc => npc.name) || [],
      reactions: this.generateNPCReactions(npcs),
      dialogue: this.generateNPCDialogue(npcs)
    };
  }

  private async getWorldId(): Promise<string> {
    const { data } = await supabase
      .from('worlds')
      .select('id')
      .eq('campaign_id', this.campaignId)
      .single();
    
    return data?.id;
  }

  private generateNPCReactions(npcs: any[]): string[] {
    return npcs?.map(npc => `${npc.name} ${this.getReactionBasedOnPersonality(npc.personality)}`) || [];
  }

  private getReactionBasedOnPersonality(personality: string): string {
    // Generate appropriate reaction based on NPC personality
    if (personality?.includes('friendly')) {
      return 'greets you warmly';
    }
    if (personality?.includes('suspicious')) {
      return 'eyes you warily';
    }
    return 'acknowledges your presence';
  }

  private generateNPCDialogue(npcs: any[]): string {
    const { tone } = this.context!;
    const npc = npcs?.[0];
    
    if (!npc) return '';
    
    // Generate dialogue based on tone and NPC personality
    if (tone === 'serious') {
      return `"Welcome, traveler," ${npc.name} says solemnly.`;
    }
    if (tone === 'humorous') {
      return `"Well, well! Look who's here!" ${npc.name} chuckles.`;
    }
    
    return `"Greetings," ${npc.name} says.`;
  }

  private async generateOpportunities(): Promise<DMResponse['opportunities']> {
    const { data: quests } = await supabase
      .from('quests')
      .select('*')
      .eq('campaign_id', this.campaignId)
      .eq('status', 'available');

    return {
      immediate: this.generateImmediateActions(),
      nearby: this.generateNearbyLocations(),
      questHooks: quests?.map(quest => quest.title) || []
    };
  }

  private generateImmediateActions(): string[] {
    const { setting } = this.context!;
    const actions = ['Look around', 'Talk to nearby NPCs'];
    
    if (setting.atmosphere.includes('dangerous')) {
      actions.push('Ready your weapon');
    }
    if (setting.atmosphere.includes('mysterious')) {
      actions.push('Investigate the surroundings');
    }
    
    return actions;
  }

  private generateNearbyLocations(): string[] {
    return this.context!.thematicElements.keyLocations.slice(0, 3);
  }

  private async generateMechanics(): Promise<DMResponse['mechanics']> {
    return {
      availableActions: ['Move', 'Interact', 'Attack', 'Cast Spell'],
      relevantRules: await this.getRulesForContext(),
      suggestions: this.generateActionSuggestions()
    };
  }

  private async getRulesForContext(): Promise<string[]> {
    const { data: rules } = await supabase
      .from('rule_validations')
      .select('rule_description')
      .eq('is_active', true)
      .limit(3);

    return rules?.map(rule => rule.rule_description) || [];
  }

  private generateActionSuggestions(): string[] {
    const { tone, genre } = this.context!;
    const suggestions = [];

    if (genre === 'mystery') {
      suggestions.push('Search for clues');
    }
    if (tone === 'humorous') {
      suggestions.push('Try telling a joke');
    }

    return suggestions;
  }

  async generateResponse(playerMessage: string): Promise<DMResponse> {
    if (!this.context) {
      await this.initialize();
    }

    const [environment, characters, opportunities, mechanics] = await Promise.all([
      this.generateEnvironmentDescription(),
      this.generateCharacterInteractions(),
      this.generateOpportunities(),
      this.generateMechanics()
    ]);

    return {
      environment,
      characters,
      mechanics,
      opportunities
    };
  }
}