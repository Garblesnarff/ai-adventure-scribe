import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AbilityScores } from '@/types/character';

interface AbilityScoreCardProps {
  ability: keyof AbilityScores;
  score: number;
  modifier: number;
  onIncrease: () => void;
  onDecrease: () => void;
  isIncreaseDisabled: boolean;
  isDecreaseDisabled: boolean;
}

/**
 * Component for displaying and managing a single ability score
 * Includes the score value, modifier, and controls for increasing/decreasing
 */
const AbilityScoreCard: React.FC<AbilityScoreCardProps> = ({
  ability,
  score,
  modifier,
  onIncrease,
  onDecrease,
  isIncreaseDisabled,
  isDecreaseDisabled,
}) => {
  return (
    <Card className="p-4">
      <h3 className="text-xl font-semibold capitalize mb-2">{ability}</h3>
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          size="sm"
          onClick={onDecrease}
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
          onClick={onIncrease}
          disabled={isIncreaseDisabled}
        >
          +
        </Button>
      </div>
    </Card>
  );
};

export default AbilityScoreCard;