import React from 'react';
import { CampaignProvider } from '@/contexts/CampaignContext';
import WizardContent from './wizard/WizardContent';

/**
 * Wrapper component that provides campaign context to the wizard
 * Ensures all child components have access to campaign state
 * @returns {JSX.Element} The complete campaign creation wizard
 */
const CampaignWizard: React.FC = () => {
  return (
    <CampaignProvider>
      <WizardContent />
    </CampaignProvider>
  );
};

export default CampaignWizard;