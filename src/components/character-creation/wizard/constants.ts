import RaceSelection from '../steps/RaceSelection';
import ClassSelection from '../steps/ClassSelection';
import AbilityScoresSelection from '../steps/AbilityScoresSelection';
import BackgroundSelection from '../steps/BackgroundSelection';
import EquipmentSelection from '../steps/EquipmentSelection';
import { WizardStep } from './types';

/**
 * Array of steps in the character creation process
 * Each step has a component and label for navigation
 */
export const wizardSteps: WizardStep[] = [
  { component: RaceSelection, label: 'Race' },
  { component: ClassSelection, label: 'Class' },
  { component: AbilityScoresSelection, label: 'Ability Scores' },
  { component: BackgroundSelection, label: 'Background' },
  { component: EquipmentSelection, label: 'Equipment' },
];