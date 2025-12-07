import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../core/auth.service';

@Component({
  selector: 'app-reset-password',
  templateUrl: './reset-password.component.html',
  styleUrls: ['./reset-password.component.css'],
})
export class ResetPasswordComponent {
  token = '';
  password = '';
  confirmPassword = '';
  loading = false;
  message = '';
  error = '';

  constructor(
    private route: ActivatedRoute,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit() {
    // Extract token from URL :token
    this.token = this.route.snapshot.paramMap.get('token') || '';
  }

  onSubmit() {
    this.error = '';
    this.message = '';

    if (!this.password || !this.confirmPassword) {
      this.error = 'Please fill all fields.';
      return;
    }

    if (this.password.length < 6) {
      this.error = 'Password must be at least 6 characters long.';
      return;
    }

    if (this.password !== this.confirmPassword) {
      this.error = 'Passwords do not match.';
      return;
    }

    this.loading = true;

    this.authService.resetPassword(this.token, this.password).subscribe({
      next: (res) => {
        this.loading = false;
        this.message = res?.message || 'Password reset successful!';

        // Redirect to login after delay
        setTimeout(() => {
          this.router.navigate(['/auth/login']);
        }, 1500);
      },
      error: (err) => {
        this.loading = false;
        this.error =
          err?.error?.message || 'Invalid or expired link. Please try again.';
      },
    });
  }
}
