import React from 'react';
import { Card } from '@/components/ui/card';
import { CharacterProvider } from '@/contexts/CharacterContext';

const CharacterWizard: React.FC = () => {
  return (
    <CharacterProvider>
      <div className="container mx-auto px-4 py-8">
        <Card className="p-6 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
          <h1 className="text-3xl font-bold text-center mb-8">Create Your Character</h1>
          {/* Step content will go here */}
          <div className="text-center text-gray-600">
            Character creation wizard coming soon...
          </div>
        </Card>
      </div>
    </CharacterProvider>
  );
};

export default CharacterWizard;