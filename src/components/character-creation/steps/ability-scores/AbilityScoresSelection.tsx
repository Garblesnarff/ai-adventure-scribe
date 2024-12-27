import React from 'react';
import { useCharacter } from '@/contexts/CharacterContext';
import { useToast } from '@/components/ui/use-toast';
import { AbilityScores } from '@/types/character';
import AbilityScoreCard from './AbilityScoreCard';

/**
 * Component for handling ability score selection in character creation
 * Implements point-buy system with racial bonuses following D&D 5E rules
 */
const AbilityScoresSelection: React.FC = () => {
  const { state, dispatch } = useCharacter();
  const { toast } = useToast();
  
  /**
   * Initialize remaining points from context or default value (27 for standard point-buy)
   * Persists between navigation to prevent point-buy exploitation
   */
  const [remainingPoints, setRemainingPoints] = React.useState(() => {
    return state.character?.remainingAbilityPoints ?? 27;
  });

  /**
   * Update context whenever remaining points change to maintain state
   */
  React.useEffect(() => {
    dispatch({
      type: 'UPDATE_CHARACTER',
      payload: { remainingAbilityPoints: remainingPoints }
    });
  }, [remainingPoints, dispatch]);

  /**
   * Cost table for point-buy system following D&D 5E rules
   * Key: ability score value
   * Value: point cost for that score
   */
  const pointCost: { [key: number]: number } = {
    8: 0, 9: 1, 10: 2, 11: 3, 12: 4, 13: 5, 14: 7, 15: 9
  };

  /**
   * Calculates the ability score modifier based on the score value
   * Following D&D 5E rules: (score - 10) / 2, rounded down
   */
  const calculateModifier = (score: number): number => {
    return Math.floor((score - 10) / 2);
  };

  /**
   * Handles increasing an ability score if points are available
   * Calculates point cost difference and updates remaining points
   */
  const handleIncreaseScore = (ability: keyof AbilityScores) => {
    const currentScore = state.character?.abilityScores[ability].score || 8;
    const pointDifference = pointCost[currentScore + 1] - pointCost[currentScore];
    
    if (currentScore < 15 && remainingPoints >= pointDifference) {
      const newScores = {
        ...state.character?.abilityScores,
        [ability]: {
          score: currentScore + 1,
          modifier: calculateModifier(currentScore + 1),
          savingThrow: state.character?.abilityScores[ability].savingThrow || false
        }
      };
      
      dispatch({
        type: 'UPDATE_CHARACTER',
        payload: { abilityScores: newScores }
      });
      
      setRemainingPoints(prev => prev - pointDifference);
    }
  };

  /**
   * Handles decreasing an ability score and refunding points
   * Calculates point cost difference and updates remaining points
   */
  const handleDecreaseScore = (ability: keyof AbilityScores) => {
    const currentScore = state.character?.abilityScores[ability].score || 8;
    if (currentScore > 8) {
      const pointRefund = pointCost[currentScore] - pointCost[currentScore - 1];
      
      const newScores = {
        ...state.character?.abilityScores,
        [ability]: {
          score: currentScore - 1,
          modifier: calculateModifier(currentScore - 1),
          savingThrow: state.character?.abilityScores[ability].savingThrow || false
        }
      };
      
      dispatch({
        type: 'UPDATE_CHARACTER',
        payload: { abilityScores: newScores }
      });
      
      setRemainingPoints(prev => prev + pointRefund);
    }
  };

  /**
   * Array of ability score keys for iteration
   */
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
            onIncrease={() => handleIncreaseScore(ability)}
            onDecrease={() => handleDecreaseScore(ability)}
            isIncreaseDisabled={
              (state.character?.abilityScores[ability].score || 8) === 15 ||
              remainingPoints < (
                pointCost[(state.character?.abilityScores[ability].score || 8) + 1] - 
                pointCost[state.character?.abilityScores[ability].score || 8]
              )
            }
            isDecreaseDisabled={state.character?.abilityScores[ability].score === 8}
          />
        ))}
      </div>
    </div>
  );
};

export default AbilityScoresSelection;