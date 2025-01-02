import React from 'react';
import { Volume2, VolumeX, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';

interface AudioControlsProps {
  isSpeaking: boolean;
  isLoading: boolean;
  volume: number;
  isMuted: boolean;
  onVolumeChange: (value: number) => void;
  onMuteToggle: () => void;
}

/**
 * AudioControls component provides UI for controlling voice playback
 */
export const AudioControls: React.FC<AudioControlsProps> = ({
  isSpeaking,
  isLoading,
  volume,
  isMuted,
  onVolumeChange,
  onMuteToggle,
}) => {
  return (
    <div className="flex items-center gap-2 p-2 bg-background/80 backdrop-blur-sm rounded-lg border">
      <Button
        variant="ghost"
        size="icon"
        onClick={onMuteToggle}
        className="relative"
      >
        {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <Loader2 className="h-4 w-4 animate-spin" />
          </div>
        )}
      </Button>
      
      <Slider
        className="w-24"
        value={[isMuted ? 0 : volume]}
        min={0}
        max={1}
        step={0.1}
        onValueChange={(values) => onVolumeChange(values[0])}
      />
      
      {isSpeaking && (
        <span className="text-xs text-muted-foreground animate-pulse">
          Speaking...
        </span>
      )}
    </div>
  );
};