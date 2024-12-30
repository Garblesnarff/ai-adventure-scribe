/**
 * Validates the basic details step of campaign creation
 * @param campaign - The campaign data to validate
 * @param toast - Toast function for displaying validation messages
 * @returns boolean indicating if validation passed
 */
export const validateBasicDetails = (campaign: any, toast: any): boolean => {
  if (!campaign?.name?.trim()) {
    toast({
      title: "Missing Campaign Name",
      description: "Please enter a name for your campaign.",
      variant: "destructive",
    });
    return false;
  }
  return true;
};

/**
 * Validates the genre selection step
 * @param campaign - The campaign data to validate
 * @param toast - Toast function for displaying validation messages
 * @returns boolean indicating if validation passed
 */
export const validateGenreSelection = (campaign: any, toast: any): boolean => {
  if (!campaign?.genre) {
    toast({
      title: "Missing Genre",
      description: "Please select a genre for your campaign.",
      variant: "destructive",
    });
    return false;
  }
  return true;
};

/**
 * Validates campaign parameters step
 * @param campaign - The campaign data to validate
 * @param toast - Toast function for displaying validation messages
 * @returns boolean indicating if validation passed
 */
export const validateCampaignParameters = (campaign: any, toast: any): boolean => {
  if (!campaign?.difficulty_level || !campaign?.campaign_length || !campaign?.tone) {
    toast({
      title: "Incomplete Parameters",
      description: "Please complete all campaign parameters before proceeding.",
      variant: "destructive",
    });
    return false;
  }
  return true;
};

/**
 * Validates the complete campaign data
 * @param campaign - The campaign data to validate
 * @param toast - Toast function for displaying validation messages
 * @returns boolean indicating if validation passed
 */
export const validateCompleteCampaign = (campaign: any, toast: any): boolean => {
  if (!campaign) {
    toast({
      title: "Missing Campaign Data",
      description: "Campaign data is incomplete. Please fill in all required fields.",
      variant: "destructive",
    });
    return false;
  }

  const { name, description, genre, campaign_length, tone, difficulty_level } = campaign;
  
  if (!name?.trim() || !genre || !campaign_length || !tone || !difficulty_level) {
    toast({
      title: "Incomplete Campaign",
      description: "Please complete all required fields before saving.",
      variant: "destructive",
    });
    return false;
  }

  return true;
};