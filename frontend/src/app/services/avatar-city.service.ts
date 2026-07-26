import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export type CityFacing = 'front' | 'back' | 'left' | 'right';

export interface AvatarCityPresenceBody {
  x: number;
  y: number;
  facing: CityFacing;
  characterName: string;
  skinColor: string;
  shape: string;
  outfitId: string;
  placeId?: string | null;
}

export interface AvatarCityPlayer {
  userId: number;
  x: number;
  y: number;
  facing: CityFacing;
  characterName: string;
  skinColor: string;
  shape: string;
  outfitId: string;
  placeId?: string;
  buildingId?: string | null;
  self: boolean;
  updatedAt: number;
}

export interface AvatarCityBuildingOwner {
  buildingId: string;
  ownerUserId: number;
  ownerName: string;
  mine: boolean;
}

export interface AvatarCitySpawn {
  x: number;
  y: number;
  buildingId?: string | null;
  ownerCount: number;
}

export interface AvatarCityState {
  players: AvatarCityPlayer[];
  ownerships: AvatarCityBuildingOwner[];
  spawn: AvatarCitySpawn;
  ownerCount: number;
}

@Injectable({ providedIn: 'root' })
export class AvatarCityService {
  private readonly base = '/api/avatar-city';

  constructor(private http: HttpClient) {}

  updatePresence(userId: number, body: AvatarCityPresenceBody): Observable<void> {
    const params = new HttpParams().set('userId', String(userId));
    return this.http.put<void>(`${this.base}/presence`, body, { params });
  }

  leave(userId: number): Observable<void> {
    const params = new HttpParams().set('userId', String(userId));
    return this.http.delete<void>(`${this.base}/presence`, { params });
  }

  listPlayers(viewerUserId: number | null): Observable<AvatarCityPlayer[]> {
    let params = new HttpParams();
    if (viewerUserId != null) {
      params = params.set('viewerUserId', String(viewerUserId));
    }
    return this.http.get<AvatarCityPlayer[]>(`${this.base}/players`, { params });
  }

  getState(viewerUserId: number | null): Observable<AvatarCityState> {
    let params = new HttpParams();
    if (viewerUserId != null) {
      params = params.set('viewerUserId', String(viewerUserId));
    }
    return this.http.get<AvatarCityState>(`${this.base}/state`, { params });
  }

  getSpawn(userId: number): Observable<AvatarCitySpawn> {
    const params = new HttpParams().set('userId', String(userId));
    return this.http.get<AvatarCitySpawn>(`${this.base}/spawn`, { params });
  }

  claimBuilding(
    userId: number,
    buildingId: string,
    ownerName: string
  ): Observable<AvatarCityBuildingOwner> {
    const params = new HttpParams()
      .set('userId', String(userId))
      .set('ownerName', ownerName);
    return this.http.post<AvatarCityBuildingOwner>(
      `${this.base}/buildings/${encodeURIComponent(buildingId)}/claim`,
      {},
      { params }
    );
  }

  releaseBuilding(userId: number): Observable<void> {
    const params = new HttpParams().set('userId', String(userId));
    return this.http.delete<void>(`${this.base}/buildings/mine`, { params });
  }
}
