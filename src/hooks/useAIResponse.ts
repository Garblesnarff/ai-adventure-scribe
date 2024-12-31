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
   * Fetches campaign details for the DM Agent context
   */
  const fetchCampaignDetails = async (sessionId: string) => {
    try {
      // Get game session
      const { data: sessionData } = await supabase
        .from('game_sessions')
        .select('campaign_id, character_id')
        .eq('id', sessionId)
        .single();

      if (!sessionData) return null;

      // Get campaign details
      const { data: campaignData } = await supabase
        .from('campaigns')
        .select('*')
        .eq('id', sessionData.campaign_id)
        .single();

      // Get character details
      const { data: characterData } = await supabase
        .from('characters')
        .select('*')
        .eq('id', sessionData.character_id)
        .single();

      return {
        campaign: campaignData,
        character: characterData
      };
    } catch (error) {
      console.error('Error fetching campaign details:', error);
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