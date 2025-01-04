import React from 'react';
import { useMessageContext } from '@/contexts/MessageContext';
import { useToast } from '@/hooks/use-toast';
import { AudioControls } from './AudioControls';
import { supabase } from '@/integrations/supabase/client';

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
  const lastProcessedMessageRef = React.useRef<string | null>(null);

  // Initialize audio element once
  React.useEffect(() => {
    audioRef.current = new Audio();
    audioRef.current.onplay = () => setIsSpeaking(true);
    audioRef.current.onended = () => setIsSpeaking(false);
    audioRef.current.onerror = () => {
      setIsSpeaking(false);
      toast({
        title: "Audio Error",
        description: "Failed to play audio message",
        variant: "destructive",
      });
    };

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, [toast]);

  /**
   * Handles text-to-speech conversion and playback
   * @param text - The text to convert to speech
   */
  const speakText = async (text: string) => {
    try {
      setIsLoading(true);
      
      const { data, error } = await supabase.functions.invoke('text-to-speech', {
        body: { text }
      });

      if (error) throw error;

      if (audioRef.current) {
        const audioBlob = new Blob([data], { type: 'audio/mpeg' });
        audioRef.current.src = URL.createObjectURL(audioBlob);
        audioRef.current.volume = isMuted ? 0 : volume;
        await audioRef.current.play();
      }
    } catch (error) {
      console.error('Voice error:', error);
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
    
    if (lastMessage && 
        lastMessage.sender === 'dm' && 
        lastMessage.text && 
        lastMessage.text !== lastProcessedMessageRef.current) {
      lastProcessedMessageRef.current = lastMessage.text;
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