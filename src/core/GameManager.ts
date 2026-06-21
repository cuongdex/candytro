import type { CandyColor, GameState } from '../types/game';
import { JokerManager } from './JokerManager';

export class GameManager {
  private static instance: GameManager;
  
  public state: GameState = {
    gold: 4,
    swapsRemaining: 5,
    scoreTarget: 300,
    scoreCurrent: 0,
    ante: 1,
    round: 1,
    candyLevels: {
      red: 1,
      blue: 1,
      green: 1,
      yellow: 1,
      purple: 1
    },
    activeJokers: [],
    boardGrid: null,
    deckType: 'classic',
    maxJokerSlots: 5,
    baseSwaps: 5,
    boughtVouchers: []
  };

  public jokerManager: JokerManager;

  private constructor() {
    this.jokerManager = new JokerManager();
  }

  public static getInstance(): GameManager {
    if (!GameManager.instance) {
      GameManager.instance = new GameManager();
    }
    return GameManager.instance;
  }

  public startNewRun(deckType?: 'classic' | 'gold' | 'love'): void {
    const chosenDeck = deckType || 'classic';
    const startingGold = chosenDeck === 'gold' ? 15 : 4;
    const swaps = chosenDeck === 'gold' ? 4 : 5;

    this.state = {
      gold: startingGold,
      swapsRemaining: swaps,
      scoreTarget: 300,
      scoreCurrent: 0,
      ante: 1,
      round: 1,
      candyLevels: {
        red: 1,
        blue: 1,
        green: 1,
        yellow: 1,
        purple: 1
      },
      activeJokers: [],
      boardGrid: null,
      deckType: chosenDeck,
      maxJokerSlots: 5,
      baseSwaps: swaps,
      boughtVouchers: []
    };
    this.jokerManager.maxSlots = 5; // Reset Joker slots
    this.jokerManager.setJokers([]);
    this.startRound();
  }

  public startRound(): void {
    this.state.scoreTarget = this.calculateTargetScore(this.state.ante, this.state.round);
    this.state.scoreCurrent = 0;
    this.state.swapsRemaining = this.state.baseSwaps;
    
    // Sync active jokers from manager to state
    this.state.activeJokers = this.jokerManager.getJokerIds();
  }

  public calculateTargetScore(ante: number, round: number): number {
    // Custom balanced scaling
    if (ante === 1) {
      if (round === 1) return 300;
      if (round === 2) return 600;
      return 1200; // Boss
    }
    if (ante === 2) {
      if (round === 1) return 2000;
      if (round === 2) return 3500;
      return 6000;
    }
    if (ante === 3) {
      if (round === 1) return 10000;
      if (round === 2) return 16000;
      return 28000;
    }
    
    // Beyond Ante 3, scale exponentially
    const base = 28000 * Math.pow(2.5, ante - 3);
    if (round === 1) return Math.round(base * 0.4);
    if (round === 2) return Math.round(base * 0.7);
    return Math.round(base); // Boss
  }

  /**
   * Determine gold reward at the end of a round.
   */
  public calculateGoldReward(): {
    base: number;
    interest: number;
    swapsBonus: number;
    jokerBonus: number;
    total: number;
  } {
    // Base reward by blind type
    let base = 3;
    if (this.state.round === 2) base = 4;
    else if (this.state.round === 3) base = 5;

    // Swaps remaining bonus
    const swapsBonus = this.state.swapsRemaining; // $1 per swap left

    // Interest: $1 for every $5 held, max $5 (like Balatro)
    const interest = Math.min(5, Math.floor(this.state.gold / 5));

    // Joker specific bonuses
    let jokerBonus = 0;
    const jokers = this.jokerManager.getJokers();
    for (const joker of jokers) {
      if (joker.id === 'greedy_teeth') {
        // Greedy teeth gives +$1 per remaining swap
        jokerBonus += this.state.swapsRemaining;
      }
    }

    const total = base + interest + swapsBonus + jokerBonus;

    return {
      base,
      interest,
      swapsBonus,
      jokerBonus,
      total
    };
  }

  public endRound(win: boolean): void {
    if (win) {
      const reward = this.calculateGoldReward();
      this.state.gold += reward.total;
      
      // Advance round
      if (this.state.round === 3) {
        this.state.round = 1;
        this.state.ante += 1;
      } else {
        this.state.round += 1;
      }
    }
  }

  // Candy upgrades in the shop
  public upgradeCandy(color: CandyColor): boolean {
    const cost = this.getCandyUpgradeCost(color);
    if (this.state.gold >= cost) {
      this.state.gold -= cost;
      this.state.candyLevels[color] += 1;
      return true;
    }
    return false;
  }

  public getCandyUpgradeCost(color: CandyColor): number {
    const currentLvl = this.state.candyLevels[color];
    return 3 + (currentLvl - 1) * 2; // Level 1 -> 2: $3, Level 2 -> 3: $5, etc.
  }
}
