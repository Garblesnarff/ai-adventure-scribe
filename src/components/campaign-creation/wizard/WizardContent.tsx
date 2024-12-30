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
   * Validates the current step's data
   * @returns {boolean} True if step data is valid, false otherwise
   */
  const validateCurrentStep = () => {
    const currentStepData = wizardSteps[currentStep];
    
    switch (currentStep) {
      case 0: // Basic Details
        if (!state.campaign?.name?.trim()) {
          toast({
            title: "Missing Campaign Name",
            description: "Please enter a name for your campaign.",
            variant: "destructive",
          });
          return false;
        }
        break;
      case 1: // Genre Selection
        if (!state.campaign?.genre) {
          toast({
            title: "Missing Genre",
            description: "Please select a genre for your campaign.",
            variant: "destructive",
          });
          return false;
        }
        break;
      case 2: // Campaign Parameters
        if (!state.campaign?.difficulty_level || !state.campaign?.campaign_length || !state.campaign?.tone) {
          toast({
            title: "Incomplete Parameters",
            description: "Please complete all campaign parameters before proceeding.",
            variant: "destructive",
          });
          return false;
        }
        break;
    }
    return true;
  };

  /**
   * Validates the complete campaign data before saving
   * @returns {boolean} True if campaign data is valid, false otherwise
   */
  const validateCampaign = () => {
    if (!state.campaign) {
      toast({
        title: "Missing Campaign Data",
        description: "Campaign data is incomplete. Please fill in all required fields.",
        variant: "destructive",
      });
      return false;
    }

    const { name, description, genre, campaign_length, tone, difficulty_level } = state.campaign;
    
    if (!name?.trim() || !genre || !campaign_length || !tone || !difficulty_level) {
      toast({
        title: "Incomplete Campaign",
        description: "Please complete all required fields before saving.",
        variant: "destructive",
      });
      return false;
    }

    return true;
  };

  /**
   * Saves the campaign to the database with proper error handling
   * @returns {Promise<string>} The ID of the saved campaign
   */
  const saveCampaign = async () => {
    if (!state.campaign) {
      throw new Error('No campaign data to save');
    }

    try {
      const { data, error } = await supabase
        .from('campaigns')
        .insert([{
          ...state.campaign,
          status: 'active',
          setting_details: state.campaign.setting_details || {},
        }])
        .select()
        .single();

      if (error) {
        console.error('Error saving campaign:', error);
        throw new Error(error.message);
      }

      if (!data) {
        throw new Error('No data returned from insert');
      }

      return data.id;
    } catch (error) {
      console.error('Error in saveCampaign:', error);
      throw error;
    }
  };

  /**
   * Handles navigation to the next step
   * On final step, validates and saves the campaign
   */
  const handleNext = async () => {
    if (!validateCurrentStep()) {
      return;
    }

    if (currentStep < wizardSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      if (!validateCampaign()) {
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