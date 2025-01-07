import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';

export async function callEdgeFunction<T = any>(
  functionName: string,
  payload?: any
): Promise<T | null> {
  try {
    console.log(`Calling edge function: ${functionName}`, payload);
    
    const { data, error } = await supabase.functions.invoke(functionName, {
      body: payload
    });

    if (error) {
      console.error(`Edge function ${functionName} error:`, error);
      toast({
        title: "Error",
        description: "Failed to process request. Please try again.",
        variant: "destructive",
      });
      throw error;
    }

    return data;
  } catch (error) {
    console.error(`Failed to call edge function ${functionName}:`, error);
    toast({
      title: "Error",
      description: "Failed to connect to server. Please try again.",
      variant: "destructive",
    });
    return null;
  }
}