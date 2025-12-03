// src/app/services/profile-api.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface BackendProfile {
  _id: string;
  name: string;
  email: string;
  location?: string;
  phone?: string;
  avatar?: string;

  emailReminders?: boolean;
  dailyReminder?: boolean;
  weeklySummary?: boolean;

  timezone?: string;
  weekStart?: string;
  themePreference?: 'light' | 'dark' | 'system';

  createdAt?: string;
  updatedAt?: string;
}

export interface ProfileResponse {
  success: boolean;
  data: BackendProfile;
  message?: string;
}

@Injectable({
  providedIn: 'root',
})
export class ProfileApiService {
  private baseUrl = `${environment.apiUrl}/profile`;

  constructor(private http: HttpClient) {}

  // GET /api/profile
  getProfile(): Observable<ProfileResponse> {
    return this.http.get<ProfileResponse>(this.baseUrl);
  }

  // PUT /api/profile
  updateProfile(payload: Partial<BackendProfile>): Observable<ProfileResponse> {
    return this.http.put<ProfileResponse>(this.baseUrl, payload);
  }
}
