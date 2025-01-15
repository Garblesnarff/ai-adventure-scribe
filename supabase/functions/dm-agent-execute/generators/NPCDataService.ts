import { NPCData } from './types';

export class NPCDataService {
  async fetchNPCData(worldId: string, npcId: string): Promise<NPCData | null> {
    // TODO: Implement actual database fetch
    return {
      name: 'Generic NPC',
      personality: 'neutral',
      background: 'A local resident'
    };
  }

  async fetchAvailableNPCs(worldId: string): Promise<NPCData[]> {
    // TODO: Implement actual database fetch
    return [{
      name: 'Generic NPC',
      personality: 'neutral'
    }];
  }
}