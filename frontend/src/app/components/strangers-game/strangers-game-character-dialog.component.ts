import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  AccountGender,
  CHARACTER_SHAPES,
  normalizeAccountGender,
  outfitOptionsForGender,
  SKIN_TONE_PRESETS,
  StrangerCharacterShape,
  StrangersGameCharacter,
} from './strangers-game-character.model';
import { StrangersGameAvatarComponent } from './strangers-game-avatar.component';

export type CharacterWizardStep =
  | 'skin'
  | 'shape'
  | 'name'
  | 'outfit'
  | 'review';

const STEP_ORDER: CharacterWizardStep[] = ['skin', 'shape', 'name', 'outfit', 'review'];

@Component({
  selector: 'app-strangers-game-character-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, StrangersGameAvatarComponent],
  templateUrl: './strangers-game-character-dialog.component.html',
  styleUrls: ['./strangers-game-character-dialog.component.css'],
})
export class StrangersGameCharacterDialogComponent implements OnChanges {
  @Input() open = false;
  @Input() accountGender: AccountGender = null;
  @Input() existing: StrangersGameCharacter | null = null;
  @Input() editMode = false;

  @Output() closed = new EventEmitter<void>();
  @Output() created = new EventEmitter<StrangersGameCharacter>();

  readonly skinPresets = SKIN_TONE_PRESETS;
  readonly shapes = CHARACTER_SHAPES;
  readonly steps = STEP_ORDER;

  stepIndex = 0;
  skinColor = SKIN_TONE_PRESETS[0].hex;
  shape: StrangerCharacterShape = 'ROUND';
  characterName = '';
  outfitId = '';
  validationError = '';

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['open'] && this.open) {
      this.resetFromExisting();
    }
    if (changes['accountGender'] || changes['open']) {
      this.ensureOutfitDefault();
    }
  }

  get step(): CharacterWizardStep {
    return this.steps[this.stepIndex];
  }

  get stepLabel(): string {
    const labels: Record<CharacterWizardStep, string> = {
      skin: 'Skin tone',
      shape: 'Body shape',
      name: 'Character name',
      outfit: 'Outfit',
      review: 'Review',
    };
    return labels[this.step];
  }

  get outfitOptions() {
    return outfitOptionsForGender(this.accountGender);
  }

  get accountGenderLabel(): string {
    const g = normalizeAccountGender(this.accountGender);
    if (g === 'MALE') {
      return 'Male';
    }
    if (g === 'FEMALE') {
      return 'Female';
    }
    return 'Any / not set on profile';
  }

  get progressPct(): number {
    return Math.round(((this.stepIndex + 1) / this.steps.length) * 100);
  }

  get selectedOutfitLabel(): string {
    const o = this.outfitOptions.find((x) => x.id === this.outfitId);
    return o?.label ?? this.outfitId;
  }

  close(): void {
    this.closed.emit();
  }

  onBackdropClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('sg-dialog-backdrop')) {
      this.close();
    }
  }

  back(): void {
    this.validationError = '';
    if (this.stepIndex > 0) {
      this.stepIndex--;
    }
  }

  next(): void {
    if (!this.validateCurrentStep()) {
      return;
    }
    if (this.stepIndex < this.steps.length - 1) {
      this.stepIndex++;
      this.validationError = '';
    }
  }

  goToStep(index: number): void {
    if (index >= 0 && index < this.steps.length) {
      this.stepIndex = index;
      this.validationError = '';
    }
  }

  createCharacter(): void {
    if (!this.validateCurrentStep()) {
      return;
    }
    const name = this.characterName.trim();
    if (!name) {
      this.validationError = 'Enter a name for your character.';
      this.stepIndex = this.steps.indexOf('name');
      return;
    }
    const now = new Date().toISOString();
    const character: StrangersGameCharacter = {
      skinColor: this.skinColor,
      shape: this.shape,
      name,
      outfitId: this.outfitId || this.outfitOptions[0]?.id || 'uni-tee',
      accountGenderUsed: normalizeAccountGender(this.accountGender),
      createdAt: this.existing?.createdAt ?? now,
      updatedAt: now,
    };
    this.created.emit(character);
  }

  selectSkin(hex: string): void {
    this.skinColor = hex;
  }

  selectShape(id: StrangerCharacterShape): void {
    this.shape = id;
  }

  selectOutfit(id: string): void {
    this.outfitId = id;
  }

  private resetFromExisting(): void {
    this.stepIndex = 0;
    this.validationError = '';
    if (this.existing) {
      this.skinColor = this.existing.skinColor;
      this.shape = this.existing.shape;
      this.characterName = this.existing.name;
      this.outfitId = this.existing.outfitId;
    } else {
      this.skinColor = SKIN_TONE_PRESETS[0].hex;
      this.shape = 'ROUND';
      this.characterName = '';
      this.outfitId = '';
    }
    this.ensureOutfitDefault();
  }

  private ensureOutfitDefault(): void {
    const options = this.outfitOptions;
    if (!options.length) {
      return;
    }
    if (!options.some((o) => o.id === this.outfitId)) {
      this.outfitId = options[0].id;
    }
  }

  private validateCurrentStep(): boolean {
    this.validationError = '';
    switch (this.step) {
      case 'skin':
        if (!this.skinColor) {
          this.validationError = 'Pick a skin tone.';
          return false;
        }
        return true;
      case 'shape':
        return true;
      case 'name':
        if (!this.characterName.trim()) {
          this.validationError = 'Give your cartoon a name (2–24 characters).';
          return false;
        }
        if (this.characterName.trim().length < 2) {
          this.validationError = 'Name must be at least 2 characters.';
          return false;
        }
        if (this.characterName.trim().length > 24) {
          this.validationError = 'Name must be 24 characters or fewer.';
          return false;
        }
        return true;
      case 'outfit':
        if (!this.outfitId) {
          this.validationError = 'Choose an outfit.';
          return false;
        }
        return true;
      case 'review':
        return true;
      default:
        return true;
    }
  }
}
