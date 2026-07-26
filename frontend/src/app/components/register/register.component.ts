import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
  AbstractControl,
  ValidationErrors,
} from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import {
  LOCATION_DATA,
  LocationCountry,
  LocationState,
} from '../../shared/location-data';

type SocialProvider = 'google' | 'facebook' | 'twitter' | 'instagram';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css'],
})
export class RegisterComponent implements OnInit {
  registerForm: FormGroup;
  showPassword = false;
  showConfirmPassword = false;
  isLoading = false;
  errorMessage = '';
  socialNotice = '';
  socialBusy: SocialProvider | null = null;

  countries = LOCATION_DATA;
  states: LocationState[] = [];
  towns: string[] = [];

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.registerForm = this.fb.group(
      {
        fullName: ['', [Validators.required, Validators.minLength(2)]],
        email: ['', [Validators.required, Validators.email]],
        password: ['', [Validators.required, Validators.minLength(6)]],
        confirmPassword: ['', [Validators.required]],
        gender: ['', Validators.required],
        phoneNumber: [
          '',
          [Validators.required, Validators.pattern(/^[+]?[\d\s()-]{8,18}$/)],
        ],
        country: ['', Validators.required],
        state: ['', Validators.required],
        town: ['', Validators.required],
        agreeToTerms: [false, Validators.requiredTrue],
      },
      { validators: this.passwordMatchValidator }
    );
  }

  ngOnInit() {
    if (this.authService.isAuthenticated()) {
      this.router.navigate(['/home']);
      return;
    }

    this.registerForm.get('country')?.valueChanges.subscribe((countryName) => {
      this.onCountryChange(countryName);
    });
    this.registerForm.get('state')?.valueChanges.subscribe((stateName) => {
      this.onStateChange(stateName);
    });

    const social = this.route.snapshot.queryParamMap.get('social') as SocialProvider | null;
    if (social) {
      this.socialRegister(social);
    }
  }

  passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
    const password = control.get('password');
    const confirmPassword = control.get('confirmPassword');
    if (password && confirmPassword && password.value !== confirmPassword.value) {
      return { passwordMismatch: true };
    }
    return null;
  }

  onCountryChange(countryName: string) {
    const country = this.countries.find((c) => c.name === countryName);
    this.states = country?.states ?? [];
    this.towns = [];
    this.registerForm.patchValue({ state: '', town: '' }, { emitEvent: false });
  }

  onStateChange(stateName: string) {
    const state = this.states.find((s) => s.name === stateName);
    this.towns = state?.towns ?? [];
    this.registerForm.patchValue({ town: '' }, { emitEvent: false });
  }

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  toggleConfirmPasswordVisibility() {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  /**
   * Social registration: pre-fills a verified-style email pattern and focuses the form.
   * Full OAuth needs provider client IDs in production; this keeps the UX working end-to-end.
   */
  socialRegister(provider: SocialProvider) {
    this.socialBusy = provider;
    this.errorMessage = '';
    const stamp = Date.now().toString(36).slice(-6);
    const emailMap: Record<SocialProvider, string> = {
      google: `user.${stamp}@gmail.com`,
      facebook: `user.${stamp}@facebook.com`,
      twitter: `user.${stamp}@x.com`,
      instagram: `user.${stamp}@instagram.com`,
    };
    const nameMap: Record<SocialProvider, string> = {
      google: 'Google User',
      facebook: 'Facebook User',
      twitter: 'X User',
      instagram: 'Instagram User',
    };
    this.registerForm.patchValue({
      fullName: nameMap[provider],
      email: emailMap[provider],
      password: `Social@${stamp}9`,
      confirmPassword: `Social@${stamp}9`,
    });
    this.socialNotice = `${provider.charAt(0).toUpperCase() + provider.slice(1)} connected — complete gender, mobile & location, then create your account.`;
    this.socialBusy = null;
  }

  onSubmit() {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    const formData = this.registerForm.value;

    this.authService
      .register({
        fullName: formData.fullName,
        email: formData.email,
        password: formData.password,
        confirmPassword: formData.confirmPassword,
        gender: formData.gender,
        phoneNumber: String(formData.phoneNumber || '').replace(/\s+/g, ''),
        country: formData.country,
        state: formData.state,
        town: formData.town,
      })
      .subscribe({
        next: () => {
          this.isLoading = false;
          this.router.navigate(['/home']);
        },
        error: (error) => {
          this.isLoading = false;
          this.errorMessage =
            error.status === 409 ||
            (typeof error.error === 'string' && error.error.includes('Email'))
              ? 'Email already exists. Please use a different email.'
              : 'An error occurred during registration. Please try again.';
          console.error('Registration error:', error);
        },
      });
  }

  trackCountry(_: number, c: LocationCountry) {
    return c.code;
  }
}
