export interface CampaignContext {
  name: string;
  genre: string;
  difficulty_level: string;
  tone: string;
  setting_details?: {
    era?: string;
    location?: string;
    atmosphere?: string;
    key_locations?: string[];
    npcs?: string[];
    objectives?: string[];
    thematic_elements?: string[];
    motifs?: string[];
  };
  description?: string;
}

export interface CharacterContext {
  name: string;
  race: string;
  class: string;
  level: number;
  background: string;
  description?: string;
  alignment: string;
  hitPoints: {
    current: number;
    max: number;
    temporary: number;
  };
  abilityScores: {
    [key: string]: {
      score: number;
      modifier: number;
    };
  };
  armorClass: number;
  initiative: number;
  speed: number;
  equipment: Array<{
    name: string;
    type: string;
    equipped: boolean;
    quantity: number;
  }>;
}

export interface AgentContext {
  campaignContext: CampaignContext;
  characterContext: CharacterContext;
  memories: any[];
}