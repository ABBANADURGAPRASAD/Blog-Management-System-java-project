import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface User {
  id?: number;
  username: string;
  email: string;
  password?: string;
  fullName?: string;
  bio?: string;
  phoneNumber?: string;
  twitterUrl?: string;
  linkedInUrl?: string;
  profilePic?: string;
  bannerPic?: string;
  role?: string;
  postsCount?: number;
  commentsCount?: number;
  followersCount?: number;
}

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private apiUrl = 'http://localhost:8080/api/users';

  constructor(private http: HttpClient) {}

  getCurrentUser(): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/current`);
  }

  getUserById(id: number): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/${id}`);
  }

  updateUser(id: number, userData: FormData): Observable<User> {
    return this.http.put<User>(`${this.apiUrl}/${id}`, userData);
  }

  registerUser(user: User): Observable<User> {
    return this.http.post<User>(`${this.apiUrl}/register`, user);
  }
}

