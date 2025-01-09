import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface RuleValidationRequest {
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
    ruleValidations?: any[];
  };
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { task, agentContext } = await req.json() as RuleValidationRequest;
    console.log('Processing rule validation request:', { task, agentContext });

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Validate the rule based on task context
    const validationResult = await validateRule(task, agentContext, supabaseClient);

    return new Response(
      JSON.stringify(validationResult),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error) {
    console.error('Error in rules-interpreter-execute:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    )
  }
})

async function validateRule(
  task: RuleValidationRequest['task'],
  agentContext: RuleValidationRequest['agentContext'],
  supabaseClient: any
) {
  // Get relevant rule validations from the database
  const { data: ruleValidations, error } = await supabaseClient
    .from('rule_validations')
    .select('*')
    .eq('is_active', true);

  if (error) {
    throw new Error(`Failed to fetch rule validations: ${error.message}`);
  }

  // Process the rule validation based on task context
  const result = {
    isValid: true,
    validations: ruleValidations,
    reasoning: `Rule interpretation for task: ${task.description}`,
    suggestions: [] as string[],
  };

  // Add validation logic here based on task type
  if (task.context?.ruleType === 'character_creation') {
    result.suggestions.push('Validate ability scores');
    result.suggestions.push('Check class prerequisites');
    result.suggestions.push('Verify racial traits');
  } else if (task.context?.ruleType === 'combat') {
    result.suggestions.push('Check action economy');
    result.suggestions.push('Validate attack rolls');
    result.suggestions.push('Verify damage calculations');
  }

  return result;
}