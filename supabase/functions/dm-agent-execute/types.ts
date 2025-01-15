export interface DMResponse {
  environment: {
    description: string;
    atmosphere: string;
    sensoryDetails: string[];
  };
  characters: {
    activeNPCs: string[];
    reactions: string[];
    dialogue: string;
  };
  opportunities: {
    immediate: string[];
    nearby: string[];
    questHooks: string[];
  };
  mechanics: {
    availableActions: string[];
    relevantRules: string[];
    suggestions: string[];
  };
}

export interface CharacterContext {
  id: string;
  name: string;
  race: string;
  class: string;
  level: number;
  background?: string;
  description?: string;
}

export interface CampaignContext {
  name: string;
  genre: string;
  setting: {
    era?: string;
    location?: string;
    atmosphere?: string;
  };
  description?: string;
}

export interface AgentContext {
  campaignContext: CampaignContext;
  characterContext: CharacterContext;
  memories: any[];
}