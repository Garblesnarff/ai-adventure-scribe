import React from 'react';
import { useParams } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';

/**
 * Type for Campaign data structure from Supabase
 */
type CampaignRow = Database['public']['Tables']['campaigns']['Row'];

/**
 * Interface for Campaign data structure with proper type handling
 */
interface Campaign {
  id: string;
  name: string;
  description?: string | null;
  genre?: string | null;
  difficulty_level?: string | null;
  campaign_length?: CampaignRow['campaign_length'];
  tone?: CampaignRow['tone'];
  setting_details?: Record<string, any> | null;
  status?: string | null;
  user_id: string;
  created_at?: string | null;
  updated_at?: string | null;
}

/**
 * CampaignView component displays the details of a specific campaign
 * @returns {JSX.Element} The campaign view page
 */
const CampaignView: React.FC = () => {
  const { id } = useParams();
  const [campaign, setCampaign] = React.useState<Campaign | null>(null);
  const [loading, setLoading] = React.useState(true);
  const { toast } = useToast();

  /**
   * Fetches campaign data from Supabase
   */
  React.useEffect(() => {
    const fetchCampaign = async () => {
      try {
        if (!id) throw new Error('No campaign ID provided');

        const { data, error } = await supabase
          .from('campaigns')
          .select()
          .eq('id', id)
          .maybeSingle();

        if (error) throw error;
        if (!data) throw new Error('Campaign not found');
        
        setCampaign(data as Campaign);
      } catch (error) {
        console.error('Error fetching campaign:', error);
        toast({
          title: "Error",
          description: "Failed to load campaign data",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchCampaign();
  }, [id, toast]);

  if (loading) {
    return <div className="flex justify-center items-center min-h-screen">Loading campaign data...</div>;
  }

  if (!campaign) {
    return <div className="flex justify-center items-center min-h-screen">Campaign not found</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Card className="p-6 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
        <h1 className="text-3xl font-bold text-center mb-8">{campaign.name}</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Campaign Details</h2>
            <div className="space-y-2">
              {campaign.description && (
                <p className="text-gray-600">{campaign.description}</p>
              )}
              {campaign.genre && (
                <p><span className="font-medium">Genre:</span> {campaign.genre}</p>
              )}
              {campaign.difficulty_level && (
                <p><span className="font-medium">Difficulty:</span> {campaign.difficulty_level}</p>
              )}
            </div>
          </div>

          {/* Campaign Parameters */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Campaign Parameters</h2>
            <div className="space-y-2">
              {campaign.campaign_length && (
                <p><span className="font-medium">Length:</span> {campaign.campaign_length}</p>
              )}
              {campaign.tone && (
                <p><span className="font-medium">Tone:</span> {campaign.tone}</p>
              )}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default CampaignView;