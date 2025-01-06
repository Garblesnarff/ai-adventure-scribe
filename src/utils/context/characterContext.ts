import { supabase } from '@/integrations/supabase/client';

/**
 * Fetches and formats character context
 * @param characterId - UUID of the character
 */
export const buildCharacterContext = async (characterId: string) => {
  try {
    const { data: character, error } = await supabase
      .from('characters')
      .select(`
        *,
        character_stats (*),
        character_equipment (*)
      `)
      .eq('id', characterId)
      .single();

    if (error) throw error;
    return character;
  } catch (error) {
    console.error('[Context] Error building character context:', error);
    return null;
  }
};