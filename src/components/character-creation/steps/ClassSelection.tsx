import React from 'react';
import { useCharacter } from '@/contexts/CharacterContext';
import { Card } from '@/components/ui/card';

const ClassSelection: React.FC = () => {
  const { state, dispatch } = useCharacter();

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-center mb-4">Choose Your Class</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Class selection cards will go here */}
        <Card className="p-4 text-center">
          Class selection coming soon...
        </Card>
      </div>
    </div>
  );
};

export default ClassSelection;