import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { UserService, User } from '../../services/user.service';
import { PostService, Post } from '../../services/post.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css']
})
export class ProfileComponent implements OnInit {
  user: User | null = null;
  recentActivities: any[] = [];

  constructor(
    private userService: UserService,
    private postService: PostService,
    private router: Router
  ) { }

  ngOnInit() {
    this.loadUserProfile();
  }

  loadUserProfile() {
    this.userService.getCurrentUser().subscribe({
      next: (data) => {
        this.user = this.transformUser(data);
        this.loadRecentActivities();
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
      profilePic: user.profileImageUrl || user.profilePic || 'https://via.placeholder.com/150',
      bannerPic: user.backgroundImageUrl || user.bannerPic || 'https://via.placeholder.com/800x200',
      linkedInUrl: user.linkedinUrl || user.linkedInUrl,
      postsCount: user.postsCount || 0,
      followersCount: user.followersCount || 0,
      followingCount: user.followingCount || 0
    };
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

  editProfile() {
    this.router.navigate(['/profile/edit']);
  }
}

