import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AbilityScores } from '@/types/character';
import { POINT_BUY_COSTS } from '@/utils/abilityScoreUtils';

interface AbilityScoreCardProps {
  ability: keyof AbilityScores;
  score: number;
  modifier: number;
  remainingPoints: number;
  onScoreChange: (ability: keyof AbilityScores, increase: boolean) => void;
}

const AbilityScoreCard: React.FC<AbilityScoreCardProps> = ({
  ability,
  score,
  modifier,
  remainingPoints,
  onScoreChange,
}) => {
  const isIncreaseDisabled = score === 15 || 
    remainingPoints < (POINT_BUY_COSTS[score + 1] - POINT_BUY_COSTS[score]);
  const isDecreaseDisabled = score === 8;

  return (
    <Card className="p-4">
      <h3 className="text-xl font-semibold capitalize mb-2">{ability}</h3>
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onScoreChange(ability, false)}
          disabled={isDecreaseDisabled}
        >
          -
        </Button>
        <span className="text-2xl font-bold">
          {score}
          <span className="text-sm ml-2 text-muted-foreground">
            ({modifier >= 0 ? '+' : ''}{modifier})
          </span>
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onScoreChange(ability, true)}
          disabled={isIncreaseDisabled}
        >
          +
        </Button>
      </div>
    </Card>
  );
};

export default AbilityScoreCard;