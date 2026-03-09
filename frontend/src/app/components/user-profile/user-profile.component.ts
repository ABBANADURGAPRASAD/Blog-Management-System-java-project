import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { UserService, User } from '../../services/user.service';
import { PostService, Post } from '../../services/post.service';
import { AuthService } from '../../services/auth.service';
import { FollowersAndFollowingService } from '../../services/followers-and-following.service';
import { FollowersAndFollowingComponent } from '../followers-and-following/followers-and-following.component';

export type ContentTab = 'photos' | 'videos' | 'tags';

@Component({
  selector: 'app-user-profile',
  standalone: true,
  imports: [CommonModule, RouterModule, FollowersAndFollowingComponent],
  templateUrl: './user-profile.component.html',
  styleUrls: ['./user-profile.component.css']
})
export class UserProfileComponent implements OnInit {
  user: User | null = null;
  currentUserId: number | null = null;
  isFollowing = false;
  followDialogVisible = false;
  followDialogMode: 'followers' | 'following' = 'followers';
  contentTab: ContentTab = 'photos';
  allPosts: Post[] = [];
  loading = true;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private userService: UserService,
    private postService: PostService,
    private authService: AuthService,
    private followService: FollowersAndFollowingService
  ) {}

  ngOnInit() {
    const current = this.authService.getCurrentUser();
    if (current?.id) this.currentUserId = current.id;
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadUser(Number(id));
      this.loadPosts(Number(id));
    } else {
      this.router.navigate(['/home']);
    }
  }

  loadUser(userId: number) {
    this.userService.getUserById(userId).subscribe({
      next: (data) => {
        this.user = {
          ...data,
          profilePic: data.profileImageUrl || data.profilePic,
          bannerPic: data.backgroundImageUrl || data.bannerPic,
          fullName: data.fullName || data.username || 'User'
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

  loadFollowCounts(userId: number) {
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

  loadPosts(userId: number) {
    this.loading = true;
    this.postService.getPostsByUserId(userId).subscribe({
      next: (posts) => {
        this.allPosts = posts;
        this.loading = false;
      },
      error: () => (this.loading = false)
    });
  }

  get photosPosts(): Post[] {
    return this.allPosts.filter((p) => this.isPhotoPost(p));
  }

  get videosPosts(): Post[] {
    return this.allPosts.filter((p) => this.isVideoPost(p));
  }

  get tagsPosts(): Post[] {
    return this.allPosts.filter((p) => (p.tags || '').trim().length > 0);
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

  setContentTab(tab: ContentTab) {
    this.contentTab = tab;
  }

  toggleFollow() {
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

  openFollowDialog(mode: 'followers' | 'following') {
    this.followDialogMode = mode;
    this.followDialogVisible = true;
  }

  closeFollowDialog() {
    this.followDialogVisible = false;
  }

  onCountsChanged() {
    if (this.user?.id) this.loadFollowCounts(this.user.id);
  }
}
