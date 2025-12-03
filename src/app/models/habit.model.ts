export type HabitFrequency = 'daily' | 'weekly' | 'monthly';

export interface Habit {
  id: number;
  title: string;
  description?: string;
  frequency: HabitFrequency;
  timeOfDay?: string;      // HH:MM
  reminderEnabled: boolean;
  createdAt: string;       // ISO date string
  isActive: boolean;
  completedDates?: string[];  // [ '2025-11-27', '2025-11-28' ]
}
