import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { forkJoin } from 'rxjs';
import { UserService, User, resolveProfileImageUrl, resolveBannerImageUrl } from '../../services/user.service';
import { PostService, Post } from '../../services/post.service';
import { AuthService } from '../../services/auth.service';
import { FollowersAndFollowingService } from '../../services/followers-and-following.service';
import { FollowersAndFollowingComponent } from '../followers-and-following/followers-and-following.component';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, RouterModule, FollowersAndFollowingComponent],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css']
})
export class ProfileComponent implements OnInit {
  user: User | null = null;
  recentActivities: any[] = [];
  followDialogVisible = false;
  followDialogMode: 'followers' | 'following' = 'followers';
  currentUserId: number | null = null;
  contentTab: 'photos' | 'videos' | 'tags' = 'photos';
  allPosts: Post[] = [];
  /** Posts for Tags tab: yours with @mentions + posts where you were @mentioned */
  tagsTabPosts: Post[] = [];
  postsLoading = false;

  constructor(
    private userService: UserService,
    private postService: PostService,
    private authService: AuthService,
    private followService: FollowersAndFollowingService,
    private router: Router
  ) { }

  ngOnInit() {
    const current = this.authService.getCurrentUser();
    if (current?.id) this.currentUserId = current.id;
    this.loadUserProfile();
  }

  loadUserProfile() {
    this.userService.getCurrentUser().subscribe({
      next: (data) => {
        this.user = this.transformUser(data);
        this.loadFollowCounts();
        this.loadRecentActivities();
        this.loadMyPosts();
      },
      error: (error) => {
        console.error('Error loading user profile:', error);
        this.user = null;
        this.recentActivities = [];
      }
    });
  }

  transformUser(user: User): User {
    return {
      ...user,
      profilePic: user.profileImageUrl || user.profilePic,
      bannerPic: user.backgroundImageUrl || user.bannerPic,
      linkedInUrl: user.linkedinUrl || user.linkedInUrl,
      postsCount: user.postsCount || 0,
      followersCount: user.followersCount || 0,
      followingCount: user.followingCount || 0
    };
  }

  profileAvatarSrc(): string {
    return resolveProfileImageUrl(this.user?.profileImageUrl || this.user?.profilePic);
  }

  bannerSrc(): string | null {
    return resolveBannerImageUrl(this.user?.backgroundImageUrl || this.user?.bannerPic);
  }

  loadRecentActivities() {
    if (!this.user?.id) {
      this.recentActivities = [];
      return;
    }

    // Load user's posts as recent activities
    this.postService.getAllPosts().subscribe({
      next: (posts) => {
        const userPosts = posts.filter(post => post.user?.id === this.user?.id || post.author === this.user?.fullName);
        if (this.user) {
          this.user.postsCount = userPosts.length;
        }
        this.recentActivities = userPosts.slice(0, 5).map(post => ({
          type: 'post',
          icon: '📝',
          text: post.title || post.content?.substring(0, 100) || 'Recent Post',
          author: post.user?.fullName || this.user?.fullName,
          authorPic: post.user?.profileImageUrl || this.user?.profilePic,
          date: this.formatDate(post.createdAt),
          time: this.getTimeAgo(post.createdAt)
        }));
      },
      error: (error) => {
        console.error('Error loading recent activities:', error);
        this.recentActivities = [];
      }
    });
  }

  formatDate(dateString?: string): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
  }

  getTimeAgo(dateString?: string): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins} minutes ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} hours ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} days ago`;
  }

  loadFollowCounts() {
    if (!this.user?.id) return;
    this.followService.getCounts(this.user.id).subscribe({
      next: (counts) => {
        if (this.user) {
          this.user.followersCount = counts.followersCount;
          this.user.followingCount = counts.followingCount;
        }
      },
      error: () => {}
    });
  }

  openFollowDialog(mode: 'followers' | 'following') {
    this.followDialogMode = mode;
    this.followDialogVisible = true;
  }

  closeFollowDialog() {
    this.followDialogVisible = false;
  }

  loadMyPosts() {
    if (!this.user?.id) return;
    this.postsLoading = true;
    const uid = this.user.id;
    forkJoin({
      all: this.postService.getPostsByUserId(uid),
      tags: this.postService.getPostsByUserId(uid, { tagsTab: true }),
    }).subscribe({
      next: ({ all, tags }) => {
        this.allPosts = all;
        this.tagsTabPosts = tags;
        this.postsLoading = false;
      },
      error: () => (this.postsLoading = false),
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

  setContentTab(tab: 'photos' | 'videos' | 'tags') {
    this.contentTab = tab;
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

  editProfile() {
    this.router.navigate(['/profile/edit']);
  }
}

