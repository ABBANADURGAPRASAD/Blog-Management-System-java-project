import { Component, HostListener, NgZone, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import {
  AvatarCityBuildingOwner,
  AvatarCityPlayer,
  AvatarCityService,
} from '../../../services/avatar-city.service';
import { StrangersGameProfileService } from '../../../services/strangers-game-profile.service';
import {
  StrangerCharacterShape,
  StrangersGameCharacter,
} from '../../strangers-game/strangers-game-character.model';
import { StrangersGameAvatarComponent } from '../../strangers-game/strangers-game-avatar.component';
import {
  CITY_CENTER,
  CITY_ROADS,
  CITY_SCENERY,
  CITY_WORLD,
  CityPlace,
  OwnableBuilding,
  getOwnableById,
  hitsObstacle,
  nearBuilding,
  nearPlayer,
  placeAt,
  unlockedBuildings,
  unlockedPlaces,
} from './city-map.data';

type WalkFacing = 'front' | 'back' | 'left' | 'right';
type Dir = 'up' | 'down' | 'left' | 'right';

@Component({
  selector: 'app-avatar-city',
  standalone: true,
  imports: [CommonModule, RouterModule, StrangersGameAvatarComponent],
  templateUrl: './avatar-city.component.html',
  styleUrls: ['./avatar-city.component.css'],
})
export class AvatarCityComponent implements OnInit, OnDestroy {
  character: StrangersGameCharacter | null = null;
  userId: number | null = null;

  readonly world = CITY_WORLD;
  readonly roads = CITY_ROADS;
  readonly scenery = CITY_SCENERY;

  x = CITY_CENTER.x;
  y = CITY_CENTER.y;
  facing: WalkFacing = 'front';
  walking = false;
  currentPlace: CityPlace | null = null;
  others: AvatarCityPlayer[] = [];
  onlineCount = 1;
  ownerCount = 0;
  ownerships: AvatarCityBuildingOwner[] = [];
  myBuildingId: string | null = null;
  nearbyBuilding: OwnableBuilding | null = null;
  nearbyPlayer: AvatarCityPlayer | null = null;
  chatConfirmOpen = false;
  actionHint = '';
  syncHint = 'Connecting to shared city…';
  spawned = false;

  private readonly step = 18;
  private keys = new Set<string>();
  private moveTimer?: ReturnType<typeof setInterval>;
  private walkTimer?: ReturnType<typeof setTimeout>;
  private held: Dir | null = null;
  private pollHandle?: ReturnType<typeof setInterval>;
  private publishHandle?: ReturnType<typeof setInterval>;
  private dirty = true;
  private lastPublishAt = 0;

  constructor(
    private auth: AuthService,
    private profileService: StrangersGameProfileService,
    private cityApi: AvatarCityService,
    private router: Router,
    private zone: NgZone
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
      void this.router.navigate(['/avatar-games']);
      return;
    }
    this.bootstrap();
    this.pollHandle = setInterval(() => this.refreshState(), 1000);
    this.publishHandle = setInterval(() => this.publishPresence(false), 700);
    this.moveTimer = setInterval(() => {
      if (this.held) {
        this.zone.run(() => this.stepOnce(this.held!));
      }
    }, 40);
  }

  ngOnDestroy(): void {
    if (this.moveTimer) clearInterval(this.moveTimer);
    if (this.walkTimer) clearTimeout(this.walkTimer);
    if (this.pollHandle) clearInterval(this.pollHandle);
    if (this.publishHandle) clearInterval(this.publishHandle);
    if (this.userId != null) {
      this.cityApi.leave(this.userId).subscribe({ error: () => undefined });
    }
  }

  get places(): CityPlace[] {
    return unlockedPlaces(this.ownerCount);
  }

  get buildings(): OwnableBuilding[] {
    return unlockedBuildings(this.ownerCount);
  }

  get cameraStyle(): Record<string, string> {
    const vw = typeof window !== 'undefined' ? window.innerWidth : 800;
    const vh = typeof window !== 'undefined' ? window.innerHeight - 64 : 600;
    const cx = Math.min(
      Math.max(this.x - vw / 2, 0),
      Math.max(this.world.width - vw, 0)
    );
    const cy = Math.min(
      Math.max(this.y - vh / 2, 0),
      Math.max(this.world.height - vh, 0)
    );
    return {
      transform: `translate(${-cx}px, ${-cy}px)`,
      width: `${this.world.width}px`,
      height: `${this.world.height}px`,
    };
  }

  get avatarStyle(): Record<string, string> {
    return {
      transform: `translate(${this.x}px, ${this.y}px) translate(-50%, -85%)`,
    };
  }

  get minimapDot(): Record<string, string> {
    return {
      left: `${(this.x / this.world.width) * 100}%`,
      top: `${(this.y / this.world.height) * 100}%`,
    };
  }

  get myBuildingLabel(): string {
    if (!this.myBuildingId) return 'No home yet — adopt a house';
    return getOwnableById(this.myBuildingId)?.label ?? this.myBuildingId;
  }

  ownerOf(buildingId: string): AvatarCityBuildingOwner | undefined {
    return this.ownerships.find((o) => o.buildingId === buildingId);
  }

  otherStyle(p: AvatarCityPlayer): Record<string, string> {
    return {
      transform: `translate(${p.x}px, ${p.y}px) translate(-50%, -85%)`,
    };
  }

  otherFacing(p: AvatarCityPlayer): WalkFacing {
    const f = (p.facing || 'front').toLowerCase();
    if (f === 'back' || f === 'left' || f === 'right' || f === 'front') return f;
    return 'front';
  }

  otherShape(p: AvatarCityPlayer): StrangerCharacterShape {
    const s = (p.shape || 'ROUND').toUpperCase();
    if (s === 'TALL' || s === 'WIDE' || s === 'ROUND') return s;
    return 'ROUND';
  }

  miniOtherDot(p: AvatarCityPlayer): Record<string, string> {
    return {
      left: `${(p.x / this.world.width) * 100}%`,
      top: `${(p.y / this.world.height) * 100}%`,
    };
  }

  trackPlayer(_i: number, p: AvatarCityPlayer): number {
    return p.userId;
  }

  trackBuilding(_i: number, b: OwnableBuilding): string {
    return b.id;
  }

  @HostListener('window:keydown', ['$event'])
  onKeyDown(ev: KeyboardEvent): void {
    if (ev.code === 'KeyE') {
      ev.preventDefault();
      this.tryClaimOrRelease();
      return;
    }
    if (ev.code === 'KeyC' && this.nearbyPlayer) {
      ev.preventDefault();
      this.openChatPrompt();
      return;
    }
    const map: Record<string, Dir> = {
      ArrowUp: 'up',
      KeyW: 'up',
      ArrowDown: 'down',
      KeyS: 'down',
      ArrowLeft: 'left',
      KeyA: 'left',
      ArrowRight: 'right',
      KeyD: 'right',
    };
    const dir = map[ev.code];
    if (!dir) return;
    ev.preventDefault();
    this.keys.add(dir);
    this.held = dir;
  }

  @HostListener('window:keyup', ['$event'])
  onKeyUp(ev: KeyboardEvent): void {
    const map: Record<string, Dir> = {
      ArrowUp: 'up',
      KeyW: 'up',
      ArrowDown: 'down',
      KeyS: 'down',
      ArrowLeft: 'left',
      KeyA: 'left',
      ArrowRight: 'right',
      KeyD: 'right',
    };
    const dir = map[ev.code];
    if (!dir) return;
    this.keys.delete(dir);
    if (this.held === dir) {
      this.held = ([...this.keys][0] as Dir | undefined) ?? null;
    }
  }

  press(dir: Dir): void {
    this.keys.add(dir);
    this.held = dir;
  }

  release(dir: Dir): void {
    this.keys.delete(dir);
    if (this.held === dir) {
      this.held = ([...this.keys][0] as Dir | undefined) ?? null;
    }
  }

  goBack(): void {
    void this.router.navigate(['/avatar-games']);
  }

  goHome(): void {
    if (this.myBuildingId) {
      const b = getOwnableById(this.myBuildingId);
      if (b) {
        this.x = b.spawnX;
        this.y = b.spawnY;
        this.dirty = true;
        this.refreshPlace();
        this.publishPresence(true);
        return;
      }
    }
    this.x = CITY_CENTER.x;
    this.y = CITY_CENTER.y;
    this.dirty = true;
    this.refreshPlace();
    this.publishPresence(true);
  }

  jumpTo(place: CityPlace): void {
    const nx = place.x + place.w / 2;
    const ny = place.y + place.h - 50;
    if (!hitsObstacle(nx, ny, 36, 28, this.buildings)) {
      this.x = nx;
      this.y = ny;
      this.dirty = true;
      this.refreshPlace();
      this.updateNearby();
      this.publishPresence(true);
    }
  }

  openChatPrompt(): void {
    if (!this.nearbyPlayer) return;
    this.chatConfirmOpen = true;
  }

  cancelChatPrompt(): void {
    this.chatConfirmOpen = false;
  }

  confirmChatRequest(): void {
    if (!this.nearbyPlayer) {
      this.chatConfirmOpen = false;
      return;
    }
    const peer = this.nearbyPlayer;
    this.chatConfirmOpen = false;
    void this.router.navigate(['/random-chat'], {
      queryParams: {
        fromCity: '1',
        peerId: peer.userId,
        peerName: peer.characterName,
      },
    });
  }

  tryClaimOrRelease(): void {
    if (!this.userId || !this.character) return;

    if (this.nearbyBuilding && this.myBuildingId === this.nearbyBuilding.id) {
      this.cityApi.releaseBuilding(this.userId).subscribe({
        next: () => {
          this.myBuildingId = null;
          this.actionHint = 'Home released — you spawn at City Center now.';
          this.refreshState();
        },
        error: () => {
          this.actionHint = 'Could not release building.';
        },
      });
      return;
    }

    if (!this.nearbyBuilding) {
      this.actionHint = 'Walk to a free house door and press E / Adopt.';
      return;
    }

    const owned = this.ownerOf(this.nearbyBuilding.id);
    if (owned && !owned.mine) {
      this.actionHint = `Already owned by ${owned.ownerName}`;
      return;
    }

    this.cityApi
      .claimBuilding(this.userId, this.nearbyBuilding.id, this.character.name)
      .subscribe({
        next: (res) => {
          this.myBuildingId = res.buildingId;
          this.actionHint = `You adopted ${this.nearbyBuilding?.label} — next login starts here.`;
          this.refreshState();
        },
        error: (err) => {
          const msg = err?.error?.error || 'Could not adopt building.';
          this.actionHint = String(msg);
        },
      });
  }

  private bootstrap(): void {
    if (!this.userId) return;
    this.cityApi.getState(this.userId).subscribe({
      next: (state) => {
        this.applyState(state);
        if (!this.spawned) {
          this.x = state.spawn.x;
          this.y = state.spawn.y;
          if (hitsObstacle(this.x, this.y, 36, 28, this.buildings)) {
            this.x = CITY_CENTER.x;
            this.y = CITY_CENTER.y;
          }
          this.myBuildingId = state.spawn.buildingId ?? null;
          this.spawned = true;
          this.refreshPlace();
          this.updateNearby();
        }
        this.publishPresence(true);
        this.syncHint = 'Live on the shared city map';
      },
      error: () => {
        this.syncHint = 'Could not sync — is the backend running?';
        this.x = CITY_CENTER.x;
        this.y = CITY_CENTER.y;
        this.spawned = true;
        this.refreshPlace();
      },
    });
  }

  private refreshState(): void {
    if (!this.userId) return;
    this.cityApi.getState(this.userId).subscribe({
      next: (state) => this.applyState(state),
      error: () => undefined,
    });
  }

  private applyState(state: {
    players: AvatarCityPlayer[];
    ownerships: AvatarCityBuildingOwner[];
    ownerCount: number;
    spawn: { buildingId?: string | null };
  }): void {
    this.others = state.players.filter((p) => !p.self && p.userId !== this.userId);
    this.onlineCount = Math.max(1, state.players.length || 1);
    this.ownerships = state.ownerships;
    this.ownerCount = state.ownerCount;
    const mine = state.ownerships.find((o) => o.mine);
    this.myBuildingId = mine?.buildingId ?? state.spawn.buildingId ?? null;
    this.updateNearby();
  }

  private stepOnce(dir: Dir): void {
    let nx = this.x;
    let ny = this.y;
    if (dir === 'up') {
      ny -= this.step;
      this.facing = 'back';
    } else if (dir === 'down') {
      ny += this.step;
      this.facing = 'front';
    } else if (dir === 'left') {
      nx -= this.step;
      this.facing = 'left';
    } else {
      nx += this.step;
      this.facing = 'right';
    }

    nx = Math.min(Math.max(nx, 40), this.world.width - 40);
    ny = Math.min(Math.max(ny, 40), this.world.height - 40);

    const stuckNow = hitsObstacle(this.x, this.y, 36, 28, this.buildings);
    const blockedNext = hitsObstacle(nx, ny, 36, 28, this.buildings);

    if (blockedNext && !stuckNow) {
      return;
    }

    if (blockedNext && stuckNow) {
      const boost = this.step * 2;
      let ex = this.x;
      let ey = this.y;
      if (dir === 'up') ey -= boost;
      else if (dir === 'down') ey += boost;
      else if (dir === 'left') ex -= boost;
      else ex += boost;
      ex = Math.min(Math.max(ex, 40), this.world.width - 40);
      ey = Math.min(Math.max(ey, 40), this.world.height - 40);
      if (hitsObstacle(ex, ey, 36, 28, this.buildings)) {
        return;
      }
      nx = ex;
      ny = ey;
    }

    this.x = nx;
    this.y = ny;
    this.dirty = true;
    this.walking = true;
    if (this.walkTimer) clearTimeout(this.walkTimer);
    this.walkTimer = setTimeout(() => (this.walking = false), 160);
    this.refreshPlace();
    this.updateNearby();
  }

  private refreshPlace(): void {
    this.currentPlace = placeAt(this.x, this.y, this.ownerCount);
  }

  private updateNearby(): void {
    this.nearbyBuilding = null;
    for (const b of this.buildings) {
      if (nearBuilding(this.x, this.y, b)) {
        this.nearbyBuilding = b;
        break;
      }
    }

    let closest: AvatarCityPlayer | null = null;
    let best = Infinity;
    for (const o of this.others) {
      if (!nearPlayer(this.x, this.y, o.x, o.y)) continue;
      const d = (this.x - o.x) ** 2 + (this.y - o.y) ** 2;
      if (d < best) {
        best = d;
        closest = o;
      }
    }
    this.nearbyPlayer = closest;
    if (!closest) {
      this.chatConfirmOpen = false;
    }
  }

  private publishPresence(force: boolean): void {
    if (!this.userId || !this.character || !this.spawned) return;
    const now = Date.now();
    if (!force && !this.dirty && now - this.lastPublishAt < 2500) return;
    this.dirty = false;
    this.lastPublishAt = now;
    this.cityApi
      .updatePresence(this.userId, {
        x: this.x,
        y: this.y,
        facing: this.facing,
        characterName: this.character.name,
        skinColor: this.character.skinColor,
        shape: this.character.shape,
        outfitId: this.character.outfitId,
        placeId: this.currentPlace?.id ?? null,
      })
      .subscribe({
        next: () => {
          this.syncHint = 'Live on the shared city map';
        },
        error: () => {
          this.syncHint = 'Could not sync — is the backend running?';
        },
      });
  }
}
