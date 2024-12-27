import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import { Character } from '@/types/character';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

interface CharacterState {
  character: Character | null;
  isDirty: boolean;
  currentStep: number;
  isLoading: boolean;
  error: string | null;
}

type CharacterAction =
  | { type: 'SET_CHARACTER'; payload: Character }
  | { type: 'UPDATE_CHARACTER'; payload: Partial<Character> }
  | { type: 'SET_STEP'; payload: number }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'RESET' };

const initialState: CharacterState = {
  character: null,
  isDirty: false,
  currentStep: 0,
  isLoading: false,
  error: null,
};

const CharacterContext = createContext<{
  state: CharacterState;
  dispatch: React.Dispatch<CharacterAction>;
} | null>(null);

function characterReducer(state: CharacterState, action: CharacterAction): CharacterState {
  switch (action.type) {
    case 'SET_CHARACTER':
      return {
        ...state,
        character: action.payload,
        isDirty: false,
      };
    case 'UPDATE_CHARACTER':
      return {
        ...state,
        character: state.character ? { ...state.character, ...action.payload } : null,
        isDirty: true,
      };
    case 'SET_STEP':
      return {
        ...state,
        currentStep: action.payload,
      };
    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload,
      };
    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload,
      };
    case 'RESET':
      return initialState;
    default:
      return state;
  }
}

export function CharacterProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(characterReducer, initialState);
  const { toast } = useToast();

  const value = {
    state,
    dispatch,
  };

  return <CharacterContext.Provider value={value}>{children}</CharacterContext.Provider>;
}

export function useCharacter() {
  const context = useContext(CharacterContext);
  if (!context) {
    throw new Error('useCharacter must be used within a CharacterProvider');
  }
  return context;
}

export async function saveCharacterDraft(character: Character) {
  try {
    const { error } = await supabase
      .from('characters')
      .upsert({
        ...character,
        updated_at: new Date().toISOString(),
      });

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error saving character draft:', error);
    return false;
  }
}