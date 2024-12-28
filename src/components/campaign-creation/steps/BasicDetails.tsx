import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useCampaign } from '@/contexts/CampaignContext';

/**
 * Basic campaign details component
 * Handles campaign name and description input
 */
const BasicDetails: React.FC = () => {
  const { state, dispatch } = useCampaign();

  const handleChange = (field: string, value: string) => {
    dispatch({
      type: 'UPDATE_CAMPAIGN',
      payload: { [field]: value }
    });
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="name">Campaign Name</Label>
        <Input
          id="name"
          value={state.campaign?.name || ''}
          onChange={(e) => handleChange('name', e.target.value)}
          placeholder="Enter campaign name"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="description">Campaign Description</Label>
        <Textarea
          id="description"
          value={state.campaign?.description || ''}
          onChange={(e) => handleChange('description', e.target.value)}
          placeholder="Describe your campaign"
          className="h-32"
        />
      </div>
    </div>
  );
};

export default BasicDetails;