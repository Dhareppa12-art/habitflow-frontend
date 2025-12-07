import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { HabitApiService, BackendHabit } from 'src/app/services/habit-api.service';

// 🔥 Extend BackendHabit with reminder fields (for template)
type HabitListHabit = BackendHabit & {
  reminderEnabled?: boolean;
  reminderTime?: string; // "HH:mm"
  timeOfDay?: string;    // fallback/old field
};

@Component({
  selector: 'app-habit-list',
  templateUrl: './habit-list.component.html',
  styleUrls: ['./habit-list.component.css']
})
export class HabitListComponent implements OnInit {

  habits: HabitListHabit[] = [];
  loading = true;
  errorMsg = '';
  today = '';   // local date key: YYYY-MM-DD

  constructor(
    private habitApi: HabitApiService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.today = this.makeLocalDateKey(new Date());
    this.loadHabits();
  }

  // ---------- Load from backend ----------
  loadHabits() {
    this.loading = true;
    this.errorMsg = '';

    this.habitApi.getMyHabits().subscribe({
      next: (res) => {
        this.habits = (res as any).habits || [];
        this.loading = false;
      },
      error: (err) => {
        console.error('LOAD HABITS ERROR', err);
        this.loading = false;
        this.errorMsg = err?.error?.message || 'Something went wrong while loading habits.';
      }
    });
  }

  // ---------- DATE HELPERS (LOCAL TIME) ----------

  /** Turn a Date into local YYYY-MM-DD (no UTC shift) */
  private makeLocalDateKey(d: Date): string {
    const y = d.getFullYear();
    const m = (d.getMonth() + 1).toString().padStart(2, '0');
    const day = d.getDate().toString().padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  /** Normalise backend ISO string into local YYYY-MM-DD */
  private normalizeDateStr(dateStr: string): string {
    const d = new Date(dateStr);
    return this.makeLocalDateKey(d);
  }

  isCompletedToday(habit: HabitListHabit): boolean {
    return (
      habit.completedDates?.some(
        (d) => this.normalizeDateStr(d) === this.today
      ) ?? false
    );
  }

  getStreak(habit: HabitListHabit): number {
    if (!habit.completedDates || habit.completedDates.length === 0)
      return 0;

    const dates = [...new Set(
      habit.completedDates.map((d) => this.normalizeDateStr(d))
    )].sort();  // YYYY-MM-DD sorts correctly

    let streak = 0;
    let current = new Date();

    while (true) {
      const currentKey = this.makeLocalDateKey(current);
      if (!dates.includes(currentKey)) break;

      streak++;
      current.setDate(current.getDate() - 1);
    }

    return streak;
  }

  // ---------- Actions ----------

  markDone(habit: HabitListHabit, event: Event) {
    event.stopPropagation();

    if (this.isCompletedToday(habit)) {
      alert('Already marked done for today.');
      return;
    }

    this.habitApi.checkInHabit(habit._id).subscribe({
      next: (res) => {
        const updated = (res as any).habit as HabitListHabit;
        const idx = this.habits.findIndex(h => h._id === updated._id);
        if (idx !== -1) {
          this.habits[idx] = updated;   // 🔥 update array → Angular re-renders
        }
      },
      error: (err) => {
        console.error('CHECK-IN ERROR', err);
        alert(err?.error?.message || 'Failed to mark habit as done.');
      }
    });
  }

  deleteHabit(habit: HabitListHabit, event: Event) {
    event.stopPropagation();

    if (!confirm('Delete this habit?')) return;

    this.habitApi.deleteHabit(habit._id).subscribe({
      next: () => {
        this.habits = this.habits.filter(h => h._id !== habit._id);
      },
      error: (err) => {
        console.error('DELETE HABIT ERROR', err);
        alert(err?.error?.message || 'Failed to delete habit.');
      }
    });
  }

  openHabit(habit: HabitListHabit) {
    this.router.navigate(['/app/habits', habit._id]);
  }

  goToNewHabit() {
    this.router.navigate(['/app/habits/new']);
  }
}
