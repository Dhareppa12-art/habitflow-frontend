import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { HabitApiService } from 'src/app/services/habit-api.service';

interface HabitFormModel {
  id?: string;
  title: string;
  description?: string;
  frequency: 'daily' | 'weekly' | 'custom';
  days: number[];          // 0-6 for Sun–Sat (UI only for now)
  timeOfDay?: string;      // UI only for now
  reminder: boolean;       // maps to reminderEnabled
}

// 🔹 For AI-style suggestions
interface HabitSuggestion {
  id: number;
  title: string;
  description: string;
  category: 'Health' | 'Learning' | 'Mindfulness' | 'Productivity';
  frequency: HabitFormModel['frequency'];
  timeOfDay?: string;
  days?: number[];
  reminder?: boolean;
}

@Component({
  selector: 'app-habit-form',
  templateUrl: './habit-form.component.html',
  styleUrls: ['./habit-form.component.css'],
})
export class HabitFormComponent implements OnInit {
  model: HabitFormModel = {
    title: '',
    description: '',
    frequency: 'daily',
    days: [],
    timeOfDay: '',
    reminder: false,
  };

  isEdit = false;          // (we will use this later for edit mode)
  isSubmitting = false;
  errorMsg = '';

  // 🔹 All available suggestions
  allSuggestions: HabitSuggestion[] = [
    {
      id: 1,
      title: 'Morning Workout',
      description: '30 minutes of light exercise after waking up.',
      category: 'Health',
      frequency: 'daily',
      timeOfDay: '07:00',
      days: [1, 2, 3, 4, 5],
      reminder: true,
    },
    {
      id: 2,
      title: 'Read 10 Pages',
      description: 'Read any book for at least 10 pages.',
      category: 'Learning',
      frequency: 'daily',
      timeOfDay: '21:00',
      days: [0, 1, 2, 3, 4, 5, 6],
      reminder: true,
    },
    {
      id: 3,
      title: 'Evening Walk',
      description: '15-minute walk after dinner.',
      category: 'Health',
      frequency: 'daily',
      timeOfDay: '20:00',
      days: [0, 2, 4, 6],
      reminder: true,
    },
    {
      id: 4,
      title: 'Meditation',
      description: '10 minutes of quiet meditation.',
      category: 'Mindfulness',
      frequency: 'daily',
      timeOfDay: '06:30',
      days: [1, 3, 5],
      reminder: false,
    },
    {
      id: 5,
      title: 'Plan Tomorrow',
      description: 'Spend 5 minutes planning tomorrow’s tasks.',
      category: 'Productivity',
      frequency: 'daily',
      timeOfDay: '22:00',
      days: [0, 1, 2, 3, 4],
      reminder: false,
    },
  ];

  // 🔹 What we actually display in UI
  suggestedHabits: HabitSuggestion[] = [];

  constructor(
    private habitApi: HabitApiService,   // ✅ real backend service
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    // later we can use :id for edit mode
    // const id = this.route.snapshot.paramMap.get('id');

    // Show first 4 suggestions for now
    this.suggestedHabits = this.allSuggestions.slice(0, 4);
  }

  // --- Day selection helpers ---

  toggleDay(dayIndex: number): void {
    if (!this.model.days) {
      this.model.days = [];
    }

    if (this.model.days.includes(dayIndex)) {
      this.model.days = this.model.days.filter((d) => d !== dayIndex);
    } else {
      this.model.days = [...this.model.days, dayIndex];
    }
  }

  isDaySelected(dayIndex: number): boolean {
    return this.model.days?.includes(dayIndex) ?? false;
  }

  // 🔹 User clicks "Use this habit" from suggestions
  useSuggestion(suggestion: HabitSuggestion): void {
    this.model.title = suggestion.title;
    this.model.description = suggestion.description;

    if (suggestion.frequency) {
      this.model.frequency = suggestion.frequency;
    }

    if (suggestion.timeOfDay) {
      this.model.timeOfDay = suggestion.timeOfDay;
    }

    if (suggestion.days) {
      this.model.days = [...suggestion.days];
    }

    if (typeof suggestion.reminder === 'boolean') {
      this.model.reminder = suggestion.reminder;
    }
  }

  // --- Form submission -> REAL BACKEND ---

  onSubmit(): void {
    this.errorMsg = '';

    const title = this.model.title?.trim();
    if (!title) {
      this.errorMsg = 'Title is required.';
      return;
    }

    this.isSubmitting = true;

    // 🔥 Call backend /api/habits/create (HabitApiService)
    this.habitApi
      .createHabit({
        title,
        description: this.model.description?.trim() || '',
        frequency: this.model.frequency,
        // startDate: optional → default = today in backend (if you want, we can add)
      })
      .subscribe({
        next: (res) => {
          this.isSubmitting = false;
          // Optionally show toast here later
          // Navigate back to habits list
          this.router.navigate(['/app/habits']);
        },
        error: (err) => {
          console.error('CREATE HABIT ERROR', err);
          this.isSubmitting = false;
          this.errorMsg =
            err?.error?.message || 'Failed to create habit. Please try again.';
        },
      });
  }

  onCancel(): void {
    this.router.navigate(['/app/habits']);
  }
}
