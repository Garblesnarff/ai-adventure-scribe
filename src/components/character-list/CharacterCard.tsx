import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, Trash2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Character } from '@/types/character';

interface CharacterCardProps {
  character: Partial<Character>;
  onDelete: (id: string) => Promise<void>;
}

/**
 * CharacterCard component displays individual character information in a card format
 * Includes options to view or delete the character
 * The entire card is clickable and navigates to the character sheet
 * Delete button is separated to prevent accidental deletion
 * @param character - The character data to display
 * @param onDelete - Callback function to handle character deletion
 */
const CharacterCard: React.FC<CharacterCardProps> = ({ character, onDelete }) => {
  const navigate = useNavigate();

  /**
   * Handles navigation to character sheet
   */
  const handleViewCharacter = () => {
    if (character.id) {
      navigate(`/character/${character.id}`);
    }
  };

  return (
    <Card 
      className="p-4 hover:shadow-lg transition-all duration-200 cursor-pointer group relative 
                hover:scale-[1.02] hover:bg-accent/5"
      onClick={handleViewCharacter}
    >
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-xl font-semibold group-hover:text-primary transition-colors">
            {character.name}
          </h2>
          <p className="text-gray-600">
            Level {character.level} {character.race?.name} {character.class?.name}
          </p>
        </div>
        <div 
          className="flex gap-2 z-10" 
          onClick={e => e.stopPropagation()}
        >
          <Button
            variant="ghost"
            size="icon"
            onClick={() => character.id && handleViewCharacter()}
            title="View Character"
            className="opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <Eye className="w-4 h-4" />
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="text-red-500 hover:text-red-700 opacity-0 group-hover:opacity-100 transition-opacity"
                title="Delete Character"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Character</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete {character.name}? This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => character.id && onDelete(character.id)}
                  className="bg-red-500 hover:bg-red-700"
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </Card>
  );
};

export default CharacterCard;