import React from 'react';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useCampaign } from '@/contexts/CampaignContext';
import { Card } from '@/components/ui/card';

const genres = [
  { value: 'traditional-fantasy', label: 'Traditional Fantasy' },
  { value: 'dark-fantasy', label: 'Dark Fantasy' },
  { value: 'high-fantasy', label: 'High Fantasy' },
  { value: 'science-fantasy', label: 'Science Fantasy' },
  { value: 'steampunk', label: 'Steampunk' },
  { value: 'horror', label: 'Horror' },
];

const GenreSelection: React.FC = () => {
  const { state, dispatch } = useCampaign();

  const handleGenreChange = (value: string) => {
    dispatch({
      type: 'UPDATE_CAMPAIGN',
      payload: { genre: value }
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold mb-4">Choose Campaign Genre</h2>
        <RadioGroup
          value={state.campaign?.genre || ''}
          onValueChange={handleGenreChange}
          className="grid grid-cols-1 md:grid-cols-2 gap-4"
        >
          {genres.map((genre) => (
            <Card
              key={genre.value}
              className={`p-4 cursor-pointer transition-all border-2 ${
                state.campaign?.genre === genre.value
                  ? 'border-primary bg-accent/10'
                  : 'border-transparent'
              }`}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value={genre.value} id={genre.value} />
                <Label htmlFor={genre.value}>{genre.label}</Label>
              </div>
            </Card>
          ))}
        </RadioGroup>
      </div>
    </div>
  );
};

export default GenreSelection;