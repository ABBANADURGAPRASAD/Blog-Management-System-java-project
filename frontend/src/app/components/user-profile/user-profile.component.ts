import { Component, HostListener, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { forkJoin, Subject, takeUntil } from 'rxjs';
import { UserService, User, resolveProfileImageUrl } from '../../services/user.service';
import { PostService, Post } from '../../services/post.service';
import { AuthService } from '../../services/auth.service';
import { FollowersAndFollowingService } from '../../services/followers-and-following.service';
import { FollowersAndFollowingComponent } from '../followers-and-following/followers-and-following.component';
import { ChatLaunchService } from '../../services/chat-launch.service';

export type ContentTab = 'photos' | 'videos' | 'tags';

@Component({
  selector: 'app-user-profile',
  standalone: true,
  imports: [CommonModule, RouterModule, FollowersAndFollowingComponent],
  templateUrl: './user-profile.component.html',
  styleUrls: ['./user-profile.component.css']
})
export class UserProfileComponent implements OnInit, OnDestroy {
  user: User | null = null;
  currentUserId: number | null = null;
  isFollowing = false;
  followDialogVisible = false;
  followDialogMode: 'followers' | 'following' = 'followers';
  contentTab: ContentTab = 'photos';
  allPosts: Post[] = [];
  tagsTabPosts: Post[] = [];
  loading = true;
  /** Full-screen preview of profile photo */
  avatarPreviewOpen = false;

  private readonly destroy$ = new Subject<void>();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private userService: UserService,
    private postService: PostService,
    private authService: AuthService,
    private followService: FollowersAndFollowingService,
    private chatLaunch: ChatLaunchService
  ) {}

  ngOnInit(): void {
    const current = this.authService.getCurrentUser();
    if (current?.id) {
      this.currentUserId = current.id;
    }
    this.route.paramMap.pipe(takeUntil(this.destroy$)).subscribe((pm) => {
      const id = pm.get('id');
      if (id) {
        const userId = Number(id);
        this.loadUser(userId);
        this.loadPosts(userId);
      } else {
        this.router.navigate(['/home']);
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  @HostListener('document:keydown.escape')
  onEscapeClosePreview(): void {
    if (this.avatarPreviewOpen) {
      this.closeAvatarPreview();
    }
  }

  avatarSrc(): string {
    return resolveProfileImageUrl(this.user?.profileImageUrl || this.user?.profilePic);
  }

  openAvatarPreview(): void {
    if (!this.user) {
      return;
    }
    this.avatarPreviewOpen = true;
  }

  closeAvatarPreview(): void {
    this.avatarPreviewOpen = false;
  }

  openMessage(): void {
    if (!this.user?.id || !this.currentUserId || this.user.id === this.currentUserId) {
      return;
    }
    this.chatLaunch.openChatWithUser(this.user.id);
  }

  loadUser(userId: number): void {
    this.userService.getUserById(userId).subscribe({
      next: (data) => {
        this.user = {
          ...data,
          profilePic: data.profileImageUrl || data.profilePic,
          bannerPic: data.backgroundImageUrl || data.bannerPic,
          fullName: data.fullName || data.username || (data as User & { userName?: string }).userName || 'User',
          username: (data as User & { userName?: string }).userName || data.username
        };
        this.loadFollowCounts(userId);
        if (this.currentUserId && this.currentUserId !== userId) {
          this.followService.checkFollow(this.currentUserId, userId).subscribe({
            next: (res) => (this.isFollowing = res.isFollowing),
            error: () => {}
          });
        }
      },
      error: () => this.router.navigate(['/home'])
    });
  }

  loadFollowCounts(userId: number): void {
    this.followService.getCounts(userId).subscribe({
      next: (counts) => {
        if (this.user) {
          this.user.followersCount = counts.followersCount;
          this.user.followingCount = counts.followingCount;
        }
      },
      error: () => {}
    });
  }

  loadPosts(userId: number): void {
    this.loading = true;
    forkJoin({
      all: this.postService.getPostsByUserId(userId),
      tags: this.postService.getPostsByUserId(userId, { tagsTab: true }),
    }).subscribe({
      next: ({ all, tags }) => {
        this.allPosts = all;
        this.tagsTabPosts = tags;
        this.loading = false;
      },
      error: () => (this.loading = false),
    });
  }

  get photosPosts(): Post[] {
    return this.allPosts.filter((p) => this.isPhotoPost(p));
  }

  get videosPosts(): Post[] {
    return this.allPosts.filter((p) => this.isVideoPost(p));
  }

  get tagsPosts(): Post[] {
    return this.tagsTabPosts;
  }

  get activePosts(): Post[] {
    if (this.contentTab === 'photos') return this.photosPosts;
    if (this.contentTab === 'videos') return this.videosPosts;
    return this.tagsPosts;
  }

  isPhotoPost(p: Post): boolean {
    const type = (p.mediaType || '').toLowerCase();
    const url = (p.mediaUrl || p.imageUrl || p.media || '').trim();
    if (this.isVideoPost(p)) return false;
    if (type === 'image' || url.length > 0) return true;
    return /\.(jpe?g|png|gif|webp|bmp)(\?|$)/i.test(url);
  }

  isVideoPost(p: Post): boolean {
    const type = (p.mediaType || '').toLowerCase();
    const url = p.mediaUrl || p.media || '';
    if (type === 'video') return true;
    return /\.(mp4|webm|ogg|mov)(\?|$)/i.test(url);
  }

  setContentTab(tab: ContentTab): void {
    this.contentTab = tab;
  }

  toggleFollow(): void {
    if (!this.currentUserId || !this.user?.id || this.currentUserId === this.user.id) return;
    if (this.isFollowing) {
      this.followService.unfollow(this.currentUserId, this.user.id).subscribe({
        next: () => {
          this.isFollowing = false;
          this.loadFollowCounts(this.user!.id!);
        }
      });
    } else {
      this.followService.follow(this.currentUserId, this.user.id).subscribe({
        next: () => {
          this.isFollowing = true;
          this.loadFollowCounts(this.user!.id!);
        }
      });
    }
  }

  openFollowDialog(mode: 'followers' | 'following'): void {
    this.followDialogMode = mode;
    this.followDialogVisible = true;
  }

  closeFollowDialog(): void {
    this.followDialogVisible = false;
  }

  onCountsChanged(): void {
    if (this.user?.id) this.loadFollowCounts(this.user.id);
  }
}
