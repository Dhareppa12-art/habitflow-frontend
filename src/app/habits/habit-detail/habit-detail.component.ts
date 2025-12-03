import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { HabitApiService, BackendHabit } from 'src/app/services/habit-api.service';

interface Last7Day {
  label: string;     // Mon, Tue...
  iso: string;       // yyyy-mm-dd (local calendar)
  completed: boolean;
}

@Component({
  selector: 'app-habit-detail',
  templateUrl: './habit-detail.component.html',
  styleUrls: ['./habit-detail.component.css'],
})
export class HabitDetailComponent implements OnInit {
  habitId!: string;
  habit: BackendHabit | null = null;

  loading = true;
  errorMsg = '';

  currentStreak = 0;
  totalCompletions = 0;
  lastCompletedRaw: string | null = null; // ISO from backend
  last7Days: Last7Day[] = [];

  doneToday = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private habitApi: HabitApiService
  ) {}

  ngOnInit(): void {
    this.habitId = this.route.snapshot.paramMap.get('id') || '';
    if (!this.habitId) {
      this.errorMsg = 'Invalid habit id';
      this.loading = false;
      return;
    }

    this.loadHabit();
  }

  private toLocalDateOnly(d: Date): string {
    const year = d.getFullYear();
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const day = d.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  /** Normalize backend ISO -> yyyy-mm-dd using LOCAL calendar */
  private normalizeDateStr(dateStr: string): string {
    const d = new Date(dateStr);
    return this.toLocalDateOnly(d);
  }

  private loadHabit(): void {
    this.loading = true;
    this.errorMsg = '';

    this.habitApi.getHabitById(this.habitId).subscribe({
      next: (res) => {
        this.habit = res.habit;
        this.buildStats();
        this.loading = false;
      },
      error: (err) => {
        console.error('LOAD HABIT ERROR', err);
        this.errorMsg = err?.error?.message || 'Failed to load habit';
        this.loading = false;
      },
    });
  }

  private buildStats(): void {
    if (!this.habit) return;

    const completedDates = this.habit.completedDates || [];

    // Total completions
    this.totalCompletions = completedDates.length;

    // Normalize all completion dates to yyyy-mm-dd (local)
    const normalized = completedDates.map((d) => this.normalizeDateStr(d));
    const completedSet = new Set(normalized);

    // Today (local calendar)
    const todayIso = this.toLocalDateOnly(new Date());

    // Done today?
    this.doneToday = completedSet.has(todayIso);

    // Last completed (raw ISO for date pipe)
    if (completedDates.length > 0) {
      const sorted = [...completedDates].sort();
      this.lastCompletedRaw = sorted[sorted.length - 1];
    } else {
      this.lastCompletedRaw = null;
    }

    // Streak calculation (same idea as list)
    let streak = 0;
    const current = new Date();

    while (true) {
      const iso = this.toLocalDateOnly(current);
      if (!completedSet.has(iso)) break;
      streak++;
      current.setDate(current.getDate() - 1);
    }
    this.currentStreak = streak;

    // Last 7 days strip
    this.last7Days = [];
    const labels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    const base = new Date(); // today
    for (let offset = 6; offset >= 0; offset--) {
      const d = new Date(base);
      d.setDate(base.getDate() - offset);
      const iso = this.toLocalDateOnly(d);
      const label = labels[d.getDay()];

      this.last7Days.push({
        label,
        iso,
        completed: completedSet.has(iso),
      });
    }
  }


  goBack(): void {
    this.router.navigate(['/app/habits']);
  }

  markDoneToday(): void {
    if (!this.habit || this.doneToday) return;

    this.habitApi.checkInHabit(this.habit._id).subscribe({
      next: () => {
        // Re-load from backend so numbers + last7 days are correct
        this.loadHabit();
      },
      error: (err) => {
        console.error('CHECK-IN ERROR', err);
        this.errorMsg =
          err?.error?.message || 'Failed to mark habit as done today';
      },
    });
  }

  deleteHabit(): void {
    if (!this.habit) return;
    if (!confirm('Are you sure you want to delete this habit?')) return;

    this.habitApi.deleteHabit(this.habit._id).subscribe({
      next: () => {
        this.router.navigate(['/app/habits']);
      },
      error: (err) => {
        console.error('DELETE HABIT ERROR', err);
        this.errorMsg = err?.error?.message || 'Failed to delete habit';
      },
    });
  }
}
