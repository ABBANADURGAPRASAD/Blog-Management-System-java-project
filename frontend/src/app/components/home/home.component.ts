import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { PostService, Post, Comment } from '../../services/post.service';
import { AuthService } from '../../services/auth.service';
import { User, UserService } from 'src/app/services/user.service';
import { FollowersAndFollowingService } from 'src/app/services/followers-and-following.service';
@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {
  posts: Post[] = [];
  popularPosts: Post[] = [];
  recentComments: Comment[] = [];
  tags: string[] = [];
  currentPage = 1;
  totalPages = 1;
  currentUserId: number | null = null;
  user: User | null = null;


  // Comment modal state
  selectedPostId: number | null = null;
  newComment: string = '';
  showCommentModal = false;
  postComments: Comment[] = [];
  usersList: any[] = [];
  followersCount :any;
  followingCount: any;

  constructor(
    private postService: PostService,
    private userService: UserService,
    private authService: AuthService,
    private followService: FollowersAndFollowingService,

  ) { }

  ngOnInit() {
    const currentUser = this.authService.getCurrentUser();
    if (currentUser?.id) {
      this.currentUserId = currentUser.id;
      this.loadCurrentUserProfile();
    }
    this.loadPosts();
    this.loadPopularPosts();
    this.getUserAccount();
  }

  loadCurrentUserProfile() {
    this.userService.getCurrentUser().subscribe({
      next: (data) => {
        this.user = {
          ...data,
          profileImageUrl: data.profileImageUrl || data.profilePic,
          backgroundImageUrl: data.backgroundImageUrl || data.bannerPic
        };
      },
      error: () => {
        this.user = null;
      }
    });
  }

  

  loadPosts() {
    this.postService.getAllPosts().subscribe({
      next: (data) => {
        this.posts = this.transformPosts(data);
        this.extractTags();
        // Calculate total pages (assuming 9 posts per page)
        this.totalPages = Math.ceil(this.posts.length / 9);
      },
      error: (error) => {
        console.error('Error loading posts:', error);
        this.posts = [];
      }
    });
  }

  loadPopularPosts() {
    this.postService.getPopularPosts().subscribe({
      next: (data) => {
        this.popularPosts = this.transformPosts(data).slice(0, 3);
      },
      error: (error) => {
        console.error('Error loading popular posts:', error);
        this.popularPosts = [];
      }
    });
  }

  transformPosts(posts: Post[]): Post[] {
    console.log('Transforming posts:', posts);
    return posts.map(post => {
      const media = post.mediaUrl || post.imageUrl || post.media;
      console.log(`Post ${post.id} media:`, media);
      return {
        ...post,
        media: media,
        author: post.user?.fullName || post.author || 'Anonymous',
        authorPic: post.user?.profileImageUrl || post.authorPic,
        date: this.formatDate(post.createdAt || post.date),
        likesCount: post.likes?.length || post.likesCount || 0,
        commentsCount: post.comments?.length || post.commentsCount || 0,
        isLiked: post.likes?.some((like: any) => like.user?.id === this.currentUserId) || false
      };
    });
  }

  formatDate(dateString?: string): string {
    if (!dateString) return 'Unknown date';
    const date = new Date(dateString);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
  }

  extractTags() {
    const allTags = new Set<string>();
    this.posts.forEach(post => {
      if (post.tags) {
        post.tags.split(',').forEach(tag => {
          const trimmedTag = tag.trim();
          if (trimmedTag) {
            allTags.add(trimmedTag);
          }
        });
      }
    });
    this.tags = Array.from(allTags).slice(0, 10);
  }

  loadFollowCounts() {
    if (!this.user?.id) return;
    this.followService.getCounts(this.user.id).subscribe({
      next: (counts) => {
        if (this.user) {
          this.followersCount = counts.followersCount;
          this.followingCount = counts.followingCount;
        }
      },
      error: () => {}
    });
  }

  get totalPosts(): number {
    if (this.user?.postsCount != null) return this.user.postsCount;
    if (!this.currentUserId) return 0;
    return this.posts.filter(p => (p as any).userId === this.currentUserId || (p as any).user?.id === this.currentUserId).length;
  }

  getPaginatedPosts(): Post[] {
    const startIndex = (this.currentPage - 1) * 9;
    const endIndex = startIndex + 9;
    return this.posts.slice(startIndex, endIndex);
  }

  toggleLike(post: Post) {
    if (!this.currentUserId || !post.id) return;

    const wasLiked = post.isLiked;

    this.postService.toggleLike(post.id, this.currentUserId).subscribe({
      next: () => {
        post.isLiked = !wasLiked;
        post.likesCount = (post.likesCount || 0) + (wasLiked ? -1 : 1);
        // Reload post to get updated state
        if (post.id) {
          this.postService.getPostById(post.id).subscribe({
            next: (updatedPost) => {
              const index = this.posts.findIndex(p => p.id === post.id);
              if (index !== -1) {
                this.posts[index] = this.transformPosts([updatedPost])[0];
              }
            }
          });
        }
      },
      error: (error) => {
        console.error('Error toggling like:', error);
      }
    });
  }

  openComments(post: Post) {
    if (!post.id) return;
    this.selectedPostId = post.id;
    this.showCommentModal = true;
    this.newComment = '';
    this.loadComments(post.id);
  }

  loadComments(postId: number) {
    this.postService.getComments(postId).subscribe({
      next: (comments) => {
        this.postComments = comments.map(comment => ({
          ...comment,
          author: comment.user?.fullName || comment.author || 'Anonymous',
          date: this.formatDate(comment.createdAt || comment.date)
        }));
      },
      error: (error) => {
        console.error('Error loading comments:', error);
        this.postComments = [];
      }
    });
  }

  addComment() {
    if (!this.selectedPostId || !this.currentUserId || !this.newComment.trim()) return;

    this.postService.addComment(this.selectedPostId, this.currentUserId, this.newComment).subscribe({
      next: (comment) => {
        this.postComments.push({
          ...comment,
          author: comment.user?.fullName || 'Anonymous',
          date: this.formatDate(comment.createdAt)
        });
        this.newComment = '';
        // Update post comments count
        const post = this.posts.find(p => p.id === this.selectedPostId);
        if (post) {
          post.commentsCount = (post.commentsCount || 0) + 1;
        }
      },
      error: (error) => {
        console.error('Error adding comment:', error);
      }
    });
  }

  closeCommentModal() {
    this.showCommentModal = false;
    this.selectedPostId = null;
    this.postComments = [];
    this.newComment = '';
  }

  sharePost(post: Post) {
    if (!post.id) return;
    const shareUrl = this.postService.sharePost(post.id);

    if (navigator.share) {
      navigator.share({
        title: post.title || 'Check out this post',
        text: post.content?.substring(0, 100),
        url: shareUrl
      }).catch(err => {
        console.log('Error sharing:', err);
        this.copyToClipboard(shareUrl);
      });
    } else {
      this.copyToClipboard(shareUrl);
    }
  }

  copyToClipboard(text: string) {
    navigator.clipboard.writeText(text).then(() => {
      alert('Link copied to clipboard!');
    }).catch(err => {
      console.error('Failed to copy:', err);
    });
  }

  changePage(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }

  onTagClick(tag: string) {
    this.posts = this.posts.filter(post =>
      post.tags?.toLowerCase().includes(tag.toLowerCase())
    );
  }

  getUserAccount() {
    this.userService.getAllUser().subscribe({
      next: (data: any[]) => {
        this.usersList = data.map((user: any) => user.userName);
      }
    });
  }
  
}

