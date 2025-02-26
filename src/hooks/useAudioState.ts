import React from 'react';
import { useToast } from './use-toast';
import { supabase } from '@/integrations/supabase/client';

export const useAudioState = () => {
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

  return {
    audioRef,
    apiKey,
    volume,
    isMuted,
    isVoiceEnabled,
    isSpeaking,
    setIsSpeaking,
    handleVolumeChange,
    handleToggleMute,
    handleToggleVoice,
  };
};