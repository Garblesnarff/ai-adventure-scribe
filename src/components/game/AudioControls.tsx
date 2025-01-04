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
  return (
    <TooltipProvider>
      <div className="fixed bottom-4 right-4 flex items-center gap-2 p-2 bg-white/50 backdrop-blur-sm rounded-lg shadow-sm">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggleMute}
              className={isSpeaking ? 'animate-pulse' : ''}
            >
              {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
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
                onValueChange={(values) => onVolumeChange(values[0] / 100)}
              />
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>Adjust volume</p>
          </TooltipContent>
        </Tooltip>
        
        {isSpeaking && (
          <div className="text-xs text-muted-foreground animate-pulse">
            Speaking...
          </div>
        )}
      </div>
    </TooltipProvider>
  );
};