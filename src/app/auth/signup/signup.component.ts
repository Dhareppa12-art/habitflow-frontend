import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/auth.service';

@Component({
  selector: 'app-signup',
  templateUrl: './signup.component.html',
  styleUrls: ['./signup.component.css']
})
export class SignupComponent {

  signupForm: FormGroup;
  loading = false;
  errorMessage: string | null = null;

  constructor(  private fb: FormBuilder, private router: Router, private auth: AuthService) {
    this.signupForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      password: [
        '',
        [
          Validators.required,
          Validators.minLength(8),
          // At least 1 upper, 1 lower, 1 digit, 1 special char
          Validators.pattern(
            /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/
          ),
        ],
      ],
    });
  }

  onSubmit(): void {
    if (this.signupForm.invalid) {
      this.signupForm.markAllAsTouched();
      return;
    }

    this.loading = true;
    this.errorMessage = null;

    const raw = this.signupForm.value;
    //console.log(raw)
    const payload = {
      name: raw.name.trim(),
      email: raw.email.trim().toLowerCase(),
      password: raw.password
    };

    this.auth.signup(payload).subscribe({
      next: () => {
        this.loading = false;
        // show success on login page
        this.router.navigate(['/auth/login'], {
          queryParams: { registered: 'true' }
        });
      },
      error: (err) => {
        this.loading = false;

        if (err?.status === 0) {
          this.errorMessage =
            'Unable to reach server. Please check your connection and try again.';
        } else if (err?.status === 409 || err?.error?.message === 'Email already registered') {
          this.errorMessage = 'Email already registered. Try logging in instead.';
        } else {
          this.errorMessage =
            err?.error?.message ||
            'Signup failed. Please check your details and try again.';
        }
      },
    });
  }

  get name() { return this.signupForm.get('name'); }
  get email() { return this.signupForm.get('email'); }
  get password() { return this.signupForm.get('password'); }
}
