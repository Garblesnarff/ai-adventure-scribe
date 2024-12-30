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
    
    // Use sentence-transformers model with proper input format
    const response = await hf.featureExtraction({
      model: 'sentence-transformers/all-MiniLM-L6-v2',
      inputs: {
        source_sentence: cleanedText,
        sentences: [cleanedText]
      },
      parameters: {
        wait_for_model: true
      }
    });

    console.log('Raw embedding response:', response);

    // Handle both array and single response formats
    let embedding;
    if (Array.isArray(response)) {
      embedding = response[0]; // Take first result if array
    } else if (typeof response === 'object' && response.embeddings) {
      embedding = response.embeddings[0]; // Extract from object if needed
    } else {
      embedding = response; // Use direct response
    }

    // Ensure we have a valid array of numbers
    if (!Array.isArray(embedding)) {
      throw new Error('Invalid embedding format received');
    }

    // Format the embedding array properly for Supabase vector storage
    const processedEmbedding = embedding.map(num => {
      const parsed = Number(num);
      if (isNaN(parsed)) {
        throw new Error('Invalid number in embedding array');
      }
      return parsed;
    });

    console.log('Processed embedding array length:', processedEmbedding.length);
    
    // Format as a proper vector string
    const vectorString = `[${processedEmbedding.join(',')}]`;
    console.log('Final vector string format:', vectorString);

    return new Response(
      JSON.stringify({ embedding: vectorString }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json'
        } 
      }
    );
  } catch (error) {
    console.error('Error generating embedding:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        stack: error.stack 
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json'
        },
        status: 500 
      }
    );
  }
});