import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Character } from '@/types/character';
import BasicInfo from './sections/BasicInfo';
import CombatStats from './sections/CombatStats';
import AbilityScores from './sections/AbilityScores';
import Equipment from './sections/Equipment';

/**
 * CharacterSheet component orchestrates the display of all character information
 * Fetches character data from Supabase and manages the overall layout
 */
const CharacterSheet: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [character, setCharacter] = React.useState<Character | null>(null);
  const [loading, setLoading] = React.useState(true);
  const { toast } = useToast();

  /**
   * Fetches character data from Supabase including related stats and equipment
   * Transforms the raw data into the required Character type format
   */
  React.useEffect(() => {
    const fetchCharacter = async () => {
      try {
        if (!id) {
          toast({
            title: "Error",
            description: "No character ID provided",
            variant: "destructive",
          });
          navigate('/characters');
          return;
        }

        // Fetch basic character info
        const { data: characterData, error: characterError } = await supabase
          .from('characters')
          .select('*')
          .eq('id', id)
          .maybeSingle();

        if (characterError) throw characterError;
        
        if (!characterData) {
          toast({
            title: "Error",
            description: "Character not found",
            variant: "destructive",
          });
          navigate('/characters');
          return;
        }

        // Fetch character stats
        const { data: statsData, error: statsError } = await supabase
          .from('character_stats')
          .select('*')
          .eq('character_id', id)
          .maybeSingle();

        if (statsError) throw statsError;

        // Fetch character equipment
        const { data: equipmentData, error: equipmentError } = await supabase
          .from('character_equipment')
          .select('*')
          .eq('character_id', id);

        if (equipmentError) throw equipmentError;

        // Create a character object that matches our Character type
        setCharacter({
          id: characterData.id,
          user_id: characterData.user_id,
          name: characterData.name,
          race: {
            id: 'stored',
            name: characterData.race,
            description: '',
            abilityScoreIncrease: {},
            speed: 30,
            traits: [],
            languages: []
          },
          class: {
            id: 'stored',
            name: characterData.class,
            description: '',
            hitDie: 8,
            primaryAbility: 'strength',
            savingThrowProficiencies: [],
            skillChoices: [],
            numSkillChoices: 2
          },
          level: characterData.level,
          background: {
            id: 'stored',
            name: characterData.background || '',
            description: '',
            skillProficiencies: [],
            toolProficiencies: [],
            languages: 0,
            equipment: [],
            feature: {
              name: '',
              description: ''
            }
          },
          abilityScores: statsData ? {
            strength: { score: statsData.strength, modifier: Math.floor((statsData.strength - 10) / 2), savingThrow: false },
            dexterity: { score: statsData.dexterity, modifier: Math.floor((statsData.dexterity - 10) / 2), savingThrow: false },
            constitution: { score: statsData.constitution, modifier: Math.floor((statsData.constitution - 10) / 2), savingThrow: false },
            intelligence: { score: statsData.intelligence, modifier: Math.floor((statsData.intelligence - 10) / 2), savingThrow: false },
            wisdom: { score: statsData.wisdom, modifier: Math.floor((statsData.wisdom - 10) / 2), savingThrow: false },
            charisma: { score: statsData.charisma, modifier: Math.floor((statsData.charisma - 10) / 2), savingThrow: false },
          } : {
            strength: { score: 10, modifier: 0, savingThrow: false },
            dexterity: { score: 10, modifier: 0, savingThrow: false },
            constitution: { score: 10, modifier: 0, savingThrow: false },
            intelligence: { score: 10, modifier: 0, savingThrow: false },
            wisdom: { score: 10, modifier: 0, savingThrow: false },
            charisma: { score: 10, modifier: 0, savingThrow: false },
          },
          equipment: equipmentData?.map(item => item.item_name) || [],
          experience: characterData.experience_points || 0,
          alignment: characterData.alignment || '',
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
        navigate('/characters');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchCharacter();
    }
  }, [id, toast, navigate]);

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