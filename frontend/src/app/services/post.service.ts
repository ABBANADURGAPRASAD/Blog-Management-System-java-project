import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Post {
  id?: number;
  title?: string;
  content: string;
  imageUrl?: string;
  media?: string;
  mediaUrl?: string;
  mediaType?: string;
  tags?: string;
  category?: string;
  user?: any;
  author?: string;
  authorPic?: string;
  date?: string;
  createdAt?: string;
  likes?: any[];
  comments?: Comment[];
  likesCount?: number;
  commentsCount?: number;
  isLiked?: boolean;
}

export interface Comment {
  id?: number;
  content: string;
  user?: any;
  author?: string;
  createdAt?: string;
  date?: string;
}

@Injectable({
  providedIn: 'root'
})
export class PostService {
  private apiUrl = '/api/posts';

  constructor(private http: HttpClient) { }

  createPost(postData: any, image: File | null, userId: number): Observable<Post> {
    const formData = new FormData();
    formData.append('post', JSON.stringify(postData));
    if (image) {
      formData.append('file', image);
    }
    formData.append('userId', userId.toString());

    return this.http.post<Post>(this.apiUrl, formData);
  }

  getAllPosts(): Observable<Post[]> {
    return this.http.get<Post[]>(this.apiUrl);
  }

  getPostsByUserId(userId: number): Observable<Post[]> {
    return this.http.get<Post[]>(this.apiUrl, { params: { userId: String(userId) } });
  }

  getPostById(id: number): Observable<Post> {
    return this.http.get<Post>(`${this.apiUrl}/${id}`);
  }

  getPopularPosts(): Observable<Post[]> {
    return this.http.get<Post[]>(`${this.apiUrl}/popular`);
  }

  getComments(postId: number): Observable<Comment[]> {
    return this.http.get<Comment[]>(`${this.apiUrl}/${postId}/comments`);
  }

  addComment(postId: number, userId: number, content: string): Observable<Comment> {
    return this.http.post<Comment>(`${this.apiUrl}/${postId}/comments`, content, {
      params: { userId: userId.toString() },
      headers: { 'Content-Type': 'text/plain' }
    });
  }

  toggleLike(postId: number, userId: number): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/${postId}/like`, null, {
      params: { userId: userId.toString() }
    });
  }

  sharePost(postId: number): string {
    // Generate shareable URL - in a real app, this might be a dedicated share endpoint
    const currentUrl = window.location.origin;
    return `${currentUrl}/home?post=${postId}`;
  }
}

