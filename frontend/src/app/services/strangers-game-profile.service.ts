import { Injectable } from '@angular/core';
import { StrangersGameCharacter } from '../components/strangers-game/strangers-game-character.model';

const STORAGE_PREFIX = 'strangers_game_character_';

@Injectable({ providedIn: 'root' })
export class StrangersGameProfileService {
  getCharacter(userId: number): StrangersGameCharacter | null {
    try {
      const raw = localStorage.getItem(this.key(userId));
      if (!raw) {
        return null;
      }
      return JSON.parse(raw) as StrangersGameCharacter;
    } catch {
      return null;
    }
  }

  saveCharacter(userId: number, character: StrangersGameCharacter): void {
    localStorage.setItem(this.key(userId), JSON.stringify(character));
  }

  deleteCharacter(userId: number): void {
    localStorage.removeItem(this.key(userId));
  }

  hasCharacter(userId: number): boolean {
    return this.getCharacter(userId) != null;
  }

  private key(userId: number): string {
    return `${STORAGE_PREFIX}${userId}`;
  }
}
