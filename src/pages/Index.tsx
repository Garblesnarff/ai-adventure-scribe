import React from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

export function Index() {
  const { toast } = useToast();

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-4xl font-bold mb-8">D&D Adventure Scribe</h1>
      <div className="space-y-4">
        <p className="text-lg">
          Welcome to your D&D adventure management system. Create campaigns, manage characters,
          and let our AI assist you in crafting unforgettable stories.
        </p>
        <Button 
          onClick={() => {
            toast({
              title: "Welcome!",
              description: "Your adventure awaits...",
            });
          }}
        >
          Get Started
        </Button>
      </div>
    </div>
  );
}