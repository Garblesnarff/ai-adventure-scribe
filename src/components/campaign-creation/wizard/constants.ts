import BasicDetails from '../steps/BasicDetails';
import GenreSelection from '../steps/GenreSelection';
import CampaignParameters from '../steps/CampaignParameters';
import { WizardStep } from './types';

/**
 * Array of steps in the campaign creation process
 * Each step has a component and label for navigation
 */
export const wizardSteps: WizardStep[] = [
  { component: BasicDetails, label: 'Details' },
  { component: GenreSelection, label: 'Genre' },
  { component: CampaignParameters, label: 'Parameters' },
];