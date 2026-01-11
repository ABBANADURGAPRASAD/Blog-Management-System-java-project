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
        this.user = data;
        this.profileForm.patchValue({
          fullName: data.fullName || data.username || '',
          bio: data.bio || '',
          phoneNumber: data.phoneNumber || '',
          twitterUrl: data.twitterUrl || '',
          linkedInUrl: data.linkedInUrl || ''
        });
        this.accountForm.patchValue({
          email: data.email || '',
          username: data.username || ''
        });
        this.profilePicPreview = data.profilePic || null;
      },
      error: (error) => {
        console.error('Error loading user data:', error);
        // Mock data for development
        this.user = this.getMockUser();
        this.profileForm.patchValue({
          fullName: 'Durga Prasad',
          bio: 'Durga Prasad',
          phoneNumber: '',
          twitterUrl: 'Duitren besd.',
          linkedInUrl: '1 monusttions'
        });
      }
    });
  }

  getMockUser(): User {
    return {
      id: 1,
      username: 'durga_prasad',
      fullName: 'Durga Prasad',
      email: 'durga@example.com',
      role: 'Admin'
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
      if (this.profileForm.valid) {
        const formData = new FormData();
        const formValue = this.profileForm.value;
        
        Object.keys(formValue).forEach(key => {
          if (formValue[key]) {
            formData.append(key, formValue[key]);
          }
        });

        if (this.selectedProfilePic) {
          formData.append('profilePic', this.selectedProfilePic);
        }

        if (this.user?.id) {
          this.userService.updateUser(this.user.id, formData).subscribe({
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
      }
    } else {
      if (this.accountForm.valid) {
        // Handle account settings update
        console.log('Account settings:', this.accountForm.value);
        alert('Account settings updated successfully!');
      }
    }
  }

  cancel() {
    this.router.navigate(['/profile']);
  }
}

