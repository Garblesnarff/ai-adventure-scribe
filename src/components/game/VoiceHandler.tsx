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
      
      // Get the function URL - using the correct method call
      const functionUrl = supabase.functions.url('text-to-speech');
      
      // Get the session for authentication
      const { data: { session } } = await supabase.auth.getSession();
      
      // Make the request to the edge function
      const response = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`,
          // Use the public anon key
          'apikey': process.env.SUPABASE_ANON_KEY || '',
        },
        body: JSON.stringify({ text }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(error);
      }

      // Get the binary audio data
      const arrayBuffer = await response.arrayBuffer();
      console.log('Received audio data of size:', arrayBuffer.byteLength);

      // Create a blob from the array buffer
      const blob = new Blob([arrayBuffer], { type: 'audio/mpeg' });
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