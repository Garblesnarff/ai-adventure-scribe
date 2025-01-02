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
  const [sessionId, setSessionId] = React.useState<string | null>(null);
  
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
    onConnect: () => {
      console.log('ElevenLabs session connected successfully');
    },
    onDisconnect: () => {
      console.log('ElevenLabs session disconnected');
      setIsInitialized(false);
      setSessionId(null);
    }
  });

  // Initialize voice session when component mounts
  React.useEffect(() => {
    const initVoice = async () => {
      try {
        console.log('Initializing ElevenLabs session...');
        
        // Start the session with the DM agent configuration
        const newSessionId = await conversation.startSession({
          agentId: "dm_agent",
          overrides: {
            agent: {
              language: "en",
            }
          }
        });
        
        console.log('ElevenLabs session initialized successfully with ID:', newSessionId);
        setSessionId(newSessionId);
        setIsInitialized(true);
      } catch (error) {
        console.error('Failed to initialize voice:', error);
        toast({
          title: "Voice Error",
          description: "Failed to initialize voice. Please check your API key and try again.",
          variant: "destructive",
        });
      }
    };

    if (!isInitialized) {
      initVoice();
    }

    return () => {
      // Cleanup on unmount
      if (isInitialized && sessionId) {
        console.log('Cleaning up ElevenLabs session:', sessionId);
        conversation.endSession().catch(console.error);
      }
    };
  }, [conversation, isInitialized, toast]);

  // Listen for new DM messages and speak them
  React.useEffect(() => {
    const lastMessage = messages[messages.length - 1];
    
    if (lastMessage && lastMessage.sender === 'dm' && lastMessage.text && isInitialized && sessionId) {
      // Remove any markdown or special characters for cleaner speech
      const cleanText = lastMessage.text.replace(/[*_`#]/g, '');
      
      console.log('Sending text to ElevenLabs:', cleanText);
      
      // Use conversation.speak() to send text for speech
      conversation.speak(cleanText).catch(error => {
        console.error('Failed to speak message:', error);
        toast({
          title: "Voice Error",
          description: "Failed to speak message. Please try again.",
          variant: "destructive",
        });
      });
    }
  }, [messages, conversation, isInitialized, sessionId, toast]);

  return null;
};