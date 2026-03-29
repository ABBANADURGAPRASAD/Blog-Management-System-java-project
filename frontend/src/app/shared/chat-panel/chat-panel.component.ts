import {
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import {
  ChatService,
  ChatMessage,
  ConversationSummary,
} from '../../services/chat.service';
import { User, UserService } from '../../services/user.service';

type ThreadItem =
  | { type: 'date'; label: string }
  | { type: 'msg'; message: ChatMessage };

@Component({
  selector: 'app-chat-panel',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './chat-panel.component.html',
  styleUrls: ['./chat-panel.component.css'],
})
export class ChatPanelComponent implements OnChanges {
  @ViewChild('chatSearchInput') chatSearchInput?: ElementRef<HTMLInputElement>;
  @ViewChild('threadScroll') threadScroll?: ElementRef<HTMLElement>;

  @Input() open = false;
  @Output() openChange = new EventEmitter<boolean>();
  @Output() unreadCountChange = new EventEmitter<number>();

  currentUserId: number | null = null;
  displayUsername = '';

  searchQuery = '';
  conversations: ConversationSummary[] = [];
  filteredConversations: ConversationSummary[] = [];
  searchUsers: User[] = [];

  selectedOther: (User & { userName?: string }) | null = null;
  messages: ChatMessage[] = [];
  threadItems: ThreadItem[] = [];
  draft = '';
  loadingConv = false;
  loadingThread = false;
  sendError = '';

  private allUsersCache: User[] = [];

  constructor(
    private authService: AuthService,
    private chatService: ChatService,
    private userService: UserService
  ) {
    const u = this.authService.getCurrentUser();
    this.applyCurrentUser(u);
    this.authService.currentUser$.subscribe((user) => this.applyCurrentUser(user));
  }

  private applyCurrentUser(u: User | null) {
    if (u?.id) {
      this.currentUserId = u.id;
      this.displayUsername =
        (u as User & { userName?: string }).userName ||
        u.username ||
        u.fullName ||
        'Account';
    } else {
      this.currentUserId = null;
      this.displayUsername = '';
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['open'] && this.open && this.currentUserId) {
      this.loadConversations();
      this.refreshUnreadBadge();
      if (!this.allUsersCache.length) {
        this.userService.getAllUser().subscribe({
          next: (list) => (this.allUsersCache = list as User[]),
          error: () => {},
        });
      }
    }
  }

  @HostListener('document:keydown.escape')
  onEscape() {
    if (this.open) {
      this.close();
    }
  }

  close() {
    this.open = false;
    this.openChange.emit(false);
  }

  focusSearch() {
    setTimeout(() => this.chatSearchInput?.nativeElement?.focus(), 0);
  }

  private scrollThreadToBottom() {
    setTimeout(() => {
      const el = this.threadScroll?.nativeElement;
      if (el) {
        el.scrollTop = el.scrollHeight;
      }
    }, 0);
  }

  onOverlayClick() {
    this.close();
  }

  stopShellClick(ev: MouseEvent) {
    ev.stopPropagation();
  }

  loadConversations() {
    if (!this.currentUserId) return;
    this.loadingConv = true;
    this.chatService.getConversations(this.currentUserId).subscribe({
      next: (list) => {
        this.conversations = list || [];
        this.applySearchFilter();
        this.loadingConv = false;
      },
      error: () => {
        this.conversations = [];
        this.loadingConv = false;
      },
    });
  }

  onSearchInput() {
    this.applySearchFilter();
  }

  private applySearchFilter() {
    const q = (this.searchQuery || '').trim().toLowerCase();
    if (!q) {
      this.filteredConversations = [...this.conversations];
      this.searchUsers = [];
      return;
    }
    this.filteredConversations = this.conversations.filter((c) => {
      const ou = c.otherUser;
      const name = (
        ou?.fullName ||
        (ou as User & { userName?: string })?.userName ||
        ou?.username ||
        ''
      ).toLowerCase();
      return name.includes(q);
    });
    const inConvIds = new Set(
      this.filteredConversations.map((c) => c.otherUser?.id).filter(Boolean) as number[]
    );
    this.searchUsers = this.allUsersCache.filter((u) => {
      if (!u.id || u.id === this.currentUserId) return false;
      if (inConvIds.has(u.id)) return false;
      const un =
        (u as User & { userName?: string }).userName ||
        u.username ||
        '';
      const fn = (u.fullName || '').toLowerCase();
      return (
        un.toLowerCase().includes(q) ||
        fn.includes(q) ||
        (u.email || '').toLowerCase().includes(q)
      );
    }).slice(0, 8);
  }

  selectFromSearch(user: User) {
    this.selectedOther = user as User & { userName?: string };
    this.searchQuery = '';
    this.applySearchFilter();
    this.loadThread();
  }

  selectConversation(row: ConversationSummary) {
    this.selectedOther = row.otherUser;
    this.loadThread();
  }

  loadThread() {
    if (!this.currentUserId || !this.selectedOther?.id) return;
    this.loadingThread = true;
    this.sendError = '';
    this.chatService
      .markConversationRead(this.currentUserId, this.selectedOther.id)
      .subscribe({
        next: () => this.refreshUnreadBadge(),
        error: () => {},
      });
    this.chatService
      .getThread(this.currentUserId, this.selectedOther.id)
      .subscribe({
        next: (list) => {
          this.messages = list || [];
          this.buildThreadItems();
          this.loadingThread = false;
          this.scrollThreadToBottom();
          this.loadConversations();
        },
        error: () => {
          this.messages = [];
          this.threadItems = [];
          this.loadingThread = false;
        },
      });
  }

  private buildThreadItems() {
    const items: ThreadItem[] = [];
    let lastDateKey = '';
    for (const m of this.messages) {
      const raw = m.createdAt || '';
      const d = raw ? new Date(raw) : new Date();
      const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      if (key !== lastDateKey) {
        lastDateKey = key;
        items.push({ type: 'date', label: this.formatDayLabel(d) });
      }
      items.push({ type: 'msg', message: m });
    }
    this.threadItems = items;
  }

  private formatDayLabel(d: Date): string {
    return d.toLocaleString(undefined, {
      weekday: 'short',
      hour: 'numeric',
      minute: '2-digit',
    });
  }

  send() {
    const text = (this.draft || '').trim();
    if (!text || !this.currentUserId || !this.selectedOther?.id) return;
    this.sendError = '';
    this.chatService
      .sendMessage({
        senderId: this.currentUserId,
        receiverId: this.selectedOther.id,
        content: text,
      })
      .subscribe({
        next: (msg) => {
          this.draft = '';
          this.messages = [...this.messages, msg];
          this.buildThreadItems();
          this.scrollThreadToBottom();
          this.loadConversations();
          this.refreshUnreadBadge();
        },
        error: (e) => {
          this.sendError =
            e?.error?.message || e?.message || 'Could not send message.';
        },
      });
  }

  onDraftKeydown(ev: KeyboardEvent) {
    if (ev.key === 'Enter' && !ev.shiftKey) {
      ev.preventDefault();
      this.send();
    }
  }

  private refreshUnreadBadge() {
    if (!this.currentUserId) return;
    this.chatService.getUnreadCount(this.currentUserId).subscribe({
      next: (r) => this.unreadCountChange.emit(r?.unreadCount ?? 0),
      error: () => this.unreadCountChange.emit(0),
    });
  }

  avatarUrl(user: User | undefined | null): string {
    if (!user) return 'assets/images/dp_profile.jpeg';
    const url = user.profileImageUrl || user.profilePic;
    if (!url) return 'assets/images/dp_profile.jpeg';
    if (url.startsWith('http')) return url;
    return url.startsWith('/') ? url : '/' + url;
  }

  displayName(user: User | undefined | null): string {
    if (!user) return 'User';
    return (
      user.fullName ||
      (user as User & { userName?: string }).userName ||
      user.username ||
      'User'
    );
  }

  previewText(row: ConversationSummary): string {
    const lm = row.lastMessage;
    if (!lm?.content) return 'No messages yet';
    const fromMe = lm.sender?.id === this.currentUserId;
    const prefix = fromMe ? 'You: ' : '';
    const t = lm.content.trim();
    return prefix + (t.length > 42 ? t.slice(0, 40) + '…' : t);
  }

  relativeTime(row: ConversationSummary): string {
    const raw = row.lastMessage?.createdAt;
    if (!raw) return '';
    const t = new Date(raw).getTime();
    const diff = Date.now() - t;
    const m = Math.floor(diff / 60000);
    if (m < 1) return 'now';
    if (m < 60) return `${m}m`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h`;
    const d = Math.floor(h / 24);
    if (d < 7) return `${d}d`;
    const w = Math.floor(d / 7);
    if (w < 5) return `${w}w`;
    return new Date(raw).toLocaleDateString();
  }

  isSent(msg: ChatMessage): boolean {
    return msg.sender?.id === this.currentUserId;
  }

  messageTime(msg: ChatMessage): string {
    const raw = msg.createdAt;
    if (!raw) return '';
    const d = new Date(raw);
    return d.toLocaleString(undefined, { hour: 'numeric', minute: '2-digit' });
  }

  userHandle(user: User): string {
    const u = user as User & { userName?: string };
    return u.userName || user.username || user.email || '';
  }
}
