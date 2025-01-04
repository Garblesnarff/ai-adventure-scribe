import React from 'react';
import { useMessageContext } from '@/contexts/MessageContext';
import { useToast } from '@/hooks/use-toast';
import { AudioControls } from './AudioControls';
import { supabase } from '@/integrations/supabase/client';

export const VoiceHandler: React.FC = () => {
  const { messages } = useMessageContext();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = React.useState(false);
  const [isSpeaking, setIsSpeaking] = React.useState(false);
  const [volume, setVolume] = React.useState(0.5);
  const [isMuted, setIsMuted] = React.useState(false);
  const audioRef = React.useRef<HTMLAudioElement>(new Audio());

  React.useEffect(() => {
    const audio = audioRef.current;
    audio.onplay = () => setIsSpeaking(true);
    audio.onended = () => setIsSpeaking(false);
    audio.onerror = () => {
      setIsSpeaking(false);
      console.error('Audio playback error:', audio.error);
      toast({
        title: "Audio Error",
        description: "Failed to play audio message",
        variant: "destructive",
      });
    };

    return () => {
      audio.pause();
      audio.src = '';
    };
  }, [toast]);

  React.useEffect(() => {
    const lastMessage = messages[messages.length - 1];
    if (lastMessage?.sender === 'dm' && lastMessage.text) {
      speakText(lastMessage.text);
    }
  }, [messages]);

  const speakText = async (text: string) => {
    try {
      setIsLoading(true);
      
      const { data, error } = await supabase.functions.invoke('text-to-speech', {
        body: { text }
      });

      if (error) throw error;

      const audio = audioRef.current;
      
      // Create a new Blob from the binary data
      const blob = new Blob([data], { type: 'audio/mpeg' });
      const url = URL.createObjectURL(blob);
      
      // Clean up previous URL when loading new audio
      if (audio.src) {
        URL.revokeObjectURL(audio.src);
      }
      
      audio.src = url;
      audio.volume = isMuted ? 0 : volume;
      
      await audio.load(); // Explicitly load the audio
      await audio.play();
      
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

  const handleVolumeChange = (newVolume: number) => {
    setVolume(newVolume);
    if (audioRef.current && !isMuted) {
      audioRef.current.volume = newVolume;
    }
  };

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