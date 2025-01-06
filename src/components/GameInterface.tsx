import React from 'react';
import { MessageProvider } from '@/contexts/MessageContext';
import { MemoryProvider } from '@/contexts/MemoryContext';
import GameContent from './game/GameContent';

interface GameInterfaceProps {
  sessionId: string | null;
}

/**
 * GameInterface Component
 * Provides context providers and renders the main game content
 */
export const GameInterface: React.FC<GameInterfaceProps> = ({ sessionId }) => {
  if (!sessionId) {
    return null;
  }

  return (
    <MessageProvider sessionId={sessionId}>
      <MemoryProvider sessionId={sessionId}>
        <GameContent />
      </MemoryProvider>
    </MessageProvider>
  );
};