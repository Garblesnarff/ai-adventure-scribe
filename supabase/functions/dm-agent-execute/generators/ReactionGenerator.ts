import { Character } from './types';

export class ReactionGenerator {
  generateNPCReactions(character: Character, npcPersonality?: string): string[] {
    const baseReactions = [
      'watches curiously',
      'nods in acknowledgment'
    ];

    if (npcPersonality === 'friendly') {
      baseReactions.push('smiles warmly');
    }

    return baseReactions;
  }
}