import { Component } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent {
  constructor(private router: Router) {}

  onNewPostClick() {
    this.router.navigate(['/create']);
  }

  onProfileClick() {
    this.router.navigate(['/profile']);
  }

  onHomeClick() {
    this.router.navigate(['/home']);
  }
}

