import type { CandyColor, CandyState, GameState } from '../types/game';
import type { Joker, TriggerContext } from '../types/joker';

export class ScoringEngine {
  // Get base stats for a candy color based on its level
  static getBaseCandyStats(_color: CandyColor, level: number): { chips: number; mult: number } {
    return {
      chips: level * 10,
      mult: level
    };
  }

  /**
   * Process a single match-3 event and calculate how it modifies current chips and mult.
   */
  static processScoring(
    matchGroups: { color: CandyColor; size: number }[],
    clearedCandies: CandyState[],
    comboCount: number,
    jokers: Joker[],
    gameState: GameState
  ): {
    chips: number;
    mult: number;
    goldAdded: number;
    triggerMessages: { text: string; source: string; jokerIndex?: number }[];
  } {
    let chips = 0;
    let mult = 0;
    let goldAdded = 0;
    const triggerMessages: { text: string; source: string; jokerIndex?: number }[] = [];

    // 1. Establish base score from all matches in this cascade step
    for (const match of matchGroups) {
      if (gameState.bossDebuffColor && match.color === gameState.bossDebuffColor) {
        continue;
      }
      
      const level = gameState.candyLevels[match.color] || 1;
      const baseStats = this.getBaseCandyStats(match.color, level);
      
      // Calculate match base
      let matchChips = baseStats.chips * match.size;
      let matchMult = baseStats.mult;

      // Bonus for match-4 or match-5
      if (match.size === 4) {
        matchChips += 20;
        matchMult += 2;
      } else if (match.size >= 5) {
        matchChips += 50;
        matchMult += 4;
      }

      chips += matchChips;
      mult += matchMult;
    }

    if (mult < 1) mult = 1;

    // Helper to evaluate a trigger for all jokers
    const runJokerTrigger = (
      triggerType: 'candy' | 'match' | 'cascade_end',
      extra: Partial<TriggerContext>
    ) => {
      for (let i = 0; i < jokers.length; i++) {
        const joker = jokers[i];
        if (gameState.bossDebuffColor) {
          const debuffed = gameState.bossDebuffColor;
          if (
            (joker.id === 'strawberry_blast' && debuffed === 'red') ||
            (joker.id === 'blueberry_fizz' && debuffed === 'blue') ||
            (joker.id === 'grape_soda' && debuffed === 'purple') ||
            (joker.id === 'lemon_squeeze' && debuffed === 'yellow') ||
            (joker.id === 'apple_crisp' && debuffed === 'green') ||
            (joker.id === 'double_trouble' && (debuffed === 'red' || debuffed === 'blue'))
          ) {
            continue;
          }
        }

        const ctx: TriggerContext = {
          triggerType,
          chips,
          mult,
          gold: gameState.gold,
          gameState,
          ...extra
        };

        const res = joker.trigger(ctx);
        chips = res.chips;
        mult = res.mult;
        if (res.goldAdded) {
          goldAdded += res.goldAdded;
        }

        if (res.message) {
          triggerMessages.push({ text: res.message, source: joker.name, jokerIndex: i });
        }
      }
    };

    // 2. Trigger individual candy Enhancements and Editions
    for (const candy of clearedCandies) {
      if (gameState.bossDebuffColor && candy.color === gameState.bossDebuffColor) {
        continue;
      }

      // A. Enhancements
      if (candy.enhancement === 'bonus') {
        chips += 30;
        triggerMessages.push({ text: '+30 Chips', source: 'Kẹo Bạc' });
      } else if (candy.enhancement === 'glass') {
        mult = Math.round(mult * 2);
        triggerMessages.push({ text: 'x2.0 Mult', source: 'Kẹo Thủy Tinh' });
      } else if (candy.enhancement === 'gold') {
        goldAdded += 2;
        triggerMessages.push({ text: '+$2 Vàng', source: 'Kẹo Vàng' });
      } else if (candy.enhancement === 'lucky') {
        if (Math.random() < 0.2) {
          chips += 40;
          triggerMessages.push({ text: '+40 Chips', source: 'Kẹo May Mắn' });
        }
        if (Math.random() < 0.067) {
          goldAdded += 10;
          triggerMessages.push({ text: '+$10 Vàng', source: 'Kẹo May Mắn' });
        }
      }

      // B. Editions
      if (candy.edition === 'foil') {
        chips += 50;
        triggerMessages.push({ text: '+50 Chips', source: 'Viền Foil' });
      } else if (candy.edition === 'holographic') {
        mult += 10;
        triggerMessages.push({ text: '+10 Mult', source: 'Viền Holo' });
      } else if (candy.edition === 'polychrome') {
        mult = Math.round(mult * 1.5);
        triggerMessages.push({ text: 'x1.5 Mult', source: 'Viền Đa Sắc' });
      }

      // C. Joker Triggers per candy
      runJokerTrigger('candy', { candyColor: candy.color });
    }

    // 3. Trigger match group Joker triggers
    for (const match of matchGroups) {
      if (gameState.bossDebuffColor && match.color === gameState.bossDebuffColor) {
        continue;
      }
      runJokerTrigger('match', { candyColor: match.color, matchSize: match.size });
    }

    // 4. Trigger cascade_end Joker triggers
    runJokerTrigger('cascade_end', { comboCount });

    return {
      chips,
      mult,
      goldAdded,
      triggerMessages
    };
  }

