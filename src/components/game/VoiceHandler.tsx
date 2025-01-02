import React from 'react';
import { useConversation } from '@11labs/react';
import { useMessageContext } from '@/contexts/MessageContext';
import { useToast } from '@/hooks/use-toast';
import { AudioControls } from './AudioControls';

/**
 * VoiceHandler component manages text-to-speech functionality using ElevenLabs
 * Listens for DM messages and converts them to speech
 */
export const VoiceHandler: React.FC = () => {
  const { messages } = useMessageContext();
  const { toast } = useToast();
  const [isInitialized, setIsInitialized] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [volume, setVolume] = React.useState(0.5);
  const [isMuted, setIsMuted] = React.useState(false);
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
      setIsLoading(false);
      toast({
        title: "Voice Error",
        description: typeof error === 'string' ? error : 'Failed to process voice request',
        variant: "destructive",
      });
    },
    onConnect: () => {
      console.log('ElevenLabs session connected successfully');
      setIsLoading(false);
    },
    onDisconnect: () => {
      console.log('ElevenLabs session disconnected');
      setIsInitialized(false);
      setSessionId(null);
      setIsLoading(false);
    }
  });

  // Initialize voice session when component mounts
  React.useEffect(() => {
    const initVoice = async () => {
      try {
        setIsLoading(true);
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
        setIsLoading(false);
      } catch (error) {
        console.error('Failed to initialize voice:', error);
        setIsLoading(false);
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
      if (isInitialized && sessionId) {
        console.log('Cleaning up ElevenLabs session:', sessionId);
        conversation.endSession().catch(console.error);
      }
    };
  }, [conversation, isInitialized, toast]);

  // Handle volume changes
  const handleVolumeChange = async (newVolume: number) => {
    setVolume(newVolume);
    if (isInitialized && !isMuted) {
      try {
        await conversation.setVolume({ volume: newVolume });
      } catch (error) {
        console.error('Failed to update volume:', error);
      }
    }
  };

  // Handle mute toggle
  const handleMuteToggle = async () => {
    const newMutedState = !isMuted;
    setIsMuted(newMutedState);
    if (isInitialized) {
      try {
        await conversation.setVolume({ volume: newMutedState ? 0 : volume });
      } catch (error) {
        console.error('Failed to toggle mute:', error);
      }
    }
  };

  // Listen for new DM messages and speak them
  React.useEffect(() => {
    const lastMessage = messages[messages.length - 1];
    
    if (lastMessage && lastMessage.sender === 'dm' && lastMessage.text && isInitialized && sessionId) {
      setIsLoading(true);
      
      // Remove any markdown or special characters for cleaner speech
      const cleanText = lastMessage.text.replace(/[*_`#]/g, '');
      
      console.log('Sending DM response to ElevenLabs:', cleanText);
      
      // Use startSession with firstMessage to speak the text
      conversation.startSession({
        agentId: "dm_agent",
        overrides: {
          agent: {
            firstMessage: cleanText,
            language: "en"
          }
        }
      }).catch(error => {
        console.error('Failed to speak DM message:', error);
        setIsLoading(false);
        toast({
          title: "Voice Error",
          description: "Failed to speak message. Please try again.",
          variant: "destructive",
        });
      });
    }
  }, [messages, conversation, isInitialized, sessionId, toast]);

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <AudioControls
        isSpeaking={isLoading}
        isLoading={isLoading}
        volume={volume}
        isMuted={isMuted}
        onVolumeChange={handleVolumeChange}
        onMuteToggle={handleMuteToggle}
      />
    </div>
  );
};