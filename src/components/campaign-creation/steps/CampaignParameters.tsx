import React from 'react';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useCampaign } from '@/contexts/CampaignContext';

const difficultyLevels = [
  { value: 'easy', label: 'Easy' },
  { value: 'medium', label: 'Medium' },
  { value: 'hard', label: 'Hard' },
];

const campaignLengths = [
  { value: 'one-shot', label: 'One-Shot Adventure' },
  { value: 'short', label: 'Short Campaign' },
  { value: 'full', label: 'Full Campaign' },
];

const tones = [
  { value: 'serious', label: 'Serious' },
  { value: 'humorous', label: 'Humorous' },
  { value: 'gritty', label: 'Gritty' },
];

/**
 * Campaign parameters component
 * Handles difficulty, length, and tone selection
 */
const CampaignParameters: React.FC = () => {
  const { state, dispatch } = useCampaign();

  const handleParameterChange = (field: string, value: string) => {
    dispatch({
      type: 'UPDATE_CAMPAIGN',
      payload: { [field]: value }
    });
  };

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-lg font-semibold mb-4">Difficulty Level</h3>
        <RadioGroup
          value={state.campaign?.difficulty_level || ''}
          onValueChange={(value) => handleParameterChange('difficulty_level', value)}
          className="space-y-2"
        >
          {difficultyLevels.map((level) => (
            <div key={level.value} className="flex items-center space-x-2">
              <RadioGroupItem value={level.value} id={`difficulty-${level.value}`} />
              <Label htmlFor={`difficulty-${level.value}`}>{level.label}</Label>
            </div>
          ))}
        </RadioGroup>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-4">Campaign Length</h3>
        <RadioGroup
          value={state.campaign?.campaign_length || ''}
          onValueChange={(value) => handleParameterChange('campaign_length', value)}
          className="space-y-2"
        >
          {campaignLengths.map((length) => (
            <div key={length.value} className="flex items-center space-x-2">
              <RadioGroupItem value={length.value} id={`length-${length.value}`} />
              <Label htmlFor={`length-${length.value}`}>{length.label}</Label>
            </div>
          ))}
        </RadioGroup>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-4">Campaign Tone</h3>
        <RadioGroup
          value={state.campaign?.tone || ''}
          onValueChange={(value) => handleParameterChange('tone', value)}
          className="space-y-2"
        >
          {tones.map((tone) => (
            <div key={tone.value} className="flex items-center space-x-2">
              <RadioGroupItem value={tone.value} id={`tone-${tone.value}`} />
              <Label htmlFor={`tone-${tone.value}`}>{tone.label}</Label>
            </div>
          ))}
        </RadioGroup>
      </div>
    </div>
  );
};

export default CampaignParameters;