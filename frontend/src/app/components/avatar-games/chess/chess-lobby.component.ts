import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { StrangersGameProfileService } from '../../../services/strangers-game-profile.service';
import { StrangersGameCharacter } from '../../strangers-game/strangers-game-character.model';
import { StrangersGameAvatarComponent } from '../../strangers-game/strangers-game-avatar.component';

export type ChessMode = 'strangers' | 'friends' | 'avatar';

@Component({
  selector: 'app-chess-lobby',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, StrangersGameAvatarComponent],
  templateUrl: './chess-lobby.component.html',
  styleUrls: ['./chess-lobby.component.css'],
})
export class ChessLobbyComponent implements OnInit {
  character: StrangersGameCharacter | null = null;
  selected: ChessMode | null = null;
  roomCode = '';
  friendName = '';
  status = '';

  constructor(
    private auth: AuthService,
    private profileService: StrangersGameProfileService,
    private router: Router
  ) {}

  ngOnInit(): void {
    const user = this.auth.getCurrentUser();
    if (!user?.id) {
      void this.router.navigate(['/login']);
      return;
    }
    this.character = this.profileService.getCharacter(user.id);
  }

  selectMode(mode: ChessMode): void {
    this.selected = mode;
    this.status = '';
    if (mode === 'friends' && !this.roomCode) {
      this.roomCode = this.makeRoomCode();
    }
  }

  start(): void {
    if (!this.selected) {
      this.status = 'Pick how you want to play.';
      return;
    }
    if (this.selected === 'friends' && !this.roomCode.trim() && !this.friendName.trim()) {
      this.status = 'Create a room code or enter a friend name to request.';
      return;
    }
    void this.router.navigate(['/avatar-games/chess/play'], {
      queryParams: {
        mode: this.selected,
        room: this.roomCode.trim() || null,
        friend: this.friendName.trim() || null,
      },
    });
  }

  goBack(): void {
    void this.router.navigate(['/avatar-games']);
  }

  private makeRoomCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let out = '';
    for (let i = 0; i < 6; i++) {
      out += chars[Math.floor(Math.random() * chars.length)];
    }
    return out;
  }
}
