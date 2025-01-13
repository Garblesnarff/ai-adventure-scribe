import { supabase } from '@/integrations/supabase/client';
import { DMResponse, CampaignContext } from '@/types/dm';
import { Memory } from '@/components/game/memory/types';
import { CampaignContextLoader } from './campaign/CampaignContextLoader';
import { MemoryManager } from './memory/MemoryManager';
import { EnvironmentGenerator } from './response/EnvironmentGenerator';
import { CharacterInteractionGenerator } from './response/CharacterInteractionGenerator';
import { OpportunityGenerator } from './response/OpportunityGenerator';
import { MechanicsGenerator } from './response/MechanicsGenerator';
import { Character } from '@/types/character';

export class DMResponseGenerator {
  private campaignId: string;
  private sessionId: string;
  private context?: CampaignContext;
  private recentMemories: Memory[] = [];
  private character?: Character;

  private campaignLoader: CampaignContextLoader;
  private memoryManager: MemoryManager;
  private environmentGenerator: EnvironmentGenerator;
  private characterGenerator: CharacterInteractionGenerator;
  private opportunityGenerator: OpportunityGenerator;
  private mechanicsGenerator: MechanicsGenerator;

  constructor(campaignId: string, sessionId: string) {
    this.campaignId = campaignId;
    this.sessionId = sessionId;
    
    this.campaignLoader = new CampaignContextLoader();
    this.memoryManager = new MemoryManager();
    this.environmentGenerator = new EnvironmentGenerator();
    this.characterGenerator = new CharacterInteractionGenerator();
    this.opportunityGenerator = new OpportunityGenerator();
    this.mechanicsGenerator = new MechanicsGenerator();
  }

  async initialize(): Promise<void> {
    await Promise.all([
      this.loadCampaignContext(),
      this.loadRecentMemories(),
      this.loadCharacterDetails()
    ]);
  }

  private async loadCampaignContext(): Promise<void> {
    this.context = await this.campaignLoader.loadCampaignContext(this.campaignId);
  }

  private async loadRecentMemories(): Promise<void> {
    this.recentMemories = await this.memoryManager.loadRecentMemories(this.sessionId);
  }

  private async loadCharacterDetails(): Promise<void> {
    const { data: session } = await supabase
      .from('game_sessions')
      .select('character_id')
      .eq('id', this.sessionId)
      .single();

    if (session?.character_id) {
      const { data: character } = await supabase
        .from('characters')
        .select('*')
        .eq('id', session.character_id)
        .single();
      
      this.character = character || undefined;
    }
  }

  private async getWorldId(): Promise<string> {
    const { data } = await supabase
      .from('worlds')
      .select('id')
      .eq('campaign_id', this.campaignId)
      .single();
    
    return data?.id;
  }

  async generateResponse(playerMessage: string): Promise<DMResponse> {
    if (!this.context || !this.character) {
      await this.initialize();
    }

    if (!this.context || !this.character) {
      throw new Error('Failed to initialize context or character details');
    }

    const worldId = await this.getWorldId();

    const [environment, characters, opportunities, mechanics] = await Promise.all([
      this.environmentGenerator.generateEnvironment(this.context, this.character),
      this.characterGenerator.generateInteractions(worldId, this.character),
      this.opportunityGenerator.generateOpportunities(this.campaignId, this.context),
      this.mechanicsGenerator.generateMechanics(this.context)
    ]);

    return {
      environment,
      characters,
      mechanics,
      opportunities
    };
  }
}