import { CampaignContext } from '@/types/dm';

export class EnvironmentGenerator {
  generateEnvironment(context: CampaignContext) {
    return {
      description: `You find yourself in ${context.setting.location}, a place where ${context.setting.atmosphere} permeates the air.`,
      atmosphere: context.setting.atmosphere,
      sensoryDetails: this.generateSensoryDetails(context.setting)
    };
  }

  private generateSensoryDetails(setting: CampaignContext['setting']): string[] {
    const details = [];
    
    if (setting.atmosphere.includes('mysterious')) {
      details.push('Strange whispers echo in the distance');
    }
    if (setting.atmosphere.includes('peaceful')) {
      details.push('A gentle breeze carries the scent of wildflowers');
    }
    
    return details;
  }
}