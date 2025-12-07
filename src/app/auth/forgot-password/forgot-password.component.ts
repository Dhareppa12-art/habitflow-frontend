import { Component } from '@angular/core';
import { AuthService } from '../../core/auth.service';

@Component({
  selector: 'app-forgot-password',
  templateUrl: './forgot-password.component.html',
  styleUrls: ['./forgot-password.component.css'],
})
export class ForgotPasswordComponent {
  email = '';
  loading = false;
  message = '';
  error = '';

  constructor(private authService: AuthService) {}

  onSubmit() {
    this.error = '';
    this.message = '';

    if (!this.email) {
      this.error = 'Please enter your email.';
      return;
    }

    this.loading = true;

    this.authService.requestPasswordReset(this.email).subscribe({
      next: (res) => {
        this.loading = false;
        this.message =
          res?.message ||
          'If an account with that email exists, a reset link has been sent.';
      },
      error: (err) => {
        this.loading = false;
        this.error =
          err?.error?.message || 'Something went wrong. Please try again.';
      },
    });
  }
}
