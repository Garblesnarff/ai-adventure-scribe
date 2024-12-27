import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Character } from '@/types/character';
import { transformCharacterForStorage } from '@/types/character';
import { transformAbilityScoresForStorage, transformEquipmentForStorage } from '@/utils/characterTransformations';
import { useToast } from '@/components/ui/use-toast';

/**
 * Constant UUID for local users when no authentication is present
 * This follows the UUID v4 format required by Supabase
 */
const LOCAL_USER_ID = '00000000-0000-0000-0000-000000000000';

/**
 * Custom hook for handling character data persistence
 * Provides methods and state for saving character data to Supabase
 */
export const useCharacterSave = () => {
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  /**
   * Saves character data to Supabase
   * Handles both creation and updates of character data
   * @param character - The character data to save
   * @returns Promise<boolean> indicating success/failure
   */
  const saveCharacter = async (character: Character): Promise<boolean> => {
    if (!character) return false;

    try {
      setIsSaving(true);
      
      // Get current user if authenticated
      const { data: { user } } = await supabase.auth.getUser();
      
      // Transform and save character data
      const characterData = transformCharacterForStorage({
        ...character,
        // Use authenticated user ID if available, otherwise use local UUID
        user_id: user?.id || LOCAL_USER_ID,
      });

      const { error: characterError } = await supabase
        .from('characters')
        .upsert(characterData, { onConflict: 'id' });

      if (characterError) throw characterError;

      // Transform and save character stats
      const statsData = transformAbilityScoresForStorage(
        character.abilityScores,
        characterData.id
      );

      const { error: statsError } = await supabase
        .from('character_stats')
        .upsert(statsData, { onConflict: 'character_id' });

      if (statsError) throw statsError;

      // Save equipment if present
      if (character.equipment.length > 0) {
        const equipmentData = transformEquipmentForStorage(
          character.equipment,
          characterData.id
        );

        const { error: equipmentError } = await supabase
          .from('character_equipment')
          .upsert(equipmentData, { onConflict: 'character_id,item_name' });

        if (equipmentError) throw equipmentError;
      }

      toast({
        title: "Success",
        description: "Character saved successfully!",
      });
      return true;
    } catch (error) {
      console.error('Error saving character:', error);
      toast({
        title: "Error",
        description: "Failed to save character. Please try again.",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  return {
    saveCharacter,
    isSaving
  };
};