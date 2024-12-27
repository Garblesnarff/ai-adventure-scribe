export interface Ability {
  score: number;
  modifier: number;
  savingThrow: boolean;
}

export interface AbilityScores {
  strength: Ability;
  dexterity: Ability;
  constitution: Ability;
  intelligence: Ability;
  wisdom: Ability;
  charisma: Ability;
}

export interface CharacterRace {
  id: string;
  name: string;
  description: string;
  abilityScoreIncrease: Partial<Record<keyof AbilityScores, number>>;
  speed: number;
  traits: string[];
  languages: string[];
}

export interface CharacterClass {
  id: string;
  name: string;
  description: string;
  hitDie: number;
  primaryAbility: keyof AbilityScores;
  savingThrowProficiencies: (keyof AbilityScores)[];
  skillChoices: string[];
  numSkillChoices: number;
}

export interface CharacterBackground {
  id: string;
  name: string;
  description: string;
  skillProficiencies: string[];
  toolProficiencies: string[];
  languages: number;
  equipment: string[];
  feature: {
    name: string;
    description: string;
  };
}

export interface Character {
  id?: string;
  userId: string;
  name: string;
  race: CharacterRace | null;
  class: CharacterClass | null;
  level: number;
  background: CharacterBackground | null;
  abilityScores: AbilityScores;
  experience: number;
  alignment: string;
  personalityTraits: string[];
  ideals: string[];
  bonds: string[];
  flaws: string[];
  equipment: string[];
  createdAt?: Date;
  updatedAt?: Date;
}