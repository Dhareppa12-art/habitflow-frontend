import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { HabitCalendarRoutingModule } from './habit-calendar-routing.module';
import { HabitCalendarComponent } from './habit-calendar.component';

// Angular Material
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@NgModule({
  declarations: [
    HabitCalendarComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    HabitCalendarRoutingModule,

    // Material modules needed for calendar UI
    MatCardModule,
    MatButtonModule,
    MatIconModule
  ]
})
export class HabitCalendarModule {}
