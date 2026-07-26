import {
  AfterViewInit,
  Component,
  ElementRef,
  HostListener,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { StrangersGameProfileService } from '../../services/strangers-game-profile.service';
import { StrangersGameCharacter } from '../strangers-game/strangers-game-character.model';
import { StrangersGameAvatarComponent } from '../strangers-game/strangers-game-avatar.component';
import { AVATAR_GAME_TILES, AvatarGameTile } from './games.catalog';

type AvatarHubMotion = 'hi' | 'bye' | 'sleep' | 'idle';

@Component({
  selector: 'app-avatar-games',
  standalone: true,
  imports: [CommonModule, RouterModule, StrangersGameAvatarComponent],
  templateUrl: './avatar-games.component.html',
  styleUrls: ['./avatar-games.component.css'],
})
export class AvatarGamesComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('mapPane') mapPane?: ElementRef<HTMLDivElement>;

  character: StrangersGameCharacter | null = null;
  userId: number | null = null;
  mapHint = '';
  avatarMotion: AvatarHubMotion = 'hi';
  speech = 'Hi!';
  gameTiles = AVATAR_GAME_TILES;

  private mapLat = 40.7128;
  private mapLng = -74.006;
  private leafletMap: any = null;
  private lastScrollY = 0;
  private idleTimer?: ReturnType<typeof setTimeout>;
  private hiTimer?: ReturnType<typeof setTimeout>;
  private readonly IDLE_MS = 8000;

  constructor(
    private auth: AuthService,
    private profileService: StrangersGameProfileService,
    private router: Router
  ) {}

  ngOnInit(): void {
    const user = this.auth.getCurrentUser();
    this.userId = user?.id ?? null;
    if (!this.userId) {
      void this.router.navigate(['/login']);
      return;
    }
    this.character = this.profileService.getCharacter(this.userId);
    if (!this.character) {
      void this.router.navigate(['/random-chat']);
      return;
    }
    this.lastScrollY = window.scrollY || 0;
    this.playHi();
    this.tryBrowserLocation();
    this.bumpActivity();
  }

  ngAfterViewInit(): void {
    setTimeout(() => this.initLeafletMap(), 80);
  }

  ngOnDestroy(): void {
    if (this.leafletMap) {
      this.leafletMap.remove();
      this.leafletMap = null;
    }
    if (this.idleTimer) clearTimeout(this.idleTimer);
    if (this.hiTimer) clearTimeout(this.hiTimer);
  }

  get avatarFacing(): 'front' | 'back' {
    return this.avatarMotion === 'idle' ? 'back' : 'front';
  }

  @HostListener('window:scroll')
  onWindowScroll(): void {
    const y = window.scrollY || 0;
    if (y > this.lastScrollY + 24) {
      this.playBye();
    } else if (y < this.lastScrollY - 24 && this.avatarMotion === 'bye') {
      this.setMotion('idle', 'Looking around…');
    }
    this.lastScrollY = y;
    this.bumpActivity();
  }

  @HostListener('window:pointermove')
  @HostListener('window:keydown')
  @HostListener('window:touchstart')
  onUserActivity(): void {
    this.bumpActivity();
  }

  onLetsGo(): void {
    void this.router.navigate(['/avatar-games/city']);
  }

  onGamePick(tile: AvatarGameTile): void {
    void this.router.navigateByUrl(tile.route);
  }

  goBack(): void {
    void this.router.navigate(['/random-chat']);
  }

  private playHi(): void {
    this.setMotion('hi', 'Hi!');
    if (this.hiTimer) clearTimeout(this.hiTimer);
    this.hiTimer = setTimeout(() => {
      if (this.avatarMotion === 'hi') {
        this.setMotion('idle', 'Ready for the streets');
      }
    }, 2800);
  }

  private playBye(): void {
    if (this.avatarMotion === 'bye') {
      return;
    }
    this.setMotion('bye', 'Bye!');
  }

  private playSleep(): void {
    this.setMotion('sleep', 'Zzz…');
  }

  private setMotion(motion: AvatarHubMotion, speech: string): void {
    this.avatarMotion = motion;
    this.speech = speech;
  }

  private bumpActivity(): void {
    if (this.avatarMotion === 'sleep') {
      this.setMotion('idle', 'Oh — you are back!');
    } else if (this.avatarMotion === 'bye' && (window.scrollY || 0) < 40) {
      this.setMotion('idle', 'Ready for the streets');
    }
    if (this.idleTimer) clearTimeout(this.idleTimer);
    this.idleTimer = setTimeout(() => {
      if (this.avatarMotion === 'hi') {
        this.bumpActivity();
        return;
      }
      this.playSleep();
    }, this.IDLE_MS);
  }

  private tryBrowserLocation(): void {
    if (!navigator.geolocation) {
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        this.mapLat = pos.coords.latitude;
        this.mapLng = pos.coords.longitude;
        if (this.leafletMap) {
          this.leafletMap.setView([this.mapLat, this.mapLng], 15);
        }
      },
      () => undefined,
      { enableHighAccuracy: false, timeout: 8000 }
    );
  }

  private initLeafletMap(): void {
    const el = this.mapPane?.nativeElement;
    if (!el || this.leafletMap) {
      return;
    }
    if (typeof L === 'undefined') {
      this.mapHint = 'Map could not load. Check network for map tiles.';
      return;
    }
    this.leafletMap = L.map(el, {
      zoomControl: true,
      dragging: true,
      scrollWheelZoom: false,
    }).setView([this.mapLat, this.mapLng], 15);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(this.leafletMap);
    setTimeout(() => this.leafletMap?.invalidateSize(), 280);
  }
}
