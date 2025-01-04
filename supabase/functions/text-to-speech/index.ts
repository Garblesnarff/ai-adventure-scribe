import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

/**
 * Edge Function to handle text-to-speech conversion using ElevenLabs API
 * Streams audio data directly without base64 conversion
 */
serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const apiKey = Deno.env.get('ELEVEN_LABS_API_KEY')
    if (!apiKey) {
      console.error('ELEVEN_LABS_API_KEY is not set')
      throw new Error('API key configuration error')
    }

    // Parse and validate request body
    const { text } = await req.json()
    if (!text || typeof text !== 'string') {
      console.error('Invalid request body:', { text })
      throw new Error('Invalid or missing text input')
    }

    // Validate text length (ElevenLabs has a limit)
    if (text.length > 5000) {
      console.error('Text too long:', text.length)
      throw new Error('Text exceeds maximum length of 5000 characters')
    }

    console.log('Converting text to speech:', text.substring(0, 50) + '...')

    // Call ElevenLabs API with specific voice ID
    const response = await fetch(
      'https://api.elevenlabs.io/v1/text-to-speech/JBFqnCBsd6RMkjVDRZzb',
      {
        method: 'POST',
        headers: {
          'Accept': 'audio/mpeg',
          'xi-api-key': apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: text,
          model_id: 'eleven_monolingual_v1',
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.5,
          }
        })
      }
    )

    if (!response.ok) {
      const errorText = await response.text()
      console.error('ElevenLabs API error:', response.status, errorText)
      throw new Error(`ElevenLabs API error: ${response.status}`)
    }

    // Stream the audio data directly
    const audioData = await response.arrayBuffer()
    
    return new Response(audioData, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'audio/mpeg',
      }
    })
  } catch (error) {
    console.error('Text-to-speech error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})