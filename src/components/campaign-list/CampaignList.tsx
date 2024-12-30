import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import CampaignCard from './CampaignCard';
import EmptyState from './EmptyState';

/**
 * CampaignList component
 * Fetches and displays all campaigns for the current user
 */
const CampaignList = () => {
  // Fetch campaigns from Supabase
  const { data: campaigns, isLoading, error } = useQuery({
    queryKey: ['campaigns'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('campaigns')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  // Show loading state
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(3)].map((_, i) => (
          <div 
            key={i}
            className="h-48 bg-muted animate-pulse rounded-lg"
          />
        ))}
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="text-center text-destructive">
        Error loading campaigns. Please try again.
      </div>
    );
  }

  // Show empty state if no campaigns
  if (!campaigns?.length) {
    return <EmptyState />;
  }

  // Render campaign grid
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {campaigns.map((campaign) => (
        <CampaignCard key={campaign.id} campaign={campaign} />
      ))}
    </div>
  );
};

export default CampaignList;