import React from 'react';
import { useParams } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Character } from '@/types/character';
import { Shield, Swords, Book, ScrollText } from 'lucide-react';

/**
 * CharacterSheet component displays all details about a character
 * including stats, equipment, and background information
 */
const CharacterSheet: React.FC = () => {
  const { id } = useParams();
  const [character, setCharacter] = React.useState<Character | null>(null);
  const [loading, setLoading] = React.useState(true);
  const { toast } = useToast();

  /**
   * Fetches character data from Supabase including related stats and equipment
   */
  React.useEffect(() => {
    const fetchCharacter = async () => {
      try {
        // Fetch basic character info
        const { data: characterData, error: characterError } = await supabase
          .from('characters')
          .select('*')
          .eq('id', id)
          .single();

        if (characterError) throw characterError;

        // Fetch character stats
        const { data: statsData, error: statsError } = await supabase
          .from('character_stats')
          .select('*')
          .eq('character_id', id)
          .single();

        if (statsError) throw statsError;

        // Fetch character equipment
        const { data: equipmentData, error: equipmentError } = await supabase
          .from('character_equipment')
          .select('*')
          .eq('character_id', id);

        if (equipmentError) throw equipmentError;

        // Combine all data
        setCharacter({
          ...characterData,
          abilityScores: {
            strength: { score: statsData.strength, modifier: Math.floor((statsData.strength - 10) / 2), savingThrow: false },
            dexterity: { score: statsData.dexterity, modifier: Math.floor((statsData.dexterity - 10) / 2), savingThrow: false },
            constitution: { score: statsData.constitution, modifier: Math.floor((statsData.constitution - 10) / 2), savingThrow: false },
            intelligence: { score: statsData.intelligence, modifier: Math.floor((statsData.intelligence - 10) / 2), savingThrow: false },
            wisdom: { score: statsData.wisdom, modifier: Math.floor((statsData.wisdom - 10) / 2), savingThrow: false },
            charisma: { score: statsData.charisma, modifier: Math.floor((statsData.charisma - 10) / 2), savingThrow: false },
          },
          equipment: equipmentData.map(item => item.item_name),
          // Add missing required properties
          experience: characterData.experience_points || 0,
          personalityTraits: [],
          ideals: [],
          bonds: [],
          flaws: []
        });
      } catch (error) {
        console.error('Error fetching character:', error);
        toast({
          title: "Error",
          description: "Failed to load character data",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchCharacter();
    }
  }, [id, toast]);

  if (loading) {
    return <div className="flex justify-center items-center min-h-screen">Loading character data...</div>;
  }

  if (!character) {
    return <div className="flex justify-center items-center min-h-screen">Character not found</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Card className="p-6 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
        <h1 className="text-3xl font-bold text-center mb-8">{character.name}</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Basic Info */}
          <Card className="p-4">
            <div className="flex items-center gap-2 mb-4">
              <ScrollText className="w-5 h-5" />
              <h2 className="text-xl font-semibold">Basic Information</h2>
            </div>
            <div className="space-y-2">
              <p><span className="font-medium">Race:</span> {character.race}</p>
              <p><span className="font-medium">Class:</span> {character.class}</p>
              <p><span className="font-medium">Level:</span> {character.level}</p>
              <p><span className="font-medium">Background:</span> {character.background}</p>
            </div>
          </Card>

          {/* Combat Stats */}
          <Card className="p-4">
            <div className="flex items-center gap-2 mb-4">
              <Swords className="w-5 h-5" />
              <h2 className="text-xl font-semibold">Combat Statistics</h2>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="font-medium">Hit Points</p>
                <p>{character.abilityScores.constitution.modifier + 8}</p>
              </div>
              <div>
                <p className="font-medium">Armor Class</p>
                <p>{10 + character.abilityScores.dexterity.modifier}</p>
              </div>
            </div>
          </Card>

          {/* Ability Scores */}
          <Card className="p-4">
            <div className="flex items-center gap-2 mb-4">
              <Shield className="w-5 h-5" />
              <h2 className="text-xl font-semibold">Ability Scores</h2>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {Object.entries(character.abilityScores).map(([ability, data]) => (
                <div key={ability}>
                  <p className="font-medium capitalize">{ability}</p>
                  <p>Score: {data.score} (Modifier: {data.modifier >= 0 ? '+' : ''}{data.modifier})</p>
                </div>
              ))}
            </div>
          </Card>

          {/* Equipment */}
          <Card className="p-4">
            <div className="flex items-center gap-2 mb-4">
              <Book className="w-5 h-5" />
              <h2 className="text-xl font-semibold">Equipment</h2>
            </div>
            <ul className="list-disc list-inside space-y-1">
              {character.equipment.map((item, index) => (
                <li key={index} className="text-gray-700">{item}</li>
              ))}
            </ul>
          </Card>
        </div>
      </Card>
    </div>
  );
};

export default CharacterSheet;