import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import CampaignList from '@/components/campaign-list/CampaignList';
import { GameInterface } from '@/components/GameInterface';

/**
 * Index page component serving as the landing page
 * Displays available campaigns and game interface
 * @returns {JSX.Element} The index page with campaign list and chat
 */
const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Campaigns Section */}
        <div>
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold">Your Campaigns</h1>
            <Button 
              onClick={() => navigate('/campaigns/create')}
              className="flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              New Campaign
            </Button>
          </div>
          <CampaignList />
        </div>

        {/* Game Chat Section */}
        <div>
          <h2 className="text-3xl font-bold mb-8">Game Chat</h2>
          <GameInterface />
        </div>
      </div>
    </div>
  );
};

export default Index;