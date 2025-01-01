import { useCampaign } from '@/contexts/CampaignContext';

/**
 * Custom hook for managing basic details form state and actions
 * @returns Object containing form state and handlers
 */
export const useBasicDetailsForm = () => {
  const { state, dispatch } = useCampaign();

  /**
   * Handles input field changes
   * @param field - Field name to update
   * @param value - New value for the field
   */
  const handleChange = (field: string, value: string) => {
    dispatch({
      type: 'UPDATE_CAMPAIGN',
      payload: { [field]: value }
    });
  };

  return {
    campaign: state.campaign,
    handleChange
  };
};