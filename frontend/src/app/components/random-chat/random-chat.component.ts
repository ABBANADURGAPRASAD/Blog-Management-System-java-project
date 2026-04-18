import {
  Component,
  ElementRef,
  NgZone,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { AuthService } from '../../services/auth.service';
import {
  AnonymousChatService,
  AnonymousMessageView,
  AnonymousSession,
  GenderPreference,
  MapMarker,
  MapMarkerStatus,
} from '../../services/anonymous-chat.service';

const FINDER_SPAN_DEG = 12;
const MAP_POLL_MS = 2200;
const MOVE_STEP_DEG = 0.00018;
const NEARBY_AVAILABLE_M = 800;

@Component({
  selector: 'app-random-chat',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './random-chat.component.html',
  styleUrls: ['./random-chat.component.css'],
})
export class RandomChatComponent implements OnInit, OnDestroy {
  @ViewChild('mapPane') mapPane?: ElementRef<HTMLDivElement>;

  currentUserId: number | null = null;

  session: AnonymousSession | null = null;
  messages: AnonymousMessageView[] = [];
  draftMessage = '';

  randomLat = 40.7128;
  randomLng = -74.006;
  seeking: GenderPreference = 'ANY';
  maxDistanceKm = 100;
  randomHint = '';
  pollHandle: ReturnType<typeof setInterval> | null = null;
  messagePollHandle: ReturnType<typeof setInterval> | null = null;
  mapPollHandle: ReturnType<typeof setInterval> | null = null;

  showFinder = false;
  mapMarkerList: MapMarker[] = [];
  selectedMarker: MapMarker | null = null;
  pinColor = '#43A047';
  mapAvailability: MapMarkerStatus = 'AVAILABLE';
  mapHint = '';

  private leafletMap: any = null;
  private markerLayerGroup: any = null;
  private selfCircle: any = null;
  private leafletById = new Map<string, any>();
  private keyListener: ((ev: KeyboardEvent) => void) | null = null;

  mapTool: 'navigate' | 'locate' | 'street' = 'navigate';

  streetViewOpen = false;
  streetTarget: MapMarker | null = null;

  privacyOpen = false;
  locationLive = false;

  constructor(
    private auth: AuthService,
    private anonymousApi: AnonymousChatService,
    private zone: NgZone
  ) {}

  ngOnInit(): void {
    const u = this.auth.getCurrentUser();
    this.currentUserId = u?.id ?? null;
  }

  ngOnDestroy(): void {
    this.stopPoll();
    this.stopMessagePoll();
    this.stopMapPoll();
    this.teardownMap();
    this.anonymousApi.disconnectStomp();
    if (this.currentUserId && !this.session) {
      this.anonymousApi.clearMapPresence(this.currentUserId).subscribe({ error: () => {} });
    }
  }

  get otherPlayersOnMap(): number {
    return this.mapMarkerList.filter((m) => !m.self).length;
  }

  get nearbyAvailableCount(): number {
    return this.mapMarkerList.filter(
      (m) =>
        !m.self &&
        m.status === 'AVAILABLE' &&
        haversineMeters(this.randomLat, this.randomLng, m.latitude, m.longitude) <= NEARBY_AVAILABLE_M
    ).length;
  }

  get streetLocationLabel(): string {
    const n = Math.abs(Math.floor(this.randomLng * 80)) % 12;
    return `Main Street, Block ${n + 1}`;
  }

  markerStatusLabel(m: MapMarker): string {
    switch (m.status) {
      case 'IN_CHAT':
        return 'In chat';
      case 'BUSY':
        return 'Offline';
      default:
        return 'Available';
    }
  }

  get streetDistanceLabel(): string {
    if (!this.streetTarget) {
      return '';
    }
    const m = Math.round(
      haversineMeters(this.randomLat, this.randomLng, this.streetTarget.latitude, this.streetTarget.longitude)
    );
    return `~${Math.max(5, m)} meters`;
  }

  useGeolocation(): void {
    if (!navigator.geolocation) {
      this.randomHint = 'Geolocation not available.';
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        this.randomLat = pos.coords.latitude;
        this.randomLng = pos.coords.longitude;
        this.randomHint = 'Location updated.';
        if (this.leafletMap) {
          this.leafletMap.setView([this.randomLat, this.randomLng], this.leafletMap.getZoom());
          this.updateSelfCircle();
          this.publishPresenceCenter();
          this.refreshFinderMarkers();
        }
      },
      () => (this.randomHint = 'Could not read location.')
    );
  }

  connectRandom(): void {
    if (!this.currentUserId) {
      return;
    }
    this.randomHint = 'Finding someone…';
    this.anonymousApi
      .joinRandom(this.currentUserId, {
        latitude: this.randomLat,
        longitude: this.randomLng,
        seeking: this.seeking,
        maxDistanceKm: this.maxDistanceKm,
      })
      .subscribe({
        next: (res) => {
          if (res.matched && res.sessionPublicId) {
            this.enterSession(res.sessionPublicId);
            return;
          }
          if (res.ticketPublicId) {
            this.randomHint = 'Waiting for a match…';
            this.startPoll(res.ticketPublicId);
          }
        },
        error: () => (this.randomHint = 'Could not join queue.'),
      });
  }

  private startPoll(ticketId: string): void {
    this.stopPoll();
    if (!this.currentUserId) {
      return;
    }
    this.pollHandle = setInterval(() => {
      this.anonymousApi.pollRandom(this.currentUserId!, ticketId).subscribe({
        next: (res) => {
          if (res.matched && res.sessionPublicId) {
            this.stopPoll();
            this.enterSession(res.sessionPublicId);
          }
        },
        error: () => {},
      });
    }, 3000);
  }

  private stopPoll(): void {
    if (this.pollHandle) {
      clearInterval(this.pollHandle);
      this.pollHandle = null;
    }
  }

  private startMessagePoll(): void {
    this.stopMessagePoll();
    this.messagePollHandle = setInterval(() => this.loadMessages(), 2500);
  }

  private stopMessagePoll(): void {
    if (this.messagePollHandle) {
      clearInterval(this.messagePollHandle);
      this.messagePollHandle = null;
    }
  }

  private startMapPoll(): void {
    this.stopMapPoll();
    this.mapPollHandle = setInterval(() => this.refreshFinderMarkers(), MAP_POLL_MS);
  }

  private stopMapPoll(): void {
    if (this.mapPollHandle) {
      clearInterval(this.mapPollHandle);
      this.mapPollHandle = null;
    }
  }

  enterSession(sessionPublicId: string): void {
    if (!this.currentUserId) {
      return;
    }
    this.stopPoll();
    this.randomHint = '';
    this.streetViewOpen = false;
    this.anonymousApi.getSession(this.currentUserId, sessionPublicId).subscribe({
      next: (s) => {
        this.session = s;
        this.loadMessages();
        this.startMessagePoll();
      },
      error: () => (this.randomHint = 'Could not open session.'),
    });
  }

  loadMessages(): void {
    if (!this.currentUserId || !this.session) {
      return;
    }
    this.anonymousApi
      .getMessages(this.currentUserId, this.session.sessionPublicId)
      .subscribe({
        next: (m) => (this.messages = m),
        error: () => {},
      });
  }

  send(): void {
    const text = this.draftMessage.trim();
    if (!text || !this.currentUserId || !this.session) {
      return;
    }
    this.anonymousApi
      .sendMessage(this.currentUserId, this.session.sessionPublicId, text)
      .subscribe({
        next: (msg) => {
          this.messages = [...this.messages, msg];
          this.draftMessage = '';
        },
        error: () => {},
      });
  }

  requestReveal(): void {
    if (!this.currentUserId || !this.session) {
      return;
    }
    this.anonymousApi.requestReveal(this.currentUserId, this.session.sessionPublicId).subscribe({
      next: () => this.refreshSession(),
      error: () => {},
    });
  }

  respondReveal(accept: boolean): void {
    if (!this.currentUserId || !this.session) {
      return;
    }
    this.anonymousApi
      .respondReveal(this.currentUserId, this.session.sessionPublicId, accept)
      .subscribe({
        next: () => this.refreshSession(),
        error: () => {},
      });
  }

  endChat(): void {
    if (!this.currentUserId || !this.session) {
      return;
    }
    const sid = this.session.sessionPublicId;
    this.stopMessagePoll();
    this.anonymousApi.endSession(this.currentUserId, sid).subscribe({
      next: () => {
        this.session = null;
        this.messages = [];
        this.anonymousApi.disconnectStomp();
      },
      error: () => {},
    });
  }

  private refreshSession(): void {
    if (!this.currentUserId || !this.session) {
      return;
    }
    this.anonymousApi
      .getSession(this.currentUserId, this.session.sessionPublicId)
      .subscribe({ next: (s) => (this.session = s) });
  }

  openFinder(): void {
    this.showFinder = true;
    this.selectedMarker = null;
    this.mapHint = '';
    this.streetViewOpen = false;
    this.streetTarget = null;
    this.mapTool = 'navigate';
    setTimeout(() => {
      this.publishPresenceCenter();
      this.scheduleMapInit();
      this.refreshFinderMarkers();
      this.startMapPoll();
      this.attachKeyPan();
    }, 0);
  }

  private scheduleMapInit(): void {
    this.initLeafletMap();
    if (!this.leafletMap && this.showFinder) {
      setTimeout(() => this.initLeafletMap(), 200);
    }
  }

  closeFinder(): void {
    this.showFinder = false;
    this.stopMapPoll();
    this.teardownMap();
    this.detachKeyPan();
    this.mapMarkerList = [];
    this.selectedMarker = null;
    this.streetViewOpen = false;
    this.streetTarget = null;
    if (this.currentUserId && !this.session) {
      this.anonymousApi.clearMapPresence(this.currentUserId).subscribe({ error: () => {} });
    }
  }

  onMapAvailabilityChange(): void {
    if (this.showFinder) {
      this.publishPresenceCenter();
    }
  }

  publishPresenceCenter(): void {
    if (!this.currentUserId) {
      return;
    }
    this.anonymousApi
      .updateMapPresence(this.currentUserId, {
        latitude: this.randomLat,
        longitude: this.randomLng,
        colorHex: this.pinColor,
        visible: true,
        mapStatus: this.mapAvailability,
      })
      .subscribe({ error: () => {} });
  }

  refreshFinderMarkers(): void {
    let minLat: number;
    let maxLat: number;
    let minLng: number;
    let maxLng: number;
    if (this.leafletMap) {
      const b = this.leafletMap.getBounds();
      const p = 0.04;
      minLat = b.getSouth() - p;
      maxLat = b.getNorth() + p;
      minLng = b.getWest() - p;
      maxLng = b.getEast() + p;
    } else {
      minLat = this.randomLat - FINDER_SPAN_DEG;
      maxLat = this.randomLat + FINDER_SPAN_DEG;
      minLng = this.randomLng - FINDER_SPAN_DEG;
      maxLng = this.randomLng + FINDER_SPAN_DEG;
    }
    minLng = Math.max(-180, Math.min(180, minLng));
    maxLng = Math.max(-180, Math.min(180, maxLng));
    if (minLng > maxLng) {
      [minLng, maxLng] = [maxLng, minLng];
    }
    this.anonymousApi
      .getMarkers(this.currentUserId, minLat, maxLat, minLng, maxLng)
      .subscribe({
        next: (raw) => {
          const markers = normalizeMarkers(raw);
          this.mapMarkerList = markers;
          this.syncLeafletMarkers(markers);
        },
        error: () => (this.mapMarkerList = []),
      });
  }

  /** List / map row: select and open street view for others. */
  onMarkerRowClick(m: MapMarker): void {
    this.selectMarker(m);
    if (!m.self) {
      this.openFaceToFace(m);
    }
  }

  selectMarker(m: MapMarker): void {
    this.selectedMarker = m;
    if (m.self) {
      this.streetViewOpen = false;
      this.streetTarget = null;
    }
  }

  openFaceToFace(m: MapMarker): void {
    if (m.self) {
      return;
    }
    this.streetTarget = m;
    this.streetViewOpen = true;
    this.mapTool = 'street';
  }

  clearSelectedMarker(): void {
    this.selectedMarker = null;
  }

  onLocationLiveChange(): void {
    if (this.locationLive) {
      this.useGeolocation();
    }
  }

  onDraftKeydown(ev: KeyboardEvent): void {
    if (ev.key === 'Enter' && !ev.shiftKey) {
      ev.preventDefault();
      this.send();
    }
  }

  applyNavigateNearby(): void {
    this.streetViewOpen = false;
    this.streetTarget = null;
    if (this.leafletMap) {
      this.leafletMap.setView([this.randomLat, this.randomLng], Math.max(15, this.leafletMap.getZoom()));
    }
    const n = this.nearbyAvailableCount;
    this.mapHint = n
      ? `${n} available user(s) near you (within ~${NEARBY_AVAILABLE_M}m). Green = available.`
      : 'No available users very close — zoom out, move your pin, or try again.';
    setTimeout(() => (this.mapHint = ''), 6000);
  }

  setMapTool(tool: 'navigate' | 'locate' | 'street'): void {
    this.mapTool = tool;
    if (tool === 'locate') {
      this.useGeolocation();
      return;
    }
    if (tool === 'navigate') {
      this.applyNavigateNearby();
      return;
    }
    if (tool === 'street') {
      if (this.selectedMarker && !this.selectedMarker.self) {
        this.openFaceToFace(this.selectedMarker);
      } else if (!this.streetTarget) {
        this.mapHint = 'Tap another user on the map or in the list for street view.';
        setTimeout(() => (this.mapHint = ''), 5000);
      }
    }
  }

  skipStreet(): void {
    this.streetViewOpen = false;
    this.streetTarget = null;
    this.mapTool = 'navigate';
  }

  startMapChat(): void {
    if (!this.currentUserId) {
      return;
    }
    const target = this.selectedMarker ?? this.streetTarget;
    if (!target || target.self) {
      return;
    }
    if (target.status === 'BUSY') {
      this.mapHint = 'That user is offline.';
      return;
    }
    if (target.status === 'IN_CHAT') {
      this.mapHint = 'That user is already in a chat.';
      return;
    }
    this.anonymousApi.startMapChat(this.currentUserId, target.markerPublicId).subscribe({
      next: (s) => {
        this.session = s;
        this.closeFinder();
        this.loadMessages();
        this.startMessagePoll();
      },
      error: (err: HttpErrorResponse) => {
        const body = err.error as { error?: string } | undefined;
        const msg = body?.error;
        if (err.status === 409) {
          this.mapHint =
            typeof msg === 'string' && msg.toLowerCase().includes('chat')
              ? 'User already in a chat.'
              : 'Cannot connect right now.';
        } else {
          this.mapHint = 'Could not start chat.';
        }
      },
    });
  }

  private initLeafletMap(): void {
    const el = this.mapPane?.nativeElement;
    if (!el || this.leafletMap) {
      return;
    }
    if (typeof L === 'undefined') {
      this.mapHint =
        'Map could not load (Leaflet blocked or offline). Allow network for unpkg.com or run npm install leaflet.';
      return;
    }
    this.leafletMap = L.map(el).setView([this.randomLat, this.randomLng], 15);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(this.leafletMap);
    this.markerLayerGroup = L.layerGroup().addTo(this.leafletMap);
    this.leafletMap.on('click', (e: any) => {
      if (this.mapTool !== 'navigate') {
        return;
      }
      this.zone.run(() => {
        this.randomLat = e.latlng.lat;
        this.randomLng = e.latlng.lng;
        this.publishPresenceCenter();
        this.refreshFinderMarkers();
        this.updateSelfCircle();
      });
    });
    setTimeout(() => {
      this.leafletMap?.invalidateSize();
      this.updateSelfCircle();
    }, 300);
    this.updateSelfCircle();
  }

  private teardownMap(): void {
    this.leafletById.clear();
    if (this.leafletMap) {
      this.leafletMap.remove();
      this.leafletMap = null;
    }
    this.markerLayerGroup = null;
    this.selfCircle = null;
  }

  private selfStatusForCircle(): MapMarkerStatus {
    const row = this.mapMarkerList.find((m) => m.self);
    return row?.status ?? this.mapAvailability;
  }

  private updateSelfCircle(): void {
    if (!this.leafletMap || typeof L === 'undefined') {
      return;
    }
    if (this.selfCircle) {
      this.leafletMap.removeLayer(this.selfCircle);
    }
    const fill = pinColorForStatus(this.selfStatusForCircle());
    this.selfCircle = L.circle([this.randomLat, this.randomLng], {
      radius: 95,
      color: fill,
      weight: 2,
      fillColor: fill,
      fillOpacity: 0.11,
    }).addTo(this.leafletMap);
  }

  private syncLeafletMarkers(list: MapMarker[]): void {
    if (!this.leafletMap || !this.markerLayerGroup || typeof L === 'undefined') {
      return;
    }
    const ids = new Set(list.map((m) => m.markerPublicId));
    for (const [id, lm] of this.leafletById) {
      if (!ids.has(id)) {
        this.markerLayerGroup.removeLayer(lm);
        this.leafletById.delete(id);
      }
    }
    for (const m of list) {
      const color = pinColorForStatus(m.status);
      const icon = L.divIcon({
        className: 'feel-map-pin-wrap',
        html: `<div class="feel-map-pin" style="background:${color}"></div>`,
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      });
      let mk = this.leafletById.get(m.markerPublicId);
      if (!mk) {
        mk = L.marker([m.latitude, m.longitude], { icon }).addTo(this.markerLayerGroup);
        const token = m.markerPublicId;
        mk.on('click', (ev: any) => {
          L.DomEvent.stopPropagation(ev);
          this.zone.run(() => {
            const cur = this.mapMarkerList.find((x) => x.markerPublicId === token) ?? m;
            this.selectMarker(cur);
            if (!cur.self) {
              this.openFaceToFace(cur);
            }
          });
        });
        this.leafletById.set(m.markerPublicId, mk);
      } else {
        mk.setLatLng([m.latitude, m.longitude]);
        mk.setIcon(icon);
      }
    }
    this.updateSelfCircle();
  }

  private attachKeyPan(): void {
    this.detachKeyPan();
    this.keyListener = (ev: KeyboardEvent) => {
      if (!this.showFinder || this.mapTool !== 'navigate') {
        return;
      }
      let dx = 0;
      let dy = 0;
      if (ev.key === 'ArrowLeft' || ev.key === 'a' || ev.key === 'A') {
        dx = -1;
      }
      if (ev.key === 'ArrowRight' || ev.key === 'd' || ev.key === 'D') {
        dx = 1;
      }
      if (ev.key === 'ArrowUp' || ev.key === 'w' || ev.key === 'W') {
        dy = 1;
      }
      if (ev.key === 'ArrowDown' || ev.key === 's' || ev.key === 'S') {
        dy = -1;
      }
      if (!dx && !dy) {
        return;
      }
      ev.preventDefault();
      this.zone.run(() => {
        this.randomLng += dx * MOVE_STEP_DEG;
        this.randomLat += dy * MOVE_STEP_DEG;
        this.randomLat = Math.max(-85, Math.min(85, this.randomLat));
        this.randomLng = Math.max(-180, Math.min(180, this.randomLng));
        if (this.leafletMap) {
          this.leafletMap.panTo([this.randomLat, this.randomLng]);
        }
        this.updateSelfCircle();
        this.publishPresenceCenter();
        this.refreshFinderMarkers();
      });
    };
    window.addEventListener('keydown', this.keyListener);
  }

  private detachKeyPan(): void {
    if (this.keyListener) {
      window.removeEventListener('keydown', this.keyListener);
      this.keyListener = null;
    }
  }
}

function haversineMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000;
  const p1 = (lat1 * Math.PI) / 180;
  const p2 = (lat2 * Math.PI) / 180;
  const dp = ((lat2 - lat1) * Math.PI) / 180;
  const dl = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dp / 2) * Math.sin(dp / 2) +
    Math.cos(p1) * Math.cos(p2) * Math.sin(dl / 2) * Math.sin(dl / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function pinColorForStatus(st: MapMarkerStatus): string {
  switch (st) {
    case 'IN_CHAT':
      return '#c62828';
    case 'BUSY':
      return '#f9a825';
    default:
      return '#2e7d32';
  }
}

function normalizeMarkers(raw: MapMarker[]): MapMarker[] {
  return raw.map((m) => ({
    ...m,
    status: m.status ?? 'AVAILABLE',
    displayLabel: m.displayLabel ?? 'User',
    self: !!m.self,
  }));
}
