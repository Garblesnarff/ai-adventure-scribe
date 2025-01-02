import React from 'react';
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
  const [isLoading, setIsLoading] = React.useState(false);
  const [isSpeaking, setIsSpeaking] = React.useState(false);
  const [volume, setVolume] = React.useState(0.5);
  const [isMuted, setIsMuted] = React.useState(false);
  const audioRef = React.useRef<HTMLAudioElement | null>(null);

  /**
   * Handles text-to-speech conversion and playback
   * @param text - The text to convert to speech
   */
  const speakText = async (text: string) => {
    try {
      setIsLoading(true);
      
      // Clean text by removing markdown or special characters
      const cleanText = text.replace(/[*_`#]/g, '');
      
      // Create headers with API key from environment
      const headers = new Headers();
      headers.append('xi-api-key', process.env.ELEVEN_LABS_API_KEY || '');
      headers.append('Content-Type', 'application/json');

      // Make request to ElevenLabs API
      const response = await fetch(
        'https://api.elevenlabs.io/v1/text-to-speech/JBFqnCBsd6RMkjVDRZzb', // George voice
        {
          method: 'POST',
          headers,
          body: JSON.stringify({
            text: cleanText,
            model_id: 'eleven_monolingual_v1',
            voice_settings: {
              stability: 0.5,
              similarity_boost: 0.5,
            }
          })
        }
      );

      if (!response.ok) {
        throw new Error('Failed to convert text to speech');
      }

      // Get audio blob and create URL
      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);

      // Create and configure audio element
      if (!audioRef.current) {
        audioRef.current = new Audio();
      }
      
      audioRef.current.src = audioUrl;
      audioRef.current.volume = isMuted ? 0 : volume;

      // Set up audio event handlers
      audioRef.current.onplay = () => setIsSpeaking(true);
      audioRef.current.onended = () => {
        setIsSpeaking(false);
        URL.revokeObjectURL(audioUrl);
      };
      audioRef.current.onerror = () => {
        setIsSpeaking(false);
        URL.revokeObjectURL(audioUrl);
        toast({
          title: "Audio Error",
          description: "Failed to play audio message",
          variant: "destructive",
        });
      };

      // Play the audio
      await audioRef.current.play();
      
    } catch (error) {
      console.error('Text-to-speech error:', error);
      toast({
        title: "Voice Error",
        description: "Failed to process voice message",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Listen for new DM messages and speak them
  React.useEffect(() => {
    const lastMessage = messages[messages.length - 1];
    if (lastMessage && lastMessage.sender === 'dm' && lastMessage.text) {
      speakText(lastMessage.text);
    }
  }, [messages]);

  // Handle volume changes
  const handleVolumeChange = (newVolume: number) => {
    setVolume(newVolume);
    if (audioRef.current && !isMuted) {
      audioRef.current.volume = newVolume;
    }
  };

  // Handle mute toggle
  const handleMuteToggle = () => {
    setIsMuted(!isMuted);
    if (audioRef.current) {
      audioRef.current.volume = !isMuted ? 0 : volume;
    }
  };

  // Cleanup on unmount
  React.useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <AudioControls
        isSpeaking={isSpeaking}
        isLoading={isLoading}
        volume={volume}
        isMuted={isMuted}
        onVolumeChange={handleVolumeChange}
        onMuteToggle={handleMuteToggle}
      />
    </div>
  );
};