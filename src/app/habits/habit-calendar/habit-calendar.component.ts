import { Component, OnInit } from '@angular/core';
import { HabitApiService, BackendHabit } from 'src/app/services/habit-api.service';

interface CalendarDay {
  date: Date;
  dateStr: string;          // yyyy-mm-dd (local)
  inCurrentMonth: boolean;
  isToday: boolean;
  totalCompletions: number;
  completedHabits: BackendHabit[];
}

@Component({
  selector: 'app-habit-calendar',
  templateUrl: './habit-calendar.component.html',
  styleUrls: ['./habit-calendar.component.css']
})
export class HabitCalendarComponent implements OnInit {

  currentMonth!: number; // 0-11
  currentYear!: number;
  monthLabel = '';

  weeks: CalendarDay[][] = [];

  loading = true;
  errorMsg = '';

  // ---- Summary stats for this month ----
  monthTotalCompletions = 0;
  monthActiveDays = 0;
  monthBestDayCount = 0;
  hasAnyCompletion = false;

  constructor(private habitApi: HabitApiService) {}

  ngOnInit(): void {
    const today = new Date();
    this.currentMonth = today.getMonth();
    this.currentYear = today.getFullYear();
    this.buildCalendar();
  }

  // Main builder: fetch habits from backend + build

  private buildCalendar(): void {
    this.loading = true;
    this.errorMsg = '';

    this.habitApi.getMyHabits().subscribe({
      next: (res) => {
        const habits = res.habits || [];
        this.buildCalendarFromHabits(habits);
        this.loading = false;
      },
      error: (err) => {
        console.error('CALENDAR LOAD ERROR', err);
        this.errorMsg = err?.error?.message || 'Failed to load calendar data';
        // reset state so UI doesn’t show stale data
        this.weeks = [];
        this.monthTotalCompletions = 0;
        this.monthActiveDays = 0;
        this.monthBestDayCount = 0;
        this.hasAnyCompletion = false;
        this.loading = false;
      }
    });
  }


  private buildCalendarFromHabits(habits: BackendHabit[]): void {
    // Map: dateStr (yyyy-mm-dd) -> list of habits completed that day
    const completionMap = new Map<string, BackendHabit[]>();

    habits.forEach((habit) => {
      (habit.completedDates || []).forEach((raw) => {
        const dateStr = this.normalizeDateStr(raw); // LOCAL yyyy-mm-dd
        const list = completionMap.get(dateStr) ?? [];
        if (!list.includes(habit)) {
          list.push(habit);
        }
        completionMap.set(dateStr, list);
      });
    });

    const firstOfMonth = new Date(this.currentYear, this.currentMonth, 1);
    const startDayOfWeek = firstOfMonth.getDay(); // 0 = Sun

    // gridStart = Sunday of the first visible row
    const gridStart = new Date(
      this.currentYear,
      this.currentMonth,
      1 - startDayOfWeek
    );

    const todayStr = this.toLocalDateString(new Date());
    const weeks: CalendarDay[][] = [];
    let cursor = new Date(gridStart);

    for (let week = 0; week < 6; week++) {
      const days: CalendarDay[] = [];

      for (let i = 0; i < 7; i++) {
        const dateStr = this.toLocalDateString(cursor);
        const inCurrentMonth = cursor.getMonth() === this.currentMonth;
        const completedHabits = completionMap.get(dateStr) ?? [];

        days.push({
          date: new Date(cursor),
          dateStr,
          inCurrentMonth,
          isToday: dateStr === todayStr,
          totalCompletions: completedHabits.length,
          completedHabits
        });

        cursor.setDate(cursor.getDate() + 1);
      }

      weeks.push(days);
    }

    this.weeks = weeks;
    this.monthLabel = firstOfMonth.toLocaleDateString(undefined, {
      month: 'long',
      year: 'numeric'
    });

    // ---- compute summary stats for this month ----
    let total = 0;
    let activeDays = 0;
    let best = 0;

    for (const week of weeks) {
      for (const day of week) {
        if (!day.inCurrentMonth) continue;

        total += day.totalCompletions;
        if (day.totalCompletions > 0) {
          activeDays++;
        }
        if (day.totalCompletions > best) {
          best = day.totalCompletions;
        }
      }
    }

    this.monthTotalCompletions = total;
    this.monthActiveDays = activeDays;
    this.monthBestDayCount = best;
    this.hasAnyCompletion = activeDays > 0;
  }

  // Navigation
 
  prevMonth(): void {
    if (this.currentMonth === 0) {
      this.currentMonth = 11;
      this.currentYear--;
    } else {
      this.currentMonth--;
    }
    this.buildCalendar();
  }

  nextMonth(): void {
    if (this.currentMonth === 11) {
      this.currentMonth = 0;
      this.currentYear++;
    } else {
      this.currentMonth++;
    }
    this.buildCalendar();
  }

 
  private toLocalDateString(d: Date): string {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`; // yyyy-mm-dd in LOCAL time
  }

  private normalizeDateStr(dateStr: string): string {
    return this.toLocalDateString(new Date(dateStr));
  }
}
