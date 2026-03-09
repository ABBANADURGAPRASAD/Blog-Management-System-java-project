import { Component, EventEmitter, Input, OnChanges, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { User } from '../../services/user.service';
import { FollowersAndFollowingService } from '../../services/followers-and-following.service';

@Component({
  selector: 'app-followers-and-following',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './followers-and-following.component.html',
  styleUrls: ['./followers-and-following.component.css']
})
export class FollowersAndFollowingComponent implements OnChanges {
  @Input() visible = false;
  @Input() mode: 'followers' | 'following' = 'followers';
  @Input() profileUserId: number | null = null;
  @Input() currentUserId: number | null = null;
  @Output() close = new EventEmitter<void>();
  @Output() countsChanged = new EventEmitter<void>();

  searchQuery = '';
  list: User[] = [];
  filteredList: User[] = [];
  loading = false;
  error: string | null = null;

  constructor(private followService: FollowersAndFollowingService) {}

  ngOnChanges(): void {
    if (this.visible && this.profileUserId != null) {
      this.searchQuery = '';
      this.loadList();
    }
  }

  get title(): string {
    return this.mode === 'followers' ? 'Followers' : 'Following';
  }

  loadList(): void {
    if (this.profileUserId == null) return;
    this.loading = true;
    this.error = null;
    const request =
      this.mode === 'followers'
        ? this.followService.getFollowers(this.profileUserId)
        : this.followService.getFollowing(this.profileUserId);
    request.subscribe({
      next: (users) => {
        this.list = users.map((u) => ({
          ...u,
          profileImageUrl: u.profileImageUrl || u.profilePic,
          fullName: u.fullName || u.username || 'User'
        }));
        this.applyFilter();
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Failed to load list.';
        this.list = [];
        this.filteredList = [];
        this.loading = false;
      }
    });
  }

  applyFilter(): void {
    const q = (this.searchQuery || '').trim().toLowerCase();
    if (!q) {
      this.filteredList = [...this.list];
      return;
    }
    this.filteredList = this.list.filter(
      (u) =>
        (u.username || '').toLowerCase().includes(q) ||
        (u.fullName || '').toLowerCase().includes(q) ||
        (u.email || '').toLowerCase().includes(q)
    );
  }

  onSearchInput(): void {
    this.applyFilter();
  }

  closeDialog(): void {
    this.close.emit();
  }

  stopPropagation(event: Event): void {
    event.stopPropagation();
  }

  unfollowUser(user: User): void {
    if (this.currentUserId == null || user.id == null) return;
    this.followService.unfollow(this.currentUserId, user.id).subscribe({
      next: () => {
        this.list = this.list.filter((u) => u.id !== user.id);
        this.applyFilter();
        this.countsChanged.emit();
      },
      error: () => {
        this.error = 'Failed to unfollow.';
      }
    });
  }

  followUser(user: User): void {
    if (this.currentUserId == null || user.id == null) return;
    this.followService.follow(this.currentUserId, user.id).subscribe({
      next: () => {
        this.countsChanged.emit();
        this.loadList();
      },
      error: () => {
        this.error = 'Failed to follow.';
      }
    });
  }

  isOwnProfile(userId: number | undefined): boolean {
    return this.currentUserId != null && userId === this.currentUserId;
  }
}
