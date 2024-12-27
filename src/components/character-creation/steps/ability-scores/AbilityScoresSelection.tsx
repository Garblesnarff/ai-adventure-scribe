import React from 'react';
import { useCharacter } from '@/contexts/CharacterContext';
import { AbilityScores } from '@/types/character';
import { usePointBuy } from '@/hooks/usePointBuy';
import AbilityScoreCard from './AbilityScoreCard';

const AbilityScoresSelection: React.FC = () => {
  const { state } = useCharacter();
  const { remainingPoints, handleScoreChange } = usePointBuy();

  const abilities: (keyof AbilityScores)[] = [
    'strength', 'dexterity', 'constitution',
    'intelligence', 'wisdom', 'charisma'
  ];

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-center mb-4">Assign Ability Scores</h2>
      <p className="text-center text-muted-foreground mb-4">
        Points Remaining: {remainingPoints}
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {abilities.map((ability) => (
          <AbilityScoreCard
            key={ability}
            ability={ability}
            score={state.character?.abilityScores[ability].score || 8}
            modifier={state.character?.abilityScores[ability].modifier || -1}
            remainingPoints={remainingPoints}
            onScoreChange={handleScoreChange}
          />
        ))}
      </div>
    </div>
  );
};

export default AbilityScoresSelection;