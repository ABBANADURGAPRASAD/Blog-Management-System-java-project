import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PostService, Post } from '../../services/post.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {
  posts: Post[] = [];
  popularPosts: Post[] = [];
  recentComments: any[] = [];
  tags: string[] = ['gemini', 'backend', 'github', 'tags', 'posting', 'category'];
  currentPage = 1;
  totalPages = 13;

  constructor(private postService: PostService) {}

  ngOnInit() {
    this.loadPosts();
    this.loadPopularPosts();
    this.loadRecentComments();
  }

  loadPosts() {
    this.postService.getAllPosts().subscribe({
      next: (data) => {
        this.posts = data;
      },
      error: (error) => {
        console.error('Error loading posts:', error);
        // Mock data for development
        this.posts = this.getMockPosts();
      }
    });
  }

  loadPopularPosts() {
    // Mock popular posts
    this.popularPosts = this.posts.slice(0, 3);
  }

  loadRecentComments() {
    // Mock recent comments
    this.recentComments = [
      { author: 'A', name: 'Durga Prasent', text: 'enziectioner', time: '30 minutes ago' },
      { author: 'U', name: 'Ideacainaered', text: 'to vierraing new Ciommentia e recent...', time: '25 minutes ago' },
      { author: 'M', name: 'Theron Chery', text: 'Messager', time: '20 minutes ago' }
    ];
  }

  getMockPosts(): Post[] {
    return [
      {
        id: 1,
        title: 'Gemini_Generated_Image 6tmtz4u8tmz.png',
        content: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
        media: 'https://via.placeholder.com/400x200?text=Post+1',
        author: 'Durga Prasa',
        authorPic: 'https://via.placeholder.com/32',
        date: 'Aug 13, 2023'
      },
      {
        id: 2,
        title: 'What is Instomast Strong Framework?',
        content: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
        media: 'https://via.placeholder.com/400x200?text=Post+2',
        author: 'Durga Prasa',
        authorPic: 'https://via.placeholder.com/32',
        date: 'Aug 12, 2023'
      },
      {
        id: 3,
        title: 'How to Becinvas a blogmancy?',
        content: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
        media: 'https://via.placeholder.com/400x200?text=Post+3',
        author: 'Durga Prasa',
        authorPic: 'https://via.placeholder.com/32',
        date: 'Aug 13, 2023'
      },
      {
        id: 4,
        title: 'How to Mriite coregory Whiire?',
        content: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
        media: 'https://via.placeholder.com/400x200?text=Post+4',
        author: 'Durga Prasa',
        authorPic: 'https://via.placeholder.com/32',
        date: 'Jun 11, 2023'
      },
      {
        id: 5,
        title: 'How to Mivett Interesd Thinking',
        content: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
        media: 'https://via.placeholder.com/400x200?text=Post+5',
        author: 'Durga Prasa',
        authorPic: 'https://via.placeholder.com/32',
        date: 'Jun 11, 2023'
      },
      {
        id: 6,
        title: 'What Dao Mosswung tare Reln?',
        content: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
        media: 'https://via.placeholder.com/400x200?text=Post+6',
        author: 'Durga Prasa',
        authorPic: 'https://via.placeholder.com/32',
        date: 'Jun 11, 2023'
      }
    ];
  }

  changePage(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.loadPosts();
    }
  }

  onTagClick(tag: string) {
    console.log('Tag clicked:', tag);
    // Implement tag filtering
  }
}

