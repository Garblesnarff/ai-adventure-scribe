import { useState, useEffect } from 'react';
import { AbilityScores } from '@/types/character';
import { useCharacter } from '@/contexts/CharacterContext';
import { calculateModifier, getPointCostDifference } from '@/utils/abilityScoreUtils';

export const usePointBuy = () => {
  const { state, dispatch } = useCharacter();
  const [remainingPoints, setRemainingPoints] = useState(() => {
    return state.character?.remainingAbilityPoints ?? 27;
  });

  useEffect(() => {
    dispatch({
      type: 'UPDATE_CHARACTER',
      payload: { remainingAbilityPoints: remainingPoints }
    });
  }, [remainingPoints, dispatch]);

  const handleScoreChange = (
    ability: keyof AbilityScores,
    increase: boolean
  ) => {
    const currentScore = state.character?.abilityScores[ability].score || 8;
    const targetScore = increase ? currentScore + 1 : currentScore - 1;

    if ((increase && targetScore > 15) || (!increase && targetScore < 8)) {
      return;
    }

    const pointDifference = getPointCostDifference(
      increase ? currentScore : targetScore,
      increase ? targetScore : currentScore
    );

    if (increase && remainingPoints < pointDifference) {
      return;
    }

    const newScores = {
      ...state.character?.abilityScores,
      [ability]: {
        score: targetScore,
        modifier: calculateModifier(targetScore),
        savingThrow: state.character?.abilityScores[ability].savingThrow || false
      }
    };

    dispatch({
      type: 'UPDATE_CHARACTER',
      payload: { abilityScores: newScores }
    });

    setRemainingPoints(prev => prev + (increase ? -pointDifference : pointDifference));
  };

  return {
    remainingPoints,
    handleScoreChange
  };
};