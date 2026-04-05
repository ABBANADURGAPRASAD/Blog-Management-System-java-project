import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';

/** Normalize profile/banner URLs from the API for use in <img src> (relative `/uploads/...` works with the dev proxy). */
export function resolveProfileImageUrl(url?: string | null): string {
  if (url == null || String(url).trim() === '') {
    return 'assets/images/dp_profile.jpeg';
  }
  const u = String(url).trim();
  if (/^https?:\/\//i.test(u)) {
    return u;
  }
  return u.startsWith('/') ? u : `/${u}`;
}

/** Cover/banner URL from API, or null if none (use a CSS placeholder in the template). */
export function resolveBannerImageUrl(url?: string | null): string | null {
  if (url == null || String(url).trim() === '') {
    return null;
  }
  const u = String(url).trim();
  if (/^https?:\/\//i.test(u)) {
    return u;
  }
  return u.startsWith('/') ? u : `/${u}`;
}

export interface User {
  id?: number;
  username?: string;
  email: string;
  password?: string;
  fullName?: string;
  bio?: string;
  phoneNumber?: string;
  twitterUrl?: string;
  linkedinUrl?: string;
  linkedInUrl?: string;
  profileImageUrl?: string;
  backgroundImageUrl?: string; // Added field
  profilePic?: string;
  bannerPic?: string;
  role?: string;
  postsCount?: number;
  commentsCount?: number;
  followersCount?: number;
  followingCount?: number; // Added field
  token?: string;
  posts?: any[];
}

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private apiUrl = '/api/users';

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) { }

  getUserById(id: number): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/${id}`);
  }

  getCurrentUser(): Observable<User> {
    const currentUser = this.authService.getCurrentUser();
    if (currentUser && currentUser.id) {
      return this.getUserById(currentUser.id);
    }
    // Return empty observable if no current user
    return new Observable(observer => {
      observer.error('No user logged in');
    });
  }

  updateUser(id: number, userData: User): Observable<User> {
    return this.http.put<User>(`${this.apiUrl}/${id}`, userData);
  }

  uploadProfileImage(id: number, file: File): Observable<User> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.put<User>(`${this.apiUrl}/${id}/profile-image`, formData);
  }

  uploadBackgroundImage(id: number, file: File): Observable<User> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.put<User>(`${this.apiUrl}/${id}/background-image`, formData);
  }

  getAllUser(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/userNames`);
  }
  searchAllUser(user: any): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/userNames?name=${user}`);
  }
}

