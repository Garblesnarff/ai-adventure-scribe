import { supabase } from '@/integrations/supabase/client';
import { Campaign } from '@/types/campaign';

/**
 * Interface for formatted campaign context
 */
interface FormattedCampaignContext {
  basicInfo: {
    name: string;
    description?: string;
    genre?: string;
    difficulty_level?: string;
  };
  setting: {
    era?: string;
    location?: string;
    atmosphere?: string;
  };
  thematicElements: {
    mainThemes: string[];
    recurringMotifs: string[];
    keyLocations: string[];
    importantNPCs: string[];
  };
}

/**
 * Fetches and formats campaign context
 * @param campaignId - UUID of the campaign
 * @returns Formatted campaign context or null if not found
 */
export const buildCampaignContext = async (
  campaignId: string
): Promise<FormattedCampaignContext | null> => {
  try {
    console.log('[Context] Fetching campaign data:', campaignId);
    
    const { data: campaign, error } = await supabase
      .from('campaigns')
      .select('*')
      .eq('id', campaignId)
      .maybeSingle();

    if (error) throw error;
    if (!campaign) return null;

    return {
      basicInfo: {
        name: campaign.name,
        description: campaign.description,
        genre: campaign.genre,
        difficulty_level: campaign.difficulty_level,
      },
      setting: {
        era: campaign.era,
        location: campaign.location,
        atmosphere: campaign.atmosphere,
      },
      thematicElements: campaign.thematic_elements || {
        mainThemes: [],
        recurringMotifs: [],
        keyLocations: [],
        importantNPCs: [],
      },
    };
  } catch (error) {
    console.error('[Context] Error building campaign context:', error);
    return null;
  }
};