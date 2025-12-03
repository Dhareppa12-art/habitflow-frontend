// src/app/core/habit.service.ts
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface Habit {
  id: number;

  // UI-required fields
  title: string;
  description?: string;

  frequency?: string;   // daily, weekly
  timeOfDay?: string;   // "7:00 AM"

  color?: string;
}

export interface Completion {
  habitId: number;
  dateStr: string; // yyyy-mm-dd
}

@Injectable({
  providedIn: 'root',
})
export class HabitService {
  private habitsSubject = new BehaviorSubject<Habit[]>(INITIAL_HABITS);
  private completionsSubject = new BehaviorSubject<Completion[]>([]);

  /** Utility: get date string for today + offset (in days) */
  static isoDateFor(offsetDays: number): string {
    const d = new Date();
    d.setDate(d.getDate() + offsetDays);
    return d.toISOString().split('T')[0];
  }

  /** Observable list of habits */
  getHabits$(): Observable<Habit[]> {
    return this.habitsSubject.asObservable();
  }

  /** Observable list of all completions */
  getCompletions$(): Observable<Completion[]> {
    return this.completionsSubject.asObservable();
  }

  /** Get habit by ID (used in habit-detail page) */
  getHabitById(id: number): Habit | undefined {
    return this.habitsSubject.getValue().find(h => h.id === id);
  }

  /** Mark a habit as completed on a date */
  complete(habitId: number, dateStr: string): void {
    const current = this.completionsSubject.getValue();
    if (!current.some((c) => c.habitId === habitId && c.dateStr === dateStr)) {
      this.completionsSubject.next([...current, { habitId, dateStr }]);
    }
  }

  /** Unmark completion */
  uncomplete(habitId: number, dateStr: string): void {
    const current = this.completionsSubject.getValue();
    this.completionsSubject.next(
      current.filter(
        (c) => !(c.habitId === habitId && c.dateStr === dateStr)
      )
    );
  }

  /** Is this habit completed on that date? */
  isCompleted(habitId: number, dateStr: string): boolean {
    return this.completionsSubject
      .getValue()
      .some((c) => c.habitId === habitId && c.dateStr === dateStr);
  }

  /** Get completions for a habit between dates */
  getCompletionsForHabit(
    habitId: number,
    from: string,
    to: string
  ): Completion[] {
    const all = this.completionsSubject.getValue();
    return all.filter(
      (c) =>
        c.habitId === habitId &&
        c.dateStr >= from &&
        c.dateStr <= to
    );
  }

  /** Calculate streak up to today */
  calculateStreak(habitId: number): number {
    const completedDates = this.completionsSubject
      .getValue()
      .filter((c) => c.habitId === habitId)
      .map((c) => c.dateStr);

    if (completedDates.length === 0) return 0;

    let streak = 0;
    let current = new Date();

    while (true) {
      const currentStr = HabitService.isoDateFor(-streak);
      if (!completedDates.includes(currentStr)) break;
      streak++;
      current.setDate(current.getDate() - 1);
    }

    return streak;
  }

  /** Delete habit + its completions */
  deleteHabit(id: number): void {
    const habits = this.habitsSubject.getValue();
    this.habitsSubject.next(habits.filter((h) => h.id !== id));

    const comps = this.completionsSubject.getValue();
    this.completionsSubject.next(
      comps.filter((c) => c.habitId !== id)
    );
  }
}

const INITIAL_HABITS: Habit[] = [
  {
    id: 1,
    title: 'Drink Water',
    description: '8 glasses a day',
    frequency: 'daily',
    timeOfDay: '8:00 AM',
    color: '#4F46E5',
  },
  {
    id: 2,
    title: 'Meditate',
    description: '10 minutes mindfulness',
    frequency: 'daily',
    timeOfDay: '7:30 AM',
    color: '#EC4899',
  },
  {
    id: 3,
    title: 'Reading',
    description: 'Read 20 pages',
    frequency: 'daily',
    timeOfDay: '9:00 PM',
    color: '#22C55E',
  },
  {
    id: 4,
    title: 'Cycling',
    description: '30 minutes ride',
    frequency: 'weekly',
    timeOfDay: '6:00 AM',
    color: '#F97316',
  },
];
