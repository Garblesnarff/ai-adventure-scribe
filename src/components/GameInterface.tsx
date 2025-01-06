import React from 'react';
import { useGameSession } from '@/hooks/useGameSession';
import { MessageProvider } from '@/contexts/MessageContext';
import { MemoryProvider } from '@/contexts/MemoryContext';
import GameContent from './game/GameContent';

/**
 * GameInterface Component
 * Main component for handling game interactions and message flow
 * Manages the chat interface and message persistence
 */
export const GameInterface: React.FC = () => {
  const { sessionId } = useGameSession();

  return (
    <div className="min-h-screen bg-[url('/parchment-bg.png')] bg-cover p-4">
      <MessageProvider sessionId={sessionId}>
        <MemoryProvider sessionId={sessionId}>
          <GameContent />
        </MemoryProvider>
      </MessageProvider>
    </div>
  );
};