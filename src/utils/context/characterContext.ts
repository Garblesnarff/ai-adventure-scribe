import { supabase } from '@/integrations/supabase/client';
import { Character } from '@/types/character';

/**
 * Interface for formatted character context
 */
interface FormattedCharacterContext {
  basicInfo: {
    name: string;
    race: string;
    class: string;
    level: number;
    background?: string;
  };
  stats: {
    strength: number;
    dexterity: number;
    constitution: number;
    intelligence: number;
    wisdom: number;
    charisma: number;
    hitPoints: {
      current: number;
      max: number;
    };
    armorClass: number;
  };
  equipment: Array<{
    name: string;
    type: string;
    equipped: boolean;
  }>;
}

/**
 * Fetches and formats character context
 * @param characterId - UUID of the character
 * @returns Formatted character context or null if not found
 */
export const buildCharacterContext = async (
  characterId: string
): Promise<FormattedCharacterContext | null> => {
  try {
    console.log('[Context] Fetching character data:', characterId);
    
    const { data: characterData, error: characterError } = await supabase
      .from('characters')
      .select(`
        *,
        character_stats(*),
        character_equipment(*)
      `)
      .eq('id', characterId)
      .maybeSingle();

    if (characterError) throw characterError;
    if (!characterData) return null;

    return {
      basicInfo: {
        name: characterData.name,
        race: characterData.race,
        class: characterData.class,
        level: characterData.level,
        background: characterData.background,
      },
      stats: {
        strength: characterData.character_stats.strength,
        dexterity: characterData.character_stats.dexterity,
        constitution: characterData.character_stats.constitution,
        intelligence: characterData.character_stats.intelligence,
        wisdom: characterData.character_stats.wisdom,
        charisma: characterData.character_stats.charisma,
        hitPoints: {
          current: characterData.character_stats.current_hit_points,
          max: characterData.character_stats.max_hit_points,
        },
        armorClass: characterData.character_stats.armor_class,
      },
      equipment: characterData.character_equipment.map((item: any) => ({
        name: item.item_name,
        type: item.item_type,
        equipped: item.equipped,
      })),
    };
  } catch (error) {
    console.error('[Context] Error building character context:', error);
    return null;
  }
};