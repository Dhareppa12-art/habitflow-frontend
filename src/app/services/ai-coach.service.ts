// src/app/services/ai-coach.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class AiCoachService {
  private baseUrl = `${environment.apiUrl}/ai`;

  constructor(private http: HttpClient) {}

  askCoach(message: string): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/coach`, { message });
  }
}
