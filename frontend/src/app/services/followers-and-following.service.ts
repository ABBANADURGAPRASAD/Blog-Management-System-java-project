import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { User } from './user.service';

export interface FollowCounts {
  followersCount: number;
  followingCount: number;
}

@Injectable({
  providedIn: 'root'
})
export class FollowersAndFollowingService {
  private apiUrl = '/api/followersAndFollowing';

  constructor(private http: HttpClient) {}

  getCounts(userId: number): Observable<FollowCounts> {
    return this.http.get<FollowCounts>(`${this.apiUrl}/${userId}/counts`);
  }

  getFollowers(userId: number): Observable<User[]> {
    return this.http.get<User[]>(`${this.apiUrl}/${userId}/followers`);
  }

  getFollowing(userId: number): Observable<User[]> {
    return this.http.get<User[]>(`${this.apiUrl}/${userId}/following`);
  }

  follow(userId: number, followingUserId: number): Observable<void> {
    return this.http.post<void>(
      `${this.apiUrl}/follow`,
      null,
      { params: { userId: String(userId), followingUserId: String(followingUserId) } }
    );
  }

  unfollow(userId: number, followingUserId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/unfollow`, {
      params: { userId: String(userId), followingUserId: String(followingUserId) }
    });
  }

  checkFollow(userId: number, targetUserId: number): Observable<{ isFollowing: boolean; isFollowed: boolean }> {
    return this.http.get<{ isFollowing: boolean; isFollowed: boolean }>(`${this.apiUrl}/check`, {
      params: { userId: String(userId), targetUserId: String(targetUserId) }
    });
  }
}
