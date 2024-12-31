import React from 'react';
import { Card } from '../ui/card';
import { useToast } from '@/hooks/use-toast';
import { ChatMessage } from '@/types/game';
import { useMessageContext } from '@/contexts/MessageContext';
import { useMemoryContext } from '@/contexts/MemoryContext';
import { MessageList } from './MessageList';
import { ChatInput } from './ChatInput';
import { VoiceHandler } from './VoiceHandler';
import { MemoryPanel } from './MemoryPanel';
import { useGameSession } from '@/hooks/useGameSession';
import { MemoryTester } from './memory/MemoryTester';
import { DungeonMasterAgent } from '@/agents/DungeonMasterAgent';

/**
 * GameContent Component
 * Handles the main game interaction logic and UI
 */
const GameContent: React.FC = () => {
  const { messages, sendMessage, queueStatus } = useMessageContext();
  const { extractMemories } = useMemoryContext();
  const { sessionId, campaignId } = useGameSession();
  const { toast } = useToast();
  const dmAgent = new DungeonMasterAgent();

  /**
   * Handle sending a new message
   * Processes player input and generates appropriate responses
   * @param playerInput - The message text from the player
   */
  const handleSendMessage = async (playerInput: string) => {
    if (queueStatus === 'processing') return;

    try {
      // Validate session and campaign
      if (!sessionId || !campaignId) {
        console.error('Missing session or campaign:', { sessionId, campaignId });
        throw new Error('No active session or campaign found');
      }

      console.log('Processing message with context:', {
        sessionId,
        campaignId,
        messageCount: messages.length
      });

      // Add player message
      const playerMessage: ChatMessage = {
        text: playerInput,
        sender: 'player',
        context: {
          emotion: 'neutral',
          intent: 'query',
        },
      };
      await sendMessage(playerMessage);
      
      // Extract memories from player input
      await extractMemories(playerInput, 'general');
      
      // Add system acknowledgment
      const systemMessage: ChatMessage = {
        text: "Processing your request...",
        sender: 'system',
        context: {
          intent: 'acknowledgment',
        },
      };
      await sendMessage(systemMessage);

      console.log('Executing DM agent task with context:', {
        campaignId,
        sessionId,
        messageHistory: messages
      });
      
      // Execute DM agent task
      const result = await dmAgent.executeTask({
        id: `task_${Date.now()}`,
        description: playerInput,
        expectedOutput: 'narrative response',
        context: {
          campaignId,
          currentState: 'in_progress',
          sessionId,
          messageHistory: messages
        }
      });

      if (!result.success) {
        throw new Error(result.message);
      }

      console.log('DM agent response:', result);

      // Create DM response message
      const dmResponse: ChatMessage = {
        text: result.data.response,
        sender: 'dm',
        context: {
          emotion: 'neutral',
          intent: 'narrative',
        },
      };
      await sendMessage(dmResponse);
      
      // Extract memories from DM response
      if (dmResponse.text) {
        await extractMemories(dmResponse.text, 'event');
      }

    } catch (error) {
      console.error('Error in message flow:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to process message. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Early return if no session or campaign
  if (!sessionId || !campaignId) {
    return (
      <Card className="p-6 bg-white/90 backdrop-blur-sm shadow-xl">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Session Not Found</h2>
          <p className="text-gray-600">Please make sure you have an active game session.</p>
        </div>
      </Card>
    );
  }

  return (
    <div className="flex gap-4 max-w-7xl mx-auto">
      <Card className="flex-1 bg-white/90 backdrop-blur-sm shadow-xl p-6">
        <h1 className="text-4xl text-center mb-6 text-primary">D&D Adventure</h1>
        <VoiceHandler 
          onError={(error) => {
            toast({
              title: "Voice Error",
              description: error.message,
              variant: "destructive",
            });
          }}
        />
        <MessageList messages={messages} />
        <ChatInput 
          onSendMessage={handleSendMessage}
          isDisabled={queueStatus === 'processing'}
        />
        <MemoryTester />
      </Card>
      <MemoryPanel />
    </div>
  );
};

export default GameContent;