import {
  Component,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  SimpleChanges,
} from '@angular/core';
import { CommonModule } from '@angular/common';
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
  gameActive = false;
  gameStatus = '';
  lobbyTick = 0;

  private userSub?: Subscription;
  private lobbyInterval?: ReturnType<typeof setInterval>;

  constructor(
    private profileService: StrangersGameProfileService,
    private userService: UserService
  ) {}

  ngOnInit(): void {
    this.reloadCharacter();
    this.loadAccountGender();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['userId']) {
      this.stopLobby();
      this.gameActive = false;
      this.reloadCharacter();
      this.loadAccountGender();
    }
  }

  ngOnDestroy(): void {
    this.userSub?.unsubscribe();
    this.stopLobby();
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
    this.startGame();
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
    this.profileService.saveCharacter(this.userId, character);
    this.character = character;
    this.characterDialogOpen = false;
    this.editCharacterMode = false;
    this.startGame();
  }

  exitGame(): void {
    this.stopLobby();
    this.gameActive = false;
    this.gameStatus = '';
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

  private startGame(): void {
    this.gameActive = true;
    this.gameStatus = 'Looking for strangers to play with…';
    this.stopLobby();
    this.lobbyTick = 0;
    this.lobbyInterval = setInterval(() => {
      this.lobbyTick++;
      const dots = '.'.repeat((this.lobbyTick % 3) + 1);
      this.gameStatus = `Matching players${dots}`;
      if (this.lobbyTick >= 4) {
        this.gameStatus = 'You are in the lobby — say hi when someone joins!';
      }
    }, 900);
  }

  private stopLobby(): void {
    if (this.lobbyInterval) {
      clearInterval(this.lobbyInterval);
      this.lobbyInterval = undefined;
    }
  }
}
