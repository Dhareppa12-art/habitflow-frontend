import { Component, OnInit } from '@angular/core';
import { HabitApiService, BackendHabit } from '../services/habit-api.service';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {

  habits: BackendHabit[] = [];

  todayCompletions = 0;
  bestStreak = 0;
  completionRate = 0;

  totalHabits = 0;
  todaysCompletions = 0;

  today = '';   // we'll set in ngOnInit as local IST date

  loading = true;
  errorMsg = '';
  greeting = '';
  userName = 'there';  // default

  constructor(private habitApi: HabitApiService) {}

  ngOnInit(): void {
    this.today = this.getDayString(new Date()); // local (IST) date only
    this.loadUser();
    this.setGreeting();
    this.loadHabits();
  }

  // 👉 Build yyyy-mm-dd from a Date using LOCAL calendar (IST)
  private getDayString(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  // 🔹 Load user data from localStorage (name/email)
  private loadUser(): void {
    try {
      const rawUser =
        localStorage.getItem('hf_user') ||
        localStorage.getItem('user');

      if (rawUser) {
        const u = JSON.parse(rawUser);
        this.userName = u.name || u.email || 'there';
      }
    } catch {
      this.userName = 'there';
    }
  }

  // 🔹 Dynamic greeting: morning / afternoon / evening / night
  private setGreeting(): void {
    const hour = new Date().getHours();

    if (hour < 12) this.greeting = 'Good morning';
    else if (hour < 17) this.greeting = 'Good afternoon';
    else if (hour < 22) this.greeting = 'Good evening';
    else this.greeting = 'Good night';
  }

  // 🔹 Load all habits from backend
  private loadHabits() {
    this.loading = true;

    this.habitApi.getMyHabits().subscribe({
      next: (res: { habits: BackendHabit[] }) => {
        this.habits = res.habits || [];
        this.loading = false;
        this.calculateStats();
      },
      error: () => {
        this.loading = false;
        this.errorMsg = 'Failed to load habits.';
      }
    });
  }

  // Normalize date to LOCAL yyyy-mm-dd (IST)
  private normalize(d: string): string {
    return this.getDayString(new Date(d));
  }

  // 🔹 Calculate today's completions + streak + completion rate
  private calculateStats() {
    this.totalHabits = this.habits.length;

    if (this.totalHabits === 0) {
      this.todayCompletions = 0;
      this.todaysCompletions = 0;
      this.bestStreak = 0;
      this.completionRate = 0;
      return;
    }

    let todayCount = 0;
    let streakMax = 0;
    let totalCompletions = 0;

    for (const habit of this.habits) {
      const dates = (habit.completedDates || []).map((d: string) =>
        this.normalize(d)
      );

      // ✅ LOCAL today's completions
      if (dates.includes(this.today)) todayCount++;

      // longest streak
      const streak = this.computeStreak(dates);
      if (streak > streakMax) streakMax = streak;

      // total completed for completion rate
      totalCompletions += dates.length;
    }

    this.todayCompletions = todayCount;
    this.todaysCompletions = todayCount; // UI uses this
    this.bestStreak = streakMax;

    // Completion Rate (last 30 days)
    const days = 30;
    const possible = this.totalHabits * days;
    const rawRate = possible > 0 ? (totalCompletions / possible) * 100 : 0;

    this.completionRate = Math.round(rawRate);
  }

 
  private computeStreak(dates: string[]): number {
    if (!dates.length) return 0;

    const sorted = [...dates].sort(); 
    let streak = 0;

    let current = new Date();
    while (true) {
      const check = this.getDayString(current); 
      if (!sorted.includes(check)) break;

      streak++;
      current.setDate(current.getDate() - 1);
    }

    return streak;
  }
}
