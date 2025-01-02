import React from 'react';
import { useConversation } from '@11labs/react';
import { useMessageContext } from '@/contexts/MessageContext';
import { useToast } from '@/hooks/use-toast';

/**
 * VoiceHandler component manages text-to-speech functionality using ElevenLabs
 * Listens for DM messages and converts them to speech
 */
export const VoiceHandler: React.FC = () => {
  const { messages } = useMessageContext();
  const { toast } = useToast();
  const [isInitialized, setIsInitialized] = React.useState(false);
  
  // Initialize ElevenLabs conversation with George's voice
  const conversation = useConversation({
    overrides: {
      tts: {
        voiceId: "JBFqnCBsd6RMkjVDRZzb", // George - warm storyteller voice
      }
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

  // Initialize voice session when component mounts
  React.useEffect(() => {
    const initVoice = async () => {
      try {
        console.log('Initializing ElevenLabs session...');
        await conversation.startSession({
          agentId: "dm_agent",
          overrides: {
            agent: {
              language: "en",
            }
          }
        });
        console.log('ElevenLabs session initialized successfully');
        setIsInitialized(true);
      } catch (error) {
        console.error('Failed to initialize voice:', error);
        toast({
          title: "Voice Error",
          description: "Failed to initialize voice. Please try again.",
          variant: "destructive",
        });
      }
    };

    if (!isInitialized) {
      initVoice();
    }

    return () => {
      // Cleanup on unmount
      if (isInitialized) {
        conversation.endSession().catch(console.error);
      }
    };
  }, [conversation, isInitialized, toast]);

  // Listen for new DM messages and speak them
  React.useEffect(() => {
    const lastMessage = messages[messages.length - 1];
    if (lastMessage && lastMessage.sender === 'dm' && lastMessage.text && isInitialized) {
      // Remove any markdown or special characters for cleaner speech
      const cleanText = lastMessage.text.replace(/[*_`#]/g, '');
      
      console.log('Sending text to ElevenLabs:', cleanText);
      
      // Send text to be spoken
      conversation.startSession({
        agentId: "dm_agent",
        overrides: {
          agent: {
            firstMessage: cleanText,
            language: "en"
          },
          tts: {
            voiceId: "JBFqnCBsd6RMkjVDRZzb"
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
  }, [messages, conversation, isInitialized, toast]);

  return null;
};