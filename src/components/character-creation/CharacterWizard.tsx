import React from 'react';
import { Card } from '@/components/ui/card';
import { CharacterProvider, useCharacter } from '@/contexts/CharacterContext';
import StepNavigation from './shared/StepNavigation';
import ProgressIndicator from './shared/ProgressIndicator';
import RaceSelection from './steps/RaceSelection';
import ClassSelection from './steps/ClassSelection';

const steps = [
  { component: RaceSelection, label: 'Race' },
  { component: ClassSelection, label: 'Class' },
  // Additional steps will be added here
];

const WizardContent: React.FC = () => {
  const { state, dispatch } = useCharacter();
  const [currentStep, setCurrentStep] = React.useState(0);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

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
        />
      </Card>
    </div>
  );
};

const CharacterWizard: React.FC = () => {
  return (
    <CharacterProvider>
      <WizardContent />
    </CharacterProvider>
  );
};

export default CharacterWizard;