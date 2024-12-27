import React from 'react';
import { useCharacter } from '@/contexts/CharacterContext';
import { Card } from '@/components/ui/card';
import { races } from '@/data/raceOptions';
import { CharacterRace } from '@/types/character';

const RaceSelection: React.FC = () => {
  const { state, dispatch } = useCharacter();

  const handleRaceSelect = (race: CharacterRace) => {
    dispatch({
      type: 'UPDATE_CHARACTER',
      payload: { race }
    });
  };

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-center mb-4">Choose Your Race</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {races.map((race) => (
          <Card 
            key={race.id}
            className={`p-4 cursor-pointer transition-all hover:shadow-lg ${
              state.character?.race?.id === race.id ? 'ring-2 ring-primary' : ''
            }`}
            onClick={() => handleRaceSelect(race)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                handleRaceSelect(race);
              }
            }}
          >
            <h3 className="text-xl font-semibold mb-2">{race.name}</h3>
            <p className="text-sm text-gray-600 mb-3">{race.description}</p>
            <div className="text-sm">
              <p className="font-medium">Traits:</p>
              <ul className="list-disc list-inside">
                {race.traits.map((trait, index) => (
                  <li key={index}>{trait}</li>
                ))}
              </ul>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default RaceSelection;