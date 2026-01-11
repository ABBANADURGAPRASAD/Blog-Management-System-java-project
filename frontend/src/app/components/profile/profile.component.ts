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
  ) {}

  ngOnInit() {
    this.loadUserProfile();
    this.loadRecentActivities();
  }

  loadUserProfile() {
    this.userService.getCurrentUser().subscribe({
      next: (data) => {
        this.user = data;
      },
      error: (error) => {
        console.error('Error loading user profile:', error);
        // Mock data for development
        this.user = this.getMockUser();
      }
    });
  }

  loadRecentActivities() {
    // Mock recent activities
    this.recentActivities = [
      {
        type: 'post',
        icon: '+',
        text: 'Recent Post',
        time: '5 minutes ago'
      },
      {
        type: 'post',
        icon: '📝',
        text: 'Gemini_Generated_Image 6tmtz4u8tmz.png remove lorem ipsum ioum dolor sit amet, consectetur adipiscing elit, selis...',
        author: 'Durga Prasad',
        authorPic: 'https://via.placeholder.com/24',
        date: 'Jun 11, 2023'
      },
      {
        type: 'post',
        icon: '📝',
        text: 'How to Insttomast Strong Framework? v? tronse6tmz4i0tmz.png',
        author: 'Durga Prasad',
        authorPic: 'https://via.placeholder.com/24',
        time: '20 minutes ago'
      },
      {
        type: 'post',
        icon: '📝',
        text: 'How to Becinvas a blogmancy a ploer wzmd, consectetur adipiscing elit.',
        date: 'Aug 11, 2023'
      },
      {
        type: 'post',
        icon: '📝',
        text: 'How to Mnite coreegory Whire? amet, consectetur adipiscing elit.',
        author: 'Durga Prasad',
        authorPic: 'https://via.placeholder.com/24',
        date: 'Jun 11, 2023'
      }
    ];
  }

  getMockUser(): User {
    return {
      id: 1,
      username: 'durga_prasad',
      fullName: 'Durga Prasad',
      email: 'durga@example.com',
      role: 'Admin',
      bio: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et',
      profilePic: 'https://via.placeholder.com/120',
      bannerPic: 'https://via.placeholder.com/800x200',
      postsCount: 12,
      commentsCount: 45,
      followersCount: 120,
      twitterUrl: 'https://twitter.com/durga',
      linkedInUrl: 'https://linkedin.com/in/durga'
    };
  }

  editProfile() {
    this.router.navigate(['/profile/edit']);
  }
}

