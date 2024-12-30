import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Character } from '@/types/character';
import { races } from '@/data/raceOptions';
import { classes } from '@/data/classOptions';
import CharacterCard from './CharacterCard';
import EmptyState from './EmptyState';

/**
 * CharacterList component displays all characters for the current user
 * Provides options to view existing characters or create new ones
 */
const CharacterList: React.FC = () => {
  const [characters, setCharacters] = React.useState<Partial<Character>[]>([]);
  const [loading, setLoading] = React.useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  /**
   * Transforms raw database character data into Character type
   * @param rawData - Raw character data from database
   * @returns Transformed character data
   */
  const transformCharacterData = (rawData: any[]): Partial<Character>[] => {
    return rawData.map(char => ({
      ...char,
      race: races.find(r => r.name === char.race) || { name: char.race },
      class: classes.find(c => c.name === char.class) || { name: char.class }
    }));
  };

  /**
   * Fetches all characters for the current user from Supabase
   */
  React.useEffect(() => {
    const fetchCharacters = async () => {
      try {
        const { data, error } = await supabase
          .from('characters')
          .select('id, name, race, class, level')
          .order('created_at', { ascending: false });

        if (error) throw error;
        const transformedData = transformCharacterData(data || []);
        setCharacters(transformedData);
      } catch (error) {
        console.error('Error fetching characters:', error);
        toast({
          title: "Error",
          description: "Failed to load characters",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchCharacters();
  }, [toast]);

  /**
   * Handles character deletion
   * @param id - The ID of the character to delete
   */
  const handleDeleteCharacter = async (id: string) => {
    try {
      // Delete related records first
      await supabase.from('character_stats').delete().eq('character_id', id);
      await supabase.from('character_equipment').delete().eq('character_id', id);
      
      // Delete the character
      const { error } = await supabase
        .from('characters')
        .delete()
        .eq('id', id);

      if (error) throw error;

      // Update local state
      setCharacters(prev => prev.filter(char => char.id !== id));
      
      toast({
        title: "Success",
        description: "Character deleted successfully",
      });
    } catch (error) {
      console.error('Error deleting character:', error);
      toast({
        title: "Error",
        description: "Failed to delete character",
        variant: "destructive",
      });
    }
  };

  /**
   * Navigates to character creation page
   */
  const handleCreateNew = () => {
    navigate('/characters/create');
  };

  if (loading) {
    return <div className="flex justify-center items-center min-h-screen">Loading characters...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-2">
          <Users className="w-6 h-6" />
          <h1 className="text-2xl font-bold">Your Characters</h1>
        </div>
        <Button onClick={handleCreateNew} className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Create New Character
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {characters.map((character) => (
          <CharacterCard
            key={character.id}
            character={character}
            onDelete={handleDeleteCharacter}
          />
        ))}
      </div>

      {characters.length === 0 && <EmptyState onCreateNew={handleCreateNew} />}
    </div>
  );
};

export default CharacterList;