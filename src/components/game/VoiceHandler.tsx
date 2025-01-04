import React from 'react';
import { useMessageContext } from '@/contexts/MessageContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

// ElevenLabs API types
interface VoiceSettings {
  stability: number;
  similarity_boost: number;
}

interface ElevenLabsResponse {
  audio: ArrayBuffer;
}

/**
 * VoiceHandler Component
 * Monitors messages and converts DM text to speech using ElevenLabs API directly
 */
export const VoiceHandler: React.FC = () => {
  const { messages } = useMessageContext();
  const { toast } = useToast();
  const audioRef = React.useRef<HTMLAudioElement | null>(null);
  const [apiKey, setApiKey] = React.useState<string | null>(null);

  // Fetch ElevenLabs API key from Supabase secrets on mount
  React.useEffect(() => {
    const fetchApiKey = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('get-secret', {
          body: { secretName: 'ELEVEN_LABS_API_KEY' }
        });

        if (error) {
          console.error('Error fetching ElevenLabs API key:', error);
          throw error;
        }

        if (data?.secret) {
          console.log('Successfully retrieved ElevenLabs API key');
          setApiKey(data.secret);
        } else {
          console.error('Retrieved ElevenLabs API key is empty');
          throw new Error('ElevenLabs API key is empty');
        }
      } catch (error) {
        console.error('Error in fetchApiKey:', error);
        toast({
          title: "API Key Error",
          description: "Failed to retrieve ElevenLabs API key. Please check your configuration.",
          variant: "destructive",
        });
      }
    };

    fetchApiKey();
  }, [toast]);

  /**
   * Converts text to speech using ElevenLabs API and plays the audio
   * @param text - Text to be converted to speech
   */
  const playAudio = async (text: string) => {
    try {
      if (!apiKey) {
        throw new Error('ElevenLabs API key not available');
      }

      console.log('Converting text to speech:', text);

      // Voice ID for custom voice
      const VOICE_ID = 'T0GKiSwCb51L7pv1sshd';
      
      // Voice settings for stability and similarity boost
      const voiceSettings: VoiceSettings = {
        stability: 0.5,
        similarity_boost: 0.75
      };

      const response = await fetch(
        `https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}/stream`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'xi-api-key': apiKey,
          },
          body: JSON.stringify({
            text,
            voice_settings: voiceSettings,
            model_id: 'eleven_turbo_v2_5'
          }),
        }
      );

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
        description: error instanceof Error ? error.message : 'Failed to process voice',
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