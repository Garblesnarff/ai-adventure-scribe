import React from 'react';
import { useMessageContext } from '@/contexts/MessageContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { AudioControls } from './AudioControls';

interface VoiceSettings {
  stability: number;
  similarity_boost: number;
}

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
  const [isVoiceEnabled, setIsVoiceEnabled] = React.useState(() => {
    return localStorage.getItem('voice-enabled') !== 'false';
  });
  const [isSpeaking, setIsSpeaking] = React.useState(false);

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

  const handleVolumeChange = (newVolume: number) => {
    setVolume(newVolume);
    localStorage.setItem('voice-volume', newVolume.toString());
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
  };

  const handleToggleMute = () => {
    const newMutedState = !isMuted;
    setIsMuted(newMutedState);
    localStorage.setItem('voice-muted', newMutedState.toString());
    if (audioRef.current) {
      audioRef.current.muted = newMutedState;
    }
  };

  const handleToggleVoice = () => {
    const newVoiceState = !isVoiceEnabled;
    setIsVoiceEnabled(newVoiceState);
    localStorage.setItem('voice-enabled', newVoiceState.toString());
    
    toast({
      title: newVoiceState ? "Voice Mode Enabled" : "Voice Mode Disabled",
      description: newVoiceState 
        ? "Text-to-speech is now active" 
        : "Text-to-speech is now disabled",
    });
  };

  const playAudio = async (text: string) => {
    try {
      if (!apiKey) {
        throw new Error('ElevenLabs API key not available');
      }

      if (!isVoiceEnabled) {
        console.log('Voice mode is disabled, skipping text-to-speech');
        return;
      }

      console.log('Converting text to speech:', text);
      setIsSpeaking(true);

      const VOICE_ID = 'T0GKiSwCb51L7pv1sshd';
      const API_URL = 'https://api.elevenlabs.io/v1/text-to-speech';
      
      const voiceSettings: VoiceSettings = {
        stability: 0.5,
        similarity_boost: 0.75
      };

      const response = await fetch(
        `${API_URL}/${VOICE_ID}/stream`,
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
        const errorText = await response.text();
        console.error('ElevenLabs API error:', errorText);
        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
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
      
      try {
        await audioRef.current.play();
      } catch (playError) {
        console.error('Error playing audio:', playError);
        throw new Error('Failed to play audio');
      }

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

  React.useEffect(() => {
    const lastMessage = messages[messages.length - 1];
    if (lastMessage && lastMessage.sender === 'dm' && lastMessage.text) {
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
      isVoiceEnabled={isVoiceEnabled}
      onToggleVoice={handleToggleVoice}
    />
  );
};