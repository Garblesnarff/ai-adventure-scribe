import { ChatMessage } from '@/types/game';
import { supabase } from '@/integrations/supabase/client';
import { selectRelevantMemories } from '@/utils/memorySelection';
import { useToast } from '@/hooks/use-toast';

/**
 * Hook for handling AI response generation with memory context window
 * Now uses DM Agent for D&D specific responses
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
  const fetchCampaignDetails = async (sessionId: string) => {
    try {
      console.log('Fetching game session details for:', sessionId);
      
      // Get game session with campaign and character details using JOIN
      const { data: sessionData, error: sessionError } = await supabase
        .from('game_sessions')
        .select(`
          campaign_id,
          character_id,
          campaigns:campaign_id (
            *
          ),
          characters:character_id (
            *
          )
        `)
        .eq('id', sessionId)
        .maybeSingle();

      if (sessionError) {
        console.error('Error fetching session:', sessionError);
        return null;
      }

      if (!sessionData?.campaign_id || !sessionData?.character_id) {
        console.log('No campaign or character IDs found in session');
        return null;
      }

      console.log('Session data retrieved:', {
        campaignId: sessionData.campaign_id,
        characterId: sessionData.character_id,
        campaign: sessionData.campaigns,
        character: sessionData.characters
      });

      return {
        campaign: sessionData.campaigns,
        character: sessionData.characters
      };
    } catch (error) {
      console.error('Error in fetchCampaignDetails:', error);
      return null;
    }
  };

  /**
   * Calls the DM Agent to generate a response
   */
  const getAIResponse = async (messages: ChatMessage[], sessionId: string) => {
    try {
      console.log('Getting AI response for session:', sessionId);

      // Get latest message context
      const latestMessage = messages[messages.length - 1];
      
      // Fetch campaign and character context
      const gameContext = await fetchCampaignDetails(sessionId);
      
      if (!gameContext) {
        console.error('Failed to fetch game context');
        toast({
          title: "Error",
          description: "Failed to load game context. Please try again.",
          variant: "destructive",
        });
        throw new Error('Failed to fetch game context');
      }

      // Fetch and select relevant memories
      const { data: memories } = await supabase
        .from('memories')
        .select('*')
        .eq('session_id', sessionId);

      const selectedMemories = selectRelevantMemories(
        memories || [],
        latestMessage.context
      );

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
        toast({
          title: "Error",
          description: "Failed to get DM response. Please try again.",
          variant: "destructive",
        });
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
      } as ChatMessage;
    } catch (error) {
      console.error('Error in getAIResponse:', error);
      throw error;
    }
  };

  return { getAIResponse };
};