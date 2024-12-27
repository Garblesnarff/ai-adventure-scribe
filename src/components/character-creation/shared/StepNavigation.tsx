import React from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface StepNavigationProps {
  currentStep: number;
  totalSteps: number;
  onNext: () => void;
  onPrevious: () => void;
  isNextDisabled?: boolean;
}

const StepNavigation: React.FC<StepNavigationProps> = ({
  currentStep,
  totalSteps,
  onNext,
  onPrevious,
  isNextDisabled = false,
}) => {
  return (
    <div className="flex justify-between mt-6">
      <Button
        variant="outline"
        onClick={onPrevious}
        disabled={currentStep === 0}
        className="w-32"
      >
        <ChevronLeft className="mr-2 h-4 w-4" />
        Previous
      </Button>
      <Button
        onClick={onNext}
        disabled={isNextDisabled || currentStep === totalSteps - 1}
        className="w-32"
      >
        {currentStep === totalSteps - 1 ? 'Finish' : 'Next'}
        {currentStep !== totalSteps - 1 && <ChevronRight className="ml-2 h-4 w-4" />}
      </Button>
    </div>
  );
};

export default StepNavigation;