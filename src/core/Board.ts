import type { CandyColor, CandyState, MatchGroup } from '../types/game';
import { GameManager } from './GameManager';

export class Board {
  public grid: (CandyState | null)[][];
  public rows: number;
  public cols: number;
  private colors: CandyColor[] = ['red', 'blue', 'green', 'yellow', 'purple'];

  constructor(rows = 8, cols = 8) {
    this.rows = rows;
    this.cols = cols;
    this.grid = Array(rows).fill(null).map(() => Array(cols).fill(null));
    this.initializeBoard();
  }

  private getRandomColor(deckType?: string): CandyColor {
    if (deckType === 'love') {
      // Love box color pool (no blue, more red weight: red=2, other=1)
      const loveColors: CandyColor[] = ['red', 'red', 'green', 'yellow', 'purple'];
      return loveColors[Math.floor(Math.random() * loveColors.length)];
    }
    return this.colors[Math.floor(Math.random() * this.colors.length)];
  }

  // Initialize board with no pre-existing match-3 groups
  public initializeBoard(): void {
    const gameManager = GameManager.getInstance();
    const deckType = gameManager.state.deckType;

    let hasMatches = true;
    while (hasMatches) {
      // Fill board with random colors
      for (let r = 0; r < this.rows; r++) {
        for (let c = 0; c < this.cols; c++) {
          this.grid[r][c] = {
            color: this.getRandomColor(deckType),
            enhancement: 'none',
            edition: 'standard',
            special: 'normal'
          };
        }
      }
      // Check if it has any match-3
      const matches = this.findMatches();
      if (matches.length === 0) {
        hasMatches = false;
      }
    }

    // Boss Blind: freeze 4 random candies!
    if (gameManager.state.round === 3) {
      let frozenCount = 0;
      while (frozenCount < 4) {
        const r = Math.floor(Math.random() * this.rows);
        const c = Math.floor(Math.random() * this.cols);
        const cell = this.grid[r][c];
        if (cell && !cell.frozen) {
          cell.frozen = true;
          frozenCount++;
        }
      }
    }
  }

  // Check if two coordinates are adjacent
  public isAdjacent(r1: number, c1: number, r2: number, c2: number): boolean {
    return Math.abs(r1 - r2) + Math.abs(c1 - c2) === 1;
  }

  // Swap two candies
  public swap(r1: number, c1: number, r2: number, c2: number): void {
    const temp = this.grid[r1][c1];
    this.grid[r1][c1] = this.grid[r2][c2];
    this.grid[r2][c2] = temp;
  }

