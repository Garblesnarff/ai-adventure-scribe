import React from 'react';
import { useMessageContext } from '@/contexts/MessageContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

/**
 * VoiceHandler Component
 * Monitors messages and converts DM text to speech using ElevenLabs API
 */
export const VoiceHandler: React.FC = () => {
  const { messages } = useMessageContext();
  const { toast } = useToast();
  const audioRef = React.useRef<HTMLAudioElement | null>(null);

  /**
   * Converts text to speech and plays the audio
   * @param text - Text to be converted to speech
   */
  const playAudio = async (text: string) => {
    try {
      console.log('Converting text to speech:', text);
      
      // Call the text-to-speech edge function with binary response handling
      const { data, error } = await supabase.functions.invoke('text-to-speech', {
        body: { text },
      });

      if (error) {
        console.error('Error calling text-to-speech:', error);
        throw error;
      }

      // Create a blob from the array buffer
      const blob = new Blob([data], { type: 'audio/mpeg' });
      const url = URL.createObjectURL(blob);

      // Create and play audio
      if (!audioRef.current) {
        audioRef.current = new Audio();
      }
      
      audioRef.current.src = url;
      await audioRef.current.play();

      // Clean up the URL after playback
      audioRef.current.onended = () => {
        URL.revokeObjectURL(url);
      };

    } catch (error) {
      console.error('Voice error:', error);
      toast({
        title: "Voice Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  // Listen for new DM messages and speak them
  React.useEffect(() => {
    const lastMessage = messages[messages.length - 1];
    if (lastMessage && lastMessage.sender === 'dm' && lastMessage.text) {
      // Remove any markdown or special characters for cleaner speech
      const cleanText = lastMessage.text.replace(/[*_`#]/g, '');
      playAudio(cleanText);
    }
  }, [messages]);

  return null;
};