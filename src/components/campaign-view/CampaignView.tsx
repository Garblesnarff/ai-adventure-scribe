import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { isValidUUID } from '@/utils/validation';
import { CampaignHeader } from './sections/CampaignHeader';
import { CampaignDetails } from './sections/CampaignDetails';
import { CampaignParameters } from './sections/CampaignParameters';
import { GameSession } from './sections/GameSession';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown } from 'lucide-react';

/**
 * CampaignView component displays campaign details and handles game sessions
 */
const CampaignView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [campaign, setCampaign] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = React.useState(true);
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
        
        setCampaign(data);
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
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Card className="p-6 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
        <CampaignHeader 
          campaign={campaign}
          isDeleting={isDeleting}
          onDelete={handleDelete}
        />
        
        <Collapsible
          open={isDetailsOpen}
          onOpenChange={setIsDetailsOpen}
          className="mb-8"
        >
          <CollapsibleTrigger className="flex items-center gap-2 w-full p-4 bg-primary/10 hover:bg-primary/20 rounded-lg transition-colors border border-primary/20 shadow-sm hover:shadow-md">
            <ChevronDown 
              className={`h-5 w-5 text-primary transition-transform duration-200 ${
                isDetailsOpen ? 'transform rotate-180' : ''
              }`} 
            />
            <span className="font-semibold text-primary text-lg">Campaign Information</span>
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <CampaignDetails campaign={campaign} />
              <CampaignParameters campaign={campaign} />
            </div>
          </CollapsibleContent>
        </Collapsible>

        <GameSession campaignId={campaign.id} />
      </Card>
    </div>
  );
};

export default CampaignView;