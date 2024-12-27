import React from 'react';
import { useCharacter } from '@/contexts/CharacterContext';
import { Card } from '@/components/ui/card';
import { classes } from '@/data/classOptions';
import { CharacterClass } from '@/types/character';

const ClassSelection: React.FC = () => {
  const { state, dispatch } = useCharacter();

  const handleClassSelect = (characterClass: CharacterClass) => {
    dispatch({
      type: 'UPDATE_CHARACTER',
      payload: { class: characterClass }
    });
  };

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-center mb-4">Choose Your Class</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {classes.map((characterClass) => (
          <Card 
            key={characterClass.id}
            className={`p-4 cursor-pointer transition-all hover:shadow-lg ${
              state.character?.class?.id === characterClass.id ? 'ring-2 ring-primary' : ''
            }`}
            onClick={() => handleClassSelect(characterClass)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                handleClassSelect(characterClass);
              }
            }}
          >
            <h3 className="text-xl font-semibold mb-2">{characterClass.name}</h3>
            <p className="text-sm text-gray-600 mb-3">{characterClass.description}</p>
            <div className="text-sm">
              <p><span className="font-medium">Hit Die:</span> d{characterClass.hitDie}</p>
              <p><span className="font-medium">Primary Ability:</span> {characterClass.primaryAbility.toString().charAt(0).toUpperCase() + characterClass.primaryAbility.toString().slice(1)}</p>
              <p className="font-medium mt-2">Saving Throw Proficiencies:</p>
              <ul className="list-disc list-inside">
                {characterClass.savingThrowProficiencies.map((save, index) => (
                  <li key={index} className="capitalize">{save.toString()}</li>
                ))}
              </ul>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default ClassSelection;