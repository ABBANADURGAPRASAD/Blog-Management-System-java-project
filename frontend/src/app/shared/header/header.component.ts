import { Component, OnInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { User } from '../../services/user.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent implements OnInit {
  currentUser: User | null = null;
  isAuthenticated = false;

  isHeaderHidden = false;

  constructor(
    private router: Router,
    private authService: AuthService
  ) { }

  ngOnInit() {
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
      this.isAuthenticated = !!user;
    });

    this.router.events.subscribe(() => {
      const currentUrl = this.router.url;
      this.isHeaderHidden = currentUrl === '/login' || currentUrl === '/register';
    });
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

