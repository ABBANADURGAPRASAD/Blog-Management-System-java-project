import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { StrangersGameProfileService } from '../../../services/strangers-game-profile.service';
import { StrangersGameCharacter } from '../../strangers-game/strangers-game-character.model';
import { StrangersGameAvatarComponent } from '../../strangers-game/strangers-game-avatar.component';

@Component({
  selector: 'app-streets-play',
  standalone: true,
  imports: [CommonModule, RouterModule, StrangersGameAvatarComponent],
  templateUrl: './streets-play.component.html',
  styleUrls: ['./streets-play.component.css'],
})
export class StreetsPlayComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('mapPane') mapPane?: ElementRef<HTMLDivElement>;

  character: StrangersGameCharacter | null = null;
  status = 'Walk the streets — proximity chat comes next.';
  private mapLat = 40.7128;
  private mapLng = -74.006;
  private leafletMap: any = null;

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
    if (!this.character) {
      void this.router.navigate(['/avatar-games']);
      return;
    }
    navigator.geolocation?.getCurrentPosition((pos) => {
      this.mapLat = pos.coords.latitude;
      this.mapLng = pos.coords.longitude;
      this.leafletMap?.setView([this.mapLat, this.mapLng], 16);
    });
  }

  ngAfterViewInit(): void {
    setTimeout(() => this.initMap(), 80);
  }

  ngOnDestroy(): void {
    this.leafletMap?.remove();
    this.leafletMap = null;
  }

  goBack(): void {
    void this.router.navigate(['/avatar-games']);
  }

  private initMap(): void {
    const el = this.mapPane?.nativeElement;
    if (!el || this.leafletMap || typeof L === 'undefined') {
      if (typeof L === 'undefined') {
        this.status = 'Map could not load.';
      }
      return;
    }
    this.leafletMap = L.map(el).setView([this.mapLat, this.mapLng], 16);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap',
    }).addTo(this.leafletMap);
    setTimeout(() => this.leafletMap?.invalidateSize(), 250);
  }
}
