import React from 'react';
import { Button } from '@/components/ui/button';

interface StepNavigationProps {
  currentStep: number;
  totalSteps: number;
  onNext: () => void;
  onPrevious: () => void;
}

/**
 * Navigation component for the campaign creation wizard
 * Handles next/previous navigation
 */
const StepNavigation: React.FC<StepNavigationProps> = ({
  currentStep,
  totalSteps,
  onNext,
  onPrevious,
}) => {
  return (
    <div className="flex justify-between mt-6">
      <Button
        variant="outline"
        onClick={onPrevious}
        disabled={currentStep === 0}
      >
        Previous
      </Button>
      <Button onClick={onNext}>
        {currentStep === totalSteps - 1 ? 'Finish' : 'Next'}
      </Button>
    </div>
  );
};

export default StepNavigation;