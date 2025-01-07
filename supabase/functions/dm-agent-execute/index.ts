import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface DMAgentRequest {
  task: {
    id: string;
    description: string;
    expectedOutput: string;
    context?: Record<string, any>;
  };
  agentContext: {
    role: string;
    goal: string;
    backstory: string;
    campaignDetails?: any;
  };
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    console.log('[dm-agent-execute] Function called')
    
    // Request validation
    if (req.method !== 'POST') {
      throw new Error('Method not allowed')
    }

    const requestData: DMAgentRequest = await req.json()
    console.log('[dm-agent-execute] Request data:', JSON.stringify(requestData, null, 2))

    // Validate request data
    if (!requestData.task || !requestData.agentContext) {
      throw new Error('Invalid request data: missing task or agentContext')
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase configuration')
    }

    const supabase = createClient(supabaseUrl, supabaseKey)

    // Log task execution
    const { error: logError } = await supabase
      .from('task_queue')
      .insert({
        task_type: 'dm_agent_task',
        priority: 1,
        status: 'processing',
        data: {
          task: requestData.task,
          agentContext: requestData.agentContext
        }
      })

    if (logError) {
      console.error('[dm-agent-execute] Error logging task:', logError)
    }

    // Process the task
    const result = {
      success: true,
      taskId: requestData.task.id,
      timestamp: new Date().toISOString(),
      response: `Processed task: ${requestData.task.description}`,
      context: {
        role: requestData.agentContext.role,
        processedAt: new Date().toISOString()
      }
    }

    // Update task status
    const { error: updateError } = await supabase
      .from('task_queue')
      .update({
        status: 'completed',
        result: result,
        completed_at: new Date().toISOString()
      })
      .eq('task_type', 'dm_agent_task')
      .eq('status', 'processing')

    if (updateError) {
      console.error('[dm-agent-execute] Error updating task status:', updateError)
    }

    console.log('[dm-agent-execute] Task processed successfully:', result)

    return new Response(
      JSON.stringify(result),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json'
        } 
      },
    )
  } catch (error) {
    console.error('[dm-agent-execute] Error:', error)
    
    const errorResponse = {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      timestamp: new Date().toISOString()
    }

    return new Response(
      JSON.stringify(errorResponse),
      { 
        status: 400,
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      },
    )
  }
})