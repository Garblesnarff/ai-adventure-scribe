export interface EnhancedMemory {
  id: string;
  type: 'dialogue' | 'description' | 'action' | 'scene_state';
  content: string;
  timestamp: string;
  importance: number;
  category: 'npc' | 'location' | 'player_action' | 'environment' | 'general';
  context: {
    location?: string;
    npcs?: string[];
    playerAction?: string;
    sceneState?: SceneState;
  };
  metadata: Record<string, any>;
}

export interface SceneState {
  currentLocation: string;
  activeNPCs: Array<{
    id: string;
    name: string;
    status: 'present' | 'departed' | 'inactive';
    lastInteraction?: string;
  }>;
  environmentDetails: {
    atmosphere: string;
    timeOfDay: string;
    sensoryDetails: string[];
  };
  playerState: {
    lastAction: string;
    currentInteraction?: string;
  };
}

export interface MemoryQueryOptions {
  category?: string;
  timeframe?: 'recent' | 'all';
  contextMatch?: {
    location?: string;
    npc?: string;
    action?: string;
  };
  limit?: number;
}