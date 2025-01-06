import { CrewAIAgentBridge } from './types/base';
import { AgentMemory } from './types/memory';
import { AgentMessage } from './types/communication';
import { AgentTool } from './types/tasks';
import { MemoryAdapter } from './adapters/MemoryAdapter';
import { MessageHandler } from './handlers/MessageHandler';
import { supabase } from '@/integrations/supabase/client';

/**
 * CrewAI-enabled Dungeon Master Agent
 * Extends the base DM agent with CrewAI capabilities
 */
export class CrewAIDungeonMasterAgent implements CrewAIAgentBridge {
  id: string;
  role: string;
  goal: string;
  backstory: string;
  verbose: boolean;
  allowDelegation: boolean;
  crewAIConfig: {
    tools: AgentTool[];
    memory: AgentMemory;
    communicate: (message: AgentMessage) => Promise<void>;
  };
  private memoryAdapter: MemoryAdapter;
  private messageHandler: MessageHandler;
  private tools: AgentTool[];

  constructor(sessionId: string) {
    this.id = 'crew_dm_agent_1';
    this.role = 'Dungeon Master';
    this.goal = 'Guide players through an engaging D&D campaign with advanced AI capabilities';
    this.backstory = 'An experienced DM enhanced with CrewAI capabilities for dynamic storytelling';
    this.verbose = true;
    this.allowDelegation = true;
    
    // Initialize adapters
    this.memoryAdapter = new MemoryAdapter(sessionId);
    this.messageHandler = new MessageHandler();
    
    // Initialize tools
    this.tools = this.initializeTools();
    
    // Set up CrewAI configuration
    this.crewAIConfig = {
      tools: this.tools,
      memory: this.initializeMemory(),
      communicate: this.communicate.bind(this)
    };
  }

  /**
   * Initialize agent tools
   */
  private initializeTools(): AgentTool[] {
    return [
      {
        name: 'fetch_campaign_context',
        description: 'Retrieves relevant campaign context and history',
        execute: async (params: any) => {
          const { data, error } = await supabase
            .from('campaigns')
            .select('*')
            .eq('id', params.campaignId)
            .single();
          
          if (error) throw error;
          return data;
        }
      },
      {
        name: 'query_memories',
        description: 'Searches through session memories for relevant information',
        execute: async (params: any) => {
          const memories = await this.memoryAdapter.getRecentMemories(params.limit || 5);
          return memories;
        }
      }
    ];
  }

  /**
   * Initialize memory system
   */
  private initializeMemory(): AgentMemory {
    return {
      shortTerm: [],
      longTerm: [],
      retrieve: async (context: any) => {
        return this.memoryAdapter.getRecentMemories(5);
      },
      store: async (memory: any) => {
        await this.memoryAdapter.storeMemory(memory);
      },
      forget: async (memoryId: string) => {
        // Implement memory removal if needed
        console.log('Memory forget not implemented yet:', memoryId);
      }
    };
  }

  /**
   * Handle agent communication
   */
  async communicate(message: AgentMessage): Promise<void> {
    try {
      await this.messageHandler.sendMessage(message);
    } catch (error) {
      console.error('Error in DM agent communication:', error);
      throw error;
    }
  }

  /**
   * Execute a task using CrewAI capabilities
   */
  async executeTask(task: any): Promise<any> {
    console.log('CrewAI DM Agent executing task:', task);
    
    try {
      // Get relevant memories
      const memories = await this.memoryAdapter.getRecentMemories();
      
      // Call the AI function through Edge Function
      const { data, error } = await supabase.functions.invoke('dm-agent-execute', {
        body: {
          task,
          memories,
          agentContext: {
            role: this.role,
            goal: this.goal,
            backstory: this.backstory
          }
        }
      });

      if (error) throw error;

      // Store task result as memory
      await this.memoryAdapter.storeMemory({
        content: JSON.stringify(data),
        type: 'general',
        importance: 3
      });

      return {
        success: true,
        message: 'Task executed successfully',
        data
      };
    } catch (error) {
      console.error('Error executing CrewAI DM agent task:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to execute task'
      };
    }
  }
}