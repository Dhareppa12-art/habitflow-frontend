import { Injectable } from '@angular/core';
import { CanActivate, Router, UrlTree } from '@angular/router';

@Injectable({
  providedIn: 'root',
})
export class AuthGuard implements CanActivate {

  constructor(private router: Router) {}

  canActivate(): boolean | UrlTree {
    // 🔹 Check if login token exists
    const token = localStorage.getItem('hf_token');

    if (token) {
      return true; // User allowed
    }

    // 🔹 No token → Redirect to login
    return this.router.parseUrl('/auth/login');
  }
}
