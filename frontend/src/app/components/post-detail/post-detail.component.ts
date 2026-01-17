import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { PostService, Post, Comment } from '../../services/post.service'; // Adjust path if needed
import { AuthService } from '../../services/auth.service';

@Component({
    selector: 'app-post-detail',
    standalone: true,
    imports: [CommonModule, RouterModule],
    templateUrl: './post-detail.component.html',
    styleUrls: ['./post-detail.component.css']
})
export class PostDetailComponent implements OnInit {
    post: Post | null = null;
    isLoading = true;
    error = '';
    currentUserId: number | null = null;

    constructor(
        private route: ActivatedRoute,
        private postService: PostService,
        private authService: AuthService
    ) { }

    ngOnInit() {
        const user = this.authService.getCurrentUser();
        if (user?.id) {
            this.currentUserId = user.id;
        }

        this.route.params.subscribe(params => {
            const id = params['id'];
            if (id) {
                this.loadPost(id);
            }
        });
    }

    loadPost(id: number) {
        this.isLoading = true;
        this.postService.getPostById(id).subscribe({
            next: (post) => {
                this.post = {
                    ...post,
                    // Apply same transformations as Home if needed, simplified here
                    media: post.imageUrl || post.media,
                    author: post.user?.fullName || post.author || 'Anonymous',
                    authorPic: post.user?.profileImageUrl || post.authorPic,
                    likesCount: post.likes?.length || post.likesCount || 0,
                    isLiked: post.likes?.some((like: any) => like.user?.id === this.currentUserId) || false
                };
                this.isLoading = false;
            },
            error: (err) => {
                console.error('Error loading post', err);
                this.error = 'Failed to load post';
                this.isLoading = false;
            }
        });
    }
}
