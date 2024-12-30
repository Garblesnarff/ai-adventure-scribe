import React, { useEffect, useState } from 'react';
import { useMemoryContext } from '@/contexts/MemoryContext';
import { useMessageContext } from '@/contexts/MessageContext';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';

/**
 * MemoryTester Component
 * Provides UI for testing memory creation, retrieval, and integration
 */
export const MemoryTester: React.FC = () => {
  const { memories, extractMemories } = useMemoryContext();
  const { messages, sendMessage } = useMessageContext();
  const { toast } = useToast();
  const [testResults, setTestResults] = useState<string[]>([]);

  /**
   * Logs test results and shows toast notification
   */
  const logTest = (message: string, success: boolean) => {
    setTestResults(prev => [...prev, `${success ? '✅' : '❌'} ${message}`]);
    toast({
      title: success ? 'Test Passed' : 'Test Failed',
      description: message,
      variant: success ? 'default' : 'destructive',
    });
  };

  /**
   * Tests memory creation from player message
   */
  const testMemoryCreation = async () => {
    const testMessage = "This is a test message for memory creation";
    try {
      await extractMemories(testMessage, 'general');
      const found = memories.some(m => m.content.includes(testMessage));
      logTest('Memory Creation Test', found);
    } catch (error) {
      logTest('Memory Creation Test Failed: ' + error, false);
    }
  };

  /**
   * Tests memory retrieval and scoring
   */
  const testMemoryRetrieval = () => {
    const hasMemories = memories.length > 0;
    const hasScoring = memories.every(m => typeof m.importance === 'number');
    logTest('Memory Retrieval Test', hasMemories && hasScoring);
  };

  /**
   * Tests memory context window management
   */
  const testMemoryWindow = () => {
    const isWithinLimit = memories.length <= 10;
    logTest('Memory Window Size Test', isWithinLimit);
  };

  /**
   * Tests memory metadata and embedding
   */
  const testMemoryMetadata = () => {
    const hasMetadata = memories.every(m => m.metadata !== null);
    const hasEmbedding = memories.every(m => m.embedding !== null);
    logTest('Memory Metadata Test', hasMetadata);
    logTest('Memory Embedding Test', hasEmbedding);
  };

  return (
    <Card className="p-4 space-y-4">
      <h3 className="font-semibold text-lg">Memory System Tests</h3>
      
      <div className="space-x-2">
        <Button onClick={testMemoryCreation}>
          Test Memory Creation
        </Button>
        <Button onClick={testMemoryRetrieval}>
          Test Memory Retrieval
        </Button>
        <Button onClick={testMemoryWindow}>
          Test Memory Window
        </Button>
        <Button onClick={testMemoryMetadata}>
          Test Memory Metadata
        </Button>
      </div>

      <ScrollArea className="h-[200px] w-full border rounded-md p-4">
        <div className="space-y-2">
          {testResults.map((result, index) => (
            <div key={index} className="text-sm">
              {result}
            </div>
          ))}
        </div>
      </ScrollArea>
    </Card>
  );
};