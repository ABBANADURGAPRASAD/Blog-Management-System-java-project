import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import {
  AnonymousChatService,
  AnonymousMessageView,
  AnonymousSession,
  GenderPreference,
  MapMarker,
} from '../../services/anonymous-chat.service';

/** Degrees around current lat/lng to load map markers (no Leaflet — list UI). */
const FINDER_SPAN_DEG = 12;

@Component({
  selector: 'app-random-chat',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './random-chat.component.html',
  styleUrls: ['./random-chat.component.css'],
})
export class RandomChatComponent implements OnInit, OnDestroy {
  currentUserId: number | null = null;

  session: AnonymousSession | null = null;
  messages: AnonymousMessageView[] = [];
  draftMessage = '';

  randomLat = 40.7128;
  randomLng = -74.006;
  seeking: GenderPreference = 'ANY';
  randomHint = '';
  pollHandle: ReturnType<typeof setInterval> | null = null;
  messagePollHandle: ReturnType<typeof setInterval> | null = null;

  showFinder = false;
  mapMarkerList: MapMarker[] = [];
  selectedMarker: MapMarker | null = null;
  pinColor = '#4A90E2';

  privacyOpen = false;

  constructor(
    private auth: AuthService,
    private anonymousApi: AnonymousChatService
  ) {}

  ngOnInit(): void {
    const u = this.auth.getCurrentUser();
    this.currentUserId = u?.id ?? null;
  }

  ngOnDestroy(): void {
    this.stopPoll();
    this.stopMessagePoll();
    this.anonymousApi.disconnectStomp();
    if (this.currentUserId) {
      this.anonymousApi.clearMapPresence(this.currentUserId).subscribe({ error: () => {} });
    }
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

  enterSession(sessionPublicId: string): void {
    if (!this.currentUserId) {
      return;
    }
    this.stopPoll();
    this.randomHint = '';
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
    setTimeout(() => {
      this.publishPresenceCenter();
      this.refreshFinderMarkers();
    }, 0);
  }

  closeFinder(): void {
    this.showFinder = false;
    this.mapMarkerList = [];
    this.selectedMarker = null;
    if (this.currentUserId) {
      this.anonymousApi.clearMapPresence(this.currentUserId).subscribe({ error: () => {} });
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
      })
      .subscribe({ error: () => {} });
  }

  refreshFinderMarkers(): void {
    const minLat = this.randomLat - FINDER_SPAN_DEG;
    const maxLat = this.randomLat + FINDER_SPAN_DEG;
    let minLng = this.randomLng - FINDER_SPAN_DEG;
    let maxLng = this.randomLng + FINDER_SPAN_DEG;
    minLng = Math.max(-180, Math.min(180, minLng));
    maxLng = Math.max(-180, Math.min(180, maxLng));
    if (minLng > maxLng) {
      [minLng, maxLng] = [maxLng, minLng];
    }
    this.anonymousApi.getMarkers(minLat, maxLat, minLng, maxLng).subscribe({
      next: (markers) => (this.mapMarkerList = markers),
      error: () => (this.mapMarkerList = []),
    });
  }

  selectMarker(m: MapMarker): void {
    this.selectedMarker = m;
  }

  onDraftKeydown(ev: KeyboardEvent): void {
    if (ev.key === 'Enter' && !ev.shiftKey) {
      ev.preventDefault();
      this.send();
    }
  }

  startMapChat(): void {
    if (!this.currentUserId || !this.selectedMarker) {
      return;
    }
    this.anonymousApi.startMapChat(this.currentUserId, this.selectedMarker.markerPublicId).subscribe({
      next: (s) => {
        this.closeFinder();
        this.session = s;
        this.loadMessages();
        this.startMessagePoll();
      },
      error: () => {},
    });
  }
}
