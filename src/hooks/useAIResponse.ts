import { ChatMessage } from '@/types/game';
import { supabase } from '@/integrations/supabase/client';
import { selectRelevantMemories } from '@/utils/memorySelection';
import { useToast } from '@/hooks/use-toast';
import { Memory, isValidMemoryType } from '@/components/game/memory/types';

/**
 * Hook for handling AI response generation with memory context window
 */
export const useAIResponse = () => {
  const { toast } = useToast();

  /**
   * Formats messages into a task for the DM Agent
   */
  const formatDMTask = (messages: ChatMessage[], latestMessage: ChatMessage) => {
    return {
      id: `task_${Date.now()}`,
      description: `Respond to player message: ${latestMessage.text}`,
      expectedOutput: 'D&D appropriate response with game context',
      context: {
        messageHistory: messages,
        playerIntent: latestMessage.context?.intent || 'query',
        playerEmotion: latestMessage.context?.emotion || 'neutral'
      }
    };
  };

  /**
   * Fetches campaign and character details for the DM Agent context
   */
  const fetchGameContext = async (sessionId: string) => {
    try {
      console.log('Fetching game session details for:', sessionId);
      
      // Get game session with campaign and character details using JOIN
      const { data: sessionData, error: sessionError } = await supabase
        .from('game_sessions')
        .select(`
          *,
          campaigns:campaign_id (*),
          characters:character_id (*)
        `)
        .eq('id', sessionId)
        .single();

      if (sessionError) {
        console.error('Error fetching session:', sessionError);
        return null;
      }

      if (!sessionData?.campaign_id || !sessionData?.character_id) {
        console.error('No campaign or character IDs found in session');
        return null;
      }

      return {
        campaign: sessionData.campaigns,
        character: sessionData.characters
      };
    } catch (error) {
      console.error('Error in fetchGameContext:', error);
      return null;
    }
  };

  /**
   * Calls the DM Agent to generate a response
   */
  const getAIResponse = async (messages: ChatMessage[], sessionId: string): Promise<ChatMessage> => {
    try {
      console.log('Getting AI response for session:', sessionId);

      // Get latest message context
      const latestMessage = messages[messages.length - 1];
      
      // Fetch campaign and character context
      const gameContext = await fetchGameContext(sessionId);
      
      if (!gameContext) {
        throw new Error('Failed to fetch game context');
      }

      // Fetch and select relevant memories
      const { data: memoriesData } = await supabase
        .from('memories')
        .select('*')
        .eq('session_id', sessionId);

      // Validate and transform memories
      const memories: Memory[] = (memoriesData || []).map((memory): Memory => {
        if (!isValidMemoryType(memory.type)) {
          console.warn(`[Memory] Invalid memory type detected: ${memory.type}, defaulting to 'general'`);
          memory.type = 'general';
        }
        return {
          ...memory,
          type: isValidMemoryType(memory.type) ? memory.type : 'general'
        };
      });

      const selectedMemories = selectRelevantMemories(memories, latestMessage.context);

      console.log('Calling DM Agent with context:', {
        gameContext,
        selectedMemories: selectedMemories.length
      });

      // Call DM Agent through edge function
      const { data, error } = await supabase.functions.invoke('dm-agent-execute', {
        body: {
          task: formatDMTask(messages, latestMessage),
          agentContext: {
            role: 'Dungeon Master',
            goal: 'Guide players through an engaging D&D campaign',
            backstory: 'An experienced DM with vast knowledge of D&D rules',
            campaignDetails: gameContext.campaign,
            characterDetails: gameContext.character,
            memories: selectedMemories
          }
        }
      });

      if (error) {
        console.error('DM Agent error:', error);
        throw error;
      }

      // Format the response as a ChatMessage
      return {
        text: data.response,
        sender: 'dm',
        context: {
          emotion: 'neutral',
          intent: 'response',
        }
      };
    } catch (error) {
      console.error('Error in getAIResponse:', error);
      throw error;
    }
  };

  return { getAIResponse };
};