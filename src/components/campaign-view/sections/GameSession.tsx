import React from 'react';
import { GameInterface } from '@/components/GameInterface';
import { Button } from '@/components/ui/button';
import { useSearchParams } from 'react-router-dom';

interface GameSessionProps {
  campaignId: string;
}

/**
 * GameSession component handles the game interface and session management
 */
export const GameSession: React.FC<GameSessionProps> = ({ campaignId }) => {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session');

  if (!sessionId) {
    return (
      <div className="text-center py-8">
        <h2 className="text-xl font-semibold mb-4">No Active Session</h2>
        <p className="text-muted-foreground mb-4">
          Select a character to start playing this campaign
        </p>
        <Button
          onClick={() => window.location.href = '/characters'}
          className="mx-auto"
        >
          Choose Character
        </Button>
      </div>
    );
  }

  return <GameInterface />;
};