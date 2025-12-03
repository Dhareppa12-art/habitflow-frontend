import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Habit } from '../models/habit.model';

@Injectable({
  providedIn: 'root'
})
export class MockHabitService {

 private _habits = new BehaviorSubject<Habit[]>([
  {
    id: 1,
    title: 'Morning Workout',
    description: '30 minutes exercise',
    frequency: 'daily',
    timeOfDay: '07:00',
    reminderEnabled: true,
    createdAt: new Date().toISOString(),
    isActive: true,
    completedDates: []
  },
  {
    id: 2,
    title: 'Read a Book',
    description: 'Read 10 pages',
    frequency: 'daily',
    timeOfDay: '21:00',
    reminderEnabled: false,
    createdAt: new Date().toISOString(),
    isActive: true,
    completedDates: []
  },
  {
    id: 3,
    title: 'Drink Water',
    description: 'Drink 8 glasses of water',
    frequency: 'daily',
    timeOfDay: '',
    reminderEnabled: false,
    createdAt: new Date().toISOString(),
    isActive: true,
    completedDates: []
  },
  {
    id: 4,
    title: 'Evening Walk',
    description: '15 minute walk after dinner',
    frequency: 'daily',
    timeOfDay: '20:30',
    reminderEnabled: false,
    createdAt: new Date().toISOString(),
    isActive: true,
    completedDates: []
  },
  {
    id: 5,
    title: 'Meditation',
    description: '10 minutes meditation',
    frequency: 'daily',
    timeOfDay: '06:30',
    reminderEnabled: false,
    createdAt: new Date().toISOString(),
    isActive: true,
    completedDates: []
  },
  {
    id: 6,
    title: 'Learn Something New',
    description: 'Spend 20 minutes learning',
    frequency: 'daily',
    timeOfDay: '',
    reminderEnabled: false,
    createdAt: new Date().toISOString(),
    isActive: true,
    completedDates: []
  }
]);


  habits$: Observable<Habit[]> = this._habits.asObservable();

  getHabits(): Habit[] {
    return this._habits.getValue();
  }

  addHabit(habit: Omit<Habit, 'id' | 'createdAt' | 'isActive'>) {
    const list = this.getHabits();
    const newHabit: Habit = {
      ...habit,
      id: list.length ? Math.max(...list.map(h => h.id)) + 1 : 1,
      createdAt: new Date().toISOString(),
      isActive: true
    };
    this._habits.next([...list, newHabit]);
  }

  updateHabit(id: number, changes: Partial<Habit>) {
    const updated = this.getHabits().map(h =>
      h.id === id ? { ...h, ...changes } : h
    );
    this._habits.next(updated);
  }

  deleteHabit(id: number) {
    const filtered = this.getHabits().filter(h => h.id !== id);
    this._habits.next(filtered);
  }
}
