// src/app/app-shell/app-shell-routing.module.ts

import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { MainLayoutComponent } from './main-layout/main-layout.component';

// 👇 NEW: import your support component
import { SupportComponent } from '../support/support.component';

const routes: Routes = [
  {
    path: '',
    component: MainLayoutComponent,
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      },
      {
        path: 'dashboard',
        loadChildren: () =>
          import('../dashboard/dashboard.module').then(m => m.DashboardModule)
      },
      {
        path: 'habits',
        loadChildren: () =>
          import('../habits/habits.module').then(m => m.HabitsModule)
      },
      {
        path: 'calendar',
        loadChildren: () =>
          import('../habits/habit-calendar/habit-calendar.module')
            .then(m => m.HabitCalendarModule)
      },
      {
        path: 'stats',
        loadChildren: () =>
          import('../stats/stats.module').then(m => m.StatsModule)
      },
      {
        path: 'profile',
        loadChildren: () =>
          import('../profile/profile.module').then(m => m.ProfileModule)
      },

      // ⭐ AI Coach
      {
        path: 'ai-coach',
        loadChildren: () =>
          import('../ai-coach/ai-coach.module').then(m => m.AiCoachModule)
      },

      // ⭐ NEW: Customer Support route (direct component)
      {
        path: 'support',
        component: SupportComponent
      }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AppShellRoutingModule {}
