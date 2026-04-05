import { Component, OnInit } from '@angular/core';
import { forkJoin } from 'rxjs';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import {
  UserService,
  User,
  resolveProfileImageUrl,
  resolveBannerImageUrl,
} from '../../services/user.service';
import { PostService, Post } from '../../services/post.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-profile-edit',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './profile-edit.component.html',
  styleUrls: ['./profile-edit.component.css']
})
export class ProfileEditComponent implements OnInit {
  profileForm: FormGroup;
  accountForm: FormGroup;
  activeTab: 'profile' | 'account' = 'profile';
  user: User | null = null;
  profilePicPreview: string | null = null;
  selectedProfilePic: File | null = null;
  /** Data URL or existing server path for cover preview */
  bannerPreview: string | null = null;
  selectedBannerFile: File | null = null;
  contentTab: 'photos' | 'videos' | 'tags' = 'photos';
  allPosts: Post[] = [];
  tagsTabPosts: Post[] = [];
  postsLoading = false;

  constructor(
    private fb: FormBuilder,
    private userService: UserService,
    private postService: PostService,
    private router: Router,
    private authService: AuthService
  ) {
    this.profileForm = this.fb.group({
      fullName: ['', Validators.required],
      bio: [''],
      phoneNumber: [''],
      twitterUrl: [''],
      linkedInUrl: ['']
    });

    this.accountForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      username: ['', Validators.required],
      password: [''],
      confirmPassword: ['']
    });
  }

  ngOnInit() {
    this.loadUserData();
  }

  loadUserData() {
    this.userService.getCurrentUser().subscribe({
      next: (data) => {
        this.user = this.transformUser(data);
        this.profileForm.patchValue({
          fullName: data.fullName || data.username || '',
          bio: data.bio || '',
          phoneNumber: data.phoneNumber || '',
          twitterUrl: data.twitterUrl || '',
          linkedInUrl: data.linkedinUrl || data.linkedInUrl || ''
        });
        const handle =
          (data as User & { userName?: string }).userName || data.username || '';
        this.accountForm.patchValue({
          email: data.email || '',
          username: handle
        });
        this.profilePicPreview = data.profileImageUrl || data.profilePic || null;
        this.bannerPreview =
          data.backgroundImageUrl || data.bannerPic || null;
        this.selectedBannerFile = null;
        this.loadMyPosts();
      },
      error: (error) => {
        console.error('Error loading user data:', error);
        this.user = null;
      }
    });
  }

  transformUser(user: User): User {
    return {
      ...user,
      profilePic: user.profileImageUrl || user.profilePic,
      bannerPic: user.backgroundImageUrl || user.bannerPic,
      linkedInUrl: user.linkedinUrl || user.linkedInUrl,
    };
  }

  profilePicDisplay(): string {
    const p = this.profilePicPreview;
    if (!p) {
      return resolveProfileImageUrl(null);
    }
    if (p.startsWith('data:') || p.startsWith('blob:')) {
      return p;
    }
    return resolveProfileImageUrl(p);
  }

  bannerDisplay(): string | null {
    const b = this.bannerPreview;
    if (b == null || String(b).trim() === '') {
      return null;
    }
    if (b.startsWith('data:') || b.startsWith('blob:')) {
      return b;
    }
    return resolveBannerImageUrl(b);
  }

  onProfilePicChange(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.selectedProfilePic = file;
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.profilePicPreview = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  }

  onBannerChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) {
      this.selectedBannerFile = file;
      const reader = new FileReader();
      reader.onload = (e: ProgressEvent<FileReader>) => {
        this.bannerPreview = (e.target?.result as string) || null;
      };
      reader.readAsDataURL(file);
    }
    input.value = '';
  }

  clearBannerSelection(): void {
    this.selectedBannerFile = null;
    this.bannerPreview =
      this.user?.backgroundImageUrl || this.user?.bannerPic || null;
  }

  switchTab(tab: 'profile' | 'account') {
    this.activeTab = tab;
  }

  saveChanges() {
    if (this.activeTab === 'profile') {
      if (this.profileForm.valid && this.user?.id) {
        const userData: User = {
          ...this.user,
          ...this.profileForm.value,
          email: this.user.email
        };

        this.userService.updateUser(this.user.id, userData).subscribe({
          next: () => {
            const uid = this.user!.id!;
            const finish = () => {
              this.userService.getUserById(uid).subscribe({
                next: (full) => {
                  const cur = this.authService.getCurrentUser();
                  const token = (full as User & { token?: string }).token || cur?.token;
                  this.authService.setCurrentUser({ ...full, token });
                  this.selectedProfilePic = null;
                  this.selectedBannerFile = null;
                  this.router.navigate(['/profile']);
                },
                error: () => this.router.navigate(['/profile'])
              });
            };
            const uploadBanner = () => {
              if (this.selectedBannerFile) {
                this.userService
                  .uploadBackgroundImage(uid, this.selectedBannerFile)
                  .subscribe({
                    next: () => finish(),
                    error: () => {
                      alert(
                        'Profile saved, but the cover image could not be uploaded.'
                      );
                      finish();
                    },
                  });
              } else {
                finish();
              }
            };
            if (this.selectedProfilePic) {
              this.userService.uploadProfileImage(uid, this.selectedProfilePic).subscribe({
                next: () => uploadBanner(),
                error: () => {
                  alert('Profile saved, but the profile photo could not be uploaded.');
                  uploadBanner();
                }
              });
            } else {
              uploadBanner();
            }
          },
          error: () => alert('Failed to update profile. Please try again.')
        });
      }
    } else {
      if (this.accountForm.valid && this.user?.id) {
        const userData: User = {
          ...this.user,
          ...this.accountForm.value
        };

        if (!userData.password || userData.password === '') {
          delete userData.password;
        }

        this.userService.updateUser(this.user.id, userData).subscribe({
          next: () => {
            this.userService.getUserById(this.user!.id!).subscribe({
              next: (full) => {
                const cur = this.authService.getCurrentUser();
                const token = (full as User & { token?: string }).token || cur?.token;
                this.authService.setCurrentUser({ ...full, token });
                this.router.navigate(['/profile']);
              },
              error: () => this.router.navigate(['/profile'])
            });
          },
          error: () => alert('Failed to update account settings. Please try again.')
        });
      }
    }
  }

  cancel() {
    this.router.navigate(['/profile']);
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
}

