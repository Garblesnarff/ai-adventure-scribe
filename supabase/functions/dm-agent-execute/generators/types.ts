export interface Character {
  id?: string;
  name: string;
  race: string;
  class: string;
  level: number;
}

export interface NPCData {
  name: string;
  personality?: string;
  background?: string;
}

export interface DialogueResponse {
  text: string;
  options?: string[];
}

export interface InteractionResponse {
  activeNPCs: string[];
  reactions: string[];
  dialogue: DialogueResponse;
}