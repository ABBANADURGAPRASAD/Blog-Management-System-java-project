import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export type NotificationType = 'LIKE' | 'COMMENT' | 'MENTION' | 'NEW_POST' | 'FOLLOW';

export interface NotificationItem {
  id: number;
  type: NotificationType;
  createdAt: string;
  read: boolean;
  postId?: number | null;
  postTitle?: string | null;
  commentId?: number | null;
  previewText?: string | null;
  actorId?: number | null;
  actorUserName?: string | null;
  actorFullName?: string | null;
  actorProfileImageUrl?: string | null;
}

export interface NotificationPage {
  content: NotificationItem[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

export interface UnreadCountResponse {
  count: number;
}

@Injectable({
  providedIn: 'root',
})
export class NotificationService {
  private readonly base = '/api/notifications';

  constructor(private http: HttpClient) {}

  getUnreadCount(userId: number): Observable<UnreadCountResponse> {
    const params = new HttpParams()
      .set('userId', String(userId));
    return this.http.get<UnreadCountResponse>(`${this.base}/unread-count`, { params });
  }

  getNotifications(
    userId: number,
    page = 0,
    size = 15
  ): Observable<NotificationPage> {
    const params = new HttpParams()
      .set('userId', String(userId))
      .set('page', String(page))
      .set('size', String(size));
    return this.http.get<NotificationPage>(this.base, { params });
  }

  markAsRead(userId: number, notificationId: number): Observable<void> {
    const params = new HttpParams().set('userId', String(userId));
    return this.http.put<void>(`${this.base}/${notificationId}/read`, null, { params });
  }

  markAllAsRead(userId: number): Observable<void> {
    const params = new HttpParams().set('userId', String(userId));
    return this.http.put<void>(`${this.base}/read-all`, null, { params });
  }
}
