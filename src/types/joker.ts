import type { CandyColor, GameState } from './game';

export type JokerRarity = 'common' | 'uncommon' | 'rare' | 'legendary';

export type JokerTriggerType = 'candy' | 'match' | 'cascade_end' | 'swap_end' | 'on_swap';

export interface TriggerContext {
  triggerType: JokerTriggerType;
  candyColor?: CandyColor;
  matchSize?: number;
  comboCount?: number;
  matchedColors?: CandyColor[];
  chips: number;
  mult: number;
  gold: number;
  gameState: GameState;
}

export interface TriggerResult {
  chips: number;
  mult: number;
  goldAdded?: number;
  message?: string; // Floating text animation (e.g. "+5 Mult", "x2 Mult")
}

export interface Joker {
  id: string;
  name: string;
  description: string;
  rarity: JokerRarity;
  cost: number;
  sellValue: number;
  edition?: 'standard' | 'foil' | 'holographic' | 'polychrome' | 'negative';
  // Execution trigger
  trigger: (context: TriggerContext) => TriggerResult;
}
