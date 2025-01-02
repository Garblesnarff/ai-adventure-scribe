import React from 'react';
import { useConversation } from '@11labs/react';
import { useMessageContext } from '@/contexts/MessageContext';
import { useToast } from '@/hooks/use-toast';

/**
 * Handles voice integration with ElevenLabs
 * Listens for DM messages and converts them to speech
 */
export const VoiceHandler: React.FC = () => {
  const { messages } = useMessageContext();
  const { toast } = useToast();
  
  const conversation = useConversation({
    overrides: {
      tts: {
        voiceId: "JBFqnCBsd6RMkjVDRZzb", // George - warm storyteller voice
        modelId: "eleven_multilingual_v2", // High quality model
      },
    },
    onError: (error) => {
      console.error('ElevenLabs error:', error);
      toast({
        title: "Voice Error",
        description: typeof error === 'string' ? error : 'Failed to process voice request',
        variant: "destructive",
      });
    },
  });

  // Initialize voice when component mounts
  React.useEffect(() => {
    const initVoice = async () => {
      try {
        await conversation.startSession({
          agentId: "dm_agent", // This is a placeholder - you can customize this
        });
      } catch (error) {
        console.error('Failed to initialize voice:', error);
        toast({
          title: "Voice Error",
          description: "Failed to initialize voice. Please try again.",
          variant: "destructive",
        });
      }
    };

    initVoice();
  }, [conversation]);

  // Listen for new DM messages and speak them
  React.useEffect(() => {
    const lastMessage = messages[messages.length - 1];
    if (lastMessage && lastMessage.sender === 'dm' && lastMessage.text) {
      // Remove any markdown or special characters for cleaner speech
      const cleanText = lastMessage.text.replace(/[*_`#]/g, '');
      
      // Use the conversation instance to speak the text
      conversation.startSession({
        agentId: "dm_agent",
        overrides: {
          tts: {
            text: cleanText
          }
        }
      }).catch(error => {
        console.error('Failed to speak message:', error);
        toast({
          title: "Voice Error",
          description: "Failed to speak message. Please try again.",
          variant: "destructive",
        });
      });
    }
  }, [messages, conversation]);

  return null;
};