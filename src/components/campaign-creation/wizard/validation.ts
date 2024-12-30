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
  const requiredFields = {
    difficulty_level: "Difficulty Level",
    campaign_length: "Campaign Length",
    tone: "Campaign Tone"
  };

  for (const [field, label] of Object.entries(requiredFields)) {
    if (!campaign?.[field]) {
      toast({
        title: `Missing ${label}`,
        description: `Please select a ${label.toLowerCase()} for your campaign.`,
        variant: "destructive",
      });
      return false;
    }
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
  
  const missingFields = [];
  if (!name?.trim()) missingFields.push("Name");
  if (!genre) missingFields.push("Genre");
  if (!campaign_length) missingFields.push("Campaign Length");
  if (!tone) missingFields.push("Tone");
  if (!difficulty_level) missingFields.push("Difficulty Level");

  if (missingFields.length > 0) {
    toast({
      title: "Incomplete Campaign",
      description: `Missing required fields: ${missingFields.join(", ")}`,
      variant: "destructive",
    });
    return false;
  }

  return true;
};