import React from 'react';
import { useMessageContext } from '@/contexts/MessageContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { AudioControls } from './AudioControls';

interface VoiceSettings {
  stability: number;
  similarity_boost: number;
}

/**
 * VoiceHandler Component
 * Monitors messages and converts DM text to speech using ElevenLabs API directly
 * Includes audio control functionality
 */
export const VoiceHandler: React.FC = () => {
  const { messages } = useMessageContext();
  const { toast } = useToast();
  const audioRef = React.useRef<HTMLAudioElement | null>(null);
  const [apiKey, setApiKey] = React.useState<string | null>(null);
  const [volume, setVolume] = React.useState(() => {
    const savedVolume = localStorage.getItem('voice-volume');
    return savedVolume ? parseFloat(savedVolume) : 1;
  });
  const [isMuted, setIsMuted] = React.useState(() => {
    return localStorage.getItem('voice-muted') === 'true';
  });
  const [isSpeaking, setIsSpeaking] = React.useState(false);

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
   * Handle volume change and persist to localStorage
   */
  const handleVolumeChange = (newVolume: number) => {
    setVolume(newVolume);
    localStorage.setItem('voice-volume', newVolume.toString());
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
  };

  /**
   * Handle mute toggle and persist to localStorage
   */
  const handleToggleMute = () => {
    const newMutedState = !isMuted;
    setIsMuted(newMutedState);
    localStorage.setItem('voice-muted', newMutedState.toString());
    if (audioRef.current) {
      audioRef.current.muted = newMutedState;
    }
  };

  /**
   * Converts text to speech using ElevenLabs API and plays the audio
   */
  const playAudio = async (text: string) => {
    try {
      if (!apiKey) {
        throw new Error('ElevenLabs API key not available');
      }

      console.log('Converting text to speech:', text);
      setIsSpeaking(true);

      const VOICE_ID = 'T0GKiSwCb51L7pv1sshd';
      
      const voiceSettings: VoiceSettings = {
        stability: 0.5,
        similarity_boost: 0.75
      };

      const response = await fetch(
        `https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}/stream`,
        {
          method: 'POST',
          headers: {
            'Accept': 'audio/mpeg',
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

      const arrayBuffer = await response.arrayBuffer();
      console.log('Received audio data of size:', arrayBuffer.byteLength, 'bytes');

      const blob = new Blob([arrayBuffer], { type: 'audio/mpeg' });
      const url = URL.createObjectURL(blob);

      if (!audioRef.current) {
        audioRef.current = new Audio();
      }
      
      audioRef.current.src = url;
      audioRef.current.volume = volume;
      audioRef.current.muted = isMuted;
      await audioRef.current.play();

      audioRef.current.onended = () => {
        URL.revokeObjectURL(url);
        setIsSpeaking(false);
      };

    } catch (error) {
      console.error('Voice error:', error);
      setIsSpeaking(false);
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

  return (
    <AudioControls
      isSpeaking={isSpeaking}
      volume={volume}
      onVolumeChange={handleVolumeChange}
      onToggleMute={handleToggleMute}
      isMuted={isMuted}
    />
  );
};