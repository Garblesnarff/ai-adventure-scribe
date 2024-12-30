import { useState } from 'react';
import { DungeonMasterAgent } from '@/agents/DungeonMasterAgent';
import { AgentTask, AgentResult } from '@/agents/types';
import { useToast } from '@/components/ui/use-toast';

/**
 * Hook for interacting with the agent system
 */
export const useAgentSystem = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();
  const dmAgent = new DungeonMasterAgent();

  /**
   * Executes a task using the DM agent
   */
  const executeTask = async (task: AgentTask): Promise<AgentResult> => {
    setIsProcessing(true);
    try {
      const result = await dmAgent.executeTask(task);
      
      if (!result.success) {
        toast({
          title: "Task Execution Failed",
          description: result.message,
          variant: "destructive",
        });
      }
      
      return result;
    } catch (error) {
      console.error('Error in useAgentSystem:', error);
      toast({
        title: "Error",
        description: "Failed to execute agent task",
        variant: "destructive",
      });
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    } finally {
      setIsProcessing(false);
    }
  };

  return {
    dmAgent,
    executeTask,
    isProcessing
  };
};