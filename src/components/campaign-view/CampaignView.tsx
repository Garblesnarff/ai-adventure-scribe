import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';
import { Trash2 } from 'lucide-react';
import { isValidUUID } from '@/utils/validation';

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
 * Includes error handling and loading states
 * @returns {JSX.Element} The campaign view page
 */
const CampaignView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [campaign, setCampaign] = React.useState<Campaign | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [isDeleting, setIsDeleting] = React.useState(false);
  const { toast } = useToast();

  /**
   * Validates campaign ID and redirects if invalid
   */
  React.useEffect(() => {
    if (!id || !isValidUUID(id)) {
      toast({
        title: "Invalid Campaign",
        description: "The campaign ID is invalid. Redirecting to home page.",
        variant: "destructive",
      });
      navigate('/');
      return;
    }
  }, [id, navigate, toast]);

  /**
   * Fetches campaign data from Supabase
   */
  React.useEffect(() => {
    const fetchCampaign = async () => {
      try {
        if (!id || !isValidUUID(id)) return;

        const { data, error } = await supabase
          .from('campaigns')
          .select('*')
          .eq('id', id)
          .maybeSingle();

        if (error) throw error;
        
        if (!data) {
          toast({
            title: "Campaign Not Found",
            description: "The requested campaign could not be found. Redirecting to home page.",
            variant: "destructive",
          });
          navigate('/');
          return;
        }
        
        setCampaign(data as Campaign);
      } catch (error) {
        console.error('Error fetching campaign:', error);
        toast({
          title: "Error",
          description: "Failed to load campaign data. Please try again.",
          variant: "destructive",
        });
        navigate('/');
      } finally {
        setLoading(false);
      }
    };

    fetchCampaign();
  }, [id, toast, navigate]);

  /**
   * Handles campaign deletion
   */
  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      if (!id) throw new Error('No campaign ID provided');

      const { error } = await supabase
        .from('campaigns')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Campaign deleted successfully",
      });
      navigate('/');
    } catch (error) {
      console.error('Error deleting campaign:', error);
      toast({
        title: "Error",
        description: "Failed to delete campaign",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="p-6 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
          <div className="flex justify-center items-center min-h-[200px]">
            Loading campaign data...
          </div>
        </Card>
      </div>
    );
  }

  if (!campaign) {
    return null; // Early return handled by useEffect
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Card className="p-6 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
        <div className="flex justify-between items-start mb-8">
          <h1 className="text-3xl font-bold">{campaign.name}</h1>
          <Button
            variant="destructive"
            size="icon"
            onClick={handleDelete}
            disabled={isDeleting}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
        
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