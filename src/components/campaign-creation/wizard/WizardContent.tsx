import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { useCampaign } from '@/contexts/CampaignContext';
import { useToast } from '@/components/ui/use-toast';
import StepNavigation from '../shared/StepNavigation';
import ProgressIndicator from '../shared/ProgressIndicator';
import { wizardSteps } from './constants';
import { supabase } from '@/integrations/supabase/client';

/**
 * Main content component for the campaign creation wizard
 * Handles step navigation, validation, and campaign saving
 */
const WizardContent: React.FC = () => {
  const { state } = useCampaign();
  const [currentStep, setCurrentStep] = React.useState(0);
  const [isSaving, setIsSaving] = React.useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  /**
   * Validates the current campaign state
   * @returns {boolean} True if campaign data is valid, false otherwise
   */
  const validateCampaign = () => {
    if (!state.campaign) return false;
    const { name, genre, campaign_length, tone } = state.campaign;
    return !!(name && genre && campaign_length && tone);
  };

  /**
   * Saves the campaign to the database
   * @returns {Promise<string>} The ID of the saved campaign
   */
  const saveCampaign = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to create a campaign.",
        variant: "destructive",
      });
      // You might want to redirect to login page here
      throw new Error('Authentication required');
    }

    const { data, error } = await supabase
      .from('campaigns')
      .insert([
        {
          ...state.campaign,
          user_id: user.id,
        }
      ])
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      throw error;
    }

    if (!data) {
      throw new Error('No data returned from insert');
    }

    return data.id;
  };

  /**
   * Handles navigation to the next step
   * On final step, validates and saves the campaign
   */
  const handleNext = async () => {
    if (currentStep < wizardSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      if (!validateCampaign()) {
        toast({
          title: "Incomplete Campaign",
          description: "Please complete all required fields before saving.",
          variant: "destructive",
        });
        return;
      }

      setIsSaving(true);
      try {
        const campaignId = await saveCampaign();
        toast({
          title: "Success",
          description: "Campaign created successfully!",
        });
        navigate(`/campaign/${campaignId}`);
      } catch (error) {
        console.error('Error saving campaign:', error);
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : "Failed to create campaign. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsSaving(false);
      }
    }
  };

  /**
   * Handles navigation to the previous step
   */
  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Get the component for the current step
  const CurrentStepComponent = wizardSteps[currentStep].component;

  return (
    <div className="container mx-auto px-4 py-8">
      <Card className="p-6 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
        <h1 className="text-3xl font-bold text-center mb-8">Create Your Campaign</h1>
        <ProgressIndicator currentStep={currentStep} totalSteps={wizardSteps.length} />
        <CurrentStepComponent />
        <StepNavigation
          currentStep={currentStep}
          totalSteps={wizardSteps.length}
          onNext={handleNext}
          onPrevious={handlePrevious}
          isLoading={isSaving}
        />
      </Card>
    </div>
  );
};

export default WizardContent;