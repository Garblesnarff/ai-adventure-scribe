import React from 'react';
import { useParams } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { useCharacterData } from '@/hooks/useCharacterData';
import BasicInfo from './sections/BasicInfo';
import CombatStats from './sections/CombatStats';
import AbilityScores from './sections/AbilityScores';
import Equipment from './sections/Equipment';

/**
 * CharacterSheet component displays all character information
 * Orchestrates the layout and data flow between character sections
 * Uses useCharacterData hook for data fetching and state management
 */
const CharacterSheet: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { character, loading } = useCharacterData(id);

  // Show loading state while fetching data
  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="p-6 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
          <div className="flex justify-center items-center min-h-[200px]">
            Loading character data...
          </div>
        </Card>
      </div>
    );
  }

  // Early return if no character data is available
  // Error handling is managed by the useCharacterData hook
  if (!character) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Card className="p-6 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
        <h1 className="text-3xl font-bold text-center mb-8">{character.name}</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <BasicInfo character={character} />
          <CombatStats character={character} />
          <AbilityScores character={character} />
          <Equipment character={character} />
        </div>
      </Card>
    </div>
  );
};

export default CharacterSheet;