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
  const [isTestingMemory, setIsTestingMemory] = useState(false);

  /**
   * Logs test results and shows toast notification
   */
  const logTest = (message: string, success: boolean) => {
    console.log(`Test ${success ? 'PASSED' : 'FAILED'}: ${message}`);
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
    setIsTestingMemory(true);
    const testMessage = "This is a test message for memory creation";
    try {
      console.log('Starting memory creation test');
      await extractMemories(testMessage, 'general');
      
      // Wait briefly for the memory to be created and retrieved
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const found = memories.some(m => {
        const matches = m.content.includes(testMessage);
        console.log('Checking memory:', m, 'Matches:', matches);
        return matches;
      });

      if (!found) {
        console.error('Memory not found after creation. Current memories:', memories);
      }
      
      logTest('Memory Creation Test', found);
    } catch (error) {
      console.error('Memory Creation Test Failed:', error);
      logTest('Memory Creation Test Failed: ' + error, false);
    } finally {
      setIsTestingMemory(false);
    }
  };

  /**
   * Tests memory retrieval and scoring
   */
  const testMemoryRetrieval = () => {
    console.log('Testing memory retrieval with memories:', memories);
    const hasMemories = memories.length > 0;
    const hasScoring = memories.every(m => {
      const hasImportance = typeof m.importance === 'number';
      console.log('Checking memory scoring:', m, 'Has importance:', hasImportance);
      return hasImportance;
    });
    logTest('Memory Retrieval Test', hasMemories && hasScoring);
  };

  /**
   * Tests memory context window management
   */
  const testMemoryWindow = () => {
    console.log('Testing memory window size with count:', memories.length);
    const isWithinLimit = memories.length <= 10;
    logTest('Memory Window Size Test', isWithinLimit);
  };

  /**
   * Tests memory metadata and embedding
   */
  const testMemoryMetadata = () => {
    console.log('Testing memory metadata and embeddings');
    const hasMetadata = memories.every(m => {
      const valid = m.metadata !== null;
      console.log('Checking memory metadata:', m, 'Is valid:', valid);
      return valid;
    });
    const hasEmbedding = memories.every(m => {
      const valid = m.embedding !== null;
      console.log('Checking memory embedding:', m, 'Is valid:', valid);
      return valid;
    });
    logTest('Memory Metadata Test', hasMetadata);
    logTest('Memory Embedding Test', hasEmbedding);
  };

  return (
    <Card className="p-4 space-y-4">
      <h3 className="font-semibold text-lg">Memory System Tests</h3>
      
      <div className="space-x-2">
        <Button 
          onClick={testMemoryCreation}
          disabled={isTestingMemory}
        >
          {isTestingMemory ? 'Testing...' : 'Test Memory Creation'}
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