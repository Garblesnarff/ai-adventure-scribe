import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useCampaign } from '@/contexts/CampaignContext';

/**
 * Basic campaign details component
 * Handles campaign name and description input with validation
 */
const BasicDetails: React.FC = () => {
  const { state, dispatch } = useCampaign();
  const [touched, setTouched] = React.useState({
    name: false,
    description: false
  });

  const handleChange = (field: string, value: string) => {
    dispatch({
      type: 'UPDATE_CAMPAIGN',
      payload: { [field]: value }
    });
  };

  const handleBlur = (field: string) => {
    setTouched(prev => ({
      ...prev,
      [field]: true
    }));
  };

  const getNameError = () => {
    if (touched.name && (!state.campaign?.name || !state.campaign.name.trim())) {
      return "Campaign name is required";
    }
    return "";
  };

  const nameError = getNameError();

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="name" className="flex items-center">
          Campaign Name
          <span className="text-destructive ml-1">*</span>
        </Label>
        <Input
          id="name"
          value={state.campaign?.name || ''}
          onChange={(e) => handleChange('name', e.target.value)}
          onBlur={() => handleBlur('name')}
          placeholder="Enter campaign name"
          className={nameError ? 'border-destructive' : ''}
        />
        {nameError && (
          <p className="text-sm text-destructive mt-1">{nameError}</p>
        )}
      </div>
      <div className="space-y-2">
        <Label htmlFor="description">Campaign Description</Label>
        <Textarea
          id="description"
          value={state.campaign?.description || ''}
          onChange={(e) => handleChange('description', e.target.value)}
          onBlur={() => handleBlur('description')}
          placeholder="Describe your campaign"
          className="h-32"
        />
      </div>
    </div>
  );
};

export default BasicDetails;