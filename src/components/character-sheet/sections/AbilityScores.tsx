import React from 'react';
import { Card } from '@/components/ui/card';
import { Shield } from 'lucide-react';
import { Character } from '@/types/character';

interface AbilityScoresProps {
  character: Character;
}

/**
 * AbilityScores component displays all ability scores and their modifiers
 * @param character - The character data to display
 */
const AbilityScores = ({ character }: AbilityScoresProps) => {
  return (
    <Card className="p-4">
      <div className="flex items-center gap-2 mb-4">
        <Shield className="w-5 h-5" />
        <h2 className="text-xl font-semibold">Ability Scores</h2>
      </div>
      <div className="grid grid-cols-2 gap-4">
        {Object.entries(character.abilityScores).map(([ability, data]) => (
          <div key={ability}>
            <p className="font-medium capitalize">{ability}</p>
            <p>Score: {data.score} (Modifier: {data.modifier >= 0 ? '+' : ''}{data.modifier})</p>
          </div>
        ))}
      </div>
    </Card>
  );
};

export default AbilityScores;