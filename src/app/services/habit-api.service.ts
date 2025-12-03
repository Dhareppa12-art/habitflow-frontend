import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { AuthService, CurrentUser } from '../core/auth.service';

// This matches your BACKEND Habit model
export interface BackendHabit {
  _id: string;
  user: string;
  title: string;
  description?: string;
  frequency: 'daily' | 'weekly' | 'custom';
  startDate: string;        // ISO date string from backend
  isActive: boolean;
  completedDates: string[]; // ISO date strings
  createdAt?: string;
  updatedAt?: string;
}

export interface HabitStats {
  totalHabits: number;
  activeHabits: number;
  totalCheckIns: number;
  checkInsToday: number;
}

@Injectable({
  providedIn: 'root',
})
export class HabitApiService {
  private apiUrl = `${environment.apiUrl}/habits`;

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  /** Helper: get currently logged-in user's id from AuthService */
  private getCurrentUserId(): string {
    const user: CurrentUser | null = this.authService.getCurrentUser();
    if (!user || !user.id) {
      throw new Error('User not logged in');
    }
    return user.id;
  }

  /** GET /api/habits/user/:userId */
  getMyHabits(): Observable<{ habits: BackendHabit[] }> {
    const userId = this.getCurrentUserId();
    return this.http.get<{ habits: BackendHabit[] }>(
      `${this.apiUrl}/user/${userId}`
    );
  }

  /** POST /api/habits/create */
  createHabit(data: {
    title: string;
    description?: string;
    frequency?: 'daily' | 'weekly' | 'custom';
    startDate?: string;
  }): Observable<{ message: string; habit: BackendHabit }> {
    return this.http.post<{ message: string; habit: BackendHabit }>(
      `${this.apiUrl}/create`,
      data
    );
  }

  /** PUT /api/habits/update/:habitId */
  updateHabit(
    habitId: string,
    data: Partial<BackendHabit>
  ): Observable<{ message: string; habit: BackendHabit }> {
    return this.http.put<{ message: string; habit: BackendHabit }>(
      `${this.apiUrl}/update/${habitId}`,
      data
    );
  }

  /** DELETE /api/habits/delete/:habitId */
  deleteHabit(habitId: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(
      `${this.apiUrl}/delete/${habitId}`
    );
  }

  /** POST /api/habits/:habitId/check-in */
  checkInHabit(
    habitId: string
  ): Observable<{ message: string; habit: BackendHabit }> {
    return this.http.post<{ message: string; habit: BackendHabit }>(
      `${this.apiUrl}/${habitId}/check-in`,
      {}
    );
  }

  /** GET /api/habits/stats/overview */
  getStats(): Observable<HabitStats> {
    return this.http.get<HabitStats>(`${this.apiUrl}/stats/overview`);
  }

  /** GET /api/habits/one/:habitId */
  getHabitById(habitId: string): Observable<{ habit: BackendHabit }> {
    return this.http.get<{ habit: BackendHabit }>(
      `${this.apiUrl}/one/${habitId}`
    );
  }
}
