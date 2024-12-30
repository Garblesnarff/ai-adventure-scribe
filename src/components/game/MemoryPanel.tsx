import React, { useState } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { ScrollArea } from '../ui/scroll-area';
import { useMemoryContext } from '@/contexts/MemoryContext';
import { List, Filter, ChevronDown, ChevronUp, MapPin, User, Calendar, Archive } from 'lucide-react';

/**
 * Interface for memory data structure
 */
interface Memory {
  id: string;
  type: 'location' | 'character' | 'event' | 'item' | 'general';
  content: string;
  importance: number;
  metadata: Record<string, any>;
  created_at: string;
}

/**
 * Interface for memory category configuration
 */
interface MemoryCategory {
  type: string;
  label: string;
  icon: React.ReactNode;
}

/**
 * Memory categories with their respective icons and labels
 */
const MEMORY_CATEGORIES: MemoryCategory[] = [
  { type: 'location', label: 'Locations', icon: <MapPin className="h-4 w-4" /> },
  { type: 'character', label: 'Characters', icon: <User className="h-4 w-4" /> },
  { type: 'event', label: 'Events', icon: <Calendar className="h-4 w-4" /> },
  { type: 'item', label: 'Items', icon: <Archive className="h-4 w-4" /> },
  { type: 'general', label: 'General', icon: <List className="h-4 w-4" /> },
];

/**
 * MemoryPanel Component
 * Displays and filters game memories by category
 */
export const MemoryPanel: React.FC = () => {
  const { memories = [] } = useMemoryContext();
  const [isExpanded, setIsExpanded] = useState(true);
  const [selectedType, setSelectedType] = useState<string | null>(null);

  /**
   * Filters memories based on selected type
   */
  const filteredMemories = selectedType
    ? memories.filter((memory: Memory) => memory.type === selectedType)
    : memories;

  /**
   * Sorts memories by importance and creation date
   */
  const sortedMemories = [...filteredMemories].sort((a: Memory, b: Memory) => {
    if (b.importance !== a.importance) {
      return (b.importance || 0) - (a.importance || 0);
    }
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  return (
    <Card className="w-full md:w-80 h-[calc(100vh-4rem)] bg-white/90 backdrop-blur-sm">
      <div className="p-4 border-b flex items-center justify-between">
        <div className="flex items-center gap-2">
          <List className="h-5 w-5" />
          <h3 className="font-semibold">Memories</h3>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          {isExpanded ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronUp className="h-4 w-4" />
          )}
        </Button>
      </div>
      
      {isExpanded && (
        <>
          <div className="p-4 border-b flex gap-2 overflow-x-auto">
            <Button
              variant={selectedType === null ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedType(null)}
              className="flex items-center gap-2"
            >
              <Filter className="h-4 w-4" />
              All
            </Button>
            {MEMORY_CATEGORIES.map((category) => (
              <Button
                key={category.type}
                variant={selectedType === category.type ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedType(category.type)}
                className="flex items-center gap-2"
              >
                {category.icon}
                {category.label}
              </Button>
            ))}
          </div>
          
          <ScrollArea className="h-[calc(100%-8rem)] p-4">
            <div className="space-y-4">
              {sortedMemories.map((memory: Memory) => (
                <Card
                  key={memory.id}
                  className="p-3 bg-white/50 hover:bg-white/80 transition-colors"
                >
                  <div className="flex items-start gap-2">
                    {MEMORY_CATEGORIES.find(cat => cat.type === memory.type)?.icon}
                    <div>
                      <p className="text-sm">{memory.content}</p>
                      {memory.metadata && Object.keys(memory.metadata).length > 0 && (
                        <div className="mt-1 text-xs text-muted-foreground">
                          {Object.entries(memory.metadata).map(([key, value]) => (
                            <span key={key} className="mr-2">
                              {key}: {value}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </>
      )}
    </Card>
  );
};