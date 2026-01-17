import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';
import { User } from './user.service';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  fullName: string;
  email: string;
  password: string;
  confirmPassword?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = '/api/auth';
  private currentUserSubject = new BehaviorSubject<User | null>(this.getStoredUser());
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(private http: HttpClient) {}

  login(credentials: LoginRequest): Observable<User> {
    return this.http.post<User>(`${this.apiUrl}/login`, credentials).pipe(
      tap(user => {
        if (user) {
            this.setStoredUser(user);
            this.currentUserSubject.next(user);
        }
      })
    );
  }

  register(userData: RegisterRequest): Observable<User> {
    const { confirmPassword, ...registerData } = userData;
    return this.http.post<User>(`${this.apiUrl}/register`, registerData).pipe(
      tap(user => {
        if (user) {
            this.setStoredUser(user);
            this.currentUserSubject.next(user);
        }
      })
    );
  }

  logout(): void {
    localStorage.removeItem('currentUser');
    this.currentUserSubject.next(null);
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  isAuthenticated(): boolean {
    return !!this.getCurrentUser();
  }

  private getStoredUser(): User | null {
    const userStr = localStorage.getItem('currentUser');
    return userStr ? JSON.parse(userStr) : null;
  }

  private setStoredUser(user: User): void {
    localStorage.setItem('currentUser', JSON.stringify(user));
  }
}
