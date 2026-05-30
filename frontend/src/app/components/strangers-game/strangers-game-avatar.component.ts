import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  getOutfitById,
  StrangerCharacterShape,
} from './strangers-game-character.model';

@Component({
  selector: 'app-strangers-game-avatar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './strangers-game-avatar.component.html',
  styleUrls: ['./strangers-game-avatar.component.css'],
})
export class StrangersGameAvatarComponent {
  @Input() skinColor = '#FFDFC4';
  @Input() shape: StrangerCharacterShape = 'ROUND';
  @Input() outfitId = 'uni-tee';
  @Input() size: 'sm' | 'md' | 'lg' = 'md';
  @Input() showFace = true;

  get outfit() {
    return getOutfitById(this.outfitId);
  }

  get topColor(): string {
    return this.outfit?.topColor ?? '#4A90E2';
  }

  get bottomColor(): string {
    return this.outfit?.bottomColor ?? '#2C3E50';
  }

  get accentColor(): string {
    return this.outfit?.accentColor ?? '#FFFFFF';
  }
}
