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

  today = '';

  loading = true;
  errorMsg = '';
  greeting = '';
  userName = 'there';

  constructor(private habitApi: HabitApiService) {}

  ngOnInit(): void {
    this.today = this.getDayString(new Date());
    this.loadUser();
    this.setGreeting();
    this.loadHabits();
  }

  // 👉 Make yyyy-mm-dd in LOCAL timezone
  private getDayString(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  // 🔹 Load user from localStorage
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

  // 🔹 Greeting system
  private setGreeting(): void {
    const hour = new Date().getHours();

    if (hour < 12) this.greeting = 'Good morning';
    else if (hour < 17) this.greeting = 'Good afternoon';
    else if (hour < 22) this.greeting = 'Good evening';
    else this.greeting = 'Good night';
  }

  // 🔹 Load all habits
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

  private normalize(d: string): string {
    return this.getDayString(new Date(d));
  }

  //  NEW: CLEAN & SIMPLE DAILY COMPLETION RATE
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
    let maxStreak = 0;

    for (const habit of this.habits) {
      const dates = (habit.completedDates || []).map((d: string) =>
        this.normalize(d)
      );

      // ✔ Count how many habits done today
      if (dates.includes(this.today)) todayCount++;

      // ✔ Compute longest streak
      const streak = this.computeStreak(dates);
      if (streak > maxStreak) maxStreak = streak;
    }

    // Save today’s stats
    this.todayCompletions = todayCount;
    this.todaysCompletions = todayCount;
    this.bestStreak = maxStreak;

    //  NEW formula: simple daily rate
    // completion = todayCompleted / totalHabits * 100
    const rawRate = (todayCount / this.totalHabits) * 100;

    this.completionRate = Math.round(rawRate);

    /*
     OLD formula (confusing – always shows 3%)
    const days = 30;
    const possible = this.totalHabits * days;
    const rawRateOld = possible > 0 ? (totalCompletions / possible) * 100 : 0;
    this.completionRate = Math.round(rawRateOld);
    */
  }

  // 🔹 Compute streak
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
