import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { HabitApiService } from 'src/app/services/habit-api.service';

interface HabitFormModel {
  id?: string;
  title: string;
  description?: string;
  frequency: 'daily' | 'weekly' | 'custom';
  days: number[];
  timeOfDay?: string;      // "HH:mm"
  reminder: boolean;       // maps to reminderEnabled
}

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

  isEdit = false;
  isSubmitting = false;
  errorMsg = '';

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

  suggestedHabits: HabitSuggestion[] = [];

  constructor(
    private habitApi: HabitApiService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.suggestedHabits = this.allSuggestions.slice(0, 4);
  }

  toggleDay(dayIndex: number): void {
    if (!this.model.days) this.model.days = [];

    if (this.model.days.includes(dayIndex)) {
      this.model.days = this.model.days.filter((d) => d !== dayIndex);
    } else {
      this.model.days = [...this.model.days, dayIndex];
    }
  }

  isDaySelected(dayIndex: number): boolean {
    return this.model.days?.includes(dayIndex) ?? false;
  }

  useSuggestion(suggestion: HabitSuggestion): void {
    this.model.title = suggestion.title;
    this.model.description = suggestion.description;
    this.model.frequency = suggestion.frequency;

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

  // --- Submit to backend ---
  onSubmit(): void {
    this.errorMsg = '';

    const title = this.model.title?.trim();
    if (!title) {
      this.errorMsg = 'Title is required.';
      return;
    }

    // If reminder toggle is ON, time must be selected
    if (this.model.reminder && !this.model.timeOfDay) {
      this.errorMsg = 'Please choose a time for your reminder.';
      return;
    }

    this.isSubmitting = true;

    // Final payload to backend
    const payload: any = {
      title,
      description: this.model.description?.trim() || '',
      frequency: this.model.frequency,

      // 🔥 IMPORTANT: send both fields for backend
      timeOfDay: this.model.timeOfDay || '',
      reminderEnabled: this.model.reminder,
      reminderTime: this.model.reminder ? this.model.timeOfDay : '',

      // (Optional future feature: send days)
    };

    this.habitApi.createHabit(payload).subscribe({
      next: () => {
        this.isSubmitting = false;
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
