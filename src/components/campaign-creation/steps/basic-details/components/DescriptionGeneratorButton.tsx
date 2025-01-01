import React from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, Wand2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useCampaign } from '@/contexts/CampaignContext';

interface DescriptionGeneratorButtonProps {
  onGenerate: (description: string) => void;
}

/**
 * AI-powered description generator button component
 */
const DescriptionGeneratorButton: React.FC<DescriptionGeneratorButtonProps> = ({ onGenerate }) => {
  const [isGenerating, setIsGenerating] = React.useState(false);
  const { state } = useCampaign();
  const { toast } = useToast();

  /**
   * Generates campaign description using AI
   * Requires genre, difficulty level, campaign length, and tone to be set
   */
  const generateDescription = async () => {
    if (!state.campaign?.genre || !state.campaign?.difficulty_level || 
        !state.campaign?.campaign_length || !state.campaign?.tone) {
      toast({
        title: "Missing Information",
        description: "Please complete the genre and parameters steps first.",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-campaign-description', {
        body: {
          genre: state.campaign.genre,
          difficulty: state.campaign.difficulty_level,
          length: state.campaign.campaign_length,
          tone: state.campaign.tone
        }
      });

      if (error) throw error;

      onGenerate(data.description);
      toast({
        title: "Success",
        description: "Campaign description generated successfully!",
      });
    } catch (error) {
      console.error('Error generating description:', error);
      toast({
        title: "Error",
        description: "Failed to generate campaign description. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={generateDescription}
      disabled={isGenerating}
    >
      {isGenerating ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Generating...
        </>
      ) : (
        <>
          <Wand2 className="mr-2 h-4 w-4" />
          Generate Description
        </>
      )}
    </Button>
  );
};

export default DescriptionGeneratorButton;