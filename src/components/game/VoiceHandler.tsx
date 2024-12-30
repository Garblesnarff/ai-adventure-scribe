import React from 'react';
import { useConversation } from '@11labs/react';

/**
 * Handles voice integration with ElevenLabs
 * @param onError - Callback for handling voice initialization errors
 */
export const VoiceHandler: React.FC<{
  onError: (error: Error) => void;
}> = ({ onError }) => {
  const conversation = useConversation({
    overrides: {
      tts: {
        voiceId: "pNInz6obpgDQGcFmaJgB", // Fantasy narrator voice
      },
    },
  });

  React.useEffect(() => {
    const initVoice = async () => {
      try {
        await conversation.startSession({
          agentId: "your_agent_id", // Replace with actual agent ID
        });
      } catch (error) {
        onError(error instanceof Error ? error : new Error('Failed to initialize voice'));
      }
    };

    initVoice();
  }, [conversation, onError]);

  return null;
};