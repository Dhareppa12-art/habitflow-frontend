import { Injectable } from '@angular/core';
import {
  CanActivate,
  Router,
  UrlTree,
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
} from '@angular/router';
import { AuthService } from '../core/auth.service';

@Injectable({
  providedIn: 'root',
})
export class AuthGuard implements CanActivate {

  constructor(
    private router: Router,
    private auth: AuthService
  ) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): boolean | UrlTree {

    // ✅ Check if user is logged in (token exists)
    const isLoggedIn = this.auth.isAuthenticated();

    if (isLoggedIn) {
      return true; // allow access to /app/...
    }

    // ❌ Not logged in → redirect to login
    return this.router.createUrlTree(['/auth/login'], {
      queryParams: { redirect: state.url }, // optional: keep this or remove
    });
  }
}
