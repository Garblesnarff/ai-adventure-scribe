import React from 'react';
import { WizardStepProps } from '../../wizard/types';
import { Skeleton } from '@/components/ui/skeleton';
import CampaignNameInput from './components/CampaignNameInput';
import CampaignDescriptionInput from './components/CampaignDescriptionInput';

/**
 * Basic campaign details component
 * Handles campaign name and description input with validation
 */
const BasicDetails: React.FC<WizardStepProps> = ({ isLoading = false }) => {
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-10 w-full" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-32 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <CampaignNameInput />
      <CampaignDescriptionInput />
    </div>
  );
};

export default BasicDetails;