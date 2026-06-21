export type CandyColor = 'red' | 'blue' | 'green' | 'yellow' | 'purple';

export interface CandyState {
  color: CandyColor;
  enhancement: 'none' | 'gold' | 'glass' | 'lucky' | 'steel' | 'bonus';
  edition: 'standard' | 'foil' | 'holographic' | 'polychrome';
  special: 'normal' | 'striped_h' | 'striped_v' | 'wrapped' | 'color_bomb';
  frozen?: boolean;
}

export interface CandyTypeInfo {
  color: CandyColor;
  name: string;
  baseChips: number;
  baseMult: number;
  level: number;
  hexColor: number; // For Phaser Graphics drawing
  sparkleColor: number;
}

export interface CandyUpgradeInfo {
  color: CandyColor;
  cost: number;
}

export interface MatchGroup {
  color: CandyColor;
  candies: { row: number; col: number }[];
  isVertical: boolean;
  scoreApplied?: boolean;
}

export interface SwapAction {
  from: { row: number; col: number };
  to: { row: number; col: number };
}

export interface ScoreState {
  chips: number;
  mult: number;
  total: number;
}

export interface GameState {
  gold: number;
  swapsRemaining: number;
  scoreTarget: number;
  scoreCurrent: number;
  ante: number;
  round: number; // 1: Small Blind, 2: Big Blind, 3: Boss Blind
  candyLevels: Record<CandyColor, number>;
  activeJokers: string[]; // IDs of active jokers
  boardGrid: (CandyState | null)[][] | null;
  deckType: 'classic' | 'gold' | 'love';
  maxJokerSlots: number;
  baseSwaps: number;
  boughtVouchers: string[];
}
