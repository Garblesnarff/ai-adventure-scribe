import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { CharacterProvider, useCharacter } from '@/contexts/CharacterContext';
import StepNavigation from './shared/StepNavigation';
import ProgressIndicator from './shared/ProgressIndicator';
import RaceSelection from './steps/RaceSelection';
import ClassSelection from './steps/ClassSelection';
import AbilityScoresSelection from './steps/AbilityScoresSelection';
import BackgroundSelection from './steps/BackgroundSelection';
import EquipmentSelection from './steps/EquipmentSelection';
import { useCharacterSave } from '@/hooks/useCharacterSave';
import { useToast } from '@/components/ui/use-toast';

/**
 * Array of steps in the character creation process
 * Each step has a component and label for navigation
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
 * Handles step navigation, validation, and character saving
 */
const WizardContent: React.FC = () => {
  const { state } = useCharacter();
  const [currentStep, setCurrentStep] = React.useState(0);
  const { saveCharacter, isSaving } = useCharacterSave();
  const navigate = useNavigate();
  const { toast } = useToast();

  /**
   * Validates the current character state
   * Checks if all required fields are present and properly set
   * @returns {boolean} True if character data is valid, false otherwise
   */
  const validateCharacter = () => {
    if (!state.character) return false;
    const { race, class: characterClass, abilityScores, background } = state.character;
    return !!(race && characterClass && abilityScores && background);
  };

  /**
   * Handles navigation to the next step
   * On final step, validates and saves the complete character
   * @returns {Promise<void>}
   */
  const handleNext = async () => {
    if (currentStep < steps.length - 1) {
      // Simply move to next step without saving
      setCurrentStep(currentStep + 1);
    } else {
      // On final step, validate and save character
      if (state.character) {
        if (!validateCharacter()) {
          toast({
            title: "Incomplete Character",
            description: "Please complete all required fields before saving.",
            variant: "destructive",
          });
          return;
        }

        try {
          const savedCharacter = await saveCharacter(state.character);
          if (savedCharacter?.id) {
            toast({
              title: "Success",
              description: "Character created successfully!",
            });
            navigate(`/character/${savedCharacter.id}`);
          }
        } catch (error) {
          console.error('Error saving character:', error);
          toast({
            title: "Error",
            description: "Failed to save character data",
            variant: "destructive",
          });
        }
      }
    }
  };

  /**
   * Handles navigation to the previous step
   * Allows users to move backwards through the creation process
   */
  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Get the component for the current step
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
 * Ensures all child components have access to character state
 * @returns {JSX.Element} The complete character creation wizard
 */
const CharacterWizard: React.FC = () => {
  return (
    <CharacterProvider>
      <WizardContent />
    </CharacterProvider>
  );
};

export default CharacterWizard;