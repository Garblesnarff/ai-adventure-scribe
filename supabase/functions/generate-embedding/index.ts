import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { HfInference } from 'https://esm.sh/@huggingface/inference@2.3.2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { text } = await req.json();
    
    if (!text) {
      throw new Error('Text is required');
    }

    // Clean and truncate text
    const cleanedText = text.substring(0, 1000).replace(/\n/g, ' ').trim();
    console.log('Processing text for embedding:', cleanedText);

    const hf = new HfInference(Deno.env.get('HUGGING_FACE_ACCESS_TOKEN'));
    
    // Format input properly for the HuggingFace API
    const response = await hf.featureExtraction({
      model: 'sentence-transformers/all-MiniLM-L6-v2',
      inputs: {
        source_sentences: [cleanedText],
        sentences_to_compare: [cleanedText]
      }
    });

    console.log('Successfully generated embedding');

    // Extract the embedding from the response
    const embedding = Array.isArray(response) ? response[0] : response;

    return new Response(
      JSON.stringify({ embedding }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error generating embedding:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});