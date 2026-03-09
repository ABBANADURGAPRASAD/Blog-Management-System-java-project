import { Component, OnInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { User, UserService } from '../../services/user.service';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule,

    FormsModule,
    ReactiveFormsModule
  ],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent implements OnInit {
  currentUser: User | null = null;
  isAuthenticated = false;

  isHeaderHidden = false;
  showSearch = true;
  usersList: User[] = [];
  allUsers: User[] = [];
  searchText = '';
  showSearchDropdown = false;

  constructor(
    private router: Router,
    private authService: AuthService,
    private userService: UserService,
  ) { }

  ngOnInit() {
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
      this.isAuthenticated = !!user;
    });

    const updateFromUrl = () => {
      const currentUrl = this.router.url;
      this.isHeaderHidden = currentUrl === '/login' || currentUrl === '/register';
      this.showSearch = !currentUrl.includes('/profile/edit');
    };
    updateFromUrl();
    this.router.events.subscribe(updateFromUrl);
  }

  onNewPostClick() {
    if (this.isAuthenticated) {
      this.router.navigate(['/create']);
    } else {
      this.router.navigate(['/login']);
    }
  }

  onProfileClick() {
    if (this.isAuthenticated) {
      this.router.navigate(['/profile']);
    } else {
      this.router.navigate(['/login']);
    }
  }

  onSearchFocus() {
    this.showSearchDropdown = true;
    if (this.allUsers.length === 0) {
      this.userService.getAllUser().subscribe({
        next: (data) => {
          this.allUsers = data as User[];
          this.filterUsers();
        },
        error: () => {}
      });
    } else {
      this.filterUsers();
    }
  }

  onSearchBlur() {
    setTimeout(() => (this.showSearchDropdown = false), 200);
  }

  filterUsers() {
    const q = (this.searchText || '').trim().toLowerCase();
    if (!q) {
      this.usersList = this.allUsers.slice(0, 10);
      return;
    }
    this.usersList = this.allUsers.filter(
      (u) =>
        (u.username || '').toLowerCase().includes(q) ||
        (u.fullName || '').toLowerCase().includes(q) ||
        (u.email || '').toLowerCase().includes(q)
    ).slice(0, 10);
  }

  searchUsers() {
    this.filterUsers();
  }

  selectUser(user: User) {
    this.searchText = '';
    this.showSearchDropdown = false;
    if (!user?.id) return;
    if (this.currentUser?.id === user.id) {
      this.router.navigate(['/profile/edit']);
    } else {
      this.router.navigate(['/user', user.id]);
    }
  }


  onHomeClick() {
    this.router.navigate(['/home']);
  }

  onLoginClick() {
    this.router.navigate(['/login']);
  }

  onRegisterClick() {
    this.router.navigate(['/register']);
  }

  onLogoutClick() {
    this.authService.logout();
    this.router.navigate(['/home']);
  }
}

