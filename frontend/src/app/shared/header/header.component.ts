import {
  Component,
  ElementRef,
  HostListener,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { User, UserService } from '../../services/user.service';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ChatPanelComponent } from '../chat-panel/chat-panel.component';
import { ChatService } from '../../services/chat.service';
import {
  NotificationItem,
  NotificationService,
} from '../../services/notification.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule,

    FormsModule,
    ReactiveFormsModule,
    ChatPanelComponent
  ],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent implements OnInit, OnDestroy {
  currentUser: User | null = null;
  isAuthenticated = false;

  isHeaderHidden = false;
  showSearch = true;
  usersList: User[] = [];
  allUsers: User[] = [];
  searchText = '';
  showSearchDropdown = false;

  chatOpen = false;
  chatUnreadCount = 0;

  notificationsOpen = false;
  notificationUnreadCount = 0;
  notifications: NotificationItem[] = [];
  notificationsLoading = false;

  private notifPollId: ReturnType<typeof setInterval> | null = null;

  @ViewChild('notificationWrap', { read: ElementRef })
  notificationWrap?: ElementRef<HTMLElement>;

  constructor(
    private router: Router,
    private authService: AuthService,
    private userService: UserService,
    private chatService: ChatService,
    private notificationService: NotificationService,
  ) { }

  ngOnInit() {
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
      this.isAuthenticated = !!user;
      if (user?.id) {
        this.chatService.getUnreadCount(user.id).subscribe({
          next: (r) => (this.chatUnreadCount = r?.unreadCount ?? 0),
          error: () => (this.chatUnreadCount = 0),
        });
        this.refreshNotificationUnread(user.id);
        this.startNotificationPoll(user.id);
      } else {
        this.chatUnreadCount = 0;
        this.notificationUnreadCount = 0;
        this.notifications = [];
        this.notificationsOpen = false;
        this.stopNotificationPoll();
      }
    });

    const updateFromUrl = () => {
      const currentUrl = this.router.url;
      this.isHeaderHidden = currentUrl === '/login' || currentUrl === '/register';
      this.showSearch = !currentUrl.includes('/profile/edit');
    };
    updateFromUrl();
    this.router.events.subscribe(updateFromUrl);
  }

  ngOnDestroy(): void {
    this.stopNotificationPoll();
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.notificationsOpen) {
      return;
    }
    const target = event.target as Node;
    const wrap = this.notificationWrap?.nativeElement;
    if (wrap?.contains(target)) {
      return;
    }
    this.notificationsOpen = false;
  }

  @HostListener('window:focus')
  onWindowFocus(): void {
    const id = this.currentUser?.id;
    if (id) {
      this.refreshNotificationUnread(id);
    }
  }

  private refreshNotificationUnread(userId: number): void {
    this.notificationService.getUnreadCount(userId).subscribe({
      next: (r) => (this.notificationUnreadCount = r?.count ?? 0),
      error: () => {},
    });
  }

  private startNotificationPoll(userId: number): void {
    this.stopNotificationPoll();
    this.notifPollId = setInterval(
      () => this.refreshNotificationUnread(userId),
      120000
    );
  }

  private stopNotificationPoll(): void {
    if (this.notifPollId != null) {
      clearInterval(this.notifPollId);
      this.notifPollId = null;
    }
  }

  toggleNotifications(event: Event): void {
    event.stopPropagation();
    this.notificationsOpen = !this.notificationsOpen;
    if (this.notificationsOpen && this.currentUser?.id) {
      this.loadNotifications();
    }
  }

  loadNotifications(): void {
    const uid = this.currentUser?.id;
    if (!uid) {
      return;
    }
    this.notificationsLoading = true;
    this.notificationService.getNotifications(uid, 0, 15).subscribe({
      next: (page) => {
        this.notifications = page?.content ?? [];
        this.notificationsLoading = false;
      },
      error: () => {
        this.notifications = [];
        this.notificationsLoading = false;
      },
    });
  }

  notificationSummary(n: NotificationItem): string {
    const name =
      n.actorUserName || n.actorFullName || 'Someone';
    switch (n.type) {
      case 'LIKE':
        return `${name} liked your post`;
      case 'COMMENT':
        return n.previewText
          ? `${name} commented: ${n.previewText}`
          : `${name} commented on your post`;
      case 'MENTION':
        return n.previewText
          ? `${name} mentioned you: ${n.previewText}`
          : `${name} mentioned you in a comment`;
      case 'NEW_POST':
        return n.postTitle
          ? `${name} posted: ${n.postTitle}`
          : `${name} shared a new post`;
      case 'FOLLOW':
        return `${name} started following you`;
      default:
        return 'New activity';
    }
  }

  markAllNotificationsRead(): void {
    const uid = this.currentUser?.id;
    if (!uid) {
      return;
    }
    this.notificationService.markAllAsRead(uid).subscribe({
      next: () => {
        this.notificationUnreadCount = 0;
        this.notifications = this.notifications.map((n) => ({ ...n, read: true }));
      },
      error: () => {},
    });
  }

  onNotificationRowClick(n: NotificationItem, event: Event): void {
    event.stopPropagation();
    const uid = this.currentUser?.id;
    if (!uid || !n.actorId) {
      return;
    }
    if (!n.read) {
      this.notificationService.markAsRead(uid, n.id).subscribe({
        next: () => {
          n.read = true;
          this.refreshNotificationUnread(uid);
        },
        error: () => {},
      });
    }
    this.notificationsOpen = false;
    if (n.type === 'FOLLOW' || n.type === 'NEW_POST') {
      this.router.navigate(['/user', n.actorId]);
      return;
    }
    this.router.navigate(['/home']);
  }

  onNewPostClick() {
    if (this.isAuthenticated) {
      this.router.navigate(['/create']);
    } else {
      this.router.navigate(['/login']);
    }
  }

  onProfileClick() {
    if (this.isAuthenticated) {
      this.router.navigate(['/profile']);
    } else {
      this.router.navigate(['/login']);
    }
  }

  onSearchFocus() {
    this.showSearchDropdown = true;
    if (this.allUsers.length === 0) {
      this.userService.getAllUser().subscribe({
        next: (data) => {
          this.allUsers = data as User[];
          this.filterUsers();
        },
        error: () => {}
      });
    } else {
      this.filterUsers();
    }
  }

  onSearchBlur() {
    setTimeout(() => (this.showSearchDropdown = false), 200);
  }

  filterUsers() {
    const q = (this.searchText || '').trim().toLowerCase();
    if (!q) {
      this.usersList = this.allUsers.slice(0, 10);
      return;
    }
    this.usersList = this.allUsers.filter(
      (u) =>
        (u.username || '').toLowerCase().includes(q) ||
        (u.fullName || '').toLowerCase().includes(q) ||
        (u.email || '').toLowerCase().includes(q)
    ).slice(0, 10);
  }

  searchUsers() {
    this.filterUsers();
  }

  selectUser(user: User) {
    this.searchText = '';
    this.showSearchDropdown = false;
    if (!user?.id) return;
    if (this.currentUser?.id === user.id) {
      this.router.navigate(['/profile/edit']);
    } else {
      this.router.navigate(['/user', user.id]);
    }
  }


  onHomeClick() {
    this.router.navigate(['/home']);
  }

  onLoginClick() {
    this.router.navigate(['/login']);
  }

  onRegisterClick() {
    this.router.navigate(['/register']);
  }

  onLogoutClick() {
    this.authService.logout();
    this.chatOpen = false;
    this.router.navigate(['/home']);
  }

  toggleChat() {
    this.chatOpen = !this.chatOpen;
  }

  onChatOpenChange(open: boolean) {
    this.chatOpen = open;
  }
}

