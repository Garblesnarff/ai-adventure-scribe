import { supabase } from '@/integrations/supabase/client';
import { Campaign, ThematicElements } from '@/types/campaign';

/**
 * Interface for formatted campaign context including world and quest data
 */
interface FormattedCampaignContext {
  basicInfo: {
    name: string;
    description?: string;
    genre?: string;
    difficulty_level?: string;
    status?: string;
  };
  setting: {
    era?: string;
    location?: string;
    atmosphere?: string;
    world?: {
      name?: string;
      climate_type?: string;
      magic_level?: string;
      technology_level?: string;
    };
  };
  thematicElements: ThematicElements;
  activeQuests?: Array<{
    title: string;
    description?: string;
    difficulty?: string;
    status: string;
  }>;
}

/**
 * Fetches and formats campaign context with enhanced world and quest information
 * @param campaignId - UUID of the campaign
 * @returns Formatted campaign context or null if not found
 */
export const buildCampaignContext = async (
  campaignId: string
): Promise<FormattedCampaignContext | null> => {
  try {
    console.log('[Context] Fetching campaign data:', campaignId);
    
    // Fetch campaign with related world data
    const { data: campaign, error: campaignError } = await supabase
      .from('campaigns')
      .select(`
        *,
        worlds (
          name,
          climate_type,
          magic_level,
          technology_level
        )
      `)
      .eq('id', campaignId)
      .maybeSingle();

    if (campaignError) throw campaignError;
    if (!campaign) return null;

    // Fetch active quests for the campaign
    const { data: quests, error: questsError } = await supabase
      .from('quests')
      .select('title, description, difficulty, status')
      .eq('campaign_id', campaignId)
      .eq('status', 'active');

    if (questsError) throw questsError;

    // Type assertion and validation for thematic_elements
    const rawThematicElements = campaign.thematic_elements as Record<string, unknown>;
    const thematicElements: ThematicElements = {
      mainThemes: Array.isArray(rawThematicElements?.mainThemes) ? rawThematicElements.mainThemes as string[] : [],
      recurringMotifs: Array.isArray(rawThematicElements?.recurringMotifs) ? rawThematicElements.recurringMotifs as string[] : [],
      keyLocations: Array.isArray(rawThematicElements?.keyLocations) ? rawThematicElements.keyLocations as string[] : [],
      importantNPCs: Array.isArray(rawThematicElements?.importantNPCs) ? rawThematicElements.importantNPCs as string[] : [],
    };

    // Get the first associated world (assuming one world per campaign)
    const world = campaign.worlds?.[0];

    return {
      basicInfo: {
        name: campaign.name,
        description: campaign.description,
        genre: campaign.genre,
        difficulty_level: campaign.difficulty_level,
        status: campaign.status,
      },
      setting: {
        era: campaign.era,
        location: campaign.location,
        atmosphere: campaign.atmosphere,
        world: world ? {
          name: world.name,
          climate_type: world.climate_type,
          magic_level: world.magic_level,
          technology_level: world.technology_level,
        } : undefined,
      },
      thematicElements,
      activeQuests: quests,
    };
  } catch (error) {
    console.error('[Context] Error building campaign context:', error);
    return null;
  }
};