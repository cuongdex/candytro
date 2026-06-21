import type { Joker } from '../types/joker';
import { createJokerById } from './JokerDb';

export class JokerManager {
  private activeJokers: Joker[] = [];
  public maxSlots = 5;

  constructor() {
    // Start with no jokers
  }

  public getJokers(): Joker[] {
    return this.activeJokers;
  }

  public setJokers(jokers: Joker[]): void {
    this.activeJokers = [...jokers];
  }

  // Load jokers from string IDs
  public loadJokersFromIds(ids: string[]): void {
    this.activeJokers = [];
    for (const id of ids) {
      const joker = createJokerById(id);
      if (joker) {
        this.activeJokers.push(joker);
      }
    }
  }

  public getJokerIds(): string[] {
    return this.activeJokers.map(j => j.id);
  }

  public addJoker(id: string): boolean {
    if (this.activeJokers.length >= this.maxSlots) {
      return false; // Slots full
    }
    const joker = createJokerById(id);
    if (joker) {
      this.activeJokers.push(joker);
      return true;
    }
    return false;
  }

  public removeJoker(index: number): Joker | null {
    if (index >= 0 && index < this.activeJokers.length) {
      const removed = this.activeJokers.splice(index, 1);
      return removed[0];
    }
    return null;
  }

  public sellJoker(index: number): number {
    const joker = this.removeJoker(index);
    return joker ? joker.sellValue : 0;
  }

  // Move a joker from one slot to another (for rearranging)
  public moveJoker(fromIndex: number, toIndex: number): boolean {
    if (
      fromIndex < 0 || fromIndex >= this.activeJokers.length ||
      toIndex < 0 || toIndex >= this.activeJokers.length
    ) {
      return false;
    }
    const [moved] = this.activeJokers.splice(fromIndex, 1);
    this.activeJokers.splice(toIndex, 0, moved);
    return true;
  }
}
