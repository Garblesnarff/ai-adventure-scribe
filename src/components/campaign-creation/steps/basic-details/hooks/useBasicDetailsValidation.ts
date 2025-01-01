import { useState } from 'react';

/**
 * Custom hook for managing form validation state and logic
 * @returns Object containing validation state and handlers
 */
export const useBasicDetailsValidation = () => {
  const [touched, setTouched] = useState({
    name: false,
    description: false
  });

  /**
   * Handles input field blur events
   * @param field - Field name that was blurred
   */
  const handleBlur = (field: string) => {
    setTouched(prev => ({
      ...prev,
      [field]: true
    }));
  };

  /**
   * Gets validation error for campaign name
   * @param name - Campaign name to validate
   * @returns Error message if validation fails, empty string otherwise
   */
  const getNameError = (name?: string) => {
    if (touched.name && (!name || !name.trim())) {
      return "Campaign name is required";
    }
    return "";
  };

  return {
    touched,
    handleBlur,
    getNameError
  };
};