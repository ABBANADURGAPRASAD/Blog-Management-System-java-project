import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { User } from './user.service';

export interface SendMessageRequest {
  senderId: number;
  receiverId: number;
  content: string;
}

export interface ChatMessage {
  id?: number;
  content: string;
  createdAt?: string;
  readAt?: string | null;
  sender?: User & { userName?: string };
  receiver?: User & { userName?: string };
}

export interface ConversationSummary {
  otherUser: User & { userName?: string };
  lastMessage: ChatMessage | null;
  unreadCount: number;
}

export interface UnreadCountResponse {
  unreadCount: number;
}

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  private readonly base = '/api/chat';

  constructor(private http: HttpClient) {}

  sendMessage(body: SendMessageRequest): Observable<ChatMessage> {
    return this.http.post<ChatMessage>(`${this.base}/messages`, body);
  }

  getThread(userId: number, otherUserId: number): Observable<ChatMessage[]> {
    const params = new HttpParams()
      .set('userId', String(userId))
      .set('otherUserId', String(otherUserId));
    return this.http.get<ChatMessage[]>(`${this.base}/messages`, { params });
  }

  getConversations(userId: number): Observable<ConversationSummary[]> {
    const params = new HttpParams().set('userId', String(userId));
    return this.http.get<ConversationSummary[]>(`${this.base}/conversations`, { params });
  }

  markConversationRead(userId: number, otherUserId: number): Observable<void> {
    const params = new HttpParams()
      .set('userId', String(userId))
      .set('otherUserId', String(otherUserId));
    return this.http.post<void>(`${this.base}/read`, null, { params });
  }

  getUnreadCount(userId: number): Observable<UnreadCountResponse> {
    const params = new HttpParams().set('userId', String(userId));
    return this.http.get<UnreadCountResponse>(`${this.base}/unread-count`, { params });
  }
}
