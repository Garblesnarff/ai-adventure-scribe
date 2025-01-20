export interface AgentContext {
  campaignContext: CampaignContext;
  characterContext: CharacterContext;
  memories: Memory[];
  gameState?: GameState;
}

export interface CampaignContext {
  name: string;
  genre: string;
  tone?: string;
  difficulty_level?: string;
  description?: string;
  setting_details?: {
    era?: string;
    location?: string;
    atmosphere?: string;
  };
}

export interface CharacterContext {
  name: string;
  race: string;
  class: string;
  level: number;
  background?: string;
  description?: string;
  alignment?: string;
  hitPoints: {
    current: number;
    max: number;
    temporary: number;
  };
  abilityScores: {
    strength: { score: number; modifier: number };
    dexterity: { score: number; modifier: number };
    constitution: { score: number; modifier: number };
    intelligence: { score: number; modifier: number };
    wisdom: { score: number; modifier: number };
    charisma: { score: number; modifier: number };
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

export interface Memory {
  id?: string;
  session_id?: string;
  type: string;
  content: string;
  importance?: number;
  embedding?: number[];
  metadata?: Record<string, any>;
  created_at?: string;
  updated_at?: string;
  category?: string;
}

export interface GameState {
  location: {
    name: string;
    description: string;
    atmosphere: string;
    timeOfDay: string;
  };
  activeNPCs: Array<{
    id: string;
    name: string;
    description: string;
    personality: string;
    currentStatus: string;
    lastInteraction?: string;
  }>;
  playerStatus: {
    currentHealth: number;
    maxHealth: number;
    conditions: string[];
    inventory: string[];
    activeEffects: string[];
  };
  sceneStatus: {
    currentAction: string;
    availableActions: string[];
    environmentalEffects: string[];
    threatLevel: 'none' | 'low' | 'medium' | 'high';
  };
}

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