  /**
   * Finalize the swap score by applying swap_end effects on all accumulated chips/mult.
   * Also processes Steel candy held on the board.
   */
  static finalizeSwapScore(
    accumulatedChips: number,
    accumulatedMult: number,
    matchedColorsInSwap: CandyColor[],
    jokers: Joker[],
    gameState: GameState
  ): {
    chips: number;
    mult: number;
    goldAdded: number;
    triggerMessages: { text: string; source: string; jokerIndex?: number }[];
  } {
    let chips = accumulatedChips;
    let mult = accumulatedMult;
    let goldAdded = 0;
    const triggerMessages: { text: string; source: string; jokerIndex?: number }[] = [];

    if (mult < 1) mult = 1;

    // 1. Process Steel Candies remaining on the board
    let steelCount = 0;
    if (gameState.boardGrid) {
      for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
          const cell = gameState.boardGrid[r][c];
          if (cell && cell.enhancement === 'steel') {
            if (gameState.bossDebuffColor && cell.color === gameState.bossDebuffColor) {
              continue;
            }
            steelCount++;
          }
        }
      }
    }

    if (steelCount > 0) {
      const multiplier = Math.pow(1.5, steelCount);
      mult = Math.round(mult * multiplier);
      triggerMessages.push({
        text: `x${multiplier.toFixed(1)} Mult (${steelCount} Kẹo Thép)`,
        source: 'Kẹo Thép'
      });
    }

    // 2. Trigger swap_end Joker triggers
    for (let i = 0; i < jokers.length; i++) {
      const joker = jokers[i];
      if (gameState.bossDebuffColor) {
        const debuffed = gameState.bossDebuffColor;
        if (
          (joker.id === 'strawberry_blast' && debuffed === 'red') ||
          (joker.id === 'blueberry_fizz' && debuffed === 'blue') ||
          (joker.id === 'grape_soda' && debuffed === 'purple') ||
          (joker.id === 'lemon_squeeze' && debuffed === 'yellow') ||
          (joker.id === 'apple_crisp' && debuffed === 'green') ||
          (joker.id === 'double_trouble' && (debuffed === 'red' || debuffed === 'blue'))
        ) {
          continue;
        }
      }

      const filteredMatchedColors = matchedColorsInSwap.filter(
        c => c !== gameState.bossDebuffColor
      );

      const ctx: TriggerContext = {
        triggerType: 'swap_end',
        matchedColors: filteredMatchedColors,
        chips,
        mult,
        gold: gameState.gold,
        gameState
      };

      const res = joker.trigger(ctx);
      chips = res.chips;
      mult = res.mult;
      if (res.goldAdded) {
        goldAdded += res.goldAdded;
      }
      if (res.message) {
        triggerMessages.push({ text: res.message, source: joker.name, jokerIndex: i });
      }
    }

    return {
      chips,
      mult,
      goldAdded,
      triggerMessages
    };
  }
}