  // Find all match groups on the board (by matching color)
  public findMatches(): MatchGroup[] {
    const toClear: boolean[][] = Array(this.rows).fill(null).map(() => Array(this.cols).fill(false));
    
    // 1. Mark horizontal matches
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols - 2; c++) {
        const cell = this.grid[r][c];
        if (cell && this.grid[r][c + 1]?.color === cell.color && this.grid[r][c + 2]?.color === cell.color) {
          toClear[r][c] = true;
          toClear[r][c + 1] = true;
          toClear[r][c + 2] = true;
        }
      }
    }

    // 2. Mark vertical matches
    for (let c = 0; c < this.cols; c++) {
      for (let r = 0; r < this.rows - 2; r++) {
        const cell = this.grid[r][c];
        if (cell && this.grid[r + 1][c]?.color === cell.color && this.grid[r + 2][c]?.color === cell.color) {
          toClear[r][c] = true;
          toClear[r + 1][c] = true;
          toClear[r + 2][c] = true;
        }
      }
    }

    // 3. Group marked cells using BFS/DFS
    const visited: boolean[][] = Array(this.rows).fill(null).map(() => Array(this.cols).fill(false));
    const matchGroups: MatchGroup[] = [];

    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        if (toClear[r][c] && !visited[r][c] && this.grid[r][c]) {
          const color = this.grid[r][c]!.color;
          const candies: { row: number; col: number }[] = [];
          const queue: { row: number; col: number }[] = [{ row: r, col: c }];
          
          visited[r][c] = true;
          
          let hasHorizontal = false;
          let hasVertical = false;

          while (queue.length > 0) {
            const current = queue.shift()!;
            candies.push(current);

            // Neighbors in 4 directions
            const dirs = [
              { dr: -1, dc: 0 },
              { dr: 1, dc: 0 },
              { dr: 0, dc: -1 },
              { dr: 0, dc: 1 }
            ];

            for (const d of dirs) {
              const nr = current.row + d.dr;
              const nc = current.col + d.dc;

              if (
                nr >= 0 && nr < this.rows &&
                nc >= 0 && nc < this.cols &&
                toClear[nr][nc] &&
                !visited[nr][nc] &&
                this.grid[nr][nc]?.color === color
              ) {
                visited[nr][nc] = true;
                queue.push({ row: nr, col: nc });
                if (d.dr !== 0) hasVertical = true;
                if (d.dc !== 0) hasHorizontal = true;
              }
            }
          }

          matchGroups.push({
            color,
            candies,
            isVertical: hasVertical && !hasHorizontal
          });
        }
      }
    }

    return matchGroups;
  }

  /**
   * Process explosions for special candies, nổ lan, and spawning new specials.
   * Modifies grid state and returns metadata about cleared cells and new spawned cards.
   */
  public processExplosions(matches: MatchGroup[]): {
    cleared: { row: number; col: number; state: CandyState }[];
    spawns: { row: number; col: number; state: CandyState }[];
    unfrozen: { row: number; col: number }[];
  } {
    const clearedMap = new Map<string, CandyState>();
    const queue: { row: number; col: number }[] = [];
    const spawns: { row: number; col: number; state: CandyState }[] = [];

    // 1. Determine new specials to spawn from matches
    matches.forEach(match => {
      // Collect initial match cells
      match.candies.forEach(candy => {
        const state = this.grid[candy.row][candy.col];
        if (state) {
          clearedMap.set(`${candy.row},${candy.col}`, state);
          queue.push(candy);
        }
      });

      // Special candy creation rules
      if (match.candies.length === 4) {
        // Match-4: Spawn striped candy at the first cell
        const spawnCell = match.candies[0];
        const state: CandyState = {
          color: match.color,
          enhancement: 'none',
          edition: 'standard',
          special: match.isVertical ? 'striped_h' : 'striped_v'
        };
        spawns.push({ row: spawnCell.row, col: spawnCell.col, state });
      } else if (match.candies.length >= 5) {
        // Match-5: Spawn wrapped if L/T shape, or color_bomb if straight
        const spawnCell = match.candies[0];
        
        // Find if L/T shape (spans both multiple rows and columns)
        const rowsSpanned = new Set(match.candies.map(c => c.row)).size;
        const colsSpanned = new Set(match.candies.map(c => c.col)).size;
        const isLT = rowsSpanned > 1 && colsSpanned > 1;

        const state: CandyState = {
          color: match.color,
          enhancement: 'none',
          edition: 'standard',
          special: isLT ? 'wrapped' : 'color_bomb'
        };
        spawns.push({ row: spawnCell.row, col: spawnCell.col, state });
      }
    });

    // 2. Process chain reaction explosions (BFS closure)
    let index = 0;
    while (index < queue.length) {
      const current = queue[index++];
      const currentState = clearedMap.get(`${current.row},${current.col}`);
      if (!currentState) continue;

      // Check special type
      if (currentState.special === 'striped_h') {
        // Explode whole row
        const r = current.row;
        for (let c = 0; c < this.cols; c++) {
          const key = `${r},${c}`;
          if (!clearedMap.has(key)) {
            const state = this.grid[r][c];
            if (state) {
              clearedMap.set(key, state);
              queue.push({ row: r, col: c });
            }
          }
        }
      } else if (currentState.special === 'striped_v') {
        // Explode whole column
        const c = current.col;
        for (let r = 0; r < this.rows; r++) {
          const key = `${r},${c}`;
          if (!clearedMap.has(key)) {
            const state = this.grid[r][c];
            if (state) {
              clearedMap.set(key, state);
              queue.push({ row: r, col: c });
            }
          }
        }
      } else if (currentState.special === 'wrapped') {
        // Explode 3x3
        for (let dr = -1; dr <= 1; dr++) {
          for (let dc = -1; dc <= 1; dc++) {
            const nr = current.row + dr;
            const nc = current.col + dc;
            if (nr >= 0 && nr < this.rows && nc >= 0 && nc < this.cols) {
              const key = `${nr},${nc}`;
              if (!clearedMap.has(key)) {
                const state = this.grid[nr][nc];
                if (state) {
                  clearedMap.set(key, state);
                  queue.push({ row: nr, col: nc });
                }
              }
            }
          }
        }
      } else if (currentState.special === 'color_bomb') {
        // Explode all candies of the bomb's color
        const targetColor = currentState.color;
        for (let r = 0; r < this.rows; r++) {
          for (let c = 0; c < this.cols; c++) {
            const state = this.grid[r][c];
            if (state && state.color === targetColor) {
              const key = `${r},${c}`;
              if (!clearedMap.has(key)) {
                clearedMap.set(key, state);
                queue.push({ row: r, col: c });
              }
            }
          }
        }
      }
    }

    // Unfreeze adjacent candies
    const unfrozen: { row: number; col: number }[] = [];
    clearedMap.forEach((_state, key) => {
      const [r, c] = key.split(',').map(Number);
      const neighbors = [
        { r: r - 1, c },
        { r: r + 1, c },
        { r, c: c - 1 },
        { r, c: c + 1 }
      ];
      for (const n of neighbors) {
        if (n.r >= 0 && n.r < this.rows && n.c >= 0 && n.c < this.cols) {
          const cell = this.grid[n.r][n.c];
          if (cell && cell.frozen) {
            cell.frozen = false;
            if (!unfrozen.some(u => u.row === n.r && u.col === n.c)) {
              unfrozen.push({ row: n.r, col: n.c });
            }
          }
        }
      }
    });

    // 3. Clear logical grid
    clearedMap.forEach((_state, key) => {
      const [r, c] = key.split(',').map(Number);
      this.grid[r][c] = null;
    });

    // 4. Place spawned specials on the board (replacing null)
    spawns.forEach(spawn => {
      this.grid[spawn.row][spawn.col] = spawn.state;
      clearedMap.delete(`${spawn.row},${spawn.col}`); // Ensure not in cleared list
    });

    // Format output
    const cleared: { row: number; col: number; state: CandyState }[] = [];
    clearedMap.forEach((state, key) => {
      const [r, c] = key.split(',').map(Number);
      cleared.push({ row: r, col: c, state });
    });

    return { cleared, spawns, unfrozen };
  }

  // Clear matched candies (fallback simple clear)
  public clearMatches(matches: MatchGroup[]): void {
    for (const match of matches) {
      for (const candy of match.candies) {
        this.grid[candy.row][candy.col] = null;
      }
    }
  }

  // Pull candies down and spawn new ones to fill the board
  // Returns instructions on how the board was refilled for animation purposes
  public refill(): {
    falls: { col: number; fromRow: number; toRow: number; color: CandyColor }[];
    spawns: { col: number; toRow: number; color: CandyColor }[];
  } {
    const falls: { col: number; fromRow: number; toRow: number; color: CandyColor }[] = [];
    const spawns: { col: number; toRow: number; color: CandyColor }[] = [];

    // Process column by column
    for (let c = 0; c < this.cols; c++) {
      // 1. Shift existing candies down
      let emptyCount = 0;
      for (let r = this.rows - 1; r >= 0; r--) {
        if (this.grid[r][c] === null) {
          emptyCount++;
        } else if (emptyCount > 0) {
          const state = this.grid[r][c]!;
          const targetRow = r + emptyCount;
          
          this.grid[targetRow][c] = state;
          this.grid[r][c] = null;

          falls.push({
            col: c,
            fromRow: r,
            toRow: targetRow,
            color: state.color
          });
        }
      }

      // 2. Spawn new candies at the top
      const deckType = GameManager.getInstance().state.deckType;
      for (let i = 0; i < emptyCount; i++) {
        const color = this.getRandomColor(deckType);
        const targetRow = emptyCount - 1 - i;
        
        // 5% chance of spawning an edition card
        let edition: 'standard' | 'foil' | 'holographic' | 'polychrome' = 'standard';
        if (Math.random() < 0.05) {
          const eds: ('foil' | 'holographic' | 'polychrome')[] = ['foil', 'holographic', 'polychrome'];
          edition = eds[Math.floor(Math.random() * eds.length)];
        }

        const state: CandyState = {
          color,
          enhancement: 'none',
          edition,
          special: 'normal'
        };

        this.grid[targetRow][c] = state;

        spawns.push({
          col: c,
          toRow: targetRow,
          color
        });
      }
    }

    return { falls, spawns };
  }

  // Helper check to see if any moves are possible
  public hasPossibleMoves(): boolean {
    // Try swapping horizontally
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols - 1; c++) {
        this.swap(r, c, r, c + 1);
        const matches = this.findMatches();
        this.swap(r, c, r, c + 1); // Swap back
        if (matches.length > 0) return true;
      }
    }
    // Try swapping vertically
    for (let r = 0; r < this.rows - 1; r++) {
      for (let c = 0; c < this.cols; c++) {
        this.swap(r, c, r + 1, c);
        const matches = this.findMatches();
        this.swap(r, c, r + 1, c); // Swap back
        if (matches.length > 0) return true;
      }
    }
    return false;
  }
}
