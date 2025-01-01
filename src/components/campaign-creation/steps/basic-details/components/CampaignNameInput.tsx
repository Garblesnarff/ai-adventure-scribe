import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useBasicDetailsForm } from '../hooks/useBasicDetailsForm';
import { useBasicDetailsValidation } from '../hooks/useBasicDetailsValidation';

/**
 * Campaign name input component with validation
 */
const CampaignNameInput: React.FC = () => {
  const { campaign, handleChange } = useBasicDetailsForm();
  const { handleBlur, getNameError } = useBasicDetailsValidation();
  
  const nameError = getNameError(campaign?.name);

  return (
    <div className="space-y-2">
      <Label htmlFor="name" className="flex items-center">
        Campaign Name
        <span className="text-destructive ml-1">*</span>
      </Label>
      <Input
        id="name"
        value={campaign?.name || ''}
        onChange={(e) => handleChange('name', e.target.value)}
        onBlur={() => handleBlur('name')}
        placeholder="Enter campaign name"
        className={nameError ? 'border-destructive' : ''}
      />
      {nameError && (
        <p className="text-sm text-destructive mt-1">{nameError}</p>
      )}
    </div>
  );
};

export default CampaignNameInput;