// src/app/stats/stats.component.ts
import { Component, OnInit } from '@angular/core';
import {
  HabitApiService,
  BackendHabit,
} from '../services/habit-api.service';

interface DayStat {
  label: string;
  count: number;
}

interface TopHabit {
  name: string;
  streak: string;
  total: string;
  percent: number; // 0–100
}

@Component({
  selector: 'app-stats',
  templateUrl: './stats.component.html',
  styleUrls: ['./stats.component.css'],
})
export class StatsComponent implements OnInit {
  // --------- top summary numbers (bound in HTML) ----------
  completionRate = 0; // %
  activeHabits = 0;
  bestStreak = 0;

  // --------- state ----------
  viewMode: 'week' | 'month' = 'week';
  loading = true;
  errorMsg = '';

  // --------- chart / list data ----------
  weeklyData: DayStat[] = [
    { label: 'Mon', count: 0 },
    { label: 'Tue', count: 0 },
    { label: 'Wed', count: 0 },
    { label: 'Thu', count: 0 },
    { label: 'Fri', count: 0 },
    { label: 'Sat', count: 0 },
    { label: 'Sun', count: 0 },
  ];

  monthlyData: DayStat[] = [
    { label: 'Week 1', count: 0 },
    { label: 'Week 2', count: 0 },
    { label: 'Week 3', count: 0 },
    { label: 'Week 4', count: 0 },
  ];

  topHabits: TopHabit[] = [];
  quickInsights: string[] = [];

  constructor(private habitApi: HabitApiService) {}

  ngOnInit(): void {
    this.loadStats();
  }

  // LOAD + BUILD STATS FROM BACKEND HABITS

  private loadStats(): void {
    this.loading = true;
    this.errorMsg = '';

    this.habitApi.getMyHabits().subscribe({
      next: (res) => {
        const habits = res.habits || [];
        this.buildFromHabits(habits);
        this.loading = false;
      },
      error: (err) => {
        console.error('LOAD STATS ERROR', err);
        this.errorMsg = err?.error?.message || 'Failed to load stats.';
        this.loading = false;
      },
    });
  }

  private buildFromHabits(habits: BackendHabit[]): void {
    if (!habits || habits.length === 0) {
      // nothing tracked yet → keep defaults
      this.completionRate = 0;
      this.activeHabits = 0;
      this.bestStreak = 0;
      this.weeklyData = this.weeklyData.map((d) => ({ ...d, count: 0 }));
      this.monthlyData = this.monthlyData.map((d) => ({ ...d, count: 0 }));
      this.topHabits = [];
      this.quickInsights = ['Start by creating your first habit to see stats here.'];
      return;
    }

    const activeHabits = habits.filter((h) => h.isActive !== false);
    this.activeHabits = activeHabits.length;

    // Helpers
    const today = new Date();
    const todayKey = this.toLocalDayKey(today); // yyyy-mm-dd in LOCAL time

    const last30Start = new Date();
    last30Start.setDate(today.getDate() - 29);
    last30Start.setHours(0, 0, 0, 0);

    const weekStart = this.getMonday(today); // week view: Mon–Sun
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);

    const monthYear = today.getFullYear();
    const monthIndex = today.getMonth();

    // Aggregation buckets
    const weeklyCounts = [0, 0, 0, 0, 0, 0, 0]; // Mon..Sun
    const monthlyWeekCounts = [0, 0, 0, 0]; // weeks 1–4
    let completionsLast30 = 0;

    let bestStreak = 0;
    let topHabitData: { name: string; streak: number; total: number }[] = [];

    //  How many active habits are done today?
    let todayDoneCount = 0;

    // Process each habit
    for (const habit of activeHabits) {
      const rawDates = habit.completedDates || [];
      const normalizedKeys: string[] = [];
      let totalForHabit = 0;
      let habitHasToday = false;

      for (const raw of rawDates) {
        const d = new Date(raw);
        if (isNaN(d.getTime())) continue;

        totalForHabit++;

        // LOCAL day key, ex: "2025-12-06"
        const key = this.toLocalDayKey(d);
        normalizedKeys.push(key);

        // check “done today”
        if (key === todayKey) {
          habitHasToday = true;
        }

        // last 30 days (for insights only)
        if (d >= last30Start && d <= today) {
          completionsLast30++;
        }

        // weekly chart (current week only)
        if (d >= weekStart && d <= weekEnd) {
          const wd = d.getDay(); // 0=Sun..6=Sat
          const index = this.weekdayIndexMonFirst(wd); // 0=Mon..6=Sun
          weeklyCounts[index]++;
        }

        // monthly chart – current month grouped into 4 weeks
        if (d.getFullYear() === monthYear && d.getMonth() === monthIndex) {
          const dayOfMonth = d.getDate(); // 1..31
          let bucket = Math.floor((dayOfMonth - 1) / 7); // 0..4
          if (bucket > 3) bucket = 3; // merge week5 into week4
          monthlyWeekCounts[bucket]++;
        }
      }

      const dateSet = new Set(normalizedKeys);

      // streak for this habit (using LOCAL day keys)
      const streak = this.calculateStreak(dateSet);
      if (streak > bestStreak) {
        bestStreak = streak;
      }

      topHabitData.push({
        name: habit.title,
        streak,
        total: totalForHabit,
      });

      if (habitHasToday) {
        todayDoneCount++;
      }
    }

