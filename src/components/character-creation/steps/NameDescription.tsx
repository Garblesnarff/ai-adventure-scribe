import React from 'react';
import { useCharacter } from '@/contexts/CharacterContext';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { User, Text } from 'lucide-react';

/**
 * Component for handling character name and description input
 * Provides form fields for entering character details with proper validation
 * @returns {JSX.Element} The name and description form step
 */
const NameDescription: React.FC = () => {
  const { state, dispatch } = useCharacter();

  /**
   * Updates the character name in context
   * @param {React.ChangeEvent<HTMLInputElement>} e - Input change event
   */
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    dispatch({
      type: 'UPDATE_CHARACTER',
      payload: { name: e.target.value }
    });
  };

  /**
   * Updates the character description in context
   * @param {React.ChangeEvent<HTMLTextAreaElement>} e - Textarea change event
   */
  const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    dispatch({
      type: 'UPDATE_CHARACTER',
      payload: { description: e.target.value }
    });
  };

  return (
    <div className="space-y-6 p-4">
      <div className="space-y-2">
        <Label htmlFor="character-name" className="flex items-center gap-2">
          <User className="h-4 w-4" />
          Character Name <span className="text-red-500">*</span>
        </Label>
        <Input
          id="character-name"
          placeholder="Enter character name"
          value={state.character?.name || ''}
          onChange={handleNameChange}
          className="w-full"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="character-description" className="flex items-center gap-2">
          <Text className="h-4 w-4" />
          Character Description
        </Label>
        <Textarea
          id="character-description"
          placeholder="Describe your character's appearance, personality, and background..."
          value={state.character?.description || ''}
          onChange={handleDescriptionChange}
          className="min-h-[150px] w-full"
        />
      </div>
    </div>
  );
};

export default NameDescription;