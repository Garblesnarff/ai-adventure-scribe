import React from 'react';
import { Card } from '@/components/ui/card';
import { CharacterProvider, useCharacter } from '@/contexts/CharacterContext';
import StepNavigation from './shared/StepNavigation';
import ProgressIndicator from './shared/ProgressIndicator';
import RaceSelection from './steps/RaceSelection';
import ClassSelection from './steps/ClassSelection';
import AbilityScoresSelection from './steps/AbilityScoresSelection';
import BackgroundSelection from './steps/BackgroundSelection';
import EquipmentSelection from './steps/EquipmentSelection';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { transformCharacterForStorage } from '@/types/character';

/**
 * Array of steps in the character creation process
 * Each step has a component and label
 */
const steps = [
  { component: RaceSelection, label: 'Race' },
  { component: ClassSelection, label: 'Class' },
  { component: AbilityScoresSelection, label: 'Ability Scores' },
  { component: BackgroundSelection, label: 'Background' },
  { component: EquipmentSelection, label: 'Equipment' },
];

/**
 * Main content component for the character creation wizard
 * Handles step navigation and component rendering
 */
const WizardContent: React.FC = () => {
  const { state, dispatch } = useCharacter();
  const [currentStep, setCurrentStep] = React.useState(0);
  const { toast } = useToast();
  const [isSaving, setIsSaving] = React.useState(false);

  /**
   * Saves the current character state to Supabase
   * Handles both creation and updates
   */
  const saveCharacter = async () => {
    if (!state.character) return;

    try {
      setIsSaving(true);
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        toast({
          title: "Authentication Error",
          description: "Please sign in to save your character.",
          variant: "destructive",
        });
        return;
      }

      // Transform character data for storage
      const characterData = transformCharacterForStorage({
        ...state.character,
        user_id: user.id,
      });

      // Insert character data
      const { error: characterError } = await supabase
        .from('characters')
        .upsert(characterData, { onConflict: 'id' });

      if (characterError) throw characterError;

      // Insert character stats
      const { error: statsError } = await supabase
        .from('character_stats')
        .upsert({
          character_id: characterData.id,
          ...state.character.abilityScores,
        }, { onConflict: 'character_id' });

      if (statsError) throw statsError;

      // Insert equipment
      if (state.character.equipment.length > 0) {
        const equipmentData = state.character.equipment.map(item => ({
          character_id: characterData.id,
          item_name: item,
          item_type: 'starting_equipment',
        }));

        const { error: equipmentError } = await supabase
          .from('character_equipment')
          .upsert(equipmentData, { onConflict: 'character_id,item_name' });

        if (equipmentError) throw equipmentError;
      }

      toast({
        title: "Success",
        description: "Character saved successfully!",
      });
    } catch (error) {
      console.error('Error saving character:', error);
      toast({
        title: "Error",
        description: "Failed to save character. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  /**
   * Handles navigation to the next step
   * Attempts to save character data when moving between steps
   */
  const handleNext = async () => {
    if (currentStep < steps.length - 1) {
      await saveCharacter();
      setCurrentStep(currentStep + 1);
    }
  };

  /**
   * Handles navigation to the previous step
   */
  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const CurrentStepComponent = steps[currentStep].component;

  return (
    <div className="container mx-auto px-4 py-8">
      <Card className="p-6 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
        <h1 className="text-3xl font-bold text-center mb-8">Create Your Character</h1>
        <ProgressIndicator currentStep={currentStep} totalSteps={steps.length} />
        <CurrentStepComponent />
        <StepNavigation
          currentStep={currentStep}
          totalSteps={steps.length}
          onNext={handleNext}
          onPrevious={handlePrevious}
          isLoading={isSaving}
        />
      </Card>
    </div>
  );
};

/**
 * Wrapper component that provides character context to the wizard
 */
const CharacterWizard: React.FC = () => {
  return (
    <CharacterProvider>
      <WizardContent />
    </CharacterProvider>
  );
};

export default CharacterWizard;