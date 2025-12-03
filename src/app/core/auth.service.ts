import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap, map } from 'rxjs';
import { environment } from '../../environments/environment';

export interface CurrentUser {
  id: string;
  name: string;
  email: string;
  role?: string;
}

// Backend usually returns:
// { success, data: { token, user }, message? }
interface RawAuthResponse {
  success?: boolean;
  data?: {
    token?: string;
    user?: CurrentUser;
  };
  token?: string;            // fallback shape
  user?: CurrentUser;        // fallback shape
  message?: string;
}

interface MeResponse {
  success?: boolean;
  data?: CurrentUser;
  message?: string;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private baseUrl = `${environment.apiUrl}/auth`;
  private tokenKey = 'hf_token';
  private userKey = 'hf_user';

  private _currentUser$ = new BehaviorSubject<CurrentUser | null>(null);

  constructor(private http: HttpClient) {
    const storedUser = localStorage.getItem(this.userKey);
    if (storedUser) {
      try {
        this._currentUser$.next(JSON.parse(storedUser));
      } catch {
        localStorage.removeItem(this.userKey);
      }
    }
  }

  // --------------------------
  // PUBLIC OBSERVABLE
  // --------------------------
  get currentUser$(): Observable<CurrentUser | null> {
    return this._currentUser$.asObservable();
  }

  getCurrentUser(): CurrentUser | null {
    return this._currentUser$.value;
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  // --------------------------
  // REAL BACKEND SIGNUP
  // --------------------------
  signup(payload: {
    name: string;
    email: string;
    password: string;
  }): Observable<RawAuthResponse> {
    return this.http
      .post<RawAuthResponse>(`${this.baseUrl}/signup`, payload)
      .pipe(
        tap((res) => {
          console.log('[AUTH] signup response', res);
          // If you want auto-login after signup, uncomment:
          // const { user, token } = this.extractUserAndToken(res);
          // if (user && token) this.saveAuth(user, token);
        })
      );
  }

  // --------------------------
  // REAL BACKEND LOGIN
  // --------------------------
  login(payload: {
    email: string;
    password: string;
  }): Observable<RawAuthResponse> {
    return this.http
      .post<RawAuthResponse>(`${this.baseUrl}/login`, payload)
      .pipe(
        tap((res) => {
          console.log('[AUTH] login response', res);
          const { user, token } = this.extractUserAndToken(res);
          if (user && token) {
            this.saveAuth(user, token);
          }
        })
      );
  }

  // --------------------------
  // REAL BACKEND GET CURRENT USER
  // --------------------------
  getMe(): Observable<CurrentUser> {
    return this.http.get<MeResponse>(`${this.baseUrl}/me`).pipe(
      tap((res) => {
        console.log('[AUTH] me response', res);
        const user = res?.data;
        if (user) {
          localStorage.setItem(this.userKey, JSON.stringify(user));
          this._currentUser$.next(user);
        }
      }),
      map((res) => (res.data as CurrentUser))
    );
  }

  // --------------------------
  // CHANGE PASSWORD (SECURITY TAB)
  // --------------------------
  changePassword(payload: {
    currentPassword: string;
    newPassword: string;
  }): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(
      `${this.baseUrl}/change-password`,
      payload
    );
  }

  // --------------------------
  // Helper: normalize backend auth shape
  // --------------------------
  private extractUserAndToken(res: RawAuthResponse): {
    user: CurrentUser | null;
    token: string | null;
  } {
    const token = res?.data?.token || res?.token || null;
    const user = res?.data?.user || res?.user || null;
    return { user, token };
  }

  // --------------------------
  // SAVE TOKEN + USER
  // --------------------------
  private saveAuth(user: CurrentUser, token: string) {
    localStorage.setItem(this.tokenKey, token);
    localStorage.setItem(this.userKey, JSON.stringify(user));
    this._currentUser$.next(user);
  }

  // --------------------------
  // TOKEN FOR INTERCEPTOR
  // --------------------------
  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  // --------------------------
  // LOGOUT
  // --------------------------
  logout(): void {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.userKey);
    this._currentUser$.next(null);
  }
}
