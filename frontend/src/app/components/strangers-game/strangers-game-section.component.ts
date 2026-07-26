import {
  Component,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  SimpleChanges,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { UserService } from '../../services/user.service';
import { StrangersGameProfileService } from '../../services/strangers-game-profile.service';
import {
  AccountGender,
  getOutfitById,
  StrangersGameCharacter,
} from './strangers-game-character.model';
import { StrangersGameCharacterDialogComponent } from './strangers-game-character-dialog.component';
import { StrangersGameAvatarComponent } from './strangers-game-avatar.component';

@Component({
  selector: 'app-strangers-game-section',
  standalone: true,
  imports: [
    CommonModule,
    StrangersGameCharacterDialogComponent,
    StrangersGameAvatarComponent,
  ],
  templateUrl: './strangers-game-section.component.html',
  styleUrls: ['./strangers-game-section.component.css'],
})
export class StrangersGameSectionComponent implements OnInit, OnChanges, OnDestroy {
  @Input() userId: number | null = null;

  character: StrangersGameCharacter | null = null;
  accountGender: AccountGender = null;
  characterDialogOpen = false;
  editCharacterMode = false;
  gameStatus = '';

  private userSub?: Subscription;

  constructor(
    private profileService: StrangersGameProfileService,
    private userService: UserService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.reloadCharacter();
    this.loadAccountGender();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['userId']) {
      this.reloadCharacter();
      this.loadAccountGender();
    }
  }

  ngOnDestroy(): void {
    this.userSub?.unsubscribe();
  }

  get outfitLabel(): string {
    if (!this.character) {
      return '';
    }
    return getOutfitById(this.character.outfitId)?.label ?? this.character.outfitId;
  }

  onLetsPlay(): void {
    if (!this.userId) {
      this.gameStatus = 'Sign in to play with strangers.';
      return;
    }
    if (!this.character) {
      this.editCharacterMode = false;
      this.characterDialogOpen = true;
      return;
    }
    void this.router.navigate(['/avatar-games']);
  }

  onEditCharacter(): void {
    this.editCharacterMode = true;
    this.characterDialogOpen = true;
  }

  onDialogClosed(): void {
    this.characterDialogOpen = false;
    this.editCharacterMode = false;
  }

  onCharacterCreated(character: StrangersGameCharacter): void {
    if (!this.userId) {
      return;
    }
    const wasEdit = this.editCharacterMode;
    this.profileService.saveCharacter(this.userId, character);
    this.character = character;
    this.characterDialogOpen = false;
    this.editCharacterMode = false;
    if (!wasEdit) {
      void this.router.navigate(['/avatar-games']);
    }
  }

  private reloadCharacter(): void {
    if (this.userId) {
      this.character = this.profileService.getCharacter(this.userId);
    } else {
      this.character = null;
    }
  }

  private loadAccountGender(): void {
    this.userSub?.unsubscribe();
    if (!this.userId) {
      this.accountGender = null;
      return;
    }
    this.userSub = this.userService.getUserById(this.userId).subscribe({
      next: (user) => {
        this.accountGender = user.gender ?? null;
      },
      error: () => {
        this.accountGender = null;
      },
    });
  }
}
