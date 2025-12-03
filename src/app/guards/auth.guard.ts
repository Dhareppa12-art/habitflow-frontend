// src/app/guards/auth.guard.ts
import { Injectable } from '@angular/core';
import { CanActivate, Router, UrlTree } from '@angular/router';

@Injectable({
  providedIn: 'root',
})
export class AuthGuard implements CanActivate {
  constructor(private router: Router) {}

  canActivate(): boolean | UrlTree {
    // FRONTEND ONLY: just check if token exists in localStorage
    const token = localStorage.getItem('hf_token');
    if (token) {
      return true;
    }

    // Not logged in → go to login page
    return this.router.parseUrl('/auth/login');
  }
}
