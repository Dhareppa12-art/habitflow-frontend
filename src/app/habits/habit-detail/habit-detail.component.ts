import {
  Component,
  OnInit,
  TemplateRef,
  ViewChild,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';

import {
  HabitApiService,
  BackendHabit,
} from 'src/app/services/habit-api.service';

interface Last7Day {
  label: string; // Mon, Tue...
  iso: string; // yyyy-mm-dd
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
  lastCompletedRaw: string | null = null;
  last7Days: Last7Day[] = [];

  doneToday = false;

  // 🔥 Dialog Template
  @ViewChild('deleteHabitDialog') deleteHabitDialog!: TemplateRef<any>;
  private deleteDialogRef?: MatDialogRef<any>;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private habitApi: HabitApiService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.habitId = this.route.snapshot.paramMap.get('id') || '';
    if (!this.habitId) {
      this.errorMsg = 'Invalid habit ID';
      this.loading = false;
      return;
    }
    this.loadHabit();
  }

  private toLocalDateOnly(d: Date): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

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
        this.errorMsg = err?.error?.message || 'Failed to load habit.';
        this.loading = false;
      },
    });
  }

  private buildStats(): void {
    if (!this.habit) return;

    const completedDates = this.habit.completedDates || [];
    const normalized = completedDates.map((d) => this.normalizeDateStr(d));
    const completedSet = new Set(normalized);
    const todayIso = this.toLocalDateOnly(new Date());

    this.doneToday = completedSet.has(todayIso);
    this.totalCompletions = completedDates.length;

    if (completedDates.length > 0) {
      const sorted = [...completedDates].sort();
      this.lastCompletedRaw = sorted[sorted.length - 1];
    }

    // streak
    let streak = 0;
    const current = new Date();
    while (true) {
      const key = this.toLocalDateOnly(current);
      if (!completedSet.has(key)) break;
      streak++;
      current.setDate(current.getDate() - 1);
    }
    this.currentStreak = streak;

    // last 7 days
    this.last7Days = [];
    const labels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const base = new Date();
    for (let offset = 6; offset >= 0; offset--) {
      const d = new Date(base);
      d.setDate(base.getDate() - offset);
      const iso = this.toLocalDateOnly(d);
      this.last7Days.push({
        label: labels[d.getDay()],
        iso,
        completed: completedSet.has(iso),
      });
    }
  }

  goBack() {
    this.router.navigate(['/app/habits']);
  }

  markDoneToday() {
    if (!this.habit || this.doneToday) return;

    this.habitApi.checkInHabit(this.habit._id).subscribe({
      next: () => this.loadHabit(),
      error: (err) => {
        this.errorMsg =
          err?.error?.message || 'Failed to mark habit as done.';
      },
    });
  }

  // 🔥 Replace confirm() with Material dialog
  openDeleteHabitDialog() {
    this.deleteDialogRef = this.dialog.open(this.deleteHabitDialog, {
      width: '380px',
    });
  }

  confirmDeleteHabit() {
    if (!this.habit) return;

    this.habitApi.deleteHabit(this.habit._id).subscribe({
      next: () => {
        this.snackBar.open('Habit deleted', 'Close', { duration: 2500 });
        this.closeDeleteHabitDialog();
        this.router.navigate(['/app/habits']);
      },
      error: (err) => {
        this.errorMsg =
          err?.error?.message || 'Failed to delete habit.';
        this.closeDeleteHabitDialog();
      },
    });
  }

  closeDeleteHabitDialog() {
    this.deleteDialogRef?.close();
  }
}
