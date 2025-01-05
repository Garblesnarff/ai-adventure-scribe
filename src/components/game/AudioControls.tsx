import React from 'react';
import { TooltipProvider } from "@/components/ui/tooltip";
import { VolumeButton } from './audio/VolumeButton';
import { VolumeSlider } from './audio/VolumeSlider';
import { SpeakingIndicator } from './audio/SpeakingIndicator';

interface AudioControlsProps {
  isSpeaking: boolean;
  volume: number;
  onVolumeChange: (value: number) => void;
  onToggleMute: () => void;
  isMuted: boolean;
}

/**
 * AudioControls Component
 * Provides UI controls for audio playback including volume and mute functionality
 */
export const AudioControls: React.FC<AudioControlsProps> = ({
  isSpeaking,
  volume,
  onVolumeChange,
  onToggleMute,
  isMuted,
}) => {
  // Add debug logs
  React.useEffect(() => {
    console.log('AudioControls mounted');
    console.log('Initial state:', {
      isSpeaking,
      volume,
      isMuted
    });
  }, []);

  React.useEffect(() => {
    console.log('Audio state changed:', {
      isSpeaking,
      volume,
      isMuted
    });
  }, [isSpeaking, volume, isMuted]);

  return (
    <TooltipProvider>
      <div className="flex items-center gap-2 p-4 mb-4 bg-white/90 backdrop-blur-sm rounded-lg shadow-xl border-2 border-primary/20 hover:border-primary/40 transition-all duration-200">
        <VolumeButton
          isMuted={isMuted}
          isSpeaking={isSpeaking}
          onToggleMute={onToggleMute}
        />
        <VolumeSlider
          volume={volume}
          onVolumeChange={onVolumeChange}
        />
        <SpeakingIndicator isSpeaking={isSpeaking} />
      </div>
    </TooltipProvider>
  );
};