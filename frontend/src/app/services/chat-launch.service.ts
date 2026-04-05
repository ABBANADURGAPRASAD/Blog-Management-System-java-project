import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';

/**
 * Opens the header chat panel and selects a DM thread with the given user.
 */
@Injectable({ providedIn: 'root' })
export class ChatLaunchService {
  private readonly openWithUserId$ = new Subject<number>();

  openChatWithUser(userId: number): void {
    if (userId != null && userId > 0) {
      this.openWithUserId$.next(userId);
    }
  }

  get openChatRequests(): Observable<number> {
    return this.openWithUserId$.asObservable();
  }
}
