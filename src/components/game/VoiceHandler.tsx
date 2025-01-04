import React from 'react';
import { useMessageContext } from '@/contexts/MessageContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

// ElevenLabs API types
interface ElevenLabsResponse {
  audio: ArrayBuffer;
}

interface VoiceSettings {
  stability: number;
  similarity_boost: number;
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
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch(
        `${process.env.SUPABASE_URL}/rest/v1/rpc/get_secret`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
            'apikey': process.env.SUPABASE_ANON_KEY || '',
          },
          body: JSON.stringify({
            name: 'ELEVEN_LABS_API_KEY'
          }),
        }
      );

      if (response.ok) {
        const key = await response.text();
        setApiKey(key);
      } else {
        console.error('Failed to fetch ElevenLabs API key');
      }
    };

    fetchApiKey();
  }, []);

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

      // Voice ID for "Rachel" - you can change this to use a different voice
      const VOICE_ID = '21m00Tcm4TlvDq8ikWAM';
      
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
            model_id: 'eleven_monolingual_v1'
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