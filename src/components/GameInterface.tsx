import React, { useState } from 'react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Input } from './ui/input';
import { useConversation } from '@11labs/react';

export const GameInterface = () => {
  const [playerInput, setPlayerInput] = useState('');
  const [messages, setMessages] = useState<Array<{text: string, sender: 'player' | 'dm'}>>([
    {
      text: "Welcome brave adventurer! I am your AI Dungeon Master. What is your name?",
      sender: 'dm'
    }
  ]);

  const conversation = useConversation({
    overrides: {
      tts: {
        voiceId: "pNInz6obpgDQGcFmaJgB", // Fantasy narrator voice
      },
    },
  });

  const handleSendMessage = async () => {
    if (!playerInput.trim()) return;

    // Add player message
    setMessages(prev => [...prev, { text: playerInput, sender: 'player' }]);
    
    // Simple response for now - we'll integrate more complex AI later
    const dmResponse = {
      text: `The world responds to your words: "${playerInput}"... What would you like to do next?`,
      sender: 'dm' as const
    };

    setMessages(prev => [...prev, dmResponse]);
    setPlayerInput('');

    // Speak the DM's response
    try {
      await conversation.startSession({
        agentId: "your_agent_id", // Replace with actual agent ID
      });
      // Text-to-speech would go here
    } catch (error) {
      console.error('Failed to start voice conversation:', error);
    }
  };

  return (
    <div className="min-h-screen bg-[url('/parchment-bg.png')] bg-cover p-4">
      <Card className="max-w-4xl mx-auto bg-white/90 backdrop-blur-sm shadow-xl p-6">
        <h1 className="text-4xl text-center mb-6 text-primary">D&D Adventure</h1>
        
        <div className="h-[60vh] overflow-y-auto mb-4 space-y-4 p-4">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`p-3 rounded-lg ${
                message.sender === 'dm'
                  ? 'bg-accent text-accent-foreground'
                  : 'bg-primary text-primary-foreground'
              }`}
            >
              <p>{message.text}</p>
            </div>
          ))}
        </div>

        <div className="flex gap-2">
          <Input
            value={playerInput}
            onChange={(e) => setPlayerInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder="What would you like to do?"
            className="flex-1"
          />
          <Button onClick={handleSendMessage}>Send</Button>
        </div>
      </Card>
    </div>
  );
};