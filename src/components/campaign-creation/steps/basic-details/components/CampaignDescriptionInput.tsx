import React from 'react';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useBasicDetailsForm } from '../hooks/useBasicDetailsForm';
import { useBasicDetailsValidation } from '../hooks/useBasicDetailsValidation';
import DescriptionGeneratorButton from './DescriptionGeneratorButton';

/**
 * Campaign description input component with AI generation
 */
const CampaignDescriptionInput: React.FC = () => {
  const { campaign, handleChange } = useBasicDetailsForm();
  const { handleBlur } = useBasicDetailsValidation();

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <Label htmlFor="description">Campaign Description</Label>
        <DescriptionGeneratorButton 
          onGenerate={(description) => handleChange('description', description)} 
        />
      </div>
      <Textarea
        id="description"
        value={campaign?.description || ''}
        onChange={(e) => handleChange('description', e.target.value)}
        onBlur={() => handleBlur('description')}
        placeholder="Describe your campaign"
        className="h-32"
      />
    </div>
  );
};

export default CampaignDescriptionInput;