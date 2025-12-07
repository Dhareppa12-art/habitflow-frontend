import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../core/auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {

  loginForm: FormGroup;
  loading = false;
  errorMessage: string | null = null;
  successMessage: string | null = null;   // success after signup

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    private auth: AuthService
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      // match signup: at least 8 chars
      password: ['', [Validators.required, Validators.minLength(8)]],
    });
  }

  ngOnInit(): void {
    // read ?registered=true from URL
    this.route.queryParamMap.subscribe((params) => {
      const registered = params.get('registered');
      if (registered === 'true') {
        this.successMessage = 'Account created successfully. Please log in.';
      }
    });
  }

  onSubmit(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.loading = true;
    this.errorMessage = null;
    this.successMessage = null; // clear success once they try to log in

    const raw = this.loginForm.value;
    const payload = {
      email: raw.email.trim().toLowerCase(),
      password: raw.password
    };

    this.auth.login(payload).subscribe({
      next: () => {
        this.loading = false;
        this.router.navigateByUrl('/app/dashboard');
      },
      error: (err) => {
        this.loading = false;

        if (err?.status === 0) {
          this.errorMessage =
            'Unable to reach server. Please check your connection and try again.';
        } else if (err?.status === 401 || err?.status === 400) {
          this.errorMessage = 'Invalid email or password. Please try again.';
        } else {
          this.errorMessage =
            err?.error?.message ||
            'Something went wrong while logging in. Please try again.';
        }
      },
    });
  }

  get email() { return this.loginForm.get('email'); }
  get password() { return this.loginForm.get('password'); }
}
