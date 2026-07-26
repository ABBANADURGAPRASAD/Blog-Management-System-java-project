import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  getOutfitById,
  HairStyle,
  OutfitLook,
  shadeHex,
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
  @Input() facing: 'front' | 'back' | 'left' | 'right' = 'front';
  @Input() motion: 'none' | 'hi' | 'bye' | 'sleep' | 'idle' = 'none';

  /** Unique gradient ids per instance (avoid SVG id collisions). */
  readonly uid = `av${Math.random().toString(36).slice(2, 9)}`;

  get faceVisible(): boolean {
    return (
      this.showFace &&
      (this.facing === 'front' || this.facing === 'left' || this.facing === 'right') &&
      this.motion !== 'sleep'
    );
  }

  get sleepFace(): boolean {
    return this.facing !== 'back' && this.motion === 'sleep';
  }

  get isBack(): boolean {
    return this.facing === 'back';
  }

  get isSide(): boolean {
    return this.facing === 'left' || this.facing === 'right';
  }

  get outfit() {
    return getOutfitById(this.outfitId);
  }

  get look(): OutfitLook {
    return this.outfit?.look ?? 'tee';
  }

  get hairStyle(): HairStyle {
    return this.outfit?.hair ?? 'short';
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

  get topDark(): string {
    return shadeHex(this.topColor, -0.18);
  }

  get topLight(): string {
    return shadeHex(this.topColor, 0.16);
  }

  get bottomDark(): string {
    return shadeHex(this.bottomColor, -0.2);
  }

  get skinDark(): string {
    return shadeHex(this.skinColor, -0.14);
  }

  get skinLight(): string {
    return shadeHex(this.skinColor, 0.12);
  }

  get hairColor(): string {
    const skin = (this.skinColor || '#FFDFC4').toLowerCase();
    if (skin.includes('5c3d') || skin.includes('3b23')) return '#1a120c';
    if (skin.includes('8d55') || skin.includes('a67c')) return '#3b2314';
    if (skin.includes('d4a5') || skin.includes('f0c8')) return '#5c3d2e';
    if (skin.includes('e8b4')) return '#6b3a4a';
    return '#2c1e14';
  }

  get hairLight(): string {
    return shadeHex(this.hairColor, 0.18);
  }

  get hasGlasses(): boolean {
    return !!this.outfit?.accessories?.glasses;
  }

  get hasCap(): boolean {
    return !!this.outfit?.accessories?.cap;
  }

  get hasVest(): boolean {
    return !!this.outfit?.accessories?.vest;
  }

  get hasGloves(): boolean {
    return !!this.outfit?.accessories?.gloves;
  }

  get isFeminine(): boolean {
    const g = this.outfit?.genders ?? [];
    return g.includes('FEMALE') && !g.includes('MALE');
  }

  get bodyScale(): string {
    const origin = 'translate(100 150)';
    const back = 'translate(-100 -150)';
    if (this.shape === 'TALL') return `${origin} scale(0.92 1.08) ${back}`;
    if (this.shape === 'WIDE') return `${origin} scale(1.1 0.96) ${back}`;
    return '';
  }
}