    // NEW COMPLETION RATE: "how many active habits done today?"
    this.completionRate =
      this.activeHabits > 0
        ? Math.round((todayDoneCount / this.activeHabits) * 100)
        : 0;

    /*
      OLD 30-DAY AVERAGE (kept here as reference, not used anymore):
      const possible = this.activeHabits * 30;
      this.completionRate =
        possible > 0 ? Math.round((completionsLast30 / possible) * 100) : 0;
    */

    this.bestStreak = bestStreak;

    // build weekly / monthly arrays for template
    const weekLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    this.weeklyData = weekLabels.map((lbl, i) => ({
      label: lbl,
      count: weeklyCounts[i],
    }));

    const monthLabels = ['Week 1', 'Week 2', 'Week 3', 'Week 4'];
    this.monthlyData = monthLabels.map((lbl, i) => ({
      label: lbl,
      count: monthlyWeekCounts[i],
    }));

    // Top habits: sort by total completions desc
    topHabitData.sort((a, b) => b.total - a.total);
    const top = topHabitData.slice(0, 4);
    const maxTotal = top.length ? top[0].total : 0;

    this.topHabits = top.map((h) => ({
      name: h.name,
      streak: `${h.streak}-day streak`,
      total: `${h.total} total completions`,
      percent: maxTotal > 0 ? Math.round((h.total / maxTotal) * 100) : 0,
    }));

    // Quick insights (still use completionsLast30 for long-term text)
    this.quickInsights = this.buildInsights(
      completionsLast30,
      weeklyCounts,
      topHabitData,
      bestStreak
    );
  }
  // INSIGHTS + HELPERS
  private buildInsights(
    completionsLast30: number,
    weeklyCounts: number[],
    topHabitData: { name: string; streak: number; total: number }[],
    bestStreak: number
  ): string[] {
    const insights: string[] = [];

    if (completionsLast30 === 0) {
      insights.push('No check-ins yet in the last 30 days.');
      return insights;
    }

    // 1) Most consistent weekday
    const weekLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const maxIdx = weeklyCounts.reduce(
      (bestIdx, val, idx, arr) => (val > arr[bestIdx] ? idx : bestIdx),
      0
    );
    if (weeklyCounts[maxIdx] > 0) {
      insights.push(`You are most consistent on ${weekLabels[maxIdx]}.`);
    }

    // 2) Best habit by total
    const sortedByTotal = [...topHabitData].sort((a, b) => b.total - a.total);
    if (sortedByTotal.length && sortedByTotal[0].total > 0) {
      const best = sortedByTotal[0];
      insights.push(
        `"${best.name}" is your most completed habit with ${best.total} check-ins.`
      );
    }

    // 3) Longest streak
    if (bestStreak > 0) {
      insights.push(`Your longest streak so far is ${bestStreak} days. Keep it going!`);
    }

    return insights;
  }

  // 🔹 LOCAL day key: yyyy-mm-dd
  private toLocalDayKey(d: Date): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  private getMonday(d: Date): Date {
    const day = d.getDay(); // 0(Sun)..6(Sat)
    const diff = (day + 6) % 7; // how many days since Monday
    const monday = new Date(d);
    monday.setDate(d.getDate() - diff);
    monday.setHours(0, 0, 0, 0);
    return monday;
  }

  private weekdayIndexMonFirst(jsDay: number): number {
    // jsDay: 0(Sun)..6(Sat) -> 0(Mon)..6(Sun)
    return jsDay === 0 ? 6 : jsDay - 1;
  }

  private calculateStreak(completedSet: Set<string>): number {
    let streak = 0;
    const cursor = new Date();

    while (true) {
      const key = this.toLocalDayKey(cursor);
      if (!completedSet.has(key)) break;
      streak++;
      cursor.setDate(cursor.getDate() - 1);
    }

    return streak;
  }

  // view toggle used by template
  setViewMode(mode: 'week' | 'month'): void {
    if (this.viewMode === mode) return;
    this.viewMode = mode;
  }
}
