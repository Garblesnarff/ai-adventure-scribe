import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { GoogleGenerativeAI } from "https://esm.sh/@google/generative-ai@0.1.3"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Initialize Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Fetches relevant memories for the current context
 * @param sessionId - Current game session ID
 * @param context - Current message context
 * @returns Array of relevant memories
 */
async function fetchRelevantMemories(sessionId: string, context: any) {
  try {
    const { data: memories, error } = await supabase
      .from('memories')
      .select('*')
      .eq('session_id', sessionId)
      .order('importance', { ascending: false })
      .limit(5);

    if (error) throw error;
    return memories || [];
  } catch (error) {
    console.error('Error fetching memories:', error);
    return [];
  }
}

/**
 * Calculates memory relevance score based on context and importance
 * @param memory - Memory object to score
 * @param context - Current context
 * @returns Relevance score
 */
function calculateMemoryRelevance(memory: any, context: any) {
  let score = memory.importance || 0;
  
  // Boost score based on context matches
  if (context.location && memory.content.toLowerCase().includes(context.location.toLowerCase())) {
    score += 2;
  }
  if (context.emotion && memory.content.toLowerCase().includes(context.emotion.toLowerCase())) {
    score += 1;
  }
  
  // Time decay factor
  const createdAt = new Date(memory.created_at).getTime();
  const now = Date.now();
  const hoursSinceCreation = (now - createdAt) / (1000 * 60 * 60);
  const timeFactor = Math.exp(-hoursSinceCreation / 24); // Decay over 24 hours
  
  return score * timeFactor;
}

/**
 * Formats memories into a context string for the AI
 * @param memories - Array of relevant memories
 * @returns Formatted context string
 */
function formatMemoryContext(memories: any[]) {
  if (!memories.length) return '';
  
  const formattedMemories = memories
    .map(m => `[${m.type.toUpperCase()}] ${m.content}`)
    .join('\n');
    
  return `\nRelevant context from previous interactions:\n${formattedMemories}\n`;
}

/**
 * Maps our application roles to Gemini API roles
 */
const mapRole = (role: string): string => {
  switch (role) {
    case 'player':
      return 'user';
    case 'dm':
    case 'system':
      return 'model';
    default:
      return 'user';
  }
};

/**
 * Handles the chat request and generates AI responses with memory context
 * @param messages - Array of chat messages
 * @param sessionId - Current game session ID
 * @returns AI generated response
 */
async function handleChat(messages: any[], sessionId: string) {
  const genAI = new GoogleGenerativeAI(Deno.env.get('GEMINI_API_KEY') || '');
  const model = genAI.getGenerativeModel({ model: "gemini-pro" });

  try {
    console.log('Processing chat request with messages:', messages);
    
    // Get latest message context
    const latestMessage = messages[messages.length - 1];
    const context = latestMessage.context || {};
    
    // Fetch and score relevant memories
    const memories = await fetchRelevantMemories(sessionId, context);
    const scoredMemories = memories
      .map(memory => ({
        ...memory,
        relevanceScore: calculateMemoryRelevance(memory, context)
      }))
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, 3); // Keep top 3 most relevant memories
    
    // Format memory context
    const memoryContext = formatMemoryContext(scoredMemories);
    
    // Prepare chat history with memory context
    const chatHistory = messages.map(msg => ({
      role: mapRole(msg.sender),
      parts: msg.text,
    }));
    
    // Add memory context to the system message
    if (memoryContext) {
      chatHistory.unshift({
        role: 'model',
        parts: `You are a Dungeon Master. Use this context to inform your responses:${memoryContext}`,
      });
    }

    const chat = model.startChat({
      history: chatHistory,
      generationConfig: {
        temperature: 0.9,
        topK: 1,
        topP: 1,
        maxOutputTokens: 2048,
      },
    });

    const result = await chat.sendMessage(messages[messages.length - 1].text);
    const response = await result.response;
    const text = response.text();

    console.log('Generated AI response:', text);

    // Update memory importance based on AI response
    await updateMemoryImportance(scoredMemories, text);

    return {
      text,
      sender: 'dm',
      context: {
        emotion: 'neutral',
        intent: 'response',
      }
    };
  } catch (error) {
    console.error('Error in AI chat:', error);
    throw error;
  }
}

/**
 * Updates memory importance based on AI response
 * @param memories - Array of memories to update
 * @param aiResponse - Generated AI response
 */
async function updateMemoryImportance(memories: any[], aiResponse: string) {
  try {
    for (const memory of memories) {
      if (aiResponse.toLowerCase().includes(memory.content.toLowerCase())) {
        // Increase importance if memory was used in response
        const { error } = await supabase
          .from('memories')
          .update({ importance: Math.min((memory.importance || 0) + 1, 10) })
          .eq('id', memory.id);
          
        if (error) throw error;
      }
    }
  } catch (error) {
    console.error('Error updating memory importance:', error);
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { messages, sessionId } = await req.json()
    if (!sessionId) {
      throw new Error('Session ID is required');
    }
    
    const response = await handleChat(messages, sessionId)

    return new Response(
      JSON.stringify(response),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json'
        } 
      },
    )
  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      },
    )
  }
})