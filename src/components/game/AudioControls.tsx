import React from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Volume2, VolumeX } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

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
      <div className="fixed bottom-4 right-4 flex items-center gap-2 p-2 bg-black/40 backdrop-blur-md rounded-lg shadow-xl border-2 border-white/30 hover:border-white/40 transition-all duration-200">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggleMute}
              className={`bg-white/20 hover:bg-white/30 transition-colors ${
                isSpeaking ? 'animate-pulse ring-2 ring-primary shadow-lg shadow-primary/50' : ''
              }`}
            >
              {isMuted ? 
                <VolumeX className="h-4 w-4 text-white drop-shadow-md" /> : 
                <Volume2 className="h-4 w-4 text-white drop-shadow-md" />
              }
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{isMuted ? 'Unmute' : 'Mute'} voice</p>
          </TooltipContent>
        </Tooltip>
        
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="w-24">
              <Slider
                value={[volume * 100]}
                max={100}
                step={1}
                onValueChange={(values) => {
                  console.log('Volume changed:', values[0] / 100);
                  onVolumeChange(values[0] / 100);
                }}
                className="cursor-pointer"
              />
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>Adjust volume</p>
          </TooltipContent>
        </Tooltip>
        
        {isSpeaking && (
          <div className="text-xs font-medium text-white drop-shadow-md animate-pulse">
            Speaking...
          </div>
        )}
      </div>
    </TooltipProvider>
  );
};