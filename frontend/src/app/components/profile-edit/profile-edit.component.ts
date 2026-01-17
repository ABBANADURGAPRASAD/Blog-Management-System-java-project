import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { UserService, User } from '../../services/user.service';

@Component({
  selector: 'app-profile-edit',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
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

  constructor(
    private fb: FormBuilder,
    private userService: UserService,
    private router: Router
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
        this.accountForm.patchValue({
          email: data.email || '',
          username: data.username || ''
        });
        this.profilePicPreview = data.profileImageUrl || data.profilePic || null;
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
      linkedInUrl: user.linkedinUrl || user.linkedInUrl
    };
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

  switchTab(tab: 'profile' | 'account') {
    this.activeTab = tab;
  }

  saveChanges() {
    if (this.activeTab === 'profile') {
      if (this.profileForm.valid && this.user?.id) {
        const userData: User = {
          ...this.user,
          ...this.profileForm.value,
          email: this.user.email // Ensure email is preserved
        };

        // Note: Profile picture upload would need a separate endpoint
        // For now, we only update text fields
        if (this.selectedProfilePic) {
          console.warn('Profile picture upload not yet implemented. Image will not be uploaded.');
        }

        this.userService.updateUser(this.user.id, userData).subscribe({
          next: (response) => {
            console.log('Profile updated successfully:', response);
            this.router.navigate(['/profile']);
          },
          error: (error) => {
            console.error('Error updating profile:', error);
            alert('Failed to update profile. Please try again.');
          }
        });
      }
    } else {
      if (this.accountForm.valid && this.user?.id) {
        const userData: User = {
          ...this.user,
          ...this.accountForm.value
        };

        // Don't send password if not changed
        if (!userData.password || userData.password === '') {
          delete userData.password;
        }

        this.userService.updateUser(this.user.id, userData).subscribe({
          next: (response) => {
            console.log('Account settings updated successfully:', response);
            this.router.navigate(['/profile']);
          },
          error: (error) => {
            console.error('Error updating account settings:', error);
            alert('Failed to update account settings. Please try again.');
          }
        });
      }
    }
  }

  cancel() {
    this.router.navigate(['/profile']);
  }
}

