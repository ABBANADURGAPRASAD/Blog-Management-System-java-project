import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export type GenderPreference = 'MALE' | 'FEMALE' | 'ANY';

export type MapMarkerStatus = 'AVAILABLE' | 'BUSY' | 'IN_CHAT';

export interface MapMarker {
  markerPublicId: string;
  latitude: number;
  longitude: number;
  colorHex: string;
  status: MapMarkerStatus;
  displayLabel: string;
  self: boolean;
}

export interface AnonymousSession {
  sessionPublicId: string;
  mode: string;
  revealed: boolean;
  partnerUserName?: string | null;
  partnerFullName?: string | null;
  partnerUserId?: number | null;
}

export interface AnonymousMessageView {
  messageId: number;
  fromSelf: boolean;
  senderLabel: string;
  content: string;
  createdAt: string;
}

export interface RandomQueueResponse {
  matched: boolean;
  sessionPublicId?: string | null;
  ticketPublicId?: string | null;
  message?: string;
}

@Injectable({ providedIn: 'root' })
export class AnonymousChatService {
  private readonly base = '/api/anonymous';

  constructor(private http: HttpClient) {}

  updateMapPresence(
    userId: number,
    body: {
      latitude?: number | null;
      longitude?: number | null;
      colorHex?: string;
      visible?: boolean;
      mapStatus?: MapMarkerStatus;
    }
  ): Observable<void> {
    const params = new HttpParams().set('userId', String(userId));
    return this.http.put<void>(`${this.base}/map/presence`, body, { params });
  }

  clearMapPresence(userId: number): Observable<void> {
    const params = new HttpParams().set('userId', String(userId));
    return this.http.delete<void>(`${this.base}/map/presence`, { params });
  }

  getMarkers(
    viewerUserId: number | null,
    minLat: number,
    maxLat: number,
    minLng: number,
    maxLng: number
  ): Observable<MapMarker[]> {
    let params = new HttpParams()
      .set('minLat', String(minLat))
      .set('maxLat', String(maxLat))
      .set('minLng', String(minLng))
      .set('maxLng', String(maxLng));
    if (viewerUserId != null) {
      params = params.set('viewerUserId', String(viewerUserId));
    }
    return this.http.get<MapMarker[]>(`${this.base}/map/markers`, { params });
  }

  startMapChat(userId: number, targetMarkerPublicId: string): Observable<AnonymousSession> {
    const params = new HttpParams().set('userId', String(userId));
    return this.http.post<AnonymousSession>(
      `${this.base}/map/chat`,
      { targetMarkerPublicId },
      { params }
    );
  }

  joinRandom(
    userId: number,
    body: { latitude: number; longitude: number; seeking: GenderPreference; maxDistanceKm?: number }
  ): Observable<RandomQueueResponse> {
    const params = new HttpParams().set('userId', String(userId));
    return this.http.post<RandomQueueResponse>(`${this.base}/random/join`, body, { params });
  }

  pollRandom(userId: number, ticketId: string): Observable<RandomQueueResponse> {
    const params = new HttpParams().set('userId', String(userId)).set('ticketId', ticketId);
    return this.http.get<RandomQueueResponse>(`${this.base}/random/poll`, { params });
  }

  getSession(userId: number, sessionPublicId: string): Observable<AnonymousSession> {
    const params = new HttpParams().set('userId', String(userId));
    return this.http.get<AnonymousSession>(`${this.base}/session/${sessionPublicId}`, { params });
  }

  getMessages(userId: number, sessionPublicId: string): Observable<AnonymousMessageView[]> {
    const params = new HttpParams().set('userId', String(userId));
    return this.http.get<AnonymousMessageView[]>(
      `${this.base}/session/${sessionPublicId}/messages`,
      { params }
    );
  }

  sendMessage(
    userId: number,
    sessionPublicId: string,
    content: string
  ): Observable<AnonymousMessageView> {
    const params = new HttpParams().set('userId', String(userId));
    return this.http.post<AnonymousMessageView>(
      `${this.base}/session/${sessionPublicId}/messages`,
      { content },
      { params }
    );
  }

  requestReveal(userId: number, sessionPublicId: string): Observable<void> {
    const params = new HttpParams().set('userId', String(userId));
    return this.http.post<void>(
      `${this.base}/session/${sessionPublicId}/reveal/request`,
      null,
      { params }
    );
  }

  respondReveal(userId: number, sessionPublicId: string, accept: boolean): Observable<void> {
    const params = new HttpParams()
      .set('userId', String(userId))
      .set('accept', String(accept));
    return this.http.post<void>(
      `${this.base}/session/${sessionPublicId}/reveal/respond`,
      null,
      { params }
    );
  }

  endSession(userId: number, sessionPublicId: string): Observable<void> {
    const params = new HttpParams().set('userId', String(userId));
    return this.http.post<void>(`${this.base}/session/${sessionPublicId}/end`, null, { params });
  }

  /** Backend may still use STOMP; the Angular UI relies on HTTP polling instead. */
  connectStomp(_sessionPublicId: string, _cb: (msg: AnonymousMessageView) => void): void {}

  disconnectStomp(): void {}
}
