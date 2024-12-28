import React from 'react';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useCampaign } from '@/contexts/CampaignContext';
import { Card } from '@/components/ui/card';

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
          className="grid grid-cols-1 md:grid-cols-3 gap-4"
        >
          {difficultyLevels.map((level) => (
            <Card
              key={level.value}
              className={`p-4 cursor-pointer transition-all border-2 ${
                state.campaign?.difficulty_level === level.value
                  ? 'border-primary bg-accent/10'
                  : 'border-transparent'
              }`}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value={level.value} id={`difficulty-${level.value}`} />
                <Label htmlFor={`difficulty-${level.value}`}>{level.label}</Label>
              </div>
            </Card>
          ))}
        </RadioGroup>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-4">Campaign Length</h3>
        <RadioGroup
          value={state.campaign?.campaign_length || ''}
          onValueChange={(value) => handleParameterChange('campaign_length', value)}
          className="grid grid-cols-1 md:grid-cols-3 gap-4"
        >
          {campaignLengths.map((length) => (
            <Card
              key={length.value}
              className={`p-4 cursor-pointer transition-all border-2 ${
                state.campaign?.campaign_length === length.value
                  ? 'border-primary bg-accent/10'
                  : 'border-transparent'
              }`}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value={length.value} id={`length-${length.value}`} />
                <Label htmlFor={`length-${length.value}`}>{length.label}</Label>
              </div>
            </Card>
          ))}
        </RadioGroup>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-4">Campaign Tone</h3>
        <RadioGroup
          value={state.campaign?.tone || ''}
          onValueChange={(value) => handleParameterChange('tone', value)}
          className="grid grid-cols-1 md:grid-cols-3 gap-4"
        >
          {tones.map((tone) => (
            <Card
              key={tone.value}
              className={`p-4 cursor-pointer transition-all border-2 ${
                state.campaign?.tone === tone.value
                  ? 'border-primary bg-accent/10'
                  : 'border-transparent'
              }`}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value={tone.value} id={`tone-${tone.value}`} />
                <Label htmlFor={`tone-${tone.value}`}>{tone.label}</Label>
              </div>
            </Card>
          ))}
        </RadioGroup>
      </div>
    </div>
  );
};

export default CampaignParameters;