import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';

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
  profilePic?: string;
  bannerPic?: string;
  role?: string;
  postsCount?: number;
  commentsCount?: number;
  followersCount?: number;
  posts?: any[];
}

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private apiUrl = 'http://localhost:8080/api/users';

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

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
}

