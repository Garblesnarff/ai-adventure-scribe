import { Character, NPCData, InteractionResponse } from './types';
import { DialogueGenerator } from './DialogueGenerator';
import { ReactionGenerator } from './ReactionGenerator';
import { NPCDataService } from './NPCDataService';

interface ConversationState {
  currentNPC: string | null;
  dialogueHistory: Array<{ speaker: string; text: string }>;
  playerChoices: string[];
  lastResponse: string | null;
}

export class CharacterInteractionGenerator {
  private dialogueGenerator: DialogueGenerator;
  private reactionGenerator: ReactionGenerator;
  private npcDataService: NPCDataService;

  constructor() {
    this.dialogueGenerator = new DialogueGenerator();
    this.reactionGenerator = new ReactionGenerator();
    this.npcDataService = new NPCDataService();
  }

  async generateInteractions(
    worldId: string, 
    character: Character,
    conversationState?: ConversationState
  ): Promise<InteractionResponse> {
    // If we're in an active conversation, generate contextual dialogue
    if (conversationState?.currentNPC) {
      return this.generateActiveConversation(worldId, character, conversationState);
    }

    // Otherwise, generate initial NPC reactions
    return this.generateInitialInteractions(worldId, character);
  }

  private async generateActiveConversation(
    worldId: string,
    character: Character,
    conversationState: ConversationState
  ): Promise<InteractionResponse> {
    const npcData = await this.npcDataService.fetchNPCData(worldId, conversationState.currentNPC);
    const lastPlayerMessage = conversationState.dialogueHistory[conversationState.dialogueHistory.length - 1];
    
    const dialogue = this.dialogueGenerator.generateContextualDialogue(
      lastPlayerMessage?.text || '',
      npcData?.personality || 'neutral',
      character,
      conversationState.dialogueHistory
    );

    return {
      activeNPCs: [conversationState.currentNPC],
      reactions: this.reactionGenerator.generateNPCReactions(character, npcData?.personality),
      dialogue
    };
  }

  private async generateInitialInteractions(
    worldId: string, 
    character: Character
  ): Promise<InteractionResponse> {
    const npcs = await this.npcDataService.fetchAvailableNPCs(worldId);
    const reactions = this.reactionGenerator.generateNPCReactions(character);
    const dialogue = this.dialogueGenerator.generateInitialDialogue(character);

    return {
      activeNPCs: npcs?.map(npc => npc.name) || [],
      reactions,
      dialogue
    };
  }
}
