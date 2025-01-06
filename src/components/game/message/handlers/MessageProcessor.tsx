import { ChatMessage } from '@/types/game';
import { useAIResponse } from '@/hooks/useAIResponse';
import { useMemoryContext } from '@/contexts/MemoryContext';
import { useToast } from '@/hooks/use-toast';

interface MessageProcessorProps {
  sessionId: string;
  messages: ChatMessage[];
  onProcessingComplete: () => void;
  onError: (error: Error) => void;
}

/**
 * Handles the processing of messages including AI responses and memory extraction
 */
export const MessageProcessor = async ({
  sessionId,
  messages,
  onProcessingComplete,
  onError,
}: MessageProcessorProps) => {
  const { extractMemories } = useMemoryContext();
  const { getAIResponse } = useAIResponse();
  const { toast } = useToast();

  try {
    // Extract memories from player input
    try {
      const playerMessage = messages[messages.length - 1];
      await extractMemories(playerMessage.text);
    } catch (memoryError) {
      console.error('[MessageProcessor] Memory extraction error:', memoryError);
      // Continue with message flow even if memory extraction fails
      toast({
        title: "Memory System Warning",
        description: "Memory extraction encountered an issue but message processing will continue",
        variant: "destructive",
      });
    }

    // Get AI response
    const aiResponse = await getAIResponse(messages, sessionId);

    // Extract memories from AI response
    if (aiResponse.text) {
      try {
        await extractMemories(aiResponse.text);
      } catch (memoryError) {
        console.error('[MessageProcessor] Memory extraction error for AI response:', memoryError);
        // Continue even if memory extraction fails
      }
    }

    onProcessingComplete();
    return aiResponse;
  } catch (error) {
    console.error('[MessageProcessor] Error in message processing:', error);
    onError(error as Error);
    throw error;
  }
};